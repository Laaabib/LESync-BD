import {
  RoleDefinition,
  MainModuleName,
  DepartmentName,
  DataScopeType,
  UserContext,
  PermissionDefinition,
  ApprovalRule,
  DepartmentDef,
  OutletDef,
  ReportCategory,
  DepartmentReportAccessRule,
  ReportRoleManagementConfig
} from '../types/reportingAndRbac';

export type { UserContext, PermissionDefinition, ApprovalRule, DepartmentDef, OutletDef, ReportCategory, DepartmentReportAccessRule, ReportRoleManagementConfig };

export const MASTER_PERMISSIONS: PermissionDefinition[] = [
  // Approval Permissions
  {
    key: 'approvals:po',
    label: 'Purchase Order Approval',
    category: 'Approval Permissions',
    description: 'Authorize vendor Purchase Orders beyond departmental threshold limits.',
    riskLevel: 'Critical'
  },
  {
    key: 'approvals:expense',
    label: 'Expense & Petty Cash Approval',
    category: 'Approval Permissions',
    description: 'Authorize operational expense vouchers, cash disbursements, and requisitions.',
    riskLevel: 'High'
  },
  {
    key: 'approvals:credit-limit',
    label: 'Credit Limit Override',
    category: 'Approval Permissions',
    description: 'Authorize corporate ledger credit limit increases and post-to-company privileges.',
    riskLevel: 'Critical'
  },
  {
    key: 'approvals:discount',
    label: 'Discounts & Allowances Approval',
    category: 'Approval Permissions',
    description: 'Authorize VIP courtesy discounts, promotional rate cuts, and managerial allowances.',
    riskLevel: 'High'
  },
  {
    key: 'approvals:bill-resettle',
    label: 'Bill Resettlement Authorization',
    category: 'Approval Permissions',
    description: 'Authorize reopening settled folios and reallocating payment tender methods.',
    riskLevel: 'High'
  },
  {
    key: 'approvals:bill-void',
    label: 'Bill & Invoice Void Approval',
    category: 'Approval Permissions',
    description: 'Authorize official voiding of finalized tax invoices and dining bills.',
    riskLevel: 'Critical'
  },
  {
    key: 'approvals:payment-void',
    label: 'Payment Void & Reversal Approval',
    category: 'Approval Permissions',
    description: 'Authorize voiding collected cashier payments (Cash, Card, MFS, Bank Wire).',
    riskLevel: 'Critical'
  },
  {
    key: 'approvals:refund',
    label: 'Payment Refund Authorization',
    category: 'Approval Permissions',
    description: 'Authorize official refunds to guests via cash drawer or payment gateway.',
    riskLevel: 'Critical'
  },
  {
    key: 'approvals:rate-override',
    label: 'Room Rate Override Approval',
    category: 'Approval Permissions',
    description: 'Authorize manual room rate changes below Best Available Rate (BAR).',
    riskLevel: 'High'
  },
  {
    key: 'approvals:complimentary',
    label: 'Complimentary Room / F&B Approval',
    category: 'Approval Permissions',
    description: 'Authorize 100% complimentary guest rooms or executive dining orders.',
    riskLevel: 'Critical'
  },
  {
    key: 'approvals:leave',
    label: 'Staff Leave & Roster Approval',
    category: 'Approval Permissions',
    description: 'Authorize departmental leave applications and roster duty substitutions.',
    riskLevel: 'Standard'
  },

  // Billing & Guest Folio Permissions
  {
    key: 'billing:view',
    label: 'View Guest Folios & Master Invoices',
    category: 'Billing & Guest Folio',
    description: 'View active guest folios, proforma invoices, guest ledger balances, and billing registers.',
    riskLevel: 'Standard'
  },
  {
    key: 'billing:create',
    label: 'Create Guest Folio Windows',
    category: 'Billing & Guest Folio',
    description: 'Open extra billing folio splits (Folio A/B/C/D) and create master corporate billing accounts.',
    riskLevel: 'Standard'
  },
  {
    key: 'billing:edit',
    label: 'Edit Folio Header & Tax BIN',
    category: 'Billing & Guest Folio',
    description: 'Edit folio billing entity, guest TIN/BIN, address, and credit settlement instructions.',
    riskLevel: 'Standard'
  },
  {
    key: 'billing:post-charge',
    label: 'Post Miscellaneous Folio Charges',
    category: 'Billing & Guest Folio',
    description: 'Post room service, restaurant dining, minibar, spa, laundry, and extra guest charges to folios.',
    riskLevel: 'Standard'
  },
  {
    key: 'billing:split-transfer',
    label: 'Split, Transfer & Route Charges',
    category: 'Billing & Guest Folio',
    description: 'Route, split, and transfer charges between guest folios, rooms, or City Ledger accounts.',
    riskLevel: 'Elevated'
  },
  {
    key: 'billing:discount',
    label: 'Apply Folio Discounts & Allowances',
    category: 'Billing & Guest Folio',
    description: 'Apply authorized folio rate discounts, promotional percentage cuts, and managerial allowances.',
    riskLevel: 'High'
  },
  {
    key: 'billing:settle',
    label: 'Settle Folio Invoices',
    category: 'Billing & Guest Folio',
    description: 'Settle guest folios using Cash, POS Card, bKash, Nagad, or City Ledger direct transfer.',
    riskLevel: 'Elevated'
  },
  {
    key: 'billing:print',
    label: 'Print Folios & Official VAT Invoices',
    category: 'Billing & Guest Folio',
    description: 'Print guest folios, proforma bills, and official NBR-compliant tax receipts.',
    riskLevel: 'Standard'
  },
  {
    key: 'billing:credit-limit-override',
    label: 'Override Guest Credit Limit',
    category: 'Billing & Guest Folio',
    description: 'Authorize guest check charges exceeding individual or company credit limits.',
    riskLevel: 'Critical'
  },

  // Bill Resettle & Void Permissions
  {
    key: 'billing:bill-resettle',
    label: 'Bill Resettlement (Reopen Settled Bill)',
    category: 'Bill Resettle & Void',
    description: 'Reopen settled folios or dining bills to change payment tender or rebalance ledger.',
    riskLevel: 'High'
  },
  {
    key: 'billing:bill-void',
    label: 'Void Entire Bill / Folio',
    category: 'Bill Resettle & Void',
    description: 'Void complete finalized guest folios, banqueting invoices, and tax bills.',
    riskLevel: 'Critical'
  },
  {
    key: 'folio:void-charge',
    label: 'Void Posted Charge Line',
    category: 'Bill Resettle & Void',
    description: 'Void single posted room, dining, or service charge line with reason logging.',
    riskLevel: 'High'
  },
  {
    key: 'pos:check-void',
    label: 'Void POS Table Check / KOT',
    category: 'Bill Resettle & Void',
    description: 'Void active dining checks, food orders, or kitchen order tickets.',
    riskLevel: 'High'
  },
  {
    key: 'invoice:cancel',
    label: 'Cancel Official Tax Invoice',
    category: 'Bill Resettle & Void',
    description: 'Cancel officially issued tax invoices and post credit notes.',
    riskLevel: 'Critical'
  },

  // Payment Void & Refunds
  {
    key: 'payment:void',
    label: 'Void Recorded Payment',
    category: 'Payment Void & Refunds',
    description: 'Void recorded cashier payments across Cash, POS Card, bKash/Nagad, and Bank Wire.',
    riskLevel: 'Critical'
  },
  {
    key: 'payment:refund',
    label: 'Issue Payment Refund',
    category: 'Payment Void & Refunds',
    description: 'Disburse monetary refunds back to guest via cash drawer or gateway reversal.',
    riskLevel: 'Critical'
  },
  {
    key: 'payment:reverse',
    label: 'Execute Ledger Payment Reversal',
    category: 'Payment Void & Refunds',
    description: 'Generate counter-reversal journal entries for misposted or bounced payments.',
    riskLevel: 'High'
  },
  {
    key: 'cashier:reconcile-void',
    label: 'Certify Shift Cashier Voids',
    category: 'Payment Void & Refunds',
    description: 'Sign off on daily cashier drawer void discrepancies during shift handover.',
    riskLevel: 'High'
  },

  // Front Office & Operations Permissions
  {
    key: 'front-office:view',
    label: 'View Front Desk & Room Rack',
    category: 'Front Office & Operations',
    description: 'Access front desk dashboards, room rack matrix, and arrival/departure lists.',
    riskLevel: 'Standard'
  },
  {
    key: 'front-office:create',
    label: 'Create Reservations & Walk-Ins',
    category: 'Front Office & Operations',
    description: 'Create new room reservations, individual walk-ins, and guest profiles.',
    riskLevel: 'Standard'
  },
  {
    key: 'front-office:edit',
    label: 'Edit Booking & Stay Info',
    category: 'Front Office & Operations',
    description: 'Edit stay dates, guest contact details, remarks, and preferences.',
    riskLevel: 'Standard'
  },
  {
    key: 'front-office:modify',
    label: 'Modify Room Tariffs & Packages',
    category: 'Front Office & Operations',
    description: 'Modify room rates, promotional meal plan inclusions, and billing arrangements.',
    riskLevel: 'Elevated'
  },
  {
    key: 'front-office:delete',
    label: 'Cancel & Remove Bookings',
    category: 'Front Office & Operations',
    description: 'Cancel unconfirmed bookings and archive duplicate reservation records.',
    riskLevel: 'High'
  },
  {
    key: 'front-office:checkin',
    label: 'Execute Guest Check-In',
    category: 'Front Office & Operations',
    description: 'Register guest arrivals, inspect identity docs, and issue electronic RFID keys.',
    riskLevel: 'Standard'
  },
  {
    key: 'front-office:checkout',
    label: 'Execute Guest Check-Out',
    category: 'Front Office & Operations',
    description: 'Process guest departures, collect outstanding balances, and close folios.',
    riskLevel: 'Standard'
  },
  {
    key: 'front-office:room-assignment',
    label: 'Assign & Lock Rooms',
    category: 'Front Office & Operations',
    description: 'Assign specific room numbers to bookings and apply assignment locks.',
    riskLevel: 'Standard'
  },
  {
    key: 'front-office:room-move',
    label: 'Execute Room Relocation',
    category: 'Front Office & Operations',
    description: 'Move in-house guests to different rooms with housekeeping and billing sync.',
    riskLevel: 'Elevated'
  },
  {
    key: 'front-office:wakeup-calls',
    label: 'Manage Automated Wake-Up Calls',
    category: 'Front Office & Operations',
    description: 'Schedule, monitor, and clear automated telephone wake-up calls.',
    riskLevel: 'Standard'
  },
  {
    key: 'front-office:manager-authority',
    label: 'Front Office Manager Master Authority',
    category: 'Front Office & Operations',
    description: 'Full administrative authority over room allocations, rate overrides, and night audit signoff.',
    riskLevel: 'Critical'
  },
  {
    key: 'front-office:supervisor-authority',
    label: 'Front Office Supervisor Authority',
    category: 'Front Office & Operations',
    description: 'Shift supervisory authority over room moves, keycard overrides, and cashier signoffs.',
    riskLevel: 'High'
  },
  {
    key: 'reservation:view',
    label: 'View Reservation Calendar & Inquiries',
    category: 'Front Office & Operations',
    description: 'Access reservation availability charts, group allotment blocks, and booking pipeline.',
    riskLevel: 'Standard'
  },
  {
    key: 'reservation:create',
    label: 'Create Advance & Group Reservations',
    category: 'Front Office & Operations',
    description: 'Book advance individual stays, group allotments, corporate reservations, and packages.',
    riskLevel: 'Standard'
  },
  {
    key: 'reservation:edit',
    label: 'Edit Reservation Dates & Plans',
    category: 'Front Office & Operations',
    description: 'Modify booking dates, room types, meal plan selections, and billing routing instructions.',
    riskLevel: 'Standard'
  },
  {
    key: 'reservation:cancel',
    label: 'Cancel Reservation & Release Rooms',
    category: 'Front Office & Operations',
    description: 'Cancel guaranteed and non-guaranteed bookings and release blocked rooms to inventory.',
    riskLevel: 'Elevated'
  },

  // Restaurant & Menu Management Permissions (with Add, Edit, Delete options)
  {
    key: 'restaurant:view',
    label: 'View Restaurant Tables & Floor Map',
    category: 'Restaurant & Menu Management',
    description: 'Access dining floor map, table statuses, seated guests, and live KOT timers.',
    riskLevel: 'Standard'
  },
  {
    key: 'restaurant:create',
    label: 'Create Restaurant Table Orders',
    category: 'Restaurant & Menu Management',
    description: 'Open table orders, generate digital KOTs, and fire kitchen tickets.',
    riskLevel: 'Standard'
  },
  {
    key: 'restaurant:edit',
    label: 'Edit Active Table Orders',
    category: 'Restaurant & Menu Management',
    description: 'Add or modify line items, kitchen instructions, and guest seat notes.',
    riskLevel: 'Standard'
  },
  {
    key: 'restaurant:pos',
    label: 'Restaurant Cashier POS Billing',
    category: 'Restaurant & Menu Management',
    description: 'Restaurant Cashier Permission: POS check settlements, take cash/card/MFS tender, and balance drawer.',
    riskLevel: 'Standard'
  },
  {
    key: 'restaurant:bill',
    label: 'Print Dining Bills & Split Checks',
    category: 'Restaurant & Menu Management',
    description: 'Print dining checks, split bills by seat or item, and issue official VAT receipts.',
    riskLevel: 'Standard'
  },
  {
    key: 'restaurant:discount',
    label: 'Authorize Table Discounts',
    category: 'Restaurant & Menu Management',
    description: 'Authorize dining promotions, beverage happy hour cuts, and courtesy food discounts.',
    riskLevel: 'High'
  },
  {
    key: 'restaurant:manager-control',
    label: 'Restaurant Manager Floor & Staff Authority',
    category: 'Restaurant & Menu Management',
    description: 'Restaurant Manager Permission: Oversee floor operations, layout, pricing, and cashier balances.',
    riskLevel: 'High'
  },
  {
    key: 'restaurant:supervisor-control',
    label: 'Restaurant Supervisor Floor Authority',
    category: 'Restaurant & Menu Management',
    description: 'Restaurant Supervisor Permission: Floor captaincy, KOT expediting, and table check transfers.',
    riskLevel: 'Elevated'
  },
  {
    key: 'menu:view',
    label: 'View Outlet Menus & Recipe Cards',
    category: 'Restaurant & Menu Management',
    description: 'View outlet food and beverage menus, category classifications, and recipe cards.',
    riskLevel: 'Standard'
  },
  {
    key: 'menu:create',
    label: 'Outlet Menu Adding Permission',
    category: 'Restaurant & Menu Management',
    description: 'Outlet Menu Adding Permission: Add new dishes, beverages, packages, and seasonal food categories.',
    riskLevel: 'Standard'
  },
  {
    key: 'menu:edit',
    label: 'Outlet Menu Edit Permission',
    category: 'Restaurant & Menu Management',
    description: 'Outlet Menu Edit Permission: Modify dish names, descriptions, allergens, dietary tags, and preparation notes.',
    riskLevel: 'Elevated'
  },
  {
    key: 'menu:delete',
    label: 'Outlet Menu Delete Permission',
    category: 'Restaurant & Menu Management',
    description: 'Outlet Menu Delete Permission: Archive or permanently delete menu items, modifiers, combos, and food categories.',
    riskLevel: 'High'
  },
  {
    key: 'menu:pricing',
    label: 'Modify Menu Pricing & Portion Tariffs',
    category: 'Restaurant & Menu Management',
    description: 'Configure dine-in prices, room service surcharges, portion tariffs, and happy hour rules.',
    riskLevel: 'High'
  },
  {
    key: 'menu:recipe-costing',
    label: 'Edit Recipe BOM & Food Costing',
    category: 'Restaurant & Menu Management',
    description: 'Configure raw material ingredient BOMs, sub-recipes, wastage factors, and portion cost targets.',
    riskLevel: 'High'
  },

  // Sales & Corporate Marketing Permissions
  {
    key: 'sales:view',
    label: 'View Corporate Clients & Leads',
    category: 'Sales & Corporate Marketing',
    description: 'Inspect corporate client accounts, travel agent portfolios, leads, and sales pipeline.',
    riskLevel: 'Standard'
  },
  {
    key: 'sales:create',
    label: 'Create Corporate Accounts & Leads',
    category: 'Sales & Corporate Marketing',
    description: 'Register corporate enterprises, institutional clients, and tour operators.',
    riskLevel: 'Standard'
  },
  {
    key: 'sales:edit',
    label: 'Edit Corporate Contracts & Tariffs',
    category: 'Sales & Corporate Marketing',
    description: 'Update corporate credit limits, negotiated room tariffs, and contract dates.',
    riskLevel: 'Elevated'
  },
  {
    key: 'sales:manager-contracts',
    label: 'Sales Manager Contract Authority',
    category: 'Sales & Corporate Marketing',
    description: 'Sales Manager Permission: Authorize corporate credit agreements, commission rates, and annual volume contracts.',
    riskLevel: 'High'
  },
  {
    key: 'sales:executive-leads',
    label: 'Sales Executive Lead Management',
    category: 'Sales & Corporate Marketing',
    description: 'Sales Executive Permission: Manage corporate inquiries, follow-ups, room block requests, and quotation drafting.',
    riskLevel: 'Standard'
  },

  // IT, Systems & Security Permissions
  {
    key: 'it:view',
    label: 'View IT Systems & Diagnostic Logs',
    category: 'IT, Systems & Security',
    description: 'IT Permission: Monitor server uptime, POS terminals, keycard encoders, and network status.',
    riskLevel: 'Standard'
  },
  {
    key: 'it:config',
    label: 'IT Hardware & Device Configuration',
    category: 'IT, Systems & Security',
    description: 'IT Permission: Map POS terminals, KOT printers, RFID keycard encoders, and PBX telephone trunks.',
    riskLevel: 'High'
  },
  {
    key: 'it:backup-restore',
    label: 'Database Backup & Restore Authority',
    category: 'IT, Systems & Security',
    description: 'IT Permission: Trigger manual/scheduled database backups, export dumps, and initiate restore points.',
    riskLevel: 'Critical'
  },
  {
    key: 'it:user-admin',
    label: 'IT User Credential Management',
    category: 'IT, Systems & Security',
    description: 'IT Permission: Provision staff user accounts, unlock locked profiles, and perform emergency password resets.',
    riskLevel: 'Critical'
  },
  {
    key: 'it:audit-logs',
    label: 'Inspect System Technical Audit Trail',
    category: 'IT, Systems & Security',
    description: 'IT Permission: Examine low-level system logs, IP addresses, failed logins, and database queries.',
    riskLevel: 'High'
  },
  {
    key: 'it:api-integrations',
    label: 'Manage External APIs & Webhooks',
    category: 'IT, Systems & Security',
    description: 'IT Permission: Configure payment gateway credentials, SMS gateways, and OTA channel manager webhooks.',
    riskLevel: 'Critical'
  },
  {
    key: 'security:view',
    label: 'View Security Gate Log & Incidents',
    category: 'IT, Systems & Security',
    description: 'Security Permission: Inspect visitor gate entries, vehicle parking logs, and daily security handover.',
    riskLevel: 'Standard'
  },
  {
    key: 'security:visitor-gate',
    label: 'Log Visitor & Vehicle Gate Passes',
    category: 'IT, Systems & Security',
    description: 'Security Permission: Issue gate passes, register contractor vehicles, and record visitor IDs.',
    riskLevel: 'Standard'
  },
  {
    key: 'security:keycard-audit',
    label: 'Audit Keycard Encoding & Revocation',
    category: 'IT, Systems & Security',
    description: 'Security Permission: Audit RFID keycard issuance history, track room entry logs, and revoke lost cards.',
    riskLevel: 'High'
  },
  {
    key: 'security:incident-log',
    label: 'File Security Incident Reports',
    category: 'IT, Systems & Security',
    description: 'Security Permission: Log property damage, lost & found security custody, CCTV reviews, and incident reports.',
    riskLevel: 'High'
  },
  {
    key: 'security:emergency',
    label: 'Trigger Emergency Safety Protocols',
    category: 'IT, Systems & Security',
    description: 'Security Permission: Initiate emergency property lockdowns, fire alarm tests, and evacuation rosters.',
    riskLevel: 'Critical'
  },

  // Human Resources & Payroll Permissions
  {
    key: 'hr:view',
    label: 'View Staff Directory & Rosters',
    category: 'Human Resources & Payroll',
    description: 'HR Permission: Access staff profiles, departmental rosters, emergency contacts, and attendance logs.',
    riskLevel: 'Standard'
  },
  {
    key: 'hr:create',
    label: 'Create Staff Profiles & Rosters',
    category: 'Human Resources & Payroll',
    description: 'HR Permission: Register new staff members, configure employee IDs, and draft shift rosters.',
    riskLevel: 'Standard'
  },
  {
    key: 'hr:edit',
    label: 'Edit Staff Records & Shift Rosters',
    category: 'Human Resources & Payroll',
    description: 'HR Permission: Update employee job designations, salary bands, shift schedules, and department transfers.',
    riskLevel: 'Elevated'
  },
  {
    key: 'hr:attendance',
    label: 'Manage Biometric Attendance',
    category: 'Human Resources & Payroll',
    description: 'HR Permission: Sync and reconcile biometric fingerprint/face attendance, overtime, and late arrivals.',
    riskLevel: 'Standard'
  },
  {
    key: 'hr:leave-manage',
    label: 'Process Staff Leave & Substitutions',
    category: 'Human Resources & Payroll',
    description: 'HR Permission: Process leave requests, sick leave certificates, and duty shift substitution forms.',
    riskLevel: 'Standard'
  },
  {
    key: 'hr:payroll',
    label: 'Generate Departmental Payroll Sheets',
    category: 'Human Resources & Payroll',
    description: 'HR Permission: Compile monthly work hours, overtime, deductions, and generate payroll slips.',
    riskLevel: 'Critical'
  },

  // Inventory, Store & Procurement Permissions
  {
    key: 'procurement:view',
    label: 'View Purchase Requisitions & POs',
    category: 'Inventory & Procurement',
    description: 'Store & Procurement Permission: Access purchase requisition registers, vendor contracts, and outstanding POs.',
    riskLevel: 'Standard'
  },
  {
    key: 'procurement:create',
    label: 'Create Purchase Requisitions & POs',
    category: 'Inventory & Procurement',
    description: 'Store & Procurement Permission: Initiate departmental requisitions and generate draft vendor purchase orders.',
    riskLevel: 'Standard'
  },
  {
    key: 'procurement:edit',
    label: 'Edit Draft Purchase Orders',
    category: 'Inventory & Procurement',
    description: 'Store & Procurement Permission: Update vendor selection, item specifications, delivery schedules, and payment terms.',
    riskLevel: 'Standard'
  },
  {
    key: 'procurement:modify',
    label: 'Modify PO Pricing & Commercial Terms',
    category: 'Inventory & Procurement',
    description: 'Store & Procurement Permission: Alter purchase order unit costs, bulk discounts, and freight terms with suppliers.',
    riskLevel: 'High'
  },
  {
    key: 'procurement:approve',
    label: 'Authorize Purchase Orders & Vendor Bills',
    category: 'Inventory & Procurement',
    description: 'Store & Procurement Permission: Final signoff on purchase orders and approve vendor bills for payment.',
    riskLevel: 'Critical'
  },
  {
    key: 'inventory:view',
    label: 'View Stock Ledgers & Bin Cards',
    category: 'Inventory & Procurement',
    description: 'Store & Inventory Incharge: Inspect real-time warehouse stock levels, bin cards, reorder alerts, and valuation.',
    riskLevel: 'Standard'
  },
  {
    key: 'inventory:create',
    label: 'Create Inventory Items & Bins',
    category: 'Inventory & Procurement',
    description: 'Store & Inventory Incharge: Register raw food ingredients, beverages, housekeeping linen, chemicals, and bins.',
    riskLevel: 'Standard'
  },
  {
    key: 'inventory:edit',
    label: 'Edit Item Parameters & Safety Stock',
    category: 'Inventory & Procurement',
    description: 'Store & Inventory Incharge: Update safety stock thresholds, reorder points, economic order quantity, and storage bins.',
    riskLevel: 'Standard'
  },
  {
    key: 'inventory:grn',
    label: 'Receive Goods Intake (GRN Verification)',
    category: 'Inventory & Procurement',
    description: 'Store & Inventory Incharge: Post Goods Received Notes (GRN), verify supplier delivery challans, and record intake.',
    riskLevel: 'Standard'
  },
  {
    key: 'inventory:issue',
    label: 'Post Store Issue Slips to Departments',
    category: 'Inventory & Procurement',
    description: 'Store & Inventory Incharge: Issue store materials to Kitchen, Bar, Housekeeping, Maintenance, and Outlets.',
    riskLevel: 'Standard'
  },
  {
    key: 'inventory:count',
    label: 'Conduct Physical Stock Counts',
    category: 'Inventory & Procurement',
    description: 'Store & Inventory Incharge: Conduct periodic physical inventory counts, cycle counts, and stocktaking.',
    riskLevel: 'Standard'
  },
  {
    key: 'inventory:modify',
    label: 'Modify Physical Stock Adjustments',
    category: 'Inventory & Procurement',
    description: 'Store & Inventory Incharge: Post stock variance adjustments, spoilage logs, and damaged material write-offs.',
    riskLevel: 'High'
  },
  {
    key: 'inventory:incharge-authority',
    label: 'Store & Inventory Incharge Authority',
    category: 'Inventory & Procurement',
    description: 'Store & Inventory Incharge Permission: Complete central warehouse custody, inter-store dispatch, and inventory ledger authority.',
    riskLevel: 'High'
  },

  // Finance & General Ledger Permissions
  {
    key: 'finance:view',
    label: 'View General Ledger & Accounts',
    category: 'Finance & General Ledger',
    description: 'Account Executive & Manager: View Chart of Accounts, trial balances, balance sheets, profit & loss, and cash books.',
    riskLevel: 'Standard'
  },
  {
    key: 'finance:create',
    label: 'Create Journal & Payment Vouchers',
    category: 'Finance & General Ledger',
    description: 'Account Executive & Manager: Draft journal vouchers, cash/bank payment vouchers, and guest refund vouchers.',
    riskLevel: 'Elevated'
  },
  {
    key: 'finance:edit',
    label: 'Edit Draft Accounting Vouchers',
    category: 'Finance & General Ledger',
    description: 'Account Executive & Manager: Modify accounting voucher narratives, debit/credit ledger mappings, and cost centers.',
    riskLevel: 'Elevated'
  },
  {
    key: 'finance:modify',
    label: 'Modify Chart of Accounts & GL',
    category: 'Finance & General Ledger',
    description: 'Account Manager: Create ledger heads, sub-ledgers, financial period locks, and tax percentage schedules.',
    riskLevel: 'Critical'
  },
  {
    key: 'finance:post',
    label: 'Post & Authorize Financial Vouchers',
    category: 'Finance & General Ledger',
    description: 'Account Executive & Manager: Post draft vouchers to permanent General Ledger books and update trial balance.',
    riskLevel: 'High'
  },
  {
    key: 'finance:manager-approval',
    label: 'Account Manager Financial Authority',
    category: 'Finance & General Ledger',
    description: 'Account Manager Permission: Authorize major payments, bank reconciliations, VAT submissions, and financial closing.',
    riskLevel: 'Critical'
  },
  {
    key: 'finance:executive-entry',
    label: 'Account Executive Daily Processing',
    category: 'Finance & General Ledger',
    description: 'Account Executive Permission: Day-to-day accounts receivable/payable processing, invoice verification, and bank slips.',
    riskLevel: 'Standard'
  },

  // Housekeeping & Maintenance Permissions
  {
    key: 'housekeeping:view',
    label: 'View Room Cleaning Board & Floor Status',
    category: 'Housekeeping & Maintenance',
    description: 'Housekeeping Permission: Access room cleaning status matrix (Clean, Dirty, Inspected, OOO) across all floors.',
    riskLevel: 'Standard'
  },
  {
    key: 'housekeeping:edit',
    label: 'Update Room Cleaning Status',
    category: 'Housekeeping & Maintenance',
    description: 'Housekeeping Permission: Mark rooms as Dirty, Cleaning, Clean, or Touch Up from mobile/desktop.',
    riskLevel: 'Standard'
  },
  {
    key: 'housekeeping:inspect',
    label: 'Sign Off on Room Inspections',
    category: 'Housekeeping & Maintenance',
    description: 'Housekeeping Permission: Inspect cleaned rooms and release them to Front Office as Ready for Check-In.',
    riskLevel: 'Standard'
  },
  {
    key: 'housekeeping:linen',
    label: 'Manage Linen Stock & Laundry Cycles',
    category: 'Housekeeping & Maintenance',
    description: 'Housekeeping Permission: Track bedsheets, duvet covers, towels, laundry shipments, and lost & found.',
    riskLevel: 'Standard'
  },
  {
    key: 'housekeeping:minibar',
    label: 'Record Minibar Restocking & Supplies',
    category: 'Housekeeping & Maintenance',
    description: 'Housekeeping Permission: Log minibar consumption, bathroom amenities replenishment, and guest supplies.',
    riskLevel: 'Standard'
  },

  // Audit, Compliance & Reports Permissions
  {
    key: 'audit:view',
    label: 'View Independent Audit Logs & Transactions',
    category: 'Audit, Compliance & Reports',
    description: 'Auditor Permission: Read-only access to all transactions, cashier folios, vouchers, and audit trails.',
    riskLevel: 'Standard'
  },
  {
    key: 'audit:void-logs',
    label: 'Inspect Bill Void & Payment Reversal Logs',
    category: 'Audit, Compliance & Reports',
    description: 'Auditor Permission: Inspect all voided folios, deleted KOT items, cancelled tax invoices, and reason logs.',
    riskLevel: 'Standard'
  },
  {
    key: 'audit:rate-overrides',
    label: 'Audit Room Rate Overrides & Complimentary',
    category: 'Audit, Compliance & Reports',
    description: 'Auditor Permission: Audit rooms sold below BAR, complimentary stays, and manager rate reductions.',
    riskLevel: 'Standard'
  },
  {
    key: 'audit:cash-count',
    label: 'Conduct Surprise Cash Drawer Counts',
    category: 'Audit, Compliance & Reports',
    description: 'Auditor Permission: Execute unannounced cash drawer counts and certify shift handover floats.',
    riskLevel: 'Elevated'
  },
  {
    key: 'audit:export',
    label: 'Export Audit Trails & Compliance Reports',
    category: 'Audit, Compliance & Reports',
    description: 'Auditor Permission: Export statutory tax audits, NBR VAT books, and transaction logs to Excel/PDF.',
    riskLevel: 'Elevated'
  },

  // Administration & Overrides
  {
    key: 'admin:users-manage',
    label: 'Manage Staff User Accounts',
    category: 'Administration & Overrides',
    description: 'Create staff logins, reset credentials, lock accounts, and assign roles.',
    riskLevel: 'Critical'
  },
  {
    key: 'admin:roles-manage',
    label: 'Manage Roles & Permission Groups',
    category: 'Administration & Overrides',
    description: 'Create security roles, customize permission packages, and define scopes.',
    riskLevel: 'Critical'
  },
  {
    key: 'admin:custom-perms',
    label: 'Assign Individual User Overrides',
    category: 'Administration & Overrides',
    description: 'Grant or deny specific permissions individually to single user accounts.',
    riskLevel: 'Critical'
  },
  {
    key: 'admin:approvals-manage',
    label: 'Configure Approval Rules & Thresholds',
    category: 'Administration & Overrides',
    description: 'Set monetary limits, multi-tier signature rules, and authorized approvers.',
    riskLevel: 'Critical'
  },
  {
    key: 'admin:departments-manage',
    label: 'Manage Departments & Cost Centers',
    category: 'Administration & Overrides',
    description: 'Configure property departments, cost centers, and reporting lines.',
    riskLevel: 'High'
  },
  {
    key: 'admin:outlets-manage',
    label: 'Manage Outlets & POS Terminals',
    category: 'Administration & Overrides',
    description: 'Configure revenue centers, restaurants, bars, banquets, and POS points.',
    riskLevel: 'High'
  },
  {
    key: 'admin:system-settings',
    label: 'Configure Global System Settings',
    category: 'Administration & Overrides',
    description: 'Modify property profile, VAT 15%, Service Charge 10%, and document prefixes.',
    riskLevel: 'Critical'
  },
  {
    key: 'night-audit:run',
    label: 'Run 06:00 AM Night Audit Sequence',
    category: 'Administration & Overrides',
    description: 'Post automatic room charges, roll business date, and generate daily revenue packs.',
    riskLevel: 'Critical'
  },
  {
    key: 'reports:export',
    label: 'Export Reports to Excel / PDF',
    category: 'Administration & Overrides',
    description: 'Download sensitive financial and audit reports to CSV, XLS, and PDF format.',
    riskLevel: 'Elevated'
  },
  {
    key: 'override:checkout-balance',
    label: 'Override Checkout with Outstanding Due',
    category: 'Administration & Overrides',
    description: 'Allow departing guest to check out while transferring balance to City Ledger.',
    riskLevel: 'Critical'
  },
  {
    key: 'override:room-lock',
    label: 'Override Room Maintenance Lock',
    category: 'Administration & Overrides',
    description: 'Assign rooms that are marked Out of Order (OOO) or Under Maintenance.',
    riskLevel: 'High'
  }
];

