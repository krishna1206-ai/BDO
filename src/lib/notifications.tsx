import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from './auth';
import { markAllNotificationsRead, subscribeToNotifications, unreadNotificationCount, type NotificationRow } from './db';

type NotificationsContextValue = {
  /** Unread notifications for the signed-in user. */
  unread: number;
  /** The latest notification that arrived live during this visit (for a toast/banner). */
  latest: NotificationRow | null;
  markAllRead: () => Promise<void>;
  dismissLatest: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/** Tracks the unread notification count and listens for new notifications in real time. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  // Keyed by user id so a sign-out or account switch never shows another user's count.
  const [state, setState] = useState<{ userId: string; unread: number; latest: NotificationRow | null } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    unreadNotificationCount()
      .then((n) => active && setState((s) => ({ userId, unread: n, latest: s?.userId === userId ? s.latest : null })))
      .catch(() => {
        // Table not created yet (run supabase/notifications.sql) or offline: show no badge.
      });
    const unsubscribe = subscribeToNotifications(userId, (row) => {
      if (!active) return;
      setState((s) => ({ userId, unread: (s?.userId === userId ? s.unread : 0) + 1, latest: row }));
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [userId]);

  const current = state && state.userId === userId ? state : null;

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await markAllNotificationsRead();
    setState((s) => (s && s.userId === userId ? { ...s, unread: 0 } : s));
  }, [userId]);

  const dismissLatest = useCallback(() => {
    setState((s) => (s ? { ...s, latest: null } : s));
  }, []);

  const value = useMemo(
    () => ({ unread: current?.unread ?? 0, latest: current?.latest ?? null, markAllRead, dismissLatest }),
    [current, markAllRead, dismissLatest],
  );
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider');
  return ctx;
}
