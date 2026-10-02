import { pmsService } from './pmsService';
import { rbacService } from './rbacService';
import { PmsDatabaseState } from './mockPmsDatabase';
import { cloudSqlSyncService } from './cloudSqlSyncService';

export interface ResortTerminalDevice {
  deviceId: string;
  deviceName: string;
  department: string;
  userName: string;
  userEmail: string;
  connectedAt: string;
  isCurrentDevice?: boolean;
}

export interface RemoteSyncNotice {
  id: string;
  timestamp: string;
  department: string;
  userName: string;
  reason: string;
}

type RealtimeListener = (data: {
  connected: boolean;
  totalDevices: number;
  devices: ResortTerminalDevice[];
  currentDevice: ResortTerminalDevice;
}) => void;

type NoticeListener = (notice: RemoteSyncNotice) => void;

class RealtimeSyncManager {
  private ws: WebSocket | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private deviceId: string;
  private deviceName: string;
  private isConnected = false;
  private reconnectTimer: any = null;
  private reconnectAttempts = 0;
  private pingTimer: any = null;
  private listeners: RealtimeListener[] = [];
  private noticeListeners: NoticeListener[] = [];
  private connectedDevices: ResortTerminalDevice[] = [];
  private debounceTimer: any = null;
  private isInitialized = false;
  private latestNotice: RemoteSyncNotice | null = null;

  constructor() {
    // Generate or restore persistent device identity
    let savedId = '';
    let savedName = '';
    try {
      if (typeof localStorage !== 'undefined') {
        savedId = localStorage.getItem('resort_pms_device_id') || '';
        savedName = localStorage.getItem('resort_pms_device_name') || '';
      }
    } catch {}

    if (!savedId) {
      savedId = `term-${Math.random().toString(36).substring(2, 9)}-${Date.now().toString(36)}`;
      try {
        localStorage.setItem('resort_pms_device_id', savedId);
      } catch {}
    }

    this.deviceId = savedId;
    this.deviceName = savedName || this.generateDefaultName();
  }

  private generateDefaultName(): string {
    const user = rbacService.getActiveUser();
    const dept = user?.department || 'Resort Operations';
    const shortId = this.deviceId.slice(-4).toUpperCase();
    return `${dept} Terminal (${shortId})`;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public getDeviceName(): string {
    return this.deviceName;
  }

  public setDeviceName(name: string) {
    this.deviceName = name.trim() || this.generateDefaultName();
    try {
      localStorage.setItem('resort_pms_device_name', this.deviceName);
    } catch {}
    this.registerDevice();
    this.notify();
  }

  public getConnected(): boolean {
    return this.isConnected;
  }

  public getConnectedDevices(): ResortTerminalDevice[] {
    return [...this.connectedDevices];
  }

  public getCurrentDevice(): ResortTerminalDevice {
    const user = rbacService.getActiveUser();
    return {
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      department: user?.department || 'Resort Operations',
      userName: user?.name || 'Staff User',
      userEmail: user?.email || '',
      connectedAt: new Date().toISOString(),
      isCurrentDevice: true,
    };
  }

  public getLatestNotice(): RemoteSyncNotice | null {
    return this.latestNotice;
  }

  public subscribe(fn: RealtimeListener): () => void {
    this.listeners.push(fn);
    fn(this.getPayload());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public subscribeNotices(fn: NoticeListener): () => void {
    this.noticeListeners.push(fn);
    return () => {
      this.noticeListeners = this.noticeListeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    const payload = this.getPayload();
    for (const listener of this.listeners) {
      try {
        listener(payload);
      } catch (err) {
        console.error('Realtime sync listener error:', err);
      }
    }
  }

  private getPayload() {
    return {
      connected: this.isConnected,
      totalDevices: this.connectedDevices.length,
      devices: this.connectedDevices,
      currentDevice: this.getCurrentDevice(),
    };
  }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Initialize cross-tab BroadcastChannel for zero-latency peer mesh in all environments (including Vercel)
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('resort_realtime_tab_mesh_v2');
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel init note:', err);
      }
    }

    // Connect WebSocket
    this.connectWebSocket();

    // Subscribe to local PMS mutations to broadcast to resort peers
    pmsService.subscribe((state) => {
      this.handleLocalMutation(state);
    });

    // Listen to user/department changes to update registration
    rbacService.subscribe(() => {
      this.registerDevice();
    });
  }

