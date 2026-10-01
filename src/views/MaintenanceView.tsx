import React, { useState, useEffect } from 'react';
import {
  Wrench, PlusCircle, CheckCircle2, Clock, AlertTriangle,
  Flame, CheckSquare, Search, Filter
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { PmsDatabaseState } from '../services/mockPmsDatabase';
import { MaintenanceTicket } from '../types/pms';

export const MaintenanceView: React.FC = () => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [showModal, setShowModal] = useState(false);
  const [roomId, setRoomId] = useState(db.rooms[0]?.id || '');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<MaintenanceTicket['priority']>('Medium');
  const [desc, setDesc] = useState('');
  const [setOoo, setSetOoo] = useState(false);

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !roomId) return;

    try {
      pmsService.createMaintenanceTicket({
        roomId,
        title,
        priority,
        description: desc,
        marksOutOfOrder: setOoo
      });
      setShowModal(false);
      setTitle('');
      setDesc('');
      setSetOoo(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleResolve = (ticketId: string) => {
    const notes = prompt('Enter resolution summary / technician notes:');
    if (notes !== null) {
      pmsService.resolveMaintenanceTicket(ticketId, 0, notes || 'Fixed and verified by engineering team.');
    }
  };

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center border border-rose-500/30">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-100">Engineering & Maintenance Desk</h1>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px]">
                {db.maintenanceTickets.filter(t => t.status !== 'Completed' && t.status !== 'Closed').length} Active Work Orders
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Room defect work orders, plumbing, HVAC conditioning, and Out-of-Order room locks.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors shadow-sm text-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Work Order</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Active Maintenance Tickets</span>
        </div>

        <div className="divide-y divide-slate-800">
          {db.maintenanceTickets.length === 0 ? (
            <div className="py-8 text-center text-slate-500">No maintenance tickets on file.</div>
          ) : (
            db.maintenanceTickets.map(ticket => (
              <div key={ticket.id} className="p-3.5 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-400 text-[11px]">{ticket.ticketNumber}</span>
                    {ticket.roomNumber && (
                      <span className="font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        Room {ticket.roomNumber}
                      </span>
                    )}
                    <h4 className="font-bold text-slate-100 text-xs">{ticket.title}</h4>
                    <span className={`text-[10px] px-2 py-0.2 rounded font-bold uppercase tracking-wider ${
                      ticket.priority === 'Critical' ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' :
                      ticket.priority === 'High' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {ticket.priority}
                    </span>
                  </div>

                  <p className="text-slate-400 text-[11px]">{ticket.description}</p>
                  <span className="text-[10px] text-slate-500 block">
                    Reported by {(ticket as any).reportedBy || 'Staff'} • {ticket.createdAt ? ticket.createdAt.split('T')[0] : 'Today'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`text-[10.5px] px-2 py-0.5 rounded font-semibold ${
                    ticket.status === 'Completed' || ticket.status === 'Closed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    ticket.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {ticket.status}
                  </span>
                  {ticket.status !== 'Completed' && ticket.status !== 'Closed' && (
                    <button
                      onClick={() => handleResolve(ticket.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[11px] transition-colors"
                    >
                      Resolve Work Order
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Work Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-4 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Raise Engineering Work Order</h3>
            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Affected Room / Location</span>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-xs"
                >
                  <option value="">Public Resort Facility / Hall</option>
                  {db.rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.roomTypeName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Defect Title *</span>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master Bedroom Inverter AC Error E6"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Priority Level</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-xs"
                >
                  <option value="Low">Low (Cosmetic / Touchup)</option>
                  <option value="Medium">Medium (General Repair)</option>
                  <option value="High">High (Urgent Guest Impact)</option>
                  <option value="Critical">Critical (Immediate Out-of-Order)</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Detailed Description</span>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Describe the issue observed for the technician..."
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  checked={setOoo}
                  onChange={(e) => setSetOoo(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-rose-500"
                />
                <span className="text-rose-400 font-semibold">Mark Room as Out-of-Order (OOO) in Room Rack</span>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs"
                >
                  Create Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
