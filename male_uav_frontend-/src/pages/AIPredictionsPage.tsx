import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Clock, 
  TrendingDown, 
  Sliders, 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  HelpCircle,
  BarChart3,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';
import { MissionAwareRul, ExplainableAiAttribution, FailureTimelineEvent } from '../types';

export const AIPredictionsPage: React.FC = () => {
  const { selectedUav, telemetry, customRulOffsetHours, setCustomRulOffsetHours } = useGcs();
  const [selectedProfile, setSelectedProfile] = useState<'HIGH_ALTITUDE' | 'HOT_DESERT' | 'SEA_LEVEL' | 'COMBAT_HIGH_G'>('HIGH_ALTITUDE');

  const missionProfilesData: Record<string, MissionAwareRul> = {
    HIGH_ALTITUDE: {
      missionType: 'High Altitude Surveillance (FL220 - FL280)',
      environmentalCondition: '-14°C Ambient, 432 hPa (Low Density Air)',
      estimatedRulHours: Number((142.6 + customRulOffsetHours).toFixed(1)),
      confidencePercent: 96.8,
      criticalLimitingComponent: 'Turbocharger Impeller & Cyl #3 Exhaust Valve',
      riskFactor: 'LOW',
      wearAccelerationMultiplier: 1.18,
    },
    HOT_DESERT: {
      missionType: 'Thar Border Sector (Hot & High +42°C Surface)',
      environmentalCondition: '+42°C Ambient, Fine Dust Ingestion Risk',
      estimatedRulHours: Number((98.4 + customRulOffsetHours).toFixed(1)),
      confidencePercent: 94.2,
      criticalLimitingComponent: 'Cylinder Head Thermal Baffles & Lube Oil Viscosity',
      riskFactor: 'MODERATE',
      wearAccelerationMultiplier: 1.65,
    },
    SEA_LEVEL: {
      missionType: 'Maritime EEZ Patrol (Low Alt 2,500 FT)',
      environmentalCondition: '+28°C Ambient, High Humidity & Salt Mist',
      estimatedRulHours: Number((210.0 + customRulOffsetHours).toFixed(1)),
      confidencePercent: 98.4,
      criticalLimitingComponent: 'Exhaust Runner Corrosion & Air Filter Intake',
      riskFactor: 'LOW',
      wearAccelerationMultiplier: 0.85,
    },
    COMBAT_HIGH_G: {
      missionType: 'Evasive Maneuver & Maximum Continuous Power (MCP)',
      environmentalCondition: 'Full Throttle 5,800 RPM, 39 inHg Boost, +3.5G Turns',
      estimatedRulHours: Number((46.2 + customRulOffsetHours).toFixed(1)),
      confidencePercent: 91.5,
      criticalLimitingComponent: 'Main Crankshaft Hydrodynamic Bearings & Piston Crown',
      riskFactor: 'CRITICAL',
      wearAccelerationMultiplier: 3.40,
    },
  };

  const currentRul = missionProfilesData[selectedProfile];

  // SHAP-style Explainable AI attribution factors
  const shapAttributions: ExplainableAiAttribution[] = [
    {
      featureName: 'Cylinder #3 EGT Elevation (+84°C)',
      featureCategory: 'THERMAL',
      contributionScore: +0.42,
      baselineValue: '760°C (Nominal)',
      currentObservedValue: `${telemetry.egtC[2]}°C`,
      explanation: 'Exhaust gas thermal peak indicates localized lean combustion, increasing exhaust valve thermal fatigue.',
    },
    {
      featureName: '2X Harmonic Acoustic Vibration (170 Hz)',
      featureCategory: 'MECHANICAL',
      contributionScore: +0.28,
      baselineValue: '1.8 mm/s',
      currentObservedValue: `${(telemetry.vibrationRmsMmS * 0.7).toFixed(1)} mm/s`,
      explanation: 'Firing frequency vibration harmonic slightly elevated, contributing to valvetrain wear rate.',
    },
    {
      featureName: 'Knock Detonation Index',
      featureCategory: 'COMBUSTION',
      contributionScore: telemetry.knockIndex > 0.4 ? +0.65 : -0.15,
      baselineValue: '0.05 (Zero Knock)',
      currentObservedValue: telemetry.knockIndex.toFixed(2),
      explanation: telemetry.knockIndex > 0.4 
        ? 'High pre-ignition acoustic energy accelerates piston ring land erosion.' 
        : 'Smooth combustion flame front preserves combustion chamber integrity.',
    },
    {
      featureName: 'Hydrodynamic Oil Pressure (4.35 bar)',
      featureCategory: 'FLUIDIC',
      contributionScore: -0.35,
      baselineValue: '4.20 bar',
      currentObservedValue: `${telemetry.oilPressureBar} bar`,
      explanation: 'Stable oil pressure and cooling dissipation actively retards bearing wear, extending overall RUL.',
    },
    {
      featureName: 'Turbo Boost Control Stability (0.88 bar)',
      featureCategory: 'OPERATIONAL',
      contributionScore: -0.22,
      baselineValue: '0.90 bar',
      currentObservedValue: `${telemetry.turboBoostBar} bar`,
      explanation: 'Smooth turbo wastegate response prevents manifold pressure overshoots.',
    },
  ];

  // 5-Stage Failure Progression Evolution Timeline
  const failureTimeline: FailureTimelineEvent[] = [
    {
      id: 'stg-1',
      stage: 'INITIATION',
      timeframeRemaining: 'Now (T+0h)',
      component: 'Cyl #3 Direct Fuel Injector',
      triggerCause: 'Micro-deposit varnish on nozzle pintle orifice',
      observableSymptom: 'Slight EGT rise (+15°C) detected by Adaptive Health Index',
      consequence: 'Zero loss of propulsive power; undetectable by legacy analog dials',
      preventativeIntervention: 'Edge AI adjusts trim pulse duration by +2.5%',
    },
    {
      id: 'stg-2',
      stage: 'PROPAGATION',
      timeframeRemaining: 'T + 45 Flight Hours',
      component: 'Exhaust Valve Face & Seat',
      triggerCause: 'Localized thermal oxidation under continuous 840°C EGT',
      observableSymptom: 'Cylinder #3 CHT creeps up by +8°C during sustained climb',
      consequence: 'Micro-pitting on valve seat sealing perimeter',
      preventativeIntervention: 'Prescribe borescope inspection during 50h depot turnaround',
    },
    {
      id: 'stg-3',
      stage: 'THRESHOLD_BREACH',
      timeframeRemaining: 'T + 110 Flight Hours',
      component: 'Combustion Chamber Seal',
      triggerCause: 'Compression drop from 9.0:1 down to 8.2:1',
      observableSymptom: '1X crank vibration jumps to 4.2 mm/s',
      consequence: 'Power output degraded by 4.5 HP; fuel consumption rises 6%',
      preventativeIntervention: 'Automated AI Maintenance Advisor orders replacement valve kit',
    },
    {
      id: 'stg-4',
      stage: 'FUNCTIONAL_IMPAIRMENT',
      timeframeRemaining: 'T + 142.6 Flight Hours',
      component: 'Aero Piston Assembly',
      triggerCause: 'Blow-by hot gases burn through top compression ring land',
      observableSymptom: 'Crankcase pressure switch triggers warning; oil consumption spikes',
      consequence: 'MALE UAV must abort mission and execute emergency RTB',
      preventativeIntervention: 'Pre-emptive engine swap scheduled at T+130h avoids this stage completely',
    },
  ];

  return (
    <div id="rul-matrix" className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              AI Prediction Center & Explainable AI (XAI) Architecture
            </h1>
            <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono-code font-bold">
              SHAP / DEEP-SURVIVAL RUL
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            Mission-Aware Remaining Useful Life forecasting with transparent feature importance attribution
          </p>
        </div>

        {/* Mission Profile Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono-code">
          {(['HIGH_ALTITUDE', 'HOT_DESERT', 'SEA_LEVEL', 'COMBAT_HIGH_G'] as const).map((prof) => (
            <button
              key={prof}
              onClick={() => setSelectedProfile(prof)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                selectedProfile === prof
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {prof.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Hero RUL Forecast Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/60 rounded-2xl p-5 relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Big Number Readout */}
          <div className="md:col-span-4 border-r border-slate-800/80 pr-4">
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-cyan-400">
              PREDICTED REMAINING USEFUL LIFE (RUL)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-telemetry font-bold text-4xl md:text-5xl text-slate-100">
                {currentRul.estimatedRulHours}
              </span>
              <span className="font-mono-code text-lg text-slate-400 uppercase">
                FLIGHT HOURS
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                CONFIDENCE: {currentRul.confidencePercent}%
              </span>
              <span className="text-xs text-slate-400 font-mono-code">
                Wear Factor: {currentRul.wearAccelerationMultiplier}x
              </span>
            </div>
          </div>

          {/* Operational Envelope Context */}
          <div className="md:col-span-8 space-y-2 text-xs font-mono-code">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">OPERATIONAL MISSION TYPE</span>
                <span className="font-bold text-slate-200 block mt-0.5">{currentRul.missionType}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{currentRul.environmentalCondition}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">PRIMARY LIMITING COMPONENT</span>
                <span className="font-bold text-amber-300 block mt-0.5">{currentRul.criticalLimitingComponent}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Determined by thermodynamic fatigue model</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SHAP Feature Contribution Waterfall & Explainable AI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Cols: SHAP Waterfall */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <h3 className="font-heading font-bold text-sm text-slate-100">
                Explainable AI (XAI): SHAP Parameter Importance Attribution
              </h3>
            </div>
            <span className="text-[10px] font-mono-code text-slate-400">SHAPLEY VALUES</span>
          </div>

          <p className="text-xs text-slate-300 mb-3">
            Explains which live telemetry parameters are currently accelerating (red) or extending (blue/green) engine useful life:
          </p>

          <div className="space-y-3">
            {shapAttributions.map((attr, idx) => {
              const isDetrimental = attr.contributionScore > 0;
              const barWidth = Math.min(100, Math.abs(attr.contributionScore) * 120);

              return (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between font-mono-code mb-1">
                    <span className="font-bold text-slate-100">{attr.featureName}</span>
                    <span className={`font-bold ${isDetrimental ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isDetrimental ? `+${(attr.contributionScore * 100).toFixed(0)}% Degradation Bias` : `${(attr.contributionScore * 100).toFixed(0)}% Preservation Bias`}
                    </span>
                  </div>

                  {/* SHAP Visual Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-1.5 flex">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDetrimental ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono-code text-slate-400 mt-1">
                    <span>Observed: <strong className="text-slate-200">{attr.currentObservedValue}</strong> (Base: {attr.baselineValue})</span>
                    <span className="text-slate-400 italic truncate max-w-[280px]">{attr.explanation}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: 5-Stage Failure Progression Evolution */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h3 className="font-heading font-bold text-sm text-slate-100">
                Failure Progression Trajectory
              </h3>
            </div>
            <span className="text-[10px] font-mono-code text-amber-400">PROBABILISTIC FORECAST</span>
          </div>

          <div className="space-y-2.5 flex-1">
            {failureTimeline.map((item, idx) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono-code relative"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    STAGE {idx + 1}: {item.stage}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-bold">{item.timeframeRemaining}</span>
                </div>
                <div className="font-bold text-slate-100">{item.triggerCause}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{item.observableSymptom}</div>
                <div className="text-[10px] text-emerald-400 mt-1 pt-1 border-t border-slate-800/80 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span>{item.preventativeIntervention}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
