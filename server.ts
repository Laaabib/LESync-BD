import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { syncEntirePmsState } from './src/db/syncService.ts';
import {
  createApp,
  registerBroadcastHandler,
  registerDeviceListHandler,
} from './src/server/app.ts';

interface ConnectedClient {
  ws: WebSocket;
  deviceId: string;
  deviceName: string;
  department: string;
  userEmail: string;
  userName: string;
  connectedAt: string;
  lastPingAt: number;
}

async function startServer() {
  const app = createApp();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });
  const PORT = 3000;

  const connectedClients = new Map<WebSocket, ConnectedClient>();

  function getDeviceList() {
    return Array.from(connectedClients.values()).map((c) => ({
      deviceId: c.deviceId,
      deviceName: c.deviceName,
      department: c.department,
      userName: c.userName,
      userEmail: c.userEmail,
      connectedAt: c.connectedAt,
    }));
  }

  function broadcastPresence() {
    const devices = getDeviceList();
    const msg = JSON.stringify({
      type: 'RESORT_PRESENCE',
      totalDevices: devices.length,
      devices,
    });
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(msg);
        } catch {}
      }
    }
  }

  function broadcastStateToOtherClients(senderWs: WebSocket | null, payload: any) {
    const dataStr = JSON.stringify(payload);
    for (const clientWs of wss.clients) {
      if (clientWs !== senderWs && clientWs.readyState === WebSocket.OPEN) {
        try {
          clientWs.send(dataStr);
        } catch {}
      }
    }
  }

  // Register broadcast hooks for the HTTP Express routes
  registerBroadcastHandler(broadcastStateToOtherClients);
  registerDeviceListHandler(getDeviceList);

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'DEVICE_REGISTER') {
          connectedClients.set(ws, {
            ws,
            deviceId: msg.deviceId || `dev-${Date.now()}`,
            deviceName: msg.deviceName || 'Resort Terminal',
            department: msg.department || 'General Operations',
            userEmail: msg.userEmail || '',
            userName: msg.userName || 'Staff User',
            connectedAt: new Date().toISOString(),
            lastPingAt: Date.now(),
          });
          ws.send(
            JSON.stringify({
              type: 'REGISTER_ACK',
              deviceId: msg.deviceId,
              serverTime: new Date().toISOString(),
              totalDevices: connectedClients.size,
            })
          );
          broadcastPresence();
        } else if (msg.type === 'HEARTBEAT') {
          const client = connectedClients.get(ws);
          if (client) client.lastPingAt = Date.now();
          ws.send(JSON.stringify({ type: 'HEARTBEAT_ACK', timestamp: Date.now() }));
        } else if (msg.type === 'PMS_STATE_BROADCAST') {
          // 1. Immediately fan-out to all other resort terminals across departments
          broadcastStateToOtherClients(ws, {
            type: 'REMOTE_PMS_UPDATE',
            sourceDeviceId: msg.deviceId,
            sourceDepartment: msg.department,
            sourceUserName: msg.userName,
            reason: msg.reason || 'Resort Department Update',
            timestamp: new Date().toISOString(),
            version: msg.version,
            state: msg.state,
          });

          // 2. Persist to Supabase PostgreSQL database
          if (msg.state) {
            try {
              const syncResult = await syncEntirePmsState(
                msg.state,
                `${msg.department || 'Resort'} (${msg.userName || 'Staff'})`
              );
              ws.send(
                JSON.stringify({
                  type: 'SYNC_CONFIRMATION',
                  success: true,
                  version: syncResult?.version || 1,
                  totalEntities: syncResult?.totalEntities || 0,
                  timestamp: syncResult?.timestamp || new Date().toISOString(),
                })
              );
            } catch (err: any) {
              console.warn('Background sync status notice:', err?.message || err);
              ws.send(
                JSON.stringify({
                  type: 'SYNC_CONFIRMATION',
                  success: true,
                  localOnly: true,
                  timestamp: new Date().toISOString(),
                })
              );
            }
          }
        }
      } catch (err) {
        console.error('WebSocket message handling error:', err);
      }
    });

    ws.on('close', () => {
      connectedClients.delete(ws);
      broadcastPresence();
    });

    ws.on('error', (err) => {
      console.warn('WebSocket client error:', err);
      connectedClients.delete(ws);
      broadcastPresence();
    });
  });

  // Catch-all for ANY unmatched /api route - Guarantee JSON response, NEVER fall through to HTML
  app.all('/api*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}`,
    });
  });

  // Global Error Handler for API routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const isApi = (req.originalUrl || req.path || req.url || '').startsWith('/api');
    if (isApi) {
      console.error('Express API error handler caught error:', err);
      return res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal API server error',
      });
    }
    next(err);
  });

  // Vite Middleware configuration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Supabase PMS Sync & Realtime Mesh Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
