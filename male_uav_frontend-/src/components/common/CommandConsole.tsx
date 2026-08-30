import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Terminal, 
  ShieldAlert, 
  Cpu, 
  Flame, 
  Zap, 
  RotateCcw,
  Check
} from 'lucide-react';
import { useGcs } from '../../contexts/GcsContext';

interface CommandConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandConsole: React.FC<CommandConsoleProps> = ({ isOpen, onClose }) => {
  const { chatMessages, sendChatMessage, selectedUav, telemetry } = useGcs();
  const [inputVal, setInputVal] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sendChatMessage(inputVal.trim());
    setInputVal('');
  };

  const samplePrompts = [
    'Analyze Cylinder #3 EGT and CHT thermal disparity',
    'Calculate Remaining Useful Life under High Altitude Loiter',
    'Explain Turbocharger Boost pressure anomaly vs Physics baseline',
    'Assess Mission Risk Go/No-Go for 4-hour loiter extension',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-[420px] bg-slate-950/98 border-l border-indigo-900/60 shadow-2xl shadow-indigo-950/90 backdrop-blur-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-700 text-indigo-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-heading font-bold text-sm text-slate-100">
                DRDO AI Tactical Copilot
              </h3>
              <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[9px] font-mono-code font-bold">
                NLP-ENGINE
              </span>
            </div>
            <p className="text-[10px] font-mono-code text-slate-400">
              Target: {selectedUav.callsign}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Aero Engine Status Banner */}
      <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800/80 grid grid-cols-3 gap-2 text-center text-[10px] font-mono-code">
        <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800">
          <span className="text-slate-500 block">RPM</span>
          <span className="font-bold text-cyan-300">{telemetry.rpm}</span>
        </div>
        <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800">
          <span className="text-slate-500 block">MAP</span>
          <span className="font-bold text-cyan-300">{telemetry.manifoldPressureInHg} inHg</span>
        </div>
        <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800">
          <span className="text-slate-500 block">HEALTH</span>
          <span className="font-bold text-emerald-400">{selectedUav.engineHealthIndex.toFixed(1)}%</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
        {chatMessages.map((msg) => {
          const isUser = msg.sender === 'OPERATOR';
          const isSystem = msg.sender === 'SYSTEM';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 text-[9px] font-mono-code text-slate-500 mb-0.5">
                <span>{msg.sender}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[90%] p-3 rounded-xl leading-relaxed text-xs ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none'
                    : isSystem
                    ? 'bg-slate-900 border border-slate-800 text-slate-400 font-mono-code text-[11px]'
                    : 'bg-indigo-950/80 border border-indigo-800/80 text-indigo-100 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/40">
        <div className="text-[10px] font-mono-code font-bold text-slate-400 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>SUGGESTED TACTICAL QUERIES:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => sendChatMessage(prompt)}
              className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-700/80 hover:border-indigo-500 text-slate-300 hover:text-indigo-200 text-left transition-colors truncate max-w-full"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask AI Copilot about engine health, RUL, faults..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 font-mono-code focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!inputVal.trim()}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
