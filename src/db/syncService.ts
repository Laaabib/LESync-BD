import { eq, desc, sql } from 'drizzle-orm';
import { db, pool, isPostgresConfigured } from './index.ts';
import { ensureDatabaseSchema } from './schemaInitializer.ts';
import {
  pmsSnapshots,
  pmsSyncEvents,
  pmsRooms,
  pmsReservations,
  pmsStays,
  pmsFolios,
  pmsPayments,
  pmsEventBookings,
  pmsGlAccounts,
  pmsJournalVouchers,
  pmsInvoices,
  pmsCityLedger,
  pmsSuppliers,
  pmsPurchaseBills,
  pmsSupplierPayments,
  pmsRestaurantOrders,
  pmsAuditLogs,
} from './schema.ts';

export interface SyncPayload {
  resortName?: string;
  businessDate?: string;
  rooms?: any[];
  reservations?: any[];
  stays?: any[];
  folios?: any[];
  payments?: any[];
  eventBookings?: any[];
  glAccounts?: any[];
  journalVouchers?: any[];
  invoices?: any[];
  cityLedgerAccounts?: any[];
  suppliers?: any[];
  purchaseBills?: any[];
  supplierPayments?: any[];
  restaurantOrders?: any[];
  auditLogs?: any[];
  [key: string]: any;
}

export async function getCloudSqlStatus() {
  if (!isPostgresConfigured()) {
    return {
      connected: false,
      configured: false,
      region: 'us-west1',
      database: 'Not Configured',
      host: 'PostgreSQL URL Required',
      dbVersion: 'Not Connected',
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
        auditLogs: 0,
      },
      error: 'PostgreSQL database is not configured. Add POSTGRES_URL or DATABASE_URL in Vercel environment variables.',
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
    let row: any = {};
    try {
      const res = await client.query(countsQuery);
      row = res.rows[0] || {};
    } finally {
      client.release();
    }

    const latestSnapshotRes = await db
      .select()
      .from(pmsSnapshots)
      .where(eq(pmsSnapshots.snapshotKey, 'current_pms_state'))
      .limit(1);

    const latestSnapshot = latestSnapshotRes[0];

    const dbName = process.env.POSTGRES_DATABASE || process.env.PGDATABASE || process.env.SQL_DB_NAME || 'postgres';
    const dbHost = process.env.POSTGRES_HOST || process.env.PGHOST || process.env.SQL_HOST || 'PostgreSQL Host';

    return {
      connected: true,
      configured: true,
      region: process.env.POSTGRES_REGION || 'us-west1',
      database: dbName,
      host: dbHost,
      dbVersion: (row.db_version || 'PostgreSQL').split(',')[0],
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
        auditLogs: Number(row.audit_logs_count || 0),
      },
    };
  } catch (error: any) {
    console.error('Failed to get Cloud SQL status:', error?.message || error);
    return {
      connected: false,
      configured: true,
      region: 'us-west1',
      database: process.env.SQL_DB_NAME || 'postgres',
      host: process.env.SQL_HOST || 'PostgreSQL',
      dbVersion: 'Unavailable',
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
        auditLogs: 0,
      },
      error: error?.message || 'Database connection or query failed',
    };
  }
}

function toSafeNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

function toSafeString(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  const str = String(val).trim();
  return str.length > 0 ? str : fallback;
}

function deduplicate<T>(items: T[], keyFn: (item: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    if (!item) continue;
    const key = keyFn(item);
    if (key) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

async function runConcurrent<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
  if (!items || items.length === 0) return;
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item) {
        await fn(item);
      }
    }
  });
  await Promise.all(workers);
}

let activeSyncPromise: Promise<any> | null = null;
let nextPendingState: { state: SyncPayload; syncedBy: string } | null = null;

export async function syncEntirePmsState(fullState: SyncPayload, syncedBy = 'PMS Application Client'): Promise<any> {
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
        syncEntirePmsState(next.state, next.syncedBy).catch((e) => console.warn('Trailing sync notice:', e?.message));
      }
    }
  })();

  return activeSyncPromise;
}

