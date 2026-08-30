import React, { useState, useRef, useEffect } from 'react';
import { User, Sun, Moon, Check, ChevronDown } from 'lucide-react';
import { useGcs } from '../../contexts/GcsContext';

export const ProjectLeadDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useGcs();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] px-3 py-1.5 rounded transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <User className="w-4 h-4 text-blue-400" />
        <div className="hidden sm:flex flex-col items-start leading-none text-left">
          <span className="text-[9px] font-bold text-gray-400 uppercase">Project Lead</span>
          <span className="text-xs font-bold text-[var(--text-primary)]">India-Preneur</span>
        </div>
        <ChevronDown className="w-3 h-3 text-gray-400 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 bg-[var(--surface-elevated)] border-b border-[var(--border)]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Project Team</span>
          </div>
          
          {/* Content */}
          <div className="p-4 flex flex-col gap-3">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Project Lead / Maker</p>
              <p className="font-bold text-[var(--text-primary)]">India-Preneur</p>
            </div>
            
            <div className="h-px bg-[var(--border)] w-full"></div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">SIH ID</p>
                <p className="font-mono-code font-bold text-blue-400">SIH26054</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Project</p>
                <p className="font-bold text-[var(--text-primary)] leading-tight">MALE UAV Digital Twin</p>
              </div>
            </div>
          </div>
          
          {/* Theme Section */}
          <div className="p-2 border-t border-[var(--border)] bg-[var(--surface-elevated)]">
            <div className="px-2 pb-1 pt-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Appearance</span>
            </div>
            <button
              onClick={() => { if (theme !== 'light') toggleTheme(); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs transition-colors ${theme === 'light' ? 'bg-[var(--border)] text-blue-500 font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--border)]'}`}
            >
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </div>
              {theme === 'light' && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => { if (theme !== 'dark') toggleTheme(); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs transition-colors mt-1 ${theme === 'dark' ? 'bg-[var(--border)] text-blue-400 font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--border)]'}`}
            >
              <div className="flex items-center gap-2">
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </div>
              {theme === 'dark' && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
