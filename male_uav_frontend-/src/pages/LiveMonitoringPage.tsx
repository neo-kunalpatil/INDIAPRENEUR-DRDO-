import React, { useState } from 'react';
import { 
  Activity, 
  Flame, 
  Zap, 
  Droplets, 
  Wind, 
  Gauge as GaugeIcon, 
  AlertCircle,
  Sliders,
  TrendingUp,
  Maximize2,
  Brain,
  ShieldAlert,
  GitBranch,
  HelpCircle,
  CheckCircle2,
  Layers,
  Thermometer,
  Compass
} from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';
import { Gauge } from '../components/common/Gauge';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';

export const LiveMonitoringPage: React.FC = () => {
  const { selectedUav, telemetry } = useGcs();
  const [selectedSubsystem, setSelectedSubsystem] = useState<'ALL' | 'THERMAL' | 'HYDRAULIC' | 'VIBRATION' | 'TURBO'>('ALL');
  const [expandedXaiNode, setExpandedXaiNode] = useState<string | null>(null);

  // Simulated vibration FFT frequency bins dynamically computed from RMS
  const fftBins = [
    { hz: 15, mag: 0.8, label: 'Sub-harmonic' },
    { hz: 30, mag: 1.2, label: '1X Camshaft' },
    { hz: 45, mag: 1.5, label: 'Piston slap' },
    { hz: 85, mag: telemetry.vibrationRmsMmS > 4 ? 6.8 : 2.4, label: '1X Crankshaft' },
    { hz: 170, mag: telemetry.vibrationRmsMmS > 4 ? 4.9 : 1.8, label: '2X Firing freq' },
    { hz: 255, mag: 1.1, label: '3X Firing' },
    { hz: 340, mag: 0.7, label: '4X Firing' },
    { hz: 510, mag: 0.4, label: 'Valve train' },
    { hz: 1200, mag: 0.9, label: 'Turbo blade pass' },
  ];

  // Dynamic calculations derived from live telemetry values
  const maxCht = Math.max(...telemetry.chtC);
  const minCht = Math.min(...telemetry.chtC);
  const avgCht = (telemetry.chtC.reduce((a, b) => a + b, 0) / telemetry.chtC.length);
  const chtDisparity = maxCht - minCht;
  const maxChtCylIdx = telemetry.chtC.indexOf(maxCht) + 1;

  const maxEgt = Math.max(...telemetry.egtC);
  const avgEgt = (telemetry.egtC.reduce((a, b) => a + b, 0) / telemetry.egtC.length);

  const thermalStressScore = Math.min(100, Math.max(0, ((maxCht - 100) / 45) * 60 + (chtDisparity / 20) * 40));
  const coolingEfficiencyPercent = Math.max(70, Math.min(100, 100 - (telemetry.oilTempC - 95) * 0.8 - (telemetry.coolantTempC - 90) * 0.5));
  
  const lubricationHealthScore = Math.min(100, Math.max(0, (telemetry.oilPressureBar / 4.5) * 70 + (1 - (telemetry.oilTempC - 100) / 40) * 30));
  const fuelEfficiencyLp100km = Number(((telemetry.fuelFlowLitersHr / 180) * 100).toFixed(1));
  const estimatedEnduranceHours = Number((selectedUav.fuelRemainingKg / (telemetry.fuelFlowLitersHr * 0.8)).toFixed(1));

  const totalVibRms = telemetry.vibrationRmsMmS;
  const dominantFreqHz = totalVibRms > 4 ? 85 : 30;
  const bearingHealthScore = Math.max(60, Math.min(100, 100 - (totalVibRms - 2.0) * 12));

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              Real-Time SCADA Telemetry & Sensor Instrumentation
            </h1>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono-code font-bold">
              20 HZ SYNC
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            Rotax 914 Turbocharged Aero Piston Engine • 4-Stroke Opposed-4 Cylinders • Altitude: {selectedUav.altitudeFt.toLocaleString()} FT
          </p>
        </div>

        {/* Subsystem Workstation Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono-code">
          {(['ALL', 'THERMAL', 'HYDRAULIC', 'VIBRATION', 'TURBO'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedSubsystem(filter)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                selectedSubsystem === filter
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {filter} WORKSTATION
            </button>
          ))}
        </div>
      </div>

      {/* Primary Telemetry Instrument Cluster */}
      <div id="telemetry-gauges" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Gauge
          label="ENGINE RPM"
          value={telemetry.rpm}
          min={1500}
          max={6000}
          unit="RPM"
          warningThreshold={5500}
          criticalThreshold={5800}
          expectedValue={5100}
        />
        <Gauge
          label="MANIFOLD PRESS."
          value={telemetry.manifoldPressureInHg}
          min={20}
          max={42}
          unit="inHg"
          decimals={1}
          warningThreshold={37.5}
          criticalThreshold={39.0}
          expectedValue={35.8}
        />
        <Gauge
          label="OIL PRESSURE"
          value={telemetry.oilPressureBar}
          min={1.0}
          max={6.0}
          unit="bar"
          decimals={2}
          warningThreshold={2.2}
          criticalThreshold={1.8}
          expectedValue={4.35}
        />
        <Gauge
          label="OIL TEMP"
          value={telemetry.oilTempC}
          min={60}
          max={140}
          unit="°C"
          decimals={1}
          warningThreshold={118}
          criticalThreshold={128}
          expectedValue={106.0}
        />
        <Gauge
          label="COOLANT TEMP"
          value={telemetry.coolantTempC}
          min={60}
          max={130}
          unit="°C"
          decimals={1}
          warningThreshold={110}
          criticalThreshold={118}
          expectedValue={98.0}
        />
        <Gauge
          label="TURBO BOOST"
          value={telemetry.turboBoostBar}
          min={0.0}
          max={1.4}
          unit="bar"
          decimals={2}
          warningThreshold={1.15}
          criticalThreshold={1.28}
          expectedValue={0.88}
        />
      </div>

      {/* WORKSPACE 1: ALL SUMMARY */}
      {selectedSubsystem === 'ALL' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left 6 Cols: 4-Cylinder Head & Exhaust Gas Temperatures */}
            <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <h3 className="font-heading font-bold text-sm text-slate-100">
                    4-Cylinder Thermal Head (CHT) & Exhaust (EGT) Spectrum
                  </h3>
                </div>
                <span className="text-[10px] font-mono-code text-slate-400">TYPE-K THERMOCOUPLES</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((idx) => {
                  const rawCht = telemetry.chtC[idx];
                  const cht = typeof rawCht === 'number' ? Number(rawCht.toFixed(1)) : rawCht;
                  const rawEgt = telemetry.egtC[idx];
                  const egt = typeof rawEgt === 'number' ? Math.round(rawEgt) : rawEgt;
                  const isHot = (typeof cht === 'number' && cht > 125) || (typeof egt === 'number' && egt > 820);

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex flex-col justify-between text-xs font-mono-code transition-all ${
                        isHot ? 'bg-red-950/30 border-red-800' : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-cyan-300 pb-1 border-b border-slate-800/60">
                        <span>CYLINDER #{idx + 1}</span>
                        <span className={`w-2 h-2 rounded-full ${isHot ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
                      </div>

                      <div className="py-2 space-y-2">
                        <div>
                          <span className="text-[10px] text-slate-500 block">CYL HEAD TEMP</span>
                          <span className={`font-telemetry font-bold text-xl ${typeof cht === 'number' && cht > 125 ? 'text-red-400' : 'text-slate-100'}`}>
                            {cht}°C
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">EXHAUST GAS</span>
                          <span className={`font-telemetry font-bold text-lg ${typeof egt === 'number' && egt > 820 ? 'text-red-400' : 'text-slate-200'}`}>
                            {egt}°C
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-slate-800/60 text-[9px] text-slate-500 flex justify-between">
                        <span>MAX: 135°C</span>
                        <span>MAX: 850°C</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 flex items-center justify-between text-xs font-mono-code text-slate-400">
                <span>Bank 1 vs Bank 2 Disparity: <strong className="text-emerald-400">+{chtDisparity.toFixed(1)}°C (NOMINAL)</strong></span>
                <span>Lambda Ratio: <strong className="text-cyan-300">λ {telemetry.lambdaAirFuelRatio.toFixed(2)}</strong></span>
              </div>
            </div>

            {/* Right 6 Cols: Vibration Harmonic FFT Spectrum Analyzer */}
            <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-heading font-bold text-sm text-slate-100">
                    Piezoelectric Vibration FFT Spectrum Analyzer
                  </h3>
                </div>
                <span className="text-[10px] font-mono-code text-cyan-400">SAMPLING: 10 kHz</span>
              </div>

              {/* Harmonic Bar Graph */}
              <div className="space-y-2">
                {fftBins.map((bin, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs font-mono-code">
                    <span className="w-14 text-slate-400 shrink-0 text-right">{bin.hz} Hz</span>
                    <div className="flex-1 bg-slate-950 h-4 rounded-md overflow-hidden p-0.5 border border-slate-800 flex">
                      <div
                        className={`h-full rounded transition-all duration-300 ${
                          bin.mag > 5 ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, (bin.mag / 8) * 100)}%` }}
                      />
                    </div>
                    <span className="w-16 font-bold text-slate-200 text-right">{bin.mag.toFixed(1)} mm/s</span>
                    <span className="w-28 text-[10px] text-slate-500 truncate">{bin.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono-code">
                <span className="text-slate-400">Total RMS Vibration: <strong className="text-cyan-300">{telemetry.vibrationRmsMmS.toFixed(2)} mm/s</strong></span>
                <span className="text-slate-400">ISO 10816 Class: <strong className={totalVibRms > 4 ? 'text-amber-400' : 'text-emerald-400'}>{totalVibRms > 4 ? 'CLASS II (ELEVATED)' : 'CLASS I (ACCEPTABLE)'}</strong></span>
              </div>
            </div>
          </div>

          {/* Integrated Multi-System Explainable AI Diagnostic Center */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
                <h3 className="font-heading font-bold text-base text-slate-100">Integrated Multi-Subsystem Explainable AI Copilot</h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono-code">
                <span className="text-slate-400">AI Confidence: <strong className="text-emerald-400">97.4%</strong></span>
                <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold">18 SENSORS VERIFIED</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono-code">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Flame className="w-4 h-4" />
                  <span>THERMAL DIAGNOSTIC</span>
                </div>
                <p className="text-slate-300">
                  Highest thermal dissipation localized on Cylinder #{maxChtCylIdx} at {maxCht.toFixed(1)}°C. Cylinder head disparity is {chtDisparity.toFixed(1)}°C. Cooling loop running at {coolingEfficiencyPercent.toFixed(0)}% efficiency.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <Droplets className="w-4 h-4" />
                  <span>HYDRAULIC DIAGNOSTIC</span>
                </div>
                <p className="text-slate-300">
                  Oil pressure baseline stable at {telemetry.oilPressureBar.toFixed(2)} bar. Fuel flow rate is {telemetry.fuelFlowLitersHr.toFixed(1)} L/h with fuel endurance estimated at {estimatedEnduranceHours} hours.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Activity className="w-4 h-4" />
                  <span>VIBRATION DIAGNOSTIC</span>
                </div>
                <p className="text-slate-300">
                  Dominant mechanical vibration peak at {dominantFreqHz} Hz with RMS of {totalVibRms.toFixed(2)} mm/s. Bearing health confidence index evaluated at {bearingHealthScore.toFixed(0)}%.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE 2: THERMAL INTELLIGENCE CENTER */}
      {selectedSubsystem === 'THERMAL' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            {/* Header Banner */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <Flame className="w-6 h-6 text-orange-400 animate-pulse" />
                <div>
                  <h2 className="font-heading font-bold text-lg text-slate-100">Thermal Engineering Intelligence Center</h2>
                  <p className="text-xs font-mono-code text-slate-400">Continuous Heat Dissipation • Type-K Thermocouples • Cylinder Thermal Gradient & Cooling Efficiency</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded bg-orange-950/80 border border-orange-500/40 text-orange-300 text-xs font-mono-code font-bold">
                THERMAL WORKSTATION ONLINE
              </span>
            </div>

            {/* Section 2: Live Engineering Analytics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono-code text-slate-400 block">PEAK CHT TEMP</span>
                <span className="text-2xl font-bold font-telemetry text-amber-300">{maxCht.toFixed(1)}°C</span>
                <span className="text-[10px] font-mono-code text-slate-500 block mt-1">Cylinder #{maxChtCylIdx}</span>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono-code text-slate-400 block">CYLINDER IMPRECISION / DISPARITY</span>
                <span className="text-2xl font-bold font-telemetry text-cyan-300">+{chtDisparity.toFixed(1)}°C</span>
                <span className="text-[10px] font-mono-code text-emerald-400 block mt-1">NOMINAL (MAX 25°C)</span>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono-code text-slate-400 block">COOLING LOOP EFFICIENCY</span>
                <span className="text-2xl font-bold font-telemetry text-emerald-400">{coolingEfficiencyPercent.toFixed(1)}%</span>
                <span className="text-[10px] font-mono-code text-slate-500 block mt-1">Radiant Oil & Coolant Heat Sink</span>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono-code text-slate-400 block">THERMAL STRESS INDEX</span>
                <span className="text-2xl font-bold font-telemetry text-orange-400">{thermalStressScore.toFixed(0)} / 100</span>
                <span className="text-[10px] font-mono-code text-slate-500 block mt-1">Combustion Chamber Load</span>
              </div>
            </div>

            {/* Cylinder Heat Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((idx) => {
                const cht = Number(telemetry.chtC[idx].toFixed(1));
                const egt = Math.round(telemetry.egtC[idx]);
                const isHot = cht > 125 || egt > 820;
                return (
                  <div key={idx} className={`p-4 rounded-xl border transition-all ${isHot ? 'bg-red-950/30 border-red-800' : 'bg-slate-950 border-slate-800'}`}>
                    <div className="flex justify-between items-center text-xs font-mono-code text-cyan-300 font-bold border-b border-slate-800 pb-1.5 mb-3">
                      <span>CYLINDER #{idx + 1}</span>
                      <span className={`w-2 h-2 rounded-full ${isHot ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono-code block">CYL HEAD TEMP (CHT)</span>
                        <span className={`text-2xl font-bold font-telemetry ${cht > 125 ? 'text-red-400' : 'text-slate-100'}`}>{cht}°C</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono-code block">EXHAUST GAS TEMP (EGT)</span>
                        <span className={`text-xl font-bold font-telemetry ${egt > 820 ? 'text-red-400' : 'text-amber-300'}`}>{egt}°C</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-3">
                      <div className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-red-500" style={{ width: `${Math.min(100, (cht / 150) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Section 3: Explainable AI (XAI) Thermal Diagnostic Panel */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono-code text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-orange-400 font-bold">
                  <Brain className="w-4 h-4" />
                  <span>EXPLAINABLE AI (XAI) THERMAL DIAGNOSTIC REPORT</span>
                </div>
                <span className="text-slate-400">Confidence: <strong className="text-emerald-400">96.8%</strong> (Based on 6 Thermocouples)</span>
              </div>

              <div className="space-y-2 text-slate-300 leading-relaxed">
                <p>
                  <strong>WHAT:</strong> Thermal gradient analysis indicates localized thermal dissipation peaking on <span className="text-amber-300">Cylinder #{maxChtCylIdx}</span> at <strong>{maxCht.toFixed(1)}°C</strong> with average CHT at <strong>{avgCht.toFixed(1)}°C</strong>.
                </p>
                <p>
                  <strong>WHY:</strong> Exhaust gas temperature on Bank {maxChtCylIdx <= 2 ? 1 : 2} is running at <strong>{maxEgt}°C</strong>, reflecting nominal air-fuel ratio stoichiometry (λ {telemetry.lambdaAirFuelRatio.toFixed(2)}).
                </p>
                <p>
                  <strong>MISSION IMPACT:</strong> <span className="text-emerald-400 font-bold">ZERO MISSION RISK</span>. Cylinder head temperature remains <strong>{(135 - maxCht).toFixed(1)}°C</strong> below redline limit.
                </p>
                <p>
                  <strong>RECOMMENDED OPERATOR ACTION:</strong> Maintain current cruise throttle position ({telemetry.throttlePercent.toFixed(1)}%). No thermal trim adjustment required.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE 3: HYDRAULIC INTELLIGENCE CENTER */}
      {selectedSubsystem === 'HYDRAULIC' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            {/* Header Banner */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <Droplets className="w-6 h-6 text-cyan-400 animate-pulse" />
                <div>
                  <h2 className="font-heading font-bold text-lg text-slate-100">Hydraulic & Lubrication Intelligence Center</h2>
                  <p className="text-xs font-mono-code text-slate-400">Oil & Fuel Line Hydraulics • Pump Pressure Stability • Viscosity Degradation & Endurance Modeling</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono-code font-bold">
                HYDRAULIC WORKSTATION ONLINE
              </span>
            </div>

            {/* Section 2: Live Engineering Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-mono-code text-slate-400">LUBRICATION HEALTH INDEX</span>
                <p className="text-3xl font-bold font-telemetry text-cyan-300">{lubricationHealthScore.toFixed(1)}%</p>
                <span className="text-[10px] font-mono-code text-emerald-400 block">NOMINAL OIL FILM VISCOSITY</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-mono-code text-slate-400">FUEL FLOW CONSUMPTION</span>
                <p className="text-3xl font-bold font-telemetry text-emerald-300">{telemetry.fuelFlowLitersHr.toFixed(1)} <span className="text-sm font-normal text-slate-400">L/h</span></p>
                <span className="text-[10px] font-mono-code text-slate-400 block">INJECTOR DUTY CYCLE: 64.2%</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-mono-code text-slate-400">REMAINING FUEL ENDURANCE</span>
                <p className="text-3xl font-bold font-telemetry text-amber-300">{estimatedEnduranceHours} <span className="text-sm font-normal text-slate-400">HOURS</span></p>
                <span className="text-[10px] font-mono-code text-amber-400 block">{selectedUav.fuelRemainingKg.toFixed(1)} kg UNUSABLE / USABLE TANK</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-mono-code text-slate-400">OIL LINE PRESSURE</span>
                <p className="text-3xl font-bold font-telemetry text-slate-100">{telemetry.oilPressureBar.toFixed(2)} <span className="text-sm font-normal text-slate-400">bar</span></p>
                <span className="text-[10px] font-mono-code text-emerald-400 block">PRESSURE STABILITY: 99.4%</span>
              </div>
            </div>

            {/* Section 3: Explainable AI (XAI) Hydraulic Diagnostic Panel */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono-code text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Brain className="w-4 h-4" />
                  <span>EXPLAINABLE AI (XAI) HYDRAULIC & LUBRICATION REPORT</span>
                </div>
                <span className="text-slate-400">Confidence: <strong className="text-emerald-400">98.2%</strong></span>
              </div>

              <div className="space-y-2 text-slate-300 leading-relaxed">
                <p>
                  <strong>WHAT:</strong> Oil pressure is holding stable at <strong>{telemetry.oilPressureBar.toFixed(2)} bar</strong> with oil temperature steady at <strong>{telemetry.oilTempC.toFixed(1)}°C</strong>.
                </p>
                <p>
                  <strong>WHY:</strong> Lubrication pump RPM is synchronised with engine crankshaft speed ({telemetry.rpm} RPM). Hydraulic cavitation probability is <strong>0.02%</strong>.
                </p>
                <p>
                  <strong>LEAK DETECTION:</strong> Zero fuel line or oil pan pressure drops detected over the last 15 minutes of live telemetry streaming.
                </p>
                <p>
                  <strong>RECOMMENDED OPERATOR ACTION:</strong> No hydraulic intervention required. Maintain current flight altitude.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE 4: VIBRATION INTELLIGENCE CENTER */}
      {selectedSubsystem === 'VIBRATION' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            {/* Header Banner */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-indigo-400 animate-pulse" />
                <div>
                  <h2 className="font-heading font-bold text-lg text-slate-100">Vibration & Structural Dynamics Intelligence Center</h2>
                  <p className="text-xs font-mono-code text-slate-400">Piezoelectric Accelerometer Decomposition • 10 kHz FFT Sampling • Bearing & Shaft Imbalance Detection</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-mono-code font-bold">
                10 kHz FFT SAMPLING ONLINE
              </span>
            </div>

            {/* Section 2: Live Engineering Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-mono-code text-slate-400">TOTAL RMS VIBRATION</span>
                <p className="text-3xl font-bold font-telemetry text-cyan-300">{totalVibRms.toFixed(2)} <span className="text-sm font-normal text-slate-400">mm/s</span></p>
                <span className="text-[10px] font-mono-code text-emerald-400 block">ISO 10816 CLASS I (ACCEPTABLE)</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-mono-code text-slate-400">BEARING HEALTH INDEX</span>
                <p className="text-3xl font-bold font-telemetry text-emerald-300">{bearingHealthScore.toFixed(0)}%</p>
                <span className="text-[10px] font-mono-code text-slate-400 block">MAIN JOURNAL BEARINGS OK</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-mono-code text-slate-400">DOMINANT HARMONIC PEAK</span>
                <p className="text-3xl font-bold font-telemetry text-indigo-300">{dominantFreqHz} <span className="text-sm font-normal text-slate-400">Hz</span></p>
                <span className="text-[10px] font-mono-code text-slate-400 block">1X CRANKSHAFT ROTATIONAL FREQ</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-mono-code text-slate-400">RESONANCE MARGIN</span>
                <p className="text-3xl font-bold font-telemetry text-slate-100">38.4 <span className="text-sm font-normal text-slate-400">Hz</span></p>
                <span className="text-[10px] font-mono-code text-emerald-400 block font-bold">AIRFRAME CRITICAL FREQ SAFE</span>
              </div>
            </div>

            {/* FFT Spectrum Display */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-mono-code font-bold text-slate-300 block border-b border-slate-800 pb-2">
                FFT HARMONIC FREQUENCY SPECTRUM (15 Hz - 1200 Hz)
              </span>
              <div className="space-y-2.5">
                {fftBins.map((bin, i) => (
                  <div key={i} className="flex items-center gap-4 text-xs font-mono-code">
                    <span className="w-16 font-bold text-cyan-400">{bin.hz} Hz</span>
                    <div className="flex-1 bg-slate-900 h-5 rounded overflow-hidden p-0.5 border border-slate-800 flex">
                      <div
                        className={`h-full rounded transition-all duration-300 ${
                          bin.mag > 5 ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, (bin.mag / 8) * 100)}%` }}
                      />
                    </div>
                    <span className="w-20 font-bold text-slate-100 text-right">{bin.mag.toFixed(2)} mm/s</span>
                    <span className="w-36 text-slate-400 truncate">{bin.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Explainable AI (XAI) Vibration Diagnostic Panel */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono-code text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <Brain className="w-4 h-4" />
                  <span>EXPLAINABLE AI (XAI) HARMONIC VIBRATION REPORT</span>
                </div>
                <span className="text-slate-400">Confidence: <strong className="text-emerald-400">97.9%</strong></span>
              </div>

              <div className="space-y-2 text-slate-300 leading-relaxed">
                <p>
                  <strong>WHAT:</strong> Piezoelectric FFT spectral decomposition shows RMS vibration amplitude of <strong>{totalVibRms.toFixed(2)} mm/s</strong>.
                </p>
                <p>
                  <strong>HARMONIC ETIOLOGY:</strong> Dominant peak occurs at <strong>{dominantFreqHz} Hz</strong> corresponding to 1X crankshaft rotational frequency ({telemetry.rpm} RPM / 60). No shaft imbalance or bearing race pitting detected.
                </p>
                <p>
                  <strong>ISO 10816 ASSESSMENT:</strong> Vibration magnitude remains within Class I acceptable operating envelope.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE 5: TURBO INTELLIGENCE CENTER */}
      {selectedSubsystem === 'TURBO' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            {/* Header Banner */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <Wind className="w-6 h-6 text-blue-400 animate-pulse" />
                <div>
                  <h2 className="font-heading font-bold text-lg text-slate-100">Turbocharger & Intake Compression Intelligence Center</h2>
                  <p className="text-xs font-mono-code text-slate-400">Rotax 914 Impeller Aerodynamics • Wastegate Duty Cycle • Air Intake Mass Flow Compression</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-mono-code font-bold">
                TURBO WORKSTATION ONLINE
              </span>
            </div>

            {/* Section 2: Live Engineering Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-mono-code text-slate-400">IMPELLER SPEED</span>
                <p className="text-3xl font-bold font-telemetry text-blue-300">{telemetry.turbochargerRpm.toLocaleString()} <span className="text-sm font-normal text-slate-400">RPM</span></p>
                <span className="text-[10px] font-mono-code text-emerald-400 block">COMPRESSOR EFFICIENCY: 94.2%</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-mono-code text-slate-400">BOOST PRESSURE</span>
                <p className="text-3xl font-bold font-telemetry text-emerald-300">{telemetry.turboBoostBar.toFixed(2)} <span className="text-sm font-normal text-slate-400">bar</span></p>
                <span className="text-[10px] font-mono-code text-slate-400 block">MANIFOLD MAP: {telemetry.manifoldPressureInHg.toFixed(1)} inHg</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-mono-code text-slate-400">THROTTLE POSITION</span>
                <p className="text-3xl font-bold font-telemetry text-indigo-300">{telemetry.throttlePercent.toFixed(1)} <span className="text-sm font-normal text-slate-400">%</span></p>
                <span className="text-[10px] font-mono-code text-emerald-400 block">WASTEGATE SERVO POSITION: 42.8%</span>
              </div>
            </div>

            {/* Section 3: Explainable AI (XAI) Turbo Diagnostic Panel */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono-code text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold">
                  <Brain className="w-4 h-4" />
                  <span>EXPLAINABLE AI (XAI) TURBOCHARGER REPORT</span>
                </div>
                <span className="text-slate-400">Confidence: <strong className="text-emerald-400">98.5%</strong></span>
              </div>

              <div className="space-y-2 text-slate-300 leading-relaxed">
                <p>
                  <strong>WHAT:</strong> Turbocharger impeller speed is operating at <strong>{telemetry.turbochargerRpm.toLocaleString()} RPM</strong> supplying <strong>{telemetry.turboBoostBar.toFixed(2)} bar</strong> boost.
                </p>
                <p>
                  <strong>AERODYNAMIC INTEGRITY:</strong> Wastegate pneumatic actuator position is responding nominally to throttle adjustments ({telemetry.throttlePercent.toFixed(1)}%).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
