export const API_URL = import.meta.env.VITE_API_URL || "https://indiapreneur-drdo.onrender.com";
export const WS_URL = import.meta.env.VITE_WS_URL || "wss://indiapreneur-drdo.onrender.com/stream";

console.log("API:", API_URL);
console.log("WS:", WS_URL);
