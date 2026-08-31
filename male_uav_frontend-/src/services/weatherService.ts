// WEATHER SERVICE
// Uses OpenWeatherMap API (https://openweathermap.org)
// Fetches current weather at UAV coordinates (livePosition.lat, livePosition.lng)

export interface WeatherData {
  windSpeedKts: number;
  windDirectionDeg: number;
  tempC: number;
  pressureHpa: number;
  visibilityKm: number;
  weatherCode: number;
  timestamp: string;
  isLoading: boolean;
  error: string | null;
}

export const WEATHER_DEFAULTS: WeatherData = {
  windSpeedKts: 0,
  windDirectionDeg: 0,
  tempC: -14.2,    // High-altitude default
  pressureHpa: 432,
  visibilityKm: 10,
  weatherCode: 0,
  timestamp: '',
  isLoading: true,
  error: null,
};

/**
 * Fetch current weather from OpenWeatherMap for given coordinates.
 */
export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || "4621ad72b8dda8d52458d87a7c94c80c";
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`OpenWeatherMap HTTP ${response.status}`);
  }

  const json = await response.json();

  // Convert m/s to knots
  const windSpeedKts = json.wind?.speed ? Math.round(json.wind.speed * 1.94384) : 0;
  
  return {
    windSpeedKts:     windSpeedKts,
    windDirectionDeg: Math.round(json.wind?.deg ?? 0),
    tempC:            Number((json.main?.temp ?? -14.2).toFixed(1)),
    pressureHpa:      Math.round(json.main?.pressure ?? 432),
    visibilityKm:     Math.round((json.visibility ?? 10000) / 1000),
    weatherCode:      json.weather?.[0]?.id ?? 800,
    timestamp:        json.dt ? new Date(json.dt * 1000).toISOString() : new Date().toISOString(),
    isLoading:        false,
    error:            null,
  };
}

/**
 * Translate OWM weather code to plain label.
 */
export function weatherCodeLabel(code: number): string {
  if (code >= 200 && code < 300) return 'THUNDERSTORM';
  if (code >= 300 && code < 400) return 'DRIZZLE';
  if (code >= 500 && code < 600) return 'RAIN';
  if (code >= 600 && code < 700) return 'SNOW';
  if (code >= 700 && code < 800) return 'FOG / MIST';
  if (code === 800) return 'CLEAR';
  if (code > 800 && code < 900) return 'CLOUDY';
  return 'UNKNOWN';
}

/**
 * Compute wind-based mission risk bonus.
 */
export function weatherRiskBonus(windSpeedKts: number, visibilityKm: number): number {
  let bonus = 0;
  if (windSpeedKts > 30) bonus += (windSpeedKts - 30) * 0.5;
  if (visibilityKm < 3)  bonus += (3 - visibilityKm) * 2;
  return Math.min(20, bonus);
}
