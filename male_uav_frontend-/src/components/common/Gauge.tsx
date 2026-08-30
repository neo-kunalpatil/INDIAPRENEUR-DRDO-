import React from 'react';

interface GaugeProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  size?: 'sm' | 'md' | 'lg';
  decimals?: number;
  subtext?: string;
  expectedValue?: number;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  min,
  max,
  label,
  unit,
  warningThreshold,
  criticalThreshold,
  size = 'md',
  decimals = 0,
  subtext,
  expectedValue,
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  
  // Semicircular calculation: angle from -135° to +135° (270° sweep)
  const radius = size === 'sm' ? 38 : size === 'lg' ? 68 : 52;
  const strokeWidth = size === 'sm' ? 6 : size === 'lg' ? 10 : 8;
  const center = radius + strokeWidth + 4;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (270 / 360);
  const strokeDashoffset = arcLength - (arcLength * percentage) / 100;

  // Determine status color
  const isCritical = criticalThreshold !== undefined && value >= criticalThreshold;
  const isWarning = warningThreshold !== undefined && value >= warningThreshold && !isCritical;
  
  const arcColor = isCritical 
    ? '#ef4444' 
    : isWarning 
    ? '#f59e0b' 
    : '#3b82f6';

  const glowClass = isCritical 
    ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
    : isWarning 
    ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' 
    : 'drop-shadow-[0_0_8px_rgba(59,130,246,0.35)]';

  const diffFromExpected = expectedValue !== undefined ? value - expectedValue : null;

  return (
    <div className="flex flex-col items-center justify-center p-3.5 bg-[#15171A]/80 panel-border rounded relative overflow-hidden group hover:border-gray-600 transition-all">
      <div className="scan-line" />
      
      {/* Top Label & Status */}
      <div className="w-full flex items-center justify-between text-[10px] font-mono-code font-bold text-gray-500 uppercase tracking-widest mb-1 z-10">
        <span className="truncate">{label}</span>
        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
          isCritical ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
          isWarning ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
          'bg-blue-500/10 text-blue-400 border border-blue-500/30'
        }`}>
          {isCritical ? 'CRIT' : isWarning ? 'WARN' : 'NORM'}
        </span>
      </div>

      {/* SVG Arc Gauge */}
      <div className="relative flex items-center justify-center my-1 z-10">
        <svg
          width={center * 2}
          height={center * 1.6}
          viewBox={`0 0 ${center * 2} ${center * 1.8}`}
          className={`transform rotate-[135deg] ${glowClass}`}
        >
          {/* Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#1F242D"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Active Value Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Digital Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <span className="font-mono-code font-bold text-xl md:text-2xl tracking-wider text-white">
            {value.toFixed(decimals)}
          </span>
          <span className="text-[10px] font-mono-code text-blue-400 uppercase tracking-widest">
            {unit}
          </span>
        </div>
      </div>

      {/* Footer Details: Range & Expected Comparison */}
      <div className="w-full flex items-center justify-between text-[10px] font-mono-code text-gray-500 mt-1 pt-1.5 border-t border-[#2A2D33] z-10">
        <span>MIN: {min}</span>
        {diffFromExpected !== null && (
          <span className={`${diffFromExpected > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            Δ {diffFromExpected > 0 ? `+${diffFromExpected.toFixed(decimals)}` : diffFromExpected.toFixed(decimals)}
          </span>
        )}
        {subtext && <span className="text-gray-400">{subtext}</span>}
        <span>MAX: {max}</span>
      </div>
    </div>
  );
};
