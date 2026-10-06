import { rbacService } from './rbacService';

export type ErrorSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ErrorCategory =
  | 'UI / Crash'
  | 'Network / API Failure'
  | 'Payment / Billing'
  | 'Database & Sync'
  | 'Validation & Form'
  | 'Auth & Permission'
  | 'Hardware & Devices';

export type IncidentStatus = 'Unresolved' | 'Investigating' | 'Resolved' | 'Ignored';

export interface Breadcrumb {
  timestamp: string;
  action: string;
  category?: 'navigation' | 'click' | 'input' | 'api' | 'state';
  details?: string;
}

export interface UserErrorInfo {
  id: string; // e.g. "ERR-2026-9041"
  timestamp: string; // ISO string
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  department: string;
  ipAddress: string;
  deviceInfo: {
    browser: string;
    os: string;
    screenSize: string;
    userAgent: string;
    networkStatus: 'Online' | 'Offline' | 'Slow 3G' | '4G/WiFi';
  };
  route: string;
  component?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  errorMessage: string;
  errorName: string;
  stackTrace?: string;
  breadcrumbs: Breadcrumb[];
  stateSnapshot?: Record<string, any>;
  status: IncidentStatus;
  assignedTo?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  occurrencesCount: number;
  lastSeenAt: string;
}

const STORAGE_KEY = 'lesync_pms_user_error_telemetry_v1';
const BREADCRUMB_LIMIT = 15;

