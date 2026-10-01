import React, { useState } from 'react';
import {
  FileText, Search, Download, Printer, CheckCircle2,
  Building, User, DollarSign, Calendar, Eye
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { Payment } from '../../types/pms';

export const FinanceReceiptsTab: React.FC = () => {
  const db = pmsService.getState();
  const [search, setSearch] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

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
    return (
      receiptNum.toLowerCase().includes(search.toLowerCase()) ||
      guestName.toLowerCase().includes(search.toLowerCase()) ||
      (p.reference && p.reference.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if ((num = num.toString() as any).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (Number(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Taka Only' : 'Taka Only';
    return str;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Official Money Receipts & Vouchers</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Auto-sequenced official monetary receipts for room folios, event bookings, and corporate settlements.
          </p>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search money receipt # or guest..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Received From</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount (BDT)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-950">
                    {p.transactionNumber || `MR-${p.id.slice(0, 8)}`}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {p.createdAt ? p.createdAt.split('T')[0] : '2026-08-31'}
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    {getGuestName(p)}
                  </td>
                  <td className="py-3 px-4 text-gray-700 font-medium">
                    {p.method} {p.reference ? `(${p.reference})` : ''}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-sm text-emerald-700">
                    ৳{(p.amount || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedPayment(p)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-1 mx-auto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Money Receipt Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Official Money Receipt</span>
              <button onClick={() => setSelectedPayment(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">✕</button>
            </div>

            {/* Printable Receipt Card */}
            <div className="mt-4 p-5 bg-amber-50/40 border-2 border-dashed border-amber-300 rounded-2xl text-xs space-y-4">
              <div className="text-center border-b border-amber-200 pb-3">
                <h2 className="text-base font-bold text-gray-900">{db.settings.resortName}</h2>
                <p className="text-[11px] text-gray-500">{db.settings.address}</p>
                <div className="inline-block mt-2 px-3 py-0.5 bg-indigo-900 text-white font-bold text-[10px] rounded-full uppercase tracking-wider">
                  Money Receipt
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-gray-700">
                <div>
                  <span className="text-gray-400 font-medium">Receipt No: </span>
                  <span className="font-mono font-bold text-gray-900">{selectedPayment.transactionNumber || `MR-${selectedPayment.id.slice(0, 8)}`}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 font-medium">Date: </span>
                  <span className="font-medium text-gray-900">{selectedPayment.createdAt ? selectedPayment.createdAt.split('T')[0] : '2026-08-31'}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-gray-800">
                <div>
                  <span className="text-gray-400">Received with thanks from: </span>
                  <span className="font-bold text-gray-900">{getGuestName(selectedPayment)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Amount in Words: </span>
                  <span className="italic font-semibold text-gray-900">{numberToWords(selectedPayment.amount)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Payment Mode: </span>
                  <span className="font-semibold text-gray-900">{selectedPayment.method} {selectedPayment.reference ? `(${selectedPayment.reference})` : ''}</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-amber-200 rounded-xl flex items-center justify-between">
                <span className="font-bold text-gray-700">Total Received</span>
                <span className="text-lg font-bold font-mono text-emerald-800">৳{(selectedPayment.amount || 0).toLocaleString()}</span>
              </div>

              <div className="pt-6 flex justify-between text-[10px] text-gray-400 border-t border-amber-200">
                <div className="text-center">
                  <div className="w-24 border-b border-gray-400 mb-1"></div>
                  <span>Guest Signature</span>
                </div>
                <div className="text-center">
                  <div className="w-24 border-b border-gray-400 mb-1"></div>
                  <span>Authorized Cashier</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Official Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
