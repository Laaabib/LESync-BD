import React, { useState, useEffect } from 'react';
import {
  Grid3X3, CheckCircle2, AlertTriangle, Search, Filter,
  ArrowRightLeft, Sparkles, UserCheck, BedDouble, Calendar,
  DollarSign, ShieldAlert, Layers, Clock, X, ChevronRight,
  TrendingUp, TrendingDown, RefreshCw, Lock, XCircle
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';
import { Reservation, Room, Stay } from '../types/pms';

interface RoomAssignmentViewProps {
  onOpenCheckIn: (reservationId?: string) => void;
  onOpenRoomMove: (stayId?: string) => void;
  onSelectReservation?: (reservationId: string) => void;
}

export const RoomAssignmentView: React.FC<RoomAssignmentViewProps> = ({
  onOpenCheckIn,
  onOpenRoomMove,
  onSelectReservation
}) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unassigned' | 'assigned' | 'today-arrivals'>('all');
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('all');
  
  // Assignment Modal
  const [targetReservation, setTargetReservation] = useState<Reservation | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [actionType, setActionType] = useState<'assign' | 'change' | 'upgrade' | 'downgrade'>('assign');
  const [customRate, setCustomRate] = useState<number>(0);
  const [upgradeReason, setUpgradeReason] = useState<string>('');
  
  // Error modal state
  const [validationError, setValidationError] = useState<{
    title: string;
    message: string;
    roomNumber?: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cancellation state
  const [cancellingRes, setCancellingRes] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Guest requested cancellation at front desk');

  const handleConfirmCancelReservation = () => {
    if (!cancellingRes) return;
    try {
      pmsService.cancelReservation(cancellingRes.id, cancelReason);
      setSuccessMessage(`Reservation ${cancellingRes.reservationNumber} for ${cancellingRes.guestName} was successfully cancelled. Room released and removed from check-in queues.`);
      setCancellingRes(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setValidationError({
        title: 'CANCELLATION FAILED',
        message: err?.message || 'Could not cancel reservation.'
      });
    }
  };

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  const todayStr = db.settings?.currentBusinessDate || new Date().toISOString().split('T')[0];

  // Active reservations that require room assignment or management
  const activeReservations = db.reservations.filter(r => 
    (r.status === 'Confirmed' || r.status === 'Unconfirmed' || (r.status as string) === 'Pending' || r.status === 'Checked-In') &&
    r.status !== 'Cancelled' &&
    r.status !== 'Checked-Out'
  );

  const filteredReservations = activeReservations.filter(res => {
    const matchesSearch = 
      res.guestName.toLowerCase().includes(search.toLowerCase()) ||
      res.reservationNumber.toLowerCase().includes(search.toLowerCase()) ||
      (res.assignedRoomNumber && res.assignedRoomNumber.includes(search)) ||
      (res.guestPhone && res.guestPhone.includes(search));
    
    if (!matchesSearch) return false;

    if (filterType === 'unassigned' && res.assignedRoomId) return false;
    if (filterType === 'assigned' && !res.assignedRoomId) return false;
    if (filterType === 'today-arrivals' && (res.arrivalDate !== todayStr && res.arrivalDate > todayStr)) return false;

    if (selectedRoomTypeId !== 'all' && res.roomTypeId !== selectedRoomTypeId) return false;

    return true;
  });

  const unassignedCount = activeReservations.filter(r => !r.assignedRoomId && r.status !== 'Checked-Out' && r.status !== 'Cancelled').length;
  const assignedCount = activeReservations.filter(r => !!r.assignedRoomId && r.status !== 'Checked-Out' && r.status !== 'Cancelled').length;
  const todayArrivalsCount = activeReservations.filter(r => (r.status === 'Confirmed' || r.status === 'Unconfirmed' || (r.status as string) === 'Pending') && (r.arrivalDate === todayStr || r.arrivalDate <= todayStr)).length;

  const handleOpenAssignModal = (res: Reservation, action: 'assign' | 'change' | 'upgrade' | 'downgrade' = 'assign') => {
    setTargetReservation(res);
    setActionType(action);
    setSelectedRoomId(res.assignedRoomId || '');
    setCustomRate(res.rate);
    setUpgradeReason('');
    setValidationError(null);
    setSuccessMessage(null);
  };

  const handleValidateAndAssign = () => {
    if (!targetReservation) return;
    if (!selectedRoomId) {
      setValidationError({
        title: 'NO ROOM SELECTED',
        message: 'Please select a room to assign to this reservation.'
      });
      return;
    }

    const room = db.rooms.find(r => r.id === selectedRoomId);
    if (!room) {
      setValidationError({
        title: 'ROOM NOT FOUND',
        message: 'The selected room does not exist in the PMS registry.'
      });
      return;
    }

    if (!room.active) {
      setValidationError({
        title: 'ROOM INACTIVE',
        message: `Room ${room.roomNumber} is disabled and not available for guest occupancy.`,
        roomNumber: room.roomNumber
      });
      return;
    }

    if (room.operationalStatus === 'Out of Order') {
      setValidationError({
        title: 'ROOM OUT OF ORDER',
        message: `Room ${room.roomNumber} is currently Out of Order for maintenance (${room.notes || 'Engineering work'}).`,
        roomNumber: room.roomNumber
      });
      return;
    }

    if (room.operationalStatus === 'Blocked') {
      setValidationError({
        title: 'ROOM BLOCKED',
        message: `Room ${room.roomNumber} is management blocked. Please select another room.`,
        roomNumber: room.roomNumber
      });
      return;
    }

    // Availability verification with date overlap check
    const availCheck = pmsService.checkRoomAvailability(
      selectedRoomId,
      targetReservation.arrivalDate,
      targetReservation.departureDate,
      targetReservation.id
    );

    if (!availCheck.isAvailable) {
      setValidationError({
        title: 'ROOM NOT AVAILABLE',
        message: availCheck.reason || `Room ${room.roomNumber} is currently occupied or conflicting with another reservation.`,
        roomNumber: room.roomNumber
      });
      return;
    }

    // Check occupancy limits
    const roomType = db.roomTypes.find(rt => rt.id === room.roomTypeId);
    if (roomType) {
      if (targetReservation.adults > roomType.maxAdults) {
        setValidationError({
          title: 'OCCUPANCY EXCEEDED',
          message: `Room ${room.roomNumber} (${roomType.name}) has a maximum capacity of ${roomType.maxAdults} adults. Reservation has ${targetReservation.adults} adults.`
        });
        return;
      }
    }

    // Execute Assignment
    try {
      const oldRoomNumber = targetReservation.assignedRoomNumber;
      
      // Update reservation
      targetReservation.assignedRoomId = room.id;
      targetReservation.assignedRoomNumber = room.roomNumber;
      targetReservation.updatedAt = new Date().toISOString();

      // If upgrade or custom rate applied
      if (actionType === 'upgrade' || actionType === 'downgrade') {
        targetReservation.rate = customRate;
        targetReservation.specialRequests = (targetReservation.specialRequests ? `${targetReservation.specialRequests} | ` : '') + 
          `[${actionType.toUpperCase()}: Room ${room.roomNumber} (${upgradeReason || 'Front Office approved'})]`;
      }

      // If reservation is already checked-in (active stay), update the stay record as well
      const activeStay = db.stays.find(s => s.reservationId === targetReservation.id && s.status === 'Active');
      if (activeStay) {
        activeStay.roomId = room.id;
        activeStay.roomNumber = room.roomNumber;
        activeStay.roomTypeName = room.roomTypeName || activeStay.roomTypeName;
      }

      // Audit log
      pmsService.logAudit(
        actionType === 'assign' ? 'Assigned Room' : actionType === 'upgrade' ? 'Upgraded Room Assignment' : 'Changed Room Assignment',
        'Reservation',
        targetReservation.id,
        oldRoomNumber ? `Room ${oldRoomNumber}` : 'Unassigned',
        `Room ${room.roomNumber} (${room.roomTypeName}) for ${targetReservation.guestName} [${targetReservation.arrivalDate} – ${targetReservation.departureDate}]`
      );

      pmsService.notify();
      setSuccessMessage(`Room ${room.roomNumber} successfully assigned to ${targetReservation.guestName}!`);
      setTimeout(() => {
        setTargetReservation(null);
        setSuccessMessage(null);
      }, 1000);
    } catch (err: any) {
      setValidationError({
        title: 'ASSIGNMENT ERROR',
        message: err.message || 'Failed to update room assignment.'
      });
    }
  };

  const handleUnassignRoom = (res: Reservation) => {
    if (!res.assignedRoomId) return;
    if (res.status === 'Checked-In') {
      alert('Cannot unassign a room for an active checked-in guest. Use Room Move instead.');
      return;
    }
    const oldRoomNum = res.assignedRoomNumber;
    res.assignedRoomId = undefined;
    res.assignedRoomNumber = undefined;
    res.updatedAt = new Date().toISOString();

    pmsService.logAudit('Unassigned Room', 'Reservation', res.id, `Room ${oldRoomNum}`, 'Room set to Unassigned by Front Desk');
    pmsService.notify();
  };

  return (
    <div className="space-y-4 text-xs text-gray-900">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 p-4 rounded-lg shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shadow-xs">
            <Grid3X3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-gray-900 uppercase tracking-tight">Front Office Room Assignment & Allocation</h1>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 font-mono">
                FO EXCLUSIVE
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-0.5">
              Strict reservation-to-room matching engine with double-booking prevention, capacity checks, and live calendar sync.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => pmsService.notify()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-md transition-colors border border-gray-300 shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Availability</span>
          </button>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div 
          onClick={() => setFilterType('unassigned')}
          className={`bg-white border p-3 rounded-lg shadow-xs cursor-pointer transition-all ${
            filterType === 'unassigned' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Unassigned</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{unassignedCount}</div>
          <div className="text-[10px] text-amber-600 mt-0.5 font-medium">Reservations needing room allocation</div>
        </div>

        <div 
          onClick={() => setFilterType('assigned')}
          className={`bg-white border p-3 rounded-lg shadow-xs cursor-pointer transition-all ${
            filterType === 'assigned' ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Assigned</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{assignedCount}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">Locked & ready for arrival</div>
        </div>

        <div 
          onClick={() => setFilterType('today-arrivals')}
          className={`bg-white border p-3 rounded-lg shadow-xs cursor-pointer transition-all ${
            filterType === 'today-arrivals' ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Due In Today</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{todayArrivalsCount}</div>
          <div className="text-[10px] text-blue-600 mt-0.5 font-medium">Arrivals scheduled for today</div>
        </div>

        <div 
          onClick={() => setFilterType('all')}
          className={`bg-white border p-3 rounded-lg shadow-xs cursor-pointer transition-all ${
            filterType === 'all' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Total Active</span>
            <Calendar className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{activeReservations.length}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 font-medium">In database queue</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white border border-gray-200 p-3 rounded-lg shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Guest Name, Reservation #, Room #, Phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedRoomTypeId}
            onChange={e => setSelectedRoomTypeId(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-xs font-medium focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Room Types</option>
            {db.roomTypes.map(rt => (
              <option key={rt.id} value={rt.id}>{rt.name}</option>
            ))}
          </select>

          <div className="flex space-x-1 bg-gray-100 p-1 rounded-md border border-gray-200">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold ${filterType === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('unassigned')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold ${filterType === 'unassigned' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-600'}`}
            >
              Unassigned ({unassignedCount})
            </button>
            <button
              onClick={() => setFilterType('assigned')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold ${filterType === 'assigned' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600'}`}
            >
              Assigned ({assignedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Main Reservation Assignment Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[760px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Reservation / Guest</th>
                <th className="p-3">Room Type Required</th>
                <th className="p-3">Stay Dates</th>
                <th className="p-3">Pax</th>
                <th className="p-3">Rate / Plan</th>
                <th className="p-3">Assigned Room</th>
                <th className="p-3">Special Requests</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    <Grid3X3 className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="font-medium text-xs">No matching reservations found</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Try clearing your filters or search keywords.</p>
                  </td>
                </tr>
              ) : (
                filteredReservations.map(res => {
                  const room = res.assignedRoomId ? db.rooms.find(r => r.id === res.assignedRoomId) : null;
                  const isDueToday = res.arrivalDate === todayStr || res.arrivalDate <= todayStr;

                  return (
                    <tr key={res.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                            {res.guestName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{res.guestName}</div>
                            <div className="text-[10px] text-gray-500 font-mono flex items-center space-x-1.5">
                              <span>{res.reservationNumber}</span>
                              <span>•</span>
                              <span>{res.guestPhone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-gray-800">{res.roomTypeName}</span>
                        {res.packageName && (
                          <div className="text-[10px] text-indigo-600 font-medium">Pkg: {res.packageName}</div>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="font-mono text-gray-800 font-semibold">{res.arrivalDate} → {res.departureDate}</div>
                        <div className="text-[10px] text-gray-500">
                          {isDueToday ? (
                            <span className="text-blue-600 font-bold">● Due Today</span>
                          ) : (
                            <span>Incoming Arrival</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-gray-700">{res.adults} Adults</div>
                        {res.children > 0 && <div className="text-[10px] text-gray-500">{res.children} Children</div>}
                      </td>

                      <td className="p-3 font-mono">
                        <div className="font-bold text-gray-900">৳{(res.rate || 0).toLocaleString()} / night</div>
                        <div className="text-[10px] text-gray-500">{res.bookingSource}</div>
                      </td>

                      <td className="p-3">
                        {res.assignedRoomId && room ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-bold font-mono text-xs">
                              Room {room.roomNumber}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              room.operationalStatus === 'Available' ? 'bg-green-100 text-green-700' :
                              room.operationalStatus === 'Occupied' ? 'bg-blue-100 text-blue-700' :
                              room.operationalStatus === 'Dirty' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {room.operationalStatus}
                            </span>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded font-bold text-[11px] flex items-center space-x-1 w-max">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Unassigned</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3 max-w-xs truncate text-[11px] text-gray-600">
                        {res.specialRequests || <span className="text-gray-400 italic">None</span>}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {res.assignedRoomId ? (
                            <>
                              <button
                                onClick={() => handleOpenAssignModal(res, 'change')}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded font-bold transition-colors"
                              >
                                Change
                              </button>
                              <button
                                onClick={() => handleOpenAssignModal(res, 'upgrade')}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded font-bold transition-colors"
                                title="Upgrade Room"
                              >
                                Upgrade
                              </button>
                              <button
                                onClick={() => handleUnassignRoom(res)}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded font-bold transition-colors"
                                title="Unassign Room"
                              >
                                Unassign
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleOpenAssignModal(res, 'assign')}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors shadow-xs flex items-center space-x-1"
                            >
                              <Grid3X3 className="w-3.5 h-3.5" />
                              <span>Assign Room</span>
                            </button>
                          )}

                          {res.status !== 'Checked-In' && res.status !== 'Cancelled' && isDueToday && (
                            <button
                              onClick={() => onOpenCheckIn(res.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition-colors shadow-xs flex items-center space-x-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Check-In</span>
                            </button>
                          )}

                          {res.status !== 'Checked-In' && res.status !== 'Cancelled' && (
                            <button
                              onClick={() => {
                                setCancellingRes(res);
                                setCancelReason('Guest requested cancellation at front desk');
                              }}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Cancel this reservation"
                            >
                              <XCircle className="w-4 h-4" />
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

      {/* Room Assignment & Validation Modal */}
      {targetReservation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Grid3X3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-tight">
                  {actionType === 'assign' ? 'Assign Room to Reservation' :
                   actionType === 'upgrade' ? 'Upgrade Room Assignment' :
                   actionType === 'downgrade' ? 'Downgrade Room Assignment' :
                   'Change Room Assignment'}
                </h3>
              </div>
              <button 
                onClick={() => setTargetReservation(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Guest & Reservation Briefing */}
              <div className="bg-blue-50/60 border border-blue-200 p-3 rounded-lg flex flex-wrap justify-between gap-2">
                <div>
                  <div className="font-bold text-gray-900 text-sm">{targetReservation.guestName}</div>
                  <div className="text-[11px] text-gray-600 font-mono">
                    {targetReservation.reservationNumber} • {targetReservation.guestPhone}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-gray-800">{targetReservation.arrivalDate} → {targetReservation.departureDate}</div>
                  <div className="text-[11px] text-blue-700 font-bold">{targetReservation.roomTypeName} ({targetReservation.adults} Adults)</div>
                </div>
              </div>

              {/* Validation Error Alert Banner */}
              {validationError && (
                <div className="bg-red-50 border-2 border-red-400 p-3 rounded-lg text-red-900 flex items-start space-x-2.5 animate-in fade-in">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wide text-red-800">{validationError.title}</div>
                    <div className="text-xs mt-0.5 font-medium">{validationError.message}</div>
                    <div className="text-[10px] text-red-600 mt-1 font-mono">
                      System Rule: Double booking prevention and status lock enforced. Please select a valid available room.
                    </div>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="bg-emerald-50 border border-emerald-400 p-3 rounded-lg text-emerald-900 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-xs">{successMessage}</span>
                </div>
              )}

              {/* Action Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActionType('assign')}
                  className={`px-3 py-1.5 rounded-md font-bold text-xs border ${
                    actionType === 'assign' || actionType === 'change'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 border-gray-300'
                  }`}
                >
                  Standard Matching ({targetReservation.roomTypeName})
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('upgrade')}
                  className={`px-3 py-1.5 rounded-md font-bold text-xs border ${
                    actionType === 'upgrade'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-gray-50 text-gray-700 border-gray-300'
                  }`}
                >
                  Upgrade (Higher Category)
                </button>
              </div>

              {/* Room Grid Selector */}
              <div>
                <label className="block text-gray-700 font-bold text-xs mb-2">
                  Select Room for Allocation (Verified Against Date Span: {targetReservation.arrivalDate} to {targetReservation.departureDate}):
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1 border border-gray-200 rounded-lg bg-gray-50">
                  {db.rooms
                    .filter(room => {
                      if (actionType === 'assign' || actionType === 'change') {
                        return room.roomTypeId === targetReservation.roomTypeId;
                      }
                      return true; // for upgrade, show all
                    })
                    .map(room => {
                      const avail = pmsService.checkRoomAvailability(
                        room.id,
                        targetReservation.arrivalDate,
                        targetReservation.departureDate,
                        targetReservation.id
                      );
                      const isSelected = selectedRoomId === room.id;
                      const isAvailable = avail.isAvailable;

                      return (
                        <div
                          key={room.id}
                          onClick={() => {
                            setSelectedRoomId(room.id);
                            setValidationError(null);
                          }}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20 shadow-xs'
                              : isAvailable
                              ? 'border-gray-300 bg-white hover:border-gray-400'
                              : 'border-gray-200 bg-gray-100 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-gray-900 font-mono">Room {room.roomNumber}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>

                          <div className="text-[10px] text-gray-500 mt-1 font-medium truncate">
                            {room.roomTypeName} • Floor {room.floor}
                          </div>

                          <div className="text-[9px] text-gray-400 mt-0.5">
                            Status: {room.operationalStatus} ({room.housekeepingStatus})
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Upgrade Reason & Rate Override */}
              {(actionType === 'upgrade' || actionType === 'downgrade') && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Adjusted Nightly Rate (৳):</label>
                    <input
                      type="number"
                      value={customRate}
                      onChange={e => setCustomRate(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs font-mono font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Authorization Reason:</label>
                    <input
                      type="text"
                      placeholder="e.g. Complimentary VIP Upgrade, GM Approval..."
                      value={upgradeReason}
                      onChange={e => setUpgradeReason(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setTargetReservation(null)}
                className="px-4 py-2 border border-gray-300 rounded-md font-bold text-gray-700 hover:bg-gray-100 text-xs"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleValidateAndAssign}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs shadow-xs flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Validate & Confirm Assignment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingRes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-md w-full shadow-2xl space-y-3.5 text-xs text-gray-800">
            <div className="flex items-center space-x-2.5 text-rose-600">
              <XCircle className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-gray-900 text-sm">Cancel Reservation {cancellingRes.reservationNumber}?</h4>
            </div>
            <p className="text-gray-600">
              Are you sure you want to cancel the reservation for <strong className="text-gray-900 font-semibold">{cancellingRes.guestName}</strong>?
              Any pre-assigned room will be released immediately and this booking will be removed from all arrival and room assignment lists.
            </p>
            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Reason for Cancellation:</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Guest change of plans, cancelled booking"
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
                onClick={handleConfirmCancelReservation}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs transition shadow-xs flex items-center space-x-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Confirm Cancellation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};
