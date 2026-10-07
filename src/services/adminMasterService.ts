// CCULB / LESync PMS - Admin Master Operations Service
// "Superman" Super Admin Engine for full CRUD control over:
// 1. All Menus & Sub-menus
// 2. Departments & Outlets
// 3. Departmental Items (Housekeeping, Bar, Restaurant, Activities, Room Amenities)
// 4. Billing Options & Payment Tenders
// 5. Taxes & Surcharge Rules

import { rbacService } from './rbacService';
import { pmsService } from './pmsService';
import { housekeepingService } from './housekeepingService';
import { inventoryMenuService } from './inventoryMenuService';
import { supabaseSyncService } from './supabaseSyncService';
import { DepartmentDef, OutletDef } from '../types/reportingAndRbac';
import { ActivityItem } from '../types/pms';
import { HousekeepingAmenity } from '../types/housekeeping';

// ---------------------------------------------------------------------------
// 1. Navigation Menus & Sub-Menus Types
// ---------------------------------------------------------------------------
export interface SubMenuItemDef {
  id: string;
  label: string;
  iconName: string;
  badge?: string;
  badgeColor?: string;
  enabled: boolean;
  order: number;
  isCustom?: boolean;
  targetRoute?: string;
  description?: string;
}

export interface NavModuleDef {
  id: string;
  moduleKey: string;
  label: string;
  iconName: string;
  badge?: string;
  badgeColor?: string;
  enabled: boolean;
  order: number;
  isCustom?: boolean;
  children: SubMenuItemDef[];
}

// ---------------------------------------------------------------------------
// 2. Billing Options & Payment Methods Types
// ---------------------------------------------------------------------------
export type BillingMethodCategory = 'Cash' | 'Credit Card' | 'Mobile Financial Services (MFS)' | 'Bank Transfer / Wire' | 'Direct Billing (City Ledger)' | 'Internal Folio / Voucher';

