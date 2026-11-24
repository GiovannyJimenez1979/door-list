begin;

alter table public.events add column published_at timestamptz;

-- Older publications have no recorded transition time; creation is the earliest available date.
update public.events set published_at = created_at where status = 'publicado';

create function public.set_event_published_at()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    -- Keep the first publication date even if the event returns to draft.
    new.published_at := old.published_at;
  else
    new.published_at := null;
  end if;
  if new.status = 'publicado' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger events_set_published_at
before insert or update on public.events
for each row execute function public.set_event_published_at();

create function public.registration_daily_series(p_event_id uuid)
returns table(day date, registrations bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select series.day::date, count(registration.id)::bigint
  from public.events event
  cross join lateral generate_series(
    (event.published_at at time zone 'America/Bogota')::date,
    (now() at time zone 'America/Bogota')::date,
    interval '1 day'
  ) as series(day)
  left join public.registrations registration
    on registration.event_id = event.id
    and (registration.created_at at time zone 'America/Bogota')::date = series.day::date
  where event.id = p_event_id
    and event.organizer_id = (select auth.uid())
    and event.published_at is not null
  group by series.day
  order by series.day;
$$;

revoke all on function public.registration_daily_series(uuid) from public, anon;
grant execute on function public.registration_daily_series(uuid) to authenticated;

commit;
