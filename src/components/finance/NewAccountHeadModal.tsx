import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Check, AlertTriangle, ShieldCheck, Landmark, Scale,
  TrendingUp, ShoppingCart, Layers, Sparkles, Building2,
  DollarSign, FileText, X, CheckCircle2, ChevronRight
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { AccountCategory, GLAccount } from '../../types/pms';

interface NewAccountHeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (account: GLAccount) => void;
}

interface TemplatePreset {
  name: string;
  type: AccountCategory;
  category: string;
  department: string;
  suggestedCodeRange: number;
  description: string;
  isBankCash?: boolean;
}

const COMMON_HOTEL_TEMPLATES: TemplatePreset[] = [
  {
    name: 'Airport Transfer & Limousine Service',
    type: 'Revenue',
    category: 'Guest Services',
    department: 'Front Desk',
    suggestedCodeRange: 4080,
    description: 'Airport pickup, drop-off, and VIP chauffeur transport services billed to guests'
  },
  {
    name: 'Swimming Pool & Health Club Membership',
    type: 'Revenue',
    category: 'Resort Activities',
    department: 'Recreation & Pool',
    suggestedCodeRange: 4055,
    description: 'Monthly and annual fitness center, pool pass, and recreation club subscription fees'
  },
  {
    name: 'Bakery & Coffee Shop Outlet Sales',
    type: 'Revenue',
    category: 'Outlets & Dining',
    department: 'Food & Beverage',
    suggestedCodeRange: 4025,
    description: 'Pastries, specialty coffee, confectionery, and deli counter food & beverage revenue'
  },
  {
    name: 'Audio-Visual & Event Equipment Rental',
    type: 'Revenue',
    category: 'Events & Venues',
    department: 'Banquet & Events',
    suggestedCodeRange: 4045,
    description: 'Projectors, sound consoles, stage lighting, and conferencing gear hired for banquets'
  },
  {
    name: 'Mini-Bar In-Room Guest Sales',
    type: 'Revenue',
    category: 'Accommodation',
    department: 'Front Desk',
    suggestedCodeRange: 4015,
    description: 'Beverages, chocolates, and snacks consumed from in-room refrigerated mini-bars'
  },
  {
    name: 'Keycard Loss & Room Damage Recovery',
    type: 'Revenue',
    category: 'Other Operating Revenue',
    department: 'Front Desk',
    suggestedCodeRange: 4090,
    description: 'Non-refundable compensation recovered from guests for lost RFID keycards or linen damage'
  },
  {
    name: 'Generator Diesel & Heavy Fuel Oil',
    type: 'Expense',
    category: 'Utilities',
    department: 'Engineering & Maintenance',
    suggestedCodeRange: 5045,
    description: 'Diesel fuel procurement for backup generators, boilers, and kitchen steam systems'
  },
  {
    name: 'Laundry Detergents, Bleach & Dry Cleaning Chemicals',
    type: 'Expense',
    category: 'Hotel Operations',
    department: 'Housekeeping & Laundry',
    suggestedCodeRange: 5012,
    description: 'Industrial cleaning chemicals, fabric softeners, and pressing solvents for linen wash'
  },
  {
    name: 'Credit Card Merchant Discount Rate (MDR) & Gateway Fees',
    type: 'Expense',
    category: 'Financial Charges',
    department: 'Finance & Accounts',
    suggestedCodeRange: 5050,
    description: 'Bank processing commissions and interchange merchant service charges on POS transactions'
  },
  {
    name: 'OTA & Online Travel Agent Commissions',
    type: 'Expense',
    category: 'Sales & Marketing',
    department: 'Sales & Marketing',
    suggestedCodeRange: 5060,
    description: 'Contracted commission fees payable to Booking.com, Agoda, Expedia, and local OTAs'
  },
  {
    name: 'City Bank Ltd - Corporate CD Operating Account',
    type: 'Asset',
    category: 'Bank Accounts',
    department: 'Finance & Accounts',
    suggestedCodeRange: 1015,
    description: 'Primary commercial current account for vendor disbursements and POS merchant deposits',
    isBankCash: true
  },
  {
    name: 'bKash Merchant Operating Float Account',
    type: 'Asset',
    category: 'Cash & Cash Equivalents',
    department: 'Finance & Accounts',
    suggestedCodeRange: 1025,
    description: 'Mobile Financial Services (MFS) merchant counter collection account and digital float',
    isBankCash: true
  }
];

