import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, X, User, Calendar, BedDouble, FileText,
  PartyPopper, Phone, ArrowRight, UtensilsCrossed,
  Sparkles, Compass, CheckCircle2, Clock, ShieldCheck,
  ChevronRight, Tag, CreditCard, ShoppingBag
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { housekeepingService } from '../../services/housekeepingService';
import {
  Guest, Reservation, Room, Invoice, EventBooking, Folio, RestaurantOrder
} from '../../types/pms';
import { HousekeepingTaskEnhanced } from '../../types/housekeeping';

interface QuickNavigationItem {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  icon: any;
  category: string;
  badge?: string;
}

const SYSTEM_SHORTCUTS: QuickNavigationItem[] = [
  { id: 'nav-dashboard', title: 'Operational Dashboard', subtitle: 'Live hotel metrics, room counts & arrivals', route: 'dashboard', icon: Compass, category: 'General' },
  { id: 'nav-dining-pos', title: 'Restaurant & Dining POS', subtitle: 'Table ordering, remote billing & kitchen KOT', route: 'restaurant-pos', icon: UtensilsCrossed, category: 'F&B Dining', badge: 'Active' },
  { id: 'nav-room-service', title: 'In-Room Dining (Room Service)', subtitle: 'Remote guest room delivery order taking', route: 'restaurant-pos', icon: ShoppingBag, category: 'F&B Dining' },
  { id: 'nav-dining-orders', title: 'Restaurant Orders & Bills', subtitle: 'View open kitchen orders & settlement bills', route: 'restaurant-orders', icon: FileText, category: 'F&B Dining' },
  { id: 'nav-hk-status', title: 'Housekeeping Room Status', subtitle: 'Live room cleanliness & quick turnaround grid', route: 'housekeeping-status', icon: BedDouble, category: 'Housekeeping', badge: 'Live' },
  { id: 'nav-hk-cleaning', title: 'Housekeeping Room Cleaning', subtitle: 'Attendant tasks, turnover inspection & checklists', route: 'housekeeping-cleaning', icon: Sparkles, category: 'Housekeeping' },
  { id: 'nav-hk-requests', title: 'Housekeeping Service Requests', subtitle: 'Towel, extra bed, pillow & laundry requests', route: 'housekeeping-requests', icon: Clock, category: 'Housekeeping' },
  { id: 'nav-front-desk', title: 'Front Desk Operations', subtitle: 'Guest arrivals, departures & room moves', route: 'front-desk', icon: User, category: 'Front Office' },
  { id: 'nav-reservations', title: 'Reservation Management', subtitle: 'Bookings, advance deposits & calendar rack', route: 'reservations', icon: Calendar, category: 'Front Office' },
  { id: 'nav-banquets', title: 'Convention & Banquet Halls', subtitle: 'Hall bookings, client conferences & gala events', route: 'banquets', icon: PartyPopper, category: 'Events' },
  { id: 'nav-billing', title: 'Cashier, Folios & Billing', subtitle: 'Guest folios, invoices, city ledger & settlements', route: 'cashier-desk', icon: CreditCard, category: 'Finance' },
  { id: 'nav-inventory', title: 'Stores & Central Inventory', subtitle: 'Stock balances, requisitions & GRN warehouse', route: 'inventory-stock', icon: Tag, category: 'Procurement' },
  { id: 'nav-admin', title: 'Master Operations Hub', subtitle: 'Enterprise configuration, RBAC & system security', route: 'admin-users', icon: ShieldCheck, category: 'Administration' }
];

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult?: (type: string, id: string, entity?: any) => void;
  onSelectRoom?: (roomId: string) => void;
  onSelectGuest?: (guestId: string) => void;
  onSelectReservation?: (reservationId?: string) => void;
  onSelectStay?: (stayId?: string) => void;
  onSelectEvent?: (eventId: string) => void;
  onSelectFolio?: (folioId: string) => void;
  onSelectInvoice?: (invoice: Invoice) => void;
  onSelectOrder?: (order: RestaurantOrder) => void;
  onSelectHousekeepingTask?: (task: HousekeepingTaskEnhanced) => void;
  onNavigate?: (route: string) => void;
}

