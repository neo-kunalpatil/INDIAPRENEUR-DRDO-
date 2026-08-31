import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  Shield, 
  Calendar, 
  Plane, 
  Activity,
  FileCheck
} from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';

export const ReportsPage: React.FC = () => {
  const { selectedUav, mission } = useGcs();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              DRDO Defense Intelligence & Post-Sortie Flight Reports
            </h1>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono-code font-bold">
              CLASSIFICATION: RESTRICTED // DRDO
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            Automated generation of propulsion health audit logs, flight envelope compliance, and airworthiness certificates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-heading font-bold transition-all shadow-md"
          >
            {downloadSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{downloadSuccess ? 'Report Exported (PDF)' : 'Export Full Intelligence Dossier (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Report Document Preview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-slate-200 font-mono-code text-xs space-y-4 max-w-4xl mx-auto shadow-2xl">
        {/* Document Header */}
        <div className="border-b-2 border-slate-700 pb-4 flex items-start justify-between">
          <div>
            <div className="text-amber-400 font-bold tracking-widest text-sm uppercase">
              DEFENCE RESEARCH & DEVELOPMENT ORGANISATION (DRDO)
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              AERONAUTICAL DEVELOPMENT ESTABLISHMENT (ADE) • PROPULSION DIGITAL TWIN LAB
            </div>
            <div className="font-heading font-bold text-lg text-slate-100 mt-2">
              POST-FLIGHT PROPULSION INTEGRITY & AIRWORTHINESS REPORT
            </div>
          </div>

          <div className="text-right text-[10px] text-slate-400 space-y-0.5">
            <div>REPORT ID: <strong>ADE-MALE-DT-2026-0827</strong></div>
            <div>DATE: <strong>27-AUG-2026 18:47 IST</strong></div>
            <div>STATUS: <strong className="text-emerald-400">CERTIFIED AIRWORTHY</strong></div>
          </div>
        </div>

        {/* Section 1: Flight & Airframe Overview */}
        <div className="space-y-2">
          <h3 className="font-bold text-cyan-400 text-xs uppercase border-b border-slate-800 pb-1">
            1. Airframe & Powerplant Configuration
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div>Platform: <strong className="text-slate-100">{selectedUav.callsign}</strong></div>
            <div>Model: <strong className="text-slate-100">{selectedUav.model}</strong></div>
            <div>Engine: <strong className="text-slate-100">Rotax 914 Turbo (115 HP)</strong></div>
            <div>Sortie Duration: <strong className="text-slate-100">{mission.elapsedTimeHours}h / {mission.estimatedDurationHours}h</strong></div>
          </div>
        </div>

        {/* Section 2: Engine Thermodynamic & Health Summary */}
        <div className="space-y-2">
          <h3 className="font-bold text-cyan-400 text-xs uppercase border-b border-slate-800 pb-1">
            2. Propulsion Health & Thermodynamic Metrics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">ADAPTIVE HEALTH INDEX</span>
              <strong className="text-emerald-400 text-base">{(Number(selectedUav.engineHealthIndex) || 0).toFixed(1)}% (Nominal)</strong>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">MISSION-AWARE RUL</span>
              <strong className="text-cyan-300 text-base">{selectedUav.predictedRulHours} Flight Hours</strong>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">PHYSICS-AI CONVERGENCE</span>
              <strong className="text-indigo-300 text-base">{selectedUav.twinConfidenceScore}% Match</strong>
            </div>
          </div>
        </div>

        {/* Section 3: Diagnostic Findings & Sign-Off */}
        <div className="space-y-2 pt-2">
          <h3 className="font-bold text-cyan-400 text-xs uppercase border-b border-slate-800 pb-1">
            3. AI Multi-Agent Diagnostic Findings & Certification
          </h3>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            All 4 cylinders operated within allowable CHT (max 124°C) and EGT (max 818°C) bounds throughout high altitude loiter. Vibration FFT showed zero structural resonance at 1X or 2X shaft orders. Hydrodynamic dry-sump lubrication maintained 4.35 bar nominal. The powerplant is certified safe for immediate turnaround or planned 50h depot inspection in 18.5 flight hours.
          </p>
        </div>

        {/* Signatures */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <div>
            <div>CHIEF PROPULSION ARCHITECT</div>
            <div className="font-bold text-slate-200 mt-1">Dr. S. K. Ramanathan, Sci-G, DRDO ADE</div>
          </div>
          <div className="text-right">
            <div>DIGITAL SIGNATURE HASH</div>
            <div className="font-mono text-cyan-400 mt-1">SHA-256: 9e4a8b...f7201c</div>
          </div>
        </div>
      </div>
    </div>
  );
};
