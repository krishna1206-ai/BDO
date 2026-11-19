-- Services that admins add from the in-app admin panel (Admin > Services).
-- They appear next to the built-in services in the menu, the Services page and search,
-- and use the same page layouts. Run AFTER schema.sql and admin.sql:
-- Supabase dashboard > SQL Editor > New query > paste > Run. Safe to re-run.

create table if not exists public.site_services (
  -- URL slug: /service/<id> for a main service, /topic/<id> for a sub-service.
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(id) <= 80),
  -- null = a main service (like Tax). Otherwise the id of the main service it sits under,
  -- which can be a built-in one (e.g. 'tax') or another row in this table.
  parent_id text check (parent_id is null or parent_id <> id),
  title text not null check (length(trim(title)) between 1 and 120),
  -- Short line under the title (cards, search results, page subtitle).
  summary text not null default '' check (length(summary) <= 400),
  -- Main services: the intro paragraph on the service page.
  description text not null default '' check (length(description) <= 4000),
  -- Main services: Ionicons name shown on the Services page card.
  icon text not null default 'briefcase-outline' check (length(icon) <= 60),
  -- Key of a bundled photo (see photoChoices in src/data/images.ts).
  image text not null default 'advisory' check (length(image) <= 60),
  -- "How we help" bullet points.
  points text[] not null default '{}' check (cardinality(points) <= 30),
  -- Sub-services: Overview paragraphs (optional).
  overview text[] not null default '{}' check (cardinality(overview) <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists site_services_parent_idx on public.site_services (parent_id);
alter table public.site_services enable row level security;

-- Everyone can read the services (the menu is built from them).
drop policy if exists "Anyone reads services" on public.site_services;
create policy "Anyone reads services" on public.site_services
  for select to anon, authenticated using (true);

-- Only admins (public.admins, see admin.sql) can add, change or remove them.
drop policy if exists "Admins add services" on public.site_services;
create policy "Admins add services" on public.site_services
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "Admins update services" on public.site_services;
create policy "Admins update services" on public.site_services
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Admins remove services" on public.site_services;
create policy "Admins remove services" on public.site_services
  for delete to authenticated using ((select public.is_admin()));

grant select on public.site_services to anon, authenticated;
grant insert, update, delete on public.site_services to authenticated;

-- Keep updated_at current on every edit.
create or replace function public.site_services_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists site_services_touch on public.site_services;
create trigger site_services_touch
  before update on public.site_services
  for each row execute function public.site_services_touch();

-- ---------------------------------------------------------------------------
-- Editing and removing the built-in services (added later; safe to re-run).
-- A row whose id matches a built-in service or sub-page overrides it; hidden = true removes it
-- from the site. Deleting that row (Reset / Restore in the admin panel) brings back the original.
-- An empty image keeps the built-in photo.
-- ---------------------------------------------------------------------------
alter table public.site_services add column if not exists hidden boolean not null default false;

-- "Meet our leader" contact for a service or page (added later; safe to re-run).
-- Shape: {"name": "...", "role": "...", "office": "...", "email": "..."}; null = the default contact.
alter table public.site_services add column if not exists leader jsonb
  check (leader is null or (jsonb_typeof(leader) = 'object' and length(leader::text) <= 1000));

-- Photos can also be an uploaded or pasted web link (added later; safe to re-run).
alter table public.site_services drop constraint if exists site_services_image_check;
alter table public.site_services add constraint site_services_image_check check (length(image) <= 1000);
