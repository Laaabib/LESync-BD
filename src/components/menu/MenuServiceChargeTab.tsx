// CCULB PMS - Service Charge Management & Staff Pool Distribution Tab
// Configures 10% Service Charge Rules, Staff Welfare Pool Distribution, and GL Liability 2110 Posting

import React, { useState, useMemo } from 'react';
import {
  Percent, Plus, Edit3, Trash2, ShieldCheck, DollarSign,
  Users, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Send
} from 'lucide-react';
import { inventoryMenuService } from '../../services/inventoryMenuService';
import { ServiceChargeRule, OutletType } from '../../types/inventoryMenu';
import { pmsService } from '../../services/pmsService';

export const MenuServiceChargeTab: React.FC = () => {
  const scRules = inventoryMenuService.getServiceChargeRules();
  const db = pmsService.getState();
  const orders = db.restaurantOrders || [];
  const glAccounts = db.glAccounts || [];

  // Find 2110 Service Charge GL
  const scGlAccount = glAccounts.find(g => g.code === '2110') || {
    code: '2110',
    name: 'Service Charge Payable (10% Staff Pool)',
    balance: 48500
  };

  // Compute total SC collected MTD
  const mtdScCollected = useMemo(() => {
    return orders
      .filter(o => o.status !== 'Voided')
      .reduce((sum, o) => sum + (o.serviceCharge || (o.subtotal ? o.subtotal * 0.1 : 0)), 0) || 53500;
  }, [orders]);

  // Distribution Modal
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);
  const [distributeAmount, setDistributeAmount] = useState<number>(Math.round(mtdScCollected * 0.8));
  const [distributionMonth, setDistributionMonth] = useState('August 2026');
  const [approvedBy, setApprovedBy] = useState('F&B Director Tanvir Hasan');
  const [distributeSuccess, setDistributeSuccess] = useState(false);

  // Handle Distribute Service Charge Pool
  const handleDistribute = () => {
    if (distributeAmount <= 0) return;
    inventoryMenuService.distributeStaffServiceChargePool(distributeAmount, distributionMonth, approvedBy);
    setDistributeSuccess(true);
    setTimeout(() => {
      setDistributeSuccess(false);
      setIsDistributeModalOpen(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Percent className="w-5 h-5 text-emerald-600" />
            10% F&B Service Charge & Staff Welfare Pool
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage mandatory and discretionary dining service charges, staff distribution ratios, and GL Account 2110 balances
          </p>
        </div>

        <button
          onClick={() => {
            setDistributeAmount(Math.round((scGlAccount.balance || 48500) * 0.8));
            setIsDistributeModalOpen(true);
          }}
          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Send className="w-4 h-4" />
          Disburse Staff SC Pool (JV)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              GL 2110 Pool Balance
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1">
            ৳{(scGlAccount?.balance ?? 48500).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">
            Accumulated in Liability Account 2110
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              MTD Service Charge Collected
            </span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-blue-800 mt-1">
            ৳{(mtdScCollected || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">
            From {orders.length || 24} settled dining checks
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Staff Welfare Pool Ratio
            </span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-purple-800 mt-1">
            80% / 20%
          </div>
          <span className="text-[10px] text-purple-600 font-medium">
            80% Employee Pool • 20% Breakage Reserve
          </span>
        </div>
      </div>

      {/* Service Charge Rules Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-600" />
            Configured Service Charge Policies
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Rule Name</th>
                <th className="py-3 px-3">Rate %</th>
                <th className="py-3 px-3">Applicable Outlets</th>
                <th className="py-3 px-3">GL Liability Account</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {scRules.map(rule => (
                <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {rule.name}
                  </td>
                  <td className="py-3.5 px-3 font-mono font-extrabold text-emerald-700">
                    {rule.ratePercent}%
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {(rule.applicableOutlets || ['Restaurant', 'Bar', 'Room Service']).map(ot => (
                        <span key={ot} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {ot}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-[11px] text-blue-700 font-bold">
                    2110 (Service Charge Payable)
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Distribution Journal Voucher Modal */}
      {isDistributeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                Post Service Charge Staff Pool Disbursement JV
              </h3>
              <button
                onClick={() => setIsDistributeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-slate-700">
                <span className="text-[11px] font-semibold text-emerald-800 block mb-1">
                  Automated Journal Voucher Posting:
                </span>
                <p className="text-[11px] font-mono leading-relaxed">
                  • <strong>Debit</strong> GL 2110 Service Charge Payable (৳{(distributeAmount || 0).toLocaleString()})<br />
                  • <strong>Credit</strong> GL 1010 Bank / Cash Account (৳{(distributeAmount || 0).toLocaleString()})
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Disbursement Period / Month</label>
                <input
                  type="text"
                  value={distributionMonth}
                  onChange={e => setDistributionMonth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Distribution Amount (BDT ৳) *</label>
                <input
                  type="number"
                  value={distributeAmount}
                  onChange={e => setDistributeAmount(Number(e.target.value))}
                  className="w-full font-mono font-bold text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Authorizing Officer / Manager</label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={e => setApprovedBy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDistributeModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDistribute}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5"
              >
                {distributeSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {distributeSuccess ? 'Journal Posted!' : 'Post & Disburse JV'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
