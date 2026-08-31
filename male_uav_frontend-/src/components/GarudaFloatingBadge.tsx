import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Fingerprint } from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';

export const GarudaFloatingBadge: React.FC = () => {
  const { activeFaults, selectedUav, setActiveTab } = useGcs();
  const [isHovered, setIsHovered] = useState(false);

  const activeFaultCount = activeFaults.filter(f => f.active).length;
  const isHealthy = activeFaultCount === 0;

  const handleClick = () => {
    setActiveTab('garuda-ai');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end justify-end group">
      
      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: 0 }}
            animate={{ opacity: 1, y: -80, x: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 bottom-0 mb-4 mr-1 w-64 pointer-events-none"
          >
            <div className="bg-[#05080f]/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden">
              {/* Scanline effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-full w-full opacity-50 scanline-animation" />
              
              <div className="relative z-10">
                <h4 className="font-heading font-bold text-cyan-400 text-sm tracking-wider flex items-center gap-2">
                  <Fingerprint className="w-3.5 h-3.5" />
                  GARUDA-AI
                </h4>
                <p className="text-[10px] text-cyan-100/70 font-mono-code mb-2 uppercase tracking-widest border-b border-cyan-900/50 pb-2">
                  Mission Intelligence Engine
                </p>
                <div className="space-y-1.5 text-[10px] font-mono-code">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">STATE:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ONLINE & ACTIVE
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">DIGITAL TWIN:</span>
                    <span className="text-blue-400 font-bold">SYNCHRONIZED</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Badge Button */}
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative cursor-pointer focus:outline-none"
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Outer Glow Ring */}
        <motion.div 
          className={`absolute inset-0 rounded-full blur-xl opacity-40 ${isHealthy ? 'bg-cyan-500' : 'bg-red-500'}`}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />

        {/* Main Emblem Body */}
        <div className="relative w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-[#0a0f18]/80 backdrop-blur-xl border border-cyan-500/40 rounded-2xl flex flex-col items-center justify-center shadow-2xl overflow-hidden group-hover:border-cyan-400 transition-colors duration-300 transform rotate-45">
          
          {/* Inner metallic gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-600/20" />
          
          {/* Un-rotate the content */}
          <div className="relative -rotate-45 flex flex-col items-center justify-center">
            <Shield className={`w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 ${isHealthy ? 'text-cyan-400' : 'text-red-400'}`} />
            
            {/* Status Text (visible only on larger screens) */}
            <div className="hidden md:flex flex-col items-center mt-1">
              <span className="text-[8px] font-mono-code font-bold text-slate-300">GARUDA-AI</span>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
                <span className={`text-[7px] font-mono-code font-bold ${isHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isHealthy ? `SYNC ${selectedUav.twinConfidenceScore}%` : `${activeFaultCount} FAULTS`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Orbiting Tech Ring (pure CSS) */}
        <div className="absolute inset-[-4px] md:inset-[-8px] rounded-full border border-dashed border-cyan-500/30 animate-[spin_10s_linear_infinite] pointer-events-none" />
        <div className="absolute inset-[-4px] md:inset-[-8px] rounded-full border border-dashed border-blue-500/20 animate-[spin_15s_linear_infinite_reverse] pointer-events-none" />
        
      </motion.button>
    </div>
  );
};
