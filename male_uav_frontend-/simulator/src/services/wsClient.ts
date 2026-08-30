import { useTelemetryStore } from '../stores/telemetryStore';
import { WS_BASE } from '../lib/config';

class WSClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxDelay = 10000;
  private intentionallyClosed = false;
  private useIpFallback = false;

  connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

    let url = `${WS_BASE}/stream`;
    
    // If localhost failed previously, fallback to 127.0.0.1 to avoid IPv6 issues
    if (this.useIpFallback) {
      url = url.replace('localhost', '127.0.0.1');
    }

    console.log(`[WS] Connecting to ${url}...`);

    try {
      this.ws = new WebSocket(url);
    } catch (e: any) {
      console.error('[WS] Failed to create WebSocket:', e.message || e);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log('[WS] Connected successfully to', url);
      this.reconnectDelay = 1000; // reset backoff
      useTelemetryStore.getState().setTelemetry({ connected: true });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'telemetry:update' || msg.type === 'TELEMETRY') {
          const ts = useTelemetryStore.getState();
          ts.setTelemetry({
            packet: msg.payload,
            packetCount: ts.packetCount + 1,
            connected: true,
            lastUpdate: Date.now(),
          });
        }
      } catch (e) {
        console.warn('[WS] Failed to parse message:', e);
      }
    };

    this.ws.onerror = (e: Event) => {
      // Browser WebSocket API doesn't provide error details in the Event for security reasons.
      // A failure here usually means:
      // 1. Backend is down
      // 2. Port mismatch
      // 3. CORS blocked the upgrade request
      // 4. localhost resolved to IPv6 (::1) but backend is bound to IPv4
      console.error('[WS] Connection Error. Verify backend is running on port 4000 and CORS allows origin.');
      useTelemetryStore.getState().setTelemetry({ connected: false });
      
      // Try 127.0.0.1 on next attempt if we were trying localhost
      if (url.includes('localhost')) {
        this.useIpFallback = true;
      }
    };

    this.ws.onclose = (e) => {
      let reason = e.reason || 'No reason provided';
      if (e.code === 1006) reason = 'Connection refused (or CORS)';
      
      console.warn(`[WS] Closed (code=${e.code}): ${reason}. Reconnecting in ${this.reconnectDelay}ms...`);
      useTelemetryStore.getState().setTelemetry({ connected: false });
      
      if (!this.intentionallyClosed) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      console.log(`[WS] Attempting reconnect...`);
      this.connect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxDelay);
    }, this.reconnectDelay);
  }

  disconnect() {
    this.intentionallyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close(1000, "Intentional disconnect");
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WSClient();
