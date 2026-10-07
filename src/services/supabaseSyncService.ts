import { pmsService } from './pmsService';
import { rbacService } from './rbacService';
import { adminMasterService } from './adminMasterService';
import { authService } from './authService';
import { PmsDatabaseState } from './mockPmsDatabase';
import {
  getSupabaseConfig,
  getSupabaseClient,
  syncSnapshotDirectlyToSupabase,
  loadSnapshotDirectlyFromSupabase,
  testSupabaseClientConnection,
} from './supabaseService';

export type SupabaseHealthState = 'healthy' | 'syncing' | 'failed' | 'overdue';

export interface SupabaseHealthInfo {
  state: SupabaseHealthState;
  label: string;
  badgeText: string;
  detail: string;
  isFailed: boolean;
  isOverdue: boolean;
  isSyncing: boolean;
  isHealthy: boolean;
  minutesAgo: number | null;
  formattedAgo: string;
  thresholdMinutes: number;
  lastSyncedAt: string | null;
  lastFailedAt: string | null;
  error: string | null;
}

export interface SupabaseSyncStatus {
  connected: boolean;
  configured: boolean;
  region: string;
  database: string;
  host: string;
  provider: 'Supabase' | 'PostgreSQL' | 'Local';
  dbVersion?: string;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  lastSyncStatus?: 'idle' | 'success' | 'failed';
  lastAttemptAt?: string | null;
  lastFailedAt?: string | null;
  lastErrorMessage?: string | null;
  snapshotVersion: number;
  totalEntities: number;
  totalEventsSynced: number;
  error: string | null;
  overdueThresholdMinutes?: number;
  tableCounts: {
    rooms: number;
    reservations: number;
    stays: number;
    folios: number;
    payments: number;
    glAccounts?: number;
    journalVouchers?: number;
    eventBookings?: number;
    invoices?: number;
    cityLedger?: number;
    suppliers?: number;
    purchaseBills?: number;
    supplierPayments?: number;
    restaurantOrders?: number;
    auditLogs?: number;
  };
}

export interface SyncHistoryItem {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  payload: any;
  syncedAt: string;
  status: string;
}

// Backward compatibility types
export type CloudSqlHealthState = SupabaseHealthState;
export type CloudSqlHealthInfo = SupabaseHealthInfo;
export type CloudSqlSyncStatus = SupabaseSyncStatus;

type SyncListener = (status: SupabaseSyncStatus) => void;

/**
 * Robust JSON fetcher with error recovery
 */
