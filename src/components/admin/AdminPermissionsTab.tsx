import React, { useState, useMemo } from 'react';
import {
  Sliders, Search, Filter, Shield, ShieldAlert, ShieldCheck,
  CheckCircle2, AlertTriangle, Lock, Unlock, Eye, Edit, Layers,
  ChevronRight, ArrowRight, Check, X, Info
} from 'lucide-react';
import { MASTER_PERMISSIONS, rbacService } from '../../services/rbacService';
import { RoleDefinition, PermissionDefinition } from '../../types/reportingAndRbac';

interface AdminPermissionsTabProps {
  roles: RoleDefinition[];
  onNavigateToRoles?: (roleId?: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminPermissionsTab: React.FC<AdminPermissionsTabProps> = ({
  roles,
  onNavigateToRoles,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [activePolicyModal, setActivePolicyModal] = useState<boolean>(false);

  // Policy rules state
  const [policies, setPolicies] = useState({
    strictStopPost: true,
    dualSignoffThreshold: 10000,
    resettleGraceHours: 24,
    managerOverrideRateDiscount: true,
    cashierDrawerNightLock: true,
    preventNegativeInventorySales: true
  });

  // Extract all categories
  const categories = useMemo(() => {
    const set = new Set(MASTER_PERMISSIONS.map(p => p.category));
    return ['all', ...Array.from(set)];
  }, []);

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    return MASTER_PERMISSIONS.filter(p => {
      const matchSearch =
        p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchRisk = selectedRisk === 'all' || p.riskLevel === selectedRisk;
      return matchSearch && matchCategory && matchRisk;
    });
  }, [searchTerm, selectedCategory, selectedRisk]);

  // Check which roles have this permission
  const getRolesWithPermission = (permKey: string): RoleDefinition[] => {
    return roles.filter(r => r.permissions.includes('*') || r.permissions.includes(permKey));
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('cculb_system_policies_v1', JSON.stringify(policies));
    if (onShowToast) {
      onShowToast('Hospitality security policies and threshold rules updated successfully.', 'success');
    }
    setActivePolicyModal(false);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-xl p-4 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 rounded-lg">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-tight">Enterprise Master Permissions & Policy Rules</h2>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] border border-blue-500/30">
                {MASTER_PERMISSIONS.length} Master Rules
              </span>
            </div>
            <p className="text-slate-300 text-[11px] mt-0.5">
              Granular access control policies across Front Office, POS Outlets, Housekeeping, Banquets, Inventory, Accounting, and Supervisory Authorities.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setActivePolicyModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition shadow-xs text-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Policy Guard Rules</span>
          </button>
          {onNavigateToRoles && (
            <button
              type="button"
              onClick={() => onNavigateToRoles()}
              className="flex items-center space-x-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition shadow-xs text-xs"
            >
              <Shield className="w-4 h-4" />
              <span>Manage Role Profiles</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search permission by key, action name, or authority description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <div className="flex items-center space-x-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[11px]">
              <span className="px-2 py-1 font-bold text-gray-500">Risk:</span>
              {['all', 'Critical', 'High', 'Standard'].map(risk => (
                <button
                  key={risk}
                  onClick={() => setSelectedRisk(risk)}
                  className={`px-2 py-1 rounded font-bold transition ${
                    selectedRisk === risk
                      ? risk === 'Critical'
                        ? 'bg-rose-600 text-white'
                        : risk === 'High'
                        ? 'bg-amber-600 text-white'
                        : 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {risk === 'all' ? 'All Risks' : risk}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-bold text-gray-400 shrink-0">Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-full font-bold text-[10px] whitespace-nowrap transition border ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {cat === 'all' ? `All Categories (${MASTER_PERMISSIONS.length})` : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 w-1/4">Permission Name & Key</th>
                <th className="p-3 w-1/6">Category</th>
                <th className="p-3 w-1/12 text-center">Risk Level</th>
                <th className="p-3 w-1/4">Operational Authority Scope</th>
                <th className="p-3 w-1/4">Assigned Role Profiles ({roles.length})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPermissions.map(perm => {
                const assignedRoles = getRolesWithPermission(perm.key);
                return (
                  <tr key={perm.key} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-3 align-top">
                      <div className="font-bold text-gray-900 flex items-center space-x-1.5">
                        <span>{perm.label}</span>
                      </div>
                      <div className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-0.5 border border-blue-200">
                        {perm.key}
                      </div>
                    </td>

                    <td className="p-3 align-top">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-bold text-[10px] border border-gray-200">
                        {perm.category}
                      </span>
                    </td>

                    <td className="p-3 align-top text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] border inline-flex items-center space-x-1 ${
                        perm.riskLevel === 'Critical'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : perm.riskLevel === 'High'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {perm.riskLevel === 'Critical' ? (
                          <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                        ) : perm.riskLevel === 'High' ? (
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        )}
                        <span>{perm.riskLevel}</span>
                      </span>
                    </td>

                    <td className="p-3 align-top text-gray-600 text-[11px] leading-relaxed">
                      {perm.description}
                    </td>

                    <td className="p-3 align-top">
                      <div className="flex flex-wrap gap-1">
                        {assignedRoles.map(r => (
                          <span
                            key={r.id}
                            onClick={() => onNavigateToRoles?.(r.id)}
                            title={`Click to inspect or modify role: ${r.name}`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-pointer transition ${
                              r.id === 'role-super-admin'
                                ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                : r.permissions.includes('*')
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {r.name}
                          </span>
                        ))}
                        {assignedRoles.length === 0 && (
                          <span className="text-gray-400 italic text-[10px]">Unassigned to non-superadmin roles</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPermissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    <Sliders className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-bold text-gray-600">No permissions found matching your criteria</p>
                    <p className="text-xs text-gray-400">Try clearing the search box or selecting 'All Categories'</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Policy Rules Guard Modal */}
      {activePolicyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-sm uppercase">Hospitality Security Policy Guards</h3>
              </div>
              <button
                onClick={() => setActivePolicyModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-xs">Strict Stop-Post Restriction Enforcement</span>
                    <input
                      type="checkbox"
                      checked={policies.strictStopPost}
                      onChange={e => setPolicies({ ...policies, strictStopPost: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Automatically blocks room postings from restaurant POS, room service, and bars when a guest folio has an active Stop-Post flag.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-xs">Dual Sign-off Threshold for Invoice Voids</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-mono text-xs font-bold text-gray-500">৳</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={policies.dualSignoffThreshold}
                        onChange={e => setPolicies({ ...policies, dualSignoffThreshold: Number(e.target.value) })}
                        className="w-24 px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Invoices voided above this amount require mandatory dual sign-off from both Duty Manager and Finance Lead.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-xs">Bill Resettlement Grace Window</span>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min="1"
                        max="72"
                        value={policies.resettleGraceHours}
                        onChange={e => setPolicies({ ...policies, resettleGraceHours: Number(e.target.value) })}
                        className="w-16 px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-xs text-gray-500 font-bold">Hours</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Maximum elapsed time after guest checkout settlement during which a supervisor can reopen the folio for tender re-allocation.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-xs">Manager Override Required for Room Tariff Discounts</span>
                    <input
                      type="checkbox"
                      checked={policies.managerOverrideRateDiscount}
                      onChange={e => setPolicies({ ...policies, managerOverrideRateDiscount: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Front desk agents cannot alter booked daily room rates without entering supervisor credentials.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-xs">Cashier Drawer Auto-Lock During Night Audit</span>
                    <input
                      type="checkbox"
                      checked={policies.cashierDrawerNightLock}
                      onChange={e => setPolicies({ ...policies, cashierDrawerNightLock: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Enforces read-only cashier status between 04:45 AM and 05:15 AM while automated room revenue roll-up executes.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActivePolicyModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold text-xs hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs transition"
                >
                  Save Policy Guards
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
