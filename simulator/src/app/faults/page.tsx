"use client";
import { useState, useEffect } from 'react';
import { useFaultStore } from '@/stores/faultStore';
import { faultRegistry } from '@/stores/faultRegistry';
import { ENDPOINTS } from '@/lib/config';

export default function FaultsPage() {
  const [fType, setFType] = useState(faultRegistry[0].id); 
  const [fSev, setFSev] = useState('MEDIUM');
  const faultStore = useFaultStore();

  useEffect(() => {
    console.log("FAULT REGISTRY SIZE", faultRegistry.length);
    console.log("DROPDOWN SIZE", faultRegistry.length);
    console.log("FAULT NAMES", faultRegistry.map(f => f.name));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white border-b border-blue-500 pb-2">Fault Injection System</h1>
      <div className="flex space-x-2">
        <select value={fType} onChange={e=>setFType(e.target.value)} className="flex-1 bg-black border border-gray-800 p-2">
          {faultRegistry.map(fault => (
            <option key={fault.id} value={fault.id}>
              {fault.name}
            </option>
          ))}
        </select>
        <select value={fSev} onChange={e=>setFSev(e.target.value)} className="bg-black border border-gray-800 p-2"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select>
        <button onClick={async ()=>{
          const newFault = {id: Math.random().toString(), type: fType, severity: fSev, intensity: 0.01, timeAlive: 0};
          faultStore.addFault(newFault);
          try {
            await fetch(ENDPOINTS.faults, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({type: fType, severity: fSev, active: true}) });
          } catch(e) {}
        }} className="bg-red-900 text-white px-4">INJECT</button>
      </div>
      <div className="mt-8 space-y-2">
        {faultStore.activeFaults.map((f:any) => <div key={f.id} className="p-4 bg-red-900/20 border border-red-900 text-red-500 flex justify-between"><span>{f.type} ({f.severity})</span><button onClick={async ()=>{
          faultStore.removeFault(f.id);
          try {
            await fetch(ENDPOINTS.faults, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({type: f.type, active: false}) });
          } catch(e) {}
        }}>REMOVE</button></div>)}
      </div>
    </div>
  );
}
