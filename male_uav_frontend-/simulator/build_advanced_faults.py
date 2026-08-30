import os

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim"

def write(path, content):
    with open(os.path.join(BASE_DIR, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# --- UPDATE STORE ---
write("src/store/simulatorStore.ts", """
import { create } from 'zustand';

export interface Inputs { throttle: number; altitude: number; ambientTemp: number; windSpeed: number; payload: number; fuelLevel: number; }
export interface Telemetry { timestamp: number; rpm: number; torque: number; power: number; fuelFlow: number; egt: number; cht: number; oilTemp: number; oilPress: number; vibration: number; battery: number; }
export type FaultSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export interface ActiveFault { id: string; type: string; severity: FaultSeverity; intensity: number; category: string; }
export interface AIState { health: number; status: 'Healthy'|'Warning'|'Critical'; recommendations: string[]; rulHours: number; }

export const FAULT_DEFINITIONS = {
  LUBRICATION: ['Oil Leak', 'Oil Pump Failure'],
  FUEL: ['Fuel Leak', 'Injector Blockage', 'Fuel Pump Degradation'],
  COMBUSTION: ['Spark Plug Failure', 'Compression Loss'],
  COOLING: ['Cooling Fan Failure', 'Radiator Efficiency Loss'],
  ELECTRICAL: ['Battery Failure', 'Alternator Failure'],
  SENSOR: ['RPM Sensor Failure', 'EGT Sensor Failure', 'CHT Sensor Failure'],
  MECHANICAL: ['Bearing Wear', 'Crankshaft Imbalance', 'Valve Timing Drift'],
  TURBO: ['Turbo Lag', 'Turbo Failure'],
  INTAKE: ['Air Filter Blockage', 'Intake Leak'],
  PROPELLER: ['Propeller Damage']
};

interface SimulatorStore {
  inputs: Inputs;
  telemetry: Telemetry;
  activeFaults: ActiveFault[];
  aiState: AIState;
  history: Telemetry[];
  
  setInputs: (inputs: Partial<Inputs>) => void;
  addFault: (type: string, severity: FaultSeverity, category: string) => void;
  removeFault: (id: string) => void;
  updateFaultIntensities: (dt: number) => void;
  updateState: (tel: Telemetry, ai: AIState) => void;
}

const initTel: Telemetry = { timestamp: 0, rpm: 0, torque: 0, power: 0, fuelFlow: 0, egt: 25, cht: 25, oilTemp: 25, oilPress: 0, vibration: 0, battery: 24.0 };

export const useSimStore = create<SimulatorStore>((set) => ({
  inputs: { throttle: 0, altitude: 0, ambientTemp: 15, windSpeed: 0, payload: 0, fuelLevel: 100 },
  telemetry: initTel,
  activeFaults: [],
  aiState: { health: 100, status: 'Healthy', recommendations: [], rulHours: 1000 },
  history: [],
  
  setInputs: (i) => set((s) => ({ inputs: { ...s.inputs, ...i } })),
  addFault: (type, severity, category) => set((s) => ({ activeFaults: [...s.activeFaults, { id: Math.random().toString(), type, severity, intensity: 0.01, category }] })),
  removeFault: (id) => set((s) => ({ activeFaults: s.activeFaults.filter(f => f.id !== id) })),
  
  updateFaultIntensities: (dt) => set((s) => ({
    activeFaults: s.activeFaults.map(f => {
      let rate = 0.005;
      if (f.severity === 'MEDIUM') rate = 0.01;
      if (f.severity === 'HIGH') rate = 0.03;
      if (f.severity === 'CRITICAL') rate = 0.1;
      return { ...f, intensity: Math.min(1.0, f.intensity + rate * dt) };
    })
  })),

  updateState: (tel, ai) => set((s) => {
    const newHist = [...s.history, tel].slice(-100);
    return { telemetry: tel, aiState: ai, history: newHist };
  })
}));
""")

# --- FAULT PROPAGATION IN PHYSICS ---
write("src/simulator/physicsEngine.ts", """
import { Inputs, Telemetry, ActiveFault } from '../store/simulatorStore';

export class PhysicsEngine {
  private current: Telemetry;
  private timeSum = 0;
  
  constructor() {
    this.current = { timestamp: Date.now(), rpm: 0, torque: 0, power: 0, fuelFlow: 0, egt: 25, cht: 25, oilTemp: 25, oilPress: 0, vibration: 0.1, battery: 24.0 };
  }

  public tick(inputs: Inputs, faults: ActiveFault[], dt: number): Telemetry {
    this.timeSum += dt;
    const isRunning = inputs.throttle > 5;
    
    // Aggregate fault intensities
    let F = { oilLeak: 0, oilPump: 0, fuelLeak: 0, injector: 0, fuelPump: 0, spark: 0, comp: 0, cooling: 0, 
              batt: 0, alt: 0, rpmSens: 0, egtSens: 0, chtSens: 0, bearing: 0, crank: 0, valve: 0,
              turboFail: 0, turboLag: 0, intake: 0, prop: 0 };
              
    faults.forEach(f => {
      const i = f.intensity;
      if (f.type === 'Oil Leak') F.oilLeak = i;
      if (f.type === 'Oil Pump Failure') F.oilPump = i;
      if (f.type === 'Fuel Leak') F.fuelLeak = i;
      if (f.type === 'Injector Blockage') F.injector = i;
      if (f.type === 'Fuel Pump Degradation') F.fuelPump = i;
      if (f.type === 'Spark Plug Failure') F.spark = i;
      if (f.type === 'Compression Loss') F.comp = i;
      if (f.type === 'Cooling Fan Failure') F.cooling = i;
      if (f.type === 'Radiator Efficiency Loss') F.cooling = Math.max(F.cooling, i * 0.5);
      if (f.type === 'Battery Failure') F.batt = i;
      if (f.type === 'Alternator Failure') F.alt = i;
      if (f.type === 'RPM Sensor Failure') F.rpmSens = i;
      if (f.type === 'EGT Sensor Failure') F.egtSens = i;
      if (f.type === 'CHT Sensor Failure') F.chtSens = i;
      if (f.type === 'Bearing Wear') F.bearing = i;
      if (f.type === 'Crankshaft Imbalance') F.crank = i;
      if (f.type === 'Valve Timing Drift') F.valve = i;
      if (f.type === 'Turbo Failure') F.turboFail = i;
      if (f.type === 'Turbo Lag') F.turboLag = i;
      if (f.type === 'Air Filter Blockage') F.intake = i;
      if (f.type === 'Propeller Damage') F.prop = i;
    });

    // Altitude penalty
    const airDensity = 1.225 * Math.exp(-inputs.altitude / 8500);
    const powerLoss = airDensity / 1.225;
    
    // Base Target RPM
    let targetRpm = isRunning ? 1200 + (inputs.throttle / 100) * 4800 : 0;
    targetRpm *= powerLoss;
    targetRpm -= (F.comp * 1000) + (F.valve * 800) + (F.turboFail * 1200) + (F.intake * 600) + (F.prop * 500) + (F.fuelPump * 800);
    if (F.spark > 0) targetRpm -= (F.spark * 1500) * Math.random(); // Rough running
    if (F.injector > 0) targetRpm -= (F.injector * 1000) * Math.random();
    
    targetRpm = Math.max(0, targetRpm);
    
    // Inertia (Lag injected here)
    const inertia = 0.05 - (F.turboLag * 0.03); 
    this.current.rpm += (targetRpm - this.current.rpm) * inertia;
    const rpmRatio = this.current.rpm / 6000;
    
    // Fuel System
    let targetFuel = isRunning ? (rpmRatio * 20) + 2 : 0;
    if (F.fuelLeak > 0) targetFuel += (F.fuelLeak * 15); // Leak increases flow from tank
    if (F.intake > 0) targetFuel *= (1 + F.intake * 0.5); // Rich burn
    this.current.fuelFlow += (targetFuel - this.current.fuelFlow) * 0.1;
    
    // PROPAGATION: Oil Leak -> Oil Press Loss -> Bearing Wear -> Vibration -> Heat
    // Oil Press
    let targetOilPress = isRunning ? (rpmRatio * 60) + 15 : 0;
    targetOilPress -= (F.oilLeak * 50) + (F.oilPump * 70);
    targetOilPress = Math.max(0, targetOilPress);
    this.current.oilPress += (targetOilPress - this.current.oilPress) * 0.1;
    
    // Dynamic Bearing Wear from Oil Starvation
    if (isRunning && this.current.oilPress < 15) {
        F.bearing = Math.min(1.0, F.bearing + 0.01); 
    }

    // Temperatures
    const coolingEfficiency = Math.max(0.1, 1 - (inputs.ambientTemp / 100) - F.cooling);
    let targetEgt = inputs.ambientTemp + (rpmRatio * 800) / coolingEfficiency;
    let targetCht = inputs.ambientTemp + (rpmRatio * 150) / coolingEfficiency;
    let targetOilTemp = inputs.ambientTemp + (rpmRatio * 90) / coolingEfficiency;
    
    // Thermal Fault additions
    targetEgt += (F.injector * 200) + (F.spark * 150) + (F.intake * 100);
    targetOilTemp += (F.bearing * 80) + ((1 - this.current.oilPress/75) * 50); // Less oil = more heat
    targetCht += (F.bearing * 60) + (F.cooling * 120);
    
    this.current.egt += (targetEgt - this.current.egt) * 0.05;
    this.current.cht += (targetCht - this.current.cht) * 0.01;
    this.current.oilTemp += (targetOilTemp - this.current.oilTemp) * 0.005;
    
    // Electrical
    let targetBatt = isRunning ? 28 : 24;
    if (F.alt > 0) targetBatt -= (F.alt * 6);
    if (F.batt > 0) targetBatt -= (F.batt * 10);
    this.current.battery += (targetBatt - this.current.battery) * 0.02;
    
    // Vibration
    let targetVib = isRunning ? 0.2 + (rpmRatio * 0.8) : 0;
    targetVib += (F.bearing * 4) + (F.crank * 6) + (F.prop * 5) + (F.spark * 2 * Math.random());
    this.current.vibration += (targetVib - this.current.vibration) * 0.1;
    
    // Power & Torque
    this.current.torque = isRunning ? (inputs.throttle * 1.5 * powerLoss) * (1 - F.comp) * (1 - F.valve) : 0;
    this.current.power = (this.current.torque * this.current.rpm) / 9550;

    // SENSOR FAILURES (Overrides displayed telemetry)
    let dispRpm = this.current.rpm;
    let dispEgt = this.current.egt;
    let dispCht = this.current.cht;
    
    if (F.rpmSens > 0.5) dispRpm = Math.sin(this.timeSum) > 0 ? 0 : this.current.rpm + Math.random()*2000;
    if (F.egtSens > 0.5) dispEgt = this.current.egt + (Math.random()-0.5)*500;
    if (F.chtSens > 0.5) dispCht = 0; // Frozen

    this.current.timestamp = Date.now();
    
    return { ...this.current, rpm: dispRpm, egt: dispEgt, cht: dispCht };
  }
}
""")

# --- AI HEALTH ---
write("src/simulator/aiEngine.ts", """
import { Telemetry, AIState, ActiveFault } from '../store/simulatorStore';

export class AIEngine {
  public analyze(tel: Telemetry, faults: ActiveFault[]): AIState {
    let health = 100;
    const recs: string[] = [];
    
    // Telemetry bounds
    if (tel.egt > 850) { health -= 15; recs.push('Reduce throttle to prevent thermal runway'); }
    if (tel.oilTemp > 120) { health -= 20; recs.push('Inspect cooling / lubrication system'); }
    if (tel.oilPress < 20 && tel.rpm > 1000) { health -= 30; recs.push('Critical: Low Oil Pressure. Check for leaks.'); }
    if (tel.vibration > 2.0) { health -= 25; recs.push('High vibration. Inspect bearings/propeller.'); }
    if (tel.battery < 24 && tel.rpm > 1000) { health -= 10; recs.push('Alternator/Battery output low.'); }
    
    // Active Fault impact
    faults.forEach(f => {
      health -= (f.intensity * 20);
      if (f.intensity > 0.5) recs.push(`Severe ${f.type} propagation detected.`);
    });

    health = Math.max(0, Math.floor(health));
    let status: 'Healthy' | 'Warning' | 'Critical' = 'Healthy';
    if (health < 80) status = 'Warning';
    if (health < 50) status = 'Critical';
    
    const rulHours = Math.max(0, (health * 10) - (tel.vibration * 50) - (tel.oilTemp > 115 ? 100 : 0));

    if (recs.length === 0) recs.push('All systems nominal');

    return { health: Math.floor(health), status, recommendations: Array.from(new Set(recs)), rulHours: Math.floor(rulHours) };
  }
}
""")

# --- SIM LOOP ---
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
    store.updateFaultIntensities(0.1); // Tick fault engine
    
    // Re-grab state since updateFaultIntensities just mutated it
    const activeFaults = useSimStore.getState().activeFaults;
    const tel = this.physics.tick(store.inputs, activeFaults, 0.1);
    const aiData = this.ai.analyze(tel, activeFaults);
    
    store.updateState(tel, aiData);
    
    WebhookService.sendTelemetry({
      timestamp: tel.timestamp, rpm: tel.rpm, egt: tel.egt, cht: tel.cht,
      oilTemp: tel.oilTemp, oilPressure: tel.oilPress, fuelFlow: tel.fuelFlow, battery: tel.battery,
      vibration: tel.vibration, health: aiData.health
    });
  }
}

