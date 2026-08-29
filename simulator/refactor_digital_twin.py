import os
import shutil

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim/src"

# 1. Clean up old routes
routes_to_remove = [
    "engine-setup", "environment", "export", "mission-replay", 
    "history", "settings", "mission-setup", "fault-injection", "health-ai", "simulation-control"
]

for r in routes_to_remove:
    path = os.path.join(BASE_DIR, "app", r)
    if os.path.exists(path):
        shutil.rmtree(path)

# Ensure new routes exist
new_routes = ["mission", "physics", "telemetry", "faults", "health", "logs"]
for r in new_routes:
    os.makedirs(os.path.join(BASE_DIR, "app", r), exist_ok=True)
    
os.makedirs(os.path.join(BASE_DIR, "services"), exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "store"), exist_ok=True)

def write(path, content):
    with open(os.path.join(BASE_DIR, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# 2. Webhook Service
write("services/webhook.ts", """
export class WebhookService {
  static async sendUpdate(category: string, key: string, value: any) {
    const payload = { category, key, value, timestamp: Date.now() };
    // Simulate webhook transmission
    console.log('[WEBHOOK TX]', payload);
    // In production: fetch('https://api.example.com/webhook', { method: 'POST', body: JSON.stringify(payload) })
  }
}
""")

# 3. Store
write("store/digitalTwinStore.ts", """
import { create } from 'zustand';
import { WebhookService } from '../services/webhook';

interface DigitalTwinState {
  physics: { mass: number; drag: number; lift: number; thrust: number; efficiency: number; };
  mission: { aircraft: string; payload: number; fuel: number; weather: string; wind: number; altitude: number; };
  faults: { engineOverheat: boolean; fuelLeak: boolean; sensorFailure: boolean; batteryFailure: boolean; gpsLoss: boolean; turbulence: boolean; };
  health: { score: number; status: string; recommendations: string[]; };
  
  updatePhysics: (key: keyof DigitalTwinState['physics'], val: number) => void;
  updateMission: (key: keyof DigitalTwinState['mission'], val: any) => void;
  toggleFault: (key: keyof DigitalTwinState['faults']) => void;
}

export const useTwinStore = create<DigitalTwinState>((set, get) => ({
  physics: { mass: 1200, drag: 0.03, lift: 0.5, thrust: 85, efficiency: 90 },
  mission: { aircraft: 'UAV-MQ9', payload: 250, fuel: 100, weather: 'Clear', wind: 12, altitude: 15000 },
  faults: { engineOverheat: false, fuelLeak: false, sensorFailure: false, batteryFailure: false, gpsLoss: false, turbulence: false },
  health: { score: 98, status: 'NOMINAL', recommendations: ['Monitor fuel flow', 'Routine inspection in 10hrs'] },

  updatePhysics: (key, val) => {
    set(s => ({ physics: { ...s.physics, [key]: val } }));
    WebhookService.sendUpdate('physics', key, val);
  },
  updateMission: (key, val) => {
    set(s => ({ mission: { ...s.mission, [key]: val } }));
    WebhookService.sendUpdate('mission', key as string, val);
  },
  toggleFault: (key) => {
    const newVal = !get().faults[key];
    set(s => ({ faults: { ...s.faults, [key]: newVal } }));
    WebhookService.sendUpdate('faults', key, newVal);
  }
}));
""")

# 4. Sidebar
write("components/layout/Sidebar.tsx", """
import Link from 'next/link';

const pages = [
  { path: '/', label: 'Dashboard' },
  { path: '/mission', label: 'Mission Config' },
  { path: '/physics', label: 'Physics Controls' },
  { path: '/telemetry', label: 'Live Telemetry' },
  { path: '/faults', label: 'Fault Injection' },
  { path: '/health', label: 'AI Health Monitor' },
  { path: '/logs', label: 'Logs' }
];

export function Sidebar() {
  return (
    <aside className="w-[260px] h-full bg-[#030712]/80 backdrop-blur-xl border-r border-white/5 text-slate-300 flex flex-col z-20 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-white/5 bg-blue-900/10">
        <div className="font-bold tracking-widest text-blue-400 text-sm">DIGITAL TWIN OS</div>
      </div>
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {pages.map((p) => (
          <Link key={p.path} href={p.path} className="block px-4 py-3 text-sm font-medium rounded-xl hover:bg-white/5 hover:text-white transition-all border border-transparent hover:border-white/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            {p.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
""")

# 5. Dashboard
write("app/page.tsx", """
"use client";
import { useTwinStore } from '@/store/digitalTwinStore';

export default function Dashboard() {
  const { physics, mission, faults, health } = useTwinStore();
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">Command Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-sm font-medium text-blue-300 uppercase tracking-wider mb-2">Altitude</div>
          <div className="text-4xl font-mono text-white">{mission.altitude}<span className="text-lg text-slate-400 ml-1">ft</span></div>
        </div>
        
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="text-sm font-medium text-blue-300 uppercase tracking-wider mb-2">Thrust</div>
          <div className="text-4xl font-mono text-white">{physics.thrust}<span className="text-lg text-slate-400 ml-1">%</span></div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="text-sm font-medium text-blue-300 uppercase tracking-wider mb-2">Fuel Level</div>
          <div className="text-4xl font-mono text-white">{mission.fuel}<span className="text-lg text-slate-400 ml-1">kg</span></div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="text-sm font-medium text-emerald-400 uppercase tracking-wider mb-2">AI Health</div>
          <div className="text-4xl font-mono text-white">{health.score}<span className="text-lg text-slate-400 ml-1">%</span></div>
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl min-h-[400px] flex items-center justify-center">
         <div className="text-center space-y-4">
           <div className="w-48 h-48 rounded-full border border-blue-500/30 flex items-center justify-center relative animate-[spin_20s_linear_infinite]">
             <div className="w-40 h-40 rounded-full border border-dashed border-blue-400/50"></div>
             <div className="w-2 h-2 bg-blue-400 rounded-full absolute top-0 animate-ping"></div>
           </div>
           <p className="text-blue-300 tracking-widest uppercase text-sm mt-8">Digital Twin Sync Active</p>
         </div>
      </div>
    </div>
  );
}
""")

# 6. Mission Config
write("app/mission/page.tsx", """
"use client";
import { useTwinStore } from '@/store/digitalTwinStore';

export default function MissionConfig() {
  const mission = useTwinStore(s => s.mission);
  const update = useTwinStore(s => s.updateMission);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">Mission Parameters</h1>
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl max-w-2xl space-y-6">
        
        <div className="space-y-3">
          <label className="text-sm text-blue-300 uppercase tracking-widest">Aircraft Designation</label>
          <input type="text" value={mission.aircraft} onChange={e => update('aircraft', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors" />
        </div>

        <div className="space-y-3">
          <label className="text-sm text-blue-300 uppercase tracking-widest flex justify-between">
            <span>Target Altitude</span>
            <span className="text-white font-mono">{mission.altitude} ft</span>
          </label>
          <input type="range" min="0" max="50000" step="500" value={mission.altitude} onChange={e => update('altitude', +e.target.value)} className="w-full accent-blue-500" />
        </div>

        <div className="space-y-3">
          <label className="text-sm text-blue-300 uppercase tracking-widest flex justify-between">
            <span>Payload Weight</span>
            <span className="text-white font-mono">{mission.payload} kg</span>
          </label>
          <input type="range" min="0" max="1000" step="10" value={mission.payload} onChange={e => update('payload', +e.target.value)} className="w-full accent-blue-500" />
        </div>

        <div className="space-y-3">
          <label className="text-sm text-blue-300 uppercase tracking-widest flex justify-between">
            <span>Initial Fuel</span>
            <span className="text-white font-mono">{mission.fuel} kg</span>
          </label>
          <input type="range" min="0" max="500" step="5" value={mission.fuel} onChange={e => update('fuel', +e.target.value)} className="w-full accent-blue-500" />
        </div>

      </div>
    </div>
  );
}
""")

# 7. Physics Controls
write("app/physics/page.tsx", """
"use client";
import { useTwinStore } from '@/store/digitalTwinStore';

export default function PhysicsControls() {
  const phys = useTwinStore(s => s.physics);
  const update = useTwinStore(s => s.updatePhysics);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">Physics Engine</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl space-y-8">
          
          <div className="space-y-3">
            <div className="flex justify-between items-center"><label className="text-sm text-blue-300 uppercase tracking-widest">Thrust</label><span className="font-mono text-white">{phys.thrust}%</span></div>
            <input type="range" min="0" max="100" value={phys.thrust} onChange={e => update('thrust', +e.target.value)} className="w-full accent-blue-500" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center"><label className="text-sm text-blue-300 uppercase tracking-widest">Aircraft Mass</label><span className="font-mono text-white">{phys.mass} kg</span></div>
            <input type="range" min="500" max="2500" value={phys.mass} onChange={e => update('mass', +e.target.value)} className="w-full accent-blue-500" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center"><label className="text-sm text-blue-300 uppercase tracking-widest">Drag Coefficient</label><span className="font-mono text-white">{phys.drag}</span></div>
            <input type="range" min="0.01" max="0.1" step="0.001" value={phys.drag} onChange={e => update('drag', +e.target.value)} className="w-full accent-blue-500" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center"><label className="text-sm text-blue-300 uppercase tracking-widest">Engine Efficiency</label><span className="font-mono text-white">{phys.efficiency}%</span></div>
            <input type="range" min="10" max="100" value={phys.efficiency} onChange={e => update('efficiency', +e.target.value)} className="w-full accent-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
""")

# 8. Fault Injection
write("app/faults/page.tsx", """
"use client";
import { useTwinStore } from '@/store/digitalTwinStore';

export default function FaultsPage() {
  const faults = useTwinStore(s => s.faults);
  const toggle = useTwinStore(s => s.toggleFault);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">Fault Injection</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {Object.entries(faults).map(([key, isActive]) => (
          <div key={key} className={`bg-slate-900/40 backdrop-blur-md border ${isActive ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-white/10'} rounded-2xl p-6 transition-all`}>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-medium text-white capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
              <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
            </div>
            <button 
              onClick={() => toggle(key as any)}
              className={`w-full py-3 rounded-lg font-bold tracking-wider uppercase text-sm transition-colors ${isActive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
            >
              {isActive ? 'Revoke Fault' : 'Inject Fault'}
            </button>
          </div>
        ))}

      </div>
    </div>
  );
}
""")

# 9. Health & AI
write("app/health/page.tsx", """
"use client";
import { useTwinStore } from '@/store/digitalTwinStore';

export default function HealthPage() {
  const health = useTwinStore(s => s.health);
  const faults = useTwinStore(s => s.faults);
  const hasFaults = Object.values(faults).some(f => f);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">AI Health Monitor</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl lg:col-span-1 flex flex-col items-center justify-center">
           <div className={`text-6xl font-black ${hasFaults ? 'text-amber-500' : 'text-emerald-400'} drop-shadow-lg mb-4`}>
             {hasFaults ? '42' : health.score}%
           </div>
           <div className="text-blue-300 uppercase tracking-widest text-sm font-bold">Overall RUL Score</div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl lg:col-span-2">
           <h3 className="text-blue-300 uppercase tracking-widest text-sm mb-6">AI Recommendations</h3>
           <div className="space-y-4">
             {health.recommendations.map((rec, i) => (
               <div key={i} className="flex items-center space-x-4 bg-black/20 p-4 rounded-xl border border-white/5">
                 <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                 <p className="text-white font-medium">{rec}</p>
               </div>
             ))}
             {hasFaults && (
               <div className="flex items-center space-x-4 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                 <p className="text-red-400 font-medium">EMERGENCY: Immediate fault detected. Initiate RTB protocol.</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
""")

# 10. Others (Telemetry, Logs)
write("app/telemetry/page.tsx", """
"use client";
import { useTwinStore } from '@/store/digitalTwinStore';

export default function TelemetryPage() {
  const { physics, mission } = useTwinStore();
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">Telemetry Stream</h1>
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl h-[500px] flex flex-col">
         <div className="flex justify-between text-sm text-blue-300 uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
           <span>Live Data Feed</span>
           <span className="flex items-center space-x-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span>Syncing</span></span>
         </div>
         <div className="flex-1 overflow-auto font-mono text-xs text-slate-400 space-y-2">
           <p className="text-white">[{new Date().toISOString()}] TELEMETRY_FRAME_SYNC</p>
           <p>ALT: {mission.altitude.toFixed(1)} | THRUST: {physics.thrust.toFixed(1)} | MASS: {physics.mass.toFixed(1)}</p>
           <p>DRAG: {physics.drag.toFixed(3)} | LIFT: {physics.lift.toFixed(2)}</p>
           <p className="text-white opacity-50 mt-4">Waiting for physics tick...</p>
         </div>
      </div>
    </div>
  );
}
""")

write("app/logs/page.tsx", """
"use client";
export default function LogsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">System Logs</h1>
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl text-slate-400 font-mono text-sm">
        [SYSTEM] Digital Twin OS Initialized.
      </div>
    </div>
  );
}
""")

print("Refactor complete.")
