import React, { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, Check, Sparkles, Building, Utensils,
  BedDouble, Mic, ShieldAlert, CheckCircle2, DollarSign,
  Calendar, Clock, User, Phone, Mail, FileText, ChevronRight,
  Image, Upload, Hash
} from 'lucide-react';
import { BanquetQuotation, Package, Hall, RoomType, MenuItem } from '../../types/pms';
import { pmsService } from '../../services/pmsService';

interface BanquetQuotationModalProps {
  initialQuotation?: BanquetQuotation | null;
  onClose: () => void;
  onSaved: (quotation: BanquetQuotation) => void;
}

type StepType = 'client_event' | 'venue' | 'catering' | 'rooms' | 'services' | 'financials';

export const BanquetQuotationModal: React.FC<BanquetQuotationModalProps> = ({
  initialQuotation,
  onClose,
  onSaved
}) => {
  const db = pmsService.getState();
  const availableHalls = db.halls || [];
  const availablePackages = db.packages || [];
  const availableRoomTypes = db.roomTypes || [];
  const availableMenuItems = db.menuItems || [];

  // Active step
  const [currentStep, setCurrentStep] = useState<StepType>('client_event');

  // Custom Serial Number & Property Branding Logo Override
  const [customSerialNo, setCustomSerialNo] = useState(
    initialQuotation?.customSerialNo || initialQuotation?.quotationNumber || ''
  );
  const [propertyLogoUrl, setPropertyLogoUrl] = useState(
    initialQuotation?.propertyLogoUrl !== undefined ? initialQuotation.propertyLogoUrl : (db.settings?.logoUrl || '')
  );

  // Step 1: Client & Event Particulars
  const [clientName, setClientName] = useState(initialQuotation?.clientName || '');
  const [clientCompany, setClientCompany] = useState(initialQuotation?.clientCompany || '');
  const [clientPhone, setClientPhone] = useState(initialQuotation?.clientPhone || '');
  const [clientEmail, setClientEmail] = useState(initialQuotation?.clientEmail || '');
  const [clientAddress, setClientAddress] = useState(initialQuotation?.clientAddress || '');

  const [eventName, setEventName] = useState(initialQuotation?.eventName || '');
  const [eventType, setEventType] = useState<BanquetQuotation['eventType']>(initialQuotation?.eventType || 'Corporate');
  const [eventDate, setEventDate] = useState(initialQuotation?.eventDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(initialQuotation?.startTime || '09:00');
  const [endTime, setEndTime] = useState(initialQuotation?.endTime || '17:00');
  const [guestCount, setGuestCount] = useState<number>(initialQuotation?.guestCount || 100);
  const [validUntil, setValidUntil] = useState(initialQuotation?.validUntil || new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]);

  // Optional linked package
  const [packageId, setPackageId] = useState<string>(initialQuotation?.packageId || '');

  // Step 2: Halls & Venues
  const [halls, setHalls] = useState<BanquetQuotation['halls']>(
    initialQuotation?.halls && initialQuotation.halls.length > 0
      ? initialQuotation.halls
      : (availableHalls[0] ? [{
          hallId: availableHalls[0].id,
          hallName: availableHalls[0].name,
          hallRate: availableHalls[0].baseRatePerDay,
          setupStyle: 'Banquet'
        }] : [])
  );

  // Step 3: Catering & Menu
  const [menuItems, setMenuItems] = useState<BanquetQuotation['menuItems']>(
    initialQuotation?.menuItems || []
  );
  const [menuPricePerPerson, setMenuPricePerPerson] = useState<number>(
    initialQuotation?.menuPricePerPerson || 1650
  );
  const [menuSearch, setMenuSearch] = useState('');
  const [menuFilterCat, setMenuFilterCat] = useState('All');

  // Step 4: Accommodation Rooms
  const [rooms, setRooms] = useState<BanquetQuotation['rooms']>(
    initialQuotation?.rooms || []
  );

  // Step 5: Additional Services
  const [additionalServices, setAdditionalServices] = useState<BanquetQuotation['additionalServices']>(
    initialQuotation?.additionalServices || [
      { id: 's-1', name: 'Standard Stage Lighting & Mic PA', category: 'Audio-Visual', rate: 8000, quantity: 1, total: 8000 },
      { id: 's-2', name: 'Banquet Floral Decor & Welcome Arch', category: 'Stage & Decor', rate: 12000, quantity: 1, total: 12000 }
    ]
  );
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<BanquetQuotation['additionalServices'][0]['category']>('Audio-Visual');
  const [newServiceRate, setNewServiceRate] = useState<number>(5000);
  const [newServiceQty, setNewServiceQty] = useState<number>(1);

  // Step 6: Taxes, Discounts, Notes
  const [discountPercent, setDiscountPercent] = useState<number>(initialQuotation?.discountPercent || 0);
  const [serviceChargePercent, setServiceChargePercent] = useState<number>(initialQuotation?.serviceChargePercent ?? (db.settings.serviceChargePercent || 10));
  const [taxPercent, setTaxPercent] = useState<number>(initialQuotation?.taxPercent ?? (db.settings.taxRatePercent || 15));
  const [notes, setNotes] = useState(initialQuotation?.notes || '');
  const [termsAndConditions, setTermsAndConditions] = useState(
    initialQuotation?.termsAndConditions ||
    '1. 30% advance booking deposit required to lock hall and room allocations.\n2. 50% payable 7 days prior to event; remaining 20% on event date before handover.\n3. Outside catering or AV equipment requires prior management clearance.'
  );

  const [errorMsg, setErrorMsg] = useState('');

  // Handle Preset Package Selection
  const handleApplyPackage = (pkgId: string) => {
    setPackageId(pkgId);
    if (!pkgId) return;
    const pkg = availablePackages.find(p => p.id === pkgId);
    if (!pkg) return;

    // Apply halls if package has halls
    if (pkg.selectedHalls && pkg.selectedHalls.length > 0) {
      setHalls(pkg.selectedHalls.map(h => ({
        hallId: h.hallId,
        hallName: h.hallName,
        hallRate: h.rentalRate,
        setupStyle: 'Banquet'
      })));
    }

    // Apply catering
    if (pkg.selectedMenuItems && pkg.selectedMenuItems.length > 0) {
      setMenuItems(pkg.selectedMenuItems.map(m => ({
        itemId: m.itemId,
        name: m.name,
        categoryName: m.categoryName,
        unitPrice: m.price
      })));
    }
    if (pkg.pricingModel === 'per_person') {
      setMenuPricePerPerson(pkg.price);
    }

    // Apply rooms
    if (pkg.selectedRooms && pkg.selectedRooms.length > 0) {
      setRooms(pkg.selectedRooms.map(r => ({
        roomTypeId: r.roomTypeId,
        roomTypeName: r.roomTypeName,
        roomCount: r.count,
        nights: r.nights,
        ratePerNight: r.ratePerNight,
        totalAmount: r.count * r.nights * r.ratePerNight
      })));
    }

    // Apply custom services
    if (pkg.customServices && pkg.customServices.length > 0) {
      setAdditionalServices(pkg.customServices.map((cs, idx) => ({
        id: `cs-pkg-${idx}`,
        name: cs.name,
        category: 'Other',
        rate: cs.cost,
        quantity: 1,
        total: cs.cost
      })));
    }
  };

  // Hall helpers
  const handleToggleHall = (hall: Hall) => {
    const exists = halls.some(h => h.hallId === hall.id);
    if (exists) {
      setHalls(halls.filter(h => h.hallId !== hall.id));
    } else {
      setHalls([...halls, {
        hallId: hall.id,
        hallName: hall.name,
        hallRate: hall.baseRatePerDay,
        setupStyle: 'Banquet'
      }]);
    }
  };

  const handleUpdateHallStyle = (hallId: string, setupStyle: any) => {
    setHalls(halls.map(h => h.hallId === hallId ? { ...h, setupStyle } : h));
  };

  const handleUpdateHallRate = (hallId: string, hallRate: number) => {
    setHalls(halls.map(h => h.hallId === hallId ? { ...h, hallRate: Math.max(0, hallRate) } : h));
  };

  // Menu item toggle
  const handleToggleMenuItem = (item: MenuItem) => {
    const exists = menuItems.some(m => m.itemId === item.id);
    if (exists) {
      setMenuItems(menuItems.filter(m => m.itemId !== item.id));
    } else {
      setMenuItems([...menuItems, {
        itemId: item.id,
        name: item.name,
        categoryName: item.categoryName || 'General',
        unitPrice: item.price || 0
      }]);
    }
  };

  // Room helpers
  const handleAddRoomType = (rtId: string) => {
    const rt = availableRoomTypes.find(r => r.id === rtId);
    if (!rt) return;
    if (rooms.some(r => r.roomTypeId === rtId)) return;
    setRooms([...rooms, {
      roomTypeId: rt.id,
      roomTypeName: rt.name,
      roomCount: 2,
      nights: 1,
      ratePerNight: rt.baseRate || rt.basePrice || 4500,
      totalAmount: 2 * 1 * (rt.baseRate || rt.basePrice || 4500)
    }]);
  };

  const handleUpdateRoom = (idx: number, field: 'roomCount' | 'nights' | 'ratePerNight', val: number) => {
    const updated = [...rooms];
    const item = { ...updated[idx], [field]: Math.max(0, val) };
    item.totalAmount = item.roomCount * item.nights * item.ratePerNight;
    updated[idx] = item;
    setRooms(updated);
  };

  const handleRemoveRoom = (idx: number) => {
    setRooms(rooms.filter((_, i) => i !== idx));
  };

  // Additional Services helpers
  const handleAddService = () => {
    if (!newServiceName.trim()) return;
    const qty = Math.max(1, newServiceQty);
    const rate = Math.max(0, newServiceRate);
    setAdditionalServices([...additionalServices, {
      id: `s-${Date.now()}`,
      name: newServiceName.trim(),
      category: newServiceCategory,
      rate,
      quantity: qty,
      total: rate * qty
    }]);
    setNewServiceName('');
    setNewServiceRate(5000);
    setNewServiceQty(1);
  };

  const handleRemoveService = (idx: number) => {
    setAdditionalServices(additionalServices.filter((_, i) => i !== idx));
  };

  // FINANCIAL TOTALS CALCULATION
  const hallTotal = halls.reduce((sum, h) => sum + (h.hallRate || 0), 0);
  const cateringTotal = guestCount * menuPricePerPerson;
  const roomTotal = rooms.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const servicesTotal = additionalServices.reduce((sum, s) => sum + (s.total || 0), 0);

  const subtotal = hallTotal + cateringTotal + roomTotal + servicesTotal;
  const discountAmount = Math.round((subtotal * (discountPercent || 0)) / 100);
  const afterDiscount = Math.max(0, subtotal - discountAmount);

  const serviceChargeAmount = Math.round((afterDiscount * (serviceChargePercent || 0)) / 100);
  const taxAmount = Math.round(((afterDiscount + serviceChargeAmount) * (taxPercent || 0)) / 100);
  const grandTotal = afterDiscount + serviceChargeAmount + taxAmount;
  const depositRequired = Math.round(grandTotal * 0.3);

  // Validation & Save
  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!clientName.trim()) {
      setErrorMsg('Client Name is required.');
      setCurrentStep('client_event');
      return;
    }
    if (!clientPhone.trim()) {
      setErrorMsg('Client Phone Number is required.');
      setCurrentStep('client_event');
      return;
    }
    if (!eventName.trim()) {
      setErrorMsg('Event Name / Subject is required.');
      setCurrentStep('client_event');
      return;
    }
    if (halls.length === 0) {
      setErrorMsg('Please select at least one convention venue / hall.');
      setCurrentStep('venue');
      return;
    }

    try {
      const saved = pmsService.saveQuotation({
        id: initialQuotation?.id,
        customSerialNo: customSerialNo.trim() || undefined,
        propertyLogoUrl: propertyLogoUrl.trim() || undefined,
        clientName: clientName.trim(),
        clientCompany: clientCompany.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        clientAddress: clientAddress.trim(),
        eventName: eventName.trim(),
        eventType,
        eventDate,
        startTime,
        endTime,
        guestCount,
        packageId: packageId || undefined,
        packageName: availablePackages.find(p => p.id === packageId)?.name,
        isCustomPackage: !packageId || availablePackages.find(p => p.id === packageId)?.packageType === 'Custom',
        halls,
        rooms,
        menuItems,
        menuPricePerPerson,
        cateringTotal,
        additionalServices,
        hallTotal,
        roomTotal,
        servicesTotal,
        subtotal,
        discountPercent,
        discountAmount,
        serviceChargePercent,
        serviceChargeAmount,
        taxPercent,
        taxAmount,
        grandTotal,
        depositRequired,
        validUntil,
        notes,
        termsAndConditions,
        status: initialQuotation?.status || 'Draft'
      });

      onSaved(saved);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating quotation.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 text-xs">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center border border-purple-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-100">
                  {initialQuotation ? `Edit Quotation ${initialQuotation.quotationNumber}` : 'Create Guest Event Quotation (Pro-Forma)'}
                </h2>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px]">
                  Banquet & Convention Quotation Generator
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Customize menu dishes, venue halls, room blocks, audio-visual gear, and discount structures into a formal proposal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-300">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Steps Breadcrumbs */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-950 flex space-x-2 sm:space-x-4 overflow-x-auto">
          {[
            { key: 'client_event', label: '1. Client & Event', icon: User },
            { key: 'venue', label: `2. Halls (${halls.length})`, icon: Building },
            { key: 'catering', label: `3. Catering (${menuItems.length})`, icon: Utensils },
            { key: 'rooms', label: `4. Rooms (${rooms.length})`, icon: BedDouble },
            { key: 'services', label: `5. Services (${additionalServices.length})`, icon: Mic },
            { key: 'financials', label: '6. Pricing & Terms', icon: DollarSign }
          ].map(step => {
            const Icon = step.icon;
            const isActive = currentStep === step.key;
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => setCurrentStep(step.key as any)}
                className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* STEP 1: CLIENT & EVENT PARTICULARS */}
          {currentStep === 'client_event' && (
            <div className="space-y-4">
              {/* Optional Package Loader */}
              <div className="p-3.5 bg-purple-950/20 border border-purple-800/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-purple-300">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-semibold text-xs">Load from Template Package (Optional):</span>
                </div>
                <select
                  value={packageId}
                  onChange={e => handleApplyPackage(e.target.value)}
                  className="bg-slate-900 border border-purple-700/60 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-purple-400"
                >
                  <option value="">-- Start with Blank Custom Quotation --</option>
                  {availablePackages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.packageType}) - ৳{pkg.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Identification & Property Branding (Serial Number & Logo) */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-amber-400" />
                    <span>Quotation Identification & Property Branding</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Printed on generated PDF proposal</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Special Serial Number */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs">
                      Special Serial Number / Quotation Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. QTN-2026-VIP-001 (Leave blank to auto-generate)"
                      value={customSerialNo}
                      onChange={e => setCustomSerialNo(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Assign a personalized serial number for this client quotation.
                    </span>
                  </div>

                  {/* Customer / Property Logo Upload */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-300 font-semibold text-xs flex items-center space-x-1.5">
                        <Image className="w-3.5 h-3.5 text-amber-400" />
                        <span>Property / Customer Logo</span>
                      </label>
                      {propertyLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setPropertyLogoUrl('')}
                          className="text-[10px] text-rose-400 hover:text-rose-300"
                        >
                          Clear Logo
                        </button>
                      )}
                    </div>
                    <div className="flex items-center space-x-2.5">
                      {propertyLogoUrl ? (
                        <div className="w-14 h-10 rounded-lg bg-white p-1 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                          <img src={propertyLogoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-14 h-10 rounded-lg bg-slate-900 border border-dashed border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                          <Building className="w-4 h-4 opacity-40" />
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          placeholder="Logo image URL or upload image file"
                          value={propertyLogoUrl}
                          onChange={e => setPropertyLogoUrl(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-mono placeholder:text-slate-600"
                        />
                        <label className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-medium cursor-pointer transition-colors">
                          <Upload className="w-3 h-3 text-amber-400" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = uploadEvent => {
                                  if (typeof uploadEvent.target?.result === 'string') {
                                    setPropertyLogoUrl(uploadEvent.target.result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider flex items-center space-x-2">
                  <User className="w-4 h-4 text-purple-400" />
                  <span>Client & Organization Particulars</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Client Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Engr. Subrata Roy"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +880 1711-000000"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="client@corporate.com"
                      value={clientEmail}
                      onChange={e => setClientEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Company / Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. Grameenphone / CCULB Corporate"
                      value={clientCompany}
                      onChange={e => setClientCompany(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Billing Address</label>
                    <input
                      type="text"
                      placeholder="Dhaka, Bangladesh"
                      value={clientAddress}
                      onChange={e => setClientAddress(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Event Schedule & Pax */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>Event Schedule & Specifications</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Event Title / Occasion <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Annual Strategic Conference 2026"
                      value={eventName}
                      onChange={e => setEventName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Event Category</label>
                    <select
                      value={eventType}
                      onChange={e => setEventType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                    >
                      <option value="Corporate">Corporate Symposium / Conference</option>
                      <option value="Wedding">Wedding Reception / Walima</option>
                      <option value="Conference">International Conference</option>
                      <option value="Banquet">Annual Gala Dinner & Awards</option>
                      <option value="Meeting">Executive Board Meeting</option>
                      <option value="Other">Social Gathering / Milestone</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Event Date</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Time (Start - End)</label>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="time"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        className="w-1/2 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-100 font-mono text-xs"
                      />
                      <span className="text-slate-500">-</span>
                      <input
                        type="time"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        className="w-1/2 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-100 font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Expected Guests (Pax)</label>
                    <input
                      type="number"
                      min={1}
                      value={guestCount}
                      onChange={e => setGuestCount(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Quotation Valid Until</label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={e => setValidUntil(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: VENUES & HALLS */}
          {currentStep === 'venue' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Venue Halls & Seating Layout</h3>
                  <p className="text-slate-400 text-[11px]">Select convention halls and assign seating configurations.</p>
                </div>
                <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 font-mono rounded-lg text-xs font-semibold">
                  Hall Total: ৳{hallTotal.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableHalls.map(hall => {
                  const selectedHall = halls.find(h => h.hallId === hall.id);
                  const isSelected = !!selectedHall;
                  return (
                    <div
                      key={hall.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-purple-950/30 border-purple-500 shadow-sm'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          onClick={() => handleToggleHall(hall)}
                          className="flex items-center space-x-2.5 cursor-pointer"
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isSelected ? 'bg-purple-600 border-purple-500 text-white' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-100 text-xs block">{hall.name}</span>
                            <span className="text-[10px] text-slate-400">Capacity: {hall.capacity} Pax • Floor: {hall.floor || 'Ground'}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-purple-300 text-xs block">
                            ৳{(selectedHall?.hallRate ?? hall.baseRatePerDay).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500">Venue Rent</span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Seating Style</label>
                            <select
                              value={selectedHall.setupStyle || 'Banquet'}
                              onChange={e => handleUpdateHallStyle(hall.id, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                            >
                              <option value="Banquet">Banquet Style (Rounds of 8-10)</option>
                              <option value="Theatre">Theatre / Auditorium</option>
                              <option value="Classroom">Classroom / Training</option>
                              <option value="U-Shape">U-Shape VIP Setup</option>
                              <option value="Boardroom">Boardroom Conference</option>
                              <option value="Cocktail / Standing">Cocktail / Standing</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Quoted Rate (৳)</label>
                            <input
                              type="number"
                              min={0}
                              value={selectedHall.hallRate}
                              onChange={e => handleUpdateHallRate(hall.id, Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: CATERING & MENU */}
          {currentStep === 'catering' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Catering Package & Menu Customization</h3>
                  <p className="text-slate-400 text-[11px]">Select included food courses and set per-guest catering rate.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <label className="text-[10px] text-slate-400 block">Rate / Pax (৳):</label>
                    <input
                      type="number"
                      min={0}
                      value={menuPricePerPerson}
                      onChange={e => setMenuPricePerPerson(Number(e.target.value))}
                      className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right font-mono font-bold text-purple-300 text-xs"
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Catering Total:</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">৳{cateringTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Dish Search & Category Filters */}
              <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <input
                  type="text"
                  placeholder="Search dishes to add to this quotation menu..."
                  value={menuSearch}
                  onChange={e => setMenuSearch(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 text-xs"
                />
                <select
                  value={menuFilterCat}
                  onChange={e => setMenuFilterCat(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                >
                  <option value="All">All Food Categories</option>
                  {Array.from(new Set(availableMenuItems.map(m => m.categoryName || 'General'))).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Selected Dishes Summary Bar */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="font-semibold text-slate-300 block mb-2">
                  Included in Quotation Menu ({menuItems.length} items):
                </span>
                {menuItems.length === 0 ? (
                  <span className="text-slate-500 text-[11px]">No items selected yet. Click dishes below to add.</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {menuItems.map(m => (
                      <span
                        key={m.itemId}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800 text-purple-200 text-xs"
                      >
                        <span>{m.name}</span>
                        <button
                          type="button"
                          onClick={() => setMenuItems(menuItems.filter(x => x.itemId !== m.itemId))}
                          className="hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Dishes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
                {availableMenuItems
                  .filter(m => {
                    const matchSearch = m.name.toLowerCase().includes(menuSearch.toLowerCase());
                    const matchCat = menuFilterCat === 'All' || (m.categoryName || 'General') === menuFilterCat;
                    return matchSearch && matchCat;
                  })
                  .map(item => {
                    const isSelected = menuItems.some(m => m.itemId === item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleMenuItem(item)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-950/40 border-purple-500 text-slate-100'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected ? 'bg-purple-600 border-purple-500 text-white' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <span className="font-semibold block leading-tight">{item.name}</span>
                            <span className="text-[10px] text-slate-500">{item.categoryName || 'General'}</span>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-400">
                          ৳{(item.price || 0).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* STEP 4: ROOMS ACCOMMODATION */}
          {currentStep === 'rooms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Guest Room Allocation & Room Blocks</h3>
                  <p className="text-slate-400 text-[11px]">Include guest accommodations, VIP organizer rooms, or residential delegate blocks.</p>
                </div>
                <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 font-mono rounded-lg text-xs font-semibold">
                  Rooms Total: ৳{roomTotal.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <label className="text-slate-300 font-semibold shrink-0">Add Room Category:</label>
                <select
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                  onChange={e => {
                    if (e.target.value) {
                      handleAddRoomType(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Select room category to add...</option>
                  {availableRoomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} (Base ৳{(rt.baseRate || rt.basePrice || 4500).toLocaleString()}/night)
                    </option>
                  ))}
                </select>
              </div>

              {rooms.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-500">
                  No rooms included. If delegates or organizers require overnight stay, select room categories above.
                </div>
              ) : (
                <div className="space-y-2">
                  {rooms.map((rm, idx) => (
                    <div key={rm.roomTypeId} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-slate-100 text-sm">{rm.roomTypeName}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Quoted Rate: ৳{rm.ratePerNight.toLocaleString()} / night
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-400 text-[11px]">Rooms:</span>
                          <input
                            type="number"
                            min={1}
                            value={rm.roomCount}
                            onChange={e => handleUpdateRoom(idx, 'roomCount', Number(e.target.value))}
                            className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-slate-100 text-xs"
                          />
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-400 text-[11px]">Nights:</span>
                          <input
                            type="number"
                            min={1}
                            value={rm.nights}
                            onChange={e => handleUpdateRoom(idx, 'nights', Number(e.target.value))}
                            className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-slate-100 text-xs"
                          />
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-400 text-[11px]">Rate:</span>
                          <input
                            type="number"
                            min={0}
                            value={rm.ratePerNight}
                            onChange={e => handleUpdateRoom(idx, 'ratePerNight', Number(e.target.value))}
                            className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right font-mono text-slate-100 text-xs"
                          />
                        </div>

                        <div className="font-mono font-bold text-slate-200 text-xs w-24 text-right">
                          ৳{rm.totalAmount.toLocaleString()}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveRoom(idx)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: ADDITIONAL SERVICES */}
          {currentStep === 'services' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">AV, Production & Special Services</h3>
                  <p className="text-slate-400 text-[11px]">Microphones, LED screens, floral gates, photography, and protocol.</p>
                </div>
                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-mono rounded-lg text-xs font-semibold">
                  Services Total: ৳{servicesTotal.toLocaleString()}
                </span>
              </div>

              {/* Add form */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Service Name (e.g. 4K Video Recording, Sound System)..."
                    value={newServiceName}
                    onChange={e => setNewServiceName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 text-xs"
                  />
                </div>
                <div>
                  <select
                    value={newServiceCategory}
                    onChange={e => setNewServiceCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
                  >
                    <option value="Audio-Visual">Audio-Visual</option>
                    <option value="Stage & Decor">Stage & Decor</option>
                    <option value="Photography">Photography</option>
                    <option value="Special Lighting">Special Lighting</option>
                    <option value="Manpower & Protocol">Manpower & Protocol</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    min={0}
                    placeholder="Rate (৳)"
                    value={newServiceRate}
                    onChange={e => setNewServiceRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold flex items-center justify-center space-x-1 transition-colors text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {additionalServices.map((sc, idx) => (
                  <div key={sc.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200">{sc.name}</span>
                      <span className="text-slate-500 text-[10px] block">{sc.category} • Rate: ৳{sc.rate.toLocaleString()} x {sc.quantity}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-mono font-bold text-amber-300">৳{sc.total.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: PRICING BREAKDOWN & TERMS */}
          {currentStep === 'financials' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cost Summary Breakdown */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider">
                    Itemized Cost Breakdown
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Venue & Hall Hire ({halls.length} Hall):</span>
                      <span className="font-mono text-slate-200 font-bold">৳{hallTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Catering ({guestCount} Pax @ ৳{menuPricePerPerson}):</span>
                      <span className="font-mono text-slate-200 font-bold">৳{cateringTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Accommodation Rooms ({rooms.length} Types):</span>
                      <span className="font-mono text-slate-200 font-bold">৳{roomTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Audio-Visual & Decor Services:</span>
                      <span className="font-mono text-slate-200 font-bold">৳{servicesTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-700 text-slate-200 font-semibold">
                      <span>Gross Subtotal:</span>
                      <span className="font-mono font-bold">৳{subtotal.toLocaleString()}</span>
                    </div>

                    {/* Discount & Taxes */}
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">Special Discount:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={discountPercent}
                          onChange={e => setDiscountPercent(Number(e.target.value))}
                          className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center font-mono text-xs text-rose-300"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                      <span className="font-mono text-rose-400 font-semibold">-৳{discountAmount.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">Service Charge:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={serviceChargePercent}
                          onChange={e => setServiceChargePercent(Number(e.target.value))}
                          className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center font-mono text-xs text-slate-200"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                      <span className="font-mono text-slate-300">+৳{serviceChargeAmount.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">VAT / Tax:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={taxPercent}
                          onChange={e => setTaxPercent(Number(e.target.value))}
                          className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center font-mono text-xs text-slate-200"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                      <span className="font-mono text-slate-300">+৳{taxAmount.toLocaleString()}</span>
                    </div>

                    <div className="pt-2 border-t-2 border-purple-500/40 flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-100">Estimated Grand Total:</span>
                      <span className="font-mono font-black text-purple-400 text-base">৳{grandTotal.toLocaleString()}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 flex justify-between items-center text-xs">
                      <span className="text-emerald-300 font-semibold">Recommended Advance Deposit (30%):</span>
                      <span className="font-mono font-bold text-emerald-400">৳{depositRequired.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Notes & Terms */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider">
                    Special Notes & Quotation Terms
                  </h3>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Internal Sales Notes / Client Special Requests</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Client requested elevated VIP stage and halal certified meat menu verification..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Standard Terms & Conditions</label>
                    <textarea
                      rows={5}
                      value={termsAndConditions}
                      onChange={e => setTermsAndConditions(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation & Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 font-mono text-xs">
            <span className="text-slate-400">Total Pax: <strong className="text-slate-200">{guestCount}</strong></span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Estimated Total: <strong className="text-purple-400 font-bold">৳{grandTotal.toLocaleString()}</strong></span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-colors text-xs"
            >
              Cancel
            </button>

            {currentStep !== 'financials' ? (
              <button
                type="button"
                onClick={() => {
                  const steps: StepType[] = ['client_event', 'venue', 'catering', 'rooms', 'services', 'financials'];
                  const nextIdx = steps.indexOf(currentStep) + 1;
                  if (nextIdx < steps.length) setCurrentStep(steps[nextIdx]);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold flex items-center space-x-1.5 transition-colors text-xs"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleSaveQuotation}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-600/30 flex items-center space-x-1.5 transition-colors text-xs"
            >
              <Check className="w-4 h-4" />
              <span>{initialQuotation ? 'Update Quotation' : 'Generate & Save Quotation'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