export const simulator = new SimulationLoop();
""")

# --- UI APP PAGE ---
write("src/app/page.tsx", """
"use client";
import { useEffect, useState } from 'react';
import { useSimStore, FAULT_DEFINITIONS, FaultSeverity } from '@/store/simulatorStore';
import { simulator } from '@/simulator/simulationLoop';
import { Gauge } from '@/components/ui/Gauge';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export default function DigitalTwinDashboard() {
  const { inputs, setInputs, telemetry, activeFaults, addFault, removeFault, aiState, history } = useSimStore();
  
  const [cat, setCat] = useState(Object.keys(FAULT_DEFINITIONS)[0]);
  const [fType, setFType] = useState(FAULT_DEFINITIONS['LUBRICATION' as keyof typeof FAULT_DEFINITIONS][0]);
  const [sev, setSev] = useState<FaultSeverity>('MEDIUM');

  useEffect(() => {
    simulator.start();
    return () => simulator.stop();
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col p-4 space-y-4 bg-[#020617] text-xs font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-[#0b101e] border border-cyan-900/50 p-4 rounded-xl shrink-0 shadow-lg">
        <div className="flex items-center space-x-4">
          <Activity className="w-6 h-6 text-cyan-500 animate-pulse" />
          <div>
            <h1 className="text-xl font-bold tracking-widest text-cyan-400 uppercase">Aero-Engine Digital Twin</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest">ADVANCED PROPAGATION SIMULATOR ACTIVE</p>
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
        
        {/* COL 1: INPUTS & FAULT INJECTION */}
        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto pr-2">
          
          <div className="bg-[#0b101e] border border-cyan-900/30 p-4 rounded-xl shrink-0">
            <h2 className="text-cyan-500 font-bold uppercase tracking-widest mb-4 flex items-center border-b border-cyan-900/50 pb-2"><Zap className="w-4 h-4 mr-2"/> Inputs</h2>
            <div className="space-y-4">
              {[
                { k: 'throttle', lbl: 'Throttle', val: inputs.throttle, unit: '%', max: 100 },
                { k: 'altitude', lbl: 'Altitude', val: inputs.altitude, unit: 'm', max: 10000 },
                { k: 'ambientTemp', lbl: 'Ambient Temp', val: inputs.ambientTemp, unit: '°C', min: -20, max: 55 },
              ].map(i => (
                <div key={i.k}>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>{i.lbl}</span><span className="text-cyan-400">{i.val}{i.unit}</span>
                  </div>
                  <input type="range" min={i.min || 0} max={i.max} value={i.val} onChange={e => setInputs({ [i.k]: +e.target.value })} className="w-full accent-cyan-500 h-1 bg-slate-800 appearance-none rounded" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0b101e] border border-red-900/50 p-4 rounded-xl flex-1 flex flex-col">
            <h2 className="text-red-500 font-bold uppercase tracking-widest mb-4 flex items-center border-b border-red-900/50 pb-2"><AlertTriangle className="w-4 h-4 mr-2"/> Advanced Failures</h2>
            
            <div className="space-y-3 shrink-0">
               <select value={cat} onChange={e => { setCat(e.target.value); setFType((FAULT_DEFINITIONS as any)[e.target.value][0]); }} className="w-full bg-[#020617] text-slate-300 border border-slate-800 p-2 rounded text-[10px] uppercase">
                 {Object.keys(FAULT_DEFINITIONS).map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               <select value={fType} onChange={e => setFType(e.target.value)} className="w-full bg-[#020617] text-slate-300 border border-slate-800 p-2 rounded text-[10px] uppercase">
                 {(FAULT_DEFINITIONS as any)[cat].map((f: string) => <option key={f} value={f}>{f}</option>)}
               </select>
               <div className="flex space-x-2">
                 <select value={sev} onChange={e => setSev(e.target.value as FaultSeverity)} className="flex-1 bg-[#020617] text-slate-300 border border-slate-800 p-2 rounded text-[10px] uppercase">
                   <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
                 </select>
                 <button onClick={() => addFault(fType, sev, cat)} className="flex-1 bg-red-900/50 text-red-400 border border-red-800 font-bold uppercase text-[10px] rounded hover:bg-red-800/60">Inject</button>
               </div>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-2">
               {activeFaults.map(f => (
                 <div key={f.id} className="bg-[#020617] border border-red-900/30 p-2 rounded relative overflow-hidden group">
                   <div className="flex justify-between items-center mb-2 z-10 relative">
                     <span className="font-bold text-red-500">{f.type}</span>
                     <button onClick={()=>removeFault(f.id)} className="text-slate-500 hover:text-white">X</button>
                   </div>
                   <div className="flex justify-between text-[9px] text-slate-400 z-10 relative">
                     <span>Sev: {f.severity}</span>
                     <span>Prog: {(f.intensity * 100).toFixed(0)}% | ETTF: {Math.max(0, (1-f.intensity)*60).toFixed(0)}m</span>
                   </div>
                   <div className="absolute bottom-0 left-0 h-0.5 bg-red-600" style={{ width: `${f.intensity*100}%` }}></div>
                 </div>
               ))}
            </div>

          </div>

        </div>

        {/* COL 2: TELEMETRY & PHYSICS */}
        <div className="col-span-6 flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-2 shrink-0">
             <Gauge label="RPM" value={telemetry.rpm} unit="RPM" max={6000} />
             <Gauge label="EGT" value={telemetry.egt} unit="°C" max={1000} critical={900} />
             <Gauge label="CHT" value={telemetry.cht} unit="°C" max={250} critical={200} />
             <Gauge label="Oil Temp" value={telemetry.oilTemp} unit="°C" max={150} critical={120} />
             <Gauge label="Fuel Flow" value={telemetry.fuelFlow} unit="L/hr" max={30} />
             <Gauge label="Oil Press" value={telemetry.oilPress} unit="kPa" max={100} critical={20} />
             <Gauge label="Vibration" value={telemetry.vibration} unit="g" max={8} critical={3} />
             <Gauge label="Battery" value={telemetry.battery} unit="V" max={30} critical={22} />
          </div>

          <div className="flex-1 bg-[#0b101e] border border-cyan-900/30 rounded-xl p-4 flex flex-col min-h-[150px]">
            <h2 className="text-cyan-500 font-bold uppercase tracking-widest mb-2 flex items-center border-b border-cyan-900/50 pb-2">Live Engine Streams</h2>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="h-full relative border border-slate-800 rounded bg-[#020617] p-2">
                <ResponsiveContainer width="100%" height="100%"><LineChart data={history}><Line type="monotone" dataKey="rpm" stroke="#06b6d4" strokeWidth={1.5} dot={false} isAnimationActive={false}/></LineChart></ResponsiveContainer>
              </div>
              <div className="h-full relative border border-slate-800 rounded bg-[#020617] p-2">
                <ResponsiveContainer width="100%" height="100%"><LineChart data={history}><Line type="monotone" dataKey="vibration" stroke="#f59e0b" strokeWidth={1.5} dot={false} isAnimationActive={false}/></LineChart></ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* COL 3: AI & PHYSICS READOUTS */}
        <div className="col-span-3 flex flex-col gap-4">
          <div className="bg-[#0b101e] border border-cyan-900/30 p-4 rounded-xl flex-1">
            <h2 className="text-cyan-500 font-bold uppercase tracking-widest mb-4 flex items-center border-b border-cyan-900/50 pb-2"><ShieldCheck className="w-4 h-4 mr-2"/> Prognostic AI</h2>
            <div className="bg-[#020617] border border-slate-800 p-3 rounded mb-4 text-center">
              <div className="text-[10px] text-slate-500 uppercase">Remaining Useful Life</div>
              <div className="text-3xl font-mono text-blue-400 font-bold">{aiState.rulHours} <span className="text-sm">Hours</span></div>
            </div>
            <h3 className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">AI Recommendations</h3>
            <div className="space-y-2 overflow-y-auto max-h-[200px]">
              {aiState.recommendations.map((r, i) => (
                <div key={i} className="text-[10px] text-slate-300 font-mono bg-blue-900/20 border border-blue-900/50 p-2 rounded flex items-start">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 mr-2 shrink-0 animate-pulse"></div>{r}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#0b101e] border border-cyan-900/30 p-4 rounded-xl shrink-0">
            <h2 className="text-cyan-500 font-bold uppercase tracking-widest mb-4 flex items-center border-b border-cyan-900/50 pb-2">Physics Core State</h2>
            <div className="space-y-2 font-mono text-[10px]">
               <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-500">Power Output</span><span className="text-cyan-400">{telemetry.power.toFixed(1)} kW</span></div>
               <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-500">Torque</span><span className="text-cyan-400">{telemetry.torque.toFixed(1)} Nm</span></div>
               <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-slate-500">Air Density</span><span className="text-cyan-400">{(1.225 * Math.exp(-inputs.altitude / 8500)).toFixed(3)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
""")
print("Advanced Fault injection system applied to single dashboard.")
