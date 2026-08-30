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

export default function EnvPage() {
  const tel = useTelemetryStore(); const p = tel.packet || {};
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white border-b border-blue-500 pb-2">Environment & Flight Envelope</h1>
      <div className="grid grid-cols-2 gap-8">
        <div><Val l="Altitude" v={p.altitude||0} u="m" /><Val l="Airspeed" v={p.airspeed||0} u="km/h" /><Val l="OAT" v={p.oat||0} u="°C" /></div>
        <div><Val l="Pressure" v={p.pressure||0} u="kPa" /><Val l="Humidity" v={p.humidity||0} u="%" /><Val l="Density Alt" v={p.densityAltitude||0} u="m" /></div>
      </div>
    </div>
  );
}
