import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, BedDouble, Sparkles, ClipboardList,
  Tag, Package, Palmtree, Bell, Users, BarChart3,
  CheckCircle2, Clock, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { housekeepingService } from '../services/housekeepingService';
import { pmsService } from '../services/pmsService';
import { HousekeepingDashboard } from './housekeeping/HousekeepingDashboard';
import { HousekeepingRoomStatus } from './housekeeping/HousekeepingRoomStatus';
import { HousekeepingCleaningView } from './housekeeping/HousekeepingCleaningView';
import { HousekeepingLostFoundView } from './housekeeping/HousekeepingLostFoundView';
import { HousekeepingLinenView } from './housekeeping/HousekeepingLinenView';
import { HousekeepingAmenitiesView } from './housekeeping/HousekeepingAmenitiesView';
import { HousekeepingRequestsView } from './housekeeping/HousekeepingRequestsView';
import { HousekeepingStaffView } from './housekeeping/HousekeepingStaffView';
import { HousekeepingReportsView } from './housekeeping/HousekeepingReportsView';

export type HousekeepingSubTab =
  | 'dashboard'
  | 'status'
  | 'cleaning'
  | 'lost-found'
  | 'linen'
  | 'amenities'
  | 'requests'
  | 'staff'
  | 'reports';

interface HousekeepingViewProps {
  onSelectRoom: (roomId: string) => void;
  initialTab?: HousekeepingSubTab | string;
  onNavigate?: (route: string) => void;
  onPrintReport?: (reportData: any) => void;
}

export const HousekeepingView: React.FC<HousekeepingViewProps> = ({
  onSelectRoom,
  initialTab = 'dashboard',
  onNavigate,
  onPrintReport
}) => {
  const parseTabFromRoute = (tabStr: string): HousekeepingSubTab => {
    if (tabStr.includes('status')) return 'status';
    if (tabStr.includes('cleaning')) return 'cleaning';
    if (tabStr.includes('lost-found') || tabStr.includes('lostfound')) return 'lost-found';
    if (tabStr.includes('linen')) return 'linen';
    if (tabStr.includes('amenities')) return 'amenities';
    if (tabStr.includes('requests')) return 'requests';
    if (tabStr.includes('staff')) return 'staff';
    if (tabStr.includes('reports')) return 'reports';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<HousekeepingSubTab>(parseTabFromRoute(initialTab));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(parseTabFromRoute(initialTab));
    }
  }, [initialTab]);

  const navButtons = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'status', label: 'Room Status', icon: BedDouble },
    { id: 'cleaning', label: 'Room Cleaning', icon: Sparkles },
    { id: 'lost-found', label: 'Lost & Found', icon: Tag },
    { id: 'linen', label: 'Linen & Laundry', icon: Package },
    { id: 'amenities', label: 'Amenities & Billing', icon: Palmtree },
    { id: 'requests', label: 'Service Requests', icon: Bell },
    { id: 'staff', label: 'Staff & Roster', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  return (
    <div className="bg-slate-950 text-slate-100 rounded-2xl p-3 sm:p-5 border border-slate-800 shadow-xl space-y-4 sm:space-y-6">
      {/* Department Header & Brand Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/90">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                Housekeeping & Facility Operations
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                COMMAND CENTER
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Central room turnover control, attendant assignments, inspections, linen inventory & guest service requests.
            </p>
          </div>
        </div>
      </div>

      {/* Top Department Tab Navigation */}
      <div className="flex items-center space-x-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-750 overflow-x-auto scrollbar-thin shadow-md">
        {navButtons.map(btn => {
          const Icon = btn.icon;
          const isActive = activeTab === btn.id;

          return (
            <button
              key={btn.id}
              onClick={() => {
                setActiveTab(btn.id as HousekeepingSubTab);
                if (onNavigate) {
                  onNavigate(`housekeeping-${btn.id}`);
                }
              }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 ring-1 ring-blue-400/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-300'}`} />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Sub-Module Views */}
      <div className="space-y-4">
        {activeTab === 'dashboard' && (
          <HousekeepingDashboard onSelectRoom={onSelectRoom} onNavigateTab={(tab) => setActiveTab(tab as HousekeepingSubTab)} />
        )}

        {activeTab === 'status' && (
          <HousekeepingRoomStatus />
        )}

        {activeTab === 'cleaning' && (
          <HousekeepingCleaningView />
        )}

        {activeTab === 'lost-found' && (
          <HousekeepingLostFoundView />
        )}

        {activeTab === 'linen' && (
          <HousekeepingLinenView />
        )}

        {activeTab === 'amenities' && (
          <HousekeepingAmenitiesView />
        )}

        {activeTab === 'requests' && (
          <HousekeepingRequestsView />
        )}

        {activeTab === 'staff' && (
          <HousekeepingStaffView />
        )}

        {activeTab === 'reports' && (
          <HousekeepingReportsView
            onPrintReport={onPrintReport}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </div>
  );
};
