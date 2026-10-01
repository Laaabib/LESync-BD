import React, { useState, useMemo } from 'react';
import {
  FileText, Search, X, ChevronRight, Download, Printer,
  BarChart3, DollarSign, BedDouble, UtensilsCrossed, Building2,
  Boxes, ShieldCheck, Sparkles, Filter, CheckCircle2, Clock,
  ArrowUpRight, Star, Layers, RefreshCw, Users, PieChart,
  CalendarCheck, LogIn, LogOut, Receipt, Eye
} from 'lucide-react';
import { reportingService } from '../../services/reportingService';
import { ReportDefinition, ReportCategory } from '../../types/reportingAndRbac';

interface QuickReportsMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string, reportCode?: string) => void;
  onSelectReport?: (reportCode: string) => void;
  onPrintReport?: (reportData: any) => void;
}

interface QuickReportItem {
  code: string;
  name: string;
  category: 'Front Office' | 'Finance' | 'F&B' | 'Banquets' | 'Inventory' | 'Audit' | 'Housekeeping';
  description: string;
  route: string;
  tags: string[];
  isPopular?: boolean;
  icon?: React.ElementType;
}

const ALL_SYSTEM_REPORTS: QuickReportItem[] = [
  // Front Office & Rooms (Key Requested Reports with Proper Icons)
  {
    code: 'RPT-FO-005',
    name: 'In-House Guest Report',
    category: 'Front Office',
    description: 'Active residency manifest, room numbers, folio balance, VIP status, and police/CID compliance.',
    route: 'admin-global-reports',
    tags: ['In-House', 'Guests', 'Room List', 'CID Log'],
    isPopular: true,
    icon: Users
  },
  {
    code: 'RPT-FO-002',
    name: 'Occupancy Report',
    category: 'Front Office',
    description: 'Room category occupancy %, available rooms, clean/dirty ratio, blocked units, and guest counts.',
    route: 'admin-global-reports',
    tags: ['Occupancy', 'Room Rack', 'Utilization', 'Rates'],
    isPopular: true,
    icon: PieChart
  },
  {
    code: 'RPT-FO-008',
    name: 'Reservation Report',
    category: 'Front Office',
    description: 'All active and upcoming bookings, channel sources, advance deposit receipts, and confirmation status.',
    route: 'admin-global-reports',
    tags: ['Reservations', 'Bookings', 'Deposits', 'OTA'],
    isPopular: true,
    icon: CalendarCheck
  },
  {
    code: 'RPT-FO-003',
    name: 'Upcoming Check-In Report',
    category: 'Front Office',
    description: 'Scheduled arrivals for today and upcoming dates, ETA, room allocation status, VIP flags & deposits.',
    route: 'admin-global-reports',
    tags: ['Arrivals', 'Check-In', 'VIP', 'Reservations'],
    isPopular: true,
    icon: LogIn
  },
  {
    code: 'RPT-FO-004',
    name: 'Check-Out Guest Report',
    category: 'Front Office',
    description: 'Due-out departing stays, folio settlement balance clearance, key turnover, and room turnover.',
    route: 'admin-global-reports',
    tags: ['Departures', 'Check-Out', 'Folio Clearance', 'Turnover'],
    isPopular: true,
    icon: LogOut
  },
  {
    code: 'RPT-FO-001',
    name: 'Daily Flash & Revenue Summary',
    category: 'Front Office',
    description: 'Executive daily breakdown of Room, F&B, Banquet tariffs, ADR, and RevPAR.',
    route: 'admin-global-reports',
    tags: ['Revenue', 'ADR', 'RevPAR', 'Executive'],
    isPopular: true,
    icon: BarChart3
  },
  {
    code: 'RPT-FO-006',
    name: 'Room Status & Discrepancy Audit',
    category: 'Housekeeping',
    description: 'PMS front office room status vs. physical housekeeping inspect discrepancy log.',
    route: 'admin-global-reports',
    tags: ['Discrepancy', 'Housekeeping', 'Clean', 'Dirty'],
    icon: Sparkles
  },
  {
    code: 'RPT-FO-007',
    name: 'VIP & Long-Stay Guests Report',
    category: 'Front Office',
    description: 'Special care guests, diplomat preferences, loyalty tiers, and extended stay folios.',
    route: 'admin-global-reports',
    tags: ['VIP', 'Loyalty', 'Long-Stay'],
    icon: Star
  },

  // Finance & Accounting
  {
    code: 'RPT-GL-001',
    name: 'General Ledger (GL) Activity Summary',
    category: 'Finance',
    description: 'Full chart of accounts debit/credit journal transaction activity with running balances.',
    route: 'admin-global-reports',
    tags: ['General Ledger', 'Chart of Accounts', 'Debits', 'Credits'],
    isPopular: true,
    icon: DollarSign
  },
  {
    code: 'RPT-FIN-002',
    name: 'Trial Balance Statement',
    category: 'Finance',
    description: 'Real-time debits and credits balance verification across all 1xxx-5xxx accounts.',
    route: 'admin-global-reports',
    tags: ['Trial Balance', 'Audit', 'Accounting'],
    isPopular: true,
    icon: Receipt
  },
  {
    code: 'RPT-FIN-001',
    name: 'Profit & Loss Statement (Income Statement)',
    category: 'Finance',
    description: 'Uniform System of Accounts for the Lodging Industry (USALI) departmental revenues and net profit.',
    route: 'admin-global-reports',
    tags: ['P&L', 'USALI', 'Net Income', 'GOP'],
    isPopular: true,
    icon: BarChart3
  },
  {
    code: 'RPT-FIN-006',
    name: 'Balance Sheet (Financial Position)',
    category: 'Finance',
    description: 'Statement of financial position with verified Assets = Liabilities + Equity balancing equation.',
    route: 'admin-global-reports',
    tags: ['Balance Sheet', 'Assets', 'Liabilities', 'Equity'],
    icon: Receipt
  },
  {
    code: 'RPT-AR-001',
    name: 'Accounts Receivable (AR) City Ledger Aging',
    category: 'Finance',
    description: 'Corporate client & travel agent outstanding aging schedule (0-30, 31-60, 90+ days).',
    route: 'admin-global-reports',
    tags: ['AR', 'City Ledger', 'Aging', 'Corporate'],
    isPopular: true,
    icon: DollarSign
  },
  {
    code: 'RPT-AP-001',
    name: 'Accounts Payable (AP) Supplier Aging',
    category: 'Finance',
    description: 'Vendor bills pending settlement, credit limits, and payment terms ledger.',
    route: 'admin-global-reports',
    tags: ['AP', 'Suppliers', 'Vendors', 'Payables'],
    icon: DollarSign
  },
  {
    code: 'RPT-TAX-001',
    name: 'VAT (15%) & Service Charge (10%) Tax Report',
    category: 'Finance',
    description: 'Government NBR tax filings, standard VAT breakdown, and service charge distribution.',
    route: 'admin-global-reports',
    tags: ['VAT', 'Tax', 'NBR', 'Service Charge', 'Mushak'],
    isPopular: true,
    icon: Receipt
  },

  // Food & Beverage Outlets
  {
    code: 'RPT-RES-001',
    name: 'Restaurant Daily Sales & Meal Periods',
    category: 'F&B',
    description: 'Breakfast, lunch, dinner, and late-night covers, average check, and menu revenue.',
    route: 'admin-global-reports',
    tags: ['Restaurant', 'Covers', 'Average Check', 'Sales'],
    isPopular: true,
    icon: UtensilsCrossed
  },
  {
    code: 'RPT-BAR-001',
    name: 'Bar & Lounge Beverage Sales Analysis',
    category: 'F&B',
    description: 'Spirits, mocktails, juices, pour cost analysis, and outlet gross margin.',
    route: 'admin-global-reports',
    tags: ['Bar', 'Beverages', 'Gross Margin'],
    icon: UtensilsCrossed
  },
  {
    code: 'RPT-RES-002',
    name: 'Food & Beverage Cost of Goods Sold (COGS)',
    category: 'F&B',
    description: 'Kitchen ingredient consumption vs. actual POS sales revenue ratio.',
    route: 'admin-global-reports',
    tags: ['COGS', 'Cost Control', 'Kitchen'],
    icon: UtensilsCrossed
  },

  // Banquets & Conventions
  {
    code: 'RPT-BAN-001',
    name: 'Banquet Function Diary & Event Sales',
    category: 'Banquets',
    description: 'Convention hall bookings, corporate retreats, wedding banquets, and hall rentals.',
    route: 'admin-global-reports',
    tags: ['Banquets', 'Events', 'Halls', 'Function Diary'],
    isPopular: true,
    icon: Building2
  },
  {
    code: 'RPT-EVT-002',
    name: 'Convention Hall Utilization & Capacity',
    category: 'Banquets',
    description: 'Padma, Meghna, and conference room booking density and revenue per square meter.',
    route: 'admin-global-reports',
    tags: ['Capacity', 'Utilization', 'Event Halls'],
    icon: Building2
  },

  // Inventory & Stores
  {
    code: 'RPT-INV-001',
    name: 'Stock Balance & Valuation Ledger',
    category: 'Inventory',
    description: 'Store-by-store perpetual inventory quantity, weighted average unit cost, and total value.',
    route: 'admin-global-reports',
    tags: ['Inventory', 'Valuation', 'Stock', 'Stores'],
    icon: Boxes
  },
  {
    code: 'RPT-INV-002',
    name: 'Goods Receive Notes (GRN) Register',
    category: 'Inventory',
    description: 'Receiving dock inspection logs, purchase order matches, and supplier invoices.',
    route: 'admin-global-reports',
    tags: ['GRN', 'Procurement', 'Receiving'],
    icon: Boxes
  },
  {
    code: 'RPT-INV-003',
    name: 'Stock Reorder & Minimum Threshold Alert',
    category: 'Inventory',
    description: 'Items below minimum safety stock requiring urgent purchase requisitions.',
    route: 'admin-global-reports',
    tags: ['Reorder', 'Low Stock', 'Alerts'],
    icon: Boxes
  },

  // Audit & Governance
  {
    code: 'RPT-AUD-001',
    name: '100% Comprehensive Audit Trail Log',
    category: 'Audit',
    description: 'Immutable ledger of every check-in, folio discount, void, rate change, and user IP.',
    route: 'admin-global-reports',
    tags: ['Audit Trail', 'Security', 'Compliance', 'User Log'],
    isPopular: true,
    icon: ShieldCheck
  },
  {
    code: 'RPT-AUD-002',
    name: 'Night Audit Day-End Settlement Package',
    category: 'Front Office',
    description: 'Automatic room tariff posting, rate audits, cashier roll-over, and trial balance sync.',
    route: 'admin-global-reports',
    tags: ['Night Audit', 'Day-End', 'Room Post', 'Settlement'],
    isPopular: true,
    icon: ShieldCheck
  }
];