export const DEFAULT_APPROVAL_RULES: ApprovalRule[] = [
  {
    id: 'rule-po-1',
    ruleCode: 'APR-PO-01',
    name: 'Purchase Order Standard Authorization',
    category: 'Procurement',
    actionType: 'PO Approval',
    minThreshold: 25000,
    maxThreshold: 100000,
    requiredRoleIds: ['role-proc-mgr', 'role-finance-mgr'],
    requiresTwoSignatures: false,
    active: true,
    description: 'Purchase Orders between ৳25,000 and ৳100,000 require Procurement Manager or Finance Manager approval.'
  },
  {
    id: 'rule-po-2',
    ruleCode: 'APR-PO-02',
    name: 'Major Capital Procurement Authorization',
    category: 'Procurement',
    actionType: 'PO Approval',
    minThreshold: 100000,
    requiredRoleIds: ['role-gm', 'role-super-admin'],
    requiresTwoSignatures: true,
    active: true,
    description: 'Purchase Orders exceeding ৳100,000 require dual executive signatures (General Manager + Finance Manager).'
  },
  {
    id: 'rule-resettle-1',
    ruleCode: 'APR-RST-01',
    name: 'Settled Bill Reopening & Resettlement',
    category: 'Billing',
    actionType: 'Bill Resettle',
    minThreshold: 0,
    requiredRoleIds: ['role-fo-mgr', 'role-finance-mgr', 'role-gm'],
    requiresTwoSignatures: false,
    active: true,
    description: 'Any change in payment method or charge adjustments on settled folios requires Supervisor / Manager authorization.'
  },
  {
    id: 'rule-void-bill-1',
    ruleCode: 'APR-VOID-01',
    name: 'Official Bill & Tax Invoice Voiding',
    category: 'Billing',
    actionType: 'Bill Void',
    minThreshold: 0,
    requiredRoleIds: ['role-finance-mgr', 'role-gm', 'role-super-admin'],
    requiresTwoSignatures: true,
    active: true,
    description: 'Voiding closed folios or tax invoices requires Finance Head and General Manager dual sign-off.'
  },
  {
    id: 'rule-void-pmt-1',
    ruleCode: 'APR-VOID-PMT',
    name: 'Cashier Payment Void & Reversal',
    category: 'Payment',
    actionType: 'Payment Void',
    minThreshold: 0,
    requiredRoleIds: ['role-finance-mgr', 'role-fo-mgr', 'role-gm'],
    requiresTwoSignatures: false,
    active: true,
    description: 'Voiding recorded guest payments (Cash, Card, MFS) requires Accounts / Duty Manager authorization.'
  },
  {
    id: 'rule-refund-1',
    ruleCode: 'APR-REFUND-01',
    name: 'Guest Payment Refund Authorization',
    category: 'Payment',
    actionType: 'Payment Refund',
    minThreshold: 5000,
    requiredRoleIds: ['role-finance-mgr', 'role-gm'],
    requiresTwoSignatures: true,
    active: true,
    description: 'Guest cash or gateway refunds exceeding ৳5,000 require dual signature of Finance Manager and GM.'
  },
  {
    id: 'rule-disc-1',
    ruleCode: 'APR-DISC-01',
    name: 'Courtesy & Managerial Discount Authorization',
    category: 'Discount',
    actionType: 'Folio Discount',
    minThreshold: 5000,
    requiredRoleIds: ['role-fo-mgr', 'role-rest-mgr', 'role-gm'],
    requiresTwoSignatures: false,
    active: true,
    description: 'Discounts exceeding ৳5,000 or 10% on room / dining bills require Department Manager authorization.'
  },
  {
    id: 'rule-credit-1',
    ruleCode: 'APR-CRD-01',
    name: 'Corporate Credit Limit Override',
    category: 'Credit Limit',
    actionType: 'Credit Limit Override',
    minThreshold: 50000,
    requiredRoleIds: ['role-finance-mgr', 'role-gm'],
    requiresTwoSignatures: false,
    active: true,
    description: 'Posting charges to corporate City Ledger exceeding preset credit limit requires Finance Manager sign-off.'
  },
  {
    id: 'rule-exp-1',
    ruleCode: 'APR-EXP-01',
    name: 'Petty Cash & Expense Voucher Approval',
    category: 'Expense',
    actionType: 'Expense Voucher',
    minThreshold: 10000,
    requiredRoleIds: ['role-finance-mgr'],
    requiresTwoSignatures: false,
    active: true,
    description: 'Petty cash disbursement vouchers above ৳10,000 require Head of Accounts authorization.'
  }
];

