import React, { useState } from 'react';
import {
  X, BedDouble, Sparkles, Wrench, ArrowRightLeft, LogOut,
  Receipt, User, Calendar, Phone, CheckCircle2, AlertTriangle, ShieldCheck, Lock
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { rbacService } from '../../services/rbacService';
import { Room, HousekeepingStatus, MaintenancePriority } from '../../types/pms';

interface RoomDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  onOpenFolio?: (folioId: string) => void;
  onOpenCheckout?: (stayId: string) => void;
  onOpenCheckIn?: (reservationId?: string) => void;
  onSuccess?: () => void;
}

export const RoomDetailDrawer: React.FC<RoomDetailDrawerProps> = ({
  isOpen,
  onClose,
  roomId,
  onOpenFolio,
  onOpenCheckout,
  onOpenCheckIn,
  onSuccess
}) => {
  const db = pmsService.getState();
  const room = db.rooms.find(r => r.id === roomId);

  // Active stay if occupied
  const activeStay = room ? db.stays.find(s => s.roomId === room.id && s.status === 'Active') : undefined;
  const activeFolio = activeStay ? db.folios.find(f => f.id === activeStay.folioId) : undefined;
  const activeGuest = activeStay ? db.guests.find(g => g.id === activeStay.guestId) : undefined;

  // Transfer State
  const [showTransfer, setShowTransfer] = useState(false);
  const [targetRoomId, setTargetRoomId] = useState('');
  const [transferReason, setTransferReason] = useState('Guest requested higher floor / AC noise');

  // Maintenance Ticket State
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [maintTitle, setMaintTitle] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintPriority, setMaintPriority] = useState<MaintenancePriority>('High');
  const [maintOOO, setMaintOOO] = useState(true);

  const [message, setMessage] = useState('');

  if (!isOpen || !room) return null;

  const candidateTransferRooms = db.rooms.filter(r => 
    r.id !== room.id && 
    r.active && 
    (r.operationalStatus === 'Available' || r.operationalStatus === 'Inspected') &&
    !db.stays.some(s => s.roomId === r.id && s.status === 'Active')
  );

  const canEditHK = rbacService.isSuperAdmin() || rbacService.isModuleAllowed('housekeeping') || rbacService.hasPermission('housekeeping:edit') || rbacService.hasPermission('housekeeping:*');

  const handleHKStatusChange = (status: HousekeepingStatus) => {
    if (!canEditHK) {
      setMessage('Access Restricted: Housekeeping status updates are restricted to Housekeeping Department personnel.');
      return;
    }
    try {
      pmsService.updateHousekeepingStatus(room.id, status);
      setMessage(`Updated Room ${room.roomNumber} Housekeeping to ${status}`);
      onSuccess?.();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleExecuteTransfer = () => {
    if (!activeStay || !targetRoomId) return;
    try {
      pmsService.transferRoom(activeStay.id, targetRoomId, transferReason);
      setShowTransfer(false);
      setMessage(`Transferred stay to new room successfully.`);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setMessage(`Transfer error: ${err.message}`);
    }
  };

  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintTitle.trim()) return;
    try {
      pmsService.createMaintenanceTicket({
        roomId: room.id,
        title: maintTitle,
        description: maintDesc || 'Reported from Room Rack',
        priority: maintPriority,
        marksOutOfOrder: maintOOO
      });
      setShowMaintenance(false);
      setMessage(`Maintenance ticket created.`);
      onSuccess?.();
    } catch (err: any) {
      setMessage(`Maintenance error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-150">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-lg h-full flex flex-col shadow-2xl text-xs text-slate-200">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-base border ${
              room.operationalStatus === 'Occupied' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
              room.operationalStatus === 'Available' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
              room.operationalStatus === 'Dirty' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
              room.operationalStatus === 'Reserved' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
              'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {room.roomNumber}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-100">Room {room.roomNumber}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-800 text-slate-300">
                  Floor {room.floor}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{room.roomTypeName || 'Deluxe Room'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {message && (
            <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded text-amber-300 text-[11px]">
              {message}
            </div>
          )}

          {/* Current Status Pills */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Operational Status</span>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded font-bold text-xs ${
                room.operationalStatus === 'Occupied' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                room.operationalStatus === 'Available' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                room.operationalStatus === 'Reserved' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                room.operationalStatus === 'Dirty' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-slate-800 text-slate-300'
              }`}>
                {room.operationalStatus}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Housekeeping Status</span>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded font-bold text-xs ${
                room.housekeepingStatus === 'Clean' ? 'bg-emerald-500/20 text-emerald-300' :
                room.housekeepingStatus === 'Inspected' ? 'bg-purple-500/20 text-purple-300' :
                room.housekeepingStatus === 'Dirty' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
              }`}>
                {room.housekeepingStatus}
              </span>
            </div>
          </div>

          {/* If Occupied: In-House Guest Details & Actions */}
          {activeStay && (
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Current In-House Guest</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">{activeStay.stayNumber}</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Guest Name:</span>
                  <span className="font-bold text-slate-100">{activeStay.guestName}</span>
                </div>
                {activeGuest && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-mono text-slate-300">{activeGuest.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Check-In Time:</span>
                  <span>{activeStay.checkInAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expected Check-Out:</span>
                  <span className="text-amber-300">{activeStay.expectedCheckOutAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Key Cards:</span>
                  <span>{activeStay.keyCardsIssued} Cards</span>
                </div>
                {activeFolio && (
                  <div className="flex justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Live Folio Balance:</span>
                    <span className="font-mono font-bold text-amber-400">৳{(activeFolio.balance || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons for In-House Stay */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                {activeFolio && (
                  <button
                    onClick={() => {
                      onOpenFolio?.(activeFolio.id);
                      onClose();
                    }}
                    className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium text-[11px] transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Folio</span>
                  </button>
                )}

                <button
                  onClick={() => setShowTransfer(!showTransfer)}
                  className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium text-[11px] transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Transfer</span>
                </button>

                <button
                  onClick={() => {
                    onOpenCheckout?.(activeStay.id);
                    onClose();
                  }}
                  className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded font-bold text-[11px] transition-colors shadow"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Check-Out</span>
                </button>
              </div>

              {/* Room Transfer Subform */}
              {showTransfer && (
                <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg space-y-2 mt-2">
                  <span className="font-bold text-slate-200 block text-[11px]">Inter-Room Transfer Form</span>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Select New Clean Room:</span>
                    <select
                      value={targetRoomId}
                      onChange={(e) => setTargetRoomId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                    >
                      <option value="">-- Choose Target Room ({candidateTransferRooms.length} available) --</option>
                      {candidateTransferRooms.map(r => (
                        <option key={r.id} value={r.id}>
                          Room {r.roomNumber} (Floor {r.floor}) — {r.roomTypeName} [{r.housekeepingStatus} / {r.operationalStatus}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Transfer Reason / Audit Note:</span>
                    <input
                      type="text"
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowTransfer(false)}
                      className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-[11px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteTransfer}
                      disabled={!targetRoomId}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-[11px] disabled:opacity-50"
                    >
                      Execute Transfer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Housekeeping Status Section */}
          {canEditHK ? (
            <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Housekeeping Status Actions</span>
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => handleHKStatusChange('Clean')}
                  className="px-2 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold rounded text-[10.5px] border border-emerald-500/30 transition-colors"
                >
                  Mark Clean
                </button>
                <button
                  onClick={() => handleHKStatusChange('Inspected')}
                  className="px-2 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold rounded text-[10.5px] border border-purple-500/30 transition-colors"
                >
                  Inspected
                </button>
                <button
                  onClick={() => handleHKStatusChange('Cleaning')}
                  className="px-2 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-semibold rounded text-[10.5px] border border-blue-500/30 transition-colors"
                >
                  Cleaning
                </button>
                <button
                  onClick={() => handleHKStatusChange('Dirty')}
                  className="px-2 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold rounded text-[10.5px] border border-amber-500/30 transition-colors"
                >
                  Mark Dirty
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Housekeeping Status</span>
                </span>
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Housekeeping Authority Only</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    room.housekeepingStatus === 'Clean' ? 'bg-emerald-400' :
                    room.housekeepingStatus === 'Inspected' ? 'bg-purple-400' :
                    room.housekeepingStatus === 'Dirty' ? 'bg-rose-400' : 'bg-blue-400'
                  }`} />
                  <span className="font-bold text-slate-200">{room.housekeepingStatus}</span>
                </div>
                <span className="text-[10px] text-slate-500 italic">FO has read-only status access</span>
              </div>
            </div>
          )}

          {/* Maintenance Actions */}
          <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
                <Wrench className="w-3.5 h-3.5 text-slate-400" />
                <span>Facility & Maintenance</span>
              </span>
              <button
                onClick={() => setShowMaintenance(!showMaintenance)}
                className="text-[10.5px] text-amber-400 hover:underline"
              >
                + Log Ticket
              </button>
            </div>

            {showMaintenance && (
              <form onSubmit={handleCreateMaintenance} className="space-y-2 pt-2 border-t border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Issue Title:</span>
                  <input
                    type="text"
                    value={maintTitle}
                    onChange={(e) => setMaintTitle(e.target.value)}
                    placeholder="e.g. AC compressor noise, bathroom leak"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Priority:</span>
                    <select
                      value={maintPriority}
                      onChange={(e) => setMaintPriority(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical / Emergency</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-4">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={maintOOO}
                        onChange={(e) => setMaintOOO(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-rose-500"
                      />
                      <span className="text-[10px] text-rose-300 font-bold">Set Out of Order</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowMaintenance(false)}
                    className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-[11px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px]"
                  >
                    Dispatch Maintenance
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