const INITIAL_SEEDED_ERRORS: UserErrorInfo[] = [
  {
    id: 'ERR-2026-9041',
    timestamp: '2026-09-28T19:42:15.000Z',
    userId: 'usr-fo-1',
    userName: 'Fatema Akter',
    userEmail: 'fatema.akter@lesync.com',
    userRole: 'Front Desk Agent',
    department: 'Front Office',
    ipAddress: '192.168.1.104',
    deviceInfo: {
      browser: 'Chrome 128.0 (Windows)',
      os: 'Windows 11 Pro 64-bit',
      screenSize: '1920x1080',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0',
      networkStatus: 'Online'
    },
    route: 'front-desk-checkout',
    component: 'FolioSettlementModal',
    severity: 'CRITICAL',
    category: 'Payment / Billing',
    errorName: 'GatewayTimeoutException',
    errorMessage: 'Payment Gateway Timeout: Transaction response took >15000ms while settling Folio #FOL-2026-0084 (৳24,500 via City Bank POS Terminal 2).',
    stackTrace: `GatewayTimeoutException: Transaction response took >15000ms
    at CityBankTerminalDriver.processPreAuth (src/services/billingDriver.ts:241:19)
    at async FolioSettlementModal.handleSettleFolio (src/views/FolioSettlementModal.tsx:189:22)
    at HTMLButtonElement.dispatch (src/components/common/Button.tsx:42:11)`,
    breadcrumbs: [
      { timestamp: '19:41:20', action: 'Navigated to Check-Out Desk', category: 'navigation', details: 'Route: front-desk-checkout' },
      { timestamp: '19:41:35', action: 'Selected Room 304 (Dr. Tariqul Islam)', category: 'click', details: 'Folio #FOL-2026-0084 loaded' },
      { timestamp: '19:41:50', action: 'Clicked [Settle Folio & Check Out]', category: 'click' },
      { timestamp: '19:41:58', action: 'Selected Tender Method: Credit Card (EDC POS 2)', category: 'input', details: 'Amount: ৳24,500' },
      { timestamp: '19:42:15', action: 'EXCEPTION: GatewayTimeoutException', category: 'api', details: 'City Bank Gateway timed out after 15s' }
    ],
    stateSnapshot: {
      folioId: 'FOL-2026-0084',
      roomNumber: '304',
      guestName: 'Dr. Tariqul Islam',
      totalBill: 24500,
      tender: 'Credit Card',
      terminalId: 'POS-TERM-02'
    },
    status: 'Unresolved',
    occurrencesCount: 3,
    lastSeenAt: '2026-09-28T20:10:05.000Z'
  },
  {
    id: 'ERR-2026-9042',
    timestamp: '2026-09-28T18:15:30.000Z',
    userId: 'usr-fb-1',
    userName: 'Kamal Hossain',
    userEmail: 'kamal.hossain@lesync.com',
    userRole: 'F&B Cashier',
    department: 'Food & Beverage',
    ipAddress: '192.168.1.112',
    deviceInfo: {
      browser: 'Chrome 127.0 (Android Tablet)',
      os: 'Android 14 (Samsung Galaxy Tab S9)',
      screenSize: '2560x1600',
      userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/127.0',
      networkStatus: '4G/WiFi'
    },
    route: 'restaurant-pos',
    component: 'PosCartCheckout',
    severity: 'HIGH',
    category: 'Hardware & Devices',
    errorName: 'PrinterSocketIOException',
    errorMessage: 'Kitchen KOT print queue buffer overflow: Thermal printer "Kitchen-Line-1" unreachable at IP 192.168.1.180:9100 (Connection Refused).',
    stackTrace: `PrinterSocketIOException: Connection refused at 192.168.1.180:9100
    at EscPosNetworkClient.sendBytes (src/services/printerService.ts:138:15)
    at async RestaurantPosView.fireKitchenOrderTicket (src/views/RestaurantPosView.tsx:312:9)
    at emitOrder (src/components/pos/CartSummary.tsx:94:12)`,
    breadcrumbs: [
      { timestamp: '18:14:10', action: 'Opened Table 14 Dine-in Order', category: 'click', details: 'Covers: 4 adults' },
      { timestamp: '18:14:40', action: 'Added 2x Kacchi Biryani, 1x Grilled Pomfret, 4x Mint Borhani', category: 'input' },
      { timestamp: '18:15:20', action: 'Clicked [Send to Kitchen KOT]', category: 'click' },
      { timestamp: '18:15:30', action: 'EXCEPTION: PrinterSocketIOException', category: 'api', details: 'Socket error 192.168.1.180' }
    ],
    stateSnapshot: {
      tableNumber: 'Table 14',
      orderId: 'KOT-2026-4412',
      itemsCount: 7,
      kitchenPrinterIP: '192.168.1.180:9100'
    },
    status: 'Investigating',
    assignedTo: 'Engr. Subrata Roy',
    resolutionNotes: 'Network technician dispatched to inspect physical LAN cable connected to Kitchen Line 1 Epson TM-T88VI printer.',
    occurrencesCount: 5,
    lastSeenAt: '2026-09-28T18:32:00.000Z'
  },
  {
    id: 'ERR-2026-9043',
    timestamp: '2026-09-28T16:04:12.000Z',
    userId: 'usr-hk-1',
    userName: 'Salma Khatun',
    userEmail: 'salma.khatun@lesync.com',
    userRole: 'Housekeeping Supervisor',
    department: 'Housekeeping',
    ipAddress: '192.168.1.120',
    deviceInfo: {
      browser: 'Mobile Safari 17.5 (iOS)',
      os: 'iOS 17.5 (Apple iPhone 14)',
      screenSize: '390x844',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      networkStatus: '4G/WiFi'
    },
    route: 'housekeeping-cleaning',
    component: 'HousekeepingInspectionModal',
    severity: 'MEDIUM',
    category: 'Validation & Form',
    errorName: 'PayloadTooLargeError',
    errorMessage: 'Inspection photo upload failed: 4K raw photo "IMG_9214.HEIC" (18.4 MB) exceeds the maximum allowed upload limit of 15MB.',
    stackTrace: `PayloadTooLargeError: Image upload size 18.4MB exceeds max allowable 15.0MB
    at validateImageFileSize (src/utils/fileValidation.ts:34:11)
    at async HousekeepingInspectionModal.handlePhotoCapture (src/views/housekeeping/HousekeepingInspectionModal.tsx:112:7)`,
    breadcrumbs: [
      { timestamp: '16:02:50', action: 'Inspecting Room 204 (Deluxe Cottage)', category: 'navigation' },
      { timestamp: '16:03:30', action: 'Ticked all 12 checklist inspection items', category: 'click' },
      { timestamp: '16:04:05', action: 'Captured defect photo of balcony sliding door lock', category: 'input' },
      { timestamp: '16:04:12', action: 'EXCEPTION: PayloadTooLargeError', category: 'state', details: 'File size 18.4MB > 15MB' }
    ],
    stateSnapshot: {
      roomNumber: '204',
      fileName: 'IMG_9214.HEIC',
      fileSizeBytes: 19293798,
      checklistComplete: true
    },
    status: 'Resolved',
    resolvedBy: 'Engr. Subrata Roy',
    resolvedAt: '2026-09-28T17:00:00.000Z',
    resolutionNotes: 'Updated client-side canvas compressor to automatically downsample all mobile inspection photos to 1080p WebP before upload.',
    occurrencesCount: 1,
    lastSeenAt: '2026-09-28T16:04:12.000Z'
  },
  {
    id: 'ERR-2026-9044',
    timestamp: '2026-09-28T14:22:45.000Z',
    userId: 'usr-fo-2',
    userName: 'Tanvir Ahmed',
    userEmail: 'tanvir.ahmed@lesync.com',
    userRole: 'Night Auditor',
    department: 'Front Office',
    ipAddress: '192.168.1.106',
    deviceInfo: {
      browser: 'Chrome 128.0 (Windows)',
      os: 'Windows 11 Enterprise',
      screenSize: '1920x1080',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0',
      networkStatus: 'Online'
    },
    route: 'room-move',
    component: 'RoomMoveModal',
    severity: 'HIGH',
    category: 'Database & Sync',
    errorName: 'ConcurrencyLockConflictException',
    errorMessage: 'Room allocation conflict: Target Room 102 was locked by Front Desk Station 1 while processing guest move for Reservation #RES-2026-0045.',
    stackTrace: `ConcurrencyLockConflictException: Room 102 is currently locked by session [usr-fo-1: Station-1]
    at RoomInventoryManager.acquireLock (src/services/mockPmsDatabase.ts:1820:13)
    at async RoomMoveModal.executeRoomMove (src/views/RoomMoveModal.tsx:145:9)`,
    breadcrumbs: [
      { timestamp: '14:21:10', action: 'Initiated Room Move request', category: 'navigation', details: 'From Room 301' },
      { timestamp: '14:21:40', action: 'Selected Destination Room 102 (Lake Breeze Cottage)', category: 'input' },
      { timestamp: '14:22:30', action: 'Clicked [Confirm Room Move]', category: 'click' },
      { timestamp: '14:22:45', action: 'EXCEPTION: ConcurrencyLockConflictException', category: 'api', details: 'Target room locked by station 1' }
    ],
    stateSnapshot: {
      fromRoom: '301',
      toRoom: '102',
      reservationId: 'RES-2026-0045',
      lockHolder: 'Station-1'
    },
    status: 'Resolved',
    resolvedBy: 'Engr. Subrata Roy',
    resolvedAt: '2026-09-28T15:10:00.000Z',
    resolutionNotes: 'Stale mutex lock released. Reduced mutex lock TTL from 10 minutes to 60 seconds to prevent lingering locks.',
    occurrencesCount: 2,
    lastSeenAt: '2026-09-28T14:25:10.000Z'
  },
  {
    id: 'ERR-2026-9045',
    timestamp: '2026-09-28T11:50:18.000Z',
    userId: 'usr-acc-1',
    userName: 'Nasreen Sultana',
    userEmail: 'nasreen.sultana@lesync.com',
    userRole: 'Accounts Manager',
    department: 'Finance & Accounts',
    ipAddress: '192.168.1.115',
    deviceInfo: {
      browser: 'Firefox 130.0 (macOS)',
      os: 'macOS Sonoma 14.5 (MacBook Pro M2)',
      screenSize: '1728x1117',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:130.0) Gecko/20100101 Firefox/130.0',
      networkStatus: 'Online'
    },
    route: 'finance-gl',
    component: 'JournalVoucherEntry',
    severity: 'MEDIUM',
    category: 'UI / Crash',
    errorName: 'TypeError',
    errorMessage: 'TypeError: Cannot read properties of undefined (reading "taxRate") in JournalVoucherEntry.calculateVatSplit.',
    stackTrace: `TypeError: Cannot read properties of undefined (reading 'taxRate')
    at JournalVoucherEntry.calculateVatSplit (src/views/JournalVoucherEntry.tsx:162:38)
    at HTMLInputElement.handleSubLedgerSelect (src/views/JournalVoucherEntry.tsx:210:9)`,
    breadcrumbs: [
      { timestamp: '11:48:20', action: 'Opened General Ledger Voucher Entry', category: 'navigation' },
      { timestamp: '11:49:10', action: 'Selected Account 5120 (F&B Raw Procurement)', category: 'input' },
      { timestamp: '11:49:50', action: 'Entered Debit ৳125,000', category: 'input' },
      { timestamp: '11:50:18', action: 'EXCEPTION: TypeError: undefined reading taxRate', category: 'state' }
    ],
    stateSnapshot: {
      accountCode: '5120',
      voucherType: 'JV-DEBIT',
      amount: 125000
    },
    status: 'Unresolved',
    occurrencesCount: 1,
    lastSeenAt: '2026-09-28T11:50:18.000Z'
  }
];

