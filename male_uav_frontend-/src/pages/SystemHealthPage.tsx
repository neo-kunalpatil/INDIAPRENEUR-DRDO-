import React from 'react';
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

export const SystemHealthPage: React.FC = () => {
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

      {/* Subsystem Architecture Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="font-heading font-bold text-sm text-slate-100">
              GCS Subsystems & Software Architecture Modules
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
