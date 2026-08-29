import { useEngineStore } from '../stores/engineStore';
import { useFuelStore } from '../stores/fuelStore';
import { useThermalStore } from '../stores/thermalStore';
import { useElectricalStore } from '../stores/electricalStore';
import { useEnvStore } from '../stores/environmentStore';
import { useFlightStore } from '../stores/flightStore';
import { useMissionStore } from '../stores/missionStore';
import { useVibrationStore } from '../stores/vibrationStore';
import { useFaultStore } from '../stores/faultStore';
import { wsClient } from '../services/wsClient';

export class SimulationLoop {
  private timer: any = null;
  private prevPhase: string = 'GROUND_IDLE';
  
  start() {
    if (this.timer) return;
    wsClient.connect();
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
    const faults = useFaultStore.getState().activeFaults || [];

    // FAULT PROPAGATION
    let F = { oilLeak: 0, fuelLeak: 0, turbo: 0, spark: 0, inj: 0, batt: 0, alt: 0, rpmS: 0, chtS: 0, egtS: 0, thr: 0, vib: 0, heat: 0 };
    const newFaults = faults.map((f: any) => {
      let r = 0.005;
      if (f.severity==='MEDIUM') r=0.01; if (f.severity==='HIGH') r=0.03; if (f.severity==='CRITICAL') r=0.1;
      const intens = Math.min(1.0, f.intensity + r * dt);
      if (f.type==='Oil Leak') F.oilLeak = intens;
      if (f.type==='Excessive Vibration') F.vib = intens;
      return { ...f, intensity: intens, timeAlive: f.timeAlive + dt };
    });
    useFaultStore.getState().setFaults({ activeFaults: newFaults });

    // Mission Automation
    let tgtThrottle = 0; let tgtSpd = 0; let tgtVS = 0; let tgtRpmLimit = 1200;
    let missionEvent = null;
    if (mission.isActive) {
      useMissionStore.getState().setMission({ timer: mission.timer + dt });
      const p = mission.phase;
      if (p !== this.prevPhase) { missionEvent = `Mission phase changed to ${p}`; this.prevPhase = p; }
      
      if (p === 'GROUND_IDLE') { tgtThrottle = 7.5; tgtSpd = 0; tgtVS = 0; tgtRpmLimit = 1200; }
      else if (p === 'TAKEOFF') { tgtThrottle = 100; tgtSpd = 120; tgtVS = 3; tgtRpmLimit = 5800; }
      else if (p === 'CLIMB') { tgtThrottle = 85; tgtSpd = 150; tgtVS = 5; tgtRpmLimit = 5500; }
      else if (p === 'CRUISE') { tgtThrottle = 65; tgtSpd = 180; tgtVS = 0; tgtRpmLimit = 4700; }
      else if (p === 'LOITER') { tgtThrottle = 50; tgtSpd = 140; tgtVS = 0; tgtRpmLimit = 4200; }
      else if (p === 'DESCENT') { tgtThrottle = 30; tgtSpd = 160; tgtVS = -4; tgtRpmLimit = 3500; }
      else if (p === 'LANDING') { tgtThrottle = 15; tgtSpd = 100; tgtVS = -2; tgtRpmLimit = 2500; }
    }

    // Environment & Flight
    const alt = env.altitude;
    const press = 101.3 * Math.exp(-alt / 8500);
    const oat = env.oat;
    const densityAlt = alt + 120 * (oat - (15 - (alt/1000)*2));
    useEnvStore.getState().setEnv({ pressure: press, densityAltitude: densityAlt });
    
    let newAlt = Math.max(0, alt + flight.verticalSpeed * dt);
    if (mission.isActive) useEnvStore.getState().setEnv({ altitude: newAlt });
    
    useFlightStore.getState().setFlight({
      airspeed: flight.airspeed + (tgtSpd - flight.airspeed) * 0.05,
      verticalSpeed: flight.verticalSpeed + (tgtVS - flight.verticalSpeed) * 0.1,
      heading: (flight.heading + 0.05) % 360
    });

    // Engine
    const pLoss = press / 101.3;
    const isRun = tgtThrottle > 2;
    let maxRpmAlt = 5800 - (alt / 10000) * 900;
    let maxRpm = Math.min(tgtRpmLimit, maxRpmAlt);
    
    let trpm = isRun ? 1000 + (tgtThrottle/100)*(maxRpm-1000) : 0;
    const nRpm = engine.rpm + (trpm - engine.rpm) * 0.1;
    const nThr = engine.throttle + (tgtThrottle - engine.throttle) * 0.1;
    const mapVal = (nThr/100) * 45 * pLoss;
    useEngineStore.getState().setEngine({
      state: isRun ? 'RUNNING' : 'OFF', rpm: Math.max(0, nRpm), throttle: nThr, map: mapVal
    });

    // Fuel
    const rRatio = Math.min(1, nRpm / 5800);
    let nFlow = isRun ? (rRatio * 35) + 2 : 0;
    useFuelStore.getState().setFuel({
      fuelFlow: fuel.fuelFlow + (nFlow - fuel.fuelFlow) * 0.1,
      fuelRemaining: Math.max(0, fuel.fuelRemaining - (fuel.fuelFlow / 3600) * dt),
      fuelPressure: isRun ? 4.5 : 0
    });

    // Thermal & Lube
    const cool = Math.max(0.1, 1 - (oat / 100) + (flight.airspeed / 220));
    let tEgt = isRun ? oat + 300 + (rRatio * 550)/cool : oat;
    let tCht = isRun ? oat + 35 + (rRatio * 150)/cool : oat;
    let tOil = isRun ? oat + 25 + (rRatio * 90)/cool : oat;
    let tOp = isRun ? (rRatio * 400) + 200 : 0;
    tOp -= (F.oilLeak * 300);

    useThermalStore.getState().setThermal({
      egt: thermal.egt + (tEgt - thermal.egt) * 0.05,
      cht: thermal.cht + (tCht - thermal.cht) * 0.01,
      oilTemp: thermal.oilTemp + (tOil - thermal.oilTemp) * 0.005,
      oilPressure: Math.max(0, thermal.oilPressure + (tOp - thermal.oilPressure) * 0.1)
    });

    // Electrical
    let tAltV = isRun ? 28.5 : 0;
    let tBat = tAltV > 25 ? 28 : 24;
    useElectricalStore.getState().setElectrical({
      alternatorVoltage: elect.alternatorVoltage + (tAltV - elect.alternatorVoltage)*0.1,
      batteryVoltage: elect.batteryVoltage + (tBat - elect.batteryVoltage)*0.01
    });

    // Vibration
    let baseV = isRun ? 0.2 + rRatio * 0.6 : 0;
    baseV += F.vib * 5;
    useVibrationStore.getState().setVibration({
      vibrationX: baseV * 0.5 + Math.random()*0.1,
      vibrationY: baseV * 0.6 + Math.random()*0.1,
      vibrationZ: baseV * 1.0 + Math.random()*0.2
    });

    let health = 100;
    if (tOp < 100 && isRun) health -= 30; 
    if (tCht > 200) health -= 25; 
    if (baseV > 1.5) health -= 20;
    newFaults.forEach((f: any) => { health -= (f.intensity * 15); });
    health = Math.max(0, Math.floor(health));

    // AI Prediction
    let aiStatus = 'NORMAL'; let aiConfidence = 0.95; let aiRec = 'Continue operations.';
    if (health < 70) { aiStatus = 'DEGRADED'; aiConfidence = 0.85; aiRec = 'Schedule maintenance soon.'; }
    if (health < 50) { aiStatus = 'ANOMALY DETECTED'; aiConfidence = 0.99; aiRec = 'IMMEDIATE ABORT RECOMMENDED.'; }

    const packet = {
      timestamp: Date.now(),
      mission: mission.phase, missionEvent,
      rpm: nRpm, throttle: nThr, map: mapVal,
      egt: tEgt, cht: tCht, oilTemp: tOil, oilPressure: tOp,
      fuelFlow: nFlow, fuelRemaining: fuel.fuelRemaining,
      batteryVoltage: tBat, alternatorVoltage: tAltV,
      altitude: newAlt, airspeed: flight.airspeed,
      oat, humidity: env.humidity, pressure: press,
      vibrationX: baseV * 0.5, vibrationY: baseV * 0.6, vibrationZ: baseV,
      health, aiStatus, aiConfidence, aiRec
    };

    wsClient.sendIngest(packet);
  }
}
export const simulation = new SimulationLoop();
