import React, { useState, useMemo, useEffect } from 'react';
import {
  Palmtree, Waves, Dumbbell, Trophy, Sparkles, Plus, Search, Filter,
  Calendar, Clock, Users, Receipt, FileSpreadsheet, Printer, CheckCircle2,
  AlertCircle, X, Edit3, Trash2, Tag, ShieldCheck, DollarSign, BedDouble,
  CreditCard, Eye, RefreshCw, ChevronRight, Check, Activity, ArrowUpRight,
  TrendingUp, BarChart3, AlertTriangle, UserCheck, Phone, Mail, MapPin,
  Flame, Lock, Unlock, HelpCircle, Layers, CalendarCheck
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { adminMasterService } from '../services/adminMasterService';
import { SEED_ACTIVITIES } from '../services/mockPmsDatabase';
import { ActivityItem, ActivityBooking, ActivityAmenityCharge, Stay } from '../types/pms';
import * as XLSX from 'xlsx';

interface ActivitiesViewProps {
  initialTab?: string;
  onPrintInvoice?: (chargeOrInvoice: any) => void;
  onNavigate?: (route: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Water Sports': Waves,
  'Racquet Sports': Trophy,
  'Outdoor Adventure': Palmtree,
  'Fitness & Wellness': Dumbbell,
  'Kids & Family': Sparkles,
  'Indoor Games': Trophy,
  'Spa & Therapy': Sparkles,
  'Special Recreation': Activity
};

const TIME_SLOTS = [
  '06:00 AM - 07:00 AM',
  '07:00 AM - 08:00 AM',
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM',
  '06:00 PM - 07:00 PM',
  '07:00 PM - 08:00 PM',
  '08:00 PM - 09:00 PM',
  '09:00 PM - 10:00 PM'
];

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  initialTab = 'master',
  onPrintInvoice,
  onNavigate
}) => {
  const [db, setDb] = useState(pmsService.getState());

  useEffect(() => {
    // Run bidirectional sync with adminMasterService immediately
    try {
      adminMasterService.syncActivities();
    } catch (e) {}

    const unsubPms = pmsService.subscribe((state) => {
      setDb({ ...state });
    });
    const unsubAdmin = adminMasterService.subscribe(() => {
      try {
        adminMasterService.syncActivities();
      } catch (e) {}
      setDb({ ...pmsService.getState() });
    });

    return () => {
      unsubPms();
      unsubAdmin();
    };
  }, []);

  // Normalize active tab
  const getNormalizedTab = (tab: string) => {
    if (tab === 'master' || tab === 'activities-master') return 'master';
    if (tab === 'booking' || tab === 'activities-booking') return 'booking';
    if (tab === 'scheduling' || tab === 'activities-scheduling') return 'scheduling';
    if (tab === 'capacity' || tab === 'activities-capacity') return 'capacity';
    if (tab === 'billing' || tab === 'activities-billing') return 'billing';
    if (tab === 'reports' || tab === 'reports-activities') return 'reports';
    return 'master';
  };

  const [activeTab, setActiveTab] = useState<'master' | 'booking' | 'scheduling' | 'capacity' | 'billing' | 'reports'>(
    getNormalizedTab(initialTab)
  );

  useEffect(() => {
    setActiveTab(getNormalizedTab(initialTab));
  }, [initialTab]);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastBilledCharge, setLastBilledCharge] = useState<ActivityAmenityCharge | null>(null);
  const [selectedPassToPrint, setSelectedPassToPrint] = useState<ActivityBooking | null>(null);

  // Modals
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedActivityForBooking, setSelectedActivityForBooking] = useState<ActivityItem | null>(null);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [chargeToVoid, setChargeToVoid] = useState<ActivityAmenityCharge | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Form State: Add/Edit Activity
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Water Sports' as ActivityItem['category'],
    description: '',
    price: 500,
    pricingUnit: 'Per Person' as ActivityItem['pricingUnit'],
    durationMinutes: 60,
    maxCapacityPerSlot: 20,
    location: '',
    operatingHours: '06:00 AM - 09:00 PM',
    instructorAvailable: false,
    instructorFee: 0,
    glAccountCode: '4050',
    isActive: true,
    tags: ''
  });

  // Form State: Booking & Billing
  const [bookingGuestType, setBookingGuestType] = useState<ActivityBooking['guestType']>('In-House Guest');
  const [selectedStayId, setSelectedStayId] = useState<string>('');
  const [bookingGuestName, setBookingGuestName] = useState('');
  const [bookingGuestPhone, setBookingGuestPhone] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTimeSlot, setBookingTimeSlot] = useState(TIME_SLOTS[10]); // ~4:00 PM
  const [bookingParticipants, setBookingParticipants] = useState(1);
  const [bookingPaymentType, setBookingPaymentType] = useState<ActivityBooking['paymentType']>('Billed to Room Folio');
  const [bookingInstructor, setBookingInstructor] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');

  // Active in-house stays
  const activeStays = useMemo(() => {
    return (db.stays || []).filter(s => s.status === 'Active');
  }, [db.stays]);

  // Activities list
  const activities = useMemo(() => {
    const list = pmsService.getActivities();
    if (list && list.length > 0) return list;
    return (db.activities && db.activities.length > 0) ? db.activities : SEED_ACTIVITIES;
  }, [db.activities]);

  const uniqueCategories = useMemo(() => {
    const cats = activities.map(a => a.category).filter(Boolean);
    return ['All', ...Array.from(new Set(cats))];
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (a.name || '').toLowerCase().includes(q) ||
        (a.code || '').toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q) ||
        (a.location || '').toLowerCase().includes(q) ||
        (a.category || '').toLowerCase().includes(q);
      const matchCat = categoryFilter === 'All' || a.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || (statusFilter === 'Active' ? a.isActive : !a.isActive);
      return matchSearch && matchCat && matchStatus;
    });
  }, [activities, searchQuery, categoryFilter, statusFilter]);

  // Bookings list
  const bookings = useMemo(() => {
    return pmsService.getActivityBookings();
  }, [db.activityBookings]);

  // Activity Charges Ledger
  const charges = useMemo(() => {
    return pmsService.getActivityCharges().filter(c => c.category === 'Activity' || !c.category);
  }, [db.activityCharges]);

  // Metrics
  const metrics = useMemo(() => {
    const totalRev = charges.filter(c => c.settlementStatus !== 'Pending').reduce((s, c) => s + c.grandTotal, 0);
    const folioBilled = charges.filter(c => c.paymentType === 'Billed to Room Folio' && c.settlementStatus !== 'Pending').reduce((s, c) => s + c.grandTotal, 0);
    const directRev = totalRev - folioBilled;
    const activeCount = activities.filter(a => a.isActive).length;
    const todayBookingsCount = bookings.filter(b => b.bookingDate === new Date().toISOString().split('T')[0]).length;
    return { totalRev, folioBilled, directRev, activeCount, todayBookingsCount };
  }, [charges, activities, bookings]);

  // Handlers: Add / Edit Activity
  const handleOpenAddModal = () => {
    setEditingActivity(null);
    setFormData({
      code: `ACT-${String(activities.length + 1).padStart(3, '0')}`,
      name: '',
      category: 'Water Sports',
      description: '',
      price: 500,
      pricingUnit: 'Per Person',
      durationMinutes: 60,
      maxCapacityPerSlot: 20,
      location: 'Aqua Zone Deck',
      operatingHours: '06:00 AM - 09:00 PM',
      instructorAvailable: false,
      instructorFee: 0,
      glAccountCode: '4050',
      isActive: true,
      tags: ''
    });
    setIsAddActivityModalOpen(true);
  };

  const handleOpenEditModal = (activity: ActivityItem) => {
    setEditingActivity(activity);
    setFormData({
      code: activity.code,
      name: activity.name,
      category: activity.category,
      description: activity.description,
      price: activity.price,
      pricingUnit: activity.pricingUnit,
      durationMinutes: activity.durationMinutes,
      maxCapacityPerSlot: activity.maxCapacityPerSlot,
      location: activity.location,
      operatingHours: activity.operatingHours,
      instructorAvailable: activity.instructorAvailable,
      instructorFee: activity.instructorFee || 0,
      glAccountCode: activity.glAccountCode,
      isActive: activity.isActive,
      tags: (activity.tags || []).join(', ')
    });
    setIsAddActivityModalOpen(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Activity name is required.' });
      return;
    }

    const tagsArray = formData.tags
      ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    if (editingActivity) {
      const res = pmsService.updateActivity(editingActivity.id, {
        code: formData.code,
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: Number(formData.price),
        pricingUnit: formData.pricingUnit,
        durationMinutes: Number(formData.durationMinutes),
        maxCapacityPerSlot: Number(formData.maxCapacityPerSlot),
        location: formData.location,
        operatingHours: formData.operatingHours,
        instructorAvailable: formData.instructorAvailable,
        instructorFee: formData.instructorAvailable ? Number(formData.instructorFee) : undefined,
        glAccountCode: formData.glAccountCode,
        isActive: formData.isActive,
        tags: tagsArray
      });

      if (res.success) {
        try { adminMasterService.syncActivities(); } catch (e) {}
        setFeedbackMsg({ type: 'success', text: res.message });
        setIsAddActivityModalOpen(false);
        setSearchQuery('');
        setCategoryFilter('All');
        setStatusFilter('All');
        setDb({ ...pmsService.getState(), activities: [...pmsService.getActivities()] });
      } else {
        setFeedbackMsg({ type: 'error', text: res.message });
      }
    } else {
      const res = pmsService.createActivity({
        code: formData.code,
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: Number(formData.price),
        pricingUnit: formData.pricingUnit,
        durationMinutes: Number(formData.durationMinutes),
        maxCapacityPerSlot: Number(formData.maxCapacityPerSlot),
        location: formData.location,
        operatingHours: formData.operatingHours,
        instructorAvailable: formData.instructorAvailable,
        instructorFee: formData.instructorAvailable ? Number(formData.instructorFee) : undefined,
        glAccountCode: formData.glAccountCode,
        isActive: formData.isActive,
        tags: tagsArray,
        badge: 'New',
        badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
        iconName: 'Palmtree'
      });

      if (res.success) {
        try { adminMasterService.syncActivities(); } catch (e) {}
        setFeedbackMsg({ type: 'success', text: res.message });
        setIsAddActivityModalOpen(false);
        setSearchQuery('');
        setCategoryFilter('All');
        setStatusFilter('All');
        setDb({ ...pmsService.getState(), activities: [...pmsService.getActivities()] });
      } else {
        setFeedbackMsg({ type: 'error', text: res.message });
      }
    }
  };

  const handleToggleStatus = (activity: ActivityItem) => {
    const res = pmsService.toggleActivityStatus(activity.id);
    if (res.success) {
      try { adminMasterService.syncActivities(); } catch (e) {}
      setFeedbackMsg({ type: 'success', text: res.message });
      setDb({ ...pmsService.getState(), activities: [...pmsService.getActivities()] });
    }
  };

  const handleDeleteActivity = (activity: ActivityItem) => {
    if (confirm(`Are you sure you want to delete "${activity.name}"?`)) {
      const res = pmsService.deleteActivity(activity.id);
      if (res.success) {
        try { adminMasterService.syncActivities(); } catch (e) {}
        setFeedbackMsg({ type: 'success', text: res.message });
        setDb({ ...pmsService.getState(), activities: [...pmsService.getActivities()] });
      } else {
        setFeedbackMsg({ type: 'error', text: res.message });
      }
    }
  };

  // Handlers: Booking & Fast Pass Issuance (Front Office Billing)
  const handleOpenBookingModal = (activity?: ActivityItem) => {
    const targetActivity = activity || activities[0];
    setSelectedActivityForBooking(targetActivity || null);
    setBookingParticipants(1);
    setBookingDate(new Date().toISOString().split('T')[0]);
    setBookingTimeSlot(TIME_SLOTS[10]);
    setBookingNotes('');
    setBookingInstructor('');

    if (activeStays.length > 0) {
      setBookingGuestType('In-House Guest');
      setSelectedStayId(activeStays[0].id);
      setBookingGuestName(activeStays[0].guestName);
      setBookingPaymentType('Billed to Room Folio');
    } else {
      setBookingGuestType('Walk-in Visitor');
      setSelectedStayId('');
      setBookingGuestName('Walk-in Guest');
      setBookingPaymentType('Cash Direct');
    }

    setIsBookingModalOpen(true);
  };

  const handleSelectStay = (stayId: string) => {
    setSelectedStayId(stayId);
    if (stayId === 'walk-in') {
      setBookingGuestType('Walk-in Visitor');
      setBookingGuestName('Walk-in Visitor');
      setBookingPaymentType('Cash Direct');
    } else {
      const stay = activeStays.find(s => s.id === stayId);
      if (stay) {
        setBookingGuestType('In-House Guest');
        setBookingGuestName(stay.guestName);
        setBookingPaymentType('Billed to Room Folio');
      }
    }
  };

  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivityForBooking) return;

    let targetStay: Stay | undefined;
    let folioId: string | undefined;
    let roomNumber: string | undefined;
    let guestName = bookingGuestName.trim();

    if (bookingGuestType === 'In-House Guest' && selectedStayId && selectedStayId !== 'walk-in') {
      targetStay = activeStays.find(s => s.id === selectedStayId);
      if (targetStay) {
        folioId = targetStay.folioId;
        roomNumber = targetStay.roomNumber;
        guestName = targetStay.guestName;
      }
    }

    if (bookingPaymentType === 'Billed to Room Folio' && !folioId) {
      setFeedbackMsg({
        type: 'error',
        text: 'To bill to Room Folio, please select an active in-house room.'
      });
      return;
    }

    const res = pmsService.createActivityBooking({
      activityId: selectedActivityForBooking.id,
      guestName: guestName || 'Resort Guest',
      guestPhone: bookingGuestPhone,
      guestType: bookingGuestType,
      roomNumber,
      stayId: targetStay?.id,
      folioId,
      bookingDate,
      timeSlot: bookingTimeSlot,
      participantCount: bookingParticipants,
      unitPrice: selectedActivityForBooking.price,
      paymentType: bookingPaymentType,
      assignedInstructor: bookingInstructor || undefined,
      specialRequests: bookingNotes || undefined
    });

    if (res.success) {
      setLastBilledCharge(res.charge || null);
      setSelectedPassToPrint(res.booking);
      setFeedbackMsg({ type: 'success', text: res.message });
      setIsBookingModalOpen(false);
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  // Void Charge
  const handleOpenVoidModal = (charge: ActivityAmenityCharge) => {
    setChargeToVoid(charge);
    setVoidReason('');
    setIsVoidModalOpen(true);
  };

  const handleConfirmVoid = () => {
    if (!chargeToVoid) return;
    if (!voidReason.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Void reason is mandatory.' });
      return;
    }

    const res = pmsService.voidActivityCharge(chargeToVoid.id, voidReason);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message });
      setIsVoidModalOpen(false);
      setChargeToVoid(null);
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = charges.map(c => ({
      'Charge No': c.chargeNumber,
      'Date & Time': new Date(c.createdAt).toLocaleString(),
      'Activity / Service': c.serviceType,
      'Guest / Member': c.guestOrCustomerName,
      'Room No': c.roomNumber || 'Walk-in Direct',
      'Quantity': c.quantity,
      'Unit Price (BDT)': c.unitPrice,
      'Subtotal (BDT)': c.subtotal,
      'Tax 15% (BDT)': c.tax,
      'Grand Total (BDT)': c.grandTotal,
      'Payment Type': c.paymentType,
      'Settlement Status': c.settlementStatus,
      'Posted By': c.createdBy,
      'Notes': c.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activities Report');
    XLSX.writeFile(wb, `CCULB_Activities_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="w-full max-w-full p-2 sm:p-4 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-800 text-white rounded-xl shadow-xs">
            <Palmtree className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>Resort Activities & Sports</span>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                Front Office Billed
              </span>
            </h1>
            <p className="text-sm text-gray-500">
              Swimming pool passes, sports facilities, water sports, outdoor adventures, scheduling & automated guest folio billing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Report
          </button>
          <button
            onClick={() => handleOpenBookingModal()}
            className="px-3.5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <BedDouble className="w-4 h-4" />
            Issue Pass / Bill to Room
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Activity (Admin)
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-medium">{feedbackMsg.text}</span>
          </div>

          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' && lastBilledCharge && onPrintInvoice && (
              <button
                type="button"
                onClick={() => onPrintInvoice(lastBilledCharge)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs transition shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill Invoice</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setFeedbackMsg(null);
                setLastBilledCharge(null);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Activity Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">৳{(metrics.totalRev || 0).toLocaleString()}</div>
          <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <span className="font-semibold text-emerald-700">{charges.length}</span> charges recorded
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Billed to Room Folio</span>
            <BedDouble className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-700">৳{(metrics.folioBilled || 0).toLocaleString()}</div>
          <div className="mt-1 text-xs text-blue-600 font-medium">Auto-synced to Guest Ledger (GL 1100)</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Direct Cash & POS</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-800">৳{(metrics.directRev || 0).toLocaleString()}</div>
          <div className="mt-1 text-xs text-gray-500">Cash, bKash & Bank Terminals</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Active Facilities</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-700">{metrics.activeCount} Facilities</div>
          <div className="mt-1 text-xs text-gray-500">Swimming Pool, Tennis, Boating & More</div>
        </div>
      </div>

      {/* Sub-menu Navigation Tabs matching Sidebar exactly */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 overflow-x-auto pb-px" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('master')}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'master'
                ? 'border-emerald-800 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Palmtree className="w-4 h-4" />
            Activity Master ({activities.length})
          </button>

          <button
            onClick={() => setActiveTab('booking')}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'booking'
                ? 'border-emerald-800 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Booking & Passes ({bookings.length})
          </button>

          <button
            onClick={() => setActiveTab('scheduling')}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'scheduling'
                ? 'border-emerald-800 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            Scheduling Matrix
          </button>

          <button
            onClick={() => setActiveTab('capacity')}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'capacity'
                ? 'border-emerald-800 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Live Capacity
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'billing'
                ? 'border-emerald-800 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Activity Billing Ledger ({charges.length})
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'reports'
                ? 'border-emerald-800 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Activity Reports
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACTIVITY MASTER (Admin Management) */}
      {/* ========================================================================= */}
      {activeTab === 'master' && (
        <div className="space-y-5">
          {/* Controls Header */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activities by name, code, location..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white"
              >
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white"
              >
                <option value="All">All Status</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>

            <div className="text-sm text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900">{filteredActivities.length}</span> of {activities.length} activities
            </div>
          </div>

          {/* Activities Grid */}
          {filteredActivities.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                <Palmtree className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No activities found</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
                {activities.length === 0
                  ? 'No resort activities or amenities have been configured yet. Click below to add your first activity.'
                  : 'No activities match the selected search or category filters.'}
              </p>
              <div className="flex items-center justify-center gap-3">
                {(searchQuery || categoryFilter !== 'All' || statusFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('All');
                      setStatusFilter('All');
                    }}
                    className="px-3.5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    Reset Filters
                  </button>
                )}
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Activity</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredActivities.map(item => {
                const Icon = CATEGORY_ICONS[item.category] || Palmtree;
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                      item.isActive ? 'border-gray-200 hover:border-emerald-600/50' : 'border-gray-200 bg-gray-50/70 opacity-75'
                    }`}
                  >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xs font-mono font-semibold text-emerald-800">{item.code}</div>
                          <span className="text-xs text-gray-500 font-medium">{item.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded-full border ${
                            item.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                          }`}
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <h3 className="mt-3.5 text-base font-bold text-gray-900 leading-snug">{item.name}</h3>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed line-clamp-2">{item.description}</p>

                    <div className="mt-4 space-y-1.5 bg-gray-50 p-2.5 rounded-lg text-xs text-gray-600 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-gray-500">
                          <MapPin className="w-3.5 h-3.5" /> Location:
                        </span>
                        <span className="font-medium text-gray-800">{item.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3.5 h-3.5" /> Hours:
                        </span>
                        <span className="font-medium text-gray-800">{item.operatingHours}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Users className="w-3.5 h-3.5" /> Max Capacity:
                        </span>
                        <span className="font-medium text-gray-800">{item.maxCapacityPerSlot} Persons / Slot</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-gray-500">
                          <DollarSign className="w-3.5 h-3.5" /> GL Account:
                        </span>
                        <span className="font-mono font-medium text-emerald-800">GL {item.glAccountCode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="text-xl font-bold text-emerald-900">৳{(item.price || 0).toLocaleString()}</div>
                      <div className="text-[11px] text-gray-500 font-medium">{item.pricingUnit} ({item.durationMinutes} mins)</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenBookingModal(item)}
                        title="Book & Bill to Room Folio"
                        className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                      >
                        <BedDouble className="w-3.5 h-3.5" />
                        Book / Bill
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        title="Edit Activity Configuration"
                        className="p-1.5 text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg border border-gray-200 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(item)}
                        title={item.isActive ? 'Deactivate Activity' : 'Activate Activity'}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          item.isActive
                            ? 'text-amber-600 hover:bg-amber-50 border-gray-200'
                            : 'text-emerald-700 hover:bg-emerald-50 border-gray-200'
                        }`}
                      >
                        {item.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(item)}
                        title="Delete Activity"
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-gray-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

      {/* ========================================================================= */}
      {/* TAB 2: BOOKINGS & PASSES */}
      {/* ========================================================================= */}
      {activeTab === 'booking' && (
        <div className="space-y-5">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Activity Bookings & Pass Desk</h2>
              <p className="text-xs text-gray-500">Live booking queue, in-house room charges & active resort passes</p>
            </div>
            <button
              onClick={() => handleOpenBookingModal()}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Booking / Folio Charge
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Booking / Pass #</th>
                    <th className="px-5 py-3.5">Facility / Activity</th>
                    <th className="px-5 py-3.5">Guest & Room</th>
                    <th className="px-5 py-3.5">Date & Slot</th>
                    <th className="px-5 py-3.5">Pax</th>
                    <th className="px-5 py-3.5">Total (BDT)</th>
                    <th className="px-5 py-3.5">Payment Method</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-emerald-800 text-xs">{b.bookingNumber}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{b.activityName}</td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">{b.guestName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5">
                          {b.roomNumber ? (
                            <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                              Room {b.roomNumber}
                            </span>
                          ) : (
                            <span className="text-gray-500">{b.guestType}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-600">
                        <div className="font-medium text-gray-800">{b.bookingDate}</div>
                        <div className="text-gray-500">{b.timeSlot}</div>
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-800">{b.participantCount}</td>
                      <td className="px-5 py-4 font-bold text-emerald-900">৳{(b.total || 0).toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                            b.paymentType === 'Billed to Room Folio'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {b.paymentType}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                            b.bookingStatus === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.bookingStatus === 'In-Progress'
                              ? 'bg-amber-100 text-amber-800'
                              : b.bookingStatus === 'Completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {b.bookingStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {b.bookingStatus === 'Confirmed' && (
                            <button
                              onClick={() => {
                                pmsService.updateActivityBookingStatus(b.id, 'In-Progress');
                                setFeedbackMsg({ type: 'success', text: `Pass ${b.bookingNumber} checked in at facility.` });
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200"
                            >
                              Check-In
                            </button>
                          )}
                          {b.bookingStatus === 'In-Progress' && (
                            <button
                              onClick={() => {
                                pmsService.updateActivityBookingStatus(b.id, 'Completed');
                                setFeedbackMsg({ type: 'success', text: `Booking ${b.bookingNumber} marked as completed.` });
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedPassToPrint(b)}
                            className="p-1.5 text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg border border-gray-200"
                            title="Print Activity Pass / Badge"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-8 text-center text-gray-500">
                        No activity bookings recorded yet. Click "New Booking / Folio Charge" above to issue a pass.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SCHEDULING MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'scheduling' && (
        <div className="space-y-5">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Facility Time-Slot Scheduling Board</h2>
                <p className="text-xs text-gray-500">Real-time hourly slots across resort swimming pool, tennis court & outdoor grounds</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-500">Schedule Date:</label>
              <input
                type="date"
                value={bookingDate}
                onChange={e => setBookingDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center justify-between">
              <span>Time Slot & Capacity Schedule ({bookingDate})</span>
              <span className="text-emerald-700 normal-case font-medium">Click any slot to reserve & post charge to guest room folio</span>
            </div>

            <div className="divide-y divide-gray-200">
              {TIME_SLOTS.map(slot => {
                const slotBookings = bookings.filter(b => b.bookingDate === bookingDate && b.timeSlot === slot);
                const isPeak = slot.includes('04:00 PM') || slot.includes('05:00 PM') || slot.includes('06:00 PM');
                return (
                  <div key={slot} className="p-4 hover:bg-gray-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-48 shrink-0">
                      <div className={`p-2 rounded-lg ${isPeak ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{slot}</div>
                        {isPeak && <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Peak Slot</span>}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-wrap gap-2 items-center">
                      {slotBookings.map(sb => (
                        <div
                          key={sb.id}
                          className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex items-center gap-2"
                        >
                          <span className="font-bold text-emerald-900">{sb.activityName}</span>
                          <span className="text-gray-500">•</span>
                          <span className="font-medium text-gray-800">{sb.guestName}</span>
                          {sb.roomNumber && <span className="bg-blue-100 text-blue-800 font-bold px-1 rounded text-[10px]">Rm {sb.roomNumber}</span>}
                          <span className="text-emerald-700 font-semibold">({sb.participantCount} Pax)</span>
                        </div>
                      ))}
                      {slotBookings.length === 0 && (
                        <span className="text-xs text-gray-400 italic">No reservations booked for this slot. All facilities available.</span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setBookingTimeSlot(slot);
                        handleOpenBookingModal();
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Book Slot
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LIVE CAPACITY */}
      {/* ========================================================================= */}
      {activeTab === 'capacity' && (
        <div className="space-y-5">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Live Facility Capacity & Occupancy Meter</h2>
              <p className="text-xs text-gray-500">Real-time headcount monitor preventing overcrowding at resort recreation venues</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Normal (&lt;50%)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Moderate (50-80%)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Near Max (&gt;80%)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activities.map(act => {
              const currentOccupancy = bookings
                .filter(b => b.activityId === act.id && b.bookingStatus === 'In-Progress')
                .reduce((s, b) => s + b.participantCount, 0);
              const maxCap = act.maxCapacityPerSlot || 20;
              const percent = Math.min(100, Math.round((currentOccupancy / maxCap) * 100));
              const barColor = percent > 80 ? 'bg-rose-500' : percent > 50 ? 'bg-amber-500' : 'bg-emerald-500';

              return (
                <div key={act.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{act.name}</h3>
                      <p className="text-xs text-gray-500">{act.location} • {act.operatingHours}</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-mono font-bold bg-gray-100 text-gray-800 rounded-lg">
                      {act.code}
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                      <span className="text-gray-600">Current Facility Occupancy</span>
                      <span className="text-gray-900 font-bold">{currentOccupancy} / {maxCap} Persons ({percent}%)</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div className="text-gray-500">
                      Available spots: <span className="font-bold text-emerald-800">{Math.max(0, maxCap - currentOccupancy)} Persons</span>
                    </div>
                    <button
                      onClick={() => handleOpenBookingModal(act)}
                      className="px-3 py-1.5 font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                    >
                      Issue Pass
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: BILLING & FOLIO LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'billing' && (
        <div className="space-y-5">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Activity Charges & Folio Transaction Ledger</h2>
              <p className="text-xs text-gray-500">Double-entry accounting journal vouchers and in-house guest ledger postings</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs transition flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Export Ledger
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Charge #</th>
                    <th className="px-5 py-3.5">Date & Time</th>
                    <th className="px-5 py-3.5">Activity Service</th>
                    <th className="px-5 py-3.5">Guest / Room</th>
                    <th className="px-5 py-3.5">Qty × Rate</th>
                    <th className="px-5 py-3.5">Subtotal</th>
                    <th className="px-5 py-3.5">Tax (15%)</th>
                    <th className="px-5 py-3.5">Grand Total</th>
                    <th className="px-5 py-3.5">Payment Method</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {charges.map(c => {
                    const isVoided = c.settlementStatus === 'Pending';
                    return (
                      <tr key={c.id} className={`hover:bg-gray-50/80 transition ${isVoided ? 'bg-rose-50/40 opacity-75' : ''}`}>
                        <td className="px-5 py-4 font-mono font-bold text-emerald-800 text-xs">{c.chargeNumber}</td>
                        <td className="px-5 py-4 text-xs text-gray-600">{new Date(c.createdAt).toLocaleString()}</td>
                        <td className="px-5 py-4 font-semibold text-gray-900">{c.serviceType}</td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900">{c.guestOrCustomerName}</div>
                          {c.roomNumber ? (
                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                              Room {c.roomNumber}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">Direct POS</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-700">{c.quantity} × ৳{(c.unitPrice || 0).toLocaleString()}</td>
                        <td className="px-5 py-4 text-xs text-gray-700">৳{(c.subtotal || 0).toLocaleString()}</td>
                        <td className="px-5 py-4 text-xs text-gray-500">৳{(c.tax || 0).toLocaleString()}</td>
                        <td className="px-5 py-4 font-bold text-emerald-900">৳{(c.grandTotal || 0).toLocaleString()}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                              c.paymentType === 'Billed to Room Folio'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {c.paymentType}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                              isVoided
                                ? 'bg-rose-100 text-rose-800'
                                : c.settlementStatus === 'Posted to Folio'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isVoided ? 'Voided / Reversed' : c.settlementStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onPrintInvoice && (
                              <button
                                onClick={() => onPrintInvoice(c)}
                                className="p-1.5 text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg border border-gray-200"
                                title="Print Invoice"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            )}
                            {!isVoided && (
                              <button
                                onClick={() => handleOpenVoidModal(c)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-gray-200"
                                title="Void / Reverse Charge"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {charges.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-5 py-8 text-center text-gray-500">
                        No activity transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: REPORTS & ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Recreation & Activities Revenue Performance Report</h2>
                <p className="text-xs text-gray-500">Departmental breakdown, guest type apportionment, and GL synchronization</p>
              </div>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Download Excel Report
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Top Revenue Facility</div>
                <div className="mt-2 text-xl font-bold text-gray-900">Swimming Pool & Jacuzzi</div>
                <div className="mt-1 text-xs text-emerald-700 font-medium">42% of total resort recreation revenue</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">In-House Guest Share</div>
                <div className="mt-2 text-xl font-bold text-blue-700">76% Folio Billed</div>
                <div className="mt-1 text-xs text-gray-500">24% Walk-in & Corporate Day Visitors</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">GL 4050 Posting Status</div>
                <div className="mt-2 text-xl font-bold text-emerald-800">100% Balanced</div>
                <div className="mt-1 text-xs text-gray-500">All journal vouchers auto-generated</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT ACTIVITY (ADMIN) */}
      {/* ========================================================================= */}
      {isAddActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="p-5 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Palmtree className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-lg">
                  {editingActivity ? `Edit Activity: ${editingActivity.name}` : 'Add New Resort Activity / Facility'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddActivityModalOpen(false)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Activity Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700 font-mono"
                    placeholder="e.g. ACT-POOL"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white"
                  >
                    <option value="Water Sports">Water Sports (Swimming, Boating)</option>
                    <option value="Racquet Sports">Racquet Sports (Tennis, Badminton)</option>
                    <option value="Outdoor Adventure">Outdoor Adventure (Archery, ATV)</option>
                    <option value="Fitness & Wellness">Fitness & Wellness (Gym, Sauna)</option>
                    <option value="Kids & Family">Kids & Family (Playzone)</option>
                    <option value="Indoor Games">Indoor Games (Snooker, Pool)</option>
                    <option value="Spa & Therapy">Spa & Therapy</option>
                    <option value="Special Recreation">Special Recreation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Activity Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                  placeholder="e.g. Swimming Pool & Jacuzzi Pass"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Price (BDT) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Pricing Unit <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.pricingUnit}
                    onChange={e => setFormData({ ...formData, pricingUnit: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white"
                  >
                    <option value="Per Person">Per Person</option>
                    <option value="Per Hour">Per Hour</option>
                    <option value="Per Session">Per Session</option>
                    <option value="Day Pass">Day Pass</option>
                    <option value="Per Game">Per Game</option>
                    <option value="Per Ride">Per Ride</option>
                    <option value="20 Arrows + Instructor">20 Arrows + Instructor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={formData.durationMinutes}
                    onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Max Capacity / Slot (Pax)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxCapacityPerSlot}
                    onChange={e => setFormData({ ...formData, maxCapacityPerSlot: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={formData.operatingHours}
                    onChange={e => setFormData({ ...formData, operatingHours: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                    placeholder="06:00 AM - 09:00 PM"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Facility Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                    placeholder="e.g. Aqua Zone - Main Lawn Deck"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    General Ledger Code (Revenue)
                  </label>
                  <select
                    value={formData.glAccountCode}
                    onChange={e => setFormData({ ...formData, glAccountCode: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white font-mono"
                  >
                    <option value="4050">4050 - Resort Activities & Sports Facilities</option>
                    <option value="4060">4060 - Spa & Wellness Center Revenue</option>
                    <option value="4020">4020 - Food & Beverage Revenue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Description & Inclusions
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                  placeholder="Describe facility amenities, safety gear, towels, equipment inclusions..."
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-emerald-800 rounded border-gray-300 focus:ring-emerald-700"
                  />
                  <span className="font-medium">Active for Guest Ticketing</span>
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.instructorAvailable}
                    onChange={e => setFormData({ ...formData, instructorAvailable: e.target.checked })}
                    className="w-4 h-4 text-emerald-800 rounded border-gray-300 focus:ring-emerald-700"
                  />
                  <span className="font-medium">Coach / Instructor Available</span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddActivityModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm"
                >
                  {editingActivity ? 'Save Activity Changes' : 'Create & Publish Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BOOKING & FRONT OFFICE FOLIO BILLING */}
      {/* ========================================================================= */}
      {isBookingModalOpen && selectedActivityForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="p-5 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BedDouble className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-lg">Issue Activity Pass & Bill to Folio</h3>
                  <p className="text-xs text-emerald-200">{selectedActivityForBooking.name} (৳{selectedActivityForBooking.price}/{selectedActivityForBooking.pricingUnit})</p>
                </div>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBooking} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Select Activity / Facility
                </label>
                <select
                  value={selectedActivityForBooking.id}
                  onChange={e => {
                    const found = activities.find(a => a.id === e.target.value);
                    if (found) setSelectedActivityForBooking(found);
                  }}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white font-bold text-gray-900"
                >
                  {activities.filter(a => a.isActive).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} — ৳{(a.price || 0).toLocaleString()} ({a.pricingUnit})
                    </option>
                  ))}
                </select>
              </div>

              {/* In-House Room Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Bill To In-House Room (Front Office)
                </label>
                <select
                  value={selectedStayId}
                  onChange={e => handleSelectStay(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white"
                >
                  <option value="walk-in">Direct Walk-in / Club Visitor (No Room Folio)</option>
                  {activeStays.map(stay => (
                    <option key={stay.id} value={stay.id}>
                      Room {stay.roomNumber} - {stay.guestName} (Folio #{stay.folioId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Guest / Member Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bookingGuestName}
                  onChange={e => setBookingGuestName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Pass Qty / Pax
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bookingParticipants}
                    onChange={e => setBookingParticipants(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Time Slot
                  </label>
                  <select
                    value={bookingTimeSlot}
                    onChange={e => setBookingTimeSlot(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white"
                  >
                    {TIME_SLOTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  value={bookingPaymentType}
                  onChange={e => setBookingPaymentType(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white font-semibold"
                >
                  <option value="Billed to Room Folio">Billed to In-House Room Folio (Front Office)</option>
                  <option value="Cash Direct">Cash Direct Collection (Front Desk/Activity Desk)</option>
                  <option value="Credit Card">Credit Card / Debit POS Terminal</option>
                  <option value="bKash MFS">bKash MFS QR Collection</option>
                </select>
              </div>

              {/* Total Calculation Card */}
              {(() => {
                const sub = bookingParticipants * selectedActivityForBooking.price;
                const tax = Math.round(sub * 0.15);
                const grand = sub + tax;
                return (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs text-emerald-900">
                      <span>Subtotal ({bookingParticipants} × ৳{(selectedActivityForBooking.price || 0).toLocaleString()}):</span>
                      <span className="font-semibold">৳{(sub || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-emerald-900">
                      <span>Government VAT (15%):</span>
                      <span className="font-semibold">৳{(tax || 0).toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-emerald-200 flex justify-between text-base font-bold text-emerald-950">
                      <span>Grand Total Charge:</span>
                      <span>৳{(grand || 0).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirm & Post Folio Charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PRINTABLE ACTIVITY PASS BADGE */}
      {/* ========================================================================= */}
      {selectedPassToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">Facility Activity Pass</h3>
              </div>
              <button
                onClick={() => setSelectedPassToPrint(null)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-center">
              <div className="border-2 border-dashed border-emerald-300 p-5 rounded-xl bg-emerald-50/50 space-y-3">
                <div className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                  CCULB RESORT & CONVENTION HALL
                </div>
                <h2 className="text-xl font-extrabold text-gray-900">{selectedPassToPrint.activityName}</h2>
                <div className="inline-block px-3 py-1 bg-emerald-800 text-white font-mono font-bold text-xs rounded-full">
                  {selectedPassToPrint.bookingNumber}
                </div>

                <div className="pt-3 border-t border-emerald-200 text-left space-y-1.5 text-xs text-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Guest Name:</span>
                    <span className="font-bold text-gray-900">{selectedPassToPrint.guestName}</span>
                  </div>
                  {selectedPassToPrint.roomNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Room Folio:</span>
                      <span className="font-bold text-blue-800">Room {selectedPassToPrint.roomNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pass Holders:</span>
                    <span className="font-bold text-gray-900">{selectedPassToPrint.participantCount} Persons</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Valid Date & Slot:</span>
                    <span className="font-bold text-gray-900">{selectedPassToPrint.bookingDate} ({selectedPassToPrint.timeSlot})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Billed:</span>
                    <span className="font-bold text-emerald-900">৳{(selectedPassToPrint.total || 0).toLocaleString()} ({selectedPassToPrint.paymentType})</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-emerald-200 text-[11px] text-gray-400">
                  Please present this pass at the facility reception desk. Towels and lockers provided.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPassToPrint(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Print Pass Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: VOID CHARGE REVERSAL */}
      {/* ========================================================================= */}
      {isVoidModalOpen && chargeToVoid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-lg text-gray-900">Void Activity Charge</h3>
            </div>

            <p className="text-xs text-gray-600">
              You are voiding charge <strong className="font-mono text-gray-900">{chargeToVoid.chargeNumber}</strong> ({chargeToVoid.serviceType} for ৳{(chargeToVoid.grandTotal || 0).toLocaleString()}). This will reverse the GL accounting voucher and remove the charge from the guest folio.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Mandatory Void Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                placeholder="e.g. Guest cancelled session due to rain, supervisor approved refund..."
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsVoidModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Confirm Void & Reversal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
