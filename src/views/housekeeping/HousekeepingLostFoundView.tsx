import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, Search, Filter, Plus, CheckCircle2, Clock,
  ShieldCheck, AlertTriangle, User, MapPin, Tag, Phone,
  Mail, Calendar, ArrowRight, X, Check, FileText, History,
  Sparkles, Lock, ArrowUpRight, Printer, Truck, Send,
  Trash2, DollarSign, Eye, Copy, ExternalLink, HelpCircle,
  AlertCircle, Shield, Award, CheckSquare, Layers
} from 'lucide-react';
import { housekeepingService } from '../../services/housekeepingService';
import { pmsService } from '../../services/pmsService';
import { pdfExportService } from '../../services/pdfExportService';
import {
  LostFoundItem,
  LostFoundCategory,
  LostFoundStatus
} from '../../types/housekeeping';

export const HousekeepingLostFoundView: React.FC = () => {
  const [items, setItems] = useState<LostFoundItem[]>(housekeepingService.getState().lostFound);
  const [staff, setStaff] = useState(housekeepingService.getState().staff);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [segmentTab, setSegmentTab] = useState<'all' | 'stored' | 'high-value' | 'contacted' | 'returned' | 'disposal-eligible'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [returnItem, setReturnItem] = useState<LostFoundItem | null>(null);
  const [courierItem, setCourierItem] = useState<LostFoundItem | null>(null);
  const [notifyItem, setNotifyItem] = useState<LostFoundItem | null>(null);
  const [disposeItem, setDisposeItem] = useState<LostFoundItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // 1. Log Item Form State
  const [foundLocation, setFoundLocation] = useState('');
  const [roomNumberInput, setRoomNumberInput] = useState('');
  const [autoGuestInfo, setAutoGuestInfo] = useState<any>(null);
  const [category, setCategory] = useState<LostFoundCategory>('Electronics');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState<'Excellent' | 'Good' | 'Fair' | 'Damaged'>('Good');
  const [foundBy, setFoundBy] = useState('');
  const [storedLocation, setStoredLocation] = useState('HK Safe Locker A-2');
  const [storageBinCode, setStorageBinCode] = useState('BIN-SEC-02');
  const [isHighValue, setIsHighValue] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState<number>(0);
  const [witnessedBy, setWitnessedBy] = useState('');
  const [remarks, setRemarks] = useState('');

  // 2. Return In-Person Form State
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverNid, setReceiverNid] = useState('');
  const [returnRemarks, setReturnRemarks] = useState('');

  // 3. Courier Dispatch Form State
  const [courierName, setCourierName] = useState('DHL Express International');
  const [courierTrackingNumber, setCourierTrackingNumber] = useState('');
  const [courierRecipientName, setCourierRecipientName] = useState('');
  const [courierRecipientPhone, setCourierRecipientPhone] = useState('');
  const [courierRecipientAddress, setCourierRecipientAddress] = useState('');
  const [courierCost, setCourierCost] = useState<number>(1200);
  const [courierRemarks, setCourierRemarks] = useState('');

  // 4. Disposal Form State
  const [disposalMethod, setDisposalMethod] = useState<'Auction' | 'Charity Donation' | 'Discarded'>('Charity Donation');
  const [disposalApprovedBy, setDisposalApprovedBy] = useState('General Manager / Duty Manager');
  const [disposalNotes, setDisposalNotes] = useState('Exceeded 90-day retention holding policy with no guest claim.');

  // Subscribe to service updates
  useEffect(() => {
    const unsub = housekeepingService.subscribe(s => {
      setItems([...s.lostFound]);
      setStaff([...s.staff]);
    });
    return unsub;
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(text);
    showToast(`Copied #${text} to clipboard`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Autofill Guest when room number is entered
  const handleRoomLookup = (val: string) => {
    setRoomNumberInput(val);
    if (val.trim()) {
      setFoundLocation(`Room ${val.trim()}`);
      const lookup = housekeepingService.searchGuestForRoom(val.trim());
      if (lookup) {
        setAutoGuestInfo(lookup);
      } else {
        setAutoGuestInfo(null);
      }
    } else {
      setAutoGuestInfo(null);
    }
  };

  // Submit Log Item
  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !foundLocation.trim()) {
      showToast('Please provide an item description and found location.');
      return;
    }

    const newItem = housekeepingService.createLostFoundItem({
      foundDate: new Date().toISOString().split('T')[0],
      foundTime: new Date().toTimeString().slice(0, 5),
      foundLocation,
      roomId: autoGuestInfo?.roomId,
      roomNumber: roomNumberInput.trim() || undefined,
      guestName: autoGuestInfo?.guestName,
      guestPhone: autoGuestInfo?.phone,
      guestEmail: autoGuestInfo?.email,
      reservationNumber: autoGuestInfo?.reservationNumber,
      checkoutDate: autoGuestInfo?.checkOutDate,
      description,
      category,
      color,
      brand,
      condition,
      foundBy: foundBy || staff[0]?.name || 'Housekeeping Attendant',
      storedLocation,
      storageBinCode,
      isHighValue,
      estimatedValue: Number(estimatedValue) || 0,
      witnessedBy: isHighValue ? (witnessedBy || 'Duty Manager Subrata Roy') : undefined,
      status: autoGuestInfo ? 'Guest Contacted' : 'Stored',
      remarks
    });

    setIsLogModalOpen(false);
    showToast(`Logged item ${newItem.itemCode}! Stored securely in ${storedLocation}.`);

    // Reset Form
    setDescription('');
    setColor('');
    setBrand('');
    setRoomNumberInput('');
    setAutoGuestInfo(null);
    setIsHighValue(false);
    setEstimatedValue(0);
    setWitnessedBy('');
    setRemarks('');
  };

  // Submit In-Person Handover
  const handleReturnItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnItem || !receiverName.trim() || !receiverNid.trim()) {
      showToast('Receiver Name and National ID / Passport are required.');
      return;
    }

    housekeepingService.returnLostFoundItem(returnItem.id, {
      receiverName,
      receiverPhone,
      receiverNid,
      remarks: returnRemarks
    });

    showToast(`Property ${returnItem.itemCode} returned to verified claimant ${receiverName}.`);
    setReturnItem(null);
    setReceiverName('');
    setReceiverPhone('');
    setReceiverNid('');
    setReturnRemarks('');
  };

  // Submit Courier Dispatch
  const handleCourierDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierItem || !courierTrackingNumber.trim() || !courierRecipientAddress.trim()) {
      showToast('Courier tracking number and recipient address are required.');
      return;
    }

    housekeepingService.dispatchCourierLostFoundItem(courierItem.id, {
      courierName,
      trackingNumber: courierTrackingNumber.trim(),
      recipientName: courierRecipientName.trim() || courierItem.guestName || 'Guest',
      recipientPhone: courierRecipientPhone.trim() || courierItem.guestPhone || '',
      recipientAddress: courierRecipientAddress.trim(),
      courierCost: Number(courierCost) || 0,
      remarks: courierRemarks
    });

    showToast(`Dispatched ${courierItem.itemCode} via ${courierName} (Waybill #${courierTrackingNumber}).`);
    setCourierItem(null);
    setCourierTrackingNumber('');
    setCourierRecipientAddress('');
    setCourierRemarks('');
  };

  // Submit Disposal
  const handleDisposeItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposeItem) return;

    housekeepingService.disposeLostFoundItem(disposeItem.id, {
      method: disposalMethod,
      approvedBy: disposalApprovedBy,
      notes: disposalNotes
    });

    showToast(`Item ${disposeItem.itemCode} processed via ${disposalMethod}.`);
    setDisposeItem(null);
  };

  // Send Notification Record
  const handleSendNotification = (channel: 'SMS' | 'Email' | 'WhatsApp') => {
    if (!notifyItem) return;
    const contact = channel === 'Email' ? (notifyItem.guestEmail || 'Email on file') : (notifyItem.guestPhone || 'Phone on file');
    housekeepingService.recordGuestNotification(notifyItem.id, channel, contact);
    showToast(`Official ${channel} notification recorded for ${notifyItem.guestName || 'Guest'}.`);
    setNotifyItem(null);
  };

  // Export PDF Register
  const handleExportPDF = () => {
    pdfExportService.exportToPDF({
      title: 'LOST & FOUND PROPERTY MASTER REGISTER',
      subtitle: 'LESYNC LUXURY RESORT & CONVENTION • HOUSEKEEPING OPERATIONS',
      date: new Date().toLocaleDateString('en-GB'),
      columns: [
        { key: 'code', header: 'Item Code' },
        { key: 'desc', header: 'Description & Brand' },
        { key: 'category', header: 'Category' },
        { key: 'location', header: 'Found At' },
        { key: 'guest', header: 'Linked Guest' },
        { key: 'locker', header: 'Storage Locker' },
        { key: 'status', header: 'Current Status' }
      ],
      rows: filteredItems.map(i => ({
        code: i.itemCode,
        desc: `${i.description} ${i.brand ? `(${i.brand})` : ''}`,
        category: i.category,
        location: `${i.foundLocation} (${i.foundDate})`,
        guest: i.guestName || 'Unassigned',
        locker: `${i.storedLocation} [${i.storageBinCode}]`,
        status: i.status === 'Returned' && i.dispositionMethod ? `${i.status} (${i.dispositionMethod})` : i.status
      }))
    }, 'lost-found-master-register');
  };

  // Generate Handover Certificate PDF
  const handlePrintHandoverCertificate = (item: LostFoundItem) => {
    pdfExportService.exportToPDF({
      title: 'PROPERTY HANDOVER & CUSTODY CLEARANCE CERTIFICATE',
      subtitle: 'LESYNC LUXURY RESORT • OFFICIAL CLEARANCE SLIP',
      date: new Date().toLocaleDateString('en-GB'),
      columns: [
        { key: 'field', header: 'Specification' },
        { key: 'value', header: 'Verified Record Details' }
      ],
      rows: [
        { field: 'Property Code', value: item.itemCode },
        { field: 'Item Description', value: item.description },
        { field: 'Category / Make', value: `${item.category} • ${item.brand || 'N/A'} • ${item.color}` },
        { field: 'Discovered Date & Place', value: `${item.foundDate} ${item.foundTime} at ${item.foundLocation}` },
        { field: 'Discovered By', value: item.foundBy },
        { field: 'Secure Locker Stored', value: `${item.storedLocation} (${item.storageBinCode})` },
        { field: 'Claimant / Receiver Name', value: item.claimedBy || 'Verified Owner' },
        { field: 'Claimant Verified ID / NID', value: item.receiverNid || 'Verified by Front Desk' },
        { field: 'Contact Phone', value: item.receiverPhone || item.guestPhone || 'On File' },
        { field: 'Authorized Handover Officer', value: item.returnedBy || 'Housekeeping Supervisor' },
        { field: 'Disposition Method', value: item.dispositionMethod || 'In-Person Handover' },
        { field: 'Waybill Tracking (if Courier)', value: item.courierTrackingNumber ? `${item.courierName} #${item.courierTrackingNumber}` : 'N/A' },
        { field: 'Handover Timestamp', value: item.claimedDate || new Date().toISOString() },
        { field: 'Clearance Status', value: 'PROPERTY SUCCESSFULLY TRANSFERRED & CLEARED' }
      ]
    }, `custody-clearance-${item.itemCode}`);
  };

  // Helper: check if item is > 90 days old
  const isItemOlderThan90Days = (foundDate: string) => {
    try {
      const diffDays = (Date.now() - new Date(foundDate).getTime()) / (1000 * 3600 * 24);
      return diffDays >= 90;
    } catch {
      return false;
    }
  };

  // Filtered List
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.itemCode.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchLoc = item.foundLocation.toLowerCase().includes(q);
        const matchGuest = item.guestName?.toLowerCase().includes(q);
        const matchPhone = item.guestPhone?.includes(q);
        const matchLocker = item.storedLocation.toLowerCase().includes(q);
        const matchTracking = item.courierTrackingNumber?.toLowerCase().includes(q);
        if (!matchCode && !matchDesc && !matchLoc && !matchGuest && !matchPhone && !matchLocker && !matchTracking) {
          return false;
        }
      }

      // 2. Category Filter
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;

      // 3. Status Filter Dropdown
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;

      // 4. Segment Navigation Filter
      if (segmentTab === 'stored') {
        return item.status === 'Stored' || item.status === 'Found';
      }
      if (segmentTab === 'high-value') {
        return item.isHighValue || item.category === 'Jewelry' || item.category === 'Money';
      }
      if (segmentTab === 'contacted') {
        return item.status === 'Guest Contacted';
      }
      if (segmentTab === 'returned') {
        return item.status === 'Returned';
      }
      if (segmentTab === 'disposal-eligible') {
        return (item.status === 'Unclaimed' || item.status === 'Stored') && isItemOlderThan90Days(item.foundDate);
      }

      return true;
    });
  }, [items, searchQuery, categoryFilter, statusFilter, segmentTab]);

  // KPIs
  const totalCount = items.length;
  const storedCount = items.filter(i => i.status === 'Stored' || i.status === 'Found').length;
  const highValueCount = items.filter(i => i.isHighValue || i.category === 'Jewelry' || i.category === 'Money').length;
  const contactedCount = items.filter(i => i.status === 'Guest Contacted').length;
  const returnedCount = items.filter(i => i.status === 'Returned').length;
  const disposalEligibleCount = items.filter(i => (i.status === 'Unclaimed' || i.status === 'Stored') && isItemOlderThan90Days(i.foundDate)).length;

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-amber-500/40 flex items-center space-x-2 animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: LOST & FOUND COMMAND BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 font-black flex items-center justify-center border-2 border-amber-500/40 shadow-inner shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                Lost & Found Property Registry & Custody
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-black border border-amber-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                <span>Dual-Custody Safe</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5 max-w-2xl">
              Central custody of guest articles, automated guest stay matching, high-value escrow lockers, verified in-person returns, courier parcel dispatch, and 90-day SOP disposition audit.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors border border-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="Export Full Lost & Found Register (PDF)"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Master PDF</span>
          </button>

          <button
            onClick={() => {
              setIsLogModalOpen(true);
              setFoundBy(staff[0]?.name || 'Housekeeping Staff');
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Discovered Property</span>
          </button>
        </div>
      </div>

      {/* METRIC KPI TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
        {/* Total Items */}
        <div
          onClick={() => setSegmentTab('all')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            segmentTab === 'all' ? 'bg-slate-800 border-amber-500/60 shadow-md ring-1 ring-amber-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold">Total Logged</span>
            <Package className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">{totalCount}</div>
          <span className="text-[9.5px] text-slate-500 block mt-0.5">All Recorded</span>
        </div>

        {/* In Safe Custody */}
        <div
          onClick={() => setSegmentTab('stored')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            segmentTab === 'stored' ? 'bg-amber-950/40 border-amber-500/80 shadow-md ring-1 ring-amber-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[11px] font-semibold">Safe Custody</span>
            <Lock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-300 font-mono">{storedCount}</div>
          <span className="text-[9.5px] text-amber-400/80 block mt-0.5">In HK / FO Lockers</span>
        </div>

        {/* High-Value Escrow */}
        <div
          onClick={() => setSegmentTab('high-value')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            segmentTab === 'high-value' ? 'bg-purple-950/40 border-purple-500/80 shadow-md ring-1 ring-purple-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-purple-400 mb-1">
            <span className="text-[11px] font-semibold">High Value</span>
            <Shield className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-300 font-mono">{highValueCount}</div>
          <span className="text-[9.5px] text-purple-400/80 block mt-0.5">Dual-Sign Witness</span>
        </div>

        {/* Guest Contacted */}
        <div
          onClick={() => setSegmentTab('contacted')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            segmentTab === 'contacted' ? 'bg-blue-950/40 border-blue-500/80 shadow-md ring-1 ring-blue-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-blue-400 mb-1">
            <span className="text-[11px] font-semibold">Contacted</span>
            <Phone className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-black text-blue-300 font-mono">{contactedCount}</div>
          <span className="text-[9.5px] text-blue-400/80 block mt-0.5">Awaiting Pickup</span>
        </div>

        {/* Returned / Dispatched */}
        <div
          onClick={() => setSegmentTab('returned')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            segmentTab === 'returned' ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[11px] font-semibold">Returned / Dispatched</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-300 font-mono">{returnedCount}</div>
          <span className="text-[9.5px] text-emerald-400/80 block mt-0.5">Handover & Courier</span>
        </div>

        {/* 90-Day Policy Eligible */}
        <div
          onClick={() => setSegmentTab('disposal-eligible')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            segmentTab === 'disposal-eligible' ? 'bg-rose-950/40 border-rose-500/80 shadow-md ring-1 ring-rose-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-[11px] font-semibold">&gt; 90-Days Unclaimed</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-300 font-mono">{disposalEligibleCount}</div>
          <span className="text-[9.5px] text-rose-400/80 block mt-0.5">SOP Disposal Ready</span>
        </div>
      </div>

      {/* FILTER & FRONT OFFICE INQUIRY SEARCH BAR */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Quick Search */}
        <div className="flex items-center space-x-2 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search code, item, room #, guest name, phone, locker..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Middle: Category Filter Dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400 font-semibold">Category:</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Jewelry">Jewelry & Watches</option>
            <option value="Documents">Documents & Passports</option>
            <option value="Money">Money / Wallets</option>
            <option value="Accessories">Accessories</option>
            <option value="Personal Items">Personal Items</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400 font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Stored">Stored in Safe</option>
            <option value="Guest Contacted">Guest Contacted</option>
            <option value="Returned">Returned / Dispatched</option>
            <option value="Unclaimed">Unclaimed</option>
            <option value="Disposed">Disposed via SOP</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {(searchQuery || categoryFilter !== 'All' || statusFilter !== 'All' || segmentTab !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('All');
              setStatusFilter('All');
              setSegmentTab('all');
            }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-lg text-xs"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* ITEMS TABLE */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-black text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Item & Security Code</th>
                <th className="p-3.5">Category & Specs</th>
                <th className="p-3.5">Found Location & Attendant</th>
                <th className="p-3.5">Linked Guest / Owner</th>
                <th className="p-3.5">Storage Locker & Bin</th>
                <th className="p-3.5">Custody Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">No matching property records found</p>
                    <p className="text-[11px] mt-0.5">Try clearing filters or search criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isOld = isItemOlderThan90Days(item.foundDate);
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Item Code & Description */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1.5">
                          <span
                            onClick={() => copyToClipboard(item.itemCode)}
                            className="font-mono font-bold text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-500/30 cursor-pointer flex items-center space-x-1 hover:border-amber-400"
                            title="Click to copy code"
                          >
                            <span>{item.itemCode}</span>
                            {copiedText === item.itemCode ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-amber-400/70" />}
                          </span>
                          {item.isHighValue && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9.5px] font-bold flex items-center gap-0.5">
                              <Shield className="w-2.5 h-2.5" />
                              <span>High Value</span>
                            </span>
                          )}
                          {isOld && (item.status === 'Stored' || item.status === 'Unclaimed') && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9.5px] font-bold">
                              &gt;90d
                            </span>
                          )}
                        </div>
                        <div
                          className="font-bold text-slate-100 text-xs mt-1 hover:text-amber-400 transition-colors cursor-pointer"
                          onClick={() => setSelectedItem(item)}
                        >
                          {item.description}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.color} • {item.condition} condition {item.brand ? `• ${item.brand}` : ''}
                          {item.estimatedValue ? ` • Est: ৳${item.estimatedValue.toLocaleString()}` : ''}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[11px] border border-slate-700">
                          {item.category}
                        </span>
                      </td>

                      {/* Location & Attendant */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1 font-semibold text-slate-200">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>{item.foundLocation}</span>
                        </div>
                        <div className="text-[10.5px] text-slate-400 mt-0.5">
                          {item.foundBy} • {item.foundDate} ({item.foundTime})
                        </div>
                      </td>

                      {/* Linked Guest */}
                      <td className="p-3.5">
                        {item.guestName ? (
                          <div>
                            <div className="font-bold text-slate-100 flex items-center space-x-1">
                              <User className="w-3 h-3 text-blue-400 shrink-0" />
                              <span className="truncate max-w-[140px]">{item.guestName}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5 text-slate-500" />
                              <span>{item.guestPhone || item.guestEmail || 'Contact on file'}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Unlinked (Public Area)</span>
                        )}
                      </td>

                      {/* Storage Locker */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1 text-amber-300 font-medium">
                          <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{item.storedLocation}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          Bin: {item.storageBinCode}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                            item.status === 'Returned'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : item.status === 'Guest Contacted'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : item.status === 'Stored'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : item.status === 'Disposed'
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {item.status === 'Returned' && item.dispositionMethod
                            ? `${item.status} (${item.dispositionMethod === 'Courier Dispatched' ? 'Courier' : 'In-Person'})`
                            : item.status}
                        </span>
                        {item.courierTrackingNumber && (
                          <div className="text-[9.5px] font-mono text-slate-400 mt-1 flex items-center space-x-1">
                            <Truck className="w-2.5 h-2.5 text-blue-400" />
                            <span className="truncate max-w-[120px]">{item.courierTrackingNumber}</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Notify Guest */}
                          {item.status !== 'Returned' && item.status !== 'Disposed' && item.guestPhone && (
                            <button
                              onClick={() => setNotifyItem(item)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                              title="Send SMS / Email notification to guest"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Handover In-Person */}
                          {item.status !== 'Returned' && item.status !== 'Disposed' && (
                            <button
                              onClick={() => {
                                setReturnItem(item);
                                setReceiverName(item.guestName || '');
                                setReceiverPhone(item.guestPhone || '');
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10.5px] transition-colors cursor-pointer"
                              title="Handover to guest in-person"
                            >
                              Handover
                            </button>
                          )}

                          {/* Dispatch Courier */}
                          {item.status !== 'Returned' && item.status !== 'Disposed' && (
                            <button
                              onClick={() => {
                                setCourierItem(item);
                                setCourierRecipientName(item.guestName || '');
                                setCourierRecipientPhone(item.guestPhone || '');
                              }}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[10.5px] transition-colors flex items-center space-x-1 cursor-pointer"
                              title="Dispatch via DHL / Courier"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Courier</span>
                            </button>
                          )}

                          {/* Details Drawer */}
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-[10.5px] transition-colors border border-slate-700 cursor-pointer"
                          >
                            Details
                          </button>

                          {/* SOP Disposal */}
                          {(item.status === 'Stored' || item.status === 'Unclaimed') && isOld && (
                            <button
                              onClick={() => setDisposeItem(item)}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 cursor-pointer"
                              title="Process SOP 90-Day Disposal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: LOG DISCOVERED PROPERTY WITH HIGH-VALUE ESCROW & AUTO ROOM LOOKUP */}
      {/* ========================================================================= */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateItem}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Log Discovered Property</h3>
                  <p className="text-[11px] text-slate-400">Generates unique trackable barcode reference</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Room Lookup with Auto-Guest Match */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2">
                <label className="font-bold text-amber-300 block">
                  Found in Guest Room # (Automated Guest Folio Linkage):
                </label>
                <input
                  type="text"
                  value={roomNumberInput}
                  onChange={e => handleRoomLookup(e.target.value)}
                  placeholder="e.g. 101, 203, 302 (or leave empty if discovered in public areas)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />

                {autoGuestInfo && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-300 space-y-1">
                    <div className="font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{autoGuestInfo.type} Matched: {autoGuestInfo.guestName}</span>
                    </div>
                    <div>Phone: {autoGuestInfo.phone} • Booking #{autoGuestInfo.reservationNumber}</div>
                  </div>
                )}
              </div>

              {/* Exact Location & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Found Location (Exact Spot):</label>
                  <input
                    type="text"
                    required
                    value={foundLocation}
                    onChange={e => setFoundLocation(e.target.value)}
                    placeholder="e.g. Room 101 Nightstand, Poolside Sunbed #4"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Category:</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as LostFoundCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Jewelry">Jewelry & Watches</option>
                    <option value="Documents">Documents & Passports</option>
                    <option value="Money">Money / Wallet / Cash</option>
                    <option value="Accessories">Accessories & Eyewear</option>
                    <option value="Personal Items">Personal Items</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Item Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Detailed Description:</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Apple iPad Pro 11-inch Space Gray in magnetic folio case"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Color, Brand, Condition */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Color / Finish:</label>
                  <input
                    type="text"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    placeholder="e.g. Space Gray, Navy"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Brand / Make:</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    placeholder="e.g. Apple, Titan, Zara"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Condition:</label>
                  <select
                    value={condition}
                    onChange={e => setCondition(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
              </div>

              {/* High-Value Escrow Toggle */}
              <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-purple-300 flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHighValue}
                      onChange={e => setIsHighValue(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
                    />
                    <span>High-Value Article (Requires Dual-Custody Escrow Protocol)</span>
                  </label>
                  <span className="text-[10px] text-purple-400 font-mono">&gt; ৳10,000 / Cash / Gold</span>
                </div>

                {isHighValue && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Estimated Value (BDT ৳):</label>
                      <input
                        type="number"
                        value={estimatedValue}
                        onChange={e => setEstimatedValue(Number(e.target.value))}
                        placeholder="e.g. 50000"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-purple-200 font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Escrow Witness Officer:</label>
                      <input
                        type="text"
                        value={witnessedBy}
                        onChange={e => setWitnessedBy(e.target.value)}
                        placeholder="e.g. Duty Manager Subrata Roy"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Staff & Storage Locker */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Discovered By (Attendant):</label>
                  <select
                    value={foundBy}
                    onChange={e => setFoundBy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {staff.map(s => (
                      <option key={s.id} value={`${s.name} (${s.role})`}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Storage Locker Location:</label>
                  <select
                    value={storedLocation}
                    onChange={e => setStoredLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="HK Safe Locker A-1">HK Safe Locker A-1 (Jewelry / Gold)</option>
                    <option value="HK Safe Locker A-2">HK Safe Locker A-2 (Electronics / Laptops)</option>
                    <option value="Front Office Safe Box 1">Front Office Safe Box 1 (Cash / Wallets)</option>
                    <option value="HK Main Store Shelf 1">HK Main Store Shelf 1 (Clothing / Apparel)</option>
                    <option value="HK Store Shelf 3">HK Store Shelf 3 (General Accessories)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Remarks & Intake Notes:</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="e.g. Found on study desk top shelf. Front desk phoned guest."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Save & Generate Property Code
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: IN-PERSON HANDOVER VERIFICATION */}
      {/* ========================================================================= */}
      {returnItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <form
            onSubmit={handleReturnItem}
            className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">In-Person Handover Verification</h3>
                  <p className="text-[11px] text-slate-400">{returnItem.itemCode} • {returnItem.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReturnItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200">{returnItem.description}</div>
                <div className="text-slate-400 text-[11px]">Found: {returnItem.foundLocation} on {returnItem.foundDate}</div>
                <div className="text-amber-400 text-[10.5px] font-mono">Locker: {returnItem.storedLocation} [{returnItem.storageBinCode}]</div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Claimant Full Name:</label>
                <input
                  type="text"
                  required
                  value={receiverName}
                  onChange={e => setReceiverName(e.target.value)}
                  placeholder="e.g. Tanvir Hossain"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Contact Mobile Number:</label>
                  <input
                    type="text"
                    required
                    value={receiverPhone}
                    onChange={e => setReceiverPhone(e.target.value)}
                    placeholder="+880 1711-..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Claimant National ID / Passport #:</label>
                  <input
                    type="text"
                    required
                    value={receiverNid}
                    onChange={e => setReceiverNid(e.target.value)}
                    placeholder="e.g. NID-1988267491..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Handover Remarks & Verification Notes:</label>
                <textarea
                  rows={2}
                  value={returnRemarks}
                  onChange={e => setReturnRemarks(e.target.value)}
                  placeholder="e.g. Verified photo ID and device unlock PIN. Claimant signed physical clearance slip."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReturnItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-900/30 flex items-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Handover & Release</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: COURIER / SHIPPING PARCEL DISPATCH */}
      {/* ========================================================================= */}
      {courierItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <form
            onSubmit={handleCourierDispatch}
            className="bg-slate-900 border border-blue-500/40 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Courier Shipping Dispatch</h3>
                  <p className="text-[11px] text-slate-400">{courierItem.itemCode} • {courierItem.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCourierItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Courier / Shipping Service:</label>
                  <select
                    value={courierName}
                    onChange={e => setCourierName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="DHL Express International">DHL Express International</option>
                    <option value="FedEx Express">FedEx Express</option>
                    <option value="Sundarban Courier Service">Sundarban Courier Service</option>
                    <option value="SA Paribahan Courier">SA Paribahan Courier</option>
                    <option value="Pathao Parcel">Pathao Parcel / City Delivery</option>
                    <option value="RedX Logistics">RedX Logistics</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Waybill / Consignment Tracking #:</label>
                  <input
                    type="text"
                    required
                    value={courierTrackingNumber}
                    onChange={e => setCourierTrackingNumber(e.target.value)}
                    placeholder="e.g. DHL-9921849102"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Recipient Name:</label>
                  <input
                    type="text"
                    required
                    value={courierRecipientName}
                    onChange={e => setCourierRecipientName(e.target.value)}
                    placeholder="Guest / Representative name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Recipient Phone:</label>
                  <input
                    type="text"
                    required
                    value={courierRecipientPhone}
                    onChange={e => setCourierRecipientPhone(e.target.value)}
                    placeholder="+880 1711-... / international"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Complete Delivery Address:</label>
                <textarea
                  rows={2}
                  required
                  value={courierRecipientAddress}
                  onChange={e => setCourierRecipientAddress(e.target.value)}
                  placeholder="Street address, Apartment / Suite, City, Postal Code, Country"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Shipping Cost (BDT ৳):</label>
                  <input
                    type="number"
                    value={courierCost}
                    onChange={e => setCourierCost(Number(e.target.value))}
                    placeholder="e.g. 1500"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Packaging Type:</label>
                  <input
                    type="text"
                    value={courierRemarks}
                    onChange={e => setCourierRemarks(e.target.value)}
                    placeholder="e.g. Bubble-wrapped tamper-proof pouch"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCourierItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-900/30 flex items-center space-x-1.5 cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Confirm Courier Dispatch</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: GUEST NOTIFICATION TEMPLATE PREVIEW & COPY */}
      {/* ========================================================================= */}
      {notifyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-blue-500/40 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Guest Property Notification</h3>
                  <p className="text-[11px] text-slate-400">{notifyItem.itemCode} • {notifyItem.guestName || 'Guest'}</p>
                </div>
              </div>
              <button
                onClick={() => setNotifyItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Official notification message pre-filled for <strong>{notifyItem.guestName}</strong> ({notifyItem.guestPhone}):
              </p>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 font-mono text-[11px] text-slate-200 leading-relaxed relative">
                Dear {notifyItem.guestName || 'Guest'},{'\n\n'}
                LESync Luxury Resort Housekeeping has secured an item left behind ({notifyItem.description}) found in {notifyItem.foundLocation}.{'\n\n'}
                Reference Code: {notifyItem.itemCode}{'\n'}
                Storage Locker: {notifyItem.storedLocation}{'\n\n'}
                Please call Front Desk (+880 1711-000000) or reply to this message to confirm personal collection or arrange insured courier dispatch.
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    const text = `Dear ${notifyItem.guestName || 'Guest'},\nLESync Luxury Resort Housekeeping has secured an item left behind (${notifyItem.description}) found in ${notifyItem.foundLocation}.\nReference Code: ${notifyItem.itemCode}\nPlease call Front Desk (+880 1711-000000) to confirm collection or courier dispatch.`;
                    copyToClipboard(text);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center space-x-1.5 border border-slate-700 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Notification Text</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => handleSendNotification('SMS')}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Record SMS Sent</span>
              </button>
              <button
                onClick={() => handleSendNotification('WhatsApp')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Record WhatsApp Sent</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: SOP 90-DAY UNCLAIMED DISPOSAL */}
      {/* ========================================================================= */}
      {disposeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <form
            onSubmit={handleDisposeItem}
            className="bg-slate-900 border border-rose-500/40 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">SOP 90-Day Unclaimed Disposition</h3>
                  <p className="text-[11px] text-slate-400">{disposeItem.itemCode} • {disposeItem.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDisposeItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-rose-200 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Retention Limit Exceeded</span>
                </div>
                <p className="text-[11px] text-rose-300">
                  This item was discovered on {disposeItem.foundDate} (&gt;90 days holding period). Under Resort SOP, unclaimed non-perishable articles may be transferred or liquidated.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Disposition Channel:</label>
                <select
                  value={disposalMethod}
                  onChange={e => setDisposalMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="Charity Donation">Charity Donation (Local Orphanage / Shelter)</option>
                  <option value="Auction">Staff Annual Charity Auction / Raffle</option>
                  <option value="Discarded">Safe Destruction & Discard</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Authorized Management Sign-Off:</label>
                <input
                  type="text"
                  required
                  value={disposalApprovedBy}
                  onChange={e => setDisposalApprovedBy(e.target.value)}
                  placeholder="e.g. General Manager / Executive Housekeeper"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Disposal Notes & Justification:</label>
                <textarea
                  rows={2}
                  required
                  value={disposalNotes}
                  onChange={e => setDisposalNotes(e.target.value)}
                  placeholder="Reason for disposal and receipt number if donated"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDisposeItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-900/30 flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Disposition</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: PROPERTY 360° DETAILS & PRINTABLE CUSTODY CLEARANCE CERTIFICATE */}
      {/* ========================================================================= */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Property Custody Details</h3>
                  <span className="font-mono text-amber-400 font-bold text-xs">{selectedItem.itemCode}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Description:</span>
                <span className="font-bold text-white text-right">{selectedItem.description}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Category & Color:</span>
                <span className="text-slate-200">{selectedItem.category} ({selectedItem.color})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Found Location:</span>
                <span className="text-slate-200">{selectedItem.foundLocation}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Discovered By & Date:</span>
                <span className="text-slate-200">{selectedItem.foundBy} on {selectedItem.foundDate} ({selectedItem.foundTime})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Secure Locker & Bin:</span>
                <span className="text-amber-400 font-mono font-bold">{selectedItem.storedLocation} [{selectedItem.storageBinCode}]</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Custody Status:</span>
                <span className="font-bold text-emerald-400">{selectedItem.status}</span>
              </div>
              {selectedItem.isHighValue && (
                <div className="flex items-center justify-between text-purple-300">
                  <span>High-Value Escrow:</span>
                  <span className="font-bold font-mono">৳{(selectedItem.estimatedValue || 0).toLocaleString()} (Witnessed: {selectedItem.witnessedBy || 'Supervisor'})</span>
                </div>
              )}
              {selectedItem.claimedBy && (
                <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px] text-emerald-300">
                  <div className="font-bold">Released To: {selectedItem.claimedBy}</div>
                  <div>ID / NID Verified: {selectedItem.receiverNid || 'On File'}</div>
                  <div>Handled By: {selectedItem.returnedBy} on {selectedItem.claimedDate}</div>
                </div>
              )}
              {selectedItem.courierTrackingNumber && (
                <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px] text-blue-300 font-mono">
                  <div className="font-bold">Courier: {selectedItem.courierName} (#{selectedItem.courierTrackingNumber})</div>
                  <div>Address: {selectedItem.courierRecipientAddress}</div>
                </div>
              )}
              {selectedItem.remarks && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 italic">
                  "{selectedItem.remarks}"
                </div>
              )}
            </div>

            {/* Audit Trail */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Custody Chain & History Audit:
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs pr-1">
                {selectedItem.history.map((h, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px]">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>{h.action}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(h.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[10.5px] mt-0.5">By {h.user} • {h.notes}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => handlePrintHandoverCertificate(selectedItem)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center space-x-1.5 border border-slate-700 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>Custody Certificate (PDF)</span>
              </button>

              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
