import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Bell, 
  Filter, 
  Clock, 
  Search, 
  Check, 
  AlertOctagon,
  Volume2
} from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';
import { AlertSeverity } from '../types';

export const AlertCenterPage: React.FC = () => {
  const { alerts, acknowledgeAlert, dismissAlert } = useGcs();
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase()) && !a.uavCallsign.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              Tiered Tactical Alert & Anomaly Incident Center (Innovation #17 & #19)
            </h1>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
              unacknowledgedCount > 0 ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {unacknowledgedCount} UNACKNOWLEDGED
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            DRDO Level-1/2/3 multi-stage alert dispatch with operator acknowledgement audit trail
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono-code">
          {(['ALL', 'CRITICAL', 'WARNING', 'NOTICE', 'INFO'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterSeverity === sev
                  ? sev === 'CRITICAL' ? 'bg-red-600 text-white' : sev === 'WARNING' ? 'bg-amber-600 text-white' : 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Feed List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 font-mono-code text-xs">
            No alerts matching current severity filter.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCrit = alert.severity === 'CRITICAL';
            const isWarn = alert.severity === 'WARNING';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCrit
                    ? 'bg-red-950/20 border-red-600/80 shadow-lg shadow-red-950/30'
                    : isWarn
                    ? 'bg-amber-950/20 border-amber-600/80'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl mt-0.5 ${
                      isCrit ? 'bg-red-900/80 text-red-300' : isWarn ? 'bg-amber-900/80 text-amber-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isCrit ? <AlertOctagon className="w-5 h-5 animate-pulse" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono-code font-bold uppercase tracking-wider ${
                          isCrit ? 'bg-red-950 text-red-300 border border-red-800' :
                          isWarn ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {alert.severity} • {alert.subsystem}
                        </span>
                        <span className="text-xs font-mono-code font-bold text-cyan-300">
                          {alert.uavCallsign}
                        </span>
                        <span className="text-xs font-mono-code text-slate-500">
                          {alert.timestamp}
                        </span>
                      </div>

                      <h3 className="font-heading font-bold text-base text-slate-100 mb-1">
                        {alert.title}
                      </h3>

                      <p className="text-xs text-slate-300 leading-relaxed mb-2 font-sans">
                        {alert.message || alert.description}
                      </p>

                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono-code">
                        <span className="text-cyan-400 font-bold block mb-0.5">SUGGESTED OPERATOR MITIGATION:</span>
                        <span className="text-slate-300">{alert.suggestedAction}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
                    {!alert.acknowledged ? (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-heading font-bold transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Acknowledge</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono-code text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ACKNOWLEDGED</span>
                      </span>
                    )}

                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-mono-code transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