const CATEGORIES: { id: string; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'All', label: 'All Reports', icon: Layers },
  { id: 'Front Office', label: 'Front Office', icon: BedDouble },
  { id: 'Finance', label: 'Finance & Accounts', icon: DollarSign },
  { id: 'F&B', label: 'Restaurant & Bar', icon: UtensilsCrossed },
  { id: 'Banquets', label: 'Banquets & Events', icon: Building2 },
  { id: 'Inventory', label: 'Inventory & Store', icon: Boxes },
  { id: 'Housekeeping', label: 'Housekeeping', icon: Sparkles },
  { id: 'Audit', label: 'Audit & Security', icon: ShieldCheck }
];

export const QuickReportsMenuModal: React.FC<QuickReportsMenuModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectReport,
  onPrintReport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const filteredReports = ALL_SYSTEM_REPORTS.filter(rpt => {
    if (selectedCategory !== 'All' && rpt.category !== selectedCategory) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchCode = rpt.code.toLowerCase().includes(q);
      const matchName = rpt.name.toLowerCase().includes(q);
      const matchDesc = rpt.description.toLowerCase().includes(q);
      const matchTags = rpt.tags.some(t => t.toLowerCase().includes(q));
      return matchCode || matchName || matchDesc || matchTags;
    }
    return true;
  });

  const handleLaunchReport = (item: QuickReportItem) => {
    onClose();
    if (onSelectReport) {
      onSelectReport(item.code);
    }
    onNavigate('admin-global-reports', item.code);
  };

  const handleInstantRun = (e: React.MouseEvent, item: QuickReportItem) => {
    e.stopPropagation();
    try {
      const filterState = {
        dateFrom: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
        searchTerm: ''
      };
      const result = reportingService.runReport(item.code, filterState);
      if (onPrintReport) {
        onClose();
        onPrintReport(result);
        return;
      }
    } catch (err: any) {
      console.warn('Instant report preview error:', err);
    }
    handleLaunchReport(item);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">Quick Menu: All Reports & Statements</h2>
                <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-indigo-400/30">
                  {ALL_SYSTEM_REPORTS.length} Reports Available
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                Direct one-click access to Front Office, Financial Statements, F&B, Banquets & Audit logs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Fast Filters */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search reports by code, name, keyword..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 shadow-xs"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-thin">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Highlights / Popular Reports Bar (if no search) */}
        {!searchTerm && selectedCategory === 'All' && (
          <div className="px-6 py-2.5 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-indigo-900 font-semibold">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Most Frequently Used:</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {ALL_SYSTEM_REPORTS.filter(r => r.isPopular).slice(0, 4).map(pop => (
                <button
                  key={pop.code}
                  onClick={() => handleLaunchReport(pop)}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 font-medium rounded text-[11px] border border-indigo-200 transition-colors flex items-center space-x-1 shadow-xs"
                >
                  <span>{pop.name}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reports Grid List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-gray-100">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700">No reports matched "{searchTerm}"</p>
              <p className="text-xs text-gray-400 mt-1">Try another keyword like "Tax", "ADR", "Revenue", "Balance", "Occupancy"</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                className="mt-4 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-md text-xs font-semibold hover:bg-indigo-100"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredReports.map(rpt => (
                <div
                  key={rpt.code}
                  onClick={() => handleLaunchReport(rpt)}
                  className="group bg-white hover:bg-indigo-50/40 p-3.5 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gray-100 group-hover:bg-indigo-100 text-gray-700 group-hover:text-indigo-800 border border-gray-200 group-hover:border-indigo-200">
                        {rpt.code}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        {rpt.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        {rpt.icon && (
                          <span className="w-6 h-6 rounded bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            {React.createElement(rpt.icon, { className: 'w-3.5 h-3.5' })}
                          </span>
                        )}
                        <span>{rpt.name}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </h3>

                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {rpt.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {rpt.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {onPrintReport && (
                        <button
                          type="button"
                          onClick={(e) => handleInstantRun(e, rpt)}
                          className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 text-[11px] font-semibold rounded border border-indigo-200 transition-colors flex items-center space-x-1 shadow-2xs"
                          title="Instant Preview & Print"
                        >
                          <Eye className="w-3 h-3 text-indigo-600" />
                          <span>Preview</span>
                        </button>
                      )}
                      <span className="text-[11px] font-bold text-indigo-600 group-hover:underline flex items-center space-x-1">
                        <span>Open</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Supported Formats: PDF, Excel, CSV, Direct Print</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Permission-Enforced (Role-Based Access Control)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
