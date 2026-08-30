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

export default function AnalyticsPage() {
  const tel = useTelemetryStore(); const p = tel.packet || {};
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white border-b border-blue-500 pb-2">AI Diagnostics Engine</h1>
      <div className="bg-gray-900 p-6 border border-gray-800">
        <Val l="AI Model Status" v={p.aiStatus || 'NORMAL'} u="" crit={p.aiStatus === 'ANOMALY DETECTED'} />
        <Val l="Prediction Confidence" v={(p.aiConfidence||1)*100} u="%" />
        <div className="mt-6 text-sm text-gray-400">RECOMMENDATION: <span className="text-white">{p.aiRec||'Standby'}</span></div>
      </div>
    </div>
  );
}
