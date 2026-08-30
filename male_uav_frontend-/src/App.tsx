import React, { useState, useEffect } from 'react';
import { GcsProvider, useGcs } from './contexts/GcsContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { DemoTourModal } from './components/common/DemoTourModal';
import { CommandConsole } from './components/common/CommandConsole';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { AIPredictionsPage } from './pages/AIPredictionsPage';
import { HybridVerificationPage } from './pages/HybridVerificationPage';
import { MissionControlPage } from './pages/MissionControlPage';
import { MissionReplayPage } from './pages/MissionReplayPage';
import { FaultInjectionPage } from './pages/FaultInjectionPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { FleetMonitoringPage } from './pages/FleetMonitoringPage';
import { AlertCenterPage } from './pages/AlertCenterPage';
import { MultiAgentAiPage } from './pages/MultiAgentAiPage';
import { ContinuousLearningPage } from './pages/ContinuousLearningPage';
import { ReportsPage } from './pages/ReportsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { GarudaAIPage } from './pages/GarudaAIPage';
import { GarudaFloatingBadge } from './components/GarudaFloatingBadge';

const MainLayout: React.FC = () => {
  const { activeTab, nightVisionMode, startDemoTour } = useGcs();
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  // Keyboard shortcut handlers for tactical operator ergonomics
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === '`' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        setIsConsoleOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'live-monitoring':
        return <LiveMonitoringPage />;
      case 'digital-twin':
        return <DigitalTwinPage />;
      case 'ai-predictions':
        return <AIPredictionsPage />;
      case 'hybrid-verification':
        return <HybridVerificationPage />;
      case 'mission-control':
        return <MissionControlPage />;
      case 'replay':
        return <MissionReplayPage />;
      case 'fault-injection':
        return <FaultInjectionPage />;
      case 'maintenance':
        return <MaintenancePage />;
      case 'fleet':
        return <FleetMonitoringPage />;
      case 'alerts':
        return <AlertCenterPage />;
      case 'multi-agent':
        return <MultiAgentAiPage />;
      case 'continuous-learning':
        return <ContinuousLearningPage />;
      case 'reports':
        return <ReportsPage />;
      case 'system-health':
        return <SystemHealthPage />;
      case 'garuda-ai':
        return <GarudaAIPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className={`min-h-screen bg-[#0A0B0D] text-[#E0E2E5] flex flex-col selection:bg-blue-500/30 selection:text-white ${
      nightVisionMode ? 'theme-night-vision' : ''
    }`}>
      {/* Tactical Header Navbar */}
      <Navbar onOpenConsole={() => setIsConsoleOpen(true)} />

      {/* Main App Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tactical Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Main Viewport Canvas */}
        <main className="flex-1 overflow-y-auto bg-[#0A0B0D] relative grid-bg custom-scrollbar">
          <div className="relative z-10">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Professional Polish Tactical Footer */}
      <footer className="h-9 bg-[#111318] border-t border-[#2A2D33] px-4 sm:px-6 flex items-center justify-between text-[10px] text-gray-400 uppercase monospace shrink-0 z-20">
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 led-glow"></span>
            <span>Telemetry: 20Hz Link-A Active</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-emerald-500 led-glow"></span>
            <span>AI Neural Engine: Nominal</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap hidden md:flex">
            <span className="w-2 h-2 rounded-full bg-blue-500 led-glow"></span>
            <span>DT Sync: 2.4ms Latency</span>
          </div>
        </div>

        <div className="flex items-center gap-3 whitespace-nowrap">
          <span className="text-gray-400">System Build: <strong className="text-blue-400">v4.2.8-STABLE</strong></span>
          <span className="text-gray-700 hidden sm:inline">|</span>
          <span className="text-amber-500/90 font-bold hidden sm:inline">DRDO ADE RESTRICTED</span>
        </div>
      </footer>

      {/* Slide-out AI Tactical Copilot Console */}
      <CommandConsole
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
      />

      {/* Judge Guided Presentation & Evaluation Tour Modal */}
      <DemoTourModal />

      {/* Persistent Global Mission Intelligence Floating Badge */}
      <GarudaFloatingBadge />
    </div>
  );
};

export default function App() {
  return (
    <GcsProvider>
      <MainLayout />
    </GcsProvider>
  );
}
