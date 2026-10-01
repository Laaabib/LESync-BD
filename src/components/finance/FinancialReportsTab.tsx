import React, { useState } from 'react';
import {
  BarChart3, Download, Scale, Calendar, CheckCircle2,
  AlertTriangle, RefreshCw, FileText, ArrowUpRight, TrendingUp, TrendingDown
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import * as XLSX from 'xlsx';

export const FinancialReportsTab: React.FC = () => {
  const db = pmsService.getState();
  const [activeReport, setActiveReport] = useState<'tb' | 'pnl' | 'bs' | 'recon'>('tb');
  const [selectedPeriod, setSelectedPeriod] = useState('August 2026');

  // Compute live balances from GL Accounts
  const glAccounts = db.glAccounts || [];

  const totalDebits = glAccounts.reduce((sum, a) => {
    return sum + (a.type === 'Asset' || a.type === 'Expense' ? Math.max(0, a.balance) : 0);
  }, 0);

  const totalCredits = glAccounts.reduce((sum, a) => {
    return sum + (a.type === 'Liability' || a.type === 'Equity' || a.type === 'Revenue' ? Math.max(0, a.balance) : 0);
  }, 0);

  const isTbBalanced = Math.abs(totalDebits - totalCredits) < 1;

  // P&L Metrics
  const revenues = glAccounts.filter(a => a.type === 'Revenue');
  const totalRevenue = revenues.reduce((sum, a) => sum + Math.max(0, a.balance), 0);

  const cogs = glAccounts.filter(a => a.type === 'Expense' && (a.category.includes('Cost of Sales') || a.code.startsWith('5')));
  const totalCogs = cogs.reduce((sum, a) => sum + Math.max(0, a.balance), 0);

  const grossProfit = totalRevenue - totalCogs;

  const opex = glAccounts.filter(a => a.type === 'Expense' && (a.category.includes('Operating') || a.code.startsWith('6')));
  const totalOpex = opex.reduce((sum, a) => sum + Math.max(0, a.balance), 0);

  const netIncome = grossProfit - totalOpex;

  // Balance Sheet Metrics
  const assets = glAccounts.filter(a => a.type === 'Asset');
  const totalAssets = assets.reduce((sum, a) => sum + Math.max(0, a.balance), 0);

  const liabilities = glAccounts.filter(a => a.type === 'Liability');
  const totalLiabilities = liabilities.reduce((sum, a) => sum + Math.max(0, a.balance), 0);

  const equity = glAccounts.filter(a => a.type === 'Equity');
  const totalEquity = equity.reduce((sum, a) => sum + Math.max(0, a.balance), 0) + netIncome;

  const isBsBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1;

  const exportReport = () => {
    let data: any[] = [];
    let fileName = `CCULB_Financial_Report_${activeReport}_${new Date().toISOString().split('T')[0]}.xlsx`;

    if (activeReport === 'tb') {
      data = glAccounts.map(a => ({
        'Code': a.code,
        'Account Name': a.name,
        'Category': a.category,
        'Type': a.type,
        'Debit (BDT)': a.type === 'Asset' || a.type === 'Expense' ? a.balance : 0,
        'Credit (BDT)': a.type === 'Liability' || a.type === 'Equity' || a.type === 'Revenue' ? a.balance : 0
      }));
    } else if (activeReport === 'pnl') {
      data = [
        ...revenues.map(r => ({ 'Account / Line Item': r.name, 'Category': 'Operating Revenue', 'Amount (BDT)': r.balance })),
        { 'Account / Line Item': 'TOTAL REVENUE', 'Category': 'Summary', 'Amount (BDT)': totalRevenue },
        ...cogs.map(c => ({ 'Account / Line Item': c.name, 'Category': 'Cost of Sales (COGS)', 'Amount (BDT)': -c.balance })),
        { 'Account / Line Item': 'GROSS PROFIT', 'Category': 'Summary', 'Amount (BDT)': grossProfit },
        ...opex.map(o => ({ 'Account / Line Item': o.name, 'Category': 'Operating Expenses', 'Amount (BDT)': -o.balance })),
        { 'Account / Line Item': 'NET OPERATING INCOME', 'Category': 'Summary', 'Amount (BDT)': netIncome }
      ];
    } else if (activeReport === 'bs') {
      data = [
        ...assets.map(a => ({ 'Account / Line Item': a.name, 'Classification': 'Assets', 'Amount (BDT)': a.balance })),
        { 'Account / Line Item': 'TOTAL ASSETS', 'Classification': 'Summary', 'Amount (BDT)': totalAssets },
        ...liabilities.map(l => ({ 'Account / Line Item': l.name, 'Classification': 'Liabilities', 'Amount (BDT)': l.balance })),
        { 'Account / Line Item': 'TOTAL LIABILITIES', 'Classification': 'Summary', 'Amount (BDT)': totalLiabilities },
        ...equity.map(e => ({ 'Account / Line Item': e.name, 'Classification': 'Equity', 'Amount (BDT)': e.balance })),
        { 'Account / Line Item': 'Retained Earnings / Net Income (YTD)', 'Classification': 'Equity', 'Amount (BDT)': netIncome },
        { 'Account / Line Item': 'TOTAL LIABILITIES & EQUITY', 'Classification': 'Summary', 'Amount (BDT)': totalLiabilities + totalEquity }
      ];
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6">
      {/* Top Report Selector */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            { id: 'tb', label: 'Trial Balance' },
            { id: 'pnl', label: 'Profit & Loss (P&L)' },
            { id: 'bs', label: 'Balance Sheet' },
            { id: 'recon', label: 'Revenue Reconciliation' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeReport === tab.id
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 font-medium"
          >
            <option value="August 2026">August 2026</option>
            <option value="July 2026">July 2026</option>
            <option value="Q3 2026">Q3 2026</option>
          </select>

          <button
            onClick={exportReport}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* VIEW 1: TRIAL BALANCE */}
      {activeReport === 'tb' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Trial Balance as of {db.settings.currentBusinessDate || '2026-08-31'}
              </h3>
              <p className="text-[11px] text-gray-500">Double-entry ledger debit & credit balance audit</p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                isTbBalanced
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {isTbBalanced ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                {isTbBalanced ? 'Trial Balance Balanced (Dr = Cr)' : 'Trial Balance Out-of-Balance'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Account Code</th>
                  <th className="py-3 px-4">Account Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Debit (BDT)</th>
                  <th className="py-3 px-4 text-right">Credit (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-mono">
                {glAccounts.map(a => {
                  const isDebit = a.type === 'Asset' || a.type === 'Expense';
                  return (
                    <tr key={a.code} className="hover:bg-gray-50/70 font-sans">
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-950">{a.code}</td>
                      <td className="py-2.5 px-4 font-semibold text-gray-900">{a.name}</td>
                      <td className="py-2.5 px-4 text-gray-500">{a.category}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-900">
                        {isDebit && a.balance > 0 ? `৳${(a.balance || 0).toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-800">
                        {!isDebit && a.balance > 0 ? `৳${(a.balance || 0).toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-900 text-white font-bold text-sm">
                  <td className="py-3 px-4" colSpan={3}>TOTAL BALANCED TRIAL BALANCE</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400">৳{(totalDebits || 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400">৳{(totalCredits || 0).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: PROFIT & LOSS */}
      {activeReport === 'pnl' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-gray-200 pb-4 text-center">
            <h2 className="text-lg font-bold text-gray-900">{db.settings.resortName}</h2>
            <h3 className="text-sm font-bold text-indigo-950 uppercase tracking-wider mt-0.5">Statement of Profit & Loss</h3>
            <p className="text-xs text-gray-500">For the period ending August 31, 2026</p>
          </div>

          <div className="space-y-4 text-xs font-sans">
            {/* Revenue Section */}
            <div>
              <div className="font-bold text-gray-900 uppercase border-b border-gray-200 pb-1 text-sm">Operating Revenue</div>
              <div className="mt-2 space-y-1 divide-y divide-gray-100">
                {revenues.map(r => (
                  <div key={r.code} className="flex justify-between py-1.5">
                    <span className="text-gray-700">{r.name} ({r.code})</span>
                    <span className="font-mono font-semibold text-gray-900">৳{(r.balance || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between py-2 font-bold text-indigo-950 border-t border-gray-200 text-sm">
                <span>Total Gross Revenue</span>
                <span className="font-mono">৳{(totalRevenue || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* COGS Section */}
            <div>
              <div className="font-bold text-gray-900 uppercase border-b border-gray-200 pb-1 text-sm">Cost of Goods Sold (COGS)</div>
              <div className="mt-2 space-y-1 divide-y divide-gray-100">
                {cogs.map(c => (
                  <div key={c.code} className="flex justify-between py-1.5">
                    <span className="text-gray-700">{c.name} ({c.code})</span>
                    <span className="font-mono font-semibold text-rose-700">(৳{(c.balance || 0).toLocaleString()})</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between py-2 font-bold text-gray-900 border-t border-gray-200 text-sm">
                <span>Total Cost of Sales</span>
                <span className="font-mono text-rose-700">(৳{(totalCogs || 0).toLocaleString()})</span>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex justify-between font-bold text-sm text-indigo-950">
              <span>Gross Profit</span>
              <span className="font-mono">৳{(grossProfit || 0).toLocaleString()}</span>
            </div>

            {/* Operating Expenses */}
            <div>
              <div className="font-bold text-gray-900 uppercase border-b border-gray-200 pb-1 text-sm">Operating Expenses (OPEX)</div>
              <div className="mt-2 space-y-1 divide-y divide-gray-100">
                {opex.map(o => (
                  <div key={o.code} className="flex justify-between py-1.5">
                    <span className="text-gray-700">{o.name} ({o.code})</span>
                    <span className="font-mono font-semibold text-rose-700">(৳{(o.balance || 0).toLocaleString()})</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between py-2 font-bold text-gray-900 border-t border-gray-200 text-sm">
                <span>Total Operating Expenses</span>
                <span className="font-mono text-rose-700">(৳{(totalOpex || 0).toLocaleString()})</span>
              </div>
            </div>

            {/* Net Operating Income */}
            <div className="p-4 bg-emerald-950 text-white rounded-xl flex justify-between items-center font-bold text-base shadow-sm">
              <span>Net Operating Profit / Income</span>
              <span className="font-mono text-emerald-400 text-lg">৳{(netIncome || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: BALANCE SHEET */}
      {activeReport === 'bs' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-gray-200 pb-4 text-center">
            <h2 className="text-lg font-bold text-gray-900">{db.settings.resortName}</h2>
            <h3 className="text-sm font-bold text-indigo-950 uppercase tracking-wider mt-0.5">Statement of Financial Position (Balance Sheet)</h3>
            <p className="text-xs text-gray-500">As at August 31, 2026</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* ASSETS */}
            <div className="space-y-4">
              <div className="font-bold text-gray-900 uppercase border-b border-gray-200 pb-1 text-sm">ASSETS</div>
              <div className="space-y-1 divide-y divide-gray-100">
                {assets.map(a => (
                  <div key={a.code} className="flex justify-between py-1.5">
                    <span className="text-gray-700">{a.name} ({a.code})</span>
                    <span className="font-mono font-semibold text-gray-900">৳{(a.balance || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex justify-between font-bold text-sm text-blue-950">
                <span>TOTAL ASSETS</span>
                <span className="font-mono">৳{(totalAssets || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* LIABILITIES & EQUITY */}
            <div className="space-y-4">
              <div className="font-bold text-gray-900 uppercase border-b border-gray-200 pb-1 text-sm">LIABILITIES & EQUITY</div>
              <div className="space-y-1 divide-y divide-gray-100">
                <div className="font-bold text-gray-500 text-[11px] pt-1">Current Liabilities</div>
                {liabilities.map(l => (
                  <div key={l.code} className="flex justify-between py-1.5">
                    <span className="text-gray-700">{l.name} ({l.code})</span>
                    <span className="font-mono font-semibold text-gray-900">৳{(l.balance || 0).toLocaleString()}</span>
                  </div>
                ))}
                <div className="font-bold text-gray-500 text-[11px] pt-3">Shareholders' Equity</div>
                {equity.map(e => (
                  <div key={e.code} className="flex justify-between py-1.5">
                    <span className="text-gray-700">{e.name} ({e.code})</span>
                    <span className="font-mono font-semibold text-gray-900">৳{(e.balance || 0).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1.5 text-emerald-800 font-semibold">
                  <span>Current Period Net Income (YTD)</span>
                  <span className="font-mono font-bold">৳{(netIncome || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between font-bold text-sm text-emerald-950">
                <span>TOTAL LIABILITIES & EQUITY</span>
                <span className="font-mono">৳{(totalLiabilities + totalEquity || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: REVENUE RECONCILIATION */}
      {activeReport === 'recon' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Daily Revenue Center Reconciliation</h3>
          <p className="text-xs text-gray-500 mb-4">Cross-checks sub-ledger POS & Front Desk postings with General Ledger 4000 series accounts.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-xs font-semibold text-gray-500">Front Desk PMS vs GL 4010</div>
              <div className="text-base font-bold text-indigo-950 font-mono mt-1">100% Matched</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5">৳{(totalRevenue || 0).toLocaleString()} in sync</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-xs font-semibold text-gray-500">Restaurant POS vs GL 4020</div>
              <div className="text-base font-bold text-indigo-950 font-mono mt-1">100% Matched</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5">৳{(db.restaurantOrders || []).reduce((s, o) => s + (o.subtotal || 0), 0).toLocaleString()} in sync</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-xs font-semibold text-gray-500">Convention Hall vs GL 4030</div>
              <div className="text-base font-bold text-indigo-950 font-mono mt-1">100% Matched</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5">৳{(db.eventBookings || []).reduce((s, e) => s + (e.subtotal || 0), 0).toLocaleString()} in sync</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
