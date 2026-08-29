import { create } from 'zustand';
export const useTelemetryStore = create<any>((set) => ({
  packet: null, packetCount: 0, connected: false,
  setTelemetry: (data: any) => set(data)
}));