const CATEGORY_SUGGESTIONS: Record<AccountCategory, string[]> = {
  Asset: [
    'Cash & Cash Equivalents',
    'Bank Accounts',
    'Trade Receivables (City Ledger)',
    'Guest Ledger (In-House Receivables)',
    'Inventories - F&B Kitchen',
    'Inventories - Housekeeping & Linen',
    'Inventories - Engineering Spares',
    'Security Deposits & Prepayments',
    'Fixed Assets - Property, Plant & Equipment',
    'Intangible Assets & Licenses'
  ],
  Liability: [
    'Trade Payables (Supplier Ledger)',
    'Guest Advance Deposits',
    'Statutory Liabilities (VAT & Taxes)',
    'Operational Liabilities (Service Charge Pool)',
    'Accrued Payroll & Staff Benefits',
    'Short Term Bank Loans & Overdrafts',
    'Security Deposits Held'
  ],
  Equity: [
    'Capital & Reserves',
    'Retained Earnings',
    'Shareholders Equity',
    'Statutory Reserve Fund',
    'Revaluation Reserve'
  ],
  Revenue: [
    'Accommodation',
    'Outlets & Dining',
    'Events & Venues',
    'Resort Activities',
    'Recreation & Wellness',
    'Guest Services',
    'Other Operating Revenue',
    'Non-Operating Income'
  ],
  Expense: [
    'Hotel Operations',
    'Cost Adjustments',
    'F&B Costs (Raw Materials)',
    'Maintenance & Engineering',
    'Utilities & Energy',
    'Sales & Marketing',
    'Administrative & General',
    'Financial Charges',
    'Depreciation & Amortization'
  ]
};

const DEPARTMENTS = [
  'Front Desk',
  'Food & Beverage',
  'Banquet & Events',
  'Housekeeping & Laundry',
  'Engineering & Maintenance',
  'Recreation & Pool',
  'Sales & Marketing',
  'Administration & General',
  'Finance & Accounts'
];

