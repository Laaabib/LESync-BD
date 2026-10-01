import React, { useState, useEffect } from 'react';
import {
  Database, RefreshCw, CheckCircle2, AlertCircle, Clock, Server,
  ShieldCheck, Layers, ArrowUpRight, Zap, AlertTriangle
} from 'lucide-react';
import { cloudSqlSyncService, CloudSqlSyncStatus, SyncHistoryItem, CloudSqlHealthInfo } from '../../services/cloudSqlSyncService';
import { realtimeSyncService } from '../../services/realtimeSyncService';
import { pmsService } from '../../services/pmsService';
import { rbacService } from '../../services/rbacService';

interface CloudSqlSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSqlSyncModal: React.FC<CloudSqlSyncModalProps> = ({ isOpen, onClose }) => {
  const isAppOwnerOrIT = rbacService.isAppOwnerOrIT();
  if (!isOpen || !isAppOwnerOrIT) return null;
  const [status, setStatus] = useState<CloudSqlSyncStatus>(cloudSqlSyncService.getStatus());
  const [health, setHealth] = useState<CloudSqlHealthInfo>(cloudSqlSyncService.getHealth());
  const [history, setHistory] = useState<SyncHistoryItem[]>([]);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = cloudSqlSyncService.subscribe((s) => {
      setStatus(s);
      setHealth(cloudSqlSyncService.getHealth());
    });
    setHealth(cloudSqlSyncService.getHealth());
    cloudSqlSyncService.getHistory(10).then(setHistory);

    const timer = setInterval(() => {
      setHealth(cloudSqlSyncService.getHealth());
    }, 2000);

