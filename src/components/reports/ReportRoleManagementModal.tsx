import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sliders,
  UserCheck,
  Building2,
  Info,
  Check,
  Sparkles,
  ChevronRight,
  Search,
  Users,
  Eye,
  AlertTriangle,
  X
} from 'lucide-react';
import { rbacService, ALL_REPORT_CATEGORIES } from '../../services/rbacService';
import { pmsService } from '../../services/pmsService';
import { ReportCategory, DepartmentReportAccessRule } from '../../types/reportingAndRbac';

interface ReportRoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

export const ReportRoleManagementModal: React.FC<ReportRoleManagementModalProps> = ({
  isOpen,
  onClose,
  onApplied
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'policy' | 'simulator'>('matrix');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDeptForEdit, setSelectedDeptForEdit] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Read current active state
  const config = rbacService.getReportRoleConfig();
  const departments = rbacService.getDepartments();
  const activeUser = rbacService.getActiveUser();
  const pmsUsers = pmsService.getState().users;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!isOpen) return null;

  const filteredDepts = departments.filter(d =>
    d.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    d.code.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleToggleCanViewAll = (deptName: string, currentVal: boolean) => {
    if (deptName === 'Finance & Accounts') {
      showToast('Finance & Accounts has permanent enterprise clearance to view all reports.');
      return;
    }
    rbacService.setDepartmentCanViewAll(deptName, !currentVal);
    showToast(
      !currentVal
        ? `Granted full report clearance to ${deptName}`
        : `Restricted ${deptName} to department-specific reports`
    );
    onApplied?.();
  };

  const handleToggleCategory = (deptName: string, cat: ReportCategory) => {
    if (deptName === 'Finance & Accounts') {
      showToast('Finance & Accounts has permanent clearance for all report categories.');
      return;
    }
    rbacService.toggleCategoryForDepartment(deptName, cat);
    showToast(`Updated category access for ${deptName}`);
    onApplied?.();
  };

  const handleResetPolicy = () => {
    if (window.confirm('Reset Report Role Management to strict policy? Each department will see only their individual reports, and only Accounts can view all department reports.')) {
      rbacService.resetToStrictDepartmentIsolation();
      showToast('Strict Department Isolation restored: Only Accounts can view all department reports.');
      onApplied?.();
    }
  };

  const handleSwitchSimulatorUser = (pmsUserId: string) => {
    pmsService.setCurrentUser(pmsUserId);
    const updatedUser = rbacService.getActiveUser();
    showToast(`Switched active profile to ${updatedUser.name} (${updatedUser.department} - ${updatedUser.roleName})`);
    onApplied?.();
  };

  return (
    <div id="report-role-management-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        id="report-role-management-modal-dialog"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-slate-950/90 border-b border-slate-800 p-4 sm:p-5 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 mt-0.5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                  Reports Role Management & Department Isolation
                </h2>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Strict Isolation Active
                </span>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Accounts: Full Access
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Enforces resort security policy: <strong className="text-slate-200">Each department can see only their individual reports</strong>.
                Only <strong className="text-amber-300">Finance & Accounts</strong> is authorized to view reports across all departments.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-xs font-semibold text-amber-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Key Security Policy Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-5 bg-slate-950/40 border-b border-slate-800">
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Core Mandate
              </span>
              <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                ENFORCED
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-200 mt-1.5">Strict Department Isolation</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Front Office, Housekeeping, Dining, Bar, Events & Stores see only their assigned departmental reports.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Accounts Authority
              </span>
              <span className="text-[10px] bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                ALL REPORTS
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-200 mt-1.5">Accounts Department Exemption</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Only Finance & Accounts possesses enterprise privilege to view all 18 department report streams.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <Users className="w-3 h-3" /> Active User Scope
              </span>
              <span className="text-[10px] bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                {activeUser.roleName}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-200 mt-1.5">{activeUser.name}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Department: <span className="text-slate-300 font-semibold">{activeUser.department}</span> ({rbacService.canUserViewAllDepartmentReports() ? 'Full Access' : 'Individual Reports Only'})
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 border-b border-slate-800 px-4 sm:px-5 bg-slate-950/60 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'matrix'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Department Access Matrix</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('policy')}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'policy'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Department Report Mappings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'simulator'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Test Role Simulator</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: Department Access Matrix */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search departments..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleResetPolicy}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                    title="Restore default strict isolation"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Strict Isolation</span>
                  </button>
                </div>
              </div>

              {/* Department Cards List */}
              <div className="space-y-2.5">
                {filteredDepts.map(dept => {
                  const rule = config.departments[dept.name] || {
                    department: dept.name,
                    canViewAllDepartments: false,
                    allowedCategories: [],
                    description: 'Standard departmental reports'
                  };

                  const isAccounts = dept.name === 'Finance & Accounts';
                  const isExecutive = dept.name === 'Executive Management' || dept.name === 'Internal Audit';
                  const canViewAll = rule.canViewAllDepartments || isAccounts || isExecutive;
                  const isExpanded = selectedDeptForEdit === dept.name;

                  return (
                    <div
                      key={dept.id}
                      className={`border rounded-xl transition-all ${
                        isAccounts
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : canViewAll
                          ? 'bg-slate-950/40 border-slate-700'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <div
                            className={`p-2 rounded-lg mt-0.5 ${
                              isAccounts
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="font-bold text-sm text-white">{dept.name}</span>
                              <span className="text-[11px] font-mono text-slate-400 px-1.5 py-0.5 bg-slate-800 rounded">
                                {dept.code}
                              </span>
                              {isAccounts ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1">
                                  <Shield className="w-3 h-3" /> Master Accounts Authority (All Reports)
                                </span>
                              ) : canViewAll ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                                  Executive Oversight
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-full flex items-center gap-1">
                                  <Lock className="w-3 h-3 text-emerald-400" /> Individual Reports Only
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{rule.description}</p>
                          </div>
                        </div>

                        {/* Controls on Right */}
                        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[11px] text-slate-400">View All:</span>
                            <button
                              type="button"
                              onClick={() => handleToggleCanViewAll(dept.name, rule.canViewAllDepartments)}
                              disabled={isAccounts || isExecutive}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center space-x-1 ${
                                isAccounts || canViewAll
                                  ? 'bg-amber-500 text-slate-950 font-bold'
                                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                              } ${isAccounts || isExecutive ? 'cursor-not-allowed opacity-90' : ''}`}
                              title={isAccounts ? 'Finance & Accounts always holds full access' : 'Toggle all reports permission'}
                            >
                              {canViewAll ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              <span>{canViewAll ? 'All Allowed' : 'Restricted'}</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedDeptForEdit(isExpanded ? null : dept.name)}
                            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-md border border-slate-700 transition-colors"
                          >
                            {isExpanded ? 'Hide Categories' : `Categories (${rule.allowedCategories.length})`}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Category Selector for Department */}
                      {isExpanded && (
                        <div className="p-3.5 bg-slate-950/80 border-t border-slate-800/80 space-y-2.5 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-300">
                              Configured Report Categories for {dept.name}:
                            </span>
                            {isAccounts && (
                              <span className="text-[11px] text-amber-400 italic">
                                * As required by security policy, Accounts has enterprise visibility over all 18 categories.
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {ALL_REPORT_CATEGORIES.map(cat => {
                              const isAllowed = isAccounts || canViewAll || rule.allowedCategories.includes(cat);
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  disabled={isAccounts}
                                  onClick={() => handleToggleCategory(dept.name, cat)}
                                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all flex items-center space-x-1.5 border ${
                                    isAllowed
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                      : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-400'
                                  } ${isAccounts ? 'cursor-default' : ''}`}
                                >
                                  {isAllowed ? (
                                    <Check className="w-3 h-3 text-amber-400" />
                                  ) : (
                                    <Lock className="w-3 h-3 text-slate-600" />
                                  )}
                                  <span>{cat}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Department Report Mappings Table */}
          {activeTab === 'policy' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Department Isolation Access Matrix</h3>
                    <p className="text-xs text-slate-400">
                      Standard resort operational protocol mapping departments to permitted report registries.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md text-xs font-semibold">
                    Policy Standard V2.4
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3.5 font-bold">Department</th>
                        <th className="py-2.5 px-3.5 font-bold">Permitted Categories</th>
                        <th className="py-2.5 px-3.5 font-bold">Other Department Access</th>
                        <th className="py-2.5 px-3.5 font-bold text-right">Access Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {departments.map(dept => {
                        const rule = config.departments[dept.name];
                        const isAccounts = dept.name === 'Finance & Accounts';
                        const isExec = dept.name === 'Executive Management' || dept.name === 'Internal Audit';

                        return (
                          <tr
                            key={dept.id}
                            className={`hover:bg-slate-900/50 transition-colors ${
                              isAccounts ? 'bg-amber-500/5 font-semibold' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-white">{dept.name}</span>
                                {isAccounts && (
                                  <span className="px-1.5 py-0.5 text-[9px] bg-amber-500 text-slate-950 font-bold rounded">
                                    ACCOUNTS
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500">{dept.headName} • {dept.code}</span>
                            </td>
                            <td className="py-2.5 px-3.5">
                              {isAccounts || isExec ? (
                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-semibold text-[11px]">
                                  All 18 Report Categories (Enterprise Wide)
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {rule?.allowedCategories.map(c => (
                                    <span key={c} className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded border border-slate-700 text-[11px]">
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5">
                              {isAccounts ? (
                                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Full Cross-Department Access
                                </span>
                              ) : isExec ? (
                                <span className="text-cyan-400 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Executive Oversight
                                </span>
                              ) : (
                                <span className="text-rose-400 font-medium flex items-center gap-1">
                                  <Lock className="w-3.5 h-3.5" /> Blocked (Restricted to own department)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 text-right">
                              {isAccounts ? (
                                <span className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-bold text-[11px]">
                                  Full Enterprise
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded font-medium text-[11px]">
                                  Department Only
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Role Simulator */}
          {activeTab === 'simulator' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  Live Role Simulator & Testing Tool
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Switch between staff profiles to test report visibility in real-time. Experience how each department
                  is restricted to their individual reports, while Accounts can access all 18 categories.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mt-4">
                  {pmsUsers.map(user => {
                    const isCurrent = user.id === activeUser.id;
                    const isAccounts = user.role === 'Accounts' || user.department === 'Finance & Accounts';

                    return (
                      <div
                        key={user.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-xs text-white block">{user.name}</span>
                            <span className="text-[11px] text-amber-400 font-medium block">{user.role}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              Dept: <strong className="text-slate-300">{user.department || 'Operations'}</strong>
                            </span>
                          </div>
                          {isAccounts ? (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                              Accounts
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                              Restricted
                            </span>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            {isAccounts ? '18 Categories' : 'Own Category Only'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSwitchSimulatorUser(user.id)}
                            disabled={isCurrent}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                              isCurrent
                                ? 'bg-amber-500 text-slate-950 font-bold cursor-default'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            }`}
                          >
                            {isCurrent ? 'Active Profile' : 'Test Profile'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Effective Permissions Preview for Active User */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Effective Report Access for Active User: {activeUser.name} ({activeUser.department})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-3">
                  {ALL_REPORT_CATEGORIES.map(cat => {
                    const isAllowed = rbacService.isReportAllowed(`Reports.${cat.replace(/\s+/g, '')}.View`, cat);
                    return (
                      <div
                        key={cat}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          isAllowed
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900/40 border-slate-800/80 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-center mb-1">
                          {isAllowed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <span className="text-[11px] font-semibold block truncate" title={cat}>
                          {cat}
                        </span>
                        <span className="text-[9px] block uppercase font-bold mt-0.5">
                          {isAllowed ? 'Allowed' : 'Locked'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-3 sm:p-4 flex items-center justify-between">
          <div className="text-xs text-slate-400 hidden sm:block">
            Security Policy v2.4 • Changes persist across all resort modules & reports.
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow"
            >
              Done & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
