import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, CheckCircle2, Clock, AlertTriangle, ShieldCheck,
  BedDouble, Plus, Search, Filter, RefreshCw, User,
  ArrowUpRight, Flame, ShieldAlert, Check, X,
  UserCheck, AlertCircle, Play, Eye, SlidersHorizontal,
  ChevronDown, Layers, Wrench
} from 'lucide-react';
import { housekeepingService } from '../../services/housekeepingService';
import { pmsService } from '../../services/pmsService';
import {
  HousekeepingDashboardStats,
  HousekeepingTaskEnhanced,
  CleaningType,
  TaskPriority,
  RoomHousekeepingStatus
} from '../../types/housekeeping';
import { Room, HousekeepingStatus } from '../../types/pms';
import { HousekeepingInspectionModal } from './HousekeepingInspectionModal';

interface HousekeepingDashboardProps {
  onSelectRoom?: (roomId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const HousekeepingDashboard: React.FC<HousekeepingDashboardProps> = ({
  onSelectRoom,
  onNavigateTab
}) => {
  const [stats, setStats] = useState<HousekeepingDashboardStats>(housekeepingService.getDashboardStats());
  const [tasks, setTasks] = useState<HousekeepingTaskEnhanced[]>(housekeepingService.getState().tasks);
  const [staff, setStaff] = useState(housekeepingService.getState().staff);
  const [rooms, setRooms] = useState<Room[]>(pmsService.getState().rooms);
  const [discrepancies, setDiscrepancies] = useState(housekeepingService.detectDiscrepancies());

  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'dirty' | 'in-progress' | 'inspection-pending' | 'clean' | 'inspected' | 'priority'>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [cleaningTypeFilter, setCleaningTypeFilter] = useState<string>('all');

  // Quick Action notification toast
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Inspection Modal State
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

  // Create Cleaning Task Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createRoomId, setCreateRoomId] = useState('');
  const [createCleaningType, setCreateCleaningType] = useState<CleaningType>('Checkout Cleaning');
  const [createPriority, setCreatePriority] = useState<TaskPriority>('Normal');
  const [createAttendantId, setCreateAttendantId] = useState('');
  const [createRemarks, setCreateRemarks] = useState('');

  // Re-assign Attendant Modal
  const [reassignTask, setReassignTask] = useState<HousekeepingTaskEnhanced | null>(null);
  const [reassignStaffId, setReassignStaffId] = useState('');

  useEffect(() => {
    const unsubHk = housekeepingService.subscribe(() => {
      setStats(housekeepingService.getDashboardStats());
      setTasks([...housekeepingService.getState().tasks]);
      setStaff([...housekeepingService.getState().staff]);
      setDiscrepancies(housekeepingService.detectDiscrepancies());
    });

    const unsubPms = pmsService.subscribe(() => {
      setStats(housekeepingService.getDashboardStats());
      setRooms([...pmsService.getState().rooms]);
      setDiscrepancies(housekeepingService.detectDiscrepancies());
    });

    return () => {
      unsubHk();
      unsubPms();
    };
  }, []);

  const notifyAction = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => {
      setActionNotice(null);
    }, 3000);
  };

  // Available floors for dropdown
  const uniqueFloors = useMemo(() => {
    const floorSet = new Set<string>();
    rooms.forEach(r => {
      if (r.floor) floorSet.add(r.floor.toString());
      else if (r.roomNumber) {
        const f = r.roomNumber.charAt(0);
        floorSet.add(f);
      }
    });
    return Array.from(floorSet).sort();
  }, [rooms]);

