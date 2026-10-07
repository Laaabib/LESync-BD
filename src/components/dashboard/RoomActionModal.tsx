import React, { useState, useEffect, useMemo } from 'react';
import {
  X, LogOut, Receipt, CreditCard, Sparkles, CheckCircle2,
  AlertTriangle, User, DollarSign, Calendar, Printer, PlusCircle,
  Clock, ShieldAlert, Wrench, Check, Lock, Unlock, FileText,
  BedDouble, Info, Phone, Mail, ArrowRight, ShieldCheck, Tag, Star,
  Utensils, Users, ArrowRightLeft, ArrowUpRight, ChevronDown
} from 'lucide-react';
import { Room, OperationalStatus, HousekeepingStatus, Stay, Folio, FolioItem, Payment, PaymentMethod } from '../../types/pms';
import { PmsDatabaseState } from '../../services/mockPmsDatabase';
import { pmsService } from '../../services/pmsService';
import { GuestBillPaymentTab } from './billing/GuestBillPaymentTab';
import { ServiceBillTab } from './billing/ServiceBillTab';
import { GuestFolioDetailsTab } from './billing/GuestFolioDetailsTab';
import { RoomChangeUpgradeTab } from './billing/RoomChangeUpgradeTab';
import { BillPreviewTab } from './billing/BillPreviewTab';
import { PaxControlTab } from './billing/PaxControlTab';
import { IndividualBillingModal, IndividualBillingActionType } from './billing/IndividualBillingModal';
import { BDCardAndPaymentSelector } from '../common/BDCardAndPaymentSelector';
import { PaymentTenderDetails } from '../../constants/paymentConfig';
import { rbacService } from '../../services/rbacService';

export type RoomActionTab = 
  | 'overview' 
  | 'payment' 
  | 'service-bill' 
  | 'folio-details' 
  | 'room-change' 
  | 'bill-preview' 
  | 'pax-control' 
  | 'checkout' 
  | 'housekeeping';

interface RoomActionModalProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  db: PmsDatabaseState;
  onOpenCheckIn: (reservationId?: string) => void;
  onSelectStay: (stayId: string) => void;
  onShowToast: (msg: string) => void;
  initialTab?: RoomActionTab;
}

