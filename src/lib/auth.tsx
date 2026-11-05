import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type User = { name: string; email: string; company?: string };

type AuthContextValue = {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { name: string; email: string; company?: string; password: string }) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Small artificial delay so loading states are visible, like a real network call. */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * DEMO authentication: accounts live in memory only and are lost when the app reloads.
 * Replace signIn/signUp with calls to your real backend (and store the session token
 * with expo-secure-store) before going live. Never ship plain-text password storage.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts] = useState(() => new Map<string, { user: User; password: string }>());
  const [user, setUser] = useState<User | null>(null);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await wait(600);
      const account = accounts.get(email.trim().toLowerCase());
      if (!account || account.password !== password) throw new Error('Incorrect email or password.');
      setUser(account.user);
    },
    [accounts],
  );

  const signUp = useCallback(
    async ({ name, email, company, password }: { name: string; email: string; company?: string; password: string }) => {
      await wait(700);
      const key = email.trim().toLowerCase();
      if (accounts.has(key)) throw new Error('An account with this email already exists. Try logging in.');
      const newUser: User = { name: name.trim(), email: key, company: company?.trim() || undefined };
      accounts.set(key, { user: newUser, password });
      setUser(newUser);
    },
    [accounts],
  );

  const signOut = useCallback(() => setUser(null), []);

  const value = useMemo(() => ({ user, signIn, signUp, signOut }), [user, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
