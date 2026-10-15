-- =============================================================================
-- 20261015000003_seguridad.sql
-- Row Level Security, permisos por columna y vistas públicas del storefront.
--
-- Modelo:
--   * anon (visitantes)      → NO accede a tablas de public. Solo a las vistas
--                              del esquema "storefront" (datos publicados y públicos).
--   * authenticated          → accede a tablas de public según RLS:
--                              miembros de la tienda (dueño/empleado) y, para sus
--                              propios datos, compradores con cuenta.
--   * service_role (servidor) → acceso total (bypass RLS). Solo en servidor.
--
-- Requiere en Supabase: agregar "storefront" a los esquemas expuestos de la API.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Habilitar RLS en TODAS las tablas de public
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Permisos de tabla (antes de RLS, Postgres verifica estos permisos)
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Lo que se cree en el futuro NO queda expuesto por defecto: cada migración
-- nueva debe otorgar permisos explícitos (ver AGENTS.md §4).
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant execute on functions to service_role;

-- Perfil propio
grant select on public.profiles to authenticated;
grant update (full_name, locale, ui_mode, guided, text_scale) on public.profiles to authenticated;
grant select on public.platform_admins to authenticated;

-- Tienda: país, moneda y dirección (slug) no se cambian desde el panel en Etapa 1.
grant select on public.stores to authenticated;
grant update (name, default_locale, timezone, logo_asset_id, theme_draft, contact, onboarding)
  on public.stores to authenticated;

-- Miembros: se suman solo por invitación (accept_store_invitation).
grant select, delete on public.store_members to authenticated;
grant update (role) on public.store_members to authenticated;
grant select, insert, delete on public.store_invitations to authenticated;

-- Dominios: los gestiona el servidor (requiere API de Vercel).
grant select on public.store_domains to authenticated;

-- Medios
grant select, insert, delete on public.media_assets to authenticated;
grant update (alt_text) on public.media_assets to authenticated;

-- Páginas: la publicación solo vía publish_page.
grant select, delete on public.pages to authenticated;
grant insert (store_id, kind, slug, title, show_in_nav, nav_position, seo, draft_blocks)
  on public.pages to authenticated;
grant update (kind, slug, title, show_in_nav, nav_position, seo, draft_blocks, draft_updated_at)
  on public.pages to authenticated;
grant select on public.page_versions to authenticated;

-- Catálogo
grant select, insert, update, delete on
  public.categories, public.products, public.product_images,
  public.product_variants, public.shipping_methods,
  public.customers, public.customer_addresses
to authenticated;

-- Stock: solo lectura; cambios vía adjust_stock / funciones de reserva.
grant select on public.inventory, public.inventory_movements, public.stock_reservations
  to authenticated;
grant update (low_stock_threshold) on public.inventory to authenticated;

-- Medios de pago: credenciales (secret_id, connected_*) solo las escribe el servidor.
grant select, delete on public.store_payment_methods to authenticated;
grant insert (store_id, provider, method_key, display_name, is_enabled, instructions, position)
  on public.store_payment_methods to authenticated;
grant update (display_name, is_enabled, instructions, position)
  on public.store_payment_methods to authenticated;

-- Pedidos y pagos: los crea el servidor; el panel cambia estado y nota interna.
grant select on public.orders, public.order_items, public.payments to authenticated;
grant update (status, internal_note) on public.orders to authenticated;

-- Auditoría y notificaciones
grant select on public.audit_log to authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- store_counters y payment_events: sin permisos para authenticated (solo servidor).

-- -----------------------------------------------------------------------------
-- 3. Políticas RLS
-- -----------------------------------------------------------------------------

-- Perfiles
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy platform_admins_select_own on public.platform_admins
  for select to authenticated using (user_id = (select auth.uid()));

-- Tiendas
create policy stores_select_member on public.stores
  for select to authenticated using (public.is_store_member(id));
create policy stores_update_owner on public.stores
  for update to authenticated using (public.is_store_owner(id)) with check (public.is_store_owner(id));

-- Miembros
create policy store_members_select on public.store_members
  for select to authenticated using (public.is_store_member(store_id));
create policy store_members_update_owner on public.store_members
  for update to authenticated using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));
create policy store_members_delete on public.store_members
  for delete to authenticated
  using (public.is_store_owner(store_id) or user_id = (select auth.uid()));   -- dueño o salir uno mismo

-- Invitaciones
create policy store_invitations_owner_select on public.store_invitations
  for select to authenticated using (public.is_store_owner(store_id));
create policy store_invitations_owner_insert on public.store_invitations
  for insert to authenticated with check (public.is_store_owner(store_id));
create policy store_invitations_owner_delete on public.store_invitations
  for delete to authenticated using (public.is_store_owner(store_id));

-- Políticas estándar "miembro de la tienda" para tablas con store_id
do $$
declare
  t text;
begin
  -- CRUD completo para miembros
  foreach t in array array[
    'media_assets', 'pages', 'categories', 'products', 'product_images', 'product_variants',
    'shipping_methods', 'store_payment_methods', 'customers', 'customer_addresses'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_store_member(store_id))',
      t || '_member_select', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_store_member(store_id))',
      t || '_member_insert', t);
    execute format(
      'create policy %I on public.%I for update to authenticated
         using (public.is_store_member(store_id)) with check (public.is_store_member(store_id))',
      t || '_member_update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_store_member(store_id))',
      t || '_member_delete', t);
  end loop;

  -- Solo lectura para miembros
  foreach t in array array[
    'store_domains', 'page_versions', 'inventory', 'inventory_movements',
    'stock_reservations', 'order_items', 'payments'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_store_member(store_id))',
      t || '_member_select', t);
  end loop;
