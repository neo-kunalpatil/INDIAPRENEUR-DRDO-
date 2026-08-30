import React, { useState } from 'react';
import { 
  Cpu, 
  Flame, 
  Activity, 
  Layers, 
  Rotate3d, 
  Eye, 
  CheckCircle2, 
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  Sliders,
  Box,
  Search,
  Sparkles,
  Maximize,
  Ghost,
  Compass,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  Home,
  ArrowLeft,
  Focus
} from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';
import { EngineComponentId } from '../types';
import { DigitalTwinCanvas } from '../components/digital-twin/DigitalTwinCanvas';

export const DigitalTwinPage: React.FC = () => {
  const { selectedUav, telemetry } = useGcs();
  const [activeLayer, setActiveLayer] = useState<'THERMAL' | 'STRESS' | 'PHYSICS_DIFF' | 'MECHANICAL'>('THERMAL');
  const [selectedComponent, setSelectedComponent] = useState<EngineComponentId | null>(null);
  const [isExplodeActive, setIsExplodeActive] = useState<boolean>(false);
  const [isTransparent, setIsTransparent] = useState<boolean>(true);
  const [activeTabMode, setActiveTabMode] = useState<'TRANSPARENT' | 'LIVE' | 'EXPLODED' | 'PHOTOREALISTIC'>('TRANSPARENT');
  const [explorationLevel, setExplorationLevel] = useState<number>(0);
  const [isExplicitZoomRequested, setIsExplicitZoomRequested] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const componentDetails: Record<EngineComponentId, {
    name: string;
    subsystem: string;
    temp: number;
    stressMpa: number;
    vibration: number;
    healthScore: number;
    physicsExpectedTemp: number;
    notes: string;
    assemblyPath: string[];
  }> = {
    cylinder_1: {
      name: 'Cylinder #1 Combustion Assembly',
      subsystem: 'Combustion Chamber & Piston Assembly',
      temp: telemetry.chtC[0] || 112.5,
      stressMpa: 142,
      vibration: 2.1,
      healthScore: 94.2,
      physicsExpectedTemp: 111.0,
      notes: 'Bore clearance and compression ratio 9.0:1 nominal. Dual spark firing verified.',
      assemblyPath: ['Engine Core', 'Cylinder Bank', 'Cylinder #1', 'Piston Crown'],
    },
    cylinder_2: {
      name: 'Cylinder #2 Combustion Assembly',
      subsystem: 'Combustion Chamber & Piston Assembly',
      temp: telemetry.chtC[1] || 114.2,
      stressMpa: telemetry.knockIndex > 0.4 ? 238 : 148,
      vibration: telemetry.knockIndex > 0.4 ? 5.6 : 2.3,
      healthScore: telemetry.knockIndex > 0.4 ? 68.4 : 91.5,
      physicsExpectedTemp: 112.5,
      notes: telemetry.knockIndex > 0.4 
        ? 'WARNING: Incipient pre-ignition knock detected by piezoelectric acoustic sensor.' 
        : 'Piston crown thermal barrier coating intact. Exhaust valve lash nominal.',
      assemblyPath: ['Engine Core', 'Cylinder Bank', 'Cylinder #2', 'Piston Crown'],
    },
    cylinder_3: {
      name: 'Cylinder #3 Combustion Assembly (Overheat)',
      subsystem: 'Combustion Chamber & Piston Assembly',
      temp: telemetry.chtC[2] || 128.4,
      stressMpa: 154,
      vibration: 2.5,
      healthScore: 74.5,
      physicsExpectedTemp: 110.8,
      notes: 'EGT monitor indicates lean fuel distribution. Direct injector flow rate 98.4%.',
      assemblyPath: ['Engine Core', 'Cylinder Bank', 'Cylinder #3', 'Combustion Chamber'],
    },
    cylinder_4: {
      name: 'Cylinder #4 Combustion Assembly',
      subsystem: 'Combustion Chamber & Piston Assembly',
      temp: telemetry.chtC[3] || 113.4,
      stressMpa: 145,
      vibration: 2.2,
      healthScore: 92.0,
      physicsExpectedTemp: 112.0,
      notes: 'Air cooling baffle alignment within ±2mm specification. Cylinder head torque verified.',
      assemblyPath: ['Engine Core', 'Cylinder Bank', 'Cylinder #4', 'Piston Crown'],
    },
    turbocharger: {
      name: 'Exhaust Gas Turbocharger',
      subsystem: 'Forced Induction & Altitude Normalizer',
      temp: 680,
      stressMpa: 310,
      vibration: 3.4,
      healthScore: 89.2,
      physicsExpectedTemp: 665,
      notes: `Compressor impeller rotating at ${(telemetry.turbochargerRpm || 114500).toLocaleString()} RPM. Boost: ${telemetry.turboBoostBar || 0.88} bar. Wastegate servo duty cycle 42%.`,
      assemblyPath: ['Engine Core', 'Forced Induction', 'Turbocharger', 'Compressor Wheel'],
    },
    crankcase: {
      name: 'Horizontally-Opposed Crankcase',
      subsystem: 'Structural Core & Main Bearings',
      temp: telemetry.oilTempC || 106.2,
      stressMpa: 98,
      vibration: telemetry.vibrationRmsMmS || 2.35,
      healthScore: 96.8,
      physicsExpectedTemp: 104.5,
      notes: 'Main journal hydrodynamic oil film pressure 4.3 bar. Zero micro-cracking acoustic emissions.',
      assemblyPath: ['Engine Core', 'Crankcase', 'Main Crankshaft', 'Bearing Journal'],
    },
    intercooler: {
      name: 'Air-to-Air Intercooler',
      subsystem: 'Intake Charge Cooling Circuit',
      temp: 48.5,
      stressMpa: 42,
      vibration: 0.8,
      healthScore: 98.1,
      physicsExpectedTemp: 47.0,
      notes: 'Intake charge cooled by ΔT 62°C before entering plenum.',
      assemblyPath: ['Engine Core', 'Intake Subsystem', 'Plenum', 'Intercooler Fins'],
    },
    fuel_injection_rail: {
      name: 'Dual High-Pressure EFI Fuel Rail',
      subsystem: 'Fuel Metering & Atomization',
      temp: 36.2,
      stressMpa: 65,
      vibration: 1.2,
      healthScore: 95.0,
      physicsExpectedTemp: 35.0,
      notes: 'Injection pressure stabilized at 2.85 bar. Pulse width modulation 4.2ms.',
      assemblyPath: ['Engine Core', 'Fuel System', 'EFI Rail', 'Injectors'],
    },
    oil_cooling_circuit: {
      name: 'Thermostatic Oil Cooler Circuit',
      subsystem: 'Lubrication & Thermal Dissipation',
      temp: telemetry.oilTempC || 106.2,
      stressMpa: 72,
      vibration: 1.5,
      healthScore: 93.4,
      physicsExpectedTemp: 105.0,
      notes: `Scavenge pump flow rate 14.2 L/min. Oil pressure: ${telemetry.oilPressureBar || 4.35} bar.`,
      assemblyPath: ['Engine Core', 'Lubrication', 'Oil Pump', 'Radiator Circuit'],
    },
    dual_cdi_ignition: {
      name: 'Dual CDI Ignition Modules',
      subsystem: 'Electrical Ignition System',
      temp: 52.0,
      stressMpa: 30,
      vibration: 0.5,
      healthScore: 99.0,
      physicsExpectedTemp: 50.0,
      notes: 'Redundant dual channel A & B generating 35 kV firing sparks without misfire.',
      assemblyPath: ['Engine Core', 'Electrical', 'CDI Box', 'Ignition Coils'],
    },
    gearbox_prop_governor: {
      name: 'Integrated Helical Reduction Gearbox',
      subsystem: 'Torque Transfer & Propeller Governor',
      temp: 78.4,
      stressMpa: 185,
      vibration: 2.8,
      healthScore: 94.5,
      physicsExpectedTemp: 76.0,
      notes: 'Overload slipper clutch engaged. Propeller governor maintaining prop RPM.',
      assemblyPath: ['Engine Core', 'Transmission', 'Reduction Gearbox', 'Propeller Hub'],
    },
  };

  const currentComp = selectedComponent ? componentDetails[selectedComponent] : componentDetails['crankcase'];

  // CLICKING A COMPONENT ONLY HIGHLIGHTS AND OPENS HIERARCHY (NO CAMERA ZOOM)
  const handleComponentSelect = (id: EngineComponentId) => {
    setSelectedComponent(id);
    setExplorationLevel(1);
    setIsExplicitZoomRequested(false); // Do NOT move camera on click
  };

  // EXPLICIT FOCUS / ZOOM IN BUTTON CLICK
  const handleExplicitZoomRequest = () => {
    setIsExplicitZoomRequested(true);
    setExplorationLevel(prev => Math.min(4, prev + 1));
  };

  const handleLevelBack = () => {
    setExplorationLevel(prev => Math.max(0, prev - 1));
    if (explorationLevel <= 1) {
      setSelectedComponent(null);
      setIsExplicitZoomRequested(false);
    }
  };

  const handleHomeReset = () => {
    setExplorationLevel(0);
    setSelectedComponent(null);
    setIsExplicitZoomRequested(false);
  };

  const handleModeSwitch = (mode: 'TRANSPARENT' | 'LIVE' | 'EXPLODED' | 'PHOTOREALISTIC') => {
    setActiveTabMode(mode);
    if (mode === 'TRANSPARENT') {
      setIsTransparent(true);
      setIsExplodeActive(false);
    } else if (mode === 'EXPLODED') {
      setIsTransparent(false);
      setIsExplodeActive(true);
    } else {
      setIsTransparent(false);
      setIsExplodeActive(false);
    }
  };

  return (
    <div className="p-4 space-y-3 max-w-[1920px] mx-auto font-mono-code bg-[#0B0D12] min-h-screen text-gray-200">
      {/* Top Banner Navigation Header */}
      <div className="bg-[#111318]/95 border border-[#2A2D33] rounded p-3 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Rotate3d className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                INNOVATION #1 // CAD DIGITAL TWIN WORKBENCH
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase">INTERACTIVE CAD ENGINE INSPECTION</span>
            </div>
            <h1 className="font-bold text-lg md:text-xl text-white tracking-wide uppercase">
              ROTAX 914-TC 3D DIGITAL TWIN ENGINE WORKBENCH
            </h1>
          </div>
        </div>

        {/* 4 Mode Buttons */}
        <div className="flex flex-wrap items-center gap-2 bg-[#15171A] p-1.5 rounded border border-[#2A2D33] text-xs">
          <button
            onClick={() => handleModeSwitch('LIVE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition-all ${
              activeTabMode === 'LIVE' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Rotate3d className="w-3.5 h-3.5" />
            <div className="text-left">
              <div className="text-[11px] leading-tight">LIVE TWIN</div>
              <div className="text-[8px] opacity-75 font-normal">Real-Time Overview</div>
            </div>
          </button>

          <button
            onClick={() => handleModeSwitch('EXPLODED')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition-all ${
              activeTabMode === 'EXPLODED' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Maximize className="w-3.5 h-3.5" />
            <div className="text-left">
              <div className="text-[11px] leading-tight">EXPLODED VIEW</div>
              <div className="text-[8px] opacity-75 font-normal">Component Breakdown</div>
            </div>
          </button>

          <button
            onClick={() => handleModeSwitch('TRANSPARENT')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded font-bold transition-all ${
              activeTabMode === 'TRANSPARENT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Ghost className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <div className="text-[11px] leading-tight">TRANSPARENT MODE</div>
              <div className="text-[8px] opacity-75 font-normal text-amber-400/90">Internal Mechanics</div>
            </div>
          </button>

          <button
            onClick={() => handleModeSwitch('PHOTOREALISTIC')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition-all ${
              activeTabMode === 'PHOTOREALISTIC' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <div className="text-left">
              <div className="text-[11px] leading-tight">PHOTOREALISTIC</div>
              <div className="text-[8px] opacity-75 font-normal">Real Engine View</div>
            </div>
          </button>
        </div>
      </div>

      {/* Camera Breadcrumb Bar */}
      <div className="bg-[#111318]/95 border border-[#2A2D33] rounded px-3 py-1.5 shadow-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-gray-300">
          <span className="text-[10px] text-gray-500 uppercase font-bold">CAD HIERARCHY TREE:</span>
          <div className="flex items-center gap-1">
            {currentComp.assemblyPath.slice(0, explorationLevel + 1).map((step, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-gray-600" />}
                <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                  idx === explorationLevel ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'text-gray-400'
                }`}>
                  {step}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Level Controls & Explicit Zoom/Focus Trigger */}
        <div className="flex items-center gap-2">
          {selectedComponent && (
            <button
              onClick={handleExplicitZoomRequest}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold border border-blue-400 shadow text-[11px]"
            >
              <Focus className="w-3.5 h-3.5" />
              <span>Explicit Focus / Zoom In</span>
            </button>
          )}
          {explorationLevel > 0 && (
            <button
              onClick={handleLevelBack}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#15171A] hover:bg-[#2A2D33] text-gray-300 border border-[#2A2D33] text-[11px]"
            >
              <ArrowLeft className="w-3 h-3 text-blue-400" />
              <span>Back (Level {explorationLevel - 1})</span>
            </button>
          )}
          <button
            onClick={handleHomeReset}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#15171A] hover:bg-[#2A2D33] text-gray-300 border border-[#2A2D33] text-[11px]"
          >
            <Home className="w-3 h-3 text-amber-400" />
            <span>Reset View (Level 0)</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column: 3D CAD Viewport */}
        <div className="lg:col-span-8 bg-[#111318]/95 border border-[#2A2D33] rounded p-3 shadow-2xl flex flex-col min-h-[600px] relative">
          <div className="flex items-center justify-between mb-2 text-xs border-b border-[#2A2D33] pb-2">
            <div className="flex items-center gap-2 text-gray-300 font-bold">
              <Box className="w-4 h-4 text-amber-400" />
              <span>CAD VIEWPORT (CAMERA FIXED FULL ENGINE | CLICK = HIGHLIGHT & HIERARCHY ONLY)</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> STREAM: LIVE</span>
              <span>|</span>
              <span>REFRESHED: 20 ms ago</span>
            </div>
          </div>

          {/* 3D Canvas Viewport */}
          <div className="flex-1 relative rounded overflow-hidden">
            <DigitalTwinCanvas
              selectedComponent={selectedComponent}
              onSelectComponent={handleComponentSelect}
              activeLayer={activeLayer}
              isExplodeActive={isExplodeActive}
              isTransparent={isTransparent}
              explorationLevel={explorationLevel}
              isExplicitZoomRequested={isExplicitZoomRequested}
              telemetry={telemetry}
            />
          </div>

          {/* Bottom Toolbar Controls */}
          <div className="mt-2 pt-2 border-t border-[#2A2D33] flex items-center justify-center gap-4 text-xs">
            <button className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-500/40">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rotate</span>
            </button>
            <button className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#15171A] hover:bg-[#2A2D33] text-gray-400">
              <Compass className="w-3.5 h-3.5" />
              <span>Pan</span>
            </button>
            <button onClick={handleExplicitZoomRequest} className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#15171A] hover:bg-[#2A2D33] text-gray-400">
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Zoom In</span>
            </button>
            <button onClick={handleHomeReset} className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#15171A] hover:bg-[#2A2D33] text-gray-400">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Fit View</span>
            </button>
            <button className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#15171A] hover:bg-[#2A2D33] text-gray-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Section Cut</span>
            </button>
            <button onClick={handleHomeReset} className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#15171A] hover:bg-[#2A2D33] text-gray-400">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset View</span>
            </button>
          </div>
        </div>

        {/* Right Column: Component Telemetry Inspector Panel */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-[#111318]/95 border border-[#2A2D33] rounded p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2D33] pb-2">
              <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                COMPONENT TELEMETRY INSPECTOR
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                LIVE SYNC
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-gray-500 uppercase block">
                  {selectedComponent ? `Selected Component (Level ${explorationLevel})` : 'Entire Aero Engine Core'}
                </span>
                <h3 className="font-bold text-white text-base">{selectedComponent ? currentComp.name : 'Rotax 914-TC Aero Engine'}</h3>
                <span className="text-[11px] text-blue-400 block">{selectedComponent ? currentComp.subsystem : 'Flat-4 Turbocharged Engine Core'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-[#15171A] p-3 rounded border border-[#2A2D33]">
                  <span className="text-[10px] text-gray-400 block uppercase">TEMPERATURE</span>
                  <strong className="text-lg font-bold text-amber-400">
                    {typeof currentComp.temp === 'number' ? currentComp.temp.toFixed(1) : currentComp.temp} °C
                  </strong>
                </div>

                <div className="bg-[#15171A] p-3 rounded border border-[#2A2D33]">
                  <span className="text-[10px] text-gray-400 block uppercase">PRESSURE</span>
                  <strong className="text-lg font-bold text-blue-400">
                    {telemetry.oilPressureBar || 4.35} bar
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#15171A] p-3 rounded border border-[#2A2D33]">
                  <span className="text-[10px] text-gray-400 block uppercase">VIBRATION</span>
                  <strong className="text-base font-bold text-emerald-400">
                    {telemetry.vibrationRmsMmS || 2.35} mm/s
                  </strong>
                </div>

                <div className="bg-[#15171A] p-3 rounded border border-[#2A2D33]">
                  <span className="text-[10px] text-gray-400 block uppercase">HEALTH</span>
                  <strong className="text-base font-bold text-emerald-400">
                    {currentComp.healthScore}%
                  </strong>
                </div>
              </div>

              {/* Engine Overview Live Bars */}
              <div className="pt-2 border-t border-[#2A2D33] space-y-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">ENGINE OVERVIEW</span>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-400">RPM</span>
                    <span className="font-bold text-white">{(telemetry.rpm || 5120).toLocaleString()} RPM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">OIL PRESSURE</span>
                    <span className="font-bold text-emerald-400">{telemetry.oilPressureBar || 4.35} bar</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">OIL TEMPERATURE</span>
                    <span className="font-bold text-amber-400">{telemetry.oilTempC || 106.2} °C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">EGT (All Cylinders)</span>
                    <span className="font-bold text-red-400">{telemetry.egt || 765} °C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">FUEL FLOW</span>
                    <span className="font-bold text-emerald-400">{telemetry.fuelFlowLitersHr || 24.6} L/h</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded bg-blue-950/20 border border-blue-500/30 text-[11px] text-gray-300">
                <strong className="text-blue-400 block mb-0.5">Engineering Notes</strong>
                <p>• {currentComp.notes}</p>
                <p>• Camera fixed on full engine. Click = Highlight & Hierarchy Tree Only.</p>
                <p>• Explicit Focus / Zoom In available on request.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
