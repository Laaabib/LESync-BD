import React, { useState } from 'react';
import {
  Sparkles, Play, CheckCircle2, AlertTriangle, Scale,
  ShieldCheck, ArrowRight, BookOpen, Layers, RefreshCw,
  DollarSign, Check, Info
} from 'lucide-react';
import {
  accountingEngineService,
  AccountingTransactionSourceType,
  ALL_SOURCE_TYPES,
  roundCurrency
} from '../../services/accountingEngineService';
import { pmsService } from '../../services/pmsService';

interface AccountMappingRuleLookup {
  sourceType: AccountingTransactionSourceType;
  debitCode: string;
  debitName: string;
  creditCode: string;
  creditName: string;
  hasVat: boolean;
  hasSc: boolean;
  costOfSalesDebitCode?: string;
  costOfSalesDebitName?: string;
  inventoryCreditCode?: string;
  inventoryCreditName?: string;
}

const SYSTEM_MAPPING_RULES: Record<AccountingTransactionSourceType, AccountMappingRuleLookup> = {
  ROOM_CHARGE: {
    sourceType: 'ROOM_CHARGE',
    debitCode: '1100',
    debitName: 'Guest Ledger (In-House Active Receivables)',
    creditCode: '4010',
    creditName: 'Room Accommodation Revenue',
    hasVat: true,
    hasSc: true
  },
  RESTAURANT_SALE: {
    sourceType: 'RESTAURANT_SALE',
    debitCode: '1020',
    debitName: 'Front Desk & Outlet Cashier Drawers',
    creditCode: '4020',
    creditName: 'Food & Beverage Outlet Sales',
    hasVat: true,
    hasSc: true,
    costOfSalesDebitCode: '5020',
    costOfSalesDebitName: 'F&B Kitchen Raw Materials & Consumables',
    inventoryCreditCode: '1300',
    inventoryCreditName: 'Food & Raw Ingredients Inventory Asset'
  },
  BAR_SALE: {
    sourceType: 'BAR_SALE',
    debitCode: '1020',
    debitName: 'Front Desk & Outlet Cashier Drawers',
    creditCode: '4030',
    creditName: 'Bar & Lounge Revenue',
    hasVat: true,
    hasSc: true,
    costOfSalesDebitCode: '5020',
    costOfSalesDebitName: 'F&B Kitchen Raw Materials & Consumables',
    inventoryCreditCode: '1310',
    inventoryCreditName: 'Bar & Lounge Beverages Inventory Asset'
  },
  BANQUET_SALE: {
    sourceType: 'BANQUET_SALE',
    debitCode: '1200',
    debitName: 'Convention & Banquet Event Receivables',
    creditCode: '4040',
    creditName: 'Convention Halls & Banquet Venue Hire',
    hasVat: true,
    hasSc: false
  },
  ACTIVITY_SALE: {
    sourceType: 'ACTIVITY_SALE',
    debitCode: '1020',
    debitName: 'Front Desk & Outlet Cashier Drawers',
    creditCode: '4050',
    creditName: 'Resort Activities & Sports Facilities',
    hasVat: true,
    hasSc: false
  },
  AMENITY_SALE: {
    sourceType: 'AMENITY_SALE',
    debitCode: '1100',
    debitName: 'Guest Ledger (In-House Active Receivables)',
    creditCode: '4060',
    creditName: 'Spa & Wellness Center Revenue',
    hasVat: true,
    hasSc: false
  },
  LAUNDRY_SALE: {
    sourceType: 'LAUNDRY_SALE',
    debitCode: '1100',
    debitName: 'Guest Ledger (In-House Active Receivables)',
    creditCode: '4070',
    creditName: 'Laundry & Valet Guest Services',
    hasVat: true,
    hasSc: false
  },
  OTHER_SERVICE_SALE: {
    sourceType: 'OTHER_SERVICE_SALE',
    debitCode: '1020',
    debitName: 'Front Desk & Outlet Cashier Drawers',
    creditCode: '4010',
    creditName: 'Other Hotel Miscellaneous Revenue',
    hasVat: true,
    hasSc: false
  },
  PURCHASE: {
    sourceType: 'PURCHASE',
    debitCode: '1300',
    debitName: 'Food & Raw Ingredients Inventory Asset',
    creditCode: '2050',
    creditName: 'Accounts Payable / Trade Creditors',
    hasVat: false,
    hasSc: false
  },
  GRN: {
    sourceType: 'GRN',
    debitCode: '1300',
    debitName: 'Food & Raw Ingredients Inventory Asset',
    creditCode: '2055',
    creditName: 'GRN Received / Unbilled Clearing Account',
    hasVat: false,
    hasSc: false
  },
  PURCHASE_INVOICE: {
    sourceType: 'PURCHASE_INVOICE',
    debitCode: '2055',
    debitName: 'GRN Received / Unbilled Clearing Account',
    creditCode: '2050',
    creditName: 'Accounts Payable / Trade Creditors',
    hasVat: false,
    hasSc: false
  },
  PURCHASE_RETURN: {
    sourceType: 'PURCHASE_RETURN',
    debitCode: '2050',
    debitName: 'Accounts Payable / Trade Creditors',
    creditCode: '5015',
    creditName: 'Purchase Returns & Allowances Recovery',
    hasVat: false,
    hasSc: false
  },
  PAYMENT: {
    sourceType: 'PAYMENT',
    debitCode: '2050',
    debitName: 'Accounts Payable / Trade Creditors',
    creditCode: '1010',
    creditName: 'Cash in Vault & Commercial Bank Accounts',
    hasVat: false,
    hasSc: false
  },
  RECEIPT: {
    sourceType: 'RECEIPT',
    debitCode: '1010',
    debitName: 'Cash in Vault & Commercial Bank Accounts',
    creditCode: '1100',
    creditName: 'Guest Ledger (In-House Active Receivables)',
    hasVat: false,
    hasSc: false
  },
  REFUND: {
    sourceType: 'REFUND',
    debitCode: '1100',
    debitName: 'Guest Ledger (In-House Active Receivables)',
    creditCode: '1010',
    creditName: 'Cash in Vault & Commercial Bank Accounts',
    hasVat: false,
    hasSc: false
  },
  ADVANCE_DEPOSIT: {
    sourceType: 'ADVANCE_DEPOSIT',
    debitCode: '1010',
    debitName: 'Cash in Vault & Commercial Bank Accounts',
    creditCode: '2010',
    creditName: 'Guest Advance & Reservation Security Deposits',
    hasVat: false,
    hasSc: false
  },
  INVENTORY_CONSUMPTION: {
    sourceType: 'INVENTORY_CONSUMPTION',
    debitCode: '5020',
    debitName: 'F&B Kitchen Raw Materials & Consumables',
    creditCode: '1300',
    creditName: 'Food & Raw Ingredients Inventory Asset',
    hasVat: false,
    hasSc: false
  },
  INVENTORY_ADJUSTMENT: {
    sourceType: 'INVENTORY_ADJUSTMENT',
    debitCode: '5030',
    debitName: 'Engineering, Facility & Maintenance Repairs',
    creditCode: '1330',
    creditName: 'Engineering, Maintenance & General Spares Stock',
    hasVat: false,
    hasSc: false
  },
  INVENTORY_TRANSFER: {
    sourceType: 'INVENTORY_TRANSFER',
    debitCode: '1310',
    debitName: 'Bar & Lounge Beverages Inventory Asset',
    creditCode: '1300',
    creditName: 'Food & Raw Ingredients Inventory Asset',
    hasVat: false,
    hasSc: false
  },
  MANUAL_JOURNAL: {
    sourceType: 'MANUAL_JOURNAL',
    debitCode: '5040',
    debitName: 'Power, Generator Diesel & Utilities',
    creditCode: '1010',
    creditName: 'Cash in Vault & Commercial Bank Accounts',
    hasVat: false,
    hasSc: false
  },
  CREDIT_NOTE: {
    sourceType: 'CREDIT_NOTE',
    debitCode: '4010',
    debitName: 'Room Accommodation Revenue',
    creditCode: '1100',
    creditName: 'Guest Ledger (In-House Active Receivables)',
    hasVat: false,
    hasSc: false
  },
  DEBIT_NOTE: {
    sourceType: 'DEBIT_NOTE',
    debitCode: '2050',
    debitName: 'Accounts Payable / Trade Creditors',
    creditCode: '5015',
    creditName: 'Purchase Returns & Allowances Recovery',
    hasVat: false,
    hasSc: false
  }
};