export const DEFAULT_DEPARTMENTS: DepartmentDef[] = [
  { id: 'dept-1', code: 'CC-101', name: 'Front Office', headName: 'Shamima Akter', headEmail: 'fom@cculbresort.com', costCenterCode: 'CC-101', staffCount: 14, active: true },
  { id: 'dept-2', code: 'CC-102', name: 'Housekeeping', headName: 'Rasheda Begum', headEmail: 'housekeeping.head@cculbresort.com', costCenterCode: 'CC-102', staffCount: 22, active: true },
  { id: 'dept-3', code: 'CC-201', name: 'Restaurant', headName: 'Kazi Farhan', headEmail: 'dining.mgr@cculbresort.com', costCenterCode: 'CC-201', staffCount: 28, active: true },
  { id: 'dept-4', code: 'CC-202', name: 'Bar & Lounge', headName: 'Tanvir Hossain', headEmail: 'bar.supervisor@cculbresort.com', costCenterCode: 'CC-202', staffCount: 8, active: true },
  { id: 'dept-5', code: 'CC-203', name: 'Banquet & Convention', headName: 'Mustafa Kamal', headEmail: 'banquet.mgr@cculbresort.com', costCenterCode: 'CC-203', staffCount: 16, active: true },
  { id: 'dept-6', code: 'CC-301', name: 'Recreation & Activities', headName: 'Zubair Ahmed', headEmail: 'activities@cculbresort.com', costCenterCode: 'CC-301', staffCount: 10, active: true },
  { id: 'dept-7', code: 'CC-302', name: 'Amenities & Spa', headName: 'Sabrina Noor', headEmail: 'spa@cculbresort.com', costCenterCode: 'CC-302', staffCount: 6, active: true },
  { id: 'dept-8', code: 'CC-401', name: 'Procurement & Stores', headName: 'Enamul Haque', headEmail: 'procurement@cculbresort.com', costCenterCode: 'CC-401', staffCount: 7, active: true },
  { id: 'dept-9', code: 'CC-402', name: 'Inventory', headName: 'Kamrul Hasan', headEmail: 'central.store@cculbresort.com', costCenterCode: 'CC-402', staffCount: 9, active: true },
  { id: 'dept-10', code: 'CC-205', name: 'Kitchen / Culinary', headName: 'Chef Mohammad Ali', headEmail: 'executive.chef@cculbresort.com', costCenterCode: 'CC-205', staffCount: 32, active: true },
  { id: 'dept-11', code: 'CC-501', name: 'Finance & Accounts', headName: 'Nasir Uddin FCMA', headEmail: 'finance.head@cculbresort.com', costCenterCode: 'CC-501', staffCount: 11, active: true },
  { id: 'dept-12', code: 'CC-601', name: 'Sales & Marketing', headName: 'Afroza Sultana', headEmail: 'sales.head@cculbresort.com', costCenterCode: 'CC-601', staffCount: 8, active: true },
  { id: 'dept-13', code: 'CC-701', name: 'Human Resources', headName: 'Mahbubur Rahman', headEmail: 'hr.head@cculbresort.com', costCenterCode: 'CC-701', staffCount: 5, active: true },
  { id: 'dept-14', code: 'CC-801', name: 'Engineering & Maintenance', headName: 'Engr. Tariqul Islam', headEmail: 'maintenance.lead@cculbresort.com', costCenterCode: 'CC-801', staffCount: 15, active: true },
  { id: 'dept-15', code: 'CC-901', name: 'Executive Management', headName: 'Brig. Gen. (Retd) K. Ahmed', headEmail: 'gm@cculbresort.com', costCenterCode: 'CC-901', staffCount: 4, active: true },
  { id: 'dept-16', code: 'CC-902', name: 'Internal Audit', headName: 'Advocate N. H. Chowdhury', headEmail: 'lead.auditor@cculb.org', costCenterCode: 'CC-902', staffCount: 3, active: true },
  { id: 'dept-17', code: 'CC-702', name: 'Information Technology', headName: 'Engr. Subrata Roy', headEmail: 'it.head@cculbresort.com', costCenterCode: 'CC-702', staffCount: 6, active: true },
  { id: 'dept-18', code: 'CC-802', name: 'Security & Safety', headName: 'Major (Retd) Anwarul Kabir', headEmail: 'security.head@cculbresort.com', costCenterCode: 'CC-802', staffCount: 18, active: true }
];

