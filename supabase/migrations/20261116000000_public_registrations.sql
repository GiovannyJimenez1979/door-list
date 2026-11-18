begin;

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types(id) on delete restrict,
  attendee_name text not null check (attendee_name ~ '[^[:space:]]'),
  email text not null check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  created_at timestamptz not null default now()
);
create unique index registrations_event_email_unique on public.registrations (event_id, lower(email));
create index registrations_ticket_type_id_idx on public.registrations (ticket_type_id);

alter table public.registrations enable row level security;
revoke all on public.registrations from public, anon, authenticated;
grant all on public.registrations to service_role;

create function public.registration_options(p_event_id uuid)
returns table (ticket_type_id uuid, name text, remaining integer)
language sql security definer set search_path = '' as $$
  select tt.id, tt.name,
    least(
      tt.capacity - (select count(*) from public.registrations r where r.ticket_type_id = tt.id),
      e.capacity - (select count(*) from public.registrations r where r.event_id = e.id)
    )::integer
  from public.events e
  join public.ticket_types tt on tt.event_id = e.id
  where e.id = p_event_id
    and e.status = 'publicado'
    and (e.starts_at at time zone 'America/Bogota')::date >= (now() at time zone 'America/Bogota')::date;
$$;

create function public.create_registration(p_event_id uuid, p_ticket_type_id uuid, p_name text, p_email text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_event public.events%rowtype;
  v_ticket public.ticket_types%rowtype;
  v_name text := btrim(p_name);
  v_email text := lower(btrim(p_email));
  v_id uuid;
begin
  if v_name is null or v_name = '' or v_email is null or v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Ingresa un nombre y un email válidos' using errcode = '22023';
  end if;
  select * into v_event from public.events where id = p_event_id for update;
  if not found or v_event.status <> 'publicado' or (v_event.starts_at at time zone 'America/Bogota')::date < (now() at time zone 'America/Bogota')::date then
    raise exception 'Este evento ya no está disponible para registros' using errcode = 'P0001';
  end if;
  select * into v_ticket from public.ticket_types where id = p_ticket_type_id and event_id = p_event_id for update;
  if not found then raise exception 'La entrada seleccionada ya no está disponible' using errcode = 'P0001'; end if;
  if (select count(*) from public.registrations where ticket_type_id = p_ticket_type_id) >= v_ticket.capacity then raise exception 'Esta entrada ya no tiene cupos' using errcode = 'P0001'; end if;
  if (select count(*) from public.registrations where event_id = p_event_id) >= v_event.capacity then raise exception 'El evento ya no tiene cupos disponibles' using errcode = 'P0001'; end if;
  insert into public.registrations (event_id, ticket_type_id, attendee_name, email)
    values (p_event_id, p_ticket_type_id, v_name, v_email) returning id into v_id;
  return v_id;
end $$;

revoke all on function public.registration_options(uuid), public.create_registration(uuid, uuid, text, text) from public;
grant execute on function public.registration_options(uuid), public.create_registration(uuid, uuid, text, text) to anon, authenticated;

commit;
