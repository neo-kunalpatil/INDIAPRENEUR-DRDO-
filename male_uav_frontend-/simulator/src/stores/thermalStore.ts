import { create } from 'zustand';
export const useThermalStore = create<any>((set) => ({
  cht: 25, egt: 25, oilTemp: 25, oilPressure: 0,
  setThermal: (data: any) => set(data)
}));
