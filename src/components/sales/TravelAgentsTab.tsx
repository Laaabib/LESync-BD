import React, { useState, useEffect } from 'react';
import {
  Users, Search, Plus, DollarSign, ExternalLink,
  ShieldCheck, AlertTriangle, CheckCircle2, TrendingUp,
  CreditCard, Phone, Mail, FileText, X, Globe, Building
} from 'lucide-react';
import { salesMarketingService, TravelAgent, AgentPayoutRecord } from '../../services/salesMarketingService';

interface TravelAgentsTabProps {
  onNavigate?: (route: string) => void;
}

export const TravelAgentsTab: React.FC<TravelAgentsTabProps> = ({ onNavigate }) => {
  const [agents, setAgents] = useState<TravelAgent[]>(salesMarketingService.getTravelAgents());
  const [payouts, setPayouts] = useState<AgentPayoutRecord[]>(salesMarketingService.getAgentPayouts());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Suspended'>('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [payoutAgent, setPayoutAgent] = useState<TravelAgent | null>(null);
  const [showPayoutHistory, setShowPayoutHistory] = useState(false);

  // Form states for Add Agent
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formIata, setFormIata] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRate, setFormRate] = useState(10);
  const [formType, setFormType] = useState<'Percentage' | 'Flat Fee'>('Percentage');
  const [formNotes, setFormNotes] = useState('');

  // Form states for Commission Payout
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'Bank Transfer' | 'Cash' | 'Cheque'>('Bank Transfer');
  const [payRef, setPayRef] = useState('');
  const [payRemarks, setPayRemarks] = useState('');

  const refresh = () => {
    setAgents([...salesMarketingService.getTravelAgents()]);
    setPayouts([...salesMarketingService.getAgentPayouts()]);
  };

  useEffect(() => {
    const unsub = salesMarketingService.subscribe(refresh);
    return () => unsub();
  }, []);

  const filtered = agents.filter(a => {
    const term = (searchTerm || '').toLowerCase();
    const matchSearch =
      (a.name || '').toLowerCase().includes(term) ||
      (a.code || '').toLowerCase().includes(term) ||
      (a.contactPerson || '').toLowerCase().includes(term) ||
      (a.iataNumber || '').toLowerCase().includes(term);
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = agents.reduce((sum, a) => sum + (a.totalBookedRevenue || 0), 0);
  const totalCommissionEarned = agents.reduce((sum, a) => sum + (a.totalCommissionEarned || 0), 0);
  const totalCommissionPaid = agents.reduce((sum, a) => sum + (a.totalCommissionPaid || 0), 0);
  const totalPendingCommission = agents.reduce((sum, a) => sum + (a.pendingCommission || 0), 0);

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formContact || !formPhone) {
      alert('Please fill in agency name, contact person, and phone.');
      return;
    }

    salesMarketingService.addTravelAgent({
      name: formName,
      code: formCode || `TA-${formName.substring(0, 4).toUpperCase()}`,
      iataNumber: formIata,
      contactPerson: formContact,
      phone: formPhone,
      email: formEmail,
      commissionType: formType,
      commissionRate: Number(formRate),
      status: 'Active',
      notes: formNotes
    });

    alert(`Travel agent ${formName} registered with ${formRate}% commission terms.`);
    setShowAddModal(false);
    setFormName('');
    setFormCode('');
    setFormIata('');
    setFormContact('');
    setFormPhone('');
    setFormEmail('');
    setFormNotes('');
  };

  const handleRecordPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAgent) return;
    if (payAmount <= 0) {
      alert('Please enter a valid payout amount.');
      return;
    }

    const res = salesMarketingService.recordAgentCommissionPayout({
      agentId: payoutAgent.id,
      amount: payAmount,
      paymentMethod: payMethod,
      referenceNumber: payRef || `COMM-VOUCHER-${Date.now()}`,
      remarks: payRemarks
    });

    if (res.success) {
      alert(res.message);
      setPayoutAgent(null);
      setPayAmount(0);
      setPayRef('');
      setPayRemarks('');
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Agent KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>YTD Agent Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-400">
            ৳{(totalRevenue || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Bookings generated via OTAs & Agents
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Commission Earned</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-slate-100">
            ৳{(totalCommissionEarned || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Contracted partner commission
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Commission Disbursed</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-blue-400">
            ৳{(totalCommissionPaid || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Settled via General Ledger (GL 5050)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Pending Commission Payout</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-rose-400">
            ৳{(totalPendingCommission || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Due for disbursement to partners
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
              placeholder="Search agent, IATA, contact..."
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
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowPayoutHistory(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors border border-slate-700"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Payout Receipts ({payouts.length})</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Register Agency / OTA</span>
          </button>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-3.5 py-3 font-bold">Agency / OTA Name</th>
                <th className="px-3.5 py-3 font-bold">Key Contact & IATA</th>
                <th className="px-3.5 py-3 font-bold text-center">Commission Model</th>
                <th className="px-3.5 py-3 font-bold text-right">Active Bookings</th>
                <th className="px-3.5 py-3 font-bold text-right">Gross Production (৳)</th>
                <th className="px-3.5 py-3 font-bold text-right">Pending Payout (৳)</th>
                <th className="px-3.5 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No travel agents found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(ta => (
                  <tr key={ta.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3.5 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0">
                          <Globe className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-100">{ta.name}</p>
                          <span className="text-[10px] text-amber-400 font-mono">{ta.code}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-3.5 py-3">
                      <p className="font-medium text-slate-200">{ta.contactPerson}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{ta.phone}</span>
                        {ta.iataNumber && <span className="font-mono text-slate-500">• {ta.iataNumber}</span>}
                      </div>
                    </td>

                    <td className="px-3.5 py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-500/30">
                        {ta.commissionRate}% {ta.commissionType}
                      </span>
                    </td>

                    <td className="px-3.5 py-3 text-right font-mono">
                      <span className="font-bold text-slate-200">{ta.activeBookings} Bookings</span>
                    </td>

                    <td className="px-3.5 py-3 text-right font-mono">
                      <div className="font-bold text-emerald-400">৳{(ta.totalBookedRevenue || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">Earned: ৳{(ta.totalCommissionEarned || 0).toLocaleString()}</div>
                    </td>

                    <td className="px-3.5 py-3 text-right font-mono">
                      <div className={`font-bold ${ta.pendingCommission > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        ৳{(ta.pendingCommission || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">Paid: ৳{(ta.totalCommissionPaid || 0).toLocaleString()}</div>
                    </td>

                    <td className="px-3.5 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {ta.pendingCommission > 0 ? (
                          <button
                            onClick={() => {
                              setPayoutAgent(ta);
                              setPayAmount(ta.pendingCommission);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px] transition-colors flex items-center space-x-1 shadow-xs"
                            title="Disburse Commission Payout to Agent"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Pay Commission</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-500/10 rounded">
                            Settled
                          </span>
                        )}

                        <button
                          onClick={() => {
                            if (onNavigate) {
                              onNavigate('reservations');
                            } else {
                              alert(`Booking mode: Agency ${ta.name} with ${ta.commissionRate}% commission.`);
                            }
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-[11px] transition-colors border border-slate-700"
                        >
                          Book Room
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Pay Commission */}
      {payoutAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Disburse Commission Payout</h3>
                  <p className="text-[11px] text-slate-400">Post debit to Commission Expense (5050) & credit Bank/Cash</p>
                </div>
              </div>
              <button onClick={() => setPayoutAgent(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl space-y-1 text-xs border border-slate-800/80">
              <div className="flex justify-between text-slate-400">
                <span>Travel Agency / Partner:</span>
                <strong className="text-slate-100">{payoutAgent.name}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Commission Pending:</span>
                <span className="font-mono font-bold text-rose-400">৳{(payoutAgent.pendingCommission || 0).toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayout} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Disbursement Amount (৳) *</label>
                <input
                  type="number"
                  min="1"
                  max={payoutAgent.pendingCommission}
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
                    <option value="Cash">Cash in Hand (GL 1010)</option>
                    <option value="Cheque">Corporate Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Voucher / Bank Ref No.</label>
                  <input
                    type="text"
                    placeholder="e.g. EFT-2026-098"
                    value={payRef}
                    onChange={e => setPayRef(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Commission settlement for August confirmed stays"
                  value={payRemarks}
                  onChange={e => setPayRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[11px] text-blue-300">
                ✓ Will generate Journal Voucher posting: Debit Commission Expense (5050), Credit Cash/Bank (1010).
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPayoutAgent(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Disburse & Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Payout History */}
      {showPayoutHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Commission Payout Ledger</h3>
                <p className="text-[11px] text-slate-400">All recorded travel agent commission disbursements</p>
              </div>
              <button onClick={() => setShowPayoutHistory(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {payouts.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No commission payouts recorded yet.
                </div>
              ) : (
                payouts.map(p => (
                  <div key={p.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-100">{p.agentName}</strong>
                      <span className="font-mono font-bold text-emerald-400">৳{(p.amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Ref: {p.referenceNumber} • Method: {p.paymentMethod}</span>
                      <span>{p.payoutDate}</span>
                    </div>
                    {p.remarks && <p className="text-[11px] text-slate-500 italic mt-0.5">"{p.remarks}"</p>}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowPayoutHistory(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Register Agency */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-400" />
                <span>Register Travel Agency / OTA Partner</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAgent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Agency / OTA Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TripAdvisor Experiences Bangladesh"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Channel Code / Prefix</label>
                  <input
                    type="text"
                    placeholder="e.g. TA-TRIPADV"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">IATA / License Number</label>
                  <input
                    type="text"
                    placeholder="e.g. IATA-882910"
                    value={formIata}
                    onChange={e => setFormIata(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Account Manager / Contact *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name & title"
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
                    placeholder="+880 1700-000000"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formRate}
                    onChange={e => setFormRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Commission Model</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Percentage">Percentage (%) of Net Tariff</option>
                    <option value="Flat Fee">Flat Fee Per Night</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Contract Notes / Terms</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bi-weekly commission settlement, minimum 5 room nights monthly threshold"
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
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
