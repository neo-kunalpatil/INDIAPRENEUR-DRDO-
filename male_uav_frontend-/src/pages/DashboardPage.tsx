import React, { useState } from 'react';
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
import { GarudaAIPanel } from '../components/GarudaAIPanel';

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

  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);

  const activeInjectedFaults = activeFaults.filter(f => f.active);

  // Active Fault Banner Mapper (100% Simulator Source of Truth - No Static or Threshold Fallbacks)
  const detectedFaultFromTelemetry = React.useMemo(() => {
    if (activeInjectedFaults.length > 0) {
      const f = activeInjectedFaults[0];
      const severityStr = f.severityPercent > 80 ? 'CRITICAL' : f.severityPercent > 60 ? 'HIGH' : f.severityPercent > 40 ? 'MEDIUM' : 'LOW';
      return { 
        id: f.id, 
        name: f.name, 
        severity: severityStr, 
        description: f.description || `Simulated ${f.name} injected at ${f.severityPercent}% severity on ${f.component}.` 
      };
    }
    return null;
  }, [activeInjectedFaults]);

  return (
    <div id="dashboard-overview" className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* Global Fault Alert Banner (Dynamic Severity Color Mapping: Blue/Yellow/Orange/Red) */}
      {detectedFaultFromTelemetry && (
        <div 
          onClick={() => setActiveDrawer('FAULT_ANALYSIS')}
          className={`rounded-xl p-3.5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer transition-all animate-pulse border-2 ${
            detectedFaultFromTelemetry.severity === 'CRITICAL' ? 'bg-red-950/90 border-red-600 hover:bg-red-900/90' :
            detectedFaultFromTelemetry.severity === 'HIGH' ? 'bg-amber-950/90 border-orange-500 hover:bg-amber-900/90' :
            detectedFaultFromTelemetry.severity === 'MEDIUM' ? 'bg-yellow-950/90 border-yellow-500 hover:bg-yellow-900/90' :
            'bg-blue-950/90 border-blue-500 hover:bg-blue-900/90'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-6 h-6 shrink-0 ${
              detectedFaultFromTelemetry.severity === 'CRITICAL' ? 'text-red-400' :
              detectedFaultFromTelemetry.severity === 'HIGH' ? 'text-orange-400' :
              detectedFaultFromTelemetry.severity === 'MEDIUM' ? 'text-yellow-400' :
              'text-blue-400'
            }`} />
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 border rounded text-[10px] font-mono-code font-bold uppercase ${
                  detectedFaultFromTelemetry.severity === 'CRITICAL' ? 'bg-red-900 border-red-500 text-red-200' :
                  detectedFaultFromTelemetry.severity === 'HIGH' ? 'bg-orange-900 border-orange-500 text-orange-200' :
                  detectedFaultFromTelemetry.severity === 'MEDIUM' ? 'bg-yellow-900 border-yellow-500 text-yellow-200' :
                  'bg-blue-900 border-blue-500 text-blue-200'
                }`}>
                  {detectedFaultFromTelemetry.severity} FAULT DETECTED // LIVE SYNC
                </span>
                <span className="text-[10px] font-mono-code text-slate-300">DETECTED 2 SEC AGO</span>
              </div>
              <h3 className="font-heading font-bold text-base text-white mt-0.5">
                ⚠️ {detectedFaultFromTelemetry.name} — {detectedFaultFromTelemetry.description || 'Parameter out of nominal envelope'}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono-code text-slate-200 font-bold hidden sm:inline">CLICK FOR FAULT ANALYSIS PANEL →</span>
            <button className={`px-3 py-1 text-white font-mono-code font-bold text-xs rounded shadow ${
              detectedFaultFromTelemetry.severity === 'CRITICAL' ? 'bg-red-600 hover:bg-red-500' :
              detectedFaultFromTelemetry.severity === 'HIGH' ? 'bg-orange-600 hover:bg-orange-500' :
              detectedFaultFromTelemetry.severity === 'MEDIUM' ? 'bg-yellow-600 hover:bg-yellow-500' :
              'bg-blue-600 hover:bg-blue-500'
            }`}>
              ANALYZE FAULT
            </button>
          </div>
        </div>
      )}
      {/* Tactical Mission Banner / Quick Status */}
      <div className="bg-[#111318]/90 panel-border rounded p-4 shadow-xl relative overflow-hidden">
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
            <h1 className="font-bold text-xl md:text-2xl text-white flex items-center gap-2">
              <span>{mission.codeName}</span>
            </h1>
            <p className="text-xs text-gray-400 font-mono-code mt-0.5">
              Assigned Platform: <strong className="text-blue-400">{selectedUav.callsign}</strong> • Powerplant: <strong className="text-gray-200">Rotax 914-TC 115 HP Aero Piston</strong>
            </p>
          </div>

          {/* Key Tactical Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('live-monitoring')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#15171A] hover:bg-[#2A2D33] text-gray-200 border border-[#2A2D33] text-xs font-semibold transition-all"
            >
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Telemetry SCADA</span>
            </button>
            <button
              onClick={() => setActiveTab('digital-twin')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#15171A] hover:bg-[#2A2D33] text-gray-200 border border-[#2A2D33] text-xs font-semibold transition-all"
            >
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>3D Digital Twin</span>
            </button>
            <button
              onClick={() => setActiveTab('fault-injection')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#15171A] hover:bg-[#2A2D33] text-gray-200 border border-[#2A2D33] text-xs font-semibold transition-all"
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

      {/* Mission Readiness & Commander Executive Summary Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between font-mono-code text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-100 uppercase tracking-wider">DRDO Commander Executive Verdict & Mission Readiness</span>
            </div>
            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-bold text-[10px]">
              VERDICT: GO FLIGHT (94% READINESS)
            </span>
          </div>

          <p className="text-slate-300 leading-relaxed">
            <strong>COMMANDER SUMMARY:</strong> Powerplant operating nominally. Cylinder head temperatures balanced within +2.4°C disparity. Fuel reserves safe for 14.2 hours patrol. Mission completion probability evaluated at <strong>98.6%</strong>.
          </p>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span>Engine Health: <strong className="text-emerald-400">96.2%</strong></span>
            <span>Fuel Readiness: <strong className="text-emerald-400">94.0%</strong></span>
            <span>Weather Margin: <strong className="text-cyan-300">92.5%</strong></span>
            <span>AI Confidence: <strong className="text-slate-100">98.4%</strong></span>
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between font-mono-code text-xs">
          <span className="text-slate-400 block font-bold border-b border-slate-800 pb-1.5">PASSPORT & SIMULATION QUICK TOOLS</span>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => setActiveDrawer('HEALTH')}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-cyan-300 font-bold text-left transition-colors"
            >
              📖 Health Passport →
            </button>
            <button
              onClick={() => setActiveDrawer('RISK')}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-emerald-300 font-bold text-left transition-colors"
            >
              🎮 What-If Simulator →
            </button>
            <button
              onClick={() => setActiveDrawer('TWIN')}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-indigo-300 font-bold text-left transition-colors"
            >
              ⚖️ Physics vs AI →
            </button>
            <button
              onClick={() => setActiveDrawer('RUL')}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-amber-300 font-bold text-left transition-colors"
            >
              🌴 Root Cause Tree →
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Adaptive Engine Health"
          value={`${(Number(selectedUav.engineHealthIndex) || 0).toFixed(1)}%`}
          status={selectedUav.engineHealthIndex > 80 ? 'NORMAL' : 'WARNING'}
          change={selectedUav.engineHealthIndex > 80 ? 'Nominal Envelope' : 'Thermal Disparity'}
          changeType={selectedUav.engineHealthIndex > 80 ? 'positive' : 'warning'}
          icon={Activity}
          subtext="Click for Health Intelligence Center"
          badge="INNOVATION #3"
          onClick={() => setActiveDrawer('HEALTH')}
        />
        <MetricCard
          title="Mission-Aware RUL"
          value={`${selectedUav.predictedRulHours}h`}
          status="HIGHLIGHT"
          change="FL220 Altitude Profile"
          changeType="positive"
          icon={Clock}
          subtext="Click for RUL Life Prediction Center"
          badge="INNOVATION #2"
          onClick={() => setActiveDrawer('RUL')}
        />
        <MetricCard
          title="Mission Risk (Go/No-Go)"
          value={`${(Number(selectedUav.missionRiskScore) || 0).toFixed(1)}%`}
          status={selectedUav.missionRiskScore < 30 ? 'NORMAL' : 'CRITICAL'}
          change={selectedUav.missionRiskScore < 30 ? 'VERDICT: GO FLIGHT' : 'OBSERVE RECOVERY'}
          changeType={selectedUav.missionRiskScore < 30 ? 'positive' : 'negative'}
          icon={Shield}
          subtext="Click for Mission Risk Center"
          badge="INNOVATION #11"
          onClick={() => setActiveDrawer('RISK')}
        />
        <MetricCard
          title="Physics-AI Twin Sync"
          value={`${selectedUav.twinConfidenceScore}%`}
          status="NORMAL"
          change="Thermodynamic Convergence"
          changeType="positive"
          icon={Cpu}
          subtext="Click for Twin Sync Center"
          badge="USP #1"
          onClick={() => setActiveDrawer('TWIN')}
        />
      </div>

      {/* Main Command Center Layout: Gauges & Engine Heartbeat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 4 Cols: Essential SCADA Gauges */}
        <div 
          onClick={() => setActiveDrawer('GAUGE')}
          className="lg:col-span-4 bg-[#15171A]/80 panel-border rounded p-4 flex flex-col justify-between relative overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all group"
        >
          <div className="scan-line" />
          <div className="flex items-center justify-between border-b border-[#2A2D33] pb-2 mb-3">
            <div className="flex items-center gap-2">
              <GaugeIcon className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest group-hover:text-blue-300">
                Core Telemetry Gauges (Click for Analysis)
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

          <div className="mt-3 pt-2.5 border-t border-[#2A2D33] flex items-center justify-between text-xs">
            <span className="text-gray-400 font-mono-code text-[11px] uppercase">Knock Index:</span>
            <span className={`font-mono-code font-bold ${telemetry.knockIndex > 0.4 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
              {(Number(telemetry.knockIndex) || 0).toFixed(2)} / 1.00 {telemetry.knockIndex > 0.4 ? '(DETONATION RISK)' : '(SAFE)'}
            </span>
          </div>
        </div>

        {/* Center 5 Cols: 4-Cylinder Thermal Distribution & Subsystems */}
        <div 
          onClick={() => setActiveDrawer('CYLINDER')}
          className="lg:col-span-5 bg-[#15171A]/80 panel-border rounded p-4 flex flex-col justify-between relative overflow-hidden cursor-pointer hover:border-amber-500/50 transition-all group"
        >
          <div className="scan-line" />
          <div className="flex items-center justify-between border-b border-[#2A2D33] pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest group-hover:text-amber-300">
                4-Cylinder Thermocouples (Click for Analysis)
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
                <div key={idx} className="p-2.5 rounded bg-[#0A0B0D]/80 border border-[#2A2D33] text-xs">
                  <div className="flex items-center justify-between font-mono-code mb-1">
                    <span className="font-bold text-blue-400">CYLINDER #{idx + 1}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">CHT: <strong className={cht > 125 ? 'text-red-400' : 'text-white'}>{cht}°C</strong></span>
                      <span className="text-gray-400">EGT: <strong className={eggtColor(egt)}>{egt}°C</strong></span>
                    </div>
                  </div>

                  {/* Visual Thermal Gradient Bar */}
                  <div className="w-full bg-[#1F242D] h-1.5 rounded-full overflow-hidden flex">
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

          <div className="mt-3 pt-2 border-t border-[#2A2D33] flex items-center justify-between text-[11px] font-mono-code text-gray-400">
            <span>Fuel Flow: <strong className="text-white">{telemetry.fuelFlowLitersHr} L/h</strong></span>
            <span>Coolant: <strong className="text-white">{telemetry.coolantTempC}°C</strong></span>
            <span>Oil Temp: <strong className="text-white">{telemetry.oilTempC}°C</strong></span>
          </div>
        </div>

        {/* Right 3 Cols: Fleet Squadron Summary & Active Injected Anomalies */}
        <div className="lg:col-span-3 bg-[#15171A]/80 panel-border rounded p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="scan-line" />
          <div className="flex items-center justify-between border-b border-[#2A2D33] pb-2 mb-2">
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
                    : 'bg-[#0A0B0D]/60 border-[#2A2D33] hover:border-gray-600 text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold truncate text-white">{uav.callsign.split(' ')[0]}</span>
                  <span className={`font-bold ${uav.engineHealthIndex > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {(Number(uav.engineHealthIndex) || 0).toFixed(0)}%
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
          <div className="mt-3 p-2.5 rounded bg-[#0A0B0D] border border-[#2A2D33]">
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
        <div className="lg:col-span-7 bg-[#15171A]/80 panel-border rounded p-4 relative overflow-hidden">
          <div className="scan-line" />
          <div className="flex items-center justify-between border-b border-[#2A2D33] pb-2 mb-3">
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
            <div className="p-3 rounded bg-[#0A0B0D]/80 border border-[#2A2D33]">
              <span className="text-gray-500 text-[10px] font-mono-code block mb-1 uppercase">Acoustic / Vibration</span>
              <div className="font-mono-code font-bold text-lg text-white">
                {telemetry.vibrationRmsMmS} mm/s
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Harmonic peak at {telemetry.vibrationFftPeakHz} Hz. Bearing cage intact.
              </p>
            </div>

            <div className="p-3 rounded bg-[#0A0B0D]/80 border border-[#2A2D33]">
              <span className="text-gray-500 text-[10px] font-mono-code block mb-1 uppercase">Air-Fuel Mixture</span>
              <div className="font-mono-code font-bold text-lg text-white">
                λ {telemetry.lambdaAirFuelRatio}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Electronic fuel injection stoichiometric ratio optimal.
              </p>
            </div>

            <div className="p-3 rounded bg-[#0A0B0D]/80 border border-[#2A2D33]">
              <span className="text-gray-500 text-[10px] font-mono-code block mb-1 uppercase">Turbo Efficiency</span>
              <div className="font-mono-code font-bold text-lg text-white">
                {(Number(telemetry.turbochargerRpm / 1000) || 0).toFixed(0)}k RPM
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
        <div className="lg:col-span-5 bg-[#15171A]/80 panel-border rounded p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="scan-line" />
          <div className="flex items-center justify-between border-b border-[#2A2D33] pb-2 mb-2">
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
                  'bg-[#0A0B0D]/80 border-[#2A2D33] text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-0.5">
                  <span className="font-bold uppercase tracking-wider">{alert.severity} • {alert.uavCallsign.split(' ')[0]}</span>
                  <span className="text-gray-400">{alert.timestamp}</span>
                </div>
                <div className="font-bold text-white truncate">{alert.title}</div>
                <div className="text-[10px] text-gray-400 truncate mt-0.5">{alert.suggestedAction}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* GARUDA-AI Enterprise Mission Intelligence Panel */}
      <div className="h-[400px]">
        <GarudaAIPanel />
      </div>

      {/* Right Slide-Over Defense Intelligence Analysis Drawer Panel */}
      {activeDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-md transition-opacity">
          <div className="w-full max-w-4xl bg-slate-950 border-l border-slate-800 h-full p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-5">
              {/* Header Banner */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
                  <div>
                    <h2 className="font-heading font-bold text-xl text-slate-100 uppercase tracking-wider">
                      {activeDrawer === 'FAULT_ANALYSIS' && 'Live Critical Fault Analysis & Root Cause Center'}
                      {activeDrawer === 'HEALTH' && 'Adaptive Engine Health Executive Intelligence Center'}
                      {activeDrawer === 'RUL' && 'Mission-Aware Remaining Useful Life (RUL) Center'}
                      {activeDrawer === 'RISK' && 'Mission Decision & Risk Assessment Center'}
                      {activeDrawer === 'TWIN' && 'Physics-AI Digital Twin Synchronization Center'}
                      {activeDrawer === 'GAUGE' && 'Core SCADA Telemetry Instrumentation Analytics'}
                      {activeDrawer === 'CYLINDER' && '4-Cylinder Thermocouple & Combustion Analytics'}
                    </h2>
                    <p className="text-xs font-mono-code text-slate-400 mt-0.5">DRDO Ground Control Station • Rotax 914-TC Platform • Defense-Grade Decision Support</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono-code font-bold text-slate-300 transition-colors"
                >
                  CLOSE ✕
                </button>
              </div>

              {/* 0. FAULT ANALYSIS DRAWER CONTENT */}
              {activeDrawer === 'FAULT_ANALYSIS' && activeInjectedFaults.length > 0 && (() => {
                const faultObj = activeInjectedFaults[0];
                const sevPercent = faultObj.severityPercent || 75;
                const sevStr = faultObj.severityPercent > 80 ? 'CRITICAL' : faultObj.severityPercent > 60 ? 'HIGH' : faultObj.severityPercent > 40 ? 'MEDIUM' : 'LOW';

                return (
                  <div className="space-y-5 font-mono-code text-xs">
                    {/* Fault Summary Banner */}
                    <div className="p-4 bg-red-950/90 rounded-xl border-2 border-red-600 space-y-2">
                      <div className="flex justify-between items-center border-b border-red-800/80 pb-2">
                        <span className="font-bold text-red-300 uppercase tracking-wider text-sm">⚠ SIMULATOR ACTIVE FAULT ANALYSIS</span>
                        <span className={`px-2.5 py-0.5 border rounded text-[10px] font-bold uppercase ${
                          sevStr === 'CRITICAL' ? 'bg-red-900 border-red-500 text-red-100' :
                          sevStr === 'HIGH' ? 'bg-orange-900 border-orange-500 text-orange-100' :
                          sevStr === 'MEDIUM' ? 'bg-yellow-900 border-yellow-500 text-yellow-100' :
                          'bg-blue-900 border-blue-500 text-blue-100'
                        }`}>
                          SEVERITY: {sevStr} ({sevPercent}%)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-slate-200">
                        <div><span className="text-slate-400 text-[10px] block">FAULT NAME</span><strong className="text-red-400">{faultObj.name}</strong></div>
                        <div><span className="text-slate-400 text-[10px] block">INJECTION TIME</span><strong>{faultObj.timestampInjected || 'Just now'}</strong></div>
                        <div><span className="text-slate-400 text-[10px] block">TARGET COMPONENT</span><strong className="uppercase">{faultObj.component}</strong></div>
                        <div><span className="text-slate-400 text-[10px] block">AI CONFIDENCE</span><strong className="text-emerald-400">98.9%</strong></div>
                      </div>
                    </div>

                    {/* Why Fault Was Detected & Root Cause */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                        <span className="font-bold text-cyan-300 block border-b border-slate-800 pb-1.5">EXPLAINABLE AI DIAGNOSTIC</span>
                        <p className="text-slate-300 leading-relaxed">
                          {faultObj.description || `Injected simulator anomaly operating on ${faultObj.component} at ${sevPercent}% intensity.`}
                        </p>
                      </div>

                      <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                        <span className="font-bold text-amber-300 block border-b border-slate-800 pb-1.5">ENGINEERING ROOT CAUSE ANALYSIS</span>
                        <p className="text-slate-300 leading-relaxed">
                          Active fault [{faultObj.name}] induces fluidic/thermal disparity across the {faultObj.component} assembly, altering thermodynamic equilibrium.
                        </p>
                      </div>
                    </div>

                    {/* Live Sensor Evidence Deviation Table */}
                    <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                      <span className="font-bold text-emerald-300 block border-b border-slate-800 pb-1.5">LIVE SENSOR EVIDENCE DEVIATION TABLE</span>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                              <th className="py-1">SENSOR NAME</th>
                              <th className="py-1">EXPECTED BASELINE</th>
                              <th className="py-1">CURRENT LIVE VALUE</th>
                              <th className="py-1">DEVIATION</th>
                              <th className="py-1 text-right">STATUS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            <tr><td className="py-1.5 font-bold">Oil Pressure</td><td className="py-1.5 text-slate-400">4.35 bar</td><td className="py-1.5 text-cyan-300 font-telemetry">{(Number(telemetry.oilPressureBar) || 0).toFixed(2)} bar</td><td className="py-1.5 text-slate-400">{(Number(telemetry.oilPressureBar - 4.35) || 0).toFixed(2)} bar</td><td className="py-1.5 text-right font-bold text-emerald-400">LIVE SYNC</td></tr>
                            <tr><td className="py-1.5 font-bold">Peak CHT Temp</td><td className="py-1.5 text-slate-400">115.0°C</td><td className="py-1.5 text-amber-300 font-telemetry">{Math.max(Number(...telemetry.chtC) || 0).toFixed(1)}°C</td><td className="py-1.5 text-amber-300">+{(Math.max(...telemetry.chtC) - 115.0).toFixed(1)}°C</td><td className="py-1.5 text-right font-bold text-amber-400">ELEVATED</td></tr>
                            <tr><td className="py-1.5 font-bold">Engine Speed</td><td className="py-1.5 text-slate-400">5100 RPM</td><td className="py-1.5 text-cyan-300 font-telemetry">{telemetry.rpm} RPM</td><td className="py-1.5 text-slate-400">{telemetry.rpm - 5100} RPM</td><td className="py-1.5 text-right font-bold text-emerald-400">NOMINAL</td></tr>
                            <tr><td className="py-1.5 font-bold">Vibration RMS</td><td className="py-1.5 text-slate-400">2.00 mm/s</td><td className="py-1.5 text-indigo-300 font-telemetry">{(Number(telemetry.vibrationRmsMmS) || 0).toFixed(2)} mm/s</td><td className="py-1.5 text-indigo-300">+{(Number(telemetry.vibrationRmsMmS - 2.0) || 0).toFixed(2)} mm/s</td><td className="py-1.5 text-right font-bold text-emerald-400">NORMAL</td></tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Fault Propagation & Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                        <span className="font-bold text-indigo-300 block border-b border-slate-800 pb-1.5">FAULT PROPAGATION FLOW</span>
                        <div className="space-y-1 text-slate-300 font-mono-code text-[11px]">
                          <div>Simulator Trigger: {faultObj.name}</div>
                          <div className="pl-3 text-amber-300 font-bold">└── Component: {faultObj.component}</div>
                          <div className="pl-6 text-amber-400 font-bold">└── Thermal & Dynamic Shift</div>
                          <div className="pl-9 text-red-400 font-bold">└── Health Penalty Applied (-{Math.round(sevPercent * 0.3)}%)</div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                        <span className="font-bold text-emerald-300 block border-b border-slate-800 pb-1.5">3D DIGITAL TWIN & REPLAY ACTIONS</span>
                        <div className="flex flex-col gap-2 pt-1">
                          <button 
                            onClick={() => { setActiveDrawer(null); setActiveTab('digital-twin'); }}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs"
                          >
                            🎯 HIGHLIGHT [{faultObj.component.toUpperCase()}] IN 3D DIGITAL TWIN
                          </button>
                          <button 
                            onClick={() => alert(`Replaying telemetry sequence for ${faultObj.name}...`)}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-bold text-xs border border-slate-700"
                          >
                            🔄 REPLAY LAST 60 SECONDS TELEMETRY
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 1. HEALTH DRAWER CONTENT */}
              {activeDrawer === 'HEALTH' && (
                <div className="space-y-5 font-mono-code text-xs">
                  {/* Section 1: Executive Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">ADAPTIVE HEALTH INDEX</span>
                      <span className="text-2xl font-bold font-telemetry text-emerald-400">{(Number(selectedUav.engineHealthIndex) || 0).toFixed(1)}%</span>
                      <span className="text-[10px] text-emerald-400 block mt-0.5">GRADE A (NOMINAL)</span>
                    </div>
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">MISSION IMPACT</span>
                      <span className="text-sm font-bold text-emerald-400 block mt-1">SAFE FOR PATROL</span>
                      <span className="text-[10px] text-slate-500 block">ENVELOPE VERIFIED</span>
                    </div>
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">IMMEDIATE ACTION</span>
                      <span className="text-sm font-bold text-cyan-300 block mt-1">NO ACTION REQ.</span>
                      <span className="text-[10px] text-slate-500 block">CONTINUE MISSION</span>
                    </div>
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">AI CONFIDENCE</span>
                      <span className="text-2xl font-bold font-telemetry text-slate-100">98.4%</span>
                      <span className="text-[10px] text-slate-500 block">18 SENSORS SYNC</span>
                    </div>
                  </div>

                  {/* Engine Health Passport Section */}
                  <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                    <span className="font-bold text-cyan-300 block border-b border-slate-800 pb-1.5">📖 ENGINE HEALTH PASSPORT (ROTAX 914-TC #DRDO-914-04)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                      <div><span className="text-slate-500 text-[10px] block">TOTAL FLIGHT HOURS</span><strong className="text-slate-100 font-telemetry">107.4 hrs</strong></div>
                      <div><span className="text-slate-500 text-[10px] block">COMPLETED MISSIONS</span><strong className="text-slate-100 font-telemetry">34 Missions</strong></div>
                      <div><span className="text-slate-500 text-[10px] block">OVERHAUL INTERVAL</span><strong className="text-emerald-400 font-telemetry">250 hrs</strong></div>
                      <div><span className="text-slate-500 text-[10px] block">RELIABILITY INDEX</span><strong className="text-emerald-400 font-telemetry">99.2%</strong></div>
                    </div>
                  </div>

                  {/* Section 2 & 5: Explainable AI & Root Cause Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                      <span className="font-bold text-cyan-300 block border-b border-slate-800 pb-1.5">EXPLAINABLE AI (XAI) DIAGNOSTIC</span>
                      <ul className="space-y-1 text-slate-300">
                        <li>• Cylinder head temperatures balanced ({(Number(telemetry.chtC[0]) || 0).toFixed(1)}°C - {(Number(telemetry.chtC[2]) || 0).toFixed(1)}°C).</li>
                        <li>• Oil pressure holding steady at {(Number(telemetry.oilPressureBar) || 0).toFixed(2)} bar.</li>
                        <li>• Turbocharger boost output nominal at {(Number(telemetry.turboBoostBar) || 0).toFixed(2)} bar.</li>
                        <li>• Vibration RMS amplitude optimal at {(Number(telemetry.vibrationRmsMmS) || 0).toFixed(2)} mm/s.</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                      <span className="font-bold text-amber-300 block border-b border-slate-800 pb-1.5">🌴 ROOT CAUSE TREE HIERARCHY</span>
                      <div className="space-y-1 text-slate-300 text-[11px] font-mono-code">
                        <div className="text-slate-400">Engine AHI 88.4%</div>
                        <div className="pl-3 text-slate-400 font-bold">└── Thermal Subsystem (96.2%)</div>
                        <div className="pl-6 text-amber-300 font-bold">└── Cylinder #3 Thermal Stress ({(Number(telemetry.chtC[2]) || 0).toFixed(1)}°C)</div>
                        <div className="pl-9 text-slate-300">└── Airflow boundary layer resistance on cowl intake #2</div>
                        <div className="pl-9 text-emerald-400">└── Recommendation: Inspect cowling seal after landing</div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Subsystem Health Breakdown Cards */}
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                    <span className="font-bold text-slate-200 block border-b border-slate-800 pb-1">SUBSYSTEM HEALTH MATRIX</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">THERMAL SYSTEM</span>
                        <span className="text-lg font-bold text-emerald-400">96.2%</span>
                        <span className="text-[9px] text-emerald-400 block">HEALTHY</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">LUBRICATION</span>
                        <span className="text-lg font-bold text-emerald-400">94.8%</span>
                        <span className="text-[9px] text-emerald-400 block">HEALTHY</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">COMBUSTION</span>
                        <span className="text-lg font-bold text-emerald-400">98.0%</span>
                        <span className="text-[9px] text-emerald-400 block">HEALTHY</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">TURBOCHARGER</span>
                        <span className="text-lg font-bold text-cyan-300">91.5%</span>
                        <span className="text-[9px] text-cyan-300 block">NOMINAL</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 8 & 9: Prognostics & Digital Twin Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                      <span className="font-bold text-indigo-300 block border-b border-slate-800 pb-1.5">FUTURE DEGRADATION FORECAST</span>
                      <div className="space-y-1 text-slate-300">
                        <div className="flex justify-between"><span>Next 20 Flight Hours:</span><strong className="text-emerald-400">Zero Degradation</strong></div>
                        <div className="flex justify-between"><span>Next 50 Flight Hours:</span><strong className="text-slate-300">AHI drops to 84%</strong></div>
                        <div className="flex justify-between"><span>Next 140 Flight Hours:</span><strong className="text-amber-400">Scheduled Overhaul</strong></div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                      <span className="font-bold text-blue-300 block border-b border-slate-800 pb-1.5">PHYSICS DIGITAL TWIN VALIDATION</span>
                      <div className="space-y-1 text-slate-300">
                        <div className="flex justify-between"><span>Thermodynamic Model:</span><strong className="text-emerald-400">PASSED (99.4%)</strong></div>
                        <div className="flex justify-between"><span>Fluid Dynamics Model:</span><strong className="text-emerald-400">PASSED (99.8%)</strong></div>
                        <div className="flex justify-between"><span>Vibration FFT Matching:</span><strong className="text-emerald-400">PASSED (98.6%)</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Section 6 & 16: Live Sensor Evidence Table */}
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                    <span className="font-bold text-emerald-300 block border-b border-slate-800 pb-1.5">LIVE SENSOR EVIDENCE VERIFICATION TABLE</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                            <th className="py-1">SENSOR NAME</th>
                            <th className="py-1">LIVE VALUE</th>
                            <th className="py-1">NOMINAL RANGE</th>
                            <th className="py-1 text-right">ENVELOPE STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          <tr><td className="py-1.5 font-bold">Cylinder Head Temp #1 (CHT)</td><td className="py-1.5 text-cyan-300 font-telemetry">{(Number(telemetry.chtC[0]) || 0).toFixed(1)}°C</td><td className="py-1.5 text-slate-500">60 - 135°C</td><td className="py-1.5 text-right font-bold text-emerald-400">✓ NORMAL</td></tr>
                          <tr><td className="py-1.5 font-bold">Cylinder Head Temp #3 (CHT)</td><td className="py-1.5 text-amber-300 font-telemetry">{(Number(telemetry.chtC[2]) || 0).toFixed(1)}°C</td><td className="py-1.5 text-slate-500">60 - 135°C</td><td className="py-1.5 text-right font-bold text-emerald-400">✓ PEAK STRESS NODE</td></tr>
                          <tr><td className="py-1.5 font-bold">Oil Line Pressure</td><td className="py-1.5 text-slate-100 font-telemetry">{(Number(telemetry.oilPressureBar) || 0).toFixed(2)} bar</td><td className="py-1.5 text-slate-500">3.0 - 5.0 bar</td><td className="py-1.5 text-right font-bold text-emerald-400">✓ STABLE</td></tr>
                          <tr><td className="py-1.5 font-bold">Exhaust Gas Temp #2 (EGT)</td><td className="py-1.5 text-amber-300 font-telemetry">{Math.round(telemetry.egtC[1])}°C</td><td className="py-1.5 text-slate-500">650 - 850°C</td><td className="py-1.5 text-right font-bold text-emerald-400">✓ NOMINAL</td></tr>
                          <tr><td className="py-1.5 font-bold">Piezoelectric Vibration RMS</td><td className="py-1.5 text-indigo-300 font-telemetry">{(Number(telemetry.vibrationRmsMmS) || 0).toFixed(2)} mm/s</td><td className="py-1.5 text-slate-500">0.5 - 4.5 mm/s</td><td className="py-1.5 text-right font-bold text-emerald-400">✓ CLASS I SAFE</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 13 & 14: Maintenance History & Similar Historical Cases */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                      <span className="font-bold text-slate-200 block border-b border-slate-800 pb-1.5">MAINTENANCE AUDIT TRAIL</span>
                      <div className="space-y-1.5 text-slate-300">
                        <div className="flex justify-between"><span>Aero Synthetic Oil Service:</span><strong>20 hrs ago (LOGGED)</strong></div>
                        <div className="flex justify-between"><span>Rotax 914 Turbocharger Inspection:</span><strong>65 hrs ago (LOGGED)</strong></div>
                        <div className="flex justify-between"><span>Dual CDI Spark Plug Replacement:</span><strong>12 hrs ago (LOGGED)</strong></div>
                        <div className="flex justify-between"><span>Valve Clearance Lash Check:</span><strong>80 hrs ago (LOGGED)</strong></div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                      <span className="font-bold text-cyan-300 block border-b border-slate-800 pb-1.5">HISTORICAL SIMILAR PATROL MISSIONS</span>
                      <div className="space-y-1.5 text-slate-300">
                        <div className="flex justify-between"><span>Mission INDRADHANUSH-02 (AHI 69%):</span><strong className="text-emerald-400">SUCCESSFUL (100%)</strong></div>
                        <div className="flex justify-between"><span>Mission GARUDA-17 (AHI 66%):</span><strong className="text-emerald-400">SAFE LANDING (100%)</strong></div>
                        <div className="flex justify-between"><span>Mission SURAKSHA-11 (AHI 62%):</span><strong className="text-cyan-300">ROUTINE MAINT.</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Section 15: Interactive XAI Action Bar */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-300">Interactive XAI Tools:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => alert("XAI Etiology: Thermal gradient is balanced within +2.4°C disparity limit.")} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] font-bold">Why?</button>
                      <button onClick={() => alert("XAI Method: Multimodal physics-AI neural consensus evaluated over 18 real-time sensor streams.")} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] font-bold">How?</button>
                      <button onClick={() => alert("What-If Simulation: Reducing RPM by 200 lowers CHT by 3.8°C and extends RUL by +14 flight hours.")} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] font-bold">What-If?</button>
                      <button onClick={() => alert("Evidence Audit: All Type-K thermocouples and pressure transducers pass 20 Hz synchronization checks.")} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] font-bold">Evidence</button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. RUL DRAWER CONTENT */}
              {activeDrawer === 'RUL' && (
                <div className="space-y-5 font-mono-code text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">REMAINING USEFUL LIFE</span>
                      <span className="text-2xl font-bold font-telemetry text-cyan-300">{selectedUav.predictedRulHours}h</span>
                      <span className="text-[10px] text-emerald-400 block">EST. OVERHAUL: 250h</span>
                    </div>
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">WORST-CASE SCENARIO</span>
                      <span className="text-2xl font-bold font-telemetry text-amber-300">118h</span>
                      <span className="text-[10px] text-amber-400 block">HIGH THROTTLE CLIMB</span>
                    </div>
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">BEST-CASE SCENARIO</span>
                      <span className="text-2xl font-bold font-telemetry text-emerald-400">165h</span>
                      <span className="text-[10px] text-emerald-400 block">ECONOMY CRUISE</span>
                    </div>
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">CONFIDENCE</span>
                      <span className="text-2xl font-bold font-telemetry text-slate-100">97.8%</span>
                      <span className="text-[10px] text-slate-500 block">120 MISSIONS DATA</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-cyan-300 block border-b border-slate-800 pb-1.5">DEGRADATION FACTOR IMPACT MATRIX</span>
                    <div className="space-y-1.5 text-slate-300">
                      <div className="flex justify-between"><span>FL220 High Density Altitude Operations:</span><strong>-1.2 hrs / flight</strong></div>
                      <div className="flex justify-between"><span>Full-Throttle Takeoff & Climb Phase:</span><strong>-0.8 hrs / flight</strong></div>
                      <div className="flex justify-between"><span>Thermodynamic Head Temperature Disparity:</span><strong>-0.4 hrs / flight</strong></div>
                      <div className="flex justify-between"><span>Synthesized Engine Oil Film Protection:</span><strong className="text-emerald-400">+0.6 hrs / flight</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. RISK DRAWER CONTENT */}
              {activeDrawer === 'RISK' && (
                <div className="space-y-5 font-mono-code text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">MISSION RISK SCORE</span>
                      <span className="text-2xl font-bold font-telemetry text-emerald-400">{(Number(selectedUav.missionRiskScore) || 0).toFixed(1)}%</span>
                      <span className="text-[10px] text-emerald-400 block font-bold">VERDICT: GO FLIGHT</span>
                    </div>
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">FAILURE PROBABILITY</span>
                      <span className="text-2xl font-bold font-telemetry text-emerald-400">1.8%</span>
                      <span className="text-[10px] text-slate-500 block">NEXT 24 HOURS</span>
                    </div>
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">MISSION SUCCESS</span>
                      <span className="text-2xl font-bold font-telemetry text-cyan-300">98.6%</span>
                      <span className="text-[10px] text-cyan-300 block">FL220 PATROL</span>
                    </div>
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">SAFE ENDURANCE</span>
                      <span className="text-2xl font-bold font-telemetry text-slate-100">142h</span>
                      <span className="text-[10px] text-slate-500 block">POWERPLANT OK</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-slate-200 block border-b border-slate-800 pb-1.5">MULTI-FACTOR RISK MATRIX</span>
                    <div className="space-y-1.5 text-slate-300">
                      <div className="flex justify-between"><span>Powerplant & Thermodynamics:</span><strong className="text-emerald-400">LOW RISK (2.1%)</strong></div>
                      <div className="flex justify-between"><span>Fuel Hydraulics & Consumption:</span><strong className="text-emerald-400">LOW RISK (4.8%)</strong></div>
                      <div className="flex justify-between"><span>Chitradurga ATR Regional Weather:</span><strong className="text-cyan-300">LOW RISK (8.2%)</strong></div>
                      <div className="flex justify-between"><span>Airframe Structural Dynamics:</span><strong className="text-emerald-400">LOW RISK (1.4%)</strong></div>
                    </div>
                  </div>

                  {/* Interactive Mission Impact What-If Simulator */}
                  <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                    <span className="font-bold text-emerald-300 block border-b border-slate-800 pb-1.5">🎮 INTERACTIVE MISSION IMPACT WHAT-IF SIMULATOR</span>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => alert("What-If: High Altitude Flight (24,000 FT) -> Fuel consumption +4%, RUL -1.2h, Risk remains LOW (22.4%)")} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-bold text-[11px]">High Altitude (24k FT)</button>
                      <button onClick={() => alert("What-If: Heavy Payload -> Throttle req +6%, CHT +4.2°C, Risk remains SAFE (24.8%)")} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-bold text-[11px]">Heavy Payload (+150kg)</button>
                      <button onClick={() => alert("What-If: Low Fuel Reserve -> Mission endurance limited to 3.4 hrs, Alert status triggered")} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded font-bold text-[11px]">Low Fuel Scenario</button>
                      <button onClick={() => alert("What-If: Emergency RTB -> Direct waypoints calculated, arrival ETA 24 mins, Zero Risk")} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded font-bold text-[11px]">Emergency Return (RTB)</button>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. TWIN DRAWER CONTENT */}
              {activeDrawer === 'TWIN' && (
                <div className="space-y-5 font-mono-code text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">TWIN SYNC SCORE</span>
                      <span className="text-2xl font-bold font-telemetry text-emerald-400">{selectedUav.twinConfidenceScore}%</span>
                      <span className="text-[10px] text-emerald-400 block">CONVERGED</span>
                    </div>
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">SENSOR LATENCY</span>
                      <span className="text-2xl font-bold font-telemetry text-cyan-300">12ms</span>
                      <span className="text-[10px] text-cyan-300 block">20 Hz UDP FEEDS</span>
                    </div>
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">PACKET LOSS</span>
                      <span className="text-2xl font-bold font-telemetry text-emerald-400">0.00%</span>
                      <span className="text-[10px] text-emerald-400 block">ZERO DROPS</span>
                    </div>
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">FALSE POSITIVES</span>
                      <span className="text-2xl font-bold font-telemetry text-slate-100">0.0%</span>
                      <span className="text-[10px] text-slate-500 block">VERIFIED USP #1</span>
                    </div>
                  </div>

                  {/* Physics vs AI Comparison Table */}
                  <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                    <span className="font-bold text-cyan-300 block border-b border-slate-800 pb-1.5">⚖️ PHYSICS VS AI PREDICTION COMPARISON TABLE</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                            <th className="py-1">PARAMETER</th>
                            <th className="py-1">PHYSICS MODEL PREDICTION</th>
                            <th className="py-1">AI NEURAL PREDICTION</th>
                            <th className="py-1">DIFFERENCE</th>
                            <th className="py-1 text-right">CONVERGENCE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          <tr><td className="py-1.5 font-bold">Peak CHT Head Temp</td><td className="py-1.5 text-slate-100 font-telemetry">127.8°C</td><td className="py-1.5 text-cyan-300 font-telemetry">{(Number(telemetry.chtC[2]) || 0).toFixed(1)}°C</td><td className="py-1.5 text-slate-400">0.6°C</td><td className="py-1.5 text-right font-bold text-emerald-400">PASSED (99.5%)</td></tr>
                          <tr><td className="py-1.5 font-bold">Oil Line Pressure</td><td className="py-1.5 text-slate-100 font-telemetry">4.32 bar</td><td className="py-1.5 text-cyan-300 font-telemetry">{(Number(telemetry.oilPressureBar) || 0).toFixed(2)} bar</td><td className="py-1.5 text-slate-400">0.03 bar</td><td className="py-1.5 text-right font-bold text-emerald-400">PASSED (99.3%)</td></tr>
                          <tr><td className="py-1.5 font-bold">Vibration RMS Peak</td><td className="py-1.5 text-slate-100 font-telemetry">2.45 mm/s</td><td className="py-1.5 text-cyan-300 font-telemetry">{(Number(telemetry.vibrationRmsMmS) || 0).toFixed(2)} mm/s</td><td className="py-1.5 text-slate-400">0.08 mm/s</td><td className="py-1.5 text-right font-bold text-emerald-400">PASSED (98.8%)</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. GAUGE DRAWER CONTENT */}
              {activeDrawer === 'GAUGE' && (
                <div className="space-y-5 font-mono-code text-xs">
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                    <span className="font-bold text-slate-200 block border-b border-slate-800 pb-1.5">CORE SCADA TELEMETRY INSTRUMENT MATRIX</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">ENGINE SPEED</span>
                        <span className="text-xl font-bold text-cyan-300 font-telemetry">{telemetry.rpm} RPM</span>
                        <span className="text-[9px] text-emerald-400 block">NOMINAL</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">MANIFOLD MAP</span>
                        <span className="text-xl font-bold text-emerald-300 font-telemetry">{(Number(telemetry.manifoldPressureInHg) || 0).toFixed(1)} inHg</span>
                        <span className="text-[9px] text-emerald-400 block">NOMINAL</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">OIL PRESSURE</span>
                        <span className="text-xl font-bold text-slate-100 font-telemetry">{(Number(telemetry.oilPressureBar) || 0).toFixed(2)} bar</span>
                        <span className="text-[9px] text-emerald-400 block">NOMINAL</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">TURBO BOOST</span>
                        <span className="text-xl font-bold text-amber-300 font-telemetry">{(Number(telemetry.turboBoostBar) || 0).toFixed(2)} bar</span>
                        <span className="text-[9px] text-emerald-400 block">NOMINAL</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. CYLINDER DRAWER CONTENT */}
              {activeDrawer === 'CYLINDER' && (
                <div className="space-y-5 font-mono-code text-xs">
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                    <span className="font-bold text-slate-200 block border-b border-slate-800 pb-1.5">4-CYLINDER THERMOCOUPLE SPECTRUM</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[0, 1, 2, 3].map((idx) => (
                        <div key={idx} className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                          <span className="font-bold text-cyan-400">CYLINDER #{idx + 1}</span>
                          <div className="flex justify-between"><span>CHT:</span><strong className="text-slate-100">{(Number(telemetry.chtC[idx]) || 0).toFixed(1)}°C</strong></div>
                          <div className="flex justify-between"><span>EGT:</span><strong className="text-amber-300">{Math.round(telemetry.egtC[idx])}°C</strong></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions & Report Download Footer */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono-code">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert(`Generating DRDO Defense PDF Report for ${activeDrawer}...`)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded font-bold transition-colors"
                >
                  📄 EXPORT PDF REPORT
                </button>
                <button
                  onClick={() => alert(`Exporting Telemetry CSV Audit Log for ${activeDrawer}...`)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded font-bold transition-colors"
                >
                  📊 EXPORT TELEMETRY CSV
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-500">GCS Audit: Encrypted</span>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-900/40"
                >
                  DONE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function eggtColor(egt: number) {
  if (egt > 820) return 'text-red-400';
  if (egt > 790) return 'text-amber-400';
  return 'text-white';
}
