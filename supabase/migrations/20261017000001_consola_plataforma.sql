-- =============================================================================
-- 20261017000001_consola_plataforma.sql  (T-033)
-- Consola de plataforma: permisos para crear tiendas, cupos, personas pausadas,
-- invitaciones de plataforma, presencia y horarios de trabajo, y funciones de
-- lectura solo para administradores de plataforma.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Perfiles: permisos y estado (solo los cambia un admin de plataforma)
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column can_create_stores boolean not null default false,
  add column max_stores smallint not null default 0 check (max_stores between 0 and 50),
  add column status text not null default 'active' check (status in ('active', 'suspended')),
  add column last_seen_at timestamptz;

-- Quienes ya son dueños conservan sus tiendas; no pueden crear más sin permiso nuevo.
update public.profiles p
   set can_create_stores = true,
       max_stores = least(50, (select count(*) from public.store_members m
                               where m.user_id = p.id and m.role = 'owner'))
 where exists (select 1 from public.store_members m where m.user_id = p.id and m.role = 'owner');

-- Las columnas nuevas NO se agregan al grant de update del usuario (ver 20261015000003).

create or replace function public.current_user_active()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.status = 'active' from public.profiles p where p.id = auth.uid()), true);
$$;

-- Una persona pausada pierde el acceso a las tiendas (todas las políticas RLS usan estas funciones).
create or replace function public.is_store_member(p_store_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select (exists (select 1 from public.store_members m
                  where m.store_id = p_store_id and m.user_id = auth.uid())
          and public.current_user_active())
         or public.is_platform_admin();
$$;

create or replace function public.is_store_owner(p_store_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select (exists (select 1 from public.store_members m
                  where m.store_id = p_store_id and m.user_id = auth.uid() and m.role = 'owner')
          and public.current_user_active())
         or public.is_platform_admin();
$$;

create or replace function public.assert_platform_admin()
returns void
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'SIN_PERMISO' using errcode = '42501';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Crear tienda: requiere permiso y respeta el cupo (los admins no tienen límite)
-- -----------------------------------------------------------------------------
create or replace function public.create_store(
  p_name text,
  p_slug text,
  p_country_code text,
  p_currency text,
  p_locale text default 'es-419',
  p_timezone text default 'America/Argentina/Buenos_Aires')
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_user    uuid := auth.uid();
  v_store   uuid;
  v_profile public.profiles;
begin
  if v_user is null then
    raise exception 'SIN_SESION' using errcode = '42501';
  end if;

  if not public.is_platform_admin() then
    select * into v_profile from public.profiles p where p.id = v_user;
    if not found or not v_profile.can_create_stores or v_profile.status <> 'active' then
      raise exception 'SIN_PERMISO_PARA_CREAR' using errcode = '42501';
    end if;
    if (select count(*) from public.store_members m
        where m.user_id = v_user and m.role = 'owner') >= v_profile.max_stores then
      raise exception 'LIMITE_DE_TIENDAS';
    end if;
  end if;

  if public.is_reserved_store_slug(p_slug)
     or exists (select 1 from public.stores s where s.slug = lower(p_slug)) then
    raise exception 'DIRECCION_EN_USO';
  end if;

  insert into public.stores (name, slug, country_code, currency, default_locale, timezone, created_by)
  values (trim(p_name), lower(p_slug), upper(p_country_code), upper(p_currency), p_locale, p_timezone, v_user)
  returning id into v_store;

  insert into public.store_members (store_id, user_id, role) values (v_store, v_user, 'owner');
  insert into public.store_counters (store_id) values (v_store);
  insert into public.pages (store_id, kind, slug, title, show_in_nav, nav_position)
  values (v_store, 'home', '', 'Inicio', true, 0);

  perform public.write_audit(v_store, 'store.created', 'stores', v_store);
  return v_store;
end;
$$;

-- -----------------------------------------------------------------------------
-- Invitaciones de plataforma
-- -----------------------------------------------------------------------------
create table public.platform_invitations (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  full_name          text check (char_length(full_name) <= 120),
  can_create_stores  boolean not null default false,
  max_stores         smallint not null default 0 check (max_stores between 0 and 50),
  store_id           uuid references public.stores (id) on delete cascade,
  store_role         public.member_role,
  token_hash         text not null unique,
  invited_by         uuid references auth.users (id) on delete set null,
  expires_at         timestamptz not null default now() + interval '7 days',
  accepted_at        timestamptz,
  accepted_by        uuid references auth.users (id) on delete set null,
  revoked_at         timestamptz,
  created_at         timestamptz not null default now(),
  check ((store_id is null) = (store_role is null)),
  check (can_create_stores or store_id is not null)
);
create index platform_invitations_email_idx on public.platform_invitations (email);
create index platform_invitations_store_idx on public.platform_invitations (store_id);
alter table public.platform_invitations enable row level security;
grant select on public.platform_invitations to authenticated;
create policy platform_invitations_admin_select on public.platform_invitations
  for select to authenticated using (public.is_platform_admin());

create or replace function public.create_platform_invitation(
  p_email text, p_full_name text, p_can_create boolean, p_max_stores smallint,
  p_store_id uuid, p_store_role public.member_role, p_token_hash text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
  perform public.assert_platform_admin();
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'INVITACION_INVALIDA';
  end if;
  insert into public.platform_invitations (email, full_name, can_create_stores, max_stores,
                                           store_id, store_role, token_hash, invited_by)
  values (lower(trim(p_email)), nullif(trim(p_full_name), ''), coalesce(p_can_create, false),
          case when coalesce(p_can_create, false) then greatest(coalesce(p_max_stores, 1), 1) else 0 end,
          p_store_id, case when p_store_id is null then null else coalesce(p_store_role, 'staff') end,
          p_token_hash, auth.uid())
  returning id into v_id;
  perform public.write_audit(p_store_id, 'platform.invitation_created', 'platform_invitations', v_id,
    jsonb_build_object('email', lower(trim(p_email))));
  return v_id;
end;
$$;

create or replace function public.revoke_platform_invitation(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.assert_platform_admin();
  update public.platform_invitations set revoked_at = now()
   where id = p_id and accepted_at is null and revoked_at is null;
  if not found then raise exception 'INVITACION_INVALIDA'; end if;
  perform public.write_audit(null, 'platform.invitation_revoked', 'platform_invitations', p_id);
end;
$$;

-- Renueva el token y el vencimiento de una invitación pendiente (para «Reenviar»).
create or replace function public.renew_platform_invitation(p_id uuid, p_token_hash text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.assert_platform_admin();
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'INVITACION_INVALIDA';
  end if;
  update public.platform_invitations
     set token_hash = p_token_hash, expires_at = now() + interval '7 days'
   where id = p_id and accepted_at is null and revoked_at is null;
  if not found then raise exception 'INVITACION_INVALIDA'; end if;
end;
$$;

-- Para la pantalla de registro: dice si un token es válido y para qué email (sin exponer nada más).
create or replace function public.check_platform_invitation(p_token text)
returns table (email text, full_name text)
language sql stable security definer set search_path = ''
as $$
  select i.email, i.full_name
    from public.platform_invitations i
   where i.token_hash = encode(public.extensions_digest(p_token), 'hex')
     and i.accepted_at is null and i.revoked_at is null and i.expires_at > now();
$$;

create or replace function public.accept_platform_invitation(p_token text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_user  uuid := auth.uid();
  v_inv   public.platform_invitations;
  v_email text;
begin
  if v_user is null then
    raise exception 'SIN_SESION' using errcode = '42501';
  end if;

  select * into v_inv from public.platform_invitations i
   where i.token_hash = encode(public.extensions_digest(p_token), 'hex')
   for update;
  if not found or v_inv.accepted_at is not null or v_inv.revoked_at is not null
     or v_inv.expires_at < now() then
    raise exception 'INVITACION_INVALIDA';
  end if;

  select u.email into v_email from auth.users u where u.id = v_user;
  if lower(v_email) is distinct from v_inv.email then
    raise exception 'INVITACION_OTRO_EMAIL';
  end if;

  update public.profiles p
     set can_create_stores = p.can_create_stores or v_inv.can_create_stores,
         max_stores = greatest(p.max_stores, v_inv.max_stores),
         full_name = coalesce(p.full_name, v_inv.full_name)
   where p.id = v_user;

  if v_inv.store_id is not null then
    insert into public.store_members (store_id, user_id, role)
    values (v_inv.store_id, v_user, v_inv.store_role)
    on conflict (store_id, user_id) do update set role = excluded.role;

    -- Si un admin creó la tienda para esta persona, deja de figurar como dueño
    -- (sigue viéndola desde la consola).
    if v_inv.store_role = 'owner' and v_inv.invited_by is not null and v_inv.invited_by <> v_user
       and exists (select 1 from public.platform_admins a where a.user_id = v_inv.invited_by) then
      delete from public.store_members m
       where m.store_id = v_inv.store_id and m.user_id = v_inv.invited_by;
    end if;
  end if;

  update public.platform_invitations
     set accepted_at = now(), accepted_by = v_user
   where id = v_inv.id;
  perform public.write_audit(v_inv.store_id, 'platform.invitation_accepted', 'platform_invitations', v_inv.id);
  return v_inv.store_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Permisos de personas y estado de tiendas
-- -----------------------------------------------------------------------------
create or replace function public.set_person_permissions(
  p_user uuid, p_can_create boolean, p_max_stores smallint, p_status text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.assert_platform_admin();
  if p_status not in ('active', 'suspended') or p_max_stores not between 0 and 50 then
    raise exception 'DATOS_INVALIDOS';
  end if;
  if p_user = auth.uid() and p_status = 'suspended' then
    raise exception 'NO_PODES_PAUSARTE';
  end if;
  update public.profiles
     set can_create_stores = p_can_create, max_stores = p_max_stores, status = p_status
   where id = p_user;
  if not found then raise exception 'PERSONA_NO_EXISTE'; end if;
  perform public.write_audit(null, 'platform.person_updated', 'profiles', p_user,
    jsonb_build_object('can_create_stores', p_can_create, 'max_stores', p_max_stores, 'status', p_status));
end;
$$;

create or replace function public.set_store_suspended(p_store uuid, p_suspended boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.assert_platform_admin();
  update public.stores s
     set status = case
                    when p_suspended then 'suspended'::public.store_status
                    when exists (select 1 from public.pages pg where pg.store_id = s.id and pg.kind = 'home'
                                 and pg.published_version_id is not null)
                         and s.published_at is not null then 'published'::public.store_status
                    else 'draft'::public.store_status
                  end
   where s.id = p_store;
  if not found then raise exception 'TIENDA_NO_EXISTE'; end if;
  perform public.write_audit(p_store, case when p_suspended then 'store.suspended' else 'store.reactivated' end,
    'stores', p_store);
end;
$$;

-- -----------------------------------------------------------------------------
-- Presencia y horarios de trabajo
-- -----------------------------------------------------------------------------
create table public.work_sessions (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  store_id      uuid references public.stores (id) on delete cascade,
  started_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  check (last_seen_at >= started_at)
);
create index work_sessions_user_idx on public.work_sessions (user_id, last_seen_at desc);
create index work_sessions_store_idx on public.work_sessions (store_id, started_at desc);
create index work_sessions_recent_idx on public.work_sessions (last_seen_at desc);
alter table public.work_sessions enable row level security;
grant select on public.work_sessions to authenticated;
create policy work_sessions_select on public.work_sessions
  for select to authenticated using (
    user_id = (select auth.uid())
    or public.is_platform_admin()
    or (store_id is not null and public.is_store_owner(store_id)));

-- Llamada barata desde el panel (como mucho una vez por minuto): extiende la sesión
-- vigente (menos de 15 min sin actividad) o abre una nueva.
create or replace function public.touch_work_session(p_store uuid default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_id   bigint;
begin
  if v_user is null then return; end if;
  if p_store is not null and not public.is_store_member(p_store) then
    raise exception 'SIN_PERMISO' using errcode = '42501';
  end if;
  update public.profiles set last_seen_at = now() where id = v_user;
  select w.id into v_id from public.work_sessions w
   where w.user_id = v_user and w.store_id is not distinct from p_store
     and w.last_seen_at > now() - interval '15 minutes'
   order by w.last_seen_at desc limit 1;
  if v_id is null then
    insert into public.work_sessions (user_id, store_id) values (v_user, p_store);
  else
    update public.work_sessions set last_seen_at = now() where id = v_id;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Auditoría: cada persona ve sus propias acciones («Lo último que hiciste»)
-- -----------------------------------------------------------------------------
create policy audit_log_own_select on public.audit_log
  for select to authenticated using (actor_id = (select auth.uid()));
create index audit_log_actor_idx on public.audit_log (actor_id, created_at desc);
create index audit_log_created_idx on public.audit_log (created_at desc);

-- -----------------------------------------------------------------------------
-- Lecturas de la consola (solo admins de plataforma)
-- -----------------------------------------------------------------------------
create or replace function public.platform_overview()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.assert_platform_admin();
  return jsonb_build_object(
    'stores', (select count(*) from public.stores where status <> 'suspended'),
    'storesPublished', (select count(*) from public.stores where status = 'published'),
    'people', (select count(*) from public.profiles),
    'workingNow', (select count(distinct user_id) from public.work_sessions
                   where last_seen_at > now() - interval '5 minutes'),
    'ordersToday', (select count(*) from public.orders where placed_at >= date_trunc('day', now())),
    'ordersPending', (select count(*) from public.orders where status = 'pending_payment'),
    'invitationsPending', (select count(*) from public.platform_invitations
                           where accepted_at is null and revoked_at is null and expires_at > now()));
end;
$$;

create or replace function public.platform_stores()
returns table (id uuid, name text, slug text, status text, country_code text, currency text,
               owners text, products bigint, orders bigint, last_activity timestamptz, created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.assert_platform_admin();
  return query
  select s.id, s.name, s.slug, s.status::text, s.country_code::text, s.currency::text,
         (select string_agg(coalesce(p.full_name, u.email::text), ', ' order by m.created_at)
            from public.store_members m
            join auth.users u on u.id = m.user_id
            left join public.profiles p on p.id = m.user_id
           where m.store_id = s.id and m.role = 'owner'),
         (select count(*) from public.products pr where pr.store_id = s.id and pr.status <> 'archived'),
         (select count(*) from public.orders o where o.store_id = s.id),
         greatest(s.updated_at, (select max(a.created_at) from public.audit_log a where a.store_id = s.id)),
         s.created_at
    from public.stores s
   order by 10 desc nulls last;
end;
$$;

create or replace function public.platform_people()
returns table (id uuid, email text, full_name text, can_create_stores boolean, max_stores smallint,
               owned_stores bigint, status text, is_admin boolean, stores jsonb,
               last_seen_at timestamptz, created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.assert_platform_admin();
  return query
  select p.id, u.email::text, p.full_name, p.can_create_stores, p.max_stores,
         (select count(*) from public.store_members m where m.user_id = p.id and m.role = 'owner'),
         p.status, exists (select 1 from public.platform_admins a where a.user_id = p.id),
         coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'role', m.role) order by s.name)
                     from public.store_members m join public.stores s on s.id = m.store_id
                    where m.user_id = p.id), '[]'::jsonb),
         p.last_seen_at, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
   order by p.last_seen_at desc nulls last, p.created_at desc;
end;
$$;

create or replace function public.platform_presence()
returns table (user_id uuid, full_name text, email text, store_id uuid, store_name text,
               started_at timestamptz, last_seen_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.assert_platform_admin();
  return query
  select distinct on (w.user_id) w.user_id, p.full_name, u.email::text, w.store_id, s.name,
         w.started_at, w.last_seen_at
    from public.work_sessions w
    join auth.users u on u.id = w.user_id
    left join public.profiles p on p.id = w.user_id
    left join public.stores s on s.id = w.store_id
   where w.last_seen_at > now() - interval '5 minutes'
   order by w.user_id, w.last_seen_at desc;
end;
$$;

create or replace function public.platform_activity(
  p_limit integer default 50, p_offset integer default 0,
  p_store uuid default null, p_user uuid default null)
returns table (id bigint, created_at timestamptz, actor_id uuid, actor_name text, store_id uuid,
               store_name text, action text, entity text, changes jsonb)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.assert_platform_admin();
  return query
  select a.id, a.created_at, a.actor_id, coalesce(p.full_name, u.email::text), a.store_id, s.name,
         a.action, a.entity, a.changes
    from public.audit_log a
    left join auth.users u on u.id = a.actor_id
    left join public.profiles p on p.id = a.actor_id
    left join public.stores s on s.id = a.store_id
   where (p_store is null or a.store_id = p_store)
     and (p_user is null or a.actor_id = p_user)
   order by a.created_at desc, a.id desc
   limit least(greatest(coalesce(p_limit, 50), 1), 200) offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

-- Minutos trabajados por persona y tienda en un rango de días (zona horaria de la plataforma).
create or replace function public.platform_work_hours(p_from date, p_to date)
returns table (user_id uuid, full_name text, email text, store_id uuid, store_name text,
               minutes integer, sessions integer)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.assert_platform_admin();
  if p_to < p_from or p_to - p_from > 366 then raise exception 'DATOS_INVALIDOS'; end if;
  return query
  select w.user_id, p.full_name, u.email::text, w.store_id, s.name,
         sum(greatest(1, ceil(extract(epoch from (w.last_seen_at - w.started_at)) / 60.0)))::integer,
         count(*)::integer
    from public.work_sessions w
    join auth.users u on u.id = w.user_id
    left join public.profiles p on p.id = w.user_id
    left join public.stores s on s.id = w.store_id
   where w.started_at >= (p_from::timestamp at time zone 'America/Argentina/Buenos_Aires')
     and w.started_at < ((p_to + 1)::timestamp at time zone 'America/Argentina/Buenos_Aires')
   group by w.user_id, p.full_name, u.email, w.store_id, s.name
   order by 6 desc;
end;
$$;

-- -----------------------------------------------------------------------------
-- Permisos de ejecución (los nuevos no se exponen por defecto)
-- -----------------------------------------------------------------------------
revoke execute on function
  public.current_user_active(), public.assert_platform_admin(),
  public.create_platform_invitation(text, text, boolean, smallint, uuid, public.member_role, text),
  public.revoke_platform_invitation(uuid), public.renew_platform_invitation(uuid, text),
  public.check_platform_invitation(text), public.accept_platform_invitation(text),
  public.set_person_permissions(uuid, boolean, smallint, text), public.set_store_suspended(uuid, boolean),
  public.touch_work_session(uuid), public.platform_overview(), public.platform_stores(),
  public.platform_people(), public.platform_presence(),
  public.platform_activity(integer, integer, uuid, uuid), public.platform_work_hours(date, date)
from public, anon;

grant execute on function
  public.current_user_active(),
  public.create_platform_invitation(text, text, boolean, smallint, uuid, public.member_role, text),
  public.revoke_platform_invitation(uuid), public.renew_platform_invitation(uuid, text),
  public.accept_platform_invitation(text),
  public.set_person_permissions(uuid, boolean, smallint, text), public.set_store_suspended(uuid, boolean),
  public.touch_work_session(uuid), public.platform_overview(), public.platform_stores(),
  public.platform_people(), public.platform_presence(),
  public.platform_activity(integer, integer, uuid, uuid), public.platform_work_hours(date, date)
to authenticated;

-- El registro por invitación consulta el token antes de que exista la cuenta.
grant execute on function public.check_platform_invitation(text) to anon, authenticated;

grant execute on all functions in schema public to service_role;
grant all on public.platform_invitations, public.work_sessions to service_role;
