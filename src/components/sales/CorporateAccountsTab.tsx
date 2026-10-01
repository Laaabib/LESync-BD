import React, { useState, useEffect } from 'react';
import {
  Building2, Search, Plus, DollarSign, ExternalLink,
  ShieldCheck, AlertTriangle, FileText, CheckCircle2,
  Calendar, Phone, Mail, ArrowUpRight, Filter, ChevronRight,
  TrendingUp, CreditCard, X, RefreshCw
} from 'lucide-react';
import { salesMarketingService, CorporateAccountExtended } from '../../services/salesMarketingService';
import { pmsService } from '../../services/pmsService';

interface CorporateAccountsTabProps {
  onNavigate?: (route: string) => void;
  onOpenNewReservationForCorporate?: (corp: CorporateAccountExtended) => void;
}

export const CorporateAccountsTab: React.FC<CorporateAccountsTabProps> = ({
  onNavigate,
  onOpenNewReservationForCorporate
}) => {
  const [accounts, setAccounts] = useState<CorporateAccountExtended[]>(
    salesMarketingService.getCorporateAccounts()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Credit Warning' | 'Suspended'>('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentAccount, setPaymentAccount] = useState<CorporateAccountExtended | null>(null);
  const [viewStatementAccount, setViewStatementAccount] = useState<CorporateAccountExtended | null>(null);
  const [editAccount, setEditAccount] = useState<CorporateAccountExtended | null>(null);

  // Form states for Add Modal
  const [formCompany, setFormCompany] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCreditLimit, setFormCreditLimit] = useState(500000);
  const [formDiscount, setFormDiscount] = useState(20);
  const [formTerms, setFormTerms] = useState<'Immediate' | 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60'>('Net 30');
  const [formIndustry, setFormIndustry] = useState('Banking & Financial Services');
  const [formTax, setFormTax] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Payment settlement state
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'Bank Transfer' | 'Cash' | 'Cheque'>('Bank Transfer');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const refresh = () => {
    setAccounts(salesMarketingService.getCorporateAccounts());
  };

  useEffect(() => {
    const unsubSales = salesMarketingService.subscribe(refresh);
    const unsubPms = pmsService.subscribe(refresh);
    return () => {
      unsubSales();
      unsubPms();
    };
  }, []);

  const filtered = accounts.filter(a => {
    const term = (searchTerm || '').toLowerCase();
    const matchSearch =
      (a.companyName || '').toLowerCase().includes(term) ||
      (a.contactPerson || '').toLowerCase().includes(term) ||
      (a.accountNumber || '').toLowerCase().includes(term) ||
      (a.email || '').toLowerCase().includes(term);
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalOutstanding = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const totalCreditLimit = accounts.reduce((sum, a) => sum + (a.creditLimit || 0), 0);
  const avgDiscount = accounts.length > 0 ? Math.round(accounts.reduce((sum, a) => sum + a.discountPct, 0) / accounts.length) : 0;
  const activeCount = accounts.filter(a => a.status === 'Active').length;

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany || !formContact || !formPhone) {
      alert('Please fill in required fields (Company name, contact person, phone).');
      return;
    }

    const res = salesMarketingService.createCorporateAccount({
      companyName: formCompany,
      contactPerson: formContact,
      phone: formPhone,
      email: formEmail,
      creditLimit: Number(formCreditLimit),
      discountPct: Number(formDiscount),
      paymentTerms: formTerms,
      industry: formIndustry,
      accountManager: 'Kamran Chowdhury',
      taxNumber: formTax,
      notes: formNotes
    });

    if (res.success) {
      alert(res.message);
      setShowAddModal(false);
      // Reset form
      setFormCompany('');
      setFormContact('');
      setFormPhone('');
      setFormEmail('');
      setFormTax('');
      setFormNotes('');
      refresh();
    } else {
      alert(res.message);
    }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAccount) return;
    if (payAmount <= 0) {
      alert('Please enter a valid payment amount greater than zero.');
      return;
    }

    const res = salesMarketingService.recordCorporateSettlement(
      paymentAccount.id,
      payAmount,
      payMethod,
      payRef || `REF-${Date.now()}`,
      payNotes
    );

    if (res.success) {
      alert(res.message);
      setPaymentAccount(null);
      setPayAmount(0);
      setPayRef('');
      setPayNotes('');
      refresh();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Corporate Metric KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Corporate AR Outstanding</span>
            <Building2 className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-rose-400">
            ৳{(totalOutstanding || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Synced with City Ledger (GL 1150)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Credit Facility</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-slate-100">
            ৳{(totalCreditLimit || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-400 mt-0.5">
            ৳{(totalCreditLimit - totalOutstanding || 0).toLocaleString()} Available Credit
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Average Contract Discount</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-amber-400">
            {avgDiscount}% Flat Tariff
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Negotiated Corporate Margin
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Corporate Accounts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-400">
            {activeCount} / {accounts.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Approved Credit & Direct Billing
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company, contact, code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Credit Warning">Credit Warning</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {onNavigate && (
            <button
              onClick={() => onNavigate('accounting-city-ledger')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors border border-slate-700"
              title="Navigate to Finance Accounts Receivable & City Ledger"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Accounts Receivable (AR)</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Corporate Partner</span>
          </button>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-3.5 py-3 font-bold">Company / Account No.</th>
                <th className="px-3.5 py-3 font-bold">Key Contact & Rep</th>
                <th className="px-3.5 py-3 font-bold">Contract Discount</th>
                <th className="px-3.5 py-3 font-bold text-right">Credit Limit (৳)</th>
                <th className="px-3.5 py-3 font-bold text-right">AR Balance (৳)</th>
                <th className="px-3.5 py-3 font-bold text-center">Status & Terms</th>
                <th className="px-3.5 py-3 font-bold text-right">Actions & Integrations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No corporate accounts found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(c => {
                  const creditUtilization = c.creditLimit > 0 ? (c.currentBalance / c.creditLimit) * 100 : 0;
                  const isNearLimit = creditUtilization >= 80;

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-3.5 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-100">{c.companyName}</p>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span className="text-amber-400">{c.accountNumber}</span>
                              {c.industry && <span>• {c.industry}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3.5 py-3">
                        <p className="font-medium text-slate-200">{c.contactPerson}</p>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                          <span>{c.phone}</span>
                          {c.email && <span>• {c.email}</span>}
                        </div>
                      </td>

                      <td className="px-3.5 py-3">
                        <div className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold text-xs border border-amber-500/25">
                          {c.discountPct}% Off
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{c.contractNumber || 'Standard Rate'}</p>
                      </td>

                      <td className="px-3.5 py-3 text-right font-mono">
                        <div className="font-semibold text-slate-200">৳{(c.creditLimit || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          ৳{(Math.max(0, c.creditLimit - c.currentBalance) || 0).toLocaleString()} Avail
                        </div>
                      </td>

                      <td className="px-3.5 py-3 text-right font-mono">
                        <div className={`font-bold ${c.currentBalance > 0 ? (isNearLimit ? 'text-rose-400' : 'text-amber-400') : 'text-emerald-400'}`}>
                          ৳{(c.currentBalance || 0).toLocaleString()}
                        </div>
                        {isNearLimit && (
                          <div className="flex items-center justify-end space-x-1 text-[9px] text-rose-400 font-sans mt-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{Math.round(creditUtilization)}% Limit</span>
                          </div>
                        )}
                      </td>

                      <td className="px-3.5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          c.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' :
                          c.status === 'Credit Warning' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-rose-500/20 text-rose-300'
                        }`}>
                          {c.status}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{c.paymentTerms}</p>
                      </td>

                      <td className="px-3.5 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {c.currentBalance > 0 && (
                            <button
                              onClick={() => {
                                setPaymentAccount(c);
                                setPayAmount(c.currentBalance);
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px] transition-colors flex items-center space-x-1 shadow-xs"
                              title="Record City Ledger Settlement (Posts to Cashier & General Ledger)"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Settle</span>
                            </button>
                          )}

                          <button
                            onClick={() => setViewStatementAccount(c)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-[11px] transition-colors flex items-center space-x-1 border border-slate-700"
                            title="View Statement & History"
                          >
                            <FileText className="w-3 h-3 text-amber-400" />
                            <span>Ledger</span>
                          </button>

                          <button
                            onClick={() => {
                              if (onOpenNewReservationForCorporate) {
                                onOpenNewReservationForCorporate(c);
                              } else if (onNavigate) {
                                onNavigate('reservations');
                              } else {
                                alert(`Corporate booking mode: ${c.companyName} with ${c.discountPct}% tariff discount.`);
                              }
                            }}
                            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded font-semibold text-[11px] transition-colors"
                            title="Create Corporate Booking"
                          >
                            <span>Book Room</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Record Corporate Payment / Settle AR */}
      {paymentAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Corporate Settlement Payment</h3>
                  <p className="text-[11px] text-slate-400">Post directly to Cash/Bank & reduce City Ledger AR</p>
                </div>
              </div>
              <button onClick={() => setPaymentAccount(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl space-y-1 text-xs border border-slate-800/80">
              <div className="flex justify-between text-slate-400">
                <span>Client Organization:</span>
                <strong className="text-slate-100">{paymentAccount.companyName}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Account / City Ledger No:</span>
                <span className="font-mono text-amber-400">{paymentAccount.accountNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Current Outstanding AR:</span>
                <span className="font-mono font-bold text-rose-400">৳{(paymentAccount.currentBalance || 0).toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Settlement Amount (৳) *</label>
                <input
                  type="number"
                  min="1"
                  max={paymentAccount.currentBalance}
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Bank Transfer">Bank Transfer (GL 1010)</option>
                    <option value="Cash">Cash in Vault (GL 1010)</option>
                    <option value="Cheque">Cheque Clearing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Reference / Cheque No.</label>
                  <input
                    type="text"
                    placeholder="e.g. SCB-FT-991823"
                    value={payRef}
                    onChange={e => setPayRef(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Settlement Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared invoice for August Q3 Conference"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-300">
                ✓ Will automatically post a Journal Voucher: Debit Bank/Cash (1010), Credit City Ledger AR (1150).
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPaymentAccount(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Confirm & Post to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View Statement / Account Details */}
      {viewStatementAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{viewStatementAccount.companyName}</h3>
                <span className="text-[11px] text-amber-400 font-mono">Account {viewStatementAccount.accountNumber}</span>
              </div>
              <button onClick={() => setViewStatementAccount(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400">Credit Limit:</span>
                <p className="text-sm font-bold font-mono text-slate-100 mt-0.5">
                  ৳{(viewStatementAccount.creditLimit || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400">Current Balance (AR):</span>
                <p className="text-sm font-bold font-mono text-rose-400 mt-0.5">
                  ৳{(viewStatementAccount.currentBalance || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400">Negotiated Tariff Discount:</span>
                <p className="text-sm font-bold font-mono text-amber-400 mt-0.5">
                  {viewStatementAccount.discountPct}% Flat
                </p>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400">Payment Terms:</span>
                <p className="text-sm font-bold text-slate-200 mt-0.5">
                  {viewStatementAccount.paymentTerms}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-300">Contact & Key Information</h4>
              <div className="bg-slate-950 p-3 rounded-xl space-y-1 text-slate-300 border border-slate-800">
                <p>Contact Person: <strong>{viewStatementAccount.contactPerson}</strong></p>
                <p>Phone: <span className="font-mono">{viewStatementAccount.phone}</span></p>
                <p>Email: <span className="font-mono text-slate-400">{viewStatementAccount.email || 'N/A'}</span></p>
                <p>Industry: <span className="text-amber-300">{viewStatementAccount.industry}</span></p>
                {viewStatementAccount.taxNumber && <p>TIN / Tax ID: <span className="font-mono">{viewStatementAccount.taxNumber}</span></p>}
                {viewStatementAccount.notes && <p className="italic text-slate-400">"{viewStatementAccount.notes}"</p>}
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              {onNavigate && (
                <button
                  onClick={() => {
                    setViewStatementAccount(null);
                    onNavigate('accounting-city-ledger');
                  }}
                  className="text-xs text-amber-400 hover:underline flex items-center space-x-1"
                >
                  <span>Open detailed AR statement in Finance</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => setViewStatementAccount(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold text-xs ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Corporate Partner */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>Register Corporate Account & City Ledger</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Company / Corporate Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. British American Tobacco Bangladesh"
                  value={formCompany}
                  onChange={e => setFormCompany(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Key Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahfuz Anam (Admin Lead)"
                    value={formContact}
                    onChange={e => setFormContact(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone / Mobile *</label>
                  <input
                    type="text"
                    required
                    placeholder="+880 1711-000000"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Official Email</label>
                  <input
                    type="email"
                    placeholder="corporate@client.com"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Industry Sector</label>
                  <select
                    value={formIndustry}
                    onChange={e => setFormIndustry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Banking & Financial Services">Banking & Financial Services</option>
                    <option value="Telecommunications">Telecommunications</option>
                    <option value="Pharmaceuticals & Healthcare">Pharmaceuticals & Healthcare</option>
                    <option value="Apparel & Ready Made Garments">Apparel & Ready Made Garments</option>
                    <option value="Technology & Software">Technology & Software</option>
                    <option value="Government & Embassy">Government & Embassy</option>
                    <option value="NGO & Development">NGO & Development</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Credit Limit (৳) *</label>
                  <input
                    type="number"
                    min="50000"
                    step="10000"
                    value={formCreditLimit}
                    onChange={e => setFormCreditLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Contract Tariff Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formDiscount}
                    onChange={e => setFormDiscount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Payment Terms</label>
                  <select
                    value={formTerms}
                    onChange={e => setFormTerms(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 45">Net 45 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                    <option value="Immediate">Immediate / Advance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">TIN / Tax Identification No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 192837465019"
                    value={formTax}
                    onChange={e => setFormTax(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Assigned Account Rep</label>
                  <input
                    type="text"
                    readOnly
                    value="Kamran Chowdhury (Senior Commercial Mgr)"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Contract Notes / Billing Instruction</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Executive room upgrade privileges, official voucher mandatory upon check-in"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold"
                >
                  Save & Register Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
