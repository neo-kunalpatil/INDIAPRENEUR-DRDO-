import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  UavUnit, 
  EngineTelemetry, 
  MissionProfile, 
  InjectedFault, 
  AlertNotification,
  DemoTourStep 
} from '../types';
import { 
  MOCK_UAV_FLEET, 
  MOCK_ACTIVE_MISSION, 
  PRESET_FAULTS, 
  INITIAL_ALERTS, 
  DEMO_TOUR_STEPS 
} from '../constants';

interface TacticalChatMessage {
  id: string;
  sender: 'OPERATOR' | 'AI_COPILOT' | 'SYSTEM';
  timestamp: string;
  text: string;
  suggestedAction?: string;
}

interface GcsContextType {
  uavFleet: UavUnit[];
  selectedUav: UavUnit;
  setSelectedUavId: (id: string) => void;
  telemetry: EngineTelemetry;
  mission: MissionProfile;
  activeFaults: InjectedFault[];
  injectFault: (faultId: string, severity?: number) => void;
  clearFault: (faultId: string) => void;
  clearAllFaults: () => void;
  alerts: AlertNotification[];
  acknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  voiceAlertsEnabled: boolean;
  setVoiceAlertsEnabled: (enabled: boolean) => void;
  speakVoiceAlert: (text: string) => void;
  replayTimeline: {
    currentFrame: number;
    totalFrames: number;
    currentTimestamp: string;
    totalDuration: string;
  };
  activeBookmark?: {
    id: string;
    timestamp: string;
    title: string;
    description: string;
    aiNarrativeSummary: string;
  };
  seekReplayTime: (frame: number) => void;
  isPlaying: boolean;
  playReplay: () => void;
  pauseReplay: () => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  isTourActive: boolean;
  currentTourStep: number;
  startDemoTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  endDemoTour: () => void;
  currentTourData?: DemoTourStep;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  chatMessages: TacticalChatMessage[];
  sendChatMessage: (msg: string) => void;
  nightVisionMode: boolean;
  toggleNightVisionMode: () => void;
  isSimulationRunning: boolean;
  toggleSimulation: () => void;
  resetTelemetryToNormal: () => void;
  customRulOffsetHours: number;
  setCustomRulOffsetHours: (hrs: number) => void;
}

const GcsContext = createContext<GcsContextType | undefined>(undefined);

