import React, { useState, useMemo, useEffect } from 'react';
import {
  Landmark, BookOpen, Scale, Building2, CheckCircle2,
  AlertTriangle, Plus, Search, Filter, RefreshCw, FileSpreadsheet,
  DollarSign, ArrowUpRight, ArrowDownRight, ChevronRight,
  ChevronDown, ShieldCheck, CreditCard, Receipt, Clock,
  FileText, Check, AlertCircle, Sparkles, Layers, Users,
  ShoppingCart, Percent, BarChart3, Download, LayoutDashboard, Lock, Play, Database
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import {
  GLAccount, JournalVoucher, JournalEntryItem, CityLedgerAccount,
  DepartmentalSyncStatus, AccountCategory
} from '../types/pms';
import * as XLSX from 'xlsx';
import { cloudSqlSyncService, CloudSqlSyncStatus } from '../services/cloudSqlSyncService';
import { CloudSqlSyncModal } from '../components/common/CloudSqlSyncModal';
import { rbacService } from '../services/rbacService';

// Modular Finance Tabs
import { AccountsReceivableTab } from '../components/finance/AccountsReceivableTab';
import { AccountsPayableTab } from '../components/finance/AccountsPayableTab';
import { GuestLedgerTab } from '../components/finance/GuestLedgerTab';
import { SupplierLedgerTab } from '../components/finance/SupplierLedgerTab';
import { CashBankTab } from '../components/finance/CashBankTab';
import { AccountingMappingTab } from '../components/finance/AccountingMappingTab';
import { TaxesTab } from '../components/finance/TaxesTab';
import { FinancePaymentsTab } from '../components/finance/FinancePaymentsTab';
import { FinanceReceiptsTab } from '../components/finance/FinanceReceiptsTab';
import { FinancialReportsTab } from '../components/finance/FinancialReportsTab';
import { FinanceDashboardTab } from '../components/finance/FinanceDashboardTab';
import { FinancialReconciliationCenterTab } from '../components/finance/FinancialReconciliationCenterTab';
import { AccountingMappingTestTab } from '../components/finance/AccountingMappingTestTab';
import { CriticalAccountingTestsTab } from '../components/finance/CriticalAccountingTestsTab';
import { FinanceSearchModal } from '../components/finance/FinanceSearchModal';
import { FiscalPeriodModal } from '../components/finance/FiscalPeriodModal';
import { NewAccountHeadModal } from '../components/finance/NewAccountHeadModal';
import { AccountHeadDetailModal } from '../components/finance/AccountHeadDetailModal';
import { accountingEngineService } from '../services/accountingEngineService';

export type FinanceTabType =
  | 'dashboard'
  | 'reconciliation'
  | 'ar'
  | 'ap'
  | 'guest-ledger'
  | 'supplier-ledger'
  | 'cash-bank'
  | 'gl'
  | 'jv'
  | 'chart'
  | 'mapping'
  | 'mapping-test'
  | 'critical-tests'
  | 'taxes'
  | 'payments'
  | 'receipts'
  | 'reports'
  | 'sync';

interface AccountingLedgerViewProps {
  initialTab?: string;
  onNavigate?: (route: string) => void;
}

export const AccountingLedgerView: React.FC<AccountingLedgerViewProps> = ({
  initialTab = 'gl',
  onNavigate
}) => {
  const [db, setDb] = useState(pmsService.getState());

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);
  const [activeTab, setActiveTab] = useState<FinanceTabType>((initialTab as FinanceTabType) || 'gl');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as FinanceTabType);
    }
  }, [initialTab]);

  // Chart of Accounts State
  const [glSearch, setGlSearch] = useState('');
  const [glTypeFilter, setGlTypeFilter] = useState<'All' | AccountCategory>('All');
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<GLAccount | null>(null);
  const [isAccountDetailModalOpen, setIsAccountDetailModalOpen] = useState(false);

  // Journal Vouchers State
  const [jvSearch, setJvSearch] = useState('');
  const [jvModuleFilter, setJvModuleFilter] = useState<string>('All');
  const [expandedJvId, setExpandedJvId] = useState<string | null>(null);
  const [isNewJvModalOpen, setIsNewJvModalOpen] = useState(false);
  const [jvDate, setJvDate] = useState(db.settings.currentBusinessDate || new Date().toISOString().split('T')[0]);
  const [jvSourceModule, setJvSourceModule] = useState<JournalVoucher['sourceModule']>('Manual Adjustment');
  const [jvSourceRef, setJvSourceRef] = useState('');
  const [jvNarration, setJvNarration] = useState('');
  const [jvEntries, setJvEntries] = useState<Array<{ accountCode: string; debit: number; credit: number; memo: string }>>([
    { accountCode: '1010', debit: 10000, credit: 0, memo: '' },
    { accountCode: '4010', debit: 0, credit: 10000, memo: '' }
  ]);

  // City Ledger State
  const [isAddClModalOpen, setIsAddClModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedClAccount, setSelectedClAccount] = useState<CityLedgerAccount | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // New Corporate Account State
  const [clCompanyName, setClCompanyName] = useState('');
  const [clContactPerson, setClContactPerson] = useState('');
  const [clPhone, setClPhone] = useState('');
  const [clEmail, setClEmail] = useState('');
  const [clCreditLimit, setClCreditLimit] = useState(500000);
  const [clPaymentTerms, setClPaymentTerms] = useState<CityLedgerAccount['paymentTerms']>('Net 30');
  const [clTaxNumber, setClTaxNumber] = useState('');
  const [clAddress, setClAddress] = useState('');
  const [clNotes, setClNotes] = useState('');

  // Toast / Feedback
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Global Finance Search & Fiscal Period Modals
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isFiscalPeriodModalOpen, setIsFiscalPeriodModalOpen] = useState(false);

  // Supabase Backend State
  const [isCloudSqlModalOpen, setIsCloudSqlModalOpen] = useState(false);
  const [cloudSqlStatus, setCloudSqlStatus] = useState<CloudSqlSyncStatus>(cloudSqlSyncService.getStatus());
  const isDevOrIT = rbacService.isDeveloperOrIT();

  useEffect(() => {
    const unsubSql = cloudSqlSyncService.subscribe(setCloudSqlStatus);
    return () => unsubSql();
  }, []);

  // GL Calculations
  const glAccounts = useMemo(() => {
    return (db.glAccounts || []).filter(a => {
      const matchSearch =
        a.code.includes(glSearch) ||
        a.name.toLowerCase().includes(glSearch.toLowerCase()) ||
        a.category.toLowerCase().includes(glSearch.toLowerCase());
      const matchType = glTypeFilter === 'All' || a.type === glTypeFilter;
      return matchSearch && matchType;
    });
  }, [db.glAccounts, glSearch, glTypeFilter]);

  const glSummary = useMemo(() => {
    const all = db.glAccounts || [];
    const totalAssets = all.filter(a => a.type === 'Asset').reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = all.filter(a => a.type === 'Liability').reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = all.filter(a => a.type === 'Equity').reduce((sum, a) => sum + a.balance, 0);
    const totalRevenue = all.filter(a => a.type === 'Revenue').reduce((sum, a) => sum + a.balance, 0);
    const totalExpenses = all.filter(a => a.type === 'Expense').reduce((sum, a) => sum + a.balance, 0);
    return { totalAssets, totalLiabilities, totalEquity, totalRevenue, totalExpenses };
  }, [db.glAccounts]);

  // JV Calculations
  const jvList = useMemo(() => {
    return (db.journalVouchers || []).filter(v => {
      const matchSearch =
        v.voucherNumber.toLowerCase().includes(jvSearch.toLowerCase()) ||
        v.narration.toLowerCase().includes(jvSearch.toLowerCase()) ||
        v.sourceReference.toLowerCase().includes(jvSearch.toLowerCase());
      const matchModule = jvModuleFilter === 'All' || v.sourceModule === jvModuleFilter;
      return matchSearch && matchModule;
    });
  }, [db.journalVouchers, jvSearch, jvModuleFilter]);

  // JV Builder Validation
  const currentJvDebits = jvEntries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
  const currentJvCredits = jvEntries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);
  const isJvBalanced = currentJvDebits === currentJvCredits && currentJvDebits > 0;

  const handleAddJvRow = () => {
    setJvEntries(prev => [...prev, { accountCode: '1010', debit: 0, credit: 0, memo: '' }]);
  };

  const handleRemoveJvRow = (index: number) => {
    if (jvEntries.length <= 2) return;
    setJvEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateJvRow = (index: number, field: string, value: any) => {
    setJvEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmitNewJv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isJvBalanced) {
      setFeedbackMsg({
        type: 'error',
        text: `Voucher is out of balance. Total debits (৳${(currentJvDebits || 0).toLocaleString()}) must equal total credits (৳${(currentJvCredits || 0).toLocaleString()}).`
      });
      return;
    }

    const formattedEntries: JournalEntryItem[] = jvEntries.map((e, idx) => {
      const acc = db.glAccounts.find(a => a.code === e.accountCode);
      return {
        id: `jve-manual-${Date.now()}-${idx}`,
        accountCode: e.accountCode,
        accountName: acc ? acc.name : 'General Account',
        debit: Number(e.debit) || 0,
        credit: Number(e.credit) || 0,
        memo: e.memo
      };
    });

    const res = pmsService.createJournalVoucher({
      date: jvDate,
      sourceModule: jvSourceModule,
      sourceReference: jvSourceRef || 'MANUAL-ADJ',
      narration: jvNarration,
      entries: formattedEntries
    });

    if (res.success) {
      setFeedbackMsg({
        type: 'success',
        text: `Journal Voucher ${res.voucher?.voucherNumber} posted to General Ledger.`
      });
      setIsNewJvModalOpen(false);
      setJvNarration('');
      setJvSourceRef('');
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const handleReverseJv = (voucher: JournalVoucher) => {
    if (voucher.narration.includes('(REVERSED)')) {
      setFeedbackMsg({ type: 'error', text: 'This voucher has already been reversed.' });
      return;
    }

    const reversedEntries: JournalEntryItem[] = voucher.entries.map((entry, idx) => ({
      id: `jve-rev-${Date.now()}-${idx}`,
      accountCode: entry.accountCode,
      accountName: entry.accountName,
      debit: entry.credit, // swap debit and credit
      credit: entry.debit,
      memo: `Contra reversal of ${voucher.voucherNumber}`
    }));

    const res = pmsService.createJournalVoucher({
      date: db.settings.currentBusinessDate || new Date().toISOString().split('T')[0],
      sourceModule: 'Manual Adjustment',
      sourceReference: `REV-${voucher.voucherNumber}`,
      narration: `Contra Reversal of Journal Voucher ${voucher.voucherNumber}: ${voucher.narration}`,
      entries: reversedEntries
    });

    if (res.success) {
      voucher.narration += ' [REVERSED by Contra JV]';
      pmsService.notify();
      setFeedbackMsg({
        type: 'success',
        text: `Contra Reversal Voucher ${res.voucher?.voucherNumber} generated and posted.`
      });
    }
  };

  const handleAddCityLedgerAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clCompanyName || !clContactPerson || !clPhone) {
      setFeedbackMsg({ type: 'error', text: 'Please fill in Company Name, Contact Person, and Phone.' });
      return;
    }

    const nextNumber = `CL-${1000 + (db.cityLedgerAccounts?.length || 0) + 1}`;
    const newAcc: CityLedgerAccount = {
      id: `cl-${Date.now()}`,
      accountNumber: nextNumber,
      companyName: clCompanyName,
      contactPerson: clContactPerson,
      phone: clPhone,
      email: clEmail,
      address: clAddress,
      taxNumber: clTaxNumber,
      creditLimit: clCreditLimit,
      currentBalance: 0,
      paymentTerms: clPaymentTerms,
      status: 'Active',
      createdAt: new Date().toISOString(),
      notes: clNotes
    };

    if (!db.cityLedgerAccounts) db.cityLedgerAccounts = [];
    db.cityLedgerAccounts.push(newAcc);
    pmsService.notify();

    setFeedbackMsg({ type: 'success', text: `Corporate Account ${newAcc.accountNumber} (${newAcc.companyName}) created.` });
    setIsAddClModalOpen(false);
    setClCompanyName('');
    setClContactPerson('');
    setClPhone('');
    setClEmail('');
    setClTaxNumber('');
    setClAddress('');
    setClNotes('');
  };

  const handleSubmitCityLedgerPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClAccount || payAmount <= 0) return;

    const res = pmsService.recordCityLedgerPayment(
      selectedClAccount.id,
      payAmount,
      payMethod,
      payReference || 'CORP-SETTLE',
      payNotes
    );

    if (res.success) {
      setFeedbackMsg({
        type: 'success',
        text: `Received ৳${(payAmount || 0).toLocaleString()} from ${selectedClAccount.companyName}. JV & Cashier receipt posted.`
      });
      setIsPaymentModalOpen(false);
      setSelectedClAccount(null);
      setPayAmount(0);
      setPayReference('');
      setPayNotes('');
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const handleTriggerDepartmentalSync = () => {
    const res = pmsService.syncAllDepartmentalRevenue();
    setFeedbackMsg({
      type: 'success',
      text: `Departmental Revenue Synchronization completed. ${res.vouchersCreated} Journal Vouchers generated and posted to GL.`
    });
  };

  const exportGL = () => {
    const data = glAccounts.map(a => ({
      'Account Code': a.code,
      'Account Name': a.name,
      'Category': a.category,
      'Account Type': a.type,
      'Current Balance (BDT)': a.balance,
      'Description': a.description
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'General Ledger');
    XLSX.writeFile(wb, `CCULB_GL_Accounts_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportJV = () => {
    const data = jvList.flatMap(v =>
      v.entries.map(e => ({
        'Voucher #': v.voucherNumber,
        'Posting Date': v.date,
        'Source Module': v.sourceModule,
        'Source Reference': v.sourceReference,
        'Narration': v.narration,
        'Account Code': e.accountCode,
        'Account Name': e.accountName,
        'Debit (BDT)': e.debit,
        'Credit (BDT)': e.credit,
        'Memo': e.memo || '',
        'Posted By': v.postedBy,
        'Posted At': v.postedAt
      }))
    );
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Journal Vouchers');
    XLSX.writeFile(wb, `CCULB_Journal_Vouchers_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="w-full max-w-full p-2 sm:p-4 space-y-4 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-6 h-6 text-indigo-900" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Finance & Accounts Ledger</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Double-Entry Balanced
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Enterprise Hotel Accounting System • General Ledger, Sub-Ledgers, Journal Vouchers & Statutory NBR Tax Integration
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Search className="w-3.5 h-3.5 text-gray-600" />
            Global Search
          </button>
          <button
            onClick={() => setIsFiscalPeriodModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Lock className="w-3.5 h-3.5 text-gray-600" />
            Fiscal Period & Audit
          </button>
          {isDevOrIT && (
            <button
              onClick={() => setIsCloudSqlModalOpen(true)}
              className="px-3 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-xs"
              title="Supabase PostgreSQL Backend Status & Accounts Sync"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase: {cloudSqlStatus.connected ? 'Active' : 'Offline'}</span>
              <span className={`w-2 h-2 rounded-full ${cloudSqlStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            </button>
          )}
          <button
            onClick={handleTriggerDepartmentalSync}
            className="px-3 py-2 text-xs font-semibold text-indigo-950 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
            Sync Departmental Revenue
          </button>
          <button
            onClick={() => setIsNewJvModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-gray-600" />
            New Journal Voucher
          </button>
          <button
            onClick={() => setIsAddAccountModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4" />
            New Account Head
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-xs border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-gray-400 hover:text-gray-600 text-xs ml-4">✕</button>
        </div>
      )}

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-gray-200 text-xs font-semibold">
        {[
          { id: 'dashboard', label: 'Finance Dashboard', icon: LayoutDashboard },
          { id: 'reconciliation', label: 'Reconciliation Center', icon: Scale },
          { id: 'ar', label: 'Accounts Receivable (AR)', icon: Building2 },
          { id: 'ap', label: 'Accounts Payable (AP)', icon: ShoppingCart },
          { id: 'guest-ledger', label: 'Guest Ledger', icon: Receipt },
          { id: 'supplier-ledger', label: 'Supplier Ledger', icon: Users },
          { id: 'cash-bank', label: 'Cash & Bank', icon: DollarSign },
          { id: 'gl', label: 'General Ledger', icon: BookOpen },
          { id: 'jv', label: 'Journal Entries (JV)', icon: Scale },
          { id: 'chart', label: 'Chart of Accounts', icon: Layers },
          { id: 'mapping', label: 'Accounting Mapping', icon: Sparkles },
          { id: 'mapping-test', label: 'Mapping Test Tool', icon: Play },
          { id: 'critical-tests', label: 'Critical Tests (8/8)', icon: ShieldCheck },
          { id: 'taxes', label: 'Taxes & Levies', icon: Percent },
          { id: 'payments', label: 'Payments', icon: CreditCard },
          { id: 'receipts', label: 'Receipts', icon: FileText },
          { id: 'reports', label: 'Financial Reports', icon: BarChart3 },
          { id: 'sync', label: 'Departmental Sync', icon: RefreshCw }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as FinanceTabType);
                if (onNavigate) {
                  // Keep route synchronized
                  const routeMap: Record<string, string> = {
                    dashboard: 'finance-dashboard',
                    reconciliation: 'finance-reconciliation',
                    ar: 'accounting-city-ledger',
                    ap: 'finance-ap',
                    'guest-ledger': 'finance-guest-ledger',
                    'supplier-ledger': 'finance-supplier-ledger',
                    'cash-bank': 'finance-cash-bank',
                    gl: 'accounting-gl',
                    jv: 'accounting-jv',
                    chart: 'accounting-chart',
                    mapping: 'accounting-mapping',
                    'mapping-test': 'finance-mapping-test',
                    'critical-tests': 'finance-critical-tests',
                    taxes: 'finance-taxes',
                    payments: 'billing-payments',
                    receipts: 'billing-invoices',
                    reports: 'reports-finance',
                    sync: 'accounting-sync'
                  };
                  if (routeMap[tab.id]) onNavigate(routeMap[tab.id]);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-indigo-900 text-indigo-950 bg-indigo-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-900' : 'text-gray-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* RENDER MODULAR SUB-TAB COMPONENTS */}
      {activeTab === 'dashboard' && (
        <FinanceDashboardTab
          onSwitchTab={(tab) => setActiveTab(tab as FinanceTabType)}
          onOpenNewAccountHead={() => setIsAddAccountModalOpen(true)}
        />
      )}

      {activeTab === 'reconciliation' && <FinancialReconciliationCenterTab />}

      {activeTab === 'mapping-test' && <AccountingMappingTestTab />}

      {activeTab === 'critical-tests' && <CriticalAccountingTestsTab />}

      {activeTab === 'ar' && (
        <AccountsReceivableTab
          onOpenPaymentModal={(acc) => {
            setSelectedClAccount(acc);
            setPayAmount(acc.currentBalance);
            setIsPaymentModalOpen(true);
          }}
          onOpenNewAccountModal={() => setIsAddClModalOpen(true)}
        />
      )}

      {activeTab === 'ap' && <AccountsPayableTab />}

      {activeTab === 'guest-ledger' && <GuestLedgerTab />}

      {activeTab === 'supplier-ledger' && <SupplierLedgerTab />}

      {activeTab === 'cash-bank' && (
        <CashBankTab onOpenNewAccountHead={() => setIsAddAccountModalOpen(true)} />
      )}

      {activeTab === 'mapping' && <AccountingMappingTab />}

      {activeTab === 'taxes' && <TaxesTab />}

      {activeTab === 'payments' && <FinancePaymentsTab />}

      {activeTab === 'receipts' && <FinanceReceiptsTab />}

      {activeTab === 'reports' && <FinancialReportsTab />}

      {/* TAB: GENERAL LEDGER ACCOUNTS */}
      {(activeTab === 'gl' || activeTab === 'chart') && (
        <div className="space-y-6">
          {/* GL Top KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Assets</div>
              <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900 font-mono">৳{(glSummary.totalAssets || 0).toLocaleString()}</div>
              <div className="mt-1 text-[11px] text-emerald-600 font-medium">Current & Fixed Assets</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Liabilities</div>
              <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900 font-mono">৳{(glSummary.totalLiabilities || 0).toLocaleString()}</div>
              <div className="mt-1 text-[11px] text-gray-500">AP, VAT, Service Charges</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Equity</div>
              <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900 font-mono">৳{(glSummary.totalEquity || 0).toLocaleString()}</div>
              <div className="mt-1 text-[11px] text-gray-500">Retained Earnings</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Revenue</div>
              <div className="mt-2 text-xl sm:text-2xl font-bold text-emerald-700 font-mono">৳{(glSummary.totalRevenue || 0).toLocaleString()}</div>
              <div className="mt-1 text-[11px] text-emerald-600 font-medium">Rooms, F&B & Events</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Expenses</div>
              <div className="mt-2 text-xl sm:text-2xl font-bold text-rose-700 font-mono">৳{(glSummary.totalExpenses || 0).toLocaleString()}</div>
              <div className="mt-1 text-[11px] text-gray-500">COGS & Operating OPEX</div>
            </div>
          </div>

          {/* GL Account Table Header & Filters */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search account code, name, category..."
                    value={glSearch}
                    onChange={e => setGlSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1 text-xs">
                  <span className="text-gray-400 px-1 font-medium">Type:</span>
                  {(['All', 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setGlTypeFilter(t)}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                        glTypeFilter === t ? 'bg-indigo-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportGL}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export COA
                </button>
                <button
                  onClick={() => setIsAddAccountModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Account Head
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">GL Code</th>
                    <th className="py-3 px-4">Account Title / Head</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Account Type</th>
                    <th className="py-3 px-4 text-right">Running Balance (BDT)</th>
                    <th className="py-3 px-4 text-center">Status / Scope</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {glAccounts.map(account => (
                    <tr
                      key={account.code}
                      onClick={() => {
                        setSelectedAccountForDetail(account);
                        setIsAccountDetailModalOpen(true);
                      }}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-indigo-950">
                        {account.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {account.name}
                        {account.description && (
                          <div className="text-[10px] text-gray-400 font-normal truncate max-w-xs mt-0.5">
                            {account.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-medium border border-gray-200">
                          {account.department || 'General Accounting'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {account.category}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          account.type === 'Asset'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : account.type === 'Liability'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : account.type === 'Equity'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : account.type === 'Revenue'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {account.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-gray-900">
                        ৳{(account.balance || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {account.isSystem ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Core
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Custom
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAccountForDetail(account);
                              setIsAccountDetailModalOpen(true);
                            }}
                            className="px-2 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors"
                            title="View Account Head Details & Ledger"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setJvEntries([
                                { accountCode: account.code, debit: 0, credit: 0, memo: '' },
                                { accountCode: '1010', debit: 0, credit: 0, memo: '' }
                              ]);
                              setIsNewJvModalOpen(true);
                            }}
                            className="px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
                            title="Post Journal Voucher to this Account Head"
                          >
                            Post JV
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: JOURNAL ENTRIES (JV) */}
      {activeTab === 'jv' && (
        <div className="space-y-6">
          {/* JV Filters */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search voucher #, narration, ref..."
                  value={jvSearch}
                  onChange={e => setJvSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Source:</span>
                <select
                  value={jvModuleFilter}
                  onChange={e => setJvModuleFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden font-medium"
                >
                  <option value="All">All Modules</option>
                  <option value="Front Desk">Front Desk</option>
                  <option value="Restaurant POS">Restaurant POS</option>
                  <option value="Banquet & Events">Banquet & Events</option>
                  <option value="Activities">Activities</option>
                  <option value="Night Audit">Night Audit</option>
                  <option value="Manual Adjustment">Manual Adjustment</option>
                  <option value="Inventory GRN">Inventory GRN</option>
                  <option value="Inventory Consumption">Inventory Consumption</option>
                  <option value="Procurement">Procurement</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportJV}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export Vouchers
              </button>
              <button
                onClick={() => setIsNewJvModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Manual Voucher
              </button>
            </div>
          </div>

          {/* JV Accordion List */}
          <div className="space-y-3">
            {jvList.map(voucher => {
              const isExpanded = expandedJvId === voucher.id;
              return (
                <div
                  key={voucher.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden transition-all"
                >
                  <div
                    onClick={() => setExpandedJvId(isExpanded ? null : voucher.id)}
                    className="p-4 cursor-pointer hover:bg-gray-50/70 transition-colors flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-900 rounded-lg font-mono font-bold text-xs">
                        <Scale className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-indigo-950">{voucher.voucherNumber}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                            {voucher.sourceModule}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">Ref: {voucher.sourceReference}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 font-medium">{voucher.narration}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Total Balanced Amount</div>
                        <div className="text-sm font-bold font-mono text-emerald-800">
                          ৳{(voucher.totalDebit || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-400">
                        <div>{voucher.date}</div>
                        <div className="text-[10px]">{voucher.postedBy}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReverseJv(voucher);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                      >
                        Reverse JV
                      </button>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Double-Entry Breakdown Table */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50/50 p-4 animate-in fade-in duration-150">
                      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-100/70 border-b border-gray-200 text-gray-600 font-semibold uppercase">
                            <tr>
                              <th className="py-2.5 px-3">GL Account Code & Name</th>
                              <th className="py-2.5 px-3">Memo / Line Narration</th>
                              <th className="py-2.5 px-3 text-right">Debit (BDT)</th>
                              <th className="py-2.5 px-3 text-right">Credit (BDT)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {voucher.entries.map((entry, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/70">
                                <td className="py-2.5 px-3">
                                  <span className="font-mono font-bold text-indigo-950">[{entry.accountCode}]</span>{' '}
                                  <span className="font-medium text-gray-900">{entry.accountName}</span>
                                </td>
                                <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px]">
                                  {entry.memo || '-'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                                  {entry.debit > 0 ? `৳${(entry.debit || 0).toLocaleString()}` : '-'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                                  {entry.credit > 0 ? `৳${(entry.credit || 0).toLocaleString()}` : '-'}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-gray-100 font-bold text-gray-900 border-t border-gray-200">
                              <td className="py-2.5 px-3" colSpan={2}>VOUCHER TOTAL (BALANCED)</td>
                              <td className="py-2.5 px-3 text-right font-mono text-emerald-800">৳{(voucher.totalDebit || 0).toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-right font-mono text-emerald-800">৳{(voucher.totalCredit || 0).toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: DEPARTMENTAL SYNC */}
      {activeTab === 'sync' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Automated Revenue Synchronization Engine
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Synchronizes operational transactions from Front Office, Restaurant, Banquet & Convention, Recreation and Inventory into double-entry General Ledger postings.
                </p>
              </div>

              <button
                onClick={handleTriggerDepartmentalSync}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-xs flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Run Instant Global Revenue Sync
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(db.departmentalSyncs || []).map(dept => (
                <div key={dept.department} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-900">{dept.department}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {dept.syncStatus || 'Synchronized'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Debit GL Account:</span>
                      <span className="font-mono font-bold text-indigo-950">{dept.glAccountCode || dept.glAccountMapping?.debitAccount || '1100'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credit GL Account:</span>
                      <span className="font-semibold text-gray-800">{dept.glAccountName || dept.glAccountMapping?.creditAccount || '4010'}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200">
                      <span>Total Revenue Posted:</span>
                      <span className="font-mono font-bold text-emerald-800">৳{(dept.totalRevenuePosted ?? dept.totalVolume ?? 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-400 font-mono">
                    Last Synced: {dept.lastSyncTime ? dept.lastSyncTime.replace('T', ' ').slice(0, 16) : 'Just Now'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE NEW ACCOUNT HEAD */}
      <NewAccountHeadModal
        isOpen={isAddAccountModalOpen}
        onClose={() => setIsAddAccountModalOpen(false)}
        onSuccess={(newAccount) => {
          setFeedbackMsg({
            type: 'success',
            text: `Account Head ${newAccount.code} - ${newAccount.name} created successfully in Chart of Accounts.`
          });
        }}
      />

      {/* MODAL: ACCOUNT HEAD DETAILS & LEDGER HISTORY */}
      <AccountHeadDetailModal
        account={selectedAccountForDetail}
        isOpen={isAccountDetailModalOpen}
        onClose={() => {
          setIsAccountDetailModalOpen(false);
          setSelectedAccountForDetail(null);
        }}
        onOpenJvModalWithAccount={(code) => {
          setJvEntries([
            { accountCode: code, debit: 0, credit: 0, memo: '' },
            { accountCode: '1010', debit: 0, credit: 0, memo: '' }
          ]);
          setIsNewJvModalOpen(true);
        }}
        onSuccess={() => {
          setFeedbackMsg({
            type: 'success',
            text: 'Chart of Accounts updated successfully.'
          });
        }}
      />

      {/* MODAL 2: CREATE BALANCED JOURNAL VOUCHER */}
      {isNewJvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Post Manual Journal Voucher (JV)</h2>
                <p className="text-xs text-gray-500">Double-entry voucher with real-time balance validation</p>
              </div>
              <button onClick={() => setIsNewJvModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSubmitNewJv} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Posting Date *</label>
                  <input
                    type="date"
                    required
                    value={jvDate}
                    onChange={e => setJvDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Source Module</label>
                  <select
                    value={jvSourceModule}
                    onChange={e => setJvSourceModule(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  >
                    <option value="Manual Adjustment">Manual Adjustment</option>
                    <option value="Front Desk">Front Desk</option>
                    <option value="Restaurant POS">Restaurant POS</option>
                    <option value="Banquet & Events">Banquet & Events</option>
                    <option value="Activities">Activities</option>
                    <option value="Inventory GRN">Inventory GRN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Reference Doc #</label>
                  <input
                    type="text"
                    placeholder="e.g. ADJ-2026-08"
                    value={jvSourceRef}
                    onChange={e => setJvSourceRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg font-mono focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Narration / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="Explain the reason for posting this journal voucher..."
                  value={jvNarration}
                  onChange={e => setJvNarration(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              {/* Multi-line Entry Builder */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Debit & Credit Entry Lines</span>
                  <button
                    type="button"
                    onClick={handleAddJvRow}
                    className="text-xs font-semibold text-indigo-900 hover:text-indigo-950 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Line
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {jvEntries.map((entry, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                      <div className="col-span-5">
                        <label className="block text-[10px] text-gray-400 font-semibold mb-0.5">GL Account</label>
                        <select
                          value={entry.accountCode}
                          onChange={e => handleUpdateJvRow(idx, 'accountCode', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                        >
                          {db.glAccounts.map(acc => (
                            <option key={acc.code} value={acc.code}>
                              {acc.code} - {acc.name} ({acc.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] text-gray-400 font-semibold mb-0.5">Debit (BDT)</label>
                        <input
                          type="number"
                          min="0"
                          value={entry.debit}
                          onChange={e => handleUpdateJvRow(idx, 'debit', Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-gray-300 rounded-lg font-mono focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] text-gray-400 font-semibold mb-0.5">Credit (BDT)</label>
                        <input
                          type="number"
                          min="0"
                          value={entry.credit}
                          onChange={e => handleUpdateJvRow(idx, 'credit', Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-gray-300 rounded-lg font-mono focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                        />
                      </div>

                      <div className="col-span-1 text-center pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveJvRow(idx)}
                          disabled={jvEntries.length <= 2}
                          className="text-gray-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Balancing summary */}
              <div className="p-3 bg-gray-100 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500">Total Debit: </span>
                  <span className="font-mono font-bold text-gray-900">৳{(currentJvDebits || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Credit: </span>
                  <span className="font-mono font-bold text-gray-900">৳{(currentJvCredits || 0).toLocaleString()}</span>
                </div>
                <div>
                  {isJvBalanced ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Balanced
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                      <AlertTriangle className="w-4 h-4" />
                      Out of Balance (Diff: ৳{(Math.abs(currentJvDebits - currentJvCredits) || 0).toLocaleString()})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsNewJvModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isJvBalanced}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 disabled:opacity-40 rounded-lg shadow-sm"
                >
                  Post Journal Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD CORPORATE ACCOUNT */}
      {isAddClModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h2 className="text-lg font-bold text-gray-900">Register Corporate Account (AR)</h2>
              <button onClick={() => setIsAddClModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleAddCityLedgerAccount} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Beximco Pharma Ltd"
                  value={clCompanyName}
                  onChange={e => setClCompanyName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. Rafiqul Islam"
                    value={clContactPerson}
                    onChange={e => setClContactPerson(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="01711-XXXXXX"
                    value={clPhone}
                    onChange={e => setClPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Credit Limit (BDT)</label>
                  <input
                    type="number"
                    value={clCreditLimit}
                    onChange={e => setClCreditLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg font-mono focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Terms</label>
                  <select
                    value={clPaymentTerms}
                    onChange={e => setClPaymentTerms(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  >
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 45">Net 45 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddClModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-sm"
                >
                  Register Corporate Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RECEIVE CORPORATE PAYMENT */}
      {isPaymentModalOpen && selectedClAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Record Corporate Payment</h2>
                <p className="text-xs text-gray-500">{selectedClAccount.companyName} ({selectedClAccount.accountNumber})</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSubmitCityLedgerPayment} className="mt-4 space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-blue-800 font-semibold">Current Outstanding AR</div>
                  <div className="text-base font-bold text-blue-950 font-mono">৳{(selectedClAccount.currentBalance || 0).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-blue-800">Approved Limit</div>
                  <div className="text-sm font-semibold text-blue-900 font-mono">৳{(selectedClAccount.creditLimit || 0).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Settlement Amount (BDT) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  max={selectedClAccount.currentBalance}
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg font-mono font-bold text-sm focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  >
                    <option value="Bank Transfer">Bank Transfer (BEFTN/RTGS)</option>
                    <option value="Cheque">Corporate Cheque</option>
                    <option value="Pay Order">Bank Pay Order</option>
                    <option value="Cash">Cash Deposit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Instrument / Ref # <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TRF-992812"
                    value={payReference}
                    onChange={e => setPayReference(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg font-mono focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 retreat event settlement"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-sm"
                >
                  Confirm & Post to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Finance Search Modal */}
      <FinanceSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectResult={(item) => {
          if (item.type.includes('Journal') || item.type.includes('Transaction')) {
            setActiveTab('jv');
          } else if (item.type.includes('Folio')) {
            setActiveTab('guest-ledger');
          } else if (item.type.includes('Corporate')) {
            setActiveTab('ar');
          } else if (item.type.includes('Supplier')) {
            setActiveTab('supplier-ledger');
          }
        }}
      />

      {/* Fiscal Period & Immutable Audit Modal */}
      <FiscalPeriodModal
        isOpen={isFiscalPeriodModalOpen}
        onClose={() => setIsFiscalPeriodModalOpen(false)}
      />

      {/* Supabase Synchronization Modal - Developer & IT only */}
      {isDevOrIT && (
        <CloudSqlSyncModal
          isOpen={isCloudSqlModalOpen}
          onClose={() => setIsCloudSqlModalOpen(false)}
        />
      )}
    </div>
  );
};
