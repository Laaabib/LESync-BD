import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles, Palmtree, Waves, Dumbbell, Trophy, ShieldCheck,
  Plus, Search, Filter, RefreshCw, CheckCircle2, Clock,
  CreditCard, DollarSign, Receipt, FileSpreadsheet,
  AlertCircle, ArrowUpRight, BedDouble, User, Calendar, Printer, X
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { ActivityAmenityCharge, Stay } from '../types/pms';
import * as XLSX from 'xlsx';

interface ServiceRateItem {
  type: ActivityAmenityCharge['serviceType'];
  category: 'Activity' | 'Amenity';
  name: string;
  defaultPrice: number;
  unit: string;
  icon: React.ElementType;
  description: string;
  badge: string;
  badgeColor: string;
}

const SERVICE_CATALOG: ServiceRateItem[] = [
  {
    type: 'Swimming Pool Pass',
    category: 'Activity',
    name: 'Swimming Pool & Jacuzzi Pass',
    defaultPrice: 500,
    unit: 'Per Person / Session',
    icon: Waves,
    description: 'Access to resort infinity pool, kids splash pool, locker & fresh towels.',
    badge: 'Popular',
    badgeColor: 'bg-cyan-500/10 text-cyan-700 border-cyan-200'
  },
  {
    type: 'Lawn Tennis',
    category: 'Activity',
    name: 'Floodlit Lawn Tennis Court',
    defaultPrice: 1200,
    unit: 'Per Hour (Rackets Included)',
    icon: Trophy,
    description: 'International standard synthetic grass tennis court with night floodlights.',
    badge: 'Sports',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
  },
  {
    type: 'Boating & Water Sports',
    category: 'Activity',
    name: 'River Lake Boating & Kayaks',
    defaultPrice: 750,
    unit: 'Per 45-Min Ride',
    icon: Palmtree,
    description: 'Paddle boats and twin kayaks on scenic resort lake with safety lifejackets.',
    badge: 'Outdoor',
    badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-200'
  },
  {
    type: 'Archery Field',
    category: 'Activity',
    name: 'Archery Target Range',
    defaultPrice: 800,
    unit: '20 Arrows + Instructor',
    icon: Trophy,
    description: 'Professional recurve bows, target bulls-eyes, and range safety supervisor.',
    badge: 'Recreation',
    badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-200'
  },
  {
    type: 'Gym Pass',
    category: 'Activity',
    name: 'Fitness Center & Cardio Gym',
    defaultPrice: 400,
    unit: 'Day Pass',
    icon: Dumbbell,
    description: 'Full cardio and weight equipment, steam bath, and locker access.',
    badge: 'Wellness',
    badgeColor: 'bg-indigo-500/10 text-indigo-700 border-indigo-200'
  },
  {
    type: 'Kids Zone',
    category: 'Activity',
    name: 'Kids Play Zone & Arcade',
    defaultPrice: 350,
    unit: 'Unlimited Day Token',
    icon: Sparkles,
    description: 'Indoor soft play jungle, trampolines, ball pit, and arcade games.',
    badge: 'Family',
    badgeColor: 'bg-pink-500/10 text-pink-700 border-pink-200'
  },
  {
    type: 'Spa & Massage',
    category: 'Amenity',
    name: 'Aromatherapy Body Spa & Massage',
    defaultPrice: 3500,
    unit: '60 Min Full Session',
    icon: Sparkles,
    description: 'Therapeutic essential oil relaxation massage by certified therapist.',
    badge: 'Luxury Spa',
    badgeColor: 'bg-purple-500/10 text-purple-700 border-purple-200'
  },
  {
    type: 'Laundry & Dry Cleaning',
    category: 'Amenity',
    name: 'Express Valet Laundry & Pressing',
    defaultPrice: 150,
    unit: 'Per Piece Average',
    icon: Sparkles,
    description: 'Same-day wash, dry clean, and steam pressing for guest apparel.',
    badge: 'Valet',
    badgeColor: 'bg-sky-500/10 text-sky-700 border-sky-200'
  },
  {
    type: 'Airport Shuttle',
    category: 'Amenity',
    name: 'Airport Chauffeur Shuttle Transfer',
    defaultPrice: 2500,
    unit: 'One-Way Private Trip',
    icon: ShieldCheck,
    description: 'Dedicated air-conditioned luxury van between Resort and Dhaka Airport.',
    badge: 'Transport',
    badgeColor: 'bg-slate-500/10 text-slate-700 border-slate-200'
  }
];

