begin;
create extension if not exists pgtap with schema extensions;

select plan(1);
select is(
  (select count(*)::integer from cron.job
   where jobname = 'release-expired-reservations'
     and schedule = '*/5 * * * *'
     and command = 'select public.release_expired_reservations();'
     and active),
  1,
  'the expired-reservations job runs every five minutes'
);
select * from finish();
rollback;