class UserErrorTrackerService {
  private errors: UserErrorInfo[] = [];
  private breadcrumbs: Breadcrumb[] = [];
  private listeners: (() => void)[] = [];
  private isHandlerInstalled = false;

  constructor() {
    this.loadState();
    this.installGlobalErrorHandlers();
    this.installUserInteractionTracking();
  }

  private loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.errors = parsed;
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load user errors from storage:', e);
    }
    this.errors = [...INITIAL_SEEDED_ERRORS];
    this.saveState();
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.errors));
    } catch (e) {
      console.error('Failed to save user errors to storage:', e);
    }
    this.notify();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error('Error in user error tracker listener:', err);
      }
    });
  }

  public recordBreadcrumb(action: string, category: Breadcrumb['category'] = 'click', details?: string) {
    const timeStr = new Date().toTimeString().slice(0, 8);
    this.breadcrumbs.push({
      timestamp: timeStr,
      action,
      category,
      details
    });
    if (this.breadcrumbs.length > BREADCRUMB_LIMIT) {
      this.breadcrumbs.shift();
    }
  }

  public getRecentBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  private installUserInteractionTracking() {
    if (typeof window === 'undefined') return;

    // Track user clicks automatically for breadcrumbs
    window.addEventListener('click', (e) => {
      try {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const text = (target.innerText || target.getAttribute('aria-label') || target.title || target.tagName).trim().slice(0, 35);
        if (text) {
          this.recordBreadcrumb(`Clicked "${text}"`, 'click', `Tag: <${target.tagName.toLowerCase()}>`);
        }
      } catch {
        // ignore
      }
    }, { passive: true });
  }

  public installGlobalErrorHandlers() {
    if (this.isHandlerInstalled || typeof window === 'undefined') return;
    this.isHandlerInstalled = true;

    // Global Uncaught Exceptions
    window.addEventListener('error', (event) => {
      try {
        this.trackError({
          errorMessage: event.message || 'Unknown Uncaught Exception',
          errorName: event.error?.name || 'Error',
          stackTrace: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
          severity: 'HIGH',
          category: 'UI / Crash'
        });
      } catch (err) {
        console.error('Failed in error tracker handler:', err);
      }
    });

    // Unhandled Promise Rejections
    window.addEventListener('unhandledrejection', (event) => {
      try {
        const reason = event.reason;
        const msg = typeof reason === 'string' ? reason : (reason?.message || JSON.stringify(reason) || 'Unhandled Promise Rejection');
        this.trackError({
          errorMessage: msg,
          errorName: reason?.name || 'UnhandledRejection',
          stackTrace: reason?.stack || 'No stack trace available for promise rejection',
          severity: 'HIGH',
          category: 'Network / API Failure'
        });
      } catch (err) {
        console.error('Failed in promise rejection tracker handler:', err);
      }
    });
  }

  public getActiveUserContext() {
    const activeUser = rbacService.getActiveUser();
    return {
      userId: activeUser?.id || 'usr-guest-001',
      userName: activeUser?.name || 'Front Desk Staff',
      userEmail: activeUser?.email || 'staff@lesync.com',
      userRole: activeUser?.roleName || 'Operator',
      department: activeUser?.department || 'Operations'
    };
  }

  private detectBrowserAndOS() {
    const ua = navigator.userAgent;
    let browser = 'Chrome (Web)';
    if (ua.includes('Firefox/')) browser = 'Firefox';
    else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
    else if (ua.includes('Edg/')) browser = 'Edge';

    let os = 'Windows';
    if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Linux')) os = 'Linux';

    const screenSize = `${window.innerWidth}x${window.innerHeight}`;
    return {
      browser,
      os,
      screenSize,
      userAgent: ua,
      networkStatus: (navigator.onLine ? 'Online' : 'Offline') as 'Online' | 'Offline'
    };
  }

  public trackError(params: {
    errorMessage: string;
    errorName?: string;
    stackTrace?: string;
    component?: string;
    route?: string;
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    stateSnapshot?: Record<string, any>;
    customUserId?: string;
    customUserName?: string;
    customUserRole?: string;
  }): UserErrorInfo {
    const userCtx = this.getActiveUserContext();
    const userId = params.customUserId || userCtx.userId;
    const userName = params.customUserName || userCtx.userName;
    const userRole = params.customUserRole || userCtx.userRole;

    const currentRoute = params.route || window.location.pathname || 'front-desk';
    const nowIso = new Date().toISOString();

    // Check if identical error occurred recently for same user (grouping)
    const existingIndex = this.errors.findIndex(
      e => e.userId === userId &&
           e.errorMessage === params.errorMessage &&
           e.status !== 'Resolved'
    );

    if (existingIndex >= 0) {
      const existing = this.errors[existingIndex];
      existing.occurrencesCount += 1;
      existing.lastSeenAt = nowIso;
      this.saveState();
      return existing;
    }

    const nextIdNum = 9040 + this.errors.length + 1;
    const id = `ERR-2026-${nextIdNum}`;

    const newError: UserErrorInfo = {
      id,
      timestamp: nowIso,
      userId,
      userName,
      userEmail: userCtx.userEmail,
      userRole,
      department: userCtx.department,
      ipAddress: `192.168.1.${Math.floor(100 + Math.random() * 80)}`,
      deviceInfo: this.detectBrowserAndOS(),
      route: currentRoute,
      component: params.component || 'ApplicationRoot',
      severity: params.severity || 'HIGH',
      category: params.category || 'UI / Crash',
      errorName: params.errorName || 'OperationalError',
      errorMessage: params.errorMessage,
      stackTrace: params.stackTrace || `Error: ${params.errorMessage}\n    at ${params.component || 'Component'} (src/views/${currentRoute}.tsx:85:12)`,
      breadcrumbs: this.breadcrumbs.length > 0 ? [...this.breadcrumbs] : [
        { timestamp: new Date().toTimeString().slice(0, 8), action: `Active in route: ${currentRoute}`, category: 'navigation' }
      ],
      stateSnapshot: params.stateSnapshot,
      status: 'Unresolved',
      occurrencesCount: 1,
      lastSeenAt: nowIso
    };

    this.errors.unshift(newError);
    this.saveState();
    return newError;
  }

  public getErrors(): UserErrorInfo[] {
    return [...this.errors];
  }

  public getErrorById(id: string): UserErrorInfo | undefined {
    return this.errors.find(e => e.id === id);
  }

  public getErrorsByUser(userId: string): UserErrorInfo[] {
    return this.errors.filter(e => e.userId === userId);
  }

  public updateErrorStatus(
    id: string,
    status: IncidentStatus,
    resolutionNotes?: string,
    resolvedBy?: string
  ): boolean {
    const error = this.errors.find(e => e.id === id);
    if (!error) return false;

    error.status = status;
    if (resolutionNotes !== undefined) {
      error.resolutionNotes = resolutionNotes;
    }
    if (status === 'Resolved') {
      error.resolvedAt = new Date().toISOString();
      error.resolvedBy = resolvedBy || rbacService.getActiveUser()?.name || 'Administrator';
    } else if (status === 'Unresolved') {
      error.resolvedAt = undefined;
      error.resolvedBy = undefined;
    }

    this.saveState();
    return true;
  }

  public assignError(id: string, assignedTo: string): boolean {
    const error = this.errors.find(e => e.id === id);
    if (!error) return false;
    error.assignedTo = assignedTo;
    if (error.status === 'Unresolved') {
      error.status = 'Investigating';
    }
    this.saveState();
    return true;
  }

  public deleteError(id: string): boolean {
    const initialLen = this.errors.length;
    this.errors = this.errors.filter(e => e.id !== id);
    if (this.errors.length !== initialLen) {
      this.saveState();
      return true;
    }
    return false;
  }

  public clearResolvedErrors(): void {
    this.errors = this.errors.filter(e => e.status !== 'Resolved');
    this.saveState();
  }

  public simulateTestError(scenario: 'payment' | 'printer' | 'sync' | 'crash' = 'payment'): UserErrorInfo {
    const activeUser = rbacService.getActiveUser();
    this.recordBreadcrumb('Admin triggered simulated test diagnostic error', 'click');

    switch (scenario) {
      case 'payment':
        return this.trackError({
          errorMessage: 'Simulated Card Gateway Refusal: Bank Authorization Code 91 (Issuer System Unavailable).',
          errorName: 'PaymentDeclinedError',
          severity: 'CRITICAL',
          category: 'Payment / Billing',
          component: 'CreditCardSwipeModal',
          route: 'billing-folios',
          stateSnapshot: { simulated: true, testCode: 91, attemptedAmount: 18500 }
        });
      case 'printer':
        return this.trackError({
          errorMessage: 'Receipt Printer Paper Jam / Out of Paper: Front Desk Citizen CT-S310 thermal roll empty.',
          errorName: 'PrinterHardwareFault',
          severity: 'MEDIUM',
          category: 'Hardware & Devices',
          component: 'ThermalReceiptModal',
          route: 'front-desk-checkin',
          stateSnapshot: { simulated: true, printerModel: 'Citizen CT-S310', status: 'Paper Empty' }
        });
      case 'sync':
        return this.trackError({
          errorMessage: 'Supabase Re-Sync Stalled: PostgreSQL streaming replication lag exceeded 120s.',
          errorName: 'ReplicationLagTimeout',
          severity: 'HIGH',
          category: 'Database & Sync',
          component: 'SupabaseSyncManager',
          route: 'admin-backup',
          stateSnapshot: { simulated: true, lagSeconds: 142 }
        });
      case 'crash':
      default:
        return this.trackError({
          errorMessage: 'Uncaught RangeError: Maximum call stack size exceeded in recursive room tariff calculation.',
          errorName: 'RangeError',
          severity: 'CRITICAL',
          category: 'UI / Crash',
          component: 'DynamicPricingEngine',
          route: 'room-status',
          stateSnapshot: { simulated: true, recursionDepth: 1000 }
        });
    }
  }
}

export const userErrorTrackerService = new UserErrorTrackerService();
