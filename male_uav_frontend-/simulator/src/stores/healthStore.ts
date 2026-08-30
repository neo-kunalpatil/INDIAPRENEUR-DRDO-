import { create } from 'zustand';
export const useHealthStore = create<any>((set) => ({
  score: 100, category: 'EXCELLENT', alerts: [],
  setHealth: (data: any) => set(data)
}));
