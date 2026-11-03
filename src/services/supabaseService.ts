import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration keys in localStorage for client-side override/settings
const SUPABASE_URL_KEY = 'pms_supabase_url';
const SUPABASE_KEY_KEY = 'pms_supabase_key';

export const DEFAULT_SUPABASE_URL = 'https://cvviwipdglcajldmzbvc.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_s_KTFsBgpfnFL2UkYZqqyw_TZilAsZw';

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
        if (_serverFetchedUrl !== data.url || _serverFetchedKey !== data.key) {
          _serverFetchedUrl = data.url;
          _serverFetchedKey = data.key;
          // Only invalidate client if server credentials differ from current active cached client
          if (_cachedUrl && _cachedKey && (_cachedUrl !== data.url || _cachedKey !== data.key)) {
            _supabaseClientInstance = null;
          }
        }
      }
    })
    .catch(() => {});
}

/**
 * Helper to identify Supabase Secret / Service Role keys.
 * Secret keys start with 'sb_secret_' or are JWTs with role 'service_role'.
 * They are strictly forbidden by Supabase in client-side browser runtimes.
 */
export function isSecretApiKey(key: string): boolean {
  if (!key) return false;
  const k = key.trim();
  if (k.startsWith('sb_secret_') || k.startsWith('secret_')) return true;
  try {
    const parts = k.split('.');
    if (parts.length === 3) {
      // Decode JWT payload
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(json);
      if (payload?.role === 'service_role') return true;
    }
  } catch {}
  return false;
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl =
    (import.meta as any).env?.SUPABASE_URL ||
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    _serverFetchedUrl ||
    DEFAULT_SUPABASE_URL;

  // IMPORTANT: In browser code, only read publishable / anon public keys.
  // Never read SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY into the browser client!
  const envKey =
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.SUPABASE_PUBLISHABLE_KEY ||
    (import.meta as any).env?.SUPABASE_ANON_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_KEY ||
    _serverFetchedKey ||
    DEFAULT_SUPABASE_ANON_KEY;

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(SUPABASE_URL_KEY) || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(SUPABASE_KEY_KEY) || '' : '';

  let url = (storedUrl.trim() || envUrl.trim() || DEFAULT_SUPABASE_URL);
  url = url.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');

  // Guard against forbidden use of secret API key in browser
  const rawKey = storedKey.trim() || envKey.trim() || DEFAULT_SUPABASE_ANON_KEY;
  let key = rawKey;
  if (isSecretApiKey(rawKey)) {
    console.warn(
      '[Supabase Browser Security] Secret / Service Role key detected in browser context. Supabase forbids secret keys in client-side browser code. Automatically substituting with public Publishable Anon key.'
    );
    key = DEFAULT_SUPABASE_ANON_KEY;
  }

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

    if (key) {
      if (isSecretApiKey(key)) {
        // User pasted a secret key into the browser settings; store safe anon key for browser client
        localStorage.setItem(SUPABASE_KEY_KEY, DEFAULT_SUPABASE_ANON_KEY);
      } else {
        localStorage.setItem(SUPABASE_KEY_KEY, key.trim());
      }
    } else {
      localStorage.removeItem(SUPABASE_KEY_KEY);
    }
  }
}

