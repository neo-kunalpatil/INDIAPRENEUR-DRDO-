// Central Config for Vite Frontend
let envApi = import.meta.env.VITE_API_URL;
let envWs = import.meta.env.VITE_WS_URL;

// Enforce environment variables (no hardcoded placeholders)
export const API_BASE = envApi || "";
export const WS_BASE = envWs || "";

console.log("API_BASE =", API_BASE);
console.log("WS_BASE =", WS_BASE);
