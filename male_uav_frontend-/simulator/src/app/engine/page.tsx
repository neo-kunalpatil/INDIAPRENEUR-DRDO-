"use client";
import { useEffect } from 'react';
import { simulation } from '@/simulation/SimulationLoop';

import { useTelemetryStore } from '@/stores/telemetryStore';
export const Val = ({ l, v, u, warn=false, crit=false }: any) => (
  <div className="flex justify-between text-sm py-1 border-b border-gray-900/50">
    <span className="text-gray-400">{l}</span>
    <span className={crit ? 'text-red-500 font-bold' : warn ? 'text-amber-500 font-bold' : 'text-green-400 font-bold'}>
      {typeof v === 'number' ? v.toFixed(1) : v} {u && <span className="text-gray-600 font-normal">{u}</span>}
    </span>
  </div>
);

export default function EnginePage() {
  const tel = useTelemetryStore(); const p = tel.packet || {};
  useEffect(() => { simulation.start(); }, []);
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white border-b border-blue-500 pb-2">Primary Engine Telemetry</h1>
      <div className="grid grid-cols-2 gap-8">
        <div><Val l="RPM" v={p.rpm||0} u="RPM" /><Val l="Throttle" v={p.throttle||0} u="%" /><Val l="MAP" v={p.map||0} u="kPa" /><Val l="Fuel Flow" v={p.fuelFlow||0} u="L/hr" /><Val l="Fuel Rem." v={p.fuelRemaining||0} u="L" /></div>
        <div><Val l="EGT" v={p.egt||0} u="°C" /><Val l="CHT" v={p.cht||0} u="°C" /><Val l="Oil Temp" v={p.oilTemp||0} u="°C" /><Val l="Oil Press" v={p.oilPressure||0} u="kPa" /><Val l="Battery" v={p.batteryVoltage||0} u="V" /></div>
      </div>
    </div>
  );
}
