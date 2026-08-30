import os
import shutil

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim"
SRC_DIR = os.path.join(BASE_DIR, "src")

# 1. Clean slate
if os.path.exists(SRC_DIR):
    shutil.rmtree(SRC_DIR)

folders = [
    "src/app/environment",
    "src/app/mission",
    "src/app/telemetry",
    "src/simulation/engine",
    "src/simulation/fuel",
    "src/simulation/thermal",
    "src/simulation/electrical",
    "src/simulation/environment",
    "src/simulation/flight",
    "src/simulation/vibration",
    "src/simulation/sensors",
    "src/simulation/ecu",
    "src/simulation/telemetry",
    "src/stores",
    "src/components"
]
for f in folders:
    os.makedirs(os.path.join(BASE_DIR, f), exist_ok=True)

def write(path, content):
    with open(os.path.join(BASE_DIR, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# --- STORES ---
write("src/stores/engineStore.ts", """
import { create } from 'zustand';
export const useEngineStore = create<any>((set) => ({
  state: 'OFF', rpm: 0, throttle: 0, engineLoad: 0, torque: 0, power: 0,
  setEngine: (data: any) => set(data)
}));
""")

write("src/stores/fuelStore.ts", """
import { create } from 'zustand';
export const useFuelStore = create<any>((set) => ({
  fuelFlow: 0, fuelPressure: 0, fuelRemaining: 150, fuelTankCapacity: 150,
  setFuel: (data: any) => set(data)
}));
""")

write("src/stores/thermalStore.ts", """
import { create } from 'zustand';
export const useThermalStore = create<any>((set) => ({
  cht: 25, egt: 25, oilTemp: 25, oilPressure: 0,
  setThermal: (data: any) => set(data)
}));
""")

write("src/stores/electricalStore.ts", """
import { create } from 'zustand';
export const useElectricalStore = create<any>((set) => ({
  batteryVoltage: 24, alternatorVoltage: 0, currentDraw: 0,
  setElectrical: (data: any) => set(data)
}));
""")

write("src/stores/environmentStore.ts", """
import { create } from 'zustand';
export const useEnvStore = create<any>((set) => ({
  altitude: 0, oat: 15, humidity: 45, pressure: 101, windSpeed: 0, windDirection: 0,
  setEnv: (data: any) => set(data)
}));
""")

write("src/stores/flightStore.ts", """
import { create } from 'zustand';
export const useFlightStore = create<any>((set) => ({
  airspeed: 0, groundSpeed: 0, verticalSpeed: 0, heading: 0, pitch: 0, roll: 0, yaw: 0,
  setFlight: (data: any) => set(data)
}));
""")

write("src/stores/vibrationStore.ts", """
import { create } from 'zustand';
export const useVibrationStore = create<any>((set) => ({
  vibrationX: 0, vibrationY: 0, vibrationZ: 0,
  setVibration: (data: any) => set(data)
}));
""")

write("src/stores/missionStore.ts", """
import { create } from 'zustand';
export const useMissionStore = create<any>((set) => ({
  phase: 'GROUND_IDLE', isActive: false, timer: 0,
  setMission: (data: any) => set(data)
}));
""")

write("src/stores/telemetryStore.ts", """
import { create } from 'zustand';
export const useTelemetryStore = create<any>((set) => ({
  packet: null, packetCount: 0,
  setTelemetry: (data: any) => set(data)
}));
""")

# --- SIMULATORS ---
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

export class SimulationLoop {
  private timer: any = null;
  
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
    const mission = useMissionStore.getState();
    const env = useEnvStore.getState();
    const flight = useFlightStore.getState();
    const engine = useEngineStore.getState();
    const fuel = useFuelStore.getState();
    const thermal = useThermalStore.getState();
    const elect = useElectricalStore.getState();
    const vib = useVibrationStore.getState();

    // 1. Mission Logic
    let tgtThrottle = 0;
    let tgtSpd = 0, tgtVS = 0;
    
    if (mission.isActive) {
      useMissionStore.getState().setMission({ timer: mission.timer + dt });
      const p = mission.phase;
      if (p === 'GROUND_IDLE') { tgtThrottle = 7.5; tgtSpd = 0; tgtVS = 0; }
      else if (p === 'TAKEOFF') { tgtThrottle = 100; tgtSpd = 120; tgtVS = 3; }
      else if (p === 'CLIMB') { tgtThrottle = 85; tgtSpd = 150; tgtVS = 5; }
      else if (p === 'CRUISE') { tgtThrottle = 65; tgtSpd = 200; tgtVS = 0; }
      else if (p === 'LOITER') { tgtThrottle = 50; tgtSpd = 140; tgtVS = 0; }
      else if (p === 'DESCENT') { tgtThrottle = 30; tgtSpd = 160; tgtVS = -4; }
      else if (p === 'LANDING') { tgtThrottle = 15; tgtSpd = 80; tgtVS = -2; }
    } else {
      tgtThrottle = 0;
    }

    // 2. Flight & Env
    let newAlt = Math.max(0, env.altitude + flight.verticalSpeed * dt);
    useEnvStore.getState().setEnv({ 
      altitude: newAlt,
      oat: 15 - (newAlt / 1000) * 6.5,
      pressure: 101.3 * Math.exp(-newAlt / 8500)
    });
    useFlightStore.getState().setFlight({
      airspeed: flight.airspeed + (tgtSpd - flight.airspeed) * 0.05,
      verticalSpeed: flight.verticalSpeed + (tgtVS - flight.verticalSpeed) * 0.1
    });

    // 3. Engine
    const pLoss = useEnvStore.getState().pressure / 101.3;
    const isRun = tgtThrottle > 2;
    let maxRpm = 6000 * pLoss;
    let trpm = isRun ? 1000 + (tgtThrottle/100)*(maxRpm-1000) : 0;
    const nRpm = engine.rpm + (trpm - engine.rpm) * 0.1;
    const nThr = engine.throttle + (tgtThrottle - engine.throttle) * 0.1;
    useEngineStore.getState().setEngine({
      state: isRun ? 'RUNNING' : 'OFF',
      rpm: Math.max(0, nRpm),
      throttle: nThr,
      power: (nRpm / 6000) * 100 * pLoss
    });

    // 4. Fuel
    const rRatio = Math.min(1, nRpm / 6000);
    const nFlow = isRun ? (rRatio * 38) + 2 : 0;
    const nPress = isRun ? 4.5 : 0;
    useFuelStore.getState().setFuel({
      fuelFlow: fuel.fuelFlow + (nFlow - fuel.fuelFlow) * 0.1,
      fuelPressure: fuel.fuelPressure + (nPress - fuel.fuelPressure) * 0.2,
      fuelRemaining: Math.max(0, fuel.fuelRemaining - (fuel.fuelFlow / 3600) * dt)
    });

    // 5. Thermal & Lube
    const cool = Math.max(0.1, 1 - (useEnvStore.getState().oat / 100) + (flight.airspeed / 300));
    const oat = useEnvStore.getState().oat;
    const tEgt = isRun ? oat + (rRatio * 850)/cool : oat;
    const tCht = isRun ? oat + (rRatio * 180)/cool : oat;
    const tOil = isRun ? oat + (rRatio * 110)/cool : oat;
    const tOp = isRun ? (rRatio * 500) + 100 : 0;

    useThermalStore.getState().setThermal({
      egt: thermal.egt + (tEgt - thermal.egt) * 0.05,
      cht: thermal.cht + (tCht - thermal.cht) * 0.01,
      oilTemp: thermal.oilTemp + (tOil - thermal.oilTemp) * 0.005,
      oilPressure: Math.max(0, thermal.oilPressure + (tOp - thermal.oilPressure) * 0.1)
    });

    // 6. Electrical
    const tAlt = isRun ? 28.5 : 0;
    const tBat = tAlt > 25 ? 28 : 24;
    useElectricalStore.getState().setElectrical({
      alternatorVoltage: elect.alternatorVoltage + (tAlt - elect.alternatorVoltage)*0.1,
      batteryVoltage: elect.batteryVoltage + (tBat - elect.batteryVoltage)*0.01,
      currentDraw: isRun ? 25 + Math.random()*5 : 0
    });

    // 7. Vibration
    const baseV = isRun ? 0.2 + rRatio * 0.8 : 0;
    useVibrationStore.getState().setVibration({
      vibrationX: baseV * 0.5 + Math.random()*0.1,
      vibrationY: baseV * 0.6 + Math.random()*0.1,
      vibrationZ: baseV * 1.0 + Math.random()*0.2
    });

    // 8. Generate Telemetry Packet
    const packet = {
      timestamp: Date.now(),
      rpm: useEngineStore.getState().rpm,
      throttle: useEngineStore.getState().throttle,
      fuelFlow: useFuelStore.getState().fuelFlow,
      fuelPressure: useFuelStore.getState().fuelPressure,
      cht: useThermalStore.getState().cht,
      egt: useThermalStore.getState().egt,
      oilTemp: useThermalStore.getState().oilTemp,
      oilPressure: useThermalStore.getState().oilPressure,
      batteryVoltage: useElectricalStore.getState().batteryVoltage,
      alternatorVoltage: useElectricalStore.getState().alternatorVoltage,
      altitude: useEnvStore.getState().altitude,
      airspeed: useFlightStore.getState().airspeed,
      verticalSpeed: useFlightStore.getState().verticalSpeed,
      pitch: useFlightStore.getState().pitch,
      roll: useFlightStore.getState().roll,
      yaw: useFlightStore.getState().yaw,
      windSpeed: useEnvStore.getState().windSpeed,
      windDirection: useEnvStore.getState().windDirection,
      vibrationX: useVibrationStore.getState().vibrationX,
      vibrationY: useVibrationStore.getState().vibrationY,
      vibrationZ: useVibrationStore.getState().vibrationZ
    };

    const ts = useTelemetryStore.getState();
    useTelemetryStore.getState().setTelemetry({ packet, packetCount: ts.packetCount + 1 });
  }
}
export const simulation = new SimulationLoop();
""")

# --- STYLES ---
write("src/app/globals.css", """
@import "tailwindcss";
body { background: #000; color: #0f0; font-family: monospace; }
""")

write("src/app/layout.tsx", """
import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <nav className="p-4 border-b border-green-900 flex space-x-6 bg-gray-900">
          <div className="font-bold text-white mr-8">UAV ECU EMULATOR</div>
          <Link href="/" className="hover:text-white">Engine</Link>
          <Link href="/environment" className="hover:text-white">Environment</Link>
          <Link href="/mission" className="hover:text-white">Mission</Link>
          <Link href="/telemetry" className="hover:text-white">Telemetry Stream</Link>
        </nav>
        <main className="flex-1 p-6">{children}</main>
      </body>
    </html>
  );
}
""")

# --- ENGINE PAGE ---
write("src/app/page.tsx", """
"use client";
import { useEffect } from 'react';
import { useEngineStore } from '@/stores/engineStore';
import { useFuelStore } from '@/stores/fuelStore';
import { useThermalStore } from '@/stores/thermalStore';
import { useElectricalStore } from '@/stores/electricalStore';
import { simulation } from '@/simulation/SimulationLoop';