export const DEFAULT_OUTLETS: OutletDef[] = [
  { id: 'out-1', code: 'OUT-01', name: 'Padma Multi-Cuisine Restaurant', department: 'Restaurant', type: 'Restaurant', revenueGL: '4020 - Food & Beverage Revenue', posTerminalCount: 3, active: true },
  { id: 'out-2', code: 'OUT-02', name: 'Meghna Sunset Bar & Lounge', department: 'Bar & Lounge', type: 'Bar', revenueGL: '4025 - Beverage & Bar Sales', posTerminalCount: 2, active: true },
  { id: 'out-3', code: 'OUT-03', name: 'Jamuna Grand Convention Hall', department: 'Banquet & Convention', type: 'Banquet', revenueGL: '4030 - Banquet & Event Rental', posTerminalCount: 2, active: true },
  { id: 'out-4', code: 'OUT-04', name: 'Surma International Conference Hall', department: 'Banquet & Convention', type: 'Banquet', revenueGL: '4030 - Banquet & Event Rental', posTerminalCount: 1, active: true },
  { id: 'out-5', code: 'OUT-05', name: 'Shitalakshya VIP Boardroom', department: 'Banquet & Convention', type: 'Banquet', revenueGL: '4030 - Banquet & Event Rental', posTerminalCount: 1, active: true },
  { id: 'out-6', code: 'OUT-06', name: 'Blue Water Spa & Wellness Pavilion', department: 'Amenities & Spa', type: 'Spa', revenueGL: '4045 - Spa & Wellness Revenue', posTerminalCount: 1, active: true },
  { id: 'out-7', code: 'OUT-07', name: 'Resort Sports Zone & Boat Pier', department: 'Recreation & Activities', type: 'Recreation', revenueGL: '4040 - Recreation & Sports Revenue', posTerminalCount: 2, active: true },
  { id: 'out-8', code: 'OUT-08', name: 'Front Desk Main Cashier Desk', department: 'Front Office', type: 'Front Desk', revenueGL: '1040 - Guest Ledger Clearing', posTerminalCount: 3, active: true }
];

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: 'role-super-admin',
    name: 'Super Administrator',
    department: 'Executive Management',
    description: 'Unrestricted enterprise access to all resort modules, financial books, settings, and audits.',
    isSystem: true,
    defaultDataScope: 'All Properties',
    allowedModules: [
      'dashboard', 'front-office', 'housekeeping', 'restaurant', 'bar', 'banquet',
      'activities', 'amenities', 'procurement', 'inventory', 'menu-management',
      'finance', 'sales-marketing', 'crm', 'hr', 'reports', 'administration'
    ],
    permissions: ['*']
  },
  {
    id: 'role-gm',
    name: 'General Manager',
    department: 'Executive Management',
    description: 'Executive management oversight, full reporting access, approvals, and operational dashboards.',
    isSystem: true,
    defaultDataScope: 'Own Property',
    allowedModules: [
      'dashboard', 'front-office', 'housekeeping', 'restaurant', 'bar', 'banquet',
      'activities', 'amenities', 'procurement', 'inventory', 'menu-management',
      'finance', 'sales-marketing', 'crm', 'hr', 'reports', 'administration'
    ],
    permissions: [
      'view:*', 'approve:*', 'export:*', 'print:*',
      'Reports.View', 'Reports.Management.View', 'Reports.Financial.View',
      'Reports.ExportExcel', 'Reports.ExportPDF', 'Reports.Print'
    ]
  },
  {
    id: 'role-accounts-mgr',
    name: 'Account Manager',
    department: 'Finance & Accounts',
    description: 'Head of Accounts oversight, full control over General Ledger, AR, AP, Cash/Bank, Tax, and Financial Statements.',
    isSystem: true,
    defaultDataScope: 'Own Property',
    allowedModules: ['dashboard', 'finance', 'procurement', 'reports', 'administration'],
    permissions: [
      'finance:*', 'billing:view', 'billing:bill-resettle', 'approvals:bill-void',
      'approvals:payment-void', 'approvals:refund', 'approvals:expense', 'approvals:credit-limit',
      'Reports.AR.View', 'Reports.AP.View', 'Reports.GL.View', 'Reports.Financial.View',
      'Reports.Tax.View', 'Reports.ExportExcel', 'Reports.ExportPDF', 'Reports.Print'
    ]
  },
  {
    id: 'role-finance-mgr',
    name: 'Finance Manager',
    department: 'Finance & Accounts',
    description: 'Strategic financial planning, balance sheet closing, corporate tax compliance, and multi-currency audit.',
    isSystem: true,
    defaultDataScope: 'Own Property',
    allowedModules: ['dashboard', 'finance', 'procurement', 'reports', 'administration'],
    permissions: [
      'finance:*', 'billing:view', 'billing:bill-resettle', 'procurement:approve',
      'Reports.AR.View', 'Reports.AP.View', 'Reports.GL.View', 'Reports.Financial.View',
      'Reports.Tax.View', 'Reports.ExportExcel', 'Reports.ExportPDF', 'Reports.Print'
    ]
  },
  {
    id: 'role-accounts-exec',
    name: 'Account Executive',
    department: 'Finance & Accounts',
    description: 'Daily accounts processing, journal voucher entries, invoice verification, AR collections, and bank slips.',
    isSystem: false,
    defaultDataScope: 'Own Department',
    allowedModules: ['dashboard', 'finance', 'reports'],
    permissions: [
      'finance:view', 'finance:create', 'finance:edit', 'finance:post', 'finance:executive-entry',
      'billing:view', 'Reports.AR.View', 'Reports.AP.View', 'Reports.GL.View', 'Reports.Print'
    ]
  },
  {
    id: 'role-fo-mgr',
    name: 'Front Office Manager',
    department: 'Front Office',
    description: 'Front Office Manager Authority: Room allocations, rate overrides, billing transfers, night audit, and shift roster.',
    isSystem: true,
    defaultDataScope: 'Own Department',
    allowedModules: ['dashboard', 'front-office', 'crm', 'reports', 'administration'],
    permissions: [
      'front-office:*', 'reservation:*', 'billing:*', 'crm:*', 'night-audit:run',
      'approvals:rate-override', 'approvals:complimentary', 'override:room-lock',
      'override:checkout-balance', 'Reports.FrontOffice.View', 'Reports.ExportExcel', 'Reports.Print'
    ]
  },
  {
    id: 'role-fo-sup',
    name: 'Front Office Supervisor',
    department: 'Front Office',
    description: 'Front Office Supervisor Authority: Shift supervision, room relocation, cashier reconciliations, and VIP arrival handling.',
    isSystem: false,
    defaultDataScope: 'Own Department',
    allowedModules: ['dashboard', 'front-office', 'crm', 'reports'],
    permissions: [
      'front-office:view', 'front-office:create', 'front-office:edit', 'front-office:checkin',
      'front-office:checkout', 'front-office:room-assignment', 'front-office:room-move',
      'front-office:wakeup-calls', 'front-office:supervisor-authority',
      'reservation:view', 'reservation:create', 'reservation:edit',
      'billing:view', 'billing:post-charge', 'billing:settle', 'billing:print',
      'cashier:reconcile-void', 'Reports.FrontOffice.View', 'Reports.Print'
    ]
  },
  {
    id: 'role-fo-exec',
    name: 'Front Office Executive',
    department: 'Front Office',
    description: 'Front Office Executive Permission: Guest arrivals, departures, room assignments, key issuance, and folio settlements.',
    isSystem: false,
    defaultDataScope: 'Own Records',
    allowedModules: ['dashboard', 'front-office', 'crm', 'reports'],
    permissions: [
      'front-office:view', 'front-office:create', 'front-office:edit', 'front-office:checkin',
      'front-office:checkout', 'front-office:room-assignment', 'front-office:room-move',
      'front-office:wakeup-calls', 'reservation:view', 'reservation:create',
      'billing:view', 'billing:post-charge', 'billing:settle', 'billing:print',
      'Reports.FrontOffice.View', 'Reports.Print'
    ]
  },
  {
    id: 'role-res-exec',
    name: 'Reservation Executive',
    department: 'Front Office',
    description: 'Reservation Permission: Handles telephone bookings, OTA channels, group room blocks, and advance deposits.',
    isSystem: false,
    defaultDataScope: 'Own Department',
    allowedModules: ['dashboard', 'front-office', 'crm', 'reports'],
    permissions: [
      'reservation:view', 'reservation:create', 'reservation:edit', 'reservation:cancel',
      'front-office:view', 'front-office:create', 'front-office:edit', 'crm:view',
      'Reports.FrontOffice.View', 'Reports.Print'
    ]
  },
  {
    id: 'role-sales-mgr',
    name: 'Sales Manager',
    department: 'Sales & Marketing',
    description: 'Sales Manager Authority: Corporate corporate contracts, travel agent commissions, volume deals, and pipeline revenue.',
    isSystem: true,
    defaultDataScope: 'Own Department',
    allowedModules: ['dashboard', 'sales-marketing', 'crm', 'reports'],
    permissions: [
      'sales:*', 'crm:*', 'approvals:discount',
      'Reports.Sales.View', 'Reports.ExportExcel', 'Reports.Print'
    ]
  },
  {
    id: 'role-sales-exec',
    name: 'Sales Executive',
    department: 'Sales & Marketing',
    description: 'Sales Executive Permission: Client follow-ups, inquiry logging, corporate room blocks, and quotation drafting.',
    isSystem: false,
    defaultDataScope: 'Own Records',
    allowedModules: ['dashboard', 'sales-marketing', 'crm'],
    permissions: [
      'sales:view', 'sales:create', 'sales:edit', 'sales:executive-leads',
      'crm:view', 'Reports.Sales.View', 'Reports.Print'
    ]
  },
  {
    id: 'role-rest-mgr',
    name: 'Restaurant Manager',
    department: 'Restaurant',
    description: 'Restaurant Manager Authority: Dining floor supervision, menu engineering, table turnover, pricing, and cashier closing.',
    isSystem: true,
    defaultDataScope: 'Own Outlet',
    allowedModules: ['dashboard', 'restaurant', 'menu-management', 'reports'],
    permissions: [
      'restaurant:*', 'menu:*', 'billing:post-charge',
      'Reports.Restaurant.View', 'Reports.Menu.View', 'Reports.Print'
    ]
  },
  {
    id: 'role-rest-sup',
    name: 'Restaurant Supervisor',
    department: 'Restaurant',
    description: 'Restaurant Supervisor Permission: Floor service captaincy, KOT expediting, table check transfers, and bill split oversight.',
    isSystem: false,
    defaultDataScope: 'Own Outlet',
    allowedModules: ['dashboard', 'restaurant'],
    permissions: [
      'restaurant:view', 'restaurant:create', 'restaurant:edit', 'restaurant:discount',
      'restaurant:supervisor-control', 'pos:check-void', 'menu:view',
      'billing:post-charge', 'billing:print'
    ]
  },
  {
    id: 'role-rest-cashier',
    name: 'Restaurant Cashier',
    department: 'Restaurant',
    description: 'Restaurant Cashier Permission: Takes POS orders, settles dining bills, takes cash/card/MFS tender, and prints tax receipts.',
    isSystem: false,
    defaultDataScope: 'Own Outlet',
    allowedModules: ['dashboard', 'restaurant', 'reports'],
    permissions: [
      'restaurant:view', 'restaurant:create', 'restaurant:pos', 'restaurant:bill',
      'billing:settle', 'billing:print', 'menu:view', 'Reports.Restaurant.View'
    ]
  },
  {
    id: 'role-menu-mgr',
    name: 'Outlet Menu Manager',
    department: 'Restaurant',
    description: 'Outlet Menu Authority: Adding dishes, editing ingredients, deleting obsolete items, configuring prices & recipe BOM costing.',
    isSystem: false,
    defaultDataScope: 'Own Outlet',
    allowedModules: ['dashboard', 'restaurant', 'menu-management', 'reports'],
    permissions: [
      'menu:view', 'menu:create', 'menu:edit', 'menu:delete', 'menu:pricing',
      'menu:recipe-costing', 'restaurant:view', 'Reports.Menu.View', 'Reports.Print'
    ]
  },
  {
    id: 'role-proc-mgr',
    name: 'Store & Procurement Manager',
    department: 'Procurement & Stores',
    description: 'Store & Procurement Permission: Purchase requisitions, vendor POs, GRN inspection, supplier rate contracts, and store issues.',
    isSystem: true,
    defaultDataScope: 'Own Department',
    allowedModules: ['dashboard', 'procurement', 'inventory', 'reports'],
    permissions: [
      'procurement:*', 'inventory:view', 'approvals:po',
      'Reports.Procurement.View', 'Reports.Inventory.View', 'Reports.Print', 'Reports.ExportExcel'
    ]
  },
  {
    id: 'role-proc-exec',
    name: 'Procurement Executive',
    department: 'Procurement & Stores',
    description: 'Creates PO drafts, tracks RFQs, inspects incoming vendor shipments, and verifies supplier challans.',
    isSystem: false,
    defaultDataScope: 'Own Department',
    allowedModules: ['dashboard', 'procurement'],
    permissions: ['procurement:view', 'procurement:create', 'procurement:edit', 'inventory:view', 'Reports.Procurement.View', 'Reports.Print']
  },
  {
    id: 'role-store-incharge',
    name: 'Store Incharge / Inventory Incharge',
    department: 'Inventory',
    description: 'Store Incharge & Inventory Incharge Authority: Central warehouse custody, stock counts, inter-store transfers, and GRN verification.',
    isSystem: true,
    defaultDataScope: 'Own Department',
    allowedModules: ['dashboard', 'inventory', 'procurement', 'reports'],
    permissions: [
      'inventory:*', 'procurement:view', 'inventory:incharge-authority',
      'Reports.Inventory.View', 'Reports.Print', 'Reports.ExportExcel'
    ]
  },
  {
    id: 'role-store-mgr',
    name: 'Store Manager',
    department: 'Inventory',
    description: 'Warehouse stock control, inter-store transfers, stock audits, wastage logs, and valuation.',
    isSystem: true,
    defaultDataScope: 'Own Department',
    allowedModules: ['dashboard', 'inventory', 'procurement', 'reports'],
    permissions: [
      'inventory:*', 'procurement:view',
      'Reports.Inventory.View', 'Reports.Print', 'Reports.ExportExcel'
    ]
  },
  {
    id: 'role-storekeeper',
    name: 'Storekeeper',
    department: 'Inventory',
    description: 'Item receipts, physical counting, stock issue slips to departments, and bin tracking.',
    isSystem: false,
    defaultDataScope: 'Own Records',
    allowedModules: ['dashboard', 'inventory'],
    permissions: ['inventory:view', 'inventory:issue', 'inventory:count']
  },
  {
    id: 'role-it-mgr',
    name: 'IT Manager / Administrator',
    department: 'Information Technology',
    description: 'IT Manager Permission: System infrastructure, network security, user access control, database backups, and hardware interfaces.',
    isSystem: true,
    defaultDataScope: 'All Properties',
    allowedModules: ['dashboard', 'administration', 'reports'],
    permissions: [
      'it:*', 'admin:*', 'security:*', 'night-audit:run', 'reports:export',
      'Reports.Audit.View', 'Reports.Print'
    ]
  },
  {
    id: 'role-it-exec',
    name: 'IT Support Specialist',
    department: 'Information Technology',
    description: 'IT Support Permission: POS terminal mapping, keycard encoder troubleshooting, printer setups, and password resets.',
    isSystem: false,
    defaultDataScope: 'All Properties',
    allowedModules: ['dashboard', 'administration'],
    permissions: ['it:view', 'it:config', 'it:user-admin', 'admin:outlets-manage']
  },
  {
    id: 'role-hr-mgr',
    name: 'HR Manager',
    department: 'Human Resources',
    description: 'HR Manager Authority: Staff recruitment, departmental rosters, biometric attendance, leave approvals, and payroll processing.',
    isSystem: true,
    defaultDataScope: 'Own Department',
    allowedModules: ['dashboard', 'hr', 'administration', 'reports'],
    permissions: [
      'hr:*', 'admin:users-manage', 'approvals:leave',
      'Reports.HR.View', 'Reports.ExportExcel', 'Reports.Print'
    ]
  },
  {
    id: 'role-hr-exec',
    name: 'HR Executive',
    department: 'Human Resources',
    description: 'HR Executive Permission: Staff profile records, biometric attendance reconciliation, and roster duty tracking.',
    isSystem: false,
    defaultDataScope: 'Own Department',
    allowedModules: ['dashboard', 'hr', 'reports'],
    permissions: ['hr:view', 'hr:create', 'hr:edit', 'hr:attendance', 'hr:leave-manage', 'Reports.HR.View', 'Reports.Print']
  },
  {
    id: 'role-auditor',
    name: 'Auditor',
    department: 'Internal Audit',
    description: 'Auditor Permission: Independent audit view of all transactions, journal vouchers, void logs, price changes, and system history.',
    isSystem: true,
    defaultDataScope: 'All Properties',
    allowedModules: ['dashboard', 'reports', 'finance', 'inventory', 'administration'],
    permissions: [
      'audit:*', 'view:*', 'reports:*', 'Reports.Audit.View', 'Reports.Financial.View',
      'Reports.ExportExcel', 'Reports.ExportPDF', 'Reports.Print'
    ]
  },
  {
    id: 'role-hk-mgr',
    name: 'Housekeeping Manager',
    department: 'Housekeeping',
    description: 'Housekeeping Manager Authority: Room cleaning board, room inspection signoffs, linen stock, and minibar inventory control.',
    isSystem: true,
    defaultDataScope: 'Own Department',
    allowedModules: ['dashboard', 'housekeeping', 'amenities', 'reports'],
    permissions: [
      'housekeeping:*', 'amenities:*', 'override:room-lock',
      'Reports.Housekeeping.View', 'Reports.Amenity.View', 'Reports.Print'
    ]
  },
  {
    id: 'role-hk-exec',
    name: 'Housekeeping Executive',
    department: 'Housekeeping',
    description: 'Housekeeping Executive Permission: Room cleaning status updates, linen issues, and minibar replenishment logging.',
    isSystem: false,
    defaultDataScope: 'Own Records',
    allowedModules: ['dashboard', 'housekeeping'],
    permissions: ['housekeeping:view', 'housekeeping:edit', 'housekeeping:minibar', 'housekeeping:linen']
  },
  {
    id: 'role-security-mgr',
    name: 'Security Manager',
    department: 'Security & Safety',
    description: 'Security Manager Authority: Property safety, visitor gate access, keycard audit trail, incident logging, and emergency protocols.',
    isSystem: true,
    defaultDataScope: 'All Properties',
    allowedModules: ['dashboard', 'administration', 'reports'],
    permissions: ['security:*', 'front-office:view', 'Reports.Security.View', 'Reports.Print']
  },
  {
    id: 'role-security-officer',
    name: 'Security Officer',
    department: 'Security & Safety',
    description: 'Security Officer Permission: Gate pass logging, vehicle parking verification, visitor screening, and incident reports.',
    isSystem: false,
    defaultDataScope: 'Own Records',
    allowedModules: ['dashboard'],
    permissions: ['security:view', 'security:visitor-gate', 'security:incident-log']
  },
  {
    id: 'role-bar-mgr',
    name: 'Bar Manager',
    department: 'Bar & Lounge',
    description: 'Bar counter supervision, bottle inventory consumption, drink recipes, and beverage cost control.',
    isSystem: true,
    defaultDataScope: 'Own Outlet',
    allowedModules: ['dashboard', 'bar', 'menu-management', 'reports'],
    permissions: ['bar:*', 'menu:*', 'Reports.Bar.View', 'Reports.Print']
  },
  {
    id: 'role-bar-sup',
    name: 'Bar Supervisor',
    department: 'Bar & Lounge',
    description: 'Bar shift management, POS order dispatch, drink customization, and void authoring.',
    isSystem: false,
    defaultDataScope: 'Own Outlet',
    allowedModules: ['dashboard', 'bar'],
    permissions: ['bar:view', 'bar:pos', 'bar:void']
  },
  {
    id: 'role-banquet-mgr',
    name: 'Banquet Manager',
    department: 'Banquet & Convention',
    description: 'Banquet hall bookings, convention packages, function sheets, event billing, and catering.',
    isSystem: true,
    defaultDataScope: 'Own Department',
    allowedModules: ['dashboard', 'banquet', 'reports'],
    permissions: ['banquet:*', 'Reports.Banquet.View', 'Reports.Print']
  },
  {
    id: 'role-banquet-exec',
    name: 'Banquet Executive',
    department: 'Banquet & Convention',
    description: 'Event setups, function sheet tracking, client coordination, and hall scheduling.',
    isSystem: false,
    defaultDataScope: 'Own Department',
    allowedModules: ['dashboard', 'banquet'],
    permissions: ['banquet:view', 'banquet:create', 'banquet:edit']
  },
  {
    id: 'role-act-mgr',
    name: 'Activities Manager',
    department: 'Recreation & Activities',
    description: 'Resort amenities, pool, sports, games, boat rides, wellness bookings, and equipment rentals.',
    isSystem: true,
    defaultDataScope: 'Own Department',
    allowedModules: ['dashboard', 'activities', 'amenities', 'reports'],
    permissions: ['activities:*', 'amenities:*', 'Reports.Activity.View', 'Reports.Print']
  },
  {
    id: 'role-report-viewer',
    name: 'Report Viewer',
    department: 'Executive Management',
    description: 'Read-only access to operational, financial, and analytical management reports.',
    isSystem: false,
    defaultDataScope: 'Own Property',
    allowedModules: ['dashboard', 'reports'],
    permissions: ['Reports.View', 'Reports.Print']
  }
];

