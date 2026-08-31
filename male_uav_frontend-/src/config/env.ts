let envApi = import.meta.env.VITE_API_URL || "";
let envWs = import.meta.env.VITE_WS_URL || "";

// Runtime Override: Ignore statically injected localhost from poisoned build environments
if (envApi.includes("localhost")) envApi = "https://indiapreneur-drdo.onrender.com";
if (envWs.includes("localhost")) envWs = "wss://indiapreneur-drdo.onrender.com/stream";

export const API_URL = envApi || "https://indiapreneur-drdo.onrender.com";
export const WS_URL = envWs || "wss://indiapreneur-drdo.onrender.com/stream";

console.log("API:", API_URL);
console.log("WS:", WS_URL);
