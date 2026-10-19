import React, { useState } from 'react';
import {
  X, AlertTriangle, Trash2, XCircle, ShieldAlert,
  Calendar, User, BedDouble, DollarSign, Check
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { Reservation } from '../../types/pms';

interface DeleteReservationModalProps {
  isOpen: boolean;
  reservation: Reservation | null;
  onClose: () => void;
  onSuccess?: (actionType: 'cancel' | 'purge', message: string) => void;
}

export const DeleteReservationModal: React.FC<DeleteReservationModalProps> = ({
  isOpen,
  reservation,
  onClose,
  onSuccess
}) => {
  const [deleteMode, setDeleteMode] = useState<'cancel' | 'purge'>('cancel');
  const [reason, setReason] = useState('Guest requested cancellation');
  const [purgeConfirmChecked, setPurgeConfirmChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !reservation) return null;

  const handleAction = () => {
    setError(null);
    if (!reason.trim()) {
      setError('Please provide a reason or note for this action.');
      return;
    }

    if (deleteMode === 'purge' && !purgeConfirmChecked) {
      setError('Please check the confirmation box to permanently delete this reservation.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (deleteMode === 'cancel') {
        const res = pmsService.deleteReservation(reservation.id, reason.trim());
        if (res.success) {
          onSuccess?.('cancel', res.message);
          onClose();
        } else {
          setError(res.message);
        }
      } else {
        const res = pmsService.purgeReservationPermanently(reservation.id, reason.trim());
        if (res.success) {
          onSuccess?.('purge', res.message);
          onClose();
        } else {
          setError(res.message);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to process request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-xs text-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold ${
              deleteMode === 'purge'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              {deleteMode === 'purge' ? <Trash2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {deleteMode === 'purge' ? 'Permanently Delete Reservation' : 'Cancel Reservation'}
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {deleteMode === 'purge' 
                  ? 'Completely remove booking from database and release assigned room.' 
                  : 'Mark reservation as Cancelled and free up room for new bookings.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Reservation Summary Card */}
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-mono font-bold text-amber-400 text-sm">
                {reservation.reservationNumber}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Status: {reservation.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Guest Name:</span>
                <span className="font-semibold text-slate-200">{reservation.guestName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Phone:</span>
                <span className="font-mono text-slate-200">{reservation.guestPhone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Dates:</span>
                <span className="font-mono text-slate-300">{reservation.arrivalDate} → {reservation.departureDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Allocated Room:</span>
                <span className="font-semibold text-cyan-300">
                  {reservation.assignedRoomNumber ? `Room ${reservation.assignedRoomNumber}` : 'Unassigned'}
                </span>
              </div>
            </div>
            {(reservation.paidAmount || 0) > 0 && (
              <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Advance Deposit Collected:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ৳{(reservation.paidAmount || 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Mode Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">Select Deletion Action:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteMode('cancel');
                  setReason('Guest requested cancellation at front desk');
                }}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col space-y-1 ${
                  deleteMode === 'cancel'
                    ? 'bg-amber-500/10 border-amber-500/50 text-slate-100 ring-1 ring-amber-500/30'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs">
                  <XCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Soft Cancellation</span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Status becomes Cancelled. Room released to Available. Keeps audit history.
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeleteMode('purge');
                  setReason('Erroneous or test booking purged by management');
                }}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col space-y-1 ${
                  deleteMode === 'purge'
                    ? 'bg-rose-500/10 border-rose-500/50 text-slate-100 ring-1 ring-rose-500/30'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs text-rose-300">
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Permanent Purge</span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Completely erases the booking from PMS database & Cloud SQL. Irreversible.
                </span>
              </button>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
              Reason / Authorization Remarks *
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={deleteMode === 'purge' ? 'e.g. Duplicate booking, test reservation entry' : 'e.g. Guest flight delayed, changed dates'}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:border-rose-400 focus:outline-none"
            />
          </div>

          {/* Permanent Purge Confirmation Checkbox */}
          {deleteMode === 'purge' && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2">
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="purgeConfirm"
                  checked={purgeConfirmChecked}
                  onChange={e => setPurgeConfirmChecked(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="purgeConfirm" className="text-[11px] text-rose-200 cursor-pointer leading-tight">
                  I confirm that I want to <strong>permanently purge</strong> reservation <strong>{reservation.reservationNumber}</strong>. This record will be permanently removed from all reports, and the room will be immediately freed up.
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition"
          >
            Keep Reservation
          </button>

          <button
            type="button"
            onClick={handleAction}
            disabled={isSubmitting || (deleteMode === 'purge' && !purgeConfirmChecked)}
            className={`px-4 py-1.5 font-bold rounded-lg text-xs transition shadow-sm flex items-center space-x-1.5 disabled:opacity-50 ${
              deleteMode === 'purge'
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            {deleteMode === 'purge' ? <Trash2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            <span>
              {isSubmitting 
                ? 'Processing...' 
                : deleteMode === 'purge' 
                ? 'Permanently Delete Record' 
                : 'Confirm Cancellation'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
