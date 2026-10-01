import React, { useState, useEffect } from 'react';
import {
  Search, Filter, RefreshCw, Sparkles, CheckCircle2,
  Clock, AlertTriangle, ShieldCheck, Wrench, BedDouble,
  User, Check, X, ShieldAlert, ArrowUpDown, ChevronDown,
  FileText, Plus, Eye, Layers, ArrowRight
} from 'lucide-react';
import { housekeepingService } from '../../services/housekeepingService';
import { pmsService } from '../../services/pmsService';
import { RoomHousekeepingStatus } from '../../types/housekeeping';
import { HousekeepingInspectionModal } from './HousekeepingInspectionModal';

export const HousekeepingRoomStatus: React.FC = () => {
  const [roomList, setRoomList] = useState(housekeepingService.getRoomStatusList());
  const [discrepancies, setDiscrepancies] = useState(housekeepingService.detectDiscrepancies());
  const [searchQuery, setSearchQuery] = useState('');
  const [floorFilter, setFloorFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [occupancyFilter, setOccupancyFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Status Change Modal
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    roomId: string;
    roomNumber: string;
    roomTypeName: string;
    currentHkStatus: RoomHousekeepingStatus;
  }>({
    isOpen: false,
    roomId: '',
    roomNumber: '',
    roomTypeName: '',
    currentHkStatus: 'Vacant Clean'
  });
  const [newStatus, setNewStatus] = useState<RoomHousekeepingStatus>('Vacant Clean');
  const [statusRemarks, setStatusRemarks] = useState('');

  // Discrepancy Resolve Modal
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<{
    id: string;
    roomId: string;
    roomNumber: string;
    frontOfficeStatus: string;
    housekeepingStatus: string;
    frontOfficeDetails: string;
    housekeepingDetails: string;
  } | null>(null);
  const [discrepancyResolution, setDiscrepancyResolution] = useState<'Vacant' | 'Occupied'>('Vacant');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Inspection Modal
  const [inspectionModalData, setInspectionModalData] = useState<{
    isOpen: boolean;
    roomId: string;
    roomNumber: string;
    roomTypeName: string;
    taskId?: string;
    attendantName?: string;
  }>({
    isOpen: false,
    roomId: '',
    roomNumber: '',
    roomTypeName: ''
  });

  // Maintenance Report Modal
  const [maintModal, setMaintModal] = useState<{
    isOpen: boolean;
    roomId: string;
    roomNumber: string;
  }>({
    isOpen: false,
    roomId: '',
    roomNumber: ''
  });
  const [maintIssue, setMaintIssue] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintPriority, setMaintPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [maintBlockOOO, setMaintBlockOOO] = useState(true);

  const refreshData = () => {
    setRoomList(housekeepingService.getRoomStatusList());
    setDiscrepancies(housekeepingService.detectDiscrepancies());
  };

  useEffect(() => {
    const unsubHk = housekeepingService.subscribe(() => {
      refreshData();
    });
    const unsubPms = pmsService.subscribe(() => {
      refreshData();
    });
    return () => {
      unsubHk();
      unsubPms();
    };
  }, []);

  const handleOpenStatusModal = (item: typeof roomList[0]) => {
    setStatusModal({
      isOpen: true,
      roomId: item.room.id,
      roomNumber: item.room.roomNumber,
      roomTypeName: item.room.roomTypeName || 'Standard',
      currentHkStatus: item.compoundStatus
    });
    setNewStatus(item.compoundStatus);
    setStatusRemarks('');
  };

  const handleSaveStatusChange = () => {
    if (!statusModal.roomId) return;
    housekeepingService.updateRoomHousekeepingStatus(statusModal.roomId, newStatus, statusRemarks);
    setStatusModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleQuickTurnaround = (item: typeof roomList[0], e: React.MouseEvent) => {
    e.stopPropagation();
    let nextStatus: RoomHousekeepingStatus = 'Vacant Clean';
    let remarks = 'Quick status turnaround via mobile housekeeping';
    if (item.compoundStatus.includes('Dirty')) {
      nextStatus = item.occupancy === 'Occupied' ? 'Occupied Clean' : 'Vacant Clean';
      remarks = 'Room marked cleaned via quick mobile tap';
    } else if (item.compoundStatus === 'Cleaning') {
      nextStatus = item.occupancy === 'Occupied' ? 'Occupied Clean' : 'Vacant Clean';
      remarks = 'Cleaning finished via quick mobile tap';
    } else if (item.compoundStatus === 'Vacant Clean' || item.compoundStatus === 'Cleaned') {
      nextStatus = 'Inspected';
      remarks = 'Supervisor approved inspection via quick tap';
    } else {
      nextStatus = item.occupancy === 'Occupied' ? 'Occupied Dirty' : 'Vacant Dirty';
      remarks = 'Marked dirty for cleaning service';
    }
    housekeepingService.updateRoomHousekeepingStatus(item.room.id, nextStatus, remarks);
  };

  const handleResolveDiscrepancy = () => {
    if (!selectedDiscrepancy) return;
    housekeepingService.resolveDiscrepancy(
      selectedDiscrepancy.id,
      discrepancyResolution,
      resolutionNotes || `Reconciled as ${discrepancyResolution}`
    );
    setSelectedDiscrepancy(null);
    setResolutionNotes('');
  };

  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintModal.roomId || !maintIssue.trim()) return;

    housekeepingService.reportMaintenanceProblem({
      roomId: maintModal.roomId,
      issueTitle: maintIssue,
      description: maintDesc,
      priority: maintPriority,
      blockRoomAsOOO: maintBlockOOO
    });

    setMaintModal({ isOpen: false, roomId: '', roomNumber: '' });
    setMaintIssue('');
    setMaintDesc('');
  };

  // Filtered rooms
  const filteredRooms = roomList.filter(item => {
    // Floor
    if (floorFilter !== 'All' && String(item.room.floor) !== floorFilter) {
      return false;
    }
    // Room Type
    if (typeFilter !== 'All' && item.room.roomTypeName !== typeFilter) {
      return false;
    }
    // Status
    if (statusFilter !== 'All' && item.compoundStatus !== statusFilter) {
      return false;
    }
    // Occupancy
    if (occupancyFilter !== 'All' && item.occupancy !== occupancyFilter) {
      return false;
    }
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = item.room.roomNumber.toLowerCase().includes(q);
      const matchType = item.room.roomTypeName?.toLowerCase().includes(q);
      const matchGuest = item.activeStay?.guestName?.toLowerCase().includes(q);
      const matchAttendant = item.assignedAttendant.toLowerCase().includes(q);
      if (!matchNum && !matchType && !matchGuest && !matchAttendant) return false;
    }
    return true;
  });

  const openDiscrepancies = discrepancies.filter(d => d.status === 'Open');

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-md">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-md shrink-0">
            <BedDouble className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight">
                Room Cleanliness Status & FO Synchronization
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                LIVE RACK
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Central operational status grid for all resort chalets and tower suites with live Front Office reconciliation.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="bg-slate-950 border border-slate-700 rounded-xl p-1 flex items-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'grid' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Table View
            </button>
          </div>
          <button
            onClick={refreshData}
            className="p-2.5 bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 rounded-xl text-xs font-medium transition-colors shadow-xs"
            title="Refresh Live Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Discrepancy Notification Banner */}
      {openDiscrepancies.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold text-amber-300">
                Front Office ↔ Housekeeping Discrepancy Alerts ({openDiscrepancies.length})
              </span>
            </div>
            <span className="text-[11px] text-amber-400/80 font-mono">Immediate Audit Action Required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {openDiscrepancies.map(disc => (
              <div
                key={disc.id}
                className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/30 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-100">Room {disc.roomNumber}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                      Mismatch
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                    <div>FO: <span className="text-blue-300 font-medium">{disc.frontOfficeStatus}</span> ({disc.frontOfficeDetails})</div>
                    <div>HK: <span className="text-amber-300 font-medium">{disc.housekeepingStatus}</span> ({disc.housekeepingDetails})</div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDiscrepancy(disc)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition-colors shrink-0"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search room, guest, staff..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        {/* Floor Filter */}
        <div>
          <select
            value={floorFilter}
            onChange={e => setFloorFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-400 transition-colors"
          >
            <option value="All">All Floors</option>
            <option value="1">Floor 1 (Chalets 101-106)</option>
            <option value="2">Floor 2 (Suites 201-206)</option>
            <option value="3">Floor 3 (Tower 301-306)</option>
          </select>
        </div>

        {/* Room Type */}
        <div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-400 transition-colors"
          >
            <option value="All">All Room Types</option>
            <option value="Deluxe Couple Room">Deluxe Couple Room</option>
            <option value="Deluxe Twin Room">Deluxe Twin Room</option>
            <option value="Executive Suite">Executive Suite</option>
            <option value="Presidential Suite">Presidential Suite</option>
          </select>
        </div>

        {/* Housekeeping Status */}
        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-400 transition-colors"
          >
            <option value="All">All Cleanliness Statuses</option>
            <option value="Vacant Clean">Vacant Clean</option>
            <option value="Vacant Dirty">Vacant Dirty</option>
            <option value="Occupied Clean">Occupied Clean</option>
            <option value="Occupied Dirty">Occupied Dirty</option>
            <option value="Cleaning">Cleaning in Progress</option>
            <option value="Cleaned">Cleaned (Inspection Req.)</option>
            <option value="Inspected">Inspected (Passed)</option>
            <option value="Out of Order">Out of Order (OOO)</option>
          </select>
        </div>

        {/* Occupancy */}
        <div>
          <select
            value={occupancyFilter}
            onChange={e => setOccupancyFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-400 transition-colors"
          >
            <option value="All">All Occupancies</option>
            <option value="Vacant">Vacant</option>
            <option value="Occupied">Occupied</option>
          </select>
        </div>
      </div>

      {/* Room Count Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl shadow-xs">
        <span>Showing <strong className="text-white font-bold">{filteredRooms.length}</strong> of {roomList.length} rooms</span>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs" /><span className="text-slate-200 font-medium">Vacant Clean</span></span>
          <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs" /><span className="text-slate-200 font-medium">Vacant Dirty</span></span>
          <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-xs" /><span className="text-slate-200 font-medium">Occupied Clean</span></span>
          <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-xs" /><span className="text-slate-200 font-medium">Cleaning</span></span>
          <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-xs" /><span className="text-slate-200 font-medium">OOO</span></span>
        </div>
      </div>

      {/* View Mode: GRID */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map(item => {
            const isClean = item.compoundStatus === 'Vacant Clean' || item.compoundStatus === 'Occupied Clean' || item.compoundStatus === 'Inspected';
            const isDirty = item.compoundStatus === 'Vacant Dirty' || item.compoundStatus === 'Occupied Dirty';
            const isCleaning = item.compoundStatus === 'Cleaning';
            const isInspected = item.compoundStatus === 'Inspected';
            const isOOO = item.compoundStatus === 'Out of Order';

            return (
              <div
                key={item.room.id}
                className={`rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between space-y-3 bg-slate-900/90 ${
                  isInspected
                    ? 'border-teal-500/40 hover:border-teal-500/70 shadow-sm shadow-teal-950/40'
                    : isClean
                    ? 'border-emerald-500/40 hover:border-emerald-500/70'
                    : isDirty
                    ? 'border-amber-500/40 hover:border-amber-500/70'
                    : isCleaning
                    ? 'border-purple-500/40 hover:border-purple-500/70'
                    : isOOO
                    ? 'border-red-500/40 hover:border-red-500/70'
                    : 'border-slate-800'
                }`}
              >
                {/* Top Row: Room Number & Status Badge */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-mono font-bold text-slate-100">
                        {item.room.roomNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.occupancy === 'Occupied'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {item.occupancy}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold flex items-center space-x-1 ${
                      isInspected
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : isClean
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isDirty
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : isCleaning
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : isOOO
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {isInspected && <ShieldCheck className="w-3 h-3" />}
                      {isClean && !isInspected && <CheckCircle2 className="w-3 h-3" />}
                      {isDirty && <Clock className="w-3 h-3" />}
                      {isCleaning && <RefreshCw className="w-3 h-3 animate-spin" />}
                      {isOOO && <Wrench className="w-3 h-3" />}
                      <span>{item.compoundStatus}</span>
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 mt-1">
                    {item.room.roomTypeName} • Floor {item.room.floor}
                  </div>
                </div>

                {/* Middle Info: Active Stay or Incoming Reservation */}
                <div className="space-y-1.5 py-2 border-y border-slate-800/60 text-[11px]">
                  {item.activeStay ? (
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5 text-slate-200 font-medium">
                        <User className="w-3 h-3 text-blue-400" />
                        <span className="truncate">{item.activeStay.guestName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Stay: {item.activeStay.stayNumber} (Out: {item.activeStay.expectedCheckOutAt ? item.activeStay.expectedCheckOutAt.split('T')[0] : 'N/A'})
                      </div>
                    </div>
                  ) : item.incomingRes ? (
                    <div className="text-emerald-400/90 flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span className="truncate">Arr: {item.incomingRes.guestName}</span>
                    </div>
                  ) : (
                    <div className="text-slate-400">Vacant • No in-house guest</div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Staff: <strong className="text-slate-300">{item.assignedAttendant}</strong></span>
                    <span>Cleaned: {item.lastCleaned}</span>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="space-y-2 pt-1">
                  {/* 1-Tap Quick Action Button for Mobile / Floor Operations */}
                  {item.compoundStatus.includes('Dirty') ? (
                    <button
                      onClick={(e) => handleQuickTurnaround(item, e)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Quick Mark Clean</span>
                    </button>
                  ) : item.compoundStatus === 'Cleaning' ? (
                    <button
                      onClick={(e) => handleQuickTurnaround(item, e)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Cleaning</span>
                    </button>
                  ) : (item.compoundStatus === 'Vacant Clean' || item.compoundStatus === 'Cleaned') ? (
                    <button
                      onClick={(e) => handleQuickTurnaround(item, e)}
                      className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Quick Mark Inspected</span>
                    </button>
                  ) : null}

                  <div className="flex items-center justify-between gap-1">
                    <button
                      onClick={() => handleOpenStatusModal(item)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-[11px] transition-colors flex-1 text-center"
                    >
                      Change Status
                    </button>

                    <button
                      onClick={() => setInspectionModalData({
                        isOpen: true,
                        roomId: item.room.id,
                        roomNumber: item.room.roomNumber,
                        roomTypeName: item.room.roomTypeName || 'Deluxe',
                        taskId: item.activeTask?.id,
                        attendantName: item.assignedAttendant
                      })}
                      className="p-1.5 bg-teal-950/60 hover:bg-teal-900/60 border border-teal-500/30 text-teal-300 rounded-lg text-xs transition-colors"
                      title="Supervisor Inspection"
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setMaintModal({
                        isOpen: true,
                        roomId: item.room.id,
                        roomNumber: item.room.roomNumber
                      })}
                      className="p-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-500/30 text-red-300 rounded-lg text-xs transition-colors"
                      title="Report Maintenance Issue / Block OOO"
                    >
                      <Wrench className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Mode: TABLE */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10.5px] tracking-wider">
                <tr>
                  <th className="p-3.5">Room</th>
                  <th className="p-3.5">Type & Floor</th>
                  <th className="p-3.5">Housekeeping Status</th>
                  <th className="p-3.5">Occupancy / In-House Guest</th>
                  <th className="p-3.5">Assigned Attendant</th>
                  <th className="p-3.5">Maintenance</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredRooms.map(item => (
                  <tr key={item.room.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-100 text-sm">
                      {item.room.roomNumber}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-200">{item.room.roomTypeName}</div>
                      <div className="text-[10.5px] text-slate-400">Floor {item.room.floor}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        item.compoundStatus === 'Inspected'
                          ? 'bg-teal-500/20 text-teal-300'
                          : item.compoundStatus === 'Vacant Clean' || item.compoundStatus === 'Occupied Clean'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : item.compoundStatus === 'Vacant Dirty' || item.compoundStatus === 'Occupied Dirty'
                          ? 'bg-amber-500/20 text-amber-300'
                          : item.compoundStatus === 'Cleaning'
                          ? 'bg-purple-500/20 text-purple-300'
                          : item.compoundStatus === 'Out of Order'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {item.compoundStatus}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {item.activeStay ? (
                        <div>
                          <div className="font-medium text-slate-100 flex items-center space-x-1">
                            <User className="w-3 h-3 text-blue-400" />
                            <span>{item.activeStay.guestName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">Stay #{item.activeStay.stayNumber}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Vacant</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="text-slate-300">{item.assignedAttendant}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[11px] font-medium ${item.maintenanceStatus !== 'Normal' ? 'text-red-400' : 'text-slate-400'}`}>
                        {item.maintenanceStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenStatusModal(item)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors"
                      >
                        Change Status
                      </button>
                      <button
                        onClick={() => setInspectionModalData({
                          isOpen: true,
                          roomId: item.room.id,
                          roomNumber: item.room.roomNumber,
                          roomTypeName: item.room.roomTypeName || 'Deluxe',
                          taskId: item.activeTask?.id,
                          attendantName: item.assignedAttendant
                        })}
                        className="px-2 py-1 bg-teal-950/60 hover:bg-teal-900 border border-teal-500/30 text-teal-300 font-semibold rounded-lg text-xs transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Quick Status Change */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100">Update Room Housekeeping Status</h3>
                <p className="text-xs text-slate-400">Room {statusModal.roomNumber} ({statusModal.roomTypeName})</p>
              </div>
              <button
                onClick={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Select New Status:</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as RoomHousekeepingStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Vacant Clean">Vacant Clean (FO Ready)</option>
                  <option value="Vacant Dirty">Vacant Dirty (Turnover Req.)</option>
                  <option value="Occupied Clean">Occupied Clean</option>
                  <option value="Occupied Dirty">Occupied Dirty</option>
                  <option value="Cleaning">Cleaning in Progress</option>
                  <option value="Cleaned">Cleaned (Inspection Req.)</option>
                  <option value="Inspected">Inspected (Passed)</option>
                  <option value="Out of Order">Out of Order (OOO Block)</option>
                  <option value="Out of Service">Out of Service</option>
                  <option value="Touch Up">Touch Up / Quick Refresh</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Department Audit Notes:</label>
                <textarea
                  rows={2}
                  value={statusRemarks}
                  onChange={e => setStatusRemarks(e.target.value)}
                  placeholder="e.g. Attendant verified refreshed towels and sanitized bed."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStatusChange}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-900/30"
              >
                Save & Synchronize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Discrepancy Resolution */}
      {selectedDiscrepancy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Reconcile Discrepancy • Room {selectedDiscrepancy.roomNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDiscrepancy(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Front Office Record:</span>
                <span className="font-bold text-blue-400">{selectedDiscrepancy.frontOfficeStatus}</span>
              </div>
              <p className="text-slate-300 text-[11px]">{selectedDiscrepancy.frontOfficeDetails}</p>

              <div className="h-px bg-slate-800 my-1" />

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Housekeeping Physical Scan:</span>
                <span className="font-bold text-amber-400">{selectedDiscrepancy.housekeepingStatus}</span>
              </div>
              <p className="text-slate-300 text-[11px]">{selectedDiscrepancy.housekeepingDetails}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Supervisor Decision (Verified Physical Reality):</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscrepancyResolution('Vacant')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      discrepancyResolution === 'Vacant'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Confirm Room is VACANT
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscrepancyResolution('Occupied')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      discrepancyResolution === 'Occupied'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Confirm Room is OCCUPIED
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Audit & Resolution Notes:</label>
                <textarea
                  rows={2}
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Physically inspected room with Front Office Duty Manager. Room is vacant, guest checked out at 08:00 AM."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedDiscrepancy(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveDiscrepancy}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-900/30"
              >
                Save Resolution & Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Report Maintenance / Block OOO */}
      {maintModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateMaintenance} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-bold text-slate-100">Report Issue for Room {maintModal.roomNumber}</h3>
              </div>
              <button
                type="button"
                onClick={() => setMaintModal({ isOpen: false, roomId: '', roomNumber: '' })}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Issue Title:</label>
                <input
                  type="text"
                  required
                  value={maintIssue}
                  onChange={e => setMaintIssue(e.target.value)}
                  placeholder="e.g. AC cooling leak / Bathroom shower head broken"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Priority Level:</label>
                <select
                  value={maintPriority}
                  onChange={e => setMaintPriority(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Critical">Critical / Emergency</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Detailed Description:</label>
                <textarea
                  rows={2}
                  value={maintDesc}
                  onChange={e => setMaintDesc(e.target.value)}
                  placeholder="Provide defect location and observations..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintBlockOOO}
                  onChange={e => setMaintBlockOOO(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-0 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-red-300 block">Block Room as Out of Order (OOO)</span>
                  <span className="text-[10.5px] text-slate-400">Front Desk cannot assign or check guests into this room until released.</span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMaintModal({ isOpen: false, roomId: '', roomNumber: '' })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-900/30"
              >
                Create Maintenance Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inspection Checklist Modal */}
      <HousekeepingInspectionModal
        isOpen={inspectionModalData.isOpen}
        onClose={() => setInspectionModalData(prev => ({ ...prev, isOpen: false }))}
        roomId={inspectionModalData.roomId}
        roomNumber={inspectionModalData.roomNumber}
        roomTypeName={inspectionModalData.roomTypeName}
        taskId={inspectionModalData.taskId}
        attendantName={inspectionModalData.attendantName}
      />
    </div>
  );
};
