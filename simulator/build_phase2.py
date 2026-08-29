import os

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim/src"

folders = [
    "simulation/environment",
    "simulation/mission",
    "simulation/faults",
    "simulation/sensors",
    "simulation/health",
    "simulation/vibration",
    "app/environment",
    "app/mission-control",
    "app/fault-injection",
    "app/health-monitor"
]
for f in folders:
    os.makedirs(os.path.join(BASE_DIR, f), exist_ok=True)

def write(path, content):
    with open(os.path.join(BASE_DIR, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# --- STORES ---
write("store/environmentStore.ts", """
import { create } from 'zustand';

interface EnvState {
  altitude: number;
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  densityAltitude: number;
  setEnv: (key: keyof EnvState, val: number) => void;
}

export const useEnvStore = create<EnvState>((set) => ({
  altitude: 0,
  temperature: 15,
  humidity: 50,
  pressure: 1013,
  windSpeed: 0,
  windDirection: 0,
  densityAltitude: 0,
  setEnv: (key, val) => set({ [key]: val })
}));
""")

write("store/missionStore.ts", """
import { create } from 'zustand';

export type MissionPhase = 'GROUND IDLE' | 'TAKEOFF' | 'CLIMB' | 'CRUISE' | 'LOITER' | 'DESCENT' | 'LANDING';

interface MissionState {
  isActive: boolean;
  phase: MissionPhase;
  fuelCapacity: number;
  fuelRemaining: number;
  trueAirspeed: number;
  groundSpeed: number;
  verticalSpeed: number;
  setMissionState: (updates: Partial<MissionState>) => void;
}

export const useMissionStore = create<MissionState>((set) => ({
  isActive: false,
  phase: 'GROUND IDLE',
  fuelCapacity: 100,
  fuelRemaining: 100,
  trueAirspeed: 0,
  groundSpeed: 0,
  verticalSpeed: 0,
  setMissionState: (updates) => set((s) => ({ ...s, ...updates }))
}));
""")

write("store/faultStore.ts", """
import { create } from 'zustand';

export type FaultSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export interface ActiveFault { id: string; type: string; severity: FaultSeverity; intensity: number; }

interface FaultState {
  activeFaults: ActiveFault[];
  addFault: (type: string, severity: FaultSeverity) => void;
  removeFault: (id: string) => void;
  updateIntensity: (id: string, intensity: number) => void;
}

export const useFaultStore = create<FaultState>((set) => ({
  activeFaults: [],
  addFault: (type, severity) => set(s => ({ activeFaults: [...s.activeFaults, { id: Math.random().toString(), type, severity, intensity: 0 }] })),
  removeFault: (id) => set(s => ({ activeFaults: s.activeFaults.filter(f => f.id !== id) })),
  updateIntensity: (id, intensity) => set(s => ({
    activeFaults: s.activeFaults.map(f => f.id === id ? { ...f, intensity } : f)
  }))
}));
""")

write("store/healthStore.ts", """
import { create } from 'zustand';

interface HealthState {
  score: number;
  status: string;
  warnings: string[];
  criticals: string[];
  setHealth: (updates: Partial<HealthState>) => void;
}

export const useHealthStore = create<HealthState>((set) => ({
  score: 100,
  status: 'Excellent',
  warnings: [],
  criticals: [],
  setHealth: (u) => set((s) => ({ ...s, ...u }))
}));
""")

# --- SIMULATION MODULES ---
write("simulation/environment/EnvironmentEngine.ts", """
import { useEnvStore } from '../../store/environmentStore';

export class EnvironmentEngine {
  public update(dt: number) {
    const env = useEnvStore.getState();
    // Calculate Density Altitude (approximate)
    const pressureAlt = env.altitude + (1013 - env.pressure) * 30;
    const standardTemp = 15 - (2 * (env.altitude / 1000));
    const densityAlt = pressureAlt + 120 * (env.temperature - standardTemp);
    
    if (Math.abs(densityAlt - env.densityAltitude) > 1) {
      env.setEnv('densityAltitude', densityAlt);
    }
  }
}
""")

write("simulation/mission/MissionController.ts", """
import { useMissionStore } from '../../store/missionStore';
import { useEngineStore } from '../../store/EngineStore';
import { useEnvStore } from '../../store/environmentStore';

export class MissionController {
  private timeInPhase = 0;

  public update(dt: number) {
    const mStore = useMissionStore.getState();
    const eStore = useEngineStore.getState();
    const envStore = useEnvStore.getState();

    // Fuel Consumption
    if (eStore.engineState === 'RUNNING' || eStore.engineState === 'IDLE' || eStore.engineState === 'HIGH LOAD') {
      const fuelBurnSec = (eStore.telemetry.fuelFlow / 3600) * dt;
      mStore.setMissionState({ fuelRemaining: Math.max(0, mStore.fuelRemaining - fuelBurnSec) });
    }

    if (!mStore.isActive) return;
    this.timeInPhase += dt;

    // Phase automation
    let targetAlt = envStore.altitude;
    let targetThrottle = eStore.throttle;

    switch (mStore.phase) {
      case 'GROUND IDLE':
        targetThrottle = 10; targetAlt = 0;
        if (this.timeInPhase > 5) { mStore.setMissionState({ phase: 'TAKEOFF' }); this.timeInPhase = 0; }
        break;
      case 'TAKEOFF':
        targetThrottle = 100;
        targetAlt += 20 * dt;
        if (this.timeInPhase > 10) { mStore.setMissionState({ phase: 'CLIMB' }); this.timeInPhase = 0; }
        break;
      case 'CLIMB':
        targetThrottle = 85;
        targetAlt += 15 * dt;
        if (this.timeInPhase > 20) { mStore.setMissionState({ phase: 'CRUISE' }); this.timeInPhase = 0; }
        break;
      case 'CRUISE':
        targetThrottle = 65;
        if (this.timeInPhase > 30) { mStore.setMissionState({ phase: 'DESCENT' }); this.timeInPhase = 0; }
        break;
      case 'DESCENT':
        targetThrottle = 30;
        targetAlt = Math.max(0, targetAlt - 15 * dt);
        if (this.timeInPhase > 20) { mStore.setMissionState({ phase: 'LANDING' }); this.timeInPhase = 0; }
        break;
      case 'LANDING':
        targetThrottle = 15;
        targetAlt = Math.max(0, targetAlt - 5 * dt);
        if (this.timeInPhase > 10) { mStore.setMissionState({ phase: 'GROUND IDLE', isActive: false }); this.timeInPhase = 0; }
        break;
    }

    envStore.setEnv('altitude', targetAlt);
    eStore.setControl('throttle', targetThrottle);

    // Airspeed calculation
    const trueAirspeed = Math.sqrt(eStore.telemetry.rpm) * 1.5;
    const groundSpeed = trueAirspeed - (envStore.windSpeed * 0.5); // simplified headwind
    mStore.setMissionState({ trueAirspeed, groundSpeed });
  }
}
""")

write("simulation/faults/FaultManager.ts", """
import { useFaultStore, ActiveFault } from '../../store/faultStore';

export class FaultManager {
  public update(dt: number) {
    const { activeFaults, updateIntensity } = useFaultStore.getState();
    
    activeFaults.forEach(f => {
      if (f.intensity < 1.0) {
        let rate = 0.01;
        if (f.severity === 'MEDIUM') rate = 0.03;
        if (f.severity === 'HIGH') rate = 0.08;
        if (f.severity === 'CRITICAL') rate = 0.2;
        updateIntensity(f.id, Math.min(1.0, f.intensity + rate * dt));
      }
    });
  }

  public applyFaultsToPhysics(baseRpm: number, baseFuelFlow: number, baseOilPress: number): { rpm: number, fuelFlow: number, oilPress: number } {
    const faults = useFaultStore.getState().activeFaults;
    let rpm = baseRpm;
    let fuelFlow = baseFuelFlow;
    let oilPress = baseOilPress;

    faults.forEach(f => {
      const impact = f.intensity;
      if (f.type === 'Oil Leak') oilPress -= 50 * impact;
      if (f.type === 'Fuel Leak') fuelFlow += 10 * impact;
      if (f.type === 'Turbo Failure') rpm -= 1000 * impact;
    });

    return { rpm: Math.max(0, rpm), fuelFlow, oilPress: Math.max(0, oilPress) };
  }
}
""")

write("simulation/health/HealthEngine.ts", """
import { useHealthStore } from '../../store/healthStore';
import { useEngineStore } from '../../store/EngineStore';
import { useFaultStore } from '../../store/faultStore';
import { useMissionStore } from '../../store/missionStore';

export class HealthEngine {
  public update() {
    const engine = useEngineStore.getState().telemetry;
    const faults = useFaultStore.getState().activeFaults;
    const mission = useMissionStore.getState();
    
    let score = 100;
    const warnings: string[] = [];
    const criticals: string[] = [];

    if (engine.oilTemp > 115) { score -= 10; warnings.push('High Oil Temp'); }
    if (engine.oilTemp > 125) { score -= 20; criticals.push('CRITICAL Oil Temp'); }
    if (engine.cht > 140) { score -= 10; warnings.push('High CHT'); }
    if (mission.fuelRemaining < 25) { warnings.push('Low Fuel'); }
    if (mission.fuelRemaining < 5) { score -= 10; criticals.push('CRITICAL Fuel'); }

    faults.forEach(f => {
      score -= (f.severity === 'CRITICAL' ? 30 : f.severity === 'HIGH' ? 20 : 10) * f.intensity;
      if (f.intensity > 0.5) warnings.push(`${f.type} Active`);
    });

    score = Math.max(0, Math.floor(score));
    let status = 'Excellent';
    if (score < 90) status = 'Healthy';
    if (score < 70) status = 'Warning';
    if (score < 50) status = 'Critical';
    if (score < 30) status = 'Failure Imminent';

    useHealthStore.getState().setHealth({ score, status, warnings, criticals });
  }
}
""")

write("simulation/vibration/VibrationEngine.ts", """
export class VibrationEngine {
  public generateFFT(rpm: number, faults: any[]): number[] {
    // 15, 30, 45, 85, 170, 255, 340, 510, 1200
    const bands = [0,0,0,0,0,0,0,0,0];
    const base = (rpm / 6000);
    
    bands[1] = base * 0.5; // 30Hz
    bands[3] = base * 0.8; // 85Hz
    bands[4] = base * 0.3; // 170Hz

    faults.forEach(f => {
      if (f.type === 'Bearing Wear') { bands[4] += f.intensity; bands[5] += f.intensity; }
      if (f.type === 'Turbo Failure') { bands[7] += f.intensity; bands[8] += f.intensity; }
    });
    
    return bands.map(b => b + Math.random() * 0.05); // Add noise
  }
}
""")

# --- UPDATE SIMULATION LOOP ---
write("simulation/SimulationLoop.ts", """
import { useEngineStore } from '../store/EngineStore';
import { useEnvStore } from '../store/environmentStore';
import { EnginePhysics } from './EnginePhysics';
import { EnvironmentEngine } from './environment/EnvironmentEngine';
import { MissionController } from './mission/MissionController';
import { FaultManager } from './faults/FaultManager';
import { HealthEngine } from './health/HealthEngine';

class SimulationLoop {
  private timer: any = null;
  private physics = new EnginePhysics();
  private env = new EnvironmentEngine();
  private mission = new MissionController();
  private faultMgr = new FaultManager();
  private health = new HealthEngine();
  
  public start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.update(), 100);
  }
  
  public stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
  
  private update() {
    const dt = 0.1;
    
    this.mission.update(dt);
    this.env.update(dt);
    this.faultMgr.update(dt);
    
    const store = useEngineStore.getState();
    const envStore = useEnvStore.getState();
    
    // Physics calculates base values based on environment altitude
    let rawTelemetry = this.physics.tick(
      store.engineState, store.throttle, store.baseLoad, envStore.altitude, envStore.temperature, dt
    );
    
    // Apply Physical Faults
    const faultModified = this.faultMgr.applyFaultsToPhysics(rawTelemetry.rpm, rawTelemetry.fuelFlow, rawTelemetry.oilPress);
    rawTelemetry.rpm = faultModified.rpm;
    rawTelemetry.fuelFlow = faultModified.fuelFlow;
    rawTelemetry.oilPress = faultModified.oilPress;

    // Add Sensor Noise Layer
    rawTelemetry.rpm += (Math.random() - 0.5) * 5;
    rawTelemetry.egt += (Math.random() - 0.5) * 2;

    store.updateTelemetry(rawTelemetry);
    this.health.update();
  }
}

export const simulator = new SimulationLoop();
""")

# --- UI NAVIGATION & LAYOUT ---
write("app/layout.tsx", """
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
export const metadata: Metadata = { title: 'UAV Simulator Phase 2' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#050505] text-slate-200 flex`}>
        <nav className="w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-4">
          <div className="text-xl font-bold text-blue-500 mb-8">UAV SIM OS</div>
          <Link href="/" className="block p-2 hover:bg-slate-800 rounded">Engine Core</Link>
          <Link href="/environment" className="block p-2 hover:bg-slate-800 rounded">Environment</Link>
          <Link href="/mission-control" className="block p-2 hover:bg-slate-800 rounded">Mission Control</Link>
          <Link href="/fault-injection" className="block p-2 hover:bg-slate-800 rounded">Fault Injection</Link>
          <Link href="/health-monitor" className="block p-2 hover:bg-slate-800 rounded">Health Monitor</Link>
        </nav>
        <main className="flex-1 p-6 h-screen overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
""")

# --- NEW UI PAGES ---
write("app/environment/page.tsx", """
"use client";
import { useEnvStore } from '@/store/environmentStore';

export default function EnvPage() {
  const env = useEnvStore();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Environment Engine</h1>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl space-y-4">
          <label>Altitude (m): {env.altitude.toFixed(0)}</label>
          <input type="range" min="0" max="12000" value={env.altitude} onChange={e=>env.setEnv('altitude',+e.target.value)} className="w-full" />
          
          <label>Temperature (°C): {env.temperature.toFixed(1)}</label>
          <input type="range" min="-30" max="55" value={env.temperature} onChange={e=>env.setEnv('temperature',+e.target.value)} className="w-full" />
          
          <label>Humidity (%): {env.humidity}</label>
          <input type="range" min="0" max="100" value={env.humidity} onChange={e=>env.setEnv('humidity',+e.target.value)} className="w-full" />
        </div>
        <div className="bg-slate-900 p-6 rounded-xl space-y-4 font-mono text-sm">
          <div>Pressure: {env.pressure.toFixed(1)} hPa</div>
          <div>Density Altitude: {env.densityAltitude.toFixed(1)} m</div>
          <div>Wind Speed: {env.windSpeed} kts</div>
        </div>
      </div>
    </div>
  );
}
""")

write("app/mission-control/page.tsx", """
"use client";
import { useMissionStore } from '@/store/missionStore';

export default function MissionPage() {
  const m = useMissionStore();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mission Automation</h1>
      <div className="bg-slate-900 p-6 rounded-xl">
        <div className="flex space-x-4 mb-6">
          <button onClick={()=>m.setMissionState({isActive: true})} className="bg-green-600 px-4 py-2 rounded font-bold">Start Auto Mission</button>
          <button onClick={()=>m.setMissionState({isActive: false})} className="bg-red-600 px-4 py-2 rounded font-bold">Stop Mission</button>
        </div>
        <div className="grid grid-cols-2 gap-4 font-mono">
           <div>Phase: <span className="text-blue-400">{m.phase}</span></div>
           <div>Fuel: <span className="text-blue-400">{m.fuelRemaining.toFixed(1)} L</span></div>
           <div>True Airspeed: <span className="text-blue-400">{m.trueAirspeed.toFixed(1)} kts</span></div>
        </div>
      </div>
    </div>
  );
}
""")

write("app/fault-injection/page.tsx", """
"use client";
import { useFaultStore } from '@/store/faultStore';
import { useState } from 'react';

const faultTypes = ['Oil Leak', 'Fuel Leak', 'Turbo Failure', 'Bearing Wear', 'RPM Sensor Failure'];

export default function FaultPage() {
  const { activeFaults, addFault, removeFault } = useFaultStore();
  const [type, setType] = useState(faultTypes[0]);
  const [sev, setSev] = useState('MEDIUM');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fault Injection</h1>
      <div className="bg-slate-900 p-6 rounded-xl space-y-4">
        <select value={type} onChange={e=>setType(e.target.value)} className="bg-slate-800 p-2 rounded mr-4">{faultTypes.map(f=><option key={f}>{f}</option>)}</select>
        <select value={sev} onChange={e=>setSev(e.target.value)} className="bg-slate-800 p-2 rounded mr-4"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select>
        <button onClick={()=>addFault(type, sev as any)} className="bg-red-600 px-4 py-2 rounded font-bold">Inject Fault</button>
      </div>
      <div className="space-y-2">
        {activeFaults.map(f => (
          <div key={f.id} className="bg-slate-900 p-4 rounded-xl flex justify-between items-center">
             <div><span className="font-bold text-red-500">{f.type}</span> ({f.severity})</div>
             <div>Intensity: {(f.intensity*100).toFixed(0)}%</div>
             <button onClick={()=>removeFault(f.id)} className="bg-slate-700 px-2 rounded">Clear</button>
          </div>
        ))}
      </div>
    </div>
  );
}
""")

write("app/health-monitor/page.tsx", """
"use client";
import { useHealthStore } from '@/store/healthStore';

export default function HealthPage() {
  const h = useHealthStore();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">AI Health Engine</h1>
      <div className="bg-slate-900 p-6 rounded-xl flex items-center justify-between">
        <div>
          <div className="text-xl">Health Score</div>
          <div className={`text-6xl font-black ${h.score < 50 ? 'text-red-500' : 'text-green-500'}`}>{h.score}%</div>
        </div>
        <div className="text-right">
          <div className="text-xl">Status</div>
          <div className="text-3xl text-blue-400">{h.status}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-6 rounded-xl text-amber-500">
          <h3 className="font-bold border-b border-slate-700 mb-2">Warnings</h3>
          {h.warnings.map((w,i)=><div key={i}>{w}</div>)}
        </div>
        <div className="bg-slate-900 p-6 rounded-xl text-red-500">
          <h3 className="font-bold border-b border-slate-700 mb-2">Critical Alerts</h3>
          {h.criticals.map((w,i)=><div key={i}>{w}</div>)}
        </div>
      </div>
    </div>
  );
}
""")

print("Phase 2 Created")
