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
  Info,
  Network,
  GitBranch,
  ArrowRight,
  Zap,
  HardDrive
} from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';

export const SystemHealthPage: React.FC = () => {
  const [selectedArchNode, setSelectedArchNode] = useState<string>('SCADA Sensors');
  const [tracedParameter, setTracedParameter] = useState<'EGT' | 'CHT' | 'RPM' | 'OIL_PRESS'>('EGT');

  const archNodes: Record<string, {
    purpose: string;
    status: 'OPERATIONAL' | 'DEGRADED';
    inputs: string;
    outputs: string;
    latency: string;
    dataRate: string;
    health: number;
    errors: number;
    upstream: string[];
    downstream: string[];
  }> = {
    'SCADA Sensors': {
      purpose: 'Acquires raw 22-channel analog & digital sensor signals from engine sensors.',
      status: 'OPERATIONAL',
      inputs: 'Rotax 914-TC Thermocouples & Piezo Transducers',
      outputs: 'Analog Voltages & CAN Frames',
      latency: '0.4 ms',
      dataRate: '100 Hz',
      health: 99.8,
      errors: 0,
      upstream: [],
      downstream: ['Telemetry Pipeline']
    },
    'Telemetry Pipeline': {
      purpose: 'C-Band UDP Multicast reception, CRC polynomial validation & Kalman filtering.',
      status: 'OPERATIONAL',
      inputs: 'Raw CAN Bus & Radio UDP Stream',
      outputs: 'Validated Telemetry JSON Stream',
      latency: '2.1 ms',
      dataRate: '50 Hz',
      health: 99.9,
      errors: 0,
      upstream: ['SCADA Sensors'],
      downstream: ['Physics Engine', 'Digital Twin']
    },
    'Physics Engine': {
      purpose: 'Solves Navier-Stokes thermodynamics, Otto compression & FEA stress equations.',
      status: 'OPERATIONAL',
      inputs: 'Validated Telemetry Stream',
      outputs: 'Derived Thermodynamic Physics Vector (Q, Pmax, σ)',
      latency: '0.8 ms',
      dataRate: '100 Hz',
      health: 99.7,
      errors: 0,
      upstream: ['Telemetry Pipeline'],
      downstream: ['Feature Engineering', 'Hybrid Verification']
    },
    'Feature Engineering': {
      purpose: 'Computes Palmgren-Miner fatigue accumulation, EGT spread & vibration FFT bins.',
      status: 'OPERATIONAL',
      inputs: 'SCADA Telemetry + Physics Vectors',
      outputs: '128-dimensional Normalized Feature Tensor',
      latency: '1.1 ms',
      dataRate: '50 Hz',
      health: 99.6,
      errors: 0,
      upstream: ['Physics Engine'],
      downstream: ['AI Prediction Engine']
    },
    'AI Prediction Engine': {
      purpose: 'Deep Edge-Transformer & XGBoost prognosis computing remaining useful life (RUL).',
      status: 'OPERATIONAL',
      inputs: 'Normalized Feature Tensors',
      outputs: 'RUL (Hours) & Component Failure Probabilities',
      latency: '1.4 ms',
      dataRate: '10 Hz',
      health: 99.2,
      errors: 0,
      upstream: ['Feature Engineering'],
      downstream: ['SHAP Explainability', 'Mission Decision']
    },
    'SHAP Explainability': {
      purpose: 'TreeSHAP feature importance calculation providing positive & negative attributions.',
      status: 'OPERATIONAL',
      inputs: 'Neural Model Weights & Gradient Tensors',
      outputs: 'SHAP Feature Contribution % & Root Cause Ranking',
      latency: '3.2 ms',
      dataRate: '5 Hz',
      health: 98.9,
      errors: 0,
      upstream: ['AI Prediction Engine'],
      downstream: ['Mission Decision', 'Intelligence Reports']
    },
    'Mission Decision': {
      purpose: 'Evaluates mission risk score and issues GO / NO-GO flight recommendations.',
      status: 'OPERATIONAL',
      inputs: 'RUL, Failure Probabilities & Mission Profile',
      outputs: 'Verdict (GO / NO-GO / RE-ROUTE)',
      latency: '0.2 ms',
      dataRate: 'Continuous',
      health: 100,
      errors: 0,
      upstream: ['AI Prediction Engine', 'SHAP Explainability'],
      downstream: ['Digital Twin', 'Fleet Monitoring', 'Smart Maintenance', 'Alert Center', 'Reports']
    }
  };

  const egtTraceSteps = [
    { step: 1, node: 'Cylinder #3 EGT Thermocouple', desc: 'Raw Analog Voltage generated (14.2 mV)', time: 'T+0.0ms' },
    { step: 2, node: 'CAN Bus & Rotax ECU', desc: 'Digitized to 710.0°C CAN Frame (ID 0x204)', time: 'T+0.4ms' },
    { step: 3, node: 'GCS Telemetry SCADA Pipeline', desc: 'UDP Multicast Packet verified via CRC-32', time: 'T+2.1ms' },
    { step: 4, node: 'Physics Thermodynamic Engine', desc: 'Heat Flux Q calculated (42.8 kW)', time: 'T+2.9ms' },
    { step: 5, node: 'Feature Engineering Vector', desc: 'EGT spread computed (+18.4°C over avg)', time: 'T+4.0ms' },
    { step: 6, node: 'Deep AI Prediction Engine', desc: 'Incipient exhaust valve wear predicted', time: 'T+5.4ms' },
    { step: 7, node: 'SHAP XAI Explainer', desc: 'EGT attributed +31% impact on RUL decay', time: 'T+8.6ms' },
    { step: 8, node: 'Mission Decision Engine', desc: 'Issued GO FLIGHT verdict with Loiter warning', time: 'T+8.8ms' },
    { step: 9, node: 'Smart Maintenance Advisor', desc: 'Scheduled Exhaust Valve inspection at 25h', time: 'T+9.0ms' }
  ];

  const currentArchNodeData = archNodes[selectedArchNode] || archNodes['SCADA Sensors'];

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto font-mono-code text-xs">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h1 className="font-heading font-bold text-xl text-slate-100">
              DRDO Real-Time System Architecture &amp; Data Flow Subsystem
            </h1>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono-code font-bold">
              SYSTEM AVAILABILITY: 99.98%
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            Interactive system dependency graph, live telemetry trace explorer, CPU/Memory telemetry &amp; node latencies
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs font-mono-code">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>CYBERSECURITY GATE: <strong className="text-emerald-300 font-bold">AES-256 ENCRYPTED</strong></span>
        </div>
      </div>

      {/* System Resource Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <span className="text-slate-500 text-[10px] block font-bold">EDGE CPU LOAD</span>
          <span className="font-telemetry font-bold text-lg text-emerald-400">18.4%</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">8 Cores Active</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <span className="text-slate-500 text-[10px] block font-bold">MEMORY ALLOCATION</span>
          <span className="font-telemetry font-bold text-lg text-cyan-400">4.2 / 16 GB</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">26.2% Consumed</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <span className="text-slate-500 text-[10px] block font-bold">PACKET THROUGHPUT</span>
          <span className="font-telemetry font-bold text-lg text-slate-100">1,480 / sec</span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">0 Dropped Packets</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <span className="text-slate-500 text-[10px] block font-bold">AVG END-TO-END LATENCY</span>
          <span className="font-telemetry font-bold text-lg text-indigo-400">9.0 ms</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Sensor → Report</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <span className="text-slate-500 text-[10px] block font-bold">QUEUE DEPTH</span>
          <span className="font-telemetry font-bold text-lg text-emerald-400">0 Frames</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Real-time SIMD Ring</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <span className="text-slate-500 text-[10px] block font-bold">GCS SYNC STATUS</span>
          <span className="font-telemetry font-bold text-lg text-emerald-400">100% OK</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">NTP Time Lock</span>
        </div>
      </div>

      {/* Interactive System Dependency Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Clickable Architecture Node Graph */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-heading font-bold text-sm text-slate-200 flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              <span>LIVE SYSTEM ARCHITECTURE DEPENDENCY GRAPH</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">CLICK NODE TO INSPECT UPSTREAM &amp; DOWNSTREAM</span>
          </div>

          <div className="space-y-3 py-2">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {Object.keys(archNodes).slice(0, 4).map(nodeName => (
                <button
                  key={nodeName}
                  onClick={() => setSelectedArchNode(nodeName)}
                  className={`p-3 rounded-xl border transition-all text-left min-w-[150px] ${
                    selectedArchNode === nodeName
                      ? 'bg-cyan-950 border-cyan-500 shadow-lg ring-2 ring-cyan-400/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-100 block">{nodeName}</span>
                  <span className="text-[9px] text-cyan-400 block font-mono-code">{archNodes[nodeName].dataRate} | {archNodes[nodeName].latency}</span>
                </button>
              ))}
            </div>

            <div className="text-center text-cyan-500 font-bold animate-pulse text-sm">↓ PIPELINE DATA FLOW VECTOR ↓</div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              {Object.keys(archNodes).slice(4).map(nodeName => (
                <button
                  key={nodeName}
                  onClick={() => setSelectedArchNode(nodeName)}
                  className={`p-3 rounded-xl border transition-all text-left min-w-[150px] ${
                    selectedArchNode === nodeName
                      ? 'bg-cyan-950 border-cyan-500 shadow-lg ring-2 ring-cyan-400/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-100 block">{nodeName}</span>
                  <span className="text-[9px] text-indigo-400 block font-mono-code">{archNodes[nodeName].dataRate} | {archNodes[nodeName].latency}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Selected Node Telemetry Inspector */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="font-heading font-bold text-sm text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>NODE INSPECTOR: {selectedArchNode}</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block font-bold uppercase">PURPOSE</span>
              <p className="text-slate-200 text-[11px]">{currentArchNodeData.purpose}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block font-bold">LATENCY</span>
                <span className="font-telemetry font-bold text-emerald-400">{currentArchNodeData.latency}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block font-bold">HEALTH</span>
                <span className="font-telemetry font-bold text-cyan-400">{currentArchNodeData.health}%</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold text-[10px] block uppercase">UPSTREAM PROVIDERS:</span>
              <div className="flex gap-1 flex-wrap">
                {currentArchNodeData.upstream.length > 0 ? (
                  currentArchNodeData.upstream.map(u => (
                    <span key={u} className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                      {u}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-[10px]">None (Origin Node)</span>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold text-[10px] block uppercase">DOWNSTREAM CONSUMERS:</span>
              <div className="flex gap-1 flex-wrap">
                {currentArchNodeData.downstream.map(d => (
                  <span key={d} className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-700 text-[10px] font-bold">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* End-to-End Data Flow Tracer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-heading font-bold text-sm text-slate-200 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-amber-400" />
            <span>END-TO-END TELEMETRY SIGNAL TRACE EXPLORER (CYLINDER #3 EGT DATA PATH)</span>
          </h3>
          <span className="text-[10px] text-amber-400 font-bold">9 STAGE PIPELINE AUDITED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-2">
          {egtTraceSteps.map((step) => (
            <div key={step.step} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1 hover:border-amber-500 transition-all">
              <div className="flex justify-between items-center text-[9px] text-amber-400 font-bold">
                <span>STEP {step.step}</span>
                <span>{step.time}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-100 block truncate">{step.node}</span>
              <p className="text-[9px] text-slate-400 leading-tight">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
