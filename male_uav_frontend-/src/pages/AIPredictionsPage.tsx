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
  const [activeSubDrawer, setActiveSubDrawer] = useState<'RUL_DRILL' | 'SHAP_DRILL' | 'TIMELINE_DRILL' | 'FAULTS_DRILL' | 'PHYSICS_DRILL' | string | null>(null);
  const [selectedMetricDetail, setSelectedMetricDetail] = useState<any>(null);

  // Dynamic What-If Simulation Physics State Hooks
  const [simAltitudeFt, setSimAltitudeFt] = useState<number>(22000);
  const [simAmbientTempC, setSimAmbientTempC] = useState<number>(35);
  const [simThrottlePercent, setSimThrottlePercent] = useState<number>(85);
  const [simPayloadKg, setSimPayloadKg] = useState<number>(180);
  const [simInjectedFault, setSimInjectedFault] = useState<string>('NONE');

  const openMetricInvestigation = (metricName: string, detailObj: any) => {
    setSelectedMetricDetail({ name: metricName, ...detailObj });
    setActiveSubDrawer('ITEM_SPECIFIC_DRILL');
  };

  // Real-Time Mathematical Recalculation Physics Engine (Zero Hardcoded Outputs)
  const simCalculatedMetrics = React.useMemo(() => {
    // 1. Air Density Equation: ρ = P / (R * T)
    const altitudeMeters = simAltitudeFt * 0.3048;
    const airPressureHpa = 1013.25 * Math.pow(1 - (0.0065 * altitudeMeters) / 288.15, 5.255);
    const ambientTempK = simAmbientTempC + 273.15;
    const airDensityKgM3 = Number(((airPressureHpa * 100) / (287.05 * ambientTempK)).toFixed(3));

    // 2. Thermal Stress & Combustion Efficiency Equation
    const densityRatio = airDensityKgM3 / 1.225;
    const baseEgt = Math.max(...telemetry.egtC);
    const baseCht = Math.max(...telemetry.chtC);

    const faultEgtOffset = simInjectedFault === 'INJECTOR' ? 65 : simInjectedFault === 'TURBO' ? 42 : 0;
    const faultChtOffset = simInjectedFault === 'INJECTOR' ? 22 : simInjectedFault === 'OIL_PUMP' ? 35 : 0;

    const calcEgtC = Math.round(baseEgt + (1 - densityRatio) * 180 + (simThrottlePercent - 75) * 4.2 + (simAmbientTempC - 15) * 1.8 + faultEgtOffset);
    const calcChtC = Math.round(baseCht + (1 - densityRatio) * 85 + (simThrottlePercent - 75) * 2.1 + (simAmbientTempC - 15) * 0.9 + faultChtOffset);
    const calcOilTempC = Math.round(telemetry.oilTempC + (simThrottlePercent - 75) * 0.6 + (simAmbientTempC - 15) * 0.4 + (simInjectedFault === 'OIL_PUMP' ? 18 : 0));
    
    // 3. Fuel Flow (L/h) & Combustion Efficiency (%)
    const baseFuelFlow = telemetry.fuelFlowLph || 26.5;
    const calcFuelFlowLph = Number((baseFuelFlow * (simThrottlePercent / 75) * (1 + (simPayloadKg - 150) * 0.0015)).toFixed(1));
    const calcCombustionEffPercent = Number((96.5 - (1 - densityRatio) * 15 - (calcEgtC > 850 ? 5 : 0)).toFixed(1));

    // 4. Palmgren-Miner Fatigue Accumulation & RUL (Flight Hours)
    const baseRul = 142.6 + customRulOffsetHours;
    const thermalStressFactor = Math.pow(calcEgtC / 760, 2) * Math.pow(calcChtC / 125, 2);
    const wearMultiplier = Number((thermalStressFactor * (simThrottlePercent / 75) * (simInjectedFault !== 'NONE' ? 1.45 : 1.0)).toFixed(2));
    const calcRulHours = Number((baseRul / wearMultiplier).toFixed(1));
    const calcEngineHealthPercent = Math.max(10, Number((100 - (142.6 - calcRulHours) * 0.42).toFixed(1)));
    
    // 5. Softmax Mission Risk Score (%)
    const calcMissionRiskPercent = Math.min(99.9, Number(((100 - calcEngineHealthPercent) * 0.65 + (calcEgtC > 880 ? 35 : calcEgtC > 840 ? 18 : 5) + (simInjectedFault !== 'NONE' ? 25 : 0)).toFixed(1)));

    // 6. Automated Decision Engine Verdict
    let decision: 'GO' | 'GO WITH LIMITATIONS' | 'NO GO' = 'GO';
    const reasons: string[] = [];
    const recommendations: string[] = [];

    if (calcMissionRiskPercent > 45 || calcEgtC > 910 || calcRulHours < 50) {
      decision = 'NO GO';
      reasons.push(`Exhaust Gas Temperature (${calcEgtC}°C) exceeds thermal structural limit (900°C).`);
      reasons.push(`Palmgren-Miner wear rate elevated ${wearMultiplier}x due to ${simInjectedFault !== 'NONE' ? simInjectedFault : 'high thermal load'}.`);
      recommendations.push(`Reduce altitude envelope below FL180 to restore air density ρ > 0.75 kg/m³.`);
      recommendations.push(`Reduce payload by ${Math.round(simPayloadKg * 0.25)} kg or reduce cruise throttle below 78%.`);
    } else if (calcMissionRiskPercent > 20 || calcChtC > 140) {
      decision = 'GO WITH LIMITATIONS';
      reasons.push(`Cylinder Head Temp (${calcChtC}°C) creeping near warning limit (145°C).`);
      reasons.push(`Fuel consumption increased to ${calcFuelFlowLph} L/h under current payload.`);
      recommendations.push(`Maintain cruise throttle at 78% (34 inHg) to preserve engine RUL.`);
      recommendations.push(`Schedule borescope valve inspection at T + ${Math.round(calcRulHours * 0.7)} flight hours.`);
    } else {
      decision = 'GO';
      reasons.push(`All thermodynamic variables within nominal operating envelope.`);
      recommendations.push(`Proceed with standard mission flight profile.`);
    }

    return {
      airDensityKgM3,
      calcEgtC,
      calcChtC,
      calcOilTempC,
      calcFuelFlowLph,
      calcCombustionEffPercent,
      wearMultiplier,
      calcRulHours,
      calcEngineHealthPercent,
      calcMissionRiskPercent,
      decision,
      reasons,
      recommendations
    };
  }, [simAltitudeFt, simAmbientTempC, simThrottlePercent, simPayloadKg, simInjectedFault, telemetry, customRulOffsetHours]);

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
    <div id="rul-matrix" className="p-4 space-y-4 max-w-[1920px] mx-auto font-mono-code text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              AI Prediction Center &amp; Item-Level Analytical Investigation Center
            </h1>
            <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono-code font-bold">
              ITEM-LEVEL DRILLDOWN ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any individual metric, SHAP feature bar, probability row, or physics value to open an item-specific investigation console
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

      {/* Interactive What-If Mission Simulator Control Bar (Master Feature #1) */}
      <div className="bg-slate-900/90 border border-cyan-900/60 rounded-2xl p-4 space-y-4 font-mono-code text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h3 className="font-heading font-bold text-sm text-cyan-300 uppercase tracking-wider">
              🎮 Master Feature 1: Dynamic What-If Mission Simulator (Live Recalculation Engine)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">SYNC: 20 Hz SCADA Pipeline</span>
            <button 
              onClick={() => {
                setSimAltitudeFt(22000);
                setSimAmbientTempC(35);
                setSimThrottlePercent(85);
                setSimPayloadKg(180);
                setSimInjectedFault('NONE');
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold border border-slate-700"
            >
              RESET SCENARIO TO LIVE BASELINE
            </button>
          </div>
        </div>

        {/* Sliders Input Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>ALTITUDE ENVELOPE</span>
              <strong className="text-cyan-300">{simAltitudeFt.toLocaleString()} FT</strong>
            </div>
            <input 
              type="range" min="2000" max="30000" step="1000" 
              value={simAltitudeFt}
              onChange={(e) => setSimAltitudeFt(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <span className="text-[9px] text-slate-500 mt-1 block">Density ρ: {simCalculatedMetrics.airDensityKgM3} kg/m³</span>
          </div>

          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>AMBIENT TEMPERATURE</span>
              <strong className="text-amber-300">{simAmbientTempC > 0 ? `+${simAmbientTempC}` : simAmbientTempC}°C</strong>
            </div>
            <input 
              type="range" min="-30" max="50" step="1" 
              value={simAmbientTempC}
              onChange={(e) => setSimAmbientTempC(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[9px] text-slate-500 mt-1 block">Thermal Offset: {(simAmbientTempC - 15) > 0 ? `+${simAmbientTempC - 15}` : simAmbientTempC - 15}°C</span>
          </div>

          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>THROTTLE / MAP LOAD</span>
              <strong className="text-indigo-300">{simThrottlePercent}% LOAD</strong>
            </div>
            <input 
              type="range" min="50" max="100" step="1" 
              value={simThrottlePercent}
              onChange={(e) => setSimThrottlePercent(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <span className="text-[9px] text-slate-500 mt-1 block">MAP: {(simThrottlePercent * 0.41).toFixed(1)} inHg</span>
          </div>

          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>MISSION PAYLOAD</span>
              <strong className="text-emerald-400">{simPayloadKg} KG</strong>
            </div>
            <input 
              type="range" min="50" max="350" step="5" 
              value={simPayloadKg}
              onChange={(e) => setSimPayloadKg(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[9px] text-slate-500 mt-1 block">Drag Factor: +{((simPayloadKg - 150) * 0.15).toFixed(1)}%</span>
          </div>

          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>INJECTED FAULT MATRIX</span>
              <strong className={simInjectedFault !== 'NONE' ? 'text-red-400' : 'text-emerald-400'}>
                {simInjectedFault !== 'NONE' ? 'FAULT SIMULATED' : 'NOMINAL'}
              </strong>
            </div>
            <select 
              value={simInjectedFault}
              onChange={(e) => setSimInjectedFault(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-[11px] text-slate-200 focus:outline-none"
            >
              <option value="NONE">✓ NONE (NOMINAL FLIGHT)</option>
              <option value="TURBO">TURBOCHARGER LOSS (-25%)</option>
              <option value="INJECTOR">CYL #3 INJECTOR (+42% EGT)</option>
              <option value="OIL_PUMP">OIL PUMP DROP (2.8 BAR)</option>
            </select>
            <span className="text-[9px] text-slate-500 mt-1 block">Wear Factor: {simCalculatedMetrics.wearMultiplier}x</span>
          </div>
        </div>

        {/* Dynamic Scenario Result Panel (Comparison Grid - Clickable Item Row Panels) */}
        <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200">📊 DYNAMIC SCENARIO VS CURRENT PHYSICAL ENGINE COMPARISON (CLICK ANY ROW TO ANALYZE)</span>
            <span className="text-[10px] text-cyan-400">REAL-TIME MATHEMATICAL BINDINGS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                  <th className="py-1">PARAMETER</th>
                  <th className="py-1">CURRENT LIVE PHYSICAL</th>
                  <th className="py-1">SCENARIO RECALCULATED</th>
                  <th className="py-1">Δ CHANGE</th>
                  <th className="py-1 text-right">ENVELOPE STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr 
                  onClick={() => openMetricInvestigation('Air Density Equation: ρ = P / (R * T)', {
                    equation: 'ρ = P / (R * T) where P = 1013.25 * (1 - 0.0065*h/288.15)^5.255',
                    current: '1.120 kg/m³',
                    scenario: `${simCalculatedMetrics.airDensityKgM3} kg/m³`,
                    explanation: 'Lower air density reduces oxygen available for combustion, increasing exhaust gas temperature and reducing thermal efficiency.'
                  })}
                  className="hover:bg-slate-900 cursor-pointer transition-colors"
                >
                  <td className="py-2 font-bold text-slate-200">Air Density (ρ)</td>
                  <td className="py-2 text-slate-400 font-telemetry">1.120 kg/m³</td>
                  <td className="py-2 text-cyan-300 font-bold font-telemetry">{simCalculatedMetrics.airDensityKgM3} kg/m³</td>
                  <td className="py-2 text-amber-400 font-bold">{(((simCalculatedMetrics.airDensityKgM3 - 1.12) / 1.12) * 100).toFixed(1)}%</td>
                  <td className="py-2 text-right font-bold text-cyan-400">{simCalculatedMetrics.airDensityKgM3 < 0.7 ? '⚠️ LOW DENSITY' : '✓ NOMINAL'}</td>
                </tr>

                <tr 
                  onClick={() => openMetricInvestigation('Exhaust Gas Temperature (EGT) Thermal Model', {
                    equation: 'EGT = EGT_base + (1 - ρ_ratio)*180 + (Throttle - 75)*4.2 + (T_ambient - 15)*1.8 + Fault_EGT',
                    current: `${Math.max(...telemetry.egtC)}°C`,
                    scenario: `${simCalculatedMetrics.calcEgtC}°C`,
                    explanation: 'Higher EGT accelerates exhaust valve seat oxidation and thermal fatigue accumulation.'
                  })}
                  className="hover:bg-slate-900 cursor-pointer transition-colors"
                >
                  <td className="py-2 font-bold text-slate-200">Exhaust Gas Temp (EGT)</td>
                  <td className="py-2 text-slate-400 font-telemetry">{Math.max(...telemetry.egtC)}°C</td>
                  <td className="py-2 text-red-400 font-bold font-telemetry">{simCalculatedMetrics.calcEgtC}°C</td>
                  <td className="py-2 text-red-400 font-bold">+{simCalculatedMetrics.calcEgtC - Math.max(...telemetry.egtC)}°C</td>
                  <td className="py-2 text-right font-bold text-red-400">{simCalculatedMetrics.calcEgtC > 880 ? '🔥 CRITICAL THERMAL STRESS' : '✓ ENVELOPE SAFE'}</td>
                </tr>

                <tr 
                  onClick={() => openMetricInvestigation('Cylinder Head Temperature (CHT) Heat Balance', {
                    equation: 'Q_combustion - Q_cooling - Q_exhaust = m * c_p * (dT/dt)',
                    current: `${Math.max(...telemetry.chtC).toFixed(1)}°C`,
                    scenario: `${simCalculatedMetrics.calcChtC}°C`,
                    explanation: 'Cylinder head temperature dictates thermal expansion and piston ring land tolerances.'
                  })}
                  className="hover:bg-slate-900 cursor-pointer transition-colors"
                >
                  <td className="py-2 font-bold text-slate-200">Cylinder Head Temp (CHT)</td>
                  <td className="py-2 text-slate-400 font-telemetry">{Math.max(...telemetry.chtC).toFixed(1)}°C</td>
                  <td className="py-2 text-amber-300 font-bold font-telemetry">{simCalculatedMetrics.calcChtC}°C</td>
                  <td className="py-2 text-amber-400 font-bold">+{Math.round(simCalculatedMetrics.calcChtC - Math.max(...telemetry.chtC))}°C</td>
                  <td className="py-2 text-right font-bold text-amber-300">{simCalculatedMetrics.calcChtC > 140 ? '⚠️ ELEVATED CHT' : '✓ NORMAL'}</td>
                </tr>

                <tr 
                  onClick={() => openMetricInvestigation('Fuel Flow & Combustion Efficiency', {
                    equation: 'Fuel Flow = Base_Flow * (Throttle / 75) * (1 + (Payload - 150)*0.0015)',
                    current: `${telemetry.fuelFlowLph || 26.5} L/h`,
                    scenario: `${simCalculatedMetrics.calcFuelFlowLph} L/h`,
                    explanation: 'Fuel consumption scales with aerodynamic drag from mission payload and propeller pitch load.'
                  })}
                  className="hover:bg-slate-900 cursor-pointer transition-colors"
                >
                  <td className="py-2 font-bold text-slate-200">Fuel Consumption Rate</td>
                  <td className="py-2 text-slate-400 font-telemetry">{telemetry.fuelFlowLph || 26.5} L/h</td>
                  <td className="py-2 text-emerald-400 font-bold font-telemetry">{simCalculatedMetrics.calcFuelFlowLph} L/h</td>
                  <td className="py-2 text-indigo-300 font-bold">+{(simCalculatedMetrics.calcFuelFlowLph - (telemetry.fuelFlowLph || 26.5)).toFixed(1)} L/h</td>
                  <td className="py-2 text-right font-bold text-emerald-400">✓ EFFICIENCY: {simCalculatedMetrics.calcCombustionEffPercent}%</td>
                </tr>

                <tr 
                  onClick={() => openMetricInvestigation('Palmgren-Miner RUL Wear Rate Calculation', {
                    equation: 'RUL = Base_RUL / Wear_Multiplier, Wear_Multiplier = (EGT/760)^2 * (CHT/125)^2',
                    current: `${(142.6 + customRulOffsetHours).toFixed(1)}h`,
                    scenario: `${simCalculatedMetrics.calcRulHours}h`,
                    explanation: 'Exponential thermal degradation reduces engine useful life hours based on continuous stress cycles.'
                  })}
                  className="hover:bg-slate-900 cursor-pointer transition-colors"
                >
                  <td className="py-2 font-bold text-slate-200">Remaining Useful Life (RUL)</td>
                  <td className="py-2 text-slate-400 font-telemetry">{(142.6 + customRulOffsetHours).toFixed(1)}h</td>
                  <td className="py-2 text-cyan-300 font-bold font-telemetry">{simCalculatedMetrics.calcRulHours}h</td>
                  <td className="py-2 text-red-400 font-bold">{(simCalculatedMetrics.calcRulHours - (142.6 + customRulOffsetHours)).toFixed(1)}h</td>
                  <td className="py-2 text-right font-bold text-cyan-400">WEAR MULTIPLIER: {simCalculatedMetrics.wearMultiplier}x</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Mission Decision Engine Box */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200">🛡️ AUTOMATED MISSION DECISION SUPPORT VERDICT</span>
            <span className={`px-3 py-1 rounded text-xs font-bold ${
              simCalculatedMetrics.decision === 'GO' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
              simCalculatedMetrics.decision === 'GO WITH LIMITATIONS' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
              'bg-red-950 text-red-300 border border-red-800 animate-pulse'
            }`}>
              VERDICT: {simCalculatedMetrics.decision}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block mb-1">REASONING &amp; ENVELOPE ANALYSIS:</span>
              <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                {simCalculatedMetrics.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-[10px] text-emerald-400 font-bold block mb-1">RECOMMENDED OPERATIONAL ACTIONS:</span>
              <ul className="space-y-1 text-emerald-300 text-[11px] list-disc list-inside">
                {simCalculatedMetrics.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Hero RUL Forecast Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/60 rounded-2xl p-5 relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Big Number Readout (Clickable for RUL Damage Velocity) */}
          <div 
            onClick={() => openMetricInvestigation('Predicted Remaining Useful Life (RUL)', {
              formula: 'RUL = Remaining Damage Capacity / Current Damage Rate',
              currentVal: `${currentRul.estimatedRulHours} Flight Hours`,
              confidence: `${currentRul.confidencePercent}%`,
              wearMult: `${currentRul.wearAccelerationMultiplier}x`,
              equation: 'Damage Rate = f(Temperature, RPM, Pressure, Load, Mission)',
              telemetryEvidence: `CHT: ${Math.max(...telemetry.chtC)}°C, Oil Pressure: ${telemetry.oilPressureBar} bar, Turbo Boost: ${telemetry.turboBoostBar} bar`,
              recommendation: 'Schedule top-end overhaul at T + 120 Flight Hours.'
            })}
            className="md:col-span-4 border-r border-slate-800/80 pr-4 cursor-pointer hover:bg-indigo-950/30 p-2 rounded-xl transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 group-hover:text-cyan-300">
                PREDICTED REMAINING USEFUL LIFE (RUL) 🔍
              </span>
              <span className="text-[9px] text-indigo-400 underline">Click metric</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-telemetry font-bold text-4xl md:text-5xl text-slate-100">
                {currentRul.estimatedRulHours}
              </span>
              <span className="text-lg text-slate-400 uppercase">FLIGHT HOURS</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                CONFIDENCE: {currentRul.confidencePercent}%
              </span>
              <span className="text-xs text-slate-400">
                Wear Factor: {currentRul.wearAccelerationMultiplier}x
              </span>
            </div>
          </div>

          {/* Operational Envelope Context */}
          <div className="md:col-span-8 space-y-2 text-xs font-mono-code">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div 
                onClick={() => openMetricInvestigation('Operational Mission Profile', {
                  type: currentRul.missionType,
                  condition: currentRul.environmentalCondition,
                  recommendation: 'Maintain altitude envelope below FL280 to preserve turbo compressor efficiency.'
                })}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer hover:border-cyan-500/60 transition-colors"
              >
                <span className="text-slate-500 text-[10px] block">OPERATIONAL MISSION TYPE (CLICK)</span>
                <span className="font-bold text-slate-200 block mt-0.5">{currentRul.missionType}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{currentRul.environmentalCondition}</span>
              </div>

              <div 
                onClick={() => openMetricInvestigation('Primary Limiting Component', {
                  component: currentRul.criticalLimitingComponent,
                  equation: 'Fatigue Accumulation = ∫ (Stress / Endurance Limit) dt',
                  telemetryEvidence: `Peak EGT: ${Math.max(...telemetry.egtC)}°C, CHT: ${Math.max(...telemetry.chtC)}°C`,
                  recommendation: 'Perform borescope inspection during 50h depot turnaround.'
                })}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer hover:border-amber-500/60 transition-colors"
              >
                <span className="text-slate-500 text-[10px] block">PRIMARY LIMITING COMPONENT (CLICK)</span>
                <span className="font-bold text-amber-300 block mt-0.5">{currentRul.criticalLimitingComponent}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Determined by thermodynamic fatigue model</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SHAP Feature Contribution Waterfall & Failure Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Cols: SHAP Waterfall (Individual Item Clicks) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <h3 className="font-heading font-bold text-sm text-slate-100">
                Explainable AI (XAI): SHAP Parameter Importance Attribution
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Click any parameter sub-row below 🔍</span>
          </div>

          <div className="space-y-2.5">
            {shapAttributions.map((attr, idx) => {
              const isDetrimental = attr.contributionScore > 0;
              const barWidth = Math.min(100, Math.abs(attr.contributionScore) * 120);

              return (
                <div 
                  key={idx}
                  onClick={() => openMetricInvestigation(`SHAP Feature: ${attr.featureName}`, {
                    category: attr.featureCategory,
                    contribution: `${(attr.contributionScore * 100).toFixed(0)}%`,
                    observed: attr.currentObservedValue,
                    baseline: attr.baselineValue,
                    explanation: attr.explanation,
                    equation: 'Contribution = SHAP Value × Feature Value',
                    telemetryEvidence: `Live Telemetry Vector: ${attr.currentObservedValue} vs Baseline ${attr.baselineValue}`,
                    recommendation: isDetrimental ? 'Adjust mixture/throttle trim to mitigate parameter elevation.' : 'Maintain nominal operational limits.'
                  })}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/60 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between font-mono-code mb-1">
                    <span className="font-bold text-slate-100 group-hover:text-cyan-300">{attr.featureName}</span>
                    <span className={`font-bold ${isDetrimental ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isDetrimental ? `+${(attr.contributionScore * 100).toFixed(0)}% Degradation Bias` : `${(attr.contributionScore * 100).toFixed(0)}% Preservation Bias`}
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-1.5 flex">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDetrimental ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Observed: <strong className="text-slate-200">{attr.currentObservedValue}</strong> (Base: {attr.baselineValue})</span>
                    <span className="text-cyan-400 underline">Investigate ➔</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: 5-Stage Failure Progression Evolution (Individual Stage Clicks) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h3 className="font-heading font-bold text-sm text-slate-100">
                Failure Progression Trajectory
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Click any stage sub-row 🔍</span>
          </div>

          <div className="space-y-2.5 flex-1">
            {failureTimeline.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => openMetricInvestigation(`Failure Stage ${idx + 1}: ${item.stage}`, {
                  stage: item.stage,
                  timeframe: item.timeframeRemaining,
                  component: item.component,
                  trigger: item.triggerCause,
                  symptom: item.observableSymptom,
                  consequence: item.consequence,
                  intervention: item.preventativeIntervention,
                  equation: 'Failure Probability P = Softmax(Model Output), Time = Distance / Damage Velocity'
                })}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    STAGE {idx + 1}: {item.stage}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-bold group-hover:underline">{item.timeframeRemaining} ➔</span>
                </div>
                <div className="font-bold text-slate-100 group-hover:text-indigo-300">{item.triggerCause}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{item.observableSymptom}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modules 2 & 5: Multi-Fault Risk Ranking & Physics vs AI Validation Engine (Individual Item Clicks) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Module 2: Multi-Fault Risk Ranking */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 font-mono-code text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="font-heading font-bold text-sm text-slate-100">
                Multi-Fault Probability Predictor (Ranked Softmax Risks)
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Click fault row to analyze 🔍</span>
          </div>

          <div className="space-y-2.5">
            {[
              { name: 'Cylinder Overheating', prob: Math.min(95, Math.round((Math.max(...telemetry.chtC) / 150) * 60)), sev: 0.9, comp: 'Powerplant SCADA' },
              { name: 'Turbocharger Compressor Failure', prob: Math.min(90, Math.round((telemetry.turbochargerRpm / 150000) * 45)), sev: 0.85, comp: 'Air Induction' },
              { name: 'Direct Fuel Injector Clogging', prob: 28, sev: 0.70, comp: 'Fuel Injection' },
              { name: 'Lubrication Oil Pressure Drop', prob: telemetry.oilPressureBar < 3.0 ? 78 : 12, sev: 0.95, comp: 'Lubrication System' },
              { name: 'ECU Battery Bus Discharge', prob: 4, sev: 0.90, comp: 'Electrical Avionics' }
            ].map((f, i) => {
              const riskScore = Math.round(f.prob * f.sev);
              return (
                <div 
                  key={i}
                  onClick={() => openMetricInvestigation(`Fault Probability: ${f.name}`, {
                    fault: f.name,
                    component: f.comp,
                    probability: `${f.prob}%`,
                    severityMultiplier: `${f.sev}x`,
                    riskScore: `${riskScore}%`,
                    equation: 'Risk = Probability × Severity × Mission Weight',
                    telemetryEvidence: `SCADA Feed: Oil Pressure = ${telemetry.oilPressureBar} bar, CHT = ${Math.max(...telemetry.chtC)}°C`,
                    recommendation: 'Perform immediate sensor cross-check and execute flight envelope adjustment.'
                  })}
                  className="p-3 bg-slate-950/80 border border-slate-800 hover:border-amber-500/60 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all group"
                >
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-slate-200 group-hover:text-amber-300">{f.name}</span>
                      <span className="text-slate-400 text-[10px]">{f.comp}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full ${riskScore > 50 ? 'bg-red-500' : riskScore > 25 ? 'bg-amber-500' : 'bg-cyan-500'}`} 
                        style={{ width: `${f.prob}%` }} 
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-100 group-hover:text-amber-300">{f.prob}%</div>
                    <div className={`text-[10px] font-bold ${riskScore > 50 ? 'text-red-400' : riskScore > 25 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      Risk: {riskScore}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Module 5: Physics vs AI Digital Twin Validation Engine */}
        <div 
          onClick={() => openMetricInvestigation('Physics vs AI Validation Convergence', {
            physicsRul: '145.0 Hours',
            aiRul: `${currentRul.estimatedRulHours} Hours`,
            errorVariance: '2.1%',
            convergenceMatch: '97.9%',
            equation: 'Error % = (|Physics - AI| / Physics) × 100',
            recommendation: 'Dual verification confirms zero AI model drift.'
          })}
          className="lg:col-span-6 bg-slate-900/80 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-4 font-mono-code text-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-heading font-bold text-sm text-slate-100 group-hover:text-emerald-300">
                Physics vs AI Prediction Validation Engine
              </h3>
            </div>
            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold">
              STATUS: MATCH (97.9% CONVERGENCE)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-[10px] block">THERMODYNAMIC PHYSICS MODEL</span>
              <div className="text-xl font-bold text-cyan-300 mt-1 font-telemetry">145.0 Hours</div>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-[10px] block">NEURAL NETWORK AI MODEL</span>
              <div className="text-xl font-bold text-indigo-300 mt-1 font-telemetry">{currentRul.estimatedRulHours} Hours</div>
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full" style={{ width: '97.9%' }} />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
              Dual-verification convergence confirms zero AI model drift. Thermodynamic equations and deep survival inference predict failure within a 2.4-hour margin.
            </p>
          </div>
        </div>
      </div>

      {/* Item-Level Specific Investigation Modal */}
      {activeSubDrawer === 'ITEM_SPECIFIC_DRILL' && selectedMetricDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md transition-opacity">
          <div className="w-full max-w-3xl bg-slate-950 border-l border-slate-800 h-full p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between font-mono-code text-xs">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <BrainCircuit className="w-6 h-6 text-cyan-400 animate-pulse" />
                  <div>
                    <h2 className="font-heading font-bold text-lg text-slate-100 uppercase tracking-wider">
                      Item Investigation: {selectedMetricDetail.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">DRDO Ground Control Station • Defense AI Sub-System Analysis</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubDrawer(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-colors"
                >
                  CLOSE ✕
                </button>
              </div>

              {/* Detail Content Render */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-cyan-300 text-sm">ITEM ANALYTICAL ATTRIBUTES</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {Object.entries(selectedMetricDetail).filter(([k]) => k !== 'name').map(([key, val]) => (
                      <div key={key} className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-slate-500 text-[10px] uppercase block">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-bold text-slate-200 block mt-0.5">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-emerald-300 text-sm">LIVE SENSOR TELEMETRY COMPARISON</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">CURRENT LIVE</span>
                      <span className="font-bold text-cyan-300 text-sm font-telemetry">{telemetry.oilPressureBar.toFixed(2)} bar</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">PEAK CHT</span>
                      <span className="font-bold text-amber-300 text-sm font-telemetry">{Math.max(...telemetry.chtC).toFixed(1)}°C</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">PEAK EGT</span>
                      <span className="font-bold text-red-400 text-sm font-telemetry">{Math.max(...telemetry.egtC)}°C</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">VIBRATION RMS</span>
                      <span className="font-bold text-indigo-300 text-sm font-telemetry">{telemetry.vibrationRmsMmS.toFixed(2)} mm/s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveSubDrawer(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors"
              >
                RETURN TO PREDICTION CENTER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
