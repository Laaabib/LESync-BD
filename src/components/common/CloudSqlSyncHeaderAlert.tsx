import React, { useState, useEffect, useRef } from 'react';
import {
  Database, RefreshCw, AlertTriangle, Clock,
  ChevronDown, ExternalLink, X, AlertOctagon,
  Radio, Wifi, Edit2, ArrowDownToLine, Users, Check
} from 'lucide-react';
import {
  cloudSqlSyncService,
  CloudSqlSyncStatus,
  CloudSqlHealthInfo,
} from '../../services/cloudSqlSyncService';
import { realtimeSyncService, ResortTerminalDevice } from '../../services/realtimeSyncService';
import { rbacService } from '../../services/rbacService';
import { pmsService } from '../../services/pmsService';

interface CloudSqlSyncHeaderAlertProps {
  onOpenFullModal: () => void;
  isAppOwnerOrIT?: boolean;
}

export const CloudSqlSyncHeaderAlert: React.FC<CloudSqlSyncHeaderAlertProps> = ({
  onOpenFullModal,
  isAppOwnerOrIT: propIsAppOwnerOrIT,
}) => {
  const [currentUser, setCurrentUser] = useState(rbacService.getActiveUser());

  // Listen to active user changes (login, switch account, etc.)
  useEffect(() => {
    const unsubUser = rbacService.onUserChange((u) => {
      setCurrentUser(u);
    });
    return () => {
      unsubUser();
    };
  }, []);

  // Determine authorization: ONLY App Owner & IT Support can open the details popover & perform controls
  const isAuthorized = propIsAppOwnerOrIT !== undefined
    ? propIsAppOwnerOrIT
    : rbacService.isAppOwnerOrIT(currentUser);

  const [status, setStatus] = useState<CloudSqlSyncStatus>(cloudSqlSyncService.getStatus());
  const [health, setHealth] = useState<CloudSqlHealthInfo>(cloudSqlSyncService.getHealth());
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncingAction, setIsSyncingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showTestTools, setShowTestTools] = useState(false);

  // Real-time multi-device mesh state
  const [realtimeData, setRealtimeData] = useState<{
    connected: boolean;
    totalDevices: number;
    devices: ResortTerminalDevice[];
    currentDevice: ResortTerminalDevice;
  }>({
    connected: realtimeSyncService.getConnected(),
    totalDevices: realtimeSyncService.getConnectedDevices().length,
    devices: realtimeSyncService.getConnectedDevices(),
    currentDevice: realtimeSyncService.getCurrentDevice(),
  });

  const [isEditingDeviceName, setIsEditingDeviceName] = useState(false);
  const [customDeviceName, setCustomDeviceName] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to service updates & ticker for relative time and overdue transitions
  useEffect(() => {
    const unsub = cloudSqlSyncService.subscribe((newStatus) => {
      setStatus(newStatus);
      setHealth(cloudSqlSyncService.getHealth());
    });

    const unsubRealtime = realtimeSyncService.subscribe((rt) => {
      setRealtimeData(rt);
      if (!isEditingDeviceName) {
        setCustomDeviceName(rt.currentDevice.deviceName);
      }
    });

    const timer = setInterval(() => {
      setHealth(cloudSqlSyncService.getHealth());
    }, 2000);

    return () => {
      unsub();
      unsubRealtime();
      clearInterval(timer);
    };
  }, [isEditingDeviceName]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // =========================================================================
  // 1. GENERAL USERS VIEW:
  // "make sure this should not be accessed by general users only it this app owner
  // and it support can access this general users will be just shown the icon
  // that showing its been syncying or not syncing"
  // =========================================================================
  if (!isAuthorized) {
    const isSyncing = health.isSyncing;
    const isNotSyncing = health.isFailed || health.isOverdue;

    return (
      <div
        id="general-user-sync-indicator"
        className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-default select-none transition-colors ${
          isNotSyncing
            ? 'bg-rose-50/90 border-rose-200 text-rose-800 shadow-2xs'
            : isSyncing
            ? 'bg-blue-50/90 border-blue-200 text-blue-800 shadow-2xs'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-800 shadow-2xs'
        }`}
        title={
          isNotSyncing
            ? 'Data Synchronization: Not Syncing'
            : isSyncing
            ? 'Data Synchronization: Syncing in progress...'
            : 'Data Synchronization: Synced'
        }
      >
        {/* Dynamic Status Icon for General Users */}
        {isSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
        ) : isNotSyncing ? (
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        ) : (
          <Database className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        )}

        {/* Informative Status Label */}
        <span className="hidden sm:inline text-xs font-medium">
          {isSyncing ? 'Syncing...' : isNotSyncing ? 'Not Syncing' : 'Synced'}
        </span>

        {/* Live Pulse Dot (when synced & healthy) */}
        {!isNotSyncing && !isSyncing && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. APP OWNER & IT SUPPORT VIEW:
  // Full interactive button with multi-device presence & synchronization drawer
  // =========================================================================
  const handleQuickSync = async () => {
    setIsSyncingAction(true);
    setActionFeedback(null);
    try {
      const state = pmsService.getState();
      // 1. Broadcast immediately to all connected devices in the resort
      await realtimeSyncService.broadcastState(state, 'Header Manual Sync');
      // 2. Persist to Cloud SQL PostgreSQL database
      const success = await cloudSqlSyncService.syncNow('Header Quick Action');
      if (success) {
        setActionFeedback({
          type: 'success',
          message: 'All resort department data synced to Cloud SQL and pushed to all active devices.',
        });
      } else {
        const latestStatus = cloudSqlSyncService.getStatus();
        setActionFeedback({
          type: 'error',
          message: latestStatus.error || latestStatus.lastErrorMessage || 'Synchronization was interrupted.',
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.message || 'Sync request failed',
      });
    } finally {
      setIsSyncingAction(false);
      setHealth(cloudSqlSyncService.getHealth());
    }
  };

  const handlePullFromCloudSql = async () => {
    setIsSyncingAction(true);
    setActionFeedback(null);
    try {
      const success = await cloudSqlSyncService.loadLatestFromCloudSql();
      if (success) {
        setActionFeedback({
          type: 'success',
          message: 'Authoritative data loaded from Cloud SQL and synced to local screen.',
        });
      } else {
        setActionFeedback({
          type: 'error',
          message: 'Could not retrieve newer snapshot from Cloud SQL.',
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.message || 'Failed to pull from Cloud SQL',
      });
    } finally {
      setIsSyncingAction(false);
      setHealth(cloudSqlSyncService.getHealth());
    }
  };

  const handleSaveDeviceName = () => {
    if (customDeviceName.trim()) {
      realtimeSyncService.setDeviceName(customDeviceName.trim());
    }
    setIsEditingDeviceName(false);
  };

  const handleSimulateFailed = () => {
    cloudSqlSyncService.simulateFailure('Cloud SQL Proxy Connection Timeout: Replica replica-02 unreachable');
    setHealth(cloudSqlSyncService.getHealth());
    setActionFeedback({
      type: 'error',
      message: 'Simulated sync failure activated. Note the visual alert badge in the header.',
    });
  };

  const handleSimulateOverdue = (mins = 25) => {
    cloudSqlSyncService.simulateOverdue(mins);
    setHealth(cloudSqlSyncService.getHealth());
    setActionFeedback({
      type: 'error',
      message: `Simulated sync overdue (${mins} mins ago) activated.`,
    });
  };

  const handleResetSimulation = () => {
    cloudSqlSyncService.clearSimulation();
    setHealth(cloudSqlSyncService.getHealth());
    setActionFeedback({
      type: 'success',
      message: 'Simulation cleared. Standard live sync restored.',
    });
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Header Sync Status Trigger Button (App Owner & IT Support Only) */}
      <button
        type="button"
        id="cloud-sql-sync-badge"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all select-none cursor-pointer ${
          health.isFailed
            ? 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100 ring-2 ring-rose-400/40 animate-pulse'
            : health.isOverdue
            ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 ring-1 ring-amber-400/50'
            : health.isSyncing
            ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100/80'
        }`}
        title={
          health.isFailed
            ? `ALERT: Cloud SQL sync failed! ${health.detail}`
            : health.isOverdue
            ? `WARNING: Cloud SQL sync overdue! ${health.detail}`
            : `Resort Network & Cloud SQL Status: ${health.label} (Click for IT & Management Controls)`
        }
      >
        {/* Dynamic Status Icon */}
        {health.isSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
        ) : health.isFailed ? (
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-bounce" />
        ) : health.isOverdue ? (
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        ) : (
          <Database className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        )}

        {/* Text Label */}
        <span className="hidden sm:inline font-semibold">
          {health.isFailed
            ? 'Sync Failed'
            : health.isOverdue
            ? 'Sync Overdue'
            : health.isSyncing
            ? 'Syncing...'
            : 'Cloud SQL'}
        </span>

        {/* Realtime devices badge */}
        {realtimeData.connected && (
          <span
            className="hidden lg:inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full"
            title={`${realtimeData.totalDevices} active device(s) synchronized across resort departments`}
          >
            <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
            <span>{realtimeData.totalDevices} {realtimeData.totalDevices === 1 ? 'Device' : 'Devices'}</span>
          </span>
        )}

        {/* Status Chip / Time */}
        {health.isFailed ? (
          <span className="text-[9px] font-bold uppercase bg-rose-200 text-rose-900 px-1 py-0.2 rounded">
            Alert
          </span>
        ) : health.isOverdue ? (
          <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
            {health.formattedAgo}
          </span>
        ) : (
          <span className="hidden md:inline text-[10px] font-mono text-emerald-700">
            {health.formattedAgo === 'Never synced' ? 'Pending' : health.formattedAgo}
          </span>
        )}

        {/* Visual Notification Alert Badge in Top Corner */}
        {health.isFailed && (
          <span
            id="cloud-sql-alert-badge-failed"
            className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white shadow-xs ring-2 ring-white animate-pulse"
          >
            !
          </span>
        )}
        {health.isOverdue && !health.isFailed && (
          <span
            id="cloud-sql-alert-badge-overdue"
            className="absolute -top-1.5 -right-1.5 flex h-3.5 min-w-3.5 px-0.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-white shadow-xs ring-2 ring-white"
          >
            !
          </span>
        )}

        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Flyout (Authorized for App Owner & IT Support ONLY) */}
      {isOpen && (
        <div
          id="cloud-sql-sync-popover"
          className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-1.5rem)] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header Bar */}
          <div
            className={`p-3.5 border-b flex items-center justify-between ${
              health.isFailed
                ? 'bg-rose-900 text-rose-50 border-rose-800'
                : health.isOverdue
                ? 'bg-amber-950 text-amber-50 border-amber-900'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <div
                className={`p-1.5 rounded-lg ${
                  health.isFailed
                    ? 'bg-rose-800/80 text-rose-200'
                    : health.isOverdue
                    ? 'bg-amber-900/80 text-amber-200'
                    : 'bg-emerald-600/30 text-emerald-400'
                }`}
              >
                {health.isFailed ? (
                  <AlertOctagon className="w-4 h-4" />
                ) : health.isOverdue ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <Wifi className="w-4 h-4" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold leading-none">Resort Network & Cloud SQL</h4>
                <p className="text-[10px] opacity-75 mt-0.5 font-mono">
                  All Departments Synchronized • Cloud SQL Mirror
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  health.isFailed
                    ? 'bg-rose-500 text-white'
                    : health.isOverdue
                    ? 'bg-amber-500 text-white'
                    : health.isSyncing
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {health.state}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-white/10 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Connected Resort Terminals Mesh Section */}
          <div className="p-3 bg-slate-50 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Active Resort Devices ({realtimeData.totalDevices})
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Mesh Connected
              </span>
            </div>

            {/* Current Terminal Card */}
            <div className="p-2 bg-white rounded-lg border border-indigo-200/80 mb-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[9px] uppercase">
                    This Terminal
                  </span>
                  {isEditingDeviceName ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={customDeviceName}
                        onChange={(e) => setCustomDeviceName(e.target.value)}
                        className="px-1.5 py-0.5 text-xs border border-indigo-300 rounded font-semibold text-slate-800 max-w-[140px]"
                        placeholder="Device Name"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveDeviceName}
                        className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Save name"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="font-bold text-slate-900">{realtimeData.currentDevice.deviceName}</span>
                  )}
                </div>
                {!isEditingDeviceName && (
                  <button
                    onClick={() => setIsEditingDeviceName(true)}
                    className="text-slate-400 hover:text-indigo-600 p-0.5"
                    title="Rename this device"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Department: <strong>{realtimeData.currentDevice.department}</strong> • User: {realtimeData.currentDevice.userName}
              </p>
            </div>

            {/* Other Devices in the Resort */}
            {realtimeData.devices.filter(d => !d.isCurrentDevice).length > 0 ? (
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {realtimeData.devices.filter(d => !d.isCurrentDevice).map((device) => (
                  <div key={device.deviceId} className="flex items-center justify-between px-2 py-1 bg-white rounded border border-gray-200 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="font-medium text-slate-800">{device.deviceName}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.2 rounded">
                      {device.department}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 italic text-center py-1">
                Other resort terminals (Housekeeping, POS, Banquets, Accounts) will appear here as they connect.
              </p>
            )}
          </div>

          {/* Cloud SQL Sync Metrics */}
          <div className="p-3.5 bg-gray-50/70 border-b border-gray-100 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Cloud SQL Sync</span>
              <span className="font-semibold text-gray-800 text-xs mt-0.5 block">
                {health.formattedAgo}
              </span>
              <span className="text-[10px] text-gray-400 font-mono block truncate">
                {health.lastSyncedAt ? new Date(health.lastSyncedAt).toLocaleTimeString() : 'Pending'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Snapshot Version</span>
              <span className="font-mono font-bold text-blue-600 text-xs mt-0.5 block">
                v{status.snapshotVersion}
              </span>
              <span className="text-[10px] text-gray-500 block">
                {status.totalEntities || 0} entities synced
              </span>
            </div>
          </div>

          {/* Action Feedback */}
          {actionFeedback && (
            <div
              className={`p-2.5 text-xs border-b ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              {actionFeedback.message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-3.5 space-y-2">
            <button
              onClick={handleQuickSync}
              disabled={isSyncingAction}
              id="cloud-sql-sync-now-btn"
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors shadow-xs ${
                health.isFailed
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                  : health.isOverdue
                  ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
              } disabled:opacity-50 cursor-pointer`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAction ? 'animate-spin' : ''}`} />
              <span>{isSyncingAction ? 'Syncing Network...' : 'Push & Sync All Devices Now'}</span>
            </button>

            <button
              onClick={handlePullFromCloudSql}
              disabled={isSyncingAction}
              id="cloud-sql-pull-now-btn"
              className="w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-blue-600" />
              <span>Pull Latest Snapshot from Cloud SQL</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenFullModal();
              }}
              id="cloud-sql-open-console-btn"
              className="w-full py-1.5 px-3 rounded-lg text-xs font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Open Cloud SQL Synchronization Console</span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </button>
          </div>

          {/* Diagnostic & Simulation Drawer (IT Support & App Owner Only) */}
          <div className="px-3.5 pb-3 pt-1 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-gray-500">
                Overdue Threshold: <strong className="text-gray-700">{health.thresholdMinutes}m</strong>
              </span>
              <button
                onClick={() => setShowTestTools(!showTestTools)}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
              >
                {showTestTools ? 'Hide Diagnostic Tools' : 'Test Diagnostic Tools'}
              </button>
            </div>

            {showTestTools && (
              <div className="mt-2.5 pt-2 border-t border-gray-200 space-y-2">
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={handleSimulateFailed}
                    className="flex-1 px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] rounded font-bold border border-rose-300"
                  >
                    Simulate Failure
                  </button>
                  <button
                    onClick={() => handleSimulateOverdue(25)}
                    className="flex-1 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] rounded font-bold border border-amber-300"
                  >
                    Simulate Overdue
                  </button>
                  <button
                    onClick={handleResetSimulation}
                    className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] rounded font-bold border border-emerald-300"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
