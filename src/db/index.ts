import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

// Add global connection pool caching to persist across hot-reloads and serverless invocations
declare global {
  var _postgresPool: pg.Pool | undefined;
}

let _dynamicConnectionString: string | null = null;

export const setDynamicConnectionString = (cs: string | null): void => {
  _dynamicConnectionString = cs;
  if (global._postgresPool) {
    global._postgresPool.end().catch(() => {});
    global._postgresPool = undefined;
  }
};

export const isPostgresConfigured = (): boolean => {
  if (_dynamicConnectionString && _dynamicConnectionString.trim().length > 0) return true;
  const cs =
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.SUPABASE_POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.PG_URL;
  if (cs && cs.trim().length > 0) return true;

  const host = process.env.SUPABASE_HOST || process.env.POSTGRES_HOST || process.env.PGHOST || process.env.SQL_HOST;
  const user = process.env.SUPABASE_USER || process.env.POSTGRES_USER || process.env.PGUSER || process.env.SQL_USER;
  const db = process.env.SUPABASE_DATABASE || process.env.POSTGRES_DATABASE || process.env.PGDATABASE || process.env.SQL_DB_NAME;
  return Boolean(host && user && db);
};

export const getDatabaseConnectionString = (): string | undefined => {
  if (_dynamicConnectionString && _dynamicConnectionString.trim().length > 0) {
    return _dynamicConnectionString;
  }
  return (
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.SUPABASE_POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.PG_URL
  );
};

// Function to create or retrieve the connection pool.
export const createPool = (): pg.Pool => {
  if (!global._postgresPool) {
    const connectionString = getDatabaseConnectionString();
    const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

    let poolConfig: pg.PoolConfig;

    if (connectionString) {
      const isLocal =
        connectionString.includes('localhost') ||
        connectionString.includes('127.0.0.1') ||
        connectionString.includes('sslmode=disable');
      poolConfig = {
        connectionString,
        ssl: isLocal ? false : { rejectUnauthorized: false },
        max: isVercel ? 5 : 15,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 8000,
      };
    } else {
      const host = process.env.POSTGRES_HOST || process.env.PGHOST || process.env.SQL_HOST || 'localhost';
      const user = process.env.POSTGRES_USER || process.env.PGUSER || process.env.SQL_USER || 'postgres';
      const password = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || process.env.SQL_PASSWORD || '';
      const database = process.env.POSTGRES_DATABASE || process.env.PGDATABASE || process.env.SQL_DB_NAME || 'postgres';
      const port = Number(process.env.POSTGRES_PORT || process.env.PGPORT || 5432);
      const isUnixSocket = typeof host === 'string' && host.startsWith('/');
      const isLocal = host === 'localhost' || host === '127.0.0.1' || isUnixSocket;

      poolConfig = {
        host,
        user,
        password,
        database,
        port,
        ssl: isLocal ? false : { rejectUnauthorized: false },
        max: isVercel ? 5 : 15,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 8000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
      };
    }

    global._postgresPool = new Pool(poolConfig);

    // Prevent unhandled pool-level errors from crashing the application.
    // Cloud SQL and proxies naturally drop idle client sockets after inactivity.
    global._postgresPool.on('error', (err: any) => {
      if (
        err?.message?.includes('Connection terminated unexpectedly') ||
        err?.code === 'ECONNRESET' ||
        err?.code === '57P01'
      ) {
        console.warn('Postgres pool: idle connection dropped by server/proxy; will reconnect on next query.');
      } else {
        console.error('Unexpected error on idle SQL pool client:', err?.message || err);
      }
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
export const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
