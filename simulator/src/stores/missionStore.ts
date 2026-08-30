import { create } from 'zustand';

export const useMissionStore = create<any>((set) => ({
  phase: 'GROUND_IDLE',
  isActive: false,
  status: 'STOPPED',
  timer: 0,
  setMission: (data: any) => set((state: any) => ({ ...state, ...data })),
}));
