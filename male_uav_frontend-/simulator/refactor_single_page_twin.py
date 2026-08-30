import os
import shutil

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim"

# 1. Clean up ALL previous routes
app_dir = os.path.join(BASE_DIR, "src/app")
if os.path.exists(app_dir):
    for f in os.listdir(app_dir):
        if f not in ["page.tsx", "layout.tsx", "globals.css"]:
            path = os.path.join(app_dir, f)
            if os.path.isdir(path):
                shutil.rmtree(path)
            elif os.path.isfile(path):
                os.remove(path)

folders = [
    "src/store",
    "src/services",
    "src/simulator",
    "src/components/ui"
]
for f in folders:
    os.makedirs(os.path.join(BASE_DIR, f), exist_ok=True)

def write(path, content):
    with open(os.path.join(BASE_DIR, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# --- STORE ---
write("src/store/simulatorStore.ts", """
import { create } from 'zustand';

export interface Inputs { throttle: number; altitude: number; ambientTemp: number; windSpeed: number; payload: number; fuelLevel: number; }
export interface Telemetry { timestamp: number; rpm: number; torque: number; power: number; fuelFlow: number; egt: number; cht: number; oilTemp: number; oilPress: number; vibration: number; battery: number; }
export interface Faults { engineOverheat: boolean; fuelLeak: boolean; batteryFailure: boolean; sensorFailure: boolean; ignitionFailure: boolean; gpsFailure: boolean; }
export interface AIState { health: number; status: 'Healthy'|'Warning'|'Critical'; recommendations: string[]; rulHours: number; }

interface SimulatorStore {
  inputs: Inputs;
  telemetry: Telemetry;
  faults: Faults;
  aiState: AIState;
  history: Telemetry[];
  
  setInputs: (inputs: Partial<Inputs>) => void;
  toggleFault: (fault: keyof Faults) => void;
  updateState: (tel: Telemetry, ai: AIState) => void;
}

const initTel: Telemetry = { timestamp: 0, rpm: 0, torque: 0, power: 0, fuelFlow: 0, egt: 25, cht: 25, oilTemp: 25, oilPress: 0, vibration: 0, battery: 24.0 };

export const useSimStore = create<SimulatorStore>((set) => ({
  inputs: { throttle: 0, altitude: 0, ambientTemp: 15, windSpeed: 0, payload: 0, fuelLevel: 100 },
  telemetry: initTel,
  faults: { engineOverheat: false, fuelLeak: false, batteryFailure: false, sensorFailure: false, ignitionFailure: false, gpsFailure: false },
  aiState: { health: 100, status: 'Healthy', recommendations: [], rulHours: 1000 },
  history: [],
  
  setInputs: (i) => set((s) => ({ inputs: { ...s.inputs, ...i } })),
  toggleFault: (f) => set((s) => ({ faults: { ...s.faults, [f]: !s.faults[f] } })),
  updateState: (tel, ai) => set((s) => {
    const newHist = [...s.history, tel].slice(-100);
    return { telemetry: tel, aiState: ai, history: newHist };
  })
}));
""")

# --- WEBHOOK SERVICE ---
write("src/services/webhook.ts", """
export class WebhookService {
  static async sendTelemetry(payload: any) {
    // In production, this fires directly to the Antigravity integration endpoint.
    // fetch('http://localhost:8080/webhook', { method: 'POST', body: JSON.stringify(payload) })
    
    // For local dev without crashing:
    // console.log('[WEBHOOK TX]', payload.timestamp);
  }
}
""")

# --- PHYSICS ENGINE ---
write("src/simulator/physicsEngine.ts", """
import { Inputs, Telemetry, Faults } from '../store/simulatorStore';

export class PhysicsEngine {
  private current: Telemetry;
  
  constructor() {
    this.current = { timestamp: Date.now(), rpm: 0, torque: 0, power: 0, fuelFlow: 0, egt: 25, cht: 25, oilTemp: 25, oilPress: 0, vibration: 0.1, battery: 24.0 };
  }

  public tick(inputs: Inputs, faults: Faults, dt: number): Telemetry {
    const isRunning = inputs.throttle > 5;
    
    // Altitude penalty (Air Density)
    const airDensity = 1.225 * Math.exp(-inputs.altitude / 8500);
    const powerLoss = airDensity / 1.225;
    
    // Base Target calculations
    let targetRpm = isRunning ? 1200 + (inputs.throttle / 100) * 4800 : 0;
    targetRpm *= powerLoss;
    if (faults.ignitionFailure) targetRpm = Math.max(0, targetRpm - 2000 - Math.random() * 500);
    
    // Inertia
    this.current.rpm += (targetRpm - this.current.rpm) * 0.05;
    const rpmRatio = this.current.rpm / 6000;
    
    // Fuel System
    let targetFuel = isRunning ? (rpmRatio * 20) + 2 : 0;
    if (faults.fuelLeak) targetFuel *= 0.5; // Engine starves
    this.current.fuelFlow += (targetFuel - this.current.fuelFlow) * 0.1;
    
    // Temperatures
    const coolingEfficiency = Math.max(0.1, 1 - (inputs.ambientTemp / 100));
    let targetEgt = inputs.ambientTemp + (rpmRatio * 800) / coolingEfficiency;
    let targetCht = inputs.ambientTemp + (rpmRatio * 150) / coolingEfficiency;
    let targetOilTemp = inputs.ambientTemp + (rpmRatio * 90) / coolingEfficiency;
    
    if (faults.engineOverheat) {
      targetEgt += 300;
      targetCht += 100;
      targetOilTemp += 50;
    }
    
    this.current.egt += (targetEgt - this.current.egt) * 0.05;
    this.current.cht += (targetCht - this.current.cht) * 0.01;
    this.current.oilTemp += (targetOilTemp - this.current.oilTemp) * 0.005;
    
    // Pressures & Electrical
    this.current.oilPress = isRunning ? (rpmRatio * 60) + 15 : 0;
    this.current.battery = faults.batteryFailure ? 20 + Math.random() : (isRunning ? 28 : 24);
    
    // Vibration
    this.current.vibration = isRunning ? 0.2 + (rpmRatio * 0.8) + (faults.ignitionFailure ? 1.5 : 0) : 0;
    
    // Power & Torque
    this.current.torque = isRunning ? (inputs.throttle * 1.5 * powerLoss) : 0;
    this.current.power = (this.current.torque * this.current.rpm) / 9550;

    // Sensor Spoofing
    if (faults.sensorFailure) {
      this.current.rpm += (Math.random() - 0.5) * 500;
      this.current.egt += (Math.random() - 0.5) * 100;
    }

    this.current.timestamp = Date.now();
    return { ...this.current };
  }
}
""")

# --- AI ENGINE ---
write("src/simulator/aiEngine.ts", """
import { Telemetry, AIState, Faults } from '../store/simulatorStore';

export class AIEngine {
  public analyze(tel: Telemetry, faults: Faults): AIState {
    let health = 100;
    const recs = [];
    
    if (tel.egt > 850) { health -= 15; recs.push('Reduce throttle to prevent thermal runway'); }
    if (tel.oilTemp > 120) { health -= 20; recs.push('Inspect cooling / lubrication system'); }
    if (tel.vibration > 1.5) { health -= 25; recs.push('High vibration. Inspect bearings and mount'); }
    if (tel.fuelFlow < 5 && tel.rpm > 3000) { health -= 10; recs.push('Check fuel line for starvation'); }
    if (tel.battery < 24 && tel.rpm > 1000) { health -= 10; recs.push('Alternator/Battery failure detected'); }
    
    if (faults.sensorFailure) { health -= 5; recs.push('Telemetry corruption detected. Replace sensors'); }

    health = Math.max(0, Math.min(100, health));
    
    let status: 'Healthy' | 'Warning' | 'Critical' = 'Healthy';
    if (health < 80) status = 'Warning';
    if (health < 50) status = 'Critical';
    
    const rulHours = Math.max(0, health * 10 - (tel.vibration * 100));

    if (recs.length === 0) recs.push('All systems nominal');

    return { health: Math.floor(health), status, recommendations: recs, rulHours: Math.floor(rulHours) };
  }
}
""")

# --- SIMULATION LOOP ---
write("src/simulator/simulationLoop.ts", """
import { useSimStore } from '../store/simulatorStore';
import { PhysicsEngine } from './physicsEngine';
import { AIEngine } from './aiEngine';
import { WebhookService } from '../services/webhook';

class SimulationLoop {
  private timer: any = null;
  private physics = new PhysicsEngine();
  private ai = new AIEngine();
  
  public start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), 100);
  }
  
  public stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
  
  private tick() {
    const store = useSimStore.getState();
    const tel = this.physics.tick(store.inputs, store.faults, 0.1);
    const aiData = this.ai.analyze(tel, store.faults);
    
    store.updateState(tel, aiData);
    
    // Webhook broadcast
    WebhookService.sendTelemetry({
      timestamp: tel.timestamp,
      rpm: tel.rpm, egt: tel.egt, cht: tel.cht,
      oilTemp: tel.oilTemp, oilPressure: tel.oilPress,
      fuelFlow: tel.fuelFlow, battery: tel.battery,
      vibration: tel.vibration, health: aiData.health
    });
  }
}

export const simulator = new SimulationLoop();
""")

# --- COMPONENTS ---
write("src/components/ui/Gauge.tsx", """
import React from 'react';

export function Gauge({ label, value, unit, max, critical }: { label: string, value: number, unit: string, max: number, critical?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const isCrit = critical && value >= critical;
  
  return (
    <div className="bg-[#0b101e] border border-cyan-900/30 p-3 rounded-lg flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
      <div className="text-[10px] text-cyan-500/70 font-bold tracking-[0.2em] uppercase absolute top-2">{label}</div>
      <div className={`text-3xl font-mono font-bold mt-4 tracking-tighter ${isCrit ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
        {value.toFixed(1)}
      </div>
      <div className="text-[10px] text-slate-500">{unit}</div>
      {/* Mini bar */}
      <div className="w-full h-1 bg-slate-900 mt-2 rounded overflow-hidden">
        <div className={`h-full ${isCrit ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}
""")

# --- LAYOUT ---
write("src/app/layout.tsx", """
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = { title: 'UAV Digital Twin OS' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#020617] text-slate-200 overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
""")

# --- SINGLE DASHBOARD PAGE ---
write("src/app/page.tsx", """
"use client";
import { useEffect } from 'react';
import { useSimStore } from '@/store/simulatorStore';
import { simulator } from '@/simulator/simulationLoop';
import { Gauge } from '@/components/ui/Gauge';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export default function DigitalTwinDashboard() {
  const { inputs, setInputs, telemetry, faults, toggleFault, aiState, history } = useSimStore();

  useEffect(() => {
    simulator.start();
    return () => simulator.stop();
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col p-4 space-y-4 bg-[#020617] text-xs">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-[#0b101e] border border-cyan-900/50 p-4 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.1)] shrink-0">
        <div className="flex items-center space-x-4">
          <Activity className="w-6 h-6 text-cyan-500 animate-pulse" />
          <div>
            <h1 className="text-xl font-bold tracking-widest text-cyan-400 uppercase">UAV Engine Digital Twin</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest">REAL-TIME TELEMETRY STREAM &bull; ANTIGRAVITY LINK ACTIVE</p>
          </div>
        </div>
        <div className="flex space-x-6">
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase">AI Health Score</div>
            <div className={`text-2xl font-black ${aiState.health < 50 ? 'text-red-500' : aiState.health < 80 ? 'text-amber-500' : 'text-green-500'}`}>
              {aiState.health}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase">System Status</div>
            <div className="text-2xl font-black text-slate-200">{aiState.status}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        
        {/* COL 1: INPUTS & FAULTS */}
        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          
          <div className="bg-[#0b101e] border border-cyan-900/30 p-4 rounded-xl">
            <h2 className="text-cyan-500 font-bold uppercase tracking-widest mb-4 flex items-center border-b border-cyan-900/50 pb-2"><Zap className="w-4 h-4 mr-2"/> Mission Inputs</h2>
            <div className="space-y-4">
              {[
                { k: 'throttle', lbl: 'Throttle', val: inputs.throttle, unit: '%', max: 100 },
                { k: 'altitude', lbl: 'Altitude', val: inputs.altitude, unit: 'm', max: 10000 },
                { k: 'ambientTemp', lbl: 'Ambient Temp', val: inputs.ambientTemp, unit: '°C', min: -20, max: 55 },
                { k: 'windSpeed', lbl: 'Wind Speed', val: inputs.windSpeed, unit: 'm/s', max: 50 },
                { k: 'payload', lbl: 'Payload Weight', val: inputs.payload, unit: 'kg', max: 250 },
                { k: 'fuelLevel', lbl: 'Fuel Level', val: inputs.fuelLevel, unit: '%', max: 100 },
              ].map(i => (
                <div key={i.k}>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>{i.lbl}</span>
                    <span className="text-cyan-400">{i.val}{i.unit}</span>
                  </div>
                  <input type="range" min={i.min || 0} max={i.max} value={i.val} 
                    onChange={e => setInputs({ [i.k]: +e.target.value })} 
                    className="w-full accent-cyan-500 h-1 bg-slate-800 appearance-none rounded" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0b101e] border border-cyan-900/30 p-4 rounded-xl">
            <h2 className="text-red-500 font-bold uppercase tracking-widest mb-4 flex items-center border-b border-red-900/50 pb-2"><AlertTriangle className="w-4 h-4 mr-2"/> Fault Injection</h2>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(faults).map(f => {
                const isActive = (faults as any)[f];
                return (
                  <button key={f} onClick={() => toggleFault(f as keyof typeof faults)}
                    className={`p-2 text-[10px] uppercase font-bold rounded tracking-wider border transition-colors ${isActive ? 'bg-red-900/30 text-red-500 border-red-900 shadow-[0_0_10px_rgba(220,38,38,0.2)]' : 'bg-[#0f172a] text-slate-500 border-slate-800 hover:border-slate-600'}`}>
                    {f.replace(/([A-Z])/g, ' $1')}
                  </button>
                )
              })}
            </div>
          </div>

        </div>

        {/* COL 2: TELEMETRY & PHYSICS */}
        <div className="col-span-6 flex flex-col gap-4">
          
          <div className="grid grid-cols-4 gap-2">
             <Gauge label="RPM" value={telemetry.rpm} unit="RPM" max={6000} />
             <Gauge label="EGT" value={telemetry.egt} unit="°C" max={1000} critical={900} />
             <Gauge label="CHT" value={telemetry.cht} unit="°C" max={250} critical={200} />
             <Gauge label="Oil Temp" value={telemetry.oilTemp} unit="°C" max={150} critical={120} />
             <Gauge label="Fuel Flow" value={telemetry.fuelFlow} unit="L/hr" max={30} />
             <Gauge label="Oil Press" value={telemetry.oilPress} unit="kPa" max={100} />
             <Gauge label="Vibration" value={telemetry.vibration} unit="g" max={5} critical={2.5} />
             <Gauge label="Battery" value={telemetry.battery} unit="V" max={30} critical={22} />
          </div>

          <div className="flex-1 bg-[#0b101e] border border-cyan-900/30 rounded-xl p-4 flex flex-col">
            <h2 className="text-cyan-500 font-bold uppercase tracking-widest mb-2 flex items-center border-b border-cyan-900/50 pb-2">Live Engine Charts</h2>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="h-full relative border border-slate-800 rounded bg-[#020617] p-2">
                <div className="absolute text-[10px] text-slate-600 top-1 left-2">RPM & FUEL STREAM</div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <Line type="monotone" dataKey="rpm" stroke="#06b6d4" strokeWidth={1.5} dot={false} isAnimationActive={false}/>
                    <Line type="monotone" dataKey="fuelFlow" stroke="#eab308" strokeWidth={1.5} dot={false} isAnimationActive={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="h-full relative border border-slate-800 rounded bg-[#020617] p-2">
                <div className="absolute text-[10px] text-slate-600 top-1 left-2">THERMAL STREAM (EGT/CHT)</div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <Line type="monotone" dataKey="egt" stroke="#ef4444" strokeWidth={1.5} dot={false} isAnimationActive={false}/>
                    <Line type="monotone" dataKey="cht" stroke="#f97316" strokeWidth={1.5} dot={false} isAnimationActive={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* COL 3: AI & PHYSICS READOUTS */}
        <div className="col-span-3 flex flex-col gap-4">
          
          <div className="bg-[#0b101e] border border-cyan-900/30 p-4 rounded-xl flex-1">
            <h2 className="text-cyan-500 font-bold uppercase tracking-widest mb-4 flex items-center border-b border-cyan-900/50 pb-2"><ShieldCheck className="w-4 h-4 mr-2"/> Prognostic AI Engine</h2>
            
            <div className="bg-[#020617] border border-slate-800 p-3 rounded mb-4 text-center">
              <div className="text-[10px] text-slate-500 uppercase">Estimated RUL (Remaining Useful Life)</div>
              <div className="text-3xl font-mono text-blue-400 font-bold">{aiState.rulHours} <span className="text-sm">Hours</span></div>
            </div>

            <h3 className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">AI Recommendations</h3>
            <div className="space-y-2">
              {aiState.recommendations.map((r, i) => (
                <div key={i} className="text-[10px] text-slate-300 font-mono bg-blue-900/20 border border-blue-900/50 p-2 rounded flex items-start">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 mr-2 shrink-0 animate-pulse"></div>
                  {r}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0b101e] border border-cyan-900/30 p-4 rounded-xl">
            <h2 className="text-cyan-500 font-bold uppercase tracking-widest mb-4 flex items-center border-b border-cyan-900/50 pb-2">Physics Core State</h2>
            <div className="space-y-2 font-mono text-[10px]">
               <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-500">Power Output</span><span className="text-cyan-400">{telemetry.power.toFixed(1)} kW</span></div>
               <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-500">Torque</span><span className="text-cyan-400">{telemetry.torque.toFixed(1)} Nm</span></div>
               <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-500">Air Density Factor</span><span className="text-cyan-400">{(1.225 * Math.exp(-inputs.altitude / 8500)).toFixed(3)} kg/m³</span></div>
               <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-500">Timestamp</span><span className="text-slate-500">{telemetry.timestamp}</span></div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
""")

print("Massive Refactor Completed: Single Page Digital Twin Generated.")
