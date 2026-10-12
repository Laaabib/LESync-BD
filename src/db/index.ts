import dotenv from 'dotenv';
dotenv.config({ override: true });

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

// Add global connection pool caching to persist across hot-reloads and serverless invocations
declare global {
  var _postgresPool: pg.Pool | undefined;
}

let _dynamicConnectionString: string | null = null;
let _postgresAuthFailed = false;
let _lastAuthFailureTime = 0;
const AUTH_FAILURE_COOLDOWN_MS = 60000;

export const markPostgresAuthFailed = (): void => {
  _postgresAuthFailed = true;
  _lastAuthFailureTime = Date.now();
};

export const resetPostgresAuthStatus = (): void => {
  _postgresAuthFailed = false;
  _lastAuthFailureTime = 0;
};

export const refreshPool = (): void => {
  resetPostgresAuthStatus();
  if (global._postgresPool) {
    global._postgresPool.end().catch(() => {});
    global._postgresPool = undefined;
  }
};

export const setDynamicConnectionString = (cs: string | null): void => {
  _dynamicConnectionString = cs;
  resetPostgresAuthStatus();
  if (global._postgresPool) {
    global._postgresPool.end().catch(() => {});
    global._postgresPool = undefined;
  }
};

export const isPostgresConfigured = (): boolean => {
  if (_postgresAuthFailed && (Date.now() - _lastAuthFailureTime) < AUTH_FAILURE_COOLDOWN_MS) {
    return false;
  }
  if (_postgresAuthFailed && (Date.now() - _lastAuthFailureTime) >= AUTH_FAILURE_COOLDOWN_MS) {
    _postgresAuthFailed = false;
  }

  if (_dynamicConnectionString && _dynamicConnectionString.trim().length > 0) {
    const cs = _dynamicConnectionString.trim();
    if (cs.startsWith('postgres://') || cs.startsWith('postgresql://')) return true;
  }
  const cs = getDatabaseConnectionString();
  if (cs) return true;

  const host = process.env.POSTGRES_HOST || process.env.PGHOST || process.env.SQL_HOST;
  const user = process.env.POSTGRES_USER || process.env.PGUSER || process.env.SQL_USER;
  const db = process.env.POSTGRES_DATABASE || process.env.PGDATABASE || process.env.SQL_DB_NAME;
  return Boolean(host && user && db && host !== 'localhost' && host !== '127.0.0.1');
};

export const getDatabaseConnectionString = (): string | undefined => {
  if (_dynamicConnectionString && _dynamicConnectionString.trim().length > 0) {
    const cs = _dynamicConnectionString.trim();
    if (cs.startsWith('postgres://') || cs.startsWith('postgresql://')) {
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
    process.env.PG_URL,
  ];
  for (const c of candidates) {
    if (c && typeof c === 'string') {
      const trimmed = c.trim();
      if (trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://')) {
        return trimmed;
      }
    }
  }
  return undefined;
};

export interface ParsedDbConnection {
  user?: string;
  password?: string;
  host?: string;
  port?: number;
  database?: string;
  ssl?: boolean;
}

export function parsePostgresUri(uri: string): ParsedDbConnection | null {
  if (!uri || typeof uri !== 'string') return null;
  const trimmed = uri.trim();
  if (!trimmed.startsWith('postgres://') && !trimmed.startsWith('postgresql://')) return null;

  const match = trimmed.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:/@?]+)(?::(\d+))?\/([^?]+)(?:\?(.*))?$/);
  if (match) {
    const [, user, rawPassword, host, portStr, database] = match;
    let password = rawPassword;
    try {
      if (password.includes('%')) {
        password = decodeURIComponent(password);
      }
    } catch {}
    const port = portStr ? parseInt(portStr, 10) : 5432;
    return {
      user: decodeURIComponent(user),
      password,
      host,
      port,
      database: database.split('?')[0],
      ssl: !host.includes('localhost') && !host.includes('127.0.0.1'),
    };
  }
  return null;
}

// Function to create or retrieve the connection pool.
export const createPool = (): pg.Pool => {
  if (!global._postgresPool) {
    const connectionString = getDatabaseConnectionString();
    const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

    let poolConfig: pg.PoolConfig;

    if (connectionString) {
      const parsed = parsePostgresUri(connectionString);
      if (parsed && parsed.host && parsed.user) {
        poolConfig = {
          host: parsed.host,
          port: parsed.port || 5432,
          user: parsed.user,
          password: parsed.password || '',
          database: parsed.database || 'postgres',
          ssl: parsed.ssl ? { rejectUnauthorized: false } : false,
          max: isVercel ? 5 : 15,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 8000,
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000,
        };
      } else {
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
      }
    } else {
      const host =
        process.env.POSTGRES_HOST ||
        process.env.PGHOST ||
        process.env.SQL_HOST ||
        (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('://') ? process.env.DATABASE_URL.trim() : '');
      const user = process.env.POSTGRES_USER || process.env.PGUSER || process.env.SQL_USER || 'postgres';
      const password = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || process.env.SQL_PASSWORD || '';
      const database = process.env.POSTGRES_DATABASE || process.env.PGDATABASE || process.env.SQL_DB_NAME || 'postgres';
      const port = Number(process.env.POSTGRES_PORT || process.env.PGPORT || 5432);
      const isUnixSocket = typeof host === 'string' && host.startsWith('/');
      const isLocal = host === 'localhost' || host === '127.0.0.1' || isUnixSocket;

      poolConfig = {
        host: host || 'unconfigured.local',
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
    global._postgresPool.on('error', (err: any) => {
      if (
        err?.message?.includes('Connection terminated unexpectedly') ||
        err?.code === 'ECONNRESET' ||
        err?.code === '57P01' ||
        err?.code === 'ECONNREFUSED'
      ) {
        console.warn('Postgres pool: connection notice:', err?.message || err);
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
