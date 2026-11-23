-- Align older databases created outside the CLI with the versioned schema.
-- This is a no-op on databases that already match the original migrations.
do $migration$
declare
  foreign_key_definition text;
begin
  if to_regclass('public.registrations_event_email_key') is not null
    and to_regclass('public.registrations_event_email_unique') is null then
    execute 'alter index public.registrations_event_email_key rename to registrations_event_email_unique';
  end if;

  select pg_get_constraintdef(oid) into foreign_key_definition
  from pg_constraint
  where conrelid = 'public.registrations'::regclass
    and conname = 'registrations_ticket_type_id_fkey';

  if foreign_key_definition = 'FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id) ON DELETE CASCADE' then
    execute 'alter table public.registrations drop constraint registrations_ticket_type_id_fkey';
    execute $constraint$
      alter table public.registrations
        add constraint registrations_ticket_type_id_fkey
        foreign key (ticket_type_id) references public.ticket_types(id) on delete restrict
    $constraint$;
  elsif foreign_key_definition is distinct from 'FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id) ON DELETE RESTRICT' then
    raise exception 'Unexpected registrations_ticket_type_id_fkey definition: %', foreign_key_definition;
  end if;
end
$migration$;
