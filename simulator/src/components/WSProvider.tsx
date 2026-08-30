'use client';
import { useEffect, useState } from 'react';
import { simulation } from '@/simulation/SimulationLoop';
import { useTelemetryStore } from '@/stores/telemetryStore';

export default function WSProvider({ children }: { children: React.ReactNode }) {
  const connected = useTelemetryStore((s) => s.connected);
  const packetCount = useTelemetryStore((s) => s.packetCount);

  useEffect(() => {
    simulation.start();
  }, []);

  return (
    <>
      {/* Connection status bar */}
      <div className={`px-3 py-0.5 text-xs flex items-center gap-3 border-b ${
        connected
          ? 'bg-green-950 border-green-900 text-green-400'
          : 'bg-red-950 border-red-900 text-red-400'
      }`}>
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
        <span>{connected ? `BACKEND CONNECTED — ${packetCount} packets received` : 'BACKEND DISCONNECTED — start uvicorn on port 4000'}</span>
      </div>
      {children}
    </>
  );
}
