-- Run as postgres against a disposable Supabase database with all migrations applied.
\set ON_ERROR_STOP on
begin;

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'dashboard-a@example.test'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'dashboard-b@example.test');

insert into public.events (id, organizer_id, title, description, starts_at, venue, status, capacity) values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'A draft', 'Private', now(), 'Bogota', 'borrador', 2),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'B public', 'Public', now(), 'Bogota', 'publicado', 2);

insert into public.ticket_types (id, event_id, name, capacity) values
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'General', 2),
  ('44444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222222', 'General', 2);

insert into public.registrations (event_id, ticket_type_id, attendee_name, email) values
  ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'Attendee A', 'a@example.test'),
  ('22222222-2222-4222-8222-222222222222', '44444444-4444-4444-8444-444444444444', 'Attendee B', 'b@example.test');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
do $$ begin
  if (select count(*) from public.registrations) <> 1 then raise exception 'Owner A must see only own registration'; end if;
  if (select attendee_name from public.registrations) <> 'Attendee A' then raise exception 'Owner A saw another attendee'; end if;
end $$;

select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);
do $$ begin
  if (select count(*) from public.registrations) <> 1 then raise exception 'Owner B must see only own registration'; end if;
  if (select attendee_name from public.registrations) <> 'Attendee B' then raise exception 'Owner B saw another attendee'; end if;
end $$;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  begin
    perform count(*) from public.registrations;
    raise exception 'Anonymous registration read should be denied';
  exception when insufficient_privilege then null; end;
end $$;

rollback;
\echo 'Organizer dashboard access checks passed.'
