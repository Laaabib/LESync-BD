import React, { useState, useEffect, useRef } from 'react';
import {
  Database, Download, Upload, RefreshCw, CheckCircle2, AlertTriangle,
  Server, ShieldCheck, Clock, FileSpreadsheet, HardDrive, ArrowDownToLine,
  ArrowUpFromLine, Layers, Users, BedDouble, Receipt, RotateCcw,
  Check, X, FileText, Sparkles, ShieldAlert, Terminal
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { pmsService } from '../services/pmsService';
import { rbacService } from '../services/rbacService';
import { cloudSqlSyncService, CloudSqlSyncStatus, SyncHistoryItem } from '../services/cloudSqlSyncService';
import { CloudSqlConsole } from '../components/admin/CloudSqlConsole';

interface BackupManagementViewProps {
  initialTab?: 'backup' | 'cloudsql' | 'sql-console';
}

export const BackupManagementView: React.FC<BackupManagementViewProps> = ({ initialTab = 'backup' }) => {
  const isDevOrIT = rbacService.isAppOwnerOrIT();
  const [activeSectionTab, setActiveSectionTab] = useState<'backup' | 'cloudsql' | 'sql-console'>(initialTab);
  const [db, setDb] = useState(pmsService.getState());
  const [cloudStatus, setCloudStatus] = useState<CloudSqlSyncStatus>(cloudSqlSyncService.getStatus());
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  const [isCloudOperating, setIsCloudOperating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveSectionTab(initialTab);
    }
  }, [initialTab]);

  // Restore file state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedPayload, setParsedPayload] = useState<any | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const unsubPms = pmsService.subscribe(setDb);
    const unsubCloud = cloudSqlSyncService.subscribe(setCloudStatus);
    cloudSqlSyncService.getHistory(10).then(setSyncHistory);

    return () => {
      unsubPms();
      unsubCloud();
    };
  }, []);

  const notifyUser = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  // 1. Manual Full Enterprise Backup (.bak)
  const handleDownloadFullBackup = () => {
    try {
      const bakContent = pmsService.exportFullBakContent();
      const payload = pmsService.exportFullBackupPayload();
      const blob = new Blob([bakContent], { type: 'application/octet-stream;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', url);
      downloadAnchor.setAttribute('download', `LESync_PMS_Full_Backup_${timestamp}.bak`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);

      pmsService.logAudit('Manual Backup Created', 'Settings', 'MANUAL_BACKUP', undefined, `Downloaded manual enterprise backup (.bak) with ${payload.metadata.totalRooms} rooms, ${payload.metadata.totalReservations} reservations`);
      notifyUser('success', `Enterprise .bak database backup successfully downloaded (Size: ~${(bakContent.length / 1024).toFixed(1)} KB)`);
    } catch (err: any) {
      notifyUser('error', `Failed to generate backup: ${err?.message || 'Unknown error'}`);
    }
  };

  // 2. Export Excel Spreadsheets
  const handleExportExcel = (type: 'rooms' | 'guests' | 'accounts' | 'audit') => {
    try {
      const wb = XLSX.utils.book_new();
      const dateStr = new Date().toISOString().slice(0, 10);

      if (type === 'rooms') {
        const data = db.rooms.map(r => ({
          'Room Number': r.roomNumber,
          'Category': r.roomTypeName,
          'Floor': r.floor,
          'Wing': r.wing,
          'Base Rate (BDT)': (r as any).baseRate || (r as any).basePrice || 0,
          'Operational Status': r.operationalStatus,
          'Housekeeping Status': r.housekeepingStatus,
          'Keycard Code': r.keyCardCode,
          'Smoking': r.isSmoking ? 'Yes' : 'No',
          'Notes': r.notes || ''
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Rooms Master');
        XLSX.writeFile(wb, `LESync_Rooms_Inventory_${dateStr}.xlsx`);
        notifyUser('success', 'Rooms inventory exported to Excel.');
      } else if (type === 'guests') {
        const data = db.guests.map(g => ({
          'Guest ID': g.id,
          'Full Name': g.fullName,
          'Phone': g.phone,
          'Email': g.email,
          'Nationality': g.nationality,
          'NID / Passport': g.idNumber,
          'VIP Status': g.vipStatus ? 'VIP' : 'Standard',
          'Total Stays': g.totalStays,
          'Total Spent (BDT)': g.totalSpend
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Guest Registry');
        XLSX.writeFile(wb, `LESync_Guest_Registry_${dateStr}.xlsx`);
        notifyUser('success', 'Guest registry exported to Excel.');
      } else if (type === 'accounts') {
        const data = db.glAccounts.map(a => ({
          'Account Code': a.code,
          'Account Name': a.name,
          'Category': a.category,
          'Debit (BDT)': (a as any).debitBalance || 0,
          'Credit (BDT)': (a as any).creditBalance || 0,
          'Net Balance (BDT)': (a as any).currentBalance || a.balance || 0,
          'Department': (a as any).department || 'General'
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Chart of Accounts');
        XLSX.writeFile(wb, `LESync_Chart_of_Accounts_${dateStr}.xlsx`);
        notifyUser('success', 'Chart of accounts exported to Excel.');
      } else if (type === 'audit') {
        const logs = (db.auditLogs || (db as any).auditTrail || []);
        const data = logs.slice(0, 500).map((a: any) => ({
          'Timestamp': a.createdAt || a.timestamp || '',
          'Action': a.action || '',
          'Module': a.entityType || a.module || '',
          'User': a.userName || '',
          'Role': a.userRole || '',
          'Entity ID': a.entityId || '',
          'Details': a.oldValue ? `${a.oldValue} -> ${a.newValue}` : (a.newValue || a.details || '')
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'System Audit Log');
        XLSX.writeFile(wb, `LESync_Audit_Trail_${dateStr}.xlsx`);
        notifyUser('success', 'System audit log exported to Excel.');
      }
    } catch (err: any) {
      notifyUser('error', `Excel export failed: ${err?.message || 'Error generating workbook'}`);
    }
  };

  // 3. File Input Handling for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        let parsed: any;
        try {
          parsed = pmsService.parseBakContent(content);
        } catch {
          parsed = JSON.parse(content);
        }

        // Validation
        const pmsData = parsed.pmsDatabase || parsed;
        if (!pmsData.rooms && !pmsData.reservations && !pmsData.roomTypes) {
          throw new Error('File does not appear to be a valid LESync PMS database backup (.bak).');
        }

        setParsedPayload(parsed);
        notifyUser('info', `Database backup file loaded: "${file.name}" ready for verification and restore.`);
      } catch (err: any) {
        setParsedPayload(null);
        setSelectedFile(null);
        notifyUser('error', `Invalid backup file: ${err?.message || 'Failed to read .bak file'}`);
      }
    };
    reader.readAsText(file);
  };

  // 4. Execute Restore
  const handleExecuteRestore = async () => {
    if (!parsedPayload) return;
    setIsRestoring(true);
    setShowConfirmModal(false);

    try {
      const result = pmsService.restoreFullBackupPayload(parsedPayload);
      
      // Also push restored state to Cloud SQL
      await cloudSqlSyncService.syncNow('Restored from Enterprise .bak Backup');
      const updatedHistory = await cloudSqlSyncService.getHistory(10);
      setSyncHistory(updatedHistory);

      setIsRestoring(false);
      setSelectedFile(null);
      setParsedPayload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      notifyUser('success', `System restored successfully! ${result.details.rooms} rooms, ${result.details.reservations} reservations, ${result.details.folios} folios.`);
    } catch (err: any) {
      setIsRestoring(false);
      notifyUser('error', `Restore failed: ${err?.message || 'Unknown error during restore'}`);
    }
  };

  // 5. Cloud SQL Direct Sync Actions
  const handlePushToCloudSql = async () => {
    setIsCloudOperating(true);
    const success = await cloudSqlSyncService.syncNow('Manual Push from Backup Center');
    setIsCloudOperating(false);
    if (success) {
      notifyUser('success', 'Local database pushed to Cloud SQL (us-west1) successfully.');
      const updatedHistory = await cloudSqlSyncService.getHistory(10);
      setSyncHistory(updatedHistory);
    } else {
      notifyUser('error', 'Cloud SQL push failed. Please verify server connection.');
    }
  };

  const handlePullFromCloudSql = async () => {
    if (!window.confirm('Pulling state from Cloud SQL will overwrite local changes with the latest Cloud SQL snapshot. Proceed?')) {
      return;
    }
    setIsCloudOperating(true);
    const success = await cloudSqlSyncService.loadLatestFromCloudSql();
    setIsCloudOperating(false);
    if (success) {
      notifyUser('success', 'Successfully hydrated database from latest Cloud SQL snapshot.');
      const updatedHistory = await cloudSqlSyncService.getHistory(10);
      setSyncHistory(updatedHistory);
    } else {
      notifyUser('error', 'Could not load snapshot from Cloud SQL.');
    }
  };

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center border border-indigo-500/30">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Enterprise Database Backup & Restore Center</h1>
              {isDevOrIT && (
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                  cloudStatus.connected
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {cloudStatus.connected ? 'Cloud SQL Connected' : 'Local Persistence Mode'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate enterprise .bak database archives with all property data, rooms, folios, accounts, and audit records for server deployment and disaster recovery.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadFullBackup}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-sm cursor-pointer"
            title="Download full database archive (.bak) including all rooms, folios, invoices, and settings"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup (.bak)</span>
          </button>
          {isDevOrIT && (
            <button
              onClick={handlePushToCloudSql}
              disabled={isCloudOperating}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isCloudOperating ? 'animate-spin' : ''}`} />
              <span>Sync to Cloud SQL</span>
            </button>
          )}
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

      {/* Database Health & Entity Inventory Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <BedDouble className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
          <div className="text-lg font-black font-mono text-white">{(db.rooms || []).length}</div>
          <div className="text-[10px] text-slate-400">Total Rooms</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <div className="text-lg font-black font-mono text-white">{(db.reservations || []).length}</div>
          <div className="text-[10px] text-slate-400">Reservations</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <Users className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <div className="text-lg font-black font-mono text-white">{(db.guests || []).length}</div>
          <div className="text-[10px] text-slate-400">Guest Profiles</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <Receipt className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <div className="text-lg font-black font-mono text-white">{(db.folios || []).length}</div>
          <div className="text-[10px] text-slate-400">Guest Folios</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <FileSpreadsheet className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
          <div className="text-lg font-black font-mono text-white">{(db.glAccounts || []).length}</div>
          <div className="text-[10px] text-slate-400">GL Accounts</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <Layers className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <div className="text-lg font-black font-mono text-white">{(db.inventoryItems || []).length}</div>
          <div className="text-[10px] text-slate-400">Inventory Items</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <ShieldCheck className="w-4 h-4 text-teal-400 mx-auto mb-1" />
          <div className="text-lg font-black font-mono text-white">{(db.users || []).length}</div>
          <div className="text-[10px] text-slate-400">Staff Users</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <HardDrive className="w-4 h-4 text-rose-400 mx-auto mb-1" />
          <div className="text-lg font-black font-mono text-white">{(db.auditLogs || (db as any).auditTrail || []).length}</div>
          <div className="text-[10px] text-slate-400">Audit Logs</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 scrollbar-thin">
        {[
          { id: 'backup', label: 'Manual Backup & Restore', icon: Database },
          { id: 'cloudsql', label: 'Cloud SQL Live Replication', icon: Server },
          { id: 'sql-console', label: 'Live SQL Query Console', icon: Terminal, highlight: true }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSectionTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSectionTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{tab.label}</span>
              {tab.highlight && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                  isActive ? 'bg-slate-950 text-amber-300' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  PostgreSQL
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Live SQL Query Console */}
      {activeSectionTab === 'sql-console' && (
        <CloudSqlConsole />
      )}

      {/* TAB 2: Manual Backup & Restore */}
      {activeSectionTab === 'backup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Backup Operations */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
            <ArrowDownToLine className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white">Manual Data Backup & Exports</h2>
              <p className="text-xs text-slate-400">Export database state for offline archiving and safety</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Primary JSON Backup Card */}
            <div className="p-4 bg-slate-950 border border-indigo-500/20 rounded-xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-indigo-300">Complete System Backup (JSON)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Exports complete state: Rooms, Reservations, Housekeeping, Accounts Ledger, RBAC Roles, User Credentials, and Settings.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                  v2.0.0
                </span>
              </div>
              <button
                onClick={handleDownloadFullBackup}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow"
              >
                <Download className="w-4 h-4" />
                <span>Download Full Database Snapshot (.json)</span>
              </button>
            </div>

            {/* Excel Spreadsheets Export */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Individual Excel Spreadsheets</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleExportExcel('rooms')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition flex items-center justify-between"
                >
                  <span className="text-slate-200 font-medium">Rooms Master</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleExportExcel('guests')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition flex items-center justify-between"
                >
                  <span className="text-slate-200 font-medium">Guest Registry</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleExportExcel('accounts')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition flex items-center justify-between"
                >
                  <span className="text-slate-200 font-medium">Chart of Accounts</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleExportExcel('audit')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition flex items-center justify-between"
                >
                  <span className="text-slate-200 font-medium">System Audit Log</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Manual Data Restore */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
            <ArrowUpFromLine className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">Manual Data Restore (.bak)</h2>
              <p className="text-xs text-slate-400">Restore application database from an enterprise .bak backup archive</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* File Upload Box */}
            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl p-6 text-center transition bg-slate-950/60">
              <input
                ref={fileInputRef}
                type="file"
                accept=".bak,.json"
                onChange={handleFileChange}
                className="hidden"
                id="manual-backup-file-input"
              />
              <label
                htmlFor="manual-backup-file-input"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <Upload className="w-8 h-8 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">
                  {selectedFile ? selectedFile.name : 'Click to select or drag & drop backup (.bak, .json) file'}
                </span>
                <span className="text-[11px] text-slate-500">
                  Standard enterprise .bak database backup file containing all property state
                </span>
              </label>
            </div>

            {/* Parsed Payload Summary */}
            {parsedPayload && (
              <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300">File Inspection Passed</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {parsedPayload.metadata?.exportedAt ? new Date(parsedPayload.metadata.exportedAt).toLocaleString() : 'Valid'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-300">
                  <div className="bg-slate-900/80 p-2 rounded-lg text-center">
                    <span className="text-cyan-400 font-bold block">
                      {parsedPayload.metadata?.totalRooms || parsedPayload.pmsDatabase?.rooms?.length || parsedPayload.rooms?.length || 0}
                    </span>
                    Rooms
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg text-center">
                    <span className="text-cyan-400 font-bold block">
                      {parsedPayload.metadata?.totalReservations || parsedPayload.pmsDatabase?.reservations?.length || parsedPayload.reservations?.length || 0}
                    </span>
                    Reservations
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg text-center">
                    <span className="text-cyan-400 font-bold block">
                      {parsedPayload.metadata?.totalFolios || parsedPayload.pmsDatabase?.folios?.length || parsedPayload.folios?.length || 0}
                    </span>
                    Folios
                  </div>
                </div>

                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isRestoring}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow"
                >
                  <Upload className="w-4 h-4" />
                  <span>Restore Selected Database Backup</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* TAB 3: Cloud SQL Synchronization Management */}
      {activeSectionTab === 'cloudsql' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <Server className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">PostgreSQL Cloud SQL Synchronization (us-west1)</h2>
              <p className="text-xs text-slate-400 font-mono">
                Instance: ai-studio-f1e3e6a7 • DB: {cloudStatus.database} • Table sync: Active (1500ms debounce)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePullFromCloudSql}
              disabled={isCloudOperating}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition border border-slate-700 flex items-center space-x-1.5"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-blue-400" />
              <span>Hydrate from Cloud SQL</span>
            </button>
            <button
              onClick={handlePushToCloudSql}
              disabled={isCloudOperating}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCloudOperating ? 'animate-spin' : ''}`} />
              <span>Push State to Cloud</span>
            </button>
          </div>
        </div>

        {/* Sync History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 px-3">Sync Event</th>
                <th className="py-2 px-3">Target</th>
                <th className="py-2 px-3">Records Pushed</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {syncHistory.length > 0 ? (
                syncHistory.slice(0, 5).map(h => {
                  const target = (h as any).targetTable || h.entityType || 'PMS Store';
                  const count = (h as any).recordsCount ?? (h.payload ? (Array.isArray(h.payload) ? h.payload.length : 1) : 1);
                  const time = (h as any).timestamp || h.syncedAt;
                  return (
                    <tr key={h.id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-slate-200 font-sans font-medium">{h.action}</td>
                      <td className="py-2 px-3 text-slate-400">{target}</td>
                      <td className="py-2 px-3 text-emerald-400">{(count || 0).toLocaleString()}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                          {h.status || 'COMPLETED'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500">{time ? new Date(time).toLocaleTimeString() : 'Recent'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">
                    No synchronization events recorded yet. Click "Push State to Cloud" to initialize.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Confirmation Modal for Restore */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/40 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Confirm System Restore</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Restoring from this backup will replace the current in-memory PMS state, update local storage, and push the snapshot to Cloud SQL. Are you sure you want to proceed?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRestore}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow"
              >
                Confirm & Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
