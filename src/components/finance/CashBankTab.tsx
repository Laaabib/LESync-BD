import React, { useState } from 'react';
import {
  DollarSign, Landmark, Smartphone, Search, Plus,
  CheckCircle2, AlertTriangle, ArrowRightLeft, RefreshCw,
  Scale, ShieldCheck, Download, ChevronRight, Check, X
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import * as XLSX from 'xlsx';

interface BankAccountInfo {
  id: string;
  name: string;
  accountNumber: string;
  type: 'Bank' | 'Cash' | 'MFS';
  glCode: string;
  bookBalance: number;
  statementBalance: number;
  unreconciledItems: number;
  currency: string;
}

interface CashBankTabProps {
  onOpenNewAccountHead?: () => void;
}

export const CashBankTab: React.FC<CashBankTabProps> = ({ onOpenNewAccountHead }) => {
  const db = pmsService.getState();
  const [selectedAcc, setSelectedAcc] = useState<string>('acc-1');
  const [isReconModalOpen, setIsReconModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Bank & Cash accounts setup
  const accounts: BankAccountInfo[] = [
    {
      id: 'acc-1',
      name: 'Dutch-Bangla Bank Ltd (DBBL)',
      accountNumber: '115.120.0094812',
      type: 'Bank',
      glCode: '1020',
      bookBalance: 4850000,
      statementBalance: 4850000,
      unreconciledItems: 0,
      currency: 'BDT'
    },
    {
      id: 'acc-2',
      name: 'City Bank Ltd - Corporate CD',
      accountNumber: '310.229.440192',
      type: 'Bank',
      glCode: '1020',
      bookBalance: 3200000,
      statementBalance: 3185000,
      unreconciledItems: 2,
      currency: 'BDT'
    },
    {
      id: 'acc-3',
      name: 'BRAC Bank - Operations',
      accountNumber: '150.120.339100',
      type: 'Bank',
      glCode: '1020',
      bookBalance: 2150000,
      statementBalance: 2150000,
      unreconciledItems: 0,
      currency: 'BDT'
    },
    {
      id: 'acc-4',
      name: 'Front Office Cash Float & Safe Vault',
      accountNumber: 'CASH-VAULT-01',
      type: 'Cash',
      glCode: '1010',
      bookBalance: 450000,
      statementBalance: 450000,
      unreconciledItems: 0,
      currency: 'BDT'
    },
    {
      id: 'acc-5',
      name: 'Petty Cash Float (Admin & HK)',
      accountNumber: 'PETTY-FLOAT-01',
      type: 'Cash',
      glCode: '1015',
      bookBalance: 50000,
      statementBalance: 50000,
      unreconciledItems: 0,
      currency: 'BDT'
    },
    {
      id: 'acc-6',
      name: 'bKash Merchant Account',
      accountNumber: '01713-456789',
      type: 'MFS',
      glCode: '1025',
      bookBalance: 680000,
      statementBalance: 680000,
      unreconciledItems: 0,
      currency: 'BDT'
    },
    {
      id: 'acc-7',
      name: 'Nagad Business Merchant',
      accountNumber: '01819-998877',
      type: 'MFS',
      glCode: '1025',
      bookBalance: 320000,
      statementBalance: 320000,
      unreconciledItems: 0,
      currency: 'BDT'
    }
  ];

  const totalLiquidity = accounts.reduce((sum, a) => sum + a.bookBalance, 0);
  const totalBank = accounts.filter(a => a.type === 'Bank').reduce((sum, a) => sum + a.bookBalance, 0);
  const totalCash = accounts.filter(a => a.type === 'Cash').reduce((sum, a) => sum + a.bookBalance, 0);
  const totalMfs = accounts.filter(a => a.type === 'MFS').reduce((sum, a) => sum + a.bookBalance, 0);

  // Bank reconciliation mock items
  const [reconItems, setReconItems] = useState([
    { id: 'rc-1', date: '2026-08-30', ref: 'DEP-8891', desc: 'Guest Advance Deposit - Dutch-Bangla', amount: 45000, type: 'Credit', matched: true },
    { id: 'rc-2', date: '2026-08-31', ref: 'POS-7712', desc: 'City Bank POS Settlement Batch #41', amount: 15000, type: 'Credit', matched: false },
    { id: 'rc-3', date: '2026-08-31', ref: 'CHQ-0019', desc: 'Vendor Payment - Meghna Agro Supplies', amount: -28000, type: 'Debit', matched: true },
    { id: 'rc-4', date: '2026-08-31', ref: 'BNK-CHG', desc: 'Bank Service Charges & Excise Duty', amount: -2500, type: 'Debit', matched: false }
  ]);

  const handleToggleMatch = (id: string) => {
    setReconItems(prev => prev.map(item => item.id === id ? { ...item, matched: !item.matched } : item));
  };

  const handleCompleteReconciliation = () => {
    setIsReconModalOpen(false);
    setFeedback('Bank statement reconciliation completed & verified.');
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-indigo-900" />
            Treasury, Cash & Bank Accounts
          </h2>
          <p className="text-xs text-gray-500">
            Monitor real-time cash drawer floats, commercial bank balances, and MFS wallets
          </p>
        </div>
        {onOpenNewAccountHead && (
          <button
            onClick={onOpenNewAccountHead}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Bank / Cash Account Head
          </button>
        )}
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {feedback}
        </div>
      )}

      {/* Liquidity KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Cash & Bank Liquidity</div>
          <div className="mt-2 text-2xl font-bold text-indigo-950 font-mono">৳{(totalLiquidity || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">Across {accounts.length} operational accounts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Bank Accounts (GL 1020)</div>
          <div className="mt-2 text-2xl font-bold text-blue-900 font-mono">৳{(totalBank || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">DBBL, City Bank & BRAC Bank</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Cash in Hand & Floats</div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">৳{(totalCash || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">Front Desk & Petty Cash</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">MFS Wallets (bKash/Nagad)</div>
          <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">৳{(totalMfs || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-gray-500">Digital merchant wallets</div>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => (
          <div
            key={acc.id}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              selectedAcc === acc.id
                ? 'bg-white border-indigo-900 shadow-md ring-2 ring-indigo-900/10'
                : 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
            }`}
            onClick={() => setSelectedAcc(acc.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${
                  acc.type === 'Bank'
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : acc.type === 'Cash'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {acc.type === 'Bank' ? <Landmark className="w-5 h-5" /> : acc.type === 'Cash' ? <DollarSign className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{acc.name}</h4>
                  <p className="text-[11px] text-gray-400 font-mono">{acc.accountNumber} • GL {acc.glCode}</p>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                acc.unreconciledItems === 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {acc.unreconciledItems === 0 ? 'Reconciled' : `${acc.unreconciledItems} Unmatched`}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-gray-400 font-medium">Book Balance</div>
                <div className="text-lg font-bold text-gray-900 font-mono">৳{(acc.bookBalance || 0).toLocaleString()}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsReconModalOpen(true);
                }}
                className="px-2.5 py-1 text-xs font-semibold text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center gap-1"
              >
                <Scale className="w-3.5 h-3.5" />
                Reconcile
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bank Reconciliation Modal */}
      {isReconModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Bank Statement Reconciliation</h2>
                <p className="text-xs text-gray-500">Dutch-Bangla Bank Ltd (A/C: 115.120.0094812)</p>
              </div>
              <button onClick={() => setIsReconModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">✕</button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-xs text-gray-500">General Ledger Book Balance</div>
                <div className="text-base font-bold text-gray-900 font-mono mt-0.5">৳4,850,000</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="text-xs text-blue-700">Bank Statement Balance</div>
                <div className="text-base font-bold text-blue-950 font-mono mt-0.5">৳4,850,000</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-xs text-emerald-700">Reconciliation Variance</div>
                <div className="text-base font-bold text-emerald-950 font-mono mt-0.5">৳0 (Balanced)</div>
              </div>
            </div>

            <div className="mt-5">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Unmatched / In-Flight Bank Transactions</h4>
              <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Ref #</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Amount (BDT)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reconItems.map(item => (
                      <tr key={item.id} className={item.matched ? 'bg-emerald-50/30' : ''}>
                        <td className="py-2.5 px-3 text-gray-600">{item.date}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-950">{item.ref}</td>
                        <td className="py-2.5 px-3 text-gray-800">{item.desc}</td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${item.amount > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          ৳{(Math.abs(item.amount) || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.matched ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {item.matched ? 'Matched' : 'Unmatched'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleToggleMatch(item.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              item.matched
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {item.matched ? 'Unmatch' : 'Mark Match'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => setIsReconModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteReconciliation}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-xs"
              >
                Save Reconciliation Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
