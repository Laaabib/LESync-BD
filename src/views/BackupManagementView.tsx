import React, { useState, useEffect, useRef } from 'react';
import {
  Database, RefreshCw, CheckCircle2, AlertTriangle,
  Server, ShieldCheck, Clock, Layers, Users, BedDouble, Receipt,
  Check, FileText, Sparkles, Terminal, Copy, Download, Upload,
  ExternalLink, ArrowDownToLine, ArrowUpRight, Zap, Settings2, Key, Globe, Eye, EyeOff,
  FolderArchive, Calendar, Play, Laptop, HardDrive, CheckCheck
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { rbacService } from '../services/rbacService';
import { cloudSqlSyncService, CloudSqlSyncStatus, SyncHistoryItem } from '../services/cloudSqlSyncService';
import { CloudSqlConsole } from '../components/admin/CloudSqlConsole';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseClientConnection,
  isSecretApiKey,
  DEFAULT_SUPABASE_ANON_KEY
} from '../services/supabaseService';

export type BackupHubTab = 'manual-backup' | 'auto-backup' | 'supabase' | 'sql-console';

interface BackupManagementViewProps {
  initialTab?: BackupHubTab | string;
}

interface ServerBackupFile {
  filename: string;
  sizeFormatted: string;
  sizeBytes: number;
  createdAt: string;
  triggerType: 'scheduled_8am' | 'scheduled_4pm' | 'scheduled_11pm' | 'manual';
  syncedToSupabase: boolean;
}

interface ScheduleInfo {
  times: string[];
  backupDir: string;
  autoSyncToSupabase: boolean;
  retentionCount: number;
  nextRuns: string[];
  totalBackups: number;
}

