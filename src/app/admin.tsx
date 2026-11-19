import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { EMAIL_RE, FormAlert, FormField, authStyles } from '@/components/form';
import { styles as ui } from '@/components/ui';
import { formatDate, type EventItem, type Job, type Leader } from '@/data/content';
import { eventImage, isPhotoLink, photoChoices, serviceImages, type PhotoSource } from '@/data/images';
import { useAuth } from '@/lib/auth';
import { useCatalog } from '@/lib/catalog';
import {
  addAdmin,
  adminApplications,
  adminCounts,
  adminEnquiries,
  adminProfiles,
  adminRecentActivity,
  adminRegistrations,
  adminSubscribers,
  changePassword,
  createSiteService,
  deleteSiteEvent,
  deleteSiteJob,
  deleteSiteService,
  listAdmins,
  removeAdmin,
  removeSubscriber,
  resetSiteService,
  saveSiteEvent,
  saveSiteJob,
  setApplicationStatus,
  setEnquiryStatus,
  updateSiteService,
  upsertSiteService,
  uploadSiteImage,
  type ActivityItem,
  type ApplicationRow,
  type ApplicationStatus,
  type EnquiryRow,
  type EnquiryStatus,
  type ProfileRow,
  type RegistrationRow,
  type SubscriberRow,
} from '@/lib/db';
import { colors, radius, spacing } from '@/theme';

type Tab =
  | 'overview'
  | 'services'
  | 'event-posts'
  | 'job-posts'
  | 'users'
  | 'enquiries'
  | 'applications'
  | 'events'
  | 'subscribers'
  | 'admins'
  | 'account';

const TABS: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'overview', label: 'Overview', icon: 'speedometer-outline' },
  { id: 'services', label: 'Services', icon: 'grid-outline' },
  { id: 'event-posts', label: 'Events', icon: 'megaphone-outline' },
  { id: 'job-posts', label: 'Jobs', icon: 'document-text-outline' },
  { id: 'users', label: 'Users', icon: 'people-outline' },
  { id: 'enquiries', label: 'Enquiries', icon: 'mail-outline' },
  { id: 'applications', label: 'Applications', icon: 'briefcase-outline' },
  { id: 'events', label: 'Event sign-ups', icon: 'calendar-outline' },
  { id: 'subscribers', label: 'Subscribers', icon: 'newspaper-outline' },
  { id: 'admins', label: 'Admins', icon: 'shield-checkmark-outline' },
  { id: 'account', label: 'My account', icon: 'key-outline' },
];

const ENQUIRY_STATUSES: EnquiryStatus[] = ['new', 'in_progress', 'replied', 'closed'];
const APPLICATION_STATUSES: ApplicationStatus[] = ['received', 'reviewing', 'interview', 'rejected', 'hired'];

const STATUS_COLORS: Record<string, string> = {
  new: '#1F5FBF',
  received: '#1F5FBF',
  in_progress: '#D98E04',
  reviewing: '#D98E04',
  interview: '#7A3EC8',
  replied: '#1E8E5A',
  hired: '#1E8E5A',
  closed: '#5B6573',
  rejected: '#B42318',
};

const label = (s: string) => s.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase());
const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Builds a CSV and downloads it (web) or opens the share sheet (phones). */
function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => cell(r[h])).join(','))].join('\n');
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    Share.share({ title: filename, message: csv });
  }
}

