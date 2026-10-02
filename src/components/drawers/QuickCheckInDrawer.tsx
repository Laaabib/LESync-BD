import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  LogIn,
  CheckCircle2,
  BedDouble,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  FileText,
  Globe,
  User,
  PlusCircle,
  IdCard,
  Sparkles,
  Filter,
  Check
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { PaymentMethod, Room } from '../../types/pms';
import { BDCardAndPaymentSelector } from '../common/BDCardAndPaymentSelector';
import { PaymentTenderDetails } from '../../constants/paymentConfig';

interface QuickCheckInDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialReservationId?: string;
  preselectedReservationId?: string;
  onSuccess?: () => void;
}

export const QuickCheckInDrawer: React.FC<QuickCheckInDrawerProps> = ({
  isOpen,
  onClose,
  initialReservationId,
  preselectedReservationId,
  onSuccess
}) => {
  const [db, setDb] = useState(pmsService.getState());
  const effectiveResId = initialReservationId || preselectedReservationId;

  // Subscribe to real-time PMS state updates
  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  // Mode: Reservation check-in or direct walk-in check-in
  const [checkInMode, setCheckInMode] = useState<'reservation' | 'walkin'>('reservation');

  // Room category filter ('all' or specific roomTypeId)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Reservation selection state
  const [selectedResId, setSelectedResId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [resRate, setResRate] = useState<number>(0);
  
  // Walk-in form state
  const [walkInName, setWalkInName] = useState<string>('');
  const [walkInPhone, setWalkInPhone] = useState<string>('');
  const [walkInEmail, setWalkInEmail] = useState<string>('');
  const [walkInRate, setWalkInRate] = useState<number>(4500);
  const [walkInNights, setWalkInNights] = useState<number>(1);
  const [walkInAdults, setWalkInAdults] = useState<number>(1);
  const [walkInChildren, setWalkInChildren] = useState<number>(0);

  // Guest Identification (NID or Passport option)
  const [idType, setIdType] = useState<'National ID (NID)' | 'Passport' | 'Driving License' | 'Birth Certificate' | string>('National ID (NID)');
  const [idNumber, setIdNumber] = useState<string>('');
  const [idCountry, setIdCountry] = useState<string>('Bangladesh');
  const [verifiedId, setVerifiedId] = useState<boolean>(true);
  const [hasExistingIdOnRecord, setHasExistingIdOnRecord] = useState<boolean>(false);

  // Stay parameters
  const [keyCardsCount, setKeyCardsCount] = useState<number | ''>(1);
  const [depositAmount, setDepositAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState<Partial<PaymentTenderDetails>>({});
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Update guest ID info whenever selected reservation changes
  const populateFromReservation = (resId: string) => {
    const res = db.reservations.find(r => r.id === resId);
    if (res) {
      setResRate(res.rate || 0);
      if (res.assignedRoomId) {
        setSelectedRoomId(res.assignedRoomId);
      } else {
        // Try to find clean/inspected matching room first
        const avail = db.rooms.find(r => 
          r.roomTypeId === res.roomTypeId && 
          r.active && 
          (r.operationalStatus === 'Available' || r.operationalStatus === 'Inspected') &&
          !db.stays.some(s => s.roomId === r.id && s.status === 'Active')
        );
        if (avail) {
          setSelectedRoomId(avail.id);
        } else {
          // Fallback to any clean/inspected room in inventory
          const anyAvail = db.rooms.find(r => 
            r.active && 
            (r.operationalStatus === 'Available' || r.operationalStatus === 'Inspected') &&
            !db.stays.some(s => s.roomId === r.id && s.status === 'Active')
          );
          if (anyAvail) setSelectedRoomId(anyAvail.id);
          else setSelectedRoomId('');
        }
      }
      setSpecialRequests(res.specialRequests || '');

      // Check guest record for existing ID
      const guest = db.guests.find(g => g.id === res.guestId);
      if (guest) {
        if (guest.idType) {
          setIdType(guest.idType);
        }
        if (guest.idNumber && guest.idNumber !== 'NID-PENDING') {
          setIdNumber(guest.idNumber);
          setHasExistingIdOnRecord(true);
        } else {
          setIdNumber('');
          setHasExistingIdOnRecord(false);
        }
        if (guest.country) {
          setIdCountry(guest.country);
        }
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError('');
      setDepositAmount('');
      setKeyCardsCount(1);
      setPaymentRef('');
      setPaymentDetails({});
      setSelectedCategoryFilter('all');
      if (effectiveResId) {
        setCheckInMode('reservation');
        setSelectedResId(effectiveResId);
        populateFromReservation(effectiveResId);
      } else {
        const confirmed = db.reservations.filter(r => r.status === 'Confirmed' || r.status === 'Unconfirmed' || (r.status as string) === 'Pending');
        if (confirmed.length > 0) {
          setCheckInMode('reservation');
          setSelectedResId(confirmed[0].id);
          populateFromReservation(confirmed[0].id);
        } else {
          setCheckInMode('walkin');
          const firstAvail = db.rooms.find(r => 
            r.active && 
            (r.operationalStatus === 'Available' || r.operationalStatus === 'Inspected') &&
            !db.stays.some(s => s.roomId === r.id && s.status === 'Active')
          );
          if (firstAvail) {
            setSelectedRoomId(firstAvail.id);
            const rt = db.roomTypes.find(t => t.id === firstAvail.roomTypeId);
            setWalkInRate(rt?.baseRate || 4500);
          } else {
            setSelectedRoomId('');
          }
        }
      }
    }
  }, [isOpen, effectiveResId]);

  // Handle switching to Walk-In mode
  const handleSwitchToWalkin = () => {
    setCheckInMode('walkin');
    setError('');
    // Check if currently selected room is valid for walkin
    const rm = db.rooms.find(r => r.id === selectedRoomId);
    const hasActiveStay = rm ? db.stays.some(s => s.roomId === rm.id && s.status === 'Active') : true;
    if (!rm || rm.operationalStatus === 'Occupied' || rm.operationalStatus === 'Reserved' || !rm.active || hasActiveStay) {
      const firstAvail = db.rooms.find(r => 
        r.active && 
        (r.operationalStatus === 'Available' || r.operationalStatus === 'Inspected') &&
        !db.stays.some(s => s.roomId === r.id && s.status === 'Active')
      );
      if (firstAvail) {
        setSelectedRoomId(firstAvail.id);
        const rt = db.roomTypes.find(t => t.id === firstAvail.roomTypeId);
        setWalkInRate(rt?.baseRate || 4500);
      } else {
        setSelectedRoomId('');
      }
    } else {
      const rt = db.roomTypes.find(t => t.id === rm.roomTypeId);
      setWalkInRate(rt?.baseRate || 4500);
    }
  };

  // Handle switching to Reservation mode
  const handleSwitchToReservation = () => {
    setCheckInMode('reservation');
    setError('');
    if (selectedResId) {
      populateFromReservation(selectedResId);
    } else {
      const confirmed = db.reservations.filter(r => r.status === 'Confirmed');
      if (confirmed.length > 0) {
        setSelectedResId(confirmed[0].id);
        populateFromReservation(confirmed[0].id);
      }
    }
  };

  const currentRes = db.reservations.find(r => r.id === selectedResId);

  // Helper: test if room is generally available for check-in today
  const isRoomCandidate = (r: Room, forResId?: string) => {
    if (!r.active) return false;
    if (r.operationalStatus === 'Occupied' || r.operationalStatus === 'Out of Order' || r.operationalStatus === 'Blocked' || r.operationalStatus === 'Out of Service') {
      return false;
    }
    // Check if an active stay occupies the room
    const hasActiveStay = db.stays.some(s => s.roomId === r.id && s.status === 'Active');
    if (hasActiveStay) return false;

    // Check reserved status
    if (r.operationalStatus === 'Reserved') {
      // In reservation mode, if this room is pre-assigned to the current reservation, it is eligible
      if (forResId) {
        const res = db.reservations.find(resItem => resItem.id === forResId);
        if (res && res.assignedRoomId === r.id) return true;
      }
      // If reserved for someone else with a confirmed reservation arriving today, exclude it
      const todayStr = db.settings?.currentBusinessDate || new Date().toISOString().split('T')[0];
      const otherRes = db.reservations.find(resItem => 
        resItem.id !== forResId && 
        resItem.assignedRoomId === r.id && 
        resItem.status === 'Confirmed' &&
        resItem.arrivalDate <= todayStr
      );
      if (otherRes) return false;
    }

    return true;
  };

  // All available rooms in inventory
  const allAvailableRooms = useMemo(() => {
    const resId = checkInMode === 'reservation' ? selectedResId : undefined;
    return db.rooms.filter(r => isRoomCandidate(r, resId));
  }, [db.rooms, db.stays, db.reservations, checkInMode, selectedResId]);

  // Pre-assigned room if reservation has one
  const preAssignedRoom = useMemo(() => {
    if (checkInMode === 'reservation' && currentRes?.assignedRoomId) {
      return db.rooms.find(r => r.id === currentRes.assignedRoomId);
    }
    return null;
  }, [checkInMode, currentRes, db.rooms]);

  // Matching booked category rooms (Reservation mode)
  const matchingCategoryRooms = useMemo(() => {
    if (checkInMode !== 'reservation' || !currentRes) return [];
    return allAvailableRooms.filter(r => 
      r.roomTypeId === currentRes.roomTypeId && 
      r.id !== preAssignedRoom?.id
    );
  }, [checkInMode, currentRes, allAvailableRooms, preAssignedRoom]);

  // Other available rooms / upgrades (Reservation mode)
  const otherCategoryRooms = useMemo(() => {
    if (checkInMode !== 'reservation' || !currentRes) return [];
    return allAvailableRooms.filter(r => 
      r.roomTypeId !== currentRes.roomTypeId && 
      r.id !== preAssignedRoom?.id
    );
  }, [checkInMode, currentRes, allAvailableRooms, preAssignedRoom]);

  // Candidate rooms filtered by the active category filter
  const candidateRooms = useMemo(() => {
    let list: Room[] = [];
    if (checkInMode === 'reservation') {
      const combined = [
        ...(preAssignedRoom ? [preAssignedRoom] : []),
        ...matchingCategoryRooms,
        ...otherCategoryRooms
      ];
      // Deduplicate
      const seen = new Set<string>();
      list = combined.filter(r => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
    } else {
      list = allAvailableRooms;
    }

    if (selectedCategoryFilter !== 'all') {
      return list.filter(r => r.roomTypeId === selectedCategoryFilter || r.id === preAssignedRoom?.id);
    }
    return list;
  }, [checkInMode, preAssignedRoom, matchingCategoryRooms, otherCategoryRooms, allAvailableRooms, selectedCategoryFilter]);

  // Grouped available rooms by room type for walkin or filtered views
  const groupedAvailableRooms = useMemo(() => {
    const groups: { roomType: any; rooms: Room[] }[] = [];
    db.roomTypes.forEach(rt => {
      if (selectedCategoryFilter !== 'all' && rt.id !== selectedCategoryFilter) return;
      const roomsForType = allAvailableRooms.filter(r => r.roomTypeId === rt.id);
      if (roomsForType.length > 0) {
        groups.push({ roomType: rt, rooms: roomsForType });
      }
    });
    return groups;
  }, [db.roomTypes, allAvailableRooms, selectedCategoryFilter]);

  const selectedRoom = db.rooms.find(r => r.id === selectedRoomId);
  const selectedRoomType = selectedRoom ? db.roomTypes.find(t => t.id === selectedRoom.roomTypeId) : null;

  const handleConfirmCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (checkInMode === 'reservation') {
      if (!selectedResId) {
        setError('Please select a reservation to check in.');
        return;
      }
    } else {
      if (!walkInName.trim()) {
        setError('Please enter the guest full name for walk-in check-in.');
        return;
      }
      if (!walkInPhone.trim()) {
        setError('Please enter a valid guest phone number.');
        return;
      }
    }

    if (!selectedRoomId) {
      setError('Please assign a clean, available room for this stay.');
      return;
    }

    const roomToAssign = db.rooms.find(r => r.id === selectedRoomId);
    if (!roomToAssign) {
      setError('Selected room not found. Please choose an available room from the list.');
      return;
    }
    if (roomToAssign.operationalStatus === 'Occupied') {
      setError(`Room ${roomToAssign.roomNumber} is currently occupied. Please choose another available room.`);
      return;
    }
    if (roomToAssign.operationalStatus === 'Out of Order') {
      setError(`Room ${roomToAssign.roomNumber} is currently Out of Order. Please choose an active room.`);
      return;
    }

    // ID document number requirement validation
    if (!idNumber.trim()) {
      setError(`Please provide the guest's ${idType === 'Passport' ? 'Passport Number' : 'National ID (NID) Number'}. A valid ID document is required at check-in time.`);
      return;
    }

    const cardsNum = typeof keyCardsCount === 'number' ? keyCardsCount : parseInt(keyCardsCount, 10) || 1;
    const depositNum = typeof depositAmount === 'number' ? depositAmount : parseFloat(depositAmount) || 0;

    try {
      if (checkInMode === 'reservation') {
        pmsService.checkInReservation({
          reservationId: selectedResId,
          roomId: selectedRoomId,
          keyCardsIssued: cardsNum,
          verifiedId,
          idType,
          idNumber: idNumber.trim(),
          depositPayment: depositNum > 0 ? {
            amount: depositNum,
            method: paymentMethod as PaymentMethod,
            reference: paymentRef || 'Front Desk Check-in Advance',
            ...paymentDetails
          } : undefined,
          specialRequests,
          customRate: resRate > 0 ? resRate : undefined
        });
      } else {
        // Direct walk-in check in
        pmsService.walkInCheckIn({
          guestName: walkInName.trim(),
          guestPhone: walkInPhone.trim(),
          guestEmail: walkInEmail.trim() || undefined,
          idType,
          idNumber: idNumber.trim(),
          roomId: selectedRoomId,
          rate: walkInRate,
          nights: walkInNights,
          adults: walkInAdults,
          children: walkInChildren,
          keyCardsIssued: cardsNum,
          verifiedId,
          depositPayment: depositNum > 0 ? {
            amount: depositNum,
            method: paymentMethod as PaymentMethod,
            reference: paymentRef || 'Front Desk Walk-in Deposit',
            ...paymentDetails
          } : undefined,
          specialRequests: specialRequests || 'Walk-In Guest Check-in'
        });
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Check-in failed. Please verify room availability.');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border-l border-slate-800 w-full max-w-lg h-full flex flex-col shadow-2xl text-xs text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/30">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Front Desk Guest Check-In</h3>
              <p className="text-[11px] text-slate-400">NID / Passport Verification & Key Card Issuance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector: Reservation Arrival vs Walk-In */}
        <div className="px-4 pt-3 pb-1 bg-slate-950/60 border-b border-slate-800">
          <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={handleSwitchToReservation}
              className={`py-1.5 text-center font-bold rounded text-xs transition-all ${
                checkInMode === 'reservation'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Reserved Arrival ({db.reservations.filter(r => r.status === 'Confirmed' || r.status === 'Unconfirmed' || (r.status as string) === 'Pending').length})
            </button>
            <button
              type="button"
              onClick={handleSwitchToWalkin}
              className={`py-1.5 text-center font-bold rounded text-xs transition-all ${
                checkInMode === 'walkin'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              + Walk-In Check-In
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirmCheckIn} className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Reservation Selection OR Walk-in Details */}
          {checkInMode === 'reservation' ? (
            <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>Select Pending Reservation:</span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {db.reservations.filter(r => r.status === 'Confirmed' || r.status === 'Unconfirmed' || (r.status as string) === 'Pending').length} Pending Waiting
                </span>
              </label>
              <select
                value={selectedResId}
                onChange={(e) => {
                  setSelectedResId(e.target.value);
                  populateFromReservation(e.target.value);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
              >
                {db.reservations.filter(r => r.status === 'Confirmed' || r.status === 'Unconfirmed' || (r.status as string) === 'Pending').map(r => (
                  <option key={r.id} value={r.id}>
                    {r.reservationNumber} — {r.guestName} ({r.roomTypeName}) [{r.arrivalDate} to {r.departureDate}]
                  </option>
                ))}
              </select>

              {currentRes && (
                <div className="mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Guest Name:</span>
                    <span className="font-semibold text-slate-200">{currentRes.guestName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Phone Number:</span>
                    <span className="font-mono text-slate-200">{currentRes.guestPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Room Type:</span>
                    <span className="text-slate-200 font-semibold">{currentRes.roomTypeName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Advance Deposit Paid:</span>
                    <span className="font-mono text-emerald-400 font-semibold">৳{(currentRes.paidAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 bg-slate-900/90 p-2 rounded border border-amber-500/40 mt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-amber-300 text-[10px] font-bold">Room Rate per Night (৳ BDT):</span>
                      {currentRes.rate != null && resRate !== currentRes.rate && (
                        <button
                          type="button"
                          onClick={() => setResRate(currentRes.rate || 0)}
                          className="text-[10px] text-amber-400 hover:underline"
                        >
                          Reset to booked (৳{(currentRes.rate || 0).toLocaleString()})
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold font-mono">৳</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={resRate || ''}
                        onChange={(e) => setResRate(e.target.value === '' ? ('' as any) : parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-amber-500/50 focus:border-amber-400 focus:outline-none rounded pl-6 pr-2 py-1 text-amber-300 font-mono font-bold text-xs"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Editable for corporate rates, discounts, or flexible agreed price.</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] font-bold text-amber-400 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Walk-In Guest Information</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Guest Full Name *</span>
                  <input
                    type="text"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    placeholder="e.g. Mohammad Rahim"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Mobile Phone *</span>
                  <input
                    type="text"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="+880 17XX-XXXXXX"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Email Address (Optional)</span>
                  <input
                    type="email"
                    value={walkInEmail}
                    onChange={(e) => setWalkInEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Stay Length (Nights)</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={walkInNights}
                    onChange={(e) => setWalkInNights(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Room Assignment */}
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
                <BedDouble className="w-3.5 h-3.5 text-cyan-400" />
                <span>Assign Clean Room:</span>
              </label>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded font-bold">
                  {candidateRooms.length} Available in Inventory
                </span>
              </div>
            </div>

            {/* Category Filter Buttons */}
            <div className="flex items-center space-x-1.5 pb-1 overflow-x-auto text-[10px] no-scrollbar">
              <span className="text-slate-400 font-bold shrink-0 flex items-center space-x-1">
                <Filter className="w-3 h-3 text-slate-400" />
                <span>Filter:</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-2 py-0.5 rounded font-bold shrink-0 transition-colors ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All ({allAvailableRooms.length})
              </button>
              {db.roomTypes.map(rt => {
                const countForType = allAvailableRooms.filter(r => r.roomTypeId === rt.id).length;
                const isSelected = selectedCategoryFilter === rt.id;
                const isBookedCategory = checkInMode === 'reservation' && currentRes?.roomTypeId === rt.id;
                return (
                  <button
                    key={rt.id}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(rt.id)}
                    className={`px-2 py-0.5 rounded font-bold shrink-0 transition-colors flex items-center space-x-1 ${
                      isSelected
                        ? 'bg-cyan-600 text-white'
                        : isBookedCategory
                        ? 'bg-blue-900/60 text-blue-300 border border-blue-700/60 hover:bg-blue-800/60'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <span>{rt.name}</span>
                    <span className="opacity-80 font-mono">({countForType})</span>
                    {isBookedCategory && <span className="text-amber-400 text-[9px]">★</span>}
                  </button>
                );
              })}
            </div>

            {/* Room Select Dropdown */}
            <select
              value={selectedRoomId}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedRoomId(newId);
                const rm = db.rooms.find(r => r.id === newId);
                if (rm && checkInMode === 'walkin') {
                  const rt = db.roomTypes.find(t => t.id === rm.roomTypeId);
                  setWalkInRate(rt?.baseRate || 4500);
                }
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono text-xs font-semibold"
            >
              <option value="">-- Choose Available Room --</option>

              {checkInMode === 'reservation' ? (
                <>
                  {/* 1. Pre-Assigned Room */}
                  {preAssignedRoom && (
                    <optgroup label="📌 Currently Assigned Room to this Reservation">
                      <option value={preAssignedRoom.id}>
                        Room {preAssignedRoom.roomNumber} (Floor {preAssignedRoom.floor}) — {preAssignedRoom.roomTypeName} [{preAssignedRoom.housekeepingStatus} / {preAssignedRoom.operationalStatus}] ★ Assigned
                      </option>
                    </optgroup>
                  )}

                  {/* 2. Matching Booked Category Rooms */}
                  {matchingCategoryRooms.length > 0 && (
                    <optgroup label={`⭐ Booked Category: ${currentRes?.roomTypeName || 'Matching'} (${matchingCategoryRooms.length} Available)`}>
                      {matchingCategoryRooms.map(rm => {
                        const rt = db.roomTypes.find(t => t.id === rm.roomTypeId);
                        const rate = rt?.baseRate || currentRes?.rate || 0;
                        const isClean = rm.housekeepingStatus === 'Clean' || rm.housekeepingStatus === 'Inspected';
                        return (
                          <option key={rm.id} value={rm.id}>
                            Room {rm.roomNumber} (Floor {rm.floor}) — {rm.roomTypeName} [{rm.housekeepingStatus} / {rm.operationalStatus}] {isClean ? '✓ Ready' : 'Turnover'} (৳{rate.toLocaleString()}/nt)
                          </option>
                        );
                      })}
                    </optgroup>
                  )}

                  {/* 3. Upgrades & Other Available Categories */}
                  {otherCategoryRooms.length > 0 && (
                    <optgroup label={`✨ Available Upgrades & Other Categories (${otherCategoryRooms.length} Available)`}>
                      {otherCategoryRooms.map(rm => {
                        const rt = db.roomTypes.find(t => t.id === rm.roomTypeId);
                        const thisRate = rt?.baseRate || 0;
                        const bookedRate = currentRes?.rate || 0;
                        const isUpgrade = thisRate > bookedRate;
                        const isClean = rm.housekeepingStatus === 'Clean' || rm.housekeepingStatus === 'Inspected';
                        return (
                          <option key={rm.id} value={rm.id}>
                            Room {rm.roomNumber} (Floor {rm.floor}) — {rm.roomTypeName} {isUpgrade ? '★ Upgrade' : ''} [{rm.housekeepingStatus} / {rm.operationalStatus}] {isClean ? '✓ Ready' : 'Turnover'} (৳{thisRate.toLocaleString()}/nt)
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                </>
              ) : (
                <>
                  {/* Walk-in Mode Grouped by Category */}
                  {groupedAvailableRooms.map(group => (
                    <optgroup
                      key={group.roomType.id}
                      label={`${group.roomType.name} (৳${(group.roomType.baseRate || 0).toLocaleString()}/nt) — ${group.rooms.length} Available`}
                    >
                      {group.rooms.map(rm => {
                        const isClean = rm.housekeepingStatus === 'Clean' || rm.housekeepingStatus === 'Inspected';
                        return (
                          <option key={rm.id} value={rm.id}>
                            Room {rm.roomNumber} (Floor {rm.floor}) — {group.roomType.name} [{rm.housekeepingStatus} / {rm.operationalStatus}] {isClean ? '✓ Ready' : 'Turnover'} (৳{(group.roomType.baseRate || 0).toLocaleString()}/nt)
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </>
              )}

              {candidateRooms.length === 0 && (
                <option value="" disabled>No vacant clean rooms found matching this filter</option>
              )}
            </select>

            {/* Selected Room Details Card */}
            {selectedRoom && (
              <div className="bg-slate-900 p-2.5 rounded border border-slate-700/80 space-y-2 mt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold font-mono text-cyan-300 text-xs">Room {selectedRoom.roomNumber}</span>
                    <span className="text-slate-500">• Floor {selectedRoom.floor} •</span>
                    <span className="text-slate-200 font-semibold">{selectedRoom.roomTypeName}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      selectedRoom.housekeepingStatus === 'Inspected'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : selectedRoom.housekeepingStatus === 'Clean'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {selectedRoom.housekeepingStatus === 'Inspected' ? '✓ Inspected & Ready' : selectedRoom.housekeepingStatus}
                    </span>
                  </div>
                </div>

                {/* Upgrade Notice for Reservation Mode */}
                {checkInMode === 'reservation' && currentRes && selectedRoom.roomTypeId !== currentRes.roomTypeId && (
                  <div className="p-2 rounded bg-indigo-950/60 border border-indigo-700/60 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between text-indigo-300 font-bold">
                      <span className="flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Room Category Change / Upgrade</span>
                      </span>
                      <span className="text-[10px] text-indigo-400">
                        Booked: {currentRes.roomTypeName} (৳{(currentRes.rate || 0).toLocaleString()})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] pt-0.5">
                      <span className="text-slate-300">
                        Category Base Rate: <strong className="font-mono text-amber-300">৳{((selectedRoomType?.baseRate) || 0).toLocaleString()}/nt</strong>
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedRoomType) setResRate(selectedRoomType.baseRate);
                          }}
                          className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-xs"
                        >
                          Apply Category Rate
                        </button>
                        <button
                          type="button"
                          onClick={() => setResRate(currentRes.rate || 0)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          Keep Booked Rate
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {checkInMode === 'walkin' && selectedRoomId && (
              <div className="flex items-center space-x-2 pt-1 text-[11px]">
                <span className="text-slate-400">Agreed Rate/Night:</span>
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 font-mono">৳</span>
                  <input
                    type="number"
                    step="100"
                    value={walkInRate || ''}
                    onChange={(e) => setWalkInRate(e.target.value === '' ? ('' as any) : parseFloat(e.target.value) || 0)}
                    className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-amber-400 font-mono font-bold text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. MANDATORY GUEST IDENTIFICATION SECTION: NID OR PASSPORT */}
          <div className="space-y-3 bg-slate-950 p-3.5 rounded-lg border-2 border-amber-500/40 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center space-x-1.5">
                    <span>Guest Identification & Verification</span>
                    <span className="text-[9px] bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded uppercase">
                      Mandatory
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Select NID or Passport and verify physical document
                  </p>
                </div>
              </div>
              {hasExistingIdOnRecord && (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                  ✓ ID on File
                </span>
              )}
            </div>

            {/* Document Type Selector (NID vs Passport vs Other) */}
            <div>
              <span className="text-[10px] font-bold text-slate-300 block mb-1.5 uppercase tracking-wide">
                ID Document Option:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setIdType('National ID (NID)')}
                  className={`flex flex-col items-center justify-center p-2 rounded-md border text-center transition-all ${
                    idType === 'National ID (NID)'
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold ring-1 ring-blue-500 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4 mb-1 text-blue-400" />
                  <span className="text-xs">National ID (NID)</span>
                  <span className="text-[9px] text-slate-500 font-normal">Bangladesh Smart NID</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIdType('Passport')}
                  className={`flex flex-col items-center justify-center p-2 rounded-md border text-center transition-all ${
                    idType === 'Passport'
                      ? 'bg-amber-600/30 border-amber-500 text-amber-300 font-bold ring-1 ring-amber-500 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-4 h-4 mb-1 text-amber-400" />
                  <span className="text-xs">Passport</span>
                  <span className="text-[9px] text-slate-500 font-normal">International / MRP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIdType('Driving License')}
                  className={`flex flex-col items-center justify-center p-2 rounded-md border text-center transition-all ${
                    idType !== 'National ID (NID)' && idType !== 'Passport'
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold ring-1 ring-emerald-500 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <IdCard className="w-4 h-4 mb-1 text-emerald-400" />
                  <span className="text-xs">Other Photo ID</span>
                  <span className="text-[9px] text-slate-500 font-normal">License / Cert</span>
                </button>
              </div>
            </div>

            {/* Other ID selector if selected */}
            {idType !== 'National ID (NID)' && idType !== 'Passport' && (
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Specific ID Sub-Type:</span>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs"
                >
                  <option value="Driving License">Driving License (BRTA)</option>
                  <option value="Birth Certificate">Birth Certificate</option>
                  <option value="Diplomatic ID">Diplomatic / Official Mission ID</option>
                </select>
              </div>
            )}

            {/* ID / Passport Number & Country */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className={idType === 'Passport' ? 'md:col-span-2' : 'md:col-span-3'}>
                <label className="text-[10px] font-bold text-slate-300 block mb-1">
                  {idType === 'Passport'
                    ? 'Passport Number *'
                    : idType === 'National ID (NID)'
                      ? 'National ID (NID) Number *'
                      : `${idType} Number *`}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder={
                      idType === 'Passport'
                        ? 'e.g. A01234567 or EA0987654'
                        : idType === 'National ID (NID)'
                          ? 'e.g. 19852691234567890 (Smart NID or 10/17-digit)'
                          : 'e.g. DL-XXXXXXXX'
                    }
                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded px-2.5 py-2 text-slate-100 font-mono text-xs tracking-wide"
                  />
                  {idNumber.trim().length > 5 && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-2.5 top-2.5" />
                  )}
                </div>
                <p className="text-[9.5px] text-slate-400 mt-1">
                  {idType === 'Passport'
                    ? 'Enter the 7-9 character passport number as printed on the bio-data page.'
                    : idType === 'National ID (NID)'
                      ? 'Enter the 10-digit Smart NID or 17-digit national registration number.'
                      : 'Enter the official document identification number.'}
                </p>
              </div>

              {idType === 'Passport' && (
                <div className="md:col-span-1">
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    Issuing Country
                  </label>
                  <input
                    type="text"
                    value={idCountry}
                    onChange={(e) => setIdCountry(e.target.value)}
                    placeholder="e.g. Bangladesh / USA"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded px-2.5 py-2 text-slate-100 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Inspection Checklist & Key Card Count */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedId}
                  onChange={(e) => setVerifiedId(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <span className="text-[11px] font-semibold text-slate-200">
                  Original Physical {idType === 'Passport' ? 'Passport' : 'NID Card'} Inspected & Verified
                </span>
              </label>

              <div className="flex items-center space-x-2 shrink-0 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Key Cards:</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={keyCardsCount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setKeyCardsCount('');
                    } else {
                      const num = parseInt(val, 10);
                      setKeyCardsCount(isNaN(num) ? '' : Math.min(5, Math.max(1, num)));
                    }
                  }}
                  onBlur={() => {
                    if (keyCardsCount === '' || keyCardsCount < 1) {
                      setKeyCardsCount(1);
                    }
                  }}
                  className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-slate-100 text-center font-mono text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* 4. Payment / Additional Deposit */}
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>Collect Advance Deposit (Optional):</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Advance Amount (৳ BDT):</span>
              <input
                type="number"
                min="0"
                step="500"
                value={depositAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setDepositAmount('');
                  } else {
                    const num = parseFloat(val);
                    setDepositAmount(isNaN(num) ? '' : num);
                  }
                }}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs"
              />
            </div>

            {Number(depositAmount) > 0 && (
              <BDCardAndPaymentSelector
                method={paymentMethod}
                onMethodChange={setPaymentMethod}
                amount={Number(depositAmount) || 0}
                reference={paymentRef}
                onReferenceChange={setPaymentRef}
                details={paymentDetails}
                onDetailsChange={setPaymentDetails}
                theme="dark"
              />
            )}
          </div>

          {/* 5. Special Requests & Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Special Requests / Front Desk Notes:</label>
            <textarea
              rows={2}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="e.g. Extra key requested, high floor preference, airport taxi booked"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmCheckIn}
            className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Check-In Guest</span>
          </button>
        </div>
      </div>
    </div>
  );
};
