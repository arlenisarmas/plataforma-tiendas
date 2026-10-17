-- =============================================================================
-- 20261015000002_funciones.sql
-- Funciones de negocio. Toda operación sensible (stock, pagos, publicación)
-- pasa por aquí para que las reglas vivan en un solo lugar y sean atómicas.
--
-- Convenciones:
--   * security definer + set search_path = '' + nombres calificados.
--   * Errores de negocio: raise exception con mensaje en MAYÚSCULAS_CON_GUIONES
--     (códigos estables que la app traduce a textos amables), errcode P0001.
--   * Falta de permisos: errcode 42501.
--   * EXECUTE se otorga explícitamente al final del archivo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers de autorización (usados por las políticas RLS)
-- -----------------------------------------------------------------------------
create or replace function public.is_platform_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.platform_admins a where a.user_id = auth.uid());
$$;

create or replace function public.is_store_member(p_store_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
           select 1 from public.store_members m
           where m.store_id = p_store_id and m.user_id = auth.uid())
         or public.is_platform_admin();
$$;

create or replace function public.is_store_owner(p_store_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
           select 1 from public.store_members m
           where m.store_id = p_store_id and m.user_id = auth.uid() and m.role = 'owner')
         or public.is_platform_admin();
$$;

create or replace function public.assert_store_member(p_store_id uuid)
returns void
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'SIN_PERMISO' using errcode = '42501';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Auditoría y notificaciones (internas)
-- -----------------------------------------------------------------------------
create or replace function public.write_audit(
  p_store_id uuid, p_action text, p_entity text, p_entity_id uuid, p_changes jsonb default '{}'::jsonb)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.audit_log (store_id, actor_id, action, entity, entity_id, changes)
  values (p_store_id, auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_changes, '{}'::jsonb));
$$;

create or replace function public.notify_store_owners(
  p_store_id uuid, p_kind text, p_title text, p_body text default null, p_link text default null)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.notifications (user_id, store_id, kind, title, body, link)
  select m.user_id, p_store_id, p_kind, p_title, p_body, p_link
  from public.store_members m
  where m.store_id = p_store_id and m.role = 'owner';
$$;

-- -----------------------------------------------------------------------------
-- Usuarios: perfil automático al registrarse
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(new.raw_user_meta_data ->> 'full_name', 120))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Tiendas
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

  if exists (select 1 from public.stores s where s.slug = lower(p_slug)) then
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

