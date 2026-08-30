import os

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim/src"
SIM_DIR = os.path.join(BASE_DIR, "simulator")

folders = [
    "faults",
    "sensors",
    "events"
]

for f in folders:
    os.makedirs(os.path.join(SIM_DIR, f), exist_ok=True)

def write(path, content):
    with open(os.path.join(SIM_DIR, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

write("faults/faultTypes.ts", """
export type FaultSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EngineFaultType = 
  | 'MISFIRE'
  | 'INJECTOR_FAULT'
  | 'BEARING_WEAR'
  | 'OIL_LEAK'
  | 'COOLING_FAILURE'
  | 'COMBUSTION_INSTABILITY'
  | 'FUEL_SYSTEM_DEGRADATION';

export interface ActiveFault {
  id: string;
  type: EngineFaultType;
  severity: FaultSeverity;
  startTime: number; // seconds
  intensity: number; // 0 to 1 progression
}
""")

write("faults/faultEngine.ts", """
import { ActiveFault } from './faultTypes';
import { TelemetryFrame } from '../telemetry/telemetryTypes';

export class FaultEngine {
  public applyFaults(baseState: TelemetryFrame, faults: ActiveFault[], dt: number): TelemetryFrame {
    // Clone base state
    const state = { ...baseState };

    for (const fault of faults) {
      // Progress fault intensity slowly (0 to 1)
      if (fault.intensity < 1.0) {
         // Low severity grows slowly, critical grows fast
         const growthRate = fault.severity === 'LOW' ? 0.001 : fault.severity === 'MEDIUM' ? 0.005 : fault.severity === 'HIGH' ? 0.02 : 0.05;
         fault.intensity = Math.min(1.0, fault.intensity + growthRate * dt);
      }

      const f = fault.intensity;
      const s = fault.severity === 'LOW' ? 0.25 : fault.severity === 'MEDIUM' ? 0.5 : fault.severity === 'HIGH' ? 0.75 : 1.0;
      const factor = f * s;

      switch (fault.type) {
        case 'MISFIRE':
          state.rpm -= 200 * factor + (Math.random() * 50 * factor);
          state.power -= state.power * 0.1 * factor;
          state.egt += Math.sin(Date.now() / 1000) * 20 * factor;
          state.vibrationX += 0.2 * factor;
          break;
        case 'INJECTOR_FAULT':
          state.fuelFlow *= (1 + 0.2 * factor); // Runs rich or erratic
          state.lambda -= 0.1 * factor;
          state.egt += 30 * factor;
          state.power -= state.power * 0.15 * factor;
          break;
        case 'BEARING_WEAR':
          state.vibrationX += 0.5 * factor;
          state.vibrationY += 0.8 * factor;
          state.vibrationZ += 0.6 * factor;
          state.oilTemp += 15 * factor;
          state.power -= state.power * 0.05 * factor;
          break;
        case 'OIL_LEAK':
          state.oilPressure = Math.max(0, state.oilPressure - (150 * factor));
          state.oilTemp += 25 * factor;
          break;
        case 'COOLING_FAILURE':
          state.cht += 60 * factor;
          state.egt += 40 * factor;
          state.oilTemp += 30 * factor;
          break;
        case 'COMBUSTION_INSTABILITY':
          state.rpm += (Math.random() - 0.5) * 150 * factor;
          state.power += (Math.random() - 0.5) * 10 * factor;
          state.egt += (Math.random() - 0.5) * 40 * factor;
          break;
        case 'FUEL_SYSTEM_DEGRADATION':
          state.fuelFlow *= (1 + 0.15 * factor);
          state.power -= state.power * 0.08 * factor;
          state.lambda += 0.05 * factor;
          break;
      }
    }
    return state;
  }
}
""")

write("sensors/sensorModel.ts", """
import { TelemetryFrame } from '../telemetry/telemetryTypes';

export type SensorDriftType = 
  | 'RPM_SENSOR_DRIFT'
  | 'EGT_SENSOR_DRIFT'
  | 'CHT_SENSOR_DRIFT'
  | 'OIL_PRESSURE_SENSOR_DRIFT'
  | 'BATTERY_SENSOR_DRIFT';

export interface ActiveSensorDrift {
  id: string;
  type: SensorDriftType;
  driftValue: number;
}

export class SensorModel {
  // Gaussian noise approximation
  private noise(stdDev: number): number {
    return (Math.random() + Math.random() + Math.random() - 1.5) * stdDev;
  }

  public applySensors(faultState: TelemetryFrame, drifts: ActiveSensorDrift[], dt: number): TelemetryFrame {
    const state = { ...faultState };

    // 1. Add Gaussian Noise
    if (state.rpm > 0) {
      state.rpm += this.noise(5);
      state.egt += this.noise(2);
      state.cht += this.noise(1);
      state.oilPressure += this.noise(1);
      state.batteryVoltage += this.noise(0.05);
    }

    // 2. Apply Drifts
    for (const drift of drifts) {
      // increase drift slightly over time
      drift.driftValue += 0.1 * dt; 

      switch (drift.type) {
        case 'RPM_SENSOR_DRIFT':
          state.rpm += drift.driftValue * 10;
          break;
        case 'EGT_SENSOR_DRIFT':
          state.egt += drift.driftValue * 2;
          break;
        case 'CHT_SENSOR_DRIFT':
          state.cht += drift.driftValue;
          break;
        case 'OIL_PRESSURE_SENSOR_DRIFT':
          state.oilPressure -= drift.driftValue * 2; // drifts down
          break;
        case 'BATTERY_SENSOR_DRIFT':
          state.batteryVoltage -= drift.driftValue * 0.05;
          break;
      }
    }

    return state;
  }
}
""")

write("events/eventTypes.ts", """
export interface SimEvent {
  id: string;
  timestamp: number;
  eventType: 'FAULT_INJECTED' | 'FAULT_REMOVED' | 'SENSOR_DRIFT_STARTED' | 'SYSTEM_INFO';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  source: string;
  message: string;
}
""")

write("events/eventEngine.ts", """
import { SimEvent } from './eventTypes';
import { useSimulationStore } from '../state/simulationStore';

export class EventEngine {
  public log(eventType: SimEvent['eventType'], severity: SimEvent['severity'], source: string, message: string) {
    const ev: SimEvent = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      eventType,
      severity,
      source,
      message
    };
    useSimulationStore.getState().addEvent(ev);
  }
}
export const eventEngine = new EventEngine();
""")

# Re-write the simulator state to include faults and events
write("state/simulationStore.ts", """
import { create } from 'zustand';
import { TelemetryFrame } from '../telemetry/telemetryTypes';
import { ActiveFault } from '../faults/faultTypes';
import { ActiveSensorDrift } from '../sensors/sensorModel';
import { SimEvent } from '../events/eventTypes';

interface SimulationState {
    status: 'STOPPED' | 'RUNNING' | 'PAUSED';
    timeMultiplier: number;
    telemetryHistory: TelemetryFrame[];
    currentTelemetry: TelemetryFrame | null;
    
    activeFaults: ActiveFault[];
    activeDrifts: ActiveSensorDrift[];
    events: SimEvent[];
    
    setStatus: (status: 'STOPPED' | 'RUNNING' | 'PAUSED') => void;
    setTimeMultiplier: (multiplier: number) => void;
    addTelemetry: (frame: TelemetryFrame) => void;
    setTelemetry: (frames: TelemetryFrame[]) => void;
    
    addFault: (fault: ActiveFault) => void;
    removeFault: (id: string) => void;
    addDrift: (drift: ActiveSensorDrift) => void;
    addEvent: (event: SimEvent) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
    status: 'STOPPED',
    timeMultiplier: 1,
    telemetryHistory: [],
    currentTelemetry: null,
    
    activeFaults: [],
    activeDrifts: [],
    events: [],
    
    setStatus: (status) => set({ status }),
    setTimeMultiplier: (timeMultiplier) => set({ timeMultiplier }),
    addTelemetry: (frame) => set((state) => {
        const newHistory = [...state.telemetryHistory, frame].slice(-300);
        return {
            telemetryHistory: newHistory,
            currentTelemetry: frame
        };
    }),
    setTelemetry: (frames) => set({ telemetryHistory: frames, currentTelemetry: frames[frames.length - 1] || null }),
    
    addFault: (fault) => set((state) => ({ activeFaults: [...state.activeFaults, fault] })),
    removeFault: (id) => set((state) => ({ activeFaults: state.activeFaults.filter(f => f.id !== id) })),
    addDrift: (drift) => set((state) => ({ activeDrifts: [...state.activeDrifts, drift] })),
    addEvent: (event) => set((state) => ({ events: [event, ...state.events].slice(0, 100) }))
}));
""")

# Rewrite the SimulationEngine to include the pipeline
write("engine/SimulationEngine.ts", """
import { EnvironmentModel } from '../core/environment';
import { EnginePhysicsModel } from '../core/engine';
import { FuelModel } from '../core/fuel';
import { ThermalModel } from '../core/thermal';
import { ElectricalModel } from '../core/electrical';
import { VibrationModel } from '../core/vibration';
import { getMissionPhase } from '../mission/missionProfile';
import { TelemetryFrame } from '../telemetry/telemetryTypes';
import { useSimulationStore } from '../state/simulationStore';
import { FaultEngine } from '../faults/faultEngine';
import { SensorModel } from '../sensors/sensorModel';

export class SimulationEngine {
    private env = new EnvironmentModel();
    private engine = new EnginePhysicsModel();
    private fuel = new FuelModel();
    private thermal = new ThermalModel();
    private elec = new ElectricalModel();
    private vib = new VibrationModel();
    
    private faultEngine = new FaultEngine();
    private sensorModel = new SensorModel();

    private timeElapsed = 0;
    private isRunning = false;
    private timer: any = null;

    public start() {
        if(this.isRunning) return;
        this.isRunning = true;
        useSimulationStore.getState().setStatus('RUNNING');
        this.timer = setInterval(() => this.tick(), 1000);
    }

    public pause() {
        this.isRunning = false;
        useSimulationStore.getState().setStatus('PAUSED');
        if(this.timer) clearInterval(this.timer);
    }

    public reset() {
        this.pause();
        this.timeElapsed = 0;
        this.env = new EnvironmentModel();
        this.engine = new EnginePhysicsModel();
        this.fuel = new FuelModel();
        this.thermal = new ThermalModel();
        this.elec = new ElectricalModel();
        this.vib = new VibrationModel();
        useSimulationStore.getState().setStatus('STOPPED');
        useSimulationStore.getState().setTelemetry([]);
    }

    private tick() {
        const dt = 1;
        const timeMultiplier = useSimulationStore.getState().timeMultiplier;
        const state = useSimulationStore.getState();
        this.timeElapsed += (dt * timeMultiplier);
        
        const phase = getMissionPhase(this.timeElapsed / 60);

        // 1. BASE PHYSICS LAYER
        this.env.update(phase, dt * timeMultiplier);
        this.engine.update(phase, this.env.airDensity, dt * timeMultiplier);
        this.thermal.update(this.engine.rpm, this.engine.throttle, this.env.ambientTemp, this.engine.engineLoad, dt * timeMultiplier);
        this.fuel.update(this.engine.power, dt * timeMultiplier);
        this.elec.update(this.engine.rpm);
        this.vib.update(this.engine.rpm);

        const baseFrame: TelemetryFrame = {
            timestamp: Date.now(),
            missionPhase: phase,
            altitude: this.env.altitude,
            ambientTemp: this.env.ambientTemp,
            humidity: this.env.humidity,
            rpm: this.engine.rpm,
            torque: this.engine.torque,
            power: this.engine.power,
            throttle: this.engine.throttle,
            engineLoad: this.engine.engineLoad,
            map: this.engine.map,
            lambda: this.engine.lambda,
            fuelFlow: this.fuel.fuelFlow,
            fuelRemaining: this.fuel.fuelRemaining,
            egt: this.thermal.egt,
            cht: this.thermal.cht,
            oilTemp: this.thermal.oilTemp,
            oilPressure: this.thermal.oilPressure,
            batteryVoltage: this.elec.batteryVoltage,
            alternatorCurrent: this.elec.alternatorCurrent,
            vibrationX: this.vib.x,
            vibrationY: this.vib.y,
            vibrationZ: this.vib.z
        };

        // 2. FAULT LAYER
        const faultFrame = this.faultEngine.applyFaults(baseFrame, state.activeFaults, dt * timeMultiplier);

        // 3. SENSOR LAYER
        const finalFrame = this.sensorModel.applySensors(faultFrame, state.activeDrifts, dt * timeMultiplier);

        state.addTelemetry(finalFrame);
    }
}

export const simulator = new SimulationEngine();
""")

# Re-write UI for Fault Injection
write("../app/fault-injection/page.tsx", """
"use client";

import { useSimulationStore } from '@/simulator/state/simulationStore';
import { eventEngine } from '@/simulator/events/eventEngine';
import { EngineFaultType, FaultSeverity } from '@/simulator/faults/faultTypes';
import { SensorDriftType } from '@/simulator/sensors/sensorModel';
import { useState } from 'react';

const faultTypes: EngineFaultType[] = ['MISFIRE', 'INJECTOR_FAULT', 'BEARING_WEAR', 'OIL_LEAK', 'COOLING_FAILURE', 'COMBUSTION_INSTABILITY', 'FUEL_SYSTEM_DEGRADATION'];
const driftTypes: SensorDriftType[] = ['RPM_SENSOR_DRIFT', 'EGT_SENSOR_DRIFT', 'CHT_SENSOR_DRIFT', 'OIL_PRESSURE_SENSOR_DRIFT', 'BATTERY_SENSOR_DRIFT'];

export default function FaultInjectionPage() {
  const activeFaults = useSimulationStore(state => state.activeFaults);
  const activeDrifts = useSimulationStore(state => state.activeDrifts);
  const addFault = useSimulationStore(state => state.addFault);
  const addDrift = useSimulationStore(state => state.addDrift);

  const [selectedFault, setSelectedFault] = useState<EngineFaultType>('OIL_LEAK');
  const [severity, setSeverity] = useState<FaultSeverity>('MEDIUM');

  const [selectedDrift, setSelectedDrift] = useState<SensorDriftType>('EGT_SENSOR_DRIFT');

  const handleInjectFault = () => {
    addFault({
      id: Math.random().toString(),
      type: selectedFault,
      severity,
      startTime: Date.now(),
      intensity: 0
    });
    eventEngine.log('FAULT_INJECTED', 'WARNING', 'Fault Engine', `Injected ${selectedFault} at ${severity} severity.`);
  };

  const handleInjectDrift = () => {
    addDrift({
      id: Math.random().toString(),
      type: selectedDrift,
      driftValue: 0
    });
    eventEngine.log('SENSOR_DRIFT_STARTED', 'WARNING', 'Sensor Model', `Injected sensor drift: ${selectedDrift}.`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Fault & Sensor Engine</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Physical Engine Faults */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-destructive">Engine Physical Faults</h3>
          <p className="text-sm text-muted-foreground">Inject mechanical or thermodynamic failures.</p>
          
          <select value={selectedFault} onChange={e => setSelectedFault(e.target.value as EngineFaultType)} className="w-full bg-background border border-border rounded p-2 text-foreground">
            {faultTypes.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          
          <select value={severity} onChange={e => setSeverity(e.target.value as FaultSeverity)} className="w-full bg-background border border-border rounded p-2 text-foreground">
            <option value="LOW">Low Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="CRITICAL">Critical Severity</option>
          </select>
          
          <button onClick={handleInjectFault} className="w-full bg-destructive text-destructive-foreground py-2 rounded font-medium hover:bg-destructive/90">
            Inject Physical Fault
          </button>
        </div>

        {/* Sensor Drifts */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-amber-500">Sensor Drift Simulation</h3>
          <p className="text-sm text-muted-foreground">Inject telemetry spoofing or sensor degradation.</p>
          
          <select value={selectedDrift} onChange={e => setSelectedDrift(e.target.value as SensorDriftType)} className="w-full bg-background border border-border rounded p-2 text-foreground">
            {driftTypes.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          
          <button onClick={handleInjectDrift} className="w-full bg-amber-500 text-black py-2 rounded font-medium hover:bg-amber-400">
            Inject Sensor Drift
          </button>
        </div>
      </div>

      {/* Active Faults Dashboard */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-foreground">Active Fault Dashboard</h3>
        {activeFaults.length === 0 && activeDrifts.length === 0 && <p className="text-muted-foreground">No active faults.</p>}
        
        {activeFaults.map(f => (
          <div key={f.id} className="flex justify-between items-center p-3 bg-background border border-destructive/50 rounded">
            <div>
              <span className="font-bold text-destructive">{f.type}</span>
              <span className="ml-2 text-sm text-muted-foreground">Severity: {f.severity} | Intensity: {(f.intensity * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
        {activeDrifts.map(d => (
          <div key={d.id} className="flex justify-between items-center p-3 bg-background border border-amber-500/50 rounded">
            <div>
              <span className="font-bold text-amber-500">{d.type}</span>
              <span className="ml-2 text-sm text-muted-foreground">Drift Offset: {d.driftValue.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
""")

# Re-write Logs page for Events
write("../app/logs/page.tsx", """
"use client";

import { useSimulationStore } from '@/simulator/state/simulationStore';

export default function LogsPage() {
  const events = useSimulationStore(state => state.events);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">System Logs & Events</h1>
      
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary text-secondary-foreground text-xs uppercase">
            <tr>
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">Severity</th>
              <th className="px-6 py-3">Source</th>
              <th className="px-6 py-3">Message</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">No events recorded.</td></tr>
            )}
            {events.map(ev => (
              <tr key={ev.id} className="border-b border-border bg-background">
                <td className="px-6 py-4 font-mono">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    ev.severity === 'CRITICAL' ? 'bg-destructive/20 text-destructive' :
                    ev.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-500' :
                    'bg-blue-500/20 text-blue-500'
                  }`}>{ev.severity}</span>
                </td>
                <td className="px-6 py-4">{ev.source}</td>
                <td className="px-6 py-4">{ev.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
""")

print("Phase 3 generated.")
