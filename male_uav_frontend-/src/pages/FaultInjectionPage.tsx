import React, { useState } from 'react';
import { 
  ZapOff, 
  Play, 
  RotateCcw, 
  AlertTriangle, 
  Activity, 
  ShieldAlert, 
  Flame, 
  Droplets, 
  Sliders,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';
import { InjectedFault } from '../types';

export const FaultInjectionPage: React.FC = () => {
  const { activeFaults, injectFault, clearFault, clearAllFaults, telemetry, selectedUav } = useGcs();
  const [selectedSeverity, setSelectedSeverity] = useState<number>(75);

  const activeCount = activeFaults.filter(f => f.active).length;

  return (
    <div id="fault-controls" className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              Interactive Aero Engine Fault Injection Testbed (Innovation #8)
            </h1>
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono-code font-bold">
              REAL-TIME SIMULATION
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            Inject realistic thermodynamic and mechanical aero piston engine failures to observe Digital Twin and AI diagnostics response
          </p>
        </div>

        {/* Global Reset Button */}
        <button
          onClick={clearAllFaults}
          disabled={activeCount === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 text-xs font-heading font-semibold transition-all"
        >
          <RotateCcw className="w-4 h-4 text-cyan-400" />
          <span>Clear All Injected Faults ({activeCount})</span>
        </button>
      </div>

      {/* Severity Control Global Slider */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono-code">
        <div className="flex items-center gap-3">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="font-bold text-slate-200 block">SIMULATION SEVERITY LEVEL:</span>
            <span className="text-slate-400 text-[11px]">Controls degradation intensity when clicking &quot;Inject Fault&quot;</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-80">
          <input
            type="range"
            min="25"
            max="100"
            step="5"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <span className="font-telemetry font-bold text-base text-cyan-300 w-12 text-right">
            {selectedSeverity}%
          </span>
        </div>
      </div>

      {/* Grid of Preset Injectable Fault Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeFaults.map((fault) => {
          const isActive = fault.active;

          return (
            <div
              key={fault.id}
              className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                isActive
                  ? 'bg-red-950/30 border-red-500/80 shadow-lg shadow-red-950/40'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-red-900/60 text-red-300' : 'bg-slate-800 text-slate-400'}`}>
                    <ZapOff className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono-code uppercase font-bold text-slate-400">
                      SUBSYSTEM: {fault.component}
                    </span>
                    <h3 className="font-heading font-bold text-base text-slate-100">
                      {fault.name}
                    </h3>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                  isActive ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse' : 'bg-slate-950 text-slate-500 border border-slate-800'
                }`}>
                  {isActive ? 'ACTIVE INJECTED' : 'INACTIVE'}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {fault.description}
              </p>

              {/* Affected Parameters Badges */}
              <div className="mb-4">
                <span className="text-[10px] font-mono-code text-slate-500 block mb-1">
                  IMPACTED TELEMETRY CHANNELS:
                </span>
                <div className="flex flex-wrap gap-1">
                  {fault.affectedParameters.map((param, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono-code text-cyan-300">
                      {param}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                {isActive ? (
                  <div className="text-[11px] font-mono-code text-red-400">
                    Active at {fault.severityPercent}% severity (T: {fault.timestampInjected})
                  </div>
                ) : (
                  <div className="text-[11px] font-mono-code text-slate-500">
                    Ready for test insertion
                  </div>
                )}

                {isActive ? (
                  <button
                    onClick={() => clearFault(fault.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-heading font-semibold border border-slate-700 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Anomaly</span>
                  </button>
                ) : (
                  <button
                    onClick={() => injectFault(fault.id, selectedSeverity)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-heading font-bold shadow-md shadow-red-950/60 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Inject Fault</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
