-- Newsletter sign-ups from the "Subscribe" form in the site footer.
-- Admins see the list in Admin > Subscribers. Run AFTER schema.sql and admin.sql:
-- Supabase dashboard > SQL Editor > New query > paste > Run. Safe to re-run.

create table if not exists public.newsletter_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique check (email = lower(email) and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' and length(email) <= 254),
  -- The signed-in user who subscribed, if any.
  user_id uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;

-- Anyone (signed in or not) can subscribe; nobody but admins can read the list.
drop policy if exists "Anyone subscribes" on public.newsletter_subscribers;
create policy "Anyone subscribes" on public.newsletter_subscribers
  for insert to anon, authenticated with check (user_id is null or user_id = (select auth.uid()));

drop policy if exists "Admins read subscribers" on public.newsletter_subscribers;
create policy "Admins read subscribers" on public.newsletter_subscribers
  for select to authenticated using ((select public.is_admin()));

drop policy if exists "Admins remove subscribers" on public.newsletter_subscribers;
create policy "Admins remove subscribers" on public.newsletter_subscribers
  for delete to authenticated using ((select public.is_admin()));

grant insert (email, user_id) on public.newsletter_subscribers to anon, authenticated;
grant select, delete on public.newsletter_subscribers to authenticated;
