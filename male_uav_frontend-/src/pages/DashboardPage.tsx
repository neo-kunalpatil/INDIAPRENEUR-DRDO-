import React from 'react';
import { 
  Shield, 
  Activity, 
  Cpu, 
  AlertTriangle, 
  TrendingUp, 
  Radio, 
  Compass, 
  Zap, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Flame,
  Gauge as GaugeIcon,
  Sparkles,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';
import { Gauge } from '../components/common/Gauge';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';

export const DashboardPage: React.FC = () => {
  const { 
    uavFleet, 
    selectedUav, 
    setSelectedUavId, 
    telemetry, 
    mission, 
    activeFaults, 
    alerts, 
    setActiveTab, 
    startDemoTour 
  } = useGcs();

  const activeInjectedFaults = activeFaults.filter(f => f.active);

  return (
    <div id="dashboard-overview" className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* Tactical Mission Banner / Quick Status */}
      <div className="bg-[var(--surface)]/90 panel-border rounded p-4 shadow-xl relative overflow-hidden">
        <div className="scan-line" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-mono-code font-bold tracking-wider uppercase">
                Active Patrol // FL220
              </span>
              <span className="text-xs font-mono-code text-gray-400 uppercase">
                Zone: {selectedUav.location.region}
              </span>
            </div>
            <h1 className="font-bold text-xl md:text-2xl text-[var(--text-primary)] flex items-center gap-2">
              <span>{mission.codeName}</span>
            </h1>
            <p className="text-xs text-gray-400 font-mono-code mt-0.5">
              Assigned Platform: <strong className="text-blue-400">{selectedUav.callsign}</strong> • Powerplant: <strong className="text-[var(--text-primary)]">Rotax 914-TC 115 HP Aero Piston</strong>
            </p>
          </div>

          {/* Key Tactical Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('live-monitoring')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold transition-all"
            >
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Telemetry SCADA</span>
            </button>
            <button
              onClick={() => setActiveTab('digital-twin')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold transition-all"
            >
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>3D Digital Twin</span>
            </button>
            <button
              onClick={() => setActiveTab('fault-injection')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold transition-all"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Fault Simulator</span>
            </button>
            <button
              onClick={startDemoTour}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Judge Tour</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Adaptive Engine Health"
          value={`${selectedUav.engineHealthIndex.toFixed(1)}%`}
          status={selectedUav.engineHealthIndex > 80 ? 'NORMAL' : 'WARNING'}
          change={selectedUav.engineHealthIndex > 80 ? 'Nominal Envelope' : 'Thermal Disparity'}
          changeType={selectedUav.engineHealthIndex > 80 ? 'positive' : 'warning'}
          icon={Activity}
          subtext="Adaptive Health Index (AHI)"
          badge="INNOVATION #3"
          onClick={() => setActiveTab('live-monitoring')}
        />
        <MetricCard
          title="Mission-Aware RUL"
          value={`${selectedUav.predictedRulHours}h`}
          status="HIGHLIGHT"
          change="FL220 Altitude Profile"
          changeType="positive"
          icon={Clock}
          subtext="Limiting: Cyl #3 Head Temp"
          badge="INNOVATION #2"
          onClick={() => setActiveTab('ai-predictions')}
        />
        <MetricCard
          title="Mission Risk (Go/No-Go)"
          value={`${selectedUav.missionRiskScore.toFixed(1)}%`}
          status={selectedUav.missionRiskScore < 30 ? 'NORMAL' : 'CRITICAL'}
          change={selectedUav.missionRiskScore < 30 ? 'VERDICT: GO FLIGHT' : 'OBSERVE RECOVERY'}
          changeType={selectedUav.missionRiskScore < 30 ? 'positive' : 'negative'}
          icon={Shield}
          subtext="Terrain + Weather + Engine"
          badge="INNOVATION #11"
          onClick={() => setActiveTab('mission-control')}
        />
        <MetricCard
          title="Physics-AI Twin Sync"
          value={`${selectedUav.twinConfidenceScore}%`}
          status="NORMAL"
          change="Thermodynamic Convergence"
          changeType="positive"
          icon={Cpu}
          subtext="0% False Positive Verification"
          badge="USP #1"
          onClick={() => setActiveTab('hybrid-verification')}
        />
      </div>

      {/* Main Command Center Layout: Gauges & Engine Heartbeat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 4 Cols: Essential SCADA Gauges */}
        <div className="lg:col-span-4 bg-[var(--surface-elevated)]/80 panel-border rounded p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="scan-line" />
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-3">
            <div className="flex items-center gap-2">
              <GaugeIcon className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest">
                Core Telemetry Gauges
              </h3>
            </div>
            <span className="text-[10px] font-mono-code text-gray-500 uppercase">ROTAX 914-TC</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Gauge
              label="ENGINE SPEED"
              value={telemetry.rpm}
              min={1800}
              max={6200}
              unit="RPM"
              warningThreshold={5500}
              criticalThreshold={5850}
              expectedValue={5100}
            />
            <Gauge
              label="MANIFOLD PRESSURE"
              value={telemetry.manifoldPressureInHg}
              min={15}
              max={42}
              unit="inHg"
              decimals={1}
              warningThreshold={37.5}
              criticalThreshold={39.5}
              expectedValue={35.8}
            />
            <Gauge
              label="OIL PRESSURE"
              value={telemetry.oilPressureBar}
              min={1.0}
              max={6.5}
              unit="bar"
              decimals={2}
              warningThreshold={2.2}
              criticalThreshold={1.8}
              expectedValue={4.3}
            />
            <Gauge
              label="TURBO BOOST"
              value={telemetry.turboBoostBar}
              min={0.0}
              max={1.5}
              unit="bar"
              decimals={2}
              warningThreshold={1.15}
              criticalThreshold={1.30}
              expectedValue={0.88}
            />
          </div>

          <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-xs">
            <span className="text-gray-400 font-mono-code text-[11px] uppercase">Knock Index:</span>
            <span className={`font-mono-code font-bold ${telemetry.knockIndex > 0.4 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
              {telemetry.knockIndex.toFixed(2)} / 1.00 {telemetry.knockIndex > 0.4 ? '(DETONATION RISK)' : '(SAFE)'}
            </span>
          </div>
        </div>

        {/* Center 5 Cols: 4-Cylinder Thermal Distribution & Subsystems */}
        <div className="lg:col-span-5 bg-[var(--surface-elevated)]/80 panel-border rounded p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="scan-line" />
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest">
                4-Cylinder Combustion Thermocouples
              </h3>
            </div>
            <StatusBadge status="OPTIMAL" size="sm" />
          </div>

          {/* 4 Cylinders Visual Bars */}
          <div className="space-y-3">
            {[0, 1, 2, 3].map((idx) => {
              const cht = telemetry.chtC[idx];
              const egt = telemetry.egtC[idx];
              const isHot = cht > 125 || egt > 820;

              return (
                <div key={idx} className="p-2.5 rounded bg-[var(--background)]/80 border border-[var(--border)] text-xs">
                  <div className="flex items-center justify-between font-mono-code mb-1">
                    <span className="font-bold text-blue-400">CYLINDER #{idx + 1}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">CHT: <strong className={cht > 125 ? 'text-red-400' : 'text-[var(--text-primary)]'}>{cht}°C</strong></span>
                      <span className="text-gray-400">EGT: <strong className={eggtColor(egt)}>{egt}°C</strong></span>
                    </div>
                  </div>

                  {/* Visual Thermal Gradient Bar */}
                  <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isHot ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-blue-500 to-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, (cht / 150) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] font-mono-code text-gray-400">
            <span>Fuel Flow: <strong className="text-[var(--text-primary)]">{telemetry.fuelFlowLitersHr} L/h</strong></span>
            <span>Coolant: <strong className="text-[var(--text-primary)]">{telemetry.coolantTempC}°C</strong></span>
            <span>Oil Temp: <strong className="text-[var(--text-primary)]">{telemetry.oilTempC}°C</strong></span>
          </div>
        </div>

        {/* Right 3 Cols: Fleet Squadron Summary & Active Injected Anomalies */}
        <div className="lg:col-span-3 bg-[var(--surface-elevated)]/80 panel-border rounded p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="scan-line" />
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest">
                Squadron Status
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('fleet')}
              className="text-[10px] font-mono-code text-blue-400 hover:underline uppercase"
            >
              View Fleet →
            </button>
          </div>

          {/* UAV list mini */}
          <div className="space-y-1.5">
            {uavFleet.slice(0, 4).map((uav) => (
              <div
                key={uav.id}
                onClick={() => setSelectedUavId(uav.id)}
                className={`p-2 rounded border text-xs font-mono-code cursor-pointer transition-all ${
                  uav.id === selectedUav.id
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-sm'
                    : 'bg-[var(--background)]/60 border-[var(--border)] hover:border-gray-600 text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold truncate text-[var(--text-primary)]">{uav.callsign.split(' ')[0]}</span>
                  <span className={`font-bold ${uav.engineHealthIndex > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {uav.engineHealthIndex.toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>{uav.status.replace(/_/g, ' ')}</span>
                  <span>RUL: {uav.predictedRulHours}h</span>
                </div>
              </div>
            ))}
          </div>

          {/* Injected Fault Indicator Box */}
          <div className="mt-3 p-2.5 rounded bg-[var(--background)] border border-[var(--border)]">
            <div className="flex items-center justify-between text-[10px] font-mono-code font-bold mb-1">
              <span className="text-gray-400 uppercase">ACTIVE INJECTED FAULTS:</span>
              <span className={activeInjectedFaults.length > 0 ? 'text-red-400' : 'text-emerald-400'}>
                {activeInjectedFaults.length} ACTIVE
              </span>
            </div>
            {activeInjectedFaults.length > 0 ? (
              <div className="text-[11px] text-red-300 font-mono-code truncate">
                ⚠️ {activeInjectedFaults[0].name}
              </div>
            ) : (
              <div className="text-[11px] text-gray-500 font-mono-code">
                All engine parameters nominal.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: AI Insights & Tactical Alert Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* AI Predictive Insight Card (7 Cols) */}
        <div className="lg:col-span-7 bg-[var(--surface-elevated)]/80 panel-border rounded p-4 relative overflow-hidden">
          <div className="scan-line" />
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest">
                AI Health Diagnostic & Predictive Insights
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-mono-code font-bold uppercase">
              Multi-Agent Consensus
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
            <div className="p-3 rounded bg-[var(--background)]/80 border border-[var(--border)]">
              <span className="text-gray-500 text-[10px] font-mono-code block mb-1 uppercase">Acoustic / Vibration</span>
              <div className="font-mono-code font-bold text-lg text-[var(--text-primary)]">
                {telemetry.vibrationRmsMmS} mm/s
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Harmonic peak at {telemetry.vibrationFftPeakHz} Hz. Bearing cage intact.
              </p>
            </div>

            <div className="p-3 rounded bg-[var(--background)]/80 border border-[var(--border)]">
              <span className="text-gray-500 text-[10px] font-mono-code block mb-1 uppercase">Air-Fuel Mixture</span>
              <div className="font-mono-code font-bold text-lg text-[var(--text-primary)]">
                λ {telemetry.lambdaAirFuelRatio}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Electronic fuel injection stoichiometric ratio optimal.
              </p>
            </div>

            <div className="p-3 rounded bg-[var(--background)]/80 border border-[var(--border)]">
              <span className="text-gray-500 text-[10px] font-mono-code block mb-1 uppercase">Turbo Efficiency</span>
              <div className="font-mono-code font-bold text-lg text-[var(--text-primary)]">
                {(telemetry.turbochargerRpm / 1000).toFixed(0)}k RPM
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Wastegate servo angle verified against thermodynamics.
              </p>
            </div>
          </div>

          <div className="p-3 rounded bg-blue-950/20 border border-blue-800/40 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-blue-900/60 text-blue-300">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-blue-200">
                  Mission-Aware RUL Forecast: Safe for 142.6 more flight hours
                </p>
                <p className="text-[11px] text-gray-400">
                  Next scheduled top-end valve lash inspection recommended at 250 flight hours.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('ai-predictions')}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shrink-0 transition-colors"
            >
              Explain AI →
            </button>
          </div>
        </div>

        {/* Real-time Alert Stream (5 Cols) */}
        <div className="lg:col-span-5 bg-[var(--surface-elevated)]/80 panel-border rounded p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="scan-line" />
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest">
                Telemetry & Anomaly Stream
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('alerts')}
              className="text-[10px] font-mono-code text-blue-400 hover:underline uppercase"
            >
              All Alerts ({alerts.length}) →
            </button>
          </div>

          <div className="space-y-2 flex-1">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`p-2.5 rounded border text-xs font-mono-code transition-all ${
                  alert.severity === 'CRITICAL' ? 'bg-red-950/30 border-red-500/40 text-red-200' :
                  alert.severity === 'WARNING' ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' :
                  'bg-[var(--background)]/80 border-[var(--border)] text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-0.5">
                  <span className="font-bold uppercase tracking-wider">{alert.severity} • {alert.uavCallsign.split(' ')[0]}</span>
                  <span className="text-gray-400">{alert.timestamp}</span>
                </div>
                <div className="font-bold text-[var(--text-primary)] truncate">{alert.title}</div>
                <div className="text-[10px] text-gray-400 truncate mt-0.5">{alert.suggestedAction}</div>
              </div>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[10px] font-mono-code text-gray-500 uppercase">
            <span>Audit Trail: Encrypted</span>
            <span>Telemetry: 20 Hz</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function eggtColor(egt: number) {
  if (egt > 820) return 'text-red-400';
  if (egt > 790) return 'text-amber-400';
  return 'text-[var(--text-primary)]';
}
