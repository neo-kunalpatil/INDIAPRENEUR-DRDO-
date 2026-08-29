"use client";

import { useTelemetryStore } from '@/stores/telemetryStore';
export const Val = ({ l, v, u, warn=false, crit=false }: any) => (
  <div className="flex justify-between text-sm py-1 border-b border-gray-900/50">
    <span className="text-gray-400">{l}</span>
    <span className={crit ? 'text-red-500 font-bold' : warn ? 'text-amber-500 font-bold' : 'text-green-400 font-bold'}>
      {typeof v === 'number' ? v.toFixed(1) : v} {u && <span className="text-gray-600 font-normal">{u}</span>}
    </span>
  </div>
);

export default function HealthPage() {
  const tel = useTelemetryStore(); const p = tel.packet || {};
  return (
    <div className="p-6 max-w-4xl mx-auto text-center space-y-6">
      <h1 className="text-xl font-bold text-white border-b border-blue-500 pb-2 text-left">System Health Metrics</h1>
      <div className="text-6xl font-black mt-12 text-blue-500">{p.health||100}%</div>
      <div className="text-xl text-gray-400">OVERALL ENGINE HEALTH</div>
    </div>
  );
}
