import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

export type User = { name: string; email: string; company?: string };

type Account = { user: User; passwordHash: string };

type AuthContextValue = {
  user: User | null;
  /** False until any saved session has been restored; avoids flashing the login screen. */
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { name: string; email: string; company?: string; password: string }) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const ACCOUNTS_KEY = 'nb.accounts';
const SESSION_KEY = 'nb.session';

/** Browser storage on web; in-memory elsewhere (native persistence needs expo-secure-store). */
const storage = {
  get(key: string): string | null {
    if (Platform.OS !== 'web') return null;
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    if (Platform.OS !== 'web') return;
    try {
      if (value === null) globalThis.localStorage?.removeItem(key);
      else globalThis.localStorage?.setItem(key, value);
    } catch {
      // Storage unavailable (private mode, blocked): stay signed in for this visit only.
    }
  },
};

/** SHA-256 hex digest where Web Crypto is available, so plain-text passwords are never stored. */
async function hashPassword(email: string, password: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  const input = `${email}:${password}`;
  if (!subtle) return input; // Native without Web Crypto: in-memory only, never persisted.
  const bytes = await subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * DEMO authentication. Accounts live in this browser only (or in memory on native).
 * Before going live, replace signIn/signUp with calls to a real backend and store the
 * session token with expo-secure-store.
 */
/** Reads saved accounts and the signed-in email (synchronous browser storage). */
function restore(): { accounts: Record<string, Account>; user: User | null } {
  try {
    const saved = storage.get(ACCOUNTS_KEY);
    const accounts: Record<string, Account> = saved ? JSON.parse(saved) : {};
    const sessionEmail = storage.get(SESSION_KEY);
    return { accounts, user: sessionEmail && accounts[sessionEmail] ? accounts[sessionEmail].user : null };
  } catch {
    return { accounts: {}, user: null }; // Corrupt storage: start fresh.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Restored once, on first render, so there is no flash of the login screen.
  const [initial] = useState(restore);
  const [accounts, setAccounts] = useState<Record<string, Account>>(initial.accounts);
  const [user, setUser] = useState<User | null>(initial.user);
  // Storage is synchronous, so the session is known immediately. Kept for a future async backend.
  const ready = true;

  const signIn = useCallback(
    async (email: string, password: string) => {
      await wait(500);
      const key = email.trim().toLowerCase();
      const account = accounts[key];
      if (!account || account.passwordHash !== (await hashPassword(key, password))) {
        throw new Error('Incorrect email or password.');
      }
      storage.set(SESSION_KEY, key);
      setUser(account.user);
    },
    [accounts],
  );

  const signUp = useCallback(
    async ({ name, email, company, password }: { name: string; email: string; company?: string; password: string }) => {
      await wait(600);
      const key = email.trim().toLowerCase();
      if (accounts[key]) throw new Error('An account with this email already exists. Try logging in.');
      const newUser: User = { name: name.trim(), email: key, company: company?.trim() || undefined };
      const next = { ...accounts, [key]: { user: newUser, passwordHash: await hashPassword(key, password) } };
      storage.set(ACCOUNTS_KEY, JSON.stringify(next));
      storage.set(SESSION_KEY, key);
      setAccounts(next);
      setUser(newUser);
    },
    [accounts],
  );

  const signOut = useCallback(() => {
    storage.set(SESSION_KEY, null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, signIn, signUp, signOut }), [user, ready, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
