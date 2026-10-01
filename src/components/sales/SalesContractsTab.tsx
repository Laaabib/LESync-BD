import React, { useState, useEffect } from 'react';
import {
  FileText, Search, Plus, Calendar, CheckCircle2, AlertTriangle,
  Printer, Building, Award, Shield, DollarSign, X, ExternalLink
} from 'lucide-react';
import { salesMarketingService, SalesContract } from '../../services/salesMarketingService';

export const SalesContractsTab: React.FC = () => {
  const [contracts, setContracts] = useState<SalesContract[]>(
    salesMarketingService.getContracts()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewAgreementContract, setViewAgreementContract] = useState<SalesContract | null>(null);

  // Form states for Add Contract
  const [formClient, setFormClient] = useState('');
  const [formContractNo, setFormContractNo] = useState(`CTR-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [formEffective, setFormEffective] = useState('2026-01-01');
  const [formExpiry, setFormExpiry] = useState('2026-12-31');
  const [formRateType, setFormRateType] = useState<SalesContract['rateType']>('Corporate Master Agreement');
  const [formDiscount, setFormDiscount] = useState(20);
  const [formCommittedNights, setFormCommittedNights] = useState(150);
  const [formCreditLimit, setFormCreditLimit] = useState(500000);
  const [formTerms, setFormTerms] = useState('Net 30');
  const [formHotelRep, setFormHotelRep] = useState('Director of Sales & Marketing');
  const [formClientRep, setFormClientRep] = useState('');
  const [formConditions, setFormConditions] = useState('');

  const refresh = () => {
    setContracts([...salesMarketingService.getContracts()]);
  };

  useEffect(() => {
    const unsub = salesMarketingService.subscribe(refresh);
    return () => unsub();
  }, []);

  const filtered = contracts.filter(c => {
    const term = (searchTerm || '').toLowerCase();
    const matchSearch =
      (c.contractNumber || '').toLowerCase().includes(term) ||
      (c.clientName || '').toLowerCase().includes(term) ||
      (c.rateType || '').toLowerCase().includes(term);
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCommitted = contracts.reduce((sum, c) => sum + (c.minCommittedRoomNights || 0), 0);
  const totalRealized = contracts.reduce((sum, c) => sum + (c.realizedRoomNights || 0), 0);
  const avgRealization = totalCommitted > 0 ? Math.round((totalRealized / totalCommitted) * 100) : 0;
  const activeCount = contracts.filter(c => c.status === 'Active').length;

  const handleAddContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClient || !formClientRep) {
      alert('Please fill in client organization and client representative name.');
      return;
    }

    salesMarketingService.addContract({
      contractNumber: formContractNo,
      corporateAccountId: `corp-${Date.now()}`,
      clientName: formClient,
      effectiveDate: formEffective,
      expiryDate: formExpiry,
      rateType: formRateType,
      discountPct: Number(formDiscount),
      minCommittedRoomNights: Number(formCommittedNights),
      realizedRoomNights: 0,
      creditLimit: Number(formCreditLimit),
      paymentTerms: formTerms,
      signedByHotelRep: formHotelRep,
      signedByClientRep: formClientRep,
      specialConditions: formConditions || 'Contracted negotiated corporate tariff with direct City Ledger credit facility.',
      status: 'Active'
    });

    alert(`Corporate contract ${formContractNo} for ${formClient} registered.`);
    setShowAddModal(false);
    setFormClient('');
    setFormClientRep('');
    setFormConditions('');
  };

  const handlePrintAgreement = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Contract KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Master Contracts</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-slate-100">
            {activeCount} Agreements
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Corporate & institutional rate plans
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Committed Room Nights</span>
            <Building className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-blue-400">
            {(totalCommitted || 0).toLocaleString()} Nights
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Annual minimum contracted volume
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Realized Room Nights</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-400">
            {(totalRealized || 0).toLocaleString()} Nights
          </div>
          <p className="text-[11px] text-emerald-500 mt-0.5">
            {avgRealization}% realization to date
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Average Tariff Waiver</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-purple-400">
            20% Flat Discount
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Standard corporate discount tier
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
              placeholder="Search contract no., client, tier..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Corporate Contract</span>
        </button>
      </div>

      {/* Contracts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-3.5 py-3 font-bold">Contract No. & Client</th>
                <th className="px-3.5 py-3 font-bold">Rate Tier / Scheme</th>
                <th className="px-3.5 py-3 font-bold">Validity Period</th>
                <th className="px-3.5 py-3 font-bold text-center">Room Nights Progress</th>
                <th className="px-3.5 py-3 font-bold text-right">Credit & Terms</th>
                <th className="px-3.5 py-3 font-bold text-center">Status</th>
                <th className="px-3.5 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No contracts found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(c => {
                  const progressPct = c.minCommittedRoomNights > 0
                    ? Math.round((c.realizedRoomNights / c.minCommittedRoomNights) * 100)
                    : 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-3.5 py-3">
                        <p className="font-mono font-bold text-amber-400">{c.contractNumber}</p>
                        <p className="font-bold text-slate-100 mt-0.5">{c.clientName}</p>
                      </td>

                      <td className="px-3.5 py-3">
                        <span className="font-semibold text-slate-200">{c.rateType}</span>
                        <div className="text-[10px] text-amber-400 mt-0.5">{c.discountPct}% Discount Flat</div>
                      </td>

                      <td className="px-3.5 py-3 font-mono text-[11px] text-slate-300">
                        <div>{c.effectiveDate}</div>
                        <div className="text-slate-500">to {c.expiryDate}</div>
                      </td>

                      <td className="px-3.5 py-3 text-center">
                        <div className="text-slate-200 font-bold font-mono">
                          {c.realizedRoomNights} / {c.minCommittedRoomNights} Nights
                        </div>
                        <div className="w-28 mx-auto bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, progressPct)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{progressPct}% Met</span>
                      </td>

                      <td className="px-3.5 py-3 text-right font-mono">
                        <div className="font-semibold text-slate-200">৳{(c.creditLimit || 0).toLocaleString()}</div>
                        <span className="text-[10px] text-slate-400">{c.paymentTerms}</span>
                      </td>

                      <td className="px-3.5 py-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                          {c.status}
                        </span>
                      </td>

                      <td className="px-3.5 py-3 text-right">
                        <button
                          onClick={() => setViewAgreementContract(c)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-[11px] transition-colors border border-slate-700 inline-flex items-center space-x-1"
                          title="View Official Agreement Document & Print"
                        >
                          <FileText className="w-3 h-3 text-amber-400" />
                          <span>View Agreement</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: View Official Printable Agreement */}
      {viewAgreementContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-100">Corporate Master Tariff Agreement</h3>
                  <p className="text-xs text-amber-400 font-mono">{viewAgreementContract.contractNumber}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrintAgreement}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Agreement</span>
                </button>
                <button onClick={() => setViewAgreementContract(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 text-xs text-slate-300">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">CCULB Resort & Convention Hall</h4>
                  <p className="text-[11px] text-slate-400">Joypara, Dohar, Dhaka - 1330, Bangladesh</p>
                  <p className="text-[11px] text-slate-400">LESync PMS Commercial Contracting Division</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase">Effective Validity</span>
                  <p className="font-mono text-slate-200 font-bold">{viewAgreementContract.effectiveDate} to {viewAgreementContract.expiryDate}</p>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">Active Enforced</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase tracking-wider">Parties to Agreement</span>
                <div className="grid grid-cols-2 gap-3 mt-1 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-slate-400">First Party (Hotel):</span>
                    <p className="font-bold text-slate-100 mt-0.5">CCULB Resort & Convention Hall</p>
                    <p className="text-slate-400 text-[11px]">Authorized Rep: {viewAgreementContract.signedByHotelRep}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Second Party (Client):</span>
                    <p className="font-bold text-amber-300 mt-0.5">{viewAgreementContract.clientName}</p>
                    <p className="text-slate-400 text-[11px]">Authorized Rep: {viewAgreementContract.signedByClientRep}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-slate-500 text-[10px] uppercase tracking-wider">Agreed Terms & Conditions</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Negotiated Tariff:</span>
                    <p className="font-bold text-amber-400 mt-0.5">{viewAgreementContract.discountPct}% Flat Off Rack Rate</p>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Committed Nights:</span>
                    <p className="font-bold text-slate-200 mt-0.5 font-mono">{viewAgreementContract.minCommittedRoomNights} Room Nights / Year</p>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px]">City Ledger Credit Limit:</span>
                    <p className="font-bold text-slate-200 mt-0.5 font-mono">৳{(viewAgreementContract.creditLimit || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase tracking-wider">Special Stipulations</span>
                <p className="mt-1 p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 leading-relaxed italic">
                  "{viewAgreementContract.specialConditions || 'Standard hotel corporate terms apply. Late checkout up to 15:00 subject to cottage availability. 10% F&B discount across restaurant outlets.'}"
                </p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                <div className="text-center">
                  <div className="h-10 border-b border-dashed border-slate-700 flex items-center justify-center">
                    <span className="text-emerald-400 font-serif italic text-xs">Digitally Verified Seal</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-300 mt-1">For CCULB Resort Hospitality</p>
                  <p className="text-[10px] text-slate-500">{viewAgreementContract.signedByHotelRep}</p>
                </div>
                <div className="text-center">
                  <div className="h-10 border-b border-dashed border-slate-700 flex items-center justify-center">
                    <span className="text-amber-400 font-serif italic text-xs">Official Corporate Signatory</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-300 mt-1">For {viewAgreementContract.clientName}</p>
                  <p className="text-[10px] text-slate-500">{viewAgreementContract.signedByClientRep}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewAgreementContract(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Contract */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Register Corporate Master Contract</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddContract} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Contract Number *</label>
                  <input
                    type="text"
                    required
                    value={formContractNo}
                    onChange={e => setFormContractNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Client Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grameenphone Corporate HR"
                    value={formClient}
                    onChange={e => setFormClient(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={formEffective}
                    onChange={e => setFormEffective(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formExpiry}
                    onChange={e => setFormExpiry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Rate Agreement Scheme</label>
                  <select
                    value={formRateType}
                    onChange={e => setFormRateType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Corporate Master Agreement">Corporate Master Agreement</option>
                    <option value="Volume Tier 1 Discount">Volume Tier 1 Discount</option>
                    <option value="Executive Hall & Suites">Executive Hall & Suites</option>
                    <option value="Fixed Room Rate Tariff">Fixed Room Rate Tariff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Negotiated Discount (%)</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={formDiscount}
                    onChange={e => setFormDiscount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Committed Nights</label>
                  <input
                    type="number"
                    min="10"
                    value={formCommittedNights}
                    onChange={e => setFormCommittedNights(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Credit Limit (৳)</label>
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
                  <label className="block text-slate-400 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={formTerms}
                    onChange={e => setFormTerms(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Hotel Signatory Rep</label>
                  <input
                    type="text"
                    value={formHotelRep}
                    onChange={e => setFormHotelRep(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Client Signatory Rep *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name & title"
                    value={formClientRep}
                    onChange={e => setFormClientRep(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Special Terms / Perks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Free high-speed WiFi, guaranteed cottage hold until 18:00, 10% F&B rebate"
                  value={formConditions}
                  onChange={e => setFormConditions(e.target.value)}
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
                  Save Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