interface RecreationAmenitiesViewProps {
  initialTab?: string;
  onPrintInvoice?: (chargeOrInvoice: any) => void;
}

export const RecreationAmenitiesView: React.FC<RecreationAmenitiesViewProps> = ({ initialTab = 'catalog', onPrintInvoice }) => {
  const [db, setDb] = useState(pmsService.getState());

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);
  const [activeTab, setActiveTab] = useState<'catalog' | 'charges'>(
    initialTab === 'charges' || initialTab === 'billing' || initialTab === 'amenities-billing' ? 'charges' : 'catalog'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Activity' | 'Amenity'>('All');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Billed to Room Folio' | 'Cash Direct' | 'Credit Card' | 'bKash MFS'>('All');

  // Modal State
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceRateItem | null>(null);
  const [selectedStayId, setSelectedStayId] = useState<string>('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [chargeQty, setChargeQty] = useState(1);
  const [chargeUnitPrice, setChargeUnitPrice] = useState(500);
  const [paymentType, setPaymentType] = useState<ActivityAmenityCharge['paymentType']>('Billed to Room Folio');
  const [chargeNotes, setChargeNotes] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastBilledCharge, setLastBilledCharge] = useState<ActivityAmenityCharge | null>(null);

  // Active in-house stays for room folio posting
  const activeStays = useMemo(() => {
    return db.stays.filter(s => s.status === 'Active');
  }, [db.stays]);

  const chargesList = useMemo(() => {
    return (db.activityCharges || []).filter(c => {
      const matchSearch =
        c.chargeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.guestOrCustomerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.roomNumber && c.roomNumber.includes(searchQuery));
      const matchCat = categoryFilter === 'All' || c.category === categoryFilter;
      const matchPay = paymentFilter === 'All' || c.paymentType === paymentFilter;
      return matchSearch && matchCat && matchPay;
    });
  }, [db.activityCharges, searchQuery, categoryFilter, paymentFilter]);

  // Statistics
  const stats = useMemo(() => {
    const all = db.activityCharges || [];
    const totalRevenue = all.reduce((sum, c) => sum + c.grandTotal, 0);
    const folioBilled = all.filter(c => c.paymentType === 'Billed to Room Folio').reduce((sum, c) => sum + c.grandTotal, 0);
    const directCollected = totalRevenue - folioBilled;
    const activitiesCount = all.filter(c => c.category === 'Activity').length;
    const amenitiesCount = all.filter(c => c.category === 'Amenity').length;
    return { totalRevenue, folioBilled, directCollected, activitiesCount, amenitiesCount };
  }, [db.activityCharges]);

  const handleOpenChargeModal = (item?: ServiceRateItem) => {
    const service = item || SERVICE_CATALOG[0];
    setSelectedService(service);
    setChargeUnitPrice(service.defaultPrice);
    setChargeQty(1);
    setChargeNotes('');
    if (activeStays.length > 0) {
      setSelectedStayId(activeStays[0].id);
      setCustomCustomerName(activeStays[0].guestName);
      setPaymentType('Billed to Room Folio');
    } else {
      setSelectedStayId('');
      setCustomCustomerName('Walk-in Resort Guest');
      setPaymentType('Cash Direct');
    }
    setIsChargeModalOpen(true);
  };

  const handleSelectStay = (stayId: string) => {
    setSelectedStayId(stayId);
    if (stayId === 'walk-in') {
      setCustomCustomerName('Walk-in Guest');
      setPaymentType('Cash Direct');
    } else {
      const stay = activeStays.find(s => s.id === stayId);
      if (stay) {
        setCustomCustomerName(stay.guestName);
        setPaymentType('Billed to Room Folio');
      }
    }
  };

  const handleSubmitCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    let targetStay: Stay | undefined;
    let folioId: string | undefined;
    let roomNumber: string | undefined;
    let guestName = customCustomerName.trim();

    if (selectedStayId && selectedStayId !== 'walk-in') {
      targetStay = activeStays.find(s => s.id === selectedStayId);
      if (targetStay) {
        folioId = targetStay.folioId;
        roomNumber = targetStay.roomNumber;
        guestName = targetStay.guestName;
      }
    }

    if (paymentType === 'Billed to Room Folio' && !folioId) {
      setFeedbackMsg({ type: 'error', text: 'Please select an active in-house room to post charges to guest folio.' });
      return;
    }

    const result = pmsService.createActivityCharge({
      category: selectedService.category,
      serviceType: selectedService.type,
      guestOrCustomerName: guestName || 'Resort Guest',
      roomNumber,
      stayId: targetStay?.id,
      folioId,
      quantity: chargeQty,
      unitPrice: chargeUnitPrice,
      paymentType,
      notes: chargeNotes
    });

    if (result.success) {
      setLastBilledCharge(result.charge || null);
      setFeedbackMsg({ type: 'success', text: result.message });
      setIsChargeModalOpen(false);
    } else {
      setFeedbackMsg({ type: 'error', text: 'Failed to record activity charge.' });
    }
  };

  const exportToExcel = () => {
    const data = (db.activityCharges || []).map(c => ({
      'Charge Number': c.chargeNumber,
      'Date & Time': new Date(c.createdAt).toLocaleString(),
      'Category': c.category,
      'Service Type': c.serviceType,
      'Guest / Client': c.guestOrCustomerName,
      'Room No': c.roomNumber || 'Direct POS',
      'Quantity': c.quantity,
      'Unit Price (BDT)': c.unitPrice,
      'Subtotal (BDT)': c.subtotal,
      'Tax 15% (BDT)': c.tax,
      'Grand Total (BDT)': c.grandTotal,
      'Payment Method': c.paymentType,
      'Settlement Status': c.settlementStatus,
      'Created By': c.createdBy,
      'Notes': c.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Recreation & Amenities');
    XLSX.writeFile(wb, `CCULB_Activities_Amenities_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="w-full max-w-full p-2 sm:p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-700 text-white rounded-lg shadow-sm">
              <Palmtree className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Activities, Sports & Wellness</h1>
              <p className="text-sm text-gray-500">Resort recreation facility ticketing, sports passes, luxury spa & guest amenity billing</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToExcel}
            className="px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Data
          </button>
          <button
            onClick={() => handleOpenChargeModal()}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Activity / Amenity Charge
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
          feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs transition shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill Invoice</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => { setFeedbackMsg(null); setLastBilledCharge(null); }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-sm font-medium">
            <span>Total Sales Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">৳{(stats.totalRevenue || 0).toLocaleString()}</div>
          <div className="mt-1 text-xs text-gray-500">From {(db.activityCharges || []).length} registered transactions</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-sm font-medium">
            <span>Billed to Room Folio</span>
            <BedDouble className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-700">৳{(stats.folioBilled || 0).toLocaleString()}</div>
          <div className="mt-1 text-xs text-gray-500">Auto-posted to in-house guests</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-sm font-medium">
            <span>Direct Counter Collections</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">৳{(stats.directCollected || 0).toLocaleString()}</div>
          <div className="mt-1 text-xs text-gray-500">Cash, bKash & POS card terminal</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-sm font-medium">
            <span>Active Facilities</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-700">9 Outlets</div>
          <div className="mt-1 text-xs text-gray-500">Pool, Tennis, Boating, Archery, Spa</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'catalog' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Palmtree className="w-4 h-4" />
            Activities & Amenity Catalog ({SERVICE_CATALOG.length})
          </button>
          <button
            onClick={() => setActiveTab('charges')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'charges' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Receipt className="w-4 h-4" />
            Billing & Transaction Ledger ({(db.activityCharges || []).length})
          </button>
        </div>
      </div>

      {/* TAB 1: Catalog & Quick Issue */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICE_CATALOG.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-md transition-all">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 bg-gray-50 text-emerald-700 rounded-lg border border-gray-100">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-gray-900">{item.name}</h3>
                  <p className="mt-1.5 text-xs text-gray-500 leading-relaxed min-h-[36px]">{item.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-emerald-800">৳{(item.defaultPrice || 0).toLocaleString()}</div>
                    <div className="text-[11px] text-gray-400 font-medium">{item.unit}</div>
                  </div>

                  <button
                    onClick={() => handleOpenChargeModal(item)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Issue & Bill
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Transaction Ledger */}
      {activeTab === 'charges' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search guest, room, receipt..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg p-1 text-xs">
                <span className="text-gray-400 px-1 font-medium">Category:</span>
                {(['All', 'Activity', 'Amenity'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${categoryFilter === cat ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg p-1 text-xs">
                <span className="text-gray-400 px-1 font-medium">Payment:</span>
                {(['All', 'Billed to Room Folio', 'Cash Direct', 'Credit Card', 'bKash MFS'] as const).map(pm => (
                  <button
                    key={pm}
                    onClick={() => setPaymentFilter(pm)}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${paymentFilter === pm ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {pm === 'Billed to Room Folio' ? 'Folio' : pm === 'Cash Direct' ? 'Cash' : pm}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Showing {chargesList.length} of {(db.activityCharges || []).length} charges
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Category & Service</th>
                  <th className="py-3 px-4">Guest / Room</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">VAT (15%)</th>
                  <th className="py-3 px-4 text-right">Total (BDT)</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {chargesList.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-gray-400">
                      No recreation or amenity charges found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  chargesList.map(charge => (
                    <tr key={charge.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                        {charge.chargeNumber}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(charge.createdAt).toLocaleDateString()} {new Date(charge.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{charge.serviceType}</div>
                        <div className="text-[11px] text-gray-400">{charge.category} • Posted by {charge.createdBy}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{charge.guestOrCustomerName}</div>
                        {charge.roomNumber ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            <BedDouble className="w-3 h-3" /> Room {charge.roomNumber}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">Counter Ticket</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-gray-700">
                        {charge.quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600 font-mono">
                        ৳{(charge.subtotal || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500 font-mono">
                        ৳{(charge.tax || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900 font-mono">
                        ৳{(charge.grandTotal || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          charge.paymentType === 'Billed to Room Folio'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : charge.paymentType === 'Cash Direct'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : charge.paymentType === 'bKash MFS'
                            ? 'bg-pink-50 text-pink-700 border border-pink-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {charge.paymentType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          charge.settlementStatus === 'Posted to Folio'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {charge.settlementStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {onPrintInvoice && (
                          <button
                            type="button"
                            onClick={() => onPrintInvoice(charge)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition"
                          >
                            <Printer className="w-3 h-3 text-emerald-700" />
                            <span>Print</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE CHARGE MODAL */}
      {isChargeModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Issue Facility Ticket / Charge</h2>
                <p className="text-xs text-gray-500">Post to active room folio or collect at outlet counter</p>
              </div>
              <button
                onClick={() => setIsChargeModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCharge} className="mt-4 space-y-4">
              {/* Selected Service Details */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">{selectedService.category}</div>
                  <div className="text-sm font-bold text-emerald-950">{selectedService.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-emerald-800">Unit Price</div>
                  <div className="text-sm font-bold text-emerald-950 font-mono">৳{(chargeUnitPrice || 0).toLocaleString()}</div>
                </div>
              </div>

              {/* Guest / In-House Stay Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Recipient / In-House Guest <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedStayId}
                  onChange={e => handleSelectStay(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                >
                  <option value="walk-in">-- Walk-in / Day-Pass Visitor (Direct Payment) --</option>
                  {activeStays.map(stay => (
                    <option key={stay.id} value={stay.id}>
                      Room {stay.roomNumber} - {stay.guestName} ({stay.roomTypeName})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStayId === 'walk-in' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Customer / Guest Name</label>
                  <input
                    type="text"
                    value={customCustomerName}
                    onChange={e => setCustomCustomerName(e.target.value)}
                    placeholder="Enter customer name..."
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Quantity & Unit Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity / Passes</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={chargeQty}
                    onChange={e => setChargeQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Unit Rate (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    value={chargeUnitPrice}
                    onChange={e => setChargeUnitPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Billing & Settlement Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Billed to Room Folio', label: 'Post to Room Folio', disabled: selectedStayId === 'walk-in' },
                    { id: 'Cash Direct', label: 'Cash at Counter', disabled: false },
                    { id: 'bKash MFS', label: 'bKash Merchant Pay', disabled: false },
                    { id: 'Credit Card', label: 'POS Card Swipe', disabled: false }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      type="button"
                      disabled={mode.disabled}
                      onClick={() => setPaymentType(mode.id as any)}
                      className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all ${
                        paymentType === mode.id
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-1 ring-emerald-600'
                          : mode.disabled
                          ? 'opacity-40 bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks / Special Request (Optional)</label>
                <input
                  type="text"
                  value={chargeNotes}
                  onChange={e => setChargeNotes(e.target.value)}
                  placeholder="e.g., wristband #42 issued, pool towel assigned..."
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* Bill Calculation Summary */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({chargeQty} x ৳{chargeUnitPrice}):</span>
                  <span>৳{(chargeQty * chargeUnitPrice || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Govt VAT (15%):</span>
                  <span>৳{(Math.round(chargeQty * chargeUnitPrice * 0.15) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-900 border-t border-gray-200 pt-1.5 text-sm">
                  <span>Grand Total to Bill:</span>
                  <span>৳{(chargeQty * chargeUnitPrice + Math.round(chargeQty * chargeUnitPrice * 0.15) || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsChargeModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  Confirm & Post Charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
