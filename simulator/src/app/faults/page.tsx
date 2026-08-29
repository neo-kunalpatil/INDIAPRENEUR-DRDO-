"use client";
import { useState } from 'react';
import { useFaultStore } from '@/stores/faultStore';
export default function FaultsPage() {
  const [fType, setFType] = useState('Oil Leak'); const [fSev, setFSev] = useState('MEDIUM');
  const faultStore = useFaultStore();
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white border-b border-blue-500 pb-2">Fault Injection System</h1>
      <div className="flex space-x-2">
        <select value={fType} onChange={e=>setFType(e.target.value)} className="flex-1 bg-black border border-gray-800 p-2"><option>Oil Leak</option><option>Excessive Vibration</option></select>
        <select value={fSev} onChange={e=>setFSev(e.target.value)} className="bg-black border border-gray-800 p-2"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select>
        <button onClick={()=>faultStore.addFault({id: Math.random().toString(), type: fType, severity: fSev, intensity: 0.01, timeAlive: 0})} className="bg-red-900 text-white px-4">INJECT</button>
      </div>
      <div className="mt-8 space-y-2">
        {faultStore.activeFaults.map((f:any) => <div key={f.id} className="p-4 bg-red-900/20 border border-red-900 text-red-500 flex justify-between"><span>{f.type} ({f.severity}) - {(f.intensity*100).toFixed(1)}%</span><button onClick={()=>faultStore.removeFault(f.id)}>REMOVE</button></div>)}
      </div>
    </div>
  );
}
