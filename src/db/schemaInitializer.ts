import { pool, isPostgresConfigured } from './index.ts';

let isSchemaInitialized = false;
let schemaInitPromise: Promise<boolean> | null = null;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pms_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_key TEXT NOT NULL UNIQUE,
  resort_name TEXT,
  business_date TEXT,
  state_payload JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  synced_by TEXT DEFAULT 'system',
  total_entities INTEGER DEFAULT 0,
  last_synced_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pms_sync_events (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload JSONB,
  synced_at TIMESTAMP DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'COMPLETED' NOT NULL
);

CREATE TABLE IF NOT EXISTS pms_rooms (
  id TEXT PRIMARY KEY,
  room_number TEXT NOT NULL UNIQUE,
  room_type_name TEXT NOT NULL,
  floor TEXT NOT NULL,
  status TEXT NOT NULL,
  condition TEXT NOT NULL,
  rate DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pms_reservations (
  id TEXT PRIMARY KEY,
  reservation_number TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  guest_email TEXT,
  check_in_date TEXT NOT NULL,
  check_out_date TEXT NOT NULL,
  room_type_name TEXT,
  total_amount DOUBLE PRECISION DEFAULT 0,
  deposit_amount DOUBLE PRECISION DEFAULT 0,
  balance DOUBLE PRECISION DEFAULT 0,
  status TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pms_stays (
  id TEXT PRIMARY KEY,
  stay_number TEXT NOT NULL,
  room_id TEXT NOT NULL,
  room_number TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  check_in_at TEXT,
  expected_check_out_at TEXT,
  actual_check_out_at TEXT,
  rate DOUBLE PRECISION DEFAULT 0,
  status TEXT NOT NULL,
  folio_id TEXT,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pms_folios (
  id TEXT PRIMARY KEY,
  folio_number TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  subtotal DOUBLE PRECISION DEFAULT 0,
  tax_total DOUBLE PRECISION DEFAULT 0,
  service_charge_total DOUBLE PRECISION DEFAULT 0,
  grand_total DOUBLE PRECISION DEFAULT 0,
  paid_total DOUBLE PRECISION DEFAULT 0,
  balance DOUBLE PRECISION DEFAULT 0,
  status TEXT NOT NULL,
  items JSONB,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pms_payments (
  id TEXT PRIMARY KEY,
  transaction_number TEXT NOT NULL,
  folio_id TEXT,
  event_booking_id TEXT,
  amount DOUBLE PRECISION NOT NULL,
  method TEXT NOT NULL,
  reference TEXT,
  status TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT,
  synced_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pms_event_bookings (
  id TEXT PRIMARY KEY,
  event_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  hall_name TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  total DOUBLE PRECISION DEFAULT 0,
  balance DOUBLE PRECISION DEFAULT 0,
  status TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pms_gl_accounts (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  account_type TEXT NOT NULL,
  balance DOUBLE PRECISION DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pms_journal_vouchers (
  id TEXT PRIMARY KEY,
  voucher_number TEXT NOT NULL UNIQUE,
  voucher_date TEXT NOT NULL,
  reference TEXT,
  narration TEXT NOT NULL,
  total_debit DOUBLE PRECISION NOT NULL,
  total_credit DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL,
  lines JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pms_invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  folio_id TEXT,
  event_booking_id TEXT,
  guest_name TEXT,
  client_name TEXT,
  subtotal DOUBLE PRECISION DEFAULT 0,
  tax_total DOUBLE PRECISION DEFAULT 0,
  service_charge_total DOUBLE PRECISION DEFAULT 0,
  grand_total DOUBLE PRECISION DEFAULT 0,
  paid_total DOUBLE PRECISION DEFAULT 0,
  balance DOUBLE PRECISION DEFAULT 0,
  status TEXT NOT NULL,
  invoice_date TEXT NOT NULL,
  due_date TEXT,
  payment_method TEXT,
  items JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pms_city_ledger_accounts (
  id TEXT PRIMARY KEY,
  account_number TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  credit_limit DOUBLE PRECISION DEFAULT 0,
  current_balance DOUBLE PRECISION DEFAULT 0,
  payment_terms TEXT,
  status TEXT NOT NULL,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pms_suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  category TEXT,
  payment_terms TEXT,
  current_balance DOUBLE PRECISION DEFAULT 0,
  bank_details JSONB,
  status TEXT DEFAULT 'Active',
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pms_purchase_bills (
  id TEXT PRIMARY KEY,
  bill_number TEXT NOT NULL UNIQUE,
  supplier_id TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  bill_date TEXT NOT NULL,
  due_date TEXT,
  total_amount DOUBLE PRECISION DEFAULT 0,
  paid_amount DOUBLE PRECISION DEFAULT 0,
  balance DOUBLE PRECISION DEFAULT 0,
  status TEXT NOT NULL,
  items JSONB,
  journal_voucher_id TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pms_supplier_payments (
  id TEXT PRIMARY KEY,
  payment_number TEXT NOT NULL UNIQUE,
  supplier_id TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  bill_id TEXT,
  amount DOUBLE PRECISION NOT NULL,
  payment_date TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  bank_account TEXT,
  reference_number TEXT,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pms_restaurant_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  order_type TEXT NOT NULL,
  table_number TEXT,
  room_number TEXT,
  guest_name TEXT,
  subtotal DOUBLE PRECISION DEFAULT 0,
  tax DOUBLE PRECISION DEFAULT 0,
  service_charge DOUBLE PRECISION DEFAULT 0,
  total DOUBLE PRECISION DEFAULT 0,
  payment_status TEXT NOT NULL,
  payment_method TEXT,
  items JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pms_audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pms_sync_events_synced_at ON pms_sync_events(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_pms_reservations_status ON pms_reservations(status);
CREATE INDEX IF NOT EXISTS idx_pms_reservations_checkin ON pms_reservations(check_in_date);
CREATE INDEX IF NOT EXISTS idx_pms_stays_status ON pms_stays(status);
CREATE INDEX IF NOT EXISTS idx_pms_folios_status ON pms_folios(status);
`;

export async function ensureDatabaseSchema(): Promise<boolean> {
  if (isSchemaInitialized) return true;
  if (!isPostgresConfigured()) {
    return false;
  }

  if (schemaInitPromise) {
    return schemaInitPromise;
  }

  schemaInitPromise = (async () => {
    try {
      const client = await pool.connect();
      try {
        await client.query(SCHEMA_SQL);
        isSchemaInitialized = true;
        console.log('[PostgreSQL] Database schema auto-verified and initialized successfully.');
        return true;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.warn('[PostgreSQL] Auto-schema initialization notice:', err?.message || err);
      return false;
    } finally {
      schemaInitPromise = null;
    }
  })();

  return schemaInitPromise;
}