export const INITIAL_STAFF_USERS: UserContext[] = [
  {
    id: 'usr-admin-1',
    name: 'Engr. Subrata Roy',
    email: 'admin@lesyncpms.com',
    roleId: 'role-super-admin',
    roleName: 'Super Admin',
    department: 'Executive Management',
    dataScope: 'All Properties',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'
  },
  {
    id: 'usr-it-1',
    name: 'Kazi Tanvir',
    email: 'it@lesyncpms.com',
    roleId: 'role-it-mgr',
    roleName: 'IT Manager / Administrator',
    department: 'Information Technology',
    dataScope: 'All Properties',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60'
  },
  {
    id: 'usr-res-1',
    name: 'Tahmina Akter',
    email: 'reservation@lesyncpms.com',
    roleId: 'role-res-exec',
    roleName: 'Reservation Executive',
    department: 'Front Office',
    dataScope: 'Own Department',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60'
  },
  {
    id: 'usr-fo-1',
    name: 'Farhan Ahmed',
    email: 'frontdesk@lesyncpms.com',
    roleId: 'role-fo-exec',
    roleName: 'Front Desk Executive',
    department: 'Front Office',
    dataScope: 'Own Department',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60'
  },
  {
    id: 'usr-acc-1',
    name: 'Sabrina Khan',
    email: 'accounts@lesyncpms.com',
    roleId: 'role-accounts-exec',
    roleName: 'Accounts Executive',
    department: 'Finance & Accounts',
    dataScope: 'All Properties',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=60'
  }
];

