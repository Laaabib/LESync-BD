import React, { useState, useEffect } from 'react';
import {
  Layers, BedDouble, Sparkles, Wrench, ShieldAlert, CheckCircle2,
  Filter, Search, Clock, RefreshCw, X, AlertTriangle, ArrowRight,
  UserCheck, PlusCircle, Edit3, Lock
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { rbacService } from '../services/rbacService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';
import { Room, OperationalStatus, HousekeepingStatus } from '../types/pms';

interface RoomStatusViewProps {
  onSelectRoom?: (roomId: string) => void;
  onOpenCheckIn?: (reservationId?: string) => void;
  onOpenCheckout?: (stayId: string) => void;
}

export const RoomStatusView: React.FC<RoomStatusViewProps> = ({
  onSelectRoom,
  onOpenCheckIn,
  onOpenCheckout
}) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Selected Room for Status Editor Modal
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [newOpStatus, setNewOpStatus] = useState<OperationalStatus>('Available');
  const [newHkStatus, setNewHkStatus] = useState<HousekeepingStatus>('Clean');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  const rooms = db.rooms;
  const floors = Array.from(new Set(rooms.map(r => r.floor))).sort();

  // Aggregate counts
  const totalCount = rooms.length;
  const vacantCleanCount = rooms.filter(r => (r.operationalStatus === 'Available' || r.operationalStatus === 'Inspected') && r.housekeepingStatus === 'Clean').length;
  const vacantDirtyCount = rooms.filter(r => (r.operationalStatus === 'Dirty' || r.operationalStatus === 'Available') && r.housekeepingStatus === 'Dirty').length;
  const occupiedCount = rooms.filter(r => r.operationalStatus === 'Occupied').length;
  const reservedCount = rooms.filter(r => r.operationalStatus === 'Reserved').length;
  const outOfOrderCount = rooms.filter(r => r.operationalStatus === 'Out of Order' || r.operationalStatus === 'Out of Service').length;
  const blockedCount = rooms.filter(r => r.operationalStatus === 'Blocked').length;
  const inspectedCount = rooms.filter(r => r.operationalStatus === 'Inspected' || r.housekeepingStatus === 'Inspected').length;

  const filteredRooms = rooms.filter(room => {
    if (floorFilter !== 'all' && room.floor.toString() !== floorFilter) return false;
    if (typeFilter !== 'all' && room.roomTypeId !== typeFilter) return false;

    if (search) {
      const q = search.toLowerCase();
      const matchNum = room.roomNumber.includes(q);
      const matchType = (room.roomTypeName || '').toLowerCase().includes(q);
      if (!matchNum && !matchType) return false;
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'vacant-clean') {
        return (room.operationalStatus === 'Available' || room.operationalStatus === 'Inspected') && room.housekeepingStatus === 'Clean';
      }
      if (statusFilter === 'vacant-dirty') {
        return room.operationalStatus === 'Dirty' || room.housekeepingStatus === 'Dirty';
      }
      if (statusFilter === 'occupied') {
        return room.operationalStatus === 'Occupied';
      }
      if (statusFilter === 'reserved') {
        return room.operationalStatus === 'Reserved';
      }
      if (statusFilter === 'inspected') {
        return room.operationalStatus === 'Inspected' || room.housekeepingStatus === 'Inspected';
      }
      if (statusFilter === 'out-of-order') {
        return room.operationalStatus === 'Out of Order' || room.operationalStatus === 'Out of Service';
      }
      if (statusFilter === 'blocked') {
        return room.operationalStatus === 'Blocked';
      }
    }

    return true;
  });

  const handleOpenEdit = (room: Room) => {
    setEditingRoom(room);
    setNewOpStatus(room.operationalStatus);
    setNewHkStatus(room.housekeepingStatus);
    setStatusNotes(room.notes || '');
  };

  const canEditHK = rbacService.isSuperAdmin() || rbacService.isModuleAllowed('housekeeping') || rbacService.hasPermission('housekeeping:edit') || rbacService.hasPermission('housekeeping:*');

  const handleSaveStatus = () => {
    if (!editingRoom) return;

    try {
      const targetHk = canEditHK ? newHkStatus : editingRoom.housekeepingStatus;
      pmsService.updateRoomStatus(editingRoom.id, newOpStatus, targetHk, statusNotes);
      setSuccessToast(`Room ${editingRoom.roomNumber} updated to ${newOpStatus}${canEditHK ? ` (${targetHk})` : ''}`);
      setTimeout(() => {
        setEditingRoom(null);
        setSuccessToast(null);
      }, 800);
    } catch (err: any) {
      alert(`Error updating room status: ${err?.message || 'Update failed'}`);
    }
  };

  return (
    <div className="space-y-4 text-xs text-gray-900">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 p-4 rounded-lg shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shadow-xs">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-gray-900 uppercase tracking-tight">Interactive Visual Room Status Board</h1>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 font-mono">
                LIVE RACK
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-0.5">
              Live room housekeeping & operational matrix across all wings and floors.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => pmsService.notify()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-md transition-colors border border-gray-300 shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Rack</span>
          </button>
        </div>
      </div>

      {/* Metric Counters / Filter Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <button
          onClick={() => setStatusFilter('vacant-clean')}
          className={`p-2.5 rounded-lg border text-left transition-all ${
            statusFilter === 'vacant-clean' ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-[10px] font-bold text-emerald-800 uppercase">Vacant Clean</div>
          <div className="text-xl font-bold text-emerald-700 mt-0.5">{vacantCleanCount}</div>
        </button>

        <button
          onClick={() => setStatusFilter('vacant-dirty')}
          className={`p-2.5 rounded-lg border text-left transition-all ${
            statusFilter === 'vacant-dirty' ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-500/20' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-[10px] font-bold text-amber-800 uppercase">Vacant Dirty</div>
          <div className="text-xl font-bold text-amber-700 mt-0.5">{vacantDirtyCount}</div>
        </button>

        <button
          onClick={() => setStatusFilter('occupied')}
          className={`p-2.5 rounded-lg border text-left transition-all ${
            statusFilter === 'occupied' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-[10px] font-bold text-blue-800 uppercase">Occupied</div>
          <div className="text-xl font-bold text-blue-700 mt-0.5">{occupiedCount}</div>
        </button>

        <button
          onClick={() => setStatusFilter('inspected')}
          className={`p-2.5 rounded-lg border text-left transition-all ${
            statusFilter === 'inspected' ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-500/20' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-[10px] font-bold text-teal-800 uppercase">Inspected</div>
          <div className="text-xl font-bold text-teal-700 mt-0.5">{inspectedCount}</div>
        </button>

        <button
          onClick={() => setStatusFilter('reserved')}
          className={`p-2.5 rounded-lg border text-left transition-all ${
            statusFilter === 'reserved' ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-500/20' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-[10px] font-bold text-purple-800 uppercase">Reserved</div>
          <div className="text-xl font-bold text-purple-700 mt-0.5">{reservedCount}</div>
        </button>

        <button
          onClick={() => setStatusFilter('out-of-order')}
          className={`p-2.5 rounded-lg border text-left transition-all ${
            statusFilter === 'out-of-order' ? 'border-red-600 bg-red-50 ring-2 ring-red-500/20' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-[10px] font-bold text-red-800 uppercase">Out of Order</div>
          <div className="text-xl font-bold text-red-700 mt-0.5">{outOfOrderCount}</div>
        </button>

        <button
          onClick={() => setStatusFilter('blocked')}
          className={`p-2.5 rounded-lg border text-left transition-all ${
            statusFilter === 'blocked' ? 'border-gray-600 bg-gray-100 ring-2 ring-gray-500/20' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-[10px] font-bold text-gray-800 uppercase">Blocked</div>
          <div className="text-xl font-bold text-gray-800 mt-0.5">{blockedCount}</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white border border-gray-200 p-3 rounded-lg shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search room number or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={floorFilter}
            onChange={e => setFloorFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-xs font-medium"
          >
            <option value="all">All Floors</option>
            {floors.map(f => (
              <option key={f} value={f.toString()}>Floor {f}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-xs font-medium"
          >
            <option value="all">All Room Types</option>
            {db.roomTypes.map(rt => (
              <option key={rt.id} value={rt.id}>{rt.name}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setStatusFilter('all');
              setFloorFilter('all');
              setTypeFilter('all');
              setSearch('');
            }}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-bold text-xs border border-gray-300"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Interactive Room Grid By Floor */}
      <div className="space-y-4">
        {floors
          .filter(f => floorFilter === 'all' || f.toString() === floorFilter)
          .map(floorNum => {
            const floorRooms = filteredRooms.filter(r => r.floor === floorNum);
            if (floorRooms.length === 0) return null;

            return (
              <div key={floorNum} className="bg-white border border-gray-200 rounded-lg shadow-xs p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded bg-gray-800 text-white font-mono font-bold flex items-center justify-center text-xs">
                      L{floorNum}
                    </span>
                    <h2 className="font-bold text-gray-900 text-xs uppercase tracking-wide">
                      Floor {floorNum} — {floorRooms.length} Rooms
                    </h2>
                  </div>
                  <span className="text-[11px] text-gray-500 font-mono">
                    {floorRooms.filter(r => r.operationalStatus === 'Occupied').length} Occupied / {floorRooms.length} Total
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {floorRooms.map(room => {
                    const activeStay = db.stays.find(s => s.roomId === room.id && s.status === 'Active');
                    const nextRes = db.reservations.find(r => r.assignedRoomId === room.id && r.status === 'Confirmed');

                    // Color matrix
                    let badgeClass = 'bg-gray-100 text-gray-800 border-gray-300';
                    let cardBorder = 'border-gray-200 hover:border-gray-400';

                    if (room.operationalStatus === 'Occupied') {
                      badgeClass = 'bg-blue-600 text-white border-blue-700';
                      cardBorder = 'border-blue-300 bg-blue-50/30';
                    } else if (room.operationalStatus === 'Available' || room.operationalStatus === 'Inspected') {
                      if (room.housekeepingStatus === 'Clean' || room.housekeepingStatus === 'Inspected') {
                        badgeClass = 'bg-emerald-600 text-white border-emerald-700';
                        cardBorder = 'border-emerald-300 bg-emerald-50/20';
                      } else {
                        badgeClass = 'bg-amber-600 text-white border-amber-700';
                        cardBorder = 'border-amber-300 bg-amber-50/20';
                      }
                    } else if (room.operationalStatus === 'Dirty') {
                      badgeClass = 'bg-amber-600 text-white border-amber-700';
                      cardBorder = 'border-amber-300 bg-amber-50/20';
                    } else if (room.operationalStatus === 'Reserved') {
                      badgeClass = 'bg-purple-600 text-white border-purple-700';
                      cardBorder = 'border-purple-300 bg-purple-50/20';
                    } else if (room.operationalStatus === 'Out of Order') {
                      badgeClass = 'bg-red-600 text-white border-red-700';
                      cardBorder = 'border-red-300 bg-red-50/20';
                    }

                    return (
                      <div
                        key={room.id}
                        onClick={() => handleOpenEdit(room)}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all shadow-xs flex flex-col justify-between h-32 ${cardBorder}`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-sm text-gray-900">
                              {room.roomNumber}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeClass}`}>
                              {room.operationalStatus}
                            </span>
                          </div>

                          <div className="text-[10px] text-gray-600 font-semibold truncate mt-1">
                            {room.roomTypeName}
                          </div>

                          <div className="text-[9px] text-gray-500 mt-0.5">
                            HK: <strong className="text-gray-700">{room.housekeepingStatus}</strong>
                          </div>
                        </div>

                        <div className="border-t border-gray-200/80 pt-1 text-[10px]">
                          {activeStay ? (
                            <div className="truncate font-bold text-blue-800">
                              👤 {activeStay.guestName}
                            </div>
                          ) : nextRes ? (
                            <div className="truncate text-purple-700 font-medium">
                              📅 Res: {nextRes.guestName}
                            </div>
                          ) : room.operationalStatus === 'Out of Order' ? (
                            <div className="truncate text-red-700 font-medium">
                              ⚠️ {room.notes || 'Maintenance'}
                            </div>
                          ) : (
                            <div className="text-emerald-700 font-medium">
                              ✓ Vacant Ready
                            </div>
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

      {/* Room Status Editor Modal */}
      {editingRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-gray-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <BedDouble className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-sm uppercase">
                  Room {editingRoom.roomNumber} — Status Control
                </h3>
              </div>
              <button
                onClick={() => setEditingRoom(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {successToast && (
                <div className="bg-emerald-50 border border-emerald-400 p-2.5 rounded-lg text-emerald-900 font-bold text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{successToast}</span>
                </div>
              )}

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-gray-800">{editingRoom.roomTypeName}</div>
                  <div className="text-gray-500 text-[11px]">Floor {editingRoom.floor} • Wing: Main Tower</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-blue-700 font-mono">৳{editingRoom.roomTypeName}</span>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Operational Status:</label>
                <select
                  value={newOpStatus}
                  onChange={e => setNewOpStatus(e.target.value as OperationalStatus)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Available">Available (Vacant Clean)</option>
                  <option value="Occupied">Occupied (Guest In-House)</option>
                  <option value="Reserved">Reserved (Incoming Reservation)</option>
                  <option value="Dirty">Dirty (Requires Turnover)</option>
                  <option value="Cleaning">Cleaning (Attendant in room)</option>
                  <option value="Inspected">Inspected (Supervised & Approved)</option>
                  <option value="Out of Order">Out of Order (Maintenance Repair)</option>
                  <option value="Out of Service">Out of Service (Temporary Offline)</option>
                  <option value="Blocked">Blocked (Management Hold)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-gray-700 font-bold text-xs">Housekeeping Status:</label>
                  {!canEditHK && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-600" />
                      Locked (Housekeeping Dept Only)
                    </span>
                  )}
                </div>
                {canEditHK ? (
                  <select
                    value={newHkStatus}
                    onChange={e => setNewHkStatus(e.target.value as HousekeepingStatus)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Clean">Clean</option>
                    <option value="Dirty">Dirty</option>
                    <option value="Cleaning">Cleaning in progress</option>
                    <option value="Inspected">Inspected</option>
                    <option value="Touch Up">Touch Up required</option>
                  </select>
                ) : (
                  <div className="w-full px-2.5 py-1.5 bg-gray-100 border border-gray-300 rounded text-xs font-bold text-gray-600 flex items-center justify-between select-none">
                    <span>{editingRoom.housekeepingStatus}</span>
                    <span className="text-[10px] text-gray-500 font-normal">FO Read-Only</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Operational Remarks / Maintenance Notes:</label>
                <textarea
                  rows={2}
                  placeholder="e.g. AC cooling verified, ready for VIP arrival..."
                  value={statusNotes}
                  onChange={e => setStatusNotes(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="px-3.5 py-1.5 border border-gray-300 rounded font-bold text-gray-700 hover:bg-gray-100 text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveStatus}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs shadow-xs flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Status Update</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
