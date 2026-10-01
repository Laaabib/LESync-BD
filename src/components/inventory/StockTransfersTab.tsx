import React, { useState } from 'react';
import { ArrowUpDown, Plus, CheckCircle2, AlertCircle, Clock, Truck, ShieldCheck } from 'lucide-react';
import { StockTransfer, WarehouseStore, InventoryItem } from '../../types/inventoryMenu';
import { inventoryMenuService } from '../../services/inventoryMenuService';

interface StockTransfersTabProps {
  transfers: StockTransfer[];
  stores: WarehouseStore[];
  items: InventoryItem[];
}

export const StockTransfersTab: React.FC<StockTransfersTabProps> = ({ transfers, stores, items }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    sourceWarehouseId: stores[0]?.id || 'wh-main',
    destinationWarehouseId: stores[1]?.id || 'wh-kitchen',
    itemId: items[0]?.id || '',
    quantity: 1,
    remarks: 'Inter-store replenishment request'
  });

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const itm = items.find(i => i.id === form.itemId);
    const src = stores.find(s => s.id === form.sourceWarehouseId);
    const dest = stores.find(s => s.id === form.destinationWarehouseId);
    if (!itm) return;

    const totalCost = Number(form.quantity) * itm.averageCost;

    inventoryMenuService.createStockTransfer({
      sourceWarehouseId: form.sourceWarehouseId,
      sourceWarehouseName: src?.name || 'Source Store',
      destinationWarehouseId: form.destinationWarehouseId,
      destinationWarehouseName: dest?.name || 'Destination Store',
      transferDate: new Date().toISOString().split('T')[0],
      items: [
        {
          itemId: itm.id,
          itemCode: itm.itemCode,
          itemName: itm.name,
          quantity: Number(form.quantity),
          uom: itm.uomCode || 'kg',
          unitCost: itm.averageCost,
          totalCost
        }
      ],
      totalCost,
      status: 'Received',
      requestedBy: 'Store Officer',
      approvedBy: 'Store Supervisor',
      receivedBy: 'Department Receiver',
      remarks: form.remarks
    });

    setIsModalOpen(false);
    setForm({
      sourceWarehouseId: stores[0]?.id || 'wh-main',
      destinationWarehouseId: stores[1]?.id || 'wh-kitchen',
      itemId: items[0]?.id || '',
      quantity: 1,
      remarks: 'Inter-store replenishment request'
    });
  };

  const selectedItem = items.find(i => i.id === form.itemId);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-indigo-400" />
            Inter-Store Stock Transfers & Requisitions ({transfers.length} Movements)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Internal stock movements between Central Stores and Departmental Sub-Stores (Kitchen, Bar, Housekeeping, Banquet)
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Transfer</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="px-3 py-3">Transfer #</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">From (Source)</th>
              <th className="px-3 py-3">To (Destination)</th>
              <th className="px-3 py-3">Items Transferred</th>
              <th className="px-3 py-3 text-right">Total Transfer Value</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Requested By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {transfers.map(t => (
              <tr key={t.id} className="hover:bg-slate-800/40 transition">
                <td className="px-3 py-3 font-mono font-bold text-indigo-400">
                  {t.transferNumber}
                </td>
                <td className="px-3 py-3 font-mono text-slate-400">
                  {t.transferDate}
                </td>
                <td className="px-3 py-3 font-semibold text-slate-200">
                  {t.sourceWarehouseName}
                </td>
                <td className="px-3 py-3 font-semibold text-emerald-400">
                  {t.destinationWarehouseName}
                </td>
                <td className="px-3 py-3">
                  <div className="space-y-1">
                    {t.items.map((it, idx) => (
                      <div key={idx} className="text-slate-300 font-medium">
                        {it.itemName} <span className="font-mono text-indigo-300">({it.quantity} {it.uom})</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-mono font-bold text-white">
                  ৳{(t.totalCost ?? (t as any).totalTransferCost ?? 0).toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.status === 'Received' || (t.status as any) === 'Completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-400">
                  {t.requestedBy}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-indigo-400" />
                Create Inter-Store Stock Transfer
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Source Store (From) *</label>
                <select
                  value={form.sourceWarehouseId}
                  onChange={e => setForm({ ...form, sourceWarehouseId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Destination Store (To) *</label>
                <select
                  value={form.destinationWarehouseId}
                  onChange={e => setForm({ ...form, destinationWarehouseId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {stores.filter(s => s.id !== form.sourceWarehouseId).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Item to Transfer *</label>
                <select
                  value={form.itemId}
                  onChange={e => setForm({ ...form, itemId: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">-- Select Inventory Item --</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.itemCode})</option>)}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Transfer Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>

              {selectedItem && (
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-slate-400">Estimated Transfer Value:</span>
                  <span className="font-mono font-bold text-indigo-400">
                    ৳{((selectedItem.averageCost || 0) * (Number(form.quantity) || 0)).toLocaleString()}
                  </span>
                </div>
              )}

              <div>
                <label className="text-slate-300 font-bold block mb-1">Purpose / Remarks</label>
                <input
                  type="text"
                  value={form.remarks}
                  onChange={e => setForm({ ...form, remarks: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow"
                >
                  Dispatch & Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
