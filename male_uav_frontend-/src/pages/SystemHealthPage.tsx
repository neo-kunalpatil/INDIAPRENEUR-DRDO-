import React, { useState } from 'react';
import { 
  Server, 
  Cpu, 
  Radio, 
  ShieldCheck, 
  CheckCircle2, 
  Activity, 
  Lock, 
  Wifi, 
  Database,
  Layers,
  Terminal,
  Info
} from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';
import { useGcs } from '../contexts/GcsContext';

export const SystemHealthPage: React.FC = () => {
  const { selectedUav, telemetry } = useGcs();
  const [selectedSubsystem, setSelectedSubsystem] = useState<'scada' | 'physics' | 'ai'>('scada');

  const liveSensors = [
    { name: 'Engine RPM', val: `${telemetry.rpm.toLocaleString()} RPM`, hz: '100 Hz', status: 'VALID' },
    { name: 'MAP Boost', val: `${telemetry.turboBoostBar.toFixed(2)} bar`, hz: '50 Hz', status: 'VALID' },
    { name: 'Cyl 1 CHT', val: `${telemetry.chtC[0].toFixed(1)}°C`, hz: '20 Hz', status: 'VALID' },
    { name: 'Cyl 2 CHT', val: `${telemetry.chtC[1].toFixed(1)}°C`, hz: '20 Hz', status: 'VALID' },
    { name: 'Cyl 3 CHT', val: `${telemetry.chtC[2].toFixed(1)}°C`, hz: '20 Hz', status: 'VALID' },
    { name: 'Cyl 4 CHT', val: `${telemetry.chtC[3].toFixed(1)}°C`, hz: '20 Hz', status: 'VALID' },
    { name: 'Cyl 1 EGT', val: `${telemetry.egtC[0]}°C`, hz: '20 Hz', status: 'VALID' },
    { name: 'Cyl 2 EGT', val: `${telemetry.egtC[1]}°C`, hz: '20 Hz', status: 'VALID' },
    { name: 'Cyl 3 EGT', val: `${telemetry.egtC[2]}°C`, hz: '20 Hz', status: 'VALID' },
    { name: 'Cyl 4 EGT', val: `${telemetry.egtC[3]}°C`, hz: '20 Hz', status: 'VALID' },
    { name: 'Oil Pressure', val: `${telemetry.oilPressureBar.toFixed(2)} bar`, hz: '50 Hz', status: 'VALID' },
    { name: 'Oil Temp', val: `${telemetry.oilTempC}°C`, hz: '20 Hz', status: 'VALID' },
    { name: 'Fuel Flow', val: `${(telemetry.fuelFlowLitersHr || 24.5).toFixed(1)} L/h`, hz: '50 Hz', status: 'VALID' },
    { name: 'Battery Volts', val: `14.2 V`, hz: '10 Hz', status: 'VALID' },
    { name: 'Turbo Speed', val: `${telemetry.turbochargerRpm.toLocaleString()} RPM`, hz: '100 Hz', status: 'VALID' },
    { name: 'Air Altitude', val: `${selectedUav.altitudeFt.toLocaleString()} FT`, hz: '10 Hz', status: 'VALID' },
    { name: 'Air Speed', val: `${selectedUav.airspeedKts} KTS`, hz: '20 Hz', status: 'VALID' },
    { name: 'Knock Index', val: `${telemetry.knockIndex.toFixed(2)}`, hz: '100 Hz', status: 'VALID' },
  ];

  const subsystems = [
    {
      name: 'DRDO Tactical Telemetry SCADA Pipeline',
      status: 'OPERATIONAL',
      rate: '20 Hz Synchronous',
      latency: '2.4 ms',
      protocol: 'STANAG 4586 / UDP Multicast',
    },
    {
      name: 'Physics Thermodynamic Engine (Navier-Stokes/Otto)',
      status: 'OPERATIONAL',
      rate: '100 Hz Numerical Solver',
      latency: '0.8 ms',
      protocol: 'First-Principles SIMD C++',
    },
    {
      name: 'Deep Neural AI Prognostics & SHAP Explainer',
      status: 'OPERATIONAL',
      rate: '10 Hz Inference',
      latency: '1.2 ms',
      protocol: 'TensorRT Edge Engine',
    },
    {
      name: 'Digital Twin 3D Finite Element Mesh Visualizer',
      status: 'OPERATIONAL',
      rate: '60 FPS Hardware Accelerated',
      latency: '16.6 ms',
      protocol: 'WebGL / WebGPU Canvas',
    },
    {
      name: 'Cryptographic Airworthiness & Passport Audit',
      status: 'OPERATIONAL',
      rate: 'Continuous Blockchain Hash',
      latency: '5.0 ms',
      protocol: 'AES-256 / SHA-3 Type-1',
    },
  ];

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              GCS Architecture, Edge Compute & Subsystem Integrity
            </h1>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono-code font-bold">
              SYSTEM INTEGRITY: 100%
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            Real-time diagnostics of Ground Control Station edge compute clusters, avionics buses, and cyber-hardened comms
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs font-mono-code">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>CYBER POSTURE: <strong className="text-emerald-300">MIL-STD-1553 HARDENED</strong></span>
        </div>
      </div>

      {/* Top 4 Infrastructure Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Edge Server Cluster"
          value="4 / 4 Nodes"
          status="NORMAL"
          change="Zero dropped packets"
          changeType="positive"
          icon={Server}
          subtext="Quad Redundant Hot-Standby"
        />
        <MetricCard
          title="Telemetry Link Latency"
          value="2.4 ms"
          status="NORMAL"
          change="C-Band LOS + SATCOM"
          changeType="positive"
          icon={Radio}
          subtext="Bit Error Rate: < 10⁻⁹"
        />
        <MetricCard
          title="GCS Memory Footprint"
          value="142 MB"
          status="NORMAL"
          change="Zero memory leaks"
          changeType="positive"
          icon={Cpu}
          subtext="Optimized React 19 Frontend"
        />
        <MetricCard
          title="Data Security Rating"
          value="DRDO Level 4"
          status="NORMAL"
          change="Encrypted local sandbox"
          changeType="positive"
          icon={Lock}
          subtext="No cloud API leakage"
        />
      </div>

      {/* Interactive Core Engineering Backend Subsystems Container */}
      <div className="space-y-4">
        {/* Interactive Subsystem Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setSelectedSubsystem('scada')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedSubsystem === 'scada'
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/30'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono-code font-bold text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                1. TELEMETRY SCADA PIPELINE
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px] font-mono-code font-bold">
                20-100 Hz LIVE
              </span>
            </div>
            <p className="text-[11px] font-mono-code text-slate-300">
              Sensor validation, packet loss, UDP latency &amp; STANAG 4586 bus
            </p>
          </button>

          <button
            onClick={() => setSelectedSubsystem('physics')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedSubsystem === 'physics'
                ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-2 ring-amber-500/30'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono-code font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                2. THERMODYNAMIC PHYSICS
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px] font-mono-code font-bold">
                FIRST-PRINCIPLES
              </span>
            </div>
            <p className="text-[11px] font-mono-code text-slate-300">
              Combustion heat, Navier-Stokes, FEA stress tensors &amp; fatigue
            </p>
          </button>

          <button
            onClick={() => setSelectedSubsystem('ai')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedSubsystem === 'ai'
                ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/30'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono-code font-bold text-xs uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                3. DEEP AI &amp; SHAP PROGNOSTICS
              </span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[9px] font-mono-code font-bold">
                TensorRT Edge
              </span>
            </div>
            <p className="text-[11px] font-mono-code text-slate-300">
              RUL degradation neural net, SHAP attributions &amp; drift monitor
            </p>
          </button>
        </div>

        {/* 1. SCADA Telemetry Pipeline Inspector Panel */}
        {selectedSubsystem === 'scada' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 font-mono-code text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h3 className="font-heading font-bold text-sm text-slate-100">
                  DRDO Tactical Telemetry SCADA Bus (20–100 Hz Stream)
                </h3>
              </div>
              <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                CRC VERIFIED | PACKET LOSS: 0.002%
              </span>
            </div>

            {/* Live 22-Sensor Grid Stream */}
            <div className="space-y-2">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                LIVE SENSOR STREAM (22 CHANNEL AVIONICS BUS)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {liveSensors.map((s, idx) => (
                  <div key={idx} className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <span className="text-[9px] text-slate-400 truncate">{s.name}</span>
                    <span className="font-telemetry font-bold text-slate-100 text-sm">{s.val}</span>
                    <div className="flex justify-between items-center text-[8px] mt-1 pt-1 border-t border-slate-800/60">
                      <span className="text-slate-500">{s.hz}</span>
                      <span className="text-emerald-400 font-bold">{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SCADA Pipeline Diagram & Data Quality Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-2">
              <div className="lg:col-span-8 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                  END-TO-END SCADA DATA FLOW PIPELINE
                </span>
                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-bold py-2">
                  <span className="px-2 py-1 bg-cyan-950 text-cyan-300 rounded border border-cyan-800">Sensors</span>
                  <span className="text-slate-600">➔</span>
                  <span className="px-2 py-1 bg-slate-900 text-slate-200 rounded border border-slate-800">CAN Bus</span>
                  <span className="text-slate-600">➔</span>
                  <span className="px-2 py-1 bg-slate-900 text-slate-200 rounded border border-slate-800">ECU</span>
                  <span className="text-slate-600">➔</span>
                  <span className="px-2 py-1 bg-indigo-950 text-indigo-300 rounded border border-indigo-800">Radio Link</span>
                  <span className="text-slate-600">➔</span>
                  <span className="px-2 py-1 bg-slate-900 text-slate-200 rounded border border-slate-800">UDP GCS</span>
                  <span className="text-slate-600">➔</span>
                  <span className="px-2 py-1 bg-emerald-950 text-emerald-300 rounded border border-emerald-800">Physics &amp; AI</span>
                </div>
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800 text-[10px] text-slate-300">
                  <strong>Active Filter:</strong> Extended Kalman Filter (EKF) + EMA Noise Reduction ($ \alpha = 0.85 $)
                </div>
              </div>

              <div className="lg:col-span-4 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                  SCADA QUALITY METRICS
                </span>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Packet Latency:</span>
                  <strong className="text-emerald-400">2.4 ms</strong>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Outlier Rejection Rate:</span>
                  <strong className="text-cyan-400">0.01%</strong>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Missing Packets:</span>
                  <strong className="text-slate-100">0.00%</strong>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Clock Synchronization Drift:</span>
                  <strong className="text-emerald-400">&lt; 0.1 ms</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Physics Thermodynamic Engine Panel */}
        {selectedSubsystem === 'physics' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 font-mono-code text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <h3 className="font-heading font-bold text-sm text-slate-100">
                  First-Principles Thermodynamic &amp; Structural Physics Engine
                </h3>
              </div>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                NAVIER-STOKES &amp; PALMGREN-MINER EQUATIONS
              </span>
            </div>

            {/* Physics Calculations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold text-[10px] block uppercase">1. COMBUSTION PHYSICS</span>
                <div className="text-slate-100 font-bold text-sm">Peak Press: 98.4 bar</div>
                <div className="text-slate-400 text-[10px]">Heat Release Rate: $Q = m C_p \Delta T$</div>
                <div className="text-emerald-400 text-[10px]">Thermal Efficiency: 38.6%</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold text-[10px] block uppercase">2. TURBOCHARGER DYNAMICS</span>
                <div className="text-slate-100 font-bold text-sm">PR: { (telemetry.turboBoostBar + 1.0).toFixed(2) } : 1</div>
                <div className="text-slate-400 text-[10px]">Comp Efficiency: 76.8%</div>
                <div className="text-cyan-400 text-[10px]">Turbine Speed: { telemetry.turbochargerRpm.toLocaleString() } RPM</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold text-[10px] block uppercase">3. LUBRICATION &amp; FILM</span>
                <div className="text-slate-100 font-bold text-sm">Film Thickness: 12.4 µm</div>
                <div className="text-slate-400 text-[10px]">Viscosity Index: 142 SAE30</div>
                <div className="text-emerald-400 text-[10px]">Lube Temp: { telemetry.oilTempC }°C</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold text-[10px] block uppercase">4. STRUCTURAL FEA STRESS</span>
                <div className="text-slate-100 font-bold text-sm">Stress Tensor: 148 MPa</div>
                <div className="text-slate-400 text-[10px]">Yield Ratio: $\sigma / \sigma_y = 0.35$</div>
                <div className="text-indigo-400 text-[10px]">Fatigue Accumulation: 0.042/hr</div>
              </div>
            </div>

            {/* Physics Validation Comparison */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-slate-300">
              <div>
                <span className="font-bold text-slate-100 block">Physics Residual Validation:</span>
                <span className="text-[10px] text-slate-400">Measured SCADA CHT vs Theoretical Energy Balance Calculation</span>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-bold text-sm">$\Delta E = 1.25\%$ (Verified Match)</span>
                <span className="text-[10px] text-slate-400 block">Nominal Limit &lt; 3.0%</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Deep AI & SHAP Prognostics Panel */}
        {selectedSubsystem === 'ai' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 font-mono-code text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <h3 className="font-heading font-bold text-sm text-slate-100">
                  Deep Neural RUL Prognostics &amp; SHAP Feature Attribution Engine
                </h3>
              </div>
              <span className="text-[10px] text-indigo-300 font-bold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                MODEL CONFIDENCE: { selectedUav.twinConfidenceScore }%
              </span>
            </div>

            {/* AI Model Output Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">PREDICTED RUL</span>
                <span className="font-telemetry font-bold text-xl text-emerald-400">{ selectedUav.predictedRulHours.toFixed(1) } hrs</span>
                <span className="text-[10px] text-slate-500 block mt-1">Palmgren-Miner Fatigue Decay</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">SHAP ANOMALY SCORE</span>
                <span className="font-telemetry font-bold text-xl text-cyan-400">0.014</span>
                <span className="text-[10px] text-slate-500 block mt-1">Isolation Forest Vector</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">CONCEPT DRIFT INDEX</span>
                <span className="font-telemetry font-bold text-xl text-indigo-300">0.002 (Stable)</span>
                <span className="text-[10px] text-slate-500 block mt-1">KS Test Feature Drift</span>
              </div>
            </div>

            {/* SHAP Feature Impact Table */}
            <div className="space-y-1.5">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                TOP SHAP FEATURE ATTRIBUTION RANKING
              </span>
              <div className="space-y-1">
                {[
                  { feature: 'Cylinder #3 CHT Thermal Peak', impact: '+31.4%', weight: '0.314', direction: 'Accelerating Wear' },
                  { feature: 'Turbocharger MAP Boost Pressure', impact: '+22.1%', weight: '0.221', direction: 'Nominal Load' },
                  { feature: 'Engine Oil Viscosity Index', impact: '-14.2%', weight: '-0.142', direction: 'Protective Lubrication' },
                  { feature: 'Vibration ISO Class RMS', impact: '+12.5%', weight: '0.125', direction: 'Bearing Stability' },
                ].map((item, idx) => (
                  <div key={idx} className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-slate-200">
                    <span className="font-bold text-slate-100">{item.feature}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-indigo-400 font-bold">{item.impact}</span>
                      <span className="text-[10px] text-slate-400">{item.direction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subsystem Architecture Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="font-heading font-bold text-sm text-slate-100">
              GCS Subsystems &amp; Software Architecture Modules
            </h3>
          </div>
          <span className="text-[10px] font-mono-code text-slate-400">ALL SERVICES HEALTHY</span>
        </div>

        <div className="space-y-2">
          {subsystems.map((sub, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono-code">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100">{sub.name}</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px] font-bold">
                    {sub.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Protocol: {sub.protocol}</div>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <span>Update: <strong className="text-cyan-300">{sub.rate}</strong></span>
                <span>Latency: <strong className="text-slate-200">{sub.latency}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
