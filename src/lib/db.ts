// Database helpers for the tables in supabase/schema.sql.
// Every call runs as the signed-in user; Row Level Security keeps each user to their own rows.
import type { Leader } from '@/data/content';

import { supabase } from './supabase';

function client() {
  if (!supabase) throw new Error('The database is not set up yet. Add your Supabase keys to .env.local.');
  return supabase;
}

/** Turns database errors into messages a user can act on. */
function fail(message: string): never {
  const m = message.toLowerCase();
  if ((m.includes('relation') && m.includes('does not exist')) || m.includes('schema cache')) {
    const table = message.match(/public\.(\w+)/)?.[1];
    const files: Record<string, string> = {
      admins: 'admin.sql',
      site_services: 'services.sql',
      site_events: 'posts.sql',
      site_jobs: 'posts.sql',
      site_offices: 'offices.sql',
      newsletter_subscribers: 'newsletter.sql',
    };
    const file = (table && files[table]) || 'schema.sql';
    throw new Error(
      `This feature isn't set up in the database yet${table ? ` (missing table "${table}")` : ''}. Run supabase/${file} in the Supabase SQL Editor.`,
    );
  }
  if (m.includes('jwt') || m.includes('not authenticated') || m.includes('row-level security')) {
    throw new Error('Your session has expired. Please log out and log in again.');
  }
  if (m.includes('fetch') || m.includes('network')) throw new Error('Could not reach the server. Check your connection.');
  throw new Error(message);
}

// ----- enquiries -------------------------------------------------------------

export async function submitEnquiry(input: { fullName: string; email: string; company?: string; topic?: string; message: string }) {
  const { error } = await client()
    .from('enquiries')
    .insert({
      full_name: input.fullName.trim(),
      email: input.email.trim(),
      company: input.company?.trim() || null,
      topic: input.topic?.trim() || null,
      message: input.message.trim(),
    });
  if (error) fail(error.message);
}

// ----- event_registrations ---------------------------------------------------

/** Ids of the events the signed-in user is registered for. */
export async function myEventRegistrations(): Promise<Set<string>> {
  const { data, error } = await client().from('event_registrations').select('event_id');
  if (error) fail(error.message);
  return new Set((data ?? []).map((r) => r.event_id as string));
}

export async function registerForEvent(input: { eventId: string; eventTitle: string; fullName: string; email: string }) {
  const { error } = await client().from('event_registrations').insert({
    event_id: input.eventId,
    event_title: input.eventTitle,
    full_name: input.fullName,
    email: input.email,
  });
  // Already registered (unique constraint) counts as success.
  if (error && error.code !== '23505') fail(error.message);
}

export async function cancelEventRegistration(eventId: string) {
  const { error } = await client().from('event_registrations').delete().eq('event_id', eventId);
  if (error) fail(error.message);
}

// ----- job_applications ------------------------------------------------------

export async function submitJobApplication(input: {
  jobId: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone?: string;
  cvUrl?: string;
  message?: string;
}) {
  const { error } = await client()
    .from('job_applications')
    .insert({
      job_id: input.jobId,
      job_title: input.jobTitle,
      full_name: input.fullName.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || null,
      cv_url: input.cvUrl?.trim() || null,
      message: input.message?.trim() || null,
    });
  if (error) fail(error.message);
}

// ----- cyber_check_results ---------------------------------------------------

export async function saveCyberCheckResult(input: { answers: Record<string, number>; score: number; result: string }) {
  const { error } = await client().from('cyber_check_results').insert(input);
  if (error) fail(error.message);
}

// ----- admin -----------------------------------------------------------------
// These only return everyone's rows for accounts listed in public.admins (see supabase/admin.sql);
// for anyone else Row Level Security limits results to their own rows.

export type EnquiryStatus = 'new' | 'in_progress' | 'replied' | 'closed';
export type ApplicationStatus = 'received' | 'reviewing' | 'interview' | 'rejected' | 'hired';

export type ProfileRow = { id: string; full_name: string | null; email: string | null; company: string | null; created_at: string };
export type EnquiryRow = {
  id: number;
  full_name: string;
  email: string;
  company: string | null;
  topic: string | null;
  message: string;
  status: EnquiryStatus;
  created_at: string;
};
export type RegistrationRow = { id: number; event_title: string; full_name: string | null; email: string | null; created_at: string };
export type ApplicationRow = {
  id: number;
  job_title: string;
  full_name: string;
  email: string;
  phone: string | null;
  cv_url: string | null;
  message: string | null;
  status: ApplicationStatus;
  created_at: string;
};

/** True when the signed-in user is an admin. Missing setup counts as "not admin". */
export async function amIAdmin(): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
}