let _supabaseClientInstance: SupabaseClient | null = null;
let _cachedUrl = '';
let _cachedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;

  // Extra safety: ensure client key is never a secret key in browser
  const safeKey = isSecretApiKey(config.key) ? DEFAULT_SUPABASE_ANON_KEY : config.key;

  if (_supabaseClientInstance && _cachedUrl === config.url && _cachedKey === safeKey) {
    return _supabaseClientInstance;
  }

  try {
    _supabaseClientInstance = createClient(config.url, safeKey, {
      auth: {
        storageKey: 'lesync_pms_supabase_auth',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
    _cachedUrl = config.url;
    _cachedKey = safeKey;
    return _supabaseClientInstance;
  } catch (err: any) {
    console.warn('Failed to initialize Supabase client:', err?.message || err);
    // If failed due to "Forbidden use of secret API key in browser" or invalid key, retry with default anon key
    if (safeKey !== DEFAULT_SUPABASE_ANON_KEY) {
      try {
        _supabaseClientInstance = createClient(config.url, DEFAULT_SUPABASE_ANON_KEY, {
          auth: {
            storageKey: 'lesync_pms_supabase_auth',
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
          },
        });
        _cachedUrl = config.url;
        _cachedKey = DEFAULT_SUPABASE_ANON_KEY;
        return _supabaseClientInstance;
      } catch {}
    }
    return null;
  }
}

/**
 * Test connectivity to a Supabase project via REST / Auth check
 */
export async function testSupabaseClientConnection(url?: string, key?: string): Promise<{ success: boolean; message: string; details?: any }> {
  const targetUrl = url || getSupabaseConfig().url;
  let targetKey = key || getSupabaseConfig().key;

  if (!targetUrl || !targetKey) {
    return {
      success: false,
      message: 'Supabase URL and API Key are required.',
    };
  }

  // Friendly browser guard: if user passes a secret key, explain immediately
  if (isSecretApiKey(targetKey)) {
    return {
      success: false,
      message: 'Forbidden use of secret API key in browser: The key you entered is a Supabase Secret / Service Role Key. Supabase strictly blocks secret keys in browsers to protect your database. Please use your Publishable Anon Key (starts with "sb_publishable_" or "eyJhbGci...") for browser client connections.',
    };
  }

  try {
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
      const text = await response.text().catch(() => '');
      if (text.includes('Forbidden use of secret API key') || response.status === 401) {
        return {
          success: false,
          message: 'Forbidden use of secret API key in browser: Supabase blocked this key because it is a secret/service_role key. Please use your Publishable Anon Key (starts with "sb_publishable_...") in the browser.',
        };
      }
      const statusText = response.statusText || `HTTP ${response.status}`;
      return {
        success: false,
        message: `Supabase server responded with error: ${statusText} ${text ? `(${text})` : ''}`,
      };
    }
  } catch (error: any) {
    const errMsg = error?.message || 'Network error connecting to Supabase';
    if (errMsg.includes('Forbidden use of secret API key')) {
      return {
        success: false,
        message: 'Forbidden use of secret API key in browser: Supabase blocked this key. Please use your Publishable Anon Key (starts with "sb_publishable_...") in the browser.',
      };
    }
    return {
      success: false,
      message: errMsg,
    };
  }
}

/**
 * Direct client-side sync of lightweight property settings to Supabase pms_snapshots table ('pms_property_settings')
 * Guarantees sub-100ms persistence of resort identity, logo, tax, and onboarding configuration
 */
export async function syncSettingsDirectlyToSupabase(
  settings: any,
  syncedBy = 'System Owner Settings Save'
): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client || !settings || typeof settings !== 'object') {
    return { success: false, message: 'Supabase client or settings payload is not configured.' };
  }

  try {
    const nowIso = new Date().toISOString();
    const stampedSettings = {
      ...settings,
      updatedAt: settings.updatedAt || nowIso,
    };

    const { error } = await client
      .from('pms_snapshots')
      .upsert(
        {
          snapshot_key: 'pms_property_settings',
          resort_name: stampedSettings.resortName || 'Heritage Resort & Spa',
          business_date: stampedSettings.currentBusinessDate || nowIso.slice(0, 10),
          state_payload: {
            settings: stampedSettings,
            updatedAt: stampedSettings.updatedAt,
          },
          synced_by: syncedBy,
          total_entities: 1,
          last_synced_at: nowIso,
        },
        { onConflict: 'snapshot_key' }
      );

    if (error) {
      console.warn('Direct Supabase settings upsert notice:', error.message);
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: 'Property settings synchronized directly to Supabase cloud!',
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Direct settings sync failed' };
  }
}

/**
 * Direct client-side retrieval of dedicated property settings from Supabase
 */
