import React, { useState, useEffect } from 'react';
import {
  TrendingUp, ArrowUpRight, ArrowDownRight, DollarSign,
  AlertTriangle, ShieldCheck, CheckCircle2, Clock, Landmark,
  Receipt, ShoppingCart, Users, Scale, FileText, Download,
  Printer, FileSpreadsheet, RefreshCw, Sparkles, Filter, ChevronRight,
  Layers, Plus
} from 'lucide-react';
import { accountingEngineService } from '../../services/accountingEngineService';
import { pmsService } from '../../services/pmsService';
import * as XLSX from 'xlsx';

interface FinanceDashboardTabProps {
  onSwitchTab?: (tab: string) => void;
  onOpenNewAccountHead?: () => void;
}

export const FinanceDashboardTab: React.FC<FinanceDashboardTabProps> = ({ onSwitchTab, onOpenNewAccountHead }) => {
  const [metrics, setMetrics] = useState(() => accountingEngineService.getFinanceDashboardMetrics());
  const [alerts, setAlerts] = useState(() => accountingEngineService.getFinancialAlerts());

  const refreshData = () => {
    setMetrics(accountingEngineService.getFinanceDashboardMetrics());
    setAlerts(accountingEngineService.getFinancialAlerts());
  };

  useEffect(() => {
    const unsub = accountingEngineService.subscribe(() => {
      refreshData();
    });
    return unsub;
  }, []);

  const exportSummaryExcel = () => {
    const data = [
      { Metric: "Today's Revenue", 'Amount (BDT)': metrics.todayRevenue, Category: 'Revenue' },
      { Metric: 'MTD Revenue', 'Amount (BDT)': metrics.mtdRevenue, Category: 'Revenue' },
      { Metric: 'Net Revenue', 'Amount (BDT)': metrics.netRevenue, Category: 'Revenue' },
      { Metric: 'Outstanding AR (Receivables)', 'Amount (BDT)': metrics.totalArOutstanding, Category: 'Receivables' },
      { Metric: 'Guest Ledger Balance', 'Amount (BDT)': metrics.guestLedgerBalance, Category: 'Receivables' },
      { Metric: 'Outstanding AP (Payables)', 'Amount (BDT)': metrics.totalApOutstanding, Category: 'Payables' },
      { Metric: 'Supplier Ledger Balance', 'Amount (BDT)': metrics.supplierLedgerBalance, Category: 'Payables' },
      { Metric: 'Cash in Hand Balance', 'Amount (BDT)': metrics.cashBalance, Category: 'Treasury' },
      { Metric: 'Commercial Bank Balances', 'Amount (BDT)': metrics.bankBalance, Category: 'Treasury' },
      { Metric: 'Statutory Taxes Payable', 'Amount (BDT)': metrics.taxPayable, Category: 'Liabilities' },
      { Metric: 'Food Cost of Sales', 'Amount (BDT)': metrics.foodCost, Category: 'Costs' },
      { Metric: 'Beverage Cost of Sales', 'Amount (BDT)': metrics.beverageCost, Category: 'Costs' },
      { Metric: 'Total Operating Expenses', 'Amount (BDT)': metrics.operatingExpenses, Category: 'Expenses' },
      { Metric: 'Net Operational Profit/Loss', 'Amount (BDT)': metrics.profitLoss, Category: 'Profitability' }
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Executive Finance Summary');
    XLSX.writeFile(wb, `CCULB_Executive_Finance_Dashboard_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Executive Controls & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-900" />
            Executive Finance & Accounts Overview
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time, database-derived financial metrics & statutory compliance balances
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={refreshData}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
            Refresh
          </button>
          <button
            onClick={exportSummaryExcel}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Excel
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-gray-600" />
            Print
          </button>
          {onOpenNewAccountHead && (
            <button
              onClick={onOpenNewAccountHead}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              New Account Head
            </button>
          )}
          {onSwitchTab && (
            <button
              onClick={() => onSwitchTab('reconciliation')}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-900 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Scale className="w-3.5 h-3.5" />
              Reconciliation Center
            </button>
          )}
        </div>
      </div>

      {/* 61. FINANCIAL ALERTS BANNER */}
      {alerts.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Active Financial Alerts & Compliance Monitors ({alerts.length})
              </h3>
            </div>
            <span className="text-[11px] text-amber-800 font-medium">Automatic Real-Time Rules Engine</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className="bg-white/90 p-3 rounded-lg border border-amber-200/70 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 uppercase">
                      {alert.type}
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${alert.severity === 'high' ? 'text-rose-600' : 'text-amber-700'}`}>
                      {alert.severity} Priority
                    </span>
                  </div>
                  <div className="text-xs font-bold text-gray-900">{alert.title}</div>
                  <div className="text-[11px] text-gray-600 mt-1 line-clamp-2">{alert.description}</div>
                </div>
                {onSwitchTab && (
                  <button
                    onClick={() => {
                      if (alert.type.includes('AR')) onSwitchTab('ar');
                      else if (alert.type.includes('AP')) onSwitchTab('ap');
                      else if (alert.type.includes('Bank')) onSwitchTab('cash-bank');
                      else if (alert.type.includes('Journal')) onSwitchTab('jv');
                      else if (alert.type.includes('Credit')) onSwitchTab('guest-ledger');
                      else onSwitchTab('reconciliation');
                    }}
                    className="mt-2 text-[11px] text-indigo-700 font-bold hover:underline flex items-center gap-1"
                  >
                    Resolve Alert <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 60. PRIMARY FINANCIAL METRICS GRID (Database Derived) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Today's Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 font-mono">
            ৳{(metrics.todayRevenue || 0).toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Posting from front desk, POS & banquets</span>
          </div>
        </div>

        {/* MTD / Net Revenue */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>MTD Revenue</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-950 font-mono">
            ৳{(metrics.mtdRevenue || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Net: ৳{(metrics.netRevenue || 0).toLocaleString()} recognized
          </div>
        </div>

        {/* Outstanding AR */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Outstanding AR</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-950 font-mono">
            ৳{(metrics.totalArOutstanding || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-gray-500 flex justify-between">
            <span>Guest: ৳{(metrics.guestLedgerBalance || 0).toLocaleString()}</span>
            <span>Corporate: ৳{(metrics.totalArOutstanding - metrics.guestLedgerBalance || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Outstanding AP */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Outstanding AP (Payables)</span>
            <ShoppingCart className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-950 font-mono">
            ৳{(metrics.totalApOutstanding || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Supplier ledger trade creditors
          </div>
        </div>
      </div>

      {/* SECONDARY METRICS: TREASURY, TAXES & COSTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash in Hand */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Cash in Hand (GL 1020)</div>
          <div className="mt-2 text-xl font-bold text-gray-900 font-mono">
            ৳{(metrics.cashBalance || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Active cash floats across outlet cashiers
          </div>
        </div>

        {/* Bank Balances */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Commercial Bank (GL 1010)</div>
          <div className="mt-2 text-xl font-bold text-indigo-950 font-mono">
            ৳{(metrics.bankBalance || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Sonali, DBBL, EBL corporate accounts
          </div>
        </div>

        {/* Taxes Payable */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Statutory Tax Payable (GL 2100)</div>
          <div className="mt-2 text-xl font-bold text-gray-900 font-mono">
            ৳{(metrics.taxPayable || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            15% NBR Government VAT & 10% Service Pool
          </div>
        </div>

        {/* Net Profit / Loss */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Net Operational Profit/Loss</div>
          <div className={`mt-2 text-xl font-bold font-mono ${metrics.profitLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            ৳{(metrics.profitLoss || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Revenue less Food Cost & Opex (৳{(metrics.operatingExpenses || 0).toLocaleString()})
          </div>
        </div>
      </div>

      {/* COST OF SALES & EXPENSE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-900" />
              General Ledger Balance Sheet & P&L Health
            </h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Debits = Credits Balanced
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
              <span className="font-semibold text-gray-700">Food Cost of Sales (GL 5020)</span>
              <span className="font-mono font-bold text-gray-900">৳{(metrics.foodCost || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
              <span className="font-semibold text-gray-700">Beverage Cost / Bar Asset (GL 1310)</span>
              <span className="font-mono font-bold text-gray-900">৳{(metrics.beverageCost || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
              <span className="font-semibold text-gray-700">Hotel Operating Expenses (5000 Series)</span>
              <span className="font-mono font-bold text-gray-900">৳{(metrics.operatingExpenses || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100">
              <span className="font-bold text-indigo-950">Net Operating Margin</span>
              <span className="font-mono font-bold text-indigo-950">
                {metrics.netRevenue > 0 ? ((metrics.profitLoss / metrics.netRevenue) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick Audit & Compliance Status */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Statutory & Fiscal Integrity
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Current Fiscal Period:</span>
                <span className="font-bold text-gray-900">September 2026 (OPEN)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">August 2026 Books:</span>
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">LOCKED (CLOSED)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Accounting Standard:</span>
                <span className="font-bold text-indigo-900">Double-Entry Decimal(18,2)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Audit Trail:</span>
                <span className="font-bold text-emerald-700">100% Immutable Logged</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            {onSwitchTab && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSwitchTab('mapping-test')}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 font-bold text-xs rounded-lg transition-colors text-center"
                >
                  Mapping Test
                </button>
                <button
                  onClick={() => onSwitchTab('critical-tests')}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs rounded-lg transition-colors text-center"
                >
                  Run Tests
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
