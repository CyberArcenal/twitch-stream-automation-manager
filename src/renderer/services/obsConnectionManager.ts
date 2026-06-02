// obsConnectionManager.ts
import { streamManagerAPI } from '../api/core/streamManager';
import { dialogs } from '../utils/dialogs';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
type Listener = (status: ConnectionStatus) => void;

class OBSConnectionManager {
  private status: ConnectionStatus = 'disconnected';
  private connectionPromise: Promise<boolean> | null = null;
  private listeners: Listener[] = [];

  async connect(host = 'localhost', port = 4455, password = '') {
    if (this.status === 'connected') return true;
    if (this.connectionPromise) return this.connectionPromise;

    this.setStatus('connecting');
    this.connectionPromise = (async () => {
      try {
        const res = await streamManagerAPI.obsConnect(host, port, password);
        if (res.status) {
          this.setStatus('connected');
          return true;
        } else {
          if (res.message === 'AUTH_REQUIRED') {
            dialogs.error('OBS authentication required. Check password.');
          } else {
            dialogs.error(`Failed to connect: ${res.message}`);
          }
          this.setStatus('disconnected');
          return false;
        }
      } catch (err) {
        console.error('OBS connection error', err);
        this.setStatus('disconnected');
        return false;
      } finally {
        this.connectionPromise = null;
      }
    })();
    return this.connectionPromise;
  }

  disconnect() {
    streamManagerAPI.obsDisconnect().catch(console.error);
    this.setStatus('disconnected');
    this.connectionPromise = null;
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.listeners.forEach(fn => fn(status));
  }

  onStatusChange(fn: Listener) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  getStatus() {
    return this.status;
  }
}

export const obsConnectionManager = new OBSConnectionManager();