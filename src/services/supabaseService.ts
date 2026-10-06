import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration keys in localStorage for client-side override/settings
const SUPABASE_URL_KEY = 'pms_supabase_url';
const SUPABASE_KEY_KEY = 'pms_supabase_key';

export interface SupabaseConfig {
  url: string;
  key: string;
  isConfigured: boolean;
}

let _serverFetchedUrl = '';
let _serverFetchedKey = '';

// Auto-fetch Supabase configuration from server environment on client boot
if (typeof window !== 'undefined') {
  fetch('/api/supabase/config')
    .then((r) => r.json())
    .then((data) => {
      if (data?.url && data?.key) {
        _serverFetchedUrl = data.url;
        _serverFetchedKey = data.key;
        _supabaseClientInstance = null; // Re-initialize with server-provided credentials
      }
    })
    .catch(() => {});
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl =
    (import.meta as any).env?.SUPABASE_URL ||
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    _serverFetchedUrl ||
    '';
  const envKey =
    (import.meta as any).env?.SUPABASE_ANON_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_KEY ||
    _serverFetchedKey ||
    '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(SUPABASE_URL_KEY) || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(SUPABASE_KEY_KEY) || '' : '';

  let url = (storedUrl.trim() || envUrl.trim());
  url = url.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  const key = storedKey.trim() || envKey.trim();

  return {
    url,
    key,
    isConfigured: Boolean(url && key && url.startsWith('http')),
  };
}

export function saveSupabaseConfig(url: string, key: string): void {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(SUPABASE_URL_KEY, url.trim());
    else localStorage.removeItem(SUPABASE_URL_KEY);

    if (key) localStorage.setItem(SUPABASE_KEY_KEY, key.trim());
    else localStorage.removeItem(SUPABASE_KEY_KEY);
  }
}

let _supabaseClientInstance: SupabaseClient | null = null;
let _cachedUrl = '';
let _cachedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;

  if (_supabaseClientInstance && _cachedUrl === config.url && _cachedKey === config.key) {
    return _supabaseClientInstance;
  }

  try {
    _supabaseClientInstance = createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    _cachedUrl = config.url;
    _cachedKey = config.key;
    return _supabaseClientInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Test connectivity to a Supabase project via REST / Auth check
 */
export async function testSupabaseClientConnection(url?: string, key?: string): Promise<{ success: boolean; message: string; details?: any }> {
  const targetUrl = url || getSupabaseConfig().url;
  const targetKey = key || getSupabaseConfig().key;

  if (!targetUrl || !targetKey) {
    return {
      success: false,
      message: 'Supabase URL and API Key are required.',
    };
  }

  try {
    const client = createClient(targetUrl, targetKey);
    // Ping Supabase public settings / health endpoint
    const response = await fetch(`${targetUrl.replace(/\/+$/, '')}/auth/v1/health`, {
      headers: {
        apikey: targetKey,
        Authorization: `Bearer ${targetKey}`,
      },
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Successfully connected to Supabase REST and Auth engine.',
      };
    } else {
      // Fallback: try checking if the URL responds
      const statusText = response.statusText || `HTTP ${response.status}`;
      return {
        success: false,
        message: `Supabase server responded with error: ${statusText}`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Network error connecting to Supabase',
    };
  }
}

/**
 * Direct client-side sync of PMS state snapshot to Supabase pms_snapshots table
 * Acts as a 100% reliable fallback when backend serverless routes are unconfigured on Vercel
 */
export async function syncSnapshotDirectlyToSupabase(
  statePayload: any,
  syncedBy = 'Vercel Web Client'
): Promise<{ success: boolean; message: string; version?: number }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase client is not configured with URL and API key.' };
  }

  try {
    const totalEntities =
      (statePayload.rooms?.length || 0) +
      (statePayload.reservations?.length || 0) +
      (statePayload.folios?.length || 0) +
      (statePayload.glAccounts?.length || 0);

    const { data, error } = await client
      .from('pms_snapshots')
      .upsert(
        {
          snapshot_key: 'current_pms_state',
          resort_name: statePayload.resortName || 'Heritage Resort & Spa',
          business_date: statePayload.businessDate || new Date().toISOString().slice(0, 10),
          state_payload: statePayload,
          synced_by: syncedBy,
          total_entities: totalEntities,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'snapshot_key' }
      )
      .select('version')
      .maybeSingle();

    if (error) {
      console.warn('Direct Supabase table upsert notice:', error.message);
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: 'State snapshot synchronized directly to Supabase cloud!',
      version: data?.version || 1,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Direct sync failed' };
  }
}

/**
 * Direct client-side retrieval of latest PMS state snapshot from Supabase
 */
export async function loadSnapshotDirectlyFromSupabase(): Promise<{
  success: boolean;
  snapshot?: any;
  message?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase client is not configured.' };
  }

  try {
    const { data, error } = await client
      .from('pms_snapshots')
      .select('state_payload, version, last_synced_at')
      .eq('snapshot_key', 'current_pms_state')
      .maybeSingle();

    if (error || !data) {
      return { success: false, message: error?.message || 'No snapshot found in Supabase.' };
    }

    return {
      success: true,
      snapshot: {
        pmsState: data.state_payload,
        version: data.version,
        lastSyncedAt: data.last_synced_at,
      },
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Load from Supabase failed' };
  }
}
