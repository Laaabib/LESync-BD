import React, { useState, useEffect } from 'react';
import {
  Tag, Search, Plus, Calendar, CheckCircle2, Copy,
  Percent, DollarSign, TrendingUp, AlertCircle, X, Sparkles
} from 'lucide-react';
import { salesMarketingService, PromotionCampaign } from '../../services/salesMarketingService';

export const PromotionsCampaignsTab: React.FC = () => {
  const [promotions, setPromotions] = useState<PromotionCampaign[]>(
    salesMarketingService.getPromotions()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals & Test tools
  const [showAddModal, setShowAddModal] = useState(false);
  const [testCode, setTestCode] = useState('');
  const [testAmount, setTestAmount] = useState(12000);
  const [testResult, setTestResult] = useState<{ discount: number; final: number; promo?: PromotionCampaign } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states for Add Promo
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<PromotionCampaign['discountType']>('Percentage');
  const [formVal, setFormVal] = useState(25);
  const [formStart, setFormStart] = useState('2026-09-01');
  const [formEnd, setFormEnd] = useState('2026-11-30');
  const [formMax, setFormMax] = useState(100);
  const [formMinBooking, setFormMinBooking] = useState(5000);
  const [formDesc, setFormDesc] = useState('');

  const refresh = () => {
    setPromotions([...salesMarketingService.getPromotions()]);
  };

  useEffect(() => {
    const unsub = salesMarketingService.subscribe(refresh);
    return () => unsub();
  }, []);

  const filtered = promotions.filter(p => {
    const term = (searchTerm || '').toLowerCase();
    const pName = (p.name || p.title || '').toLowerCase();
    const pCode = (p.code || '').toLowerCase();
    const pDesc = (p.description || '').toLowerCase();
    const matchSearch =
      pName.includes(term) ||
      pCode.includes(term) ||
      pDesc.includes(term);
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRedemptions = promotions.reduce((sum, p) => sum + (p.currentRedemptions || 0), 0);
  const totalRevenue = promotions.reduce((sum, p) => sum + (p.revenueGenerated || 0), 0);
  const activeCount = promotions.filter(p => p.status === 'Active').length;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleTestPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCode) return;
    const res = salesMarketingService.applyPromoCode(testCode, Number(testAmount));
    if (res.valid && res.promo) {
      setTestResult({
        discount: res.discountAmount,
        final: res.finalAmount,
        promo: res.promo
      });
    } else {
      alert(`Invalid or expired promo code: ${testCode}`);
      setTestResult(null);
    }
  };

  const handleToggleStatus = (promo: PromotionCampaign) => {
    const newStatus = promo.status === 'Active' ? 'Paused' : 'Active';
    salesMarketingService.updatePromotion(promo.id, { status: newStatus });
    refresh();
  };

  const handleAddPromotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCode) {
      alert('Please fill in promotion name and promotional code.');
      return;
    }

    salesMarketingService.addPromotion({
      name: formName,
      code: formCode.toUpperCase().trim(),
      discountType: formType,
      discountValue: Number(formVal),
      startDate: formStart,
      endDate: formEnd,
      maxRedemptions: Number(formMax),
      currentRedemptions: 0,
      minBookingValue: Number(formMinBooking),
      applicableTo: ['Online Direct', 'Walk-in', 'Corporate'],
      status: 'Active',
      revenueGenerated: 0,
      description: formDesc || 'Special seasonal promotional discount campaign'
    });

    alert(`Campaign '${formName}' created with promo code ${formCode.toUpperCase()}.`);
    setShowAddModal(false);
    setFormName('');
    setFormCode('');
    setFormDesc('');
  };

  return (
    <div className="space-y-4">
      {/* Top Campaign KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Campaigns</span>
            <Tag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-slate-100">
            {activeCount} Active
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Seasonal & corporate coupon codes
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Redemptions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-400">
            {totalRedemptions} Applied
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Across room & banquet reservations
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Attributed Production</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-blue-400">
            ৳{(totalRevenue || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Gross revenue traced to promotions
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Average Tariff Waiver</span>
            <Percent className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-purple-400">
            18.5% Avg
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Controlled marketing margin impact
          </p>
        </div>
      </div>

      {/* Control Bar & Live Promo Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search promo name, code..."
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
              <option value="Paused">Paused</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Promotion</span>
          </button>
        </div>

        {/* Live Promo Validator Tool for Front Office / Sales Desk */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xs">
          <form onSubmit={handleTestPromo} className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Sparkles className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-amber-400" />
              <input
                type="text"
                placeholder="Test Promo Code..."
                value={testCode}
                onChange={e => setTestCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-amber-500 font-mono uppercase"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold rounded-lg text-xs transition-colors shrink-0"
            >
              Verify
            </button>
          </form>
          {testResult && (
            <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-300 flex justify-between items-center">
              <span>Code Valid: <strong>-৳{(testResult.discount || 0).toLocaleString()}</strong></span>
              <span className="font-mono font-bold text-white">Net: ৳{(testResult.final || 0).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-full py-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-xs">
            No promotional campaigns found matching criteria.
          </div>
        ) : (
          filtered.map(promo => {
            const maxR = promo.maxRedemptions ?? promo.usageLimit ?? 100;
            const currentR = promo.currentRedemptions ?? promo.usageCount ?? 0;
            const usagePct = maxR > 0 ? Math.round((currentR / maxR) * 100) : 0;
            const promoTitle = promo.name || promo.title || promo.code;
            const promoStart = promo.startDate || promo.validFrom || '';
            const promoEnd = promo.endDate || promo.validTo || '';
            const attributedRev = promo.revenueGenerated ?? promo.totalRevenueGenerated ?? 0;

            return (
              <div
                key={promo.id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      promo.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' :
                      promo.status === 'Paused' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {promo.status}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {promoStart} to {promoEnd}
                    </span>
                  </div>

                  {/* Promo Code Badge */}
                  <div className="mt-2.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-amber-400" />
                      <span className="font-mono font-bold text-amber-400 text-sm tracking-wider">
                        {promo.code}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(promo.code)}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Copy promo code"
                    >
                      {copiedCode === promo.code ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 mt-2">{promoTitle}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{promo.description}</p>
                </div>

                <div className="space-y-2 border-t border-slate-800/80 pt-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Discount Offer:</span>
                    <span className="font-bold text-emerald-400">
                      {promo.discountType === 'Percentage' ? `${promo.discountValue}% Off` : `৳${promo.discountValue} Flat Off`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Attributed Revenue:</span>
                    <span className="font-mono font-bold text-slate-200">
                      ৳{(attributedRev || 0).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Redemptions</span>
                      <span>{currentR} / {maxR} ({usagePct}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, usagePct)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleToggleStatus(promo)}
                      className="text-[11px] text-slate-400 hover:text-amber-400 transition-colors"
                    >
                      {promo.status === 'Active' ? 'Pause Campaign' : 'Resume Campaign'}
                    </button>

                    <button
                      onClick={() => {
                        setTestCode(promo.code);
                        const res = salesMarketingService.applyPromoCode(promo.code, 15000);
                        setTestResult({
                          discount: res.discountAmount,
                          final: res.finalAmount,
                          promo
                        });
                      }}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-[11px] border border-slate-700"
                    >
                      Test Code
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Create New Promotion */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>Launch Promotional Campaign</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPromotion} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Winter Holiday Cottage Getaway"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Promo Voucher Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WINTER25"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Discount Model</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Percentage">Percentage (%) Off</option>
                    <option value="Flat Discount">Flat Cash (৳) Off</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Discount Value</label>
                  <input
                    type="number"
                    min="1"
                    value={formVal}
                    onChange={e => setFormVal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    min="1"
                    value={formMax}
                    onChange={e => setFormMax(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Min Order Value (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={formMinBooking}
                    onChange={e => setFormMinBooking(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStart}
                    onChange={e => setFormStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formEnd}
                    onChange={e => setFormEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Campaign Description</label>
                <textarea
                  rows={2}
                  placeholder="Terms, eligibility criteria and public promotional copy"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
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
                  Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
