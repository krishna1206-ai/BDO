import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useAuth } from '@/lib/auth';
import {
  addAdmin,
  adminApplications,
  adminCounts,
  adminEnquiries,
  adminProfiles,
  adminRecentActivity,
  adminRegistrations,
  changePassword,
  listAdmins,
  removeAdmin,
  setApplicationStatus,
  setEnquiryStatus,
  type ActivityItem,
  type ApplicationRow,
  type ApplicationStatus,
  type EnquiryRow,
  type EnquiryStatus,
  type ProfileRow,
  type RegistrationRow,
} from '@/lib/db';
import { colors, radius, spacing } from '@/theme';

type Tab = 'overview' | 'users' | 'enquiries' | 'applications' | 'events' | 'admins' | 'account';

const TABS: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'overview', label: 'Overview', icon: 'speedometer-outline' },
  { id: 'users', label: 'Users', icon: 'people-outline' },
  { id: 'enquiries', label: 'Enquiries', icon: 'mail-outline' },
  { id: 'applications', label: 'Applications', icon: 'briefcase-outline' },
  { id: 'events', label: 'Event sign-ups', icon: 'calendar-outline' },
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
        {tab === 'users' ? <UsersTab /> : null}
        {tab === 'enquiries' ? <EnquiriesTab /> : null}
        {tab === 'applications' ? <ApplicationsTab /> : null}
        {tab === 'events' ? <EventsTab /> : null}
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
    { label: 'Saved articles', value: c?.savedInsights, icon: 'bookmark-outline' },
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
      // Replying opens the conversation with the person who sent the enquiry.
      if (status === 'replied') router.push(`/chat/${row.id}`);
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
          <Pressable onPress={() => router.push(`/chat/${item.id}`)} style={[s.exportBtn, { alignSelf: 'flex-start', marginTop: spacing.sm }]}>
            <Ionicons name="chatbubbles-outline" size={16} color={colors.primary} />
            <Text style={s.exportText}>Chat</Text>
          </Pressable>
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
});
