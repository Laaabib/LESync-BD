import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, RefreshCw, User, BedDouble,
  Clock, CheckCircle2, AlertTriangle, ShieldCheck, XCircle,
  MoreVertical, Check, X, History, Sparkles, Flame, Eye,
  ArrowRight, UserCheck, Layers, FileText, Play
} from 'lucide-react';
import { housekeepingService } from '../../services/housekeepingService';
import { pmsService } from '../../services/pmsService';
import {
  HousekeepingTaskEnhanced,
  CleaningType,
  TaskPriority,
  CleaningTaskStatus
} from '../../types/housekeeping';
import { HousekeepingInspectionModal } from './HousekeepingInspectionModal';

export const HousekeepingCleaningView: React.FC = () => {
  const [tasks, setTasks] = useState<HousekeepingTaskEnhanced[]>(housekeepingService.getState().tasks);
  const [staff, setStaff] = useState(housekeepingService.getState().staff);
  const [rooms, setRooms] = useState(pmsService.getState().rooms);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [attendantFilter, setAttendantFilter] = useState('All');

  // Create Task Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoomId, setNewRoomId] = useState('');
  const [newCleaningType, setNewCleaningType] = useState<CleaningType>('Checkout Cleaning');
  const [newPriority, setNewPriority] = useState<TaskPriority>('Normal');
  const [newAttendantId, setNewAttendantId] = useState('');
  const [newRemarks, setNewRemarks] = useState('');

  // Complete / Checklist Modal
  const [checklistModalTask, setChecklistModalTask] = useState<HousekeepingTaskEnhanced | null>(null);
  const [checklistState, setChecklistState] = useState<HousekeepingTaskEnhanced['checklist']>({
    bedLinenChanged: true,
    pillowCasesReplaced: true,
    bathroomSanitized: true,
    towelsReplaced: true,
    amenitiesRestocked: true,
    floorVacuumedMopped: true,
    dustingSurfacesCleaned: true,
    trashEmptied: true,
    minibarChecked: true,
    acTvWorking: true,
    odorFree: true
  });
  const [completeRemarks, setCompleteRemarks] = useState('');

  // Re-assign Modal
  const [reassignTask, setReassignTask] = useState<HousekeepingTaskEnhanced | null>(null);
  const [reassignStaffId, setReassignStaffId] = useState('');

  // Reject / Reason Modal
  const [rejectTask, setRejectTask] = useState<HousekeepingTaskEnhanced | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // History Drawer
  const [historyTask, setHistoryTask] = useState<HousekeepingTaskEnhanced | null>(null);

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

  useEffect(() => {
    const unsub = housekeepingService.subscribe(s => {
      setTasks([...s.tasks]);
      setStaff([...s.staff]);
      setRooms([...pmsService.getState().rooms]);
    });
    return unsub;
  }, []);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomId) return;

    housekeepingService.createCleaningTask({
      roomId: newRoomId,
      cleaningType: newCleaningType,
      priority: newPriority,
      assignedAttendantId: newAttendantId || undefined,
      remarks: newRemarks
    });

    setIsCreateModalOpen(false);
    setNewRoomId('');
    setNewRemarks('');
  };

  const handleStartTask = (taskId: string) => {
    housekeepingService.startCleaningTask(taskId);
  };

  const handleOpenChecklistModal = (task: HousekeepingTaskEnhanced) => {
    setChecklistModalTask(task);
    setChecklistState(task.checklist);
    setCompleteRemarks(task.remarks || '');
  };

  const handleSaveChecklistAndComplete = () => {
    if (!checklistModalTask) return;
    housekeepingService.completeCleaningTask(checklistModalTask.id, checklistState, completeRemarks);
    setChecklistModalTask(null);
  };

  const handleSaveReassign = () => {
    if (!reassignTask || !reassignStaffId) return;
    housekeepingService.assignTask(reassignTask.id, reassignStaffId);
    setReassignTask(null);
  };

  const handleSaveReject = () => {
    if (!rejectTask || !rejectReason.trim()) return;
    housekeepingService.rejectCleaningTask(rejectTask.id, rejectReason);
    setRejectTask(null);
    setRejectReason('');
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
    if (typeFilter !== 'All' && t.cleaningType !== typeFilter) return false;
    if (attendantFilter !== 'All' && t.assignedAttendantId !== attendantFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = t.roomNumber.toLowerCase().includes(q);
      const matchType = t.roomTypeName.toLowerCase().includes(q);
      const matchStaff = t.assignedAttendantName?.toLowerCase().includes(q);
      const matchTaskNum = t.taskNumber.toLowerCase().includes(q);
      if (!matchNum && !matchType && !matchStaff && !matchTaskNum) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-md">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight">
                Room Cleaning Tasks & Work Orders
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                ACTIVE QUEUE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Assign attendants, track cleaning progress, verify checklists, and enforce inspection standards.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-md shadow-blue-900/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Cleaning Task</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search room #, task #, staff..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending Assignment</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Cleaned">Cleaned (Inspection Req.)</option>
            <option value="Inspection Pending">Inspection Pending</option>
            <option value="Inspected">Inspected (Passed)</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Priorities</option>
            <option value="Normal">Normal Priority</option>
            <option value="High">High Priority</option>
            <option value="VIP">VIP</option>
            <option value="Urgent">Urgent / Turnaround</option>
          </select>
        </div>

        {/* Cleaning Type Filter */}
        <div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Cleaning Types</option>
            <option value="Checkout Cleaning">Checkout Cleaning</option>
            <option value="Stayover Cleaning">Stayover Cleaning</option>
            <option value="Deep Cleaning">Deep Cleaning</option>
            <option value="VIP Cleaning">VIP Cleaning</option>
            <option value="Special Cleaning">Special Cleaning</option>
            <option value="Turndown">Turndown</option>
            <option value="Post-Maintenance Cleaning">Post-Maintenance Cleaning</option>
          </select>
        </div>

        {/* Attendant Filter */}
        <div>
          <select
            value={attendantFilter}
            onChange={e => setAttendantFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Attendants</option>
            {staff.filter(s => s.role === 'Attendant').map(s => (
              <option key={s.id} value={s.id}>{s.name} (Floor {s.assignedFloor})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task Count & KPI Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl shadow-xs">
        <span>Showing <strong className="text-white font-bold">{filteredTasks.length}</strong> tasks</span>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-xs" /><span className="text-slate-200 font-medium">In Progress</span></span>
          <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-xs" /><span className="text-slate-200 font-medium">Cleaned</span></span>
          <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-xs" /><span className="text-slate-200 font-medium">Inspected</span></span>
          <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-xs" /><span className="text-slate-200 font-medium">Rejected</span></span>
        </div>
      </div>

      {/* Mobile Task Cards (Quick Housekeeping Operations for Attendants on Mobile) */}
      <div className="lg:hidden space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
            No cleaning tasks found matching current filters.
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3"
            >
              {/* Header: Room Number, Priority, Status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 font-mono font-bold flex items-center justify-center text-sm border border-blue-500/30">
                    {task.roomNumber}
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 flex items-center space-x-1.5 text-sm">
                      <span>Room {task.roomNumber}</span>
                      {task.isVip && (
                        <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] rounded font-bold">
                          VIP
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{task.taskNumber} • Floor {task.floor}</div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    task.status === 'In Progress' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    task.status === 'Cleaned' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    task.status === 'Inspected' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                    task.status === 'Rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {task.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                    task.priority === 'VIP' ? 'bg-amber-500/20 text-amber-300' :
                    task.priority === 'Urgent' ? 'bg-red-500/20 text-red-300' :
                    task.priority === 'High' ? 'bg-orange-500/20 text-orange-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>

              {/* Task Details */}
              <div className="py-2 border-y border-slate-800/80 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="font-semibold text-white">{task.cleaningType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Attendant:</span>
                  <div className="flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-200">
                      {task.assignedAttendantName || <span className="text-slate-500 italic">Unassigned</span>}
                    </span>
                  </div>
                </div>
                {task.remarks && (
                  <p className="text-[11px] text-amber-300/80 italic pt-1">
                    "{task.remarks}"
                  </p>
                )}
              </div>

              {/* Mobile Big Touch Action Buttons */}
              <div className="pt-1">
                {task.status === 'Pending' || task.status === 'Assigned' ? (
                  <button
                    onClick={() => handleStartTask(task.id)}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Cleaning Task</span>
                  </button>
                ) : task.status === 'In Progress' ? (
                  <button
                    onClick={() => handleOpenChecklistModal(task)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Checklist &amp; Finish</span>
                  </button>
                ) : task.status === 'Cleaned' || task.status === 'Inspection Pending' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setInspectionModalData({
                        isOpen: true,
                        roomId: task.roomId,
                        roomNumber: task.roomNumber,
                        roomTypeName: task.roomTypeName,
                        taskId: task.id,
                        attendantName: task.assignedAttendantName
                      })}
                      className="py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Inspect Room</span>
                    </button>
                    <button
                      onClick={() => {
                        setRejectTask(task);
                        setRejectReason('');
                      }}
                      className="py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject &amp; Rework</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-teal-300 bg-teal-950/30 border border-teal-500/20 p-2 rounded-xl">
                    <span className="flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-400" />
                      <span>Room Inspected &amp; Turnaround Ready</span>
                    </span>
                    <button
                      onClick={() => setHistoryTask(task)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="History"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Tasks Table */}
      <div className="hidden lg:block rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10.5px] tracking-wider">
              <tr>
                <th className="p-3.5">Task & Room</th>
                <th className="p-3.5">Cleaning Type</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Assigned Attendant</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No cleaning tasks found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Room & Task # */}
                    <td className="p-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 font-mono font-bold flex items-center justify-center text-xs">
                          {task.roomNumber}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                            <span>Room {task.roomNumber}</span>
                            {task.isVip && (
                              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 font-sans text-[10px] rounded font-bold">
                                VIP
                              </span>
                            )}
                          </div>
                          <div className="text-[10.5px] text-slate-400 font-mono">{task.taskNumber} • Floor {task.floor}</div>
                        </div>
                      </div>
                    </td>

                    {/* Cleaning Type */}
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-200">{task.cleaningType}</div>
                      {task.remarks && (
                        <div className="text-[10.5px] text-slate-400 line-clamp-1 italic">
                          "{task.remarks}"
                        </div>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                        task.priority === 'VIP'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : task.priority === 'Urgent'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : task.priority === 'High'
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {task.priority}
                      </span>
                    </td>

                    {/* Assigned Attendant */}
                    <td className="p-3.5">
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-200">
                          {task.assignedAttendantName || <span className="text-slate-500 italic">Unassigned</span>}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setReassignTask(task);
                          setReassignStaffId(task.assignedAttendantId || '');
                        }}
                        className="text-[10px] text-blue-400 hover:text-blue-300 underline mt-0.5 block"
                      >
                        Reassign
                      </button>
                    </td>

                    {/* Duration */}
                    <td className="p-3.5 text-slate-400">
                      <div className="text-slate-300 font-mono">
                        {task.actualDurationMinutes ? `${task.actualDurationMinutes} mins` : `Est: ${task.estimatedDurationMinutes}m`}
                      </div>
                      <div className="text-[10px]">
                        {task.startedAt ? `Started: ${new Date(task.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not started'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        task.status === 'In Progress'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : task.status === 'Cleaned'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : task.status === 'Inspection Pending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : task.status === 'Inspected'
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          : task.status === 'Rejected'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {task.status}
                      </span>
                    </td>

                    {/* Workflow Action Buttons */}
                    <td className="p-3.5 text-right space-x-1.5">
                      {task.status === 'Pending' || task.status === 'Assigned' ? (
                        <button
                          onClick={() => handleStartTask(task.id)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
                        >
                          Start Cleaning
                        </button>
                      ) : task.status === 'In Progress' ? (
                        <button
                          onClick={() => handleOpenChecklistModal(task)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
                        >
                          Checklist & Finish
                        </button>
                      ) : task.status === 'Cleaned' || task.status === 'Inspection Pending' ? (
                        <>
                          <button
                            onClick={() => setInspectionModalData({
                              isOpen: true,
                              roomId: task.roomId,
                              roomNumber: task.roomNumber,
                              roomTypeName: task.roomTypeName,
                              taskId: task.id,
                              attendantName: task.assignedAttendantName
                            })}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => {
                              setRejectTask(task);
                              setRejectReason('');
                            }}
                            className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 font-semibold rounded-lg text-xs transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      ) : null}

                      <button
                        onClick={() => setHistoryTask(task)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                        title="View Task Audit History"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Create New Cleaning Task */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateTask} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-slate-100">Create Room Cleaning Work Order</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Select Room:</label>
                <select
                  required
                  value={newRoomId}
                  onChange={e => setNewRoomId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Resort Room --</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.roomTypeName}) - Current: {r.housekeepingStatus}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Cleaning Type:</label>
                  <select
                    value={newCleaningType}
                    onChange={e => setNewCleaningType(e.target.value as CleaningType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Checkout Cleaning">Checkout Cleaning</option>
                    <option value="Stayover Cleaning">Stayover Cleaning</option>
                    <option value="Deep Cleaning">Deep Cleaning</option>
                    <option value="VIP Cleaning">VIP Cleaning</option>
                    <option value="Special Cleaning">Special Cleaning</option>
                    <option value="Turndown">Turndown</option>
                    <option value="Public Area Cleaning">Public Area Cleaning</option>
                    <option value="Post-Maintenance Cleaning">Post-Maintenance Cleaning</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Priority Level:</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High Priority</option>
                    <option value="VIP">VIP</option>
                    <option value="Urgent">Urgent / Fast Turnover</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Assign Attendant:</label>
                <select
                  value={newAttendantId}
                  onChange={e => setNewAttendantId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Assign Later / Pool Queue --</option>
                  {staff.filter(s => s.role === 'Attendant').map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.shift} Shift - Floor {s.assignedFloor})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Instructions & Notes:</label>
                <textarea
                  rows={2}
                  value={newRemarks}
                  onChange={e => setNewRemarks(e.target.value)}
                  placeholder="e.g. VIP guest arrival at 2 PM. Extra bath towels & aroma kit required."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-900/30"
              >
                Create & Dispatch Work Order
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 2: Attendant Step-by-Step Cleaning Checklist */}
      {checklistModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100">Room {checklistModalTask.roomNumber} Cleaning Checklist</h3>
                <p className="text-xs text-slate-400">{checklistModalTask.cleaningType} • Attendant: {checklistModalTask.assignedAttendantName}</p>
              </div>
              <button
                onClick={() => setChecklistModalTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1 text-xs">
              {[
                { key: 'bedLinenChanged', label: 'Fresh Bed Linen & Duvet Changed & Tucked' },
                { key: 'pillowCasesReplaced', label: 'Pillow Cases Replaced & Fluffed' },
                { key: 'bathroomSanitized', label: 'Bathroom, Shower, Tub & Commode Disinfected' },
                { key: 'towelsReplaced', label: 'Plush Towels & Bath Mat Replenished' },
                { key: 'amenitiesRestocked', label: 'Toiletries, Water Bottles & Tea Kit Restocked' },
                { key: 'floorVacuumedMopped', label: 'Floors Vacuumed & Mopped (Stain-Free)' },
                { key: 'dustingSurfacesCleaned', label: 'Surfaces, Mirrors & Headboards Dusted' },
                { key: 'trashEmptied', label: 'Trash Cans Emptied & New Liners Inserted' },
                { key: 'minibarChecked', label: 'Mini-Bar Fridge Checked & Restocked' },
                { key: 'acTvWorking', label: 'AC, Lights & Smart TV Remotes Tested' },
                { key: 'odorFree', label: 'Room Odor Free & Freshly Ventilated' }
              ].map(item => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer"
                >
                  <span className="text-slate-200">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={(checklistState as any)[item.key]}
                    onChange={e => setChecklistState(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 w-4 h-4"
                  />
                </label>
              ))}

              <div className="pt-2">
                <label className="font-bold text-slate-300 block mb-1">Attendant Completion Notes:</label>
                <textarea
                  rows={2}
                  value={completeRemarks}
                  onChange={e => setCompleteRemarks(e.target.value)}
                  placeholder="e.g. All checkpoints completed. Room pristine and ready for supervisor inspection."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setChecklistModalTask(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveChecklistAndComplete}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-900/30 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Mark Cleaned & Submit for Inspection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Reassign Attendant */}
      {reassignTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Reassign Room {reassignTask.roomNumber}</h3>
              <button onClick={() => setReassignTask(null)} className="p-1 text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-300">Choose Housekeeping Attendant:</label>
              <select
                value={reassignStaffId}
                onChange={e => setReassignStaffId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Choose Attendant --</option>
                {staff.filter(s => s.role === 'Attendant').map(s => (
                  <option key={s.id} value={s.id}>{s.name} (Floor {s.assignedFloor})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setReassignTask(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReassign}
                className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Reject Task Reason */}
      {rejectTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-bold text-slate-100">Reject Task • Room {rejectTask.roomNumber}</h3>
              </div>
              <button onClick={() => setRejectTask(null)} className="p-1 text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-300">Reason for Rejection / Re-cleaning Instructions:</label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Bathroom mirror has smudges; duvet cover not properly tucked."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setRejectTask(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReject}
                className="px-5 py-2 bg-red-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-900/30"
              >
                Reject & Mark Room Dirty
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer: Task History Audit Log */}
      {historyTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between space-y-4 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-100">Audit History • Room {historyTask.roomNumber}</h3>
                  <p className="text-xs text-slate-400 font-mono">{historyTask.taskNumber} ({historyTask.cleaningType})</p>
                </div>
                <button onClick={() => setHistoryTask(null)} className="p-1 text-slate-400 hover:text-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {historyTask.history.map((h, idx) => (
                  <div key={idx} className="relative pl-6 pb-4 border-l border-slate-800 last:border-0 text-xs">
                    <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-slate-900" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{h.action}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">By: {h.user}</div>
                    {h.notes && (
                      <p className="text-[11px] text-slate-300 mt-1 p-2 rounded-lg bg-slate-950 border border-slate-850">
                        {h.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setHistoryTask(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs"
            >
              Close History
            </button>
          </div>
        </div>
      )}

      {/* Inspection Modal */}
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
