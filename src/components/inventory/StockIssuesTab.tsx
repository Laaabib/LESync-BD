import React, { useState, useMemo } from 'react';
import { Send, Plus, ShieldCheck, CheckCircle2, DollarSign, Printer, Search, X } from 'lucide-react';
import { StoreIssueConsumption, WarehouseStore, InventoryItem } from '../../types/inventoryMenu';
import { inventoryMenuService } from '../../services/inventoryMenuService';

interface StockIssuesTabProps {
  issues: StoreIssueConsumption[];
  stores: WarehouseStore[];
  items: InventoryItem[];
}

export const StockIssuesTab: React.FC<StockIssuesTabProps> = ({ issues, stores, items }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [selectedIssueForPrint, setSelectedIssueForPrint] = useState<StoreIssueConsumption | null>(null);
  const [form, setForm] = useState({
    warehouseId: stores[0]?.id || 'wh-main',
    department: 'Kitchen' as StoreIssueConsumption['department'],
    recipientName: 'Head Chef / Sous Chef',
    purpose: 'Daily food preparation & banquet catering',
    itemId: items[0]?.id || '',
    quantity: 1
  });

  const filteredItemsForIssue = useMemo(() => {
    if (!itemSearchTerm.trim()) return items;
    const term = itemSearchTerm.toLowerCase();
    return items.filter(i =>
      i.name.toLowerCase().includes(term) ||
      i.itemCode.toLowerCase().includes(term)
    );
  }, [items, itemSearchTerm]);

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const itm = items.find(i => i.id === form.itemId);
    const wh = stores.find(s => s.id === form.warehouseId);
    if (!itm) return;

    const totalCost = Number(form.quantity) * itm.averageCost;

    inventoryMenuService.createStoreIssue({
      warehouseId: form.warehouseId,
      warehouseName: wh?.name || 'Main Food Store',
      department: form.department,
      recipientName: form.recipientName,
      issueDate: new Date().toISOString().split('T')[0],
      purpose: form.purpose,
      items: [
        {
          itemId: itm.id,
          itemCode: itm.itemCode,
          itemName: itm.name,
          quantity: Number(form.quantity),
          uom: itm.consumptionUomCode || itm.uomCode || 'kg',
          unitCost: itm.averageCost,
          totalCost
        }
      ],
      totalCost,
      issuedBy: 'Store Supervisor',
      approvedBy: 'Store Manager'
    });

    setIsModalOpen(false);
    setForm({
      warehouseId: stores[0]?.id || 'wh-main',
      department: 'Kitchen',
      recipientName: 'Head Chef / Sous Chef',
      purpose: 'Daily food preparation & banquet catering',
      itemId: items[0]?.id || '',
      quantity: 1
    });
  };

  const selectedItem = items.find(i => i.id === form.itemId);

  const getGlAccountInfo = (dept: StoreIssueConsumption['department']) => {
    switch (dept) {
      case 'Kitchen':
        return { dr: '5020 Food Cost / F&B Raw Materials', cr: '1300 Food Store Inventory' };
      case 'Bar':
        return { dr: '5025 Beverage & Liquor Cost', cr: '1310 Bar & Beverage Inventory' };
      case 'Housekeeping':
        return { dr: '5010 Room Amenities & Guest Supplies', cr: '1320 General Supplies Inventory' };
      case 'Banquet & Catering':
        return { dr: '5022 Banquet Event Food Cost', cr: '1300 Food Store Inventory' };
      case 'Maintenance':
        return { dr: '5030 Repairs & Engineering Materials', cr: '1320 General Supplies Inventory' };
      default:
        return { dr: '5020 General Operating Consumption', cr: '1300 Food Store Inventory' };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-400" />
            Store Issues & Departmental Consumption ({issues.length} Issues)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time requisition fulfillment with automated Accounting Journal Vouchers (Dr 5010/5020/5025/5030 COGS Expense, Cr 1300/1310 Inventory)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Stock to Department</span>
        </button>
      </div>

      {/* Issues Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="px-3 py-3">Issue #</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Issuing Store</th>
              <th className="px-3 py-3">Department</th>
              <th className="px-3 py-3">Recipient & Purpose</th>
              <th className="px-3 py-3">Items Issued</th>
              <th className="px-3 py-3 text-right">Total Cost</th>
              <th className="px-3 py-3">Accounting JV #</th>
              <th className="px-3 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {issues.map(iss => (
              <tr key={iss.id} className="hover:bg-slate-800/40 transition">
                <td className="px-3 py-3 font-mono font-bold text-emerald-400">
                  {iss.issueNumber}
                </td>
                <td className="px-3 py-3 font-mono text-slate-400">
                  {iss.issueDate}
                </td>
                <td className="px-3 py-3 font-semibold text-slate-200">
                  {iss.warehouseName}
                </td>
                <td className="px-3 py-3 font-semibold text-white">
                  {iss.department}
                </td>
                <td className="px-3 py-3">
                  <span className="font-semibold text-slate-200 block">{iss.recipientName}</span>
                  <span className="text-[10px] text-slate-400">{iss.purpose}</span>
                </td>
                <td className="px-3 py-3">
                  <div className="space-y-1">
                    {iss.items.map((it, idx) => (
                      <div key={idx} className="text-slate-300 font-medium">
                        {it.itemName} <span className="font-mono text-emerald-300 font-bold">({it.quantity} {it.uom})</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-mono font-bold text-emerald-400">
                  ৳{(iss.totalCost ?? 0).toLocaleString()}
                </td>
                <td className="px-3 py-3 font-mono font-bold text-amber-400">
                  {iss.journalVoucherNumber || `JV-ISS-${iss.id.slice(-4)}`}
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    onClick={() => {
                      setSelectedIssueForPrint(iss);
                      setTimeout(() => window.print(), 300);
                    }}
                    className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ml-auto"
                    title="Instant Print Store Issue Slip"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Slip</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Issue Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                Issue Stock & Auto-Post Accounting JV
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateIssue} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Issuing Store *</label>
                <select
                  value={form.warehouseId}
                  onChange={e => setForm({ ...form, warehouseId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Target Department *</label>
                <select
                  value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Kitchen Production">Kitchen Production</option>
                  <option value="Bar & Lounge">Bar & Lounge</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Banquet & Events">Banquet & Events</option>
                  <option value="Maintenance & Engineering">Maintenance & Engineering</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-bold block">Item to Issue *</label>
                  {itemSearchTerm && (
                    <span className="text-[10px] text-emerald-400 font-medium">
                      {filteredItemsForIssue.length} matching items
                    </span>
                  )}
                </div>
                
                {/* Search / Type filter */}
                <div className="relative mb-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Type to filter items by name or SKU..."
                    value={itemSearchTerm}
                    onChange={e => setItemSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg text-xs text-white placeholder-slate-500 outline-none"
                  />
                  {itemSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setItemSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={form.itemId}
                  onChange={e => setForm({ ...form, itemId: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="" className="bg-slate-900 text-slate-400">-- Choose Item ({filteredItemsForIssue.length} available) --</option>
                  {filteredItemsForIssue.map(i => (
                    <option key={i.id} value={i.id} className="bg-slate-900 text-white">
                      {i.name} ({i.itemCode}) - Stock: {i.currentTotalStock} {i.uomCode || (i as any).primaryUom || 'Units'} - ৳{i.averageCost}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={form.recipientName}
                    onChange={e => setForm({ ...form, recipientName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Consumption Purpose</label>
                <input
                  type="text"
                  value={form.purpose}
                  onChange={e => setForm({ ...form, purpose: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Automatic Accounting Mapping Card */}
              {(() => {
                const gl = getGlAccountInfo(form.department);
                const cost = ((selectedItem?.averageCost || 0) * (Number(form.quantity) || 0));
                return (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-[11px]">
                    <span className="font-bold text-emerald-400 block flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Automatic General Ledger Entry (Double Entry):
                    </span>
                    <div className="flex justify-between text-slate-300">
                      <span>Debit (Dr - Expense):</span>
                      <span className="font-mono text-emerald-400 font-bold">{gl.dr} (৳{(cost || 0).toLocaleString()})</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Credit (Cr - Asset):</span>
                      <span className="font-mono text-amber-400 font-bold">{gl.cr} (৳{(cost || 0).toLocaleString()})</span>
                    </div>
                  </div>
                );
              })()}

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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow"
                >
                  Confirm Issue &amp; Post JV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: INSTANT PRINT STORE ISSUE / CONSUMPTION SLIP
      ======================================================== */}
      {selectedIssueForPrint && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Store Issue Voucher Slip</h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedIssueForPrint.issueNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIssueForPrint(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable White Voucher Slip */}
            <div className="bg-white text-slate-900 p-5 rounded-xl border border-slate-300 shadow-inner space-y-4 print:m-0 print:border-none">
              <div className="text-center border-b border-slate-200 pb-3">
                <span className="text-[10px] tracking-widest uppercase font-bold text-slate-500 block">CCULB RESORT &amp; CONVENTION HALL</span>
                <h4 className="text-base font-extrabold text-slate-900">STORE ISSUE &amp; CONSUMPTION SLIP</h4>
                <p className="text-xs text-slate-600">Voucher Ref: <strong className="font-mono">{selectedIssueForPrint.issueNumber}</strong> | Date: <strong>{selectedIssueForPrint.issueDate}</strong></p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Issuing Store / Warehouse:</span>
                  <span className="font-bold text-slate-900">{selectedIssueForPrint.warehouseName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Receiving Department:</span>
                  <span className="font-bold text-slate-900">{selectedIssueForPrint.department}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Recipient / Custodian:</span>
                  <span className="font-bold text-slate-900">{selectedIssueForPrint.recipientName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">General Ledger Voucher:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedIssueForPrint.journalVoucherNumber || `JV-ISS-${selectedIssueForPrint.id.slice(-4)}`}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold border-b border-slate-200 text-slate-700">
                    <tr>
                      <th className="p-2">Item Description</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Unit Rate</th>
                      <th className="p-2 text-right">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedIssueForPrint.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium text-slate-900">
                          {it.itemName} <span className="font-mono text-[10px] text-slate-500">({it.itemCode})</span>
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">{it.quantity} {it.uom}</td>
                        <td className="p-2 text-right font-mono text-slate-700">৳{it.unitCost.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">৳{it.totalCost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200 font-bold">
                <span className="text-slate-700">Grand Total Value:</span>
                <span className="text-emerald-700 font-mono text-sm">৳{selectedIssueForPrint.totalCost.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-6 text-[10px] text-center text-slate-500 border-t border-dashed border-slate-300">
                <div>
                  <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">Issued By (Store)</div>
                  <span>{selectedIssueForPrint.issuedBy || 'Store In-Charge'}</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">Received By</div>
                  <span>{selectedIssueForPrint.recipientName}</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">Approved By</div>
                  <span>{selectedIssueForPrint.approvedBy || 'Operations Manager'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
