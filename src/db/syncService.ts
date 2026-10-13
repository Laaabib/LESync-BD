import { eq, desc, sql, notInArray, or, and, ne } from 'drizzle-orm';
import { db, pool, isPostgresConfigured, markPostgresAuthFailed } from './index.ts';
import { ensureDatabaseSchema } from './schemaInitializer.ts';
import {
  users,
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

function getSupabaseServerKey(): string {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    'sb_publishable_s_KTFsBgpfnFL2UkYZqqyw_TZilAsZw'
  ).trim();
}

export async function getCloudSqlStatus() {
  if (!isPostgresConfigured()) {
    const sbUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://cvviwipdglcajldmzbvc.supabase.co').replace(/\/rest\/v1\/?$/i, '').trim();
    const sbKey = getSupabaseServerKey();
    if (sbUrl && sbKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(sbUrl, sbKey);
        const { data: snapshot } = await sb
          .from('pms_snapshots')
          .select('snapshot_key, version, total_entities, last_synced_at')
          .eq('snapshot_key', 'current_pms_state')
          .maybeSingle();

        const host = sbUrl.replace(/^https?:\/\//, '');
        return {
          connected: true,
          configured: true,
          region: 'Supabase Cloud',
          database: 'postgres',
          host,
          dbVersion: 'PostgreSQL (Supabase REST API)',
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
            auditLogs: 0,
          },
          error: null,
        };
      } catch (err: any) {
        // Non-fatal, fallback to default configured status
      }
      return {
        connected: true,
        configured: true,
        region: 'Supabase Cloud',
        database: 'postgres',
        host: sbUrl.replace(/^https?:\/\//, ''),
        dbVersion: 'PostgreSQL (Supabase)',
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
          auditLogs: 0,
        },
        error: null,
      };
    }

    return {
      connected: false,
      configured: false,
      region: 'Local Environment',
      database: 'Local In-Memory Mirror',
      host: 'localhost',
      dbVersion: 'Local Browser & Server State',
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
      error: null,
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
      region: process.env.SUPABASE_REGION || 'Supabase Cloud',
      database: dbName,
      host: dbHost,
      dbVersion: (row.db_version || 'PostgreSQL (Supabase)').split(',')[0],
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
    const sbUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/i, '').trim();
    const sbKey = getSupabaseServerKey();
    if (sbUrl && sbKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(sbUrl, sbKey);
        const { data: snapshot } = await sb
          .from('pms_snapshots')
          .select('snapshot_key, version, total_entities, last_synced_at')
          .eq('snapshot_key', 'current_pms_state')
          .maybeSingle();

        return {
          connected: true,
          configured: true,
          region: 'Supabase Cloud (REST)',
          database: 'postgres',
          host: sbUrl.replace(/^https?:\/\//, ''),
          dbVersion: 'PostgreSQL (Supabase REST API)',
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
            auditLogs: 0,
          },
          error: null,
        };
      } catch {}
    }

    const msg = error?.message || String(error);
    if (msg.includes('authentication failed') || msg.includes('ECONNREFUSED') || msg.includes('57P01')) {
      markPostgresAuthFailed();
    }
    return {
      connected: false,
      configured: true,
      region: 'Supabase Cloud',
      database: process.env.SQL_DB_NAME || 'postgres',
      host: process.env.POSTGRES_HOST || process.env.SQL_HOST || 'Supabase',
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
    const sbUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://cvviwipdglcajldmzbvc.supabase.co').replace(/\/rest\/v1\/?$/i, '').trim();
    const sbKey = getSupabaseServerKey();
    if (sbUrl && sbKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(sbUrl, sbKey);
        const totalEntities =
          (fullState.rooms?.length || 0) +
          (fullState.reservations?.length || 0) +
          (fullState.stays?.length || 0) +
          (fullState.folios?.length || 0) +
          (fullState.payments?.length || 0) +
          (fullState.glAccounts?.length || 0) +
          (fullState.journalVouchers?.length || 0) +
          (fullState.users?.length || 0);

        // Sync users to Supabase REST users table
        if (Array.isArray(fullState.users) && fullState.users.length > 0) {
          try {
            const userRows = fullState.users.map((u: any) => ({
              uid: toSafeString(u.id),
              email: toSafeString(u.email) || `${toSafeString(u.id)}@lesyncpms.com`,
              name: toSafeString(u.name),
              role: toSafeString(u.role || u.roleName || 'Staff'),
              created_at: u.createdAt || new Date().toISOString()
            }));
            await sb.from('users').upsert(userRows, { onConflict: 'uid' });
          } catch (uErr: any) {
            console.warn('Notice syncing users via Supabase REST:', uErr?.message || uErr);
          }
        }

        const { data, error } = await sb
          .from('pms_snapshots')
          .upsert(
            {
              snapshot_key: 'current_pms_state',
              resort_name: fullState.resortName || 'Heritage Resort & Spa',
              business_date: fullState.businessDate || new Date().toISOString().slice(0, 10),
              state_payload: fullState,
              synced_by: syncedBy,
              total_entities: totalEntities,
              last_synced_at: new Date().toISOString(),
            },
            { onConflict: 'snapshot_key' }
          )
          .select('version')
          .maybeSingle();

        if (!error) {
          return {
            success: true,
            version: data?.version || 1,
            totalEntities,
            timestamp: new Date().toISOString(),
            syncedBy,
            provider: 'Supabase REST',
          };
        }
      } catch (err: any) {
        console.warn('Supabase REST sync notice:', err?.message || err);
      }
    }

    return {
      success: true,
      syncedToCloud: false,
      version: 1,
      totalEntities: (fullState.rooms?.length || 0),
      timestamp: new Date().toISOString(),
      message: 'State preserved in local memory & browser mirror.',
    };
  }
  await ensureDatabaseSchema();

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

  try {

    // CRITICAL: First and foremost, atomically write the full PMS state snapshot to Supabase PostgreSQL
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

    // 0. Sync Users with deduplication & batch upsert
    if (Array.isArray(fullState.users) && fullState.users.length > 0) {
      try {
        const uniqueUsers = deduplicate(fullState.users, (u) => toSafeString(u.id));
        const userRows = uniqueUsers
          .map((u) => {
            const uid = toSafeString(u.id);
            if (!uid) return null;
            return {
              uid,
              email: toSafeString(u.email) || `${uid}@lesyncpms.com`,
              name: toSafeString(u.name) || 'Staff User',
              username: toSafeString(u.username || (u.email ? u.email.split('@')[0] : uid)),
              role: toSafeString(u.role || u.roleName || 'Staff'),
              createdAt: new Date(),
            };
          })
          .filter(Boolean) as any[];

        if (userRows.length > 0) {
          await db
            .insert(users)
            .values(userRows)
            .onConflictDoUpdate({
              target: users.uid,
              set: {
                email: sql`excluded.email`,
                name: sql`excluded.name`,
                username: sql`excluded.username`,
                role: sql`excluded.role`,
              },
            });
        }
      } catch (userErr: any) {
        console.warn('PostgreSQL users table sync notice:', userErr?.message || userErr);
      }
    }

    // 1. Sync Rooms with deduplication & batch upsert
    if (Array.isArray(fullState.rooms) && fullState.rooms.length > 0) {
      try {
        const uniqueRooms = deduplicate(fullState.rooms, (r) => toSafeString(r.roomNumber || r.id));
        const roomRows = uniqueRooms
          .map((r) => {
            const roomNum = toSafeString(r.roomNumber);
            if (!roomNum || roomNum === '000') return null;
            return {
              id: toSafeString(r.id) || `rm-${roomNum}`,
              roomNumber: roomNum,
              roomTypeName: toSafeString(r.roomTypeName || r.type, 'Standard'),
              floor: toSafeString(r.floor, 'Floor 1'),
              status: toSafeString(r.status || r.housekeepingStatus, 'Clean & Vacant'),
              condition: toSafeString(r.condition || r.operationalStatus, 'Operational'),
              rate: toSafeNumber(r.rate || r.baseRate, 0),
              updatedAt: new Date(),
            };
          })
          .filter(Boolean) as any[];

        if (roomRows.length > 0) {
          await db
            .insert(pmsRooms)
            .values(roomRows)
            .onConflictDoUpdate({
              target: pmsRooms.roomNumber,
              set: {
                roomTypeName: sql`excluded.room_type_name`,
                floor: sql`excluded.floor`,
                status: sql`excluded.status`,
                condition: sql`excluded.condition`,
                rate: sql`excluded.rate`,
                updatedAt: sql`excluded.updated_at`,
              },
            });

          const activeRoomNumbers = roomRows.map((r) => r.roomNumber);
          if (activeRoomNumbers.length > 0) {
            await db.delete(pmsRooms).where(notInArray(pmsRooms.roomNumber, activeRoomNumbers));
          }
        }
      } catch (err: any) {
        console.warn('Rooms relational sync notice:', err?.message);
      }
    }

    // 2. Sync Reservations with deduplication & batch upsert
    if (Array.isArray(fullState.reservations) && fullState.reservations.length > 0) {
      try {
        const uniqueRes = deduplicate(fullState.reservations, (res) => toSafeString(res.id));
        totalEntitiesCount += uniqueRes.length;
        const resRows = uniqueRes
          .map((res) => {
            const resId = toSafeString(res.id);
            if (!resId) return null;
            const totalAmount = toSafeNumber(res.totalEstimatedAmount || res.totalAmount || res.total, 0);
            const depositAmount = toSafeNumber(res.depositAmount || res.paidAmount || res.deposit, 0);
            return {
              id: resId,
              reservationNumber: toSafeString(res.reservationNumber, `RES-${resId}`),
              guestName: toSafeString(res.guestName, 'Guest'),
              guestPhone: res.phone || res.guestPhone || null,
              guestEmail: res.email || res.guestEmail || null,
              checkInDate: toSafeString(res.arrivalDate || res.checkInDate || res.checkIn, '2026-09-24'),
              checkOutDate: toSafeString(res.departureDate || res.checkOutDate || res.checkOut, '2026-09-25'),
              roomTypeName: res.roomTypeName || null,
              totalAmount,
              depositAmount,
              balance: toSafeNumber(res.balance, Math.max(0, totalAmount - depositAmount)),
              status: toSafeString(res.status, 'Confirmed'),
              updatedAt: new Date(),
            };
          })
          .filter(Boolean) as any[];

        if (resRows.length > 0) {
          await db
            .insert(pmsReservations)
            .values(resRows)
            .onConflictDoUpdate({
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
                updatedAt: sql`excluded.updated_at`,
              },
            });

          const activeResIds = resRows.map((r) => r.id);
          if (activeResIds.length > 0) {
            await db.delete(pmsReservations).where(notInArray(pmsReservations.id, activeResIds));
          }
        }
      } catch (err: any) {
        console.warn('Reservations relational sync notice:', err?.message);
      }
    }

    // 3. Sync Stays with deduplication & batch upsert
    if (Array.isArray(fullState.stays) && fullState.stays.length > 0) {
      try {
        const uniqueStays = deduplicate(fullState.stays, (s) => toSafeString(s.id));
        totalEntitiesCount += uniqueStays.length;
        const stayRows = uniqueStays
          .map((s) => {
            const stayId = toSafeString(s.id);
            if (!stayId) return null;
            return {
              id: stayId,
              stayNumber: toSafeString(s.stayNumber, `STY-${stayId}`),
              roomId: toSafeString(s.roomId || s.roomNumber),
              roomNumber: toSafeString(s.roomNumber, '000'),
              guestName: toSafeString(s.guestName, 'Guest'),
              checkInAt: s.checkInAt ? String(s.checkInAt) : null,
              expectedCheckOutAt: s.expectedCheckOutAt ? String(s.expectedCheckOutAt) : null,
              actualCheckOutAt: s.actualCheckOutAt ? String(s.actualCheckOutAt) : null,
              rate: toSafeNumber(s.rate, 0),
              status: toSafeString(s.status, 'Active'),
              folioId: s.folioId ? String(s.folioId) : null,
              updatedAt: new Date(),
            };
          })
          .filter(Boolean) as any[];

        if (stayRows.length > 0) {
          await db
            .insert(pmsStays)
            .values(stayRows)
            .onConflictDoUpdate({
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
                updatedAt: sql`excluded.updated_at`,
              },
            });
        }
      } catch (err: any) {
        console.warn('Stays relational sync notice:', err?.message);
      }
    }

    // 4. Sync Folios with deduplication, null-safety, and batch upsert
    if (Array.isArray(fullState.folios) && fullState.folios.length > 0) {
      try {
        const uniqueFolios = deduplicate(fullState.folios, (f) => toSafeString(f.id));
        totalEntitiesCount += uniqueFolios.length;
        const folioRows = uniqueFolios
          .map((f) => {
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
              guestName: toSafeString(f.guestName, 'Guest'),
              roomNumber: toSafeString(f.roomNumber, 'N/A'),
              subtotal,
              taxTotal,
              serviceChargeTotal,
              grandTotal,
              paidTotal,
              balance: toSafeNumber(f.balance, grandTotal - paidTotal),
              status: toSafeString(f.status, 'Open'),
              items: Array.isArray(f.items) ? f.items : [],
              updatedAt: new Date(),
            };
          })
          .filter(Boolean) as any[];

        if (folioRows.length > 0) {
          await db
            .insert(pmsFolios)
            .values(folioRows)
            .onConflictDoUpdate({
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
                updatedAt: sql`excluded.updated_at`,
              },
            });
        }
      } catch (err: any) {
        console.warn('Folios relational sync notice:', err?.message);
      }
    }

    // 5. Sync Payments with deduplication & batch upsert
    if (Array.isArray(fullState.payments) && fullState.payments.length > 0) {
      try {
        const uniquePayments = deduplicate(fullState.payments, (p) => toSafeString(p.id));
        const paymentRows = uniquePayments
          .map((p) => {
            const paymentId = toSafeString(p.id);
            if (!paymentId) return null;
            let reference = p.reference || p.referenceNumber || null;
            if (!reference || reference === 'Payment' || reference === 'Deposit') {
              if (p.transactionNo || p.traceNo) {
                reference = [
                  p.transactionNo ? `Txn: ${p.transactionNo}` : '',
                  p.traceNo ? `Trace: ${p.traceNo}` : '',
                ]
                  .filter(Boolean)
                  .join(' | ');
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
              method: toSafeString(p.method || p.paymentMethod, 'Cash'),
              reference,
              status: toSafeString(p.status, 'Completed'),
              createdBy: toSafeString(p.createdBy || p.receivedBy, 'System'),
              createdAt: p.createdAt ? String(p.createdAt) : new Date().toISOString(),
              syncedAt: new Date(),
            };
          })
          .filter(Boolean) as any[];

        if (paymentRows.length > 0) {
          await db
            .insert(pmsPayments)
            .values(paymentRows)
            .onConflictDoUpdate({
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
                syncedAt: sql`excluded.synced_at`,
              },
            });
        }
      } catch (err: any) {
        console.warn('Payments relational sync notice:', err?.message);
      }
    }

    // 6. Sync Event Bookings with deduplication & batch upsert
    if (Array.isArray(fullState.eventBookings) && fullState.eventBookings.length > 0) {
      try {
        const uniqueEvents = deduplicate(fullState.eventBookings, (e) => toSafeString(e.id));
        totalEntitiesCount += uniqueEvents.length;
        const eventRows = uniqueEvents
          .map((e) => {
            const eventId = toSafeString(e.id);
            if (!eventId) return null;
            const total = toSafeNumber(e.total || e.totalAmount, 0);
            return {
              id: eventId,
              eventNumber: toSafeString(e.eventNumber, `EVT-${eventId}`),
              clientName: toSafeString(e.clientName, 'Client'),
              hallName: toSafeString(e.hallName, 'Hall'),
              eventName: toSafeString(e.eventName, 'Event'),
              eventType: toSafeString(e.eventType, 'Corporate'),
              eventDate: toSafeString(e.eventDate, '2026-08-31'),
              total,
              balance: toSafeNumber(e.balance, total),
              status: toSafeString(e.status, 'Confirmed'),
              updatedAt: new Date(),
            };
          })
          .filter(Boolean) as any[];

        if (eventRows.length > 0) {
          await db
            .insert(pmsEventBookings)
            .values(eventRows)
            .onConflictDoUpdate({
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
                updatedAt: sql`excluded.updated_at`,
              },
            });
        }
      } catch (err: any) {
        console.warn('Event bookings relational sync notice:', err?.message);
      }
    }

    // 7. Sync General Ledger Accounts with deduplication & batch upsert
    if (Array.isArray(fullState.glAccounts) && fullState.glAccounts.length > 0) {
      try {
        const uniqueGl = deduplicate(fullState.glAccounts, (gl) => toSafeString(gl.code || gl.id));
        totalEntitiesCount += uniqueGl.length;
        const glRows = uniqueGl
          .map((gl) => {
            const glCode = toSafeString(gl.code);
            if (!glCode) return null;
            return {
              id: `gl-${glCode}`,
              code: glCode,
              name: toSafeString(gl.name, 'GL Account'),
              category: toSafeString(gl.category, 'Revenue'),
              accountType: toSafeString(gl.accountType || gl.type, 'Balance Sheet'),
              balance: toSafeNumber(gl.balance, 0),
              isActive: gl.isActive !== false,
              updatedAt: new Date(),
            };
          })
          .filter(Boolean) as any[];

        if (glRows.length > 0) {
          await db
            .insert(pmsGlAccounts)
            .values(glRows)
            .onConflictDoUpdate({
              target: pmsGlAccounts.code,
              set: {
                name: sql`excluded.name`,
                category: sql`excluded.category`,
                accountType: sql`excluded.account_type`,
                balance: sql`excluded.balance`,
                isActive: sql`excluded.is_active`,
                updatedAt: sql`excluded.updated_at`,
              },
            });
        }
      } catch (err: any) {
        console.warn('GL accounts relational sync notice:', err?.message);
      }
    }

    // 8. Sync Journal Vouchers with deduplication & batch upsert
    if (Array.isArray(fullState.journalVouchers) && fullState.journalVouchers.length > 0) {
      try {
        const uniqueJv = deduplicate(fullState.journalVouchers, (jv) => toSafeString(jv.voucherNumber || jv.id));
        totalEntitiesCount += uniqueJv.length;
        const jvRows = uniqueJv
          .map((jv) => {
            const voucherNum = toSafeString(jv.voucherNumber || jv.id, `JV-${Date.now()}`);
            if (!voucherNum) return null;
            const lines = Array.isArray(jv.lines) ? jv.lines : (Array.isArray(jv.entries) ? jv.entries : []);
            return {
              id: `jv-${voucherNum}`,
              voucherNumber: voucherNum,
              voucherDate: toSafeString(jv.voucherDate || jv.date, '2026-08-31'),
              reference: jv.reference || jv.sourceReference || null,
              narration: toSafeString(jv.narration, 'Journal Entry'),
              totalDebit: toSafeNumber(jv.totalDebit, 0),
              totalCredit: toSafeNumber(jv.totalCredit, 0),
              status: toSafeString(jv.status, 'Posted'),
              lines,
              createdAt: jv.createdAt ? new Date(jv.createdAt) : new Date(),
            };
          })
          .filter(Boolean) as any[];

        if (jvRows.length > 0) {
          await db
            .insert(pmsJournalVouchers)
            .values(jvRows)
            .onConflictDoUpdate({
              target: pmsJournalVouchers.voucherNumber,
              set: {
                voucherDate: sql`excluded.voucher_date`,
                reference: sql`excluded.reference`,
                narration: sql`excluded.narration`,
                totalDebit: sql`excluded.total_debit`,
                totalCredit: sql`excluded.total_credit`,
                status: sql`excluded.status`,
                lines: sql`excluded.lines`,
              },
            });
        }
      } catch (err: any) {
        console.warn('Journal vouchers relational sync notice:', err?.message);
      }
    }

    // 9. Sync Invoices with deduplication & batch upsert
    if (Array.isArray(fullState.invoices) && fullState.invoices.length > 0) {
      try {
        const validInvoices = deduplicate(fullState.invoices, (i) => toSafeString(i.invoiceNumber || i.id));
        totalEntitiesCount += validInvoices.length;
        const invRows = validInvoices
          .map((inv) => {
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
              status: toSafeString(inv.status, 'Issued'),
              invoiceDate: toSafeString(inv.invoiceDate || inv.date, new Date().toISOString().split('T')[0]),
              dueDate: toSafeString(inv.dueDate) || null,
              paymentMethod: toSafeString(inv.paymentMethod) || null,
              items: inv.items || [],
              createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date(),
            };
          })
          .filter(Boolean) as any[];

        if (invRows.length > 0) {
          await db
            .insert(pmsInvoices)
            .values(invRows)
            .onConflictDoUpdate({
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
                items: sql`excluded.items`,
              },
            });
        }
      } catch (err: any) {
        console.warn('Invoices relational sync notice:', err?.message);
      }
    }

    // 10. Sync City Ledger Accounts (AR) with batch upsert
    if (Array.isArray(fullState.cityLedgerAccounts) && fullState.cityLedgerAccounts.length > 0) {
      try {
        const validCl = deduplicate(fullState.cityLedgerAccounts, (c) => toSafeString(c.accountNumber || c.id));
        totalEntitiesCount += validCl.length;
        const clRows = validCl
          .map((cl) => {
            const accNum = toSafeString(cl.accountNumber, cl.id || `CL-${Date.now()}`);
            if (!accNum) return null;
            return {
              id: `cl-${accNum}`,
              accountNumber: accNum,
              companyName: toSafeString(cl.companyName, 'Corporate Client'),
              contactPerson: toSafeString(cl.contactPerson) || null,
              phone: toSafeString(cl.phone) || null,
              email: toSafeString(cl.email) || null,
              creditLimit: toSafeNumber(cl.creditLimit),
              currentBalance: toSafeNumber(cl.currentBalance),
              paymentTerms: toSafeString(cl.paymentTerms, 'Net 30'),
              status: toSafeString(cl.status, 'Active'),
              notes: toSafeString(cl.notes) || null,
              updatedAt: new Date(),
            };
          })
          .filter(Boolean) as any[];

        if (clRows.length > 0) {
          await db
            .insert(pmsCityLedger)
            .values(clRows)
            .onConflictDoUpdate({
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
                updatedAt: sql`excluded.updated_at`,
              },
            });
        }
      } catch (err: any) {
        console.warn('City ledger relational sync notice:', err?.message);
      }
    }

    // 11. Sync Suppliers (AP Vendors) with batch upsert
    if (Array.isArray(fullState.suppliers) && fullState.suppliers.length > 0) {
      try {
        const validSuppliers = deduplicate(fullState.suppliers, (s) => toSafeString(s.code || s.id));
        totalEntitiesCount += validSuppliers.length;
        const supRows = validSuppliers
          .map((sup) => {
            const code = toSafeString(sup.code, sup.id || `SUP-${Date.now()}`);
            if (!code) return null;
            return {
              id: `sup-${code}`,
              name: toSafeString(sup.name, 'Vendor'),
              code,
              contactPerson: toSafeString(sup.contactPerson) || null,
              phone: toSafeString(sup.phone) || null,
              email: toSafeString(sup.email) || null,
              category: toSafeString(sup.category) || null,
              paymentTerms: toSafeString(sup.paymentTerms, 'Net 30'),
              currentBalance: toSafeNumber(sup.currentBalance),
              bankDetails: sup.bankDetails || null,
              status: toSafeString(sup.status, 'Active'),
              updatedAt: new Date(),
            };
          })
          .filter(Boolean) as any[];

        if (supRows.length > 0) {
          await db
            .insert(pmsSuppliers)
            .values(supRows)
            .onConflictDoUpdate({
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
                updatedAt: sql`excluded.updated_at`,
              },
            });
        }
      } catch (err: any) {
        console.warn('Suppliers relational sync notice:', err?.message);
      }
    }

    // 12. Sync Purchase Bills (AP Bills) with batch upsert
    if (Array.isArray(fullState.purchaseBills) && fullState.purchaseBills.length > 0) {
      try {
        const validBills = deduplicate(fullState.purchaseBills, (b) => toSafeString(b.billNumber || b.id));
        totalEntitiesCount += validBills.length;
        const billRows = validBills
          .map((bill) => {
            const billNumber = toSafeString(bill.billNumber, bill.id || `BILL-${Date.now()}`);
            if (!billNumber) return null;
            const totalAmount = toSafeNumber(bill.totalAmount || bill.grandTotal);
            const paidAmount = toSafeNumber(bill.paidAmount || bill.paidTotal);
            return {
              id: `pb-${billNumber}`,
              billNumber,
              supplierId: toSafeString(bill.supplierId, 'sup-default'),
              supplierName: toSafeString(bill.supplierName, 'Vendor'),
              billDate: toSafeString(bill.billDate || bill.date, new Date().toISOString().split('T')[0]),
              dueDate: toSafeString(bill.dueDate) || null,
              totalAmount,
              paidAmount,
              balance: toSafeNumber(bill.balance, totalAmount - paidAmount),
              status: toSafeString(bill.status, 'Open'),
              items: bill.items || [],
              journalVoucherId: toSafeString(bill.journalVoucherId) || null,
              createdAt: new Date(),
            };
          })
          .filter(Boolean) as any[];

        if (billRows.length > 0) {
          await db
            .insert(pmsPurchaseBills)
            .values(billRows)
            .onConflictDoUpdate({
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
                journalVoucherId: sql`excluded.journal_voucher_id`,
              },
            });
        }
      } catch (err: any) {
        console.warn('Purchase bills relational sync notice:', err?.message);
      }
    }

    // 13. Sync Supplier Payments (AP Disbursements) with batch upsert
    if (Array.isArray(fullState.supplierPayments) && fullState.supplierPayments.length > 0) {
      try {
        const validPayments = deduplicate(fullState.supplierPayments, (p) => toSafeString(p.paymentNumber || p.id));
        totalEntitiesCount += validPayments.length;
        const spRows = validPayments
          .map((sp) => {
            const paymentNumber = toSafeString(sp.paymentNumber, sp.id || `SPAY-${Date.now()}`);
            if (!paymentNumber) return null;
            return {
              id: `sp-${paymentNumber}`,
              paymentNumber,
              supplierId: toSafeString(sp.supplierId, 'sup-default'),
              supplierName: toSafeString(sp.supplierName, 'Vendor'),
              billId: toSafeString(sp.billId) || null,
              amount: toSafeNumber(sp.amount),
              paymentDate: toSafeString(sp.paymentDate || sp.date, new Date().toISOString().split('T')[0]),
              paymentMethod: toSafeString(sp.paymentMethod, 'Bank Transfer'),
              bankAccount: toSafeString(sp.bankAccount) || null,
              referenceNumber: toSafeString(sp.referenceNumber) || null,
              status: toSafeString(sp.status, 'Completed'),
              notes: toSafeString(sp.notes) || null,
              createdAt: new Date(),
            };
          })
          .filter(Boolean) as any[];

        if (spRows.length > 0) {
          await db
            .insert(pmsSupplierPayments)
            .values(spRows)
            .onConflictDoUpdate({
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
                notes: sql`excluded.notes`,
              },
            });
        }
      } catch (err: any) {
        console.warn('Supplier payments relational sync notice:', err?.message);
      }
    }

    // 14. Sync Restaurant Orders (POS) with batch upsert
    if (Array.isArray(fullState.restaurantOrders) && fullState.restaurantOrders.length > 0) {
      try {
        const validOrders = deduplicate(fullState.restaurantOrders, (o) => toSafeString(o.orderNumber || o.id));
        totalEntitiesCount += validOrders.length;
        const ordRows = validOrders
          .map((ord) => {
            const orderNumber = toSafeString(ord.orderNumber, ord.id || `ORD-${Date.now()}`);
            if (!orderNumber) return null;
            return {
              id: `ord-${orderNumber}`,
              orderNumber,
              orderType: toSafeString(ord.orderType, 'Dine-In'),
              tableNumber: toSafeString(ord.tableNumber) || null,
              roomNumber: toSafeString(ord.roomNumber) || null,
              guestName: toSafeString(ord.guestName) || null,
              subtotal: toSafeNumber(ord.subtotal),
              tax: toSafeNumber(ord.tax),
              serviceCharge: toSafeNumber(ord.serviceCharge),
              total: toSafeNumber(ord.total),
              paymentStatus: toSafeString(ord.paymentStatus, 'Paid'),
              paymentMethod: toSafeString(ord.paymentMethod) || null,
              items: ord.items || [],
              createdAt: new Date(),
            };
          })
          .filter(Boolean) as any[];

        if (ordRows.length > 0) {
          await db
            .insert(pmsRestaurantOrders)
            .values(ordRows)
            .onConflictDoUpdate({
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
                items: sql`excluded.items`,
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
      region: 'Supabase Cloud',
    };
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (msg.includes('authentication failed') || msg.includes('ECONNREFUSED') || msg.includes('57P01')) {
      markPostgresAuthFailed();
    }
    const sbUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://cvviwipdglcajldmzbvc.supabase.co').replace(/\/rest\/v1\/?$/i, '').trim();
    const sbKey = getSupabaseServerKey();
    if (sbUrl && sbKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(sbUrl, sbKey);
        await sb.from('pms_snapshots').upsert({
          snapshot_key: 'current_pms_state',
          resort_name: fullState.resortName || 'Heritage Resort & Spa',
          business_date: fullState.businessDate || '2026-08-31',
          state_payload: fullState,
          version: 1,
          synced_by: syncedBy,
          total_entities: totalEntitiesCount,
          last_synced_at: new Date().toISOString(),
        }, { onConflict: 'snapshot_key' });
        return {
          success: true,
          version: 1,
          totalEntities: totalEntitiesCount,
          timestamp: new Date().toISOString(),
          region: 'Supabase Cloud (REST Fallback)',
        };
      } catch (restErr: any) {
        console.warn('REST fallback notice:', restErr?.message || restErr);
      }
    }
    return {
      success: true,
      version: 1,
      totalEntities: totalEntitiesCount,
      timestamp: new Date().toISOString(),
      region: 'Local State Mirror (PostgreSQL offline)',
      localOnly: true,
    };
  }
}

export async function loadLatestPmsSnapshot() {
  if (!isPostgresConfigured()) {
    const sbUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://cvviwipdglcajldmzbvc.supabase.co').replace(/\/rest\/v1\/?$/i, '').trim();
    const sbKey = getSupabaseServerKey();
    if (sbUrl && sbKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(sbUrl, sbKey);
        const { data, error } = await sb
          .from('pms_snapshots')
          .select('snapshot_key, version, resort_name, business_date, total_entities, last_synced_at, state_payload')
          .eq('snapshot_key', 'current_pms_state')
          .maybeSingle();

        if (!error && data && data.state_payload) {
          return {
            version: data.version || 1,
            resortName: data.resort_name,
            businessDate: data.business_date,
            totalEntities: data.total_entities,
            lastSyncedAt: data.last_synced_at,
            state: data.state_payload,
            pmsState: data.state_payload,
          };
        }
      } catch (err: any) {
        console.warn('Supabase REST loadLatestPmsSnapshot notice:', err?.message || err);
      }
    }
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
      pmsState: snapshot.statePayload,
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

    // If this is a direct DELETE action, also remove the matching entity from its relational table
    if (action.toUpperCase() === 'DELETE') {
      try {
        const lowerType = entityType.toLowerCase();
        if (lowerType.includes('room')) {
          await db.delete(pmsRooms).where(or(eq(pmsRooms.id, entityId), eq(pmsRooms.roomNumber, entityId)));
        } else if (lowerType.includes('reservation')) {
          await db.delete(pmsReservations).where(or(eq(pmsReservations.id, entityId), eq(pmsReservations.reservationNumber, entityId)));
        } else if (lowerType.includes('stay')) {
          await db.delete(pmsStays).where(eq(pmsStays.id, entityId));
        } else if (lowerType.includes('folio')) {
          await db.delete(pmsFolios).where(eq(pmsFolios.id, entityId));
        }
      } catch (delErr) {
        console.warn('Relational DELETE cleanup notice:', delErr);
      }
    }

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
