// Content that admins can change from the admin panel, merged with the app's built-in content:
// - services: built-in ones from src/data plus admin-added ones (supabase/services.sql)
// - events and job posts: stored in the database (supabase/posts.sql); the built-in lists are only
//   used until that table exists.
// Everything becomes the same Service / Topic / EventItem / Job objects as before, so it renders
// with exactly the same screens and styles.
import type { Href } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  events as builtInEvents,
  jobs as builtInJobs,
  offices as builtInOffices,
  services as builtInServices,
  type EventItem,
  type IconName,
  type Job,
  type Office,
  type Service,
} from '@/data/content';
import { photoByKey, serviceImages, type PhotoSource } from '@/data/images';
import { mainNav as builtInNav, servicesNav, topics as builtInTopics, type NavNode, type Topic } from '@/data/nav';

import { useAuth } from './auth';
import {
  listSiteEvents,
  listSiteJobs,
  listSiteOffices,
  listSiteServices,
  type SiteEventRow,
  type SiteJobRow,
  type SiteOfficeRow,
  type SiteServiceRow,
} from './db';

type CatalogValue = {
  services: Service[];
  topics: Topic[];
  mainNav: NavNode[];
  events: EventItem[];
  jobs: Job[];
  offices: Office[];
  /** Admin-added services as stored in the database. */
  custom: SiteServiceRow[];
  /** False until the database content has been fetched (or failed to). */
  loaded: boolean;
  serviceImage: (serviceId: string) => PhotoSource;
  topicById: (id: string) => Topic | undefined;
  /** True for services and pages that ship with the app (they can be edited, removed and reset). */
  isBuiltIn: (id: string) => boolean;
  /** The original title of a built-in service or page. */
  builtInTitle: (id: string) => string | undefined;
  /** Fetch the database content again (after an admin changes it). */
  reload: () => Promise<void>;
};

const CatalogContext = createContext<CatalogValue | null>(null);

/** Ids of the services, service pages and Insights / About menu items that ship with the app. */
const builtInServiceTopics = builtInTopics.filter((t) => t.parent.kind === 'service');
const builtInMenuItems = builtInNav.filter((n) => n.id === 'insights' || n.id === 'about').flatMap((n) => n.children ?? []);
const BUILT_IN_IDS = new Set([
  ...builtInServices.map((s) => s.id),
  ...builtInServiceTopics.map((t) => t.id),
  ...builtInMenuItems.map((n) => n.id),
]);
const BUILT_IN_TITLES = new Map([...builtInServices, ...builtInServiceTopics, ...builtInMenuItems].map((x) => [x.id, x.title]));
/** Built-in About pages that can be edited like service pages (History, Awards, EDGE). */
const EDITABLE_MENU_PAGES = new Set(builtInMenuItems.filter((n) => String(n.href ?? '').startsWith('/topic/')).map((n) => n.id));

/** A page added to the Insights or About menu. */
const toMenuTopic = (r: SiteServiceRow): Topic => ({
  id: r.id,
  title: r.title,
  summary: r.summary,
  points: r.points,
  parent: { kind: r.section === 'insights' ? 'insights' : 'about', id: r.section },
  overview: r.overview.length ? r.overview : undefined,
  custom: true,
  image: r.image || undefined,
  leader: r.leader ?? undefined,
});

const toService = (r: SiteServiceRow): Service => ({
  id: r.id,
  title: r.title,
  icon: (r.icon || 'briefcase-outline') as IconName,
  summary: r.summary,
  description: r.description || r.summary,
  offerings: r.points,
  leader: r.leader ?? undefined,
});

const toTopic = (r: SiteServiceRow): Topic => ({
  id: r.id,
  title: r.title,
  summary: r.summary,
  points: r.points,
  parent: { kind: 'service', id: r.parent_id as string },
  overview: r.overview.length ? r.overview : undefined,
  custom: true,
  image: r.image || undefined,
  leader: r.leader ?? undefined,
});

