import os

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim/src"
SIM_DIR = os.path.join(BASE_DIR, "simulator")

folders = [
    "core",
    "mission",
    "telemetry",
    "engine",
    "state"
]

for f in folders:
    os.makedirs(os.path.join(SIM_DIR, f), exist_ok=True)

def write(path, content):
    with open(os.path.join(SIM_DIR, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

write("telemetry/telemetryTypes.ts", """
export interface TelemetryFrame {
  timestamp: number;
  missionPhase: string;
  altitude: number;
  ambientTemp: number;
  humidity: number;
  rpm: number;
  torque: number;
  power: number;
  throttle: number;
  engineLoad: number;
  map: number;
  lambda: number;
  fuelFlow: number;
  fuelRemaining: number;
  egt: number;
  cht: number;
  oilTemp: number;
  oilPressure: number;
  batteryVoltage: number;
  alternatorCurrent: number;
  vibrationX: number;
  vibrationY: number;
  vibrationZ: number;
}
""")

write("mission/missionProfile.ts", """
export type MissionPhase = 'GROUND' | 'STARTUP' | 'TAKEOFF' | 'CLIMB' | 'CRUISE' | 'LOITER' | 'DESCENT' | 'LANDING' | 'SHUTDOWN';

export function getMissionPhase(elapsedMinutes: number): MissionPhase {
    if (elapsedMinutes < 2) return 'STARTUP';
    if (elapsedMinutes < 5) return 'TAKEOFF';
    if (elapsedMinutes < 20) return 'CLIMB';
    if (elapsedMinutes < 90) return 'CRUISE';
    if (elapsedMinutes < 110) return 'LOITER';
    if (elapsedMinutes < 118) return 'DESCENT';
    if (elapsedMinutes < 120) return 'LANDING';
    if (elapsedMinutes >= 120) return 'SHUTDOWN';
    return 'GROUND';
}
""")

write("core/environment.ts", """
export class EnvironmentModel {
    public altitude: number = 0;
    public ambientTemp: number = 15;
    public pressure: number = 101325;
    public humidity: number = 50;
    public airDensity: number = 1.225;

    public update(phase: string, dtSec: number) {
        // Simple altitude logic
        if (phase === 'TAKEOFF') this.altitude += 50 * dtSec;
        else if (phase === 'CLIMB') this.altitude += 15 * dtSec;
        else if (phase === 'DESCENT') this.altitude -= 15 * dtSec;
        else if (phase === 'LANDING') this.altitude = Math.max(0, this.altitude - 5 * dtSec);
        else if (phase === 'SHUTDOWN' || phase === 'GROUND' || phase === 'STARTUP') this.altitude = 0;

        const altM = this.altitude * 0.3048; // ft to meters
        this.ambientTemp = 15 - 0.0065 * altM;
        const tempK = this.ambientTemp + 273.15;
        this.pressure = 101325 * Math.pow(1 - (0.0065 * altM) / 288.15, 5.255);
        this.airDensity = this.pressure / (287.05 * tempK);
    }
}
""")

write("core/engine.ts", """
export class EnginePhysicsModel {
    public rpm: number = 0;
    public torque: number = 0;
    public power: number = 0;
    public throttle: number = 0;
    public engineLoad: number = 0;
    public map: number = 0;
    public lambda: number = 1.0;

    private readonly idleRPM = 1200;
    private readonly maxRPM = 5800;
    private readonly maxTorque = 150; // Nm
    private readonly maxPower = 100; // kW approx

    public update(phase: string, airDensity: number, dtSec: number) {
        // Target throttle based on phase
        let targetThrottle = 0;
        if (phase === 'STARTUP') targetThrottle = 10;
        else if (phase === 'TAKEOFF') targetThrottle = 100;
        else if (phase === 'CLIMB') targetThrottle = 85;
        else if (phase === 'CRUISE' || phase === 'LOITER') targetThrottle = 65;
        else if (phase === 'DESCENT') targetThrottle = 30;
        else if (phase === 'LANDING') targetThrottle = 15;

        // Smooth throttle
        this.throttle += (targetThrottle - this.throttle) * 0.1;

        const targetRPM = this.idleRPM + (this.throttle / 100) * (this.maxRPM - this.idleRPM);
        this.rpm += (targetRPM - this.rpm) * 0.1;

        const densityFactor = airDensity / 1.225;
        this.torque = this.maxTorque * (this.throttle / 100) * densityFactor;
        
        this.power = (this.torque * this.rpm) / 7127;
        this.engineLoad = Math.min(100, (this.power / this.maxPower) * 100);

        this.map = (this.throttle / 100) * 100 * densityFactor;
        this.lambda = 0.95 + (0.1 * (100 - this.throttle) / 100);
    }
}
""")

write("core/fuel.ts", """
export class FuelModel {
    public fuelFlow: number = 0;
    public fuelRemaining: number = 100; // liters or kg
    
    public update(power: number, dtSec: number) {
        const bsfc = 0.28; // mid-range
        this.fuelFlow = bsfc * Math.max(0.1, power); // kg/hr approx
        
        const burnSec = this.fuelFlow / 3600;
        this.fuelRemaining = Math.max(0, this.fuelRemaining - burnSec * dtSec);
    }
}
""")

write("core/thermal.ts", """
export class ThermalModel {
    public egt: number = 15;
    public cht: number = 15;
    public oilTemp: number = 15;
    public oilPressure: number = 0;

    public update(rpm: number, throttle: number, ambientTemp: number, engineLoad: number, dtSec: number) {
        const targetEgt = ambientTemp + (rpm * 0.1) + (throttle * 2);
        this.egt += (targetEgt - this.egt) * 0.05;

        const targetCht = this.egt * 0.3 + (engineLoad * 0.5);
        this.cht += (targetCht - this.cht) * 0.02;

        const targetOilTemp = ambientTemp + (engineLoad * 0.8) + 40;
        this.oilTemp += (targetOilTemp - this.oilTemp) * 0.01;

        const targetOilPressure = (rpm > 500) ? 200 + (rpm * 0.04) - ((this.oilTemp - 80) * 1.5) : 0;
        this.oilPressure += (Math.max(0, targetOilPressure) - this.oilPressure) * 0.1;
    }
}
""")

write("core/electrical.ts", """
export class ElectricalModel {
    public batteryVoltage: number = 28;
    public alternatorCurrent: number = 0;

    public update(rpm: number) {
        if (rpm > 1000) {
            this.batteryVoltage = 28.2;
            this.alternatorCurrent = Math.min(100, (rpm / 5000) * 80);
        } else {
            this.batteryVoltage = 24.5;
            this.alternatorCurrent = 0;
        }
    }
}
""")

write("core/vibration.ts", """
export class VibrationModel {
    public x: number = 0;
    public y: number = 0;
    public z: number = 0;

    public update(rpm: number) {
        const base = (rpm / 5000) * 1.2; // approx 1.2g at max rpm
        
        // gaussian approx
        const n = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.1;
        
        this.x = rpm > 500 ? Math.max(0.05, base + n()) : 0;
        this.y = rpm > 500 ? Math.max(0.05, base * 0.8 + n()) : 0;
        this.z = rpm > 500 ? Math.max(0.05, base * 0.9 + n()) : 0;
    }
}
""")

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

export class SimulationEngine {
    private env = new EnvironmentModel();
    private engine = new EnginePhysicsModel();
    private fuel = new FuelModel();
    private thermal = new ThermalModel();
    private elec = new ElectricalModel();
    private vib = new VibrationModel();
    
    private timeElapsed = 0; // seconds
    private isRunning = false;
    private timer: any = null;

    public start() {
        if(this.isRunning) return;
        this.isRunning = true;
        useSimulationStore.getState().setStatus('RUNNING');
        this.timer = setInterval(() => this.tick(), 1000); // 1Hz
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
        const dt = 1; // 1 second
        // For fast forward, timeMultiplier would multiply dt
        const timeMultiplier = useSimulationStore.getState().timeMultiplier;
        this.timeElapsed += (dt * timeMultiplier);
        
        const phase = getMissionPhase(this.timeElapsed / 60);

        this.env.update(phase, dt * timeMultiplier);
        this.engine.update(phase, this.env.airDensity, dt * timeMultiplier);
        this.thermal.update(this.engine.rpm, this.engine.throttle, this.env.ambientTemp, this.engine.engineLoad, dt * timeMultiplier);
        this.fuel.update(this.engine.power, dt * timeMultiplier);
        this.elec.update(this.engine.rpm);
        this.vib.update(this.engine.rpm);

        const frame: TelemetryFrame = {
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

        useSimulationStore.getState().addTelemetry(frame);
    }
}

export const simulator = new SimulationEngine();
""")

write("state/simulationStore.ts", """
import { create } from 'zustand';
import { TelemetryFrame } from '../telemetry/telemetryTypes';

interface SimulationState {
    status: 'STOPPED' | 'RUNNING' | 'PAUSED';
    timeMultiplier: number;
    telemetryHistory: TelemetryFrame[];
    currentTelemetry: TelemetryFrame | null;
    
    setStatus: (status: 'STOPPED' | 'RUNNING' | 'PAUSED') => void;
    setTimeMultiplier: (multiplier: number) => void;
    addTelemetry: (frame: TelemetryFrame) => void;
    setTelemetry: (frames: TelemetryFrame[]) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
    status: 'STOPPED',
    timeMultiplier: 1,
    telemetryHistory: [],
    currentTelemetry: null,
    
    setStatus: (status) => set({ status }),
    setTimeMultiplier: (timeMultiplier) => set({ timeMultiplier }),
    addTelemetry: (frame) => set((state) => {
        const newHistory = [...state.telemetryHistory, frame].slice(-300); // keep last 5 mins
        return {
            telemetryHistory: newHistory,
            currentTelemetry: frame
        };
    }),
    setTelemetry: (frames) => set({ telemetryHistory: frames, currentTelemetry: frames[frames.length - 1] || null }),
}));
""")

print("Done generating simulator.")
