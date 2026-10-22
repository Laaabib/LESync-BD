import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Calendar, User, BedDouble, DollarSign, CheckCircle2,
  AlertCircle, Building2, Phone, Mail, FileText, Check, Save
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { Reservation, CustomerType } from '../../types/pms';

interface EditReservationModalProps {
  isOpen: boolean;
  reservation: Reservation | null;
  onClose: () => void;
  onSuccess?: (updatedRes: Reservation) => void;
}

export const EditReservationModal: React.FC<EditReservationModalProps> = ({
  isOpen,
  reservation,
  onClose,
  onSuccess
}) => {
  const [db, setDb] = useState(pmsService.getState());

  // Form states
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('Individual');
  const [companyName, setCompanyName] = useState('');

  const [arrivalDate, setArrivalDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [assignedRoomId, setAssignedRoomId] = useState('');
  const [rate, setRate] = useState<number>(0);
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [bookingSource, setBookingSource] = useState<Reservation['bookingSource']>('Front Desk Walk-in');
  const [status, setStatus] = useState<Reservation['status']>('Confirmed');
  const [specialRequests, setSpecialRequests] = useState('');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  // Populate fields when reservation changes
  useEffect(() => {
    if (reservation) {
      setGuestName(reservation.guestName || '');
      setGuestPhone(reservation.guestPhone || '');
      setGuestEmail(reservation.guestEmail || '');
      setCustomerType(reservation.customerType || 'Individual');
      setCompanyName(reservation.companyName || '');
      setArrivalDate(reservation.arrivalDate || '');
      setDepartureDate(reservation.departureDate || '');
      setRoomTypeId(reservation.roomTypeId || (db.roomTypes[0]?.id || ''));
      setAssignedRoomId(reservation.assignedRoomId || '');
      setRate(reservation.rate || 0);
      setAdults(reservation.adults || 1);
      setChildren(reservation.children || 0);
      setBookingSource((reservation.bookingSource as Reservation['bookingSource']) || 'Front Desk Walk-in');
      setStatus(reservation.status || 'Confirmed');
      setSpecialRequests(reservation.specialRequests || '');
      setDepositAmount(reservation.paidAmount || reservation.depositAmount || 0);
      setError(null);
    }
  }, [reservation, db.roomTypes]);

  // Compute stay duration in nights
  const nights = useMemo(() => {
    if (!arrivalDate || !departureDate) return 1;
    const arr = new Date(arrivalDate);
    const dep = new Date(departureDate);
    const diff = Math.round((dep.getTime() - arr.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }, [arrivalDate, departureDate]);

  // Available rooms for selected room type and dates
  const availableRooms = useMemo(() => {
    if (!roomTypeId) return [];
    return (db.rooms || []).filter(room => {
      // Must match room type
      if (room.roomTypeId !== roomTypeId) return false;
      // If this is the room already assigned to this reservation, it is always available to keep
      if (reservation && (room.id === reservation.assignedRoomId || room.roomNumber === reservation.assignedRoomNumber)) {
        return true;
      }
      // Cannot assign occupied rooms
      if (room.operationalStatus === 'Occupied' || room.operationalStatus === 'Out of Order') {
        return false;
      }
      // Check date conflicts against other reservations
      if (arrivalDate && departureDate) {
        const check = pmsService.checkRoomAvailability(room.id, arrivalDate, departureDate);
        return check.isAvailable;
      }
      return true;
    });
  }, [db.rooms, roomTypeId, arrivalDate, departureDate, reservation]);

  // Estimated Total calculation
  const estimatedTotal = useMemo(() => {
    const base = nights * (rate || 0);
    const sc = Math.round(base * ((db.settings.serviceChargePercent || 10) / 100));
    const tax = Math.round(base * ((db.settings.taxRatePercent || 15) / 100));
    return base + sc + tax;
  }, [nights, rate, db.settings]);

  if (!isOpen || !reservation) return null;

  const handleRoomTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTypeId = e.target.value;
    setRoomTypeId(newTypeId);
    const rType = db.roomTypes.find(rt => rt.id === newTypeId);
    if (rType) {
      setRate(rType.baseRate);
    }
    // Reset assigned room if type changed
    setAssignedRoomId('');
  };

  const isNonEditable = reservation?.status === 'Checked-In' || reservation?.status === 'Cancelled';

  const handleSave = () => {
    if (isNonEditable) {
      setError(`Cannot edit a reservation that is ${reservation?.status}.`);
      return;
    }
    if (!guestName.trim()) {
      setError('Guest full name is required.');
      return;
    }
    if (!guestPhone.trim()) {
      setError('Guest phone number is required.');
      return;
    }
    if (!arrivalDate || !departureDate) {
      setError('Both Arrival and Departure dates are required.');
      return;
    }
    if (arrivalDate >= departureDate) {
      setError('Departure date must be strictly after Arrival date.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedRoom = db.rooms.find(r => r.id === assignedRoomId);
      const selectedType = db.roomTypes.find(rt => rt.id === roomTypeId);

      const updates: Partial<Reservation> = {
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim() || undefined,
        customerType,
        companyName: customerType === 'Corporate' ? companyName.trim() : undefined,
        arrivalDate,
        departureDate,
        roomTypeId,
        roomTypeName: selectedType?.name || reservation.roomTypeName,
        assignedRoomId: assignedRoomId || undefined,
        assignedRoomNumber: selectedRoom?.roomNumber || (assignedRoomId ? reservation.assignedRoomNumber : undefined),
        rate: Number(rate) || 0,
        adults: Number(adults) || 1,
        children: Number(children) || 0,
        bookingSource,
        status,
        specialRequests: specialRequests.trim() || undefined,
        paidAmount: Number(depositAmount) || 0,
        depositAmount: Number(depositAmount) || 0
      };

      const result = pmsService.updateReservation(reservation.id, updates);
      if (result.success) {
        const updatedRecord = pmsService.getState().reservations.find(r => r.id === reservation.id);
        if (updatedRecord && onSuccess) {
          onSuccess(updatedRecord);
        }
        onClose();
      } else {
        setError(result.message || 'Failed to update reservation');
      }
    } catch (err: any) {
      setError(err?.message || 'Error occurred while saving changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-xs text-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-100">Edit Reservation Details</h3>
                <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                  {reservation.reservationNumber}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  status === 'Confirmed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  status === 'Checked-In' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                  'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {status}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Update stay dates, room allocation, guest contact, rate, and operational notes.
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {isNonEditable && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-2.5 text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold block">
                  {reservation.status === 'Checked-In' ? 'Reservation is Checked-In' : 'Reservation is Cancelled'}
                </span>
                <span className="text-amber-200/80 text-[11px] block mt-0.5">
                  {reservation.status === 'Checked-In'
                    ? 'Guest is currently in-house. Room changes, billing, and checkout are managed via Front Desk In-House Stays and Guest Folio.'
                    : 'This reservation has been cancelled and cannot be edited. It can only be viewed or permanently deleted.'}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Guest Profile & Customer Classification */}
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Guest Information</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setCustomerType('Individual')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                    customerType === 'Individual'
                      ? 'bg-cyan-500 text-slate-950 shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerType('Corporate')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                    customerType === 'Corporate'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Corporate
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  Guest Full Name *
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  placeholder="e.g. Subrata Roy"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  value={guestPhone}
                  onChange={e => setGuestPhone(e.target.value)}
                  placeholder="+880 1711-000000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                  placeholder="guest@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {customerType === 'Corporate' && (
              <div>
                <label className="text-[10.5px] font-semibold text-blue-300 block mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Enterprise Ltd."
                  className="w-full bg-slate-900 border border-blue-500/40 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:border-blue-400 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Section 2: Stay Dates & Room Selection */}
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                <BedDouble className="w-3.5 h-3.5 text-amber-400" />
                <span>Stay Dates & Room Assignment</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                {nights} {nights === 1 ? 'Night' : 'Nights'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  Arrival Date *
                </label>
                <input
                  type="date"
                  value={arrivalDate}
                  onChange={e => setArrivalDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  Departure Date *
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={e => setDepartureDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  Room Category / Type
                </label>
                <select
                  value={roomTypeId}
                  onChange={handleRoomTypeChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
                >
                  {db.roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} (৳{rt.baseRate.toLocaleString()}/night)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  Assigned Room (Optional / TBD)
                </label>
                <select
                  value={assignedRoomId}
                  onChange={e => setAssignedRoomId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none font-mono"
                >
                  <option value="">Unassigned (Assign at Check-In)</option>
                  {availableRooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} • Floor {r.floor} ({r.operationalStatus})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 block mt-1">
                  {availableRooms.length} room(s) available for these dates
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Pricing, Guests, and Status */}
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-3">
            <span className="font-bold text-slate-200 flex items-center space-x-1.5 border-b border-slate-800/80 pb-2">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tariff & Booking Status</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  Nightly Rate (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={rate}
                  onChange={e => setRate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  Advance Deposit (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={depositAmount}
                  onChange={e => setDepositAmount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 text-xs focus:border-emerald-400 focus:outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  Adults
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={adults}
                  onChange={e => setAdults(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  Children
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={children}
                  onChange={e => setChildren(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  Booking Source
                </label>
                <select
                  value={bookingSource}
                  onChange={e => setBookingSource(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
                >
                  <option value="Front Desk Walk-in">Front Desk Walk-in</option>
                  <option value="Phone / Direct">Phone / Direct</option>
                  <option value="Website Engine">Website Direct Booking</option>
                  <option value="Booking.com">Booking.com</option>
                  <option value="Agoda">Agoda</option>
                  <option value="Corporate">Corporate Contract</option>
                  <option value="Travel Agent">Travel Agent</option>
                </select>
              </div>

              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  Reservation Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none font-bold"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Unconfirmed">Unconfirmed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Estimated Total Bar */}
            <div className="p-2.5 bg-slate-900 rounded-lg flex items-center justify-between border border-slate-800 text-[11px]">
              <span className="text-slate-400">
                Total Est. ({nights}N × ৳{rate.toLocaleString()} + Tax/SC):
              </span>
              <span className="font-mono font-bold text-amber-400 text-xs">
                ৳{estimatedTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Section 4: Special Requests & Notes */}
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-2">
            <span className="font-bold text-slate-200 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Special Requests & Operational Notes</span>
            </span>
            <textarea
              rows={2}
              value={specialRequests}
              onChange={e => setSpecialRequests(e.target.value)}
              placeholder="e.g. High floor requested, late arrival after 8 PM, extra pillow set."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Last modified: <span className="font-mono text-slate-300">{reservation.updatedAt ? reservation.updatedAt.split('T')[0] : 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting || isNonEditable}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition shadow-sm flex items-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving Changes...' : 'Save & Apply Updates'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
