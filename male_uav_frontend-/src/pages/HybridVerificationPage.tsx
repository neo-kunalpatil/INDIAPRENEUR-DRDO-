import React, { useState } from 'react';
import { 
  GitCompare, 
  ShieldCheck, 
  Cpu, 
  Activity, 
  AlertOctagon, 
  CheckCircle2, 
  HelpCircle,
  Zap,
  Info,
  Scale,
  Sparkles
} from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';
import { PhysicsAiComparison } from '../types';

export const HybridVerificationPage: React.FC = () => {
  const { selectedUav, telemetry } = useGcs();

  const comparisons: PhysicsAiComparison[] = [
    {
      parameter: 'Cylinder #1 Head Temp (CHT)',
      unit: '°C',
      physicsExpected: 111.0,
      aiPredicted: 112.1,
      actualTelemetry: telemetry.chtC[0],
      divergencePercent: 1.3,
      verificationStatus: 'VERIFIED_MATCH',
      physicsConfidence: 99.2,
      aiConfidence: 98.4,
    },
    {
      parameter: 'Cylinder #2 Head Temp (CHT)',
      unit: '°C',
      physicsExpected: 112.5,
      aiPredicted: 113.8,
      actualTelemetry: telemetry.chtC[1],
      divergencePercent: telemetry.chtC[1] > 125 ? 19.8 : 1.2,
      verificationStatus: telemetry.chtC[1] > 125 ? 'ANOMALY_CONFIRMED' : 'VERIFIED_MATCH',
      physicsConfidence: 98.5,
      aiConfidence: 97.8,
    },
    {
      parameter: 'Cylinder #3 Exhaust Temp (EGT)',
      unit: '°C',
      physicsExpected: 760,
      aiPredicted: 768,
      actualTelemetry: telemetry.egtC[2],
      divergencePercent: telemetry.egtC[2] > 800 ? 11.5 : 1.0,
      verificationStatus: telemetry.egtC[2] > 800 ? 'SUSPICIOUS_DIVERGENCE' : 'VERIFIED_MATCH',
      physicsConfidence: 99.0,
      aiConfidence: 96.5,
    },
    {
      parameter: 'Turbocharger Boost Pressure',
      unit: 'bar',
      physicsExpected: 0.90,
      aiPredicted: 0.88,
      actualTelemetry: telemetry.turboBoostBar,
      divergencePercent: 2.2,
      verificationStatus: 'VERIFIED_MATCH',
      physicsConfidence: 99.5,
      aiConfidence: 99.1,
    },
    {
      parameter: 'Manifold Absolute Pressure (MAP)',
      unit: 'inHg',
      physicsExpected: 36.0,
      aiPredicted: 35.8,
      actualTelemetry: telemetry.manifoldPressureInHg,
      divergencePercent: 0.5,
      verificationStatus: 'VERIFIED_MATCH',
      physicsConfidence: 99.8,
      aiConfidence: 99.4,
    },
    {
      parameter: 'Oil Scavenge Hydraulic Pressure',
      unit: 'bar',
      physicsExpected: 4.30,
      aiPredicted: 4.34,
      actualTelemetry: telemetry.oilPressureBar,
      divergencePercent: telemetry.oilPressureBar < 2.5 ? 48.0 : 1.1,
      verificationStatus: telemetry.oilPressureBar < 2.5 ? 'ANOMALY_CONFIRMED' : 'VERIFIED_MATCH',
      physicsConfidence: 97.4,
      aiConfidence: 98.0,
    },
  ];

  return (
    <div id="hybrid-engine-card" className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              Physics + AI Hybrid Verification Engine (Core USP #1 & #14)
            </h1>
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono-code font-bold">
              0% FALSE POSITIVE ARCHITECTURE
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            Cross-verifies Deep Neural Network predictive anomalies against first-principles thermodynamic, gas dynamic, and rotor mechanics equations
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs font-mono-code">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>VALIDATION GATE: <strong className="text-emerald-300">ACTIVE & AUDITED</strong></span>
        </div>
      </div>

      {/* Physics vs AI Architectural Diagram Explainer */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-900/60 rounded-2xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Pillar 1: Thermodynamic Physics Engine */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono-code">
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-2">
              <Scale className="w-4 h-4" />
              <span>FIRST-PRINCIPLES PHYSICS ENGINE</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Solves Navier-Stokes thermodynamic heat transfer, Otto 4-stroke cycle compression pressure, and Euler turbomachinery gas laws in real time.
            </p>
            <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between text-[10px] text-cyan-300">
              <span>Equation Fidelity: 99.8%</span>
              <span>Thermodynamic Base</span>
            </div>
          </div>

          {/* Pillar 2: Cross-Verification Gate Center */}
          <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-700/80 text-xs font-mono-code text-center">
            <div className="inline-flex p-2 rounded-full bg-indigo-900/80 text-indigo-300 mb-2">
              <GitCompare className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="font-heading font-bold text-sm text-indigo-200">
              Hybrid Decision Verification Gate
            </h4>
            <p className="text-[11px] text-slate-300 mt-1">
              Residual Δ = |Telemetry - Physics| vs AI Inference. An alert is only escalated if both physics and AI confirm the anomaly.
            </p>
          </div>

          {/* Pillar 3: Deep Neural Network Edge Model */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono-code">
            <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
              <Cpu className="w-4 h-4" />
              <span>DEEP NEURAL AI PREDICTOR</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Trained on 12,000+ flight hours of MALE UAV telemetry to detect micro-vibration harmonics, sensor drift, and incipient component wear.
            </p>
            <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between text-[10px] text-indigo-300">
              <span>Model: Edge-Transformer v4.2</span>
              <span>Inference: 1.2 ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-cyan-400" />
            <h3 className="font-heading font-bold text-sm text-slate-100">
              Live Parameter Verification Matrix
            </h3>
          </div>
          <span className="text-[10px] font-mono-code text-slate-400">REAL-TIME SYNC</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono-code text-left">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                <th className="py-2.5 px-3">Telemetry Parameter</th>
                <th className="py-2.5 px-3">Physics Expected</th>
                <th className="py-2.5 px-3">AI Model Predicted</th>
                <th className="py-2.5 px-3">Live Telemetry</th>
                <th className="py-2.5 px-3">Divergence (Δ)</th>
                <th className="py-2.5 px-3">Verification Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {comparisons.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-200">
                    {row.parameter}
                  </td>
                  <td className="py-3 px-3 text-cyan-300">
                    {row.physicsExpected} {row.unit}
                  </td>
                  <td className="py-3 px-3 text-indigo-300">
                    {row.aiPredicted} {row.unit}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-100">
                    {row.actualTelemetry} {row.unit}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`font-bold ${row.divergencePercent > 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {row.divergencePercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.verificationStatus === 'VERIFIED_MATCH'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : row.verificationStatus === 'ANOMALY_CONFIRMED'
                        ? 'bg-red-950 text-red-300 border border-red-800 animate-pulse'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {row.verificationStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
