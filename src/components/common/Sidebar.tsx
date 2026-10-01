import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, ConciergeBell, CalendarDays, CalendarRange,
  BedDouble, Grid3X3, Layers, Users, Sparkles, Wrench,
  Building2, PartyPopper, CalendarCheck, Package as PackageIcon,
  UtensilsCrossed, Receipt, CreditCard, FileText, BarChart3,
  Bell, ShieldCheck, Settings, ChevronDown, ChevronRight, Menu,
  X, CheckSquare, Moon, Palmtree, Landmark, Scale, BookOpen,
  Boxes, ChefHat, Truck, Trash2, ClipboardList, ShoppingCart,
  Clock, ArrowUpDown, ArrowRight, Award, BarChart2, DollarSign,
  Store, Wine, Briefcase, HeartHandshake, UserCheck, Shield,
  Tag, Percent, Gift, Ban, CheckCircle2, Sliders, AlertTriangle, Zap,
  Database, History, Rocket, PanelLeftOpen, PanelLeftClose, ChevronsRight, ChevronsLeft,
  Fingerprint, Terminal
} from 'lucide-react';
import { pmsService } from '../../services/pmsService';
import { rbacService } from '../../services/rbacService';
import { adminMasterService } from '../../services/adminMasterService';
import { MainModuleName } from '../../types/reportingAndRbac';
import { UserAccountDropdown } from './UserAccountDropdown';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  moduleKey: MainModuleName;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
  children?: { id: string; label: string; icon?: React.ElementType }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'front-office': true,
    'restaurant': false,
    'housekeeping': false,
    'banquet': false,
    'activities': false,
    'amenities': false,
    'procurement': false,
    'inventory': false,
    'menu-management': false,
    'finance': false,
    'sales-marketing': false,
    'crm': false,
    'hr': false,
    'administration': false
  });

  const [activeUser, setActiveUser] = useState(rbacService.getActiveUser());
  const [pmsSettings, setPmsSettings] = useState(() => pmsService.getSettings());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [, setNavTick] = useState(0);

  useEffect(() => {
    const unsubRbac = rbacService.subscribe(() => {
      setActiveUser({ ...rbacService.getActiveUser() });
    });
    const unsubPms = pmsService.subscribe((db) => {
      setActiveUser({ ...rbacService.getActiveUser() });
      if (db.settings) {
        setPmsSettings({ ...db.settings });
      }
    });
    const unsubAdmin = adminMasterService.subscribe(() => {
      setNavTick(t => t + 1);
    });
    return () => {
      unsubRbac();
      unsubPms();
      unsubAdmin();
    };
  }, []);

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      moduleKey: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'front-office',
      moduleKey: 'front-office',
      label: 'Front Office',
      icon: ConciergeBell,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      children: [
        { id: 'front-desk', label: 'Front Desk Operations', icon: ConciergeBell },
        { id: 'reservations', label: 'Reservations', icon: CalendarDays },
        { id: 'reservation-calendar', label: 'Room Calendar', icon: CalendarRange },
        { id: 'room-assignment', label: 'Room Assignment', icon: Grid3X3 },
        { id: 'guests', label: 'Guest Profiles', icon: Users },
        { id: 'billing-folios', label: 'Guest Folio', icon: Receipt },
        { id: 'front-desk-checkin', label: 'Check-In', icon: UserCheck },
        { id: 'front-desk-checkout', label: 'Check-Out', icon: ArrowRight },
        { id: 'room-status', label: 'Room Status', icon: Layers },
        { id: 'room-move', label: 'Room Move', icon: ArrowUpDown },
        { id: 'front-office-wakeup', label: 'Wake-Up Calls', icon: Clock },
        { id: 'night-audit', label: 'Night Audit', icon: Moon },
        { id: 'reports-front-office', label: 'Reports', icon: BarChart3 }
      ]
    },
    {
      id: 'housekeeping',
      moduleKey: 'housekeeping',
      label: 'Housekeeping',
      icon: Sparkles,
      children: [
        { id: 'housekeeping-dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'housekeeping-status', label: 'Room Status', icon: BedDouble },
        { id: 'housekeeping-cleaning', label: 'Room Cleaning', icon: Sparkles },
        { id: 'amenities-master', label: 'Room Amenities', icon: Gift },
        { id: 'amenities-issuance', label: 'Amenity Issuance', icon: PackageIcon },
        { id: 'amenities-requests', label: 'Guest Requests', icon: Bell },
        { id: 'amenities-billing', label: 'Amenity Billing', icon: Receipt },
        { id: 'housekeeping-lost-found', label: 'Lost & Found', icon: Tag },
        { id: 'housekeeping-linen', label: 'Linen & Laundry', icon: PackageIcon },
        { id: 'housekeeping-staff', label: 'Staff & Shift Roster', icon: Users },
        { id: 'reports-housekeeping', label: 'Reports', icon: BarChart3 }
      ]
    },
    {
      id: 'restaurant',
      moduleKey: 'restaurant',
      label: 'Restaurant & Bar',
      icon: UtensilsCrossed,
      children: [
        { id: 'restaurant-pos', label: 'POS Terminal', icon: UtensilsCrossed },
        { id: 'restaurant-tables', label: 'Tables & Bar Counter', icon: Grid3X3 },
        { id: 'restaurant-orders', label: 'Orders Register', icon: ClipboardList },
        { id: 'restaurant-kot', label: 'Kitchen & Bar KOT', icon: ChefHat },
        { id: 'menu-catalog', label: 'Menu Catalog', icon: BookOpen },
        { id: 'menu-modifiers', label: 'Modifiers', icon: Layers },
        { id: 'restaurant-discounts', label: 'Discounts', icon: Percent },
        { id: 'restaurant-complimentary', label: 'Complimentary', icon: Gift },
        { id: 'restaurant-voids', label: 'Voids Audit', icon: Ban },
        { id: 'restaurant-settlements', label: 'Settlements', icon: CreditCard },
        { id: 'reports-restaurant', label: 'F&B & Bar Reports', icon: BarChart3 }
      ]
    },
    {
      id: 'banquet',
      moduleKey: 'banquet',
      label: 'Banquet & Convention',
      icon: Building2,
      children: [
        { id: 'convention-events', label: 'Events', icon: PartyPopper },
        { id: 'convention-calendar', label: 'Event Calendar', icon: CalendarCheck },
        { id: 'admin-halls', label: 'Hall Management', icon: Building2 },
        { id: 'convention-packages', label: 'Packages', icon: PackageIcon },
        { id: 'banquet-quotations', label: 'Guest Quotations', icon: FileText },
        { id: 'banquet-function-sheets', label: 'Function Sheets', icon: FileText },
        { id: 'banquet-billing', label: 'Event Billing', icon: Receipt },
        { id: 'banquet-deposits', label: 'Deposits', icon: DollarSign },
        { id: 'reports-banquet', label: 'Reports', icon: BarChart3 }
      ]
    },
    {
      id: 'activities',
      moduleKey: 'activities',
      label: 'Activities',
      icon: Palmtree,
      children: [
        { id: 'activities-master', label: 'Activity Master', icon: Palmtree },
        { id: 'activities-booking', label: 'Booking', icon: CalendarCheck },
        { id: 'activities-scheduling', label: 'Scheduling', icon: Clock },
        { id: 'activities-capacity', label: 'Capacity', icon: Users },
        { id: 'activities-billing', label: 'Activity Billing', icon: Receipt },
        { id: 'reports-activities', label: 'Reports', icon: BarChart3 }
      ]
    },
    {
      id: 'amenities',
      moduleKey: 'housekeeping',
      label: 'Room Amenities',
      icon: Gift,
      children: [
        { id: 'amenities-master', label: 'Amenity Master', icon: Gift },
        { id: 'amenities-issuance', label: 'Amenity Issuance', icon: PackageIcon },
        { id: 'amenities-requests', label: 'Guest Requests', icon: Bell },
        { id: 'amenities-billing', label: 'Amenity Billing', icon: Receipt },
        { id: 'reports-amenities', label: 'Reports', icon: BarChart3 }
      ]
    },
    {
      id: 'procurement',
      moduleKey: 'procurement',
      label: 'Procurement',
      icon: ShoppingCart,
      children: [
        { id: 'inventory-requisitions', label: 'Requisitions', icon: FileText },
        { id: 'inventory-purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
        { id: 'inventory-grn', label: 'Goods Received', icon: Truck },
        { id: 'procurement-bills', label: 'Purchase Bills', icon: Receipt },
        { id: 'procurement-payments', label: 'Supplier Payments', icon: DollarSign },
        { id: 'procurement-returns', label: 'Purchase Returns', icon: ArrowUpDown },
        { id: 'inventory-suppliers', label: 'Suppliers', icon: Users },
        { id: 'procurement-approvals', label: 'Approval Center', icon: CheckCircle2 },
        { id: 'reports-procurement', label: 'Reports', icon: BarChart3 }
      ]
    },
    {
      id: 'inventory',
      moduleKey: 'inventory',
      label: 'Inventory',
      icon: Boxes,
      children: [
        { id: 'inventory-dashboard', label: 'Inventory Dashboard', icon: LayoutDashboard },
        { id: 'inventory-items', label: 'Items', icon: PackageIcon },
        { id: 'inventory-categories', label: 'Categories', icon: Layers },
        { id: 'inventory-units', label: 'Units', icon: Tag },
        { id: 'inventory-stores', label: 'Stores', icon: Store },
        { id: 'inventory-stock-levels', label: 'Stock', icon: Boxes },
        { id: 'inventory-ledger', label: 'Stock Ledger', icon: Receipt },
        { id: 'inventory-transfers', label: 'Stock Transfer', icon: ArrowUpDown },
        { id: 'inventory-issue', label: 'Stock Issue', icon: Truck },
        { id: 'inventory-wastage', label: 'Wastage', icon: Trash2 },
        { id: 'inventory-physical-counts', label: 'Physical Count', icon: ClipboardList },
        { id: 'inventory-expiry', label: 'Expiry', icon: Clock },
        { id: 'reports-inventory', label: 'Reports', icon: BarChart3 }
      ]
    },
    {
      id: 'menu-management',
      moduleKey: 'menu-management',
      label: 'Menu Management',
      icon: ChefHat,
      children: [
        { id: 'menu-catalog', label: 'Menu Items', icon: BookOpen },
        { id: 'menu-categories', label: 'Categories', icon: Layers },
        { id: 'menu-recipes', label: 'Recipes', icon: ChefHat },
        { id: 'menu-ingredients', label: 'Ingredients', icon: PackageIcon },
        { id: 'menu-modifiers', label: 'Modifiers', icon: Layers },
        { id: 'menu-pricing', label: 'Pricing', icon: DollarSign },
        { id: 'menu-service-charge', label: 'Service Charge', icon: Percent },
        { id: 'menu-tax', label: 'Tax', icon: Scale },
        { id: 'menu-versions', label: 'Menu Versions', icon: Clock },
        { id: 'reports-menu', label: 'Reports', icon: BarChart3 }
      ]
    },
    {
      id: 'finance',
      moduleKey: 'finance',
      label: 'Finance & Accounts',
      icon: Landmark,
      children: [
        { id: 'finance-dashboard', label: 'Finance Dashboard', icon: LayoutDashboard },
        { id: 'finance-reconciliation', label: 'Reconciliation Center', icon: Scale },
        { id: 'accounting-city-ledger', label: 'Accounts Receivable', icon: Building2 },
        { id: 'finance-ap', label: 'Accounts Payable', icon: ShoppingCart },
        { id: 'finance-guest-ledger', label: 'Guest Ledger', icon: Receipt },
        { id: 'finance-supplier-ledger', label: 'Supplier Ledger', icon: Users },
        { id: 'finance-cash-bank', label: 'Cash & Bank', icon: DollarSign },
        { id: 'accounting-gl', label: 'General Ledger', icon: BookOpen },
        { id: 'accounting-jv', label: 'Journal Entries', icon: Scale },
        { id: 'accounting-chart', label: 'Chart of Accounts', icon: BookOpen },
        { id: 'accounting-mapping', label: 'Accounting Mapping', icon: Layers },
        { id: 'finance-mapping-test', label: 'Mapping Test Tool', icon: Sparkles },
        { id: 'finance-critical-tests', label: 'Critical Tests (8/8)', icon: ShieldCheck },
        { id: 'finance-taxes', label: 'Taxes & Levies', icon: Percent },
        { id: 'billing-payments', label: 'Payments', icon: CreditCard },
        { id: 'billing-invoices', label: 'Receipts', icon: FileText },
        { id: 'reports-finance', label: 'Financial & Ledger Reports', icon: BarChart3 }
      ]
    },
    {
      id: 'sales-marketing',
      moduleKey: 'sales-marketing',
      label: 'Sales & Marketing',
      icon: Briefcase,
      children: [
        { id: 'sales-corporate', label: 'Corporate Accounts', icon: Building2 },
        { id: 'sales-agents', label: 'Travel Agents', icon: Users },
        { id: 'sales-activities', label: 'Sales Activities', icon: CalendarCheck },
        { id: 'sales-leads', label: 'Leads', icon: Tag },
        { id: 'sales-contracts', label: 'Contracts', icon: FileText },
        { id: 'sales-promotions', label: 'Promotions', icon: Gift },
        { id: 'reports-sales', label: 'Reports', icon: BarChart3 }
      ]
    },
    {
      id: 'crm',
      moduleKey: 'crm',
      label: 'CRM',
      icon: HeartHandshake,
      children: [
        { id: 'guests', label: 'Guests', icon: Users },
        { id: 'crm-companies', label: 'Companies', icon: Building2 },
        { id: 'crm-vip', label: 'VIP', icon: Award },
        { id: 'crm-preferences', label: 'Preferences', icon: Sparkles },
        { id: 'crm-feedback', label: 'Feedback', icon: HeartHandshake },
        { id: 'reports-crm', label: 'Reports', icon: BarChart3 }
      ]
    },
    {
      id: 'hr',
      moduleKey: 'hr',
      label: 'Human Resources',
      icon: Users,
      children: [
        { id: 'hr-employees', label: 'Employees', icon: Users },
        { id: 'hr-departments', label: 'Departments', icon: Building2 },
        { id: 'hr-attendance', label: 'Attendance', icon: Clock },
        { id: 'hr-biometric', label: 'Biometric Devices', icon: Fingerprint },
        { id: 'hr-leave', label: 'Leave', icon: CalendarCheck },
        { id: 'reports-hr', label: 'Reports', icon: BarChart3 }
      ]
    },
    {
      id: 'administration',
      moduleKey: 'administration',
      label: 'Administration',
      icon: ShieldCheck,
      children: [
        { id: 'admin-master-hub', label: 'Master Operations Hub', icon: ShieldCheck },
        { id: 'admin-onboarding', label: 'Onboard New Property (Clean Slate)', icon: Rocket },
        { id: 'admin-menu-master', label: 'Menu & Sub-Menus Controller', icon: Sliders },
        { id: 'admin-department-items', label: 'Departmental Items Master', icon: PackageIcon },
        { id: 'admin-billing-options', label: 'Billing Options & Tenders', icon: CreditCard },
        { id: 'admin-rooms', label: 'Room Setup & Inventory (Rooms)', icon: BedDouble },
        { id: 'admin-room-types', label: 'Room Types & Tariffs (Creation & Pricing)', icon: Tag },
        { id: 'admin-floors', label: 'Floor Creation & Wings Setup', icon: Layers },
        { id: 'admin-halls', label: 'Convention Halls Setup', icon: Building2 },
        { id: 'admin-global-reports', label: 'Global Report Center & Audit Registry', icon: BarChart3 },
        { id: 'admin-users', label: 'Users', icon: Users },
        { id: 'admin-roles', label: 'Roles', icon: Shield },
        { id: 'admin-permissions', label: 'Permissions & Rules', icon: Sliders },
        { id: 'admin-departments', label: 'Departments', icon: Building2 },
        { id: 'admin-outlets', label: 'Outlets & Restaurants', icon: UtensilsCrossed },
        { id: 'admin-approvals', label: 'Approval Rules', icon: CheckCircle2 },
        { id: 'admin-mapping', label: 'Accounting & Ledger Mapping', icon: Layers },
        { id: 'admin-tax', label: 'Tax Configuration', icon: Percent },
        { id: 'admin-service-charge', label: 'Service Charge', icon: DollarSign },
        { id: 'admin-numbering', label: 'Numbering Schemes', icon: Tag },
        { id: 'admin-audit-rules', label: 'Night Audit Automation Schedule', icon: Clock },
        { id: 'settings', label: 'System Settings', icon: Settings },
        { id: 'admin-backup', label: 'Manual Backup & Restore', icon: Database },
        { id: 'admin-sql-console', label: 'Cloud SQL Console', icon: Terminal },
        { id: 'admin-audit', label: 'User Activity Logs', icon: History }
      ]
    }
  ];

  const isItemActive = (item: NavItem) => {
    if (currentRoute === item.id) return true;
    if (item.children?.some(c => c.id === currentRoute)) return true;

    // Comprehensive prefix & parent-child mapping so active module always highlights
    switch (item.id) {
      case 'dashboard':
        return currentRoute === 'dashboard';
      case 'front-office':
        return (
          currentRoute.startsWith('front-') ||
          currentRoute.startsWith('reservation') ||
          currentRoute.startsWith('billing-') ||
          currentRoute.startsWith('room-') ||
          currentRoute === 'guests' ||
          currentRoute === 'night-audit' ||
          currentRoute === 'night-audit-run' ||
          currentRoute === 'reports-front-office'
        );
      case 'housekeeping':
        return (
          currentRoute.startsWith('housekeeping') ||
          currentRoute.startsWith('amenities-') ||
          currentRoute === 'reports-housekeeping'
        );
      case 'restaurant':
      case 'bar':
        return (
          currentRoute.startsWith('restaurant') ||
          currentRoute === 'reports-restaurant' ||
          currentRoute.startsWith('bar') ||
          currentRoute === 'reports-bar'
        );
      case 'banquet':
        return (
          currentRoute.startsWith('convention') ||
          currentRoute.startsWith('banquet') ||
          currentRoute === 'halls' ||
          currentRoute === 'events' ||
          currentRoute === 'reports-banquet'
        );
      case 'activities':
        return (
          currentRoute.startsWith('activities') ||
          currentRoute.startsWith('recreation') ||
          currentRoute === 'reports-activities'
        );
      case 'amenities':
        return currentRoute === 'amenities' || currentRoute === 'reports-amenities';
      case 'procurement':
        return currentRoute.startsWith('procurement') || currentRoute === 'reports-procurement';
      case 'inventory':
        return currentRoute.startsWith('inventory') || currentRoute === 'reports-inventory';
      case 'menu-management':
        return currentRoute.startsWith('menu') || currentRoute === 'reports-menu';
      case 'finance':
        return (
          currentRoute.startsWith('finance') ||
          currentRoute.startsWith('accounting') ||
          currentRoute === 'reports-finance'
        );
      case 'sales-marketing':
        return currentRoute.startsWith('sales') || currentRoute === 'reports-sales';
      case 'crm':
        return currentRoute.startsWith('crm') || currentRoute === 'reports-crm';
      case 'hr':
        return (
          currentRoute.startsWith('hr') ||
          currentRoute === 'human-resources' ||
          currentRoute === 'reports-hr'
        );
      case 'administration':
        return (
          currentRoute.startsWith('admin') ||
          currentRoute === 'settings' ||
          currentRoute === 'administration' ||
          currentRoute === 'reports-admin'
        );
      default:
        return currentRoute.startsWith(item.id);
    }
  };

  // Filter nav items by RBAC allowed modules & merge custom sub-menus from adminMasterService
  const masterNavModules = adminMasterService.getNavModules();
  const isSuperAdmin = rbacService.isSuperAdmin(activeUser);

  const allowedNavItems = navItems
    .filter(item => {
      // Super Administrator has 100% full access to all PMS modules without exception
      if (isSuperAdmin) return true;
      const masterMod = masterNavModules.find(m => m.id === item.id || m.moduleKey === item.moduleKey);
      if (masterMod && !masterMod.enabled) return false;
      return rbacService.isModuleAllowed(item.moduleKey, activeUser);
    })
    .map(item => {
      const masterMod = masterNavModules.find(m => m.id === item.id || m.moduleKey === item.moduleKey);
      if (!masterMod) return item;

      // Filter children according to master sub-menu settings
      let mergedChildren = [...(item.children || [])];

      // Add any custom sub-menus created by admin
      masterMod.children.forEach(sub => {
        if (!mergedChildren.some(c => c.id === sub.id)) {
          mergedChildren.push({
            id: sub.id,
            label: sub.label,
            icon: ShieldCheck
          });
        }
      });

      // Filter out disabled sub-menus ONLY for non-super-admin users
      if (!isSuperAdmin) {
        mergedChildren = mergedChildren.filter(c => {
          const subDef = masterMod.children.find(s => s.id === c.id);
          return subDef ? subDef.enabled : true;
        });
      }

      return {
        ...item,
        children: mergedChildren
      };
    });

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-gray-900/80 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#0F172A] text-slate-100 border-r border-slate-800 transition-all duration-200 flex flex-col ${
          collapsed ? 'w-16' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Brand & Resort Title */}
        <div className="p-3 border-b border-slate-800">
          {!collapsed ? (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <h1 className="text-lg font-bold tracking-tight text-amber-400 font-mono">
                      LESync <span className="text-white">PMS</span>
                    </h1>
                  </div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 mt-0.5 font-semibold">
                    LE Innova Automations
                  </p>
                </div>

                {/* Top Collapse Button in expanded mode */}
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition-colors cursor-pointer group"
                  title="Collapse sidebar (Ctrl+B)"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="w-4 h-4 group-hover:text-amber-400 transition-colors" />
                </button>
              </div>

              {/* Dynamic Licensed Property */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center space-x-2">
                {pmsSettings?.logoUrl ? (
                  <img
                    src={pmsSettings.logoUrl}
                    alt={pmsSettings.resortName}
                    className="w-5 h-5 rounded object-contain shrink-0 bg-white/10 p-0.5 border border-slate-700/60"
                  />
                ) : (
                  <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 border border-amber-500/30">
                    {(pmsSettings?.resortName || 'P').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="truncate text-left flex-1 min-w-0">
                  <div className="text-xs text-slate-200 font-medium truncate" title={pmsSettings?.resortName}>
                    {pmsSettings?.resortName || 'Licensed Property'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {/* Clickable Brand Logo with Extend indicator */}
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 flex items-center justify-center font-black text-slate-950 text-sm shadow-md shadow-amber-500/30 transition-all hover:scale-105 cursor-pointer relative group"
                title="Click to Open / Extend Sidebar (Ctrl+B)"
                aria-label="Click to Open / Extend Sidebar"
              >
                <span>LE</span>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-950 border border-amber-400 flex items-center justify-center text-amber-300 shadow-xs group-hover:scale-110 transition-transform">
                  <ChevronsRight className="w-2.5 h-2.5" />
                </span>
              </button>

              {/* Dedicated Extend / Open Sidebar Button */}
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-full py-1 px-1 rounded-lg bg-slate-800/90 hover:bg-amber-500 text-slate-300 hover:text-slate-950 border border-slate-700/80 hover:border-amber-400 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer group shadow-2xs"
                title="Extend / Open Full Sidebar (Ctrl+B)"
                aria-label="Extend Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4 text-amber-400 group-hover:text-slate-950 transition-colors" />
                <span className="text-[8px] font-bold uppercase tracking-wider group-hover:text-slate-950">OPEN</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5 text-xs scrollbar-thin">
          {allowedNavItems.map(item => {
            const Icon = item.icon;
            const hasChildren = !!item.children && item.children.length > 0;
            const active = isItemActive(item);
            const isOpen = openSections[item.id];

            if (collapsed) {
              return (
                <div
                  key={item.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (hasChildren && item.children && item.children.length > 0) {
                        const activeChild = item.children.find(c => c.id === currentRoute);
                        onNavigate(activeChild ? activeChild.id : item.children[0].id);
                        onCloseMobile();
                      } else {
                        onNavigate(item.id);
                        onCloseMobile();
                      }
                    }}
                    className={`relative w-full h-10 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer ${
                      active
                        ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30 ring-2 ring-amber-300'
                        : 'bg-slate-800/60 hover:bg-slate-700 text-slate-200 hover:text-amber-300 border border-slate-700/70 hover:border-amber-400/50 shadow-2xs'
                    }`}
                    title={`${item.label}${hasChildren ? ` (${item.children.length} sub-modules)` : ''}`}
                    aria-label={item.label}
                  >
                    {/* Active Indicator Bar on Left */}
                    {active && (
                      <span className="absolute -left-1 top-2 bottom-2 w-1 bg-amber-300 rounded-r shadow-xs"></span>
                    )}

                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${
                      active
                        ? 'text-slate-950 stroke-[2.4]'
                        : 'text-slate-200 group-hover:text-amber-400 group-hover:scale-110'
                    }`} />

                    {/* Badge Dot */}
                    {item.badge && !active && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 border border-[#0F172A] animate-pulse"></span>
                    )}
                  </button>

                  {/* Collapsed Flyout Popover Menu */}
                  {hoveredItemId === item.id && (
                    <div
                      className="absolute left-full top-0 ml-2 w-64 bg-[#0F172A] border border-slate-700/90 rounded-xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 pointer-events-auto"
                      onMouseEnter={() => setHoveredItemId(item.id)}
                      onMouseLeave={() => setHoveredItemId(null)}
                    >
                      {/* Flyout Header */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                        <div className="flex items-center space-x-2 min-w-0">
                          <div className={`p-1.5 rounded-lg ${active ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate">{item.label}</span>
                            <span className="text-[10px] text-slate-400">
                              {hasChildren ? `${item.children?.length} Sub-modules` : 'Primary View'}
                            </span>
                          </div>
                        </div>
                        {item.badge && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Sub-menu items */}
                      {hasChildren ? (
                        <div className="space-y-1 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                          {item.children?.map(sub => {
                            const SubIcon = sub.icon || Icon;
                            const subActive = currentRoute === sub.id;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => {
                                  onNavigate(sub.id);
                                  setHoveredItemId(null);
                                  onCloseMobile();
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                                  subActive
                                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-800/90'
                                }`}
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <SubIcon className={`w-3.5 h-3.5 shrink-0 ${subActive ? 'text-slate-950' : 'text-slate-400'}`} />
                                  <span className="truncate">{sub.label}</span>
                                </div>
                                {subActive && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onNavigate(item.id);
                            setHoveredItemId(null);
                            onCloseMobile();
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-between cursor-pointer"
                        >
                          <span>Open {item.label}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Quick Extend Sidebar Action at Flyout Bottom */}
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            onToggleCollapse();
                            setHoveredItemId(null);
                          }}
                          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 hover:underline cursor-pointer"
                        >
                          <PanelLeftOpen className="w-3.5 h-3.5" />
                          <span>Extend Full Sidebar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Expanded Mode
            if (hasChildren) {
              return (
                <div key={item.id} className="space-y-0.5">
                  <button
                    onClick={() => toggleSection(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'text-white bg-slate-800/90 font-bold border border-slate-700/60 shadow-2xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {item.badge && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-slate-800 ml-3">
                      {item.children?.map(sub => {
                        const SubIcon = sub.icon || Icon;
                        const subActive = currentRoute === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              onNavigate(sub.id);
                              onCloseMobile();
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-md flex items-center space-x-2 text-[11px] transition-colors cursor-pointer ${
                              subActive
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                            }`}
                          >
                            <SubIcon className="w-3 h-3 opacity-80" />
                            <span className="truncate">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-xs font-semibold cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-slate-950 stroke-[2.2]' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Account & Department Footer - Synced with Header */}
        <div className="p-3 border-t border-slate-800 bg-[#0B0F17] relative">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowUserMenu(prev => !prev)}
                className="flex items-center gap-2.5 min-w-0 text-left p-1 -m-1 rounded-lg hover:bg-slate-800/60 transition-colors flex-1 group cursor-pointer"
                title="View Staff Profile & Account"
              >
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-xs text-amber-300 group-hover:border-amber-400 transition-colors">
                    {activeUser.name ? activeUser.name.charAt(0) : 'U'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#0B0F17]" title="Active"></span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                      {activeUser.name}
                    </p>
                    {isSuperAdmin && (
                      <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono font-bold border border-amber-500/40 shrink-0">
                        ALL MENUS
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-amber-400 font-semibold truncate">
                    {activeUser.roleName}
                  </p>
                  <span className="text-[9px] text-slate-400 truncate block">
                    {activeUser.department}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 shrink-0 ml-1 transition-colors cursor-pointer"
                title="Collapse sidebar (Ctrl+B)"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-full py-1.5 flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-amber-500 text-slate-300 hover:text-slate-950 border border-slate-700/80 hover:border-amber-400 transition-all cursor-pointer group shadow-2xs"
                title="Extend / Open Full Sidebar (Ctrl+B)"
                aria-label="Extend Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4 text-amber-400 group-hover:text-slate-950 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => setShowUserMenu(prev => !prev)}
                className="w-full flex items-center justify-center py-1 group cursor-pointer"
                title={`${activeUser.name} (${activeUser.roleName}) - Click for Account`}
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-xs text-amber-300 group-hover:border-amber-400 transition-colors">
                    {activeUser.name ? activeUser.name.charAt(0) : 'U'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#0B0F17]" title="Active"></span>
                </div>
              </button>
            </div>
          )}

          <UserAccountDropdown
            isOpen={showUserMenu}
            onClose={() => setShowUserMenu(false)}
            onNavigate={onNavigate}
            position="sidebar"
            activeUser={activeUser}
          />
        </div>
      </aside>
    </>
  );
};
