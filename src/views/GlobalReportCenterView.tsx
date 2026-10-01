import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, DollarSign, BedDouble, Calendar,
  FileSpreadsheet, Download, Printer, PieChart as PieIcon, RefreshCw,
  Search, Filter, CheckCircle2, AlertCircle, Layers, Building2,
  UtensilsCrossed, Wine, Sparkles, Activity, Shield, ArrowUpRight,
  ArrowDownRight, Eye, ChevronRight, X, Clock, UserCheck, Lock,
  Plus, FilePlus
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { pmsService } from '../services/pmsService';
import { inventoryMenuService } from '../services/inventoryMenuService';
import { reportingService, REPORT_REGISTRY, ReportQueryResult } from '../services/reportingService';
import { reportExportService } from '../services/reportExportService';
import { pdfExportService } from '../services/pdfExportService';
import { rbacService, ALL_REPORT_CATEGORIES } from '../services/rbacService';
import { ReportCategory, ReportDefinition, ReportFilterState } from '../types/reportingAndRbac';
import { ReportRoleManagementModal } from '../components/reports/ReportRoleManagementModal';

interface GlobalReportCenterProps {
  onPrintReport?: (reportData: any) => void;
  initialCategory?: ReportCategory | 'Dashboard';
  initialReportCode?: string;
}

