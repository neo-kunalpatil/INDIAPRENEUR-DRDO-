"use client";
import { useMissionStore } from '@/stores/missionStore';
import { useTelemetryStore } from '@/stores/telemetryStore';
import { ENDPOINTS } from '@/lib/config';
import { useState } from 'react';

export const Val = ({ l, v, u, warn=false, crit=false }: any) => (
  <div className="flex justify-between text-sm py-1 border-b border-gray-900/50">
    <span className="text-gray-400">{l}</span>
    <span className={crit ? 'text-red-500 font-bold' : warn ? 'text-amber-500 font-bold' : 'text-green-400 font-bold'}>
      {typeof v === 'number' ? v.toFixed(1) : v} {u && <span className="text-gray-600 font-normal">{u}</span>}
    </span>
  </div>
);

const PHASES = ['GROUND_IDLE', 'TAKEOFF', 'CLIMB', 'CRUISE', 'LOITER', 'DESCENT', 'LANDING'];

export default function MissionPage() {
  const tel = useTelemetryStore();
  const connected = tel.connected;
  const p = tel.packet || {};
  const mission = useMissionStore();
  const [loading, setLoading] = useState(false);
  const [cmdResult, setCmdResult] = useState('');

  const sendCmd = async (payload: any) => {
    setLoading(true);
    setCmdResult('Sending...');
    try {
      const res = await fetch(ENDPOINTS.mission, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setCmdResult(`OK: phase=${json.missionPhase || payload.phase} | status=${payload.status || 'OK'}`);
    } catch (e: any) {
      setCmdResult(`ERROR: ${e.message} â€” Check if backend is reachable.`);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    const phase = mission.phase || 'CLIMB';
    mission.setMission({ phase, isActive: true, status: 'RUNNING' });
    sendCmd({ command: 'START', phase, isActive: true, status: 'RUNNING' });
  };
  const handlePause = () => {
    mission.setMission({ phase: 'LOITER', isActive: false, status: 'PAUSED' });
    sendCmd({ command: 'PAUSE', phase: 'LOITER', isActive: false, status: 'PAUSED' });
  };
  const handleResume = () => {
    mission.setMission({ phase: 'CRUISE', isActive: true, status: 'RUNNING' });
    sendCmd({ command: 'RESUME', phase: 'CRUISE', isActive: true, status: 'RUNNING' });
  };
  const handleStop = () => {
    mission.setMission({ phase: 'GROUND_IDLE', isActive: false, status: 'STOPPED' });
    sendCmd({ command: 'STOP', phase: 'GROUND_IDLE', isActive: false, status: 'STOPPED' });
  };
  const handlePhase = (ph: string) => {
    mission.setMission({ phase: ph });
    sendCmd({ phase: ph, isActive: mission.isActive, status: mission.isActive ? 'RUNNING' : 'STOPPED' });
  };

  const livePhase  = p.mission_phase || p.missionPhase || p.mission || mission.phase || 'GROUND_IDLE';
  const liveStatus = mission.status || (p.throttle > 0 ? 'RUNNING' : 'STOPPED');

  const statusColor: Record<string, string> = {
    RUNNING:   'text-green-400 border-green-500 bg-green-950/60',
    PAUSED:    'text-amber-400 border-amber-500 bg-amber-950/60',
    STOPPED:   'text-red-400   border-red-500 bg-red-950/60',
    COMPLETED: 'text-blue-400  border-blue-500 bg-blue-950/60',
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between border-b border-blue-500 pb-2">
        <h1 className="text-xl font-bold text-white">Mission Control</h1>
        <span className={`text-xs font-bold px-3 py-1 border rounded shadow ${statusColor[liveStatus] || 'text-gray-400 border-gray-600'}`}>
          {liveStatus} â€” {livePhase}
        </span>
      </div>

      {/* Backend offline banner */}
      {!connected && (
        <div className="border border-red-700 bg-red-950 text-red-400 p-3 text-xs">
          BACKEND DISCONNECTED — Attempting to reconnect...
        </div>
      )}

      {/* Phase selector */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">1. Select Phase</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PHASES.map(ph => (
            <button key={ph} onClick={() => handlePhase(ph)}
              className={`p-3 border text-sm font-bold tracking-wider transition-all rounded ${
                livePhase === ph
                  ? 'border-green-500 text-green-400 bg-green-900/40 shadow-lg shadow-green-500/20'
                  : 'border-gray-800 text-gray-400 hover:border-gray-500 hover:text-white bg-gray-950'
              }`}>
              {ph}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">2. Controls</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleStart} disabled={loading}
            className={`py-4 text-lg font-bold border-2 rounded transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              liveStatus === 'RUNNING'
                ? 'border-green-400 text-white bg-green-600 shadow-lg shadow-green-500/50'
                : 'border-green-500 text-green-400 bg-green-900/40 hover:bg-green-800/60'
            }`}>
            {loading ? 'SENDING...' : 'START MISSION'}
          </button>
          <button onClick={handleStop} disabled={loading}
            className={`py-4 text-lg font-bold border-2 rounded transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              liveStatus === 'STOPPED'
                ? 'border-red-400 text-white bg-red-600 shadow-lg shadow-red-500/50'
                : 'border-red-500 text-red-400 bg-red-900/40 hover:bg-red-800/60'
            }`}>
            STOP
          </button>
          <button onClick={handlePause} disabled={loading}
            className={`py-4 font-bold border-2 rounded transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              liveStatus === 'PAUSED'
                ? 'border-amber-400 text-white bg-amber-600 shadow-lg shadow-amber-500/50'
                : 'border-amber-500 text-amber-400 bg-amber-900/40 hover:bg-amber-800/60'
            }`}>
            PAUSE
          </button>
          <button onClick={handleResume} disabled={loading}
            className="py-4 font-bold border-2 border-blue-500 text-blue-400 bg-blue-900/40 hover:bg-blue-800/60 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed rounded">
            RESUME
          </button>
        </div>
      </div>

      {/* Live telemetry */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">3. Live Telemetry</p>
        <div className="grid grid-cols-2 gap-x-8 bg-gray-950 p-4 border border-gray-900 rounded">
          <div>
            <Val l="RPM"            v={p.rpm ?? 0}           u="RPM"  warn={(p.rpm??0)>5500} />
            <Val l="Throttle"       v={p.throttle_pct ?? p.throttle ?? 0} u="%"    />
            <Val l="MAP"            v={p.map_kpa ?? p.map ?? 0} u="kPa"  />
            <Val l="Fuel Flow"      v={p.fuel_flow_lph ?? p.fuelFlow ?? 0} u="L/hr" warn={(p.fuel_flow_lph??0)>35} />
            <Val l="Fuel Remaining" v={p.fuel_remaining_l ?? p.fuelRemaining ?? 0} u="L" crit={(p.fuel_remaining_l??100)<10} />
            <Val l="EGT"            v={p.egt_c ?? p.egt ?? 0} u="Â°C"   warn={(p.egt_c??0)>800} crit={(p.egt_c??0)>900} />
          </div>
          <div>
            <Val l="Altitude"       v={p.altitude_m ?? p.altitude ?? 0} u="m"    />
            <Val l="Airspeed"       v={p.airspeed_kmh ?? p.airspeed ?? 0} u="km/h" />
            <Val l="Vert. Speed"    v={p.vertical_speed_ms ?? p.verticalSpeed ?? 0} u="m/s"  />
            <Val l="CHT"            v={p.cht_c ?? p.cht ?? 0} u="Â°C"   warn={(p.cht_c??0)>200} crit={(p.cht_c??0)>230} />
            <Val l="Oil Pressure"   v={p.oil_pressure_kpa ?? p.oilPressure ?? 0} u="kPa"  crit={(p.oil_pressure_kpa??500)<150} />
            <Val l="Health Score"   v={p.health_score ?? p.health ?? 100} u="%" warn={(p.health_score??100)<70} crit={(p.health_score??100)<40} />
          </div>
        </div>
      </div>

      {/* Last command result */}
      {cmdResult && (
        <div className={`text-xs p-2 border break-all rounded ${
          cmdResult.startsWith('ERROR') ? 'border-red-800 bg-red-950 text-red-400' : 'border-gray-800 bg-gray-950 text-gray-400'
        }`}>
          {cmdResult}
        </div>
      )}
    </div>
  );
}

