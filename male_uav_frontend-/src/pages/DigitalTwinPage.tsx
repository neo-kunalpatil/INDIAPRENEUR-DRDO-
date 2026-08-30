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
  const [activeLayer, setActiveLayer] = useState<'THERMAL' | 'STRESS' | 'AI_PREDICTION' | 'VIBRATION'>('THERMAL');
  const [selectedComponent, setSelectedComponent] = useState<EngineComponentId>('cylinder_3');
  const [rotationAngle, setRotationAngle] = useState<number>(35);
  const [elevationAngle, setElevationAngle] = useState<number>(15);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [isSectionView, setIsSectionView] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const componentDetails: Record<EngineComponentId, {
    name: string;
    subsystem: string;
    temp: number;
    stressMpa: number;
    vibration: number;
    healthScore: number;
    physicsExpectedTemp: number;
    material: string;
    notes: string;
  }> = {
    cylinder_1: {
      name: 'Cylinder #1 Assembly (Front Right)',
      subsystem: 'Air-Cooled Cylinder Head & Piston',
      temp: telemetry.chtC[0],
      stressMpa: 142,
      vibration: 2.1,
      healthScore: 94.2,
      physicsExpectedTemp: 111.0,
      material: 'Nikasil-Coated Aluminum Alloy 7075-T6',
      notes: 'Bore clearance 0.045mm. Dual CDI ignition spark firing verified.',
    },
    cylinder_2: {
      name: 'Cylinder #2 Assembly (Rear Right)',
      subsystem: 'Air-Cooled Cylinder Head & Piston',
      temp: telemetry.chtC[1],
      stressMpa: telemetry.knockIndex > 0.4 ? 238 : 148,
      vibration: telemetry.knockIndex > 0.4 ? 5.6 : 2.3,
      healthScore: telemetry.knockIndex > 0.4 ? 68.4 : 91.5,
      physicsExpectedTemp: 112.5,
      material: 'Nikasil-Coated Aluminum Alloy 7075-T6',
      notes: telemetry.knockIndex > 0.4 
        ? 'WARNING: Pre-ignition acoustic knock detected by piezoelectric sensor.' 
        : 'Piston crown thermal coating intact. Valve lash clearance nominal.',
    },
    cylinder_3: {
      name: 'Cylinder #3 Assembly (Front Left)',
      subsystem: 'Air-Cooled Cylinder Head & Piston',
      temp: telemetry.chtC[2],
      stressMpa: 198,
      vibration: 3.8,
      healthScore: 84.6,
      physicsExpectedTemp: 115.0,
      material: 'Nikasil-Coated Aluminum Alloy 7075-T6',
      notes: 'Thermal gradient peak (+18.4°C over nominal). Exhaust valve thermal stress.',
    },
    cylinder_4: {
      name: 'Cylinder #4 Assembly (Rear Left)',
      subsystem: 'Air-Cooled Cylinder Head & Piston',
      temp: telemetry.chtC[3],
      stressMpa: 135,
      vibration: 1.9,
      healthScore: 96.0,
      physicsExpectedTemp: 110.5,
      material: 'Nikasil-Coated Aluminum Alloy 7075-T6',
      notes: 'Nominal cylinder head temperature & fuel-air equivalence ratio.',
    },
    turbocharger: {
      name: 'Rotax 914 Turbocharger & Wastegate',
      subsystem: 'Air Induction & Boost Regulation',
      temp: telemetry.egtC[0] || 745,
      stressMpa: 310,
      vibration: telemetry.turbochargerRpm > 140000 ? 6.2 : 2.8,
      healthScore: telemetry.turbochargerRpm > 140000 ? 76.5 : 95.8,
      physicsExpectedTemp: 690.0,
      material: 'Inconel 718 Superalloy & Ceramic Ball Bearings',
      notes: `Compressor RPM: ${telemetry.turbochargerRpm.toLocaleString()} RPM. Boost: ${telemetry.turboBoostBar.toFixed(2)} bar.`,
    },
    crankcase: {
      name: 'Split Alloy Crankcase Core',
      subsystem: 'Powerplant Main Housing & Lubrication',
      temp: telemetry.oilTempC,
      stressMpa: 95,
      vibration: telemetry.vibrationRmsMmS,
      healthScore: 98.4,
      physicsExpectedTemp: 88.0,
      material: 'Cast Aircraft Grade Aluminum-Magnesium Alloy',
      notes: `Oil Pressure: ${telemetry.oilPressureBar.toFixed(2)} bar. Hydrodynamic main bearing oil film stable.`,
    },
    gearbox_prop_governor: {
      name: 'Integrated Reduction Gearbox (1:2.43)',
      subsystem: 'Propeller Speed Reduction & Governor',
      temp: telemetry.oilTempC + 8,
      stressMpa: 210,
      vibration: 1.8,
      healthScore: 97.1,
      physicsExpectedTemp: 92.0,
      material: 'Case-Hardened Forged Chrome-Moly Steel 4340',
      notes: 'Helical gear mesh friction coefficient 0.012. Torsional shock absorber intact.',
    },
  };

  const currentComp = componentDetails[selectedComponent];

  const getLayerColor = (compKey: EngineComponentId) => {
    const comp = componentDetails[compKey];
    if (activeLayer === 'THERMAL') {
      if (comp.temp > 135 || (compKey === 'turbocharger' && comp.temp > 780)) return '#ef4444'; // Red
      if (comp.temp > 120 || (compKey === 'turbocharger' && comp.temp > 710)) return '#f59e0b'; // Amber
      return '#06b6d4'; // Cyan
    } else if (activeLayer === 'STRESS') {
      if (comp.stressMpa > 250) return '#ef4444';
      if (comp.stressMpa > 180) return '#f59e0b';
      return '#3b82f6';
    } else if (activeLayer === 'AI_PREDICTION') {
      if (comp.healthScore < 75) return '#ef4444';
      if (comp.healthScore < 88) return '#f59e0b';
      return '#10b981';
    } else { // VIBRATION
      if (comp.vibration > 4.5) return '#ef4444';
      if (comp.vibration > 3.0) return '#f59e0b';
      return '#8b5cf6';
    }
  };

  const explodedOffset = isExploded ? 65 : 0;

  return (
    <div id="digital-twin-canvas" className="p-4 space-y-4 max-w-[1920px] mx-auto font-mono-code text-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              Rotax 914-TC Defense 3D Digital Twin Visualizer
            </h1>
            <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono-code font-bold">
              SCADA SYNC: {selectedUav.twinConfidenceScore}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time finite element PBR materials, FEA stress tensors, thermal heatmaps &amp; 3D rotatable aero-engine geometry
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {(['THERMAL', 'STRESS', 'PHYSICS_DISPARITY', 'AI_PREDICTION', 'VIBRATION'] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeLayer === layer
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {layer === 'THERMAL' && <Flame className="w-3.5 h-3.5 text-orange-400" />}
              {layer === 'STRESS' && <Activity className="w-3.5 h-3.5 text-amber-400" />}
              {layer === 'PHYSICS_DISPARITY' && <Cpu className="w-3.5 h-3.5 text-cyan-400" />}
              {layer === 'AI_PREDICTION' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {layer === 'VIBRATION' && <Layers className="w-3.5 h-3.5 text-purple-400" />}
              <span>{layer.replace('_', ' ')}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[560px]">
          <div className="absolute inset-0 tactical-grid opacity-20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between z-10 gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Rotate3d className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="font-bold text-slate-200">AZIMUTH {rotationAngle}° | ELEVATION {elevationAngle}°</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsSectionView(!isSectionView)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all border ${
                  isSectionView ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                👻 TRANSPARENT MODE {isSectionView ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={() => setIsExploded(!isExploded)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all border ${
                  isExploded ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                💥 EXPLODED VIEW {isExploded ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Interactive 3D Rotatable Engine CAD Assembly (True 3D CSS Perspective Rendering) */}
          <div className="relative flex-1 flex items-center justify-center my-4 z-10 overflow-visible">
            <div 
              className="w-full max-w-2xl h-[380px] relative flex items-center justify-center transition-transform duration-500 ease-out"
              style={{
                transform: `perspective(1000px) rotateX(${elevationAngle}deg) rotateY(${rotationAngle}deg)`,
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Central Crankcase Core Block */}
              <div
                onClick={() => setSelectedComponent('crankcase')}
                className={`absolute w-56 h-36 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between p-3 border-2 shadow-2xl ${
                  selectedComponent === 'crankcase' ? 'ring-4 ring-cyan-400 border-cyan-300' : 'border-slate-700'
                }`}
                style={{
                  transform: `translate3d(0px, 0px, 0px)`,
                  backgroundColor: getLayerColor('crankcase'),
                  opacity: isSectionView ? 0.35 : 0.95,
                  boxShadow: `0 0 35px ${getLayerColor('crankcase')}66`
                }}
              >
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-100">
                  <span>CRANKCASE CORE</span>
                  <span>{telemetry.oilPressureBar.toFixed(2)} bar</span>
                </div>
                <div className="text-center font-bold text-slate-100 text-sm">ROTAX 914-TC</div>
                <div className="text-[9px] text-slate-200">Lube Temp: {telemetry.oilTempC}°C</div>
              </div>

              {/* Cylinder #1 (Front Right 3D Cylinder Head) */}
              <div
                onClick={() => setSelectedComponent('cylinder_1')}
                className={`absolute w-36 h-28 rounded-2xl cursor-pointer transition-all duration-500 flex flex-col justify-between p-2.5 border-2 shadow-xl ${
                  selectedComponent === 'cylinder_1' ? 'ring-4 ring-cyan-400 border-cyan-300' : 'border-slate-700'
                }`}
                style={{
                  transform: `translate3d(${140 + explodedOffset}px, ${-60 - explodedOffset}px, 60px)`,
                  backgroundColor: getLayerColor('cylinder_1'),
                  opacity: isSectionView ? 0.45 : 0.9
                }}
              >
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-100">
                  <span>CYL #1</span>
                  <span>{telemetry.chtC[0].toFixed(1)}°C</span>
                </div>
                <div className="space-y-1 my-auto">
                  <div className="w-full h-1 bg-white/40 rounded" />
                  <div className="w-full h-1 bg-white/40 rounded" />
                  <div className="w-full h-1 bg-white/40 rounded" />
                </div>
                <span className="text-[8px] text-slate-200">CHT Sensor Node</span>
              </div>

              {/* Cylinder #2 (Rear Right 3D Cylinder Head) */}
              <div
                onClick={() => setSelectedComponent('cylinder_2')}
                className={`absolute w-36 h-28 rounded-2xl cursor-pointer transition-all duration-500 flex flex-col justify-between p-2.5 border-2 shadow-xl ${
                  selectedComponent === 'cylinder_2' ? 'ring-4 ring-cyan-400 border-cyan-300' : 'border-slate-700'
                }`}
                style={{
                  transform: `translate3d(${140 + explodedOffset}px, ${60 + explodedOffset}px, -20px)`,
                  backgroundColor: getLayerColor('cylinder_2'),
                  opacity: isSectionView ? 0.45 : 0.9
                }}
              >
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-100">
                  <span>CYL #2</span>
                  <span>{telemetry.chtC[1].toFixed(1)}°C</span>
                </div>
                <div className="space-y-1 my-auto">
                  <div className="w-full h-1 bg-white/40 rounded" />
                  <div className="w-full h-1 bg-white/40 rounded" />
                  <div className="w-full h-1 bg-white/40 rounded" />
                </div>
                <span className="text-[8px] text-slate-200">Knock Sensor Node</span>
              </div>

              {/* Cylinder #3 (Front Left 3D Cylinder Head) */}
              <div
                onClick={() => setSelectedComponent('cylinder_3')}
                className={`absolute w-36 h-28 rounded-2xl cursor-pointer transition-all duration-500 flex flex-col justify-between p-2.5 border-2 shadow-xl ${
                  selectedComponent === 'cylinder_3' ? 'ring-4 ring-cyan-400 border-cyan-300' : 'border-slate-700'
                }`}
                style={{
                  transform: `translate3d(${-140 - explodedOffset}px, ${-60 - explodedOffset}px, 60px)`,
                  backgroundColor: getLayerColor('cylinder_3'),
                  opacity: isSectionView ? 0.45 : 0.9
                }}
              >
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-100">
                  <span>CYL #3</span>
                  <span>{telemetry.chtC[2].toFixed(1)}°C</span>
                </div>
                <div className="space-y-1 my-auto">
                  <div className="w-full h-1 bg-white/40 rounded" />
                  <div className="w-full h-1 bg-white/40 rounded" />
                  <div className="w-full h-1 bg-white/40 rounded" />
                </div>
                <span className="text-[8px] text-slate-200">Thermal Peak Node</span>
              </div>

              {/* Cylinder #4 (Rear Left 3D Cylinder Head) */}
              <div
                onClick={() => setSelectedComponent('cylinder_4')}
                className={`absolute w-36 h-28 rounded-2xl cursor-pointer transition-all duration-500 flex flex-col justify-between p-2.5 border-2 shadow-xl ${
                  selectedComponent === 'cylinder_4' ? 'ring-4 ring-cyan-400 border-cyan-300' : 'border-slate-700'
                }`}
                style={{
                  transform: `translate3d(${-140 - explodedOffset}px, ${60 + explodedOffset}px, -20px)`,
                  backgroundColor: getLayerColor('cylinder_4'),
                  opacity: isSectionView ? 0.45 : 0.9
                }}
              >
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-100">
                  <span>CYL #4</span>
                  <span>{telemetry.chtC[3].toFixed(1)}°C</span>
                </div>
                <div className="space-y-1 my-auto">
                  <div className="w-full h-1 bg-white/40 rounded" />
                  <div className="w-full h-1 bg-white/40 rounded" />
                  <div className="w-full h-1 bg-white/40 rounded" />
                </div>
                <span className="text-[8px] text-slate-200">Nominal Node</span>
              </div>

              {/* 3D Torus Turbocharger Ring (Top Center) */}
              <div
                onClick={() => setSelectedComponent('turbocharger')}
                className={`absolute w-44 h-28 rounded-full cursor-pointer transition-all duration-500 flex flex-col justify-between p-2.5 border-4 shadow-2xl items-center text-center ${
                  selectedComponent === 'turbocharger' ? 'ring-4 ring-cyan-400 border-cyan-300' : 'border-rose-500'
                }`}
                style={{
                  transform: `translate3d(0px, ${-130 - explodedOffset}px, 80px)`,
                  backgroundColor: getLayerColor('turbocharger'),
                  opacity: 0.95
                }}
              >
                <span className="text-[9px] font-bold text-slate-100">TURBOCHARGER</span>
                <span className="font-telemetry font-bold text-slate-100 text-xs">{telemetry.turbochargerRpm.toLocaleString()} RPM</span>
                <span className="text-[8px] text-slate-200">Boost: {telemetry.turboBoostBar.toFixed(2)} bar</span>
              </div>

              {/* 3D Reduction Gearbox Trapezoid & Propeller Shaft (Bottom Center) */}
              <div
                onClick={() => setSelectedComponent('gearbox_prop_governor')}
                className={`absolute w-48 h-24 rounded-2xl cursor-pointer transition-all duration-500 flex flex-col justify-between p-2.5 border-2 shadow-xl items-center text-center ${
                  selectedComponent === 'gearbox_prop_governor' ? 'ring-4 ring-cyan-400 border-cyan-300' : 'border-slate-700'
                }`}
                style={{
                  transform: `translate3d(0px, ${130 + explodedOffset}px, 40px)`,
                  backgroundColor: getLayerColor('gearbox_prop_governor'),
                  opacity: 0.9
                }}
              >
                <span className="text-[9px] font-bold text-slate-100">REDUCTION GEARBOX (1:2.43)</span>
                <span className="font-telemetry font-bold text-slate-100 text-xs">{telemetry.rpm} RPM</span>
                <span className="text-[8px] text-slate-200">Prop Shaft Drive</span>
              </div>

              {/* Rotating Propeller Blades (Front Mounted) */}
              <div 
                className="absolute w-4 h-64 bg-amber-500/80 rounded-full animate-spin pointer-events-none"
                style={{
                  transform: `translate3d(0px, ${190 + explodedOffset}px, 70px) rotateZ(${telemetry.rpm * 0.1}deg)`,
                  animationDuration: `${Math.max(0.2, 60 / telemetry.rpm)}s`
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between z-10 pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[10px]">CAMERA ROTATION:</span>
              <button
                onClick={() => setRotationAngle(prev => prev - 15)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-200 font-bold"
              >
                ⟲ -15°
              </button>
              <button
                onClick={() => { setRotationAngle(0); setElevationAngle(0); }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-200 font-bold"
              >
                FRONT 0°
              </button>
              <button
                onClick={() => setRotationAngle(prev => prev + 15)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-200 font-bold"
              >
                ⟳ +15°
              </button>
              <button
                onClick={() => setElevationAngle(prev => Math.min(45, prev + 10))}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-200 font-bold"
              >
                ▲ TILT UP
              </button>
              <button
                onClick={() => setElevationAngle(prev => Math.max(-15, prev - 10))}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-200 font-bold"
              >
                ▼ TILT DOWN
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[10px]">HEAT SCALE:</span>
              <div className="w-24 h-2 rounded-full bg-gradient-to-r from-cyan-500 via-amber-500 to-red-600 border border-slate-700" />
              <span className="text-[10px] text-slate-400">NOMINAL → CRITICAL</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4 font-mono-code text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
            <input 
              type="text" 
              placeholder="Search component (e.g. Turbo, Cyl #3, Gearbox)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
            />
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {currentComp.subsystem}
                </span>
                <h3 className="font-heading font-bold text-base text-slate-100 mt-1">
                  {currentComp.name}
                </h3>
              </div>
              <span className={`font-telemetry font-bold text-xl ${
                currentComp.healthScore > 85 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {currentComp.healthScore.toFixed(1)}%
              </span>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block font-bold uppercase">METALLURGY &amp; PBR MATERIAL</span>
              <div className="text-cyan-300 font-bold">{currentComp.material}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono-code">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">MEASURED TEMP</span>
                <span className="font-telemetry font-bold text-lg text-slate-100">
                  {currentComp.temp}°C
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Expected: {currentComp.physicsExpectedTemp}°C
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">STRESS TENSOR</span>
                <span className="font-telemetry font-bold text-lg text-indigo-300">
                  {currentComp.stressMpa} MPa
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Yield Limit: 420 MPa
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">VIBRATION RMS</span>
                <span className="font-telemetry font-bold text-lg text-slate-100">
                  {currentComp.vibration} mm/s
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ISO Class I
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">PHYSICS RESIDUAL</span>
                <span className="font-telemetry font-bold text-lg text-emerald-400">
                  {(Math.abs(currentComp.temp - currentComp.physicsExpectedTemp)).toFixed(1)}°C
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ΔE &lt; 2.5% (Nominal)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
                <Info className="w-3.5 h-3.5" />
                <span>PHYSICS-AI DIAGNOSTIC SUMMARY:</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {currentComp.notes}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs font-mono-code space-y-2">
            <h4 className="font-heading font-bold text-xs text-slate-400 uppercase">
              Select Component For Inspection
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(componentDetails)
                .filter(([_, val]) => searchQuery === '' || val.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(([key, val]) => (
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