export interface BillingOptionDef {
  id: string;
  code: string;
  name: string;
  category: BillingMethodCategory;
  surchargePercent: number; // e.g. 1.5% for credit card
  taxRatePercent: number; // e.g. 0% or 15%
  applicableOutlets: string[]; // e.g. ['Front Desk', 'Restaurant', 'Bar', 'Banquet', 'Activities', 'Room Amenities']
  defaultGLAccountCode: string; // e.g. '1010' or '1020'
  iconName: string;
  active: boolean;
  description: string;
  requiresAuthCode: boolean;
  allowRefund: boolean;
  settlementTermsDays?: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 3. Departmental Items Types (Bar, Restaurant, Housekeeping, Activities, Amenities)
// ---------------------------------------------------------------------------
export type DepartmentItemType = 'housekeeping' | 'bar' | 'restaurant' | 'activity' | 'amenity';

export interface GenericDepartmentItem {
  id: string;
  departmentType: DepartmentItemType;
  sku: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  active: boolean;
  // Specific extensions:
  abvPercent?: number; // Bar
  portionSize?: string; // Bar / Restaurant
  kitchenStation?: string; // Restaurant / Bar
  prepTimeMinutes?: number; // Restaurant
  dietaryTags?: string[]; // Restaurant ('Halal', 'Vegetarian', 'Chef Special', etc.)
  pricingType?: string; // Activity (e.g. 'Per Person', 'Per Hour', 'Day Pass', etc.)
  durationMinutes?: number; // Activity
  maxCapacity?: number; // Activity
  instructorRequired?: boolean; // Activity
  facilityLocation?: string; // Activity
  isChargeable?: boolean; // Amenity / Housekeeping
  inStock?: number; // Amenity / Housekeeping / Bar
  reorderLevel?: number; // Amenity / Housekeeping / Bar
  defaultRoomAllotment?: number; // Housekeeping
  serviceChargePercent?: number;
  taxPercent?: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// INITIAL SYSTEM DEFAULT NAVIGATION (Baseline)
// ---------------------------------------------------------------------------
const DEFAULT_MODULES: NavModuleDef[] = [
  {
    id: 'dashboard',
    moduleKey: 'dashboard',
    label: 'Dashboard',
    iconName: 'LayoutDashboard',
    enabled: true,
    order: 1,
    children: []
  },
  {
    id: 'front-office',
    moduleKey: 'front-office',
    label: 'Front Office',
    iconName: 'ConciergeBell',
    badge: 'Live',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    enabled: true,
    order: 2,
    children: [
      { id: 'front-desk', label: 'Front Desk Operations', iconName: 'ConciergeBell', enabled: true, order: 1 },
      { id: 'reservations', label: 'Reservations', iconName: 'CalendarDays', enabled: true, order: 2 },
      { id: 'reservation-calendar', label: 'Room Calendar', iconName: 'CalendarRange', enabled: true, order: 3 },
      { id: 'room-assignment', label: 'Room Assignment', iconName: 'Grid3X3', enabled: true, order: 4 },
      { id: 'guests', label: 'Guest Profiles', iconName: 'Users', enabled: true, order: 5 },
      { id: 'billing-folios', label: 'Guest Folio', iconName: 'Receipt', enabled: true, order: 6 },
      { id: 'front-desk-checkin', label: 'Check-In', iconName: 'UserCheck', enabled: true, order: 7 },
      { id: 'front-desk-checkout', label: 'Check-Out', iconName: 'ArrowRight', enabled: true, order: 8 },
      { id: 'room-status', label: 'Room Status', iconName: 'Layers', enabled: true, order: 9 },
      { id: 'room-move', label: 'Room Move', iconName: 'ArrowUpDown', enabled: true, order: 10 },
      { id: 'front-office-wakeup', label: 'Wake-Up Calls', iconName: 'Clock', enabled: true, order: 11 },
      { id: 'night-audit', label: 'Night Audit', iconName: 'Moon', enabled: true, order: 12 },
      { id: 'reports-front-office', label: 'Reports', iconName: 'BarChart3', enabled: true, order: 13 }
    ]
  },
  {
    id: 'housekeeping',
    moduleKey: 'housekeeping',
    label: 'Housekeeping',
    iconName: 'Sparkles',
    enabled: true,
    order: 3,
    children: [
      { id: 'housekeeping-dashboard', label: 'Dashboard', iconName: 'LayoutDashboard', enabled: true, order: 1 },
      { id: 'housekeeping-status', label: 'Room Status', iconName: 'BedDouble', enabled: true, order: 2 },
      { id: 'housekeeping-cleaning', label: 'Room Cleaning', iconName: 'Sparkles', enabled: true, order: 3 },
      { id: 'amenities-master', label: 'Room Amenities', iconName: 'Gift', enabled: true, order: 4 },
      { id: 'amenities-issuance', label: 'Amenity Issuance', iconName: 'PackageIcon', enabled: true, order: 5 },
      { id: 'amenities-requests', label: 'Guest Requests', iconName: 'Bell', enabled: true, order: 6 },
      { id: 'amenities-billing', label: 'Amenity Billing', iconName: 'Receipt', enabled: true, order: 7 },
      { id: 'housekeeping-lost-found', label: 'Lost & Found', iconName: 'Tag', enabled: true, order: 8 },
      { id: 'housekeeping-linen', label: 'Linen & Laundry', iconName: 'PackageIcon', enabled: true, order: 9 },
      { id: 'housekeeping-staff', label: 'Staff & Shift Roster', iconName: 'Users', enabled: true, order: 10 },
      { id: 'reports-housekeeping', label: 'Reports', iconName: 'BarChart3', enabled: true, order: 11 }
    ]
  },
  {
    id: 'restaurant',
    moduleKey: 'restaurant',
    label: 'Restaurant & Bar',
    iconName: 'UtensilsCrossed',
    enabled: true,
    order: 4,
    children: [
      { id: 'restaurant-pos', label: 'POS Terminal', iconName: 'UtensilsCrossed', enabled: true, order: 1 },
      { id: 'restaurant-tables', label: 'Tables & Counter', iconName: 'Grid3X3', enabled: true, order: 2 },
      { id: 'restaurant-orders', label: 'Orders Register', iconName: 'ClipboardList', enabled: true, order: 3 },
      { id: 'restaurant-kot', label: 'Kitchen & Bar KOT', iconName: 'ChefHat', enabled: true, order: 4 },
      { id: 'menu-catalog', label: 'Menu Catalog', iconName: 'BookOpen', enabled: true, order: 5 },
      { id: 'menu-modifiers', label: 'Modifiers & Notes', iconName: 'Layers', enabled: true, order: 6 },
      { id: 'restaurant-discounts', label: 'Discounts & Promos', iconName: 'Percent', enabled: true, order: 7 },
      { id: 'restaurant-complimentary', label: 'Complimentary (NC)', iconName: 'Gift', enabled: true, order: 8 },
      { id: 'restaurant-voids', label: 'Voids Audit', iconName: 'Ban', enabled: true, order: 9 },
      { id: 'restaurant-settlements', label: 'Settlements', iconName: 'CreditCard', enabled: true, order: 10 },
      { id: 'reports-restaurant', label: 'F&B Reports', iconName: 'BarChart3', enabled: true, order: 11 }
    ]
  },
  {
    id: 'banquet',
    moduleKey: 'banquet',
    label: 'Banquet & Convention',
    iconName: 'Building2',
    enabled: true,
    order: 5,
    children: [
      { id: 'convention-events', label: 'Events', iconName: 'PartyPopper', enabled: true, order: 1 },
      { id: 'convention-calendar', label: 'Event Calendar', iconName: 'CalendarCheck', enabled: true, order: 2 },
      { id: 'admin-halls', label: 'Hall Management', iconName: 'Building2', enabled: true, order: 3 },
      { id: 'convention-packages', label: 'Packages', iconName: 'PackageIcon', enabled: true, order: 4 },
      { id: 'banquet-function-sheets', label: 'Function Sheets', iconName: 'FileText', enabled: true, order: 5 },
      { id: 'banquet-billing', label: 'Event Billing', iconName: 'Receipt', enabled: true, order: 6 },
      { id: 'banquet-deposits', label: 'Deposits', iconName: 'DollarSign', enabled: true, order: 7 },
      { id: 'reports-banquet', label: 'Reports', iconName: 'BarChart3', enabled: true, order: 8 }
    ]
  },
  {
    id: 'activities',
    moduleKey: 'activities',
    label: 'Activities',
    iconName: 'Palmtree',
    enabled: true,
    order: 6,
    children: [
      { id: 'activities-master', label: 'Activity Master', iconName: 'Palmtree', enabled: true, order: 1 },
      { id: 'activities-booking', label: 'Booking', iconName: 'CalendarCheck', enabled: true, order: 2 },
      { id: 'activities-scheduling', label: 'Scheduling', iconName: 'Clock', enabled: true, order: 3 },
      { id: 'activities-capacity', label: 'Capacity', iconName: 'Users', enabled: true, order: 4 },
      { id: 'activities-billing', label: 'Activity Billing', iconName: 'Receipt', enabled: true, order: 5 },
      { id: 'reports-activities', label: 'Reports', iconName: 'BarChart3', enabled: true, order: 6 }
    ]
  },
  {
    id: 'amenities',
    moduleKey: 'housekeeping',
    label: 'Room Amenities',
    iconName: 'Gift',
    enabled: true,
    order: 7,
    children: [
      { id: 'amenities-master', label: 'Amenity Master', iconName: 'Gift', enabled: true, order: 1 },
      { id: 'amenities-issuance', label: 'Amenity Issuance', iconName: 'PackageIcon', enabled: true, order: 2 },
      { id: 'amenities-requests', label: 'Guest Requests', iconName: 'Bell', enabled: true, order: 3 },
      { id: 'amenities-billing', label: 'Amenity Billing', iconName: 'Receipt', enabled: true, order: 4 },
      { id: 'reports-amenities', label: 'Reports', iconName: 'BarChart3', enabled: true, order: 5 }
    ]
  },
  {
    id: 'procurement',
    moduleKey: 'procurement',
    label: 'Procurement',
    iconName: 'ShoppingCart',
    enabled: true,
    order: 8,
    children: [
      { id: 'inventory-requisitions', label: 'Requisitions', iconName: 'FileText', enabled: true, order: 1 },
      { id: 'inventory-purchase-orders', label: 'Purchase Orders', iconName: 'ShoppingCart', enabled: true, order: 2 },
      { id: 'inventory-grn', label: 'Goods Received', iconName: 'Truck', enabled: true, order: 3 },
      { id: 'procurement-bills', label: 'Purchase Bills', iconName: 'Receipt', enabled: true, order: 4 },
      { id: 'procurement-payments', label: 'Supplier Payments', iconName: 'DollarSign', enabled: true, order: 5 },
      { id: 'procurement-returns', label: 'Purchase Returns', iconName: 'ArrowUpDown', enabled: true, order: 6 },
      { id: 'inventory-suppliers', label: 'Suppliers', iconName: 'Users', enabled: true, order: 7 },
      { id: 'procurement-approvals', label: 'Approval Center', iconName: 'CheckCircle2', enabled: true, order: 8 },
      { id: 'reports-procurement', label: 'Reports', iconName: 'BarChart3', enabled: true, order: 9 }
    ]
  },
  {
    id: 'inventory',
    moduleKey: 'inventory',
    label: 'Inventory',
    iconName: 'Boxes',
    enabled: true,
    order: 9,
    children: [
      { id: 'inventory-dashboard', label: 'Inventory Dashboard', iconName: 'LayoutDashboard', enabled: true, order: 1 },
      { id: 'inventory-items', label: 'Items', iconName: 'PackageIcon', enabled: true, order: 2 },
      { id: 'inventory-categories', label: 'Categories', iconName: 'Layers', enabled: true, order: 3 },
      { id: 'inventory-units', label: 'Units', iconName: 'Tag', enabled: true, order: 4 },
      { id: 'inventory-stores', label: 'Stores', iconName: 'Store', enabled: true, order: 5 },
      { id: 'inventory-stock-levels', label: 'Stock', iconName: 'Boxes', enabled: true, order: 6 },
      { id: 'inventory-ledger', label: 'Stock Ledger', iconName: 'Receipt', enabled: true, order: 7 },
      { id: 'inventory-transfers', label: 'Stock Transfer', iconName: 'ArrowUpDown', enabled: true, order: 8 },
      { id: 'inventory-issue', label: 'Stock Issue', iconName: 'Truck', enabled: true, order: 9 },
      { id: 'inventory-wastage', label: 'Wastage', iconName: 'Trash2', enabled: true, order: 10 },
      { id: 'inventory-physical-counts', label: 'Physical Count', iconName: 'ClipboardList', enabled: true, order: 11 },
      { id: 'inventory-expiry', label: 'Expiry', iconName: 'Clock', enabled: true, order: 12 },
      { id: 'reports-inventory', label: 'Reports', iconName: 'BarChart3', enabled: true, order: 13 }
    ]
  },
  {
    id: 'finance',
    moduleKey: 'finance',
    label: 'Finance & Accounts',
    iconName: 'DollarSign',
    enabled: true,
    order: 10,
    children: [
      { id: 'finance-dashboard', label: 'Finance Dashboard', iconName: 'LayoutDashboard', enabled: true, order: 1 },
      { id: 'finance-reconciliation', label: 'Folio Reconciliation', iconName: 'CheckCircle2', enabled: true, order: 2 },
      { id: 'accounting-city-ledger', label: 'Accounts Receivable (AR)', iconName: 'Building2', enabled: true, order: 3 },
      { id: 'finance-ap', label: 'Accounts Payable (AP)', iconName: 'Receipt', enabled: true, order: 4 },
      { id: 'finance-guest-ledger', label: 'Guest Ledger', iconName: 'Receipt', enabled: true, order: 5 },
      { id: 'finance-supplier-ledger', label: 'Supplier Ledger', iconName: 'Users', enabled: true, order: 6 },
      { id: 'finance-cash-bank', label: 'Cash & Bank', iconName: 'DollarSign', enabled: true, order: 7 },
      { id: 'accounting-gl', label: 'General Ledger', iconName: 'BookOpen', enabled: true, order: 8 },
      { id: 'accounting-jv', label: 'Journal Entries', iconName: 'Scale', enabled: true, order: 9 },
      { id: 'accounting-chart', label: 'Chart of Accounts', iconName: 'BookOpen', enabled: true, order: 10 },
      { id: 'accounting-mapping', label: 'Accounting Mapping', iconName: 'Layers', enabled: true, order: 11 },
      { id: 'finance-mapping-test', label: 'Mapping Test Tool', iconName: 'Sparkles', enabled: true, order: 12 },
      { id: 'finance-critical-tests', label: 'Critical Tests (8/8)', iconName: 'ShieldCheck', enabled: true, order: 13 },
      { id: 'finance-taxes', label: 'Taxes & Levies', iconName: 'Percent', enabled: true, order: 14 },
      { id: 'billing-payments', label: 'Payments', iconName: 'CreditCard', enabled: true, order: 15 },
      { id: 'billing-invoices', label: 'Receipts', iconName: 'FileText', enabled: true, order: 16 },
      { id: 'reports-finance', label: 'Financial & Ledger Reports', iconName: 'BarChart3', enabled: true, order: 17 }
    ]
  },
  {
    id: 'sales-marketing',
    moduleKey: 'sales-marketing',
    label: 'Sales & Marketing',
    iconName: 'Briefcase',
    enabled: true,
    order: 11,
    children: [
      { id: 'sales-corporate', label: 'Corporate Accounts', iconName: 'Building2', enabled: true, order: 1 },
      { id: 'sales-agents', label: 'Travel Agents', iconName: 'Users', enabled: true, order: 2 },
      { id: 'sales-activities', label: 'Sales Activities', iconName: 'CalendarCheck', enabled: true, order: 3 },
      { id: 'sales-leads', label: 'Leads', iconName: 'Tag', enabled: true, order: 4 },
      { id: 'sales-contracts', label: 'Contracts', iconName: 'FileText', enabled: true, order: 5 },
      { id: 'sales-promotions', label: 'Promotions', iconName: 'Gift', enabled: true, order: 6 },
      { id: 'reports-sales', label: 'Reports', iconName: 'BarChart3', enabled: true, order: 7 }
    ]
  },
  {
    id: 'crm',
    moduleKey: 'crm',
    label: 'CRM',
    iconName: 'HeartHandshake',
    enabled: true,
    order: 12,
    children: [
      { id: 'guests', label: 'Guests', iconName: 'Users', enabled: true, order: 1 },
      { id: 'crm-companies', label: 'Companies', iconName: 'Building2', enabled: true, order: 2 },
      { id: 'crm-vip', label: 'VIP', iconName: 'Award', enabled: true, order: 3 },
      { id: 'crm-preferences', label: 'Preferences', iconName: 'Sparkles', enabled: true, order: 4 },
      { id: 'crm-feedback', label: 'Feedback', iconName: 'HeartHandshake', enabled: true, order: 5 },
      { id: 'reports-crm', label: 'Reports', iconName: 'BarChart3', enabled: true, order: 6 }
    ]
  },
  {
    id: 'hr',
    moduleKey: 'hr',
    label: 'Human Resources',
    iconName: 'Users',
    enabled: true,
    order: 13,
    children: [
      { id: 'hr-employees', label: 'Employees', iconName: 'Users', enabled: true, order: 1 },
      { id: 'hr-departments', label: 'Departments', iconName: 'Building2', enabled: true, order: 2 },
      { id: 'hr-attendance', label: 'Attendance', iconName: 'Clock', enabled: true, order: 3 },
      { id: 'hr-leave', label: 'Leave', iconName: 'CalendarCheck', enabled: true, order: 4 },
      { id: 'reports-hr', label: 'Reports', iconName: 'BarChart3', enabled: true, order: 5 }
    ]
  },
  {
    id: 'administration',
    moduleKey: 'administration',
    label: 'Administration',
    iconName: 'ShieldCheck',
    badge: 'Super Admin',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    enabled: true,
    order: 14,
    children: [
      { id: 'admin-master-hub', label: 'Master Operations Hub', iconName: 'ShieldCheck', badge: 'Full CRUD', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30', enabled: true, order: 0 },
      { id: 'admin-menu-master', label: 'Menu & Sub-Menus Controller', iconName: 'Sliders', enabled: true, order: 1 },
      { id: 'admin-department-items', label: 'Departmental Items Master (All)', iconName: 'Package', enabled: true, order: 2 },
      { id: 'admin-billing-options', label: 'Billing Options & Tenders Master', iconName: 'CreditCard', enabled: true, order: 3 },
      { id: 'admin-departments', label: 'Departments & Outlets Master', iconName: 'Building2', enabled: true, order: 4 },
      { id: 'admin-rooms', label: 'Room Setup & Inventory (Add Rooms)', iconName: 'BedDouble', enabled: true, order: 5 },
      { id: 'admin-global-reports', label: 'Global Report Center & Audit Registry', iconName: 'BarChart3', enabled: true, order: 6 },
      { id: 'admin-users', label: 'Users', iconName: 'Users', enabled: true, order: 7 },
      { id: 'admin-roles', label: 'Roles', iconName: 'Shield', enabled: true, order: 8 },
      { id: 'admin-permissions', label: 'Permissions & Rules', iconName: 'Sliders', enabled: true, order: 9 },
      { id: 'admin-outlets', label: 'Outlets & Restaurants', iconName: 'UtensilsCrossed', enabled: true, order: 10 },
      { id: 'admin-approvals', label: 'Approval Rules', iconName: 'CheckCircle2', enabled: true, order: 11 },
      { id: 'admin-mapping', label: 'Accounting & Ledger Mapping', iconName: 'Layers', enabled: true, order: 12 },
      { id: 'admin-tax', label: 'Tax Configuration', iconName: 'Percent', enabled: true, order: 13 },
      { id: 'admin-service-charge', label: 'Service Charge', iconName: 'DollarSign', enabled: true, order: 14 },
      { id: 'admin-numbering', label: 'Numbering Schemes', iconName: 'Tag', enabled: true, order: 15 },
      { id: 'settings', label: 'System Settings', iconName: 'Settings', enabled: true, order: 16 },
      { id: 'admin-backup', label: 'Manual Backup & Restore', iconName: 'Database', enabled: true, order: 17 },
      { id: 'admin-audit', label: 'User Activity Logs', iconName: 'History', enabled: true, order: 18 },
      { id: 'admin-error-finder', label: 'User Error Finder & Diagnostics', iconName: 'AlertOctagon', enabled: true, order: 19 }
    ]
  }
];

// ---------------------------------------------------------------------------
// INITIAL DEFAULT BILLING OPTIONS
// ---------------------------------------------------------------------------
const DEFAULT_BILLING_OPTIONS: BillingOptionDef[] = [
  {
    id: 'bill-opt-1',
    code: 'CASH',
    name: 'Cash Currency (BDT)',
    category: 'Cash',
    surchargePercent: 0,
    taxRatePercent: 0,
    applicableOutlets: ['Front Desk', 'Restaurant', 'Bar', 'Banquet', 'Activities', 'Room Amenities'],
    defaultGLAccountCode: '1010',
    iconName: 'DollarSign',
    active: true,
    description: 'Physical cash received in desk counter cash drawer',
    requiresAuthCode: false,
    allowRefund: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'bill-opt-2',
    code: 'VISA_MC',
    name: 'Visa / MasterCard',
    category: 'Credit Card',
    surchargePercent: 1.5,
    taxRatePercent: 0,
    applicableOutlets: ['Front Desk', 'Restaurant', 'Bar', 'Banquet', 'Activities'],
    defaultGLAccountCode: '1020',
    iconName: 'CreditCard',
    active: true,
    description: 'Chip & Pin / NFC card swipe terminal transaction',
    requiresAuthCode: true,
    allowRefund: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'bill-opt-3',
    code: 'AMEX',
    name: 'American Express (AMEX)',
    category: 'Credit Card',
    surchargePercent: 2.25,
    taxRatePercent: 0,
    applicableOutlets: ['Front Desk', 'Restaurant', 'Bar', 'Banquet'],
    defaultGLAccountCode: '1020',
    iconName: 'CreditCard',
    active: true,
    description: 'AMEX merchant acquiring gateway',
    requiresAuthCode: true,
    allowRefund: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'bill-opt-4',
    code: 'BKASH',
    name: 'bKash Merchant Pay / QR',
    category: 'Mobile Financial Services (MFS)',
    surchargePercent: 1.2,
    taxRatePercent: 0,
    applicableOutlets: ['Front Desk', 'Restaurant', 'Bar', 'Banquet', 'Activities', 'Room Amenities'],
    defaultGLAccountCode: '1025',
    iconName: 'Smartphone',
    active: true,
    description: 'Direct bKash Merchant wallet QR or OTP payment',
    requiresAuthCode: true,
    allowRefund: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'bill-opt-5',
    code: 'NAGAD',
    name: 'Nagad Postal Service Pay',
    category: 'Mobile Financial Services (MFS)',
    surchargePercent: 1.0,
    taxRatePercent: 0,
    applicableOutlets: ['Front Desk', 'Restaurant', 'Bar', 'Activities'],
    defaultGLAccountCode: '1025',
    iconName: 'Smartphone',
    active: true,
    description: 'Nagad merchant account direct gateway',
    requiresAuthCode: true,
    allowRefund: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'bill-opt-6',
    code: 'ROCKET',
    name: 'Rocket (Dutch-Bangla Bank)',
    category: 'Mobile Financial Services (MFS)',
    surchargePercent: 1.0,
    taxRatePercent: 0,
    applicableOutlets: ['Front Desk', 'Restaurant', 'Bar'],
    defaultGLAccountCode: '1025',
    iconName: 'Smartphone',
    active: true,
    description: 'DBBL Rocket MFS wallet transfer',
    requiresAuthCode: true,
    allowRefund: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'bill-opt-7',
    code: 'CITY_LEDGER',
    name: 'City Ledger (Direct Corporate Billing)',
    category: 'Direct Billing (City Ledger)',
    surchargePercent: 0,
    taxRatePercent: 0,
    applicableOutlets: ['Front Desk', 'Banquet', 'Restaurant'],
    defaultGLAccountCode: '1150',
    iconName: 'Building2',
    active: true,
    description: 'Post invoice to approved corporate account or travel agent credit ledger with payment due in 30 days',
    requiresAuthCode: true,
    allowRefund: false,
    settlementTermsDays: 30,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'bill-opt-8',
    code: 'BANK_WIRE',
    name: 'Bank Wire / RTGS / Swift',
    category: 'Bank Transfer / Wire',
    surchargePercent: 0,
    taxRatePercent: 0,
    applicableOutlets: ['Front Desk', 'Banquet'],
    defaultGLAccountCode: '1020',
    iconName: 'Landmark',
    active: true,
    description: 'Direct bank remittance or corporate wire deposit for bulk stays and convention halls',
    requiresAuthCode: true,
    allowRefund: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'bill-opt-9',
    code: 'ROOM_FOLIO',
    name: 'Room Charge (Post to Guest Folio)',
    category: 'Internal Folio / Voucher',
    surchargePercent: 0,
    taxRatePercent: 0,
    applicableOutlets: ['Restaurant', 'Bar', 'Activities', 'Room Amenities'],
    defaultGLAccountCode: '1100',
    iconName: 'BedDouble',
    active: true,
    description: 'Charges routed directly to active checked-in guest stay folio for checkout settlement',
    requiresAuthCode: false,
    allowRefund: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'bill-opt-10',
    code: 'COMP_VOUCHER',
    name: 'Complimentary / Manager Voucher',
    category: 'Internal Folio / Voucher',
    surchargePercent: 0,
    taxRatePercent: 0,
    applicableOutlets: ['Restaurant', 'Bar', 'Activities', 'Room Amenities', 'Front Desk'],
    defaultGLAccountCode: '5020',
    iconName: 'Gift',
    active: true,
    description: 'Duty manager authorized complimentary service with GM override reason code',
    requiresAuthCode: true,
    allowRefund: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];

// ---------------------------------------------------------------------------
// INITIAL DEFAULT BAR & RESTAURANT & HK ITEMS SEEDS
// ---------------------------------------------------------------------------
const SEED_DEPARTMENT_ITEMS: GenericDepartmentItem[] = [
  // BAR ITEMS
  {
    id: 'bar-item-1',
    departmentType: 'bar',
    sku: 'BAR-MOCK-001',
    name: 'Blue Lagoon Resort Mocktail',
    category: 'Mocktails & Coolers',
    description: 'Curacao blend, lime, fresh mint & sparkling soda in tall chilled glass',
    unit: 'Glass',
    costPrice: 85,
    salePrice: 280,
    active: true,
    abvPercent: 0,
    portionSize: '350 ml',
    kitchenStation: 'Beverage & Bar',
    inStock: 120,
    reorderLevel: 25,
    taxPercent: 15,
    serviceChargePercent: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'bar-item-2',
    departmentType: 'bar',
    sku: 'BAR-COFF-002',
    name: 'Resort Cold Coffee with Ice Cream',
    category: 'Specialty Beverages',
    description: 'Double espresso blend shaken over ice topped with rich vanilla scoop',
    unit: 'Glass',
    costPrice: 90,
    salePrice: 240,
    active: true,
    abvPercent: 0,
    portionSize: '300 ml',
    kitchenStation: 'Beverage & Bar',
    inStock: 95,
    reorderLevel: 20,
    taxPercent: 15,
    serviceChargePercent: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'bar-item-3',
    departmentType: 'bar',
    sku: 'BAR-WINE-003',
    name: 'Cabernet Sauvignon Vintage Reserve',
    category: 'Wines & Spirits',
    description: 'Imported full-bodied dry red wine with berry aroma & oak finish',
    unit: 'Bottle',
    costPrice: 1800,
    salePrice: 4200,
    active: true,
    abvPercent: 13.5,
    portionSize: '750 ml',
    kitchenStation: 'Beverage & Bar',
    inStock: 35,
    reorderLevel: 10,
    taxPercent: 15,
    serviceChargePercent: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'bar-item-4',
    departmentType: 'bar',
    sku: 'BAR-JUICE-004',
    name: 'Fresh Seasonal Green Coconut Water',
    category: 'Natural Fresh Juices',
    description: 'Naturally chilled sweet Daab water served in whole shell with straw',
    unit: 'Piece',
    costPrice: 45,
    salePrice: 120,
    active: true,
    abvPercent: 0,
    portionSize: '1 Shell',
    kitchenStation: 'Beverage & Bar',
    inStock: 75,
    reorderLevel: 20,
    taxPercent: 15,
    serviceChargePercent: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  // RESTAURANT ITEMS
  {
    id: 'rest-item-1',
    departmentType: 'restaurant',
    sku: 'REST-BENG-001',
    name: 'CCULB Traditional Kacchi Biryani',
    category: 'Bengali Delicacies',
    description: 'Fragrant aromatic basmati with mutton, potato, boiled egg and salad',
    unit: 'Plate',
    costPrice: 280,
    salePrice: 650,
    active: true,
    portionSize: '1 Person',
    kitchenStation: 'Main Kitchen',
    prepTimeMinutes: 15,
    dietaryTags: ['Halal', 'Chef Special'],
    taxPercent: 15,
    serviceChargePercent: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'rest-item-2',
    departmentType: 'restaurant',
    sku: 'REST-FISH-002',
    name: 'Hilsa Mustard Curry (Shorshe Ilish)',
    category: 'Bengali Delicacies',
    description: 'Fresh Meghna river Hilsa cooked with mustard paste, green chilies & mustard oil',
    unit: 'Plate',
    costPrice: 420,
    salePrice: 850,
    active: true,
    portionSize: '1 Person (2 Pcs)',
    kitchenStation: 'Main Kitchen',
    prepTimeMinutes: 20,
    dietaryTags: ['Halal', 'Chef Special'],
    taxPercent: 15,
    serviceChargePercent: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'rest-item-3',
    departmentType: 'restaurant',
    sku: 'REST-CONT-003',
    name: 'Grilled Chicken Steak with Mashed Potato',
    category: 'Continental & Grills',
    description: 'Herb marinated boneless breast with mushroom sauce, sauteed vegetables & mash',
    unit: 'Platter',
    costPrice: 310,
    salePrice: 720,
    active: true,
    portionSize: '1 Person',
    kitchenStation: 'Continental & Grills',
    prepTimeMinutes: 22,
    dietaryTags: ['Halal', 'High Protein'],
    taxPercent: 15,
    serviceChargePercent: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'rest-item-4',
    departmentType: 'restaurant',
    sku: 'REST-SAND-004',
    name: 'Resort Club Sandwich with French Fries',
    category: 'Snacks & Quick Bites',
    description: 'Triple-decker chicken, fried egg, cheddar cheese, crisp lettuce and crisp fries',
    unit: 'Platter',
    costPrice: 160,
    salePrice: 420,
    active: true,
    portionSize: '1-2 Persons',
    kitchenStation: 'Continental & Grills',
    prepTimeMinutes: 12,
    dietaryTags: ['Halal'],
    taxPercent: 15,
    serviceChargePercent: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  // HOUSEKEEPING SUPPLIES
  {
    id: 'hk-item-1',
    departmentType: 'housekeeping',
    sku: 'HK-LIN-001',
    name: 'King Size Cotton Bed Sheet (300 TC)',
    category: 'Linen & Bedding',
    description: 'White pure Egyptian cotton king bed sheet with satin stripes',
    unit: 'Piece',
    costPrice: 450,
    salePrice: 0,
    active: true,
    isChargeable: false,
    inStock: 350,
    reorderLevel: 80,
    defaultRoomAllotment: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'hk-item-2',
    departmentType: 'housekeeping',
    sku: 'HK-TOWL-002',
    name: 'Plush Bath Sheet Towel (650 GSM)',
    category: 'Bath Linen',
    description: 'Extra large combed cotton bath towel, soft & absorbent',
    unit: 'Piece',
    costPrice: 280,
    salePrice: 0,
    active: true,
    isChargeable: false,
    inStock: 480,
    reorderLevel: 100,
    defaultRoomAllotment: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'hk-item-3',
    departmentType: 'housekeeping',
    sku: 'HK-CHEM-003',
    name: 'Hospital-Grade Bathroom Sanitizer Concentrate',
    category: 'Cleaning Chemicals',
    description: 'Eco-friendly non-corrosive multi-surface disinfecting agent 5L can',
    unit: 'Can',
    costPrice: 650,
    salePrice: 0,
    active: true,
    isChargeable: false,
    inStock: 60,
    reorderLevel: 15,
    defaultRoomAllotment: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  // ACTIVITIES MASTER ITEMS
  {
    id: 'act-item-1',
    departmentType: 'activity',
    sku: 'ACT-POOL',
    name: 'Swimming Pool & Jacuzzi Pass',
    category: 'Water Sports',
    description: 'Olympic infinity resort pool, jacuzzi whirlpool jets, shower facilities, fresh towels & lifeguard protection.',
    unit: 'Per Person',
    costPrice: 150,
    salePrice: 500,
    active: true,
    pricingType: 'Per Person',
    durationMinutes: 120,
    maxCapacity: 40,
    instructorRequired: true,
    facilityLocation: 'Main Pool Deck - Central Resort',
    isChargeable: true,
    inStock: 100,
    reorderLevel: 20,
    taxPercent: 15,
    serviceChargePercent: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'act-item-2',
    departmentType: 'activity',
    sku: 'ACT-TENNIS',
    name: 'Floodlit Lawn Tennis Court',
    category: 'Racquet Sports',
    description: 'International standard synthetic grass tennis court with high-lumen floodlights, Yonex rackets and ball boy service.',
    unit: 'Per Hour',
    costPrice: 350,
    salePrice: 1200,
    active: true,
    pricingType: 'Per Hour',
    durationMinutes: 60,
    maxCapacity: 4,
    instructorRequired: true,
    facilityLocation: 'Sports Complex - Court 1',
    isChargeable: true,
    inStock: 20,
    reorderLevel: 5,
    taxPercent: 15,
    serviceChargePercent: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'act-item-3',
    departmentType: 'activity',
    sku: 'ACT-BOAT',
    name: 'River Lake Boating & Kayaks',
    category: 'Water Sports',
    description: 'Scenic paddle boats, twin kayaks, fishing rods and motorized safari ride across CCULB freshwater lake.',
    unit: 'Per Boat / 45 Mins',
    costPrice: 200,
    salePrice: 750,
    active: true,
    pricingType: 'Per Boat / 45 Mins',
    durationMinutes: 45,
    maxCapacity: 4,
    instructorRequired: true,
    facilityLocation: 'Lake Marina Pier 2',
    isChargeable: true,
    inStock: 15,
    reorderLevel: 3,
    taxPercent: 15,
    serviceChargePercent: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'act-item-4',
    departmentType: 'activity',
    sku: 'ACT-ARCH',
    name: 'Archery Target Range',
    category: 'Outdoor Adventure',
    description: 'Professional recurve bows, target bulls-eyes, 20 precision arrows, arm guards and range safety instructor guidance.',
    unit: 'Per Session',
    costPrice: 250,
    salePrice: 800,
    active: true,
    pricingType: 'Per Session',
    durationMinutes: 45,
    maxCapacity: 8,
    instructorRequired: true,
    facilityLocation: 'Adventure Ground - Field Alpha',
    isChargeable: true,
    inStock: 30,
    reorderLevel: 10,
    taxPercent: 15,
    serviceChargePercent: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'act-item-5',
    departmentType: 'activity',
    sku: 'ACT-GYM',
    name: 'Fitness Center & Cardio Gym',
    category: 'Fitness & Wellness',
    description: 'High-tech cardio treadmills, cross-trainers, free weights, Olympic barbells, steam sauna bath and trainer assistance.',
    unit: 'Day Pass',
    costPrice: 100,
    salePrice: 400,
    active: true,
    pricingType: 'Day Pass',
    durationMinutes: 180,
    maxCapacity: 30,
    instructorRequired: true,
    facilityLocation: 'Clubhouse Level 2',
    isChargeable: true,
    inStock: 50,
    reorderLevel: 10,
    taxPercent: 15,
    serviceChargePercent: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'act-item-6',
    departmentType: 'activity',
    sku: 'ACT-KIDS',
    name: 'Kids Play Zone & Arcade',
    category: 'Kids & Family',
    description: 'Indoor air-conditioned soft play jungle gym, trampolines, ball pit, VR gaming consoles and arcade coin tokens.',
    unit: 'Day Pass',
    costPrice: 100,
    salePrice: 350,
    active: true,
    pricingType: 'Day Pass',
    durationMinutes: 240,
    maxCapacity: 35,
    instructorRequired: true,
    facilityLocation: 'Recreation Center - Ground Floor',
    isChargeable: true,
    inStock: 40,
    reorderLevel: 10,
    taxPercent: 15,
    serviceChargePercent: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'act-item-7',
    departmentType: 'activity',
    sku: 'ACT-BILL',
    name: 'English Snooker & Pool Table',
    category: 'Indoor Games',
    description: 'Tournament standard 12ft slate snooker table, premium cue sticks, chalk, triangle and hourly game tracking.',
    unit: 'Per Hour',
    costPrice: 150,
    salePrice: 500,
    active: true,
    pricingType: 'Per Hour',
    durationMinutes: 60,
    maxCapacity: 6,
    instructorRequired: false,
    facilityLocation: 'Clubhouse - Billiards Lounge',
    isChargeable: true,
    inStock: 10,
    reorderLevel: 2,
    taxPercent: 15,
    serviceChargePercent: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'act-item-8',
    departmentType: 'activity',
    sku: 'ACT-SPA',
    name: 'Ayurvedic Full Body Massage & Spa',
    category: 'Spa & Therapy',
    description: 'Authentic herbal oil abhyanga massage, steam herbal therapy, aromatherapy face mask and certified masseuse care.',
    unit: '60-Min Session',
    costPrice: 900,
    salePrice: 2500,
    active: true,
    pricingType: '60-Min Session',
    durationMinutes: 60,
    maxCapacity: 5,
    instructorRequired: true,
    facilityLocation: 'Resort Wellness Spa & Salon',
    isChargeable: true,
    inStock: 25,
    reorderLevel: 5,
    taxPercent: 15,
    serviceChargePercent: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];

// ---------------------------------------------------------------------------
// ADMIN MASTER SERVICE CLASS
// ---------------------------------------------------------------------------
class AdminMasterService {
  private modules: NavModuleDef[] = [];
  private billingOptions: BillingOptionDef[] = [];
  private departmentItems: GenericDepartmentItem[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Load navigation
    try {
      const savedNav = localStorage.getItem('cculb_admin_navigation_master_v1');
      if (savedNav) {
        this.modules = JSON.parse(savedNav);
        // Automatically merge legacy separate 'bar' module into 'restaurant'
        if (this.modules.some(m => m.id === 'bar' || m.moduleKey === 'bar')) {
          const rest = this.modules.find(m => m.id === 'restaurant' || m.moduleKey === 'restaurant');
          if (rest) {
            rest.label = 'Restaurant & Bar';
          }
          this.modules = this.modules.filter(m => m.id !== 'bar' && m.moduleKey !== 'bar');
          this.modules.forEach((m, idx) => { m.order = idx + 1; });
          this.saveNavigation();
        }
      } else {
        this.modules = JSON.parse(JSON.stringify(DEFAULT_MODULES));
      }
    } catch (e) {
      console.warn('Error loading custom navigation, using defaults', e);
      this.modules = JSON.parse(JSON.stringify(DEFAULT_MODULES));
    }

    // Load billing options
    try {
      const savedBilling = localStorage.getItem('cculb_admin_billing_options_v1');
      if (savedBilling) {
        this.billingOptions = JSON.parse(savedBilling);
      } else {
        this.billingOptions = JSON.parse(JSON.stringify(DEFAULT_BILLING_OPTIONS));
      }
    } catch (e) {
      console.warn('Error loading custom billing options, using defaults', e);
      this.billingOptions = JSON.parse(JSON.stringify(DEFAULT_BILLING_OPTIONS));
    }

    // Load department items
    try {
      const savedItems = localStorage.getItem('cculb_admin_dept_items_v1');
      if (savedItems) {
        this.departmentItems = JSON.parse(savedItems);
      } else {
        this.departmentItems = JSON.parse(JSON.stringify(SEED_DEPARTMENT_ITEMS));
      }
    } catch (e) {
      console.warn('Error loading custom departmental items, using defaults', e);
      this.departmentItems = JSON.parse(JSON.stringify(SEED_DEPARTMENT_ITEMS));
    }
    this.syncActivities();
  }

  // Subscribe to updates
  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => {
      try { fn(); } catch (err) { console.error('AdminMasterService listener err:', err); }
    });
  }

  // =========================================================================
  // 1. NAVIGATION & SUB-MENUS CONTROLLER
  // =========================================================================
  public getNavModules(): NavModuleDef[] {
    return this.modules;
  }

  public getActiveNavItems() {
    return this.modules
      .filter(m => m.enabled)
      .sort((a, b) => a.order - b.order)
      .map(m => ({
        ...m,
        children: m.children
          .filter(c => c.enabled)
          .sort((a, b) => a.order - b.order)
      }));
  }

  public addNavModule(moduleData: Omit<NavModuleDef, 'id' | 'children' | 'isCustom'>): NavModuleDef {
    const newModule: NavModuleDef = {
      ...moduleData,
      id: `custom-mod-${Date.now()}`,
      isCustom: true,
      children: []
    };
    this.modules.push(newModule);
    this.saveNavigation();
    pmsService.logAudit('Created Navigation Module', 'Settings', newModule.id, undefined, `Admin created module: ${newModule.label}`);
    return newModule;
  }

  public updateNavModule(id: string, updates: Partial<NavModuleDef>) {
    this.modules = this.modules.map(m => m.id === id ? { ...m, ...updates } : m);
    this.saveNavigation();
    pmsService.logAudit('Updated Navigation Module', 'Settings', id, undefined, `Admin updated module: ${id}`);
  }

  public deleteNavModule(id: string): boolean {
    const prevLen = this.modules.length;
    this.modules = this.modules.filter(m => m.id !== id);
    if (this.modules.length < prevLen) {
      this.saveNavigation();
      pmsService.logAudit('Deleted Navigation Module', 'Settings', id, undefined, `Admin deleted module: ${id}`);
      return true;
    }
    return false;
  }

  public addSubMenu(parentModuleId: string, subMenuData: Omit<SubMenuItemDef, 'id' | 'isCustom'>): SubMenuItemDef | null {
    const parent = this.modules.find(m => m.id === parentModuleId);
    if (!parent) return null;

    const newSubMenu: SubMenuItemDef = {
      ...subMenuData,
      id: subMenuData.targetRoute || `sub-${Date.now()}`,
      isCustom: true,
      order: parent.children.length + 1
    };

    parent.children.push(newSubMenu);
    this.saveNavigation();
    pmsService.logAudit('Created Sub-Menu', 'Settings', newSubMenu.id, undefined, `Admin added sub-menu "${newSubMenu.label}" to ${parent.label}`);
    return newSubMenu;
  }

  public updateSubMenu(parentModuleId: string, subMenuId: string, updates: Partial<SubMenuItemDef>) {
    const parent = this.modules.find(m => m.id === parentModuleId);
    if (!parent) return;

    parent.children = parent.children.map(c => c.id === subMenuId ? { ...c, ...updates } : c);
    this.saveNavigation();
    pmsService.logAudit('Updated Sub-Menu', 'Settings', subMenuId, undefined, `Admin updated sub-menu: ${subMenuId}`);
  }

  public deleteSubMenu(parentModuleId: string, subMenuId: string): boolean {
    const parent = this.modules.find(m => m.id === parentModuleId);
    if (!parent) return false;

    const prevLen = parent.children.length;
    parent.children = parent.children.filter(c => c.id !== subMenuId);
    if (parent.children.length < prevLen) {
      this.saveNavigation();
      pmsService.logAudit('Deleted Sub-Menu', 'Settings', subMenuId, undefined, `Admin deleted sub-menu: ${subMenuId}`);
      return true;
    }
    return false;
  }

  public toggleSubMenuVisibility(parentModuleId: string, subMenuId: string, enabled: boolean) {
    const parent = this.modules.find(m => m.id === parentModuleId);
    if (!parent) return;

    const target = parent.children.find(c => c.id === subMenuId);
    if (target) {
      target.enabled = enabled;
      this.saveNavigation();
      pmsService.logAudit('Toggled Sub-Menu Visibility', 'Settings', subMenuId, undefined, `Sub-menu ${target.label} enabled=${enabled}`);
    }
  }

  public toggleModuleVisibility(moduleId: string, enabled: boolean) {
    const target = this.modules.find(m => m.id === moduleId);
    if (target) {
      target.enabled = enabled;
      this.saveNavigation();
      pmsService.logAudit('Toggled Module Visibility', 'Settings', moduleId, undefined, `Module ${target.label} enabled=${enabled}`);
    }
  }

  public reorderSubMenu(parentModuleId: string, subMenuId: string, direction: 'up' | 'down') {
    const parent = this.modules.find(m => m.id === parentModuleId);
    if (!parent) return;

    const idx = parent.children.findIndex(c => c.id === subMenuId);
    if (idx < 0) return;

    if (direction === 'up' && idx > 0) {
      const temp = parent.children[idx];
      parent.children[idx] = parent.children[idx - 1];
      parent.children[idx - 1] = temp;
    } else if (direction === 'down' && idx < parent.children.length - 1) {
      const temp = parent.children[idx];
      parent.children[idx] = parent.children[idx + 1];
      parent.children[idx + 1] = temp;
    }

    parent.children.forEach((c, i) => { c.order = i + 1; });
    this.saveNavigation();
  }

  public resetNavigationToDefault() {
    this.modules = JSON.parse(JSON.stringify(DEFAULT_MODULES));
    this.saveNavigation();
    pmsService.logAudit('Reset Navigation Defaults', 'Settings', 'nav-all', undefined, 'Admin restored original factory navigation setup');
  }

  private triggerCloudSync() {
    try {
      setTimeout(() => {
        supabaseSyncService.syncEntirePmsState().catch(e => {
          console.warn('Background sync after admin master update notice:', e?.message || e);
        });
      }, 500);
    } catch {}
  }

  private saveNavigation() {
    try {
      localStorage.setItem('cculb_admin_navigation_master_v1', JSON.stringify(this.modules));
    } catch (e) {
      console.warn('Unable to persist navigation config', e);
    }
    this.notify();
    this.triggerCloudSync();
  }

  // =========================================================================
  // 2. BILLING OPTIONS & PAYMENT TENDERS MASTER
  // =========================================================================
  public getBillingOptions(): BillingOptionDef[] {
    return this.billingOptions;
  }

  public getBillingOptionById(id: string): BillingOptionDef | undefined {
    return this.billingOptions.find(b => b.id === id || b.code.toLowerCase() === id.toLowerCase());
  }

  public addBillingOption(data: Omit<BillingOptionDef, 'id' | 'createdAt' | 'updatedAt'>): BillingOptionDef {
    const newOpt: BillingOptionDef = {
      ...data,
      id: `bill-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.billingOptions.unshift(newOpt);
    this.saveBillingOptions();
    pmsService.logAudit('Created Billing Option', 'Payment', newOpt.id, undefined, `Admin created payment method: ${newOpt.name} (${newOpt.code})`);
    return newOpt;
  }

  public updateBillingOption(id: string, updates: Partial<BillingOptionDef>) {
    this.billingOptions = this.billingOptions.map(b => {
      if (b.id === id) {
        return { ...b, ...updates, updatedAt: new Date().toISOString() };
      }
      return b;
    });
    this.saveBillingOptions();
    pmsService.logAudit('Updated Billing Option', 'Payment', id, undefined, `Admin updated payment method: ${id}`);
  }

  public deleteBillingOption(id: string): boolean {
    const prev = this.billingOptions.length;
    this.billingOptions = this.billingOptions.filter(b => b.id !== id);
    if (this.billingOptions.length < prev) {
      this.saveBillingOptions();
      pmsService.logAudit('Deleted Billing Option', 'Payment', id, undefined, `Admin deleted payment method: ${id}`);
      return true;
    }
    return false;
  }

  public toggleBillingOption(id: string, active: boolean) {
    this.updateBillingOption(id, { active });
  }

  private saveBillingOptions() {
    try {
      localStorage.setItem('cculb_admin_billing_options_v1', JSON.stringify(this.billingOptions));
    } catch (e) {
      console.warn('Unable to persist billing options', e);
    }
    this.notify();
    this.triggerCloudSync();
  }

  // =========================================================================
  // 3. DEPARTMENTAL ITEMS MASTER (Bar, Restaurant, Housekeeping, Activities, Amenities)
  // =========================================================================
  public syncActivities() {
    try {
      const pmsActs = pmsService.getActivities();
      if (Array.isArray(pmsActs) && pmsActs.length > 0) {
        let changed = false;
        pmsActs.forEach(act => {
          const index = this.departmentItems.findIndex(i =>
            i.departmentType === 'activity' && (i.sku === act.code || i.id === act.id || i.name.toLowerCase() === act.name.toLowerCase())
          );
          if (index === -1) {
            this.departmentItems.push({
              id: act.id,
              departmentType: 'activity',
              sku: act.code,
              name: act.name,
              category: act.category || 'Special Recreation',
              description: act.description || '',
              unit: act.pricingUnit || 'Per Person',
              costPrice: Math.round((act.price || 0) * 0.4),
              salePrice: act.price || 0,
              active: act.isActive !== false,
              pricingType: act.pricingUnit || 'Per Person',
              durationMinutes: act.durationMinutes || 60,
              maxCapacity: act.maxCapacityPerSlot || 10,
              instructorRequired: Boolean(act.instructorAvailable),
              isChargeable: (act.price || 0) > 0,
              inStock: 50,
              reorderLevel: 10,
              facilityLocation: act.location,
              taxPercent: 15,
              serviceChargePercent: 10,
              createdAt: act.createdAt || new Date().toISOString(),
              updatedAt: act.updatedAt || new Date().toISOString()
            });
            changed = true;
          } else {
            const existing = this.departmentItems[index];
            if (existing.active !== act.isActive || existing.salePrice !== act.price || existing.name !== act.name) {
              this.departmentItems[index] = {
                ...existing,
                name: act.name,
                category: act.category || existing.category,
                salePrice: act.price,
                active: act.isActive,
                unit: act.pricingUnit || existing.unit,
                pricingType: act.pricingUnit || existing.pricingType,
                updatedAt: new Date().toISOString()
              };
              changed = true;
            }
          }
        });
        if (changed) {
          try {
            localStorage.setItem('cculb_admin_dept_items_v1', JSON.stringify(this.departmentItems));
          } catch (e) {}
        }
      }

      // Also ensure any activity in departmentItems exists in pmsService
      const currentPms = pmsService.getActivities();
      this.departmentItems.filter(i => i.departmentType === 'activity').forEach(item => {
        const existsInPms = currentPms.some(a =>
          a.id === item.id ||
          (a.code && item.sku && a.code.toLowerCase() === item.sku.toLowerCase()) ||
          (a.name && item.name && a.name.toLowerCase() === item.name.toLowerCase())
        );
        if (!existsInPms) {
          pmsService.createActivity({
            code: item.sku,
            name: item.name,
            category: (item.category as any) || 'Special Recreation',
            description: item.description || '',
            price: item.salePrice || 0,
            pricingUnit: (item.pricingType as any) || (item.unit as any) || 'Per Person',
            durationMinutes: item.durationMinutes || 60,
            maxCapacityPerSlot: item.maxCapacity || 15,
            location: item.facilityLocation || 'Resort Recreation Grounds',
            operatingHours: '08:00 AM - 08:00 PM',
            instructorAvailable: Boolean(item.instructorRequired),
            glAccountCode: '4050',
            isActive: item.active !== false,
            badge: 'Featured',
            badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
            iconName: 'Palmtree'
          });
        }
      });
    } catch (e) {
      // safe fallback
    }
  }

  public getDepartmentItems(deptType?: DepartmentItemType): GenericDepartmentItem[] {
    this.syncActivities();
    if (!deptType) return this.departmentItems;
    return this.departmentItems.filter(i => i.departmentType === deptType);
  }

  public addDepartmentItem(data: Omit<GenericDepartmentItem, 'id' | 'createdAt' | 'updatedAt'>): GenericDepartmentItem {
    const newItem: GenericDepartmentItem = {
      ...data,
      id: `item-${data.departmentType}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Cross-sync with domain-specific services:
    if (data.departmentType === 'activity') {
      try {
        const actRes = pmsService.createActivity({
          code: data.sku,
          name: data.name,
          category: (data.category as any) || 'Special Recreation',
          pricingUnit: (data.pricingType as any) || (data.unit as any) || 'Per Person',
          price: data.salePrice,
          durationMinutes: data.durationMinutes || 60,
          maxCapacityPerSlot: data.maxCapacity || 10,
          instructorAvailable: data.instructorRequired || false,
          location: data.facilityLocation || 'Main Resort Recreation Grounds',
          description: data.description,
          operatingHours: '07:00 AM - 10:00 PM',
          glAccountCode: '4200',
          isActive: data.active !== false,
          iconName: 'Palmtree'
        });
        if (actRes.success && actRes.activity) {
          newItem.id = actRes.activity.id;
        }
      } catch (err) {
        console.warn('Activity cross-sync error:', err);
      }
    } else if (data.departmentType === 'amenity') {
      try {
        housekeepingService.createAmenity({
          name: data.name,
          category: data.category as any || 'Bathroom',
          sku: data.sku,
          unit: data.unit || 'PCS',
          cost: data.costPrice,
          salePrice: data.salePrice,
          isChargeable: !!data.isChargeable,
          reorderLevel: data.reorderLevel || 30,
          maximumLevel: 300,
          currentStock: data.inStock || 50,
          supplier: 'Resort Central Store',
          active: data.active,
          remarks: data.description
        });
      } catch (err) {
        console.warn('Amenity cross-sync error:', err);
      }
    }

    this.departmentItems.unshift(newItem);
    this.saveDepartmentItems();

    pmsService.logAudit('Created Departmental Item', 'Settings', newItem.id, undefined, `Admin created ${data.departmentType} item: ${data.name}`);
    return newItem;
  }

  public updateDepartmentItem(id: string, updates: Partial<GenericDepartmentItem>) {
    let updatedItem: GenericDepartmentItem | undefined;
    this.departmentItems = this.departmentItems.map(i => {
      if (i.id === id) {
        updatedItem = { ...i, ...updates, updatedAt: new Date().toISOString() };
        return updatedItem;
      }
      return i;
    });
    this.saveDepartmentItems();

    if (updatedItem && (updatedItem as GenericDepartmentItem).departmentType === 'activity') {
      const it = updatedItem as GenericDepartmentItem;
      try {
        pmsService.updateActivity(it.id, {
          name: it.name,
          category: it.category as any,
          price: it.salePrice,
          pricingUnit: (it.pricingType as any) || (it.unit as any) || 'Per Person',
          durationMinutes: it.durationMinutes,
          maxCapacityPerSlot: it.maxCapacity,
          instructorAvailable: it.instructorRequired,
          isActive: it.active,
          description: it.description
        });
      } catch (err) {
        console.warn('Cross-sync activity update error:', err);
      }
    }

    pmsService.logAudit('Updated Departmental Item', 'Settings', id, undefined, `Admin updated item: ${id}`);
  }

  public deleteDepartmentItem(id: string): boolean {
    const itemToDelete = this.departmentItems.find(i => i.id === id);
    const prev = this.departmentItems.length;
    this.departmentItems = this.departmentItems.filter(i => i.id !== id);
    if (this.departmentItems.length < prev) {
      this.saveDepartmentItems();
      if (itemToDelete && itemToDelete.departmentType === 'activity') {
        try {
          pmsService.deleteActivity(itemToDelete.id);
        } catch (err) {
          console.warn('Cross-sync activity delete error:', err);
        }
      }
      pmsService.logAudit('Deleted Departmental Item', 'Settings', id, undefined, `Admin deleted item: ${id}`);
      return true;
    }
    return false;
  }

  private saveDepartmentItems() {
    try {
      localStorage.setItem('cculb_admin_dept_items_v1', JSON.stringify(this.departmentItems));
    } catch (e) {
      console.warn('Unable to persist departmental items', e);
    }
    this.notify();
    this.triggerCloudSync();
  }

  // =========================================================================
  // 4. DEPARTMENTS & OUTLETS (Pass-through with Full RBAC sync)
  // =========================================================================
  public getDepartments(): DepartmentDef[] {
    return rbacService.getDepartments();
  }

  public addDepartment(dept: Omit<DepartmentDef, 'id'>): DepartmentDef {
    const created = rbacService.addDepartment(dept);
    this.notify();
    return created;
  }

  public updateDepartment(dept: DepartmentDef) {
    rbacService.updateDepartment(dept);
    this.notify();
  }

  public deleteDepartment(id: string): boolean {
    const ok = rbacService.deleteDepartment(id);
    this.notify();
    return ok;
  }

  public getOutlets(): OutletDef[] {
    return rbacService.getOutlets();
  }

  public addOutlet(outlet: Omit<OutletDef, 'id'>): OutletDef {
    const created = rbacService.addOutlet(outlet);
    this.notify();
    return created;
  }

  public updateOutlet(outlet: OutletDef) {
    rbacService.updateOutlet(outlet);
    this.notify();
  }

  public deleteOutlet(id: string): boolean {
    const ok = rbacService.deleteOutlet(id);
    this.notify();
    return ok;
  }
}

export const adminMasterService = new AdminMasterService();
