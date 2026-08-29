import { create } from 'zustand';
export const useVibrationStore = create<any>((set) => ({
  vibrationX: 0, vibrationY: 0, vibrationZ: 0,
  setVibration: (data: any) => set(data)
}));
