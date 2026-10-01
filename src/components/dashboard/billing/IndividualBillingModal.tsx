import React, { useState, useEffect } from 'react';
import {
  X, CreditCard, Utensils, FileText, ArrowRightLeft, Printer,
  Users, ChevronDown, BedDouble, Sparkles, ExternalLink, ArrowRight,
  ShieldCheck, AlertCircle, CheckCircle2, DollarSign
} from 'lucide-react';
import { Room, Stay, Folio } from '../../../types/pms';
import { PmsDatabaseState } from '../../../services/mockPmsDatabase';
import { GuestBillPaymentTab } from './GuestBillPaymentTab';
import { ServiceBillTab } from './ServiceBillTab';
import { GuestFolioDetailsTab } from './GuestFolioDetailsTab';
import { RoomChangeUpgradeTab } from './RoomChangeUpgradeTab';
import { BillPreviewTab } from './BillPreviewTab';
import { PaxControlTab } from './PaxControlTab';

export type IndividualBillingActionType =
  | 'payment'
  | 'service-bill'
  | 'folio-details'
  | 'room-change'
  | 'bill-preview'
  | 'pax-control';

interface IndividualBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  actionType: IndividualBillingActionType;
  onChangeActionType?: (action: IndividualBillingActionType) => void;
  db: PmsDatabaseState;
  onShowToast: (msg: string) => void;
  onOpenRoomStatusModal?: () => void;
  onSelectStay?: (stayId: string) => void;
}

interface ActionMeta {
  id: IndividualBillingActionType;
  label: string;
  badge: string;
  description: string;
  icon: React.ElementType;
  themeColor: string;
  themeBg: string;
  themeBorder: string;
}

const ACTION_METAS: ActionMeta[] = [
  {
    id: 'payment',
    label: 'Guest Bill Payment',
    badge: 'Settlement & Receipts',
    description: 'Collect room folio settlements, cash, card, MFS & money receipts',
    icon: CreditCard,
    themeColor: 'text-emerald-700',
    themeBg: 'bg-emerald-50',
    themeBorder: 'border-emerald-300'
  },
  {
    id: 'service-bill',
    label: 'Service Bill (POS / Outlets)',
    badge: 'Add Charges',
    description: 'Post F&B dining, room service, laundry, minibar & extra amenities',
    icon: Utensils,
    themeColor: 'text-blue-700',
    themeBg: 'bg-blue-50',
    themeBorder: 'border-blue-300'
  },
  {
    id: 'folio-details',
    label: 'Details of Guest Folio',
    badge: 'Master Ledger',
    description: 'View full audit transactions, tax breakdown, adjustments & voiding',
    icon: FileText,
    themeColor: 'text-indigo-700',
    themeBg: 'bg-indigo-50',
    themeBorder: 'border-indigo-300'
  },
  {
    id: 'room-change',
    label: 'Room Change & Upgrade',
    badge: 'Room Transfer',
    description: 'Transfer guest to different room, category upgrade & rate adjustment',
    icon: ArrowRightLeft,
    themeColor: 'text-purple-700',
    themeBg: 'bg-purple-50',
    themeBorder: 'border-purple-300'
  },
  {
    id: 'bill-preview',
    label: 'Bill Preview of All Bills',
    badge: 'Consolidated Statement',
    description: 'Consolidated statement of all department charges & formal print',
    icon: Printer,
    themeColor: 'text-slate-800',
    themeBg: 'bg-slate-100',
    themeBorder: 'border-slate-300'
  },
  {
    id: 'pax-control',
    label: 'Pax In / Pax Out Control',
    badge: 'Headcount & RFID Keys',
    description: 'Register arriving/departing companions, RFID key cards & extra beds',
    icon: Users,
    themeColor: 'text-amber-800',
    themeBg: 'bg-amber-50',
    themeBorder: 'border-amber-300'
  }
];

