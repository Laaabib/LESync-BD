import React, { useState, useMemo } from 'react';
import { Boxes, Search, AlertTriangle, CheckCircle2, ArrowUpDown, Filter, ShieldCheck } from 'lucide-react';
import { InventoryItem, WarehouseStore } from '../../types/inventoryMenu';
import { inventoryMenuService } from '../../services/inventoryMenuService';

interface StockLevelsTabProps {
  items: InventoryItem[];
  stores: WarehouseStore[];
  onOpenTransfer: (itemId?: string) => void;
  onOpenAdjustment: (itemId?: string) => void;
}

export const StockLevelsTab: React.FC<StockLevelsTabProps> = ({ items, stores, onOpenTransfer, onOpenAdjustment }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterHealth, setFilterHealth] = useState<'all' | 'low' | 'adequate'>('all');

  const categories = useMemo(() => inventoryMenuService.getCategories(), []);
  const inventoryStocks = useMemo(() => inventoryMenuService.getState().inventoryStocks || [], [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'all' || item.categoryId === selectedCategory;
      const isLow = item.currentTotalStock <= item.reorderLevel;
      const matchHealth = filterHealth === 'all' || (filterHealth === 'low' ? isLow : !isLow);
      return matchSearch && matchCat && matchHealth;
    });
  }, [items, search, selectedCategory, filterHealth]);

  const lowStockItems = useMemo(() => {
    return items.filter(i => i.currentTotalStock <= i.reorderLevel);
  }, [items]);

  const getItemStockForStore = (itemId: string, storeId: string) => {
    const stk = inventoryStocks.find(s => s.itemId === itemId && s.warehouseId === storeId);
    return stk ? stk.quantity : 0;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-400" />
            Store-by-Store Stock Matrix & Health Levels
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-store distribution matrix with automatic safety buffer alerts and weighted average valuation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenTransfer()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Transfer Between Stores</span>
          </button>
          <button
            onClick={() => onOpenAdjustment()}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            <span>Adjust Store Stock</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockItems.length > 0 && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>{lowStockItems.length} Items</strong> have reached or breached their safety reorder threshold!
            </span>
          </div>
          <span className="font-mono text-xs text-amber-400 font-bold">
            Action: Issue Purchase Requisition or Inter-Store Transfer
          </span>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items by code, name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={filterHealth}
          onChange={e => setFilterHealth(e.target.value as any)}
          className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300"
        >
          <option value="all">All Stock Statuses</option>
          <option value="low">Low / Reorder Required</option>
          <option value="adequate">Adequate Stock</option>
        </select>
      </div>

      {/* Stock Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="px-3 py-3">Code</th>
              <th className="px-3 py-3">Item Name & Category</th>
              <th className="px-3 py-3 text-right">Avg Cost</th>
              {/* Columns for each store */}
              {stores.map(s => (
                <th key={s.id} className="px-3 py-3 text-right">
                  {s.name.replace(' Store', '').replace(' Storage', '')}
                </th>
              ))}
              <th className="px-3 py-3 text-right">Total Qty</th>
              <th className="px-3 py-3 text-right">Valuation</th>
              <th className="px-3 py-3">Health Status</th>
              <th className="px-3 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {filteredItems.map(item => {
              const isLow = item.currentTotalStock <= item.reorderLevel;
              const isOut = item.currentTotalStock === 0;

              return (
                <tr key={item.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-3 py-3 font-mono font-bold text-amber-400">
                    {item.itemCode}
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-semibold text-white">{item.name}</div>
                    <span className="text-[10px] text-slate-400">{item.categoryName} • Base: {item.uomCode || (item as any).primaryUom || 'Units'}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono">
                    ৳{item.averageCost.toFixed(2)}
                  </td>
                  {/* Store stock columns */}
                  {stores.map(s => {
                    const stVal = getItemStockForStore(item.id, s.id);
                    const isDefault = item.defaultWarehouseId === s.id;
                    return (
                      <td key={s.id} className="px-3 py-3 text-right font-mono">
                        {stVal > 0 ? (
                          <span className={isDefault ? 'font-bold text-slate-200' : 'text-slate-400'}>
                            {stVal} {item.uomCode || (item as any).primaryUom || 'Units'}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-right font-mono font-bold text-white">
                    <span className={isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}>
                      {item.currentTotalStock} {item.uomCode || (item as any).primaryUom || 'Units'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-amber-400">
                    ৳{(item.currentTotalValue ?? 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-3">
                    {isOut ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Out of Stock
                      </span>
                    ) : isLow ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Reorder (≤ {item.reorderLevel})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Adequate
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => onOpenTransfer(item.id)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
                    >
                      Transfer
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
