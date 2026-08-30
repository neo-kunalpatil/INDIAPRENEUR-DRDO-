import { wsClient } from '../services/wsClient';

export class SimulationLoop {
  start() {
    wsClient.connect();
  }
  
  stop() {
  }
}

export const simulation = new SimulationLoop();
