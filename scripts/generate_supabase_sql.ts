import fs from 'fs';
import path from 'path';
import { getInitialDatabase } from '../src/services/mockPmsDatabase.ts';

function escapeSqlString(str: any): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function escapeJson(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
}

function generateSql(): string {
  const db = getInitialDatabase();
  const lines: string[] = [];

  lines.push(`-- =========================================================================`);
  lines.push(`-- LESync Resort & PMS - Complete Supabase PostgreSQL Schema & Demo Seed Data`);
  lines.push(`-- Target: Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)`);
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- =========================================================================\n`);

  lines.push(`-- 1. EXTENSIONS & CLEANUP`);
  lines.push(`DO $$ BEGIN CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; EXCEPTION WHEN OTHERS THEN NULL; END $$;`);
  lines.push(`DO $$ BEGIN CREATE EXTENSION IF NOT EXISTS "pgcrypto"; EXCEPTION WHEN OTHERS THEN NULL; END $$;\n`);

  lines.push(`-- =========================================================================`);
  lines.push(`-- 2. TABLE DEFINITIONS`);
  lines.push(`-- =========================================================================\n`);

  lines.push(`-- Users Table`);
  lines.push(`CREATE TABLE IF NOT EXISTS users (`);
  lines.push(`  id SERIAL PRIMARY KEY,`);
  lines.push(`  uid TEXT NOT NULL UNIQUE,`);
  lines.push(`  email TEXT NOT NULL,`);
  lines.push(`  name TEXT,`);
  lines.push(`  role TEXT,`);
  lines.push(`  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
  lines.push(`);\n`);

  lines.push(`-- PMS Full Snapshots`);
  lines.push(`CREATE TABLE IF NOT EXISTS pms_snapshots (`);
  lines.push(`  id SERIAL PRIMARY KEY,`);
  lines.push(`  snapshot_key TEXT NOT NULL UNIQUE,`);
  lines.push(`  resort_name TEXT,`);
  lines.push(`  business_date TEXT,`);
  lines.push(`  state_payload JSONB NOT NULL,`);
  lines.push(`  version INTEGER DEFAULT 1,`);
  lines.push(`  synced_by TEXT DEFAULT 'system',`);
  lines.push(`  total_entities INTEGER DEFAULT 0,`);
  lines.push(`  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`);
  lines.push(`);\n`);

  lines.push(`-- PMS Realtime Sync Events`);
  lines.push(`CREATE TABLE IF NOT EXISTS pms_sync_events (`);
  lines.push(`  id SERIAL PRIMARY KEY,`);
  lines.push(`  entity_type TEXT NOT NULL,`);
  lines.push(`  entity_id TEXT NOT NULL,`);
  lines.push(`  action TEXT NOT NULL,`);
  lines.push(`  payload JSONB,`);
  lines.push(`  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,`);
  lines.push(`  status TEXT DEFAULT 'COMPLETED' NOT NULL`);
  lines.push(`);\n`);

  lines.push(`-- PMS Rooms`);
  lines.push(`CREATE TABLE IF NOT EXISTS pms_rooms (`);
  lines.push(`  id TEXT PRIMARY KEY,`);
  lines.push(`  room_number TEXT NOT NULL UNIQUE,`);
  lines.push(`  room_type_name TEXT NOT NULL,`);
  lines.push(`  floor TEXT NOT NULL,`);
  lines.push(`  status TEXT NOT NULL,`);
  lines.push(`  condition TEXT NOT NULL,`);
  lines.push(`  rate DOUBLE PRECISION NOT NULL,`);
  lines.push(`  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`);
  lines.push(`);\n`);

  lines.push(`-- PMS Reservations`);
  lines.push(`CREATE TABLE IF NOT EXISTS pms_reservations (`);
  lines.push(`  id TEXT PRIMARY KEY,`);
  lines.push(`  reservation_number TEXT NOT NULL,`);
  lines.push(`  guest_name TEXT NOT NULL,`);
  lines.push(`  guest_phone TEXT,`);
  lines.push(`  guest_email TEXT,`);
  lines.push(`  check_in_date TEXT NOT NULL,`);
  lines.push(`  check_out_date TEXT NOT NULL,`);
  lines.push(`  room_type_name TEXT,`);
  lines.push(`  total_amount DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  deposit_amount DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  balance DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  status TEXT NOT NULL,`);
  lines.push(`  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`);
  lines.push(`);\n`);

  lines.push(`-- PMS Stays (In-House Registrations)`);
  lines.push(`CREATE TABLE IF NOT EXISTS pms_stays (`);
  lines.push(`  id TEXT PRIMARY KEY,`);
  lines.push(`  stay_number TEXT NOT NULL,`);
  lines.push(`  room_id TEXT NOT NULL,`);
  lines.push(`  room_number TEXT NOT NULL,`);
  lines.push(`  guest_name TEXT NOT NULL,`);
  lines.push(`  check_in_at TEXT,`);
  lines.push(`  expected_check_out_at TEXT,`);
  lines.push(`  actual_check_out_at TEXT,`);
  lines.push(`  rate DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  status TEXT NOT NULL,`);
  lines.push(`  folio_id TEXT,`);
  lines.push(`  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`);
  lines.push(`);\n`);

  lines.push(`-- PMS Folios`);
  lines.push(`CREATE TABLE IF NOT EXISTS pms_folios (`);
  lines.push(`  id TEXT PRIMARY KEY,`);
  lines.push(`  folio_number TEXT NOT NULL,`);
  lines.push(`  guest_name TEXT NOT NULL,`);
  lines.push(`  room_number TEXT NOT NULL,`);
  lines.push(`  subtotal DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  tax_total DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  service_charge_total DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  grand_total DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  paid_total DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  balance DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  status TEXT NOT NULL,`);
  lines.push(`  items JSONB,`);
  lines.push(`  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`);
  lines.push(`);\n`);

  lines.push(`-- PMS Payments`);
  lines.push(`CREATE TABLE IF NOT EXISTS pms_payments (`);
  lines.push(`  id TEXT PRIMARY KEY,`);
  lines.push(`  transaction_number TEXT NOT NULL,`);
  lines.push(`  folio_id TEXT,`);
  lines.push(`  event_booking_id TEXT,`);
  lines.push(`  amount DOUBLE PRECISION NOT NULL,`);
  lines.push(`  method TEXT NOT NULL,`);
  lines.push(`  reference TEXT,`);
  lines.push(`  status TEXT NOT NULL,`);
  lines.push(`  created_by TEXT,`);
  lines.push(`  created_at TEXT,`);
  lines.push(`  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`);
  lines.push(`);\n`);

  lines.push(`-- PMS Event Bookings (Banquet & Convention)`);
  lines.push(`CREATE TABLE IF NOT EXISTS pms_event_bookings (`);
  lines.push(`  id TEXT PRIMARY KEY,`);
  lines.push(`  event_number TEXT NOT NULL,`);
  lines.push(`  client_name TEXT NOT NULL,`);
  lines.push(`  hall_name TEXT NOT NULL,`);
  lines.push(`  event_name TEXT NOT NULL,`);
  lines.push(`  event_type TEXT NOT NULL,`);
  lines.push(`  event_date TEXT NOT NULL,`);
  lines.push(`  total DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  balance DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  status TEXT NOT NULL,`);
  lines.push(`  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`);
  lines.push(`);\n`);

  lines.push(`-- PMS Chart of Accounts (General Ledger)`);
  lines.push(`CREATE TABLE IF NOT EXISTS pms_gl_accounts (`);
  lines.push(`  id TEXT PRIMARY KEY,`);
  lines.push(`  code TEXT NOT NULL UNIQUE,`);
  lines.push(`  name TEXT NOT NULL,`);
  lines.push(`  category TEXT NOT NULL,`);
  lines.push(`  account_type TEXT NOT NULL,`);
  lines.push(`  balance DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  is_active BOOLEAN DEFAULT TRUE,`);
  lines.push(`  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`);
  lines.push(`);\n`);

  lines.push(`-- PMS Journal Vouchers`);
  lines.push(`CREATE TABLE IF NOT EXISTS pms_journal_vouchers (`);
  lines.push(`  id TEXT PRIMARY KEY,`);
  lines.push(`  voucher_number TEXT NOT NULL UNIQUE,`);
  lines.push(`  voucher_date TEXT NOT NULL,`);
  lines.push(`  reference TEXT,`);
  lines.push(`  narration TEXT NOT NULL,`);
  lines.push(`  total_debit DOUBLE PRECISION NOT NULL,`);
  lines.push(`  total_credit DOUBLE PRECISION NOT NULL,`);
  lines.push(`  status TEXT NOT NULL,`);
  lines.push(`  lines JSONB,`);
  lines.push(`  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`);
  lines.push(`);\n`);

  lines.push(`-- PMS Invoices`);
  lines.push(`CREATE TABLE IF NOT EXISTS pms_invoices (`);
  lines.push(`  id TEXT PRIMARY KEY,`);
  lines.push(`  invoice_number TEXT NOT NULL UNIQUE,`);
  lines.push(`  folio_id TEXT,`);
  lines.push(`  event_booking_id TEXT,`);
  lines.push(`  guest_name TEXT,`);
  lines.push(`  client_name TEXT,`);
  lines.push(`  subtotal DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  tax_total DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  service_charge_total DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  grand_total DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  paid_total DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  balance DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  status TEXT NOT NULL,`);
  lines.push(`  invoice_date TEXT NOT NULL,`);
  lines.push(`  due_date TEXT,`);
  lines.push(`  payment_method TEXT,`);
  lines.push(`  items JSONB,`);
  lines.push(`  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`);
  lines.push(`);\n`);

  lines.push(`-- PMS City Ledger Accounts (AR)`);
  lines.push(`CREATE TABLE IF NOT EXISTS pms_city_ledger_accounts (`);
  lines.push(`  id TEXT PRIMARY KEY,`);
  lines.push(`  account_number TEXT NOT NULL UNIQUE,`);
  lines.push(`  company_name TEXT NOT NULL,`);
  lines.push(`  contact_person TEXT,`);
  lines.push(`  phone TEXT,`);
  lines.push(`  email TEXT,`);
  lines.push(`  credit_limit DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  current_balance DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  payment_terms TEXT,`);
  lines.push(`  status TEXT NOT NULL,`);
  lines.push(`  notes TEXT,`);
  lines.push(`  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`);
  lines.push(`);\n`);

  lines.push(`-- PMS Suppliers (AP)`);
  lines.push(`CREATE TABLE IF NOT EXISTS pms_suppliers (`);
  lines.push(`  id TEXT PRIMARY KEY,`);
  lines.push(`  name TEXT NOT NULL,`);
  lines.push(`  code TEXT NOT NULL UNIQUE,`);
  lines.push(`  contact_person TEXT,`);
  lines.push(`  phone TEXT,`);
  lines.push(`  email TEXT,`);
  lines.push(`  category TEXT,`);
  lines.push(`  payment_terms TEXT,`);
  lines.push(`  current_balance DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  bank_details JSONB,`);
  lines.push(`  status TEXT DEFAULT 'Active',`);
  lines.push(`  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`);
  lines.push(`);\n`);

  lines.push(`-- PMS Purchase Bills`);
  lines.push(`CREATE TABLE IF NOT EXISTS pms_purchase_bills (`);
  lines.push(`  id TEXT PRIMARY KEY,`);
  lines.push(`  bill_number TEXT NOT NULL UNIQUE,`);
  lines.push(`  supplier_id TEXT NOT NULL,`);
  lines.push(`  supplier_name TEXT NOT NULL,`);
  lines.push(`  bill_date TEXT NOT NULL,`);
  lines.push(`  due_date TEXT,`);
  lines.push(`  total_amount DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  paid_amount DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  balance DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  status TEXT NOT NULL,`);
  lines.push(`  items JSONB,`);
  lines.push(`  journal_voucher_id TEXT,`);
  lines.push(`  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`);
  lines.push(`);\n`);

  lines.push(`-- PMS Supplier Payments`);
  lines.push(`CREATE TABLE IF NOT EXISTS pms_supplier_payments (`);
  lines.push(`  id TEXT PRIMARY KEY,`);
  lines.push(`  payment_number TEXT NOT NULL UNIQUE,`);
  lines.push(`  supplier_id TEXT NOT NULL,`);
  lines.push(`  supplier_name TEXT NOT NULL,`);
  lines.push(`  bill_id TEXT,`);
  lines.push(`  amount DOUBLE PRECISION NOT NULL,`);
  lines.push(`  payment_date TEXT NOT NULL,`);
  lines.push(`  payment_method TEXT NOT NULL,`);
  lines.push(`  bank_account TEXT,`);
  lines.push(`  reference_number TEXT,`);
  lines.push(`  status TEXT NOT NULL,`);
  lines.push(`  notes TEXT,`);
  lines.push(`  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`);
  lines.push(`);\n`);

  lines.push(`-- PMS Restaurant Orders (F&B POS)`);
  lines.push(`CREATE TABLE IF NOT EXISTS pms_restaurant_orders (`);
  lines.push(`  id TEXT PRIMARY KEY,`);
  lines.push(`  order_number TEXT NOT NULL UNIQUE,`);
  lines.push(`  order_type TEXT NOT NULL,`);
  lines.push(`  table_number TEXT,`);
  lines.push(`  room_number TEXT,`);
  lines.push(`  guest_name TEXT,`);
  lines.push(`  subtotal DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  tax DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  service_charge DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  total DOUBLE PRECISION DEFAULT 0,`);
  lines.push(`  payment_status TEXT NOT NULL,`);
  lines.push(`  payment_method TEXT,`);
  lines.push(`  items JSONB,`);
  lines.push(`  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`);
  lines.push(`);\n`);

  lines.push(`-- PMS Audit Logs`);
  lines.push(`CREATE TABLE IF NOT EXISTS pms_audit_logs (`);
  lines.push(`  id TEXT PRIMARY KEY,`);
  lines.push(`  user_id TEXT,`);
  lines.push(`  user_name TEXT,`);
  lines.push(`  user_role TEXT,`);
  lines.push(`  action TEXT NOT NULL,`);
  lines.push(`  entity_type TEXT NOT NULL,`);
  lines.push(`  entity_id TEXT NOT NULL,`);
  lines.push(`  old_value TEXT,`);
  lines.push(`  new_value TEXT,`);
  lines.push(`  ip_address TEXT,`);
  lines.push(`  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`);
  lines.push(`);\n`);

  lines.push(`-- =========================================================================`);
  lines.push(`-- 3. INDEXES FOR HIGH-THROUGHPUT QUERIES`);
  lines.push(`-- =========================================================================\n`);
  lines.push(`CREATE INDEX IF NOT EXISTS idx_pms_sync_events_synced_at ON pms_sync_events(synced_at DESC);`);
  lines.push(`CREATE INDEX IF NOT EXISTS idx_pms_reservations_status ON pms_reservations(status);`);
  lines.push(`CREATE INDEX IF NOT EXISTS idx_pms_reservations_checkin ON pms_reservations(check_in_date);`);
  lines.push(`CREATE INDEX IF NOT EXISTS idx_pms_stays_status ON pms_stays(status);`);
  lines.push(`CREATE INDEX IF NOT EXISTS idx_pms_folios_status ON pms_folios(status);`);
  lines.push(`CREATE INDEX IF NOT EXISTS idx_pms_gl_accounts_code ON pms_gl_accounts(code);\n`);

  lines.push(`-- =========================================================================`);
  lines.push(`-- 4. ROW LEVEL SECURITY (RLS) FOR SUPABASE`);
  lines.push(`-- =========================================================================\n`);

  const tables = [
    'users', 'pms_snapshots', 'pms_sync_events', 'pms_rooms',
    'pms_reservations', 'pms_stays', 'pms_folios', 'pms_payments',
    'pms_event_bookings', 'pms_gl_accounts', 'pms_journal_vouchers',
    'pms_invoices', 'pms_city_ledger_accounts', 'pms_suppliers',
    'pms_purchase_bills', 'pms_supplier_payments', 'pms_restaurant_orders',
    'pms_audit_logs'
  ];

  for (const t of tables) {
    lines.push(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`);
    lines.push(`DO $$ BEGIN`);
    lines.push(`  IF NOT EXISTS (`);
    lines.push(`    SELECT 1 FROM pg_policies WHERE tablename = '${t}' AND policyname = 'Allow full access to authenticated and anon'`);
    lines.push(`  ) THEN`);
    lines.push(`    CREATE POLICY "Allow full access to authenticated and anon" ON ${t} FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`);
    lines.push(`  END IF;`);
    lines.push(`END $$;\n`);
  }

  lines.push(`-- =========================================================================`);
  lines.push(`-- 5. DEMO SEED DATA INSERTS`);
  lines.push(`-- =========================================================================\n`);

  // Users
  lines.push(`-- Demo Staff Users`);
  for (const u of db.users || []) {
    lines.push(
      `INSERT INTO users (uid, email, name, role) VALUES (${escapeSqlString(u.id)}, ${escapeSqlString(u.email)}, ${escapeSqlString(u.name)}, ${escapeSqlString(u.role)}) ON CONFLICT (uid) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;`
    );
  }
  lines.push('');

  // Rooms
  lines.push(`-- Demo Rooms (${(db.rooms || []).length} rooms)`);
  for (const rItem of db.rooms || []) {
    const r = rItem as any;
    const rate = r.rate || r.price || 8500;
    lines.push(
      `INSERT INTO pms_rooms (id, room_number, room_type_name, floor, status, condition, rate) VALUES (${escapeSqlString(r.id)}, ${escapeSqlString(r.roomNumber)}, ${escapeSqlString(r.roomTypeName || 'Deluxe Room')}, ${escapeSqlString(r.floor || 'Floor 1')}, ${escapeSqlString(r.status || 'Clean & Vacant')}, ${escapeSqlString(r.condition || 'Good')}, ${rate}) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, condition = EXCLUDED.condition, rate = EXCLUDED.rate;`
    );
  }
  lines.push('');

  // Reservations
  lines.push(`-- Demo Reservations (${(db.reservations || []).length} reservations)`);
  for (const resItem of db.reservations || []) {
    const res = resItem as any;
    lines.push(
      `INSERT INTO pms_reservations (id, reservation_number, guest_name, guest_phone, guest_email, check_in_date, check_out_date, room_type_name, total_amount, deposit_amount, balance, status) VALUES (${escapeSqlString(res.id)}, ${escapeSqlString(res.reservationNumber)}, ${escapeSqlString(res.guestName)}, ${escapeSqlString(res.guestPhone)}, ${escapeSqlString(res.guestEmail)}, ${escapeSqlString(res.checkInDate || res.arrivalDate)}, ${escapeSqlString(res.checkOutDate || res.departureDate)}, ${escapeSqlString(res.roomTypeName || 'Deluxe')}, ${res.totalAmount || res.total || 0}, ${res.depositAmount || res.advancePayment || 0}, ${res.balance || 0}, ${escapeSqlString(res.status)}) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, balance = EXCLUDED.balance;`
    );
  }
  lines.push('');

  // Stays
  lines.push(`-- Demo Active Stays (${(db.stays || []).length} stays)`);
  for (const sItem of db.stays || []) {
    const s = sItem as any;
    lines.push(
      `INSERT INTO pms_stays (id, stay_number, room_id, room_number, guest_name, check_in_at, expected_check_out_at, actual_check_out_at, rate, status, folio_id) VALUES (${escapeSqlString(s.id)}, ${escapeSqlString(s.stayNumber)}, ${escapeSqlString(s.roomId)}, ${escapeSqlString(s.roomNumber)}, ${escapeSqlString(s.guestName)}, ${escapeSqlString(s.checkInAt)}, ${escapeSqlString(s.expectedCheckOutAt)}, ${escapeSqlString(s.actualCheckOutAt)}, ${s.rate || 0}, ${escapeSqlString(s.status)}, ${escapeSqlString(s.folioId)}) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;`
    );
  }
  lines.push('');

  // Folios
  lines.push(`-- Demo Guest Folios (${(db.folios || []).length} folios)`);
  for (const fItem of db.folios || []) {
    const f = fItem as any;
    lines.push(
      `INSERT INTO pms_folios (id, folio_number, guest_name, room_number, subtotal, tax_total, service_charge_total, grand_total, paid_total, balance, status, items) VALUES (${escapeSqlString(f.id)}, ${escapeSqlString(f.folioNumber)}, ${escapeSqlString(f.guestName)}, ${escapeSqlString(f.roomNumber)}, ${f.subtotal || 0}, ${f.taxTotal || 0}, ${f.serviceChargeTotal || 0}, ${f.grandTotal || 0}, ${f.paidTotal || 0}, ${f.balance || 0}, ${escapeSqlString(f.status)}, ${escapeJson(f.items || [])}) ON CONFLICT (id) DO UPDATE SET paid_total = EXCLUDED.paid_total, balance = EXCLUDED.balance, status = EXCLUDED.status;`
    );
  }
  lines.push('');

  // Payments
  lines.push(`-- Demo Payments (${(db.payments || []).length} payments)`);
  for (const pItem of db.payments || []) {
    const p = pItem as any;
    lines.push(
      `INSERT INTO pms_payments (id, transaction_number, folio_id, event_booking_id, amount, method, reference, status, created_by, created_at) VALUES (${escapeSqlString(p.id)}, ${escapeSqlString(p.transactionNumber)}, ${escapeSqlString(p.folioId)}, ${escapeSqlString(p.eventBookingId)}, ${p.amount || 0}, ${escapeSqlString(p.method)}, ${escapeSqlString(p.reference)}, ${escapeSqlString(p.status)}, ${escapeSqlString(p.createdBy)}, ${escapeSqlString(p.createdAt)}) ON CONFLICT (id) DO NOTHING;`
    );
  }
  lines.push('');

  // GL Accounts
  lines.push(`-- Demo Chart of Accounts (${(db.glAccounts || []).length} accounts)`);
  for (const aItem of db.glAccounts || []) {
    const a = aItem as any;
    lines.push(
      `INSERT INTO pms_gl_accounts (id, code, name, category, account_type, balance, is_active) VALUES (${escapeSqlString(a.id || a.code)}, ${escapeSqlString(a.code)}, ${escapeSqlString(a.name)}, ${escapeSqlString(a.category)}, ${escapeSqlString(a.accountType || a.type || 'General')}, ${a.balance || 0}, ${a.isActive ?? true}) ON CONFLICT (code) DO UPDATE SET balance = EXCLUDED.balance, name = EXCLUDED.name;`
    );
  }
  lines.push('');

  // Journal Vouchers
  lines.push(`-- Demo Journal Vouchers (${(db.journalVouchers || []).length} vouchers)`);
  for (const jItem of db.journalVouchers || []) {
    const j = jItem as any;
    lines.push(
      `INSERT INTO pms_journal_vouchers (id, voucher_number, voucher_date, reference, narration, total_debit, total_credit, status, lines) VALUES (${escapeSqlString(j.id || j.voucherNumber)}, ${escapeSqlString(j.voucherNumber)}, ${escapeSqlString(j.voucherDate || j.date)}, ${escapeSqlString(j.reference || j.ref)}, ${escapeSqlString(j.narration || 'Auto Posted Voucher')}, ${j.totalDebit || 0}, ${j.totalCredit || 0}, ${escapeSqlString(j.status || 'Posted')}, ${escapeJson(j.lines || j.entries || [])}) ON CONFLICT (voucher_number) DO UPDATE SET status = EXCLUDED.status;`
    );
  }
  lines.push('');

  // Invoices
  lines.push(`-- Demo Tax Invoices (${(db.invoices || []).length} invoices)`);
  for (const invItem of db.invoices || []) {
    const inv = invItem as any;
    lines.push(
      `INSERT INTO pms_invoices (id, invoice_number, folio_id, event_booking_id, guest_name, client_name, subtotal, tax_total, service_charge_total, grand_total, paid_total, balance, status, invoice_date, due_date, payment_method, items) VALUES (${escapeSqlString(inv.id)}, ${escapeSqlString(inv.invoiceNumber)}, ${escapeSqlString(inv.folioId)}, ${escapeSqlString(inv.eventBookingId)}, ${escapeSqlString(inv.guestName)}, ${escapeSqlString(inv.clientName)}, ${inv.subtotal || 0}, ${inv.taxTotal || inv.tax || 0}, ${inv.serviceChargeTotal || inv.serviceCharge || 0}, ${inv.grandTotal || inv.total || 0}, ${inv.paidTotal || inv.paid || 0}, ${inv.balance || 0}, ${escapeSqlString(inv.status)}, ${escapeSqlString(inv.invoiceDate || inv.date)}, ${escapeSqlString(inv.dueDate)}, ${escapeSqlString(inv.paymentMethod)}, ${escapeJson(inv.items || [])}) ON CONFLICT (invoice_number) DO UPDATE SET status = EXCLUDED.status;`
    );
  }
  lines.push('');

  // City Ledger Accounts
  lines.push(`-- Demo City Ledger Accounts (${(db.cityLedgerAccounts || []).length} corporate accounts)`);
  for (const claItem of db.cityLedgerAccounts || []) {
    const cla = claItem as any;
    lines.push(
      `INSERT INTO pms_city_ledger_accounts (id, account_number, company_name, contact_person, phone, email, credit_limit, current_balance, payment_terms, status, notes) VALUES (${escapeSqlString(cla.id)}, ${escapeSqlString(cla.accountNumber)}, ${escapeSqlString(cla.companyName)}, ${escapeSqlString(cla.contactPerson)}, ${escapeSqlString(cla.phone)}, ${escapeSqlString(cla.email)}, ${cla.creditLimit || 0}, ${cla.currentBalance || 0}, ${escapeSqlString(cla.paymentTerms)}, ${escapeSqlString(cla.status)}, ${escapeSqlString(cla.notes)}) ON CONFLICT (account_number) DO UPDATE SET current_balance = EXCLUDED.current_balance;`
    );
  }
  lines.push('');

  // Event Bookings
  lines.push(`-- Demo Event Bookings (${(db.eventBookings || []).length} banquet events)`);
  for (const ebItem of db.eventBookings || []) {
    const eb = ebItem as any;
    lines.push(
      `INSERT INTO pms_event_bookings (id, event_number, client_name, hall_name, event_name, event_type, event_date, total, balance, status) VALUES (${escapeSqlString(eb.id)}, ${escapeSqlString(eb.eventNumber)}, ${escapeSqlString(eb.clientName)}, ${escapeSqlString(eb.hallName)}, ${escapeSqlString(eb.eventName)}, ${escapeSqlString(eb.eventType)}, ${escapeSqlString(eb.eventDate)}, ${eb.total || 0}, ${eb.balance || 0}, ${escapeSqlString(eb.status)}) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;`
    );
  }
  lines.push('');

  // Suppliers & Bills
  lines.push(`-- Demo Suppliers & Vendors (${(db.suppliers || []).length} suppliers)`);
  for (const supItem of db.suppliers || []) {
    const sup = supItem as any;
    lines.push(
      `INSERT INTO pms_suppliers (id, name, code, contact_person, phone, email, category, payment_terms, current_balance, status) VALUES (${escapeSqlString(sup.id)}, ${escapeSqlString(sup.name)}, ${escapeSqlString(sup.code)}, ${escapeSqlString(sup.contactPerson)}, ${escapeSqlString(sup.phone)}, ${escapeSqlString(sup.email)}, ${escapeSqlString(sup.category)}, ${escapeSqlString(sup.paymentTerms)}, ${sup.currentBalance || 0}, ${escapeSqlString(sup.status || 'Active')}) ON CONFLICT (code) DO UPDATE SET current_balance = EXCLUDED.current_balance;`
    );
  }
  lines.push('');

  // Purchase Bills
  lines.push(`-- Demo Purchase Bills (${(db.purchaseBills || []).length} bills)`);
  for (const pbItem of db.purchaseBills || []) {
    const pb = pbItem as any;
    lines.push(
      `INSERT INTO pms_purchase_bills (id, bill_number, supplier_id, supplier_name, bill_date, due_date, total_amount, paid_amount, balance, status, items) VALUES (${escapeSqlString(pb.id)}, ${escapeSqlString(pb.billNumber)}, ${escapeSqlString(pb.supplierId)}, ${escapeSqlString(pb.supplierName)}, ${escapeSqlString(pb.billDate)}, ${escapeSqlString(pb.dueDate)}, ${pb.totalAmount || 0}, ${pb.paidAmount || 0}, ${pb.balance || 0}, ${escapeSqlString(pb.status)}, ${escapeJson(pb.items || [])}) ON CONFLICT (bill_number) DO UPDATE SET status = EXCLUDED.status;`
    );
  }
  lines.push('');

  // Restaurant Orders
  lines.push(`-- Demo Restaurant Orders (${(db.restaurantOrders || []).length} orders)`);
  for (const roItem of db.restaurantOrders || []) {
    const ro = roItem as any;
    lines.push(
      `INSERT INTO pms_restaurant_orders (id, order_number, order_type, table_number, room_number, guest_name, subtotal, tax, service_charge, total, payment_status, payment_method, items) VALUES (${escapeSqlString(ro.id)}, ${escapeSqlString(ro.orderNumber)}, ${escapeSqlString(ro.orderType)}, ${escapeSqlString(ro.tableNumber)}, ${escapeSqlString(ro.roomNumber)}, ${escapeSqlString(ro.guestName)}, ${ro.subtotal || 0}, ${ro.tax || 0}, ${ro.serviceCharge || 0}, ${ro.total || 0}, ${escapeSqlString(ro.paymentStatus)}, ${escapeSqlString(ro.paymentMethod)}, ${escapeJson(ro.items || [])}) ON CONFLICT (order_number) DO UPDATE SET payment_status = EXCLUDED.payment_status;`
    );
  }
  lines.push('');
  lines.push('');

  // Full Snapshot Row
  lines.push(`-- Full Durable State Snapshot`);
  lines.push(
    `INSERT INTO pms_snapshots (snapshot_key, resort_name, business_date, state_payload, version, synced_by, total_entities) VALUES ('current_pms_state', 'LESync Resort & Convention Hall', '2026-10-06', ${escapeJson(db)}, 1, 'Supabase Seed Script', ${(db.rooms || []).length + (db.reservations || []).length + (db.stays || []).length + (db.folios || []).length}) ON CONFLICT (snapshot_key) DO UPDATE SET state_payload = EXCLUDED.state_payload, version = pms_snapshots.version + 1, last_synced_at = NOW();`
  );
  lines.push('');

  lines.push(`-- Verification query`);
  lines.push(`SELECT table_name, (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) AS columns`);
  lines.push(`FROM information_schema.tables t`);
  lines.push(`WHERE t.table_schema = 'public' AND t.table_name LIKE 'pms_%'`);
  lines.push(`ORDER BY table_name;`);

  return lines.join('\n');
}

const sql = generateSql();
const outPath = path.resolve(process.cwd(), 'supabase_schema_and_seed.sql');
const publicPath = path.resolve(process.cwd(), 'public/supabase_schema_and_seed.sql');

fs.writeFileSync(outPath, sql, 'utf8');
fs.writeFileSync(publicPath, sql, 'utf8');
console.log(`Successfully generated Supabase SQL script at: ${outPath} (${(sql.length / 1024).toFixed(1)} KB)`);
