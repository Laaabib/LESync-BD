import React, { useState, useEffect } from 'react';
import {
  Bell, Clock, CheckCircle2, AlertTriangle, Search, PlusCircle,
  PhoneCall, Coffee, UserCheck, X, RefreshCw, Volume2, Calendar
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';

export interface WakeUpCall {
  id: string;
  roomNumber: string;
  guestName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  callType: 'Operator Personal' | 'VIP Morning Tea & Call' | 'Automated System';
  status: 'Scheduled' | 'Ringing' | 'Completed' | 'Snoozed' | 'Cancelled';
  snoozeCount: number;
  notes?: string;
  createdBy: string;
  completedAt?: string;
}

const STORAGE_WAKEUP_KEY = 'cculb_wakeup_calls_v1';

const INITIAL_WAKEUP_CALLS: WakeUpCall[] = [
  {
    id: 'wuc-101',
    roomNumber: '401',
    guestName: 'Engr. Mohammad Rahman',
    date: '2026-09-01',
    time: '06:30',
    callType: 'VIP Morning Tea & Call',
    status: 'Scheduled',
    snoozeCount: 0,
    notes: 'Airport flight departure at 09:30 AM. Deliver black tea.',
    createdBy: 'Front Desk'
  },
  {
    id: 'wuc-102',
    roomNumber: '201',
    guestName: 'Dr. Shahriar Kabir',
    date: '2026-09-01',
    time: '07:00',
    callType: 'Operator Personal',
    status: 'Completed',
    snoozeCount: 0,
    notes: 'Conference keynote at 09:00 AM.',
    createdBy: 'Front Desk',
    completedAt: '2026-09-01T07:02:00Z'
  },
  {
    id: 'wuc-103',
    roomNumber: '304',
    guestName: 'Tanvir Hossain',
    date: '2026-09-01',
    time: '08:00',
    callType: 'Operator Personal',
    status: 'Scheduled',
    snoozeCount: 0,
    notes: 'Breakfast with delegation.',
    createdBy: 'Front Desk'
  }
];

export const WakeUpCallsView: React.FC = () => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [wakeUpList, setWakeUpList] = useState<WakeUpCall[]>(() => {
    const saved = localStorage.getItem(STORAGE_WAKEUP_KEY);
    return saved ? JSON.parse(saved) : INITIAL_WAKEUP_CALLS;
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New call form
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newGuestName, setNewGuestName] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('06:30');
  const [newType, setNewType] = useState<WakeUpCall['callType']>('Operator Personal');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  const saveList = (newList: WakeUpCall[]) => {
    setWakeUpList(newList);
    localStorage.setItem(STORAGE_WAKEUP_KEY, JSON.stringify(newList));
  };

  const handleRoomSelect = (roomNum: string) => {
    setNewRoomNumber(roomNum);
    const activeStay = db.stays.find(s => s.roomNumber === roomNum && s.status === 'Active');
    if (activeStay) {
      setNewGuestName(activeStay.guestName);
    }
  };

  const handleAddWakeUpCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber || !newTime) return;

    const newCall: WakeUpCall = {
      id: `wuc-${Date.now()}`,
      roomNumber: newRoomNumber,
      guestName: newGuestName || `Guest Room ${newRoomNumber}`,
      date: newDate,
      time: newTime,
      callType: newType,
      status: 'Scheduled',
      snoozeCount: 0,
      notes: newNotes,
      createdBy: 'Front Desk Executive'
    };

    saveList([newCall, ...wakeUpList]);
    setIsCreateOpen(false);
    setNewRoomNumber('');
    setNewGuestName('');
    setNewNotes('');

    pmsService.logAudit(
      'Scheduled Wake-Up Call',
      'Stay',
      newCall.id,
      undefined,
      `Scheduled wake-up call for Room ${newRoomNumber} (${newCall.guestName}) at ${newTime} on ${newDate} [${newType}]`
    );
  };

  const handleUpdateStatus = (id: string, newStatus: WakeUpCall['status']) => {
    const updated = wakeUpList.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: newStatus,
          completedAt: newStatus === 'Completed' ? new Date().toISOString() : item.completedAt,
          snoozeCount: newStatus === 'Snoozed' ? item.snoozeCount + 1 : item.snoozeCount
        };
      }
      return item;
    });
    saveList(updated);
  };

  const handleDeleteCall = (id: string) => {
    const updated = wakeUpList.filter(item => item.id !== id);
    saveList(updated);
  };

  const filteredCalls = wakeUpList.filter(call => {
    if (search) {
      const q = search.toLowerCase();
      const matchRoom = call.roomNumber.includes(q);
      const matchGuest = call.guestName.toLowerCase().includes(q);
      if (!matchRoom && !matchGuest) return false;
    }

    if (statusFilter !== 'all' && call.status !== statusFilter) return false;

    return true;
  });

  const scheduledCount = wakeUpList.filter(c => c.status === 'Scheduled').length;
  const completedCount = wakeUpList.filter(c => c.status === 'Completed').length;
  const inHouseStays = db.stays.filter(s => s.status === 'Active');

  return (
    <div className="space-y-4 text-xs text-gray-900">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 p-4 rounded-lg shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shadow-xs">
            <PhoneCall className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-gray-900 uppercase tracking-tight">Front Office Wake-Up Call Coordinator</h1>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 font-mono">
                TELEPHONY & ALERTS
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-0.5">
              Automated and operator morning call scheduler with VIP tea delivery tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Schedule Wake-Up Call</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Scheduled Today</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{scheduledCount}</div>
          <div className="text-[10px] text-blue-600 font-medium">Pending execution</div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{completedCount}</div>
          <div className="text-[10px] text-emerald-600 font-medium">Successfully alerted</div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">VIP Personal Service</span>
            <Coffee className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {wakeUpList.filter(c => c.callType === 'VIP Morning Tea & Call').length}
          </div>
          <div className="text-[10px] text-amber-600 font-medium">Morning tea hospitality</div>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">In-House Stays</span>
            <UserCheck className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{inHouseStays.length}</div>
          <div className="text-[10px] text-gray-500 font-medium">Eligible rooms</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white border border-gray-200 p-3 rounded-lg shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Room #, Guest Name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-xs font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Snoozed">Snoozed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Wake-Up Call Grid/Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Room / Guest</th>
                <th className="p-3">Schedule Date & Time</th>
                <th className="p-3">Service Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Notes / Hospitality Request</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    <Clock className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="font-bold text-xs text-gray-600">No wake-up calls scheduled</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Click "Schedule Wake-Up Call" above to register a new request.</p>
                  </td>
                </tr>
              ) : (
                filteredCalls.map(call => (
                  <tr key={call.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-blue-50 text-blue-800 border border-blue-200 font-bold font-mono rounded text-xs">
                          Room {call.roomNumber}
                        </span>
                        <div>
                          <div className="font-bold text-gray-900">{call.guestName}</div>
                          <div className="text-[10px] text-gray-500">By: {call.createdBy}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center space-x-1.5 font-mono text-sm font-bold text-gray-900">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>{call.time}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">{call.date}</div>
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        call.callType === 'VIP Morning Tea & Call'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {call.callType}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        call.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        call.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                        call.status === 'Snoozed' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {call.status}
                        {call.snoozeCount > 0 && ` (${call.snoozeCount}x)`}
                      </span>
                    </td>

                    <td className="p-3 text-[11px] text-gray-600 max-w-xs truncate">
                      {call.notes || <span className="text-gray-400 italic">None</span>}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {call.status === 'Scheduled' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(call.id, 'Completed')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition-colors shadow-xs"
                            >
                              Done
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(call.id, 'Snoozed')}
                              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded font-bold transition-colors"
                            >
                              Snooze
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDeleteCall(call.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="Delete call"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Wake-Up Call Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-gray-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <PhoneCall className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-sm uppercase">Schedule Wake-Up Call</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWakeUpCall} className="p-4 space-y-3">
              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Select Active In-House Room:</label>
                <select
                  value={newRoomNumber}
                  onChange={e => handleRoomSelect(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Choose Room --</option>
                  {inHouseStays.map(s => (
                    <option key={s.id} value={s.roomNumber}>
                      Room {s.roomNumber} — {s.guestName}
                    </option>
                  ))}
                  {db.rooms.map(r => (
                    <option key={r.id} value={r.roomNumber}>
                      Room {r.roomNumber} ({r.roomTypeName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Guest Name:</label>
                <input
                  type="text"
                  value={newGuestName}
                  onChange={e => setNewGuestName(e.target.value)}
                  placeholder="Guest Full Name"
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Date:</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Wake-Up Time:</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Service Type:</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium"
                >
                  <option value="Operator Personal">Operator Personal Phone Call</option>
                  <option value="VIP Morning Tea & Call">VIP Morning Tea & Room Call</option>
                  <option value="Automated System">Automated PBX Ring</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Special Notes / Flight Time:</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Flight departure at 09:30 AM, black tea with honey..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded font-bold text-gray-700 hover:bg-gray-100 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs shadow-xs"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
