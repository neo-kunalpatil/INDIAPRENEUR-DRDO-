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
  Sliders
} from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';
import { EngineComponentId } from '../types';

export const DigitalTwinPage: React.FC = () => {
  const { selectedUav, telemetry, activeFaults } = useGcs();
  const [activeLayer, setActiveLayer] = useState<'THERMAL' | 'STRESS' | 'PHYSICS_DIFF' | 'MECHANICAL'>('THERMAL');
  const [selectedComponent, setSelectedComponent] = useState<EngineComponentId>('cylinder_3');
  const [rotationAngle, setRotationAngle] = useState<number>(25);

  const componentDetails: Record<EngineComponentId, {
    name: string;
    subsystem: string;
    temp: number;
    stressMpa: number;
    vibration: number;
    healthScore: number;
    physicsExpectedTemp: number;
    notes: string;
  }> = {
    cylinder_1: {
      name: 'Cylinder #1 Combustion Assembly (Front Right)',
      subsystem: 'Combustion Chamber & Piston Assembly',
      temp: telemetry.chtC[0],
      stressMpa: 142,
      vibration: 2.1,
      healthScore: 94.2,
      physicsExpectedTemp: 111.0,
      notes: 'Bore clearance and compression ratio 9.0:1 nominal. Dual spark firing verified.',
    },
    cylinder_2: {
      name: 'Cylinder #2 Combustion Assembly (Rear Right)',
      subsystem: 'Combustion Chamber & Piston Assembly',
      temp: telemetry.chtC[1],
      stressMpa: telemetry.knockIndex > 0.4 ? 238 : 148,
      vibration: telemetry.knockIndex > 0.4 ? 5.6 : 2.3,
      healthScore: telemetry.knockIndex > 0.4 ? 68.4 : 91.5,
      physicsExpectedTemp: 112.5,
      notes: telemetry.knockIndex > 0.4 
        ? 'WARNING: Incipient pre-ignition knock detected by piezoelectric acoustic sensor.' 
        : 'Piston crown thermal barrier coating intact. Exhaust valve lash nominal.',
    },
    cylinder_3: {
      name: 'Cylinder #3 Combustion Assembly (Front Left)',
      subsystem: 'Combustion Chamber & Piston Assembly',
      temp: telemetry.chtC[2],
      stressMpa: 154,
      vibration: 2.5,
      healthScore: telemetry.egtC[2] > 800 ? 74.5 : 88.0,
      physicsExpectedTemp: 110.8,
      notes: 'EGT monitor indicates lean fuel distribution. Direct injector flow rate 98.4%.',
    },
    cylinder_4: {
      name: 'Cylinder #4 Combustion Assembly (Rear Left)',
      subsystem: 'Combustion Chamber & Piston Assembly',
      temp: telemetry.chtC[3],
      stressMpa: 145,
      vibration: 2.2,
      healthScore: 92.0,
      physicsExpectedTemp: 112.0,
      notes: 'Air cooling baffle alignment within ±2mm specification. Cylinder head torque verified.',
    },
    turbocharger: {
      name: 'Exhaust Gas Turbocharger & Automatic Wastegate',
      subsystem: 'Forced Induction & Altitude Normalizer',
      temp: 680,
      stressMpa: 310,
      vibration: 3.4,
      healthScore: 89.2,
      physicsExpectedTemp: 665,
      notes: `Compressor impeller rotating at ${telemetry.turbochargerRpm.toLocaleString()} RPM. Boost: ${telemetry.turboBoostBar} bar. Wastegate servo duty cycle 42%.`,
    },
    crankcase: {
      name: 'Horizontally-Opposed Aluminum Alloy Crankcase',
      subsystem: 'Structural Core & Main Bearings',
      temp: telemetry.oilTempC,
      stressMpa: 98,
      vibration: telemetry.vibrationRmsMmS,
      healthScore: 96.8,
      physicsExpectedTemp: 104.5,
      notes: 'Main journal hydrodynamic oil film pressure 4.3 bar. Zero micro-cracking acoustic acoustic emissions.',
    },
    intercooler: {
      name: 'Air-to-Air Charged Air Intercooler',
      subsystem: 'Intake Charge Cooling Circuit',
      temp: 48.5,
      stressMpa: 42,
      vibration: 0.8,
      healthScore: 98.1,
      physicsExpectedTemp: 47.0,
      notes: 'Intake charge cooled by ΔT 62°C before entering DellOrto/EFI plenum.',
    },
    fuel_injection_rail: {
      name: 'Dual High-Pressure Electronic Fuel Injection Rail',
      subsystem: 'Fuel Metering & Atomization',
      temp: 36.2,
      stressMpa: 65,
      vibration: 1.2,
      healthScore: 95.0,
      physicsExpectedTemp: 35.0,
      notes: 'Injection pressure stabilized at 2.85 bar. Pulse width modulation 4.2ms.',
    },
    oil_cooling_circuit: {
      name: 'Thermostatic Dry-Sump Oil Tank & Radiator Circuit',
      subsystem: 'Lubrication & Thermal Dissipation',
      temp: telemetry.oilTempC,
      stressMpa: 72,
      vibration: 1.5,
      healthScore: telemetry.oilPressureBar < 2.5 ? 65.0 : 93.4,
      physicsExpectedTemp: 105.0,
      notes: `Scavenge pump flow rate 14.2 L/min. Oil pressure: ${telemetry.oilPressureBar} bar.`,
    },
    dual_cdi_ignition: {
      name: 'Dual Capacitive Discharge Ignition (CDI) Modules',
      subsystem: 'Electrical Ignition System',
      temp: 52.0,
      stressMpa: 30,
      vibration: 0.5,
      healthScore: 99.0,
      physicsExpectedTemp: 50.0,
      notes: 'Redundant dual channel A & B generating 35 kV firing sparks without misfire.',
    },
    gearbox_prop_governor: {
      name: 'Integrated Helical Reduction Gearbox (Ratio 1:2.43)',
      subsystem: 'Torque Transfer & Propeller Governor',
      temp: 78.4,
      stressMpa: 185,
      vibration: 2.8,
      healthScore: 94.5,
      physicsExpectedTemp: 76.0,
      notes: 'Overload slipper clutch engaged. Propeller governor maintaining 2,240 prop RPM.',
    },
  };

  const currentComp = componentDetails[selectedComponent];

  const getHeatColor = (temp: number) => {
    if (temp > 125 || (selectedComponent === 'turbocharger' && temp > 720)) return '#ef4444';
    if (temp > 115 || (selectedComponent === 'turbocharger' && temp > 670)) return '#f59e0b';
    return '#06b6d4';
  };

  return (
    <div id="digital-twin-canvas" className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              Interactive 3D Digital Twin & Multi-Layer Health Map
            </h1>
            <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono-code font-bold">
              SYNC FIDELITY: {selectedUav.twinConfidenceScore}%
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            Real-time finite element thermal & mechanical stress telemetry projection on Rotax 914-TC 3D geometry
          </p>
        </div>

        {/* Layer Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono-code">
          {(['THERMAL', 'STRESS', 'PHYSICS_DIFF', 'MECHANICAL'] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeLayer === layer
                  ? 'bg-indigo-600 text-[var(--text-primary)] shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {layer === 'THERMAL' && <Flame className="w-3.5 h-3.5 text-orange-400" />}
              {layer === 'STRESS' && <Activity className="w-3.5 h-3.5 text-amber-400" />}
              {layer === 'PHYSICS_DIFF' && <Cpu className="w-3.5 h-3.5 text-cyan-400" />}
              {layer === 'MECHANICAL' && <Layers className="w-3.5 h-3.5 text-purple-400" />}
              <span>{layer.replace('_', ' ')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Model Stage + Diagnostics Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 8 Cols: Interactive 3D Model Visualizer */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden min-h-[500px]">
          {/* Tactical Grid & Ambient Glow */}
          <div className="absolute inset-0 tactical-grid opacity-20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Model HUD Overlay Top Bar */}
          <div className="flex items-center justify-between z-10 text-xs font-mono-code">
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <Rotate3d className="w-4 h-4 text-cyan-400" />
              <span>ISOMETRIC PROJECTION (AZIMUTH {rotationAngle}°)</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">LAYER:</span>
              <span className="font-bold text-indigo-300">{activeLayer}</span>
            </div>
          </div>

          {/* Isometric Engine SVG Schematic with Selectable Hotspots */}
          <div className="relative flex-1 flex items-center justify-center my-6 z-10">
            <svg
              viewBox="0 0 800 480"
              className="w-full max-w-2xl h-auto drop-shadow-2xl transition-transform duration-300"
              style={{ transform: `rotateY(${rotationAngle}deg)` }}
            >
              {/* Crankcase Central Core */}
              <rect
                x="280"
                y="180"
                width="240"
                height="150"
                rx="18"
                fill="#0f172a"
                stroke={selectedComponent === 'crankcase' ? '#06b6d4' : '#334155'}
                strokeWidth={selectedComponent === 'crankcase' ? 4 : 2}
                className="cursor-pointer hover:fill-slate-800 transition-all"
                onClick={() => setSelectedComponent('crankcase')}
              />
              <text x="400" y="260" textAnchor="middle" fill="#94a3b8" fontSize="13" fontFamily="monospace" fontWeight="bold">
                CRANKCASE CORE (LUBRICATION)
              </text>

              {/* Cylinders Bank 1 (Right: Cyl 1 & 2) */}
              {/* Cyl 1 */}
              <g onClick={() => setSelectedComponent('cylinder_1')} className="cursor-pointer group">
                <rect
                  x="530"
                  y="150"
                  width="130"
                  height="80"
                  rx="10"
                  fill={activeLayer === 'THERMAL' ? '#0c4a6e' : '#1e293b'}
                  stroke={selectedComponent === 'cylinder_1' ? '#38bdf8' : '#0284c7'}
                  strokeWidth={selectedComponent === 'cylinder_1' ? 3 : 1.5}
                />
                {/* Cooling Fins */}
                <line x1="545" y1="165" x2="645" y2="165" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" />
                <line x1="545" y1="180" x2="645" y2="180" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" />
                <line x1="545" y1="195" x2="645" y2="195" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" />
                <line x1="545" y1="210" x2="645" y2="210" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" />
                <text x="595" y="195" textAnchor="middle" fill="#f8fafc" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  CYL #1 ({telemetry.chtC[0]}°C)
                </text>
              </g>

              {/* Cyl 2 */}
              <g onClick={() => setSelectedComponent('cylinder_2')} className="cursor-pointer group">
                <rect
                  x="530"
                  y="260"
                  width="130"
                  height="80"
                  rx="10"
                  fill={activeLayer === 'THERMAL' && telemetry.chtC[1] > 125 ? '#7f1d1d' : '#1e293b'}
                  stroke={selectedComponent === 'cylinder_2' ? '#f43f5e' : telemetry.chtC[1] > 125 ? '#ef4444' : '#475569'}
                  strokeWidth={selectedComponent === 'cylinder_2' ? 3 : 1.5}
                />
                <line x1="545" y1="275" x2="645" y2="275" stroke="#f43f5e" strokeWidth="1.5" strokeOpacity="0.6" />
                <line x1="545" y1="290" x2="645" y2="290" stroke="#f43f5e" strokeWidth="1.5" strokeOpacity="0.6" />
                <line x1="545" y1="305" x2="645" y2="305" stroke="#f43f5e" strokeWidth="1.5" strokeOpacity="0.6" />
                <line x1="545" y1="320" x2="645" y2="320" stroke="#f43f5e" strokeWidth="1.5" strokeOpacity="0.6" />
                <text x="595" y="305" textAnchor="middle" fill="#f8fafc" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  CYL #2 ({telemetry.chtC[1]}°C)
                </text>
              </g>

              {/* Cylinders Bank 2 (Left: Cyl 3 & 4) */}
              {/* Cyl 3 */}
              <g onClick={() => setSelectedComponent('cylinder_3')} className="cursor-pointer group">
                <rect
                  x="140"
                  y="150"
                  width="130"
                  height="80"
                  rx="10"
                  fill={activeLayer === 'THERMAL' && telemetry.chtC[2] > 120 ? '#78350f' : '#0c4a6e'}
                  stroke={selectedComponent === 'cylinder_3' ? '#fbbf24' : '#d97706'}
                  strokeWidth={selectedComponent === 'cylinder_3' ? 3 : 1.5}
                />
                <line x1="155" y1="165" x2="255" y2="165" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.6" />
                <line x1="155" y1="180" x2="255" y2="180" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.6" />
                <line x1="155" y1="195" x2="255" y2="195" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.6" />
                <line x1="155" y1="210" x2="255" y2="210" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.6" />
                <text x="205" y="195" textAnchor="middle" fill="#f8fafc" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  CYL #3 ({telemetry.chtC[2]}°C)
                </text>
              </g>

              {/* Cyl 4 */}
              <g onClick={() => setSelectedComponent('cylinder_4')} className="cursor-pointer group">
                <rect
                  x="140"
                  y="260"
                  width="130"
                  height="80"
                  rx="10"
                  fill={activeLayer === 'THERMAL' ? '#0c4a6e' : '#1e293b'}
                  stroke={selectedComponent === 'cylinder_4' ? '#38bdf8' : '#0284c7'}
                  strokeWidth={selectedComponent === 'cylinder_4' ? 3 : 1.5}
                />
                <line x1="155" y1="275" x2="255" y2="275" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" />
                <line x1="155" y1="290" x2="255" y2="290" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" />
                <line x1="155" y1="305" x2="255" y2="305" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" />
                <line x1="155" y1="320" x2="255" y2="320" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" />
                <text x="205" y="305" textAnchor="middle" fill="#f8fafc" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  CYL #4 ({telemetry.chtC[3]}°C)
                </text>
              </g>

              {/* Turbocharger Assembly Top Center */}
              <g onClick={() => setSelectedComponent('turbocharger')} className="cursor-pointer group">
                <circle
                  cx="400"
                  cy="95"
                  r="52"
                  fill={activeLayer === 'THERMAL' ? '#831843' : '#1e1b4b'}
                  stroke={selectedComponent === 'turbocharger' ? '#ec4899' : '#a855f7'}
                  strokeWidth={selectedComponent === 'turbocharger' ? 3 : 2}
                />
                <circle cx="400" cy="95" r="28" fill="#0f172a" stroke="#ec4899" strokeWidth="1.5" />
                <path d="M 380 95 Q 400 75 420 95 Q 400 115 380 95" fill="#ec4899" opacity="0.8" />
                <text x="400" y="100" textAnchor="middle" fill="#fff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  TURBO ({telemetry.turboBoostBar} bar)
                </text>
              </g>

              {/* Gearbox & Propeller Flange Bottom */}
              <g onClick={() => setSelectedComponent('gearbox_prop_governor')} className="cursor-pointer group">
                <polygon
                  points="340,340 460,340 430,420 370,420"
                  fill="#1e293b"
                  stroke={selectedComponent === 'gearbox_prop_governor' ? '#10b981' : '#334155'}
                  strokeWidth={selectedComponent === 'gearbox_prop_governor' ? 3 : 1.5}
                />
                <circle cx="400" cy="420" r="16" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
                <text x="400" y="380" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  REDUCTION GEARBOX (1:2.43)
                </text>
              </g>
            </svg>
          </div>

          {/* Model Controls Footer */}
          <div className="flex items-center justify-between z-10 pt-3 border-t border-slate-800 text-xs font-mono-code">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">CAMERA ROTATION:</span>
              <button
                onClick={() => setRotationAngle(prev => (prev - 15))}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
              >
                ⟲ -15°
              </button>
              <button
                onClick={() => setRotationAngle(0)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
              >
                FRONT 0°
              </button>
              <button
                onClick={() => setRotationAngle(prev => (prev + 15))}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
              >
                ⟳ +15°
              </button>
            </div>

            {/* Heat Gradient Legend */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[10px]">TEMP SCALE:</span>
              <div className="w-28 h-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-amber-500 to-red-600 border border-slate-700" />
              <span className="text-[10px] text-slate-400">80°C → 850°C</span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Selected Component Diagnostics & Telemetry Sync */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Diagnostic Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5 mb-3">
              <div>
                <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {currentComp.subsystem}
                </span>
                <h3 className="font-heading font-bold text-base text-slate-100 mt-1">
                  {currentComp.name}
                </h3>
              </div>
              <span className={`font-telemetry font-bold text-lg ${
                currentComp.healthScore > 85 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {currentComp.healthScore.toFixed(1)}%
              </span>
            </div>

            {/* Telemetry Metrics for Component */}
            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono-code mb-3">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">MEASURED TEMP</span>
                <span className="font-telemetry font-bold text-xl text-slate-100">
                  {currentComp.temp}°C
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Expected: {currentComp.physicsExpectedTemp}°C
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">STRESS TENSOR</span>
                <span className="font-telemetry font-bold text-xl text-indigo-300">
                  {currentComp.stressMpa} MPa
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Yield Limit: 420 MPa
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">VIBRATION RMS</span>
                <span className="font-telemetry font-bold text-xl text-slate-100">
                  {currentComp.vibration} mm/s
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ISO Class I
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">PHYSICS RESIDUAL</span>
                <span className="font-telemetry font-bold text-xl text-emerald-400">
                  {(Math.abs(currentComp.temp - currentComp.physicsExpectedTemp)).toFixed(1)}°C
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ΔE &lt; 2.5% (Nominal)
                </span>
              </div>
            </div>

            {/* Diagnostic Commentary */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-cyan-400 font-mono-code font-bold text-[11px] mb-1">
                <Info className="w-3.5 h-3.5" />
                <span>PHYSICS-AI DIAGNOSTIC SUMMARY:</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                {currentComp.notes}
              </p>
            </div>
          </div>

          {/* Quick Component Selector Grid */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs font-mono-code">
            <h4 className="font-heading font-bold text-xs text-slate-400 uppercase mb-2">
              Select Component For Inspection
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(componentDetails).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setSelectedComponent(key as EngineComponentId)}
                  className={`p-2 rounded-lg border text-left truncate transition-colors ${
                    selectedComponent === key
                      ? 'bg-cyan-950 border-cyan-600 text-cyan-200 font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {val.name.split(' ')[0]} {val.name.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
