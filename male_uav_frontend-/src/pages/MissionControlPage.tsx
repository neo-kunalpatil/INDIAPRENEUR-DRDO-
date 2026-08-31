import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Navigation,
  TrendingUp,
  Clock,
  Fuel,
  Wind,
  Thermometer,
  Eye,
  Radio,
} from 'lucide-react';
import { useGcs } from '../contexts/GcsContext';
import { MetricCard } from '../components/common/MetricCard';
import { LiveMissionMap } from '../components/mission/LiveMissionMap';
import { TerrainProfileChart } from '../components/mission/TerrainProfileChart';
import { executeGarudaCommand } from '../services/garudaAiService';
import { computeLinkMargin, classifyLinkQuality, haversineKm } from '../services/linkMarginService';
import { fetchWeather, weatherRiskBonus, weatherCodeLabel, WeatherData, WEATHER_DEFAULTS } from '../services/weatherService';
import { fetchElevations, WaypointElevation, minClearance, threatCount } from '../services/elevationService';

// GCS base location (Aeronautical Test Range, Chitradurga)
const GCS_LAT = 14.2384;
const GCS_LNG = 76.3982;

export const MissionControlPage: React.FC = () => {
  const { selectedUav, mission, telemetry, activeFaults, livePosition } = useGcs();

  const [aiRecommendation, setAiRecommendation] = useState<string>('GARUDA-AI is analyzing real-time mission telemetry...');
  const [weather, setWeather] = useState<WeatherData>(WEATHER_DEFAULTS);
  const [elevations, setElevations] = useState<WaypointElevation[]>([]);
  const [elevFetched, setElevFetched] = useState(false);

  // ── LINK MARGIN (physics model) ─────────────────────────────────
  const groundRangeKm = haversineKm(livePosition.lat, livePosition.lng, GCS_LAT, GCS_LNG);
  const linkMarginDb = computeLinkMargin(selectedUav.altitudeFt, groundRangeKm);
  const linkQuality = classifyLinkQuality(linkMarginDb);

  // ── FUEL PHYSICS ────────────────────────────────────────────────
  const fuelBurnRateKgH = Math.max(0.1, (telemetry.fuelFlowLitersHr || 20) * 0.72);
  const dynamicEnduranceHours = selectedUav.fuelRemainingKg / fuelBurnRateKgH;
  const loiterTimeRemaining = Math.max(0, dynamicEnduranceHours - 1.0);

  // ── MISSION RANGE / ETA ─────────────────────────────────────────
  const lastWp = mission.waypoints[mission.waypoints.length - 1];
  const distRemainingKm = haversineKm(livePosition.lat, livePosition.lng, lastWp.lat, lastWp.lng);
  const etaHours = selectedUav.airspeedKts > 0
    ? (distRemainingKm / 1.852) / selectedUav.airspeedKts
    : 0;
  const fuelRequiredKg = etaHours * fuelBurnRateKgH;

  // ── TERRAIN ─────────────────────────────────────────────────────
  const minTerrainClearance = minClearance(elevations);
  const terrainThreats = threatCount(elevations);

  // ── MISSION RISK (telemetry + weather + terrain) ────────────────
  const maxCht = Math.max(...telemetry.chtC);
  let dynamicRisk = selectedUav.missionRiskScore;
  if (telemetry.vibrationRmsMmS > 2.0) dynamicRisk += (telemetry.vibrationRmsMmS - 2.0) * 10;
  if (maxCht > 180) dynamicRisk += (maxCht - 180) * 2;
  if (selectedUav.engineHealthIndex < 80) dynamicRisk += (80 - selectedUav.engineHealthIndex);
  dynamicRisk += weatherRiskBonus(weather.windSpeedKts, weather.visibilityKm);
  if (terrainThreats > 0) dynamicRisk += terrainThreats * 5;
  dynamicRisk = Math.min(100, Math.max(0, dynamicRisk));

  // ── GO/NO-GO ────────────────────────────────────────────────────
  const isGo = dynamicRisk < 40;

  // ── WEATHER FETCH (every 5 min) ─────────────────────────────────
  const fetchWx = useCallback(async () => {
    try {
      const wx = await fetchWeather(livePosition.lat, livePosition.lng);
      setWeather(wx);
    } catch {
      // keep previous values on error
    }
  }, [livePosition.lat, livePosition.lng]);

  useEffect(() => {
    fetchWx();
    const id = setInterval(fetchWx, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchWx]);

  // ── ELEVATION FETCH (once per mission, refetch if waypoints change) ──
  useEffect(() => {
    if (elevFetched) return;
    const wps = mission.waypoints.map(wp => ({
      name: wp.name,
      lat: wp.lat,
      lng: wp.lng,
      altFt: wp.altFt,
    }));
    fetchElevations(wps)
      .then(result => { setElevations(result); setElevFetched(true); })
      .catch(() => {}); // silent — terrain profile stays empty
  }, [mission.waypoints, elevFetched]);

  // ── GARUDA-AI RECOMMENDATIONS ────────────────────────────────────
  useEffect(() => {
    const fetchAiOpt = async () => {
      const payload = {
        telemetry,
        activeFaults,
        mission,
        weather: {
          windSpeedKts: weather.windSpeedKts,
          windDirectionDeg: weather.windDirectionDeg,
          tempC: weather.tempC,
          condition: weatherCodeLabel(weather.weatherCode),
        },
        linkMargin: `${linkMarginDb} dB (${linkQuality.label})`,
        terrainClearance: `Min ${minTerrainClearance === Infinity ? 'N/A' : minTerrainClearance + ' ft'} — ${terrainThreats} threat waypoints`,
        distanceRemainingKm: distRemainingKm.toFixed(1),
        etaHours: etaHours.toFixed(2),
        fuelRequiredKg: fuelRequiredKg.toFixed(1),
      };
      const response = await executeGarudaCommand(
        'Generate exactly two mission optimization recommendations based on the provided live telemetry, weather, terrain clearance, link margin, and fuel state.',
        payload
      );
      if (response && !response.includes('SYSTEM ERROR')) {
        setAiRecommendation(response);
      }
    };

    fetchAiOpt();
    const id = setInterval(fetchAiOpt, 60000);
    return () => clearInterval(id);
  }, [telemetry.vibrationRmsMmS, maxCht, weather.windSpeedKts]);

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-xl text-slate-100">
              Mission Control & Go/No-Go Reliability Center (Innovation #11 & #23)
            </h1>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono-code font-bold">
              PATROL PHASE: {mission.phase}
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            Mission: {mission.codeName} • FL{Math.round(selectedUav.altitudeFt / 100)} ({selectedUav.altitudeFt.toLocaleString()} FT) • {livePosition.region}
          </p>
        </div>

        {/* Go/No-Go Badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono-code font-bold text-sm ${
          isGo
            ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 shadow-lg shadow-emerald-950/50'
            : 'bg-red-950/80 border-red-600 text-red-300 shadow-lg shadow-red-950/50 animate-pulse'
        }`}>
          {isGo ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>DECISION: {isGo ? `MISSION GO (${(100 - dynamicRisk).toFixed(1)}% RELIABILITY)` : 'ABORT / EXECUTE RTB'}</span>
        </div>
      </div>

      {/* Weather Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs font-mono-code">
          <Wind className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">WIND</span>
          <span className="text-cyan-300 font-bold">{weather.isLoading ? '--' : `${weather.windSpeedKts} KTS ${weather.windDirectionDeg}°`}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono-code">
          <Thermometer className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">OAT</span>
          <span className="text-amber-300 font-bold">{weather.isLoading ? '--' : `${weather.tempC}°C`}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono-code">
          <Eye className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">VIS</span>
          <span className="text-indigo-300 font-bold">{weather.isLoading ? '--' : `${weather.visibilityKm} KM`}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono-code">
          <Navigation className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">QNH</span>
          <span className="text-slate-200 font-bold">{weather.isLoading ? '--' : `${weather.pressureHpa} hPa`}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono-code">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">CONDITION</span>
          <span className="text-emerald-300 font-bold">{weather.isLoading ? '--' : weatherCodeLabel(weather.weatherCode)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono-code">
          <span className="text-slate-400">DIST REM</span>
          <span className="text-slate-200 font-bold">{distRemainingKm.toFixed(1)} KM</span>
        </div>
      </div>

      {/* Top 4 Mission Reliability Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Mission Risk Index"
          value={`${dynamicRisk.toFixed(1)}%`}
          status={isGo ? 'NORMAL' : 'CRITICAL'}
          change={isGo ? 'Within 40% Safety Ceiling' : 'Risk Exceeds Safety Margin'}
          changeType={isGo ? 'positive' : 'negative'}
          icon={ShieldCheck}
          subtext="Terrain + Met + Powerplant + Weather"
        />
        <MetricCard
          title="Remaining Fuel Endurance"
          value={`${dynamicEnduranceHours.toFixed(1)}h`}
          status={dynamicEnduranceHours > 2 ? 'HIGHLIGHT' : 'CRITICAL'}
          change={`${selectedUav.fuelRemainingKg.toFixed(1)} kg / Need ${fuelRequiredKg.toFixed(1)} kg`}
          changeType={selectedUav.fuelRemainingKg > fuelRequiredKg ? 'positive' : 'negative'}
          icon={Fuel}
          subtext={`Burn rate: ${fuelBurnRateKgH.toFixed(1)} kg/h`}
        />
        <MetricCard
          title="Loiter Time on Station"
          value={`${loiterTimeRemaining.toFixed(1)}h`}
          status={loiterTimeRemaining > 0 ? 'NORMAL' : 'CRITICAL'}
          change={`ETA to RTB: ${etaHours.toFixed(2)}h — ${distRemainingKm.toFixed(0)} km`}
          changeType={loiterTimeRemaining > 0 ? 'neutral' : 'negative'}
          icon={Clock}
          subtext={`FL${Math.round(selectedUav.altitudeFt / 100)} — ${selectedUav.altitudeFt.toLocaleString()} FT`}
        />
        <MetricCard
          title="Telemetry Link Margin"
          value={`${linkMarginDb} dB`}
          status={linkQuality.status}
          change={`${linkQuality.label} — Range ${groundRangeKm.toFixed(0)} km slant`}
          changeType={linkQuality.status === 'NORMAL' ? 'positive' : linkQuality.status === 'WARNING' ? 'neutral' : 'negative'}
          icon={Navigation}
          subtext="Ku-band SATCOM — Friis Path Model"
        />
      </div>

      {/* Map + Advisor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Left 8 cols: Live Mission Map */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-cyan-400" />
              <h3 className="font-heading font-bold text-sm text-slate-100">
                Live Mission Map — Satellite / Terrain / Tactical
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono-code text-slate-400">
              <span>WGS-84</span>
              {terrainThreats > 0 && (
                <span className="text-red-400 font-bold animate-pulse">⚠ {terrainThreats} TERRAIN THREAT{terrainThreats > 1 ? 'S' : ''}</span>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 min-h-[360px]">
            <LiveMissionMap
              livePosition={livePosition}
              waypoints={mission.waypoints as any}
              elevations={elevations}
              airspeedKts={selectedUav.airspeedKts}
            />
          </div>

          {/* Terrain Profile Chart */}
          <div className="border-t border-slate-800/60 pt-2">
            <TerrainProfileChart
              elevations={elevations}
              uavAltitudeFt={selectedUav.altitudeFt}
            />
          </div>

          {/* Bottom status bar */}
          <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-xs font-mono-code text-slate-400">
            <span>
              POSITION: <strong className="text-slate-200">{livePosition.lat.toFixed(4)}°N, {livePosition.lng.toFixed(4)}°E</strong>
              {' '}— {livePosition.region}
            </span>
            <span>
              AIRSPEED: <strong className="text-slate-200">{selectedUav.airspeedKts} KTS</strong>
              {' '}| MIN CLEARANCE: <strong className={minTerrainClearance < 500 ? 'text-red-400' : 'text-emerald-400'}>
                {minTerrainClearance === Infinity ? 'N/A' : `${minTerrainClearance.toLocaleString()} FT`}
              </strong>
            </span>
          </div>
        </div>

        {/* Right 4 cols: Mission Optimization Advisor */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <h3 className="font-heading font-bold text-sm text-slate-100">
                  Mission Optimization Advisor
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono-code font-bold">
                GARUDA-AI POWERED
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Real-time Pareto trade-off optimization using live telemetry, weather data, terrain clearance, and link margin:
            </p>

            <div className="space-y-2.5 text-xs font-mono-code">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 whitespace-pre-wrap max-h-52 overflow-y-auto">
                {aiRecommendation}
              </div>
            </div>

            {/* Live data summary fed to AI */}
            <div className="mt-3 grid grid-cols-2 gap-1.5 text-[10px] font-mono-code text-slate-500">
              <span>WIND: <span className="text-slate-300">{weather.windSpeedKts} kts</span></span>
              <span>TEMP: <span className="text-slate-300">{weather.tempC}°C</span></span>
              <span>LINK: <span className="text-slate-300">{linkMarginDb} dB</span></span>
              <span>TERRAIN: <span className={terrainThreats > 0 ? 'text-red-400' : 'text-emerald-400'}>{terrainThreats > 0 ? `${terrainThreats} THREATS` : 'CLEAR'}</span></span>
              <span>RANGE: <span className="text-slate-300">{distRemainingKm.toFixed(0)} km</span></span>
              <span>FUEL NEED: <span className="text-slate-300">{fuelRequiredKg.toFixed(0)} kg</span></span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs">
            <span className="font-bold text-indigo-300 block mb-1">AUTOMATED FLIGHT ENVELOPE PROTECTION:</span>
            <p className="text-slate-300 text-[11px]">
              GCS autopilot tracks peak CHT ({maxCht.toFixed(1)}°C). Throttle authority reduced if CHT exceeds 130°C or link margin falls below 3 dB.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
