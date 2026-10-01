// CCULB PMS - Menu Ingredients & Raw Material Directory Tab
// Direct linkage to Physical Inventory Items, UOM Conversions, Unit Costs & GL Asset Accounts

import React, { useState, useMemo } from 'react';
import {
  Package, Search, Filter, Layers, DollarSign,
  TrendingUp, ShieldCheck, ChefHat, AlertCircle, Eye, ArrowRight
} from 'lucide-react';
import { inventoryMenuService } from '../../services/inventoryMenuService';
import { InventoryItem } from '../../types/inventoryMenu';

export const MenuIngredientsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const inventoryItems = inventoryMenuService.getInventoryItems();
  const recipes = inventoryMenuService.getRecipes();

  // Filter only food & beverage raw materials
  const fnbIngredients = useMemo(() => {
    return inventoryItems.filter(item => {
      const isFnb =
        item.itemType === 'Food Ingredient' ||
        item.itemType === 'Raw Material' ||
        item.itemType === 'Beverage' ||
        item.itemType === 'Bar Item' ||
        item.categoryName.toLowerCase().includes('food') ||
        item.categoryName.toLowerCase().includes('bev') ||
        item.categoryName.toLowerCase().includes('bar');

      const matchSearch =
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.itemCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat = categoryFilter === 'all' || item.categoryName === categoryFilter;

      return isFnb && matchSearch && matchCat;
    });
  }, [inventoryItems, searchQuery, categoryFilter]);

  // Categories list
  const categoryOptions = useMemo(() => {
    const set = new Set(fnbIngredients.map(i => i.categoryName));
    return Array.from(set);
  }, [fnbIngredients]);

  // Calculate recipes using this ingredient
  const getRecipeCount = (itemId: string) => {
    return recipes.filter(r => (r.ingredients || []).some(ing => ing.inventoryItemId === itemId)).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            Kitchen & Bar Ingredients Directory ({fnbIngredients.length} items)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical inventory stock, consumption UOM conversion factors, moving average costs, and recipe linkages
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search raw ingredient by name, code or category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Raw Material Categories</option>
            {categoryOptions.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ingredients Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Ingredient Name & Code</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">UOM Conversion</th>
                <th className="py-3 px-3 text-right">Purchase Cost</th>
                <th className="py-3 px-3 text-right">Consumption Unit Cost</th>
                <th className="py-3 px-3 text-right">Physical Stock</th>
                <th className="py-3 px-3 text-right">Total Stock Value</th>
                <th className="py-3 px-3 text-center">GL Asset Code</th>
                <th className="py-3 px-4 text-center">Active Recipes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {fnbIngredients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No ingredient items found.
                  </td>
                </tr>
              ) : (
                fnbIngredients.map(item => {
                  const unitCostConsumption = item.averageCost / (item.conversionFactor || 1000);
                  const recipeCount = getRecipeCount(item.id);
                  const isBar = item.itemType === 'Bar Item' || item.categoryName.toLowerCase().includes('bar');
                  const glAssetCode = isBar ? '1310' : '1300';
                  const glAssetName = isBar ? 'Bar & Beverage Store Inventory' : 'Food & Beverage Store Inventory';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Code */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                            <ChefHat className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900">{item.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                {item.itemCode}
                              </span>
                              <span className="text-[10px] text-slate-400">{item.storageLocation || 'Kitchen Dry Store'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {item.categoryName}
                        </span>
                      </td>

                      {/* UOM Conversion */}
                      <td className="py-3 px-3">
                        <div className="text-[11px] font-mono">
                          <span className="text-slate-800 font-semibold">1 {item.purchaseUomCode}</span>
                          <span className="text-slate-400 mx-1">=</span>
                          <span className="text-emerald-700 font-bold">{item.conversionFactor || 1000} {item.consumptionUomCode}</span>
                        </div>
                      </td>

                      {/* Purchase Cost */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                        ৳{(item.averageCost ?? 0).toFixed(2)} / {item.purchaseUomCode}
                      </td>

                      {/* Consumption Unit Cost */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        ৳{unitCostConsumption.toFixed(3)} / {item.consumptionUomCode}
                      </td>

                      {/* Physical Stock */}
                      <td className="py-3 px-3 text-right font-mono">
                        <span className={`font-bold ${(item.currentTotalStock ?? 0) <= item.reorderLevel ? 'text-amber-600' : 'text-slate-800'}`}>
                          {(item.currentTotalStock ?? 0).toLocaleString()} {item.purchaseUomCode}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          Min: {item.minimumStock ?? 0} {item.purchaseUomCode}
                        </span>
                      </td>

                      {/* Total Stock Value */}
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                        ৳{(item.currentTotalValue ?? ((item.currentTotalStock ?? 0) * (item.averageCost ?? 0))).toLocaleString()}
                      </td>

                      {/* GL Asset Code */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100"
                          title={glAssetName}
                        >
                          {glAssetCode} (Asset)
                        </span>
                      </td>

                      {/* Active Recipes */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-800">
                          {recipeCount} recipes
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
