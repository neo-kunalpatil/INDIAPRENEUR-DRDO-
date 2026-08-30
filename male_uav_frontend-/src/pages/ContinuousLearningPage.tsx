import React from 'react';
import { 
  BrainCircuit, 
  TrendingUp, 
  Database, 
  RefreshCw, 
  ShieldCheck, 
  GitMerge, 
  Sliders,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';

export const ContinuousLearningPage: React.FC = () => {
  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              Continuous Edge Learning & Self-Adapting Thresholds (Innovation #12 & #20)
            </h1>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono-code font-bold">
              MODEL GENERATION: v4.2.8
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            Dynamic threshold boundary adaptation that evolves with engine operating age, preventing false alarms from normal wear
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-heading font-bold transition-all shadow-md">
          <RefreshCw className="w-4 h-4" />
          <span>Sync Edge Model Weights</span>
        </button>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Aggregated Flight Hours"
          value="14,820h"
          status="NORMAL"
          change="+420h this month"
          changeType="positive"
          icon={Database}
          subtext="DRDO TAPAS & Archer Fleet"
        />
        <MetricCard
          title="Adaptive Threshold Drift"
          value="±3.4%"
          status="HIGHLIGHT"
          change="Accommodating 483h engine aging"
          changeType="positive"
          icon={Sliders}
          subtext="Zero nuisance false alarms"
        />
        <MetricCard
          title="Edge Model Accuracy"
          value="99.4%"
          status="NORMAL"
          change="Validated against test cell"
          changeType="positive"
          icon={ShieldCheck}
          subtext="DRDO Propulsion Test Cell 4"
        />
        <MetricCard
          title="Federated Fleet Sync"
          value="5 / 5 UAVs"
          status="NORMAL"
          change="All nodes converged"
          changeType="positive"
          icon={GitMerge}
          subtext="Ku-Band burst sync"
        />
      </div>

      {/* Adaptive Threshold vs Rigid Threshold Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h3 className="font-heading font-bold text-sm text-slate-100">
                Static Hardcoded Limits (Legacy Approach)
              </h3>
            </div>
            <span className="text-[10px] font-mono-code text-red-400">HIGH FALSE ALARMS</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono-code text-slate-300 space-y-2">
            <p>❌ Treats a brand new 0-hour engine the same as a 450-hour seasoned aero engine.</p>
            <p>❌ Causes frequent nuisance cockpit alarms as slight natural clearance wear occurs.</p>
            <p>❌ Operators suffer alarm fatigue and begin ignoring genuine alerts.</p>
          </div>
        </div>

        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="font-heading font-bold text-sm text-slate-100">
                DRDO AI Adaptive Health Boundaries (Innovation #12)
              </h3>
            </div>
            <span className="text-[10px] font-mono-code text-emerald-400">0% NUISANCE ALARMS</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono-code text-slate-300 space-y-2">
            <p>✅ Mathematically models normal thermal/vibration expansion curves as flight hours accumulate.</p>
            <p>✅ Automatically widens tolerance bands for benign wear while narrowing for critical failure modes.</p>
            <p>✅ Isolates true catastrophic precursors (e.g. valve burn, bearing spalling) instantly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
