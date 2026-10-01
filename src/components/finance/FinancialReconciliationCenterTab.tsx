import React, { useState, useEffect } from 'react';
import {
  Scale, CheckCircle2, AlertTriangle, AlertCircle, Clock,
  RefreshCw, FileSpreadsheet, Printer, Download, Search,
  Filter, ShieldCheck, ArrowRight, Check, Sparkles
} from 'lucide-react';
import { accountingEngineService } from '../../services/accountingEngineService';
import * as XLSX from 'xlsx';

export const FinancialReconciliationCenterTab: React.FC = () => {
  const [items, setItems] = useState(() => accountingEngineService.getReconciliationComparison());
  const [statusFilter, setStatusFilter] = useState<'All' | 'MATCHED' | 'WARNING' | 'MISMATCH' | 'UNPOSTED'>('All');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const refresh = () => {
    setItems(accountingEngineService.getReconciliationComparison());
  };

  useEffect(() => {
    const unsub = accountingEngineService.subscribe(() => {
      refresh();
    });
    return unsub;
  }, []);

  const handleInstantReconcile = () => {
    refresh();
    setFeedback('All 9 operational subledgers and control accounts successfully re-scanned and synchronized against General Ledger.');
    setTimeout(() => setFeedback(null), 5000);
  };

  const filteredItems = items.filter(item => {
    const matchStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.source1Name.toLowerCase().includes(search.toLowerCase()) ||
      item.source2Name.toLowerCase().includes(search.toLowerCase()) ||
      item.details.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const matchedCount = items.filter(i => i.status === 'MATCHED').length;
  const warningCount = items.filter(i => i.status === 'WARNING').length;
  const mismatchCount = items.filter(i => i.status === 'MISMATCH').length;
  const unpostedCount = items.filter(i => i.status === 'UNPOSTED').length;

  const exportExcel = () => {
    const data = filteredItems.map(i => ({
      'Reconciliation Area': i.name,
      'Source 1 (Operational Subledger)': i.source1Name,
      'Source 1 Amount (BDT)': i.source1Value,
      'Source 2 (General Ledger Control)': i.source2Name,
      'Source 2 Amount (BDT)': i.source2Value,
      'Variance (BDT)': i.variance,
      'Reconciliation Status': i.status,
      'Audit Details': i.details,
      'Last Reconciled': i.lastReconciledAt
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reconciliation Matrix');
    XLSX.writeFile(wb, `CCULB_Financial_Reconciliation_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportCSV = () => {
    const data = filteredItems.map(i => ({
      Area: i.name,
      Source1: i.source1Name,
      Source1_Amount: i.source1Value,
      Source2: i.source2Name,
      Source2_Amount: i.source2Value,
      Variance: i.variance,
      Status: i.status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CCULB_Reconciliation_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printMatrix = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MATCHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            MATCHED
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            WARNING
          </span>
        );
      case 'MISMATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            MISMATCH
          </span>
        );
      case 'UNPOSTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-300">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            UNPOSTED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-900" />
            <h2 className="text-base font-bold text-gray-900">Financial Reconciliation Center</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
              9 Mandatory Operational Pairings
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Continuous automated verification matching departmental subledgers directly against General Ledger control accounts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleInstantReconcile}
            className="px-3 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reconcile All Now
          </button>
          <button
            onClick={exportExcel}
            className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Excel
          </button>
          <button
            onClick={exportCSV}
            className="px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-gray-600" />
            CSV
          </button>
          <button
            onClick={printMatrix}
            className="px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-gray-600" />
            Print
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Summary Scorecard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('MATCHED')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'MATCHED' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span>MATCHED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900 font-mono">{matchedCount}</div>
          <div className="text-[11px] text-gray-500">Zero variance confirmed</div>
        </div>

        <div
          onClick={() => setStatusFilter('WARNING')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'WARNING' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-amber-800">
            <span>WARNING</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900 font-mono">{warningCount}</div>
          <div className="text-[11px] text-gray-500">Minor in-transit difference</div>
        </div>

        <div
          onClick={() => setStatusFilter('MISMATCH')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'MISMATCH' ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
            <span>MISMATCH</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900 font-mono">{mismatchCount}</div>
          <div className="text-[11px] text-gray-500">Requires manual adjustment</div>
        </div>

        <div
          onClick={() => setStatusFilter('UNPOSTED')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'UNPOSTED' ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-purple-800">
            <span>UNPOSTED</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900 font-mono">{unpostedCount}</div>
          <div className="text-[11px] text-gray-500">Pending night audit/batch</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search operational pairing or GL..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-xs text-gray-500 font-medium">Filter:</span>
          <div className="flex items-center gap-1">
            {(['All', 'MATCHED', 'WARNING', 'MISMATCH', 'UNPOSTED'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === st ? 'bg-indigo-900 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reconciliation Matrix Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Operational Pairing & Control Scope</th>
                <th className="py-3 px-4">Operational Source</th>
                <th className="py-3 px-4">GL Control Account</th>
                <th className="py-3 px-4 text-right">Variance (Difference)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Last Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-900">{item.name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{item.details}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-700">{item.source1Name}</div>
                    <div className="font-mono font-bold text-gray-900">৳{(item.source1Value || 0).toLocaleString()}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-indigo-900">{item.source2Name}</div>
                    <div className="font-mono font-bold text-indigo-950">৳{(item.source2Value || 0).toLocaleString()}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-mono font-bold text-xs ${item.variance === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {item.variance === 0 ? '৳0.00' : `৳${(item.variance || 0).toLocaleString()}`}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-500 font-mono text-[11px]">
                    {item.lastReconciledAt}
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
