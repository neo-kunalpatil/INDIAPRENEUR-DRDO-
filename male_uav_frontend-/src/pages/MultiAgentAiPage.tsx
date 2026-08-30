import React, { useState } from 'react';
import { 
  Bot, 
  Cpu, 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Layers, 
  GitBranch, 
  ShieldCheck, 
  Terminal,
  Sparkles
} from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';

export const MultiAgentAiPage: React.FC = () => {
  const { telemetry } = useGcs();
  const [selectedAgent, setSelectedAgent] = useState<string>('health');

  const agents = [
    {
      id: 'sensor',
      name: 'Sensor Fusion & Sanity Agent',
      role: 'Telemetry Ingestion & Noise Filtering',
      status: 'ONLINE',
      latency: '0.4 ms',
      confidence: 99.8,
      activeOutput: '20 Hz SCADA datastream validated. Zero thermocouple packet dropouts.',
      subsystem: 'Input Preprocessing',
    },
    {
      id: 'health',
      name: 'Thermodynamic Health Agent',
      role: 'Adaptive Health Index (AHI) Computation',
      status: 'ONLINE',
      latency: '1.2 ms',
      confidence: 98.4,
      activeOutput: `Engine AHI: 94.2%. CHT Bank 1/2 parity nominal. Cylinder #3 EGT monitoring active.`,
      subsystem: 'Diagnostic Core',
    },
    {
      id: 'physics',
      name: 'First-Principles Physics Agent',
      role: 'Thermodynamic Equation Verification',
      status: 'ONLINE',
      latency: '0.8 ms',
      confidence: 99.5,
      activeOutput: `Simulating Otto 4-stroke cycle at ${telemetry.rpm} RPM. Residual Δ: 1.1% (Safe).`,
      subsystem: 'Validation Gate',
    },
    {
      id: 'prediction',
      name: 'Prognostic RUL Predictor Agent',
      role: 'Mission-Aware Deep-Survival Forecasting',
      status: 'ONLINE',
      latency: '2.5 ms',
      confidence: 96.2,
      activeOutput: 'Forecasting 142.6 flight hours remaining under current FL220 atmospheric density.',
      subsystem: 'Forecasting Node',
    },
    {
      id: 'maintenance',
      name: 'Prescriptive Maintenance Agent',
      role: 'Action & Work Order Synthesis',
      status: 'ONLINE',
      latency: '1.8 ms',
      confidence: 98.9,
      activeOutput: 'Next prescriptive action: 50h depot oil scavenge filter change in 18.5h.',
      subsystem: 'Executive Synthesis',
    },
  ];

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              Multi-Agent AI Diagnostic & Prognostic Pipeline (Innovation #22)
            </h1>
            <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono-code font-bold">
              5 SPECIALIZED EDGE AGENTS
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            Distributed asynchronous multi-agent architecture for real-time aero piston engine diagnostics, verification, and prescriptive maintenance
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs font-mono-code">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>CONSENSUS PROTOCOL: <strong className="text-emerald-300">100% UNANIMOUS</strong></span>
        </div>
      </div>

      {/* Horizontal Interactive Agent Pipeline */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[900px] gap-3">
          {agents.map((agent, idx) => {
            const isSelected = agent.id === selectedAgent;

            return (
              <React.Fragment key={agent.id}>
                <div
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`flex-1 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono-code mb-1">
                    <span className="text-indigo-400 font-bold">AGENT #{idx + 1}</span>
                    <span className="text-emerald-400 font-bold">● {agent.status}</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-slate-100 mb-1">{agent.name}</h4>
                  <div className="text-[10px] font-mono-code text-slate-400">{agent.role}</div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono-code">
                    <span className="text-slate-500">Latency: {agent.latency}</span>
                    <span className="text-indigo-300 font-bold">{agent.confidence}%</span>
                  </div>
                </div>

                {idx < agents.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Agent Deep Inspection Card */}
      {(() => {
        const activeAgentObj = agents.find(a => a.id === selectedAgent) || agents[0];

        return (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-xs font-mono-code">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-700 text-indigo-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase">{activeAgentObj.subsystem}</span>
                  <h3 className="font-heading font-bold text-base text-slate-100">{activeAgentObj.name}</h3>
                </div>
              </div>

              <span className="px-3 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                INFERENCE LATENCY: {activeAgentObj.latency}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block mb-1">REAL-TIME INFERENCE OUTPUT:</span>
                <p className="text-slate-200 text-xs leading-relaxed">{activeAgentObj.activeOutput}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block mb-1">SECURITY & REDUNDANCY:</span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Decentralized edge compute prevents single point of failure. Fallback to physical backup maps in 5ms if inference confidence drops below 85%.
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
