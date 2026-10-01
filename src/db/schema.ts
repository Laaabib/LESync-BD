import { integer, pgTable, serial, text, timestamp, boolean, doublePrecision, jsonb } from 'drizzle-orm/pg-core';

// Mandatory users table for Cloud SQL & Firebase Auth
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Full state snapshot table for durable PMS recovery and sync check
export const pmsSnapshots = pgTable('pms_snapshots', {
  id: serial('id').primaryKey(),
  snapshotKey: text('snapshot_key').notNull().unique(), // e.g. 'current_pms_state'
  resortName: text('resort_name'),
  businessDate: text('business_date'),
  statePayload: jsonb('state_payload').notNull(),
  version: integer('version').default(1),
  syncedBy: text('synced_by').default('system'),
  totalEntities: integer('total_entities').default(0),
  lastSyncedAt: timestamp('last_synced_at').defaultNow().notNull(),
});

// Incremental change stream log for audit and delta sync
export const pmsSyncEvents = pgTable('pms_sync_events', {
  id: serial('id').primaryKey(),
  entityType: text('entity_type').notNull(), // 'Reservation', 'Stay', 'Folio', 'Payment', 'Event', 'Bill', etc.
  entityId: text('entity_id').notNull(),
  action: text('action').notNull(), // 'UPSERT', 'DELETE', 'STATUS_CHANGE', 'PAYMENT_RECEIVED'
  payload: jsonb('payload'),
  syncedAt: timestamp('synced_at').defaultNow().notNull(),
  status: text('status').default('COMPLETED').notNull(),
});

