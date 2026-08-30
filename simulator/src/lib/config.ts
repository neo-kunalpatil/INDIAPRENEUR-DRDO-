// Central config — all backend URLs come from here
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const WS_BASE  = process.env.NEXT_PUBLIC_WS_URL  || 'ws://localhost:4000';

export const ENDPOINTS = {
  mission:   `${API_BASE}/api/mission`,
  faults:    `${API_BASE}/api/faults`,
  telemetry: `${API_BASE}/api/telemetry/latest`,
  engine:    `${API_BASE}/api/engine`,
  status:    `${API_BASE}/api/status`,
  ws:        `${WS_BASE}/stream`,
};
