import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft, BedDouble, CheckCircle2, AlertTriangle, Search,
  Wrench, Sparkles, ShieldAlert, History, Clock, FileText, X,
  ChevronRight, RefreshCw, UserCheck
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';
import { Stay, Room, AuditLog } from '../types/pms';

interface RoomMoveViewProps {
  onOpenCheckout?: (stayId: string) => void;
  onOpenFolio?: (folioId: string) => void;
}

export const RoomMoveView: React.FC<RoomMoveViewProps> = ({
  onOpenCheckout,
  onOpenFolio
}) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [selectedStayId, setSelectedStayId] = useState<string>('');
  const [targetRoomId, setTargetRoomId] = useState<string>('');
  const [moveReason, setMoveReason] = useState<string>('Guest Request');
  const [customReasonDetails, setCustomReasonDetails] = useState<string>('');
  const [keyCardsReissued, setKeyCardsReissued] = useState<number>(2);
  const [searchInHouse, setSearchInHouse] = useState<string>('');
  
  // Validation & Error states
  const [errorBanner, setErrorBanner] = useState<{ title: string; message: string } | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  const inHouseStays = db.stays.filter(s => s.status === 'Active');
  
  const filteredStays = inHouseStays.filter(s =>
    s.guestName.toLowerCase().includes(searchInHouse.toLowerCase()) ||
    s.roomNumber.includes(searchInHouse) ||
    s.stayNumber.toLowerCase().includes(searchInHouse.toLowerCase())
  );

  const selectedStay = inHouseStays.find(s => s.id === selectedStayId);
  const currentRoom = selectedStay ? db.rooms.find(r => r.id === selectedStay.roomId) : null;
  const targetRoom = targetRoomId ? db.rooms.find(r => r.id === targetRoomId) : null;

  // Filter available rooms (Clean / Available)
  const availableRooms = db.rooms.filter(r => {
    if (!selectedStay) return false;
    if (r.id === selectedStay.roomId) return false; // same room
    if (!r.active) return false;
    if (r.operationalStatus === 'Occupied') return false;
    if (r.operationalStatus === 'Out of Order') return false;
    if (r.operationalStatus === 'Blocked') return false;

    // Check availability against stay end date (minimum 1 night window for availability check)
    const todayStr = new Date().toISOString().split('T')[0];
    let expDep = selectedStay.expectedCheckOutAt ? selectedStay.expectedCheckOutAt.split('T')[0] : todayStr;
    if (expDep <= todayStr) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expDep = tomorrow.toISOString().split('T')[0];
    }
    const avail = pmsService.checkRoomAvailability(r.id, todayStr, expDep);
    return avail.isAvailable;
  });

  // Room Move History from Audit Logs
  const roomMoveLogs = db.auditLogs.filter(log => 
    log.action === 'Room Transfer' || log.action.includes('Room Move') || log.action.includes('Transferred')
  );

  const handleExecuteRoomMove = () => {
    setErrorBanner(null);
    setSuccessBanner(null);

    if (!selectedStay) {
      setErrorBanner({
        title: 'NO ACTIVE STAY SELECTED',
        message: 'Please select an in-house guest stay to initiate the room move.'
      });
      return;
    }

    if (!targetRoomId) {
      setErrorBanner({
        title: 'NO DESTINATION ROOM SELECTED',
        message: 'Please select a valid vacant clean room for guest relocation.'
      });
      return;
    }

    const newRoom = db.rooms.find(r => r.id === targetRoomId);
    if (!newRoom) {
      setErrorBanner({
        title: 'ROOM NOT FOUND',
        message: 'The selected destination room was not found in the PMS registry.'
      });
      return;
    }

    if (newRoom.operationalStatus === 'Occupied') {
      setErrorBanner({
        title: 'ROOM NOT AVAILABLE',
        message: `Room ${newRoom.roomNumber} is currently occupied. Please select another room.`
      });
      return;
    }

    if (newRoom.operationalStatus === 'Out of Order') {
      setErrorBanner({
        title: 'ROOM OUT OF ORDER',
        message: `Room ${newRoom.roomNumber} is currently out of order for engineering repairs.`
      });
      return;
    }

    const fullReason = customReasonDetails.trim() 
      ? `${moveReason} (${customReasonDetails.trim()})` 
      : moveReason;

    try {
      setIsProcessing(true);
      const oldRoomNum = selectedStay.roomNumber;
      
      // Execute atomic room transfer via pmsService
      pmsService.transferRoom(selectedStay.id, newRoom.id, fullReason);
      
      // Update key cards count
      selectedStay.keyCardsIssued = keyCardsReissued;

      setSuccessBanner(`Room Move Completed: ${selectedStay.guestName} successfully relocated from Room ${oldRoomNum} → Room ${newRoom.roomNumber}. Old room set to Dirty with Housekeeping turnover task dispatched.`);
      setSelectedStayId('');
      setTargetRoomId('');
      setCustomReasonDetails('');
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorBanner({
        title: 'ROOM MOVE FAILED',
        message: err.message || 'An error occurred while transferring the guest.'
      });
    }
  };

  return (
    <div className="space-y-4 text-xs text-gray-900">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 p-4 rounded-lg shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shadow-xs">
            <ArrowRightLeft className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-gray-900 uppercase tracking-tight">Front Office Guest Room Move Command</h1>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 font-mono">
                INTER-ROOM RELOCATION
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-0.5">
              Live guest relocation workflow with automatic housekeeping dispatch, stay record updates, and folio adjustments.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded font-mono font-bold text-gray-700">
            {inHouseStays.length} In-House Stays
          </span>
        </div>
      </div>

      {/* Notifications */}
      {errorBanner && (
        <div className="bg-red-50 border-2 border-red-400 p-3 rounded-lg text-red-900 flex items-start space-x-2.5 animate-in fade-in">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-xs uppercase tracking-wide text-red-800">{errorBanner.title}</div>
            <div className="text-xs mt-0.5 font-medium">{errorBanner.message}</div>
          </div>
        </div>
      )}

      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-400 p-3 rounded-lg text-emerald-900 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold text-xs">{successBanner}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Select In-House Guest */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-xs p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h2 className="font-bold text-gray-800 text-xs uppercase flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">1</span>
              <span>Select Current In-House Stay</span>
            </h2>
            <span className="text-[10px] text-gray-500 font-bold">{filteredStays.length} Available</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Room #, Guest Name..."
              value={searchInHouse}
              onChange={e => setSearchInHouse(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
            {filteredStays.map(stay => {
              const isSelected = selectedStayId === stay.id;
              return (
                <div
                  key={stay.id}
                  onClick={() => {
                    setSelectedStayId(stay.id);
                    setTargetRoomId('');
                    setErrorBanner(null);
                  }}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-xs font-mono">Room {stay.roomNumber}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      {stay.stayNumber}
                    </span>
                  </div>
                  <div className="font-bold text-gray-800 text-xs mt-0.5">{stay.guestName}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 flex items-center justify-between">
                    <span>{stay.roomTypeName}</span>
                    <span className="font-mono">Dep: {stay.expectedCheckOutAt ? stay.expectedCheckOutAt.split('T')[0] : 'N/A'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Destination Room Selection & Verification */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-xs p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h2 className="font-bold text-gray-800 text-xs uppercase flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">2</span>
              <span>Select Destination Room</span>
            </h2>
            <span className="text-[10px] text-emerald-600 font-bold">{availableRooms.length} Available</span>
          </div>

          {!selectedStay ? (
            <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <BedDouble className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="font-bold text-xs text-gray-500">Select an in-house stay from Step 1</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Vacant rooms will be verified against stay dates.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[11px] text-gray-600 font-medium">
                Showing available rooms for dates up to <strong className="font-mono text-gray-800">{selectedStay.expectedCheckOutAt ? selectedStay.expectedCheckOutAt.split('T')[0] : 'Today'}</strong>:
              </div>

              <div className="space-y-1.5 max-h-[380px] overflow-y-auto">
                {availableRooms.length === 0 ? (
                  <div className="p-4 text-center text-amber-700 bg-amber-50 rounded border border-amber-200">
                    No vacant rooms currently match the required date span.
                  </div>
                ) : (
                  availableRooms.map(r => {
                    const isSelected = targetRoomId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => {
                          setTargetRoomId(r.id);
                          setErrorBanner(null);
                        }}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 text-xs font-mono">Room {r.roomNumber}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Vacant Clean
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-700 font-bold mt-0.5">{r.roomTypeName}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Floor {r.floor} • Wing: Main Building</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Move Execution & Details */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-xs p-3 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="border-b border-gray-200 pb-2">
              <h2 className="font-bold text-gray-800 text-xs uppercase flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">3</span>
                <span>Relocation Details & Reason</span>
              </h2>
            </div>

            {selectedStay && targetRoom ? (
              <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between font-mono font-bold text-xs">
                  <span className="text-gray-700">Room {selectedStay.roomNumber}</span>
                  <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                  <span className="text-emerald-700">Room {targetRoom.roomNumber}</span>
                </div>
                <div className="text-xs text-gray-800 font-bold">{selectedStay.guestName}</div>
                <div className="text-[10px] text-gray-500 font-mono">Stay: {selectedStay.stayNumber}</div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-center text-gray-400 text-xs">
                Select both a current stay and destination room to proceed.
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-bold text-[11px] mb-1">Room Move Reason:</label>
              <select
                value={moveReason}
                onChange={e => setMoveReason(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium focus:ring-1 focus:ring-blue-500"
              >
                <option value="Guest Request">Guest Request (Preference / View / Quiet Room)</option>
                <option value="Maintenance">Maintenance / AC / Plumbing Issue</option>
                <option value="Upgrade">Complimentary VIP Upgrade</option>
                <option value="Downgrade">Guest Requested Downgrade</option>
                <option value="Operational Reason">Operational / Housekeeping Balancing</option>
                <option value="Room Issue">Room Key / Electrical Failure</option>
                <option value="Other">Other Operational Justification</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold text-[11px] mb-1">Remarks & Details:</label>
              <textarea
                rows={2}
                placeholder="Specific context for audit log (e.g. AC cooling defect in Room 104)..."
                value={customReasonDetails}
                onChange={e => setCustomReasonDetails(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold text-[11px] mb-1">Key Cards to Reissue:</label>
              <input
                type="number"
                min={1}
                max={6}
                value={keyCardsReissued}
                onChange={e => setKeyCardsReissued(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <button
              onClick={handleExecuteRoomMove}
              disabled={!selectedStay || !targetRoom || isProcessing}
              className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-xs flex items-center justify-center space-x-1.5 transition-all ${
                !selectedStay || !targetRoom || isProcessing
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Confirm & Execute Room Move</span>
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              Will auto-mark vacated room as Dirty & trigger Housekeeping turnover.
            </p>
          </div>
        </div>
      </div>

      {/* Room Movement History Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs p-3 space-y-2.5">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-gray-900 text-xs uppercase tracking-tight">Room Movement & Relocation Audit Log</h2>
          </div>
          <span className="text-[10px] text-gray-500 font-mono font-bold">{roomMoveLogs.length} Records Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-2.5">Timestamp</th>
                <th className="p-2.5">Action</th>
                <th className="p-2.5">Previous Room</th>
                <th className="p-2.5">New Room / Details</th>
                <th className="p-2.5">Authorized User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {roomMoveLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400">
                    No room move operations recorded yet.
                  </td>
                </tr>
              ) : (
                roomMoveLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="p-2.5 font-mono text-[11px] text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-2.5 font-bold text-gray-900">{log.action}</td>
                    <td className="p-2.5 font-mono font-bold text-amber-700">{log.oldValue || '—'}</td>
                    <td className="p-2.5 font-medium text-gray-800">{log.newValue}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded bg-gray-100 font-bold text-[10px] text-gray-700 font-mono">
                        {log.userName} ({log.userRole})
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
