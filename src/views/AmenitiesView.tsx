import React, { useState, useMemo, useEffect } from 'react';
import {
  Gift, Package, Bell, Receipt, BarChart3, Search, Filter, Plus,
  Sparkles, CheckCircle2, Clock, AlertTriangle, User, BedDouble,
  DollarSign, Check, X, ArrowRight, Phone, Printer, FileSpreadsheet,
  Layers, Edit3, Trash2, Tag, ShieldCheck, CreditCard, RefreshCw,
  ChevronRight, ArrowUpRight, TrendingUp, HelpCircle, Ban, Eye
} from 'lucide-react';
import { housekeepingService } from '../services/housekeepingService';
import { pmsService } from '../services/pmsService';
import {
  HousekeepingAmenity,
  AmenityConsumptionRecord,
  HousekeepingRequest,
  RequestSource,
  RequestType,
  RequestStatus,
  TaskPriority
} from '../types/housekeeping';
import * as XLSX from 'xlsx';

interface AmenitiesViewProps {
  initialTab?: string;
  onPrintInvoice?: (chargeOrInvoice: any) => void;
  onNavigate?: (route: string) => void;
}

export const AmenitiesView: React.FC<AmenitiesViewProps> = ({
  initialTab = 'master',
  onPrintInvoice,
  onNavigate
}) => {
  const normalizeTab = (tab: string) => {
    if (tab === 'master' || tab === 'amenities-master') return 'master';
    if (tab === 'issuance' || tab === 'amenities-issuance') return 'issuance';
    if (tab === 'requests' || tab === 'amenities-requests') return 'requests';
    if (tab === 'billing' || tab === 'amenities-billing') return 'billing';
    if (tab === 'reports' || tab === 'reports-amenities') return 'reports';
    return 'master';
  };

  const [activeTab, setActiveTab] = useState<'master' | 'issuance' | 'requests' | 'billing' | 'reports'>(
    normalizeTab(initialTab)
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(normalizeTab(initialTab));
    }
  }, [initialTab]);

  // Live state subscriptions
  const [hkState, setHkState] = useState(housekeepingService.getState());
  const [pmsState, setPmsState] = useState(pmsService.getState());

  useEffect(() => {
    const unsubHk = housekeepingService.subscribe(s => setHkState({ ...s }));
    const unsubPms = pmsService.subscribe(s => setPmsState({ ...s }));
    return () => {
      unsubHk();
      unsubPms();
    };
  }, []);

  const { amenities, amenityConsumptions, requests, staff } = hkState;
  const { rooms, stays, currentUser, folios } = pmsState;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [chargeableFilter, setChargeableFilter] = useState<'All' | 'Chargeable' | 'Complimentary'>('All');

  // Modals
  const [isAddAmenityModalOpen, setIsAddAmenityModalOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<HousekeepingAmenity | null>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockAmenityId, setRestockAmenityId] = useState('');
  const [restockQty, setRestockQty] = useState(50);
  const [restockNotes, setRestockNotes] = useState('');

  // Issuance Form / Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueRoomId, setIssueRoomId] = useState('');
  const [issueAmenityId, setIssueAmenityId] = useState('');
  const [issueQty, setIssueQty] = useState(1);
  const [issueAttendantName, setIssueAttendantName] = useState(currentUser.name || 'Fatema Begum');
  const [issuePostFolio, setIssuePostFolio] = useState(true);
  const [issueNotes, setIssueNotes] = useState('');
  const [selectedStayInfo, setSelectedStayInfo] = useState<{
    stayId: string;
    folioId: string;
    guestName: string;
    roomNumber: string;
    roomType: string;
  } | null>(null);

  // Request Form / Modal
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [reqRoomId, setReqRoomId] = useState('');
  const [reqSource, setReqSource] = useState<RequestSource>('Guest');
  const [reqType, setReqType] = useState<RequestType>('Extra Towel');
  const [reqPriority, setReqPriority] = useState<TaskPriority>('Normal');
  const [reqAssignedTo, setReqAssignedTo] = useState('');
  const [reqIsChargeable, setReqIsChargeable] = useState(false);
  const [reqChargeAmount, setReqChargeAmount] = useState(0);
  const [reqNotes, setReqNotes] = useState('');

  // Receipt / Voucher Modal
  const [selectedVoucherRecord, setSelectedVoucherRecord] = useState<AmenityConsumptionRecord | null>(null);

  // Void confirmation Modal
  const [voidRecordId, setVoidRecordId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // New Amenity Form State
  const [amenityFormData, setAmenityFormData] = useState<Omit<HousekeepingAmenity, 'id'>>({
    name: '',
    category: 'Bathroom',
    sku: '',
    unit: 'PCS',
    cost: 20,
    salePrice: 0,
    isChargeable: false,
    reorderLevel: 50,
    maximumLevel: 500,
    currentStock: 100,
    supplier: 'Resort Supplies Ltd',
    active: true,
    remarks: ''
  });

  // Calculate In-house guest when room is picked
  const handleRoomSelectForIssue = (roomId: string) => {
    setIssueRoomId(roomId);
    if (!roomId) {
      setSelectedStayInfo(null);
      return;
    }
    const stay = stays.find(s => s.roomId === roomId && s.status === 'Active');
    const room = rooms.find(r => r.id === roomId);
    if (stay) {
      setSelectedStayInfo({
        stayId: stay.id,
        folioId: stay.folioId,
        guestName: stay.guestName,
        roomNumber: stay.roomNumber,
        roomType: stay.roomTypeName || 'Deluxe Room'
      });
    } else {
      setSelectedStayInfo(room ? {
        stayId: '',
        folioId: '',
        guestName: 'Vacant / Room Service',
        roomNumber: room.roomNumber,
        roomType: room.roomTypeName || 'Standard Room'
      } : null);
    }
  };

  // Submit Issuance
  const handleIssueAmenitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueRoomId || !issueAmenityId || issueQty <= 0) return;

    const record = housekeepingService.recordAmenityConsumption({
      roomId: issueRoomId,
      amenityId: issueAmenityId,
      quantity: issueQty,
      attendantName: issueAttendantName,
      postChargeToFolio: issuePostFolio,
      notes: issueNotes
    });

    setIsIssueModalOpen(false);
    setIssueRoomId('');
    setIssueAmenityId('');
    setIssueQty(1);
    setIssueNotes('');
    setSelectedStayInfo(null);

    // Open voucher confirmation
    setSelectedVoucherRecord(record);
  };

  // Quick Preset Request
  const handleQuickRequest = (presetType: RequestType, defaultPriority: TaskPriority = 'Normal', chargeable = false, charge = 0) => {
    setReqType(presetType);
    setReqPriority(defaultPriority);
    setReqIsChargeable(chargeable);
    setReqChargeAmount(charge);
    setReqNotes(`Fast request created for ${presetType}`);
    setIsReqModalOpen(true);
  };

  // Submit Request
  const handleCreateRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqRoomId) return;

    housekeepingService.createRequest({
      source: reqSource,
      requestType: reqType,
      roomId: reqRoomId,
      priority: reqPriority,
      assignedTo: reqAssignedTo || undefined,
      isChargeable: reqIsChargeable,
      chargeAmount: reqIsChargeable ? reqChargeAmount : 0,
      notes: reqNotes
    });

    setIsReqModalOpen(false);
    setReqRoomId('');
    setReqNotes('');
    setReqChargeAmount(0);
    setReqIsChargeable(false);
  };

  // Save / Update Amenity Master
  const handleSaveAmenity = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAmenity) {
      housekeepingService.updateAmenity(editingAmenity.id, amenityFormData);
    } else {
      const skuGenerated = amenityFormData.sku || `AMN-${amenityFormData.category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      housekeepingService.createAmenity({
        ...amenityFormData,
        sku: skuGenerated
      });
    }
    setIsAddAmenityModalOpen(false);
    setEditingAmenity(null);
  };

  // Restock Submit
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockAmenityId || restockQty <= 0) return;
    housekeepingService.restockAmenity(restockAmenityId, restockQty, restockNotes);
    setIsRestockModalOpen(false);
    setRestockAmenityId('');
    setRestockNotes('');
  };

  // Execute Void
  const handleExecuteVoid = () => {
    if (!voidRecordId) return;
    housekeepingService.voidAmenityConsumption(voidRecordId, voidReason || 'Reversal requested by supervisor');
    setVoidRecordId(null);
    setVoidReason('');
  };

  // Export to Excel
  const exportToExcel = () => {
    const data = amenityConsumptions.map(c => ({
      'Record Number': c.recordNumber,
      'Date & Time': new Date(c.consumedAt).toLocaleString(),
      'Room Number': c.roomNumber,
      'Guest Name': c.guestName || 'In-House Guest',
      'Amenity Item': c.amenityName,
      'Quantity': c.quantity,
      'Unit Cost (BDT)': c.unitCost,
      'Unit Price (BDT)': c.unitPrice,
      'Total Charge (BDT)': c.totalAmount,
      'Chargeable': c.isChargeable ? 'Yes' : 'Complimentary',
      'Posted To Folio': c.isPostedToFolio ? 'Yes' : 'No',
      'Attendant / Runner': c.attendantName,
      'Notes': c.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Room Amenities Ledger');
    XLSX.writeFile(wb, `Room_Amenities_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Filtered amenities
  const filteredAmenities = useMemo(() => {
    return amenities.filter(item => {
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
      if (chargeableFilter === 'Chargeable' && !item.isChargeable) return false;
      if (chargeableFilter === 'Complimentary' && item.isChargeable) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchSupplier = item.supplier?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchSupplier) return false;
      }
      return true;
    });
  }, [amenities, categoryFilter, chargeableFilter, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCatalogItems = amenities.length;
    const lowStockItems = amenities.filter(a => a.currentStock <= a.reorderLevel).length;
    const totalInventoryValue = amenities.reduce((acc, a) => acc + (a.currentStock * a.cost), 0);
    const totalUnitsIssued = amenityConsumptions.reduce((acc, c) => acc + c.quantity, 0);
    const totalBilledRevenue = amenityConsumptions.filter(c => c.isChargeable).reduce((acc, c) => acc + c.totalAmount, 0);
    const totalComplimentaryCost = amenityConsumptions.filter(c => !c.isChargeable).reduce((acc, c) => acc + (c.quantity * c.unitCost), 0);
    const pendingRequests = requests.filter(r => r.status === 'New' || r.status === 'Assigned' || r.status === 'In Progress').length;

    return {
      totalCatalogItems,
      lowStockItems,
      totalInventoryValue,
      totalUnitsIssued,
      totalBilledRevenue,
      totalComplimentaryCost,
      pendingRequests
    };
  }, [amenities, amenityConsumptions, requests]);

  // Categories list
  const categoryOptions = Array.from(new Set(amenities.map(a => a.category)));

  return (
    <div className="space-y-6" id="amenities-management-root">
      {/* Top Header & Fast Action Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Room Amenities & Guest Fulfillment
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                  Housekeeping Module
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Room replenishment, guest service requests, live inventory par-levels, and automatic in-house room folio billing.
              </p>
            </div>
          </div>
        </div>

        {/* Global Fast Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-restock-amenities"
            onClick={() => setIsRestockModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border border-slate-700"
          >
            <Package className="w-4 h-4 text-amber-400" />
            <span>Restock Inventory</span>
          </button>

          <button
            id="btn-new-guest-request"
            onClick={() => {
              setReqType('Extra Towel');
              setReqPriority('Normal');
              setReqIsChargeable(false);
              setReqChargeAmount(0);
              setIsReqModalOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-blue-900/20 transition-all"
          >
            <Bell className="w-4 h-4" />
            <span>Guest Request</span>
          </button>

          <button
            id="btn-issue-amenity"
            onClick={() => {
              setIsIssueModalOpen(true);
              setIssueQty(1);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-emerald-900/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Amenity / Bill Folio</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400">Total Amenities</div>
          <div className="text-xl font-bold text-slate-100 mt-1">{metrics.totalCatalogItems} SKUs</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Bathroom & In-Room</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400">Issued Units</div>
          <div className="text-xl font-bold text-blue-400 mt-1">{metrics.totalUnitsIssued} PCS</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Delivered to Stays</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400">Billed to Folios</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">৳{(metrics.totalBilledRevenue || 0).toLocaleString()}</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Chargeable Revenue</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400">Complimentary Cost</div>
          <div className="text-xl font-bold text-purple-400 mt-1">৳{(metrics.totalComplimentaryCost || 0).toLocaleString()}</div>
          <div className="text-[10px] text-purple-400/70 mt-0.5">Standard Amenities</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400">Active Requests</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{metrics.pendingRequests} Queue</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">In-Service Runners</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400">Low Stock Alarms</div>
          <div className={`text-xl font-bold mt-1 ${metrics.lowStockItems > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {metrics.lowStockItems} Items
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Under Par Threshold</div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center space-x-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto scrollbar-thin shadow-lg">
        <button
          id="tab-amenity-master"
          onClick={() => {
            setActiveTab('master');
            if (onNavigate) onNavigate('amenities-master');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'master'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-900/20 font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Amenity Master Catalog</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800/50">
            {amenities.length}
          </span>
        </button>

        <button
          id="tab-amenity-issuance"
          onClick={() => {
            setActiveTab('issuance');
            if (onNavigate) onNavigate('amenities-issuance');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'issuance'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-900/20 font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Amenity Issuance & Replenishment</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800/50">
            {amenityConsumptions.length}
          </span>
        </button>

        <button
          id="tab-amenity-requests"
          onClick={() => {
            setActiveTab('requests');
            if (onNavigate) onNavigate('amenities-requests');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'requests'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-900/20 font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Guest Requests Pipeline</span>
          {metrics.pendingRequests > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-600 text-white font-bold">
              {metrics.pendingRequests}
            </span>
          )}
        </button>

        <button
          id="tab-amenity-billing"
          onClick={() => {
            setActiveTab('billing');
            if (onNavigate) onNavigate('amenities-billing');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'billing'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-900/20 font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Amenity Billing & Folios</span>
        </button>

        <button
          id="tab-amenity-reports"
          onClick={() => {
            setActiveTab('reports');
            if (onNavigate) onNavigate('reports-amenities');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-900/20 font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Reports & Analytics</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AMENITY MASTER CATALOG */}
      {/* ========================================================================= */}
      {activeTab === 'master' && (
        <div className="space-y-4">
          {/* Controls & Search */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search amenities by item name, SKU, or supplier..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="All">All Categories</option>
                {categoryOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={chargeableFilter}
                onChange={e => setChargeableFilter(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="All">All Billing Types</option>
                <option value="Complimentary">Complimentary Only</option>
                <option value="Chargeable">Chargeable to Folio</option>
              </select>

              <button
                id="btn-add-amenity-master"
                onClick={() => {
                  setEditingAmenity(null);
                  setAmenityFormData({
                    name: '',
                    category: 'Bathroom',
                    sku: `AMN-BAT-${Math.floor(100 + Math.random() * 900)}`,
                    unit: 'PCS',
                    cost: 25,
                    salePrice: 0,
                    isChargeable: false,
                    reorderLevel: 50,
                    maximumLevel: 500,
                    currentStock: 100,
                    supplier: 'Hospitality Supplies Ltd',
                    active: true,
                    remarks: ''
                  });
                  setIsAddAmenityModalOpen(true);
                }}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl whitespace-nowrap flex items-center space-x-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Master Table */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10.5px] tracking-wider">
                  <tr>
                    <th className="p-3.5">SKU & Item Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-center">Unit</th>
                    <th className="p-3.5 text-center">In Store Stock</th>
                    <th className="p-3.5 text-center">Min Threshold</th>
                    <th className="p-3.5 text-right">Cost Price</th>
                    <th className="p-3.5 text-right">Guest Price</th>
                    <th className="p-3.5 text-center">Billing Type</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredAmenities.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        No amenities match your current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAmenities.map(item => {
                      const isLow = item.currentStock <= item.reorderLevel;

                      return (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-bold text-slate-100">
                            <div className="flex items-center space-x-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              <span>{item.name}</span>
                            </div>
                            <div className="text-[10.5px] font-mono text-slate-400 ml-4">{item.sku}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-3.5 text-center text-slate-300 font-mono">{item.unit}</td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                              isLow ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-100'
                            }`}>
                              {item.currentStock}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-mono text-slate-400">{item.reorderLevel}</td>
                          <td className="p-3.5 text-right font-mono text-slate-400">৳{(item.cost || 0).toLocaleString()}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                            {item.isChargeable ? `৳${(item.salePrice || 0).toLocaleString()}` : 'Free'}
                          </td>
                          <td className="p-3.5 text-center">
                            {item.isChargeable ? (
                              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold text-[10.5px] border border-purple-500/30">
                                Chargeable (Folio)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10.5px] border border-emerald-500/30">
                                Complimentary
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => {
                                  setRestockAmenityId(item.id);
                                  setRestockQty(50);
                                  setIsRestockModalOpen(true);
                                }}
                                title="Quick Restock"
                                className="p-1.5 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-lg transition-colors"
                              >
                                <Package className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingAmenity(item);
                                  setAmenityFormData({
                                    name: item.name,
                                    category: item.category,
                                    sku: item.sku,
                                    unit: item.unit,
                                    cost: item.cost,
                                    salePrice: item.salePrice,
                                    isChargeable: item.isChargeable,
                                    reorderLevel: item.reorderLevel,
                                    maximumLevel: item.maximumLevel,
                                    currentStock: item.currentStock,
                                    supplier: item.supplier,
                                    active: item.active,
                                    remarks: item.remarks || ''
                                  });
                                  setIsAddAmenityModalOpen(true);
                                }}
                                title="Edit Amenity"
                                className="p-1.5 hover:bg-slate-800 text-blue-400 hover:text-blue-300 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                                    housekeepingService.deleteAmenity(item.id);
                                  }
                                }}
                                title="Delete Amenity"
                                className="p-1.5 hover:bg-slate-800 text-rose-400 hover:text-rose-300 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AMENITY ISSUANCE & REPLENISHMENT */}
      {/* ========================================================================= */}
      {activeTab === 'issuance' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Room Replenishment & Consumption Ledger</h2>
              <p className="text-xs text-slate-400">Track amenity deliveries to guest stays and floor pantries.</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={exportToExcel}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Ledger</span>
              </button>

              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-900/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Post New Issuance</span>
              </button>
            </div>
          </div>

          {/* Consumption & Issuance Table */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10.5px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Record #</th>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Room & Guest</th>
                    <th className="p-3.5">Amenity Item</th>
                    <th className="p-3.5 text-center">Qty</th>
                    <th className="p-3.5 text-right">Amount</th>
                    <th className="p-3.5 text-center">Folio Status</th>
                    <th className="p-3.5">Delivered By</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {amenityConsumptions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        No amenity issuance or consumption records posted yet.
                      </td>
                    </tr>
                  ) : (
                    amenityConsumptions.map(c => (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-amber-400">{c.recordNumber}</td>
                        <td className="p-3.5 text-slate-400 text-[11px]">
                          {new Date(c.consumedAt).toLocaleDateString()} {new Date(c.consumedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-100">Room {c.roomNumber}</div>
                          <div className="text-[10.5px] text-slate-400">{c.guestName || 'In-House Guest'}</div>
                        </td>
                        <td className="p-3.5 font-medium text-slate-200">
                          <div>{c.amenityName}</div>
                          {c.notes && <div className="text-[10.5px] text-slate-500 italic">{c.notes}</div>}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-100">{c.quantity}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                          {c.isChargeable ? `৳${(c.totalAmount || 0).toLocaleString()}` : 'Free (Complimentary)'}
                        </td>
                        <td className="p-3.5 text-center">
                          {c.isPostedToFolio ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10.5px] border border-emerald-500/30">
                              Billed to Folio
                            </span>
                          ) : c.isChargeable ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[10.5px]">
                              Unbilled
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold text-[10.5px]">
                              Standard
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-300 text-[11px]">{c.attendantName}</td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setSelectedVoucherRecord(c)}
                              title="Print Voucher / Ticket"
                              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            {c.isChargeable && !c.notes?.includes('VOIDED') && (
                              <button
                                onClick={() => {
                                  setVoidRecordId(c.id);
                                  setVoidReason('');
                                }}
                                title="Void / Refund Charge"
                                className="p-1.5 hover:bg-slate-800 text-rose-400 hover:text-rose-300 rounded-lg transition-colors"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GUEST REQUESTS PIPELINE */}
      {/* ========================================================================= */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Quick Preset Buttons Strip */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              ⚡ Quick 1-Click Guest Service Presets
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickRequest('Extra Towel', 'Normal', false, 0)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center space-x-1.5"
              >
                <span>🛁 Extra Bath Towels</span>
              </button>

              <button
                onClick={() => handleQuickRequest('Toiletries', 'Normal', false, 0)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center space-x-1.5"
              >
                <span>🌿 Eco Dental & Shaving Kit</span>
              </button>

              <button
                onClick={() => handleQuickRequest('Baby Cot', 'High', false, 0)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center space-x-1.5"
              >
                <span>👶 Baby Cot & Crib</span>
              </button>

              <button
                onClick={() => handleQuickRequest('Water', 'Normal', false, 0)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center space-x-1.5"
              >
                <span>💧 Extra Spring Water</span>
              </button>

              <button
                onClick={() => handleQuickRequest('Iron', 'Normal', false, 0)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center space-x-1.5"
              >
                <span>👔 Steam Iron & Board</span>
              </button>

              <button
                onClick={() => handleQuickRequest('Other', 'Normal', true, 1200)}
                className="px-3 py-1.5 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 rounded-xl text-xs font-semibold border border-purple-700/40 flex items-center space-x-1.5"
              >
                <span>✨ Luxury Bathrobe (Chargeable ৳1,200)</span>
              </button>
            </div>
          </div>

          {/* Requests Board / Table */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10.5px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Req #</th>
                    <th className="p-3.5">Room & Guest</th>
                    <th className="p-3.5">Request Type</th>
                    <th className="p-3.5 text-center">Priority</th>
                    <th className="p-3.5">Assigned Runner</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Charge</th>
                    <th className="p-3.5 text-right">Workflow Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No active housekeeping amenity requests.
                      </td>
                    </tr>
                  ) : (
                    requests.map(req => {
                      const isPending = req.status === 'New' || req.status === 'Assigned' || req.status === 'In Progress';

                      return (
                        <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-amber-400">{req.requestNumber}</td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-100">Room {req.roomNumber}</div>
                            <div className="text-[10.5px] text-slate-400">{req.guestName || 'In-House Resident'}</div>
                          </td>
                          <td className="p-3.5 font-medium text-slate-200">
                            <div>{req.requestType}</div>
                            {req.notes && <div className="text-[10.5px] text-slate-400">{req.notes}</div>}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                              req.priority === 'VIP' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                              req.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                              req.priority === 'High' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {req.priority}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {req.assignedAttendantName ? (
                              <div className="flex items-center space-x-1 text-slate-200">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>{req.assignedAttendantName}</span>
                              </div>
                            ) : (
                              <select
                                onChange={e => housekeepingService.assignRequest(req.id, e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300"
                              >
                                <option value="">Assign Runner...</option>
                                {staff.map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                              req.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              req.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300' :
                              req.status === 'Assigned' ? 'bg-amber-500/20 text-amber-300' :
                              req.status === 'Cancelled' ? 'bg-slate-800 text-slate-500' : 'bg-rose-500/20 text-rose-300 animate-pulse'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                            {req.isChargeable ? `৳${(req.chargeAmount || 0).toLocaleString()}` : 'Free'}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => housekeepingService.updateRequestStatus(req.id, 'In Progress')}
                                    className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg text-[11px] font-semibold transition-colors"
                                  >
                                    Start
                                  </button>
                                  <button
                                    onClick={() => housekeepingService.updateRequestStatus(req.id, 'Completed')}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shadow transition-colors flex items-center space-x-1"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Delivered</span>
                                  </button>
                                </>
                              )}
                              {req.status === 'Completed' && (
                                <span className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Fulfilled</span>
                                </span>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AMENITY BILLING & FOLIOS */}
      {/* ========================================================================= */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Chargeable Amenities & Room Folio Ledger</h2>
              <p className="text-xs text-slate-400">All chargeable items posted directly to guest accounts with GL ledger tracking.</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={exportToExcel}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Accounting Ledger</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10.5px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Charge Ref #</th>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Room & Guest</th>
                    <th className="p-3.5">Chargeable Amenity</th>
                    <th className="p-3.5 text-center">Quantity</th>
                    <th className="p-3.5 text-right">Unit Price</th>
                    <th className="p-3.5 text-right">Grand Total</th>
                    <th className="p-3.5 text-center">Folio Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {amenityConsumptions.filter(c => c.isChargeable).length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        No chargeable amenity transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    amenityConsumptions.filter(c => c.isChargeable).map(c => (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-amber-400">{c.recordNumber}</td>
                        <td className="p-3.5 text-slate-400 text-[11px]">
                          {new Date(c.consumedAt).toLocaleDateString()} {new Date(c.consumedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-100">Room {c.roomNumber}</div>
                          <div className="text-[10.5px] text-slate-400">{c.guestName || 'In-House Stay'}</div>
                        </td>
                        <td className="p-3.5 font-medium text-slate-200">
                          <div>{c.amenityName}</div>
                          {c.notes && <div className="text-[10.5px] text-slate-500">{c.notes}</div>}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-100">{c.quantity}</td>
                        <td className="p-3.5 text-right font-mono text-slate-400">৳{(c.unitPrice || 0).toLocaleString()}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                          ৳{(c.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center">
                          {c.isPostedToFolio ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10.5px] border border-emerald-500/30">
                              Posted (GL 1100)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[10.5px]">
                              Unposted
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setSelectedVoucherRecord(c)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Invoice</span>
                            </button>
                            {!c.notes?.includes('VOIDED') && (
                              <button
                                onClick={() => {
                                  setVoidRecordId(c.id);
                                  setVoidReason('');
                                }}
                                className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 rounded-lg text-[11px] font-semibold transition-colors"
                              >
                                Void
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: REPORTS & ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Top Report Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Room Amenity Consumption & Valuation Intelligence</h2>
              <p className="text-xs text-slate-400">Detailed replenishment metrics, high-demand items, and par level stock replenishment.</p>
            </div>

            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-900/20 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel Analytics Report</span>
            </button>
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>Consumption Distribution by Category</span>
                <span className="text-[11px] text-amber-400 font-normal">Active Stays</span>
              </h3>

              <div className="space-y-3">
                {categoryOptions.map(cat => {
                  const catItems = amenities.filter(a => a.category === cat);
                  const totalStock = catItems.reduce((acc, a) => acc + a.currentStock, 0);
                  const consumed = amenityConsumptions.filter(c => {
                    const matched = amenities.find(a => a.id === c.amenityId);
                    return matched?.category === cat;
                  }).reduce((acc, c) => acc + c.quantity, 0);

                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-200">{cat}</span>
                        <span className="text-slate-400 font-mono">
                          {consumed} issued • {totalStock} in store
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(10, (consumed / (consumed + totalStock || 1)) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reorder & Par-Level Alerts */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>Inventory Reorder & Par-Level Alarms</span>
                <span className="text-[11px] text-rose-400 font-normal">Stock Level Alert</span>
              </h3>

              <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                {amenities.filter(a => a.currentStock <= a.reorderLevel).length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    All room amenities are stocked above par reorder thresholds.
                  </div>
                ) : (
                  amenities.filter(a => a.currentStock <= a.reorderLevel).map(item => (
                    <div key={item.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200 text-xs">{item.name}</div>
                        <div className="text-[10.5px] text-slate-400">{item.sku} • {item.supplier}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-xs font-bold font-mono text-rose-400">{item.currentStock} {item.unit}</div>
                          <div className="text-[10px] text-slate-500">Par: {item.reorderLevel}</div>
                        </div>
                        <button
                          onClick={() => {
                            setRestockAmenityId(item.id);
                            setRestockQty(item.reorderLevel * 2);
                            setIsRestockModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] transition-colors"
                        >
                          Reorder
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: POST AMENITY ISSUANCE */}
      {/* ========================================================================= */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Issue Room Amenity</h3>
                  <p className="text-[11px] text-slate-400">Deliver room amenities to in-house guest or floor stock.</p>
                </div>
              </div>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssueAmenitySubmit} className="p-5 space-y-4 text-xs">
              {/* Room Picker */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Room Number *</label>
                <select
                  required
                  value={issueRoomId}
                  onChange={e => handleRoomSelectForIssue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="">Select Room...</option>
                  {rooms.map(r => {
                    const activeStay = stays.find(s => s.roomId === r.id && s.status === 'Active');
                    return (
                      <option key={r.id} value={r.id}>
                        Room {r.roomNumber} ({r.roomTypeName}) {activeStay ? `• In-House: ${activeStay.guestName}` : '• Vacant'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* In-House Stay Info Banner */}
              {selectedStayInfo && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11.5px] space-y-1">
                  <div className="flex justify-between font-bold text-slate-200">
                    <span>Resident Guest:</span>
                    <span className="text-emerald-400">{selectedStayInfo.guestName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Room:</span>
                    <span>{selectedStayInfo.roomNumber} ({selectedStayInfo.roomType})</span>
                  </div>
                  {selectedStayInfo.folioId && (
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Folio Account:</span>
                      <span className="font-mono text-blue-400">{selectedStayInfo.folioId}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Amenity Picker */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Amenity Item *</label>
                <select
                  required
                  value={issueAmenityId}
                  onChange={e => {
                    const item = amenities.find(a => a.id === e.target.value);
                    setIssueAmenityId(e.target.value);
                    if (item) {
                      setIssuePostFolio(item.isChargeable);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="">Choose item...</option>
                  {amenities.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} (In Store: {a.currentStock} {a.unit}) • {a.isChargeable ? `Chargeable ৳${a.salePrice}` : 'Free'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Qty & Attendant */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={issueQty}
                    onChange={e => setIssueQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Delivered By (Attendant)</label>
                  <select
                    value={issueAttendantName}
                    onChange={e => setIssueAttendantName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {staff.map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Folio Billing Checkbox */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">Bill Charge directly to Guest Room Folio</div>
                  <div className="text-[10.5px] text-slate-400">Automatically debit guest account on delivery</div>
                </div>
                <input
                  type="checkbox"
                  checked={issuePostFolio}
                  onChange={e => setIssuePostFolio(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Delivery Notes / Reason</label>
                <input
                  type="text"
                  value={issueNotes}
                  onChange={e => setIssueNotes(e.target.value)}
                  placeholder="e.g. Guest requested additional toothbrushes during evening turndown"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20"
                >
                  Post Issuance & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: GUEST SERVICE REQUEST */}
      {/* ========================================================================= */}
      {isReqModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Create Guest Service Request</h3>
                  <p className="text-[11px] text-slate-400">Log guest need for immediate dispatch & runner tracking.</p>
                </div>
              </div>
              <button
                onClick={() => setIsReqModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequestSubmit} className="p-5 space-y-4 text-xs">
              {/* Room & Request Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Room Number *</label>
                  <select
                    required
                    value={reqRoomId}
                    onChange={e => setReqRoomId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Room...</option>
                    {rooms.map(r => {
                      const stay = stays.find(s => s.roomId === r.id && s.status === 'Active');
                      return (
                        <option key={r.id} value={r.id}>
                          Room {r.roomNumber} {stay ? `(${stay.guestName})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Request Item / Service *</label>
                  <select
                    value={reqType}
                    onChange={e => setReqType(e.target.value as RequestType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Extra Towel">Extra Towels (Bath / Face)</option>
                    <option value="Extra Pillow">Extra Feather Pillows</option>
                    <option value="Extra Blanket">Extra Duvet / Blanket</option>
                    <option value="Baby Cot">Baby Cot / Crib</option>
                    <option value="Toiletries">Dental Kit / Toiletries</option>
                    <option value="Water">Mineral Spring Water</option>
                    <option value="Iron">Steam Iron & Board</option>
                    <option value="Room Cleaning">Express Room Tidy</option>
                    <option value="Turndown">Evening Turndown Service</option>
                    <option value="Laundry">Guest Laundry Pickup</option>
                    <option value="Other">Special Amenity Request</option>
                  </select>
                </div>
              </div>

              {/* Priority & Source */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority Level</label>
                  <select
                    value={reqPriority}
                    onChange={e => setReqPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High (Immediate)</option>
                    <option value="Urgent">Urgent (Express)</option>
                    <option value="VIP">VIP Guest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Request Channel</label>
                  <select
                    value={reqSource}
                    onChange={e => setReqSource(e.target.value as RequestSource)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Guest">Guest Phone / In-Room</option>
                    <option value="Front Desk">Front Desk Call</option>
                    <option value="Housekeeping">Housekeeping Floor Check</option>
                    <option value="Other Departments">Butler / Management</option>
                  </select>
                </div>
              </div>

              {/* Assign Staff */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assign Attendant / Runner</label>
                <select
                  value={reqAssignedTo}
                  onChange={e => setReqAssignedTo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Auto-Assign to Next Available Staff...</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              {/* Chargeable Toggle */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Chargeable to Guest Folio</span>
                  <input
                    type="checkbox"
                    checked={reqIsChargeable}
                    onChange={e => setReqIsChargeable(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                  />
                </div>
                {reqIsChargeable && (
                  <div className="pt-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Charge Amount (BDT)</label>
                    <input
                      type="number"
                      min="0"
                      value={reqChargeAmount}
                      onChange={e => setReqChargeAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-emerald-400 font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Special Instructions / Remarks</label>
                <input
                  type="text"
                  value={reqNotes}
                  onChange={e => setReqNotes(e.target.value)}
                  placeholder="e.g. Please deliver before 10:00 PM with soft pillows"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsReqModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20"
                >
                  Dispatch Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD / EDIT AMENITY MASTER ITEM */}
      {/* ========================================================================= */}
      {isAddAmenityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">
                    {editingAmenity ? 'Edit Amenity Master Item' : 'Add New Room Amenity'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Configure item specs, par levels, and billing type.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddAmenityModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAmenity} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Amenity Name *</label>
                <input
                  type="text"
                  required
                  value={amenityFormData.name}
                  onChange={e => setAmenityFormData({ ...amenityFormData, name: e.target.value })}
                  placeholder="e.g. Eco Bamboo Toothbrush & Paste Set"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={amenityFormData.category}
                    onChange={e => setAmenityFormData({ ...amenityFormData, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Bathroom">Bathroom Essentials</option>
                    <option value="Beverage">Beverage & Mini-Bar</option>
                    <option value="Room Comfort">Room Comfort & Linen</option>
                    <option value="Sanitary">Sanitary Supplies</option>
                    <option value="Stationery">Stationery & Desk</option>
                    <option value="Other">Other Provisions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unit of Measure (UOM)</label>
                  <select
                    value={amenityFormData.unit}
                    onChange={e => setAmenityFormData({ ...amenityFormData, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="PCS">PCS (Piece)</option>
                    <option value="SET">SET (Pack/Kit)</option>
                    <option value="BTL">BTL (Bottle)</option>
                    <option value="BOX">BOX</option>
                    <option value="PAIR">PAIR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Current Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={amenityFormData.currentStock}
                    onChange={e => setAmenityFormData({ ...amenityFormData, currentStock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Reorder Par Level</label>
                  <input
                    type="number"
                    min="0"
                    value={amenityFormData.reorderLevel}
                    onChange={e => setAmenityFormData({ ...amenityFormData, reorderLevel: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unit Cost (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    value={amenityFormData.cost}
                    onChange={e => setAmenityFormData({ ...amenityFormData, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Chargeable Toggle & Sale Price */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200">Chargeable Amenity (Bill to Folio)</span>
                    <p className="text-[10px] text-slate-400">Uncheck for complimentary standard amenities</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={amenityFormData.isChargeable}
                    onChange={e => setAmenityFormData({ ...amenityFormData, isChargeable: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                  />
                </div>
                {amenityFormData.isChargeable && (
                  <div className="pt-1">
                    <label className="block text-[11px] text-slate-400 mb-1">Guest Sale Price (BDT) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={amenityFormData.salePrice}
                      onChange={e => setAmenityFormData({ ...amenityFormData, salePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Supplier & Remarks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Primary Supplier</label>
                  <input
                    type="text"
                    value={amenityFormData.supplier}
                    onChange={e => setAmenityFormData({ ...amenityFormData, supplier: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                      <span>SKU Code</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Auto-Generated
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setAmenityFormData({
                        ...amenityFormData,
                        sku: `AMN-${amenityFormData.category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
                      })}
                      className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerate</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={amenityFormData.sku}
                      onChange={e => setAmenityFormData({ ...amenityFormData, sku: e.target.value })}
                      placeholder="Auto-generating SKU..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setAmenityFormData({
                        ...amenityFormData,
                        sku: `AMN-${amenityFormData.category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
                      })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                      title="Generate new unique SKU"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    Auto-generated unique SKU. Users never need to type.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddAmenityModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg"
                >
                  {editingAmenity ? 'Save Changes' : 'Create Amenity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RESTOCK INVENTORY */}
      {/* ========================================================================= */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-100 text-sm">Restock Store Inventory</h3>
              </div>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Amenity *</label>
                <select
                  required
                  value={restockAmenityId}
                  onChange={e => setRestockAmenityId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Amenity SKU...</option>
                  {amenities.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Current: {a.currentStock} {a.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Restock Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={e => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Supplier / GRN Batch Notes</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={e => setRestockNotes(e.target.value)}
                  placeholder="e.g. GRN-2026-0812 from Fresh Water Corp"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow"
                >
                  Add Stock to Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: PRINTABLE VOUCHER / RECEIPT */}
      {/* ========================================================================= */}
      {selectedVoucherRecord && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">Amenity Delivery Slip</h3>
              </div>
              <button
                onClick={() => setSelectedVoucherRecord(null)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 bg-white text-slate-900 space-y-4 font-sans text-xs">
              <div className="text-center border-b pb-3">
                <div className="font-black text-base uppercase tracking-wider">CCULB RESORT & CONVENTION</div>
                <div className="text-[11px] text-slate-600">Housekeeping Amenities & Guest Provision</div>
                <div className="font-mono text-[11px] font-bold text-slate-800 mt-1">
                  VOUCHER: {selectedVoucherRecord.recordNumber}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">Room:</span>{' '}
                  <strong className="text-slate-900">Room {selectedVoucherRecord.roomNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Date:</span>{' '}
                  <strong>{new Date(selectedVoucherRecord.consumedAt).toLocaleDateString()}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Guest Name:</span>{' '}
                  <strong>{selectedVoucherRecord.guestName || 'In-House Stay'}</strong>
                </div>
                {selectedVoucherRecord.folioId && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Folio Account:</span>{' '}
                    <strong className="font-mono">{selectedVoucherRecord.folioId}</strong>
                  </div>
                )}
              </div>

              <div className="border-t border-b py-2 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>{selectedVoucherRecord.amenityName}</span>
                  <span>x{selectedVoucherRecord.quantity}</span>
                </div>
                {selectedVoucherRecord.isChargeable ? (
                  <div className="flex justify-between font-mono font-bold text-sm text-slate-900 pt-1">
                    <span>Total Folio Charge:</span>
                    <span>৳{(selectedVoucherRecord.totalAmount || 0).toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="text-emerald-700 font-bold text-[11px]">
                    ✓ Complimentary Room Provision
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-between text-[10px] text-slate-500">
                <div>
                  <div>Delivered By:</div>
                  <div className="font-semibold text-slate-800">{selectedVoucherRecord.attendantName}</div>
                </div>
                <div className="text-right">
                  <div>Guest Signature:</div>
                  <div className="mt-4 border-b border-slate-400 w-24"></div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedVoucherRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: VOID CONFIRMATION */}
      {/* ========================================================================= */}
      {voidRecordId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Void & Reverse Amenity Charge</span>
            </div>
            <p className="text-slate-300">
              This will refund the charge from the guest folio and restore the item inventory in store.
            </p>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Reason for Reversal *</label>
              <input
                type="text"
                required
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                placeholder="e.g. Returned unused / incorrect room billed"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setVoidRecordId(null)}
                className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteVoid}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
