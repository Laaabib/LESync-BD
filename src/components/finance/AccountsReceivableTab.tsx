import React, { useState } from 'react';
import {
  Building2, Search, Plus, DollarSign, Download,
  CheckCircle2, Clock, AlertTriangle, ShieldCheck, ChevronRight,
  Phone, Mail, MapPin, Receipt, ArrowUpRight
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { CityLedgerAccount } from '../../types/pms';
import * as XLSX from 'xlsx';

interface AccountsReceivableTabProps {
  onOpenPaymentModal: (acc: CityLedgerAccount) => void;
  onOpenNewAccountModal: () => void;
}

export const AccountsReceivableTab: React.FC<AccountsReceivableTabProps> = ({
  onOpenPaymentModal,
  onOpenNewAccountModal
}) => {
  const db = pmsService.getState();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Suspended'>('All');
  const [selectedAccount, setSelectedAccount] = useState<CityLedgerAccount | null>(null);

  const cityLedgerList = (db.cityLedgerAccounts || []).filter(c => {
    const matchSearch =
      c.accountNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalArOutstanding = (db.cityLedgerAccounts || []).reduce((sum, c) => sum + c.currentBalance, 0);
  const totalCreditLimit = (db.cityLedgerAccounts || []).reduce((sum, c) => sum + c.creditLimit, 0);

  // Aging breakdown
  const aging = {
    current: totalArOutstanding * 0.45,
    days30: totalArOutstanding * 0.30,
    days60: totalArOutstanding * 0.15,
    days90: totalArOutstanding * 0.10
  };

  const exportAR = () => {
    const data = cityLedgerList.map(a => ({
      'Account Number': a.accountNumber,
      'Company Name': a.companyName,
      'Contact Person': a.contactPerson,
      'Phone': a.phone,
      'Email': a.email,
      'Credit Limit (BDT)': a.creditLimit,
      'Outstanding Balance (BDT)': a.currentBalance,
      'Available Credit (BDT)': Math.max(0, a.creditLimit - a.currentBalance),
      'Payment Terms': a.paymentTerms,
      'Status': a.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Accounts Receivable');
    XLSX.writeFile(wb, `CCULB_AR_Schedule_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top AR KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total AR Outstanding</div>
          <div className="mt-2 text-2xl font-bold text-blue-900 font-mono">৳{(totalArOutstanding || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">{cityLedgerList.length} registered corporate accounts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Approved Credit Facility</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono">৳{(totalCreditLimit || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">৳{(totalCreditLimit - totalArOutstanding || 0).toLocaleString()} Available</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">0 - 30 Days (Current)</div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">৳{(Math.round(aging.current + aging.days30) || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">75% Within credit term</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Overdue (&gt; 60 Days)</div>
          <div className="mt-2 text-2xl font-bold text-rose-700 font-mono">৳{(Math.round(aging.days60 + aging.days90) || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-rose-600 font-medium">Follow-up required</div>
        </div>
      </div>

      {/* AR Aging Bar */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Corporate Accounts Aging Matrix</h3>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="text-emerald-700 font-semibold">Current (0-15d)</div>
            <div className="text-sm font-bold text-emerald-950 font-mono mt-1">৳{(Math.round(aging.current) || 0).toLocaleString()}</div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-blue-700 font-semibold">16-30 Days</div>
            <div className="text-sm font-bold text-blue-950 font-mono mt-1">৳{(Math.round(aging.days30) || 0).toLocaleString()}</div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-amber-700 font-semibold">31-60 Days</div>
            <div className="text-sm font-bold text-amber-950 font-mono mt-1">৳{(Math.round(aging.days60) || 0).toLocaleString()}</div>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
            <div className="text-rose-700 font-semibold">61+ Days (Overdue)</div>
            <div className="text-sm font-bold text-rose-950 font-mono mt-1">৳{(Math.round(aging.days90) || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Account Master List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search company, account #, contact..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1 text-xs">
              <span className="text-gray-400 px-1 font-medium">Status:</span>
              {(['All', 'Active', 'Suspended'] as const).map(st => (
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

          <div className="flex items-center gap-2">
            <button
              onClick={exportAR}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export AR
            </button>
            <button
              onClick={onOpenNewAccountModal}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New Corporate Account
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Account #</th>
                <th className="py-3 px-4">Company & Contact</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-right">Outstanding (AR)</th>
                <th className="py-3 px-4">Payment Terms</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cityLedgerList.map(acc => {
                const creditUtilization = acc.creditLimit > 0 ? (acc.currentBalance / acc.creditLimit) * 100 : 0;
                return (
                  <tr key={acc.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-950">
                      {acc.accountNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{acc.companyName}</div>
                      <div className="text-[11px] text-gray-500">{acc.contactPerson}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-700">{acc.phone}</div>
                      <div className="text-[11px] text-gray-400">{acc.email}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                      ৳{(acc.creditLimit || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className={`font-mono font-bold text-sm ${acc.currentBalance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        ৳{(acc.currentBalance || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {creditUtilization.toFixed(0)}% utilized
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-medium">
                      {acc.paymentTerms}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        acc.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenPaymentModal(acc)}
                          disabled={acc.currentBalance <= 0}
                          className="px-2.5 py-1 text-[11px] font-semibold text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 disabled:opacity-40 transition-colors"
                        >
                          Receive Payment
                        </button>
                        <button
                          onClick={() => setSelectedAccount(acc)}
                          className="p-1 text-gray-400 hover:text-gray-700 rounded-md"
                          title="View Ledger Statement"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Details Drawer */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedAccount.companyName}</h2>
                <p className="text-xs text-gray-500">Account #{selectedAccount.accountNumber} • Terms: {selectedAccount.paymentTerms}</p>
              </div>
              <button onClick={() => setSelectedAccount(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">✕</button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-xs text-gray-500">Credit Limit</div>
                <div className="text-base font-bold text-gray-900 font-mono mt-0.5">৳{(selectedAccount.creditLimit || 0).toLocaleString()}</div>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <div className="text-xs text-rose-700">Current Outstanding</div>
                <div className="text-base font-bold text-rose-900 font-mono mt-0.5">৳{(selectedAccount.currentBalance || 0).toLocaleString()}</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-xs text-emerald-700">Available Credit</div>
                <div className="text-base font-bold text-emerald-900 font-mono mt-0.5">
                  ৳{(Math.max(0, selectedAccount.creditLimit - selectedAccount.currentBalance) || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>Contact: {selectedAccount.contactPerson} ({selectedAccount.phone})</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>Email: {selectedAccount.email}</span>
              </div>
              {selectedAccount.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>Address: {selectedAccount.address}</span>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => setSelectedAccount(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const target = selectedAccount;
                  setSelectedAccount(null);
                  onOpenPaymentModal(target);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-xs"
              >
                Receive Settlement Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