export default function AdminScreen() {
  const { isAdmin, adminChecking, user, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [tab, setTab] = useState<Tab>('overview');

  // Signed in, admin status still loading.
  if (user && adminChecking) {
    return (
      <View style={[ui.screen, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Anyone who isn't a signed-in admin gets the admin sign-in form.
  // A signed-in regular user is told which account they're on; signing in here switches accounts.
  if (!user || !isAdmin) return <AdminSignIn currentEmail={user?.email} onSignOut={signOut} />;

  return (
    <View style={[s.root, wide && { flexDirection: 'row' }]}>
      {/* Navigation: sidebar on wide screens, scrollable chips on phones. */}
      {wide ? (
        <View style={s.sidebar}>
          <Text style={s.sidebarTitle}>Admin</Text>
          {TABS.map((t) => (
            <Pressable key={t.id} onPress={() => setTab(t.id)} style={[s.sideItem, tab === t.id && s.sideItemOn]}>
              <Ionicons name={t.icon} size={18} color={tab === t.id ? colors.primaryLink : colors.text} />
              <Text style={[s.sideText, tab === t.id && { color: colors.primaryLink }]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsBar} contentContainerStyle={s.chips}>
          {TABS.map((t) => (
            <Pressable key={t.id} onPress={() => setTab(t.id)} style={[s.chip, tab === t.id && s.chipOn]}>
              <Text style={[s.chipText, tab === t.id && { color: colors.onPrimary }]}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={{ flex: 1 }}>
        {tab === 'overview' ? <Overview onOpen={setTab} /> : null}
        {tab === 'services' ? <ServicesTab /> : null}
        {tab === 'event-posts' ? <EventPostsTab /> : null}
        {tab === 'job-posts' ? <JobPostsTab /> : null}
        {tab === 'users' ? <UsersTab /> : null}
        {tab === 'enquiries' ? <EnquiriesTab /> : null}
        {tab === 'applications' ? <ApplicationsTab /> : null}
        {tab === 'events' ? <EventsTab /> : null}
        {tab === 'subscribers' ? <SubscribersTab /> : null}
        {tab === 'admins' ? <AdminsTab /> : null}
        {tab === 'account' ? <AccountTab /> : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Data loading helper shared by every tab
// ---------------------------------------------------------------------------

function useLoad<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const run = useCallback(async () => {
    try {
      setData(await load());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load data.');
    }
  }, [load]);

  useEffect(() => {
    let active = true;
    load()
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Could not load data.'));
    return () => {
      active = false;
    };
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await run();
    setRefreshing(false);
  }, [run]);

  return { data, setData, error, refreshing, refresh };
}

function State({ error, loading }: { error: string; loading: boolean }) {
  if (error) return <Text style={[s.empty, { color: '#B42318' }]}>{error}</Text>;
  if (loading) return <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} />;
  return null;
}

/** Search box + export button above each list. */
function Toolbar({ title, count, query, onQuery, onExport }: { title: string; count: number; query: string; onQuery: (q: string) => void; onExport: () => void }) {
  return (
    <View style={s.toolbar}>
      <Text style={s.tabTitle}>
        {title} <Text style={s.count}>({count})</Text>
      </Text>
      <View style={s.toolbarRow}>
        <View style={s.search}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput value={query} onChangeText={onQuery} placeholder="Search…" placeholderTextColor={colors.textMuted} style={s.searchInput} />
        </View>
        <Pressable onPress={onExport} style={s.exportBtn}>
          <Ionicons name="download-outline" size={16} color={colors.primary} />
          <Text style={s.exportText}>CSV</Text>
        </Pressable>
      </View>
    </View>
  );
}

const matches = (q: string, ...fields: (string | null | undefined)[]) =>
  !q.trim() || fields.some((f) => f?.toLowerCase().includes(q.trim().toLowerCase()));

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

const ACTIVITY_ICONS: Record<ActivityItem['kind'], keyof typeof Ionicons.glyphMap> = {
  user: 'person-add-outline',
  enquiry: 'mail-outline',
  application: 'briefcase-outline',
  event: 'calendar-outline',
  cyber: 'shield-half-outline',
};

const loadOverview = async () => {
  const [counts, activity] = await Promise.all([adminCounts(), adminRecentActivity(12)]);
  return { counts, activity };
};

function Overview({ onOpen }: { onOpen: (t: Tab) => void }) {
  const { data, error, refreshing, refresh } = useLoad(loadOverview);
  // Same width for every card: 4 per row on desktop, 3 on tablets, 2 on phones.
  const { width } = useWindowDimensions();
  const columns = width >= 1200 ? 4 : width >= 640 ? 3 : 2;
  const cellWidth = `${100 / columns}%` as const;
  const c = data?.counts;
  const stats: { label: string; value?: number; sub?: string; tab?: Tab; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Registered users', value: c?.users, tab: 'users', icon: 'people-outline' },
    { label: 'Enquiries', value: c?.enquiries, sub: c ? `${c.newEnquiries} new` : undefined, tab: 'enquiries', icon: 'mail-outline' },
    { label: 'Job applications', value: c?.applications, sub: c ? `${c.newApplications} to review` : undefined, tab: 'applications', icon: 'briefcase-outline' },
    { label: 'Event sign-ups', value: c?.registrations, tab: 'events', icon: 'calendar-outline' },
    { label: 'Cyber Risk Checks', value: c?.cyberChecks, icon: 'shield-half-outline' },
    { label: 'Admins', value: c?.admins, tab: 'admins', icon: 'shield-checkmark-outline' },
  ];
  return (
    <ScrollView contentContainerStyle={s.pad} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={s.tabTitle}>Overview</Text>
        <Pressable onPress={refresh} style={s.exportBtn}>
          <Ionicons name="refresh" size={16} color={colors.primary} />
          <Text style={s.exportText}>Refresh</Text>
        </Pressable>
      </View>
      <State error={error} loading={!data} />
      <View style={s.statGrid}>
        {stats.map((st, i) => (
          <Animated.View
            key={st.label}
            entering={FadeIn.delay(i * 50).reduceMotion(ReduceMotion.System)}
            style={[s.statCell, { width: cellWidth }]}
          >
            <Pressable onPress={() => st.tab && onOpen(st.tab)} disabled={!st.tab} style={s.statCard}>
              <Ionicons name={st.icon} size={22} color={colors.accent} />
              <Text style={s.statValue}>{st.value ?? '–'}</Text>
              <Text style={s.statLabel} numberOfLines={1}>
                {st.label}
              </Text>
              {/* Always reserve the sub-line so every card is the same height. */}
              <Text style={s.statSub} numberOfLines={1}>
                {st.sub ?? ' '}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      <Text style={[s.tabTitle, { fontSize: 18, marginTop: spacing.xl, marginBottom: spacing.sm }]}>Recent activity</Text>
      {data && data.activity.length === 0 ? <Text style={s.empty}>No activity yet.</Text> : null}
      {data?.activity.map((a, i) => (
        <View key={`${a.kind}-${a.at}-${i}`} style={s.activity}>
          <View style={s.activityIcon}>
            <Ionicons name={ACTIVITY_ICONS[a.kind]} size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>{a.title}</Text>
            <Text style={s.rowMeta} numberOfLines={1}>
              {a.detail}
            </Text>
          </View>
          <Text style={s.rowDate}>{when(a.at)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Services: add main services, or sub-services under an existing main service
// ---------------------------------------------------------------------------

/** Icons an admin can pick for a main service (shown on the Services page card). */
const SERVICE_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'briefcase-outline',
  'shield-checkmark-outline',
  'calculator-outline',
  'trending-up-outline',
  'hardware-chip-outline',
  'globe-outline',
  'people-outline',
  'document-text-outline',
  'cash-outline',
  'business-outline',
  'leaf-outline',
  'analytics-outline',
  'scale-outline',
  'construct-outline',
];

type ServiceForm = {
  /** Set when editing an existing service (built-in or admin-added). */
  editingId: string | null;
  /** Editing a service that ships with the app (saved as an override row). */
  builtIn: boolean;
  kind: 'main' | 'sub';
  parentId: string;
  title: string;
  summary: string;
  description: string;
  icon: string;
  /** Photo key; '' keeps a built-in service's own photo. */
  image: string;
  points: string;
  overview: string;
  /** "Meet our leader" contact; all empty = the default contact. */
  leaderName: string;
  leaderRole: string;
  leaderOffice: string;
  leaderEmail: string;
  /** Main services: new pages to add to the right-side box, one per line. */
  newSubs: string;
};

const emptyForm = (parentId = ''): ServiceForm => ({
  editingId: null,
  builtIn: false,
  kind: parentId ? 'sub' : 'main',
  parentId,
  title: '',
  summary: '',
  description: '',
  icon: SERVICE_ICONS[0],
  image: parentId ? '' : photoChoices[2].key,
  points: '',
  overview: '',
  newSubs: '',
  leaderName: '',
  leaderRole: '',
  leaderOffice: '',
  leaderEmail: '',
});

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'service';

/** Form fields for a saved leader (empty when there is none). */
const leaderFields = (leader?: Leader) => ({
  leaderName: leader?.name ?? '',
  leaderRole: leader?.role ?? '',
  leaderOffice: leader?.office ?? '',
  leaderEmail: leader?.email ?? '',
});

/** One item per line, blank lines dropped. */
const lines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

/** Paragraphs are separated by a blank line. */
const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);

function ServicesTab() {
  const { services, topics, custom, reload, isBuiltIn, builtInTitle, serviceImage } = useCatalog();
  const [form, setForm] = useState<ServiceForm>(() => emptyForm());
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);

  const rowById = useMemo(() => new Map(custom.map((r) => [r.id, r])), [custom]);
  const removedBuiltIns = custom.filter((r) => r.hidden && isBuiltIn(r.id));
  const set = <K extends keyof ServiceForm>(key: K, value: ServiceForm[K]) => setForm((f) => ({ ...f, [key]: value }));
  const subsOf = (id: string) => topics.filter((t) => t.parent.kind === 'service' && t.parent.id === id);

  /** Web addresses already used by a service or page. */
  const takenIds = () => new Set([...services.map((x) => x.id), ...topics.map((x) => x.id), ...custom.map((x) => x.id)]);
  const uniqueId = (title: string, taken: Set<string>) => {
    const base = slugify(title);
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
    taken.add(id);
    return id;
  };

  const toTop = () => scroller.current?.scrollTo({ y: 0, animated: true });

  /** Fills the form with what the site shows now for this service or page. */
  const startEdit = (id: string) => {
    setMessage(null);
    const builtIn = isBuiltIn(id);
    const main = services.find((x) => x.id === id);
    if (main) {
      setForm({
        ...emptyForm(),
        editingId: id,
        builtIn,
        kind: 'main',
        title: main.title,
        summary: main.summary,
        description: main.description,
        icon: main.icon,
        image: rowById.get(id)?.image ?? (builtIn ? '' : photoChoices[2].key),
        points: main.offerings.join('\n'),
        ...leaderFields(main.leader),
      });
      return toTop();
    }
    const page = topics.find((x) => x.id === id);
    if (!page) return;
    const intro = page.overview ?? (page.page ? (Array.isArray(page.page.intro) ? page.page.intro : [page.page.intro]) : []);
    setForm({
      ...emptyForm(page.parent.id),
      editingId: id,
      builtIn,
      title: page.title,
      summary: page.summary,
      points: page.points.join('\n'),
      overview: intro.join('\n\n'),
      image: rowById.get(id)?.image ?? '',
      ...leaderFields(page.leader),
    });
    toTop();
  };

  const startAddUnder = (parentId: string) => {
    setMessage(null);
    setForm(emptyForm(parentId));
    toTop();
  };

  const save = async () => {
    if (busy) return;
    const title = form.title.trim();
    if (!title) return setMessage({ tone: 'error', text: 'Enter a name for the service.' });
    if (form.kind === 'sub' && !form.parentId) return setMessage({ tone: 'error', text: 'Choose which main service it goes under.' });
    if (!form.editingId && !form.summary.trim()) return setMessage({ tone: 'error', text: 'Add a short summary (one sentence).' });

    // Leader: all fields empty = the default contact.
    const leaderInput = {
      name: form.leaderName.trim(),
      role: form.leaderRole.trim(),
      office: form.leaderOffice.trim(),
      email: form.leaderEmail.trim().toLowerCase(),
    };
    const hasLeader = Object.values(leaderInput).some(Boolean);
    if (hasLeader && !leaderInput.name) return setMessage({ tone: 'error', text: "Enter the leader's name, or clear all the leader fields." });
    if (leaderInput.email && !EMAIL_RE.test(leaderInput.email)) return setMessage({ tone: 'error', text: "Enter a valid email for the leader." });

    const isMain = form.kind === 'main';
    const taken = takenIds();
    const row = {
      id: form.editingId ?? uniqueId(title, taken),
      parent_id: isMain ? null : form.parentId,
      title,
      summary: form.summary.trim(),
      description: isMain ? form.description.trim() : '',
      icon: form.icon,
      image: form.image,
      points: lines(form.points),
      overview: isMain ? [] : paragraphs(form.overview),
      hidden: false,
      leader: hasLeader ? leaderInput : null,
    };

    // New pages for the right-side box (skipping names that are already there).
    const existing = new Set((form.editingId ? subsOf(form.editingId) : []).map((t) => t.title.toLowerCase()));
    const newPages = isMain ? [...new Set(lines(form.newSubs))].filter((t) => !existing.has(t.toLowerCase())) : [];

    setBusy(true);
    setMessage(null);
    try {
      if (form.builtIn) await upsertSiteService(row);
      else if (form.editingId) await updateSiteService(row);
      else await createSiteService(row);
      for (const pageTitle of newPages) {
        await createSiteService({
          id: uniqueId(pageTitle, taken),
          parent_id: row.id,
          title: pageTitle,
          summary: '',
          description: '',
          icon: 'briefcase-outline',
          image: '',
          points: [],
          overview: [],
          hidden: false,
          leader: null,
        });
      }
      await reload();
      const where = isMain ? 'as a main service' : `under ${services.find((x) => x.id === row.parent_id)?.title ?? 'its main service'}`;
      const pagesNote = newPages.length
        ? ` ${newPages.length} page${newPages.length > 1 ? 's were' : ' was'} added to its right-side box; use Edit on each to add its overview and points.`
        : '';
      setMessage({ tone: 'success', text: `"${title}" ${form.editingId ? 'saved' : `added ${where}`}. It is live now.${pagesNote}` });
      setForm(emptyForm());
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Could not save the service.' });
    } finally {
      setBusy(false);
    }
  };

  /** Built-in: hidden from the site (can be restored). Admin-added: deleted with its pages. */
  const remove = async (id: string) => {
    setConfirmId(null);
    setMessage(null);
    const main = services.find((x) => x.id === id);
    const page = topics.find((x) => x.id === id);
    const title = main?.title ?? page?.title ?? id;
    try {
      if (isBuiltIn(id)) {
        await upsertSiteService({
          id,
          parent_id: main ? null : (page?.parent.id ?? null),
          title,
          summary: main?.summary ?? page?.summary ?? '',
          description: main?.description ?? '',
          icon: main?.icon ?? 'briefcase-outline',
          image: rowById.get(id)?.image ?? '',
          points: main?.offerings ?? page?.points ?? [],
          overview: page?.overview ?? [],
          hidden: true,
          leader: rowById.get(id)?.leader ?? null,
        });
      } else {
        await deleteSiteService(id);
      }
      if (form.editingId === id) setForm(emptyForm());
      await reload();
      setMessage({
        tone: 'success',
        text: isBuiltIn(id) ? `"${title}" removed from the site. You can restore it at the bottom of this page.` : `"${title}" removed.`,
      });
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Could not remove the service.' });
    }
  };

  /** Undo every change to a built-in service (also restores a removed one). */
  const reset = async (id: string, verb: 'reset' | 'restored') => {
    setMessage(null);
    try {
      await resetSiteService(id);
      if (form.editingId === id) setForm(emptyForm());
      await reload();
      setMessage({ tone: 'success', text: `"${builtInTitle(id) ?? id}" ${verb === 'reset' ? 'is back to its original text' : 'is back on the site'}.` });
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Could not undo the change.' });
    }
  };

  const actions = (id: string, isMainRow: boolean) => {
    const builtIn = isBuiltIn(id);
    const edited = builtIn && rowById.has(id);
    if (confirmId === id) {
      const hasPages = isMainRow && subsOf(id).length > 0;
      return (
        <View style={s.rowActions}>
          <Text style={[s.rowMeta, { fontSize: 13 }]}>{hasPages ? 'Remove with its pages?' : 'Remove?'}</Text>
          <Pressable onPress={() => remove(id)} style={[s.status, { borderColor: '#B42318', backgroundColor: '#B42318' }]}>
            <Text style={[s.statusText, { color: colors.onPrimary }]}>Yes, remove</Text>
          </Pressable>
          <Pressable onPress={() => setConfirmId(null)} style={[s.status, { borderColor: colors.border }]}>
            <Text style={[s.statusText, { color: colors.text }]}>Cancel</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={s.rowActions}>
        {builtIn ? <Text style={s.badge}>{edited ? 'Built-in · edited' : 'Built-in'}</Text> : null}
        <Pressable onPress={() => startEdit(id)} style={[s.status, { borderColor: colors.primary }]}>
          <Text style={[s.statusText, { color: colors.primary }]}>Edit</Text>
        </Pressable>
        {edited ? (
          <Pressable onPress={() => reset(id, 'reset')} style={[s.status, { borderColor: colors.textMuted }]}>
            <Text style={[s.statusText, { color: colors.textMuted }]}>Reset</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => setConfirmId(id)} style={[s.status, { borderColor: '#B42318' }]}>
          <Text style={[s.statusText, { color: '#B42318' }]}>Remove</Text>
        </Pressable>
      </View>
    );
  };

  const isMain = form.kind === 'main';
  const parentTitle = services.find((x) => x.id === form.parentId)?.title;
  const currentPages = form.editingId && isMain ? subsOf(form.editingId) : [];
  // '' = a built-in service's own photo, or (for pages) the main service's photo.
  const firstOption: { key: string; label: string; source: PhotoSource } | null =
    !isMain && form.parentId
      ? { key: '', label: 'Main service', source: serviceImage(form.parentId) }
      : form.builtIn && form.editingId && serviceImages[form.editingId]
        ? { key: '', label: 'Original', source: serviceImages[form.editingId] }
        : null;
  const photoOptions: { key: string; label: string; source: PhotoSource }[] = firstOption ? [firstOption, ...photoChoices] : photoChoices;
  const defaultPhoto = firstOption ? '' : photoChoices[2].key;

  return (
    <ScrollView ref={scroller} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <Text style={s.tabTitle}>Services</Text>
      <Text style={[s.rowMeta, { marginTop: 4 }]}>
        Add, edit or remove any service, including the built-in ones. Changes use the same page design and appear in the menu, the
        Services page and search straight away.
      </Text>

      {/* Add / edit form */}
      <View style={[s.row, { marginTop: spacing.md, maxWidth: 760 }]}>
        <Text style={s.rowTitle}>{form.editingId ? `Edit "${form.title || 'service'}"` : 'Add a service'}</Text>
        {form.builtIn ? (
          <Text style={s.rowMeta}>This is a built-in service. Your changes replace its text; use Reset in the list to go back to the original.</Text>
        ) : null}

        <Text style={s.fieldLabel}>What are you adding?</Text>
        <View style={s.statusRow}>
          {(
            [
              { id: 'sub', label: 'Service under an existing main service' },
              { id: 'main', label: 'New main service' },
            ] as const
          ).map((o) => {
            const on = form.kind === o.id;
            return (
              <Pressable
                key={o.id}
                disabled={!!form.editingId}
                onPress={() => set('kind', o.id)}
                style={[s.choice, on && s.choiceOn, form.editingId && !on && { opacity: 0.4 }]}
              >
                <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={16} color={on ? colors.onPrimary : colors.primary} />
                <Text style={[s.choiceText, on && { color: colors.onPrimary }]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {!isMain ? (
          <>
            <Text style={s.fieldLabel}>Place it under</Text>
            <View style={s.statusRow}>
              {services.map((m) => {
                const on = form.parentId === m.id;
                return (
                  <Pressable key={m.id} onPress={() => set('parentId', m.id)} style={[s.choice, on && s.choiceOn]}>
                    <Text style={[s.choiceText, on && { color: colors.onPrimary }]}>{m.title}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <FormField
          label={isMain ? 'Main service name' : 'Service name'}
          value={form.title}
          onChangeText={(v) => set('title', v)}
          placeholder={isMain ? 'e.g. Legal Services' : 'e.g. GST Advisory'}
        />
        <FormField
          label="Short summary (one sentence)"
          value={form.summary}
          onChangeText={(v) => set('summary', v)}
          placeholder="Shown under the title on cards, search results and the page."
        />

        {isMain ? (
          <>
            <FormField
              label="Overview"
              value={form.description}
              onChangeText={(v) => set('description', v)}
              multiline
              style={s.multiline}
              placeholder="A few sentences about this service, shown at the top of its page under the summary."
            />
            <FormField
              label="Services in the right-side box (one per line)"
              value={form.newSubs}
              onChangeText={(v) => set('newSubs', v)}
              multiline
              style={s.multiline}
              placeholder={'Business Applications\nCloud & Infrastructure Services\nCyber Security'}
            />
            <Text style={[s.rowMeta, { fontSize: 13, marginTop: 4 }]}>
              Each line becomes its own page, listed in the &quot;Our {form.title.trim() || 'service'} Services&quot; box beside the
              overview (and in the menu).
              {currentPages.length ? ` Already in the box: ${currentPages.map((p) => p.title).join(', ')}.` : ''}
            </Text>
            <Text style={s.fieldLabel}>Icon</Text>
            <View style={s.statusRow}>
              {SERVICE_ICONS.map((name) => {
                const on = form.icon === name;
                return (
                  <Pressable key={name} onPress={() => set('icon', name)} style={[s.iconChoice, on && s.choiceOn]} accessibilityLabel={name}>
                    <Ionicons name={name} size={20} color={on ? colors.onPrimary : colors.primary} />
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <FormField
            label="Overview (optional, leave a blank line between paragraphs)"
            value={form.overview}
            onChangeText={(v) => set('overview', v)}
            multiline
            style={s.multiline}
            placeholder="Paragraphs shown in the Overview section of the page."
          />
        )}

        <Text style={s.fieldLabel}>Photo: pick one</Text>
        <View style={s.photoGrid}>
          {photoOptions.map((p) => {
            const on = form.image === p.key;
            return (
              <Pressable key={p.key || 'default'} onPress={() => set('image', p.key)} style={[s.photo, on && s.photoOn]}>
                <Image source={p.source} style={s.photoImg} contentFit="cover" />
                <Text style={[s.photoLabel, on && { color: colors.primaryLink }]} numberOfLines={1}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <ImageField
          label="…or use your own photo"
          value={isPhotoLink(form.image) ? form.image : ''}
          onChange={(url) => set('image', url || defaultPhoto)}
        />

        <FormField
          label={isMain ? 'How we help (one point per line)' : 'How we help (one point per line, also listed in the right-side box)'}
          value={form.points}
          onChangeText={(v) => set('points', v)}
          multiline
          style={s.multiline}
          placeholder={'Tax returns and filings\nAdvice on new rules\nSupport with audits'}
        />

        <Text style={[s.fieldLabel, { marginTop: spacing.lg }]}>Meet our leader (optional)</Text>
        <Text style={[s.rowMeta, { fontSize: 13, marginTop: 2 }]}>
          The key contact shown in the &quot;Meet our leader&quot; section of the page.
          {isMain ? ' Pages under this service show this leader too, unless they have their own.' : ''} Leave all four empty to show the
          default contact.
        </Text>
        <View style={s.leaderGrid}>
          <View style={s.leaderCell}>
            <FormField label="Name" value={form.leaderName} onChangeText={(v) => set('leaderName', v)} placeholder="e.g. Fiona Grant" />
          </View>
          <View style={s.leaderCell}>
            <FormField label="Role" value={form.leaderRole} onChangeText={(v) => set('leaderRole', v)} placeholder="e.g. Director" />
          </View>
          <View style={s.leaderCell}>
            <FormField label="Office" value={form.leaderOffice} onChangeText={(v) => set('leaderOffice', v)} placeholder="e.g. Edinburgh" />
          </View>
          <View style={s.leaderCell}>
            <FormField
              label="Email"
              value={form.leaderEmail}
              onChangeText={(v) => set('leaderEmail', v)}
              placeholder="name@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {message ? <FormAlert tone={message.tone} message={message.text} /> : null}

        <View style={[s.toolbarRow, { marginTop: spacing.md, flexWrap: 'wrap' }]}>
          <Pressable onPress={save} disabled={busy} style={[s.addBtn, busy && { opacity: 0.7 }]}>
            <Ionicons name={form.editingId ? 'save-outline' : 'add'} size={18} color={colors.onPrimary} />
            <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>
              {busy ? 'Saving…' : form.editingId ? 'Save changes' : isMain ? 'Add main service' : parentTitle ? `Add under ${parentTitle}` : 'Add service'}
            </Text>
          </Pressable>
          {form.editingId || form.title ? (
            <Pressable onPress={() => setForm(emptyForm())} style={s.exportBtn}>
              <Text style={s.exportText}>{form.editingId ? 'Cancel' : 'Clear'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Current services, in menu order */}
      <Text style={[s.tabTitle, { fontSize: 18, marginTop: spacing.xl, marginBottom: spacing.sm }]}>All services</Text>
      {services.map((m) => {
        const subs = subsOf(m.id);
        return (
          <View key={m.id} style={s.row}>
            <View style={s.serviceHead}>
              <Ionicons name={m.icon} size={20} color={colors.primary} />
              <Pressable onPress={() => router.push(`/service/${m.id}`)} style={{ flex: 1, minWidth: 140 }}>
                <Text style={s.rowTitle}>{m.title}</Text>
              </Pressable>
              {actions(m.id, true)}
            </View>
            {subs.map((t) => (
              <View key={t.id} style={s.subRow}>
                <Ionicons name="return-down-forward-outline" size={16} color={colors.textMuted} />
                <Pressable onPress={() => router.push(`/topic/${t.id}`)} style={{ flex: 1, minWidth: 140 }}>
                  <Text style={s.subTitle}>{t.title}</Text>
                </Pressable>
                {actions(t.id, false)}
              </View>
            ))}
            <Pressable onPress={() => startAddUnder(m.id)} style={[s.subRow, { borderTopWidth: subs.length ? 1 : 0 }]} hitSlop={4}>
              <Ionicons name="add-circle-outline" size={16} color={colors.primaryLink} />
              <Text style={[s.subTitle, { color: colors.primaryLink, fontWeight: '700' }]}>Add a service under {m.title}</Text>
            </Pressable>
          </View>
        );
      })}

      {removedBuiltIns.length ? (
        <>
          <Text style={[s.tabTitle, { fontSize: 18, marginTop: spacing.xl, marginBottom: spacing.sm }]}>Removed built-in services</Text>
          {removedBuiltIns.map((r) => (
            <View key={r.id} style={[s.row, s.postRow]}>
              <Ionicons name="eye-off-outline" size={18} color={colors.textMuted} />
              <View style={{ flex: 1, minWidth: 180 }}>
                <Text style={s.rowTitle}>{builtInTitle(r.id) ?? r.title}</Text>
                <Text style={s.rowMeta}>{r.parent_id ? 'Page' : 'Main service'} · hidden from the site</Text>
              </View>
              <Pressable onPress={() => reset(r.id, 'restored')} style={[s.status, { borderColor: colors.primary }]}>
                <Text style={[s.statusText, { color: colors.primary }]}>Restore</Text>
              </Pressable>
            </View>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Events and job posts: add, edit, remove, with an uploaded or linked photo
// ---------------------------------------------------------------------------

/** Photo for a post: upload from the device, paste a link, or leave empty for the default photo. */
function ImageField({
  value,
  onChange,
  fallback,
  label = 'Photo',
}: {
  value: string;
  onChange: (url: string) => void;
  fallback?: number;
  label?: string;
}) {
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async () => {
    if (busy) return;
    setError('');
    // Must run straight from the button press (browsers block pickers opened later).
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    const asset = result.canceled ? null : result.assets?.[0];
    if (!asset) return;
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      setError('That photo is too big. Choose one under 5 MB.');
      return;
    }
    setBusy(true);
    try {
      onChange(await uploadSiteImage({ uri: asset.uri, mimeType: asset.mimeType, file: asset.file }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not upload the photo.');
    } finally {
      setBusy(false);
    }
  };

  const applyLink = () => {
    const url = link.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setError('Paste a full image link starting with https://');
      return;
    }
    setError('');
    onChange(url);
    setLink('');
  };

  const preview = value ? { uri: value } : fallback;
  return (
    <View>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.imageRow}>
        <View style={s.imagePreview}>
          {preview ? <Image source={preview} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : null}
          {busy ? (
            <View style={[StyleSheet.absoluteFill, s.imageBusy]}>
              <ActivityIndicator color={colors.onPrimary} />
            </View>
          ) : null}
        </View>
        <View style={{ flex: 1, minWidth: 220, gap: spacing.sm }}>
          <Text style={s.rowMeta}>{value ? 'Custom photo selected.' : fallback ? 'Using the default photo.' : 'No photo.'}</Text>
          <View style={[s.toolbarRow, { flexWrap: 'wrap' }]}>
            <Pressable onPress={upload} disabled={busy} style={[s.exportBtn, busy && { opacity: 0.6 }]}>
              <Ionicons name="cloud-upload-outline" size={16} color={colors.primary} />
              <Text style={s.exportText}>{busy ? 'Uploading…' : 'Upload photo'}</Text>
            </Pressable>
            {value ? (
              <Pressable onPress={() => onChange('')} style={[s.exportBtn, { borderColor: '#B42318' }]}>
                <Ionicons name="close" size={16} color="#B42318" />
                <Text style={[s.exportText, { color: '#B42318' }]}>Remove photo</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={s.toolbarRow}>
            <View style={s.search}>
              <Ionicons name="link-outline" size={16} color={colors.textMuted} />
              <TextInput
                value={link}
                onChangeText={setLink}
                placeholder="…or paste an image link (https://…)"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="url"
                style={s.searchInput}
                onSubmitEditing={applyLink}
              />
            </View>
            <Pressable onPress={applyLink} style={s.addBtn}>
              <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Use link</Text>
            </Pressable>
          </View>
        </View>
      </View>
      {error ? <FormAlert message={error} /> : null}
    </View>
  );
}

/** Pill buttons for picking one value. */
function Choices<T extends string>({ value, options, onChange }: { value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <View style={s.statusRow}>
      {options.map((o) => {
        const on = o === value;
        return (
          <Pressable key={o} onPress={() => onChange(o)} style={[s.choice, on && s.choiceOn]}>
            <Text style={[s.choiceText, on && { color: colors.onPrimary }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Edit / Remove buttons with an inline "are you sure?" step. */
function PostActions({ confirming, onEdit, onAskRemove, onRemove, onCancel }: {
  confirming: boolean;
  onEdit: () => void;
  onAskRemove: () => void;
  onRemove: () => void;
  onCancel: () => void;
}) {
  if (confirming) {
    return (
      <View style={s.rowActions}>
        <Text style={[s.rowMeta, { fontSize: 13 }]}>Remove?</Text>
        <Pressable onPress={onRemove} style={[s.status, { borderColor: '#B42318', backgroundColor: '#B42318' }]}>
          <Text style={[s.statusText, { color: colors.onPrimary }]}>Yes, remove</Text>
        </Pressable>
        <Pressable onPress={onCancel} style={[s.status, { borderColor: colors.border }]}>
          <Text style={[s.statusText, { color: colors.text }]}>Cancel</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={s.rowActions}>
      <Pressable onPress={onEdit} style={[s.status, { borderColor: colors.primary }]}>
        <Text style={[s.statusText, { color: colors.primary }]}>Edit</Text>
      </Pressable>
      <Pressable onPress={onAskRemove} style={[s.status, { borderColor: '#B42318' }]}>
        <Text style={[s.statusText, { color: '#B42318' }]}>Remove</Text>
      </Pressable>
    </View>
  );
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isRealDate = (v: string) => DATE_RE.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v);

const EVENT_FORMATS = ['Webinar', 'In person'] as const;
type EventForm = { id: string | null; title: string; date: string; format: EventItem['format']; location: string; description: string; image: string };
const emptyEvent = (): EventForm => ({ id: null, title: '', date: '', format: 'Webinar', location: 'Online', description: '', image: '' });

function EventPostsTab() {
  const { events, reload } = useCatalog();
  const [form, setForm] = useState<EventForm>(emptyEvent);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const set = <K extends keyof EventForm>(k: K, v: EventForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const today = new Date().toISOString().slice(0, 10);

  const edit = (e: EventItem) => {
    setMessage(null);
    setForm({ id: e.id, title: e.title, date: e.date, format: e.format, location: e.location, description: e.description, image: e.image ?? '' });
    scroller.current?.scrollTo({ y: 0, animated: true });
  };

  const save = async () => {
    if (busy) return;
    const title = form.title.trim();
    const date = form.date.trim();
    if (!title) return setMessage({ tone: 'error', text: 'Enter the event title.' });
    if (!isRealDate(date)) return setMessage({ tone: 'error', text: 'Enter the date as YYYY-MM-DD, for example 2026-12-15.' });
    if (!form.location.trim()) return setMessage({ tone: 'error', text: 'Enter where it takes place (or "Online").' });
    setBusy(true);
    setMessage(null);
    try {
      await saveSiteEvent({
        id: form.id ?? undefined,
        title,
        date,
        format: form.format,
        location: form.location.trim(),
        description: form.description.trim(),
        image_url: form.image || null,
      });
      await reload();
      setMessage({ tone: 'success', text: `"${title}" ${form.id ? 'saved' : 'added'}. It is live on the Events page now.` });
      setForm(emptyEvent());
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Could not save the event.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (e: EventItem) => {
    setConfirmId(null);
    setMessage(null);
    try {
      await deleteSiteEvent(e.id);
      if (form.id === e.id) setForm(emptyEvent());
      await reload();
      setMessage({ tone: 'success', text: `"${e.title}" removed. Its past sign-ups stay in Event sign-ups.` });
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Could not remove the event.' });
    }
  };

  return (
    <ScrollView ref={scroller} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <Text style={s.tabTitle}>Events</Text>
      <Text style={[s.rowMeta, { marginTop: 4 }]}>Add, change or remove the events shown on the Events page.</Text>

      <View style={[s.row, { marginTop: spacing.md, maxWidth: 760 }]}>
        <Text style={s.rowTitle}>{form.id ? `Edit "${form.title || 'event'}"` : 'Add an event'}</Text>
        <FormField label="Title" value={form.title} onChangeText={(v) => set('title', v)} placeholder="e.g. Budget briefing 2027" />
        <FormField
          label="Date (YYYY-MM-DD)"
          value={form.date}
          onChangeText={(v) => set('date', v)}
          placeholder={`e.g. ${today}`}
          autoCapitalize="none"
          maxLength={10}
        />
        <Text style={s.fieldLabel}>Type</Text>
        <Choices
          value={form.format}
          options={EVENT_FORMATS}
          onChange={(v) => setForm((f) => ({ ...f, format: v, location: v === 'Webinar' && !f.location.trim() ? 'Online' : f.location }))}
        />
        <FormField label="Location" value={form.location} onChangeText={(v) => set('location', v)} placeholder="Online, or a city" />
        <FormField
          label="Description"
          value={form.description}
          onChangeText={(v) => set('description', v)}
          multiline
          style={s.multiline}
          placeholder="What the event covers and who it is for."
        />
        <ImageField value={form.image} onChange={(v) => set('image', v)} fallback={eventImage({ format: form.format }) as number} />

        {message ? <FormAlert tone={message.tone} message={message.text} /> : null}
        <View style={[s.toolbarRow, { marginTop: spacing.md, flexWrap: 'wrap' }]}>
          <Pressable onPress={save} disabled={busy} style={[s.addBtn, busy && { opacity: 0.7 }]}>
            <Ionicons name={form.id ? 'save-outline' : 'add'} size={18} color={colors.onPrimary} />
            <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>{busy ? 'Saving…' : form.id ? 'Save changes' : 'Add event'}</Text>
          </Pressable>
          {form.id || form.title ? (
            <Pressable onPress={() => setForm(emptyEvent())} style={s.exportBtn}>
              <Text style={s.exportText}>{form.id ? 'Cancel' : 'Clear'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Text style={[s.tabTitle, { fontSize: 18, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
        All events <Text style={s.count}>({events.length})</Text>
      </Text>
      {events.length === 0 ? <Text style={s.empty}>No events yet.</Text> : null}
      {[...events]
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
        .map((e) => (
          <View key={e.id} style={[s.row, s.postRow]}>
            <Image source={eventImage(e)} style={s.postThumb} contentFit="cover" />
            <View style={{ flex: 1, minWidth: 180 }}>
              <Text style={s.rowTitle}>{e.title}</Text>
              <Text style={s.rowMeta}>
                {formatDate(e.date)} · {e.format} · {e.location}
                {e.date < today ? <Text style={{ color: '#B42318' }}>  (past)</Text> : null}
              </Text>
            </View>
            <PostActions
              confirming={confirmId === e.id}
              onEdit={() => edit(e)}
              onAskRemove={() => setConfirmId(e.id)}
              onRemove={() => remove(e)}
              onCancel={() => setConfirmId(null)}
            />
          </View>
        ))}
    </ScrollView>
  );
}

const JOB_TYPES = ['Graduate', 'Experienced', 'Internship'] as const;
type JobForm = { id: string | null; title: string; team: string; location: string; type: Job['type']; description: string; image: string };
const emptyJob = (): JobForm => ({ id: null, title: '', team: '', location: '', type: 'Experienced', description: '', image: '' });

function JobPostsTab() {
  const { jobs, reload } = useCatalog();
  const [form, setForm] = useState<JobForm>(emptyJob);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const set = <K extends keyof JobForm>(k: K, v: JobForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const edit = (j: Job) => {
    setMessage(null);
    setForm({ id: j.id, title: j.title, team: j.team, location: j.location, type: j.type, description: j.description ?? '', image: j.image ?? '' });
    scroller.current?.scrollTo({ y: 0, animated: true });
  };

  const save = async () => {
    if (busy) return;
    const title = form.title.trim();
    if (!title) return setMessage({ tone: 'error', text: 'Enter the job title.' });
    if (!form.team.trim()) return setMessage({ tone: 'error', text: 'Enter the team, for example Tax.' });
    if (!form.location.trim()) return setMessage({ tone: 'error', text: 'Enter the location.' });
    setBusy(true);
    setMessage(null);
    try {
      await saveSiteJob({
        id: form.id ?? undefined,
        title,
        team: form.team.trim(),
        location: form.location.trim(),
        type: form.type,
        description: form.description.trim(),
        image_url: form.image || null,
      });
      await reload();
      setMessage({ tone: 'success', text: `"${title}" ${form.id ? 'saved' : 'added'}. It is live on the Careers page now.` });
      setForm(emptyJob());
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Could not save the job.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (j: Job) => {
    setConfirmId(null);
    setMessage(null);
    try {
      await deleteSiteJob(j.id);
      if (form.id === j.id) setForm(emptyJob());
      await reload();
      setMessage({ tone: 'success', text: `"${j.title}" removed. Applications already received stay in Applications.` });
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Could not remove the job.' });
    }
  };

  return (
    <ScrollView ref={scroller} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <Text style={s.tabTitle}>Jobs</Text>
      <Text style={[s.rowMeta, { marginTop: 4 }]}>Add, change or remove the roles shown on the Careers page.</Text>

      <View style={[s.row, { marginTop: spacing.md, maxWidth: 760 }]}>
        <Text style={s.rowTitle}>{form.id ? `Edit "${form.title || 'job'}"` : 'Add a job'}</Text>
        <FormField label="Job title" value={form.title} onChangeText={(v) => set('title', v)} placeholder="e.g. Senior Tax Consultant" />
        <Text style={s.fieldLabel}>Type</Text>
        <Choices value={form.type} options={JOB_TYPES} onChange={(v) => set('type', v)} />
        <FormField label="Team" value={form.team} onChangeText={(v) => set('team', v)} placeholder="e.g. Tax" />
        <FormField label="Location" value={form.location} onChangeText={(v) => set('location', v)} placeholder="e.g. London" />
        <FormField
          label="Description (optional)"
          value={form.description}
          onChangeText={(v) => set('description', v)}
          multiline
          style={s.multiline}
          placeholder="About the role, shown on the application page."
        />
        <ImageField value={form.image} onChange={(v) => set('image', v)} />

        {message ? <FormAlert tone={message.tone} message={message.text} /> : null}
        <View style={[s.toolbarRow, { marginTop: spacing.md, flexWrap: 'wrap' }]}>
          <Pressable onPress={save} disabled={busy} style={[s.addBtn, busy && { opacity: 0.7 }]}>
            <Ionicons name={form.id ? 'save-outline' : 'add'} size={18} color={colors.onPrimary} />
            <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>{busy ? 'Saving…' : form.id ? 'Save changes' : 'Add job'}</Text>
          </Pressable>
          {form.id || form.title ? (
            <Pressable onPress={() => setForm(emptyJob())} style={s.exportBtn}>
              <Text style={s.exportText}>{form.id ? 'Cancel' : 'Clear'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Text style={[s.tabTitle, { fontSize: 18, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
        All jobs <Text style={s.count}>({jobs.length})</Text>
      </Text>
      {jobs.length === 0 ? <Text style={s.empty}>No jobs yet.</Text> : null}
      {jobs.map((j) => (
        <View key={j.id} style={[s.row, s.postRow]}>
          {j.image ? (
            <Image source={{ uri: j.image }} style={s.postThumb} contentFit="cover" />
          ) : (
            <View style={[s.postThumb, s.postThumbEmpty]}>
              <Ionicons name="briefcase-outline" size={22} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1, minWidth: 180 }}>
            <Text style={s.rowTitle}>{j.title}</Text>
            <Text style={s.rowMeta}>
              {j.type} · {j.team} · {j.location}
            </Text>
          </View>
          <PostActions
            confirming={confirmId === j.id}
            onEdit={() => edit(j)}
            onAskRemove={() => setConfirmId(j.id)}
            onRemove={() => remove(j)}
            onCancel={() => setConfirmId(null)}
          />
        </View>
      ))}
    </ScrollView>
  );
}

/** Admin sign-in shown at /admin to anyone who isn't a signed-in admin. */
function AdminSignIn({ currentEmail, onSignOut }: { currentEmail?: string; onSignOut: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (!EMAIL_RE.test(email.trim()) || !password) {
      setError('Enter your admin email and password.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={authStyles.screen} keyboardShouldPersistTaps="handled">
      <View style={authStyles.card}>
        <View style={s.adminMark}>
          <Ionicons name="shield-checkmark" size={26} color={colors.onPrimary} />
        </View>
        <Text style={authStyles.title}>Admin sign in</Text>
        <Text style={authStyles.subtitle}>For staff managing users, enquiries and applications.</Text>
        {currentEmail ? (
          <FormAlert
            message={`You're signed in as ${currentEmail}, which is not an admin account. Sign in below with an admin account.`}
          />
        ) : null}
        {error ? <FormAlert message={error} /> : null}
        <FormField
          label="Admin email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <FormField label="Password" value={password} onChangeText={setPassword} password autoComplete="current-password" onSubmitEditing={submit} />
        <Pressable onPress={submit} disabled={busy} style={[authStyles.button, { backgroundColor: colors.primary }, busy && { opacity: 0.7 }]}>
          {busy ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={authStyles.buttonText}>Sign in to admin</Text>}
        </Pressable>
        {currentEmail ? (
          <Pressable onPress={onSignOut} style={{ alignSelf: 'center', marginTop: spacing.md }} hitSlop={6}>
            <Text style={authStyles.link}>Sign out of {currentEmail}</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

/** List, add and remove admins. */
function AdminsTab() {
  const { user } = useAuth();
  const { data, error, refresh } = useLoad(listAdmins);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (busy) return;
    if (!EMAIL_RE.test(email.trim())) {
      setMessage({ tone: 'error', text: 'Enter a valid email address.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await addAdmin(email);
      setMessage({ tone: 'success', text: `${email.trim().toLowerCase()} is now an admin. They get access the next time they sign in.` });
      setEmail('');
      await refresh();
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Could not add admin.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (target: string) => {
    setMessage(null);
    try {
      await removeAdmin(target);
      setMessage({ tone: 'success', text: `${target} is no longer an admin.` });
      await refresh();
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Could not remove admin.' });
    }
  };

  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Text style={s.tabTitle}>Admins</Text>
      <Text style={[s.rowMeta, { marginTop: 4 }]}>Admins can see every user, enquiry and application, and add or remove other admins.</Text>

      <View style={[s.row, { marginTop: spacing.md }]}>
        <Text style={s.rowTitle}>Add an admin</Text>
        <Text style={s.rowMeta}>Enter the email they registered with (or will register with) in the app.</Text>
        <View style={[s.toolbarRow, { marginTop: spacing.sm }]}>
          <View style={s.search}>
            <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="name@company.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={s.searchInput}
              onSubmitEditing={add}
            />
          </View>
          <Pressable onPress={add} disabled={busy} style={[s.addBtn, busy && { opacity: 0.7 }]}>
            <Ionicons name="add" size={18} color={colors.onPrimary} />
            <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Add</Text>
          </Pressable>
        </View>
        {message ? <FormAlert tone={message.tone} message={message.text} /> : null}
      </View>

      <State error={error} loading={!data} />
      {data?.map((a) => {
        const me = a.email.toLowerCase() === user?.email.toLowerCase();
        return (
          <View key={a.email} style={[s.row, { flexDirection: 'row', alignItems: 'center' }]}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={s.rowTitle}>
                {a.email}
                {me ? <Text style={s.rowTopic}>  (you)</Text> : null}
              </Text>
              <Text style={s.rowDate}>Admin since {when(a.created_at)}</Text>
            </View>
            {me ? null : (
              <Pressable onPress={() => remove(a.email)} style={[s.status, { borderColor: '#B42318' }]}>
                <Text style={[s.statusText, { color: '#B42318' }]}>Remove</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

/** Change the signed-in admin's password, and sign out. */
function AccountTab() {
  const { user, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (busy) return;
    if (password.length < 8 || !/\d/.test(password) || !/[A-Z]/.test(password)) {
      setMessage({ tone: 'error', text: 'Use at least 8 characters, including a number and a capital letter.' });
      return;
    }
    if (password !== confirm) {
      setMessage({ tone: 'error', text: 'Passwords do not match.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await changePassword(password);
      setPassword('');
      setConfirm('');
      setMessage({ tone: 'success', text: 'Password changed. Use the new password next time you sign in.' });
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Could not change password.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <Text style={s.tabTitle}>My account</Text>
      <Text style={[s.rowMeta, { marginTop: 4 }]}>Signed in as {user?.email}</Text>
      <View style={[s.row, { marginTop: spacing.md, maxWidth: 480 }]}>
        <Text style={s.rowTitle}>Change password</Text>
        <FormField label="New password" value={password} onChangeText={setPassword} password autoComplete="new-password" />
        <FormField label="Confirm new password" value={confirm} onChangeText={setConfirm} password autoComplete="new-password" onSubmitEditing={save} />
        {message ? <FormAlert tone={message.tone} message={message.text} /> : null}
        <Pressable onPress={save} disabled={busy} style={[s.addBtn, { alignSelf: 'flex-start', marginTop: spacing.md }, busy && { opacity: 0.7 }]}>
          <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>{busy ? 'Saving…' : 'Save new password'}</Text>
        </Pressable>
      </View>
      <Pressable onPress={signOut} style={[s.exportBtn, { alignSelf: 'flex-start', marginTop: spacing.lg }]}>
        <Ionicons name="log-out-outline" size={16} color={colors.primary} />
        <Text style={s.exportText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

function UsersTab() {
  const { data, error, refreshing, refresh } = useLoad(adminProfiles);
  const [q, setQ] = useState('');
  const rows = useMemo(() => (data ?? []).filter((r) => matches(q, r.full_name, r.email, r.company)), [data, q]);
  return (
    <FlatList<ProfileRow>
      data={rows}
      keyExtractor={(r) => r.id}
      contentContainerStyle={s.pad}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      ListHeaderComponent={
        <>
          <Toolbar title="Users" count={rows.length} query={q} onQuery={setQ} onExport={() => exportCsv('users.csv', rows)} />
          <State error={error} loading={!data} />
        </>
      }
      ListEmptyComponent={data ? <Text style={s.empty}>No users yet.</Text> : undefined}
      renderItem={({ item }) => (
        <View style={s.row}>
          <Text style={s.rowTitle}>{item.full_name || '(no name)'}</Text>
          <Text style={s.rowMeta}>
            {item.email}
            {item.company ? ` · ${item.company}` : ''}
          </Text>
          <Text style={s.rowDate}>Joined {when(item.created_at)}</Text>
        </View>
      )}
    />
  );
}

function StatusPicker<S extends string>({ value, options, onChange }: { value: S; options: S[]; onChange: (s: S) => void }) {
  return (
    <View style={s.statusRow}>
      {options.map((o) => {
        const on = o === value;
        const c = STATUS_COLORS[o] ?? colors.primary;
        return (
          <Pressable key={o} onPress={() => !on && onChange(o)} style={[s.status, { borderColor: c }, on && { backgroundColor: c }]}>
            <Text style={[s.statusText, { color: on ? colors.onPrimary : c }]}>{label(o)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function EnquiriesTab() {
  const { data, setData, error, refreshing, refresh } = useLoad(adminEnquiries);
  const [q, setQ] = useState('');
  const [rowError, setRowError] = useState('');
  const rows = useMemo(() => (data ?? []).filter((r) => matches(q, r.full_name, r.email, r.company, r.topic, r.message, r.status)), [data, q]);

  const change = async (row: EnquiryRow, status: EnquiryStatus) => {
    setRowError('');
    try {
      await setEnquiryStatus(row.id, status);
      setData((prev) => prev?.map((r) => (r.id === row.id ? { ...r, status } : r)) ?? prev);
    } catch (e) {
      setRowError(e instanceof Error ? e.message : 'Could not update status.');
    }
  };

  return (
    <FlatList<EnquiryRow>
      data={rows}
      keyExtractor={(r) => String(r.id)}
      contentContainerStyle={s.pad}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      ListHeaderComponent={
        <>
          <Toolbar title="Enquiries" count={rows.length} query={q} onQuery={setQ} onExport={() => exportCsv('enquiries.csv', rows)} />
          <State error={error || rowError} loading={!data} />
        </>
      }
      ListEmptyComponent={data ? <Text style={s.empty}>No enquiries yet.</Text> : undefined}
      renderItem={({ item }) => (
        <View style={s.row}>
          <Text style={s.rowTitle}>
            {item.full_name}
            {item.topic ? <Text style={s.rowTopic}>  ·  {item.topic}</Text> : null}
          </Text>
          <Pressable onPress={() => Linking.openURL(`mailto:${item.email}`)}>
            <Text style={[s.rowMeta, { color: colors.primaryLink }]}>
              {item.email}
              {item.company ? <Text style={{ color: colors.textMuted }}> · {item.company}</Text> : null}
            </Text>
          </Pressable>
          <Text style={s.rowBody}>{item.message}</Text>
          <Text style={s.rowDate}>{when(item.created_at)}</Text>
          <StatusPicker value={item.status} options={ENQUIRY_STATUSES} onChange={(st) => change(item, st)} />
        </View>
      )}
    />
  );
}

function ApplicationsTab() {
  const { data, setData, error, refreshing, refresh } = useLoad(adminApplications);
  const [q, setQ] = useState('');
  const [rowError, setRowError] = useState('');
  const rows = useMemo(() => (data ?? []).filter((r) => matches(q, r.full_name, r.email, r.job_title, r.status)), [data, q]);

  const change = async (row: ApplicationRow, status: ApplicationStatus) => {
    setRowError('');
    try {
      await setApplicationStatus(row.id, status);
      setData((prev) => prev?.map((r) => (r.id === row.id ? { ...r, status } : r)) ?? prev);
    } catch (e) {
      setRowError(e instanceof Error ? e.message : 'Could not update status.');
    }
  };

  return (
    <FlatList<ApplicationRow>
      data={rows}
      keyExtractor={(r) => String(r.id)}
      contentContainerStyle={s.pad}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      ListHeaderComponent={
        <>
          <Toolbar title="Job applications" count={rows.length} query={q} onQuery={setQ} onExport={() => exportCsv('applications.csv', rows)} />
          <State error={error || rowError} loading={!data} />
        </>
      }
      ListEmptyComponent={data ? <Text style={s.empty}>No applications yet.</Text> : undefined}
      renderItem={({ item }) => (
        <View style={s.row}>
          <Text style={s.rowTitle}>
            {item.full_name}
            <Text style={s.rowTopic}>  ·  {item.job_title}</Text>
          </Text>
          <Text style={s.rowMeta}>
            {item.email}
            {item.phone ? ` · ${item.phone}` : ''}
          </Text>
          {item.cv_url ? (
            <Pressable onPress={() => Linking.openURL(item.cv_url!)}>
              <Text style={[s.rowMeta, { color: colors.primaryLink }]}>Open CV ↗</Text>
            </Pressable>
          ) : null}
          {item.message ? <Text style={s.rowBody}>{item.message}</Text> : null}
          <Text style={s.rowDate}>{when(item.created_at)}</Text>
          <StatusPicker value={item.status} options={APPLICATION_STATUSES} onChange={(st) => change(item, st)} />
        </View>
      )}
    />
  );
}

/** Newsletter sign-ups from the footer Subscribe form. */
function SubscribersTab() {
  const { data, setData, error, refreshing, refresh } = useLoad(adminSubscribers);
  const [q, setQ] = useState('');
  const [rowError, setRowError] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const rows = useMemo(() => (data ?? []).filter((r) => matches(q, r.email)), [data, q]);

  const remove = async (row: SubscriberRow) => {
    setConfirmId(null);
    setRowError('');
    try {
      await removeSubscriber(row.id);
      setData((prev) => prev?.filter((r) => r.id !== row.id) ?? prev);
    } catch (e) {
      setRowError(e instanceof Error ? e.message : 'Could not remove subscriber.');
    }
  };

  return (
    <FlatList<SubscriberRow>
      data={rows}
      keyExtractor={(r) => String(r.id)}
      contentContainerStyle={s.pad}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      ListHeaderComponent={
        <>
          <Toolbar title="Subscribers" count={rows.length} query={q} onQuery={setQ} onExport={() => exportCsv('subscribers.csv', rows)} />
          <State error={error || rowError} loading={!data} />
        </>
      }
      ListEmptyComponent={data ? <Text style={s.empty}>No subscribers yet.</Text> : undefined}
      renderItem={({ item }) => (
        <View style={[s.row, s.postRow]}>
          <Ionicons name="mail-open-outline" size={18} color={colors.primary} />
          <View style={{ flex: 1, minWidth: 180 }}>
            <Pressable onPress={() => Linking.openURL(`mailto:${item.email}`)}>
              <Text style={[s.rowTitle, { color: colors.primaryLink }]}>{item.email}</Text>
            </Pressable>
            <Text style={s.rowDate}>Subscribed {when(item.created_at)}</Text>
          </View>
          {confirmId === item.id ? (
            <View style={s.rowActions}>
              <Pressable onPress={() => remove(item)} style={[s.status, { borderColor: '#B42318', backgroundColor: '#B42318' }]}>
                <Text style={[s.statusText, { color: colors.onPrimary }]}>Yes, remove</Text>
              </Pressable>
              <Pressable onPress={() => setConfirmId(null)} style={[s.status, { borderColor: colors.border }]}>
                <Text style={[s.statusText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setConfirmId(item.id)} style={[s.status, { borderColor: '#B42318' }]}>
              <Text style={[s.statusText, { color: '#B42318' }]}>Remove</Text>
            </Pressable>
          )}
        </View>
      )}
    />
  );
}

function EventsTab() {
  const { data, error, refreshing, refresh } = useLoad(adminRegistrations);
  const [q, setQ] = useState('');
  const rows = useMemo(() => (data ?? []).filter((r) => matches(q, r.event_title, r.full_name, r.email)), [data, q]);
  return (
    <FlatList<RegistrationRow>
      data={rows}
      keyExtractor={(r) => String(r.id)}
      contentContainerStyle={s.pad}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      ListHeaderComponent={
        <>
          <Toolbar title="Event sign-ups" count={rows.length} query={q} onQuery={setQ} onExport={() => exportCsv('event-signups.csv', rows)} />
          <State error={error} loading={!data} />
        </>
      }
      ListEmptyComponent={data ? <Text style={s.empty}>No event sign-ups yet.</Text> : undefined}
      renderItem={({ item }) => (
        <View style={s.row}>
          <Text style={s.rowTitle}>{item.event_title}</Text>
          <Text style={s.rowMeta}>
            {item.full_name || '(no name)'} · {item.email}
          </Text>
          <Text style={s.rowDate}>{when(item.created_at)}</Text>
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  pad: { padding: spacing.md, paddingBottom: spacing.xl },

  sidebar: { width: 240, backgroundColor: colors.surface, borderRightWidth: 1, borderColor: colors.border, paddingVertical: spacing.lg },
  sidebarTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, color: colors.textMuted, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  sideItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 12 },
  sideItemOn: { backgroundColor: '#EEF2F7' },
  sideText: { fontSize: 15, fontWeight: '600', color: colors.text },

  chipsBar: { flexGrow: 0, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border },
  chips: { gap: spacing.sm, padding: spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontWeight: '600', color: colors.text },

  tabTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  count: { fontSize: 16, fontWeight: '600', color: colors.textMuted },
  toolbar: { marginBottom: spacing.md, gap: spacing.sm },
  toolbarRow: { flexDirection: 'row', gap: spacing.sm },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 14, color: colors.text },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 8,
  },
  exportText: { color: colors.primary, fontWeight: '700' },

  // Cells use a percentage width plus padding (instead of gap) so columns divide evenly.
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, marginHorizontal: -6 },
  statCell: { padding: 6 },
  // No fixed height: every card has the same lines (the sub-line is always reserved),
  // so they size identically from their content and text is never clipped at large zoom levels.
  statCard: {
    flexGrow: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  statValue: { fontSize: 32, fontWeight: '800', color: colors.primary, marginTop: spacing.sm },
  statLabel: { fontSize: 14, color: colors.text, fontWeight: '600' },
  statSub: { fontSize: 13, color: colors.accent, fontWeight: '700' },

  row: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm, gap: 4 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  rowTopic: { fontSize: 14, fontWeight: '600', color: colors.accent },
  rowMeta: { fontSize: 14, color: colors.textMuted },
  rowBody: { fontSize: 14, lineHeight: 21, color: colors.text, marginTop: 4 },
  rowDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  status: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.lg, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: '700' },
  empty: { color: colors.textMuted, marginTop: spacing.lg, textAlign: 'center' },

  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  activityIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8EEF6', alignItems: 'center', justifyContent: 'center' },
  adminMark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },

  // Services tab
  fieldLabel: { fontWeight: '600', color: colors.text, marginTop: spacing.md },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  choiceOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  iconChoice: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  photo: { width: 104, borderWidth: 2, borderColor: 'transparent', borderRadius: radius.sm, padding: 2 },
  photoOn: { borderColor: colors.primaryLink },
  photoImg: { width: '100%', height: 64, borderRadius: radius.sm - 2 },
  photoLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  serviceHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    paddingVertical: 8,
    paddingLeft: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  subTitle: { fontSize: 15, color: colors.text },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leaderGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md },
  leaderCell: { flexGrow: 1, flexBasis: 220 },

  // Jobs tab
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm, alignItems: 'flex-start' },
  imagePreview: { width: 160, height: 100, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: '#E8EEF6' },
  imageBusy: { backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  postRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  postThumb: { width: 72, height: 48, borderRadius: radius.sm, backgroundColor: '#E8EEF6' },
  postThumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  badge: { fontSize: 12, fontWeight: '700', color: colors.textMuted, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#EEF2F7', borderRadius: radius.lg },
});
