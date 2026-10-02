import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BedDouble, Search, Filter, Sparkles, Wrench, ShieldAlert,
  CheckCircle2, Clock, AlertTriangle, ArrowRight, UserCheck,
  PlusCircle, X, User, DollarSign, Calendar, LogIn,
  LogOut, RefreshCw, BarChart3, ChevronDown, Check, Star,
  Repeat, Building2, HelpCircle, Grid,
  Receipt, CreditCard, Utensils, FileText, ArrowRightLeft,
  Printer, Users, MoreHorizontal, ChevronRight, CheckSquare, ArrowUpRight
} from 'lucide-react';
import { Room, OperationalStatus, HousekeepingStatus, Folio } from '../../types/pms';
import { PmsDatabaseState } from '../../services/mockPmsDatabase';
import { pmsService } from '../../services/pmsService';
import { RoomActionModal, RoomActionTab } from './RoomActionModal';
import { IndividualBillingModal, IndividualBillingActionType } from './billing/IndividualBillingModal';

interface RoomStatusDashboardProps {
  db: PmsDatabaseState;
  onNavigate: (route: string) => void;
  onOpenCheckIn: (reservationId?: string) => void;
  onOpenQuickReservation: () => void;
  onSelectStay: (stayId: string) => void;
  onOpenCheckout?: (stayId?: string) => void;
  onSelectRoom: (roomId: string) => void;
  onOpenReportsMenu: () => void;
}

type GroupingType = 'room-no-wise' | 'floor-wise' | 'category-wise' | 'status-wise';

