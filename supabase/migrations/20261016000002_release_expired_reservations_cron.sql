-- Keep expired stock reservations from holding inventory indefinitely.
create schema if not exists extensions;
create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'release-expired-reservations',
  '*/5 * * * *',
  'select public.release_expired_reservations();'
);

-- A failed registration must also fail the migration in the Supabase CI reset.
do $$
begin
  if not exists (
    select 1 from cron.job
    where jobname = 'release-expired-reservations'
      and schedule = '*/5 * * * *'
      and command = 'select public.release_expired_reservations();'
      and active
  ) then
    raise exception 'release-expired-reservations cron job was not registered';
  end if;
end;
$$;
