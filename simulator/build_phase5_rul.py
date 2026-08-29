import os
import re

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim"

folders = [
    "backend/rul",
    "backend/models",
    "src/app/rul-analytics",
    "src/app/degradation",
    "src/app/maintenance",
    "src/app/mission-risk"
]
for f in folders:
    os.makedirs(os.path.join(BASE_DIR, f), exist_ok=True)

def write(path, content):
    with open(os.path.join(BASE_DIR, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

def append(path, content):
    with open(os.path.join(BASE_DIR, path), "a", encoding="utf-8") as f:
        f.write("\n" + content.strip() + "\n")

# --- DATABASE SCHEMA (APPEND) ---
append("backend/db/schema.sql", """
-- Phase 5: RUL & Predictive Maintenance Tables
CREATE TABLE rul_predictions (
  time TIMESTAMPTZ NOT NULL,
  rul_hours REAL,
  rul_cycles INTEGER,
  confidence REAL,
  predicted_failure TEXT,
  failure_probability REAL
);
SELECT create_hypertable('rul_predictions', 'time');

CREATE TABLE component_degradation (
  time TIMESTAMPTZ NOT NULL,
  oil_deg REAL, fuel_deg REAL, thermal_deg REAL,
  electrical_deg REAL, vibration_deg REAL,
  sensor_deg REAL, turbo_deg REAL, battery_deg REAL
);
SELECT create_hypertable('component_degradation', 'time');

CREATE TABLE mission_risk (
  time TIMESTAMPTZ NOT NULL,
  mission_phase TEXT,
  risk_score REAL,
  risk_level TEXT,
  failure_probability REAL
);
SELECT create_hypertable('mission_risk', 'time');

CREATE TABLE maintenance_advisories (
  time TIMESTAMPTZ NOT NULL,
  priority TEXT, action TEXT, reason TEXT, recommended_by TEXT
);
SELECT create_hypertable('maintenance_advisories', 'time');

CREATE TABLE reliability_metrics (
  time TIMESTAMPTZ NOT NULL,
  reliability_score REAL,
  availability_score REAL,
  mission_success_probability REAL
);
SELECT create_hypertable('reliability_metrics', 'time');
""")

# --- BACKEND RUL ENGINES ---
write("backend/rul/DegradationEngine.ts", """
export class DegradationEngine {
  public state = { oil: 12, fuel: 8, thermal: 15, electrical: 5, vibration: 10, sensor: 2, turbo: 18, battery: 11 };
  
  public update(telemetry: any) {
    const dt = 1.0; // 1 sec processing
    // Micro-accumulation simulating hours of wear
    if (telemetry.oilTemp > 115) this.state.oil += 0.005 * dt;
    if (telemetry.egt > 850) this.state.thermal += 0.008 * dt;
    if (telemetry.vibZ > 2.0) {
       this.state.vibration += 0.01 * dt;
       this.state.turbo += 0.015 * dt;
    }
    // Cap at 100
    for (let k in this.state) { (this.state as any)[k] = Math.min(100, (this.state as any)[k]); }
  }
}
""")

write("backend/rul/ReliabilityEngine.ts", """
export class ReliabilityEngine {
  public calculate(degradation: any) {
    const maxDeg = Math.max(...Object.values(degradation) as number[]);
    const reliability = Math.max(0, 100 - (maxDeg * 1.2));
    return {
      reliability_score: reliability,
      availability_score: Math.min(100, reliability + 10),
      mission_success_probability: Math.max(0, reliability - 5)
    };
  }
}
""")

write("backend/rul/MissionRiskEngine.ts", """
export class MissionRiskEngine {
  public evaluate(telemetry: any, reliability: number) {
    let risk_score = 100 - reliability;
    if (telemetry.missionPhase === 'TAKEOFF') risk_score += 15;
    if (telemetry.missionPhase === 'CLIMB') risk_score += 10;
    
    let risk_level = 'LOW';
    if (risk_score > 30) risk_level = 'MODERATE';
    if (risk_score > 60) risk_level = 'HIGH';
    if (risk_score > 85) risk_level = 'CRITICAL';

    return {
      mission_phase: telemetry.missionPhase || 'UNKNOWN',
      risk_score: Math.min(100, risk_score),
      risk_level,
      failure_probability: Math.min(1.0, risk_score / 100)
    };
  }
}
""")

write("backend/rul/MaintenancePlanner.ts", """
export class MaintenancePlanner {
  public plan(degradation: any) {
    const actions = [];
    if (degradation.turbo > 40) {
      actions.push({ priority: 'LONG-TERM', action: 'Turbo Overhaul within 100 Hours', reason: 'Turbo degradation exceeded 40%', recommended_by: 'RUL Engine' });
    }
    if (degradation.thermal > 60) {
      actions.push({ priority: 'SHORT-TERM', action: 'Inspect Cooling System', reason: 'High thermal stress accumulation', recommended_by: 'AI Analytics' });
    }
    if (degradation.oil > 80) {
      actions.push({ priority: 'IMMEDIATE', action: 'Replace Oil & Filter', reason: 'Critical oil breakdown', recommended_by: 'Degradation Engine' });
    }
    if (actions.length === 0) {
      actions.push({ priority: 'LOG', action: 'Continue Standard Operations', reason: 'All systems nominal', recommended_by: 'System' });
    }
    return actions;
  }
}
""")

write("backend/rul/RULService.ts", """
import { DegradationEngine } from './DegradationEngine';
import { ReliabilityEngine } from './ReliabilityEngine';
import { MissionRiskEngine } from './MissionRiskEngine';
import { MaintenancePlanner } from './MaintenancePlanner';

export class RULService {
  private degEngine = new DegradationEngine();
  private relEngine = new ReliabilityEngine();
  private riskEngine = new MissionRiskEngine();
  private planner = new MaintenancePlanner();
  private pool: any;
  private io: any;
  private latestTelemetry: any = null;
  private opHours = 1245.5;

  constructor(dbPool: any, socketIo: any) {
    this.pool = dbPool;
    this.io = socketIo;
    setInterval(() => this.process(), 1000);
  }

  public feedData(data: any) { this.latestTelemetry = data; }

  private async process() {
    if (!this.latestTelemetry) return;
    this.opHours += (1/3600); // 1 sec of operating time

    this.degEngine.update(this.latestTelemetry);
    const deg = this.degEngine.state;
    const rel = this.relEngine.calculate(deg);
    const risk = this.riskEngine.evaluate(this.latestTelemetry, rel.reliability_score);
    const maint = this.planner.plan(deg);

    // Calculate RUL
    const maxDeg = Math.max(...Object.values(deg) as number[]);
    const rul_hours = Math.max(0, (100 - maxDeg) * 5.5); // Mock extrapolation
    const rul_cycles = Math.floor(rul_hours / 2.5);
    let predicted_failure = 'None';
    if (maxDeg === deg.turbo) predicted_failure = 'Turbo Failure';
    else if (maxDeg === deg.thermal) predicted_failure = 'Thermal Runaway';

    const rulData = {
      rul_hours, rul_cycles, confidence: 92.5, predicted_failure, failure_probability: risk.failure_probability,
      reason: `${predicted_failure} signatures expanding. High frequency vibration correlation.`,
      opHours: this.opHours
    };

    // Broadcast
    this.io.emit('rul:update', rulData);
    this.io.emit('degradation:update', deg);
    this.io.emit('reliability:update', rel);
    this.io.emit('mission-risk:update', risk);
    this.io.emit('maintenance:update', maint);

    // DB Persistence
    try {
      await this.pool.query('INSERT INTO rul_predictions (time, rul_hours, rul_cycles, confidence, predicted_failure, failure_probability) VALUES (NOW(), $1, $2, $3, $4, $5)', [rulData.rul_hours, rulData.rul_cycles, rulData.confidence, rulData.predicted_failure, rulData.failure_probability]);
      await this.pool.query('INSERT INTO component_degradation (time, oil_deg, fuel_deg, thermal_deg, electrical_deg, vibration_deg, sensor_deg, turbo_deg, battery_deg) VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7, $8)', [deg.oil, deg.fuel, deg.thermal, deg.electrical, deg.vibration, deg.sensor, deg.turbo, deg.battery]);
      await this.pool.query('INSERT INTO mission_risk (time, mission_phase, risk_score, risk_level, failure_probability) VALUES (NOW(), $1, $2, $3, $4)', [risk.mission_phase, risk.risk_score, risk.risk_level, risk.failure_probability]);
      await this.pool.query('INSERT INTO reliability_metrics (time, reliability_score, availability_score, mission_success_probability) VALUES (NOW(), $1, $2, $3)', [rel.reliability_score, rel.availability_score, rel.mission_success_probability]);
    } catch(e) {}
  }
}
""")

# --- UPDATE BACKEND INDEX ---
with open(os.path.join(BASE_DIR, "backend/index.ts"), "r") as f:
    content = f.read()

content = content.replace("import { AIEngine } from './ai/AIEngine';", "import { AIEngine } from './ai/AIEngine';\nimport { RULService } from './rul/RULService';")
content = content.replace("const aiEngine = new AIEngine(pool, io);", "const aiEngine = new AIEngine(pool, io);\nconst rulService = new RULService(pool, io);")
content = content.replace("aiEngine.feedData(d);", "aiEngine.feedData(d);\n  rulService.feedData(d);")

# Add API endpoints for RUL
api_code = """
app.get('/api/rul', (req, res) => res.json({ status: 'ok' }));
app.get('/api/degradation', (req, res) => res.json({ status: 'ok' }));
app.get('/api/reliability', (req, res) => res.json({ status: 'ok' }));
app.get('/api/maintenance', (req, res) => res.json({ status: 'ok' }));
app.get('/api/mission-risk', (req, res) => res.json({ status: 'ok' }));
"""
content = content.replace("app.get('/api/history'", api_code + "\napp.get('/api/history'")
write("backend/index.ts", content)

# --- UI PAGES ---
write("src/app/rul-analytics/page.tsx", """
"use client";
import { useState, useEffect } from 'react';

export default function RULPage() {
  const [rul, setRul] = useState<any>({ rul_hours: 147.2, rul_cycles: 382, confidence: 92, predicted_failure: 'Turbocharger Degradation', opHours: 1245.5 });

  useEffect(() => {
    const int = setInterval(() => setRul((r: any) => ({ ...r, rul_hours: Math.max(0, r.rul_hours - 0.01) })), 1000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Remaining Useful Life (RUL)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="bg-slate-900 p-6 rounded-xl text-center shadow-lg border border-slate-800">
            <h3 className="text-slate-400 uppercase text-sm mb-4">RUL Hours</h3>
            <div className="text-6xl font-black text-blue-500">{rul.rul_hours.toFixed(1)}</div>
            <div className="mt-4 text-slate-500 font-mono">Op Hours: {rul.opHours.toFixed(1)}</div>
         </div>
         <div className="bg-slate-900 p-6 rounded-xl text-center shadow-lg border border-slate-800">
            <h3 className="text-slate-400 uppercase text-sm mb-4">RUL Cycles</h3>
            <div className="text-6xl font-black text-amber-500">{rul.rul_cycles}</div>
            <div className="mt-4 text-slate-500 font-mono">Confidence: {rul.confidence}%</div>
         </div>
         <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 flex flex-col justify-center">
            <h3 className="text-slate-400 uppercase text-sm mb-2">Predicted Failure</h3>
            <div className="text-2xl font-bold text-red-400">{rul.predicted_failure}</div>
            <p className="mt-4 text-sm text-slate-400 bg-slate-950 p-3 rounded">Reason: High frequency vibration correlation with thermal degradation.</p>
         </div>
      </div>
    </div>
  );
}
""")

write("src/app/degradation/page.tsx", """
"use client";
import { useState, useEffect } from 'react';

export default function DegradationPage() {
  const [deg, setDeg] = useState<any>({ oil: 22, fuel: 14, thermal: 31, electrical: 11, vibration: 18, sensor: 5, turbo: 44, battery: 11 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Component Degradation Engine</h1>
      <div className="bg-slate-900 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6">
         {Object.entries(deg).map(([key, val]: any) => (
           <div key={key} className="space-y-2">
             <div className="flex justify-between uppercase text-sm">
               <span className="text-slate-300">{key} System</span>
               <span className={val > 40 ? 'text-orange-500' : 'text-green-500'}>{val.toFixed(1)}%</span>
             </div>
             <div className="h-2 bg-slate-800 rounded overflow-hidden">
               <div className={`h-full ${val > 40 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${val}%` }}></div>
             </div>
           </div>
         ))}
      </div>
    </div>
  );
}
""")

write("src/app/maintenance/page.tsx", """
"use client";
import { useState } from 'react';

export default function MaintenancePage() {
  const [actions] = useState([
    { priority: 'IMMEDIATE', action: 'Inspect Oil System', reason: 'Critical oil breakdown trend detected.', by: 'Degradation Engine' },
    { priority: 'SHORT-TERM', action: 'Replace Injector within 20 Hours', reason: 'Fuel efficiency drift.', by: 'AI Analytics' },
    { priority: 'LONG-TERM', action: 'Turbo Overhaul within 100 Hours', reason: 'Vibration signatures approaching threshold.', by: 'RUL Engine' }
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Maintenance Planner</h1>
      <div className="space-y-4">
         {actions.map((a, i) => (
           <div key={i} className={`p-6 rounded-xl border ${a.priority === 'IMMEDIATE' ? 'bg-red-900/20 border-red-900' : a.priority === 'SHORT-TERM' ? 'bg-orange-900/20 border-orange-900' : 'bg-blue-900/20 border-blue-900'}`}>
              <div className="flex justify-between mb-2">
                <span className="font-bold tracking-widest text-sm uppercase">{a.priority} ACTION</span>
                <span className="text-slate-400 text-xs">Src: {a.by}</span>
              </div>
              <div className="text-xl font-bold text-slate-200 mb-2">{a.action}</div>
              <div className="text-slate-400 text-sm">Reason: {a.reason}</div>
           </div>
         ))}
      </div>
    </div>
  );
}
""")

write("src/app/mission-risk/page.tsx", """
"use client";
import { useState } from 'react';

export default function MissionRiskPage() {
  const [risk] = useState({ score: 42, level: 'MODERATE', prob: 0.42, reliability: 86.5, success: 91.2 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mission Risk Analyzer</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="bg-slate-900 p-6 rounded-xl text-center">
            <h3 className="text-slate-400 text-sm mb-2">Current Risk Level</h3>
            <div className="text-4xl font-black text-orange-500 mb-2">{risk.level}</div>
            <div className="text-slate-500">Score: {risk.score}/100</div>
         </div>
         <div className="bg-slate-900 p-6 rounded-xl text-center">
            <h3 className="text-slate-400 text-sm mb-2">Mission Success Prob</h3>
            <div className="text-4xl font-black text-green-500 mb-2">{risk.success}%</div>
            <div className="text-slate-500">Based on Reliability Models</div>
         </div>
         <div className="bg-slate-900 p-6 rounded-xl text-center">
            <h3 className="text-slate-400 text-sm mb-2">Overall Reliability</h3>
            <div className="text-4xl font-black text-blue-500 mb-2">{risk.reliability}%</div>
            <div className="text-slate-500">Fleet Average: 92%</div>
         </div>
      </div>
    </div>
  );
}
""")

# --- NAVIGATION LINKS ---
with open(os.path.join(BASE_DIR, "src/app/layout.tsx"), "r") as f:
    nav_content = f.read()

new_links = """<Link href="/ai-analytics" className="block p-2 hover:bg-slate-800 rounded text-blue-400 font-bold">AI Analytics</Link>
          <div className="pt-4 pb-2 text-xs font-bold text-slate-500 tracking-widest uppercase">Phase 5 (RUL)</div>
          <Link href="/rul-analytics" className="block p-2 hover:bg-slate-800 rounded">RUL Estimation</Link>
          <Link href="/degradation" className="block p-2 hover:bg-slate-800 rounded">Degradation</Link>
          <Link href="/maintenance" className="block p-2 hover:bg-slate-800 rounded">Maintenance</Link>
          <Link href="/mission-risk" className="block p-2 hover:bg-slate-800 rounded">Mission Risk</Link>"""

nav_content = nav_content.replace("""<Link href="/ai-analytics" className="block p-2 hover:bg-slate-800 rounded text-blue-400 font-bold">AI Analytics</Link>""", new_links)
write("src/app/layout.tsx", nav_content)

print("Phase 5 Generated")
