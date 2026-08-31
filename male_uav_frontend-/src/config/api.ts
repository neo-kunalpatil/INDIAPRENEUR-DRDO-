let envApi = import.meta.env.VITE_API_URL;
let envWs = import.meta.env.VITE_WS_URL;

// Active Defense: Reject poisoned Vercel localhost environment variables
if (envApi && envApi.includes("localhost")) envApi = "";
if (envWs && envWs.includes("localhost")) envWs = "";

export const API_BASE_URL_URL = envApi || "https://indiapreneur-drdo.onrender.com";
export const WS_URL = envWs || "wss://indiapreneur-drdo.onrender.com/stream";

console.log("API:", API_BASE_URL_URL);
console.log("WS:", WS_URL);
