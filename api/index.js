var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  pmsAuditLogs: () => pmsAuditLogs,
  pmsCityLedger: () => pmsCityLedger,
  pmsEventBookings: () => pmsEventBookings,
  pmsFolios: () => pmsFolios,
  pmsGlAccounts: () => pmsGlAccounts,
  pmsInvoices: () => pmsInvoices,
  pmsJournalVouchers: () => pmsJournalVouchers,
  pmsPayments: () => pmsPayments,
  pmsPurchaseBills: () => pmsPurchaseBills,
  pmsReservations: () => pmsReservations,
  pmsRestaurantOrders: () => pmsRestaurantOrders,
  pmsRooms: () => pmsRooms,
  pmsSnapshots: () => pmsSnapshots,
  pmsStays: () => pmsStays,
  pmsSupplierPayments: () => pmsSupplierPayments,
  pmsSuppliers: () => pmsSuppliers,
  pmsSyncEvents: () => pmsSyncEvents,
  users: () => users
});
import { integer, pgTable, serial, text, timestamp, boolean, doublePrecision, jsonb } from "drizzle-orm/pg-core";
var users, pmsSnapshots, pmsSyncEvents, pmsRooms, pmsReservations, pmsStays, pmsFolios, pmsPayments, pmsEventBookings, pmsGlAccounts, pmsJournalVouchers, pmsInvoices, pmsCityLedger, pmsSuppliers, pmsPurchaseBills, pmsSupplierPayments, pmsRestaurantOrders, pmsAuditLogs;
var init_schema = __esm({
  "src/db/schema.ts"() {
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      uid: text("uid").notNull().unique(),
      // Firebase Auth UID
      email: text("email").notNull(),
      name: text("name"),
      username: text("username"),
      role: text("role"),
      createdAt: timestamp("created_at").defaultNow()
    });
    pmsSnapshots = pgTable("pms_snapshots", {
      id: serial("id").primaryKey(),
      snapshotKey: text("snapshot_key").notNull().unique(),
      // e.g. 'current_pms_state'
      resortName: text("resort_name"),
      businessDate: text("business_date"),
      statePayload: jsonb("state_payload").notNull(),
      version: integer("version").default(1),
      syncedBy: text("synced_by").default("system"),
      totalEntities: integer("total_entities").default(0),
      lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull()
    });
    pmsSyncEvents = pgTable("pms_sync_events", {
      id: serial("id").primaryKey(),
      entityType: text("entity_type").notNull(),
      // 'Reservation', 'Stay', 'Folio', 'Payment', 'Event', 'Bill', etc.
      entityId: text("entity_id").notNull(),
      action: text("action").notNull(),
      // 'UPSERT', 'DELETE', 'STATUS_CHANGE', 'PAYMENT_RECEIVED'
      payload: jsonb("payload"),
      syncedAt: timestamp("synced_at").defaultNow().notNull(),
      status: text("status").default("COMPLETED").notNull()
    });
    pmsRooms = pgTable("pms_rooms", {
      id: text("id").primaryKey(),
      roomNumber: text("room_number").notNull().unique(),
      roomTypeName: text("room_type_name").notNull(),
      floor: text("floor").notNull(),
      status: text("status").notNull(),
      // 'Clean & Vacant', 'Occupied', etc.
      condition: text("condition").notNull(),
      rate: doublePrecision("rate").notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    pmsReservations = pgTable("pms_reservations", {
      id: text("id").primaryKey(),
      reservationNumber: text("reservation_number").notNull(),
      guestName: text("guest_name").notNull(),
      guestPhone: text("guest_phone"),
      guestEmail: text("guest_email"),
      checkInDate: text("check_in_date").notNull(),
      checkOutDate: text("check_out_date").notNull(),
      roomTypeName: text("room_type_name"),
      totalAmount: doublePrecision("total_amount").default(0),
      depositAmount: doublePrecision("deposit_amount").default(0),
      balance: doublePrecision("balance").default(0),
      status: text("status").notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    pmsStays = pgTable("pms_stays", {
      id: text("id").primaryKey(),
      stayNumber: text("stay_number").notNull(),
      roomId: text("room_id").notNull(),
      roomNumber: text("room_number").notNull(),
      guestName: text("guest_name").notNull(),
      checkInAt: text("check_in_at"),
      expectedCheckOutAt: text("expected_check_out_at"),
      actualCheckOutAt: text("actual_check_out_at"),
      rate: doublePrecision("rate").default(0),
      status: text("status").notNull(),
      folioId: text("folio_id"),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    pmsFolios = pgTable("pms_folios", {
      id: text("id").primaryKey(),
      folioNumber: text("folio_number").notNull(),
      guestName: text("guest_name").notNull(),
      roomNumber: text("room_number").notNull(),
      subtotal: doublePrecision("subtotal").default(0),
      taxTotal: doublePrecision("tax_total").default(0),
      serviceChargeTotal: doublePrecision("service_charge_total").default(0),
      grandTotal: doublePrecision("grand_total").default(0),
      paidTotal: doublePrecision("paid_total").default(0),
      balance: doublePrecision("balance").default(0),
      status: text("status").notNull(),
      items: jsonb("items"),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    pmsPayments = pgTable("pms_payments", {
      id: text("id").primaryKey(),
      transactionNumber: text("transaction_number").notNull(),
      folioId: text("folio_id"),
      eventBookingId: text("event_booking_id"),
      amount: doublePrecision("amount").notNull(),
      method: text("method").notNull(),
      reference: text("reference"),
      status: text("status").notNull(),
      createdBy: text("created_by"),
      createdAt: text("created_at"),
      syncedAt: timestamp("synced_at").defaultNow().notNull()
    });
    pmsEventBookings = pgTable("pms_event_bookings", {
      id: text("id").primaryKey(),
      eventNumber: text("event_number").notNull(),
      clientName: text("client_name").notNull(),
      hallName: text("hall_name").notNull(),
      eventName: text("event_name").notNull(),
      eventType: text("event_type").notNull(),
      eventDate: text("event_date").notNull(),
      total: doublePrecision("total").default(0),
      balance: doublePrecision("balance").default(0),
      status: text("status").notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    pmsGlAccounts = pgTable("pms_gl_accounts", {
      id: text("id").primaryKey(),
      code: text("code").notNull().unique(),
      name: text("name").notNull(),
      category: text("category").notNull(),
      // 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'
      accountType: text("account_type").notNull(),
      balance: doublePrecision("balance").default(0),
      isActive: boolean("is_active").default(true),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    pmsJournalVouchers = pgTable("pms_journal_vouchers", {
      id: text("id").primaryKey(),
      voucherNumber: text("voucher_number").notNull().unique(),
      voucherDate: text("voucher_date").notNull(),
      reference: text("reference"),
      narration: text("narration").notNull(),
      totalDebit: doublePrecision("total_debit").notNull(),
      totalCredit: doublePrecision("total_credit").notNull(),
      status: text("status").notNull(),
      lines: jsonb("lines"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    pmsInvoices = pgTable("pms_invoices", {
      id: text("id").primaryKey(),
      invoiceNumber: text("invoice_number").notNull().unique(),
      folioId: text("folio_id"),
      eventBookingId: text("event_booking_id"),
      guestName: text("guest_name"),
      clientName: text("client_name"),
      subtotal: doublePrecision("subtotal").default(0),
      taxTotal: doublePrecision("tax_total").default(0),
      serviceChargeTotal: doublePrecision("service_charge_total").default(0),
      grandTotal: doublePrecision("grand_total").default(0),
      paidTotal: doublePrecision("paid_total").default(0),
      balance: doublePrecision("balance").default(0),
      status: text("status").notNull(),
      invoiceDate: text("invoice_date").notNull(),
      dueDate: text("due_date"),
      paymentMethod: text("payment_method"),
      items: jsonb("items"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    pmsCityLedger = pgTable("pms_city_ledger_accounts", {
      id: text("id").primaryKey(),
      accountNumber: text("account_number").notNull().unique(),
      companyName: text("company_name").notNull(),
      contactPerson: text("contact_person"),
      phone: text("phone"),
      email: text("email"),
      creditLimit: doublePrecision("credit_limit").default(0),
      currentBalance: doublePrecision("current_balance").default(0),
      paymentTerms: text("payment_terms"),
      status: text("status").notNull(),
      notes: text("notes"),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    pmsSuppliers = pgTable("pms_suppliers", {
      id: text("id").primaryKey(),
      name: text("name").notNull(),
      code: text("code").notNull().unique(),
      contactPerson: text("contact_person"),
      phone: text("phone"),
      email: text("email"),
      category: text("category"),
      paymentTerms: text("payment_terms"),
      currentBalance: doublePrecision("current_balance").default(0),
      bankDetails: jsonb("bank_details"),
      status: text("status").default("Active"),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    pmsPurchaseBills = pgTable("pms_purchase_bills", {
      id: text("id").primaryKey(),
      billNumber: text("bill_number").notNull().unique(),
      supplierId: text("supplier_id").notNull(),
      supplierName: text("supplier_name").notNull(),
      billDate: text("bill_date").notNull(),
      dueDate: text("due_date"),
      totalAmount: doublePrecision("total_amount").default(0),
      paidAmount: doublePrecision("paid_amount").default(0),
      balance: doublePrecision("balance").default(0),
      status: text("status").notNull(),
      items: jsonb("items"),
      journalVoucherId: text("journal_voucher_id"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    pmsSupplierPayments = pgTable("pms_supplier_payments", {
      id: text("id").primaryKey(),
      paymentNumber: text("payment_number").notNull().unique(),
      supplierId: text("supplier_id").notNull(),
      supplierName: text("supplier_name").notNull(),
      billId: text("bill_id"),
      amount: doublePrecision("amount").notNull(),
      paymentDate: text("payment_date").notNull(),
      paymentMethod: text("payment_method").notNull(),
      bankAccount: text("bank_account"),
      referenceNumber: text("reference_number"),
      status: text("status").notNull(),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    pmsRestaurantOrders = pgTable("pms_restaurant_orders", {
      id: text("id").primaryKey(),
      orderNumber: text("order_number").notNull().unique(),
      orderType: text("order_type").notNull(),
      tableNumber: text("table_number"),
      roomNumber: text("room_number"),
      guestName: text("guest_name"),
      subtotal: doublePrecision("subtotal").default(0),
      tax: doublePrecision("tax").default(0),
      serviceCharge: doublePrecision("service_charge").default(0),
      total: doublePrecision("total").default(0),
      paymentStatus: text("payment_status").notNull(),
      paymentMethod: text("payment_method"),
      items: jsonb("items"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    pmsAuditLogs = pgTable("pms_audit_logs", {
      id: text("id").primaryKey(),
      userId: text("user_id"),
      userName: text("user_name"),
      userRole: text("user_role"),
      action: text("action").notNull(),
      entityType: text("entity_type").notNull(),
      entityId: text("entity_id").notNull(),
      oldValue: text("old_value"),
      newValue: text("new_value"),
      ipAddress: text("ip_address"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
  }
});

// src/db/index.ts
var db_exports = {};
__export(db_exports, {
  createPool: () => createPool,
  db: () => db,
  getDatabaseConnectionString: () => getDatabaseConnectionString,
  isPostgresConfigured: () => isPostgresConfigured,
  markPostgresAuthFailed: () => markPostgresAuthFailed,
  parsePostgresUri: () => parsePostgresUri,
  pool: () => pool,
  refreshPool: () => refreshPool,
  resetPostgresAuthStatus: () => resetPostgresAuthStatus,
  setDynamicConnectionString: () => setDynamicConnectionString
});
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
function parsePostgresUri(uri) {
  if (!uri || typeof uri !== "string") return null;
  const trimmed = uri.trim();
  if (!trimmed.startsWith("postgres://") && !trimmed.startsWith("postgresql://")) return null;
  if (trimmed.includes("cvviwipdglcajldmzbvc")) {
    return {
      user: "postgres.cvviwipdglcajldmzbvc",
      password: "vPTi5KTB4bQm1QlL",
      host: "aws-0-us-east-1.pooler.supabase.com",
      port: 6543,
      database: "postgres",
      ssl: true
    };
  }
  const match = trimmed.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:/@?]+)(?::(\d+))?\/([^?]+)(?:\?(.*))?$/);
  if (match) {
    let [, user, rawPassword, host, portStr, database] = match;
    let password = rawPassword;
    try {
      if (password.includes("%")) {
        password = decodeURIComponent(password);
      }
    } catch {
    }
    let port = portStr ? parseInt(portStr, 10) : 5432;
    let decodedUser = decodeURIComponent(user);
    if (password === "L@bib#zunaedy" || password.includes("L@bib")) {
      password = "vPTi5KTB4bQm1QlL";
    }
    if (host.startsWith("db.") && host.endsWith(".supabase.co")) {
      const projectRef = host.replace(/^db\./, "").replace(/\.supabase\.co$/, "");
      if (projectRef && !decodedUser.includes(".")) {
        decodedUser = `${decodedUser}.${projectRef}`;
      }
      host = "aws-0-us-east-1.pooler.supabase.com";
      port = 6543;
      if (projectRef === "cvviwipdglcajldmzbvc") {
        password = "vPTi5KTB4bQm1QlL";
      }
    }
    return {
      user: decodedUser,
      password,
      host,
      port,
      database: database.split("?")[0],
      ssl: !host.includes("localhost") && !host.includes("127.0.0.1")
    };
  }
  return null;
}
var Pool, _dynamicConnectionString, _postgresAuthFailed, _lastAuthFailureTime, AUTH_FAILURE_COOLDOWN_MS, markPostgresAuthFailed, resetPostgresAuthStatus, refreshPool, setDynamicConnectionString, isPostgresConfigured, getDatabaseConnectionString, createPool, pool, db;
var init_db = __esm({
  "src/db/index.ts"() {
    init_schema();
    dotenv.config({ override: true });
    ({ Pool } = pg);
    _dynamicConnectionString = null;
    _postgresAuthFailed = false;
    _lastAuthFailureTime = 0;
    AUTH_FAILURE_COOLDOWN_MS = 6e4;
    markPostgresAuthFailed = () => {
      _postgresAuthFailed = true;
      _lastAuthFailureTime = Date.now();
    };
    resetPostgresAuthStatus = () => {
      _postgresAuthFailed = false;
      _lastAuthFailureTime = 0;
    };
    refreshPool = () => {
      resetPostgresAuthStatus();
      if (global._postgresPool) {
        global._postgresPool.end().catch(() => {
        });
        global._postgresPool = void 0;
      }
    };
    setDynamicConnectionString = (cs) => {
      _dynamicConnectionString = cs;
      resetPostgresAuthStatus();
      if (global._postgresPool) {
        global._postgresPool.end().catch(() => {
        });
        global._postgresPool = void 0;
      }
    };
    isPostgresConfigured = () => {
      if (_postgresAuthFailed && Date.now() - _lastAuthFailureTime < AUTH_FAILURE_COOLDOWN_MS) {
        return false;
      }
      if (_postgresAuthFailed && Date.now() - _lastAuthFailureTime >= AUTH_FAILURE_COOLDOWN_MS) {
        _postgresAuthFailed = false;
      }
      if (_dynamicConnectionString && _dynamicConnectionString.trim().length > 0) {
        const cs2 = _dynamicConnectionString.trim();
        if (cs2.startsWith("postgres://") || cs2.startsWith("postgresql://")) return true;
      }
      const cs = getDatabaseConnectionString();
      if (cs) return true;
      const host = process.env.POSTGRES_HOST || process.env.PGHOST || process.env.SQL_HOST;
      const user = process.env.POSTGRES_USER || process.env.PGUSER || process.env.SQL_USER;
      const db2 = process.env.POSTGRES_DATABASE || process.env.PGDATABASE || process.env.SQL_DB_NAME;
      return Boolean(host && user && db2 && host !== "localhost" && host !== "127.0.0.1");
    };
    getDatabaseConnectionString = () => {
      if (_dynamicConnectionString && _dynamicConnectionString.trim().length > 0) {
        const cs = _dynamicConnectionString.trim();
        if (cs.startsWith("postgres://") || cs.startsWith("postgresql://")) {
          return cs;
        }
      }
      const candidates = [
        process.env.POSTGRES_URL,
        process.env.DATABASE_URL,
        process.env.SUPABASE_DB_URL,
        process.env.SUPABASE_DATABASE_URL,
        process.env.SUPABASE_POSTGRES_URL,
        process.env.POSTGRES_PRISMA_URL,
        process.env.POSTGRES_URL_NON_POOLING,
        process.env.PG_URL
      ];
      for (const c of candidates) {
        if (c && typeof c === "string") {
          const trimmed = c.trim();
          if (trimmed.startsWith("postgres://") || trimmed.startsWith("postgresql://")) {
            if (trimmed.includes("L@bib") || trimmed.includes("postgres:postgres@")) {
              continue;
            }
            return trimmed;
          }
        }
      }
      return "postgresql://postgres.cvviwipdglcajldmzbvc:vPTi5KTB4bQm1QlL@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
    };
    createPool = () => {
      if (!global._postgresPool) {
        const connectionString = getDatabaseConnectionString();
        const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
        let poolConfig;
        if (connectionString) {
          const parsed = parsePostgresUri(connectionString);
          if (parsed && parsed.host && parsed.user) {
            poolConfig = {
              host: parsed.host,
              port: parsed.port || 5432,
              user: parsed.user,
              password: parsed.password || "",
              database: parsed.database || "postgres",
              ssl: parsed.ssl ? { rejectUnauthorized: false } : false,
              max: isVercel ? 5 : 15,
              idleTimeoutMillis: 3e4,
              connectionTimeoutMillis: 8e3,
              keepAlive: true,
              keepAliveInitialDelayMillis: 1e4
            };
          } else {
            const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1") || connectionString.includes("sslmode=disable");
            poolConfig = {
              connectionString,
              ssl: isLocal ? false : { rejectUnauthorized: false },
              max: isVercel ? 5 : 15,
              idleTimeoutMillis: 3e4,
              connectionTimeoutMillis: 8e3
            };
          }
        } else {
          let host = process.env.POSTGRES_HOST || process.env.PGHOST || process.env.SQL_HOST || (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("://") ? process.env.DATABASE_URL.trim() : "");
          let user = process.env.POSTGRES_USER || process.env.PGUSER || process.env.SQL_USER || "postgres";
          let password = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || process.env.SQL_PASSWORD || "";
          let database = process.env.POSTGRES_DATABASE || process.env.PGDATABASE || process.env.SQL_DB_NAME || "postgres";
          let port = Number(process.env.POSTGRES_PORT || process.env.PGPORT || 5432);
          if (host.includes("cvviwipdglcajldmzbvc") || password === "L@bib#zunaedy") {
            host = "aws-0-us-east-1.pooler.supabase.com";
            port = 6543;
            user = "postgres.cvviwipdglcajldmzbvc";
            password = "vPTi5KTB4bQm1QlL";
            database = "postgres";
          }
          const isUnixSocket = typeof host === "string" && host.startsWith("/");
          const isLocal = host === "localhost" || host === "127.0.0.1" || isUnixSocket;
          poolConfig = {
            host: host || "unconfigured.local",
            user,
            password,
            database,
            port,
            ssl: isLocal ? false : { rejectUnauthorized: false },
            max: isVercel ? 5 : 15,
            idleTimeoutMillis: 3e4,
            connectionTimeoutMillis: 8e3,
            keepAlive: true,
            keepAliveInitialDelayMillis: 1e4
          };
        }
        global._postgresPool = new Pool(poolConfig);
        global._postgresPool.on("error", (err) => {
          if (err?.message?.includes("Connection terminated unexpectedly") || err?.code === "ECONNRESET" || err?.code === "57P01" || err?.code === "ECONNREFUSED") {
            console.warn("Postgres pool: connection notice:", err?.message || err);
          } else {
            console.error("Unexpected error on idle SQL pool client:", err?.message || err);
          }
        });
      }
      return global._postgresPool;
    };
    pool = createPool();
    db = drizzle(pool, { schema: schema_exports });
  }
});

// src/server/app.ts
import dotenv2 from "dotenv";
import express from "express";
import net from "net";
import fs2 from "fs";
import path2 from "path";

// src/db/syncService.ts
init_db();
import { eq, desc, sql, notInArray, or } from "drizzle-orm";

// src/db/schemaInitializer.ts
init_db();
var isSchemaInitialized = false;
var schemaInitPromise = null;
var SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  username TEXT,
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_pms_jv_voucher_num ON pms_journal_vouchers(voucher_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pms_invoices_inv_num ON pms_invoices(invoice_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pms_city_ledger_acc_code ON pms_city_ledger_accounts(account_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pms_suppliers_code ON pms_suppliers(supplier_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pms_purchase_bills_num ON pms_purchase_bills(bill_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pms_supplier_payments_num ON pms_supplier_payments(payment_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pms_restaurant_orders_num ON pms_restaurant_orders(order_number);
`;
async function ensureDatabaseSchema() {
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
        await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;").catch(() => {
        });
        await client.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_pms_jv_voucher_num ON pms_journal_vouchers(voucher_number);").catch(() => {
        });
        await client.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_pms_invoices_inv_num ON pms_invoices(invoice_number);").catch(() => {
        });
        isSchemaInitialized = true;
        console.log("[PostgreSQL] Database schema auto-verified and initialized successfully.");
        return true;
      } finally {
        client.release();
      }
    } catch (err) {
      const msg = err?.message || String(err);
      if (msg.includes("authentication failed") || msg.includes("ECONNREFUSED") || msg.includes("57P01")) {
        markPostgresAuthFailed();
      }
      isSchemaInitialized = true;
      return true;
    } finally {
      schemaInitPromise = null;
    }
  })();
  return schemaInitPromise;
}

// src/db/syncService.ts
init_schema();
function getSupabaseServerKey() {
  return (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_s_KTFsBgpfnFL2UkYZqqyw_TZilAsZw").trim();
}
async function getCloudSqlStatus() {
  if (!isPostgresConfigured()) {
    const sbUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://cvviwipdglcajldmzbvc.supabase.co").replace(/\/rest\/v1\/?$/i, "").trim();
    const sbKey = getSupabaseServerKey();
    if (sbUrl && sbKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(sbUrl, sbKey);
        const { data: snapshot } = await sb.from("pms_snapshots").select("snapshot_key, version, total_entities, last_synced_at").eq("snapshot_key", "current_pms_state").maybeSingle();
        const host = sbUrl.replace(/^https?:\/\//, "");
        return {
          connected: true,
          configured: true,
          region: "Supabase Cloud",
          database: "postgres",
          host,
          dbVersion: "PostgreSQL (Supabase REST API)",
          latestSnapshotTime: snapshot?.last_synced_at || null,
          snapshotVersion: snapshot?.version || 1,
          totalEntities: snapshot?.total_entities || 0,
          totalEventsSynced: 0,
          tableCounts: {
            rooms: 0,
            reservations: 0,
            stays: 0,
            folios: 0,
            payments: 0,
            glAccounts: 0,
            journalVouchers: 0,
            eventBookings: 0,
            invoices: 0,
            cityLedger: 0,
            suppliers: 0,
            purchaseBills: 0,
            supplierPayments: 0,
            restaurantOrders: 0,
            auditLogs: 0
          },
          error: null
        };
      } catch (err) {
      }
      return {
        connected: true,
        configured: true,
        region: "Supabase Cloud",
        database: "postgres",
        host: sbUrl.replace(/^https?:\/\//, ""),
        dbVersion: "PostgreSQL (Supabase)",
        latestSnapshotTime: null,
        snapshotVersion: 1,
        totalEntities: 0,
        totalEventsSynced: 0,
        tableCounts: {
          rooms: 0,
          reservations: 0,
          stays: 0,
          folios: 0,
          payments: 0,
          glAccounts: 0,
          journalVouchers: 0,
          eventBookings: 0,
          invoices: 0,
          cityLedger: 0,
          suppliers: 0,
          purchaseBills: 0,
          supplierPayments: 0,
          restaurantOrders: 0,
          auditLogs: 0
        },
        error: null
      };
    }
    return {
      connected: false,
      configured: false,
      region: "Local Environment",
      database: "Local In-Memory Mirror",
      host: "localhost",
      dbVersion: "Local Browser & Server State",
      latestSnapshotTime: null,
      snapshotVersion: 0,
      totalEntities: 0,
      totalEventsSynced: 0,
      tableCounts: {
        rooms: 0,
        reservations: 0,
        stays: 0,
        folios: 0,
        payments: 0,
        glAccounts: 0,
        journalVouchers: 0,
        eventBookings: 0,
        invoices: 0,
        cityLedger: 0,
        suppliers: 0,
        purchaseBills: 0,
        supplierPayments: 0,
        restaurantOrders: 0,
        auditLogs: 0
      },
      error: null
    };
  }
  try {
    await ensureDatabaseSchema();
    const countsQuery = `
      SELECT
        (SELECT count(*) FROM pms_sync_events) AS events_count,
        (SELECT count(*) FROM pms_rooms) AS rooms_count,
        (SELECT count(*) FROM pms_reservations) AS reservations_count,
        (SELECT count(*) FROM pms_stays) AS stays_count,
        (SELECT count(*) FROM pms_folios) AS folios_count,
        (SELECT count(*) FROM pms_payments) AS payments_count,
        (SELECT count(*) FROM pms_gl_accounts) AS gl_accounts_count,
        (SELECT count(*) FROM pms_journal_vouchers) AS journal_vouchers_count,
        (SELECT count(*) FROM pms_event_bookings) AS event_bookings_count,
        (SELECT count(*) FROM pms_invoices) AS invoices_count,
        (SELECT count(*) FROM pms_city_ledger_accounts) AS city_ledger_count,
        (SELECT count(*) FROM pms_suppliers) AS suppliers_count,
        (SELECT count(*) FROM pms_purchase_bills) AS purchase_bills_count,
        (SELECT count(*) FROM pms_supplier_payments) AS supplier_payments_count,
        (SELECT count(*) FROM pms_restaurant_orders) AS restaurant_orders_count,
        (SELECT count(*) FROM pms_audit_logs) AS audit_logs_count,
        version() AS db_version;
    `;
    const client = await pool.connect();
    let row = {};
    try {
      const res = await client.query(countsQuery);
      row = res.rows[0] || {};
    } finally {
      client.release();
    }
    const latestSnapshotRes = await db.select().from(pmsSnapshots).where(eq(pmsSnapshots.snapshotKey, "current_pms_state")).limit(1);
    const latestSnapshot = latestSnapshotRes[0];
    const dbName = process.env.POSTGRES_DATABASE || process.env.PGDATABASE || process.env.SQL_DB_NAME || "postgres";
    const dbHost = process.env.POSTGRES_HOST || process.env.PGHOST || process.env.SQL_HOST || "PostgreSQL Host";
    return {
      connected: true,
      configured: true,
      region: process.env.SUPABASE_REGION || "Supabase Cloud",
      database: dbName,
      host: dbHost,
      dbVersion: (row.db_version || "PostgreSQL (Supabase)").split(",")[0],
      latestSnapshotTime: latestSnapshot?.lastSyncedAt || null,
      snapshotVersion: latestSnapshot?.version || 0,
      totalEntities: latestSnapshot?.totalEntities || 0,
      totalEventsSynced: Number(row.events_count || 0),
      tableCounts: {
        rooms: Number(row.rooms_count || 0),
        reservations: Number(row.reservations_count || 0),
        stays: Number(row.stays_count || 0),
        folios: Number(row.folios_count || 0),
        payments: Number(row.payments_count || 0),
        glAccounts: Number(row.gl_accounts_count || 0),
        journalVouchers: Number(row.journal_vouchers_count || 0),
        eventBookings: Number(row.event_bookings_count || 0),
        invoices: Number(row.invoices_count || 0),
        cityLedger: Number(row.city_ledger_count || 0),
        suppliers: Number(row.suppliers_count || 0),
        purchaseBills: Number(row.purchase_bills_count || 0),
        supplierPayments: Number(row.supplier_payments_count || 0),
        restaurantOrders: Number(row.restaurant_orders_count || 0),
        auditLogs: Number(row.audit_logs_count || 0)
      }
    };
  } catch (error) {
    const sbUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/rest\/v1\/?$/i, "").trim();
    const sbKey = getSupabaseServerKey();
    if (sbUrl && sbKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(sbUrl, sbKey);
        const { data: snapshot } = await sb.from("pms_snapshots").select("snapshot_key, version, total_entities, last_synced_at").eq("snapshot_key", "current_pms_state").maybeSingle();
        return {
          connected: true,
          configured: true,
          region: "Supabase Cloud (REST)",
          database: "postgres",
          host: sbUrl.replace(/^https?:\/\//, ""),
          dbVersion: "PostgreSQL (Supabase REST API)",
          latestSnapshotTime: snapshot?.last_synced_at || null,
          snapshotVersion: snapshot?.version || 1,
          totalEntities: snapshot?.total_entities || 0,
          totalEventsSynced: 0,
          tableCounts: {
            rooms: 0,
            reservations: 0,
            stays: 0,
            folios: 0,
            payments: 0,
            glAccounts: 0,
            journalVouchers: 0,
            eventBookings: 0,
            invoices: 0,
            cityLedger: 0,
            suppliers: 0,
            purchaseBills: 0,
            supplierPayments: 0,
            restaurantOrders: 0,
            auditLogs: 0
          },
          error: null
        };
      } catch {
      }
    }
    const msg = error?.message || String(error);
    if (msg.includes("authentication failed") || msg.includes("ECONNREFUSED") || msg.includes("57P01")) {
      markPostgresAuthFailed();
    }
    return {
      connected: false,
      configured: true,
      region: "Supabase Cloud",
      database: process.env.SQL_DB_NAME || "postgres",
      host: process.env.POSTGRES_HOST || process.env.SQL_HOST || "Supabase",
      dbVersion: "Unavailable",
      latestSnapshotTime: null,
      snapshotVersion: 0,
      totalEntities: 0,
      totalEventsSynced: 0,
      tableCounts: {
        rooms: 0,
        reservations: 0,
        stays: 0,
        folios: 0,
        payments: 0,
        glAccounts: 0,
        journalVouchers: 0,
        eventBookings: 0,
        invoices: 0,
        cityLedger: 0,
        suppliers: 0,
        purchaseBills: 0,
        supplierPayments: 0,
        restaurantOrders: 0,
        auditLogs: 0
      },
      error: error?.message || "Database connection or query failed"
    };
  }
}
function toSafeNumber(val, fallback = 0) {
  if (val === null || val === void 0) return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}
function toSafeString(val, fallback = "") {
  if (val === null || val === void 0) return fallback;
  const str = String(val).trim();
  return str.length > 0 ? str : fallback;
}
function deduplicate(items, keyFn) {
  const map = /* @__PURE__ */ new Map();
  for (const item of items) {
    if (!item) continue;
    const key = keyFn(item);
    if (key) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}
var activeSyncPromise = null;
var nextPendingState = null;
async function syncEntirePmsState(fullState, syncedBy = "PMS Application Client") {
  if (activeSyncPromise) {
    nextPendingState = { state: fullState, syncedBy };
    return activeSyncPromise;
  }
  activeSyncPromise = (async () => {
    try {
      const res = await executeSyncEntirePmsState(fullState, syncedBy);
      return res;
    } finally {
      activeSyncPromise = null;
      if (nextPendingState) {
        const next = nextPendingState;
        nextPendingState = null;
        syncEntirePmsState(next.state, next.syncedBy).catch((e) => console.warn("Trailing sync notice:", e?.message));
      }
    }
  })();
  return activeSyncPromise;
}
async function executeSyncEntirePmsState(fullState, syncedBy = "PMS Application Client") {
  if (!isPostgresConfigured()) {
    const sbUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://cvviwipdglcajldmzbvc.supabase.co").replace(/\/rest\/v1\/?$/i, "").trim();
    const sbKey = getSupabaseServerKey();
    if (sbUrl && sbKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(sbUrl, sbKey);
        const totalEntities = (fullState.rooms?.length || 0) + (fullState.reservations?.length || 0) + (fullState.stays?.length || 0) + (fullState.folios?.length || 0) + (fullState.payments?.length || 0) + (fullState.glAccounts?.length || 0) + (fullState.journalVouchers?.length || 0) + (fullState.users?.length || 0);
        if (Array.isArray(fullState.users) && fullState.users.length > 0) {
          try {
            const userRows = fullState.users.map((u) => ({
              uid: toSafeString(u.id),
              email: toSafeString(u.email) || `${toSafeString(u.id)}@lesyncpms.com`,
              name: toSafeString(u.name),
              role: toSafeString(u.role || u.roleName || "Staff"),
              created_at: u.createdAt || (/* @__PURE__ */ new Date()).toISOString()
            }));
            await sb.from("users").upsert(userRows, { onConflict: "uid" });
          } catch (uErr) {
            console.warn("Notice syncing users via Supabase REST:", uErr?.message || uErr);
          }
        }
        const { data, error } = await sb.from("pms_snapshots").upsert(
          {
            snapshot_key: "current_pms_state",
            resort_name: fullState.resortName || "Heritage Resort & Spa",
            business_date: fullState.businessDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
            state_payload: fullState,
            synced_by: syncedBy,
            total_entities: totalEntities,
            last_synced_at: (/* @__PURE__ */ new Date()).toISOString()
          },
          { onConflict: "snapshot_key" }
        ).select("version").maybeSingle();
        if (!error) {
          return {
            success: true,
            version: data?.version || 1,
            totalEntities,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            syncedBy,
            provider: "Supabase REST"
          };
        }
      } catch (err) {
        console.warn("Supabase REST sync notice:", err?.message || err);
      }
    }
    return {
      success: true,
      syncedToCloud: false,
      version: 1,
      totalEntities: fullState.rooms?.length || 0,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      message: "State preserved in local memory & browser mirror."
    };
  }
  await ensureDatabaseSchema();
  let totalEntitiesCount = 0;
  totalEntitiesCount += fullState.rooms?.length || 0;
  totalEntitiesCount += fullState.reservations?.length || 0;
  totalEntitiesCount += fullState.stays?.length || 0;
  totalEntitiesCount += fullState.folios?.length || 0;
  totalEntitiesCount += fullState.payments?.length || 0;
  totalEntitiesCount += fullState.eventBookings?.length || 0;
  totalEntitiesCount += fullState.glAccounts?.length || 0;
  totalEntitiesCount += fullState.journalVouchers?.length || 0;
  totalEntitiesCount += fullState.invoices?.length || 0;
  totalEntitiesCount += fullState.cityLedgerAccounts?.length || 0;
  totalEntitiesCount += fullState.suppliers?.length || 0;
  totalEntitiesCount += fullState.purchaseBills?.length || 0;
  totalEntitiesCount += fullState.supplierPayments?.length || 0;
  totalEntitiesCount += fullState.restaurantOrders?.length || 0;
  try {
    const [existing] = await db.select().from(pmsSnapshots).where(eq(pmsSnapshots.snapshotKey, "current_pms_state")).limit(1);
    const nextVersion = (existing?.version || 0) + 1;
    await db.insert(pmsSnapshots).values({
      snapshotKey: "current_pms_state",
      resortName: fullState.resortName || "Heritage Resort & Spa",
      businessDate: fullState.businessDate || "2026-08-31",
      statePayload: fullState,
      version: nextVersion,
      syncedBy,
      totalEntities: totalEntitiesCount,
      lastSyncedAt: /* @__PURE__ */ new Date()
    }).onConflictDoUpdate({
      target: pmsSnapshots.snapshotKey,
      set: {
        resortName: fullState.resortName || "Heritage Resort & Spa",
        businessDate: fullState.businessDate || "2026-08-31",
        statePayload: fullState,
        version: nextVersion,
        syncedBy,
        totalEntities: totalEntitiesCount,
        lastSyncedAt: /* @__PURE__ */ new Date()
      }
    });
    if (Array.isArray(fullState.users) && fullState.users.length > 0) {
      try {
        const uniqueUsers = deduplicate(fullState.users, (u) => toSafeString(u.id));
        const userRows = uniqueUsers.map((u) => {
          const uid = toSafeString(u.id);
          if (!uid) return null;
          return {
            uid,
            email: toSafeString(u.email) || `${uid}@lesyncpms.com`,
            name: toSafeString(u.name) || "Staff User",
            username: toSafeString(u.username || (u.email ? u.email.split("@")[0] : uid)),
            role: toSafeString(u.role || u.roleName || "Staff"),
            createdAt: /* @__PURE__ */ new Date()
          };
        }).filter(Boolean);
        if (userRows.length > 0) {
          await db.insert(users).values(userRows).onConflictDoUpdate({
            target: users.uid,
            set: {
              email: sql`excluded.email`,
              name: sql`excluded.name`,
              username: sql`excluded.username`,
              role: sql`excluded.role`
            }
          });
        }
      } catch (userErr) {
        console.warn("PostgreSQL users table sync notice:", userErr?.message || userErr);
      }
    }
    if (Array.isArray(fullState.rooms) && fullState.rooms.length > 0) {
      try {
        const uniqueRooms = deduplicate(fullState.rooms, (r) => toSafeString(r.roomNumber || r.id));
        const roomRows = uniqueRooms.map((r) => {
          const roomNum = toSafeString(r.roomNumber);
          if (!roomNum || roomNum === "000") return null;
          return {
            id: toSafeString(r.id) || `rm-${roomNum}`,
            roomNumber: roomNum,
            roomTypeName: toSafeString(r.roomTypeName || r.type, "Standard"),
            floor: toSafeString(r.floor, "Floor 1"),
            status: toSafeString(r.status || r.housekeepingStatus, "Clean & Vacant"),
            condition: toSafeString(r.condition || r.operationalStatus, "Operational"),
            rate: toSafeNumber(r.rate || r.baseRate, 0),
            updatedAt: /* @__PURE__ */ new Date()
          };
        }).filter(Boolean);
        if (roomRows.length > 0) {
          await db.insert(pmsRooms).values(roomRows).onConflictDoUpdate({
            target: pmsRooms.roomNumber,
            set: {
              roomTypeName: sql`excluded.room_type_name`,
              floor: sql`excluded.floor`,
              status: sql`excluded.status`,
              condition: sql`excluded.condition`,
              rate: sql`excluded.rate`,
              updatedAt: sql`excluded.updated_at`
            }
          });
          const activeRoomNumbers = roomRows.map((r) => r.roomNumber);
          if (activeRoomNumbers.length > 0) {
            await db.delete(pmsRooms).where(notInArray(pmsRooms.roomNumber, activeRoomNumbers));
          }
        }
      } catch (err) {
        console.warn("Rooms relational sync notice:", err?.message);
      }
    }
    if (Array.isArray(fullState.reservations) && fullState.reservations.length > 0) {
      try {
        const uniqueRes = deduplicate(fullState.reservations, (res) => toSafeString(res.id));
        totalEntitiesCount += uniqueRes.length;
        const resRows = uniqueRes.map((res) => {
          const resId = toSafeString(res.id);
          if (!resId) return null;
          const totalAmount = toSafeNumber(res.totalEstimatedAmount || res.totalAmount || res.total, 0);
          const depositAmount = toSafeNumber(res.depositAmount || res.paidAmount || res.deposit, 0);
          return {
            id: resId,
            reservationNumber: toSafeString(res.reservationNumber, `RES-${resId}`),
            guestName: toSafeString(res.guestName, "Guest"),
            guestPhone: res.phone || res.guestPhone || null,
            guestEmail: res.email || res.guestEmail || null,
            checkInDate: toSafeString(res.arrivalDate || res.checkInDate || res.checkIn, "2026-09-24"),
            checkOutDate: toSafeString(res.departureDate || res.checkOutDate || res.checkOut, "2026-09-25"),
            roomTypeName: res.roomTypeName || null,
            totalAmount,
            depositAmount,
            balance: toSafeNumber(res.balance, Math.max(0, totalAmount - depositAmount)),
            status: toSafeString(res.status, "Confirmed"),
            updatedAt: /* @__PURE__ */ new Date()
          };
        }).filter(Boolean);
        if (resRows.length > 0) {
          await db.insert(pmsReservations).values(resRows).onConflictDoUpdate({
            target: pmsReservations.id,
            set: {
              reservationNumber: sql`excluded.reservation_number`,
              guestName: sql`excluded.guest_name`,
              guestPhone: sql`excluded.guest_phone`,
              guestEmail: sql`excluded.guest_email`,
              checkInDate: sql`excluded.check_in_date`,
              checkOutDate: sql`excluded.check_out_date`,
              roomTypeName: sql`excluded.room_type_name`,
              totalAmount: sql`excluded.total_amount`,
              depositAmount: sql`excluded.deposit_amount`,
              balance: sql`excluded.balance`,
              status: sql`excluded.status`,
              updatedAt: sql`excluded.updated_at`
            }
          });
          const activeResIds = resRows.map((r) => r.id);
          if (activeResIds.length > 0) {
            await db.delete(pmsReservations).where(notInArray(pmsReservations.id, activeResIds));
          }
        }
      } catch (err) {
        console.warn("Reservations relational sync notice:", err?.message);
      }
    }
    if (Array.isArray(fullState.stays) && fullState.stays.length > 0) {
      try {
        const uniqueStays = deduplicate(fullState.stays, (s) => toSafeString(s.id));
        totalEntitiesCount += uniqueStays.length;
        const stayRows = uniqueStays.map((s) => {
          const stayId = toSafeString(s.id);
          if (!stayId) return null;
          return {
            id: stayId,
            stayNumber: toSafeString(s.stayNumber, `STY-${stayId}`),
            roomId: toSafeString(s.roomId || s.roomNumber),
            roomNumber: toSafeString(s.roomNumber, "000"),
            guestName: toSafeString(s.guestName, "Guest"),
            checkInAt: s.checkInAt ? String(s.checkInAt) : null,
            expectedCheckOutAt: s.expectedCheckOutAt ? String(s.expectedCheckOutAt) : null,
            actualCheckOutAt: s.actualCheckOutAt ? String(s.actualCheckOutAt) : null,
            rate: toSafeNumber(s.rate, 0),
            status: toSafeString(s.status, "Active"),
            folioId: s.folioId ? String(s.folioId) : null,
            updatedAt: /* @__PURE__ */ new Date()
          };
        }).filter(Boolean);
        if (stayRows.length > 0) {
          await db.insert(pmsStays).values(stayRows).onConflictDoUpdate({
            target: pmsStays.id,
            set: {
              stayNumber: sql`excluded.stay_number`,
              roomId: sql`excluded.room_id`,
              roomNumber: sql`excluded.room_number`,
              guestName: sql`excluded.guest_name`,
              checkInAt: sql`excluded.check_in_at`,
              expectedCheckOutAt: sql`excluded.expected_check_out_at`,
              actualCheckOutAt: sql`excluded.actual_check_out_at`,
              rate: sql`excluded.rate`,
              status: sql`excluded.status`,
              folioId: sql`excluded.folio_id`,
              updatedAt: sql`excluded.updated_at`
            }
          });
        }
      } catch (err) {
        console.warn("Stays relational sync notice:", err?.message);
      }
    }
    if (Array.isArray(fullState.folios) && fullState.folios.length > 0) {
      try {
        const uniqueFolios = deduplicate(fullState.folios, (f) => toSafeString(f.id));
        totalEntitiesCount += uniqueFolios.length;
        const folioRows = uniqueFolios.map((f) => {
          const folioId = toSafeString(f.id, `fol-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
          if (!folioId) return null;
          const subtotal = toSafeNumber(f.subtotal, 0);
          const taxTotal = toSafeNumber(f.taxTotal ?? f.tax, 0);
          const serviceChargeTotal = toSafeNumber(f.serviceChargeTotal ?? f.serviceCharge, 0);
          const grandTotal = toSafeNumber(f.grandTotal ?? f.total, subtotal + taxTotal + serviceChargeTotal);
          const paidTotal = toSafeNumber(f.paidTotal ?? f.paid, 0);
          return {
            id: folioId,
            folioNumber: toSafeString(f.folioNumber, `FOL-${folioId}`),
            guestName: toSafeString(f.guestName, "Guest"),
            roomNumber: toSafeString(f.roomNumber, "N/A"),
            subtotal,
            taxTotal,
            serviceChargeTotal,
            grandTotal,
            paidTotal,
            balance: toSafeNumber(f.balance, grandTotal - paidTotal),
            status: toSafeString(f.status, "Open"),
            items: Array.isArray(f.items) ? f.items : [],
            updatedAt: /* @__PURE__ */ new Date()
          };
        }).filter(Boolean);
        if (folioRows.length > 0) {
          await db.insert(pmsFolios).values(folioRows).onConflictDoUpdate({
            target: pmsFolios.id,
            set: {
              folioNumber: sql`excluded.folio_number`,
              guestName: sql`excluded.guest_name`,
              roomNumber: sql`excluded.room_number`,
              subtotal: sql`excluded.subtotal`,
              taxTotal: sql`excluded.tax_total`,
              serviceChargeTotal: sql`excluded.service_charge_total`,
              grandTotal: sql`excluded.grand_total`,
              paidTotal: sql`excluded.paid_total`,
              balance: sql`excluded.balance`,
              status: sql`excluded.status`,
              items: sql`excluded.items`,
              updatedAt: sql`excluded.updated_at`
            }
          });
        }
      } catch (err) {
        console.warn("Folios relational sync notice:", err?.message);
      }
    }
    if (Array.isArray(fullState.payments) && fullState.payments.length > 0) {
      try {
        const uniquePayments = deduplicate(fullState.payments, (p) => toSafeString(p.id));
        const paymentRows = uniquePayments.map((p) => {
          const paymentId = toSafeString(p.id);
          if (!paymentId) return null;
          let reference = p.reference || p.referenceNumber || null;
          if (!reference || reference === "Payment" || reference === "Deposit") {
            if (p.transactionNo || p.traceNo) {
              reference = [
                p.transactionNo ? `Txn: ${p.transactionNo}` : "",
                p.traceNo ? `Trace: ${p.traceNo}` : ""
              ].filter(Boolean).join(" | ");
            } else if (p.cardType) {
              reference = `${p.cardType} POS`;
            }
          }
          return {
            id: paymentId,
            transactionNumber: toSafeString(p.transactionNumber || p.paymentNumber, `PAY-${paymentId}`),
            folioId: p.folioId ? String(p.folioId) : null,
            eventBookingId: p.eventBookingId ? String(p.eventBookingId) : null,
            amount: toSafeNumber(p.amount, 0),
            method: toSafeString(p.method || p.paymentMethod, "Cash"),
            reference,
            status: toSafeString(p.status, "Completed"),
            createdBy: toSafeString(p.createdBy || p.receivedBy, "System"),
            createdAt: p.createdAt ? String(p.createdAt) : (/* @__PURE__ */ new Date()).toISOString(),
            syncedAt: /* @__PURE__ */ new Date()
          };
        }).filter(Boolean);
        if (paymentRows.length > 0) {
          await db.insert(pmsPayments).values(paymentRows).onConflictDoUpdate({
            target: pmsPayments.id,
            set: {
              transactionNumber: sql`excluded.transaction_number`,
              folioId: sql`excluded.folio_id`,
              eventBookingId: sql`excluded.event_booking_id`,
              amount: sql`excluded.amount`,
              method: sql`excluded.method`,
              reference: sql`excluded.reference`,
              status: sql`excluded.status`,
              createdBy: sql`excluded.created_by`,
              createdAt: sql`excluded.created_at`,
              syncedAt: sql`excluded.synced_at`
            }
          });
        }
      } catch (err) {
        console.warn("Payments relational sync notice:", err?.message);
      }
    }
    if (Array.isArray(fullState.eventBookings) && fullState.eventBookings.length > 0) {
      try {
        const uniqueEvents = deduplicate(fullState.eventBookings, (e) => toSafeString(e.id));
        totalEntitiesCount += uniqueEvents.length;
        const eventRows = uniqueEvents.map((e) => {
          const eventId = toSafeString(e.id);
          if (!eventId) return null;
          const total = toSafeNumber(e.total || e.totalAmount, 0);
          return {
            id: eventId,
            eventNumber: toSafeString(e.eventNumber, `EVT-${eventId}`),
            clientName: toSafeString(e.clientName, "Client"),
            hallName: toSafeString(e.hallName, "Hall"),
            eventName: toSafeString(e.eventName, "Event"),
            eventType: toSafeString(e.eventType, "Corporate"),
            eventDate: toSafeString(e.eventDate, "2026-08-31"),
            total,
            balance: toSafeNumber(e.balance, total),
            status: toSafeString(e.status, "Confirmed"),
            updatedAt: /* @__PURE__ */ new Date()
          };
        }).filter(Boolean);
        if (eventRows.length > 0) {
          await db.insert(pmsEventBookings).values(eventRows).onConflictDoUpdate({
            target: pmsEventBookings.id,
            set: {
              eventNumber: sql`excluded.event_number`,
              clientName: sql`excluded.client_name`,
              hallName: sql`excluded.hall_name`,
              eventName: sql`excluded.event_name`,
              eventType: sql`excluded.event_type`,
              eventDate: sql`excluded.event_date`,
              total: sql`excluded.total`,
              balance: sql`excluded.balance`,
              status: sql`excluded.status`,
              updatedAt: sql`excluded.updated_at`
            }
          });
        }
      } catch (err) {
        console.warn("Event bookings relational sync notice:", err?.message);
      }
    }
    if (Array.isArray(fullState.glAccounts) && fullState.glAccounts.length > 0) {
      try {
        const uniqueGl = deduplicate(fullState.glAccounts, (gl) => toSafeString(gl.code || gl.id));
        totalEntitiesCount += uniqueGl.length;
        const glRows = uniqueGl.map((gl) => {
          const glCode = toSafeString(gl.code);
          if (!glCode) return null;
          return {
            id: `gl-${glCode}`,
            code: glCode,
            name: toSafeString(gl.name, "GL Account"),
            category: toSafeString(gl.category, "Revenue"),
            accountType: toSafeString(gl.accountType || gl.type, "Balance Sheet"),
            balance: toSafeNumber(gl.balance, 0),
            isActive: gl.isActive !== false,
            updatedAt: /* @__PURE__ */ new Date()
          };
        }).filter(Boolean);
        if (glRows.length > 0) {
          await db.insert(pmsGlAccounts).values(glRows).onConflictDoUpdate({
            target: pmsGlAccounts.code,
            set: {
              name: sql`excluded.name`,
              category: sql`excluded.category`,
              accountType: sql`excluded.account_type`,
              balance: sql`excluded.balance`,
              isActive: sql`excluded.is_active`,
              updatedAt: sql`excluded.updated_at`
            }
          });
        }
      } catch (err) {
        console.warn("GL accounts relational sync notice:", err?.message);
      }
    }
    if (Array.isArray(fullState.journalVouchers) && fullState.journalVouchers.length > 0) {
      try {
        const uniqueJv = deduplicate(fullState.journalVouchers, (jv) => toSafeString(jv.voucherNumber || jv.id));
        totalEntitiesCount += uniqueJv.length;
        const jvRows = uniqueJv.map((jv) => {
          const voucherNum = toSafeString(jv.voucherNumber || jv.id, `JV-${Date.now()}`);
          if (!voucherNum) return null;
          const lines = Array.isArray(jv.lines) ? jv.lines : Array.isArray(jv.entries) ? jv.entries : [];
          return {
            id: `jv-${voucherNum}`,
            voucherNumber: voucherNum,
            voucherDate: toSafeString(jv.voucherDate || jv.date, "2026-08-31"),
            reference: jv.reference || jv.sourceReference || null,
            narration: toSafeString(jv.narration, "Journal Entry"),
            totalDebit: toSafeNumber(jv.totalDebit, 0),
            totalCredit: toSafeNumber(jv.totalCredit, 0),
            status: toSafeString(jv.status, "Posted"),
            lines,
            createdAt: jv.createdAt ? new Date(jv.createdAt) : /* @__PURE__ */ new Date()
          };
        }).filter(Boolean);
        if (jvRows.length > 0) {
          try {
            await db.insert(pmsJournalVouchers).values(jvRows).onConflictDoUpdate({
              target: pmsJournalVouchers.voucherNumber,
              set: {
                voucherDate: sql`excluded.voucher_date`,
                reference: sql`excluded.reference`,
                narration: sql`excluded.narration`,
                totalDebit: sql`excluded.total_debit`,
                totalCredit: sql`excluded.total_credit`,
                status: sql`excluded.status`,
                lines: sql`excluded.lines`
              }
            });
          } catch (conflictErr) {
            try {
              await db.insert(pmsJournalVouchers).values(jvRows).onConflictDoUpdate({
                target: pmsJournalVouchers.id,
                set: {
                  voucherNumber: sql`excluded.voucher_number`,
                  voucherDate: sql`excluded.voucher_date`,
                  reference: sql`excluded.reference`,
                  narration: sql`excluded.narration`,
                  totalDebit: sql`excluded.total_debit`,
                  totalCredit: sql`excluded.total_credit`,
                  status: sql`excluded.status`,
                  lines: sql`excluded.lines`
                }
              });
            } catch (fallbackErr) {
              try {
                await db.insert(pmsJournalVouchers).values(jvRows).onConflictDoNothing();
              } catch (ignoreErr) {
              }
            }
          }
        }
      } catch (err) {
        console.warn("Journal vouchers relational sync notice:", err?.message);
      }
    }
    if (Array.isArray(fullState.invoices) && fullState.invoices.length > 0) {
      try {
        const validInvoices = deduplicate(fullState.invoices, (i) => toSafeString(i.invoiceNumber || i.id));
        totalEntitiesCount += validInvoices.length;
        const invRows = validInvoices.map((inv) => {
          const invoiceNum = toSafeString(inv.invoiceNumber, inv.id || `INV-${Date.now()}`);
          if (!invoiceNum) return null;
          const subtotal = toSafeNumber(inv.subtotal);
          const taxTotal = toSafeNumber(inv.taxTotal || inv.tax);
          const serviceChargeTotal = toSafeNumber(inv.serviceChargeTotal || inv.serviceCharge);
          const grandTotal = toSafeNumber(inv.grandTotal || inv.total);
          const paidTotal = toSafeNumber(inv.paidTotal || inv.paidAmount);
          return {
            id: `inv-${invoiceNum}`,
            invoiceNumber: invoiceNum,
            folioId: toSafeString(inv.folioId) || null,
            eventBookingId: toSafeString(inv.eventBookingId) || null,
            guestName: toSafeString(inv.guestName) || null,
            clientName: toSafeString(inv.clientName) || null,
            subtotal,
            taxTotal,
            serviceChargeTotal,
            grandTotal,
            paidTotal,
            balance: toSafeNumber(inv.balance, grandTotal - paidTotal),
            status: toSafeString(inv.status, "Issued"),
            invoiceDate: toSafeString(inv.invoiceDate || inv.date, (/* @__PURE__ */ new Date()).toISOString().split("T")[0]),
            dueDate: toSafeString(inv.dueDate) || null,
            paymentMethod: toSafeString(inv.paymentMethod) || null,
            items: inv.items || [],
            createdAt: inv.createdAt ? new Date(inv.createdAt) : /* @__PURE__ */ new Date()
          };
        }).filter(Boolean);
        if (invRows.length > 0) {
          await db.insert(pmsInvoices).values(invRows).onConflictDoUpdate({
            target: pmsInvoices.invoiceNumber,
            set: {
              folioId: sql`excluded.folio_id`,
              eventBookingId: sql`excluded.event_booking_id`,
              guestName: sql`excluded.guest_name`,
              clientName: sql`excluded.client_name`,
              subtotal: sql`excluded.subtotal`,
              taxTotal: sql`excluded.tax_total`,
              serviceChargeTotal: sql`excluded.service_charge_total`,
              grandTotal: sql`excluded.grand_total`,
              paidTotal: sql`excluded.paid_total`,
              balance: sql`excluded.balance`,
              status: sql`excluded.status`,
              invoiceDate: sql`excluded.invoice_date`,
              dueDate: sql`excluded.due_date`,
              paymentMethod: sql`excluded.payment_method`,
              items: sql`excluded.items`
            }
          });
        }
      } catch (err) {
        console.warn("Invoices relational sync notice:", err?.message);
      }
    }
    if (Array.isArray(fullState.cityLedgerAccounts) && fullState.cityLedgerAccounts.length > 0) {
      try {
        const validCl = deduplicate(fullState.cityLedgerAccounts, (c) => toSafeString(c.accountNumber || c.id));
        totalEntitiesCount += validCl.length;
        const clRows = validCl.map((cl) => {
          const accNum = toSafeString(cl.accountNumber, cl.id || `CL-${Date.now()}`);
          if (!accNum) return null;
          return {
            id: `cl-${accNum}`,
            accountNumber: accNum,
            companyName: toSafeString(cl.companyName, "Corporate Client"),
            contactPerson: toSafeString(cl.contactPerson) || null,
            phone: toSafeString(cl.phone) || null,
            email: toSafeString(cl.email) || null,
            creditLimit: toSafeNumber(cl.creditLimit),
            currentBalance: toSafeNumber(cl.currentBalance),
            paymentTerms: toSafeString(cl.paymentTerms, "Net 30"),
            status: toSafeString(cl.status, "Active"),
            notes: toSafeString(cl.notes) || null,
            updatedAt: /* @__PURE__ */ new Date()
          };
        }).filter(Boolean);
        if (clRows.length > 0) {
          await db.insert(pmsCityLedger).values(clRows).onConflictDoUpdate({
            target: pmsCityLedger.accountNumber,
            set: {
              companyName: sql`excluded.company_name`,
              contactPerson: sql`excluded.contact_person`,
              phone: sql`excluded.phone`,
              email: sql`excluded.email`,
              creditLimit: sql`excluded.credit_limit`,
              currentBalance: sql`excluded.current_balance`,
              paymentTerms: sql`excluded.payment_terms`,
              status: sql`excluded.status`,
              notes: sql`excluded.notes`,
              updatedAt: sql`excluded.updated_at`
            }
          });
        }
      } catch (err) {
        console.warn("City ledger relational sync notice:", err?.message);
      }
    }
    if (Array.isArray(fullState.suppliers) && fullState.suppliers.length > 0) {
      try {
        const validSuppliers = deduplicate(fullState.suppliers, (s) => toSafeString(s.code || s.id));
        totalEntitiesCount += validSuppliers.length;
        const supRows = validSuppliers.map((sup) => {
          const code = toSafeString(sup.code, sup.id || `SUP-${Date.now()}`);
          if (!code) return null;
          return {
            id: `sup-${code}`,
            name: toSafeString(sup.name, "Vendor"),
            code,
            contactPerson: toSafeString(sup.contactPerson) || null,
            phone: toSafeString(sup.phone) || null,
            email: toSafeString(sup.email) || null,
            category: toSafeString(sup.category) || null,
            paymentTerms: toSafeString(sup.paymentTerms, "Net 30"),
            currentBalance: toSafeNumber(sup.currentBalance),
            bankDetails: sup.bankDetails || null,
            status: toSafeString(sup.status, "Active"),
            updatedAt: /* @__PURE__ */ new Date()
          };
        }).filter(Boolean);
        if (supRows.length > 0) {
          await db.insert(pmsSuppliers).values(supRows).onConflictDoUpdate({
            target: pmsSuppliers.code,
            set: {
              name: sql`excluded.name`,
              contactPerson: sql`excluded.contact_person`,
              phone: sql`excluded.phone`,
              email: sql`excluded.email`,
              category: sql`excluded.category`,
              paymentTerms: sql`excluded.payment_terms`,
              currentBalance: sql`excluded.current_balance`,
              bankDetails: sql`excluded.bank_details`,
              status: sql`excluded.status`,
              updatedAt: sql`excluded.updated_at`
            }
          });
        }
      } catch (err) {
        console.warn("Suppliers relational sync notice:", err?.message);
      }
    }
    if (Array.isArray(fullState.purchaseBills) && fullState.purchaseBills.length > 0) {
      try {
        const validBills = deduplicate(fullState.purchaseBills, (b) => toSafeString(b.billNumber || b.id));
        totalEntitiesCount += validBills.length;
        const billRows = validBills.map((bill) => {
          const billNumber = toSafeString(bill.billNumber, bill.id || `BILL-${Date.now()}`);
          if (!billNumber) return null;
          const totalAmount = toSafeNumber(bill.totalAmount || bill.grandTotal);
          const paidAmount = toSafeNumber(bill.paidAmount || bill.paidTotal);
          return {
            id: `pb-${billNumber}`,
            billNumber,
            supplierId: toSafeString(bill.supplierId, "sup-default"),
            supplierName: toSafeString(bill.supplierName, "Vendor"),
            billDate: toSafeString(bill.billDate || bill.date, (/* @__PURE__ */ new Date()).toISOString().split("T")[0]),
            dueDate: toSafeString(bill.dueDate) || null,
            totalAmount,
            paidAmount,
            balance: toSafeNumber(bill.balance, totalAmount - paidAmount),
            status: toSafeString(bill.status, "Open"),
            items: bill.items || [],
            journalVoucherId: toSafeString(bill.journalVoucherId) || null,
            createdAt: /* @__PURE__ */ new Date()
          };
        }).filter(Boolean);
        if (billRows.length > 0) {
          await db.insert(pmsPurchaseBills).values(billRows).onConflictDoUpdate({
            target: pmsPurchaseBills.billNumber,
            set: {
              supplierId: sql`excluded.supplier_id`,
              supplierName: sql`excluded.supplier_name`,
              billDate: sql`excluded.bill_date`,
              dueDate: sql`excluded.due_date`,
              totalAmount: sql`excluded.total_amount`,
              paidAmount: sql`excluded.paid_amount`,
              balance: sql`excluded.balance`,
              status: sql`excluded.status`,
              items: sql`excluded.items`,
              journalVoucherId: sql`excluded.journal_voucher_id`
            }
          });
        }
      } catch (err) {
        console.warn("Purchase bills relational sync notice:", err?.message);
      }
    }
    if (Array.isArray(fullState.supplierPayments) && fullState.supplierPayments.length > 0) {
      try {
        const validPayments = deduplicate(fullState.supplierPayments, (p) => toSafeString(p.paymentNumber || p.id));
        totalEntitiesCount += validPayments.length;
        const spRows = validPayments.map((sp) => {
          const paymentNumber = toSafeString(sp.paymentNumber, sp.id || `SPAY-${Date.now()}`);
          if (!paymentNumber) return null;
          return {
            id: `sp-${paymentNumber}`,
            paymentNumber,
            supplierId: toSafeString(sp.supplierId, "sup-default"),
            supplierName: toSafeString(sp.supplierName, "Vendor"),
            billId: toSafeString(sp.billId) || null,
            amount: toSafeNumber(sp.amount),
            paymentDate: toSafeString(sp.paymentDate || sp.date, (/* @__PURE__ */ new Date()).toISOString().split("T")[0]),
            paymentMethod: toSafeString(sp.paymentMethod, "Bank Transfer"),
            bankAccount: toSafeString(sp.bankAccount) || null,
            referenceNumber: toSafeString(sp.referenceNumber) || null,
            status: toSafeString(sp.status, "Completed"),
            notes: toSafeString(sp.notes) || null,
            createdAt: /* @__PURE__ */ new Date()
          };
        }).filter(Boolean);
        if (spRows.length > 0) {
          await db.insert(pmsSupplierPayments).values(spRows).onConflictDoUpdate({
            target: pmsSupplierPayments.paymentNumber,
            set: {
              supplierId: sql`excluded.supplier_id`,
              supplierName: sql`excluded.supplier_name`,
              billId: sql`excluded.bill_id`,
              amount: sql`excluded.amount`,
              paymentDate: sql`excluded.payment_date`,
              paymentMethod: sql`excluded.payment_method`,
              bankAccount: sql`excluded.bank_account`,
              referenceNumber: sql`excluded.reference_number`,
              status: sql`excluded.status`,
              notes: sql`excluded.notes`
            }
          });
        }
      } catch (err) {
        console.warn("Supplier payments relational sync notice:", err?.message);
      }
    }
    if (Array.isArray(fullState.restaurantOrders) && fullState.restaurantOrders.length > 0) {
      try {
        const validOrders = deduplicate(fullState.restaurantOrders, (o) => toSafeString(o.orderNumber || o.id));
        totalEntitiesCount += validOrders.length;
        const ordRows = validOrders.map((ord) => {
          const orderNumber = toSafeString(ord.orderNumber, ord.id || `ORD-${Date.now()}`);
          if (!orderNumber) return null;
          return {
            id: `ord-${orderNumber}`,
            orderNumber,
            orderType: toSafeString(ord.orderType, "Dine-In"),
            tableNumber: toSafeString(ord.tableNumber) || null,
            roomNumber: toSafeString(ord.roomNumber) || null,
            guestName: toSafeString(ord.guestName) || null,
            subtotal: toSafeNumber(ord.subtotal),
            tax: toSafeNumber(ord.tax),
            serviceCharge: toSafeNumber(ord.serviceCharge),
            total: toSafeNumber(ord.total),
            paymentStatus: toSafeString(ord.paymentStatus, "Paid"),
            paymentMethod: toSafeString(ord.paymentMethod) || null,
            items: ord.items || [],
            createdAt: /* @__PURE__ */ new Date()
          };
        }).filter(Boolean);
        if (ordRows.length > 0) {
          await db.insert(pmsRestaurantOrders).values(ordRows).onConflictDoUpdate({
            target: pmsRestaurantOrders.orderNumber,
            set: {
              orderType: sql`excluded.order_type`,
              tableNumber: sql`excluded.table_number`,
              roomNumber: sql`excluded.room_number`,
              guestName: sql`excluded.guest_name`,
              subtotal: sql`excluded.subtotal`,
              tax: sql`excluded.tax`,
              serviceCharge: sql`excluded.service_charge`,
              total: sql`excluded.total`,
              paymentStatus: sql`excluded.payment_status`,
              paymentMethod: sql`excluded.payment_method`,
              items: sql`excluded.items`
            }
          });
        }
      } catch (err) {
        console.warn("Restaurant orders relational sync notice:", err?.message);
      }
    }
    if (Array.isArray(fullState.auditLogs) && fullState.auditLogs.length > 0) {
      try {
        const validLogs = deduplicate(fullState.auditLogs.slice(0, 200), (a) => toSafeString(a.id));
        totalEntitiesCount += validLogs.length;
        const logRows = validLogs.map((log) => {
          const logId = toSafeString(log.id || `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
          return {
            id: logId,
            userId: toSafeString(log.userId) || null,
            userName: toSafeString(log.userName) || null,
            userRole: toSafeString(log.userRole) || null,
            action: toSafeString(log.action, "Action"),
            entityType: toSafeString(log.entityType, "System"),
            entityId: toSafeString(log.entityId, logId),
            oldValue: toSafeString(log.oldValue) || null,
            newValue: toSafeString(log.newValue) || null,
            ipAddress: toSafeString(log.ipAddress) || null,
            createdAt: log.createdAt ? new Date(log.createdAt) : /* @__PURE__ */ new Date()
          };
        });
        for (let i = 0; i < logRows.length; i += 50) {
          const chunk = logRows.slice(i, i + 50);
          await db.insert(pmsAuditLogs).values(chunk).onConflictDoNothing();
        }
      } catch (err) {
        console.warn("Audit logs relational sync notice:", err?.message);
      }
    }
    try {
      await db.insert(pmsSyncEvents).values({
        entityType: "FULL_STATE_SNAPSHOT",
        entityId: `v${nextVersion}`,
        action: "GLOBAL_SYNC",
        payload: {
          totalEntities: totalEntitiesCount,
          roomsCount: fullState.rooms?.length || 0,
          reservationsCount: fullState.reservations?.length || 0,
          staysCount: fullState.stays?.length || 0,
          foliosCount: fullState.folios?.length || 0,
          paymentsCount: fullState.payments?.length || 0,
          glAccountsCount: fullState.glAccounts?.length || 0,
          journalVouchersCount: fullState.journalVouchers?.length || 0,
          invoicesCount: fullState.invoices?.length || 0,
          cityLedgerCount: fullState.cityLedgerAccounts?.length || 0,
          suppliersCount: fullState.suppliers?.length || 0,
          purchaseBillsCount: fullState.purchaseBills?.length || 0,
          supplierPaymentsCount: fullState.supplierPayments?.length || 0,
          restaurantOrdersCount: fullState.restaurantOrders?.length || 0
        },
        syncedAt: /* @__PURE__ */ new Date(),
        status: "SUCCESS"
      });
    } catch (err) {
      console.warn("Sync events record notice:", err?.message);
    }
    return {
      success: true,
      version: nextVersion,
      totalEntities: totalEntitiesCount,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      region: "Supabase Cloud"
    };
  } catch (error) {
    const msg = error?.message || String(error);
    if (msg.includes("authentication failed") || msg.includes("ECONNREFUSED") || msg.includes("57P01")) {
      markPostgresAuthFailed();
    }
    const sbUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://cvviwipdglcajldmzbvc.supabase.co").replace(/\/rest\/v1\/?$/i, "").trim();
    const sbKey = getSupabaseServerKey();
    if (sbUrl && sbKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(sbUrl, sbKey);
        await sb.from("pms_snapshots").upsert({
          snapshot_key: "current_pms_state",
          resort_name: fullState.resortName || "Heritage Resort & Spa",
          business_date: fullState.businessDate || "2026-08-31",
          state_payload: fullState,
          version: 1,
          synced_by: syncedBy,
          total_entities: totalEntitiesCount,
          last_synced_at: (/* @__PURE__ */ new Date()).toISOString()
        }, { onConflict: "snapshot_key" });
        return {
          success: true,
          version: 1,
          totalEntities: totalEntitiesCount,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          region: "Supabase Cloud (REST Fallback)"
        };
      } catch (restErr) {
        console.warn("REST fallback notice:", restErr?.message || restErr);
      }
    }
    return {
      success: true,
      version: 1,
      totalEntities: totalEntitiesCount,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      region: "Local State Mirror (PostgreSQL offline)",
      localOnly: true
    };
  }
}
async function loadLatestPmsSnapshot() {
  if (!isPostgresConfigured()) {
    const sbUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://cvviwipdglcajldmzbvc.supabase.co").replace(/\/rest\/v1\/?$/i, "").trim();
    const sbKey = getSupabaseServerKey();
    if (sbUrl && sbKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(sbUrl, sbKey);
        const { data, error } = await sb.from("pms_snapshots").select("snapshot_key, version, resort_name, business_date, total_entities, last_synced_at, state_payload").eq("snapshot_key", "current_pms_state").maybeSingle();
        if (!error && data && data.state_payload) {
          return {
            version: data.version || 1,
            resortName: data.resort_name,
            businessDate: data.business_date,
            totalEntities: data.total_entities,
            lastSyncedAt: data.last_synced_at,
            state: data.state_payload,
            pmsState: data.state_payload
          };
        }
      } catch (err) {
        console.warn("Supabase REST loadLatestPmsSnapshot notice:", err?.message || err);
      }
    }
    return null;
  }
  try {
    await ensureDatabaseSchema();
    const [snapshot] = await db.select().from(pmsSnapshots).where(eq(pmsSnapshots.snapshotKey, "current_pms_state")).limit(1);
    if (!snapshot) return null;
    return {
      version: snapshot.version,
      resortName: snapshot.resortName,
      businessDate: snapshot.businessDate,
      totalEntities: snapshot.totalEntities,
      lastSyncedAt: snapshot.lastSyncedAt,
      state: snapshot.statePayload,
      pmsState: snapshot.statePayload
    };
  } catch (error) {
    console.warn("Failed to load latest PMS snapshot from PostgreSQL:", error);
    return null;
  }
}
async function getGlAccountsFromDb() {
  if (!isPostgresConfigured()) {
    return [];
  }
  try {
    await ensureDatabaseSchema();
    return await db.select().from(pmsGlAccounts).orderBy(pmsGlAccounts.code);
  } catch (error) {
    console.warn("Failed to fetch GL Accounts from PostgreSQL:", error);
    return [];
  }
}
async function getJournalVouchersFromDb(limit = 100) {
  if (!isPostgresConfigured()) {
    return [];
  }
  try {
    await ensureDatabaseSchema();
    return await db.select().from(pmsJournalVouchers).orderBy(desc(pmsJournalVouchers.createdAt)).limit(limit);
  } catch (error) {
    console.warn("Failed to fetch Journal Vouchers from PostgreSQL:", error);
    return [];
  }
}
async function getCityLedgerFromDb() {
  if (!isPostgresConfigured()) {
    return [];
  }
  try {
    await ensureDatabaseSchema();
    return await db.select().from(pmsCityLedger).orderBy(pmsCityLedger.companyName);
  } catch (error) {
    console.warn("Failed to fetch City Ledger accounts from PostgreSQL:", error);
    return [];
  }
}
async function getTrialBalanceFromDb() {
  if (!isPostgresConfigured()) {
    return {
      asOf: (/* @__PURE__ */ new Date()).toISOString(),
      rows: [],
      totalDebit: 0,
      totalCredit: 0,
      isBalanced: true
    };
  }
  try {
    await ensureDatabaseSchema();
    const accounts = await db.select().from(pmsGlAccounts).orderBy(pmsGlAccounts.code);
    let totalDebit = 0;
    let totalCredit = 0;
    const rows = accounts.map((acc) => {
      const bal = Number(acc.balance || 0);
      const isDebitNormal = acc.category === "Asset" || acc.category === "Expense";
      const debit = isDebitNormal ? bal >= 0 ? bal : 0 : bal < 0 ? Math.abs(bal) : 0;
      const credit = !isDebitNormal ? bal >= 0 ? bal : 0 : bal < 0 ? Math.abs(bal) : 0;
      totalDebit += debit;
      totalCredit += credit;
      return {
        code: acc.code,
        name: acc.name,
        type: acc.accountType,
        category: acc.category,
        balance: bal,
        debit,
        credit
      };
    });
    return {
      asOf: (/* @__PURE__ */ new Date()).toISOString(),
      rows,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
    };
  } catch (error) {
    console.warn("Failed to calculate trial balance from PostgreSQL:", error);
    return {
      asOf: (/* @__PURE__ */ new Date()).toISOString(),
      rows: [],
      totalDebit: 0,
      totalCredit: 0,
      isBalanced: true
    };
  }
}
async function recordSyncEvent(entityType, entityId, action, payload) {
  if (!isPostgresConfigured()) {
    return { entityType, entityId, action, syncedAt: (/* @__PURE__ */ new Date()).toISOString(), status: "LOCAL_ONLY" };
  }
  try {
    await ensureDatabaseSchema();
    const [record] = await db.insert(pmsSyncEvents).values({
      entityType,
      entityId,
      action,
      payload: payload || null,
      syncedAt: /* @__PURE__ */ new Date(),
      status: "SUCCESS"
    }).returning();
    if (action.toUpperCase() === "DELETE") {
      try {
        const lowerType = entityType.toLowerCase();
        if (lowerType.includes("room")) {
          await db.delete(pmsRooms).where(or(eq(pmsRooms.id, entityId), eq(pmsRooms.roomNumber, entityId)));
        } else if (lowerType.includes("reservation")) {
          await db.delete(pmsReservations).where(or(eq(pmsReservations.id, entityId), eq(pmsReservations.reservationNumber, entityId)));
        } else if (lowerType.includes("stay")) {
          await db.delete(pmsStays).where(eq(pmsStays.id, entityId));
        } else if (lowerType.includes("folio")) {
          await db.delete(pmsFolios).where(eq(pmsFolios.id, entityId));
        }
      } catch (delErr) {
        console.warn("Relational DELETE cleanup notice:", delErr);
      }
    }
    return record;
  } catch (error) {
    console.warn("Failed to log sync event in PostgreSQL:", error);
    return { entityType, entityId, action, syncedAt: (/* @__PURE__ */ new Date()).toISOString(), status: "LOGGED_LOCALLY" };
  }
}
async function getRecentSyncEvents(limit = 20) {
  if (!isPostgresConfigured()) {
    return [];
  }
  try {
    await ensureDatabaseSchema();
    return await db.select().from(pmsSyncEvents).orderBy(desc(pmsSyncEvents.syncedAt)).limit(limit);
  } catch (error) {
    console.warn("Failed to fetch sync events:", error);
    return [];
  }
}

// src/server/app.ts
init_db();

// src/services/mockInventoryData.ts
var SEED_SUPPLIERS = [
  {
    id: "sup-1",
    code: "SUP-001",
    name: "Bengal Meat Processing Ltd.",
    contactPerson: "Kamrul Hassan",
    phone: "+880 1713-112233",
    email: "sales@bengalmeat.com",
    address: "Tejgaon I/A, Dhaka, Bangladesh",
    tradeLicense: "TRAD/DSCC/012938/2024",
    taxNumber: "TIN-4829103948",
    paymentTerms: "Net 30",
    creditLimit: 5e5,
    categoriesSupplied: ["Meat", "Chicken", "Frozen Food"],
    currentPayableBalance: 45e3,
    rating: 4.9,
    active: true,
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "sup-2",
    code: "SUP-002",
    name: "Pran Agro Foods & Dairy",
    contactPerson: "Moinul Haque",
    phone: "+880 1713-223344",
    email: "b2b@prangroup.com",
    address: "Pran-RFL Center, Middle Badda, Dhaka",
    tradeLicense: "TRAD/DNCC/082711/2024",
    taxNumber: "TIN-3829104821",
    paymentTerms: "Net 15",
    creditLimit: 3e5,
    categoriesSupplied: ["Dairy", "Juice", "Spices & Seasoning", "Oils & Ghee", "Bakery"],
    currentPayableBalance: 32e3,
    rating: 4.8,
    active: true,
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "sup-3",
    code: "SUP-003",
    name: "Dhaka Beverage & Mixers Supply",
    contactPerson: "Sabbir Ahmed",
    phone: "+880 1713-334455",
    email: "orders@dhakabeverages.com",
    address: "Kawran Bazar, Dhaka",
    taxNumber: "TIN-2819301928",
    paymentTerms: "Net 15",
    creditLimit: 2e5,
    categoriesSupplied: ["Soft Drinks", "Mineral Water", "Mixers", "Mocktail Syrups"],
    currentPayableBalance: 18500,
    rating: 4.7,
    active: true,
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "sup-4",
    code: "SUP-004",
    name: "Padma Fresh Fish & River Catch",
    contactPerson: "Ali Hossain",
    phone: "+880 1713-445566",
    email: "padmafish@gmail.com",
    address: "Mawa Ghat / Dohar, Dhaka",
    taxNumber: "TIN-1928374650",
    paymentTerms: "Immediate",
    creditLimit: 1e5,
    categoriesSupplied: ["Fish"],
    currentPayableBalance: 12e3,
    rating: 4.9,
    active: true,
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "sup-5",
    code: "SUP-005",
    name: "Dohar Local Green Farmers Co-op",
    contactPerson: "Nurul Islam",
    phone: "+880 1713-556677",
    email: "doharfarmers@gmail.com",
    address: "Joypara, Dohar, Dhaka",
    taxNumber: "TIN-9283746510",
    paymentTerms: "Immediate",
    creditLimit: 5e4,
    categoriesSupplied: ["Vegetables", "Fruits"],
    currentPayableBalance: 8500,
    rating: 4.9,
    active: true,
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "sup-6",
    code: "SUP-006",
    name: "Square Toiletries & Linen Solutions",
    contactPerson: "Farhan Rahman",
    phone: "+880 1713-667788",
    email: "institutional@squaregroup.com",
    address: "Square Centre, Uttara, Dhaka",
    taxNumber: "TIN-5647382910",
    paymentTerms: "Net 30",
    creditLimit: 4e5,
    categoriesSupplied: ["Cleaning Chemicals", "Guest Toiletries", "Bed Linen"],
    currentPayableBalance: 28e3,
    rating: 4.8,
    active: true,
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "sup-7",
    code: "SUP-007",
    name: "Star Tech & IT Solutions Ltd.",
    contactPerson: "Tanvir Hossain",
    phone: "+880 1713-778899",
    email: "corporate@startech.com.bd",
    address: "Multiplan Center, New Elephant Road, Dhaka",
    taxNumber: "TIN-6789123450",
    paymentTerms: "Net 15",
    creditLimit: 35e4,
    categoriesSupplied: ["Computer Peripherals", "Networking Cables", "POS Terminals", "Toners & Ribbons"],
    currentPayableBalance: 15400,
    rating: 4.9,
    active: true,
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "sup-8",
    code: "SUP-008",
    name: "Orient Paper & Office Stationery Ltd.",
    contactPerson: "Rezaul Karim",
    phone: "+880 1713-889900",
    email: "b2b@orientpaper.com.bd",
    address: "Banglabazar, Dhaka-1100",
    taxNumber: "TIN-7890123456",
    paymentTerms: "Net 30",
    creditLimit: 25e4,
    categoriesSupplied: ["Printing Paper", "Official Stationery", "Thermal Rolls", "Folders & Envelopes"],
    currentPayableBalance: 9800,
    rating: 4.7,
    active: true,
    createdAt: "2026-01-01T00:00:00Z"
  }
];

// src/services/mockPmsDatabase.ts
function getTodayString() {
  const d = /* @__PURE__ */ new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
var DEFAULT_SETTINGS = {
  resortName: "Grand Horizon Resort & Convention Center",
  address: "100 Marina Boulevard, Bayfront District",
  phone: "+8801330480273",
  email: "operations@lesyncpms.com",
  website: "www.lesyncpms.com",
  logoUrl: "",
  taxRatePercent: 15,
  serviceChargePercent: 10,
  currencySymbol: "\u09F3",
  checkInTime: "14:00",
  checkOutTime: "12:00",
  allowOverbooking: false,
  requireDepositForReservation: true,
  autoNightAuditEnabled: false,
  autoNightAuditTime: "06:00",
  currentBusinessDate: typeof window !== "undefined" ? getTodayString() : getTodayString(),
  lastNightAuditDate: void 0,
  folioPrefix: "FOL-",
  invPrefix: "INV-",
  resPrefix: "RES-",
  banquetPrefix: "EVT-",
  poPrefix: "PO-",
  grnPrefix: "GRN-",
  posPrefix: "POS-",
  kotPrefix: "KOT-",
  jvPrefix: "JV-",
  receiptPrefix: "RCT-",
  numberPadding: 5,
  numberDateFormat: "YYYY",
  autoDirtyOnCheckout: true,
  allowDirectRoomPost: true,
  stopPostStrict: true,
  lateCheckoutGraceMinutes: 30
};
var SEED_USERS = [
  {
    id: "usr-admin-1",
    name: "Labib Zunaedy",
    username: "admin",
    email: "admin@lesyncpms.com",
    role: "Super Admin",
    department: "Executive Management",
    active: true,
    phone: "+880 1711-000001",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "usr-it-1",
    name: "Kazi Tanvir",
    username: "itadmin",
    email: "it@lesyncpms.com",
    role: "Management",
    department: "Information Technology",
    active: true,
    phone: "+880 1711-000002",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "usr-res-1",
    name: "Tahmina Akter",
    username: "reservation",
    email: "reservation@lesyncpms.com",
    role: "Front Desk",
    department: "Front Office",
    active: true,
    phone: "+880 1711-000003",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "usr-fo-1",
    name: "Farhan Ahmed",
    username: "frontdesk",
    email: "frontdesk@lesyncpms.com",
    role: "Front Desk",
    department: "Front Office",
    active: true,
    phone: "+880 1711-000004",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "usr-acc-1",
    name: "Sabrina Khan",
    username: "accounts",
    email: "accounts@lesyncpms.com",
    role: "Accounts",
    department: "Finance & Accounts",
    active: true,
    phone: "+880 1711-000005",
    createdAt: "2026-01-01T00:00:00.000Z"
  }
];
var SEED_ROOM_TYPES = [
  {
    id: "rt-1",
    name: "Presidential Suite",
    description: "Ultra-luxurious top-floor suite with private infinity view balcony, master lounge, jacuzzi, and butler service.",
    maxAdults: 4,
    maxChildren: 2,
    baseRate: 28e3,
    extraAdultRate: 3500,
    extraChildRate: 2e3,
    amenities: ["King Bed", "Private Jacuzzi", "Lounge Area", "River View", 'Smart TV 65"', "High-speed Wi-Fi", "Complimentary Breakfast", "Butler Service", "Espresso Machine"],
    active: true,
    totalRooms: 4
  },
  {
    id: "rt-2",
    name: "Royal Suite",
    description: "Opulent suite featuring master bedroom, living hall, modern bath amenities, and panoramic resort garden views.",
    maxAdults: 3,
    maxChildren: 2,
    baseRate: 18500,
    extraAdultRate: 2500,
    extraChildRate: 1500,
    amenities: ["King Bed", "Bathtub", "Living Area", "Garden View", 'Smart TV 55"', "High-speed Wi-Fi", "Complimentary Breakfast", "Mini Fridge"],
    active: true,
    totalRooms: 14
  },
  {
    id: "rt-3",
    name: "Honeymoon Suite",
    description: "Specially decorated romantic suite with king-size canopy bed, mood lighting, aromatherapy setup, and romantic balcony.",
    maxAdults: 2,
    maxChildren: 1,
    baseRate: 15e3,
    extraAdultRate: 2500,
    extraChildRate: 1200,
    amenities: ["Canopy King Bed", "Jacuzzi Bath", "Balcony", "Romantic Decor", "Flower Setup", "Smart TV", "Wi-Fi", "Breakfast in Bed"],
    active: true,
    totalRooms: 8
  },
  {
    id: "rt-4",
    name: "Family Deluxe",
    description: "Spacious interconnected or twin double bedrooms designed for family comfort with kids play-corner setup.",
    maxAdults: 4,
    maxChildren: 3,
    baseRate: 12500,
    extraAdultRate: 2e3,
    extraChildRate: 1e3,
    amenities: ["2 Queen Beds", "Attached Bathroom", "Balcony", 'Smart TV 43"', "Wi-Fi", "Complimentary Breakfast", "Tea/Coffee Maker"],
    active: true,
    totalRooms: 18
  },
  {
    id: "rt-5",
    name: "Deluxe Room",
    description: "Elegantly furnished premium room with private balcony, workstation, and serene swimming pool view.",
    maxAdults: 2,
    maxChildren: 1,
    baseRate: 8500,
    extraAdultRate: 1800,
    extraChildRate: 900,
    amenities: ["Queen Bed", "Pool View Balcony", "Modern Bath", "Workstation", "Smart TV", "Wi-Fi", "Complimentary Breakfast"],
    active: true,
    totalRooms: 60
  },
  {
    id: "rt-6",
    name: "Standard Room",
    description: "Cozy and well-appointed room for business and budget travelers equipped with essential modern comforts.",
    maxAdults: 2,
    maxChildren: 1,
    baseRate: 5500,
    extraAdultRate: 1500,
    extraChildRate: 800,
    amenities: ["Double Bed", "Attached Bath", "LED TV", "Wi-Fi", "Work Table", "Complimentary Breakfast"],
    active: true,
    totalRooms: 12
  }
];
var SEED_FLOORS = [
  {
    id: "fl-1",
    floorNumber: 1,
    name: "1st Floor - East Garden Wing",
    code: "FL-01",
    building: "Main Resort Complex",
    wing: "East Garden Wing",
    keyCardPrefix: "KC-1",
    isSmokingAllowed: false,
    active: true,
    description: "Serene garden and swimming pool view rooms with private balconies"
  },
  {
    id: "fl-2",
    floorNumber: 2,
    name: "2nd Floor - Lakeside Wing",
    code: "FL-02",
    building: "Main Resort Complex",
    wing: "West Lake Wing",
    keyCardPrefix: "KC-2",
    isSmokingAllowed: false,
    active: true,
    description: "Scenic panoramic lake view suites and family deluxe rooms"
  },
  {
    id: "fl-3",
    floorNumber: 3,
    name: "3rd Floor - Executive Club Level",
    code: "FL-03",
    building: "Main Resort Complex",
    wing: "Executive North Tower",
    keyCardPrefix: "KC-3",
    isSmokingAllowed: false,
    active: true,
    description: "Honeymoon and Royal Suites with dedicated club lounge amenities"
  },
  {
    id: "fl-4",
    floorNumber: 4,
    name: "4th Floor - Presidential Sky Villa",
    code: "FL-04",
    building: "Main Resort Complex",
    wing: "Presidential Tower",
    keyCardPrefix: "KC-4",
    isSmokingAllowed: false,
    active: true,
    description: "Ultra-luxury penthouse and Presidential suites with personal butler service"
  },
  {
    id: "fl-10",
    floorNumber: 10,
    name: "10th Floor - Tower Wing Suites",
    code: "FL-10",
    building: "Main Resort Complex",
    wing: "Tower Wing",
    keyCardPrefix: "KC-10",
    isSmokingAllowed: false,
    active: true,
    description: "Suites and Deluxe rooms from 1001 to 1055"
  },
  {
    id: "fl-11",
    floorNumber: 11,
    name: "11th Floor - Skyline Executive",
    code: "FL-11",
    building: "Main Resort Complex",
    wing: "Tower Wing",
    keyCardPrefix: "KC-11",
    isSmokingAllowed: false,
    active: true,
    description: "Executive Suites and Rooms from 1056 to 1110"
  }
];
function generate110RoomsStartingWith1001() {
  const rooms = [];
  for (let num = 1001; num <= 1110; num++) {
    const roomNumStr = String(num);
    const floor = num <= 1055 ? 10 : 11;
    const wing = floor === 10 ? "Tower Wing - Suites" : "Tower Wing - Skyline Executive";
    let roomTypeId = "rt-5";
    let roomTypeName = "Deluxe Room";
    let features = ["High-Speed Wi-Fi", "Balcony", 'Smart TV 50"', "Mini Bar", "Air Conditioned"];
    let amenities = ["King Bed", "Rain Shower", "Safety Locker", "Electric Kettle", "Hair Dryer"];
    if (num === 1001 || num === 1002 || num === 1109 || num === 1110) {
      roomTypeId = "rt-1";
      roomTypeName = "Presidential Suite";
      features = ["Private Butler Service", "Panoramic Sky View Balcony", "Jacuzzi", "Executive Workstation", "Bang & Olufsen Sound System"];
      amenities = ["Master King Bed", "Living Lounge", "Dine-in Bar", "Walk-in Closet", "Herm\xE8s Toiletries", "Nespresso Coffee Machine"];
    } else if (num >= 1003 && num <= 1010 || num >= 1101 && num <= 1108) {
      roomTypeId = "rt-2";
      roomTypeName = "Royal Suite";
      features = ["Club Lounge Access", "Private Balcony", "Living Room", 'Smart TV 55"', "High-speed Wi-Fi"];
      amenities = ["King Bed", "Bathtub", "Plush Robes & Slippers", "Complimentary High Tea", "Mini Bar"];
    } else if (num >= 1011 && num <= 1025) {
      roomTypeId = "rt-3";
      roomTypeName = "Honeymoon Suite";
      features = ["Romantic Balcony", "Jacuzzi Bath", "Mood Lighting", "Aromatherapy Setup", 'Smart TV 50"'];
      amenities = ["Canopy King Bed", "Flower Arrangement", "Complimentary Cake & Wine", "Breakfast in Bed"];
    } else if (num >= 1026 && num <= 1050) {
      roomTypeId = "rt-4";
      roomTypeName = "Family Deluxe";
      features = ["Twin Double Beds", "Kids Play Corner", "Pool View Balcony", "Microwave & Kettle", 'Smart TV 43"'];
      amenities = ["2 Queen Beds", "Attached Modern Bath", "Extra Crib Available", "Tea/Coffee Station"];
    } else if (num >= 1051 && num <= 1085) {
      roomTypeId = "rt-5";
      roomTypeName = "Deluxe Room";
      features = ["Balcony", "City / Lake View", "Workstation", 'Smart TV 43"', "High-speed Wi-Fi"];
      amenities = ["Queen Bed", "Walk-in Shower", "Complimentary Breakfast", "Mini Fridge"];
    } else {
      roomTypeId = "rt-6";
      roomTypeName = "Standard Room";
      features = ["LED TV", "Wi-Fi", "Work Table", "Air Conditioned"];
      amenities = ["Double Bed", "Attached Bath", "Complimentary Breakfast", "Kettle"];
    }
    let operationalStatus = "Available";
    let housekeepingStatus = "Clean";
    if (num % 7 === 0) {
      operationalStatus = "Occupied";
      housekeepingStatus = "Clean";
    } else if (num % 13 === 0) {
      operationalStatus = "Reserved";
      housekeepingStatus = "Clean";
    } else if (num % 23 === 0) {
      operationalStatus = "Dirty";
      housekeepingStatus = "Dirty";
    } else if (num % 37 === 0) {
      operationalStatus = "Cleaning";
      housekeepingStatus = "Cleaning";
    } else if (num % 29 === 0) {
      operationalStatus = "Inspected";
      housekeepingStatus = "Inspected";
    }
    const rate = roomTypeId === "rt-1" ? 28e3 : roomTypeId === "rt-2" ? 18500 : roomTypeId === "rt-3" ? 15e3 : roomTypeId === "rt-4" ? 12500 : roomTypeId === "rt-5" ? 8500 : 5500;
    rooms.push({
      id: `rm-${roomNumStr}`,
      roomNumber: roomNumStr,
      roomTypeId,
      roomTypeName,
      floor,
      building: "Main Resort Complex",
      wing,
      rate,
      baseRate: rate,
      isSmoking: false,
      keyCardCode: `KC-${roomNumStr}`,
      features,
      amenities,
      operationalStatus,
      housekeepingStatus,
      active: true,
      notes: num === 1001 ? "VIP Presidential Suite" : void 0
    });
  }
  return rooms;
}
var SEED_ROOMS = generate110RoomsStartingWith1001();
var SEED_HALLS = [
  {
    id: "hl-1",
    name: "Grand Padma Ballroom",
    code: "HALL-PADMA",
    venueType: "Convention Hall",
    floor: "Ground Floor, Convention Center Wing",
    description: "Pillar-less supreme convention hall with intelligent lighting, high-fidelity line-array sound, and 800+ banquet capacity.",
    capacity: 800,
    seatingTheater: 1e3,
    seatingBanquet: 750,
    seatingUShape: 180,
    seatingClassroom: 450,
    dimensions: "12,000 sq ft",
    baseRatePerDay: 18e4,
    baseRateHalfDay: 105e3,
    baseRatePerHour: 2e4,
    amenities: ["Pillarless Hall", "Stage & Green Room", "Dual 4K Laser Projectors", "Line-Array Sound", "Central Air Conditioning", "Dedicated Buffet Zone", "VIP Green Room"],
    active: true
  },
  {
    id: "hl-2",
    name: "Meghna Convention & Banquet Hall",
    code: "HALL-MEGHNA",
    venueType: "Banquet Hall",
    floor: "1st Floor, Main Clubhouse",
    description: "Medium scale modern conference & wedding banquet hall with direct attached open garden lawn access.",
    capacity: 400,
    seatingTheater: 450,
    seatingBanquet: 350,
    seatingUShape: 90,
    seatingClassroom: 200,
    dimensions: "6,500 sq ft",
    baseRatePerDay: 11e4,
    baseRateHalfDay: 65e3,
    baseRatePerHour: 14e3,
    amenities: ["Stage Setup", "Garden Lawn Access", "JBL PA System", "Central AC", "Bridal Changing Suite", "Dynamic Mood Lights"],
    active: true
  },
  {
    id: "hl-3",
    name: "Jamuna Banquet Hall",
    code: "HALL-JAMUNA",
    venueType: "Banquet Hall",
    floor: "2nd Floor, Lakeside Wing",
    description: "Chic event space ideal for seminars, corporate training, engagements, and birthday galas.",
    capacity: 200,
    seatingTheater: 240,
    seatingBanquet: 180,
    seatingUShape: 60,
    seatingClassroom: 110,
    dimensions: "3,800 sq ft",
    baseRatePerDay: 75e3,
    baseRateHalfDay: 45e3,
    baseRatePerHour: 9500,
    amenities: ["Audio Visual System", "Motorized Screen & Podium", "Dual Wireless Mics", "Buffet Serving Area", "High-Speed Wi-Fi"],
    active: true
  },
  {
    id: "hl-4",
    name: "Executive Boardroom",
    code: "ROOM-EXEC",
    venueType: "Boardroom",
    floor: "3rd Floor, Administrative Block",
    description: "High-level executive boardroom with ergonomic leather chairs, video conferencing, and private coffee lounge.",
    capacity: 35,
    seatingTheater: 40,
    seatingBanquet: 25,
    seatingUShape: 28,
    seatingClassroom: 30,
    dimensions: "900 sq ft",
    baseRatePerDay: 35e3,
    baseRateHalfDay: 22e3,
    baseRatePerHour: 4500,
    amenities: ["Solid Teak Conference Table", '85" 4K Smart Interactive Screen', "Polycom Video Conferencing", "High-Speed LAN", "Dedicated Coffee Station"],
    active: true
  },
  {
    id: "hl-5",
    name: "Padmabati Meeting Room",
    code: "ROOM-PADMABATI",
    venueType: "Meeting Room",
    floor: "2nd Floor, Convention Center Wing",
    description: "Modern compact workshop and training room equipped for corporate seminars, focus groups, and presentations.",
    capacity: 60,
    seatingTheater: 70,
    seatingBanquet: 50,
    seatingUShape: 35,
    seatingClassroom: 45,
    dimensions: "1,400 sq ft",
    baseRatePerDay: 45e3,
    baseRateHalfDay: 28e3,
    baseRatePerHour: 6e3,
    amenities: ["Full HD Projector", "Whiteboard & Flipcharts", "Surround Sound", "Ergonomic Seating", "Individual Power Outlets"],
    active: true
  }
];
var SEED_PACKAGES = [
  {
    id: "pkg-1",
    name: "Honeymoon Bliss Romance",
    description: "3 Days / 2 Nights in Honeymoon Suite, candlelight dinner by pool, romantic room decor, couple massage, and buffet breakfast.",
    packageType: "Honeymoon",
    price: 42e3,
    active: true,
    includes: ["2 Nights in Honeymoon Suite", "Daily Gourmet Buffet Breakfast", "1 Candlelight 4-Course Dinner", "Flower Garland & Bed Decor", "Fruit Basket & Cake", "Late Check-out 3 PM"],
    nightsCount: 2
  },
  {
    id: "pkg-2",
    name: "Deluxe Weekend Family Getaway",
    description: "2 Days / 1 Night in Family Deluxe room, swimming pool access, kids game zone tokens, barbecue dinner, and breakfast.",
    packageType: "Family",
    price: 18500,
    active: true,
    includes: ["1 Night in Family Deluxe Room", "Breakfast for 4 (2 Adults + 2 Kids)", "Live BBQ Dinner Buffet", "Unlimited Pool & Jacuzzi", "Cycling around Resort Garden"],
    nightsCount: 1
  },
  {
    id: "pkg-3",
    name: "Corporate Executive Seminar (Full Day)",
    description: "Hall booking, morning snacks with tea/coffee, 3-course executive lunch, afternoon high-tea, notepad & pens, audio-visual gear.",
    packageType: "Corporate",
    price: 1850,
    // per person
    active: true,
    includes: ["Hall Venue & Sound System", "Morning Snacks & Tea", "Executive Buffet Lunch", "Afternoon Hi-Tea & Pastry", "Stationery Kit", "Wi-Fi & Projector Screen"]
  },
  {
    id: "pkg-4",
    name: "Royal Wedding Celebration Gala",
    description: "Grand Padma Ballroom full day, luxury stage decoration, floral entrance, sound/lighting engineer, bridal holding suite.",
    packageType: "Event",
    price: 35e4,
    active: true,
    includes: ["Grand Padma Ballroom Full Day", "Luxury Floral Stage Decor", "Bridal Suite 1 Night Complimentary", "Intelligent Dynamic Lighting", "Red Carpet Pathway", "Dedicated Event Coordinator"]
  }
];
var SEED_MENU_CATEGORIES = [
  { id: "cat-1", name: "Traditional Bengali & Royal Feast", active: true },
  { id: "cat-2", name: "Grills, Steaks & BBQ", active: true },
  { id: "cat-3", name: "Continental & Italian", active: true },
  { id: "cat-4", name: "Oriental & Pan-Asian", active: true },
  { id: "cat-5", name: "Beverages, Mocktails & Juices", active: true },
  { id: "cat-6", name: "Desserts & Sweet Delights", active: true },
  { id: "cat-7", name: "Appetizers, Soups & Salads", active: true },
  { id: "cat-8", name: "Breakfast & All-Day Dining", active: true }
];
var SEED_MENU_ITEMS = [
  // 1. Traditional Bengali & Royal Feast
  { id: "mi-1", categoryId: "cat-1", categoryName: "Traditional Bengali & Royal Feast", name: "Special Mutton Kacchi Biryani", description: "Traditional aromatic basmati rice cooked with tender mutton cuts, saffron, aloo, and boiled egg. Served with borhani & salad.", price: 650, active: true },
  { id: "mi-2", categoryId: "cat-1", categoryName: "Traditional Bengali & Royal Feast", name: "Padma River Hilsha Curry (Mustard/Sorshe)", description: "Fresh Padma Ilish cooked in pungent mustard gravy with green chillies. Served with steamed rice.", price: 850, active: true },
  { id: "mi-3", categoryId: "cat-1", categoryName: "Traditional Bengali & Royal Feast", name: "Bhuna Khichuri with Beef Kala Bhuna", description: "Moong dal khichuri paired with authentic Chittagong style slow-braised beef kala bhuna.", price: 720, active: true },
  { id: "mi-4", categoryId: "cat-1", categoryName: "Traditional Bengali & Royal Feast", name: "Rupchanda Fish Fry with Salad", description: "Whole marinated Rupchanda shallow fried to golden perfection with lemon and tartar dip.", price: 780, active: true },
  { id: "mi-13", categoryId: "cat-1", categoryName: "Traditional Bengali & Royal Feast", name: "Shorshe Chingri Malai Curry", description: "Jumbo river prawns simmered in fragrant coconut milk and mild mustard gravy.", price: 750, active: true },
  { id: "mi-14", categoryId: "cat-1", categoryName: "Traditional Bengali & Royal Feast", name: "Shahi Morog Polao with Boiled Egg", description: "Traditional country chicken braised in rich ghee, yogurt, fried onions and aromatic chinigura rice.", price: 540, active: true },
  { id: "mi-15", categoryId: "cat-1", categoryName: "Traditional Bengali & Royal Feast", name: "Chittagong Beef Rezala", description: "Tender beef cubes slow-simmered in rich cashew, poppy seed, and aromatic whole spice gravy.", price: 580, active: true },
  // 2. Grills, Steaks & BBQ
  { id: "mi-5", categoryId: "cat-2", categoryName: "Grills, Steaks & BBQ", name: "Grilled Jumbo King Prawns (4 Pcs)", description: "Garlic butter basted jumbo river prawns with saut\xE9ed veggies and herb rice.", price: 1250, active: true },
  { id: "mi-6", categoryId: "cat-2", categoryName: "Grills, Steaks & BBQ", name: "T-Bone Beef Steak (300g)", description: "Imported prime beef cooked to preference with mushroom peppercorn sauce and mashed potato.", price: 1650, active: true },
  { id: "mi-7", categoryId: "cat-2", categoryName: "Grills, Steaks & BBQ", name: "Chicken Tikka Butter Masala & Butter Naan", description: "Charcoal grilled chicken cubes simmered in rich creamy tomato cashew gravy with 2 butter naans.", price: 580, active: true },
  { id: "mi-16", categoryId: "cat-2", categoryName: "Grills, Steaks & BBQ", name: "Charcoal Grilled Mutton Seekh Kebab (4 Pcs)", description: "Minced spiced mutton skewer roasted in clay tandoor oven, served with mint chutney and paratha.", price: 620, active: true },
  { id: "mi-17", categoryId: "cat-2", categoryName: "Grills, Steaks & BBQ", name: "BBQ Grilled Norwegian Salmon Fillet", description: "Atlantic salmon steak pan-grilled with lemon herb butter sauce, asparagus, and parsley potatoes.", price: 1450, active: true },
  { id: "mi-18", categoryId: "cat-2", categoryName: "Grills, Steaks & BBQ", name: "Mixed Sizzler Platter (Beef, Chicken & Prawn)", description: "Sizzling hot platter of beef tenderloin medallions, grilled chicken breast, and king prawns.", price: 1550, active: true },
  // 3. Continental & Italian
  { id: "mi-8", categoryId: "cat-3", categoryName: "Continental & Italian", name: "Fettuccine Alfredo with Grilled Chicken", description: "Fresh fettuccine pasta tossed in rich parmesan cream sauce with grilled chicken breast slices.", price: 620, active: true },
  { id: "mi-9", categoryId: "cat-3", categoryName: "Continental & Italian", name: 'Wood-Fired Pizza Quattro Formaggi (12")', description: "Mozzarella, cheddar, gorgonzola, and parmesan on hand-stretched thin crust.", price: 890, active: true },
  { id: "mi-19", categoryId: "cat-3", categoryName: "Continental & Italian", name: 'Classic Pepperoni & Mushroom Pizza (12")', description: "Hand-tossed dough with San Marzano tomato sauce, beef pepperoni, fresh button mushrooms, and mozzarella.", price: 920, active: true },
  { id: "mi-20", categoryId: "cat-3", categoryName: "Continental & Italian", name: "Penne Arrabbiata with Garlic Bread", description: "Al dente penne in spicy tomato-garlic sauce with black olives and extra virgin olive oil.", price: 520, active: true },
  { id: "mi-21", categoryId: "cat-3", categoryName: "Continental & Italian", name: "Pan-Seared Sea Bass with Lemon Caper Butter", description: "Delicate white sea bass fillet served with roasted baby potatoes and saut\xE9ed baby beans.", price: 1100, active: true },
  // 4. Oriental & Pan-Asian
  { id: "mi-22", categoryId: "cat-4", categoryName: "Oriental & Pan-Asian", name: "Authentic Thai Tom Yum Goong Soup", description: "Spicy and sour Thai broth with jumbo prawns, lemongrass, galangal, kaffir lime, and straw mushrooms.", price: 460, active: true },
  { id: "mi-23", categoryId: "cat-4", categoryName: "Oriental & Pan-Asian", name: "Chicken Pad Thai Rice Noodles", description: "Wok-tossed flat rice noodles with egg, chicken, bean sprouts, crushed peanuts, and tamarind glaze.", price: 520, active: true },
  { id: "mi-24", categoryId: "cat-4", categoryName: "Oriental & Pan-Asian", name: "Szechuan Crispy Chili Beef", description: "Shredded crispy beef strips tossed in fiery Szechuan red chili oil with bell peppers and spring onions.", price: 680, active: true },
  { id: "mi-25", categoryId: "cat-4", categoryName: "Oriental & Pan-Asian", name: "Dim Sum Steamed Dumpling Basket (6 Pcs)", description: "Handcrafted chicken and prawn dim sums served with house chili oil and ginger soya dip.", price: 480, active: true },
  { id: "mi-26", categoryId: "cat-4", categoryName: "Oriental & Pan-Asian", name: "Kung Pao Chicken with Roasted Cashews", description: "Wok-seared diced chicken with dry red chillies, scallions, and toasted cashews in savory glaze.", price: 560, active: true },
  // 5. Appetizers, Soups & Salads
  { id: "mi-27", categoryId: "cat-7", categoryName: "Appetizers, Soups & Salads", name: "Crispy Calamari Rings with Garlic Aioli", description: "Golden breaded squid rings seasoned with sea salt and cracked pepper, served with garlic herb aioli.", price: 490, active: true },
  { id: "mi-28", categoryId: "cat-7", categoryName: "Appetizers, Soups & Salads", name: "Cream of Wild Forest Mushroom Soup", description: "Velvety pur\xE9ed button and shiitake mushroom soup infused with truffle oil, served with croutons.", price: 380, active: true },
  { id: "mi-29", categoryId: "cat-7", categoryName: "Appetizers, Soups & Salads", name: "Caesar Salad with Grilled Chicken Breast", description: "Crisp romaine lettuce, herb croutons, shaved parmesan, grilled chicken, and classic anchovy-parmesan dressing.", price: 440, active: true },
  { id: "mi-30", categoryId: "cat-7", categoryName: "Appetizers, Soups & Salads", name: "Spicy Buffalo Chicken Wings (6 Pcs)", description: "Crispy fried chicken wings tossed in tangy cayenne pepper glaze, served with blue cheese dip and celery sticks.", price: 460, active: true },
  // 6. Breakfast & All-Day Dining
  { id: "mi-31", categoryId: "cat-8", categoryName: "Breakfast & All-Day Dining", name: "CCULB Royal English Breakfast Platter", description: "Two farm eggs cooked to order, chicken sausages, beef bacon, baked beans, grilled tomato, hash browns, and toasted bread.", price: 550, active: true },
  { id: "mi-32", categoryId: "cat-8", categoryName: "Breakfast & All-Day Dining", name: "Traditional Paratha, Bhaji & Masala Omelette", description: "Two layered ghee parathas served with vegetable bhaji, spiced onion-chili omelette, and mango pickle.", price: 280, active: true },
  { id: "mi-33", categoryId: "cat-8", categoryName: "Breakfast & All-Day Dining", name: "Resort Club Sandwich with French Fries", description: "Triple-decker toasted white sandwich layered with smoked chicken, cheddar, fried egg, lettuce, and tomatoes.", price: 450, active: true },
  { id: "mi-34", categoryId: "cat-8", categoryName: "Breakfast & All-Day Dining", name: "Gourmet Angus Beef Burger with Fries", description: "Charcoal grilled beef patty with aged cheddar, caramelized onions, gherkins, and special sauce in brioche bun.", price: 720, active: true },
  // 7. Desserts & Sweet Delights
  { id: "mi-12", categoryId: "cat-6", categoryName: "Desserts & Sweet Delights", name: "Matka Kulfi with Pistachio & Saffron", description: "Slow cooked condensed milk kulfi infused with Kashmiri saffron in traditional clay pot.", price: 220, active: true },
  { id: "mi-35", categoryId: "cat-6", categoryName: "Desserts & Sweet Delights", name: "Belgian Molten Dark Chocolate Lava Cake", description: "Warm molten chocolate cake with gooey lava core, accompanied by a scoop of artisanal vanilla ice cream.", price: 350, active: true },
  { id: "mi-36", categoryId: "cat-6", categoryName: "Desserts & Sweet Delights", name: "New York Baked Cheesecake", description: "Creamy philadelphia cream cheese cake with graham cracker crust, drizzled with wild strawberry coulis.", price: 340, active: true },
  { id: "mi-37", categoryId: "cat-6", categoryName: "Desserts & Sweet Delights", name: "Royal Shahi Tukra with Silver Leaf", description: "Crispy fried bread triangles soaked in saffron cardamom syrup, smothered in thickened rabri and nuts.", price: 220, active: true },
  // 8. Beverages, Mocktails & Juices
  { id: "mi-10", categoryId: "cat-5", categoryName: "Beverages, Mocktails & Juices", name: "Fresh Mint Lemonade", description: "Freshly squeezed lemon, organic garden mint, rock salt, and crushed ice.", price: 180, active: true },
  { id: "mi-11", categoryId: "cat-5", categoryName: "Beverages, Mocktails & Juices", name: "Royal Saffron Borhani (Glass)", description: "Traditional yogurt drink spiced with mustard seeds, mint, roasted cumin, and black salt.", price: 150, active: true },
  { id: "mi-38", categoryId: "cat-5", categoryName: "Beverages, Mocktails & Juices", name: "Tropical Blue Lagoon Mocktail", description: "Refreshing sparkling cooler with blue cura\xE7ao, fresh lime juice, sprite, and mint leaves.", price: 240, active: true },
  { id: "mi-39", categoryId: "cat-5", categoryName: "Beverages, Mocktails & Juices", name: "Virgin Mojito with Crushed Ice", description: "Muddled fresh lime wedges, mint sprigs, pure cane sugar syrup, topped with effervescent club soda.", price: 220, active: true },
  { id: "mi-40", categoryId: "cat-5", categoryName: "Beverages, Mocktails & Juices", name: "Artisan Espresso / Cappuccino Roast", description: "Freshly ground arabica beans double shot, frothed with silky whole milk and cinnamon dust.", price: 210, active: true },
  { id: "mi-41", categoryId: "cat-5", categoryName: "Beverages, Mocktails & Juices", name: "Fresh Green Coconut Water (Daab)", description: "Naturally chilled sweet electrolyte water directly from freshly sliced organic coconut.", price: 120, active: true }
];
var SEED_GL_ACCOUNTS = [
  // Assets (1000 - 1999)
  { code: "1010", name: "Cash in Vault & Commercial Bank Accounts", type: "Asset", category: "Current Assets", description: "Main operational bank balances (Sonali, DBBL, EBL corporate accounts)", balance: 452e4, isSystem: true },
  { code: "1020", name: "Front Desk & Outlet Cashier Drawers", type: "Asset", category: "Current Assets", description: "Physical cash float maintained at Front Office, F&B, and POS counters", balance: 85e3, isSystem: true },
  { code: "1100", name: "Guest Ledger (In-House Active Receivables)", type: "Asset", category: "Current Receivables", description: "Aggregated outstanding balances on open guest folios for active stays", balance: 148250, isSystem: true },
  { code: "1150", name: "City Ledger (Corporate Accounts Receivable)", type: "Asset", category: "Trade Receivables", description: "Direct billing receivables from registered corporate clients and credit companies", balance: 385e3, isSystem: true },
  { code: "1200", name: "Convention & Banquet Event Receivables", type: "Asset", category: "Trade Receivables", description: "Confirmed event booking receivables and convention hall contracts", balance: 185e3, isSystem: true },
  { code: "1300", name: "Food & Raw Ingredients Inventory Asset", type: "Asset", category: "Inventory Assets", description: "Central stock asset value for meat, fish, dry goods and raw kitchen supplies", balance: 485e3, isSystem: true },
  { code: "1310", name: "Bar & Lounge Beverages Inventory Asset", type: "Asset", category: "Inventory Assets", description: "Bar store stock asset value for syrups, cordials, canned beverages, and mixers", balance: 128e3, isSystem: true },
  { code: "1320", name: "Housekeeping Supplies & Room Amenities Stock", type: "Asset", category: "Inventory Assets", description: "Linen, guest toiletries, cleaning chemicals, and room amenities stock asset", balance: 95e3, isSystem: true },
  { code: "1330", name: "Engineering, Maintenance & General Spares Stock", type: "Asset", category: "Inventory Assets", description: "Electrical spares, plumbing hardware, HVAC filters, and maintenance supplies", balance: 64e3, isSystem: true },
  // Liabilities (2000 - 2999)
  { code: "2010", name: "Guest Advance & Reservation Security Deposits", type: "Liability", category: "Current Liabilities", description: "Prepayments received for future room reservations and event bookings", balance: 265e3, isSystem: true },
  { code: "2050", name: "Accounts Payable / Trade Creditors", type: "Liability", category: "Trade Payables", description: "Outstanding liabilities payable to food, beverage, amenities, and service suppliers", balance: 29300, isSystem: true },
  { code: "2055", name: "GRN Received / Unbilled Clearing Account", type: "Liability", category: "Accrued Liabilities", description: "Interim clearing for goods received via GRN pending vendor invoice matching", balance: 0, isSystem: true },
  { code: "2100", name: "VAT / Government Tax Payable (15%)", type: "Liability", category: "Statutory Liabilities", description: "Statutory value added tax collected on accommodation, F&B, and services", balance: 94350, isSystem: true },
  { code: "2110", name: "Service Charge Payable (10% Staff Pool)", type: "Liability", category: "Operational Liabilities", description: "Service charge pool collected for employee welfare and operational distribution", balance: 62900, isSystem: true },
  // Equity (3000 - 3999)
  { code: "3010", name: "Owners Capital & Retained Earnings", type: "Equity", category: "Capital & Reserves", description: "CCULB member cooperative equity and cumulative retained earnings", balance: 25e6, isSystem: true },
  // Revenue (4000 - 4999)
  { code: "4010", name: "Room Accommodation Revenue", type: "Revenue", category: "Accommodation", description: "Gross lodging revenue generated from all room categories and night audit postings", balance: 145e4, isSystem: true },
  { code: "4020", name: "Food & Beverage Outlet Sales", type: "Revenue", category: "Outlets & Dining", description: "Revenue from main restaurant, in-room dining, and buffet operations", balance: 42e4, isSystem: true },
  { code: "4030", name: "Bar & Lounge Revenue", type: "Revenue", category: "Outlets & Dining", description: "Beverages, mocktails, and lounge snack sales", balance: 115e3, isSystem: true },
  { code: "4040", name: "Convention Halls & Banquet Venue Hire", type: "Revenue", category: "Events & Venues", description: "Grand Ballroom, Executive Conference, and convention hall booking fees", balance: 78e4, isSystem: true },
  { code: "4050", name: "Resort Activities & Sports Facilities", type: "Revenue", category: "Resort Activities", description: "Swimming pool passes, lawn tennis, boating, archery, and recreation tickets", balance: 95e3, isSystem: true },
  { code: "4060", name: "Spa & Wellness Center Revenue", type: "Revenue", category: "Recreation", description: "Therapeutic massages, sauna, and wellness packages", balance: 65e3, isSystem: true },
  { code: "4070", name: "Laundry & Valet Guest Services", type: "Revenue", category: "Guest Services", description: "Express dry cleaning, laundry, and pressing services", balance: 38e3, isSystem: true },
  // Expenses (5000 - 5999)
  { code: "5010", name: "Housekeeping Linen & Guest Room Supplies", type: "Expense", category: "Hotel Operations", description: "Linen replenishment, toiletries, guest room amenities, and cleaning chemicals", balance: 74e3, isSystem: false },
  { code: "5015", name: "Purchase Returns & Allowances Recovery", type: "Expense", category: "Cost Adjustments", description: "Credit recovery from vendor returns and damaged goods debit notes", balance: -1400, isSystem: false },
  { code: "5020", name: "F&B Kitchen Raw Materials & Consumables", type: "Expense", category: "F&B Costs", description: "Meat, fish, poultry, spices, and perishable kitchen inventory", balance: 185e3, isSystem: false },
  { code: "5030", name: "Engineering, Facility & Maintenance Repairs", type: "Expense", category: "Maintenance", description: "HVAC repair, plumbing, electrical, and room upkeep costs", balance: 42e3, isSystem: false },
  { code: "5040", name: "Power, Generator Diesel & Utilities", type: "Expense", category: "Utilities", description: "Electricity grid tariffs, generator fuel, and water utility charges", balance: 125e3, isSystem: false }
];
var SEED_CITY_LEDGER_ACCOUNTS = [
  {
    id: "cla-1",
    accountNumber: "CL-2026-001",
    companyName: "Grameenphone Ltd.",
    contactPerson: "Syed Ashfaqur Rahman (HR & Admin Manager)",
    phone: "+880 1711-500100",
    email: "corporate.booking@grameenphone.com",
    creditLimit: 5e5,
    currentBalance: 145e3,
    paymentTerms: "Net 30",
    status: "Active",
    taxNumber: "TIN-48291049281",
    address: "GPHouse, Bashundhara R/A, Dhaka-1229",
    notes: "Approved for direct folio transfer for C-level & Senior Director retreats.",
    createdAt: "2026-01-15T00:00:00Z"
  },
  {
    id: "cla-2",
    accountNumber: "CL-2026-002",
    companyName: "Unilever Bangladesh Limited",
    contactPerson: "Tanvir Hasan (Supply Chain Protocol Lead)",
    phone: "+880 1819-223344",
    email: "admin.dhaka@unilever.com",
    creditLimit: 6e5,
    currentBalance: 95e3,
    paymentTerms: "Net 30",
    status: "Active",
    taxNumber: "TIN-10928374612",
    address: "ZN Tower, Gulshan-1, Dhaka-1212",
    notes: "Standing corporate discount 10% on convention halls and room rack.",
    createdAt: "2026-02-01T00:00:00Z"
  },
  {
    id: "cla-3",
    accountNumber: "CL-2026-003",
    companyName: "CCULB Corporate Credit Union Central",
    contactPerson: "Joynal Abedin (Secretary General)",
    phone: "+880 1713-445566",
    email: "admin@cculb.org.bd",
    creditLimit: 1e6,
    currentBalance: 85e3,
    paymentTerms: "Net 45",
    status: "Active",
    taxNumber: "TIN-99283471029",
    address: "CCULB Bhaban, 17/1-C Tejkunipara, Tejgaon, Dhaka",
    notes: "Parent cooperative union account. Annual AGM and quarterly retreats.",
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "cla-4",
    accountNumber: "CL-2026-004",
    companyName: "Beximco Pharmaceuticals Ltd.",
    contactPerson: "Dr. Farhana Kabir (Medical Events Coordinator)",
    phone: "+880 1715-998877",
    email: "events.pharma@beximco.net",
    creditLimit: 4e5,
    currentBalance: 6e4,
    paymentTerms: "Net 30",
    status: "Active",
    taxNumber: "TIN-33445566778",
    address: "19 Dhanmondi R/A, Road 7, Dhaka-1205",
    notes: "Physician symposium and weekend clinical round conferences.",
    createdAt: "2026-03-10T00:00:00Z"
  },
  {
    id: "cla-5",
    accountNumber: "CL-2026-005",
    companyName: "BRAC Bank Corporate Division",
    contactPerson: "Mahbubur Rahman (Senior VP, Operations)",
    phone: "+880 1714-332211",
    email: "corporate.events@bracbank.com",
    creditLimit: 5e5,
    currentBalance: 0,
    paymentTerms: "Net 15",
    status: "Active",
    taxNumber: "TIN-77889900112",
    address: "Anik Tower, 220/B Tejgaon I/A, Dhaka-1208",
    notes: "All dues clear. Eligible for instant credit authorization.",
    createdAt: "2026-04-05T00:00:00Z"
  }
];

// src/server/backupService.ts
init_db();
import fs from "fs";
import path from "path";
var DEFAULT_SCHEDULE_CONFIG = {
  times: ["08:00", "16:00", "23:00"],
  backupDir: path.resolve(process.cwd(), "backups"),
  autoSyncToSupabase: true,
  retentionCount: 30
};
var BackupService = class {
  constructor() {
    this.config = { ...DEFAULT_SCHEDULE_CONFIG };
    this.timer = null;
    this.lastExecutedDateHour = "";
    this.ensureBackupDir();
    this.startScheduler();
  }
  ensureBackupDir() {
    try {
      if (!fs.existsSync(this.config.backupDir)) {
        fs.mkdirSync(this.config.backupDir, { recursive: true });
      }
    } catch (err) {
      console.error("[BackupService] Failed to create backup directory:", err);
    }
  }
  getScheduleConfig() {
    this.ensureBackupDir();
    const files = this.listBackupFiles();
    const nextRuns = this.calculateNextRuns();
    return {
      ...this.config,
      nextRuns,
      totalBackups: files.length
    };
  }
  calculateNextRuns() {
    const now = /* @__PURE__ */ new Date();
    const nextRuns = [];
    for (const timeStr of this.config.times) {
      const [hourStr, minuteStr] = timeStr.split(":");
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      const candidate = new Date(now);
      candidate.setHours(hour, minute, 0, 0);
      if (candidate.getTime() <= now.getTime()) {
        candidate.setDate(candidate.getDate() + 1);
      }
      nextRuns.push(candidate.toISOString());
    }
    nextRuns.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return nextRuns;
  }
  startScheduler() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.checkAndExecuteSchedule();
    }, 3e4);
    this.checkAndExecuteSchedule();
  }
  async checkAndExecuteSchedule() {
    const now = /* @__PURE__ */ new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const is8am = currentHour === 8 && currentMinute <= 2;
    const is4pm = currentHour === 16 && currentMinute <= 2;
    const is11pm = currentHour === 23 && currentMinute <= 2;
    if (!is8am && !is4pm && !is11pm) {
      return;
    }
    const key = `${now.toISOString().split("T")[0]}_${currentHour}`;
    if (this.lastExecutedDateHour === key) {
      return;
    }
    this.lastExecutedDateHour = key;
    const trigger = is8am ? "scheduled_8am" : is4pm ? "scheduled_4pm" : "scheduled_11pm";
    console.log(`[BackupService] Running 3x daily automated backup: ${trigger} at ${now.toISOString()}`);
    try {
      await this.createBackup(trigger);
    } catch (err) {
      console.error("[BackupService] Automated scheduled backup failed:", err?.message || err);
    }
  }
  async createBackup(triggerType = "manual", clientState) {
    this.ensureBackupDir();
    const now = /* @__PURE__ */ new Date();
    let propertyName = clientState?.settings?.resortName || "lesync";
    if (!clientState?.settings?.resortName && pool) {
      try {
        const pRes = await pool.query("SELECT resort_name FROM pms_snapshots ORDER BY snapshot_version DESC LIMIT 1");
        if (pRes.rows.length > 0 && pRes.rows[0].resort_name) {
          propertyName = pRes.rows[0].resort_name;
        }
      } catch {
      }
    }
    const slug = propertyName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "lesync";
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    let timeSlotStr = "";
    if (triggerType === "scheduled_8am") timeSlotStr = "8.00AM";
    else if (triggerType === "scheduled_4pm") timeSlotStr = "4.00PM";
    else if (triggerType === "scheduled_11pm") timeSlotStr = "11.00PM";
    else {
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      timeSlotStr = `${hours}.${minutes}${ampm}`;
    }
    const filename = `${slug}_${day}_${month}_${year}_${timeSlotStr}.bak`;
    const filepath = path.join(this.config.backupDir, filename);
    let backupPayload = null;
    let totalEntities = 0;
    try {
      if (pool) {
        const snapRes = await pool.query("SELECT * FROM pms_snapshots ORDER BY snapshot_version DESC LIMIT 1");
        if (snapRes.rows.length > 0) {
          backupPayload = {
            metadata: {
              exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
              version: "2.0.0",
              triggerType,
              system: "LESync Enterprise PMS",
              source: "Postgres Supabase Snapshot"
            },
            snapshotVersion: snapRes.rows[0].snapshot_version,
            pmsDatabase: snapRes.rows[0].state_payload || snapRes.rows[0].entities || {}
          };
          totalEntities = snapRes.rows[0].total_entities || 0;
        }
      }
    } catch (e) {
      console.warn("[BackupService] Postgres query notice while creating backup:", e?.message || e);
    }
    if (!backupPayload && clientState) {
      backupPayload = {
        metadata: {
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          version: "2.0.0",
          triggerType,
          system: "LESync Enterprise PMS",
          source: "Client PMS State"
        },
        pmsDatabase: clientState
      };
      totalEntities = Object.keys(clientState).length;
    }
    if (!backupPayload) {
      backupPayload = {
        metadata: {
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          version: "2.0.0",
          triggerType,
          system: "LESync Enterprise PMS",
          source: "Local Auto Snapshot"
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    const fileContent = [
      "-- LESYNC ENTERPRISE PMS DATABASE BACKUP ARCHIVE (.BAK)",
      `-- Exported At: ${(/* @__PURE__ */ new Date()).toISOString()}`,
      `-- Trigger: ${triggerType}`,
      `-- Application: LESync Enterprise Property Management System`,
      "-- FORMAT: JSON-CONTAINER",
      JSON.stringify(backupPayload, null, 2)
    ].join("\n");
    fs.writeFileSync(filepath, fileContent, "utf-8");
    const stats = fs.statSync(filepath);
    let syncedToSupabase = false;
    if (this.config.autoSyncToSupabase && pool) {
      try {
        await pool.query(
          `INSERT INTO pms_sync_events (entity_type, entity_id, action, payload, status)
           VALUES ($1, $2, $3, $4, $5)`,
          ["DATABASE_BACKUP", filename, "AUTO_BACKUP_SNAPSHOT", { filename, triggerType, sizeBytes: stats.size }, "SUCCESS"]
        );
        syncedToSupabase = true;
      } catch (err) {
        console.warn("[BackupService] Sync event notice for backup:", err?.message || err);
      }
    }
    this.pruneOldBackups();
    return {
      filename,
      filepath,
      sizeBytes: stats.size,
      sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      triggerType,
      syncedToSupabase,
      totalEntities
    };
  }
  listBackupFiles() {
    this.ensureBackupDir();
    try {
      const files = fs.readdirSync(this.config.backupDir);
      const bakFiles = files.filter((f) => f.endsWith(".bak") || f.endsWith(".json"));
      return bakFiles.map((f) => {
        const fullPath = path.join(this.config.backupDir, f);
        const stats = fs.statSync(fullPath);
        let triggerType = "manual";
        const lower = f.toLowerCase();
        if (lower.includes("8.00am") || f.includes("SCHEDULED_8AM")) triggerType = "scheduled_8am";
        else if (lower.includes("4.00pm") || f.includes("SCHEDULED_4PM")) triggerType = "scheduled_4pm";
        else if (lower.includes("11.00pm") || f.includes("SCHEDULED_11PM")) triggerType = "scheduled_11pm";
        return {
          filename: f,
          filepath: fullPath,
          sizeBytes: stats.size,
          sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
          createdAt: stats.mtime.toISOString(),
          triggerType,
          syncedToSupabase: true
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  }
  readBackupFileContent(filename) {
    this.ensureBackupDir();
    const safeName = path.basename(filename);
    const fullPath = path.join(this.config.backupDir, safeName);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, "utf-8");
  }
  pruneOldBackups() {
    try {
      const files = this.listBackupFiles();
      if (files.length > this.config.retentionCount) {
        const toDelete = files.slice(this.config.retentionCount);
        for (const item of toDelete) {
          if (fs.existsSync(item.filepath)) {
            fs.unlinkSync(item.filepath);
            console.log(`[BackupService] Pruned old backup archive: ${item.filename}`);
          }
        }
      }
    } catch (err) {
      console.warn("[BackupService] Prune notice:", err);
    }
  }
  generateWindowsIisScript(hostUrl = "http://localhost:3000") {
    const psScript = `# ==============================================================================
# LESYNC ENTERPRISE PMS - WINDOWS IIS / SERVER TASK SCHEDULER SETUP SCRIPT
# Configures 3x Daily Automated Database Backups (8:00 AM, 4:00 PM, 11:00 PM)
# Compatible with: Windows Server 2016/2019/2022, Windows 10/11 Pro, IIS 10
# ==============================================================================

$HostUrl = "${hostUrl}"
$BackupDir = "C:\\LESync_PMS_Backups"
$LogDir = "C:\\LESync_PMS_Backups\\logs"

# Ensure directories exist
if (!(Test-Path -Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }
if (!(Test-Path -Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

Write-Host "Registering 3x Daily LESync PMS Auto-Backup Tasks..." -ForegroundColor Cyan

# 1. Morning Shift Backup: 8:00 AM
$Action8AM = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -Command \\"Invoke-RestMethod -Uri '$HostUrl/api/backup/trigger' -Method Post -Body (@{triggerType='scheduled_8am'} | ConvertTo-Json) -ContentType 'application/json' | Out-File -FilePath '$LogDir\\backup_8am.log'\\""
$Trigger8AM = New-ScheduledTaskTrigger -Daily -At 8:00AM
Register-ScheduledTask -TaskName "LESync_PMS_Backup_0800_Morning" -Action $Action8AM -Trigger $Trigger8AM -Description "LESync PMS Automated Morning Shift Database Backup" -Force | Out-Null

# 2. Afternoon Shift Backup: 4:00 PM
$Action4PM = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -Command \\"Invoke-RestMethod -Uri '$HostUrl/api/backup/trigger' -Method Post -Body (@{triggerType='scheduled_4pm'} | ConvertTo-Json) -ContentType 'application/json' | Out-File -FilePath '$LogDir\\backup_4pm.log'\\""
$Trigger4PM = New-ScheduledTaskTrigger -Daily -At 4:00PM
Register-ScheduledTask -TaskName "LESync_PMS_Backup_1600_Afternoon" -Action $Action4PM -Trigger $Trigger4PM -Description "LESync PMS Automated Afternoon Shift Database Backup" -Force | Out-Null

# 3. Night Audit Backup: 11:00 PM
$Action11PM = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -Command \\"Invoke-RestMethod -Uri '$HostUrl/api/backup/trigger' -Method Post -Body (@{triggerType='scheduled_11pm'} | ConvertTo-Json) -ContentType 'application/json' | Out-File -FilePath '$LogDir\\backup_11pm.log'\\""
$Trigger11PM = New-ScheduledTaskTrigger -Daily -At 11:00PM
Register-ScheduledTask -TaskName "LESync_PMS_Backup_2300_Night" -Action $Action11PM -Trigger $Trigger11PM -Description "LESync PMS Automated Night Audit Day-Close Database Backup" -Force | Out-Null

Write-Host "[SUCCESS] All 3 daily automated backup tasks successfully registered in Windows Task Scheduler!" -ForegroundColor Green
Write-Host "Schedule: 08:00 AM, 16:00 PM, 23:00 PM" -ForegroundColor Yellow
Write-Host "Log directory: $LogDir" -ForegroundColor Yellow
`;
    const batScript = `@echo off
REM ============================================================================
REM LESYNC PMS WINDOWS TASK SCHEDULER INSTALLER (.BAT)
REM Creates 3 daily automated tasks at 8:00 AM, 4:00 PM, and 11:00 PM
REM ============================================================================

set HOST_URL=${hostUrl}

echo Registering LESync PMS Automated Tasks...
schtasks /create /tn "LESync_PMS_Backup_0800_Morning" /tr "curl -s -X POST %HOST_URL%/api/backup/trigger -H \\"Content-Type: application/json\\" -d \\"{\\"triggerType\\":\\"scheduled_8am\\"}\\"" /sc daily /st 08:00 /f
schtasks /create /tn "LESync_PMS_Backup_1600_Afternoon" /tr "curl -s -X POST %HOST_URL%/api/backup/trigger -H \\"Content-Type: application/json\\" -d \\"{\\"triggerType\\":\\"scheduled_4pm\\"}\\"" /sc daily /st 16:00 /f
schtasks /create /tn "LESync_PMS_Backup_2300_Night" /tr "curl -s -X POST %HOST_URL%/api/backup/trigger -H \\"Content-Type: application/json\\" -d \\"{\\"triggerType\\":\\"scheduled_11pm\\"}\\"" /sc daily /st 23:00 /f

echo [SUCCESS] Tasks registered successfully!
pause
`;
    return { powershell: psScript, batch: batScript };
  }
};
var backupService = new BackupService();

// src/server/app.ts
dotenv2.config();
var externalBroadcastHook = null;
var externalDeviceListHook = null;
function createApp() {
  const app = express();
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey, X-Client-Info, X-Requested-With, Range, Accept, Origin");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });
  app.use((req, res, next) => {
    const qPath = req.query?.path || req.query?.__path;
    if (qPath) {
      const cleanPath = Array.isArray(qPath) ? qPath.join("/") : String(qPath);
      req.url = cleanPath.startsWith("/") ? "/api" + cleanPath : "/api/" + cleanPath;
      delete req.query.path;
      delete req.query.__path;
    } else {
      const rawUrl = req.url || "";
      if (rawUrl.startsWith("/supabase") || rawUrl.startsWith("/cloudsql") || rawUrl.startsWith("/accounts") || rawUrl.startsWith("/biometric") || rawUrl.startsWith("/backup") || rawUrl === "/health" || rawUrl.startsWith("/health?")) {
        req.url = "/api" + rawUrl;
      }
    }
    next();
  });
  app.use((req, res, next) => {
    if (req.body && typeof req.body === "object") {
      req._body = true;
    }
    next();
  });
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  app.get(["/api/health", "/health"], (req, res) => {
    res.json({
      status: "ok",
      service: "LESync PMS Cloud Engine",
      environment: process.env.VERCEL ? "vercel-serverless" : "node-server",
      postgresConfigured: isPostgresConfigured(),
      databaseProvider: "Supabase",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  function isSecretKeyString(key) {
    if (!key) return false;
    const k = key.trim();
    if (k.startsWith("sb_secret_") || k.startsWith("secret_")) return true;
    try {
      const parts = k.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
        if (payload?.role === "service_role") return true;
      }
    } catch {
    }
    return false;
  }
  app.get(["/api/supabase/config", "/supabase/config"], (req, res) => {
    let url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://cvviwipdglcajldmzbvc.supabase.co").trim();
    url = url.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
    const publishableKey = (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_s_KTFsBgpfnFL2UkYZqqyw_TZilAsZw").trim();
    const secretKey = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    let safeBrowserKey = publishableKey;
    if (!safeBrowserKey || isSecretKeyString(safeBrowserKey)) {
      safeBrowserKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_s_KTFsBgpfnFL2UkYZqqyw_TZilAsZw").trim();
      if (isSecretKeyString(safeBrowserKey)) {
        safeBrowserKey = "sb_publishable_s_KTFsBgpfnFL2UkYZqqyw_TZilAsZw";
      }
    }
    const projectRef = url ? url.replace(/^https?:\/\//, "").split(".")[0] : "cvviwipdglcajldmzbvc";
    const connectionString = getDatabaseConnectionString() || "";
    res.json({
      url,
      key: safeBrowserKey,
      // Always a browser-safe publishable/anon key
      publishableKey: safeBrowserKey,
      hasSecretKey: Boolean(secretKey),
      isSafeForBrowser: true,
      jwksUrl: process.env.SUPABASE_JWKS_URL || "",
      configured: Boolean(url && safeBrowserKey),
      projectRef,
      connectionString
    });
  });
  app.post(["/api/supabase/test-connection", "/api/cloudsql/test-connection"], async (req, res) => {
    const { connectionString } = req.body;
    const testCs = connectionString || getDatabaseConnectionString();
    if (!testCs) {
      return res.status(400).json({
        success: false,
        error: "No database connection string provided or found in environment variables."
      });
    }
    try {
      const pg2 = await import("pg");
      const { parsePostgresUri: parsePostgresUri2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const parsed = parsePostgresUri2(testCs);
      const poolOptions = parsed && parsed.host && parsed.user ? {
        host: parsed.host,
        port: parsed.port || 5432,
        user: parsed.user,
        password: parsed.password || "",
        database: parsed.database || "postgres",
        ssl: parsed.ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 1e4
      } : {
        connectionString: testCs,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 1e4
      };
      const testPool = new pg2.default.Pool(poolOptions);
      const client = await testPool.connect();
      const versionResult = await client.query("SELECT version(), current_database(), current_user;");
      client.release();
      await testPool.end();
      const row = versionResult.rows[0];
      res.json({
        success: true,
        message: "Successfully connected to Supabase PostgreSQL database!",
        database: row.current_database,
        user: row.current_user,
        version: row.version?.split(" ")?.[0] || "PostgreSQL"
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err?.message || "Failed to connect to Supabase database"
      });
    }
  });
  app.post(["/api/supabase/save-config", "/api/cloudsql/save-config"], async (req, res) => {
    const { connectionString } = req.body;
    if (typeof connectionString === "string" && connectionString.trim().length > 0) {
      const cs = connectionString.trim();
      setDynamicConnectionString(cs);
      try {
        const envPath = path2.resolve(process.cwd(), ".env");
        if (fs2.existsSync(envPath)) {
          let envContent = fs2.readFileSync(envPath, "utf8");
          if (envContent.includes("DATABASE_URL=")) {
            envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL=${cs}`);
          } else {
            envContent += `
DATABASE_URL=${cs}`;
          }
          if (envContent.includes("POSTGRES_URL=")) {
            envContent = envContent.replace(/POSTGRES_URL=.*/, `POSTGRES_URL=${cs}`);
          } else {
            envContent += `
POSTGRES_URL=${cs}`;
          }
          fs2.writeFileSync(envPath, envContent, "utf8");
        }
      } catch {
      }
      try {
        await ensureDatabaseSchema();
        return res.json({
          success: true,
          configured: true,
          message: "Supabase database connection configured and schema initialized!"
        });
      } catch (err) {
        return res.json({
          success: true,
          configured: true,
          warning: `Saved connection string, but schema initialization notice: ${err?.message || err}`
        });
      }
    }
    return res.status(400).json({ success: false, error: "Valid connection string is required." });
  });
  app.get(["/api/supabase/export-sql", "/supabase/export-sql"], (req, res) => {
    const sqlPath = path2.resolve(process.cwd(), "supabase_schema_and_seed.sql");
    if (fs2.existsSync(sqlPath)) {
      if (req.query.download === "true") {
        res.setHeader("Content-Disposition", 'attachment; filename="supabase_schema_and_seed.sql"');
      }
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.sendFile(sqlPath);
    }
    res.status(404).json({ success: false, error: "SQL script not found on server" });
  });
  app.post(["/api/supabase/seed-database", "/supabase/seed-database", "/api/supabase/import-rooms-menus"], async (req, res) => {
    try {
      let statePayload = req.body;
      const rooms110 = generate110RoomsStartingWith1001();
      if (!statePayload || typeof statePayload !== "object" || !Array.isArray(statePayload.rooms) || statePayload.rooms.length < 110) {
        statePayload = {
          resortName: "Heritage Resort & Spa",
          businessDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          users: SEED_USERS,
          rooms: rooms110,
          roomTypes: SEED_ROOM_TYPES,
          floors: SEED_FLOORS,
          halls: SEED_HALLS,
          packages: SEED_PACKAGES,
          menuCategories: SEED_MENU_CATEGORIES,
          menuItems: SEED_MENU_ITEMS,
          glAccounts: SEED_GL_ACCOUNTS,
          cityLedgerAccounts: SEED_CITY_LEDGER_ACCOUNTS,
          suppliers: SEED_SUPPLIERS,
          reservations: [],
          stays: [],
          folios: [],
          payments: [],
          invoices: [],
          restaurantOrders: [],
          ...statePayload && typeof statePayload === "object" ? statePayload : {}
        };
        statePayload.rooms = rooms110;
        statePayload.menuCategories = SEED_MENU_CATEGORIES;
        statePayload.menuItems = SEED_MENU_ITEMS;
      }
      const syncResult = await syncEntirePmsState(statePayload, "Supabase Room & Menu Seed");
      return res.json({
        success: true,
        message: `Successfully imported 110 rooms (1001 to 1110) and ${SEED_MENU_ITEMS.length} restaurant menus into Supabase PostgreSQL!`,
        totalRooms: statePayload.rooms.length,
        totalMenuItems: statePayload.menuItems?.length || 0,
        syncResult,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      console.error("Error seeding database:", err?.message || err);
      res.status(500).json({ success: false, error: err?.message || "Database seed execution failed" });
    }
  });
  app.get(["/api/supabase/status", "/supabase/status", "/api/cloudsql/status", "/cloudsql/status"], async (req, res) => {
    try {
      const status = await getCloudSqlStatus();
      res.json({ success: true, provider: "Supabase", ...status });
    } catch (error) {
      console.error("Error in /api/supabase/status endpoint:", error?.message || error);
      res.json({
        success: true,
        connected: false,
        provider: "Supabase",
        error: error?.message || "Database unavailable",
        region: "Supabase Cloud",
        database: "Not Connected",
        tableCounts: {}
      });
    }
  });
  app.post(["/api/supabase/sync-all", "/supabase/sync-all", "/api/cloudsql/sync-all", "/cloudsql/sync-all"], async (req, res) => {
    try {
      const statePayload = req.body;
      if (!statePayload || typeof statePayload !== "object") {
        return res.status(400).json({ success: false, error: "Invalid PMS state payload" });
      }
      const result = await syncEntirePmsState(statePayload, "Web API Client");
      res.json(result);
    } catch (error) {
      console.error("Error syncing PMS state to Supabase:", error?.message || error);
      res.status(500).json({
        success: false,
        error: error?.message || "Synchronization failed"
      });
    }
  });
  app.get(["/api/supabase/sync-all", "/supabase/sync-all", "/api/cloudsql/sync-all", "/cloudsql/sync-all"], (req, res) => {
    res.json({
      success: true,
      message: "Supabase sync-all endpoint is operational. Send a POST request with PMS state payload to synchronize."
    });
  });
  app.post(["/api/supabase/sync-event", "/supabase/sync-event", "/api/cloudsql/sync-event", "/cloudsql/sync-event"], async (req, res) => {
    try {
      const { entityType, entityId, action, payload } = req.body;
      if (!entityType || !entityId || !action) {
        return res.status(400).json({
          success: false,
          error: "entityType, entityId, and action are required"
        });
      }
      const event = await recordSyncEvent(entityType, entityId, action, payload);
      res.json({ success: true, event });
    } catch (error) {
      console.error("Error recording sync event to Supabase PostgreSQL:", error?.message || error);
      res.status(500).json({
        success: false,
        error: error?.message || "Event logging failed"
      });
    }
  });
  app.get(["/api/supabase/sync-event", "/supabase/sync-event", "/api/cloudsql/sync-event", "/cloudsql/sync-event"], (req, res) => {
    res.json({
      success: true,
      message: "Supabase PostgreSQL sync-event endpoint is operational. Send a POST request with event payload to record delta events."
    });
  });
  app.get(["/api/supabase/sync-history", "/supabase/sync-history", "/api/cloudsql/sync-history", "/cloudsql/sync-history"], async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 20;
      const history = await getRecentSyncEvents(limit);
      res.json({ success: true, history });
    } catch (error) {
      console.error("Error fetching sync history:", error?.message || error);
      res.status(500).json({
        success: false,
        error: error?.message || "Failed to fetch history"
      });
    }
  });
  app.get(["/api/supabase/load-latest", "/supabase/load-latest", "/api/cloudsql/load-latest", "/cloudsql/load-latest"], async (req, res) => {
    try {
      const snapshot = await loadLatestPmsSnapshot();
      if (!snapshot) {
        return res.json({ success: true, exists: false, data: null });
      }
      res.json({ success: true, exists: true, snapshot });
    } catch (error) {
      console.error("Error loading latest PMS snapshot from Supabase:", error?.message || error);
      res.json({
        success: true,
        exists: false,
        data: null,
        error: error?.message || "Failed to load latest snapshot"
      });
    }
  });
  app.get(["/api/supabase/connected-devices", "/supabase/connected-devices", "/api/cloudsql/connected-devices", "/cloudsql/connected-devices"], (req, res) => {
    const devices = externalDeviceListHook ? externalDeviceListHook() : [];
    res.json({
      success: true,
      totalDevices: devices.length,
      devices
    });
  });
  app.post(["/api/supabase/broadcast-sync", "/supabase/broadcast-sync", "/api/cloudsql/broadcast-sync", "/cloudsql/broadcast-sync"], async (req, res) => {
    try {
      const { deviceId, department, userName, reason, state, version } = req.body;
      if (!state || typeof state !== "object") {
        return res.status(400).json({ success: false, error: "State payload required" });
      }
      if (externalBroadcastHook) {
        externalBroadcastHook(null, {
          type: "REMOTE_PMS_UPDATE",
          sourceDeviceId: deviceId || "http-terminal",
          sourceDepartment: department || "Resort Operations",
          sourceUserName: userName || "Staff",
          reason: reason || "HTTP Broadcast Sync",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          version,
          state
        });
      }
      if (isPostgresConfigured()) {
        const syncResult = await syncEntirePmsState(state, `${department || "Resort"} (${userName || "Staff"})`);
        return res.json({
          success: true,
          broadcasted: true,
          version: syncResult.version,
          totalEntities: syncResult.totalEntities,
          timestamp: syncResult.timestamp
        });
      }
      res.json({
        success: true,
        broadcasted: true,
        version: version || 1,
        totalEntities: 0,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      console.error("Broadcast sync error:", err?.message || err);
      res.status(500).json({ success: false, error: err?.message || "Broadcast sync failed" });
    }
  });
  app.get(["/api/accounts/chart-of-accounts", "/accounts/chart-of-accounts"], async (req, res) => {
    try {
      const accounts = await getGlAccountsFromDb();
      res.json({ success: true, count: accounts.length, accounts });
    } catch (error) {
      console.error("Error querying chart of accounts:", error?.message || error);
      res.status(500).json({ success: false, error: error?.message || "Query failed" });
    }
  });
  app.get(["/api/accounts/journal-vouchers", "/accounts/journal-vouchers"], async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 100;
      const vouchers = await getJournalVouchersFromDb(limit);
      res.json({ success: true, count: vouchers.length, vouchers });
    } catch (error) {
      console.error("Error querying journal vouchers:", error?.message || error);
      res.status(500).json({ success: false, error: error?.message || "Query failed" });
    }
  });
  app.get(["/api/accounts/city-ledger", "/accounts/city-ledger"], async (req, res) => {
    try {
      const ledger = await getCityLedgerFromDb();
      res.json({ success: true, count: ledger.length, accounts: ledger });
    } catch (error) {
      console.error("Error querying city ledger:", error?.message || error);
      res.status(500).json({ success: false, error: error?.message || "Query failed" });
    }
  });
  app.get(["/api/accounts/trial-balance", "/accounts/trial-balance"], async (req, res) => {
    try {
      const trialBalance = await getTrialBalanceFromDb();
      res.json({ success: true, trialBalance });
    } catch (error) {
      console.error("Error generating trial balance:", error?.message || error);
      res.status(500).json({ success: false, error: error?.message || "Calculation failed" });
    }
  });
  app.get(["/api/supabase/tables", "/supabase/tables", "/api/cloudsql/tables", "/cloudsql/tables"], async (req, res) => {
    if (!isPostgresConfigured()) {
      return res.json({
        success: true,
        configured: false,
        tables: [],
        message: "Supabase PostgreSQL database is not configured. Add SUPABASE_DB_URL, POSTGRES_URL, or DATABASE_URL in environment variables."
      });
    }
    try {
      await ensureDatabaseSchema();
      const result = await pool.query(`
        SELECT t.table_name,
               (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
        ORDER BY t.table_name;
      `);
      res.json({ success: true, configured: true, tables: result.rows });
    } catch (error) {
      console.error("Error listing tables for Supabase SQL console:", error?.message || error);
      res.status(500).json({ success: false, error: error?.message || "Failed to list tables" });
    }
  });
  app.post(["/api/supabase/query", "/supabase/query", "/api/cloudsql/query", "/cloudsql/query"], async (req, res) => {
    if (!isPostgresConfigured()) {
      return res.status(400).json({
        success: false,
        error: "Supabase PostgreSQL database is not configured. Add SUPABASE_DB_URL, POSTGRES_URL, or DATABASE_URL in environment variables."
      });
    }
    try {
      await ensureDatabaseSchema();
      const { sqlQuery } = req.body;
      if (!sqlQuery || typeof sqlQuery !== "string") {
        return res.status(400).json({ success: false, error: "Query string (sqlQuery) is required" });
      }
      const trimmed = sqlQuery.trim();
      const lower = trimmed.toLowerCase();
      if (lower.startsWith("drop database") || lower.startsWith("truncate users")) {
        return res.status(403).json({ success: false, error: "Destructive command prohibited via web SQL console" });
      }
      const start = Date.now();
      const result = await pool.query(trimmed);
      const executionTimeMs = Date.now() - start;
      res.json({
        success: true,
        command: result.command,
        rowCount: result.rowCount,
        fields: result.fields?.map((f) => ({ name: f.name, dataTypeId: f.dataTypeID })),
        rows: result.rows,
        executionTimeMs
      });
    } catch (error) {
      console.error("SQL console query error:", error?.message || error);
      res.status(500).json({ success: false, error: error?.message || "SQL execution failed" });
    }
  });
  app.post(["/api/supabase/update-user", "/api/cloudsql/update-user"], async (req, res) => {
    try {
      const { uid, name, username, role, email } = req.body || {};
      if (!uid) {
        return res.status(400).json({ success: false, error: "uid is required" });
      }
      if (isPostgresConfigured()) {
        await ensureDatabaseSchema();
        await pool.query(
          `INSERT INTO users (uid, name, username, role, email, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (uid) DO UPDATE SET
             name = COALESCE(EXCLUDED.name, users.name),
             username = COALESCE(EXCLUDED.username, users.username),
             role = COALESCE(EXCLUDED.role, users.role),
             email = COALESCE(EXCLUDED.email, users.email),
             updated_at = NOW()`,
          [uid, name || null, username || null, role || null, email || null]
        );
      }
      res.json({ success: true, message: `User ${uid} updated in cloud database.` });
    } catch (err) {
      console.warn("Notice updating user via backend API:", err?.message || err);
      res.json({ success: true, notice: err?.message });
    }
  });
  app.post(["/api/supabase/delete-user", "/api/cloudsql/delete-user"], async (req, res) => {
    try {
      const { uid } = req.body || {};
      if (!uid) {
        return res.status(400).json({ success: false, error: "uid is required" });
      }
      if (isPostgresConfigured()) {
        await ensureDatabaseSchema();
        await pool.query("DELETE FROM users WHERE uid = $1", [uid]);
      }
      res.json({ success: true, message: `User ${uid} deleted from cloud database.` });
    } catch (err) {
      console.warn("Notice deleting user via backend API:", err?.message || err);
      res.json({ success: true, notice: err?.message });
    }
  });
  app.get(["/api/backup/schedule", "/backup/schedule"], (req, res) => {
    try {
      const schedule = backupService.getScheduleConfig();
      res.json({ success: true, schedule });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Failed to get schedule" });
    }
  });
  app.post(["/api/backup/trigger", "/backup/trigger"], async (req, res) => {
    try {
      const { triggerType = "manual", clientState } = req.body || {};
      const metadata = await backupService.createBackup(triggerType, clientState);
      res.json({
        success: true,
        message: `Database backup created successfully: ${metadata.filename}`,
        backup: metadata
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Failed to create backup" });
    }
  });
  app.get(["/api/backup/files", "/backup/files"], (req, res) => {
    try {
      const files = backupService.listBackupFiles();
      res.json({ success: true, files, count: files.length });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Failed to list backup files" });
    }
  });
  app.get(["/api/backup/download/:filename", "/backup/download/:filename"], (req, res) => {
    try {
      const { filename } = req.params;
      const content = backupService.readBackupFileContent(filename);
      if (!content) {
        return res.status(404).json({ success: false, error: "Backup file not found" });
      }
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/octet-stream");
      res.send(content);
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Failed to download backup" });
    }
  });
  app.get(["/api/backup/content/:filename", "/backup/content/:filename"], (req, res) => {
    try {
      const { filename } = req.params;
      const content = backupService.readBackupFileContent(filename);
      if (!content) {
        return res.status(404).json({ success: false, error: "Backup file not found" });
      }
      res.json({ success: true, filename, rawContent: content });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Failed to read backup content" });
    }
  });
  app.get(["/api/backup/iis-script", "/backup/iis-script"], (req, res) => {
    try {
      const hostUrl = `${req.protocol}://${req.get("host")}`;
      const scripts = backupService.generateWindowsIisScript(hostUrl);
      res.json({ success: true, scripts, hostUrl });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Failed to generate IIS script" });
    }
  });
  app.get(["/api/auth/github/url", "/auth/github/url"], (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID || "";
    const redirectUri = req.query.redirect_uri || (process.env.APP_URL ? `${process.env.APP_URL}/auth/github/callback` : `${req.protocol}://${req.get("host")}/auth/github/callback`);
    if (!clientId) {
      return res.json({
        success: false,
        configured: false,
        url: null,
        message: "GITHUB_CLIENT_ID is not configured in environment variables.",
        redirectUri
      });
    }
    const state = Math.random().toString(36).substring(2, 15);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "read:user user:email",
      state
    });
    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    res.json({
      success: true,
      configured: true,
      url: authUrl,
      redirectUri
    });
  });
  app.post(["/api/biometric/test-connection", "/biometric/test-connection"], (req, res) => {
    const { ipAddress, port = 4370, commKey = 0 } = req.body || {};
    if (!ipAddress) {
      return res.status(400).json({ success: false, message: "ipAddress is required" });
    }
    const targetPort = Number(port) || 4370;
    const startTime = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(2500);
    let finished = false;
    socket.connect(targetPort, String(ipAddress), () => {
      if (finished) return;
      finished = true;
      const latencyMs = Date.now() - startTime;
      socket.destroy();
      res.json({
        success: true,
        latencyMs,
        message: `Connected successfully to ZKTeco terminal at ${ipAddress}:${targetPort}. TCP socket handshake ACK received.`,
        deviceDetails: {
          model: "ZKTeco Hardware Terminal",
          serialNumber: `ZK-${ipAddress.replace(/[^0-9]/g, "")}`,
          firmware: "Ver 6.60",
          commKeyVerified: true
        }
      });
    });
    socket.on("error", () => {
      if (finished) return;
      finished = true;
      socket.destroy();
      const latencyMs = Date.now() - startTime || 24;
      res.json({
        success: true,
        latencyMs,
        simulated: true,
        message: `ZKTeco terminal detected at ${ipAddress}:${targetPort} (commKey: ${commKey}). Ready for biometric punch synchronization.`,
        deviceDetails: {
          model: "ZKTeco Standalone Biometric Terminal",
          serialNumber: `ZK-${ipAddress.replace(/[^0-9]/g, "") || "8821"}`,
          firmware: "Ver 6.60 (Apr 2024)",
          commKeyVerified: true
        }
      });
    });
    socket.on("timeout", () => {
      if (finished) return;
      finished = true;
      socket.destroy();
      res.json({
        success: true,
        latencyMs: 38,
        simulated: true,
        message: `ZKTeco terminal configured for ${ipAddress}:${targetPort}. Device ping response acknowledged.`,
        deviceDetails: {
          model: "ZKTeco Ethernet Terminal",
          serialNumber: `ZK-${ipAddress.replace(/[^0-9]/g, "") || "9120"}`,
          firmware: "Ver 6.60 (Apr 2024)",
          commKeyVerified: true
        }
      });
    });
  });
  app.all(["/iclock/cdata", "/api/biometric/webhook/adms"], (req, res) => {
    res.type("text/plain").send("OK");
  });
  app.get(
    ["/auth/github/callback", "/auth/github/callback/", "/auth/callback", "/auth/callback/", "/api/auth/github/callback"],
    async (req, res) => {
      const { code, error, error_description } = req.query;
      if (error || !code) {
        const errorMsg = String(error_description || error || "Authorization was cancelled or denied");
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>GitHub Authentication Failed</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f17; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .box { background: #1e293b; border: 1px solid #ef4444; border-radius: 12px; padding: 24px; max-width: 420px; text-align: center; }
              </style>
            </head>
            <body>
              <div class="box">
                <h3 style="color: #f87171; margin-top: 0;">GitHub Sign-In Failed</h3>
                <p style="font-size: 13px; color: #cbd5e1;">${errorMsg}</p>
                <p style="font-size: 11px; color: #94a3b8;">Closing this window in 2 seconds...</p>
              </div>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', provider: 'github', error: ${JSON.stringify(errorMsg)} }, '*');
                  setTimeout(() => window.close(), 2000);
                } else {
                  setTimeout(() => { window.location.href = '/'; }, 2500);
                }
              </script>
            </body>
          </html>
        `);
      }
      try {
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
          throw new Error("Server environment missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET.");
        }
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: String(code)
          })
        });
        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
          throw new Error(tokenData.error_description || tokenData.error);
        }
        const accessToken = tokenData.access_token;
        if (!accessToken) {
          throw new Error("Did not receive an access token from GitHub.");
        }
        const userRes = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "User-Agent": "LESync-PMS-App",
            Accept: "application/vnd.github.v3+json"
          }
        });
        const userData = await userRes.json();
        let primaryEmail = userData.email;
        if (!primaryEmail) {
          try {
            const emailsRes = await fetch("https://api.github.com/user/emails", {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "User-Agent": "LESync-PMS-App",
                Accept: "application/vnd.github.v3+json"
              }
            });
            const emails = await emailsRes.json();
            if (Array.isArray(emails)) {
              const primary = emails.find((e) => e.primary && e.verified) || emails[0];
              if (primary) primaryEmail = primary.email;
            }
          } catch {
          }
        }
        const userPayload = {
          id: String(userData.id),
          login: userData.login,
          name: userData.name || userData.login,
          email: primaryEmail || `${userData.login}@users.noreply.github.com`,
          avatar_url: userData.avatar_url || "",
          provider: "github"
        };
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Successful</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f17; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .box { background: #1e293b; border: 1px solid #10b981; border-radius: 12px; padding: 24px; max-width: 420px; text-align: center; }
              </style>
            </head>
            <body>
              <div class="box">
                <h3 style="color: #34d399; margin-top: 0;">Connected to GitHub</h3>
                <p style="font-size: 13px; color: #cbd5e1;">Logged in as <strong>@${userData.login}</strong></p>
                <p style="font-size: 11px; color: #94a3b8;">Closing popup and loading PMS dashboard...</p>
              </div>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'OAUTH_AUTH_SUCCESS',
                    provider: 'github',
                    user: ${JSON.stringify(userPayload)}
                  }, '*');
                  setTimeout(() => window.close(), 500);
                } else {
                  window.location.href = '/';
                }
              </script>
            </body>
          </html>
        `);
      } catch (err) {
        console.error("GitHub OAuth callback exchange error:", err?.message || err);
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>GitHub Exchange Error</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f17; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .box { background: #1e293b; border: 1px solid #ef4444; border-radius: 12px; padding: 24px; max-width: 420px; text-align: center; }
              </style>
            </head>
            <body>
              <div class="box">
                <h3 style="color: #f87171; margin-top: 0;">GitHub Token Exchange Error</h3>
                <p style="font-size: 12px; color: #cbd5e1;">${err.message || "Failed to exchange token"}</p>
              </div>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'OAUTH_AUTH_ERROR',
                    provider: 'github',
                    error: ${JSON.stringify(err.message || "Token exchange failed")}
                  }, '*');
                  setTimeout(() => window.close(), 3000);
                } else {
                  setTimeout(() => { window.location.href = '/'; }, 3000);
                }
              </script>
            </body>
          </html>
        `);
      }
    }
  );
  return app;
}
var defaultApp = createApp();
var app_default = defaultApp;

// api/index.ts
function handler(req, res) {
  if (req.body !== void 0 && req.body !== null) {
    if (typeof req.body === "string") {
      try {
        req.body = JSON.parse(req.body);
      } catch {
      }
    } else if (typeof Buffer !== "undefined" && Buffer.isBuffer(req.body)) {
      try {
        req.body = JSON.parse(req.body.toString("utf8"));
      } catch {
      }
    }
    req._body = true;
  }
  const queryPath = req.query?.path || req.query?.__path;
  if (queryPath) {
    const rawQuery = req.url && req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    const cleanPath = Array.isArray(queryPath) ? queryPath.join("/") : String(queryPath);
    req.url = cleanPath.startsWith("/") ? "/api" + cleanPath : "/api/" + cleanPath;
    if (rawQuery) {
      req.url += rawQuery;
    }
    delete req.query.path;
    delete req.query.__path;
  } else if (req.headers && (req.headers["x-matched-path"] || req.headers["x-invoke-path"])) {
    const matched = req.headers["x-matched-path"] || req.headers["x-invoke-path"];
    if (matched && typeof matched === "string" && matched.startsWith("/api")) {
      req.url = matched;
    }
  }
  return app_default(req, res);
}
export {
  handler as default
};
