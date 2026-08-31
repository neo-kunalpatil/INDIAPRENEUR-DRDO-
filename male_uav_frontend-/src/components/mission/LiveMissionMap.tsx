import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap, LayersControl } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { WaypointElevation } from '../../services/elevationService';

interface WaypointStatus {
  name: string;
  lat: number;
  lng: number;
  altFt: number;
  eta: string;
  status: 'PASSED' | 'CURRENT' | 'PENDING';
}

interface Props {
  livePosition: { lat: number; lng: number; region: string };
  waypoints: WaypointStatus[];
  elevations: WaypointElevation[];
  airspeedKts: number;
}

// Auto-center map on UAV position as it moves
function MapFollower({ center }: { center: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(center, { animate: true, duration: 1 });
  }, [center, map]);
  return null;
}

const STATUS_COLORS: Record<string, string> = {
  PASSED:  '#10b981',
  CURRENT: '#06b6d4',
  PENDING: '#475569',
};

export const LiveMissionMap: React.FC<Props> = ({
  livePosition,
  waypoints,
  elevations,
  airspeedKts,
}) => {
  const center: LatLngExpression = [livePosition.lat, livePosition.lng];

  const routeCoords: LatLngExpression[] = waypoints.map(wp => [wp.lat, wp.lng]);

  const passedCoords: LatLngExpression[] = waypoints
    .filter(wp => wp.status === 'PASSED' || wp.status === 'CURRENT')
    .map(wp => [wp.lat, wp.lng]);

  // Include live UAV position at the end of the completed segment
  if (passedCoords.length > 0) {
    passedCoords.push([livePosition.lat, livePosition.lng]);
  }

  const elevMap = Object.fromEntries(elevations.map(e => [e.name, e]));

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-700/60" style={{ minHeight: 320 }}>
      <MapContainer
        center={center}
        zoom={8}
        style={{ height: '100%', width: '100%', background: '#0a0f18' }}
        zoomControl={false}
        attributionControl={false}
      >
        <LayersControl position="topright">
          {/* Satellite Layer */}
          <LayersControl.BaseLayer checked name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Esri World Imagery"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          {/* Terrain Layer */}
          <LayersControl.BaseLayer name="Terrain">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution="OpenTopoMap"
              maxZoom={17}
            />
          </LayersControl.BaseLayer>
          {/* Dark tactical layer */}
          <LayersControl.BaseLayer name="Tactical Dark">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="CartoDB Dark Matter"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Full planned route — dashed cyan */}
        <Polyline
          positions={routeCoords}
          pathOptions={{ color: '#06b6d4', weight: 2, dashArray: '8 6', opacity: 0.6 }}
        />

        {/* Completed/active segment — solid green */}
        {passedCoords.length > 1 && (
          <Polyline
            positions={passedCoords}
            pathOptions={{ color: '#10b981', weight: 3, opacity: 0.9 }}
          />
        )}

        {/* Waypoint markers */}
        {waypoints.map((wp, i) => {
          const elevation = elevMap[wp.name];
          const color = STATUS_COLORS[wp.status];
          const isCurrent = wp.status === 'CURRENT';
          return (
            <CircleMarker
              key={wp.name}
              center={[wp.lat, wp.lng]}
              radius={isCurrent ? 10 : 7}
              pathOptions={{
                color: '#ffffff',
                fillColor: color,
                fillOpacity: 1,
                weight: isCurrent ? 2.5 : 1.5,
              }}
            >
              <Tooltip permanent={isCurrent} direction="top" offset={[0, -10]}>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#e2e8f0', background: '#0f172a', padding: '4px 8px', border: `1px solid ${color}`, borderRadius: 4 }}>
                  <strong style={{ color }}>{wp.name}</strong><br />
                  ALT: {wp.altFt.toLocaleString()} FT | ETA: {wp.eta}<br />
                  STATUS: {wp.status}
                  {elevation && (
                    <>
                      <br />TERRAIN: {elevation.elevationFt.toLocaleString()} FT
                      <br />CLEARANCE: <span style={{ color: elevation.isThreat ? '#f87171' : '#34d399' }}>{elevation.clearanceFt.toLocaleString()} FT</span>
                    </>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Live UAV position marker */}
        <CircleMarker
          center={center}
          radius={12}
          pathOptions={{ color: '#fbbf24', fillColor: '#f59e0b', fillOpacity: 0.95, weight: 2 }}
        >
          <Tooltip permanent direction="right" offset={[14, 0]}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#e2e8f0', background: '#0f172a', padding: '4px 8px', border: '1px solid #f59e0b', borderRadius: 4 }}>
              <strong style={{ color: '#fbbf24' }}>UAV TAPAS-201</strong><br />
              {livePosition.lat.toFixed(4)}°N {livePosition.lng.toFixed(4)}°E<br />
              {airspeedKts} KTS | {livePosition.region}
            </div>
          </Tooltip>
        </CircleMarker>

        <MapFollower center={center} />
      </MapContainer>

      {/* Overlay: map legend */}
      <div className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-1 text-[9px] font-mono-code bg-slate-950/80 border border-slate-700/60 rounded-lg p-2">
        <div className="flex items-center gap-1.5"><span className="w-3 h-1 rounded" style={{ background: '#10b981' }} />COMPLETED</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t-2 border-dashed border-cyan-400" />PLANNED</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />UAV</div>
      </div>
    </div>
  );
};
