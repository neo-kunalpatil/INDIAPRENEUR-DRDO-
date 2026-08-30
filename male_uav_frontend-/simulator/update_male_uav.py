import os

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim"

def write(path, content):
    with open(os.path.join(BASE_DIR, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# --- UPDATE STORES ---
write("src/stores/environmentStore.ts", """
import { create } from 'zustand';
export const useEnvStore = create<any>((set) => ({
  altitude: 0, oat: 15, humidity: 45, pressure: 101.3, windSpeed: 0, windDirection: 0, densityAltitude: 0,
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

# --- UPDATE SIMULATION LOOP (MALE UAV PARAMS) ---
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

    // 1. Mission Logic (MALE UAV Specs)
    let tgtThrottle = 0;
    let tgtSpd = 0, tgtVS = 0, tgtRpmLimit = 1200;
    
    if (mission.isActive) {
      useMissionStore.getState().setMission({ timer: mission.timer + dt });
      const p = mission.phase;
      if (p === 'GROUND_IDLE') { tgtThrottle = 7.5; tgtSpd = 0; tgtVS = 0; tgtRpmLimit = 1200; }
      else if (p === 'TAKEOFF') { tgtThrottle = 100; tgtSpd = 120; tgtVS = 3; tgtRpmLimit = 5800; }
      else if (p === 'CLIMB') { tgtThrottle = 85; tgtSpd = 150; tgtVS = 5; tgtRpmLimit = 5500; }
      else if (p === 'CRUISE') { tgtThrottle = 65; tgtSpd = 180; tgtVS = 0; tgtRpmLimit = 4700; }
      else if (p === 'LOITER') { tgtThrottle = 50; tgtSpd = 140; tgtVS = 0; tgtRpmLimit = 4300; }
      else if (p === 'DESCENT') { tgtThrottle = 30; tgtSpd = 160; tgtVS = -4; tgtRpmLimit = 3500; }
      else if (p === 'LANDING') { tgtThrottle = 15; tgtSpd = 100; tgtVS = -2; tgtRpmLimit = 2500; }
    } else {
      tgtThrottle = 0;
    }

    // 2. Flight & Env
    let newAlt = Math.max(0, Math.min(10000, env.altitude + flight.verticalSpeed * dt));
    const oat = 15 - (newAlt / 1000) * 6.5;
    const pressure = 101.3 * Math.exp(-newAlt / 8500);
    // Density Altitude Approx
    const densityAltitude = newAlt + 120 * (oat - (15 - (newAlt/1000)*2)); 
    
    useEnvStore.getState().setEnv({ altitude: newAlt, oat, pressure, densityAltitude });
    useFlightStore.getState().setFlight({
      airspeed: flight.airspeed + (tgtSpd - flight.airspeed) * 0.05,
      verticalSpeed: flight.verticalSpeed + (tgtVS - flight.verticalSpeed) * 0.1,
      heading: (flight.heading + 0.01) % 360 // Slow turn
    });

    // 3. Engine (Altitude limits max RPM)
    const pLoss = pressure / 101.3;
    const isRun = tgtThrottle > 2;
    // 0m: 5800, 5000m: 5400, 8000m: 5100, 10000m: 4900 -> approx linear mapped
    let maxRpmAlt = 5800 - (newAlt / 10000) * 900;
    let maxRpm = Math.min(tgtRpmLimit, maxRpmAlt);
    
    let trpm = isRun ? 1000 + (tgtThrottle/100)*(maxRpm-1000) : 0;
    const nRpm = engine.rpm + (trpm - engine.rpm) * 0.1;
    const nThr = engine.throttle + (tgtThrottle - engine.throttle) * 0.1;
    useEngineStore.getState().setEngine({
      state: isRun ? 'RUNNING' : 'OFF',
      rpm: Math.max(0, nRpm),
      throttle: nThr,
      power: (nRpm / 5800) * 100 * pLoss,
      engineLoad: nThr * 0.8 + (1-pLoss)*20
    });

    // 4. Fuel (MALE Specs)
    const rRatio = Math.min(1, nRpm / 5800);
    // T/O: 30-40, Cruise: 15-25, Loiter: 10-18
    const nFlow = isRun ? (rRatio * 35) + 2 : 0;
    const nPress = isRun ? 4.5 : 0;
    useFuelStore.getState().setFuel({
      fuelFlow: fuel.fuelFlow + (nFlow - fuel.fuelFlow) * 0.1,
      fuelPressure: fuel.fuelPressure + (nPress - fuel.fuelPressure) * 0.2,
      fuelRemaining: Math.max(0, fuel.fuelRemaining - (fuel.fuelFlow / 3600) * dt)
    });

    // 5. Thermal & Lube (MALE Specs)
    const cool = Math.max(0.1, 1 - (oat / 100) + (flight.airspeed / 220));
    // EGT: 350-900, CHT: 50-220, Oil: 40-130
    const tEgt = isRun ? oat + 300 + (rRatio * 550)/cool : oat;
    const tCht = isRun ? oat + 35 + (rRatio * 150)/cool : oat;
    const tOil = isRun ? oat + 25 + (rRatio * 90)/cool : oat;
    const tOp = isRun ? (rRatio * 300) + 200 : 0; // 300-600 kPa

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
      currentDraw: isRun ? 35 + Math.random()*5 : 0
    });

    // 7. Vibration
    const baseV = isRun ? 0.2 + rRatio * 0.6 : 0; // Healthy 0.1 - 0.8
    useVibrationStore.getState().setVibration({
      vibrationX: baseV * 0.5 + Math.random()*0.1,
      vibrationY: baseV * 0.6 + Math.random()*0.1,
      vibrationZ: baseV * 1.0 + Math.random()*0.2
    });

    // 8. Generate FADEC Telemetry Packet
    const packet = {
      timestamp: Date.now(),
      missionPhase: mission.phase,
      rpm: useEngineStore.getState().rpm,
      throttle: useEngineStore.getState().throttle,
      map: 101.3 * pLoss * (nThr/100),
      fuelFlow: useFuelStore.getState().fuelFlow,
      fuelPressure: useFuelStore.getState().fuelPressure,
      fuelRemaining: useFuelStore.getState().fuelRemaining,
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
      heading: useFlightStore.getState().heading,
      oat: useEnvStore.getState().oat,
      humidity: useEnvStore.getState().humidity,
      pressure: useEnvStore.getState().pressure,
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

# --- UPDATE PAGES TO REFLECT MALE UAV TELEMETRY FIELDS ---
write("src/app/engine/page.tsx", """
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
      <h1 className="text-xl font-bold text-white border-b border-green-500 pb-2">MALE UAV Aero Piston Engine</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-gray-500 mb-2">CORE & FUEL</h2>
          <Row l="Engine State" v={engine.state} u="" />
          <Row l="RPM" v={engine.rpm} u="RPM" />
          <Row l="Throttle" v={engine.throttle} u="%" />
          <Row l="Engine Load" v={engine.engineLoad} u="%" />
          <Row l="MAP" v={engine.throttle * 0.9} u="kPa" />
          <Row l="Fuel Flow" v={fuel.fuelFlow} u="L/hr" />
          <Row l="Fuel Pressure" v={fuel.fuelPressure} u="bar" />
          <Row l="Fuel Remaining" v={fuel.fuelRemaining} u="L" />
        </div>
        <div>
          <h2 className="text-gray-500 mb-2">THERMAL & ELEC</h2>
          <Row l="CHT" v={therm.cht} u="°C" />
          <Row l="EGT" v={therm.egt} u="°C" />
          <Row l="Oil Temp" v={therm.oilTemp} u="°C" />
          <Row l="Oil Pressure" v={therm.oilPressure} u="kPa" />
          <Row l="Battery Voltage" v={elec.batteryVoltage} u="V" />
          <Row l="Alternator Voltage" v={elec.alternatorVoltage} u="V" />
          <Row l="Current Draw" v={elec.currentDraw} u="A" />
        </div>
      </div>
    </div>
  );
}
""")

write("src/app/environment/page.tsx", """
"use client";
import { useEnvStore } from '@/stores/environmentStore';
import { useFlightStore } from '@/stores/flightStore';
import { useVibrationStore } from '@/stores/vibrationStore';

const Row = ({ l, v, u }: any) => <div className="flex justify-between py-1 border-b border-gray-800 text-sm"><span>{l}</span><span>{typeof v === 'number' ? v.toFixed(2) : v} <span className="text-gray-600">{u}</span></span></div>;

export default function EnvPage() {
  const env = useEnvStore(); const flight = useFlightStore(); const vib = useVibrationStore();
  
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white border-b border-green-500 pb-2">Flight & Environment Envelope</h1>
      
      <Row l="Altitude" v={env.altitude} u="m" />
      <Row l="Density Altitude" v={env.densityAltitude} u="m" />
      <Row l="Airspeed" v={flight.airspeed} u="km/h" />
      <Row l="Vertical Speed" v={flight.verticalSpeed} u="m/s" />
      <Row l="Heading" v={flight.heading} u="°" />
      <Row l="Outside Air Temp (OAT)" v={env.oat} u="°C" />
      <Row l="Pressure" v={env.pressure} u="kPa" />
      <Row l="Humidity" v={env.humidity} u="%" />
      <Row l="Wind Speed" v={env.windSpeed} u="km/h" />
      <Row l="Wind Direction" v={env.windDirection} u="°" />
      
      <h2 className="text-sm font-bold text-white mt-8 mb-2">Vibration Sensors</h2>
      <Row l="Accelerometer X" v={vib.vibrationX} u="g" />
      <Row l="Accelerometer Y" v={vib.vibrationY} u="g" />
      <Row l="Accelerometer Z" v={vib.vibrationZ} u="g" />
    </div>
  );
}
""")
print("MALE UAV specifics successfully patched.")
