import { create } from 'zustand';
export const useElectricalStore = create<any>((set) => ({
  batteryVoltage: 24, alternatorVoltage: 0, currentDraw: 0,
  setElectrical: (data: any) => set(data)
}));
