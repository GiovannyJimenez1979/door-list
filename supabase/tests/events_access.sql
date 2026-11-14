-- Run as postgres against a disposable Supabase database after the migration.
-- All fixtures and helpers are rolled back. A failure exits with a nonzero code.
\set ON_ERROR_STOP on
begin;

create function pg_temp.assert_true(actual boolean, message text)
returns void language plpgsql as $$
begin
  if actual is distinct from true then
    raise exception 'Assertion failed: %', message;
  end if;
end;
$$;

create function pg_temp.expect_error(statement text, expected_state text)
returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate = expected_state then return; end if;
    raise;
  end;
  raise exception 'Expected SQLSTATE % for: %', expected_state, statement;
end;
$$;

-- Helpers run with the caller's permissions, never SECURITY DEFINER.
create function pg_temp.login(user_id text)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', user_id, true);
  perform set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', current_user)::text, true);
end;
$$;

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'organizer-a@example.test'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'organizer-b@example.test');

set local role authenticated;
select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.events (id, title, description, starts_at, venue, capacity) values
  ('11111111-1111-4111-8111-111111111111', 'Event A', 'Description A', '2026-12-12T19:00:00-05:00', 'Bogota', 140);
insert into public.ticket_types (event_id, name, capacity) values
  ('11111111-1111-4111-8111-111111111111', 'General', 100),
  ('11111111-1111-4111-8111-111111111111', 'VIP', 20);

select pg_temp.assert_true((select status = 'borrador' and organizer_id = auth.uid()
  and created_at is not null from public.events), 'draft and owner defaults');
select pg_temp.assert_true((select count(*) = 2 from public.ticket_types), 'owner reads draft types');
select pg_temp.expect_error($sql$insert into public.ticket_types (event_id, name, capacity) values
  ('11111111-1111-4111-8111-111111111111', 'Overflow', 21)$sql$, '23514');
select pg_temp.expect_error($sql$update public.events set capacity = 119
  where id = '11111111-1111-4111-8111-111111111111'$sql$, '23514');
select pg_temp.assert_true((select starts_at = '2026-12-13T00:00:00Z'::timestamptz
  from public.events), 'timestamp preserves instant');
set local timezone = 'Asia/Tokyo';
select pg_temp.assert_true((select starts_at::text = '2026-12-13 09:00:00+09'
  from public.events), 'timestamp displays in another timezone');

select pg_temp.expect_error($sql$update public.events set title = E' \t\n'$sql$, '23514');
select pg_temp.expect_error($sql$update public.events set description = ''$sql$, '23514');
select pg_temp.expect_error($sql$update public.events set venue = ' '$sql$, '23514');
select pg_temp.expect_error($sql$update public.events set status = 'cancelado'$sql$, '23514');
select pg_temp.expect_error($sql$update public.events set starts_at = null$sql$, '23502');
select pg_temp.expect_error($sql$update public.ticket_types set name = E'\t\n'$sql$, '23514');
select pg_temp.expect_error('update public.ticket_types set capacity = 0', '23514');
select pg_temp.expect_error('update public.ticket_types set capacity = -1', '23514');
select pg_temp.expect_error('update public.ticket_types set capacity = null', '23502');

set local role anon;
select pg_temp.login('');
select pg_temp.assert_true((select count(*) = 0 from public.events), 'visitor cannot read drafts');
select pg_temp.assert_true((select count(*) = 0 from public.ticket_types), 'visitor cannot read draft types');
select pg_temp.expect_error($sql$insert into public.events (title, description, starts_at, venue)
  values ('No', 'No', now(), 'No')$sql$, '42501');
select pg_temp.expect_error($sql$insert into public.ticket_types (event_id, name, capacity)
  values ('11111111-1111-4111-8111-111111111111', 'No', 1)$sql$, '42501');
select pg_temp.expect_error('update public.events set status = ''publicado''', '42501');
select pg_temp.expect_error('delete from public.events', '42501');
select pg_temp.expect_error('update public.ticket_types set capacity = 1', '42501');
select pg_temp.expect_error('delete from public.ticket_types', '42501');

