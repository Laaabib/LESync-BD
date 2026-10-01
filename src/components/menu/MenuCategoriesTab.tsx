// CCULB PMS - Menu Categories & Subcategories Tab
// Categories master with GL revenue & cost mappings, default statutory rates, and station routing

import React, { useState } from 'react';
import {
  Layers, Plus, Edit3, Trash2, ShieldCheck, DollarSign,
  TrendingDown, Percent, ChefHat, Check, AlertCircle, Utensils
} from 'lucide-react';
import { inventoryMenuService } from '../../services/inventoryMenuService';
import { MenuCategoryItem, MenuType } from '../../types/inventoryMenu';
import { pmsService } from '../../services/pmsService';

export const MenuCategoriesTab: React.FC = () => {
  const categories = inventoryMenuService.getMenuCategories();
  const glAccounts = pmsService.getState().glAccounts || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategoryItem | null>(null);
  const [formData, setFormData] = useState<Partial<MenuCategoryItem>>({
    name: '',
    code: '',
    description: '',
    menuType: 'Food',
    kitchenStation: 'Main Hot Kitchen',
    glSalesAccountCode: '4020',
    glSalesAccountName: 'Food & Beverage Outlet Sales',
    glCogsAccountCode: '5020',
    glCogsAccountName: 'F&B Kitchen Raw Materials & Consumables',
    defaultTaxPercent: 15,
    defaultServiceChargePercent: 10,
    displayOrder: 1,
    active: true
  });

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      code: `CAT-${Date.now().toString().slice(-4)}`,
      description: '',
      menuType: 'Food',
      kitchenStation: 'Main Hot Kitchen',
      glSalesAccountCode: '4020',
      glSalesAccountName: 'Food & Beverage Outlet Sales',
      glCogsAccountCode: '5020',
      glCogsAccountName: 'F&B Kitchen Raw Materials & Consumables',
      defaultTaxPercent: 15,
      defaultServiceChargePercent: 10,
      displayOrder: categories.length + 1,
      active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: MenuCategoryItem) => {
    setEditingCategory(cat);
    setFormData({ ...cat });
    setIsModalOpen(true);
  };

  const handleSaveCategory = () => {
    if (!formData.name) return;
    const catToSave = {
      name: formData.name,
      code: formData.code || `CAT-${Date.now().toString().slice(-4)}`,
      description: formData.description || '',
      menuType: (formData.menuType as MenuType) || 'Food',
      kitchenStation: formData.kitchenStation || 'Main Hot Kitchen',
      glSalesAccountCode: formData.glSalesAccountCode || '4020',
      glSalesAccountName: formData.glSalesAccountName || 'Food & Beverage Outlet Sales',
      glCogsAccountCode: formData.glCogsAccountCode || '5020',
      glCogsAccountName: formData.glCogsAccountName || 'F&B Kitchen Raw Materials & Consumables',
      defaultTaxPercent: Number(formData.defaultTaxPercent) || 15,
      defaultServiceChargePercent: Number(formData.defaultServiceChargePercent) || 10,
      displayOrder: Number(formData.displayOrder) || 1,
      active: formData.active ?? true
    };

    if (editingCategory) {
      inventoryMenuService.updateMenuCategory(editingCategory.id, catToSave);
    } else {
      inventoryMenuService.addMenuCategory(catToSave);
    }
    setIsModalOpen(false);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      inventoryMenuService.deleteMenuCategory(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Menu Categories & GL Accounting Defaults
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure menu category routing, kitchen stations, default statutory VAT & Service Charge, and Chart of Accounts
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div
            key={cat.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {cat.code}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
                  {cat.itemCount ?? 0} items
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                {cat.description || 'General resort menu category and kitchen routing.'}
              </p>

              {/* Station & Type Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100">
                  {cat.menuType}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Station: <strong className="text-slate-700">{cat.kitchenStation}</strong>
                </span>
              </div>

              {/* GL Accounts Box */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1 text-slate-500">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Sales GL:
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {cat.glSalesAccountCode} ({cat.glSalesAccountName.split(' ')[0]})
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1 text-slate-500">
                    <TrendingDown className="w-3.5 h-3.5 text-amber-600" /> COGS GL:
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {cat.glCogsAccountCode} ({cat.glCogsAccountName.split(' ')[0]})
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Percent className="w-3.5 h-3.5 text-blue-600" /> Defaults:
                  </span>
                  <span className="font-semibold text-slate-800">
                    VAT {cat.defaultTaxPercent}% • SC {cat.defaultServiceChargePercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => handleOpenEditModal(cat)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                {editingCategory ? 'Edit Menu Category' : 'Create Menu Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Seafood & Fresh Catch"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category Code *</label>
                  <input
                    type="text"
                    value={formData.code || ''}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full font-mono bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Category scope and culinary concept..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Menu Type</label>
                  <select
                    value={formData.menuType || 'Food'}
                    onChange={e => setFormData({ ...formData, menuType: e.target.value as MenuType })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Food">Food</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Package">Package / Combo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kitchen Station</label>
                  <select
                    value={formData.kitchenStation || 'Main Hot Kitchen'}
                    onChange={e => setFormData({ ...formData, kitchenStation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Main Hot Kitchen">Main Hot Kitchen</option>
                    <option value="Tandoor & Curry">Tandoor & Curry</option>
                    <option value="Live BBQ Station">Live BBQ Station</option>
                    <option value="Bar & Beverage Counter">Bar & Beverage Counter</option>
                    <option value="Bakery & Pastry">Bakery & Pastry</option>
                    <option value="Salad & Cold Station">Salad & Cold Station</option>
                    <option value="Room Service Pantry">Room Service Pantry</option>
                  </select>
                </div>
              </div>

              {/* GL Accounts Section */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Default GL Chart of Accounts
                </h4>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Default Sales Revenue GL</label>
                  <select
                    value={formData.glSalesAccountCode || '4020'}
                    onChange={e => {
                      const acc = glAccounts.find(g => g.code === e.target.value);
                      setFormData({
                        ...formData,
                        glSalesAccountCode: e.target.value,
                        glSalesAccountName: acc?.name || ''
                      });
                    }}
                    className="w-full font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {glAccounts.filter(g => g.type === 'Revenue').map(g => (
                      <option key={g.code} value={g.code}>
                        {g.code} - {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Default COGS Expense GL</label>
                  <select
                    value={formData.glCogsAccountCode || '5020'}
                    onChange={e => {
                      const acc = glAccounts.find(g => g.code === e.target.value);
                      setFormData({
                        ...formData,
                        glCogsAccountCode: e.target.value,
                        glCogsAccountName: acc?.name || ''
                      });
                    }}
                    className="w-full font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {glAccounts.filter(g => g.type === 'Expense' || g.category === 'Cost of Sales').map(g => (
                      <option key={g.code} value={g.code}>
                        {g.code} - {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tax and SC */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default VAT %</label>
                  <input
                    type="number"
                    value={formData.defaultTaxPercent ?? 15}
                    onChange={e => setFormData({ ...formData, defaultTaxPercent: Number(e.target.value) })}
                    className="w-full font-mono bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Service Charge %</label>
                  <input
                    type="number"
                    value={formData.defaultServiceChargePercent ?? 10}
                    onChange={e => setFormData({ ...formData, defaultServiceChargePercent: Number(e.target.value) })}
                    className="w-full font-mono bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
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
                onClick={handleSaveCategory}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
