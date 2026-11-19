// The full list of services: the built-in ones from src/data plus any an admin added
// (public.site_services, see supabase/services.sql). Admin-added services become ordinary
// Service / Topic objects, so they render with exactly the same screens and styles.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { services as builtInServices, type IconName, type Service } from '@/data/content';
import { photoByKey, serviceImages } from '@/data/images';
import { mainNav as builtInNav, servicesNav, topics as builtInTopics, type NavNode, type Topic } from '@/data/nav';

import { useAuth } from './auth';
import { listSiteServices, type SiteServiceRow } from './db';

type CatalogValue = {
  services: Service[];
  topics: Topic[];
  mainNav: NavNode[];
  /** Admin-added services as stored in the database. */
  custom: SiteServiceRow[];
  /** False until the admin-added services have been fetched (or failed to). */
  loaded: boolean;
  serviceImage: (serviceId: string) => number;
  topicById: (id: string) => Topic | undefined;
  /** Fetch the admin-added services again (after an admin changes them). */
  reload: () => Promise<void>;
};

const CatalogContext = createContext<CatalogValue | null>(null);

const toService = (r: SiteServiceRow): Service => ({
  id: r.id,
  title: r.title,
  icon: (r.icon || 'briefcase-outline') as IconName,
  summary: r.summary,
  description: r.description || r.summary,
  offerings: r.points,
});

const toTopic = (r: SiteServiceRow): Topic => ({
  id: r.id,
  title: r.title,
  summary: r.summary,
  points: r.points,
  parent: { kind: 'service', id: r.parent_id as string },
  overview: r.overview.length ? r.overview : undefined,
  custom: true,
});

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [custom, setCustom] = useState<SiteServiceRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      setCustom(await listSiteServices());
    } catch {
      // Table not created yet (run supabase/services.sql) or offline: show the built-in services only.
    }
    setLoaded(true);
  }, []);

  // Fetch on start and again after signing in or switching account.
  useEffect(() => {
    let active = true;
    listSiteServices()
      .then((rows) => active && setCustom(rows))
      .catch(() => {
        // Table not created yet (run supabase/services.sql) or offline: show the built-in services only.
      })
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [userId]);

  const value = useMemo<CatalogValue>(() => {
    const mains = custom.filter((r) => !r.parent_id);
    const services = [...builtInServices, ...mains.map(toService)];
    const serviceIds = new Set(services.map((s) => s.id));
    // Sub-services whose main service was removed are hidden.
    const subs = custom.filter((r) => r.parent_id && serviceIds.has(r.parent_id));
    const topics = [...builtInTopics, ...subs.map(toTopic)];
    const mainNav = builtInNav.map((n) => (n.id === 'services' ? servicesNav(services, topics) : n));
    const imageKeys = new Map(mains.map((r) => [r.id, r.image]));
    return {
      services,
      topics,
      mainNav,
      custom,
      loaded,
      serviceImage: (id) => serviceImages[id] ?? photoByKey(imageKeys.get(id) ?? ''),
      topicById: (id) => topics.find((t) => t.id === id),
      reload,
    };
  }, [custom, loaded, reload]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider');
  return ctx;
}
