// CCULB PMS - Menu Items Tab (Catalog)
// Full CRUD, recipe costing, tax & service charge calculations, GL accounts, stock bottleneck portions

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Filter, Plus, Edit3, Trash2, CheckCircle2,
  AlertCircle, ChefHat, Tag, Clock, Flame,
  TrendingUp, ShieldCheck, Eye, Sparkles, Layers, DollarSign,
  RotateCcw, RefreshCw, X
} from 'lucide-react';
import { MenuItemEnhanced, OutletType, MenuType, MenuCategoryItem } from '../../types/inventoryMenu';
import { inventoryMenuService } from '../../services/inventoryMenuService';
import { pmsService } from '../../services/pmsService';

interface MenuItemsTabProps {
  onOpenRecipeBuilder: (item: MenuItemEnhanced) => void;
  onOpenPriceModal: (item: MenuItemEnhanced) => void;
  onOpenGLMapping: () => void;
}

export const MenuItemsTab: React.FC<MenuItemsTabProps> = ({
  onOpenRecipeBuilder,
  onOpenPriceModal,
  onOpenGLMapping
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [menuTypeFilter, setMenuTypeFilter] = useState('all');
  const [outletFilter, setOutletFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add / Edit Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemEnhanced | null>(null);
  const [formData, setFormData] = useState<Partial<MenuItemEnhanced>>({
    name: '',
    menuCode: '',
    categoryId: 'mcat-1',
    categoryName: 'Traditional Bengali & Royal Feast',
    menuType: 'Food',
    outlet: ['Restaurant', 'Room Service', 'Banquet'],
    kitchenStation: 'Main Hot Kitchen',
    description: '',
    preparationTimeMinutes: 20,
    servingSize: '1 Person',
    basePrice: 500,
    serviceChargePercent: 10,
    taxPercent: 15,
    status: 'Active',
    availability: 'Available',
    autoOutOfStockOnLowIngredients: true,
    glRevenueAccountCode: '4020',
    glRevenueAccountName: 'Food & Beverage Outlet Sales',
    glCogsAccountCode: '5020',
    glCogsAccountName: 'F&B Kitchen Raw Materials & Consumables'
  });

  const [menuItems, setMenuItems] = useState<MenuItemEnhanced[]>(() => {
    const list = inventoryMenuService.getEnhancedMenuItems();
    if (list.length === 0) {
      return inventoryMenuService.resetToSeedMenuItems();
    }
    return list;
  });
  const [categories, setCategories] = useState<MenuCategoryItem[]>(() => inventoryMenuService.getMenuCategories());
  const glAccounts = pmsService.getState().glAccounts || [];

  useEffect(() => {
    // Check on mount if items exist; if not self-heal
    const current = inventoryMenuService.getEnhancedMenuItems();
    if (current.length === 0) {
      const restored = inventoryMenuService.resetToSeedMenuItems();
      setMenuItems([...restored]);
    } else {
      setMenuItems([...current]);
    }

    const unsub = inventoryMenuService.subscribe(() => {
      setMenuItems([...inventoryMenuService.getEnhancedMenuItems()]);
      setCategories([...inventoryMenuService.getMenuCategories()]);
    });
    return unsub;
  }, []);

  const handleResetCatalog = () => {
    if (window.confirm('Restore all standard dishes & recipes in the Master Menu Catalog? (22 comprehensive dishes across all 6 categories will be loaded)')) {
      const restored = inventoryMenuService.resetToSeedMenuItems();
      setMenuItems([...restored]);
      setCategoryFilter('all');
      setSearchQuery('');
      setMenuTypeFilter('all');
      setOutletFilter('all');
      setStatusFilter('all');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setMenuTypeFilter('all');
    setOutletFilter('all');
    setStatusFilter('all');
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchSearch =
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.menuCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'all' || item.categoryName === categoryFilter;
      const matchType = menuTypeFilter === 'all' || item.menuType === menuTypeFilter;
      const matchOutlet = outletFilter === 'all' || (item.outlet && item.outlet.includes(outletFilter as OutletType));
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchSearch && matchCat && matchType && matchOutlet && matchStatus;
    });
  }, [menuItems, searchQuery, categoryFilter, menuTypeFilter, outletFilter, statusFilter]);

  // Handle Open Create Item Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    const defaultCat = categories[0] || {
      id: 'mcat-1',
      name: 'Traditional Bengali & Royal Feast',
      menuType: 'Food' as MenuType,
      defaultServiceChargePercent: 10,
      defaultTaxPercent: 15,
      glSalesAccountCode: '4020',
      glSalesAccountName: 'Food & Beverage Outlet Sales',
      glCogsAccountCode: '5020',
      glCogsAccountName: 'F&B Kitchen Raw Materials & Consumables'
    };
    setFormData({
      name: '',
      menuCode: `MNU-${Date.now().toString().slice(-4)}`,
      categoryId: defaultCat.id,
      categoryName: defaultCat.name,
      menuType: (defaultCat as any).menuType || 'Food',
      outlet: ['Restaurant', 'Room Service'],
      kitchenStation: 'Main Hot Kitchen',
      description: '',
      preparationTimeMinutes: 15,
      servingSize: '1 Person',
      basePrice: 400,
      serviceChargePercent: (defaultCat as any).defaultServiceChargePercent || 10,
      taxPercent: (defaultCat as any).defaultTaxPercent || 15,
      status: 'Active',
      availability: 'Available',
      autoOutOfStockOnLowIngredients: true,
      glRevenueAccountCode: defaultCat.glSalesAccountCode || '4020',
      glRevenueAccountName: defaultCat.glSalesAccountName || 'Food & Beverage Outlet Sales',
      glCogsAccountCode: defaultCat.glCogsAccountCode || '5020',
      glCogsAccountName: defaultCat.glCogsAccountName || 'F&B Kitchen Raw Materials & Consumables'
    });
    setIsItemModalOpen(true);
  };

  // Handle Open Edit Item Modal
  const handleOpenEditModal = (item: MenuItemEnhanced) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsItemModalOpen(true);
  };

  // Handle Category change in Modal to auto-fill GL and defaults
  const handleCategorySelect = (catId: string) => {
    const selectedCat = categories.find(c => c.id === catId);
    if (selectedCat) {
      setFormData(prev => ({
        ...prev,
        categoryId: selectedCat.id,
        categoryName: selectedCat.name,
        menuType: selectedCat.menuType,
        glRevenueAccountCode: selectedCat.glSalesAccountCode,
        glRevenueAccountName: selectedCat.glSalesAccountName,
        glCogsAccountCode: selectedCat.glCogsAccountCode,
        glCogsAccountName: selectedCat.glCogsAccountName,
        serviceChargePercent: selectedCat.defaultServiceChargePercent,
        taxPercent: selectedCat.defaultTaxPercent
      }));
    }
  };

  // Save Item
  const handleSaveItem = () => {
    if (!formData.name) return;
    const base = Number(formData.basePrice) || 0;
    const scPct = Number(formData.serviceChargePercent) || 0;
    const taxPct = Number(formData.taxPercent) || 0;
    const scAmt = Math.round((base * scPct) / 100 * 100) / 100;
    const taxAmt = Math.round(((base + scAmt) * taxPct) / 100 * 100) / 100;
    const finalPrice = Math.round((base + scAmt + taxAmt) * 100) / 100;

    const itemToSave = {
      ...formData,
      basePrice: base,
      serviceChargePercent: scPct,
      serviceChargeAmount: scAmt,
      taxPercent: taxPct,
      taxAmount: taxAmt,
      finalSellingPrice: finalPrice,
      costPrice: formData.costPrice ?? (editingItem?.costPrice ?? 0),
      foodCostPercentage: base > 0 ? Math.round(((formData.costPrice ?? (editingItem?.costPrice ?? 0)) / base) * 1000) / 10 : 0,
      profitMargin: base - (formData.costPrice ?? (editingItem?.costPrice ?? 0)),
      updatedAt: new Date().toISOString()
    };

    if (editingItem) {
      inventoryMenuService.updateMenuItem(editingItem.id, itemToSave);
    } else {
      inventoryMenuService.createMenuItem({
        ...itemToSave,
        hasActiveRecipe: false,
        active: true,
        outletAvailability: {
          Restaurant: true,
          Bar: true,
          Pool: true,
          'Room Service': true,
          Banquet: true,
          Event: true,
          Other: true
        }
      } as any);
    }
    setIsItemModalOpen(false);
  };

  // Toggle item availability
  const handleToggleAvailability = (item: MenuItemEnhanced) => {
    const nextAvail = item.availability === 'Available' ? 'Unavailable' : 'Available';
    inventoryMenuService.updateMenuItem(item.id, { availability: nextAvail });
  };

  // Delete item
  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the menu catalog?`)) {
      inventoryMenuService.deleteEnhancedMenuItem(id);
    }
  };

  // Outlets helper
  const allOutlets: OutletType[] = ['Restaurant', 'Bar', 'Room Service', 'Pool', 'Banquet'];

  return (
    <div className="space-y-6">
      {/* Header Controls & Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookOpenIcon className="w-5 h-5 text-emerald-600" />
            Menu Items Master Catalog ({filteredItems.length} items)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active F&B menu dishes with real-time raw recipe costing, statutory tax breakdown, and GL ledger mapping
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleResetCatalog}
            title="Reset / Restore standard resort menu catalog items & recipes"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-300 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
            Restore Standard Catalog
          </button>
          <button
            onClick={onOpenGLMapping}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-300"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            GL Accounts Mapping
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Menu Item
          </button>
        </div>
      </div>

      {/* Quick Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            categoryFilter === 'all'
              ? 'bg-emerald-600 text-white shadow-xs font-bold'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-2xs'
          }`}
        >
          All Categories ({menuItems.length})
        </button>
        {categories.map(c => {
          const count = menuItems.filter(i => i.categoryName === c.name || i.categoryId === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                categoryFilter === c.name
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-2xs'
              }`}
            >
              {c.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search dish or code..."
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
            <option value="all">All Menu Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={menuTypeFilter}
            onChange={e => setMenuTypeFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Types (Food / Bar)</option>
            <option value="Food">Food Only</option>
            <option value="Beverage">Beverage Only</option>
            <option value="Dessert">Dessert Only</option>
            <option value="Package">Package / Combo</option>
          </select>
        </div>

        <div>
          <select
            value={outletFilter}
            onChange={e => setOutletFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Outlets</option>
            <option value="Restaurant">Main Restaurant</option>
            <option value="Bar">Bar & Lounge</option>
            <option value="Room Service">In-Room Dining</option>
            <option value="Pool">Poolside Bar</option>
            <option value="Banquet">Banquet & Catering</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Item Details</th>
                <th className="py-3 px-3">Category & Outlets</th>
                <th className="py-3 px-3 text-right">Recipe Cost</th>
                <th className="py-3 px-3 text-right">Base Price</th>
                <th className="py-3 px-3 text-right">SC (10%)</th>
                <th className="py-3 px-3 text-right">VAT (15%)</th>
                <th className="py-3 px-3 text-right">Final Bill Price</th>
                <th className="py-3 px-3 text-center">Food Cost %</th>
                <th className="py-3 px-3 text-center">GL Accounts</th>
                <th className="py-3 px-3 text-center">Stock Cap</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    {menuItems.length === 0 ? (
                      <div className="max-w-md mx-auto space-y-3 px-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20">
                          <BookOpenIcon className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">Menu Items Catalog is Empty</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          No food or beverage dishes are currently loaded in the resort master catalog. Click below to load the complete CCULB standard catalog with 22 authentic dishes across Bengali, BBQ & Grills, Continental, Seafood, Bar Beverages, and Desserts with recipes, statutory tax rates, and GL mappings.
                        </p>
                        <div className="pt-2">
                          <button
                            onClick={handleResetCatalog}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all inline-flex items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Initialize Full Master Menu Catalog (22 Items)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-sm mx-auto space-y-2 px-4">
                        <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
                        <div className="font-semibold text-slate-700 text-sm">No dishes match current filters</div>
                        <p className="text-xs text-slate-500">
                          {menuItems.length} dishes exist in the catalog, but none matched your search or category filter.
                        </p>
                        <button
                          onClick={handleClearFilters}
                          className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 inline-flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          Clear All Filters
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const foodCostPct = item.foodCostPercentage ?? (item.basePrice > 0 ? ((item.costPrice ?? 0) / item.basePrice) * 100 : 0);
                  const isHealthyCost = foodCostPct <= 32;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            title={item.availability === 'Available' ? 'Click to mark Out of Stock' : 'Click to mark Available'}
                            className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                              item.availability === 'Available' ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          <div>
                            <span className="font-bold text-slate-900">{item.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                {item.menuCode}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {item.kitchenStation} • {item.servingSize}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Outlets */}
                      <td className="py-3.5 px-3">
                        <span className="inline-block text-[11px] font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md mb-1">
                          {item.categoryName}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(item.outlet || []).map(ot => (
                            <span key={ot} className="text-[9px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">
                              {ot}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Recipe Cost */}
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-700">
                        {item.hasActiveRecipe ? (
                          <div>
                            <span>৳{(item.costPrice ?? 0).toFixed(2)}</span>
                            <span className="block text-[10px] text-emerald-600 font-normal">Recipe Linked</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-amber-600">৳{(item.costPrice ?? 0).toFixed(2)}</span>
                            <span className="block text-[10px] text-amber-500 font-normal">No Recipe</span>
                          </div>
                        )}
                      </td>

                      {/* Base Price */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        ৳{(item.basePrice ?? 0).toLocaleString()}
                      </td>

                      {/* Service Charge */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-600 text-[11px]">
                        +৳{(item.serviceChargeAmount ?? ((item.basePrice ?? 0) * (item.serviceChargePercent ?? 10) / 100)).toFixed(1)}
                        <span className="block text-[10px] text-slate-400">({item.serviceChargePercent ?? 10}%)</span>
                      </td>

                      {/* VAT */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-600 text-[11px]">
                        +৳{(item.taxAmount ?? ((item.basePrice ?? 0) * 1.1 * (item.taxPercent ?? 15) / 100)).toFixed(1)}
                        <span className="block text-[10px] text-slate-400">({item.taxPercent ?? 15}%)</span>
                      </td>

                      {/* Final Selling Price */}
                      <td className="py-3.5 px-3 text-right font-mono font-extrabold text-emerald-700 bg-emerald-50/40 px-2 rounded">
                        ৳{(item.finalSellingPrice ?? ((item.basePrice ?? 0) * 1.265)).toFixed(1)}
                      </td>

                      {/* Food Cost % */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            isHealthyCost
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {foodCostPct.toFixed(1)}%
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          Margin: ৳{((item.basePrice ?? 0) - (item.costPrice ?? 0)).toFixed(0)}
                        </span>
                      </td>

                      {/* GL Accounts */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="font-mono text-[10px] text-slate-600">
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100" title={`Revenue GL: ${item.glRevenueAccountName || 'Food Sales'}`}>
                            REV: {item.glRevenueAccountCode || '4020'}
                          </span>
                          <span className="block mt-0.5 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100" title={`COGS GL: ${item.glCogsAccountName || 'Food COGS'}`}>
                            COGS: {item.glCogsAccountCode || '5020'}
                          </span>
                        </div>
                      </td>

                      {/* Stock Cap */}
                      <td className="py-3.5 px-3 text-center font-semibold">
                        <span className="text-slate-800">{item.maxProduciblePortions ?? 35}</span>
                        <span className="block text-[10px] text-slate-400">portions</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenRecipeBuilder(item)}
                            title="Build or Edit Recipe"
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <ChefHat className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenPriceModal(item)}
                            title="Quick Price Update"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit Item Details"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            title="Delete Item"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Menu Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-emerald-400" />
                {editingItem ? 'Edit Menu Item Details' : 'Create New Menu Item'}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Menu Dish Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Saffron Kacchi Biryani"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Menu Code *</label>
                  <input
                    type="text"
                    value={formData.menuCode || ''}
                    onChange={e => setFormData({ ...formData, menuCode: e.target.value })}
                    placeholder="e.g. MNU-CHK-BRY"
                    className="w-full font-mono bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.categoryId || ''}
                    onChange={e => handleCategorySelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.menuType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kitchen Station *</label>
                  <select
                    value={formData.kitchenStation || 'Main Hot Kitchen'}
                    onChange={e => setFormData({ ...formData, kitchenStation: e.target.value as any })}
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Recipe Highlights</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredients and culinary presentation notes..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Pricing, Tax & Service Charge Grid */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Pricing & Statutory Charges Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Base Price (৳)</label>
                    <input
                      type="number"
                      value={formData.basePrice || 0}
                      onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                      className="w-full font-bold font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Service Charge %</label>
                    <input
                      type="number"
                      value={formData.serviceChargePercent ?? 10}
                      onChange={e => setFormData({ ...formData, serviceChargePercent: Number(e.target.value) })}
                      className="w-full font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">VAT % (NBR)</label>
                    <input
                      type="number"
                      value={formData.taxPercent ?? 15}
                      onChange={e => setFormData({ ...formData, taxPercent: Number(e.target.value) })}
                      className="w-full font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Final Guest Price</label>
                    <div className="font-extrabold font-mono text-emerald-700 bg-emerald-100/70 border border-emerald-200 rounded-lg px-3 py-2 text-xs">
                      ৳{((formData.basePrice || 0) * (1 + (formData.serviceChargePercent ?? 10) / 100) * (1 + (formData.taxPercent ?? 15) / 100)).toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              {/* General Ledger Mapping Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  General Ledger Backend Accounts
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Sales Revenue GL Account</label>
                    <select
                      value={formData.glRevenueAccountCode || '4020'}
                      onChange={e => {
                        const acc = glAccounts.find(g => g.code === e.target.value);
                        setFormData({
                          ...formData,
                          glRevenueAccountCode: e.target.value,
                          glRevenueAccountName: acc?.name || ''
                        });
                      }}
                      className="w-full font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      {glAccounts.filter(g => g.type === 'Revenue').map(g => (
                        <option key={g.code} value={g.code}>
                          {g.code} - {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Cost of Goods Sold (COGS) GL</label>
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
                      className="w-full font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      {glAccounts.filter(g => g.type === 'Expense' || g.category === 'Cost of Sales').map(g => (
                        <option key={g.code} value={g.code}>
                          {g.code} - {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Outlet Availability Checkboxes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Applicable Outlets</label>
                <div className="flex flex-wrap gap-3">
                  {allOutlets.map(ot => {
                    const isChecked = (formData.outlet || []).includes(ot);
                    return (
                      <label key={ot} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            const cur = formData.outlet || [];
                            if (e.target.checked) {
                              setFormData({ ...formData, outlet: [...cur, ot] });
                            } else {
                              setFormData({ ...formData, outlet: cur.filter(o => o !== ot) });
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-slate-700 font-medium">{ot}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                {editingItem ? 'Save Changes' : 'Create Menu Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function BookOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}