    return () => {
      unsub();
      clearInterval(timer);
    };
  }, [isOpen]);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    setFeedbackMessage(null);
    try {
      const state = pmsService.getState();
      await realtimeSyncService.broadcastState(state, 'Modal Manual Broadcast');
    } catch {}
    const success = await cloudSqlSyncService.syncNow('Manual User Trigger in Modal');
    setIsManualSyncing(false);
    if (success) {
      setFeedbackMessage('All resort department records piped into Cloud SQL and pushed to all active devices.');
      const updatedHistory = await cloudSqlSyncService.getHistory(10);
      setHistory(updatedHistory);
    } else {
      setFeedbackMessage('Sync failed. Please check Cloud SQL connection.');
    }
  };

  const handleHydrateFromCloud = async () => {
    setIsManualSyncing(true);
    setFeedbackMessage(null);
    const success = await cloudSqlSyncService.loadLatestFromCloudSql();
    setIsManualSyncing(false);
    if (success) {
      setFeedbackMessage('Successfully hydrated state & accounts from Cloud SQL snapshot.');
    } else {
      setFeedbackMessage('Cloud state load failed or no snapshot found in Cloud SQL.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-600/30 border border-blue-400/30 text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold tracking-tight">Cloud SQL Data Synchronization</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {status.region} (us-west1)
                </span>
              </div>
              <p className="text-xs text-slate-400">Continuous local-to-cloud PMS data pipe & state persistence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Health Alert Banner (Failure or Overdue) */}
          {health.isFailed ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-900">
                      Cloud SQL Synchronization Failure
                    </p>
                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-rose-200 text-rose-800">
                      ACTION REQUIRED
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 font-medium mt-1 leading-relaxed">
                    {health.detail}
                  </p>
                  <p className="text-[11px] text-rose-700/80 mt-1">
                    Your changes remain cached locally in browser memory. Press "Sync Now to Cloud SQL" to re-establish the connection and push the latest snapshot.
                  </p>
                </div>
              </div>
              <button
                onClick={handleManualSync}
                disabled={isManualSyncing || status.isSyncing}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shrink-0 shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                <span>Retry Sync</span>
              </button>
            </div>
          ) : health.isOverdue ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      Synchronization Overdue Warning
                    </p>
                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-200 text-amber-800">
                      {health.formattedAgo}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 font-medium mt-1 leading-relaxed">
                    {health.detail}
                  </p>
                  <p className="text-[11px] text-amber-700/80 mt-1">
                    A periodic push is recommended to keep multi-terminal and remote auditor dashboards synchronized.
                  </p>
                </div>
              </div>
              <button
                onClick={handleManualSync}
                disabled={isManualSyncing || status.isSyncing}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                <span>Push Sync</span>
              </button>
            </div>
          ) : null}

          {/* Status & Trigger Banner */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className={`relative flex h-3.5 w-3.5`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.connected ? 'bg-emerald-400 opacity-75' : 'bg-red-400 opacity-75'}`}></span>
                <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${status.connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              </span>
              <div>
                <p className="text-xs font-bold text-gray-900">
                  {status.connected ? 'Connected to Cloud SQL PostgreSQL Instance' : 'Reconnecting to Cloud SQL Proxy...'}
                </p>
                <p className="text-[11px] text-gray-500 font-mono">
                  Instance: ai-studio-f1e3e6a7 • DB: {status.database} • Version: {status.dbVersion || 'PostgreSQL 16'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleHydrateFromCloud}
                disabled={isManualSyncing || status.isSyncing}
                title="Pull and restore latest snapshot from Cloud SQL"
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 font-bold text-xs rounded-lg transition-all border border-slate-200"
              >
                <ArrowUpRight className="w-3.5 h-3.5 rotate-180" />
                <span>Pull from Cloud</span>
              </button>

              <button
                onClick={handleManualSync}
                disabled={isManualSyncing || status.isSyncing}
                className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing || status.isSyncing ? 'animate-spin' : ''}`} />
                <span>{isManualSyncing || status.isSyncing ? 'Piping Changes...' : 'Sync Now to Cloud SQL'}</span>
              </button>
            </div>
          </div>

          {feedbackMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {/* Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Snapshot Version</span>
              <p className="text-lg font-mono font-bold text-gray-900 mt-0.5">v{status.snapshotVersion}</p>
              <span className="text-[10px] text-gray-500">Atomic state snapshot</span>
            </div>

            <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Records</span>
              <p className="text-lg font-mono font-bold text-blue-600 mt-0.5">{(status.totalEntities || 0).toLocaleString()}</p>
              <span className="text-[10px] text-gray-500">Across tables</span>
            </div>

            <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Delta Events</span>
              <p className="text-lg font-mono font-bold text-purple-600 mt-0.5">{(status.totalEventsSynced || 0).toLocaleString()}</p>
              <span className="text-[10px] text-gray-500">Logged operations</span>
            </div>

            <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Last Synced</span>
              <p className="text-xs font-mono font-semibold text-gray-800 mt-1.5 truncate">
                {status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleTimeString() : 'Pending'}
              </p>
              <span className="text-[10px] text-gray-500">
                {status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleDateString() : 'Auto-reactive'}
              </span>
            </div>
          </div>

          {/* Relational Table Breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2.5 flex items-center justify-between">
              <span>Synchronized Relational Tables & Accounts Module</span>
              <span className="text-[10px] text-gray-400 font-normal">Auto-mapped via Drizzle ORM</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-2 rounded-lg border border-gray-200 bg-white flex flex-col justify-between">
                <span className="text-[11px] text-gray-500 font-medium truncate">pms_rooms</span>
                <span className="text-sm font-bold font-mono text-gray-900">{status.tableCounts.rooms}</span>
              </div>
              <div className="p-2 rounded-lg border border-gray-200 bg-white flex flex-col justify-between">
                <span className="text-[11px] text-gray-500 font-medium truncate">pms_reservations</span>
                <span className="text-sm font-bold font-mono text-gray-900">{status.tableCounts.reservations}</span>
              </div>
              <div className="p-2 rounded-lg border border-gray-200 bg-white flex flex-col justify-between">
                <span className="text-[11px] text-gray-500 font-medium truncate">pms_stays</span>
                <span className="text-sm font-bold font-mono text-gray-900">{status.tableCounts.stays}</span>
              </div>
              <div className="p-2 rounded-lg border border-gray-200 bg-white flex flex-col justify-between">
                <span className="text-[11px] text-gray-500 font-medium truncate">pms_folios</span>
                <span className="text-sm font-bold font-mono text-gray-900">{status.tableCounts.folios}</span>
              </div>
              <div className="p-2 rounded-lg border border-gray-200 bg-white flex flex-col justify-between">
                <span className="text-[11px] text-gray-500 font-medium truncate">pms_payments</span>
                <span className="text-sm font-bold font-mono text-gray-900">{status.tableCounts.payments}</span>
              </div>
              <div className="p-2 rounded-lg border border-blue-200 bg-blue-50/50 flex flex-col justify-between">
                <span className="text-[11px] text-blue-700 font-medium truncate">pms_gl_accounts</span>
                <span className="text-sm font-bold font-mono text-blue-900">{status.tableCounts.glAccounts || 0}</span>
              </div>
              <div className="p-2 rounded-lg border border-blue-200 bg-blue-50/50 flex flex-col justify-between">
                <span className="text-[11px] text-blue-700 font-medium truncate">pms_journal_vouchers</span>
                <span className="text-sm font-bold font-mono text-blue-900">{status.tableCounts.journalVouchers || 0}</span>
              </div>
              <div className="p-2 rounded-lg border border-blue-200 bg-blue-50/50 flex flex-col justify-between">
                <span className="text-[11px] text-blue-700 font-medium truncate">pms_city_ledger</span>
                <span className="text-sm font-bold font-mono text-blue-900">{status.tableCounts.cityLedger || 0}</span>
              </div>
              <div className="p-2 rounded-lg border border-blue-200 bg-blue-50/50 flex flex-col justify-between">
                <span className="text-[11px] text-blue-700 font-medium truncate">pms_invoices</span>
                <span className="text-sm font-bold font-mono text-blue-900">{status.tableCounts.invoices || 0}</span>
              </div>
              <div className="p-2 rounded-lg border border-blue-200 bg-blue-50/50 flex flex-col justify-between">
                <span className="text-[11px] text-blue-700 font-medium truncate">pms_suppliers</span>
                <span className="text-sm font-bold font-mono text-blue-900">{status.tableCounts.suppliers || 0}</span>
              </div>
              <div className="p-2 rounded-lg border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between">
                <span className="text-[11px] text-emerald-700 font-medium truncate">pms_purchase_bills</span>
                <span className="text-sm font-bold font-mono text-emerald-900">{status.tableCounts.purchaseBills || 0}</span>
              </div>
              <div className="p-2 rounded-lg border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between">
                <span className="text-[11px] text-emerald-700 font-medium truncate">pms_supplier_payments</span>
                <span className="text-sm font-bold font-mono text-emerald-900">{status.tableCounts.supplierPayments || 0}</span>
              </div>
              <div className="p-2 rounded-lg border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between">
                <span className="text-[11px] text-emerald-700 font-medium truncate">pms_restaurant_orders</span>
                <span className="text-sm font-bold font-mono text-emerald-900">{status.tableCounts.restaurantOrders || 0}</span>
              </div>
              <div className="p-2 rounded-lg border border-purple-200 bg-purple-50/40 flex flex-col justify-between">
                <span className="text-[11px] text-purple-700 font-medium truncate">pms_event_bookings</span>
                <span className="text-sm font-bold font-mono text-purple-900">{status.tableCounts.eventBookings || 0}</span>
              </div>
              <div className="p-2 rounded-lg border border-purple-200 bg-purple-50/40 flex flex-col justify-between">
                <span className="text-[11px] text-purple-700 font-medium truncate">pms_audit_logs</span>
                <span className="text-sm font-bold font-mono text-purple-900">{status.tableCounts.auditLogs || 0}</span>
              </div>
            </div>
          </div>

          {/* Stream Log */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2.5 flex items-center justify-between">
              <span>Live Cloud SQL Change Stream</span>
              <span className="text-[10px] text-gray-400 font-normal">Incremental pipe stream</span>
            </h4>
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {history.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">No recent sync events logged yet.</div>
              ) : (
                history.map((ev) => (
                  <div key={ev.id} className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {ev.action}
                      </span>
                      <span className="font-semibold text-gray-800">{ev.entityType}</span>
                      <span className="text-gray-400 font-mono text-[11px]">{ev.entityId}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-mono">
                      <span>{new Date(ev.syncedAt).toLocaleTimeString()}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                        {ev.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Encrypted socket link (us-west1)</span>
            </div>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="text-gray-500">Overdue threshold:</span>
              <div className="flex items-center gap-1">
                {[5, 10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => cloudSqlSyncService.setOverdueThreshold(mins)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${
                      health.thresholdMinutes === mins
                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-bold transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
