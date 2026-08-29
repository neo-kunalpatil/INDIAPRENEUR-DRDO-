import { create } from 'zustand';
export const useFlightStore = create<any>((set) => ({
  airspeed: 0, groundSpeed: 0, verticalSpeed: 0, heading: 0, pitch: 0, roll: 0, yaw: 0,
  setFlight: (data: any) => set(data)
}));