export async function adminCounts() {
  const count = async (table: string, status?: string) => {
    let q = client().from(table).select('*', { count: 'exact', head: true });
    if (status) q = q.eq('status', status);
    const { count: n, error } = await q;
    if (error) fail(error.message);
    return n ?? 0;
  };
  const [users, enquiries, newEnquiries, applications, newApplications, registrations, cyberChecks, admins] =
    await Promise.all([
      count('profiles'),
      count('enquiries'),
      count('enquiries', 'new'),
      count('job_applications'),
      count('job_applications', 'received'),
      count('event_registrations'),
      count('cyber_check_results'),
      count('admins'),
    ]);
  return { users, enquiries, newEnquiries, applications, newApplications, registrations, cyberChecks, admins };
}

export type ActivityItem = { kind: 'user' | 'enquiry' | 'application' | 'event' | 'cyber'; title: string; detail: string; at: string };

/** The most recent activity across every table, newest first. */
export async function adminRecentActivity(limit = 12): Promise<ActivityItem[]> {
  const recent = async (table: string, columns: string) => {
    const { data, error } = await client().from(table).select(columns).order('created_at', { ascending: false }).limit(limit);
    if (error) fail(error.message);
    return (data ?? []) as unknown as Record<string, string>[];
  };
  const [users, enquiries, applications, events, cyber] = await Promise.all([
    recent('profiles', 'full_name, email, created_at'),
    recent('enquiries', 'full_name, topic, created_at'),
    recent('job_applications', 'full_name, job_title, created_at'),
    recent('event_registrations', 'full_name, event_title, created_at'),
    recent('cyber_check_results', 'result, score, created_at'),
  ]);
  const items: ActivityItem[] = [
    ...users.map((r) => ({ kind: 'user' as const, title: 'New user', detail: `${r.full_name || r.email}`, at: r.created_at })),
    ...enquiries.map((r) => ({ kind: 'enquiry' as const, title: 'New enquiry', detail: `${r.full_name}${r.topic ? ` · ${r.topic}` : ''}`, at: r.created_at })),
    ...applications.map((r) => ({ kind: 'application' as const, title: 'Job application', detail: `${r.full_name} · ${r.job_title}`, at: r.created_at })),
    ...events.map((r) => ({ kind: 'event' as const, title: 'Event sign-up', detail: `${r.full_name || 'Someone'} · ${r.event_title}`, at: r.created_at })),
    ...cyber.map((r) => ({ kind: 'cyber' as const, title: 'Cyber Risk Check', detail: `${r.result} · ${r.score}%`, at: r.created_at })),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

// ----- admins ----------------------------------------------------------------

export type AdminRow = { email: string; created_at: string };

export const listAdmins = () => listAll<AdminRow>('admins', 'email, created_at');

export async function addAdmin(email: string) {
  const { error } = await client().from('admins').insert({ email: email.trim().toLowerCase() });
  if (error?.code === '23505') throw new Error('That email is already an admin.');
  if (error) fail(error.message);
}

export async function removeAdmin(email: string) {
  const { error, count } = await client().from('admins').delete({ count: 'exact' }).eq('email', email);
  if (error) fail(error.message);
  if (count === 0) throw new Error('You cannot remove your own admin access.');
}

/** Changes the signed-in user's password. */
export async function changePassword(newPassword: string) {
  const { error } = await client().auth.updateUser({ password: newPassword });
  if (error) fail(error.message);
}

async function listAll<T>(table: string, columns: string): Promise<T[]> {
  const { data, error } = await client().from(table).select(columns).order('created_at', { ascending: false }).limit(500);
  if (error) fail(error.message);
  return (data ?? []) as T[];
}

export const adminProfiles = () => listAll<ProfileRow>('profiles', 'id, full_name, email, company, created_at');
export const adminEnquiries = () => listAll<EnquiryRow>('enquiries', 'id, full_name, email, company, topic, message, status, created_at');
export const adminApplications = () =>
  listAll<ApplicationRow>('job_applications', 'id, job_title, full_name, email, phone, cv_url, message, status, created_at');
export const adminRegistrations = () => listAll<RegistrationRow>('event_registrations', 'id, event_title, full_name, email, created_at');

export async function setEnquiryStatus(id: number, status: EnquiryStatus) {
  const { error } = await client().from('enquiries').update({ status }).eq('id', id);
  if (error) fail(error.message);
}

export async function setApplicationStatus(id: number, status: ApplicationStatus) {
  const { error } = await client().from('job_applications').update({ status }).eq('id', id);
  if (error) fail(error.message);
}

// ----- site_services (admin-managed services, see supabase/services.sql) -----

export type SiteServiceRow = {
  id: string;
  /** null = main service; otherwise the id of the main service it sits under. */
  parent_id: string | null;
  title: string;
  summary: string;
  description: string;
  icon: string;
  image: string;
  points: string[];
  overview: string[];
  /** For a built-in service or page: true = removed from the site. */
  hidden: boolean;
  /** "Meet our leader" contact; null = the default contact. */
  leader: Leader | null;
  /** Which menu the row belongs to: a service (default), or a page / link in the Insights or About menu. */
  section: MenuSection;
  /** Insights / About items: an outside web address the menu item opens instead of a page. */
  link: string | null;
  created_at: string;
};

export type MenuSection = 'service' | 'insights' | 'about';

export type SiteServiceInput = Omit<SiteServiceRow, 'created_at' | 'section' | 'link'> & { section?: MenuSection; link?: string | null };

const SERVICE_COLUMNS = 'id, parent_id, title, summary, description, icon, image, points, overview, created_at';

/** Every admin-added service and built-in override, oldest first (so new ones appear at the end of the menu). */
export async function listSiteServices(): Promise<SiteServiceRow[]> {
  const load = async (columns: string) => {
    const { data, error } = await client().from('site_services').select(columns).order('created_at', { ascending: true }).limit(500);
    return { rows: (data ?? []) as unknown as Partial<SiteServiceRow>[], error };
  };
  let { rows, error } = await load(`${SERVICE_COLUMNS}, hidden, leader, section, link`);
  // Before the newer columns are added (re-run supabase/services.sql), still show admin-added services.
  if (error?.code === '42703') ({ rows, error } = await load(`${SERVICE_COLUMNS}, hidden, leader`));
  if (error?.code === '42703') ({ rows, error } = await load(SERVICE_COLUMNS));
  if (error) fail(error.message);
  return rows.map(
    (r) => ({ ...r, hidden: r.hidden ?? false, leader: r.leader ?? null, section: r.section ?? 'service', link: r.link ?? null }) as SiteServiceRow,
  );
}

/** Creates or replaces the row with this id (used to edit or remove built-in services). */
export async function upsertSiteService(input: SiteServiceInput) {
  const { error } = await client().from('site_services').upsert(input, { onConflict: 'id' });
  if (error?.code === '42703' || error?.code === 'PGRST204') {
    throw new Error('Editing built-in services needs a database update. Run supabase/services.sql again in the Supabase SQL Editor.');
  }
  if (error) fail(error.message);
}

/** Removes the change made to a built-in service, bringing back the original (Reset / Restore). */
export async function resetSiteService(id: string) {
  const { error } = await client().from('site_services').delete().eq('id', id);
  if (error) fail(error.message);
}

/** Leaves out the newer columns when they are unused, so saving works before they exist in the database. */
const withoutHidden = ({ hidden, leader, section, link, ...rest }: SiteServiceInput) => ({
  ...rest,
  ...(hidden ? { hidden } : {}),
  ...(leader ? { leader } : {}),
  ...(section && section !== 'service' ? { section } : {}),
  ...(link ? { link } : {}),
});

export async function createSiteService(input: SiteServiceInput) {
  const { error } = await client().from('site_services').insert(withoutHidden(input));
  if (error?.code === '23505') throw new Error('A service with this web address already exists. Change the title slightly.');
  if (error) fail(error.message);
}

export async function updateSiteService(input: SiteServiceInput) {
  const { id, ...fields } = withoutHidden(input);
  // Always send the leader so clearing it in the form removes it.
  const { error, count } = await client()
    .from('site_services')
    // Menu pages always send their link, so clearing it turns the item back into a page.
    .update({ ...fields, leader: input.leader, ...(input.section && input.section !== 'service' ? { link: input.link ?? null } : {}) }, { count: 'exact' })
    .eq('id', id);
  if (error?.code === '42703' || error?.code === 'PGRST204') {
    throw new Error('The leader field needs a database update. Run supabase/services.sql again in the Supabase SQL Editor.');
  }
  if (error) fail(error.message);
  if (count === 0) throw new Error('Could not save: only admins can change services.');
}

/** Removes a service; removing a main service also removes the sub-services under it. */
export async function deleteSiteService(id: string) {
  const { error, count } = await client().from('site_services').delete({ count: 'exact' }).or(`id.eq.${id},parent_id.eq.${id}`);
  if (error) fail(error.message);
  if (count === 0) throw new Error('Could not remove: only admins can change services.');
}

// ----- site_events / site_jobs (admin-managed posts, see supabase/posts.sql) --

export type SiteEventRow = {
  id: string;
  title: string;
  date: string;
  format: 'Webinar' | 'In person';
  location: string;
  description: string;
  image_url: string | null;
  created_at: string;
};

const EVENT_COLUMNS = 'id, title, date, format, location, description, image_url, created_at';

export async function listSiteEvents(): Promise<SiteEventRow[]> {
  const { data, error } = await client().from('site_events').select(EVENT_COLUMNS).order('date', { ascending: true }).limit(500);
  if (error) fail(error.message);
  return (data ?? []) as SiteEventRow[];
}

/** Adds (no id) or updates (with id) an event post. */
export async function saveSiteEvent(row: Omit<SiteEventRow, 'id' | 'created_at'> & { id?: string }) {
  await savePost('site_events', row);
}

export const deleteSiteEvent = (id: string) => deletePost('site_events', id);

export type SiteJobRow = {
  id: string;
  title: string;
  team: string;
  location: string;
  type: 'Graduate' | 'Experienced' | 'Internship';
  description: string;
  image_url: string | null;
};

const JOB_COLUMNS = 'id, title, team, location, type, description, image_url';

export async function listSiteJobs(): Promise<SiteJobRow[]> {
  const { data, error } = await client()
    .from('site_jobs')
    .select(JOB_COLUMNS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(500);
  if (error) fail(error.message);
  return (data ?? []) as SiteJobRow[];
}

/** Adds (no id) or updates (with id) a job post. */
export async function saveSiteJob(row: Omit<SiteJobRow, 'id'> & { id?: string }) {
  await savePost('site_jobs', row);
}

export const deleteSiteJob = (id: string) => deletePost('site_jobs', id);

async function savePost(table: string, row: { id?: string } & Record<string, unknown>) {
  const { id, ...fields } = row;
  if (id) {
    const { error, count } = await client().from(table).update(fields, { count: 'exact' }).eq('id', id);
    if (error) fail(error.message);
    if (count === 0) throw new Error('Could not save: this post was removed, or your account is not an admin.');
  } else {
    const { error } = await client().from(table).insert(fields);
    if (error) fail(error.message);
  }
}

async function deletePost(table: string, id: string) {
  const { error, count } = await client().from(table).delete({ count: 'exact' }).eq('id', id);
  if (error) fail(error.message);
  if (count === 0) throw new Error('Could not remove: only admins can change posts.');
}

/** A photo chosen with expo-image-picker (only the fields used here). */
export type PickedImage = { uri: string; mimeType?: string | null; file?: Blob | null };

/** Uploads a photo to the public "site-images" bucket and returns its web link. */
export async function uploadSiteImage(image: PickedImage): Promise<string> {
  const type = image.mimeType || image.file?.type || 'image/jpeg';
  const ext = (type.split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace(/[^a-z0-9]/g, '');
  const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  // Web gives a File; on phones read the local file into memory.
  const body = image.file ?? (await (await fetch(image.uri)).arrayBuffer());
  const bucket = client().storage.from('site-images');
  const { error } = await bucket.upload(path, body, { contentType: type, upsert: false });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes('bucket not found')) throw new Error('Photo uploads are not set up yet. Run supabase/posts.sql in the Supabase SQL Editor.');
    if (m.includes('exceeded') || m.includes('too large')) throw new Error('That photo is too big. Choose one under 5 MB.');
    if (m.includes('mime') || m.includes('not supported')) throw new Error('Use a JPG, PNG, WebP or GIF photo.');
    fail(error.message);
  }
  return bucket.getPublicUrl(path).data.publicUrl;
}

// ----- newsletter_subscribers (footer Subscribe form, see supabase/newsletter.sql) ---

export type SubscriberRow = { id: number; email: string; created_at: string };

/** Adds an email to the newsletter list. Subscribing twice counts as success. */
export async function subscribeToNewsletter(email: string) {
  const { error } = await client().from('newsletter_subscribers').insert({ email: email.trim().toLowerCase() });
  if (error && error.code !== '23505') fail(error.message);
}

export const adminSubscribers = () => listAll<SubscriberRow>('newsletter_subscribers', 'id, email, created_at');

export async function removeSubscriber(id: number) {
  const { error } = await client().from('newsletter_subscribers').delete().eq('id', id);
  if (error) fail(error.message);
}

// ----- site_offices (admin-managed office locations, see supabase/offices.sql) ---

export type SiteOfficeRow = {
  id: string;
  city: string;
  country: string;
  address: string;
  phone: string;
  map_url: string | null;
  image_url: string | null;
};

/** Every office, newest first (so offices an admin adds appear at the top). */
export async function listSiteOffices(): Promise<SiteOfficeRow[]> {
  const { data, error } = await client()
    .from('site_offices')
    .select('id, city, country, address, phone, map_url, image_url')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) fail(error.message);
  return (data ?? []) as SiteOfficeRow[];
}

/** Adds (no id) or updates (with id) an office. */
export async function saveSiteOffice(row: Omit<SiteOfficeRow, 'id'> & { id?: string }) {
  await savePost('site_offices', row);
}

export const deleteSiteOffice = (id: string) => deletePost('site_offices', id);