export const NewAccountHeadModal: React.FC<NewAccountHeadModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [db, setDb] = useState(pmsService.getState());

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  // Form Fields
  const [accountCode, setAccountCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountCategory>('Revenue');
  const [selectedCategory, setSelectedCategory] = useState('Accommodation');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [department, setDepartment] = useState('Front Desk');
  const [parentCode, setParentCode] = useState('');
  const [description, setDescription] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number | ''>('');
  const [postOpeningJv, setPostOpeningJv] = useState(true);
  const [isBankCash, setIsBankCash] = useState(false);
  const [isDirectPostingAllowed, setIsDirectPostingAllowed] = useState(true);
  const [isTaxApplicable, setIsTaxApplicable] = useState(false);

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Reset or initialize on modal open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSelectedTemplate('');
      setAccountType('Revenue');
      setSelectedCategory('Accommodation');
      setIsCustomCategory(false);
      setCustomCategory('');
      setDepartment('Front Desk');
      setParentCode('');
      setDescription('');
      setOpeningBalance('');
      setPostOpeningJv(true);
      setIsBankCash(false);
      setIsDirectPostingAllowed(true);
      setIsTaxApplicable(false);
      
      // Auto-suggest next code for Revenue
      suggestNextCodeForType('Revenue');
    }
  }, [isOpen]);

  // Code generator helper
  const suggestNextCodeForType = (type: AccountCategory) => {
    const existing = db.glAccounts || [];
    let base = 4000;
    if (type === 'Asset') base = 1000;
    else if (type === 'Liability') base = 2000;
    else if (type === 'Equity') base = 3000;
    else if (type === 'Revenue') base = 4000;
    else if (type === 'Expense') base = 5000;

    const maxRange = base + 999;
    const codesInType = existing
      .map(a => parseInt(a.code, 10))
      .filter(n => !isNaN(n) && n >= base && n <= maxRange);

    if (codesInType.length === 0) {
      setAccountCode((base + 10).toString());
      return;
    }

    const maxCode = Math.max(...codesInType);
    // Find next step in round increments (e.g. +5 or +10)
    let nextCandidate = Math.ceil((maxCode + 1) / 5) * 5;
    if (nextCandidate === maxCode) nextCandidate += 5;
    if (existing.some(a => a.code === nextCandidate.toString())) {
      nextCandidate += 5;
    }
    setAccountCode(nextCandidate.toString());
  };

  const handleTypeChange = (type: AccountCategory) => {
    setAccountType(type);
    const defaults = CATEGORY_SUGGESTIONS[type];
    if (defaults && defaults.length > 0) {
      setSelectedCategory(defaults[0]);
      setIsCustomCategory(false);
    }
    suggestNextCodeForType(type);
  };

  // Check code availability in real-time
  const codeValidation = useMemo(() => {
    const trimmed = accountCode.trim();
    if (!trimmed) return { status: 'empty', message: '' };
    if (!/^\d{4,6}$/.test(trimmed)) {
      return { status: 'invalid', message: 'Account code should be a 4 to 6 digit numeric code (e.g. 4080)' };
    }
    const match = (db.glAccounts || []).find(a => a.code === trimmed);
    if (match) {
      return { status: 'taken', message: `Code ${trimmed} is already used by "${match.name}" (${match.type})` };
    }
    return { status: 'available', message: `Code ${trimmed} is available` };
  }, [accountCode, db.glAccounts]);

  // Apply template
  const handleApplyTemplate = (templateName: string) => {
    setSelectedTemplate(templateName);
    const tmpl = COMMON_HOTEL_TEMPLATES.find(t => t.name === templateName);
    if (!tmpl) return;

    setAccountName(tmpl.name);
    setAccountType(tmpl.type);
    setSelectedCategory(tmpl.category);
    setIsCustomCategory(false);
    setDepartment(tmpl.department);
    setDescription(tmpl.description);
    if (tmpl.isBankCash !== undefined) setIsBankCash(tmpl.isBankCash);

    // Check if suggested code range is available
    const existing = db.glAccounts || [];
    let codeCandidate = tmpl.suggestedCodeRange;
    while (existing.some(a => a.code === codeCandidate.toString())) {
      codeCandidate += 5;
    }
    setAccountCode(codeCandidate.toString());
  };

  // Potential Parent Accounts
  const potentialParents = useMemo(() => {
    return (db.glAccounts || []).filter(a => a.type === accountType && a.code !== accountCode);
  }, [db.glAccounts, accountType, accountCode]);

  // Normal balance based on account type
  const normalBalance: 'Debit' | 'Credit' = accountType === 'Asset' || accountType === 'Expense' ? 'Debit' : 'Credit';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedCode = accountCode.trim();
    const trimmedName = accountName.trim();
    const category = isCustomCategory ? customCategory.trim() : selectedCategory.trim();

    if (!trimmedCode) {
      setErrorMsg('Please enter an account code.');
      return;
    }
    if (codeValidation.status === 'taken') {
      setErrorMsg(`GL Account Code ${trimmedCode} is already taken.`);
      return;
    }
    if (!trimmedName) {
      setErrorMsg('Please enter an account head title / name.');
      return;
    }
    if (!category) {
      setErrorMsg('Please select or specify a category classification.');
      return;
    }

    const openingNum = typeof openingBalance === 'number' ? openingBalance : (parseFloat(openingBalance) || 0);

    // Call service to register GL Account
    const result = pmsService.createGLAccount({
      code: trimmedCode,
      name: trimmedName,
      type: accountType,
      category,
      description: description.trim() || `${accountType} account for ${trimmedName}`,
      balance: openingNum,
      isSystem: false,
      department,
      parentCode: parentCode || undefined,
      openingBalance: openingNum,
      normalBalance,
      isBankCash,
      isDirectPostingAllowed,
      isTaxApplicable,
      status: 'Active',
      createdAt: new Date().toISOString()
    } as any);

    if (!result.success) {
      setErrorMsg(result.message);
      return;
    }

    // If opening balance > 0 and postOpeningJv is checked, post balancing Journal Voucher
    if (openingNum > 0 && postOpeningJv) {
      const today = db.settings.currentBusinessDate || new Date().toISOString().split('T')[0];
      const isDebitNormal = normalBalance === 'Debit';

      const entries = [
        {
          id: `jve-ob-${Date.now()}-1`,
          accountCode: trimmedCode,
          accountName: trimmedName,
          debit: isDebitNormal ? openingNum : 0,
          credit: isDebitNormal ? 0 : openingNum,
          memo: `Opening Balance for ${trimmedCode} - ${trimmedName}`
        },
        {
          id: `jve-ob-${Date.now()}-2`,
          accountCode: '3010',
          accountName: "Owners Capital & Retained Earnings",
          debit: isDebitNormal ? 0 : openingNum,
          credit: isDebitNormal ? openingNum : 0,
          memo: `Contra Opening Equity adjustment for Account ${trimmedCode}`
        }
      ];

      pmsService.createJournalVoucher({
        date: today,
        sourceModule: 'Manual Adjustment',
        sourceReference: `OB-${trimmedCode}`,
        narration: `Initial Opening Balance Ledger Setup for Account Head ${trimmedCode} (${trimmedName})`,
        entries
      });
    }

    // Retrieve created account
    const createdAccount = (pmsService.getState().glAccounts || []).find(a => a.code === trimmedCode);
    if (createdAccount && onSuccess) {
      onSuccess(createdAccount);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-auto shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 border border-indigo-400/40 rounded-xl text-indigo-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Create New Account Head
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  Chart of Accounts (COA)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                General Ledger classification, double-entry routing, and departmental reporting
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-5 text-xs text-gray-700">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Preset Selector */}
          <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Quick Hotel Preset Templates (Optional)
              </span>
              <span className="text-[10px] text-indigo-600 font-medium">Auto-populates best practice parameters</span>
            </div>
            <select
              value={selectedTemplate}
              onChange={e => handleApplyTemplate(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-gray-800 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
            >
              <option value="">-- Choose a standard hotel account head preset or configure custom --</option>
              {COMMON_HOTEL_TEMPLATES.map(t => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.type} • {t.department})
                </option>
              ))}
            </select>
          </div>

          {/* Section 1: Classification & Type */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Account Classification / Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] as const).map(type => {
                const isSelected = accountType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? type === 'Asset'
                          ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-1 ring-blue-600'
                          : type === 'Liability'
                          ? 'border-amber-600 bg-amber-50/80 text-amber-950 ring-1 ring-amber-600'
                          : type === 'Equity'
                          ? 'border-purple-600 bg-purple-50/80 text-purple-950 ring-1 ring-purple-600'
                          : type === 'Revenue'
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-1 ring-emerald-600'
                          : 'border-rose-600 bg-rose-50/80 text-rose-950 ring-1 ring-rose-600'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{type}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-700" />}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">
                      {type === 'Asset' || type === 'Expense' ? 'Debit Normal' : 'Credit Normal'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Type Accounting Note */}
            <div className="mt-2 text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-200 flex items-center justify-between">
              <span>
                <strong>{accountType} Normal Balance:</strong>{' '}
                <span className="font-mono font-semibold text-gray-900">{normalBalance}</span>.{' '}
                {normalBalance === 'Debit'
                  ? 'Debits increase balance; Credits decrease balance.'
                  : 'Credits increase balance; Debits decrease balance.'}
              </span>
              <span className="font-mono text-[10px] text-gray-400">
                Range: {accountType === 'Asset' ? '1000-1999' : accountType === 'Liability' ? '2000-2999' : accountType === 'Equity' ? '3000-3999' : accountType === 'Revenue' ? '4000-4999' : '5000-6999'}
              </span>
            </div>
          </div>

          {/* Section 2: Account Code & Head Title */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-800">GL Account Code *</label>
                <button
                  type="button"
                  onClick={() => suggestNextCodeForType(accountType)}
                  className="text-[10px] text-indigo-700 hover:text-indigo-900 font-semibold underline"
                >
                  Auto-Suggest Code
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. 4080"
                value={accountCode}
                onChange={e => setAccountCode(e.target.value)}
                className={`w-full px-3 py-2 text-xs bg-white border rounded-lg font-mono font-bold focus:outline-hidden ${
                  codeValidation.status === 'taken'
                    ? 'border-rose-400 focus:ring-1 focus:ring-rose-500 text-rose-700'
                    : codeValidation.status === 'available'
                    ? 'border-emerald-400 focus:ring-1 focus:ring-emerald-500 text-emerald-800'
                    : 'border-gray-300 focus:ring-1 focus:ring-indigo-600 text-gray-900'
                }`}
              />
              {codeValidation.message && (
                <div className={`text-[10px] mt-1 font-medium ${
                  codeValidation.status === 'taken' ? 'text-rose-600' :
                  codeValidation.status === 'available' ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {codeValidation.message}
                </div>
              )}
            </div>

            <div className="sm:col-span-7">
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Account Head Title / Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Airport Transfer & Shuttle Revenue"
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden font-medium text-gray-900"
              />
            </div>
          </div>

          {/* Section 3: Category & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-800">Category Classification *</label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-[10px] text-indigo-700 hover:text-indigo-900 font-semibold"
                >
                  {isCustomCategory ? 'Choose Predefined' : '+ Custom Category'}
                </button>
              </div>

              {isCustomCategory ? (
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Transportation / Sports & Leisure"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                />
              ) : (
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                >
                  {(CATEGORY_SUGGESTIONS[accountType] || []).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Department / Cost Center Allocation
              </label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 4: Parent Account (Optional hierarchy) & Opening Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Parent Account Head (Optional Sub-Head)
              </label>
              <select
                value={parentCode}
                onChange={e => setParentCode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
              >
                <option value="">None (Top-Level General Ledger Head)</option>
                {potentialParents.map(parent => (
                  <option key={parent.code} value={parent.code}>
                    {parent.code} - {parent.name} ({parent.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Opening Balance (৳ BDT)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono font-bold text-xs">
                  ৳
                </span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={openingBalance}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '') {
                      setOpeningBalance('');
                    } else {
                      const parsed = parseFloat(val);
                      setOpeningBalance(isNaN(parsed) ? '' : parsed);
                    }
                  }}
                  className="w-full pl-7 pr-3 py-2 text-xs bg-white border border-gray-300 rounded-lg font-mono font-bold text-gray-900 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Opening Balance Balancing JV Checkbox */}
          {Number(openingBalance) > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={postOpeningJv}
                  onChange={e => setPostOpeningJv(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-amber-950">
                  Post Double-Entry Opening Balance Journal Voucher
                </span>
              </label>
              <p className="text-[11px] text-amber-800 pl-5">
                Automatically posts a balancing contra entry to <strong>3010 - Owners Capital & Retained Earnings</strong> to keep the General Ledger & Trial Balance strictly in balance.
              </p>
            </div>
          )}

          {/* Section 5: Operational Description / Purpose */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">
              Operational Description & Accounting Purpose
            </label>
            <textarea
              rows={2}
              placeholder="Explain the transactions routed to this head, reporting requirements, or compliance guidelines..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
            />
          </div>

          {/* Section 6: Specific Control Flags */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-gray-200">
            <label className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isDirectPostingAllowed}
                onChange={e => setIsDirectPostingAllowed(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="block font-semibold text-[11px] text-gray-800">Direct JV Posting</span>
                <span className="block text-[10px] text-gray-500">Allow manual journal vouchers</span>
              </div>
            </label>

            <label className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isBankCash}
                onChange={e => setIsBankCash(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="block font-semibold text-[11px] text-gray-800">Bank / Liquid Cash</span>
                <span className="block text-[10px] text-gray-500">Include in treasury reconciliations</span>
              </div>
            </label>

            <label className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isTaxApplicable}
                onChange={e => setIsTaxApplicable(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="block font-semibold text-[11px] text-gray-800">NBR VAT / TDS</span>
                <span className="block text-[10px] text-gray-500">Subject to statutory tax withholdings</span>
              </div>
            </label>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-5 py-3.5 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Changes will be instantly synced to General Ledger & Reporting</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Save Account Head
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
