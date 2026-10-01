import React, { useState } from 'react';
import {
  X, Plus, Trash2, Check, Sparkles, Building, Utensils,
  BedDouble, Mic, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { Package, Hall, RoomType, MenuItem } from '../../types/pms';
import { pmsService } from '../../services/pmsService';

interface CustomPackageModalProps {
  initialPackage?: Package | null;
  onClose: () => void;
  onSaved: (pkg: Package) => void;
}

export const CustomPackageModal: React.FC<CustomPackageModalProps> = ({
  initialPackage,
  onClose,
  onSaved
}) => {
  const db = pmsService.getState();
  const availableHalls = db.halls || [];
  const availableRoomTypes = db.roomTypes || [];
  const availableMenuItems = db.menuItems || [];

  // Basic Info
  const [name, setName] = useState(initialPackage?.name || '');
  const [description, setDescription] = useState(initialPackage?.description || '');
  const [packageType, setPackageType] = useState<Package['packageType']>(initialPackage?.packageType || 'Custom');
  const [pricingModel, setPricingModel] = useState<'per_person' | 'fixed_package' | 'per_day'>(
    initialPackage?.pricingModel || 'per_person'
  );
  const [basePrice, setBasePrice] = useState<number>(initialPackage?.price || 1850);
  const [minGuests, setMinGuests] = useState<number>(initialPackage?.minGuests || 50);
  const [maxGuests, setMaxGuests] = useState<number>(initialPackage?.maxGuests || 500);

  // Inclusions checklist
  const [inclusions, setInclusions] = useState<string[]>(
    initialPackage?.includes && initialPackage.includes.length > 0
      ? initialPackage.includes
      : [
          'Dedicated Event Concierge & Floor Lead',
          'Standard Podium, Microphone & PA System',
          'Custom Stage Backdrop Frame & Lighting',
          'Complimentary High-Speed Guest Wi-Fi',
          'Table Centerpieces and Banquet Linen'
        ]
  );
  const [newInclusion, setNewInclusion] = useState('');

  // Selected Venues / Halls
  const [selectedHalls, setSelectedHalls] = useState<{ hallId: string; hallName: string; rentalRate: number }[]>(
    initialPackage?.selectedHalls || (availableHalls[0] ? [{
      hallId: availableHalls[0].id,
      hallName: availableHalls[0].name,
      rentalRate: availableHalls[0].baseRatePerDay
    }] : [])
  );

  // Selected Accommodation Rooms
  const [selectedRooms, setSelectedRooms] = useState<{ roomTypeId: string; roomTypeName: string; count: number; ratePerNight: number; nights: number }[]>(
    initialPackage?.selectedRooms || []
  );

  // Selected Menu Items
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>(
    (initialPackage?.selectedMenuItems || []).map(m => m.itemId)
  );

  // Custom Extra Services
  const [customServices, setCustomServices] = useState<{ name: string; cost: number; description?: string }[]>(
    initialPackage?.customServices || [
      { name: 'Multimedia LED Wall (10x8 ft)', cost: 15000, description: 'Ultra-HD indoor projection' },
      { name: 'Floral Gate & Stage Welcome Decor', cost: 12000, description: 'Fresh seasonal floral arrangement' }
    ]
  );
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCost, setNewServiceCost] = useState(5000);

  const [activeTab, setActiveTab] = useState<'overview' | 'venues' | 'menu' | 'rooms' | 'services'>('overview');
  const [menuSearch, setMenuSearch] = useState('');
  const [menuFilterCat, setMenuFilterCat] = useState('All');
  const [errorMsg, setErrorMsg] = useState('');

  // Helpers for Inclusions
  const handleAddInclusion = () => {
    if (!newInclusion.trim()) return;
    setInclusions([...inclusions, newInclusion.trim()]);
    setNewInclusion('');
  };

  const handleRemoveInclusion = (idx: number) => {
    setInclusions(inclusions.filter((_, i) => i !== idx));
  };

  // Helpers for Halls
  const toggleHall = (hall: Hall) => {
    const exists = selectedHalls.some(h => h.hallId === hall.id);
    if (exists) {
      setSelectedHalls(selectedHalls.filter(h => h.hallId !== hall.id));
    } else {
      setSelectedHalls([...selectedHalls, {
        hallId: hall.id,
        hallName: hall.name,
        rentalRate: hall.baseRatePerDay
      }]);
    }
  };

  // Helpers for Rooms
  const handleAddRoomType = (rtId: string) => {
    const rt = availableRoomTypes.find(r => r.id === rtId);
    if (!rt) return;
    if (selectedRooms.some(r => r.roomTypeId === rtId)) return;
    setSelectedRooms([...selectedRooms, {
      roomTypeId: rt.id,
      roomTypeName: rt.name,
      count: 2,
      ratePerNight: rt.baseRate || rt.basePrice || 4500,
      nights: 1
    }]);
  };

  const handleUpdateRoom = (idx: number, field: 'count' | 'nights' | 'ratePerNight', val: number) => {
    const updated = [...selectedRooms];
    updated[idx] = { ...updated[idx], [field]: Math.max(0, val) };
    setSelectedRooms(updated);
  };

  const handleRemoveRoom = (idx: number) => {
    setSelectedRooms(selectedRooms.filter((_, i) => i !== idx));
  };

  // Helpers for Menu
  const toggleMenuItem = (item: MenuItem) => {
    if (selectedMenuIds.includes(item.id)) {
      setSelectedMenuIds(selectedMenuIds.filter(id => id !== item.id));
    } else {
      setSelectedMenuIds([...selectedMenuIds, item.id]);
    }
  };

  // Helpers for Extra Services
  const handleAddService = () => {
    if (!newServiceName.trim()) return;
    setCustomServices([...customServices, {
      name: newServiceName.trim(),
      cost: Number(newServiceCost) || 0
    }]);
    setNewServiceName('');
    setNewServiceCost(5000);
  };

  const handleRemoveService = (idx: number) => {
    setCustomServices(customServices.filter((_, i) => i !== idx));
  };

  // Estimated Package Value calculation
  const totalHallRent = selectedHalls.reduce((s, h) => s + h.rentalRate, 0);
  const totalRoomCost = selectedRooms.reduce((s, r) => s + (r.count * r.nights * r.ratePerNight), 0);
  const totalServicesCost = customServices.reduce((s, sc) => s + sc.cost, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter a package title / name.');
      setActiveTab('overview');
      return;
    }

    if (basePrice <= 0) {
      setErrorMsg('Please enter a valid package rate.');
      setActiveTab('overview');
      return;
    }

    const selectedMenuItemsData = availableMenuItems
      .filter(m => selectedMenuIds.includes(m.id))
      .map(m => ({
        itemId: m.id,
        name: m.name,
        categoryName: m.categoryName || 'General',
        price: m.price || 0
      }));

    try {
      const saved = pmsService.saveCustomPackage({
        id: initialPackage?.id,
        name: name.trim(),
        description: description.trim() || 'Custom tailored event package with venue, catering, and accommodation.',
        packageType,
        price: basePrice,
        active: true,
        includes: inclusions,
        nightsCount: selectedRooms.reduce((max, r) => Math.max(max, r.nights), 0),
        pricingModel,
        minGuests,
        maxGuests,
        selectedHalls,
        selectedRooms,
        selectedMenuItems: selectedMenuItemsData,
        customServices
      });

      onSaved(saved);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save custom package.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 text-xs">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {initialPackage ? 'Edit Custom Banquet Package' : 'Create Custom Banquet & Convention Package'}
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Configure tailored package pricing, venue halls, catering menu items, room allocations, and special services.
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

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-950 flex space-x-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1. Package Info & Inclusions</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('venues')}
            className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeTab === 'venues'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>2. Venue Halls ({selectedHalls.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeTab === 'menu'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>3. Menu Items ({selectedMenuIds.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rooms')}
            className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeTab === 'rooms'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BedDouble className="w-3.5 h-3.5" />
            <span>4. Rooms & Suites ({selectedRooms.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeTab === 'services'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>5. AV & Special Services ({customServices.length})</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: OVERVIEW & INCLUSIONS */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Package Name / Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Executive Corporate Symposium Package"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Package Type</label>
                  <select
                    value={packageType}
                    onChange={e => setPackageType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 text-xs"
                  >
                    <option value="Custom">Custom Tailored Event</option>
                    <option value="Corporate">Corporate Conference / AGM</option>
                    <option value="Event">Wedding & Social Reception</option>
                    <option value="Family">Family Reunion / Milestone</option>
                    <option value="Honeymoon">Honeymoon & VIP Suite</option>
                    <option value="Weekend">Weekend Residential Retreat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description / Event Scope</label>
                <textarea
                  rows={2}
                  placeholder="Detail the target audience, theme, audio-visual capabilities, and hospitality inclusions..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>

              {/* Pricing Model & Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Pricing Model</label>
                  <select
                    value={pricingModel}
                    onChange={e => setPricingModel(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
                  >
                    <option value="per_person">Per Person / Per Pax (৳)</option>
                    <option value="fixed_package">Fixed Flat Package Rate (৳)</option>
                    <option value="per_day">Per Day Rate (৳)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Base Rate (৳) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-purple-400 font-bold">৳</span>
                    <input
                      type="number"
                      min={0}
                      value={basePrice}
                      onChange={e => setBasePrice(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {pricingModel === 'per_person' ? 'Cost per attending guest' : 'Total lump sum base package'}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Capacity Range (Min - Max Pax)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="Min"
                      value={minGuests}
                      onChange={e => setMinGuests(Number(e.target.value))}
                      className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs"
                    />
                    <span className="text-slate-500">-</span>
                    <input
                      type="number"
                      min={minGuests}
                      placeholder="Max"
                      value={maxGuests}
                      onChange={e => setMaxGuests(Number(e.target.value))}
                      className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Standard Inclusions */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Package Inclusions & Features ({inclusions.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-slate-950 rounded-xl border border-slate-800">
                  {inclusions.map((inc, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                      <div className="flex items-center space-x-2 text-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{inc}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveInclusion(idx)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add another amenity, equipment or service inclusion..."
                      value={newInclusion}
                      onChange={e => setNewInclusion(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddInclusion(); } }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddInclusion}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold flex items-center space-x-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VENUES & HALLS */}
          {activeTab === 'venues' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Select Included Convention Venues</h3>
                  <p className="text-slate-400 text-[11px]">Select which banquet halls or boardrooms form part of this package bundle.</p>
                </div>
                <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 font-mono rounded-lg text-xs font-semibold">
                  {selectedHalls.length} Hall(s) Selected • ৳{totalHallRent.toLocaleString()} Total Rent
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableHalls.map(hall => {
                  const isSelected = selectedHalls.some(h => h.hallId === hall.id);
                  return (
                    <div
                      key={hall.id}
                      onClick={() => toggleHall(hall)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'bg-purple-950/30 border-purple-500 shadow-sm'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isSelected ? 'bg-purple-600 border-purple-500 text-white' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span className="font-bold text-slate-100">{hall.name}</span>
                        </div>
                        <span className="font-mono font-bold text-purple-300">
                          ৳{(hall.baseRatePerDay || 0).toLocaleString()}
                          <span className="text-[10px] text-slate-500 font-normal block text-right">/ day</span>
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center space-x-3">
                        <span>Capacity: <strong className="text-slate-200">{hall.capacity} Pax</strong></span>
                        <span>Floor: <strong className="text-slate-200">{hall.floor || 'Ground'}</strong></span>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {hall.amenities.slice(0, 3).map((am, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {am}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: MENU ITEMS */}
          {activeTab === 'menu' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Package Catering & Menu Selection</h3>
                  <p className="text-slate-400 text-[11px]">Select which appetizer, main dish, salad, dessert, or beverage items are bundled.</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-mono rounded-lg text-xs font-semibold">
                  {selectedMenuIds.length} Dishes Selected
                </span>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <input
                  type="text"
                  placeholder="Search dishes (e.g. Kacchi, Chicken, Fish, Salad, Dessert)..."
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

              {/* Menu Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto p-1">
                {availableMenuItems
                  .filter(m => {
                    const matchSearch = m.name.toLowerCase().includes(menuSearch.toLowerCase());
                    const matchCat = menuFilterCat === 'All' || (m.categoryName || 'General') === menuFilterCat;
                    return matchSearch && matchCat;
                  })
                  .map(item => {
                    const isSelected = selectedMenuIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleMenuItem(item)}
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
                            <span className="text-[10px] text-slate-500">{item.categoryName || 'Special'}</span>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-300">
                          ৳{(item.price || 0).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 4: ROOMS & SUITES */}
          {activeTab === 'rooms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Residential Accommodation Allocation</h3>
                  <p className="text-slate-400 text-[11px]">Bundle guest rooms (e.g. VIP suite for organizers, delegates block).</p>
                </div>
                <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 font-mono rounded-lg text-xs font-semibold">
                  ৳{totalRoomCost.toLocaleString()} Total Room Cost
                </span>
              </div>

              <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <label className="text-slate-300 font-semibold shrink-0">Add Room Category:</label>
                <select
                  id="select-room-type"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                  onChange={e => {
                    if (e.target.value) {
                      handleAddRoomType(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Choose a room category to include...</option>
                  {availableRoomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} (Base ৳{(rt.baseRate || rt.basePrice || 4500).toLocaleString()}/night)
                    </option>
                  ))}
                </select>
              </div>

              {selectedRooms.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-500">
                  No guest rooms currently bundled in this package. Add VIP suites or group rooms above if applicable.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedRooms.map((rm, idx) => (
                    <div key={rm.roomTypeId} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-slate-100 text-sm">{rm.roomTypeName}</span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Standard Nightly Rate: ৳{rm.ratePerNight.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-400 text-[11px]">Rooms:</span>
                          <input
                            type="number"
                            min={1}
                            value={rm.count}
                            onChange={e => handleUpdateRoom(idx, 'count', Number(e.target.value))}
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

                        <div className="font-mono font-bold text-slate-200 text-xs w-28 text-right">
                          ৳{(rm.count * rm.nights * rm.ratePerNight).toLocaleString()}
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

          {/* TAB 5: AV & SPECIAL SERVICES */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Audio-Visual, Decor & Special Services</h3>
                  <p className="text-slate-400 text-[11px]">Specify sound systems, staging, LED walls, or VIP protocol inclusions.</p>
                </div>
                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-mono rounded-lg text-xs font-semibold">
                  ৳{totalServicesCost.toLocaleString()} Services Total
                </span>
              </div>

              {/* Add service form */}
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <input
                  type="text"
                  placeholder="Service Name (e.g. Drone Videography, Translation Booth, Red Carpet)..."
                  value={newServiceName}
                  onChange={e => setNewServiceName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 text-xs"
                />
                <div className="relative w-36">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-500">৳</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Rate"
                    value={newServiceCost}
                    onChange={e => setNewServiceCost(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-2 py-1.5 text-slate-100 font-mono text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold flex items-center space-x-1 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Service</span>
                </button>
              </div>

              <div className="space-y-2">
                {customServices.map((sc, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200">{sc.name}</span>
                      {sc.description && <span className="text-slate-500 text-[11px] block">{sc.description}</span>}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-mono font-bold text-amber-300">৳{sc.cost.toLocaleString()}</span>
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
        </div>

        {/* Footer with Summary & Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>
              Package Rate: <strong className="text-purple-400 font-mono text-xs">৳{basePrice.toLocaleString()}</strong> ({pricingModel.replace('_', ' ')})
            </span>
            <span>•</span>
            <span>Halls: <strong className="text-slate-200">{selectedHalls.length}</strong></span>
            <span>•</span>
            <span>Dishes: <strong className="text-slate-200">{selectedMenuIds.length}</strong></span>
            <span>•</span>
            <span>Rooms: <strong className="text-slate-200">{selectedRooms.length}</strong></span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-colors text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-600/30 flex items-center space-x-1.5 transition-colors text-xs"
            >
              <Check className="w-4 h-4" />
              <span>{initialPackage ? 'Update Package' : 'Save Package'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
