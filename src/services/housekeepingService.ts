import {
  RoomHousekeepingStatus,
  CleaningType,
  CleaningTaskStatus,
  TaskPriority,
  HousekeepingStaff,
  HousekeepingTaskEnhanced,
  RoomInspectionRecord,
  InspectionCheckItem,
  LostFoundItem,
  LostFoundStatus,
  LinenItem,
  LinenLocationStock,
  LinenTransaction,
  LinenLocation,
  HousekeepingAmenity,
  AmenityConsumptionRecord,
  HousekeepingRequest,
  RequestStatus,
  RoomDiscrepancyRecord,
  HousekeepingShiftRecord,
  HousekeepingDashboardStats
} from '../types/housekeeping';
import {
  SEED_HK_STAFF,
  SEED_HK_TASKS,
  SEED_INSPECTIONS,
  SEED_LOST_FOUND,
  SEED_LINEN_ITEMS,
  SEED_LINEN_STOCKS,
  SEED_LINEN_TRANSACTIONS,
  SEED_AMENITIES,
  SEED_AMENITY_CONSUMPTIONS,
  SEED_HK_REQUESTS,
  SEED_DISCREPANCIES,
  SEED_HK_SHIFTS
} from './mockHousekeepingData';
import { pmsService } from './pmsService';
import { Room } from '../types/pms';

const STORAGE_KEY = 'cculb_pms_housekeeping_v1';

interface HousekeepingState {
  staff: HousekeepingStaff[];
  tasks: HousekeepingTaskEnhanced[];
  inspections: RoomInspectionRecord[];
  lostFound: LostFoundItem[];
  linenItems: LinenItem[];
  linenStocks: LinenLocationStock[];
  linenTransactions: LinenTransaction[];
  amenities: HousekeepingAmenity[];
  amenityConsumptions: AmenityConsumptionRecord[];
  requests: HousekeepingRequest[];
  discrepancies: RoomDiscrepancyRecord[];
  shifts: HousekeepingShiftRecord[];
  activeAttendantId: string;
}

const DEFAULT_STATE: HousekeepingState = {
  staff: SEED_HK_STAFF,
  tasks: SEED_HK_TASKS,
  inspections: SEED_INSPECTIONS,
  lostFound: SEED_LOST_FOUND,
  linenItems: SEED_LINEN_ITEMS,
  linenStocks: SEED_LINEN_STOCKS,
  linenTransactions: SEED_LINEN_TRANSACTIONS,
  amenities: SEED_AMENITIES,
  amenityConsumptions: SEED_AMENITY_CONSUMPTIONS,
  requests: SEED_HK_REQUESTS,
  discrepancies: SEED_DISCREPANCIES,
  shifts: SEED_HK_SHIFTS,
  activeAttendantId: 'hks-1'
};

function loadState(): HousekeepingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        staff: parsed.staff || SEED_HK_STAFF,
        tasks: parsed.tasks || SEED_HK_TASKS,
        inspections: parsed.inspections || SEED_INSPECTIONS,
        lostFound: parsed.lostFound || SEED_LOST_FOUND,
        linenItems: parsed.linenItems || SEED_LINEN_ITEMS,
        linenStocks: parsed.linenStocks || SEED_LINEN_STOCKS,
        linenTransactions: parsed.linenTransactions || SEED_LINEN_TRANSACTIONS,
        amenities: parsed.amenities || SEED_AMENITIES,
        amenityConsumptions: parsed.amenityConsumptions || SEED_AMENITY_CONSUMPTIONS,
        requests: parsed.requests || SEED_HK_REQUESTS,
        discrepancies: parsed.discrepancies || SEED_DISCREPANCIES,
        shifts: parsed.shifts || SEED_HK_SHIFTS,
        activeAttendantId: parsed.activeAttendantId || 'hks-1'
      };
    }
  } catch (err) {
    console.warn('Failed to load HK state, initializing default:', err);
  }
  return DEFAULT_STATE;
}

let state: HousekeepingState = loadState();
const listeners: Set<(state: HousekeepingState) => void> = new Set();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save HK state to storage:', err);
  }
}

function notify() {
  saveState();
  listeners.forEach(fn => fn({ ...state }));
}

