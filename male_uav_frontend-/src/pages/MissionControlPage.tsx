import React from 'react';
import { 
  Compass, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Navigation, 
  TrendingUp, 
  Clock, 
  Fuel,
  Sliders,
  Wind
} from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';
import { MetricCard } from '../components/common/MetricCard';

export const MissionControlPage: React.FC = () => {
  const { selectedUav, mission, telemetry } = useGcs();

  const isGo = selectedUav.missionRiskScore < 30;

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              Mission Control & Go/No-Go Reliability Center (Innovation #11 & #23)
            </h1>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono-code font-bold">
              PATROL PHASE: {mission.phase}
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            Mission: {mission.codeName} • Altitude: FL{Math.round(mission.altitudeFlightLevelFt / 100)} • Sector: {mission.terrainType}
          </p>
        </div>

        {/* Big Go / No-Go Decision Badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono-code font-bold text-sm ${
          isGo 
            ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 shadow-lg shadow-emerald-950/50' 
            : 'bg-red-950/80 border-red-600 text-red-300 shadow-lg shadow-red-950/50 animate-pulse'
        }`}>
          {isGo ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>DECISION: {isGo ? 'MISSION GO (94.2% RELIABILITY)' : 'ABORT / EXECUTE RTB'}</span>
        </div>
      </div>

      {/* Top 4 Mission Reliability Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Mission Risk Index"
          value={`${selectedUav.missionRiskScore.toFixed(1)}%`}
          status={isGo ? 'NORMAL' : 'CRITICAL'}
          change={isGo ? 'Within 30% Safety Ceiling' : 'Risk Exceeds Safety Margin'}
          changeType={isGo ? 'positive' : 'negative'}
          icon={ShieldCheck}
          subtext="Terrain + Met + Powerplant"
        />
        <MetricCard
          title="Remaining Fuel Endurance"
          value={`${(selectedUav.fuelRemainingKg / 14.5).toFixed(1)}h`}
          status="HIGHLIGHT"
          change={`${selectedUav.fuelRemainingKg} kg onboard`}
          changeType="positive"
          icon={Fuel}
          subtext="Specific fuel consumption nominal"
        />
        <MetricCard
          title="Loiter Time on Station"
          value={`${mission.elapsedTimeHours}h`}
          status="NORMAL"
          change="3.5h planned remaining"
          changeType="neutral"
          icon={Clock}
          subtext="Altitude: FL220 (22,000 FT)"
        />
        <MetricCard
          title="Telemetry Link Margin"
          value="48.2 dB"
          status="NORMAL"
          change="Ku-band SATCOM + C-Band LOS"
          changeType="positive"
          icon={Navigation}
          subtext="Encryption: DRDO Type-1"
        />
      </div>

      {/* Waypoint Trajectory & Tactical Map Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 8 Cols: Waypoint Flight Path Visualizer */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <h3 className="font-heading font-bold text-sm text-slate-100">
                Tactical Waypoint Trajectory & Terrain Profile
              </h3>
            </div>
            <span className="text-[10px] font-mono-code text-slate-400">COORDINATES: WGS-84</span>
          </div>

          {/* SVG Tactical Navigation Map Schematic */}
          <div className="relative flex-1 bg-slate-950/90 rounded-xl p-4 border border-slate-800/80 min-h-[320px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 tactical-grid opacity-30 pointer-events-none" />
            
            {/* SVG Flight Path */}
            <svg viewBox="0 0 700 300" className="w-full h-full">
              {/* Waypoint Line */}
              <polyline
                points="80,240 220,180 380,120 540,150 640,110"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />
              
              {/* Completed segment */}
              <polyline
                points="80,240 220,180 380,120"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
              />

              {/* Waypoints */}
              {mission.waypoints.map((wp, i) => {
                const positions = [
                  { x: 80, y: 240 },
                  { x: 220, y: 180 },
                  { x: 380, y: 120 },
                  { x: 540, y: 150 },
                  { x: 640, y: 110 },
                ];
                const pos = positions[i] || { x: 100, y: 100 };
                const isCurrent = wp.status === 'CURRENT';
                const isPassed = wp.status === 'PASSED';

                return (
                  <g key={wp.name} className="cursor-pointer">
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isCurrent ? 12 : 7}
                      fill={isPassed ? '#10b981' : isCurrent ? '#06b6d4' : '#334155'}
                      stroke="#fff"
                      strokeWidth="1.5"
                    />
                    {isCurrent && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="20"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="1"
                        className="animate-ping"
                      />
                    )}
                    <text
                      x={pos.x}
                      y={pos.y - 14}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {wp.name} ({wp.altFt} FT)
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono-code text-slate-400">
            <span>CURRENT POSITION: <strong>26°55&apos;N, 70°54&apos;E (WP-04 LOITER)</strong></span>
            <span>AIRSPEED: <strong className="text-slate-200">{selectedUav.airspeedKts} KTS</strong></span>
          </div>
        </div>

        {/* Right 4 Cols: Mission Optimization Advisor (Innovation #23) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <h3 className="font-heading font-bold text-sm text-slate-100">
                  Mission Optimization Advisor
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono-code font-bold">
                INNOVATION #23
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Real-time Pareto trade-off optimization between UAV loiter duration, fuel consumption, and aero engine thermal stress:
            </p>

            <div className="space-y-2.5 text-xs font-mono-code">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between font-bold text-emerald-400 mb-1">
                  <span>RECOMMENDATION #1</span>
                  <span>+45 MIN EXTENSION</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Descend from FL240 to FL200: Reduces turbocharger compression ratio by 0.12 bar and lowers CHT by 7.4°C.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between font-bold text-cyan-300 mb-1">
                  <span>RECOMMENDATION #2</span>
                  <span>-3.2 L/H FUEL SAVING</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Trim engine speed from 5,200 RPM to 4,850 RPM during orbital loiter without compromising ground-mapping radar swath.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs">
            <span className="font-bold text-indigo-300 block mb-1">AUTOMATED FLIGHT ENVELOPE PROTECTION:</span>
            <p className="text-slate-300 text-[11px]">
              GCS autopilot automatically inhibits full throttle climbs if Cylinder #3 CHT reaches 130°C.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
