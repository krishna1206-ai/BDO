-- Office locations that admins manage from the in-app admin panel (Admin > Locations).
-- Shown on the Locations page (/offices), in search and on the home page offices banner.
-- Run AFTER schema.sql and admin.sql: Supabase dashboard > SQL Editor > New query > paste > Run.
-- Safe to re-run: the starting offices are only inserted if they don't exist yet, so edits and
-- deletions made in the admin panel are kept.

create table if not exists public.site_offices (
  id text primary key default gen_random_uuid()::text,
  city text not null check (length(trim(city)) between 1 and 120),
  country text not null default '' check (length(country) <= 120),
  address text not null default '' check (length(address) <= 400),
  phone text not null default '' check (length(phone) <= 60),
  -- Optional exact map link (e.g. a Google Maps share link); without it the address is searched.
  map_url text check (map_url is null or map_url ~ '^https?://'),
  -- Uploaded photo (site-images bucket, see posts.sql) or any https link; null = a default office photo.
  image_url text check (image_url is null or image_url ~ '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_offices enable row level security;

drop policy if exists "Anyone reads offices" on public.site_offices;
create policy "Anyone reads offices" on public.site_offices for select to anon, authenticated using (true);
drop policy if exists "Admins add offices" on public.site_offices;
create policy "Admins add offices" on public.site_offices for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "Admins update offices" on public.site_offices;
create policy "Admins update offices" on public.site_offices
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Admins remove offices" on public.site_offices;
create policy "Admins remove offices" on public.site_offices for delete to authenticated using ((select public.is_admin()));

grant select on public.site_offices to anon, authenticated;
grant insert, update, delete on public.site_offices to authenticated;

-- Keep updated_at current on every edit (posts_touch() comes from posts.sql; defined here too in case).
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

drop trigger if exists site_offices_touch on public.site_offices;
create trigger site_offices_touch before update on public.site_offices for each row execute function public.posts_touch();

-- Starting offices (the ones the app shipped with). Newest first in the list, so London is the
-- most recent here and offices added later appear above them.
insert into public.site_offices (id, city, country, address, phone, created_at) values
  ('london', 'London', 'United Kingdom', '1 Example Street, London EC1A 1AA', '+44 20 0000 0000', now()),
  ('manchester', 'Manchester', 'United Kingdom', '2 Sample Road, Manchester M1 1AA', '+44 161 000 0000', now() - interval '1 minute'),
  ('birmingham', 'Birmingham', 'United Kingdom', '3 Demo Square, Birmingham B1 1AA', '+44 121 000 0000', now() - interval '2 minutes'),
  ('leeds', 'Leeds', 'United Kingdom', '4 Placeholder Way, Leeds LS1 1AA', '+44 113 000 0000', now() - interval '3 minutes'),
  ('bristol', 'Bristol', 'United Kingdom', '5 Harbour Lane, Bristol BS1 1AA', '+44 117 000 0000', now() - interval '4 minutes'),
  ('glasgow', 'Glasgow', 'United Kingdom', '6 Sample Street, Glasgow G1 1AA', '+44 141 000 0000', now() - interval '5 minutes'),
  ('edinburgh', 'Edinburgh', 'United Kingdom', '7 Demo Place, Edinburgh EH1 1AA', '+44 131 000 0000', now() - interval '6 minutes'),
  ('cardiff', 'Cardiff', 'United Kingdom', '8 Example Quay, Cardiff CF10 1AA', '+44 29 0000 0000', now() - interval '7 minutes')
on conflict (id) do nothing;
