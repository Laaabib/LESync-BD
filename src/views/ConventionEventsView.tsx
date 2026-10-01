import React, { useState, useEffect } from 'react';
import {
  PartyPopper, PlusCircle, Search, Calendar, Users, Building,
  Download, Printer, CreditCard, CheckCircle2, Clock,
  FileText, DollarSign, ArrowRight, Check, X, ShieldAlert,
  Sliders, Utensils, Mic, Sparkles, Layers, RefreshCw,
  Edit3, Ban, AlertTriangle, Tag, CalendarClock
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { pdfExportService } from '../services/pdfExportService';
import { PmsDatabaseState, SEED_HALLS } from '../services/mockPmsDatabase';
import { EventBooking, Payment } from '../types/pms';

interface ConventionEventsViewProps {
  initialTab?: 'events' | 'function-sheets' | 'billing' | 'deposits' | 'packages' | 'halls';
  onSelectEvent?: (eventId: string) => void;
  onPrintContract?: (event: EventBooking) => void;
  onPrintBEO?: (event: EventBooking) => void;
  onPrintReport?: (reportData: any) => void;
  onNavigate?: (route: string) => void;
}

export const ConventionEventsView: React.FC<ConventionEventsViewProps> = ({
  initialTab = 'events',
  onSelectEvent,
  onPrintContract,
  onPrintBEO,
  onPrintReport,
  onNavigate
}) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [activeTab, setActiveTab] = useState<'events' | 'function-sheets' | 'billing' | 'deposits'>(
    (initialTab === 'function-sheets' || initialTab === 'billing' || initialTab === 'deposits')
      ? initialTab
      : 'events'
  );

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedEventId, setSelectedEventId] = useState<string>(db.eventBookings[0]?.id || '');

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Available Halls with fallback to seed data
  const availableHalls = (db.halls && db.halls.length > 0) ? db.halls : (pmsService.getState().halls || SEED_HALLS);

  // New Event Form State
  const [hallId, setHallId] = useState(availableHalls[0]?.id || '');
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState<EventBooking['eventType']>('Corporate');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('16:00');
  const [guestCount, setGuestCount] = useState(150);
  const [packageId, setPackageId] = useState<string>('');
  const [deposit, setDeposit] = useState(30000);
  const [paymentMethod, setPaymentMethod] = useState<Payment['method']>('Bank Transfer');
  const [conflictError, setConflictError] = useState('');

  // Deposit Form State
  const [depAmount, setDepAmount] = useState(20000);
  const [depMethod, setDepMethod] = useState<Payment['method']>('Bank Transfer');
  const [depRef, setDepRef] = useState('');
  const [depNotes, setDepNotes] = useState('');

  // Settle Bill Form State
  const [settleMethod, setSettleMethod] = useState<Payment['method'] | 'City Ledger'>('Bank Transfer');
  const [settleClAccountId, setSettleClAccountId] = useState(db.cityLedgerAccounts?.[0]?.id || '');
  const [settleRef, setSettleRef] = useState('');

  // Function Sheet (BEO) Edit State
  const [beoSetupStyle, setBeoSetupStyle] = useState<'Banquet' | 'Theatre' | 'Classroom' | 'U-Shape' | 'Boardroom' | 'Cocktail / Standing'>('Banquet');
  const [beoFloorSupervisor, setBeoFloorSupervisor] = useState('Anisur Rahman (Banquet Manager)');
  const [beoSupervisorPhone, setBeoSupervisorPhone] = useState('+880 1713-388100');
  const [beoTableCount, setBeoTableCount] = useState(10);
  const [beoDietaryNotes, setBeoDietaryNotes] = useState('All halal catering. 15 vegetarian portions arranged.');
  const [beoKitchenNotes, setBeoKitchenNotes] = useState('Buffet to be ready 30 minutes before schedule. Warmers on.');
  const [beoSpecialInstructions, setBeoSpecialInstructions] = useState('VIP table on elevated dais. CCULB welcome banner on LED screen.');
  const [beoAvRequirements, setBeoAvRequirements] = useState<string[]>([
    'PA Sound System & Digital Mixer',
    'Wireless Handheld & Collar Mics (x4)',
    '4K Laser Projector & Motorized Screen',
    'LED Stage Backdrop & Spotlights',
    'Dedicated Sound & Lighting Technician'
  ]);
  const [customAvItem, setCustomAvItem] = useState('');
  const [beoWelcomeTime, setBeoWelcomeTime] = useState('10:00 AM');
  const [beoMealTime, setBeoMealTime] = useState('01:30 PM');
  const [beoTeaTime, setBeoTeaTime] = useState('04:30 PM');

  // Edit Event Modal State
  const [editingEvent, setEditingEvent] = useState<EventBooking | null>(null);
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
  const [editDeposit, setEditDeposit] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<EventBooking['items']>([]);
  const [newItemType, setNewItemType] = useState<EventBooking['items'][0]['itemType']>('Stage Setup');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(5000);
  const [editError, setEditError] = useState('');

  // Cancel Event Modal State
  const [cancellingEvent, setCancellingEvent] = useState<EventBooking | null>(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState('Client Requested Cancellation');
  const [cancelReasonCustom, setCancelReasonCustom] = useState('');
  const [depositHandling, setDepositHandling] = useState<'retained' | 'refunded' | 'transferred'>('retained');
  const [cancelRefundAmount, setCancelRefundAmount] = useState(0);
  const [cancelRefundMethod, setCancelRefundMethod] = useState<Payment['method']>('Bank Transfer');

  // Dedicated BEO Modal State
  const [showBeoModal, setShowBeoModal] = useState(false);
  const [beoTargetEvent, setBeoTargetEvent] = useState<EventBooking | null>(null);
  const [modalBeoSetupStyle, setModalBeoSetupStyle] = useState<'Banquet' | 'Theatre' | 'Classroom' | 'U-Shape' | 'Boardroom' | 'Cocktail / Standing'>('Banquet');
  const [modalBeoSupervisor, setModalBeoSupervisor] = useState('');
  const [modalBeoSupervisorPhone, setModalBeoSupervisorPhone] = useState('+880 1713-388100');
  const [modalBeoTableCount, setModalBeoTableCount] = useState(10);
  const [modalBeoDietaryNotes, setModalBeoDietaryNotes] = useState('');
  const [modalBeoKitchenNotes, setModalBeoKitchenNotes] = useState('');
  const [modalBeoSpecialInstructions, setModalBeoSpecialInstructions] = useState('');
  const [modalBeoAvRequirements, setModalBeoAvRequirements] = useState<string[]>([]);
  const [modalCustomAvItem, setModalCustomAvItem] = useState('');
  const [modalBeoMenuNotes, setModalBeoMenuNotes] = useState('');
  const [modalBeoWelcomeTime, setModalBeoWelcomeTime] = useState('10:00 AM');
  const [modalBeoMealTime, setModalBeoMealTime] = useState('01:30 PM');
  const [modalBeoTeaTime, setModalBeoTeaTime] = useState('04:30 PM');

  const handleOpenEditEvent = (evt: EventBooking) => {
    setEditingEvent(evt);
    setEditEventName(evt.eventName);
    setEditEventType(evt.eventType);
    setEditHallId(evt.hallId);
    setEditEventDate(evt.eventDate);
    setEditStartTime(evt.startTime);
    setEditEndTime(evt.endTime);
    setEditGuestCount(evt.guestCount);
    setEditClientName(evt.clientName);
    setEditClientCompany(evt.clientCompany || '');
    setEditClientPhone(evt.clientPhone);
    const client = db.eventClients?.find(c => c.id === evt.clientId);
    setEditClientEmail(client?.email || '');
    setEditPackageId(evt.packageId || '');
    setEditStatus(evt.status);
    setEditDeposit(evt.deposit || 0);
    setEditNotes(evt.notes || '');
    setEditItems(evt.items ? [...evt.items] : []);
    setEditError('');
  };

  const handleAddEditItem = () => {
    if (!newItemDesc.trim()) return;
    const item = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemType: newItemType,
      description: newItemDesc.trim(),
      quantity: Number(newItemQty) || 1,
      unitPrice: Number(newItemPrice) || 0,
      total: (Number(newItemQty) || 1) * (Number(newItemPrice) || 0)
    };
    setEditItems([...editItems, item]);
    setNewItemDesc('');
    setNewItemQty(1);
    setNewItemPrice(5000);
  };

  const handleRemoveEditItem = (itemId: string) => {
    setEditItems(editItems.filter(it => it.id !== itemId));
  };

  const handleSaveEditEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setEditError('');

    try {
      const selectedHall = availableHalls.find(h => h.id === editHallId);
      const hallRate = selectedHall?.baseRatePerDay || 45000;
      const selectedPkg = db.packages.find(p => p.id === editPackageId);
      const packageRate = selectedPkg ? Math.round((selectedPkg.price / 100) * 80) : 0;

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

      if (editPackageId && selectedPkg) {
        const foodIdx = finalItems.findIndex(it => it.itemType === 'Food Package');
        const foodItem = {
          id: foodIdx >= 0 ? finalItems[foodIdx].id : `item-pkg-${Date.now()}`,
          itemType: 'Food Package' as const,
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

      const res = pmsService.updateEventBooking(editingEvent.id, {
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
        deposit: Number(editDeposit),
        notes: editNotes,
        items: finalItems
      });

      if (res.success) {
        setEditingEvent(null);
        setFeedbackMsg({
          type: 'success',
          text: `Event ${res.event.eventNumber} ("${res.event.eventName}") updated successfully!`
        });
        setTimeout(() => setFeedbackMsg(null), 3500);
      }
    } catch (err: any) {
      setEditError(err.message || 'Failed to update event booking.');
    }
  };

  const handleOpenCancelEvent = (evt: EventBooking) => {
    setCancellingEvent(evt);
    setCancelReasonPreset('Client Requested Cancellation');
    setCancelReasonCustom('');
    setDepositHandling('retained');
    setCancelRefundAmount(evt.deposit || 0);
    setCancelRefundMethod('Bank Transfer');
  };

  const handleConfirmCancelEvent = () => {
    if (!cancellingEvent) return;
    const finalReason = cancelReasonCustom.trim() || cancelReasonPreset;
    try {
      const res = pmsService.cancelEventBooking(cancellingEvent.id, {
        reason: finalReason,
        depositHandling: depositHandling,
        refundAmount: depositHandling === 'refunded' ? Number(cancelRefundAmount) : 0,
        refundMethod: cancelRefundMethod,
        notes: cancelReasonCustom
      });
      if (res.success) {
        setCancellingEvent(null);
        setFeedbackMsg({
          type: 'success',
          text: `Banquet Event ${cancellingEvent.eventNumber} has been cancelled and hall venue released.`
        });
        setTimeout(() => setFeedbackMsg(null), 3500);
      }
    } catch (err: any) {
      alert(`Error cancelling event: ${err.message}`);
    }
  };

  const handleReopenEvent = (evt: EventBooking) => {
    try {
      const res = pmsService.reopenEventBooking(evt.id);
      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Event ${evt.eventNumber} has been reopened and confirmed!`
        });
        setTimeout(() => setFeedbackMsg(null), 3500);
      }
    } catch (err: any) {
      alert(`Error reopening event: ${err.message}`);
    }
  };

  const handleOpenEditBEO = (evt: EventBooking) => {
    setBeoTargetEvent(evt);
    setSelectedEventId(evt.id);
    setModalBeoSetupStyle(evt.setupStyle || 'Banquet');
    setModalBeoSupervisor(evt.floorSupervisor || 'Anisur Rahman (Banquet Manager)');
    setModalBeoSupervisorPhone(evt.supervisorPhone || '+880 1713-388100');
    setModalBeoTableCount(evt.tableCount || Math.ceil(evt.guestCount / 10));
    setModalBeoDietaryNotes(evt.dietaryRequirements || 'All halal catering. 15 vegetarian portions arranged.');
    setModalBeoKitchenNotes(evt.kitchenNotes || 'Buffet to be ready 30 minutes before schedule. Warmers on.');
    setModalBeoSpecialInstructions(evt.specialInstructions || 'VIP table on elevated dais. CCULB welcome banner on LED screen.');
    setModalBeoAvRequirements(evt.avRequirements && evt.avRequirements.length > 0 ? [...evt.avRequirements] : [
      'PA Sound System & Digital Mixer',
      'Wireless Handheld & Collar Mics (x4)',
      '4K Laser Projector & Motorized Screen',
      'LED Stage Backdrop & Spotlights',
      'Dedicated Sound & Lighting Technician'
    ]);
    const pkg = db.packages.find(p => p.id === evt.packageId);
    setModalBeoMenuNotes(pkg ? `${pkg.name}: Welcome Fresh Mint Lemonade, Kacchi Biryani, Chicken Roast, Beef Rezala, Mixed Vegetable, Firni, Borhani, Soft Drinks.` : 'Standard CCULB Buffet Catering Setup with welcome refreshments, grand lunch, and evening tea.');
    setModalBeoWelcomeTime(evt.startTime || '10:00 AM');
    setModalBeoMealTime('01:30 PM');
    setModalBeoTeaTime(evt.endTime ? `${evt.endTime} PM` : '04:30 PM');
    setShowBeoModal(true);
  };

  const toggleModalBeoAvRequirement = (item: string) => {
    if (modalBeoAvRequirements.includes(item)) {
      setModalBeoAvRequirements(modalBeoAvRequirements.filter(i => i !== item));
    } else {
      setModalBeoAvRequirements([...modalBeoAvRequirements, item]);
    }
  };

  const handleAddModalCustomAv = () => {
    if (!modalCustomAvItem.trim()) return;
    if (!modalBeoAvRequirements.includes(modalCustomAvItem.trim())) {
      setModalBeoAvRequirements([...modalBeoAvRequirements, modalCustomAvItem.trim()]);
    }
    setModalCustomAvItem('');
  };

  const toggleBeoAvRequirement = (item: string) => {
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

  const handleSaveModalBEO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!beoTargetEvent) return;

    try {
      const res = pmsService.updateEventFunctionSheet(beoTargetEvent.id, {
        setupStyle: modalBeoSetupStyle,
        floorSupervisor: modalBeoSupervisor,
        supervisorPhone: modalBeoSupervisorPhone,
        tableCount: Number(modalBeoTableCount),
        dietaryRequirements: modalBeoDietaryNotes,
        kitchenNotes: modalBeoKitchenNotes,
        specialInstructions: modalBeoSpecialInstructions,
        avRequirements: modalBeoAvRequirements,
        timeline: [
          { time: modalBeoWelcomeTime, activity: 'Welcome Drinks & Refreshments' },
          { time: modalBeoMealTime, activity: 'Grand Banquet Buffet Meal Service' },
          { time: modalBeoTeaTime, activity: 'Evening Tea, Coffee & Assorted Pastries' }
        ]
      });

      if (res.success) {
        setShowBeoModal(false);
        setFeedbackMsg({
          type: 'success',
          text: `BEO Function Sheet for ${beoTargetEvent.eventNumber} updated successfully!`
        });
        setTimeout(() => setFeedbackMsg(null), 3500);
      }
    } catch (err: any) {
      alert(`Error updating BEO: ${err.message}`);
    }
  };

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  useEffect(() => {
    if (!hallId && availableHalls.length > 0) {
      setHallId(availableHalls[0].id);
    }
  }, [availableHalls, hallId]);

  useEffect(() => {
    if (initialTab && (initialTab === 'function-sheets' || initialTab === 'billing' || initialTab === 'deposits' || initialTab === 'events')) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const selectedEvent = db.eventBookings.find(e => e.id === selectedEventId) || db.eventBookings[0];

  useEffect(() => {
    if (selectedEvent) {
      setBeoSetupStyle(selectedEvent.setupStyle || 'Banquet');
      setBeoFloorSupervisor(selectedEvent.floorSupervisor || 'Anisur Rahman (Banquet Manager)');
      setBeoSupervisorPhone(selectedEvent.supervisorPhone || '+880 1713-388100');
      setBeoTableCount(selectedEvent.tableCount || Math.ceil(selectedEvent.guestCount / 10));
      setBeoDietaryNotes(selectedEvent.dietaryRequirements || 'All halal catering. 15 vegetarian portions arranged.');
      setBeoKitchenNotes(selectedEvent.kitchenNotes || 'Buffet to be ready 30 minutes before schedule. Warmers on.');
      setBeoSpecialInstructions(selectedEvent.specialInstructions || 'VIP table on elevated dais. CCULB welcome banner on LED screen.');
      setBeoAvRequirements(selectedEvent.avRequirements && selectedEvent.avRequirements.length > 0 ? [...selectedEvent.avRequirements] : [
        'PA Sound System & Digital Mixer',
        'Wireless Handheld & Collar Mics (x4)',
        '4K Laser Projector & Motorized Screen',
        'LED Stage Backdrop & Spotlights',
        'Dedicated Sound & Lighting Technician'
      ]);
      setBeoWelcomeTime(selectedEvent.startTime || '10:00 AM');
      setBeoMealTime('01:30 PM');
      setBeoTeaTime(selectedEvent.endTime ? `${selectedEvent.endTime}` : '04:30 PM');
    }
  }, [selectedEventId, selectedEvent]);

  const filteredEvents = (db.eventBookings || []).filter(evt => {
    const matchesSearch =
      evt.eventName.toLowerCase().includes(search.toLowerCase()) ||
      evt.clientName.toLowerCase().includes(search.toLowerCase()) ||
      evt.eventNumber.toLowerCase().includes(search.toLowerCase()) ||
      evt.hallName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'All' || evt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportPDF = () => {
    const propertyName = db.settings.resortName || 'Resort MIS';
    pdfExportService.exportToPDF({
      title: 'BANQUET & CONVENTION EVENT REGISTER',
      subtitle: `${propertyName.toUpperCase()} • BANQUET OPERATIONS & SALES`,
      date: new Date().toLocaleDateString('en-GB'),
      columns: [
        { key: 'eventNumber', header: 'Event #' },
        { key: 'eventName', header: 'Event Name' },
        { key: 'hall', header: 'Hall' },
        { key: 'date', header: 'Date' },
        { key: 'client', header: 'Client' },
        { key: 'pax', header: 'Pax', align: 'center' },
        { key: 'total', header: 'Total (BDT)', align: 'right' },
        { key: 'deposit', header: 'Deposit (BDT)', align: 'right' },
        { key: 'balance', header: 'Balance (BDT)', align: 'right' },
        { key: 'status', header: 'Status' }
      ],
      rows: filteredEvents.map(e => ({
        eventNumber: e.eventNumber,
        eventName: e.eventName,
        hall: e.hallName,
        date: e.eventDate,
        client: e.clientName,
        pax: `${e.guestCount}`,
        total: `BDT ${(e.total || 0).toLocaleString()}`,
        deposit: `BDT ${(e.deposit || 0).toLocaleString()}`,
        balance: `BDT ${(e.balance || 0).toLocaleString()}`,
        status: e.status
      })),
      summaryTotals: {
        eventName: `Total Events: ${filteredEvents.length}`,
        total: `BDT ${filteredEvents.reduce((sum, e) => sum + (e.total || 0), 0).toLocaleString()}`,
        balance: `BDT ${filteredEvents.reduce((sum, e) => sum + (e.balance || 0), 0).toLocaleString()}`
      },
      department: 'Convention & Banquet Sales',
      metadata: {
        'Status Filter': statusFilter,
        'Active Bookings': `${filteredEvents.length}`
      }
    }, `Convention_Events_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handlePreviewReport = () => {
    if (onPrintReport) {
      onPrintReport({
        title: 'BANQUET & CONVENTION EVENT REGISTER',
        definition: {
          reportCode: 'RPT-BANQUET-REGISTER',
          reportName: 'Banquet & Convention Event Register',
          defaultDataScope: 'Convention Sales'
        },
        department: 'Banquet Sales',
        generatedAt: new Date().toLocaleString(),
        generatedBy: 'Convention Manager',
        columns: [
          { key: 'eventNumber', header: 'Event #' },
          { key: 'eventName', header: 'Event Name' },
          { key: 'hall', header: 'Hall' },
          { key: 'date', header: 'Date' },
          { key: 'client', header: 'Client' },
          { key: 'pax', header: 'Pax', align: 'center' },
          { key: 'total', header: 'Total (BDT)', align: 'right' },
          { key: 'deposit', header: 'Deposit (BDT)', align: 'right' },
          { key: 'balance', header: 'Balance (BDT)', align: 'right' },
          { key: 'status', header: 'Status' }
        ],
        rows: filteredEvents.map(e => ({
          eventNumber: e.eventNumber,
          eventName: e.eventName,
          hall: e.hallName,
          date: e.eventDate,
          client: e.clientName,
          pax: `${e.guestCount}`,
          total: `BDT ${(e.total || 0).toLocaleString()}`,
          deposit: `BDT ${(e.deposit || 0).toLocaleString()}`,
          balance: `BDT ${(e.balance || 0).toLocaleString()}`,
          status: e.status
        })),
        summaryTotals: {
          eventName: `Total Events: ${filteredEvents.length}`,
          total: `BDT ${filteredEvents.reduce((sum, e) => sum + (e.total || 0), 0).toLocaleString()}`,
          balance: `BDT ${filteredEvents.reduce((sum, e) => sum + (e.balance || 0), 0).toLocaleString()}`
        }
      });
    } else {
      handleExportPDF();
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError('');

    try {
      const activeHallId = hallId || availableHalls[0]?.id;
      if (!activeHallId) {
        setConflictError('Please select a convention hall venue.');
        return;
      }
      const selectedHall = availableHalls.find(h => h.id === activeHallId) || db.halls.find(h => h.id === activeHallId);
      const hallRate = selectedHall ? selectedHall.baseRatePerDay : 50000;

      const newEvt = pmsService.createEventBooking({
        hallId: activeHallId,
        eventName,
        eventType,
        clientName,
        clientPhone,
        clientEmail: clientEmail || `${clientPhone.replace(/[^0-9]/g, '')}@client.cculb.org`,
        clientCompany,
        eventDate,
        startTime,
        endTime,
        guestCount,
        packageId: packageId || undefined,
        depositAmount: deposit,
        paymentMethod: deposit > 0 ? paymentMethod : undefined,
        items: [
          {
            itemType: 'Hall Rent',
            description: `${selectedHall?.name || 'Convention Hall'} Base Rental`,
            quantity: 1,
            unitPrice: hallRate
          },
          ...(packageId ? [{
            itemType: 'Food Package' as const,
            description: `${db.packages.find(p => p.id === packageId)?.name || 'Banquet Package'} (Pax: ${guestCount})`,
            quantity: guestCount,
            unitPrice: Math.round(((db.packages.find(p => p.id === packageId)?.price || 1500) / 100) * 80)
          }] : [])
        ]
      });

      setShowNewModal(false);
      setSelectedEventId(newEvt.id);
      setFeedbackMsg({ type: 'success', text: `Banquet Event ${newEvt.eventNumber} successfully booked and deposit posted to GL 2010!` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setConflictError(err.message || 'Hall booking conflict detected.');
    }
  };

  const handleRecordDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      const res = pmsService.recordEventDeposit(selectedEvent.id, {
        amount: Number(depAmount),
        method: depMethod,
        reference: depRef || `DEP-${Date.now().toString().slice(-6)}`,
        notes: depNotes
      });

      if (res.success) {
        setShowDepositModal(false);
        setFeedbackMsg({ type: 'success', text: `Deposit of ৳${(depAmount || 0).toLocaleString()} recorded and mapped to GL Accounts!` });
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to record deposit.' });
    }
  };

  const handleSettleBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      const res = pmsService.settleEventBill(selectedEvent.id, {
        paymentMethod: settleMethod,
        cityLedgerAccountId: settleMethod === 'City Ledger' ? settleClAccountId : undefined,
        reference: settleRef || `BANQ-ST-${Date.now().toString().slice(-6)}`
      });

      if (res.success) {
        setShowSettleModal(false);
        setFeedbackMsg({ type: 'success', text: `Banquet Bill for ${selectedEvent.eventNumber} settled and posted to Accounts!` });
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to settle banquet bill.' });
    }
  };

  const handleSaveFunctionSheet = () => {
    if (!selectedEvent) return;
    try {
      const res = pmsService.updateEventFunctionSheet(selectedEvent.id, {
        setupStyle: beoSetupStyle,
        floorSupervisor: beoFloorSupervisor,
        supervisorPhone: beoSupervisorPhone,
        tableCount: Number(beoTableCount),
        dietaryRequirements: beoDietaryNotes,
        kitchenNotes: beoKitchenNotes,
        specialInstructions: beoSpecialInstructions,
        avRequirements: beoAvRequirements,
        timeline: [
          { time: beoWelcomeTime, activity: 'Welcome Drinks & Refreshments' },
          { time: beoMealTime, activity: 'Grand Banquet Buffet Meal Service' },
          { time: beoTeaTime, activity: 'Evening Tea, Coffee & Assorted Cookies' }
        ]
      });
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Function Sheet (BEO) for ${selectedEvent.eventNumber} saved successfully!` });
        setTimeout(() => setFeedbackMsg(null), 3000);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error updating function sheet' });
    }
  };

  // KPIs
  const totalEvents = db.eventBookings.length;
  const confirmedEvents = db.eventBookings.filter(e => e.status === 'Confirmed').length;
  const totalRevenue = db.eventBookings.reduce((sum, e) => sum + e.total, 0);
  const totalDeposits = db.eventBookings.reduce((sum, e) => sum + e.deposit, 0);
  const outstandingAr = db.eventBookings.filter(e => e.status !== 'Cancelled').reduce((sum, e) => sum + Math.max(0, e.balance), 0);

  return (
    <div className="w-full max-w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-900 text-white rounded-xl shadow-sm">
            <PartyPopper className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Banquet & Convention Management</h1>
            <p className="text-sm text-gray-500">Convention halls, event booking, BEO function sheets, advance deposits & accounting billing</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (onNavigate) {
                onNavigate('banquet-quotations');
              }
            }}
            className="px-3.5 py-2 text-sm font-medium text-purple-900 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            title="Create and manage custom event packages & guest quotations"
          >
            <Sparkles className="w-4 h-4 text-purple-700" />
            Guest Quotations
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-500 shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
            title="Download vector PDF banquet events ledger"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={handlePreviewReport}
            className="px-3.5 py-2 text-sm font-medium text-slate-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
            title="Preview formal banquet register with pagination & print"
          >
            <Printer className="w-4 h-4" />
            Preview & Print
          </button>
          <button
            onClick={() => {
              if (!hallId && availableHalls.length > 0) {
                setHallId(availableHalls[0].id);
              }
              setConflictError('');
              setShowNewModal(true);
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-purple-900 hover:bg-purple-950 rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Book Banquet Event
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{feedbackMsg.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Bookings</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono">{totalEvents}</div>
          <div className="mt-1 text-[11px] text-emerald-700 font-medium">{confirmedEvents} Confirmed Upcoming</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Billed Revenue</div>
          <div className="mt-2 text-2xl font-bold text-purple-900 font-mono">৳{(totalRevenue || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">Hall rent, buffet catering & AV</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Advance Deposits (GL 2010)</div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">৳{(totalDeposits || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">Held in liability security ledger</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Outstanding Balance (AR)</div>
          <div className="mt-2 text-2xl font-bold text-rose-700 font-mono">৳{(outstandingAr || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">Payable on event day / corporate</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Convention Venues</div>
          <div className="mt-2 text-2xl font-bold text-blue-800 font-mono">{availableHalls.length} Halls</div>
          <div className="mt-1 text-[11px] text-gray-500">Ballrooms & Boardrooms</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-6 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setActiveTab('events')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'events' ? 'border-purple-900 text-purple-950 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <PartyPopper className="w-4 h-4" />
            Events Master ({db.eventBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('function-sheets')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'function-sheets' ? 'border-purple-900 text-purple-950 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <FileText className="w-4 h-4" />
            Function Sheets (BEO)
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'billing' ? 'border-purple-900 text-purple-950 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <CreditCard className="w-4 h-4" />
            Event Billing & Settlements
          </button>
          <button
            onClick={() => setActiveTab('deposits')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'deposits' ? 'border-purple-900 text-purple-950 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <DollarSign className="w-4 h-4" />
            Advance Deposits & Receipts (GL 2010)
          </button>
        </div>
      </div>

      {/* TAB 1: EVENTS MASTER */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search event name, client, hall, event #..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-900 focus:border-purple-900 outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Status:</span>
              {['All', 'Confirmed', 'Ongoing', 'Completed', 'Tentative', 'Cancelled'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === st ? 'bg-purple-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 min-w-[900px]">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5">Event # / Name</th>
                    <th className="px-5 py-3.5">Hall Venue</th>
                    <th className="px-5 py-3.5">Date & Timing</th>
                    <th className="px-5 py-3.5">Client / Organizer</th>
                    <th className="px-5 py-3.5 text-right">Guests</th>
                    <th className="px-5 py-3.5 text-right">Total Bill</th>
                    <th className="px-5 py-3.5 text-right">Deposit</th>
                    <th className="px-5 py-3.5 text-right">Balance</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEvents.map(evt => (
                    <tr key={evt.id} className="hover:bg-purple-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900">{evt.eventName}</div>
                        <div className="text-xs text-purple-700 font-mono font-medium">{evt.eventNumber}</div>
                        <div className="text-[11px] text-gray-400">{evt.eventType}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-gray-400" />
                          {evt.hallName}
                        </div>
                        <div className="text-xs text-gray-500">{evt.packageName || 'Custom Setup'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {evt.eventDate}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {evt.startTime} - {evt.endTime}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{evt.clientName}</div>
                        {evt.clientCompany && <div className="text-xs text-indigo-700 font-medium">{evt.clientCompany}</div>}
                        <div className="text-xs text-gray-500 font-mono">{evt.clientPhone}</div>
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-semibold text-gray-900">
                        {evt.guestCount}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-gray-900">
                        ৳{(evt.total || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-emerald-700 font-semibold">
                        ৳{(evt.deposit || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-rose-700">
                        ৳{(Math.max(0, evt.balance) || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          evt.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                          evt.status === 'Ongoing' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                          evt.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                          evt.status === 'Cancelled' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {evt.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Edit Event Option */}
                          <button
                            onClick={() => handleOpenEditEvent(evt)}
                            className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Edit Event Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* Edit BEO Option */}
                          <button
                            onClick={() => handleOpenEditBEO(evt)}
                            className="px-2 py-1 text-xs font-medium text-purple-900 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Edit Function Sheet (BEO)"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>BEO</span>
                          </button>

                          {/* Bill & Settlement Option */}
                          <button
                            onClick={() => {
                              setSelectedEventId(evt.id);
                              setActiveTab('billing');
                            }}
                            className="px-2 py-1 text-xs font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors cursor-pointer"
                            title="View Billing & Settle"
                          >
                            Bill
                          </button>

                          {/* Cancel or Reopen Option */}
                          {evt.status !== 'Cancelled' ? (
                            <button
                              onClick={() => handleOpenCancelEvent(evt)}
                              className="px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Cancel Banquet Event"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReopenEvent(evt)}
                              className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Reopen Cancelled Event"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Reopen</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (onPrintBEO) onPrintBEO(evt);
                              else handleOpenEditBEO(evt);
                            }}
                            className="p-1 text-purple-600 hover:text-purple-800 transition-colors cursor-pointer"
                            title="Print Banquet Event Order (BEO)"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {onPrintContract && (
                            <button
                              onClick={() => onPrintContract(evt)}
                              className="p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                              title="Print Contract"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FUNCTION SHEETS (BEO - BANQUET EVENT ORDERS) */}
      {activeTab === 'function-sheets' && selectedEvent && (
        <div className="space-y-6">
          {/* Event Selector */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-gray-500 block font-semibold uppercase">Active Banquet Event Order</span>
              <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>{selectedEvent.eventName}</span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono font-bold">{selectedEvent.eventNumber}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium shadow-xs"
              >
                {db.eventBookings.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.eventNumber} - {e.eventName} ({e.eventDate})
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleOpenEditBEO(selectedEvent)}
                className="px-3.5 py-2 text-sm font-semibold text-white bg-purple-900 hover:bg-purple-950 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                title="Open BEO Editor"
              >
                <Edit3 className="w-4 h-4" />
                Edit BEO Specifications
              </button>

              <button
                onClick={() => handleOpenEditEvent(selectedEvent)}
                className="px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Edit Event Booking Logistics"
              >
                <Edit3 className="w-4 h-4" />
                Edit Event
              </button>

              {selectedEvent.status !== 'Cancelled' ? (
                <button
                  onClick={() => handleOpenCancelEvent(selectedEvent)}
                  className="px-3 py-2 text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Cancel Banquet Event"
                >
                  <Ban className="w-4 h-4" />
                  Cancel Event
                </button>
              ) : (
                <button
                  onClick={() => handleReopenEvent(selectedEvent)}
                  className="px-3 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Reopen Cancelled Event"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reopen Event
                </button>
              )}

              <button
                onClick={() => {
                  if (onPrintBEO) {
                    onPrintBEO(selectedEvent);
                  } else {
                    window.print();
                  }
                }}
                className="px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm flex items-center gap-2 cursor-pointer"
                title="Print Official BEO Sheet"
              >
                <Printer className="w-4 h-4 text-purple-700" />
                Print BEO Sheet
              </button>
            </div>
          </div>

          {/* BEO Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: General & Setup Info */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                <Building className="w-4 h-4 text-purple-900" />
                Hall Setup & Venue Specifications
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-gray-500 font-medium block">Venue / Hall:</span>
                  <span className="font-bold text-gray-900 text-sm">{selectedEvent.hallName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500 font-medium block">Event Date:</span>
                    <span className="font-semibold text-gray-900">{selectedEvent.eventDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium block">Duration:</span>
                    <span className="font-semibold text-gray-900">{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500 font-medium block">Guaranteed Pax:</span>
                    <span className="font-bold text-purple-900 text-sm">{selectedEvent.guestCount} Guests</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium block">Event Category:</span>
                    <span className="font-semibold text-gray-900">{selectedEvent.eventType}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <label className="text-gray-700 font-bold block mb-1">Seating & Layout Style</label>
                  <select
                    value={beoSetupStyle}
                    onChange={(e) => setBeoSetupStyle(e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 font-medium text-xs"
                  >
                    <option value="Banquet">Round Banquet Tables (8-10 Pax/Table)</option>
                    <option value="Theatre">Theatre Style (Row Seating facing Stage)</option>
                    <option value="Classroom">Classroom Style (Desks & Chairs)</option>
                    <option value="U-Shape">U-Shape Executive Conference</option>
                    <option value="Boardroom">Central Hollow Boardroom</option>
                    <option value="Cocktail / Standing">High-Top Standing Cocktail Lounge</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">Banquet Captain / Supervisor</label>
                  <input
                    type="text"
                    value={beoFloorSupervisor}
                    onChange={(e) => setBeoFloorSupervisor(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Middle: Audio/Visual & Stage Production */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                <Mic className="w-4 h-4 text-purple-900" />
                A/V Equipment & Stage Production
              </h3>

              <div className="space-y-2.5 text-xs">
                {[
                  { name: 'PA Sound System & Digital Mixer', status: 'Confirmed' },
                  { name: 'Wireless Handheld & Collar Mics (x4)', status: 'Confirmed' },
                  { name: '4K Laser Projector & Motorized Screen', status: 'Confirmed' },
                  { name: 'LED Stage Backdrop & Spotlights', status: 'Ready' },
                  { name: 'Podium with CCULB Resort Logo', status: 'Assigned' },
                  { name: 'Dedicated Sound & Lighting Technician', status: 'Assigned' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="font-medium text-gray-800">{item.name}</span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      {item.status}
                    </span>
                  </div>
                ))}

                <div className="pt-2">
                  <label className="text-gray-700 font-bold block mb-1">Special Production Notes</label>
                  <textarea
                    rows={2}
                    value={beoSpecialInstructions}
                    onChange={(e) => setBeoSpecialInstructions(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Right: Catering & Kitchen Service Timeline */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-purple-900" />
                Catering Menu & Service Timeline
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <span className="font-bold text-purple-950 block">{selectedEvent.packageName || 'Grand CCULB Banquet Buffet'}</span>
                  <p className="text-[11px] text-purple-800 mt-1">
                    Welcome Fresh Mint Lemonade, Kacchi Biryani, Chicken Roast, Beef Rezala, Mixed Vegetable, Firni, Borhani, Soft Drinks.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="font-bold">10:00 AM:</span>
                    <span>Welcome Drinks & Refreshments</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="font-bold">01:30 PM:</span>
                    <span>Grand Buffet Lunch Service</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="font-bold">04:30 PM:</span>
                    <span>Evening Tea, Coffee & Assorted Cookies</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <label className="text-gray-700 font-bold block mb-1">Kitchen & Service Instructions</label>
                  <textarea
                    rows={2}
                    value={beoKitchenNotes}
                    onChange={(e) => setBeoKitchenNotes(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-xs"
                  />
                </div>

                <button
                  onClick={handleSaveFunctionSheet}
                  className="w-full py-2 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
                >
                  Save Function Sheet (BEO)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVENT BILLING & SETTLEMENTS */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Events List for Billing */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
              <h3 className="font-bold text-gray-900 text-sm border-b border-gray-200 pb-2">Select Banquet Event for Settlement</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {db.eventBookings.map(evt => (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventId(evt.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedEvent?.id === evt.id ? 'border-purple-900 bg-purple-50/70 shadow-xs' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900 text-xs">{evt.eventName}</div>
                        <div className="text-[11px] text-purple-700 font-mono">{evt.eventNumber}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${evt.balance <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {evt.balance <= 0 ? 'Paid' : `Due ৳${(evt.balance || 0).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-gray-500 flex justify-between">
                      <span>{evt.hallName}</span>
                      <span className="font-mono font-bold text-gray-800">৳{(evt.total || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle & Right: Itemized Bill & Accounting Posting */}
            {selectedEvent && (
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase font-semibold">Banquet Invoicing & General Ledger Mapping</span>
                    <h2 className="text-xl font-bold text-gray-900">{selectedEvent.eventName}</h2>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Client: <span className="font-semibold text-gray-900">{selectedEvent.clientName}</span> {selectedEvent.clientCompany && `(${selectedEvent.clientCompany})`} | Hall: <span className="font-semibold text-gray-900">{selectedEvent.hallName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedEvent.balance > 0 ? (
                      <button
                        onClick={() => setShowSettleModal(true)}
                        className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-lg text-sm shadow-sm flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Settle Banquet Bill
                      </button>
                    ) : (
                      <div className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-sm font-bold flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Bill Fully Settled
                      </div>
                    )}
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 font-bold text-gray-700 border-b border-gray-200">
                      <tr>
                        <th className="p-3">Item Description</th>
                        <th className="p-3 text-center">Type</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 font-mono">
                      {selectedEvent.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-sans font-medium text-gray-900">{it.description}</td>
                          <td className="p-3 text-center font-sans">
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-semibold">{it.itemType}</span>
                          </td>
                          <td className="p-3 text-right text-gray-800">{it.quantity}</td>
                          <td className="p-3 text-right text-gray-800">৳{(it.unitPrice || 0).toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-gray-900">৳{(it.total || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Breakdown & GL Posting Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-2 font-mono">
                    <div className="font-bold text-gray-900 font-sans border-b border-gray-200 pb-1">Tax & Financial Summary</div>
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal (Hall + F&B):</span>
                      <span>৳{(selectedEvent.subtotal || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Service Charge (10% - GL 2110):</span>
                      <span>৳{(selectedEvent.serviceCharge || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Govt VAT (15% - GL 2100):</span>
                      <span>৳{(selectedEvent.tax || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 text-sm border-t border-gray-200 pt-1">
                      <span>Grand Total:</span>
                      <span>৳{(selectedEvent.total || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Advance Deposit Paid (GL 2010):</span>
                      <span>- ৳{(selectedEvent.deposit || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-rose-700 text-sm border-t border-dashed border-gray-300 pt-1">
                      <span>Net Balance Due:</span>
                      <span>৳{(Math.max(0, selectedEvent.balance) || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 text-xs space-y-2">
                    <div className="font-bold text-purple-950 border-b border-purple-200 pb-1 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-900" />
                      Automatic GL Account Mapping
                    </div>
                    <div className="text-[11px] text-purple-900 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Venue Rental:</span>
                        <span className="font-bold font-mono">CR: GL 4040</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Buffet & Catering:</span>
                        <span className="font-bold font-mono">CR: GL 4020</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Charge Pool:</span>
                        <span className="font-bold font-mono">CR: GL 2110</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Government VAT:</span>
                        <span className="font-bold font-mono">CR: GL 2100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Advance Security Deposit:</span>
                        <span className="font-bold font-mono">DR: GL 2010</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Balance Settlement:</span>
                        <span className="font-bold font-mono">DR: GL 1010 / 1150</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ADVANCE DEPOSITS & RECEIPTS */}
      {activeTab === 'deposits' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Banquet Advance Deposits Ledger (GL 2010)</h3>
              <p className="text-xs text-gray-500">Security deposits received for event bookings, held as liabilities until final event settlement</p>
            </div>

            <button
              onClick={() => setShowDepositModal(true)}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-sm shadow-sm flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Collect Advance Deposit
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-700 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Event # / Name</th>
                  <th className="px-5 py-3.5">Hall Venue</th>
                  <th className="px-5 py-3.5">Event Date</th>
                  <th className="px-5 py-3.5">Client Name</th>
                  <th className="px-5 py-3.5 text-right">Total Event Value</th>
                  <th className="px-5 py-3.5 text-right">Deposit Collected</th>
                  <th className="px-5 py-3.5 text-right">Remaining Due</th>
                  <th className="px-5 py-3.5 text-center">GL 2010 Posting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {db.eventBookings.map(evt => (
                  <tr key={evt.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-bold text-gray-900">{evt.eventName}</div>
                      <div className="text-xs text-purple-700 font-mono">{evt.eventNumber}</div>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900">{evt.hallName}</td>
                    <td className="px-5 py-4 font-mono text-xs">{evt.eventDate}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">{evt.clientName}</td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-gray-900">৳{(evt.total || 0).toLocaleString()}</td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-emerald-700">৳{(evt.deposit || 0).toLocaleString()}</td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-rose-700">৳{(Math.max(0, evt.balance) || 0).toLocaleString()}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                        Posted (JV Mapped)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: NEW BANQUET EVENT */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-purple-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <PartyPopper className="w-5 h-5" />
                <h3 className="font-bold text-base">Book New Banquet & Convention Event</h3>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-purple-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {conflictError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  {conflictError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Convention Hall Venue *</label>
                <select
                  value={hallId || (availableHalls[0]?.id || '')}
                  onChange={(e) => setHallId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-medium text-gray-900"
                  required
                >
                  {availableHalls.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.venueType || 'Hall'} • Cap: {h.capacity} Pax • ৳{(h.baseRatePerDay || 0).toLocaleString()}/day)
                    </option>
                  ))}
                </select>
                {(() => {
                  const currentHall = availableHalls.find(h => h.id === (hallId || availableHalls[0]?.id));
                  if (!currentHall) return null;
                  return (
                    <div className="mt-2 text-xs text-gray-600 bg-purple-50 border border-purple-100 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-purple-950">{currentHall.name}</span>
                        <span className="text-gray-500 ml-1.5 font-normal">({currentHall.floor || 'Convention Center'})</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-gray-600">Max Cap: <strong className="text-gray-900">{currentHall.capacity} Pax</strong></span>
                        <span className="text-emerald-700 font-bold">Rent: ৳{(currentHall.baseRatePerDay || 0).toLocaleString()}/day</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. CCULB Annual Leadership Conference"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Event Category</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="Corporate">Corporate Conference</option>
                    <option value="Wedding">Wedding Banquet</option>
                    <option value="Annual General Meeting (AGM)">AGM Meeting</option>
                    <option value="Seminar">Training / Seminar</option>
                    <option value="Birthday / Social">Birthday / Social</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Expected Guests (Pax) *</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 10)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Start Time</label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">End Time</label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Client / Organizer Name *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Md. Jahangir Kabir"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Client Phone *</label>
                  <input
                    type="text"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+880 1711-..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="CCULB Co-operative Society"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Banquet Food Package</label>
                  <select
                    value={packageId}
                    onChange={(e) => setPackageId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">No Food Package (Hall Only)</option>
                    {db.packages.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (৳{p.price}/pax)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Advance Deposit Amount (৳)</label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Deposit Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="Bank Transfer">Bank Transfer (Sonali/DBBL)</option>
                    <option value="Cash">Cash in Hand</option>
                    <option value="Card">POS Card Terminal</option>
                    <option value="bKash">bKash Merchant</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-lg text-sm shadow-sm"
                >
                  Confirm & Post to Accounts
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD ADVANCE DEPOSIT */}
      {showDepositModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 bg-emerald-800 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <h3 className="font-bold text-base">Collect Advance Deposit</h3>
              </div>
              <button onClick={() => setShowDepositModal(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordDeposit} className="p-5 space-y-4">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs">
                <div className="font-bold text-emerald-950">{selectedEvent.eventName}</div>
                <div className="text-emerald-800 font-mono">{selectedEvent.eventNumber} | Due: ৳{(selectedEvent.balance || 0).toLocaleString()}</div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Deposit Amount (৳) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={depAmount}
                  onChange={(e) => setDepAmount(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base font-mono font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Payment Method</label>
                <select
                  value={depMethod}
                  onChange={(e) => setDepMethod(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="Bank Transfer">Bank Transfer (Sonali Bank / EBL / DBBL)</option>
                  <option value="Cash">Cash at Front Office Cashier</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="bKash">bKash MFS</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Payment Reference / Trx ID</label>
                <input
                  type="text"
                  value={depRef}
                  onChange={(e) => setDepRef(e.target.value)}
                  placeholder="e.g. CHQ-991204 / BK-994"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-sm"
                >
                  Post Deposit to GL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SETTLE BANQUET BILL */}
      {showSettleModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 bg-purple-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-bold text-base">Settle Banquet Bill & Post to Accounts</h3>
              </div>
              <button onClick={() => setShowSettleModal(false)} className="text-purple-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettleBill} className="p-5 space-y-4">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-xs">
                <div className="font-bold text-purple-950">{selectedEvent.eventName}</div>
                <div className="text-purple-800 font-mono font-bold mt-1">Outstanding Balance: ৳{(selectedEvent.balance || 0).toLocaleString()}</div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Settlement Channel</label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="Bank Transfer">Commercial Bank Transfer (Sonali Bank / EBL)</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Card">Credit Card</option>
                  <option value="bKash">bKash Merchant</option>
                  <option value="City Ledger">Direct Corporate Billing (City Ledger AR)</option>
                </select>
              </div>

              {settleMethod === 'City Ledger' && (
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Select Corporate Account *</label>
                  <select
                    value={settleClAccountId}
                    onChange={(e) => setSettleClAccountId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    {db.cityLedgerAccounts.map(cl => (
                      <option key={cl.id} value={cl.id}>
                        {cl.companyName} ({cl.accountNumber}) - Limit: ৳{(cl.creditLimit || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Settlement Reference / Invoice Ref</label>
                <input
                  type="text"
                  value={settleRef}
                  onChange={(e) => setSettleRef(e.target.value)}
                  placeholder="e.g. INV-BANQ-SETTLE-01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-lg text-sm"
                >
                  Confirm Settlement & Post JV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: EDIT BANQUET EVENT                                         */}
      {/* =================================================================== */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-indigo-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-300" />
                <div>
                  <h3 className="font-bold text-base">Edit Banquet Event: {editingEvent.eventNumber}</h3>
                  <p className="text-xs text-indigo-200">Update event schedule, venue, expected headcount, client details and status</p>
                </div>
              </div>
              <button onClick={() => setEditingEvent(null)} className="text-indigo-200 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEvent} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">Event Name / Occasion *</label>
                  <input
                    type="text"
                    required
                    value={editEventName}
                    onChange={(e) => setEditEventName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-900 focus:border-indigo-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Event Type *</label>
                  <select
                    value={editEventType}
                    onChange={(e) => setEditEventType(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-medium text-gray-900"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Convention Hall Venue *</label>
                  <select
                    value={editHallId}
                    onChange={(e) => setEditHallId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-medium text-gray-900"
                    required
                  >
                    {availableHalls.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name} (Cap: {h.capacity} Pax • ৳{(h.baseRatePerDay || 0).toLocaleString()}/day)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Event Status *</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-bold text-gray-900"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Tentative">Tentative</option>
                    <option value="Ongoing">Ongoing (In Progress)</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={editEventDate}
                    onChange={(e) => setEditEventDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Guaranteed Headcount (Pax) *</label>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    required
                    value={editGuestCount}
                    onChange={(e) => setEditGuestCount(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Catering / Banquet Package</label>
                  <select
                    value={editPackageId}
                    onChange={(e) => setEditPackageId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-medium text-gray-900"
                  >
                    <option value="">Custom Venue Rental Only (No Food Package)</option>
                    {db.packages.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (৳{p.price.toLocaleString()}/person)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Client Info */}
              <div className="pt-2 border-t border-gray-200">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">Organizer & Contact Person</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={editClientName}
                      onChange={(e) => setEditClientName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Company / Organization</label>
                    <input
                      type="text"
                      value={editClientCompany}
                      onChange={(e) => setEditClientCompany(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={editClientPhone}
                      onChange={(e) => setEditClientPhone(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editClientEmail}
                      onChange={(e) => setEditClientEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Special Operational Notes / Event Remarks</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Additional setup guidelines, guest preferences, or billing instructions..."
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-900 hover:bg-indigo-950 text-white font-bold rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
                >
                  Save Event Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 5: CANCEL BANQUET EVENT                                       */}
      {/* =================================================================== */}
      {cancellingEvent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-rose-700 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-white" />
                <h3 className="font-bold text-base">Cancel Event: {cancellingEvent.eventNumber}</h3>
              </div>
              <button onClick={() => setCancellingEvent(null)} className="text-rose-200 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                <div className="font-bold text-sm text-rose-950">{cancellingEvent.eventName}</div>
                <div>Venue: <strong>{cancellingEvent.hallName}</strong></div>
                <div>Scheduled: <strong>{cancellingEvent.eventDate} ({cancellingEvent.startTime} - {cancellingEvent.endTime})</strong></div>
                <div>Organizer: <strong>{cancellingEvent.clientName} {cancellingEvent.clientCompany ? `(${cancellingEvent.clientCompany})` : ''}</strong></div>
                <div>Total Bill: <strong className="font-mono">৳{(cancellingEvent.total || 0).toLocaleString()}</strong> | Deposit Paid: <strong className="font-mono text-emerald-800">৳{(cancellingEvent.deposit || 0).toLocaleString()}</strong></div>
              </div>

              <div className="text-gray-600">
                Are you sure you want to cancel this banquet event? The hall schedule will be immediately liberated for other bookings, and the booking status will be updated to <strong>Cancelled</strong>.
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Cancellation Reason Preset</label>
                <select
                  value={cancelReasonPreset}
                  onChange={(e) => setCancelReasonPreset(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white font-medium text-gray-900"
                >
                  <option value="Client Requested Cancellation">Client Requested Cancellation</option>
                  <option value="Rescheduled / Postponed to Future Date">Rescheduled / Postponed to Future Date</option>
                  <option value="Non-payment of Advance Deposit">Non-payment of Advance Deposit</option>
                  <option value="Inclement Weather / Force Majeure">Inclement Weather / Force Majeure</option>
                  <option value="Client Internal Operational Changes">Client Internal Operational Changes</option>
                  <option value="Duplicate Booking Entry">Duplicate Booking Entry</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Additional Remarks / Custom Reason</label>
                <input
                  type="text"
                  placeholder="Optional custom explanation..."
                  value={cancelReasonCustom}
                  onChange={(e) => setCancelReasonCustom(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setCancellingEvent(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Keep Event
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelEvent}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
                >
                  Confirm Event Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 6: EDIT FUNCTION SHEET (BEO)                                  */}
      {/* =================================================================== */}
      {showBeoModal && beoTargetEvent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            <div className="p-4 bg-purple-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-200" />
                <div>
                  <h3 className="font-bold text-base">Edit BEO Function Sheet: {beoTargetEvent.eventNumber}</h3>
                  <p className="text-xs text-purple-200">{beoTargetEvent.eventName} • {beoTargetEvent.hallName} ({beoTargetEvent.eventDate})</p>
                </div>
              </div>
              <button onClick={() => setShowBeoModal(false)} className="text-purple-200 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalBEO} className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Venue & Seating Section */}
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 space-y-3">
                <div className="font-bold text-purple-950 text-sm flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-900" />
                  Hall Setup & Seating Architecture
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Seating & Layout Style</label>
                    <select
                      value={modalBeoSetupStyle}
                      onChange={(e) => setModalBeoSetupStyle(e.target.value as any)}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white font-medium text-xs text-gray-900"
                    >
                      <option value="Banquet">Round Banquet Tables (8-10 Pax/Table)</option>
                      <option value="Theatre">Theatre Style (Row Seating facing Stage)</option>
                      <option value="Classroom">Classroom Style (Desks & Chairs)</option>
                      <option value="U-Shape">U-Shape Executive Conference</option>
                      <option value="Boardroom">Central Hollow Boardroom</option>
                      <option value="Cocktail / Standing">High-Top Standing Cocktail Lounge</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Banquet Captain / Supervisor</label>
                    <input
                      type="text"
                      value={modalBeoSupervisor}
                      onChange={(e) => setModalBeoSupervisor(e.target.value)}
                      placeholder="e.g. Anisur Rahman (Banquet Manager)"
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white text-xs text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* AV Requirements Checklist */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-purple-900" />
                  Audio / Visual & Stage Production Equipment
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
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
                    const isChecked = modalBeoAvRequirements.includes(item);
                    return (
                      <label
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                          isChecked ? 'bg-purple-100/60 border-purple-300 text-purple-950 font-semibold' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleModalBeoAvRequirement(item)}
                          className="rounded text-purple-900 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>{item}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Catering Timeline & Kitchen Notes */}
              <div className="space-y-3">
                <div className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-purple-900" />
                  Meal & Refreshment Service Timeline
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 block mb-1">Welcome Refreshments</label>
                    <input
                      type="text"
                      value={modalBeoWelcomeTime}
                      onChange={(e) => setModalBeoWelcomeTime(e.target.value)}
                      placeholder="10:00 AM"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 block mb-1">Grand Buffet Meal Service</label>
                    <input
                      type="text"
                      value={modalBeoMealTime}
                      onChange={(e) => setModalBeoMealTime(e.target.value)}
                      placeholder="01:30 PM"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 block mb-1">Evening Tea & Snacks</label>
                    <input
                      type="text"
                      value={modalBeoTeaTime}
                      onChange={(e) => setModalBeoTeaTime(e.target.value)}
                      placeholder="04:30 PM"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Kitchen & Service Instructions</label>
                  <textarea
                    rows={2}
                    value={modalBeoKitchenNotes}
                    onChange={(e) => setModalBeoKitchenNotes(e.target.value)}
                    placeholder="Buffet warming instructions, replenish cadence, live counter setup..."
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Special Production & VIP Dais Setup Instructions</label>
                <textarea
                  rows={2}
                  value={modalBeoSpecialInstructions}
                  onChange={(e) => setModalBeoSpecialInstructions(e.target.value)}
                  placeholder="Elevated dais, customized LED screen welcome slide, guest seat allocation..."
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowBeoModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
                >
                  Save Function Sheet (BEO)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
