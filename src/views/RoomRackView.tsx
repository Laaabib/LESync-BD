import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid, Sparkles, Wrench, User, Calendar,
  CheckCircle2, RefreshCw, Filter, ArrowRightLeft, PlusCircle, Lock,
  Star, CreditCard
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';
import { Room, OperationalStatus } from '../types/pms';

interface RoomRackViewProps {
  onSelectRoom: (roomId: string) => void;
  onOpenNewReservation?: (roomId?: string) => void;
  onOpenCheckIn?: (reservationId?: string) => void;
}

export const RoomRackView: React.FC<RoomRackViewProps> = ({
  onSelectRoom,
  onOpenNewReservation,
  onOpenCheckIn
}) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [floorFilter, setFloorFilter] = useState<number | 'All'>('All');
  const [roomSearch, setRoomSearch] = useState<string>('');

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Dynamic floors from active rooms
  const floors = useMemo(() => {
    const floorSet = new Set<number>();
    (db.rooms || []).forEach(r => {
      if (typeof r.floor === 'number') floorSet.add(r.floor);
    });
    const arr = Array.from(floorSet).sort((a, b) => a - b);
    return arr.length > 0 ? arr : [1, 2, 3];
  }, [db.rooms]);

  const activeStaysByRoom = useMemo(() => {
    const map = new Map<string, any>();
    (db.stays || []).forEach(s => {
      if (s.status === 'Active' && s.roomNumber) {
        map.set(s.roomNumber, s);
      }
    });
    return map;
  }, [db.stays]);

  const reservationsByRoom = useMemo(() => {
    const map = new Map<string, any>();
    (db.reservations || []).forEach(r => {
      if ((r.status === 'Confirmed' || r.status === 'Unconfirmed') && r.assignedRoomNumber) {
        map.set(r.assignedRoomNumber, r);
      }
    });
    return map;
  }, [db.reservations]);

  const allGuests = useMemo(() => {
    const map = new Map<string, any>();
    (db.guests || []).forEach(g => {
      map.set(g.id, g);
      if (g.fullName) map.set(g.fullName.toLowerCase(), g);
    });
    return map;
  }, [db.guests]);

  const filteredRooms = useMemo(() => {
    return (db.rooms || []).filter(r => {
      const matchesStatus = statusFilter === 'All' || r.operationalStatus === statusFilter;
      const matchesFloor = floorFilter === 'All' || r.floor === floorFilter;
      const matchesSearch = !roomSearch.trim() ||
        r.roomNumber.toLowerCase().includes(roomSearch.trim().toLowerCase()) ||
        r.roomTypeName.toLowerCase().includes(roomSearch.trim().toLowerCase());
      return matchesStatus && matchesFloor && matchesSearch;
    });
  }, [db.rooms, statusFilter, floorFilter, roomSearch]);

  const getRoomMiniRackStyle = (room: Room) => {
    const op = room.operationalStatus;
    const hk = room.housekeepingStatus;

    if (op === 'Occupied') {
      return {
        bg: 'bg-rose-50 border-rose-300',
        badgeBg: 'bg-rose-600 text-white',
        numberBadge: 'bg-slate-950 text-white border-2 border-slate-700 font-black shadow-xs ring-1 ring-black/30',
        floorBadge: 'bg-rose-100/80 text-rose-800 border-rose-200',
        dividerColor: 'border-rose-200',
        statusNoteColor: 'text-rose-900',
        shortLabel: 'OCCUPIED'
      };
    }
    if (op === 'Reserved') {
      return {
        bg: 'bg-blue-50 border-blue-300',
        badgeBg: 'bg-blue-600 text-white',
        numberBadge: 'bg-slate-950 text-white border-2 border-slate-700 font-black shadow-xs ring-1 ring-black/30',
        floorBadge: 'bg-blue-100/80 text-blue-800 border-blue-200',
        dividerColor: 'border-blue-200',
        statusNoteColor: 'text-blue-900',
        shortLabel: 'RESERVED'
      };
    }
    if (op === 'Out of Order') {
      return {
        bg: 'bg-slate-100 border-slate-400',
        badgeBg: 'bg-slate-700 text-white',
        numberBadge: 'bg-red-950 text-white border-2 border-red-500 font-black shadow-xs ring-1 ring-red-400/40',
        floorBadge: 'bg-slate-200 text-slate-700 border-slate-300',
        dividerColor: 'border-slate-300',
        statusNoteColor: 'text-slate-800',
        shortLabel: 'OUT OF ORDER'
      };
    }
    if (op === 'Out of Service' || op === 'Blocked') {
      return {
        bg: 'bg-amber-50 border-amber-300',
        badgeBg: 'bg-amber-600 text-white',
        numberBadge: 'bg-zinc-950 text-white border-2 border-zinc-500 font-black shadow-xs ring-1 ring-zinc-400/40',
        floorBadge: 'bg-amber-100 text-amber-800 border-amber-200',
        dividerColor: 'border-amber-200',
        statusNoteColor: 'text-amber-900',
        shortLabel: 'BLOCKED'
      };
    }
    if (op === 'Dirty' || hk === 'Dirty') {
      return {
        bg: 'bg-amber-50/70 border-amber-400',
        badgeBg: 'bg-amber-500 text-slate-950',
        numberBadge: 'bg-slate-950 text-white border-2 border-slate-700 font-black shadow-xs ring-1 ring-black/30',
        floorBadge: 'bg-amber-100/80 text-amber-800 border-amber-200',
        dividerColor: 'border-amber-200',
        statusNoteColor: 'text-amber-900',
        shortLabel: 'VACANT DIRTY'
      };
    }
    if (hk === 'Inspected') {
      return {
        bg: 'bg-indigo-50 border-indigo-300',
        badgeBg: 'bg-indigo-600 text-white',
        numberBadge: 'bg-slate-950 text-white border-2 border-slate-700 font-black shadow-xs ring-1 ring-black/30',
        floorBadge: 'bg-indigo-100/80 text-indigo-800 border-indigo-200',
        dividerColor: 'border-indigo-200',
        statusNoteColor: 'text-indigo-900',
        shortLabel: 'INSPECTED'
      };
    }
    // Available / Vacant Clean
    return {
      bg: 'bg-emerald-50 border-emerald-300',
      badgeBg: 'bg-emerald-600 text-white',
      numberBadge: 'bg-slate-950 text-white border-2 border-slate-700 font-black shadow-xs ring-1 ring-black/30',
      floorBadge: 'bg-emerald-100/80 text-emerald-800 border-emerald-200',
      dividerColor: 'border-emerald-200',
      statusNoteColor: 'text-emerald-900',
      shortLabel: 'VACANT CLEAN'
    };
  };

  const formatDisplayGuestName = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return fullName;
    const lastName = parts[parts.length - 1];
    const initials = parts.slice(0, parts.length - 1).map(p => p[0].toUpperCase() + '.').join('');
    return `${initials} ${lastName}`;
  };

  return (
    <div className="space-y-3 text-xs text-gray-900">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 p-3 sm:p-4 rounded-xl shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center border border-blue-200 shadow-xs">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-gray-900 uppercase tracking-tight">Mini Rack Room Matrix</h1>
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 font-mono shadow-xs">
                <span>{db.rooms?.length || 0} ROOMS</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 shadow-xs">
                Mini Rack Active
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-0.5">
              High-density front desk matrix displaying instant occupancy, housekeeping, reservations, and room actions.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenCheckIn && (
            <button
              onClick={() => onOpenCheckIn()}
              className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-xs text-xs"
            >
              <span>⚡ Walk-In</span>
            </button>
          )}
          {onOpenNewReservation && (
            <button
              onClick={() => onOpenNewReservation()}
              className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-xs text-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Reservation</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-xs text-xs">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-1">
          {['All', 'Available', 'Occupied', 'Reserved', 'Dirty', 'Out of Order'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Floor & Search Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-gray-500 font-bold whitespace-nowrap">Floor:</span>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
              className="bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
            >
              <option value="All">All Floors ({floors.length})</option>
              {floors.map(f => (
                <option key={f} value={f}>Floor {f}</option>
              ))}
            </select>
          </div>

          <div className="w-32 sm:w-44">
            <input
              type="text"
              value={roomSearch}
              onChange={e => setRoomSearch(e.target.value)}
              placeholder="Search Room..."
              className="w-full px-2.5 py-1 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Mini Rack Floor Grids */}
      <div className="space-y-3">
        {floors.map(floorNum => {
          const roomsOnFloor = filteredRooms.filter(r => r.floor === floorNum);
          if (roomsOnFloor.length === 0) return null;

          return (
            <div key={floorNum} className="bg-white border border-gray-200 rounded-xl p-3 space-y-2 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-gray-800 text-xs uppercase tracking-tight">
                    Floor {floorNum}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono font-bold bg-gray-100 px-1.5 py-0.2 rounded">
                    {roomsOnFloor.length} Rooms
                  </span>
                </div>
              </div>

              {/* High-Density Mini Rack Cards */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(86px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(96px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-1.5">
                {roomsOnFloor.map(room => {
                  const style = getRoomMiniRackStyle(room);
                  const stay = activeStaysByRoom.get(room.roomNumber);
                  const reservation = reservationsByRoom.get(room.roomNumber);
                  const isDueOut = stay && stay.expectedCheckOutAt && stay.expectedCheckOutAt.startsWith(todayStr);
                  const isVip = (stay && stay.vip) || (stay && allGuests.get(stay.guestId)?.vipStatus);
                  const isSearchMatch = Boolean(
                    roomSearch.trim().length > 0 &&
                    room.roomNumber.toLowerCase().includes(roomSearch.trim().toLowerCase())
                  );

                  return (
                    <div
                      key={room.id}
                      onClick={() => onSelectRoom(room.id)}
                      title={`Room ${room.roomNumber} (${room.roomTypeName})\nStatus: ${room.operationalStatus} / ${room.housekeepingStatus}\nFloor: ${room.floor}${stay ? `\nIn-House: ${stay.guestName}` : ''}${reservation ? `\nReserved: ${reservation.guestName}` : ''}\nClick to view room details & management`}
                      className={`rounded-lg border-2 p-1.5 flex flex-col justify-between transition-all cursor-pointer relative h-[72px] sm:h-[76px] ${
                        style.bg
                      } ${
                        isSearchMatch
                          ? 'ring-3 ring-amber-500 shadow-md scale-[1.03] z-10 border-amber-500'
                          : 'hover:shadow-sm hover:scale-[1.03]'
                      }`}
                    >
                      {/* Top Header Row: Room Number, VIP, Stop Post, Floor */}
                      <div className="flex items-center justify-between gap-1 leading-none">
                        <div className="flex items-center space-x-1 shrink-0">
                          <span className={`px-2 py-0.5 rounded-md font-mono font-black text-xs sm:text-[13.5px] tracking-tight leading-none shadow-xs border transition-all ${
                            isSearchMatch
                              ? 'bg-amber-300 text-amber-950 border-2 border-amber-600 ring-2 ring-amber-400 font-black scale-110 shadow-md animate-pulse'
                              : style.numberBadge
                          }`}>
                            {room.roomNumber}
                          </span>
                          {isVip && <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />}
                          {stay?.stopPost && (
                            <span title="Stop Post Active" className="inline-flex">
                              <Lock className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                            </span>
                          )}
                        </div>
                        <span className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded border ${style.floorBadge}`}>
                          F{room.floor}
                        </span>
                      </div>

                      {/* BIG HIGHLIGHTED ROOM STATUS BADGE */}
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
