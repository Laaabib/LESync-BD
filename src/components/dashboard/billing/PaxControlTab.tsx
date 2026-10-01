import React, { useState } from 'react';
import { Users, UserPlus, UserMinus, Key, ShieldCheck, Clock, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { Room, Stay, Folio } from '../../../types/pms';
import { pmsService } from '../../../services/pmsService';

interface PaxControlTabProps {
  room: Room;
  activeStay: Stay;
  onShowToast: (msg: string) => void;
  onPaxUpdated?: () => void;
}

export const PaxControlTab: React.FC<PaxControlTabProps> = ({
  room,
  activeStay,
  onShowToast,
  onPaxUpdated
}) => {
  const currentAdults = activeStay.adults || 1;
  const currentChildren = activeStay.children || 0;
  const totalPax = currentAdults + currentChildren;
  const maxCapacity = (room as any).capacity || (room as any).maxOccupancy || 3;

  // Pax In state
  const [inAdults, setInAdults] = useState<number>(1);
  const [inChildren, setInChildren] = useState<number>(0);
  const [inGuestName, setInGuestName] = useState<string>('');
  const [inPhone, setInPhone] = useState<string>('');
  const [inIssueKeyCard, setInIssueKeyCard] = useState<boolean>(true);
  const [inNotes, setInNotes] = useState<string>('Guest companion arrival');

  // Pax Out state
  const [outAdults, setOutAdults] = useState<number>(1);
  const [outChildren, setOutChildren] = useState<number>(0);
  const [outKeyCardReturned, setOutKeyCardReturned] = useState<boolean>(true);
  const [outNotes, setOutNotes] = useState<string>('Companion departure / early check-out');

  const handlePaxIn = (e: React.FormEvent) => {
    e.preventDefault();
    const diff = inAdults + inChildren;
    if (diff <= 0) {
      alert('Please specify at least 1 incoming guest.');
      return;
    }

    const newAdults = currentAdults + inAdults;
    const newChildren = currentChildren + inChildren;
    const newKeyCards = inIssueKeyCard ? (activeStay.keyCardsIssued || 1) + 1 : activeStay.keyCardsIssued;

    const noteDetails = inGuestName.trim()
      ? `Pax In: ${inGuestName.trim()} (${inPhone ? `Phone: ${inPhone}` : 'No phone'}) - ${inNotes}`
      : `Pax In: +${diff} companion(s) - ${inNotes}`;

    try {
      pmsService.updateStayPax(activeStay.id, {
        actionType: 'pax-in',
        adults: newAdults,
        children: newChildren,
        paxDiff: diff,
        notes: noteDetails,
        keyCardsIssued: newKeyCards
      });

      onShowToast(`Pax In recorded! Room ${room.roomNumber} now has ${newAdults + newChildren} occupants.`);
      setInGuestName('');
      setInPhone('');
      setInAdults(1);
      setInChildren(0);

      if (onPaxUpdated) onPaxUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to update pax');
    }
  };

  const handlePaxOut = (e: React.FormEvent) => {
    e.preventDefault();
    const diff = outAdults + outChildren;
    if (diff <= 0) {
      alert('Please specify at least 1 outgoing guest.');
      return;
    }

    const newAdults = Math.max(1, currentAdults - outAdults);
    const newChildren = Math.max(0, currentChildren - outChildren);
    const newKeyCards = outKeyCardReturned ? Math.max(1, (activeStay.keyCardsIssued || 1) - 1) : activeStay.keyCardsIssued;

    const noteDetails = `Pax Out: -${diff} companion(s) departed - ${outNotes}`;

    try {
      pmsService.updateStayPax(activeStay.id, {
        actionType: 'pax-out',
        adults: newAdults,
        children: newChildren,
        paxDiff: -diff,
        notes: noteDetails,
        keyCardsIssued: newKeyCards
      });

      onShowToast(`Pax Out recorded! Room ${room.roomNumber} updated to ${newAdults + newChildren} occupants.`);
      setOutAdults(1);
      setOutChildren(0);

      if (onPaxUpdated) onPaxUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to update pax');
    }
  };

  const paxHistory = activeStay.paxHistory || [];

  return (
    <div className="space-y-4 text-xs">
      {/* Current Headcount Status Card */}
      <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Room Occupancy & Headcount
          </span>
          <div className="flex items-baseline space-x-3 mt-0.5">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {totalPax} Pax
            </span>
            <span className="text-xs text-slate-300">
              ({currentAdults} Adults, {currentChildren} Children)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Max Room Capacity: <strong className="text-white">{maxCapacity} Guests</strong> • Keycards Active: <strong className="text-emerald-300 font-mono">{activeStay.keyCardsIssued || 1} Issued</strong>
          </p>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
          <p className="text-xs text-slate-400">Primary Guest:</p>
          <p className="text-sm font-black text-white">{activeStay.guestName}</p>
          <span className="text-[10px] text-slate-400">Stay #{activeStay.stayNumber}</span>
        </div>
      </div>

      {/* Two Column Pax In / Pax Out Control */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PANEL 1: PAX IN (Guest / Companion Arrival) */}
        <form onSubmit={handlePaxIn} className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
          <div className="flex items-center space-x-2 text-emerald-950 font-black text-xs border-b border-emerald-200 pb-2">
            <UserPlus className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Pax In: Register Companion / Visitor Arrival</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-emerald-900 block mb-1">Incoming Adults:</label>
              <input
                type="number"
                min="0"
                max="5"
                value={inAdults}
                onChange={e => setInAdults(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold font-mono text-emerald-950"
              />
            </div>
            <div>
              <label className="font-bold text-emerald-900 block mb-1">Incoming Children:</label>
              <input
                type="number"
                min="0"
                max="5"
                value={inChildren}
                onChange={e => setInChildren(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold font-mono text-emerald-950"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-emerald-900 block mb-1">Companion / Visitor Name:</label>
            <input
              type="text"
              value={inGuestName}
              onChange={e => setInGuestName(e.target.value)}
              placeholder="e.g. Mrs. Sharmin Akhter"
              className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-emerald-900 block mb-1">Contact / Phone:</label>
              <input
                type="text"
                value={inPhone}
                onChange={e => setInPhone(e.target.value)}
                placeholder="+880 17..."
                className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-emerald-900 block mb-1">Arrival Purpose:</label>
              <input
                type="text"
                value={inNotes}
                onChange={e => setInNotes(e.target.value)}
                placeholder="e.g. Companion check-in"
                className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <label className="flex items-center space-x-2 text-emerald-900 font-bold cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={inIssueKeyCard}
              onChange={e => setInIssueKeyCard(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <span className="text-[11px]">Issue additional room keycard for companion</span>
          </label>

          <button
            type="submit"
            className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center space-x-1.5 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Confirm Pax In (+{inAdults + inChildren} Occupant)</span>
          </button>
        </form>

        {/* PANEL 2: PAX OUT (Guest / Companion Departure) */}
        <form onSubmit={handlePaxOut} className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
          <div className="flex items-center space-x-2 text-rose-950 font-black text-xs border-b border-rose-200 pb-2">
            <UserMinus className="w-4 h-4 text-rose-700 shrink-0" />
            <span>Pax Out: Register Companion Exit / Departure</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-rose-900 block mb-1">Departing Adults:</label>
              <input
                type="number"
                min="0"
                max={currentAdults}
                value={outAdults}
                onChange={e => setOutAdults(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-bold font-mono text-rose-950"
              />
            </div>
            <div>
              <label className="font-bold text-rose-900 block mb-1">Departing Children:</label>
              <input
                type="number"
                min="0"
                max={currentChildren}
                value={outChildren}
                onChange={e => setOutChildren(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-bold font-mono text-rose-950"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-rose-900 block mb-1">Departure Notes / Reason:</label>
            <input
              type="text"
              value={outNotes}
              onChange={e => setOutNotes(e.target.value)}
              placeholder="e.g. Companion departed early for flight, visitor exited"
              className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs"
            />
          </div>

          <label className="flex items-center space-x-2 text-rose-900 font-bold cursor-pointer pt-3">
            <input
              type="checkbox"
              checked={outKeyCardReturned}
              onChange={e => setOutKeyCardReturned(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
            <span className="text-[11px]">Room keycard returned & deactivated</span>
          </label>

          <div className="pt-2">
            <button
              type="submit"
              disabled={currentAdults <= 1 && currentChildren <= 0}
              className="w-full py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center space-x-1.5 transition-colors"
            >
              <UserMinus className="w-3.5 h-3.5" />
              <span>Confirm Pax Out (-{outAdults + outChildren} Occupant)</span>
            </button>
          </div>
        </form>
      </div>

      {/* Pax Movement History Log */}
      <div className="space-y-2">
        <span className="font-bold text-gray-800 text-xs flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <span>Occupancy & Pax Movement Log ({paxHistory.length})</span>
        </span>

        {paxHistory.length === 0 ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-400">
            Initial check-in headcount logged ({currentAdults} Adults, {currentChildren} Children). No companion movements recorded yet.
          </div>
        ) : (
          <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white shadow-xs">
            {paxHistory.map((item, idx) => (
              <div key={item.id || idx} className="p-2.5 flex items-center justify-between hover:bg-gray-50 text-[11px]">
                <div className="flex items-center space-x-2 truncate">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${
                    item.type === 'pax-in' ? 'bg-emerald-100 text-emerald-800' : item.type === 'pax-out' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.type}
                  </span>
                  <div className="truncate">
                    <p className="font-bold text-gray-900 truncate">{item.notes}</p>
                    <p className="text-[10px] text-gray-400">
                      Resulting Occupancy: {item.adults}A, {item.children}C • Staff: {item.by}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <span className={`font-mono font-black ${item.paxDiff > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {item.paxDiff > 0 ? `+${item.paxDiff}` : item.paxDiff} Pax
                  </span>
                  <p className="text-[9px] text-gray-400">
                    {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
