import { UserRoleName } from './pms';

export type DepartmentName =
  | 'Front Office'
  | 'Housekeeping'
  | 'Food & Beverage'
  | 'Restaurant'
  | 'Bar & Lounge'
  | 'Banquet & Convention'
  | 'Recreation & Activities'
  | 'Amenities & Spa'
  | 'Procurement & Stores'
  | 'Inventory'
  | 'Kitchen / Culinary'
  | 'Finance & Accounts'
  | 'Sales & Marketing'
  | 'Human Resources'
  | 'Information Technology'
  | 'Security & Safety'
  | 'Engineering & Maintenance'
  | 'Executive Management'
  | 'Internal Audit';

export type MainModuleName =
  | 'dashboard'
  | 'front-office'
  | 'housekeeping'
  | 'restaurant'
  | 'bar'
  | 'banquet'
  | 'activities'
  | 'amenities'
  | 'procurement'
  | 'inventory'
  | 'menu-management'
  | 'finance'
  | 'sales-marketing'
  | 'crm'
  | 'hr'
  | 'reports'
  | 'administration';

export type DataScopeType =
  | 'Own Records'
  | 'Own Outlet'
  | 'Own Department'
  | 'Own Property'
  | 'All Properties';

export interface RoleDefinition {
  id: string;
  name: string;
  department: DepartmentName;
  description: string;
  isSystem: boolean;
  defaultDataScope: DataScopeType;
  allowedModules: MainModuleName[];
  permissions: string[];
}

export interface UserContext {
  id: string;
  name: string;
  username?: string;
  email: string;
  roleId: string;
  roleName: string;
  department: DepartmentName;
  dataScope: DataScopeType;
  outletId?: string;
  avatar?: string;
  customPermissions?: string[]; // individually granted user permissions
  deniedPermissions?: string[]; // individually revoked/denied user permissions
}

export interface PermissionDefinition {
  key: string;
  label: string;
  category:
    | 'Approval Permissions'
    | 'Create, Edit & Modify'
    | 'Bill Resettle & Void'
    | 'Payment Void & Refunds'
    | 'Front Office & Operations'
    | 'Billing & Guest Folio'
    | 'Restaurant & Menu Management'
    | 'Sales & Corporate Marketing'
    | 'IT, Systems & Security'
    | 'Human Resources & Payroll'
    | 'Inventory & Procurement'
    | 'Finance & General Ledger'
    | 'Housekeeping & Maintenance'
    | 'Audit, Compliance & Reports'
    | 'Administration & Overrides';
  description: string;
  riskLevel: 'Standard' | 'Elevated' | 'High' | 'Critical';
}

export interface ApprovalRule {
  id: string;
  ruleCode: string;
  name: string;
  category: 'Procurement' | 'Billing' | 'Payment' | 'Discount' | 'Credit Limit' | 'Expense' | 'HR';
  actionType: string;
  minThreshold: number; // in BDT (0 for universal)
  maxThreshold?: number;
  requiredRoleIds: string[];
  requiresTwoSignatures: boolean;
  active: boolean;
  description: string;
}

export interface DepartmentDef {
  id: string;
  code: string;
  name: DepartmentName;
  headName: string;
  headEmail: string;
  costCenterCode: string;
  staffCount: number;
  active: boolean;
}

export interface OutletDef {
  id: string;
  code: string;
  name: string;
  department: DepartmentName;
  type: 'Restaurant' | 'Bar' | 'Banquet' | 'Spa' | 'Recreation' | 'Front Desk';
  revenueGL: string;
  posTerminalCount: number;
  active: boolean;
}

export type ReportCategory =
  | 'Front Office'
  | 'Housekeeping'
  | 'Restaurant'
  | 'Bar'
  | 'Banquet & Convention'
  | 'Activities'
  | 'Amenities'
  | 'Procurement'
  | 'Inventory'
  | 'Menu & Costing'
  | 'Sales & Marketing'
  | 'Accounts Receivable'
  | 'Accounts Payable'
  | 'General Ledger'
  | 'Financial Reports'
  | 'Tax & Compliance'
  | 'Management Reports'
  | 'Audit Reports'
  | 'Custom Reports';

export interface ReportDefinition {
  id: string;
  reportCode: string;
  reportName: string;
  module: MainModuleName;
  subModule: string;
  category: ReportCategory;
  description: string;
  dataSource: string;
  requiredPermission: string;
  defaultDataScope: DataScopeType;
  supportedFormats: ('PDF' | 'Excel' | 'CSV' | 'Print')[];
  columns: ReportColumnDef[];
}

export interface ReportColumnDef {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  format?: 'currency' | 'percent' | 'date' | 'badge' | 'number' | 'text';
  isTotal?: boolean;
}

export interface ReportFilterState {
  dateFrom: string;
  dateTo: string;
  department?: string;
  outletId?: string;
  warehouseId?: string;
  status?: string;
  searchTerm?: string;
  groupBy?: string;
  category?: string;
  userId?: string;
  agingBucket?: string;
}

export interface ReportExecutionLog {
  id: string;
  reportCode: string;
  reportName: string;
  userId: string;
  userName: string;
  userRole: string;
  department: string;
  executedAt: string;
  filters: ReportFilterState;
  rowCount: number;
  exportFormat?: 'PDF' | 'Excel' | 'CSV' | 'View' | 'Print';
}

export interface DepartmentReportAccessRule {
  department: DepartmentName | string;
  canViewAllDepartments: boolean; // True ONLY for Finance & Accounts and Executive Management
  allowedCategories: ReportCategory[];
  description: string;
  isSystemRule?: boolean;
}

export interface ReportRoleManagementConfig {
  policyName: string;
  strictDepartmentIsolation: boolean; // default: true
  onlyAccountsCanViewAll: boolean; // default: true
  departments: Record<string, DepartmentReportAccessRule>;
  roleOverrides: Record<string, { canViewAll: boolean; allowedCategories: ReportCategory[] }>;
  lastUpdated: string;
  updatedBy: string;
}

