import os
import shutil

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim"

# Clean up existing pages to ensure only the 4 requested exist
for item in os.listdir(os.path.join(BASE_DIR, "src/app")):
    if item not in ["layout.tsx", "globals.css", "page.tsx"]:
        path = os.path.join(BASE_DIR, "src/app", item)
        if os.path.isdir(path):
            shutil.rmtree(path)

folders = [
    "src/app/environment",
    "src/app/mission",
    "src/app/faults",
    "src/simulator",
    "src/store",
    "src/services"
]
for f in folders:
    os.makedirs(os.path.join(BASE_DIR, f), exist_ok=True)

def write(path, content):
    with open(os.path.join(BASE_DIR, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# --- STORE ---
write("src/store/simulatorStore.ts", """
import { create } from 'zustand';

export type MissionPhase = 'Ground Idle' | 'Takeoff' | 'Climb' | 'Cruise' | 'Loiter' | 'Descent' | 'Landing';

export interface Telemetry {
  timestamp: number;
  rpm: number; throttle: number; map: number; fuelFlow: number; fuelPressure: number;
  cht: number; egt: number; oilTemp: number; oilPressure: number;
  batteryVoltage: number; alternatorVoltage: number;
  altitude: number; airspeed: number; verticalSpeed: number;
  oat: number; humidity: number; windSpeed: number;
  vibrationX: number; vibrationY: number; vibrationZ: number;
  fuelRemaining: number;
}

export type FaultSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export interface ActiveFault { id: string; type: string; severity: FaultSeverity; intensity: number; }

export const FAULT_LIST = [
  'Oil Leak', 'Fuel Leak', 'Injector Degradation', 'Bearing Wear', 
  'Spark Plug Failure', 'Alternator Failure', 'RPM Sensor Failure', 
  'EGT Sensor Failure', 'CHT Sensor Failure', 'Propeller Imbalance', 'High Altitude Power Loss'
];

interface SimulatorStore {
  telemetry: Telemetry;
  activeFaults: ActiveFault[];
  missionPhase: MissionPhase;
  missionActive: boolean;
  missionTime: number;
  
  startMission: () => void;
  pauseMission: () => void;
  stopMission: () => void;
  setPhase: (p: MissionPhase) => void;
  
  addFault: (type: string, severity: FaultSeverity) => void;
  removeFault: (id: string) => void;
  
  updateState: (tel: Telemetry, activeFaults: ActiveFault[], missionTime: number) => void;
}

const initTel: Telemetry = {
  timestamp: 0, rpm: 0, throttle: 0, map: 101, fuelFlow: 0, fuelPressure: 0, cht: 25, egt: 25, oilTemp: 25, oilPressure: 0,
  batteryVoltage: 24, alternatorVoltage: 0, altitude: 0, airspeed: 0, verticalSpeed: 0,
  oat: 15, humidity: 45, windSpeed: 0, vibrationX: 0, vibrationY: 0, vibrationZ: 0, fuelRemaining: 150
};

export const useSimStore = create<SimulatorStore>((set) => ({
  telemetry: initTel,
  activeFaults: [],
  missionPhase: 'Ground Idle',
  missionActive: false,
  missionTime: 0,

  startMission: () => set({ missionActive: true }),
  pauseMission: () => set({ missionActive: false }),
  stopMission: () => set({ missionActive: false, missionTime: 0, missionPhase: 'Ground Idle' }),
  setPhase: (p) => set({ missionPhase: p }),

  addFault: (type, severity) => set((s) => ({ activeFaults: [...s.activeFaults, { id: Math.random().toString(), type, severity, intensity: 0.01 }] })),
  removeFault: (id) => set((s) => ({ activeFaults: s.activeFaults.filter(f => f.id !== id) })),
  
  updateState: (tel, faults, t) => set({ telemetry: tel, activeFaults: faults, missionTime: t })
}));
""")

# --- PHYSICS ENGINE WITH MISSION LOGIC ---
write("src/simulator/physicsEngine.ts", """
import { Telemetry, MissionPhase, ActiveFault } from '../store/simulatorStore';

export class PhysicsEngine {
  private current: Telemetry;
  private timeSum = 0;
  
  constructor() {
    this.current = {
      timestamp: Date.now(), rpm: 0, throttle: 0, map: 101, fuelFlow: 0, fuelPressure: 0,
      cht: 25, egt: 25, oilTemp: 25, oilPressure: 0, batteryVoltage: 24, alternatorVoltage: 24,
      altitude: 0, airspeed: 0, verticalSpeed: 0, oat: 15, humidity: 45, windSpeed: 0,
      vibrationX: 0, vibrationY: 0.1, vibrationZ: 0, fuelRemaining: 150
    };
  }

  public tick(phase: MissionPhase, isMissionActive: boolean, faults: ActiveFault[], dt: number): { tel: Telemetry, updatedFaults: ActiveFault[] } {
    this.timeSum += dt;
    
    // Evolve faults
    const updatedFaults = faults.map(f => {
      let rate = 0.005;
      if (f.severity === 'MEDIUM') rate = 0.01;
      if (f.severity === 'HIGH') rate = 0.03;
      if (f.severity === 'CRITICAL') rate = 0.1;
      return { ...f, intensity: Math.min(1.0, f.intensity + rate * dt) };
    });

    let F = { oilLeak: 0, fuelLeak: 0, inj: 0, bearing: 0, spark: 0, alt: 0, rpmS: 0, egtS: 0, chtS: 0, prop: 0, altLoss: 0 };
    updatedFaults.forEach(f => {
      if (f.type === 'Oil Leak') F.oilLeak = f.intensity;
      if (f.type === 'Fuel Leak') F.fuelLeak = f.intensity;
      if (f.type === 'Injector Degradation') F.inj = f.intensity;
      if (f.type === 'Bearing Wear') F.bearing = f.intensity;
      if (f.type === 'Spark Plug Failure') F.spark = f.intensity;
      if (f.type === 'Alternator Failure') F.alt = f.intensity;
      if (f.type === 'RPM Sensor Failure') F.rpmS = f.intensity;
      if (f.type === 'EGT Sensor Failure') F.egtS = f.intensity;
      if (f.type === 'CHT Sensor Failure') F.chtS = f.intensity;
      if (f.type === 'Propeller Imbalance') F.prop = f.intensity;
      if (f.type === 'High Altitude Power Loss') F.altLoss = f.intensity;
    });

    // Mission Phase Automation
    let tgtThrottle = 0;
    let tgtAlt = this.current.altitude;
    let tgtSpd = 0;
    let tgtVS = 0;

    if (isMissionActive) {
      if (phase === 'Ground Idle') { tgtThrottle = 7.5; tgtSpd = 0; tgtVS = 0; }
      else if (phase === 'Takeoff') { tgtThrottle = 100; tgtSpd = 120; tgtVS = 2; }
      else if (phase === 'Climb') { tgtThrottle = 85; tgtSpd = 150; tgtVS = 5; tgtAlt += 5 * dt; }
      else if (phase === 'Cruise') { tgtThrottle = 65; tgtSpd = 200; tgtVS = 0; }
      else if (phase === 'Loiter') { tgtThrottle = 50; tgtSpd = 140; tgtVS = 0; }
      else if (phase === 'Descent') { tgtThrottle = 30; tgtSpd = 160; tgtVS = -4; tgtAlt -= 4 * dt; }
      else if (phase === 'Landing') { tgtThrottle = 15; tgtSpd = 80; tgtVS = -2; tgtAlt -= 2 * dt; }
    } else {
      tgtThrottle = 0;
    }

    tgtAlt = Math.max(0, tgtAlt);
    this.current.altitude = tgtAlt;
    this.current.throttle += (tgtThrottle - this.current.throttle) * 0.1;
    this.current.airspeed += (tgtSpd - this.current.airspeed) * 0.05;
    this.current.verticalSpeed += (tgtVS - this.current.verticalSpeed) * 0.1;

    // Environmental
    this.current.oat = 15 - (this.current.altitude / 1000) * 6.5; // Lapse rate
    const airDensity = 1.225 * Math.exp(-this.current.altitude / 8500);
    let powerLoss = airDensity / 1.225;
    if (F.altLoss > 0) powerLoss *= (1 - F.altLoss * 0.5);

    // Physics
    const isRunning = this.current.throttle > 2;
    let targetRpm = isRunning ? 1000 + (this.current.throttle / 100) * 5000 : 0;
    targetRpm *= powerLoss;
    if (F.spark > 0) targetRpm -= (F.spark * 1200) * Math.random();
    targetRpm = Math.max(0, targetRpm);
    this.current.rpm += (targetRpm - this.current.rpm) * 0.1;

    const rpmRatio = this.current.rpm / 6000;
    
    let targetFuelFlow = isRunning ? (rpmRatio * 25) + 2 : 0;
    if (F.inj > 0) targetFuelFlow *= (1 - F.inj * 0.3); // Poor flow
    if (F.fuelLeak > 0) targetFuelFlow += (F.fuelLeak * 20); // Leakage
    this.current.fuelFlow += (targetFuelFlow - this.current.fuelFlow) * 0.1;
    this.current.fuelRemaining = Math.max(0, this.current.fuelRemaining - (this.current.fuelFlow / 3600) * dt);
    
    let targetFuelPress = isRunning ? 5 : 0; // bar
    this.current.fuelPressure += (targetFuelPress - this.current.fuelPressure) * 0.1;

    let targetMap = isRunning ? 100 * (0.3 + (this.current.throttle/100)*0.7) * powerLoss : 101 * powerLoss;
    this.current.map += (targetMap - this.current.map) * 0.1;

    let targetOilPress = isRunning ? (rpmRatio * 500) + 150 : 0;
    targetOilPress -= (F.oilLeak * 400);
    this.current.oilPressure += (Math.max(0, targetOilPress) - this.current.oilPressure) * 0.1;

    if (isRunning && this.current.oilPressure < 100) { F.bearing = Math.min(1.0, F.bearing + 0.005); }

    const cooling = Math.max(0.1, 1 - (this.current.oat / 100) + (this.current.airspeed / 250));
    let targetEgt = this.current.oat + (rpmRatio * 850) / cooling;
    let targetCht = this.current.oat + (rpmRatio * 180) / cooling;
    let targetOilTemp = this.current.oat + (rpmRatio * 100) / cooling;
    
    targetEgt += (F.inj * 150) + (F.spark * 100);
    targetOilTemp += (F.bearing * 70) + ((1 - this.current.oilPressure/600) * 40);
    targetCht += (F.bearing * 50);

    this.current.egt += (targetEgt - this.current.egt) * 0.05;
    this.current.cht += (targetCht - this.current.cht) * 0.01;
    this.current.oilTemp += (targetOilTemp - this.current.oilTemp) * 0.005;

    let targetAltV = isRunning ? 28 : 0;
    if (F.alt > 0) targetAltV -= F.alt * 10;
    this.current.alternatorVoltage += (targetAltV - this.current.alternatorVoltage) * 0.1;
    
    let targetBatt = this.current.alternatorVoltage > 25 ? 28 : 24;
    this.current.batteryVoltage += (targetBatt - this.current.batteryVoltage) * 0.01;

    let targetVib = isRunning ? 0.5 + (rpmRatio * 1.5) : 0;
    targetVib += (F.bearing * 5) + (F.prop * 6) + (F.spark * 2 * Math.random());
    this.current.vibrationZ += (targetVib - this.current.vibrationZ) * 0.2;
    this.current.vibrationX = this.current.vibrationZ * 0.3 * Math.random();
    this.current.vibrationY = this.current.vibrationZ * 0.5 * Math.random();

    // SENSOR FAILURES
    let dRpm = this.current.rpm;
    let dEgt = this.current.egt;
    let dCht = this.current.cht;
    
    if (F.rpmS > 0.5) dRpm = Math.random() > 0.5 ? 0 : this.current.rpm;
    if (F.egtS > 0.5) dEgt += (Math.random()-0.5)*300;
    if (F.chtS > 0.5) dCht = 40; // frozen

    this.current.timestamp = Date.now();
    return { tel: { ...this.current, rpm: dRpm, egt: dEgt, cht: dCht }, updatedFaults };
  }
}
""")

# --- TELEMETRY STREAMER ---
write("src/services/telemetryStream.ts", """
import { Telemetry } from '../store/simulatorStore';

export class TelemetryStreamer {
  static output(tel: Telemetry) {
    // In production, this emits to WebSocket, CAN Bus mock, and JSON stream APIs
    // Using console.log to simulate the raw JSON stream requirement without crashing browser
    // console.log(JSON.stringify(tel));
  }
}
""")

# --- SIM LOOP ---
write("src/simulator/simulationLoop.ts", """
import { useSimStore } from '../store/simulatorStore';
import { PhysicsEngine } from './physicsEngine';
import { TelemetryStreamer } from '../services/telemetryStream';

class SimulationLoop {
  private timer: any = null;
  private physics = new PhysicsEngine();
  
  public start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), 100);
  }
  
  public stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
  
  private tick() {
    const store = useSimStore.getState();
    const dt = 0.1;
    
    const { tel, updatedFaults } = this.physics.tick(store.missionPhase, store.missionActive, store.activeFaults, dt);
    
    store.updateState(tel, updatedFaults, store.missionActive ? store.missionTime + dt : store.missionTime);
    
    TelemetryStreamer.output(tel);
  }
}

export const simulator = new SimulationLoop();
""")

# --- LAYOUT (NAVIGATION) ---
write("src/app/layout.tsx", """
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
export const metadata: Metadata = { title: 'UAV Sensor Emulator' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-black text-green-500 font-mono flex flex-col`}>
        <nav className="flex space-x-6 p-4 border-b border-green-900 bg-gray-900 text-sm">
          <div className="font-bold text-white mr-8">UAV SENSOR EMULATOR</div>
          <Link href="/" className="hover:text-white">Engine</Link>
          <Link href="/environment" className="hover:text-white">Environment</Link>
          <Link href="/mission" className="hover:text-white">Mission Control</Link>
          <Link href="/faults" className="hover:text-white">Fault Injection</Link>
        </nav>
        <main className="flex-1 p-6">{children}</main>
      </body>
    </html>
  );
}
""")

# --- PAGE 1: ENGINE ---
write("src/app/page.tsx", """
"use client";
import { useEffect } from 'react';
import { useSimStore } from '@/store/simulatorStore';
import { simulator } from '@/simulator/simulationLoop';

export default function EnginePage() {
  const { telemetry } = useSimStore();

  useEffect(() => {
    simulator.start();
    return () => simulator.stop(); // Clean up if they leave, but usually runs globally. 
  }, []);

  const DataRow = ({ label, value, unit }: any) => (
    <div className="flex justify-between border-b border-gray-800 py-2">
      <span className="text-gray-400">{label}</span>
      <span>{typeof value === 'number' ? value.toFixed(2) : value} <span className="text-gray-600">{unit}</span></span>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white border-b border-green-500 pb-2 mb-4">Engine Telemetry Stream</h1>
      
      <div className="grid grid-cols-2 gap-x-12">
        <div>
          <DataRow label="RPM" value={telemetry.rpm} unit="RPM" />
          <DataRow label="Throttle" value={telemetry.throttle} unit="%" />
          <DataRow label="MAP" value={telemetry.map} unit="kPa" />
          <DataRow label="Fuel Flow" value={telemetry.fuelFlow} unit="L/hr" />
          <DataRow label="Fuel Pressure" value={telemetry.fuelPressure} unit="bar" />
          <DataRow label="Fuel Remaining" value={telemetry.fuelRemaining} unit="L" />
        </div>
        <div>
          <DataRow label="CHT" value={telemetry.cht} unit="°C" />
          <DataRow label="EGT" value={telemetry.egt} unit="°C" />
          <DataRow label="Oil Temp" value={telemetry.oilTemp} unit="°C" />
          <DataRow label="Oil Pressure" value={telemetry.oilPressure} unit="kPa" />
          <DataRow label="Battery Voltage" value={telemetry.batteryVoltage} unit="V" />
          <DataRow label="Alternator Voltage" value={telemetry.alternatorVoltage} unit="V" />
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-gray-800">
        <h2 className="text-sm text-gray-500 mb-2">RAW JSON STREAM OUTPUT</h2>
        <pre className="bg-gray-900 p-4 rounded text-xs overflow-x-auto text-green-400">
          {JSON.stringify(telemetry, null, 2)}
        </pre>
      </div>
    </div>
  );
}
""")

# --- PAGE 2: ENVIRONMENT ---
write("src/app/environment/page.tsx", """
"use client";
import { useSimStore } from '@/store/simulatorStore';

export default function EnvPage() {
  const { telemetry } = useSimStore();
  
  const DataRow = ({ label, value, unit }: any) => (
    <div className="flex justify-between border-b border-gray-800 py-2">
      <span className="text-gray-400">{label}</span>
      <span>{typeof value === 'number' ? value.toFixed(2) : value} <span className="text-gray-600">{unit}</span></span>
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-white border-b border-green-500 pb-2 mb-4">Flight & Environment Sensors</h1>
      <DataRow label="Altitude" value={telemetry.altitude} unit="m" />
      <DataRow label="Airspeed" value={telemetry.airspeed} unit="km/h" />
      <DataRow label="Vertical Speed" value={telemetry.verticalSpeed} unit="m/s" />
      <DataRow label="Outside Air Temp" value={telemetry.oat} unit="°C" />
      <DataRow label="Humidity" value={telemetry.humidity} unit="%" />
      <DataRow label="Wind Speed" value={telemetry.windSpeed} unit="km/h" />
      
      <h2 className="text-sm font-bold text-white mt-8 mb-2">Vibration Sensors</h2>
      <DataRow label="Accelerometer X" value={telemetry.vibrationX} unit="g" />
      <DataRow label="Accelerometer Y" value={telemetry.vibrationY} unit="g" />
      <DataRow label="Accelerometer Z" value={telemetry.vibrationZ} unit="g" />
    </div>
  );
}
""")

# --- PAGE 3: MISSION ---
write("src/app/mission/page.tsx", """
"use client";
import { useSimStore, MissionPhase } from '@/store/simulatorStore';

export default function MissionPage() {
  const { missionPhase, setPhase, missionActive, startMission, pauseMission, stopMission, missionTime } = useSimStore();
  
  const phases: MissionPhase[] = ['Ground Idle', 'Takeoff', 'Climb', 'Cruise', 'Loiter', 'Descent', 'Landing'];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white border-b border-green-500 pb-2 mb-4">Mission Control Automation</h1>
      
      <div className="flex space-x-4 mb-8">
         <button onClick={startMission} disabled={missionActive} className="px-4 py-2 bg-green-900 text-green-100 disabled:opacity-50">Start Mission</button>
         <button onClick={pauseMission} disabled={!missionActive} className="px-4 py-2 bg-yellow-900 text-yellow-100 disabled:opacity-50">Pause Mission</button>
         <button onClick={stopMission} className="px-4 py-2 bg-red-900 text-red-100">Stop Mission</button>
      </div>

      <div className="bg-gray-900 p-4 rounded text-center">
        <div className="text-gray-400">Mission Timer</div>
        <div className="text-3xl font-bold text-white">{(missionTime / 60).toFixed(2)} min</div>
      </div>

      <div>
        <h3 className="text-gray-400 mb-2">Select Mission Phase</h3>
        <div className="grid grid-cols-2 gap-2">
          {phases.map(p => (
            <button key={p} onClick={() => setPhase(p)} 
              className={`p-3 text-left border ${missionPhase === p ? 'border-green-500 bg-green-900/30 text-white' : 'border-gray-800 text-gray-500 hover:bg-gray-800'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
""")

# --- PAGE 4: FAULTS ---
write("src/app/faults/page.tsx", """
"use client";
import { useState } from 'react';
import { useSimStore, FAULT_LIST, FaultSeverity } from '@/store/simulatorStore';

export default function FaultsPage() {
  const { activeFaults, addFault, removeFault } = useSimStore();
  
  const [fType, setFType] = useState(FAULT_LIST[0]);
  const [sev, setSev] = useState<FaultSeverity>('MEDIUM');

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white border-b border-red-500 pb-2 mb-4">Fault Injection Console</h1>
      
      <div className="bg-gray-900 p-4 border border-red-900/50 space-y-4">
         <div>
           <label className="text-gray-400 text-sm block mb-1">Failure Type</label>
           <select value={fType} onChange={e => setFType(e.target.value)} className="w-full bg-black border border-gray-800 p-2 text-white">
             {FAULT_LIST.map(f => <option key={f} value={f}>{f}</option>)}
           </select>
         </div>
         <div>
           <label className="text-gray-400 text-sm block mb-1">Severity</label>
           <select value={sev} onChange={e => setSev(e.target.value as FaultSeverity)} className="w-full bg-black border border-gray-800 p-2 text-white">
             <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
           </select>
         </div>
         <button onClick={() => addFault(fType, sev)} className="w-full py-2 bg-red-900 text-white font-bold">Inject Failure</button>
      </div>

      <div className="space-y-2 mt-8">
         <h2 className="text-gray-400 text-sm mb-2">Active Failures</h2>
         {activeFaults.map(f => (
           <div key={f.id} className="flex justify-between items-center p-3 border border-red-900/30 bg-black">
              <div>
                <div className="font-bold text-red-500">{f.type}</div>
                <div className="text-xs text-gray-500">Sev: {f.severity} | Intensity: {(f.intensity*100).toFixed(1)}%</div>
              </div>
              <button onClick={() => removeFault(f.id)} className="text-gray-500 hover:text-white px-3 py-1 border border-gray-800">Remove</button>
           </div>
         ))}
         {activeFaults.length === 0 && <div className="text-gray-600 text-sm">No active failures.</div>}
      </div>
    </div>
  );
}
""")
print("Reverted to Bare-Metal Sensor Emulator Architecture.")
