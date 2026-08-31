import React from 'react';
import { 
  Radio, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Plane, 
  TrendingUp, 
  Layers, 
  CheckCircle2,
  Clock,
  Compass
} from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { MetricCard } from '../components/common/MetricCard';

export const FleetMonitoringPage: React.FC = () => {
  const { uavFleet, selectedUav, setSelectedUavId, setActiveTab } = useGcs();

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              Multi-UAV Squadron Health & Fingerprint Matrix (Innovation #10 & #13)
            </h1>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono-code font-bold">
              {uavFleet.length} PLATFORMS TRACKED
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            Fleet-wide comparative engine behavior fingerprinting and simultaneous squadron telemetry surveillance
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs font-mono-code">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>SQUADRON LINK: <strong className="text-emerald-300">100% OPERATIONAL</strong></span>
        </div>
      </div>

      {/* Fleet Overview KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Active Airborne Fleet"
          value="3 / 5"
          status="NORMAL"
          change="2 on ground standby"
          changeType="neutral"
          icon={Plane}
          subtext="Northern & Western Borders"
        />
        <MetricCard
          title="Squadron Avg Health"
          value="89.6%"
          status="NORMAL"
          change="Nominal fleet envelope"
          changeType="positive"
          icon={Activity}
          subtext="Lowest: 74.2% (TAPAS-03)"
        />
        <MetricCard
          title="Fleet Mean RUL"
          value="158.4h"
          status="HIGHLIGHT"
          change="Aggregated across 5 airframes"
          changeType="positive"
          icon={Clock}
          subtext="Next depot slot in 18.5h"
        />
        <MetricCard
          title="Behavior Anomaly Disparity"
          value="0.04 σ"
          status="NORMAL"
          change="Cohort baseline aligned"
          changeType="positive"
          icon={Layers}
          subtext="Innovation #13 Engine Fingerprint"
        />
      </div>

      {/* UAV Fleet Squadron Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {uavFleet.map((uav) => {
          const isSelected = uav.id === selectedUav.id;

          return (
            <div
              key={uav.id}
              onClick={() => setSelectedUavId(uav.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-cyan-950/30 border-cyan-500/80 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-base text-slate-100">{uav.callsign}</span>
                    {isSelected && (
                      <span className="px-1.5 py-0.2 rounded bg-cyan-900 text-cyan-300 text-[9px] font-mono-code font-bold">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono-code text-slate-400">{uav.model} • S/N {uav.serialNumber}</span>
                </div>

                <StatusBadge status={uav.status} size="sm" />
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono-code mb-3">
                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">ENGINE HEALTH</span>
                  <span className={`font-telemetry font-bold text-lg ${
                    uav.engineHealthIndex > 80 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {(Number(uav.engineHealthIndex) || 0).toFixed(1)}%
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">PREDICTED RUL</span>
                  <span className="font-telemetry font-bold text-lg text-cyan-300">
                    {uav.predictedRulHours}h
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">ALTITUDE / SPEED</span>
                  <span className="font-bold text-slate-200 text-[11px] block">
                    {uav.altitudeFt.toLocaleString()} FT • {uav.airspeedKts} KTS
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">REMAINING FUEL</span>
                  <span className="font-bold text-slate-200 text-[11px] block">
                    {uav.fuelRemainingKg} kg ({Number((uav.fuelRemainingKg / 14.5) || 0).toFixed(1)}h)
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono-code text-slate-400">
                <span>Sector: <strong>{uav.location.region}</strong></span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedUavId(uav.id);
                    setActiveTab('dashboard');
                  }}
                  className="text-cyan-400 hover:underline font-bold"
                >
                  Inspect GCS →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
