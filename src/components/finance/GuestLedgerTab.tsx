import React, { useState } from 'react';
import {
  Receipt, Search, Download, CheckCircle2, AlertTriangle,
  Clock, BedDouble, User, CreditCard, ChevronRight, DollarSign
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import * as XLSX from 'xlsx';

export const GuestLedgerTab: React.FC = () => {
  const db = pmsService.getState();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Settled'>('All');

  const activeStays = db.stays || [];
  const folios = db.folios || [];

  const ledgerList = folios.map(f => {
    const stay = activeStays.find(s => s.id === f.stayId);
    const room = db.rooms.find(r => r.id === stay?.roomId || r.roomNumber === f.roomNumber);
    return {
      folio: f,
      stay,
      room,
      roomNumber: stay?.roomNumber || f.roomNumber || 'N/A',
      guestName: stay?.guestName || f.guestName || 'Guest',
      status: f.status,
      balance: f.balance,
      totalCharges: f.grandTotal || 0,
      totalPayments: f.paidTotal || 0
    };
  }).filter(item => {
    const matchSearch =
      item.guestName.toLowerCase().includes(search.toLowerCase()) ||
      item.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.folio.folioNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalGuestLedgerOutstanding = ledgerList.filter(l => l.status === 'Open').reduce((sum, l) => sum + l.balance, 0);
  const totalGuestCharges = ledgerList.reduce((sum, l) => sum + l.totalCharges, 0);
  const totalGuestPayments = ledgerList.reduce((sum, l) => sum + l.totalPayments, 0);

  const exportGuestLedger = () => {
    const data = ledgerList.map(l => ({
      'Folio Number': l.folio.folioNumber,
      'Room Number': l.roomNumber,
      'Guest Name': l.guestName,
      'Total Charges (BDT)': l.totalCharges,
      'Total Payments (BDT)': l.totalPayments,
      'Outstanding Balance (BDT)': l.balance,
      'Status': l.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Guest Ledger');
    XLSX.writeFile(wb, `CCULB_Guest_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Active Guest Ledger (GL 1040)</div>
          <div className="mt-2 text-2xl font-bold text-indigo-950 font-mono">৳{(totalGuestLedgerOutstanding || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">In-house guests pending checkout</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Billed Charges</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono">৳{(totalGuestCharges || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">Rooms, F&B, Banquets, Amenities</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Deposits & Payments</div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">৳{(totalGuestPayments || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">Cash, Cards, MFS & Transfers</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">In-House Folios</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono">
            {ledgerList.filter(l => l.status === 'Open').length}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">Active resident accounts</div>
        </div>
      </div>

      {/* Guest Ledger Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search room #, guest name, folio..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1 text-xs">
              <span className="text-gray-400 px-1 font-medium">Status:</span>
              {(['All', 'Open', 'Settled'] as const).map(st => (
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
            onClick={exportGuestLedger}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Guest Ledger
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Folio #</th>
                <th className="py-3 px-4">Room #</th>
                <th className="py-3 px-4">Guest Name</th>
                <th className="py-3 px-4 text-right">Total Charges</th>
                <th className="py-3 px-4 text-right">Payments Received</th>
                <th className="py-3 px-4 text-right">Net Balance (BDT)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ledgerList.map(item => (
                <tr key={item.folio.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-950">
                    {item.folio.folioNumber}
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-900">
                    Room {item.roomNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-900">{item.guestName}</div>
                    <div className="text-[10px] text-gray-400 font-mono">Stay: {item.stay?.stayNumber || 'N/A'}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-gray-800">
                    ৳{(item.totalCharges || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                    ৳{(item.totalPayments || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-mono font-bold text-sm ${item.balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      ৳{(item.balance || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      item.status === 'Open'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {item.status}
                    </span>
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