export const housekeepingService = {
  subscribe(fn: (s: HousekeepingState) => void) {
    listeners.add(fn);
    fn({ ...state });
    return () => {
      listeners.delete(fn);
    };
  },

  getState(): HousekeepingState {
    return { ...state };
  },

  resetToSeed() {
    state = {
      staff: JSON.parse(JSON.stringify(SEED_HK_STAFF)),
      tasks: JSON.parse(JSON.stringify(SEED_HK_TASKS)),
      inspections: JSON.parse(JSON.stringify(SEED_INSPECTIONS)),
      lostFound: JSON.parse(JSON.stringify(SEED_LOST_FOUND)),
      linenItems: JSON.parse(JSON.stringify(SEED_LINEN_ITEMS)),
      linenStocks: JSON.parse(JSON.stringify(SEED_LINEN_STOCKS)),
      linenTransactions: JSON.parse(JSON.stringify(SEED_LINEN_TRANSACTIONS)),
      amenities: JSON.parse(JSON.stringify(SEED_AMENITIES)),
      amenityConsumptions: JSON.parse(JSON.stringify(SEED_AMENITY_CONSUMPTIONS)),
      requests: JSON.parse(JSON.stringify(SEED_HK_REQUESTS)),
      discrepancies: JSON.parse(JSON.stringify(SEED_DISCREPANCIES)),
      shifts: JSON.parse(JSON.stringify(SEED_HK_SHIFTS)),
      activeAttendantId: 'hks-1'
    };
    notify();
  },

  setActiveAttendant(staffId: string) {
    state.activeAttendantId = staffId;
    notify();
  },

  getActiveAttendant(): HousekeepingStaff | undefined {
    return state.staff.find(s => s.id === state.activeAttendantId) || state.staff[0];
  },

  // =========================================================================
  // 1. HOUSEKEEPING DASHBOARD STATS (Live database calculated metrics)
  // =========================================================================
  getDashboardStats(): HousekeepingDashboardStats {
    const pmsState = pmsService.getState();
    const rooms = pmsState.rooms;
    const stays = pmsState.stays.filter(s => s.status === 'Active');

    let vacantClean = 0;
    let vacantDirty = 0;
    let occupiedClean = 0;
    let occupiedDirty = 0;
    let cleaningInProgress = 0;
    let inspected = 0;
    let outOfOrder = 0;
    let outOfService = 0;

    rooms.forEach(r => {
      const isOccupied = stays.some(s => s.roomId === r.id);

      if (r.operationalStatus === 'Out of Order') {
        outOfOrder++;
      } else if (r.operationalStatus === 'Out of Service') {
        outOfService++;
      } else if (r.housekeepingStatus === 'Cleaning' || r.operationalStatus === 'Cleaning') {
        cleaningInProgress++;
      } else if (r.housekeepingStatus === 'Inspected' || r.operationalStatus === 'Inspected') {
        inspected++;
        if (isOccupied) occupiedClean++;
        else vacantClean++;
      } else if (isOccupied) {
        if (r.housekeepingStatus === 'Dirty' || r.operationalStatus === 'Dirty') {
          occupiedDirty++;
        } else {
          occupiedClean++;
        }
      } else {
        if (r.housekeepingStatus === 'Dirty' || r.operationalStatus === 'Dirty') {
          vacantDirty++;
        } else {
          vacantClean++;
        }
      }
    });

    // Active cleaning tasks
    const activeTasks = state.tasks.filter(t => t.status !== 'Completed' && t.status !== 'Inspected');
    const priorityRooms = activeTasks.filter(t => t.priority === 'VIP' || t.priority === 'High' || t.priority === 'Urgent').length;
    const roomsDueForCleaning = vacantDirty + occupiedDirty + cleaningInProgress;

    // Requests
    const pendingRequests = state.requests.filter(r => r.status === 'New' || r.status === 'Assigned' || r.status === 'In Progress').length;

    // Open Maintenance Issues
    const openMaintenanceIssues = pmsState.maintenanceTickets.filter(m => m.status === 'Open' || m.status === 'In Progress').length;

    // Lost & Found Unclaimed / Stored
    const lostAndFoundItems = state.lostFound.filter(lf => lf.status === 'Found' || lf.status === 'Stored' || lf.status === 'Guest Contacted' || lf.status === 'Unclaimed').length;

    // Total Clean Linen in circulation
    const linenBalance = state.linenStocks.reduce((acc, curr) => acc + (curr.cleanQty || 0), 0);

    return {
      totalRooms: rooms.length,
      vacantClean,
      vacantDirty,
      occupiedClean,
      occupiedDirty,
      cleaningInProgress,
      inspected,
      outOfOrder,
      outOfService,
      roomsDueForCleaning,
      priorityRooms,
      pendingRequests,
      openMaintenanceIssues,
      lostAndFoundItems,
      linenBalance
    };
  },

  // =========================================================================
  // 2. ROOM STATUS & FRONT OFFICE SYNCHRONIZATION
  // =========================================================================
  getRoomStatusList() {
    const pmsState = pmsService.getState();
    const rooms = pmsState.rooms;
    const stays = pmsState.stays.filter(s => s.status === 'Active');
    const reservations = pmsState.reservations.filter(r => r.status === 'Confirmed');
    const maintenanceTickets = pmsState.maintenanceTickets.filter(m => m.status === 'Open' || m.status === 'In Progress');

    return rooms.map(room => {
      const activeStay = stays.find(s => s.roomId === room.id);
      const incomingRes = reservations.find(r => r.assignedRoomId === room.id);
      const activeTask = state.tasks.find(t => t.roomId === room.id && t.status !== 'Completed');
      const activeTicket = maintenanceTickets.find(m => m.roomId === room.id);
      const lastInspection = state.inspections.filter(i => i.roomId === room.id)[0];

      // Derive compound Housekeeping Status
      let hkStatus: RoomHousekeepingStatus = 'Vacant Clean';
      if (room.operationalStatus === 'Out of Order') {
        hkStatus = 'Out of Order';
      } else if (room.operationalStatus === 'Out of Service') {
        hkStatus = 'Out of Service';
      } else if (activeTask?.status === 'In Progress' || room.housekeepingStatus === 'Cleaning') {
        hkStatus = 'Cleaning';
      } else if (activeTask?.status === 'Cleaned') {
        hkStatus = 'Cleaned';
      } else if (activeTask?.status === 'Inspection Pending') {
        hkStatus = 'Inspection Pending';
      } else if (room.housekeepingStatus === 'Inspected') {
        hkStatus = 'Inspected';
      } else if (activeStay) {
        hkStatus = (room.housekeepingStatus === 'Dirty' || room.operationalStatus === 'Dirty') ? 'Occupied Dirty' : 'Occupied Clean';
      } else {
        hkStatus = (room.housekeepingStatus === 'Dirty' || room.operationalStatus === 'Dirty') ? 'Vacant Dirty' : 'Vacant Clean';
      }

      return {
        room,
        activeStay,
        incomingRes,
        activeTask,
        activeTicket,
        lastInspection,
        compoundStatus: hkStatus,
        occupancy: activeStay ? 'Occupied' : 'Vacant',
        frontOfficeStatus: room.operationalStatus,
        housekeepingStatus: room.housekeepingStatus,
        maintenanceStatus: activeTicket ? `${activeTicket.priority} (${activeTicket.status})` : 'Normal',
        assignedAttendant: activeTask?.assignedAttendantName || 'Unassigned',
        lastCleaned: activeTask?.completedAt || 'Today 08:30 AM',
        lastInspected: lastInspection ? `${lastInspection.inspectionDate.split('T')[0]} (${lastInspection.overallResult})` : 'Pending'
      };
    });
  },

  updateRoomHousekeepingStatus(roomId: string, newHkStatus: RoomHousekeepingStatus, remarks?: string) {
    const pmsState = pmsService.getState();
    const room = pmsState.rooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');

    // Central state update via pmsService
    if (newHkStatus === 'Vacant Clean' || newHkStatus === 'Occupied Clean' || newHkStatus === 'Cleaned') {
      pmsService.updateHousekeepingStatus(roomId, 'Clean', remarks);
    } else if (newHkStatus === 'Vacant Dirty' || newHkStatus === 'Occupied Dirty') {
      pmsService.updateHousekeepingStatus(roomId, 'Dirty', remarks);
    } else if (newHkStatus === 'Cleaning') {
      pmsService.updateHousekeepingStatus(roomId, 'Cleaning', remarks);
    } else if (newHkStatus === 'Inspected') {
      pmsService.updateHousekeepingStatus(roomId, 'Inspected', remarks);
    } else if (newHkStatus === 'Out of Order') {
      pmsService.updateRoomStatus(roomId, 'Out of Order', 'Dirty', remarks || 'Room marked OOO by Housekeeping');
      pmsService.addAlert('urgent', `Room ${room.roomNumber} Out of Order`, remarks || 'Room marked OOO by Housekeeping', 'Housekeeping', 'housekeeping');
    } else if (newHkStatus === 'Out of Service') {
      pmsService.updateRoomStatus(roomId, 'Out of Service', 'Dirty', remarks || 'Room marked OOS by Housekeeping');
    }

    // Update or create task
    const existingTask = state.tasks.find(t => t.roomId === roomId && t.status !== 'Completed');
    if (existingTask) {
      if (newHkStatus === 'Cleaning') existingTask.status = 'In Progress';
      else if (newHkStatus === 'Cleaned') existingTask.status = 'Cleaned';
      else if (newHkStatus === 'Inspected' || newHkStatus === 'Vacant Clean') existingTask.status = 'Inspected';
      existingTask.updatedAt = new Date().toISOString();
      existingTask.history.push({
        timestamp: new Date().toISOString(),
        action: 'Status Updated',
        user: pmsState.currentUser.name,
        notes: `Updated to ${newHkStatus}. ${remarks || ''}`
      });
    }

    notify();
  },

  // =========================================================================
  // 3. CLEANING TASKS & WORKFLOW MANAGEMENT
  // =========================================================================
  createCleaningTask(params: {
    roomId: string;
    cleaningType: CleaningType;
    priority: TaskPriority;
    assignedAttendantId?: string;
    remarks?: string;
  }): HousekeepingTaskEnhanced {
    const pmsState = pmsService.getState();
    const room = pmsState.rooms.find(r => r.id === params.roomId);
    if (!room) throw new Error('Room not found');

    const activeStay = pmsState.stays.find(s => s.roomId === room.id && s.status === 'Active');
    const attendant = state.staff.find(s => s.id === params.assignedAttendantId);
    const supervisor = state.staff.find(s => s.role === 'Supervisor' || s.role === 'Executive Housekeeper');

    const isVip = params.priority === 'VIP' || (activeStay ? pmsState.guests.find(g => g.id === activeStay.guestId)?.vipStatus : false) || false;

    const taskNumber = `TSK-2026-${String(state.tasks.length + 908).padStart(4, '0')}`;
    const newTask: HousekeepingTaskEnhanced = {
      id: `hkt-${Date.now()}`,
      taskNumber,
      roomId: room.id,
      roomNumber: room.roomNumber,
      roomTypeName: room.roomTypeName || 'Standard',
      floor: room.floor,
      guestName: activeStay?.guestName,
      stayId: activeStay?.id,
      reservationId: activeStay?.reservationId,
      cleaningType: params.cleaningType,
      priority: params.priority,
      isVip,
      assignedAttendantId: attendant?.id,
      assignedAttendantName: attendant?.name,
      supervisorId: supervisor?.id,
      supervisorName: supervisor?.name || 'Housekeeping Supervisor',
      status: attendant ? 'Assigned' : 'Pending',
      estimatedDurationMinutes: params.cleaningType === 'Deep Cleaning' ? 50 : params.cleaningType === 'VIP Cleaning' ? 60 : 30,
      checklist: {
        bedLinenChanged: false,
        pillowCasesReplaced: false,
        bathroomSanitized: false,
        towelsReplaced: false,
        amenitiesRestocked: false,
        floorVacuumedMopped: false,
        dustingSurfacesCleaned: false,
        trashEmptied: false,
        minibarChecked: false,
        acTvWorking: false,
        odorFree: false
      },
      remarks: params.remarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          timestamp: new Date().toISOString(),
          action: 'Task Created',
          user: pmsState.currentUser.name,
          notes: `Created ${params.cleaningType} with priority ${params.priority}`
        }
      ]
    };

    // Mark room dirty
    if (room.housekeepingStatus === 'Clean' || room.operationalStatus === 'Available') {
      pmsService.updateHousekeepingStatus(room.id, 'Dirty', `New cleaning task created: ${params.cleaningType}`);
    }

    state.tasks.unshift(newTask);
    notify();
    return newTask;
  },

  assignTask(taskId: string, attendantId: string, priority?: TaskPriority) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');

    const attendant = state.staff.find(s => s.id === attendantId);
    if (!attendant) throw new Error('Staff not found');

    const oldAttendant = task.assignedAttendantName || 'Unassigned';
    task.assignedAttendantId = attendant.id;
    task.assignedAttendantName = attendant.name;
    if (priority) task.priority = priority;
    if (task.status === 'Pending') task.status = 'Assigned';
    task.updatedAt = new Date().toISOString();

    task.history.push({
      timestamp: new Date().toISOString(),
      action: 'Attendant Assigned',
      user: pmsService.getState().currentUser.name,
      notes: `Assigned from ${oldAttendant} to ${attendant.name}`
    });

    notify();
  },

  startCleaningTask(taskId: string) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');

    task.status = 'In Progress';
    task.startedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    task.history.push({
      timestamp: new Date().toISOString(),
      action: 'Cleaning Started',
      user: task.assignedAttendantName || pmsService.getState().currentUser.name,
      notes: 'Attendant commenced room cleaning'
    });

    pmsService.updateHousekeepingStatus(task.roomId, 'Cleaning');
    notify();
  },

  completeCleaningTask(taskId: string, checklistUpdates?: Partial<HousekeepingTaskEnhanced['checklist']>, remarks?: string) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');

    const now = new Date();
    task.status = 'Cleaned';
    task.completedAt = now.toISOString();
    task.updatedAt = now.toISOString();

    if (task.startedAt) {
      const diffMs = now.getTime() - new Date(task.startedAt).getTime();
      task.actualDurationMinutes = Math.max(5, Math.round(diffMs / 60000));
    } else {
      task.actualDurationMinutes = task.estimatedDurationMinutes;
    }

    if (checklistUpdates) {
      task.checklist = { ...task.checklist, ...checklistUpdates };
    } else {
      // Mark all completed
      task.checklist = {
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
      };
    }

    if (remarks) task.remarks = remarks;

    task.history.push({
      timestamp: now.toISOString(),
      action: 'Cleaning Completed',
      user: task.assignedAttendantName || pmsService.getState().currentUser.name,
      notes: `Cleaned in ${task.actualDurationMinutes} mins. Ready for inspection.`
    });

    pmsService.updateHousekeepingStatus(task.roomId, 'Clean', 'Housekeeping completed turnover');
    notify();
  },

  sendForInspection(taskId: string) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');

    task.status = 'Inspection Pending';
    task.updatedAt = new Date().toISOString();

    task.history.push({
      timestamp: new Date().toISOString(),
      action: 'Submitted for Supervisor Inspection',
      user: pmsService.getState().currentUser.name
    });

    notify();
  },

  rejectCleaningTask(taskId: string, rejectionReason: string) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');

    task.status = 'Rejected';
    task.inspectionPassed = false;
    task.inspectionRemarks = rejectionReason;
    task.updatedAt = new Date().toISOString();

    task.history.push({
      timestamp: new Date().toISOString(),
      action: 'Inspection Failed / Rejected',
      user: pmsService.getState().currentUser.name,
      notes: `Returned for re-cleaning. Reason: ${rejectionReason}`
    });

    // Mark room dirty again
    pmsService.updateHousekeepingStatus(task.roomId, 'Dirty', `Inspection rejected: ${rejectionReason}`);
    notify();
  },

  // =========================================================================
  // 4. SUPERVISOR ROOM INSPECTION ENGINE (16-Point Checklist)
  // =========================================================================
  performRoomInspection(params: {
    roomId: string;
    taskId?: string;
    items: InspectionCheckItem[];
    overallResult: 'Pass' | 'Fail';
    remarks: string;
  }): RoomInspectionRecord {
    const pmsState = pmsService.getState();
    const room = pmsState.rooms.find(r => r.id === params.roomId);
    if (!room) throw new Error('Room not found');

    const currentUser = pmsState.currentUser;
    const task = params.taskId ? state.tasks.find(t => t.id === params.taskId) : state.tasks.find(t => t.roomId === room.id && t.status !== 'Completed');

    const passCount = params.items.filter(i => i.status === 'Pass').length;
    const totalApplicable = params.items.filter(i => i.status !== 'N/A').length;
    const scorePercent = totalApplicable > 0 ? Math.round((passCount / totalApplicable) * 100) : 100;

    const inspectionNumber = `INS-2026-${String(state.inspections.length + 82).padStart(4, '0')}`;
    const newInspection: RoomInspectionRecord = {
      id: `ins-${Date.now()}`,
      inspectionNumber,
      roomId: room.id,
      roomNumber: room.roomNumber,
      roomTypeName: room.roomTypeName || 'Deluxe',
      supervisorId: currentUser.id,
      supervisorName: currentUser.name,
      attendantId: task?.assignedAttendantId,
      attendantName: task?.assignedAttendantName || 'Staff',
      inspectionDate: new Date().toISOString(),
      items: params.items,
      overallResult: params.overallResult,
      scorePercent,
      remarks: params.remarks,
      createdAt: new Date().toISOString()
    };

    state.inspections.unshift(newInspection);

    if (params.overallResult === 'Pass') {
      if (task) {
        task.status = 'Inspected';
        task.inspectedAt = new Date().toISOString();
        task.inspectionPassed = true;
        task.inspectionRemarks = params.remarks;
        task.history.push({
          timestamp: new Date().toISOString(),
          action: 'Inspection Approved',
          user: currentUser.name,
          notes: `Score: ${scorePercent}%. Room verified pristine.`
        });
      }
      pmsService.updateHousekeepingStatus(room.id, 'Inspected', `Supervisor inspection approved (Score: ${scorePercent}%)`);
    } else {
      if (task) {
        task.status = 'Rejected';
        task.inspectionPassed = false;
        task.inspectionRemarks = params.remarks;
        task.history.push({
          timestamp: new Date().toISOString(),
          action: 'Inspection Failed',
          user: currentUser.name,
          notes: `Score: ${scorePercent}%. Returned to cleaning. ${params.remarks}`
        });
      }
      pmsService.updateHousekeepingStatus(room.id, 'Dirty', `Inspection failed: ${params.remarks}`);
    }

    notify();
    return newInspection;
  },

  // =========================================================================
  // 5. HOUSEKEEPING BOARD KANBAN DRAG / STATUS MOVE
  // =========================================================================
  moveTaskBoardStatus(taskId: string, targetColumn: 'DIRTY' | 'ASSIGNED' | 'CLEANING' | 'CLEANED' | 'INSPECTION' | 'INSPECTED' | 'MAINTENANCE' | 'COMPLETED') {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');

    const currentUser = pmsService.getState().currentUser.name;

    switch (targetColumn) {
      case 'DIRTY':
        task.status = 'Pending';
        pmsService.updateHousekeepingStatus(task.roomId, 'Dirty');
        break;
      case 'ASSIGNED':
        task.status = 'Assigned';
        if (!task.assignedAttendantId) {
          const defaultStaff = state.staff[0];
          task.assignedAttendantId = defaultStaff.id;
          task.assignedAttendantName = defaultStaff.name;
        }
        break;
      case 'CLEANING':
        this.startCleaningTask(taskId);
        return;
      case 'CLEANED':
        this.completeCleaningTask(taskId);
        return;
      case 'INSPECTION':
        this.sendForInspection(taskId);
        return;
      case 'INSPECTED':
      case 'COMPLETED':
        task.status = 'Inspected';
        task.inspectedAt = new Date().toISOString();
        task.inspectionPassed = true;
        pmsService.updateHousekeepingStatus(task.roomId, 'Inspected');
        break;
      case 'MAINTENANCE':
        task.status = 'Rejected';
        pmsService.updateHousekeepingStatus(task.roomId, 'Dirty', 'Maintenance required');
        break;
    }

    task.updatedAt = new Date().toISOString();
    task.history.push({
      timestamp: new Date().toISOString(),
      action: `Moved to ${targetColumn}`,
      user: currentUser
    });

    notify();
  },

  // =========================================================================
  // 6. LOST & FOUND ENGINE & GUEST AUTO-LOOKUP
  // =========================================================================
  searchGuestForRoom(roomNumber: string) {
    const pmsState = pmsService.getState();
    const cleanRoomNum = roomNumber.trim();

    // 1. Check active stay in that room
    const activeStay = pmsState.stays.find(s => s.roomNumber === cleanRoomNum && s.status === 'Active');
    if (activeStay) {
      const guest = pmsState.guests.find(g => g.id === activeStay.guestId);
      return {
        type: 'Current In-House Guest',
        guestName: activeStay.guestName,
        phone: guest?.phone || '',
        email: guest?.email || '',
        reservationNumber: activeStay.stayNumber,
        checkInDate: activeStay.checkInAt ? activeStay.checkInAt.split('T')[0] : 'N/A',
        checkOutDate: activeStay.expectedCheckOutAt ? activeStay.expectedCheckOutAt.split('T')[0] : 'N/A',
        roomId: activeStay.roomId,
        stayId: activeStay.id
      };
    }

    // 2. Check recently checked-out stays
    const recentStay = pmsState.stays.find(s => s.roomNumber === cleanRoomNum && s.status === 'Checked-Out');
    if (recentStay) {
      const guest = pmsState.guests.find(g => g.id === recentStay.guestId);
      return {
        type: 'Recently Checked-Out Guest',
        guestName: recentStay.guestName,
        phone: guest?.phone || '',
        email: guest?.email || '',
        reservationNumber: recentStay.stayNumber,
        checkInDate: recentStay.checkInAt ? recentStay.checkInAt.split('T')[0] : 'N/A',
        checkOutDate: recentStay.actualCheckOutAt ? recentStay.actualCheckOutAt.split('T')[0] : recentStay.expectedCheckOutAt ? recentStay.expectedCheckOutAt.split('T')[0] : 'N/A',
        roomId: recentStay.roomId,
        stayId: recentStay.id
      };
    }

    return null;
  },

  createLostFoundItem(data: Omit<LostFoundItem, 'id' | 'itemCode' | 'createdAt' | 'history'>): LostFoundItem {
    const itemCode = `LF-2026-${String(state.lostFound.length + 45).padStart(4, '0')}`;
    const currentUser = pmsService.getState().currentUser.name;

    const newItem: LostFoundItem = {
      ...data,
      id: `lf-${Date.now()}`,
      itemCode,
      history: [
        {
          timestamp: new Date().toISOString(),
          action: 'Item Logged',
          user: currentUser,
          notes: `Discovered at ${data.foundLocation} by ${data.foundBy}`
        }
      ],
      createdAt: new Date().toISOString()
    };

    state.lostFound.unshift(newItem);
    pmsService.addAlert('info', `Lost & Found: ${newItem.description}`, `${newItem.itemCode} recorded for ${newItem.foundLocation}. Stored in ${newItem.storedLocation}.`, 'Lost & Found', 'housekeeping-lost-found');
    notify();
    return newItem;
  },

  updateLostFoundStatus(id: string, status: LostFoundStatus, notes: string) {
    const item = state.lostFound.find(l => l.id === id);
    if (!item) throw new Error('Lost & Found item not found');

    const currentUser = pmsService.getState().currentUser.name;
    item.status = status;
    item.history.push({
      timestamp: new Date().toISOString(),
      action: `Status Changed to ${status}`,
      user: currentUser,
      notes
    });

    notify();
  },

  returnLostFoundItem(id: string, returnDetails: {
    receiverName: string;
    receiverPhone: string;
    receiverNid: string;
    remarks: string;
  }) {
    const item = state.lostFound.find(l => l.id === id);
    if (!item) throw new Error('Lost & Found item not found');

    const currentUser = pmsService.getState().currentUser.name;
    item.status = 'Returned';
    item.claimedBy = returnDetails.receiverName;
    item.claimedDate = new Date().toISOString();
    item.receiverPhone = returnDetails.receiverPhone;
    item.receiverNid = returnDetails.receiverNid;
    item.returnedBy = currentUser;
    item.remarks = `${item.remarks || ''}\nReturned on ${new Date().toLocaleDateString()}: ${returnDetails.remarks}`;

    item.history.push({
      timestamp: new Date().toISOString(),
      action: 'Item Handed Over & Returned',
      user: currentUser,
      notes: `Verified ID: ${returnDetails.receiverNid}. Handed to ${returnDetails.receiverName} (${returnDetails.receiverPhone}).`
    });

    notify();
  },

  dispatchCourierLostFoundItem(id: string, courierDetails: {
    courierName: string;
    trackingNumber: string;
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;
    courierCost?: number;
    remarks?: string;
  }) {
    const item = state.lostFound.find(l => l.id === id);
    if (!item) throw new Error('Lost & Found item not found');

    const currentUser = pmsService.getState().currentUser.name;
    item.status = 'Returned';
    item.dispositionMethod = 'Courier Dispatched';
    item.claimedBy = `${courierDetails.recipientName} (via ${courierDetails.courierName})`;
    item.claimedDate = new Date().toISOString();
    item.receiverPhone = courierDetails.recipientPhone;
    item.returnedBy = currentUser;
    item.courierName = courierDetails.courierName;
    item.courierTrackingNumber = courierDetails.trackingNumber;
    item.courierRecipientAddress = courierDetails.recipientAddress;
    item.courierDispatchDate = new Date().toISOString().split('T')[0];
    item.courierCost = courierDetails.courierCost || 0;
    item.remarks = `${item.remarks || ''}\nDispatched via ${courierDetails.courierName} (${courierDetails.trackingNumber}) to: ${courierDetails.recipientAddress}. ${courierDetails.remarks || ''}`;

    item.history.push({
      timestamp: new Date().toISOString(),
      action: 'Dispatched via Courier',
      user: currentUser,
      notes: `${courierDetails.courierName} Waybill #${courierDetails.trackingNumber}. Destination: ${courierDetails.recipientAddress}`
    });

    pmsService.addAlert(
      'success',
      `Courier Dispatched: ${item.itemCode}`,
      `Dispatched via ${courierDetails.courierName} (${courierDetails.trackingNumber}) to ${courierDetails.recipientName}.`,
      'Lost & Found',
      'housekeeping-lost-found'
    );

    notify();
  },

  disposeLostFoundItem(id: string, disposalDetails: {
    method: 'Auction' | 'Charity Donation' | 'Discarded';
    approvedBy: string;
    notes: string;
  }) {
    const item = state.lostFound.find(l => l.id === id);
    if (!item) throw new Error('Lost & Found item not found');

    const currentUser = pmsService.getState().currentUser.name;
    item.status = 'Disposed';
    item.dispositionMethod = disposalDetails.method;
    item.disposalApprovedBy = disposalDetails.approvedBy;
    item.disposalNotes = disposalDetails.notes;
    item.disposalDate = new Date().toISOString().split('T')[0];
    item.remarks = `${item.remarks || ''}\nDisposed on ${new Date().toLocaleDateString()} via ${disposalDetails.method}. Approved by: ${disposalDetails.approvedBy}. Reason: ${disposalDetails.notes}`;

    item.history.push({
      timestamp: new Date().toISOString(),
      action: `Disposed via ${disposalDetails.method}`,
      user: currentUser,
      notes: `Authorized by ${disposalDetails.approvedBy}. Notes: ${disposalDetails.notes}`
    });

    pmsService.addAlert(
      'info',
      `Lost Item Disposed: ${item.itemCode}`,
      `Processed via ${disposalDetails.method} by ${disposalDetails.approvedBy}.`,
      'Lost & Found',
      'housekeeping-lost-found'
    );

    notify();
  },

  recordGuestNotification(id: string, channel: 'SMS' | 'Email' | 'Phone Call' | 'WhatsApp', contactInfo: string) {
    const item = state.lostFound.find(l => l.id === id);
    if (!item) throw new Error('Lost & Found item not found');

    const currentUser = pmsService.getState().currentUser.name;
    if (item.status === 'Stored' || item.status === 'Found') {
      item.status = 'Guest Contacted';
    }

    item.history.push({
      timestamp: new Date().toISOString(),
      action: `Guest Notification Sent via ${channel}`,
      user: currentUser,
      notes: `Sent official Lost Property notification to ${contactInfo}. Reference: ${item.itemCode}`
    });

    notify();
  },

  // =========================================================================
  // 7. LINEN MANAGEMENT & DOUBLE-ENTRY LEDGER ENGINE
  // =========================================================================
  issueLinen(params: {
    fromLocation: LinenLocation;
    toLocation: LinenLocation;
    linenItemId: string;
    quantity: number;
    issuedBy: string;
    receivedBy?: string;
    remarks?: string;
  }): LinenTransaction {
    const item = state.linenItems.find(i => i.id === params.linenItemId);
    if (!item) throw new Error('Linen item not found');

    // 1. Deduct Clean from Source Location
    let fromStock = state.linenStocks.find(s => s.linenItemId === item.id && s.location === params.fromLocation);
    if (!fromStock) {
      fromStock = {
        id: `ls-${Date.now()}-1`,
        linenItemId: item.id,
        linenItemName: item.name,
        location: params.fromLocation,
        cleanQty: 0,
        dirtyQty: 0,
        inUseQty: 0,
        inLaundryQty: 0,
        damagedQty: 0,
        lostQty: 0,
        lastUpdated: new Date().toISOString()
      };
      state.linenStocks.push(fromStock);
    }

    if (fromStock.cleanQty < params.quantity) {
      throw new Error(`Insufficient clean stock at ${params.fromLocation}. Available: ${fromStock.cleanQty}, Requested: ${params.quantity}`);
    }

    fromStock.cleanQty -= params.quantity;
    fromStock.lastUpdated = new Date().toISOString();

    // 2. Add to Destination Location
    let toStock = state.linenStocks.find(s => s.linenItemId === item.id && s.location === params.toLocation);
    if (!toStock) {
      toStock = {
        id: `ls-${Date.now()}-2`,
        linenItemId: item.id,
        linenItemName: item.name,
        location: params.toLocation,
        cleanQty: 0,
        dirtyQty: 0,
        inUseQty: 0,
        inLaundryQty: 0,
        damagedQty: 0,
        lostQty: 0,
        lastUpdated: new Date().toISOString()
      };
      state.linenStocks.push(toStock);
    }

    toStock.cleanQty += params.quantity;
    toStock.lastUpdated = new Date().toISOString();

    // 3. Create Transaction Record
    const txnNumber = `LIN-TXN-2026-${String(state.linenTransactions.length + 104).padStart(4, '0')}`;
    const newTxn: LinenTransaction = {
      id: `lt-${Date.now()}`,
      transactionNumber: txnNumber,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      transactionType: 'Issue to Floor',
      fromLocation: params.fromLocation,
      toLocation: params.toLocation,
      linenItemId: item.id,
      linenItemName: item.name,
      quantity: params.quantity,
      issuedBy: params.issuedBy,
      receivedBy: params.receivedBy,
      remarks: params.remarks,
      createdAt: new Date().toISOString()
    };

    state.linenTransactions.unshift(newTxn);
    notify();
    return newTxn;
  },

  returnLinen(params: {
    location: LinenLocation;
    linenItemId: string;
    cleanQty: number;
    dirtyQty: number;
    damagedQty: number;
    lostQty: number;
    returnedBy: string;
    receivedBy?: string;
    remarks?: string;
  }): LinenTransaction {
    const item = state.linenItems.find(i => i.id === params.linenItemId);
    if (!item) throw new Error('Linen item not found');

    let floorStock = state.linenStocks.find(s => s.linenItemId === item.id && s.location === params.location);
    if (!floorStock) {
      floorStock = {
        id: `ls-${Date.now()}-f`,
        linenItemId: item.id,
        linenItemName: item.name,
        location: params.location,
        cleanQty: 0,
        dirtyQty: 0,
        inUseQty: 0,
        inLaundryQty: 0,
        damagedQty: 0,
        lostQty: 0,
        lastUpdated: new Date().toISOString()
      };
      state.linenStocks.push(floorStock);
    }

    let storeStock = state.linenStocks.find(s => s.linenItemId === item.id && s.location === 'Housekeeping Store');
    if (!storeStock) {
      storeStock = {
        id: `ls-${Date.now()}-s`,
        linenItemId: item.id,
        linenItemName: item.name,
        location: 'Housekeeping Store',
        cleanQty: 0,
        dirtyQty: 0,
        inUseQty: 0,
        inLaundryQty: 0,
        damagedQty: 0,
        lostQty: 0,
        lastUpdated: new Date().toISOString()
      };
      state.linenStocks.push(storeStock);
    }

    // Adjust quantities
    if (params.cleanQty > 0) {
      floorStock.cleanQty = Math.max(0, floorStock.cleanQty - params.cleanQty);
      storeStock.cleanQty += params.cleanQty;
    }

    if (params.dirtyQty > 0) {
      floorStock.dirtyQty += params.dirtyQty;
    }

    if (params.damagedQty > 0) {
      floorStock.damagedQty += params.damagedQty;
      item.totalStock = Math.max(0, item.totalStock - params.damagedQty);
    }

    if (params.lostQty > 0) {
      floorStock.lostQty += params.lostQty;
      item.totalStock = Math.max(0, item.totalStock - params.lostQty);
    }

    floorStock.lastUpdated = new Date().toISOString();
    storeStock.lastUpdated = new Date().toISOString();

    const totalQty = params.cleanQty + params.dirtyQty + params.damagedQty + params.lostQty;
    const txnNumber = `LIN-TXN-2026-${String(state.linenTransactions.length + 104).padStart(4, '0')}`;
    const newTxn: LinenTransaction = {
      id: `lt-${Date.now()}`,
      transactionNumber: txnNumber,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      transactionType: 'Return Dirty',
      fromLocation: params.location,
      toLocation: 'Housekeeping Store',
      linenItemId: item.id,
      linenItemName: item.name,
      quantity: totalQty,
      cleanQty: params.cleanQty,
      dirtyQty: params.dirtyQty,
      damagedQty: params.damagedQty,
      lostQty: params.lostQty,
      issuedBy: params.returnedBy,
      receivedBy: params.receivedBy,
      remarks: params.remarks,
      createdAt: new Date().toISOString()
    };

    state.linenTransactions.unshift(newTxn);
    notify();
    return newTxn;
  },

  sendLinenToLaundry(params: {
    fromLocation: LinenLocation;
    linenItemId: string;
    quantity: number;
    sentBy: string;
    remarks?: string;
  }) {
    const item = state.linenItems.find(i => i.id === params.linenItemId);
    if (!item) throw new Error('Linen item not found');

    const fromStock = state.linenStocks.find(s => s.linenItemId === item.id && s.location === params.fromLocation);
    if (fromStock) {
      fromStock.dirtyQty = Math.max(0, fromStock.dirtyQty - params.quantity);
      fromStock.lastUpdated = new Date().toISOString();
    }

    let laundryStock = state.linenStocks.find(s => s.linenItemId === item.id && s.location === 'Laundry');
    if (!laundryStock) {
      laundryStock = {
        id: `ls-${Date.now()}-l`,
        linenItemId: item.id,
        linenItemName: item.name,
        location: 'Laundry',
        cleanQty: 0,
        dirtyQty: 0,
        inUseQty: 0,
        inLaundryQty: 0,
        damagedQty: 0,
        lostQty: 0,
        lastUpdated: new Date().toISOString()
      };
      state.linenStocks.push(laundryStock);
    }
    laundryStock.inLaundryQty += params.quantity;
    laundryStock.lastUpdated = new Date().toISOString();

    const txnNumber = `LIN-TXN-2026-${String(state.linenTransactions.length + 104).padStart(4, '0')}`;
    state.linenTransactions.unshift({
      id: `lt-${Date.now()}`,
      transactionNumber: txnNumber,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      transactionType: 'Send to Laundry',
      fromLocation: params.fromLocation,
      toLocation: 'Laundry',
      linenItemId: item.id,
      linenItemName: item.name,
      quantity: params.quantity,
      issuedBy: params.sentBy,
      remarks: params.remarks,
      createdAt: new Date().toISOString()
    });

    notify();
  },

  receiveLinenFromLaundry(params: {
    toLocation: LinenLocation;
    linenItemId: string;
    quantity: number;
    receivedBy: string;
    remarks?: string;
  }) {
    const item = state.linenItems.find(i => i.id === params.linenItemId);
    if (!item) throw new Error('Linen item not found');

    const laundryStock = state.linenStocks.find(s => s.linenItemId === item.id && s.location === 'Laundry');
    if (laundryStock) {
      laundryStock.inLaundryQty = Math.max(0, laundryStock.inLaundryQty - params.quantity);
      laundryStock.lastUpdated = new Date().toISOString();
    }

    let destStock = state.linenStocks.find(s => s.linenItemId === item.id && s.location === params.toLocation);
    if (!destStock) {
      destStock = {
        id: `ls-${Date.now()}-d`,
        linenItemId: item.id,
        linenItemName: item.name,
        location: params.toLocation,
        cleanQty: 0,
        dirtyQty: 0,
        inUseQty: 0,
        inLaundryQty: 0,
        damagedQty: 0,
        lostQty: 0,
        lastUpdated: new Date().toISOString()
      };
      state.linenStocks.push(destStock);
    }
    destStock.cleanQty += params.quantity;
    destStock.lastUpdated = new Date().toISOString();

    const txnNumber = `LIN-TXN-2026-${String(state.linenTransactions.length + 104).padStart(4, '0')}`;
    state.linenTransactions.unshift({
      id: `lt-${Date.now()}`,
      transactionNumber: txnNumber,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      transactionType: 'Receive from Laundry',
      fromLocation: 'Laundry',
      toLocation: params.toLocation,
      linenItemId: item.id,
      linenItemName: item.name,
      quantity: params.quantity,
      issuedBy: 'Laundry Staff',
      receivedBy: params.receivedBy,
      remarks: params.remarks,
      createdAt: new Date().toISOString()
    });

    notify();
  },

  // =========================================================================
  // 8. AMENITIES & INVENTORY-CONTROLLED CONSUMPTION (With Folio Billing)
  // =========================================================================
  createAmenity(amenity: Omit<HousekeepingAmenity, 'id'>): HousekeepingAmenity {
    const newAmenity: HousekeepingAmenity = {
      ...amenity,
      id: `amn-${Date.now()}`
    };
    state.amenities.unshift(newAmenity);
    notify();
    return newAmenity;
  },

  updateAmenity(id: string, updates: Partial<HousekeepingAmenity>) {
    const idx = state.amenities.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Amenity not found');
    state.amenities[idx] = { ...state.amenities[idx], ...updates };
    notify();
  },

  deleteAmenity(id: string) {
    state.amenities = state.amenities.filter(a => a.id !== id);
    notify();
  },

  restockAmenity(id: string, qty: number, notes?: string) {
    const amenity = state.amenities.find(a => a.id === id);
    if (!amenity) throw new Error('Amenity not found');
    amenity.currentStock += qty;
    if (notes) amenity.remarks = notes;
    notify();
  },

  voidAmenityConsumption(consumptionId: string, reason: string) {
    const record = state.amenityConsumptions.find(c => c.id === consumptionId);
    if (!record) throw new Error('Consumption record not found');

    // 1. Restore stock
    const amenity = state.amenities.find(a => a.id === record.amenityId);
    if (amenity) {
      amenity.currentStock += record.quantity;
    }

    // 2. If charged to folio, post reversal adjustment
    if (record.isPostedToFolio && record.folioId && record.totalAmount > 0) {
      try {
        pmsService.postFolioAdjustment(record.folioId, {
          description: `Void Amenity Charge: ${record.amenityName} (Refund / Reversal - ${reason})`,
          amount: -record.totalAmount,
          reason: reason
        });
      } catch (err) {
        console.warn('Could not post folio reversal adjustment:', err);
      }
    }

    record.notes = `${record.notes ? record.notes + ' ' : ''}[VOIDED: ${reason}]`;
    record.totalAmount = 0;
    record.isChargeable = false;
    notify();
  },

  recordAmenityConsumption(params: {
    roomId: string;
    amenityId: string;
    quantity: number;
    attendantName: string;
    postChargeToFolio?: boolean;
    notes?: string;
  }): AmenityConsumptionRecord {
    const amenity = state.amenities.find(a => a.id === params.amenityId);
    if (!amenity) throw new Error('Amenity not found');

    const pmsState = pmsService.getState();
    const room = pmsState.rooms.find(r => r.id === params.roomId);
    if (!room) throw new Error('Room not found');

    const activeStay = pmsState.stays.find(s => s.roomId === room.id && s.status === 'Active');

    // 1. Deduct Amenity Stock
    amenity.currentStock = Math.max(0, amenity.currentStock - params.quantity);

    const totalAmount = amenity.isChargeable ? amenity.salePrice * params.quantity : 0;
    let isPostedToFolio = false;

    // 2. If chargeable & guest is in-house, post directly to in-house Guest Folio!
    if (amenity.isChargeable && params.postChargeToFolio && activeStay && totalAmount > 0) {
      try {
        pmsService.postFolioCharge(activeStay.folioId, {
          type: 'Amenity',
          description: `Housekeeping: ${amenity.name} x${params.quantity}`,
          quantity: params.quantity,
          unitPrice: amenity.salePrice,
          discount: 0
        });
        isPostedToFolio = true;
      } catch (err) {
        console.error('Folio charge posting failed:', err);
      }
    }

    const recordNumber = `AMC-2026-${String(state.amenityConsumptions.length + 804).padStart(4, '0')}`;
    const newRecord: AmenityConsumptionRecord = {
      id: `amc-${Date.now()}`,
      recordNumber,
      roomId: room.id,
      roomNumber: room.roomNumber,
      guestName: activeStay?.guestName,
      stayId: activeStay?.id,
      folioId: activeStay?.folioId,
      amenityId: amenity.id,
      amenityName: amenity.name,
      quantity: params.quantity,
      unitCost: amenity.cost,
      unitPrice: amenity.salePrice,
      totalAmount,
      isChargeable: amenity.isChargeable,
      isPostedToFolio,
      consumedAt: new Date().toISOString(),
      attendantName: params.attendantName,
      notes: params.notes
    };

    state.amenityConsumptions.unshift(newRecord);

    // Sync to PMS Stock Ledger for Housekeeping Store
    if (pmsState.stockLedgers) {
      pmsState.stockLedgers.push({
        id: `sl-amn-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        transactionNumber: `TX-${recordNumber}`,
        itemId: amenity.id,
        itemCode: amenity.sku || amenity.id,
        itemName: amenity.name,
        warehouseId: 'wh-hk',
        warehouseName: 'Housekeeping Store',
        transactionType: 'Housekeeping Consumption',
        referenceType: 'Amenity Issue',
        referenceId: newRecord.id,
        referenceDocument: recordNumber,
        quantityIn: 0,
        quantityOut: params.quantity,
        unitCost: amenity.cost,
        totalCost: amenity.cost * params.quantity,
        runningQuantity: amenity.currentStock,
        runningValue: amenity.currentStock * amenity.cost,
        businessDate: pmsState.settings?.currentBusinessDate || new Date().toISOString().split('T')[0],
        department: 'Housekeeping',
        user: params.attendantName,
        notes: `Room ${room.roomNumber} - ${amenity.name} issued (${activeStay?.guestName || 'Room Prep'})`,
        createdAt: new Date().toISOString()
      });
    }

    notify();
    return newRecord;
  },

  // =========================================================================
  // 9. HOUSEKEEPING REQUESTS (Guest & Departmental)
  // =========================================================================
  createRequest(params: {
    source: HousekeepingRequest['source'];
    requestType: HousekeepingRequest['requestType'];
    roomId: string;
    priority: TaskPriority;
    assignedTo?: string;
    isChargeable?: boolean;
    chargeAmount?: number;
    notes?: string;
  }): HousekeepingRequest {
    const pmsState = pmsService.getState();
    const room = pmsState.rooms.find(r => r.id === params.roomId);
    if (!room) throw new Error('Room not found');

    const activeStay = pmsState.stays.find(s => s.roomId === room.id && s.status === 'Active');
    const guest = activeStay ? pmsState.guests.find(g => g.id === activeStay.guestId) : undefined;
    const attendant = state.staff.find(s => s.id === params.assignedTo);

    const requestNumber = `REQ-2026-${String(state.requests.length + 35).padStart(4, '0')}`;
    const newRequest: HousekeepingRequest = {
      id: `hkr-${Date.now()}`,
      requestNumber,
      source: params.source,
      requestType: params.requestType,
      roomId: room.id,
      roomNumber: room.roomNumber,
      guestName: activeStay?.guestName,
      guestPhone: guest?.phone,
      stayId: activeStay?.id,
      folioId: activeStay?.folioId,
      priority: params.priority,
      status: attendant ? 'Assigned' : 'New',
      assignedTo: attendant?.id,
      assignedAttendantName: attendant?.name,
      isChargeable: !!params.isChargeable,
      chargeAmount: params.chargeAmount || 0,
      isPostedToFolio: false,
      requestedAt: new Date().toISOString(),
      requestedBy: pmsState.currentUser.name,
      notes: params.notes
    };

    state.requests.unshift(newRequest);
    pmsService.addAlert(
      params.priority === 'Urgent' || params.priority === 'VIP' ? 'urgent' : 'info',
      `HK Request (${room.roomNumber}): ${params.requestType}`,
      `Priority: ${params.priority}. ${params.notes || ''}`,
      'View Requests',
      'housekeeping-requests'
    );

    notify();
    return newRequest;
  },

  assignRequest(requestId: string, attendantId: string) {
    const request = state.requests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');

    const attendant = state.staff.find(s => s.id === attendantId);
    if (!attendant) throw new Error('Attendant not found');

    request.assignedTo = attendant.id;
    request.assignedAttendantName = attendant.name;
    if (request.status === 'New') request.status = 'Assigned';
    notify();
  },

  updateRequestStatus(requestId: string, status: RequestStatus, notes?: string) {
    const request = state.requests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');

    request.status = status;
    if (notes) request.notes = `${request.notes || ''}\n${notes}`;

    if (status === 'Completed') {
      request.completedAt = new Date().toISOString();
      request.completedBy = pmsService.getState().currentUser.name;

      // If chargeable & not yet posted, post to guest folio!
      if (request.isChargeable && request.chargeAmount && request.chargeAmount > 0 && request.folioId && !request.isPostedToFolio) {
        try {
          pmsService.postFolioCharge(request.folioId, {
            type: 'Amenity',
            description: `Housekeeping: ${request.requestType}`,
            quantity: 1,
            unitPrice: request.chargeAmount,
            discount: 0
          });
          request.isPostedToFolio = true;
        } catch (err) {
          console.error('Folio charge posting failed:', err);
        }
      }
    }

    notify();
  },

  // =========================================================================
  // 10. MAINTENANCE INTEGRATION & ROOM BLOCKING (OOO / OOS)
  // =========================================================================
  reportMaintenanceProblem(params: {
    roomId: string;
    issueTitle: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    blockRoomAsOOO: boolean;
  }) {
    const ticket = pmsService.createMaintenanceTicket({
      roomId: params.roomId,
      title: params.issueTitle,
      description: params.description,
      priority: params.priority,
      marksOutOfOrder: params.blockRoomAsOOO
    });

    if (params.blockRoomAsOOO) {
      pmsService.updateHousekeepingStatus(params.roomId, 'Dirty', `Blocked OOO due to Maintenance: ${params.issueTitle}`);
    }

    notify();
    return ticket;
  },

  releaseBlockedRoom(roomId: string, remarks?: string) {
    const pmsState = pmsService.getState();
    const room = pmsState.rooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');

    room.operationalStatus = 'Cleaning';
    room.housekeepingStatus = 'Dirty';

    // Create post-maintenance turnover task
    this.createCleaningTask({
      roomId: room.id,
      cleaningType: 'Post-Maintenance Cleaning',
      priority: 'High',
      remarks: `Released from Out of Order. Sanitization & inspection needed before Front Office check-in. ${remarks || ''}`
    });

    pmsService.addAlert('success', `Room ${room.roomNumber} Released`, `Room unblocked from OOO. Queued for Housekeeping deep turnover.`, 'View Room Cleaning', 'housekeeping-cleaning');
    notify();
  },

  // =========================================================================
  // 11. ROOM DISCREPANCY MANAGEMENT (FO ↔ HK)
  // =========================================================================
  detectDiscrepancies(): RoomDiscrepancyRecord[] {
    const pmsState = pmsService.getState();
    const rooms = pmsState.rooms;
    const stays = pmsState.stays.filter(s => s.status === 'Active');

    const detected: RoomDiscrepancyRecord[] = [...state.discrepancies];

    rooms.forEach(room => {
      const activeStay = stays.find(s => s.roomId === room.id);
      const foStatus = activeStay ? 'Occupied' : 'Vacant';
      const hkStatus = (room.housekeepingStatus === 'Dirty' && !activeStay && room.operationalStatus === 'Occupied') ? 'Occupied' : (activeStay ? 'Occupied' : 'Vacant');

      // Check for mismatch
      if (foStatus !== hkStatus) {
        const existing = detected.find(d => d.roomId === room.id && d.status === 'Open');
        if (!existing) {
          detected.push({
            id: `disc-${Date.now()}-${room.roomNumber}`,
            roomId: room.id,
            roomNumber: room.roomNumber,
            frontOfficeStatus: foStatus,
            housekeepingStatus: hkStatus,
            frontOfficeDetails: `FO reports ${foStatus} (${activeStay ? activeStay.guestName : 'No active stay'})`,
            housekeepingDetails: `HK physical room scan indicates ${hkStatus}`,
            detectedAt: new Date().toISOString(),
            reportedBy: 'Housekeeping Morning Audit',
            status: 'Open'
          });
        }
      }
    });

    return detected;
  },

  resolveDiscrepancy(discrepancyId: string, resolvedStatus: 'Vacant' | 'Occupied', resolutionNotes: string) {
    const disc = state.discrepancies.find(d => d.id === discrepancyId);
    if (!disc) throw new Error('Discrepancy record not found');

    const currentUser = pmsService.getState().currentUser.name;
    disc.status = 'Resolved';
    disc.resolvedBy = currentUser;
    disc.resolvedAt = new Date().toISOString();
    disc.resolutionNotes = resolutionNotes;

    // Apply resolved status to room
    const room = pmsService.getState().rooms.find(r => r.id === disc.roomId);
    if (room) {
      if (resolvedStatus === 'Vacant') {
        pmsService.updateHousekeepingStatus(room.id, 'Dirty', `Resolved discrepancy: Marked Vacant. ${resolutionNotes}`);
      }
    }

    notify();
  },

  // =========================================================================
  // 12. STAFF & AMENITY EXTENDED UTILITIES
  // =========================================================================
  toggleStaffDuty(staffId: string) {
    const member = state.staff.find(s => s.id === staffId);
    if (!member) throw new Error('Staff member not found');
    member.active = !member.active;
    notify();
  },

  updateStaffRoster(staffId: string, updates: Partial<HousekeepingStaff>) {
    const member = state.staff.find(s => s.id === staffId);
    if (!member) throw new Error('Staff member not found');
    Object.assign(member, updates);
    notify();
  },

  addStaffMember(data: Omit<HousekeepingStaff, 'id'>) {
    const newStaff: HousekeepingStaff = {
      id: `hk-staff-${Date.now()}`,
      ...data
    };
    state.staff.push(newStaff);
    notify();
    return newStaff;
  },

  calculateStaffProductivity() {
    return state.staff.map(member => {
      const memberTasks = state.tasks.filter(t => t.assignedAttendantId === member.id);
      const completedTasks = memberTasks.filter(t => t.status === 'Cleaned' || t.status === 'Inspected' || t.status === 'Completed');
      const rejectedTasks = memberTasks.filter(t => t.status === 'Rejected');
      const pendingTasks = memberTasks.filter(t => t.status === 'Pending' || t.status === 'Assigned' || t.status === 'In Progress' || t.status === 'Inspection Pending');

      // Calculate actual average duration in minutes from completed tasks
      let totalMinutes = 0;
      let countWithDuration = 0;
      completedTasks.forEach(t => {
        if (t.actualDurationMinutes) {
          totalMinutes += t.actualDurationMinutes;
          countWithDuration++;
        } else if (t.startedAt && t.completedAt) {
          const diff = (new Date(t.completedAt).getTime() - new Date(t.startedAt).getTime()) / 60000;
          totalMinutes += Math.max(10, Math.round(diff));
          countWithDuration++;
        }
      });

      const avgCleaningTime = countWithDuration > 0 ? Math.round(totalMinutes / countWithDuration) : member.role === 'Attendant' ? 28 : 0;

      return {
        staff: member,
        assignedCount: memberTasks.length,
        completedCount: completedTasks.length,
        rejectedCount: rejectedTasks.length,
        pendingCount: pendingTasks.length,
        avgCleaningTimeMinutes: avgCleaningTime,
        completionRate: memberTasks.length > 0 ? Math.round((completedTasks.length / memberTasks.length) * 100) : 100
      };
    });
  }
};
