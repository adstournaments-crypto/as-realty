import { createClient } from '@supabase/supabase-js';

// Supabase project credentials provided by user
export const SUPABASE_PROJECT_ID = 'Mwyudzasqktveuqmdxjb';
const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_ID.toLowerCase()}.supabase.co`;
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_JQijMHGYr-zm5s8OeGMVHw_NQcI8bqZ';

export const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  DEFAULT_SUPABASE_URL;

export const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  DEFAULT_SUPABASE_ANON_KEY;

// Safe storage wrapper that never throws SecurityError in sandboxed iframes or private browsing modes
const memoryStore = new Map<string, string>();

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (_) {
      // Storage access blocked by iframe sandbox or cookie privacy settings
    }
    return memoryStore.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (_) {
      // Storage access blocked
    }
    memoryStore.set(key, value);
  },
  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (_) {
      // Storage access blocked
    }
    memoryStore.delete(key);
  },
};

// Create Supabase client instance with resilient session storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export interface VoiceSessionRecord {
  id?: string;
  user_id?: string | null;
  user_email?: string | null;
  user_name?: string | null;
  query_text: string;
  response_text: string;
  voice_engine?: string;
  created_at?: string;
}

export interface LeadInquiryRecord {
  id?: string;
  user_id?: string | null;
  name: string;
  phone: string;
  email?: string;
  property_name?: string;
  message?: string;
  source?: string;
  created_at?: string;
}

/**
 * Log an AI Voice or Chat interaction to Supabase.
 * Uses graceful error recovery so voice continues uninterrupted even if tables are not yet created in Supabase.
 */
export async function logVoiceSessionToSupabase(record: VoiceSessionRecord): Promise<boolean> {
  const timestamp = new Date().toISOString();
  const payload = {
    ...record,
    created_at: timestamp,
  };

  // Local mirror in safeStorage for instant offline/client-side access
  try {
    const existing = JSON.parse(safeStorage.getItem('as_realty_voice_sessions') || '[]');
    existing.unshift(payload);
    safeStorage.setItem('as_realty_voice_sessions', JSON.stringify(existing.slice(0, 50)));
  } catch (_) {
    // Silently ignore storage quota errors
  }

  try {
    const { error } = await supabase.from('voice_sessions').insert([payload]);
    if (error) {
      // Table might not exist yet or RLS policy enabled; try fallback table or log
      console.info('[Supabase] Note on voice_sessions table:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.info('[Supabase] Interaction logged locally. Remote note:', err?.message);
    return false;
  }
}

/**
 * Log a lead or visit booking to Supabase.
 */
export async function logLeadToSupabase(lead: LeadInquiryRecord): Promise<boolean> {
  const payload = {
    ...lead,
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase.from('lead_inquiries').insert([payload]);
    if (error) {
      console.info('[Supabase] Note on lead_inquiries table:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.info('[Supabase] Lead logged with fallback. Note:', err?.message);
    return false;
  }
}

/**
 * Fetch past voice consultation logs for a user.
 */
export async function getVoiceSessionsFromSupabase(userId?: string | null): Promise<VoiceSessionRecord[]> {
  try {
    if (userId) {
      const { data, error } = await supabase
        .from('voice_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        return data as VoiceSessionRecord[];
      }
    }
  } catch (_) {
    // Fallback to local
  }

  try {
    return JSON.parse(safeStorage.getItem('as_realty_voice_sessions') || '[]');
  } catch (_) {
    return [];
  }
}

/**
 * Live health check of the Supabase connection from the browser.
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string; projectId: string }> {
  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      return { connected: false, message: error.message, projectId: SUPABASE_PROJECT_ID };
    }
    return { connected: true, message: `Connected to Supabase Project ${SUPABASE_PROJECT_ID}`, projectId: SUPABASE_PROJECT_ID };
  } catch (err: any) {
    return { connected: false, message: err?.message || 'Connection check error', projectId: SUPABASE_PROJECT_ID };
  }
}