export const RoomActionModal: React.FC<RoomActionModalProps> = ({
  room,
  isOpen,
  onClose,
  db,
  onOpenCheckIn,
  onSelectStay,
  onShowToast,
  initialTab
}) => {
  // Active in-house stay and folio
  const activeStay: Stay | undefined = useMemo(() => {
    return (db.stays || []).find(
      s => s.status === 'Active' && (s.roomNumber === room.roomNumber || s.roomId === room.id)
    );
  }, [db.stays, room]);

  const activeFolio: Folio | undefined = useMemo(() => {
    if (!activeStay) return undefined;
    return (db.folios || []).find(f => f.id === activeStay.folioId || f.stayId === activeStay.id);
  }, [db.folios, activeStay]);

  const guest = useMemo(() => {
    if (!activeStay) return undefined;
    return (db.guests || []).find(g => g.id === activeStay.guestId);
  }, [db.guests, activeStay]);

  const reservation = useMemo(() => {
    const todayStr = db.settings?.currentBusinessDate || new Date().toISOString().split('T')[0];
    return (db.reservations || []).find(r => {
      const isPending = (r.status === 'Confirmed' || r.status === 'Unconfirmed' || (r.status as string) === 'Pending') &&
        r.status !== 'Cancelled' &&
        r.status !== 'Checked-In' &&
        r.status !== 'Checked-Out';
      if (!isPending) return false;
      const isDue = r.arrivalDate === todayStr || r.arrivalDate <= todayStr;
      if (!isDue) return false;

      if (r.assignedRoomId === room.id) return true;
      if (r.assignedRoomNumber === room.roomNumber) return true;
      if (r.assignedRoomNumber && r.assignedRoomNumber.split(',').map((s: string) => s.trim()).includes(room.roomNumber)) return true;
      if (Array.isArray(r.allocatedRooms) && r.allocatedRooms.some((a: any) => a.roomId === room.id || a.roomNumber === room.roomNumber)) return true;
      return false;
    });
  }, [db.reservations, db.settings, room]);

  const canAccessHousekeeping = useMemo(() => {
    return (
      rbacService.isSuperAdmin() ||
      rbacService.isModuleAllowed('housekeeping') ||
      rbacService.hasPermission('housekeeping:edit') ||
      rbacService.hasPermission('housekeeping:*')
    );
  }, []);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<RoomActionTab>(() => {
    if (initialTab === 'housekeeping' && !canAccessHousekeeping) return 'overview';
    return initialTab || 'overview';
  });

  // Separated Individual Billing Modal state
  const [separatedAction, setSeparatedAction] = useState<IndividualBillingActionType | null>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState<boolean>(false);
  const [isCardMenuOpen, setIsCardMenuOpen] = useState<boolean>(false);

  // Operational & Housekeeping status edits
  const [editOpStatus, setEditOpStatus] = useState<OperationalStatus>(room.operationalStatus);
  const [editHkStatus, setEditHkStatus] = useState<HousekeepingStatus>(room.housekeepingStatus);
  const [editNotes, setEditNotes] = useState<string>(room.notes || '');

  // CHECKOUT STATE
  const [checkoutSettleAmount, setCheckoutSettleAmount] = useState<number | ''>(0);
  const [checkoutMethod, setCheckoutMethod] = useState<PaymentMethod>('Cash');
  const [checkoutRef, setCheckoutRef] = useState<string>('Front Desk Counter Settlement');
  const [checkoutPaymentDetails, setCheckoutPaymentDetails] = useState<Partial<PaymentTenderDetails>>({});
  const [checkoutError, setCheckoutError] = useState<string>('');
  const [checkoutSuccessInvoice, setCheckoutSuccessInvoice] = useState<string | null>(null);

  // HOUSEKEEPING STATE
  const currentUser = rbacService.getActiveUser();
  const [housekeepingAuthorized, setHousekeepingAuthorized] = useState<boolean>(canAccessHousekeeping);
  const [assignedHousekeeper, setAssignedHousekeeper] = useState<string>('Rahima Begum');
  const [checklist, setChecklist] = useState({
    bedLinenChanged: room.housekeepingStatus === 'Clean' || room.housekeepingStatus === 'Inspected',
    bathroomSanitized: room.housekeepingStatus === 'Clean' || room.housekeepingStatus === 'Inspected',
    towelsReplaced: room.housekeepingStatus === 'Clean' || room.housekeepingStatus === 'Inspected',
    amenitiesRestocked: room.housekeepingStatus === 'Clean' || room.housekeepingStatus === 'Inspected',
    floorCleaned: room.housekeepingStatus === 'Clean' || room.housekeepingStatus === 'Inspected',
    minibarChecked: room.housekeepingStatus === 'Clean' || room.housekeepingStatus === 'Inspected'
  });

  // Sync state when room opens or changes
  useEffect(() => {
    if (isOpen) {
      setEditOpStatus(room.operationalStatus);
      setEditHkStatus(room.housekeepingStatus);
      setEditNotes(room.notes || '');
      setCheckoutSuccessInvoice(null);
      setCheckoutError('');
      setHousekeepingAuthorized(canAccessHousekeeping);

      if (activeTab === 'housekeeping' && !canAccessHousekeeping) {
        setActiveTab('overview');
      }

      if (activeFolio) {
        const balance = Math.max(0, activeFolio.balance);
        setCheckoutSettleAmount(balance);
      }

      // Default tab based on room status
      if (initialTab) {
        if (initialTab === 'housekeeping' && !canAccessHousekeeping) {
          setActiveTab('overview');
        } else {
          setActiveTab(initialTab);
        }
      } else if (room.operationalStatus === 'Occupied' && activeStay) {
        setActiveTab('overview');
      } else if ((room.housekeepingStatus === 'Dirty' || room.operationalStatus === 'Dirty') && canAccessHousekeeping) {
        setActiveTab('housekeeping');
      } else {
        setActiveTab('overview');
      }
    }
  }, [isOpen, room, activeFolio, activeStay, canAccessHousekeeping, initialTab]);

  if (!isOpen) return null;

  // --- ACTIONS ---

  // 1. SAVE ROOM STATUS
  const handleSaveGeneralStatus = () => {
    try {
      const targetHk = canAccessHousekeeping ? editHkStatus : room.housekeepingStatus;
      pmsService.updateRoomStatus(room.id, editOpStatus, targetHk, editNotes);
      onShowToast(`Room ${room.roomNumber} updated to ${editOpStatus}${canAccessHousekeeping ? ` / ${targetHk}` : ''}`);
      onClose();
    } catch (err: any) {
      onShowToast(err.message || 'Status update failed');
    }
  };

  // 2. CHECK OUT
  const handleExecuteCheckout = () => {
    if (!activeStay) return;
    setCheckoutError('');

    let settlePayment = undefined;
    const settleNum = typeof checkoutSettleAmount === 'number' ? checkoutSettleAmount : parseFloat(checkoutSettleAmount) || 0;
    if (settleNum > 0) {
      settlePayment = {
        amount: settleNum,
        method: checkoutMethod,
        reference: checkoutRef || 'Front Desk Check-out Settlement',
        ...checkoutPaymentDetails
      };
    }

    try {
      const { invoice } = pmsService.checkOutStay({
        stayId: activeStay.id,
        settlePayment
      });

      setCheckoutSuccessInvoice(invoice.invoiceNumber);
      onShowToast(`Room ${room.roomNumber} checked out successfully! Invoice: ${invoice.invoiceNumber}`);
    } catch (err: any) {
      setCheckoutError(err.message || 'Checkout failed');
    }
  };

  // 3. HOUSEKEEPING COMPLETE TURNOVER
  const handleHousekeepingCompleteClean = () => {
    try {
      pmsService.updateHousekeepingStatus(room.id, 'Clean', `Turnover completed by ${assignedHousekeeper}. All sanitation items verified.`);
      onShowToast(`Room ${room.roomNumber} marked CLEAN by Housekeeping (${assignedHousekeeper})`);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to update housekeeping status');
    }
  };

  // 6. HOUSEKEEPING INSPECTED
  const handleHousekeepingInspect = () => {
    try {
      pmsService.updateHousekeepingStatus(room.id, 'Inspected', `Supervisor inspection passed. Assigned: ${assignedHousekeeper}`);
      onShowToast(`Room ${room.roomNumber} INSPECTED and ready for guest arrival!`);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to update housekeeping status');
    }
  };

  // 7. REPORT DEFECT
  const handleReportMaintenance = () => {
    const title = prompt(`Report defect for Room ${room.roomNumber} (e.g., AC not cooling, bathroom leak):`);
    if (!title) return;
    try {
      pmsService.createMaintenanceTicket({
        roomId: room.id,
        title,
        description: `Logged via Housekeeping Department inspection for Room ${room.roomNumber}`,
        priority: 'High',
        assignedTo: 'Facility Maintenance',
        marksOutOfOrder: false
      });
      onShowToast(`Maintenance ticket logged for Room ${room.roomNumber}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create ticket');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex flex-col items-center justify-center font-mono font-black shadow-md shrink-0">
              <span className="text-lg leading-none text-white">{room.roomNumber}</span>
              <span className="text-[9px] font-bold text-blue-200 uppercase mt-0.5">Fl {room.floor}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                  Room {room.roomNumber} • {room.roomTypeName}
                </h3>
                {guest?.vipStatus && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[10px] font-bold flex items-center space-x-1 shrink-0">
                    <Star className="w-3 h-3 fill-current" />
                    <span>VIP</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-300 mt-0.5 flex-wrap gap-y-1">
                <span>Category: <strong className="text-white">{room.roomTypeName}</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-blue-300 font-bold">{room.operationalStatus}</strong></span>
                <span>•</span>
                <span>Housekeeping: <strong className={`font-bold ${room.housekeepingStatus === 'Clean' ? 'text-emerald-400' : room.housekeepingStatus === 'Dirty' ? 'text-rose-400' : 'text-purple-300'}`}>{room.housekeepingStatus}</strong></span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 ml-2">
            {/* INDIVIDUAL BILLING POP-UP MENU DROPDOWN */}
            {activeStay && (
              <div className="relative">
                <button
                  type="button"
                  id="room-modal-header-billing-menu-btn"
                  onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1 shadow-xs border border-blue-400 transition-colors"
                  title="Open separated front desk billing pop-up modal"
                >
                  <span>⚡ Pop-Up Menu</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isHeaderMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isHeaderMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-2xl border-2 border-blue-500 p-2 z-50 text-slate-900 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-2 py-1 border-b border-gray-200 mb-1">
                      <p className="font-black text-[11px] text-blue-950">Individual Pop-Up Menu</p>
                      <p className="text-[10px] text-gray-500">Open separated modal for Room {room.roomNumber}</p>
                    </div>

                    <div className="space-y-0.5 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setIsHeaderMenuOpen(false);
                          setSeparatedAction('payment');
                        }}
                        className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-emerald-50 text-emerald-900 flex items-center space-x-2 transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Guest Bill Payment</span>
                        <ArrowUpRight className="w-3 h-3 text-emerald-400 ml-auto" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsHeaderMenuOpen(false);
                          setSeparatedAction('service-bill');
                        }}
                        className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-blue-50 text-blue-900 flex items-center space-x-2 transition-colors"
                      >
                        <Utensils className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Service Bill (POS/KOT)</span>
                        <ArrowUpRight className="w-3 h-3 text-blue-400 ml-auto" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsHeaderMenuOpen(false);
                          setSeparatedAction('folio-details');
                        }}
                        className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-indigo-50 text-indigo-900 flex items-center space-x-2 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Details of Guest Folio</span>
                        <ArrowUpRight className="w-3 h-3 text-indigo-400 ml-auto" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsHeaderMenuOpen(false);
                          setSeparatedAction('room-change');
                        }}
                        className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-purple-50 text-purple-900 flex items-center space-x-2 transition-colors"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>Room Change & Upgrade</span>
                        <ArrowUpRight className="w-3 h-3 text-purple-400 ml-auto" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsHeaderMenuOpen(false);
                          setSeparatedAction('bill-preview');
                        }}
                        className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-slate-100 text-slate-900 flex items-center space-x-2 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                        <span>Bill Preview of All Bills</span>
                        <ArrowUpRight className="w-3 h-3 text-slate-400 ml-auto" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsHeaderMenuOpen(false);
                          setSeparatedAction('pax-control');
                        }}
                        className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-amber-50 text-amber-900 flex items-center space-x-2 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Pax In / Pax Out Control</span>
                        <ArrowUpRight className="w-3 h-3 text-amber-400 ml-auto" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL TABS BAR - FRONT DESK BILLING & ROOM MANAGEMENT */}
        <div className="bg-slate-100/90 border-b border-gray-200 px-3 py-1.5 flex items-center space-x-1.5 overflow-x-auto shrink-0 scrollbar-thin">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'overview'
                ? 'bg-white text-blue-700 shadow-xs border border-gray-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <BedDouble className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          {activeStay && (
            <>
              {/* 1. GUEST BILL PAYMENT */}
              <button
                onClick={() => setActiveTab('payment')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'payment'
                    ? 'bg-white text-emerald-700 shadow-xs border border-gray-200'
                    : 'text-gray-600 hover:text-emerald-700 hover:bg-gray-200/60'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Guest Payment</span>
                {activeFolio && activeFolio.balance > 0 && (
                  <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ml-1">
                    ৳{(activeFolio.balance || 0).toLocaleString()}
                  </span>
                )}
              </button>

              {/* 2. SERVICE BILL */}
              <button
                onClick={() => setActiveTab('service-bill')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'service-bill'
                    ? 'bg-white text-blue-700 shadow-xs border border-gray-200'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-gray-200/60'
                }`}
              >
                <Utensils className="w-3.5 h-3.5 text-blue-600" />
                <span>Service Bill</span>
              </button>

              {/* 3. GUEST FOLIO DETAILS */}
              <button
                onClick={() => setActiveTab('folio-details')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'folio-details'
                    ? 'bg-white text-indigo-700 shadow-xs border border-gray-200'
                    : 'text-gray-600 hover:text-indigo-700 hover:bg-gray-200/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Folio Details</span>
              </button>

              {/* 4. ROOM CHANGE / UPGRADE */}
              <button
                onClick={() => setActiveTab('room-change')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'room-change'
                    ? 'bg-white text-purple-700 shadow-xs border border-gray-200'
                    : 'text-gray-600 hover:text-purple-700 hover:bg-gray-200/60'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
                <span>Change / Upgrade</span>
              </button>

              {/* 5. BILL PREVIEW OF ALL BILLS */}
              <button
                onClick={() => setActiveTab('bill-preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'bill-preview'
                    ? 'bg-white text-teal-700 shadow-xs border border-gray-200'
                    : 'text-gray-600 hover:text-teal-700 hover:bg-gray-200/60'
                }`}
              >
                <Printer className="w-3.5 h-3.5 text-teal-600" />
                <span>Bill Preview</span>
              </button>

              {/* 6. PAX IN / PAX OUT */}
              <button
                onClick={() => setActiveTab('pax-control')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'pax-control'
                    ? 'bg-white text-amber-700 shadow-xs border border-gray-200'
                    : 'text-gray-600 hover:text-amber-700 hover:bg-gray-200/60'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Pax In / Out</span>
                <span className="bg-amber-100 text-amber-900 px-1 py-0.2 rounded text-[10px] font-bold">
                  {(activeStay.adults || 1) + (activeStay.children || 0)}
                </span>
              </button>

              {/* CHECKOUT */}
              <button
                onClick={() => setActiveTab('checkout')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'checkout'
                    ? 'bg-white text-rose-700 shadow-xs border border-gray-200'
                    : 'text-gray-600 hover:text-rose-700 hover:bg-gray-200/60'
                }`}
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Check Out</span>
              </button>
            </>
          )}

          {/* DEDICATED HOUSEKEEPING DEPARTMENT TAB (Restricted to Housekeeping Department) */}
          {canAccessHousekeeping && (
            <button
              onClick={() => setActiveTab('housekeeping')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ml-auto shrink-0 ${
                activeTab === 'housekeeping'
                  ? 'bg-white text-purple-800 shadow-xs border border-purple-200 ring-1 ring-purple-300'
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Housekeeping</span>
              {room.housekeepingStatus === 'Dirty' && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>
          )}
        </div>

        {/* MODAL BODY */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">

          {/* ========================================================= */}
          {/* TAB 1: ROOM OVERVIEW & FRONT DESK STATUS                 */}
          {/* ========================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Active In-House Guest Card */}
              {activeStay ? (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">
                        In-House Guest
                      </span>
                      <span className="text-xs font-mono font-bold text-blue-900">
                        Stay: {activeStay.stayNumber}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('checkout')}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1 cursor-pointer transition-colors"
                        title="Proceed directly to guest check-out and settlement"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Check-Out</span>
                      </button>
                      <button
                        onClick={() => {
                          onClose();
                          onSelectStay(activeStay.id);
                        }}
                        className="text-xs font-bold text-blue-700 hover:underline flex items-center space-x-1"
                      >
                        <span>Full Stay Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[11px] text-gray-500 font-semibold">Guest Full Name</p>
                      <p className="text-sm font-black text-slate-900 flex items-center space-x-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>{activeStay.guestName}</span>
                      </p>
                      {guest?.phone && (
                        <p className="text-xs text-gray-600 flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{guest.phone}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-[11px] text-gray-500 font-semibold">Residency Period</p>
                      <p className="font-bold text-slate-800 mt-0.5">
                        Check-in: {activeStay.checkInAt?.split('T')[0]}
                      </p>
                      <p className="font-bold text-slate-800">
                        Expected Out: {activeStay.expectedCheckOutAt?.split('T')[0]}
                      </p>
                    </div>
                  </div>

                  {/* Front Desk Billing & Options Quick Grid - INDIVIDUAL POP-UP MENU & SEPARATED MODALS */}
                  <div className="pt-2.5 border-t border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-blue-950 block">
                          Front Desk Billing & Room Actions:
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200 flex items-center space-x-1">
                          <span>Separated Pop-up Dialogs</span>
                        </span>
                      </div>

                      {/* INDIVIDUAL POP-UP MENU TRIGGER BUTTON */}
                      <div className="relative">
                        <button
                          type="button"
                          id="overview-individual-popup-menu-btn"
                          onClick={() => setIsCardMenuOpen(!isCardMenuOpen)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center space-x-1 shadow-xs transition-colors"
                        >
                          <span>⚡ Individual Pop-Up Menu</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${isCardMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Floating Popover Menu */}
                        {isCardMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 bottom-full mb-1 w-64 bg-white border-2 border-blue-500 rounded-xl shadow-2xl p-2 z-50 text-slate-900 animate-in fade-in zoom-in-95 duration-100"
                          >
                            <div className="px-2 py-1 border-b border-gray-200 mb-1">
                              <p className="font-black text-[11px] text-blue-950">Individual Pop-Up Menu</p>
                              <p className="text-[10px] text-gray-500">Open separated pop-up dialog</p>
                            </div>

                            <div className="space-y-0.5 text-xs font-bold">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCardMenuOpen(false);
                                  setActiveTab('checkout');
                                }}
                                className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-rose-50 text-rose-900 flex items-center space-x-2 cursor-pointer"
                              >
                                <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>Guest Check-Out & Settlement</span>
                                <ArrowUpRight className="w-3 h-3 text-rose-500 ml-auto" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setIsCardMenuOpen(false);
                                  setSeparatedAction('payment');
                                }}
                                className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-emerald-50 text-emerald-900 flex items-center space-x-2"
                              >
                                <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Guest Bill Payment</span>
                                <ArrowUpRight className="w-3 h-3 text-emerald-500 ml-auto" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setIsCardMenuOpen(false);
                                  setSeparatedAction('service-bill');
                                }}
                                className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-blue-50 text-blue-900 flex items-center space-x-2"
                              >
                                <Utensils className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>Service Bill (KOT/POS)</span>
                                <ArrowUpRight className="w-3 h-3 text-blue-500 ml-auto" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setIsCardMenuOpen(false);
                                  setSeparatedAction('folio-details');
                                }}
                                className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-indigo-50 text-indigo-900 flex items-center space-x-2"
                              >
                                <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span>Details of Guest Folio</span>
                                <ArrowUpRight className="w-3 h-3 text-indigo-500 ml-auto" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setIsCardMenuOpen(false);
                                  setSeparatedAction('room-change');
                                }}
                                className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-purple-50 text-purple-900 flex items-center space-x-2"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                <span>Room Change & Upgrade</span>
                                <ArrowUpRight className="w-3 h-3 text-purple-500 ml-auto" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setIsCardMenuOpen(false);
                                  setSeparatedAction('bill-preview');
                                }}
                                className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-slate-100 text-slate-900 flex items-center space-x-2"
                              >
                                <Printer className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                                <span>Bill Preview of All Bills</span>
                                <ArrowUpRight className="w-3 h-3 text-slate-500 ml-auto" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setIsCardMenuOpen(false);
                                  setSeparatedAction('pax-control');
                                }}
                                className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-amber-50 text-amber-900 flex items-center space-x-2"
                              >
                                <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Pax In / Pax Out Control</span>
                                <ArrowUpRight className="w-3 h-3 text-amber-500 ml-auto" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SEPARATED ACTION BUTTONS - OPENS DEDICATED POP-UP MODAL */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
                      <button
                        type="button"
                        id="open-overview-checkout-btn"
                        onClick={() => setActiveTab('checkout')}
                        className="p-2.5 bg-white hover:bg-rose-50/80 border border-rose-300 hover:border-rose-500 rounded-xl text-rose-950 text-left transition-all group relative shadow-xs hover:shadow-md flex flex-col justify-between cursor-pointer"
                        title="Click to check out in-house guest and settle folio"
                      >
                        <div className="flex items-center justify-between mb-1.5 w-full">
                          <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
                            <LogOut className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center space-x-0.5 border border-rose-200">
                            <span>Out</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-xs leading-snug text-rose-950">Guest Check-Out</p>
                          <span className="text-[10px] text-rose-700/80 block mt-0.5 leading-tight">Settlement & Exit</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        id="open-separated-payment-btn"
                        onClick={() => setSeparatedAction('payment')}
                        className="p-2.5 bg-white hover:bg-emerald-50/80 border border-emerald-300 hover:border-emerald-500 rounded-xl text-emerald-950 text-left transition-all group relative shadow-xs hover:shadow-md flex flex-col justify-between"
                        title="Click to open individual separated Guest Bill Payment pop-up modal"
                      >
                        <div className="flex items-center justify-between mb-1.5 w-full">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                            <CreditCard className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center space-x-0.5 border border-emerald-200">
                            <span>Pop-up</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-xs leading-snug text-emerald-950">Pay Bill</p>
                          <span className="text-[10px] text-emerald-700/80 block mt-0.5 leading-tight">Guest Payment</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        id="open-separated-service-bill-btn"
                        onClick={() => setSeparatedAction('service-bill')}
                        className="p-2.5 bg-white hover:bg-blue-50/80 border border-blue-300 hover:border-blue-500 rounded-xl text-blue-950 text-left transition-all group relative shadow-xs hover:shadow-md flex flex-col justify-between"
                        title="Click to open individual separated Service Bill pop-up modal"
                      >
                        <div className="flex items-center justify-between mb-1.5 w-full">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                            <Utensils className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center space-x-0.5 border border-blue-200">
                            <span>Pop-up</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-xs leading-snug text-blue-950">Service Bill</p>
                          <span className="text-[10px] text-blue-700/80 block mt-0.5 leading-tight">F&B, Laundry</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        id="open-separated-folio-details-btn"
                        onClick={() => setSeparatedAction('folio-details')}
                        className="p-2.5 bg-white hover:bg-indigo-50/80 border border-indigo-300 hover:border-indigo-500 rounded-xl text-indigo-950 text-left transition-all group relative shadow-xs hover:shadow-md flex flex-col justify-between"
                        title="Click to open individual separated Guest Folio pop-up modal"
                      >
                        <div className="flex items-center justify-between mb-1.5 w-full">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center space-x-0.5 border border-indigo-200">
                            <span>Pop-up</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-xs leading-snug text-indigo-950">Guest Folio</p>
                          <span className="text-[10px] text-indigo-700/80 block mt-0.5 leading-tight">Details & Ledger</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        id="open-separated-room-change-btn"
                        onClick={() => setSeparatedAction('room-change')}
                        className="p-2.5 bg-white hover:bg-purple-50/80 border border-purple-300 hover:border-purple-500 rounded-xl text-purple-950 text-left transition-all group relative shadow-xs hover:shadow-md flex flex-col justify-between"
                        title="Click to open individual separated Room Change & Upgrade pop-up modal"
                      >
                        <div className="flex items-center justify-between mb-1.5 w-full">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center space-x-0.5 border border-purple-200">
                            <span>Pop-up</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-xs leading-snug text-purple-950">Room Change</p>
                          <span className="text-[10px] text-purple-700/80 block mt-0.5 leading-tight">Upgrade & Transfer</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        id="open-separated-bill-preview-btn"
                        onClick={() => setSeparatedAction('bill-preview')}
                        className="p-2.5 bg-white hover:bg-teal-50/80 border border-teal-300 hover:border-teal-500 rounded-xl text-teal-950 text-left transition-all group relative shadow-xs hover:shadow-md flex flex-col justify-between"
                        title="Click to open individual separated Bill Preview pop-up modal"
                      >
                        <div className="flex items-center justify-between mb-1.5 w-full">
                          <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
                            <Printer className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center space-x-0.5 border border-teal-200">
                            <span>Pop-up</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-xs leading-snug text-teal-950">Bill Preview</p>
                          <span className="text-[10px] text-teal-700/80 block mt-0.5 leading-tight">All Bills & Print</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        id="open-separated-pax-control-btn"
                        onClick={() => setSeparatedAction('pax-control')}
                        className="p-2.5 bg-white hover:bg-amber-50/80 border border-amber-300 hover:border-amber-500 rounded-xl text-amber-950 text-left transition-all group relative shadow-xs hover:shadow-md flex flex-col justify-between"
                        title="Click to open individual separated Pax In / Out pop-up modal"
                      >
                        <div className="flex items-center justify-between mb-1.5 w-full">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center space-x-0.5 border border-amber-200">
                            <span>Pop-up</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-xs leading-snug text-amber-950">Pax In / Out</p>
                          <span className="text-[10px] text-amber-700/80 block mt-0.5 leading-tight">Headcount & Keys</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              ) : reservation ? (
                /* Reserved for today */
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider">
                      Reserved Arrival Today
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-900">
                      Res: {reservation.reservationNumber}
                    </span>
                  </div>
                  <p className="text-sm font-black text-amber-950 flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>{reservation.guestName}</span>
                  </p>
                  <p className="text-xs text-amber-800">
                    Expected check-in today • Room rate: ৳{(reservation.rate || 0).toLocaleString()}/night
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCheckIn(reservation.id);
                    }}
                    className="mt-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Check-In This Reservation</span>
                  </button>
                </div>
              ) : (
                /* Room Available for Walk-in */
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
                      Vacant & Ready
                    </span>
                    <h4 className="text-sm font-bold text-emerald-950 mt-1">
                      Room is ready for immediate occupancy
                    </h4>
                    <p className="text-xs text-emerald-700">
                      Standard rack rate: ৳{((room as any).baseRate || (room as any).basePrice || (room as any).rate || 4500)?.toLocaleString()}/night
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCheckIn();
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-md flex items-center space-x-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Walk-In Check In</span>
                  </button>
                </div>
              )}

              {/* Status Selectors */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">
                    Operational Status:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {(['Available', 'Occupied', 'Dirty', 'Reserved', 'Out of Order', 'Out of Service'] as OperationalStatus[]).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setEditOpStatus(st);
                          if (st === 'Available' && (editHkStatus === 'Dirty' || editOpStatus === 'Out of Service' || editOpStatus === 'Out of Order')) {
                            setEditHkStatus('Clean');
                          } else if (st === 'Dirty') {
                            setEditHkStatus('Dirty');
                          }
                        }}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all border text-center ${
                          editOpStatus === st
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700">
                      Housekeeping Status:
                    </label>
                    {!canAccessHousekeeping && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>Housekeeping Authority Only (FO Read-Only)</span>
                      </span>
                    )}
                  </div>

                  {canAccessHousekeeping ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['Clean', 'Dirty', 'Cleaning', 'Inspected'] as HousekeepingStatus[]).map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            setEditHkStatus(st);
                            if ((st === 'Clean' || st === 'Inspected') && (editOpStatus === 'Out of Service' || editOpStatus === 'Dirty' || editOpStatus === 'Cleaning')) {
                              setEditOpStatus(st === 'Inspected' ? 'Inspected' : 'Available');
                            } else if (st === 'Dirty' && editOpStatus === 'Available') {
                              setEditOpStatus('Dirty');
                            } else if (st === 'Cleaning' && editOpStatus === 'Available') {
                              setEditOpStatus('Cleaning');
                            }
                          }}
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all border text-center ${
                            editHkStatus === st
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          room.housekeepingStatus === 'Clean' ? 'bg-emerald-500' :
                          room.housekeepingStatus === 'Inspected' ? 'bg-purple-500' :
                          room.housekeepingStatus === 'Dirty' ? 'bg-rose-500' : 'bg-blue-500'
                        }`} />
                        <span className="text-xs font-bold text-gray-800">{room.housekeepingStatus}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 italic">Cleaning and inspection updates require Housekeeping role</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">
                    Room Maintenance & Front Office Notes:
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="e.g. VIP fruit basket placed, extra towels requested, quiet room..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Quick Operation Buttons */}
              <div className="pt-3 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {canAccessHousekeeping ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditOpStatus('Available');
                        setEditHkStatus('Clean');
                      }}
                      className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 text-center"
                    >
                      Set Clean & Ready
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditOpStatus('Dirty');
                        setEditHkStatus('Dirty');
                      }}
                      className="py-2 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 text-center"
                    >
                      Mark Dirty
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditOpStatus('Cleaning');
                        setEditHkStatus('Cleaning');
                      }}
                      className="py-2 px-2 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-lg border border-purple-200 text-center"
                    >
                      Mark Cleaning
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (room.housekeepingStatus === 'Clean' || room.housekeepingStatus === 'Inspected') {
                          setEditOpStatus('Available');
                        } else {
                          alert(`Room ${room.roomNumber} is currently ${room.housekeepingStatus}. Housekeeping inspection is required before releasing to Available.`);
                        }
                      }}
                      className="py-2 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-lg border border-blue-200 text-center"
                    >
                      Set Available (If Clean)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditOpStatus('Reserved');
                      }}
                      className="py-2 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold rounded-lg border border-indigo-200 text-center"
                    >
                      Mark Reserved
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditOpStatus('Out of Service');
                    if (canAccessHousekeeping) setEditHkStatus('Dirty');
                    setEditNotes('Temporary maintenance / soft hold');
                  }}
                  className="py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-300 text-center"
                >
                  Set Out of Service
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditOpStatus('Out of Order');
                    if (canAccessHousekeeping) setEditHkStatus('Dirty');
                    setEditNotes('Maintenance work in progress');
                  }}
                  className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg border border-slate-300 text-center"
                >
                  Set Out of Order
                </button>
              </div>

              {/* Save Status Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveGeneralStatus}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  Save Status Updates
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: CHECK OUT ROOM                                     */}
          {/* ========================================================= */}
          {activeTab === 'checkout' && (
            <div className="space-y-4">
              {!activeStay ? (
                <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl">
                  <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="font-bold text-sm">Room {room.roomNumber} is not currently occupied</p>
                  <p className="text-xs">Check out is only available for active in-house stays.</p>
                </div>
              ) : checkoutSuccessInvoice ? (
                <div className="p-6 text-center bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-black text-emerald-950">
                    Check-Out Completed Successfully!
                  </h4>
                  <p className="text-xs text-emerald-800">
                    Room {room.roomNumber} has been vacated. Official invoice <strong>{checkoutSuccessInvoice}</strong> has been generated and room has been automatically marked <strong>DIRTY</strong> for Housekeeping turnover.
                  </p>
                  <div className="pt-2 flex items-center justify-center space-x-2">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {checkoutError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{checkoutError}</span>
                    </div>
                  )}

                  {/* Stay & Folio Summary */}
                  <div className="p-4 bg-slate-50 border border-gray-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                      <div>
                        <p className="text-xs text-gray-500">In-House Guest</p>
                        <p className="text-sm font-black text-slate-900">{activeStay.guestName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Stay Reference</p>
                        <p className="text-xs font-mono font-bold text-slate-700">{activeStay.stayNumber}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <p className="text-[10px] text-gray-500">Total Bill</p>
                        <p className="text-sm font-black text-slate-900">
                          ৳{(activeFolio?.grandTotal || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <p className="text-[10px] text-gray-500">Paid to Date</p>
                        <p className="text-sm font-black text-emerald-600">
                          ৳{(activeFolio?.paidTotal || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg border ${
                        (activeFolio?.balance || 0) > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
                      }`}>
                        <p className="text-[10px] text-gray-500">Balance Due</p>
                        <p className={`text-sm font-black ${
                          (activeFolio?.balance || 0) > 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}>
                          ৳{(activeFolio?.balance || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Settlement Payment Section if balance > 0 */}
                  {(activeFolio?.balance || 0) > 0 ? (
                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                          <DollarSign className="w-4 h-4 text-amber-600" />
                          <span>Settle Outstanding Balance at Check-Out</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCheckoutSettleAmount(Math.max(0, activeFolio.balance))}
                          className="text-[11px] text-amber-700 hover:text-amber-800 underline font-semibold"
                        >
                          Match Due (৳{activeFolio.balance.toLocaleString()})
                        </button>
                      </div>

                      <div>
                        <label className="font-semibold text-gray-700 block mb-1 text-xs">
                          Settlement Amount (৳):
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={checkoutSettleAmount}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '') {
                              setCheckoutSettleAmount('');
                            } else {
                              const parsed = parseFloat(val);
                              setCheckoutSettleAmount(isNaN(parsed) ? '' : parsed);
                            }
                          }}
                          placeholder="0"
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold font-mono"
                        />
                      </div>

                      <BDCardAndPaymentSelector
                        method={checkoutMethod}
                        onMethodChange={setCheckoutMethod}
                        amount={Number(checkoutSettleAmount) || 0}
                        reference={checkoutRef}
                        onReferenceChange={setCheckoutRef}
                        details={checkoutPaymentDetails}
                        onDetailsChange={setCheckoutPaymentDetails}
                        theme="light"
                      />
                    </div>
                  ) : (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Folio balance is ৳0. Room is cleared for Check-Out!</span>
                    </div>
                  )}

                  {/* Checkout Execution Button */}
                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteCheckout}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-md flex items-center space-x-1.5 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Confirm Check-Out & Generate Invoice</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: SERVICE BILL (Outlet & Service Charges)              */}
          {/* ========================================================= */}
          {activeTab === 'service-bill' && (
            !activeStay || !activeFolio ? (
              <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl">
                <Utensils className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-bold text-sm">No active folio to post service bills for Room {room.roomNumber}</p>
                <p className="text-xs">Posting restaurant, laundry, or extra service bills requires an in-house stay.</p>
              </div>
            ) : (
              <ServiceBillTab
                room={room}
                activeStay={activeStay}
                activeFolio={activeFolio}
                onShowToast={onShowToast}
              />
            )
          )}

          {/* ========================================================= */}
          {/* TAB: GUEST FOLIO DETAILS & ADJUSTMENTS                   */}
          {/* ========================================================= */}
          {activeTab === 'folio-details' && (
            !activeStay || !activeFolio ? (
              <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-bold text-sm">No active folio for Room {room.roomNumber}</p>
                <p className="text-xs">A guest folio is created upon check-in.</p>
              </div>
            ) : (
              <GuestFolioDetailsTab
                room={room}
                activeStay={activeStay}
                activeFolio={activeFolio}
                onShowToast={onShowToast}
                onSelectStay={onSelectStay}
                onNavigateToPayment={() => setActiveTab('payment')}
                onCloseModal={onClose}
              />
            )
          )}

          {/* ========================================================= */}
          {/* TAB: ROOM CHANGE & UPGRADE                                */}
          {/* ========================================================= */}
          {activeTab === 'room-change' && (
            !activeStay ? (
              <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl">
                <ArrowRightLeft className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-bold text-sm">Room {room.roomNumber} is not currently occupied.</p>
                <p className="text-xs">Room change and upgrade operations require an active in-house stay.</p>
              </div>
            ) : (
              <RoomChangeUpgradeTab
                room={room}
                activeStay={activeStay}
                activeFolio={activeFolio}
                db={db}
                onShowToast={onShowToast}
                onTransferSuccess={() => onClose()}
              />
            )
          )}

          {/* ========================================================= */}
          {/* TAB: BILL PREVIEW OF ALL BILLS                            */}
          {/* ========================================================= */}
          {activeTab === 'bill-preview' && (
            !activeStay || !activeFolio ? (
              <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl">
                <Printer className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-bold text-sm">No active bills to preview for Room {room.roomNumber}</p>
                <p className="text-xs">Bill preview requires an active in-house stay.</p>
              </div>
            ) : (
              <BillPreviewTab
                room={room}
                activeStay={activeStay}
                activeFolio={activeFolio}
                db={db}
                onShowToast={onShowToast}
              />
            )
          )}

          {/* ========================================================= */}
          {/* TAB: PAX IN / PAX OUT (OCCUPANCY & VISITORS)              */}
          {/* ========================================================= */}
          {activeTab === 'pax-control' && (
            !activeStay ? (
              <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-bold text-sm">Room {room.roomNumber} is not currently occupied.</p>
                <p className="text-xs">Pax movement tracking requires an active in-house stay.</p>
              </div>
            ) : (
              <PaxControlTab
                room={room}
                activeStay={activeStay}
                onShowToast={onShowToast}
              />
            )
          )}

          {/* ========================================================= */}
          {/* TAB: GUEST BILL PAYMENT                                   */}
          {/* ========================================================= */}
          {activeTab === 'payment' && (
            !activeStay || !activeFolio ? (
              <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl">
                <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-bold text-sm">No active folio to accept payment for Room {room.roomNumber}</p>
                <p className="text-xs">Guest payments require an active in-house stay and folio.</p>
              </div>
            ) : (
              <GuestBillPaymentTab
                room={room}
                activeStay={activeStay}
                activeFolio={activeFolio}
                onShowToast={onShowToast}
              />
            )
          )}

          {/* ========================================================= */}
          {/* TAB 5: HOUSEKEEPING DEPARTMENT ONLY                       */}
          {/* ========================================================= */}
          {activeTab === 'housekeeping' && (
            <div className="space-y-4">
              {/* Department Authorization Gate / Badge */}
              <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center space-x-1.5">
                      <span>Housekeeping Department Operations</span>
                      {housekeepingAuthorized ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                          Authorized Staff
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                          Department Restricted
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-purple-800">
                      Room turnover, sanitation checklists & cleanliness inspections
                    </p>
                  </div>
                </div>

                {/* Authorization Toggle for Housekeeping Staff */}
                <button
                  type="button"
                  onClick={() => setHousekeepingAuthorized(!housekeepingAuthorized)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center space-x-1 border transition-colors ${
                    housekeepingAuthorized
                      ? 'bg-purple-600 text-white border-purple-700'
                      : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-100'
                  }`}
                  title="Toggle Housekeeping Department access mode"
                >
                  {housekeepingAuthorized ? (
                    <>
                      <Unlock className="w-3 h-3" />
                      <span>Operating as Housekeeping</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>Authorize as Housekeeper</span>
                    </>
                  )}
                </button>
              </div>

              {!housekeepingAuthorized ? (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-3">
                  <Lock className="w-8 h-8 text-purple-500 mx-auto" />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">
                      Housekeeping Department Staff Only
                    </h4>
                    <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                      Room cleaning sign-offs, linen changes, and physical room inspection certifications are restricted to the Housekeeping Department.
                    </p>
                  </div>
                  <button
                    onClick={() => setHousekeepingAuthorized(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    Authorize as Housekeeper & Proceed
                  </button>
                </div>
              ) : (
                /* AUTHORIZED HOUSEKEEPING CONTROLS */
                <div className="space-y-4">
                  {/* Current HK State and Cleaner Assignment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <label className="font-bold text-gray-700 block mb-1">
                        Current Housekeeping Status:
                      </label>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                          room.housekeepingStatus === 'Clean'
                            ? 'bg-emerald-600 text-white'
                            : room.housekeepingStatus === 'Dirty'
                            ? 'bg-rose-600 text-white'
                            : room.housekeepingStatus === 'Cleaning'
                            ? 'bg-purple-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}>
                          {room.housekeepingStatus}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {room.operationalStatus === 'Occupied' ? 'Guest In-House' : 'Vacant'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <label className="font-bold text-gray-700 block mb-1">
                        Assigned Housekeeper / Room Attendant:
                      </label>
                      <select
                        value={assignedHousekeeper}
                        onChange={e => setAssignedHousekeeper(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold"
                      >
                        <option value="Rahima Begum">Rahima Begum (Senior Maid - Floor 1-3)</option>
                        <option value="Mohammad Karim">Mohammad Karim (Room Attendant - Floor 4-6)</option>
                        <option value="Sumon Mia">Sumon Mia (Floor Attendant - Floor 7-9)</option>
                        <option value="Nasrin Akter">Nasrin Akter (Executive Suite Housekeeper)</option>
                        <option value="Abdul Malek">Abdul Malek (Evening Turndown Service)</option>
                      </select>
                    </div>
                  </div>

                  {/* Turnover Checklist */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Room Turnover & Hygiene Checklist</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setChecklist({
                          bedLinenChanged: true,
                          bathroomSanitized: true,
                          towelsReplaced: true,
                          amenitiesRestocked: true,
                          floorCleaned: true,
                          minibarChecked: true
                        })}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        Check All
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklist.bedLinenChanged}
                          onChange={e => setChecklist({ ...checklist, bedLinenChanged: e.target.checked })}
                          className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                        />
                        <span className="font-semibold text-gray-800">Bed Linen Changed & Fresh Bedding</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklist.bathroomSanitized}
                          onChange={e => setChecklist({ ...checklist, bathroomSanitized: e.target.checked })}
                          className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                        />
                        <span className="font-semibold text-gray-800">Bathroom Sanitized & Disinfected</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklist.towelsReplaced}
                          onChange={e => setChecklist({ ...checklist, towelsReplaced: e.target.checked })}
                          className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                        />
                        <span className="font-semibold text-gray-800">Fresh Bath Towels & Mats Placed</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklist.amenitiesRestocked}
                          onChange={e => setChecklist({ ...checklist, amenitiesRestocked: e.target.checked })}
                          className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                        />
                        <span className="font-semibold text-gray-800">Toiletries & Amenities Restocked</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklist.floorCleaned}
                          onChange={e => setChecklist({ ...checklist, floorCleaned: e.target.checked })}
                          className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                        />
                        <span className="font-semibold text-gray-800">Floor Vacuumed / Mop Finished</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklist.minibarChecked}
                          onChange={e => setChecklist({ ...checklist, minibarChecked: e.target.checked })}
                          className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                        />
                        <span className="font-semibold text-gray-800">Minibar & Water Bottles Checked</span>
                      </label>
                    </div>
                  </div>

                  {/* Housekeeping Action Buttons */}
                  <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleReportMaintenance}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs rounded-lg flex items-center space-x-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-600" />
                      <span>Report Maintenance Defect</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleHousekeepingCompleteClean}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>Complete Turnover (Mark Clean)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleHousekeepingInspect}
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Supervisor Inspection Sign-Off</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-500 flex items-center space-x-2">
            <span>PMS Node: Online</span>
            <span>•</span>
            <span>Audited By: <strong className="text-gray-700">{currentUser.name}</strong> ({currentUser.roleName || currentUser.roleId})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold text-xs rounded-lg transition-colors"
          >
            Close Menu
          </button>
        </div>

      </div>

      {/* SEPARATED INDIVIDUAL BILLING MODAL (Pop-up dialog) */}
      {separatedAction && (
        <IndividualBillingModal
          isOpen={!!separatedAction}
          onClose={() => setSeparatedAction(null)}
          room={room}
          actionType={separatedAction}
          onChangeActionType={(newAction) => setSeparatedAction(newAction)}
          db={db}
          onShowToast={onShowToast}
          onSelectStay={onSelectStay}
        />
      )}
    </div>
  );
};
