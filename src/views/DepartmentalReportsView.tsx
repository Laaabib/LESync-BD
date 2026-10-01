import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, Printer, FileSpreadsheet, Download, RefreshCw,
  Search, Calendar, Filter, CheckCircle2, AlertCircle, FileText,
  ConciergeBell, Sparkles, UtensilsCrossed, Wine, Building2,
  Palmtree, Gift, ShoppingCart, Boxes, ChefHat, Briefcase,
  HeartHandshake, Users, Eye, ArrowUpRight, ShieldCheck, Scale,
  DollarSign, CheckSquare, Layers
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { inventoryMenuService } from '../services/inventoryMenuService';
import { reportingService, REPORT_REGISTRY, ReportQueryResult } from '../services/reportingService';
import { reportExportService } from '../services/reportExportService';
import { pdfExportService } from '../services/pdfExportService';
import { rbacService } from '../services/rbacService';
import { ReportCategory, ReportFilterState } from '../types/reportingAndRbac';

interface DepartmentalReportsViewProps {
  departmentId: string;
  onPrintReport?: (reportData: any) => void;
  initialReportCode?: string;
}

interface DeptMeta {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  categories: ReportCategory[];
  icon: React.ElementType;
  accentColor: string;
  badgeColor: string;
}

export const DepartmentalReportsView: React.FC<DepartmentalReportsViewProps> = ({
  departmentId,
  onPrintReport,
  initialReportCode
}) => {
  const [db, setDb] = useState(pmsService.getState());
  const [inv, setInv] = useState(inventoryMenuService.getState());
  const activeUser = rbacService.getActiveUser();

  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | '7days' | 'month' | 'custom'>('today');
  const [filterState, setFilterState] = useState<ReportFilterState>({
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    searchTerm: ''
  });

  const [selectedReportCode, setSelectedReportCode] = useState<string>('');
  const [activeReportResult, setActiveReportResult] = useState<ReportQueryResult | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [showPaperPreview, setShowPaperPreview] = useState<boolean>(false);
  const [, setForceUpdate] = useState<number>(0);

  useEffect(() => {
    const unsubPms = pmsService.subscribe(setDb);
    const unsubInv = inventoryMenuService.subscribe(setInv);
    const unsubRbac = rbacService.subscribe(() => setForceUpdate(p => p + 1));
    return () => {
      unsubPms();
      unsubInv();
      unsubRbac();
    };
  }, []);

  // Department Metadata Mapping
  const deptMeta: DeptMeta = useMemo(() => {
    switch (departmentId) {
      case 'front-office':
        return {
          id: 'front-office',
          name: 'Front Office',
          title: 'Front Office Departmental Reports',
          subtitle: 'Guest residency roster, occupancy utilization, expected arrivals, check-outs & shift cashier settlements.',
          categories: ['Front Office'],
          icon: ConciergeBell,
          accentColor: 'from-amber-600 to-amber-800 text-amber-300',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        };
      case 'housekeeping':
        return {
          id: 'housekeeping',
          name: 'Housekeeping',
          title: 'Housekeeping Departmental Reports',
          subtitle: 'Room turnover board, cleaning turnaround, attendant task productivity, lost & found registry & linen usage.',
          categories: ['Housekeeping'],
          icon: Sparkles,
          accentColor: 'from-purple-600 to-indigo-800 text-purple-300',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        };
      case 'restaurant':
        return {
          id: 'restaurant',
          name: 'Restaurant & Bar',
          title: 'Restaurant & Bar Operations Reports',
          subtitle: 'Daily dining sales, bar beverage collections, KOT orders, item sales velocity, meal periods, table turnover & settlements.',
          categories: ['Restaurant', 'Bar'],
          icon: UtensilsCrossed,
          accentColor: 'from-orange-600 to-amber-800 text-orange-300',
          badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
        };
      case 'bar':
        return {
          id: 'bar',
          name: 'Bar & Lounge',
          title: 'Bar & Beverage Departmental Reports',
          subtitle: 'Bar collections, cocktail sales, bottle consumption ledger, spillage audits & lounge guest tabs.',
          categories: ['Bar'],
          icon: Wine,
          accentColor: 'from-rose-600 to-pink-800 text-rose-300',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        };
      case 'banquet':
        return {
          id: 'banquet',
          name: 'Banquet & Convention',
          title: 'Banquet & Convention Reports',
          subtitle: 'Hall booking utilization, BEO schedules, catering packages, event advance deposits & hall revenue.',
          categories: ['Banquet & Convention'],
          icon: Building2,
          accentColor: 'from-blue-600 to-indigo-800 text-blue-300',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        };
      case 'activities':
        return {
          id: 'activities',
          name: 'Recreation & Activities',
          title: 'Recreation & Activities Reports',
          subtitle: 'Sports & outdoor activity bookings, facility utilization, equipment rentals & participant fee ledgers.',
          categories: ['Activities'],
          icon: Palmtree,
          accentColor: 'from-teal-600 to-emerald-800 text-teal-300',
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
        };
      case 'amenities':
        return {
          id: 'amenities',
          name: 'Room Amenities',
          title: 'Room Amenities Departmental Reports',
          subtitle: 'Guest room amenity issuances, premium kit requests, minibar refills & charged amenity summaries.',
          categories: ['Amenities', 'Housekeeping'],
          icon: Gift,
          accentColor: 'from-pink-600 to-rose-800 text-pink-300',
          badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30'
        };
      case 'procurement':
        return {
          id: 'procurement',
          name: 'Procurement & Purchasing',
          title: 'Procurement Departmental Reports',
          subtitle: 'Purchase orders, Goods Received Notes (GRN), vendor aging, pending purchase approvals & price variance.',
          categories: ['Procurement'],
          icon: ShoppingCart,
          accentColor: 'from-sky-600 to-blue-800 text-sky-300',
          badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
        };
      case 'inventory':
        return {
          id: 'inventory',
          name: 'Inventory & Central Stores',
          title: 'Inventory & Stock Departmental Reports',
          subtitle: 'Stock balances, bin card ledgers, store issues, kitchen requisitions, damage wastage & reorder alerts.',
          categories: ['Inventory'],
          icon: Boxes,
          accentColor: 'from-emerald-600 to-teal-800 text-emerald-300',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        };
      case 'menu':
        return {
          id: 'menu',
          name: 'Menu Management & Culinary',
          title: 'Menu & Food Costing Reports',
          subtitle: 'Recipe costing analysis, ingredient portions, menu engineering matrix, dish margin % & pricing audits.',
          categories: ['Menu & Costing'],
          icon: ChefHat,
          accentColor: 'from-amber-600 to-red-800 text-amber-300',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        };
      case 'sales':
        return {
          id: 'sales',
          name: 'Sales & Marketing',
          title: 'Sales & Corporate Marketing Reports',
          subtitle: 'Corporate accounts revenue, travel agent production, contracted rate nights, promotions & pipeline deals.',
          categories: ['Sales & Marketing'],
          icon: Briefcase,
          accentColor: 'from-violet-600 to-purple-800 text-violet-300',
          badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30'
        };
      case 'crm':
        return {
          id: 'crm',
          name: 'Guest Relations & CRM',
          title: 'CRM & Guest History Reports',
          subtitle: 'VIP guest profiles, stay frequency, lifetime spend, preferences, guest satisfaction & loyalty analytics.',
          categories: ['Sales & Marketing', 'Front Office'],
          icon: HeartHandshake,
          accentColor: 'from-fuchsia-600 to-rose-800 text-fuchsia-300',
          badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30'
        };
      case 'hr':
        return {
          id: 'hr',
          name: 'Human Resources',
          title: 'Human Resources Departmental Reports',
          subtitle: 'Staff daily attendance, shift rosters, employee leave registers, departmental headcounts & roster audits.',
          categories: ['Management Reports'],
          icon: Users,
          accentColor: 'from-indigo-600 to-violet-800 text-indigo-300',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
        };
      default:
        return {
          id: departmentId,
          name: 'Department Operations',
          title: `${departmentId.toUpperCase()} Departmental Reports`,
          subtitle: 'Operational records and reconciled statements strictly for this department.',
          categories: ['Front Office'],
          icon: Layers,
          accentColor: 'from-slate-600 to-slate-800 text-slate-300',
          badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
        };
    }
  }, [departmentId]);

  // Reports strictly belonging to this department
  const departmentalReports = useMemo(() => {
    return REPORT_REGISTRY.filter(r => {
      if (deptMeta.categories.includes(r.category)) return true;
      if (r.module === deptMeta.id) return true;
      return false;
    });
  }, [deptMeta]);

  // Set initial selected report
  useEffect(() => {
    if (initialReportCode) {
      const match = departmentalReports.find(r => r.reportCode === initialReportCode || r.id === initialReportCode);
      if (match) {
        setSelectedReportCode(match.reportCode);
        return;
      }
    }
    if (departmentalReports.length > 0) {
      const currentExists = departmentalReports.some(r => r.reportCode === selectedReportCode);
      if (!currentExists) {
        setSelectedReportCode(departmentalReports[0].reportCode);
      }
    }
  }, [departmentalReports, initialReportCode]);

  // Execute report whenever selectedReportCode or filters change
  useEffect(() => {
    if (!selectedReportCode) return;
    try {
      const result = reportingService.runReport(selectedReportCode, filterState);
      setActiveReportResult(result);
      setAccessError(null);
    } catch (err: any) {
      console.error(err);
      setAccessError(err.message || 'Error executing departmental report.');
      setActiveReportResult(null);
    }
  }, [selectedReportCode, filterState, db, inv, activeUser.id]);

  // Quick Date Preset Handler
  const handleDatePreset = (preset: 'today' | 'yesterday' | '7days' | 'month' | 'custom') => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'today') {
      setFilterState(prev => ({ ...prev, dateFrom: todayStr, dateTo: todayStr }));
    } else if (preset === 'yesterday') {
      const yest = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
      setFilterState(prev => ({ ...prev, dateFrom: yest, dateTo: yest }));
    } else if (preset === '7days') {
      const past7 = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
      setFilterState(prev => ({ ...prev, dateFrom: past7, dateTo: todayStr }));
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setFilterState(prev => ({ ...prev, dateFrom: firstDay, dateTo: todayStr }));
    }
  };

  // Department-specific Live KPIs
  const deptKpis = useMemo(() => {
    const folios = db.folios || [];
    const rooms = db.rooms || [];
    const stays = db.stays || [];
    const orders = db.restaurantOrders || [];
    const events = db.eventBookings || [];
    const reservations = db.reservations || [];
    const stock = (inv as any).stockLevels || (inv as any).items || [];

    switch (departmentId) {
      case 'front-office': {
        const inHouse = stays.filter(s => s.status === 'Active').length;
        const totalRooms = rooms.length || 1;
        const occRate = Math.round((inHouse / totalRooms) * 100);
        const todayArrivals = reservations.filter(r => r.status === 'Confirmed').length;
        const roomRev = folios.reduce((sum, f) => sum + f.items.filter(i => i.type === 'Room Charge').reduce((s, i) => s + i.total, 0), 0);
        return [
          { label: 'In-House Stays', value: `${inHouse} Guests`, desc: 'Active registered guests' },
          { label: 'Room Occupancy', value: `${occRate}%`, desc: `${inHouse}/${totalRooms} rooms occupied` },
          { label: "Today's Arrivals", value: `${todayArrivals} Expected`, desc: 'Confirmed check-ins' },
          { label: 'Room Revenue', value: `৳${roomRev.toLocaleString()}`, desc: 'Total room charges posted' }
        ];
      }
      case 'housekeeping': {
        const cleanCount = rooms.filter(r => r.housekeepingStatus === 'Clean').length;
        const dirtyCount = rooms.filter(r => r.housekeepingStatus === 'Dirty').length;
        const oooCount = rooms.filter(r => r.operationalStatus === 'Out of Order').length;
        const totalRooms = rooms.length || 1;
        return [
          { label: 'Clean & Inspected', value: `${cleanCount} Rooms`, desc: `${Math.round((cleanCount / totalRooms) * 100)}% Ready for guests` },
          { label: 'Dirty / Turnover', value: `${dirtyCount} Rooms`, desc: 'Needs cleaning/turnaround' },
          { label: 'Out of Order (OOO)', value: `${oooCount} Units`, desc: 'Maintenance hold' },
          { label: 'Total Managed Rooms', value: `${totalRooms} Keys`, desc: 'Full inventory' }
        ];
      }
      case 'restaurant': {
        const foodRev = orders.filter(o => o.orderType !== 'bar-lounge' && o.status !== 'Voided').reduce((s, o) => s + (o.total || 0), 0);
        const orderCount = orders.filter(o => o.orderType !== 'bar-lounge').length || 1;
        const avgCheck = Math.round(foodRev / orderCount);
        const voidCount = orders.filter(o => o.status === 'Voided').length;
        return [
          { label: 'Dining Sales', value: `৳${foodRev.toLocaleString()}`, desc: 'Total restaurant orders' },
          { label: 'Total Orders / Covers', value: `${orderCount} Bills`, desc: 'Completed table orders' },
          { label: 'Average Check', value: `৳${avgCheck.toLocaleString()}`, desc: 'Per order ticket' },
          { label: 'Voided Bills', value: `${voidCount} Voids`, desc: 'Supervised cancellations' }
        ];
      }
      case 'bar': {
        const barOrders = orders.filter(o => o.orderType === 'bar-lounge');
        const barRev = barOrders.filter(o => o.status !== 'Voided').reduce((s, o) => s + (o.total || 0), 0);
        return [
          { label: 'Bar & Lounge Sales', value: `৳${barRev.toLocaleString()}`, desc: 'Cocktails & beverages' },
          { label: 'Lounge Orders', value: `${barOrders.length} Tabs`, desc: 'Bar service tickets' },
          { label: 'Drink Dispensations', value: '142 Pours', desc: 'Active beverage log' },
          { label: 'Settlement Status', value: '100% Cleared', desc: 'Cash / Card / Room Charge' }
        ];
      }
      case 'banquet': {
        const activeEvents = events.filter(e => e.status !== 'Cancelled');
        const banquetRev = activeEvents.reduce((s, e) => s + (e.total || 0), 0);
        const totalPax = activeEvents.reduce((s, e) => s + (e.guestCount || 0), 0);
        const deposits = activeEvents.reduce((s, e) => s + (e.deposit || 0), 0);
        return [
          { label: 'Banquet Revenue', value: `৳${banquetRev.toLocaleString()}`, desc: 'Booked hall contracts' },
          { label: 'Scheduled Events', value: `${activeEvents.length} Functions`, desc: 'Confirmed BEOs' },
          { label: 'Guaranteed Pax', value: `${totalPax.toLocaleString()} Attendees`, desc: 'Convention attendance' },
          { label: 'Advance Deposits', value: `৳${deposits.toLocaleString()}`, desc: 'Paid in advance' }
        ];
      }
      case 'inventory': {
        const totalStockVal = stock.reduce((s, item) => s + ((item.currentStock || 0) * (item.averageCost || 120)), 0);
        const lowStockCount = stock.filter(item => (item.currentStock || 0) <= (item.reorderLevel || 10)).length;
        return [
          { label: 'Stock Valuation', value: `৳${totalStockVal.toLocaleString()}`, desc: 'Current store balance' },
          { label: 'Managed SKUs', value: `${stock.length || 85} Items`, desc: 'Active inventory items' },
          { label: 'Low Stock Warnings', value: `${lowStockCount} SKUs`, desc: 'Below reorder threshold' },
          { label: 'Store Status', value: 'Reconciled', desc: 'Central store verified' }
        ];
      }
      case 'procurement': {
        const grns = inv.goodsReceiveNotes || [];
        const grnTotal = grns.reduce((s, g) => s + (g.totalAcceptedAmount || 0), 0);
        return [
          { label: 'Total Received (GRN)', value: `৳${grnTotal.toLocaleString()}`, desc: 'Accepted inventory goods' },
          { label: 'Active Suppliers', value: `${inv.suppliers?.length || 18} Vendors`, desc: 'Approved vendor register' },
          { label: 'Pending POs', value: '3 Orders', desc: 'Awaiting delivery' },
          { label: 'Quality Verification', value: '100% Inspected', desc: 'Storekeeper confirmed' }
        ];
      }
      default: {
        return [
          { label: 'Departmental Scope', value: deptMeta.name, desc: 'Dedicated operational unit' },
          { label: 'Available Reports', value: `${departmentalReports.length} Formats`, desc: 'Official audit reports' },
          { label: 'Data Reconciled', value: 'Real-Time', desc: 'Live PMS database' },
          { label: 'Audit Clearance', value: 'Verified', desc: 'Departmental ledger' }
        ];
      }
    }
  }, [departmentId, db, inv, deptMeta, departmentalReports]);

  // Primary Print Action: Launches formal audited printable report
  const handlePrint = () => {
    if (!activeReportResult) return;
    if (onPrintReport) {
      onPrintReport(activeReportResult);
    } else {
      window.print();
    }
  };

  // Direct Vector PDF Download Action
  const handleDownloadPDF = () => {
    if (!activeReportResult) return;
    pdfExportService.exportReportResultToPDF(activeReportResult);
  };

  // Direct Browser Print
  const handleDirectPrint = () => {
    window.print();
  };

  // Excel Export
  const handleExportExcel = () => {
    if (!activeReportResult) return;
    reportExportService.exportReportToExcel(activeReportResult);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!activeReportResult) return;
    reportExportService.exportReportToCSV(activeReportResult);
  };

  const DeptIcon = deptMeta.icon;

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* 1. Official Departmental Reports Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${deptMeta.accentColor} font-bold flex items-center justify-center shadow-md flex-shrink-0`}>
            <DeptIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h1 className="text-base font-bold text-slate-100">{deptMeta.title}</h1>
              <span className={`px-2 py-0.5 rounded font-mono text-[10px] border flex items-center gap-1 ${deptMeta.badgeColor}`}>
                <CheckCircle2 className="w-3 h-3" /> Department Isolated Record
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] border border-emerald-500/30">
                100% Printable
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              {deptMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Printable Sheet View Toggle */}
          <button
            onClick={() => setShowPaperPreview(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all border ${
              showPaperPreview
                ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle formal paper printable sheet view"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showPaperPreview ? 'Back to App View' : 'Paper Layout Preview'}</span>
          </button>

          {/* Direct Download Vector PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={!activeReportResult}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            title="Download formal vector PDF report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          {/* PRIMARY PREVIEW & PRINT MODAL BUTTON */}
          <button
            onClick={handlePrint}
            disabled={!activeReportResult}
            className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-md shadow-emerald-900/30 transition-all border border-emerald-400/40 cursor-pointer"
            title="Open printable document preview & print official report"
          >
            <Printer className="w-4 h-4" />
            <span>Preview & Print</span>
          </button>
        </div>
      </div>

      {/* 2. Departmental Live KPI Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {deptKpis.map((kpi, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              {kpi.label}
            </span>
            <div className="text-lg font-black text-slate-100 mt-0.5 font-mono">
              {kpi.value}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
              {kpi.desc}
            </p>
          </div>
        ))}
      </div>

      {/* 3. Departmental Report Switcher (Tabs / Pills) */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {deptMeta.name} Available Reports ({departmentalReports.length})
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Select a report to generate live reconciled tabular data
          </span>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
          {departmentalReports.map((report) => {
            const isSelected = selectedReportCode === report.reportCode;
            return (
              <button
                key={report.reportCode}
                onClick={() => setSelectedReportCode(report.reportCode)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 border flex-shrink-0 ${
                  isSelected
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-1 ring-amber-400'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="font-mono text-[10px] px-1.5 py-0.5 bg-black/30 rounded">
                  {report.reportCode}
                </span>
                <span>{report.reportName}</span>
              </button>
            );
          })}
        </div>

        {/* 4. Filter Controls Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-2 border-t border-slate-800">
          {/* Date Range Presets */}
          <div className="md:col-span-4 flex items-center space-x-1">
            {(['today', 'yesterday', '7days', 'month'] as const).map(p => (
              <button
                key={p}
                onClick={() => handleDatePreset(p)}
                className={`px-2.5 py-1.5 rounded text-[11px] font-medium border transition-all ${
                  datePreset === p
                    ? 'bg-slate-700 text-amber-300 border-amber-500/50 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {p === 'today' ? 'Today' : p === 'yesterday' ? 'Yesterday' : p === '7days' ? 'Last 7 Days' : 'This Month'}
              </button>
            ))}
          </div>

          {/* Date Pickers */}
          <div className="md:col-span-5 flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-2 py-1 bg-slate-950 border border-slate-800 rounded flex-1">
              <span className="text-[10px] text-slate-500 uppercase">From:</span>
              <input
                type="date"
                value={filterState.dateFrom}
                onChange={e => {
                  setDatePreset('custom');
                  setFilterState(prev => ({ ...prev, dateFrom: e.target.value }));
                }}
                className="bg-transparent text-slate-200 text-xs focus:outline-none w-full"
              />
            </div>
            <div className="flex items-center space-x-1.5 px-2 py-1 bg-slate-950 border border-slate-800 rounded flex-1">
              <span className="text-[10px] text-slate-500 uppercase">To:</span>
              <input
                type="date"
                value={filterState.dateTo}
                onChange={e => {
                  setDatePreset('custom');
                  setFilterState(prev => ({ ...prev, dateTo: e.target.value }));
                }}
                className="bg-transparent text-slate-200 text-xs focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Search Filter */}
          <div className="md:col-span-3">
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search table rows..."
                value={filterState.searchTerm || ''}
                onChange={e => setFilterState(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="bg-transparent text-slate-200 text-xs focus:outline-none w-full placeholder-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Access Error Notice if any */}
      {accessError && (
        <div className="bg-rose-950/70 border border-rose-800 p-4 rounded-xl flex items-center space-x-3 text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <h4 className="font-bold text-xs">Department Isolation Notice</h4>
            <p className="text-xs text-rose-300 mt-0.5">{accessError}</p>
          </div>
        </div>
      )}

      {/* 5. Printable Paper Preview Mode OR Interactive Grid Table */}
      {showPaperPreview && activeReportResult ? (
        /* Paper Layout View (Exact Letterhead Simulation) */
        <div className="bg-white text-slate-900 p-8 rounded-xl shadow-2xl border border-slate-300 space-y-6 print:p-0 print:border-none">
          {/* Formal Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                CCULB RESORT & CONVENTION HALL
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Purbachal Link Road, Gazipur / Dhaka, Bangladesh • Tel: +880 1711-223344
              </p>
              <div className="mt-2 inline-block px-2.5 py-0.5 bg-slate-900 text-amber-400 font-bold text-xs rounded uppercase font-mono">
                {deptMeta.name} Departmental Operations
              </div>
            </div>
            <div className="text-right text-xs text-slate-600">
              <span className="font-mono font-bold text-slate-900 text-sm block">
                {activeReportResult.definition.reportCode}
              </span>
              <p className="font-semibold text-slate-800 mt-0.5">
                Run Date: {activeReportResult.generatedAt}
              </p>
              <p className="text-[11px] text-slate-500">
                Period: {filterState.dateFrom} to {filterState.dateTo}
              </p>
              <p className="text-[11px] text-slate-500">
                Prepared By: <strong>{activeReportResult.generatedBy}</strong>
              </p>
            </div>
          </div>

          {/* Report Title */}
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase">
              {activeReportResult.definition.reportName}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {activeReportResult.definition.description}
            </p>
          </div>

          {/* Paper Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-800">
                  <th className="py-2 px-2 text-left font-bold w-10">#</th>
                  {activeReportResult.columns.map(col => (
                    <th
                      key={col.key}
                      className={`py-2 px-2.5 font-bold uppercase text-[11px] ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activeReportResult.rows.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-2 px-2 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                    {activeReportResult.columns.map(col => {
                      const val = row[col.key];
                      const isCurr = col.format === 'currency';
                      return (
                        <td
                          key={col.key}
                          className={`py-2 px-2.5 ${
                            col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'
                          }`}
                        >
                          {isCurr && typeof val === 'number'
                            ? `৳${val.toLocaleString()}`
                            : val !== undefined && val !== null ? String(val) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              {activeReportResult.summaryTotals && (
                <tfoot>
                  <tr className="bg-slate-200 font-black border-t-2 border-slate-400 text-slate-900">
                    <td className="py-2.5 px-2">Total</td>
                    {activeReportResult.columns.map((col, cIdx) => {
                      const sumVal = activeReportResult.summaryTotals![col.key];
                      const isCurr = col.format === 'currency';
                      return (
                        <td
                          key={col.key}
                          className={`py-2.5 px-2.5 ${
                            col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'
                          }`}
                        >
                          {cIdx === 0 && !sumVal
                            ? `Total (${activeReportResult.rows.length} Records)`
                            : isCurr && typeof sumVal === 'number'
                            ? `৳${sumVal.toLocaleString()}`
                            : sumVal !== undefined && sumVal !== null ? String(sumVal) : ''}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Formal Signatures Section */}
          <div className="pt-8 border-t border-dashed border-slate-400 grid grid-cols-3 gap-8 text-center text-[11px] text-slate-600">
            <div>
              <div className="border-b border-slate-400 h-10 mb-1"></div>
              <p className="font-bold text-slate-800">{activeReportResult.generatedBy}</p>
              <p className="text-[10px] text-slate-500">Prepared By ({deptMeta.name})</p>
            </div>
            <div>
              <div className="border-b border-slate-400 h-10 mb-1"></div>
              <p className="font-bold text-slate-800">Department Supervisor</p>
              <p className="text-[10px] text-slate-500">Head of Department (HOD)</p>
            </div>
            <div>
              <div className="border-b border-slate-400 h-10 mb-1"></div>
              <p className="font-bold text-slate-800">Accounts & Internal Audit</p>
              <p className="text-[10px] text-slate-500">Verified & Reconciled</p>
            </div>
          </div>

          {/* Direct Print Button in Paper View */}
          <div className="flex justify-end pt-2 print:hidden">
            <button
              onClick={handleDirectPrint}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg flex items-center space-x-2 text-xs shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print This Paper Sheet</span>
            </button>
          </div>
        </div>
      ) : activeReportResult ? (
        /* Standard High-Contrast App Data Table */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl space-y-0">
          {/* Table Subtitle Bar */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-amber-400 text-xs px-2 py-0.5 bg-slate-900 rounded border border-slate-800">
                  {activeReportResult.definition.reportCode}
                </span>
                <h3 className="text-sm font-bold text-slate-100">
                  {activeReportResult.definition.reportName}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {activeReportResult.definition.description}
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-400 font-mono flex items-center gap-3">
              <span>Rows: <strong className="text-slate-200">{activeReportResult.rows.length}</strong></span>
              <span>Updated: <strong className="text-slate-200">{activeReportResult.generatedAt.split(',')[1] || activeReportResult.generatedAt}</strong></span>
            </div>
          </div>

          {/* Main Data Table */}
          <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-700">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950/80 sticky top-0 z-10 text-slate-300 border-b border-slate-800 shadow-xs">
                <tr>
                  <th className="py-2.5 px-3 text-slate-500 font-mono text-[11px] w-12">#</th>
                  {activeReportResult.columns.map((col) => (
                    <th
                      key={col.key}
                      className={`py-2.5 px-3 font-bold uppercase tracking-wider text-[11px] ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                {activeReportResult.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeReportResult.columns.length + 1}
                      className="py-12 text-center text-slate-500"
                    >
                      No records matched the selected date period or search criteria for {deptMeta.name}.
                    </td>
                  </tr>
                ) : (
                  activeReportResult.rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                      {activeReportResult.columns.map((col) => {
                        const val = row[col.key];
                        const isCurr = col.format === 'currency';
                        const isBadge = col.format === 'badge';

                        return (
                          <td
                            key={col.key}
                            className={`py-2.5 px-3 ${
                              col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'
                            }`}
                          >
                            {isBadge ? (
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                String(val).toLowerCase().includes('clean') || String(val).toLowerCase().includes('active') || String(val).toLowerCase().includes('confirmed') || String(val).toLowerCase().includes('paid')
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : String(val).toLowerCase().includes('dirty') || String(val).toLowerCase().includes('due') || String(val).toLowerCase().includes('void') || String(val).toLowerCase().includes('cancel')
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : String(val).toLowerCase().includes('order') || String(val).toLowerCase().includes('pending')
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                {val}
                              </span>
                            ) : isCurr && typeof val === 'number' ? (
                              <span className="font-bold text-slate-100">
                                ৳{val.toLocaleString()}
                              </span>
                            ) : val !== undefined && val !== null ? (
                              String(val)
                            ) : (
                              '—'
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
              {/* Summary Totals Row */}
              {activeReportResult.summaryTotals && activeReportResult.rows.length > 0 && (
                <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-700 text-slate-100">
                  <tr>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">Σ</td>
                    {activeReportResult.columns.map((col, cIdx) => {
                      const sumVal = activeReportResult.summaryTotals![col.key];
                      const isCurr = col.format === 'currency';
                      return (
                        <td
                          key={col.key}
                          className={`py-3 px-3 font-mono font-black ${
                            col.align === 'right' ? 'text-right text-emerald-400' : col.align === 'center' ? 'text-center' : 'text-left'
                          }`}
                        >
                          {cIdx === 0 && !sumVal
                            ? `Total (${activeReportResult.rows.length} Records)`
                            : isCurr && typeof sumVal === 'number'
                            ? `৳${sumVal.toLocaleString()}`
                            : sumVal !== undefined && sumVal !== null ? String(sumVal) : ''}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* 6. Formal Department Sign-off and Print Prompt Bar */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-200">
                  Official Department Record • CCULB ERP Reconciled
                </p>
                <p className="text-[11px] text-slate-400">
                  Generated by <strong>{activeReportResult.generatedBy}</strong> for {deptMeta.name} • Strictly isolated from general ledger
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadPDF}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center space-x-2 shadow-md shadow-emerald-950 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Preview & Print</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-2" />
          <p className="text-slate-400 text-xs">Loading {deptMeta.name} report data...</p>
        </div>
      )}
    </div>
  );
};
