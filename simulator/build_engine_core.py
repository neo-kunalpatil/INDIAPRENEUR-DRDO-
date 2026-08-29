import os
import shutil

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim/src"

# Clean up previous digital twin implementation
routes_to_remove = ["mission", "physics", "telemetry", "faults", "health", "logs"]
for r in routes_to_remove:
    path = os.path.join(BASE_DIR, "app", r)
    if os.path.exists(path):
        shutil.rmtree(path)

# Create new architecture folders
folders = ["simulation", "components/ui", "components/gauges", "store", "types", "hooks"]
for f in folders:
    os.makedirs(os.path.join(BASE_DIR, f), exist_ok=True)

def write(path, content):
    with open(os.path.join(BASE_DIR, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# 1. Types
write("types/engine.ts", """
export type EngineState = 'OFF' | 'STARTING' | 'IDLE' | 'RUNNING' | 'HIGH LOAD' | 'SHUTDOWN';

export interface Telemetry {
  rpm: number;
  torque: number;
  fuelFlow: number;
  oilTemp: number;
  oilPress: number;
  cht: number;
  egt: number;
  batteryV: number;
  currentDraw: number;
  map: number;
  lambda: number;
  loadPct: number;
}
""")

# 2. Store
write("store/EngineStore.ts", """
import { create } from 'zustand';
import { EngineState, Telemetry } from '../types/engine';

interface EngineStoreState {
  engineState: EngineState;
  throttle: number; // 0-100
  baseLoad: number; // 0-100
  altitude: number; // 0-10000m
  ambientTemp: number; // -20 to 55
  
  telemetry: Telemetry;
  history: Telemetry[];
  
  setControl: (key: 'throttle' | 'baseLoad' | 'altitude' | 'ambientTemp', val: number) => void;
  setEngineState: (state: EngineState) => void;
  updateTelemetry: (t: Telemetry) => void;
}

const initTelemetry: Telemetry = {
  rpm: 0, torque: 0, fuelFlow: 0, oilTemp: 25, oilPress: 0,
  cht: 25, egt: 25, batteryV: 24.0, currentDraw: 0.5, map: 101, lambda: 1.0, loadPct: 0
};

export const useEngineStore = create<EngineStoreState>((set) => ({
  engineState: 'OFF',
  throttle: 0,
  baseLoad: 0,
  altitude: 0,
  ambientTemp: 15,
  telemetry: { ...initTelemetry },
  history: [],
  
  setControl: (key, val) => set({ [key]: val }),
  setEngineState: (state) => set({ engineState: state }),
  updateTelemetry: (t) => set((state) => {
    const newHist = [...state.history, t];
    if (newHist.length > 300) newHist.shift(); // keep 300 samples (30s at 10Hz)
    return { telemetry: t, history: newHist };
  })
}));
""")

# 3. Physics Core
write("simulation/EnginePhysics.ts", """
import { Telemetry, EngineState } from '../types/engine';

export class EnginePhysics {
  private current: Telemetry;
  
  constructor() {
    this.current = {
      rpm: 0, torque: 0, fuelFlow: 0, oilTemp: 25, oilPress: 0,
      cht: 25, egt: 25, batteryV: 24, currentDraw: 0.5, map: 101, lambda: 1, loadPct: 0
    };
  }

  public tick(
    state: EngineState, 
    throttle: number, 
    load: number, 
    alt: number, 
    ambTemp: number, 
    dt: number
  ): Telemetry {
    
    // Engine State Logic
    if (state === 'OFF' || state === 'SHUTDOWN') {
      this.current.rpm += (0 - this.current.rpm) * 0.1;
      this.current.batteryV = 24.0;
      this.current.fuelFlow = 0;
      this.current.oilPress += (0 - this.current.oilPress) * 0.1;
    } else if (state === 'STARTING') {
      this.current.rpm += (800 - this.current.rpm) * 0.1; // starter motor
      this.current.batteryV = 22.5; // voltage drop
      this.current.fuelFlow = 1.5;
      this.current.oilPress += (30 - this.current.oilPress) * 0.1;
    } else {
      // RUNNING / IDLE / HIGH LOAD
      const altPenalty = 1 - (alt / 10000) * 0.3; // power loss at alt
      const maxRpm = 6000;
      const idleRpm = 1200;
      
      let targetRpm = idleRpm + (throttle / 100) * (maxRpm - idleRpm);
      targetRpm *= altPenalty;
      
      // Load bogs down RPM slightly
      targetRpm -= (load / 100) * 500;
      if (targetRpm < idleRpm) targetRpm = idleRpm;
      
      // Inertia (smooth acceleration)
      this.current.rpm += (targetRpm - this.current.rpm) * 0.05;
      
      this.current.batteryV = 28.0; // Alternator active
      
      // Fuel Flow (LPH)
      const rpmFactor = this.current.rpm / maxRpm;
      let targetFuel = 2 + (rpmFactor * 25) + ((load/100) * 5);
      this.current.fuelFlow += (targetFuel - this.current.fuelFlow) * 0.1;
      
      // Oil Press
      let targetOilP = (rpmFactor * 50) + 20; // 20-70 psi approx
      this.current.oilPress += (targetOilP - this.current.oilPress) * 0.1;
    }

    // Heat Model (Constant gradual change)
    const rpmF = Math.max(0, this.current.rpm / 6000);
    const isRunning = this.current.rpm > 500;
    
    let targetOilTemp = ambTemp;
    let targetCht = ambTemp;
    let targetEgt = ambTemp;
    
    if (isRunning) {
      targetOilTemp = ambTemp + 50 + (rpmF * 40) + ((load/100) * 30);
      targetCht = ambTemp + 70 + (rpmF * 60) + ((load/100) * 20);
      targetEgt = ambTemp + 400 + (rpmF * 300) + ((load/100) * 150);
    }
    
    // Slow cooling/heating
    this.current.oilTemp += (targetOilTemp - this.current.oilTemp) * 0.002;
    this.current.cht += (targetCht - this.current.cht) * 0.005;
    this.current.egt += (targetEgt - this.current.egt) * 0.02; // EGT reacts faster
    
    // Other outputs
    this.current.torque = (this.current.rpm > 500) ? (throttle * 1.5) : 0;
    this.current.currentDraw = (state === 'STARTING') ? 150 : (5 + (load/100)*20);
    this.current.loadPct = load;
    this.current.map = 101 - (alt/1000) * 10 + (throttle/100) * 5; // Simplified MAP
    this.current.lambda = 1.0 - (throttle/100)*0.1;

    return { ...this.current };
  }
}
""")

# 4. Simulation Loop
write("simulation/SimulationLoop.ts", """
import { useEngineStore } from '../store/EngineStore';
import { EnginePhysics } from './EnginePhysics';

class SimulationLoop {
  private timer: any = null;
  private physics = new EnginePhysics();
  
  public start() {
    if (this.timer) return;
    // 10Hz = 100ms
    this.timer = setInterval(() => this.update(), 100);
  }
  
  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  private update() {
    const store = useEngineStore.getState();
    const dt = 0.1; // 100ms
    
    const newTelemetry = this.physics.tick(
      store.engineState,
      store.throttle,
      store.baseLoad,
      store.altitude,
      store.ambientTemp,
      dt
    );
    
    useEngineStore.getState().updateTelemetry(newTelemetry);
  }
}

export const simulator = new SimulationLoop();
""")

# 5. UI Layout
write("app/layout.tsx", """
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = { title: 'UAV Engine Simulator Core' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#050505] text-slate-200 antialiased`}>
        <main className="p-4 max-w-[1600px] mx-auto min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
""")

# 6. Gauge Component (Animated)
write("components/gauges/Gauge.tsx", """
"use client";
import { motion } from 'framer-motion';

export function Gauge({ label, value, min, max, unit, dangerZone }: { label: string, value: number, min: number, max: number, unit: string, dangerZone?: number }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  // Map 0-100% to -135deg to +135deg
  const rotation = -135 + (pct / 100) * 270;
  
  const isDanger = dangerZone !== undefined && value >= dangerZone;

  return (
    <div className="flex flex-col items-center bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-inner relative overflow-hidden">
      <div className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">{label}</div>
      <div className="w-24 h-24 rounded-full border-4 border-slate-800 relative flex items-center justify-center">
        {/* Danger zone tick */}
        {dangerZone && (
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-r-red-500/50 rotate-45"></div>
        )}
        {/* Center pin */}
        <div className="w-3 h-3 bg-slate-400 rounded-full z-10 shadow-lg"></div>
        {/* Needle */}
        <motion.div 
          className="absolute w-1 h-12 bg-red-500 origin-bottom bottom-12 rounded-t-full shadow-md z-0"
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', stiffness: 50, damping: 20, bounce: 0 }}
        />
      </div>
      <div className={`mt-3 text-xl font-mono font-bold ${isDanger ? 'text-red-500' : 'text-slate-100'}`}>
        {value.toFixed(0)} <span className="text-xs text-slate-500">{unit}</span>
      </div>
    </div>
  );
}
""")

# 7. Main Dashboard Page
write("app/page.tsx", """
"use client";
import { useEffect } from 'react';
import { useEngineStore } from '@/store/EngineStore';
import { simulator } from '@/simulation/SimulationLoop';
import { Gauge } from '@/components/gauges/Gauge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function EngineCoreDashboard() {
  const { engineState, throttle, baseLoad, altitude, ambientTemp, telemetry, history, setControl, setEngineState } = useEngineStore();

  useEffect(() => {
    simulator.start(); // Auto-start the 10Hz loop on mount
    return () => simulator.stop();
  }, []);

  const handleStartSequence = () => {
    if (engineState !== 'OFF' && engineState !== 'SHUTDOWN') return;
    setEngineState('STARTING');
    setTimeout(() => {
      setEngineState('IDLE');
    }, 2500); // 2.5s start sequence
  };

  const handleStop = () => {
    setEngineState('SHUTDOWN');
    setTimeout(() => setEngineState('OFF'), 3000);
  };

  const chartData = history.map((h, i) => ({
    time: i,
    rpm: h.rpm,
    egt: h.egt,
    oilTemp: h.oilTemp
  }));

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h1 className="text-xl font-bold tracking-widest text-slate-100 uppercase">UAV-PT-001 Engine Core</h1>
          <p className="text-sm text-slate-500 font-mono">10Hz PHYSICS SIMULATION ACTIVE</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 text-center min-w-[120px]">
            <div className="text-xs text-slate-500 uppercase">Status</div>
            <div className={`font-bold font-mono ${engineState === 'RUNNING' || engineState === 'IDLE' ? 'text-green-500' : engineState === 'STARTING' ? 'text-amber-500' : 'text-slate-400'}`}>
              {engineState}
            </div>
          </div>
          <button onClick={handleStartSequence} disabled={engineState !== 'OFF' && engineState !== 'SHUTDOWN'} className="px-6 py-3 bg-green-900/40 text-green-500 border border-green-900 hover:bg-green-800/60 font-bold rounded-lg disabled:opacity-30">START</button>
          <button onClick={handleStop} disabled={engineState === 'OFF' || engineState === 'SHUTDOWN'} className="px-6 py-3 bg-red-900/40 text-red-500 border border-red-900 hover:bg-red-800/60 font-bold rounded-lg disabled:opacity-30">STOP</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* LEFT: CONTROLS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Inputs</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-sm"><span>Throttle</span><span className="text-blue-400">{throttle}%</span></div>
            <input type="range" min="0" max="100" value={throttle} onChange={e => {
              setControl('throttle', +e.target.value);
              if (engineState === 'IDLE' && +e.target.value > 5) setEngineState('RUNNING');
              if (engineState === 'RUNNING' && +e.target.value <= 5) setEngineState('IDLE');
            }} className="w-full accent-blue-500" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between font-mono text-sm"><span>Engine Load</span><span className="text-blue-400">{baseLoad}%</span></div>
            <input type="range" min="0" max="100" value={baseLoad} onChange={e => {
              setControl('baseLoad', +e.target.value);
              if (engineState === 'RUNNING' && +e.target.value > 80) setEngineState('HIGH LOAD');
              else if (engineState === 'HIGH LOAD' && +e.target.value <= 80) setEngineState('RUNNING');
            }} className="w-full accent-blue-500" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between font-mono text-sm"><span>Altitude</span><span className="text-amber-400">{altitude} m</span></div>
            <input type="range" min="0" max="10000" step="100" value={altitude} onChange={e => setControl('altitude', +e.target.value)} className="w-full accent-amber-500" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between font-mono text-sm"><span>Ambient Temp</span><span className="text-amber-400">{ambientTemp} °C</span></div>
            <input type="range" min="-20" max="55" value={ambientTemp} onChange={e => setControl('ambientTemp', +e.target.value)} className="w-full accent-amber-500" />
          </div>
          
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg mt-6">
            <div className="text-xs text-slate-500 uppercase mb-2">Live Telemetry Raw</div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="text-slate-400">Torque: <span className="text-white">{telemetry.torque.toFixed(1)} Nm</span></div>
              <div className="text-slate-400">Fuel Flow: <span className="text-white">{telemetry.fuelFlow.toFixed(2)} LPH</span></div>
              <div className="text-slate-400">Battery: <span className="text-white">{telemetry.batteryV.toFixed(1)} V</span></div>
              <div className="text-slate-400">Current: <span className="text-white">{telemetry.currentDraw.toFixed(1)} A</span></div>
              <div className="text-slate-400">MAP: <span className="text-white">{telemetry.map.toFixed(1)} kPa</span></div>
              <div className="text-slate-400">Lambda: <span className="text-white">{telemetry.lambda.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        {/* MIDDLE: GAUGES */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 xl:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Instrument Panel</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <Gauge label="RPM" value={telemetry.rpm} min={0} max={6500} unit="RPM" dangerZone={6000} />
            <Gauge label="EGT" value={telemetry.egt} min={0} max={1000} unit="°C" dangerZone={900} />
            <Gauge label="CHT" value={telemetry.cht} min={0} max={200} unit="°C" dangerZone={150} />
            <Gauge label="Oil Temp" value={telemetry.oilTemp} min={0} max={150} unit="°C" dangerZone={120} />
            <Gauge label="Oil Press" value={telemetry.oilPress} min={0} max={100} unit="PSI" />
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="h-48 bg-slate-950 border border-slate-800 rounded-lg p-2">
              <div className="text-xs text-slate-500 uppercase ml-2 mt-1 absolute">RPM History</div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <YAxis domain={[0, 6500]} hide />
                  <Line type="monotone" dataKey="rpm" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-48 bg-slate-950 border border-slate-800 rounded-lg p-2">
              <div className="text-xs text-slate-500 uppercase ml-2 mt-1 absolute">EGT History</div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <YAxis domain={[0, 1000]} hide />
                  <Line type="monotone" dataKey="egt" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
""")
print("Engine Core Created")