export const GcsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uavFleet, setUavFleet] = useState<UavUnit[]>(MOCK_UAV_FLEET);
  const [selectedUavId, setSelectedUavIdState] = useState<string>('UAV-TAPAS-201');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useState<boolean>(true);
  const [nightVisionMode, setNightVisionMode] = useState<boolean>(false);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(true);
  const [activeFaults, setActiveFaults] = useState<InjectedFault[]>(PRESET_FAULTS);
  const [alerts, setAlerts] = useState<AlertNotification[]>(INITIAL_ALERTS);
  const [mission] = useState<MissionProfile>(MOCK_ACTIVE_MISSION);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [currentTourStep, setCurrentTourStep] = useState<number>(0);
  const [customRulOffsetHours, setCustomRulOffsetHours] = useState<number>(0);

  const selectedUav = uavFleet.find(u => u.id === selectedUavId) || uavFleet[0];

  // Base telemetry state for Rotax 914 Turbocharged Aero Piston Engine
  const [telemetry, setTelemetry] = useState<EngineTelemetry>({
    timestamp: new Date().toISOString(),
    rpm: 5120,
    manifoldPressureInHg: 35.8,
    throttlePercent: 86.5,
    coolantTempC: 98.4,
    oilTempC: 106.2,
    oilPressureBar: 4.35,
    fuelPressureBar: 2.85,
    fuelFlowLitersHr: 24.6,
    chtC: [112.5, 114.2, 111.8, 113.4],
    egtC: [765, 772, 760, 768],
    turbochargerRpm: 114500,
    turboBoostBar: 0.88,
    vibrationRmsMmS: 2.35,
    vibrationFftPeakHz: 85.3,
    knockIndex: 0.08,
    lambdaAirFuelRatio: 0.98,
    ambientTempC: -14.2,
    ambientPressureHpa: 432,
  });

  const [chatMessages, setChatMessages] = useState<TacticalChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'SYSTEM',
      timestamp: '11:40:00 UTC',
      text: 'DRDO GCS Digital Twin Telemetry Node Initialized. Connected to UAV-TAPAS-201 at Chitradurga ATR.',
    },
    {
      id: 'msg-2',
      sender: 'AI_COPILOT',
      timestamp: '11:40:05 UTC',
      text: 'Operational Status Normal. Physics+AI Hybrid Twin running in dual verification mode. Engine health index is 88.4%.',
    },
  ]);

  const speakVoiceAlert = useCallback((text: string) => {
    if (!voiceAlertsEnabled) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 0.95;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
      }
    }
  }, [voiceAlertsEnabled]);

  const setSelectedUavId = useCallback((id: string) => {
    setSelectedUavIdState(id);
    const targetUav = uavFleet.find(u => u.id === id);
    if (targetUav) {
      speakVoiceAlert(`Switching ground control telemetry to ${targetUav.callsign}`);
    }
  }, [uavFleet, speakVoiceAlert]);

  // Live telemetry pulse simulation with realistic noise & fault injection responsiveness
  useEffect(() => {
    if (!isSimulationRunning) return;

    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const noise = (Math.random() - 0.5);
        const hasTurboFault = activeFaults.some(f => f.type === 'TURBO_WASTEGATE_STUCK' && f.active);
        const hasInjectorFault = activeFaults.some(f => f.type === 'INJECTOR_3_CLOGGED' && f.active);
        const hasOilFault = activeFaults.some(f => f.type === 'OIL_PUMP_CAVITATION' && f.active);
        const hasKnockFault = activeFaults.some(f => f.type === 'CYLINDER_2_PREIGNITION' && f.active);

        // Adjust telemetry based on faults
        const targetRpm = hasTurboFault ? 4850 + noise * 60 : 5120 + noise * 25;
        const targetMap = hasTurboFault ? 29.4 + noise * 0.8 : 35.8 + noise * 0.2;
        const targetBoost = hasTurboFault ? 0.48 + noise * 0.05 : 0.88 + noise * 0.02;

        const cyl1Cht = 112.5 + noise * 0.8;
        const cyl2Cht = (hasKnockFault ? 134.8 : 114.2) + noise * 0.8;
        const cyl3Cht = (hasInjectorFault ? 128.4 : 111.8) + noise * 0.9;
        const cyl4Cht = 113.4 + noise * 0.8;

        const cyl1Egt = 765 + noise * 3;
        const cyl2Egt = 772 + noise * 3;
        const cyl3Egt = (hasInjectorFault ? 848 : 760) + noise * 4;
        const cyl4Egt = 768 + noise * 3;

        const oilPres = hasOilFault ? 2.15 + Math.sin(Date.now() / 1000) * 0.4 : 4.35 + noise * 0.05;
        const oilTemp = hasOilFault ? 119.5 + noise * 0.4 : 106.2 + noise * 0.2;
        const vibRms = (hasKnockFault || hasInjectorFault || hasOilFault) ? 5.8 + noise * 0.4 : 2.35 + noise * 0.15;
        const knock = hasKnockFault ? 0.74 + noise * 0.08 : 0.08 + Math.abs(noise * 0.02);

        return {
          timestamp: new Date().toISOString(),
          rpm: Math.round(targetRpm),
          manifoldPressureInHg: Number(targetMap.toFixed(1)),
          throttlePercent: prev.throttlePercent,
          coolantTempC: Number((98.4 + noise * 0.4).toFixed(1)),
          oilTempC: Number(oilTemp.toFixed(1)),
          oilPressureBar: Number(oilPres.toFixed(2)),
          fuelPressureBar: Number((2.85 + noise * 0.03).toFixed(2)),
          fuelFlowLitersHr: Number((24.6 + noise * 0.3).toFixed(1)),
          chtC: [Number(cyl1Cht.toFixed(1)), Number(cyl2Cht.toFixed(1)), Number(cyl3Cht.toFixed(1)), Number(cyl4Cht.toFixed(1))],
          egtC: [Math.round(cyl1Egt), Math.round(cyl2Egt), Math.round(cyl3Egt), Math.round(cyl4Egt)],
          turbochargerRpm: Math.round(hasTurboFault ? 88000 + noise * 1200 : 114500 + noise * 600),
          turboBoostBar: Number(targetBoost.toFixed(2)),
          vibrationRmsMmS: Number(vibRms.toFixed(2)),
          vibrationFftPeakHz: Number((85.3 + (hasInjectorFault ? 42.1 : 0) + noise * 1.5).toFixed(1)),
          knockIndex: Number(Math.min(1.0, Math.max(0, knock)).toFixed(2)),
          lambdaAirFuelRatio: Number((hasInjectorFault ? 1.14 : 0.98 + noise * 0.01).toFixed(2)),
          ambientTempC: prev.ambientTempC,
          ambientPressureHpa: prev.ambientPressureHpa,
        };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isSimulationRunning, activeFaults]);

  const injectFault = useCallback((faultId: string, severity?: number) => {
    let injectedFaultData: InjectedFault | undefined;
    const nowTimeStr = new Date().toLocaleTimeString();

    setActiveFaults((prev) =>
      prev.map((f) => {
        if (f.id === faultId) {
          const updated = {
            ...f,
            active: true,
            severityPercent: severity ?? f.severityPercent,
            timestampInjected: nowTimeStr,
          };
          injectedFaultData = updated;
          return updated;
        }
        return f;
      })
    );

    if (injectedFaultData) {
      const fault = injectedFaultData as InjectedFault;
      const uniqueAlertId = `ALT-INJ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newAlert: AlertNotification = {
        id: uniqueAlertId,
        timestamp: nowTimeStr + ' UTC',
        uavId: selectedUav.id,
        uavCallsign: selectedUav.callsign,
        severity: fault.severityPercent > 70 ? 'CRITICAL' : 'WARNING',
        title: `FAULT INJECTED: ${fault.name}`,
        message: `Simulated anomaly active at ${fault.severityPercent}% severity. Digital Twin Physics+AI disparity flagged on ${fault.component}.`,
        subsystem: `Injected Test / ${fault.component}`,
        suggestedAction: 'Observe AI explainability waterfall and cross-check Physics Verification matrix.',
        acknowledged: false,
      };

      setAlerts((curr) => [newAlert, ...curr]);
      speakVoiceAlert(`Warning: Anomaly injected. ${fault.name}`);
    }

    // Update UAV health index in state
    setUavFleet((prev) =>
      prev.map((u) => {
        if (u.id === selectedUav.id) {
          return {
            ...u,
            engineHealthIndex: Math.max(45, u.engineHealthIndex - 14),
            missionRiskScore: Math.min(85, u.missionRiskScore + 22),
            activeFaultsCount: u.activeFaultsCount + 1,
          };
        }
        return u;
      })
    );
  }, [selectedUav, speakVoiceAlert]);

  const clearFault = useCallback((faultId: string) => {
    setActiveFaults((prev) =>
      prev.map((f) => {
        if (f.id === faultId) {
          return { ...f, active: false, timestampInjected: undefined };
        }
        return f;
      })
    );
    speakVoiceAlert('Anomaly cleared. Engine baseline parameters stabilizing.');
  }, [speakVoiceAlert]);

  const clearAllFaults = useCallback(() => {
    setActiveFaults((prev) => prev.map((f) => ({ ...f, active: false, timestampInjected: undefined })));
    setUavFleet((prev) =>
      prev.map((u) => {
        if (u.id === selectedUav.id) {
          return {
            ...u,
            engineHealthIndex: 88.4,
            missionRiskScore: 18.2,
            activeFaultsCount: 0,
          };
        }
        return u;
      })
    );
    speakVoiceAlert('All simulated faults cleared. Aero engine restored to nominal flight health.');
  }, [selectedUav, speakVoiceAlert]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id === alertId) {
          return {
            ...a,
            acknowledged: true,
            acknowledgedBy: 'Tactical Operator / ADE GCS',
            acknowledgedAt: new Date().toLocaleTimeString() + ' UTC',
          };
        }
        return a;
      })
    );
  }, []);

  const sendChatMessage = useCallback((msg: string) => {
    const userMsg: TacticalChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      sender: 'OPERATOR',
      timestamp: new Date().toLocaleTimeString() + ' UTC',
      text: msg,
    };

    setChatMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      let responseText = `Telemetry analysis complete for ${selectedUav.callsign}. Sensor readings are consistent with flight level FL220 altitude conditions.`;
      const lower = msg.toLowerCase();

      if (lower.includes('rul') || lower.includes('useful life') || lower.includes('hours')) {
        responseText = `Current Mission-Aware RUL for Rotax 914-TC is estimated at ${selectedUav.predictedRulHours} flight hours. Under high-altitude mountain loiter, cylinder head thermal gradient is the primary limiting factor.`;
      } else if (lower.includes('turbo') || lower.includes('boost') || lower.includes('map')) {
        responseText = `Turbocharger spool speed is at ${telemetry.turbochargerRpm.toLocaleString()} RPM with boost pressure of ${telemetry.turboBoostBar} bar (MAP: ${telemetry.manifoldPressureInHg} inHg). Physics thermodynamic model reports 99.1% efficiency.`;
      } else if (lower.includes('cylinder') || lower.includes('temp') || lower.includes('egt') || lower.includes('cht')) {
        responseText = `Cylinder temperatures: CHT [${telemetry.chtC.join(', ')} °C], EGT [${telemetry.egtC.join(', ')} °C]. Bank 1 to Bank 2 thermal gradient is within nominal MIL-STD-810H tolerance (+2.4°C).`;
      } else if (lower.includes('risk') || lower.includes('go') || lower.includes('abort')) {
        responseText = `Mission Risk Score is ${selectedUav.missionRiskScore}% (VERDICT: GO FOR EXTENDED SURVEILLANCE). Weather factor and engine stability indices are green.`;
      } else if (lower.includes('fault') || lower.includes('anomaly')) {
        const active = activeFaults.filter(f => f.active);
        if (active.length > 0) {
          responseText = `ATTENTION: ${active.length} active fault(s) detected: ${active.map(a => a.name).join(', ')}. Physics-AI hybrid disparity score has risen to 32%. Recommend observing XAI feature attribution.`;
        } else {
          responseText = `No active mechanical or combustion faults currently flagged. Continuous edge learning threshold engine is operating at baseline.`;
        }
      }

      const copilotMsg: TacticalChatMessage = {
        id: `chat-res-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        sender: 'AI_COPILOT',
        timestamp: new Date().toLocaleTimeString() + ' UTC',
        text: responseText,
      };

      setChatMessages((prev) => [...prev, copilotMsg]);
    }, 600);
  }, [selectedUav, telemetry, activeFaults]);

  const toggleNightVisionMode = useCallback(() => {
    setNightVisionMode((prev) => !prev);
  }, []);

  const toggleSimulation = useCallback(() => {
    setIsSimulationRunning((prev) => !prev);
  }, []);

  const resetTelemetryToNormal = useCallback(() => {
    clearAllFaults();
  }, [clearAllFaults]);

  const startDemoTour = useCallback(() => {
    setIsTourActive(true);
    setCurrentTourStep(0);
    setActiveTab(DEMO_TOUR_STEPS[0].pageTarget === '/' ? 'dashboard' : DEMO_TOUR_STEPS[0].pageTarget.replace('/', ''));
    speakVoiceAlert('Starting DRDO Ground Control Station Interactive Innovation Tour.');
  }, [speakVoiceAlert]);

  const nextTourStep = useCallback(() => {
    setCurrentTourStep((prev) => {
      const next = prev + 1;
      if (next < DEMO_TOUR_STEPS.length) {
        const targetPage = DEMO_TOUR_STEPS[next].pageTarget;
        setActiveTab(targetPage === '/' ? 'dashboard' : targetPage.replace('/', ''));
        speakVoiceAlert(`Tour step ${next + 1}: ${DEMO_TOUR_STEPS[next].innovationName}`);
        return next;
      }
      setIsTourActive(false);
      speakVoiceAlert('Innovation tour concluded. System ready for open exploration.');
      return prev;
    });
  }, [speakVoiceAlert]);

  const prevTourStep = useCallback(() => {
    setCurrentTourStep((prev) => {
      const prevStep = Math.max(0, prev - 1);
      const targetPage = DEMO_TOUR_STEPS[prevStep].pageTarget;
      setActiveTab(targetPage === '/' ? 'dashboard' : targetPage.replace('/', ''));
      return prevStep;
    });
  }, []);

  const [replayFrame, setReplayFrame] = useState<number>(120);
  const [isPlayingReplay, setIsPlayingReplay] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const seekReplayTime = useCallback((frame: number) => {
    setReplayFrame(frame);
  }, []);

  const playReplay = useCallback(() => {
    setIsPlayingReplay(true);
  }, []);

  const pauseReplay = useCallback(() => {
    setIsPlayingReplay(false);
  }, []);

  const replayTimeline = {
    currentFrame: replayFrame,
    totalFrames: 1000,
    currentTimestamp: `T+0${Math.floor(replayFrame / 300)}:${String(Math.floor((replayFrame % 300) / 5)).padStart(2, '0')}:00`,
    totalDuration: '03:20:00',
  };

  const activeBookmark = {
    id: 'bm-current',
    timestamp: replayTimeline.currentTimestamp,
    title: 'Sortie Loiter Phase Telemetry Slice',
    description: 'Black-box flight recording slice synchronized with multi-agent neural health diagnostics and physical sensor models.',
    aiNarrativeSummary: 'Engine operating parameters nominal. Physics and AI models in 98.7% convergence.',
  };

  const endDemoTour = useCallback(() => {
    setIsTourActive(false);
  }, []);

  return (
    <GcsContext.Provider
      value={{
        uavFleet,
        selectedUav,
        setSelectedUavId,
        telemetry,
        mission,
        activeFaults,
        injectFault,
        clearFault,
        clearAllFaults,
        alerts,
        acknowledgeAlert,
        dismissAlert,
        voiceAlertsEnabled,
        setVoiceAlertsEnabled,
        speakVoiceAlert,
        replayTimeline,
        activeBookmark,
        seekReplayTime,
        isPlaying: isPlayingReplay,
        playReplay,
        pauseReplay,
        playbackSpeed: replaySpeed,
        setPlaybackSpeed: setReplaySpeed,
        isTourActive,
        currentTourStep,
        startDemoTour,
        nextTourStep,
        prevTourStep,
        endDemoTour,
        currentTourData: isTourActive ? DEMO_TOUR_STEPS[currentTourStep] : undefined,
        activeTab,
        setActiveTab,
        chatMessages,
        sendChatMessage,
        nightVisionMode,
        toggleNightVisionMode,
        isSimulationRunning,
        toggleSimulation,
        resetTelemetryToNormal,
        customRulOffsetHours,
        setCustomRulOffsetHours,
      }}
    >
      {children}
    </GcsContext.Provider>
  );
};

export const useGcs = (): GcsContextType => {
  const context = useContext(GcsContext);
  if (!context) {
    throw new Error('useGcs must be used within a GcsProvider');
  }
  return context;
};
