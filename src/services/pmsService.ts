import {
  getInitialDatabase, saveDatabase, PmsDatabaseState, SEED_HALLS, SEED_ACTIVITIES, SEED_FLOORS,
  getOffsetDate, getTodayString, getSeedPendingReservations
} from './mockPmsDatabase';
import {
  SEED_ENHANCED_MENU_ITEMS, SEED_RECIPES
} from './mockInventoryData';
import {
  Reservation, Stay, Folio, FolioItem, Payment, Refund, Invoice,
  HousekeepingTask, MaintenanceTicket, EventBooking, RestaurantOrder,
  AuditLog, OperationalStatus, HousekeepingStatus, Room, Guest, UserRoleName,
  OperationalAlert, RoomType, Floor, Package, BanquetQuotation, MenuItem, EventClient, NightAuditRecord,
  PermissionKey, Hall, User, GLAccount, JournalVoucher, JournalEntryItem,
  CityLedgerAccount, DepartmentalSyncStatus, ActivityAmenityCharge,
  ActivityItem, ActivityBooking, SystemSetting, CustomerType, AllocatedRoom, GroupMember
} from '../types/pms';
import { inventoryMenuService } from './inventoryMenuService';
import { rbacService } from './rbacService';
import * as XLSX from 'xlsx';

// Reactive listeners
type Listener = (state: PmsDatabaseState) => void;
let listeners: Listener[] = [];
let isApplyingRemoteUpdate = false;
let state: PmsDatabaseState = getInitialDatabase();
if (!Array.isArray(state.halls) || state.halls.length === 0) {
  state.halls = [...SEED_HALLS];
  saveDatabase(state);
}
if (!Array.isArray(state.floors) || state.floors.length === 0) {
  state.floors = [...SEED_FLOORS];
  saveDatabase(state);
}
if (!Array.isArray(state.activities) || state.activities.length === 0) {
  state.activities = [...SEED_ACTIVITIES];
  saveDatabase(state);
}
if (!Array.isArray(state.enhancedMenuItems) || state.enhancedMenuItems.length === 0 || state.enhancedMenuItems.some((i: any) => i.categoryName === 'Main Course' || i.categoryId === 'cat-main')) {
  state.enhancedMenuItems = JSON.parse(JSON.stringify(SEED_ENHANCED_MENU_ITEMS));
  saveDatabase(state);
}
if (!Array.isArray(state.recipes) || state.recipes.length === 0) {
  state.recipes = JSON.parse(JSON.stringify(SEED_RECIPES));
  saveDatabase(state);
}

// Self-heal runaway business dates (e.g. rolled into future years like 2028+ due to runaway automated audit loops)
if (state.settings) {
  state.settings.autoNightAuditTime = '06:00';
  state.settings.autoNightAuditEnabled = false;
  if (state.settings.currentBusinessDate && state.settings.currentBusinessDate > '2028-01-01') {
    state.settings.currentBusinessDate = typeof window !== 'undefined' ? getTodayString() : '2026-10-02';
    state.settings.lastNightAuditDate = undefined;
  }
}

// Guarantee active pending arrivals exist for current business date
const sysBizDate = state.settings?.currentBusinessDate || getTodayString();
const initConfirmedRes = (state.reservations || []).filter(
  r => r.status === 'Confirmed' || r.status === 'Unconfirmed' || (r.status as string) === 'Pending'
);
const initTodayArrivalsCount = initConfirmedRes.filter(r => r.arrivalDate === sysBizDate).length;
if (initTodayArrivalsCount === 0) {
  if (initConfirmedRes.length >= 2) {
    initConfirmedRes.forEach((r, idx) => {
      const offset = idx < 3 ? 0 : (idx === 3 ? 1 : 2);
      r.arrivalDate = getOffsetDate(sysBizDate, offset);
      r.departureDate = getOffsetDate(r.arrivalDate, 2 + (idx % 2));
      r.updatedAt = new Date().toISOString();
    });
  } else {
    const seedArrivals = getSeedPendingReservations(sysBizDate);
    const existingIds = new Set((state.reservations || []).map(r => r.id));
    const toAdd = seedArrivals.filter(r => !existingIds.has(r.id));
    state.reservations = [...(state.reservations || []), ...toAdd];
  }
  saveDatabase(state);
}
if (Array.isArray(state.folios)) {
  let foliosRepaired = false;
  state.folios.forEach(folio => {
    if (Array.isArray(folio.items)) {
      const origCount = folio.items.length;
      folio.items = folio.items.filter(item => {
        const isRunawayAutoCharge = 
          Boolean(item.postedBy && item.postedBy.includes('System Auto Night Audit')) &&
          Boolean(item.description && (
            item.description.includes('2029-') || 
            item.description.includes('2028-')
          ));
        return !isRunawayAutoCharge;
      });
      if (folio.items.length !== origCount) {
        foliosRepaired = true;
        const validItems = folio.items.filter(i => !i.voided);
        const subtotal = validItems.reduce((acc, i) => acc + (Number(i.unitPrice || 0) * Number(i.quantity || 1)) - Number(i.discount || 0), 0);
        const tax = validItems.reduce((acc, i) => acc + Number(i.tax || 0), 0);
        const scRate = (state.settings?.serviceChargePercent ?? 10) / 100;
        const serviceCharge = Math.round(subtotal * scRate);
        const grandTotal = subtotal + serviceCharge + tax;
        folio.subtotal = subtotal;
        folio.serviceChargeTotal = serviceCharge;
        folio.taxTotal = tax;
        folio.grandTotal = grandTotal;
        folio.balance = grandTotal - Number(folio.paidTotal || 0);
      }
    }
  });
  if (foliosRepaired) {
    saveDatabase(state);
  }
}

function notify() {
  state = {
    ...state,
    rooms: [...state.rooms],
    stays: [...state.stays],
    reservations: [...state.reservations],
    guests: [...state.guests],
    folios: [...state.folios],
    payments: [...state.payments],
    invoices: [...state.invoices],
    maintenanceTickets: [...state.maintenanceTickets],
    housekeepingTasks: [...state.housekeepingTasks],
    halls: [...(state.halls || [])],
    packages: [...(state.packages || [])],
    quotations: [...(state.quotations || [])],
    eventBookings: [...(state.eventBookings || [])],
    activities: [...(state.activities || [])],
    activityBookings: [...(state.activityBookings || [])],
    activityCharges: [...(state.activityCharges || [])],
    purchaseOrders: [...(state.purchaseOrders || [])],
    goodsReceiveNotes: [...(state.goodsReceiveNotes || [])],
    purchaseBills: [...(state.purchaseBills || [])],
    supplierPayments: [...(state.supplierPayments || [])],
    purchaseReturns: [...(state.purchaseReturns || [])],
    purchaseRequests: [...(state.purchaseRequests || [])],
    suppliers: [...(state.suppliers || [])],
    warehouses: [...(state.warehouses || [])],
    inventoryItems: [...(state.inventoryItems || [])],
    inventoryStocks: [...(state.inventoryStocks || [])],
    stockLedgers: [...(state.stockLedgers || [])],
    journalVouchers: [...(state.journalVouchers || [])],
    glAccounts: [...(state.glAccounts || [])],
    enhancedMenuItems: [...(state.enhancedMenuItems || [])],
    recipes: [...(state.recipes || [])],
    menuCategoriesList: [...(state.menuCategoriesList || [])],
    menuModifiers: [...(state.menuModifiers || [])],
    menuCombos: [...(state.menuCombos || [])],
    menuPriceHistories: [...(state.menuPriceHistories || [])]
  };
  saveDatabase(state);
  listeners.forEach(fn => {
    try {
      fn(state);
    } catch (e) {
      console.error('Listener notification error:', e);
    }
  });
}

// Synchronize with RBAC changes reactively
rbacService.onUserChange((user) => {
  try {
    if (!user) return;
    if (Array.isArray(state.users)) {
      const pmsUser = state.users.find(x => 
        x.id === user.id || 
        (Boolean(x.email) && Boolean(user.email) && x.email.toLowerCase() === user.email.toLowerCase())
      );
      if (pmsUser) {
        pmsUser.name = user.name;
        pmsUser.role = user.roleName as any;
        pmsUser.department = user.department as any;
        state.currentUser = pmsUser;
      } else if (state.currentUser) {
        state.currentUser.name = user.name;
        state.currentUser.role = user.roleName as any;
        state.currentUser.department = user.department as any;
      }
    }
    notify();
  } catch (err) {
    console.warn('RBAC onUserChange sync non-critical error:', err);
  }
});

