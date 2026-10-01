import React, { useState, useMemo } from 'react';
import { ArrowRightLeft, Sparkles, CheckCircle2, AlertTriangle, BedDouble, Building, ArrowUpRight, DollarSign } from 'lucide-react';
import { Room, Stay, Folio } from '../../../types/pms';
import { PmsDatabaseState } from '../../../services/mockPmsDatabase';
import { pmsService } from '../../../services/pmsService';

interface RoomChangeUpgradeTabProps {
  room: Room;
  activeStay: Stay;
  activeFolio?: Folio;
  db: PmsDatabaseState;
  onShowToast: (msg: string) => void;
  onTransferSuccess?: (newRoom: Room) => void;
}

export const RoomChangeUpgradeTab: React.FC<RoomChangeUpgradeTabProps> = ({
  room,
  activeStay,
  activeFolio,
  db,
  onShowToast,
  onTransferSuccess
}) => {
  const [selectedNewRoomId, setSelectedNewRoomId] = useState<string>('');
  const [reasonCategory, setReasonCategory] = useState<string>('Guest Request');
  const [customReason, setCustomReason] = useState<string>('');
  const [applyRateUpgrade, setApplyRateUpgrade] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Available vacant clean rooms
  const availableRooms = useMemo(() => {
    return (db.rooms || []).filter(
      r => r.id !== room.id && 
           (r.operationalStatus === 'Available' || (r.operationalStatus as any) === 'Vacant') && 
           (r.housekeepingStatus === 'Clean' || r.housekeepingStatus === 'Inspected')
    );
  }, [db.rooms, room.id]);

  const selectedNewRoom = useMemo(() => {
    return availableRooms.find(r => r.id === selectedNewRoomId);
  }, [availableRooms, selectedNewRoomId]);

  // Pricing analysis
  const currentRate = activeStay.rate || (room as any).baseRate || (room as any).rate || (room as any).basePrice || 4500;
  const newRate = (selectedNewRoom as any)?.baseRate || (selectedNewRoom as any)?.rate || (selectedNewRoom as any)?.basePrice || currentRate;
  const rateDifference = Math.max(0, newRate - currentRate);
  const isUpgrade = newRate > currentRate;
  const isSameCategory = selectedNewRoom?.roomTypeId === room.roomTypeId;

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNewRoomId || !selectedNewRoom) {
      alert('Please select a destination room for the transfer/upgrade.');
      return;
    }

    const finalReason = customReason.trim() 
      ? `${reasonCategory}: ${customReason.trim()}`
      : reasonCategory;

    setIsProcessing(true);
    try {
      const result = pmsService.transferRoom(
        activeStay.id,
        selectedNewRoom.id,
        finalReason,
        {
          isUpgrade,
          applyRateUpgrade: isUpgrade ? applyRateUpgrade : false,
          newRate: isUpgrade && applyRateUpgrade ? newRate : currentRate,
          rateDifference: isUpgrade && applyRateUpgrade ? rateDifference : 0,
          upgradeNotes: finalReason
        }
      );

      const actionWord = isUpgrade ? 'Room Upgrade' : 'Room Transfer';
      onShowToast(`${actionWord} completed! Moved to Room ${selectedNewRoom.roomNumber} (${selectedNewRoom.roomTypeName})`);
      
      if (onTransferSuccess) {
        onTransferSuccess(result.newRoom);
      }
    } catch (err: any) {
      alert(err.message || 'Room transfer failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Current Room vs Transfer Target Banner */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
            Current Stay Location
          </span>
          <span className="text-[11px] font-bold text-gray-700">
            Guest: <strong>{activeStay.guestName}</strong>
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-mono font-black text-sm">
              {room.roomNumber}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-xs">{room.roomTypeName}</p>
              <p className="text-[11px] text-gray-500">Floor {room.floor} • Current Rate: <strong>৳{currentRate.toLocaleString()}/night</strong></p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] uppercase">
            Active Stay
          </span>
        </div>
      </div>

      {/* Form to Select Destination Room */}
      <form onSubmit={handleExecuteTransfer} className="p-4 bg-white border border-gray-200 rounded-xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h4 className="font-black text-slate-900 text-sm flex items-center space-x-1.5">
            <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
            <span>Select Destination Room (Transfer / Upgrade)</span>
          </h4>
          <span className="text-[11px] text-gray-500">
            {availableRooms.length} Clean Rooms Available
          </span>
        </div>

        {availableRooms.length === 0 ? (
          <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-xl">
            <BedDouble className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="font-bold">No Vacant Clean Rooms Available</p>
            <p className="text-[11px] mt-1">Please have housekeeping complete room turnover to make rooms available for transfer.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Choose Target Room:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {availableRooms.map(targetRoom => {
                  const targetRate = (targetRoom as any).baseRate || (targetRoom as any).rate || (targetRoom as any).basePrice || 4500;
                  const roomIsUpgrade = targetRate > currentRate;
                  const isSelected = selectedNewRoomId === targetRoom.id;

                  return (
                    <button
                      key={targetRoom.id}
                      type="button"
                      onClick={() => setSelectedNewRoomId(targetRoom.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-black text-xs text-gray-900">
                            Room {targetRoom.roomNumber}
                          </span>
                          {roomIsUpgrade && (
                            <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded flex items-center space-x-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Upgrade</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">
                          {targetRoom.roomTypeName} • Fl {targetRoom.floor}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          ৳{targetRate.toLocaleString()}
                        </span>
                        {roomIsUpgrade && (
                          <p className="text-[9px] text-purple-700 font-bold">
                            +৳{(targetRate - currentRate).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Target Room Upgrade Pricing Details */}
            {selectedNewRoom && (
              <div className={`p-3.5 rounded-xl border ${
                isUpgrade ? 'bg-purple-50/70 border-purple-200 text-purple-950' : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isUpgrade ? (
                      <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                    ) : (
                      <ArrowRightLeft className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                    <span className="font-black text-xs">
                      {isUpgrade ? 'Category Upgrade Selected' : isSameCategory ? 'Same Category Room Transfer' : 'Category Change'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs">
                    Target: Room {selectedNewRoom.roomNumber} ({selectedNewRoom.roomTypeName})
                  </span>
                </div>

                {isUpgrade && (
                  <div className="mt-3 pt-2.5 border-t border-purple-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Daily Rate Upgrade Difference:</span>
                      <span className="font-mono font-black text-purple-700">
                        +৳{rateDifference.toLocaleString()} / night
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 pt-1">
                      <label className="flex items-center space-x-2 cursor-pointer font-bold text-xs text-purple-900">
                        <input
                          type="radio"
                          name="upgradeBillingOption"
                          checked={applyRateUpgrade}
                          onChange={() => setApplyRateUpgrade(true)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <span>Bill Upgrade Difference (+৳{rateDifference.toLocaleString()}) to Folio</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer font-bold text-xs text-purple-900">
                        <input
                          type="radio"
                          name="upgradeBillingOption"
                          checked={!applyRateUpgrade}
                          onChange={() => setApplyRateUpgrade(false)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <span>Complimentary Upgrade (Keep ৳{currentRate.toLocaleString()})</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reason for Relocation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Transfer / Upgrade Reason:</label>
                <select
                  value={reasonCategory}
                  onChange={e => setReasonCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold"
                >
                  <option value="Guest Request">Guest Request (Prefers higher floor / view)</option>
                  <option value="VIP Complimentary Upgrade">VIP Complimentary Upgrade</option>
                  <option value="Paid Room Upgrade">Paid Category Upgrade</option>
                  <option value="AC / Air Conditioning Defect">Maintenance: AC / HVAC Malfunction</option>
                  <option value="Plumbing / Bathroom Defect">Maintenance: Plumbing Defect</option>
                  <option value="Street Noise / Quiet Room Request">Noise / Quiet Room Request</option>
                  <option value="Extended Stay Relocation">Extended Stay Relocation</option>
                  <option value="Executive Management Directive">Executive Management Directive</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Additional Staff Notes:</label>
                <input
                  type="text"
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="e.g. Moved from Room 204 to 401 per GM approval"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Submit Transfer Button */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-[11px] text-gray-500">
                Old Room {room.roomNumber} will automatically be marked <strong>Dirty</strong> for housekeeping turnover.
              </span>

              <button
                type="submit"
                disabled={!selectedNewRoomId || isProcessing}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-md flex items-center space-x-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Execute {isUpgrade ? 'Room Upgrade' : 'Room Transfer'}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
