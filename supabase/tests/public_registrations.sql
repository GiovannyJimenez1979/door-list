-- Run as postgres against a disposable Supabase database with all migrations applied.
\set ON_ERROR_STOP on
begin;
insert into auth.users (id, email) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'registration-owner@example.test');
insert into public.events (id, organizer_id, title, description, starts_at, venue, status, capacity) values
  ('33333333-3333-4333-8333-333333333333', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Today', 'Public', now(), 'Bogotá', 'publicado', 2),
  ('44444444-4444-4444-8444-444444444444', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Draft', 'Private', now(), 'Bogotá', 'borrador', 2),
  ('55555555-5555-4555-8555-555555555555', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Past', 'Old', now() - interval '2 days', 'Bogotá', 'publicado', 2);
insert into public.ticket_types (id, event_id, name, capacity) values
  ('66666666-6666-4666-8666-666666666666', '33333333-3333-4333-8333-333333333333', 'General', 1),
  ('77777777-7777-4777-8777-777777777777', '33333333-3333-4333-8333-333333333333', 'VIP', 1),
  ('88888888-8888-4888-8888-888888888888', '44444444-4444-4444-8444-444444444444', 'Draft ticket', 1),
  ('99999999-9999-4999-8999-999999999999', '55555555-5555-4555-8555-555555555555', 'Past ticket', 1);
set local role anon;
do $$ begin
  begin
    perform count(*) from public.registrations;
    raise exception 'Expected private registrations' using errcode = 'P9999';
  exception when insufficient_privilege then null; end;
  if (select count(*) from public.registration_options('33333333-3333-4333-8333-333333333333')) <> 2 then raise exception 'Today options missing'; end if;
  if (select count(*) from public.registration_options('44444444-4444-4444-8444-444444444444')) <> 0 then raise exception 'Draft options visible'; end if;
  if (select count(*) from public.registration_options('55555555-5555-4555-8555-555555555555')) <> 0 then raise exception 'Past options visible'; end if;
  perform public.create_registration('33333333-3333-4333-8333-333333333333', '66666666-6666-4666-8666-666666666666', 'Ada', 'Ada@example.test');
  if (select remaining from public.registration_options('33333333-3333-4333-8333-333333333333') where name = 'General') <> 0 then raise exception 'Ticket capacity not decremented'; end if;
  begin
    perform public.create_registration('33333333-3333-4333-8333-333333333333', '66666666-6666-4666-8666-666666666666', 'Bob', 'bob@example.test');
    raise exception 'Expected sold out error' using errcode = 'P9999';
  exception when sqlstate 'P0001' then null; end;
  begin
    perform public.create_registration('33333333-3333-4333-8333-333333333333', '77777777-7777-4777-8777-777777777777', 'Ada', 'ADA@example.test');
    raise exception 'Expected duplicate email error' using errcode = 'P9999';
  exception when unique_violation then null; end;
  perform public.create_registration('33333333-3333-4333-8333-333333333333', '77777777-7777-4777-8777-777777777777', 'Bob', 'bob@example.test');
  if (select max(remaining) from public.registration_options('33333333-3333-4333-8333-333333333333')) <> 0 then raise exception 'Event capacity not decremented'; end if;
  begin
    perform public.create_registration('44444444-4444-4444-8444-444444444444', '88888888-8888-4888-8888-888888888888', 'Bob', 'bob@example.test');
    raise exception 'Expected draft error' using errcode = 'P9999';
  exception when sqlstate 'P0001' then null; end;
  begin
    perform public.create_registration('55555555-5555-4555-8555-555555555555', '99999999-9999-4999-8999-999999999999', 'Bob', 'bob@example.test');
    raise exception 'Expected past event error' using errcode = 'P9999';
  exception when sqlstate 'P0001' then null; end;
end $$;
rollback;
\echo 'Public registration checks passed.'
