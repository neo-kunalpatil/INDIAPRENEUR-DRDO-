import React from 'react';
import { 
  Wrench, 
  Clock, 
  Package, 
  FileCheck, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  QrCode, 
  History, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';
import { MetricCard } from '../components/common/MetricCard';

export const MaintenancePage: React.FC = () => {
  const { selectedUav } = useGcs();

  const maintenanceTasks = [
    {
      id: 'm-1',
      title: '50-Hour Depot Inspection & Oil Scavenge Filter Change',
      component: 'Lubrication & Dry-Sump Oil Tank',
      dueInHours: 18.5,
      priority: 'HIGH',
      requiredParts: ['Aero Lube 15W-50 (4L)', 'Micro-Mesh Filter Cartridge #RTX-914-04'],
      status: 'SCHEDULED',
    },
    {
      id: 'm-2',
      title: 'Top-End Valve Lash Clearance Verification (0.15mm)',
      component: 'Combustion Chamber & Valvetrain',
      dueInHours: 42.0,
      priority: 'MEDIUM',
      requiredParts: ['Feeler Gauge Set', 'Rocker Cover Silicone Gasket (x4)'],
      status: 'PENDING',
    },
    {
      id: 'm-3',
      title: 'Turbocharger Wastegate Actuator Calibration',
      component: 'Forced Induction System',
      dueInHours: 85.0,
      priority: 'LOW',
      requiredParts: ['Servo Potentiometer Harness', 'Wastegate High-Temp Bushing'],
      status: 'PLANNED',
    },
  ];

  const passportEntries = [
    {
      date: '2026-07-15',
      hours: '420.5h',
      action: '200h Overhaul & Ignition Harness Replacement',
      technician: 'WO R. Sharma (DRDO ADE Propulsion Lab)',
      status: 'VERIFIED',
    },
    {
      date: '2026-05-10',
      hours: '300.0h',
      action: 'Propeller Reduction Gearbox Backlash Calibration',
      technician: 'Sgt. V. Rao (IAF Flight Maintenance Unit)',
      status: 'VERIFIED',
    },
    {
      date: '2026-03-22',
      hours: '150.0h',
      action: 'Dual CDI Spark Plug Replacement & Carb Sync',
      technician: 'WO R. Sharma (DRDO ADE Propulsion Lab)',
      status: 'VERIFIED',
    },
  ];

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              AI Maintenance Advisor & Digital Engine Passport (Innovation #4 & #21)
            </h1>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono-code font-bold">
              CONDITION-BASED OVERHAUL (CBO)
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            Prescriptive component-level maintenance scheduling powered by digital twin fatigue accumulation models
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-heading font-bold transition-all shadow-md">
          <FileCheck className="w-4 h-4" />
          <span>Export Passport PDF</span>
        </button>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Engine Total Time (TBO)"
          value="483.6h"
          status="NORMAL"
          change="TBO Limit: 1,200.0h"
          changeType="positive"
          icon={Clock}
          subtext="716.4h remaining until major overhaul"
        />
        <MetricCard
          title="Next Prescriptive Action"
          value="In 18.5h"
          status="HIGHLIGHT"
          change="Oil & Filter Change"
          changeType="positive"
          icon={Wrench}
          subtext="Optimal turnaround: 45 min"
        />
        <MetricCard
          title="Digital Passport Authenticity"
          value="100%"
          status="NORMAL"
          change="Cryptographic Hash Verified"
          changeType="positive"
          icon={ShieldCheck}
          subtext="DRDO ADE Propulsion Registry"
        />
        <MetricCard
          title="Spare Parts Readiness"
          value="98.4%"
          status="NORMAL"
          change="All depot kits in stock"
          changeType="positive"
          icon={Package}
          subtext="Forward Operating Base Jaisalmer"
        />
      </div>

      {/* Main Split: Prescriptive Advisor vs Digital Engine Passport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Cols: Prescriptive Maintenance Task Schedule */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="font-heading font-bold text-sm text-slate-100">
                  Prescriptive AI Maintenance Advisor
                </h3>
              </div>
              <span className="text-[10px] font-mono-code text-slate-400">DYNAMIC SCHEDULING</span>
            </div>

            <div className="space-y-3">
              {maintenanceTasks.map((task) => (
                <div key={task.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono-code">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-indigo-300 font-bold uppercase text-[10px]">{task.component}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      task.priority === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-900 text-slate-400'
                    }`}>
                      DUE IN {task.dueInHours} FLIGHT HOURS
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm mb-1">{task.title}</h4>
                  <div className="text-[10px] text-slate-400 mb-2">
                    Required Spares: <span className="text-cyan-300">{task.requiredParts.join(' • ')}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-500">Estimated Tech Effort: 1.5 Man-Hours</span>
                    <button className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold">
                      Generate Work Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs font-mono-code text-slate-300">
            <strong>DRDO PROPULSION NOTE:</strong> Transitioning from fixed-interval 50h cycles to AI condition-based scheduling reduces lifecycle overhaul costs by 34% while preventing in-flight shutdowns.
          </div>
        </div>

        {/* Right 5 Cols: Digital Engine Passport & Lifecycle Ledger */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <h3 className="font-heading font-bold text-sm text-slate-100">
                Digital Engine Passport
              </h3>
            </div>
            <span className="text-[10px] font-mono-code text-cyan-400">SERIAL #ROTAX-914-9982</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 mb-3 text-xs font-mono-code">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400">MANUFACTURER:</span>
              <span className="font-bold text-slate-100">BRP-Rotax / DRDO ADE</span>
            </div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400">DISPLACEMENT:</span>
              <span className="font-bold text-slate-100">1,211 cc (4-Cylinder Turbo)</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">AIRFRAME INSTALLED:</span>
              <span className="font-bold text-cyan-300">{selectedUav.callsign}</span>
            </div>
          </div>

          <h4 className="font-heading font-bold text-xs text-slate-400 uppercase mb-2">
            Historical Service Ledger
          </h4>

          <div className="space-y-2 text-xs font-mono-code">
            {passportEntries.map((entry, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                  <span className="font-bold text-cyan-400">{entry.date} ({entry.hours})</span>
                  <span className="text-emerald-400 font-bold">✓ {entry.status}</span>
                </div>
                <div className="font-bold text-slate-200">{entry.action}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{entry.technician}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
