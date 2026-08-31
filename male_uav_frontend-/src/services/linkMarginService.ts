// ─── LINK MARGIN SERVICE ────────────────────────────────────────────────────
// Physics-based Ku-band SATCOM link budget calculation (Friis Transmission Equation)
// Constants based on TAPAS-BH-201 GCS SATCOM configuration
//
// Formula:
// LinkMargin = TxPower + TxGain + RxGain - PathLoss - AtmosphericLoss - SystemNoise
// PathLoss = 20 * log10(4π * d * f / c)  [Friis free-space path loss]

const TX_POWER_DBW = 10;       // 10W SATCOM transmitter → 10 dBW
const TX_GAIN_DBI  = 35;       // Directional Ku-band dish gain
const RX_GAIN_DBI  = 35;       // Ground station dish gain
const SYSTEM_NOISE_DBW = -130; // Receiver noise floor
const KU_BAND_HZ   = 14.5e9;  // 14.5 GHz Ku-band uplink
const SPEED_LIGHT  = 3e8;      // m/s

/**
 * Compute slant range in km from UAV altitude and ground station distance.
 * Assumes GCS at ground level directly below a known base location.
 * Uses UAV position + base lat/lng offset.
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Compute physics-based link margin in dB.
 * @param altitudeFt      UAV altitude above sea level in feet
 * @param groundRangeKm   Horizontal distance from UAV to GCS in km
 */
export function computeLinkMargin(altitudeFt: number, groundRangeKm: number): number {
  const altKm = altitudeFt * 0.0003048;          // ft → km
  const slantRangeKm = Math.sqrt(groundRangeKm ** 2 + altKm ** 2);
  const slantRangeM  = slantRangeKm * 1000;

  // Free-space path loss (Friis)
  const pathLoss_dB = 20 * Math.log10((4 * Math.PI * slantRangeM * KU_BAND_HZ) / SPEED_LIGHT);

  // Atmospheric absorption — clear air approximation ~0.01 dB/km at Ku-band
  const atmosphericLoss_dB = 0.01 * slantRangeKm;

  // Link Margin = Rx Power - Noise Floor
  // Since SYSTEM_NOISE_DBW is negative (-130), subtracting it adds 130.
  const linkMargin = TX_POWER_DBW + TX_GAIN_DBI + RX_GAIN_DBI
    - pathLoss_dB - atmosphericLoss_dB - SYSTEM_NOISE_DBW;

  return Math.round(linkMargin * 10) / 10; // 1 decimal
}

/**
 * Classify link quality tier from dB margin.
 */
export function classifyLinkQuality(marginDb: number): {
  label: string;
  color: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
} {
  if (marginDb >= 20) return { label: 'STRONG', color: 'emerald', status: 'NORMAL' };
  if (marginDb >= 10) return { label: 'NOMINAL', color: 'cyan', status: 'NORMAL' };
  if (marginDb >= 3)  return { label: 'MARGINAL', color: 'amber', status: 'WARNING' };
  return { label: 'LINK DEGRADED', color: 'red', status: 'CRITICAL' };
}
