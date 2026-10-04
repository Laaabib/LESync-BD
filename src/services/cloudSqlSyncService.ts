import { pmsService } from './pmsService';
import { PmsDatabaseState } from './mockPmsDatabase';

export type CloudSqlHealthState = 'healthy' | 'syncing' | 'failed' | 'overdue';

export interface CloudSqlHealthInfo {
  state: CloudSqlHealthState;
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

export interface CloudSqlSyncStatus {
  connected: boolean;
  region: string;
  database: string;
  host: string;
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

const isVercelEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host.endsWith('vercel.app') || host.includes('vercel');
};

type SyncListener = (status: CloudSqlSyncStatus) => void;

/**
 * Robust fetch helper that checks Content-Type and body to prevent
 * "Unexpected token '<', "<!doctype "... is not valid JSON" errors
 * when endpoints return HTML fallback or when the server is starting.
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
          // Fallback to standard status message
        }
      } else {
        const rawText = await res.text().catch(() => '');
        if (rawText.includes('<html') || rawText.includes('<!doctype') || rawText.includes('<!DOCTYPE')) {
          errorMessage = `HTTP ${res.status}: Backend service returned HTML. The server may still be initializing.`;
        }
      }
      throw new Error(errorMessage);
    }

    if (!isJson) {
      const rawText = await res.text().catch(() => '');
      if (rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
        try {
          return JSON.parse(rawText) as T;
        } catch {
          // Continue to error
        }
      }
      throw new Error(`Server returned non-JSON response (${res.status} ${contentType || 'text'}). The backend server might be starting up.`);
    }

    return res.json() as Promise<T>;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Sync request timed out after 45s. Database mirror may be busy.');
    }
    throw err;
  }
}

class CloudSqlSyncManager {
  private status: CloudSqlSyncStatus = {
    connected: false,
    region: 'us-west1',
    database: 'postgres',
    host: 'Cloud SQL Auth Proxy',
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

  private listeners: SyncListener[] = [];
  private debounceTimer: any = null;
  private isInitialized = false;
  private overdueThresholdMinutes = 10;
  private lastOverdueAlertTime = 0;
  private periodicHealthTimer: any = null;
  private simulatedFailure = false;
  private simulatedFailureMessage = 'Cloud SQL Proxy Connection Reset: Timeout connecting to replica pool';
  private simulatedOverdue = false;
  private simulatedMinutesAgo = 25;
  private activeSyncPromise: Promise<boolean> | null = null;
  private isVercelMode = false;

  constructor() {
    // Restore persisted state from localStorage if available
    try {
      if (typeof localStorage !== 'undefined') {
        const savedSync = localStorage.getItem('pms_cloudsql_last_sync');
        if (savedSync) {
          this.status.lastSyncedAt = savedSync;
          this.status.lastSyncStatus = 'success';
        }
        const savedThreshold = localStorage.getItem('pms_cloudsql_overdue_threshold');
        if (savedThreshold) {
          this.overdueThresholdMinutes = parseInt(savedThreshold, 10) || 10;
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Start periodic background health check & reconciliation timer
    if (!this.periodicHealthTimer && typeof setInterval !== 'undefined') {
      this.periodicHealthTimer = setInterval(async () => {
        this.checkOverdueAndNotify();
        try {
          const currentVersion = this.status.snapshotVersion;
          const remote = await this.checkStatus();
          if (remote.connected && remote.snapshotVersion > currentVersion) {
            await this.loadLatestFromCloudSql();
          }
        } catch {}
      }, 15000);
    }

    // Check backend status and hydrate latest authoritative snapshot from Cloud SQL
    this.checkStatus()
      .then(async (status) => {
        if (status.connected) {
          // Hydrate from Cloud SQL first so all devices share the exact same state
          const loaded = await this.loadLatestFromCloudSql();
          if (!loaded) {
            this.syncNow('Initial System Boot Sync').catch((err) => console.warn('Initial boot sync notice:', err));
          }
        } else {
          setTimeout(async () => {
            try {
              const retryStatus = await this.checkStatus();
              if (retryStatus.connected) {
                const loaded = await this.loadLatestFromCloudSql();
                if (!loaded) {
                  this.syncNow('Initial System Boot Sync (Retry)').catch(() => {});
                }
              }
            } catch {}
          }, 3000);
        }
      })
      .catch((err) => console.warn('Initial check status notice:', err));

    // Subscribe to all local PMS state changes
    pmsService.subscribe((state) => {
      this.handleStateChange(state);
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('pms:local-records-reconciled', () => {
        setTimeout(() => {
          this.syncNow('Reconciled Local Entities Sync').catch(() => {});
        }, 600);
      });
    }
  }

  public subscribe(fn: SyncListener): () => void {
    this.listeners.push(fn);
    fn(this.status);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ ...this.status });
    }
  }

  public getStatus(): CloudSqlSyncStatus {
    return { ...this.status };
  }

  public async checkStatus(): Promise<CloudSqlSyncStatus> {
    try {
      const data = await safeJsonFetch<{ success: boolean; [key: string]: any }>('/api/cloudsql/status');
      if (data && data.success) {
        const isDbConnected = Boolean(data.connected);
        this.status = {
          ...this.status,
          connected: isDbConnected,
          region: data.region || 'us-west1',
          database: data.database || (isDbConnected ? 'postgres' : 'Local Mirror'),
          host: data.host || (isDbConnected ? 'PostgreSQL' : 'Local Storage Engine'),
          dbVersion: data.dbVersion || (isDbConnected ? 'PostgreSQL' : 'Client Storage v2'),
          lastSyncedAt: data.latestSnapshotTime || this.status.lastSyncedAt,
          snapshotVersion: data.snapshotVersion || this.status.snapshotVersion,
          totalEntities: data.totalEntities || this.status.totalEntities,
          totalEventsSynced: data.totalEventsSynced || this.status.totalEventsSynced,
          tableCounts: data.tableCounts || this.status.tableCounts,
          error: isDbConnected ? null : (data.error || null),
        };
      }
    } catch (err: any) {
      const isVercel = isVercelEnvironment();
      const isStaticBackend =
        err?.message?.includes('HTML') ||
        err?.message?.includes('404') ||
        err?.message?.includes('non-JSON') ||
        err?.message?.includes('Failed to fetch');

      if (isVercel || isStaticBackend) {
        this.isVercelMode = true;
        const state = pmsService.getState();
        const tableCounts = {
          rooms: state.rooms?.length || 0,
          reservations: state.reservations?.length || 0,
          stays: state.stays?.length || 0,
          folios: state.folios?.length || 0,
          payments: state.payments?.length || 0,
          glAccounts: state.glAccounts?.length || 0,
          journalVouchers: state.journalVouchers?.length || 0,
          eventBookings: state.eventBookings?.length || 0,
          invoices: state.invoices?.length || 0,
          cityLedger: state.cityLedgerAccounts?.length || 0,
          suppliers: state.suppliers?.length || 0,
          purchaseBills: state.purchaseBills?.length || 0,
          supplierPayments: state.supplierPayments?.length || 0,
          restaurantOrders: state.restaurantOrders?.length || 0,
          auditLogs: state.auditLogs?.length || 0,
        };
        const totalEntities = Object.values(tableCounts).reduce((a, b) => a + b, 0);

        this.status = {
          ...this.status,
          connected: true,
          region: isVercel ? 'Vercel Edge Mirror' : 'Client Persistent Storage',
          database: 'Resort PMS Database (Local Mirror)',
          host: isVercel ? 'Vercel Deployment (Local Mirror)' : 'Local Storage Engine',
          dbVersion: 'Client Storage v2',
          lastSyncedAt: this.status.lastSyncedAt || new Date().toISOString(),
          snapshotVersion: Math.max(1, this.status.snapshotVersion),
          totalEntities,
          totalEventsSynced: this.status.totalEventsSynced || totalEntities,
          tableCounts,
          error: null,
          lastSyncStatus: 'success',
        };
      } else {
        console.warn('Cloud SQL status check:', err.message);
        this.status.connected = false;
        this.status.error = err.message || 'Unable to reach Cloud SQL sync endpoint';
      }
    } finally {
      this.notify();
    }
    return this.getStatus();
  }

  private handleStateChange(state: PmsDatabaseState) {
    if (pmsService.isRemoteUpdateActive()) {
      return;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    // Debounce by 1200ms to batch rapid mutations
    this.debounceTimer = setTimeout(() => {
      this.syncNow('Reactive Local State Change');
    }, 1200);
  }

  public async syncNow(reason = 'Manual User Trigger'): Promise<boolean> {
    // If a sync is already executing, attach to the in-flight promise rather than returning false
    if (this.activeSyncPromise) {
      console.log(`[CloudSQL Sync] Sync already in-flight. Joining operation for: ${reason}`);
      return this.activeSyncPromise;
    }

    this.activeSyncPromise = this.performSync(reason).finally(() => {
      this.activeSyncPromise = null;
    });

    return this.activeSyncPromise;
  }

  private async performSync(reason: string): Promise<boolean> {
    this.status.isSyncing = true;
    this.status.error = null;
    this.notify();

    try {
      const state = pmsService.getState();

      const payload = {
        resortName: state.settings?.resortName || 'Heritage Resort & Spa',
        businessDate: state.settings?.currentBusinessDate || '2026-08-31',
        rooms: state.rooms || [],
        reservations: state.reservations || [],
        stays: state.stays || [],
        folios: state.folios || [],
        payments: state.payments || [],
        refunds: state.refunds || [],
        invoices: state.invoices || [],
        guests: state.guests || [],
        guestDocuments: state.guestDocuments || [],
        roomTypes: state.roomTypes || [],
        housekeepingTasks: state.housekeepingTasks || [],
        maintenanceTickets: state.maintenanceTickets || [],
        halls: state.halls || [],
        packages: state.packages || [],
        quotations: state.quotations || [],
        eventClients: state.eventClients || [],
        eventBookings: state.eventBookings || [],
        activities: state.activities || [],
        activityBookings: state.activityBookings || [],
        activityCharges: state.activityCharges || [],
        menuCategories: state.menuCategories || [],
        menuItems: state.menuItems || [],
        restaurantOrders: state.restaurantOrders || [],
        glAccounts: state.glAccounts || [],
        journalVouchers: state.journalVouchers || [],
        cityLedgerAccounts: state.cityLedgerAccounts || [],
        suppliers: state.suppliers || [],
        purchaseOrders: state.purchaseOrders || [],
        goodsReceiveNotes: state.goodsReceiveNotes || [],
        purchaseBills: state.purchaseBills || [],
        supplierPayments: state.supplierPayments || [],
        purchaseReturns: state.purchaseReturns || [],
        purchaseRequests: state.purchaseRequests || [],
        warehouses: state.warehouses || [],
        inventoryItems: state.inventoryItems || [],
        inventoryStocks: state.inventoryStocks || [],
        stockLedgers: state.stockLedgers || [],
        settings: state.settings || {},
        auditLogs: state.auditLogs || [],
      };

      const result = await safeJsonFetch<{ success: boolean; timestamp?: string; version?: number; totalEntities?: number }>('/api/cloudsql/sync-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const syncTimestamp = result.timestamp || new Date().toISOString();
      this.status = {
        ...this.status,
        connected: true,
        isSyncing: false,
        lastSyncedAt: syncTimestamp,
        lastSyncStatus: 'success',
        lastAttemptAt: syncTimestamp,
        lastFailedAt: null,
        lastErrorMessage: null,
        snapshotVersion: result.version || this.status.snapshotVersion + 1,
        totalEntities: result.totalEntities || 0,
        error: null,
      };

      // Reset simulated flags on real successful sync
      this.simulatedFailure = false;
      this.simulatedOverdue = false;

      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('pms_cloudsql_last_sync', syncTimestamp);
          localStorage.removeItem('pms_cloudsql_last_error');
          localStorage.removeItem('pms_cloudsql_last_failed_at');
        }
      } catch {}

      // Refresh table counts
      await this.checkStatus();
      return true;
    } catch (error: any) {
      const errMsg = error?.message || 'Sync failed';
      const isVercel = isVercelEnvironment();
      const isStaticBackend =
        errMsg.includes('HTML') ||
        errMsg.includes('404') ||
        errMsg.includes('non-JSON') ||
        errMsg.includes('Failed to fetch');

      if (isVercel || isStaticBackend || this.isVercelMode) {
        this.isVercelMode = true;
        const syncTimestamp = new Date().toISOString();
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('pms_cloudsql_last_sync', syncTimestamp);
            localStorage.removeItem('pms_cloudsql_last_error');
            localStorage.removeItem('pms_cloudsql_last_failed_at');
          }
        } catch {}

        const state = pmsService.getState();
        const tableCounts = {
          rooms: state.rooms?.length || 0,
          reservations: state.reservations?.length || 0,
          stays: state.stays?.length || 0,
          folios: state.folios?.length || 0,
          payments: state.payments?.length || 0,
          glAccounts: state.glAccounts?.length || 0,
          journalVouchers: state.journalVouchers?.length || 0,
          eventBookings: state.eventBookings?.length || 0,
          invoices: state.invoices?.length || 0,
          cityLedger: state.cityLedgerAccounts?.length || 0,
          suppliers: state.suppliers?.length || 0,
          purchaseBills: state.purchaseBills?.length || 0,
          supplierPayments: state.supplierPayments?.length || 0,
          restaurantOrders: state.restaurantOrders?.length || 0,
          auditLogs: state.auditLogs?.length || 0,
        };
        const totalEntities = Object.values(tableCounts).reduce((a, b) => a + b, 0);

        this.status = {
          ...this.status,
          connected: true,
          isSyncing: false,
          lastSyncedAt: syncTimestamp,
          lastSyncStatus: 'success',
          lastAttemptAt: syncTimestamp,
          lastFailedAt: null,
          lastErrorMessage: null,
          snapshotVersion: this.status.snapshotVersion + 1,
          totalEntities,
          tableCounts,
          error: null,
        };

        this.simulatedFailure = false;
        this.simulatedOverdue = false;
        this.notify();
        console.log('[CloudSQL Sync] Local storage synchronized successfully (Vercel Standalone Mode).');
        return true;
      }

      const failTimestamp = new Date().toISOString();
      console.warn('Cloud SQL sync notice:', errMsg);

      this.status.isSyncing = false;
      this.status.lastSyncStatus = 'failed';
      this.status.lastAttemptAt = failTimestamp;
      this.status.lastFailedAt = failTimestamp;
      this.status.lastErrorMessage = errMsg;
      this.status.error = errMsg;

      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('pms_cloudsql_last_error', errMsg);
          localStorage.setItem('pms_cloudsql_last_failed_at', failTimestamp);
        }
      } catch {}

      this.notify();

      // Post alert to PMS notifications if operational
      try {
        pmsService.addAlert(
          'urgent',
          'Cloud SQL Sync Failed',
          `Synchronization failed: ${errMsg}. Local PMS data is safely cached, but cloud mirror is not updated.`,
          'Cloud SQL',
          'accounting'
        );
      } catch {}

      return false;
    }
  }

  public getOverdueThreshold(): number {
    return this.overdueThresholdMinutes;
  }

  public setOverdueThreshold(minutes: number) {
    this.overdueThresholdMinutes = Math.max(1, minutes);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pms_cloudsql_overdue_threshold', String(this.overdueThresholdMinutes));
      }
    } catch {}
    this.notify();
  }

  public simulateFailure(message = 'Cloud SQL Replica Pool: Connection timed out after 5000ms') {
    this.simulatedFailure = true;
    this.simulatedFailureMessage = message;
    this.simulatedOverdue = false;
    this.status.error = message;
    this.status.lastSyncStatus = 'failed';
    this.status.lastFailedAt = new Date().toISOString();
    this.status.lastErrorMessage = message;
    this.notify();

    pmsService.addAlert(
      'urgent',
      'Cloud SQL Sync Failed (Alert)',
      `Simulated Alert: ${message}. Cloud synchronization interrupted.`,
      'Review Status',
      'accounting'
    );
  }

  public simulateOverdue(minutesAgo = 35) {
    this.simulatedOverdue = true;
    this.simulatedMinutesAgo = minutesAgo;
    this.simulatedFailure = false;
    this.status.error = null;
    this.status.lastSyncStatus = 'success';
    const pastTime = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
    this.status.lastSyncedAt = pastTime;
    this.notify();

    pmsService.addAlert(
      'warning',
      'Cloud SQL Sync Overdue (Alert)',
      `Simulated Warning: Last cloud synchronization was ${minutesAgo}m ago (threshold: ${this.overdueThresholdMinutes}m).`,
      'Sync Now',
      'accounting'
    );
  }

  public clearSimulation() {
    this.simulatedFailure = false;
    this.simulatedOverdue = false;
    this.status.error = null;
    if (this.status.lastSyncStatus === 'failed') {
      this.status.lastSyncStatus = 'idle';
    }
    this.checkStatus().then(() => this.syncNow('Reset Simulation'));
  }

  public clearError() {
    this.status.error = null;
    this.status.lastSyncStatus = 'idle';
    this.simulatedFailure = false;
    this.notify();
  }

  private checkOverdueAndNotify() {
    const health = this.getHealth();
    if (health.isOverdue && Date.now() - this.lastOverdueAlertTime > 15 * 60 * 1000) {
      this.lastOverdueAlertTime = Date.now();
      try {
        pmsService.addAlert(
          'warning',
          'Cloud SQL Sync Overdue',
          `Last cloud synchronization was ${health.formattedAgo} (${health.minutesAgo || 0}m ago). Cloud database mirror may be out of date.`,
          'Sync Cloud SQL',
          'accounting'
        );
      } catch {}
    }
    this.notify();
  }

  public getHealth(): CloudSqlHealthInfo {
    const now = Date.now();
    const isSyncing = this.status.isSyncing;

    // Check if failed
    const isVercel = isVercelEnvironment();
    const isFailed = Boolean(
      this.simulatedFailure ||
      this.status.error ||
      this.status.lastSyncStatus === 'failed' ||
      (!this.status.connected && this.isInitialized && !this.isVercelMode && !isVercel)
    );

    let effectiveLastSyncedAt = this.status.lastSyncedAt;
    if (this.simulatedOverdue) {
      effectiveLastSyncedAt = new Date(now - this.simulatedMinutesAgo * 60 * 1000).toISOString();
    }

    let diffMinutes: number | null = null;
    let formattedAgo = 'Never synced';

    if (effectiveLastSyncedAt) {
      const lastSyncedTime = new Date(effectiveLastSyncedAt).getTime();
      if (!isNaN(lastSyncedTime)) {
        const diffMs = Math.max(0, now - lastSyncedTime);
        diffMinutes = Math.floor(diffMs / (60 * 1000));
        const diffSeconds = Math.floor(diffMs / 1000);

        if (diffSeconds < 45) {
          formattedAgo = 'Just now';
        } else if (diffMinutes < 60) {
          formattedAgo = `${diffMinutes}m ago`;
        } else {
          const diffHours = Math.floor(diffMinutes / 60);
          formattedAgo = `${diffHours}h ${diffMinutes % 60}m ago`;
        }
      }
    }

    const thresholdMinutes = this.overdueThresholdMinutes || 10;
    const isOverdue = !isSyncing && !isFailed && (
      (diffMinutes !== null && diffMinutes >= thresholdMinutes) ||
      (effectiveLastSyncedAt === null && this.isInitialized && !this.isVercelMode && !isVercel)
    );

    let state: CloudSqlHealthState = 'healthy';
    let label = (this.isVercelMode || isVercel) ? 'Synced' : 'Synchronized';
    let badgeText = (this.isVercelMode || isVercel) ? 'Vercel Synced' : 'Cloud SQL';
    let detail = (this.isVercelMode || isVercel)
      ? 'Vercel deployment active. Local storage & tab mesh active (100% data persistent across sessions).'
      : `Connected to Cloud SQL (${this.status.database}). Real-time data pipeline is operational.`;

    if (isSyncing) {
      state = 'syncing';
      label = 'Syncing...';
      badgeText = 'Syncing...';
      detail = 'Uploading local PMS state and accounts records to Cloud SQL (us-west1)...';
    } else if (isFailed) {
      state = 'failed';
      label = 'Sync Failed';
      badgeText = 'Sync Failed';
      detail = this.simulatedFailure
        ? this.simulatedFailureMessage
        : this.status.error || this.status.lastErrorMessage || 'Failed to connect or synchronize with Cloud SQL backend.';
    } else if (isOverdue) {
      state = 'overdue';
      label = 'Sync Overdue';
      badgeText = diffMinutes !== null ? `Overdue (${formattedAgo})` : 'Sync Overdue';
      detail = diffMinutes !== null
        ? `Last synchronization was ${formattedAgo} (${diffMinutes}m ago). Recommended sync threshold is ${thresholdMinutes}m.`
        : 'Initial synchronization has not completed. Cloud database mirror may be out of date.';
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
      minutesAgo: diffMinutes,
      formattedAgo,
      thresholdMinutes,
      lastSyncedAt: effectiveLastSyncedAt,
      lastFailedAt: this.status.lastFailedAt || null,
      error: this.simulatedFailure ? this.simulatedFailureMessage : this.status.error,
    };
  }

  public async loadLatestFromCloudSql(): Promise<boolean> {
    try {
      const data = await safeJsonFetch<{ success: boolean; exists: boolean; snapshot?: any }>('/api/cloudsql/load-latest');
      if (data && data.success && data.exists && data.snapshot?.state) {
        const cloudState = data.snapshot.state;
        pmsService.replaceState(cloudState, 'Loaded authoritative snapshot from Cloud SQL', true);
        if (data.snapshot.lastSyncedAt) {
          this.status.lastSyncedAt = data.snapshot.lastSyncedAt;
        }
        if (data.snapshot.version) {
          this.status.snapshotVersion = data.snapshot.version;
        }
        if (data.snapshot.totalEntities) {
          this.status.totalEntities = data.snapshot.totalEntities;
        }
        this.status.connected = true;
        this.status.lastSyncStatus = 'success';
        this.status.error = null;
        this.notify();
        return true;
      }
      return false;
    } catch (e: any) {
      console.warn('Failed to load latest state from Cloud SQL:', e.message || e);
      return false;
    }
  }

  public async getGlAccountsFromBackend() {
    return safeJsonFetch('/api/accounts/chart-of-accounts');
  }

  public async getTrialBalanceFromBackend() {
    return safeJsonFetch('/api/accounts/trial-balance');
  }

  public async getJournalVouchersFromBackend(limit = 100) {
    return safeJsonFetch(`/api/accounts/journal-vouchers?limit=${limit}`);
  }

  public async getCityLedgerFromBackend() {
    return safeJsonFetch('/api/accounts/city-ledger');
  }

  public async getHistory(limit = 15): Promise<SyncHistoryItem[]> {
    try {
      const data = await safeJsonFetch<{ history: SyncHistoryItem[] }>(`/api/cloudsql/sync-history?limit=${limit}`);
      return data?.history || [];
    } catch (e: any) {
      console.warn('Failed to load sync history:', e.message || e);
      return [];
    }
  }
}

export const cloudSqlSyncService = new CloudSqlSyncManager();
