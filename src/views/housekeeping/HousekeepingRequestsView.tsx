import React, { useState, useEffect } from 'react';
import {
  Bell, Search, Filter, Plus, Clock, CheckCircle2,
  AlertTriangle, User, BedDouble, DollarSign, Check, X,
  ArrowRight, Phone, MessageSquare
} from 'lucide-react';
import { housekeepingService } from '../../services/housekeepingService';
import { pmsService } from '../../services/pmsService';
import {
  HousekeepingRequest,
  RequestSource,
  RequestType,
  RequestStatus,
  TaskPriority
} from '../../types/housekeeping';

export const HousekeepingRequestsView: React.FC = () => {
  const [requests, setRequests] = useState<HousekeepingRequest[]>(housekeepingService.getState().requests);
  const [staff, setStaff] = useState(housekeepingService.getState().staff);
  const [rooms, setRooms] = useState(pmsService.getState().rooms);

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Request Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reqRoomId, setReqRoomId] = useState('');
  const [reqSource, setReqSource] = useState<RequestSource>('Front Desk');
  const [reqType, setReqType] = useState<RequestType>('Extra Towel');
  const [reqPriority, setReqPriority] = useState<TaskPriority>('Normal');
  const [reqAssignedTo, setReqAssignedTo] = useState('');
  const [reqIsChargeable, setReqIsChargeable] = useState(false);
  const [reqChargeAmount, setReqChargeAmount] = useState(0);
  const [reqNotes, setReqNotes] = useState('');
  const [activeStayGuestName, setActiveStayGuestName] = useState<string | null>(null);

  useEffect(() => {
    const unsub = housekeepingService.subscribe(s => {
      setRequests([...s.requests]);
      setStaff([...s.staff]);
      setRooms([...pmsService.getState().rooms]);
    });
    return unsub;
  }, []);

  const handleRoomSelect = (roomId: string) => {
    setReqRoomId(roomId);
    if (!roomId) {
      setActiveStayGuestName(null);
      return;
    }
    const currentStays = pmsService.getState().stays;
    const stay = currentStays.find(s => s.roomId === roomId && s.status === 'Active');
    if (stay) {
      setActiveStayGuestName(stay.guestName);
    } else {
      setActiveStayGuestName(null);
    }
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqRoomId) return;

    housekeepingService.createRequest({
      source: reqSource,
      requestType: reqType,
      roomId: reqRoomId,
      priority: reqPriority,
      assignedTo: reqAssignedTo || undefined,
      isChargeable: reqIsChargeable,
      chargeAmount: reqIsChargeable ? reqChargeAmount : 0,
      notes: reqNotes
    });

    setIsCreateModalOpen(false);
    setReqRoomId('');
    setReqNotes('');
    setReqChargeAmount(0);
    setReqIsChargeable(false);
    setActiveStayGuestName(null);
  };

  const handleStatusChange = (requestId: string, newStatus: RequestStatus) => {
    housekeepingService.updateRequestStatus(requestId, newStatus);
  };

  const handleAssignAttendant = (requestId: string, attendantId: string) => {
    housekeepingService.assignRequest(requestId, attendantId);
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    if (statusFilter !== 'All' && req.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && req.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRoom = req.roomNumber.toLowerCase().includes(q);
      const matchType = req.requestType.toLowerCase().includes(q);
      const matchGuest = req.guestName?.toLowerCase().includes(q);
      const matchNum = req.requestNumber.toLowerCase().includes(q);
      if (!matchRoom && !matchType && !matchGuest && !matchNum) return false;
    }
    return true;
  });

  const attendants = staff.filter(s => s.role === 'Attendant' || s.role === 'Supervisor');

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-md">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight">
                Housekeeping Service Requests & Guest Calls
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                LIVE DISPATCH
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Real-time guest call dispatch, SLA delivery timers, automatic attendant assignment, and folio billing.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-md shadow-blue-900/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Log Service Request</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400">Total Requests Today</span>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{requests.length}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
          <span className="text-[11px] font-semibold text-amber-400">Pending / In Progress</span>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {requests.filter(r => r.status === 'New' || r.status === 'Assigned' || r.status === 'In Progress').length}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
          <span className="text-[11px] font-semibold text-rose-400">Urgent / VIP Calls</span>
          <div className="text-2xl font-bold font-mono text-rose-300 mt-1">
            {requests.filter(r => r.priority === 'Urgent' || r.priority === 'VIP').length}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
          <span className="text-[11px] font-semibold text-emerald-400">Completed & Delivered</span>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
            {requests.filter(r => r.status === 'Completed').length}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by room, guest, request #..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="New">New / Unassigned</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="VIP">VIP</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10.5px] tracking-wider">
              <tr>
                <th className="p-3.5">Req # & Time</th>
                <th className="p-3.5">Room & Guest</th>
                <th className="p-3.5">Service Requested</th>
                <th className="p-3.5">Priority & Source</th>
                <th className="p-3.5">Assigned Staff</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No matching housekeeping requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-blue-400">{req.requestNumber}</div>
                      <div className="text-[10.5px] text-slate-500">
                        {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-100 text-sm">Room {req.roomNumber}</div>
                      <div className="text-[11px] text-slate-400">{req.guestName || 'Front Desk Caller'}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-slate-200">{req.requestType}</div>
                      {req.notes && <div className="text-[11px] text-slate-400 italic">{req.notes}</div>}
                      {req.isChargeable && (
                        <span className="text-[10px] text-purple-400 font-bold block mt-0.5">
                          Chargeable: ৳{(req.chargeAmount || 0)?.toLocaleString()} {req.isPostedToFolio && '✓ Debited'}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 space-y-1">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                        req.priority === 'Urgent'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : req.priority === 'VIP'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {req.priority}
                      </span>
                      <div className="text-[10.5px] text-slate-500">{req.source}</div>
                    </td>

                    <td className="p-3.5">
                      {req.status === 'Completed' ? (
                        <span className="text-slate-300 font-medium">{req.assignedAttendantName || 'Staff'}</span>
                      ) : (
                        <select
                          value={req.assignedTo || ''}
                          onChange={e => handleAssignAttendant(req.id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                          <option value="">-- Assign Cleaner --</option>
                          {attendants.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.shift})
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                        req.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : req.status === 'In Progress'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {req.status}
                      </span>
                    </td>

                    <td className="p-3.5 text-right space-x-1.5">
                      {req.status !== 'Completed' && req.status !== 'Cancelled' && (
                        <>
                          {req.status === 'Assigned' && (
                            <button
                              onClick={() => handleStatusChange(req.id, 'In Progress')}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold transition-colors"
                            >
                              Start
                            </button>
                          )}

                          <button
                            onClick={() => handleStatusChange(req.id, 'Completed')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            Mark Delivered
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Request */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateRequest} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Log Housekeeping Service Call</h3>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Room Number:</label>
                <select
                  required
                  value={reqRoomId}
                  onChange={e => handleRoomSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Room --</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.roomTypeName}) - {r.operationalStatus}
                    </option>
                  ))}
                </select>
              </div>

              {activeStayGuestName && (
                <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/30 text-slate-300 text-xs">
                  Guest: <strong className="text-blue-300">{activeStayGuestName}</strong> (In-House Stay)
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Service / Item:</label>
                  <select
                    value={reqType}
                    onChange={e => setReqType(e.target.value as RequestType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  >
                    <option value="Extra Towel">Extra Towel</option>
                    <option value="Extra Pillow">Extra Pillow</option>
                    <option value="Extra Blanket">Extra Blanket</option>
                    <option value="Baby Cot">Baby Cot</option>
                    <option value="Toiletries">Toiletries</option>
                    <option value="Water">Mineral Water</option>
                    <option value="Room Cleaning">Room Cleaning</option>
                    <option value="Deep Cleaning">Deep Cleaning</option>
                    <option value="Turndown">Turndown Service</option>
                    <option value="Laundry">Guest Laundry Bag</option>
                    <option value="Iron">Iron & Ironing Board</option>
                    <option value="Other">Other Request</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Call Source:</label>
                  <select
                    value={reqSource}
                    onChange={e => setReqSource(e.target.value as RequestSource)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  >
                    <option value="Front Desk">Front Desk</option>
                    <option value="Guest">Guest Direct Call</option>
                    <option value="Housekeeping">Housekeeping Floor</option>
                    <option value="Other Departments">Other Department</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Priority Level:</label>
                  <select
                    value={reqPriority}
                    onChange={e => setReqPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  >
                    <option value="Normal">Normal (SLA: 20 mins)</option>
                    <option value="High">High (SLA: 12 mins)</option>
                    <option value="VIP">VIP (SLA: 8 mins)</option>
                    <option value="Urgent">Urgent (SLA: 5 mins)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Assign To Staff:</label>
                  <select
                    value={reqAssignedTo}
                    onChange={e => setReqAssignedTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  >
                    <option value="">-- Unassigned (Floor Pool) --</option>
                    {attendants.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reqIsChargeable}
                    onChange={e => setReqIsChargeable(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                  />
                  <span className="font-bold text-slate-200">Chargeable to Guest Folio</span>
                </label>

                {reqIsChargeable && (
                  <div className="space-y-1 pt-1">
                    <label className="text-slate-400">Charge Amount (৳):</label>
                    <input
                      type="number"
                      min="0"
                      value={reqChargeAmount}
                      onChange={e => setReqChargeAmount(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Special Instructions:</label>
                <textarea
                  value={reqNotes}
                  onChange={e => setReqNotes(e.target.value)}
                  placeholder="e.g. Extra pillows requested for baby cot"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-900/30"
              >
                Dispatch Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
