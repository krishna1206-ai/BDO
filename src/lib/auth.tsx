import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { amIAdmin } from './db';
import { supabase } from './supabase';

export type User = { id: string; name: string; email: string; company?: string };

type SignUpInput = { name: string; email: string; company?: string; password: string };

type AuthContextValue = {
  user: User | null;
  /** False until the saved session has been checked; avoids flashing the login screen. */
  ready: boolean;
  /** True when the signed-in email is listed in public.admins. */
  isAdmin: boolean;
  /** True while the admin check for the signed-in user is still running. */
  adminChecking: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves with needsConfirmation=true when Supabase requires the user to confirm their email first. */
  signUp: (input: SignUpInput) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const NOT_CONFIGURED =
  'Sign-in is not set up yet: add your Supabase URL and publishable key to .env.local (see .env.example) and restart the server.';

function toUser(session: Session | null): User | null {
  const u = session?.user;
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as { name?: string; company?: string };
  return { id: u.id, email: u.email ?? '', name: meta.name || u.email || 'there', company: meta.company || undefined };
}

/** Turns Supabase's technical error messages into plain-English ones for the forms. */
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Incorrect email or password.';
  if (m.includes('email not confirmed')) return 'Please confirm your email first: open the link we sent you, then log in.';
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'An account with this email already exists. Try logging in.';
  }
  if (m.includes('rate limit')) return 'Too many attempts. Please wait a minute and try again.';
  if (m.includes('fetch') || m.includes('network')) return 'Could not reach the server. Check your connection and try again.';
  return message;
}

/** Authentication backed by Supabase Auth. Registered users appear in the Supabase dashboard under Authentication. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // Without Supabase configured there is no session to wait for.
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    // Restore any saved session, then keep in sync with sign-in, sign-out and token refreshes.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    // Supabase also relays other tabs' sign-ins and sign-outs here. Re-read this tab's own session
    // instead of trusting the event, so another tab's login or logout can't switch this tab's user.
    // (Deferred: calling Supabase inside this callback can deadlock its auth lock.)
    const client = supabase;
    let active = true;
    const { data } = client.auth.onAuthStateChange(() => {
      setTimeout(() => {
        client.auth.getSession().then(({ data: current }) => active && setSession(current.session));
      }, 0);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error(NOT_CONFIGURED);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw new Error(friendly(error.message));
  }, []);

  const signUp = useCallback(async ({ name, email, company, password }: SignUpInput) => {
    if (!supabase) throw new Error(NOT_CONFIGURED);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      // Stored on the user record; visible in the Supabase dashboard (Authentication > Users > user > raw metadata).
      options: { data: { name: name.trim(), company: company?.trim() || null } },
    });
    if (error) throw new Error(friendly(error.message));
    // Supabase returns an empty identities list for an email that is already registered (to avoid leaking accounts).
    if (data.user && data.user.identities?.length === 0) {
      throw new Error('An account with this email already exists. Try logging in.');
    }
    return { needsConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    // 'local' ends only this tab's session; the default ('global') would sign the user out everywhere.
    await supabase?.auth.signOut({ scope: 'local' });
  }, []);

  const user = useMemo(() => toUser(session), [session]);

  // Which user id was last confirmed as an admin (see supabase/admin.sql). Deriving isAdmin from it
  // means a sign-out or account switch can never leave a stale "admin" flag behind.
  const [adminCheck, setAdminCheck] = useState<{ userId: string; isAdmin: boolean } | null>(null);
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    amIAdmin().then((ok) => active && setAdminCheck({ userId, isAdmin: ok }));
    return () => {
      active = false;
    };
  }, [userId]);
  const isAdmin = !!userId && adminCheck?.userId === userId && adminCheck.isAdmin;
  // True while the signed-in user's admin status hasn't been checked yet.
  const adminChecking = !!userId && adminCheck?.userId !== userId;

  const value = useMemo(
    () => ({ user, ready, isAdmin, adminChecking, signIn, signUp, signOut }),
    [user, ready, isAdmin, adminChecking, signIn, signUp, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
