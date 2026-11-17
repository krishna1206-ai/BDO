-- In-app notifications: users are notified when an admin changes the status of their
-- enquiry or job application. Run AFTER schema.sql (and admin.sql):
-- Supabase dashboard > SQL Editor > New query > paste > Run. Safe to re-run.

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  -- In-app route to open when the notification is tapped, e.g. /notifications or /careers.
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications
  for select to authenticated using ((select auth.uid()) = user_id);

-- Users can only mark their own notifications as read (only the read_at column is updatable).
drop policy if exists "Users mark own notifications read" on public.notifications;
create policy "Users mark own notifications read" on public.notifications
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
-- No insert grant: notifications are only created by the trigger below.

-- Friendly wording for each status.
create or replace function public.status_label(s text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case s
    when 'new' then 'Received'
    when 'in_progress' then 'In progress'
    when 'replied' then 'Replied'
    when 'closed' then 'Closed'
    when 'received' then 'Received'
    when 'reviewing' then 'Under review'
    when 'interview' then 'Invited to interview'
    when 'rejected' then 'Not successful'
    when 'hired' then 'Offer made'
    else initcap(replace(s, '_', ' '))
  end;
$$;

-- Creates a notification whenever an enquiry's or application's status changes.
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
        '/notifications'
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

drop trigger if exists enquiries_status_notify on public.enquiries;
create trigger enquiries_status_notify
  after update of status on public.enquiries
  for each row execute procedure public.notify_status_change();

drop trigger if exists job_applications_status_notify on public.job_applications;
create trigger job_applications_status_notify
  after update of status on public.job_applications
  for each row execute procedure public.notify_status_change();

-- Live updates: the app's bell badge updates instantly when a notification arrives.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
