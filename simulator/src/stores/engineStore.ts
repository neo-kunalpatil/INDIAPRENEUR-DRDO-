import { create } from 'zustand';
export const useEngineStore = create<any>((set) => ({
  state: 'OFF', rpm: 0, throttle: 0, engineLoad: 0, torque: 0, power: 0,
  setEngine: (data: any) => set(data)
}));
