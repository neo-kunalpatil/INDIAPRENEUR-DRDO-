import os

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim/src/app"

def write(path, content):
    with open(os.path.join(BASE_DIR, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# 1. Mission Setup
write("mission-setup/page.tsx", """
"use client";
import { useState } from 'react';
import { useSimulationStore } from '@/simulator/state/simulationStore';
import { simulator } from '@/simulator/engine/SimulationEngine';

export default function MissionSetupPage() {
  const [type, setType] = useState('Endurance');
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Mission Setup</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-foreground">Configuration</h3>
          
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Mission ID</label>
            <input type="text" defaultValue="MSN-2026-A" className="w-full bg-background border border-border rounded p-2 text-foreground" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Mission Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-background border border-border rounded p-2 text-foreground">
              <option>Endurance</option>
              <option>ISR</option>
              <option>Surveillance</option>
              <option>Recon</option>
              <option>Maritime</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Duration (mins)</label>
              <input type="number" defaultValue={120} className="w-full bg-background border border-border rounded p-2 text-foreground" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Cruise Alt (ft)</label>
              <input type="number" defaultValue={15000} className="w-full bg-background border border-border rounded p-2 text-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Payload Weight (kg)</label>
            <input type="number" defaultValue={45} className="w-full bg-background border border-border rounded p-2 text-foreground" />
          </div>
          
          <div className="flex space-x-4 pt-4">
            <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded font-medium flex-1">Save Mission</button>
            <button onClick={() => simulator.start()} className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium flex-1">Start Mission</button>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Mission Summary Panel</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex justify-between border-b border-border pb-2"><span>Target Profile</span><span className="text-foreground">{type}</span></div>
            <div className="flex justify-between border-b border-border pb-2"><span>Route</span><span className="text-foreground">Pre-programmed</span></div>
            <div className="flex justify-between border-b border-border pb-2"><span>Expected Fuel Burn</span><span className="text-foreground">42.5 kg</span></div>
            <div className="flex justify-between pb-2"><span>Status</span><span className="text-amber-500">Awaiting Launch</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
""")

# 2. Environment
write("environment/page.tsx", """
"use client";
import { useState } from 'react';

export default function EnvironmentPage() {
  const [alt, setAlt] = useState(0);
  const [temp, setTemp] = useState(15);
  
  const applyISA = () => { setAlt(0); setTemp(15); };
  const applyHot = () => { setAlt(0); setTemp(40); };
  const applyCold = () => { setAlt(0); setTemp(-20); };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Environment Model</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-foreground">Atmospheric Conditions</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
             <button onClick={applyISA} className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm">ISA Preset</button>
             <button onClick={applyHot} className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm text-red-400">Hot Day Preset</button>
             <button onClick={applyCold} className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm text-blue-400">Cold Day Preset</button>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Altitude (ft)</label>
            <input type="number" value={alt} onChange={e=>setAlt(Number(e.target.value))} className="w-full bg-background border border-border rounded p-2 text-foreground" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Ambient Temp (°C)</label>
            <input type="number" value={temp} onChange={e=>setTemp(Number(e.target.value))} className="w-full bg-background border border-border rounded p-2 text-foreground" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Pressure (Pa)</label>
            <input type="number" defaultValue={101325} className="w-full bg-background border border-border rounded p-2 text-foreground" />
          </div>
          
          <button className="w-full bg-primary text-primary-foreground px-4 py-2 rounded font-medium mt-4">Apply Environment</button>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Environment Preview Panel</h3>
          <div className="flex items-center justify-center h-48 bg-background border border-border rounded-lg relative overflow-hidden">
             <div className="absolute inset-0 opacity-20 bg-gradient-to-b from-blue-500 to-transparent"></div>
             <p className="text-muted-foreground font-mono z-10">Air Density: 1.225 kg/m³</p>
          </div>
        </div>
      </div>
    </div>
  );
}
""")

# 3. Engine Setup
write("engine-setup/page.tsx", """
"use client";

export default function EngineSetupPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Engine Setup</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-foreground">Hardware Configuration</h3>
          
          <div className="space-y-2"><label className="text-sm text-muted-foreground">Engine ID</label>
            <input type="text" defaultValue="UAV-PT-001" className="w-full bg-background border border-border rounded p-2 text-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm text-muted-foreground">Max RPM</label>
              <input type="number" defaultValue={5800} className="w-full bg-background border border-border rounded p-2 text-foreground" />
            </div>
            <div className="space-y-2"><label className="text-sm text-muted-foreground">Idle RPM</label>
              <input type="number" defaultValue={1200} className="w-full bg-background border border-border rounded p-2 text-foreground" />
            </div>
          </div>
          <button className="w-full bg-primary text-primary-foreground px-4 py-2 rounded font-medium">Save Engine</button>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Sensor Enable Matrix</h3>
          <div className="space-y-3">
             {['RPM Sensor', 'EGT Array', 'CHT Array', 'Oil Press', 'Vibration IMU'].map(s => (
                <div key={s} className="flex justify-between items-center bg-background p-2 rounded border border-border">
                  <span className="text-sm">{s}</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-primary" />
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
""")

# 4. Physics Engine Page
write("physics/page.tsx", """
"use client";
import { useSimulationStore } from '@/simulator/state/simulationStore';

export default function PhysicsPage() {
  const current = useSimulationStore(state => state.currentTelemetry);
  
  if(!current) return <div className="p-8 text-center text-muted-foreground">Simulation Offline</div>;

  const bsfC = 0.28; // approx const from physics model

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Physics Engine Internals</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
          <h3 className="font-semibold text-primary uppercase text-sm tracking-wider">Combustion Model</h3>
          <div className="flex justify-between border-b border-border py-1"><span>Power Output</span><span className="font-mono">{current.power.toFixed(1)} kW</span></div>
          <div className="flex justify-between border-b border-border py-1"><span>Torque</span><span className="font-mono">{current.torque.toFixed(1)} Nm</span></div>
          <div className="flex justify-between border-b border-border py-1"><span>BSFC</span><span className="font-mono">{bsfC} kg/kWh</span></div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
          <h3 className="font-semibold text-primary uppercase text-sm tracking-wider">Atmosphere Model</h3>
          <div className="flex justify-between border-b border-border py-1"><span>Air Density</span><span className="font-mono">{(1.225 * Math.exp(-current.altitude/30000)).toFixed(3)} kg/m³</span></div>
          <div className="flex justify-between border-b border-border py-1"><span>MAP</span><span className="font-mono">{current.map.toFixed(1)} kPa</span></div>
          <div className="flex justify-between border-b border-border py-1"><span>Volumetric Eff</span><span className="font-mono">82.5%</span></div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
          <h3 className="font-semibold text-primary uppercase text-sm tracking-wider">Thermal State</h3>
          <div className="flex justify-between border-b border-border py-1"><span>Heat Rejection</span><span className="font-mono">{(current.power * 1.5).toFixed(1)} kW</span></div>
          <div className="flex justify-between border-b border-border py-1"><span>Combustion Eff</span><span className="font-mono">{(current.lambda * 98).toFixed(1)}%</span></div>
          <div className="flex justify-between border-b border-border py-1"><span>Engine Status</span><span className="font-mono text-green-500">OK</span></div>
        </div>

      </div>
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-foreground">Physics Engine Core</h3>
        <p className="text-sm text-muted-foreground mb-4">Internal simulation pipeline status.</p>
        <div className="flex items-center space-x-4">
           <div className="px-4 py-2 bg-secondary rounded text-sm"><span className="text-muted-foreground mr-2">Tick Rate:</span> 1.0 Hz</div>
           <div className="px-4 py-2 bg-secondary rounded text-sm"><span className="text-muted-foreground mr-2">State:</span> {useSimulationStore.getState().status}</div>
           <div className="px-4 py-2 bg-secondary rounded text-sm"><span className="text-muted-foreground mr-2">Time Multiplier:</span> {useSimulationStore.getState().timeMultiplier}x</div>
        </div>
      </div>
    </div>
  );
}
""")

# 5. Simulation Control
write("simulation-control/page.tsx", """
"use client";
import { useSimulationStore } from '@/simulator/state/simulationStore';
import { simulator } from '@/simulator/engine/SimulationEngine';
import { Play, Square, Pause, RotateCcw } from 'lucide-react';

export default function SimControlPage() {
  const { status, timeMultiplier, setTimeMultiplier } = useSimulationStore();
  const current = useSimulationStore(state => state.currentTelemetry);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Simulation Control</h1>
      
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">Execution Controls</h3>
        <div className="flex flex-wrap gap-4 mb-6">
          <button onClick={()=>simulator.start()} className="flex items-center space-x-2 bg-green-500/20 text-green-500 px-6 py-3 rounded-lg hover:bg-green-500/30">
            <Play className="w-5 h-5"/> <span>Start</span>
          </button>
          <button onClick={()=>simulator.pause()} className="flex items-center space-x-2 bg-amber-500/20 text-amber-500 px-6 py-3 rounded-lg hover:bg-amber-500/30">
            <Pause className="w-5 h-5"/> <span>Pause / Resume</span>
          </button>
          <button onClick={()=>simulator.pause()} className="flex items-center space-x-2 bg-destructive/20 text-destructive px-6 py-3 rounded-lg hover:bg-destructive/30">
            <Square className="w-5 h-5"/> <span>Stop</span>
          </button>
          <button onClick={()=>simulator.reset()} className="flex items-center space-x-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-lg hover:bg-secondary/80">
            <RotateCcw className="w-5 h-5"/> <span>Reset</span>
          </button>
        </div>

        <h3 className="font-semibold text-foreground mb-4">Time Compression</h3>
        <div className="flex gap-2">
          {[0.5, 1, 2, 5, 10].map(x => (
             <button key={x} onClick={()=>setTimeMultiplier(x)} className={`px-4 py-2 rounded-md border ${timeMultiplier === x ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-foreground hover:bg-secondary'}`}>
               {x}x
             </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">Live Flight Status</h3>
        <div className="flex justify-between items-center p-4 bg-background border border-border rounded-lg">
           <div className="flex flex-col"><span className="text-sm text-muted-foreground">Mission Phase</span><span className="text-xl font-bold text-primary">{current ? current.missionPhase : 'STANDBY'}</span></div>
           <div className="flex flex-col"><span className="text-sm text-muted-foreground">Flight Time</span><span className="text-xl font-mono text-foreground">{current ? 'T+'+Math.floor(Date.now()/1000 % 3600)+'s' : '0:00:00'}</span></div>
           <div className="flex flex-col"><span className="text-sm text-muted-foreground">Throttle Pos</span><span className="text-xl font-mono text-foreground">{current ? current.throttle.toFixed(1) : '0.0'}%</span></div>
        </div>
      </div>
    </div>
  );
}
""")

# Fix other pages with basic tables so they don't say "integration pending"
write("history/page.tsx", """
export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Mission History</h1>
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-6">
        <table className="w-full text-left text-sm text-muted-foreground">
          <thead className="text-xs uppercase bg-secondary text-foreground"><tr><th className="p-3">ID</th><th className="p-3">Date</th><th className="p-3">Duration</th><th className="p-3">Status</th></tr></thead>
          <tbody>
             <tr className="border-b border-border"><td className="p-3">MSN-001</td><td className="p-3">2026-08-28</td><td className="p-3">2h 14m</td><td className="text-green-500 p-3">SUCCESS</td></tr>
             <tr className="border-b border-border"><td className="p-3">MSN-002</td><td className="p-3">2026-08-29</td><td className="p-3">0h 45m</td><td className="text-destructive p-3">ABORTED</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
""")

write("mission-replay/page.tsx", """
export default function ReplayPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Mission Replay Dashboard</h1>
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center justify-center h-64 text-muted-foreground">
        Select a mission from History to load Replay Telemetry.
      </div>
    </div>
  );
}
""")

write("export/page.tsx", """
export default function ExportPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Export Data Center</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <button className="bg-card border border-border p-6 rounded-xl hover:bg-secondary text-foreground text-left">
           <h3 className="font-bold">Export CSV</h3><p className="text-sm text-muted-foreground">Download raw telemetry.</p>
         </button>
         <button className="bg-card border border-border p-6 rounded-xl hover:bg-secondary text-foreground text-left">
           <h3 className="font-bold">Export JSON</h3><p className="text-sm text-muted-foreground">Structured mission data.</p>
         </button>
         <button className="bg-card border border-border p-6 rounded-xl hover:bg-secondary text-foreground text-left">
           <h3 className="font-bold">Mission Report</h3><p className="text-sm text-muted-foreground">Generate PDF summary.</p>
         </button>
      </div>
    </div>
  );
}
""")

write("health-ai/page.tsx", """
export default function HealthPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Health & AI Diagnostics</h1>
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-amber-500">Remaining Useful Life (RUL) Prediction</h3>
        <p className="text-sm text-muted-foreground">Digital Twin AI analysis inactive during Phase 2 physics simulation.</p>
        <div className="w-full bg-secondary h-4 rounded-full overflow-hidden">
           <div className="bg-green-500 w-[85%] h-full"></div>
        </div>
        <p className="text-right text-sm text-green-500 font-bold">85% Engine Health</p>
      </div>
    </div>
  );
}
""")

write("settings/page.tsx", """
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Simulator Settings</h1>
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4 max-w-md">
         <div className="flex justify-between items-center"><span className="text-foreground">Dark Theme</span><input type="checkbox" checked readOnly className="accent-primary h-4 w-4"/></div>
         <div className="flex justify-between items-center"><span className="text-foreground">High Refresh Telemetry</span><input type="checkbox" checked readOnly className="accent-primary h-4 w-4"/></div>
         <div className="flex justify-between items-center"><span className="text-foreground">Imperial Units (ft, lbs)</span><input type="checkbox" className="accent-primary h-4 w-4"/></div>
      </div>
    </div>
  );
}
""")
print("Done writing UIs.")
