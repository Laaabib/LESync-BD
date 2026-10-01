import React, { useState, useEffect } from 'react';
import {
  Layers, Users, BedDouble, CheckCircle2, Sparkles, Edit3, Plus,
  DollarSign, Check, X, AlertCircle, Trash2, ShieldAlert
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { RoomType } from '../types/pms';

export const RoomTypesView: React.FC = () => {
  const [db, setDb] = useState(pmsService.getState());

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  // Modals
  const [editingType, setEditingType] = useState<RoomType | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [baseRate, setBaseRate] = useState<number>(5000);
  const [maxAdults, setMaxAdults] = useState<number>(2);
  const [maxChildren, setMaxChildren] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [amenitiesStr, setAmenitiesStr] = useState('Wi-Fi, Balcony, Smart TV, Mini Fridge, Air Conditioned');
  const [isActive, setIsActive] = useState(true);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const canManage = pmsService.hasPermission('can_manage_rooms');

  const handleOpenEdit = (rt: RoomType) => {
    setEditingType(rt);
    setName(rt.name);
    setBaseRate(rt.baseRate);
    setMaxAdults(rt.maxAdults);
    setMaxChildren(rt.maxChildren);
    setDescription(rt.description || '');
    setAmenitiesStr(rt.amenities.join(', '));
    setIsActive(rt.active !== false);
    setFormError('');
  };

  const handleOpenAdd = () => {
    setIsAddModalOpen(true);
    setName('');
    setBaseRate(6500);
    setMaxAdults(2);
    setMaxChildren(1);
    setDescription('Contemporary luxury room with panoramic scenic resort view.');
    setAmenitiesStr('Wi-Fi, Balcony, Smart TV, Mini Fridge, Air Conditioned, Electric Kettle');
    setIsActive(true);
    setFormError('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;
    if (!name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    try {
      const amenities = amenitiesStr.split(',').map(s => s.trim()).filter(Boolean);
      pmsService.updateRoomType(editingType.id, {
        name: name.trim(),
        baseRate: Number(baseRate),
        maxAdults: Number(maxAdults),
        maxChildren: Number(maxChildren),
        description: description.trim(),
        amenities,
        active: isActive
      });

      setEditingType(null);
      setFormSuccess(`Updated room category "${name}" successfully!`);
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to update category.');
    }
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    try {
      const amenities = amenitiesStr.split(',').map(s => s.trim()).filter(Boolean);
      pmsService.addRoomType({
        name: name.trim(),
        baseRate: Number(baseRate),
        extraAdultRate: 1000,
        extraChildRate: 500,
        maxAdults: Number(maxAdults),
        maxChildren: Number(maxChildren),
        description: description.trim(),
        amenities,
        active: isActive
      });

      setIsAddModalOpen(false);
      setFormSuccess(`Created new room category "${name}" successfully!`);
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create room category.');
    }
  };

  const handleDelete = (id: string) => {
    try {
      pmsService.deleteRoomType(id);
      setDeletingTypeId(null);
      setFormSuccess('Room category deleted successfully.');
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err: any) {
      alert(`Delete error: ${err?.message || 'Cannot delete room category'}`);
    }
  };

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center border border-cyan-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-100">Room Categories & Tariff Master</h1>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] border border-cyan-500/30 font-semibold">
                {db.roomTypes.length} Configured Types
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Standard base rates, maximum adult/child occupancy limits, and luxury amenities.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenAdd}
            disabled={!canManage}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition shadow-sm ${
              canManage
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Room Category</span>
          </button>
        </div>
      </div>

      {formSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {db.roomTypes.map(rt => {
          const roomCount = db.rooms.filter(r => r.roomTypeId === rt.id).length;
          return (
            <div
              key={rt.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition shadow-sm"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">{rt.name}</h3>
                    <span className="text-[11px] text-cyan-400 font-mono font-medium">{roomCount} Units Available</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-amber-400 font-mono">৳{(rt.baseRate || 0).toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 block">/ night</span>
                  </div>
                </div>

                <p className="text-slate-400 text-xs mt-2.5 leading-relaxed">{rt.description}</p>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-300">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Max {rt.maxAdults} Adults, {rt.maxChildren} Child</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-300">
                    <BedDouble className="w-3.5 h-3.5 text-amber-400" />
                    <span>Status: {rt.active ? 'Active' : 'Disabled'}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Included Amenities:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {rt.amenities.map((am, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-slate-950 text-slate-300 text-[11px] border border-slate-800 font-medium"
                      >
                        {am}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">ID: {rt.id}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEdit(rt)}
                    disabled={!canManage}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition text-xs flex items-center space-x-1 border border-slate-700"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Edit Tariff</span>
                  </button>
                  {roomCount === 0 && (
                    <button
                      onClick={() => setDeletingTypeId(rt.id)}
                      disabled={!canManage}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition border border-rose-500/30"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-slate-100 text-base">Edit Room Category: {editingType.name}</h3>
              </div>
              <button
                onClick={() => setEditingType(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category Name:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Base Tariff (৳ / night):</label>
                  <input
                    type="number"
                    value={baseRate}
                    onChange={e => setBaseRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Max Adults:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxAdults}
                    onChange={e => setMaxAdults(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Max Children:</label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={maxChildren}
                    onChange={e => setMaxChildren(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Amenities (comma-separated):</label>
                <input
                  type="text"
                  value={amenitiesStr}
                  onChange={e => setAmenitiesStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-950 border-slate-700"
                />
                <label htmlFor="activeCheck" className="text-slate-300 text-xs">
                  Active (Available for Front Desk & Online Booking)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingType(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition text-xs flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-slate-100 text-base">Add New Room Category</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category Name:</label>
                  <input
                    type="text"
                    value={name}
                    placeholder="e.g. Presidential Penthouse"
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Base Tariff (৳ / night):</label>
                  <input
                    type="number"
                    value={baseRate}
                    onChange={e => setBaseRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Max Adults:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxAdults}
                    onChange={e => setMaxAdults(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Max Children:</label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={maxChildren}
                    onChange={e => setMaxChildren(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Amenities (comma-separated):</label>
                <input
                  type="text"
                  value={amenitiesStr}
                  onChange={e => setAmenitiesStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="activeAddCheck"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-950 border-slate-700"
                />
                <label htmlFor="activeAddCheck" className="text-slate-300 text-xs">
                  Active (Available for Front Desk & Online Booking)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition text-xs flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTypeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-rose-500/30 w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-slate-100 text-sm">Delete Room Category</h3>
            </div>
            <p className="text-slate-300 text-xs">
              Are you sure you want to remove this room category? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeletingTypeId(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingTypeId)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