type SearchCategoryFilter = 'all' | 'rooms-guests' | 'orders' | 'housekeeping' | 'finance' | 'events' | 'shortcuts';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
  onSelectRoom,
  onSelectGuest,
  onSelectReservation,
  onSelectStay,
  onSelectEvent,
  onSelectFolio,
  onSelectInvoice,
  onSelectOrder,
  onSelectHousekeepingTask,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SearchCategoryFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search Results
  const searchData = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Return suggestions when empty
      const defaultShortcuts = SYSTEM_SHORTCUTS.slice(0, 6);
      return {
        guests: [] as Guest[],
        reservations: [] as Reservation[],
        rooms: [] as Room[],
        invoices: [] as Invoice[],
        events: [] as EventBooking[],
        folios: [] as Folio[],
        orders: [] as RestaurantOrder[],
        housekeepingTasks: [] as HousekeepingTaskEnhanced[],
        shortcuts: defaultShortcuts,
        totalCount: defaultShortcuts.length
      };
    }

    // 1. PMS Search
    const pmsRes = pmsService.searchGlobal(q);

    // 2. Housekeeping Tasks Search
    const hkTasks = (housekeepingService.getState().tasks || []).filter(t =>
      (t.roomNumber && t.roomNumber.includes(q)) ||
      (t.taskNumber && t.taskNumber.toLowerCase().includes(q)) ||
      (t.cleaningType && t.cleaningType.toLowerCase().includes(q)) ||
      (t.assignedAttendantName && t.assignedAttendantName.toLowerCase().includes(q)) ||
      (t.priority && t.priority.toLowerCase().includes(q)) ||
      (t.status && t.status.toLowerCase().includes(q))
    );

    // 3. Navigation Shortcuts
    const matchingShortcuts = SYSTEM_SHORTCUTS.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.subtitle.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.route.toLowerCase().includes(q)
    );

    const totalCount =
      pmsRes.guests.length +
      pmsRes.reservations.length +
      pmsRes.rooms.length +
      pmsRes.orders.length +
      hkTasks.length +
      pmsRes.invoices.length +
      pmsRes.folios.length +
      pmsRes.events.length +
      matchingShortcuts.length;

    return {
      guests: pmsRes.guests,
      reservations: pmsRes.reservations,
      rooms: pmsRes.rooms,
      orders: pmsRes.orders,
      invoices: pmsRes.invoices,
      events: pmsRes.events,
      folios: pmsRes.folios,
      housekeepingTasks: hkTasks,
      shortcuts: matchingShortcuts,
      totalCount
    };
  }, [query]);

  // Flatten active items for keyboard navigation
  const flatItems = useMemo(() => {
    const list: { type: string; id: string; entity: any }[] = [];

    if (categoryFilter === 'all' || categoryFilter === 'shortcuts') {
      searchData.shortcuts.forEach(s => list.push({ type: 'shortcut', id: s.id, entity: s }));
    }
    if (categoryFilter === 'all' || categoryFilter === 'rooms-guests') {
      searchData.rooms.forEach(r => list.push({ type: 'room', id: r.id, entity: r }));
      searchData.guests.forEach(g => list.push({ type: 'guest', id: g.id, entity: g }));
      searchData.reservations.forEach(r => list.push({ type: 'reservation', id: r.id, entity: r }));
    }
    if (categoryFilter === 'all' || categoryFilter === 'orders') {
      searchData.orders.forEach(o => list.push({ type: 'order', id: o.id, entity: o }));
    }
    if (categoryFilter === 'all' || categoryFilter === 'housekeeping') {
      searchData.housekeepingTasks.forEach(t => list.push({ type: 'hk-task', id: t.id, entity: t }));
    }
    if (categoryFilter === 'all' || categoryFilter === 'finance') {
      searchData.invoices.forEach(i => list.push({ type: 'invoice', id: i.id, entity: i }));
      searchData.folios.forEach(f => list.push({ type: 'folio', id: f.id, entity: f }));
    }
    if (categoryFilter === 'all' || categoryFilter === 'events') {
      searchData.events.forEach(e => list.push({ type: 'event', id: e.id, entity: e }));
    }

    return list;
  }, [searchData, categoryFilter]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCategoryFilter('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1 < flatItems.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : flatItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          const item = flatItems[selectedIndex];
          handleSelectItem(item.type, item.id, item.entity);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, onClose]);

  const handleSelectItem = (type: string, id: string, entity?: any) => {
    if (onSelectResult) {
      onSelectResult(type, id, entity);
    }

    if (type === 'room') {
      if (onSelectRoom) onSelectRoom(id);
    } else if (type === 'guest') {
      if (onSelectGuest) onSelectGuest(id);
    } else if (type === 'reservation') {
      if (onSelectReservation) onSelectReservation(id);
    } else if (type === 'folio') {
      if (onSelectFolio) onSelectFolio(id);
    } else if (type === 'invoice') {
      if (onSelectInvoice) onSelectInvoice(entity);
    } else if (type === 'event') {
      if (onSelectEvent) onSelectEvent(id);
    } else if (type === 'order') {
      if (onSelectOrder) {
        onSelectOrder(entity);
      } else if (onNavigate) {
        onNavigate('restaurant-orders');
      }
    } else if (type === 'hk-task') {
      if (onSelectHousekeepingTask) {
        onSelectHousekeepingTask(entity);
      } else if (onNavigate) {
        onNavigate('housekeeping-cleaning');
      }
    } else if (type === 'shortcut') {
      if (onNavigate && entity?.route) {
        onNavigate(entity.route);
      }
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start justify-center pt-2 sm:pt-14 px-2 sm:px-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[82vh]">
        
        {/* Top Search Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4 text-blue-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search rooms, guests, dining orders, housekeeping tasks, folios..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg bg-slate-800/80 text-xs font-mono border border-slate-700 flex items-center space-x-1"
          >
            <span>ESC</span>
          </button>
        </div>

        {/* Filter Category Tabs */}
        <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center space-x-1.5 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: 'all', label: `All (${searchData.totalCount})` },
            { id: 'rooms-guests', label: `Rooms & Guests (${searchData.rooms.length + searchData.guests.length + searchData.reservations.length})` },
            { id: 'orders', label: `Dining Orders (${searchData.orders.length})` },
            { id: 'housekeeping', label: `Housekeeping (${searchData.housekeepingTasks.length})` },
            { id: 'finance', label: `Billing & Folios (${searchData.invoices.length + searchData.folios.length})` },
            { id: 'events', label: `Events (${searchData.events.length})` },
            { id: 'shortcuts', label: `Shortcuts (${searchData.shortcuts.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id as SearchCategoryFilter)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer text-[11px] ${
                categoryFilter === tab.id
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {/* No results message */}
          {query && searchData.totalCount === 0 && (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-sm text-slate-300">
                No matching records found for "{query}"
              </p>
              <p className="text-xs text-slate-500">
                Try searching room numbers ("101", "204"), guest names, phone numbers, or order numbers ("ORD-").
              </p>
            </div>
          )}

          {/* Quick Shortcuts & Navigation */}
          {(categoryFilter === 'all' || categoryFilter === 'shortcuts') && searchData.shortcuts.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-[11px] font-bold text-blue-400 uppercase tracking-wider px-1">
                <Compass className="w-3.5 h-3.5" />
                <span>Quick Navigation ({searchData.shortcuts.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {searchData.shortcuts.map(sc => {
                  const Icon = sc.icon;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => handleSelectItem('shortcut', sc.id, sc)}
                      className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between text-left transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-blue-950 border border-blue-800/60 text-blue-400 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-200 group-hover:text-white truncate">
                            {sc.title}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{sc.subtitle}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 shrink-0 ml-1" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rooms Group */}
          {(categoryFilter === 'all' || categoryFilter === 'rooms-guests') && searchData.rooms.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-[11px] font-bold text-cyan-400 uppercase tracking-wider px-1">
                <BedDouble className="w-3.5 h-3.5" />
                <span>Hotel Rooms ({searchData.rooms.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                {searchData.rooms.map(rm => (
                  <button
                    key={rm.id}
                    onClick={() => handleSelectItem('room', rm.id, rm)}
                    className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between text-left transition-colors group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-base text-white group-hover:text-cyan-300">
                          {rm.roomNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">{rm.roomTypeName}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10.5px] mt-0.5">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          rm.operationalStatus === 'Occupied' ? 'bg-rose-500/20 text-rose-300' :
                          rm.operationalStatus === 'Available' ? 'bg-emerald-500/20 text-emerald-300' :
                          rm.operationalStatus === 'Dirty' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {rm.operationalStatus}
                        </span>
                        <span className="text-slate-500">• Floor {rm.floor}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dining Orders Group (Remote Orders Taking) */}
          {(categoryFilter === 'all' || categoryFilter === 'orders') && searchData.orders.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-[11px] font-bold text-amber-400 uppercase tracking-wider px-1">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Restaurant &amp; Room Service Orders ({searchData.orders.length})</span>
              </div>
              <div className="space-y-1">
                {searchData.orders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => handleSelectItem('order', order.id, order)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between text-left transition-colors group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-amber-300 group-hover:text-amber-200">
                          {order.orderNumber}
                        </span>
                        <span className="text-white font-medium">
                          {order.tableNumber || (order.roomNumber ? `Room ${order.roomNumber}` : 'Counter Order')}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          (order.status === 'Preparing' || order.status === 'Pending' || order.status === 'Served') ? 'bg-amber-500/20 text-amber-300' :
                          (order.status === 'Settled Direct' || order.status === 'Posted to Folio') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {order.orderType} • {order.items?.length || 0} items • <strong className="text-slate-200 font-mono">৳{(order.total || 0).toLocaleString()}</strong>
                        {order.guestName && <span> • Guest: {order.guestName}</span>}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Housekeeping Tasks Group */}
          {(categoryFilter === 'all' || categoryFilter === 'housekeeping') && searchData.housekeepingTasks.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-[11px] font-bold text-purple-400 uppercase tracking-wider px-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Housekeeping Tasks ({searchData.housekeepingTasks.length})</span>
              </div>
              <div className="space-y-1">
                {searchData.housekeepingTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => handleSelectItem('hk-task', task.id, task)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between text-left transition-colors group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-purple-300">
                          Room {task.roomNumber}
                        </span>
                        <span className="text-white font-medium">{task.cleaningType}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          task.status === 'In Progress' ? 'bg-purple-500/20 text-purple-300' :
                          task.status === 'Cleaned' ? 'bg-teal-500/20 text-teal-300' :
                          task.status === 'Assigned' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Priority: <strong className="text-slate-300">{task.priority}</strong> • Attendant: {task.assignedAttendantName || 'Unassigned'} • Floor {task.floor}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Guests Group */}
          {(categoryFilter === 'all' || categoryFilter === 'rooms-guests') && searchData.guests.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-[11px] font-bold text-emerald-400 uppercase tracking-wider px-1">
                <User className="w-3.5 h-3.5" />
                <span>Guests Profile Database ({searchData.guests.length})</span>
              </div>
              <div className="space-y-1">
                {searchData.guests.map(g => (
                  <button
                    key={g.id}
                    onClick={() => handleSelectItem('guest', g.id, g)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between text-left transition-colors group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white group-hover:text-emerald-300">{g.fullName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">{g.guestCode}</span>
                        {g.vipStatus && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">VIP</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{g.phone}</span>
                        </span>
                        {g.email && <span>• {g.email}</span>}
                        {g.company && <span>• {g.company}</span>}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reservations Group */}
          {(categoryFilter === 'all' || categoryFilter === 'rooms-guests') && searchData.reservations.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-[11px] font-bold text-teal-400 uppercase tracking-wider px-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Reservations ({searchData.reservations.length})</span>
              </div>
              <div className="space-y-1">
                {searchData.reservations.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectItem('reservation', r.id, r)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between text-left transition-colors group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-teal-300">{r.reservationNumber}</span>
                        <span className="text-white font-medium">{r.guestName}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          r.status === 'Checked-In' ? 'bg-blue-500/20 text-blue-300' :
                          r.status === 'Confirmed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {r.roomTypeName} {r.assignedRoomNumber ? `(Room ${r.assignedRoomNumber})` : ''} • {r.arrivalDate} → {r.departureDate}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Billing & Invoices Group */}
          {(categoryFilter === 'all' || categoryFilter === 'finance') && (searchData.invoices.length > 0 || searchData.folios.length > 0) && (
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-[11px] font-bold text-indigo-400 uppercase tracking-wider px-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Folios &amp; Invoices ({searchData.invoices.length + searchData.folios.length})</span>
              </div>
              <div className="space-y-1">
                {searchData.folios.map(f => (
                  <button
                    key={f.id}
                    onClick={() => handleSelectItem('folio', f.id, f)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between text-left transition-colors group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-indigo-300">{f.folioNumber}</span>
                        <span className="text-white font-medium">{f.guestName} (Room {f.roomNumber})</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                          Bal: ৳{(f.balance || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Status: {f.status} • Total Charges: ৳{(f.grandTotal || 0).toLocaleString()}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 shrink-0" />
                  </button>
                ))}

                {searchData.invoices.map(inv => (
                  <button
                    key={inv.id}
                    onClick={() => handleSelectItem('invoice', inv.id, inv)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between text-left transition-colors group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-indigo-300">{inv.invoiceNumber}</span>
                        <span className="text-white font-medium">{inv.guestOrClientName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                          ৳{(inv.grandTotal || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {inv.stayOrEventDetails} • {inv.roomOrHall}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Events Group */}
          {(categoryFilter === 'all' || categoryFilter === 'events') && searchData.events.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-[11px] font-bold text-rose-400 uppercase tracking-wider px-1">
                <PartyPopper className="w-3.5 h-3.5" />
                <span>Convention &amp; Banquet Events ({searchData.events.length})</span>
              </div>
              <div className="space-y-1">
                {searchData.events.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => handleSelectItem('event', ev.id, ev)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between text-left transition-colors group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-rose-300">{ev.eventNumber}</span>
                        <span className="text-white font-semibold">{ev.eventName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">{ev.hallName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Client: {ev.clientName} • {ev.eventDate} ({ev.startTime} - {ev.endTime}) • {ev.guestCount} Pax
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-rose-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span>Use <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">↓</kbd> to navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Enter</kbd> to open</span>
          </div>
          <span className="hidden sm:inline text-slate-500">CCULB Unified Enterprise PMS Engine</span>
        </div>

      </div>
    </div>
  );
};
