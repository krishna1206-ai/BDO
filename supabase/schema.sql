-- Northbridge app database schema.
-- Run once in the Supabase dashboard: SQL Editor > New query > paste this file > Run.
-- Safe to re-run: every statement checks whether the object already exists.
--
-- Security model (Row Level Security on every table):
--   * Signed-in users can add records for themselves and read only their own records.
--   * You (the project owner) can see everything in the dashboard's Table Editor,
--     because the dashboard bypasses Row Level Security.

-- ---------------------------------------------------------------------------
-- 1. profiles: one row per registered user, filled automatically on sign-up
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  company text,
  phone text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Copy name/company from the registration form (stored as user metadata) into profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, company)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.email,
    new.raw_user_meta_data ->> 'company'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profiles for anyone who registered before this script ran.
insert into public.profiles (id, full_name, email, company)
select id, raw_user_meta_data ->> 'name', email, raw_user_meta_data ->> 'company'
from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. enquiries: Contact us form
-- ---------------------------------------------------------------------------
create table if not exists public.enquiries (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  company text,
  topic text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'replied', 'closed')),
  created_at timestamptz not null default now()
);
alter table public.enquiries enable row level security;

drop policy if exists "Users create own enquiries" on public.enquiries;
create policy "Users create own enquiries" on public.enquiries
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users read own enquiries" on public.enquiries;
create policy "Users read own enquiries" on public.enquiries
  for select to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 3. event_registrations: "Register" on the Events screen
-- ---------------------------------------------------------------------------
create table if not exists public.event_registrations (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  event_id text not null,
  event_title text not null,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);
alter table public.event_registrations enable row level security;

drop policy if exists "Users register themselves" on public.event_registrations;
create policy "Users register themselves" on public.event_registrations
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users read own registrations" on public.event_registrations;
create policy "Users read own registrations" on public.event_registrations
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users cancel own registrations" on public.event_registrations;
create policy "Users cancel own registrations" on public.event_registrations
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 4. job_applications: "Apply now" on Careers
-- ---------------------------------------------------------------------------
create table if not exists public.job_applications (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  job_id text not null,
  job_title text not null,
  full_name text not null,
  email text not null,
  phone text,
  cv_url text,
  message text,
  status text not null default 'received' check (status in ('received', 'reviewing', 'interview', 'rejected', 'hired')),
  created_at timestamptz not null default now()
);
alter table public.job_applications enable row level security;

drop policy if exists "Users submit own applications" on public.job_applications;
create policy "Users submit own applications" on public.job_applications
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users read own applications" on public.job_applications;
create policy "Users read own applications" on public.job_applications
  for select to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 5. cyber_check_results: Cyber Risk Check quiz
-- ---------------------------------------------------------------------------
create table if not exists public.cyber_check_results (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  answers jsonb not null,
  score integer not null check (score between 0 and 100),
  result text not null,
  created_at timestamptz not null default now()
);
alter table public.cyber_check_results enable row level security;

drop policy if exists "Users save own results" on public.cyber_check_results;
create policy "Users save own results" on public.cyber_check_results
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users read own results" on public.cyber_check_results;
create policy "Users read own results" on public.cyber_check_results
  for select to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 6. saved_insights: "Save" button on articles
-- ---------------------------------------------------------------------------
create table if not exists public.saved_insights (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  insight_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, insight_id)
);
alter table public.saved_insights enable row level security;

drop policy if exists "Users save insights" on public.saved_insights;
create policy "Users save insights" on public.saved_insights
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users read saved insights" on public.saved_insights;
create policy "Users read saved insights" on public.saved_insights
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users unsave insights" on public.saved_insights;
create policy "Users unsave insights" on public.saved_insights
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Table privileges for signed-in users (Row Level Security above still applies).
-- ---------------------------------------------------------------------------
grant select, update on public.profiles to authenticated;
grant select, insert on public.enquiries to authenticated;
grant select, insert, delete on public.event_registrations to authenticated;
grant select, insert on public.job_applications to authenticated;
grant select, insert on public.cyber_check_results to authenticated;
grant select, insert, delete on public.saved_insights to authenticated;