-- Copia el tema borrador al publicado y, si hace falta, publica la tienda.
create or replace function public.publish_store(p_store_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_store_owner(p_store_id) then
    raise exception 'SIN_PERMISO' using errcode = '42501';
  end if;

  if not exists (select 1 from public.pages p
                 where p.store_id = p_store_id and p.kind = 'home'
                   and p.published_version_id is not null) then
    raise exception 'FALTA_PUBLICAR_INICIO';
  end if;

  update public.stores s
     set theme_published = s.theme_draft,
         status = case when s.status = 'suspended' then s.status else 'published' end,
         published_at = coalesce(s.published_at, now())
   where s.id = p_store_id;

  if (select s.status from public.stores s where s.id = p_store_id) = 'suspended' then
    raise exception 'TIENDA_SUSPENDIDA';
  end if;

  perform public.write_audit(p_store_id, 'store.published', 'stores', p_store_id);
end;
$$;

-- Impide quedarse sin dueño (salvo cuando se borra la tienda completa).
create or replace function public.protect_last_owner()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if old.role = 'owner'
     and (tg_op = 'DELETE' or new.role <> 'owner')
     and exists (select 1 from public.stores s where s.id = old.store_id)
     and not exists (select 1 from public.store_members m
                     where m.store_id = old.store_id and m.role = 'owner'
                       and m.user_id <> old.user_id) then
    raise exception 'ULTIMO_DUENO';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger store_members_protect_last_owner
  before delete or update of role on public.store_members
  for each row execute function public.protect_last_owner();

create or replace function public.accept_store_invitation(p_token text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_inv   public.store_invitations;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'SIN_SESION' using errcode = '42501';
  end if;

  select * into v_inv
  from public.store_invitations i
  where i.token_hash = encode(public.extensions_digest(p_token), 'hex')
  for update;

  if not found or v_inv.accepted_at is not null or v_inv.expires_at < now() then
    raise exception 'INVITACION_INVALIDA';
  end if;

  select u.email into v_email from auth.users u where u.id = auth.uid();
  if lower(v_email) is distinct from lower(v_inv.email::text) then
    raise exception 'INVITACION_OTRO_EMAIL';
  end if;

  insert into public.store_members (store_id, user_id, role)
  values (v_inv.store_id, auth.uid(), v_inv.role)
  on conflict (store_id, user_id) do nothing;

  update public.store_invitations set accepted_at = now() where id = v_inv.id;
  perform public.write_audit(v_inv.store_id, 'member.joined', 'store_members', auth.uid());
  return v_inv.store_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Páginas
-- -----------------------------------------------------------------------------
create or replace function public.publish_page(p_page_id uuid, p_note text default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_page    public.pages;
  v_version integer;
  v_id      uuid;
begin
  select * into v_page from public.pages p where p.id = p_page_id for update;
  if not found then
    raise exception 'PAGINA_NO_EXISTE';
  end if;
  perform public.assert_store_member(v_page.store_id);

  select coalesce(max(v.version), 0) + 1 into v_version
  from public.page_versions v where v.page_id = p_page_id;

  insert into public.page_versions (page_id, store_id, version, blocks, note, created_by)
  values (p_page_id, v_page.store_id, v_version, v_page.draft_blocks, p_note, auth.uid())
  returning id into v_id;

  update public.pages
     set published_version_id = v_id, published_at = now()
   where id = p_page_id;

  perform public.write_audit(v_page.store_id, 'page.published', 'pages', p_page_id,
                             jsonb_build_object('version', v_version));
  return v_id;
end;
$$;

-- Trae una versión publicada anterior al borrador (no la publica).
create or replace function public.restore_page_version(p_page_id uuid, p_version_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_store  uuid;
  v_blocks jsonb;
begin
  select v.store_id, v.blocks into v_store, v_blocks
  from public.page_versions v
  where v.id = p_version_id and v.page_id = p_page_id;
  if not found then
    raise exception 'VERSION_NO_EXISTE';
  end if;
  perform public.assert_store_member(v_store);

  update public.pages
     set draft_blocks = v_blocks, draft_updated_at = now()
   where id = p_page_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Stock
-- -----------------------------------------------------------------------------
create or replace function public.create_inventory_for_variant()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.inventory (variant_id, store_id) values (new.id, new.store_id)
  on conflict (variant_id) do nothing;
  return new;
end;
$$;

create trigger product_variants_create_inventory
  after insert on public.product_variants
  for each row execute function public.create_inventory_for_variant();

-- Ajuste manual de stock (reponer, corregir, devolución). Devuelve el nuevo stock físico.
create or replace function public.adjust_stock(
  p_variant_id uuid, p_delta integer, p_reason public.stock_reason, p_note text default null)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_inv public.inventory;
begin
  if p_reason = 'sale' then
    raise exception 'MOTIVO_INVALIDO';           -- las ventas solo vía commit_reservation
  end if;
  if p_delta = 0 then
    raise exception 'CANTIDAD_INVALIDA';
  end if;

  select * into v_inv from public.inventory i where i.variant_id = p_variant_id for update;
  if not found then
    raise exception 'VARIANTE_NO_EXISTE';
  end if;
  perform public.assert_store_member(v_inv.store_id);

  if v_inv.on_hand + p_delta < v_inv.reserved then
    raise exception 'STOCK_MENOR_A_RESERVADO';
  end if;

  update public.inventory
     set on_hand = on_hand + p_delta
   where variant_id = p_variant_id;

  insert into public.inventory_movements (store_id, variant_id, delta, reason, note, created_by)
  values (v_inv.store_id, p_variant_id, p_delta, p_reason, p_note, auth.uid());

  return v_inv.on_hand + p_delta;
end;
$$;

-- Reserva el stock de todos los ítems de un pedido. Todo o nada.
-- Bloquea filas en orden de variant_id para evitar deadlocks.
-- Solo servidor (service_role).
create or replace function public.reserve_stock(p_order_id uuid, p_ttl interval default interval '30 minutes')
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  r record;
begin
  for r in
    select oi.store_id, oi.variant_id, sum(oi.quantity)::integer as qty,
           pv.track_inventory, pv.allow_backorder
    from public.order_items oi
    join public.product_variants pv on pv.id = oi.variant_id
    where oi.order_id = p_order_id
    group by oi.store_id, oi.variant_id, pv.track_inventory, pv.allow_backorder
    order by oi.variant_id
  loop
    continue when not r.track_inventory;

    perform 1 from public.inventory i where i.variant_id = r.variant_id for update;

    if not r.allow_backorder
       and (select i.on_hand - i.reserved from public.inventory i where i.variant_id = r.variant_id) < r.qty then
      raise exception 'STOCK_INSUFICIENTE' using detail = r.variant_id::text;
    end if;

    update public.inventory set reserved = reserved + r.qty where variant_id = r.variant_id;

    insert into public.stock_reservations (store_id, order_id, variant_id, quantity, expires_at)
    values (r.store_id, p_order_id, r.variant_id, r.qty, now() + p_ttl);
  end loop;
end;
$$;

-- Convierte las reservas activas de un pedido en venta. Idempotente.
create or replace function public.commit_reservation(p_order_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  r     record;
  v_dec integer;
  v_inv public.inventory;
begin
  for r in
    select sr.* from public.stock_reservations sr
    where sr.order_id = p_order_id and sr.status = 'active'
    order by sr.variant_id
    for update
  loop
    select * into v_inv from public.inventory i where i.variant_id = r.variant_id for update;
    v_dec := least(r.quantity, v_inv.on_hand);   -- con venta sin stock, no baja de cero

    update public.inventory
       set on_hand  = on_hand - v_dec,
           reserved = greatest(reserved - r.quantity, 0)
     where variant_id = r.variant_id;

    update public.stock_reservations set status = 'committed' where id = r.id;

    if v_dec > 0 then
      insert into public.inventory_movements (store_id, variant_id, delta, reason, order_id)
      values (r.store_id, r.variant_id, -v_dec, 'sale', p_order_id);
    end if;

    if v_inv.on_hand - v_dec - greatest(v_inv.reserved - r.quantity, 0) <= v_inv.low_stock_threshold then
      perform public.notify_store_owners(r.store_id, 'stock.low', 'Stock bajo',
        null, '/productos?variante=' || r.variant_id::text);
    end if;
  end loop;
end;
$$;

-- Libera las reservas activas de un pedido. Idempotente.
create or replace function public.release_reservation(p_order_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  r record;
begin
  for r in
    select sr.* from public.stock_reservations sr
    where sr.order_id = p_order_id and sr.status = 'active'
    order by sr.variant_id
    for update
  loop
    update public.inventory
       set reserved = greatest(reserved - r.quantity, 0)
     where variant_id = r.variant_id;
    update public.stock_reservations set status = 'released' where id = r.id;
  end loop;
end;
$$;

-- Cron: libera reservas vencidas y cancela pedidos impagos.
-- No toca pedidos con un pago en revisión (pago manual con comprobante).
create or replace function public.release_expired_reservations()
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_order uuid;
  v_count integer := 0;
begin
  for v_order in
    select distinct sr.order_id
    from public.stock_reservations sr
    where sr.status = 'active' and sr.expires_at < now()
      and not exists (select 1 from public.payments p
                      where p.order_id = sr.order_id and p.status = 'in_review')
  loop
    perform public.release_reservation(v_order);
    update public.orders
       set status = 'cancelled'
     where id = v_order and status = 'pending_payment';
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- -----------------------------------------------------------------------------
-- Pedidos
-- -----------------------------------------------------------------------------
create or replace function public.next_order_number(p_store_id uuid)
returns integer
language sql security definer set search_path = ''
as $$
  update public.store_counters
     set last_order_number = last_order_number + 1
   where store_id = p_store_id
  returning last_order_number;
$$;

-- Valida transiciones de estado y completa fechas. Libera stock al cancelar impagos.
create or replace function public.check_order_status_transition()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_allowed public.order_status[];
begin
  if new.status = old.status then
    return new;
  end if;

  v_allowed := case old.status
    when 'pending_payment'  then array['paid', 'cancelled']
    when 'paid'             then array['preparing', 'ready_for_pickup', 'shipped', 'cancelled', 'refunded']
    when 'preparing'        then array['ready_for_pickup', 'shipped', 'cancelled', 'refunded']
    when 'ready_for_pickup' then array['delivered', 'cancelled', 'refunded']
    when 'shipped'          then array['delivered', 'refunded']
    when 'delivered'        then array['refunded']
    else array[]::text[]
  end::public.order_status[];

  if not (new.status = any (v_allowed)) then
    raise exception 'CAMBIO_DE_ESTADO_INVALIDO'
      using detail = old.status::text || ' -> ' || new.status::text;
  end if;

  if new.status = 'paid' and new.paid_at is null then
    new.paid_at := now();
  end if;
  if new.status = 'cancelled' then
    new.cancelled_at := now();
    if old.status = 'pending_payment' then
      perform public.release_reservation(new.id);
    end if;
  end if;

  insert into public.audit_log (store_id, actor_id, action, entity, entity_id, changes)
  values (new.store_id, auth.uid(), 'order.status_changed', 'orders', new.id,
          jsonb_build_object('from', old.status, 'to', new.status));
  return new;
end;
$$;

create trigger orders_status_transition
  before update of status on public.orders
  for each row execute function public.check_order_status_transition();

-- Vista del pedido para el comprador sin cuenta (link con token del mail).
create or replace function public.get_order_for_buyer(p_order_id uuid, p_token text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders o
  where o.id = p_order_id
    and o.access_token_hash = encode(public.extensions_digest(p_token), 'hex');
  if not found then
    raise exception 'PEDIDO_NO_ENCONTRADO';
  end if;

  return jsonb_build_object(
    'id', v_order.id, 'number', v_order.number, 'status', v_order.status,
    'currency', v_order.currency, 'subtotal_amount', v_order.subtotal_amount,
    'shipping_amount', v_order.shipping_amount, 'discount_amount', v_order.discount_amount,
    'total_amount', v_order.total_amount, 'placed_at', v_order.placed_at,
    'shipping', v_order.shipping_snapshot,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
                'product_name', oi.product_name, 'variant_title', oi.variant_title,
                'quantity', oi.quantity, 'unit_price_amount', oi.unit_price_amount,
                'line_total_amount', oi.line_total_amount) order by oi.product_name)
              from public.order_items oi where oi.order_id = v_order.id), '[]'::jsonb),
    'payments', coalesce((select jsonb_agg(jsonb_build_object(
                'provider', p.provider, 'status', p.status, 'amount', p.amount,
                'instructions', spm.instructions, 'display_name', spm.display_name)
                order by p.created_at)
              from public.payments p
              left join public.store_payment_methods spm on spm.id = p.payment_method_id
              where p.order_id = v_order.id), '[]'::jsonb));
end;
$$;

-- -----------------------------------------------------------------------------
-- Pagos
-- -----------------------------------------------------------------------------
-- Aplica un nuevo estado de pago y sus efectos (stock + pedido). Idempotente.
-- Lo usan: el webhook de Mercado Pago (servidor) y confirm_manual_payment.
create or replace function public.apply_payment_status(
  p_payment_id uuid,
  p_status public.payment_status,
  p_provider_payment_id text default null,
  p_raw jsonb default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_pay   public.payments;
  v_order public.orders;
begin
  select * into v_pay from public.payments p where p.id = p_payment_id for update;
  if not found then
    raise exception 'PAGO_NO_EXISTE';
  end if;
  select * into v_order from public.orders o where o.id = v_pay.order_id for update;

  -- Estados finales: no se retrocede (salvo reembolso de un aprobado).
  if v_pay.status in ('approved', 'rejected', 'cancelled', 'refunded')
     and not (v_pay.status = 'approved' and p_status = 'refunded') then
    return;
  end if;

  update public.payments
     set status = p_status,
         provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
         raw = coalesce(p_raw, raw)
   where id = p_payment_id;

  if p_status = 'approved' then
    if v_order.status = 'pending_payment' then
      perform public.commit_reservation(v_order.id);
      update public.orders set status = 'paid' where id = v_order.id;
      perform public.notify_store_owners(v_order.store_id, 'order.paid',
        'Pedido #' || v_order.number || ' pagado', null, '/pedidos/' || v_order.id::text);
    else
      -- Pago aprobado de un pedido ya cancelado (ej. llegó tarde): avisar para devolver.
      perform public.notify_store_owners(v_order.store_id, 'payment.on_cancelled_order',
        'Pago recibido de un pedido cancelado (#' || v_order.number || ')',
        'Revisá el stock o devolvé el dinero.', '/pedidos/' || v_order.id::text);
    end if;
  elsif p_status in ('rejected', 'cancelled') then
    if v_order.status = 'pending_payment'
       and not exists (select 1 from public.payments p
                       where p.order_id = v_order.id and p.id <> p_payment_id
                         and p.status in ('pending', 'in_review', 'approved')) then
      update public.orders set status = 'cancelled' where id = v_order.id;
    end if;
  elsif p_status = 'refunded' then
    if v_order.status in ('paid', 'preparing', 'ready_for_pickup', 'shipped', 'delivered') then
      update public.orders set status = 'refunded' where id = v_order.id;
    end if;
  end if;

  perform public.write_audit(v_pay.store_id, 'payment.status_changed', 'payments', p_payment_id,
    jsonb_build_object('from', v_pay.status, 'to', p_status));
end;
$$;

-- El dueño o empleado aprueba o rechaza un pago manual (comprobante revisado).
create or replace function public.confirm_manual_payment(p_payment_id uuid, p_approve boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_pay public.payments;
begin
  select * into v_pay from public.payments p where p.id = p_payment_id;
  if not found then
    raise exception 'PAGO_NO_EXISTE';
  end if;
  perform public.assert_store_member(v_pay.store_id);

  if v_pay.provider <> 'manual' then
    raise exception 'SOLO_PAGOS_MANUALES';
  end if;
  if v_pay.status not in ('pending', 'in_review') then
    raise exception 'PAGO_YA_RESUELTO';
  end if;

  update public.payments set reviewed_by = auth.uid(), reviewed_at = now() where id = p_payment_id;
  perform public.apply_payment_status(p_payment_id,
    case when p_approve then 'approved' else 'rejected' end::public.payment_status);
end;
$$;

-- -----------------------------------------------------------------------------
-- Hash de tokens (invitaciones y acceso a pedidos)
-- pgcrypto vive en el esquema "extensions" en Supabase y en "public" en local;
-- este envoltorio resuelve ambos casos.
-- -----------------------------------------------------------------------------
create or replace function public.extensions_digest(p_value text)
returns bytea
language plpgsql immutable security definer set search_path = extensions, public
as $$
begin
  return digest(p_value, 'sha256');
end;
$$;

-- -----------------------------------------------------------------------------
-- Permisos de ejecución
-- -----------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.is_platform_admin(),
  public.is_store_member(uuid),
  public.is_store_owner(uuid)
to anon, authenticated;

grant execute on function
  public.create_store(text, text, text, text, text, text),
  public.publish_store(uuid),
  public.accept_store_invitation(text),
  public.publish_page(uuid, text),
  public.restore_page_version(uuid, uuid),
  public.adjust_stock(uuid, integer, public.stock_reason, text),
  public.confirm_manual_payment(uuid, boolean)
to authenticated;

grant execute on function public.get_order_for_buyer(uuid, text) to anon, authenticated;

grant execute on all functions in schema public to service_role;