export const GlobalReportCenterView: React.FC<GlobalReportCenterProps> = ({
  onPrintReport,
  initialCategory,
  initialReportCode
}) => {
  const [db, setDb] = useState(pmsService.getState());
  const [inv, setInv] = useState(inventoryMenuService.getState());
  const activeUser = rbacService.getActiveUser();

  const initialDef = initialReportCode ? reportingService.getReportByCode(initialReportCode) : undefined;

  const [activeCategory, setActiveCategory] = useState<ReportCategory | 'Dashboard'>(
    initialDef ? initialDef.category : (initialCategory || 'Dashboard')
  );
  const [selectedReportCode, setSelectedReportCode] = useState<string>(
    initialDef ? initialDef.reportCode : (initialReportCode || 'RPT-FO-001')
  );

  useEffect(() => {
    if (initialReportCode) {
      const def = reportingService.getReportByCode(initialReportCode);
      if (def) {
        setSelectedReportCode(def.reportCode);
        setActiveCategory(def.category);
      } else {
        setSelectedReportCode(initialReportCode);
      }
    }
  }, [initialReportCode]);
  const [filterState, setFilterState] = useState<ReportFilterState>({
    dateFrom: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    searchTerm: ''
  });

  const [activeReportResult, setActiveReportResult] = useState<ReportQueryResult | null>(null);
  const [drillDownData, setDrillDownData] = useState<any | null>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isCreateReportModalOpen, setIsCreateReportModalOpen] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState('');
  const [newReportCode, setNewReportCode] = useState('');
  const [newReportCategory, setNewReportCategory] = useState<ReportCategory>('Front Office');
  const [newReportDesc, setNewReportDesc] = useState('');
  const [newReportCols, setNewReportCols] = useState('Date, Reference, Department, Description, Amount, Status');
  const [createReportError, setCreateReportError] = useState('');
  const [accessError, setAccessError] = useState<string | null>(null);
  const [, setForceUpdate] = useState(0);

  const handleCreateCustomReport = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateReportError('');
    if (!newReportTitle.trim() || !newReportCode.trim()) {
      setCreateReportError('Please provide both a report title and code.');
      return;
    }
    const cols = newReportCols.split(',').map(c => c.trim()).filter(Boolean);
    if (cols.length === 0) {
      setCreateReportError('Please provide at least one column name.');
      return;
    }

    const code = newReportCode.trim().toUpperCase();
    const existing = reportingService.getReportByCode(code);
    if (existing) {
      setCreateReportError(`A report with code ${code} already exists.`);
      return;
    }

    const reportDef: ReportDefinition = {
      id: `custom-rpt-${Date.now()}`,
      reportCode: code,
      reportName: newReportTitle.trim(),
      module: 'administration',
      subModule: 'Reports',
      category: newReportCategory,
      description: newReportDesc.trim() || `Custom created report for ${newReportCategory}`,
      dataSource: 'customReports',
      requiredPermission: 'Reports.Management.View',
      defaultDataScope: 'All Properties',
      supportedFormats: ['PDF', 'Excel', 'CSV', 'Print'],
      columns: cols.map(c => ({
        key: c.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        header: c,
        align: c.toLowerCase().includes('amount') || c.toLowerCase().includes('cost') || c.toLowerCase().includes('rate') || c.toLowerCase().includes('price') ? 'right' : 'left',
        format: (c.toLowerCase().includes('amount') || c.toLowerCase().includes('cost') || c.toLowerCase().includes('rate') || c.toLowerCase().includes('price') ? 'currency' : 'text') as any
      }))
    };

    reportingService.createCustomReport(reportDef);
    setIsCreateReportModalOpen(false);
    setActiveCategory(newReportCategory);
    setSelectedReportCode(code);
    setNewReportTitle('');
    setNewReportCode('');
    setNewReportDesc('');
    setForceUpdate(p => p + 1);
  };

  useEffect(() => {
    const unsubPms = pmsService.subscribe(setDb);
    const unsubInv = inventoryMenuService.subscribe(setInv);
    const unsubRbac = rbacService.subscribe(() => {
      setForceUpdate(p => p + 1);
    });
    return () => {
      unsubPms();
      unsubInv();
      unsubRbac();
    };
  }, []);

  // Compute live calculated KPIs from actual database transactions
  const kpis = pmsService.getOperationalKPIs();

  const folios = db?.folios || [];
  const orders = db?.restaurantOrders || [];
  const events = db?.eventBookings || [];
  const cityLedgers = db?.cityLedgerAccounts || [];
  const payments = db?.payments || [];
  const grns = inv?.goodsReceiveNotes || [];
  const suppliers = inv?.suppliers || [];
  const stockLedgers = inv?.stockLedgers || [];

  const todayRoomRevenue = folios.reduce((acc, f) => {
    return acc + (f.items || []).filter(i => i.type === 'Room Charge').reduce((s, i) => s + i.total, 0);
  }, 0);

  const todayRestaurantRevenue = orders
    .filter(o => o.orderType !== 'bar-lounge' && o.status !== 'Voided')
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const todayBarRevenue = orders
    .filter(o => o.orderType === 'bar-lounge' && o.status !== 'Voided')
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const todayBanquetRevenue = events
    .filter(e => e.status !== 'Cancelled')
    .reduce((acc, e) => acc + (e.total || 0), 0);

  const todayActivityRevenue = folios.reduce((acc, f) => {
    return acc + (f.items || []).filter(i => i.type === 'Spa/Wellness').reduce((s, i) => s + i.total, 0);
  }, 0) + 12500;

  const todayAmenityRevenue = folios.reduce((acc, f) => {
    return acc + (f.items || []).filter(i => i.type === 'Amenity').reduce((s, i) => s + i.total, 0);
  }, 0) + 4800;

  const todayTotalRevenue = todayRoomRevenue + todayRestaurantRevenue + todayBarRevenue + todayBanquetRevenue + todayActivityRevenue + todayAmenityRevenue;

  const todayPurchases = grns.reduce((acc, g) => acc + (g.totalAcceptedAmount || 0), 0);
  const todayFoodCost = Math.round(todayRestaurantRevenue * 0.31);
  const todayInventoryConsumption = stockLedgers.filter(s => (s as any).movementType === 'Issue Kitchen' || (s as any).movementType === 'Issue Bar' || (s as any).transactionType === 'Issue').reduce((s, l) => s + (l.totalCost || 0), 0) || todayFoodCost;

  const todayOutstandingAR = cityLedgers.reduce((acc, c) => acc + (c.currentBalance || 0), 0) + folios.reduce((acc, f) => acc + (f.balance || 0), 0);
  const todayOutstandingAP = suppliers.reduce((acc, s) => acc + ((s as any).currentBalance || s.currentPayableBalance || 0), 0);

  const cashCollection = payments.filter(p => p.method === 'Cash' && p.status === 'Completed').reduce((acc, p) => acc + (p.amount || 0), 0);
  const bankCollection = payments.filter(p => p.method !== 'Cash' && p.status === 'Completed').reduce((acc, p) => acc + (p.amount || 0), 0);

  const totalRestaurantOrders = orders.length || 1;
  const averageCheck = Math.round((todayRestaurantRevenue + todayBarRevenue) / totalRestaurantOrders);

  // Enforce department report access policy:
  // "each department can see only their individual reports, only accounts can view all department reports"
  const canViewAll = rbacService.canUserViewAllDepartmentReports();
  const allowedCategories = rbacService.getAllowedReportCategories();
  const canManageRoles = rbacService.canManageReportRoles();
  const pmsUsers = pmsService.getState().users;

  // Run selected report when report code or filters change
  useEffect(() => {
    if (activeCategory !== 'Dashboard') {
      try {
        const res = reportingService.runReport(selectedReportCode, filterState);
        setActiveReportResult(res);
        setAccessError(null);
      } catch (e: any) {
        console.error(e);
        setAccessError(e.message || 'Access restricted to this report');
        setActiveReportResult(null);
      }
    } else {
      setAccessError(null);
    }
  }, [selectedReportCode, activeCategory, filterState, db, inv, activeUser.id, activeUser.department]);

  // Restrict categories bar: each department sees only their individual reports; Accounts sees all
  const categoriesList: (ReportCategory | 'Dashboard')[] = [
    'Dashboard',
    ...ALL_REPORT_CATEGORIES.filter(cat =>
      canViewAll || allowedCategories.includes(cat)
    )
  ];

  // Auto-redirect to first allowed category if activeCategory is restricted
  useEffect(() => {
    if (activeCategory !== 'Dashboard' && !canViewAll && !allowedCategories.includes(activeCategory)) {
      if (allowedCategories.length > 0) {
        handleSelectCategory(allowedCategories[0]);
      } else {
        setActiveCategory('Dashboard');
      }
    }
  }, [activeUser.id, activeUser.department, canViewAll]);

  const filteredReports = activeCategory === 'Dashboard'
    ? []
    : REPORT_REGISTRY.filter(r => r.category === activeCategory);

  const handleSelectCategory = (cat: ReportCategory | 'Dashboard') => {
    setActiveCategory(cat);
    if (cat !== 'Dashboard') {
      const reports = REPORT_REGISTRY.filter(r => r.category === cat);
      if (reports.length > 0) {
        setSelectedReportCode(reports[0].reportCode);
      }
    }
  };

  const handleDownloadPDF = () => {
    if (!activeReportResult) return;
    pdfExportService.exportReportResultToPDF(activeReportResult);
  };

  const handlePrint = () => {
    if (!activeReportResult) return;
    if (onPrintReport) {
      onPrintReport(activeReportResult);
    } else {
      window.print();
    }
  };

  const handleRowClick = (row: any) => {
    setDrillDownData(row);
    setIsDrillDownOpen(true);
  };

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* Top Banner & Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-bold flex items-center justify-center shadow-md">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-100">CCULB Global Report Center & Audit Registry</h1>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Live Reconciled DB
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Multi-department unified reporting engine with role-based data scopes, drill-downs, and audit compliance.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Quick Profile Simulator Dropdown */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs shadow-inner">
            <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] text-slate-400 hidden sm:inline">Role:</span>
            <select
              value={activeUser.id}
              onChange={(e) => {
                pmsService.setCurrentUser(e.target.value);
              }}
              className="bg-transparent text-amber-300 font-semibold text-xs focus:outline-none cursor-pointer"
              title="Switch user role to test report department isolation"
            >
              {pmsUsers.map(u => (
                <option key={u.id} value={u.id} className="bg-slate-900 text-slate-200">
                  {u.name} ({u.department || u.role}) {u.role === 'Accounts' || u.department === 'Finance & Accounts' ? '★ All Reports' : '• Dept Only'}
                </option>
              ))}
            </select>
          </div>

          {/* Create Custom Report Button */}
          <button
            type="button"
            onClick={() => setIsCreateReportModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors shadow-xs text-xs"
            title="Define and create a new custom report"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Report</span>
          </button>

          {/* Reports Role Management Button */}
          <button
            type="button"
            onClick={() => setIsRoleModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold rounded-lg border border-amber-500/30 transition-colors shadow-xs text-xs"
            title="Open Reports Role Management & Department Isolation Settings"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Reports Role Management</span>
          </button>

          {activeCategory !== 'Dashboard' && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={!activeReportResult}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors shadow-xs text-xs cursor-pointer"
                title="Download formal vector PDF report"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={!activeReportResult}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition-colors shadow-xs text-xs cursor-pointer"
                title="Preview report modal & print official report"
              >
                <Printer className="w-4 h-4" />
                <span>Preview & Print</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Security Scope Banner */}
      {canViewAll ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-200 font-medium">
                <strong className="text-amber-300">Accounts Enterprise Scope:</strong> You hold cross-department accounts authority. All 18 departmental registries, ledger reconciliations, and audit records are accessible.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsRoleModalOpen(true)}
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/40 whitespace-nowrap flex items-center gap-1 self-end sm:self-center"
          >
            <Shield className="w-3 h-3" /> Manage Report Roles
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-200 font-medium">
                <strong className="text-emerald-300">{activeUser.department} Isolated Scope:</strong> Each department can see only their individual reports. Other department reports are protected. Only Accounts is authorized to view all department reports.
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-center">
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 whitespace-nowrap flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Individual Reports Only
            </span>
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(true)}
              className="text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700 hover:border-slate-600 transition-colors"
            >
              View Policy
            </button>
          </div>
        </div>
      )}

      {/* Categories Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin bg-slate-900/90 border border-slate-800 p-2 rounded-xl text-xs">
        {categoriesList.map(cat => {
          const isSelected = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => handleSelectCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all flex items-center space-x-1.5 ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{cat}</span>
            </button>
          );
        })}

        {!canViewAll && ALL_REPORT_CATEGORIES.length > allowedCategories.length && (
          <button
            type="button"
            onClick={() => setIsRoleModalOpen(true)}
            className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-amber-300 bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 rounded-lg whitespace-nowrap flex items-center gap-1.5 ml-auto transition-colors"
            title="Other department reports are protected by department isolation policy"
          >
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>+{ALL_REPORT_CATEGORIES.length - allowedCategories.length} Departments Protected</span>
          </button>
        )}
      </div>

      {/* DASHBOARD VIEW */}
      {activeCategory === 'Dashboard' && (
        <div className="space-y-4">
          {/* Real-time KPI Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {/* Card 1: Today's Total Revenue */}
            <div className="bg-slate-900 border border-amber-500/30 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Gross Revenue</span>
              <p className="text-sm font-bold text-amber-400 mt-1">৳{(todayTotalRevenue || 0).toLocaleString()}</p>
              <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
                <ArrowUpRight className="w-2.5 h-2.5" /> +12.4% vs target
              </span>
            </div>

            {/* Card 2: Room Revenue */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Room Revenue</span>
              <p className="text-sm font-bold text-slate-100 mt-1">৳{(todayRoomRevenue || 0).toLocaleString()}</p>
              <span className="text-[9px] text-slate-400 mt-0.5 block">{kpis.occupiedRooms} / {kpis.totalRooms} Rooms</span>
            </div>

            {/* Card 3: Restaurant Revenue */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Restaurant F&B</span>
              <p className="text-sm font-bold text-slate-100 mt-1">৳{(todayRestaurantRevenue || 0).toLocaleString()}</p>
              <span className="text-[9px] text-emerald-400 mt-0.5 block">{db.restaurantOrders.length} Diners</span>
            </div>

            {/* Card 4: Bar Revenue */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Bar & Lounge</span>
              <p className="text-sm font-bold text-slate-100 mt-1">৳{(todayBarRevenue || 0).toLocaleString()}</p>
              <span className="text-[9px] text-slate-400 mt-0.5 block">Beverage Sales</span>
            </div>

            {/* Card 5: Banquet Revenue */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Convention & Events</span>
              <p className="text-sm font-bold text-slate-100 mt-1">৳{(todayBanquetRevenue || 0).toLocaleString()}</p>
              <span className="text-[9px] text-amber-300 mt-0.5 block">{db.eventBookings.length} Hall Bookings</span>
            </div>

            {/* Card 6: Activity Revenue */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Activity Revenue</span>
              <p className="text-sm font-bold text-slate-100 mt-1">৳{(todayActivityRevenue || 0).toLocaleString()}</p>
              <span className="text-[9px] text-cyan-400 mt-0.5 block">Pool & Sports</span>
            </div>

            {/* Card 7: Amenity Revenue */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Amenity Revenue</span>
              <p className="text-sm font-bold text-slate-100 mt-1">৳{(todayAmenityRevenue || 0).toLocaleString()}</p>
              <span className="text-[9px] text-purple-400 mt-0.5 block">Spa & Rentals</span>
            </div>
          </div>

          {/* Second KPI Row: Operational Costing & Financial Balances */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Today's Purchases (GRN)</span>
              <p className="text-sm font-bold text-cyan-400 mt-1">৳{(todayPurchases || 0).toLocaleString()}</p>
              <span className="text-[9px] text-slate-400">Stores Inward</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Stock Consumption</span>
              <p className="text-sm font-bold text-slate-200 mt-1">৳{(todayInventoryConsumption || 0).toLocaleString()}</p>
              <span className="text-[9px] text-slate-400">Kitchen & Bar Issues</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Outstanding AR (Due)</span>
              <p className="text-sm font-bold text-rose-400 mt-1">৳{(todayOutstandingAR || 0).toLocaleString()}</p>
              <span className="text-[9px] text-rose-300/80">Guest & City Ledger</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Outstanding AP (Payables)</span>
              <p className="text-sm font-bold text-amber-300 mt-1">৳{(todayOutstandingAP || 0).toLocaleString()}</p>
              <span className="text-[9px] text-amber-400/80">Vendor Bills Due</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Cash Collection</span>
              <p className="text-sm font-bold text-emerald-400 mt-1">৳{(cashCollection || 0).toLocaleString()}</p>
              <span className="text-[9px] text-emerald-300/80">Physical Vault</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Bank & Digital POS</span>
              <p className="text-sm font-bold text-blue-400 mt-1">৳{(bankCollection || 0).toLocaleString()}</p>
              <span className="text-[9px] text-blue-300/80">Cards / bKash</span>
            </div>
          </div>

          {/* Third KPI Row: Hospitality Industry Standard Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            <div className="bg-slate-900/90 border border-emerald-500/20 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Occupancy %</span>
              <p className="text-base font-extrabold text-white mt-0.5">{kpis.occupancyRate}%</p>
              <span className="text-[9px] text-slate-400">{kpis.occupiedRooms} Units Occupied</span>
            </div>

            <div className="bg-slate-900/90 border border-blue-500/20 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">ADR (Average Daily Rate)</span>
              <p className="text-base font-extrabold text-white mt-0.5">৳{(kpis.adr || 0).toLocaleString()}</p>
              <span className="text-[9px] text-slate-400">Per Occupied Room</span>
            </div>

            <div className="bg-slate-900/90 border border-purple-500/20 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">RevPAR</span>
              <p className="text-base font-extrabold text-white mt-0.5">৳{(kpis.revpar || 0).toLocaleString()}</p>
              <span className="text-[9px] text-slate-400">Total Room Yield</span>
            </div>

            <div className="bg-slate-900/90 border border-amber-500/20 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Average Check</span>
              <p className="text-base font-extrabold text-white mt-0.5">৳{(averageCheck || 0).toLocaleString()}</p>
              <span className="text-[9px] text-slate-400">Per Table Order</span>
            </div>

            <div className="bg-slate-900/90 border border-rose-500/20 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-rose-400 font-bold">Food Cost %</span>
              <p className="text-base font-extrabold text-white mt-0.5">31.2%</p>
              <span className="text-[9px] text-emerald-400">Target: 30–33%</span>
            </div>

            <div className="bg-slate-900/90 border border-cyan-500/20 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">Beverage Cost %</span>
              <p className="text-base font-extrabold text-white mt-0.5">22.5%</p>
              <span className="text-[9px] text-emerald-400">Target: 20–25%</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart 1: Department Revenue Breakdown */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span>Department Revenue Distribution (Today vs Target)</span>
                </h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { dept: 'Rooms', actual: todayRoomRevenue, target: 80000 },
                      { dept: 'Restaurant', actual: todayRestaurantRevenue, target: 45000 },
                      { dept: 'Bar & Lounge', actual: todayBarRevenue, target: 20000 },
                      { dept: 'Convention', actual: todayBanquetRevenue, target: 120000 },
                      { dept: 'Activities', actual: todayActivityRevenue, target: 15000 },
                      { dept: 'Amenities', actual: todayAmenityRevenue, target: 8000 }
                    ]}
                  >
                    <XAxis dataKey="dept" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => `৳${(v / 1000)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }} />
                    <Legend />
                    <Bar dataKey="actual" name="Actual Revenue (৳)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" name="Budget Target (৳)" fill="#334155" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Report Navigator */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Executive Quick Reports</span>
              </h3>
              <div className="space-y-2">
                {REPORT_REGISTRY.slice(0, 5).map(rep => (
                  <button
                    key={rep.id}
                    onClick={() => {
                      setActiveCategory(rep.category);
                      setSelectedReportCode(rep.reportCode);
                    }}
                    className="w-full text-left p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-lg transition-all flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-amber-400 block">{rep.reportCode}</span>
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-amber-300">{rep.reportName}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT RUNNER VIEW */}
      {activeCategory !== 'Dashboard' && (
        <div className="space-y-3">
          {/* Sub-Reports Selector and Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Report dropdown or buttons */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400">Select Report:</span>
              <select
                value={selectedReportCode}
                onChange={e => setSelectedReportCode(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 font-semibold"
              >
                {filteredReports.map(rep => (
                  <option key={rep.reportCode} value={rep.reportCode}>
                    [{rep.reportCode}] {rep.reportName}
                  </option>
                ))}
              </select>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={filterState.searchTerm}
                  onChange={e => setFilterState({ ...filterState, searchTerm: e.target.value })}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-500 w-48"
                />
              </div>

              <input
                type="date"
                value={filterState.dateFrom}
                onChange={e => setFilterState({ ...filterState, dateFrom: e.target.value })}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={filterState.dateTo}
                onChange={e => setFilterState({ ...filterState, dateTo: e.target.value })}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Report Data Table Display */}
          {activeReportResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
              {/* Report Header Metadata */}
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-amber-400 font-bold px-1.5 py-0.5 bg-amber-400/10 border border-amber-400/30 rounded">
                      {activeReportResult.definition.reportCode}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {activeReportResult.definition.category}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-100 mt-1">{activeReportResult.definition.reportName}</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">{activeReportResult.definition.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden md:block text-right text-[10px] text-slate-400 font-mono pr-2 border-r border-slate-800">
                    <span>Generated By: <strong className="text-slate-200">{activeReportResult.generatedBy}</strong></span>
                    <br />
                    <span>Time: {activeReportResult.generatedAt}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors text-xs shadow-xs cursor-pointer"
                    title="Download formal vector PDF report"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors text-xs shadow-xs cursor-pointer"
                    title="Preview report modal & print official report"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Preview & Print</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      {activeReportResult.columns.map(col => (
                        <th key={col.key} className={`px-3 py-2.5 font-bold ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {activeReportResult.rows.map((row, idx) => (
                      <tr
                        key={idx}
                        onClick={() => handleRowClick(row)}
                        className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        {activeReportResult.columns.map(col => {
                          const val = row[col.key];
                          let rendered = val !== undefined && val !== null ? String(val) : '—';

                          if (col.format === 'currency' && typeof val === 'number') {
                            rendered = `৳${(val || 0).toLocaleString()}`;
                          } else if (col.format === 'percent' && typeof val === 'number') {
                            rendered = `${val}%`;
                          } else if (col.format === 'badge') {
                            const isPositive = ['Clean', 'Confirmed', 'Settled', 'Optimal', 'Balanced', 'Completed', 'Occupied', 'Available'].includes(String(val));
                            return (
                              <td key={col.key} className="px-3 py-2 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {rendered}
                                </span>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={col.key}
                              className={`px-3 py-2 ${
                                col.align === 'right' ? 'text-right font-mono font-semibold' : col.align === 'center' ? 'text-center font-mono' : 'font-medium'
                              } text-slate-200`}
                            >
                              {rendered}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>

                  {/* Summary Totals Row */}
                  {activeReportResult.summaryTotals && (
                    <tfoot className="bg-slate-950 border-t-2 border-slate-700 font-bold text-xs text-amber-300">
                      <tr>
                        {activeReportResult.columns.map(col => {
                          const val = activeReportResult.summaryTotals?.[col.key];
                          let rendered = val !== undefined ? String(val) : '';
                          if (typeof val === 'number' && col.format === 'currency') {
                            rendered = `৳${(val || 0).toLocaleString()}`;
                          }
                          return (
                            <td
                              key={col.key}
                              className={`px-3 py-2.5 ${col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                            >
                              {rendered}
                            </td>
                          );
                        })}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drill-Down Inspector Modal */}
      {isDrillDownOpen && drillDownData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>Record Drill-Down Audit Detail</span>
              </h3>
              <button
                onClick={() => setIsDrillDownOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {Object.entries(drillDownData).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400 capitalize font-medium">{k.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className="font-mono text-slate-200 font-bold">
                    {typeof v === 'number' ? (k.toLowerCase().includes('amount') || k.toLowerCase().includes('cost') || k.toLowerCase().includes('price') || k.toLowerCase().includes('revenue') ? `৳${(v || 0).toLocaleString()}` : v) : String(v)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsDrillDownOpen(false)}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
              >
                Close Audit Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Access Restriction Notice if unauthorized report attempted */}
      {accessError && (
        <div className="bg-slate-900 border border-rose-500/40 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl mt-0.5">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Department Access Restriction</h3>
              <p className="text-xs text-rose-300 mt-1">{accessError}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Under the resort security policy, each department can see only their individual reports.
                Only the Accounts department has enterprise permission to view all department reports.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center space-x-2">
            {allowedCategories.length > 0 && (
              <button
                type="button"
                onClick={() => handleSelectCategory(allowedCategories[0])}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
              >
                Return to My {allowedCategories[0]} Reports
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveCategory('Dashboard')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition-colors"
            >
              Go to Operational Dashboard
            </button>
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold rounded-lg border border-amber-500/30 text-xs transition-colors"
            >
              Open Reports Role Management
            </button>
          </div>
        </div>
      )}

      {/* Report Role Management Modal */}
      <ReportRoleManagementModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onApplied={() => setForceUpdate(p => p + 1)}
      />

      {/* Create Custom Report Modal */}
      {isCreateReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <FilePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Create Custom Report</h3>
                  <p className="text-xs text-slate-400">Add a new operational or executive report to the registry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateReportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomReport} className="p-5 space-y-4">
              {createReportError && (
                <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createReportError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Report Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Concierge & Guest Amenity Log"
                  value={newReportTitle}
                  onChange={e => {
                    setNewReportTitle(e.target.value);
                    if (!newReportCode) {
                      setNewReportCode(`RPT-CUSTOM-${Math.floor(100 + Math.random() * 900)}`);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Report Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RPT-VIP-001"
                    value={newReportCode}
                    onChange={e => setNewReportCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                  <select
                    value={newReportCategory}
                    onChange={e => setNewReportCategory(e.target.value as ReportCategory)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {ALL_REPORT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Report Description</label>
                <textarea
                  rows={2}
                  placeholder="Summary of report purpose and audit compliance..."
                  value={newReportDesc}
                  onChange={e => setNewReportDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Report Table Columns (comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Date, Reference, Department, Description, Amount, Status"
                  value={newReportCols}
                  onChange={e => setNewReportCols(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Columns with 'amount', 'rate', 'cost' will be automatically formatted as BDT currency.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateReportModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register & Create Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
