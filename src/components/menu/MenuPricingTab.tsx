// CCULB PMS - Menu Pricing Strategy & Profitability Engine Tab
// Target Food Cost % Pricing Calculator, Multi-Outlet Tiers, and GL Revenue Alignment

import React, { useState, useMemo } from 'react';
import {
  DollarSign, TrendingUp, Percent, ShieldCheck,
  Search, Filter, Edit3, ArrowRight, CheckCircle2,
  AlertCircle, RefreshCw, BarChart2, Layers
} from 'lucide-react';
import { inventoryMenuService } from '../../services/inventoryMenuService';
import { MenuItemEnhanced, OutletType } from '../../types/inventoryMenu';

interface MenuPricingTabProps {
  onOpenPriceModal: (item: MenuItemEnhanced) => void;
}

export const MenuPricingTab: React.FC<MenuPricingTabProps> = ({ onOpenPriceModal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [targetCostFilter, setTargetCostFilter] = useState<number>(28);
  const [outletTier, setOutletTier] = useState<string>('Standard Dine-In');

  const menuItems = inventoryMenuService.getEnhancedMenuItems();
  const priceHistories = inventoryMenuService.getPriceHistories();

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      return (
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.menuCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [menuItems, searchQuery]);

  // Overall financial metrics
  const totalMenuRevenuePotential = useMemo(() => {
    return menuItems.reduce((sum, item) => sum + (item.basePrice ?? 0), 0);
  }, [menuItems]);

  const averageFoodCostPct = useMemo(() => {
    if (menuItems.length === 0) return 0;
    const totalCost = menuItems.reduce((sum, item) => sum + (item.costPrice ?? 0), 0);
    const totalRev = menuItems.reduce((sum, item) => sum + (item.basePrice ?? 0), 0);
    return totalRev > 0 ? Math.round((totalCost / totalRev) * 1000) / 10 : 0;
  }, [menuItems]);

  // Surcharge multiplier based on selected outlet tier
  const tierMultiplier = useMemo(() => {
    switch (outletTier) {
      case 'In-Room Dining (+15%)':
        return 1.15;
      case 'Poolside Bar (+10%)':
        return 1.10;
      case 'Banquet Bulk Discount (-10%)':
        return 0.90;
      default:
        return 1.0;
    }
  }, [outletTier]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Menu Pricing Strategy & Target Margin Calculator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Optimize selling prices based on live ingredient cost, target food cost percentages, and multi-outlet service tiers
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-slate-500">Outlet Tier:</span>
          <select
            value={outletTier}
            onChange={e => setOutletTier(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="Standard Dine-In">Standard Dine-In (100%)</option>
            <option value="In-Room Dining (+15%)">In-Room Dining (+15% Tray)</option>
            <option value="Poolside Bar (+10%)">Poolside Bar (+10%)</option>
            <option value="Banquet Bulk Discount (-10%)">Banquet Bulk Discount (-10%)</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Catalog Menu Dishes</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{menuItems.length} Dishes</div>
          <span className="text-[10px] text-emerald-600 font-medium">100% Recipe Costed</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Average Food Cost %</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">{averageFoodCostPct}%</div>
          <span className="text-[10px] text-slate-400">Target benchmark: 28.0%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Base Menu Value</span>
          <div className="text-xl font-mono font-bold text-slate-900 mt-1">৳{(totalMenuRevenuePotential || 0).toLocaleString()}</div>
          <span className="text-[10px] text-slate-400">Sum of base catalog items</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Active Price Audit Logs</span>
          <div className="text-xl font-bold text-blue-700 mt-1">{priceHistories.length} Events</div>
          <span className="text-[10px] text-blue-600 font-medium">Recorded with reason</span>
        </div>
      </div>

      {/* Target Margin Simulation Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-400" />
            Interactive Target Food Cost Simulator
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a target cost benchmark to instantly see recommended prices and profit lift across all dishes
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
          {[25, 28, 30, 33, 35].map(pct => (
            <button
              key={pct}
              onClick={() => setTargetCostFilter(pct)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                targetCostFilter === pct
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {pct}% Target
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search dish name or code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Active Tier Multiplier: <strong className="text-slate-900 font-mono">{(tierMultiplier * 100).toFixed(0)}%</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Menu Dish</th>
                <th className="py-3 px-3 text-right">Raw Recipe Cost</th>
                <th className="py-3 px-3 text-right">Current Base Price</th>
                <th className="py-3 px-3 text-center">Current Cost %</th>
                <th className="py-3 px-3 text-right">Tier Surcharge Price</th>
                <th className="py-3 px-3 text-right">Simulated Price (@{targetCostFilter}%)</th>
                <th className="py-3 px-3 text-right">Margin Variance</th>
                <th className="py-3 px-3 text-center">GL Revenue Code</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredItems.map(item => {
                const cost = item.costPrice ?? 0;
                const base = item.basePrice ?? 0;
                const curCostPct = base > 0 ? Math.round((cost / base) * 1000) / 10 : 0;
                const tierPrice = Math.round(base * tierMultiplier);
                const simPrice = targetCostFilter > 0 ? Math.round((cost / (targetCostFilter / 100))) : base;
                const priceDiff = simPrice - base;

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{item.name}</span>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                        <span className="font-mono font-semibold bg-slate-100 px-1 rounded">{item.menuCode}</span>
                        <span>{item.categoryName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-700">
                      ৳{cost.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                      ৳{(base || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${curCostPct <= 30 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {curCostPct}%
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-extrabold text-blue-800 bg-blue-50/40">
                      ৳{(tierPrice || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-extrabold text-emerald-700 bg-emerald-50/40">
                      ৳{(simPrice || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-semibold">
                      <span className={priceDiff > 0 ? 'text-emerald-600' : priceDiff < 0 ? 'text-amber-600' : 'text-slate-400'}>
                        {priceDiff > 0 ? `+৳${priceDiff}` : priceDiff < 0 ? `-৳${Math.abs(priceDiff)}` : '0'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono text-[11px] text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">
                        {item.glRevenueAccountCode || '4020'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onOpenPriceModal(item)}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                      >
                        Update Price
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
