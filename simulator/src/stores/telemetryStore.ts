import { create } from 'zustand';

export const useTelemetryStore = create<any>((set) => ({
  packet: null,
  packetCount: 0,
  connected: false,
  lastUpdate: 0,
  setTelemetry: (data: any) => set((state: any) => ({ ...state, ...data })),
}));
