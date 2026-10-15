-- =============================================================================
-- 20261015000001_esquema_base.sql
-- Esquema base de la Etapa 1: tiendas, miembros, dominios, medios, páginas,
-- catálogo, stock, clientes, envíos, medios de pago, pedidos y pagos.
--
-- CONTRATO FIJO: no editar. Los cambios van en migraciones nuevas (ver AGENTS.md §4).
-- Convenciones:
--   * PK uuid (gen_random_uuid), salvo tablas de log (bigint identity).
--   * Toda tabla de negocio tiene store_id NOT NULL.
--   * Dinero: bigint en unidad mínima de la moneda de la tienda.
--   * created_at / updated_at en timestamptz; updated_at por trigger.
--   * Referencias dentro de una tienda usan FK compuestas (store_id, id): la base
--     de datos impide que un registro apunte a datos de otra tienda.
-- =============================================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

-- -----------------------------------------------------------------------------
-- Tipos enumerados
-- -----------------------------------------------------------------------------
create type public.store_status      as enum ('draft', 'published', 'suspended');
create type public.member_role       as enum ('owner', 'staff');
create type public.domain_kind       as enum ('subdomain', 'custom');
create type public.asset_kind        as enum ('image', 'video', 'document');
create type public.asset_source      as enum ('upload', 'ai');
create type public.page_kind         as enum ('home', 'custom', 'about', 'contact', 'faq', 'legal');
create type public.product_status    as enum ('draft', 'active', 'archived');
create type public.shipping_kind     as enum ('pickup', 'flat_rate', 'local_delivery');
create type public.payment_provider  as enum ('mercadopago', 'manual', 'stripe', 'paypal');
create type public.order_status      as enum ('pending_payment', 'paid', 'preparing', 'ready_for_pickup',
                                              'shipped', 'delivered', 'cancelled', 'refunded');
create type public.payment_status    as enum ('pending', 'in_review', 'approved', 'rejected',
                                              'cancelled', 'refunded');
create type public.stock_reason      as enum ('sale', 'restock', 'adjustment', 'return', 'initial');
create type public.reservation_status as enum ('active', 'committed', 'released');

-- -----------------------------------------------------------------------------
-- Utilidades
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Perfiles y administradores de plataforma
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 120),
  locale      text not null default 'es-419',
  ui_mode     text not null default 'simple' check (ui_mode in ('simple', 'advanced')),
  guided      boolean not null default true,      -- quiere ayuda paso a paso
  text_scale  smallint not null default 100 check (text_scale between 100 and 150),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.platform_admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Tiendas
