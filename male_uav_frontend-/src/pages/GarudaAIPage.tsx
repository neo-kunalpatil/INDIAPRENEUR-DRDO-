import React, { useState, useEffect, useRef } from 'react';
import { useGcs } from '../contexts/GcsContext';
import { Bot, Terminal as TerminalIcon, Send, Zap, ChevronRight, Activity, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';
import { streamGarudaCommand } from '../services/garudaAiService';

export const GarudaAIPage: React.FC = () => {
  const { telemetry, mission, activeFaults, selectedUav } = useGcs();
  
  const [customCommand, setCustomCommand] = useState('');
  const [status, setStatus] = useState<'ONLINE' | 'THINKING' | 'ANALYZING' | 'REPORT READY'>('ONLINE');
  const [conversation, setConversation] = useState<{
    id: string;
    role: 'system' | 'user' | 'agent';
    content: string;
    timestamp: string;
    isStreaming?: boolean;
  }>([
    {
      id: 'sys-1',
      role: 'system',
      content: `GARUDA-AI ONLINE\n\nMission Intelligence Core Initialized\n\nDigital Twin Synchronization:\n98.7 %\n\nTelemetry Link:\nCONNECTED\n\nAI Diagnostics:\nREADY\n\nAwaiting Operational Command.`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const quickCommands = [
    'Analyze Engine',
    'Mission Readiness',
    'Predict Failure',
    'Fault Diagnosis',
    'Generate Report',
    'Fleet Analysis'
  ];

  const handleCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Add user command
    setConversation(prev => [...prev, { id: Date.now().toString(), role: 'user', content: `> ${cmd}`, timestamp }]);
    setCustomCommand('');
    
    // Handle Special Commands locally
    if (cmd.startsWith('/')) {
      handleSpecialCommand(cmd.toLowerCase().trim(), timestamp);
      return;
    }

    setStatus('THINKING');

    const payload = {
      telemetry: {
        rpm: telemetry.rpm,
        mapKpa: telemetry.manifoldPressureInHg * 3.386, // convert inHg to kPa approx
        oilTemp: telemetry.oilTempC,
        oilPressure: telemetry.oilPressureBar,
        fuelFlow: telemetry.fuelFlowLitersHr,
        fuelRemaining: selectedUav.fuelRemainingKg,
        vibration: telemetry.vibrationRmsMmS,
        health: selectedUav.engineHealthIndex,
        rul: selectedUav.predictedRulHours,
        syncFidelity: selectedUav.twinConfidenceScore,
        chtC: telemetry.chtC,
        egtC: telemetry.egtC
      },
      activeFaults: activeFaults.filter(f => f.active),
      mission: {
        uavName: selectedUav.callsign,
        missionName: mission.codeName,
        missionAltitude: mission.altitudeFlightLevelFt,
        missionStatus: mission.phase
      }
    };

    const responseId = (Date.now() + 1).toString();
    setConversation(prev => [...prev, { id: responseId, role: 'agent', content: '', timestamp, isStreaming: true }]);
    setStatus('ANALYZING');

    let fullText = '';
    
    await streamGarudaCommand(cmd, payload, (chunk) => {
      fullText += chunk;
      setConversation(prev => 
        prev.map(msg => 
          msg.id === responseId ? { ...msg, content: fullText } : msg
        )
      );
    });

    setConversation(prev => 
      prev.map(msg => 
        msg.id === responseId ? { ...msg, isStreaming: false } : msg
      )
    );
    
    setStatus('REPORT READY');
    setTimeout(() => setStatus('ONLINE'), 3000);
  };

  const handleSpecialCommand = (cmd: string, timestamp: string) => {
    let response = '';
    switch(cmd) {
      case '/help':
        response = `AVAILABLE SPECIAL COMMANDS:\n/show telemetry\n/show faults\n/show mission\n/show health\n/show twin\n/report\n/predict\n/diagnose`;
        break;
      case '/show telemetry':
        response = `LIVE TELEMETRY SNAPSHOT:\nRPM: ${telemetry.rpm}\nMAP: ${telemetry.manifoldPressureInHg} inHg\nOIL TEMP: ${telemetry.oilTempC}°C\nOIL PRESS: ${telemetry.oilPressureBar} bar\nVIB RMS: ${telemetry.vibrationRmsMmS} mm/s`;
        break;
      case '/show faults':
        const active = activeFaults.filter(f => f.active);
        response = active.length > 0 
          ? `ACTIVE FAULTS:\n${active.map(f => `- ${f.name} (Severity: ${f.severityPercent}%)`).join('\n')}`
          : `ACTIVE FAULTS:\nZERO ANOMALIES DETECTED.`;
        break;
      case '/show mission':
        response = `MISSION DATA:\nUAV: ${selectedUav.callsign}\nOPERATION: ${mission.codeName}\nPHASE: ${mission.phase}\nALTITUDE: FL${Math.round(mission.altitudeFlightLevelFt/100)}`;
        break;
      case '/show health':
        response = `HEALTH INDEX: ${(Number(selectedUav.engineHealthIndex) || 0).toFixed(1)}%\nEST RUL: ${selectedUav.predictedRulHours} Hrs`;
        break;
      case '/show twin':
        response = `DIGITAL TWIN SYNC: ${selectedUav.twinConfidenceScore}%\nSTATE: LOCKED & TRACKING`;
        break;
      default:
        response = `UNRECOGNIZED SPECIAL COMMAND: ${cmd}\nType /help for options.`;
    }
    
    setConversation(prev => [...prev, { id: Date.now().toString(), role: 'system', content: response, timestamp }]);
  };

  // Extract badges from latest agent message if not streaming
  const lastAgentMessage = [...conversation].reverse().find(m => m.role === 'agent' && !m.isStreaming)?.content || '';
  
  const extractBadge = (text: string, keyword: string) => {
    const regex = new RegExp(keyword + "[:\\s\\n]+([A-Z0-9%\\.\\-]+)", "i");
    const match = text.match(regex);
    return match ? match[1] : null;
  };

  const extractedRisk = extractBadge(lastAgentMessage, 'RISK LEVEL');
  const extractedVerdict = extractBadge(lastAgentMessage, 'VERDICT');
  const extractedConfidence = extractBadge(lastAgentMessage, 'CONFIDENCE');

  return (
    <div className="p-4 h-[calc(100vh-2rem)] max-w-[1920px] mx-auto flex flex-col space-y-4">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-500/30 text-blue-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl text-slate-100 flex items-center gap-2">
              GARUDA-AI 
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code flex items-center gap-1 ${
                status === 'ONLINE' || status === 'REPORT READY' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800' :
                'bg-amber-950/60 text-amber-400 border border-amber-800 animate-pulse'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${status === 'ONLINE' || status === 'REPORT READY' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {status}
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800 text-[10px] font-mono-code">SYNCED</span>
            </h1>
            <p className="text-xs font-mono-code text-slate-400">Enterprise Mission Intelligence Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {extractedRisk && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 font-mono-code">RISK</span>
              <span className={`text-xs font-bold font-mono-code px-2 py-0.5 rounded border ${
                extractedRisk.includes('LOW') ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300' :
                extractedRisk.includes('HIGH') || extractedRisk.includes('CRITICAL') ? 'bg-red-900/50 border-red-500 text-red-300' :
                'bg-amber-900/50 border-amber-500 text-amber-300'
              }`}>{extractedRisk}</span>
            </div>
          )}
          {extractedVerdict && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 font-mono-code">VERDICT</span>
              <span className={`text-xs font-bold font-mono-code px-2 py-0.5 rounded border ${
                extractedVerdict.includes('GO') && !extractedVerdict.includes('NO') ? 'bg-blue-900/50 border-blue-500 text-blue-300' :
                'bg-red-900/50 border-red-500 text-red-300'
              }`}>{extractedVerdict}</span>
            </div>
          )}
          {extractedConfidence && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 font-mono-code">CONFIDENCE</span>
              <span className="text-xs font-bold font-mono-code text-emerald-400">{extractedConfidence}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Column: Context & Commands */}
        <div className="w-1/3 flex flex-col gap-4">
          {/* Quick Commands */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col shrink-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Quick Commands
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {quickCommands.map(cmd => (
                <button
                  key={cmd}
                  onClick={() => handleCommand(cmd)}
                  disabled={status === 'THINKING' || status === 'ANALYZING'}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-mono-code font-bold text-slate-300 transition-colors disabled:opacity-50"
                >
                  [{cmd}]
                </button>
              ))}
            </div>
          </div>

          {/* Live Telemetry Summary */}
          <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Live Telemetry Summary
            </h3>
            <div className="space-y-3 text-xs font-mono-code">
              <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">RPM</span>
                <span className="text-emerald-400 font-bold text-lg">{telemetry.rpm}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">PEAK CHT</span>
                <span className="text-amber-400 font-bold text-lg">{Math.max(Number(...telemetry.chtC) || 0).toFixed(1)}°C</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">PEAK EGT</span>
                <span className="text-amber-400 font-bold text-lg">{Math.max(Number(...telemetry.egtC) || 0).toFixed(1)}°C</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">VIBRATION</span>
                <span className="text-indigo-400 font-bold text-lg">{(Number(telemetry.vibrationRmsMmS) || 0).toFixed(2)} mm/s</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">HEALTH INDEX</span>
                <span className="text-cyan-400 font-bold text-lg">{(Number(selectedUav.engineHealthIndex) || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">EST. RUL</span>
                <span className="text-emerald-400 font-bold text-lg">{selectedUav.predictedRulHours}h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Response & Chat */}
        <div className="w-2/3 bg-[#0a0f18] border border-slate-800 rounded-2xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500" />
          
          <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/50 text-xs font-mono-code shrink-0">
            <div className="flex items-center gap-2 text-slate-400">
              <TerminalIcon className="w-4 h-4 text-slate-500" />
              GARUDA-AI // SECURE TERMINAL
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-500">Llama-3.3-70B-Versatile</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono-code text-sm">
            {conversation.map((msg) => (
              <div key={msg.id} className="flex flex-col mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-slate-600">[{msg.timestamp}]</span>
                  <span className={`text-[10px] font-bold ${
                    msg.role === 'user' ? 'text-cyan-500' :
                    msg.role === 'system' ? 'text-emerald-600' :
                    'text-amber-500'
                  }`}>
                    {msg.role === 'user' ? 'OPERATOR' : 'GARUDA-AI'}
                  </span>
                </div>
                <div className={`whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user' 
                    ? 'text-cyan-300' 
                    : msg.role === 'system'
                      ? 'text-emerald-500 tracking-widest'
                      : 'text-slate-300'
                }`}>
                  {msg.content}
                  {msg.isStreaming && <span className="inline-block w-2 h-4 bg-amber-500 ml-1 animate-pulse" />}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-slate-900/90 border-t border-slate-800 shrink-0">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleCommand(customCommand); }}
              className="flex gap-3"
            >
              <div className="flex-1 relative">
                <ChevronRight className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                <input 
                  type="text" 
                  value={customCommand}
                  onChange={e => setCustomCommand(e.target.value)}
                  placeholder="Enter command or type /help..."
                  disabled={status === 'THINKING' || status === 'ANALYZING'}
                  className="w-full bg-[#05080f] border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-200 font-mono-code text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
                />
              </div>
              <button 
                type="submit"
                disabled={status === 'THINKING' || status === 'ANALYZING' || !customCommand.trim()}
                className="px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl flex items-center gap-2 transition-colors font-mono-code text-sm"
              >
                EXECUTE <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
