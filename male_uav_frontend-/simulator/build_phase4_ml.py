import os

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim"

folders = [
    "backend/ai",
    "src/app/ai-analytics"
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
-- Phase 4: AI Analytics Tables
CREATE TABLE ai_anomalies (
  time TIMESTAMPTZ NOT NULL,
  anomaly_score REAL,
  anomaly_type TEXT,
  severity TEXT,
  confidence REAL
);
SELECT create_hypertable('ai_anomalies', 'time');

CREATE TABLE ai_predictions (
  time TIMESTAMPTZ NOT NULL,
  predicted_failure TEXT,
  probability REAL,
  confidence REAL,
  prediction_horizon TEXT
);
SELECT create_hypertable('ai_predictions', 'time');

CREATE TABLE ai_recommendations (
  time TIMESTAMPTZ NOT NULL,
  recommendation TEXT,
  priority TEXT,
  reason TEXT
);
SELECT create_hypertable('ai_recommendations', 'time');
""")

# --- BACKEND AI ENGINE (Simulated Inference Worker) ---
write("backend/ai/AIEngine.ts", """
// Runs asynchronously without blocking the main telemetry thread
export class AIEngine {
  private telemetryWindow: any[] = [];
  private pool: any;
  private io: any;

  constructor(dbPool: any, socketIo: any) {
    this.pool = dbPool;
    this.io = socketIo;
    // 1-second inference loop
    setInterval(() => this.infer(), 1000);
  }

  public feedData(data: any) {
    this.telemetryWindow.push(data);
    if (this.telemetryWindow.length > 100) this.telemetryWindow.shift(); // Keep last 10 seconds (100 samples at 10Hz)
  }

  private async infer() {
    if (this.telemetryWindow.length < 10) return;
    const current = this.telemetryWindow[this.telemetryWindow.length - 1];

    // 1. Feature Engineering
    const sumTemp = this.telemetryWindow.reduce((a, b) => a + b.oilTemp, 0);
    const rollingMeanOil = sumTemp / this.telemetryWindow.length;
    const tempGradient = current.oilTemp - this.telemetryWindow[0].oilTemp;
    const thermalStressIndex = (current.egt / 900) * 0.5 + (current.cht / 150) * 0.5;

    // 2. Anomaly Detection (Simulated Isolation Forest Z-Score)
    let anomalyScore = 0.0;
    let anomalyType = 'None';
    let severity = 'Green';

    if (thermalStressIndex > 0.85) {
      anomalyScore = 0.75 + Math.random() * 0.2;
      anomalyType = 'Thermal Runaway';
      severity = anomalyScore > 0.9 ? 'Red' : 'Orange';
    } else if (current.vibZ > 3.0) {
      anomalyScore = 0.8;
      anomalyType = 'Abnormal Vibration';
      severity = 'Orange';
    } else if (Math.abs(current.oilTemp - rollingMeanOil) > 10) {
      anomalyScore = 0.6;
      anomalyType = 'Sensor Drift';
      severity = 'Yellow';
    }

    // 3. Failure Prediction & Explainable AI
    let predictedFailure = 'None';
    let probability = 0.01;
    let confidence = 0.99;
    let reason = 'System operating nominally.';
    let recommendation = 'Continue standard operations.';
    let priority = 'LOW';

    if (anomalyType === 'Thermal Runaway') {
      predictedFailure = 'Overheating Event';
      probability = 0.88;
      confidence = 0.92;
      reason = `Thermal Stress Index at ${(thermalStressIndex*100).toFixed(0)}%. Oil Temp gradient $+${tempGradient.toFixed(1)}C over 10s.`;
      recommendation = 'Inspect lubrication system and cooling baffles immediately.';
      priority = 'CRITICAL';
    } else if (anomalyType === 'Abnormal Vibration') {
      predictedFailure = 'Bearing/Turbo Failure';
      probability = 0.76;
      confidence = 0.85;
      reason = `Z-axis vibration spikes detected at ${current.vibZ.toFixed(2)}g. Associated with 255Hz and 510Hz bands.`;
      recommendation = 'Inspect bearing assembly and turbocharger shaft.';
      priority = 'HIGH';
    }

    const payload = {
      timestamp: Date.now(),
      anomaly: { score: anomalyScore, type: anomalyType, severity },
      prediction: { failure: predictedFailure, probability, confidence, horizon: 'Next 30 minutes', reason },
      maintenance: { recommendation, priority }
    };

    // Broadcast Real-time
    this.io.emit('ai:update', payload);

    // Persist to DB (Timescale)
    try {
      if (anomalyScore > 0.1) {
        await this.pool.query(
          `INSERT INTO ai_anomalies (time, anomaly_score, anomaly_type, severity, confidence) VALUES (NOW(), $1, $2, $3, $4)`,
          [anomalyScore, anomalyType, severity, confidence]
        );
        await this.pool.query(
          `INSERT INTO ai_predictions (time, predicted_failure, probability, confidence, prediction_horizon) VALUES (NOW(), $1, $2, $3, $4)`,
          [predictedFailure, probability, confidence, payload.prediction.horizon]
        );
        await this.pool.query(
          `INSERT INTO ai_recommendations (time, recommendation, priority, reason) VALUES (NOW(), $1, $2, $3)`,
          [recommendation, priority, reason]
        );
      }
    } catch(e) {} // Ignore if DB offline
  }
}
""")

# --- UPDATE BACKEND INDEX TO HOOK UP AI ENGINE ---
# We modify backend/index.ts to intercept incoming telemetry and pass it to AIEngine
import re
with open(os.path.join(BASE_DIR, "backend/index.ts"), "r") as f:
    content = f.read()

content = content.replace("import { Pool } from 'pg';", "import { Pool } from 'pg';\nimport { AIEngine } from './ai/AIEngine';")
content = content.replace("const pool = new Pool", "const pool = new Pool")
# Hook AI engine initialization
content = content.replace("const pool = new Pool({", """
const pool = new Pool({""")
# Add init after pool setup
init_code = "\nconst aiEngine = new AIEngine(pool, io);\n"
content = content.replace("port: 5432,\n});", "port: 5432,\n});\n" + init_code)

# Feed data to AI engine
content = content.replace("io.emit('telemetry:update', d);", "io.emit('telemetry:update', d);\n  aiEngine.feedData(d);")

write("backend/index.ts", content)

# --- UI AI ANALYTICS PAGE ---
write("src/app/ai-analytics/page.tsx", """
"use client";
import { useState, useEffect } from 'react';

export default function AIPage() {
  const [aiData, setAiData] = useState<any>(null);

  useEffect(() => {
    // In a real app this uses socket.io-client listening to 'ai:update'
    // Mocking for the UI page based on standard payload
    const mockInterval = setInterval(() => {
       const hasFault = Math.random() > 0.8;
       setAiData({
          anomaly: { 
            score: hasFault ? 0.82 : 0.05, 
            type: hasFault ? 'Thermal Runaway' : 'None', 
            severity: hasFault ? 'Orange' : 'Green' 
          },
          prediction: { 
            failure: hasFault ? 'Overheating Event' : 'None', 
            probability: hasFault ? 0.88 : 0.01, 
            confidence: 0.92, 
            horizon: 'Next 30 minutes',
            reason: hasFault ? 'Thermal Stress Index elevated. Oil Temp gradient high.' : 'Nominal operations.'
          },
          maintenance: { 
            recommendation: hasFault ? 'Inspect lubrication system immediately.' : 'Continue standard operations.', 
            priority: hasFault ? 'CRITICAL' : 'LOW' 
          }
       });
    }, 1000);
    return () => clearInterval(mockInterval);
  }, []);

  if (!aiData) return <div className="p-8 text-slate-400">Loading AI Inference Engine...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">AI Analytics & Prognostics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Anomaly Detection */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-center space-y-4 shadow-lg">
           <h3 className="text-sm uppercase tracking-widest text-slate-400">Anomaly Score</h3>
           <div className={`text-6xl font-black ${aiData.anomaly.severity === 'Orange' ? 'text-orange-500' : 'text-green-500'}`}>
             {(aiData.anomaly.score * 100).toFixed(1)}%
           </div>
           <div className="text-xl font-bold uppercase">{aiData.anomaly.type}</div>
           <div className="text-xs text-slate-500">Isolation Forest Confidence: 94%</div>
        </div>

        {/* Prediction Explainability */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl lg:col-span-2 shadow-lg space-y-4">
           <h3 className="text-sm uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2">Failure Prediction (XAI)</h3>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <div className="text-slate-500 text-sm">Predicted Event</div>
               <div className={`text-xl font-bold ${aiData.prediction.failure !== 'None' ? 'text-red-500' : 'text-slate-200'}`}>{aiData.prediction.failure}</div>
             </div>
             <div>
               <div className="text-slate-500 text-sm">Probability / Horizon</div>
               <div className="text-xl font-mono">{(aiData.prediction.probability * 100).toFixed(1)}% <span className="text-sm text-slate-400 ml-2">[{aiData.prediction.horizon}]</span></div>
             </div>
           </div>
           <div className="bg-slate-950 p-4 rounded border border-slate-800 font-mono text-sm">
              <span className="text-blue-500">[REASONING] </span>
              <span className="text-slate-300">{aiData.prediction.reason}</span>
           </div>
        </div>

      </div>

      {/* Maintenance Advisor */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
         <h3 className="text-sm uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2">Maintenance Advisor</h3>
         <div className={`p-4 rounded-lg flex items-center justify-between ${aiData.maintenance.priority === 'CRITICAL' ? 'bg-red-900/20 border border-red-900 text-red-400' : 'bg-green-900/20 border border-green-900 text-green-400'}`}>
            <div>
              <div className="font-bold tracking-widest text-xs uppercase mb-1">{aiData.maintenance.priority} ACTION REQUIRED</div>
              <div>{aiData.maintenance.recommendation}</div>
            </div>
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-bold text-sm">Acknowledge</button>
         </div>
      </div>
    </div>
  );
}
""")

# --- UPDATE NAVIGATION IN LAYOUT ---
with open(os.path.join(BASE_DIR, "src/app/layout.tsx"), "r") as f:
    nav_content = f.read()

nav_content = nav_content.replace(
    """<Link href="/health-monitor" className="block p-2 hover:bg-slate-800 rounded">Health Monitor</Link>""",
    """<Link href="/health-monitor" className="block p-2 hover:bg-slate-800 rounded">Health Monitor</Link>
          <Link href="/ai-analytics" className="block p-2 hover:bg-slate-800 rounded text-blue-400 font-bold">AI Analytics</Link>"""
)
write("src/app/layout.tsx", nav_content)

print("Phase 4 ML Engine generated.")