export const AccountingMappingTestTab: React.FC = () => {
  // Simulator Inputs
  const [selectedSourceType, setSelectedSourceType] = useState<AccountingTransactionSourceType>('RESTAURANT_SALE');
  const [department, setDepartment] = useState('Food & Beverage');
  const [outlet, setOutlet] = useState('Main Restaurant (Dhaka Dining)');
  const [baseAmount, setBaseAmount] = useState<number>(1000);
  const [includeVat, setIncludeVat] = useState(true);
  const [includeServiceCharge, setIncludeServiceCharge] = useState(true);
  const [includeCostOfSales, setIncludeCostOfSales] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Card' | 'City Ledger' | 'Billed-To-Room' | 'Accounts Payable'>('Cash');
  const [postedResult, setPostedResult] = useState<{ success: boolean; message: string; journalNumber?: string } | null>(null);

  const rule = SYSTEM_MAPPING_RULES[selectedSourceType] || SYSTEM_MAPPING_RULES.ROOM_CHARGE;

  // Determine actual debit account based on payment method override if applicable
  let resolvedDebitCode = rule.debitCode;
  let resolvedDebitName = rule.debitName;

  if (['RESTAURANT_SALE', 'BAR_SALE', 'ACTIVITY_SALE', 'OTHER_SERVICE_SALE'].includes(selectedSourceType)) {
    if (paymentMethod === 'Cash') {
      resolvedDebitCode = '1020';
      resolvedDebitName = 'Front Desk & Outlet Cashier Drawers';
    } else if (paymentMethod === 'Bank Transfer' || paymentMethod === 'Card') {
      resolvedDebitCode = '1010';
      resolvedDebitName = 'Cash in Vault & Commercial Bank Accounts';
    } else if (paymentMethod === 'Billed-To-Room') {
      resolvedDebitCode = '1100';
      resolvedDebitName = 'Guest Ledger (In-House Active Receivables)';
    } else if (paymentMethod === 'City Ledger') {
      resolvedDebitCode = '1150';
      resolvedDebitName = 'City Ledger (Corporate Accounts Receivable)';
    }
  }

  // Tax calculations
  const vatAmount = includeVat && rule.hasVat ? roundCurrency(baseAmount * 0.15) : 0;
  const scAmount = includeServiceCharge && rule.hasSc ? roundCurrency(baseAmount * 0.10) : 0;
  const totalReceivable = roundCurrency(baseAmount + vatAmount + scAmount);

  // Cost of sales calculation (typically ~30% for F&B)
  const estimatedCostOfSales = (includeCostOfSales && rule.costOfSalesDebitCode) ? roundCurrency(baseAmount * 0.32) : 0;

  // Debit entries
  const debits = [
    { code: resolvedDebitCode, name: resolvedDebitName, amount: totalReceivable, memo: `${selectedSourceType} Receivable/Settlement via ${paymentMethod}` }
  ];
  if (estimatedCostOfSales > 0 && rule.costOfSalesDebitCode && rule.costOfSalesDebitName) {
    debits.push({
      code: rule.costOfSalesDebitCode,
      name: rule.costOfSalesDebitName,
      amount: estimatedCostOfSales,
      memo: 'Cost of Sales (COGS) Recognition'
    });
  }

  // Credit entries
  const credits = [
    { code: rule.creditCode, name: rule.creditName, amount: baseAmount, memo: `Net Sales Revenue from ${outlet}` }
  ];
  if (vatAmount > 0) {
    credits.push({
      code: '2100',
      name: 'VAT / Government Tax Payable (15%)',
      amount: vatAmount,
      memo: 'Statutory 15% NBR VAT Collection'
    });
  }
  if (scAmount > 0) {
    credits.push({
      code: '2110',
      name: 'Service Charge Payable (10% Staff Pool)',
      amount: scAmount,
      memo: '10% Employee Welfare Service Charge Pool'
    });
  }
  if (estimatedCostOfSales > 0 && rule.inventoryCreditCode && rule.inventoryCreditName) {
    credits.push({
      code: rule.inventoryCreditCode,
      name: rule.inventoryCreditName,
      amount: estimatedCostOfSales,
      memo: 'Store Inventory Stock Reduction'
    });
  }

  const totalDebitSum = roundCurrency(debits.reduce((s, d) => s + d.amount, 0));
  const totalCreditSum = roundCurrency(credits.reduce((s, c) => s + c.amount, 0));
  const isBalanced = Math.abs(totalDebitSum - totalCreditSum) < 0.001;

  const handleSimulateAndPost = () => {
    const entries = [
      ...debits.map(d => ({ accountCode: d.code, debit: d.amount, credit: 0, memo: d.memo })),
      ...credits.map(c => ({ accountCode: c.code, debit: 0, credit: c.amount, memo: c.memo }))
    ];

    const res = accountingEngineService.postTransaction({
      sourceType: selectedSourceType,
      sourceModule: department,
      sourceReference: `SIM-${Date.now().toString().slice(-6)}`,
      narration: `Simulated Accounting Test: ${selectedSourceType} at ${outlet} via ${paymentMethod}. Amount: ৳${baseAmount}`,
      entries
    });

    if (res.success && res.transaction) {
      setPostedResult({
        success: true,
        message: `Voucher successfully posted to live General Ledger with sequence ID ${res.transaction.journalNumber}.`,
        journalNumber: res.transaction.journalNumber
      });
    } else {
      setPostedResult({
        success: false,
        message: res.message
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Accounting Mapping Test Tool</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
              Admin & Chief Accountant
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Simulate any operational scenario across all 22 transaction source types to verify expected Debits, Credits, Tax Splits, and COGS
          </p>
        </div>

        <button
          onClick={handleSimulateAndPost}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Play className="w-4 h-4 fill-current" />
          Test & Post to Live Books
        </button>
      </div>

      {postedResult && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            postedResult.success ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {postedResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{postedResult.message}</span>
          </div>
          <button onClick={() => setPostedResult(null)} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* Inputs Matrix */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-900" />
          Scenario Parameters (Input Configuration)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Transaction Type */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">Transaction Source Type</label>
            <select
              value={selectedSourceType}
              onChange={e => {
                const val = e.target.value as AccountingTransactionSourceType;
                setSelectedSourceType(val);
                const info = ALL_SOURCE_TYPES.find(t => t.type === val);
                if (info) setDepartment(info.department);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-semibold focus:ring-1 focus:ring-indigo-600"
            >
              {ALL_SOURCE_TYPES.map(t => (
                <option key={t.type} value={t.type}>
                  {t.type} — {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">Department</label>
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-medium"
            />
          </div>

          {/* Outlet */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">Outlet / Station</label>
            <input
              type="text"
              value={outlet}
              onChange={e => setOutlet(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-medium"
            />
          </div>

          {/* Base Amount */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">Base Transaction Amount (BDT)</label>
            <input
              type="number"
              min="1"
              value={baseAmount}
              onChange={e => setBaseAmount(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-mono font-bold"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">Settlement / Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-semibold focus:ring-1 focus:ring-indigo-600"
            >
              <option value="Cash">Cash (Front Desk / Cashier Drawer - GL 1020)</option>
              <option value="Bank Transfer">Bank Transfer / EFT (Commercial Bank - GL 1010)</option>
              <option value="Card">Credit Card POS (Commercial Bank - GL 1010)</option>
              <option value="Billed-To-Room">Billed to Guest Room (Guest Ledger - GL 1100)</option>
              <option value="City Ledger">Direct Corporate Billing (City Ledger AR - GL 1150)</option>
              <option value="Accounts Payable">Vendor Credit / Trade Payables (GL 2050)</option>
            </select>
          </div>

          {/* Tax, SC & Cost Toggles */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">Statutory & Inventory Splits</label>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeVat}
                  onChange={e => setIncludeVat(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span className="font-semibold text-gray-800">15% VAT</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeServiceCharge}
                  onChange={e => setIncludeServiceCharge(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span className="font-semibold text-gray-800">10% SC</span>
              </label>

              {rule.costOfSalesDebitCode && (
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCostOfSales}
                    onChange={e => setIncludeCostOfSales(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="font-semibold text-gray-800">COGS Split</span>
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Output Simulation Results */}
      <div className="bg-slate-950 text-white rounded-xl p-5 border border-slate-800 shadow-md space-y-4 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 font-sans">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Expected Double-Entry Journal Breakdown (Output)</h3>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isBalanced
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-rose-950 text-rose-400 border-rose-800'
              }`}
            >
              {isBalanced ? '✓ Dr = Cr Balanced' : '✗ Unbalanced'}
            </span>
            <span className="text-slate-400 text-xs font-mono">
              Total: ৳{(totalDebitSum || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Debits and Credits Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* DEBITS */}
          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <div className="text-blue-400 font-sans font-bold text-xs mb-2 flex items-center justify-between">
              <span>EXPECTED DEBIT ACCOUNTS (DR)</span>
              <span className="font-mono">৳{(totalDebitSum || 0).toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              {debits.map((d, i) => (
                <div key={i} className="p-2 rounded bg-slate-950/60 border border-slate-800 flex justify-between items-start">
                  <div>
                    <div className="text-blue-300 font-bold">[{d.code}] {d.name}</div>
                    <div className="text-[10px] text-slate-400">{d.memo}</div>
                  </div>
                  <div className="text-right font-bold text-blue-400">
                    ৳{(d.amount || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CREDITS */}
          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <div className="text-emerald-400 font-sans font-bold text-xs mb-2 flex items-center justify-between">
              <span>EXPECTED CREDIT ACCOUNTS (CR)</span>
              <span className="font-mono">৳{(totalCreditSum || 0).toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              {credits.map((c, i) => (
                <div key={i} className="p-2 rounded bg-slate-950/60 border border-slate-800 flex justify-between items-start">
                  <div>
                    <div className="text-emerald-300 font-bold">[{c.code}] {c.name}</div>
                    <div className="text-[10px] text-slate-400">{c.memo}</div>
                  </div>
                  <div className="text-right font-bold text-emerald-400">
                    ৳{(c.amount || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Notes */}
        <div className="pt-2 border-t border-slate-800 text-[11px] font-sans text-slate-300 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span>Base Revenue: <strong className="text-white font-mono">৳{(baseAmount || 0).toLocaleString()}</strong></span>
            {vatAmount > 0 && (
              <span>15% VAT: <strong className="text-emerald-400 font-mono">৳{(vatAmount || 0).toLocaleString()}</strong></span>
            )}
            {scAmount > 0 && (
              <span>10% SC: <strong className="text-indigo-400 font-mono">৳{(scAmount || 0).toLocaleString()}</strong></span>
            )}
            {estimatedCostOfSales > 0 && (
              <span>COGS: <strong className="text-amber-400 font-mono">৳{(estimatedCostOfSales || 0).toLocaleString()}</strong></span>
            )}
          </div>

          <div className="text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            Automatic posting rule adheres to Bangladesh NBR VAT Law & USALI standards.
          </div>
        </div>
      </div>
    </div>
  );
};
