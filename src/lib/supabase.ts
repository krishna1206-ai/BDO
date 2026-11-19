// Web client: each browser tab keeps its own session, so an admin tab and a client tab can be
// signed in as different people at the same time without kicking each other out.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Written to a tab's sessionStorage on sign-out so the tab doesn't pick up another tab's login. */
const SIGNED_OUT = '__signed_out__';

/** The user id and expiry of a stored Supabase session, or null if the value isn't a session. */
function sessionInfo(value: string | null): { userId: string; expiresAt: number } | null {
  if (!value || value === SIGNED_OUT) return null;
  try {
    const parsed = JSON.parse(value) as { user?: { id?: string }; expires_at?: number };
    return parsed.user?.id ? { userId: parsed.user.id, expiresAt: parsed.expires_at ?? 0 } : null;
  } catch {
    return null;
  }
}

/**
 * Per-tab storage for the auth session.
 * - sessionStorage (one per tab) holds this tab's session.
 * - localStorage remembers the most recent login, so a new tab or a browser restart starts signed in.
 * - When another tab refreshes the same user's tokens, this tab adopts the newer ones, so both
 *   tabs never try to use the same rotated refresh token.
 */
const perTabStorage = {
  getItem(name: string): string | null {
    const own = window.sessionStorage.getItem(name);
    const shared = window.localStorage.getItem(name);
    if (own === SIGNED_OUT) return null;
    if (own === null) {
      // New tab: start from the most recent login, then keep it as this tab's own session.
      if (shared !== null) window.sessionStorage.setItem(name, shared);
      return shared;
    }
    const mine = sessionInfo(own);
    const latest = sessionInfo(shared);
    if (mine && latest && mine.userId === latest.userId && latest.expiresAt > mine.expiresAt) {
      window.sessionStorage.setItem(name, shared as string);
      return shared;
    }
    return own;
  },
  setItem(name: string, value: string) {
    window.sessionStorage.setItem(name, value);
    window.localStorage.setItem(name, value);
  },
  removeItem(name: string) {
    const own = window.sessionStorage.getItem(name);
    const shared = window.localStorage.getItem(name);
    // Only forget the remembered login if it belongs to the user signing out in this tab.
    const mine = sessionInfo(own);
    if (shared !== null && (!mine || sessionInfo(shared)?.userId === mine.userId)) {
      window.localStorage.removeItem(name);
    }
    window.sessionStorage.setItem(name, SIGNED_OUT);
  },
};

/** Null until EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set (see .env.example). */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          // `window` is missing during static rendering; fall back to an in-memory session there.
          storage: typeof window !== 'undefined' ? perTabStorage : undefined,
          autoRefreshToken: true,
          persistSession: typeof window !== 'undefined',
          detectSessionInUrl: false,
        },
      })
    : null;
