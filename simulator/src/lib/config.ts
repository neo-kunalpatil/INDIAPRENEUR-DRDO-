// Central config - all backend URLs come from here
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://indiapreneur-drdo-1.onrender.com";
const WS_BASE  = process.env.NEXT_PUBLIC_WS_URL  || "wss://indiapreneur-drdo-1.onrender.com";

console.log("API_BASE =", API_BASE);
console.log("WS_BASE =", WS_BASE);

export { API_BASE, WS_BASE };

export const ENDPOINTS = {
  mission:   `${API_BASE}/api/mission`,
  faults:    `${API_BASE}/api/faults`,
  telemetry: `${API_BASE}/api/telemetry/latest`,
  engine:    `${API_BASE}/api/engine`,
  status:    `${API_BASE}/api/status`,
  ws: WS_BASE.endsWith('/stream') ? WS_BASE : `${WS_BASE}/stream`,
};
