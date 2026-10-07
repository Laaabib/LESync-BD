import React, { useState, useEffect } from 'react';
import {
  Search, Bell, HelpCircle, User as UserIcon,
  RefreshCw, PlusCircle, LogIn, Calendar, LayoutGrid, Sparkles, CheckCircle2,
  X, LogOut, ShieldCheck, Clock, Database, BarChart3, ChevronDown, AlertTriangle, Menu,
  PanelLeftOpen, PanelLeftClose
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { authService, AuthSession } from '../../services/authService';
import { rbacService } from '../../services/rbacService';
import { PmsDatabaseState } from '../../services/mockPmsDatabase';
import { cloudSqlSyncService, CloudSqlSyncStatus, CloudSqlHealthInfo } from '../../services/cloudSqlSyncService';
import { CloudSqlSyncModal } from './CloudSqlSyncModal';
import { QuickReportsMenuModal } from './QuickReportsMenuModal';
import { UserAccountDropdown } from './UserAccountDropdown';
import { CloudSqlSyncHeaderAlert } from './CloudSqlSyncHeaderAlert';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenQuickReservation?: () => void;
  onOpenQuickCheckIn?: () => void;
  onOpenQuickReports?: () => void;
  onNavigate: (route: string, reportCode?: string) => void;
  onPrintReport?: (reportData: any) => void;
  onToggleMobileMenu?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  activeRoute?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenQuickReservation,
  onOpenQuickCheckIn,
  onOpenQuickReports,
  onNavigate,
  onPrintReport,
  onToggleMobileMenu,
  isSidebarCollapsed,
  onToggleSidebar,
  activeRoute
}) => {
  const [db, setDb] = useState<PmsDatabaseState>(pmsService.getState());
  const [activeUser, setActiveUser] = useState(rbacService.getActiveUser());
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [showAlerts, setShowAlerts] = useState<boolean>(false);
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showCloudSqlModal, setShowCloudSqlModal] = useState<boolean>(false);
  const [showQuickReportsModal, setShowQuickReportsModal] = useState<boolean>(false);
  const [sqlStatus, setSqlStatus] = useState<CloudSqlSyncStatus>(cloudSqlSyncService.getStatus());
  const [sqlHealth, setSqlHealth] = useState<CloudSqlHealthInfo>(cloudSqlSyncService.getHealth());

  useEffect(() => {
    const unsub = pmsService.subscribe((newDb) => {
      setDb(newDb);
      setActiveUser({ ...rbacService.getActiveUser() });
    });
    const unsubRbac = rbacService.subscribe(() => {
      setActiveUser({ ...rbacService.getActiveUser() });
    });
    const unsubAuth = authService.subscribe(() => {
      setActiveUser({ ...rbacService.getActiveUser() });
    });
    const unsubSql = cloudSqlSyncService.subscribe((newStatus) => {
      setSqlStatus(newStatus);
      setSqlHealth(cloudSqlSyncService.getHealth());
    });
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
      setSqlHealth(cloudSqlSyncService.getHealth());
    }, 1000);

    const now = new Date();
    setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setDateStr(now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
    setSqlHealth(cloudSqlSyncService.getHealth());

    return () => {
      unsub();
      unsubRbac();
      unsubAuth();
      unsubSql();
      clearInterval(timer);
    };
  }, []);

  const unreadAlerts = (db.alerts || []).filter(a => !a.read);
  const isAppOwnerOrIT = rbacService.isAppOwnerOrIT(activeUser);
  const isDevOrIT = rbacService.isDeveloperOrIT(activeUser);
  const hasSyncWarning = isAppOwnerOrIT && (sqlHealth.isFailed || sqlHealth.isOverdue);
  const totalAlertsCount = unreadAlerts.length + (hasSyncWarning ? 1 : 0);
  const kpis = pmsService.getOperationalKPIs();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-2.5 sm:px-4 lg:px-6 sticky top-0 z-30 shadow-xs gap-2 min-w-0">
      {/* Left: Hamburger menu on mobile + Desktop Sidebar Toggle + Global Search Input */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 max-w-lg min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shrink-0 cursor-pointer"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
        )}

        {/* Desktop Sidebar Open / Extend / Collapse Toggle Button */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border shrink-0 cursor-pointer transition-all duration-150 shadow-2xs group ${
              isSidebarCollapsed
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:text-slate-900'
            }`}
            title={isSidebarCollapsed ? "Extend / Open Full Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
            aria-label={isSidebarCollapsed ? "Extend / Open Full Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? (
              <>
                <PanelLeftOpen className="w-4 h-4 text-slate-950 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold tracking-tight">Open Sidebar</span>
              </>
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 text-slate-500 group-hover:text-slate-800 transition-colors" />
                <span className="text-xs text-slate-600 font-medium">Collapse</span>
              </>
            )}
          </button>
        )}

        <div className="relative flex-1 min-w-[90px] sm:min-w-[160px] sm:w-72 md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 sm:pl-3 text-gray-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            onClick={onOpenSearch}
            readOnly
            className="block w-full pl-8 sm:pl-9 pr-2 sm:pr-12 py-1.5 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50/80 hover:bg-gray-100/70 text-gray-800 placeholder-gray-400 cursor-pointer shadow-xs transition-colors truncate"
            placeholder="Search Guests, Rooms, POS..."
          />
          <kbd className="hidden sm:inline-block absolute right-2.5 top-2 text-[10px] bg-gray-200/80 text-gray-600 px-1.5 py-0.5 rounded font-mono border border-gray-300">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Property White-Label Indicator (Shows current property name & logo) */}
      <div className="hidden lg:flex items-center gap-2.5 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-xl max-w-xs truncate" title={`Active Property: ${db.settings?.resortName || 'Hotel Operations'}`}>
        {db.settings?.logoUrl ? (
          <img
            src={db.settings.logoUrl}
            alt={db.settings.resortName}
            className="h-6 w-auto max-w-[28px] object-contain rounded shrink-0"
          />
        ) : (
          <div className="w-6 h-6 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-700 flex items-center justify-center text-[11px] font-bold shrink-0">
            {(db.settings?.resortName || 'H').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="truncate text-left">
          <div className="text-xs font-bold text-slate-800 truncate leading-tight">
            {db.settings?.resortName || 'Hotel Operations'}
          </div>
          <div className="text-[10px] text-slate-400 font-medium leading-none truncate">
            LESync PMS Platform
          </div>
        </div>
      </div>

      {/* Right: Technical Meters, Live Clock & User Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Optional Live Operational Pill (Wide screens only to prevent congestion) */}
        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-full text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Occ</span>
            <span className="font-mono font-bold text-blue-600">{kpis.occupancyRate}%</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">In-House</span>
            <span className="font-mono font-bold text-slate-700">{kpis.inHouseGuests}</span>
          </div>
        </div>

        {/* Live Clock & Date */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 text-xs text-slate-500 font-mono" title={`${dateStr} (Dhaka Standard Time)`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="font-bold text-slate-700">{time}</span>
          <span className="hidden xl:inline text-slate-400 font-sans text-[11px]">• {dateStr}</span>
        </div>

        {/* Quick Action: Quick Reports Menu Button */}
        <button
          onClick={() => {
            if (onOpenQuickReports) {
              onOpenQuickReports();
            } else {
              setShowQuickReportsModal(true);
            }
          }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-lg transition-colors border border-slate-200/80"
          title="Quick Menu: Access hotel reports"
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden md:inline">Reports</span>
        </button>

        {/* Resort Multi-Device Mesh & Supabase Synchronization Pipe Indicator */}
        <CloudSqlSyncHeaderAlert
          onOpenFullModal={() => setShowCloudSqlModal(true)}
          isAppOwnerOrIT={isAppOwnerOrIT}
        />

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200/80 relative transition-colors"
            title="Operational Alerts"
          >
            <Bell className="w-4 h-4" />
            {totalAlertsCount > 0 && (
              <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                sqlHealth.isFailed ? 'bg-rose-600 animate-pulse' : sqlHealth.isOverdue ? 'bg-amber-500' : 'bg-red-500'
              }`}></span>
            )}
          </button>

          {showAlerts && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in duration-100">
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Operational Alerts</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-200 text-gray-700 font-mono font-bold">
                    {totalAlertsCount}
                  </span>
                </div>
                <button
                  onClick={() => pmsService.clearAllAlerts()}
                  className="text-[11px] text-blue-600 hover:underline font-medium"
                >
                  Mark all read
                </button>
              </div>

              {/* Pinned Supabase Sync Status Alert (if failed or overdue) */}
              {hasSyncWarning && (
                <div className={`p-3 border-b flex items-start justify-between ${
                  sqlHealth.isFailed ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-start space-x-2">
                    {sqlHealth.isFailed ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <p className="font-bold text-xs">{sqlHealth.label}</p>
                        <span className={`text-[9px] font-bold uppercase px-1 py-0.2 rounded ${
                          sqlHealth.isFailed ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
                        }`}>
                          Supabase
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5 opacity-90 leading-tight">
                        {sqlHealth.detail}
                      </p>
                      <p className="text-[10px] opacity-75 font-mono mt-1">
                        Last sync: {sqlHealth.formattedAgo}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowAlerts(false);
                      setShowCloudSqlModal(true);
                    }}
                    className={`px-2 py-1 text-[10px] font-bold rounded shrink-0 ml-2 shadow-xs text-white ${
                      sqlHealth.isFailed ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    Resolve
                  </button>
                </div>
              )}

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {(db.alerts || []).length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-xs">No active operational alerts</div>
                ) : (
                  (db.alerts || []).map(alt => (
                    <div
                      key={alt.id}
                      className={`p-3 text-xs transition-colors hover:bg-gray-50 ${alt.read ? 'opacity-60' : 'bg-blue-50/30'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          <span
                            className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                              alt.type === 'urgent' ? 'bg-red-500' :
                              alt.type === 'warning' ? 'bg-orange-500' :
                              alt.type === 'vip' ? 'bg-purple-500' :
                              alt.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                          />
                          <div>
                            <p className="font-semibold text-gray-800">{alt.title}</p>
                            <p className="text-gray-500 mt-0.5 text-[11px] leading-relaxed">{alt.message}</p>
                            <span className="text-[10px] text-gray-400 mt-1 block">{alt.timestamp}</span>
                          </div>
                        </div>
                        {alt.actionRoute && (
                          <button
                            onClick={() => {
                              setShowAlerts(false);
                              onNavigate(alt.actionRoute!);
                            }}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] rounded font-bold shrink-0 ml-2 shadow-xs"
                          >
                            {alt.actionLabel || 'View'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role Switcher & Profile Menu - Clean & Uncluttered */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50/80 hover:bg-gray-100 text-xs text-slate-700 border border-slate-200/80 transition-colors shadow-2xs group"
            title="User Profile & Staff Account"
          >
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-900 font-bold flex items-center justify-center text-xs">
                {activeUser.name ? activeUser.name.charAt(0) : 'U'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" title="Active"></span>
            </div>
            <div className="text-left hidden sm:block">
              <span className="font-semibold block text-xs leading-tight text-slate-900 truncate max-w-[140px]">
                {activeUser.name}
              </span>
              <span className="text-[10px] font-medium text-amber-700 block leading-tight mt-0.5 truncate">
                @{authService.getCredentials()[activeUser.id]?.username || activeUser.username || activeUser.email.split('@')[0]} • {activeUser.roleName}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0 hidden sm:block transition-transform" />
          </button>

          <UserAccountDropdown
            isOpen={showRoleMenu}
            onClose={() => setShowRoleMenu(false)}
            onNavigate={onNavigate}
            position="header"
            activeUser={activeUser}
          />
        </div>

        {/* Quick Guide / Help */}
        <button
          onClick={() => setShowHelp(true)}
          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200/60"
          title="Operational Guide & Keyboard Shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Operational Guide Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-6 text-xs text-gray-700 shadow-2xl relative">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-gray-900">LESync PMS Operational Guide</h3>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-gray-800">Keyboard Shortcuts:</h4>
                <div className="grid grid-cols-2 gap-2 mt-1 font-mono text-[11px]">
                  <div className="bg-gray-50 p-2 rounded border border-gray-200 flex justify-between">
                    <span className="text-gray-500">Global Search:</span>
                    <span className="text-blue-600 font-bold">Ctrl + K</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200 flex justify-between">
                    <span className="text-gray-500">Close Drawer:</span>
                    <span className="text-blue-600 font-bold">Esc</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Operational Philosophy:</h4>
                <p className="text-gray-600 leading-relaxed text-[11px] mt-1">
                  LESync PMS by LE Innova Automations provides an enterprise-grade data grid workflow for front-desk arrivals, room rack status, multi-hall banquet collision prevention, restaurant/bar order posting, unified inventory procurement, and general ledger accounting.
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-[11px] text-blue-900">
                <span className="font-bold">Staff Role Testing:</span> Switch between <span className="font-bold">Front Desk, Housekeeping, Accounts, Event Manager</span> using the user menu at top right.
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Supabase Synchronization Details & Manual Sync Modal - App Owner & IT only */}
      {isAppOwnerOrIT && (
        <CloudSqlSyncModal
          isOpen={showCloudSqlModal}
          onClose={() => setShowCloudSqlModal(false)}
        />
      )}

      {/* Quick Menu: All Hotel Reports */}
      <QuickReportsMenuModal
        isOpen={showQuickReportsModal}
        onClose={() => setShowQuickReportsModal(false)}
        onNavigate={onNavigate}
        onPrintReport={onPrintReport}
      />
    </header>
  );
};
