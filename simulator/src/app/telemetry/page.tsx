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

export default function TelemetryPage() {
  const tel = useTelemetryStore();
  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col">
      <h1 className="text-xl font-bold text-white border-b border-blue-500 pb-2 shrink-0">Live FADEC JSON Stream</h1>
      <pre className="flex-1 mt-4 p-4 bg-gray-900 text-green-500 text-xs overflow-auto border border-gray-800">
        {tel.packet ? JSON.stringify(tel.packet, null, 2) : 'AWAITING CONNECTION...'}
      </pre>
    </div>
  );
}
