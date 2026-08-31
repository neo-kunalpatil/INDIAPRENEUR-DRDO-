export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
export const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL;

export const ENDPOINTS = {
  mission:   `${API_BASE_URL}/api/mission`,
  faults:    `${API_BASE_URL}/api/faults`,
  telemetry: `${API_BASE_URL}/api/telemetry/latest`,
  engine:    `${API_BASE_URL}/api/engine`,
  status:    `${API_BASE_URL}/api/status`,
  health:    `${API_BASE_URL}/health`,
  ws: WEBSOCKET_URL,
};