  private connectWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      if (this.ws) {
        try {
          this.ws.close();
        } catch {}
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.registerDevice();
        this.startHeartbeat();
        this.notify();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleIncomingMessage(msg);
        } catch (err) {
          console.warn('Realtime message parse error:', err);
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.scheduleReconnect();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectAttempts++;

    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel');

    // In serverless / Vercel hosting, WebSockets are not supported.
    // Transition cleanly to the BroadcastChannel mesh without spamming error loops.
    if (isVercel && this.reconnectAttempts >= 2) {
      this.isConnected = true;
      if (this.connectedDevices.length === 0) {
        this.connectedDevices = [this.getCurrentDevice()];
      }
      this.notify();
      return;
    }

    const delay = Math.min(3000 * Math.min(this.reconnectAttempts, 5), 15000);
    this.reconnectTimer = setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'HEARTBEAT' }));
        } catch {}
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private registerDevice() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const current = this.getCurrentDevice();
    try {
      this.ws.send(
        JSON.stringify({
          type: 'DEVICE_REGISTER',
          deviceId: current.deviceId,
          deviceName: current.deviceName,
          department: current.department,
          userEmail: current.userEmail,
          userName: current.userName,
        })
      );
    } catch {}
  }

  private handleIncomingMessage(msg: any) {
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'RESORT_PRESENCE') {
      const list: ResortTerminalDevice[] = Array.isArray(msg.devices) ? msg.devices : [];
      this.connectedDevices = list.map((d) => ({
        ...d,
        isCurrentDevice: d.deviceId === this.deviceId,
      }));
      this.notify();
    } else if (msg.type === 'REMOTE_PMS_UPDATE') {
      // Ignore messages echoed from this same device
      if (msg.sourceDeviceId === this.deviceId) {
        return;
      }

      const notice: RemoteSyncNotice = {
        id: `notice-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        department: msg.sourceDepartment || 'Resort Operations',
        userName: msg.sourceUserName || 'Staff Member',
        reason: msg.reason || 'Data synchronized from remote terminal',
      };

      this.latestNotice = notice;
      for (const fn of this.noticeListeners) {
        try {
          fn(notice);
        } catch {}
      }

      // Apply the remote update to local database with fromRemote = true
      if (msg.state) {
        pmsService.replaceState(
          msg.state,
          `Live sync from ${msg.sourceDepartment || 'Resort'} (${msg.sourceUserName || 'Staff'})`,
          true
        );
      }
    }
  }

  private handleLocalMutation(state: PmsDatabaseState) {
    // If the local state change was triggered by receiving a remote sync, DO NOT re-broadcast
    if (pmsService.isRemoteUpdateActive()) {
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce by 800ms to batch rapid user inputs
    this.debounceTimer = setTimeout(() => {
      this.broadcastState(state, 'Resort Terminal Data Update');
    }, 800);
  }

  public async broadcastState(state: PmsDatabaseState, reason = 'Department Operation'): Promise<boolean> {
    const current = this.getCurrentDevice();
    const payload = {
      type: 'PMS_STATE_BROADCAST',
      deviceId: current.deviceId,
      deviceName: current.deviceName,
      department: current.department,
      userName: current.userName,
      reason,
      state,
      version: cloudSqlSyncService.getStatus().snapshotVersion + 1,
    };

    // 1. Broadcast instantly to all other browser tabs via BroadcastChannel (works everywhere, including Vercel)
    try {
      this.broadcastChannel?.postMessage({
        type: 'REMOTE_PMS_UPDATE',
        sourceDeviceId: current.deviceId,
        sourceDepartment: current.department,
        sourceUserName: current.userName,
        reason,
        timestamp: new Date().toISOString(),
        version: payload.version,
        state,
      });
    } catch (bcErr) {
      console.warn('BroadcastChannel postMessage error:', bcErr);
    }

    // 2. If WebSocket is actively connected, send over socket to remote terminals
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
        return true;
      } catch (err) {
        console.warn('WebSocket send failed, falling back to HTTP broadcast:', err);
      }
    }

    // 3. Fallback: send via HTTP broadcast & Cloud SQL commit endpoint (when backend server is running)
    try {
      await fetch('/api/cloudsql/broadcast-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return true;
    } catch {
      // In static / Vercel client-only hosting, local BroadcastChannel sync succeeded
      return true;
    }
  }
}

export const realtimeSyncService = new RealtimeSyncManager();