  // Combined Room & Cleaning Task state map
  const enrichedRooms = useMemo(() => {
    return rooms.map(room => {
      // Find active cleaning task for room
      const activeTask = tasks.find(t => t.roomId === room.id && t.status !== 'Inspected');
      const latestTask = tasks.filter(t => t.roomId === room.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      const task = activeTask || latestTask;

      const floor = room.floor?.toString() || room.roomNumber.charAt(0);
      const isDirty = room.housekeepingStatus === 'Dirty';
      const isCleaning = room.housekeepingStatus === 'Cleaning' || task?.status === 'In Progress';
      const isInspected = room.housekeepingStatus === 'Inspected' || task?.status === 'Inspected';
      const isClean = room.housekeepingStatus === 'Clean' || task?.status === 'Cleaned';
      const isInspectionPending = task?.status === 'Inspection Pending';
      const isPriority = task?.priority === 'VIP' || task?.priority === 'Urgent' || task?.priority === 'High';

      return {
        room,
        task,
        floor,
        isDirty,
        isCleaning,
        isClean,
        isInspected,
        isInspectionPending,
        isPriority
      };
    });
  }, [rooms, tasks]);

  // Filtered room cleaning list
  const filteredRooms = useMemo(() => {
    return enrichedRooms.filter(item => {
      const { room, task, floor, isDirty, isCleaning, isClean, isInspected, isInspectionPending, isPriority } = item;

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRoom = room.roomNumber.toLowerCase().includes(query);
        const matchesType = room.roomTypeName?.toLowerCase().includes(query);
        const matchesStaff = task?.assignedAttendantName?.toLowerCase().includes(query);
        const matchesRemarks = task?.remarks?.toLowerCase().includes(query);
        if (!matchesRoom && !matchesType && !matchesStaff && !matchesRemarks) return false;
      }

      // Floor filter
      if (floorFilter !== 'all' && floor !== floorFilter) {
        return false;
      }

      // Cleaning type filter
      if (cleaningTypeFilter !== 'all' && task?.cleaningType !== cleaningTypeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'dirty') return isDirty;
      if (statusFilter === 'in-progress') return isCleaning;
      if (statusFilter === 'inspection-pending') return isInspectionPending;
      if (statusFilter === 'clean') return isClean;
      if (statusFilter === 'inspected') return isInspected;
      if (statusFilter === 'priority') return isPriority;

      return true;
    });
  }, [enrichedRooms, searchQuery, statusFilter, floorFilter, cleaningTypeFilter]);

  // Operational Counts
  const dirtyCount = enrichedRooms.filter(r => r.isDirty).length;
  const inProgressCount = enrichedRooms.filter(r => r.isCleaning).length;
  const inspectionPendingCount = enrichedRooms.filter(r => r.isInspectionPending).length;
  const cleanCount = enrichedRooms.filter(r => r.isClean && !r.isInspected).length;
  const inspectedCount = enrichedRooms.filter(r => r.isInspected).length;
  const priorityCount = enrichedRooms.filter(r => r.isPriority).length;
  const vacantCleanCount = enrichedRooms.filter(r => r.room.operationalStatus !== 'Occupied' && (r.isClean || r.isInspected)).length;

  const totalRooms = rooms.length || 1;
  const readyRooms = cleanCount + inspectedCount;
  const turnoverProgressPercent = Math.round((readyRooms / totalRooms) * 100);

  // 1-Click Operations
  const handleStartCleaning = (room: Room, existingTask?: HousekeepingTaskEnhanced) => {
    if (existingTask) {
      housekeepingService.startCleaningTask(existingTask.id);
    } else {
      // Create and start instant task
      const isOccupied = room.operationalStatus === 'Occupied';
      const newTask = housekeepingService.createCleaningTask({
        roomId: room.id,
        cleaningType: isOccupied ? 'Stayover Cleaning' : 'Checkout Cleaning',
        priority: 'Normal',
        remarks: 'Direct start from room cleaning dashboard'
      });
      housekeepingService.startCleaningTask(newTask.id);
    }
    pmsService.updateHousekeepingStatus(room.id, 'Cleaning', 'Attendant active in room');
    notifyAction(`Cleaning started for Room ${room.roomNumber}`);
  };

  const handleCompleteCleaning = (room: Room, task?: HousekeepingTaskEnhanced) => {
    if (task) {
      housekeepingService.completeCleaningTask(task.id);
    } else {
      pmsService.updateHousekeepingStatus(room.id, 'Clean', 'Turnover completed by attendant');
    }
    notifyAction(`Room ${room.roomNumber} marked clean & ready for supervisor inspection`);
  };

