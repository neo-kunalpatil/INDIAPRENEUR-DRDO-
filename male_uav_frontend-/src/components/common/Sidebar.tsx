import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  Cpu, 
  BrainCircuit, 
  GitCompare, 
  Radio, 
  History, 
  ZapOff, 
  Wrench, 
  Radar, 
  AlertTriangle, 
  Network, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  Search,
  ExternalLink,
  Layers
} from 'lucide-react';
import { useGcs } from '../../contexts/GcsContext';
import { NAV_ITEMS } from '../../constants';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const { activeTab, setActiveTab, selectedUav, nightVisionMode, alerts } = useGcs();
  const [searchQuery, setSearchQuery] = useState('');

  const iconMap: Record<string, React.ReactNode> = {
    LayoutDashboard: <LayoutDashboard className="w-4 h-4" />,
    Activity: <Activity className="w-4 h-4" />,
    Cpu: <Cpu className="w-4 h-4" />,
    BrainCircuit: <BrainCircuit className="w-4 h-4" />,
    GitCompare: <GitCompare className="w-4 h-4" />,
    Radio: <Radio className="w-4 h-4" />,
    History: <History className="w-4 h-4" />,
    ZapOff: <ZapOff className="w-4 h-4" />,
    Wrench: <Wrench className="w-4 h-4" />,
    Radar: <Radar className="w-4 h-4" />,
    AlertTriangle: <AlertTriangle className="w-4 h-4" />,
    Network: <Network className="w-4 h-4" />,
    Sparkles: <Sparkles className="w-4 h-4" />,
    FileText: <FileText className="w-4 h-4" />,
    ShieldCheck: <ShieldCheck className="w-4 h-4" />,
  };

  const filteredItems = NAV_ITEMS.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={`border-r transition-all duration-300 flex flex-col z-30 shrink-0 select-none ${
        nightVisionMode 
          ? 'bg-emerald-950/80 border-emerald-900 text-emerald-200' 
          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]'
      } ${isCollapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Sidebar Top Search / Toggle */}
      <div className="p-3 border-b border-[var(--border)] flex items-center justify-between gap-2">
        {!isCollapsed ? (
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded pl-8 pr-2 py-1 text-xs text-[var(--text-primary)] placeholder:text-gray-500 font-mono-code focus:outline-none focus:border-blue-500"
            />
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1 text-gray-400 hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Module Navigation List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        <div className="px-2 py-1 text-[10px] font-mono-code font-bold text-gray-500 uppercase tracking-widest">
          {!isCollapsed && 'OPERATIONAL MODULES'}
        </div>

        {filteredItems.map((item) => {
          const isActive = activeTab === item.id;
          const isAlert = item.id === 'alerts' && alerts.some(a => !a.acknowledged);

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] border border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-400 rounded-r" />
              )}

              <div className={`transition-transform duration-200 ${isActive ? 'text-blue-400' : 'group-hover:text-blue-300'}`}>
                {iconMap[item.icon] || <Activity className="w-4 h-4" />}
              </div>

              {!isCollapsed && (
                <div className="flex-1 text-left flex items-center justify-between overflow-hidden">
                  <span className={`truncate ${isActive ? 'font-bold text-[var(--text-primary)]' : ''}`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className={`text-[9px] font-mono-code px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shrink-0 ${
                      item.badge === 'USP' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      item.badge === 'LIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      isAlert ? 'bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse' :
                      'bg-[var(--surface-elevated)] text-gray-400 border border-[var(--border)]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected UAV Telemetry Micro-Card */}
      {!isCollapsed && (
        <div className="p-3 m-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded text-xs font-mono-code">
          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
            <span className="uppercase">ACTIVE TELEMETRY</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 led-glow" />
              LOCKED
            </span>
          </div>
          <div className="font-bold text-[var(--text-primary)] truncate">{selectedUav.callsign}</div>
          <div className="text-[11px] text-gray-400 truncate">{selectedUav.model}</div>
          <div className="mt-2 pt-2 border-t border-[var(--border)] grid grid-cols-2 gap-1 text-[10px]">
            <div>
              <span className="text-gray-500">ALT: </span>
              <span className="text-[var(--text-primary)] font-bold">{selectedUav.altitudeFt.toLocaleString()} FT</span>
            </div>
            <div>
              <span className="text-gray-500">SPD: </span>
              <span className="text-[var(--text-primary)] font-bold">{selectedUav.airspeedKts} KTS</span>
            </div>
            <div>
              <span className="text-gray-500">FUEL: </span>
              <span className="text-amber-400 font-bold">{selectedUav.fuelRemainingKg} KG</span>
            </div>
            <div>
              <span className="text-gray-500">HLT: </span>
              <span className="text-emerald-400 font-bold">{selectedUav.engineHealthIndex.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Footer info */}
      <div className="p-2 border-t border-[var(--border)] text-[10px] font-mono-code text-gray-500 flex items-center justify-between">
        {!isCollapsed ? (
          <>
            <span>DRDO-ADE // NODE 03</span>
            <span className="text-blue-400 font-bold">v4.2.8</span>
          </>
        ) : (
          <span className="w-full text-center text-[9px] text-blue-400">v4.2</span>
        )}
      </div>
    </aside>
  );
};
