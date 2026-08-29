import os

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim/src"

def write(path, content):
    with open(os.path.join(BASE_DIR, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# Store
os.makedirs(os.path.join(BASE_DIR, "store"), exist_ok=True)
write("store/uiStore.ts", """
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MissionConfig { id: string; type: string; duration: number; cruiseAlt: number; payloadWeight: number; }
export interface EnvConfig { altitude: number; temp: number; pressure: number; humidity: number; windSpeed: number; windDirection: number; }
export interface EngineConfig { id: string; type: string; maxRpm: number; idleRpm: number; sensors: Record<string, boolean>; }
export interface PhysicsConfig { gravity: number; airDensity: number; dragCoefficient: number; liftCoefficient: number; }
export interface FaultConfig { engineFailure: boolean; sensorFailure: boolean; fuelLeak: boolean; commLoss: boolean; }
export type SimState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'STOPPED';

interface UIState {
  mission: MissionConfig;
  env: EnvConfig;
  engine: EngineConfig;
  physics: PhysicsConfig;
  faults: FaultConfig;
  simStatus: SimState;
  
  setMission: (m: Partial<MissionConfig>) => void;
  setEnv: (e: Partial<EnvConfig>) => void;
  setEngine: (e: Partial<EngineConfig>) => void;
  setPhysics: (p: Partial<PhysicsConfig>) => void;
  setFaults: (f: Partial<FaultConfig>) => void;
  setSimStatus: (s: SimState) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      mission: { id: 'MSN-001', type: 'Endurance', duration: 120, cruiseAlt: 15000, payloadWeight: 45 },
      env: { altitude: 0, temp: 15, pressure: 101325, humidity: 50, windSpeed: 0, windDirection: 0 },
      engine: { id: 'UAV-PT-01', type: 'Piston', maxRpm: 5800, idleRpm: 1200, sensors: { RPM: true, EGT: true, CHT: true } },
      physics: { gravity: 9.81, airDensity: 1.225, dragCoefficient: 0.03, liftCoefficient: 0.5 },
      faults: { engineFailure: false, sensorFailure: false, fuelLeak: false, commLoss: false },
      simStatus: 'IDLE',
      
      setMission: (m) => set(s => ({ mission: { ...s.mission, ...m } })),
      setEnv: (e) => set(s => ({ env: { ...s.env, ...e } })),
      setEngine: (e) => set(s => ({ engine: { ...s.engine, ...e } })),
      setPhysics: (p) => set(s => ({ physics: { ...s.physics, ...p } })),
      setFaults: (f) => set(s => ({ faults: { ...s.faults, ...f } })),
      setSimStatus: (simStatus) => set({ simStatus })
    }),
    { name: 'sim-ui-storage' }
  )
);
""")

# Layout with toaster
write("app/layout.tsx", """
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = { title: 'Aero Engine Simulator' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 relative min-w-0">
            <Topbar />
            <main className="flex-1 overflow-y-auto"><div className="p-6 max-w-7xl mx-auto">{children}</div></main>
          </div>
        </div>
        <Toaster theme="dark" richColors />
      </body>
    </html>
  );
}
""")

# Mission Setup
write("app/mission-setup/page.tsx", """
"use client";
import { useForm } from 'react-hook-form';
import { useUIStore, MissionConfig } from '@/store/uiStore';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function MissionSetupPage() {
  const mission = useUIStore(s => s.mission);
  const setMission = useUIStore(s => s.setMission);
  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm<MissionConfig>({ mode: 'onChange' });

  useEffect(() => { reset(mission); }, [mission, reset]);

  const onSubmit = (data: MissionConfig) => {
    setMission(data);
    toast.success('Mission configuration saved successfully!');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Mission Setup</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border p-6 rounded-xl space-y-4">
        <div><label>Mission ID</label><input {...register('id', {required:true})} className="w-full bg-background border p-2 rounded" /></div>
        <div><label>Type</label><select {...register('type')} className="w-full bg-background border p-2 rounded"><option>Endurance</option><option>ISR</option></select></div>
        <div><label>Duration (min)</label><input type="number" {...register('duration', {required:true, min:1})} className="w-full bg-background border p-2 rounded" /></div>
        <button disabled={!isValid} type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50">Save Mission</button>
      </form>
    </div>
  );
}
""")

# Environment
write("app/environment/page.tsx", """
"use client";
import { useUIStore } from '@/store/uiStore';
import { toast } from 'sonner';

export default function EnvironmentPage() {
  const env = useUIStore(s => s.env);
  const setEnv = useUIStore(s => s.setEnv);

  const handleSave = () => { toast.success('Environment parameters saved!'); };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Environment Config</h1>
      <div className="bg-card border p-6 rounded-xl space-y-4">
        <div><label>Altitude (ft): {env.altitude}</label><input type="range" min="0" max="40000" value={env.altitude} onChange={e=>setEnv({altitude: +e.target.value})} className="w-full" /></div>
        <div><label>Wind Speed (kts): {env.windSpeed}</label><input type="range" min="0" max="100" value={env.windSpeed} onChange={e=>setEnv({windSpeed: +e.target.value})} className="w-full" /></div>
        <div><label>Temp (°C)</label><input type="number" value={env.temp} onChange={e=>setEnv({temp: +e.target.value})} className="w-full bg-background border p-2 rounded" /></div>
        <button onClick={handleSave} className="bg-primary text-primary-foreground px-4 py-2 rounded">Save Environment</button>
      </div>
    </div>
  );
}
""")

# Engine Setup
write("app/engine-setup/page.tsx", """
"use client";
import { useUIStore } from '@/store/uiStore';
import { toast } from 'sonner';

export default function EngineSetupPage() {
  const engine = useUIStore(s => s.engine);
  const setEngine = useUIStore(s => s.setEngine);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Engine Setup</h1>
      <div className="bg-card border p-6 rounded-xl space-y-4">
        <div><label>Engine ID</label><input value={engine.id} onChange={e=>setEngine({id: e.target.value})} className="w-full bg-background border p-2 rounded" /></div>
        <div><label>Max RPM</label><input type="number" value={engine.maxRpm} onChange={e=>setEngine({maxRpm: +e.target.value})} className="w-full bg-background border p-2 rounded" /></div>
        <div>
          <label className="flex items-center space-x-2"><input type="checkbox" checked={engine.sensors.RPM || false} onChange={e=>setEngine({sensors:{...engine.sensors, RPM: e.target.checked}})} /><span>RPM Sensor</span></label>
        </div>
        <button onClick={() => toast.success('Engine saved')} className="bg-primary px-4 py-2 rounded">Save Engine</button>
      </div>
    </div>
  );
}
""")

# Physics
write("app/physics/page.tsx", """
"use client";
import { useUIStore } from '@/store/uiStore';

export default function PhysicsPage() {
  const phys = useUIStore(s => s.physics);
  const setPhys = useUIStore(s => s.setPhysics);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Physics Core</h1>
      <div className="bg-card p-6 rounded-xl space-y-4">
        <div><label>Gravity: {phys.gravity}</label><input type="range" min="0" max="20" step="0.1" value={phys.gravity} onChange={e=>setPhys({gravity: +e.target.value})} className="w-full" /></div>
        <div><label>Air Density: {phys.airDensity}</label><input type="range" min="0.5" max="2.0" step="0.01" value={phys.airDensity} onChange={e=>setPhys({airDensity: +e.target.value})} className="w-full" /></div>
        <div><label>Drag Coef: {phys.dragCoefficient}</label><input type="range" min="0.01" max="1.0" step="0.01" value={phys.dragCoefficient} onChange={e=>setPhys({dragCoefficient: +e.target.value})} className="w-full" /></div>
      </div>
    </div>
  );
}
""")

# Faults
write("app/fault-injection/page.tsx", """
"use client";
import { useUIStore } from '@/store/uiStore';
import { toast } from 'sonner';

export default function FaultPage() {
  const faults = useUIStore(s => s.faults);
  const setFaults = useUIStore(s => s.setFaults);
  
  const toggle = (key: keyof typeof faults) => {
    setFaults({ [key]: !faults[key] });
    toast(!faults[key] ? `${key} Enabled!` : `${key} Disabled`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fault Injection</h1>
      <div className="bg-card p-6 rounded-xl space-y-4">
        {Object.entries(faults).map(([k, v]) => (
          <div key={k} className="flex justify-between p-3 border rounded bg-background text-foreground">
            <span className="capitalize">{k}</span>
            <button onClick={() => toggle(k as any)} className={`px-4 py-1 rounded ${v ? 'bg-destructive text-white' : 'bg-secondary'}`}>{v ? 'ACTIVE' : 'OFF'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
""")

# Sim Control
write("app/simulation-control/page.tsx", """
"use client";
import { useUIStore } from '@/store/uiStore';
import { toast } from 'sonner';

export default function SimControlPage() {
  const status = useUIStore(s => s.simStatus);
  const setStatus = useUIStore(s => s.setSimStatus);

  const handleState = (s: typeof status) => {
    setStatus(s);
    toast.success(`Simulation state changed to: ${s}`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Simulation Control</h1>
      <div className="bg-card p-6 rounded-xl space-y-4">
        <h3 className="text-xl">Current State: <span className="text-primary font-bold">{status}</span></h3>
        <div className="flex space-x-4">
          <button disabled={status === 'RUNNING'} onClick={() => handleState('RUNNING')} className="px-4 py-2 bg-green-500 rounded disabled:opacity-50">Start</button>
          <button disabled={status !== 'RUNNING'} onClick={() => handleState('PAUSED')} className="px-4 py-2 bg-amber-500 rounded disabled:opacity-50 text-black">Pause</button>
          <button disabled={status !== 'PAUSED'} onClick={() => handleState('RUNNING')} className="px-4 py-2 bg-blue-500 rounded disabled:opacity-50">Resume</button>
          <button disabled={status === 'STOPPED' || status === 'IDLE'} onClick={() => handleState('STOPPED')} className="px-4 py-2 bg-destructive rounded disabled:opacity-50">Stop</button>
        </div>
      </div>
    </div>
  );
}
""")
print("Done writing UI State scripts.")
