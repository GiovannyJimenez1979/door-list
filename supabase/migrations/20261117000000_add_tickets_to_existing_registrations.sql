begin;

-- Repair/continuation migration: registrations already exists in the project.
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.registrations(id) on delete cascade,
  code text not null unique default translate(encode(gen_random_bytes(24), 'base64'), E'+/=', '-_~'),
  status text not null default 'valid' check (status in ('valid', 'use it', 'revoke')),
  created_at timestamptz not null default now()
);
alter table public.tickets enable row level security;
revoke all on public.tickets from public, anon, authenticated;
grant all on public.tickets to service_role;

drop function if exists public.create_registration(uuid, uuid, text, text);
create function public.create_registration(p_event_id uuid, p_ticket_type_id uuid, p_name text, p_email text)
returns table (registration_id uuid, ticket_code text)
language plpgsql security definer set search_path = '' as $$
declare
  v_event public.events%rowtype; v_ticket public.ticket_types%rowtype;
  v_name text := btrim(p_name); v_email text := lower(btrim(p_email)); v_id uuid; v_code text;
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
  if (select count(*) from public.registrations where ticket_type_id = p_ticket_type_id) >= v_ticket.capacity then raise exception 'Esta entrada ya no tiene cupos. Elige otra opción' using errcode = 'P0001'; end if;
  if (select count(*) from public.registrations where event_id = p_event_id) >= v_event.capacity then raise exception 'El evento ya no tiene cupos disponibles' using errcode = 'P0001'; end if;
  insert into public.registrations (event_id, ticket_type_id, attendee_name, email) values (p_event_id, p_ticket_type_id, v_name, v_email) returning id into v_id;
  insert into public.tickets (registration_id) values (v_id) returning code into v_code;
  return query select v_id, v_code;
exception when unique_violation then
  raise exception 'Este email ya tiene un registro para este evento' using errcode = '23505';
end $$;

create or replace function public.ticket_by_code(p_code text)
returns table (ticket_code text, status text, attendee_name text, email text, event_title text, event_description text, starts_at timestamptz, venue text, ticket_name text)
language sql security definer set search_path = '' as $$
  select t.code, t.status, r.attendee_name, r.email, e.title, e.description, e.starts_at, e.venue, tt.name
  from public.tickets t join public.registrations r on r.id = t.registration_id join public.events e on e.id = r.event_id join public.ticket_types tt on tt.id = r.ticket_type_id where t.code = p_code;
$$;
revoke all on function public.create_registration(uuid, uuid, text, text), public.ticket_by_code(text) from public;
grant execute on function public.create_registration(uuid, uuid, text, text), public.ticket_by_code(text) to anon, authenticated;
commit;
