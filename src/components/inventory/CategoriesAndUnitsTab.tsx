import React, { useState } from 'react';
import { Layers, Tag, Plus, CheckCircle2, Sliders, Edit, Trash2 } from 'lucide-react';
import { InventoryCategory, UnitOfMeasure } from '../../types/inventoryMenu';
import { inventoryMenuService } from '../../services/inventoryMenuService';

interface CategoriesAndUnitsTabProps {
  categories: InventoryCategory[];
  uoms: UnitOfMeasure[];
}

export const CategoriesAndUnitsTab: React.FC<CategoriesAndUnitsTabProps> = ({ categories, uoms }) => {
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'units'>('categories');
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [isAddUomModalOpen, setIsAddUomModalOpen] = useState(false);

  const [catForm, setCatForm] = useState({
    name: '',
    code: '',
    department: 'F&B Kitchen' as InventoryCategory['department'],
    description: '',
    subcategories: ''
  });

  const [uomForm, setUomForm] = useState({
    name: '',
    code: '',
    symbol: '',
    category: 'Weight' as UnitOfMeasure['category'],
    baseUnit: true,
    conversionRatio: 1
  });

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const subs = catForm.subcategories
      ? catForm.subcategories.split(',').map(s => s.trim()).filter(Boolean)
      : ['General'];

    inventoryMenuService.addCategory({
      name: catForm.name,
      code: catForm.code || `CAT-${Date.now().toString().slice(-3)}`,
      department: catForm.department,
      description: catForm.description,
      subcategories: subs,
      active: true
    });
    setIsAddCatModalOpen(false);
    setCatForm({ name: '', code: '', department: 'F&B Kitchen', description: '', subcategories: '' });
  };

  const handleCreateUom = (e: React.FormEvent) => {
    e.preventDefault();
    inventoryMenuService.addUom({
      name: uomForm.name,
      code: uomForm.code,
      symbol: uomForm.symbol || uomForm.code,
      category: uomForm.category,
      baseUnitId: uomForm.baseUnit ? undefined : 'uom-kg',
      conversionMultiplier: Number(uomForm.conversionRatio) || 1,
      active: true
    });
    setIsAddUomModalOpen(false);
    setUomForm({ name: '', code: '', symbol: '', category: 'Weight', baseUnit: true, conversionRatio: 1 });
  };

  const items = inventoryMenuService.getInventoryItems();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-5">
      {/* Sub Header & Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            Inventory Master Taxonomy & Measurement Units
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Standardize item categorization and multi-level units of measurement with precision conversion ratios
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'categories' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveSubTab('units')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'units' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Units of Measure ({uoms.length})
          </button>
        </div>
      </div>

      {/* SubTab 1: Categories */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-300">Inventory Category Hierarchy & Item Distribution</span>
            <button
              onClick={() => setIsAddCatModalOpen(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => {
              const catItems = items.filter(i => i.categoryId === cat.id);
              const totalVal = catItems.reduce((sum, i) => sum + (i.currentTotalValue || 0), 0);

              return (
                <div key={cat.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{cat.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400">{cat.code} • {cat.department}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">{cat.description || 'Standard inventory classification group'}</p>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Subcategories:</span>
                    <div className="flex flex-wrap gap-1">
                      {cat.subcategories.map((sub, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-300 border border-slate-800">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">{catItems.length} Products</span>
                    <span className="font-mono font-bold text-amber-400">৳{(totalVal ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SubTab 2: Units of Measure */}
      {activeSubTab === 'units' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-300">Units of Measure (UOM) with Standard Conversion Ratios</span>
            <button
              onClick={() => setIsAddUomModalOpen(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Unit (UOM)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-3">UOM Name</th>
                  <th className="px-3 py-3">Code / Symbol</th>
                  <th className="px-3 py-3">Measurement Type</th>
                  <th className="px-3 py-3">Classification</th>
                  <th className="px-3 py-3 text-right">Standard Conversion Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {uoms.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-3 py-3 font-semibold text-white">{u.name}</td>
                    <td className="px-3 py-3 font-mono font-bold text-amber-400">{u.code} ({u.symbol})</td>
                    <td className="px-3 py-3 text-slate-400">{u.category}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        !u.baseUnitId ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {!u.baseUnitId ? 'Base Reference Unit' : 'Derived Unit'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-slate-200">
                      {u.conversionMultiplier || (u as any).conversionRatio || 1}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isAddCatModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Register New Inventory Category
              </h3>
              <button onClick={() => setIsAddCatModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seafood & Crustaceans / Wine & Spirits"
                  value={catForm.name}
                  onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Category Code</label>
                <input
                  type="text"
                  placeholder="e.g. CAT-SF-01"
                  value={catForm.code}
                  onChange={e => setCatForm({ ...catForm, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Department</label>
                <select
                  value={catForm.department}
                  onChange={e => setCatForm({ ...catForm, department: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="F&B Production">F&B Production</option>
                  <option value="Bar & Beverage">Bar & Beverage</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Front Office">Front Office</option>
                  <option value="Engineering & Maintenance">Engineering & Maintenance</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Subcategories (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh Fish, Shrimps, Crabs, Canned Seafood"
                  value={catForm.subcategories}
                  onChange={e => setCatForm({ ...catForm, subcategories: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catForm.description}
                  onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCatModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add UOM Modal */}
      {isAddUomModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Register New Unit of Measure (UOM)
              </h3>
              <button onClick={() => setIsAddUomModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateUom} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">UOM Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dozen / Barrel / Centiliter"
                  value={uomForm.name}
                  onChange={e => setUomForm({ ...uomForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. doz / bbl / cl"
                    value={uomForm.code}
                    onChange={e => setUomForm({ ...uomForm, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Symbol</label>
                  <input
                    type="text"
                    placeholder="e.g. dz"
                    value={uomForm.symbol}
                    onChange={e => setUomForm({ ...uomForm, symbol: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Measurement Type</label>
                <select
                  value={uomForm.category}
                  onChange={e => setUomForm({ ...uomForm, category: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Weight">Weight (kg, g, mg)</option>
                  <option value="Volume">Volume (L, mL, cl)</option>
                  <option value="Count">Count / Pieces (pcs, box, pack, dozen)</option>
                  <option value="Length">Length (m, cm, ft)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Standard Conversion Multiplier</label>
                <input
                  type="number"
                  value={uomForm.conversionRatio}
                  onChange={e => setUomForm({ ...uomForm, conversionRatio: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUomModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Create Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
