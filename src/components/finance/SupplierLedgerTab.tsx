import React, { useState } from 'react';
import {
  Users, Search, Download, CheckCircle2, ChevronRight,
  Phone, Mail, MapPin, DollarSign, FileText, ShoppingCart
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { Supplier } from '../../types/pms';
import * as XLSX from 'xlsx';

export const SupplierLedgerTab: React.FC = () => {
  const db = pmsService.getState();
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const getCategory = (s: Supplier) => s.categoriesSupplied?.[0] || 'General Vendor';
  const getBalance = (s: Supplier) => s.currentPayableBalance || 0;
  const getStatus = (s: Supplier) => s.active ? 'Active' : 'Inactive';

  const suppliers = (db.suppliers || []).filter(s => {
    return (
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const totalPayable = suppliers.reduce((sum, s) => sum + getBalance(s), 0);

  const getSupplierBills = (supplierId: string) => {
    return (db.purchaseBills || []).filter(b => b.supplierId === supplierId);
  };

  const exportSupplierLedger = () => {
    const data = suppliers.map(s => ({
      'Supplier Code': s.code,
      'Supplier Name': s.name,
      'Contact Person': s.contactPerson || 'N/A',
      'Phone': s.phone,
      'Category': getCategory(s),
      'Outstanding Balance (BDT)': getBalance(s),
      'Payment Terms': s.paymentTerms,
      'Status': getStatus(s)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Supplier Ledger');
    XLSX.writeFile(wb, `CCULB_Supplier_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Supplier Payables</div>
          <div className="mt-2 text-2xl font-bold text-rose-900 font-mono">৳{(totalPayable || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">{suppliers.length} active registered vendors</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">F&B Raw Material Vendors</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono">
            {suppliers.filter(s => getCategory(s).includes('Food') || getCategory(s).includes('Meat') || getCategory(s).includes('Beverage')).length}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">Daily kitchen & restaurant supply</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Housekeeping & Amenities</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono">
            {suppliers.filter(s => getCategory(s).includes('Housekeeping') || getCategory(s).includes('Linen') || getCategory(s).includes('Amenity')).length}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">Linen, toiletries, chemicals</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Standard Payment Terms</div>
          <div className="mt-2 text-2xl font-bold text-indigo-900 font-mono">Net 15 - 30</div>
          <div className="mt-1 text-[11px] text-gray-500">Credit period granted by vendors</div>
        </div>
      </div>

      {/* Supplier Register */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search supplier name, code, contact..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
            />
          </div>

          <button
            onClick={exportSupplierLedger}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Supplier Ledger
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Supplier Name & Category</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Phone & Email</th>
                <th className="py-3 px-4 text-right">Current Payable</th>
                <th className="py-3 px-4">Payment Terms</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {suppliers.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-950">
                    {s.code}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-900">{s.name}</div>
                    <div className="text-[11px] text-gray-400">{getCategory(s)}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-700 font-medium">
                    {s.contactPerson || 'Vendor Rep'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    <div>{s.phone}</div>
                    <div className="text-[10px] text-gray-400">{s.email}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-sm text-rose-700">
                    ৳{(getBalance(s) || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-gray-700 font-medium">
                    {s.paymentTerms || 'Net 30'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedSupplier(s)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
                    >
                      View Statement
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Statement Drawer */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedSupplier.name}</h2>
                <p className="text-xs text-gray-500">Supplier Statement • Code: {selectedSupplier.code}</p>
              </div>
              <button onClick={() => setSelectedSupplier(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">✕</button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-xs text-gray-500">Total Invoiced Bills</div>
                <div className="text-base font-bold text-gray-900 font-mono mt-0.5">
                  ৳{(getSupplierBills(selectedSupplier.id).reduce((sum, b) => sum + b.totalAmount, 0) || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-xs text-emerald-700">Settlements Paid</div>
                <div className="text-base font-bold text-emerald-900 font-mono mt-0.5">
                  ৳{getSupplierBills(selectedSupplier.id).reduce((sum, b) => sum + (b.paidAmount || 0), 0).toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <div className="text-xs text-rose-700">Outstanding Balance</div>
                <div className="text-base font-bold text-rose-900 font-mono mt-0.5">
                  ৳{(getBalance(selectedSupplier) || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Purchase Bills History</h4>
              <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Bill #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Vendor Inv #</th>
                      <th className="py-2.5 px-3 text-right">Bill Amount</th>
                      <th className="py-2.5 px-3 text-right">Paid</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getSupplierBills(selectedSupplier.id).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-gray-400">No purchase bills found for this supplier.</td>
                      </tr>
                    ) : (
                      getSupplierBills(selectedSupplier.id).map(b => (
                        <tr key={b.id}>
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-950">{b.billNumber}</td>
                          <td className="py-2.5 px-3 text-gray-600">{b.billDate}</td>
                          <td className="py-2.5 px-3 font-mono text-gray-500">{b.supplierInvoiceNumber || 'N/A'}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">৳{(b.totalAmount || 0).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">৳{(b.paidAmount || 0).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end pt-3 border-t border-gray-200">
              <button
                onClick={() => setSelectedSupplier(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
