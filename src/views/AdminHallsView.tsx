import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Search, Filter, Trash2, Edit3, CheckCircle2,
  AlertCircle, Users, Sparkles, DollarSign, ShieldAlert, Check
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { Hall } from '../types/pms';

export const AdminHallsView: React.FC = () => {
  const [db, setDb] = useState(pmsService.getState());

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);
  const [deletingHall, setDeletingHall] = useState<Hall | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [venueType, setVenueType] = useState<Hall['venueType']>('Banquet Hall');
  const [floor, setFloor] = useState('Ground Floor, Convention Center');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState<number>(300);
  const [seatingTheater, setSeatingTheater] = useState<number>(350);
  const [seatingBanquet, setSeatingBanquet] = useState<number>(250);
  const [seatingUShape, setSeatingUShape] = useState<number>(70);
  const [seatingClassroom, setSeatingClassroom] = useState<number>(150);
  const [dimensions, setDimensions] = useState('5,000 sq ft');
  const [baseRatePerDay, setBaseRatePerDay] = useState<number>(100000);
  const [baseRateHalfDay, setBaseRateHalfDay] = useState<number>(60000);
  const [baseRatePerHour, setBaseRatePerHour] = useState<number>(12000);
  const [amenitiesStr, setAmenitiesStr] = useState('Line-Array Sound, HD Laser Projector, Stage & Green Room, Central AC, High-Speed Wi-Fi');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const canManageHalls = pmsService.hasPermission('can_manage_halls');

  // Filtered Halls
  const filteredHalls = db.halls.filter(hall => {
    const matchSearch = hall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hall.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (hall.venueType || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = selectedType === 'all' || hall.venueType === selectedType;
    return matchSearch && matchType;
  });

  const resetForm = () => {
    setName('');
    setCode('');
    setVenueType('Banquet Hall');
    setFloor('Ground Floor, Convention Center');
    setDescription('');
    setCapacity(300);
    setSeatingTheater(350);
    setSeatingBanquet(250);
    setSeatingUShape(70);
    setSeatingClassroom(150);
    setDimensions('5,000 sq ft');
    setBaseRatePerDay(100000);
    setBaseRateHalfDay(60000);
    setBaseRatePerHour(12000);
    setAmenitiesStr('Line-Array Sound, HD Laser Projector, Stage & Green Room, Central AC, High-Speed Wi-Fi');
    setFormError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (hall: Hall) => {
    setEditingHall(hall);
    setName(hall.name);
    setCode(hall.code);
    setVenueType(hall.venueType || 'Banquet Hall');
    setFloor(hall.floor || 'Ground Floor');
    setDescription(hall.description);
    setCapacity(hall.capacity);
    setSeatingTheater(hall.seatingTheater || hall.capacity);
    setSeatingBanquet(hall.seatingBanquet || Math.round(hall.capacity * 0.75));
    setSeatingUShape(hall.seatingUShape || Math.round(hall.capacity * 0.25));
    setSeatingClassroom(hall.seatingClassroom || Math.round(hall.capacity * 0.5));
    setDimensions(hall.dimensions);
    setBaseRatePerDay(hall.baseRatePerDay);
    setBaseRateHalfDay(hall.baseRateHalfDay);
    setBaseRatePerHour(hall.baseRatePerHour || 10000);
    setAmenitiesStr(hall.amenities.join(', '));
    setFormError('');
  };

  const handleCreateHall = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim() || !code.trim()) {
      setFormError('Venue name and code are required.');
      return;
    }

    const amenities = (amenitiesStr || '').split(',').map(s => s.trim()).filter(Boolean);

    try {
      pmsService.addHall({
        name: name.trim(),
        code: code.trim(),
        venueType,
        floor,
        description: description.trim() || `${venueType} at CCULB Resort.`,
        capacity: Number(capacity),
        seatingTheater: Number(seatingTheater),
        seatingBanquet: Number(seatingBanquet),
        seatingUShape: Number(seatingUShape),
        seatingClassroom: Number(seatingClassroom),
        dimensions: dimensions.trim(),
        baseRatePerDay: Number(baseRatePerDay),
        baseRateHalfDay: Number(baseRateHalfDay),
        baseRatePerHour: Number(baseRatePerHour),
        amenities
      });

      setIsAddModalOpen(false);
      setFormSuccess(`Venue "${name}" added successfully!`);
      setTimeout(() => setFormSuccess(''), 3000);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create venue.');
    }
  };

  const handleUpdateHall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHall) return;
    setFormError('');

    const amenities = (amenitiesStr || '').split(',').map(s => s.trim()).filter(Boolean);

    try {
      pmsService.updateHall(editingHall.id, {
        name: name.trim(),
        code: code.trim(),
        venueType,
        floor,
        description: description.trim(),
        capacity: Number(capacity),
        seatingTheater: Number(seatingTheater),
        seatingBanquet: Number(seatingBanquet),
        seatingUShape: Number(seatingUShape),
        seatingClassroom: Number(seatingClassroom),
        dimensions: dimensions.trim(),
        baseRatePerDay: Number(baseRatePerDay),
        baseRateHalfDay: Number(baseRateHalfDay),
        baseRatePerHour: Number(baseRatePerHour),
        amenities
      });

      setEditingHall(null);
      setFormSuccess(`Venue "${name}" updated successfully!`);
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update venue.');
    }
  };

  const handleDeleteHall = () => {
    if (!deletingHall) return;
    try {
      pmsService.deleteHall(deletingHall.id);
      setFormSuccess(`Venue "${deletingHall.name}" deleted successfully.`);
      setDeletingHall(null);
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err: any) {
      alert(`Delete Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Convention Halls & Meeting Rooms</h1>
              <p className="text-sm text-slate-300">
                Manage banquet halls, supreme convention ballrooms, meeting rooms, boardrooms, dimensions, and rental rates.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          disabled={!canManageHalls}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition ${
            canManageHalls
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add Venue / Hall
        </button>
      </div>

      {/* Success Alert */}
      {formSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 p-4 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by venue name, code, type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="all">All Venue Types</option>
              <option value="Convention Hall">Convention Hall</option>
              <option value="Banquet Hall">Banquet Hall</option>
              <option value="Meeting Room">Meeting Room</option>
              <option value="Boardroom">Boardroom</option>
              <option value="Open Lawn / Amphitheatre">Open Lawn / Amphitheatre</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredHalls.length}</strong> Venues
        </div>
      </div>

      {/* Venues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredHalls.map(hall => (
          <div
            key={hall.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-500/50 transition group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-bold rounded-md">
                    {hall.code}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1.5 group-hover:text-indigo-600 transition">
                    {hall.name}
                  </h3>
                  <p className="text-xs text-slate-400">{hall.venueType} • {hall.floor || 'Convention Wing'}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ৳{(hall.baseRatePerDay || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">Per Full Day</div>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                {hall.description}
              </p>

              {/* Seating Layout Specs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Max Capacity</span>
                  <span className="font-bold text-slate-900 dark:text-white">{hall.capacity} Guests</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Floor Dimensions</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{hall.dimensions}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Banquet Seating</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{hall.seatingBanquet || Math.round(hall.capacity * 0.75)} pax</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Theater Style</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{hall.seatingTheater || hall.capacity} pax</span>
                </div>
              </div>

              {/* Amenities */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(hall.amenities || []).slice(0, 3).map((amenity, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] rounded-md">
                    {amenity}
                  </span>
                ))}
                {(hall.amenities?.length || 0) > 3 && (
                  <span className="px-1.5 py-0.5 text-slate-400 text-[10px]">
                    +{(hall.amenities?.length || 0) - 3} more
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">
                Half Day: <strong>৳{(hall.baseRateHalfDay || 0).toLocaleString()}</strong>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(hall)}
                  disabled={!canManageHalls}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  title="Edit Venue"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingHall(hall)}
                  disabled={!canManageHalls}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  title="Delete Venue"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Hall Modal */}
      {(isAddModalOpen || editingHall) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                {editingHall ? `Edit Venue: ${editingHall.name}` : 'Register New Convention / Meeting Venue'}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingHall(null); }}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-500/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={editingHall ? handleUpdateHall : handleCreateHall} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Venue / Hall Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Grand Padma Ballroom or Meghna Hall"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Venue Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., HALL-PADMA or ROOM-EXEC"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono uppercase font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Venue Category *</label>
                  <select
                    value={venueType}
                    onChange={e => setVenueType(e.target.value as Hall['venueType'])}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="Convention Hall">Convention Hall</option>
                    <option value="Banquet Hall">Banquet Hall</option>
                    <option value="Meeting Room">Meeting Room</option>
                    <option value="Boardroom">Boardroom</option>
                    <option value="Open Lawn / Amphitheatre">Open Lawn / Amphitheatre</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Floor / Wing Location</label>
                  <input
                    type="text"
                    value={floor}
                    onChange={e => setFloor(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Dimensions / Area</label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={e => setDimensions(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Seating Capacities */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">Seating Configurations & Capacity</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Total Max</label>
                    <input
                      type="number"
                      value={capacity}
                      onChange={e => setCapacity(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Theater Style</label>
                    <input
                      type="number"
                      value={seatingTheater}
                      onChange={e => setSeatingTheater(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Banquet Dinner</label>
                    <input
                      type="number"
                      value={seatingBanquet}
                      onChange={e => setSeatingBanquet(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">U-Shape</label>
                    <input
                      type="number"
                      value={seatingUShape}
                      onChange={e => setSeatingUShape(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Classroom</label>
                    <input
                      type="number"
                      value={seatingClassroom}
                      onChange={e => setSeatingClassroom(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Rates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Base Rate / Full Day (৳) *</label>
                  <input
                    type="number"
                    required
                    value={baseRatePerDay}
                    onChange={e => setBaseRatePerDay(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Half Day Rate (৳) *</label>
                  <input
                    type="number"
                    required
                    value={baseRateHalfDay}
                    onChange={e => setBaseRateHalfDay(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Hourly Rate (৳)</label>
                  <input
                    type="number"
                    value={baseRatePerHour}
                    onChange={e => setBaseRatePerHour(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Amenities & Gear (comma separated)</label>
                <input
                  type="text"
                  value={amenitiesStr}
                  onChange={e => setAmenitiesStr(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingHall(null); }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  {editingHall ? 'Save Venue Changes' : 'Create Venue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingHall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Venue "{deletingHall.name}"?
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to permanently remove {deletingHall.name} ({deletingHall.code}) from convention hall listings?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300">
              <p>• Cannot delete venues with confirmed upcoming event bookings.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingHall(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteHall}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition"
              >
                Confirm Delete Venue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
