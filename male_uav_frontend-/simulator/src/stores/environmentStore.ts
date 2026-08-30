import { create } from 'zustand';
export const useEnvStore = create<any>((set) => ({
  altitude: 0, oat: 15, humidity: 45, pressure: 101.3, windSpeed: 0, windDirection: 0, densityAltitude: 0,
  setEnv: (data: any) => set(data)
}));