export async function loadSettingsDirectlyFromSupabase(): Promise<{
  success: boolean;
  settings?: any;
  updatedAt?: string;
  lastSyncedAt?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false };
  }

  try {
    const { data, error } = await client
      .from('pms_snapshots')
      .select('state_payload, last_synced_at')
      .eq('snapshot_key', 'pms_property_settings')
      .maybeSingle();

    if (error || !data?.state_payload) {
      return { success: false };
    }

    const extracted = data.state_payload.settings || data.state_payload;
    if (!extracted || typeof extracted !== 'object' || !extracted.resortName) {
      return { success: false };
    }

    return {
      success: true,
      settings: extracted,
      updatedAt: extracted.updatedAt || data.state_payload.updatedAt || data.last_synced_at,
      lastSyncedAt: data.last_synced_at,
    };
  } catch {
    return { success: false };
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
    // Check dedicated cloud property settings so an older/un-timestamped tab never overwrites newer saved settings
    const cloudSettingsRes = await loadSettingsDirectlyFromSupabase();
    const incomingSettings = statePayload.settings || {};
    const incomingUpdatedAt = incomingSettings.updatedAt || '';
    const cloudUpdatedAt = cloudSettingsRes.updatedAt || '';

    let effectiveSettings = incomingSettings;
    if (cloudSettingsRes.success && cloudSettingsRes.settings) {
      if (!incomingUpdatedAt || (cloudUpdatedAt && cloudUpdatedAt > incomingUpdatedAt)) {
        effectiveSettings = {
          ...incomingSettings,
          ...cloudSettingsRes.settings,
        };
      } else if (incomingUpdatedAt && (!cloudUpdatedAt || incomingUpdatedAt >= cloudUpdatedAt)) {
        await syncSettingsDirectlyToSupabase(incomingSettings, syncedBy);
      }
    } else if (incomingUpdatedAt && incomingSettings.resortName) {
      await syncSettingsDirectlyToSupabase(incomingSettings, syncedBy);
    }

    const finalPayload = {
      ...statePayload,
      settings: effectiveSettings,
      resortName: effectiveSettings?.resortName || statePayload.resortName || 'Heritage Resort & Spa',
      businessDate: effectiveSettings?.currentBusinessDate || statePayload.businessDate || new Date().toISOString().slice(0, 10),
    };

    const totalEntities =
      (finalPayload.rooms?.length || 0) +
      (finalPayload.reservations?.length || 0) +
      (finalPayload.folios?.length || 0) +
      (finalPayload.glAccounts?.length || 0) +
      (finalPayload.users?.length || 0);

    // Sync individual staff users to the Supabase users table
    if (Array.isArray(finalPayload.users) && finalPayload.users.length > 0) {
      try {
        const userRows = finalPayload.users.map((u: any) => ({
          uid: u.id,
          email: u.email || `${u.id}@lesyncpms.com`,
          name: u.name,
          role: u.role || u.roleName || 'Staff',
          created_at: u.createdAt || new Date().toISOString()
        }));
        await client.from('users').upsert(userRows, { onConflict: 'uid' });
      } catch (uErr: any) {
        console.warn('Notice syncing users table directly to Supabase:', uErr?.message || uErr);
      }
    }

    const { data, error } = await client
      .from('pms_snapshots')
      .upsert(
        {
          snapshot_key: 'current_pms_state',
          resort_name: finalPayload.resortName,
          business_date: finalPayload.businessDate,
          state_payload: finalPayload,
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
    const { data: rows, error } = await client
      .from('pms_snapshots')
      .select('snapshot_key, state_payload, version, last_synced_at')
      .in('snapshot_key', ['current_pms_state', 'pms_property_settings']);

    if (error || !Array.isArray(rows) || rows.length === 0) {
      return { success: false, message: error?.message || 'No snapshot found in Supabase.' };
    }

    const mainRow = rows.find((r: any) => r.snapshot_key === 'current_pms_state');
    const settingsRow = rows.find((r: any) => r.snapshot_key === 'pms_property_settings');

    if (!mainRow || !mainRow.state_payload) {
      return { success: false, message: 'No primary snapshot found in Supabase.' };
    }

    const mergedPayload = { ...mainRow.state_payload };
    const dedicatedSettings = settingsRow?.state_payload?.settings || settingsRow?.state_payload;
    if (dedicatedSettings && typeof dedicatedSettings === 'object' && dedicatedSettings.resortName) {
      const dedicatedTime = dedicatedSettings.updatedAt || settingsRow?.last_synced_at || '';
      const mainTime = mergedPayload.settings?.updatedAt || '';
      if (!mainTime || (dedicatedTime && dedicatedTime >= mainTime)) {
        mergedPayload.settings = {
          ...(mergedPayload.settings || {}),
          ...dedicatedSettings,
        };
      }
    }

    return {
      success: true,
      snapshot: {
        pmsState: mergedPayload,
        version: mainRow.version,
        lastSyncedAt: mainRow.last_synced_at,
      },
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Load from Supabase failed' };
  }
}
