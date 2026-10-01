// CCULB PMS - Menu Modifiers & Add-ons Tab
// Upcharges, inventory deduction ingredients, and GL revenue account mapping

import React, { useState } from 'react';
import {
  Layers, Plus, Edit3, Trash2, DollarSign,
  Package, Check, AlertCircle, ChefHat, Sparkles
} from 'lucide-react';
import { inventoryMenuService } from '../../services/inventoryMenuService';
import { MenuModifierItem } from '../../types/inventoryMenu';

export const MenuModifiersTab: React.FC = () => {
  const modifiers = inventoryMenuService.getModifiers();
  const menuItems = inventoryMenuService.getEnhancedMenuItems();
  const inventoryItems = inventoryMenuService.getInventoryItems();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModifier, setEditingModifier] = useState<MenuModifierItem | null>(null);
  const [formData, setFormData] = useState<Partial<MenuModifierItem>>({
    name: '',
    menuItemId: menuItems[0]?.id || '',
    price: 80,
    active: true
  });

  const handleOpenCreateModal = () => {
    setEditingModifier(null);
    setFormData({
      name: '',
      menuItemId: menuItems[0]?.id || '',
      price: 80,
      active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mod: MenuModifierItem) => {
    setEditingModifier(mod);
    setFormData({ ...mod });
    setIsModalOpen(true);
  };

  const handleSaveModifier = () => {
    if (!formData.name) return;
    const modToSave = {
      name: formData.name,
      menuItemId: formData.menuItemId || menuItems[0]?.id || '',
      price: Number(formData.price) || 0,
      active: formData.active ?? true
    };

    if (editingModifier) {
      inventoryMenuService.updateModifier(editingModifier.id, modToSave);
    } else {
      inventoryMenuService.addModifier(modToSave);
    }
    setIsModalOpen(false);
  };

  const handleDeleteModifier = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete modifier "${name}"?`)) {
      inventoryMenuService.deleteModifier(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Menu Modifiers, Add-ons & Recipe Upcharges ({modifiers.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure customizable extras, side upgrades, additional toppings, and linked inventory consumption
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Modifier
        </button>
      </div>

      {/* Modifiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modifiers.map(mod => {
          const linkedItem = menuItems.find(m => m.id === mod.menuItemId);

          return (
            <div
              key={mod.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{mod.name}</h3>
                      <span className="text-[10px] text-slate-400">
                        {linkedItem ? linkedItem.name : 'Universal Modifier'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-mono font-extrabold rounded-lg bg-emerald-100 text-emerald-800">
                    +৳{(mod.price ?? 0).toLocaleString()}
                  </span>
                </div>

                <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400">Target Item:</span>
                    <span className="font-semibold text-slate-800">{linkedItem ? linkedItem.name : 'All Menu Items'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400">GL Revenue:</span>
                    <span className="font-mono font-bold text-slate-800">4020 (F&B Sales)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400">Status:</span>
                    <span className={`font-semibold ${mod.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {mod.active ? 'Active on POS' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEditModal(mod)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDeleteModifier(mod.id, mod.name)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                {editingModifier ? 'Edit Modifier / Add-on' : 'Create Modifier / Add-on'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Modifier Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Extra Mozzarella Melt (50g)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Upcharge Price (৳) *</label>
                <input
                  type="number"
                  value={formData.price || 0}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Associated Menu Dish</label>
                <select
                  value={formData.menuItemId || ''}
                  onChange={e => setFormData({ ...formData, menuItemId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="">All Dishes / Universal</option>
                  {menuItems.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.menuCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-[11px] text-emerald-800">
                  Revenue automatically posts to GL Account <strong>4020 F&B Outlet Sales</strong> upon guest checkout.
                </span>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModifier}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Save Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
