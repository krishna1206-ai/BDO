-- Lets admins manage other admins from the app, and see every table in the Overview.
-- Run AFTER schema.sql and admin.sql: Supabase dashboard > SQL Editor > New query > paste > Run. Safe to re-run.
--
-- Security note: admin access is granted by email. If "Confirm email" is turned OFF in
-- Supabase Auth, anyone could register an account with an admin's email before that person
-- does. Keep "Confirm email" ON, or add admins only for emails that are already registered.

-- Admins can list, add and remove admins.
drop policy if exists "Admins read admins" on public.admins;
create policy "Admins read admins" on public.admins
  for select to authenticated using ((select public.is_admin()));

drop policy if exists "Admins add admins" on public.admins;
create policy "Admins add admins" on public.admins
  for insert to authenticated with check ((select public.is_admin()));

-- An admin can remove other admins, but never themselves (so the last admin can't lock everyone out).
drop policy if exists "Admins remove other admins" on public.admins;
create policy "Admins remove other admins" on public.admins
  for delete to authenticated
  using ((select public.is_admin()) and lower(email) <> lower(auth.jwt() ->> 'email'));

grant select, insert, delete on public.admins to authenticated;

-- Store admin emails in lower case so lookups always match.
alter table public.admins drop constraint if exists admins_email_lowercase;
update public.admins set email = lower(email) where email <> lower(email);
alter table public.admins add constraint admins_email_lowercase check (email = lower(email));

-- Overview: admins can count saved articles too.
drop policy if exists "Admins read all saved insights" on public.saved_insights;
create policy "Admins read all saved insights" on public.saved_insights
  for select to authenticated using ((select public.is_admin()));
