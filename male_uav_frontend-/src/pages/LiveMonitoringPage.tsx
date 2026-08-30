import React, { useState } from 'react';
import { 
  Activity, 
  Flame, 
  Zap, 
  Droplets, 
  Wind, 
  Gauge as GaugeIcon, 
  AlertCircle,
  Sliders,
  TrendingUp,
  Maximize2
} from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';
import { Gauge } from '../components/common/Gauge';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';

export const LiveMonitoringPage: React.FC = () => {
  const { selectedUav, telemetry } = useGcs();
  const [selectedSubsystem, setSelectedSubsystem] = useState<'ALL' | 'THERMAL' | 'HYDRAULIC' | 'VIBRATION' | 'TURBO'>('ALL');

  // Simulated vibration FFT frequency bins
  const fftBins = [
    { hz: 15, mag: 0.8, label: 'Sub-harmonic' },
    { hz: 30, mag: 1.2, label: '1X Camshaft' },
    { hz: 45, mag: 1.5, label: 'Piston slap' },
    { hz: 85, mag: telemetry.vibrationRmsMmS > 4 ? 6.8 : 2.4, label: '1X Crankshaft' },
    { hz: 170, mag: telemetry.vibrationRmsMmS > 4 ? 4.9 : 1.8, label: '2X Firing freq' },
    { hz: 255, mag: 1.1, label: '3X Firing' },
    { hz: 340, mag: 0.7, label: '4X Firing' },
    { hz: 510, mag: 0.4, label: 'Valve train' },
    { hz: 1200, mag: 0.9, label: 'Turbo blade pass' },
  ];

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              Real-Time SCADA Telemetry & Sensor Instrumentation
            </h1>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono-code font-bold">
              20 HZ SYNC
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            Rotax 914 Turbocharged Aero Piston Engine • 4-Stroke Opposed-4 Cylinders • Altitude: {selectedUav.altitudeFt.toLocaleString()} FT
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono-code">
          {(['ALL', 'THERMAL', 'HYDRAULIC', 'VIBRATION', 'TURBO'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedSubsystem(filter)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                selectedSubsystem === filter
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Telemetry Instrument Cluster */}
      <div id="telemetry-gauges" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Gauge
          label="ENGINE RPM"
          value={telemetry.rpm}
          min={1500}
          max={6000}
          unit="RPM"
          warningThreshold={5500}
          criticalThreshold={5800}
          expectedValue={5100}
        />
        <Gauge
          label="MANIFOLD PRESS."
          value={telemetry.manifoldPressureInHg}
          min={20}
          max={42}
          unit="inHg"
          decimals={1}
          warningThreshold={37.5}
          criticalThreshold={39.0}
          expectedValue={35.8}
        />
        <Gauge
          label="OIL PRESSURE"
          value={telemetry.oilPressureBar}
          min={1.0}
          max={6.0}
          unit="bar"
          decimals={2}
          warningThreshold={2.2}
          criticalThreshold={1.8}
          expectedValue={4.35}
        />
        <Gauge
          label="OIL TEMP"
          value={telemetry.oilTempC}
          min={60}
          max={140}
          unit="°C"
          decimals={1}
          warningThreshold={118}
          criticalThreshold={128}
          expectedValue={106.0}
        />
        <Gauge
          label="COOLANT TEMP"
          value={telemetry.coolantTempC}
          min={60}
          max={130}
          unit="°C"
          decimals={1}
          warningThreshold={110}
          criticalThreshold={118}
          expectedValue={98.0}
        />
        <Gauge
          label="TURBO BOOST"
          value={telemetry.turboBoostBar}
          min={0.0}
          max={1.4}
          unit="bar"
          decimals={2}
          warningThreshold={1.15}
          criticalThreshold={1.28}
          expectedValue={0.88}
        />
      </div>

      {/* Deep Dive Grid: Thermocouples + Vibration FFT + Hydraulics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 6 Cols: 4-Cylinder Head & Exhaust Gas Temperatures */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h3 className="font-heading font-bold text-sm text-slate-100">
                4-Cylinder Thermal Head (CHT) & Exhaust (EGT) Spectrum
              </h3>
            </div>
            <span className="text-[10px] font-mono-code text-slate-400">TYPE-K THERMOCOUPLES</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((idx) => {
              const cht = telemetry.chtC[idx];
              const egt = telemetry.egtC[idx];
              const isHot = cht > 125 || egt > 820;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex flex-col justify-between text-xs font-mono-code transition-all ${
                    isHot ? 'bg-red-950/30 border-red-800' : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-cyan-300 pb-1 border-b border-slate-800/60">
                    <span>CYLINDER #{idx + 1}</span>
                    <span className={`w-2 h-2 rounded-full ${isHot ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
                  </div>

                  <div className="py-2 space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">CYL HEAD TEMP</span>
                      <span className={`font-telemetry font-bold text-xl ${cht > 125 ? 'text-red-400' : 'text-slate-100'}`}>
                        {cht}°C
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">EXHAUST GAS</span>
                      <span className={`font-telemetry font-bold text-lg ${egt > 820 ? 'text-red-400' : 'text-slate-200'}`}>
                        {egt}°C
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-slate-800/60 text-[9px] text-slate-500 flex justify-between">
                    <span>MAX: 135°C</span>
                    <span>MAX: 850°C</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 flex items-center justify-between text-xs font-mono-code text-slate-400">
            <span>Bank 1 vs Bank 2 Disparity: <strong className="text-emerald-400">+2.4°C (NOMINAL)</strong></span>
            <span>Lambda Ratio: <strong className="text-cyan-300">λ {telemetry.lambdaAirFuelRatio}</strong></span>
          </div>
        </div>

        {/* Right 6 Cols: Vibration Harmonic FFT Spectrum Analyzer */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="font-heading font-bold text-sm text-slate-100">
                Piezoelectric Vibration FFT Spectrum Analyzer
              </h3>
            </div>
            <span className="text-[10px] font-mono-code text-cyan-400">SAMPLING: 10 kHz</span>
          </div>

          {/* Harmonic Bar Graph */}
          <div className="space-y-2">
            {fftBins.map((bin, i) => (
              <div key={i} className="flex items-center gap-3 text-xs font-mono-code">
                <span className="w-14 text-slate-400 shrink-0 text-right">{bin.hz} Hz</span>
                <div className="flex-1 bg-slate-950 h-4 rounded-md overflow-hidden p-0.5 border border-slate-800 flex">
                  <div
                    className={`h-full rounded transition-all duration-300 ${
                      bin.mag > 5 ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, (bin.mag / 8) * 100)}%` }}
                  />
                </div>
                <span className="w-16 font-bold text-slate-200 text-right">{bin.mag.toFixed(1)} mm/s</span>
                <span className="w-28 text-[10px] text-slate-500 truncate">{bin.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono-code">
            <span className="text-slate-400">Total RMS Vibration: <strong className="text-cyan-300">{telemetry.vibrationRmsMmS} mm/s</strong></span>
            <span className="text-slate-400">ISO 10816 Class: <strong className="text-emerald-400">CLASS I (ACCEPTABLE)</strong></span>
          </div>
        </div>
      </div>

      {/* Hydraulic, Fuel, Turbo & Atmospheric Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono-code">
          <div className="flex items-center gap-2 text-cyan-400 font-bold mb-2">
            <Droplets className="w-4 h-4" />
            <span>FUEL HYDRAULICS</span>
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span>Fuel Pressure:</span>
              <strong className="text-slate-100">{telemetry.fuelPressureBar} bar</strong>
            </div>
            <div className="flex justify-between">
              <span>Fuel Consumption:</span>
              <strong className="text-slate-100">{telemetry.fuelFlowLitersHr} L/h</strong>
            </div>
            <div className="flex justify-between">
              <span>Fuel Remainder:</span>
              <strong className="text-amber-300">{selectedUav.fuelRemainingKg} kg</strong>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono-code">
          <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
            <Wind className="w-4 h-4" />
            <span>TURBO & INTAKE</span>
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span>Turbo Impeller Speed:</span>
              <strong className="text-slate-100">{telemetry.turbochargerRpm.toLocaleString()} RPM</strong>
            </div>
            <div className="flex justify-between">
              <span>Boost Pressure:</span>
              <strong className="text-slate-100">{telemetry.turboBoostBar} bar</strong>
            </div>
            <div className="flex justify-between">
              <span>Throttle Position:</span>
              <strong className="text-slate-100">{telemetry.throttlePercent}%</strong>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono-code">
          <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
            <Zap className="w-4 h-4" />
            <span>IGNITION & KNOCK</span>
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span>Dual CDI Spark:</span>
              <strong className="text-emerald-400">CIRCUIT A & B ACTIVE</strong>
            </div>
            <div className="flex justify-between">
              <span>Pre-Ignition Knock:</span>
              <strong className={telemetry.knockIndex > 0.4 ? 'text-red-400' : 'text-slate-100'}>{telemetry.knockIndex}</strong>
            </div>
            <div className="flex justify-between">
              <span>Timing Advance:</span>
              <strong className="text-slate-100">26° BTDC</strong>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono-code">
          <div className="flex items-center gap-2 text-slate-300 font-bold mb-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>ATMOSPHERIC / FLIGHT</span>
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span>Outside Air Temp (OAT):</span>
              <strong className="text-slate-100">{telemetry.ambientTempC}°C</strong>
            </div>
            <div className="flex justify-between">
              <span>Ambient Pressure:</span>
              <strong className="text-slate-100">{telemetry.ambientPressureHpa} hPa</strong>
            </div>
            <div className="flex justify-between">
              <span>Density Altitude:</span>
              <strong className="text-cyan-300">{selectedUav.altitudeFt + 2350} FT</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
