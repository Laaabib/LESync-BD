import React, { useState, useEffect, useMemo } from 'react';
import {
  ConciergeBell, LogIn, LogOut, BedDouble, Users, ArrowRightLeft,
  Receipt, FileText, Search, PlusCircle, Printer, Filter, ShieldCheck,
  ShieldAlert, Lock, Unlock, AlertTriangle, X, CheckCircle2, Info,
  Zap, Clock, Calendar, Sparkles, AlertCircle, Check, XCircle
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { PmsDatabaseState, getOffsetDate } from '../services/mockPmsDatabase';
import { Stay, Reservation, Room } from '../types/pms';

interface FrontDeskViewProps {
  onOpenCheckIn: (reservationId?: string) => void;
  onOpenCheckout: (stayId?: string) => void;
  onOpenFolio: (folioId: string) => void;
  onOpenRoomDetail: (roomId: string) => void;
  onPrintRegCard: (stay: Stay) => void;
  onOpenNewReservation: () => void;
  initialTab?: 'in-house' | 'arrivals' | 'departures';
  onNavigate?: (route: string) => void;
}

export const FrontDeskView: React.FC<FrontDeskViewProps> = ({
  onOpenCheckIn,
  onOpenCheckout,
  onOpenFolio,
  onOpenRoomDetail,
  onPrintRegCard,
  onOpenNewReservation,
  initialTab,
  onNavigate
}) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [activeTab, setActiveTab] = useState<'in-house' | 'arrivals' | 'departures'>(initialTab || 'in-house');
  const [arrivalFilter, setArrivalFilter] = useState<'today' | 'all-upcoming' | 'tomorrow' | 'past-due'>('today');
  const [departureFilter, setDepartureFilter] = useState<'today' | 'overdue' | 'all-in-house'>('today');
  const [search, setSearch] = useState('');
  const [stopPostFilter, setStopPostFilter] = useState<'all' | 'restricted-only' | 'normal-only'>('all');

  // Stop Post modal state
  const [stopPostTargetStay, setStopPostTargetStay] = useState<Stay | null>(null);
  const [stopPostReasonPreset, setStopPostReasonPreset] = useState('Credit Limit Exceeded — Direct Pay Only');
  const [stopPostCustomReason, setStopPostCustomReason] = useState('');
  const [stopPostActionSuccess, setStopPostActionSuccess] = useState<string | null>(null);

  // Arrivals cancellation state
  const [cancellingArrival, setCancellingArrival] = useState<Reservation | null>(null);
  const [arrivalCancelReason, setArrivalCancelReason] = useState<string>('Guest requested cancellation at front desk');
  const [frontDeskToast, setFrontDeskToast] = useState<string | null>(null);

  const handleConfirmCancelArrival = () => {
    if (!cancellingArrival) return;
    try {
      pmsService.cancelReservation(cancellingArrival.id, arrivalCancelReason || 'Cancelled at Front Desk Arrivals');
      setFrontDeskToast(`Reservation ${cancellingArrival.reservationNumber} for ${cancellingArrival.guestName} has been cancelled. Room released and removed from Arrivals.`);
      setCancellingArrival(null);
      setTimeout(() => setFrontDeskToast(null), 5000);
    } catch (err: any) {
      setFrontDeskToast(`Failed to cancel: ${err?.message || err}`);
    }
  };

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  // Sync active tab when initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const todayStr = db.settings.currentBusinessDate || new Date().toISOString().split('T')[0];
  const tomorrowStr = getOffsetDate(todayStr, 1);

  // In-house active stays
  const inHouseStays = useMemo(() => db.stays.filter(s => s.status === 'Active'), [db.stays]);

  // All confirmed / active upcoming reservations (Strictly excludes Cancelled, Checked-In, and Checked-Out)
  const allConfirmed = useMemo(() => 
    db.reservations.filter(r => 
      (r.status === 'Confirmed' || r.status === 'Unconfirmed' || (r.status as string) === 'Pending') &&
      r.status !== 'Cancelled' &&
      r.status !== 'Checked-In' &&
      r.status !== 'Checked-Out'
    ),
    [db.reservations]
  );

  // Today's upcoming arrivals (scheduled for today or past due)
  const todaysArrivals = useMemo(() => {
    return allConfirmed.filter(r => r.arrivalDate === todayStr || r.arrivalDate < todayStr);
  }, [allConfirmed, todayStr]);

  const tomorrowArrivals = useMemo(() => {
    return allConfirmed.filter(r => r.arrivalDate === tomorrowStr);
  }, [allConfirmed, tomorrowStr]);

  const pastDueArrivals = useMemo(() => {
    return allConfirmed.filter(r => r.arrivalDate < todayStr);
  }, [allConfirmed, todayStr]);

  // Departures
  const todaysDepartures = useMemo(() => {
    return inHouseStays.filter(s => s.expectedCheckOutAt && s.expectedCheckOutAt.startsWith(todayStr));
  }, [inHouseStays, todayStr]);

  const overdueDepartures = useMemo(() => {
    return inHouseStays.filter(s => s.expectedCheckOutAt && s.expectedCheckOutAt.split('T')[0] < todayStr);
  }, [inHouseStays, todayStr]);

  // Today's metrics
  const checkedInTodayCount = useMemo(() => {
    return db.stays.filter(s => s.checkInAt && s.checkInAt.startsWith(todayStr)).length;
  }, [db.stays, todayStr]);

  const checkedOutTodayCount = useMemo(() => {
    return db.stays.filter(s => s.status === 'Checked-Out' && s.actualCheckOutAt && s.actualCheckOutAt.startsWith(todayStr)).length;
  }, [db.stays, todayStr]);

  // Filtered In-House Stays
  const filteredStays = inHouseStays.filter(s => {
    const matchesSearch =
      s.guestName.toLowerCase().includes(search.toLowerCase()) ||
      s.roomNumber.includes(search) ||
      s.stayNumber.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    if (stopPostFilter === 'restricted-only') return !!s.stopPost;
    if (stopPostFilter === 'normal-only') return !s.stopPost;
    return true;
  });

  // Filtered Arrivals based on sub-tab
  const baseArrivals = useMemo(() => {
    switch (arrivalFilter) {
      case 'today':
        return todaysArrivals;
      case 'tomorrow':
        return tomorrowArrivals;
      case 'past-due':
        return pastDueArrivals;
      case 'all-upcoming':
      default:
        return allConfirmed;
    }
  }, [arrivalFilter, todaysArrivals, tomorrowArrivals, pastDueArrivals, allConfirmed]);

  const filteredArrivals = baseArrivals.filter(r =>
    r.guestName.toLowerCase().includes(search.toLowerCase()) ||
    r.reservationNumber.toLowerCase().includes(search.toLowerCase()) ||
    (r.guestPhone && r.guestPhone.includes(search)) ||
    (r.roomTypeName && r.roomTypeName.toLowerCase().includes(search.toLowerCase()))
  );

  // Filtered Departures based on sub-tab
  const baseDepartures = useMemo(() => {
    switch (departureFilter) {
      case 'today':
        return todaysDepartures;
      case 'overdue':
        return overdueDepartures;
      case 'all-in-house':
      default:
        return inHouseStays;
    }
  }, [departureFilter, todaysDepartures, overdueDepartures, inHouseStays]);

  const filteredDepartures = baseDepartures.filter(s =>
    s.guestName.toLowerCase().includes(search.toLowerCase()) ||
    s.roomNumber.includes(search) ||
    s.stayNumber.toLowerCase().includes(search.toLowerCase()) ||
    (s.roomTypeName && s.roomTypeName.toLowerCase().includes(search.toLowerCase()))
  );

  const stopPostCount = inHouseStays.filter(s => s.stopPost).length;

  const handleOpenStopPostModal = (stay: Stay) => {
    setStopPostTargetStay(stay);
    setStopPostActionSuccess(null);
    if (stay.stopPost) {
      setStopPostCustomReason(stay.stopPostReason || '');
    } else {
      setStopPostReasonPreset('Credit Limit Exceeded — Direct Pay Only');
      setStopPostCustomReason('');
    }
  };

  const handleConfirmStopPostToggle = (enable: boolean) => {
    if (!stopPostTargetStay) return;
    try {
      const reasonToUse = stopPostReasonPreset === 'Other'
        ? (stopPostCustomReason.trim() || 'Restricted by Front Office')
        : (stopPostCustomReason.trim() ? `${stopPostReasonPreset} (${stopPostCustomReason.trim()})` : stopPostReasonPreset);

      pmsService.toggleStopPost(stopPostTargetStay.id, enable, reasonToUse);
      setStopPostActionSuccess(enable ? `Stop Post restriction activated on Room ${stopPostTargetStay.roomNumber}` : `Stop Post lock removed from Room ${stopPostTargetStay.roomNumber}`);
      setTimeout(() => {
        setStopPostTargetStay(null);
        setStopPostActionSuccess(null);
      }, 900);
    } catch (err: any) {
      alert(err.message || 'Failed to update Stop Post status');
    }
  };

  // Helper for arrival badge
  const getArrivalBadge = (arrivalDate: string) => {
    if (arrivalDate === todayStr) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Arriving Today</span>;
    }
    if (arrivalDate < todayStr) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">Past Due Arrival</span>;
    }
    if (arrivalDate === tomorrowStr) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Tomorrow</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">{arrivalDate}</span>;
  };

  return (
    <div className="space-y-4 text-xs text-gray-900">
      {/* Front Desk Operations Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 text-white font-bold flex items-center justify-center shadow-xs">
            <ConciergeBell className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-gray-900 uppercase tracking-tight">Front Desk Operations Command</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 font-mono">
                LIVE DESK
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-0.5">
              Rapid arrival check-in, anytime guest check-out, room rack and folio settling.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Standard / Walk-in Check-in */}
          <button
            type="button"
            onClick={() => onOpenCheckIn()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-xs text-xs"
          >
            <LogIn className="w-4 h-4" />
            <span>Walk-In Check-In</span>
          </button>

          {/* Anytime Checkout */}
          <button
            type="button"
            onClick={() => onOpenCheckout()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg transition-colors border border-rose-200 text-xs"
            title="Check out any in-house guest at any time"
          >
            <LogOut className="w-4 h-4" />
            <span>Check-Out Guest</span>
          </button>

          {/* New Reservation */}
          <button
            type="button"
            onClick={onOpenNewReservation}
            className="flex items-center space-x-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors border border-gray-300 text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Front Desk Operational KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Today's Check-Ins Card */}
        <div
          onClick={() => setActiveTab('arrivals')}
          className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
            activeTab === 'arrivals' ? 'bg-amber-50/80 border-amber-300 shadow-xs' : 'bg-white border-gray-200 hover:border-amber-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-500 font-semibold text-[11px]">
              <LogIn className="w-3.5 h-3.5 text-amber-600" />
              <span>Today's Check-Ins</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-gray-900">{todaysArrivals.length}</span>
              <span className="text-xs text-amber-700 font-medium">Pending Arrival</span>
            </div>
            <p className="text-[11px] text-gray-500">
              <strong className="text-emerald-700">{checkedInTodayCount}</strong> checked in today • {allConfirmed.length} total confirmed
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCheckIn();
            }}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs"
            title="Walk-In / Guest Check-In"
          >
            <LogIn className="w-4 h-4" />
          </button>
        </div>

        {/* Today's Check-Outs Card */}
        <div
          onClick={() => setActiveTab('departures')}
          className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
            activeTab === 'departures' ? 'bg-rose-50/80 border-rose-300 shadow-xs' : 'bg-white border-gray-200 hover:border-rose-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-500 font-semibold text-[11px]">
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Today's Departures</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-gray-900">{todaysDepartures.length}</span>
              <span className="text-xs text-rose-700 font-medium">Expected Today</span>
            </div>
            <p className="text-[11px] text-gray-500">
              <strong className="text-emerald-700">{checkedOutTodayCount}</strong> departed • {overdueDepartures.length > 0 ? <span className="text-rose-600 font-bold">{overdueDepartures.length} overdue</span> : '0 overdue'}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCheckout();
            }}
            className="p-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-xs"
            title="Check Out In-House Guest"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Live In-House Occupancy */}
        <div
          onClick={() => setActiveTab('in-house')}
          className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
            activeTab === 'in-house' ? 'bg-blue-50/80 border-blue-300 shadow-xs' : 'bg-white border-gray-200 hover:border-blue-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-500 font-semibold text-[11px]">
              <BedDouble className="w-3.5 h-3.5 text-blue-600" />
              <span>In-House Occupancy</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-blue-700">{inHouseStays.length}</span>
              <span className="text-xs text-gray-600 font-medium">Rooms Occupied</span>
            </div>
            <p className="text-[11px] text-gray-500">
              Total {db.rooms.length} Rooms • {stopPostCount > 0 ? <span className="text-amber-600 font-bold">{stopPostCount} Stop Post</span> : 'Full Outlet Access'}
            </p>
          </div>
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg font-mono font-bold text-xs">
            {Math.round((inHouseStays.length / (db.rooms.length || 1)) * 100)}% Occ
          </span>
        </div>
      </div>

      {/* Tabs and Master Search Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-white border border-gray-200 p-2.5 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
            {/* Arrivals Tab */}
            <button
              onClick={() => setActiveTab('arrivals')}
              className={`px-3.5 py-1.5 rounded-md font-bold text-xs transition-colors flex items-center space-x-2 ${
                activeTab === 'arrivals'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Upcoming Check-Ins</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                activeTab === 'arrivals' ? 'bg-slate-950 text-amber-300' : 'bg-gray-200 text-gray-700'
              }`}>
                {todaysArrivals.length}
              </span>
            </button>

            {/* Departures Tab */}
            <button
              onClick={() => setActiveTab('departures')}
              className={`px-3.5 py-1.5 rounded-md font-bold text-xs transition-colors flex items-center space-x-2 ${
                activeTab === 'departures'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Check-Outs / Departures</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                activeTab === 'departures' ? 'bg-rose-900 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {todaysDepartures.length}
              </span>
            </button>

            {/* In-House Guests Tab */}
            <button
              onClick={() => setActiveTab('in-house')}
              className={`px-3.5 py-1.5 rounded-md font-bold text-xs transition-colors flex items-center space-x-2 ${
                activeTab === 'in-house'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BedDouble className="w-3.5 h-3.5" />
              <span>In-House Rack</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                activeTab === 'in-house' ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {inHouseStays.length}
              </span>
            </button>
          </div>

          {/* Tab-specific sub-filters */}
          {activeTab === 'arrivals' && (
            <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 p-1 rounded-lg text-[11px] overflow-x-auto max-w-full">
              <button
                onClick={() => setArrivalFilter('today')}
                className={`px-2 py-1 rounded font-medium transition whitespace-nowrap ${
                  arrivalFilter === 'today' ? 'bg-white text-gray-900 shadow-xs font-bold border border-gray-200' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Today's Arrivals ({todaysArrivals.length})
              </button>
              <button
                onClick={() => setArrivalFilter('all-upcoming')}
                className={`px-2 py-1 rounded font-medium transition whitespace-nowrap ${
                  arrivalFilter === 'all-upcoming' ? 'bg-white text-gray-900 shadow-xs font-bold border border-gray-200' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                All Upcoming (Anytime Check-In) ({allConfirmed.length})
              </button>
              <button
                onClick={() => setArrivalFilter('tomorrow')}
                className={`px-2 py-1 rounded font-medium transition whitespace-nowrap ${
                  arrivalFilter === 'tomorrow' ? 'bg-white text-gray-900 shadow-xs font-bold border border-gray-200' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Tomorrow ({tomorrowArrivals.length})
              </button>
              {pastDueArrivals.length > 0 && (
                <button
                  onClick={() => setArrivalFilter('past-due')}
                  className={`px-2 py-1 rounded font-medium transition whitespace-nowrap text-rose-600 ${
                    arrivalFilter === 'past-due' ? 'bg-rose-100 font-bold border border-rose-200' : 'hover:bg-rose-50'
                  }`}
                >
                  Past Due ({pastDueArrivals.length})
                </button>
              )}
            </div>
          )}

          {activeTab === 'departures' && (
            <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 p-1 rounded-lg text-[11px] overflow-x-auto max-w-full">
              <button
                onClick={() => setDepartureFilter('today')}
                className={`px-2 py-1 rounded font-medium transition whitespace-nowrap ${
                  departureFilter === 'today' ? 'bg-white text-gray-900 shadow-xs font-bold border border-gray-200' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Today's Departures ({todaysDepartures.length})
              </button>
              {overdueDepartures.length > 0 && (
                <button
                  onClick={() => setDepartureFilter('overdue')}
                  className={`px-2 py-1 rounded font-medium transition whitespace-nowrap text-rose-600 ${
                    departureFilter === 'overdue' ? 'bg-rose-100 font-bold border border-rose-200' : 'hover:bg-rose-50'
                  }`}
                >
                  Overdue ({overdueDepartures.length})
                </button>
              )}
              <button
                onClick={() => setDepartureFilter('all-in-house')}
                className={`px-2 py-1 rounded font-medium transition whitespace-nowrap ${
                  departureFilter === 'all-in-house' ? 'bg-white text-gray-900 shadow-xs font-bold border border-gray-200' : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Allows checking out any in-house guest whenever they approach front desk"
              >
                All In-House (Check-Out Anytime) ({inHouseStays.length})
              </button>
            </div>
          )}

          {activeTab === 'in-house' && (
            <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 p-1 rounded-lg text-[11px] overflow-x-auto max-w-full">
              <button
                onClick={() => setStopPostFilter('all')}
                className={`px-2 py-1 rounded font-medium transition whitespace-nowrap ${
                  stopPostFilter === 'all' ? 'bg-white text-gray-900 shadow-xs font-bold border border-gray-200' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                All Rooms ({inHouseStays.length})
              </button>
              <button
                onClick={() => setStopPostFilter('restricted-only')}
                className={`px-2 py-1 rounded font-medium transition whitespace-nowrap flex items-center gap-1 ${
                  stopPostFilter === 'restricted-only'
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                Stop Post ({stopPostCount})
              </button>
            </div>
          )}
        </div>

        {/* Search filter input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room, guest name, phone..."
            className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. UPCOMING CHECK-INS (ARRIVALS) TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'arrivals' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs space-y-0">
          <div className="p-3 bg-amber-50/50 border-b border-amber-200/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs text-amber-950">
                {arrivalFilter === 'today' ? "Today's Upcoming Arrivals" :
                 arrivalFilter === 'all-upcoming' ? "All Upcoming Confirmed Bookings (Check-In Anytime)" :
                 arrivalFilter === 'tomorrow' ? "Tomorrow's Expected Arrivals" : "Past Due Arrivals"}
              </span>
              <span className="text-[11px] text-amber-800 font-mono">
                ({filteredArrivals.length} reservations found)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {filteredArrivals.length === 0 && (
                <button
                  type="button"
                  onClick={() => pmsService.reanchorArrivalsToToday()}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-md shadow-xs transition-colors"
                >
                  Sync Arrivals to Today ({todayStr})
                </button>
              )}
              <span className="text-[11px] text-gray-500 hidden sm:inline">
                Tip: Click Check-In on any confirmed booking to immediately register guest and assign room.
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4">Res #</th>
                  <th className="py-2.5 px-4">Guest Full Name</th>
                  <th className="py-2.5 px-4">Phone / Contact</th>
                  <th className="py-2.5 px-4">Category & Nights</th>
                  <th className="py-2.5 px-4">Schedule</th>
                  <th className="py-2.5 px-4 text-right">Advance Paid</th>
                  <th className="py-2.5 px-4 text-center">Check-In Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredArrivals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <div className="max-w-sm mx-auto space-y-2">
                        <LogIn className="w-8 h-8 text-gray-300 mx-auto" />
                        <p className="font-medium text-gray-600">No matching upcoming arrivals found.</p>
                        <p className="text-[11px] text-gray-400">
                          {arrivalFilter === 'today'
                            ? "All scheduled arrivals for today have either been checked in or no more are pending."
                            : "No reservations found matching current filter criteria."}
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setArrivalFilter('all-upcoming')}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold text-xs"
                          >
                            View All Upcoming Bookings
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              pmsService.reanchorArrivalsToToday();
                              setArrivalFilter('today');
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs"
                          >
                            Sync Arrivals to Today ({todayStr})
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredArrivals.map(res => (
                    <tr key={res.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {res.reservationNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900 block">{res.guestName}</span>
                        <span className="text-[10px] text-gray-400">Source: {res.bookingSource}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600">
                        {res.guestPhone}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-800 block">{res.roomTypeName}</span>
                        <span className="text-[10px] text-gray-400">{res.adults} Adults, {res.children} Kids</span>
                      </td>
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="font-mono text-gray-700">
                          {res.arrivalDate} → {res.departureDate}
                        </div>
                        <div>{getArrivalBadge(res.arrivalDate)}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        ৳{(res.paidAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenCheckIn(res.id)}
                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-xs text-xs"
                            title="Check in guest & assign room"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Check-In</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCancellingArrival(res);
                              setArrivalCancelReason('Guest requested cancellation at front desk');
                            }}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Cancel this arrival reservation"
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

      {/* ========================================================================= */}
      {/* 2. CHECK-OUTS / DEPARTURES TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'departures' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs space-y-0">
          <div className="p-3 bg-rose-50/50 border-b border-rose-200/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs text-rose-950">
                {departureFilter === 'today' ? "Today's Scheduled Departures" :
                 departureFilter === 'overdue' ? "Overdue In-House Departures" : "All In-House Stays (Check-Out Anytime)"}
              </span>
              <span className="text-[11px] text-rose-800 font-mono">
                ({filteredDepartures.length} guests eligible for checkout)
              </span>
            </div>
            <span className="text-[11px] text-gray-500">
              Guests can check out anytime. 1-click checkout available for cleared folios.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4">Room #</th>
                  <th className="py-2.5 px-4">Guest Name</th>
                  <th className="py-2.5 px-4">Stay Record</th>
                  <th className="py-2.5 px-4">Check-In / Expected Out</th>
                  <th className="py-2.5 px-4 text-right">Folio Balance</th>
                  <th className="py-2.5 px-4 text-center">Fast Track Check-Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDepartures.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <div className="max-w-sm mx-auto space-y-2">
                        <LogOut className="w-8 h-8 text-gray-300 mx-auto" />
                        <p className="font-medium text-gray-600">No matching departures found.</p>
                        <p className="text-[11px] text-gray-400">
                          {departureFilter === 'today'
                            ? "No additional guests are scheduled to depart today."
                            : "No active in-house stays found for checkout."}
                        </p>
                        <button
                          type="button"
                          onClick={() => setDepartureFilter('all-in-house')}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-bold text-xs"
                        >
                          Show All In-House Guests (Check-Out Anytime)
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDepartures.map(s => {
                    const folio = db.folios.find(f => f.id === s.folioId);
                    const isZeroBalance = !folio || folio.balance <= 0;
                    return (
                      <tr key={s.id} className="hover:bg-rose-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => onOpenRoomDetail(s.roomId)}
                            className="font-mono font-black text-amber-700 hover:underline bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg"
                          >
                            Room {s.roomNumber}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900 block">{s.guestName}</span>
                          <span className="text-[10px] text-gray-500">{s.roomTypeName}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-500">
                          {s.stayNumber}
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-mono space-y-0.5">
                          <div>In: {s.checkInAt ? s.checkInAt.split('T')[0] : 'N/A'}</div>
                          <div className={s.expectedCheckOutAt && s.expectedCheckOutAt.split('T')[0] < todayStr ? 'text-rose-600 font-bold' : ''}>
                            Out: {s.expectedCheckOutAt ? s.expectedCheckOutAt.split('T')[0] : 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {folio ? (
                            folio.balance <= 0 ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
                                ৳0 (Cleared)
                              </span>
                            ) : (
                              <span className="text-rose-600">
                                ৳{(folio.balance || 0).toLocaleString()}
                              </span>
                            )
                          ) : '৳0'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {isZeroBalance ? (
                              <button
                                type="button"
                                onClick={() => onOpenCheckout(s.id)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition shadow-xs"
                                title="Check out since bill is fully settled"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Check-Out (Settled)</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenCheckout(s.id)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition shadow-xs"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Check-Out & Settle</span>
                              </button>
                            )}

                            {folio && (
                              <button
                                type="button"
                                onClick={() => onOpenFolio(folio.id)}
                                className="p-1.5 text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                title="View Folio Statement"
                              >
                                <Receipt className="w-3.5 h-3.5" />
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
      )}

      {/* ========================================================================= */}
      {/* 3. IN-HOUSE ACTIVE STAYS TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'in-house' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4">Room #</th>
                  <th className="py-2.5 px-4">Guest Information</th>
                  <th className="py-2.5 px-4">Category & Keycards</th>
                  <th className="py-2.5 px-4">Check-In / Exp. Out</th>
                  <th className="py-2.5 px-4 text-center">Stop Post</th>
                  <th className="py-2.5 px-4 text-right">Folio Balance</th>
                  <th className="py-2.5 px-4 text-center">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStays.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No active in-house guests matching your filter.
                    </td>
                  </tr>
                ) : (
                  filteredStays.map(s => {
                    const folio = db.folios.find(f => f.id === s.folioId);
                    return (
                      <tr key={s.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => onOpenRoomDetail(s.roomId)}
                            className="font-mono font-black text-blue-700 hover:underline bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg"
                          >
                            Room {s.roomNumber}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900 block">{s.guestName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">Stay: {s.stayNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-800 block">{s.roomTypeName}</span>
                          <span className="text-[10px] text-gray-500">{s.keyCardsIssued || 2} RFID Active Keys</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-mono text-[11px]">
                          <div>In: {s.checkInAt ? s.checkInAt.split('T')[0] : 'N/A'}</div>
                          <div>Out: {s.expectedCheckOutAt ? s.expectedCheckOutAt.split('T')[0] : 'N/A'}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenStopPostModal(s)}
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                              s.stopPost
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                            }`}
                            title={s.stopPost ? `Restricted: ${s.stopPostReason}` : 'Click to restrict outlet posting'}
                          >
                            {s.stopPost ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                            <span>{s.stopPost ? 'RESTRICTED' : 'Normal'}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {folio ? (
                            <span className={folio.balance <= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                              ৳{(folio.balance || 0).toLocaleString()}
                            </span>
                          ) : '৳0'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {/* Check out button anytime */}
                            <button
                              type="button"
                              onClick={() => onOpenCheckout(s.id)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs transition shadow-xs flex items-center space-x-1"
                              title="Check-Out In-House Guest Anytime"
                            >
                              <LogOut className="w-3 h-3" />
                              <span>Check-Out</span>
                            </button>

                            {/* View Folio */}
                            {folio && (
                              <button
                                type="button"
                                onClick={() => onOpenFolio(folio.id)}
                                className="p-1.5 text-gray-600 hover:text-blue-700 bg-gray-100 hover:bg-gray-200 rounded transition"
                                title="Guest Billing Folio"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Print Registration Card */}
                            <button
                              type="button"
                              onClick={() => onPrintRegCard(s)}
                              className="p-1.5 text-gray-600 hover:text-amber-700 bg-gray-100 hover:bg-gray-200 rounded transition"
                              title="Reprint Guest Registration Card (GRC)"
                            >
                              <Printer className="w-3.5 h-3.5" />
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
      )}

      {/* STOP POST MANAGEMENT MODAL */}
      {stopPostTargetStay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className={`p-4 text-white flex items-center justify-between ${
              stopPostTargetStay.stopPost ? 'bg-amber-600' : 'bg-slate-800'
            }`}>
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 rounded-lg">
                  {stopPostTargetStay.stopPost ? <ShieldAlert className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">
                    {stopPostTargetStay.stopPost ? 'Manage Stop Post Restriction' : 'Set Stop Post on Room'}
                  </h3>
                  <p className="text-[11px] text-white/80">
                    Room {stopPostTargetStay.roomNumber} — {stopPostTargetStay.guestName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStopPostTargetStay(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {stopPostActionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{stopPostActionSuccess}</span>
                </div>
              )}

              {/* Current Status Info Box */}
              <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                stopPostTargetStay.stopPost
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <Info className={`w-4 h-4 shrink-0 mt-0.5 ${stopPostTargetStay.stopPost ? 'text-amber-600' : 'text-slate-500'}`} />
                <div>
                  <span className="font-bold block">
                    {stopPostTargetStay.stopPost ? '⛔ STOP POST ACTIVE' : '✅ Standard Posting Allowed'}
                  </span>
                  <p className="text-[11px] mt-0.5 text-slate-600">
                    {stopPostTargetStay.stopPost
                      ? `Active restriction: "${stopPostTargetStay.stopPostReason || 'Restricted by Front Office'}". Outlet billing from Restaurant POS and In-Room Dining is blocked.`
                      : 'Activating Stop Post prevents all outlets (Restaurant POS, In-Room Dining, Minibar, Spa) from posting unpaid charges to this guest\'s room folio.'}
                  </p>
                </div>
              </div>

              {/* Reason Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Select Restriction Reason / Policy Preset *
                </label>
                <select
                  value={stopPostReasonPreset}
                  onChange={(e) => setStopPostReasonPreset(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="Credit Limit Exceeded — Direct Pay Only">Credit Limit Exceeded — Direct Pay Only</option>
                  <option value="Cash / MFS Only (No Card Pre-Auth on file)">Cash / MFS Only (No Card Pre-Auth on file)</option>
                  <option value="Guest Request — Block Outlet Charges to Room">Guest Request — Block Outlet Charges to Room</option>
                  <option value="Corporate Master Account — Settle Separately">Corporate Master Account — Settle Separately</option>
                  <option value="Pending Advance Deposit Clearance">Pending Advance Deposit Clearance</option>
                  <option value="Disputed Charges — Under FO Review">Disputed Charges — Under FO Review</option>
                  <option value="Checkout in Progress / Settlement Lock">Checkout in Progress / Settlement Lock</option>
                  <option value="Other">Other / Custom Reason</option>
                </select>
              </div>

              {/* Custom Notes / Specifics */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Additional Reason Details or Staff Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={stopPostCustomReason}
                  onChange={(e) => setStopPostCustomReason(e.target.value)}
                  placeholder="e.g. Guest requested cash payment for all dining; or deposit pending at bank."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 placeholder-slate-400"
                />
              </div>

              {/* Folio Preview Snapshot */}
              {(() => {
                const stayFolio = db.folios.find(f => f.id === stopPostTargetStay.folioId);
                return stayFolio ? (
                  <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div>
                      <span className="text-slate-500 font-mono text-[11px] block">{stayFolio.folioNumber}</span>
                      <span className="font-semibold text-slate-800">Total Billed: ৳{(stayFolio.grandTotal || 0).toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Current Balance</span>
                      <span className={`font-mono font-bold ${stayFolio.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ৳{(stayFolio.balance || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setStopPostTargetStay(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition text-xs"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {stopPostTargetStay.stopPost ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleConfirmStopPostToggle(true)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition text-xs shadow-xs"
                    >
                      Update Reason
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmStopPostToggle(false)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition flex items-center gap-1.5 text-xs shadow-xs"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlock / Allow Posting</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConfirmStopPostToggle(true)}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition flex items-center gap-1.5 text-xs shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Confirm Stop Post</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Arrival Cancellation Confirmation Modal */}
      {cancellingArrival && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-md w-full shadow-2xl space-y-3.5 text-xs text-gray-800">
            <div className="flex items-center space-x-2.5 text-rose-600">
              <XCircle className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-gray-900 text-sm">Cancel Arrival {cancellingArrival.reservationNumber}?</h4>
            </div>
            <p className="text-gray-600">
              Are you sure you want to cancel the scheduled arrival for <strong className="text-gray-900 font-semibold">{cancellingArrival.guestName}</strong>?
              The room will be released immediately and this booking will be removed from all upcoming check-in queues.
            </p>
            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Reason for Cancellation:</label>
              <input
                type="text"
                value={arrivalCancelReason}
                onChange={(e) => setArrivalCancelReason(e.target.value)}
                placeholder="e.g. Guest called to cancel, no-show"
                className="w-full bg-gray-50 border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 text-xs focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCancellingArrival(null)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded text-xs transition"
              >
                Keep Arrival
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelArrival}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs transition shadow-xs flex items-center space-x-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Confirm Cancellation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Front Desk Toast Notification */}
      {frontDeskToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{frontDeskToast}</span>
        </div>
      )}
    </div>
  );
};
