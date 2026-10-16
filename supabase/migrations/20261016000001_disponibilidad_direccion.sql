-- =============================================================================
-- 20261016000001_disponibilidad_direccion.sql
-- Decisión del arquitecto (#10): el asistente "Creá tu tienda" necesita saber si
-- una dirección (slug) está libre ANTES de crear la tienda. Por RLS, un usuario no
-- ve tiendas ajenas, así que se expone una función que solo responde sí/no,
-- sin revelar datos de otras tiendas.
-- También se reservan direcciones que usa la plataforma (admin, api, www…).
-- =============================================================================

create or replace function public.is_reserved_store_slug(p_slug text)
returns boolean
language sql immutable
set search_path = ''
as $$
  select lower(coalesce(p_slug, '')) = any (array[
    'admin', 'api', 'app', 'www', 'panel', 'soporte', 'ayuda', 'help', 'login', 'registro',
    'static', 'assets', 'cdn', 'mail', 'email', 'blog', 'tienda', 'tiendas', 'plataforma',
    'status', 'docs', 'dev', 'staging', 'test', 'demo'
  ]);
$$;

-- Devuelve: 'disponible' | 'en_uso' | 'invalida'. Solo para usuarios con sesión.
create or replace function public.check_store_slug(p_slug text)
returns text
language sql stable security definer
set search_path = ''
as $$
  select case
    when p_slug is null
      or char_length(p_slug) not between 3 and 40
      or p_slug !~ '^[a-z0-9](-?[a-z0-9])*$' then 'invalida'
    when public.is_reserved_store_slug(p_slug)
      or exists (select 1 from public.stores s where s.slug = p_slug) then 'en_uso'
    else 'disponible'
  end;
$$;

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
  v_user  uuid := auth.uid();
  v_store uuid;
begin
  if v_user is null then
    raise exception 'SIN_SESION' using errcode = '42501';
  end if;

  -- Límite de tiendas por persona (evita abuso). Los administradores no tienen límite.
  if not public.is_platform_admin()
     and (select count(*) from public.store_members m
          where m.user_id = v_user and m.role = 'owner') >= 5 then
    raise exception 'LIMITE_DE_TIENDAS';
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


revoke execute on function public.is_reserved_store_slug(text) from public, anon, authenticated;
revoke execute on function public.check_store_slug(text) from public, anon;
grant execute on function public.check_store_slug(text) to authenticated;
grant execute on function public.is_reserved_store_slug(text), public.check_store_slug(text) to service_role;
