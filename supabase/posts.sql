-- Events and job posts that admins manage from the in-app admin panel (Admin > Events / Jobs),
-- plus a storage bucket for the photos they upload.
-- Run AFTER schema.sql and admin.sql: Supabase dashboard > SQL Editor > New query > paste > Run.
-- Safe to re-run: the starting events and jobs are only inserted if they don't exist yet,
-- so edits and deletions made in the admin panel are kept.

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
create table if not exists public.site_events (
  -- Matches event_registrations.event_id.
  id text primary key default gen_random_uuid()::text,
  title text not null check (length(trim(title)) between 1 and 160),
  date date not null,
  format text not null default 'Webinar' check (format in ('Webinar', 'In person')),
  location text not null default 'Online' check (length(location) <= 120),
  description text not null default '' check (length(description) <= 4000),
  -- Uploaded photo (site-images bucket) or any https link; null = default photo for the format.
  image_url text check (image_url is null or image_url ~ '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_events enable row level security;

-- ---------------------------------------------------------------------------
-- Job posts
-- ---------------------------------------------------------------------------
create table if not exists public.site_jobs (
  -- Matches job_applications.job_id.
  id text primary key default gen_random_uuid()::text,
  title text not null check (length(trim(title)) between 1 and 160),
  team text not null default '' check (length(team) <= 120),
  location text not null default '' check (length(location) <= 120),
  type text not null default 'Experienced' check (type in ('Graduate', 'Experienced', 'Internship')),
  description text not null default '' check (length(description) <= 4000),
  image_url text check (image_url is null or image_url ~ '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_jobs enable row level security;

-- ---------------------------------------------------------------------------
-- Access: everyone can read, only admins (public.admins) can change
-- ---------------------------------------------------------------------------
drop policy if exists "Anyone reads events" on public.site_events;
create policy "Anyone reads events" on public.site_events for select to anon, authenticated using (true);
drop policy if exists "Admins add events" on public.site_events;
create policy "Admins add events" on public.site_events for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "Admins update events" on public.site_events;
create policy "Admins update events" on public.site_events
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Admins remove events" on public.site_events;
create policy "Admins remove events" on public.site_events for delete to authenticated using ((select public.is_admin()));

drop policy if exists "Anyone reads jobs" on public.site_jobs;
create policy "Anyone reads jobs" on public.site_jobs for select to anon, authenticated using (true);
drop policy if exists "Admins add jobs" on public.site_jobs;
create policy "Admins add jobs" on public.site_jobs for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "Admins update jobs" on public.site_jobs;
create policy "Admins update jobs" on public.site_jobs
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Admins remove jobs" on public.site_jobs;
create policy "Admins remove jobs" on public.site_jobs for delete to authenticated using ((select public.is_admin()));

grant select on public.site_events, public.site_jobs to anon, authenticated;
grant insert, update, delete on public.site_events, public.site_jobs to authenticated;

-- Keep updated_at current on every edit.
create or replace function public.posts_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists site_events_touch on public.site_events;
create trigger site_events_touch before update on public.site_events for each row execute function public.posts_touch();
drop trigger if exists site_jobs_touch on public.site_jobs;
create trigger site_jobs_touch before update on public.site_jobs for each row execute function public.posts_touch();

-- ---------------------------------------------------------------------------
-- Starting content (the events and jobs the app shipped with). Same ids, so existing
-- sign-ups and applications stay linked. Skipped for any id that already exists.
-- ---------------------------------------------------------------------------
insert into public.site_events (id, title, date, format, location, description, created_at) values
  ('e1', 'Autumn Budget briefing', '2026-11-12', 'Webinar', 'Online', 'Our tax partners walk through the Budget and answer your questions live.', now() - interval '6 minutes'),
  ('e2', 'Selling your business: getting deal-ready', '2026-11-26', 'In person', 'Manchester', 'A practical session for owners considering an exit in the next three years.', now() - interval '5 minutes'),
  ('e3', 'Cyber risk for boards', '2026-12-03', 'Webinar', 'Online', 'How directors can oversee cyber risk effectively.', now() - interval '4 minutes'),
  ('e4', 'Year-end reporting update', '2026-12-10', 'In person', 'London', 'Key accounting changes finance teams need to know before year end.', now() - interval '3 minutes'),
  ('e5', 'Net zero for mid-sized businesses', '2027-01-14', 'Webinar', 'Online', 'A practical first step guide to measuring and cutting your carbon footprint.', now() - interval '2 minutes'),
  ('e6', 'Scaling AI in your finance team', '2027-01-28', 'In person', 'Edinburgh', 'Hear from finance leaders who have moved AI from pilot to everyday use.', now() - interval '1 minute')
on conflict (id) do nothing;

insert into public.site_jobs (id, title, team, location, type, created_at) values
  ('j1', 'Graduate Auditor', 'Audit & Assurance', 'London', 'Graduate', now() - interval '8 minutes'),
  ('j2', 'Tax Trainee', 'Tax', 'Manchester', 'Graduate', now() - interval '7 minutes'),
  ('j3', 'Summer Intern, Advisory', 'Advisory', 'Birmingham', 'Internship', now() - interval '6 minutes'),
  ('j4', 'Transaction Services Manager', 'Advisory', 'London', 'Experienced', now() - interval '5 minutes'),
  ('j5', 'Payroll Specialist', 'Business Services & Outsourcing', 'Leeds', 'Experienced', now() - interval '4 minutes'),
  ('j6', 'Cyber Security Consultant', 'Cybersecurity', 'Manchester', 'Experienced', now() - interval '3 minutes'),
  ('j7', 'Graduate, Sustainability & ESG', 'Sustainability & ESG', 'Bristol', 'Graduate', now() - interval '2 minutes'),
  ('j8', 'Spring Insight Intern', 'All services', 'Glasgow', 'Internship', now() - interval '1 minute')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Photo uploads: public bucket "site-images" (anyone can view, only admins upload/remove)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-images', 'site-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins upload site images" on storage.objects;
create policy "Admins upload site images" on storage.objects
  for insert to authenticated with check (bucket_id = 'site-images' and (select public.is_admin()));

drop policy if exists "Admins update site images" on storage.objects;
create policy "Admins update site images" on storage.objects
  for update to authenticated using (bucket_id = 'site-images' and (select public.is_admin()));

drop policy if exists "Admins remove site images" on storage.objects;
create policy "Admins remove site images" on storage.objects
  for delete to authenticated using (bucket_id = 'site-images' and (select public.is_admin()));
