import React, { useState, useMemo } from 'react';
import {
  X, ChevronRight, ChevronLeft, Users, PieChart, CalendarCheck,
  LogIn, LogOut, Receipt, Sparkles, ShieldCheck, Star, Search,
  Printer, Download, RefreshCw, FileSpreadsheet, BarChart3,
  ArrowUpRight, ArrowDownRight, BedDouble, CheckCircle2, Filter,
  Clock, AlertTriangle, Building2, UserCheck, DollarSign, ExternalLink, Eye, XCircle
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { PmsDatabaseState } from '../../services/mockPmsDatabase';
import { Stay, Room, Reservation, Folio } from '../../types/pms';
import { pdfExportService } from '../../services/pdfExportService';
import { reportingService } from '../../services/reportingService';

export type FrontDeskReportType =
  | 'in-house'
  | 'occupancy'
  | 'reservations'
  | 'upcoming-checkin'
  | 'checkout-guest'
  | 'cashier-summary'
  | 'housekeeping-turnover'
  | 'police-manifest'
  | 'vip-guests';

interface QuickMenuBarProps {
  isOpen: boolean;
  onToggle: () => void;
  db: PmsDatabaseState;
  onNavigate?: (route: string, reportCode?: string) => void;
  onOpenCheckIn?: (reservationId?: string) => void;
  onOpenCheckout?: (stayId: string) => void;
  onPrintReport?: (reportData: any) => void;
}

export const QuickMenuBar: React.FC<QuickMenuBarProps> = ({
  isOpen,
  onToggle,
  db,
  onNavigate,
  onOpenCheckIn,
  onOpenCheckout,
  onPrintReport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'guests' | 'occupancy' | 'finance'>('all');
  const [activeReportModal, setActiveReportModal] = useState<FrontDeskReportType | null>(null);
  const [reportSearchQuery, setReportSearchQuery] = useState('');

  const todayStr = db.settings?.currentBusinessDate || new Date().toISOString().split('T')[0];

  // Dynamic calculations from database
  const inHouseStays = useMemo(() => {
    return (db.stays || []).filter(s => s.status === 'Active');
  }, [db.stays]);

  const activeReservations = useMemo(() => {
    return (db.reservations || []).filter(r => r.status === 'Confirmed' || r.status === 'Unconfirmed' || (r.status as string) === 'Pending');
  }, [db.reservations]);

  const todayArrivals = useMemo(() => {
    return (db.reservations || []).filter(r => 
      (r.status === 'Confirmed' || r.status === 'Unconfirmed' || (r.status as string) === 'Pending') &&
      (r.arrivalDate === todayStr || r.arrivalDate <= todayStr)
    );
  }, [db.reservations, todayStr]);

  const todayDepartures = useMemo(() => {
    return inHouseStays.filter(s => {
      if (!s.expectedCheckOutAt) return false;
      return s.expectedCheckOutAt.startsWith(todayStr);
    });
  }, [inHouseStays, todayStr]);

  const vipGuests = useMemo(() => {
    return inHouseStays.filter(s => {
      const g = (db.guests || []).find(guest => guest.id === s.guestId);
      return !!g?.vipStatus;
    });
  }, [inHouseStays, db.guests]);

  const kpis = useMemo(() => {
    return pmsService.getOperationalKPIs();
  }, [db]);

  const dirtyRoomsCount = useMemo(() => {
    return (db.rooms || []).filter(r => r.housekeepingStatus === 'Dirty').length;
  }, [db.rooms]);

  const vacantCleanCount = useMemo(() => {
    return (db.rooms || []).filter(r => (r.operationalStatus === 'Available' || r.operationalStatus === 'Inspected') && r.housekeepingStatus === 'Clean').length;
  }, [db.rooms]);

  const todayCollections = useMemo(() => {
    const todayPayments = (db.payments || []).filter(p => ((p as any).date || p.createdAt || '').startsWith(todayStr));
    return todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [db.payments, todayStr]);

  // Report Items Metadata with Proper Icons
  const reportsList = [
    {
      id: 'in-house' as FrontDeskReportType,
      code: 'RPT-FD-001',
      title: 'In-House Guest Report',
      subtitle: 'Active guest residency roster, room numbers, folio balance, VIP flags & contacts',
      category: 'guests',
      icon: Users,
      iconColor: 'text-blue-600 bg-blue-100 border-blue-200',
      badge: `${inHouseStays.length} Guests`,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      stats: `${inHouseStays.length} registered stays`
    },
    {
      id: 'occupancy' as FrontDeskReportType,
      code: 'RPT-FD-002',
      title: 'Occupancy Report',
      subtitle: 'Real-time room occupancy %, category ratio, clean vs dirty, and blocked units',
      category: 'occupancy',
      icon: PieChart,
      iconColor: 'text-emerald-600 bg-emerald-100 border-emerald-200',
      badge: `${kpis.occupancyRate}% Occupancy`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      stats: `${kpis.occupiedRooms}/${kpis.totalRooms} rooms occupied`
    },
    {
      id: 'reservations' as FrontDeskReportType,
      code: 'RPT-FD-003',
      title: 'Reservation Report',
      subtitle: 'All active and upcoming bookings, booking sources, advance deposits & status',
      category: 'guests',
      icon: CalendarCheck,
      iconColor: 'text-purple-600 bg-purple-100 border-purple-200',
      badge: `${activeReservations.length} Bookings`,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      stats: 'Confirmed & guaranteed'
    },
    {
      id: 'upcoming-checkin' as FrontDeskReportType,
      code: 'RPT-FD-004',
      title: 'Upcoming Check-In Report',
      subtitle: 'Expected arrivals for today and upcoming dates, ETA, room allocation status & deposits',
      category: 'guests',
      icon: LogIn,
      iconColor: 'text-amber-600 bg-amber-100 border-amber-200',
      badge: `${todayArrivals.length} Today`,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      stats: 'Scheduled arrivals'
    },
    {
      id: 'checkout-guest' as FrontDeskReportType,
      code: 'RPT-FD-005',
      title: 'Check-Out Guest Report',
      subtitle: 'Due-out departing stays, folio settlement clearance, key returns & room turnover',
      category: 'guests',
      icon: LogOut,
      iconColor: 'text-rose-600 bg-rose-100 border-rose-200',
      badge: `${todayDepartures.length} Due Out`,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      stats: 'Scheduled departures'
    },
    {
      id: 'cashier-summary' as FrontDeskReportType,
      code: 'RPT-FD-006',
      title: 'Cashier & Payment Summary',
      subtitle: 'Today’s front desk counter collections by Cash, Card, bKash, Nagad & Bank',
      category: 'finance',
      icon: Receipt,
      iconColor: 'text-teal-600 bg-teal-100 border-teal-200',
      badge: `৳${(todayCollections || 0).toLocaleString()}`,
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      stats: 'Counter collections'
    },
    {
      id: 'housekeeping-turnover' as FrontDeskReportType,
      code: 'RPT-FD-007',
      title: 'Housekeeping & Turnover Report',
      subtitle: `Clean, Dirty, Inspected, and Maintenance defect status across all ${(db.rooms || []).length} rooms`,
      category: 'occupancy',
      icon: Sparkles,
      iconColor: 'text-cyan-600 bg-cyan-100 border-cyan-200',
      badge: `${dirtyRoomsCount} Dirty / ${vacantCleanCount} Clean`,
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      stats: 'Turnover readiness'
    },
    {
      id: 'police-manifest' as FrontDeskReportType,
      code: 'RPT-FD-008',
      title: 'Police & Foreign Guest CID Log',
      subtitle: 'Statutory regulatory guest registry with NID, Passport, Visa & Nationality',
      category: 'guests',
      icon: ShieldCheck,
      iconColor: 'text-slate-600 bg-slate-100 border-slate-200',
      badge: 'CID Form A',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
      stats: 'Compliance manifest'
    },
    {
      id: 'vip-guests' as FrontDeskReportType,
      code: 'RPT-FD-009',
      title: 'VIP & High-Priority Care Log',
      subtitle: 'Special care guests, protocol preferences, and dedicated amenity status',
      category: 'guests',
      icon: Star,
      iconColor: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      badge: `${vipGuests.length} VIPs`,
      badgeColor: 'bg-yellow-50 text-yellow-800 border-yellow-300',
      stats: 'Protocol guests'
    }
  ];

  const filteredReports = useMemo(() => {
    return reportsList.filter(item => {
      const matchSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [reportsList, searchTerm, selectedCategory]);

  // Export handlers
  const handleExportCSV = (reportType: FrontDeskReportType) => {
    let data: any[] = [];
    let filename = `FrontDesk_${reportType}_${todayStr}`;

    switch (reportType) {
      case 'in-house':
        data = inHouseStays.map(s => {
          const folio = (db.folios || []).find(f => f.stayId === s.id);
          return {
            'Room Number': s.roomNumber,
            'Guest Name': s.guestName,
            'Stay Number': s.stayNumber,
            'Check-In': s.checkInAt,
            'Expected Check-Out': s.expectedCheckOutAt,
            'Adults': s.adults,
            'Folio Total (৳)': folio?.grandTotal || 0,
            'Paid (৳)': folio?.paidTotal || 0,
            'Balance (৳)': folio?.balance || 0,
            'Status': s.status
          };
        });
        break;

      case 'occupancy':
        data = (db.rooms || []).map(r => ({
          'Room Number': r.roomNumber,
          'Floor': r.floor,
          'Category': r.roomTypeName,
          'Operational Status': r.operationalStatus,
          'Housekeeping': r.housekeepingStatus,
          'Rate (৳)': (r as any).rate || (r as any).baseRate || (r as any).basePrice || 0
        }));
        break;

      case 'reservations':
        data = (db.reservations || []).map(r => ({
          'Reservation Code': r.reservationNumber,
          'Guest Name': r.guestName,
          'Arrival Date': r.arrivalDate,
          'Departure Date': r.departureDate,
          'Room Type': r.roomTypeName,
          'Assigned Room': (r as any).roomNumber || (r as any).assignedRoomNumber || 'Unassigned',
          'Total Estimated (৳)': r.totalEstimatedAmount,
          'Paid Deposit (৳)': r.paidAmount,
          'Balance (৳)': (r as any).balanceAmount || (r.totalEstimatedAmount - (r.paidAmount || 0)),
          'Status': r.status
        }));
        break;

      case 'upcoming-checkin':
        data = todayArrivals.map(r => ({
          'Reservation Code': r.reservationNumber,
          'Guest Name': r.guestName,
          'Arrival Date': r.arrivalDate,
          'Departure Date': r.departureDate,
          'Room Type': r.roomTypeName,
          'Assigned Room': (r as any).roomNumber || (r as any).assignedRoomNumber || 'Not Assigned',
          'Deposit Paid (৳)': r.paidAmount,
          'Balance (৳)': (r as any).balanceAmount || (r.totalEstimatedAmount - (r.paidAmount || 0)),
          'Status': r.status
        }));
        break;

      case 'checkout-guest':
        data = todayDepartures.map(s => {
          const folio = (db.folios || []).find(f => f.stayId === s.id);
          return {
            'Room Number': s.roomNumber,
            'Guest Name': s.guestName,
            'Check-In': s.checkInAt,
            'Expected Departure': s.expectedCheckOutAt,
            'Folio Balance (৳)': folio?.balance || 0,
            'Settlement Status': (folio?.balance || 0) <= 0 ? 'Settled' : 'Pending Payment'
          };
        });
        break;

      default:
        data = inHouseStays.map(s => ({ 'Guest': s.guestName, 'Room': s.roomNumber }));
        break;
    }

    const propertyName = db.settings?.resortName || 'Resort MIS';
    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      pdfExportService.exportToPDF({
        title: filename.replace(/_/g, ' ').toUpperCase(),
        subtitle: `${propertyName.toUpperCase()} • FRONT DESK OPERATIONAL AUDIT`,
        date: new Date().toLocaleDateString('en-GB'),
        columns: keys.map(k => ({ key: k, header: k, align: k.includes('(৳)') || k.includes('Balance') || k.includes('Paid') ? 'right' : 'left' })),
        rows: data,
        department: 'Front Desk Operations',
        metadata: {
          'Audited Date': todayStr,
          'Property': propertyName
        }
      }, `${filename}.pdf`);
    }
  };

  const reportCodeMap: Record<FrontDeskReportType, string> = {
    'in-house': 'RPT-FD-001',
    'occupancy': 'RPT-FD-002',
    'reservations': 'RPT-FD-003',
    'upcoming-checkin': 'RPT-FD-004',
    'checkout-guest': 'RPT-FD-005',
    'cashier-summary': 'RPT-FD-006',
    'housekeeping-turnover': 'RPT-FD-007',
    'police-manifest': 'RPT-FD-001',
    'vip-guests': 'RPT-FD-001'
  };

  const handlePrint = (reportType: FrontDeskReportType) => {
    const code = reportCodeMap[reportType] || 'RPT-FD-001';
    if (onPrintReport) {
      try {
        const filterState = {
          dateFrom: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
          dateTo: new Date().toISOString().split('T')[0],
          searchTerm: ''
        };
        const result = reportingService.runReport(code, filterState);
        onPrintReport(result);
        return;
      } catch (err) {
        console.warn('Fallback print:', err);
      }
    }
    window.print();
  };

  return (
    <>
      {/* 1. COMPACT & USER-FRIENDLY FLOATING QUICK MENU TRIGGER */}
      {!isOpen && (
        <div className="fixed right-0 bottom-10 z-40 animate-in slide-in-from-right-2 duration-150">
          <button
            onClick={onToggle}
            id="quick-menu-docked-tab"
            title="Open Quick Menu: Front Desk Reports (In-House, Occupancy, Reservations, Check-ins, Check-outs)"
            className="group flex items-center space-x-2 pl-2.5 pr-2 py-1.5 bg-white/95 hover:bg-slate-900 text-slate-700 hover:text-white rounded-l-full shadow-lg hover:shadow-xl border-l border-y border-gray-300 hover:border-slate-800 transition-all duration-200 cursor-pointer backdrop-blur-xs hover:pl-3"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 group-hover:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs transition-colors">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>

            <span className="text-xs font-bold tracking-tight whitespace-nowrap">
              Quick Menu
            </span>

            <span className="px-1.5 py-0.2 rounded-full bg-blue-50 group-hover:bg-slate-800 text-blue-700 group-hover:text-blue-300 text-[10px] font-mono font-bold border border-blue-200 group-hover:border-slate-700">
              5
            </span>

            <ChevronLeft className="w-3.5 h-3.5 text-gray-400 group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* 2. THE QUICK MENU SIDEBAR PANEL (When Opened) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-150">
          {/* Backdrop */}
          <div
            onClick={onToggle}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-2xs transition-opacity"
          />

          {/* Slide-over Drawer Panel */}
          <div className="relative w-full max-w-md sm:max-w-lg bg-white h-full shadow-2xl border-l border-gray-200 flex flex-col z-10 animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md border border-blue-400/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-black text-white tracking-tight">
                      Quick Menu: Reports
                    </h2>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 text-[10px] font-mono font-bold border border-blue-400/30">
                      Front Desk
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Live operational guest & occupancy intelligence
                  </p>
                </div>
              </div>

              {/* Hide It After Click Open Button */}
              <button
                onClick={onToggle}
                id="quick-menu-hide-btn"
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold border border-slate-700 transition-colors shadow-xs"
                title="Hide Quick Menu Bar"
              >
                <span>Hide</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick KPI Overview Strip */}
            <div className="px-5 py-3 bg-slate-800/90 text-white grid grid-cols-3 gap-2 border-b border-slate-700/60 text-center">
              <div className="p-1.5 bg-slate-900/60 rounded-lg border border-slate-700/50">
                <p className="text-[10px] uppercase text-slate-400 font-bold">Occupancy</p>
                <p className="text-base font-black text-emerald-400 font-mono mt-0.5">{kpis.occupancyRate}%</p>
              </div>
              <div className="p-1.5 bg-slate-900/60 rounded-lg border border-slate-700/50">
                <p className="text-[10px] uppercase text-slate-400 font-bold">In-House</p>
                <p className="text-base font-black text-blue-400 font-mono mt-0.5">{inHouseStays.length}</p>
              </div>
              <div className="p-1.5 bg-slate-900/60 rounded-lg border border-slate-700/50">
                <p className="text-[10px] uppercase text-slate-400 font-bold">Due Out</p>
                <p className="text-base font-black text-amber-400 font-mono mt-0.5">{todayDepartures.length}</p>
              </div>
            </div>

            {/* Search & Category Filter */}
            <div className="p-4 border-b border-gray-200 bg-gray-50/80 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Filter reports (In-House, Occupancy, Arrivals...)"
                  className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center space-x-1.5 text-xs overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'All Reports' },
                  { id: 'guests', label: 'Guest Rosters' },
                  { id: 'occupancy', label: 'Occupancy' },
                  { id: 'finance', label: 'Cashier' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reports List Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                <span>Front Desk Reports ({filteredReports.length})</span>
                <span className="text-gray-500">1-Click Preview & Export</span>
              </div>

              {filteredReports.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300 p-6">
                  <FileSpreadsheet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-700">No matching reports found</p>
                  <p className="text-[11px] text-gray-500 mt-1">Try searching for &quot;in house&quot;, &quot;occupancy&quot;, or &quot;reservation&quot;</p>
                </div>
              ) : (
                filteredReports.map(rpt => {
                  const IconComponent = rpt.icon;
                  return (
                    <div
                      key={rpt.id}
                      className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-3.5 space-y-3 group"
                    >
                      {/* Top row: Icon, Title, Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${rpt.iconColor}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                {rpt.title}
                              </h3>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                              {rpt.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Live Count / Stat Badge */}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border whitespace-nowrap shrink-0 ${rpt.badgeColor}`}>
                          {rpt.badge}
                        </span>
                      </div>

                      {/* Action buttons footer */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-gray-400 font-mono">
                          {rpt.code} • {rpt.stats}
                        </span>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleExportCSV(rpt.id)}
                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md border border-gray-200 transition-colors"
                            title="Export to Excel / CSV"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePrint(rpt.id)}
                            className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-md border border-gray-200 transition-colors"
                            title="Print Report"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setActiveReportModal(rpt.id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center space-x-1"
                          >
                            <span>Open Report</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-gray-500 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Auto-refreshed with real-time room rack</span>
              </div>
              <button
                onClick={onToggle}
                className="px-4 py-1.5 bg-white hover:bg-gray-100 text-gray-700 font-bold border border-gray-300 rounded-lg text-xs transition-colors"
              >
                Hide Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. REPORT VIEWER MODAL FOR DETAILED TABLES */}
      {activeReportModal && (
        <ReportViewerModal
          reportType={activeReportModal}
          isOpen={!!activeReportModal}
          onClose={() => setActiveReportModal(null)}
          db={db}
          onOpenCheckIn={onOpenCheckIn}
          onOpenCheckout={onOpenCheckout}
          onNavigate={onNavigate}
          onPrintReport={onPrintReport}
        />
      )}
    </>
  );
};

/* ========================================================================= */
/* COMPREHENSIVE REPORT VIEWER MODAL WITH FULL INTERACTIVE TABLES & STATS   */
/* ========================================================================= */

interface ReportViewerModalProps {
  reportType: FrontDeskReportType;
  isOpen: boolean;
  onClose: () => void;
  db: PmsDatabaseState;
  onOpenCheckIn?: (reservationId?: string) => void;
  onOpenCheckout?: (stayId: string) => void;
  onNavigate?: (route: string, reportCode?: string) => void;
  onPrintReport?: (reportData: any) => void;
}

const ReportViewerModal: React.FC<ReportViewerModalProps> = ({
  reportType,
  isOpen,
  onClose,
  db,
  onOpenCheckIn,
  onOpenCheckout,
  onNavigate,
  onPrintReport
}) => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [cancellingRes, setCancellingRes] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Guest requested cancellation at front desk');
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  const handleConfirmCancel = () => {
    if (!cancellingRes) return;
    try {
      pmsService.cancelReservation(cancellingRes.id, cancelReason);
      setCancelFeedback(`Reservation ${cancellingRes.reservationNumber} for ${cancellingRes.guestName} was successfully cancelled.`);
      setCancellingRes(null);
      setTimeout(() => setCancelFeedback(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Could not cancel reservation.');
    }
  };

  const todayStr = db.settings?.currentBusinessDate || new Date().toISOString().split('T')[0];

  if (!isOpen) return null;

  // In-House Guest Report Data
  const inHouseStays = (db.stays || []).filter(s => s.status === 'Active');
  const filteredInHouse = inHouseStays.filter(s => {
    const matchSearch =
      s.guestName.toLowerCase().includes(search.toLowerCase()) ||
      s.roomNumber.includes(search) ||
      s.stayNumber.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // Occupancy Report Data
  const rooms = db.rooms || [];
  const roomTypes = db.roomTypes || [];
  const kpis = pmsService.getOperationalKPIs();
  const filteredRooms = rooms.filter(r => {
    const matchSearch =
      r.roomNumber.includes(search) ||
      (r.roomTypeName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = selectedStatus === 'all' || r.operationalStatus === selectedStatus;
    return matchSearch && matchStatus;
  });

  // Reservation Report Data
  const reservations = db.reservations || [];
  const filteredReservations = reservations.filter(r => {
    const matchSearch =
      r.guestName.toLowerCase().includes(search.toLowerCase()) ||
      r.reservationNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.roomTypeName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = selectedStatus === 'all' || r.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  // Upcoming Check-In Report Data (Arrivals - strictly excludes cancelled or checked-in)
  const arrivals = reservations.filter(r => 
    (r.status === 'Confirmed' || r.status === 'Unconfirmed' || (r.status as string) === 'Pending') &&
    r.status !== 'Cancelled' &&
    r.status !== 'Checked-In' &&
    r.status !== 'Checked-Out' &&
    (r.arrivalDate === todayStr || r.arrivalDate <= todayStr)
  );
  const filteredArrivals = arrivals.filter(r => {
    return (
      r.guestName.toLowerCase().includes(search.toLowerCase()) ||
      r.reservationNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.roomTypeName || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  // Check-Out Guest Report Data (Departures)
  const departures = inHouseStays.filter(s => {
    if (!s.expectedCheckOutAt) return false;
    return s.expectedCheckOutAt.startsWith(todayStr);
  });
  const filteredDepartures = departures.filter(s => {
    return (
      s.guestName.toLowerCase().includes(search.toLowerCase()) ||
      s.roomNumber.includes(search) ||
      s.stayNumber.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Cashier Summary Data
  const payments = (db.payments || []).filter(p => ((p as any).date || p.createdAt || '').startsWith(todayStr));
  const filteredPayments = payments.filter(p => {
    return (
      (((p as any).receiptNumber || (p as any).transactionNumber || p.id || '') as string).toLowerCase().includes(search.toLowerCase()) ||
      (p.method || '').toLowerCase().includes(search.toLowerCase()) ||
      (((p as any).guestName || '') as string).toLowerCase().includes(search.toLowerCase())
    );
  });

  // Export report to CSV
  const handleExportCSV = () => {
    let dataToExport: any[] = [];
    const filename = `Report_${reportType}_${todayStr}`;

    if (reportType === 'in-house') {
      dataToExport = filteredInHouse.map(s => {
        const folio = (db.folios || []).find(f => f.stayId === s.id);
        return {
          'Room No': s.roomNumber,
          'Guest Name': s.guestName,
          'Stay Ref': s.stayNumber,
          'Check-In Date': s.checkInAt,
          'Expected Check-Out': s.expectedCheckOutAt,
          'Adults': s.adults,
          'Folio Balance (৳)': folio?.balance || 0,
          'Total Charges (৳)': folio?.grandTotal || 0,
          'Total Paid (৳)': folio?.paidTotal || 0
        };
      });
    } else if (reportType === 'occupancy') {
      dataToExport = filteredRooms.map(r => ({
        'Room Number': r.roomNumber,
        'Floor': r.floor,
        'Category': r.roomTypeName,
        'Operational Status': r.operationalStatus,
        'Housekeeping': r.housekeepingStatus,
        'Rate (৳)': (r as any).rate || (r as any).baseRate || (r as any).basePrice || 0
      }));
    } else if (reportType === 'reservations') {
      dataToExport = filteredReservations.map(r => ({
        'Reservation Code': r.reservationNumber,
        'Guest Name': r.guestName,
        'Arrival Date': r.arrivalDate,
        'Departure Date': r.departureDate,
        'Room Category': r.roomTypeName,
        'Assigned Room': (r as any).roomNumber || (r as any).assignedRoomNumber || 'Unassigned',
        'Total Estimated (৳)': r.totalEstimatedAmount,
        'Paid Deposit (৳)': r.paidAmount,
        'Balance Due (৳)': (r as any).balanceAmount || (r.totalEstimatedAmount - (r.paidAmount || 0)),
        'Status': r.status
      }));
    } else if (reportType === 'upcoming-checkin') {
      dataToExport = filteredArrivals.map(r => ({
        'Reservation Code': r.reservationNumber,
        'Guest Name': r.guestName,
        'Arrival Date': r.arrivalDate,
        'Room Category': r.roomTypeName,
        'Assigned Room': (r as any).roomNumber || (r as any).assignedRoomNumber || 'Unassigned',
        'Deposit (৳)': r.paidAmount,
        'Balance (৳)': (r as any).balanceAmount || (r.totalEstimatedAmount - (r.paidAmount || 0))
      }));
    } else if (reportType === 'checkout-guest') {
      dataToExport = filteredDepartures.map(s => {
        const folio = (db.folios || []).find(f => f.stayId === s.id);
        return {
          'Room Number': s.roomNumber,
          'Guest Name': s.guestName,
          'Stay Code': s.stayNumber,
          'Check-Out Date': s.expectedCheckOutAt,
          'Folio Total (৳)': folio?.grandTotal || 0,
          'Total Paid (৳)': folio?.paidTotal || 0,
          'Balance (৳)': folio?.balance || 0
        };
      });
    }

    const propertyName = db.settings?.resortName || 'Resort MIS';
    if (dataToExport.length > 0) {
      const keys = Object.keys(dataToExport[0]);
      pdfExportService.exportToPDF({
        title: currentInfo.title.toUpperCase(),
        subtitle: `${propertyName.toUpperCase()} • ${currentInfo.code}`,
        date: new Date().toLocaleDateString('en-GB'),
        columns: keys.map(k => ({
          key: k,
          header: k,
          align: k.includes('(৳)') || k.includes('Balance') || k.includes('Total') || k.includes('Paid') || k.includes('Rate') ? 'right' : 'left'
        })),
        rows: dataToExport,
        department: 'Front Desk Reception',
        metadata: {
          'Property': propertyName,
          'Report Code': currentInfo.code,
          'Generated On': `${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString()}`
        }
      }, `${filename}.pdf`);
    }
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'in-house':
        return { title: 'In-House Guest Report', code: 'RPT-FD-001', icon: Users };
      case 'occupancy':
        return { title: 'Occupancy & Room Utilization Report', code: 'RPT-FD-002', icon: PieChart };
      case 'reservations':
        return { title: 'Reservation & Booking Roster', code: 'RPT-FD-003', icon: CalendarCheck };
      case 'upcoming-checkin':
        return { title: 'Upcoming Check-In Report (Expected Arrivals)', code: 'RPT-FD-004', icon: LogIn };
      case 'checkout-guest':
        return { title: 'Check-Out Guest Report (Expected Departures)', code: 'RPT-FD-005', icon: LogOut };
      case 'cashier-summary':
        return { title: 'Daily Cashier & Collection Summary', code: 'RPT-FD-006', icon: Receipt };
      case 'housekeeping-turnover':
        return { title: 'Housekeeping & Room Turnover Audit', code: 'RPT-FD-007', icon: Sparkles };
      case 'police-manifest':
        return { title: 'Police & Foreign Guest Registry (CID Form A)', code: 'RPT-FD-008', icon: ShieldCheck };
      case 'vip-guests':
        return { title: 'VIP & High-Priority Care Log', code: 'RPT-FD-009', icon: Star };
    }
  };

  const currentInfo = getReportTitle();
  const IconHeader = currentInfo.icon;

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              <IconHeader className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {currentInfo.title}
                </h2>
                <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 font-mono text-[10px] font-bold border border-blue-400/30">
                  {currentInfo.code}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Property: {db.settings?.resortName || 'Resort MIS'} • As of {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold border border-rose-500 transition-colors shadow-xs cursor-pointer"
              title="Download formal vector PDF report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            {onPrintReport ? (
              <button
                onClick={() => {
                  try {
                    const filterState = {
                      dateFrom: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
                      dateTo: new Date().toISOString().split('T')[0],
                      searchTerm: search
                    };
                    const result = reportingService.runReport(currentInfo.code, filterState);
                    onClose();
                    onPrintReport(result);
                  } catch (e) {
                    console.warn('Fallback print:', e);
                    window.print();
                  }
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold border border-slate-700 transition-colors shadow-xs cursor-pointer"
                title="Print Report"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>Print</span>
              </button>
            ) : (
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold border border-slate-700 transition-colors shadow-xs"
                title="Print Report"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>Print</span>
              </button>
            )}
            {onNavigate && (
              <button
                onClick={() => {
                  onClose();
                  onNavigate('admin-global-reports', currentInfo.code);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold border border-indigo-500 transition-colors shadow-xs cursor-pointer"
                title="Open in full Global Report Center"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Report Center</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search table by guest name, room number, or code..."
              className="w-full pl-9 pr-8 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 text-gray-600">
            <span className="font-bold text-[11px] text-gray-500 uppercase tracking-wider">
              {reportType === 'in-house' && `${filteredInHouse.length} in-house guests`}
              {reportType === 'occupancy' && `${filteredRooms.length} rooms listed`}
              {reportType === 'reservations' && `${filteredReservations.length} reservations`}
              {reportType === 'upcoming-checkin' && `${filteredArrivals.length} arrivals scheduled`}
              {reportType === 'checkout-guest' && `${filteredDepartures.length} departures due`}
            </span>
          </div>
        </div>

        {/* Modal Scrollable Table Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 1. IN-HOUSE GUEST REPORT TABLE */}
          {reportType === 'in-house' && (
            <div className="space-y-4">
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-[10px] font-bold text-blue-700 uppercase">In-House Guests</p>
                  <p className="text-xl font-black text-blue-950 font-mono mt-0.5">{inHouseStays.length}</p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Rooms Occupied</p>
                  <p className="text-xl font-black text-emerald-950 font-mono mt-0.5">{kpis.occupiedRooms}</p>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <p className="text-[10px] font-bold text-purple-700 uppercase">VIPs In-House</p>
                  <p className="text-xl font-black text-purple-950 font-mono mt-0.5">
                    {inHouseStays.filter(s => {
                      const g = (db.guests || []).find(guest => guest.id === s.guestId);
                      return g?.vipStatus;
                    }).length}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-[10px] font-bold text-amber-700 uppercase">Total Guest Dues</p>
                  <p className="text-xl font-black text-amber-950 font-mono mt-0.5">
                    ৳{inHouseStays.reduce((sum, s) => {
                      const f = (db.folios || []).find(folio => folio.stayId === s.id);
                      return sum + (f?.balance || 0);
                    }, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5">Room</th>
                      <th className="px-3.5 py-2.5">Guest Name</th>
                      <th className="px-3.5 py-2.5">Stay Ref #</th>
                      <th className="px-3.5 py-2.5">Check-In Date</th>
                      <th className="px-3.5 py-2.5">Expected Checkout</th>
                      <th className="px-3.5 py-2.5 text-right">Folio Total (৳)</th>
                      <th className="px-3.5 py-2.5 text-right">Balance Due (৳)</th>
                      <th className="px-3.5 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredInHouse.map(stay => {
                      const folio = (db.folios || []).find(f => f.stayId === stay.id);
                      const guest = (db.guests || []).find(g => g.id === stay.guestId);
                      return (
                        <tr key={stay.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-3.5 py-2.5 font-mono font-black text-blue-700">
                            {stay.roomNumber}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-gray-900">{stay.guestName}</span>
                              {guest?.vipStatus && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 text-[9px] font-bold border border-purple-200">
                                  VIP
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 font-mono">{guest?.phone || 'No phone'}</p>
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-gray-600">
                            {stay.stayNumber}
                          </td>
                          <td className="px-3.5 py-2.5 text-gray-700 font-medium">
                            {stay.checkInAt ? stay.checkInAt.split('T')[0] : '—'}
                          </td>
                          <td className="px-3.5 py-2.5 text-gray-700 font-medium">
                            {stay.expectedCheckOutAt ? stay.expectedCheckOutAt.split('T')[0] : '—'}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold text-gray-900">
                            ৳{(folio?.grandTotal || 0).toLocaleString()}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold text-rose-600">
                            ৳{(folio?.balance || 0).toLocaleString()}
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              In-House
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. OCCUPANCY REPORT TABLE */}
          {reportType === 'occupancy' && (
            <div className="space-y-4">
              {/* Category Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Resort Occupancy</p>
                  <p className="text-xl font-black text-emerald-950 font-mono mt-0.5">{kpis.occupancyRate}%</p>
                  <p className="text-[10px] text-emerald-600 mt-1">{kpis.occupiedRooms} of {rooms.length} units</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-[10px] font-bold text-blue-700 uppercase">Vacant Clean</p>
                  <p className="text-xl font-black text-blue-950 font-mono mt-0.5">{kpis.availableRooms}</p>
                  <p className="text-[10px] text-blue-600 mt-1">Ready for sale</p>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <p className="text-[10px] font-bold text-rose-700 uppercase">Vacant Dirty</p>
                  <p className="text-xl font-black text-rose-950 font-mono mt-0.5">
                    {rooms.filter(r => r.housekeepingStatus === 'Dirty' && r.operationalStatus !== 'Occupied').length}
                  </p>
                  <p className="text-[10px] text-rose-600 mt-1">Pending turnover</p>
                </div>
                <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-700 uppercase">Out of Order / Hold</p>
                  <p className="text-xl font-black text-slate-950 font-mono mt-0.5">
                    {rooms.filter(r => r.operationalStatus === 'Out of Order' || r.operationalStatus === 'Out of Service').length}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1">Maintenance block</p>
                </div>
              </div>

              {/* Room Rack Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5">Room</th>
                      <th className="px-3.5 py-2.5">Floor</th>
                      <th className="px-3.5 py-2.5">Category</th>
                      <th className="px-3.5 py-2.5">Operational Status</th>
                      <th className="px-3.5 py-2.5">Housekeeping</th>
                      <th className="px-3.5 py-2.5">Current Occupant / Notes</th>
                      <th className="px-3.5 py-2.5 text-right">Rack Rate (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredRooms.slice(0, 50).map(room => {
                      const stay = inHouseStays.find(s => s.roomNumber === room.roomNumber);
                      return (
                        <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3.5 py-2 font-mono font-black text-gray-900">
                            {room.roomNumber}
                          </td>
                          <td className="px-3.5 py-2 text-gray-600 font-mono">
                            Floor {room.floor}
                          </td>
                          <td className="px-3.5 py-2 font-medium text-gray-800">
                            {room.roomTypeName}
                          </td>
                          <td className="px-3.5 py-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              room.operationalStatus === 'Occupied' ? 'bg-blue-100 text-blue-800' :
                              room.operationalStatus === 'Available' ? 'bg-emerald-100 text-emerald-800' :
                              room.operationalStatus === 'Dirty' ? 'bg-rose-100 text-rose-800' :
                              room.operationalStatus === 'Reserved' ? 'bg-amber-100 text-amber-800' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {room.operationalStatus}
                            </span>
                          </td>
                          <td className="px-3.5 py-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              room.housekeepingStatus === 'Clean' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              room.housekeepingStatus === 'Dirty' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}>
                              {room.housekeepingStatus}
                            </span>
                          </td>
                          <td className="px-3.5 py-2 text-gray-700 truncate max-w-xs">
                            {stay ? (
                              <span className="font-bold text-blue-900">{stay.guestName}</span>
                            ) : (
                              <span className="text-gray-400">{room.notes || 'Vacant unit'}</span>
                            )}
                          </td>
                          <td className="px-3.5 py-2 text-right font-mono font-bold text-gray-800">
                            ৳{((room as any).rate || (room as any).baseRate || (room as any).basePrice || 4500 || 0).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredRooms.length > 50 && (
                <p className="text-center text-xs text-gray-400 font-mono">
                  Showing first 50 of {filteredRooms.length} rooms. Use search to locate specific rooms.
                </p>
              )}
            </div>
          )}

          {/* 3. RESERVATION REPORT TABLE */}
          {reportType === 'reservations' && (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5">Res #</th>
                      <th className="px-3.5 py-2.5">Guest Name</th>
                      <th className="px-3.5 py-2.5">Arrival</th>
                      <th className="px-3.5 py-2.5">Departure</th>
                      <th className="px-3.5 py-2.5">Room Category</th>
                      <th className="px-3.5 py-2.5">Assigned Room</th>
                      <th className="px-3.5 py-2.5 text-right">Estimated Tariff (৳)</th>
                      <th className="px-3.5 py-2.5 text-right">Deposit Paid (৳)</th>
                      <th className="px-3.5 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredReservations.map(res => (
                      <tr key={res.id} className="hover:bg-purple-50/30 transition-colors">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-purple-700">
                          {res.reservationNumber}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-gray-900">
                          {res.guestName}
                        </td>
                        <td className="px-3.5 py-2.5 font-medium text-gray-700">
                          {res.arrivalDate}
                        </td>
                        <td className="px-3.5 py-2.5 font-medium text-gray-700">
                          {res.departureDate}
                        </td>
                        <td className="px-3.5 py-2.5 text-gray-800">
                          {res.roomTypeName}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono font-bold text-blue-600">
                          {(res as any).roomNumber || (res as any).assignedRoomNumber || '—'}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-gray-900">
                          ৳{(res.totalEstimatedAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-600">
                          ৳{(res.paidAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            res.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                            res.status === 'Checked-In' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {res.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. UPCOMING CHECK-IN REPORT (ARRIVALS) */}
          {reportType === 'upcoming-checkin' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-amber-900">Scheduled Arrivals for Today:</span>
                  <span className="ml-2 font-mono font-bold text-amber-950">{filteredArrivals.length} Reservations</span>
                </div>
                <span className="text-[11px] text-amber-700">Verify identification cards & collect advance deposits</span>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5">Res #</th>
                      <th className="px-3.5 py-2.5">Guest Name</th>
                      <th className="px-3.5 py-2.5">Arrival Date</th>
                      <th className="px-3.5 py-2.5">Room Type</th>
                      <th className="px-3.5 py-2.5">Allocated Room</th>
                      <th className="px-3.5 py-2.5 text-right">Deposit (৳)</th>
                      <th className="px-3.5 py-2.5 text-right">Balance Due (৳)</th>
                      <th className="px-3.5 py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredArrivals.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-400">
                          <div className="space-y-2">
                            <p>No pending arrivals remaining for today.</p>
                            <button
                              type="button"
                              onClick={() => pmsService.reanchorArrivalsToToday()}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
                            >
                              Sync / Re-Anchor Arrivals to Today ({todayStr})
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredArrivals.map(res => (
                        <tr key={res.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="px-3.5 py-2.5 font-mono font-bold text-amber-700">
                            {res.reservationNumber}
                          </td>
                          <td className="px-3.5 py-2.5 font-bold text-gray-900">
                            {res.guestName}
                          </td>
                          <td className="px-3.5 py-2.5 text-gray-700 font-medium">
                            {res.arrivalDate}
                          </td>
                          <td className="px-3.5 py-2.5 text-gray-800">
                            {res.roomTypeName}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">
                            {(res as any).roomNumber || (res as any).assignedRoomNumber || <span className="text-amber-600 italic">Unassigned</span>}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-600">
                            ৳{(res.paidAmount || 0).toLocaleString()}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold text-rose-600">
                            ৳{((res as any).balanceAmount || (res.totalEstimatedAmount - (res.paidAmount || 0))).toLocaleString()}
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {onOpenCheckIn && (
                                <button
                                  onClick={() => {
                                    onClose();
                                    onOpenCheckIn(res.id);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] shadow-xs"
                                >
                                  Check-In
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setCancellingRes(res);
                                  setCancelReason('Guest requested cancellation at front desk');
                                }}
                                title="Cancel Reservation"
                                className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. CHECK-OUT GUEST REPORT (DEPARTURES) */}
          {reportType === 'checkout-guest' && (
            <div className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-rose-900">Due Out Departures for Today:</span>
                  <span className="ml-2 font-mono font-bold text-rose-950">{filteredDepartures.length} Stays</span>
                </div>
                <span className="text-[11px] text-rose-700">Ensure room bill clearance & retrieve room keys</span>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5">Room</th>
                      <th className="px-3.5 py-2.5">Guest Name</th>
                      <th className="px-3.5 py-2.5">Stay Ref #</th>
                      <th className="px-3.5 py-2.5">Check-In</th>
                      <th className="px-3.5 py-2.5">Expected Checkout</th>
                      <th className="px-3.5 py-2.5 text-right">Folio Total (৳)</th>
                      <th className="px-3.5 py-2.5 text-right">Balance Due (৳)</th>
                      <th className="px-3.5 py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredDepartures.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-400">
                          No pending departures remaining for today.
                        </td>
                      </tr>
                    ) : (
                      filteredDepartures.map(stay => {
                        const folio = (db.folios || []).find(f => f.stayId === stay.id);
                        const isSettled = (folio?.balance || 0) <= 0;
                        return (
                          <tr key={stay.id} className="hover:bg-rose-50/30 transition-colors">
                            <td className="px-3.5 py-2.5 font-mono font-black text-rose-700">
                              {stay.roomNumber}
                            </td>
                            <td className="px-3.5 py-2.5 font-bold text-gray-900">
                              {stay.guestName}
                            </td>
                            <td className="px-3.5 py-2.5 font-mono text-gray-600">
                              {stay.stayNumber}
                            </td>
                            <td className="px-3.5 py-2.5 text-gray-700">
                              {stay.checkInAt ? stay.checkInAt.split('T')[0] : '—'}
                            </td>
                            <td className="px-3.5 py-2.5 text-gray-700">
                              {stay.expectedCheckOutAt ? stay.expectedCheckOutAt.split('T')[0] : '—'}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-bold text-gray-900">
                              ৳{(folio?.grandTotal || 0).toLocaleString()}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-bold">
                              {isSettled ? (
                                <span className="text-emerald-600">৳0 (Settled)</span>
                              ) : (
                                <span className="text-rose-600">৳{(folio?.balance || 0).toLocaleString()}</span>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5 text-center">
                              {onOpenCheckout && (
                                <button
                                  onClick={() => {
                                    onClose();
                                    onOpenCheckout(stay.id);
                                  }}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[11px] shadow-xs"
                                >
                                  Check Out
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. CASHIER SUMMARY */}
          {reportType === 'cashier-summary' && (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5">Receipt #</th>
                      <th className="px-3.5 py-2.5">Guest / Room</th>
                      <th className="px-3.5 py-2.5">Payment Method</th>
                      <th className="px-3.5 py-2.5">Date & Time</th>
                      <th className="px-3.5 py-2.5 text-right">Amount Collected (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">
                          No payments registered today.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3.5 py-2 font-mono font-bold text-gray-800">{(p as any).receiptNumber || (p as any).transactionNumber || p.id}</td>
                          <td className="px-3.5 py-2 font-bold text-gray-900">{(p as any).guestName || 'Front Desk Guest'}</td>
                          <td className="px-3.5 py-2">
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                              {p.method}
                            </span>
                          </td>
                          <td className="px-3.5 py-2 text-gray-600 font-mono">{(p as any).date || (p.createdAt ? p.createdAt.split('T')[0] : 'Today')}</td>
                          <td className="px-3.5 py-2 text-right font-mono font-black text-emerald-600">
                            ৳{(p.amount || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* OTHER REPORTS: HOUSEKEEPING, POLICE, VIP */}
          {(reportType === 'housekeeping-turnover' || reportType === 'police-manifest' || reportType === 'vip-guests') && (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5">Room</th>
                      <th className="px-3.5 py-2.5">Category</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5">Guest Information</th>
                      <th className="px-3.5 py-2.5 text-center">Compliance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {inHouseStays.map(stay => (
                      <tr key={stay.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3.5 py-2.5 font-mono font-black text-blue-700">{stay.roomNumber}</td>
                        <td className="px-3.5 py-2.5 text-gray-800">{stay.roomTypeName || 'Room'}</td>
                        <td className="px-3.5 py-2.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Active
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-gray-900">{stay.guestName}</td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
          <div className="text-gray-500 font-mono text-[11px]">
            LESync PMS Hospitality Engine • Generated Report
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
          >
            Close Report
          </button>
        </div>

        {/* Cancellation Confirmation Dialog */}
        {cancellingRes && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-md w-full shadow-2xl space-y-3.5 text-xs text-gray-800">
              <div className="flex items-center space-x-2.5 text-rose-600">
                <XCircle className="w-5 h-5 shrink-0" />
                <h4 className="font-bold text-gray-900 text-sm">Cancel Reservation {cancellingRes.reservationNumber}?</h4>
              </div>
              <p className="text-gray-600">
                Are you sure you want to cancel the booking for <strong className="text-gray-900 font-semibold">{cancellingRes.guestName}</strong>?
                The room will be released immediately and this booking will be removed from upcoming arrivals.
              </p>
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Reason for Cancellation:</label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Guest change of plans, flight cancelled"
                  className="w-full bg-gray-50 border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 text-xs focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCancellingRes(null)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded text-xs transition"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs transition shadow-xs flex items-center space-x-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Feedback Toast */}
        {cancelFeedback && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cancelFeedback}</span>
          </div>
        )}
      </div>
    </div>
  );
};
