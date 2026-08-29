"use client";
import { useMissionStore } from '@/stores/missionStore';

import { useTelemetryStore } from '@/stores/telemetryStore';
export const Val = ({ l, v, u, warn=false, crit=false }: any) => (
  <div className="flex justify-between text-sm py-1 border-b border-gray-900/50">
    <span className="text-gray-400">{l}</span>
    <span className={crit ? 'text-red-500 font-bold' : warn ? 'text-amber-500 font-bold' : 'text-green-400 font-bold'}>
      {typeof v === 'number' ? v.toFixed(1) : v} {u && <span className="text-gray-600 font-normal">{u}</span>}
    </span>
  </div>
);

export default function MissionPage() {
  const tel = useTelemetryStore(); const p = tel.packet || {};
  const mission = useMissionStore();
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white border-b border-blue-500 pb-2">Mission Control</h1>
      <div className="grid grid-cols-2 gap-2 mb-6">
         {['GROUND_IDLE', 'TAKEOFF', 'CLIMB', 'CRUISE', 'LOITER', 'DESCENT', 'LANDING'].map(ph => (
           <button key={ph} onClick={()=>mission.setMission({phase: ph})} className={`p-2 border ${mission.phase === ph ? 'border-green-500 text-green-500 bg-green-900/30' : 'border-gray-800 text-gray-500 hover:text-white'}`}>{ph}</button>
         ))}
      </div>
      <div className="flex space-x-2">
         <button onClick={()=>mission.setMission({isActive:true})} className="flex-1 bg-green-900/50 text-green-400 py-3 font-bold">START MISSION</button>
         <button onClick={()=>mission.setMission({isActive:false})} className="flex-1 bg-amber-900/50 text-amber-400 py-3 font-bold">PAUSE MISSION</button>
      </div>
      <Val l="Live Status" v={p.mission||'STANDBY'} u="" />
    </div>
  );
}