async function safeJsonFetch<T = any>(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 45000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, {
      ...init,
      signal: init?.signal || controller.signal,
    });
    clearTimeout(timer);

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText || 'Request failed'}`;
      if (isJson) {
        try {
          const errorBody = await res.json();
          errorMessage = errorBody.error || errorBody.message || errorMessage;
        } catch {
          // ignore
        }
      }
      throw new Error(errorMessage);
    }

    if (isJson) {
      return (await res.json()) as T;
    } else {
      const text = await res.text();
      return { success: true, text } as unknown as T;
    }
  } catch (error: any) {
    clearTimeout(timer);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    }
    throw error;
  }
}

class SupabaseSyncService {
  private syncTimer: any = null;
  private listeners: Set<SyncListener> = new Set();
  private pendingChanges = false;
  private isSyncing = false;
  private overdueThresholdMinutes = 15;

  private currentStatus: SupabaseSyncStatus = {
    connected: false,
    configured: false,
    region: 'Supabase Cloud',
    database: 'postgres',
    host: 'supabase.co',
    provider: 'Supabase',
    isSyncing: false,
    lastSyncedAt: null,
    lastSyncStatus: 'idle',
    lastAttemptAt: null,
    lastFailedAt: null,
    lastErrorMessage: null,
    snapshotVersion: 0,
    totalEntities: 0,
    totalEventsSynced: 0,
    error: null,
    overdueThresholdMinutes: 15,
    tableCounts: {
      rooms: 0,
      reservations: 0,
      stays: 0,
      folios: 0,
      payments: 0,
      glAccounts: 0,
      journalVouchers: 0,
      eventBookings: 0,
      invoices: 0,
      cityLedger: 0,
      suppliers: 0,
      purchaseBills: 0,
      supplierPayments: 0,
      restaurantOrders: 0,
      auditLogs: 0,
    },
  };

  constructor() {
    this.restorePersistedState();
    this.initPmsSubscription();
    // Fetch initial status on startup
    if (typeof window !== 'undefined') {
      setTimeout(() => this.checkStatus(), 1200);
      // Auto-poll status periodically
      setInterval(() => this.checkStatus(), 60000);
    }
  }

  private restorePersistedState(): void {
    if (typeof window === 'undefined') return;
    try {
      const savedSync = localStorage.getItem('pms_supabase_last_sync') || localStorage.getItem('pms_cloudsql_last_sync');
      if (savedSync) this.currentStatus.lastSyncedAt = savedSync;

      const savedError = localStorage.getItem('pms_supabase_last_error');
      if (savedError) this.currentStatus.lastErrorMessage = savedError;

      const savedFailedAt = localStorage.getItem('pms_supabase_last_failed_at');
      if (savedFailedAt) this.currentStatus.lastFailedAt = savedFailedAt;

      const savedThreshold = localStorage.getItem('pms_supabase_overdue_threshold');
      if (savedThreshold) {
        const val = Number(savedThreshold);
        if (!isNaN(val) && val > 0) {
          this.overdueThresholdMinutes = val;
          this.currentStatus.overdueThresholdMinutes = val;
        }
      }
    } catch {
      // Ignore
    }
  }

  private initPmsSubscription(): void {
    pmsService.subscribe(() => {
      this.pendingChanges = true;
      this.scheduleDebouncedSync(3000);
    });
    rbacService.subscribe(() => {
      this.pendingChanges = true;
      this.scheduleDebouncedSync(2000);
    });
    adminMasterService.subscribe(() => {
      this.pendingChanges = true;
      this.scheduleDebouncedSync(2000);
    });
  }

  private scheduleDebouncedSync(delayMs = 3000): void {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      if (this.pendingChanges && !this.isSyncing) {
        this.syncEntirePmsState().catch((err) => {
          console.warn('Background Supabase sync notice:', err?.message || err);
        });
      }
    }, delayMs);
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.currentStatus });
      } catch (err) {
        console.error('Error notifying sync listener:', err);
      }
    });
  }

  public getStatus(): SupabaseSyncStatus {
    return { ...this.currentStatus };
  }

  public async checkStatus(): Promise<SupabaseSyncStatus> {
    try {
      // Check both /api/supabase/status and fallback /api/cloudsql/status
      let data: any = null;
      try {
        data = await safeJsonFetch<any>('/api/supabase/status', {}, 10000);
      } catch {
        try {
          data = await safeJsonFetch<any>('/api/cloudsql/status', {}, 10000);
        } catch {}
      }

      if (data && data.connected) {
        const isDbConnected = Boolean(data.connected);
        this.currentStatus = {
          ...this.currentStatus,
          connected: isDbConnected,
          configured: Boolean(data.configured ?? isDbConnected),
          region: data.region || 'Supabase Cloud',
          database: data.database || 'postgres',
          host: data.host || 'aws-0-us-east-1.pooler.supabase.com',
          provider: 'Supabase',
          dbVersion: data.dbVersion || 'PostgreSQL 15 (Supabase)',
          snapshotVersion: data.snapshotVersion || this.currentStatus.snapshotVersion,
          totalEntities: data.totalEntities || this.currentStatus.totalEntities,
          totalEventsSynced: data.totalEventsSynced || this.currentStatus.totalEventsSynced,
          tableCounts: data.tableCounts || this.currentStatus.tableCounts,
          error: isDbConnected ? null : (data.error || null),
        };

        if (data.latestSnapshotTime) {
          this.currentStatus.lastSyncedAt = data.latestSnapshotTime;
          if (typeof window !== 'undefined') {
            localStorage.setItem('pms_supabase_last_sync', data.latestSnapshotTime);
          }
        }
      } else {
        // Direct Supabase Client check (fallback for pure Vercel deployments where backend env vars may differ)
        const clientConfig = getSupabaseConfig();
        if (clientConfig.isConfigured) {
          const directCheck = await testSupabaseClientConnection();
          if (directCheck.success) {
            this.currentStatus = {
              ...this.currentStatus,
              connected: true,
              configured: true,
              provider: 'Supabase',
              host: clientConfig.url.replace(/^https?:\/\//, ''),
              database: 'postgres',
              error: null,
            };
            if (typeof window !== 'undefined') {
              localStorage.removeItem('pms_supabase_last_error');
            }
          } else {
            this.currentStatus.connected = false;
            this.currentStatus.error = directCheck.message;
          }
        } else {
          this.currentStatus.connected = false;
          // Helpful guidance instead of crash
          this.currentStatus.error = 'Supabase credentials not configured in Vercel. Set DATABASE_URL or enter credentials.';
        }
      }
    } catch (err: any) {
      // Fallback check
      const clientConfig = getSupabaseConfig();
      if (clientConfig.isConfigured) {
        const directCheck = await testSupabaseClientConnection();
        if (directCheck.success) {
          this.currentStatus.connected = true;
          this.currentStatus.configured = true;
          this.currentStatus.provider = 'Supabase',
          this.currentStatus.error = null;
        } else {
          this.currentStatus.connected = false;
          this.currentStatus.error = err?.message || 'Supabase unreachable';
        }
      } else {
        this.currentStatus.connected = false;
        this.currentStatus.error = err?.message || 'Supabase unreachable';
      }
    }

    this.notifyListeners();
    return this.currentStatus;
  }

  public async syncEntirePmsState(): Promise<{ success: boolean; totalEntities?: number; message?: string }> {
    if (this.isSyncing) {
      return { success: false, message: 'Sync operation already in progress' };
    }

    this.isSyncing = true;
    this.currentStatus.isSyncing = true;
    this.currentStatus.lastAttemptAt = new Date().toISOString();
    this.notifyListeners();

    try {
      const pmsState = pmsService.getState();
      const rbacUsers = rbacService.getUsers();
      const adminRoles = rbacService.getRoles();
      const adminDepartments = rbacService.getDepartments();
      const adminOutlets = rbacService.getOutlets();
      const adminApprovalRules = rbacService.getApprovalRules();
      const adminReportConfig = rbacService.getReportRoleConfig();
      const adminNavModules = adminMasterService.getNavModules();
      const adminBillingOptions = adminMasterService.getBillingOptions();
      const adminDeptItems = adminMasterService.getDepartmentItems();
      const adminCredentials = authService.getCredentials();

      const statePayload = {
        ...pmsState,
        users: rbacUsers.map(u => ({
          id: u.id,
          name: u.name,
          username: adminCredentials[u.id]?.username || u.username || (u.email ? u.email.split('@')[0] : u.id),
          email: u.email,
          role: u.roleName,
          roleId: u.roleId,
          roleName: u.roleName,
          department: u.department,
          dataScope: u.dataScope,
          outletId: u.outletId,
          customPermissions: u.customPermissions,
          deniedPermissions: u.deniedPermissions,
          avatar: u.avatar
        })),
        adminData: {
          roles: adminRoles,
          departments: adminDepartments,
          outlets: adminOutlets,
          approvalRules: adminApprovalRules,
          reportRoleConfig: adminReportConfig,
          navigationModules: adminNavModules,
          billingOptions: adminBillingOptions,
          departmentItems: adminDeptItems,
          credentialsSummary: Object.entries(adminCredentials).map(([uid, c]) => ({
            userId: uid,
            username: c.username,
            employeeId: c.employeeId,
            email: c.email,
            status: c.status,
            property: c.property,
            outlet: c.outlet
          }))
        }
      };

      let result: any = null;
      let serverSyncWorked = false;

      // 1. Attempt Serverless Backend sync
      try {
        result = await safeJsonFetch<any>('/api/supabase/sync-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(statePayload),
        });
        if (result?.success) serverSyncWorked = true;
      } catch {
        try {
          result = await safeJsonFetch<any>('/api/cloudsql/sync-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(statePayload),
          });
          if (result?.success) serverSyncWorked = true;
        } catch {}
      }

      // 2. If server sync succeeded:
      if (serverSyncWorked && result?.success) {
        const syncTimestamp = result.timestamp || new Date().toISOString();
        this.currentStatus.lastSyncedAt = syncTimestamp;
        this.currentStatus.lastSyncStatus = 'success';
        this.currentStatus.lastErrorMessage = null;
        this.currentStatus.lastFailedAt = null;
        this.currentStatus.error = null;
        this.currentStatus.snapshotVersion = result.version || this.currentStatus.snapshotVersion + 1;
        this.currentStatus.totalEntities = result.totalEntities || 0;
        this.pendingChanges = false;

        if (typeof window !== 'undefined') {
          localStorage.setItem('pms_supabase_last_sync', syncTimestamp);
          localStorage.removeItem('pms_supabase_last_error');
          localStorage.removeItem('pms_supabase_last_failed_at');
        }

        await this.checkStatus();
        return { success: true, totalEntities: result.totalEntities };
      }

      // 3. Fallback: Direct Client-Side Supabase Sync (for Vercel pure frontend uploads)
      const clientConfig = getSupabaseConfig();
      if (clientConfig.isConfigured) {
        const directResult = await syncSnapshotDirectlyToSupabase(statePayload, 'Vercel Browser Client');
        if (directResult.success) {
          const syncTimestamp = new Date().toISOString();
          this.currentStatus.lastSyncedAt = syncTimestamp;
          this.currentStatus.lastSyncStatus = 'success';
          this.currentStatus.lastErrorMessage = null;
          this.currentStatus.lastFailedAt = null;
          this.currentStatus.error = null;
          this.currentStatus.connected = true;
          this.currentStatus.configured = true;
          this.pendingChanges = false;

          if (typeof window !== 'undefined') {
            localStorage.setItem('pms_supabase_last_sync', syncTimestamp);
            localStorage.removeItem('pms_supabase_last_error');
            localStorage.removeItem('pms_supabase_last_failed_at');
          }

          return { success: true, message: 'Synchronized directly to Supabase cloud snapshot.' };
        }
      }

      // 4. If both failed, provide clean guidance
      const failReason = result?.error || 'Database connection is not configured on Vercel. Set POSTGRES_URL in Vercel Environment Variables or enter Supabase credentials.';
      throw new Error(failReason);
    } catch (error: any) {
      const errMsg = error?.message || 'Synchronization failed';
      const failTimestamp = new Date().toISOString();

      this.currentStatus.lastSyncStatus = 'failed';
      this.currentStatus.lastErrorMessage = errMsg;
      this.currentStatus.lastFailedAt = failTimestamp;
      this.currentStatus.error = errMsg;

      if (typeof window !== 'undefined') {
        localStorage.setItem('pms_supabase_last_error', errMsg);
        localStorage.setItem('pms_supabase_last_failed_at', failTimestamp);
      }

      throw error;
    } finally {
      this.isSyncing = false;
      this.currentStatus.isSyncing = false;
      this.notifyListeners();
    }
  }

  private applyRestoredState(state: any): void {
    if (!state) return;
    pmsService.restoreFullBackupPayload({ pmsDatabase: state });

    // Synchronize users & usernames from restored state
    if (Array.isArray(state.users) && state.users.length > 0) {
      state.users.forEach((u: any) => {
        if (u && u.id) {
          // Never resurrect deleted users
          if (rbacService.isUserDeleted(u.id)) {
            return;
          }
          const userUsername = u.username || (u.email ? u.email.split('@')[0] : u.id);
          rbacService.updateUser(u.id, {
            name: u.name,
            username: userUsername,
            roleName: u.role || u.roleName,
            department: u.department,
            email: u.email
          });
          authService.adminUpdateUser(u.id, {
            name: u.name,
            username: userUsername,
            email: u.email,
            employeeId: u.employeeId,
            mobile: u.phone || u.mobile,
            status: u.status || (u.active !== false ? 'Active' : 'Inactive')
          }, { skipCloudSync: true });
        }
      });
    }

    // Synchronize admin master data & credentials summary
    if (state.adminData) {
      const adm = state.adminData;
      if (Array.isArray(adm.credentialsSummary)) {
        adm.credentialsSummary.forEach((cs: any) => {
          if (cs && cs.userId) {
            authService.adminUpdateUser(cs.userId, {
              username: cs.username,
              employeeId: cs.employeeId,
              email: cs.email,
              status: cs.status,
              mobile: cs.mobile
            }, { skipCloudSync: true });
          }
        });
      }
    }
  }

  public async loadLatestFromSupabase(): Promise<{ success: boolean; loaded: boolean; message?: string }> {
    try {
      let data: any = null;
      try {
        data = await safeJsonFetch<any>('/api/supabase/load-latest');
      } catch {
        try {
          data = await safeJsonFetch<any>('/api/cloudsql/load-latest');
        } catch {}
      }

      if (data?.success && data?.exists && (data?.snapshot?.pmsState || data?.snapshot?.state)) {
        const state = (data.snapshot.pmsState || data.snapshot.state) as PmsDatabaseState;
        this.applyRestoredState(state);
        return { success: true, loaded: true, message: `Loaded snapshot v${data.snapshot.version || 1} from Supabase` };
      }

      // Fallback: direct client load
      const directData = await loadSnapshotDirectlyFromSupabase();
      if (directData?.success && (directData?.snapshot?.pmsState || directData?.snapshot?.state)) {
        const directState = (directData.snapshot.pmsState || directData.snapshot.state) as PmsDatabaseState;
        this.applyRestoredState(directState);
        return { success: true, loaded: true, message: `Loaded snapshot directly from Supabase` };
      }

      return { success: true, loaded: false, message: 'No snapshot available in Supabase yet.' };
    } catch (err: any) {
      throw new Error(`Failed to load data from Supabase: ${err?.message || err}`);
    }
  }

  public async hydrateFromSupabase(): Promise<boolean> {
    const config = getSupabaseConfig();
    if (!config.isConfigured) return false;
    try {
      const client = getSupabaseClient();
      if (!client) return false;

      // 1. Fetch latest PMS snapshot state first (contains full users with usernames, adminData, roles, navigation, etc.)
      const { data: snapData, error: sErr } = await client
        .from('pms_snapshots')
        .select('state_payload, version, last_synced_at')
        .eq('snapshot_key', 'current_pms_state')
        .maybeSingle();

      if (!sErr && snapData?.state_payload) {
        this.applyRestoredState(snapData.state_payload);
        if (snapData.last_synced_at) {
          this.currentStatus.lastSyncedAt = snapData.last_synced_at;
          this.currentStatus.snapshotVersion = snapData.version || 1;
        }
      }

      // 2. Fetch individual user accounts from users table in Supabase
      const { data: usersData, error: uErr } = await client.from('users').select('*');
      if (!uErr && Array.isArray(usersData) && usersData.length > 0) {
        usersData.forEach((uRow: any) => {
          if (uRow && uRow.uid) {
            // Strictly check if user was deleted
            if (rbacService.isUserDeleted(uRow.uid)) {
              // Delete from Supabase cloud database to maintain sync
              Promise.resolve(client.from('users').delete().eq('uid', uRow.uid)).catch(() => {});
              return;
            }
            rbacService.updateUser(uRow.uid, {
              name: uRow.name,
              roleName: uRow.role,
              email: uRow.email,
              ...(uRow.username ? { username: uRow.username } : {})
            });
            authService.adminUpdateUser(uRow.uid, {
              name: uRow.name,
              roleName: uRow.role,
              email: uRow.email,
              ...(uRow.username ? { username: uRow.username } : {})
            }, { skipCloudSync: true });
          }
        });
      }

      this.currentStatus.connected = true;
      this.currentStatus.configured = true;
      this.currentStatus.lastSyncStatus = 'success';
      this.notifyListeners();
      return true;
    } catch (err: any) {
      console.warn('Notice hydrating state from Supabase:', err?.message || err);
      return false;
    }
  }

  public clearError(): void {
    this.currentStatus.error = null;
    this.currentStatus.lastErrorMessage = null;
    this.currentStatus.lastFailedAt = null;
    this.currentStatus.lastSyncStatus = 'idle';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pms_supabase_last_error');
      localStorage.removeItem('pms_supabase_last_failed_at');
    }
    this.notifyListeners();
  }

  public async loadLatestState(): Promise<{ success: boolean; loaded: boolean; message?: string }> {
    return this.loadLatestFromSupabase();
  }

  public async loadLatestFromCloudSql(): Promise<boolean> {
    try {
      const res = await this.loadLatestFromSupabase();
      return Boolean(res.success && res.loaded);
    } catch {
      return false;
    }
  }

  public init(): void {
    this.checkStatus().catch(() => {});
    this.hydrateFromSupabase().catch(() => {});
  }

  public async syncNow(reason?: string): Promise<boolean> {
    try {
      const res = await this.syncEntirePmsState();
      return res.success;
    } catch {
      return false;
    }
  }

  public async getHistory(limit = 20): Promise<SyncHistoryItem[]> {
    return this.fetchSyncHistory(limit);
  }

  public async startAutoSync(intervalMs = 1500): Promise<void> {
    await this.checkStatus();
  }

  public setOverdueThreshold(minutes: number): void {
    this.overdueThresholdMinutes = minutes;
    this.currentStatus.overdueThresholdMinutes = minutes;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pms_supabase_overdue_threshold', String(minutes));
    }
    this.notifyListeners();
  }

  public simulateFailure(msg: string): void {
    this.currentStatus.error = msg;
    this.currentStatus.lastErrorMessage = msg;
    this.currentStatus.lastFailedAt = new Date().toISOString();
    this.currentStatus.lastSyncStatus = 'failed';
    this.notifyListeners();
  }

  public simulateOverdue(mins?: number): void {
    const overdueMinutes = mins || (this.overdueThresholdMinutes + 5);
    const past = new Date(Date.now() - overdueMinutes * 60 * 1000).toISOString();
    this.currentStatus.lastSyncedAt = past;
    this.notifyListeners();
  }

  public clearSimulation(): void {
    this.currentStatus.error = null;
    this.currentStatus.lastErrorMessage = null;
    this.currentStatus.lastFailedAt = null;
    this.currentStatus.lastSyncStatus = 'idle';
    this.currentStatus.lastSyncedAt = new Date().toISOString();
    this.notifyListeners();
  }

  public getHealth(): SupabaseHealthInfo {
    return this.getHealthInfo();
  }

  public async fetchSyncHistory(limit = 20): Promise<SyncHistoryItem[]> {
    try {
      let data: any = null;
      try {
        data = await safeJsonFetch<{ history: SyncHistoryItem[] }>(`/api/supabase/sync-history?limit=${limit}`);
      } catch {
        data = await safeJsonFetch<{ history: SyncHistoryItem[] }>(`/api/cloudsql/sync-history?limit=${limit}`);
      }
      return data?.history || [];
    } catch {
      return [];
    }
  }

  public getHealthInfo(): SupabaseHealthInfo {
    const { connected, isSyncing, lastSyncedAt, lastFailedAt, lastErrorMessage, error } = this.currentStatus;

    let minutesAgo: number | null = null;
    let formattedAgo = 'Never';

    if (lastSyncedAt) {
      const syncDate = new Date(lastSyncedAt);
      const now = new Date();
      const diffMs = now.getTime() - syncDate.getTime();
      minutesAgo = Math.max(0, Math.floor(diffMs / (1000 * 60)));

      if (minutesAgo < 1) formattedAgo = 'Just now';
      else if (minutesAgo === 1) formattedAgo = '1 min ago';
      else if (minutesAgo < 60) formattedAgo = `${minutesAgo} mins ago`;
      else {
        const hours = Math.floor(minutesAgo / 60);
        formattedAgo = hours === 1 ? '1 hour ago' : `${hours} hours ago`;
      }
    }

    const isOverdue = minutesAgo !== null && minutesAgo > this.overdueThresholdMinutes;
    const isFailed = Boolean(lastErrorMessage || error);

    let state: SupabaseHealthState = 'healthy';
    let label = 'Synchronized & Active';
    let badgeText = 'Live Supabase Sync';
    let detail = `Last synced ${formattedAgo} (${this.currentStatus.totalEntities} items)`;

    if (isSyncing) {
      state = 'syncing';
      label = 'Replicating to Supabase...';
      badgeText = 'Syncing';
      detail = 'Pushing PMS changes to Supabase tables';
    } else if (isFailed) {
      state = 'failed';
      label = 'Sync Issue Detected';
      badgeText = 'Attention Needed';
      detail = lastErrorMessage || error || 'Connection error';
    } else if (isOverdue) {
      state = 'overdue';
      label = 'Replication Overdue';
      badgeText = 'Overdue';
      detail = `No sync in ${formattedAgo} (Threshold: ${this.overdueThresholdMinutes}m)`;
    } else if (!connected) {
      state = 'failed';
      label = 'Supabase Disconnected';
      badgeText = 'Disconnected';
      detail = 'Configure Supabase credentials in settings to activate live sync';
    }

    return {
      state,
      label,
      badgeText,
      detail,
      isFailed,
      isOverdue,
      isSyncing,
      isHealthy: state === 'healthy',
      minutesAgo,
      formattedAgo,
      thresholdMinutes: this.overdueThresholdMinutes,
      lastSyncedAt,
      lastFailedAt,
      error: lastErrorMessage || error,
    };
  }
}

export const supabaseSyncService = new SupabaseSyncService();
// Backward compatibility alias
export const cloudSqlSyncService = supabaseSyncService;