// Relational Rooms
export const pmsRooms = pgTable('pms_rooms', {
  id: text('id').primaryKey(),
  roomNumber: text('room_number').notNull().unique(),
  roomTypeName: text('room_type_name').notNull(),
  floor: text('floor').notNull(),
  status: text('status').notNull(), // 'Clean & Vacant', 'Occupied', etc.
  condition: text('condition').notNull(),
  rate: doublePrecision('rate').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relational Reservations
export const pmsReservations = pgTable('pms_reservations', {
  id: text('id').primaryKey(),
  reservationNumber: text('reservation_number').notNull(),
  guestName: text('guest_name').notNull(),
  guestPhone: text('guest_phone'),
  guestEmail: text('guest_email'),
  checkInDate: text('check_in_date').notNull(),
  checkOutDate: text('check_out_date').notNull(),
  roomTypeName: text('room_type_name'),
  totalAmount: doublePrecision('total_amount').default(0),
  depositAmount: doublePrecision('deposit_amount').default(0),
  balance: doublePrecision('balance').default(0),
  status: text('status').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relational Stays
export const pmsStays = pgTable('pms_stays', {
  id: text('id').primaryKey(),
  stayNumber: text('stay_number').notNull(),
  roomId: text('room_id').notNull(),
  roomNumber: text('room_number').notNull(),
  guestName: text('guest_name').notNull(),
  checkInAt: text('check_in_at'),
  expectedCheckOutAt: text('expected_check_out_at'),
  actualCheckOutAt: text('actual_check_out_at'),
  rate: doublePrecision('rate').default(0),
  status: text('status').notNull(),
  folioId: text('folio_id'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relational Folios
export const pmsFolios = pgTable('pms_folios', {
  id: text('id').primaryKey(),
  folioNumber: text('folio_number').notNull(),
  guestName: text('guest_name').notNull(),
  roomNumber: text('room_number').notNull(),
  subtotal: doublePrecision('subtotal').default(0),
  taxTotal: doublePrecision('tax_total').default(0),
  serviceChargeTotal: doublePrecision('service_charge_total').default(0),
  grandTotal: doublePrecision('grand_total').default(0),
  paidTotal: doublePrecision('paid_total').default(0),
  balance: doublePrecision('balance').default(0),
  status: text('status').notNull(),
  items: jsonb('items'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relational Payments
export const pmsPayments = pgTable('pms_payments', {
  id: text('id').primaryKey(),
  transactionNumber: text('transaction_number').notNull(),
  folioId: text('folio_id'),
  eventBookingId: text('event_booking_id'),
  amount: doublePrecision('amount').notNull(),
  method: text('method').notNull(),
  reference: text('reference'),
  status: text('status').notNull(),
  createdBy: text('created_by'),
  createdAt: text('created_at'),
  syncedAt: timestamp('synced_at').defaultNow().notNull(),
});

// Relational Event Bookings
export const pmsEventBookings = pgTable('pms_event_bookings', {
  id: text('id').primaryKey(),
  eventNumber: text('event_number').notNull(),
  clientName: text('client_name').notNull(),
  hallName: text('hall_name').notNull(),
  eventName: text('event_name').notNull(),
  eventType: text('event_type').notNull(),
  eventDate: text('event_date').notNull(),
  total: doublePrecision('total').default(0),
  balance: doublePrecision('balance').default(0),
  status: text('status').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relational General Ledger Accounts
export const pmsGlAccounts = pgTable('pms_gl_accounts', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'
  accountType: text('account_type').notNull(),
  balance: doublePrecision('balance').default(0),
  isActive: boolean('is_active').default(true),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relational Journal Vouchers
export const pmsJournalVouchers = pgTable('pms_journal_vouchers', {
  id: text('id').primaryKey(),
  voucherNumber: text('voucher_number').notNull().unique(),
  voucherDate: text('voucher_date').notNull(),
  reference: text('reference'),
  narration: text('narration').notNull(),
  totalDebit: doublePrecision('total_debit').notNull(),
  totalCredit: doublePrecision('total_credit').notNull(),
  status: text('status').notNull(),
  lines: jsonb('lines'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relational Tax Invoices
export const pmsInvoices = pgTable('pms_invoices', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  folioId: text('folio_id'),
  eventBookingId: text('event_booking_id'),
  guestName: text('guest_name'),
  clientName: text('client_name'),
  subtotal: doublePrecision('subtotal').default(0),
  taxTotal: doublePrecision('tax_total').default(0),
  serviceChargeTotal: doublePrecision('service_charge_total').default(0),
  grandTotal: doublePrecision('grand_total').default(0),
  paidTotal: doublePrecision('paid_total').default(0),
  balance: doublePrecision('balance').default(0),
  status: text('status').notNull(),
  invoiceDate: text('invoice_date').notNull(),
  dueDate: text('due_date'),
  paymentMethod: text('payment_method'),
  items: jsonb('items'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relational City Ledger Accounts (Accounts Receivable)
export const pmsCityLedger = pgTable('pms_city_ledger_accounts', {
  id: text('id').primaryKey(),
  accountNumber: text('account_number').notNull().unique(),
  companyName: text('company_name').notNull(),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  creditLimit: doublePrecision('credit_limit').default(0),
  currentBalance: doublePrecision('current_balance').default(0),
  paymentTerms: text('payment_terms'),
  status: text('status').notNull(),
  notes: text('notes'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relational Suppliers / Vendors (Accounts Payable)
export const pmsSuppliers = pgTable('pms_suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  category: text('category'),
  paymentTerms: text('payment_terms'),
  currentBalance: doublePrecision('current_balance').default(0),
  bankDetails: jsonb('bank_details'),
  status: text('status').default('Active'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relational Purchase Bills (Accounts Payable Vendor Invoices)
export const pmsPurchaseBills = pgTable('pms_purchase_bills', {
  id: text('id').primaryKey(),
  billNumber: text('bill_number').notNull().unique(),
  supplierId: text('supplier_id').notNull(),
  supplierName: text('supplier_name').notNull(),
  billDate: text('bill_date').notNull(),
  dueDate: text('due_date'),
  totalAmount: doublePrecision('total_amount').default(0),
  paidAmount: doublePrecision('paid_amount').default(0),
  balance: doublePrecision('balance').default(0),
  status: text('status').notNull(),
  items: jsonb('items'),
  journalVoucherId: text('journal_voucher_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relational Supplier Payments (Accounts Payable Disbursements)
export const pmsSupplierPayments = pgTable('pms_supplier_payments', {
  id: text('id').primaryKey(),
  paymentNumber: text('payment_number').notNull().unique(),
  supplierId: text('supplier_id').notNull(),
  supplierName: text('supplier_name').notNull(),
  billId: text('bill_id'),
  amount: doublePrecision('amount').notNull(),
  paymentDate: text('payment_date').notNull(),
  paymentMethod: text('payment_method').notNull(),
  bankAccount: text('bank_account'),
  referenceNumber: text('reference_number'),
  status: text('status').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relational Restaurant Orders (F&B POS Billing)
export const pmsRestaurantOrders = pgTable('pms_restaurant_orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  orderType: text('order_type').notNull(),
  tableNumber: text('table_number'),
  roomNumber: text('room_number'),
  guestName: text('guest_name'),
  subtotal: doublePrecision('subtotal').default(0),
  tax: doublePrecision('tax').default(0),
  serviceCharge: doublePrecision('service_charge').default(0),
  total: doublePrecision('total').default(0),
  paymentStatus: text('payment_status').notNull(),
  paymentMethod: text('payment_method'),
  items: jsonb('items'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relational Audit Logs
export const pmsAuditLogs = pgTable('pms_audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  userName: text('user_name'),
  userRole: text('user_role'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
