const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://indiapreneur-drdo-1.onrender.com";

const WS_BASE =
  import.meta.env.VITE_WS_URL ||
  "wss://indiapreneur-drdo-1.onrender.com";

console.log("API_BASE =", API_BASE);
console.log("WS_BASE =", WS_BASE);

export { API_BASE, WS_BASE };
