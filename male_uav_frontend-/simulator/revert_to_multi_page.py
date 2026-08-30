import os

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim"

folders = [
    "src/app/engine",
    "src/app/environment",
    "src/app/mission",
    "src/app/telemetry"
]
for f in folders:
    os.makedirs(os.path.join(BASE_DIR, f), exist_ok=True)

def write(path, content):
    with open(os.path.join(BASE_DIR, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# --- CUSTOM 404 ---
write("src/app/not-found.tsx", """
import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
      <h2 className="text-4xl font-bold text-red-500 tracking-widest">404 - SYSTEM NOT FOUND</h2>
      <p className="text-gray-400">The requested telemetry interface does not exist.</p>
      <Link href="/engine" className="text-blue-500 hover:text-blue-400 border border-blue-900 px-4 py-2 bg-gray-900">RETURN TO ENGINE CORE</Link>
    </div>
  )
}
""")

# --- ROOT REDIRECT ---
write("src/app/page.tsx", """
import { redirect } from 'next/navigation';
export default function Home() {
  redirect('/engine');
}
""")

# --- LAYOUT (WITH NAVBAR) ---
write("src/app/layout.tsx", """
import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen w-screen bg-black text-green-500 font-mono overflow-hidden flex flex-col">
        <nav className="p-3 border-b border-blue-900 flex space-x-6 bg-gray-950 text-sm">
          <div className="font-bold text-blue-500 mr-8 tracking-widest">MALE UAV GCS</div>
          <Link href="/engine" className="hover:text-white text-gray-400">Engine</Link>
          <Link href="/environment" className="hover:text-white text-gray-400">Environment</Link>
          <Link href="/mission" className="hover:text-white text-gray-400">Mission</Link>
          <Link href="/telemetry" className="hover:text-white text-gray-400">Telemetry Stream</Link>
        </nav>
        <main className="flex-1 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
""")

# --- SHARED UI COMPS ---
SHARED_COMPONENTS = """
import { useEffect, useState } from 'react';
import { useEngineStore } from '@/stores/engineStore';
import { useFuelStore } from '@/stores/fuelStore';
import { useThermalStore } from '@/stores/thermalStore';
import { useElectricalStore } from '@/stores/electricalStore';
import { useEnvStore } from '@/stores/environmentStore';
import { useFlightStore } from '@/stores/flightStore';
import { useMissionStore } from '@/stores/missionStore';
import { useTelemetryStore } from '@/stores/telemetryStore';
import { useFaultStore } from '@/stores/faultStore';
import { useHealthStore } from '@/stores/healthStore';
import { simulation } from '@/simulation/SimulationLoop';

export const Panel = ({ title, children, cClass = '' }: any) => (
  <div className={`border border-blue-900 bg-gray-950 p-4 flex flex-col ${cClass}`}>
    <div className="text-blue-500 font-bold border-b border-blue-900 mb-3 pb-1 uppercase text-sm">{title}</div>
    <div className="flex-1 overflow-y-auto">{children}</div>
  </div>
);

export const Val = ({ l, v, u, warn=false, crit=false }: any) => (
  <div className="flex justify-between text-sm py-1 border-b border-gray-900/50">
    <span className="text-gray-400">{l}</span>
    <span className={crit ? 'text-red-500 font-bold' : warn ? 'text-amber-500 font-bold' : 'text-green-400 font-bold'}>
      {typeof v === 'number' ? v.toFixed(1) : v} {u && <span className="text-gray-600 font-normal">{u}</span>}
    </span>
  </div>
);
"""

# --- PAGE 1: ENGINE ---
write("src/app/engine/page.tsx", """
"use client";
""" + SHARED_COMPONENTS + """
export default function EnginePage() {
  const engine = useEngineStore(); const fuel = useFuelStore(); const therm = useThermalStore(); 
  const elec = useElectricalStore(); const health = useHealthStore();
  
  useEffect(() => { simulation.start(); }, []);

  return (
    <div className="p-4 grid grid-cols-2 gap-4 h-full">
      <Panel title="Primary Engine Telemetry" cClass="h-full">
        <div className="grid grid-cols-2 gap-x-12 gap-y-2">
          <Val l="Engine State" v={engine.state} u="" />
          <Val l="RPM" v={engine.rpm} u="RPM" />
          <Val l="EGT" v={therm.egt} u="°C" warn={therm.egt>800} crit={therm.egt>850}/>
          <Val l="CHT" v={therm.cht} u="°C" warn={therm.cht>180} crit={therm.cht>220}/>
          <Val l="Oil Temp" v={therm.oilTemp} u="°C" warn={therm.oilTemp>110} crit={therm.oilTemp>130}/>
          <Val l="Oil Pressure" v={therm.oilPressure} u="kPa" warn={therm.oilPressure<250} crit={therm.oilPressure<150}/>
          <Val l="Fuel Flow" v={fuel.fuelFlow} u="L/hr" />
          <Val l="MAP" v={engine.map} u="inHg" />
          <Val l="Battery" v={elec.batteryVoltage} u="V" warn={elec.batteryVoltage<25} crit={elec.batteryVoltage<23}/>
          <Val l="Alternator" v={elec.alternatorVoltage} u="V" />
          <Val l="Fuel Remaining" v={fuel.fuelRemaining} u="L" warn={fuel.fuelRemaining<40} crit={fuel.fuelRemaining<20}/>
        </div>
      </Panel>
      <Panel title="Engine Health Prognostics">
        <div className="text-center my-6">
          <div className={`text-5xl font-black ${health.score < 50 ? 'text-red-500' : health.score < 70 ? 'text-amber-500' : 'text-green-500'}`}>{health.score}%</div>
          <div className={`text-lg mt-2 ${health.score < 50 ? 'text-red-500' : health.score < 70 ? 'text-amber-500' : 'text-green-500'}`}>{health.category}</div>
        </div>
        {health.alerts.length > 0 && (
          <div className="mt-8 space-y-2">
            {health.alerts.map((a: string)=><div key={a} className="bg-red-900/30 border border-red-900 text-red-500 text-sm p-2 animate-pulse">{a}</div>)}
          </div>
        )}
      </Panel>
    </div>
  );
}
""")

# --- PAGE 2: ENVIRONMENT ---
write("src/app/environment/page.tsx", """
"use client";
""" + SHARED_COMPONENTS + """
export default function EnvPage() {
  const env = useEnvStore(); const flight = useFlightStore(); const mission = useMissionStore();
  
  return (
    <div className="p-4 grid grid-cols-2 gap-4 h-full">
      <Panel title="Environment Overrides">
         <div className="space-y-6 mt-4">
           <div><label className="text-gray-500 flex justify-between mb-2">Altitude (m) <span className="text-white">{env.altitude.toFixed(0)}</span></label>
           <input type="range" min="0" max="10000" value={env.altitude} onChange={e=>env.setEnv({altitude: +e.target.value})} className="w-full" disabled={mission.isActive}/></div>
           <div><label className="text-gray-500 flex justify-between mb-2">OAT (°C) <span className="text-white">{env.oat.toFixed(1)}</span></label>
           <input type="range" min="-30" max="55" value={env.oat} onChange={e=>env.setEnv({oat: +e.target.value})} className="w-full" disabled={mission.isActive}/></div>
           <div><label className="text-gray-500 flex justify-between mb-2">Humidity (%) <span className="text-white">{env.humidity.toFixed(0)}</span></label>
           <input type="range" min="0" max="100" value={env.humidity} onChange={e=>env.setEnv({humidity: +e.target.value})} className="w-full"/></div>
           <div><label className="text-gray-500 flex justify-between mb-2">Wind (km/h) <span className="text-white">{env.windSpeed.toFixed(0)}</span></label>
           <input type="range" min="0" max="80" value={env.windSpeed} onChange={e=>env.setEnv({windSpeed: +e.target.value})} className="w-full"/></div>
         </div>
      </Panel>
      
      <Panel title="Flight Data">
         <div className="grid grid-cols-1 gap-y-2 mt-4">
           <Val l="Altitude" v={env.altitude} u="m" />
           <Val l="Density Altitude" v={env.densityAltitude} u="m" />
           <Val l="Airspeed" v={flight.airspeed} u="km/h" />
           <Val l="Ground Speed" v={flight.airspeed - env.windSpeed} u="km/h" />
           <Val l="Vertical Speed" v={flight.verticalSpeed} u="m/s" />
           <Val l="Heading" v={flight.heading} u="°" />
           <Val l="OAT" v={env.oat} u="°C" />
           <Val l="Pressure" v={env.pressure} u="kPa" />
         </div>
      </Panel>
    </div>
  );
}
""")

# --- PAGE 3: MISSION ---
write("src/app/mission/page.tsx", """
"use client";
""" + SHARED_COMPONENTS + """
export default function MissionPage() {
  const mission = useMissionStore(); const engine = useEngineStore();
  
  return (
    <div className="p-4 grid grid-cols-2 gap-4 h-full">
      <Panel title="Mission Control & Automation">
         <div className="grid grid-cols-2 gap-2 mb-6 mt-4">
           {['GROUND_IDLE', 'TAKEOFF', 'CLIMB', 'CRUISE', 'LOITER', 'DESCENT', 'LANDING'].map(p => (
             <button key={p} onClick={()=>mission.setMission({phase: p})} className={`text-xs p-3 border ${mission.phase === p ? 'border-green-500 text-green-500 bg-green-900/30' : 'border-gray-800 text-gray-500 hover:text-white'}`}>{p}</button>
           ))}
         </div>
         <div className="flex space-x-2 mt-auto">
           <button onClick={()=>mission.setMission({isActive:true})} className="flex-1 bg-green-900/50 border border-green-800 text-green-400 text-sm py-3 font-bold tracking-widest">START</button>
           <button onClick={()=>mission.setMission({isActive:false})} className="flex-1 bg-amber-900/50 border border-amber-800 text-amber-400 text-sm py-3 font-bold tracking-widest">PAUSE</button>
           <button onClick={()=>mission.setMission({isActive:false, timer:0, phase:'GROUND_IDLE'})} className="flex-1 bg-red-900/50 border border-red-800 text-red-400 text-sm py-3 font-bold tracking-widest">STOP</button>
         </div>
      </Panel>

      <Panel title="Mission Status">
        <div className="space-y-4 mt-4">
          <Val l="Current Mission" v={mission.phase} u="" />
          <Val l="Mission Time" v={mission.timer/60} u="min" />
          <Val l="Engine State" v={engine.state} u="" />
        </div>
      </Panel>
    </div>
  );
}
""")

# --- PAGE 4: TELEMETRY (Merged with Fault Injection) ---
write("src/app/telemetry/page.tsx", """
"use client";
""" + SHARED_COMPONENTS + """
export default function TelemetryPage() {
  const tel = useTelemetryStore(); const faultStore = useFaultStore();
  const [fType, setFType] = useState('Oil Leak'); const [fSev, setFSev] = useState('MEDIUM');
  
  return (
    <div className="p-4 flex flex-col gap-4 h-full">
      <div className="grid grid-cols-2 gap-4 shrink-0">
        <Panel title="Fault Injection Console">
           <div className="flex space-x-2 mb-4">
             <select value={fType} onChange={e=>setFType(e.target.value)} className="flex-1 bg-black border border-gray-800 text-sm text-white p-2">
               {['Oil Leak', 'Fuel Leak', 'Turbo Failure', 'Spark Plug Failure', 'Injector Failure', 'Battery Failure', 'Alternator Failure', 'RPM Sensor Failure', 'CHT Sensor Failure', 'EGT Sensor Failure', 'Throttle Failure', 'Excessive Vibration', 'Overheating'].map(f=><option key={f}>{f}</option>)}
             </select>
             <select value={fSev} onChange={e=>setFSev(e.target.value)} className="w-32 bg-black border border-gray-800 text-sm text-white p-2">
               <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
             </select>
           </div>
           <div className="flex space-x-2">
             <button onClick={()=>faultStore.addFault({id: Math.random().toString(), type: fType, severity: fSev, intensity: 0.01, timeAlive: 0})} className="flex-1 bg-red-900/50 text-red-500 border border-red-900 text-sm py-2">INJECT FAULT</button>
             <button onClick={faultStore.clearFaults} className="flex-1 bg-gray-900 text-gray-400 border border-gray-800 text-sm py-2">CLEAR ALL</button>
           </div>
        </Panel>

        <Panel title="Active System Faults">
           {faultStore.activeFaults.map((f: any) => (
             <div key={f.id} className="border border-red-900 bg-red-950/20 p-2 mb-2 text-sm">
               <div className="flex justify-between text-red-500 font-bold mb-1"><span>{f.type}</span><button onClick={()=>faultStore.removeFault(f.id)} className="text-gray-500 hover:text-white px-2">X</button></div>
               <div className="flex justify-between text-gray-400 text-xs"><span>Sev: {f.severity}</span><span>Progression: {(f.intensity*100).toFixed(1)}% | Uptime: {f.timeAlive.toFixed(1)}s</span></div>
             </div>
           ))}
           {faultStore.activeFaults.length === 0 && <div className="text-gray-600 text-sm mt-4 text-center">System Nominal. No active faults.</div>}
        </Panel>
      </div>

      <Panel title={`FADEC TELEMETRY STREAM // 10 HZ // PACKETS TX: ${tel.packetCount}`} cClass="flex-1">
        <pre className="text-xs text-green-500 leading-relaxed">
          {tel.packet ? JSON.stringify(tel.packet, null, 2) : 'AWAITING LINK...'}
        </pre>
      </Panel>
    </div>
  );
}
""")
print("Reverted to requested multi-page architecture with correct routing.")
