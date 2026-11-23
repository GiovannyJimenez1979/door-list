do $migration$
begin
  execute 'grant select on public.registrations to authenticated';

  execute $policy$
    create policy registrations_read_owned on public.registrations
      for select to authenticated
      using (exists (
        select 1 from public.events as event
        where event.id = registrations.event_id
          and event.organizer_id = (select auth.uid())
      ))
  $policy$;
end
$migration$;
