import React, { useState } from 'react';

export const GarudaAIPanel: React.FC = () => {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const predefinedCommands = [
    'ANALYZE ENGINE',
    'PREDICT FAILURE',
    'MISSION READINESS',
    'FAULT DIAGNOSIS',
    'GENERATE REPORT',
  ];

  const handleCommand = async (cmd: string) => {
    setLoading(true);
    setResponse(null);
    setCommand(cmd);

    try {
      // Dummy telemetry data to send for context
      const dummyTelemetry = {
        RPM: 5120,
        MAP: 35.8,
        CHT1: 112.6,
        CHT2: 114.2,
        CHT3: 350.0, // High CHT to trigger analysis
        CHT4: 111.0,
        EGT1: 765,
        EGT2: 772,
        EGT3: 850,
        EGT4: 760,
        HealthIndex: 88.4,
        MissionTime: 142.6
      };

      const res = await fetch('http://localhost:8000/api/garuda/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telemetry: dummyTelemetry,
          health: { status: 'WARNING' },
          mission: { state: 'ACTIVE PATROL' }
        }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({
        status: "ERROR",
        risk: "UNKNOWN",
        analysis: "Mission Intelligence Service Temporarily Unavailable",
        recommendations: [],
        confidence: "0%"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0b1120] border border-[#1e293b] rounded-lg p-4 flex flex-col h-full text-slate-300 font-mono text-sm">
      <div className="border-b border-[#1e293b] pb-2 mb-4 flex items-center justify-between">
        <h2 className="text-emerald-500 font-bold tracking-widest">GARUDA-AI // ENTERPRISE MISSION INTELLIGENCE</h2>
        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs border border-emerald-500/30">ONLINE</span>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 bg-[#0f172a] border border-[#1e293b] rounded p-3">
          <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Telemetry Snapshot</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between"><span>RPM:</span> <span className="text-emerald-400">5120</span></div>
            <div className="flex justify-between"><span>MAP:</span> <span className="text-emerald-400">35.8</span></div>
            <div className="flex justify-between"><span>CHT3:</span> <span className="text-amber-500 font-bold">350.0°C</span></div>
            <div className="flex justify-between"><span>Health:</span> <span className="text-emerald-400">88.4%</span></div>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Command Input</div>
          <div className="grid grid-cols-2 gap-2">
            {predefinedCommands.map(cmd => (
              <button 
                key={cmd}
                onClick={() => handleCommand(cmd)}
                disabled={loading}
                className="bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-slate-300 rounded px-2 py-1 text-xs text-left transition-colors disabled:opacity-50"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#0f172a] border border-[#1e293b] rounded p-4 overflow-y-auto">
        {loading ? (
          <div className="text-emerald-500 animate-pulse flex items-center justify-center h-full">
            Processing Telemetry with GARUDA-AI (Groq inference active)...
          </div>
        ) : response ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
              <span className="text-slate-400">COMMAND EXECUTED: <span className="text-emerald-400 font-bold">{command}</span></span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                response.status === 'GREEN' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 
                response.status === 'YELLOW' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 
                response.status === 'ORANGE' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 
                'bg-red-500/20 text-red-500 border border-red-500/30'
              }`}>{response.status || 'UNKNOWN'}</span>
            </div>
            
            <div>
              <div className="text-slate-500 text-xs mb-1">ANALYSIS</div>
              <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">{response.analysis}</div>
            </div>

            {response.recommendations && response.recommendations.length > 0 && (
              <div>
                <div className="text-slate-500 text-xs mb-1">RECOMMENDED ACTIONS</div>
                <ul className="list-disc list-inside text-amber-400">
                  {response.recommendations.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-[#1e293b]">
              <span>RISK LEVEL: <span className="text-slate-300">{response.risk}</span></span>
              <span>CONFIDENCE: <span className="text-emerald-400">{response.confidence}</span></span>
            </div>
          </div>
        ) : (
          <div className="text-slate-500 h-full flex items-center justify-center">
            Awaiting operator command...
          </div>
        )}
      </div>
    </div>
  );
};
