// CCULB PMS - Standard Recipe Master & Costing Engine Tab
// Connects Raw Ingredients -> Preparation Wastage % -> Portion Cost -> Suggested Selling Price -> Bottleneck Stock Simulator

import React, { useState, useMemo } from 'react';
import {
  ChefHat, Plus, Search, Filter, Edit3, Trash2,
  Clock, DollarSign, Percent, AlertCircle, Sparkles,
  Layers, CheckCircle2, ChevronRight, Scale, Package
} from 'lucide-react';
import { inventoryMenuService } from '../../services/inventoryMenuService';
import { Recipe, RecipeIngredientItem, MenuItemEnhanced } from '../../types/inventoryMenu';
import { pmsService } from '../../services/pmsService';

interface MenuRecipesTabProps {
  onOpenRecipeBuilder?: (item: MenuItemEnhanced) => void;
}

export const MenuRecipesTab: React.FC<MenuRecipesTabProps> = ({ onOpenRecipeBuilder }) => {
  const recipes = inventoryMenuService.getRecipes();
  const menuItems = inventoryMenuService.getEnhancedMenuItems();
  const inventoryItems = inventoryMenuService.getInventoryItems();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(recipes[0] || null);

  // Recipe Builder Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>(menuItems[0]?.id || '');
  const [ingredientsList, setIngredientsList] = useState<RecipeIngredientItem[]>([]);
  const [instructions, setInstructions] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(20);
  const [yieldPortions, setYieldPortions] = useState(1);
  const [yieldUnit, setYieldUnit] = useState('Portion');
  const [targetFoodCostPct, setTargetFoodCostPct] = useState(28);

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const matchSearch =
        (r.menuItemName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.menuItemCode || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [recipes, searchQuery]);

  // Open Create/Edit Recipe Modal
  const handleOpenModal = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipeId(recipe.id);
      setSelectedMenuItemId(recipe.menuItemId);
      setIngredientsList(recipe.ingredients || []);
      setInstructions(recipe.instructions || '');
      setPrepTimeMinutes(recipe.preparationTimeMinutes || 20);
      setYieldPortions(recipe.yieldQuantity || 1);
      setYieldUnit(recipe.yieldUnit || 'Portion');
      setTargetFoodCostPct(recipe.targetFoodCostPercentage || 28);
    } else {
      setEditingRecipeId(null);
      const firstItem = menuItems[0];
      setSelectedMenuItemId(firstItem?.id || '');
      setIngredientsList([]);
      setInstructions('');
      setPrepTimeMinutes(15);
      setYieldPortions(1);
      setYieldUnit('Portion');
      setTargetFoodCostPct(28);
      // Auto-add first default ingredient row
      handleAddIngredientRow();
    }
    setIsModalOpen(true);
  };

  // Add ingredient row in recipe modal
  const handleAddIngredientRow = () => {
    if (inventoryItems.length === 0) return;
    const inv = inventoryItems[0];
    const unitCost = inv.averageCost / (inv.conversionFactor || 1000);
    const newIng: RecipeIngredientItem = {
      id: `ing-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      inventoryItemId: inv.id,
      inventoryItemCode: inv.itemCode,
      inventoryItemName: inv.name,
      quantity: 150,
      uomCode: inv.consumptionUomCode || 'g',
      wastagePercentage: 5,
      effectiveQuantity: 157.5,
      unitCost: Math.round(unitCost * 1000) / 1000,
      totalCost: Math.round(157.5 * unitCost * 100) / 100
    };
    setIngredientsList(prev => [...prev, newIng]);
  };

  // Update ingredient row in recipe modal
  const handleUpdateIngredient = (index: number, updates: Partial<RecipeIngredientItem>) => {
    setIngredientsList(prev => {
      const next = [...prev];
      const cur = { ...next[index], ...updates };

      if (updates.inventoryItemId) {
        const inv = inventoryItems.find(i => i.id === updates.inventoryItemId);
        if (inv) {
          cur.inventoryItemCode = inv.itemCode;
          cur.inventoryItemName = inv.name;
          cur.uomCode = inv.consumptionUomCode || 'g';
          cur.unitCost = Math.round((inv.averageCost / (inv.conversionFactor || 1000)) * 1000) / 1000;
        }
      }

      const qty = Number(cur.quantity) || 0;
      const wst = Number(cur.wastagePercentage) || 0;
      cur.effectiveQuantity = Math.round(qty * (1 + wst / 100) * 100) / 100;
      cur.totalCost = Math.round(cur.effectiveQuantity * cur.unitCost * 100) / 100;

      next[index] = cur;
      return next;
    });
  };

  // Remove ingredient row
  const handleRemoveIngredient = (index: number) => {
    setIngredientsList(prev => prev.filter((_, i) => i !== index));
  };

  // Live total recipe cost calculation
  const modalRecipeCost = useMemo(() => {
    return Math.round(ingredientsList.reduce((sum, ing) => sum + (ing.totalCost || 0), 0) * 100) / 100;
  }, [ingredientsList]);

  // Suggested selling price based on target food cost %
  const modalSuggestedSellingPrice = useMemo(() => {
    if (targetFoodCostPct <= 0) return 0;
    return Math.round((modalRecipeCost / (targetFoodCostPct / 100)) * 10) / 10;
  }, [modalRecipeCost, targetFoodCostPct]);

  // Save recipe
  const handleSaveRecipe = () => {
    const targetItem = menuItems.find(m => m.id === selectedMenuItemId);
    if (!targetItem) return;

    inventoryMenuService.createOrUpdateRecipe({
      menuItemId: targetItem.id,
      menuItemCode: targetItem.menuCode,
      menuItemName: targetItem.name,
      version: 'V1',
      yieldQuantity: yieldPortions,
      yieldUnit: yieldUnit,
      preparationTimeMinutes: prepTimeMinutes,
      instructions: instructions || 'Standard culinary preparation as per resort SOP.',
      ingredients: ingredientsList,
      totalRecipeCost: modalRecipeCost,
      suggestedSellingPrice: modalSuggestedSellingPrice,
      targetFoodCostPercentage: targetFoodCostPct,
      active: true,
      effectiveFrom: new Date().toISOString().split('T')[0],
      createdBy: 'Executive Chef'
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-emerald-600" />
            Standard Recipe Master & Ingredient Costing
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time batch costing, ingredient wastage allowance, portion yields, and live selling price recommendation
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Recipe
        </button>
      </div>

      {/* Two-Column Layout: Recipe List & Detailed Recipe Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recipe Selection List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filteredRecipes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No recipes found.
              </div>
            ) : (
              filteredRecipes.map(rec => {
                const isSelected = selectedRecipe?.id === rec.id;
                const mItem = menuItems.find(m => m.id === rec.menuItemId);
                const foodCostPct = mItem && mItem.basePrice > 0
                  ? Math.round((rec.totalRecipeCost / mItem.basePrice) * 1000) / 10
                  : rec.targetFoodCostPercentage || 28;

                return (
                  <button
                    key={rec.id}
                    onClick={() => setSelectedRecipe(rec)}
                    className={`w-full text-left p-4 transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-emerald-50/80 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{rec.menuItemName}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="font-mono text-[10px] bg-slate-100 px-1 rounded">{rec.menuItemCode}</span>
                        <span>{rec.ingredients?.length || 0} ingredients</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-extrabold text-slate-900">
                        ৳{(rec.totalRecipeCost ?? 0).toFixed(2)}
                      </span>
                      <span className={`block text-[10px] font-bold ${foodCostPct <= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {foodCostPct}% cost
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Recipe Detailed Inspector (8 cols) */}
        <div className="lg:col-span-8">
          {selectedRecipe ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              {/* Recipe Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{selectedRecipe.menuItemName}</h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                      {selectedRecipe.version || 'V1.0'} Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Prep: {selectedRecipe.preparationTimeMinutes || 20} mins
                    </span>
                    <span>• Yield: {selectedRecipe.yieldQuantity || 1} {selectedRecipe.yieldUnit || 'Portion'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(selectedRecipe)}
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Recipe
                  </button>
                </div>
              </div>

              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Raw Recipe Cost</span>
                  <div className="text-lg font-mono font-extrabold text-slate-900 mt-0.5">
                    ৳{(selectedRecipe.totalRecipeCost ?? 0).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400">Sum of all raw materials & wastage</span>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5">
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">Target Food Cost %</span>
                  <div className="text-lg font-mono font-extrabold text-emerald-800 mt-0.5">
                    {selectedRecipe.targetFoodCostPercentage || 28}%
                  </div>
                  <span className="text-[10px] text-emerald-600">Executive target benchmark</span>
                </div>

                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5">
                  <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">Suggested Base Price</span>
                  <div className="text-lg font-mono font-extrabold text-blue-800 mt-0.5">
                    ৳{(selectedRecipe.suggestedSellingPrice || ((selectedRecipe.totalRecipeCost ?? 0) / 0.28)).toFixed(0)}
                  </div>
                  <span className="text-[10px] text-blue-600">Excludes VAT & Service Charge</span>
                </div>
              </div>

              {/* Ingredients Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Bill of Materials (Raw Ingredients Breakdown)
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                        <th className="py-2.5 px-3">Ingredient</th>
                        <th className="py-2.5 px-3 text-right">Base Qty</th>
                        <th className="py-2.5 px-3 text-right">Wastage %</th>
                        <th className="py-2.5 px-3 text-right">Effective Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Cost</th>
                        <th className="py-2.5 px-3 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {(selectedRecipe.ingredients || []).map((ing, idx) => (
                        <tr key={ing.id || idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-900">{ing.inventoryItemName}</span>
                            <span className="block font-mono text-[10px] text-slate-400">{ing.inventoryItemCode}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {ing.quantity} {ing.uomCode}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-amber-600 font-semibold">
                            +{ing.wastagePercentage}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium">
                            {ing.effectiveQuantity} {ing.uomCode}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                            ৳{(ing.unitCost ?? 0).toFixed(3)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ৳{(ing.totalCost ?? 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                        <td colSpan={5} className="py-2.5 px-3 text-right">
                          Total Dish Raw Ingredient Cost:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700 text-sm">
                          ৳{(selectedRecipe.totalRecipeCost ?? 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Cooking Instructions */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-slate-600" />
                  Culinary Instructions & Plating Standard
                </h4>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                  {selectedRecipe.instructions || 'Standard culinary execution as per Resort F&B SOP.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center text-slate-400 text-xs">
              Select a recipe from the left menu to view ingredient breakdown.
            </div>
          )}
        </div>
      </div>

      {/* Recipe Builder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-emerald-400" />
                {editingRecipeId ? 'Edit Standard Recipe & Ingredient Formula' : 'Create New Standard Recipe'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Dish Selector & Prep Times */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Menu Item *</label>
                  <select
                    value={selectedMenuItemId}
                    onChange={e => setSelectedMenuItemId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {menuItems.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.menuCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prep Time (Minutes)</label>
                  <input
                    type="number"
                    value={prepTimeMinutes}
                    onChange={e => setPrepTimeMinutes(Number(e.target.value))}
                    className="w-full font-mono bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Food Cost %</label>
                  <input
                    type="number"
                    value={targetFoodCostPct}
                    onChange={e => setTargetFoodCostPct(Number(e.target.value))}
                    className="w-full font-mono bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Recipe Ingredients Dynamic Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Raw Ingredients & Wastage Allowance
                  </h4>
                  <button
                    onClick={handleAddIngredientRow}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 border border-emerald-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Ingredient
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                        <th className="py-2 px-3">Inventory Ingredient Item</th>
                        <th className="py-2 px-2 w-24">Required Qty</th>
                        <th className="py-2 px-2 w-20">UOM</th>
                        <th className="py-2 px-2 w-20">Wastage %</th>
                        <th className="py-2 px-2 text-right">Effective Qty</th>
                        <th className="py-2 px-2 text-right">Unit Cost (৳)</th>
                        <th className="py-2 px-2 text-right">Total (৳)</th>
                        <th className="py-2 px-2 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ingredientsList.map((ing, idx) => (
                        <tr key={ing.id || idx}>
                          <td className="py-2 px-3">
                            <select
                              value={ing.inventoryItemId}
                              onChange={e => handleUpdateIngredient(idx, { inventoryItemId: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                            >
                              {inventoryItems.map(inv => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.name} ({inv.itemCode}) - Avg: ৳{inv.averageCost}/{inv.purchaseUomCode}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={ing.quantity}
                              onChange={e => handleUpdateIngredient(idx, { quantity: Number(e.target.value) })}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                            />
                          </td>
                          <td className="py-2 px-2 font-mono text-slate-600">{ing.uomCode}</td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={ing.wastagePercentage}
                              onChange={e => handleUpdateIngredient(idx, { wastagePercentage: Number(e.target.value) })}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-amber-600"
                            />
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-medium">{ing.effectiveQuantity}</td>
                          <td className="py-2 px-2 text-right font-mono text-slate-500">৳{ing.unitCost.toFixed(3)}</td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">৳{ing.totalCost.toFixed(2)}</td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => handleRemoveIngredient(idx)}
                              className="p-1 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Calculation Strip */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-emerald-800 font-bold block">Live Total Recipe Cost:</span>
                  <span className="text-xl font-mono font-extrabold text-emerald-950">৳{modalRecipeCost.toFixed(2)}</span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-emerald-800 font-bold block">
                    Recommended Selling Price (@{targetFoodCostPct}% Food Cost):
                  </span>
                  <span className="text-xl font-mono font-extrabold text-emerald-950">৳{modalSuggestedSellingPrice.toFixed(0)}</span>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preparation & Plating SOP</label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="Step-by-step culinary preparation and garnish plating..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
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
                onClick={handleSaveRecipe}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Save & Link Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
