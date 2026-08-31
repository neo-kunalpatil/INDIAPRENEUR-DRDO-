// Central config - all backend URLs come from here
let envApi = process.env.NEXT_PUBLIC_API_URL;
let envWs = process.env.NEXT_PUBLIC_WS_URL;

// Enforce environment variables (no hardcoded placeholders)
export const API_BASE = envApi || "";
export const WS_BASE = envWs || "";

export const ENDPOINTS = {
  mission:   `${API_BASE}/api/mission`,
  faults:    `${API_BASE}/api/faults`,
  telemetry: `${API_BASE}/api/telemetry/latest`,
  engine:    `${API_BASE}/api/engine`,
  status:    `${API_BASE}/api/status`,
  health:    `${API_BASE}/health`,
  ws: WS_BASE ? (WS_BASE.endsWith('/stream') ? WS_BASE : `${WS_BASE}/stream`) : "",
};
