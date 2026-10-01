import React, { useState, useEffect, useMemo } from 'react';
import {
  History, Search, Filter, Download, Printer, Clock, User, CheckCircle2,
  AlertCircle, Calendar, ArrowUpDown, Layers, Eye, RefreshCw, FileText,
  Laptop, Key, Lock, PlusCircle, X, Shield, ShieldCheck, ChevronRight,
  ExternalLink, Copy, Check, Users, Sparkles, Building2
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { pdfExportService } from '../../services/pdfExportService';
import { rbacService } from '../../services/rbacService';
import { PmsDatabaseState } from '../../services/mockPmsDatabase';
import { AuditLog } from '../../types/pms';
import { UserContext } from '../../types/reportingAndRbac';

interface AdminActivityLogsTabProps {
  initialUserId?: string;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToUser?: (userId: string) => void;
}

export const AdminActivityLogsTab: React.FC<AdminActivityLogsTabProps> = ({
  initialUserId,
  onShowToast,
  onNavigateToUser
}) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [users, setUsers] = useState<UserContext[]>(() => rbacService.getUsers());

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>(initialUserId || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'all' | 'today' | '24h' | '7d' | '30d'>('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'auth' | 'admin' | 'billing' | 'frontdesk'>('all');

  // View Mode: 'list' (Table / Timeline) | 'users' (Aggregated per staff member)
  const [viewMode, setViewMode] = useState<'list' | 'users'>('list');

  // Modal inspection
  const [inspectedLog, setInspectedLog] = useState<AuditLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual Activity Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteAction, setNoteAction] = useState('Administrative Security Check');
  const [noteCategory, setNoteCategory] = useState<AuditLog['entityType']>('Settings');
  const [noteDetails, setNoteDetails] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    return pmsService.subscribe((state) => {
      setDb(state);
      setUsers(rbacService.getUsers());
    });
  }, []);

  useEffect(() => {
    if (initialUserId) {
      setSelectedUser(initialUserId);
    }
  }, [initialUserId]);

  // Derive department mapping from users
  const userDeptMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach(u => {
      map[u.id] = u.department;
      map[u.name.toLowerCase()] = u.department;
    });
    return map;
  }, [users]);

  // Master Audit Logs list
  const rawLogs = useMemo(() => {
    const logs = db.auditLogs || [];
    return logs;
  }, [db.auditLogs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    const now = new Date().getTime();

    return rawLogs.filter(log => {
      // 1. Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const actionMatch = (log.action || '').toLowerCase().includes(q);
        const userMatch = (log.userName || '').toLowerCase().includes(q);
        const roleMatch = (log.userRole || '').toLowerCase().includes(q);
        const entityMatch = (log.entityId || '').toLowerCase().includes(q);
        const oldMatch = (log.oldValue || '').toLowerCase().includes(q);
        const newMatch = (log.newValue || '').toLowerCase().includes(q);
        const ipMatch = (log.ipAddress || '').toLowerCase().includes(q);
        if (!actionMatch && !userMatch && !roleMatch && !entityMatch && !oldMatch && !newMatch && !ipMatch) {
          return false;
        }
      }

      // 2. User Filter
      if (selectedUser !== 'all') {
        if (log.userId !== selectedUser && log.userName !== selectedUser) {
          return false;
        }
      }

      // 3. Department Filter
      if (selectedDepartment !== 'all') {
        const dept = userDeptMap[log.userId] || userDeptMap[log.userName?.toLowerCase()] || '';
        if (dept !== selectedDepartment) {
          return false;
        }
      }

      // 4. Category Filter
      if (selectedCategory !== 'all') {
        if (log.entityType !== selectedCategory) {
          return false;
        }
      }

      // 5. Time Range
      if (timeRange !== 'all') {
        const logTime = new Date(log.createdAt).getTime();
        const diffHours = (now - logTime) / (1000 * 3600);

        if (timeRange === 'today') {
          const logDate = new Date(log.createdAt).toISOString().split('T')[0];
          const today = new Date().toISOString().split('T')[0];
          if (logDate !== today) return false;
        } else if (timeRange === '24h') {
          if (diffHours > 24) return false;
        } else if (timeRange === '7d') {
          if (diffHours > 24 * 7) return false;
        } else if (timeRange === '30d') {
          if (diffHours > 24 * 30) return false;
        }
      }

      // 6. Quick Filter Pills
      if (quickFilter === 'auth') {
        const isAuth = log.action.toLowerCase().includes('login') ||
                       log.action.toLowerCase().includes('logout') ||
                       log.action.toLowerCase().includes('password') ||
                       log.action.toLowerCase().includes('lock');
        if (!isAuth) return false;
      } else if (quickFilter === 'admin') {
        const isAdmin = log.entityType === 'User' ||
                        log.entityType === 'Settings' ||
                        log.action.toLowerCase().includes('permission') ||
                        log.action.toLowerCase().includes('role') ||
                        log.action.toLowerCase().includes('rule');
        if (!isAdmin) return false;
      } else if (quickFilter === 'billing') {
        const isBilling = log.entityType === 'Folio' ||
                          log.entityType === 'Payment' ||
                          log.entityType === 'Refund' ||
                          log.action.toLowerCase().includes('folio') ||
                          log.action.toLowerCase().includes('settlement');
        if (!isBilling) return false;
      } else if (quickFilter === 'frontdesk') {
        const isFD = log.entityType === 'Stay' ||
                     log.entityType === 'Reservation' ||
                     log.entityType === 'Room' ||
                     log.action.toLowerCase().includes('check-in') ||
                     log.action.toLowerCase().includes('checkout');
        if (!isFD) return false;
      }

      return true;
    });
  }, [rawLogs, searchTerm, selectedUser, selectedDepartment, selectedCategory, timeRange, quickFilter, userDeptMap]);

  // Paginated Logs
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;

  // Stats Analytics
  const stats = useMemo(() => {
    const total = rawLogs.length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = rawLogs.filter(l => l.createdAt.startsWith(todayStr)).length;

    const uniqueUsers = new Set(rawLogs.map(l => l.userId || l.userName)).size;

    const adminEvents = rawLogs.filter(l =>
      l.entityType === 'User' ||
      l.entityType === 'Settings' ||
      l.action.toLowerCase().includes('role') ||
      l.action.toLowerCase().includes('permission') ||
      l.action.toLowerCase().includes('approval') ||
      l.action.toLowerCase().includes('password')
    ).length;

    return { total, todayCount, uniqueUsers, adminEvents };
  }, [rawLogs]);

  // User-aggregated summary data
  const userAggregates = useMemo(() => {
    const map = new Map<string, {
      userId: string;
      userName: string;
      role: string;
      department: string;
      totalActions: number;
      lastActive: string;
      latestAction: string;
      actionBreakdown: Record<string, number>;
    }>();

    rawLogs.forEach(l => {
      const id = l.userId || l.userName || 'unknown';
      if (!map.has(id)) {
        map.set(id, {
          userId: id,
          userName: l.userName || 'Unknown Staff',
          role: l.userRole || 'Staff',
          department: userDeptMap[id] || userDeptMap[l.userName?.toLowerCase()] || 'Operations',
          totalActions: 0,
          lastActive: l.createdAt,
          latestAction: l.action,
          actionBreakdown: {}
        });
      }

      const item = map.get(id)!;
      item.totalActions += 1;
      if (new Date(l.createdAt).getTime() > new Date(item.lastActive).getTime()) {
        item.lastActive = l.createdAt;
        item.latestAction = l.action;
      }

      const cat = l.entityType || 'Other';
      item.actionBreakdown[cat] = (item.actionBreakdown[cat] || 0) + 1;
    });

    return Array.from(map.values()).sort((a, b) => b.totalActions - a.totalActions);
  }, [rawLogs, userDeptMap]);

  // Format Helper: Relative time
  const formatTimeAgo = (iso: string) => {
    try {
      const date = new Date(iso);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return iso;
    }
  };

  // Export to Vector PDF
  const handleExportPDF = () => {
    const propertyName = pmsService.getState().settings.resortName || 'Resort MIS';
    pdfExportService.exportToPDF({
      title: 'STAFF ACTIVITY & AUDIT REGISTRATION LOGS',
      subtitle: `${propertyName.toUpperCase()} • SECURITY & OPERATIONAL AUDIT`,
      date: new Date().toLocaleDateString('en-GB'),
      columns: [
        { key: 'timestamp', header: 'Timestamp' },
        { key: 'user', header: 'Staff Operator' },
        { key: 'role', header: 'Role' },
        { key: 'department', header: 'Department' },
        { key: 'action', header: 'Action Name' },
        { key: 'entity', header: 'Target Entity' },
        { key: 'narration', header: 'Details / State' }
      ],
      rows: filteredLogs.map(l => ({
        timestamp: new Date(l.createdAt).toLocaleString('en-GB'),
        user: l.userName,
        role: l.userRole,
        department: userDeptMap[l.userId] || userDeptMap[l.userName?.toLowerCase()] || 'Operations',
        action: l.action,
        entity: `${l.entityType} (${l.entityId || 'N/A'})`,
        narration: l.newValue || l.oldValue || '-'
      })),
      summaryTotals: {
        timestamp: `Total Logs: ${filteredLogs.length}`,
        narration: 'Chain of Custody: INTACT'
      },
      department: 'System Administration',
      metadata: {
        'Time Range': timeRange,
        'Active Logs': `${filteredLogs.length}`
      }
    }, `User_Activity_Logs_${new Date().toISOString().split('T')[0]}.pdf`);

    if (onShowToast) {
      onShowToast(`Exported ${filteredLogs.length} activity log records to PDF`, 'success');
    }
  };

  // Print View
  const handlePrint = () => {
    window.print();
  };

  // Handle Recording Manual Note
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteDetails.trim()) {
      if (onShowToast) onShowToast('Please provide administrative note details', 'error');
      return;
    }

    pmsService.logAudit(
      noteAction,
      noteCategory,
      `NOTE-${Date.now().toString().slice(-4)}`,
      undefined,
      noteDetails.trim()
    );

    setIsNoteModalOpen(false);
    setNoteDetails('');
    if (onShowToast) {
      onShowToast('Administrative audit entry recorded successfully', 'success');
    }
  };

  // Copy JSON
  const handleCopyPayload = (log: AuditLog) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
    if (onShowToast) onShowToast('Audit record copied to clipboard', 'info');
  };

  // Helper for category badge color
  const getCategoryBadge = (category: AuditLog['entityType']) => {
    switch (category) {
      case 'User':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Settings':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Folio':
      case 'Payment':
      case 'Refund':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Stay':
      case 'Reservation':
      case 'Room':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Order':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Event':
      case 'Hall':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'NightAudit':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Banner & Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-gray-900">User Activity Logs & Security Audit Trail</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Stream</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Comprehensive trace of user logins, role adjustments, permission assignments, billing changes, and operational activities.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* View Mode Toggle */}
          <div className="bg-gray-100 p-0.5 rounded-lg border border-gray-200 flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Activity Feed ({filteredLogs.length})
            </button>
            <button
              onClick={() => setViewMode('users')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'users'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Staff Breakdown ({userAggregates.length})
            </button>
          </div>

          <button
            onClick={() => setIsNoteModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
            title="Add custom administrative note to audit log"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Record Note</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Download vector PDF file of current activity logs"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            title="Print Audit Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
            <span>Total Recorded Events</span>
            <History className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-1.5 flex items-baseline space-x-2">
            <span className="text-xl font-bold font-mono text-gray-900">{stats.total}</span>
            <span className="text-[11px] text-gray-400">events logged</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1">Immutable audit records</div>
        </div>

        <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
            <span>Today's Actions</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-1.5 flex items-baseline space-x-2">
            <span className="text-xl font-bold font-mono text-emerald-600">{stats.todayCount}</span>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium">
              Active Shift
            </span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1">Events since 12:00 AM</div>
        </div>

        <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
            <span>Active Staff Operators</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-1.5 flex items-baseline space-x-2">
            <span className="text-xl font-bold font-mono text-purple-700">{stats.uniqueUsers}</span>
            <span className="text-[11px] text-gray-400">staff users</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1">Logged across departments</div>
        </div>

        <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
            <span>Security & RBAC Events</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-1.5 flex items-baseline space-x-2">
            <span className="text-xl font-bold font-mono text-amber-700">{stats.adminEvents}</span>
            <span className="text-[11px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded font-medium">
              High Audit
            </span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1">Users, Roles, Permissions</div>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          {/* Search Input */}
          <div className="relative lg:col-span-4">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search user, action, ID, IP address, or details..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* User Selector */}
          <div className="lg:col-span-3">
            <select
              value={selectedUser}
              onChange={e => {
                setSelectedUser(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Staff Users ({users.length})</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.roleName || (u as any).role || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          {/* Department Selector */}
          <div className="lg:col-span-2">
            <select
              value={selectedDepartment}
              onChange={e => {
                setSelectedDepartment(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Departments</option>
              <option value="Executive Management">Executive Management</option>
              <option value="Front Office">Front Office</option>
              <option value="Food & Beverage">Food & Beverage</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Finance & Accounts">Finance & Accounts</option>
              <option value="Sales & Marketing">Sales & Marketing</option>
              <option value="Inventory & Stores">Inventory & Stores</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Security & Safety">Security & Safety</option>
            </select>
          </div>

          {/* Category Selector */}
          <div className="lg:col-span-2">
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Categories</option>
              <option value="User">User Accounts & Roles</option>
              <option value="Settings">System Settings & Rules</option>
              <option value="Folio">Folio & Billing</option>
              <option value="Payment">Payments & Cashiering</option>
              <option value="Stay">Front Desk Stays</option>
              <option value="Reservation">Reservations</option>
              <option value="Room">Room Status Changes</option>
              <option value="Order">F&B Dining Orders</option>
              <option value="Event">Events & Banquets</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Maintenance">Maintenance</option>
              <option value="NightAudit">Night Audit & Sync</option>
            </select>
          </div>

          {/* Time Scope */}
          <div className="lg:col-span-1">
            <select
              value={timeRange}
              onChange={e => {
                setTimeRange(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="24h">24h</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
            </select>
          </div>
        </div>

        {/* Quick Scope Filter Chips */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100 flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="text-gray-400 text-[11px] font-medium mr-1">Quick Scope:</span>
            {[
              { id: 'all', label: 'All Actions' },
              { id: 'auth', label: 'Logins & Auth' },
              { id: 'admin', label: 'Admin & RBAC' },
              { id: 'billing', label: 'Billing & Cashier' },
              { id: 'frontdesk', label: 'Front Desk' }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => {
                  setQuickFilter(pill.id as any);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  quickFilter === pill.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {(searchTerm || selectedUser !== 'all' || selectedDepartment !== 'all' || selectedCategory !== 'all' || timeRange !== 'all' || quickFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedUser('all');
                setSelectedDepartment('all');
                setSelectedCategory('all');
                setTimeRange('all');
                setQuickFilter('all');
                setCurrentPage(1);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. VIEW MODE A: ACTIVITY FEED / TABLE */}
      {viewMode === 'list' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-3 w-44">Date & Time</th>
                  <th className="p-3 w-56">Staff Operator</th>
                  <th className="p-3 w-48">Action & Category</th>
                  <th className="p-3 w-36">Entity Target</th>
                  <th className="p-3">Activity Description / State Change</th>
                  <th className="p-3 w-36">IP & Terminal</th>
                  <th className="p-3 w-20 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-500">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
                        <History className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-gray-700">No activity logs matching criteria</p>
                      <p className="text-xs text-gray-400 mt-1">Try resetting or broadening your search filters</p>
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => {
                    const isAuthAction = log.action.toLowerCase().includes('login') ||
                                         log.action.toLowerCase().includes('logout');
                    const isSecurity = log.action.toLowerCase().includes('permission') ||
                                       log.action.toLowerCase().includes('role') ||
                                       log.action.toLowerCase().includes('password') ||
                                       log.action.toLowerCase().includes('approval');

                    return (
                      <tr key={log.id} className="hover:bg-blue-50/30 transition-colors group">
                        {/* 1. Date & Time */}
                        <td className="p-3 align-top">
                          <div className="font-semibold text-gray-900 font-mono text-[11px]">
                            {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                          <div className="text-[10px] text-gray-500 flex items-center space-x-1 mt-0.5">
                            <span>{new Date(log.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-blue-600 font-medium">{formatTimeAgo(log.createdAt)}</span>
                          </div>
                        </td>

                        {/* 2. Staff Operator */}
                        <td className="p-3 align-top">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-900 font-bold flex items-center justify-center text-xs shrink-0">
                              {log.userName ? log.userName.charAt(0) : 'U'}
                            </div>
                            <div className="min-w-0">
                              <button
                                onClick={() => {
                                  setSelectedUser(log.userId || log.userName);
                                  setCurrentPage(1);
                                }}
                                className="font-bold text-gray-900 text-xs hover:text-blue-600 truncate block text-left"
                                title={`Filter all activity by ${log.userName}`}
                              >
                                {log.userName || 'System Auto'}
                              </button>
                              <div className="flex items-center space-x-1 text-[10px] text-gray-500 truncate">
                                <span className="font-medium text-amber-700">{log.userRole || 'Staff'}</span>
                                <span>•</span>
                                <span>{userDeptMap[log.userId] || userDeptMap[log.userName?.toLowerCase()] || 'Operations'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Action & Category */}
                        <td className="p-3 align-top">
                          <div className="font-semibold text-gray-900 flex items-center space-x-1.5">
                            {isAuthAction ? (
                              <Key className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            ) : isSecurity ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            ) : (
                              <Layers className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            )}
                            <span className="truncate">{log.action}</span>
                          </div>
                          <div className="mt-1">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryBadge(log.entityType)}`}>
                              {log.entityType}
                            </span>
                          </div>
                        </td>

                        {/* 4. Entity Target */}
                        <td className="p-3 align-top">
                          {log.entityId ? (
                            <span className="font-mono text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200 inline-block truncate max-w-[130px]">
                              {log.entityId}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">—</span>
                          )}
                        </td>

                        {/* 5. Description / State Diff */}
                        <td className="p-3 align-top">
                          <div className="text-xs text-gray-800 leading-relaxed">
                            {log.oldValue && log.newValue ? (
                              <div className="space-y-1">
                                <div className="text-[11px] text-gray-500 flex items-center space-x-1">
                                  <span className="font-medium text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                                    Before:
                                  </span>
                                  <span className="truncate">{log.oldValue}</span>
                                </div>
                                <div className="text-[11px] text-emerald-900 flex items-center space-x-1">
                                  <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    After:
                                  </span>
                                  <span className="font-semibold truncate">{log.newValue}</span>
                                </div>
                              </div>
                            ) : (
                              <span>{log.newValue || log.oldValue || 'Action logged without additional mutation payload.'}</span>
                            )}
                          </div>
                        </td>

                        {/* 6. IP Address */}
                        <td className="p-3 align-top">
                          <div className="font-mono text-[11px] text-gray-600 flex items-center space-x-1">
                            <Laptop className="w-3 h-3 text-gray-400" />
                            <span>{log.ipAddress || '192.168.1.50'}</span>
                          </div>
                          <span className="text-[9px] text-gray-400">CCULB Secure VLAN</span>
                        </td>

                        {/* 7. Action Button */}
                        <td className="p-3 align-top text-right">
                          <button
                            onClick={() => setInspectedLog(log)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded border border-transparent hover:border-blue-200 transition-colors"
                            title="Inspect full event audit details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
            <div>
              Showing <span className="font-bold text-gray-800">{paginatedLogs.length ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
              <span className="font-bold text-gray-800">{Math.min(currentPage * pageSize, filteredLogs.length)}</span> of{' '}
              <span className="font-bold text-gray-800">{filteredLogs.length}</span> entries
            </div>

            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-white border border-gray-200 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-2 font-mono text-xs font-bold text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 bg-white border border-gray-200 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. VIEW MODE B: AGGREGATED STAFF MEMBER ACTIVITY BREAKDOWN */}
      {viewMode === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {userAggregates.map(agg => (
            <div
              key={agg.userId}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-900 font-bold flex items-center justify-center text-sm">
                      {agg.userName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">{agg.userName}</h4>
                      <p className="text-[10px] text-amber-700 font-medium">{agg.role}</p>
                      <p className="text-[10px] text-gray-400">{agg.department}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-blue-600 block leading-tight">
                      {agg.totalActions}
                    </span>
                    <span className="text-[10px] text-gray-400">actions logged</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Last Active:</span>
                    <span className="font-medium text-gray-800">{formatTimeAgo(agg.lastActive)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Latest Action:</span>
                    <span className="font-semibold text-gray-800 truncate max-w-[170px]" title={agg.latestAction}>
                      {agg.latestAction}
                    </span>
                  </div>
                </div>

                {/* Categories Badge Pill Strip */}
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {Object.entries(agg.actionBreakdown).slice(0, 4).map(([cat, count]) => (
                    <span key={cat} className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                      {cat}: {count}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedUser(agg.userId);
                    setViewMode('list');
                    setCurrentPage(1);
                  }}
                  className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>View Full Activity Stream</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: FORENSIC EVENT DETAIL INSPECTION                 */}
      {/* ========================================================= */}
      {inspectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Audit Event Details</h3>
                  <p className="text-[10px] text-gray-400 font-mono">ID: {inspectedLog.id}</p>
                </div>
              </div>

              <button
                onClick={() => setInspectedLog(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Operator Info Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Staff Operator</span>
                  <p className="font-bold text-gray-900 mt-0.5">{inspectedLog.userName}</p>
                  <p className="text-[11px] text-amber-700">{inspectedLog.userRole}</p>
                  <p className="text-[10px] text-gray-500">{userDeptMap[inspectedLog.userId] || 'Operations'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Security & Network</span>
                  <p className="font-mono text-gray-800 text-[11px] mt-0.5">{inspectedLog.ipAddress || '192.168.1.50'}</p>
                  <p className="text-[10px] text-gray-400">Terminal: CCULB-VLAN-SECURE</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">UID: {inspectedLog.userId}</p>
                </div>
              </div>

              {/* Action & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Action Name</span>
                  <span className="font-bold text-gray-900 text-xs block mt-0.5">{inspectedLog.action}</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Entity Scope & ID</span>
                  <span className="font-mono font-bold text-blue-600 text-xs block mt-0.5">
                    {inspectedLog.entityType}: {inspectedLog.entityId || 'N/A'}
                  </span>
                </div>
              </div>

              {/* State Diff */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Data Payload & Mutation</span>
                {inspectedLog.oldValue && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 text-red-900 text-[11px]">
                    <span className="font-bold block text-[10px] text-red-700 uppercase">Previous State</span>
                    {inspectedLog.oldValue}
                  </div>
                )}
                {inspectedLog.newValue && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-emerald-900 text-[11px]">
                    <span className="font-bold block text-[10px] text-emerald-700 uppercase">Updated State / Narration</span>
                    {inspectedLog.newValue}
                  </div>
                )}
                {!inspectedLog.oldValue && !inspectedLog.newValue && (
                  <p className="text-gray-500 italic text-[11px]">No state change payload recorded.</p>
                )}
              </div>

              {/* Timestamp */}
              <div className="text-[11px] text-gray-500 flex items-center justify-between px-1">
                <span>Exact Recorded Timestamp:</span>
                <span className="font-mono font-bold text-gray-800">
                  {new Date(inspectedLog.createdAt).toUTCString()} ({new Date(inspectedLog.createdAt).toLocaleString('en-GB')})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 pt-3">
              <button
                onClick={() => handleCopyPayload(inspectedLog)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
              >
                {copiedId === inspectedLog.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied JSON</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON Payload</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setInspectedLog(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: RECORD ADMINISTRATIVE AUDIT NOTE                */}
      {/* ========================================================= */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <form onSubmit={handleSaveNote} className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Record Administrative Audit Note</h3>
                  <p className="text-[10px] text-gray-400">Log an official inspection or security note to the immutable audit log</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Action / Event Title</label>
                <input
                  type="text"
                  value={noteAction}
                  onChange={e => setNoteAction(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Physical Cash Drawer Inspection or Security Audit"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Category Scope</label>
                <select
                  value={noteCategory}
                  onChange={e => setNoteCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium"
                >
                  <option value="Settings">System Settings & Security Policy</option>
                  <option value="User">Staff & Access Control</option>
                  <option value="Folio">Finance & Cashier Settlement</option>
                  <option value="NightAudit">Night Audit & Daily Reconciliation</option>
                  <option value="Maintenance">Property & Facilities</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Audit Details / Findings</label>
                <textarea
                  rows={4}
                  value={noteDetails}
                  onChange={e => setNoteDetails(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Describe the operational finding, shift verification, or supervisory check performed..."
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 border-t border-gray-200 pt-3">
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Save to Audit Log
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
