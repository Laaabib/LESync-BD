import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertOctagon, AlertTriangle, Bug, Search, Filter, RefreshCw,
  CheckCircle2, Clock, User, Phone, Mail, Laptop, Shield,
  ArrowRight, X, Copy, Check, ExternalLink, Download, Printer,
  Eye, Trash2, ShieldAlert, Sparkles, ChevronRight, Play,
  Zap, Layers, ArrowUpRight, FileCode, History, Activity,
  Users, CheckSquare, MessageSquare, Terminal, Monitor,
  Send, Wrench, RotateCcw
} from 'lucide-react';
import {
  userErrorTrackerService,
  UserErrorInfo,
  ErrorSeverity,
  ErrorCategory,
  IncidentStatus
} from '../../services/userErrorTrackerService';
import { rbacService } from '../../services/rbacService';
import { pdfExportService } from '../../services/pdfExportService';
import { UserContext } from '../../types/reportingAndRbac';

interface AdminErrorFinderTabProps {
  initialUserId?: string;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToUser?: (userId: string) => void;
  onNavigateToRoute?: (route: string) => void;
}

export const AdminErrorFinderTab: React.FC<AdminErrorFinderTabProps> = ({
  initialUserId,
  onShowToast,
  onNavigateToUser,
  onNavigateToRoute
}) => {
  const [errors, setErrors] = useState<UserErrorInfo[]>(() => userErrorTrackerService.getErrors());
  const [users, setUsers] = useState<UserContext[]>(() => rbacService.getUsers());

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>(initialUserId || 'all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRoute, setSelectedRoute] = useState<string>('all');

  // Inspection Modal
  const [inspectedError, setInspectedError] = useState<UserErrorInfo | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Status edit in modal
  const [resolutionStatus, setResolutionStatus] = useState<IncidentStatus>('Investigating');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [assignedAdmin, setAssignedAdmin] = useState('Engr. Subrata Roy');

  // Simulation dropdown
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  useEffect(() => {
    return userErrorTrackerService.subscribe(() => {
      setErrors(userErrorTrackerService.getErrors());
    });
  }, []);

  useEffect(() => {
    if (initialUserId) {
      setSelectedUser(initialUserId);
    }
  }, [initialUserId]);

  const copyToClipboard = (text: string, label: string = 'text') => {
    navigator.clipboard?.writeText(text);
    setCopiedText(text);
    if (onShowToast) {
      onShowToast(`Copied ${label} to clipboard`, 'success');
    }
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Open modal with current error values
  const handleOpenInspect = (err: UserErrorInfo) => {
    setInspectedError(err);
    setResolutionStatus(err.status);
    setResolutionNotes(err.resolutionNotes || '');
    setAssignedAdmin(err.assignedTo || 'Engr. Subrata Roy');
  };

  // Save status & notes
  const handleSaveResolution = () => {
    if (!inspectedError) return;

    userErrorTrackerService.updateErrorStatus(
      inspectedError.id,
      resolutionStatus,
      resolutionNotes,
      rbacService.getActiveUser()?.name || 'Administrator'
    );

    if (assignedAdmin) {
      userErrorTrackerService.assignError(inspectedError.id, assignedAdmin);
    }

    if (onShowToast) {
      onShowToast(`Updated incident #${inspectedError.id} status to [${resolutionStatus}]`, 'success');
    }

    // Refresh modal item
    const updated = userErrorTrackerService.getErrorById(inspectedError.id);
    if (updated) setInspectedError(updated);
  };

  // Trigger simulated error
  const handleTriggerSimulation = (type: 'payment' | 'printer' | 'sync' | 'crash') => {
    const newErr = userErrorTrackerService.simulateTestError(type);
    setIsSimulateOpen(false);
    if (onShowToast) {
      onShowToast(`Simulated error [${newErr.errorName}] logged for user ${newErr.userName}!`, 'info');
    }
    setInspectedError(newErr);
  };

  // Export PDF Report
  const handleExportPDF = () => {
    pdfExportService.exportToPDF({
      title: 'USER CLIENT-SIDE ERROR & DIAGNOSTICS INCIDENT REGISTER',
      subtitle: 'LESYNC LUXURY RESORT & CONVENTION • IT & APPLICATION STABILITY AUDIT',
      date: new Date().toLocaleDateString('en-GB'),
      columns: [
        { key: 'code', header: 'Incident #' },
        { key: 'timestamp', header: 'Timestamp' },
        { key: 'user', header: 'Impacted User' },
        { key: 'role', header: 'User Role' },
        { key: 'severity', header: 'Severity' },
        { key: 'route', header: 'Route / Screen' },
        { key: 'error', header: 'Error Description' },
        { key: 'status', header: 'Status' }
      ],
      rows: filteredErrors.map(e => ({
        code: e.id,
        timestamp: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        user: `${e.userName} (${e.userId})`,
        role: `${e.userRole} [${e.department}]`,
        severity: e.severity,
        route: `${e.route} (${e.component || 'UI'})`,
        error: e.errorMessage,
        status: e.status
      })),
      summaryTotals: {
        code: `Total: ${filteredErrors.length} Incidents`,
        severity: `Unresolved: ${filteredErrors.filter(e => e.status !== 'Resolved').length}`,
        status: 'Audit Integrity: Active Telemetry'
      }
    }, 'user-error-incident-report');
  };

  // Distinct routes for filter
  const distinctRoutes = useMemo(() => {
    return Array.from(new Set(errors.map(e => e.route).filter(Boolean)));
  }, [errors]);

  // Distinct users who faced errors
  const distinctErrorUsers = useMemo(() => {
    const map = new Map<string, { userId: string; userName: string; userRole: string; count: number }>();
    errors.forEach(e => {
      const existing = map.get(e.userId);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(e.userId, {
          userId: e.userId,
          userName: e.userName,
          userRole: e.userRole,
          count: 1
        });
      }
    });
    return Array.from(map.values());
  }, [errors]);

  // Filtered Errors
  const filteredErrors = useMemo(() => {
    return errors.filter(e => {
      // User filter
      if (selectedUser !== 'all' && e.userId !== selectedUser) return false;

      // Severity filter
      if (selectedSeverity !== 'all' && e.severity !== selectedSeverity) return false;

      // Category filter
      if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;

      // Status filter
      if (selectedStatus !== 'all' && e.status !== selectedStatus) return false;

      // Route filter
      if (selectedRoute !== 'all' && e.route !== selectedRoute) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCode = e.id.toLowerCase().includes(q);
        const matchUser = e.userName.toLowerCase().includes(q);
        const matchUserId = e.userId.toLowerCase().includes(q);
        const matchEmail = e.userEmail.toLowerCase().includes(q);
        const matchRole = e.userRole.toLowerCase().includes(q);
        const matchMsg = e.errorMessage.toLowerCase().includes(q);
        const matchComp = (e.component || '').toLowerCase().includes(q);
        const matchRoute = e.route.toLowerCase().includes(q);
        const matchIp = e.ipAddress.includes(q);
        if (!matchCode && !matchUser && !matchUserId && !matchEmail && !matchRole && !matchMsg && !matchComp && !matchRoute && !matchIp) {
          return false;
        }
      }

      return true;
    });
  }, [errors, selectedUser, selectedSeverity, selectedCategory, selectedStatus, selectedRoute, searchTerm]);

  // KPIs
  const totalCount = errors.length;
  const unresolvedCount = errors.filter(e => e.status === 'Unresolved').length;
  const criticalCount = errors.filter(e => e.severity === 'CRITICAL').length;
  const highCount = errors.filter(e => e.severity === 'HIGH').length;
  const resolvedCount = errors.filter(e => e.status === 'Resolved').length;
  const affectedUsersCount = distinctErrorUsers.length;

  return (
    <div className="space-y-4 text-xs text-slate-800">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & COMMAND BAR                                              */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 rounded-2xl shadow-lg border border-slate-700 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border-2 border-rose-500/40 shadow-inner shrink-0">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                User Error Finder & Incident Diagnostics
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-black border border-rose-500/30 flex items-center gap-1">
                <Activity className="w-3 h-3 text-rose-400 animate-spin" />
                <span>Active Telemetry</span>
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-0.5 max-w-2xl">
              Inspect exactly which user faced errors on their screen, the full stack trace, previous user clicks (breadcrumbs), device & browser info, and manage incident resolution.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Simulate Test Error Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSimulateOpen(!isSimulateOpen)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-md"
              title="Trigger a test diagnostic error to verify telemetry capture"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Simulate User Error</span>
            </button>

            {isSimulateOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Error Scenario:
                </div>
                <button
                  onClick={() => handleTriggerSimulation('payment')}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold flex items-center space-x-2 cursor-pointer transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span>Payment Gateway Timeout</span>
                </button>
                <button
                  onClick={() => handleTriggerSimulation('printer')}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold flex items-center space-x-2 cursor-pointer transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Thermal Receipt Printer Offline</span>
                </button>
                <button
                  onClick={() => handleTriggerSimulation('sync')}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold flex items-center space-x-2 cursor-pointer transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span>Cloud SQL Re-Sync Stalled</span>
                </button>
                <button
                  onClick={() => handleTriggerSimulation('crash')}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold flex items-center space-x-2 cursor-pointer transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  <span>Uncaught UI Callstack Error</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors border border-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="Export Incidents Report (PDF)"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => {
              userErrorTrackerService.clearResolvedErrors();
              if (onShowToast) onShowToast('Cleaned up resolved error incidents from active registry.', 'info');
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
            title="Remove resolved incidents from list"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Purge Resolved</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KPI METRIC CARDS                                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Captured */}
        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">Total Errors Logged</span>
            <Bug className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">{totalCount}</div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Telemetry across all devices</span>
        </div>

        {/* Unresolved Issues */}
        <div className="bg-rose-50/70 border border-rose-200 p-3.5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[11px] font-bold">Unresolved Incidents</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-700 font-mono">{unresolvedCount}</div>
          <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">Requires Investigation</span>
        </div>

        {/* Critical Crashes */}
        <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[11px] font-bold">Critical / High Severity</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-900 font-mono">{criticalCount + highCount}</div>
          <span className="text-[10px] text-amber-700 block mt-0.5">{criticalCount} Critical • {highCount} High</span>
        </div>

        {/* Impacted Staff Users */}
        <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-[11px] font-bold">Affected Staff Users</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-900 font-mono">{affectedUsersCount}</div>
          <span className="text-[10px] text-blue-600 block mt-0.5">Distinct user profiles</span>
        </div>

        {/* Resolved Count */}
        <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold">Resolved & Fixed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-800 font-mono">{resolvedCount}</div>
          <span className="text-[10px] text-emerald-600 block mt-0.5">
            {totalCount > 0 ? `${Math.round((resolvedCount / totalCount) * 100)}% Fixed` : '100%'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SEARCH & USER FILTER BAR                                              */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs space-y-3">
        {/* Top row: Search + Quick User Picker */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search error message, code #, user name, IP, component, route..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* User Selector Dropdown (THE CORE USER FILTER) */}
          <div className="flex items-center space-x-2 shrink-0">
            <label className="text-[11px] font-bold text-slate-600 flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Target User:</span>
            </label>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer max-w-xs"
            >
              <option value="all">All Users ({totalCount} errors)</option>
              {distinctErrorUsers.map(u => (
                <option key={u.userId} value={u.userId}>
                  {u.userName} ({u.userRole}) — {u.count} error{u.count > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bottom row: Multi-Pill Dropdowns */}
        <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-slate-100 text-xs">
          {/* Severity */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10.5px] font-semibold text-slate-500">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Category */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10.5px] font-semibold text-slate-500">Category:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Payment / Billing">Payment / Billing</option>
              <option value="Hardware & Devices">Hardware & Devices</option>
              <option value="Database & Sync">Database & Sync</option>
              <option value="UI / Crash">UI / Crash</option>
              <option value="Validation & Form">Validation & Form</option>
              <option value="Network / API Failure">Network / API Failure</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10.5px] font-semibold text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Unresolved">Unresolved</option>
              <option value="Investigating">Investigating</option>
              <option value="Resolved">Resolved</option>
              <option value="Ignored">Ignored</option>
            </select>
          </div>

          {/* Route Screen */}
          {distinctRoutes.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <span className="text-[10.5px] font-semibold text-slate-500">Screen:</span>
              <select
                value={selectedRoute}
                onChange={e => setSelectedRoute(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer max-w-[160px] truncate"
              >
                <option value="all">All Screens</option>
                {distinctRoutes.map(r => (
                  <option key={r} value={r}>/{r}</option>
                ))}
              </select>
            </div>
          )}

          {/* Reset button */}
          {(searchTerm || selectedUser !== 'all' || selectedSeverity !== 'all' || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedRoute !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedUser('all');
                setSelectedSeverity('all');
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSelectedRoute('all');
              }}
              className="ml-auto px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10.5px] transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ERROR INCIDENTS LIST                                                  */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {filteredErrors.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2.5" />
            <h3 className="text-sm font-bold text-slate-800">No User Errors Found</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
              There are no captured error incidents matching the active filter criteria. Telemetry is active and monitoring all user sessions.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedUser('all');
                setSelectedSeverity('all');
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSelectedRoute('all');
              }}
              className="mt-3 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredErrors.map(err => {
            const isResolved = err.status === 'Resolved';
            const isCritical = err.severity === 'CRITICAL';
            const isHigh = err.severity === 'HIGH';

            return (
              <div
                key={err.id}
                className={`bg-white border rounded-2xl p-4 shadow-xs hover:shadow-md transition-all space-y-3 relative group ${
                  isResolved
                    ? 'border-slate-200 opacity-80'
                    : isCritical
                    ? 'border-rose-300 bg-rose-50/20'
                    : isHigh
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Header: User Attribution & Incident Code */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  {/* Left: User profile chip */}
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center border shadow-xs ${
                      isCritical
                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                        : isHigh
                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                        : 'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>
                      {err.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {err.userName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                          {err.userId}
                        </span>
                        {err.occurrencesCount > 1 && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full border border-amber-300">
                            {err.occurrencesCount}x times
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                        <span className="font-semibold text-slate-700">{err.userRole}</span>
                        <span>•</span>
                        <span>{err.department}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">IP: {err.ipAddress}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Badges & Timestamp */}
                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    {/* Severity Badge */}
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                      err.severity === 'CRITICAL'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : err.severity === 'HIGH'
                        ? 'bg-amber-500 text-slate-950 border-amber-600'
                        : err.severity === 'MEDIUM'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {err.severity}
                    </span>

                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                      err.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : err.status === 'Investigating'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {err.status}
                    </span>

                    {/* Time */}
                    <span className="text-[10px] font-mono text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(err.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>
                </div>

                {/* Middle: Error Description & Screen Route */}
                <div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span
                      onClick={() => copyToClipboard(err.id, 'Incident Code')}
                      className="font-mono font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 cursor-pointer flex items-center space-x-1 transition-colors"
                      title="Click to copy Incident Code"
                    >
                      <span>{err.id}</span>
                      {copiedText === err.id ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 text-blue-500" />}
                    </span>

                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10.5px]">
                      {err.category}
                    </span>

                    <span className="font-mono text-slate-500 text-[10.5px] truncate">
                      Route: <strong className="text-slate-800">/{err.route}</strong> ({err.component || 'UI'})
                    </span>
                  </div>

                  {/* The Actual Error Message */}
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-900 text-rose-300 font-mono text-xs leading-relaxed border border-slate-800 shadow-inner break-words">
                    <strong className="text-white">{err.errorName}: </strong>
                    <span>{err.errorMessage}</span>
                  </div>
                </div>

                {/* Footer: Device Specs & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                  <div className="flex items-center space-x-2 truncate">
                    <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{err.deviceInfo.browser} • {err.deviceInfo.os}</span>
                    <span>•</span>
                    <span className="text-slate-400 font-mono">{err.deviceInfo.screenSize}</span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {/* Quick filter by this user */}
                    <button
                      onClick={() => setSelectedUser(err.userId)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10.5px] transition-colors cursor-pointer"
                      title="Isolate all errors faced by this user"
                    >
                      Filter this User
                    </button>

                    {/* Quick Resolve / Re-open */}
                    {err.status !== 'Resolved' ? (
                      <button
                        onClick={() => {
                          userErrorTrackerService.updateErrorStatus(
                            err.id,
                            'Resolved',
                            'Marked resolved via quick action by Administrator'
                          );
                          if (onShowToast) onShowToast(`Marked #${err.id} as Resolved`, 'success');
                        }}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[10.5px] border border-emerald-200 transition-colors cursor-pointer"
                      >
                        Quick Resolve
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          userErrorTrackerService.updateErrorStatus(err.id, 'Unresolved');
                          if (onShowToast) onShowToast(`Re-opened #${err.id}`, 'info');
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-[10.5px] transition-colors cursor-pointer"
                      >
                        Re-open
                      </button>
                    )}

                    {/* Inspect Diagnostics Modal Button */}
                    <button
                      onClick={() => handleOpenInspect(err)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10.5px] flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Inspect Diagnostics</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. FULL INCIDENT DIAGNOSTICS MODAL                                       */}
      {/* ========================================================================= */}
      {inspectedError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in zoom-in-95 text-slate-800">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border shadow-xs ${
                  inspectedError.severity === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : 'bg-amber-100 text-amber-700 border-amber-300'
                }`}>
                  <Bug className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-black text-slate-900">
                      Incident Diagnostics: {inspectedError.id}
                    </h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      inspectedError.severity === 'CRITICAL'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-500 text-slate-950'
                    }`}>
                      {inspectedError.severity}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Logged at {new Date(inspectedError.timestamp).toLocaleString()} • {inspectedError.category}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectedError(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card: WHO faced this error? */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Impacted User & Session Profile</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  User ID: {inspectedError.userId}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">User Full Name</span>
                  <span className="font-bold text-slate-900">{inspectedError.userName}</span>
                  <span className="text-[10.5px] text-slate-500 block truncate">{inspectedError.userEmail}</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">Role & Department</span>
                  <span className="font-bold text-slate-900">{inspectedError.userRole}</span>
                  <span className="text-[10.5px] text-slate-500 block">{inspectedError.department}</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">IP & Network State</span>
                  <span className="font-bold font-mono text-slate-900">{inspectedError.ipAddress}</span>
                  <span className="text-[10.5px] text-emerald-600 font-semibold block">{inspectedError.deviceInfo.networkStatus}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 flex items-center space-x-2 pt-1">
                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  <strong>Client Device:</strong> {inspectedError.deviceInfo.browser} on {inspectedError.deviceInfo.os} (Resolution: {inspectedError.deviceInfo.screenSize})
                </span>
              </div>
            </div>

            {/* Error Message & Component Route */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <FileCode className="w-4 h-4 text-rose-600" />
                  <span>Error Details & Screen Context</span>
                </span>
                {onNavigateToRoute && (
                  <button
                    onClick={() => {
                      onNavigateToRoute(inspectedError.route);
                      setInspectedError(null);
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Jump to /{inspectedError.route}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-rose-300 font-mono text-xs leading-relaxed">
                <div className="text-white font-bold text-sm mb-1">{inspectedError.errorName}</div>
                <div>{inspectedError.errorMessage}</div>
              </div>
            </div>

            {/* Stack Trace */}
            {inspectedError.stackTrace && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-700 flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                    <span>Stack Trace:</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(inspectedError.stackTrace || '', 'Stack Trace')}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Trace</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-300 p-3 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800 leading-normal">
                  {inspectedError.stackTrace}
                </pre>
              </div>
            )}

            {/* User Action Trail (Breadcrumbs) */}
            {inspectedError.breadcrumbs && inspectedError.breadcrumbs.length > 0 && (
              <div className="space-y-2">
                <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <History className="w-4 h-4 text-purple-600" />
                  <span>Prior User Action Trail (Leading to Error)</span>
                </span>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 divide-y divide-slate-100 max-h-44 overflow-y-auto">
                  {inspectedError.breadcrumbs.map((b, idx) => (
                    <div key={idx} className="py-1.5 flex items-start space-x-2 text-[11px]">
                      <span className="font-mono text-slate-400 shrink-0">{b.timestamp}</span>
                      <span className="text-slate-700 font-medium flex-1">
                        {b.action}
                        {b.details && <span className="text-slate-400 ml-1">({b.details})</span>}
                      </span>
                      {b.category && (
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                          {b.category}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* State Snapshot if available */}
            {inspectedError.stateSnapshot && (
              <div className="space-y-1.5">
                <span className="font-bold text-xs text-slate-700">UI State Snapshot:</span>
                <pre className="bg-slate-100 text-slate-700 p-2.5 rounded-xl font-mono text-[10.5px] border border-slate-200 overflow-x-auto">
                  {JSON.stringify(inspectedError.stateSnapshot, null, 2)}
                </pre>
              </div>
            )}

            {/* Status & Resolution Form */}
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-3">
              <span className="font-extrabold text-xs text-blue-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>Incident Resolution & Notes</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Status:</label>
                  <select
                    value={resolutionStatus}
                    onChange={e => setResolutionStatus(e.target.value as IncidentStatus)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Unresolved">Unresolved (Open)</option>
                    <option value="Investigating">Investigating (In Progress)</option>
                    <option value="Resolved">Resolved (Fixed)</option>
                    <option value="Ignored">Ignored / Handled</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Assigned Engineer / Admin:</label>
                  <input
                    type="text"
                    value={assignedAdmin}
                    onChange={e => setAssignedAdmin(e.target.value)}
                    placeholder="e.g. Engr. Subrata Roy"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-700">Investigation & Fix Notes:</label>
                <textarea
                  rows={2}
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder="Describe root cause, code fix deployed, or advice communicated to user..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    userErrorTrackerService.deleteError(inspectedError.id);
                    setInspectedError(null);
                    if (onShowToast) onShowToast(`Deleted incident ${inspectedError.id}`, 'info');
                  }}
                  className="px-3 py-1.5 text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Incident</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveResolution}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Resolution</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