const Row = ({ l, v, u }: any) => <div className="flex justify-between py-1 border-b border-gray-800 text-sm"><span>{l}</span><span>{typeof v === 'number' ? v.toFixed(2) : v} <span className="text-gray-600">{u}</span></span></div>;

export default function EnginePage() {
  const engine = useEngineStore(); const fuel = useFuelStore(); const therm = useThermalStore(); const elec = useElectricalStore();
  
  useEffect(() => { simulation.start(); }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-xl font-bold text-white border-b border-green-500 pb-2">Aero Piston Engine State</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-gray-500 mb-2">CORE & FUEL</h2>
          <Row l="Engine State" v={engine.state} u="" />
          <Row l="RPM" v={engine.rpm} u="RPM" />
          <Row l="Throttle" v={engine.throttle} u="%" />
          <Row l="Fuel Flow" v={fuel.fuelFlow} u="L/hr" />
          <Row l="Fuel Remaining" v={fuel.fuelRemaining} u="L" />
        </div>
        <div>
          <h2 className="text-gray-500 mb-2">THERMAL & ELEC</h2>
          <Row l="CHT" v={therm.cht} u="°C" />
          <Row l="EGT" v={therm.egt} u="°C" />
          <Row l="Oil Temp" v={therm.oilTemp} u="°C" />
          <Row l="Oil Pressure" v={therm.oilPressure} u="kPa" />
          <Row l="Battery Voltage" v={elec.batteryVoltage} u="V" />
        </div>
      </div>
    </div>
  );
}
""")

# --- ENV PAGE ---
write("src/app/environment/page.tsx", """
"use client";
import { useEnvStore } from '@/stores/environmentStore';
import { useFlightStore } from '@/stores/flightStore';

