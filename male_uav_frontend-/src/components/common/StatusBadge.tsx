import React from 'react';
import { HealthStatus, AlertSeverity } from '../../types';

interface StatusBadgeProps {
  status: HealthStatus | AlertSeverity | 'VERIFIED' | 'DISPARITY' | 'ACTIVE' | 'STANDBY' | 'OPTIMAL' | 'ELEVATED';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', pulse = false }) => {
  const getStyles = () => {
    switch (status) {
      case 'HEALTHY':
      case 'VERIFIED':
      case 'OPTIMAL':
      case 'ACTIVE':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          dot: 'bg-emerald-400',
          label: status,
        };
      case 'WARNING':
      case 'ELEVATED':
      case 'NOTICE':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          dot: 'bg-amber-400',
          label: status,
        };
      case 'CRITICAL':
      case 'DISPARITY':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-400',
          dot: 'bg-red-500',
          label: status,
        };
      case 'MAINTENANCE':
        return {
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/30',
          text: 'text-purple-400',
          dot: 'bg-purple-400',
          label: status,
        };
      case 'OFFLINE':
      case 'STANDBY':
      case 'INFO':
      default:
        return {
          bg: 'bg-[var(--surface-elevated)]',
          border: 'border-[var(--border)]',
          text: 'text-gray-400',
          dot: 'bg-gray-500',
          label: status,
        };
    }
  };

  const config = getStyles();

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono-code font-bold uppercase tracking-wider rounded border ${
        config.bg
      } ${config.border} ${config.text} ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dot} led-glow ${
          pulse ? 'animate-ping' : ''
        }`}
      />
      {config.label}
    </span>
  );
};

