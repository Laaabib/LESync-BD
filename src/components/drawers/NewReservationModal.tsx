import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Calendar, User, BedDouble, CreditCard, CheckCircle2,
  AlertCircle, Plus, Search, Printer, Users, Building2,
  Trash2, Layers, Briefcase, FileText, Check, Phone, Mail,
  MapPin, ShieldCheck, UserPlus
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { Guest, RoomType, Package, PaymentMethod, Reservation, CustomerType, AllocatedRoom, GroupMember } from '../../types/pms';
import { SIMPLE_CARD_OPTIONS } from '../../constants/paymentConfig';

type BookingSourceType = Reservation['bookingSource'];

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (reservationId: string, reservation?: Reservation, shouldPrint?: boolean) => void;
  initialRoomId?: string;
  initialArrivalDate?: string;
  preselectedRoomId?: string;
  preselectedDate?: string;
}

interface RoomAllocationItem {
  id: string;
  roomTypeId: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  guestPhone: string;
  adults: number;
  children: number;
  rate: number;
  notes: string;
}

export const NewReservationModal: React.FC<NewReservationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRoomId,
  initialArrivalDate,
  preselectedRoomId,
  preselectedDate
}) => {
  const db = pmsService.getState();

  const effectiveRoomId = initialRoomId || preselectedRoomId || '';
  const effectiveArrivalDate = initialArrivalDate || preselectedDate || '';

  // 1. Customer Classification: Individual vs Corporate
  const [customerType, setCustomerType] = useState<CustomerType>('Individual');
  const [companyName, setCompanyName] = useState<string>('');
  const [companyGstBin, setCompanyGstBin] = useState<string>('');
  const [companyContactPerson, setCompanyContactPerson] = useState<string>('');
  const [companyDesignation, setCompanyDesignation] = useState<string>('');
  const [companyEmail, setCompanyEmail] = useState<string>('');
  const [companyPhone, setCompanyPhone] = useState<string>('');
  const [companyAddress, setCompanyAddress] = useState<string>('');
  const [corporateAccountId, setCorporateAccountId] = useState<string>('');

  // 2. Group Booking Mode
  const [isGroupBooking, setIsGroupBooking] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>('');
  const [groupLeaderName, setGroupLeaderName] = useState<string>('');
  const [groupLeaderPhone, setGroupLeaderPhone] = useState<string>('');
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  // Group Member Input state
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberPhone, setNewMemberPhone] = useState<string>('');
  const [newMemberIdNumber, setNewMemberIdNumber] = useState<string>('');
  const [bulkMemberText, setBulkMemberText] = useState<string>('');
  const [showBulkAdd, setShowBulkAdd] = useState<boolean>(false);

  // 3. Primary Guest selection / creation
  const [guestMode, setGuestMode] = useState<'existing' | 'new'>('existing');
  const [guestSearch, setGuestSearch] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState('');

  // New Guest Fields
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestIdType, setNewGuestIdType] = useState<Guest['idType']>('National ID (NID)');
  const [newGuestIdNumber, setNewGuestIdNumber] = useState('');
  const [newGuestVip, setNewGuestVip] = useState(false);

  // 4. Stay Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [arrivalDate, setArrivalDate] = useState(effectiveArrivalDate || todayStr);
  const [departureDate, setDepartureDate] = useState(tomorrowStr);
  const [bookingSource, setBookingSource] = useState<BookingSourceType>('Phone / Direct');
  const [packageId, setPackageId] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');

  // 5. Room Allocation State (supports 1 or multiple rooms)
  const defaultRoomTypeId = db.roomTypes[0]?.id || '';
  const [allocatedRooms, setAllocatedRooms] = useState<RoomAllocationItem[]>([
    {
      id: 'alloc-init-1',
      roomTypeId: defaultRoomTypeId,
      roomId: effectiveRoomId,
      roomNumber: '',
      guestName: '',
      guestPhone: '',
      adults: 2,
      children: 0,
      rate: db.roomTypes[0]?.baseRate || 5000,
      notes: ''
    }
  ]);

  // 6. Deposit & Payment
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [cardOption, setCardOption] = useState<string>('Visa / MasterCard');
  const [bankTxnNo, setBankTxnNo] = useState<string>('');
  const [bankTraceNo, setBankTraceNo] = useState<string>('');
  const [paymentRef, setPaymentRef] = useState<string>('');

  // Print on booking option
  const [autoPrintConfirmation, setAutoPrintConfirmation] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setError('');
      setCustomerType('Individual');
      setCompanyName('');
      setCompanyGstBin('');
      setCompanyContactPerson('');
      setCompanyDesignation('');
      setCompanyEmail('');
      setCompanyPhone('');
      setCompanyAddress('');
      setCorporateAccountId('');
      setIsGroupBooking(false);
      setGroupName('');
      setGroupLeaderName('');
      setGroupLeaderPhone('');
      setGroupMembers([]);
      setNewMemberName('');
      setNewMemberPhone('');
      setNewMemberIdNumber('');
      setBulkMemberText('');
      setShowBulkAdd(false);

      let initialRtId = db.roomTypes[0]?.id || '';
      let initialRoomNum = '';
      if (initialRoomId) {
        const room = db.rooms.find(r => r.id === initialRoomId);
        if (room) {
          initialRtId = room.roomTypeId;
          initialRoomNum = room.roomNumber;
        }
      }
      const initialRt = db.roomTypes.find(rt => rt.id === initialRtId);
      const initialBase = initialRt?.baseRate || 5000;

      setAllocatedRooms([
        {
          id: `alloc-${Date.now()}-1`,
          roomTypeId: initialRtId,
          roomId: initialRoomId || '',
          roomNumber: initialRoomNum,
          guestName: '',
          guestPhone: '',
          adults: 2,
          children: 0,
          rate: initialBase,
          notes: ''
        }
      ]);

      if (initialArrivalDate) setArrivalDate(initialArrivalDate);
      if (db.guests.length > 0) {
        setSelectedGuestId(db.guests[0].id);
        setGuestMode('existing');
      } else {
        setSelectedGuestId('');
        setGuestMode('new');
      }
    }
  }, [isOpen, initialRoomId, initialArrivalDate]);

  if (!isOpen) return null;

  // Nights calculation
  const arr = new Date(arrivalDate);
  const dep = new Date(departureDate);
  const nights = Math.max(1, Math.round((dep.getTime() - arr.getTime()) / (1000 * 60 * 60 * 24)));

  // Calculate totals across allocated rooms
  const totalRoomsCount = allocatedRooms.length;
  const totalNightlyRate = allocatedRooms.reduce((sum, r) => sum + (r.rate || 0), 0);
  const totalEstimated = totalNightlyRate * nights;
  const totalAdults = allocatedRooms.reduce((sum, r) => sum + (r.adults || 0), 0);
  const totalChildren = allocatedRooms.reduce((sum, r) => sum + (r.children || 0), 0);

  // Available rooms helper for a specific room type, excluding rooms picked in other rows
  const getAvailableRoomsForType = (roomTypeId: string, currentItemRoomId?: string) => {
    const pickedInOtherRows = new Set(
      allocatedRooms
        .map(r => r.roomId)
        .filter(id => id && id !== currentItemRoomId)
    );

    return db.rooms.filter(r => {
      if (r.roomTypeId !== roomTypeId) return false;
      if (pickedInOtherRows.has(r.id)) return false;
      const avail = pmsService.checkRoomAvailability(r.id, arrivalDate, departureDate);
      return avail.isAvailable || r.id === currentItemRoomId;
    });
  };

  const filteredGuests = db.guests.filter(g =>
    g.fullName.toLowerCase().includes(guestSearch.toLowerCase()) ||
    g.phone.includes(guestSearch) ||
    g.guestCode.toLowerCase().includes(guestSearch.toLowerCase())
  );

  // Group Member Handlers
  const handleAddGroupMember = () => {
    if (!newMemberName.trim()) return;
    const newMember: GroupMember = {
      id: `gm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newMemberName.trim(),
      phone: newMemberPhone.trim() || undefined,
      idNumber: newMemberIdNumber.trim() || undefined,
      isLeader: groupMembers.length === 0
    };
    setGroupMembers(prev => [...prev, newMember]);
    setNewMemberName('');
    setNewMemberPhone('');
    setNewMemberIdNumber('');
  };

  const handleBulkAddMembers = () => {
    if (!bulkMemberText.trim()) return;
    const lines = bulkMemberText
      .split(/[\n,;]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const added: GroupMember[] = lines.map((name, idx) => ({
      id: `gm-bulk-${Date.now()}-${idx}`,
      name,
      isLeader: groupMembers.length === 0 && idx === 0
    }));

    setGroupMembers(prev => [...prev, ...added]);
    setBulkMemberText('');
    setShowBulkAdd(false);
  };

  const handleRemoveGroupMember = (id: string) => {
    setGroupMembers(prev => prev.filter(m => m.id !== id));
  };

  // Room Allocation Handlers
  const handleAddRoomAllocation = () => {
    const defaultRt = db.roomTypes[0];
    const newAlloc: RoomAllocationItem = {
      id: `alloc-${Date.now()}-${allocatedRooms.length + 1}`,
      roomTypeId: defaultRt?.id || '',
      roomId: '',
      roomNumber: '',
      guestName: groupMembers[allocatedRooms.length]?.name || '',
      guestPhone: groupMembers[allocatedRooms.length]?.phone || '',
      adults: 2,
      children: 0,
      rate: defaultRt?.baseRate || 5000,
      notes: ''
    };
    setAllocatedRooms(prev => [...prev, newAlloc]);
  };

  const handleRemoveRoomAllocation = (index: number) => {
    if (allocatedRooms.length <= 1) return;
    setAllocatedRooms(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateRoomAllocation = (index: number, updates: Partial<RoomAllocationItem>) => {
    setAllocatedRooms(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };

      // If roomTypeId changed, update default rate and clear roomId if incompatible
      if (updates.roomTypeId && updates.roomTypeId !== prev[index].roomTypeId) {
        const rt = db.roomTypes.find(t => t.id === updates.roomTypeId);
        if (rt) {
          copy[index].rate = rt.baseRate;
        }
        copy[index].roomId = '';
        copy[index].roomNumber = '';
      }

      // If roomId changed, sync roomNumber
      if (updates.roomId !== undefined) {
        if (updates.roomId) {
          const rm = db.rooms.find(r => r.id === updates.roomId);
          copy[index].roomNumber = rm ? rm.roomNumber : '';
        } else {
          copy[index].roomNumber = '';
        }
      }

      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let guestIdToUse = selectedGuestId;

    // 1. Create new guest if needed
    if (guestMode === 'new') {
      if (!newGuestName.trim() || !newGuestPhone.trim()) {
        setError('Please enter primary guest full name and phone number.');
        return;
      }
      try {
        const newGuest = pmsService.createGuest({
          fullName: newGuestName.trim(),
          phone: newGuestPhone.trim(),
          email: newGuestEmail.trim() || `${newGuestPhone.replace(/[^0-9]/g, '')}@guest.cculb.bd`,
          gender: 'Male',
          nationality: 'Bangladeshi',
          city: 'Dhaka',
          country: 'Bangladesh',
          idType: newGuestIdType || 'National ID (NID)',
          idNumber: newGuestIdNumber.trim() || 'NID-PENDING',
          address: 'Dhaka, Bangladesh',
          vipStatus: newGuestVip,
          notes: customerType === 'Corporate' ? `Corporate Guest (${companyName || 'Corporate Client'})` : 'Registered during new reservation'
        });
        guestIdToUse = newGuest.id;
      } catch (err: any) {
        setError(err.message || 'Could not register new guest');
        return;
      }
    }

    if (!guestIdToUse) {
      setError('Please select or create a guest profile.');
      return;
    }

    if (customerType === 'Corporate' && !companyName.trim()) {
      setError('Please enter the corporate company name for this corporate booking.');
      return;
    }

    if (isGroupBooking && !groupName.trim()) {
      setError('Please enter a Group Name (e.g. delegation, company retreat, or family group name).');
      return;
    }

    if (!arrivalDate || !departureDate || new Date(arrivalDate) >= new Date(departureDate)) {
      setError('Departure date must be after arrival date.');
      return;
    }

    if (allocatedRooms.length === 0) {
      setError('Please allocate at least one room.');
      return;
    }

    // Verify room assignments are unique
    const assignedIds = allocatedRooms.map(r => r.roomId).filter(Boolean);
    const uniqueIds = new Set(assignedIds);
    if (uniqueIds.size !== assignedIds.length) {
      setError('A room cannot be assigned to multiple room slots. Please select different room numbers.');
      return;
    }

    try {
      let finalPaymentRef = paymentRef;
      if (depositAmount > 0) {
        if (paymentMethod === 'Credit Card') {
          finalPaymentRef = paymentRef ? `${cardOption} - Slip: ${paymentRef}` : `${cardOption} POS`;
        } else if (paymentMethod === 'Bank Transfer') {
          const parts = [
            bankTxnNo ? `Txn: ${bankTxnNo}` : '',
            bankTraceNo ? `Trace: ${bankTraceNo}` : ''
          ].filter(Boolean);
          finalPaymentRef = parts.join(' | ') || paymentRef || 'Bank Transfer';
        }
      }

      const primaryGuestObj = db.guests.find(g => g.id === guestIdToUse);
      const primaryGuestName = primaryGuestObj ? primaryGuestObj.fullName : newGuestName;

      // Prepare allocated rooms formatted
      const formattedAllocatedRooms: AllocatedRoom[] = allocatedRooms.map((ar, idx) => {
        const rt = db.roomTypes.find(t => t.id === ar.roomTypeId) || db.roomTypes[0];
        return {
          id: ar.id || `alloc-${Date.now()}-${idx}`,
          roomTypeId: ar.roomTypeId,
          roomTypeName: rt?.name || 'Deluxe Room',
          roomId: ar.roomId || undefined,
          roomNumber: ar.roomNumber || undefined,
          guestName: ar.guestName.trim() || (isGroupBooking ? `${groupName} (Room ${idx + 1})` : primaryGuestName),
          guestPhone: ar.guestPhone.trim() || undefined,
          adults: ar.adults || 1,
          children: ar.children || 0,
          rate: ar.rate >= 0 ? ar.rate : rt.baseRate,
          packageId: packageId || undefined,
          packageName: packageId ? db.packages.find(p => p.id === packageId)?.name : undefined,
          notes: ar.notes || undefined
        };
      });

      const effectiveBookingSource = customerType === 'Corporate' ? 'Corporate' : bookingSource;

      const newRes = pmsService.createReservation({
        guestId: guestIdToUse,
        roomTypeId: formattedAllocatedRooms[0]?.roomTypeId || defaultRoomTypeId,
        assignedRoomId: formattedAllocatedRooms[0]?.roomId || undefined,
        arrivalDate,
        departureDate,
        adults: totalAdults,
        children: totalChildren,
        bookingSource: effectiveBookingSource,
        packageId: packageId || undefined,
        specialRequests,
        depositAmount,
        paymentMethod: depositAmount > 0 ? paymentMethod : undefined,
        paymentReference: finalPaymentRef,
        cardType: paymentMethod === 'Credit Card' ? cardOption : undefined,
        cardApprovalCode: paymentMethod === 'Credit Card' ? (paymentRef || undefined) : undefined,
        transactionNo: paymentMethod === 'Bank Transfer' ? (bankTxnNo || undefined) : undefined,
        traceNo: paymentMethod === 'Bank Transfer' ? (bankTraceNo || undefined) : undefined,

        // Corporate or Individual Booking Details
        customerType,
        companyName: customerType === 'Corporate' ? companyName.trim() : undefined,
        companyGstBin: customerType === 'Corporate' ? companyGstBin.trim() : undefined,
        companyContactPerson: customerType === 'Corporate' ? companyContactPerson.trim() : undefined,
        companyDesignation: customerType === 'Corporate' ? companyDesignation.trim() : undefined,
        companyEmail: customerType === 'Corporate' ? companyEmail.trim() : undefined,
        companyPhone: customerType === 'Corporate' ? companyPhone.trim() : undefined,
        companyAddress: customerType === 'Corporate' ? companyAddress.trim() : undefined,
        corporateAccountId: corporateAccountId || undefined,

        // Group Booking & Multi-Room Details
        isGroupBooking: isGroupBooking || formattedAllocatedRooms.length > 1,
        groupName: isGroupBooking ? groupName.trim() : (formattedAllocatedRooms.length > 1 ? `${primaryGuestName} Group` : undefined),
        groupLeaderName: groupLeaderName.trim() || primaryGuestName,
        groupLeaderPhone: groupLeaderPhone.trim() || (primaryGuestObj?.phone || newGuestPhone),
        groupMembers: groupMembers.length > 0 ? groupMembers : undefined,
        allocatedRooms: formattedAllocatedRooms,
        totalRoomsCount: formattedAllocatedRooms.length
      });

      onSuccess?.(newRes.id, newRes, autoPrintConfirmation);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create reservation.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs text-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-100">Create New Reservation</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  customerType === 'Corporate' 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {customerType === 'Corporate' ? 'Corporate Booking' : 'Individual Booking'}
                </span>
                {isGroupBooking && (
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>Group Mode ({allocatedRooms.length} Rooms)</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Enterprise Room Allocation, Corporate Billing & Group Roster</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-300 flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Section 0: Booking Classification (Corporate vs Individual) */}
          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>1. Booking Classification & Profile</span>
              </span>

              {/* Corporate vs Individual Switcher */}
              <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700/80 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerType('Individual');
                    if (bookingSource === 'Corporate') setBookingSource('Phone / Direct');
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    customerType === 'Individual'
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Individual Guest</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerType('Corporate');
                    setBookingSource('Corporate');
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    customerType === 'Corporate'
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Corporate / Company</span>
                </button>
              </div>
            </div>

            {/* Corporate Profile Details (Visible when Corporate selected) */}
            {customerType === 'Corporate' && (
              <div className="bg-blue-950/20 border border-blue-500/30 rounded-lg p-3 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Corporate Client Credentials & Billing</span>
                  </span>
                  <span className="text-[10px] text-blue-400">Invoicing will reflect corporate trade details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-300 block mb-0.5 font-medium">Company Name *</span>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Grameenphone Ltd / Apex Footwear / Unilever Bangladesh"
                      className="w-full bg-slate-900 border border-blue-500/40 rounded px-2.5 py-1.5 text-slate-100 placeholder-slate-500 font-semibold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-300 block mb-0.5">GST / BIN / Tax Reg. No.</span>
                    <input
                      type="text"
                      value={companyGstBin}
                      onChange={(e) => setCompanyGstBin(e.target.value)}
                      placeholder="e.g. BIN-001928374-0101"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Contact Person / Booked By</span>
                    <input
                      type="text"
                      value={companyContactPerson}
                      onChange={(e) => setCompanyContactPerson(e.target.value)}
                      placeholder="e.g. Mr. Rafiqul Islam"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Designation</span>
                    <input
                      type="text"
                      value={companyDesignation}
                      onChange={(e) => setCompanyDesignation(e.target.value)}
                      placeholder="e.g. Head of HR / Admin"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Official Phone</span>
                    <input
                      type="text"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      placeholder="+880 17XX XXXXXX"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Corporate Email</span>
                    <input
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      placeholder="corporate@company.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Corporate Registered Address</span>
                    <input
                      type="text"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="e.g. Plot 1, Bashundhara R/A, Dhaka-1229"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">City Ledger Link</span>
                    <select
                      value={corporateAccountId}
                      onChange={(e) => setCorporateAccountId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                    >
                      <option value="">-- Direct Corporate Settlement --</option>
                      {db.cityLedgerAccounts?.map(cl => (
                        <option key={cl.id} value={cl.id}>
                          {cl.companyName} ({cl.accountNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Guest Selection / Registration */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  {customerType === 'Corporate' ? 'Lead Corporate Delegate / Focal Guest' : 'Primary Registered Guest'}
                </span>
                <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setGuestMode('existing')}
                    className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                      guestMode === 'existing' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Existing Guest
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuestMode('new')}
                    className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                      guestMode === 'new' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    + New Guest Profile
                  </button>
                </div>
              </div>

              {guestMode === 'existing' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                      placeholder="Filter guest by name, phone or code..."
                      className="w-full bg-slate-900 border border-slate-700 rounded pl-8 pr-2 py-1.5 text-slate-200 placeholder-slate-500"
                    />
                  </div>
                  <select
                    value={selectedGuestId}
                    onChange={(e) => setSelectedGuestId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 font-medium"
                  >
                    {filteredGuests.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.fullName} — {g.phone} ({g.guestCode}) {g.vipStatus ? '[VIP]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Full Name *</span>
                    <input
                      type="text"
                      value={newGuestName}
                      onChange={(e) => setNewGuestName(e.target.value)}
                      placeholder="e.g. Engr. Tanvir Ahmed"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-medium"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Phone Number *</span>
                    <input
                      type="text"
                      value={newGuestPhone}
                      onChange={(e) => setNewGuestPhone(e.target.value)}
                      placeholder="+880 17XX XXXXXX"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Email Address</span>
                    <input
                      type="email"
                      value={newGuestEmail}
                      onChange={(e) => setNewGuestEmail(e.target.value)}
                      placeholder="guest@example.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">ID Type</span>
                      <select
                        value={newGuestIdType}
                        onChange={(e) => setNewGuestIdType(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-xs"
                      >
                        <option value="National ID (NID)">NID</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving License">Driving Lic.</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 block mb-0.5">ID Number</span>
                      <input
                        type="text"
                        value={newGuestIdNumber}
                        onChange={(e) => setNewGuestIdNumber(e.target.value)}
                        placeholder="NID or Passport #"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="vipCheck"
                      checked={newGuestVip}
                      onChange={(e) => setNewGuestVip(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="vipCheck" className="text-slate-300 cursor-pointer font-medium">
                      Mark as Resort VIP Profile
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 1: Group Booking & Member Manifest */}
          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div>
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>2. Group Booking & Member Roster</span>
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Manage delegation, tour, or family group details with guest roster.
                </p>
              </div>

              {/* Group Booking Toggle Switch */}
              <label className="flex items-center space-x-2 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-lg cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isGroupBooking}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsGroupBooking(checked);
                    if (checked && !groupName) {
                      setGroupName(customerType === 'Corporate' && companyName ? `${companyName} Delegation` : 'Group Booking');
                    }
                  }}
                  className="rounded border-slate-700 bg-slate-950 text-purple-500 focus:ring-purple-500/20 w-4 h-4 cursor-pointer"
                />
                <span className="font-bold text-xs text-purple-300">Enable Group Booking</span>
              </label>
            </div>

            {isGroupBooking && (
              <div className="space-y-3 pt-1 animate-in fade-in">
                {/* Group Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <span className="text-[10px] text-slate-300 block mb-0.5 font-medium">Group / Event Name *</span>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="e.g. Apex Leadership Summit 2026"
                      className="w-full bg-slate-900 border border-purple-500/40 rounded px-2.5 py-1.5 text-slate-100 font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-300 block mb-0.5">Group Leader / Coordinator</span>
                    <input
                      type="text"
                      value={groupLeaderName}
                      onChange={(e) => setGroupLeaderName(e.target.value)}
                      placeholder="e.g. Mr. Tanvir Ahmed"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-300 block mb-0.5">Leader Phone</span>
                    <input
                      type="text"
                      value={groupLeaderPhone}
                      onChange={(e) => setGroupLeaderPhone(e.target.value)}
                      placeholder="+880 17XX XXXXXX"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                    />
                  </div>
                </div>

                {/* Group Guest Roster Builder ("adding their name in booking form") */}
                <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                        <span>Group Guest Names Manifest ({groupMembers.length} Members)</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBulkAdd(!showBulkAdd)}
                      className="text-[10px] text-purple-400 hover:text-purple-300 underline font-medium cursor-pointer"
                    >
                      {showBulkAdd ? 'Single Add' : 'Bulk Paste Names'}
                    </button>
                  </div>

                  {showBulkAdd ? (
                    <div className="space-y-2 bg-slate-950 p-2.5 rounded border border-purple-500/30">
                      <span className="text-[10px] text-slate-400 block">
                        Paste member names separated by commas or line breaks:
                      </span>
                      <textarea
                        rows={2}
                        value={bulkMemberText}
                        onChange={(e) => setBulkMemberText(e.target.value)}
                        placeholder="e.g. Tanvir Ahmed, Farhana Yasmin, Dr. Nusrat Jahan, Kamal Hossain"
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleBulkAddMembers}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-xs transition cursor-pointer"
                      >
                        Add Pasted Names to Manifest
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Guest Member Name</span>
                        <input
                          type="text"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          placeholder="e.g. Farzana Yasmin"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddGroupMember();
                            }
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Phone (Optional)</span>
                        <input
                          type="text"
                          value={newMemberPhone}
                          onChange={(e) => setNewMemberPhone(e.target.value)}
                          placeholder="+880 18XX XXXXXX"
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={handleAddGroupMember}
                          disabled={!newMemberName.trim()}
                          className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold rounded text-xs flex items-center justify-center space-x-1 cursor-pointer transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Roster</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Registered Group Members List */}
                  {groupMembers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto">
                      {groupMembers.map((m, idx) => (
                        <div
                          key={m.id}
                          className="flex items-center space-x-1.5 bg-slate-950 border border-purple-500/40 text-slate-200 px-2 py-1 rounded text-[11px]"
                        >
                          <span className="font-mono text-purple-400 font-bold text-[10px]">#{idx + 1}</span>
                          <span className="font-medium">{m.name}</span>
                          {m.phone && <span className="text-[10px] text-slate-400 font-mono">({m.phone})</span>}
                          {m.isLeader && (
                            <span className="px-1 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                              Leader
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveGroupMember(m.id)}
                            className="text-slate-400 hover:text-rose-400 ml-1 p-0.5 rounded cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Stay Dates & Stay Duration */}
          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-3">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>3. Stay Dates & Timeline</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Arrival Date:</span>
                <input
                  type="date"
                  value={arrivalDate}
                  min={todayStr}
                  onChange={(e) => {
                    const newArr = e.target.value;
                    setArrivalDate(newArr);
                    if (!departureDate || departureDate <= newArr) {
                      const nextD = new Date(newArr);
                      nextD.setDate(nextD.getDate() + 1);
                      setDepartureDate(nextD.toISOString().split('T')[0]);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono font-medium"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Departure Date:</span>
                <input
                  type="date"
                  value={departureDate}
                  min={arrivalDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono font-medium"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Duration:</span>
                <div className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-bold font-mono text-amber-400 flex items-center justify-between">
                  <span>{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">Check-out 12:00 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Multiple Room Selection & Allocation */}
          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <BedDouble className="w-3.5 h-3.5" />
                  <span>4. Multiple Room Selection & Allocation</span>
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Select and assign specific rooms, categories, rates, and individual occupant names.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddRoomAllocation}
                className="flex items-center space-x-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md text-xs transition cursor-pointer self-start sm:self-auto shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Allocate Another Room</span>
              </button>
            </div>

            {/* List of Allocated Rooms */}
            <div className="space-y-3">
              {allocatedRooms.map((alloc, idx) => {
                const availableRoomsForThis = getAvailableRoomsForType(alloc.roomTypeId, alloc.roomId);
                const selectedRt = db.roomTypes.find(t => t.id === alloc.roomTypeId);

                return (
                  <div
                    key={alloc.id}
                    className="bg-slate-900 border border-slate-700/80 rounded-lg p-3 space-y-2.5 relative transition-all"
                  >
                    {/* Room Item Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center text-xs border border-amber-500/30">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-200 text-xs">
                          Allocated Room #{idx + 1}
                        </span>
                        {alloc.roomNumber && (
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px] border border-cyan-500/30">
                            Room {alloc.roomNumber}
                          </span>
                        )}
                      </div>

                      {allocatedRooms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRoomAllocation(idx)}
                          className="flex items-center space-x-1 text-slate-400 hover:text-rose-400 text-[10px] p-1 rounded hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    {/* Room Category & Specific Room Number Allocation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Room Category / Type *</span>
                        <select
                          value={alloc.roomTypeId}
                          onChange={(e) => handleUpdateRoomAllocation(idx, { roomTypeId: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-semibold"
                        >
                          {db.roomTypes.map(rt => (
                            <option key={rt.id} value={rt.id}>
                              {rt.name} — Base ৳{(rt.baseRate || 0).toLocaleString()}/nt (Max {rt.maxAdults + rt.maxChildren} Pax)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">
                          Assigned Room # (Available for Dates)
                        </span>
                        <select
                          value={alloc.roomId}
                          onChange={(e) => handleUpdateRoomAllocation(idx, { roomId: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs"
                        >
                          <option value="">-- Assign Later at Check-In --</option>
                          {availableRoomsForThis.map(rm => (
                            <option key={rm.id} value={rm.id}>
                              Room {rm.roomNumber} (Floor {rm.floor}) - {rm.operationalStatus}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Occupant Guest Name & Contact */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-slate-400 block mb-0.5">
                          Assigned Occupant / Guest Name
                        </span>
                        <div className="flex space-x-1.5">
                          <input
                            type="text"
                            value={alloc.guestName}
                            onChange={(e) => handleUpdateRoomAllocation(idx, { guestName: e.target.value })}
                            placeholder={
                              isGroupBooking
                                ? (groupMembers[idx]?.name || `Occupant for Room #${idx + 1}`)
                                : 'Guest name for this room'
                            }
                            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-medium"
                          />
                          {/* Quick pick from group members if available */}
                          {groupMembers.length > 0 && (
                            <select
                              onChange={(e) => {
                                const selectedMem = groupMembers.find(m => m.id === e.target.value);
                                if (selectedMem) {
                                  handleUpdateRoomAllocation(idx, {
                                    guestName: selectedMem.name,
                                    guestPhone: selectedMem.phone || alloc.guestPhone
                                  });
                                }
                              }}
                              className="bg-slate-950 border border-purple-500/40 text-purple-300 rounded px-2 py-1 text-[11px] max-w-[130px]"
                            >
                              <option value="">Choose Member</option>
                              {groupMembers.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Occupant Phone</span>
                        <input
                          type="text"
                          value={alloc.guestPhone}
                          onChange={(e) => handleUpdateRoomAllocation(idx, { guestPhone: e.target.value })}
                          placeholder="+880 17XX XXXXXX"
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                        />
                      </div>
                    </div>

                    {/* Occupancy and Nightly Room Rate */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end pt-1 border-t border-slate-800/60">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Adults:</span>
                        <input
                          type="number"
                          min="1"
                          max="6"
                          value={alloc.adults}
                          onChange={(e) => handleUpdateRoomAllocation(idx, { adults: parseInt(e.target.value) || 1 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Children:</span>
                        <input
                          type="number"
                          min="0"
                          max="4"
                          value={alloc.children}
                          onChange={(e) => handleUpdateRoomAllocation(idx, { children: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-amber-300 block mb-0.5 font-semibold">
                          Rate / Night (৳ BDT):
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={alloc.rate}
                          onChange={(e) => handleUpdateRoomAllocation(idx, { rate: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-amber-500/50 rounded px-2 py-1 text-amber-300 font-mono font-bold"
                        />
                      </div>

                      <div className="bg-slate-950 p-2 rounded border border-slate-800 text-right">
                        <span className="text-[9px] text-slate-400 block">Room Total ({nights} nt)</span>
                        <span className="font-mono font-bold text-emerald-400 text-xs">
                          ৳{((alloc.rate || 0) * nights).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Multi-Room Cumulative Financial Summary Bar */}
            <div className="bg-slate-950 p-3 rounded-lg border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-amber-400 font-mono text-sm">{totalRoomsCount}</span>
                  <span className="text-slate-300 font-semibold">{totalRoomsCount === 1 ? 'Room' : 'Rooms'} Selected</span>
                </div>
                <span className="text-slate-600">•</span>
                <div className="text-slate-300">
                  <span className="font-mono font-bold text-slate-100">{totalAdults}</span> Adults
                  {totalChildren > 0 && <span>, <span className="font-mono font-bold text-slate-100">{totalChildren}</span> Children</span>}
                </div>
                <span className="text-slate-600">•</span>
                <div className="text-slate-400">
                  Nightly: <span className="font-mono font-bold text-slate-200">৳{totalNightlyRate.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Grand Total Estimated ({nights} {nights === 1 ? 'night' : 'nights'}):</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  ৳{totalEstimated.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Advance Deposit & Billing */}
          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>5. Financials, Deposit & Settlement</span>
              </span>
              <div className="text-right">
                <span className="text-[10px] text-slate-400">Payable Total: </span>
                <span className="font-mono font-bold text-amber-400 text-sm">৳{(totalEstimated || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Booking Source:</span>
                <select
                  value={bookingSource}
                  onChange={(e) => setBookingSource(e.target.value as BookingSourceType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                >
                  <option value="Phone / Direct">Phone / Direct Call</option>
                  <option value="Front Desk Walk-in">Front Desk Walk-in</option>
                  <option value="Corporate">Corporate / Member</option>
                  <option value="Website Engine">Website Direct Engine</option>
                  <option value="Booking.com">Booking.com (OTA)</option>
                  <option value="Agoda">Agoda (OTA)</option>
                  <option value="Travel Agent">Travel Agent</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Advance Deposit (৳ BDT):</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-emerald-500/50 rounded px-2.5 py-1.5 text-emerald-300 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Payment Method:</span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  disabled={depositAmount <= 0}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 disabled:opacity-50"
                >
                  <option value="Credit Card">Credit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Company Credit">Company Credit / City Ledger</option>
                </select>
              </div>
            </div>

            {depositAmount > 0 && (
              <div className="space-y-2 pt-1 border-t border-slate-800">
                {paymentMethod === 'Credit Card' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Card Option:</span>
                      <select
                        value={cardOption}
                        onChange={(e) => setCardOption(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 text-xs"
                      >
                        {SIMPLE_CARD_OPTIONS.map(opt => (
                          <option key={opt.id} value={opt.label}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Slip / Approval No (Optional):</span>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="e.g. SLIP-908129"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'Bank Transfer' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Transaction No:</span>
                      <input
                        type="text"
                        value={bankTxnNo}
                        onChange={(e) => setBankTxnNo(e.target.value)}
                        placeholder="e.g. TXN-98271049"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Trace No:</span>
                      <input
                        type="text"
                        value={bankTraceNo}
                        onChange={(e) => setBankTraceNo(e.target.value)}
                        placeholder="e.g. TRACE-08472"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod !== 'Credit Card' && paymentMethod !== 'Bank Transfer' && (
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Payment Reference:</span>
                    <input
                      type="text"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="e.g. BKASH-TXN-8849 / CASH-SETTLEMENT"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 text-xs font-mono"
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Special Requests & Booking Instructions:</span>
              <textarea
                rows={2}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="e.g. Connected rooms for group members, early check-in at 11 AM, corporate meeting refreshments"
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs placeholder-slate-600"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoPrintConfirmation}
              onChange={(e) => setAutoPrintConfirmation(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/20 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center space-x-1.5 font-medium">
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print Final Confirmation Letter upon booking</span>
            </span>
          </label>

          <div className="flex items-center space-x-2 self-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center space-x-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition-colors shadow-lg cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isGroupBooking || allocatedRooms.length > 1
                  ? `Confirm & Reserve ${allocatedRooms.length} Rooms`
                  : 'Confirm & Reserve Room'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
