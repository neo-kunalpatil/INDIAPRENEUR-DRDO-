import React from 'react';
import { WaypointElevation } from '../../services/elevationService';

interface Props {
  elevations: WaypointElevation[];
  uavAltitudeFt: number;
}

export const TerrainProfileChart: React.FC<Props> = ({ elevations, uavAltitudeFt }) => {
  if (elevations.length === 0) {
    return (
      <div className="w-full h-24 flex items-center justify-center text-xs font-mono-code text-slate-500">
        FETCHING TERRAIN ELEVATION DATA...
      </div>
    );
  }

  const maxAlt = Math.max(uavAltitudeFt, ...elevations.map(e => e.waypointAltFt)) * 1.15;
  const W = 700;
  const H = 100;
  const pad = { l: 10, r: 10, t: 8, b: 8 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const toY = (alt: number) => pad.t + innerH - (alt / maxAlt) * innerH;
  const toX = (i: number, total: number) => pad.l + (i / Math.max(total - 1, 1)) * innerW;

  const terrainPoints = elevations
    .map((e, i) => `${toX(i, elevations.length)},${toY(e.elevationFt)}`)
    .join(' ');

  const routePoints = elevations
    .map((e, i) => `${toX(i, elevations.length)},${toY(e.waypointAltFt)}`)
    .join(' ');

  // UAV altitude horizontal line
  const uavY = toY(uavAltitudeFt);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[9px] font-mono-code text-slate-500 mb-1 px-1">
        <span>TERRAIN CLEARANCE PROFILE</span>
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1"><span className="w-3 h-px bg-amber-400 inline-block" /> UAV ALT</span>
          <span className="flex items-center gap-1"><span className="w-3 h-px bg-emerald-500 inline-block" /> ROUTE</span>
          <span className="flex items-center gap-1"><span className="w-3 h-px bg-slate-500 inline-block" /> TERRAIN</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
        {/* Terrain fill */}
        <polygon
          points={`${pad.l},${H - pad.b} ${terrainPoints} ${pad.l + innerW},${H - pad.b}`}
          fill="rgba(100,116,139,0.25)"
          stroke="#64748b"
          strokeWidth="1.5"
        />

        {/* Threat zones — red fill where clearance < 500ft */}
        {elevations.map((e, i) => {
          if (!e.isThreat) return null;
          const x = toX(i, elevations.length);
          const x1 = toX(Math.max(0, i - 0.5), elevations.length);
          const x2 = toX(Math.min(elevations.length - 1, i + 0.5), elevations.length);
          return (
            <rect
              key={i}
              x={x1}
              y={toY(e.waypointAltFt)}
              width={x2 - x1}
              height={H - pad.b - toY(e.waypointAltFt)}
              fill="rgba(239,68,68,0.15)"
            />
          );
        })}

        {/* Planned route altitude profile */}
        <polyline
          points={routePoints}
          fill="none"
          stroke="#10b981"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />

        {/* UAV live altitude line */}
        <line
          x1={pad.l}
          y1={uavY}
          x2={pad.l + innerW}
          y2={uavY}
          stroke="#fbbf24"
          strokeWidth="1.5"
          strokeDasharray="6 3"
        />

        {/* Waypoint dots on terrain */}
        {elevations.map((e, i) => (
          <circle
            key={i}
            cx={toX(i, elevations.length)}
            cy={toY(e.elevationFt)}
            r={e.isThreat ? 4 : 2.5}
            fill={e.isThreat ? '#ef4444' : '#64748b'}
          />
        ))}

        {/* Min clearance annotation */}
        {elevations.length > 0 && (() => {
          const minE = elevations.reduce((a, b) => a.clearanceFt < b.clearanceFt ? a : b);
          const i = elevations.indexOf(minE);
          const x = toX(i, elevations.length);
          const y = toY(minE.elevationFt) - 6;
          return (
            <text x={x} y={y} textAnchor="middle" fill={minE.isThreat ? '#f87171' : '#94a3b8'} fontSize={8} fontFamily="monospace">
              {minE.clearanceFt.toLocaleString()}FT
            </text>
          );
        })()}
      </svg>
    </div>
  );
};
