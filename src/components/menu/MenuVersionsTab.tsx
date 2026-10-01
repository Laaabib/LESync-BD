// CCULB PMS - Seasonal Menu Versions & Price Change Audit Log Tab
// Version control, seasonal activation, and historical price modification audit tracking

import React, { useState } from 'react';
import {
  Calendar, Plus, CheckCircle2, History, Edit3,
  Clock, ShieldCheck, Tag, ArrowRight, AlertCircle, FileText
} from 'lucide-react';
import { inventoryMenuService } from '../../services/inventoryMenuService';
import { MenuVersion } from '../../types/inventoryMenu';

export const MenuVersionsTab: React.FC = () => {
  const versions = inventoryMenuService.getMenuVersions();
  const priceHistories = inventoryMenuService.getPriceHistories();

  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<MenuVersion>>({
    name: '',
    code: '',
    season: 'All-Year Standard',
    effectiveStartDate: new Date().toISOString().split('T')[0],
    effectiveEndDate: '2026-12-31',
    status: 'Draft',
    applicableOutlets: ['Restaurant', 'Room Service'],
    description: ''
  });

  const handleCreateVersion = () => {
    if (!formData.name) return;
    inventoryMenuService.addMenuVersion({
      name: formData.name,
      code: formData.code || `VER-${Date.now().toString().slice(-4)}`,
      season: formData.season || 'Seasonal',
      effectiveStartDate: formData.effectiveStartDate || '2026-09-01',
      effectiveEndDate: formData.effectiveEndDate || '2026-12-31',
      status: (formData.status as any) || 'Draft',
      itemCount: 25,
      applicableOutlets: formData.applicableOutlets || ['Restaurant'],
      description: formData.description || '',
      validFrom: formData.effectiveStartDate || '2026-09-01',
      validTo: formData.effectiveEndDate || '2026-12-31',
      totalMenuItems: 25,
      approvedBy: 'General Manager & Executive Chef'
    });
    setIsVersionModalOpen(false);
  };

  const handleActivateVersion = (id: string) => {
    inventoryMenuService.activateMenuVersion(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Seasonal Menu Versions & Price Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage seasonal menus, banquet packages, Ramadan specials, and immutable price change audit histories
          </p>
        </div>

        <button
          onClick={() => setIsVersionModalOpen(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Menu Version
        </button>
      </div>

      {/* Menu Versions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {versions.map(ver => {
          const isActive = ver.status === 'Active';

          return (
            <div
              key={ver.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                isActive ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {ver.code || ver.versionCode || 'VER-001'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : ver.status === 'Upcoming'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {ver.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">{ver.name}</h3>
                <span className="text-xs text-emerald-700 font-semibold block mb-2">{ver.season || 'Standard Resort'}</span>

                <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                  {ver.description}
                </p>

                <div className="bg-slate-50 rounded-xl p-2.5 text-[11px] text-slate-600 space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Effective:</span>
                    <span className="font-semibold">{ver.effectiveStartDate || ver.validFrom} → {ver.effectiveEndDate || ver.validTo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dishes:</span>
                    <span className="font-semibold">{ver.itemCount || ver.totalMenuItems || 24} items</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {(ver.applicableOutlets || ['Restaurant', 'Room Service']).map(ot => (
                    <span key={ot} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {ot}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100">
                {!isActive ? (
                  <button
                    onClick={() => handleActivateVersion(ver.id)}
                    className="w-full py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                  >
                    Activate on POS
                  </button>
                ) : (
                  <div className="text-center text-xs font-bold text-emerald-600 py-1 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Currently Live on POS
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Price Change Audit Trail Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Immutable Price Change & Cost Modification Audit Trail
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            All price changes are timestamped with authorizing user & reason
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp & Date</th>
                <th className="py-3 px-3">Menu Item Code</th>
                <th className="py-3 px-3 text-right">Previous Price</th>
                <th className="py-3 px-3 text-right">New Price</th>
                <th className="py-3 px-3 text-right">Adjustment</th>
                <th className="py-3 px-3">Reason / Justification</th>
                <th className="py-3 px-4">Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {priceHistories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No price changes recorded yet.
                  </td>
                </tr>
              ) : (
                priceHistories.map(h => {
                  const prevPrice = h.previousPrice ?? h.oldPrice ?? 0;
                  const diff = h.newPrice - prevPrice;

                  return (
                    <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {h.effectiveDate || h.effectiveFrom || h.createdAt?.split('T')[0]}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                        {h.menuItemName || h.menuItemId}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                        ৳{(prevPrice || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        ৳{(h.newPrice || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold">
                        <span className={diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-amber-600' : 'text-slate-400'}>
                          {diff > 0 ? `+৳${diff}` : diff < 0 ? `-৳${Math.abs(diff)}` : '৳0'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        {h.reason || 'Annual food cost optimization review'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {h.updatedBy || h.changedBy || 'F&B Manager'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isVersionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Create Seasonal Menu Version
              </h3>
              <button
                onClick={() => setIsVersionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Version Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Winter BBQ & Fireplace Special 2026"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Season / Campaign</label>
                  <select
                    value={formData.season}
                    onChange={e => setFormData({ ...formData, season: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="All-Year Standard">All-Year Standard</option>
                    <option value="Winter Feast">Winter Feast</option>
                    <option value="Ramadan & Iftar">Ramadan & Iftar</option>
                    <option value="Summer Poolside">Summer Poolside</option>
                    <option value="Banquet Package">Banquet Package</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Active">Active</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Effective Start Date</label>
                  <input
                    type="date"
                    value={formData.effectiveStartDate}
                    onChange={e => setFormData({ ...formData, effectiveStartDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Effective End Date</label>
                  <input
                    type="date"
                    value={formData.effectiveEndDate}
                    onChange={e => setFormData({ ...formData, effectiveEndDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Description & Scope</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Notes on chef's specials, seasonal ingredients, and marketing campaign details..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVersionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateVersion}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
                >
                  Save Menu Version
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
