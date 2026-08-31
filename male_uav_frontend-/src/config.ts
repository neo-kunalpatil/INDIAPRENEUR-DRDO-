// Central Config for Vite Frontend
let envApi = import.meta.env.VITE_API_URL;
let envWs = import.meta.env.VITE_WS_URL;

// Active Defense: Reject poisoned Vercel localhost environment variables
if (envApi && envApi.includes("localhost")) envApi = "";
if (envWs && envWs.includes("localhost")) envWs = "";

export const API_BASE = envApi || "https://indiapreneur-drdo-1.onrender.com";
export const WS_BASE = envWs || "wss://indiapreneur-drdo-1.onrender.com";

console.log("API_BASE =", API_BASE);
console.log("WS_BASE =", WS_BASE);