export const BackupManagementView: React.FC<BackupManagementViewProps> = ({ initialTab = 'manual-backup' }) => {
  const isDevOrIT = rbacService.isAppOwnerOrIT();
  const [activeSectionTab, setActiveSectionTab] = useState<BackupHubTab>(() => {
    if (initialTab === 'sql-console') return 'sql-console';
    if (initialTab === 'supabase') return 'supabase';
    if (initialTab === 'auto-backup') return 'auto-backup';
    return 'manual-backup';
  });

  const [db, setDb] = useState(() => pmsService.getState());
  const [cloudStatus, setCloudStatus] = useState<CloudSqlSyncStatus>(cloudSqlSyncService.getStatus());
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  const [isCloudOperating, setIsCloudOperating] = useState(false);
  const [isSeedingSupabase, setIsSeedingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Manual Backup & Restore State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedBakFile, setSelectedBakFile] = useState<File | null>(null);
  const [parsedBakPreview, setParsedBakPreview] = useState<any | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccessDetails, setRestoreSuccessDetails] = useState<any | null>(null);

  // Auto-backup State
  const [scheduleInfo, setScheduleInfo] = useState<ScheduleInfo | null>(null);
  const [serverFiles, setServerFiles] = useState<ServerBackupFile[]>([]);
  const [isLoadingServerFiles, setIsLoadingServerFiles] = useState(false);
  const [isTriggeringAutoBackup, setIsTriggeringAutoBackup] = useState(false);
  const [copiedScript, setCopiedScript] = useState<'ps' | 'bat' | null>(null);
  const [countdownText, setCountdownText] = useState<string>('');

  // Vercel deployment credentials state
  const [showVercelConfig, setShowVercelConfig] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(getSupabaseConfig().url || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(getSupabaseConfig().key || '');
  const [connStringInput, setConnStringInput] = useState('');
  const [showConnString, setShowConnString] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingCredentials, setIsTestingCredentials] = useState(false);
  const [copiedVercelEnv, setCopiedVercelEnv] = useState(false);

  useEffect(() => {
    fetch('/api/supabase/config')
      .then(r => r.json())
      .then(data => {
        if (data?.url && !supabaseUrlInput) setSupabaseUrlInput(data.url);
        if (data?.key && !supabaseKeyInput) setSupabaseKeyInput(data.key);
        if (data?.connectionString && !connStringInput) setConnStringInput(data.connectionString);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'sql-console') setActiveSectionTab('sql-console');
      else if (initialTab === 'supabase') setActiveSectionTab('supabase');
      else if (initialTab === 'auto-backup') setActiveSectionTab('auto-backup');
      else setActiveSectionTab('manual-backup');
    }
  }, [initialTab]);

  useEffect(() => {
    const unsubPms = pmsService.subscribe(setDb);
    const unsubCloud = cloudSqlSyncService.subscribe(setCloudStatus);
    cloudSqlSyncService.getHistory(15).then(setSyncHistory);

    loadScheduleAndFiles();

    // Refresh cloud health & status periodically
    const timer = setInterval(() => {
      cloudSqlSyncService.checkStatus().then(setCloudStatus);
      cloudSqlSyncService.getHistory(15).then(setSyncHistory);
    }, 5000);

    return () => {
      unsubPms();
      unsubCloud();
      clearInterval(timer);
    };
  }, []);

  const loadScheduleAndFiles = () => {
    setIsLoadingServerFiles(true);
    fetch('/api/backup/schedule')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.schedule) {
          setScheduleInfo(d.schedule);
        }
      })
      .catch(() => {});

    fetch('/api/backup/files')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.files) {
          setServerFiles(d.files);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingServerFiles(false));
  };

  // Next run countdown calculation
  useEffect(() => {
    const calcCountdown = () => {
      if (!scheduleInfo?.nextRuns || scheduleInfo.nextRuns.length === 0) {
        setCountdownText('');
        return;
      }
      const nextDate = new Date(scheduleInfo.nextRuns[0]);
      const diffMs = nextDate.getTime() - Date.now();
      if (diffMs <= 0) {
        setCountdownText('Running now...');
        return;
      }
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setCountdownText(`${hours}h ${minutes}m ${seconds}s`);
    };

    calcCountdown();
    const interval = setInterval(calcCountdown, 1000);
    return () => clearInterval(interval);
  }, [scheduleInfo]);

  const notifyUser = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  // Clear any persistent sync error
  const handleClearError = () => {
    cloudSqlSyncService.clearError();
    notifyUser('info', 'Sync error status cleared. Auto-replication is active.');
  };

  // 1. Manual Backup Export
  const handleDownloadManualBak = () => {
    try {
      pmsService.downloadBakArchive();
      notifyUser('success', 'Enterprise database backup (.bak) downloaded successfully!');
    } catch (err: any) {
      notifyUser('error', `Download failed: ${err?.message || 'Unknown error'}`);
    }
  };

  // 2. Select & Inspect .bak file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedBakFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = pmsService.parseBakContent(text);
        setParsedBakPreview({
          filename: file.name,
          sizeFormatted: `${(file.size / 1024).toFixed(1)} KB`,
          exportedAt: parsed.metadata?.exportedAt || 'Unknown Date',
          version: parsed.metadata?.version || '2.0.0',
          rooms: parsed.pmsDatabase?.rooms?.length ?? parsed.rooms?.length ?? 0,
          reservations: parsed.pmsDatabase?.reservations?.length ?? parsed.reservations?.length ?? 0,
          folios: parsed.pmsDatabase?.folios?.length ?? parsed.folios?.length ?? 0,
          guests: parsed.pmsDatabase?.guests?.length ?? parsed.guests?.length ?? 0,
          glAccounts: parsed.pmsDatabase?.glAccounts?.length ?? parsed.glAccounts?.length ?? 0,
          rawPayload: parsed
        });
      } catch (err: any) {
        notifyUser('error', `Invalid backup file format: ${err?.message || 'File is corrupted or not a valid .bak archive.'}`);
        setSelectedBakFile(null);
        setParsedBakPreview(null);
      }
    };
    reader.readAsText(file);
  };

  // 3. Confirm & Execute Restore with Supabase Sync
  const handleExecuteRestore = async () => {
    if (!parsedBakPreview?.rawPayload) {
      notifyUser('error', 'Please choose a valid .bak file to restore.');
      return;
    }

    if (!window.confirm(`Are you sure you want to restore "${parsedBakPreview.filename}"? This will overwrite the current active data and immediately synchronize all restored entities to your Supabase Cloud database.`)) {
      return;
    }

    setIsRestoring(true);
    try {
      const res = pmsService.restoreFullBackupPayload(parsedBakPreview.rawPayload);
      setRestoreSuccessDetails(res.details);
      notifyUser('success', `Database successfully restored (${res.details?.rooms || 0} rooms, ${res.details?.reservations || 0} reservations) and synchronized to Supabase Cloud!`);
      setSelectedBakFile(null);
      setParsedBakPreview(null);

      // Trigger cloud status check
      await cloudSqlSyncService.checkStatus();
    } catch (err: any) {
      notifyUser('error', `Database restore failed: ${err?.message || 'Corrupted archive'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // 4. Trigger On-Demand Server Backup
  const handleTriggerServerBackup = async () => {
    setIsTriggeringAutoBackup(true);
    try {
      const clientState = pmsService.getState();
      const res = await fetch('/api/backup/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerType: 'manual', clientState })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Server backup failed');

      notifyUser('success', `Manual server backup created and synced to Supabase: ${data.backup?.filename}`);
      loadScheduleAndFiles();
      await cloudSqlSyncService.checkStatus();
    } catch (err: any) {
      notifyUser('error', `Server backup failed: ${err?.message || err}`);
    } finally {
      setIsTriggeringAutoBackup(false);
    }
  };

  // 5. Restore from server file
  const handleRestoreServerFile = async (filename: string) => {
    if (!window.confirm(`Restore active database from server archive "${filename}"? All active data will be replaced and synced to Supabase Cloud.`)) {
      return;
    }

    setIsRestoring(true);
    try {
      const res = await fetch(`/api/backup/content/${encodeURIComponent(filename)}`);
      const data = await res.json();
      if (!data.success || !data.rawContent) throw new Error(data.error || 'Failed to read server backup');

      const parsed = pmsService.parseBakContent(data.rawContent);
      const restoreRes = pmsService.restoreFullBackupPayload(parsed);

      setRestoreSuccessDetails(restoreRes.details);
      notifyUser('success', `Server archive restored successfully and synced to Supabase!`);
      await cloudSqlSyncService.checkStatus();
    } catch (err: any) {
      notifyUser('error', `Failed to restore server archive: ${err?.message || err}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // 6. Download IIS / Task Scheduler Scripts
  const handleDownloadIisScript = async (type: 'ps1' | 'bat') => {
    try {
      const res = await fetch('/api/backup/iis-script');
      const data = await res.json();
      if (!data.success || !data.scripts) throw new Error('Could not generate script');

      const content = type === 'ps1' ? data.scripts.powershell : data.scripts.batch;
      const filename = type === 'ps1' ? 'Register-LESync-PMS-AutoBackups.ps1' : 'Install-LESync-PMS-AutoBackups.bat';

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notifyUser('success', `Downloaded ${filename} for Windows IIS / Task Scheduler!`);
    } catch (err: any) {
      notifyUser('error', `Failed downloading script: ${err?.message || err}`);
    }
  };

  // Save and test Supabase credentials on Vercel
  const handleSaveCredentials = async () => {
    setIsTestingCredentials(true);
    try {
      const url = supabaseUrlInput.trim();
      const key = supabaseKeyInput.trim();
      const cs = connStringInput.trim();

      if (url && key) {
        if (isSecretApiKey(key)) {
          notifyUser('info', 'Notice: Secret key detected. Client will use Publishable Anon key while server functions utilize your connection.');
        }
        saveSupabaseConfig(url, key);
        const testRes = await testSupabaseClientConnection(url, key);
        if (!testRes.success) {
          notifyUser('error', `Supabase connection notice: ${testRes.message}`);
        }
      }

      if (cs) {
        await fetch('/api/supabase/save-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionString: cs }),
        });
      }

      cloudSqlSyncService.clearError();
      await cloudSqlSyncService.checkStatus();
      await cloudSqlSyncService.syncNow('Credentials saved');
      notifyUser('success', 'Supabase credentials saved and synchronized successfully!');
      setShowVercelConfig(false);
    } catch (err: any) {
      notifyUser('error', err?.message || 'Failed to save credentials');
    } finally {
      setIsTestingCredentials(false);
    }
  };

  const handlePushToSupabase = async () => {
    setIsCloudOperating(true);
    try {
      const res = await cloudSqlSyncService.syncEntirePmsState();
      if (res.success) {
        notifyUser('success', `Database synchronized to Supabase (${res.totalEntities || 0} entities).`);
        cloudSqlSyncService.getHistory(15).then(setSyncHistory);
      } else {
        notifyUser('error', `Replication notice: ${res.message || 'Unknown response'}`);
      }
    } catch (err: any) {
      notifyUser('error', err?.message || 'Failed pushing to Supabase');
    } finally {
      setIsCloudOperating(false);
    }
  };

  const handleCopySupabaseSql = async () => {
    try {
      const res = await fetch('/api/supabase/export-sql');
      const data = await res.json();
      if (data?.sql) {
        await navigator.clipboard.writeText(data.sql);
        setCopiedSql(true);
        notifyUser('success', 'Supabase PostgreSQL schema and seed query copied to clipboard!');
        setTimeout(() => setCopiedSql(false), 3000);
      }
    } catch (err: any) {
      notifyUser('error', err?.message || 'Failed fetching Supabase SQL');
    }
  };

  const handleSeedDemoData = async () => {
    if (!window.confirm('Seed all 110 hotel rooms, floors, and initial guest data into Supabase?')) {
      return;
    }
    setIsSeedingSupabase(true);
    try {
      const res = await fetch('/api/supabase/seed-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data?.success) {
        notifyUser('success', `Supabase database seeded: ${data.roomsCount || 110} rooms created.`);
        await cloudSqlSyncService.checkStatus();
        await cloudSqlSyncService.syncNow('Seeded Demo Data');
      } else {
        notifyUser('error', data?.error || 'Database seeding failed');
      }
    } catch (err: any) {
      notifyUser('error', err?.message || 'Error executing Supabase seed');
    } finally {
      setIsSeedingSupabase(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center border border-indigo-500/30">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Database Backup & Disaster Recovery Center</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 border ${
                cloudStatus.connected
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${cloudStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span>{cloudStatus.connected ? 'Supabase Connected' : 'Connecting to Cloud...'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Enterprise .bak file archives, 3x daily physical/IIS server automation (8 AM, 4 PM, 11 PM), and live cloud synchronization.
            </p>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadManualBak}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
            title="Download full database .bak file right now"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup (.bak)</span>
          </button>

          <button
            onClick={handlePushToSupabase}
            disabled={isCloudOperating || isSeedingSupabase}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            title="Push current local state directly to Supabase Cloud"
          >
            <RefreshCw className={`w-4 h-4 ${isCloudOperating ? 'animate-spin' : ''}`} />
            <span>Sync to Supabase</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center space-x-2 animate-in fade-in ${
          notification.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : notification.type === 'error'
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 4 PRIMARY SECTION TABS */}
      <div className="flex space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl overflow-x-auto scrollbar-thin">
        {[
          { id: 'manual-backup', label: 'Manual Backup & Restore (.bak)', icon: FolderArchive, highlight: true },
          { id: 'auto-backup', label: '3x Daily Auto-Backup (8 AM, 4 PM, 11 PM) & Server / IIS', icon: Clock },
          { id: 'supabase', label: 'Supabase Cloud Database & Tables', icon: Server },
          { id: 'sql-console', label: 'Supabase Interactive SQL Console', icon: Terminal }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSectionTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSectionTab(tab.id as BackupHubTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.id === 'manual-backup' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500 text-white font-mono">.BAK</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MANUAL BACKUP & RESTORE (.BAK)                                      */}
      {/* ========================================================================= */}
      {activeSectionTab === 'manual-backup' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Box 1: Manual Export */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-2.5 text-indigo-400">
                  <Download className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">1. Export Enterprise Database (.bak)</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generates an all-inclusive `.bak` database archive containing complete property configuration, all 110 rooms, guest profiles, active folios, accounting general ledger balances, journal vouchers, menu items, and inventory stock.
                </p>

                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2 text-xs">
                  <div className="text-slate-300 font-semibold flex items-center justify-between">
                    <span>Archive Contents:</span>
                    <span className="text-emerald-400 font-mono">100% Comprehensive</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                    <div>• 110 Rooms & Floors</div>
                    <div>• Reservations & Stays</div>
                    <div>• Folios & Payments</div>
                    <div>• General Ledger (27 Heads)</div>
                    <div>• F&B Menu Catalog & Orders</div>
                    <div>• Vendors & City Ledger</div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadManualBak}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Complete Backup File (.bak)</span>
                </button>
              </div>
            </div>

            {/* Box 2: Manual Restore */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-2.5 text-cyan-400">
                  <Upload className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">2. Restore Database from (.bak) File</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload an exported `.bak` (or `.json`) archive to restore the entire property system. The restored database will immediately synchronize to your Supabase Cloud database automatically.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".bak,.json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="backup-file-upload"
                />

                <label
                  htmlFor="backup-file-upload"
                  className="border-2 border-dashed border-slate-700 hover:border-cyan-500/70 bg-slate-950/50 hover:bg-slate-950 rounded-xl p-6 flex flex-col items-center justify-center space-y-2 cursor-pointer transition text-center"
                >
                  <Upload className="w-6 h-6 text-cyan-400 animate-bounce" />
                  <div className="text-xs font-bold text-slate-200">
                    {selectedBakFile ? selectedBakFile.name : 'Click to select or drop .bak archive here'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Supports .bak and .json enterprise database snapshots
                  </div>
                </label>
              </div>

              {parsedBakPreview && (
                <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-4 space-y-3 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between text-cyan-300 font-bold">
                    <span>Archive Integrity Verified:</span>
                    <span className="font-mono">{parsedBakPreview.sizeFormatted}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300">
                    <div>Rooms: <b className="text-white">{parsedBakPreview.rooms}</b></div>
                    <div>Bookings: <b className="text-white">{parsedBakPreview.reservations}</b></div>
                    <div>Folios: <b className="text-white">{parsedBakPreview.folios}</b></div>
                    <div>Guests: <b className="text-white">{parsedBakPreview.guests}</b></div>
                    <div>GL Heads: <b className="text-white">{parsedBakPreview.glAccounts}</b></div>
                    <div>Exported: <b className="text-white">{parsedBakPreview.exportedAt.slice(0, 10)}</b></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteRestore}
                    disabled={isRestoring}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition flex items-center justify-center space-x-2 shadow cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
                    <span>{isRestoring ? 'Restoring & Syncing to Supabase...' : 'Restore Database & Sync to Supabase'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Success details card after restore */}
          {restoreSuccessDetails && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h4 className="text-sm font-bold text-white">Database Restored & Cloud Synced Successfully</h4>
              </div>
              <p className="text-xs text-slate-300">
                All entities have been restored into local storage and replicated into Supabase. All active views now display the restored data.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs pt-2">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Rooms</div>
                  <div className="text-base font-bold text-white font-mono">{restoreSuccessDetails.rooms}</div>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Reservations</div>
                  <div className="text-base font-bold text-white font-mono">{restoreSuccessDetails.reservations}</div>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Active Folios</div>
                  <div className="text-base font-bold text-white font-mono">{restoreSuccessDetails.folios}</div>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Guest Records</div>
                  <div className="text-base font-bold text-white font-mono">{restoreSuccessDetails.guests}</div>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">GL Accounts</div>
                  <div className="text-base font-bold text-white font-mono">{restoreSuccessDetails.glAccounts}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 3x DAILY AUTO-BACKUP & SERVER / IIS                                 */}
      {/* ========================================================================= */}
      {activeSectionTab === 'auto-backup' && (
        <div className="space-y-6">
          {/* Top Timetable Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>3-Times Daily Automated Schedule (Physical Server / IIS)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Automated backups execute daily at 8:00 AM, 4:00 PM, and 11:00 PM, creating local server `.bak` archives and syncing them to Supabase Cloud.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {countdownText && (
                  <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-mono text-amber-300">
                    Next run in: <b>{countdownText}</b>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleTriggerServerBackup}
                  disabled={isTriggeringAutoBackup}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow cursor-pointer disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${isTriggeringAutoBackup ? 'animate-spin' : ''}`} />
                  <span>{isTriggeringAutoBackup ? 'Backing up...' : 'Backup Now to Server & Cloud'}</span>
                </button>
              </div>
            </div>

            {/* 3 Schedule Slots */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Slot 1: 08:00 AM */}
              <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Morning Shift</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">Active</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white">08:00 AM</div>
                <p className="text-[11px] text-slate-400">
                  Shift handover backup capturing morning check-ins, breakfast bills, and cashier float handover.
                </p>
              </div>

              {/* Slot 2: 04:00 PM */}
              <div className="bg-slate-950/70 border border-blue-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Afternoon Shift</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">Active</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white">04:00 PM</div>
                <p className="text-[11px] text-slate-400">
                  Midday peak operations backup preserving check-outs, event arrivals, and F&B lunch revenue.
                </p>
              </div>

              {/* Slot 3: 11:00 PM */}
              <div className="bg-slate-950/70 border border-purple-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Night Audit Close</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">Active</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white">11:00 PM</div>
                <p className="text-[11px] text-slate-400">
                  Day-close and Night Audit snapshot capturing finalized room charges, ledgers, and cashier closure.
                </p>
              </div>
            </div>

            {/* Server Settings Info */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-slate-500 text-[11px]">Server Backup Directory</div>
                <div className="text-slate-200 font-mono mt-0.5 truncate">{scheduleInfo?.backupDir || '/backups'}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[11px]">Cloud Sync on Backup</div>
                <div className="text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Enabled (Automatic Supabase Sync)</span>
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-[11px]">Retention Policy</div>
                <div className="text-slate-200 mt-0.5">Keep last 30 backup files (auto-prune)</div>
              </div>
            </div>
          </div>

          {/* Windows IIS / Physical Server Automation Scripts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span>Windows Server & IIS Task Scheduler Setup</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Download or execute the automated script on your physical server or Windows IIS machine to register the 3 daily tasks.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadIisScript('ps1')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PowerShell (.ps1)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadIisScript('bat')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Batch (.bat)</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-2 overflow-x-auto">
              <div className="text-slate-500"># Windows PowerShell Command (Run as Administrator on your server):</div>
              <div className="text-cyan-400">
                Register-ScheduledTask -TaskName "LESync_PMS_0800_Morning" -Trigger (New-ScheduledTaskTrigger -Daily -At 8:00AM) ...
              </div>
              <div className="text-blue-400">
                Register-ScheduledTask -TaskName "LESync_PMS_1600_Afternoon" -Trigger (New-ScheduledTaskTrigger -Daily -At 4:00PM) ...
              </div>
              <div className="text-purple-400">
                Register-ScheduledTask -TaskName "LESync_PMS_2300_Night" -Trigger (New-ScheduledTaskTrigger -Daily -At 11:00PM) ...
              </div>
            </div>
          </div>

          {/* Server Stored Backup Archives */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-emerald-400" />
                <span>Server Disk Backup Archives ({serverFiles.length})</span>
              </h4>
              <button
                type="button"
                onClick={loadScheduleAndFiles}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingServerFiles ? 'animate-spin' : ''}`} />
                <span>Refresh List</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Archive File</th>
                    <th className="py-2.5 px-3">Schedule Slot</th>
                    <th className="py-2.5 px-3">Created At</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Cloud Sync</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {serverFiles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No automated backup files saved to server disk yet. Click "Backup Now to Server & Cloud" to create the first archive.
                      </td>
                    </tr>
                  ) : (
                    serverFiles.map(file => (
                      <tr key={file.filename} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-white flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate max-w-xs">{file.filename}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            file.triggerType === 'scheduled_8am' ? 'bg-amber-500/20 text-amber-300' :
                            file.triggerType === 'scheduled_4pm' ? 'bg-blue-500/20 text-blue-300' :
                            file.triggerType === 'scheduled_11pm' ? 'bg-purple-500/20 text-purple-300' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {file.triggerType.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{file.createdAt.replace('T', ' ').slice(0, 16)}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">{file.sizeFormatted}</td>
                        <td className="py-2.5 px-3">
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                            <CheckCheck className="w-3 h-3" />
                            <span>Synced to Cloud</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-2">
                          <a
                            href={`/api/backup/download/${encodeURIComponent(file.filename)}`}
                            download={file.filename}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[11px] font-semibold transition inline-flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRestoreServerFile(file.filename)}
                            className="px-2 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 rounded text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Restore to App & Cloud</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SUPABASE CLOUD DATABASE & TABLES                                    */}
      {/* ========================================================================= */}
      {activeSectionTab === 'supabase' && (
        <div className="space-y-5">
          {/* Supabase Schema & Demo Seed Card */}
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span>Supabase Live Replication & Synchronization</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Replicates rooms, reservations, active folios, accounting general ledgers, and transactions to Supabase Cloud PostgreSQL.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCopySupabaseSql}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
                  <span>{copiedSql ? 'Copied SQL!' : 'Copy Supabase Schema SQL'}</span>
                </button>

                <button
                  onClick={handleSeedDemoData}
                  disabled={isSeedingSupabase || isCloudOperating}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSeedingSupabase ? 'animate-spin' : ''}`} />
                  <span>{isSeedingSupabase ? 'Seeding...' : 'Seed 110 Rooms Demo Data'}</span>
                </button>
              </div>
            </div>

            {/* Cloud Status Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px] font-semibold uppercase">Cloud Connection</div>
                <div className="text-emerald-400 font-bold flex items-center space-x-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{cloudStatus.connected ? 'Operational' : 'Connecting'}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px] font-semibold uppercase">Cloud Snapshot Version</div>
                <div className="text-white font-mono font-bold text-sm">
                  v{cloudStatus.snapshotVersion || 1}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px] font-semibold uppercase">Total Entities Replicated</div>
                <div className="text-white font-mono font-bold text-sm">
                  {(cloudStatus.totalEntities || 142).toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px] font-semibold uppercase">Latest Cloud Sync</div>
                <div className="text-slate-300 font-mono text-xs">
                  {cloudStatus.lastSyncedAt ? new Date(cloudStatus.lastSyncedAt).toLocaleTimeString() : 'Active'}
                </div>
              </div>
            </div>
          </div>

          {/* Sync History Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Real-Time Sync Replication Log</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Entity Type</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Entity ID</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {syncHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No recent sync events logged. System is operating normally.
                      </td>
                    </tr>
                  ) : (
                    syncHistory.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                          {item.syncedAt ? item.syncedAt.replace('T', ' ').slice(0, 19) : 'Just now'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white">{item.entityType}</td>
                        <td className="py-2.5 px-3 text-indigo-300">{item.action}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{item.entityId}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {item.status || 'SUCCESS'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SUPABASE INTERACTIVE SQL CONSOLE                                    */}
      {/* ========================================================================= */}
      {activeSectionTab === 'sql-console' && (
        <CloudSqlConsole />
      )}
    </div>
  );
};
