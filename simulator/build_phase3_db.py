import os
import json

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim"
os.makedirs(os.path.join(BASE_DIR, "backend/src"), exist_ok=True)

def write(path, content):
    with open(os.path.join(BASE_DIR, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# --- BACKEND package.json ---
write("backend/package.json", """
{
  "name": "aero-backend",
  "version": "1.0.0",
  "main": "src/server.ts",
  "scripts": {
    "start": "ts-node src/server.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "ws": "^8.16.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/pg": "^8.10.9",
    "@types/ws": "^8.5.10",
    "@types/cors": "^2.8.17",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
""")

# --- BACKEND tsconfig.json ---
write("backend/tsconfig.json", """
{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
""")

# --- BACKEND DB ---
write("backend/src/db.ts", """
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/aero_sim',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS engine_telemetry (
        time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        rpm REAL, oil_temp_c REAL, oil_press_kpa REAL, cht_c REAL, egt_c REAL,
        fuel_flow_lph REAL, map_kpa REAL, throttle_pct REAL, lambda_ratio REAL,
        vib_x_g REAL, vib_y_g REAL, vib_z_g REAL, battery_v REAL, battery_a REAL
      );
      CREATE TABLE IF NOT EXISTS mission_data (
        time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        altitude REAL, speed REAL, temperature REAL, humidity REAL, pressure REAL
      );
      CREATE TABLE IF NOT EXISTS engine_health (
        time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        score REAL, rul REAL
      );
    `);
    // NOTE: In a real TimescaleDB setup we would do:
    // SELECT create_hypertable('engine_telemetry', 'time', if_not_exists => TRUE);
    console.log('Database schema initialized.');
  } catch (err: any) {
    console.error('DB Init Error:', err.message);
  }
};

export default pool;
""")

# --- BACKEND SERVER ---
write("backend/src/server.ts", """
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import pool, { initDb } from './db';

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/stream' });

let latestTelemetry: any = null;
let latestMission: any = null;
let latestHealth: any = null;

wss.on('connection', (ws) => {
  console.log('Client connected to telemetry stream.');
  
  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'INGEST') {
        const p = msg.payload;
        latestTelemetry = p;
        
        // 1. Write to DB (Fire & Forget for performance)
        pool.query(`
          INSERT INTO engine_telemetry (rpm, oil_temp_c, oil_press_kpa, cht_c, egt_c, fuel_flow_lph, map_kpa, throttle_pct, vib_x_g, vib_y_g, vib_z_g, battery_v)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [p.rpm, p.oilTemp, p.oilPressure, p.cht, p.egt, p.fuelFlow, p.map, p.throttle, p.vibrationX, p.vibrationY, p.vibrationZ, p.batteryVoltage]).catch((err:any) => console.error(err.message));
        
        pool.query(`
          INSERT INTO mission_data (altitude, speed, temperature, humidity, pressure)
          VALUES ($1, $2, $3, $4, $5)
        `, [p.altitude, p.airspeed, p.oat, p.humidity, p.pressure]).catch((err:any) => console.error(err.message));

        latestHealth = { score: p.health, rul: p.health * 10 };
        pool.query(`
          INSERT INTO engine_health (score, rul) VALUES ($1, $2)
        `, [latestHealth.score, latestHealth.rul]).catch((err:any) => console.error(err.message));

        latestMission = { phase: p.mission, altitude: p.altitude, speed: p.airspeed };

        // 2. Broadcast to all clients (including dashboard)
        const broadcastMsg = JSON.stringify({ type: 'TELEMETRY', payload: p });
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(broadcastMsg);
          }
        });
      }
    } catch (e) {
      console.error('WS parse error:', e);
    }
  });
});

// REST APIs
app.get('/api/telemetry/latest', (req, res) => res.json(latestTelemetry || {}));
app.get('/api/mission/latest', (req, res) => res.json(latestMission || {}));
app.get('/api/health/latest', (req, res) => res.json(latestHealth || {}));
app.get('/api/telemetry/history', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM engine_telemetry ORDER BY time DESC LIMIT 100');
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

const PORT = 5000;
initDb().then(() => {
  server.listen(PORT, () => console.log(`Backend TSDB Server & WS running on port ${PORT}`));
});
""")

# --- FRONTEND WEBSOCKET CONNECTOR ---
write("src/services/wsClient.ts", """
import { useTelemetryStore } from '../stores/telemetryStore';

class WSClient {
  private ws: WebSocket | null = null;
  
  connect() {
    if (typeof window === 'undefined') return;
    this.ws = new WebSocket('ws://localhost:5000/stream');
    
    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'TELEMETRY') {
          // Dashboard now reads from WS stream!
          const ts = useTelemetryStore.getState();
          useTelemetryStore.getState().setTelemetry({ 
            packet: msg.payload, 
            packetCount: ts.packetCount + 1,
            connected: true
          });
        }
      } catch (e) {}
    };
    
    this.ws.onclose = () => {
      useTelemetryStore.getState().setTelemetry({ connected: false });
      setTimeout(() => this.connect(), 2000); // Reconnect
    };
  }

  sendIngest(packet: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'INGEST', payload: packet }));
    }
  }
}

export const wsClient = new WSClient();
""")

# --- FRONTEND SIMULATION LOOP (Send to WS instead of directly to Store) ---
write("src/simulation/SimulationLoop.ts", """
import { useEngineStore } from '../stores/engineStore';
import { useFuelStore } from '../stores/fuelStore';
import { useThermalStore } from '../stores/thermalStore';
import { useElectricalStore } from '../stores/electricalStore';
import { useEnvStore } from '../stores/environmentStore';
import { useFlightStore } from '../stores/flightStore';
import { useMissionStore } from '../stores/missionStore';
import { useVibrationStore } from '../stores/vibrationStore';
import { useFaultStore } from '../stores/faultStore';
import { wsClient } from '../services/wsClient'; // WS Import

export class SimulationLoop {
  private timer: any = null;
  private timeSum = 0;
  
  start() {
    if (this.timer) return;
    wsClient.connect(); // Start WS Client
    this.timer = setInterval(() => this.tick(), 100); // 10Hz
  }
  
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
  
  private tick() {
    const dt = 0.1;
    this.timeSum += dt;
    const mission = useMissionStore.getState();
    const env = useEnvStore.getState();
    const flight = useFlightStore.getState();
    const engine = useEngineStore.getState();
    const fuel = useFuelStore.getState();
    const thermal = useThermalStore.getState();
    const elect = useElectricalStore.getState();
    const faults = useFaultStore.getState().activeFaults;

    // FAULT PROPAGATION
    let F = { oilLeak: 0, fuelLeak: 0, turbo: 0, spark: 0, inj: 0, batt: 0, alt: 0, rpmS: 0, chtS: 0, egtS: 0, thr: 0, vib: 0, heat: 0 };
    const newFaults = faults.map((f: any) => {
      let r = 0.005;
      if (f.severity==='MEDIUM') r=0.01; if (f.severity==='HIGH') r=0.03; if (f.severity==='CRITICAL') r=0.1;
      const intens = Math.min(1.0, f.intensity + r * dt);
      if (f.type==='Oil Leak') F.oilLeak = intens;
      if (f.type==='Fuel Leak') F.fuelLeak = intens;
      if (f.type==='Turbo Failure') F.turbo = intens;
      if (f.type==='Spark Plug Failure') F.spark = intens;
      if (f.type==='Injector Failure') F.inj = intens;
      if (f.type==='Battery Failure') F.batt = intens;
      if (f.type==='Alternator Failure') F.alt = intens;
      if (f.type==='RPM Sensor Failure') F.rpmS = intens;
      if (f.type==='CHT Sensor Failure') F.chtS = intens;
      if (f.type==='EGT Sensor Failure') F.egtS = intens;
      if (f.type==='Throttle Failure') F.thr = intens;
      if (f.type==='Excessive Vibration') F.vib = intens;
      if (f.type==='Overheating') F.heat = intens;
      return { ...f, intensity: intens, timeAlive: f.timeAlive + dt };
    });
    useFaultStore.getState().setFaults({ activeFaults: newFaults });

    // Mission Automation
    let tgtThrottle = 0; let tgtSpd = 0; let tgtVS = 0; let tgtRpmLimit = 1200;
    
    if (mission.isActive) {
      useMissionStore.getState().setMission({ timer: mission.timer + dt });
      const p = mission.phase;
      if (p === 'GROUND_IDLE') { tgtThrottle = 7.5; tgtSpd = 0; tgtVS = 0; tgtRpmLimit = 1200; }
      else if (p === 'TAKEOFF') { tgtThrottle = 100; tgtSpd = 120; tgtVS = 3; tgtRpmLimit = 5800; }
      else if (p === 'CLIMB') { tgtThrottle = 85; tgtSpd = 150; tgtVS = 5; tgtRpmLimit = 5500; }
      else if (p === 'CRUISE') { tgtThrottle = 65; tgtSpd = 180; tgtVS = 0; tgtRpmLimit = 4700; }
      else if (p === 'LOITER') { tgtThrottle = 50; tgtSpd = 140; tgtVS = 0; tgtRpmLimit = 4200; }
      else if (p === 'DESCENT') { tgtThrottle = 30; tgtSpd = 160; tgtVS = -4; tgtRpmLimit = 3500; }
      else if (p === 'LANDING') { tgtThrottle = 15; tgtSpd = 100; tgtVS = -2; tgtRpmLimit = 2500; }
    }
    if (F.thr > 0) tgtThrottle *= (1 - F.thr);

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
    trpm *= (1 - F.turbo * 0.3);
    if (F.spark > 0) trpm -= F.spark * 500 * Math.random();
    
    const nRpm = engine.rpm + (trpm - engine.rpm) * 0.1;
    const nThr = engine.throttle + (tgtThrottle - engine.throttle) * 0.1;
    const mapVal = (nThr/100) * 45 * pLoss * (1 - F.turbo*0.4);
    useEngineStore.getState().setEngine({
      state: isRun ? 'RUNNING' : 'OFF',
      rpm: Math.max(0, nRpm),
      throttle: nThr,
      engineLoad: nThr * 0.8 + (1-pLoss)*20,
      map: mapVal
    });

    // Fuel
    const rRatio = Math.min(1, nRpm / 5800);
    let nFlow = isRun ? (rRatio * 35) + 2 : 0;
    if (F.fuelLeak > 0) nFlow += F.fuelLeak * 20;
    if (F.inj > 0) nFlow *= (1 - F.inj * 0.5);
    
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
    tOil += (F.oilLeak * 50) + (F.heat * 100);
    tCht += (F.heat * 80);
    tEgt += (F.turbo * 150) + (F.spark * 100) + (F.heat * 150);

    useThermalStore.getState().setThermal({
      egt: thermal.egt + (tEgt - thermal.egt) * 0.05,
      cht: thermal.cht + (tCht - thermal.cht) * 0.01,
      oilTemp: thermal.oilTemp + (tOil - thermal.oilTemp) * 0.005,
      oilPressure: Math.max(0, thermal.oilPressure + (tOp - thermal.oilPressure) * 0.1)
    });

    // Electrical
    let tAltV = isRun ? 28.5 : 0;
    tAltV -= (F.alt * 10);
    let tBat = tAltV > 25 ? 28 : 24;
    tBat -= (F.batt * 10);
    useElectricalStore.getState().setElectrical({
      alternatorVoltage: elect.alternatorVoltage + (tAltV - elect.alternatorVoltage)*0.1,
      batteryVoltage: elect.batteryVoltage + (tBat - elect.batteryVoltage)*0.01
    });

    // Vibration
    let baseV = isRun ? 0.2 + rRatio * 0.6 : 0;
    baseV += F.vib * 7;
    if (F.spark > 0) baseV += F.spark * 2;
    useVibrationStore.getState().setVibration({
      vibrationX: baseV * 0.5 + Math.random()*0.1,
      vibrationY: baseV * 0.6 + Math.random()*0.1,
      vibrationZ: baseV * 1.0 + Math.random()*0.2
    });

    let health = 100;
    if (tOp < 100 && isRun) health -= 30; 
    if (tEgt > 850) health -= 20; 
    if (tCht > 200 || tOil > 120) health -= 25; 
    if (baseV > 1.5) health -= 20;
    newFaults.forEach((f: any) => { health -= (f.intensity * 15); });
    health = Math.max(0, Math.floor(health));

    // INGEST TO BACKEND VIA WEBSOCKET
    const packet = {
      timestamp: Date.now(),
      mission: mission.phase,
      rpm: Math.floor(nRpm),
      throttle: nThr,
      map: mapVal,
      egt: Math.floor(tEgt),
      cht: Math.floor(tCht),
      oilTemp: Math.floor(tOil),
      oilPressure: Math.floor(tOp),
      fuelFlow: Number(nFlow.toFixed(1)),
      fuelRemaining: Number(fuel.fuelRemaining.toFixed(1)),
      batteryVoltage: Number(tBat.toFixed(1)),
      alternatorVoltage: Number(tAltV.toFixed(1)),
      altitude: Math.floor(newAlt),
      airspeed: Math.floor(flight.airspeed),
      oat, humidity: env.humidity, pressure: press,
      vibrationX: baseV * 0.5, vibrationY: baseV * 0.6, vibrationZ: baseV,
      health: health
    };

    wsClient.sendIngest(packet);
  }
}
export const simulation = new SimulationLoop();
""")

# --- UPDATE TELEMETRY STORE TO HAVE CONNECTION STATE ---
write("src/stores/telemetryStore.ts", """
import { create } from 'zustand';
export const useTelemetryStore = create<any>((set) => ({
  packet: null, packetCount: 0, connected: false,
  setTelemetry: (data: any) => set(data)
}));
""")

# --- UPDATE DASHBOARD UI TO USE TSDB WEBSOCKET DATA ---
# (I am injecting this replacement directly into page.tsx so the single page dashboard uses the WS telemetry payload)
write("src/app/page.tsx", """
"use client";
import { useEffect, useState } from 'react';
import { useMissionStore } from '@/stores/missionStore';
import { useEnvStore } from '@/stores/environmentStore';
import { useFaultStore } from '@/stores/faultStore';
import { useTelemetryStore } from '@/stores/telemetryStore';
import { simulation } from '@/simulation/SimulationLoop';

export default function UnifiedGCS() {
  const mission = useMissionStore(); const env = useEnvStore(); 
  const faultStore = useFaultStore(); const tel = useTelemetryStore();
  const p = tel.packet || {}; // Data now streams from Backend via WS!
  
  const [fType, setFType] = useState('Oil Leak');
  const [fSev, setFSev] = useState('MEDIUM');
  
  useEffect(() => { simulation.start(); }, []);

  const Panel = ({ title, children, cClass = '' }: any) => (
    <div className={`border border-blue-900 bg-gray-950 p-3 flex flex-col ${cClass}`}>
      <div className="text-blue-500 font-bold border-b border-blue-900 mb-2 pb-1 uppercase text-xs">{title}</div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
  const Val = ({ l, v, u, warn=false, crit=false }: any) => (
    <div className="flex justify-between text-xs py-0.5">
      <span className="text-gray-400">{l}</span>
      <span className={crit ? 'text-red-500 font-bold' : warn ? 'text-amber-500 font-bold' : 'text-green-400 font-bold'}>
        {typeof v === 'number' ? v.toFixed(1) : v} {u && <span className="text-gray-600 font-normal">{u}</span>}
      </span>
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col p-2 space-y-2 bg-black text-green-500 font-mono overflow-hidden">
      <div className="flex justify-between border border-blue-900 bg-gray-950 p-2 shrink-0">
        <div className="text-blue-400 font-bold tracking-widest uppercase">MALE UAV GCS - TIMESCALEDB LINKED</div>
        <div className="text-gray-500 text-xs">TSDB WS: <span className={tel.connected ? "text-green-500 animate-pulse" : "text-red-500"}>{tel.connected ? 'CONNECTED' : 'DISCONNECTED'}</span></div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-2 min-h-0">
        {/* LEFT */}
        <div className="col-span-3 flex flex-col gap-2 min-h-0">
          <Panel title="Mission Control">
             <div className="grid grid-cols-2 gap-1 mb-2">
               {['GROUND_IDLE', 'TAKEOFF', 'CLIMB', 'CRUISE', 'LOITER', 'DESCENT', 'LANDING'].map(ph => (
                 <button key={ph} onClick={()=>mission.setMission({phase: ph})} className={`text-[10px] p-1 border ${mission.phase === ph ? 'border-green-500 text-green-500 bg-green-900/30' : 'border-gray-800 text-gray-500'}`}>{ph}</button>
               ))}
             </div>
             <div className="flex space-x-1 mt-2">
               <button onClick={()=>mission.setMission({isActive:true})} className="flex-1 bg-green-900 text-green-400 text-xs py-1">START</button>
               <button onClick={()=>mission.setMission({isActive:false})} className="flex-1 bg-amber-900 text-amber-400 text-xs py-1">PAUSE</button>
               <button onClick={()=>mission.setMission({isActive:false, timer:0, phase:'GROUND_IDLE'})} className="flex-1 bg-red-900 text-red-400 text-xs py-1">STOP</button>
             </div>
          </Panel>
          <Panel title="Environment Controls">
             <div className="space-y-2 text-xs">
               <div><label className="text-gray-500 flex justify-between">Altitude (m) <span>{env.altitude.toFixed(0)}</span></label>
               <input type="range" min="0" max="10000" value={env.altitude} onChange={e=>env.setEnv({altitude: +e.target.value})} className="w-full" disabled={mission.isActive}/></div>
               <div><label className="text-gray-500 flex justify-between">OAT (°C) <span>{env.oat.toFixed(1)}</span></label>
               <input type="range" min="-30" max="55" value={env.oat} onChange={e=>env.setEnv({oat: +e.target.value})} className="w-full" disabled={mission.isActive}/></div>
               <div><label className="text-gray-500 flex justify-between">Humidity (%) <span>{env.humidity.toFixed(0)}</span></label>
               <input type="range" min="0" max="100" value={env.humidity} onChange={e=>env.setEnv({humidity: +e.target.value})} className="w-full"/></div>
             </div>
          </Panel>
          <Panel title="Fault Injection">
             <select value={fType} onChange={e=>setFType(e.target.value)} className="w-full bg-black border border-gray-800 text-xs text-white p-1 mb-1">
               {['Oil Leak', 'Fuel Leak', 'Turbo Failure', 'Spark Plug Failure', 'Injector Failure', 'Battery Failure', 'Alternator Failure', 'RPM Sensor Failure', 'CHT Sensor Failure', 'EGT Sensor Failure', 'Throttle Failure', 'Excessive Vibration', 'Overheating'].map(f=><option key={f}>{f}</option>)}
             </select>
             <select value={fSev} onChange={e=>setFSev(e.target.value)} className="w-full bg-black border border-gray-800 text-xs text-white p-1 mb-2">
               <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
             </select>
             <div className="flex space-x-1">
               <button onClick={()=>faultStore.addFault({id: Math.random().toString(), type: fType, severity: fSev, intensity: 0.01, timeAlive: 0})} className="flex-1 bg-red-900/50 text-red-500 border border-red-900 text-xs py-1">INJECT</button>
               <button onClick={faultStore.clearFaults} className="flex-1 bg-gray-900 text-gray-400 border border-gray-800 text-xs py-1">CLEAR</button>
             </div>
          </Panel>
        </div>

        {/* CENTER */}
        <div className="col-span-6 flex flex-col gap-2 min-h-0">
          <Panel title="Primary Engine Telemetry (STREAMED FROM WS)">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              <Val l="RPM" v={p.rpm||0} u="RPM" />
              <Val l="EGT" v={p.egt||0} u="°C" warn={(p.egt||0)>800} crit={(p.egt||0)>850}/>
              <Val l="CHT" v={p.cht||0} u="°C" warn={(p.cht||0)>180} crit={(p.cht||0)>220}/>
              <Val l="Oil Temp" v={p.oilTemp||0} u="°C" warn={(p.oilTemp||0)>110} crit={(p.oilTemp||0)>130}/>
              <Val l="Oil Pressure" v={p.oilPressure||0} u="kPa" warn={(p.oilPressure||0)<250} crit={(p.oilPressure||0)<150}/>
              <Val l="Fuel Flow" v={p.fuelFlow||0} u="L/hr" />
              <Val l="MAP" v={p.map||0} u="inHg" />
              <Val l="Battery" v={p.batteryVoltage||0} u="V" warn={(p.batteryVoltage||0)<25} crit={(p.batteryVoltage||0)<23}/>
              <Val l="Alternator" v={p.alternatorVoltage||0} u="V" />
              <Val l="Fuel Remaining" v={p.fuelRemaining||0} u="L" warn={(p.fuelRemaining||0)<40} crit={(p.fuelRemaining||0)<20}/>
            </div>
          </Panel>
          <Panel title="Flight Data & Environment (STREAMED FROM WS)">
             <div className="grid grid-cols-2 gap-x-8 gap-y-1">
               <Val l="Altitude" v={p.altitude||0} u="m" />
               <Val l="Airspeed" v={p.airspeed||0} u="km/h" />
               <Val l="OAT" v={p.oat||0} u="°C" />
               <Val l="Pressure" v={p.pressure||0} u="kPa" />
               <Val l="Vibration X" v={p.vibrationX||0} u="g" />
               <Val l="Vibration Z" v={p.vibrationZ||0} u="g" />
             </div>
          </Panel>
        </div>

        {/* RIGHT */}
        <div className="col-span-3 flex flex-col gap-2 min-h-0">
          <Panel title="Mission Status">
            <Val l="Current Mission" v={mission.phase} u="" />
            <Val l="Mission Time" v={mission.timer/60} u="min" />
          </Panel>
          <Panel title="Engine Health">
            <div className="text-center my-2">
              <div className={`text-3xl font-black ${(p.health||100) < 50 ? 'text-red-500' : (p.health||100) < 70 ? 'text-amber-500' : 'text-green-500'}`}>{p.health||100}%</div>
            </div>
          </Panel>
          <Panel title="Active Faults" cClass="flex-1">
             {faultStore.activeFaults.map((f: any) => (
               <div key={f.id} className="border border-red-900 bg-red-950/20 p-1 mb-1 text-[10px]">
                 <div className="flex justify-between text-red-500 font-bold"><span>{f.type}</span><button onClick={()=>faultStore.removeFault(f.id)} className="text-gray-500 hover:text-white px-1">X</button></div>
                 <div className="flex justify-between text-gray-400"><span>{f.severity}</span><span>{(f.intensity*100).toFixed(0)}% | {f.timeAlive.toFixed(1)}s</span></div>
               </div>
             ))}
          </Panel>
        </div>
      </div>

      <Panel title={`TIMESCALEDB STREAM // 10 HZ // PACKETS RX: ${tel.packetCount}`} cClass="h-48 shrink-0">
        <pre className="text-[10px] text-green-500">
          {tel.packet ? JSON.stringify(tel.packet) : 'AWAITING LINK...'}
        </pre>
      </Panel>
    </div>
  );
}
""")
print("TimescaleDB Phase 3 Integrated!")
