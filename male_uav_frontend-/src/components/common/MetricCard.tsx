import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral' | 'warning';
  icon?: LucideIcon;
  subtext?: string;
  status?: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'HIGHLIGHT';
  onClick?: () => void;
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  change,
  changeType = 'neutral',
  icon: Icon,
  subtext,
  status = 'NORMAL',
  onClick,
  badge,
}) => {
  const getStatusBorder = () => {
    switch (status) {
      case 'CRITICAL':
        return 'border-red-500/40 bg-red-950/20 hover:border-red-400';
      case 'WARNING':
        return 'border-amber-500/40 bg-amber-950/20 hover:border-amber-400';
      case 'HIGHLIGHT':
        return 'border-blue-500/40 bg-blue-950/20 hover:border-blue-400';
      default:
        return 'border-[var(--border)] bg-[var(--surface-elevated)]/80 hover:border-gray-600';
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-emerald-400';
      case 'negative':
        return 'text-red-400';
      case 'warning':
        return 'text-amber-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded border transition-all relative overflow-hidden group panel-border ${getStatusBorder()} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="scan-line opacity-50" />
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono-code font-bold text-gray-500 uppercase tracking-widest">
              {title}
            </span>
            {badge && (
              <span className="text-[9px] font-mono-code px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 font-bold border border-blue-500/30">
                {badge}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono-code font-bold text-2xl tracking-tight text-[var(--text-primary)]">
              {value}
            </span>
            {unit && (
              <span className="text-xs font-mono-code text-gray-400 uppercase">
                {unit}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {(change || subtext) && (
        <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[10px] font-mono-code">
          {change && (
            <span className={`font-semibold ${getChangeColor()}`}>
              {change}
            </span>
          )}
          {subtext && (
            <span className="text-gray-400 truncate max-w-[180px]">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