async function executeSyncEntirePmsState(fullState: SyncPayload, syncedBy = 'PMS Application Client') {
  if (!isPostgresConfigured()) {
    throw new Error('PostgreSQL database connection is not configured. Set POSTGRES_URL or DATABASE_URL in Vercel environment variables.');
  }
  await ensureDatabaseSchema();

  try {
    let totalEntitiesCount = 0;

    // Count incoming entities
    totalEntitiesCount += (fullState.rooms?.length || 0);
    totalEntitiesCount += (fullState.reservations?.length || 0);
    totalEntitiesCount += (fullState.stays?.length || 0);
    totalEntitiesCount += (fullState.folios?.length || 0);
    totalEntitiesCount += (fullState.payments?.length || 0);
    totalEntitiesCount += (fullState.eventBookings?.length || 0);
    totalEntitiesCount += (fullState.glAccounts?.length || 0);
    totalEntitiesCount += (fullState.journalVouchers?.length || 0);
    totalEntitiesCount += (fullState.invoices?.length || 0);
    totalEntitiesCount += (fullState.cityLedgerAccounts?.length || 0);
    totalEntitiesCount += (fullState.suppliers?.length || 0);
    totalEntitiesCount += (fullState.purchaseBills?.length || 0);
    totalEntitiesCount += (fullState.supplierPayments?.length || 0);
    totalEntitiesCount += (fullState.restaurantOrders?.length || 0);

    // CRITICAL: First and foremost, atomically write the full PMS state snapshot to Cloud SQL
    // This guarantees 100% data preservation even if an edge-case row constraint occurs in relational tables
    const [existing] = await db
      .select()
      .from(pmsSnapshots)
      .where(eq(pmsSnapshots.snapshotKey, 'current_pms_state'))
      .limit(1);

    const nextVersion = (existing?.version || 0) + 1;

    await db
      .insert(pmsSnapshots)
      .values({
        snapshotKey: 'current_pms_state',
        resortName: fullState.resortName || 'Heritage Resort & Spa',
        businessDate: fullState.businessDate || '2026-08-31',
        statePayload: fullState,
        version: nextVersion,
        syncedBy,
        totalEntities: totalEntitiesCount,
        lastSyncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pmsSnapshots.snapshotKey,
        set: {
          resortName: fullState.resortName || 'Heritage Resort & Spa',
          businessDate: fullState.businessDate || '2026-08-31',
          statePayload: fullState,
          version: nextVersion,
          syncedBy,
          totalEntities: totalEntitiesCount,
          lastSyncedAt: new Date(),
        },
      });

    // 1. Sync Rooms with deduplication & atomic upsert
    if (Array.isArray(fullState.rooms) && fullState.rooms.length > 0) {
      try {
        const uniqueRooms = deduplicate(fullState.rooms, (r) => toSafeString(r.roomNumber || r.id));
        for (const r of uniqueRooms) {
          const roomNum = toSafeString(r.roomNumber);
          if (!roomNum || roomNum === '000') continue;
          const roomId = toSafeString(r.id) || `rm-${roomNum}`;
          const roomTypeName = toSafeString(r.roomTypeName || r.type, 'Standard');
          const floor = toSafeString(r.floor, 'Floor 1');
          const status = toSafeString(r.status || r.housekeepingStatus, 'Clean & Vacant');
          const condition = toSafeString(r.condition || r.operationalStatus, 'Operational');
          const rate = toSafeNumber(r.rate || r.baseRate, 0);
          const updatedAt = new Date();

          await db
            .insert(pmsRooms)
            .values({
              id: roomId,
              roomNumber: roomNum,
              roomTypeName,
              floor,
              status,
              condition,
              rate,
              updatedAt,
            })
            .onConflictDoUpdate({
              target: pmsRooms.roomNumber,
              set: {
                roomTypeName,
                floor,
                status,
                condition,
                rate,
                updatedAt,
              },
            });
        }
      } catch (err: any) {
        console.warn('Rooms relational sync notice:', err?.message);
      }
    }

    // 2. Sync Reservations with deduplication & atomic upsert
    if (Array.isArray(fullState.reservations) && fullState.reservations.length > 0) {
      try {
        const uniqueRes = deduplicate(fullState.reservations, (res) => toSafeString(res.id));
        totalEntitiesCount += uniqueRes.length;
        for (const res of uniqueRes) {
          const resId = toSafeString(res.id);
          if (!resId) continue;
          const resNum = toSafeString(res.reservationNumber, `RES-${resId}`);
          const guestName = toSafeString(res.guestName, 'Guest');
          const guestPhone = res.phone || res.guestPhone || null;
          const guestEmail = res.email || res.guestEmail || null;
          const checkInDate = toSafeString(res.arrivalDate || res.checkInDate || res.checkIn, '2026-09-24');
          const checkOutDate = toSafeString(res.departureDate || res.checkOutDate || res.checkOut, '2026-09-25');
          const roomTypeName = res.roomTypeName || null;
          const totalAmount = toSafeNumber(res.totalEstimatedAmount || res.totalAmount || res.total, 0);
          const depositAmount = toSafeNumber(res.depositAmount || res.paidAmount || res.deposit, 0);
          const balance = toSafeNumber(res.balance, Math.max(0, totalAmount - depositAmount));
          const status = toSafeString(res.status, 'Confirmed');
          const updatedAt = new Date();

          await db
            .insert(pmsReservations)
            .values({
              id: resId,
              reservationNumber: resNum,
              guestName,
              guestPhone,
              guestEmail,
              checkInDate,
              checkOutDate,
              roomTypeName,
              totalAmount,
              depositAmount,
              balance,
              status,
              updatedAt,
            })
            .onConflictDoUpdate({
              target: pmsReservations.id,
              set: {
                reservationNumber: resNum,
                guestName,
                guestPhone,
                guestEmail,
                checkInDate,
                checkOutDate,
                roomTypeName,
                totalAmount,
                depositAmount,
                balance,
                status,
                updatedAt,
              },
            });
        }
      } catch (err: any) {
        console.warn('Reservations relational sync notice:', err?.message);
      }
    }

    // 3. Sync Stays with deduplication & atomic upsert
    if (Array.isArray(fullState.stays) && fullState.stays.length > 0) {
      try {
        const uniqueStays = deduplicate(fullState.stays, (s) => toSafeString(s.id));
        totalEntitiesCount += uniqueStays.length;
        for (const s of uniqueStays) {
          const stayId = toSafeString(s.id);
          if (!stayId) continue;
          const stayNum = toSafeString(s.stayNumber, `STY-${stayId}`);
          const roomId = toSafeString(s.roomId || s.roomNumber);
          const roomNumber = toSafeString(s.roomNumber, '000');
          const guestName = toSafeString(s.guestName, 'Guest');
          const checkInAt = s.checkInAt ? String(s.checkInAt) : null;
          const expectedCheckOutAt = s.expectedCheckOutAt ? String(s.expectedCheckOutAt) : null;
          const actualCheckOutAt = s.actualCheckOutAt ? String(s.actualCheckOutAt) : null;
          const rate = toSafeNumber(s.rate, 0);
          const status = toSafeString(s.status, 'Active');
          const folioId = s.folioId ? String(s.folioId) : null;
          const updatedAt = new Date();

          await db
            .insert(pmsStays)
            .values({
              id: stayId,
              stayNumber: stayNum,
              roomId,
              roomNumber,
              guestName,
              checkInAt,
              expectedCheckOutAt,
              actualCheckOutAt,
              rate,
              status,
              folioId,
              updatedAt,
            })
            .onConflictDoUpdate({
              target: pmsStays.id,
              set: {
                stayNumber: stayNum,
                roomId,
                roomNumber,
                guestName,
                checkInAt,
                expectedCheckOutAt,
                actualCheckOutAt,
                rate,
                status,
                folioId,
                updatedAt,
              },
            });
        }
      } catch (err: any) {
        console.warn('Stays relational sync notice:', err?.message);
      }
    }

    // 4. Sync Folios with deduplication, null-safety, and atomic upsert
    if (Array.isArray(fullState.folios) && fullState.folios.length > 0) {
      try {
        const uniqueFolios = deduplicate(fullState.folios, (f) => toSafeString(f.id));
        totalEntitiesCount += uniqueFolios.length;
        for (const f of uniqueFolios) {
          const folioId = toSafeString(f.id, `fol-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
          if (!folioId) continue;
          const folioNum = toSafeString(f.folioNumber, `FOL-${folioId}`);
          const guestName = toSafeString(f.guestName, 'Guest');
          const roomNumber = toSafeString(f.roomNumber, 'N/A');
          const subtotal = toSafeNumber(f.subtotal, 0);
          const taxTotal = toSafeNumber(f.taxTotal ?? f.tax, 0);
          const serviceChargeTotal = toSafeNumber(f.serviceChargeTotal ?? f.serviceCharge, 0);
          const grandTotal = toSafeNumber(f.grandTotal ?? f.total, subtotal + taxTotal + serviceChargeTotal);
          const paidTotal = toSafeNumber(f.paidTotal ?? f.paid, 0);
          const balance = toSafeNumber(f.balance, grandTotal - paidTotal);
          const status = toSafeString(f.status, 'Open');
          const items = Array.isArray(f.items) ? f.items : [];
          const updatedAt = new Date();

          await db
            .insert(pmsFolios)
            .values({
              id: folioId,
              folioNumber: folioNum,
              guestName,
              roomNumber,
              subtotal,
              taxTotal,
              serviceChargeTotal,
              grandTotal,
              paidTotal,
              balance,
              status,
              items,
              updatedAt,
            })
            .onConflictDoUpdate({
              target: pmsFolios.id,
              set: {
                folioNumber: folioNum,
                guestName,
                roomNumber,
                subtotal,
                taxTotal,
                serviceChargeTotal,
                grandTotal,
                paidTotal,
                balance,
                status,
                items,
                updatedAt,
              },
            });
        }
      } catch (err: any) {
        console.warn('Folios relational sync notice:', err?.message);
      }
    }

    // 5. Sync Payments with deduplication & atomic upsert
    if (Array.isArray(fullState.payments) && fullState.payments.length > 0) {
      try {
        const uniquePayments = deduplicate(fullState.payments, (p) => toSafeString(p.id));
        for (const p of uniquePayments) {
          const paymentId = toSafeString(p.id);
          const txnNumber = toSafeString(p.transactionNumber || p.paymentNumber, `PAY-${paymentId}`);
          const folioId = p.folioId ? String(p.folioId) : null;
          const eventBookingId = p.eventBookingId ? String(p.eventBookingId) : null;
          const amount = toSafeNumber(p.amount, 0);
          const method = toSafeString(p.method || p.paymentMethod, 'Cash');
          let reference = p.reference || p.referenceNumber || null;
          if (!reference || reference === 'Payment' || reference === 'Deposit') {
            if (p.transactionNo || p.traceNo) {
              reference = [
                p.transactionNo ? `Txn: ${p.transactionNo}` : '',
                p.traceNo ? `Trace: ${p.traceNo}` : ''
              ].filter(Boolean).join(' | ');
            } else if (p.cardType) {
              reference = `${p.cardType} POS`;
            }
          }
          const status = toSafeString(p.status, 'Completed');
          const createdBy = toSafeString(p.createdBy || p.receivedBy, 'System');
          const createdAt = p.createdAt ? String(p.createdAt) : new Date().toISOString();
          const syncedAt = new Date();

          await db
            .insert(pmsPayments)
            .values({
              id: paymentId,
              transactionNumber: txnNumber,
              folioId,
              eventBookingId,
              amount,
              method,
              reference,
              status,
              createdBy,
              createdAt,
              syncedAt,
            })
            .onConflictDoUpdate({
              target: pmsPayments.id,
              set: {
                transactionNumber: txnNumber,
                folioId,
                eventBookingId,
                amount,
                method,
                reference,
                status,
                createdBy,
                createdAt,
                syncedAt,
              },
            });
        }
      } catch (err: any) {
        console.warn('Payments relational sync notice:', err?.message);
      }
    }

    // 6. Sync Event Bookings with deduplication & atomic upsert
    if (Array.isArray(fullState.eventBookings) && fullState.eventBookings.length > 0) {
      try {
        const uniqueEvents = deduplicate(fullState.eventBookings, (e) => toSafeString(e.id));
        totalEntitiesCount += uniqueEvents.length;
        for (const e of uniqueEvents) {
          const eventId = toSafeString(e.id);
          if (!eventId) continue;
          const eventNumber = toSafeString(e.eventNumber, `EVT-${eventId}`);
          const clientName = toSafeString(e.clientName, 'Client');
          const hallName = toSafeString(e.hallName, 'Hall');
          const eventName = toSafeString(e.eventName, 'Event');
          const eventType = toSafeString(e.eventType, 'Corporate');
          const eventDate = toSafeString(e.eventDate, '2026-08-31');
          const total = toSafeNumber(e.total || e.totalAmount, 0);
          const balance = toSafeNumber(e.balance, total);
          const status = toSafeString(e.status, 'Confirmed');
          const updatedAt = new Date();

          await db
            .insert(pmsEventBookings)
            .values({
              id: eventId,
              eventNumber,
              clientName,
              hallName,
              eventName,
              eventType,
              eventDate,
              total,
              balance,
              status,
              updatedAt,
            })
            .onConflictDoUpdate({
              target: pmsEventBookings.id,
              set: {
                eventNumber,
                clientName,
                hallName,
                eventName,
                eventType,
                eventDate,
                total,
                balance,
                status,
                updatedAt,
              },
            });
        }
      } catch (err: any) {
        console.warn('Event bookings relational sync notice:', err?.message);
      }
    }

    // 7. Sync General Ledger Accounts with deduplication & atomic upsert
    if (Array.isArray(fullState.glAccounts) && fullState.glAccounts.length > 0) {
      try {
        const uniqueGl = deduplicate(fullState.glAccounts, (gl) => toSafeString(gl.code || gl.id));
        totalEntitiesCount += uniqueGl.length;
        for (const gl of uniqueGl) {
          const glCode = toSafeString(gl.code);
          if (!glCode) continue;
          const glId = toSafeString(gl.id, glCode);
          const name = toSafeString(gl.name, 'GL Account');
          const category = toSafeString(gl.category, 'Revenue');
          const accountType = toSafeString(gl.accountType || gl.type, 'Balance Sheet');
          const balance = toSafeNumber(gl.balance, 0);
          const isActive = gl.isActive !== false;
          const updatedAt = new Date();

          await db
            .insert(pmsGlAccounts)
            .values({
              id: glId,
              code: glCode,
              name,
              category,
              accountType,
              balance,
              isActive,
              updatedAt,
            })
            .onConflictDoUpdate({
              target: pmsGlAccounts.code,
              set: {
                name,
                category,
                accountType,
                balance,
                isActive,
                updatedAt,
              },
            });
        }
      } catch (err: any) {
        console.warn('GL accounts relational sync notice:', err?.message);
      }
    }

    // 8. Sync Journal Vouchers with deduplication & atomic upsert
    if (Array.isArray(fullState.journalVouchers) && fullState.journalVouchers.length > 0) {
      try {
        const uniqueJv = deduplicate(fullState.journalVouchers, (jv) => toSafeString(jv.voucherNumber || jv.id));
        totalEntitiesCount += uniqueJv.length;
        for (const jv of uniqueJv) {
          const voucherNum = toSafeString(jv.voucherNumber || jv.id, `JV-${Date.now()}`);
          if (!voucherNum) continue;
          const jvId = toSafeString(jv.id, `jv-${voucherNum}`);
          const voucherDate = toSafeString(jv.voucherDate || jv.date, '2026-08-31');
          const reference = jv.reference || jv.sourceReference || null;
          const narration = toSafeString(jv.narration, 'Journal Entry');
          const totalDebit = toSafeNumber(jv.totalDebit, 0);
          const totalCredit = toSafeNumber(jv.totalCredit, 0);
          const status = toSafeString(jv.status, 'Posted');
          const lines = Array.isArray(jv.lines) ? jv.lines : (Array.isArray(jv.entries) ? jv.entries : []);
          const createdAt = jv.createdAt ? new Date(jv.createdAt) : new Date();

          await db
            .insert(pmsJournalVouchers)
            .values({
              id: jvId,
              voucherNumber: voucherNum,
              voucherDate,
              reference,
              narration,
              totalDebit,
              totalCredit,
              status,
              lines,
              createdAt,
            })
            .onConflictDoUpdate({
              target: pmsJournalVouchers.voucherNumber,
              set: {
                voucherDate,
                reference,
                narration,
                totalDebit,
                totalCredit,
                status,
                lines,
              },
            });
        }
      } catch (err: any) {
        console.warn('Journal vouchers relational sync notice:', err?.message);
      }
    }

    // 9. Sync Invoices
    if (Array.isArray(fullState.invoices) && fullState.invoices.length > 0) {
      try {
        const validInvoices = deduplicate(fullState.invoices, (i) => toSafeString(i.invoiceNumber || i.id));
        totalEntitiesCount += validInvoices.length;

        for (const inv of validInvoices) {
          const invoiceNum = toSafeString(inv.invoiceNumber, inv.id || `INV-${Date.now()}`);
          if (!invoiceNum) continue;
          const invId = toSafeString(inv.id, `inv-${invoiceNum}`);
          const folioId = toSafeString(inv.folioId);
          const eventBookingId = toSafeString(inv.eventBookingId);
          const guestName = toSafeString(inv.guestName);
          const clientName = toSafeString(inv.clientName);
          const subtotal = toSafeNumber(inv.subtotal);
          const taxTotal = toSafeNumber(inv.taxTotal || inv.tax);
          const serviceChargeTotal = toSafeNumber(inv.serviceChargeTotal || inv.serviceCharge);
          const grandTotal = toSafeNumber(inv.grandTotal || inv.total);
          const paidTotal = toSafeNumber(inv.paidTotal || inv.paidAmount);
          const balance = toSafeNumber(inv.balance, grandTotal - paidTotal);
          const status = toSafeString(inv.status, 'Issued');
          const invoiceDate = toSafeString(inv.invoiceDate || inv.date, new Date().toISOString().split('T')[0]);
          const dueDate = toSafeString(inv.dueDate);
          const paymentMethod = toSafeString(inv.paymentMethod);
          const items = inv.items || [];
          const createdAt = inv.createdAt ? new Date(inv.createdAt) : new Date();

          await db
            .insert(pmsInvoices)
            .values({
              id: invId,
              invoiceNumber: invoiceNum,
              folioId: folioId || null,
              eventBookingId: eventBookingId || null,
              guestName: guestName || null,
              clientName: clientName || null,
              subtotal,
              taxTotal,
              serviceChargeTotal,
              grandTotal,
              paidTotal,
              balance,
              status,
              invoiceDate,
              dueDate: dueDate || null,
              paymentMethod: paymentMethod || null,
              items,
              createdAt,
            })
            .onConflictDoUpdate({
              target: pmsInvoices.invoiceNumber,
              set: {
                folioId: folioId || null,
                eventBookingId: eventBookingId || null,
                guestName: guestName || null,
                clientName: clientName || null,
                subtotal,
                taxTotal,
                serviceChargeTotal,
                grandTotal,
                paidTotal,
                balance,
                status,
                invoiceDate,
                dueDate: dueDate || null,
                paymentMethod: paymentMethod || null,
                items,
              },
            });
        }
      } catch (err: any) {
        console.warn('Invoices relational sync notice:', err?.message);
      }
    }

    // 10. Sync City Ledger Accounts (AR)
    if (Array.isArray(fullState.cityLedgerAccounts) && fullState.cityLedgerAccounts.length > 0) {
      try {
        const validCl = deduplicate(fullState.cityLedgerAccounts, (c) => toSafeString(c.accountNumber || c.id));
        totalEntitiesCount += validCl.length;

        for (const cl of validCl) {
          const accNum = toSafeString(cl.accountNumber, cl.id || `CL-${Date.now()}`);
          if (!accNum) continue;
          const clId = toSafeString(cl.id, `cl-${accNum}`);
          const companyName = toSafeString(cl.companyName, 'Corporate Client');
          const contactPerson = toSafeString(cl.contactPerson);
          const phone = toSafeString(cl.phone);
          const email = toSafeString(cl.email);
          const creditLimit = toSafeNumber(cl.creditLimit);
          const currentBalance = toSafeNumber(cl.currentBalance);
          const paymentTerms = toSafeString(cl.paymentTerms, 'Net 30');
          const status = toSafeString(cl.status, 'Active');
          const notes = toSafeString(cl.notes);

          await db
            .insert(pmsCityLedger)
            .values({
              id: clId,
              accountNumber: accNum,
              companyName,
              contactPerson: contactPerson || null,
              phone: phone || null,
              email: email || null,
              creditLimit,
              currentBalance,
              paymentTerms,
              status,
              notes: notes || null,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: pmsCityLedger.accountNumber,
              set: {
                companyName,
                contactPerson: contactPerson || null,
                phone: phone || null,
                email: email || null,
                creditLimit,
                currentBalance,
                paymentTerms,
                status,
                notes: notes || null,
                updatedAt: new Date(),
              },
            });
        }
      } catch (err: any) {
        console.warn('City ledger relational sync notice:', err?.message);
      }
    }

    // 11. Sync Suppliers (AP Vendors)
    if (Array.isArray(fullState.suppliers) && fullState.suppliers.length > 0) {
      try {
        const validSuppliers = deduplicate(fullState.suppliers, (s) => toSafeString(s.code || s.id));
        totalEntitiesCount += validSuppliers.length;

        for (const sup of validSuppliers) {
          const code = toSafeString(sup.code, sup.id || `SUP-${Date.now()}`);
          if (!code) continue;
          const supId = toSafeString(sup.id, `sup-${code}`);
          const name = toSafeString(sup.name, 'Vendor');
          const contactPerson = toSafeString(sup.contactPerson);
          const phone = toSafeString(sup.phone);
          const email = toSafeString(sup.email);
          const category = toSafeString(sup.category);
          const paymentTerms = toSafeString(sup.paymentTerms, 'Net 30');
          const currentBalance = toSafeNumber(sup.currentBalance);
          const bankDetails = sup.bankDetails || null;
          const status = toSafeString(sup.status, 'Active');

          await db
            .insert(pmsSuppliers)
            .values({
              id: supId,
              name,
              code,
              contactPerson: contactPerson || null,
              phone: phone || null,
              email: email || null,
              category: category || null,
              paymentTerms,
              currentBalance,
              bankDetails,
              status,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: pmsSuppliers.code,
              set: {
                name,
                contactPerson: contactPerson || null,
                phone: phone || null,
                email: email || null,
                category: category || null,
                paymentTerms,
                currentBalance,
                bankDetails,
                status,
                updatedAt: new Date(),
              },
            });
        }
      } catch (err: any) {
        console.warn('Suppliers relational sync notice:', err?.message);
      }
    }

    // 12. Sync Purchase Bills (AP Bills)
    if (Array.isArray(fullState.purchaseBills) && fullState.purchaseBills.length > 0) {
      try {
        const validBills = deduplicate(fullState.purchaseBills, (b) => toSafeString(b.billNumber || b.id));
        totalEntitiesCount += validBills.length;

        for (const bill of validBills) {
          const billNumber = toSafeString(bill.billNumber, bill.id || `BILL-${Date.now()}`);
          if (!billNumber) continue;
          const billId = toSafeString(bill.id, `pb-${billNumber}`);
          const supplierId = toSafeString(bill.supplierId, 'sup-default');
          const supplierName = toSafeString(bill.supplierName, 'Vendor');
          const billDate = toSafeString(bill.billDate || bill.date, new Date().toISOString().split('T')[0]);
          const dueDate = toSafeString(bill.dueDate);
          const totalAmount = toSafeNumber(bill.totalAmount || bill.grandTotal);
          const paidAmount = toSafeNumber(bill.paidAmount || bill.paidTotal);
          const balance = toSafeNumber(bill.balance, totalAmount - paidAmount);
          const status = toSafeString(bill.status, 'Open');
          const items = bill.items || [];
          const journalVoucherId = toSafeString(bill.journalVoucherId);

          await db
            .insert(pmsPurchaseBills)
            .values({
              id: billId,
              billNumber,
              supplierId,
              supplierName,
              billDate,
              dueDate: dueDate || null,
              totalAmount,
              paidAmount,
              balance,
              status,
              items,
              journalVoucherId: journalVoucherId || null,
              createdAt: new Date(),
            })
            .onConflictDoUpdate({
              target: pmsPurchaseBills.billNumber,
              set: {
                supplierId,
                supplierName,
                billDate,
                dueDate: dueDate || null,
                totalAmount,
                paidAmount,
                balance,
                status,
                items,
                journalVoucherId: journalVoucherId || null,
              },
            });
        }
      } catch (err: any) {
        console.warn('Purchase bills relational sync notice:', err?.message);
      }
    }

    // 13. Sync Supplier Payments (AP Disbursements)
    if (Array.isArray(fullState.supplierPayments) && fullState.supplierPayments.length > 0) {
      try {
        const validPayments = deduplicate(fullState.supplierPayments, (p) => toSafeString(p.paymentNumber || p.id));
        totalEntitiesCount += validPayments.length;

        for (const sp of validPayments) {
          const paymentNumber = toSafeString(sp.paymentNumber, sp.id || `SPAY-${Date.now()}`);
          if (!paymentNumber) continue;
          const payId = toSafeString(sp.id, `sp-${paymentNumber}`);
          const supplierId = toSafeString(sp.supplierId, 'sup-default');
          const supplierName = toSafeString(sp.supplierName, 'Vendor');
          const billId = toSafeString(sp.billId);
          const amount = toSafeNumber(sp.amount);
          const paymentDate = toSafeString(sp.paymentDate || sp.date, new Date().toISOString().split('T')[0]);
          const paymentMethod = toSafeString(sp.paymentMethod, 'Bank Transfer');
          const bankAccount = toSafeString(sp.bankAccount);
          const referenceNumber = toSafeString(sp.referenceNumber);
          const status = toSafeString(sp.status, 'Completed');
          const notes = toSafeString(sp.notes);

          await db
            .insert(pmsSupplierPayments)
            .values({
              id: payId,
              paymentNumber,
              supplierId,
              supplierName,
              billId: billId || null,
              amount,
              paymentDate,
              paymentMethod,
              bankAccount: bankAccount || null,
              referenceNumber: referenceNumber || null,
              status,
              notes: notes || null,
              createdAt: new Date(),
            })
            .onConflictDoUpdate({
              target: pmsSupplierPayments.paymentNumber,
              set: {
                supplierId,
                supplierName,
                billId: billId || null,
                amount,
                paymentDate,
                paymentMethod,
                bankAccount: bankAccount || null,
                referenceNumber: referenceNumber || null,
                status,
                notes: notes || null,
              },
            });
        }
      } catch (err: any) {
        console.warn('Supplier payments relational sync notice:', err?.message);
      }
    }

    // 14. Sync Restaurant Orders (POS)
    if (Array.isArray(fullState.restaurantOrders) && fullState.restaurantOrders.length > 0) {
      try {
        const validOrders = deduplicate(fullState.restaurantOrders, (o) => toSafeString(o.orderNumber || o.id));
        totalEntitiesCount += validOrders.length;

        for (const ord of validOrders) {
          const orderNumber = toSafeString(ord.orderNumber, ord.id || `ORD-${Date.now()}`);
          if (!orderNumber) continue;
          const ordId = toSafeString(ord.id, `ord-${orderNumber}`);
          const orderType = toSafeString(ord.orderType, 'Dine-In');
          const tableNumber = toSafeString(ord.tableNumber);
          const roomNumber = toSafeString(ord.roomNumber);
          const guestName = toSafeString(ord.guestName);
          const subtotal = toSafeNumber(ord.subtotal);
          const tax = toSafeNumber(ord.tax);
          const serviceCharge = toSafeNumber(ord.serviceCharge);
          const total = toSafeNumber(ord.total);
          const paymentStatus = toSafeString(ord.paymentStatus, 'Paid');
          const paymentMethod = toSafeString(ord.paymentMethod);
          const items = ord.items || [];

          await db
            .insert(pmsRestaurantOrders)
            .values({
              id: ordId,
              orderNumber,
              orderType,
              tableNumber: tableNumber || null,
              roomNumber: roomNumber || null,
              guestName: guestName || null,
              subtotal,
              tax,
              serviceCharge,
              total,
              paymentStatus,
              paymentMethod: paymentMethod || null,
              items,
              createdAt: new Date(),
            })
            .onConflictDoUpdate({
              target: pmsRestaurantOrders.orderNumber,
              set: {
                orderType,
                tableNumber: tableNumber || null,
                roomNumber: roomNumber || null,
                guestName: guestName || null,
                subtotal,
                tax,
                serviceCharge,
                total,
                paymentStatus,
                paymentMethod: paymentMethod || null,
                items,
              },
            });
        }
      } catch (err: any) {
        console.warn('Restaurant orders relational sync notice:', err?.message);
      }
    }

    // 15. Sync Audit Logs
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
            action: toSafeString(log.action, 'Action'),
            entityType: toSafeString(log.entityType, 'System'),
            entityId: toSafeString(log.entityId, logId),
            oldValue: toSafeString(log.oldValue) || null,
            newValue: toSafeString(log.newValue) || null,
            ipAddress: toSafeString(log.ipAddress) || null,
            createdAt: log.createdAt ? new Date(log.createdAt) : new Date(),
          };
        });

        for (let i = 0; i < logRows.length; i += 50) {
          const chunk = logRows.slice(i, i + 50);
          await db.insert(pmsAuditLogs).values(chunk).onConflictDoNothing();
        }
      } catch (err: any) {
        console.warn('Audit logs relational sync notice:', err?.message);
      }
    }

    // 16. Record sync event
    try {
      await db.insert(pmsSyncEvents).values({
        entityType: 'FULL_STATE_SNAPSHOT',
        entityId: `v${nextVersion}`,
        action: 'GLOBAL_SYNC',
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
          restaurantOrdersCount: fullState.restaurantOrders?.length || 0,
        },
        syncedAt: new Date(),
        status: 'SUCCESS',
      });
    } catch (err: any) {
      console.warn('Sync events record notice:', err?.message);
    }

    return {
      success: true,
      version: nextVersion,
      totalEntities: totalEntitiesCount,
      timestamp: new Date().toISOString(),
      region: 'us-west1',
    };
  } catch (error: any) {
    console.error('Failed to sync PMS state to Cloud SQL snapshot:', error);
    const detailMsg = error?.detail || error?.message || 'Database full sync failed';
    throw new Error(`Database full sync failed: ${detailMsg}`, { cause: error });
  }
}

export async function loadLatestPmsSnapshot() {
  if (!isPostgresConfigured()) {
    return null;
  }
  try {
    await ensureDatabaseSchema();
    const [snapshot] = await db
      .select()
      .from(pmsSnapshots)
      .where(eq(pmsSnapshots.snapshotKey, 'current_pms_state'))
      .limit(1);

    if (!snapshot) return null;

    return {
      version: snapshot.version,
      resortName: snapshot.resortName,
      businessDate: snapshot.businessDate,
      totalEntities: snapshot.totalEntities,
      lastSyncedAt: snapshot.lastSyncedAt,
      state: snapshot.statePayload,
    };
  } catch (error) {
    console.warn('Failed to load latest PMS snapshot from PostgreSQL:', error);
    return null;
  }
}

export async function getGlAccountsFromDb() {
  if (!isPostgresConfigured()) {
    return [];
  }
  try {
    await ensureDatabaseSchema();
    return await db.select().from(pmsGlAccounts).orderBy(pmsGlAccounts.code);
  } catch (error) {
    console.warn('Failed to fetch GL Accounts from PostgreSQL:', error);
    return [];
  }
}

export async function getJournalVouchersFromDb(limit = 100) {
  if (!isPostgresConfigured()) {
    return [];
  }
  try {
    await ensureDatabaseSchema();
    return await db
      .select()
      .from(pmsJournalVouchers)
      .orderBy(desc(pmsJournalVouchers.createdAt))
      .limit(limit);
  } catch (error) {
    console.warn('Failed to fetch Journal Vouchers from PostgreSQL:', error);
    return [];
  }
}

export async function getCityLedgerFromDb() {
  if (!isPostgresConfigured()) {
    return [];
  }
  try {
    await ensureDatabaseSchema();
    return await db.select().from(pmsCityLedger).orderBy(pmsCityLedger.companyName);
  } catch (error) {
    console.warn('Failed to fetch City Ledger accounts from PostgreSQL:', error);
    return [];
  }
}

export async function getTrialBalanceFromDb() {
  if (!isPostgresConfigured()) {
    return {
      asOf: new Date().toISOString(),
      rows: [],
      totalDebit: 0,
      totalCredit: 0,
      isBalanced: true,
    };
  }
  try {
    await ensureDatabaseSchema();
    const accounts = await db.select().from(pmsGlAccounts).orderBy(pmsGlAccounts.code);
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = accounts.map((acc) => {
      const bal = Number(acc.balance || 0);
      const isDebitNormal = acc.category === 'Asset' || acc.category === 'Expense';
      const debit = isDebitNormal ? (bal >= 0 ? bal : 0) : bal < 0 ? Math.abs(bal) : 0;
      const credit = !isDebitNormal ? (bal >= 0 ? bal : 0) : bal < 0 ? Math.abs(bal) : 0;

      totalDebit += debit;
      totalCredit += credit;

      return {
        code: acc.code,
        name: acc.name,
        type: acc.accountType,
        category: acc.category,
        balance: bal,
        debit,
        credit,
      };
    });

    return {
      asOf: new Date().toISOString(),
      rows,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  } catch (error) {
    console.warn('Failed to calculate trial balance from PostgreSQL:', error);
    return {
      asOf: new Date().toISOString(),
      rows: [],
      totalDebit: 0,
      totalCredit: 0,
      isBalanced: true,
    };
  }
}

export async function recordSyncEvent(entityType: string, entityId: string, action: string, payload?: any) {
  if (!isPostgresConfigured()) {
    return { entityType, entityId, action, syncedAt: new Date().toISOString(), status: 'LOCAL_ONLY' };
  }
  try {
    await ensureDatabaseSchema();
    const [record] = await db
      .insert(pmsSyncEvents)
      .values({
        entityType,
        entityId,
        action,
        payload: payload || null,
        syncedAt: new Date(),
        status: 'SUCCESS',
      })
      .returning();

    return record;
  } catch (error) {
    console.warn('Failed to log sync event in PostgreSQL:', error);
    return { entityType, entityId, action, syncedAt: new Date().toISOString(), status: 'LOGGED_LOCALLY' };
  }
}

export async function getRecentSyncEvents(limit = 20) {
  if (!isPostgresConfigured()) {
    return [];
  }
  try {
    await ensureDatabaseSchema();
    return await db
      .select()
      .from(pmsSyncEvents)
      .orderBy(desc(pmsSyncEvents.syncedAt))
      .limit(limit);
  } catch (error) {
    console.warn('Failed to fetch sync events:', error);
    return [];
  }
}
