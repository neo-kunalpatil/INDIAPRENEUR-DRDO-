import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Radio, 
  Volume2, 
  VolumeX, 
  Eye, 
  Moon, 
  Maximize2, 
  Bell, 
  Sparkles, 
  Bot, 
  Play, 
  Pause, 
  AlertTriangle,
  RotateCcw,
  Clock,
  Compass
} from 'lucide-react';
import { useGcs } from '../../contexts/GcsContext';
import { FACILITY_NAME } from '../../constants';

interface NavbarProps {
  onToggleChat: () => void;
  isChatOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleChat, isChatOpen }) => {
  const { 
    uavFleet, 
    selectedUav, 
    setSelectedUavId, 
    mission, 
    alerts, 
    voiceAlertsEnabled, 
    setVoiceAlertsEnabled, 
    nightVisionMode, 
    toggleNightVisionMode,
    isSimulationRunning,
    toggleSimulation,
    resetTelemetryToNormal,
    startDemoTour,
    setActiveTab
  } = useGcs();

  const [utcTime, setUtcTime] = useState<string>('');
  const [istTime, setIstTime] = useState<string>('');

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
      setIstTime(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST');
    };
    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <header className={`w-full border-b transition-colors z-40 ${
      nightVisionMode 
        ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300' 
        : 'bg-[#111318] border-[#2A2D33] text-[#E0E2E5]'
    } backdrop-blur-md sticky top-0`}>
      {/* Top micro classification banner */}
      <div className="w-full bg-[#171012] border-b border-red-900/40 py-0.5 px-4 flex items-center justify-between text-[11px] font-mono-code font-bold tracking-widest text-red-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 led-glow"></span>
          <span>RESTRICTED // DRDO-ADE // MALE UAV DIGITAL TWIN GROUND STATION // OPERATIONAL NODE 03</span>
        </div>
        <div className="flex items-center gap-4 hidden sm:flex text-gray-400">
          <span>SEC: CLASS-IV TOP SECRET</span>
          <span>CYBER: AES-GCM-256</span>
          <span className="text-emerald-400">LINK: KU-BAND SATCOM 99.8%</span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="px-4 py-2 flex items-center justify-between gap-3">
        {/* Left: DRDO Insignia & UAV Select */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 border-r border-[#2A2D33] pr-3.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-lg text-blue-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs tracking-widest text-blue-400 uppercase">DRDO | GCS-X1</span>
                <span className="px-1.5 py-0.2 bg-blue-500/10 border border-blue-500/30 rounded text-[9px] font-mono-code text-blue-300 font-semibold uppercase">
                  Digital Twin
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono-code uppercase leading-tight">
                Aero Piston Twin
              </p>
            </div>
          </div>

          {/* Active UAV Selector */}
          <div className="flex items-center gap-2 bg-[#15171A] border border-[#2A2D33] rounded px-2.5 py-1">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span className="text-[10px] font-mono-code text-gray-400 uppercase">UAV:</span>
            <select
              value={selectedUav.id}
              onChange={(e) => setSelectedUavId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer pr-1"
            >
              {uavFleet.map((uav) => (
                <option key={uav.id} value={uav.id} className="bg-[#111318] text-white">
                  {uav.callsign} ({uav.engineHealthIndex.toFixed(0)}% HLT)
                </option>
              ))}
            </select>
            <span className={`w-2 h-2 rounded-full led-glow ${
              selectedUav.status === 'ACTIVE_MISSION' ? 'bg-emerald-500' :
              selectedUav.status === 'MAINTENANCE' ? 'bg-amber-500' : 'bg-blue-500'
            }`} />
          </div>

          {/* Mission Tag */}
          <div className="hidden xl:flex items-center gap-2 bg-[#15171A] border border-[#2A2D33] rounded px-2.5 py-1 text-xs">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-mono-code text-gray-400 uppercase">MSN:</span>
            <span className="font-mono-code font-bold text-white text-xs">{mission.codeName.split(' - ')[0]}</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {mission.phase.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Center: Tactical Key Indicators */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-3 bg-[#15171A] border border-[#2A2D33] rounded px-3 py-1 text-xs font-mono-code">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[10px] uppercase">Engine HLT:</span>
              <span className={`font-bold ${
                selectedUav.engineHealthIndex > 80 ? 'text-emerald-400' :
                selectedUav.engineHealthIndex > 65 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {selectedUav.engineHealthIndex.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 w-px bg-[#2A2D33]" />
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[10px] uppercase">RUL:</span>
              <span className="font-bold text-blue-400">{selectedUav.predictedRulHours} hrs</span>
            </div>
            <div className="h-3 w-px bg-[#2A2D33]" />
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[10px] uppercase">Twin Sync:</span>
              <span className="font-bold text-emerald-400">{selectedUav.twinConfidenceScore}%</span>
            </div>
            <div className="h-3 w-px bg-[#2A2D33]" />
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[10px] uppercase">Decision:</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                selectedUav.missionRiskScore < 25 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                selectedUav.missionRiskScore < 60 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {selectedUav.missionRiskScore < 25 ? 'GO FLIGHT' : 'OBSERVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Telemetry Controls & Clocks */}
        <div className="flex items-center gap-2">
          {/* Dual Clock in exact theme format */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[#15171A] rounded border border-[#2A2D33]">
            <span className="text-[10px] font-bold text-gray-400 uppercase">UTC</span>
            <span className="text-xs font-mono-code font-bold text-white">{utcTime.replace(' UTC', '')}</span>
          </div>

          {/* Demo Tour Button (For Judges / Evaluators) */}
          <button
            onClick={startDemoTour}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-2.5 py-1.5 rounded shadow border border-blue-400/40 transition-transform active:scale-95"
            title="Launch Interactive Innovation Tour for Judges"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span className="hidden sm:inline">JUDGE TOUR</span>
          </button>

          {/* Quick Simulation Toggles */}
          <div className="flex items-center bg-[#15171A] border border-[#2A2D33] rounded p-0.5">
            <button
              onClick={toggleSimulation}
              className={`p-1.5 rounded text-xs transition-colors ${
                isSimulationRunning ? 'text-emerald-400 hover:bg-[#2A2D33]' : 'text-amber-400 bg-amber-950/60'
              }`}
              title={isSimulationRunning ? 'Pause live telemetry stream' : 'Resume live stream'}
            >
              {isSimulationRunning ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={resetTelemetryToNormal}
              className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-[#2A2D33] rounded transition-colors"
              title="Reset all engine parameters to nominal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Audio Voice Alert Annunciator Toggle */}
          <button
            onClick={() => setVoiceAlertsEnabled(!voiceAlertsEnabled)}
            className={`p-2 rounded border transition-colors ${
              voiceAlertsEnabled 
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                : 'bg-[#15171A] border-[#2A2D33] text-gray-500'
            }`}
            title={voiceAlertsEnabled ? 'Acoustic Voice Alerts Enabled' : 'Voice Alerts Muted'}
          >
            {voiceAlertsEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Night Vision / HUD Mode Toggle */}
          <button
            onClick={toggleNightVisionMode}
            className={`p-2 rounded border transition-colors hidden sm:flex ${
              nightVisionMode 
                ? 'bg-emerald-900/60 border-emerald-600 text-emerald-300' 
                : 'bg-[#15171A] border-[#2A2D33] text-gray-400 hover:text-white'
            }`}
            title="Toggle Tactical Night HUD filter"
          >
            {nightVisionMode ? <Moon className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Tactical Copilot Chat Toggle */}
          <button
            onClick={onToggleChat}
            className={`p-2 rounded border transition-colors relative ${
              isChatOpen 
                ? 'bg-blue-900/30 border-blue-500/50 text-blue-300' 
                : 'bg-[#15171A] border-[#2A2D33] text-gray-400 hover:text-blue-400'
            }`}
            title="Open AI Tactical Copilot Assistant"
          >
            <Bot className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 led-glow" />
          </button>

          {/* Alerts Bell */}
          <button
            onClick={() => setActiveTab('alerts')}
            className="p-2 rounded bg-[#15171A] border border-[#2A2D33] text-gray-300 hover:text-red-400 relative transition-colors"
            title="Open Alarm Center"
          >
            <Bell className="w-4 h-4" />
            {unacknowledgedAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-600 text-white font-mono-code text-[9px] font-bold rounded-full animate-bounce">
                {unacknowledgedAlerts.length}
              </span>
            )}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullScreen}
            className="p-2 rounded bg-[#15171A] border border-[#2A2D33] text-gray-400 hover:text-blue-400 transition-colors hidden md:flex"
            title="Toggle Fullscreen GCS Display"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