const Row = ({ l, v, u }: any) => <div className="flex justify-between py-1 border-b border-gray-800 text-sm"><span>{l}</span><span>{typeof v === 'number' ? v.toFixed(2) : v} <span className="text-gray-600">{u}</span></span></div>;

export default function EnvPage() {
  const env = useEnvStore(); const flight = useFlightStore();
  
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white border-b border-green-500 pb-2">Flight & Environment</h1>
      <Row l="Altitude" v={env.altitude} u="m" />
      <Row l="Airspeed" v={flight.airspeed} u="km/h" />
      <Row l="Vertical Speed" v={flight.verticalSpeed} u="m/s" />
      <Row l="OAT" v={env.oat} u="°C" />
      <Row l="Pressure" v={env.pressure} u="kPa" />
      <Row l="Humidity" v={env.humidity} u="%" />
      <Row l="Wind Speed" v={env.windSpeed} u="km/h" />
      <Row l="Wind Direction" v={env.windDirection} u="°" />
    </div>
  );
}
""")

# --- MISSION PAGE ---
write("src/app/mission/page.tsx", """
"use client";
import { useMissionStore } from '@/stores/missionStore';

export default function MissionPage() {
  const { phase, isActive, timer, setMission } = useMissionStore();
  const phases = ['GROUND_IDLE', 'TAKEOFF', 'CLIMB', 'CRUISE', 'LOITER', 'DESCENT', 'LANDING'];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white border-b border-green-500 pb-2">Mission Automation</h1>
      
      <div className="flex space-x-4 mb-4">
         <button onClick={()=>setMission({isActive: true})} disabled={isActive} className="px-4 py-2 bg-green-900 text-white disabled:opacity-50">Start Mission</button>
         <button onClick={()=>setMission({isActive: false})} disabled={!isActive} className="px-4 py-2 bg-yellow-900 text-white disabled:opacity-50">Pause Mission</button>
         <button onClick={()=>setMission({isActive: false, timer: 0, phase: 'GROUND_IDLE'})} className="px-4 py-2 bg-red-900 text-white">Stop Mission</button>
      </div>
      
      <div className="p-4 bg-gray-900 text-center mb-6">
        <div className="text-gray-500">Mission Timer</div>
        <div className="text-3xl text-white">{(timer/60).toFixed(2)} min</div>
        <div className="text-green-500 mt-2 font-bold">{isActive ? 'ACTIVE' : 'STANDBY'}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {phases.map(p => (
          <button key={p} onClick={()=>setMission({phase: p})} className={`p-2 border text-left ${phase === p ? 'border-green-500 bg-green-900/40 text-white' : 'border-gray-800 text-gray-500 hover:text-white'}`}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
""")

# --- TELEMETRY PAGE ---
write("src/app/telemetry/page.tsx", """
"use client";
import { useTelemetryStore } from '@/stores/telemetryStore';

export default function TelemetryPage() {
  const { packet, packetCount } = useTelemetryStore();
  
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex justify-between items-end border-b border-green-500 pb-2">
        <h1 className="text-xl font-bold text-white">ECU / FADEC Telemetry</h1>
        <div className="text-right text-xs">
          <div className="text-gray-500">Update Rate: 10Hz (100ms)</div>
          <div className="text-green-500">Packets TX: {packetCount}</div>
        </div>
      </div>
      
      <div className="bg-gray-900 p-4 border border-gray-800 rounded">
        <pre className="text-[10px] text-green-400 overflow-x-auto">
          {packet ? JSON.stringify(packet, null, 2) : 'AWAITING TELEMETRY STREAM...'}
        </pre>
      </div>
    </div>
  );
}
""")

print("Phase 1 Simulator Rebuilt.")