export const IndividualBillingModal: React.FC<IndividualBillingModalProps> = ({
  isOpen,
  onClose,
  room,
  actionType: initialActionType,
  onChangeActionType,
  db,
  onShowToast,
  onOpenRoomStatusModal,
  onSelectStay
}) => {
  const [currentAction, setCurrentAction] = useState<IndividualBillingActionType>(initialActionType);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    setCurrentAction(initialActionType);
  }, [initialActionType]);

  const setAction = (act: IndividualBillingActionType) => {
    setCurrentAction(act);
    setIsMenuOpen(false);
    if (onChangeActionType) {
      onChangeActionType(act);
    }
  };

  // Resolve active stay and folio
  const activeStay: Stay | undefined = (db.stays || []).find(
    s => s.status === 'Active' && (s.roomNumber === room.roomNumber || s.roomId === room.id)
  );

  const activeFolio: Folio | undefined = activeStay
    ? (db.folios || []).find(f => f.id === activeStay.folioId || f.stayId === activeStay.id)
    : undefined;

  const currentMeta = ACTION_METAS.find(m => m.id === currentAction) || ACTION_METAS[0];
  const IconComponent = currentMeta.icon;

  if (!isOpen) return null;

  return (
    <div
      id="individual-billing-modal-backdrop"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id={`individual-billing-modal-${currentAction}`}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border-2 border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* ========================================================================= */}
        {/* MODAL HEADER: DEDICATED INDIVIDUAL ACTION & POP-UP MENU                   */}
        {/* ========================================================================= */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl ${currentMeta.themeBg} ${currentMeta.themeColor} flex items-center justify-center font-black shadow-inner shrink-0`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[11px] font-black tracking-wide">
                  Room {room.roomNumber}
                </span>
                <span className="text-slate-300 text-xs font-medium">
                  {room.roomTypeName || (room as any).roomCategoryName}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px] font-bold border border-slate-700">
                  Separated Pop-up Modal
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5 tracking-tight flex items-center space-x-2">
                <span>{currentMeta.label}</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {currentMeta.description}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* INDIVIDUAL POP-UP MENU DROPDOWN TRIGGER */}
            <div className="relative">
              <button
                type="button"
                id="individual-popup-menu-trigger"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center space-x-1.5 shadow-xs transition-colors border border-blue-400"
              >
                <span>⚡ Pop-Up Menu: Switch Action</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* FLOATING INDIVIDUAL POP-UP MENU */}
              {isMenuOpen && (
                <div
                  id="individual-popup-menu-dropdown"
                  className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-2xl border-2 border-blue-500 p-2 z-50 text-slate-900 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-2 py-1 border-b border-gray-200 mb-1.5">
                    <p className="text-[10px] font-black uppercase text-blue-900 tracking-wider">
                      Individual Pop-Up Menu
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Open separated dialog for Room {room.roomNumber}
                    </p>
                  </div>

                  <div className="space-y-1">
                    {ACTION_METAS.map((meta) => {
                      const ItemIcon = meta.icon;
                      const isCurrent = meta.id === currentAction;
                      return (
                        <button
                          key={meta.id}
                          type="button"
                          onClick={() => setAction(meta.id)}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-bold flex items-center space-x-2.5 transition-all ${
                            isCurrent
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <ItemIcon className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-white' : meta.themeColor}`} />
                          <div className="truncate">
                            <span className="block truncate leading-tight">{meta.label}</span>
                            <span className={`text-[10px] block truncate ${isCurrent ? 'text-blue-100' : 'text-gray-400'}`}>
                              {meta.badge}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {onOpenRoomStatusModal && (
                    <div className="pt-2 mt-1.5 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onClose();
                          onOpenRoomStatusModal();
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                      >
                        <BedDouble className="w-4 h-4 text-slate-500" />
                        <span>Room Status & Housekeeping Modal</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              id="individual-billing-modal-close-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close separated modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* GUEST BANNER STRIP */}
        {activeStay && activeFolio ? (
          <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-black rounded uppercase">
                Active Resident
              </span>
              <span className="font-bold text-slate-900">{activeStay.guestName}</span>
              <span className="text-slate-500 font-mono text-[11px]">Stay: {activeStay.stayNumber}</span>
              <span className="text-slate-500 font-mono text-[11px]">Folio: {activeFolio.folioNumber}</span>
            </div>
            <div className="flex items-center space-x-3 font-mono">
              <span>Total Charges: <strong className="text-slate-800">৳{(activeFolio.grandTotal || 0).toLocaleString()}</strong></span>
              <span>Paid: <strong className="text-emerald-700">৳{(activeFolio.paidTotal || 0).toLocaleString()}</strong></span>
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200">
                Balance Due: ৳{Math.max(0, activeFolio.balance || 0).toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center justify-between">
            <span className="font-bold">Notice: No active in-house stay currently registered on Room {room.roomNumber}.</span>
            <span className="text-[11px] text-amber-700">Select another action or room to proceed.</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL BODY: RENDER INDIVIDUAL SEPARATED TAB CONTENT                       */}
        {/* ========================================================================= */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeStay && activeFolio ? (
            <>
              {currentAction === 'payment' && (
                <GuestBillPaymentTab
                  room={room}
                  activeStay={activeStay}
                  activeFolio={activeFolio}
                  onShowToast={onShowToast}
                  onPaymentSuccess={() => {
                    onShowToast(`Settlement recorded for Room ${room.roomNumber}`);
                  }}
                />
              )}

              {currentAction === 'service-bill' && (
                <ServiceBillTab
                  room={room}
                  activeStay={activeStay}
                  activeFolio={activeFolio}
                  onShowToast={onShowToast}
                  onBillAdded={() => {
                    onShowToast(`Service charge billed to Room ${room.roomNumber} folio`);
                  }}
                />
              )}

              {currentAction === 'folio-details' && (
                <GuestFolioDetailsTab
                  room={room}
                  activeStay={activeStay}
                  activeFolio={activeFolio}
                  onShowToast={onShowToast}
                  onSelectStay={() => {}}
                  onNavigateToPayment={() => setCurrentAction('payment')}
                  onCloseModal={onClose}
                />
              )}

              {currentAction === 'room-change' && (
                <RoomChangeUpgradeTab
                  room={room}
                  activeStay={activeStay}
                  activeFolio={activeFolio}
                  db={db}
                  onShowToast={onShowToast}
                  onTransferSuccess={(newRoom) => {
                    onShowToast(`Guest shifted successfully to Room ${newRoom.roomNumber}`);
                    onClose();
                  }}
                />
              )}

              {currentAction === 'bill-preview' && (
                <BillPreviewTab
                  room={room}
                  activeStay={activeStay}
                  activeFolio={activeFolio}
                  db={db}
                  onShowToast={onShowToast}
                />
              )}

              {currentAction === 'pax-control' && (
                <PaxControlTab
                  room={room}
                  activeStay={activeStay}
                  onShowToast={onShowToast}
                  onPaxUpdated={() => {
                    onShowToast(`Pax headcount updated for Room ${room.roomNumber}`);
                  }}
                />
              )}
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">
                No In-House Resident Found
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Front desk billing, POS posting, folio adjustments and pax headcount actions require an active in-house stay on Room {room.roomNumber}.
              </p>
              {onOpenRoomStatusModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRoomStatusModal();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs inline-flex items-center space-x-1.5"
                >
                  <BedDouble className="w-4 h-4" />
                  <span>Open Room Overview & Walk-In</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER: QUICK SEPARATED ACTION PILLS                                */}
        {/* ========================================================================= */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-1 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Audited Front Office Billing Module • Certified Real-time Ledger</span>
          </div>

          {/* Quick Switcher Buttons */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {ACTION_METAS.map((m) => {
              const isCurr = m.id === currentAction;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAction(m.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    isCurr
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {m.label.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
