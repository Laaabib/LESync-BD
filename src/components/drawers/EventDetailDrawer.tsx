import React, { useState, useEffect } from 'react';
import {
  X, PartyPopper, Calendar, Clock, Users, Building, Phone,
  CreditCard, Printer, FileText, CheckCircle2, AlertCircle, Plus,
  Edit3, Ban, RefreshCw, ShieldAlert, Sparkles, Mic, Utensils, Check,
  Mail, Tag, Trash2
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { EventBooking, PaymentMethod, EventBookingItem } from '../../types/pms';
import { BDCardAndPaymentSelector } from '../common/BDCardAndPaymentSelector';
import { PaymentTenderDetails } from '../../constants/paymentConfig';

interface EventDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onPrintContract?: (event: EventBooking) => void;
  onPrintBEO?: (event: EventBooking) => void;
  onSuccess?: () => void;
}

export const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({
  isOpen,
  onClose,
  eventId,
  onPrintContract,
  onPrintBEO,
  onSuccess
}) => {
  const [db, setDb] = useState(pmsService.getState());
  const event = db.eventBookings.find(e => e.id === eventId);

  // Active view tab inside drawer
  const [activeTab, setActiveTab] = useState<'overview' | 'edit-event' | 'edit-beo' | 'cancel-event'>('overview');

  // Payment Form State
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState(10000);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Bank Transfer');
  const [payRef, setPayRef] = useState('');
  const [payDetails, setPayDetails] = useState<Partial<PaymentTenderDetails>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Event Form State
  const [editEventName, setEditEventName] = useState('');
  const [editEventType, setEditEventType] = useState<EventBooking['eventType']>('Corporate');
  const [editHallId, setEditHallId] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('10:00');
  const [editEndTime, setEditEndTime] = useState('16:00');
  const [editGuestCount, setEditGuestCount] = useState(100);
  const [editClientName, setEditClientName] = useState('');
  const [editClientCompany, setEditClientCompany] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editPackageId, setEditPackageId] = useState('');
  const [editStatus, setEditStatus] = useState<EventBooking['status']>('Confirmed');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<EventBookingItem[]>([]);
  const [newItemType, setNewItemType] = useState<EventBookingItem['itemType']>('Stage Setup');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(5000);
  const [editError, setEditError] = useState('');

  // BEO Form State
  const [beoSetupStyle, setBeoSetupStyle] = useState<'Banquet' | 'Theatre' | 'Classroom' | 'U-Shape' | 'Boardroom' | 'Cocktail / Standing'>('Banquet');
  const [beoSupervisor, setBeoSupervisor] = useState('');
  const [beoSupervisorPhone, setBeoSupervisorPhone] = useState('');
  const [beoTableCount, setBeoTableCount] = useState(10);
  const [beoDietaryNotes, setBeoDietaryNotes] = useState('');
  const [beoKitchenNotes, setBeoKitchenNotes] = useState('');
  const [beoSpecialInstructions, setBeoSpecialInstructions] = useState('');
  const [beoAvRequirements, setBeoAvRequirements] = useState<string[]>([]);
  const [customAvItem, setCustomAvItem] = useState('');
  const [beoWelcomeTime, setBeoWelcomeTime] = useState('10:00 AM');
  const [beoMealTime, setBeoMealTime] = useState('01:30 PM');
  const [beoTeaTime, setBeoTeaTime] = useState('04:30 PM');

  // Cancel Event Form State
  const [cancelReasonPreset, setCancelReasonPreset] = useState('Client Requested Cancellation');
  const [cancelReasonCustom, setCancelReasonCustom] = useState('');
  const [depositHandling, setDepositHandling] = useState<'retained' | 'refunded' | 'transferred'>('retained');
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('Bank Transfer');

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  // Sync state whenever event or active tab changes
  useEffect(() => {
    if (event) {
      setEditEventName(event.eventName);
      setEditEventType(event.eventType);
      setEditHallId(event.hallId);
      setEditEventDate(event.eventDate);
      setEditStartTime(event.startTime);
      setEditEndTime(event.endTime);
      setEditGuestCount(event.guestCount);
      setEditClientName(event.clientName);
      setEditClientCompany(event.clientCompany || '');
      setEditClientPhone(event.clientPhone);
      const client = db.eventClients?.find(c => c.id === event.clientId);
      setEditClientEmail(client?.email || '');
      setEditPackageId(event.packageId || '');
      setEditStatus(event.status);
      setEditNotes(event.notes || '');
      setEditItems(event.items ? [...event.items] : []);

      // BEO sync
      setBeoSetupStyle(event.setupStyle || 'Banquet');
      setBeoSupervisor(event.floorSupervisor || 'Anisur Rahman (Banquet Manager)');
      setBeoSupervisorPhone(event.supervisorPhone || '+880 1713-388100');
      setBeoTableCount(event.tableCount || Math.ceil(event.guestCount / 10));
      setBeoDietaryNotes(event.dietaryRequirements || 'All halal catering. 15 vegetarian portions arranged.');
      setBeoKitchenNotes(event.kitchenNotes || 'Buffet warmers on 30 mins before serving. Fresh fruit platter replenishments.');
      setBeoSpecialInstructions(event.specialInstructions || 'VIP Table on elevated dais. Logo welcome slide on 4K LED Screen.');
      setBeoAvRequirements(event.avRequirements && event.avRequirements.length > 0 ? [...event.avRequirements] : [
        'PA Sound System & Digital Mixer',
        'Wireless Handheld & Collar Mics (x4)',
        '4K Laser Projector & Motorized Screen',
        'LED Stage Backdrop & Spotlights',
        'Dedicated Sound & Lighting Technician'
      ]);
      setBeoWelcomeTime(event.startTime || '10:00 AM');
      setBeoMealTime('01:30 PM');
      setBeoTeaTime(event.endTime ? `${event.endTime}` : '04:30 PM');

      // Cancel refund amount default
      setRefundAmount(event.deposit || 0);
    }
  }, [event?.id, event?.status, event?.total, activeTab]);

  if (!isOpen || !event) return null;

  const availableHalls = db.halls && db.halls.length > 0 ? db.halls : [];

  // Toggle AV item
  const toggleAvRequirement = (item: string) => {
    if (beoAvRequirements.includes(item)) {
      setBeoAvRequirements(beoAvRequirements.filter(i => i !== item));
    } else {
      setBeoAvRequirements([...beoAvRequirements, item]);
    }
  };

  const handleAddCustomAv = () => {
    if (!customAvItem.trim()) return;
    if (!beoAvRequirements.includes(customAvItem.trim())) {
      setBeoAvRequirements([...beoAvRequirements, customAvItem.trim()]);
    }
    setCustomAvItem('');
  };

  // Add line item to edit items list
  const handleAddEditItem = () => {
    if (!newItemDesc.trim()) return;
    const newItem: EventBookingItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemType: newItemType,
      description: newItemDesc.trim(),
      quantity: Number(newItemQty) || 1,
      unitPrice: Number(newItemPrice) || 0,
      total: (Number(newItemQty) || 1) * (Number(newItemPrice) || 0)
    };
    setEditItems([...editItems, newItem]);
    setNewItemDesc('');
    setNewItemQty(1);
    setNewItemPrice(5000);
  };

  const handleRemoveEditItem = (itemId: string) => {
    setEditItems(editItems.filter(it => it.id !== itemId));
  };

  // Handle Save Event Updates
  const handleSaveEditEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');

    try {
      const selectedHall = availableHalls.find(h => h.id === editHallId);
      const hallRate = selectedHall?.baseRatePerDay || 45000;
      const selectedPkg = db.packages?.find(p => p.id === editPackageId);
      const packageRate = selectedPkg ? Math.round((selectedPkg.price / 100) * 80) : 0;

      // Ensure at least Hall Rent is in items
      let finalItems = [...editItems];
      if (!finalItems.some(it => it.itemType === 'Hall Rent')) {
        finalItems.unshift({
          id: `item-hall-${Date.now()}`,
          itemType: 'Hall Rent',
          description: `${selectedHall?.name || 'Convention Hall'} Base Rental`,
          quantity: 1,
          unitPrice: hallRate,
          total: hallRate
        });
      } else {
        // Update hall rent name & rate if hall changed
        finalItems = finalItems.map(it => {
          if (it.itemType === 'Hall Rent') {
            return {
              ...it,
              description: `${selectedHall?.name || 'Convention Hall'} Base Rental`,
              unitPrice: hallRate,
              total: it.quantity * hallRate
            };
          }
          return it;
        });
      }

      // If package changed, update Food Package item
      if (editPackageId && selectedPkg) {
        const foodIdx = finalItems.findIndex(it => it.itemType === 'Food Package');
        const foodItem: EventBookingItem = {
          id: foodIdx >= 0 ? finalItems[foodIdx].id : `item-pkg-${Date.now()}`,
          itemType: 'Food Package',
          description: `${selectedPkg.name} (Pax: ${editGuestCount})`,
          quantity: editGuestCount,
          unitPrice: packageRate,
          total: editGuestCount * packageRate
        };
        if (foodIdx >= 0) {
          finalItems[foodIdx] = foodItem;
        } else {
          finalItems.push(foodItem);
        }
      }

      const res = pmsService.updateEventBooking(event.id, {
        eventName: editEventName,
        eventType: editEventType,
        hallId: editHallId,
        eventDate: editEventDate,
        startTime: editStartTime,
        endTime: editEndTime,
        guestCount: Number(editGuestCount),
        clientName: editClientName,
        clientCompany: editClientCompany,
        clientPhone: editClientPhone,
        clientEmail: editClientEmail,
        packageId: editPackageId,
        status: editStatus,
        notes: editNotes,
        items: finalItems
      });

      if (res.success) {
        setMessage({ type: 'success', text: `Event #${res.event.eventNumber} details updated successfully!` });
        setActiveTab('overview');
        onSuccess?.();
        setTimeout(() => setMessage(null), 3500);
      }
    } catch (err: any) {
      setEditError(err.message || 'Failed to update event booking.');
    }
  };

  // Handle Save BEO Function Sheet
  const handleSaveBeo = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = pmsService.updateEventFunctionSheet(event.id, {
        setupStyle: beoSetupStyle,
        floorSupervisor: beoSupervisor,
        supervisorPhone: beoSupervisorPhone,
        tableCount: Number(beoTableCount),
        dietaryRequirements: beoDietaryNotes,
        kitchenNotes: beoKitchenNotes,
        specialInstructions: beoSpecialInstructions,
        avRequirements: beoAvRequirements,
        timeline: [
          { time: beoWelcomeTime, activity: 'Welcome Drinks & Refreshments' },
          { time: beoMealTime, activity: 'Grand Banquet Buffet Meal Service' },
          { time: beoTeaTime, activity: 'Evening Tea, Coffee & Assorted Pastries' }
        ]
      });

      if (res.success) {
        setMessage({ type: 'success', text: `BEO Function Sheet for #${event.eventNumber} saved successfully!` });
        setActiveTab('overview');
        onSuccess?.();
        setTimeout(() => setMessage(null), 3500);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `Error updating BEO: ${err.message}` });
    }
  };

  // Handle Confirm Cancellation
  const handleConfirmCancel = () => {
    const finalReason = cancelReasonCustom.trim() || cancelReasonPreset;
    try {
      const res = pmsService.cancelEventBooking(event.id, {
        reason: finalReason,
        depositHandling: depositHandling,
        refundAmount: depositHandling === 'refunded' ? Number(refundAmount) : 0,
        refundMethod: refundMethod,
        notes: cancelReasonCustom
      });

      if (res.success) {
        setMessage({
          type: 'success',
          text: `Event #${event.eventNumber} cancelled. Hall venue released and schedule updated.`
        });
        setActiveTab('overview');
        onSuccess?.();
        setTimeout(() => setMessage(null), 3500);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `Error cancelling event: ${err.message}` });
    }
  };

  // Handle Reopen Event
  const handleReopenEvent = () => {
    try {
      const res = pmsService.reopenEventBooking(event.id);
      if (res.success) {
        setMessage({
          type: 'success',
          text: `Event #${event.eventNumber} reopened and status restored to Confirmed!`
        });
        setActiveTab('overview');
        onSuccess?.();
        setTimeout(() => setMessage(null), 3500);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `Cannot reopen event: ${err.message}` });
    }
  };

  // Record Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;

    try {
      pmsService.recordEventPayment(event.id, {
        amount: payAmount,
        method: payMethod,
        reference: payRef || 'Event Advance Payment',
        ...payDetails
      });
      setShowPaymentForm(false);
      setMessage({ type: 'success', text: `Received payment of ৳${(payAmount || 0).toLocaleString()} for event booking.` });
      onSuccess?.();
      setTimeout(() => setMessage(null), 3500);
    } catch (err: any) {
      setMessage({ type: 'error', text: `Payment error: ${err.message}` });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-150">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full flex flex-col shadow-2xl text-xs text-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${
              event.status === 'Cancelled' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
            }`}>
              {event.status === 'Cancelled' ? <Ban className="w-5 h-5" /> : <PartyPopper className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-100">{event.eventName}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                  event.status === 'Confirmed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  event.status === 'Ongoing' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse' :
                  event.status === 'Completed' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                  event.status === 'Cancelled' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {event.status}
                </span>
              </div>
              <p className="text-[11px] font-mono text-purple-300">
                {event.eventNumber} • {event.hallName} ({event.eventDate})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selector Bar */}
        <div className="bg-slate-950/80 px-4 pt-2 border-b border-slate-800 flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 rounded-t-lg font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-purple-300 border-t-2 border-purple-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PartyPopper className="w-3.5 h-3.5" />
            <span>Overview & Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('edit-event')}
            className={`px-3 py-2 rounded-t-lg font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'edit-event'
                ? 'bg-slate-800 text-indigo-300 border-t-2 border-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Event</span>
          </button>

          <button
            onClick={() => setActiveTab('edit-beo')}
            className={`px-3 py-2 rounded-t-lg font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'edit-beo'
                ? 'bg-slate-800 text-amber-300 border-t-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Edit BEO (Function Sheet)</span>
          </button>

          {event.status !== 'Cancelled' ? (
            <button
              onClick={() => setActiveTab('cancel-event')}
              className={`px-3 py-2 rounded-t-lg font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === 'cancel-event'
                  ? 'bg-slate-800 text-rose-300 border-t-2 border-rose-400'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              <Ban className="w-3.5 h-3.5 text-rose-400" />
              <span>Cancel Event</span>
            </button>
          ) : (
            <button
              onClick={handleReopenEvent}
              className="px-3 py-2 rounded-t-lg font-bold text-xs flex items-center space-x-1.5 text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reopen Event</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {message && (
            <div className={`p-3 rounded-lg flex items-center space-x-2 text-xs font-semibold ${
              message.type === 'success' ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300' : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Event Overview Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Client / Host</span>
                    <p className="font-bold text-slate-100 mt-0.5">{event.clientName}</p>
                    {event.clientCompany && <p className="text-purple-300">{event.clientCompany}</p>}
                    <p className="text-slate-400 font-mono flex items-center space-x-1 mt-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{event.clientPhone}</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Hall Venue & Schedule</span>
                    <p className="font-bold text-purple-400 mt-0.5">{event.hallName}</p>
                    <p className="text-slate-300 flex items-center space-x-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{event.eventDate}</span>
                    </p>
                    <p className="text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{event.startTime} - {event.endTime}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap justify-between items-center gap-2 text-xs">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Guaranteed Attendance: <strong className="text-slate-200">{event.guestCount} Pax</strong></span>
                  </span>
                  <div className="flex items-center space-x-2">
                    {event.packageName && (
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold text-[11px]">
                        {event.packageName}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[11px]">
                      Setup: {event.setupStyle || 'Banquet'}
                    </span>
                  </div>
                </div>

                {event.notes && (
                  <div className="p-2.5 bg-slate-900 rounded-lg text-slate-300 text-[11px] border border-slate-800">
                    <span className="text-slate-500 font-bold block uppercase text-[9px]">Event Notes:</span>
                    {event.notes}
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setActiveTab('edit-event')}
                  className="p-2.5 bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/40 rounded-xl font-bold text-indigo-300 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Event</span>
                </button>

                <button
                  onClick={() => setActiveTab('edit-beo')}
                  className="p-2.5 bg-amber-950/60 hover:bg-amber-900 border border-amber-700/40 rounded-xl font-bold text-amber-300 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Edit BEO</span>
                </button>

                <button
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                  className="p-2.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/40 rounded-xl font-bold text-emerald-300 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Add Payment</span>
                </button>

                {event.status !== 'Cancelled' ? (
                  <button
                    onClick={() => setActiveTab('cancel-event')}
                    className="p-2.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-700/40 rounded-xl font-bold text-rose-300 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                ) : (
                  <button
                    onClick={handleReopenEvent}
                    className="p-2.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/40 rounded-xl font-bold text-emerald-300 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reopen</span>
                  </button>
                )}
              </div>

              {/* Payment Form Sub-Drawer */}
              {showPaymentForm && (
                <form onSubmit={handleRecordPayment} className="bg-slate-950 p-4 rounded-xl border border-emerald-500/40 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-400 text-xs">Record Event Payment / Installment</span>
                    <button type="button" onClick={() => setShowPaymentForm(false)} className="text-slate-500 hover:text-slate-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Amount (৳ BDT):</span>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono font-bold"
                    />
                  </div>

                  <BDCardAndPaymentSelector
                    method={payMethod}
                    onMethodChange={setPayMethod}
                    amount={payAmount}
                    reference={payRef}
                    onReferenceChange={setPayRef}
                    details={payDetails}
                    onDetailsChange={setPayDetails}
                    theme="dark"
                  />

                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs cursor-pointer shadow-sm"
                    >
                      Confirm Payment
                    </button>
                  </div>
                </form>
              )}

              {/* Itemized Breakdown Table */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Banquet Itemized Bill</span>
                  <button
                    onClick={() => setActiveTab('edit-event')}
                    className="flex items-center space-x-1 text-indigo-400 hover:underline text-[11px] font-semibold cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Line Items</span>
                  </button>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Service / Component</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {event.items.map(it => (
                      <tr key={it.id}>
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-slate-200 block font-sans">{it.description}</span>
                          <span className="text-[10px] text-slate-500 font-sans">{it.itemType}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-400">{it.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">৳{(it.unitPrice || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-200">৳{(it.total || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Financial Ledger */}
                <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Hall Rent & Services Subtotal:</span>
                    <span className="font-mono">৳{(event.subtotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Service Charge (10%):</span>
                    <span className="font-mono">৳{(event.serviceCharge || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>VAT / Tax (15%):</span>
                    <span className="font-mono">৳{(event.tax || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1 text-xs">
                    <span>Grand Total:</span>
                    <span className="font-mono text-purple-300">৳{(event.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Advance Deposit Paid:</span>
                    <span className="font-mono">৳{(event.deposit || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span>Payable Balance:</span>
                    <span className={`font-mono ${event.balance <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ৳{(event.balance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EDIT EVENT */}
          {activeTab === 'edit-event' && (
            <form onSubmit={handleSaveEditEvent} className="space-y-4">
              <div className="bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-indigo-300 text-sm">Edit Banquet Event Details</h4>
                  <p className="text-[11px] text-indigo-400">Update event schedule, venue, headcount, pricing and line items</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-3 py-1 bg-slate-800 text-slate-300 rounded font-medium text-xs hover:bg-slate-700"
                >
                  Back
                </button>
              </div>

              {editError && (
                <div className="p-3 bg-rose-950 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Event Name / Occasion *</label>
                  <input
                    type="text"
                    required
                    value={editEventName}
                    onChange={(e) => setEditEventName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Event Type *</label>
                  <select
                    value={editEventType}
                    onChange={(e) => setEditEventType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs"
                  >
                    <option value="Corporate">Corporate Event</option>
                    <option value="Wedding">Wedding Reception</option>
                    <option value="Conference">Annual Conference</option>
                    <option value="Banquet">Dinner Banquet</option>
                    <option value="Exhibition">Trade Exhibition</option>
                    <option value="Annual General Meeting (AGM)">AGM Meeting</option>
                    <option value="Seminar">Executive Seminar</option>
                    <option value="Birthday / Social">Birthday / Social</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Convention Venue Hall *</label>
                  <select
                    value={editHallId}
                    onChange={(e) => setEditHallId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs"
                  >
                    {availableHalls.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name} (Cap: {h.capacity} Pax • ৳{(h.baseRatePerDay || 0).toLocaleString()}/day)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Status *</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs font-bold"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Tentative">Tentative</option>
                    <option value="Ongoing">Ongoing (In Progress)</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={editEventDate}
                    onChange={(e) => setEditEventDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Guaranteed Pax *</label>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    required
                    value={editGuestCount}
                    onChange={(e) => setEditGuestCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Catering Package</label>
                  <select
                    value={editPackageId}
                    onChange={(e) => setEditPackageId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs"
                  >
                    <option value="">Custom Venue Rental Only (No Food Package)</option>
                    {(db.packages || []).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (৳{p.price.toLocaleString()}/person)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line Items Management */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Itemized Services & Add-Ons</span>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-xs">
                      <div>
                        <span className="font-semibold text-slate-200 block">{item.description}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.itemType} • {item.quantity} x ৳{(item.unitPrice || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-purple-300">৳{(item.total || 0).toLocaleString()}</span>
                        {item.itemType !== 'Hall Rent' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEditItem(item.id)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Item Row */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                  >
                    <option value="Stage Setup">Stage Setup</option>
                    <option value="Decoration">Floral & Theme Decoration</option>
                    <option value="Sound & AV">Sound & AV Package</option>
                    <option value="Projector">Projector & LED Screen</option>
                    <option value="Extra Service">Extra Hospitality Service</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Description / item note..."
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                  />

                  <div className="flex space-x-1">
                    <input
                      type="number"
                      placeholder="Qty"
                      min={1}
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Rate ৳"
                      min={0}
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddEditItem}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs transition-colors flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Client Contact Info */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Host & Organization Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Contact Person *</label>
                    <input
                      type="text"
                      required
                      value={editClientName}
                      onChange={(e) => setEditClientName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Company / Delegation</label>
                    <input
                      type="text"
                      value={editClientCompany}
                      onChange={(e) => setEditClientCompany(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={editClientPhone}
                      onChange={(e) => setEditClientPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Email Address</label>
                    <input
                      type="email"
                      value={editClientEmail}
                      onChange={(e) => setEditClientEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Operational Remarks / Special Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Special client requirements, catering guidelines..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow-sm transition-colors"
                >
                  Save Event Changes
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: EDIT BEO (FUNCTION SHEET) */}
          {activeTab === 'edit-beo' && (
            <form onSubmit={handleSaveBeo} className="space-y-4">
              <div className="bg-purple-950/30 p-3.5 rounded-xl border border-purple-500/30 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-purple-300 text-sm">Banquet Event Order (BEO) Specifications</h4>
                  <p className="text-[11px] text-purple-400">Configure room layout, supervisor contacts, A/V gear, food schedule & VIP instructions</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-3 py-1 bg-slate-800 text-slate-300 rounded font-medium text-xs hover:bg-slate-700"
                >
                  Back
                </button>
              </div>

              {/* Hall Setup & Seating Architecture */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block flex items-center space-x-1.5">
                  <Building className="w-3.5 h-3.5" />
                  <span>Hall Setup & Seating Architecture</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Seating Style *</label>
                    <select
                      value={beoSetupStyle}
                      onChange={(e) => setBeoSetupStyle(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-medium"
                    >
                      <option value="Banquet">Round Banquet Tables (8-10 Pax/Table)</option>
                      <option value="Theatre">Theatre Style (Facing Stage)</option>
                      <option value="Classroom">Classroom Style (Desks & Chairs)</option>
                      <option value="U-Shape">U-Shape Executive Conference</option>
                      <option value="Boardroom">Central Hollow Boardroom</option>
                      <option value="Cocktail / Standing">High-Top Standing Cocktail Lounge</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Table Count</label>
                    <input
                      type="number"
                      min={1}
                      value={beoTableCount}
                      onChange={(e) => setBeoTableCount(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Dietary Requirements</label>
                    <input
                      type="text"
                      value={beoDietaryNotes}
                      onChange={(e) => setBeoDietaryNotes(e.target.value)}
                      placeholder="e.g. 15 Vegetarian, Halal certified"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Banquet Captain / Supervisor Name</label>
                    <input
                      type="text"
                      value={beoSupervisor}
                      onChange={(e) => setBeoSupervisor(e.target.value)}
                      placeholder="e.g. Anisur Rahman (Banquet Manager)"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Supervisor Phone</label>
                    <input
                      type="text"
                      value={beoSupervisorPhone}
                      onChange={(e) => setBeoSupervisorPhone(e.target.value)}
                      placeholder="+880 1713-388100"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Audio/Visual & Stage Production */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block flex items-center space-x-1.5">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Audio/Visual & Stage Production Equipment</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'PA Sound System & Digital Mixer',
                    'Wireless Handheld & Collar Mics (x4)',
                    '4K Laser Projector & Motorized Screen',
                    'LED Stage Backdrop & Spotlights',
                    'Podium with CCULB Resort Logo',
                    'Dedicated Sound & Lighting Technician',
                    'High-Definition Stage Recording',
                    'Follow-spotlighting for Dais'
                  ].map((item, idx) => {
                    const isChecked = beoAvRequirements.includes(item);
                    return (
                      <label
                        key={idx}
                        className={`flex items-center space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-purple-950/60 border-purple-500/50 text-purple-200 font-semibold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAvRequirement(item)}
                          className="rounded text-purple-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>{item}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Custom AV item */}
                <div className="flex space-x-2 pt-2 border-t border-slate-800/80">
                  <input
                    type="text"
                    placeholder="Add custom AV equipment or requirement..."
                    value={customAvItem}
                    onChange={(e) => setCustomAvItem(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAv}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 font-semibold rounded text-xs border border-slate-700 cursor-pointer"
                  >
                    + Add AV
                  </button>
                </div>
              </div>

              {/* Service Timeline & Kitchen Instructions */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block flex items-center space-x-1.5">
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Meal & Refreshment Service Timeline</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Welcome Refreshments</label>
                    <input
                      type="text"
                      value={beoWelcomeTime}
                      onChange={(e) => setBeoWelcomeTime(e.target.value)}
                      placeholder="10:00 AM"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Grand Buffet Meal</label>
                    <input
                      type="text"
                      value={beoMealTime}
                      onChange={(e) => setBeoMealTime(e.target.value)}
                      placeholder="01:30 PM"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Evening Tea & Cookies</label>
                    <input
                      type="text"
                      value={beoTeaTime}
                      onChange={(e) => setBeoTeaTime(e.target.value)}
                      placeholder="04:30 PM"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Kitchen & Warmers Instructions</label>
                  <textarea
                    rows={2}
                    value={beoKitchenNotes}
                    onChange={(e) => setBeoKitchenNotes(e.target.value)}
                    placeholder="Warming instructions, replenishment schedule, live counter guidelines..."
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">VIP Dais & Special Production Notes</label>
                  <textarea
                    rows={2}
                    value={beoSpecialInstructions}
                    onChange={(e) => setBeoSpecialInstructions(e.target.value)}
                    placeholder="Elevated dais, customized LED banner slide, chief guest protocols..."
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs shadow-sm transition-colors"
                >
                  Save BEO Function Sheet
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: CANCEL EVENT */}
          {activeTab === 'cancel-event' && (
            <div className="space-y-4">
              <div className="bg-rose-950/40 p-4 rounded-xl border border-rose-500/40 space-y-2">
                <div className="flex items-center space-x-2">
                  <Ban className="w-5 h-5 text-rose-400" />
                  <h4 className="font-bold text-rose-300 text-sm">Cancel Banquet Event #{event.eventNumber}</h4>
                </div>
                <p className="text-xs text-rose-200">
                  Cancelling this event will immediately liberate <strong>{event.hallName}</strong> for other bookings on <strong>{event.eventDate}</strong> ({event.startTime} - {event.endTime}).
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                <div className="font-bold text-slate-200">{event.eventName}</div>
                <div className="grid grid-cols-2 gap-2 text-slate-400">
                  <div>Venue: <strong className="text-slate-200">{event.hallName}</strong></div>
                  <div>Scheduled: <strong className="text-slate-200">{event.eventDate}</strong></div>
                  <div>Host: <strong className="text-slate-200">{event.clientName}</strong></div>
                  <div>Total Billed: <strong className="font-mono text-purple-300">৳{(event.total || 0).toLocaleString()}</strong></div>
                  <div className="col-span-2">
                    Advance Deposit Held: <strong className="font-mono text-emerald-400">৳{(event.deposit || 0).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Cancellation Reason Preset *</label>
                  <select
                    value={cancelReasonPreset}
                    onChange={(e) => setCancelReasonPreset(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-medium"
                  >
                    <option value="Client Requested Cancellation">Client Requested Cancellation</option>
                    <option value="Rescheduled / Postponed to Future Date">Rescheduled / Postponed to Future Date</option>
                    <option value="Non-payment of Advance Deposit">Non-payment of Advance Deposit</option>
                    <option value="Inclement Weather / Force Majeure">Inclement Weather / Force Majeure</option>
                    <option value="Client Internal Operational Changes">Client Internal Operational Changes</option>
                    <option value="Duplicate Booking Entry">Duplicate Booking Entry</option>
                    <option value="Other Commercial Reasons">Other Commercial Reasons</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Custom Notes / Explanation</label>
                  <input
                    type="text"
                    placeholder="Enter any additional context or client communication notes..."
                    value={cancelReasonCustom}
                    onChange={(e) => setCancelReasonCustom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                {event.deposit > 0 && (
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                      Advance Deposit Handling Policy
                    </span>

                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="depositAction"
                          checked={depositHandling === 'retained'}
                          onChange={() => setDepositHandling('retained')}
                          className="text-purple-600 focus:ring-0"
                        />
                        <span>Retain 100% Deposit as Cancellation Penalty (Non-refundable)</span>
                      </label>

                      <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="depositAction"
                          checked={depositHandling === 'refunded'}
                          onChange={() => setDepositHandling('refunded')}
                          className="text-purple-600 focus:ring-0"
                        />
                        <span>Issue Refund to Client</span>
                      </label>

                      <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="depositAction"
                          checked={depositHandling === 'transferred'}
                          onChange={() => setDepositHandling('transferred')}
                          className="text-purple-600 focus:ring-0"
                        />
                        <span>Transfer to Client Account as Advance Credit</span>
                      </label>
                    </div>

                    {depositHandling === 'refunded' && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Refund Amount (৳)</label>
                          <input
                            type="number"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(Number(e.target.value))}
                            max={event.deposit}
                            min={0}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Refund Method</label>
                          <select
                            value={refundMethod}
                            onChange={(e) => setRefundMethod(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 text-xs"
                          >
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cash">Cash</option>
                            <option value="bKash">bKash</option>
                            <option value="Nagad">Nagad</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs"
                >
                  Keep Event
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs shadow-sm transition-colors"
                >
                  Confirm Event Cancellation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPrintContract?.(event)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-xs transition-colors shadow"
              title="Print official banquet contract"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Contract</span>
            </button>

            <button
              onClick={() => {
                if (onPrintBEO) {
                  onPrintBEO(event);
                } else {
                  window.print();
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold rounded text-xs transition-colors border border-slate-700"
              title="Print Banquet Event Order (BEO) function sheet"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Print BEO Sheet</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
