import React, { useState } from 'react';
import {
  CreditCard, Search, Download, CheckCircle2,
  DollarSign, Landmark, Smartphone, Building2, Calendar
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { Payment } from '../../types/pms';
import * as XLSX from 'xlsx';

export const FinancePaymentsTab: React.FC = () => {
  const db = pmsService.getState();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('All');

  const getGuestName = (p: Payment) => {
    if (p.folioId) {
      const folio = db.folios?.find(f => f.id === p.folioId);
      if (folio?.guestName) return folio.guestName;
      const stay = db.stays?.find(s => s.folioId === p.folioId);
      if (stay?.guestName) return stay.guestName;
    }
    if (p.eventBookingId) {
      const event = db.eventBookings?.find(e => e.id === p.eventBookingId);
      if (event) return event.clientName;
    }
    if (p.reservationId) {
      const res = db.reservations?.find(r => r.id === p.reservationId);
      if (res) return res.guestName;
    }
    return 'Resort Guest';
  };

  const payments = (db.payments || []).filter(p => {
    const guestName = getGuestName(p);
    const receiptNum = p.transactionNumber || p.id;
    const matchSearch =
      receiptNum.toLowerCase().includes(search.toLowerCase()) ||
      guestName.toLowerCase().includes(search.toLowerCase()) ||
      (p.reference && p.reference.toLowerCase().includes(search.toLowerCase()));
    const matchMethod = methodFilter === 'All' || p.method === methodFilter;
    return matchSearch && matchMethod;
  });

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const exportPayments = () => {
    const data = payments.map(p => ({
      'Receipt #': p.transactionNumber || p.id,
      'Date': p.createdAt?.split('T')[0] || '2026-08-31',
      'Guest / Client': getGuestName(p),
      'Method': p.method,
      'Reference': p.reference || 'N/A',
      'Amount (BDT)': p.amount,
      'Status': p.status,
      'Received By': p.createdBy || 'Cashier'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments Register');
    XLSX.writeFile(wb, `CCULB_Payments_Register_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Payments Collected</div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">৳{(totalCollected || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">Across all outlets & billing points</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Cash Collections</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono">
            ৳{(payments.filter(p => p.method === 'Cash').reduce((sum, p) => sum + p.amount, 0) || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">Front Desk & Outlets</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Card / POS Bank</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono">
            ৳{(payments.filter(p => p.method === 'Credit Card' || p.method === 'Bank Transfer').reduce((sum, p) => sum + p.amount, 0) || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">Direct Bank Settlement</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">MFS / Mobile Wallet</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono">
            ৳{(payments.filter(p => p.method === 'bKash' || p.method === 'Nagad').reduce((sum, p) => sum + p.amount, 0) || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">bKash & Nagad Merchant</div>
        </div>
      </div>

      {/* Table & Controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search receipt #, guest, ref..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Method:</span>
              <select
                value={methodFilter}
                onChange={e => setMethodFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 font-medium"
              >
                <option value="All">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="City Ledger">City Ledger</option>
              </select>
            </div>
          </div>

          <button
            onClick={exportPayments}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Payments
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Guest / Corporate Client</th>
                <th className="py-3 px-4">Method & Instrument</th>
                <th className="py-3 px-4 text-right">Amount (BDT)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Cashier / Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-950">
                    {p.transactionNumber || `RCP-${p.id.slice(0, 8)}`}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {p.createdAt ? p.createdAt.replace('T', ' ').slice(0, 16) : '2026-08-31'}
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    {getGuestName(p)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{p.method}</span>
                    {p.reference && <span className="text-gray-400 font-mono text-[10px] ml-1.5">({p.reference})</span>}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-sm text-emerald-700">
                    ৳{(p.amount || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {p.status || 'Completed'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {p.createdBy || 'Front Desk'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