const toEvent = (r: SiteEventRow): EventItem => ({
  id: r.id,
  title: r.title,
  date: r.date,
  format: r.format,
  location: r.location,
  description: r.description,
  image: r.image_url || undefined,
  createdAt: r.created_at,
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
const toOffice = (r: SiteOfficeRow): Office => ({
  id: r.id,
  city: r.city,
  country: r.country || undefined,
  address: r.address,
  phone: r.phone,
  mapUrl: r.map_url || undefined,
  image: r.image_url || undefined,
});


type Remote = {
  services: SiteServiceRow[];
  /** null = table not set up (or offline): use the built-in list. */
  events: EventItem[] | null;
  jobs: Job[] | null;
  offices: Office[] | null;
};

/** Fetches everything; each part falls back on its own if its table isn't set up yet. */
async function fetchRemote(): Promise<Remote> {
  const [services, events, jobs, offices] = await Promise.all([
    listSiteServices().catch(() => [] as SiteServiceRow[]),
    listSiteEvents()
      .then((rows) => rows.map(toEvent))
      .catch(() => null),
    listSiteJobs()
      .then((rows) => rows.map(toJob))
      .catch(() => null),
    listSiteOffices()
      .then((rows) => rows.map(toOffice))
      .catch(() => null),
  ]);
  return { services, events, jobs, offices };
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [remote, setRemote] = useState<Remote>({ services: [], events: null, jobs: null, offices: null });
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
    // A database row with a built-in id edits (or, when hidden, removes) that built-in item.
    const rowById = new Map(custom.map((r) => [r.id, r]));
    const added = custom.filter((r) => !BUILT_IN_IDS.has(r.id) && !r.hidden);
    const addedServices = added.filter((r) => r.section === 'service');
    const addedMenuItems = added.filter((r) => r.section !== 'service');

    const editedBuiltIns = builtInServices.flatMap((s): Service[] => {
      const r = rowById.get(s.id);
      if (!r) return [s];
      if (r.hidden) return [];
      return [
        { ...s, title: r.title, summary: r.summary, description: r.description, icon: (r.icon || s.icon) as IconName, offerings: r.points, leader: r.leader ?? undefined },
      ];
    });
    const services = [...editedBuiltIns, ...addedServices.filter((r) => !r.parent_id).map(toService)];
    const serviceIds = new Set(services.map((s) => s.id));

    const editedTopics = builtInTopics.flatMap((t): Topic[] => {
      const editable = t.parent.kind === 'service' || EDITABLE_MENU_PAGES.has(t.id);
      const r = editable ? rowById.get(t.id) : undefined;
      if (!r) return [t];
      if (r.hidden) return [];
      const overview = r.overview.length ? r.overview : undefined;
      return [
        {
          ...t,
          title: r.title,
          summary: r.summary,
          points: r.points,
          // Service pages can move to another main service; About pages stay in About.
          parent: t.parent.kind === 'service' ? { kind: 'service', id: r.parent_id ?? t.parent.id } : t.parent,
          overview,
          leader: r.leader ?? undefined,
          image: r.image || undefined,
          // Pages with long-form content keep their sections; the edited overview replaces the intro.
          page: t.page ? { ...t.page, intro: overview ?? t.page.intro } : undefined,
        },
      ];
    });
    const topics = [
      ...editedTopics,
      ...addedServices.filter((r) => r.parent_id).map(toTopic),
      // Insights / About items that are pages (links to other websites have no page).
      ...addedMenuItems.filter((r) => !r.link).map(toMenuTopic),
    ]
      // Pages whose main service was removed are hidden too.
      .filter((t) => t.parent.kind !== 'service' || serviceIds.has(t.parent.id));

    // Insights and About menus: built-in items (renamed or removed by an admin) plus added ones.
    const menuWithAdded = (node: NavNode): NavNode => ({
      ...node,
      children: [
        ...(node.children ?? []).flatMap((c): NavNode[] => {
          const r = rowById.get(c.id);
          if (!r) return [c];
          return r.hidden ? [] : [{ ...c, title: r.title }];
        }),
        ...addedMenuItems
          .filter((r) => r.section === node.id)
          .map((r): NavNode => (r.link ? { id: r.id, title: r.title, external: r.link } : { id: r.id, title: r.title, href: `/topic/${r.id}` as Href })),
      ],
    });
    const mainNav = builtInNav.map((n) =>
      n.id === 'services' ? servicesNav(services, topics) : n.id === 'insights' || n.id === 'about' ? menuWithAdded(n) : n,
    );
    return {
      services,
      topics,
      mainNav,
      // Until the database answers, show nothing rather than posts an admin may have removed.
      events: loaded ? (remote.events ?? builtInEvents) : [],
      jobs: loaded ? (remote.jobs ?? builtInJobs) : [],
      offices: loaded ? (remote.offices ?? builtInOffices) : [],
      custom,
      loaded,
      // An admin-chosen photo wins; otherwise the built-in photo (or the default for added services).
      serviceImage: (id) => {
        const key = rowById.get(id)?.image;
        return key ? photoByKey(key) : (serviceImages[id] ?? photoByKey(''));
      },
      topicById: (id) => topics.find((t) => t.id === id),
      isBuiltIn: (id) => BUILT_IN_IDS.has(id),
      builtInTitle: (id) => BUILT_IN_TITLES.get(id),
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
