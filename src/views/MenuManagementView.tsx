// CCULB PMS - F&B Menu Management, Recipe Costing & Accounting Engine
// Full module suite: Items, Categories, Recipes, Ingredients, Modifiers, Pricing, Service Charge, Tax, Versions, Reports & GL Mapping

import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed, ChefHat, BookOpen, Layers, DollarSign,
  TrendingUp, Sparkles, Percent, ShieldCheck, FileText,
  Calendar, Package, Award
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { inventoryMenuService } from '../services/inventoryMenuService';
import { MenuItemEnhanced } from '../types/inventoryMenu';

import { MenuItemsTab } from '../components/menu/MenuItemsTab';
import { MenuCategoriesTab } from '../components/menu/MenuCategoriesTab';
import { MenuRecipesTab } from '../components/menu/MenuRecipesTab';
import { MenuIngredientsTab } from '../components/menu/MenuIngredientsTab';
import { MenuModifiersTab } from '../components/menu/MenuModifiersTab';
import { MenuPricingTab } from '../components/menu/MenuPricingTab';
import { MenuServiceChargeTab } from '../components/menu/MenuServiceChargeTab';
import { MenuTaxTab } from '../components/menu/MenuTaxTab';
import { MenuVersionsTab } from '../components/menu/MenuVersionsTab';
import { MenuReportsTab } from '../components/menu/MenuReportsTab';
import { MenuGLMappingModal } from '../components/menu/MenuGLMappingModal';

interface MenuManagementViewProps {
  initialTab?: string;
}

export const MenuManagementView: React.FC<MenuManagementViewProps> = ({ initialTab = 'catalog' }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isGLModalOpen, setIsGLModalOpen] = useState<boolean>(false);

  // Quick Price Modal state
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [itemToUpdatePrice, setItemToUpdatePrice] = useState<MenuItemEnhanced | null>(null);
  const [newBasePrice, setNewBasePrice] = useState<number>(0);
  const [priceChangeReason, setPriceChangeReason] = useState('Annual food cost inflation adjustment');

  useEffect(() => {
    if (initialTab) {
      // Normalize 'dashboard' or unknown tab to 'catalog'
      if (initialTab === 'dashboard') {
        setActiveTab('catalog');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab]);

  const handleOpenPriceModal = (item: MenuItemEnhanced) => {
    setItemToUpdatePrice(item);
    setNewBasePrice(item.basePrice || 0);
    setPriceChangeReason('Raw material cost inflation adjustment');
    setIsPriceModalOpen(true);
  };

  const handleSavePriceChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToUpdatePrice) return;

    inventoryMenuService.updateMenuItem(itemToUpdatePrice.id, {
      basePrice: newBasePrice,
      updatedAt: new Date().toISOString()
    });

    inventoryMenuService.addPriceHistory({
      menuItemId: itemToUpdatePrice.menuCode || itemToUpdatePrice.name,
      previousPrice: itemToUpdatePrice.basePrice,
      newPrice: newBasePrice,
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: priceChangeReason,
      updatedBy: 'Executive Chef / F&B Manager'
    });

    setIsPriceModalOpen(false);
  };

  const tabs = [
    { id: 'catalog', label: 'Menu Items', icon: BookOpen },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'recipes', label: 'Recipes & Costing', icon: ChefHat },
    { id: 'ingredients', label: 'Raw Ingredients', icon: Package },
    { id: 'modifiers', label: 'Modifiers & Add-ons', icon: Sparkles },
    { id: 'pricing', label: 'Pricing Strategy', icon: DollarSign },
    { id: 'service-charge', label: 'Service Charge', icon: Percent },
    { id: 'tax', label: 'Tax & VAT (15%)', icon: ShieldCheck },
    { id: 'versions', label: 'Seasonal Versions', icon: Calendar },
    { id: 'reports', label: 'Reports & BCG', icon: FileText },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">F&B Menu & Recipe Engineering Suite</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Standard recipes, dynamic ingredient costing, 10% Service Charge, 15% NBR VAT & backend General Ledger mapping
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsGLModalOpen(true)}
            className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            GL Accounts Mapping
          </button>
        </div>
      </div>

      {/* Main Module Tabs Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Render Active Tab Module */}
      {activeTab === 'catalog' && (
        <MenuItemsTab
          onOpenRecipeBuilder={() => setActiveTab('recipes')}
          onOpenPriceModal={handleOpenPriceModal}
          onOpenGLMapping={() => setIsGLModalOpen(true)}
        />
      )}

      {activeTab === 'categories' && <MenuCategoriesTab />}

      {activeTab === 'recipes' && (
        <MenuRecipesTab onOpenRecipeBuilder={() => {}} />
      )}

      {activeTab === 'ingredients' && <MenuIngredientsTab />}

      {activeTab === 'modifiers' && <MenuModifiersTab />}

      {activeTab === 'pricing' && (
        <MenuPricingTab onOpenPriceModal={handleOpenPriceModal} />
      )}

      {activeTab === 'service-charge' && <MenuServiceChargeTab />}

      {activeTab === 'tax' && <MenuTaxTab />}

      {activeTab === 'versions' && <MenuVersionsTab />}

      {activeTab === 'reports' && <MenuReportsTab />}

      {/* Global GL Mapping Modal */}
      <MenuGLMappingModal
        isOpen={isGLModalOpen}
        onClose={() => setIsGLModalOpen(false)}
      />

      {/* Quick Price Update Modal */}
      {isPriceModalOpen && itemToUpdatePrice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Update Menu Dish Price: {itemToUpdatePrice.name}
              </h3>
              <button
                onClick={() => setIsPriceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePriceChange} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Current Base Price:</span>
                  <span className="font-mono font-bold text-slate-900">৳{(itemToUpdatePrice.basePrice ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Current Raw Recipe Cost:</span>
                  <span className="font-mono font-bold text-slate-700">৳{(itemToUpdatePrice.costPrice ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                  <span>GL Sales Revenue Code:</span>
                  <span className="font-mono font-bold text-blue-700">{itemToUpdatePrice.glRevenueAccountCode || '4020'}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">New Base Selling Price (৳) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newBasePrice}
                  onChange={e => setNewBasePrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Price Revision Justification *</label>
                <input
                  type="text"
                  required
                  value={priceChangeReason}
                  onChange={e => setPriceChangeReason(e.target.value)}
                  placeholder="e.g. Meat & spice procurement inflation"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPriceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
                >
                  Confirm & Audit Log Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
