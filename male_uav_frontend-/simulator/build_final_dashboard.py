import os
import shutil

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim"

# 1. Clean extra routes
for r in ["environment", "mission", "faults", "telemetry-stream", "engine"]:
    p = os.path.join(BASE_DIR, "src/app", r)
    if os.path.exists(p):
        shutil.rmtree(p)

def write(path, content):
    with open(os.path.join(BASE_DIR, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# --- FAULT STORE ---
write("src/stores/faultStore.ts", """
import { create } from 'zustand';
export const useFaultStore = create<any>((set) => ({
  activeFaults: [],
  addFault: (f: any) => set((s: any) => ({ activeFaults: [...s.activeFaults, f] })),
  removeFault: (id: string) => set((s: any) => ({ activeFaults: s.activeFaults.filter((f: any) => f.id !== id) })),
  clearFaults: () => set({ activeFaults: [] }),
  setFaults: (data: any) => set(data)
}));
""")

# --- HEALTH STORE ---
write("src/stores/healthStore.ts", """
import { create } from 'zustand';
export const useHealthStore = create<any>((set) => ({
  score: 100, category: 'EXCELLENT', alerts: [],
  setHealth: (data: any) => set(data)
}));
""")

# --- UPDATE SIMULATION LOOP ---
write("src/simulation/SimulationLoop.ts", """
import { useEngineStore } from '../stores/engineStore';
import { useFuelStore } from '../stores/fuelStore';
import { useThermalStore } from '../stores/thermalStore';
import { useElectricalStore } from '../stores/electricalStore';
import { useEnvStore } from '../stores/environmentStore';
import { useFlightStore } from '../stores/flightStore';
import { useMissionStore } from '../stores/missionStore';
import { useVibrationStore } from '../stores/vibrationStore';
import { useTelemetryStore } from '../stores/telemetryStore';
import { useFaultStore } from '../stores/faultStore';
import { useHealthStore } from '../stores/healthStore';

export class SimulationLoop {
  private timer: any = null;
  private timeSum = 0;
  
  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), 100);
  }
  
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
  
  private tick() {
    const dt = 0.1;
    this.timeSum += dt;
    const mission = useMissionStore.getState();
    const env = useEnvStore.getState();
    const flight = useFlightStore.getState();
    const engine = useEngineStore.getState();
    const fuel = useFuelStore.getState();
    const thermal = useThermalStore.getState();
    const elect = useElectricalStore.getState();
    const faults = useFaultStore.getState().activeFaults;

    // FAULT PROPAGATION
    let F = { oilLeak: 0, fuelLeak: 0, turbo: 0, spark: 0, inj: 0, batt: 0, alt: 0, rpmS: 0, chtS: 0, egtS: 0, thr: 0, vib: 0, heat: 0 };
    const newFaults = faults.map((f: any) => {
      let r = 0.005;
      if (f.severity==='MEDIUM') r=0.01; if (f.severity==='HIGH') r=0.03; if (f.severity==='CRITICAL') r=0.1;
      const intens = Math.min(1.0, f.intensity + r * dt);
      if (f.type==='Oil Leak') F.oilLeak = intens;
      if (f.type==='Fuel Leak') F.fuelLeak = intens;
      if (f.type==='Turbo Failure') F.turbo = intens;
      if (f.type==='Spark Plug Failure') F.spark = intens;
      if (f.type==='Injector Failure') F.inj = intens;
      if (f.type==='Battery Failure') F.batt = intens;
      if (f.type==='Alternator Failure') F.alt = intens;
      if (f.type==='RPM Sensor Failure') F.rpmS = intens;
      if (f.type==='CHT Sensor Failure') F.chtS = intens;
      if (f.type==='EGT Sensor Failure') F.egtS = intens;
      if (f.type==='Throttle Failure') F.thr = intens;
      if (f.type==='Excessive Vibration') F.vib = intens;
      if (f.type==='Overheating') F.heat = intens;
      return { ...f, intensity: intens, timeAlive: f.timeAlive + dt };
    });
    useFaultStore.getState().setFaults({ activeFaults: newFaults });

    // Mission Automation
    let tgtThrottle = 0; let tgtSpd = 0; let tgtVS = 0; let tgtRpmLimit = 1200;
    
    if (mission.isActive) {
      useMissionStore.getState().setMission({ timer: mission.timer + dt });
      const p = mission.phase;
      if (p === 'GROUND_IDLE') { tgtThrottle = 7.5; tgtSpd = 0; tgtVS = 0; tgtRpmLimit = 1200; }
      else if (p === 'TAKEOFF') { tgtThrottle = 100; tgtSpd = 120; tgtVS = 3; tgtRpmLimit = 5800; }
      else if (p === 'CLIMB') { tgtThrottle = 85; tgtSpd = 150; tgtVS = 5; tgtRpmLimit = 5500; }
      else if (p === 'CRUISE') { tgtThrottle = 65; tgtSpd = 180; tgtVS = 0; tgtRpmLimit = 4700; }
      else if (p === 'LOITER') { tgtThrottle = 50; tgtSpd = 140; tgtVS = 0; tgtRpmLimit = 4200; }
      else if (p === 'DESCENT') { tgtThrottle = 30; tgtSpd = 160; tgtVS = -4; tgtRpmLimit = 3500; }
      else if (p === 'LANDING') { tgtThrottle = 15; tgtSpd = 100; tgtVS = -2; tgtRpmLimit = 2500; }
    }
    
    if (F.thr > 0) tgtThrottle *= (1 - F.thr);

    // Environment & Flight
    // Pressure auto-calculated from Alt
    const alt = env.altitude;
    const press = 101.3 * Math.exp(-alt / 8500);
    const oat = env.oat;
    const densityAlt = alt + 120 * (oat - (15 - (alt/1000)*2));
    useEnvStore.getState().setEnv({ pressure: press, densityAltitude: densityAlt });
    
    let newAlt = Math.max(0, alt + flight.verticalSpeed * dt);
    if (mission.isActive) useEnvStore.getState().setEnv({ altitude: newAlt }); // Auto climb/descend
    
    useFlightStore.getState().setFlight({
      airspeed: flight.airspeed + (tgtSpd - flight.airspeed) * 0.05,
      verticalSpeed: flight.verticalSpeed + (tgtVS - flight.verticalSpeed) * 0.1,
      heading: (flight.heading + 0.05) % 360
    });

    // Engine
    const pLoss = press / 101.3;
    const isRun = tgtThrottle > 2;
    let maxRpmAlt = 5800 - (alt / 10000) * 900;
    let maxRpm = Math.min(tgtRpmLimit, maxRpmAlt);
    
    let trpm = isRun ? 1000 + (tgtThrottle/100)*(maxRpm-1000) : 0;
    trpm *= (1 - F.turbo * 0.3);
    if (F.spark > 0) trpm -= F.spark * 500 * Math.random();
    
    const nRpm = engine.rpm + (trpm - engine.rpm) * 0.1;
    const nThr = engine.throttle + (tgtThrottle - engine.throttle) * 0.1;
    useEngineStore.getState().setEngine({
      state: isRun ? 'RUNNING' : 'OFF',
      rpm: Math.max(0, nRpm),
      throttle: nThr,
      engineLoad: nThr * 0.8 + (1-pLoss)*20,
      map: (nThr/100) * 45 * pLoss * (1 - F.turbo*0.4) // 0-45 inHg
    });

    // Fuel
    const rRatio = Math.min(1, nRpm / 5800);
    let nFlow = isRun ? (rRatio * 35) + 2 : 0;
    if (F.fuelLeak > 0) nFlow += F.fuelLeak * 20;
    if (F.inj > 0) nFlow *= (1 - F.inj * 0.5);
    
    useFuelStore.getState().setFuel({
      fuelFlow: fuel.fuelFlow + (nFlow - fuel.fuelFlow) * 0.1,
      fuelRemaining: Math.max(0, fuel.fuelRemaining - (fuel.fuelFlow / 3600) * dt)
    });

    // Thermal & Lube
    const cool = Math.max(0.1, 1 - (oat / 100) + (flight.airspeed / 220));
    let tEgt = isRun ? oat + 300 + (rRatio * 550)/cool : oat;
    let tCht = isRun ? oat + 35 + (rRatio * 150)/cool : oat;
    let tOil = isRun ? oat + 25 + (rRatio * 90)/cool : oat;
    let tOp = isRun ? (rRatio * 400) + 200 : 0;
    
    tOp -= (F.oilLeak * 300);
    tOil += (F.oilLeak * 50) + (F.heat * 100);
    tCht += (F.heat * 80);
    tEgt += (F.turbo * 150) + (F.spark * 100) + (F.heat * 150);

    useThermalStore.getState().setThermal({
      egt: thermal.egt + (tEgt - thermal.egt) * 0.05,
      cht: thermal.cht + (tCht - thermal.cht) * 0.01,
      oilTemp: thermal.oilTemp + (tOil - thermal.oilTemp) * 0.005,
      oilPressure: Math.max(0, thermal.oilPressure + (tOp - thermal.oilPressure) * 0.1)
    });

    // Electrical
    let tAltV = isRun ? 28.5 : 0;
    tAltV -= (F.alt * 10);
    let tBat = tAltV > 25 ? 28 : 24;
    tBat -= (F.batt * 10);
    
    useElectricalStore.getState().setElectrical({
      alternatorVoltage: elect.alternatorVoltage + (tAltV - elect.alternatorVoltage)*0.1,
      batteryVoltage: elect.batteryVoltage + (tBat - elect.batteryVoltage)*0.01
    });

    // Vibration
    let baseV = isRun ? 0.2 + rRatio * 0.6 : 0;
    baseV += F.vib * 7;
    if (F.spark > 0) baseV += F.spark * 2;
    useVibrationStore.getState().setVibration({
      vibrationX: baseV * 0.5 + Math.random()*0.1,
      vibrationY: baseV * 0.6 + Math.random()*0.1,
      vibrationZ: baseV * 1.0 + Math.random()*0.2
    });

    // SENSOR FAILURES (Overrides)
    let dRpm = useEngineStore.getState().rpm;
    let dCht = useThermalStore.getState().cht;
    let dEgt = useThermalStore.getState().egt;
    if (F.rpmS > 0.5) dRpm = Math.sin(this.timeSum*10) > 0 ? 0 : dRpm + Math.random()*1000;
    if (F.chtS > 0.5) dCht = 0;
    if (F.egtS > 0.5) dEgt += (Math.random()-0.5)*400;

    // HEALTH & ALERTS
    let health = 100;
    let alerts: string[] = [];
    if (tOp < 100 && isRun) { health -= 30; alerts.push('LOW OIL PRESSURE'); }
    if (tEgt > 850) { health -= 20; alerts.push('HIGH EGT'); }
    if (tCht > 200 || tOil > 120) { health -= 25; alerts.push('OVERHEATING'); }
    if (baseV > 1.5) { health -= 20; alerts.push('HIGH VIBRATION'); }
    if (fuel.fuelRemaining < 20) { health -= 5; alerts.push('FUEL LOW'); }
    
    newFaults.forEach((f: any) => { health -= (f.intensity * 15); });
    health = Math.max(0, Math.floor(health));
    let cat = 'EXCELLENT';
    if (health < 90) cat = 'HEALTHY';
    if (health < 70) cat = 'WARNING';
    if (health < 50) cat = 'CRITICAL';
    if (health < 30) cat = 'FAILURE IMMINENT';
    
    useHealthStore.getState().setHealth({ score: health, category: cat, alerts });

    // GENERATE FADEC TELEMETRY
    const packet = {
      timestamp: Date.now(),
      mission: mission.phase,
      rpm: Math.floor(dRpm),
      egt: Math.floor(dEgt),
      cht: Math.floor(dCht),
      oilTemp: Math.floor(useThermalStore.getState().oilTemp),
      oilPressure: Math.floor(useThermalStore.getState().oilPressure),
      fuelFlow: Number(useFuelStore.getState().fuelFlow.toFixed(1)),
      fuelRemaining: Number(useFuelStore.getState().fuelRemaining.toFixed(1)),
      batteryVoltage: Number(useElectricalStore.getState().batteryVoltage.toFixed(1)),
      alternatorVoltage: Number(useElectricalStore.getState().alternatorVoltage.toFixed(1)),
      altitude: Math.floor(useEnvStore.getState().altitude),
      airspeed: Math.floor(useFlightStore.getState().airspeed),
      wind: useEnvStore.getState().windSpeed,
      health: health,
      faults: newFaults.length
    };

    const ts = useTelemetryStore.getState();
    useTelemetryStore.getState().setTelemetry({ packet, packetCount: ts.packetCount + 1 });
  }
}
export const simulation = new SimulationLoop();
""")

# --- ROOT LAYOUT (Terminal aesthetic) ---
write("src/app/layout.tsx", """
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen w-screen bg-black text-green-500 font-mono overflow-hidden">
        {children}
      </body>
    </html>
  );
}
""")

# --- MAIN DASHBOARD PAGE ---
write("src/app/page.tsx", """
"use client";
import { useEffect, useState } from 'react';
import { useEngineStore } from '@/stores/engineStore';
import { useFuelStore } from '@/stores/fuelStore';
import { useThermalStore } from '@/stores/thermalStore';
import { useElectricalStore } from '@/stores/electricalStore';
import { useEnvStore } from '@/stores/environmentStore';
import { useFlightStore } from '@/stores/flightStore';
import { useMissionStore } from '@/stores/missionStore';
import { useTelemetryStore } from '@/stores/telemetryStore';
import { useFaultStore } from '@/stores/faultStore';
import { useHealthStore } from '@/stores/healthStore';
import { simulation } from '@/simulation/SimulationLoop';

export default function GroundControlStation() {
  const engine = useEngineStore(); const fuel = useFuelStore(); const therm = useThermalStore(); 
  const elec = useElectricalStore(); const env = useEnvStore(); const flight = useFlightStore(); 
  const mission = useMissionStore(); const tel = useTelemetryStore(); 
  const faultStore = useFaultStore(); const health = useHealthStore();

  const [fType, setFType] = useState('Oil Leak');
  const [fSev, setFSev] = useState('MEDIUM');
  
  useEffect(() => { simulation.start(); }, []);

  const Panel = ({ title, children, cClass = '' }: any) => (
    <div className={`border border-blue-900 bg-gray-950 p-3 flex flex-col ${cClass}`}>
      <div className="text-blue-500 font-bold border-b border-blue-900 mb-2 pb-1 uppercase text-xs">{title}</div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );

  const Val = ({ l, v, u, warn=false, crit=false }: any) => (
    <div className="flex justify-between text-xs py-0.5">
      <span className="text-gray-400">{l}</span>
      <span className={crit ? 'text-red-500 font-bold' : warn ? 'text-amber-500 font-bold' : 'text-green-400 font-bold'}>
        {typeof v === 'number' ? v.toFixed(1) : v} {u && <span className="text-gray-600 font-normal">{u}</span>}
      </span>
    </div>
  );

  return (
    <div className="h-full w-full flex flex-col p-2 space-y-2">
      {/* HEADER */}
      <div className="flex justify-between border border-blue-900 bg-gray-950 p-2 shrink-0">
        <div className="text-blue-400 font-bold tracking-widest uppercase">MALE UAV Ground Control Station</div>
        <div className="text-gray-500 text-xs">AERO PISTON TELEMETRY LINK: <span className="text-green-500 animate-pulse">ACTIVE</span></div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-2 min-h-0">
        
        {/* LEFT SIDEBAR: INPUTS */}
        <div className="col-span-3 flex flex-col gap-2 min-h-0">
          <Panel title="Mission Control">
             <div className="grid grid-cols-2 gap-1 mb-2">
               {['GROUND_IDLE', 'TAKEOFF', 'CLIMB', 'CRUISE', 'LOITER', 'DESCENT', 'LANDING'].map(p => (
                 <button key={p} onClick={()=>mission.setMission({phase: p})} className={`text-[10px] p-1 border ${mission.phase === p ? 'border-green-500 text-green-500 bg-green-900/30' : 'border-gray-800 text-gray-500'}`}>{p}</button>
               ))}
             </div>
             <div className="flex space-x-1 mt-2">
               <button onClick={()=>mission.setMission({isActive:true})} className="flex-1 bg-green-900 text-green-400 text-xs py-1">START</button>
               <button onClick={()=>mission.setMission({isActive:false})} className="flex-1 bg-amber-900 text-amber-400 text-xs py-1">PAUSE</button>
               <button onClick={()=>mission.setMission({isActive:false, timer:0, phase:'GROUND_IDLE'})} className="flex-1 bg-red-900 text-red-400 text-xs py-1">STOP</button>
             </div>
          </Panel>

          <Panel title="Environment Controls">
             <div className="space-y-2 text-xs">
               <div><label className="text-gray-500 flex justify-between">Altitude (m) <span>{env.altitude.toFixed(0)}</span></label>
               <input type="range" min="0" max="10000" value={env.altitude} onChange={e=>env.setEnv({altitude: +e.target.value})} className="w-full" disabled={mission.isActive}/></div>
               <div><label className="text-gray-500 flex justify-between">OAT (°C) <span>{env.oat.toFixed(1)}</span></label>
               <input type="range" min="-30" max="55" value={env.oat} onChange={e=>env.setEnv({oat: +e.target.value})} className="w-full" disabled={mission.isActive}/></div>
               <div><label className="text-gray-500 flex justify-between">Humidity (%) <span>{env.humidity.toFixed(0)}</span></label>
               <input type="range" min="0" max="100" value={env.humidity} onChange={e=>env.setEnv({humidity: +e.target.value})} className="w-full"/></div>
               <div><label className="text-gray-500 flex justify-between">Wind (km/h) <span>{env.windSpeed.toFixed(0)}</span></label>
               <input type="range" min="0" max="80" value={env.windSpeed} onChange={e=>env.setEnv({windSpeed: +e.target.value})} className="w-full"/></div>
             </div>
          </Panel>

          <Panel title="Fault Injection">
             <select value={fType} onChange={e=>setFType(e.target.value)} className="w-full bg-black border border-gray-800 text-xs text-white p-1 mb-1">
               {['Oil Leak', 'Fuel Leak', 'Oil Pressure Loss', 'Spark Plug Failure', 'Injector Failure', 'Turbo Failure', 'Battery Failure', 'Alternator Failure', 'RPM Sensor Failure', 'CHT Sensor Failure', 'EGT Sensor Failure', 'Throttle Failure', 'Excessive Vibration', 'Overheating'].map(f=><option key={f}>{f}</option>)}
             </select>
             <select value={fSev} onChange={e=>setFSev(e.target.value)} className="w-full bg-black border border-gray-800 text-xs text-white p-1 mb-2">
               <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
             </select>
             <div className="flex space-x-1">
               <button onClick={()=>faultStore.addFault({id: Math.random().toString(), type: fType, severity: fSev, intensity: 0.01, timeAlive: 0})} className="flex-1 bg-red-900/50 text-red-500 border border-red-900 text-xs py-1">INJECT</button>
               <button onClick={faultStore.clearFaults} className="flex-1 bg-gray-900 text-gray-400 border border-gray-800 text-xs py-1">CLEAR</button>
             </div>
          </Panel>
        </div>

        {/* CENTER ENGINE PANEL */}
        <div className="col-span-6 flex flex-col gap-2 min-h-0">
          <Panel title="Primary Engine Telemetry">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              <Val l="RPM" v={engine.rpm} u="RPM" />
              <Val l="EGT" v={therm.egt} u="°C" warn={therm.egt>800} crit={therm.egt>850}/>
              <Val l="CHT" v={therm.cht} u="°C" warn={therm.cht>180} crit={therm.cht>220}/>
              <Val l="Oil Temp" v={therm.oilTemp} u="°C" warn={therm.oilTemp>110} crit={therm.oilTemp>130}/>
              <Val l="Oil Pressure" v={therm.oilPressure} u="kPa" warn={therm.oilPressure<250} crit={therm.oilPressure<150}/>
              <Val l="Fuel Flow" v={fuel.fuelFlow} u="L/hr" />
              <Val l="MAP" v={engine.map} u="inHg" />
              <Val l="Battery" v={elec.batteryVoltage} u="V" warn={elec.batteryVoltage<25} crit={elec.batteryVoltage<23}/>
              <Val l="Alternator" v={elec.alternatorVoltage} u="V" />
              <Val l="Fuel Remaining" v={fuel.fuelRemaining} u="L" warn={fuel.fuelRemaining<40} crit={fuel.fuelRemaining<20}/>
            </div>
          </Panel>

          <Panel title="Flight Data & Environment">
             <div className="grid grid-cols-2 gap-x-8 gap-y-1">
               <Val l="Altitude" v={env.altitude} u="m" />
               <Val l="Density Altitude" v={env.densityAltitude} u="m" />
               <Val l="Airspeed" v={flight.airspeed} u="km/h" />
               <Val l="Ground Speed" v={flight.airspeed - env.windSpeed} u="km/h" />
               <Val l="Vertical Speed" v={flight.verticalSpeed} u="m/s" />
               <Val l="Heading" v={flight.heading} u="°" />
               <Val l="OAT" v={env.oat} u="°C" />
               <Val l="Pressure" v={env.pressure} u="kPa" />
             </div>
          </Panel>
        </div>

        {/* RIGHT STATUS PANEL */}
        <div className="col-span-3 flex flex-col gap-2 min-h-0">
          <Panel title="Mission Status">
            <Val l="Current Mission" v={mission.phase} u="" />
            <Val l="Mission Time" v={mission.timer/60} u="min" />
            <Val l="Engine State" v={engine.state} u="" />
          </Panel>
          <Panel title="Engine Health">
            <div className="text-center my-2">
              <div className={`text-3xl font-black ${health.score < 50 ? 'text-red-500' : health.score < 70 ? 'text-amber-500' : 'text-green-500'}`}>{health.score}%</div>
              <div className={`text-xs mt-1 ${health.score < 50 ? 'text-red-500' : health.score < 70 ? 'text-amber-500' : 'text-green-500'}`}>{health.category}</div>
            </div>
            {health.alerts.length > 0 && (
              <div className="mt-2 space-y-1">
                {health.alerts.map((a: string)=><div key={a} className="bg-red-900/30 border border-red-900 text-red-500 text-[10px] p-1 animate-pulse">{a}</div>)}
              </div>
            )}
          </Panel>
          <Panel title="Active Faults" cClass="flex-1">
             {faultStore.activeFaults.map((f: any) => (
               <div key={f.id} className="border border-red-900 bg-red-950/20 p-1 mb-1 text-[10px]">
                 <div className="flex justify-between text-red-500 font-bold"><span>{f.type}</span><button onClick={()=>faultStore.removeFault(f.id)} className="text-gray-500 hover:text-white px-1">X</button></div>
                 <div className="flex justify-between text-gray-400"><span>{f.severity}</span><span>{(f.intensity*100).toFixed(0)}% | {f.timeAlive.toFixed(1)}s</span></div>
               </div>
             ))}
             {faultStore.activeFaults.length === 0 && <div className="text-gray-600 text-[10px]">No active faults.</div>}
          </Panel>
        </div>

      </div>

      {/* BOTTOM TELEMETRY PANEL */}
      <Panel title={`FADEC TELEMETRY STREAM // 10 HZ // PACKETS TX: ${tel.packetCount}`} cClass="h-48 shrink-0">
        <pre className="text-[10px] text-green-500">
          {tel.packet ? JSON.stringify(tel.packet) : 'AWAITING LINK...'}
        </pre>
      </Panel>
    </div>
  );
}
""")
print("Final Integrated Single Screen Dashboard generated.")
