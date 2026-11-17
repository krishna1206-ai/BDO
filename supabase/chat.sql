-- Real-time chat on each enquiry, between the person who sent it and the admins.
-- Run AFTER schema.sql, admin.sql and notifications.sql:
-- Supabase dashboard > SQL Editor > New query > paste > Run. Safe to re-run.

create table if not exists public.enquiry_messages (
  id bigint generated always as identity primary key,
  enquiry_id bigint not null references public.enquiries (id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Set by the trigger below from the sender's real role; the app cannot fake it.
  from_admin boolean not null default false,
  body text not null check (length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists enquiry_messages_enquiry_idx on public.enquiry_messages (enquiry_id, created_at);
alter table public.enquiry_messages enable row level security;

-- True when the signed-in user sent this enquiry.
create or replace function public.owns_enquiry(eid bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.enquiries e where e.id = eid and e.user_id = auth.uid());
$$;
revoke all on function public.owns_enquiry(bigint) from public;
grant execute on function public.owns_enquiry(bigint) to authenticated;

-- Only the enquiry's sender and admins can read or post in its chat.
drop policy if exists "Participants read messages" on public.enquiry_messages;
create policy "Participants read messages" on public.enquiry_messages
  for select to authenticated
  using ((select public.is_admin()) or public.owns_enquiry(enquiry_id));

drop policy if exists "Participants send messages" on public.enquiry_messages;
create policy "Participants send messages" on public.enquiry_messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and ((select public.is_admin()) or public.owns_enquiry(enquiry_id))
  );

grant select, insert on public.enquiry_messages to authenticated;

-- Stamp the real sender and role on every new message.
create or replace function public.stamp_enquiry_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.sender_id := auth.uid();
  new.from_admin := public.is_admin();
  new.body := trim(new.body);
  return new;
end;
$$;

drop trigger if exists enquiry_messages_stamp on public.enquiry_messages;
create trigger enquiry_messages_stamp
  before insert on public.enquiry_messages
  for each row execute procedure public.stamp_enquiry_message();

-- Notify the enquiry's sender when an admin writes to them.
create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
  topic text;
begin
  if new.from_admin then
    select e.user_id, e.topic into owner, topic from public.enquiries e where e.id = new.enquiry_id;
    if owner is not null and owner <> new.sender_id then
      insert into public.notifications (user_id, title, body, link)
      values (
        owner,
        'New message from our team',
        coalesce('About "' || topic || '": ', '') || left(new.body, 140),
        '/chat/' || new.enquiry_id
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enquiry_messages_notify on public.enquiry_messages;
create trigger enquiry_messages_notify
  after insert on public.enquiry_messages
  for each row execute procedure public.notify_new_message();

-- Status-change notifications for enquiries now open the enquiry's chat.
create or replace function public.notify_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if tg_table_name = 'enquiries' then
      insert into public.notifications (user_id, title, body, link)
      values (
        new.user_id,
        'Update on your enquiry',
        'Your enquiry' || coalesce(' about "' || new.topic || '"', '') || ' is now: ' || public.status_label(new.status) || '.',
        '/chat/' || new.id
      );
    elsif tg_table_name = 'job_applications' then
      insert into public.notifications (user_id, title, body, link)
      values (
        new.user_id,
        'Update on your application',
        'Your application for ' || new.job_title || ' is now: ' || public.status_label(new.status) || '.',
        '/careers'
      );
    end if;
  end if;
  return new;
end;
$$;

-- Live updates for the chat screen.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'enquiry_messages'
  ) then
    alter publication supabase_realtime add table public.enquiry_messages;
  end if;
end $$;

-- Refresh the API's table list so the app sees the new table immediately.
notify pgrst, 'reload schema';
