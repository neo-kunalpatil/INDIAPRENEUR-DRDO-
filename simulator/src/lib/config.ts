// Central config - all backend URLs come from here
let envApi = process.env.NEXT_PUBLIC_API_URL;
let envWs = process.env.NEXT_PUBLIC_WS_URL;

// Active Defense: Reject poisoned Vercel localhost environment variables
if (envApi && envApi.includes("localhost")) envApi = "";
if (envWs && envWs.includes("localhost")) envWs = "";

export const API_BASE_URL = envApi || "https://indiapreneur-drdo.onrender.com";
export const WEBSOCKET_URL = envWs || "wss://indiapreneur-drdo.onrender.com/stream";

console.log("API:", API_BASE_URL);
console.log("WS:", WEBSOCKET_URL);

export const ENDPOINTS = {
  mission:   `${API_BASE_URL}/api/mission`,
  faults:    `${API_BASE_URL}/api/faults`,
  telemetry: `${API_BASE_URL}/api/telemetry/latest`,
  engine:    `${API_BASE_URL}/api/engine`,
  status:    `${API_BASE_URL}/api/status`,
  health:    `${API_BASE_URL}/health`,
  ws: WEBSOCKET_URL,
};
