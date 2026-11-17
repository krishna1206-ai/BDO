-- Admin access for the in-app admin panel (/admin).
-- Run AFTER schema.sql: Supabase dashboard > SQL Editor > New query > paste > Run. Safe to re-run.
--
-- IMPORTANT, do this in order:
--   1. Register your admin account in the app first (so nobody else can sign up with that email).
--   2. Put that email in the INSERT at the bottom of this file, then run the file.

-- Who is an admin. No policies on purpose: only the dashboard and is_admin() can read it.
create table if not exists public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

-- True when the signed-in user's email is in public.admins.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = lower(auth.jwt() ->> 'email')
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Admins can read every row (these policies are OR-ed with the "own rows" policies).
drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles" on public.profiles
  for select to authenticated using ((select public.is_admin()));

drop policy if exists "Admins read all enquiries" on public.enquiries;
create policy "Admins read all enquiries" on public.enquiries
  for select to authenticated using ((select public.is_admin()));

drop policy if exists "Admins read all event registrations" on public.event_registrations;
create policy "Admins read all event registrations" on public.event_registrations
  for select to authenticated using ((select public.is_admin()));

drop policy if exists "Admins read all job applications" on public.job_applications;
create policy "Admins read all job applications" on public.job_applications
  for select to authenticated using ((select public.is_admin()));

drop policy if exists "Admins read all cyber results" on public.cyber_check_results;
create policy "Admins read all cyber results" on public.cyber_check_results
  for select to authenticated using ((select public.is_admin()));

-- Admins can change the status of enquiries and applications (only the status column).
drop policy if exists "Admins update enquiries" on public.enquiries;
create policy "Admins update enquiries" on public.enquiries
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Admins update job applications" on public.job_applications;
create policy "Admins update job applications" on public.job_applications
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

grant update (status) on public.enquiries to authenticated;
grant update (status) on public.job_applications to authenticated;

-- >>> Replace with YOUR admin email (the account you registered in the app), then Run. <<<
insert into public.admins (email) values ('webnovatechnologies902@gmail.com')
on conflict (email) do nothing;
