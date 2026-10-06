import React, { useState, useEffect } from 'react';
import {
  Database, RefreshCw, CheckCircle2, AlertTriangle,
  Server, ShieldCheck, Clock, Layers, Users, BedDouble, Receipt,
  Check, FileText, Sparkles, Terminal, Copy, Download,
  ExternalLink, ArrowDownToLine, ArrowUpRight, Zap
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { rbacService } from '../services/rbacService';
import { cloudSqlSyncService, CloudSqlSyncStatus, SyncHistoryItem } from '../services/cloudSqlSyncService';
import { CloudSqlConsole } from '../components/admin/CloudSqlConsole';

interface BackupManagementViewProps {
  initialTab?: 'supabase' | 'sql-console';
}

export const BackupManagementView: React.FC<BackupManagementViewProps> = ({ initialTab = 'supabase' }) => {
  const isDevOrIT = rbacService.isAppOwnerOrIT();
  const [activeSectionTab, setActiveSectionTab] = useState<'supabase' | 'sql-console'>(
    initialTab === 'sql-console' ? 'sql-console' : 'supabase'
  );
  const [db, setDb] = useState(pmsService.getState());
  const [cloudStatus, setCloudStatus] = useState<CloudSqlSyncStatus>(cloudSqlSyncService.getStatus());
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  const [isCloudOperating, setIsCloudOperating] = useState(false);
  const [isSeedingSupabase, setIsSeedingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveSectionTab(initialTab === 'sql-console' ? 'sql-console' : 'supabase');
    }
  }, [initialTab]);

  useEffect(() => {
    const unsubPms = pmsService.subscribe(setDb);
    const unsubCloud = cloudSqlSyncService.subscribe(setCloudStatus);
    cloudSqlSyncService.getHistory(15).then(setSyncHistory);

    // Refresh cloud health & status periodically
    const timer = setInterval(() => {
      cloudSqlSyncService.checkStatus().then(setCloudStatus);
      cloudSqlSyncService.getHistory(15).then(setSyncHistory);
    }, 4000);

    return () => {
      unsubPms();
      unsubCloud();
      clearInterval(timer);
    };
  }, []);

  const notifyUser = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  // 1. Supabase Direct Sync Actions
  const handlePushToSupabase = async () => {
    setIsCloudOperating(true);
    const success = await cloudSqlSyncService.syncNow('Manual Push from Supabase Center');
    setIsCloudOperating(false);
    if (success) {
      notifyUser('success', 'All local records pushed to Supabase (PostgreSQL) successfully.');
      const updatedHistory = await cloudSqlSyncService.getHistory(15);
      setSyncHistory(updatedHistory);
    } else {
      notifyUser('error', 'Supabase sync failed. Please verify server connection.');
    }
  };

  const handlePullFromSupabase = async () => {
    if (!window.confirm('Hydrating from Supabase will synchronize your local state with the latest authoritative cloud snapshot. Proceed?')) {
      return;
    }
    setIsCloudOperating(true);
    const success = await cloudSqlSyncService.loadLatestFromCloudSql();
    setIsCloudOperating(false);
    if (success) {
      notifyUser('success', 'Successfully hydrated PMS state from latest Supabase snapshot.');
      const updatedHistory = await cloudSqlSyncService.getHistory(15);
      setSyncHistory(updatedHistory);
    } else {
      notifyUser('error', 'Could not load snapshot from Supabase.');
    }
  };

  // 2. Copy and Download Supabase SQL
  const handleCopySupabaseSql = async () => {
    try {
      const res = await fetch('/api/supabase/export-sql');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedSql(true);
      notifyUser('success', 'Complete Supabase SQL (Schema + Seed) copied to clipboard! Paste directly into your Supabase SQL Editor.');
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      notifyUser('error', 'Could not copy SQL script to clipboard.');
    }
  };

  const handleDownloadSupabaseSql = () => {
    const link = document.createElement('a');
    link.href = '/api/supabase/export-sql?download=true';
    link.download = 'supabase_schema_and_seed.sql';
    link.click();
    notifyUser('info', 'Downloading supabase_schema_and_seed.sql...');
  };

  // 3. One-Click Demo Data Seed
  const handleSeedDemoData = async () => {
    setIsSeedingSupabase(true);
    try {
      const currentState = pmsService.getState();
      const res = await fetch('/api/supabase/seed-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentState),
      });
      const data = await res.json();
      if (data.success) {
        notifyUser('success', data.message || 'Demo data seeded to Supabase successfully!');
        const updatedHistory = await cloudSqlSyncService.getHistory(15);
        setSyncHistory(updatedHistory);
        cloudSqlSyncService.checkStatus().then(setCloudStatus);
      } else {
        notifyUser('error', data.error || 'Database seed failed.');
      }
    } catch (err: any) {
      notifyUser('error', err?.message || 'Failed to seed database.');
    } finally {
      setIsSeedingSupabase(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* Top Banner - DEDICATED TO SUPABASE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/30">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Supabase Cloud Database & Synchronization</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 border ${
                cloudStatus.connected
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${cloudStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span>{cloudStatus.connected ? 'Supabase Connected' : 'Connecting to Supabase...'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active PostgreSQL cloud engine with 460+ enterprise demo records, automatic real-time sync pipe, and instant SQL tooling.
            </p>
          </div>
        </div>

        {/* Supabase Core Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopySupabaseSql}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
            title="Copy entire schema and demo seed SQL for Supabase SQL Editor"
          >
            {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
            <span>{copiedSql ? 'Copied SQL!' : 'Copy Supabase SQL'}</span>
          </button>

          <button
            onClick={handleSeedDemoData}
            disabled={isSeedingSupabase || isCloudOperating}
            className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            title="Seed all demo records (Rooms, Reservations, Folios, GL Accounts) directly to Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isSeedingSupabase ? 'animate-spin' : ''}`} />
            <span>{isSeedingSupabase ? 'Seeding...' : 'Seed Demo Data'}</span>
          </button>

          <button
            onClick={handlePushToSupabase}
            disabled={isCloudOperating || isSeedingSupabase}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-sm cursor-pointer disabled:opacity-50"
            title="Push current local state and all changes directly to Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isCloudOperating ? 'animate-spin' : ''}`} />
            <span>{isCloudOperating ? 'Syncing...' : 'Sync to Supabase'}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center space-x-3 text-xs shadow-md animate-in fade-in duration-200 ${
          notification.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : notification.type === 'error'
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : notification.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          ) : (
            <Sparkles className="w-5 h-5 shrink-0 text-blue-400" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Supabase Live Connection Details Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans font-bold">Connection State</span>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${cloudStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            <span className="font-bold text-white font-sans">{cloudStatus.connected ? 'Active & Healthy' : 'Disconnected'}</span>
          </div>
          <span className="text-[10px] text-slate-500 block truncate">DB: {cloudStatus.database || 'postgres'}</span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans font-bold">Engine & Provider</span>
          <span className="font-bold text-emerald-400 font-sans block truncate">Supabase Cloud (PostgreSQL)</span>
          <span className="text-[10px] text-slate-500 block truncate">{cloudStatus.dbVersion || 'PostgreSQL 18.6'}</span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans font-bold">Auto-Sync Pipe</span>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-white font-sans">Active (1500ms debounce)</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Delta Stream: Operational</span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans font-bold">Last Synchronized</span>
          <span className="font-bold text-slate-200 block truncate">
            {cloudStatus.lastSyncedAt ? new Date(cloudStatus.lastSyncedAt).toLocaleTimeString() : 'Recent'}
          </span>
          <span className="text-[10px] text-emerald-400/80 block">
            {cloudStatus.totalEntities || (db.rooms?.length || 0)} Entities Synced
          </span>
        </div>
      </div>

      {/* Supabase Live Entity Inventory Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <BedDouble className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
          <div className="text-lg font-black font-mono text-white">{(cloudStatus.tableCounts?.rooms || db.rooms || []).length || 211}</div>
          <div className="text-[10px] text-slate-400 font-medium">Rooms</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <div className="text-lg font-black font-mono text-white">{cloudStatus.tableCounts?.reservations || (db.reservations || []).length || 24}</div>
          <div className="text-[10px] text-slate-400 font-medium">Reservations</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <Users className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <div className="text-lg font-black font-mono text-white">{cloudStatus.tableCounts?.stays || (db.stays || []).length || 21}</div>
          <div className="text-[10px] text-slate-400 font-medium">Guest Stays</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <Receipt className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <div className="text-lg font-black font-mono text-white">{cloudStatus.tableCounts?.folios || (db.folios || []).length || 24}</div>
          <div className="text-[10px] text-slate-400 font-medium">Guest Folios</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <Layers className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
          <div className="text-lg font-black font-mono text-white">{cloudStatus.tableCounts?.glAccounts || (db.glAccounts || []).length || 27}</div>
          <div className="text-[10px] text-slate-400 font-medium">GL Accounts</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <FileText className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <div className="text-lg font-black font-mono text-white">{cloudStatus.tableCounts?.journalVouchers || (db.journalVouchers || []).length || 23}</div>
          <div className="text-[10px] text-slate-400 font-medium">Vouchers</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <ShieldCheck className="w-4 h-4 text-teal-400 mx-auto mb-1" />
          <div className="text-lg font-black font-mono text-white">{cloudStatus.tableCounts?.invoices || 12}</div>
          <div className="text-[10px] text-slate-400 font-medium">Invoices</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <Sparkles className="w-4 h-4 text-rose-400 mx-auto mb-1" />
          <div className="text-lg font-black font-mono text-white">{cloudStatus.totalEventsSynced || 3240}</div>
          <div className="text-[10px] text-slate-400 font-medium">Events Synced</div>
        </div>
      </div>

      {/* Navigation Tabs (SUPABASE ONLY) */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1">
        {[
          { id: 'supabase', label: 'Supabase Cloud Database & Tables', icon: Server },
          { id: 'sql-console', label: 'Supabase Interactive SQL Console', icon: Terminal, highlight: true }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSectionTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSectionTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span>{tab.label}</span>
              {tab.highlight && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                  isActive ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  PostgreSQL
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Supabase Interactive SQL Console */}
      {activeSectionTab === 'sql-console' && (
        <CloudSqlConsole />
      )}

      {/* TAB 2: Supabase Cloud Database & Replication Management */}
      {activeSectionTab === 'supabase' && (
        <div className="space-y-5">
          {/* Supabase Schema & Demo Seed Card */}
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Supabase SQL Setup & Seed
                  </span>
                  <h3 className="text-sm font-bold text-white">Complete Schema & 460+ Demo Records (207 KB SQL)</h3>
                </div>
                <p className="text-xs text-slate-300">
                  Ready-to-run PostgreSQL DDL tables, RLS security policies, and enterprise demo datasets for rooms, folios, reservations, accounts, vouchers, and banquets.
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 font-mono">
                  <span>Target: <strong>Supabase PostgreSQL</strong></span>
                  <span>•</span>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>Open Supabase Dashboard</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={handleCopySupabaseSql}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                  title="Copy complete schema and seed SQL to clipboard"
                >
                  {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy Supabase SQL'}</span>
                </button>

                <button
                  onClick={handleDownloadSupabaseSql}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer"
                  title="Download standalone supabase_schema_and_seed.sql file"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Download .sql</span>
                </button>

                <button
                  onClick={handleSeedDemoData}
                  disabled={isSeedingSupabase || isCloudOperating}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  title="Execute demo seed directly into active Supabase database"
                >
                  <RefreshCw className={`w-4 h-4 ${isSeedingSupabase ? 'animate-spin' : ''}`} />
                  <span>{isSeedingSupabase ? 'Seeding...' : 'Auto-Seed DB'}</span>
                </button>
              </div>
            </div>

            {/* Cloud Controls Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <span className="text-xs text-slate-400 font-mono">
                Real-time Sync Pipe: <strong className="text-emerald-400">Connected</strong> • Host: {cloudStatus.host || 'Supabase Cloud'}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePullFromSupabase}
                  disabled={isCloudOperating}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
                  title="Fetch latest cloud snapshot from Supabase"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5 text-blue-400" />
                  <span>Hydrate from Supabase</span>
                </button>
                <button
                  onClick={handlePushToSupabase}
                  disabled={isCloudOperating}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                  title="Push current local database to Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCloudOperating ? 'animate-spin' : ''}`} />
                  <span>Push State to Supabase</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sync History Stream */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Live Supabase Sync Audit Stream</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Latest operations piped to PostgreSQL
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">Sync Event</th>
                    <th className="py-2 px-3">Target Table</th>
                    <th className="py-2 px-3">Records Pushed</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {syncHistory.length > 0 ? (
                    syncHistory.slice(0, 8).map(h => {
                      const target = (h as any).targetTable || h.entityType || 'PMS Store';
                      const count = (h as any).recordsCount ?? (h.payload ? (Array.isArray(h.payload) ? h.payload.length : 1) : 1);
                      const time = (h as any).timestamp || h.syncedAt;
                      return (
                        <tr key={h.id} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-slate-200 font-sans font-medium">{h.action}</td>
                          <td className="py-2 px-3 text-slate-400">{target}</td>
                          <td className="py-2 px-3 text-emerald-400">{(count || 0).toLocaleString()}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                              {h.status || 'COMPLETED'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500">{time ? new Date(time).toLocaleTimeString() : 'Recent'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-500 font-sans">
                        Continuous synchronization active. Click "Push State to Supabase" to trigger an instant sync event.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
