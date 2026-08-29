import { create } from 'zustand';
export const useFuelStore = create<any>((set) => ({
  fuelFlow: 0, fuelPressure: 0, fuelRemaining: 150, fuelTankCapacity: 150,
  setFuel: (data: any) => set(data)
}));
