import React from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  Shield, 
  ExternalLink,
  Target,
  Award
} from 'lucide-react';
import { useGcs } from '../../contexts/GcsContext';
import { DEMO_TOUR_STEPS } from '../../constants';

export const DemoTourModal: React.FC = () => {
  const { 
    isTourActive, 
    currentTourStep, 
    nextTourStep, 
    prevTourStep, 
    endDemoTour, 
    currentTourData,
    setActiveTab 
  } = useGcs();

  if (!isTourActive || !currentTourData) return null;

  const totalSteps = DEMO_TOUR_STEPS.length;
  const progressPercent = ((currentTourStep + 1) / totalSteps) * 100;

  const jumpToStep = (index: number) => {
    const target = DEMO_TOUR_STEPS[index];
    setActiveTab(target.pageTarget === '/' ? 'dashboard' : target.pageTarget.replace('/', ''));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-lg w-full bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl shadow-2xl shadow-amber-950/80 backdrop-blur-xl p-5 text-slate-100 animate-in fade-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500 text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                JUDGE EVALUATION TOUR
              </span>
              <span className="text-xs font-mono-code text-slate-400">
                Step {currentTourStep + 1} of {totalSteps}
              </span>
            </div>
            <h3 className="font-heading font-bold text-base text-slate-100 mt-0.5">
              {currentTourData.title}
            </h3>
          </div>
        </div>

        <button
          onClick={endDemoTour}
          className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          title="Exit Tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden my-3">
        <div 
          className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Innovation Highlight Badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
          INNOVATION #{currentTourData.innovationNumber}
        </span>
        <span className="text-xs font-heading font-semibold text-cyan-200">
          {currentTourData.innovationName}
        </span>
      </div>

      {/* Content */}
      <p className="text-xs text-slate-300 leading-relaxed mb-3">
        {currentTourData.summary}
      </p>

      {/* Defense Impact Box */}
      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 mb-3 text-xs">
        <div className="flex items-center gap-1.5 text-amber-400 font-mono-code text-[11px] font-bold mb-1">
          <Shield className="w-3.5 h-3.5" />
          <span>DRDO & DEFENCE OPERATIONAL VALUE:</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          {currentTourData.defenceImpact}
        </p>
      </div>

      {/* Demonstration Action Box */}
      <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 mb-4 text-xs">
        <div className="flex items-center gap-1.5 text-cyan-300 font-mono-code text-[11px] font-bold mb-0.5">
          <Target className="w-3.5 h-3.5 text-cyan-400" />
          <span>TRY THIS INTERACTION:</span>
        </div>
        <p className="text-cyan-200 text-[11px]">
          {currentTourData.demonstrationAction}
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-1">
          {DEMO_TOUR_STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                const target = DEMO_TOUR_STEPS[idx];
                setActiveTab(target.pageTarget === '/' ? 'dashboard' : target.pageTarget.replace('/', ''));
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentTourStep ? 'w-5 bg-amber-400' : 'bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevTourStep}
            disabled={currentTourStep === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-heading font-semibold text-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <button
            onClick={nextTourStep}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-heading font-bold shadow-md shadow-amber-950/50"
          >
            <span>{currentTourStep === totalSteps - 1 ? 'Finish Tour' : 'Next Innovation'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
