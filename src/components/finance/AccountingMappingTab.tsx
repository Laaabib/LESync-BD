import React, { useState } from 'react';
import {
  Layers, Search, CheckCircle2, Play, RefreshCw,
  Scale, ShieldCheck, ArrowRight, BookOpen, Sparkles, Check
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { GLAccount } from '../../types/pms';

interface MappingRule {
  id: string;
  transactionEvent: string;
  sourceModule: string;
  description: string;
  defaultDebitCode: string;
  defaultDebitName: string;
  defaultCreditCode: string;
  defaultCreditName: string;
  taxDebitCode?: string;
  taxCreditCode?: string;
  serviceChargeCreditCode?: string;
}

const DEFAULT_RULES: MappingRule[] = [
  {
    id: 'map-1',
    transactionEvent: 'Room Night Charge (Night Audit)',
    sourceModule: 'Front Desk / Night Audit',
    description: 'Daily room accommodation billing posted to in-house guest folios at 06:00 AM',
    defaultDebitCode: '1100',
    defaultDebitName: 'Guest Ledger (In-House Active Receivables)',
    defaultCreditCode: '4010',
    defaultCreditName: 'Room Accommodation Revenue',
    taxCreditCode: '2100',
    serviceChargeCreditCode: '2110'
  },
  {
    id: 'map-2',
    transactionEvent: 'Restaurant F&B Sale (POS Settlement)',
    sourceModule: 'Restaurant POS',
    description: 'Food & Beverage dining orders settled direct cash/card or to guest room',
    defaultDebitCode: '1020',
    defaultDebitName: 'Front Desk & Outlet Cashier Drawers',
    defaultCreditCode: '4020',
    defaultCreditName: 'Food & Beverage Outlet Sales',
    taxCreditCode: '2100',
    serviceChargeCreditCode: '2110'
  },
  {
    id: 'map-3',
    transactionEvent: 'Bar & Lounge Beverages Sale',
    sourceModule: 'Bar & Lounge POS',
    description: 'Beverages, mocktails, cocktails and lounge snack sales',
    defaultDebitCode: '1020',
    defaultDebitName: 'Front Desk & Outlet Cashier Drawers',
    defaultCreditCode: '4030',
    defaultCreditName: 'Bar & Lounge Revenue',
    taxCreditCode: '2100',
    serviceChargeCreditCode: '2110'
  },
  {
    id: 'map-4',
    transactionEvent: 'Banquet Hall & Event Billing',
    sourceModule: 'Banquet & Events',
    description: 'Convention hall rental, catering packages & event contracts',
    defaultDebitCode: '1200',
    defaultDebitName: 'Convention & Banquet Event Receivables',
    defaultCreditCode: '4040',
    defaultCreditName: 'Convention Halls & Banquet Venue Hire',
    taxCreditCode: '2100'
  },
  {
    id: 'map-5',
    transactionEvent: 'Recreation & Swimming Pool Pass',
    sourceModule: 'Activities & Sports',
    description: 'Sports zone, tennis, water park and recreation tickets',
    defaultDebitCode: '1020',
    defaultDebitName: 'Front Desk & Outlet Cashier Drawers',
    defaultCreditCode: '4050',
    defaultCreditName: 'Resort Activities & Sports Facilities',
    taxCreditCode: '2100'
  },
  {
    id: 'map-6',
    transactionEvent: 'Spa & Wellness Center Billing',
    sourceModule: 'Amenities & Spa',
    description: 'Therapeutic massages, sauna, wellness treatments and salon packages',
    defaultDebitCode: '1100',
    defaultDebitName: 'Guest Ledger (In-House Active Receivables)',
    defaultCreditCode: '4060',
    defaultCreditName: 'Spa & Wellness Center Revenue',
    taxCreditCode: '2100'
  },
  {
    id: 'map-7',
    transactionEvent: 'Guest Laundry & Valet Services',
    sourceModule: 'Housekeeping / Laundry',
    description: 'Express dry cleaning, laundry and pressing services billed to folio',
    defaultDebitCode: '1100',
    defaultDebitName: 'Guest Ledger (In-House Active Receivables)',
    defaultCreditCode: '4070',
    defaultCreditName: 'Laundry & Valet Guest Services',
    taxCreditCode: '2100'
  },
  {
    id: 'map-8',
    transactionEvent: 'Procurement Goods Receive (GRN Bill)',
    sourceModule: 'Procurement / Inventory',
    description: 'Food & beverage raw materials & general store inventory receipt from suppliers',
    defaultDebitCode: '1300',
    defaultDebitName: 'Food & Raw Ingredients Inventory Asset',
    defaultCreditCode: '2050',
    defaultCreditName: 'Accounts Payable / Trade Creditors'
  },
  {
    id: 'map-9',
    transactionEvent: 'Kitchen Store Issue / Consumption',
    sourceModule: 'Kitchen / Restaurant',
    description: 'Raw meat, seafood, dry goods consumed for recipe production',
    defaultDebitCode: '5020',
    defaultDebitName: 'F&B Kitchen Raw Materials & Consumables',
    defaultCreditCode: '1300',
    defaultCreditName: 'Food & Raw Ingredients Inventory Asset'
  },
  {
    id: 'map-10',
    transactionEvent: 'Corporate AR Settlement Receipt',
    sourceModule: 'City Ledger / AR',
    description: 'Corporate client bank transfer settlement against invoiced balance',
    defaultDebitCode: '1010',
    defaultDebitName: 'Cash in Vault & Commercial Bank Accounts',
    defaultCreditCode: '1150',
    defaultCreditName: 'City Ledger (Corporate Accounts Receivable)'
  },
  {
    id: 'map-11',
    transactionEvent: 'Supplier Payment Disbursement',
    sourceModule: 'Accounts Payable',
    description: 'Trade creditor disbursements released via commercial bank transfer or cheque',
    defaultDebitCode: '2050',
    defaultDebitName: 'Accounts Payable / Trade Creditors',
    defaultCreditCode: '1010',
    defaultCreditName: 'Cash in Vault & Commercial Bank Accounts'
  },
  {
    id: 'map-12',
    transactionEvent: 'Guest Advance & Security Deposit',
    sourceModule: 'Front Office / Cashier',
    description: 'Prepayment collections for future accommodation stays & event security guarantees',
    defaultDebitCode: '1010',
    defaultDebitName: 'Cash in Vault & Commercial Bank Accounts',
    defaultCreditCode: '2010',
    defaultCreditName: 'Guest Advance & Reservation Security Deposits'
  },
  {
    id: 'map-13',
    transactionEvent: 'Vendor Purchase Return / Debit Note',
    sourceModule: 'Stores / Receiving',
    description: 'Damaged or sub-standard goods returned to supplier with debit note recovery',
    defaultDebitCode: '2050',
    defaultDebitName: 'Accounts Payable / Trade Creditors',
    defaultCreditCode: '5015',
    defaultCreditName: 'Purchase Returns & Allowances Recovery'
  }
];

export const AccountingMappingTab: React.FC = () => {
  const db = pmsService.getState();
  const [rules, setRules] = useState<MappingRule[]>(DEFAULT_RULES);
  const [search, setSearch] = useState('');

  // Simulator State
  const [simEvent, setSimEvent] = useState<string>(DEFAULT_RULES[0].id);
  const [simAmount, setSimAmount] = useState<number>(10000);
  const [simIncludeVat, setSimIncludeVat] = useState(true);
  const [simIncludeSc, setSimIncludeSc] = useState(true);
  const [simFeedback, setSimFeedback] = useState<string | null>(null);

  const selectedRule = rules.find(r => r.id === simEvent) || rules[0];

  // Calculated simulated lines
  const vatAmount = simIncludeVat && selectedRule.taxCreditCode ? Math.round(simAmount * 0.15) : 0;
  const scAmount = simIncludeSc && selectedRule.serviceChargeCreditCode ? Math.round(simAmount * 0.10) : 0;
  const totalCharge = simAmount + vatAmount + scAmount;

  const handlePostSimulation = () => {
    const entries = [
      {
        id: `jve-sim-${Date.now()}-1`,
        accountCode: selectedRule.defaultDebitCode,
        accountName: selectedRule.defaultDebitName,
        debit: totalCharge,
        credit: 0,
        memo: `Simulated posting for ${selectedRule.transactionEvent}`
      },
      {
        id: `jve-sim-${Date.now()}-2`,
        accountCode: selectedRule.defaultCreditCode,
        accountName: selectedRule.defaultCreditName,
        debit: 0,
        credit: simAmount,
        memo: `Base transaction revenue`
      }
    ];

    if (vatAmount > 0 && selectedRule.taxCreditCode) {
      entries.push({
        id: `jve-sim-${Date.now()}-3`,
        accountCode: selectedRule.taxCreditCode,
        accountName: 'Government VAT Payable (15% Output Tax)',
        debit: 0,
        credit: vatAmount,
        memo: '15% Statutory Output VAT'
      });
    }

    if (scAmount > 0 && selectedRule.serviceChargeCreditCode) {
      entries.push({
        id: `jve-sim-${Date.now()}-4`,
        accountCode: selectedRule.serviceChargeCreditCode,
        accountName: 'Service Charge Payable Pool (10%)',
        debit: 0,
        credit: scAmount,
        memo: '10% Staff Service Charge Pool'
      });
    }

    const res = pmsService.createJournalVoucher({
      date: db.settings.currentBusinessDate || new Date().toISOString().split('T')[0],
      sourceModule: 'Manual Adjustment',
      sourceReference: `SIM-${Date.now().toString().slice(-6)}`,
      narration: `Simulated accounting mapping for [${selectedRule.transactionEvent}] (Debit: ৳${(totalCharge || 0).toLocaleString()} / Credit: ৳${(totalCharge || 0).toLocaleString()})`,
      entries
    });

    if (res.success) {
      setSimFeedback(`Journal Voucher posted! Balanced Debit ৳${(totalCharge || 0).toLocaleString()} === Credit ৳${(totalCharge || 0).toLocaleString()}`);
      setTimeout(() => setSimFeedback(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {simFeedback && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm font-medium animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {simFeedback}
        </div>
      )}

      {/* Simulator Hero Card */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-indigo-800/40 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Interactive Accounting Posting Engine</h3>
            </div>
            <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
              Every operational event automatically creates double-entry journal vouchers following the exact GL mapping rules. Test transactions below to verify real-time debits, credits, VAT, and service charge distribution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePostSimulation}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-current" />
              Test & Post Voucher to GL
            </button>
          </div>
        </div>

        {/* Simulator Controls */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/5 p-4 rounded-xl border border-white/10 text-xs">
          <div>
            <label className="block text-indigo-200 font-semibold mb-1">Transaction Event</label>
            <select
              value={simEvent}
              onChange={e => setSimEvent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:ring-1 focus:ring-indigo-400"
            >
              {rules.map(r => (
                <option key={r.id} value={r.id}>{r.transactionEvent}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-indigo-200 font-semibold mb-1">Base Amount (BDT)</label>
            <input
              type="number"
              min="100"
              step="500"
              value={simAmount}
              onChange={e => setSimAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:ring-1 focus:ring-indigo-400"
            >
            </input>
          </div>

          <div>
            <label className="block text-indigo-200 font-semibold mb-1">VAT & Service Charge</label>
            <div className="flex items-center gap-3 mt-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-white">
                <input
                  type="checkbox"
                  checked={simIncludeVat}
                  onChange={e => setSimIncludeVat(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>15% VAT</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-white">
                <input
                  type="checkbox"
                  checked={simIncludeSc}
                  onChange={e => setSimIncludeSc(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>10% SC</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-indigo-200 font-semibold mb-1">Total Balanced Voucher</label>
            <div className="text-base font-bold font-mono text-emerald-400 mt-1">
              ৳{(totalCharge || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-indigo-300">
              Dr ৳{(totalCharge || 0).toLocaleString()} = Cr ৳{(totalCharge || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Live Journal Preview */}
        <div className="mt-4 bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-[11px] font-mono">
          <div className="text-indigo-300 font-sans font-bold text-xs mb-2">Simulated Double-Entry Journal Breakdown:</div>
          <div className="space-y-1.5 divide-y divide-slate-800">
            <div className="flex justify-between text-blue-300 pt-1">
              <span>Dr. [{selectedRule.defaultDebitCode}] {selectedRule.defaultDebitName}</span>
              <span className="font-bold">৳{(totalCharge || 0).toLocaleString()} (Debit)</span>
            </div>
            <div className="flex justify-between text-emerald-300 pt-1 pl-6">
              <span>Cr. [{selectedRule.defaultCreditCode}] {selectedRule.defaultCreditName}</span>
              <span className="font-bold">৳{(simAmount || 0).toLocaleString()} (Credit)</span>
            </div>
            {vatAmount > 0 && selectedRule.taxCreditCode && (
              <div className="flex justify-between text-emerald-300 pt-1 pl-6">
                <span>Cr. [{selectedRule.taxCreditCode}] Government VAT Payable (15%)</span>
                <span className="font-bold">৳{(vatAmount || 0).toLocaleString()} (Credit)</span>
              </div>
            )}
            {scAmount > 0 && selectedRule.serviceChargeCreditCode && (
              <div className="flex justify-between text-emerald-300 pt-1 pl-6">
                <span>Cr. [{selectedRule.serviceChargeCreditCode}] Staff Service Charge Pool (10%)</span>
                <span className="font-bold">৳{(scAmount || 0).toLocaleString()} (Credit)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mapping Matrix Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search event, source module, GL code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
            />
          </div>

          <div className="text-xs text-gray-500 font-medium">
            {rules.length} Active System Posting Rules
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Operational Event</th>
                <th className="py-3 px-4">Source Module</th>
                <th className="py-3 px-4">Debit Account (Receivable/Asset/Exp)</th>
                <th className="py-3 px-4">Credit Account (Revenue/Liability)</th>
                <th className="py-3 px-4 text-center">Tax / SC Split</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rules.filter(r => r.transactionEvent.toLowerCase().includes(search.toLowerCase()) || r.sourceModule.toLowerCase().includes(search.toLowerCase())).map(r => (
                <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-900">{r.transactionEvent}</div>
                    <div className="text-[11px] text-gray-400">{r.description}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                      {r.sourceModule}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-indigo-950">[{r.defaultDebitCode}]</div>
                    <div className="text-[11px] text-gray-600">{r.defaultDebitName}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-emerald-900">[{r.defaultCreditCode}]</div>
                    <div className="text-[11px] text-gray-600">{r.defaultCreditName}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {r.taxCreditCode || r.serviceChargeCreditCode ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Check className="w-3 h-3 text-indigo-600" />
                        Auto-Split
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">Direct</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Active
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