export const ALL_REPORT_CATEGORIES: ReportCategory[] = [
  'Front Office',
  'Housekeeping',
  'Restaurant',
  'Bar',
  'Banquet & Convention',
  'Activities',
  'Amenities',
  'Procurement',
  'Inventory',
  'Menu & Costing',
  'Sales & Marketing',
  'Accounts Receivable',
  'Accounts Payable',
  'General Ledger',
  'Financial Reports',
  'Tax & Compliance',
  'Management Reports',
  'Audit Reports'
];

export const DEFAULT_REPORT_ROLE_CONFIG: ReportRoleManagementConfig = {
  policyName: 'Strict Departmental Report Isolation Policy',
  strictDepartmentIsolation: true,
  onlyAccountsCanViewAll: true,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'System Security Policy',
  departments: {
    'Finance & Accounts': {
      department: 'Finance & Accounts',
      canViewAllDepartments: true,
      allowedCategories: [...ALL_REPORT_CATEGORIES],
      description: 'Enterprise Accounts Authority: Full access to all 18 departmental reports and general ledger books.',
      isSystemRule: true
    },
    'Executive Management': {
      department: 'Executive Management',
      canViewAllDepartments: true,
      allowedCategories: [...ALL_REPORT_CATEGORIES],
      description: 'Executive Management: Full resort operational oversight & audit access.',
      isSystemRule: true
    },
    'Internal Audit': {
      department: 'Internal Audit',
      canViewAllDepartments: true,
      allowedCategories: [...ALL_REPORT_CATEGORIES],
      description: 'Internal Audit: Enterprise compliance, revenue audit, and tax review.',
      isSystemRule: true
    },
    'Front Office': {
      department: 'Front Office',
      canViewAllDepartments: false,
      allowedCategories: ['Front Office'],
      description: 'Front Office reports only: Daily Flash, Occupancy, Guest Folios, Cashier Summary, Expected Check-ins/outs, Night Audit Summary.',
      isSystemRule: false
    },
    'Housekeeping': {
      department: 'Housekeeping',
      canViewAllDepartments: false,
      allowedCategories: ['Housekeeping'],
      description: 'Housekeeping reports only: Room Cleaning Schedules, Linen/Amenities, Maintenance Defects, Turndown Status.',
      isSystemRule: false
    },
    'Restaurant': {
      department: 'Restaurant',
      canViewAllDepartments: false,
      allowedCategories: ['Restaurant', 'Menu & Costing'],
      description: 'Restaurant reports only: Daily Dining Covers, Food Sales, Item Profitability, Void Orders, Recipe Costing.',
      isSystemRule: false
    },
    'Food & Beverage': {
      department: 'Food & Beverage',
      canViewAllDepartments: false,
      allowedCategories: ['Restaurant', 'Menu & Costing'],
      description: 'Food & Beverage reports only: Restaurant Dining and Recipe Costing.',
      isSystemRule: false
    },
    'Kitchen / Culinary': {
      department: 'Kitchen / Culinary',
      canViewAllDepartments: false,
      allowedCategories: ['Restaurant', 'Menu & Costing'],
      description: 'Kitchen & Culinary reports only: Recipe Costing and Culinary Production.',
      isSystemRule: false
    },
    'Bar & Lounge': {
      department: 'Bar & Lounge',
      canViewAllDepartments: false,
      allowedCategories: ['Bar'],
      description: 'Bar reports only: Beverage Sales, Liquor Consumption, Spillage Log, Happy Hour Audit.',
      isSystemRule: false
    },
    'Banquet & Convention': {
      department: 'Banquet & Convention',
      canViewAllDepartments: false,
      allowedCategories: ['Banquet & Convention'],
      description: 'Banquet reports only: Hall Utilization, Function Sheets, Banquet Revenue, Equipment Rentals.',
      isSystemRule: false
    },
    'Recreation & Activities': {
      department: 'Recreation & Activities',
      canViewAllDepartments: false,
      allowedCategories: ['Activities'],
      description: 'Activities reports only: Spa/Swimming/Sports Bookings, Facility Utilization, Rental Revenue.',
      isSystemRule: false
    },
    'Amenities & Spa': {
      department: 'Amenities & Spa',
      canViewAllDepartments: false,
      allowedCategories: ['Amenities'],
      description: 'Amenities reports only: Amenity Usage, Minibar, Kit Consumption.',
      isSystemRule: false
    },
    'Procurement & Stores': {
      department: 'Procurement & Stores',
      canViewAllDepartments: false,
      allowedCategories: ['Procurement'],
      description: 'Procurement reports only: Purchase Orders, GRN Log, Vendor Performance, Open PRs.',
      isSystemRule: false
    },
    'Inventory': {
      department: 'Inventory',
      canViewAllDepartments: false,
      allowedCategories: ['Inventory'],
      description: 'Inventory reports only: Stock Valuation, Wastage, Reorder Level Alerts, Stock Movements.',
      isSystemRule: false
    },
    'Sales & Marketing': {
      department: 'Sales & Marketing',
      canViewAllDepartments: false,
      allowedCategories: ['Sales & Marketing'],
      description: 'Sales reports only: Corporate Accounts, Promo Code Usage, Agent Commission.',
      isSystemRule: false
    },
    'Engineering & Maintenance': {
      department: 'Engineering & Maintenance',
      canViewAllDepartments: false,
      allowedCategories: ['Housekeeping'],
      description: 'Maintenance reports only: Room Defects and Asset Maintenance.',
      isSystemRule: false
    }
  },
  roleOverrides: {}
};

class RbacManager {
  private roles: RoleDefinition[] = [];
  private users: UserContext[] = [];
  private approvalRules: ApprovalRule[] = [];
  private departments: DepartmentDef[] = [];
  private outlets: OutletDef[] = [];
  private reportRoleConfig: ReportRoleManagementConfig;
  private activeUser: UserContext;
  private listeners: (() => void)[] = [];
  private userChangeListeners: ((user: UserContext) => void)[] = [];

