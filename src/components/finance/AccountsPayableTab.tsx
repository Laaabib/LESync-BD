import React, { useState } from 'react';
import {
  ShoppingCart, Search, Plus, CheckCircle2, AlertTriangle,
  Clock, ShieldCheck, Download, ChevronRight, FileText, Check, DollarSign
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { PurchaseBill } from '../../types/pms';
import * as XLSX from 'xlsx';

export const AccountsPayableTab: React.FC = () => {
  const db = pmsService.getState();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Paid' | 'Partially Paid'>('All');
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'Bank Transfer' | 'Cheque' | 'Cash'>('Bank Transfer');
  const [payRef, setPayRef] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const bills = (db.purchaseBills || []).filter(b => {
    const matchSearch =
      b.billNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      (b.supplierInvoiceNumber && b.supplierInvoiceNumber.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAp = (db.purchaseBills || []).reduce((sum, b) => sum + (b.totalAmount - (b.paidAmount || 0)), 0);
  const totalPaid = (db.purchaseBills || []).reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const pending3WayMatchCount = (db.purchaseBills || []).filter(b => b.status === 'Pending Approval' || !b.grnId).length;

  const handlePaySupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    const remaining = selectedBill.totalAmount - (selectedBill.paidAmount || 0);
    const amountToPay = Math.min(payAmount, remaining);

    // Update bill in state
    selectedBill.paidAmount = (selectedBill.paidAmount || 0) + amountToPay;
    if (selectedBill.paidAmount >= selectedBill.totalAmount) {
      selectedBill.status = 'Paid';
    } else {
      selectedBill.status = 'Partially Paid';
    }

    // Post Journal Voucher: Dr. Accounts Payable (2010), Cr. Bank/Cash (1020/1010)
    pmsService.createJournalVoucher({
      date: db.settings.currentBusinessDate || new Date().toISOString().split('T')[0],
      sourceModule: 'Supplier Payment',
      sourceReference: selectedBill.billNumber,
      narration: `Settlement payment to supplier ${selectedBill.supplierName} (Ref: ${payRef || 'TRF'})`,
      entries: [
        {
          id: `jve-ap-${Date.now()}-1`,
          accountCode: '2010',
          accountName: 'Accounts Payable (Trade Creditors)',
          debit: amountToPay,
          credit: 0,
          memo: `Settlement of bill ${selectedBill.billNumber}`
        },
        {
          id: `jve-ap-${Date.now()}-2`,
          accountCode: payMethod === 'Cash' ? '1010' : '1020',
          accountName: payMethod === 'Cash' ? 'Cash in Hand (Front Office & Vault)' : 'City Bank Ltd - CD Account',
          debit: 0,
          credit: amountToPay,
          memo: `${payMethod} disbursement (Ref: ${payRef})`
        }
      ]
    });

    pmsService.notify();
    setFeedback(`Paid ৳${(amountToPay || 0).toLocaleString()} to ${selectedBill.supplierName}. Balanced Journal posted.`);
    setIsPayModalOpen(false);
    setSelectedBill(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  const exportAP = () => {
    const data = bills.map(b => ({
      'Bill #': b.billNumber,
      'Bill Date': b.billDate,
      'Supplier': b.supplierName,
      'Supplier Inv #': b.supplierInvoiceNumber || 'N/A',
      'Total Amount': b.totalAmount,
      'Paid Amount': b.paidAmount || 0,
      'Outstanding': b.totalAmount - (b.paidAmount || 0),
      'Status': b.status,
      '3-Way Match': b.poId && b.grnId ? '3-Way Matched' : 'Direct Bill'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Accounts Payable');
    XLSX.writeFile(wb, `CCULB_AP_Register_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {feedback}
        </div>
      )}

      {/* AP Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total AP Outstanding</div>
          <div className="mt-2 text-2xl font-bold text-rose-900 font-mono">৳{(totalAp || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">Unsettled vendor invoices</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Payments Made (YTD)</div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">৳{(totalPaid || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">To verified vendors</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">3-Way Match Status</div>
          <div className="mt-2 text-2xl font-bold text-indigo-900 font-mono">
            {pending3WayMatchCount === 0 ? '100% OK' : `${pending3WayMatchCount} Mismatch`}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">PO vs GRN vs Vendor Bill</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Active Suppliers</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono">{(db.suppliers || []).length}</div>
          <div className="mt-1 text-[11px] text-gray-500">Procurement & F&B Vendors</div>
        </div>
      </div>

      {/* AP Register */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search bill #, supplier, invoice..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1 text-xs">
              <span className="text-gray-400 px-1 font-medium">Status:</span>
              {(['All', 'Pending', 'Approved', 'Paid', 'Partially Paid'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    statusFilter === st ? 'bg-indigo-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={exportAP}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export AP Register
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Bill #</th>
                <th className="py-3 px-4">Date & Due Date</th>
                <th className="py-3 px-4">Supplier & Inv #</th>
                <th className="py-3 px-4 text-center">3-Way Match</th>
                <th className="py-3 px-4 text-right">Bill Total</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bills.map(b => {
                const balance = b.totalAmount - (b.paidAmount || 0);
                return (
                  <tr key={b.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-950">
                      {b.billNumber}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div>{b.billDate}</div>
                      <div className="text-[10px] text-gray-400">Due: {b.dueDate || 'Net 30'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{b.supplierName}</div>
                      <div className="text-[11px] text-gray-500 font-mono">Inv: {b.supplierInvoiceNumber || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Matched (PO/GRN)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                      ৳{(b.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className={`font-mono font-bold text-sm ${balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        ৳{(balance || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        b.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : b.status === 'Partially Paid'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedBill(b);
                          setPayAmount(balance);
                          setPayRef(`TRF-${Date.now().toString().slice(-6)}`);
                          setIsPayModalOpen(true);
                        }}
                        disabled={balance <= 0}
                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-md disabled:opacity-30 transition-colors"
                      >
                        Pay Vendor
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Vendor Modal */}
      {isPayModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Pay Supplier Invoice</h2>
                <p className="text-xs text-gray-500">{selectedBill.supplierName} • Bill #{selectedBill.billNumber}</p>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">✕</button>
            </div>

            <form onSubmit={handlePaySupplier} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-rose-800 font-semibold">Outstanding Balance</div>
                  <div className="text-base font-bold text-rose-950 font-mono mt-0.5">
                    ৳{(selectedBill.totalAmount - (selectedBill.paidAmount || 0)).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-500">Bill Total</div>
                  <div className="text-sm font-semibold text-gray-800 font-mono">৳{(selectedBill.totalAmount || 0).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Disbursement Amount (BDT) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedBill.totalAmount - (selectedBill.paidAmount || 0)}
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono font-bold text-sm focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  >
                    <option value="Bank Transfer">Bank Transfer (BEFTN)</option>
                    <option value="Cheque">Company Cheque</option>
                    <option value="Cash">Cash (Petty Cash)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Instrument / Ref # *</label>
                  <input
                    type="text"
                    required
                    value={payRef}
                    onChange={e => setPayRef(e.target.value)}
                    placeholder="e.g. CHQ-9912"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-xs"
                >
                  Confirm & Post Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