-- -----------------------------------------------------------------------------
create table public.stores (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique
                  check (slug ~ '^[a-z0-9](-?[a-z0-9])*$' and char_length(slug) between 3 and 40),
  name            text not null check (char_length(name) between 1 and 80),
  status          public.store_status not null default 'draft',
  country_code    char(2) not null check (country_code ~ '^[A-Z]{2}$'),
  currency        char(3) not null check (currency ~ '^[A-Z]{3}$'),
  default_locale  text not null default 'es-419',
  timezone        text not null default 'America/Argentina/Buenos_Aires',
  logo_asset_id   uuid,                              -- FK agregada luego de media_assets
  theme_draft     jsonb not null default '{}'::jsonb,
  theme_published jsonb not null default '{}'::jsonb,
  contact         jsonb not null default '{}'::jsonb, -- email, teléfono, whatsapp, dirección, redes
  onboarding      jsonb not null default '{}'::jsonb, -- progreso de "Tu tienda al 100%"
  published_at    timestamptz,
  created_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.store_members (
  store_id    uuid not null references public.stores (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.member_role not null default 'staff',
  created_at  timestamptz not null default now(),
  primary key (store_id, user_id)
);
create index store_members_user_idx on public.store_members (user_id);

create table public.store_invitations (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores (id) on delete cascade,
  email        citext not null,
  role         public.member_role not null default 'staff',
  token_hash   text not null unique,               -- sha256 hex del token enviado por mail
  invited_by   uuid references auth.users (id) on delete set null,
  expires_at   timestamptz not null default now() + interval '7 days',
  accepted_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index store_invitations_store_idx on public.store_invitations (store_id);

create table public.store_counters (
  store_id           uuid primary key references public.stores (id) on delete cascade,
  last_order_number  integer not null default 1000
);

create table public.store_domains (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores (id) on delete cascade,
  hostname     text not null unique
               check (hostname = lower(hostname)
                      and hostname ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$'),
  kind         public.domain_kind not null,
  is_primary   boolean not null default false,
  verified_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index store_domains_store_idx on public.store_domains (store_id);
create unique index store_domains_one_primary on public.store_domains (store_id) where is_primary;

-- -----------------------------------------------------------------------------
-- Biblioteca de medios
-- -----------------------------------------------------------------------------
create table public.media_assets (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores (id) on delete cascade,
  bucket       text not null check (bucket in ('store-media', 'payment-receipts')),
  path         text not null,
  kind         public.asset_kind not null,
  mime_type    text not null,
  size_bytes   bigint not null check (size_bytes > 0),
  width        integer check (width > 0),
  height       integer check (height > 0),
  alt_text     text check (char_length(alt_text) <= 300),
  source       public.asset_source not null default 'upload',
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (bucket, path),
  unique (store_id, id),
  -- Toda ruta empieza con el id de la tienda: aísla archivos por tienda.
  check (path like store_id::text || '/%')
);
create index media_assets_store_idx on public.media_assets (store_id, created_at desc);

alter table public.stores
  add constraint stores_logo_asset_fk
  foreign key (id, logo_asset_id) references public.media_assets (store_id, id)
  on delete set null (logo_asset_id);

-- -----------------------------------------------------------------------------
-- Páginas (motor de bloques, ver docs/03-sistema-de-bloques.md)
--   draft_blocks: borrador editable (autoguardado).
--   page_versions: versiones publicadas, inmutables (historial y restauración).
-- -----------------------------------------------------------------------------
create table public.pages (
  id                    uuid primary key default gen_random_uuid(),
  store_id              uuid not null references public.stores (id) on delete cascade,
  kind                  public.page_kind not null default 'custom',
  slug                  text not null check (slug ~ '^[a-z0-9](-?[a-z0-9])*$' or slug = ''),
  title                 text not null check (char_length(title) between 1 and 120),
  show_in_nav           boolean not null default true,
  nav_position          integer not null default 0,
  seo                   jsonb not null default '{}'::jsonb,
  draft_blocks          jsonb not null default '[]'::jsonb check (jsonb_typeof(draft_blocks) = 'array'),
  draft_updated_at      timestamptz not null default now(),
  published_version_id  uuid,                       -- FK agregada luego de page_versions
  published_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (store_id, slug),
  unique (store_id, id)
);
create unique index pages_one_home on public.pages (store_id) where kind = 'home';

create table public.page_versions (
  id          uuid primary key default gen_random_uuid(),
  page_id     uuid not null,
  store_id    uuid not null references public.stores (id) on delete cascade,
  version     integer not null check (version > 0),
  blocks      jsonb not null check (jsonb_typeof(blocks) = 'array'),
  note        text check (char_length(note) <= 200),
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (page_id, version),
  unique (page_id, id),
  foreign key (store_id, page_id) references public.pages (store_id, id) on delete cascade
);
create index page_versions_store_idx on public.page_versions (store_id);

alter table public.pages
  add constraint pages_published_version_fk
  foreign key (id, published_version_id) references public.page_versions (page_id, id)
  on delete set null (published_version_id);

-- -----------------------------------------------------------------------------
-- Catálogo
-- -----------------------------------------------------------------------------
create table public.categories (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references public.stores (id) on delete cascade,
  parent_id       uuid,
  name            text not null check (char_length(name) between 1 and 80),
  slug            text not null check (slug ~ '^[a-z0-9](-?[a-z0-9])*$'),
  description     text check (char_length(description) <= 2000),
  image_asset_id  uuid,
  position        integer not null default 0,
  is_visible      boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (store_id, slug),
  unique (store_id, id),
  check (parent_id is null or parent_id <> id),
  foreign key (store_id, parent_id) references public.categories (store_id, id)
    on delete set null (parent_id),
  foreign key (store_id, image_asset_id) references public.media_assets (store_id, id)
    on delete set null (image_asset_id)
);
create index categories_parent_idx on public.categories (parent_id);

create table public.products (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores (id) on delete cascade,
  category_id  uuid,
  name         text not null check (char_length(name) between 1 and 140),
  slug         text not null check (slug ~ '^[a-z0-9](-?[a-z0-9])*$'),
  description  text check (char_length(description) <= 10000),  -- texto plano / markdown limitado
  status       public.product_status not null default 'draft',
  is_featured  boolean not null default false,
  seo          jsonb not null default '{}'::jsonb,
  search       tsvector generated always as (
                 to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))
               ) stored,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (store_id, slug),
  unique (store_id, id),
  foreign key (store_id, category_id) references public.categories (store_id, id)
    on delete set null (category_id)
);
create index products_store_status_idx on public.products (store_id, status);
create index products_category_idx on public.products (category_id);
create index products_search_idx on public.products using gin (search);

create table public.product_images (
  product_id  uuid not null,
  asset_id    uuid not null,
  store_id    uuid not null references public.stores (id) on delete cascade,
  position    integer not null default 0,
  primary key (product_id, asset_id),
  foreign key (store_id, product_id) references public.products (store_id, id) on delete cascade,
  foreign key (store_id, asset_id) references public.media_assets (store_id, id) on delete cascade
);
create index product_images_asset_idx on public.product_images (asset_id);

create table public.product_variants (
  id                 uuid primary key default gen_random_uuid(),
  store_id           uuid not null references public.stores (id) on delete cascade,
  product_id         uuid not null,
  sku                text check (char_length(sku) <= 64),
  title              text not null default 'Único' check (char_length(title) between 1 and 140),
  options            jsonb not null default '{}'::jsonb check (jsonb_typeof(options) = 'object'),
  price_amount       bigint not null check (price_amount >= 0),
  compare_at_amount  bigint check (compare_at_amount is null or compare_at_amount > price_amount),
  cost_amount        bigint check (cost_amount is null or cost_amount >= 0),   -- privado
  track_inventory    boolean not null default true,
  allow_backorder    boolean not null default false,
  weight_grams       integer check (weight_grams is null or weight_grams >= 0),
  position           integer not null default 0,
  is_default         boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (store_id, id),
  foreign key (store_id, product_id) references public.products (store_id, id) on delete cascade
);
create index product_variants_product_idx on public.product_variants (product_id);
create index product_variants_store_idx on public.product_variants (store_id);
create unique index product_variants_sku_unique on public.product_variants (store_id, sku) where sku is not null;
create unique index product_variants_one_default on public.product_variants (product_id) where is_default;

-- -----------------------------------------------------------------------------
-- Stock: saldo + libro mayor + reservas. Solo se modifica con funciones
-- (ver 20261015000002_funciones.sql).
-- -----------------------------------------------------------------------------
create table public.inventory (
  variant_id           uuid primary key,
  store_id             uuid not null references public.stores (id) on delete cascade,
  on_hand              integer not null default 0 check (on_hand >= 0),
  reserved             integer not null default 0 check (reserved >= 0),
  low_stock_threshold  integer not null default 3 check (low_stock_threshold >= 0),
  updated_at           timestamptz not null default now(),
  foreign key (store_id, variant_id) references public.product_variants (store_id, id) on delete cascade
);
create index inventory_store_idx on public.inventory (store_id);

create table public.inventory_movements (
  id          bigint generated always as identity primary key,
  store_id    uuid not null references public.stores (id) on delete cascade,
  variant_id  uuid not null,
  delta       integer not null check (delta <> 0),
  reason      public.stock_reason not null,
  order_id    uuid,                                  -- FK agregada luego de orders
  note        text check (char_length(note) <= 300),
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  foreign key (store_id, variant_id) references public.product_variants (store_id, id) on delete cascade
);
create index inventory_movements_variant_idx on public.inventory_movements (variant_id, created_at desc);
create index inventory_movements_store_idx on public.inventory_movements (store_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Clientes
-- -----------------------------------------------------------------------------
create table public.customers (
  id                 uuid primary key default gen_random_uuid(),
  store_id           uuid not null references public.stores (id) on delete cascade,
  user_id            uuid references auth.users (id) on delete set null,
  email              citext not null,
  full_name          text check (char_length(full_name) <= 120),
  phone              text check (char_length(phone) <= 40),
  accepts_marketing  boolean not null default false,
  notes              text check (char_length(notes) <= 2000),     -- privado de la tienda
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (store_id, email),
  unique (store_id, id)
);
create index customers_user_idx on public.customers (user_id);

create table public.customer_addresses (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references public.stores (id) on delete cascade,
  customer_id     uuid not null,
  label           text check (char_length(label) <= 40),
  recipient_name  text not null check (char_length(recipient_name) <= 120),
  line1           text not null check (char_length(line1) <= 200),
  line2           text check (char_length(line2) <= 200),
  city            text not null check (char_length(city) <= 100),
  region          text check (char_length(region) <= 100),
  postal_code     text check (char_length(postal_code) <= 20),
  country_code    char(2) not null check (country_code ~ '^[A-Z]{2}$'),
  phone           text check (char_length(phone) <= 40),
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  foreign key (store_id, customer_id) references public.customers (store_id, id) on delete cascade
);
create index customer_addresses_customer_idx on public.customer_addresses (customer_id);

-- -----------------------------------------------------------------------------
-- Envíos
-- -----------------------------------------------------------------------------
create table public.shipping_methods (
  id                uuid primary key default gen_random_uuid(),
  store_id          uuid not null references public.stores (id) on delete cascade,
  name              text not null check (char_length(name) between 1 and 80),
  kind              public.shipping_kind not null,
  description       text check (char_length(description) <= 300),
  price_amount      bigint not null default 0 check (price_amount >= 0),
  free_over_amount  bigint check (free_over_amount is null or free_over_amount > 0),
  is_active         boolean not null default true,
  position          integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (store_id, id)
);
create index shipping_methods_store_idx on public.shipping_methods (store_id);

-- -----------------------------------------------------------------------------
-- Medios de pago por tienda
--   method_key distingue varios métodos del mismo proveedor
--   (ej. manual: 'transferencia', 'pago-movil', 'zelle', 'efectivo').
--   secret_id referencia un secreto en Supabase Vault (nunca el token en texto).
-- -----------------------------------------------------------------------------
create table public.store_payment_methods (
  id                    uuid primary key default gen_random_uuid(),
  store_id              uuid not null references public.stores (id) on delete cascade,
  provider              public.payment_provider not null,
  method_key            text not null default 'default' check (method_key ~ '^[a-z0-9](-?[a-z0-9])*$'),
  display_name          text not null check (char_length(display_name) between 1 and 80),
  is_enabled            boolean not null default false,
  instructions          jsonb not null default '{}'::jsonb,  -- público (datos para pago manual)
  secret_id             uuid,                                -- privado: id en vault.secrets
  connected_account_id  text,                                -- privado: id de cuenta del proveedor
  connected_at          timestamptz,
  position              integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (store_id, provider, method_key),
  unique (store_id, id)
);

-- -----------------------------------------------------------------------------
-- Pedidos
-- -----------------------------------------------------------------------------
create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  store_id            uuid not null references public.stores (id) on delete restrict,
  number              integer not null,
  customer_id         uuid,
  email               citext not null,
  status              public.order_status not null default 'pending_payment',
  currency            char(3) not null check (currency ~ '^[A-Z]{3}$'),
  subtotal_amount     bigint not null check (subtotal_amount >= 0),
  shipping_amount     bigint not null default 0 check (shipping_amount >= 0),
  discount_amount     bigint not null default 0 check (discount_amount >= 0),
  total_amount        bigint not null check (total_amount >= 0),
  shipping_method_id  uuid,
  shipping_snapshot   jsonb not null default '{}'::jsonb,   -- nombre/precio del envío al comprar
  shipping_address    jsonb,                                -- copia de la dirección al comprar
  buyer_note          text check (char_length(buyer_note) <= 1000),
  internal_note       text check (char_length(internal_note) <= 2000),
  locale              text not null default 'es-419',
  access_token_hash   text not null,          -- para que el comprador vea su pedido sin cuenta
  placed_at           timestamptz not null default now(),
  paid_at             timestamptz,
  cancelled_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (store_id, number),
  unique (store_id, id),
  check (total_amount = subtotal_amount + shipping_amount - discount_amount),
  foreign key (store_id, customer_id) references public.customers (store_id, id)
    on delete set null (customer_id),
  foreign key (store_id, shipping_method_id) references public.shipping_methods (store_id, id)
    on delete set null (shipping_method_id)
);
create index orders_store_status_idx on public.orders (store_id, status, placed_at desc);
create index orders_customer_idx on public.orders (customer_id);

create table public.order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null,
  store_id           uuid not null references public.stores (id) on delete cascade,
  product_id         uuid,
  variant_id         uuid,
  product_name       text not null,
  variant_title      text not null,
  sku                text,
  unit_price_amount  bigint not null check (unit_price_amount >= 0),
  quantity           integer not null check (quantity > 0),
  line_total_amount  bigint not null,
  check (line_total_amount = unit_price_amount * quantity),
  foreign key (store_id, order_id) references public.orders (store_id, id) on delete cascade,
  foreign key (store_id, product_id) references public.products (store_id, id)
    on delete set null (product_id),
  foreign key (store_id, variant_id) references public.product_variants (store_id, id)
    on delete set null (variant_id)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_variant_idx on public.order_items (variant_id);

alter table public.inventory_movements
  add constraint inventory_movements_order_fk
  foreign key (store_id, order_id) references public.orders (store_id, id)
  on delete set null (order_id);

create table public.stock_reservations (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores (id) on delete cascade,
  order_id    uuid not null,
  variant_id  uuid not null,
  quantity    integer not null check (quantity > 0),
  status      public.reservation_status not null default 'active',
  expires_at  timestamptz not null default now() + interval '30 minutes',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  foreign key (store_id, order_id) references public.orders (store_id, id) on delete cascade,
  foreign key (store_id, variant_id) references public.product_variants (store_id, id) on delete cascade
);
create index stock_reservations_order_idx on public.stock_reservations (order_id);
create index stock_reservations_active_idx on public.stock_reservations (expires_at) where status = 'active';

-- -----------------------------------------------------------------------------
-- Pagos
-- -----------------------------------------------------------------------------
create table public.payments (
  id                   uuid primary key default gen_random_uuid(),
  store_id             uuid not null references public.stores (id) on delete restrict,
  order_id             uuid not null,
  payment_method_id    uuid,
  provider             public.payment_provider not null,
  status               public.payment_status not null default 'pending',
  amount               bigint not null check (amount >= 0),
  currency             char(3) not null check (currency ~ '^[A-Z]{3}$'),
  provider_payment_id  text,
  receipt_asset_id     uuid,                                                          -- pago manual
  reviewed_by          uuid references auth.users (id) on delete set null,
  reviewed_at          timestamptz,
  raw                  jsonb not null default '{}'::jsonb,   -- respuesta saneada del proveedor
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  foreign key (store_id, order_id) references public.orders (store_id, id) on delete cascade,
  foreign key (store_id, payment_method_id) references public.store_payment_methods (store_id, id)
    on delete set null (payment_method_id),
  foreign key (store_id, receipt_asset_id) references public.media_assets (store_id, id)
    on delete set null (receipt_asset_id)
);
create index payments_order_idx on public.payments (order_id);
create index payments_store_status_idx on public.payments (store_id, status);
create unique index payments_provider_unique on public.payments (provider, provider_payment_id)
  where provider_payment_id is not null;

-- Webhooks recibidos (idempotencia). Solo accesible por el servidor.
create table public.payment_events (
  id                 bigint generated always as identity primary key,
  provider           public.payment_provider not null,
  provider_event_id  text not null,
  store_id           uuid references public.stores (id) on delete set null,
  payload            jsonb not null,
  received_at        timestamptz not null default now(),
  processed_at       timestamptz,
  error              text,
  unique (provider, provider_event_id)
);

-- -----------------------------------------------------------------------------
-- Auditoría y notificaciones
-- -----------------------------------------------------------------------------
create table public.audit_log (
  id          bigint generated always as identity primary key,
  store_id    uuid references public.stores (id) on delete cascade,
  actor_id    uuid references auth.users (id) on delete set null,
  action      text not null,                  -- ej. 'order.status_changed'
  entity      text not null,                  -- ej. 'orders'
  entity_id   uuid,
  changes     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_store_idx on public.audit_log (store_id, created_at desc);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  store_id    uuid references public.stores (id) on delete cascade,
  kind        text not null,                  -- ej. 'order.new', 'stock.low'
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Triggers updated_at
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'stores', 'pages', 'categories', 'products', 'product_variants',
    'inventory', 'customers', 'customer_addresses', 'shipping_methods',
    'store_payment_methods', 'orders', 'stock_reservations', 'payments'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I
         for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t);
  end loop;
end;
$$;
