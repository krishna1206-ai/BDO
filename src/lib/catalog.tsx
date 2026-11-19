// Content that admins can change from the admin panel, merged with the app's built-in content:
// - services: built-in ones from src/data plus admin-added ones (supabase/services.sql)
// - job posts: stored in the database (supabase/posts.sql); the built-in list is only
//   used until that table exists.
// Everything becomes the same Service / Topic / Job objects as before, so it renders
// with exactly the same screens and styles.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  jobs as builtInJobs,
  services as builtInServices,
  type IconName,
  type Job,
  type Service,
} from '@/data/content';
import { photoByKey, serviceImages } from '@/data/images';
import { mainNav as builtInNav, servicesNav, topics as builtInTopics, type NavNode, type Topic } from '@/data/nav';

import { useAuth } from './auth';
import { listSiteJobs, listSiteServices, type SiteJobRow, type SiteServiceRow } from './db';

type CatalogValue = {
  services: Service[];
  topics: Topic[];
  mainNav: NavNode[];
  jobs: Job[];
  /** Admin-added services as stored in the database. */
  custom: SiteServiceRow[];
  /** False until the database content has been fetched (or failed to). */
  loaded: boolean;
  serviceImage: (serviceId: string) => number;
  topicById: (id: string) => Topic | undefined;
  /** Fetch the database content again (after an admin changes it). */
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

const toJob = (r: SiteJobRow): Job => ({
  id: r.id,
  title: r.title,
  team: r.team,
  location: r.location,
  type: r.type,
  description: r.description || undefined,
  image: r.image_url || undefined,
});

type Remote = {
  services: SiteServiceRow[];
  /** null = table not set up (or offline): use the built-in list. */
  jobs: Job[] | null;
};

/** Fetches everything; each part falls back on its own if its table isn't set up yet. */
async function fetchRemote(): Promise<Remote> {
  const [services, jobs] = await Promise.all([
    listSiteServices().catch(() => [] as SiteServiceRow[]),
    listSiteJobs()
      .then((rows) => rows.map(toJob))
      .catch(() => null),
  ]);
  return { services, jobs };
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [remote, setRemote] = useState<Remote>({ services: [], jobs: null });
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    setRemote(await fetchRemote());
    setLoaded(true);
  }, []);

  // Fetch on start and again after signing in or switching account.
  useEffect(() => {
    let active = true;
    fetchRemote().then((r) => {
      if (!active) return;
      setRemote(r);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const value = useMemo<CatalogValue>(() => {
    const custom = remote.services;
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
      // Until the database answers, show nothing rather than posts an admin may have removed.
      jobs: loaded ? (remote.jobs ?? builtInJobs) : [],
      custom,
      loaded,
      serviceImage: (id) => serviceImages[id] ?? photoByKey(imageKeys.get(id) ?? ''),
      topicById: (id) => topics.find((t) => t.id === id),
      reload,
    };
  }, [remote, loaded, reload]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider');
  return ctx;
}
