import React, { useState } from 'react';
import { Store, Plus, MapPin, User, DollarSign, Package, CheckCircle2, Sliders, Edit, ShieldCheck } from 'lucide-react';
import { WarehouseStore } from '../../types/inventoryMenu';
import { inventoryMenuService } from '../../services/inventoryMenuService';

interface StoresManagementTabProps {
  stores: WarehouseStore[];
  onOpenTransfer: (storeId: string) => void;
}

export const StoresManagementTab: React.FC<StoresManagementTabProps> = ({ stores, onOpenTransfer }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<WarehouseStore | null>(null);

  const [form, setForm] = useState({
    name: '',
    code: '',
    storeType: 'Central' as WarehouseStore['storeType'],
    department: 'Central Stores' as WarehouseStore['department'],
    location: '',
    manager: '',
    phone: '',
    totalCapacity: '10,000 cu ft',
    temperatureControlled: false,
    temperatureRange: 'Ambient (20°C - 25°C)',
    isProductionStore: false,
    glAccountCode: '1300',
    glAccountName: 'Food & Beverage Store Inventory'
  });

  const handleCreateStore = (e: React.FormEvent) => {
    e.preventDefault();
    inventoryMenuService.addWarehouse({
      name: form.name,
      code: form.code || `STR-${Date.now().toString().slice(-3)}`,
      storeType: form.storeType,
      department: form.department,
      location: form.location,
      manager: form.manager || 'Store In-Charge',
      phone: form.phone || '+880 1711-000000',
      totalCapacity: form.totalCapacity,
      temperatureControlled: form.temperatureControlled,
      temperatureRange: form.temperatureRange,
      isProductionStore: form.isProductionStore,
      active: true,
      createdAt: new Date().toISOString()
    });
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleUpdateStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;
    inventoryMenuService.updateWarehouse(editingStore.id, {
      name: form.name,
      code: form.code,
      storeType: form.storeType,
      department: form.department,
      location: form.location,
      manager: form.manager,
      phone: form.phone,
      temperatureControlled: form.temperatureControlled,
      temperatureRange: form.temperatureRange,
      isProductionStore: form.isProductionStore
    });
    setEditingStore(null);
    resetForm();
  };

  const resetForm = () => {
    setForm({
      name: '',
      code: '',
      storeType: 'Central' as WarehouseStore['storeType'],
      department: 'Central Stores',
      location: '',
      manager: '',
      phone: '',
      totalCapacity: '10,000 cu ft',
      temperatureControlled: false,
      temperatureRange: 'Ambient (20°C - 25°C)',
      isProductionStore: false,
      glAccountCode: '1300',
      glAccountName: 'Food & Beverage Store Inventory'
    });
  };

  const openEdit = (s: WarehouseStore) => {
    setEditingStore(s);
    setForm({
      name: s.name,
      code: s.code,
      storeType: s.storeType,
      department: s.department,
      location: s.location,
      manager: s.manager,
      phone: s.phone,
      totalCapacity: s.totalCapacity || '10,000 cu ft',
      temperatureControlled: s.temperatureControlled,
      temperatureRange: s.temperatureRange || 'Ambient',
      isProductionStore: s.isProductionStore,
      glAccountCode: s.id === 'wh-bar' ? '1310' : '1300',
      glAccountName: s.id === 'wh-bar' ? 'Bar & Beverage Store Inventory' : 'Food & Beverage Store Inventory'
    });
  };

  const totalStoreStockValuation = (storeId: string) => {
    const invItems = inventoryMenuService.getInventoryItems();
    return invItems
      .filter(i => i.defaultWarehouseId === storeId)
      .reduce((sum, i) => sum + (i.currentTotalValue || 0), 0);
  };

  const totalStoreSkuCount = (storeId: string) => {
    const invItems = inventoryMenuService.getInventoryItems();
    return invItems.filter(i => i.defaultWarehouseId === storeId).length;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-400" />
            Hotel & Resort Stores Directory ({stores.length} Active Stores)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical and departmental storage locations mapped directly to General Ledger Asset Accounts (1300 Food / 1310 Bar / 1320 Supplies)
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Store</span>
        </button>
      </div>

      {/* Stores Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map(store => {
          const val = totalStoreStockValuation(store.id);
          const skus = totalStoreSkuCount(store.id);
          const isBar = store.id === 'wh-bar' || store.department === 'Bar & Lounge';
          const glCode = isBar ? '1310' : '1300';
          const glName = isBar ? 'Bar & Beverage Inventory' : 'Food & Beverage Inventory';

          return (
            <div
              key={store.id}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4.5 space-y-3.5 transition shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{store.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Code: {store.code} • {store.storeType}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => openEdit(store)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  title="Edit Store"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* GL Mapping Badge */}
              <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  GL Asset Account:
                </span>
                <span className="font-mono font-bold text-[11px] text-emerald-400">
                  {glCode} - {glName}
                </span>
              </div>

              {/* Meta Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{store.location}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{store.manager}</span>
                </div>
              </div>

              {/* Valuation & SKU count */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">SKU Stock Count</span>
                  <span className="font-mono font-bold text-slate-200">{skus} Items</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Current Valuation</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">৳{(val ?? 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-1 flex gap-2">
                <button
                  onClick={() => onOpenTransfer(store.id)}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-lg transition border border-slate-800"
                >
                  Transfer Stock
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Store Modal */}
      {(isAddModalOpen || editingStore) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-400" />
                {editingStore ? `Edit Store: ${editingStore.name}` : 'Register New Inventory Store'}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingStore(null); }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={editingStore ? handleUpdateStore : handleCreateStore} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">Store Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Banquet Pastry Store / Poolside Beverage Station"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Store Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STR-MAIN-01"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Store Type *</label>
                  <select
                    value={form.storeType}
                    onChange={e => setForm({ ...form, storeType: e.target.value as WarehouseStore['storeType'] })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Central">Central Main Store</option>
                    <option value="Sub-Store">Kitchen Production / Sub-Store</option>
                    <option value="Beverage Store">Bar & Beverage Store</option>
                    <option value="General">General / Housekeeping Store</option>
                    <option value="Cold Storage">Cold Storage</option>
                    <option value="Dry Store">Dry Store</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Department</label>
                  <select
                    value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value as WarehouseStore['department'] })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Central Stores">Central Stores</option>
                    <option value="Food Production">Food Production</option>
                    <option value="Bar & Lounge">Bar & Lounge</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Banquet & Catering">Banquet & Catering</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Location / Room</label>
                  <input
                    type="text"
                    placeholder="e.g. Ground Floor, Wing B - Room 104"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Store In-Charge / Manager</label>
                  <input
                    type="text"
                    placeholder="e.g. Jahid Hasan (Storekeeper)"
                    value={form.manager}
                    onChange={e => setForm({ ...form, manager: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Phone / Ext.</label>
                  <input
                    type="text"
                    placeholder="e.g. Ext 402 / +880 1711..."
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="col-span-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Mapped General Ledger Account</span>
                    <span className="text-[11px] text-slate-400">All GRN inward and issue outward transactions will automatically balance against this GL account</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                    {form.department === 'Bar & Lounge' ? '1310 - Bar Inventory' : '1300 - Food Inventory'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingStore(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow"
                >
                  {editingStore ? 'Save Changes' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
