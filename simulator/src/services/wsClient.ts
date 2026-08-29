import { useTelemetryStore } from '../stores/telemetryStore';

class WSClient {
  private ws: WebSocket | null = null;
  
  connect() {
    if (typeof window === 'undefined') return;
    this.ws = new WebSocket('ws://localhost:5000/stream');
    
    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'TELEMETRY') {
          // Dashboard now reads from WS stream!
          const ts = useTelemetryStore.getState();
          useTelemetryStore.getState().setTelemetry({ 
            packet: msg.payload, 
            packetCount: ts.packetCount + 1,
            connected: true
          });
        }
      } catch (e) {}
    };
    
    this.ws.onclose = () => {
      useTelemetryStore.getState().setTelemetry({ connected: false });
      setTimeout(() => this.connect(), 2000); // Reconnect
    };
  }

  sendIngest(packet: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'INGEST', payload: packet }));
    }
  }
}

export const wsClient = new WSClient();