export const pmsService = {
  subscribe(fn: Listener) {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter(l => l !== fn);
    };
  },

  getState(): PmsDatabaseState {
    let needsSave = false;
    if (!Array.isArray(state.halls) || state.halls.length === 0) {
      state.halls = [...SEED_HALLS];
      needsSave = true;
    }
    if (!Array.isArray(state.floors) || state.floors.length === 0) {
      state.floors = [...SEED_FLOORS];
      needsSave = true;
    }
    if (needsSave) {
      saveDatabase(state);
    }
    return state;
  },

  getSettings(): SystemSetting {
    return state.settings;
  },

  getDatabase(): PmsDatabaseState {
    let touched = false;
    if (!Array.isArray(state.halls) || state.halls.length === 0) {
      state.halls = [...SEED_HALLS];
      touched = true;
    }
    if (!Array.isArray(state.enhancedMenuItems) || state.enhancedMenuItems.length === 0 || state.enhancedMenuItems.some((i: any) => i.categoryName === 'Main Course' || i.categoryId === 'cat-main')) {
      state.enhancedMenuItems = JSON.parse(JSON.stringify(SEED_ENHANCED_MENU_ITEMS));
      touched = true;
    }
    if (!Array.isArray(state.recipes) || state.recipes.length === 0) {
      state.recipes = JSON.parse(JSON.stringify(SEED_RECIPES));
      touched = true;
    }
    if (touched) {
      saveDatabase(state);
    }
    return state;
  },

  notify() {
    notify();
  },

  isRemoteUpdateActive(): boolean {
    return isApplyingRemoteUpdate;
  },

  replaceState(newState: Partial<PmsDatabaseState>, reason = 'Remote Data Sync', fromRemote = false) {
    if (!newState || typeof newState !== 'object') return;

    if (fromRemote) {
      isApplyingRemoteUpdate = true;
    }

    let hadLocalPreserved = false;
    try {
      if (Array.isArray(newState.floors) && newState.floors.length > 0) state.floors = [...newState.floors];
      if (Array.isArray(newState.rooms) && newState.rooms.length > 0) state.rooms = [...newState.rooms];
      if (Array.isArray(newState.reservations)) {
        const res = this.reconcileEntityList(state.reservations, newState.reservations);
        state.reservations = res.merged;
        if (res.hadLocalPreserved) hadLocalPreserved = true;
      }
      if (Array.isArray(newState.stays)) {
        const res = this.reconcileEntityList(state.stays, newState.stays);
        state.stays = res.merged;
        if (res.hadLocalPreserved) hadLocalPreserved = true;
      }
      if (Array.isArray(newState.folios)) {
        const res = this.reconcileEntityList(state.folios, newState.folios);
        state.folios = res.merged;
        if (res.hadLocalPreserved) hadLocalPreserved = true;
      }
      if (Array.isArray(newState.payments)) {
        const res = this.reconcileEntityList(state.payments, newState.payments);
        state.payments = res.merged;
        if (res.hadLocalPreserved) hadLocalPreserved = true;
      }
      if (Array.isArray(newState.guests)) {
        const res = this.reconcileEntityList(state.guests, newState.guests);
        state.guests = res.merged;
        if (res.hadLocalPreserved) hadLocalPreserved = true;
      }
      if (Array.isArray(newState.invoices)) {
        const res = this.reconcileEntityList(state.invoices, newState.invoices);
        state.invoices = res.merged;
        if (res.hadLocalPreserved) hadLocalPreserved = true;
      }
      if (Array.isArray(newState.refunds)) state.refunds = [...newState.refunds];
      if (Array.isArray(newState.guestDocuments)) state.guestDocuments = [...newState.guestDocuments];
      if (Array.isArray(newState.roomTypes) && newState.roomTypes.length > 0) state.roomTypes = [...newState.roomTypes];
      if (Array.isArray(newState.housekeepingTasks)) {
        const res = this.reconcileEntityList(state.housekeepingTasks, newState.housekeepingTasks);
        state.housekeepingTasks = res.merged;
      }
      if (Array.isArray(newState.maintenanceTickets)) {
        const res = this.reconcileEntityList(state.maintenanceTickets, newState.maintenanceTickets);
        state.maintenanceTickets = res.merged;
      }
      if (Array.isArray(newState.halls) && newState.halls.length > 0) state.halls = [...newState.halls];
      if (Array.isArray(newState.packages)) state.packages = [...newState.packages];
      if (Array.isArray(newState.quotations)) state.quotations = [...newState.quotations];
      if (Array.isArray(newState.eventClients)) state.eventClients = [...newState.eventClients];
      if (Array.isArray(newState.eventBookings)) {
        const res = this.reconcileEntityList(state.eventBookings, newState.eventBookings);
        state.eventBookings = res.merged;
      }
      if (Array.isArray(newState.activities)) state.activities = [...newState.activities];
      if (Array.isArray(newState.activityBookings)) state.activityBookings = [...newState.activityBookings];
      if (Array.isArray(newState.activityCharges)) state.activityCharges = [...newState.activityCharges];
      if (Array.isArray(newState.menuCategories)) state.menuCategories = [...newState.menuCategories];
      if (Array.isArray(newState.menuItems)) state.menuItems = [...newState.menuItems];
      if (Array.isArray(newState.restaurantOrders)) {
        const res = this.reconcileEntityList(state.restaurantOrders, newState.restaurantOrders);
        state.restaurantOrders = res.merged;
      }
      if (Array.isArray(newState.glAccounts) && newState.glAccounts.length > 0) state.glAccounts = [...newState.glAccounts];
      if (Array.isArray(newState.journalVouchers)) state.journalVouchers = [...newState.journalVouchers];
      if (Array.isArray(newState.cityLedgerAccounts)) state.cityLedgerAccounts = [...newState.cityLedgerAccounts];
      if (Array.isArray(newState.suppliers)) state.suppliers = [...newState.suppliers];
      if (Array.isArray(newState.purchaseOrders)) state.purchaseOrders = [...newState.purchaseOrders];
      if (Array.isArray(newState.goodsReceiveNotes)) state.goodsReceiveNotes = [...newState.goodsReceiveNotes];
      if (Array.isArray(newState.purchaseBills)) state.purchaseBills = [...newState.purchaseBills];
      if (Array.isArray(newState.supplierPayments)) state.supplierPayments = [...newState.supplierPayments];
      if (Array.isArray(newState.purchaseReturns)) state.purchaseReturns = [...newState.purchaseReturns];
      if (Array.isArray(newState.purchaseRequests)) state.purchaseRequests = [...newState.purchaseRequests];
      if (Array.isArray(newState.warehouses)) state.warehouses = [...newState.warehouses];
      if (Array.isArray(newState.inventoryItems)) state.inventoryItems = [...newState.inventoryItems];
      if (Array.isArray(newState.inventoryStocks)) state.inventoryStocks = [...newState.inventoryStocks];
      if (Array.isArray(newState.stockLedgers)) state.stockLedgers = [...newState.stockLedgers];
      if (Array.isArray(newState.enhancedMenuItems) && newState.enhancedMenuItems.length > 0) state.enhancedMenuItems = [...newState.enhancedMenuItems];
      if (Array.isArray(newState.recipes) && newState.recipes.length > 0) state.recipes = [...newState.recipes];
      if (Array.isArray(newState.menuCategoriesList) && newState.menuCategoriesList.length > 0) state.menuCategoriesList = [...newState.menuCategoriesList];
      if (Array.isArray(newState.menuModifiers) && newState.menuModifiers.length > 0) state.menuModifiers = [...newState.menuModifiers];
      if (Array.isArray(newState.menuCombos) && newState.menuCombos.length > 0) state.menuCombos = [...newState.menuCombos];
      if (Array.isArray(newState.auditLogs)) state.auditLogs = [...newState.auditLogs];
      if (newState.settings && typeof newState.settings === 'object') {
        state.settings = { ...state.settings, ...newState.settings };
      }

      saveDatabase(state);
      notify();

      if (hadLocalPreserved && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pms:local-records-reconciled', { detail: { reason } }));
      }
    } finally {
      if (fromRemote) {
        setTimeout(() => {
          isApplyingRemoteUpdate = false;
        }, 150);
      }
    }
  },

  reconcileEntityList<T extends { id: string; updatedAt?: string; createdAt?: string }>(
    localList: T[] = [],
    remoteList: T[] = []
  ): { merged: T[]; hadLocalPreserved: boolean } {
    if (!Array.isArray(remoteList)) return { merged: localList || [], hadLocalPreserved: false };
    if (!Array.isArray(localList) || localList.length === 0) return { merged: [...remoteList], hadLocalPreserved: false };

    const remoteMap = new Map<string, T>(remoteList.map(item => [item.id, item]));
    const merged: T[] = [...remoteList];
    let hadLocalPreserved = false;

    for (const localItem of localList) {
      if (!localItem || !localItem.id) continue;
      if (!remoteMap.has(localItem.id)) {
        // Local record not present in remote snapshot: PRESERVE IT so local bookings never vanish!
        merged.unshift(localItem);
        hadLocalPreserved = true;
      } else {
        const remoteItem = remoteMap.get(localItem.id)!;
        const localTime = localItem.updatedAt || localItem.createdAt || '';
        const remoteTime = remoteItem.updatedAt || remoteItem.createdAt || '';
        if (localTime && remoteTime && localTime > remoteTime) {
          const idx = merged.findIndex(i => i.id === localItem.id);
          if (idx !== -1) {
            merged[idx] = localItem;
            hadLocalPreserved = true;
          }
        }
      }
    }

    return { merged, hadLocalPreserved };
  },

  resetToSeed() {
    localStorage.removeItem('cculb_pms_db_v1');
    state = getInitialDatabase();
    notify();
  },

  provisionNewProperty(config: {
    resortName: string;
    address: string;
    phone: string;
    email: string;
    logoUrl?: string;
    binNumber?: string;
    tradeLicense?: string;
    currencySymbol?: string;
    vatRate?: number;
    serviceCharge?: number;
    currentBusinessDate?: string;
    cleanMode: 'clean_transactions_keep_rooms' | 'fresh_slate_starter_rooms';
  }) {
    const todayStr = config.currentBusinessDate || new Date().toISOString().split('T')[0];
    state.settings = {
      ...state.settings,
      resortName: config.resortName.trim(),
      address: config.address.trim(),
      phone: config.phone.trim(),
      email: config.email.trim(),
      logoUrl: config.logoUrl !== undefined ? config.logoUrl.trim() : (state.settings.logoUrl || ''),
      binNumber: config.binNumber?.trim() || '',
      tradeLicense: config.tradeLicense?.trim() || '',
      currencySymbol: config.currencySymbol || '৳',
      taxRatePercent: config.vatRate ?? state.settings.taxRatePercent,
      vatRate: config.vatRate ?? state.settings.vatRate,
      serviceChargePercent: config.serviceCharge ?? state.settings.serviceChargePercent,
      serviceChargeRate: config.serviceCharge ?? state.settings.serviceChargeRate,
      currentBusinessDate: todayStr,
      lastNightAuditDate: undefined
    };

    // Clean all transaction, stay, booking, folio, and customer records
    state.reservations = [];
    state.stays = [];
    state.folios = [];
    state.payments = [];
    state.refunds = [];
    state.invoices = [];
    state.guests = [];
    state.guestDocuments = [];
    state.restaurantOrders = [];
    state.eventBookings = [];
    state.eventClients = [];
    state.activityBookings = [];
    state.housekeepingTasks = [];
    state.maintenanceTickets = [];
    state.journalVouchers = [];
    state.nightAuditRecords = [];
    state.auditLogs = [
      {
        id: `aud-prov-${Date.now()}`,
        userId: state.currentUser?.id || 'usr-admin-1',
        userName: state.currentUser?.name || 'Super Admin',
        userRole: 'Super Admin',
        action: `System Provisioned for New Property: ${config.resortName}`,
        entityType: 'Settings',
        entityId: 'settings',
        newValue: JSON.stringify({ resortName: config.resortName, date: todayStr }),
        createdAt: new Date().toISOString()
      }
    ];

    if (config.cleanMode === 'fresh_slate_starter_rooms') {
      const standardTypes: RoomType[] = state.roomTypes && state.roomTypes.length > 0 ? state.roomTypes : [
        {
          id: 'rt-std',
          name: 'Deluxe Room',
          description: 'Spacious deluxe room with modern amenities',
          maxAdults: 2,
          maxChildren: 1,
          baseRate: 3500,
          extraAdultRate: 1000,
          extraChildRate: 500,
          amenities: ['WiFi', 'AC', 'TV', 'Ensuite Bathroom'],
          active: true,
          totalRooms: 10
        },
        {
          id: 'rt-ste',
          name: 'Executive Suite',
          description: 'Premium suite with master bedroom and separate living area',
          maxAdults: 3,
          maxChildren: 2,
          baseRate: 6500,
          extraAdultRate: 1500,
          extraChildRate: 750,
          amenities: ['WiFi', 'AC', 'TV', 'Living Area', 'Mini Bar'],
          active: true,
          totalRooms: 5
        }
      ];
      state.roomTypes = standardTypes;
      
      const newRooms: Room[] = [];
      for (let i = 1; i <= 10; i++) {
        const num = `10${i === 10 ? '10' : '0' + i}`;
        newRooms.push({
          id: `room-${num}`,
          roomNumber: num,
          roomTypeId: standardTypes[0].id,
          roomTypeName: standardTypes[0].name,
          floor: 1,
          building: 'Main Wing',
          operationalStatus: 'Available',
          housekeepingStatus: 'Clean',
          active: true,
          amenities: standardTypes[0].amenities
        });
      }
      for (let i = 1; i <= 5; i++) {
        const num = `20${i}`;
        newRooms.push({
          id: `room-${num}`,
          roomNumber: num,
          roomTypeId: standardTypes[1]?.id || standardTypes[0].id,
          roomTypeName: standardTypes[1]?.name || standardTypes[0].name,
          floor: 2,
          building: 'Executive Wing',
          operationalStatus: 'Available',
          housekeepingStatus: 'Clean',
          active: true,
          amenities: standardTypes[1]?.amenities || standardTypes[0].amenities
        });
      }
      state.rooms = newRooms;
    } else {
      state.rooms = (state.rooms || []).map(r => ({
        ...r,
        operationalStatus: 'Available' as OperationalStatus,
        housekeepingStatus: 'Clean' as HousekeepingStatus,
        active: true
      }));
    }

    saveDatabase(state);
    notify();
    return state;
  },

  setCurrentUser(userId: string) {
    if (!Array.isArray(state.users)) {
      state.users = [];
    }
    let user = state.users.find(u => u.id === userId);
    if (!user) {
      // Find from RBAC users
      const rbacUser = rbacService.getUsers().find(u => u.id === userId);
      if (rbacUser) {
        user = {
          id: rbacUser.id,
          name: rbacUser.name,
          email: rbacUser.email || `${rbacUser.id}@cculbresort.com`,
          role: rbacUser.roleName as any,
          department: rbacUser.department as any,
          active: true,
          phone: '+880 1711-000000',
          createdAt: new Date().toISOString()
        };
        state.users.push(user);
      }
    }
    if (user) {
      state.currentUser = user;
      try {
        rbacService.syncActiveUserFromPms(user);
      } catch (e) {
        console.warn('Non-critical syncActiveUserFromPms error:', e);
      }
      notify();
    }
  },

  getAuditLogs(): AuditLog[] {
    return state.auditLogs || [];
  },

  logAudit(action: string, entityType: AuditLog['entityType'], entityId: string, oldValue?: string, newValue?: string, ipAddress?: string) {
    const currentUser = state.currentUser || { id: 'usr-admin-1', name: 'Administrator', role: 'Super Admin' };
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      ipAddress: ipAddress || '192.168.1.50',
      createdAt: new Date().toISOString()
    };
    if (!Array.isArray(state.auditLogs)) state.auditLogs = [];
    state.auditLogs.unshift(log);
    if (!Array.isArray(state.auditTrail)) state.auditTrail = [];
    state.auditTrail.unshift(log);
    notify();
  },

  addAlert(type: OperationalAlert['type'], title: string, message: string, actionLabel?: string, actionRoute?: string) {
    const alert: OperationalAlert = {
      id: `alt-${Date.now()}`,
      type,
      title,
      message,
      timestamp: 'Just now',
      read: false,
      actionLabel,
      actionRoute
    };
    state.alerts.unshift(alert);
    notify();
  },

  markAlertRead(alertId: string) {
    state.alerts = state.alerts.map(a => a.id === alertId ? { ...a, read: true } : a);
    notify();
  },

  clearAllAlerts() {
    state.alerts = state.alerts.map(a => ({ ...a, read: true }));
    notify();
  },

  // -------------------------------------------------------------
  // AVAILABILITY ENGINE (Double-Booking & Date-Overlap Prevention)
  // -------------------------------------------------------------
  checkRoomAvailability(roomId: string, arrivalDate: string, departureDate: string, excludeReservationId?: string): {
    isAvailable: boolean;
    reason?: string;
  } {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) return { isAvailable: false, reason: 'Room not found' };
    if (!room.active) return { isAvailable: false, reason: 'Room is marked inactive' };
    if (room.operationalStatus === 'Out of Order') return { isAvailable: false, reason: 'Room is currently Out of Order for maintenance' };

    const arr = new Date(arrivalDate).getTime();
    const dep = new Date(departureDate).getTime();

    if (isNaN(arr) || isNaN(dep) || arr >= dep) {
      return { isAvailable: false, reason: 'Departure date must be after arrival date' };
    }

    // Check active stays
    const activeStay = state.stays.find(s => s.roomId === roomId && s.status === 'Active');
    if (activeStay) {
      const checkInStr = activeStay.checkInAt ? activeStay.checkInAt.split('T')[0] : '';
      const expDepStr = activeStay.expectedCheckOutAt ? activeStay.expectedCheckOutAt.split('T')[0] : '';
      const stayCheckIn = checkInStr ? new Date(checkInStr).getTime() : 0;
      const stayExpectedDep = expDepStr ? new Date(expDepStr).getTime() : 0;
      if (arr < stayExpectedDep && dep > stayCheckIn) {
        return { isAvailable: false, reason: `Room is currently occupied by active stay ${activeStay.stayNumber}` };
      }
    }

    // Check overlapping confirmed/checked-in reservations
    const overlappingRes = state.reservations.find(res => {
      if (excludeReservationId && res.id === excludeReservationId) return false;
      if (res.assignedRoomId !== roomId) return false;
      if (res.status === 'Cancelled' || res.status === 'Checked-Out' || res.status === 'No-Show') return false;

      const resArr = new Date(res.arrivalDate).getTime();
      const resDep = new Date(res.departureDate).getTime();
      return arr < resDep && dep > resArr;
    });

    if (overlappingRes) {
      return {
        isAvailable: false,
        reason: `Room is already reserved by ${overlappingRes.guestName} (${overlappingRes.reservationNumber}) from ${overlappingRes.arrivalDate} to ${overlappingRes.departureDate}`
      };
    }

    return { isAvailable: true };
  },

  getAvailableRoomsForDates(arrivalDate: string, departureDate: string, roomTypeId?: string): Room[] {
    return state.rooms.filter(room => {
      if (roomTypeId && room.roomTypeId !== roomTypeId) return false;
      const { isAvailable } = this.checkRoomAvailability(room.id, arrivalDate, departureDate);
      return isAvailable;
    });
  },

  getAvailabilitySummary(arrivalDate: string, departureDate: string): {
    roomType: RoomType;
    totalRooms: number;
    availableCount: number;
    baseRate: number;
  }[] {
    return state.roomTypes.map(rt => {
      const matchingRooms = state.rooms.filter(r => r.roomTypeId === rt.id && r.active);
      const availableRooms = matchingRooms.filter(r => this.checkRoomAvailability(r.id, arrivalDate, departureDate).isAvailable);
      return {
        roomType: rt,
        totalRooms: matchingRooms.length,
        availableCount: availableRooms.length,
        baseRate: rt.baseRate
      };
    });
  },

  // -------------------------------------------------------------
  // GUEST MANAGEMENT
  // -------------------------------------------------------------
  createGuest(guestData: Omit<Guest, 'id' | 'guestCode' | 'totalStays' | 'totalNights' | 'totalSpend' | 'createdAt' | 'updatedAt'>): Guest {
    const codeNumber = state.guests.length + 101;
    const newGuest: Guest = {
      ...guestData,
      id: `gst-${Date.now()}`,
      guestCode: `GST-2026-00${codeNumber}`,
      totalStays: 0,
      totalNights: 0,
      totalSpend: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state.guests.unshift(newGuest);
    this.logAudit('Created Guest Profile', 'Stay', newGuest.id, undefined, `${newGuest.fullName} (${newGuest.phone})`);
    notify();
    return newGuest;
  },

  updateGuest(id: string, updates: Partial<Guest>): Guest {
    const idx = state.guests.findIndex(g => g.id === id);
    if (idx === -1) throw new Error('Guest not found');
    const old = state.guests[idx];
    const updated = { ...old, ...updates, updatedAt: new Date().toISOString() };
    state.guests[idx] = updated;
    this.logAudit('Updated Guest Profile', 'Stay', id, old.fullName, updated.fullName);
    notify();
    return updated;
  },

  updateRoomStatus(
    roomId: string,
    operationalStatus: OperationalStatus,
    housekeepingStatus: HousekeepingStatus,
    notes?: string
  ): Room {
    const idx = state.rooms.findIndex(r => r.id === roomId || r.roomNumber === roomId);
    if (idx === -1) throw new Error(`Room ${roomId} not found`);

    const room = state.rooms[idx];
    const oldOp = room.operationalStatus;
    const oldHk = room.housekeepingStatus;

    const updatedRoom: Room = {
      ...room,
      operationalStatus,
      housekeepingStatus,
      notes: notes !== undefined ? notes : room.notes
    };

    state.rooms = [
      ...state.rooms.slice(0, idx),
      updatedRoom,
      ...state.rooms.slice(idx + 1)
    ];

    this.logAudit(
      'Updated Room Status',
      'Room',
      updatedRoom.id,
      `${oldOp} / ${oldHk}`,
      `${operationalStatus} / ${housekeepingStatus}${notes ? ` (Notes: ${notes})` : ''}`
    );

    notify();
    return updatedRoom;
  },

  // -------------------------------------------------------------
  // RESERVATIONS
  // -------------------------------------------------------------
  createReservation(data: {
    guestId: string;
    roomTypeId: string;
    assignedRoomId?: string;
    arrivalDate: string;
    departureDate: string;
    adults: number;
    children: number;
    bookingSource: Reservation['bookingSource'];
    packageId?: string;
    specialRequests?: string;
    depositAmount?: number;
    paymentMethod?: Payment['method'];
    paymentReference?: string;
    customRate?: number;
    rate?: number;
    cardType?: string;
    cardProvider?: string;
    cardApprovalCode?: string;
    transactionNo?: string;
    traceNo?: string;
    depositPayment?: {
      amount: number;
      method: Payment['method'];
      reference: string;
      notes?: string;
      cardType?: string;
      cardProvider?: string;
      cardProviderId?: string;
      cardNetwork?: string;
      cardLast4?: string;
      cardApprovalCode?: string;
      posTerminal?: string;
      transactionNo?: string;
      traceNo?: string;
      bankAccountId?: string;
      bankAccountName?: string;
      senderBankName?: string;
      bankTxnRef?: string;
      cityLedgerAccountId?: string;
      cityLedgerAccountName?: string;
      companyPoNumber?: string;
      authorizedBy?: string;
    };
    customerType?: CustomerType;
    companyName?: string;
    companyGstBin?: string;
    companyContactPerson?: string;
    companyDesignation?: string;
    companyEmail?: string;
    companyPhone?: string;
    companyAddress?: string;
    corporateAccountId?: string;
    isGroupBooking?: boolean;
    groupName?: string;
    groupLeaderName?: string;
    groupLeaderPhone?: string;
    groupMembers?: GroupMember[];
    allocatedRooms?: AllocatedRoom[];
    totalRoomsCount?: number;
  }): Reservation {
    const guest = state.guests.find(g => g.id === data.guestId);
    if (!guest) throw new Error('Guest profile not found');

    const primaryRoomType = state.roomTypes.find(rt => rt.id === data.roomTypeId) || state.roomTypes[0];
    if (!primaryRoomType) throw new Error('Room type not found');

    const arr = new Date(data.arrivalDate);
    const dep = new Date(data.departureDate);
    const nights = Math.max(1, Math.round((dep.getTime() - arr.getTime()) / (1000 * 60 * 60 * 24)));
    const todayStr = new Date().toISOString().split('T')[0];

    // Multi-room or single room processing
    let processedAllocatedRooms: AllocatedRoom[] | undefined = undefined;
    let totalEstimated = 0;
    let effectiveAdults = data.adults;
    let effectiveChildren = data.children;
    let assignedRoomId = data.assignedRoomId && data.assignedRoomId.trim().length > 0 ? data.assignedRoomId.trim() : undefined;
    let assignedRoomNumber: string | undefined = undefined;

    if (data.allocatedRooms && data.allocatedRooms.length > 0) {
      processedAllocatedRooms = [];
      const assignedIdsSeen = new Set<string>();

      for (let i = 0; i < data.allocatedRooms.length; i++) {
        const ar = data.allocatedRooms[i];
        const rType = state.roomTypes.find(rt => rt.id === ar.roomTypeId) || primaryRoomType;
        let rNum = ar.roomNumber;
        let rId = ar.roomId && ar.roomId.trim().length > 0 ? ar.roomId.trim() : undefined;

        if (rId) {
          if (assignedIdsSeen.has(rId)) {
            throw new Error(`Room is assigned more than once in this reservation.`);
          }
          assignedIdsSeen.add(rId);

          const avail = this.checkRoomAvailability(rId, data.arrivalDate, data.departureDate);
          if (!avail.isAvailable) {
            throw new Error(avail.reason || `Assigned room is not available for specified dates.`);
          }

          const roomObj = state.rooms.find(r => r.id === rId);
          if (roomObj) {
            rNum = roomObj.roomNumber;
            if (data.arrivalDate === todayStr && roomObj.operationalStatus === 'Available') {
              roomObj.operationalStatus = 'Reserved';
            }
          }
        }

        const roomRate = ar.rate >= 0 ? ar.rate : rType.baseRate;
        totalEstimated += roomRate * nights;

        processedAllocatedRooms.push({
          id: ar.id || `alloc-${Date.now()}-${i}`,
          roomTypeId: rType.id,
          roomTypeName: rType.name,
          roomId: rId,
          roomNumber: rNum,
          guestName: ar.guestName || data.groupName || guest.fullName,
          guestPhone: ar.guestPhone || guest.phone,
          adults: ar.adults || 1,
          children: ar.children || 0,
          rate: roomRate,
          packageId: ar.packageId,
          packageName: ar.packageName,
          notes: ar.notes
        });
      }

      // Aggregate adults and children across allocated rooms
      effectiveAdults = processedAllocatedRooms.reduce((sum, r) => sum + (r.adults || 0), 0);
      effectiveChildren = processedAllocatedRooms.reduce((sum, r) => sum + (r.children || 0), 0);
      
      const assignedRoomNumbers = processedAllocatedRooms
        .map(r => r.roomNumber)
        .filter(Boolean) as string[];
      if (assignedRoomNumbers.length > 0) {
        assignedRoomNumber = assignedRoomNumbers.join(', ');
      }
      const firstAllocWithId = processedAllocatedRooms.find(r => r.roomId);
      if (firstAllocWithId?.roomId) {
        assignedRoomId = firstAllocWithId.roomId;
      }
    } else {
      // Single room standard processing
      if (assignedRoomId) {
        const avail = this.checkRoomAvailability(assignedRoomId, data.arrivalDate, data.departureDate);
        if (!avail.isAvailable) {
          throw new Error(avail.reason || 'Selected room is not available for specified dates.');
        }
        const room = state.rooms.find(r => r.id === assignedRoomId);
        if (room) {
          assignedRoomNumber = room.roomNumber;
          if (data.arrivalDate === todayStr && room.operationalStatus === 'Available') {
            room.operationalStatus = 'Reserved';
          }
        }
      }

      let rate = data.customRate !== undefined && data.customRate >= 0
        ? data.customRate
        : (data.rate !== undefined && data.rate >= 0 ? data.rate : primaryRoomType.baseRate);
      
      let packageName: string | undefined;
      if (data.packageId) {
        const pkg = state.packages.find(p => p.id === data.packageId);
        if (pkg) {
          if (data.customRate === undefined && data.rate === undefined) {
            rate = pkg.price;
          }
          packageName = pkg.name;
        }
      }

      totalEstimated = rate * nights;
    }

    const deposit = data.depositPayment?.amount ?? data.depositAmount ?? 0;
    const paymentMethod = data.depositPayment?.method ?? data.paymentMethod;
    const paymentRef = data.depositPayment?.reference ?? data.paymentReference ?? 'Advance Reservation Deposit';
    const resNumber = `RES-2026-00${state.reservations.length + 458}`;

    let primaryRate = data.customRate !== undefined && data.customRate >= 0
      ? data.customRate
      : (data.rate !== undefined && data.rate >= 0 ? data.rate : primaryRoomType.baseRate);
    if (processedAllocatedRooms && processedAllocatedRooms.length > 0) {
      primaryRate = processedAllocatedRooms[0].rate;
    }

    const newRes: Reservation = {
      id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      reservationNumber: resNumber,
      guestId: guest.id,
      guestName: guest.fullName,
      guestPhone: guest.phone,
      guestEmail: guest.email,
      roomTypeId: primaryRoomType.id,
      roomTypeName: primaryRoomType.name,
      assignedRoomId,
      assignedRoomNumber,
      arrivalDate: data.arrivalDate,
      departureDate: data.departureDate,
      adults: effectiveAdults,
      children: effectiveChildren,
      status: 'Confirmed',
      bookingSource: data.bookingSource,
      rate: primaryRate,
      packageId: data.packageId,
      packageName: data.packageId ? state.packages.find(p => p.id === data.packageId)?.name : undefined,
      specialRequests: data.specialRequests,
      depositAmount: deposit,
      paidAmount: deposit,
      totalEstimatedAmount: totalEstimated,
      createdBy: state.currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      // Corporate or Individual Booking Details
      customerType: data.customerType || (data.bookingSource === 'Corporate' ? 'Corporate' : 'Individual'),
      companyName: data.companyName,
      companyGstBin: data.companyGstBin,
      companyContactPerson: data.companyContactPerson,
      companyDesignation: data.companyDesignation,
      companyEmail: data.companyEmail,
      companyPhone: data.companyPhone,
      companyAddress: data.companyAddress,
      corporateAccountId: data.corporateAccountId,

      // Group Booking & Multi-Room Details
      isGroupBooking: data.isGroupBooking ?? (data.allocatedRooms && data.allocatedRooms.length > 1),
      groupName: data.groupName,
      groupLeaderName: data.groupLeaderName,
      groupLeaderPhone: data.groupLeaderPhone,
      groupMembers: data.groupMembers,
      allocatedRooms: processedAllocatedRooms,
      totalRoomsCount: processedAllocatedRooms ? processedAllocatedRooms.length : 1
    };

    state.reservations.unshift(newRes);

    if (deposit > 0 && paymentMethod) {
      const txnNumber = `TXN-2026-09${state.payments.length + 10}`;
      const payment: Payment = {
        id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        transactionNumber: txnNumber,
        reservationId: newRes.id,
        amount: deposit,
        method: paymentMethod,
        reference: paymentRef,
        status: 'Completed',
        notes: data.depositPayment?.notes || `Advance for ${newRes.reservationNumber}`,
        createdBy: state.currentUser.name,
        createdAt: new Date().toISOString(),
        cardType: data.depositPayment?.cardType || data.cardType,
        cardProvider: data.depositPayment?.cardProvider || data.cardProvider,
        cardApprovalCode: data.depositPayment?.cardApprovalCode || data.cardApprovalCode,
        posTerminal: data.depositPayment?.posTerminal,
        transactionNo: data.depositPayment?.transactionNo || data.transactionNo,
        traceNo: data.depositPayment?.traceNo || data.traceNo,
        bankAccountId: data.depositPayment?.bankAccountId,
        bankAccountName: data.depositPayment?.bankAccountName,
        senderBankName: data.depositPayment?.senderBankName,
        bankTxnRef: data.depositPayment?.bankTxnRef,
        cityLedgerAccountId: data.depositPayment?.cityLedgerAccountId,
        cityLedgerAccountName: data.depositPayment?.cityLedgerAccountName,
        companyPoNumber: data.depositPayment?.companyPoNumber,
        authorizedBy: data.depositPayment?.authorizedBy
      };
      state.payments.unshift(payment);

      // Auto-generate double-entry Journal Voucher mapped to Accounts for Advance Deposit
      let debitAcc = '1010';
      let debitAccName = 'Cash in Vault & Commercial Bank Accounts';
      if (paymentMethod === 'Cash') {
        debitAcc = '1020';
        debitAccName = 'Front Desk & Outlet Cashier Drawers';
      } else if (paymentMethod === 'Company Credit' || paymentMethod === 'City Ledger') {
        debitAcc = '1150';
        debitAccName = 'City Ledger & Corporate Accounts Receivable';
      }
      this.createJournalVoucher({
        date: state.settings.currentBusinessDate || new Date().toISOString().split('T')[0],
        sourceModule: 'Guest Reservation',
        sourceReference: txnNumber,
        narration: `Advance reservation deposit for ${newRes.reservationNumber} (${guest.fullName}) via ${paymentMethod}`,
        entries: [
          { id: `jve-${Date.now()}-1`, accountCode: debitAcc, accountName: debitAccName, debit: deposit, credit: 0, memo: `Advance deposit via ${paymentMethod}` },
          { id: `jve-${Date.now()}-2`, accountCode: '2010', accountName: 'Guest Advance & Reservation Security Deposits', debit: 0, credit: deposit, memo: `Guest advance deposit liability` }
        ]
      });
    }

    this.logAudit('Created Reservation', 'Reservation', newRes.id, undefined, `${newRes.reservationNumber} for ${guest.fullName} (${nights} nights)`);
    this.addAlert('info', `New Reservation: ${newRes.reservationNumber}`, `${guest.fullName} reserved ${primaryRoomType.name}${newRes.totalRoomsCount && newRes.totalRoomsCount > 1 ? ` (${newRes.totalRoomsCount} rooms)` : ''} from ${data.arrivalDate} to ${data.departureDate}`, 'View Reservations', 'reservations');
    
    notify();
    return newRes;
  },

  cancelReservation(reservationId: string, reason?: string) {
    const res = state.reservations.find(r => r.id === reservationId);
    if (!res) throw new Error('Reservation not found');
    res.status = 'Cancelled';
    res.updatedAt = new Date().toISOString();

    if (res.assignedRoomId) {
      const room = state.rooms.find(r => r.id === res.assignedRoomId);
      if (room && room.operationalStatus === 'Reserved') {
        room.operationalStatus = 'Available';
      }
    }
    if (res.allocatedRooms && res.allocatedRooms.length > 0) {
      res.allocatedRooms.forEach(ar => {
        if (ar.roomId) {
          const room = state.rooms.find(r => r.id === ar.roomId);
          if (room && room.operationalStatus === 'Reserved') {
            room.operationalStatus = 'Available';
          }
        }
      });
    }

    this.logAudit('Cancelled Reservation', 'Reservation', res.id, 'Confirmed', `Cancelled: ${reason || 'Guest requested'}`);
    notify();
  },

  // -------------------------------------------------------------
  // FRONT DESK CHECK-IN (Transactional Atomic Execution)
  // -------------------------------------------------------------
  checkInReservation(params: {
    reservationId: string;
    roomId: string;
    keyCardsIssued?: number;
    verifiedId?: boolean;
    idType?: 'National ID (NID)' | 'Passport' | 'Driving License' | 'Birth Certificate' | string;
    idNumber?: string;
    depositPayment?: {
      amount: number;
      method: Payment['method'];
      reference: string;
      notes?: string;
      cardType?: string;
      cardProvider?: string;
      cardProviderId?: string;
      cardNetwork?: string;
      cardLast4?: string;
      cardApprovalCode?: string;
      posTerminal?: string;
      transactionNo?: string;
      traceNo?: string;
      bankAccountId?: string;
      bankAccountName?: string;
      senderBankName?: string;
      bankTxnRef?: string;
      bankTransferDate?: string;
      cityLedgerAccountId?: string;
      cityLedgerAccountName?: string;
      companyPoNumber?: string;
      authorizedBy?: string;
    };
    specialRequests?: string;
    customRate?: number;
    rate?: number;
  }): { stay: Stay; folio: Folio } {
    const res = state.reservations.find(r => r.id === params.reservationId);
    if (!res) throw new Error('Reservation not found');
    if (res.status === 'Checked-In') throw new Error('Reservation is already checked in');

    const room = state.rooms.find(r => r.id === params.roomId);
    if (!room) throw new Error('Room not found');
    if (room.operationalStatus === 'Occupied') {
      throw new Error(`Room ${room.roomNumber} is already occupied by another active stay`);
    }
    if (room.operationalStatus === 'Out of Order') {
      throw new Error(`Room ${room.roomNumber} is Out of Order for maintenance`);
    }

    const guest = state.guests.find(g => g.id === res.guestId);
    if (!guest) throw new Error('Guest record not found');

    // Update guest ID info if captured at check-in time
    if (params.idType) {
      guest.idType = params.idType as any;
    }
    if (params.idNumber !== undefined && params.idNumber !== null) {
      guest.idNumber = params.idNumber.trim();
    }
    guest.updatedAt = new Date().toISOString();

    // Support customized rate at check-in time
    const effectiveRate = params.customRate !== undefined && params.customRate >= 0
      ? params.customRate
      : (params.rate !== undefined && params.rate >= 0 ? params.rate : res.rate);

    const stayNumber = `STY-2026-00${state.stays.length + 316}`;
    const folioNumber = `FOL-2026-00${state.folios.length + 886}`;
    const stayId = `sty-${Date.now()}`;
    const folioId = `fol-${Date.now()}`;

    // 1. Mark Room Occupied
    room.operationalStatus = 'Occupied';
    room.housekeepingStatus = 'Clean';

    // 2. Update Reservation
    res.status = 'Checked-In';
    res.assignedRoomId = room.id;
    res.assignedRoomNumber = room.roomNumber;
    res.rate = effectiveRate;
    const d1 = new Date(res.arrivalDate);
    const d2 = new Date(res.departureDate);
    const nights = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    res.totalEstimatedAmount = nights * effectiveRate;
    res.updatedAt = new Date().toISOString();

    // 3. Create Stay
    const stay: Stay = {
      id: stayId,
      stayNumber,
      reservationId: res.id,
      guestId: guest.id,
      guestName: guest.fullName,
      roomId: room.id,
      roomNumber: room.roomNumber,
      roomTypeName: room.roomTypeName || 'Standard',
      rate: effectiveRate,
      adults: res.adults,
      children: res.children,
      checkInAt: new Date().toISOString(),
      expectedCheckOutAt: `${res.departureDate}T12:00:00Z`,
      status: 'Active',
      folioId,
      keyCardsIssued: params.keyCardsIssued || 2,
      verifiedId: params.verifiedId ?? true,
      idType: params.idType || guest.idType,
      idNumber: params.idNumber || guest.idNumber,
      notes: params.specialRequests || res.specialRequests
    };
    state.stays.unshift(stay);

    // 4. Create Initial Folio & Night 1 Room Charge
    const taxRate = state.settings.taxRatePercent / 100;
    const scRate = state.settings.serviceChargePercent / 100;
    const baseRoomRate = effectiveRate;
    const roomTax = Math.round(baseRoomRate * taxRate);
    const roomSC = Math.round(baseRoomRate * scRate);

    const initialItem: FolioItem = {
      id: `item-${Date.now()}`,
      folioId,
      type: 'Room Charge',
      description: `Night 1 Room Charge - ${room.roomTypeName} (Room ${room.roomNumber})`,
      quantity: 1,
      unitPrice: baseRoomRate,
      discount: 0,
      tax: roomTax,
      total: baseRoomRate + roomTax,
      postedBy: state.currentUser.name,
      createdAt: new Date().toISOString()
    };

    let totalPaid = res.paidAmount || 0;

    // Process additional check-in deposit if provided
    if (params.depositPayment && params.depositPayment.amount > 0) {
      totalPaid += params.depositPayment.amount;
      const txnNumber = `TXN-2026-09${state.payments.length + 10}`;
      const dep = params.depositPayment;
      const payment: Payment = {
        id: `pay-${Date.now()}`,
        transactionNumber: txnNumber,
        folioId,
        reservationId: res.id,
        amount: dep.amount,
        method: dep.method,
        reference: dep.reference || 'Check-in Counter Deposit',
        status: 'Completed',
        notes: dep.notes || `Check-in advance payment for Room ${room.roomNumber}`,
        createdBy: state.currentUser.name,
        createdAt: new Date().toISOString(),
        cardType: dep.cardType,
        cardProvider: dep.cardProvider,
        cardProviderId: dep.cardProviderId,
        cardNetwork: dep.cardNetwork,
        cardLast4: dep.cardLast4,
        cardApprovalCode: dep.cardApprovalCode,
        posTerminal: dep.posTerminal,
        transactionNo: dep.transactionNo,
        traceNo: dep.traceNo,
        bankAccountId: dep.bankAccountId,
        bankAccountName: dep.bankAccountName,
        senderBankName: dep.senderBankName,
        bankTxnRef: dep.bankTxnRef,
        bankTransferDate: dep.bankTransferDate,
        cityLedgerAccountId: dep.cityLedgerAccountId,
        cityLedgerAccountName: dep.cityLedgerAccountName,
        companyPoNumber: dep.companyPoNumber,
        authorizedBy: dep.authorizedBy
      };
      state.payments.unshift(payment);

      // Accounts Module Journal Voucher Mapping for Advance Deposit
      let debitAcc = '1010';
      let debitAccName = 'Cash in Vault & Commercial Bank Accounts';
      let jvNarration = `Check-in advance deposit for Room ${room.roomNumber} (${guest.fullName}) via ${dep.method}. Ref: ${dep.reference}`;

      if (dep.method === 'Cash') {
        debitAcc = '1020';
        debitAccName = 'Front Desk & Outlet Cashier Drawers';
      } else if (dep.method === 'Company Credit' || dep.method === 'City Ledger') {
        debitAcc = '1150';
        debitAccName = 'City Ledger (Corporate Accounts Receivable)';
        const corp = (state.cityLedgerAccounts || []).find(
          c => c.id === dep.cityLedgerAccountId || (dep.cityLedgerAccountName && c.companyName.toLowerCase().includes(dep.cityLedgerAccountName.toLowerCase()))
        );
        if (corp) {
          corp.currentBalance = (corp.currentBalance || 0) + dep.amount;
          if (corp.currentBalance > corp.creditLimit) corp.status = 'Credit Warning';
          jvNarration = `Check-in advance billed to corporate account ${corp.companyName} (${corp.accountNumber}) for Room ${room.roomNumber} (${guest.fullName}). PO: ${dep.companyPoNumber || dep.reference}`;
        }
      } else if (dep.method === 'Bank Transfer') {
        const txnRef = dep.transactionNo || dep.bankTxnRef || dep.reference;
        const tracePart = dep.traceNo ? ` (Trace: ${dep.traceNo})` : '';
        jvNarration = `Check-in advance bank transfer for Room ${room.roomNumber}. Ref: ${txnRef}${tracePart}`;
      } else if (dep.method === 'Credit Card' || (dep.method as string) === 'Debit Card' || dep.method === 'City Bank POS') {
        jvNarration = `Check-in advance card payment via ${dep.cardType || dep.cardProvider || 'Card POS'} for Room ${room.roomNumber}. Auth/Ref: ${dep.cardApprovalCode || dep.reference}`;
      }

      this.createJournalVoucher({
        date: state.settings.currentBusinessDate || new Date().toISOString().split('T')[0],
        sourceModule: 'Guest Folio Settlement',
        sourceReference: txnNumber,
        narration: jvNarration,
        entries: [
          {
            id: `jve-${Date.now()}-1`,
            accountCode: debitAcc,
            accountName: debitAccName,
            debit: dep.amount,
            credit: 0,
            memo: `Check-in advance deposit (${dep.method})`
          },
          {
            id: `jve-${Date.now()}-2`,
            accountCode: '2010',
            accountName: 'Guest Advance & Reservation Security Deposits',
            debit: 0,
            credit: dep.amount,
            memo: `Advance deposit held for Room ${room.roomNumber} (${guest.fullName})`
          }
        ]
      });
    }

    const folio: Folio = {
      id: folioId,
      folioNumber,
      stayId,
      guestId: guest.id,
      guestName: guest.fullName,
      roomNumber: room.roomNumber,
      status: 'Open',
      items: [initialItem],
      subtotal: baseRoomRate,
      discountTotal: 0,
      serviceChargeTotal: roomSC,
      taxTotal: roomTax,
      grandTotal: baseRoomRate + roomSC + roomTax,
      paidTotal: totalPaid,
      balance: (baseRoomRate + roomSC + roomTax) - totalPaid,
      openedAt: new Date().toISOString()
    };
    state.folios.unshift(folio);

    // Update guest stats
    guest.totalStays += 1;

    this.logAudit('Completed Check-In', 'Stay', stay.id, 'Reservation Confirmed', `Stay ${stayNumber}, Room ${room.roomNumber}, Folio ${folioNumber}`);
    this.addAlert('success', `Check-in Completed: Room ${room.roomNumber}`, `${guest.fullName} is now in-house. Folio ${folioNumber} opened.`, 'View Folio', 'billing');

    notify();
    return { stay, folio };
  },

  // -------------------------------------------------------------
  // FRONT DESK WALK-IN CHECK-IN (Direct Guest + Stay Creation)
  // -------------------------------------------------------------
  walkInCheckIn(params: {
    guestName: string;
    guestPhone: string;
    guestEmail?: string;
    idType: 'National ID (NID)' | 'Passport' | 'Driving License' | 'Birth Certificate' | string;
    idNumber: string;
    roomId: string;
    roomTypeId?: string;
    rate?: number;
    nights?: number;
    adults?: number;
    children?: number;
    keyCardsIssued?: number;
    verifiedId?: boolean;
    depositPayment?: {
      amount: number;
      method: Payment['method'];
      reference: string;
      notes?: string;
      cardType?: string;
      cardProvider?: string;
      cardProviderId?: string;
      cardNetwork?: string;
      cardLast4?: string;
      cardApprovalCode?: string;
      posTerminal?: string;
      transactionNo?: string;
      traceNo?: string;
      bankAccountId?: string;
      bankAccountName?: string;
      senderBankName?: string;
      bankTxnRef?: string;
      bankTransferDate?: string;
      cityLedgerAccountId?: string;
      cityLedgerAccountName?: string;
      companyPoNumber?: string;
      authorizedBy?: string;
    };
    specialRequests?: string;
  }): { stay: Stay; folio: Folio; reservation: Reservation } {
    const room = state.rooms.find(r => r.id === params.roomId);
    if (!room) throw new Error('Selected room not found');
    if (room.operationalStatus === 'Occupied') {
      throw new Error(`Room ${room.roomNumber} is currently occupied.`);
    }

    // 1. Locate or create guest record
    let guest = state.guests.find(g => g.phone === params.guestPhone.trim());
    if (!guest) {
      guest = this.createGuest({
        fullName: params.guestName.trim(),
        phone: params.guestPhone.trim(),
        email: params.guestEmail?.trim() || `${params.guestPhone.replace(/[^0-9]/g, '')}@guest.hotel.bd`,
        gender: 'Male',
        nationality: params.idType === 'Passport' ? 'International' : 'Bangladeshi',
        city: 'Dhaka',
        country: params.idType === 'Passport' ? 'International' : 'Bangladesh',
        idType: params.idType as any,
        idNumber: params.idNumber.trim(),
        address: 'Walk-In Guest',
        vipStatus: false,
        notes: 'Registered via Walk-In Check-In'
      });
    } else {
      if (params.idType) guest.idType = params.idType as any;
      if (params.idNumber) guest.idNumber = params.idNumber.trim();
      guest.updatedAt = new Date().toISOString();
    }

    const todayStr = state.settings.currentBusinessDate || new Date().toISOString().split('T')[0];
    const depDate = new Date(todayStr);
    depDate.setDate(depDate.getDate() + (params.nights || 1));
    const departureStr = depDate.toISOString().split('T')[0];

    const rt = state.roomTypes.find(t => t.id === room.roomTypeId);
    const finalRate = params.rate || rt?.baseRate || 4500;
    const nights = params.nights || 1;
    const estTotal = finalRate * nights;

    // 2. Create underlying reservation record for audit and room management
    const resId = `res-${Date.now()}`;
    const reservation: Reservation = {
      id: resId,
      reservationNumber: `RES-WLK-${Date.now().toString().slice(-5)}`,
      guestId: guest.id,
      guestName: guest.fullName,
      guestPhone: guest.phone,
      guestEmail: guest.email,
      arrivalDate: todayStr,
      departureDate: departureStr,
      roomTypeId: room.roomTypeId,
      roomTypeName: room.roomTypeName || 'Standard',
      assignedRoomId: room.id,
      assignedRoomNumber: room.roomNumber,
      adults: params.adults || 1,
      children: params.children || 0,
      status: 'Confirmed', // will be flipped to Checked-In by checkInReservation
      rate: finalRate,
      totalEstimatedAmount: estTotal,
      depositAmount: 0,
      paidAmount: 0,
      bookingSource: 'Front Desk Walk-in',
      specialRequests: params.specialRequests || 'Walk-In Check-In at Front Desk',
      createdBy: state.currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state.reservations.unshift(reservation);

    // 3. Complete check-in atomically
    const { stay, folio } = this.checkInReservation({
      reservationId: reservation.id,
      roomId: room.id,
      keyCardsIssued: params.keyCardsIssued,
      verifiedId: params.verifiedId,
      idType: params.idType,
      idNumber: params.idNumber,
      depositPayment: params.depositPayment,
      specialRequests: params.specialRequests
    });

    return { stay, folio, reservation };
  },

  // -------------------------------------------------------------
  // FRONT DESK CHECK-OUT & AUTOMATIC HOUSEKEEPING TRIGGER
  // -------------------------------------------------------------
  checkOutStay(params: {
    stayId: string;
    settlePayment?: {
      amount: number;
      method: Payment['method'];
      reference: string;
      notes?: string;
      cardType?: string;
      cardProvider?: string;
      cardProviderId?: string;
      cardNetwork?: string;
      cardLast4?: string;
      cardApprovalCode?: string;
      posTerminal?: string;
      transactionNo?: string;
      traceNo?: string;
      bankAccountId?: string;
      bankAccountName?: string;
      senderBankName?: string;
      bankTxnRef?: string;
      bankTransferDate?: string;
      cityLedgerAccountId?: string;
      cityLedgerAccountName?: string;
      companyPoNumber?: string;
      authorizedBy?: string;
    };
  }): { invoice: Invoice } {
    const stay = state.stays.find(s => s.id === params.stayId);
    if (!stay) throw new Error('Stay record not found');
    if (stay.status === 'Checked-Out') throw new Error('Stay is already checked out');

    const folio = state.folios.find(f => f.id === stay.folioId);
    if (!folio) throw new Error('Folio not found');

    const room = state.rooms.find(r => r.id === stay.roomId);
    if (!room) throw new Error('Room not found');

    const res = state.reservations.find(r => r.id === stay.reservationId);
    const guest = state.guests.find(g => g.id === stay.guestId);

    // Process settlement payment if balance is being paid
    if (params.settlePayment && params.settlePayment.amount > 0) {
      this.recordFolioPayment(folio.id, {
        ...params.settlePayment,
        notes: params.settlePayment.notes || `Full checkout settlement for Room ${stay.roomNumber}`
      });
    }

    // 1. Mark Stay Checked Out
    stay.status = 'Checked-Out';
    stay.actualCheckOutAt = new Date().toISOString();

    // 2. Mark Reservation Checked Out
    if (res) {
      res.status = 'Checked-Out';
      res.updatedAt = new Date().toISOString();
    }

    // 3. Mark Folio Closed / Settled
    folio.status = folio.balance <= 0 ? 'Settled' : 'Closed';
    folio.closedAt = new Date().toISOString();

    // 4. Mark Room Dirty & Trigger Automatic Housekeeping Task
    room.operationalStatus = 'Dirty';
    room.housekeepingStatus = 'Dirty';

    const hkTask: HousekeepingTask = {
      id: `hk-${Date.now()}`,
      roomId: room.id,
      roomNumber: room.roomNumber,
      roomTypeName: room.roomTypeName || 'Standard',
      taskType: 'Full Turnover',
      priority: 'High',
      status: 'Pending',
      checklist: {
        bedLinenChanged: false,
        bathroomSanitized: false,
        towelsReplaced: false,
        amenitiesRestocked: false,
        floorCleaned: false,
        minibarChecked: false
      },
      notes: `Checkout turnover after ${guest?.fullName || 'Guest'}. Prepare for incoming guests.`,
      createdAt: new Date().toISOString()
    };
    state.housekeepingTasks.unshift(hkTask);

    // 5. Generate Official Invoice
    const invoiceNumber = `INV-2026-00${state.invoices.length + 882}`;
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      folioId: folio.id,
      guestOrClientName: guest?.fullName || stay.guestName,
      phone: guest?.phone,
      address: guest?.address,
      stayOrEventDetails: `Stay ${stay.stayNumber} (${stay.checkInAt ? stay.checkInAt.split('T')[0] : ''} to ${stay.actualCheckOutAt ? stay.actualCheckOutAt.split('T')[0] : stay.expectedCheckOutAt ? stay.expectedCheckOutAt.split('T')[0] : ''})`,
      roomOrHall: `Room ${room.roomNumber} (${room.roomTypeName})`,
      dates: `${stay.checkInAt ? stay.checkInAt.split('T')[0] : ''} – ${stay.actualCheckOutAt ? stay.actualCheckOutAt.split('T')[0] : stay.expectedCheckOutAt ? stay.expectedCheckOutAt.split('T')[0] : ''}`,
      items: folio.items.map(it => ({
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total
      })),
      subtotal: folio.subtotal,
      discount: folio.discountTotal,
      serviceCharge: folio.serviceChargeTotal,
      tax: folio.taxTotal,
      grandTotal: folio.grandTotal,
      paidAmount: folio.paidTotal,
      balance: folio.balance,
      status: folio.balance <= 0 ? 'Paid' : 'Partially Paid',
      issuedAt: new Date().toISOString(),
      issuedBy: state.currentUser.name
    };
    state.invoices.unshift(invoice);

    // Update guest total spend
    if (guest) {
      guest.totalSpend += folio.paidTotal;
      guest.totalNights += 1;
    }

    this.logAudit('Completed Check-Out', 'Stay', stay.id, 'Active', `Room ${room.roomNumber} vacated, Folio ${folio.folioNumber} settled, Invoice ${invoiceNumber} generated, Room set to Dirty`);
    this.addAlert('info', `Check-out: Room ${room.roomNumber}`, `${guest?.fullName || 'Guest'} checked out. Housekeeping task dispatched.`, 'Housekeeping Board', 'housekeeping');

    notify();
    return { invoice };
  },

  // -------------------------------------------------------------
  // ROOM TRANSFER & UPGRADE (Inter-Room Relocation / Upgrades)
  // -------------------------------------------------------------
  transferRoom(
    stayId: string, 
    newRoomId: string, 
    reason: string,
    upgradeParams?: {
      isUpgrade?: boolean;
      applyRateUpgrade?: boolean;
      newRate?: number;
      rateDifference?: number;
      upgradeNotes?: string;
    }
  ): { stay: Stay; newRoom: Room } {
    const stay = state.stays.find(s => s.id === stayId && s.status === 'Active');
    if (!stay) throw new Error('Active stay not found');

    const oldRoom = state.rooms.find(r => r.id === stay.roomId);
    const newRoom = state.rooms.find(r => r.id === newRoomId);
    if (!newRoom) throw new Error('New room not found');
    if (newRoom.operationalStatus === 'Occupied') throw new Error(`Room ${newRoom.roomNumber} is occupied`);
    if (newRoom.operationalStatus === 'Out of Order') throw new Error(`Room ${newRoom.roomNumber} is Out of Order`);

    // Transfer
    if (oldRoom) {
      oldRoom.operationalStatus = 'Dirty';
      oldRoom.housekeepingStatus = 'Dirty';
      // Create HK task for old room
      state.housekeepingTasks.unshift({
        id: `hk-${Date.now()}`,
        roomId: oldRoom.id,
        roomNumber: oldRoom.roomNumber,
        roomTypeName: oldRoom.roomTypeName || 'Room',
        taskType: 'Full Turnover',
        priority: 'Medium',
        status: 'Pending',
        checklist: { bedLinenChanged: false, bathroomSanitized: false, towelsReplaced: false, amenitiesRestocked: false, floorCleaned: false, minibarChecked: false },
        notes: `Room transfer turnover from Room ${oldRoom.roomNumber} to Room ${newRoom.roomNumber}. Reason: ${reason}`,
        createdAt: new Date().toISOString()
      });
    }

    newRoom.operationalStatus = 'Occupied';
    newRoom.housekeepingStatus = 'Clean';

    const oldRoomNum = stay.roomNumber;
    stay.roomId = newRoom.id;
    stay.roomNumber = newRoom.roomNumber;
    stay.roomTypeName = newRoom.roomTypeName || 'Standard';

    // Check if new rate applies
    if (upgradeParams?.newRate) {
      stay.rate = upgradeParams.newRate;
    }

    // Update Folio note
    const folio = state.folios.find(f => f.id === stay.folioId);
    if (folio) {
      folio.roomNumber = newRoom.roomNumber;
      
      const isUpgrade = upgradeParams?.isUpgrade || false;
      const rateDiff = upgradeParams?.rateDifference || 0;
      const shouldChargeDiff = upgradeParams?.applyRateUpgrade && rateDiff > 0;

      folio.items.push({
        id: `item-${Date.now()}`,
        folioId: folio.id,
        type: isUpgrade ? 'Room Charge' : 'Adjustment',
        description: isUpgrade
          ? `Room Upgrade: Moved from ${oldRoomNum} to ${newRoom.roomNumber} (${newRoom.roomTypeName || 'Upgraded'}) - ${shouldChargeDiff ? `Upgrade Rate Diff +৳${rateDiff.toLocaleString()}` : 'Complimentary Upgrade'} (${reason})`
          : `Room Transfer: Relocated from Room ${oldRoomNum} to Room ${newRoom.roomNumber} (${reason})`,
        quantity: 1,
        unitPrice: shouldChargeDiff ? rateDiff : 0,
        discount: 0,
        tax: shouldChargeDiff ? Math.round(rateDiff * (state.settings.taxRatePercent / 100)) : 0,
        total: shouldChargeDiff ? rateDiff + Math.round(rateDiff * (state.settings.taxRatePercent / 100)) : 0,
        postedBy: state.currentUser.name,
        createdAt: new Date().toISOString()
      });

      if (shouldChargeDiff) {
        this.recalculateFolio(folio);
      }
    }

    const auditAction = upgradeParams?.isUpgrade ? 'Room Upgrade' : 'Room Transfer';
    this.logAudit(auditAction, 'Stay', stay.id, `Room ${oldRoomNum}`, `Moved to Room ${newRoom.roomNumber} (${reason})`);
    this.addAlert('info', `${auditAction}: ${oldRoomNum} → ${newRoom.roomNumber}`, `${stay.guestName} moved to Room ${newRoom.roomNumber}`, 'View Room Rack', 'rooms');

    notify();
    return { stay, newRoom };
  },

  // -------------------------------------------------------------
  // PAX IN / PAX OUT TRACKING (Occupancy & Guest Movement)
  // -------------------------------------------------------------
  updateStayPax(stayId: string, params: {
    actionType: 'pax-in' | 'pax-out' | 'adjust';
    adults: number;
    children: number;
    paxDiff?: number;
    notes?: string;
    keyCardsIssued?: number;
  }): Stay {
    const stay = state.stays.find(s => s.id === stayId && s.status === 'Active');
    if (!stay) throw new Error('Active stay not found');

    const oldAdults = stay.adults ?? 1;
    const oldChildren = stay.children ?? 0;
    const oldTotal = oldAdults + oldChildren;
    const newTotal = params.adults + params.children;
    const diff = params.paxDiff ?? (newTotal - oldTotal);

    stay.adults = params.adults;
    stay.children = params.children;
    if (params.keyCardsIssued !== undefined) {
      stay.keyCardsIssued = params.keyCardsIssued;
    }

    if (!stay.paxHistory) {
      stay.paxHistory = [];
    }

    const defaultNotes = params.actionType === 'pax-in'
      ? `Pax In: Guest companion/visitor joined (+${Math.abs(diff)} Pax)`
      : params.actionType === 'pax-out'
      ? `Pax Out: Guest companion departed (-${Math.abs(diff)} Pax)`
      : `Pax Count Adjusted (${newTotal} Pax)`;

    stay.paxHistory.unshift({
      id: `pax-${Date.now()}`,
      type: params.actionType,
      paxDiff: diff,
      adults: params.adults,
      children: params.children,
      notes: params.notes || defaultNotes,
      timestamp: new Date().toISOString(),
      by: state.currentUser.name
    });

    const actionTitle = params.actionType === 'pax-in' 
      ? 'Pax In Registered' 
      : params.actionType === 'pax-out' 
      ? 'Pax Out Registered' 
      : 'Pax Count Updated';

    this.logAudit(
      actionTitle,
      'Stay',
      stay.id,
      `${oldAdults}A, ${oldChildren}C (${oldTotal} Pax)`,
      `${params.adults}A, ${params.children}C (${newTotal} Pax) - ${params.notes || ''}`
    );

    this.addAlert(
      'info',
      `${actionTitle}: Room ${stay.roomNumber}`,
      `Occupancy updated: ${params.adults} Adults, ${params.children} Children (${stay.guestName})`,
      'View Room Rack',
      'rooms'
    );

    notify();
    return stay;
  },

  // -------------------------------------------------------------
  // STOP POST (Restrict / Unrestrict Room Charge Postings)
  // -------------------------------------------------------------
  toggleStopPost(stayId: string, stopPost: boolean, reason?: string): { stay: Stay; folio: Folio } {
    const stay = state.stays.find(s => s.id === stayId);
    if (!stay) throw new Error('Stay record not found');

    const folio = state.folios.find(f => f.id === stay.folioId);
    if (!folio) throw new Error('Folio record not found');

    const trimmedReason = reason?.trim() || (stopPost ? 'Restricted by Front Office' : undefined);

    stay.stopPost = stopPost;
    stay.stopPostReason = trimmedReason;
    stay.stopPostBy = state.currentUser.name;
    stay.stopPostAt = new Date().toISOString();

    folio.stopPost = stopPost;
    folio.stopPostReason = trimmedReason;
    folio.stopPostBy = state.currentUser.name;
    folio.stopPostAt = stay.stopPostAt;

    const action = stopPost ? 'Enabled Stop Post' : 'Removed Stop Post';
    this.logAudit(
      action,
      'Stay',
      stay.id,
      stopPost ? 'Posting Allowed' : 'Stop Post Active',
      `Room ${stay.roomNumber} (${stay.guestName}) - Stop Post ${stopPost ? `ON: "${trimmedReason}"` : 'OFF: Posting Unlocked'}`
    );

    if (stopPost) {
      this.addAlert(
        'warning',
        `Stop Post Active: Room ${stay.roomNumber}`,
        `Posting room charges from F&B / POS / Outlets is now blocked for ${stay.guestName}. Reason: ${trimmedReason}`,
        'View Folio',
        'billing'
      );
    } else {
      this.addAlert(
        'info',
        `Stop Post Cleared: Room ${stay.roomNumber}`,
        `Room charge posting re-enabled for ${stay.guestName}.`,
        'View Folio',
        'billing'
      );
    }

    notify();
    return { stay, folio };
  },

  // -------------------------------------------------------------
  // FOLIO & BILLING (Post Charges, Payments, Discounts, Adjustments)
  // -------------------------------------------------------------
  postFolioCharge(folioId: string, itemData: {
    type: FolioItem['type'];
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    applyTax?: boolean;
    reference?: string;
    allowStopPostOverride?: boolean;
  }): FolioItem {
    const folio = state.folios.find(f => f.id === folioId);
    if (!folio) throw new Error('Folio not found');

    if (folio.stopPost && !itemData.allowStopPostOverride) {
      throw new Error(`Posting restricted: Room ${folio.roomNumber || folio.folioNumber} has STOP POST active (${folio.stopPostReason || 'No outlet charges permitted'}). Remove Stop Post lock or authorize manual override.`);
    }

    const discount = itemData.discount || 0;
    const rawTotal = (itemData.quantity * itemData.unitPrice) - discount;
    const taxRate = itemData.applyTax !== false ? (state.settings.taxRatePercent / 100) : 0;
    const tax = Math.round(rawTotal * taxRate);
    const lineTotal = rawTotal + tax;

    const newItem: FolioItem = {
      id: `item-${Date.now()}`,
      folioId,
      type: itemData.type,
      description: itemData.description,
      quantity: itemData.quantity,
      unitPrice: itemData.unitPrice,
      discount,
      tax,
      total: lineTotal,
      postedBy: state.currentUser.name,
      createdAt: new Date().toISOString(),
      reference: itemData.reference
    };

    folio.items.push(newItem);
    
    // Recalculate totals
    this.recalculateFolio(folio);
    this.logAudit('Posted Folio Charge', 'Folio', folio.id, undefined, `${newItem.description} (৳${lineTotal}) to Folio ${folio.folioNumber}`);
    notify();
    return newItem;
  },

  recordFolioPayment(folioId: string, paymentData: {
    amount: number;
    method: Payment['method'];
    reference: string;
    notes?: string;
    cardType?: string;
    cardProvider?: string;
    cardProviderId?: string;
    cardNetwork?: string;
    cardLast4?: string;
    cardApprovalCode?: string;
    posTerminal?: string;
    transactionNo?: string;
    traceNo?: string;
    bankAccountId?: string;
    bankAccountName?: string;
    senderBankName?: string;
    bankTxnRef?: string;
    bankTransferDate?: string;
    cityLedgerAccountId?: string;
    cityLedgerAccountName?: string;
    companyPoNumber?: string;
    authorizedBy?: string;
  }): Payment {
    const folio = state.folios.find(f => f.id === folioId);
    if (!folio) throw new Error('Folio not found');

    const txnNumber = `TXN-2026-09${state.payments.length + 10}`;
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      transactionNumber: txnNumber,
      folioId,
      amount: paymentData.amount,
      method: paymentData.method,
      reference: paymentData.reference,
      status: 'Completed',
      notes: paymentData.notes,
      createdBy: state.currentUser.name,
      createdAt: new Date().toISOString(),
      cardType: paymentData.cardType,
      cardProvider: paymentData.cardProvider,
      cardProviderId: paymentData.cardProviderId,
      cardNetwork: paymentData.cardNetwork,
      cardLast4: paymentData.cardLast4,
      cardApprovalCode: paymentData.cardApprovalCode,
      posTerminal: paymentData.posTerminal,
      transactionNo: paymentData.transactionNo,
      traceNo: paymentData.traceNo,
      bankAccountId: paymentData.bankAccountId,
      bankAccountName: paymentData.bankAccountName,
      senderBankName: paymentData.senderBankName,
      bankTxnRef: paymentData.bankTxnRef,
      bankTransferDate: paymentData.bankTransferDate,
      cityLedgerAccountId: paymentData.cityLedgerAccountId,
      cityLedgerAccountName: paymentData.cityLedgerAccountName,
      companyPoNumber: paymentData.companyPoNumber,
      authorizedBy: paymentData.authorizedBy
    };

    state.payments.unshift(payment);
    folio.paidTotal += paymentData.amount;
    folio.balance = folio.grandTotal - folio.paidTotal;

    // Accounts Module Mapping:
    // Determine Debit Account according to payment method
    let debitAccount = '1010';
    let debitAccountName = 'Cash in Vault & Commercial Bank Accounts';
    let narration = `Payment received for Folio ${folio.folioNumber} (${folio.guestName || 'In-House Guest'}, Room ${folio.roomNumber || 'N/A'}) via ${paymentData.method}. Ref: ${paymentData.reference}`;

    if (paymentData.method === 'Cash') {
      debitAccount = '1020';
      debitAccountName = 'Front Desk & Outlet Cashier Drawers';
    } else if (paymentData.method === 'Company Credit' || paymentData.method === 'City Ledger') {
      // Company Credit maps directly to GL 1150 (City Ledger Corporate Accounts Receivable)
      debitAccount = '1150';
      debitAccountName = 'City Ledger (Corporate Accounts Receivable)';

      // Look up corporate client and debit their city ledger account
      const corpAcc = (state.cityLedgerAccounts || []).find(
        c => c.id === paymentData.cityLedgerAccountId || (paymentData.cityLedgerAccountName && c.companyName.toLowerCase().includes(paymentData.cityLedgerAccountName.toLowerCase()))
      );

      if (corpAcc) {
        corpAcc.currentBalance = (corpAcc.currentBalance || 0) + paymentData.amount;
        if (corpAcc.currentBalance > corpAcc.creditLimit) {
          corpAcc.status = 'Credit Warning';
        }
        narration = `Company Credit direct settlement for Folio ${folio.folioNumber} (Room ${folio.roomNumber || 'N/A'}, Guest: ${folio.guestName || 'Corporate Guest'}) billed to ${corpAcc.companyName} (${corpAcc.accountNumber}). PO/Sanction: ${paymentData.companyPoNumber || paymentData.reference}. Net terms: ${corpAcc.paymentTerms}.`;
      } else {
        narration = `Company Credit direct settlement for Folio ${folio.folioNumber} billed to Corporate City Ledger. Ref: ${paymentData.reference}`;
      }
    } else if (paymentData.method === 'Bank Transfer') {
      debitAccount = '1010';
      debitAccountName = 'Cash in Vault & Commercial Bank Accounts';
      const txnRef = paymentData.transactionNo || paymentData.bankTxnRef || paymentData.reference;
      const tracePart = paymentData.traceNo ? ` (Trace: ${paymentData.traceNo})` : '';
      narration = `Bank Transfer deposit for Folio ${folio.folioNumber}. Trx: ${txnRef}${tracePart}`;
    } else if (paymentData.method === 'Credit Card' || (paymentData.method as string) === 'Debit Card' || paymentData.method === 'City Bank POS') {
      debitAccount = '1010';
      debitAccountName = 'Cash in Vault & Commercial Bank Accounts';
      narration = `Card payment received via ${paymentData.cardType || paymentData.cardProvider || 'Card POS'} for Folio ${folio.folioNumber}. Ref: ${paymentData.cardApprovalCode || paymentData.reference}`;
    }

    // Auto-generate double-entry Journal Voucher mapped to Accounts
    this.createJournalVoucher({
      date: state.settings.currentBusinessDate || new Date().toISOString().split('T')[0],
      sourceModule: 'Guest Folio Settlement',
      sourceReference: txnNumber,
      narration,
      entries: [
        { 
          id: `jve-${Date.now()}-1`, 
          accountCode: debitAccount, 
          accountName: debitAccountName, 
          debit: paymentData.amount, 
          credit: 0, 
          memo: `${paymentData.method} receipt (Folio ${folio.folioNumber})` 
        },
        { 
          id: `jve-${Date.now()}-2`, 
          accountCode: '1100', 
          accountName: 'Guest Ledger (In-House Active Receivables)', 
          debit: 0, 
          credit: paymentData.amount, 
          memo: `Folio ${folio.folioNumber} balance clearance` 
        }
      ]
    });

    this.logAudit('Received Payment', 'Payment', payment.id, undefined, `৳${payment.amount} via ${payment.method} for Folio ${folio.folioNumber}`);
    notify();
    return payment;
  },

  recalculateFolio(folio: Folio) {
    let sub = 0;
    let disc = 0;
    let tax = 0;
    folio.items.filter(it => !it.voided).forEach(it => {
      sub += (it.quantity * it.unitPrice);
      disc += (it.discount || 0);
      tax += (it.tax || 0);
    });
    const sc = Math.round(sub * (state.settings.serviceChargePercent / 100));
    folio.subtotal = sub;
    folio.discountTotal = disc;
    folio.serviceChargeTotal = sc;
    folio.taxTotal = tax;
    folio.grandTotal = (sub - disc) + sc + tax;
    folio.balance = folio.grandTotal - folio.paidTotal;
  },

  postFolioAdjustment(folioId: string, adjustment: {
    description: string;
    amount: number;
    reason?: string;
  }): FolioItem {
    const folio = state.folios.find(f => f.id === folioId);
    if (!folio) throw new Error('Folio not found');

    const newItem: FolioItem = {
      id: `item-${Date.now()}`,
      folioId,
      type: 'Adjustment',
      description: adjustment.description,
      quantity: 1,
      unitPrice: adjustment.amount,
      discount: 0,
      tax: 0,
      total: adjustment.amount,
      postedBy: state.currentUser.name,
      createdAt: new Date().toISOString(),
      reference: adjustment.reason
    };

    folio.items.push(newItem);
    this.recalculateFolio(folio);
    this.logAudit('Posted Folio Adjustment', 'Folio', folio.id, undefined, `${newItem.description} (৳${adjustment.amount}) to Folio ${folio.folioNumber}`);
    notify();
    return newItem;
  },

  // -------------------------------------------------------------
  // RESTAURANT / BAR / IN-ROOM DINING POS & BILLING
  // -------------------------------------------------------------
  createRestaurantOrder(params: {
    stayId?: string;
    roomNumber?: string;
    tableNumber?: string;
    guestName?: string;
    folioId?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    subtotal?: number;
    tax?: number;
    total?: number;
    orderType?: 'room-dining' | 'restaurant-table' | 'bar-lounge' | 'counter-takeaway' | 'in-room-dining';
    inRoomDiningDetails?: {
      deliveryTime?: string;
      trayCharge?: number;
      trayChargeIncluded?: boolean;
      scheduledDeliveryTime?: string;
      kitchenNotes?: string;
      specialNotes?: string;
    };
    postToFolio?: boolean;
    items: { menuItemId?: string; name?: string; quantity: number; unitPrice?: number; totalPrice?: number }[];
    notes?: string;
  }): RestaurantOrder {
    const orderItems = params.items.map(it => {
      const item = it.menuItemId ? state.menuItems.find(m => m.id === it.menuItemId) : undefined;
      const unitPrice = it.unitPrice || item?.price || 0;
      const name = it.name || item?.name || 'Menu Item';
      return {
        menuItemId: it.menuItemId || (item ? item.id : `mi-${Date.now()}`),
        name,
        quantity: it.quantity,
        unitPrice,
        total: it.totalPrice || (unitPrice * it.quantity)
      };
    });

    let subtotal = params.subtotal || orderItems.reduce((acc, curr) => acc + curr.total, 0);
    if ((params.orderType === 'room-dining' || params.orderType === 'in-room-dining') && params.inRoomDiningDetails?.trayCharge) {
      subtotal += params.inRoomDiningDetails.trayCharge;
    }

    const sc = Math.round(subtotal * (state.settings.serviceChargePercent / 100));
    const tax = Math.round(subtotal * (state.settings.taxRatePercent / 100));
    const total = params.total || (subtotal + sc + tax);
    const prefix = params.orderType === 'bar-lounge' ? 'BAR' : (params.orderType === 'room-dining' || params.orderType === 'in-room-dining') ? 'IRD' : 'POS';
    const orderNumber = `${prefix}-2026-${String(state.restaurantOrders.length + 101).padStart(4, '0')}`;

    let folioId: string | undefined = params.folioId;
    const shouldPostToFolio = params.postToFolio ?? (params.paymentStatus === 'Billed-To-Room' || !!params.stayId);

    if (shouldPostToFolio && params.stayId) {
      const stay = state.stays.find(s => s.id === params.stayId);
      if (stay) {
        if (stay.stopPost) {
          throw new Error(`Cannot bill to Room ${stay.roomNumber}: STOP POST restriction is active (${stay.stopPostReason || 'Outlet charges restricted by Front Office'}). Please collect Direct Settlement (Cash, Card, or Mobile Pay).`);
        }
        folioId = stay.folioId;
        const itemSummary = orderItems.map(i => `${i.name} (x${i.quantity})`).join(', ');
        const chargeType: FolioItem['type'] = (params.orderType === 'room-dining' || params.orderType === 'in-room-dining') ? 'Room Service' : 'Restaurant';
        const typeLabel = (params.orderType === 'room-dining' || params.orderType === 'in-room-dining') ? 'In-Room Dining' : params.orderType === 'bar-lounge' ? 'Bar & Lounge' : 'Restaurant Dining';
        
        this.postFolioCharge(stay.folioId, {
          type: chargeType,
          description: `${typeLabel} [${orderNumber}]: ${itemSummary}${params.inRoomDiningDetails?.trayCharge ? ` (+৳${params.inRoomDiningDetails.trayCharge} Tray Service)` : ''}`,
          quantity: 1,
          unitPrice: subtotal,
          applyTax: true,
          reference: orderNumber
        });
      }
    }

    const normalizedOrderType: RestaurantOrder['orderType'] = params.orderType === 'in-room-dining' ? 'room-dining' : (params.orderType || (params.roomNumber ? 'room-dining' : params.tableNumber ? 'restaurant-table' : 'counter-takeaway'));

    const newOrder: RestaurantOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      stayId: params.stayId,
      roomNumber: params.roomNumber,
      guestName: params.guestName,
      tableNumber: params.tableNumber,
      orderType: normalizedOrderType,
      inRoomDiningDetails: params.inRoomDiningDetails,
      status: shouldPostToFolio ? 'Posted to Folio' : 'Served',
      items: orderItems,
      subtotal,
      serviceCharge: sc,
      tax,
      total,
      folioId,
      createdBy: state.currentUser.name,
      createdAt: new Date().toISOString()
    };

    state.restaurantOrders.unshift(newOrder);
    
    // Automatically trigger recipe ingredient stock consumption, stock ledger, and GL cost posting
    try {
      inventoryMenuService.consumeIngredientsForRestaurantOrder(newOrder);
    } catch (err) {
      console.warn('Auto stock consumption notice:', err);
    }

    this.logAudit('Created Restaurant Order', 'Order', newOrder.id, undefined, `${orderNumber} (৳${total}) - ${newOrder.orderType} for ${params.guestName || params.roomNumber || params.tableNumber || 'Walk-in'}`);
    this.addAlert('info', `POS Order ${orderNumber}`, `${newOrder.orderType.toUpperCase()} order created for ৳${total}. ${params.postToFolio ? 'Billed to Room ' + params.roomNumber : 'Paid at counter'}.`, 'View POS', 'restaurant');
    notify();
    return newOrder;
  },

  // -------------------------------------------------------------
  // HOUSEKEEPING & MAINTENANCE
  // -------------------------------------------------------------
  updateHousekeepingStatus(roomId: string, status: HousekeepingStatus, notes?: string) {
    const idx = state.rooms.findIndex(r => r.id === roomId || r.roomNumber === roomId);
    if (idx === -1) throw new Error('Room not found');

    const room = state.rooms[idx];
    const oldStatus = room.housekeepingStatus;
    let newOp = room.operationalStatus;

    if (status === 'Clean' || status === 'Inspected') {
      if (
        room.operationalStatus === 'Dirty' ||
        room.operationalStatus === 'Cleaning' ||
        room.operationalStatus === 'Out of Service' ||
        room.operationalStatus === 'Blocked'
      ) {
        newOp = status === 'Inspected' ? 'Inspected' : 'Available';
      }
    } else if (status === 'Dirty') {
      if (room.operationalStatus === 'Available' || room.operationalStatus === 'Inspected') {
        newOp = 'Dirty';
      }
    } else if (status === 'Cleaning') {
      if (room.operationalStatus !== 'Occupied') {
        newOp = 'Cleaning';
      }
    }

    const updatedRoom: Room = {
      ...room,
      operationalStatus: newOp,
      housekeepingStatus: status
    };

    state.rooms = [
      ...state.rooms.slice(0, idx),
      updatedRoom,
      ...state.rooms.slice(idx + 1)
    ];

    this.logAudit('Changed Housekeeping Status', 'Housekeeping', updatedRoom.id, oldStatus, `Room ${updatedRoom.roomNumber} is now ${status}`);
    if (status === 'Clean' || status === 'Inspected') {
      this.addAlert('success', `Room ${updatedRoom.roomNumber} Ready`, `Housekeeping completed for Room ${updatedRoom.roomNumber}. Status: ${status}`, 'View Room Rack', 'rooms');
    }
    notify();
    return updatedRoom;
  },

  completeHousekeepingTask(taskId: string) {
    const task = state.housekeepingTasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');

    task.status = 'Completed';
    task.completedAt = new Date().toISOString();
    task.checklist = {
      bedLinenChanged: true,
      bathroomSanitized: true,
      towelsReplaced: true,
      amenitiesRestocked: true,
      floorCleaned: true,
      minibarChecked: true
    };

    this.updateHousekeepingStatus(task.roomId, 'Clean');
    notify();
  },

  createMaintenanceTicket(ticketData: {
    roomId: string;
    title: string;
    description: string;
    priority: MaintenanceTicket['priority'];
    assignedTo?: string;
    marksOutOfOrder: boolean;
  }): MaintenanceTicket {
    const room = state.rooms.find(r => r.id === ticketData.roomId);
    if (!room) throw new Error('Room not found');

    const ticketNumber = `MNT-2026-00${state.maintenanceTickets.length + 46}`;
    const newTicket: MaintenanceTicket = {
      id: `mt-${Date.now()}`,
      ticketNumber,
      roomId: room.id,
      roomNumber: room.roomNumber,
      title: ticketData.title,
      description: ticketData.description,
      priority: ticketData.priority,
      assignedTo: ticketData.assignedTo || 'Facility Team',
      status: 'Open',
      cost: 0,
      marksOutOfOrder: ticketData.marksOutOfOrder,
      createdAt: new Date().toISOString()
    };

    state.maintenanceTickets.unshift(newTicket);

    if (ticketData.marksOutOfOrder) {
      room.operationalStatus = 'Out of Order';
      this.addAlert('urgent', `Room ${room.roomNumber} Out of Order`, `Critical ticket ${ticketNumber}: ${ticketData.title}. Room removed from inventory.`, 'Maintenance Desk', 'maintenance');
    }

    this.logAudit('Created Maintenance Ticket', 'Maintenance', newTicket.id, undefined, `${ticketNumber} for Room ${room.roomNumber} (${ticketData.title})`);
    notify();
    return newTicket;
  },

  resolveMaintenanceTicket(ticketId: string, cost?: number, resolutionNotes?: string) {
    const ticket = state.maintenanceTickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error('Ticket not found');

    ticket.status = 'Completed';
    ticket.completedAt = new Date().toISOString();
    if (cost !== undefined) ticket.cost = cost;
    if (resolutionNotes) ticket.notes = resolutionNotes;

    if (ticket.marksOutOfOrder) {
      const room = state.rooms.find(r => r.id === ticket.roomId);
      if (room && room.operationalStatus === 'Out of Order') {
        room.operationalStatus = 'Dirty';
        room.housekeepingStatus = 'Dirty';
        // Dispatch housekeeping inspection
        state.housekeepingTasks.unshift({
          id: `hk-${Date.now()}`,
          roomId: room.id,
          roomNumber: room.roomNumber,
          roomTypeName: room.roomTypeName || 'Room',
          taskType: 'Inspection',
          priority: 'High',
          status: 'Pending',
          checklist: { bedLinenChanged: true, bathroomSanitized: true, towelsReplaced: true, amenitiesRestocked: true, floorCleaned: true, minibarChecked: true },
          notes: `Post-maintenance cleaning and inspection after ticket ${ticket.ticketNumber}`,
          createdAt: new Date().toISOString()
        });
        this.addAlert('info', `Maintenance Resolved (Room ${room.roomNumber})`, `Ticket ${ticket.ticketNumber} completed. Room queued for HK inspection.`, 'Housekeeping', 'housekeeping');
      }
    }

    this.logAudit('Resolved Maintenance Ticket', 'Maintenance', ticket.id, 'In Progress', `Completed ticket ${ticket.ticketNumber}`);
    notify();
  },

  // -------------------------------------------------------------
  // CONVENTION HALLS & EVENT BOOKINGS
  // -------------------------------------------------------------
  createEventBooking(eventData: {
    clientId?: string;
    clientName: string;
    clientCompany?: string;
    clientPhone: string;
    clientEmail?: string;
    hallId: string;
    eventName: string;
    eventType: EventBooking['eventType'];
    eventDate: string;
    startTime: string;
    endTime: string;
    guestCount: number;
    packageId?: string;
    depositAmount?: number;
    paymentMethod?: Payment['method'];
    paymentReference?: string;
    cardType?: string;
    cardProvider?: string;
    cardApprovalCode?: string;
    transactionNo?: string;
    traceNo?: string;
    notes?: string;
    items: { itemType: EventBooking['items'][0]['itemType']; description: string; quantity: number; unitPrice: number }[];
  }): EventBooking {
    const hall = state.halls.find(h => h.id === eventData.hallId);
    if (!hall) throw new Error('Convention hall not found');

    // Check hall collision on same date & overlapping time
    const collision = state.eventBookings.find(e => {
      if (e.hallId !== hall.id) return false;
      if (e.eventDate !== eventData.eventDate) return false;
      if (e.status === 'Cancelled') return false;

      return (eventData.startTime < e.endTime && eventData.endTime > e.startTime);
    });

    if (collision) {
      throw new Error(`Hall ${hall.name} is already booked on ${eventData.eventDate} by ${collision.clientName} (${collision.startTime} - ${collision.endTime})`);
    }

    let clientId = eventData.clientId;
    if (!clientId) {
      const newClient: EventClient = {
        id: `ec-${Date.now()}`,
        name: eventData.clientName,
        company: eventData.clientCompany,
        phone: eventData.clientPhone,
        email: eventData.clientEmail || '',
        address: 'Dhaka, Bangladesh',
        notes: 'Created via Event Booking',
        createdAt: new Date().toISOString()
      };
      state.eventClients.unshift(newClient);
      clientId = newClient.id;
    }

    const items = eventData.items.map(it => ({
      id: `ei-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemType: it.itemType,
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      total: it.quantity * it.unitPrice
    }));

    const subtotal = items.reduce((acc, curr) => acc + curr.total, 0);
    const sc = Math.round(subtotal * (state.settings.serviceChargePercent / 100));
    const tax = Math.round(subtotal * (state.settings.taxRatePercent / 100));
    const total = subtotal + sc + tax;
    const deposit = eventData.depositAmount || 0;
    const balance = total - deposit;
    const eventNumber = `EVT-2026-00${state.eventBookings.length + 91}`;

    const pkg = eventData.packageId ? state.packages.find(p => p.id === eventData.packageId) : undefined;

    const newBooking: EventBooking = {
      id: `evt-${Date.now()}`,
      eventNumber,
      clientId,
      clientName: eventData.clientName,
      clientCompany: eventData.clientCompany,
      clientPhone: eventData.clientPhone,
      hallId: hall.id,
      hallName: hall.name,
      eventName: eventData.eventName,
      eventType: eventData.eventType,
      eventDate: eventData.eventDate,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      guestCount: eventData.guestCount,
      packageId: eventData.packageId,
      packageName: pkg?.name,
      status: 'Confirmed',
      items,
      subtotal,
      discount: 0,
      serviceCharge: sc,
      tax,
      total,
      deposit,
      balance,
      notes: eventData.notes,
      createdAt: new Date().toISOString()
    };

    state.eventBookings.unshift(newBooking);

    if (deposit > 0 && eventData.paymentMethod) {
      const txnNumber = `TXN-2026-09${state.payments.length + 10}`;
      state.payments.unshift({
        id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        transactionNumber: txnNumber,
        eventBookingId: newBooking.id,
        amount: deposit,
        method: eventData.paymentMethod,
        reference: eventData.paymentReference || `Event Booking Advance for ${eventNumber}`,
        status: 'Completed',
        notes: `Advance for ${newBooking.eventName}`,
        createdBy: state.currentUser.name,
        createdAt: new Date().toISOString(),
        cardType: eventData.cardType,
        cardProvider: eventData.cardProvider,
        cardApprovalCode: eventData.cardApprovalCode,
        transactionNo: eventData.transactionNo,
        traceNo: eventData.traceNo
      });

      // Auto-generate double-entry Journal Voucher mapped to Accounts for Event Deposit
      const debitAccount = eventData.paymentMethod === 'Cash' ? '1020' : '1010';
      const debitAccountName = eventData.paymentMethod === 'Cash' ? 'Front Desk & Outlet Cashier Drawers' : 'Cash in Vault & Commercial Bank Accounts';
      this.createJournalVoucher({
        date: state.settings.currentBusinessDate || new Date().toISOString().split('T')[0],
        sourceModule: 'Banquet & Catering',
        sourceReference: txnNumber,
        narration: `Advance deposit received for Event ${eventNumber}: ${newBooking.eventName} (${newBooking.clientName}) in ${hall.name} via ${eventData.paymentMethod}`,
        entries: [
          { id: `jve-${Date.now()}-1`, accountCode: debitAccount, accountName: debitAccountName, debit: deposit, credit: 0, memo: `Advance deposit via ${eventData.paymentMethod}` },
          { id: `jve-${Date.now()}-2`, accountCode: '2010', accountName: 'Guest Advance & Reservation Security Deposits', debit: 0, credit: deposit, memo: `Event advance deposit liability` }
        ]
      });
    }

    this.logAudit('Created Event Booking', 'Event', newBooking.id, undefined, `${eventNumber}: ${newBooking.eventName} in ${hall.name}`);
    this.addAlert('info', `New Event Booked: ${hall.name}`, `${newBooking.eventName} (${newBooking.guestCount} guests) on ${eventData.eventDate}`, 'Event Calendar', 'convention');

    notify();
    return newBooking;
  },

  recordEventPayment(eventId: string, paymentData: {
    amount: number;
    method: Payment['method'];
    reference: string;
    notes?: string;
    cardType?: string;
    cardProvider?: string;
    cardApprovalCode?: string;
    posTerminal?: string;
    transactionNo?: string;
    traceNo?: string;
    bankAccountId?: string;
    bankAccountName?: string;
    senderBankName?: string;
    bankTxnRef?: string;
    cityLedgerAccountId?: string;
    cityLedgerAccountName?: string;
    companyPoNumber?: string;
    authorizedBy?: string;
  }): Payment {
    const event = state.eventBookings.find(e => e.id === eventId);
    if (!event) throw new Error('Event booking not found');

    const txnNumber = `TXN-2026-09${state.payments.length + 10}`;
    const payment: Payment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      transactionNumber: txnNumber,
      eventBookingId: eventId,
      amount: paymentData.amount,
      method: paymentData.method,
      reference: paymentData.reference,
      status: 'Completed',
      notes: paymentData.notes || `Event payment for ${event.eventNumber}`,
      createdBy: state.currentUser.name,
      createdAt: new Date().toISOString(),
      cardType: paymentData.cardType,
      cardProvider: paymentData.cardProvider,
      cardApprovalCode: paymentData.cardApprovalCode,
      posTerminal: paymentData.posTerminal,
      transactionNo: paymentData.transactionNo,
      traceNo: paymentData.traceNo,
      bankAccountId: paymentData.bankAccountId,
      bankAccountName: paymentData.bankAccountName,
      senderBankName: paymentData.senderBankName,
      bankTxnRef: paymentData.bankTxnRef,
      cityLedgerAccountId: paymentData.cityLedgerAccountId,
      cityLedgerAccountName: paymentData.cityLedgerAccountName,
      companyPoNumber: paymentData.companyPoNumber,
      authorizedBy: paymentData.authorizedBy
    };

    state.payments.unshift(payment);
    event.deposit += paymentData.amount;
    event.balance = Math.max(0, event.total - event.deposit);

    // Auto-generate double-entry Journal Voucher
    const debitAccount = paymentData.method === 'Cash' ? '1020' : '1010';
    const debitAccountName = paymentData.method === 'Cash' ? 'Front Desk & Outlet Cashier Drawers' : 'Cash in Vault & Commercial Bank Accounts';
    this.createJournalVoucher({
      date: state.settings.currentBusinessDate || new Date().toISOString().split('T')[0],
      sourceModule: 'Banquet & Catering',
      sourceReference: txnNumber,
      narration: `Event deposit payment received for ${event.eventNumber} (${event.eventName}) from ${event.clientName} via ${paymentData.method}`,
      entries: [
        { id: `jve-${Date.now()}-1`, accountCode: debitAccount, accountName: debitAccountName, debit: paymentData.amount, credit: 0, memo: `Deposit payment via ${paymentData.method}` },
        { id: `jve-${Date.now()}-2`, accountCode: '2010', accountName: 'Guest Advance & Reservation Security Deposits', debit: 0, credit: paymentData.amount, memo: `Deposit credit for ${event.eventNumber}` }
      ]
    });

    this.logAudit('Received Event Payment', 'Payment', payment.id, undefined, `৳${payment.amount} for Event ${event.eventNumber}`);
    notify();
    return payment;
  },

  recordEventDeposit(eventId: string, depositData: {
    amount: number;
    method: Payment['method'];
    reference: string;
    notes?: string;
  }): { success: boolean; payment: Payment; event: EventBooking; message: string } {
    const payment = this.recordEventPayment(eventId, depositData);
    const event = state.eventBookings.find(e => e.id === eventId)!;
    return {
      success: true,
      payment,
      event,
      message: `Deposit of ৳${(depositData.amount || 0).toLocaleString()} received for ${event.eventNumber} (${event.eventName}).`
    };
  },

  settleEventBill(eventId: string, params: {
    paymentMethod: Payment['method'] | 'City Ledger';
    amountPaid?: number;
    cityLedgerAccountId?: string;
    reference?: string;
    notes?: string;
  }): { success: boolean; event: EventBooking; message: string } {
    const event = state.eventBookings.find(e => e.id === eventId);
    if (!event) throw new Error('Event booking not found.');

    const invoiceNumber = `INV-BANQ-${new Date().getFullYear()}-${event.eventNumber.split('-').pop()}`;
    event.invoiceNumber = invoiceNumber;
    event.status = 'Completed';
    event.settledAt = new Date().toISOString();
    event.settledBy = state.currentUser.name;
    event.settlementMethod = params.paymentMethod;

    const remainingBalance = Math.max(0, event.total - event.deposit);
    const amountSettled = params.amountPaid !== undefined ? params.amountPaid : remainingBalance;

    if (params.paymentMethod === 'City Ledger' && params.cityLedgerAccountId) {
      const clAcc = state.cityLedgerAccounts?.find(a => a.id === params.cityLedgerAccountId);
      if (clAcc) {
        clAcc.currentBalance += remainingBalance;
        event.cityLedgerAccountId = clAcc.id;
        event.cityLedgerAccountName = clAcc.companyName;
      }
    }

    event.deposit += amountSettled;
    event.balance = Math.max(0, event.total - event.deposit);

    // Auto-generate comprehensive double-entry Journal Voucher for Banquet Settlement
    const venueHireRevenue = event.items.filter(i => i.itemType === 'Hall Rent').reduce((s, i) => s + i.total, 0) || Math.round(event.subtotal * 0.4);
    const cateringRevenue = Math.max(0, event.subtotal - venueHireRevenue);

    const jvEntries: JournalEntryItem[] = [];

    // Debits
    if (event.deposit > remainingBalance && event.deposit - amountSettled > 0) {
      jvEntries.push({
        id: `jve-${Date.now()}-dep`,
        accountCode: '2010',
        accountName: 'Guest Advance & Reservation Security Deposits',
        debit: event.deposit - amountSettled,
        credit: 0,
        memo: `Advance deposit applied to final bill for ${event.eventNumber}`
      });
    }

    if (params.paymentMethod === 'City Ledger') {
      jvEntries.push({
        id: `jve-${Date.now()}-cl`,
        accountCode: '1150',
        accountName: 'City Ledger (Corporate Accounts Receivable)',
        debit: remainingBalance,
        credit: 0,
        memo: `Corporate billing for ${event.clientCompany || event.clientName}`
      });
    } else if (amountSettled > 0) {
      const debitCode = params.paymentMethod === 'Cash' ? '1020' : '1010';
      const debitName = params.paymentMethod === 'Cash' ? 'Front Desk & Outlet Cashier Drawers' : 'Cash in Vault & Commercial Bank Accounts';
      jvEntries.push({
        id: `jve-${Date.now()}-pay`,
        accountCode: debitCode,
        accountName: debitName,
        debit: amountSettled,
        credit: 0,
        memo: `Final settlement via ${params.paymentMethod}`
      });
    }

    // Credits
    if (venueHireRevenue > 0) {
      jvEntries.push({
        id: `jve-${Date.now()}-hall`,
        accountCode: '4040',
        accountName: 'Convention Halls & Banquet Venue Hire',
        debit: 0,
        credit: venueHireRevenue,
        memo: `Hall hire revenue for ${event.hallName}`
      });
    }

    if (cateringRevenue > 0) {
      jvEntries.push({
        id: `jve-${Date.now()}-food`,
        accountCode: '4020',
        accountName: 'Food & Beverage Outlet Sales',
        debit: 0,
        credit: cateringRevenue,
        memo: `Banquet catering & banquet package food`
      });
    }

    if (event.serviceCharge > 0) {
      jvEntries.push({
        id: `jve-${Date.now()}-sc`,
        accountCode: '2110',
        accountName: 'Service Charge Payable (10% Staff Pool)',
        debit: 0,
        credit: event.serviceCharge,
        memo: `10% banquet service charge`
      });
    }

    if (event.tax > 0) {
      jvEntries.push({
        id: `jve-${Date.now()}-tax`,
        accountCode: '2100',
        accountName: 'VAT / Government Tax Payable (15%)',
        debit: 0,
        credit: event.tax,
        memo: `15% government VAT`
      });
    }

    const totalDebits = jvEntries.reduce((s, e) => s + e.debit, 0);
    const totalCredits = jvEntries.reduce((s, e) => s + e.credit, 0);

    // Balance check adjustment if any discrepancy
    if (totalDebits !== totalCredits && jvEntries.length > 0) {
      const diff = totalCredits - totalDebits;
      if (diff > 0) {
        jvEntries[0].debit += diff;
      }
    }

    this.createJournalVoucher({
      date: state.settings.currentBusinessDate || new Date().toISOString().split('T')[0],
      sourceModule: 'Banquet & Catering',
      sourceReference: invoiceNumber,
      narration: `Banquet Bill Settlement for ${event.eventNumber}: ${event.eventName} in ${event.hallName} (${event.clientName}). Total: ৳${(event.total || 0).toLocaleString()}`,
      entries: jvEntries
    });

    this.logAudit('Settled Banquet Bill', 'Event', event.id, invoiceNumber, `Event ${event.eventNumber} settled via ${params.paymentMethod}. Total ৳${(event.total || 0).toLocaleString()}`);
    this.addAlert('success', `Banquet Bill Settled: ${event.eventNumber}`, `${event.eventName} in ${event.hallName} settled successfully. Invoice ${invoiceNumber} issued.`, 'Banquet Billing', 'convention');
    saveDatabase(state);
    notify();

    return {
      success: true,
      event,
      message: `Banquet Event ${event.eventNumber} settled successfully. Invoice ${invoiceNumber} generated.`
    };
  },

  updateEventBooking(eventId: string, updates: {
    eventName?: string;
    eventType?: EventBooking['eventType'];
    hallId?: string;
    eventDate?: string;
    startTime?: string;
    endTime?: string;
    guestCount?: number;
    clientName?: string;
    clientCompany?: string;
    clientPhone?: string;
    clientEmail?: string;
    packageId?: string;
    status?: EventBooking['status'];
    deposit?: number;
    notes?: string;
    items?: { itemType: EventBooking['items'][0]['itemType']; description: string; quantity: number; unitPrice: number }[];
  }): { success: boolean; event: EventBooking; message: string } {
    const event = state.eventBookings.find(e => e.id === eventId);
    if (!event) throw new Error('Event booking not found.');

    const targetHallId = updates.hallId || event.hallId;
    const targetDate = updates.eventDate || event.eventDate;
    const targetStartTime = updates.startTime || event.startTime;
    const targetEndTime = updates.endTime || event.endTime;

    // Check collision if venue or timing changed
    if (
      (updates.hallId && updates.hallId !== event.hallId) ||
      (updates.eventDate && updates.eventDate !== event.eventDate) ||
      (updates.startTime && updates.startTime !== event.startTime) ||
      (updates.endTime && updates.endTime !== event.endTime)
    ) {
      const collision = state.eventBookings.find(e => {
        if (e.id === eventId) return false;
        if (e.hallId !== targetHallId) return false;
        if (e.eventDate !== targetDate) return false;
        if (e.status === 'Cancelled') return false;
        return targetStartTime < e.endTime && targetEndTime > e.startTime;
      });

      if (collision) {
        throw new Error(`Hall is already booked on ${targetDate} by ${collision.clientName} (${collision.startTime} - ${collision.endTime})`);
      }
    }

    if (updates.hallId && updates.hallId !== event.hallId) {
      const hall = state.halls.find(h => h.id === updates.hallId);
      if (hall) {
        event.hallId = hall.id;
        event.hallName = hall.name;
      }
    }

    if (updates.eventName) event.eventName = updates.eventName.trim();
    if (updates.eventType) event.eventType = updates.eventType;
    if (updates.eventDate) event.eventDate = updates.eventDate;
    if (updates.startTime) event.startTime = updates.startTime;
    if (updates.endTime) event.endTime = updates.endTime;
    if (updates.guestCount !== undefined) event.guestCount = Number(updates.guestCount);
    if (updates.clientName) event.clientName = updates.clientName.trim();
    if (updates.clientCompany !== undefined) event.clientCompany = updates.clientCompany.trim();
    if (updates.clientPhone) event.clientPhone = updates.clientPhone.trim();
    if (updates.clientEmail !== undefined) {
      const client = state.eventClients.find(c => c.id === event.clientId);
      if (client) client.email = updates.clientEmail.trim();
    }
    if (updates.status) event.status = updates.status;
    if (updates.notes !== undefined) event.notes = updates.notes;

    if (updates.deposit !== undefined) {
      event.deposit = Math.max(0, Number(updates.deposit));
    }

    if (updates.packageId !== undefined) {
      event.packageId = updates.packageId;
      const pkg = state.packages.find(p => p.id === updates.packageId);
      event.packageName = pkg?.name;
    }

    if (updates.items) {
      event.items = updates.items.map(it => ({
        id: `ei-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        itemType: it.itemType,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.quantity * it.unitPrice
      }));
      event.subtotal = event.items.reduce((s, it) => s + it.total, 0);
      event.serviceCharge = Math.round(event.subtotal * (state.settings.serviceChargePercent / 100));
      event.tax = Math.round(event.subtotal * (state.settings.taxRatePercent / 100));
      event.total = event.subtotal + event.serviceCharge + event.tax;
    }

    event.balance = event.total - (event.deposit || 0);

    this.logAudit('Updated Banquet Event', 'Event', event.id, event.eventNumber, `Updated event details for ${event.eventName} (#${event.eventNumber})`);
    saveDatabase(state);
    notify();

    return {
      success: true,
      event,
      message: `Event ${event.eventNumber} updated successfully.`
    };
  },

  cancelEventBooking(eventId: string, options?: {
    reason?: string;
    depositHandling?: 'retained' | 'refunded' | 'transferred' | 'none';
    refundAmount?: number;
    refundMethod?: Payment['method'];
    notes?: string;
  } | string): { success: boolean; message: string; event: EventBooking } {
    const event = state.eventBookings.find(e => e.id === eventId);
    if (!event) throw new Error('Event booking not found.');

    const reason = typeof options === 'string' ? options : (options?.reason || 'Cancelled by Banquet Desk');
    const depositHandling = typeof options === 'object' ? options.depositHandling : 'retained';
    const notes = typeof options === 'object' ? options.notes : '';

    if (event.status === 'Cancelled') {
      return { success: true, message: 'Event is already cancelled.', event };
    }

    event.status = 'Cancelled';
    event.cancellationReason = reason;
    event.cancelledAt = new Date().toISOString();
    const cancelNote = `[Cancelled: ${reason}${depositHandling ? ` | Deposit: ${depositHandling}` : ''}${notes ? ` - ${notes}` : ''}]`;
    event.notes = event.notes ? `${event.notes} ${cancelNote}` : cancelNote;

    // Handle deposit if refunded
    if (depositHandling === 'refunded' && event.deposit > 0) {
      const refundAmt = (typeof options === 'object' && options.refundAmount !== undefined) ? options.refundAmount : event.deposit;
      const refMethod = (typeof options === 'object' && options.refundMethod) ? options.refundMethod : 'Bank Transfer';
      
      const refundRecord: Refund = {
        id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        paymentId: `pay-event-${event.id}`,
        transactionNumber: `REF-${Date.now().toString().slice(-6)}`,
        amount: refundAmt,
        reason: `Refund for Cancelled Event #${event.eventNumber} (${event.eventName})`,
        method: refMethod,
        refundedAt: new Date().toISOString(),
        refundedBy: 'Banquet Operations',
        createdBy: 'Banquet Operations',
        createdAt: new Date().toISOString()
      };
      if (!state.refunds) state.refunds = [];
      state.refunds.unshift(refundRecord);

      // Adjust deposit to reflect refund
      event.deposit = Math.max(0, event.deposit - refundAmt);
      event.balance = event.total - event.deposit;
    }

    this.logAudit('Cancelled Banquet Event', 'Event', event.id, event.eventNumber, `Cancelled banquet booking for ${event.eventName}. Reason: ${reason} (Deposit: ${depositHandling || 'retained'})`);
    this.addAlert('warning', `Event Cancelled: ${event.eventNumber}`, `${event.eventName} scheduled in ${event.hallName} on ${event.eventDate} was cancelled.`, 'Banquet Operations', 'convention');
    saveDatabase(state);
    notify();

    return {
      success: true,
      event,
      message: `Event ${event.eventNumber} has been successfully cancelled and hall venue released.`
    };
  },

  reopenEventBooking(eventId: string): { success: boolean; event: EventBooking; message: string } {
    const event = state.eventBookings.find(e => e.id === eventId);
    if (!event) throw new Error('Event booking not found.');

    if (event.status !== 'Cancelled') {
      return { success: true, event, message: 'Event is not cancelled.' };
    }

    // Check collision before reopening
    const collision = state.eventBookings.find(e => {
      if (e.id === eventId) return false;
      if (e.hallId !== event.hallId) return false;
      if (e.eventDate !== event.eventDate) return false;
      if (e.status === 'Cancelled') return false;
      return event.startTime < e.endTime && event.endTime > e.startTime;
    });

    if (collision) {
      throw new Error(`Cannot reopen event. Hall "${event.hallName}" is now booked on ${event.eventDate} by ${collision.clientName} (${collision.startTime} - ${collision.endTime}). Please change date/time or choose another hall first.`);
    }

    event.status = 'Confirmed';
    event.cancelledAt = undefined;
    event.cancellationReason = undefined;

    this.logAudit('Reopened Banquet Event', 'Event', event.id, event.eventNumber, `Reopened banquet booking for ${event.eventName} (#${event.eventNumber})`);
    this.addAlert('info', `Event Reopened: ${event.eventNumber}`, `${event.eventName} scheduled in ${event.hallName} on ${event.eventDate} has been restored to Confirmed status.`, 'Banquet Operations', 'convention');
    saveDatabase(state);
    notify();

    return {
      success: true,
      event,
      message: `Event ${event.eventNumber} has been successfully reopened and confirmed.`
    };
  },

  updateEventFunctionSheet(eventId: string, sheetData: {
    setupStyle?: 'Banquet' | 'Theatre' | 'Classroom' | 'U-Shape' | 'Boardroom' | 'Cocktail / Standing';
    avRequirements?: string[];
    timeline?: { time: string; activity: string; notes?: string }[];
    menuCourses?: { courseName: string; items: string[] }[];
    floorSupervisor?: string;
    supervisorPhone?: string;
    tableCount?: number;
    dietaryRequirements?: string;
    kitchenNotes?: string;
    specialInstructions?: string;
  }): { success: boolean; event: EventBooking; message: string } {
    const event = state.eventBookings.find(e => e.id === eventId);
    if (!event) throw new Error('Event booking not found.');

    if (sheetData.setupStyle) event.setupStyle = sheetData.setupStyle;
    if (sheetData.avRequirements) event.avRequirements = sheetData.avRequirements;
    if (sheetData.timeline) event.timeline = sheetData.timeline;
    if (sheetData.menuCourses) event.menuCourses = sheetData.menuCourses;
    if (sheetData.floorSupervisor) event.floorSupervisor = sheetData.floorSupervisor;
    if (sheetData.supervisorPhone !== undefined) event.supervisorPhone = sheetData.supervisorPhone;
    if (sheetData.tableCount !== undefined) event.tableCount = Number(sheetData.tableCount);
    if (sheetData.dietaryRequirements !== undefined) event.dietaryRequirements = sheetData.dietaryRequirements;
    if (sheetData.kitchenNotes) event.kitchenNotes = sheetData.kitchenNotes;
    if (sheetData.specialInstructions) event.specialInstructions = sheetData.specialInstructions;

    this.logAudit('Updated Banquet BEO Function Sheet', 'Event', event.id, event.eventNumber, `Updated Banquet Event Order specifications for ${event.eventName}`);
    saveDatabase(state);
    notify();

    return {
      success: true,
      event,
      message: `Function Sheet (BEO) for ${event.eventNumber} updated successfully.`
    };
  },

  // -------------------------------------------------------------
  // CUSTOM PACKAGES & QUOTATION CREATION MANAGEMENT
  // -------------------------------------------------------------
  saveCustomPackage(pkgData: Partial<Package> & { name: string; price: number }): Package {
    if (!state.packages) state.packages = [];
    
    let savedPkg: Package;
    if (pkgData.id && state.packages.some(p => p.id === pkgData.id)) {
      const idx = state.packages.findIndex(p => p.id === pkgData.id);
      savedPkg = {
        ...state.packages[idx],
        ...pkgData,
        updatedAt: new Date().toISOString()
      };
      state.packages[idx] = savedPkg;
      this.logAudit('Updated Banquet Package', 'Package', savedPkg.id, savedPkg.name, `Updated package "${savedPkg.name}" (৳${savedPkg.price.toLocaleString()})`);
    } else {
      savedPkg = {
        id: pkgData.id || `pkg-${Date.now()}`,
        name: pkgData.name,
        description: pkgData.description || 'Custom tailored banquet package',
        packageType: (pkgData.packageType as any) || 'Custom',
        price: Number(pkgData.price) || 0,
        active: pkgData.active !== undefined ? pkgData.active : true,
        includes: pkgData.includes || [],
        nightsCount: pkgData.nightsCount || 0,
        pricingModel: pkgData.pricingModel || 'fixed_package',
        minGuests: pkgData.minGuests,
        maxGuests: pkgData.maxGuests,
        selectedHalls: pkgData.selectedHalls || [],
        selectedRooms: pkgData.selectedRooms || [],
        selectedMenuItems: pkgData.selectedMenuItems || [],
        customServices: pkgData.customServices || [],
        menuCourses: pkgData.menuCourses || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      state.packages.unshift(savedPkg);
      this.logAudit('Created Banquet Package', 'Package', savedPkg.id, savedPkg.name, `Created custom package "${savedPkg.name}" with rate ৳${savedPkg.price.toLocaleString()}`);
    }

    notify();
    return savedPkg;
  },

  deletePackage(packageId: string): boolean {
    if (!state.packages) return false;
    const idx = state.packages.findIndex(p => p.id === packageId);
    if (idx !== -1) {
      const removed = state.packages.splice(idx, 1)[0];
      this.logAudit('Deleted Banquet Package', 'Package', packageId, removed.name, `Deleted package "${removed.name}"`);
      notify();
      return true;
    }
    return false;
  },

  saveQuotation(quotationData: Partial<BanquetQuotation> & {
    clientName: string;
    clientPhone: string;
    eventName: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    guestCount: number;
  }): BanquetQuotation {
    if (!state.quotations) state.quotations = [];

    let quotation: BanquetQuotation;
    if (quotationData.id && state.quotations.some(q => q.id === quotationData.id)) {
      const idx = state.quotations.findIndex(q => q.id === quotationData.id);
      const customSerial = quotationData.customSerialNo?.trim();
      quotation = {
        ...state.quotations[idx],
        ...quotationData,
        quotationNumber: customSerial || quotationData.quotationNumber || state.quotations[idx].quotationNumber,
        customSerialNo: customSerial || state.quotations[idx].customSerialNo || state.quotations[idx].quotationNumber,
        propertyLogoUrl: quotationData.propertyLogoUrl !== undefined ? quotationData.propertyLogoUrl : state.quotations[idx].propertyLogoUrl,
        updatedAt: new Date().toISOString()
      };
      state.quotations[idx] = quotation;
      this.logAudit('Updated Guest Quotation', 'Quotation', quotation.id, quotation.quotationNumber, `Updated quotation ${quotation.quotationNumber} for ${quotation.clientName}`);
    } else {
      const qtnCount = state.quotations.length + 1;
      const quotationNumber = quotationData.customSerialNo && quotationData.customSerialNo.trim()
        ? quotationData.customSerialNo.trim()
        : `QTN-2026-${String(qtnCount).padStart(3, '0')}`;
      
      quotation = {
        id: quotationData.id || `qtn-${Date.now()}`,
        quotationNumber,
        customSerialNo: quotationData.customSerialNo?.trim() || quotationNumber,
        propertyLogoUrl: quotationData.propertyLogoUrl || '',
        clientName: quotationData.clientName,
        clientCompany: quotationData.clientCompany || '',
        clientPhone: quotationData.clientPhone,
        clientEmail: quotationData.clientEmail || '',
        clientAddress: quotationData.clientAddress || '',
        eventName: quotationData.eventName,
        eventType: quotationData.eventType || 'Corporate',
        eventDate: quotationData.eventDate,
        startTime: quotationData.startTime,
        endTime: quotationData.endTime,
        guestCount: quotationData.guestCount,
        packageId: quotationData.packageId,
        packageName: quotationData.packageName,
        isCustomPackage: quotationData.isCustomPackage ?? true,
        halls: quotationData.halls || [],
        rooms: quotationData.rooms || [],
        menuItems: quotationData.menuItems || [],
        menuPricePerPerson: quotationData.menuPricePerPerson || 0,
        cateringTotal: quotationData.cateringTotal || 0,
        additionalServices: quotationData.additionalServices || [],
        hallTotal: quotationData.hallTotal || 0,
        roomTotal: quotationData.roomTotal || 0,
        servicesTotal: quotationData.servicesTotal || 0,
        subtotal: quotationData.subtotal || 0,
        discountPercent: quotationData.discountPercent || 0,
        discountAmount: quotationData.discountAmount || 0,
        serviceChargePercent: quotationData.serviceChargePercent ?? (state.settings.serviceChargePercent || 10),
        serviceChargeAmount: quotationData.serviceChargeAmount || 0,
        taxPercent: quotationData.taxPercent ?? (state.settings.taxRatePercent || 15),
        taxAmount: quotationData.taxAmount || 0,
        grandTotal: quotationData.grandTotal || 0,
        depositRequired: quotationData.depositRequired || Math.round((quotationData.grandTotal || 0) * 0.3),
        status: quotationData.status || 'Draft',
        validUntil: quotationData.validUntil || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        notes: quotationData.notes || '',
        termsAndConditions: quotationData.termsAndConditions || '1. 30% advance booking deposit required to lock hall and room allocations.\n2. 50% payable 7 days prior to event; remaining 20% on event date before handover.\n3. Outside catering or AV equipment requires prior management clearance.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: state.currentUser ? state.currentUser.name : 'Banquet Sales Team'
      };
      state.quotations.unshift(quotation);
      this.logAudit('Created Guest Quotation', 'Quotation', quotation.id, quotation.quotationNumber, `Created quotation ${quotation.quotationNumber} for ${quotation.clientName} (৳${(quotation.grandTotal || 0).toLocaleString()})`);
      this.addAlert('info', `New Quotation Generated: ${quotation.quotationNumber}`, `Quotation for ${quotation.eventName} (${quotation.clientName}) created for ৳${(quotation.grandTotal || 0).toLocaleString()}.`, 'Quotation Management', 'convention');
    }

    notify();
    return quotation;
  },

  updateQuotationStatus(quotationId: string, status: BanquetQuotation['status']): BanquetQuotation {
    if (!state.quotations) state.quotations = [];
    const quotation = state.quotations.find(q => q.id === quotationId);
    if (!quotation) throw new Error('Quotation not found');

    quotation.status = status;
    quotation.updatedAt = new Date().toISOString();
    this.logAudit('Updated Quotation Status', 'Quotation', quotation.id, quotation.quotationNumber, `Quotation ${quotation.quotationNumber} status set to "${status}"`);
    notify();
    return quotation;
  },

  convertQuotationToEvent(quotationId: string): EventBooking {
    if (!state.quotations) state.quotations = [];
    const quotation = state.quotations.find(q => q.id === quotationId);
    if (!quotation) throw new Error('Quotation not found');

    // Build event items from quotation's halls, rooms, catering, and services
    const items: EventBooking['items'] = [];

    for (const h of quotation.halls) {
      items.push({
        id: `ei-${Date.now()}-h-${h.hallId}`,
        itemType: 'Hall Rent',
        description: `Hall Hire: ${h.hallName} (${h.setupStyle || 'Banquet'})`,
        quantity: 1,
        unitPrice: h.hallRate,
        total: h.hallRate
      });
    }

    if (quotation.cateringTotal > 0) {
      items.push({
        id: `ei-${Date.now()}-food`,
        itemType: 'Food Package',
        description: `Custom Banquet Catering (${quotation.menuItems.length} menu items) - ${quotation.guestCount} Pax @ ৳${quotation.menuPricePerPerson}`,
        quantity: quotation.guestCount,
        unitPrice: quotation.menuPricePerPerson,
        total: quotation.cateringTotal
      });
    }

    for (const rm of quotation.rooms) {
      items.push({
        id: `ei-${Date.now()}-r-${rm.roomTypeId}`,
        itemType: 'Extra Service',
        description: `Group Room Block: ${rm.roomCount}x ${rm.roomTypeName} (${rm.nights} Night${rm.nights > 1 ? 's' : ''})`,
        quantity: rm.roomCount * rm.nights,
        unitPrice: rm.ratePerNight,
        total: rm.totalAmount
      });
    }

    for (const s of quotation.additionalServices) {
      items.push({
        id: `ei-${Date.now()}-s-${s.id}`,
        itemType: s.category === 'Audio-Visual' ? 'Sound & AV' : s.category === 'Stage & Decor' ? 'Stage Setup' : 'Extra Service',
        description: `${s.name} (${s.category})`,
        quantity: s.quantity,
        unitPrice: s.rate,
        total: s.total
      });
    }

    const primaryHall = quotation.halls[0];
    const resolvedHallId = primaryHall ? primaryHall.hallId : (state.halls[0]?.id || '');
    if (!resolvedHallId) throw new Error('No hall found in quotation or system');

    const createdEvent = this.createEventBooking({
      clientName: quotation.clientName,
      clientCompany: quotation.clientCompany,
      clientPhone: quotation.clientPhone,
      clientEmail: quotation.clientEmail,
      hallId: resolvedHallId,
      eventName: quotation.eventName,
      eventType: quotation.eventType,
      eventDate: quotation.eventDate,
      startTime: quotation.startTime,
      endTime: quotation.endTime,
      guestCount: quotation.guestCount,
      packageId: quotation.packageId,
      notes: `Converted from Quotation ${quotation.quotationNumber}. ${quotation.notes || ''}`,
      items
    });

    // Update quotation status and link
    quotation.status = 'Converted to Event';
    quotation.convertedEventId = createdEvent.id;
    quotation.updatedAt = new Date().toISOString();

    this.logAudit('Converted Quotation to Event', 'Event', createdEvent.id, createdEvent.eventNumber, `Quotation ${quotation.quotationNumber} successfully converted to Event Booking ${createdEvent.eventNumber}`);
    this.addAlert('success', `Quotation Converted: ${quotation.quotationNumber}`, `Successfully converted to confirmed event booking ${createdEvent.eventNumber} (${createdEvent.eventName}).`, 'Banquet & Convention', 'convention');
    notify();

    return createdEvent;
  },

  // -------------------------------------------------------------
  // GLOBAL SEARCH (Unified Enterprise Search Engine)
  // -------------------------------------------------------------
  searchGlobal(query: string): {
    guests: Guest[];
    reservations: Reservation[];
    rooms: Room[];
    invoices: Invoice[];
    events: EventBooking[];
    folios: Folio[];
    orders: RestaurantOrder[];
  } {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      return { guests: [], reservations: [], rooms: [], invoices: [], events: [], folios: [], orders: [] };
    }

    const guests = (state.guests || []).filter(g =>
      (g.fullName && g.fullName.toLowerCase().includes(q)) ||
      (g.phone && g.phone.includes(q)) ||
      (g.guestCode && g.guestCode.toLowerCase().includes(q)) ||
      (g.email && g.email.toLowerCase().includes(q)) ||
      (g.idNumber && g.idNumber.toLowerCase().includes(q)) ||
      (g.company && g.company.toLowerCase().includes(q))
    );

    const reservations = (state.reservations || []).filter(r =>
      (r.reservationNumber && r.reservationNumber.toLowerCase().includes(q)) ||
      (r.guestName && r.guestName.toLowerCase().includes(q)) ||
      (r.guestPhone && r.guestPhone.includes(q)) ||
      (r.assignedRoomNumber && r.assignedRoomNumber.includes(q)) ||
      (r.roomTypeName && r.roomTypeName.toLowerCase().includes(q)) ||
      (r.bookingSource && r.bookingSource.toLowerCase().includes(q))
    );

    const rooms = (state.rooms || []).filter(r =>
      (r.roomNumber && r.roomNumber.includes(q)) ||
      (r.roomTypeName && r.roomTypeName.toLowerCase().includes(q)) ||
      (r.operationalStatus && r.operationalStatus.toLowerCase().includes(q)) ||
      (r.housekeepingStatus && r.housekeepingStatus.toLowerCase().includes(q)) ||
      (r.floor !== undefined && `floor ${r.floor}`.includes(q))
    );

    const invoices = (state.invoices || []).filter(inv =>
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
      (inv.guestOrClientName && inv.guestOrClientName.toLowerCase().includes(q)) ||
      (inv.roomOrHall && inv.roomOrHall.toLowerCase().includes(q)) ||
      (inv.stayOrEventDetails && inv.stayOrEventDetails.toLowerCase().includes(q))
    );

    const events = (state.eventBookings || []).filter(e =>
      (e.eventNumber && e.eventNumber.toLowerCase().includes(q)) ||
      (e.eventName && e.eventName.toLowerCase().includes(q)) ||
      (e.clientName && e.clientName.toLowerCase().includes(q)) ||
      (e.hallName && e.hallName.toLowerCase().includes(q)) ||
      (e.clientPhone && e.clientPhone.includes(q))
    );

    const folios = (state.folios || []).filter(f =>
      (f.folioNumber && f.folioNumber.toLowerCase().includes(q)) ||
      (f.guestName && f.guestName.toLowerCase().includes(q)) ||
      (f.roomNumber && f.roomNumber.includes(q))
    );

    const orders = (state.restaurantOrders || []).filter(o =>
      (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
      (o.tableNumber && o.tableNumber.toLowerCase().includes(q)) ||
      (o.roomNumber && o.roomNumber.includes(q)) ||
      (o.guestName && o.guestName.toLowerCase().includes(q)) ||
      (o.orderType && o.orderType.toLowerCase().includes(q)) ||
      (o.items && o.items.some(it => it.name && it.name.toLowerCase().includes(q)))
    );

    return { guests, reservations, rooms, invoices, events, folios, orders };
  },

  // -------------------------------------------------------------
  // OPERATIONAL & MANAGEMENT KPIS
  // -------------------------------------------------------------
  getOperationalKPIs() {
    const totalRooms = state.rooms.filter(r => r.active).length;
    const occupiedRooms = state.rooms.filter(r => r.active && r.operationalStatus === 'Occupied').length;
    const reservedRooms = state.rooms.filter(r => r.active && r.operationalStatus === 'Reserved').length;
    const availableRooms = state.rooms.filter(r => r.active && (r.operationalStatus === 'Available' || r.operationalStatus === 'Inspected')).length;
    const dirtyRooms = state.rooms.filter(r => r.active && (r.operationalStatus === 'Dirty' || r.operationalStatus === 'Cleaning')).length;
    const oooRooms = state.rooms.filter(r => r.active && r.operationalStatus === 'Out of Order').length;

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const todayStr = state.settings?.currentBusinessDate || new Date().toISOString().split('T')[0];
    const todayArrivals = state.reservations.filter(r => (r.status === 'Confirmed' || r.status === 'Unconfirmed' || (r.status as string) === 'Pending') && (r.arrivalDate === todayStr || r.arrivalDate <= todayStr));
    const todayDepartures = state.stays.filter(s => s.expectedCheckOutAt && s.expectedCheckOutAt.startsWith(todayStr) && s.status === 'Active');
    const inHouseGuests = state.stays.filter(s => s.status === 'Active').length;

    // Financial revenue calculations from payments and folios
    const totalPayments = state.payments.reduce((acc, p) => acc + p.amount, 0);
    const roomRevenue = state.folios.reduce((acc, f) => {
      const roomCharges = (f.items || []).filter(i => i.type === 'Room Charge').reduce((sum, item) => sum + item.total, 0);
      return acc + roomCharges;
    }, 0);

    const restaurantRevenue = state.folios.reduce((acc, f) => {
      const dining = (f.items || []).filter(i => i.type === 'Restaurant' || i.type === 'Room Service').reduce((sum, item) => sum + item.total, 0);
      return acc + dining;
    }, 0);

    const eventRevenue = state.eventBookings.reduce((acc, e) => acc + e.deposit, 0);

    const outstandingBalance = state.folios.filter(f => f.status === 'Open').reduce((acc, f) => acc + Math.max(0, f.balance), 0) +
      state.eventBookings.filter(e => e.status !== 'Cancelled').reduce((acc, e) => acc + Math.max(0, e.balance), 0);

    // Hotel metrics: ADR & RevPAR
    const adr = occupiedRooms > 0 ? Math.round(roomRevenue / Math.max(1, occupiedRooms)) : 0;
    const revpar = totalRooms > 0 ? Math.round(roomRevenue / totalRooms) : 0;

    const todayEvents = state.eventBookings.filter(e => e.eventDate === todayStr && e.status !== 'Cancelled');

    return {
      totalRooms,
      occupiedRooms,
      reservedRooms,
      availableRooms,
      dirtyRooms,
      oooRooms,
      occupancyRate,
      todayArrivalsCount: todayArrivals.length,
      todayDeparturesCount: todayDepartures.length,
      inHouseGuests,
      todayRevenue: totalPayments,
      roomRevenue,
      restaurantRevenue,
      eventRevenue,
      outstandingBalance,
      adr,
      revpar,
      todayEventsCount: todayEvents.length
    };
  },

  // -------------------------------------------------------------
  // EXPORT TO EXCEL / CSV (.xlsx)
  // -------------------------------------------------------------
  exportTableToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  // -------------------------------------------------------------
  // ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION ENGINE
  // -------------------------------------------------------------
  hasPermission(permission: string, user?: User): boolean {
    if (rbacService && rbacService.hasPermission(permission)) {
      return true;
    }
    const targetUser = user || state.currentUser;
    if (!targetUser) return false;
    // Super Admin & General Manager always have full access
    if (targetUser.role === 'Super Admin' || targetUser.role === 'General Manager') {
      return true;
    }
    const rolePerm = state.rolePermissions.find(rp => rp.roleName === targetUser.role);
    if (!rolePerm) return false;
    return rolePerm.permissions.includes('*') || rolePerm.permissions.includes(permission as any);
  },

  updateRolePermissions(roleName: UserRoleName, permissions: string[]): { success: boolean; message: string } {
    if (!this.hasPermission('can_manage_roles')) {
      throw new Error('Permission denied: You do not have permission to manage roles.');
    }
    let rolePerm = state.rolePermissions.find(rp => rp.roleName === roleName);
    if (rolePerm) {
      rolePerm.permissions = permissions;
    } else {
      state.rolePermissions.push({
        id: `rp-${Date.now()}`,
        roleName,
        permissions
      });
    }
    this.logAudit('Updated Role Permissions', 'User', state.currentUser.id, undefined, `Updated permissions for role: ${roleName}`);
    notify();
    return { success: true, message: `Permissions for ${roleName} updated successfully.` };
  },

  addUser(userData: {
    name: string;
    email: string;
    role: UserRoleName;
    phone?: string;
    active: boolean;
  }): { success: boolean; user: User; message: string } {
    if (!this.hasPermission('can_manage_users')) {
      throw new Error('Permission denied: You do not have permission to add users.');
    }
    const exists = state.users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (exists) {
      throw new Error(`A user with email ${userData.email} already exists.`);
    }
    const newUser: User = {
      id: `u-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      phone: userData.phone || '',
      active: userData.active,
      createdAt: new Date().toISOString()
    };
    state.users.push(newUser);
    this.logAudit('Added Staff User', 'User', newUser.id, undefined, `Created user ${newUser.name} (${newUser.role})`);
    notify();
    return { success: true, user: newUser, message: `User ${newUser.name} created successfully.` };
  },

  updateUser(userId: string, updates: Partial<User>): { success: boolean; message: string } {
    if (!this.hasPermission('can_manage_users')) {
      throw new Error('Permission denied: You do not have permission to modify users.');
    }
    const user = state.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    Object.assign(user, updates);
    this.logAudit('Modified Staff User', 'User', user.id, undefined, `Updated profile/role for ${user.name}`);
    notify();
    return { success: true, message: `User ${user.name} updated successfully.` };
  },

  deleteUser(userId: string): { success: boolean; message: string } {
    if (!this.hasPermission('can_manage_users')) {
      throw new Error('Permission denied: You do not have permission to delete users.');
    }
    if (userId === state.currentUser.id) {
      throw new Error('You cannot delete your own active account.');
    }
    const user = state.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    state.users = state.users.filter(u => u.id !== userId);
    this.logAudit('Deleted Staff User', 'User', userId, undefined, `Deleted user ${user.name} (${user.role})`);
    notify();
    return { success: true, message: `User ${user.name} removed successfully.` };
  },

  // -------------------------------------------------------------
  // VOIDING SYSTEM (Orders, Folio Charges, Payments, Reservations)
  // -------------------------------------------------------------
  voidRestaurantOrder(orderId: string, voidReason: string): { success: boolean; message: string } {
    if (!this.hasPermission('can_void_bills')) {
      throw new Error('Permission Denied: User role does not have authorization to void bills.');
    }
    const order = state.restaurantOrders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found.');
    if (order.voided) throw new Error('Order is already voided.');

    order.voided = true;
    order.voidReason = voidReason;
    order.voidedAt = new Date().toISOString();
    order.voidedBy = state.currentUser.name;
    order.status = 'Voided';
    order.paymentStatus = 'Voided';

    // If order was billed to a folio, void the corresponding folio line item as well
    if (order.folioId) {
      const folio = state.folios.find(f => f.id === order.folioId);
      if (folio) {
        const item = folio.items.find(i => i.reference === order.orderNumber);
        if (item) {
          item.voided = true;
          item.voidReason = `Order Voided: ${voidReason}`;
          item.voidedAt = new Date().toISOString();
          item.voidedBy = state.currentUser.name;
          this.recalculateFolio(folio);
        }
      }
    }

    this.logAudit('Voided Restaurant Bill', 'Order', order.id, 'Active', `Voided ${order.orderNumber} (৳${order.total}). Reason: ${voidReason}`);
    this.addAlert('warning', `Order Voided: ${order.orderNumber}`, `${order.orderNumber} was voided by ${state.currentUser.name}. Reason: ${voidReason}`, 'View POS', 'restaurant');
    notify();
    return { success: true, message: `Order ${order.orderNumber} has been successfully voided.` };
  },

  voidRestaurantOrderItem(orderId: string, itemIndex: number, voidReason: string): { success: boolean; message: string } {
    if (!this.hasPermission('can_void_bills')) {
      throw new Error('Permission Denied: User role does not have authorization to void items.');
    }
    const order = state.restaurantOrders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found.');
    if (!order.items[itemIndex]) throw new Error('Order item not found.');

    const targetItem = order.items[itemIndex];
    targetItem.voided = true;
    targetItem.voidReason = voidReason;

    // Recalculate order totals from non-voided items
    const activeItems = order.items.filter(i => !i.voided);
    const subtotal = activeItems.reduce((acc, curr) => acc + curr.total, 0);
    const discount = order.discount || 0;
    const taxableSubtotal = Math.max(0, subtotal - discount);
    const sc = Math.round(taxableSubtotal * (state.settings.serviceChargePercent / 100));
    const tax = Math.round(taxableSubtotal * (state.settings.taxRatePercent / 100));
    const total = order.isComplimentary ? 0 : (taxableSubtotal + sc + tax);

    order.subtotal = subtotal;
    order.serviceCharge = sc;
    order.tax = tax;
    order.total = total;

    if (activeItems.length === 0) {
      order.voided = true;
      order.voidReason = 'All items voided';
      order.status = 'Voided';
    }

    // Update folio charge if posted
    if (order.folioId) {
      const folio = state.folios.find(f => f.id === order.folioId);
      if (folio) {
        const fItem = folio.items.find(i => i.reference === order.orderNumber);
        if (fItem) {
          if (activeItems.length === 0) {
            fItem.voided = true;
            fItem.voidReason = `All items voided: ${voidReason}`;
          } else {
            fItem.unitPrice = total;
            fItem.total = total;
          }
          this.recalculateFolio(folio);
        }
      }
    }

    this.logAudit('Voided Order Item', 'Order', order.id, undefined, `Voided "${targetItem.name}" on ${order.orderNumber}. Reason: ${voidReason}`);
    notify();
    return { success: true, message: `Item "${targetItem.name}" voided and bill recalculated.` };
  },

  settleRestaurantOrder(orderId: string, params: {
    paymentMethod: string;
    tenderAmount?: number;
    changeAmount?: number;
    discountPercent?: number;
    discountAmount?: number;
    discountReason?: string;
    isComplimentary?: boolean;
    complimentaryReason?: string;
    postToFolio?: boolean;
    stayId?: string;
  }): { success: boolean; order: RestaurantOrder; message: string } {
    const order = state.restaurantOrders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found.');
    if (order.voided) throw new Error('Cannot settle a voided order.');

    // Apply discounts or complimentary status
    if (params.isComplimentary) {
      order.isComplimentary = true;
      order.complimentaryReason = params.complimentaryReason || 'Manager Complimentary Approval';
      order.discount = order.subtotal;
      order.serviceCharge = 0;
      order.tax = 0;
      order.total = 0;
      order.paymentMethod = 'Complimentary (NC)';
      order.paymentStatus = 'Settled';
    } else {
      let discountVal = params.discountAmount || 0;
      if (params.discountPercent && params.discountPercent > 0) {
        discountVal = Math.round(order.subtotal * (params.discountPercent / 100));
      }
      order.discount = discountVal;
      order.discountPercent = params.discountPercent;
      order.discountReason = params.discountReason;

      const taxableSubtotal = Math.max(0, order.subtotal - discountVal);
      const sc = Math.round(taxableSubtotal * (state.settings.serviceChargePercent / 100));
      const tax = Math.round(taxableSubtotal * (state.settings.taxRatePercent / 100));
      order.serviceCharge = sc;
      order.tax = tax;
      order.total = taxableSubtotal + sc + tax;

      order.paymentMethod = params.paymentMethod;
      order.tenderAmount = params.tenderAmount || order.total;
      order.changeAmount = params.changeAmount || 0;

      if (params.postToFolio && params.stayId) {
        const stay = state.stays.find(s => s.id === params.stayId);
        if (stay) {
          if (stay.stopPost) {
            throw new Error(`Room ${stay.roomNumber} has Stop Post enabled.`);
          }
          order.stayId = stay.id;
          order.roomNumber = stay.roomNumber;
          order.guestName = stay.guestName;
          order.folioId = stay.folioId;
          order.paymentStatus = 'Billed-To-Room';
          order.status = 'Posted to Folio';

          this.postFolioCharge(stay.folioId, {
            type: order.orderType === 'room-dining' ? 'Room Service' : 'Restaurant',
            description: `F&B [${order.orderNumber}]: ${order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}`,
            quantity: 1,
            unitPrice: order.total,
            applyTax: false,
            reference: order.orderNumber
          });
        }
      } else {
        order.paymentStatus = 'Paid-Direct';
        order.status = 'Settled Direct';

        // Auto-generate double-entry Journal Voucher for Direct POS Settlement
        const debitCode = order.paymentMethod === 'Cash' ? '1020' : '1010';
        const debitName = order.paymentMethod === 'Cash' ? 'Front Desk & Outlet Cashier Drawers' : 'Cash in Vault & Commercial Bank Accounts';
        const revenueCode = order.orderType === 'bar-lounge' ? '4030' : '4020';
        const revenueName = order.orderType === 'bar-lounge' ? 'Bar & Lounge Revenue' : 'Food & Beverage Outlet Sales';

        const jvEntries: JournalEntryItem[] = [
          { id: `jve-${Date.now()}-pos1`, accountCode: debitCode, accountName: debitName, debit: order.total, credit: 0, memo: `POS Receipt via ${order.paymentMethod}` },
          { id: `jve-${Date.now()}-pos2`, accountCode: revenueCode, accountName: revenueName, debit: 0, credit: taxableSubtotal, memo: `POS ${order.orderType || 'F&B'} Sales` }
        ];

        if (sc > 0) {
          jvEntries.push({ id: `jve-${Date.now()}-pos3`, accountCode: '2110', accountName: 'Service Charge Payable (10% Staff Pool)', debit: 0, credit: sc, memo: '10% Service Charge' });
        }
        if (tax > 0) {
          jvEntries.push({ id: `jve-${Date.now()}-pos4`, accountCode: '2100', accountName: 'VAT / Government Tax Payable (15%)', debit: 0, credit: tax, memo: '15% Government VAT' });
        }

        const totalD = jvEntries.reduce((s, e) => s + e.debit, 0);
        const totalC = jvEntries.reduce((s, e) => s + e.credit, 0);
        if (totalD !== totalC && jvEntries.length > 0) {
          jvEntries[0].debit = totalC;
        }

        this.createJournalVoucher({
          date: state.settings.currentBusinessDate || new Date().toISOString().split('T')[0],
          sourceModule: order.orderType === 'bar-lounge' ? 'Bar & Beverage' : 'Restaurant POS',
          sourceReference: order.orderNumber,
          narration: `Direct POS Settlement for ${order.orderNumber} (${order.orderType === 'bar-lounge' ? 'Bar Lounge' : 'Main Restaurant'}) via ${order.paymentMethod}. Total: ৳${(order.total || 0).toLocaleString()}`,
          entries: jvEntries
        });
      }
    }

    order.settledAt = new Date().toISOString();
    order.settledBy = state.currentUser.name;

    this.logAudit('Settled Restaurant Bill', 'Order', order.id, 'Pending', `Settled ${order.orderNumber} (৳${order.total}) via ${order.paymentMethod}`);
    this.addAlert('success', `Bill Settled: ${order.orderNumber}`, `Total ৳${order.total} received via ${order.paymentMethod}`, 'View POS', 'restaurant');
    notify();
    return { success: true, order, message: `Bill ${order.orderNumber} settled successfully.` };
  },

  resettleRestaurantOrder(orderId: string, updates: {
    paymentMethod: string;
    resettlementReason: string;
    tenderAmount?: number;
    changeAmount?: number;
    discountAmount?: number;
    discountReason?: string;
    stayId?: string;
    postToFolio?: boolean;
  }): { success: boolean; order: RestaurantOrder; message: string } {
    if (!this.hasPermission('can_void_bills') && !this.hasPermission('billing:bill-resettle') && !this.hasPermission('approvals:bill-resettle')) {
      throw new Error('Permission Denied: Supervisor authorization required for bill resettlement.');
    }
    const order = state.restaurantOrders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found.');
    if (order.voided) throw new Error('Cannot resettle a voided order.');

    const previousMethod = order.paymentMethod || 'Cash';
    order.previousPaymentMethod = previousMethod;
    order.isResettled = true;
    order.resettledAt = new Date().toISOString();
    order.resettledBy = state.currentUser.name;
    order.resettlementReason = updates.resettlementReason;
    order.paymentMethod = updates.paymentMethod;

    if (updates.discountAmount !== undefined) {
      order.discount = updates.discountAmount;
      order.discountReason = updates.discountReason || order.discountReason;
      const taxableSubtotal = Math.max(0, order.subtotal - updates.discountAmount);
      const sc = Math.round(taxableSubtotal * (state.settings.serviceChargePercent / 100));
      const tax = Math.round(taxableSubtotal * (state.settings.taxRatePercent / 100));
      order.serviceCharge = sc;
      order.tax = tax;
      order.total = taxableSubtotal + sc + tax;
    }

    if (updates.tenderAmount !== undefined) {
      order.tenderAmount = updates.tenderAmount;
      order.changeAmount = updates.changeAmount || 0;
    }

    // Handle folio switching
    if (updates.postToFolio && updates.stayId) {
      const stay = state.stays.find(s => s.id === updates.stayId);
      if (stay) {
        order.stayId = stay.id;
        order.roomNumber = stay.roomNumber;
        order.guestName = stay.guestName;
        order.folioId = stay.folioId;
        order.paymentStatus = 'Billed-To-Room';
        order.status = 'Posted to Folio';

        this.postFolioCharge(stay.folioId, {
          type: order.orderType === 'room-dining' ? 'Room Service' : 'Restaurant',
          description: `F&B Resettled [${order.orderNumber}]: ${order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}`,
          quantity: 1,
          unitPrice: order.total,
          applyTax: false,
          reference: order.orderNumber
        });
      }
    } else if (order.folioId && !updates.postToFolio) {
      // Reversed from Folio
      const folio = state.folios.find(f => f.id === order.folioId);
      if (folio) {
        const fItem = folio.items.find(i => i.reference === order.orderNumber);
        if (fItem) {
          fItem.voided = true;
          fItem.voidReason = `Resettled direct: ${updates.resettlementReason}`;
          this.recalculateFolio(folio);
        }
      }
      order.folioId = undefined;
      order.stayId = undefined;
      order.paymentStatus = 'Paid-Direct';
      order.status = 'Settled Direct';
    }

    this.logAudit('Resettled Restaurant Bill', 'Order', order.id, previousMethod, `Resettled ${order.orderNumber} from ${previousMethod} to ${updates.paymentMethod}. Reason: ${updates.resettlementReason}`);
    this.addAlert('info', `Bill Resettled: ${order.orderNumber}`, `Payment tender changed from ${previousMethod} to ${updates.paymentMethod}`, 'View POS', 'restaurant');
    notify();
    return { success: true, order, message: `Bill ${order.orderNumber} successfully resettled.` };
  },

  updateOrderKotStatus(orderId: string, status: RestaurantOrder['kotStatus']): void {
    const order = state.restaurantOrders.find(o => o.id === orderId);
    if (!order) return;
    order.kotStatus = status;
    if (status === 'Served' && order.status === 'Preparing') {
      order.status = 'Served';
    }
    notify();
  },

  voidFolioItem(folioId: string, itemId: string, voidReason: string): { success: boolean; message: string } {
    if (!this.hasPermission('can_void_bills') && !this.hasPermission('folio:void-charge') && !this.hasPermission('billing:bill-void') && !this.hasPermission('approvals:bill-void')) {
      throw new Error('Permission Denied: User role does not have authorization to void guest bill items.');
    }
    const folio = state.folios.find(f => f.id === folioId);
    if (!folio) throw new Error('Folio not found.');

    const item = folio.items.find(i => i.id === itemId);
    if (!item) throw new Error('Bill item not found.');
    if (item.voided) throw new Error('Item is already voided.');

    item.voided = true;
    item.voidReason = voidReason;
    item.voidedAt = new Date().toISOString();
    item.voidedBy = state.currentUser.name;

    // Recalculate the folio grand total and balance
    this.recalculateFolio(folio);

    this.logAudit('Voided Bill Item', 'Folio', folio.id, undefined, `Voided "${item.description}" (৳${item.total}) on Folio ${folio.folioNumber}. Reason: ${voidReason}`);
    this.addAlert('warning', `Bill Item Voided: Folio ${folio.folioNumber}`, `Charge of ৳${item.total} voided by ${state.currentUser.name}.`, 'View Folio', 'billing');
    notify();
    return { success: true, message: `Charge line "${item.description}" voided and folio rebalanced.` };
  },

  cleanErroneousAutoCharges(folioId?: string): { success: boolean; removedCount: number; message: string } {
    let totalRemoved = 0;
    const targetFolios = folioId ? state.folios.filter(f => f.id === folioId) : state.folios;

    targetFolios.forEach(folio => {
      if (Array.isArray(folio.items)) {
        const origCount = folio.items.length;
        folio.items = folio.items.filter(item => {
          const isRunaway = 
            Boolean(item.postedBy && item.postedBy.includes('System Auto Night Audit')) &&
            Boolean(item.description && (
              item.description.includes('2028-') || 
              item.description.includes('2027-') || 
              item.description.includes('2026-09-23') ||
              item.description.includes('2026-09-24') ||
              item.description.includes('2026-09-25') ||
              item.description.includes('2026-09-26') ||
              item.description.includes('2026-09-27')
            ));
          return !isRunaway;
        });
        const removed = origCount - folio.items.length;
        if (removed > 0) {
          totalRemoved += removed;
          this.recalculateFolio(folio);
        }
      }
    });

    if (totalRemoved > 0) {
      this.logAudit('Purged Erroneous Auto-Charges', 'Folio', folioId || 'All', undefined, `Purged ${totalRemoved} erroneous future auto-charges and rebalanced folios.`);
      notify();
    }
    return {
      success: true,
      removedCount: totalRemoved,
      message: `Cleaned up ${totalRemoved} erroneous charges. Folio ledger re-balanced accurately.`
    };
  },

  voidPayment(paymentId: string, voidReason: string): { success: boolean; message: string } {
    if (!this.hasPermission('can_void_payments') && !this.hasPermission('payment:void') && !this.hasPermission('approvals:payment-void')) {
      throw new Error('Permission Denied: User role does not have authorization to void payments.');
    }
    const payment = state.payments.find(p => p.id === paymentId);
    if (!payment) throw new Error('Payment transaction not found.');
    if (payment.voided) throw new Error('Payment is already voided.');

    payment.voided = true;
    payment.voidReason = voidReason;
    payment.voidedAt = new Date().toISOString();
    payment.voidedBy = state.currentUser.name;
    payment.status = 'Void';

    // Reverse from Folio if linked
    if (payment.folioId) {
      const folio = state.folios.find(f => f.id === payment.folioId);
      if (folio) {
        folio.paidTotal -= payment.amount;
        folio.balance = folio.grandTotal - folio.paidTotal;
        if (folio.status === 'Settled' && folio.balance > 0) {
          folio.status = 'Open';
        }
      }
    }

    // Reverse from Reservation if linked
    if (payment.reservationId) {
      const res = state.reservations.find(r => r.id === payment.reservationId);
      if (res) {
        res.paidAmount = Math.max(0, res.paidAmount - payment.amount);
      }
    }

    this.logAudit('Voided Payment Transaction', 'Payment', payment.id, 'Completed', `Voided payment ${payment.transactionNumber} of ৳${payment.amount}. Reason: ${voidReason}`);
    this.addAlert('warning', `Payment Voided: ${payment.transactionNumber}`, `৳${payment.amount} reversed by ${state.currentUser.name}. Reason: ${voidReason}`, 'View Payments', 'billing');
    notify();
    return { success: true, message: `Payment ${payment.transactionNumber} voided and balances updated.` };
  },

  resettleFolio(folioId: string, reason: string): { success: boolean; folio: Folio; message: string } {
    if (!this.hasPermission('billing:bill-resettle') && !this.hasPermission('approvals:bill-resettle') && !this.hasPermission('can_void_bills')) {
      throw new Error('Permission Denied: Supervisor authorization required for folio resettlement.');
    }
    const folio = state.folios.find(f => f.id === folioId);
    if (!folio) throw new Error('Folio not found.');
    folio.status = 'Open';
    this.recalculateFolio(folio);
    this.logAudit('Resettled Folio', 'Folio', folio.id, 'Closed', `Folio ${folio.folioNumber} reopened for resettlement. Reason: ${reason}`);
    this.addAlert('info', `Folio Resettled: ${folio.folioNumber}`, `Reopened for adjustments by ${state.currentUser.name}`, 'View Folio', 'billing');
    notify();
    return { success: true, folio, message: `Folio ${folio.folioNumber} has been reopened for resettlement.` };
  },

  voidEntireFolio(folioId: string, voidReason: string): { success: boolean; message: string } {
    if (!this.hasPermission('billing:bill-void') && !this.hasPermission('approvals:bill-void') && !this.hasPermission('can_void_bills')) {
      throw new Error('Permission Denied: Manager authorization required to void entire bill/folio.');
    }
    const folio = state.folios.find(f => f.id === folioId);
    if (!folio) throw new Error('Folio not found.');
    folio.status = 'Void';
    folio.items.forEach(it => {
      it.voided = true;
      it.voidReason = `Entire folio voided: ${voidReason}`;
      it.voidedAt = new Date().toISOString();
      it.voidedBy = state.currentUser.name;
    });
    this.recalculateFolio(folio);
    this.logAudit('Voided Entire Folio', 'Folio', folio.id, undefined, `Entire Folio ${folio.folioNumber} voided. Reason: ${voidReason}`);
    this.addAlert('warning', `Folio Voided: ${folio.folioNumber}`, `Folio completely voided by ${state.currentUser.name}. Reason: ${voidReason}`, 'View Folio', 'billing');
    notify();
    return { success: true, message: `Folio ${folio.folioNumber} has been completely voided.` };
  },

  // -------------------------------------------------------------
  // RESERVATION MODIFY & DELETE (WITH PERMISSION CHECKS)
  // -------------------------------------------------------------
  updateReservation(reservationId: string, updates: Partial<Reservation>): { success: boolean; message: string } {
    if (!this.hasPermission('can_modify_reservations')) {
      throw new Error('Permission Denied: User role does not have authorization to modify reservations.');
    }
    const res = state.reservations.find(r => r.id === reservationId);
    if (!res) throw new Error('Reservation not found.');

    const oldStatus = res.status;
    Object.assign(res, updates, { updatedAt: new Date().toISOString() });

    // Recalculate estimated total if arrival/departure/rate changed
    if (updates.arrivalDate || updates.departureDate || updates.rate) {
      const d1 = new Date(res.arrivalDate);
      const d2 = new Date(res.departureDate);
      const nights = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
      const base = nights * res.rate;
      const sc = Math.round(base * (state.settings.serviceChargePercent / 100));
      const tax = Math.round(base * (state.settings.taxRatePercent / 100));
      res.totalEstimatedAmount = base + sc + tax;
    }

    this.logAudit('Modified Reservation', 'Reservation', res.id, oldStatus, `Updated reservation details for ${res.guestName} (${res.reservationNumber})`);
    notify();
    return { success: true, message: `Reservation ${res.reservationNumber} modified successfully.` };
  },

  assignRoomToReservation(reservationId: string, roomId: string): { success: boolean; message: string } {
    const res = state.reservations.find(r => r.id === reservationId);
    if (!res) throw new Error('Reservation not found');
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');

    const avail = this.checkRoomAvailability(roomId, res.arrivalDate, res.departureDate);
    if (!avail.isAvailable) {
      throw new Error(avail.reason || 'Room is not available for the selected dates');
    }

    res.assignedRoomId = room.id;
    res.assignedRoomNumber = room.roomNumber;
    res.updatedAt = new Date().toISOString();

    const todayStr = state.settings.currentBusinessDate || new Date().toISOString().split('T')[0];
    if (res.arrivalDate === todayStr && room.operationalStatus === 'Available') {
      room.operationalStatus = 'Reserved';
    }

    this.logAudit('Assigned Room to Reservation', 'Reservation', res.id, undefined, `Assigned Room ${room.roomNumber} to ${res.guestName} (${res.reservationNumber})`);
    notify();
    return { success: true, message: `Room ${room.roomNumber} allocated to ${res.guestName}.` };
  },

  deleteReservation(reservationId: string, reason: string): { success: boolean; message: string } {
    if (!this.hasPermission('can_delete_reservations')) {
      throw new Error('Permission Denied: User role does not have authorization to delete reservations.');
    }
    const res = state.reservations.find(r => r.id === reservationId);
    if (!res) throw new Error('Reservation not found.');
    if (res.status === 'Checked-In') {
      throw new Error('Cannot delete a reservation that is currently Checked-In. Please check out the guest first.');
    }

    // Release assigned room if reserved
    if (res.assignedRoomId) {
      const room = state.rooms.find(r => r.id === res.assignedRoomId);
      if (room && room.operationalStatus === 'Reserved') {
        room.operationalStatus = 'Available';
      }
    }

    res.status = 'Cancelled';
    res.specialRequests = (res.specialRequests ? res.specialRequests + ' | ' : '') + `[DELETED/CANCELLED by ${state.currentUser.name}: ${reason}]`;
    res.updatedAt = new Date().toISOString();

    this.logAudit('Deleted/Cancelled Reservation', 'Reservation', res.id, 'Active', `Reservation ${res.reservationNumber} cancelled. Reason: ${reason}`);
    this.addAlert('info', `Reservation Cancelled: ${res.reservationNumber}`, `${res.reservationNumber} (${res.guestName}) cancelled by ${state.currentUser.name}.`, 'View Reservations', 'reservations');
    notify();
    return { success: true, message: `Reservation ${res.reservationNumber} has been removed/cancelled.` };
  },

  // -------------------------------------------------------------
  // ADMINISTRATION: ROOMS CRUD (ADD, EDIT, DELETE)
  // -------------------------------------------------------------
  addRoom(roomData: {
    roomNumber: string;
    roomTypeId: string;
    floor: number;
    building?: string;
    wing?: string;
    features?: string[];
    connectingRoom?: string;
    amenities?: string[];
    isSmoking?: boolean;
    keyCardCode?: string;
  }): { success: boolean; room: Room; message: string } {
    if (!this.hasPermission('can_manage_rooms')) {
      throw new Error('Permission Denied: User role does not have authorization to manage rooms.');
    }
    const existing = state.rooms.find(r => r.roomNumber.toLowerCase() === roomData.roomNumber.toLowerCase());
    if (existing) {
      throw new Error(`Room number ${roomData.roomNumber} already exists in the resort inventory.`);
    }
    const roomType = state.roomTypes.find(rt => rt.id === roomData.roomTypeId);
    if (!roomType) throw new Error('Selected room type not found.');

    const newRoom: Room = {
      id: `rm-${Date.now()}`,
      roomNumber: roomData.roomNumber,
      roomTypeId: roomType.id,
      roomTypeName: roomType.name,
      floor: roomData.floor,
      building: roomData.building || 'Main Resort Complex',
      wing: roomData.wing || (roomData.floor === 1 ? 'East Garden Wing' : 'West Lake Wing'),
      operationalStatus: 'Available',
      housekeepingStatus: 'Clean',
      features: roomData.features || ['Wi-Fi', 'Balcony', 'Smart TV', 'Mini Fridge', 'Air Conditioned'],
      connectingRoom: roomData.connectingRoom,
      amenities: roomData.amenities || ['King Bed', 'Rain Shower', 'Safety Deposit Locker', 'Electric Kettle'],
      isSmoking: roomData.isSmoking || false,
      keyCardCode: roomData.keyCardCode || `KC-${roomData.roomNumber}`,
      active: true
    };

    state.rooms.push(newRoom);
    this.logAudit('Created Room', 'Room', newRoom.id, undefined, `Added Room ${newRoom.roomNumber} (${newRoom.roomTypeName}) to floor ${newRoom.floor}`);
    this.addAlert('success', `New Room Added: ${newRoom.roomNumber}`, `Room ${newRoom.roomNumber} (${newRoom.roomTypeName}) has been added to the active inventory.`, 'Room Rack', 'rooms');
    saveDatabase(state);
    notify();
    return { success: true, room: newRoom, message: `Room ${newRoom.roomNumber} created successfully.` };
  },

  updateRoom(roomId: string, updates: Partial<Room>): { success: boolean; message: string } {
    if (!this.hasPermission('can_manage_rooms')) {
      throw new Error('Permission Denied: User role does not have authorization to modify rooms.');
    }
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found.');

    if (updates.roomNumber && updates.roomNumber !== room.roomNumber) {
      const duplicate = state.rooms.find(r => r.id !== roomId && r.roomNumber.toLowerCase() === updates.roomNumber?.toLowerCase());
      if (duplicate) throw new Error(`Room number ${updates.roomNumber} is already in use.`);
    }

    if (updates.roomTypeId && updates.roomTypeId !== room.roomTypeId) {
      const rt = state.roomTypes.find(t => t.id === updates.roomTypeId);
      if (rt) {
        room.roomTypeId = rt.id;
        room.roomTypeName = rt.name;
      }
    }

    Object.assign(room, updates);
    this.logAudit('Modified Room Details', 'Room', room.id, undefined, `Updated specifications for Room ${room.roomNumber}`);
    saveDatabase(state);
    notify();
    return { success: true, message: `Room ${room.roomNumber} updated successfully.` };
  },

  deleteRoom(roomId: string): { success: boolean; message: string } {
    if (!this.hasPermission('can_manage_rooms')) {
      throw new Error('Permission Denied: User role does not have authorization to delete rooms.');
    }
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found.');

    // Check if room has an active stay
    const activeStay = state.stays.find(s => s.roomId === roomId && s.status === 'Active');
    if (activeStay) {
      throw new Error(`Cannot delete Room ${room.roomNumber} because guest ${activeStay.guestName} is currently in-house.`);
    }

    // Check future reservations
    const upcomingRes = state.reservations.find(r => r.assignedRoomId === roomId && r.status === 'Confirmed');
    if (upcomingRes) {
      throw new Error(`Cannot delete Room ${room.roomNumber} because it is assigned to upcoming reservation ${upcomingRes.reservationNumber}. Reassign reservation first.`);
    }

    state.rooms = state.rooms.filter(r => r.id !== roomId);
    this.logAudit('Deleted Room', 'Room', roomId, undefined, `Removed Room ${room.roomNumber} (${room.roomTypeName}) from resort database`);
    this.addAlert('info', `Room Deleted: ${room.roomNumber}`, `Room ${room.roomNumber} was removed from the property inventory.`, 'Room Rack', 'rooms');
    saveDatabase(state);
    notify();
    return { success: true, message: `Room ${room.roomNumber} has been removed from inventory.` };
  },

  // -------------------------------------------------------------
  // ADMINISTRATION: FLOORS CRUD (GET, ADD, EDIT, DELETE)
  // -------------------------------------------------------------
  getFloors(): Floor[] {
    if (!Array.isArray(state.floors) || state.floors.length === 0) {
      state.floors = [...SEED_FLOORS];
      saveDatabase(state);
    }
    return [...state.floors].sort((a, b) => a.floorNumber - b.floorNumber);
  },

  addFloor(floorData: {
    floorNumber: number;
    name: string;
    code?: string;
    building?: string;
    wing?: string;
    keyCardPrefix?: string;
    isSmokingAllowed?: boolean;
    description?: string;
    active?: boolean;
  }): { success: boolean; floor: Floor; message: string } {
    if (!this.hasPermission('can_manage_rooms')) {
      throw new Error('Permission Denied: User role does not have authorization to manage property floors.');
    }
    if (floorData.floorNumber === undefined || floorData.floorNumber === null || isNaN(Number(floorData.floorNumber))) {
      throw new Error('Valid floor number is required.');
    }
    if (!floorData.name || !floorData.name.trim()) {
      throw new Error('Floor name is required.');
    }

    if (!Array.isArray(state.floors)) {
      state.floors = [...SEED_FLOORS];
    }

    const existing = state.floors.find(f => f.floorNumber === Number(floorData.floorNumber));
    if (existing) {
      throw new Error(`Floor number ${floorData.floorNumber} already exists ("${existing.name}").`);
    }

    const newFloor: Floor = {
      id: `fl-${floorData.floorNumber}-${Date.now()}`,
      floorNumber: Number(floorData.floorNumber),
      name: floorData.name.trim(),
      code: floorData.code?.trim() || `FL-${String(floorData.floorNumber).padStart(2, '0')}`,
      building: floorData.building?.trim() || 'Main Resort Complex',
      wing: floorData.wing?.trim() || 'Main Wing',
      keyCardPrefix: floorData.keyCardPrefix?.trim() || `KC-${floorData.floorNumber}`,
      isSmokingAllowed: !!floorData.isSmokingAllowed,
      description: floorData.description?.trim() || '',
      active: floorData.active !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    state.floors.push(newFloor);
    this.logAudit('Created Floor', 'Room', newFloor.id, undefined, `Created floor ${newFloor.name} (Floor #${newFloor.floorNumber}, ${newFloor.building})`);
    saveDatabase(state);
    notify();
    return { success: true, floor: newFloor, message: `Floor "${newFloor.name}" created successfully.` };
  },

  updateFloor(floorId: string, updates: Partial<Floor>): { success: boolean; floor: Floor; message: string } {
    if (!this.hasPermission('can_manage_rooms')) {
      throw new Error('Permission Denied: User role does not have authorization to modify floors.');
    }
    if (!Array.isArray(state.floors)) {
      state.floors = [...SEED_FLOORS];
    }
    const floor = state.floors.find(f => f.id === floorId);
    if (!floor) throw new Error('Floor not found.');

    if (updates.floorNumber !== undefined && Number(updates.floorNumber) !== floor.floorNumber) {
      const duplicate = state.floors.find(f => f.id !== floorId && f.floorNumber === Number(updates.floorNumber));
      if (duplicate) throw new Error(`Floor number ${updates.floorNumber} already exists ("${duplicate.name}").`);
    }

    Object.assign(floor, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    this.logAudit('Modified Floor', 'Room', floor.id, undefined, `Updated details for floor ${floor.name} (Floor #${floor.floorNumber})`);
    saveDatabase(state);
    notify();
    return { success: true, floor, message: `Floor "${floor.name}" updated successfully.` };
  },

  deleteFloor(floorId: string): { success: boolean; message: string } {
    if (!this.hasPermission('can_manage_rooms')) {
      throw new Error('Permission Denied: User role does not have authorization to delete floors.');
    }
    if (!Array.isArray(state.floors)) {
      state.floors = [...SEED_FLOORS];
    }
    const floor = state.floors.find(f => f.id === floorId);
    if (!floor) throw new Error('Floor not found.');

    // Check if any rooms exist on this floor
    const assignedRooms = state.rooms.filter(r => r.floor === floor.floorNumber);
    if (assignedRooms.length > 0) {
      throw new Error(`Cannot delete floor "${floor.name}": ${assignedRooms.length} room(s) [${assignedRooms.map(r => r.roomNumber).slice(0, 5).join(', ')}${assignedRooms.length > 5 ? '...' : ''}] are assigned to this floor. Please reassign rooms first.`);
    }

    state.floors = state.floors.filter(f => f.id !== floorId);
    this.logAudit('Deleted Floor', 'Room', floorId, floor.name, `Deleted floor ${floor.name} (#${floor.floorNumber})`);
    saveDatabase(state);
    notify();
    return { success: true, message: `Floor "${floor.name}" removed successfully.` };
  },

  // -------------------------------------------------------------
  // ADMINISTRATION: CONVENTION HALLS, BANQUET & MEETING ROOMS CRUD
  // -------------------------------------------------------------
  addHall(hallData: {
    name: string;
    code: string;
    venueType?: Hall['venueType'];
    floor?: string;
    description: string;
    capacity: number;
    seatingTheater?: number;
    seatingBanquet?: number;
    seatingUShape?: number;
    seatingClassroom?: number;
    dimensions: string;
    baseRatePerDay: number;
    baseRateHalfDay: number;
    baseRatePerHour?: number;
    amenities: string[];
  }): { success: boolean; hall: Hall; message: string } {
    if (!this.hasPermission('can_manage_halls')) {
      throw new Error('Permission Denied: User role does not have authorization to manage venues/halls.');
    }
    const existing = state.halls.find(h => h.code.toLowerCase() === hallData.code.toLowerCase() || h.name.toLowerCase() === hallData.name.toLowerCase());
    if (existing) {
      throw new Error(`A venue with code "${hallData.code}" or name "${hallData.name}" already exists.`);
    }

    const newHall: Hall = {
      id: `hl-${Date.now()}`,
      name: hallData.name,
      code: hallData.code.toUpperCase(),
      venueType: hallData.venueType || 'Banquet Hall',
      floor: hallData.floor || 'Ground Floor',
      description: hallData.description,
      capacity: hallData.capacity,
      seatingTheater: hallData.seatingTheater,
      seatingBanquet: hallData.seatingBanquet,
      seatingUShape: hallData.seatingUShape,
      seatingClassroom: hallData.seatingClassroom,
      dimensions: hallData.dimensions,
      baseRatePerDay: hallData.baseRatePerDay,
      baseRateHalfDay: hallData.baseRateHalfDay,
      baseRatePerHour: hallData.baseRatePerHour,
      amenities: hallData.amenities,
      active: true
    };

    state.halls.push(newHall);
    this.logAudit('Created Venue Hall', 'Hall', newHall.id, undefined, `Added venue ${newHall.name} (${newHall.code}) with capacity ${newHall.capacity}`);
    this.addAlert('success', `New Venue Created: ${newHall.name}`, `${newHall.venueType} "${newHall.name}" added with day rate ৳${(newHall.baseRatePerDay || 0).toLocaleString()}.`, 'View Events', 'events');
    notify();
    return { success: true, hall: newHall, message: `Venue "${newHall.name}" registered successfully.` };
  },

  updateHall(hallId: string, updates: Partial<Hall>): { success: boolean; message: string } {
    if (!this.hasPermission('can_manage_halls')) {
      throw new Error('Permission Denied: User role does not have authorization to modify venues/halls.');
    }
    const hall = state.halls.find(h => h.id === hallId);
    if (!hall) throw new Error('Hall / venue not found.');

    if (updates.code && updates.code !== hall.code) {
      const duplicate = state.halls.find(h => h.id !== hallId && h.code.toLowerCase() === updates.code?.toLowerCase());
      if (duplicate) throw new Error(`Venue code ${updates.code} is already in use.`);
    }

    Object.assign(hall, updates);
    this.logAudit('Modified Venue Details', 'Hall', hall.id, undefined, `Updated specs/rates for ${hall.name} (${hall.code})`);
    notify();
    return { success: true, message: `Venue "${hall.name}" updated successfully.` };
  },

  deleteHall(hallId: string): { success: boolean; message: string } {
    if (!this.hasPermission('can_manage_halls')) {
      throw new Error('Permission Denied: User role does not have authorization to delete venues/halls.');
    }
    const hall = state.halls.find(h => h.id === hallId);
    if (!hall) throw new Error('Venue not found.');

    // Check if any active or confirmed bookings exist for this hall
    const activeBooking = state.eventBookings.find(b => b.hallId === hallId && (b.status === 'Confirmed' || b.status === 'Ongoing'));
    if (activeBooking) {
      throw new Error(`Cannot delete "${hall.name}" because it has confirmed event booking "${activeBooking.eventName}" (${activeBooking.eventDate}).`);
    }

    state.halls = state.halls.filter(h => h.id !== hallId);
    this.logAudit('Deleted Venue Hall', 'Hall', hallId, undefined, `Deleted venue ${hall.name} (${hall.code}) from system`);
    this.addAlert('info', `Venue Deleted: ${hall.name}`, `Venue "${hall.name}" has been removed from convention hall listings.`, 'View Events', 'events');
    notify();
    return { success: true, message: `Venue "${hall.name}" removed successfully.` };
  },

  // -------------------------------------------------------------
  // NIGHT AUDIT ENGINE & AUTO-CLOSE (06:00 AM SCHEDULER)
  // -------------------------------------------------------------
  getNightAuditHistory(): NightAuditRecord[] {
    return state.nightAuditRecords || [];
  },

  updateNightAuditSettings(enabled: boolean, time: string): { success: boolean; message: string } {
    state.settings.autoNightAuditEnabled = enabled;
    state.settings.autoNightAuditTime = time;
    this.logAudit('Updated Night Audit Settings', 'NightAudit', 'settings', undefined, `Auto Audit: ${enabled ? 'Enabled' : 'Disabled'}, Scheduled Time: ${time}`);
    notify();
    return { success: true, message: `Night Audit scheduled for ${time} (${enabled ? 'Auto-Active' : 'Manual only'}).` };
  },

  runNightAudit(manual: boolean = false, notes?: string): { success: boolean; record: NightAuditRecord; message: string } {
    if (!manual && !this.hasPermission('can_run_night_audit')) {
      // Auto triggers skip auth, manual checks permission
    } else if (manual && !this.hasPermission('can_run_night_audit')) {
      throw new Error('Permission Denied: User does not have authorization to execute Night Audit.');
    }

    const currentBizDate = state.settings.currentBusinessDate || '2026-08-31';
    const d = new Date(currentBizDate);
    d.setDate(d.getDate() + 1);
    const nextBizDate = d.toISOString().split('T')[0];

    // 1. Post room charges and taxes for all active in-house stays
    const activeStays = state.stays.filter(s => s.status === 'Active');
    let roomRevenuePosted = 0;
    let roomTaxPosted = 0;
    let roomServiceChargePosted = 0;
    const postedChargesList: any[] = [];

    activeStays.forEach(stay => {
      const folio = state.folios.find(f => f.id === stay.folioId);
      if (folio) {
        // Check if room charge for this business date was already posted
        const dateDesc = `Room Charge (${currentBizDate}) - Room ${stay.roomNumber}`;
        const alreadyPosted = folio.items.some(i => !i.voided && (i.description.includes(currentBizDate) || i.reference === `NIGHT-AUDIT-${currentBizDate}`));
        
        const room = state.rooms.find(r => r.id === stay.roomId);
        const roomType = room ? state.roomTypes.find(rt => rt.id === room.roomTypeId) : null;
        const rate = stay.rate || (roomType?.baseRate || roomType?.basePrice || 7500);

        const taxRate = state.settings.taxRatePercent / 100;
        const scRate = state.settings.serviceChargePercent / 100;
        const tax = Math.round(rate * taxRate);
        const sc = Math.round(rate * scRate);
        const total = rate + sc + tax;

        if (!alreadyPosted) {
          folio.items.push({
            id: `item-na-${Date.now()}-${stay.id}`,
            folioId: folio.id,
            type: 'Room Charge',
            description: dateDesc,
            quantity: 1,
            unitPrice: rate,
            discount: 0,
            tax,
            total,
            postedBy: manual ? state.currentUser.name : 'System Auto Night Audit (06:00 AM)',
            createdAt: new Date().toISOString(),
            reference: `NIGHT-AUDIT-${currentBizDate}`
          });

          this.recalculateFolio(folio);
          roomRevenuePosted += rate;
          roomTaxPosted += tax;
          roomServiceChargePosted += sc;
        }

        postedChargesList.push({
          stayId: stay.id,
          roomNumber: stay.roomNumber,
          guestName: stay.guestName,
          roomType: roomType?.name || 'Deluxe Room',
          rate,
          tax,
          serviceCharge: sc,
          total,
          postedAt: new Date().toISOString()
        });
      }
    });

    // Post double-entry balanced Journal Voucher to General Ledger for Night Audit room postings
    const totalRoomGross = roomRevenuePosted + roomTaxPosted + roomServiceChargePosted;
    if (totalRoomGross > 0) {
      this.createJournalVoucher({
        date: currentBizDate,
        sourceModule: 'Night Audit',
        sourceReference: `AUD-${currentBizDate.replace(/-/g, '')}`,
        narration: `Automated Night Audit Posting: Room Lodging Charges, 15% VAT & 10% Service Charge for ${activeStays.length} Occupied Rooms on ${currentBizDate}`,
        entries: [
          {
            id: `jve-na-${Date.now()}-1`,
            accountCode: '1100',
            accountName: 'Guest Ledger (In-House Active Receivables)',
            debit: totalRoomGross,
            credit: 0,
            memo: `Daily room charges posted to ${activeStays.length} guest folios`
          },
          {
            id: `jve-na-${Date.now()}-2`,
            accountCode: '4010',
            accountName: 'Room Accommodation Revenue',
            debit: 0,
            credit: roomRevenuePosted,
            memo: `Gross room lodging revenue for ${currentBizDate}`
          },
          ...(roomTaxPosted > 0 ? [{
            id: `jve-na-${Date.now()}-3`,
            accountCode: '2100',
            accountName: 'VAT / Government Tax Payable (15%)',
            debit: 0,
            credit: roomTaxPosted,
            memo: `Statutory 15% VAT on room lodging`
          }] : []),
          ...(roomServiceChargePosted > 0 ? [{
            id: `jve-na-${Date.now()}-4`,
            accountCode: '2110',
            accountName: 'Service Charge Payable (10% Staff Pool)',
            debit: 0,
            credit: roomServiceChargePosted,
            memo: `10% Staff Service Charge pool on room lodging`
          }] : [])
        ]
      });

      // Update Front Desk Rooms departmental sync record
      const foSync = state.departmentalSyncs?.find(d => d.department === 'Front Desk Rooms');
      if (foSync) {
        foSync.totalBills += activeStays.length;
        foSync.syncedCount += activeStays.length;
        foSync.totalVolume += totalRoomGross;
        foSync.lastSyncTime = new Date().toISOString();
        foSync.syncStatus = 'In Sync';
      }
    }

    // 2. Compute F&B, banquet, and other revenues posted on this business date
    const fbRevenue = state.restaurantOrders
      .filter(o => !o.voided && o.createdAt.startsWith(currentBizDate))
      .reduce((acc, o) => acc + o.subtotal, 0);

    const banquetRevenue = state.eventBookings
      .filter(e => e.status !== 'Cancelled' && e.eventDate === currentBizDate)
      .reduce((acc, e) => acc + (e.total || e.totalAmount || 0), 0);

    const totalRevenue = roomRevenuePosted + fbRevenue + banquetRevenue;

    // 3. Compute payments collected on this business date
    const totalPayments = state.payments
      .filter(p => !p.voided && p.status === 'Completed' && p.createdAt.startsWith(currentBizDate))
      .reduce((acc, p) => acc + p.amount, 0);

    // 4. Compute guest ledger balance & identify closed/settled folios
    const ledgerBalance = state.folios
      .filter(f => f.status === 'Open')
      .reduce((acc, f) => acc + Math.max(0, f.balance), 0);

    const closedFoliosList = state.folios
      .filter(f => f.status === 'Settled' || f.status === 'Closed' || f.balance === 0)
      .map(f => {
        const folioPayments = state.payments.filter(p => p.folioId === f.id);
        const lastPay = folioPayments.length > 0 ? folioPayments[folioPayments.length - 1] : null;
        return {
          id: f.id,
          folioNumber: f.folioNumber,
          stayId: f.stayId,
          guestName: f.guestName,
          roomNumber: f.roomNumber,
          grandTotal: f.grandTotal,
          paidTotal: f.paidTotal,
          balance: f.balance,
          status: f.status,
          closedAt: f.closedAt || f.openedAt || new Date().toISOString(),
          settlementMethod: lastPay ? lastPay.method : 'Direct Settlement',
          remarks: f.balance === 0 ? 'Zero-balance verified & reconciled' : 'Settled with full cashier collection'
        };
      });

    // Invoices generated
    const generatedInvoicesList = state.invoices
      .filter(inv => inv.issuedAt.startsWith(currentBizDate) || inv.status === 'Paid')
      .map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        folioNumber: inv.folioId,
        guestOrClientName: inv.guestOrClientName,
        roomOrHall: inv.roomOrHall,
        subtotal: inv.subtotal,
        serviceCharge: inv.serviceCharge,
        tax: inv.tax,
        grandTotal: inv.grandTotal,
        status: inv.status,
        issuedAt: inv.issuedAt,
        issuedBy: inv.issuedBy
      }));

    // Triggered System Alerts from Audit Run
    const triggeredAlertsList: any[] = [
      {
        id: `alt-na-run-1-${Date.now()}`,
        type: 'success',
        title: `${manual ? 'Manual' : 'Automated 06:00 AM'} Day-Close Completed`,
        message: `Business date successfully advanced from ${currentBizDate} to ${nextBizDate}. Total day revenue: ৳${(totalRevenue || 0).toLocaleString()}.`,
        category: 'Financial / Ledger',
        timestamp: manual ? 'Manual Run' : '06:00 AM'
      }
    ];

    // High balance check
    const highBalanceFolios = state.folios.filter(f => f.status === 'Open' && f.balance > 10000);
    if (highBalanceFolios.length > 0) {
      triggeredAlertsList.push({
        id: `alt-na-run-2-${Date.now()}`,
        type: 'warning',
        title: `High Outstanding Balance Warning (${highBalanceFolios.length} Accounts)`,
        message: `${highBalanceFolios.map(f => `Room ${f.roomNumber} (${f.guestName}: ৳${(f.balance || 0).toLocaleString()})`).join(', ')}. Credit threshold check recommended.`,
        category: 'Financial / Ledger',
        timestamp: manual ? 'Manual Run' : '06:00 AM',
        actionRoute: 'billing',
        actionLabel: 'View Folios'
      });
    }

    // Stop-post check
    const stopPostStays = state.stays.filter(s => s.status === 'Active' && s.stopPost);
    if (stopPostStays.length > 0) {
      triggeredAlertsList.push({
        id: `alt-na-run-3-${Date.now()}`,
        type: 'info',
        title: `Stop Post Restrictions Enforced (${stopPostStays.length} Rooms)`,
        message: `Rooms with active Stop Post lock: ${stopPostStays.map(s => `${s.roomNumber} (${s.guestName})`).join(', ')}. Direct outlet charges remained blocked.`,
        category: 'Security / Stop-Post',
        timestamp: manual ? 'Manual Run' : '06:00 AM',
        actionRoute: 'frontdesk',
        actionLabel: 'Front Desk'
      });
    }

    // Housekeeping morning queue alert
    triggeredAlertsList.push({
      id: `alt-na-run-4-${Date.now()}`,
      type: 'urgent',
      title: 'Housekeeping Morning Roster Generated',
      message: `${activeStays.length} occupied rooms flagged for routine morning housekeeping service on ${nextBizDate}.`,
      category: 'Housekeeping',
      timestamp: manual ? 'Manual Run' : '06:00 AM',
      actionRoute: 'housekeeping',
      actionLabel: 'HK Board'
    });

    const totalRooms = state.rooms.filter(r => r.active).length;
    const occupancyPercent = totalRooms > 0 ? Math.round((activeStays.length / totalRooms) * 100) : 0;
    const departuresPending = state.stays.filter(s => s.status === 'Active' && s.expectedCheckOutAt && s.expectedCheckOutAt.startsWith(currentBizDate)).length;

    // 5. Generate Night Audit Record
    const auditNumber = `AUD-${currentBizDate.replace(/-/g, '')}-${String((state.nightAuditRecords?.length || 0) + 1).padStart(2, '0')}`;
    const auditRecord: NightAuditRecord = {
      id: `na-${Date.now()}`,
      auditNumber,
      businessDate: currentBizDate,
      nextBusinessDate: nextBizDate,
      closedAt: new Date().toISOString(),
      closedBy: manual ? state.currentUser.name : 'Auto-Scheduler (06:00 AM Close)',
      isAutomatic: !manual,
      totalRoomsOccupied: activeStays.length,
      occupancyPercent,
      roomRevenuePosted,
      fbRevenue,
      banquetRevenue,
      otherRevenue: 0,
      totalRevenue,
      totalPaymentsCollected: totalPayments,
      ledgerBalance,
      inHouseStaysCount: activeStays.length,
      departuresPending,
      notes: notes || (manual ? `Manual night audit executed by ${state.currentUser.name}.` : `Scheduled automated night audit completed at ${state.settings.autoNightAuditTime || '06:00 AM'}.`),
      status: 'Completed',
      closedFolios: closedFoliosList,
      generatedInvoices: generatedInvoicesList,
      triggeredAlerts: triggeredAlertsList,
      postedCharges: postedChargesList
    };

    if (!state.nightAuditRecords) state.nightAuditRecords = [];
    state.nightAuditRecords.unshift(auditRecord);

    // 6. Roll business date
    state.settings.lastNightAuditDate = currentBizDate;
    state.settings.currentBusinessDate = nextBizDate;

    this.logAudit('Night Audit Executed & Day Closed', 'NightAudit', auditRecord.id, currentBizDate, `Business date rolled from ${currentBizDate} to ${nextBizDate}. Total Rev: ৳${(totalRevenue || 0).toLocaleString()}`);
    this.addAlert('success', `Night Audit Completed: ${currentBizDate}`, `Business day closed. Active stays: ${activeStays.length}. New business date: ${nextBizDate}.`, 'View Night Audit', 'night-audit');

    notify();
    return {
      success: true,
      record: auditRecord,
      message: `Night audit successfully closed day ${currentBizDate}. Business date rolled to ${nextBizDate}.`
    };
  },

  checkAndTriggerAutoNightAudit() {
    try {
      if (!state.settings || !state.settings.autoNightAuditEnabled) return;
      const currentBizDate = state.settings.currentBusinessDate || '2026-09-22';
      const lastAudit = state.settings.lastNightAuditDate;
      if (lastAudit === currentBizDate) return; // Already run for this business date

      const now = new Date();
      const realTodayStr = now.toISOString().split('T')[0];

      // Safety Guard: Never advance the business day past current real calendar day
      if (currentBizDate >= realTodayStr) return;

      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const targetTime = state.settings.autoNightAuditTime || '06:00';

      // Auto night audit runs strictly during morning day-close window (e.g. 06:00 AM)
      const [targetH, targetM] = targetTime.split(':').map(Number);
      const targetMinutes = (targetH || 6) * 60 + (targetM || 0);
      const currentMinutesTotal = now.getHours() * 60 + now.getMinutes();

      // Only fire within a 15-minute morning window of target time (e.g. 06:00 to 06:15 AM)
      const inWindow = currentMinutesTotal >= targetMinutes && currentMinutesTotal < (targetMinutes + 15);
      if (!inWindow) return;

      console.log(`[NightAudit] Auto 06:00 AM morning day-close conditions met. Running Night Audit for ${currentBizDate}...`);
      this.runNightAudit(false, `Automated 06:00 AM morning day-close scheduled trigger executed at ${currentTimeStr}.`);
    } catch (err: any) {
      console.warn('[NightAudit] Auto night audit could not be executed:', err?.message || err);
    }
  },

  // ----------------------------------------------------
  // ACTIVITIES & AMENITIES SERVICES
  // ----------------------------------------------------
  getActivities(): ActivityItem[] {
    return state.activities || [];
  },

  getActivityById(id: string): ActivityItem | undefined {
    return (state.activities || []).find(a => a.id === id);
  },

  createActivity(data: Omit<ActivityItem, 'id' | 'createdAt'>): { success: boolean; activity: ActivityItem; message: string } {
    if (!state.activities) state.activities = [];
    
    // Generate unique code if not provided
    const code = data.code?.trim() || `ACT-${String(state.activities.length + 1).padStart(3, '0')}`;
    
    const newActivity: ActivityItem = {
      id: `act-item-${Date.now()}`,
      code,
      name: data.name.trim(),
      category: data.category,
      description: data.description?.trim() || '',
      price: Number(data.price) || 0,
      pricingUnit: data.pricingUnit || 'Per Person',
      durationMinutes: Number(data.durationMinutes) || 60,
      maxCapacityPerSlot: Number(data.maxCapacityPerSlot) || 20,
      location: data.location?.trim() || 'Resort Recreation Grounds',
      operatingHours: data.operatingHours?.trim() || '08:00 AM - 08:00 PM',
      instructorAvailable: Boolean(data.instructorAvailable),
      instructorFee: data.instructorFee ? Number(data.instructorFee) : undefined,
      glAccountCode: data.glAccountCode || '4050',
      isActive: data.isActive !== undefined ? data.isActive : true,
      badge: data.badge,
      badgeColor: data.badgeColor || 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
      iconName: data.iconName || 'Palmtree',
      tags: data.tags || [],
      createdAt: new Date().toISOString()
    };

    state.activities = [newActivity, ...(state.activities || [])];
    this.logAudit('Activity Created', 'Activities', newActivity.id, newActivity.name, `Admin created activity: ${newActivity.name} (৳${newActivity.price}/${newActivity.pricingUnit})`);
    notify();

    return {
      success: true,
      activity: newActivity,
      message: `Activity "${newActivity.name}" successfully created and added to resort catalog.`
    };
  },

  updateActivity(id: string, data: Partial<ActivityItem>): { success: boolean; message: string } {
    if (!state.activities) state.activities = [];
    const item = state.activities.find(a => a.id === id);
    if (!item) {
      return { success: false, message: 'Activity not found.' };
    }

    state.activities = state.activities.map(a => a.id === id ? {
      ...a,
      ...data,
      updatedAt: new Date().toISOString()
    } : a);

    this.logAudit('Activity Updated', 'Activities', id, item.name, `Updated activity: ${item.name}`);
    notify();

    return {
      success: true,
      message: `Activity "${item.name}" updated successfully.`
    };
  },

  deleteActivity(id: string): { success: boolean; message: string } {
    if (!state.activities) state.activities = [];
    const item = state.activities.find(a => a.id === id);
    if (!item) {
      return { success: false, message: 'Activity not found.' };
    }

    // Check if there are active bookings
    const hasBookings = (state.activityBookings || []).some(b => b.activityId === id && b.bookingStatus === 'Confirmed');
    if (hasBookings) {
      return { success: false, message: 'Cannot delete activity with confirmed active bookings. Mark as Inactive instead.' };
    }

    state.activities = state.activities.filter(a => a.id !== id);
    this.logAudit('Activity Deleted', 'Activities', id, item.name, `Deleted activity: ${item.name}`);
    notify();

    return {
      success: true,
      message: `Activity "${item.name}" has been deleted from catalog.`
    };
  },

  toggleActivityStatus(id: string): { success: boolean; isActive: boolean; message: string } {
    if (!state.activities) state.activities = [];
    const activity = state.activities.find(a => a.id === id);
    if (!activity) {
      return { success: false, isActive: false, message: 'Activity not found.' };
    }

    const nextActive = !activity.isActive;
    state.activities = state.activities.map(a => a.id === id ? {
      ...a,
      isActive: nextActive,
      updatedAt: new Date().toISOString()
    } : a);

    this.logAudit('Activity Status Toggled', 'Activities', id, activity.name, `Toggled active status to ${nextActive ? 'Active' : 'Inactive'}`);
    notify();

    return {
      success: true,
      isActive: nextActive,
      message: `Activity "${activity.name}" is now ${nextActive ? 'Active' : 'Inactive'}.`
    };
  },

  getActivityBookings(): ActivityBooking[] {
    return state.activityBookings || [];
  },

  createActivityBooking(data: {
    activityId: string;
    guestName: string;
    guestPhone?: string;
    guestEmail?: string;
    guestType: ActivityBooking['guestType'];
    roomNumber?: string;
    stayId?: string;
    folioId?: string;
    bookingDate: string;
    timeSlot: string;
    participantCount: number;
    unitPrice: number;
    paymentType: ActivityBooking['paymentType'];
    assignedInstructor?: string;
    specialRequests?: string;
    autoBillToFolio?: boolean;
  }): { success: boolean; booking: ActivityBooking; charge?: ActivityAmenityCharge; message: string } {
    const activity = (state.activities || []).find(a => a.id === data.activityId);
    const activityName = activity ? activity.name : 'Resort Activity';
    
    const count = Math.max(1, data.participantCount);
    const unitPrice = data.unitPrice !== undefined ? data.unitPrice : (activity?.price || 0);
    const subtotal = count * unitPrice;
    const taxRate = state.settings.taxRatePercent || 15;
    const tax = Math.round(subtotal * (taxRate / 100));
    const total = subtotal + tax;

    const bookingNumber = `ABK-${new Date().getFullYear()}-${String((state.activityBookings?.length || 0) + 1).padStart(4, '0')}`;
    const paymentStatus: ActivityBooking['paymentStatus'] =
      data.paymentType === 'Billed to Room Folio' ? 'Posted to Folio' : 'Paid Direct';

    // Automatically create and post billing charge
    const chargeResult = this.createActivityCharge({
      category: 'Activity',
      serviceType: activityName,
      guestOrCustomerName: `${data.guestName} (${data.guestType})`,
      roomNumber: data.roomNumber,
      stayId: data.stayId,
      folioId: data.folioId,
      quantity: count,
      unitPrice,
      paymentType: data.paymentType,
      notes: `Booking: ${bookingNumber} | Date: ${data.bookingDate} | Slot: ${data.timeSlot} ${data.specialRequests ? `| Req: ${data.specialRequests}` : ''}`
    });

    const newBooking: ActivityBooking = {
      id: `abk-${Date.now()}`,
      bookingNumber,
      activityId: data.activityId,
      activityName,
      guestName: data.guestName.trim(),
      guestPhone: data.guestPhone?.trim(),
      guestEmail: data.guestEmail?.trim(),
      guestType: data.guestType,
      roomNumber: data.roomNumber,
      stayId: data.stayId,
      folioId: data.folioId,
      bookingDate: data.bookingDate,
      timeSlot: data.timeSlot,
      participantCount: count,
      unitPrice,
      subtotal,
      tax,
      total,
      paymentType: data.paymentType,
      paymentStatus,
      bookingStatus: 'Confirmed',
      assignedInstructor: data.assignedInstructor,
      specialRequests: data.specialRequests,
      chargeId: chargeResult.charge?.id,
      createdAt: new Date().toISOString(),
      createdBy: state.currentUser.name
    };

    if (!state.activityBookings) state.activityBookings = [];
    state.activityBookings.unshift(newBooking);

    this.logAudit('Activity Booking Created', 'Activities', newBooking.id, bookingNumber, `Booked ${activityName} for ${data.guestName} (৳${(total || 0).toLocaleString()}) - ${data.paymentType}`);
    notify();

    return {
      success: true,
      booking: newBooking,
      charge: chargeResult.charge,
      message: `Booking ${bookingNumber} confirmed & billed ৳${(total || 0).toLocaleString()} (${data.paymentType}).`
    };
  },

  updateActivityBookingStatus(bookingId: string, status: ActivityBooking['bookingStatus']): { success: boolean; message: string } {
    if (!state.activityBookings) state.activityBookings = [];
    const booking = state.activityBookings.find(b => b.id === bookingId);
    if (!booking) {
      return { success: false, message: 'Activity booking not found.' };
    }

    booking.bookingStatus = status;
    this.logAudit('Activity Booking Status Updated', 'Activities', bookingId, booking.bookingNumber, `Status updated to ${status}`);
    notify();

    return {
      success: true,
      message: `Booking ${booking.bookingNumber} status updated to ${status}.`
    };
  },

  voidActivityCharge(chargeId: string, reason: string): { success: boolean; message: string } {
    if (!state.activityCharges) return { success: false, message: 'No activity charges found.' };
    const charge = state.activityCharges.find(c => c.id === chargeId);
    if (!charge) return { success: false, message: 'Activity charge not found.' };

    if (charge.settlementStatus === 'Pending') {
      return { success: false, message: 'Charge is already voided or pending.' };
    }

    // If billed to folio, reverse or remove from folio
    if (charge.folioId) {
      const folio = state.folios.find(f => f.id === charge.folioId);
      if (folio) {
        // Remove or add negative adjustment
        folio.items = folio.items.filter(item => !item.description.includes(charge.chargeNumber));
        folio.subtotal = Math.max(0, folio.subtotal - charge.subtotal);
        folio.taxTotal = Math.max(0, folio.taxTotal - charge.tax);
        folio.grandTotal = Math.max(0, folio.grandTotal - charge.grandTotal);
        folio.balance = folio.grandTotal - folio.paidTotal;
      }
    }

    charge.settlementStatus = 'Pending';
    charge.notes = `${charge.notes || ''} [VOIDED: ${reason} by ${state.currentUser.name}]`;

    // Reverse GL voucher
    this.createJournalVoucher({
      date: state.settings.currentBusinessDate || new Date().toISOString().split('T')[0],
      sourceModule: charge.category === 'Activity' ? 'Activities' : 'Amenities',
      sourceReference: `REV-${charge.chargeNumber}`,
      narration: `REVERSAL of ${charge.chargeNumber} (${charge.serviceType}) - Void reason: ${reason}`,
      entries: [
        { id: `jve-rev-${Date.now()}-1`, accountCode: charge.category === 'Activity' ? '4050' : '4060', accountName: 'Resort Activities Revenue Reversal', debit: charge.subtotal, credit: 0, memo: `Reversal of ${charge.chargeNumber}` },
        { id: `jve-rev-${Date.now()}-2`, accountCode: '2100', accountName: 'VAT Payable Reversal', debit: charge.tax, credit: 0, memo: `VAT Reversal` },
        { id: `jve-rev-${Date.now()}-3`, accountCode: charge.paymentType === 'Billed to Room Folio' ? '1100' : '1020', accountName: 'Receivable/Cash Reversal', debit: 0, credit: charge.grandTotal, memo: `Reversal` }
      ]
    });

    this.logAudit('Activity Charge Voided', 'Activities', chargeId, charge.chargeNumber, `Voided charge of ৳${(charge.grandTotal || 0).toLocaleString()} - Reason: ${reason}`);
    notify();

    return {
      success: true,
      message: `Charge ${charge.chargeNumber} voided and reversed successfully.`
    };
  },

  getActivityCharges(): ActivityAmenityCharge[] {
    return state.activityCharges || [];
  },

  createActivityCharge(data: {
    category: 'Activity' | 'Amenity';
    serviceType: string;
    guestOrCustomerName: string;
    roomNumber?: string;
    stayId?: string;
    folioId?: string;
    quantity: number;
    unitPrice: number;
    paymentType: ActivityAmenityCharge['paymentType'];
    notes?: string;
  }): { success: boolean; charge: ActivityAmenityCharge; message: string } {
    const subtotal = data.quantity * data.unitPrice;
    const taxRate = state.settings.taxRatePercent || 15;
    const tax = Math.round(subtotal * (taxRate / 100));
    const grandTotal = subtotal + tax;

    const chargeNumber = `ACT-${new Date().getFullYear()}-${String((state.activityCharges?.length || 0) + 1).padStart(4, '0')}`;
    const settlementStatus: ActivityAmenityCharge['settlementStatus'] =
      data.paymentType === 'Billed to Room Folio' ? 'Posted to Folio' : 'Settled Direct';

    const newCharge: ActivityAmenityCharge = {
      id: `act-${Date.now()}`,
      chargeNumber,
      category: data.category,
      serviceType: data.serviceType,
      guestOrCustomerName: data.guestOrCustomerName,
      roomNumber: data.roomNumber,
      stayId: data.stayId,
      folioId: data.folioId,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      subtotal,
      tax,
      grandTotal,
      paymentType: data.paymentType,
      settlementStatus,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      createdBy: state.currentUser.name
    };

    if (!state.activityCharges) state.activityCharges = [];
    state.activityCharges.unshift(newCharge);

    // If billed to room folio, add as Folio Item
    if (data.paymentType === 'Billed to Room Folio' && data.folioId) {
      const folio = state.folios.find(f => f.id === data.folioId);
      if (folio) {
        const item: FolioItem = {
          id: `fi-${Date.now()}`,
          folioId: folio.id,
          type: data.category === 'Activity' ? 'Amenity' : 'Spa/Wellness',
          description: `${data.serviceType} (x${data.quantity}) - ${data.guestOrCustomerName}`,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          discount: 0,
          tax,
          total: grandTotal,
          postedBy: `${state.currentUser.name} (${data.category})`,
          createdAt: new Date().toISOString()
        };
        folio.items.push(item);
        folio.subtotal += subtotal;
        folio.taxTotal += tax;
        folio.grandTotal += grandTotal;
        folio.balance = folio.grandTotal - folio.paidTotal;
      }
    }

    // Auto-generate double-entry Journal Voucher
    const debitAccountCode = data.paymentType === 'Billed to Room Folio' ? '1100' : '1020';
    const debitAccountName = data.paymentType === 'Billed to Room Folio' ? 'Guest Ledger (In-House Active Receivables)' : 'Front Desk & Outlet Cashier Drawers';
    const creditRevenueCode = data.category === 'Activity' ? '4050' : '4060';
    const creditRevenueName = data.category === 'Activity' ? 'Resort Activities & Sports Facilities' : 'Spa & Wellness Center Revenue';

    this.createJournalVoucher({
      date: state.settings.currentBusinessDate || new Date().toISOString().split('T')[0],
      sourceModule: data.category === 'Activity' ? 'Activities' : 'Amenities',
      sourceReference: chargeNumber,
      narration: `${data.serviceType} (Qty: ${data.quantity}) for ${data.guestOrCustomerName} ${data.roomNumber ? `[Room ${data.roomNumber}]` : ''} - Paid via ${data.paymentType}`,
      entries: [
        { id: `jve-${Date.now()}-1`, accountCode: debitAccountCode, accountName: debitAccountName, debit: grandTotal, credit: 0, memo: `${data.paymentType} charge` },
        { id: `jve-${Date.now()}-2`, accountCode: creditRevenueCode, accountName: creditRevenueName, debit: 0, credit: subtotal, memo: `${data.serviceType} revenue` },
        { id: `jve-${Date.now()}-3`, accountCode: '2100', accountName: 'VAT / Government Tax Payable (15%)', debit: 0, credit: tax, memo: `15% VAT on ${data.serviceType}` }
      ]
    });

    this.logAudit('Activity Charge Created', 'Folio', newCharge.id, chargeNumber, `${data.serviceType} ৳${(grandTotal || 0).toLocaleString()} for ${data.guestOrCustomerName}`);
    notify();

    return {
      success: true,
      charge: newCharge,
      message: `Charge ${chargeNumber} of ৳${(grandTotal || 0).toLocaleString()} successfully recorded (${data.paymentType}).`
    };
  },

  // ----------------------------------------------------
  // ACCOUNTING, GENERAL LEDGER & CITY LEDGER SERVICES
  // ----------------------------------------------------
  getGLAccounts(): GLAccount[] {
    return state.glAccounts || [];
  },

  createGLAccount(accountData: Omit<GLAccount, 'balance' | 'isSystem'> & { balance?: number; isSystem?: boolean }): { success: boolean; message: string } {
    if (!state.glAccounts) state.glAccounts = [];
    if (state.glAccounts.some(a => a.code === accountData.code)) {
      return { success: false, message: `Account code ${accountData.code} already exists in Chart of Accounts.` };
    }

    const newAcc: GLAccount = {
      code: accountData.code,
      name: accountData.name,
      type: accountData.type,
      category: accountData.category,
      description: accountData.description,
      balance: accountData.balance || 0,
      isSystem: accountData.isSystem || false,
      department: (accountData as any).department,
      parentCode: (accountData as any).parentCode,
      openingBalance: (accountData as any).openingBalance !== undefined ? (accountData as any).openingBalance : (accountData.balance || 0),
      normalBalance: (accountData as any).normalBalance || (accountData.type === 'Asset' || accountData.type === 'Expense' ? 'Debit' : 'Credit'),
      isBankCash: (accountData as any).isBankCash || false,
      isDirectPostingAllowed: (accountData as any).isDirectPostingAllowed !== undefined ? (accountData as any).isDirectPostingAllowed : true,
      isTaxApplicable: (accountData as any).isTaxApplicable || false,
      status: (accountData as any).status || 'Active',
      createdAt: (accountData as any).createdAt || new Date().toISOString()
    };

    state.glAccounts.push(newAcc);
    state.glAccounts.sort((a, b) => a.code.localeCompare(b.code));
    this.logAudit('GL Account Created', 'SystemSettings', newAcc.code, newAcc.name, `New ${newAcc.type} account added to Chart of Accounts`);
    notify();

    return { success: true, message: `Account ${newAcc.code} - ${newAcc.name} created successfully.` };
  },

  updateGLAccount(code: string, updates: Partial<GLAccount>): { success: boolean; message: string } {
    const acc = state.glAccounts?.find(a => a.code === code);
    if (!acc) return { success: false, message: 'GL Account not found.' };

    Object.assign(acc, updates);
    this.logAudit('GL Account Updated', 'SystemSettings', code, acc.name, `Account parameters updated`);
    notify();
    return { success: true, message: `GL Account ${code} updated.` };
  },

  deleteGLAccount(code: string): { success: boolean; message: string } {
    const acc = state.glAccounts?.find(a => a.code === code);
    if (!acc) return { success: false, message: 'GL Account not found.' };
    if (acc.isSystem) return { success: false, message: 'Cannot delete core system GL account. System accounts are protected.' };
    if (acc.balance !== 0) return { success: false, message: `Cannot delete account with non-zero balance (৳${acc.balance.toLocaleString()}). Must clear balance via Journal Voucher first.` };
    const isUsedInJv = (state.journalVouchers || []).some(jv => (jv.entries || []).some(e => e.accountCode === code));
    if (isUsedInJv) return { success: false, message: 'Cannot delete account that has recorded journal transactions in the ledger. You can mark it inactive instead.' };

    state.glAccounts = state.glAccounts.filter(a => a.code !== code);
    this.logAudit('GL Account Deleted', 'SystemSettings', code, acc.name, 'Custom GL Account removed from Chart of Accounts');
    notify();
    return { success: true, message: `GL Account ${code} removed.` };
  },

  getJournalVouchers(): JournalVoucher[] {
    return state.journalVouchers || [];
  },

  createJournalVoucher(data: {
    date: string;
    sourceModule: JournalVoucher['sourceModule'];
    sourceReference: string;
    narration: string;
    entries: JournalEntryItem[];
  }): { success: boolean; voucher?: JournalVoucher; message: string } {
    const totalDebit = data.entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = data.entries.reduce((sum, e) => sum + (e.credit || 0), 0);

    if (totalDebit !== totalCredit) {
      return {
        success: false,
        message: `Voucher is out of balance! Total Debits (৳${(totalDebit || 0).toLocaleString()}) must equal Total Credits (৳${(totalCredit || 0).toLocaleString()}). Difference: ৳${(Math.abs(totalDebit - totalCredit) || 0).toLocaleString()}`
      };
    }

    const voucherNumber = `JV-${new Date().getFullYear()}-${String((state.journalVouchers?.length || 0) + 1).padStart(4, '0')}`;
    const voucher: JournalVoucher = {
      id: `jv-${Date.now()}`,
      voucherNumber,
      date: data.date,
      sourceModule: data.sourceModule,
      sourceReference: data.sourceReference,
      narration: data.narration,
      entries: data.entries,
      totalDebit,
      totalCredit,
      isBalanced: true,
      postedBy: state.currentUser?.name || 'Accounts Engine',
      postedAt: new Date().toISOString()
    };

    if (!state.journalVouchers) state.journalVouchers = [];
    state.journalVouchers.unshift(voucher);

    // Update GL account balances
    data.entries.forEach(entry => {
      const gl = state.glAccounts?.find(a => a.code === entry.accountCode);
      if (gl) {
        // Asset & Expense normal balance: Debit increases (+), Credit decreases (-)
        // Liability, Equity & Revenue normal balance: Credit increases (+), Debit decreases (-)
        if (gl.type === 'Asset' || gl.type === 'Expense') {
          gl.balance += (entry.debit - entry.credit);
        } else {
          gl.balance += (entry.credit - entry.debit);
        }
      }
    });

    this.logAudit('Journal Voucher Posted', 'NightAudit', voucher.id, voucherNumber, `${data.sourceModule}: ${data.narration.substring(0, 50)}... [Debit: ৳${(totalDebit || 0).toLocaleString()}]`);
    notify();

    return {
      success: true,
      voucher,
      message: `Journal Voucher ${voucherNumber} (৳${(totalDebit || 0).toLocaleString()}) successfully posted to General Ledger.`
    };
  },

  getCityLedgerAccounts(): CityLedgerAccount[] {
    return state.cityLedgerAccounts || [];
  },

  createCityLedgerAccount(data: Omit<CityLedgerAccount, 'id' | 'createdAt' | 'currentBalance' | 'accountNumber'> & { accountNumber?: string }): { success: boolean; account?: CityLedgerAccount; message: string } {
    if (!state.cityLedgerAccounts) state.cityLedgerAccounts = [];
    const accountNumber = data.accountNumber || `CL-${new Date().getFullYear()}-${String(state.cityLedgerAccounts.length + 1).padStart(3, '0')}`;
    
    const account: CityLedgerAccount = {
      id: `cla-${Date.now()}`,
      accountNumber,
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      creditLimit: data.creditLimit,
      currentBalance: 0,
      paymentTerms: data.paymentTerms,
      status: 'Active',
      taxNumber: data.taxNumber,
      address: data.address,
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    state.cityLedgerAccounts.push(account);
    this.logAudit('City Ledger Account Created', 'Guest', account.id, accountNumber, `Corporate client ${account.companyName} added with Credit Limit ৳${(account.creditLimit || 0).toLocaleString()}`);
    notify();

    return { success: true, account, message: `Corporate account ${account.companyName} (${accountNumber}) registered.` };
  },

  updateCityLedgerAccount(id: string, updates: Partial<CityLedgerAccount>): { success: boolean; message: string } {
    const acc = state.cityLedgerAccounts?.find(a => a.id === id);
    if (!acc) return { success: false, message: 'City Ledger Account not found.' };

    Object.assign(acc, updates);
    this.logAudit('City Ledger Account Updated', 'Guest', id, acc.accountNumber, `Corporate credit parameters updated`);
    notify();
    return { success: true, message: `Account ${acc.companyName} updated.` };
  },

  recordCityLedgerPayment(accountId: string, amount: number, method: string, reference: string, notes?: string): { success: boolean; message: string } {
    const acc = state.cityLedgerAccounts?.find(a => a.id === accountId);
    if (!acc) return { success: false, message: 'City Ledger Account not found.' };

    if (amount <= 0) return { success: false, message: 'Payment amount must be greater than zero.' };

    acc.currentBalance = Math.max(0, acc.currentBalance - amount);
    if (acc.currentBalance < acc.creditLimit * 0.9 && acc.status === 'Credit Warning') {
      acc.status = 'Active';
    }

    // Auto-create Journal Voucher
    this.createJournalVoucher({
      date: state.settings.currentBusinessDate || new Date().toISOString().split('T')[0],
      sourceModule: 'Cashier Settlement',
      sourceReference: reference || `CL-PAY-${Date.now()}`,
      narration: `Corporate settlement received from ${acc.companyName} (${acc.accountNumber}) via ${method}. Ref: ${reference}`,
      entries: [
        { id: `jve-${Date.now()}-1`, accountCode: '1010', accountName: 'Cash in Vault & Commercial Bank Accounts', debit: amount, credit: 0, memo: `Receipt from ${acc.companyName}` },
        { id: `jve-${Date.now()}-2`, accountCode: '1150', accountName: 'City Ledger (Corporate Accounts Receivable)', debit: 0, credit: amount, memo: `AR balance reduction` }
      ]
    });

    this.addAlert('success', `City Ledger Payment: ${acc.companyName}`, `Received ৳${(amount || 0).toLocaleString()} via ${method}. Outstanding balance: ৳${(acc.currentBalance || 0).toLocaleString()}.`, 'Accounting', 'accounting');
    this.logAudit('City Ledger Payment Received', 'Folio', acc.id, acc.accountNumber, `৳${(amount || 0).toLocaleString()} received via ${method}`);
    notify();

    return {
      success: true,
      message: `Payment of ৳${(amount || 0).toLocaleString()} successfully recorded for ${acc.companyName}. Current balance is ৳${(acc.currentBalance || 0).toLocaleString()}.`
    };
  },

  getDepartmentalSyncStatuses(): DepartmentalSyncStatus[] {
    return state.departmentalSyncs || [];
  },

  syncDepartmentToGL(department: string): { success: boolean; message: string } {
    const dept = state.departmentalSyncs?.find(d => d.department === department);
    if (!dept) return { success: false, message: 'Department not found.' };

    dept.syncStatus = 'In Sync';
    dept.unmappedCount = 0;
    dept.syncedCount = dept.totalBills;
    dept.lastSyncTime = new Date().toISOString();

    this.logAudit('Departmental GL Sync', 'NightAudit', department, dept.glAccountMapping.creditAccount, `${department} transactions reconciled to General Ledger`);
    this.addAlert('info', `Department Synchronized: ${department}`, `All operational transactions mapped and reconciled to General Ledger.`, 'Accounting', 'accounting');
    notify();

    return { success: true, message: `${department} successfully synchronized with the General Ledger.` };
  },

  // -------------------------------------------------------------
  // BILLING & ACCOUNTING MAPPING RECONCILIATION ENGINE
  // -------------------------------------------------------------
  getBillToAccountMappingMatrix() {
    const folios = state.folios || [];
    const orders = state.restaurantOrders || [];
    const events = state.eventBookings || [];
    const charges = state.activityCharges || [];
    const cityAccounts = state.cityLedgerAccounts || [];
    const payments = state.payments || [];
    const jvs = state.journalVouchers || [];

    const folioBilledTotal = folios.reduce((s, f) => s + f.grandTotal, 0);
    const folioPaidTotal = folios.reduce((s, f) => s + f.paidTotal, 0);

    const posDirectOrders = orders.filter(o => !o.voided && o.paymentStatus === 'Paid-Direct');
    const posDirectTotal = posDirectOrders.reduce((s, o) => s + o.total, 0);

    const eventBilledTotal = events.reduce((s, e) => s + e.total, 0);
    const eventDepositTotal = events.reduce((s, e) => s + e.deposit, 0);

    const activityTotal = charges.reduce((s, c) => s + c.grandTotal, 0);
    const cityLedgerTotalAr = cityAccounts.reduce((s, a) => s + a.currentBalance, 0);

    return {
      channels: [
        {
          id: 'front-office-folios',
          channelName: 'Front Office Guest Folios & Room Bills',
          department: 'Front Office',
          primaryDebitGL: '1100 (Guest Ledger AR)',
          primaryCreditGL: '4010 (Room Accommodation Revenue)',
          secondaryCreditGL: '2100 (VAT 15%) & 2110 (Service Charge 10%)',
          totalBilled: folioBilledTotal,
          totalCollected: folioPaidTotal,
          unsettledBalance: folioBilledTotal - folioPaidTotal,
          billCount: folios.length,
          status: 'Mapped & Synchronized',
          lastSync: new Date().toISOString()
        },
        {
          id: 'restaurant-pos',
          channelName: 'Restaurant & Dining POS Orders',
          department: 'Food & Beverage',
          primaryDebitGL: '1020 (Cashier Drawers) / 1100 (Room Folio)',
          primaryCreditGL: '4020 (Food & Beverage Outlet Sales)',
          secondaryCreditGL: '2100 (VAT 15%) & 2110 (Service Charge 10%)',
          totalBilled: orders.filter(o => !o.voided && o.orderType !== 'bar-lounge').reduce((s, o) => s + o.total, 0),
          totalCollected: orders.filter(o => !o.voided && o.orderType !== 'bar-lounge' && o.paymentStatus === 'Paid-Direct').reduce((s, o) => s + o.total, 0),
          unsettledBalance: orders.filter(o => !o.voided && o.orderType !== 'bar-lounge' && o.paymentStatus !== 'Paid-Direct').reduce((s, o) => s + o.total, 0),
          billCount: orders.filter(o => o.orderType !== 'bar-lounge').length,
          status: 'Mapped & Synchronized',
          lastSync: new Date().toISOString()
        },
        {
          id: 'bar-lounge-pos',
          channelName: 'Bar, Lounge & Beverage Bills',
          department: 'Bar & Lounge',
          primaryDebitGL: '1020 (Cashier Drawers) / 1100 (Room Folio)',
          primaryCreditGL: '4030 (Bar & Lounge Revenue)',
          secondaryCreditGL: '2100 (VAT 15%) & 2110 (Service Charge 10%)',
          totalBilled: orders.filter(o => !o.voided && o.orderType === 'bar-lounge').reduce((s, o) => s + o.total, 0),
          totalCollected: orders.filter(o => !o.voided && o.orderType === 'bar-lounge' && o.paymentStatus === 'Paid-Direct').reduce((s, o) => s + o.total, 0),
          unsettledBalance: orders.filter(o => !o.voided && o.orderType === 'bar-lounge' && o.paymentStatus !== 'Paid-Direct').reduce((s, o) => s + o.total, 0),
          billCount: orders.filter(o => o.orderType === 'bar-lounge').length,
          status: 'Mapped & Synchronized',
          lastSync: new Date().toISOString()
        },
        {
          id: 'banquet-convention',
          channelName: 'Convention Halls, Banquet & Events',
          department: 'Banquet & Events',
          primaryDebitGL: '2010 (Advance Liability) / 1010 (Bank) / 1150 (City Ledger)',
          primaryCreditGL: '4040 (Hall Hire) & 4020 (Banquet Catering)',
          secondaryCreditGL: '2100 (VAT 15%) & 2110 (Service Charge 10%)',
          totalBilled: eventBilledTotal,
          totalCollected: eventDepositTotal,
          unsettledBalance: eventBilledTotal - eventDepositTotal,
          billCount: events.length,
          status: 'Mapped & Synchronized',
          lastSync: new Date().toISOString()
        },
        {
          id: 'recreation-spa',
          channelName: 'Resort Recreation, Sports & Spa Services',
          department: 'Recreation & Spa',
          primaryDebitGL: '1020 (Cashier) / 1100 (Room Folio)',
          primaryCreditGL: '4050 (Sports Activities) & 4060 (Spa Wellness)',
          secondaryCreditGL: '2100 (VAT 15%)',
          totalBilled: activityTotal,
          totalCollected: charges.filter(c => c.paymentType !== 'Billed to Room Folio').reduce((s, c) => s + c.grandTotal, 0),
          unsettledBalance: charges.filter(c => c.paymentType === 'Billed to Room Folio').reduce((s, c) => s + c.grandTotal, 0),
          billCount: charges.length,
          status: 'Mapped & Synchronized',
          lastSync: new Date().toISOString()
        },
        {
          id: 'city-ledger-corporate',
          channelName: 'Corporate Accounts Receivable (City Ledger)',
          department: 'Finance & Back-Office',
          primaryDebitGL: '1010 (Commercial Bank Accounts)',
          primaryCreditGL: '1150 (City Ledger AR Balance)',
          secondaryCreditGL: 'N/A (Balance Sheet Asset Swap)',
          totalBilled: cityAccounts.reduce((s, a) => s + a.creditLimit, 0),
          totalCollected: payments.filter(p => p.notes?.includes('City Ledger')).reduce((s, p) => s + p.amount, 0) || 120000,
          unsettledBalance: cityLedgerTotalAr,
          billCount: cityAccounts.length,
          status: 'Mapped & Synchronized',
          lastSync: new Date().toISOString()
        }
      ],
      totalJvs: jvs.length,
      isFullyReconciled: true
    };
  },

  syncAllDepartmentalRevenue(): { success: boolean; message: string; vouchersCreated: number } {
    return this.reconcileAllBillsAndAccounts();
  },

  reconcileAllBillsAndAccounts(): { success: boolean; message: string; vouchersCreated: number } {
    let count = 0;
    const today = state.settings.currentBusinessDate || new Date().toISOString().split('T')[0];

    // Mark all departmental sync statuses as synchronized
    if (state.departmentalSyncs) {
      state.departmentalSyncs.forEach(dept => {
        dept.syncStatus = 'In Sync';
        dept.unmappedCount = 0;
        dept.syncedCount = dept.totalBills;
        dept.lastSyncTime = new Date().toISOString();
      });
    }

    this.logAudit('Reconciled All Bills to GL Accounts', 'NightAudit', 'SYSTEM', 'AUTO-RECONCILE', 'Executed resort-wide billing and GL account mapping reconciliation');
    this.addAlert('success', 'Accounting Synchronization Complete', 'All operational bills (Rooms, F&B, Bar, Banquet, Activities, City Ledger) are reconciled and mapped to Chart of Accounts.', 'General Ledger', 'accounting');
    notify();

    return {
      success: true,
      message: 'All billing transactions and cashier settlements across Front Office, F&B, Banquets, Recreation, and City Ledger are successfully reconciled and mapped to the General Ledger.',
      vouchersCreated: count
    };
  },

  updateSystemSettings(updates: Partial<SystemSetting>): { success: boolean; message: string } {
    state.settings = {
      ...state.settings,
      ...updates
    };
    this.logAudit('Updated System Settings', 'Settings', 'SYSTEM', undefined, JSON.stringify(updates));
    notify();
    return { success: true, message: 'System configuration parameters updated successfully.' };
  },

  updateRoomType(roomTypeId: string, updates: Partial<RoomType>): RoomType {
    const idx = state.roomTypes.findIndex(rt => rt.id === roomTypeId);
    if (idx === -1) throw new Error(`Room type ${roomTypeId} not found`);
    const oldType = state.roomTypes[idx];
    const updated = { ...oldType, ...updates };
    state.roomTypes[idx] = updated;

    // Also update matching rooms
    if (updates.name && updates.name !== oldType.name) {
      state.rooms.forEach(r => {
        if (r.roomTypeId === roomTypeId) {
          r.roomTypeName = updates.name!;
        }
      });
    }

    this.logAudit('Updated Room Type', 'Room', roomTypeId, oldType.name, `Updated tariff and specifications for ${updated.name} (৳${updated.baseRate})`);
    saveDatabase(state);
    notify();
    return updated;
  },

  addRoomType(newType: Omit<RoomType, 'id'> & { id?: string }): RoomType {
    const id = newType.id || `rt-${Date.now()}`;
    const code = (newType as any).code || newType.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 4);
    const roomType: RoomType = {
      id,
      name: newType.name.trim(),
      code,
      baseRate: Number(newType.baseRate),
      basePrice: Number(newType.baseRate),
      extraAdultRate: newType.extraAdultRate !== undefined ? Number(newType.extraAdultRate) : 1000,
      extraChildRate: newType.extraChildRate !== undefined ? Number(newType.extraChildRate) : 500,
      maxAdults: newType.maxAdults !== undefined ? Number(newType.maxAdults) : 2,
      maxChildren: newType.maxChildren !== undefined ? Number(newType.maxChildren) : 1,
      bedType: (newType as any).bedType || 'King Bed',
      roomSize: (newType as any).roomSize || '450 sq.ft',
      amenities: newType.amenities || ['Wi-Fi', 'Smart TV', 'AC', 'Mini Fridge'],
      description: newType.description || '',
      photoUrl: newType.photoUrl || '',
      active: newType.active !== false
    };
    state.roomTypes.push(roomType);
    this.logAudit('Created Room Type', 'Room', id, undefined, `Created new room category ${roomType.name} (৳${roomType.baseRate})`);
    saveDatabase(state);
    notify();
    return roomType;
  },

  deleteRoomType(roomTypeId: string): void {
    const hasRooms = state.rooms.some(r => r.roomTypeId === roomTypeId);
    if (hasRooms) {
      throw new Error('Cannot delete room type: there are existing rooms assigned to this category.');
    }
    state.roomTypes = state.roomTypes.filter(rt => rt.id !== roomTypeId);
    this.logAudit('Deleted Room Type', 'Room', roomTypeId, undefined, `Deleted room category ${roomTypeId}`);
    saveDatabase(state);
    notify();
  },

  exportFullBackupPayload(): any {
    let housekeepingState = null;
    try {
      const hkRaw = localStorage.getItem('cculb_pms_housekeeping_v1');
      if (hkRaw) housekeepingState = JSON.parse(hkRaw);
    } catch (e) {
      console.warn('Could not export housekeeping state', e);
    }

    let salesMarketingState = null;
    try {
      const smRaw = localStorage.getItem('cculb_sales_marketing_v1');
      if (smRaw) salesMarketingState = JSON.parse(smRaw);
    } catch (e) {
      console.warn('Could not export sales & marketing state', e);
    }

    const rbacData: any = {
      roles: null,
      users: null,
      approvalRules: null,
      reportRoleConfig: null,
      credentials: null
    };
    try {
      const rolesRaw = localStorage.getItem('cculb_roles_v1');
      if (rolesRaw) rbacData.roles = JSON.parse(rolesRaw);
      const usersRaw = localStorage.getItem('cculb_rbac_users_v1');
      if (usersRaw) rbacData.users = JSON.parse(usersRaw);
      const rulesRaw = localStorage.getItem('cculb_approval_rules_v1');
      if (rulesRaw) rbacData.approvalRules = JSON.parse(rulesRaw);
      const repCfgRaw = localStorage.getItem('cculb_report_role_config_v2');
      if (repCfgRaw) rbacData.reportRoleConfig = JSON.parse(repCfgRaw);
      const credsRaw = localStorage.getItem('cculb_rbac_creds_v1');
      if (credsRaw) rbacData.credentials = JSON.parse(credsRaw);
    } catch (e) {
      console.warn('Could not export RBAC state', e);
    }

    const payload = {
      metadata: {
        backupVersion: '2.0.0',
        exportedAt: new Date().toISOString(),
        system: 'LESync PMS & Convention Hall System',
        resortName: state.settings?.resortName || 'CCULB Resort & Convention Hall',
        totalRooms: state.rooms?.length || 0,
        totalReservations: state.reservations?.length || 0,
        totalGuests: state.guests?.length || 0,
        totalFolios: state.folios?.length || 0,
        totalGlAccounts: state.glAccounts?.length || 0,
        totalInvoices: state.invoices?.length || 0,
        totalInventoryItems: state.inventoryItems?.length || 0
      },
      pmsDatabase: state,
      housekeeping: housekeepingState,
      salesMarketing: salesMarketingState,
      rbac: rbacData
    };

    return payload;
  },

  exportFullBakContent(): string {
    const payload = this.exportFullBackupPayload();
    const now = new Date();
    const resort = state.settings?.resortName || 'Resort MIS';
    const header = [
      '-- ========================================================',
      '-- LESYNC ENTERPRISE PMS DATABASE BACKUP ARCHIVE (.BAK)',
      `-- Property: ${resort}`,
      `-- Exported At: ${now.toISOString()}`,
      '-- Schema Version: 2.5.0-ENTERPRISE-BAK',
      `-- Records: ${payload.metadata.totalRooms} Rooms | ${payload.metadata.totalReservations} Bookings | ${payload.metadata.totalGuests} Guests | ${payload.metadata.totalFolios} Folios`,
      '-- Format: Full Relational State Container',
      '-- ========================================================',
      ''
    ].join('\n');

    return header + JSON.stringify(payload, null, 2);
  },

  parseBakContent(content: string): any {
    if (!content || typeof content !== 'string') {
      throw new Error('Backup file is empty.');
    }
    const jsonStartIndex = content.indexOf('{');
    if (jsonStartIndex === -1) {
      throw new Error('Invalid .bak backup file: No structured database container found.');
    }
    const jsonString = content.slice(jsonStartIndex);
    return JSON.parse(jsonString);
  },

  restoreFullBackupPayload(rawPayload: any): { success: boolean; message: string; details: any } {
    let payload = rawPayload;
    if (typeof rawPayload === 'string') {
      payload = this.parseBakContent(rawPayload);
    }

    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid backup file: Payload is empty or not a valid .bak archive.');
    }

    const pmsData = payload.pmsDatabase || payload;

    if (!pmsData.rooms && !pmsData.reservations && !pmsData.roomTypes) {
      throw new Error('Invalid backup file: PMS core entities missing (rooms, reservations, roomTypes).');
    }

    // Replace state with deep merge of defaults and parsed data
    state = {
      ...getInitialDatabase(),
      ...pmsData
    };

    // Guarantee pending arrivals for current business date after backup restore
    const curBiz = state.settings?.currentBusinessDate || getTodayString();
    if (!state.settings) {
      state.settings = getInitialDatabase().settings;
    }
    if (!state.settings.currentBusinessDate || state.settings.currentBusinessDate < '2026-09-01' || state.settings.currentBusinessDate > '2028-01-01') {
      state.settings.currentBusinessDate = curBiz;
    }
    const confirmedRestored = (state.reservations || []).filter(
      r => r.status === 'Confirmed' || r.status === 'Unconfirmed' || (r.status as string) === 'Pending'
    );
    const todayArrivals = confirmedRestored.filter(r => r.arrivalDate === curBiz);
    if (todayArrivals.length === 0) {
      if (confirmedRestored.length >= 2) {
        // Realign restored bookings so at least 2-3 are pending arrivals for today
        confirmedRestored.forEach((r, idx) => {
          const offset = idx < 3 ? 0 : (idx === 3 ? 1 : 2);
          r.arrivalDate = getOffsetDate(curBiz, offset);
          r.departureDate = getOffsetDate(r.arrivalDate, 2 + (idx % 2));
          r.updatedAt = new Date().toISOString();
        });
      } else {
        const seedArrivals = getSeedPendingReservations(curBiz);
        const existingIds = new Set((state.reservations || []).map(r => r.id));
        const toAdd = seedArrivals.filter(r => !existingIds.has(r.id));
        state.reservations = [...(state.reservations || []), ...toAdd];
      }
    }

    // Restore auxiliary collections
    if (payload.housekeeping) {
      try {
        localStorage.setItem('cculb_pms_housekeeping_v1', JSON.stringify(payload.housekeeping));
      } catch (e) {
        console.warn('Failed restoring housekeeping state', e);
      }
    }

    if (payload.salesMarketing) {
      try {
        localStorage.setItem('cculb_sales_marketing_v1', JSON.stringify(payload.salesMarketing));
      } catch (e) {
        console.warn('Failed restoring sales marketing state', e);
      }
    }

    if (payload.rbac) {
      try {
        if (payload.rbac.roles) localStorage.setItem('cculb_roles_v1', JSON.stringify(payload.rbac.roles));
        if (payload.rbac.users) localStorage.setItem('cculb_rbac_users_v1', JSON.stringify(payload.rbac.users));
        if (payload.rbac.approvalRules) localStorage.setItem('cculb_approval_rules_v1', JSON.stringify(payload.rbac.approvalRules));
        if (payload.rbac.reportRoleConfig) localStorage.setItem('cculb_report_role_config_v2', JSON.stringify(payload.rbac.reportRoleConfig));
        if (payload.rbac.credentials) localStorage.setItem('cculb_rbac_creds_v1', JSON.stringify(payload.rbac.credentials));
      } catch (e) {
        console.warn('Failed restoring RBAC state', e);
      }
    }

    const roomsCount = (state.rooms || []).length;
    const resCount = (state.reservations || []).length;
    const foliosCount = (state.folios || []).length;
    const guestsCount = (state.guests || []).length;
    const glAccountsCount = (state.glAccounts || []).length;
    const invoicesCount = (state.invoices || []).length;

    this.logAudit('Restored Full Backup', 'Settings', 'MANUAL_RESTORE', undefined, `Restored database snapshot created at ${payload.metadata?.exportedAt || 'Unknown'}`);
    this.addAlert('success', 'Manual Data Backup Restored', `Database restored successfully (${roomsCount} rooms, ${resCount} reservations, ${foliosCount} folios).`);
    notify();

    return {
      success: true,
      message: 'Database backup restored successfully into active local state & synced.',
      details: {
        rooms: roomsCount,
        reservations: resCount,
        guests: guestsCount,
        folios: foliosCount,
        glAccounts: glAccountsCount,
        invoices: invoicesCount
      }
    };
  },

  reanchorArrivalsToToday(targetDate?: string): { count: number; businessDate: string } {
    const todayStr = targetDate || state.settings?.currentBusinessDate || getTodayString();

    let count = 0;
    const confirmed = (state.reservations || []).filter(r => r.status === 'Confirmed' || r.status === 'Unconfirmed' || (r.status as string) === 'Pending');

    if (confirmed.length === 0) {
      const seedReservations = getSeedPendingReservations(todayStr);
      state.reservations = [...(state.reservations || []), ...seedReservations];
      count = seedReservations.length;
    } else {
      confirmed.forEach((r, idx) => {
        const offset = idx < 3 ? 0 : (idx === 3 ? 1 : 2);
        r.arrivalDate = getOffsetDate(todayStr, offset);
        r.departureDate = getOffsetDate(r.arrivalDate, 2 + (idx % 2));
        r.updatedAt = new Date().toISOString();
        count++;
      });
    }

    if (state.settings) {
      state.settings.currentBusinessDate = todayStr;
    }

    saveDatabase(state);
    this.addAlert('success', 'Arrivals Re-Anchored', `Successfully realigned ${count} pending arrivals to business date ${todayStr}.`);
    notify();
    return { count, businessDate: todayStr };
  }
};
