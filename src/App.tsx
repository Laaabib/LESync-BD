import React, { useState, useEffect, useCallback } from 'react';
import { pmsService } from './services/pmsService';
import { authService, AuthSession } from './services/authService';
import { cloudSqlSyncService } from './services/cloudSqlSyncService';
import { realtimeSyncService } from './services/realtimeSyncService';
import { PmsDatabaseState } from './services/mockPmsDatabase';
import { Stay, Folio, Guest, EventBooking, Invoice, Room, Reservation, Payment } from './types/pms';

// Layout Components
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { PrintableModal } from './components/common/PrintableModal';

// Interactive Action Drawers & Modals
import { QuickCheckInDrawer } from './components/drawers/QuickCheckInDrawer';
import { QuickCheckOutDrawer } from './components/drawers/QuickCheckOutDrawer';
import { NewReservationModal } from './components/drawers/NewReservationModal';
import { RoomDetailDrawer } from './components/drawers/RoomDetailDrawer';
import { FolioDrawer } from './components/drawers/FolioDrawer';
import { GuestDetailDrawer } from './components/drawers/GuestDetailDrawer';
import { EventDetailDrawer } from './components/drawers/EventDetailDrawer';

// Primary Feature Views
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { FrontDeskView } from './views/FrontDeskView';
import { ReservationsView } from './views/ReservationsView';
import { ReservationCalendarView } from './views/ReservationCalendarView';
import { RoomAssignmentView } from './views/RoomAssignmentView';
import { RoomMoveView } from './views/RoomMoveView';
import { RoomStatusView } from './views/RoomStatusView';
import { WakeUpCallsView } from './views/WakeUpCallsView';
import { RoomRackView } from './views/RoomRackView';
import { RoomTypesView } from './views/RoomTypesView';
import { GuestsView } from './views/GuestsView';
import { HousekeepingView } from './views/HousekeepingView';
import { MaintenanceView } from './views/MaintenanceView';
import { ConventionEventsView } from './views/ConventionEventsView';
import { ConventionCalendarView } from './views/ConventionCalendarView';
import { ConventionPackagesView } from './views/ConventionPackagesView';
import { RestaurantView } from './views/RestaurantView';
import { InventoryView } from './views/InventoryView';
import { MenuManagementView } from './views/MenuManagementView';
import { RecreationAmenitiesView } from './views/RecreationAmenitiesView';
import { ActivitiesView } from './views/ActivitiesView';
import { AmenitiesView } from './views/AmenitiesView';
import { ProcurementView } from './views/ProcurementView';
import { AccountingLedgerView } from './views/AccountingLedgerView';
import { BillingFoliosView } from './views/BillingFoliosView';
import { BillingPaymentsView } from './views/BillingPaymentsView';
import { BillingInvoicesView } from './views/BillingInvoicesView';
import { ReportsView } from './views/ReportsView';
import { AlertsView } from './views/AlertsView';
import { AdminUsersView } from './views/AdminUsersView';
import { AdminAuditView } from './views/AdminAuditView';
import { AdminRoomsView } from './views/AdminRoomsView';
import { AdminHallsView } from './views/AdminHallsView';
import { NightAuditView } from './views/NightAuditView';
import { SettingsView } from './views/SettingsView';
import { BackupManagementView } from './views/BackupManagementView';
import { CommercialCrmView } from './views/CommercialCrmView';
import { HumanResourcesView } from './views/HumanResourcesView';
import { GlobalReportCenterView } from './views/GlobalReportCenterView';
import { DepartmentalReportsView } from './views/DepartmentalReportsView';
import { FinanceReportCenterView } from './views/FinanceReportCenterView';
import { AdminMasterOperationsView } from './views/AdminMasterOperationsView';
import { QuickMenuBar } from './components/dashboard/QuickMenuBar';
import { LayoutDashboard, BedDouble, UtensilsCrossed, Sparkles, Menu } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => authService.getSession());
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [activeRoute, setActiveRoute] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1280;
    }
    return false;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Auto-close mobile drawer on window resize above mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Quick Menu Bar Drawer State
  const [isQuickMenuBarOpen, setIsQuickMenuBarOpen] = useState(false);

  // Modal / Drawer States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInReservationId, setCheckInReservationId] = useState<string | undefined>(undefined);

  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [checkOutStayId, setCheckOutStayId] = useState<string | undefined>(undefined);

  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [reservationInitialRoomId, setReservationInitialRoomId] = useState<string | undefined>(undefined);
  const [reservationInitialDate, setReservationInitialDate] = useState<string | undefined>(undefined);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedFolioId, setSelectedFolioId] = useState<string | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [targetReportCode, setTargetReportCode] = useState<string | undefined>(undefined);

  const handleNavigate = useCallback((route: string, reportCode?: string) => {
    if (reportCode) {
      setTargetReportCode(reportCode);
    }
    setActiveRoute(route);
  }, []);

  // Print Document State
  const [printModal, setPrintModal] = useState<{
    isOpen: boolean;
    type: any;
    data: any;
  }>({
    isOpen: false,
    type: 'invoice',
    data: null
  });

  const [resortSyncNotice, setResortSyncNotice] = useState<{
    id: string;
    department: string;
    userName: string;
    reason: string;
    timestamp: string;
  } | null>(null);

  // Subscribe to service state, initialize Cloud SQL & Multi-Device Realtime Mesh, and Auto Night Audit monitor (06:00 AM)
  useEffect(() => {
    try {
      cloudSqlSyncService.init();
    } catch (err) {
      console.warn('Cloud SQL sync init non-critical error:', err);
    }
    try {
      realtimeSyncService.init();
    } catch (err) {
      console.warn('Realtime sync mesh init non-critical error:', err);
    }
    try {
      pmsService.checkAndTriggerAutoNightAudit();
    } catch (err) {
      console.warn('Auto night audit non-critical error:', err);
    }
    const timer = setInterval(() => {
      try {
        pmsService.checkAndTriggerAutoNightAudit();
      } catch (err) {
        console.warn('Auto night audit timer non-critical error:', err);
      }
    }, 60000);
    const unsubPms = pmsService.subscribe(setDb);
    const unsubAuth = authService.subscribe(setSession);
    const unsubNotices = realtimeSyncService.subscribeNotices((notice) => {
      setResortSyncNotice(notice);
      setTimeout(() => {
        setResortSyncNotice((current) => (current?.id === notice.id ? null : current));
      }, 5500);
    });

    return () => {
      clearInterval(timer);
      unsubPms();
      unsubAuth();
      unsubNotices();
    };
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.altKey && e.key === '1') {
        setActiveRoute('dashboard');
      } else if (e.altKey && e.key === '2') {
        setActiveRoute('front-desk');
      } else if (e.altKey && e.key === '3') {
        setActiveRoute('room-assignment');
      } else if (e.altKey && e.key === '4') {
        setIsNewReservationOpen(true);
      } else if (e.altKey && e.key === '5') {
        setIsCheckInOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Action Triggers
  const openCheckIn = useCallback((reservationId?: string) => {
    setCheckInReservationId(reservationId);
    setIsCheckInOpen(true);
  }, []);

  const openCheckout = useCallback((stayId?: string) => {
    setCheckOutStayId(stayId || '');
    setIsCheckOutOpen(true);
  }, []);

  const openNewReservation = useCallback((roomId?: string, date?: string) => {
    setReservationInitialRoomId(roomId);
    setReservationInitialDate(date);
    setIsNewReservationOpen(true);
  }, []);

  const openRoomDetail = useCallback((roomId: string) => {
    setSelectedRoomId(roomId);
  }, []);

  const openFolio = useCallback((folioId: string) => {
    setSelectedFolioId(folioId);
  }, []);

  const openGuest = useCallback((guestId: string) => {
    setSelectedGuestId(guestId);
  }, []);

  const openEvent = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
  }, []);

  // Print Handlers
  const handlePrintInvoice = useCallback((folioOrInvoice: Folio | Invoice | any) => {
    const isPos = Boolean(folioOrInvoice?.orderNumber || folioOrInvoice?.orderType || folioOrInvoice?.outlet || folioOrInvoice?.tableNumber);
    setPrintModal({
      isOpen: true,
      type: isPos ? 'pos-bill' : 'invoice',
      data: folioOrInvoice
    });
  }, []);

  const handlePrintFolio = useCallback((folio: Folio) => {
    setPrintModal({
      isOpen: true,
      type: 'folio',
      data: folio
    });
  }, []);

  const handlePrintReservation = useCallback((reservation: Reservation) => {
    setPrintModal({
      isOpen: true,
      type: 'reservation-confirmation',
      data: reservation
    });
  }, []);

  const handlePrintCheckoutForm = useCallback((data: { stay: Stay; folio?: Folio; invoice?: Invoice }) => {
    setPrintModal({
      isOpen: true,
      type: 'checkout-form',
      data: data
    });
  }, []);

  const handlePrintRegCard = useCallback((stay: Stay) => {
    setPrintModal({
      isOpen: true,
      type: 'registration-card',
      data: stay
    });
  }, []);

  const handlePrintPaymentReceipt = useCallback((payment: Payment) => {
    setPrintModal({
      isOpen: true,
      type: 'payment-receipt',
      data: payment
    });
  }, []);

  const handlePrintBanquetContract = useCallback((event: EventBooking) => {
    setPrintModal({
      isOpen: true,
      type: 'banquet-contract',
      data: event
    });
  }, []);

  const handlePrintBEO = useCallback((event: EventBooking) => {
    setPrintModal({
      isOpen: true,
      type: 'beo',
      data: event
    });
  }, []);

  const handlePrintOperationalReport = useCallback((reportData: any) => {
    setPrintModal({
      isOpen: true,
      type: 'operational-report',
      data: reportData
    });
  }, []);

  const handlePrintDocument = useCallback((type: any, data: any) => {
    setPrintModal({
      isOpen: true,
      type: type || 'invoice',
      data: data
    });
  }, []);

  // If user is not logged in, display luxury animated LESync PMS Login screen
  if (!session) {
    return (
      <LoginView
        onLoginSuccess={(route) => {
          setSession(authService.getSession());
          setActiveRoute(route || 'dashboard');
        }}
      />
    );
  }

  return (
    <div className="flex h-screen h-[100dvh] max-h-screen max-h-[100dvh] bg-[#F3F4F6] text-gray-900 font-sans overflow-hidden antialiased">
      {/* 1. Left Enterprise Navigation Sidebar */}
      <Sidebar
        currentRoute={activeRoute}
        onNavigate={setActiveRoute}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        mobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content View Area */}
      <div className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#F3F4F6] transition-all duration-200 ${
        isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Top Header Bar */}
        <Header
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenQuickReservation={() => openNewReservation()}
          onOpenQuickCheckIn={() => openCheckIn()}
          onOpenQuickReports={() => setIsQuickMenuBarOpen(true)}
          onNavigate={handleNavigate}
          onPrintReport={handlePrintOperationalReport}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(prev => !prev)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
          activeRoute={activeRoute}
        />

        {/* Dynamic View Scrollable Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3.5 lg:p-4 bg-[#F3F4F6] min-w-0">
          <div className="w-full max-w-full mx-auto pb-20 lg:pb-4 min-w-0">
            {activeRoute === 'dashboard' && (
              <DashboardView
                onNavigate={handleNavigate}
                onOpenCheckIn={() => openCheckIn()}
                onOpenNewReservation={() => openNewReservation()}
                onSelectRoom={openRoomDetail}
                onSelectStay={openCheckout}
                onOpenCheckout={openCheckout}
                onOpenQuickMenuBar={() => setIsQuickMenuBarOpen(true)}
              />
            )}

            {(activeRoute === 'front-desk' || activeRoute === 'front-office' || activeRoute === 'front-office-group' || activeRoute === 'front-office-dashboard') && (
              <FrontDeskView
                onOpenCheckIn={openCheckIn}
                onOpenCheckout={openCheckout}
                onOpenFolio={openFolio}
                onOpenRoomDetail={openRoomDetail}
                onPrintRegCard={handlePrintRegCard}
                onOpenNewReservation={() => openNewReservation()}
                onNavigate={setActiveRoute}
              />
            )}

            {activeRoute === 'reservations' && (
              <ReservationsView
                onOpenNewReservation={() => openNewReservation()}
                onOpenCheckIn={openCheckIn}
                onSelectGuest={openGuest}
                onPrintReservation={handlePrintReservation}
                onPrintReport={handlePrintOperationalReport}
              />
            )}

            {activeRoute === 'reservation-calendar' && (
              <ReservationCalendarView
                onOpenNewReservation={openNewReservation}
                onOpenCheckIn={openCheckIn}
                onSelectRoom={openRoomDetail}
              />
            )}

            {activeRoute === 'room-assignment' && (
              <RoomAssignmentView
                onOpenCheckIn={openCheckIn}
                onOpenRoomMove={(stayId) => {
                  setActiveRoute('room-move');
                }}
              />
            )}

            {activeRoute === 'room-move' && (
              <RoomMoveView
                onOpenCheckout={openCheckout}
                onOpenFolio={openFolio}
              />
            )}

            {(activeRoute === 'room-status' || activeRoute === 'room-types') && (
              <RoomStatusView
                onSelectRoom={openRoomDetail}
                onOpenCheckIn={openCheckIn}
                onOpenCheckout={openCheckout}
              />
            )}

            {activeRoute === 'front-office-wakeup' && (
              <WakeUpCallsView />
            )}

            {activeRoute === 'front-desk-checkin' && (
              <FrontDeskView
                onOpenCheckIn={openCheckIn}
                onOpenCheckout={openCheckout}
                onOpenFolio={openFolio}
                onOpenRoomDetail={openRoomDetail}
                onPrintRegCard={handlePrintRegCard}
                onOpenNewReservation={() => openNewReservation()}
                initialTab="arrivals"
                onNavigate={setActiveRoute}
              />
            )}

            {activeRoute === 'front-desk-checkout' && (
              <FrontDeskView
                onOpenCheckIn={openCheckIn}
                onOpenCheckout={openCheckout}
                onOpenFolio={openFolio}
                onOpenRoomDetail={openRoomDetail}
                onPrintRegCard={handlePrintRegCard}
                onOpenNewReservation={() => openNewReservation()}
                initialTab="departures"
                onNavigate={setActiveRoute}
              />
            )}

            {activeRoute === 'guests' && (
              <GuestsView
                onSelectGuest={openGuest}
                onPrintReport={handlePrintOperationalReport}
              />
            )}

            {/* Housekeeping Module */}
            {(activeRoute === 'housekeeping' || activeRoute.startsWith('housekeeping-') || activeRoute === 'reports-housekeeping') && (
              <HousekeepingView
                onSelectRoom={openRoomDetail}
                initialTab={activeRoute === 'reports-housekeeping' ? 'reports' : (activeRoute.startsWith('housekeeping-') ? activeRoute.replace('housekeeping-', '') : 'dashboard')}
                onNavigate={setActiveRoute}
                onPrintReport={handlePrintOperationalReport}
              />
            )}

            {/* Room Rack and Room Types */}
            {activeRoute === 'room-rack' && (
              <RoomRackView onSelectRoom={openRoomDetail} onOpenCheckIn={openCheckIn} />
            )}

            {activeRoute === 'room-types' && (
              <AdminRoomsView initialTab="room-types" onNavigate={(route) => setActiveRoute(route)} />
            )}

            {activeRoute === 'maintenance' && (
              <MaintenanceView />
            )}

            {/* Banquet & Convention Events */}
            {(activeRoute === 'convention-events' ||
              activeRoute === 'banquet' ||
              activeRoute === 'banquet-function-sheets' ||
              activeRoute === 'banquet-billing' ||
              activeRoute === 'banquet-deposits') && (
              <ConventionEventsView
                onSelectEvent={openEvent}
                onPrintContract={handlePrintBanquetContract}
                onPrintBEO={handlePrintBEO}
                onPrintReport={handlePrintOperationalReport}
              />
            )}

            {activeRoute === 'convention-calendar' && (
              <ConventionCalendarView
                onSelectEvent={openEvent}
              />
            )}

            {(activeRoute === 'convention-packages' || activeRoute === 'banquet-quotations') && (
              <ConventionPackagesView
                initialTab={activeRoute === 'banquet-quotations' ? 'quotations' : 'packages'}
                onNavigate={setActiveRoute}
              />
            )}

            {/* Restaurant & Dining POS */}
            {/* Restaurant & Bar F&B Management (Unified Single Module) */}
            {(activeRoute === 'restaurant' ||
              activeRoute === 'restaurant-group' ||
              activeRoute === 'restaurant-pos' ||
              activeRoute === 'restaurant-tables' ||
              activeRoute === 'restaurant-orders' ||
              activeRoute === 'restaurant-kot' ||
              activeRoute === 'restaurant-discounts' ||
              activeRoute === 'restaurant-complimentary' ||
              activeRoute === 'restaurant-voids' ||
              activeRoute === 'restaurant-settlements' ||
              activeRoute === 'reports-restaurant' ||
              activeRoute === 'bar' ||
              activeRoute === 'bar-group' ||
              activeRoute.startsWith('bar-') ||
              activeRoute === 'reports-bar') && (
              <RestaurantView
                initialTab={
                  activeRoute.startsWith('restaurant-')
                    ? activeRoute.replace('restaurant-', '')
                    : activeRoute.startsWith('bar-')
                    ? activeRoute.replace('bar-', '')
                    : (activeRoute === 'reports-restaurant' || activeRoute === 'reports-bar')
                    ? 'reports'
                    : 'pos'
                }
                onPrintInvoice={handlePrintInvoice}
                onNavigate={setActiveRoute}
              />
            )}

            {/* Activities Module */}
            {(activeRoute === 'activities' ||
              activeRoute.startsWith('activities-') ||
              activeRoute === 'reports-activities') && (
              <ActivitiesView
                initialTab={activeRoute === 'reports-activities' ? 'reports' : (activeRoute.startsWith('activities-') ? activeRoute.replace('activities-', '') : 'master')}
                onPrintInvoice={handlePrintInvoice}
                onNavigate={setActiveRoute}
              />
            )}

            {/* Room Amenities & Guest Fulfillment (Housekeeping Module) */}
            {(activeRoute === 'amenities' ||
              activeRoute.startsWith('amenities-') ||
              activeRoute === 'reports-amenities') && (
              <AmenitiesView
                initialTab={activeRoute === 'reports-amenities' ? 'reports' : (activeRoute.startsWith('amenities-') ? activeRoute.replace('amenities-', '') : 'master')}
                onPrintInvoice={handlePrintInvoice}
                onNavigate={setActiveRoute}
              />
            )}

            {/* Recreation Facilities Module */}
            {activeRoute === 'recreation' && (
              <RecreationAmenitiesView
                initialTab="master"
                onPrintInvoice={handlePrintInvoice}
              />
            )}

            {/* Procurement & Accounts Payable */}
            {(activeRoute === 'procurement' ||
              activeRoute.startsWith('procurement-') ||
              activeRoute === 'inventory-requisitions' ||
              activeRoute === 'inventory-purchase-orders' ||
              activeRoute === 'inventory-grn' ||
              activeRoute === 'inventory-suppliers' ||
              activeRoute === 'reports-procurement') && (
              <ProcurementView
                initialTab={
                  activeRoute === 'reports-procurement'
                    ? 'reports'
                    : activeRoute === 'inventory-requisitions' || activeRoute === 'procurement-requisitions'
                    ? 'requisitions'
                    : activeRoute === 'inventory-purchase-orders' || activeRoute === 'procurement-purchase-orders'
                    ? 'purchase-orders'
                    : activeRoute === 'inventory-grn' || activeRoute === 'procurement-grn'
                    ? 'grn'
                    : activeRoute === 'inventory-suppliers' || activeRoute === 'procurement-suppliers'
                    ? 'suppliers'
                    : activeRoute.startsWith('procurement-')
                    ? activeRoute.replace('procurement-', '')
                    : 'requisitions'
                }
                onNavigate={setActiveRoute}
              />
            )}

            {/* Inventory Management */}
            {(activeRoute === 'inventory' ||
              (activeRoute.startsWith('inventory-') &&
               activeRoute !== 'inventory-requisitions' &&
               activeRoute !== 'inventory-purchase-orders' &&
               activeRoute !== 'inventory-grn' &&
               activeRoute !== 'inventory-suppliers') ||
              activeRoute === 'reports-inventory') && (
              <InventoryView
                initialTab={
                  activeRoute === 'reports-inventory'
                    ? 'reports'
                    : activeRoute === 'inventory-issue'
                    ? 'issues'
                    : activeRoute === 'inventory-stock-levels'
                    ? 'stock-levels'
                    : activeRoute === 'inventory-stores'
                    ? 'stores'
                    : activeRoute === 'inventory-categories' || activeRoute === 'inventory-units'
                    ? 'categories-uom'
                    : activeRoute.startsWith('inventory-')
                    ? activeRoute.replace('inventory-', '')
                    : 'dashboard'
                }
                onPrintDocument={(type, data) => handlePrintDocument(type as any, data)}
              />
            )}

            {/* Menu Management */}
            {(activeRoute === 'menu' ||
              activeRoute === 'menu-management' ||
              activeRoute.startsWith('menu-') ||
              activeRoute === 'reports-menu') && (
              <MenuManagementView
                initialTab={activeRoute === 'reports-menu' ? 'reports' : (activeRoute.startsWith('menu-') ? activeRoute.replace('menu-', '') : 'catalog')}
              />
            )}

            {/* Commercial CRM & Sales */}
            {(activeRoute === 'sales-marketing' ||
              activeRoute.startsWith('sales-') ||
              activeRoute === 'crm' ||
              activeRoute.startsWith('crm-') ||
              activeRoute === 'reports-sales' ||
              activeRoute === 'reports-crm') && (
              <CommercialCrmView
                initialTab={
                  activeRoute.startsWith('sales-')
                    ? activeRoute.replace('sales-', '')
                    : activeRoute.startsWith('crm-')
                    ? activeRoute.replace('crm-', '')
                    : 'corporate'
                }
                onNavigate={(route: string) => setActiveRoute(route)}
              />
            )}

            {/* Human Resources */}
            {(activeRoute === 'hr' ||
              activeRoute.startsWith('hr-') ||
              activeRoute === 'reports-hr') && (
              <HumanResourcesView
                initialTab={
                  activeRoute === 'reports-hr'
                    ? 'reports'
                    : activeRoute.startsWith('hr-')
                    ? activeRoute.replace('hr-', '')
                    : 'employees'
                }
                onNavigate={(route: string) => setActiveRoute(route)}
              />
            )}

            {/* Finance, General Ledger & Accounting */}
            {(activeRoute === 'accounting-gl' ||
              activeRoute === 'accounting-jv' ||
              activeRoute === 'accounting-city-ledger' ||
              activeRoute === 'accounting-sync' ||
              activeRoute === 'accounting-chart' ||
              activeRoute === 'accounting-mapping' ||
              activeRoute === 'admin-mapping' ||
              activeRoute === 'finance-dashboard' ||
              activeRoute === 'finance-reconciliation' ||
              activeRoute === 'finance-mapping-test' ||
              activeRoute === 'finance-critical-tests' ||
              activeRoute === 'finance-ap' ||
              activeRoute === 'finance-guest-ledger' ||
              activeRoute === 'finance-supplier-ledger' ||
              activeRoute === 'finance-cash-bank' ||
              activeRoute === 'finance-taxes' ||
              activeRoute === 'finance-payments' ||
              activeRoute === 'finance-receipts' ||
              activeRoute === 'reports-finance' ||
              activeRoute === 'reports-financial' ||
              activeRoute === 'accounting-group' ||
              activeRoute === 'finance') && (
              <AccountingLedgerView
                initialTab={
                  activeRoute === 'finance-dashboard' || activeRoute === 'finance' ? 'dashboard' :
                  activeRoute === 'finance-reconciliation' ? 'reconciliation' :
                  activeRoute === 'finance-mapping-test' ? 'mapping-test' :
                  activeRoute === 'finance-critical-tests' ? 'critical-tests' :
                  activeRoute === 'accounting-city-ledger' ? 'ar' :
                  activeRoute === 'finance-ap' ? 'ap' :
                  activeRoute === 'finance-guest-ledger' ? 'guest-ledger' :
                  activeRoute === 'finance-supplier-ledger' ? 'supplier-ledger' :
                  activeRoute === 'finance-cash-bank' ? 'cash-bank' :
                  activeRoute === 'accounting-gl' ? 'gl' :
                  activeRoute === 'accounting-jv' ? 'jv' :
                  activeRoute === 'accounting-chart' ? 'chart' :
                  activeRoute === 'accounting-mapping' || activeRoute === 'admin-mapping' ? 'mapping' :
                  activeRoute === 'finance-taxes' ? 'taxes' :
                  activeRoute === 'finance-payments' ? 'payments' :
                  activeRoute === 'finance-receipts' ? 'receipts' :
                  activeRoute === 'reports-finance' || activeRoute === 'reports-financial' ? 'reports' :
                  activeRoute === 'accounting-sync' ? 'sync' :
                  'dashboard'
                }
                onNavigate={setActiveRoute}
              />
            )}

            {/* Billing Folios */}
            {activeRoute === 'billing-folios' && (
              <BillingFoliosView
                onOpenFolio={openFolio}
                onPrintInvoice={handlePrintInvoice}
                onPrintFolio={handlePrintFolio}
                onPrintReport={handlePrintOperationalReport}
              />
            )}

            {/* Billing Payments & Receipts */}
            {activeRoute === 'billing-payments' && (
              <BillingPaymentsView
                onPrintReceipt={handlePrintPaymentReceipt}
                onPrintReport={handlePrintOperationalReport}
              />
            )}

            {/* Billing Invoices */}
            {activeRoute === 'billing-invoices' && (
              <BillingInvoicesView
                onPrintInvoiceDirect={handlePrintInvoice}
                onPrintReport={handlePrintOperationalReport}
              />
            )}

            {/* Night Audit */}
            {activeRoute === 'night-audit' && (
              <NightAuditView onPrintReport={handlePrintOperationalReport} />
            )}

            {/* Global Report Center & Audit Registry (ONLY in Administration Module) */}
            {(activeRoute === 'admin-global-reports' ||
              activeRoute === 'admin-audit-registry') && (
              <GlobalReportCenterView
                onPrintReport={handlePrintOperationalReport}
                initialReportCode={targetReportCode}
                initialCategory="Dashboard"
              />
            )}

            {/* Finance & Accounts Management Report Center (ONLY in Accounts Module) */}
            {(activeRoute === 'reports-finance' ||
              activeRoute === 'reports-financial' ||
              activeRoute === 'reports-gl' ||
              activeRoute === 'reports-ar' ||
              activeRoute === 'reports-ap' ||
              activeRoute === 'reports-tax') && (
              <FinanceReportCenterView
                onPrintReport={handlePrintOperationalReport}
                initialReportCode={targetReportCode}
              />
            )}

            {/* Individual Departmental Reports (Strictly Isolated by Department) */}
            {activeRoute.startsWith('reports-') &&
              activeRoute !== 'reports-finance' &&
              activeRoute !== 'reports-financial' &&
              activeRoute !== 'reports-gl' &&
              activeRoute !== 'reports-ar' &&
              activeRoute !== 'reports-ap' &&
              activeRoute !== 'reports-tax' && (
              <DepartmentalReportsView
                departmentId={
                  activeRoute === 'reports-front-office'
                    ? 'front-office'
                    : activeRoute === 'reports-housekeeping'
                    ? 'housekeeping'
                    : activeRoute === 'reports-restaurant'
                    ? 'restaurant'
                    : activeRoute === 'reports-bar'
                    ? 'bar'
                    : activeRoute === 'reports-banquet'
                    ? 'banquet'
                    : activeRoute === 'reports-activities'
                    ? 'activities'
                    : activeRoute === 'reports-amenities'
                    ? 'amenities'
                    : activeRoute === 'reports-procurement'
                    ? 'procurement'
                    : activeRoute === 'reports-inventory'
                    ? 'inventory'
                    : activeRoute === 'reports-menu'
                    ? 'menu'
                    : activeRoute === 'reports-sales'
                    ? 'sales'
                    : activeRoute === 'reports-crm'
                    ? 'crm'
                    : activeRoute === 'reports-hr'
                    ? 'hr'
                    : activeRoute.replace('reports-', '')
                }
                onPrintReport={handlePrintOperationalReport}
                initialReportCode={targetReportCode}
              />
            )}

            {/* Legacy generic 'reports' route fallback */}
            {(activeRoute === 'reports' || activeRoute === 'reports-dashboard') && (
              <FinanceReportCenterView
                onPrintReport={handlePrintOperationalReport}
                initialReportCode={targetReportCode}
              />
            )}

            {/* System Alerts */}
            {activeRoute === 'alerts' && (
              <AlertsView />
            )}

            {/* Admin Rooms, Room Types & Floors */}
            {(activeRoute === 'admin-rooms' || activeRoute === 'admin-room-types' || activeRoute === 'admin-floors' || activeRoute === 'room-types') && (
              <AdminRoomsView
                initialTab={activeRoute === 'admin-room-types' || activeRoute === 'room-types' ? 'room-types' : activeRoute === 'admin-floors' ? 'floors' : 'rooms'}
                onNavigate={(route) => setActiveRoute(route)}
              />
            )}

            {activeRoute === 'admin-halls' && (
              <AdminHallsView />
            )}

            {/* Super Admin Master Operations Hub ("Superman" Full CRUD Controller) */}
            {(activeRoute === 'admin-master-hub' ||
              activeRoute === 'admin-menu-master' ||
              activeRoute === 'admin-department-items' ||
              activeRoute === 'admin-billing-options') && (
              <AdminMasterOperationsView
                initialTab={activeRoute}
                onNavigate={(route) => setActiveRoute(route)}
              />
            )}

            {/* Admin Users, Roles, Permissions & User Activity Logs */}
            {(activeRoute === 'admin-users' ||
              activeRoute === 'admin-roles' ||
              activeRoute === 'admin-permissions' ||
              activeRoute === 'admin-departments' ||
              activeRoute === 'admin-outlets' ||
              activeRoute === 'admin-approvals' ||
              activeRoute === 'admin-audit' ||
              activeRoute === 'admin-activity-logs' ||
              activeRoute === 'activity-logs') && (
              <AdminUsersView
                initialTab={activeRoute}
                onNavigate={(route) => setActiveRoute(route)}
              />
            )}

            {/* Admin Tax, Service Charge, Numbering, System Settings, Onboarding */}
            {(activeRoute === 'admin-tax' ||
              activeRoute === 'admin-service-charge' ||
              activeRoute === 'admin-numbering' ||
              activeRoute === 'admin-onboarding' ||
              activeRoute === 'admin-audit-rules' ||
              activeRoute === 'settings' ||
              activeRoute === 'administration') && (
              <SettingsView
                initialTab={activeRoute}
                onNavigate={(route) => setActiveRoute(route)}
                onNavigateToBackup={() => setActiveRoute('admin-backup')}
              />
            )}

            {/* Dedicated Manual Backup & Cloud SQL Center */}
            {(activeRoute === 'admin-backup' ||
              activeRoute === 'backup-management' ||
              activeRoute === 'admin-backup-center' ||
              activeRoute === 'admin-sql-console') && (
              <BackupManagementView initialTab={activeRoute === 'admin-sql-console' ? 'sql-console' : 'backup'} />
            )}
          </div>
        </main>

        {/* 2.5 Mobile Bottom Navigation Bar for Remote Staff Operations */}
        <nav
          id="mobile-bottom-nav"
          className="no-print print:hidden lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-30 flex items-center justify-around px-2 text-slate-400 select-none shadow-2xl"
        >
          <button
            type="button"
            onClick={() => setActiveRoute('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              activeRoute === 'dashboard' ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Home</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRoute('front-desk')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              activeRoute.startsWith('front') ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <BedDouble className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Front Desk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRoute('restaurant-pos')}
            className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors cursor-pointer ${
              activeRoute.startsWith('restaurant') ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Dining POS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRoute('housekeeping-cleaning')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              activeRoute.startsWith('housekeeping') ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Housekeeping</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">All Modules</span>
          </button>
        </nav>
      </div>

      {/* 3. Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectRoom={openRoomDetail}
        onSelectGuest={openGuest}
        onSelectReservation={openCheckIn}
        onSelectStay={openCheckout}
        onSelectEvent={openEvent}
        onSelectFolio={openFolio}
      />

      {/* 4. Action Drawers & Transaction Modals */}
      <QuickCheckInDrawer
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        preselectedReservationId={checkInReservationId}
        onSuccess={() => {
          setIsCheckInOpen(false);
          setActiveRoute('front-desk');
        }}
      />

      <QuickCheckOutDrawer
        isOpen={isCheckOutOpen}
        onClose={() => setIsCheckOutOpen(false)}
        stayId={checkOutStayId}
        onPrintInvoice={handlePrintInvoice}
        onPrintCheckoutForm={handlePrintCheckoutForm}
        onPrintFolio={handlePrintFolio}
        onSuccess={() => {
          if (activeRoute !== 'dashboard' && activeRoute !== 'front-desk-checkout' && activeRoute !== 'room-status' && activeRoute !== 'room-move') {
            setActiveRoute('front-desk');
          }
        }}
      />

      <NewReservationModal
        isOpen={isNewReservationOpen}
        onClose={() => setIsNewReservationOpen(false)}
        preselectedRoomId={reservationInitialRoomId}
        preselectedDate={reservationInitialDate}
        onSuccess={(resId, newReservation, shouldPrint = true) => {
          setIsNewReservationOpen(false);
          setActiveRoute('reservations');
          const targetRes = newReservation || (resId ? pmsService.getState().reservations.find(r => r.id === resId) : undefined);
          if (targetRes && shouldPrint !== false) {
            handlePrintReservation(targetRes);
          }
        }}
      />

      {selectedRoomId && (
        <RoomDetailDrawer
          isOpen={!!selectedRoomId}
          onClose={() => setSelectedRoomId(null)}
          roomId={selectedRoomId}
          onOpenCheckIn={openCheckIn}
          onOpenCheckout={openCheckout}
        />
      )}

      {selectedFolioId && (
        <FolioDrawer
          isOpen={!!selectedFolioId}
          onClose={() => setSelectedFolioId(null)}
          folioId={selectedFolioId}
          onPrintInvoice={handlePrintInvoice}
        />
      )}

      {selectedGuestId && (
        <GuestDetailDrawer
          isOpen={!!selectedGuestId}
          onClose={() => setSelectedGuestId(null)}
          guestId={selectedGuestId}
          onBookForGuest={(guest) => {
            setSelectedGuestId(null);
            openNewReservation();
          }}
        />
      )}

      {selectedEventId && (
        <EventDetailDrawer
          isOpen={!!selectedEventId}
          onClose={() => setSelectedEventId(null)}
          eventId={selectedEventId}
          onPrintContract={handlePrintBanquetContract}
          onPrintBEO={handlePrintBEO}
        />
      )}

      {/* 5. High Fidelity Printable Modal (Invoices, Reg Cards, Banquet Contracts) */}
      <PrintableModal
        isOpen={printModal.isOpen}
        onClose={() => setPrintModal({ isOpen: false, type: 'invoice', data: null })}
        documentType={printModal.type}
        type={printModal.type}
        data={printModal.data}
      />

      {/* 6. Quick Menu Bar: Front Desk Reports (In-House, Occupancy, Reservations, Arrivals, Departures) */}
      <QuickMenuBar
        isOpen={isQuickMenuBarOpen}
        onToggle={() => setIsQuickMenuBarOpen(prev => !prev)}
        db={db}
        onNavigate={handleNavigate}
        onOpenCheckIn={openCheckIn}
        onOpenCheckout={openCheckout}
        onPrintReport={handlePrintOperationalReport}
      />

      {/* 7. Live Multi-Device Resort Sync Toast */}
      {resortSyncNotice && (
        <div
          id="resort-live-sync-banner"
          className="no-print print:hidden fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700/80 animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-md"
        >
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <span>{resortSyncNotice.department}</span>
              <span className="text-slate-400 font-normal text-[11px]">• {resortSyncNotice.userName}</span>
              <span className="text-slate-500 text-[10px] ml-auto font-mono">{resortSyncNotice.timestamp}</span>
            </div>
            <p className="text-slate-200 text-xs mt-0.5 leading-snug">{resortSyncNotice.reason}</p>
          </div>
          <button
            onClick={() => setResortSyncNotice(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