export const RoomStatusDashboard: React.FC<RoomStatusDashboardProps> = ({
  db,
  onNavigate,
  onOpenCheckIn,
  onOpenQuickReservation,
  onSelectStay,
  onOpenCheckout,
  onSelectRoom,
  onOpenReportsMenu
}) => {
  // Filters matching user's UX drawing
  const [groupingType, setGroupingType] = useState<GroupingType>('room-no-wise');
  const [roomNoInput, setRoomNoInput] = useState<string>('');
  const [countersCollapsed, setCountersCollapsed] = useState<boolean>(false);
  const [activeKpiFilter, setActiveKpiFilter] = useState<string | null>(null);
  const [selectedRoomForModal, setSelectedRoomForModal] = useState<Room | null>(null);
  const [selectedTabForModal, setSelectedTabForModal] = useState<RoomActionTab | undefined>(undefined);
  const [separatedBillingRoom, setSeparatedBillingRoom] = useState<Room | null>(null);
  const [separatedBillingAction, setSeparatedBillingAction] = useState<IndividualBillingActionType | null>(null);
  const [billingMenuRoomId, setBillingMenuRoomId] = useState<string | null>(null);
  const [billingMenuAnchor, setBillingMenuAnchor] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const [highlightedRoomId, setHighlightedRoomId] = useState<string | null>(null);
  const [roomHighlightStyle, setRoomHighlightStyle] = useState<'dark' | 'gold' | 'bordered'>('dark');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Close billing popover when clicking anywhere else or scrolling
  useEffect(() => {
    const handleGlobalClose = () => {
      setBillingMenuRoomId(null);
      setBillingMenuAnchor(null);
    };
    window.addEventListener('click', handleGlobalClose);
    window.addEventListener('scroll', handleGlobalClose, true);
    window.addEventListener('resize', handleGlobalClose);
    return () => {
      window.removeEventListener('click', handleGlobalClose);
      window.removeEventListener('scroll', handleGlobalClose, true);
      window.removeEventListener('resize', handleGlobalClose);
    };
  }, []);

  const getRoomTypeAbbr = (name: string) => {
    if (name.includes('Presidential')) return 'Presidential';
    if (name.includes('Royal')) return 'Royal Ste';
    if (name.includes('Honeymoon')) return 'Honeymoon';
    if (name.includes('Family')) return 'Family Dlx';
    if (name.includes('Deluxe')) return 'Deluxe';
    if (name.includes('Standard')) return 'Standard';
    return name;
  };

  const todayStr = db.settings?.currentBusinessDate || new Date().toISOString().split('T')[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Stays & Reservations map for quick lookup
  const activeStaysByRoom = useMemo(() => {
    const map = new Map<string, any>();
    for (const stay of db.stays || []) {
      if (stay.status === 'Active') {
        map.set(stay.roomNumber, stay);
        map.set(stay.roomId, stay);
      }
    }
    return map;
  }, [db.stays]);

  const reservationsByRoom = useMemo(() => {
    const map = new Map<string, any>();
    for (const res of db.reservations || []) {
      const isPending = res.status === 'Confirmed' || res.status === 'Unconfirmed' || (res.status as string) === 'Pending';
      if (isPending && (res.arrivalDate === todayStr || res.arrivalDate <= todayStr)) {
        if (res.assignedRoomNumber) {
          const numbers = res.assignedRoomNumber.split(',').map((s: string) => s.trim());
          for (const num of numbers) {
            if (num) map.set(num, res);
          }
        }
        if (res.assignedRoomId) {
          map.set(res.assignedRoomId, res);
        }
        if (Array.isArray(res.allocatedRooms)) {
          for (const alloc of res.allocatedRooms) {
            if (alloc.roomNumber) map.set(alloc.roomNumber, res);
            if (alloc.roomId) map.set(alloc.roomId, res);
          }
        }
      }
    }
    return map;
  }, [db.reservations, todayStr]);

  const allGuests = useMemo(() => {
    const map = new Map<string, any>();
    for (const g of db.guests || []) {
      map.set(g.id, g);
      map.set(g.fullName?.toLowerCase(), g);
    }
    return map;
  }, [db.guests]);

  const foliosByStayId = useMemo(() => {
    const map = new Map<string, Folio>();
    for (const f of db.folios || []) {
      map.set(f.stayId, f);
      if (f.id) map.set(f.id, f);
      if (f.roomNumber) map.set(`room-${f.roomNumber}`, f);
    }
    return map;
  }, [db.folios]);

  const openRoomAction = (room: Room, tab?: RoomActionTab, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setSelectedRoomForModal(room);
    setSelectedTabForModal(tab || 'overview');
    setBillingMenuRoomId(null);
    setBillingMenuAnchor(null);
  };

  const openSeparatedBilling = (room: Room, action: IndividualBillingActionType, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setBillingMenuRoomId(null);
    setBillingMenuAnchor(null);
    setSeparatedBillingRoom(room);
    setSeparatedBillingAction(action);
  };

  // Compute the exact 10 status counts matching the hand-drawn UX
  const statusKpis = useMemo(() => {
    const rooms = db.rooms || [];

    // 1. Vacant (Available & Clean or Inspected)
    const vacant = rooms.filter(
      r => (r.operationalStatus === 'Available' || r.operationalStatus === 'Inspected') &&
           (r.housekeepingStatus === 'Clean' || r.housekeepingStatus === 'Inspected')
    );

    // 2. Todays Checked In
    const todaysCheckedInStays = (db.stays || []).filter(
      s => s.checkInAt && s.checkInAt.startsWith(todayStr)
    );
    const todaysCheckedInCount = todaysCheckedInStays.length;

    // 3. Occupied
    const occupied = rooms.filter(r => r.operationalStatus === 'Occupied');

    // 4. Expected Departure (In-house with check-out today)
    const expectedDepartureRooms = rooms.filter(r => {
      const stay = activeStaysByRoom.get(r.roomNumber);
      return stay && stay.expectedCheckOutAt && stay.expectedCheckOutAt.startsWith(todayStr);
    });

    // 5. Vacant Dirty
    const vacantDirty = rooms.filter(
      r => r.operationalStatus !== 'Occupied' &&
           (r.operationalStatus === 'Dirty' || r.housekeepingStatus === 'Dirty')
    );

    // 6. Reserve / Reserved
    const reserve = rooms.filter(
      r => r.operationalStatus === 'Reserved' || reservationsByRoom.has(r.roomNumber)
    );

    // 7. Out of order (OOO)
    const outOfOrder = rooms.filter(r => r.operationalStatus === 'Out of Order');

    // 8. Back to Back (Departure today AND arriving reservation today for the same room)
    const backToBack = rooms.filter(r => {
      const isDeparting = activeStaysByRoom.has(r.roomNumber);
      const isArriving = reservationsByRoom.has(r.roomNumber);
      return (isDeparting && isArriving) || (r.notes && r.notes.toLowerCase().includes('back to back'));
    });

    // 9. Out of service (OOS / Blocked)
    const outOfService = rooms.filter(
      r => r.operationalStatus === 'Out of Service' || r.operationalStatus === 'Blocked'
    );

    // 10. VIP
    const vip = rooms.filter(r => {
      const stay = activeStaysByRoom.get(r.roomNumber);
      if (stay) {
        const guest = allGuests.get(stay.guestId) || allGuests.get(stay.guestName?.toLowerCase());
        return guest?.vipStatus === true || stay.vip === true;
      }
      return false;
    });

    return {
      vacantCount: vacant.length,
      todaysCheckedInCount,
      occupiedCount: occupied.length,
      expectedDepartureCount: expectedDepartureRooms.length,
      vacantDirtyCount: vacantDirty.length,
      reserveCount: reserve.length,
      outOfOrderCount: outOfOrder.length,
      backToBackCount: backToBack.length,
      outOfServiceCount: outOfService.length,
      vipCount: vip.length,
      // Store lists for filtering
      vacantIds: new Set(vacant.map(r => r.id)),
      occupiedIds: new Set(occupied.map(r => r.id)),
      expectedDepartureIds: new Set(expectedDepartureRooms.map(r => r.id)),
      vacantDirtyIds: new Set(vacantDirty.map(r => r.id)),
      reserveIds: new Set(reserve.map(r => r.id)),
      outOfOrderIds: new Set(outOfOrder.map(r => r.id)),
      backToBackIds: new Set(backToBack.map(r => r.id)),
      outOfServiceIds: new Set(outOfService.map(r => r.id)),
      vipIds: new Set(vip.map(r => r.id))
    };
  }, [db.rooms, db.stays, db.reservations, activeStaysByRoom, reservationsByRoom, allGuests, todayStr]);

  // Handler for Room No: View Status button
  const handleViewStatusByRoomNo = () => {
    if (!roomNoInput.trim()) {
      showToast('Please enter a Room Number (e.g. 101, 102, 1001)');
      return;
    }

    const cleanInput = roomNoInput.trim().toLowerCase();
    const foundRoom = (db.rooms || []).find(
      r => r.roomNumber.toLowerCase() === cleanInput || r.id.toLowerCase() === cleanInput
    );

    if (foundRoom) {
      setHighlightedRoomId(foundRoom.id);
      setSelectedRoomForModal(foundRoom);

      // Scroll into view if element exists
      const el = document.getElementById(`room-card-${foundRoom.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      showToast(`Located Room ${foundRoom.roomNumber} (${foundRoom.operationalStatus})`);
    } else {
      showToast(`Room "${roomNoInput}" not found. Available rooms: 101-108, 201-208, 301-306, 401-403, 1001-1005`);
    }
  };

  // Filtered rooms based on active KPI filter or search
  const filteredRooms = useMemo(() => {
    let list = [...(db.rooms || [])];

    // Filter by KPI card if selected
    if (activeKpiFilter) {
      switch (activeKpiFilter) {
        case 'vacant':
          list = list.filter(r => statusKpis.vacantIds.has(r.id));
          break;
        case 'todays-checked-in':
          list = list.filter(r => {
            const stay = activeStaysByRoom.get(r.roomNumber);
            return stay !== undefined;
          });
          break;
        case 'occupied':
          list = list.filter(r => statusKpis.occupiedIds.has(r.id));
          break;
        case 'expected-departure':
          list = list.filter(r => statusKpis.expectedDepartureIds.has(r.id));
          break;
        case 'vacant-dirty':
          list = list.filter(r => statusKpis.vacantDirtyIds.has(r.id));
          break;
        case 'reserve':
          list = list.filter(r => statusKpis.reserveIds.has(r.id));
          break;
        case 'out-of-order':
          list = list.filter(r => statusKpis.outOfOrderIds.has(r.id));
          break;
        case 'back-to-back':
          list = list.filter(r => statusKpis.backToBackIds.has(r.id));
          break;
        case 'out-of-service':
          list = list.filter(r => statusKpis.outOfServiceIds.has(r.id));
          break;
        case 'vip':
          list = list.filter(r => statusKpis.vipIds.has(r.id));
          break;
        default:
          break;
      }
    }

    // Secondary search filter if user typed in search box
    if (roomNoInput.trim()) {
      const q = roomNoInput.trim().toLowerCase();
      list = list.filter(
        r => r.roomNumber.toLowerCase().includes(q) ||
             (r.roomTypeName || '').toLowerCase().includes(q)
      );
    }

    // Sort room-no-wise by numerical room number
    list.sort((a, b) => {
      const numA = parseInt(a.roomNumber.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.roomNumber.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    return list;
  }, [db.rooms, activeKpiFilter, statusKpis, roomNoInput, activeStaysByRoom]);

  // Grouping structure according to groupingType
  const groupedRooms = useMemo(() => {
    if (groupingType === 'floor-wise') {
      const groups: Record<string, Room[]> = {};
      filteredRooms.forEach(room => {
        const floorKey = `Floor ${room.floor}`;
        if (!groups[floorKey]) groups[floorKey] = [];
        groups[floorKey].push(room);
      });
      return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
    }

    if (groupingType === 'category-wise') {
      const groups: Record<string, Room[]> = {};
      filteredRooms.forEach(room => {
        const catKey = room.roomTypeName || 'Standard Room';
        if (!groups[catKey]) groups[catKey] = [];
        groups[catKey].push(room);
      });
      return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }

    if (groupingType === 'status-wise') {
      const groups: Record<string, Room[]> = {};
      filteredRooms.forEach(room => {
        const statusKey = room.operationalStatus;
        if (!groups[statusKey]) groups[statusKey] = [];
        groups[statusKey].push(room);
      });
      return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }

    // Default: 'room-no-wise' (single flattened list)
    return [['All Rooms', filteredRooms]] as [string, Room[]][];
  }, [filteredRooms, groupingType]);

  // Format guest name nicely so titles like Dr., Engr., Md. include the surname instead of cut-off
  const formatDisplayGuestName = (name: string) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length <= 1) return parts[0];
    const titleRegex = /^(dr\.?|engr\.?|mr\.?|mrs\.?|ms\.?|prof\.?|md\.?)$/i;
    if (titleRegex.test(parts[0]) && parts.length > 1) {
      return `${parts[0]} ${parts[1]}`;
    }
    return parts[0];
  };

  // Helper for status badge colors & styles with deeper color combinations & high-contrast visibility
  const getRoomCardStyle = (room: Room) => {
    const isOccupied = room.operationalStatus === 'Occupied';
    const isDirty = room.housekeepingStatus === 'Dirty' || room.operationalStatus === 'Dirty';
    const isReserved = room.operationalStatus === 'Reserved' || reservationsByRoom.has(room.roomNumber);
    const isOOO = room.operationalStatus === 'Out of Order';
    const isOOS = room.operationalStatus === 'Out of Service' || room.operationalStatus === 'Blocked';
    const isCleaning = room.operationalStatus === 'Cleaning' || room.housekeepingStatus === 'Cleaning';

    if (isOOO) {
      return {
        bg: 'bg-slate-950 border-2 border-red-500 hover:border-red-400 shadow-md',
        numberColor: 'text-white font-black',
        numberBadge: 'bg-red-950 text-white border-2 border-red-500 font-black shadow-xs ring-1 ring-red-400/40',
        typeColor: 'text-slate-200 font-bold',
        floorColor: 'text-slate-300 font-mono font-bold',
        floorBadge: 'bg-slate-800 text-slate-200 border border-slate-700 font-bold',
        dividerColor: 'border-red-500/40',
        statusNoteColor: 'text-red-300 font-black',
        badgeBg: 'bg-red-600 text-white font-black border border-red-400 shadow-xs',
        shortLabel: 'OOO',
        label: 'OUT OF ORDER',
        fullLabel: 'Out of Order (Maintenance Defect)',
        dot: 'bg-red-500',
        actionBorder: 'border-slate-800'
      };
    }
    if (isOOS) {
      return {
        bg: 'bg-zinc-900 border-2 border-zinc-500 hover:border-zinc-400 shadow-md',
        numberColor: 'text-white font-black',
        numberBadge: 'bg-zinc-950 text-white border-2 border-zinc-500 font-black shadow-xs ring-1 ring-zinc-400/40',
        typeColor: 'text-zinc-200 font-bold',
        floorColor: 'text-zinc-300 font-mono font-bold',
        floorBadge: 'bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold',
        dividerColor: 'border-zinc-700',
        statusNoteColor: 'text-zinc-300 font-black',
        badgeBg: 'bg-zinc-600 text-white font-black border border-zinc-400 shadow-xs',
        shortLabel: 'OOS',
        label: 'OUT OF SERVICE',
        fullLabel: 'Out of Service (Soft Block / Hold)',
        dot: 'bg-zinc-400',
        actionBorder: 'border-zinc-800'
      };
    }
    if (isOccupied) {
      return {
        bg: 'bg-blue-100/95 border-2 border-blue-600 hover:border-blue-800 shadow-sm',
        numberColor: 'text-slate-950 font-black',
        numberBadge: 'bg-slate-950 text-white border-2 border-slate-700 font-black shadow-xs ring-1 ring-black/30',
        typeColor: 'text-blue-900 font-bold',
        floorColor: 'text-blue-800 font-mono font-bold',
        floorBadge: 'bg-blue-200/80 text-blue-900 border border-blue-300/80 font-bold',
        dividerColor: 'border-blue-300',
        statusNoteColor: 'text-blue-950 font-black',
        badgeBg: 'bg-blue-700 text-white font-black shadow-xs ring-1 ring-blue-500',
        shortLabel: 'OCC',
        label: 'OCCUPIED',
        fullLabel: 'Occupied (In-House Guest)',
        dot: 'bg-blue-700',
        actionBorder: 'border-blue-300'
      };
    }
    if (isDirty) {
      return {
        bg: 'bg-rose-100/95 border-2 border-rose-600 hover:border-rose-800 shadow-sm',
        numberColor: 'text-slate-950 font-black',
        numberBadge: 'bg-slate-950 text-white border-2 border-slate-700 font-black shadow-xs ring-1 ring-black/30',
        typeColor: 'text-rose-900 font-bold',
        floorColor: 'text-rose-800 font-mono font-bold',
        floorBadge: 'bg-rose-200/80 text-rose-900 border border-rose-300/80 font-bold',
        dividerColor: 'border-rose-300',
        statusNoteColor: 'text-rose-950 font-black',
        badgeBg: 'bg-rose-700 text-white font-black shadow-xs ring-1 ring-rose-500',
        shortLabel: 'DIRTY',
        label: 'VACANT DIRTY',
        fullLabel: 'Vacant Dirty (Needs Turnover)',
        dot: 'bg-rose-700',
        actionBorder: 'border-rose-300'
      };
    }
    if (isCleaning) {
      return {
        bg: 'bg-purple-100/95 border-2 border-purple-600 hover:border-purple-800 shadow-sm',
        numberColor: 'text-slate-950 font-black',
        numberBadge: 'bg-slate-950 text-white border-2 border-slate-700 font-black shadow-xs ring-1 ring-black/30',
        typeColor: 'text-purple-900 font-bold',
        floorColor: 'text-purple-800 font-mono font-bold',
        floorBadge: 'bg-purple-200/80 text-purple-900 border border-purple-300/80 font-bold',
        dividerColor: 'border-purple-300',
        statusNoteColor: 'text-purple-950 font-black',
        badgeBg: 'bg-purple-700 text-white font-black shadow-xs ring-1 ring-purple-500',
        shortLabel: 'CLEAN',
        label: 'CLEANING',
        fullLabel: 'Cleaning in Progress',
        dot: 'bg-purple-700',
        actionBorder: 'border-purple-300'
      };
    }
    if (isReserved) {
      return {
        bg: 'bg-amber-100/95 border-2 border-amber-600 hover:border-amber-800 shadow-sm',
        numberColor: 'text-slate-950 font-black',
        numberBadge: 'bg-slate-950 text-white border-2 border-slate-700 font-black shadow-xs ring-1 ring-black/30',
        typeColor: 'text-amber-900 font-bold',
        floorColor: 'text-amber-800 font-mono font-bold',
        floorBadge: 'bg-amber-200/80 text-amber-900 border border-amber-300/80 font-bold',
        dividerColor: 'border-amber-300',
        statusNoteColor: 'text-amber-950 font-black',
        badgeBg: 'bg-amber-600 text-white font-black shadow-xs ring-1 ring-amber-500',
        shortLabel: 'RES',
        label: 'RESERVED',
        fullLabel: 'Reserved (Arriving Today)',
        dot: 'bg-amber-600',
        actionBorder: 'border-amber-300'
      };
    }
    // Vacant Clean
    return {
      bg: 'bg-emerald-100/95 border-2 border-emerald-600 hover:border-emerald-800 shadow-sm',
      numberColor: 'text-slate-950 font-black',
      numberBadge: 'bg-slate-950 text-white border-2 border-slate-700 font-black shadow-xs ring-1 ring-black/30',
      typeColor: 'text-emerald-900 font-bold',
      floorColor: 'text-emerald-800 font-mono font-bold',
      floorBadge: 'bg-emerald-200/80 text-emerald-900 border border-emerald-300/80 font-bold',
      dividerColor: 'border-emerald-300',
      statusNoteColor: 'text-emerald-950 font-black',
      badgeBg: 'bg-emerald-700 text-white font-black shadow-xs ring-1 ring-emerald-500',
      shortLabel: 'VACANT',
      label: 'VACANT CLEAN',
      fullLabel: 'Vacant Clean (Ready for Sale)',
      dot: 'bg-emerald-700',
      actionBorder: 'border-emerald-300'
    };
  };

  return (
    <div className="space-y-2 text-gray-900 select-none">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center space-x-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* ULTRA-COMPACT TOP HEADER: ROOM STATUS INFORMATION + QUICK REPORTS MENU */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight flex items-center space-x-1.5">
            <span>Room Status Information</span>
          </h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
            Live Synced
          </span>
          <span className="text-[11px] text-gray-500 hidden md:inline-block font-medium">
            • {(db.rooms || []).length} {(db.rooms || []).length === 1 ? 'Room' : 'Rooms'} Rack
          </span>
        </div>

        {/* Action Controls: Compact quick action buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={onOpenReportsMenu}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-900 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs hover:shadow transition-all border border-slate-700 cursor-pointer"
            title="Open Quick Menu: Front Desk Reports (In-House, Occupancy, Reservations, Arrivals, Departures)"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-300" />
            <span>Quick Reports</span>
            <span className="bg-blue-500/30 text-blue-200 text-[10px] font-mono px-1 py-0.2 rounded font-bold border border-blue-400/30">
              5
            </span>
          </button>

          <button
            onClick={onOpenQuickReservation}
            className="flex items-center space-x-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Reservation</span>
          </button>

          <button
            onClick={() => onOpenCheckIn()}
            className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-600" />
            <span>Walk-In</span>
          </button>

          <button
            onClick={() => (onOpenCheckout ? onOpenCheckout() : onSelectStay(''))}
            className="flex items-center space-x-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Front Office Guest Check-Out (Anytime check-out & folio settlement)"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Check-Out</span>
          </button>
        </div>
      </div>

      {/* ULTRA-COMPACT FILTER & QUICK FINDER BAR */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Status type : Room Nowise dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-gray-700 whitespace-nowrap">
            Status type :
          </label>
          <div className="relative">
            <select
              value={groupingType}
              onChange={e => setGroupingType(e.target.value as GroupingType)}
              className="appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg pl-2.5 pr-7 py-1 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
            >
              <option value="room-no-wise">Room No wise</option>
              <option value="floor-wise">Floor wise</option>
              <option value="category-wise">Category wise</option>
              <option value="status-wise">Status wise</option>
            </select>
            <ChevronDown className="w-3 h-3 text-gray-500 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Middle: Mini Rack & Room Number Highlight Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white text-blue-700 shadow-xs border border-gray-200 rounded-lg text-xs font-bold">
            <Grid className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Mini Rack</span>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
            <span className="px-1.5 py-0.5 text-slate-700 flex items-center gap-1 font-black">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Highlight:</span>
            </span>
            <button
              type="button"
              onClick={() => setRoomHighlightStyle('dark')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                roomHighlightStyle === 'dark'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 font-bold'
              }`}
              title="Solid Dark High-Contrast Room Numbers"
            >
              Dark Badge
            </button>
            <button
              type="button"
              onClick={() => setRoomHighlightStyle('gold')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                roomHighlightStyle === 'gold'
                  ? 'bg-amber-400 text-amber-950 font-black shadow-xs ring-1 ring-amber-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 font-bold'
              }`}
              title="Vivid Amber/Gold Highlighted Room Numbers"
            >
              Gold Highlight
            </button>
            <button
              type="button"
              onClick={() => setRoomHighlightStyle('bordered')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                roomHighlightStyle === 'bordered'
                  ? 'bg-white text-slate-950 font-black shadow-xs border border-slate-900 ring-1 ring-black/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 font-bold'
              }`}
              title="Prominent White Box with Bold Border"
            >
              White Box
            </button>
          </div>
        </div>

        {/* Right: Room No: View Status Input & Button */}
        <div className="flex items-center space-x-1.5">
          <label className="text-xs font-bold text-gray-700 whitespace-nowrap">
            Room No:
          </label>
          <div className="relative w-32 sm:w-40">
            <input
              type="text"
              value={roomNoInput}
              onChange={e => setRoomNoInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleViewStatusByRoomNo()}
              placeholder="e.g. 101, 1001..."
              className="w-full px-2.5 py-1 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {roomNoInput && (
              <button
                onClick={() => setRoomNoInput('')}
                className="absolute right-1.5 top-1.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={handleViewStatusByRoomNo}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            View Status
          </button>
        </div>
      </div>

      {/* ULTRA-COMPACT 10 OPERATIONAL ROOM STATUS COUNTERS */}
      <div className="bg-white rounded-xl border-2 border-slate-300 shadow-xs px-2.5 py-1.5">
        <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>Operational Room Status Counters (Click to filter rooms)</span>
            {activeKpiFilter && (
              <button
                onClick={() => setActiveKpiFilter(null)}
                className="text-[10px] text-blue-700 font-black hover:underline flex items-center space-x-1 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Reset ({db.rooms?.length})</span>
              </button>
            )}
          </div>
          <button
            onClick={() => setCountersCollapsed(!countersCollapsed)}
            className="text-[10px] text-slate-600 hover:text-slate-900 font-bold px-2 py-0.5 rounded hover:bg-slate-100 transition-colors flex items-center space-x-1 cursor-pointer"
            title={countersCollapsed ? 'Expand status counters' : 'Collapse status counters to maximize room grid space'}
          >
            <span>{countersCollapsed ? '+ Show Counters' : '− Compact / Hide'}</span>
          </button>
        </div>

        {!countersCollapsed && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 2xl:grid-cols-10 gap-1.5">
            {/* 1. Vacant [ 71 ] */}
            <div
              onClick={() => setActiveKpiFilter(activeKpiFilter === 'vacant' ? null : 'vacant')}
              className={`cursor-pointer px-2 py-1 rounded-lg border-2 transition-all flex items-center justify-between h-[36px] ${
                activeKpiFilter === 'vacant'
                  ? 'bg-emerald-200 border-emerald-700 ring-2 ring-emerald-600/50 shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-600 shadow-2xs'
              }`}
              title="Vacant • Ready for Sale"
            >
              <div className="flex items-center space-x-1 min-w-0 pr-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="text-[11px] font-black text-emerald-950 truncate">Vacant</span>
              </div>
              <span className="px-1.5 py-0.5 min-w-[24px] text-center rounded-md bg-emerald-700 text-white font-mono font-black text-xs shrink-0 shadow-2xs">
                {String(statusKpis.vacantCount).padStart(2, '0')}
              </span>
            </div>

            {/* 2. Todays Checked In [ 08 ] */}
            <div
              onClick={() => setActiveKpiFilter(activeKpiFilter === 'todays-checked-in' ? null : 'todays-checked-in')}
              className={`cursor-pointer px-2 py-1 rounded-lg border-2 transition-all flex items-center justify-between h-[36px] ${
                activeKpiFilter === 'todays-checked-in'
                  ? 'bg-blue-200 border-blue-700 ring-2 ring-blue-600/50 shadow-xs'
                  : 'bg-blue-50 hover:bg-blue-100 border-blue-600 shadow-2xs'
              }`}
              title="Todays Checked In • Arrival Registry"
            >
              <div className="flex items-center space-x-1 min-w-0 pr-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span className="text-[11px] font-black text-blue-950 truncate">Checked In</span>
              </div>
              <span className="px-1.5 py-0.5 min-w-[24px] text-center rounded-md bg-blue-700 text-white font-mono font-black text-xs shrink-0 shadow-2xs">
                {String(statusKpis.todaysCheckedInCount).padStart(2, '0')}
              </span>
            </div>

            {/* 3. Occupied [ 22 ] */}
            <div
              onClick={() => setActiveKpiFilter(activeKpiFilter === 'occupied' ? null : 'occupied')}
              className={`cursor-pointer px-2 py-1 rounded-lg border-2 transition-all flex items-center justify-between h-[36px] ${
                activeKpiFilter === 'occupied'
                  ? 'bg-indigo-200 border-indigo-700 ring-2 ring-indigo-600/50 shadow-xs'
                  : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-600 shadow-2xs'
              }`}
              title="Occupied • In-House Guests"
            >
              <div className="flex items-center space-x-1 min-w-0 pr-1">
                <BedDouble className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                <span className="text-[11px] font-black text-indigo-950 truncate">Occupied</span>
              </div>
              <span className="px-1.5 py-0.5 min-w-[24px] text-center rounded-md bg-indigo-700 text-white font-mono font-black text-xs shrink-0 shadow-2xs">
                {String(statusKpis.occupiedCount).padStart(2, '0')}
              </span>
            </div>

            {/* 4. Expected Departure [ 00 ] */}
            <div
              onClick={() => setActiveKpiFilter(activeKpiFilter === 'expected-departure' ? null : 'expected-departure')}
              className={`cursor-pointer px-2 py-1 rounded-lg border-2 transition-all flex items-center justify-between h-[36px] ${
                activeKpiFilter === 'expected-departure'
                  ? 'bg-amber-200 border-amber-700 ring-2 ring-amber-600/50 shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-600 shadow-2xs'
              }`}
              title="Expected Departure • Due Out Today"
            >
              <div className="flex items-center space-x-1 min-w-0 pr-1">
                <LogOut className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="text-[11px] font-black text-amber-950 truncate">Exp Dep</span>
              </div>
              <span className="px-1.5 py-0.5 min-w-[24px] text-center rounded-md bg-amber-700 text-white font-mono font-black text-xs shrink-0 shadow-2xs">
                {String(statusKpis.expectedDepartureCount).padStart(2, '0')}
              </span>
            </div>

            {/* 5. Vacant Dirty [ 08 ] */}
            <div
              onClick={() => setActiveKpiFilter(activeKpiFilter === 'vacant-dirty' ? null : 'vacant-dirty')}
              className={`cursor-pointer px-2 py-1 rounded-lg border-2 transition-all flex items-center justify-between h-[36px] ${
                activeKpiFilter === 'vacant-dirty'
                  ? 'bg-rose-200 border-rose-700 ring-2 ring-rose-600/50 shadow-xs'
                  : 'bg-rose-50 hover:bg-rose-100 border-rose-600 shadow-2xs'
              }`}
              title="Vacant Dirty • Needs Turnover"
            >
              <div className="flex items-center space-x-1 min-w-0 pr-1">
                <Sparkles className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                <span className="text-[11px] font-black text-rose-950 truncate">Vacant Dirty</span>
              </div>
              <span className="px-1.5 py-0.5 min-w-[24px] text-center rounded-md bg-rose-700 text-white font-mono font-black text-xs shrink-0 shadow-2xs">
                {String(statusKpis.vacantDirtyCount).padStart(2, '0')}
              </span>
            </div>

            {/* 6. Reserve [ 11 ] */}
            <div
              onClick={() => setActiveKpiFilter(activeKpiFilter === 'reserve' ? null : 'reserve')}
              className={`cursor-pointer px-2 py-1 rounded-lg border-2 transition-all flex items-center justify-between h-[36px] ${
                activeKpiFilter === 'reserve'
                  ? 'bg-orange-200 border-orange-700 ring-2 ring-orange-600/50 shadow-xs'
                  : 'bg-orange-50 hover:bg-orange-100 border-orange-600 shadow-2xs'
              }`}
              title="Reserve • Confirmed Arrive"
            >
              <div className="flex items-center space-x-1 min-w-0 pr-1">
                <Calendar className="w-3.5 h-3.5 text-orange-700 shrink-0" />
                <span className="text-[11px] font-black text-orange-950 truncate">Reserve</span>
              </div>
              <span className="px-1.5 py-0.5 min-w-[24px] text-center rounded-md bg-orange-700 text-white font-mono font-black text-xs shrink-0 shadow-2xs">
                {String(statusKpis.reserveCount).padStart(2, '0')}
              </span>
            </div>

            {/* 7. Out of order [ 02 ] */}
            <div
              onClick={() => setActiveKpiFilter(activeKpiFilter === 'out-of-order' ? null : 'out-of-order')}
              className={`cursor-pointer px-2 py-1 rounded-lg border-2 transition-all flex items-center justify-between h-[36px] ${
                activeKpiFilter === 'out-of-order'
                  ? 'bg-slate-950 border-red-500 ring-2 ring-red-500/50 shadow-xs text-white'
                  : 'bg-slate-900 hover:bg-slate-850 border-red-500 text-white shadow-2xs'
              }`}
              title="Out of order • Maintenance Defect"
            >
              <div className="flex items-center space-x-1 min-w-0 pr-1">
                <Wrench className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-[11px] font-black text-white truncate">OOO</span>
              </div>
              <span className="px-1.5 py-0.5 min-w-[24px] text-center rounded-md bg-red-600 text-white font-mono font-black text-xs shrink-0 shadow-2xs">
                {String(statusKpis.outOfOrderCount).padStart(2, '0')}
              </span>
            </div>

            {/* 8. Back to Back [ 01 ] */}
            <div
              onClick={() => setActiveKpiFilter(activeKpiFilter === 'back-to-back' ? null : 'back-to-back')}
              className={`cursor-pointer px-2 py-1 rounded-lg border-2 transition-all flex items-center justify-between h-[36px] ${
                activeKpiFilter === 'back-to-back'
                  ? 'bg-fuchsia-200 border-fuchsia-700 ring-2 ring-fuchsia-600/50 shadow-xs'
                  : 'bg-fuchsia-50 hover:bg-fuchsia-100 border-fuchsia-600 shadow-2xs'
              }`}
              title="Back to Back (B2B) • Dep & Arr Same Day (Turnover Priority)"
            >
              <div className="flex items-center space-x-1 min-w-0 pr-1">
                <Repeat className="w-3.5 h-3.5 text-fuchsia-700 shrink-0" />
                <span className="text-[11px] font-black text-fuchsia-950 truncate">Back-to-Back</span>
              </div>
              <span className="px-1.5 py-0.5 min-w-[24px] text-center rounded-md bg-fuchsia-700 text-white font-mono font-black text-xs shrink-0 shadow-2xs">
                {String(statusKpis.backToBackCount).padStart(2, '0')}
              </span>
            </div>

            {/* 9. Out of service [ 01 ] */}
            <div
              onClick={() => setActiveKpiFilter(activeKpiFilter === 'out-of-service' ? null : 'out-of-service')}
              className={`cursor-pointer px-2 py-1 rounded-lg border-2 transition-all flex items-center justify-between h-[36px] ${
                activeKpiFilter === 'out-of-service'
                  ? 'bg-zinc-950 border-zinc-500 ring-2 ring-zinc-500/50 shadow-xs text-white'
                  : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-500 text-white shadow-2xs'
              }`}
              title="Out of service • Soft Block / Hold"
            >
              <div className="flex items-center space-x-1 min-w-0 pr-1">
                <ShieldAlert className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="text-[11px] font-black text-white truncate">OOS</span>
              </div>
              <span className="px-1.5 py-0.5 min-w-[24px] text-center rounded-md bg-zinc-600 text-white font-mono font-black text-xs shrink-0 shadow-2xs">
                {String(statusKpis.outOfServiceCount).padStart(2, '0')}
              </span>
            </div>

            {/* 10. VIP [ 04 ] */}
            <div
              onClick={() => setActiveKpiFilter(activeKpiFilter === 'vip' ? null : 'vip')}
              className={`cursor-pointer px-2 py-1 rounded-lg border-2 transition-all flex items-center justify-between h-[36px] ${
                activeKpiFilter === 'vip'
                  ? 'bg-purple-200 border-purple-700 ring-2 ring-purple-600/50 shadow-xs'
                  : 'bg-purple-50 hover:bg-purple-100 border-purple-600 shadow-2xs'
              }`}
              title="VIP • Special Care"
            >
              <div className="flex items-center space-x-1 min-w-0 pr-1">
                <Star className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                <span className="text-[11px] font-black text-purple-950 truncate">VIP</span>
              </div>
              <span className="px-1.5 py-0.5 min-w-[24px] text-center rounded-md bg-purple-700 text-white font-mono font-black text-xs shrink-0 shadow-2xs">
                {String(statusKpis.vipCount).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ULTRA-COMPACT SECTION HEADER & LEGEND PILLS */}
      <div className="bg-slate-900 text-white rounded-xl px-3 py-1.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <BedDouble className="w-4 h-4 text-blue-400" />
          <div className="flex items-center space-x-2">
            <h2 className="text-xs sm:text-sm font-black tracking-wide">
              Status (vacant, Dirty, Occupied, Reserved) Room No: Here
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              ({filteredRooms.length} rooms • {groupingType})
            </span>
            {activeKpiFilter && (
              <span className="bg-blue-500/30 text-blue-200 px-1.5 py-0.2 rounded border border-blue-400/30 text-[10px] font-bold">
                Filter: {activeKpiFilter}
              </span>
            )}
          </div>
        </div>

        {/* Legend color pills with high saturated colors */}
        <div className="flex items-center flex-wrap gap-1.5 text-[10px] font-black">
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-700 text-white shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            <span>Vacant Clean</span>
          </span>
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-700 text-white shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            <span>Occupied</span>
          </span>
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-700 text-white shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            <span>Vacant Dirty</span>
          </span>
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-600 text-white shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            <span>Reserved</span>
          </span>
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-fuchsia-700 text-white shadow-2xs border border-fuchsia-500">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            <span>Back-to-Back</span>
          </span>
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-red-600 text-white shadow-2xs border border-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            <span>Out of Order</span>
          </span>
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-zinc-600 text-white shadow-2xs border border-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            <span>Out of Service</span>
          </span>
        </div>
      </div>

      {/* THE ROOM GRID AS DRAWN: (Room tiles with room numbers like 1001, 1002, 1003, 101, 102...) */}
      <div className="space-y-6">
        {filteredRooms.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <BedDouble className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {(db.rooms || []).length === 0 ? 'No Rooms Added Yet' : 'No Rooms Found for This Filter'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {(db.rooms || []).length === 0
                ? 'No rooms have been added to the system yet. Add rooms from Room Management or the Master Setup module to display them on the live rack.'
                : activeKpiFilter
                ? `No rooms currently match the "${activeKpiFilter}" operational status.`
                : 'No rooms match your current room search filter.'}
            </p>
            {activeKpiFilter && (
              <button
                type="button"
                onClick={() => setActiveKpiFilter(null)}
                className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Filter ({(db.rooms || []).length} Rooms)</span>
              </button>
            )}
          </div>
        ) : (
          groupedRooms.map(([groupTitle, roomsInGroup]) => (
            <div key={groupTitle} className="space-y-2.5">
            {groupingType !== 'room-no-wise' && (
              <div className="flex items-center space-x-2 pt-2 border-b-2 border-slate-300 pb-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  {groupTitle}
                </span>
                <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                  {roomsInGroup.length} Rooms
                </span>
              </div>
            )}

            <div className="grid grid-cols-[repeat(auto-fill,minmax(78px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(90px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(98px,1fr))] gap-1.5">
              {roomsInGroup.map(room => {
                const style = getRoomCardStyle(room);
                const stay = activeStaysByRoom.get(room.roomNumber);
                const folio = stay ? (foliosByStayId.get(stay.id) || (db.folios || []).find(f => f.stayId === stay.id || f.id === stay.folioId)) : undefined;
                const reservation = reservationsByRoom.get(room.roomNumber) || reservationsByRoom.get(room.id);
                const isHighlighted = highlightedRoomId === room.id;
                const isDueOut = stay && stay.expectedCheckOutAt && stay.expectedCheckOutAt.startsWith(todayStr);
                const isVip = (stay && stay.vip) || (stay && allGuests.get(stay.guestId)?.vipStatus);
                const isSearchMatch = Boolean(
                  roomNoInput.trim().length > 0 &&
                  room.roomNumber.toLowerCase().includes(roomNoInput.trim().toLowerCase())
                );

                // MINI RACK VIEW (SMALL COMPACT HIGH-DENSITY BOXES WITH HIGHLIGHTED STATUS)
                return (
                    <div
                      key={room.id}
                      id={`room-card-${room.id}`}
                      onClick={() => openRoomAction(room, 'overview')}
                      title={`Room ${room.roomNumber} (${room.roomTypeName})\nStatus: ${style.fullLabel}\nFloor: ${room.floor}${stay ? `\nIn-House: ${stay.guestName}` : ''}${reservation ? `\nReserved: ${reservation.guestName}` : ''}\nClick to open Front Desk management & billing`}
                      className={`rounded-lg border-2 p-1.5 flex flex-col justify-between transition-all cursor-pointer relative h-[72px] sm:h-[76px] ${
                        style.bg
                      } ${
                        isHighlighted
                          ? 'ring-4 ring-blue-500 scale-105 shadow-md z-10 animate-pulse'
                          : isSearchMatch
                          ? 'ring-3 ring-amber-500 shadow-md scale-[1.03] z-10 border-amber-500'
                          : 'hover:shadow-sm hover:scale-[1.03]'
                      }`}
                    >
                      {/* Top Header Row: Room Number, VIP, Billing Quick Icon, Floor */}
                      <div className="flex items-center justify-between gap-1 leading-none">
                        <div className="flex items-center space-x-1 shrink-0">
                          <span className={`px-2 py-0.5 rounded-md font-mono font-black text-xs sm:text-[13.5px] tracking-tight leading-none shadow-xs border transition-all ${
                            isSearchMatch
                              ? 'bg-amber-300 text-amber-950 border-2 border-amber-600 ring-2 ring-amber-400 font-black scale-110 shadow-md animate-pulse'
                              : roomHighlightStyle === 'gold'
                              ? 'bg-amber-300 text-amber-950 border-2 border-amber-600 font-black shadow-xs ring-1 ring-amber-400/50'
                              : roomHighlightStyle === 'bordered'
                              ? 'bg-white text-slate-950 border-2 border-slate-900 font-black shadow-xs ring-1 ring-black/10'
                              : style.numberBadge
                          }`}>
                            {room.roomNumber}
                          </span>
                          {isVip && <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />}
                        </div>
                        <div className="flex items-center space-x-1">
                          {stay && (
                            <div className="flex items-center space-x-0.5">
                              <button
                                type="button"
                                title="Check-Out Guest & Settle Folio"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onOpenCheckout) onOpenCheckout(stay.id);
                                  else onSelectStay(stay.id);
                                }}
                                className="p-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white shrink-0 shadow-xs cursor-pointer"
                              >
                                <LogOut className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                title="Quick Bill Payment"
                                onClick={(e) => openRoomAction(room, 'payment', e)}
                                className="p-0.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white shrink-0 shadow-xs cursor-pointer"
                              >
                                <CreditCard className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                          <span className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded border ${style.floorBadge}`}>
                            F{room.floor}
                          </span>
                        </div>
                      </div>

                      {/* BIG HIGHLIGHTED ROOM STATUS (VACANT, OCC, CLEAN, DIRTY, OOO, OOS, RES) */}
                      <div className={`w-full py-1 px-1 rounded text-center font-black text-[11px] tracking-wider uppercase shadow-xs flex items-center justify-center space-x-1 leading-tight ${style.badgeBg}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0"></span>
                        <span className="truncate">{style.shortLabel}</span>
                      </div>

                      {/* Bottom Row: Guest Surname or Quick Note */}
                      <div className={`pt-0.5 border-t ${style.dividerColor} flex items-center justify-between text-[9px] font-black leading-none truncate`}>
                        {stay ? (
                          <span className={`truncate ${style.statusNoteColor}`} title={`In-House: ${stay.guestName}`}>
                            {formatDisplayGuestName(stay.guestName)}
                          </span>
                        ) : reservation ? (
                          <span className={`truncate ${style.statusNoteColor}`} title={`Reserved: ${reservation.guestName}`}>
                            {formatDisplayGuestName(reservation.guestName)}
                          </span>
                        ) : room.operationalStatus === 'Out of Order' ? (
                          <span className={`truncate ${style.statusNoteColor}`}>Repair</span>
                        ) : room.operationalStatus === 'Out of Service' || room.operationalStatus === 'Blocked' ? (
                          <span className={`truncate ${style.statusNoteColor}`}>Hold</span>
                        ) : room.operationalStatus === 'Dirty' || room.housekeepingStatus === 'Dirty' ? (
                          <span className={`truncate ${style.statusNoteColor}`}>Turnover</span>
                        ) : room.housekeepingStatus === 'Inspected' ? (
                          <span className={`truncate ${style.statusNoteColor}`}>Inspected</span>
                        ) : (
                          <span className={`truncate ${style.statusNoteColor}`}>Ready</span>
                        )}

                        {isDueOut && (
                          <span className="text-[8px] bg-amber-400 text-amber-950 px-1 rounded font-black ml-0.5 shrink-0 uppercase shadow-xs">
                            Due
                          </span>
                        )}
                        {statusKpis.backToBackIds?.has(room.id) && (
                          <span className="text-[8px] bg-fuchsia-700 text-white px-1 rounded font-black ml-0.5 shrink-0 uppercase shadow-xs" title="Back-to-Back: Turnover Priority">
                            B2B
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )))}
      </div>

      {/* RICH ROOM ACTION & MANAGEMENT MODAL (Check Out, Room Bill, Guest Payment, Housekeeping Dept) */}
      {selectedRoomForModal && (
        <RoomActionModal
          room={db.rooms?.find(r => r.id === selectedRoomForModal.id) || selectedRoomForModal}
          isOpen={!!selectedRoomForModal}
          initialTab={selectedTabForModal}
          onClose={() => {
            setSelectedRoomForModal(null);
            setSelectedTabForModal(undefined);
          }}
          db={db}
          onOpenCheckIn={onOpenCheckIn}
          onSelectStay={onSelectStay}
          onShowToast={showToast}
        />
      )}

      {/* SEPARATED INDIVIDUAL BILLING MODAL (Directly opened from dashboard or menu) */}
      {separatedBillingRoom && separatedBillingAction && (
        <IndividualBillingModal
          isOpen={!!separatedBillingRoom && !!separatedBillingAction}
          onClose={() => {
            setSeparatedBillingRoom(null);
            setSeparatedBillingAction(null);
          }}
          room={separatedBillingRoom}
          actionType={separatedBillingAction}
          onChangeActionType={(newAction) => setSeparatedBillingAction(newAction)}
          db={db}
          onShowToast={showToast}
          onOpenRoomStatusModal={() => {
            const r = separatedBillingRoom;
            setSeparatedBillingRoom(null);
            setSeparatedBillingAction(null);
            setSelectedRoomForModal(r);
            setSelectedTabForModal('overview');
          }}
          onSelectStay={onSelectStay}
        />
      )}

      {/* PORTAL RENDERED FLOATING QUICK BILLING MENU - ESCAPES ALL OVERFLOW & SIDEBAR CONSTRAINTS */}
      {billingMenuRoomId && billingMenuAnchor && (() => {
        const activeRoom = (db.rooms || []).find(r => r.id === billingMenuRoomId);
        if (!activeRoom) return null;
        const activeStay = activeStaysByRoom.get(activeRoom.roomNumber);

        return (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: `${billingMenuAnchor.left}px`,
              ...(billingMenuAnchor.openUp
                ? { bottom: `${window.innerHeight - billingMenuAnchor.top + 6}px` }
                : { top: `${billingMenuAnchor.top + 6}px` })
            }}
            className="w-60 bg-white border-2 border-blue-600 rounded-xl shadow-2xl p-2 z-[9999] text-slate-900 animate-in fade-in zoom-in-95 duration-100 ring-4 ring-black/10"
          >
            <div className="px-2 py-1 border-b border-gray-200 mb-1.5 flex items-center justify-between">
              <div>
                <p className="font-black text-[11px] text-blue-950">Room {activeRoom.roomNumber} Quick Menu</p>
                <p className="text-[10px] text-gray-500 truncate max-w-[160px]">{activeStay?.guestName || 'In-House Guest'}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBillingMenuRoomId(null);
                  setBillingMenuAnchor(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setBillingMenuRoomId(null);
                  setBillingMenuAnchor(null);
                  if (activeStay) {
                    if (onOpenCheckout) onOpenCheckout(activeStay.id);
                    else onSelectStay(activeStay.id);
                  }
                }}
                className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-rose-50 text-rose-900 flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="truncate">Guest Check-Out & Settlement</span>
                <ArrowUpRight className="w-3 h-3 text-rose-500 ml-auto" />
              </button>

              <button
                type="button"
                onClick={(e) => openSeparatedBilling(activeRoom, 'payment', e)}
                className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-emerald-50 text-emerald-900 flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Guest Bill Payment</span>
                <ArrowUpRight className="w-3 h-3 text-emerald-500 ml-auto" />
              </button>

              <button
                type="button"
                onClick={(e) => openSeparatedBilling(activeRoom, 'service-bill', e)}
                className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-amber-50 text-amber-900 flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <Utensils className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">Service Bill (KOT/POS)</span>
                <ArrowUpRight className="w-3 h-3 text-amber-500 ml-auto" />
              </button>

              <button
                type="button"
                onClick={(e) => openSeparatedBilling(activeRoom, 'folio-details', e)}
                className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-indigo-50 text-indigo-900 flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">Details of Guest Folio</span>
                <ArrowUpRight className="w-3 h-3 text-indigo-500 ml-auto" />
              </button>

              <button
                type="button"
                onClick={(e) => openSeparatedBilling(activeRoom, 'room-change', e)}
                className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-blue-50 text-blue-900 flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Room Change & Upgrade</span>
                <ArrowUpRight className="w-3 h-3 text-blue-500 ml-auto" />
              </button>

              <button
                type="button"
                onClick={(e) => openSeparatedBilling(activeRoom, 'bill-preview', e)}
                className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-slate-100 text-slate-900 flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                <span className="truncate">Bill Preview of All Bills</span>
                <ArrowUpRight className="w-3 h-3 text-slate-500 ml-auto" />
              </button>

              <button
                type="button"
                onClick={(e) => openSeparatedBilling(activeRoom, 'pax-control', e)}
                className="w-full px-2 py-1.5 text-left rounded-lg hover:bg-purple-50 text-purple-900 flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="truncate">Pax In / Pax Out</span>
                <ArrowUpRight className="w-3 h-3 text-purple-500 ml-auto" />
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
