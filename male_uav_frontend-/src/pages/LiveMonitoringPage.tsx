import React, { useState, useEffect } from 'react';
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
  Maximize2,
  Brain,
  ShieldAlert,
  GitBranch,
  HelpCircle,
  CheckCircle2,
  Layers,
  Thermometer,
  Compass,
  Radio,
  Network,
  Cpu,
  Clock,
  Check,
  RefreshCw,
  ZapOff
} from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';
import { Gauge } from '../components/common/Gauge';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';

export const LiveMonitoringPage: React.FC = () => {
  const { selectedUav, telemetry } = useGcs();
  const [selectedSensorNode, setSelectedSensorNode] = useState<string | null>('RPM');
  const [pipelineSpeedHz, setPipelineSpeedHz] = useState<number>(50);
  const [packetCounter, setPacketCounter] = useState<number>(142080);
  const [filterMode, setFilterMode] = useState<'KALMAN' | 'EMA' | 'MEDIAN' | 'RAW'>('KALMAN');

  useEffect(() => {
    const timer = setInterval(() => {
      setPacketCounter(prev => prev + Math.floor(pipelineSpeedHz / 5));
    }, 200);
    return () => clearInterval(timer);
  }, [pipelineSpeedHz]);

  // Complete 22 Live Telemetry SCADA Sensors
  const scadaSensors = [
    { name: 'RPM', val: `${telemetry.rpm} RPM`, freq: '100 Hz', qual: '99.8%', status: 'NOMINAL', latency: '2.1 ms', noise: '0.12%', dep: ['MAP', 'Turbo', 'EGT'] },
    { name: 'MAP (Boost)', val: `${telemetry.mapInHg.toFixed(1)} inHg`, freq: '50 Hz', qual: '99.5%', status: 'NOMINAL', latency: '3.4 ms', noise: '0.24%', dep: ['Turbo', 'EGT'] },
    { name: 'CHT #1', val: `${telemetry.chtC[0].toFixed(1)} °C`, freq: '20 Hz', qual: '99.1%', status: 'NOMINAL', latency: '4.8 ms', noise: '0.35%', dep: ['Oil Temp', 'RUL'] },
    { name: 'CHT #2', val: `${telemetry.chtC[1].toFixed(1)} °C`, freq: '20 Hz', qual: '98.6%', status: telemetry.chtC[1] > 125 ? 'WARNING' : 'NOMINAL', latency: '4.9 ms', noise: '0.42%', dep: ['Oil Temp', 'RUL'] },
    { name: 'CHT #3', val: `${telemetry.chtC[2].toFixed(1)} °C`, freq: '20 Hz', qual: '99.3%', status: 'NOMINAL', latency: '4.7 ms', noise: '0.31%', dep: ['Oil Temp', 'RUL'] },
    { name: 'CHT #4', val: `${telemetry.chtC[3].toFixed(1)} °C`, freq: '20 Hz', qual: '99.4%', status: 'NOMINAL', latency: '4.6 ms', noise: '0.29%', dep: ['Oil Temp', 'RUL'] },
    { name: 'EGT #1', val: `${telemetry.egtC[0].toFixed(0)} °C`, freq: '50 Hz', qual: '99.2%', status: 'NOMINAL', latency: '3.1 ms', noise: '0.51%', dep: ['Turbo Temp', 'RUL'] },
    { name: 'EGT #2', val: `${telemetry.egtC[1].toFixed(0)} °C`, freq: '50 Hz', qual: '98.9%', status: 'NOMINAL', latency: '3.2 ms', noise: '0.48%', dep: ['Turbo Temp', 'RUL'] },
    { name: 'EGT #3', val: `${telemetry.egtC[2].toFixed(0)} °C`, freq: '50 Hz', qual: '97.8%', status: telemetry.egtC[2] > 780 ? 'WARNING' : 'NOMINAL', latency: '3.3 ms', noise: '0.85%', dep: ['Turbo Temp', 'RUL'] },
    { name: 'EGT #4', val: `${telemetry.egtC[3].toFixed(0)} °C`, freq: '50 Hz', qual: '99.1%', status: 'NOMINAL', latency: '3.1 ms', noise: '0.44%', dep: ['Turbo Temp', 'RUL'] },
    { name: 'Oil Pressure', val: `${telemetry.oilPressureBar.toFixed(2)} bar`, freq: '50 Hz', qual: '99.9%', status: 'NOMINAL', latency: '2.8 ms', noise: '0.18%', dep: ['Bearing Wear'] },
    { name: 'Oil Temperature', val: `${telemetry.oilTempC.toFixed(1)} °C`, freq: '20 Hz', qual: '99.5%', status: 'NOMINAL', latency: '5.2 ms', noise: '0.22%', dep: ['Viscosity', 'RUL'] },
    { name: 'Fuel Flow', val: `${telemetry.fuelFlowLitersHr.toFixed(1)} L/h`, freq: '20 Hz', qual: '99.0%', status: 'NOMINAL', latency: '4.1 ms', noise: '0.30%', dep: ['Endurance'] },
    { name: 'Fuel Pressure', val: `${(telemetry.oilPressureBar * 0.7).toFixed(2)} bar`, freq: '20 Hz', qual: '99.4%', status: 'NOMINAL', latency: '4.2 ms', noise: '0.25%', dep: ['Injector'] },
    { name: 'Battery Voltage', val: `${telemetry.batteryVoltageV.toFixed(1)} V`, freq: '10 Hz', qual: '100%', status: 'NOMINAL', latency: '8.1 ms', noise: '0.05%', dep: ['ECU Power'] },
    { name: 'Alternator Current', val: `28.4 A`, freq: '10 Hz', qual: '99.9%', status: 'NOMINAL', latency: '8.2 ms', noise: '0.09%', dep: ['Avionics'] },
    { name: 'Turbo Boost', val: `${telemetry.turboBoostBar.toFixed(2)} bar`, freq: '50 Hz', qual: '99.3%', status: 'NOMINAL', latency: '3.0 ms', noise: '0.38%', dep: ['Compressor'] },
    { name: 'Turbo RPM', val: `${telemetry.turbochargerRpm.toLocaleString()} RPM`, freq: '100 Hz', qual: '98.7%', status: 'NOMINAL', latency: '1.9 ms', noise: '0.62%', dep: ['Boost'] },
    { name: 'Ambient Air Temp', val: `${telemetry.ambientTempC} °C`, freq: '5 Hz', qual: '100%', status: 'NOMINAL', latency: '12 ms', noise: '0.02%', dep: ['Air Density'] },
    { name: 'Ambient Pressure', val: `${telemetry.ambientPressureHpa.toFixed(0)} hPa`, freq: '5 Hz', qual: '100%', status: 'NOMINAL', latency: '12 ms', noise: '0.01%', dep: ['ISA Alt'] },
    { name: 'GPS Altitude', val: `${telemetry.gpsAltitudeM} m`, freq: '10 Hz', qual: '99.7%', status: 'NOMINAL', latency: '15 ms', noise: '0.15%', dep: ['Density Alt'] },
    { name: 'Throttle Position', val: `${telemetry.throttlePercent.toFixed(0)} %`, freq: '100 Hz', qual: '100%', status: 'NOMINAL', latency: '1.2 ms', noise: '0.04%', dep: ['Engine Load'] },
  ];

  const scadaPipelineNodes = [
    { title: 'Sensors (22)', desc: 'Piezo & Thermocouples' },
    { title: 'CAN Bus', desc: '1 Mbps Differential' },
    { title: 'Rotax ECU', desc: 'Dual Ignition Control' },
    { title: 'Flight Controller', desc: 'ArduPilot/PX4 Autopilot' },
    { title: 'Ground Radio', desc: 'C-Band Telemetry Link' },
    { title: 'UDP Receiver', desc: 'Port 4000 Stream' },
    { title: 'GCS SCADA', desc: 'Telemetry Parser' },
    { title: 'Validation', desc: 'CRC & Kalman Filter' },
    { title: 'Physics Engine', desc: 'Thermodynamics' },
    { title: 'AI Model', desc: 'RUL & SHAP Predictor' },
    { title: 'Digital Twin', desc: '3D FEA Shader View' },
  ];

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto font-mono-code text-xs">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h1 className="font-heading font-bold text-xl text-slate-100">
              DRDO SCADA Real-Time Telemetry Pipeline &amp; Signal Validator
            </h1>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
              20–100 HZ STREAM LIVE
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">
            Synchronized CAN-bus sensor telemetry stream, Kalman filtering, CRC error verification &amp; sensor dependency graphs
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px] font-bold">STREAM RATE:</span>
          {[20, 50, 100].map(rate => (
            <button
              key={rate}
              onClick={() => setPipelineSpeedHz(rate)}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                pipelineSpeedHz === rate ? 'bg-cyan-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {rate} Hz
            </button>
          ))}
        </div>
      </div>

      {/* SCADA Data Quality Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <span className="text-slate-500 text-[10px] block font-bold">TOTAL SCADA PACKETS</span>
          <span className="font-telemetry font-bold text-lg text-cyan-400">{packetCounter.toLocaleString()}</span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">0 Dropped Frames</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <span className="text-slate-500 text-[10px] block font-bold">SIGNAL QUALITY</span>
          <span className="font-telemetry font-bold text-lg text-emerald-400">99.82%</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">SNR &gt; 38 dB</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <span className="text-slate-500 text-[10px] block font-bold">AVERAGE LATENCY</span>
          <span className="font-telemetry font-bold text-lg text-slate-100">3.12 ms</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">C-Band UDP Sync</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <span className="text-slate-500 text-[10px] block font-bold">CRC ERRORS</span>
          <span className="font-telemetry font-bold text-lg text-emerald-400">0.000%</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Polynomial 0x04C11DB7</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <span className="text-slate-500 text-[10px] block font-bold">CLOCK DRIFT</span>
          <span className="font-telemetry font-bold text-lg text-indigo-400">&lt; 0.04 ms</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">NTP GCS Synchronization</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <span className="text-slate-500 text-[10px] block font-bold">ACTIVE FILTER</span>
          <span className="font-telemetry font-bold text-lg text-amber-400">{filterMode}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Noise Suppression</span>
        </div>
      </div>

      {/* Animated SCADA Data Flow Architecture Graph */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-slate-200 flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-400" />
            <span>DRDO LIVE TELEMETRY DATA PIPELINE FLOW (SENSORS → AI &amp; DIGITAL TWIN)</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono-code">UPDATES REAL-TIME OVER UDP PACKETS</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 overflow-x-auto py-2">
          {scadaPipelineNodes.map((node, idx) => (
            <React.Fragment key={idx}>
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-center min-w-[120px] flex-1 hover:border-cyan-500 transition-all cursor-pointer">
                <span className="text-[10px] font-bold text-cyan-400 block">{node.title}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">{node.desc}</span>
              </div>
              {idx < scadaPipelineNodes.length - 1 && (
                <span className="text-cyan-500 font-bold animate-pulse text-xs">➔</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main 22-Sensor Grid & Selected Sensor Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: 22 SCADA Live Sensors Table */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-heading font-bold text-sm text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>LIVE SENSOR STREAM MATRIX (22 ACQUISITION NODES)</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">CLICK SENSOR FOR DEPENDENCY GRAPH</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[580px] overflow-y-auto pr-1">
            {scadaSensors.map((s) => {
              const isSelected = selectedSensorNode === s.name;
              return (
                <div
                  key={s.name}
                  onClick={() => setSelectedSensorNode(s.name)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-500 shadow-lg shadow-cyan-950/50'
                      : s.status === 'WARNING'
                      ? 'bg-rose-950/40 border-rose-800 hover:bg-rose-900/40'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-200">{s.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      s.status === 'WARNING' ? 'bg-rose-900 text-rose-300' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {s.freq}
                    </span>
                  </div>
                  <div className="font-telemetry font-bold text-base text-slate-100 mt-1">{s.val}</div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 pt-1 border-t border-slate-800/80">
                    <span>Quality: <strong className="text-emerald-400">{s.qual}</strong></span>
                    <span>Latency: <strong>{s.latency}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Sensor Health & Mathematical Dependency Inspector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="font-heading font-bold text-sm text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>SENSOR HEALTH &amp; DEPENDENCY INSPECTOR</span>
            </h3>

            {selectedSensorNode ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block font-bold uppercase">SELECTED SCADA NODE</span>
                  <div className="text-lg font-bold text-slate-100">{selectedSensorNode}</div>
                  <p className="text-[11px] text-slate-400">
                    Direct signal feed linked into Physics Thermodynamics &amp; Deep Neural AI Predictor.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">SIGNAL NOISE</span>
                    <span className="font-telemetry font-bold text-emerald-400">
                      {scadaSensors.find(s => s.name === selectedSensorNode)?.noise || '0.12%'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block font-bold">CALIBRATION</span>
                    <span className="font-telemetry font-bold text-slate-200">VERIFIED ADE-2026</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">DOWNSTREAM DEPENDENCY CHAIN:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                      {selectedSensorNode}
                    </span>
                    <span className="text-slate-500 font-bold">➔</span>
                    {scadaSensors.find(s => s.name === selectedSensorNode)?.dep.map((d, i) => (
                      <React.Fragment key={d}>
                        <span className="px-2 py-1 rounded bg-slate-900 text-slate-200 border border-slate-700 font-bold">
                          {d}
                        </span>
                        {i < (scadaSensors.find(s => s.name === selectedSensorNode)?.dep.length || 0) - 1 && (
                          <span className="text-slate-500 font-bold">➔</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-500">Select any sensor on the left matrix to view dependency graph.</div>
            )}
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-bold text-xs text-slate-300 uppercase">
                ACTIVE MATHEMATICAL FILTERING
              </h4>
              <div className="flex gap-1">
                {(['KALMAN', 'EMA', 'MEDIAN', 'RAW'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      filterMode === mode ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono-code text-[11px] text-slate-300">
              <div className="text-amber-400 font-bold">
                {filterMode === 'KALMAN' && 'x_k = x̂_k^- + K_k (z_k - H x̂_k^-)'}
                {filterMode === 'EMA' && 'S_t = α · Y_t + (1 - α) · S_{t-1}'}
                {filterMode === 'MEDIAN' && 'Y_t = median(X_{t-k}, ..., X_{t+k})'}
                {filterMode === 'RAW' && 'Y_t = SCADA_Unfiltered_Raw(t)'}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Removes high-frequency CAN-bus noise &amp; outlier spikes before feeding Physics Thermodynamics &amp; SHAP XAI predictors.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
