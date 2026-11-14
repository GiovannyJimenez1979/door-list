begin;

alter table public.events add column capacity integer;
update public.events e set capacity = greatest(1, coalesce((select sum(t.capacity) from public.ticket_types t where t.event_id = e.id), 0))::integer;
alter table public.events alter column capacity set not null;
alter table public.events add constraint events_capacity_positive check (capacity > 0);

-- Serialize changes to each event with its ticket type changes.
create function public.check_ticket_capacity() returns trigger
language plpgsql set search_path = public as $$
declare event_capacity integer; allocated bigint;
begin
  select capacity into event_capacity from public.events where id = new.event_id for update;
  select coalesce(sum(capacity), 0) into allocated from public.ticket_types
    where event_id = new.event_id and id <> new.id;
  if allocated + new.capacity > event_capacity then
    raise exception 'La suma de los aforos supera el límite del evento' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger ticket_capacity_check before insert or update on public.ticket_types
  for each row execute function public.check_ticket_capacity();

create function public.check_event_capacity() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.capacity < (select coalesce(sum(capacity), 0) from public.ticket_types where event_id = new.id) then
    raise exception 'El aforo del evento es menor que el asignado a sus tipos de entrada' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger event_capacity_check before update of capacity on public.events
  for each row execute function public.check_event_capacity();
commit;