  constructor() {
    let savedRoles: string | null = null;
    try {
      savedRoles = localStorage.getItem('cculb_roles_v1');
    } catch {}

    if (savedRoles) {
      try {
        const parsed: RoleDefinition[] = JSON.parse(savedRoles);
        const existingIds = new Set(parsed.map(r => r.id));
        const missingDefaults = DEFAULT_ROLES.filter(r => !existingIds.has(r.id));
        const updatedParsed = parsed.map(r => {
          const def = DEFAULT_ROLES.find(dr => dr.id === r.id);
          if (def && r.isSystem) {
            return { ...def, name: r.name || def.name };
          }
          return r;
        });
        this.roles = [...updatedParsed, ...missingDefaults];
      } catch (e) {
        this.roles = DEFAULT_ROLES;
      }
    } else {
      this.roles = DEFAULT_ROLES;
    }

    // Strictly ensure Super Administrator role definition contains all 17 system modules and wildcard '*'
    const ALL_SYSTEM_MODULES: MainModuleName[] = [
      'dashboard', 'front-office', 'housekeeping', 'restaurant', 'bar', 'banquet',
      'activities', 'amenities', 'procurement', 'inventory', 'menu-management',
      'finance', 'sales-marketing', 'crm', 'hr', 'reports', 'administration'
    ];
    this.roles = this.roles.map(r => {
      if (r.id === 'role-super-admin' || r.name.toLowerCase().includes('super admin') || r.name.toLowerCase().includes('super administrator')) {
        return {
          ...r,
          id: 'role-super-admin',
          name: 'Super Administrator',
          isSystem: true,
          defaultDataScope: 'All Properties',
          permissions: ['*'],
          allowedModules: ALL_SYSTEM_MODULES
        };
      }
      return r;
    });

    let loadedUsers: UserContext[] = INITIAL_STAFF_USERS;
    try {
      const savedUsers = localStorage.getItem('cculb_rbac_users_v1');
      if (savedUsers) {
        loadedUsers = JSON.parse(savedUsers);
      }
    } catch {
      loadedUsers = INITIAL_STAFF_USERS;
    }

    if (!Array.isArray(loadedUsers)) loadedUsers = [...INITIAL_STAFF_USERS];
    // Always guarantee that core staff users exist
    INITIAL_STAFF_USERS.forEach(su => {
      if (!loadedUsers.some(u => u.id === su.id)) {
        loadedUsers.push(su);
      }
    });

    if (loadedUsers.length === 0) loadedUsers = [...INITIAL_STAFF_USERS];

    // Self-heal: ensure any user designated as Super Admin has roleId 'role-super-admin' and Enterprise/All Properties scope
    loadedUsers = loadedUsers.map(u => {
      const rName = (u.roleName || '').toLowerCase().trim();
      if (u.id === 'usr-admin-1' || rName === 'super admin' || rName === 'super administrator' || rName.includes('super admin') || rName.includes('super administrator') || u.roleId === 'role-super-admin') {
        return {
          ...u,
          roleId: 'role-super-admin',
          roleName: 'Super Administrator',
          department: 'Executive Management',
          dataScope: 'All Properties'
        };
      }
      return u;
    });
    this.users = loadedUsers;

    try {
      const savedRules = localStorage.getItem('cculb_approval_rules_v1');
      this.approvalRules = savedRules ? JSON.parse(savedRules) : DEFAULT_APPROVAL_RULES;
    } catch {
      this.approvalRules = DEFAULT_APPROVAL_RULES;
    }

    try {
      const savedDepts = localStorage.getItem('cculb_departments_v1');
      if (savedDepts) {
        const parsed = JSON.parse(savedDepts);
        const existingIds = new Set(parsed.map((d: any) => d.id));
        const missing = DEFAULT_DEPARTMENTS.filter(d => !existingIds.has(d.id));
        this.departments = [...parsed, ...missing];
      } else {
        this.departments = DEFAULT_DEPARTMENTS;
      }
    } catch {
      this.departments = DEFAULT_DEPARTMENTS;
    }

    try {
      const savedOutlets = localStorage.getItem('cculb_outlets_v1');
      this.outlets = savedOutlets ? JSON.parse(savedOutlets) : DEFAULT_OUTLETS;
    } catch {
      this.outlets = DEFAULT_OUTLETS;
    }

    try {
      const savedReportConfig = localStorage.getItem('cculb_report_role_config_v2');
      this.reportRoleConfig = savedReportConfig ? JSON.parse(savedReportConfig) : DEFAULT_REPORT_ROLE_CONFIG;
    } catch {
      this.reportRoleConfig = DEFAULT_REPORT_ROLE_CONFIG;
    }

    let savedActiveUserId: string | null = null;
    try {
      savedActiveUserId = localStorage.getItem('cculb_active_user_id');
    } catch {}
    const foundUser = this.users.find(u => u.id === savedActiveUserId);
    this.activeUser = foundUser || this.users[0];
    if (this.isSuperAdmin(this.activeUser)) {
      this.activeUser.roleId = 'role-super-admin';
      this.activeUser.roleName = 'Super Administrator';
      this.activeUser.dataScope = 'All Properties';
    }
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  public onUserChange(fn: (user: UserContext) => void): () => void {
    this.userChangeListeners.push(fn);
    return () => {
      this.userChangeListeners = this.userChangeListeners.filter(l => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  private notifyUserChange(user: UserContext) {
    this.userChangeListeners.forEach(fn => {
      try {
        fn(user);
      } catch (e) {
        console.error('Error in onUserChange listener:', e);
      }
    });
  }

  public getMasterPermissions(): PermissionDefinition[] {
    return MASTER_PERMISSIONS;
  }

  public getRoles(): RoleDefinition[] {
    return this.roles;
  }

  public getUsers(): UserContext[] {
    return this.users;
  }

  public getActiveUser(): UserContext {
    return this.activeUser;
  }

  public setActiveUser(userId: string): UserContext {
    const u = this.users.find(x => x.id === userId || (x.email && x.email.toLowerCase() === (userId || '').toLowerCase()));
    if (u) {
      this.activeUser = u;
      try {
        localStorage.setItem('cculb_active_user_id', u.id);
      } catch (e) {
        console.warn('Unable to persist active user id to localStorage:', e);
      }
      try {
        this.notifyUserChange(this.activeUser);
      } catch (e) {
        console.warn('Error in notifyUserChange subscriber:', e);
      }
      try {
        this.notify();
      } catch (e) {
        console.warn('Error in rbac notify subscriber:', e);
      }
    }
    return this.activeUser;
  }

  public switchActiveRole(roleId: string) {
    const r = this.roles.find(x => x.id === roleId);
    if (!r) return;
    this.activeUser = {
      ...this.activeUser,
      roleId: r.id,
      roleName: r.name,
      department: r.department
    };
    try {
      localStorage.setItem('cculb_active_user_id', this.activeUser.id);
    } catch (e) {
      console.warn('Unable to persist active user id to localStorage:', e);
    }
    try {
      this.notifyUserChange(this.activeUser);
    } catch (e) {
      console.warn('Error in notifyUserChange subscriber:', e);
    }
    try {
      this.notify();
    } catch (e) {
      console.warn('Error in rbac notify subscriber:', e);
    }
  }

  /**
   * Determine whether a user is the Super Administrator with absolute master privileges.
   */
  public isSuperAdmin(user?: UserContext): boolean {
    const u = user || this.activeUser;
    if (!u) return false;
    if (u.id === 'usr-admin-1') return true;
    if (u.roleId === 'role-super-admin') return true;
    const rName = (u.roleName || '').toLowerCase().trim();
    if (
      rName === 'super admin' || 
      rName === 'super administrator' || 
      rName.includes('super admin') || 
      rName.includes('super administrator')
    ) return true;
    const role = this.roles.find(r => r.id === u.roleId);
    if (role) {
      if (role.id === 'role-super-admin') return true;
      if (role.permissions && role.permissions.includes('*')) return true;
      const rDefName = (role.name || '').toLowerCase().trim();
      if (rDefName.includes('super admin') || rDefName.includes('super administrator')) return true;
    }
    return false;
  }

  /**
   * Determine whether a user is a Developer or IT Personnel.
   * Mandate: General users must NOT see Cloud Sync menus; only Developer and IT personnel can see them.
   */
  public isDeveloperOrIT(user?: UserContext): boolean {
    const u = user || this.activeUser;
    if (!u) return false;
    if (this.isSuperAdmin(u)) return true;

    const roleId = (u.roleId || '').toLowerCase().trim();
    if (roleId === 'role-super-admin' || roleId === 'role-it-mgr' || roleId === 'role-it-exec') {
      return true;
    }

    const roleName = (u.roleName || '').toLowerCase().trim();
    if (
      roleName.includes('developer') ||
      roleName.includes('dev') ||
      roleName.includes('it manager') ||
      roleName.includes('it support') ||
      roleName.includes('it specialist') ||
      roleName.includes('information technology') ||
      roleName.includes('sysadmin') ||
      roleName.includes('system admin') ||
      roleName.startsWith('it ') ||
      roleName === 'it'
    ) {
      return true;
    }

    const dept = (u.department || '').toLowerCase().trim();
    if (
      dept.includes('information technology') ||
      dept === 'it' ||
      dept.includes('technology') ||
      dept.includes('development') ||
      dept.includes('engineering')
    ) {
      return true;
    }

    if (this.hasPermission('it:*', u) || this.hasPermission('it:view', u)) {
      return true;
    }

    return false;
  }

  /**
   * Determine whether a user is the App Owner or IT Support.
   * Mandate: Only App Owner and IT Support can access Cloud SQL & Resort Network controls/popovers.
   * General users are only shown the status icon indicating syncing or not syncing.
   */
  public isAppOwnerOrIT(user?: UserContext): boolean {
    const u = user || this.activeUser;
    if (!u) return false;
    if (this.isSuperAdmin(u)) return true;
    return this.isDeveloperOrIT(u);
  }

  public getActiveRole(): RoleDefinition {
    // If the active user is Super Admin, guarantee returning the Super Administrator role definition
    if (this.isSuperAdmin(this.activeUser)) {
      const superRole = this.roles.find(x => x.id === 'role-super-admin');
      if (superRole) return superRole;
    }
    const r = this.roles.find(x => x.id === this.activeUser.roleId);
    return r || this.roles[0];
  }

  public isModuleAllowed(module: MainModuleName, targetUser?: UserContext): boolean {
    const user = targetUser || this.activeUser;
    // Super Administrator has 100% unrestricted access to ALL system modules
    if (this.isSuperAdmin(user)) return true;
    if (module === 'dashboard') return true;
    const role = user ? (this.roles.find(x => x.id === user.roleId) || this.getActiveRole()) : this.getActiveRole();
    if (role.permissions.includes('*') || role.id === 'role-super-admin') return true;
    const roleName = (role.name || '').toLowerCase();
    if (roleName.includes('super admin') || roleName.includes('super administrator')) return true;
    if ((module === 'restaurant' || (module as any) === 'bar') && (role.allowedModules.includes('restaurant') || (role.allowedModules as any).includes('bar'))) {
      return true;
    }
    return role.allowedModules.includes(module);
  }

  public hasPermission(permission: string, targetUser?: UserContext): boolean {
    const user = targetUser || this.activeUser;
    if (!user) return false;

    // Super Administrator has unrestricted root permissions across all operations
    if (this.isSuperAdmin(user)) return true;

    // 1. Explicit Individual Revocation / Denial
    if (user.deniedPermissions && user.deniedPermissions.includes(permission)) {
      return false;
    }

    // 2. Individual Custom Permission Grant
    if (user.customPermissions) {
      if (user.customPermissions.includes('*') || user.customPermissions.includes(permission)) {
        return true;
      }
      const prefix = permission.split(':')[0] + ':*';
      if (user.customPermissions.includes(prefix)) {
        return true;
      }
    }

    // 3. Role-based Permission Checking
    const role = this.roles.find(x => x.id === user.roleId) || this.roles[0];
    if (role.permissions.includes('*') || role.id === 'role-super-admin') return true;
    if (role.permissions.includes(permission)) return true;

    // Wildcard prefix matching e.g. "approvals:*" matches "approvals:po"
    const prefix = permission.split(':')[0] + ':*';
    if (role.permissions.includes(prefix)) return true;

    // Bridge compatibility for legacy keys
    if (permission === 'can_void_bills' && (role.permissions.includes('billing:bill-void') || role.permissions.includes('folio:void-charge') || role.permissions.includes('approvals:bill-void'))) return true;
    if (permission === 'can_void_payments' && (role.permissions.includes('payment:void') || role.permissions.includes('approvals:payment-void'))) return true;
    if (permission === 'billing:bill-resettle' && (role.permissions.includes('approvals:bill-resettle') || role.permissions.includes('can_void_bills'))) return true;
    if (permission === 'can_modify_reservations' && (role.permissions.includes('front-office:modify') || role.permissions.includes('front-office:edit'))) return true;
    if (permission === 'can_delete_reservations' && role.permissions.includes('front-office:delete')) return true;
    if (permission === 'can_manage_roles' && role.permissions.includes('admin:roles-manage')) return true;
    if (permission === 'can_manage_users' && role.permissions.includes('admin:users-manage')) return true;

    return false;
  }

  public getUserEffectivePermissions(user: UserContext): {
    rolePermissions: string[];
    customGranted: string[];
    customDenied: string[];
    effectiveKeys: string[];
  } {
    const role = this.roles.find(r => r.id === user.roleId) || this.roles[0];
    const rolePerms = role.permissions || [];
    const customGranted = user.customPermissions || [];
    const customDenied = user.deniedPermissions || [];

    const effectiveSet = new Set<string>();
    if (rolePerms.includes('*')) {
      MASTER_PERMISSIONS.forEach(p => effectiveSet.add(p.key));
    } else {
      rolePerms.forEach(p => {
        if (p.endsWith(':*')) {
          const cat = p.split(':')[0];
          MASTER_PERMISSIONS.filter(mp => mp.key.startsWith(cat + ':')).forEach(mp => effectiveSet.add(mp.key));
        } else {
          effectiveSet.add(p);
        }
      });
    }

    // Apply custom grants
    customGranted.forEach(p => {
      if (p === '*') {
        MASTER_PERMISSIONS.forEach(mp => effectiveSet.add(mp.key));
      } else if (p.endsWith(':*')) {
        const cat = p.split(':')[0];
        MASTER_PERMISSIONS.filter(mp => mp.key.startsWith(cat + ':')).forEach(mp => effectiveSet.add(mp.key));
      } else {
        effectiveSet.add(p);
      }
    });

    // Apply custom denials
    customDenied.forEach(p => {
      effectiveSet.delete(p);
    });

    return {
      rolePermissions: rolePerms,
      customGranted,
      customDenied,
      effectiveKeys: Array.from(effectiveSet)
    };
  }

  public updateUserPermissions(userId: string, customPermissions: string[], deniedPermissions: string[]): UserContext | null {
    const idx = this.users.findIndex(u => u.id === userId);
    if (idx === -1) return null;

    this.users[idx].customPermissions = customPermissions;
    this.users[idx].deniedPermissions = deniedPermissions;

    if (this.activeUser.id === userId) {
      this.activeUser.customPermissions = customPermissions;
      this.activeUser.deniedPermissions = deniedPermissions;
    }

    localStorage.setItem('cculb_rbac_users_v1', JSON.stringify(this.users));
    return this.users[idx];
  }

  public updateUserOverrides(userId: string, customPermissions: string[], deniedPermissions: string[]): UserContext | null {
    return this.updateUserPermissions(userId, customPermissions, deniedPermissions);
  }

  public addUser(user: UserContext) {
    let normalized = { ...user };
    const rName = (user.roleName || '').toLowerCase().trim();
    if (user.id === 'usr-admin-1' || user.roleId === 'role-super-admin' || rName === 'super admin' || rName === 'super administrator' || rName.includes('super admin') || rName.includes('super administrator')) {
      normalized.roleId = 'role-super-admin';
      normalized.roleName = 'Super Administrator';
      normalized.department = 'Executive Management';
      normalized.dataScope = 'All Properties';
    }
    const existingIdx = this.users.findIndex(u => u.id === normalized.id);
    if (existingIdx >= 0) {
      this.users[existingIdx] = normalized;
    } else {
      this.users.push(normalized);
    }
    localStorage.setItem('cculb_rbac_users_v1', JSON.stringify(this.users));
    this.notify();
  }

  public updateUser(userId: string, updates: Partial<UserContext>): UserContext | null {
    const idx = this.users.findIndex(u => u.id === userId);
    if (idx === -1) return null;

    let merged = { ...this.users[idx], ...updates };
    const rName = (merged.roleName || '').toLowerCase().trim();
    if (merged.id === 'usr-admin-1' || merged.roleId === 'role-super-admin' || rName === 'super admin' || rName === 'super administrator' || rName.includes('super admin') || rName.includes('super administrator')) {
      merged.roleId = 'role-super-admin';
      merged.roleName = 'Super Administrator';
      merged.department = 'Executive Management';
      merged.dataScope = 'All Properties';
    }
    this.users[idx] = merged;
    if (this.activeUser.id === userId) {
      this.activeUser = this.users[idx];
      this.notifyUserChange(this.activeUser);
    }
    localStorage.setItem('cculb_rbac_users_v1', JSON.stringify(this.users));
    this.notify();
    return this.users[idx];
  }

  public deleteUser(userId: string): boolean {
    if (this.users.length <= 1 || userId === 'usr-admin-1') return false;
    this.users = this.users.filter(u => u.id !== userId);
    localStorage.setItem('cculb_rbac_users_v1', JSON.stringify(this.users));
    if (this.activeUser.id === userId) {
      this.activeUser = this.users[0];
      localStorage.setItem('cculb_active_user_id', this.activeUser.id);
      this.notifyUserChange(this.activeUser);
    }
    this.notify();
    return true;
  }

  public updateRole(updatedRole: RoleDefinition) {
    this.roles = this.roles.map(r => r.id === updatedRole.id ? updatedRole : r);
    localStorage.setItem('cculb_roles_v1', JSON.stringify(this.roles));
  }

  public addRole(newRole: Omit<RoleDefinition, 'id'>): RoleDefinition {
    const role: RoleDefinition = {
      ...newRole,
      id: `role-${Date.now()}`
    };
    this.roles.push(role);
    localStorage.setItem('cculb_roles_v1', JSON.stringify(this.roles));
    return role;
  }

  public deleteRole(roleId: string): boolean {
    const role = this.roles.find(r => r.id === roleId);
    if (!role || role.isSystem) return false;
    this.roles = this.roles.filter(r => r.id !== roleId);
    localStorage.setItem('cculb_roles_v1', JSON.stringify(this.roles));
    return true;
  }

  // Approval Rules Management
  public getApprovalRules(): ApprovalRule[] {
    return this.approvalRules;
  }

  public updateApprovalRule(updatedRule: ApprovalRule) {
    this.approvalRules = this.approvalRules.map(r => r.id === updatedRule.id ? updatedRule : r);
    localStorage.setItem('cculb_approval_rules_v1', JSON.stringify(this.approvalRules));
  }

  public addApprovalRule(newRule: Omit<ApprovalRule, 'id'>): ApprovalRule {
    const rule: ApprovalRule = {
      ...newRule,
      id: `rule-${Date.now()}`
    };
    this.approvalRules.push(rule);
    localStorage.setItem('cculb_approval_rules_v1', JSON.stringify(this.approvalRules));
    return rule;
  }

  public deleteApprovalRule(ruleId: string): boolean {
    this.approvalRules = this.approvalRules.filter(r => r.id !== ruleId);
    localStorage.setItem('cculb_approval_rules_v1', JSON.stringify(this.approvalRules));
    return true;
  }

  // Department Management
  public getDepartments(): DepartmentDef[] {
    return this.departments;
  }

  public updateDepartment(updatedDept: DepartmentDef) {
    this.departments = this.departments.map(d => d.id === updatedDept.id ? updatedDept : d);
    localStorage.setItem('cculb_departments_v1', JSON.stringify(this.departments));
  }

  public deleteDepartment(id: string): boolean {
    const beforeCount = this.departments.length;
    this.departments = this.departments.filter(d => d.id !== id);
    localStorage.setItem('cculb_departments_v1', JSON.stringify(this.departments));
    return this.departments.length < beforeCount;
  }

  public addDepartment(newDept: Omit<DepartmentDef, 'id'>): DepartmentDef {
    const dept: DepartmentDef = {
      ...newDept,
      id: `dept-${Date.now()}`
    };
    this.departments.push(dept);
    localStorage.setItem('cculb_departments_v1', JSON.stringify(this.departments));
    return dept;
  }

  // Outlets Management
  public getOutlets(): OutletDef[] {
    return this.outlets;
  }

  public updateOutlet(updatedOutlet: OutletDef) {
    this.outlets = this.outlets.map(o => o.id === updatedOutlet.id ? updatedOutlet : o);
    localStorage.setItem('cculb_outlets_v1', JSON.stringify(this.outlets));
  }

  public deleteOutlet(id: string): boolean {
    const beforeCount = this.outlets.length;
    this.outlets = this.outlets.filter(o => o.id !== id);
    localStorage.setItem('cculb_outlets_v1', JSON.stringify(this.outlets));
    return this.outlets.length < beforeCount;
  }

  public addOutlet(newOutlet: Omit<OutletDef, 'id'>): OutletDef {
    const outlet: OutletDef = {
      ...newOutlet,
      id: `out-${Date.now()}`
    };
    this.outlets.push(outlet);
    localStorage.setItem('cculb_outlets_v1', JSON.stringify(this.outlets));
    return outlet;
  }

  // --- REPORT ROLE MANAGEMENT & DEPARTMENT ISOLATION ---

  public getReportRoleConfig(): ReportRoleManagementConfig {
    return this.reportRoleConfig;
  }

  public updateDepartmentReportRule(deptName: string, updates: Partial<DepartmentReportAccessRule>) {
    const current = this.reportRoleConfig.departments[deptName] || {
      department: deptName,
      canViewAllDepartments: false,
      allowedCategories: [],
      description: `Custom report access for ${deptName}`
    };

    this.reportRoleConfig.departments[deptName] = {
      ...current,
      ...updates
    };
    this.reportRoleConfig.lastUpdated = new Date().toISOString();
    this.reportRoleConfig.updatedBy = this.activeUser.name;

    localStorage.setItem('cculb_report_role_config_v2', JSON.stringify(this.reportRoleConfig));
    this.notify();
  }

  public setDepartmentCanViewAll(deptName: string, canViewAll: boolean) {
    this.updateDepartmentReportRule(deptName, { canViewAllDepartments: canViewAll });
  }

  public toggleCategoryForDepartment(deptName: string, category: ReportCategory) {
    const current = this.reportRoleConfig.departments[deptName]?.allowedCategories || [];
    const exists = current.includes(category);
    const updated = exists ? current.filter(c => c !== category) : [...current, category];
    this.updateDepartmentReportRule(deptName, { allowedCategories: updated });
  }

  public resetToStrictDepartmentIsolation() {
    this.reportRoleConfig = JSON.parse(JSON.stringify(DEFAULT_REPORT_ROLE_CONFIG));
    this.reportRoleConfig.lastUpdated = new Date().toISOString();
    this.reportRoleConfig.updatedBy = `${this.activeUser.name} (Reset Policy)`;
    localStorage.setItem('cculb_report_role_config_v2', JSON.stringify(this.reportRoleConfig));
    this.notify();
  }

  public canManageReportRoles(user?: UserContext): boolean {
    const targetUser = user || this.activeUser;
    return (
      targetUser.roleName === 'Super Admin' ||
      targetUser.department === 'Executive Management' ||
      targetUser.department === 'Finance & Accounts' ||
      targetUser.roleName === 'Accounts' ||
      targetUser.roleName === 'Finance Manager' ||
      targetUser.roleId === 'role-finance-mgr'
    );
  }

  public canUserViewAllDepartmentReports(user?: UserContext): boolean {
    const targetUser = user || this.activeUser;
    // Executive and Super Admin
    if (targetUser.roleName === 'Super Admin' || targetUser.department === 'Executive Management' || targetUser.department === 'Internal Audit') {
      return true;
    }

    // ONLY ACCOUNTS CAN VIEW ALL DEPARTMENT REPORTS
    const isAccounts =
      targetUser.department === 'Finance & Accounts' ||
      targetUser.roleName === 'Accounts' ||
      targetUser.roleName === 'Finance Manager' ||
      targetUser.roleId === 'role-finance-mgr' ||
      targetUser.roleId === 'role-accounts-exec';

    if (isAccounts) {
      return true;
    }

    // Configured override
    const configured = this.reportRoleConfig?.departments?.[targetUser.department];
    return configured?.canViewAllDepartments === true;
  }

  public getAllowedReportCategories(user?: UserContext): ReportCategory[] {
    const targetUser = user || this.activeUser;

    if (this.canUserViewAllDepartmentReports(targetUser)) {
      return [...ALL_REPORT_CATEGORIES];
    }

    const deptConfig = this.reportRoleConfig?.departments?.[targetUser.department];
    if (deptConfig) {
      if (deptConfig.canViewAllDepartments) {
        return [...ALL_REPORT_CATEGORIES];
      }
      return deptConfig.allowedCategories;
    }

    const defaultRule = DEFAULT_REPORT_ROLE_CONFIG.departments[targetUser.department];
    if (defaultRule) {
      return defaultRule.allowedCategories;
    }

    return [];
  }

  /**
   * Synchronize active RBAC user when PMS currentUser changes.
   */
  public syncActiveUserFromPms(pmsUser: { id: string; name: string; email: string; role: string; department?: string; avatar?: string }): UserContext {
    let dept = (pmsUser.department as DepartmentName) || 'Front Office';
    let roleId = 'role-fo-exec';
    let dataScope: DataScopeType = 'Own Department';

    const rStr = (pmsUser.role || '').toLowerCase().trim();
    const isSuper = pmsUser.id === 'usr-admin-1' || 
                    rStr === 'super admin' || 
                    rStr === 'super administrator' || 
                    rStr.includes('super admin') || 
                    rStr.includes('super administrator');

    if (isSuper) {
      dept = 'Executive Management';
      roleId = 'role-super-admin';
      dataScope = 'All Properties';
    } else if (!pmsUser.department) {
      if (pmsUser.role === 'General Manager') {
        dept = 'Executive Management';
      } else if (pmsUser.role === 'Accounts') {
        dept = 'Finance & Accounts';
      } else if (pmsUser.role === 'Front Desk' || pmsUser.role === 'Front Office Manager') {
        dept = 'Front Office';
      } else if (pmsUser.role === 'Housekeeping') {
        dept = 'Housekeeping';
      } else if (pmsUser.role === 'Event Manager') {
        dept = 'Banquet & Convention';
      } else if (pmsUser.role === 'Restaurant Staff') {
        dept = 'Restaurant';
      } else if (pmsUser.role === 'POS Cashier' || pmsUser.role === 'POS User') {
        dept = 'Bar & Lounge';
      } else if (pmsUser.role === 'Maintenance') {
        dept = 'Engineering & Maintenance';
      }
    }

    if (isSuper) {
      roleId = 'role-super-admin';
      dataScope = 'All Properties';
    } else if (pmsUser.role === 'General Manager') {
      roleId = 'role-gm';
      dataScope = 'Own Property';
    } else if (pmsUser.role === 'Accounts' || dept === 'Finance & Accounts') {
      roleId = 'role-finance-mgr';
      dataScope = 'Own Property';
    } else if (pmsUser.role === 'Front Desk') {
      roleId = 'role-fo-exec';
      dataScope = 'Own Records';
    } else if (pmsUser.role === 'Housekeeping') {
      roleId = 'role-hk-mgr';
      dataScope = 'Own Department';
    } else if (pmsUser.role === 'Event Manager') {
      roleId = 'role-banquet-1';
      dataScope = 'Own Department';
    } else if (pmsUser.role === 'Restaurant Staff') {
      roleId = 'role-rest-mgr';
      dataScope = 'Own Outlet';
    }

    const context: UserContext = {
      id: pmsUser.id,
      name: pmsUser.name,
      email: pmsUser.email,
      roleId,
      roleName: isSuper ? 'Super Administrator' : pmsUser.role,
      department: dept,
      dataScope,
      avatar: pmsUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'
    };

    const existingIndex = this.users.findIndex(u => u.id === pmsUser.id || u.email.toLowerCase() === pmsUser.email.toLowerCase());
    if (existingIndex >= 0) {
      this.users[existingIndex] = { ...this.users[existingIndex], ...context };
    } else {
      this.users.push(context);
    }

    this.activeUser = context;
    localStorage.setItem('cculb_active_user_id', context.id);
    localStorage.setItem('cculb_rbac_users_v1', JSON.stringify(this.users));
    this.notifyUserChange(this.activeUser);
    this.notify();
    return context;
  }

  /**
   * Primary authorization check for viewing specific reports and report categories.
   * Mandate: Each department can see ONLY their individual reports. ONLY Accounts can view all department reports.
   */
  public isReportAllowed(reportPermission: string, reportCategory: string, user?: UserContext): boolean {
    const targetUser = user || this.activeUser;
    // Super Administrator has unrestricted audit access to all reports
    if (this.isSuperAdmin(targetUser)) {
      return true;
    }
    const role = this.roles.find(r => r.id === targetUser.roleId) || this.getActiveRole();

    // 1. Role with wildcard permission '*' has root audit access
    if (role.permissions.includes('*') || role.id === 'role-super-admin') {
      return true;
    }

    // 2. CHECK ACCOUNTS ENTERPRISE AUTHORITY:
    // "only accounts can view all department reports"
    const isAccounts =
      targetUser.department === 'Finance & Accounts' ||
      targetUser.roleName === 'Accounts' ||
      targetUser.roleName === 'Finance Manager' ||
      targetUser.roleId === 'role-finance-mgr' ||
      targetUser.roleId === 'role-accounts-exec';

    if (isAccounts) {
      return true; // Accounts can view all department reports!
    }

    // 3. Executive Management / General Manager / Internal Audit
    if (targetUser.department === 'Executive Management' || targetUser.department === 'Internal Audit' || targetUser.roleName === 'General Manager' || targetUser.roleName === 'Auditor') {
      return true;
    }

    // 4. Configured Department Rules
    const deptConfig = this.reportRoleConfig?.departments?.[targetUser.department];
    if (deptConfig) {
      if (deptConfig.canViewAllDepartments) {
        return true;
      }
      return deptConfig.allowedCategories.includes(reportCategory as ReportCategory);
    }

    // 5. Default Strict Department Isolation fallback
    const defaultRule = DEFAULT_REPORT_ROLE_CONFIG.departments[targetUser.department];
    if (defaultRule) {
      if (defaultRule.canViewAllDepartments) return true;
      return defaultRule.allowedCategories.includes(reportCategory as ReportCategory);
    }

    // By default: STRICT ISOLATION — cannot view other departments
    return false;
  }
}

export const rbacService = new RbacManager();
