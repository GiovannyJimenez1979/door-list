begin;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null default auth.uid()
    references auth.users (id) on delete restrict,
  title text not null check (title ~ '[^[:space:]]'),
  description text not null check (description ~ '[^[:space:]]'),
  starts_at timestamptz not null,
  venue text not null check (venue ~ '[^[:space:]]'),
  status text not null default 'borrador'
    check (status in ('borrador', 'publicado')),
  created_at timestamptz not null default now()
);

create table public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null check (name ~ '[^[:space:]]'),
  capacity integer not null check (capacity > 0),
  created_at timestamptz not null default now()
);

create index events_organizer_id_idx on public.events (organizer_id);
create index ticket_types_event_id_idx on public.ticket_types (event_id);

alter table public.events enable row level security;
alter table public.ticket_types enable row level security;

-- Explicit grants avoid relying on project-specific default privileges.
revoke all on public.events, public.ticket_types from public, anon, authenticated;
grant select on public.events, public.ticket_types to anon;
grant select, insert, update, delete on public.events, public.ticket_types to authenticated;
grant all on public.events, public.ticket_types to service_role;

create policy events_read_published on public.events
  for select to anon, authenticated
  using (status = 'publicado');

create policy events_read_owned on public.events
  for select to authenticated
  using (organizer_id = (select auth.uid()));

create policy events_insert_owned on public.events
  for insert to authenticated
  with check (organizer_id = (select auth.uid()));

create policy events_update_owned on public.events
  for update to authenticated
  using (organizer_id = (select auth.uid()))
  with check (organizer_id = (select auth.uid()));

create policy events_delete_owned on public.events
  for delete to authenticated
  using (organizer_id = (select auth.uid()));

create policy ticket_types_read_visible on public.ticket_types
  for select to anon, authenticated
  using (exists (
    select 1 from public.events as event
    where event.id = ticket_types.event_id
      and (event.status = 'publicado' or event.organizer_id = (select auth.uid()))
  ));

create policy ticket_types_insert_owned on public.ticket_types
  for insert to authenticated
  with check (exists (
    select 1 from public.events as event
    where event.id = ticket_types.event_id
      and event.organizer_id = (select auth.uid())
  ));

create policy ticket_types_update_owned on public.ticket_types
  for update to authenticated
  using (exists (
    select 1 from public.events as event
    where event.id = ticket_types.event_id
      and event.organizer_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.events as event
    where event.id = ticket_types.event_id
      and event.organizer_id = (select auth.uid())
  ));

create policy ticket_types_delete_owned on public.ticket_types
  for delete to authenticated
  using (exists (
    select 1 from public.events as event
    where event.id = ticket_types.event_id
      and event.organizer_id = (select auth.uid())
  ));

commit;
