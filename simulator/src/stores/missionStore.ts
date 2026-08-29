import { create } from 'zustand';
export const useMissionStore = create<any>((set) => ({
  phase: 'GROUND_IDLE', isActive: false, timer: 0,
  setMission: (data: any) => set(data)
}));