end;
$$;

-- Restricciones extra sobre las políticas estándar
create policy media_assets_only_public_bucket on public.media_assets
  as restrictive for insert to authenticated
  with check (bucket = 'store-media');          -- comprobantes los sube el servidor

create policy inventory_member_update on public.inventory
  for update to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

-- Pedidos
create policy orders_member_select on public.orders
  for select to authenticated using (public.is_store_member(store_id));
create policy orders_member_update on public.orders
  for update to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

-- Compradores con cuenta: ven sus propios datos
create policy customers_buyer_select on public.customers
  for select to authenticated using (user_id = (select auth.uid()));
create policy customer_addresses_buyer_select on public.customer_addresses
  for select to authenticated
  using (exists (select 1 from public.customers c
                 where c.id = customer_id and c.user_id = (select auth.uid())));
create policy orders_buyer_select on public.orders
  for select to authenticated
  using (exists (select 1 from public.customers c
                 where c.id = customer_id and c.user_id = (select auth.uid())));
create policy order_items_buyer_select on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o join public.customers c on c.id = o.customer_id
                 where o.id = order_id and c.user_id = (select auth.uid())));

-- Auditoría: solo dueños
create policy audit_log_owner_select on public.audit_log
  for select to authenticated using (public.is_store_owner(store_id));

-- Notificaciones propias
create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- 4. Esquema "storefront": vistas públicas de solo lectura
--   Solo datos de tiendas publicadas y solo columnas públicas.
--   security_barrier evita filtraciones a través de funciones en filtros.
-- -----------------------------------------------------------------------------
create schema storefront;

create view storefront.stores with (security_barrier = true) as
select s.id, s.slug, s.name, s.country_code, s.currency, s.default_locale, s.timezone,
       s.theme_published as theme, s.contact, s.logo_asset_id, s.published_at
from public.stores s
where s.status = 'published';

create view storefront.domains with (security_barrier = true) as
select d.hostname, d.store_id, d.kind, d.is_primary
from public.store_domains d
join public.stores s on s.id = d.store_id
where s.status = 'published'
  and (d.kind = 'subdomain' or d.verified_at is not null);

create view storefront.media with (security_barrier = true) as
select m.id, m.store_id, m.path, m.kind, m.mime_type, m.width, m.height, m.alt_text
from public.media_assets m
join public.stores s on s.id = m.store_id
where s.status = 'published' and m.bucket = 'store-media';

create view storefront.pages with (security_barrier = true) as
select p.id, p.store_id, p.kind, p.slug, p.title, p.show_in_nav, p.nav_position, p.seo,
       v.blocks, v.version, p.published_at
from public.pages p
join public.page_versions v on v.id = p.published_version_id
join public.stores s on s.id = p.store_id
where s.status = 'published';

create view storefront.categories with (security_barrier = true) as
select c.id, c.store_id, c.parent_id, c.name, c.slug, c.description, c.image_asset_id, c.position
from public.categories c
join public.stores s on s.id = c.store_id
where s.status = 'published' and c.is_visible;

create view storefront.products with (security_barrier = true) as
select p.id, p.store_id, p.category_id, p.name, p.slug, p.description, p.is_featured, p.seo,
       p.search, p.created_at
from public.products p
join public.stores s on s.id = p.store_id
where s.status = 'published' and p.status = 'active';

create view storefront.product_images with (security_barrier = true) as
select pi.product_id, pi.store_id, pi.position, m.id as asset_id, m.path, m.width, m.height, m.alt_text
from public.product_images pi
join public.products p on p.id = pi.product_id and p.status = 'active'
join public.media_assets m on m.id = pi.asset_id and m.bucket = 'store-media'
join public.stores s on s.id = pi.store_id
where s.status = 'published';

-- Stock disponible calculado en el momento (no se cachea en el storefront).
create view storefront.variants with (security_barrier = true) as
select v.id, v.store_id, v.product_id, v.sku, v.title, v.options,
       v.price_amount, v.compare_at_amount, v.position, v.is_default,
       case when v.track_inventory and not v.allow_backorder
            then greatest(i.on_hand - i.reserved, 0) end as available_quantity,
       (not v.track_inventory or v.allow_backorder or i.on_hand - i.reserved > 0) as is_available
from public.product_variants v
join public.products p on p.id = v.product_id and p.status = 'active'
join public.stores s on s.id = v.store_id
left join public.inventory i on i.variant_id = v.id
where s.status = 'published';

create view storefront.shipping_methods with (security_barrier = true) as
select sm.id, sm.store_id, sm.name, sm.kind, sm.description, sm.price_amount,
       sm.free_over_amount, sm.position
from public.shipping_methods sm
join public.stores s on s.id = sm.store_id
where s.status = 'published' and sm.is_active;

-- Sin secret_id ni connected_account_id. Mercado Pago solo si está conectado.
create view storefront.payment_methods with (security_barrier = true) as
select pm.id, pm.store_id, pm.provider, pm.method_key, pm.display_name, pm.instructions, pm.position
from public.store_payment_methods pm
join public.stores s on s.id = pm.store_id
where s.status = 'published' and pm.is_enabled
  and (pm.provider = 'manual' or pm.connected_at is not null);

grant usage on schema storefront to anon, authenticated, service_role;
grant select on all tables in schema storefront to anon, authenticated, service_role;
