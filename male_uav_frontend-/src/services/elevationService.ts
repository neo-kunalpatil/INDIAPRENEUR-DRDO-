// ─── ELEVATION SERVICE ────────────────────────────────────────────────────────
// Uses Open-Topo-Data API (https://www.opentopodata.org) — FREE, no API key.
// Dataset: ASTER 30m global DEM
// Rate limit: 1 request/second, 100 locations per request.

export interface WaypointElevation {
  name: string;
  lat: number;
  lng: number;
  elevationM: number;
  elevationFt: number;
  waypointAltFt: number;
  clearanceFt: number;
  isThreat: boolean; // clearance < 500 ft
}

/**
 * Fetch terrain elevations for an array of waypoints.
 * Batches all waypoints into a single API call.
 */
export async function fetchElevations(
  waypoints: Array<{ name: string; lat: number; lng: number; altFt: number }>
): Promise<WaypointElevation[]> {
  const locations = waypoints.map(wp => `${wp.lat.toFixed(4)},${wp.lng.toFixed(4)}`).join('|');
  const url = `https://api.opentopodata.org/v1/aster30m?locations=${locations}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`OpenTopoData HTTP ${response.status}`);
  }

  const json = await response.json();
  const results: WaypointElevation[] = [];

  if (json.status === 'OK' && Array.isArray(json.results)) {
    json.results.forEach((r: any, i: number) => {
      const wp = waypoints[i];
      const elevM = r.elevation ?? 0;
      const elevFt = elevM * 3.28084;
      const clearanceFt = wp.altFt - elevFt;
      results.push({
        name:          wp.name,
        lat:           wp.lat,
        lng:           wp.lng,
        elevationM:    Math.round(elevM),
        elevationFt:   Math.round(elevFt),
        waypointAltFt: wp.altFt,
        clearanceFt:   Math.round(clearanceFt),
        isThreat:      clearanceFt < 500,
      });
    });
  }

  return results;
}

/**
 * Find minimum terrain clearance across all waypoints.
 */
export function minClearance(elevations: WaypointElevation[]): number {
  if (elevations.length === 0) return Infinity;
  return Math.min(...elevations.map(e => e.clearanceFt));
}

/**
 * Count terrain threat waypoints (clearance < 500 ft).
 */
export function threatCount(elevations: WaypointElevation[]): number {
  return elevations.filter(e => e.isThreat).length;
}
