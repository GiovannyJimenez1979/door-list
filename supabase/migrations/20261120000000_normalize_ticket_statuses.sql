do $migration$
begin
  execute 'alter table public.tickets drop constraint tickets_status_check';

  update public.tickets
  set status = case status
    when 'use it' then 'used'
    when 'revoke' then 'revoked'
    else status
  end;

  execute $constraint$
    alter table public.tickets add constraint tickets_status_check
      check (status in ('valid', 'used', 'revoked'))
  $constraint$;
end
$migration$;