set local role authenticated;
select pg_temp.login('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
select pg_temp.assert_true((select count(*) = 0 from public.events), 'other owner cannot read drafts');
select pg_temp.assert_true((select count(*) = 0 from public.ticket_types), 'other owner cannot read draft types');
insert into public.events (id, title, description, starts_at, venue, status, capacity) values
  ('22222222-2222-4222-8222-222222222222', 'Event B', 'Description B', now(), 'Venue B', 'publicado', 1000);
insert into public.ticket_types (event_id, name, capacity) values
  ('22222222-2222-4222-8222-222222222222', 'General', 50);

select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
select pg_temp.assert_true((select count(*) = 2 from public.events), 'owner reads own draft and other published event');
select pg_temp.assert_true((select count(*) = 3 from public.ticket_types), 'published types visible to other owner');
select pg_temp.expect_error($sql$insert into public.events (organizer_id, title, description, starts_at, venue, capacity)
  values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'No', 'No', now(), 'No', 1)$sql$, '42501');
select pg_temp.expect_error($sql$update public.events set organizer_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  where id = '11111111-1111-4111-8111-111111111111'$sql$, '42501');
select pg_temp.expect_error($sql$insert into public.ticket_types (event_id, name, capacity)
  values ('22222222-2222-4222-8222-222222222222', 'No', 1)$sql$, '42501');
select pg_temp.expect_error($sql$update public.ticket_types set event_id = '22222222-2222-4222-8222-222222222222'
  where event_id = '11111111-1111-4111-8111-111111111111'$sql$, '42501');

-- Forbidden updates/deletes can return zero affected rows rather than errors.
with changed as (update public.events set title = 'No'
  where id = '22222222-2222-4222-8222-222222222222' returning id)
select pg_temp.assert_true((select count(*) = 0 from changed), 'cannot update another event');
with changed as (delete from public.events
  where id = '22222222-2222-4222-8222-222222222222' returning id)
select pg_temp.assert_true((select count(*) = 0 from changed), 'cannot delete another event');
with changed as (update public.ticket_types set capacity = 1
  where event_id = '22222222-2222-4222-8222-222222222222' returning id)
select pg_temp.assert_true((select count(*) = 0 from changed), 'cannot update another type');
with changed as (delete from public.ticket_types
  where event_id = '22222222-2222-4222-8222-222222222222' returning id)
select pg_temp.assert_true((select count(*) = 0 from changed), 'cannot delete another type');

update public.events set status = 'publicado' where id = '11111111-1111-4111-8111-111111111111';
update public.ticket_types set capacity = 120
  where event_id = '11111111-1111-4111-8111-111111111111' and name = 'General';
select pg_temp.assert_true((select capacity = 120 from public.ticket_types
  where event_id = '11111111-1111-4111-8111-111111111111' and name = 'General'), 'owner updates type');

set local role anon;
select pg_temp.login('');
select pg_temp.assert_true((select count(*) = 2 from public.events), 'visitor reads published events');
select pg_temp.assert_true((select count(*) = 3 from public.ticket_types), 'visitor reads published types');

set local role authenticated;
select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
update public.events set status = 'borrador' where id = '11111111-1111-4111-8111-111111111111';
set local role anon;
select pg_temp.login('');
select pg_temp.assert_true((select count(*) = 1 from public.events), 'unpublishing hides event');
select pg_temp.assert_true((select count(*) = 1 from public.ticket_types), 'unpublishing hides types');

-- Superuser checks distinguish FK constraints from RLS rejection.
reset role;
select pg_temp.expect_error($sql$insert into public.events (organizer_id, title, description, starts_at, venue, capacity)
  values ('99999999-9999-4999-8999-999999999999', 'No', 'No', now(), 'No', 1)$sql$, '23503');
select pg_temp.expect_error($sql$insert into public.ticket_types (event_id, name, capacity)
  values ('99999999-9999-4999-8999-999999999999', 'No', 1)$sql$, '23503');
select pg_temp.expect_error($sql$delete from auth.users
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$sql$, '23503');

set local role authenticated;
select pg_temp.login('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
delete from public.ticket_types
  where event_id = '11111111-1111-4111-8111-111111111111' and name = 'VIP';
select pg_temp.assert_true((select count(*) = 1 from public.ticket_types
  where event_id = '11111111-1111-4111-8111-111111111111'), 'owner deletes type');
delete from public.events where id = '11111111-1111-4111-8111-111111111111';
reset role;
select pg_temp.assert_true((select count(*) = 0 from public.ticket_types
  where event_id = '11111111-1111-4111-8111-111111111111'), 'event deletion cascades');

rollback;
\echo 'All events and ticket types checks passed.'
