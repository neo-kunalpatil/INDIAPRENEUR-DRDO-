import { create } from 'zustand';
export const useFaultStore = create<any>((set) => ({
  activeFaults: [],
  addFault: (f: any) => set((s: any) => ({ activeFaults: [...s.activeFaults, f] })),
  removeFault: (id: string) => set((s: any) => ({ activeFaults: s.activeFaults.filter((f: any) => f.id !== id) })),
  clearFaults: () => set({ activeFaults: [] }),
  setFaults: (data: any) => set(data)
}));