  const handleQuickStatusChange = (roomId: string, newStatus: HousekeepingStatus) => {
    const targetRoom = rooms.find(r => r.id === roomId);
    pmsService.updateHousekeepingStatus(roomId, newStatus, 'Quick update from room cleaning dashboard');
    notifyAction(`Room ${targetRoom?.roomNumber || ''} status updated to ${newStatus}`);
  };

  const handleOpenInspection = (room: Room, task?: HousekeepingTaskEnhanced) => {
    setInspectionModalData({
      isOpen: true,
      roomId: room.id,
      roomNumber: room.roomNumber,
      roomTypeName: room.roomTypeName || 'Deluxe Room',
      taskId: task?.id,
      attendantName: task?.assignedAttendantName
    });
  };

  const handleQuickReleaseInspected = (room: Room) => {
    pmsService.updateHousekeepingStatus(room.id, 'Inspected', 'Direct supervisor release to Front Office');
    notifyAction(`Room ${room.roomNumber} verified & released to Front Office as Inspected`);
  };

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createRoomId) return;

    housekeepingService.createCleaningTask({
      roomId: createRoomId,
      cleaningType: createCleaningType,
      priority: createPriority,
      assignedAttendantId: createAttendantId || undefined,
      remarks: createRemarks.trim() || undefined
    });

    const targetRoom = rooms.find(r => r.id === createRoomId);
    notifyAction(`Cleaning task dispatched for Room ${targetRoom?.roomNumber || ''}`);
    setIsCreateModalOpen(false);
    setCreateRoomId('');
    setCreateRemarks('');
  };

  const handleSaveReassign = () => {
    if (!reassignTask || !reassignStaffId) return;
    housekeepingService.assignTask(reassignTask.id, reassignStaffId);
    const assignedStaff = staff.find(s => s.id === reassignStaffId);
    notifyAction(`Room ${reassignTask.roomNumber} assigned to ${assignedStaff?.name || 'Staff'}`);
    setReassignTask(null);
    setReassignStaffId('');
  };

  return (
    <div className="space-y-5 text-slate-100">
      {/* Toast Notification */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-bold text-slate-100 uppercase tracking-tight">
                Housekeeping Room Cleaning Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE TURNOVER</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Rapid room cleaning operations, attendant task dispatch, real-time cleanliness status, and supervisor quality release.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-blue-900/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Cleaning Task</span>
          </button>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('status')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors flex items-center space-x-1.5"
            >
              <BedDouble className="w-4 h-4 text-blue-400" />
              <span>Room Status Grid</span>
            </button>
          )}
        </div>
      </div>

      {/* Discrepancy Alert Bar (If any open discrepancies between FO & HK) */}
      {discrepancies.filter(d => d.status === 'Open').length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300">
                Front Office ↔ Housekeeping Discrepancy Detected ({discrepancies.filter(d => d.status === 'Open').length} Room)
              </div>
              <div className="text-[11px] text-amber-400/80 mt-0.5">
                Physical occupancy check differs from Front Office reservation register. Please verify rooms.
              </div>
            </div>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('status')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition-colors whitespace-nowrap"
            >
              Verify Discrepancies
            </button>
          )}
        </div>
      )}

      {/* Primary Room Cleaning KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Inventory & Turnover Rate */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'all'
              ? 'bg-slate-800/90 border-blue-500 shadow-xs ring-1 ring-blue-500/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Total Rooms</span>
            <BedDouble className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-slate-100">{totalRooms}</span>
            <div className="mt-1.5 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${turnoverProgressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-emerald-400 font-medium mt-1 block">
              {turnoverProgressPercent}% Ready for Guests
            </span>
          </div>
        </div>

        {/* Dirty / Needs Cleaning */}
        <div
          onClick={() => setStatusFilter('dirty')}
          className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'dirty'
              ? 'bg-rose-950/40 border-rose-500 shadow-xs ring-1 ring-rose-500/40'
              : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-300">Needs Cleaning</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-rose-200">{dirtyCount}</span>
              <span className="text-[11px] text-rose-400 font-medium">Dirty</span>
            </div>
            <span className="text-[10.5px] text-rose-400/80 font-medium block mt-1">
              Checkout & Stayovers
            </span>
          </div>
        </div>

        {/* Cleaning In Progress */}
        <div
          onClick={() => setStatusFilter('in-progress')}
          className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'in-progress'
              ? 'bg-purple-950/40 border-purple-500 shadow-xs ring-1 ring-purple-500/40'
              : 'bg-purple-950/20 border-purple-500/30 hover:border-purple-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-purple-300">In Progress</span>
            <RefreshCw className={`w-4 h-4 text-purple-400 ${inProgressCount > 0 ? 'animate-spin' : ''}`} />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-purple-200">{inProgressCount}</span>
              <span className="text-[11px] text-purple-400 font-medium">Active</span>
            </div>
            <span className="text-[10.5px] text-purple-400/80 font-medium block mt-1">
              Attendants inside room
            </span>
          </div>
        </div>

        {/* Ready for Inspection */}
        <div
          onClick={() => setStatusFilter('clean')}
          className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'clean'
              ? 'bg-blue-950/40 border-blue-500 shadow-xs ring-1 ring-blue-500/40'
              : 'bg-blue-950/20 border-blue-500/30 hover:border-blue-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-300">Cleaned</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-blue-200">{cleanCount}</span>
              <span className="text-[11px] text-blue-400 font-medium">Turned Over</span>
            </div>
            <span className="text-[10.5px] text-blue-400/80 font-medium block mt-1">
              {inspectionPendingCount > 0 ? `${inspectionPendingCount} audit ready` : 'Awaiting inspection'}
            </span>
          </div>
        </div>

        {/* Supervisor Inspected & Released */}
        <div
          onClick={() => setStatusFilter('inspected')}
          className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'inspected'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-xs ring-1 ring-emerald-500/40'
              : 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-300">Inspected</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-200">{inspectedCount}</span>
              <span className="text-[11px] text-emerald-400 font-medium">Passed</span>
            </div>
            <span className="text-[10.5px] text-emerald-400/80 font-medium block mt-1">
              100% Quality Certified
            </span>
          </div>
        </div>

        {/* Priority & VIP Turnovers */}
        <div
          onClick={() => setStatusFilter('priority')}
          className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'priority'
              ? 'bg-amber-950/40 border-amber-500 shadow-xs ring-1 ring-amber-500/40'
              : 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-300">Priority / VIP</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-amber-200">{priorityCount}</span>
              <span className="text-[11px] text-amber-400 font-medium">Urgent</span>
            </div>
            <span className="text-[10.5px] text-amber-400/80 font-medium block mt-1">
              Front Office Requested
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search, and Cleaning Sub-Tabs */}
      <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xs">
        {/* Cleaning Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Rooms ({totalRooms})
          </button>

          <button
            onClick={() => setStatusFilter('dirty')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
              statusFilter === 'dirty'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Needs Cleaning ({dirtyCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('in-progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
              statusFilter === 'in-progress'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/40'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>In Progress ({inProgressCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('clean')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
              statusFilter === 'clean'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Cleaned ({cleanCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('inspected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
              statusFilter === 'inspected'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Inspected ({inspectedCount})</span>
          </button>

          {priorityCount > 0 && (
            <button
              onClick={() => setStatusFilter('priority')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
                statusFilter === 'priority'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Priority / VIP ({priorityCount})</span>
            </button>
          )}
        </div>

        {/* Right Controls: Floor selector, Cleaning Type, and Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Floor selector */}
          <div className="flex items-center space-x-1 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-slate-400 text-[11px]">Floor:</span>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Floors</option>
              {uniqueFloors.map(fl => (
                <option key={fl} value={fl} className="bg-slate-900 text-slate-200">Floor {fl}</option>
              ))}
            </select>
          </div>

          {/* Cleaning Type filter */}
          <div className="flex items-center space-x-1 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-slate-400 text-[11px]">Type:</span>
            <select
              value={cleaningTypeFilter}
              onChange={(e) => setCleaningTypeFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Types</option>
              <option value="Checkout Cleaning" className="bg-slate-900 text-slate-200">Checkout Cleaning</option>
              <option value="Stayover Cleaning" className="bg-slate-900 text-slate-200">Stayover Cleaning</option>
              <option value="Deep Cleaning" className="bg-slate-900 text-slate-200">Deep Cleaning</option>
              <option value="VIP Cleaning" className="bg-slate-900 text-slate-200">VIP Cleaning</option>
              <option value="Post-Maintenance Cleaning" className="bg-slate-900 text-slate-200">Post-Maintenance</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room, attendant..."
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Room Cleaning Operation Console Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="p-3.5 bg-slate-850/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-slate-100">
              Active Room Cleaning Pipeline ({filteredRooms.length} Rooms displayed)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Direct 1-click status actions: Start Cleaning, Mark Clean, or Supervisor Quality Release.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/70 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Room # & Floor</th>
                <th className="py-3 px-4">Category & Occupancy</th>
                <th className="py-3 px-4">Cleanliness State</th>
                <th className="py-3 px-4">Cleaning Task & Type</th>
                <th className="py-3 px-4">Assigned Attendant</th>
                <th className="py-3 px-4 text-center">Room Cleaning Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <BedDouble className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="font-semibold text-slate-300">No rooms matching current criteria</p>
                      <p className="text-[11px] text-slate-500">
                        Adjust search keywords or select "All Rooms" filter to view full inventory.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('all');
                          setSearchQuery('');
                          setFloorFilter('all');
                          setCleaningTypeFilter('all');
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRooms.map(({ room, task, floor, isDirty, isCleaning, isClean, isInspected, isPriority }) => {
                  return (
                    <tr
                      key={room.id}
                      className="hover:bg-slate-850/50 transition-colors"
                    >
                      {/* Room & Floor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => onSelectRoom && onSelectRoom(room.id)}
                            className="font-mono font-bold text-sm px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-blue-600 text-blue-300 hover:text-white transition border border-slate-700"
                            title="Click to view room details"
                          >
                            {room.roomNumber}
                          </button>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 font-mono block">Floor {floor}</span>
                            {isPriority && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                VIP
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category & Occupancy */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{room.roomTypeName || 'Room'}</div>
                        <div className="flex items-center space-x-1.5 text-[10.5px] mt-0.5">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            room.operationalStatus === 'Occupied' ? 'bg-amber-400' : 'bg-emerald-400'
                          }`} />
                          <span className="text-slate-400">
                            {room.operationalStatus === 'Occupied' ? 'Occupied' : 'Vacant'}
                          </span>
                        </div>
                      </td>

                      {/* Cleanliness State & Quick Dropdown */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isCleaning
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : isInspected
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : isClean
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                              : isDirty
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : room.operationalStatus === 'Out of Order'
                              ? 'bg-red-500/20 text-red-300 border-red-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {isCleaning ? 'Cleaning In Progress' :
                             isInspected ? 'Supervisor Inspected' :
                             isClean ? 'Clean (Pending Release)' :
                             isDirty ? 'Dirty (Turnover Needed)' :
                             room.housekeepingStatus}
                          </span>

                          {/* Quick change dropdown */}
                          <div className="relative group">
                            <select
                              value={room.housekeepingStatus}
                              onChange={(e) => handleQuickStatusChange(room.id, e.target.value as HousekeepingStatus)}
                              className="opacity-0 group-hover:opacity-100 absolute inset-0 w-full h-full cursor-pointer z-10"
                              title="Quickly change room status"
                            >
                              <option value="Dirty">Dirty</option>
                              <option value="Cleaning">Cleaning</option>
                              <option value="Clean">Clean</option>
                              <option value="Inspected">Inspected</option>
                              <option value="Touch Up">Touch Up</option>
                            </select>
                            <button
                              type="button"
                              className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition text-[10px]"
                              title="Manual status override"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Cleaning Task & Type */}
                      <td className="py-3 px-4">
                        {task ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
                              <span>{task.cleaningType}</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                task.priority === 'VIP' ? 'bg-amber-500/20 text-amber-300' :
                                task.priority === 'Urgent' ? 'bg-red-500/20 text-red-300' :
                                task.priority === 'High' ? 'bg-orange-500/20 text-orange-300' :
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                            {task.remarks && (
                              <p className="text-[10px] text-slate-400 italic line-clamp-1">"{task.remarks}"</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            {isDirty ? 'Awaiting task dispatch' : 'No active task'}
                          </span>
                        )}
                      </td>

                      {/* Assigned Attendant */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[10px] font-bold text-blue-400">
                            {task?.assignedAttendantName ? task.assignedAttendantName.charAt(0) : <User className="w-3 h-3 text-slate-500" />}
                          </div>
                          <div>
                            <span className="text-xs font-medium text-slate-200 block">
                              {task?.assignedAttendantName || 'Unassigned'}
                            </span>
                            {task && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReassignTask(task);
                                  setReassignStaffId(task.assignedAttendantId || '');
                                }}
                                className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline"
                              >
                                Change
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Room Cleaning Action Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Case 1: Room is Dirty -> "Start Cleaning" */}
                          {isDirty && (
                            <button
                              type="button"
                              onClick={() => handleStartCleaning(room, task)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition shadow-xs"
                              title="Attendant enters room and begins cleaning turnover"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span>Start Cleaning</span>
                            </button>
                          )}

                          {/* Case 2: Room is Cleaning In Progress -> "Mark Clean" */}
                          {isCleaning && (
                            <button
                              type="button"
                              onClick={() => handleCompleteCleaning(room, task)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs transition shadow-xs"
                              title="Turnover complete, mark room clean"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark Clean</span>
                            </button>
                          )}

                          {/* Case 3: Room is Clean (Pending Inspection) -> "Inspect & Release" */}
                          {isClean && !isInspected && (
                            <button
                              type="button"
                              onClick={() => handleOpenInspection(room, task)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs transition shadow-xs"
                              title="Open 16-point supervisor checklist to audit and release"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Inspect & Release</span>
                            </button>
                          )}

                          {/* Quick Release Inspected Button for fast supervisor workflow */}
                          {isClean && !isInspected && (
                            <button
                              type="button"
                              onClick={() => handleQuickReleaseInspected(room)}
                              className="p-1.5 bg-emerald-950/40 hover:bg-emerald-800/60 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs transition"
                              title="1-Click fast release without checklist"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Case 4: Room is already Inspected -> Show passed badge and touch-up option */}
                          {isInspected && (
                            <div className="flex items-center space-x-1">
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Front Office Ready</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuickStatusChange(room.id, 'Dirty')}
                                className="text-[10px] text-slate-500 hover:text-rose-400 p-1"
                                title="Re-flag as dirty for touch-up"
                              >
                                Re-clean
                              </button>
                            </div>
                          )}

                          {/* Out of Order button */}
                          {(room.operationalStatus === 'Out of Order' || (room.housekeepingStatus as any) === 'Out of Order') && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(room.id, 'Dirty')}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition flex items-center space-x-1"
                            >
                              <Wrench className="w-3 h-3" />
                              <span>Release to Dirty</span>
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

      {/* Attendants Room Cleaning Distribution Summary */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              On-Duty Attendants Room Cleaning Allocation
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {staff.filter(s => s.role === 'Attendant').length} Attendants on Shift
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {staff.filter(s => s.role === 'Attendant').map(attendant => {
            const assignedRooms = tasks.filter(t => t.assignedAttendantId === attendant.id);
            const inProgress = assignedRooms.filter(t => t.status === 'In Progress').length;
            const completed = assignedRooms.filter(t => t.status === 'Cleaned' || t.status === 'Inspected').length;

            return (
              <div
                key={attendant.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                    {attendant.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{attendant.name}</div>
                    <div className="text-[10px] text-slate-400">Floor {attendant.assignedFloor}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-200">
                    {completed} / {assignedRooms.length} Cleaned
                  </div>
                  <div className="text-[10px] text-purple-400">
                    {inProgress > 0 ? `${inProgress} active now` : 'Ready for dispatch'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE CLEANING TASK MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">Create New Room Cleaning Task</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="p-5 space-y-4 text-xs">
              {/* Select Room */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold">Select Room *</label>
                <select
                  required
                  value={createRoomId}
                  onChange={(e) => setCreateRoomId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Room --</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.roomTypeName}) — Status: {r.housekeepingStatus}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cleaning Type */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold">Cleaning Type *</label>
                <select
                  value={createCleaningType}
                  onChange={(e) => setCreateCleaningType(e.target.value as CleaningType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Checkout Cleaning">Checkout Cleaning (Full Turnover)</option>
                  <option value="Stayover Cleaning">Stayover Cleaning (Daily Refresh)</option>
                  <option value="Deep Cleaning">Deep Cleaning (Quarterly Intensive)</option>
                  <option value="VIP Cleaning">VIP Cleaning (Express Turnover)</option>
                  <option value="Post-Maintenance Cleaning">Post-Maintenance Cleaning</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold">Priority Level *</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Normal', 'High', 'Urgent', 'VIP'] as TaskPriority[]).map(p => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setCreatePriority(p)}
                      className={`py-2 rounded-lg font-bold text-center border transition ${
                        createPriority === p
                          ? p === 'VIP' ? 'bg-amber-500 text-slate-950 border-amber-400' :
                            p === 'Urgent' ? 'bg-red-600 text-white border-red-500' :
                            p === 'High' ? 'bg-orange-600 text-white border-orange-500' :
                            'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assigned Housekeeper */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold">Assign Housekeeper (Optional)</label>
                <select
                  value={createAttendantId}
                  onChange={(e) => setCreateAttendantId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Auto-Assign / Queue on Floor</option>
                  {staff.filter(s => s.role === 'Attendant').map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Floor {s.assignedFloor})
                    </option>
                  ))}
                </select>
              </div>

              {/* Special Instructions / Remarks */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold">Special Instructions</label>
                <textarea
                  rows={2}
                  value={createRemarks}
                  onChange={(e) => setCreateRemarks(e.target.value)}
                  placeholder="e.g., Guest arriving at 2 PM, extra mineral water, change duvet..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md shadow-blue-900/30"
                >
                  Dispatch Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN ATTENDANT MODAL */}
      {reassignTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100">
                Reassign Room {reassignTask.roomNumber}
              </h3>
              <button
                onClick={() => setReassignTask(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-slate-300 font-medium">Select Attendant:</label>
              <select
                value={reassignStaffId}
                onChange={(e) => setReassignStaffId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Choose Attendant --</option>
                {staff.filter(s => s.role === 'Attendant').map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Floor {s.assignedFloor})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReassignTask(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReassign}
                disabled={!reassignStaffId}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
              >
                Confirm Reassign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPERVISOR INSPECTION MODAL */}
      <HousekeepingInspectionModal
        isOpen={inspectionModalData.isOpen}
        onClose={() => setInspectionModalData(prev => ({ ...prev, isOpen: false }))}
        roomId={inspectionModalData.roomId}
        roomNumber={inspectionModalData.roomNumber}
        roomTypeName={inspectionModalData.roomTypeName}
        taskId={inspectionModalData.taskId}
        attendantName={inspectionModalData.attendantName}
        onSuccess={() => {
          notifyAction(`Room ${inspectionModalData.roomNumber} passed inspection & certified for check-in!`);
        }}
      />
    </div>
  );
};
