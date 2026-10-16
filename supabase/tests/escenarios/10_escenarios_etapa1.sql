\set ON_ERROR_STOP 1
\set QUIET 1
-- Helpers de prueba -----------------------------------------------------------
create schema if not exists t;
grant usage on schema t to anon, authenticated, service_role;
create table t.ctx (k text primary key, v text);
grant all on t.ctx to anon, authenticated, service_role;
create function t.ok(p_name text) returns void language plpgsql as $$
begin raise notice 'PASA  %', p_name; end $$;
create function t.expect_error(p_name text, p_sql text, p_pattern text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'FALLA % (no dio error; esperado %)', p_name, p_pattern;
exception when others then
  if sqlerrm like 'FALLA %' then raise; end if;
  if sqlerrm !~* p_pattern then
    raise exception 'FALLA % (error inesperado: %)', p_name, sqlerrm;
  end if;
  raise notice 'PASA  % [%]', p_name, sqlerrm;
end $$;
create function t.eq(p_name text, p_got anyelement, p_want anyelement) returns void language plpgsql as $$
begin
  if p_got is distinct from p_want then
    raise exception 'FALLA % (obtenido %, esperado %)', p_name, p_got, p_want;
  end if;
  raise notice 'PASA  %', p_name;
end $$;
create function t.v(p_k text) returns uuid language sql as $$ select v::uuid from t.ctx where k = p_k $$;
grant execute on all functions in schema t to anon, authenticated, service_role;

create function t.as_user(p_user uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', coalesce(p_user::text, ''), false); end $$;

insert into t.ctx values ('INV_HASH', encode(public.extensions_digest('inv-123'), 'hex'));
-- Usuarios
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'arle@ejemplo.com', '{"full_name":"Arle"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'hermano@ejemplo.com', '{"full_name":"Hermano"}'),
  ('cccccccc-0000-0000-0000-000000000003', 'compradora@ejemplo.com', '{}');
select t.eq('perfil creado automáticamente', (select full_name from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'Arle');

-- 1. Crear tiendas --------------------------------------------------------------
set role authenticated;
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
insert into t.ctx values ('SA', public.create_store('Che Peludos', 'chepeludos', 'ar', 'ars'));
select t.expect_error('slug duplicado', $$select public.create_store('Otra', 'chepeludos', 'AR', 'ARS')$$, 'DIRECCION_EN_USO');
select t.as_user('bbbbbbbb-0000-0000-0000-000000000002');
insert into t.ctx values ('SB', public.create_store('Carpintería', 'carpinteria', 'CL', 'CLP'));
select t.eq('B ve solo su tienda', (select count(*) from public.stores), 1::bigint);
select t.eq('moneda normalizada', (select currency::text from public.stores), 'CLP');

-- 1b. Disponibilidad de dirección (sin revelar tiendas ajenas)
select t.eq('dirección libre', public.check_store_slug('mi-tienda-nueva'), 'disponible');
select t.eq('dirección usada por otra tienda', public.check_store_slug('chepeludos'), 'en_uso');
select t.eq('dirección reservada', public.check_store_slug('admin'), 'en_uso');
select t.eq('dirección inválida', public.check_store_slug('Con Espacios'), 'invalida');
select t.expect_error('no se crea tienda con dirección reservada',
  $$select public.create_store('Panel', 'panel', 'AR', 'ARS')$$, 'DIRECCION_EN_USO');

-- 2. Aislamiento entre tiendas -------------------------------------------------
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
insert into public.categories (store_id, name, slug) values (t.v('SA'), 'Perros', 'perros');
insert into t.ctx select 'CAT_A', id from public.categories where slug = 'perros';
insert into public.products (store_id, name, slug, status, category_id)
  values (t.v('SA'), 'Collar', 'collar', 'active', t.v('CAT_A'));
insert into t.ctx select 'P_A', id from public.products where slug = 'collar';
select t.expect_error('A no puede crear productos en tienda de B',
  format($$insert into public.products (store_id, name, slug) values (%L, 'Hack', 'hack')$$, t.v('SB')),
  'row-level security');
select t.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select t.eq('B no ve productos de A', (select count(*) from public.products), 0::bigint);
insert into public.categories (store_id, name, slug) values (t.v('SB'), 'Mesas', 'mesas');
select t.expect_error('FK compuesta: B no puede usar categoría de A',
  format($$insert into public.products (store_id, name, slug, category_id) values (%L, 'Mesa', 'mesa', %L)$$, t.v('SB'), t.v('CAT_A')),
  'foreign key');
select t.expect_error('B no puede modificar productos de A',
  format($q$do $x$ begin update public.products set name = 'X' where id = %L; if not found then raise exception 'sin filas'; end if; end $x$$q$, t.v('P_A')),
  'sin filas');

-- 3. Stock ------------------------------------------------------------------------
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
insert into public.product_variants (store_id, product_id, title, price_amount, cost_amount, is_default)
  values (t.v('SA'), t.v('P_A'), 'Único', 1500000, 800000, true);
insert into t.ctx select 'V_A', id from public.product_variants where product_id = t.v('P_A');
select t.eq('inventario creado automáticamente', (select on_hand from public.inventory where variant_id = t.v('V_A')), 0);
select t.expect_error('no se puede tocar inventory directo',
  format($$update public.inventory set on_hand = 999 where variant_id = %L$$, t.v('V_A')), 'permission denied');
select t.eq('reponer stock', public.adjust_stock(t.v('V_A'), 10, 'restock', 'Compra proveedor'), 10);
select t.expect_error('stock no puede quedar negativo', format($$select public.adjust_stock(%L, -50, 'adjustment')$$, t.v('V_A')), 'STOCK_MENOR_A_RESERVADO');
select t.expect_error('ventas solo por reserva', format($$select public.adjust_stock(%L, -1, 'sale')$$, t.v('V_A')), 'MOTIVO_INVALIDO');
select t.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select t.expect_error('B no puede ajustar stock de A', format($$select public.adjust_stock(%L, 5, 'restock')$$, t.v('V_A')), 'SIN_PERMISO');

-- 4. Páginas y publicación --------------------------------------------------------
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
update public.pages set draft_blocks = '[{"id":"b1","type":"hero","version":1,"props":{"title":"Hola"}}]'
  where store_id = t.v('SA') and kind = 'home';
insert into t.ctx select 'HOME_A', id from public.pages where store_id = t.v('SA') and kind = 'home';
select t.expect_error('no se puede publicar tienda sin inicio', format($$select public.publish_store(%L)$$, t.v('SA')), 'FALTA_PUBLICAR_INICIO');
select t.expect_error('no se puede setear published_version_id a mano',
  format($$update public.pages set published_version_id = gen_random_uuid() where id = %L$$, t.v('HOME_A')), 'permission denied');
select public.publish_page(t.v('HOME_A'), 'Primera versión');
select public.publish_store(t.v('SA'));
update public.pages set draft_blocks = '[]' where id = t.v('HOME_A');

-- 5. Storefront (visitante anónimo) ----------------------------------------------
reset role;
select t.as_user(null);
set role anon;
select t.eq('anon ve tienda publicada', (select count(*) from storefront.stores), 1::bigint);
select t.eq('anon ve la versión publicada, no el borrador',
  (select blocks->0->'props'->>'title' from storefront.pages where kind = 'home'), 'Hola');
select t.eq('anon ve stock disponible', (select available_quantity from storefront.variants), 10);
select t.expect_error('anon no accede a tablas internas', $$select * from public.products$$, 'permission denied');
select t.expect_error('anon no ve costos', $$select cost_amount from storefront.variants$$, 'does not exist');
select t.eq('tienda en borrador (B) invisible', (select count(*) from storefront.stores where slug = 'carpinteria'), 0::bigint);

-- 6. Checkout (servidor) ------------------------------------------------------------
reset role;
set role service_role;
insert into public.store_payment_methods (store_id, provider, method_key, display_name, is_enabled, instructions)
  values (t.v('SA'), 'manual', 'transferencia', 'Transferencia', true, '{"alias":"che.peludos"}');
insert into t.ctx select 'PM_A', id from public.store_payment_methods where store_id = t.v('SA');
insert into public.orders (id, store_id, number, email, currency, subtotal_amount, total_amount, access_token_hash)
  values ('11111111-0000-0000-0000-000000000001', t.v('SA'), public.next_order_number(t.v('SA')),
          'compradora@ejemplo.com', 'ARS', 4500000, 4500000, encode(public.extensions_digest('token-secreto'), 'hex'));
insert into public.order_items (order_id, store_id, product_id, variant_id, product_name, variant_title, unit_price_amount, quantity, line_total_amount)
  values ('11111111-0000-0000-0000-000000000001', t.v('SA'), t.v('P_A'), t.v('V_A'), 'Collar', 'Único', 1500000, 3, 4500000);
select public.reserve_stock('11111111-0000-0000-0000-000000000001', interval '48 hours');
select t.eq('número de pedido por tienda', (select number from public.orders where id = '11111111-0000-0000-0000-000000000001'), 1001);
select t.eq('reserva descuenta disponible', (select available_quantity from storefront.variants), 7);

insert into public.orders (id, store_id, number, email, currency, subtotal_amount, total_amount, access_token_hash)
  values ('22222222-0000-0000-0000-000000000002', t.v('SA'), public.next_order_number(t.v('SA')),
          'otra@ejemplo.com', 'ARS', 12000000, 12000000, 'x');
insert into public.order_items (order_id, store_id, product_id, variant_id, product_name, variant_title, unit_price_amount, quantity, line_total_amount)
  values ('22222222-0000-0000-0000-000000000002', t.v('SA'), t.v('P_A'), t.v('V_A'), 'Collar', 'Único', 1500000, 8, 12000000);
select t.expect_error('no se vende más de lo disponible', $$select public.reserve_stock('22222222-0000-0000-0000-000000000002')$$, 'STOCK_INSUFICIENTE');
select t.expect_error('totales inconsistentes rechazados',
  format($$insert into public.orders (store_id, number, email, currency, subtotal_amount, total_amount, access_token_hash) values (%L, 9999, 'x@x.com', 'ARS', 100, 50, 'x')$$, t.v('SA')),
  'check constraint');

insert into public.payments (id, store_id, order_id, payment_method_id, provider, status, amount, currency)
  values ('33333333-0000-0000-0000-000000000003', t.v('SA'), '11111111-0000-0000-0000-000000000001', t.v('PM_A'), 'manual', 'in_review', 4500000, 'ARS');

-- 7. Comprador sin cuenta consulta su pedido ---------------------------------------
reset role;
set role anon;
select t.eq('comprador ve su pedido con el token',
  (public.get_order_for_buyer('11111111-0000-0000-0000-000000000001', 'token-secreto')->>'number')::int, 1001);
select t.expect_error('token incorrecto rechazado',
  $$select public.get_order_for_buyer('11111111-0000-0000-0000-000000000001', 'adivinanza')$$, 'PEDIDO_NO_ENCONTRADO');

-- 8. Dueño confirma pago manual ------------------------------------------------------
reset role;
set role authenticated;
select t.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select t.expect_error('B no puede confirmar pagos de A', $$select public.confirm_manual_payment('33333333-0000-0000-0000-000000000003', true)$$, 'SIN_PERMISO');
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
select public.confirm_manual_payment('33333333-0000-0000-0000-000000000003', true);
select t.eq('pedido pagado', (select status::text from public.orders where id = '11111111-0000-0000-0000-000000000001'), 'paid');
select t.eq('stock físico descontado', (select on_hand from public.inventory where variant_id = t.v('V_A')), 7);
select t.eq('reserva consumida', (select reserved from public.inventory where variant_id = t.v('V_A')), 0);
select t.eq('movimiento de venta registrado', (select delta from public.inventory_movements where reason = 'sale'), -3);
select t.expect_error('pago no se confirma dos veces', $$select public.confirm_manual_payment('33333333-0000-0000-0000-000000000003', true)$$, 'PAGO_YA_RESUELTO');

-- 9. Estados de pedido ---------------------------------------------------------------
select t.expect_error('transición inválida', $$update public.orders set status = 'delivered' where id = '11111111-0000-0000-0000-000000000001'$$, 'CAMBIO_DE_ESTADO_INVALIDO');
update public.orders set status = 'preparing' where id = '11111111-0000-0000-0000-000000000001';
select t.expect_error('no se cambian totales desde el panel', $$update public.orders set total_amount = 1 where id = '11111111-0000-0000-0000-000000000001'$$, 'permission denied');
select t.eq('auditoría registra cambios', (select count(*) from public.audit_log where action = 'order.status_changed') >= 2, true);

-- 10. Reserva vencida ----------------------------------------------------------------
reset role;
set role service_role;
insert into public.orders (id, store_id, number, email, currency, subtotal_amount, total_amount, access_token_hash)
  values ('44444444-0000-0000-0000-000000000004', t.v('SA'), public.next_order_number(t.v('SA')), 'z@z.com', 'ARS', 3000000, 3000000, 'x');
insert into public.order_items (order_id, store_id, product_id, variant_id, product_name, variant_title, unit_price_amount, quantity, line_total_amount)
  values ('44444444-0000-0000-0000-000000000004', t.v('SA'), t.v('P_A'), t.v('V_A'), 'Collar', 'Único', 1500000, 2, 3000000);
select public.reserve_stock('44444444-0000-0000-0000-000000000004', interval '-1 minute');
select t.eq('reserva activa antes de vencer', (select reserved from public.inventory where variant_id = t.v('V_A')), 2);
select t.eq('cron libera 1 pedido', public.release_expired_reservations(), 1);
select t.eq('stock reservado liberado', (select reserved from public.inventory where variant_id = t.v('V_A')), 0);
select t.eq('pedido vencido cancelado', (select status::text from public.orders where id = '44444444-0000-0000-0000-000000000004'), 'cancelled');

-- 11. Invitaciones y roles -----------------------------------------------------------
reset role;
set role authenticated;
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
insert into public.store_invitations (store_id, email, role, token_hash)
  values (t.v('SA'), 'hermano@ejemplo.com', 'staff', (select v from t.ctx where k = 'INV_HASH'));
select t.as_user('cccccccc-0000-0000-0000-000000000003');
select t.expect_error('invitación para otro email', $$select public.accept_store_invitation('inv-123')$$, 'INVITACION_OTRO_EMAIL');
select t.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select public.accept_store_invitation('inv-123');
select t.eq('B ahora ve productos de A como empleado', (select count(*) from public.products where store_id = t.v('SA')), 1::bigint);
select t.expect_error('empleado no edita la configuración de la tienda',
  format($q$do $x$ begin update public.stores set name = 'X' where id = %L; if not found then raise exception 'sin filas'; end if; end $x$$q$, t.v('SA')),
  'sin filas');
select t.expect_error('empleado no ve auditoría',
  format($q$do $x$ begin if (select count(*) from public.audit_log where store_id = %L) > 0 then raise exception 've auditoria'; end if; raise exception 'sin filas'; end $x$$q$, t.v('SA')), 'sin filas');
select t.expect_error('no se suman miembros sin invitación',
  format($$insert into public.store_members (store_id, user_id) values (%L, 'cccccccc-0000-0000-0000-000000000003')$$, t.v('SA')), 'permission denied');
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
select t.expect_error('no se puede quedar sin dueño',
  format($$delete from public.store_members where store_id = %L and user_id = 'aaaaaaaa-0000-0000-0000-000000000001'$$, t.v('SA')), 'ULTIMO_DUENO');

-- 12. Storage ------------------------------------------------------------------------
select t.expect_error('A no sube archivos en la carpeta de B',
  format($$insert into storage.objects (bucket_id, name) values ('store-media', %L)$$, t.v('SB') || '/logo.png'), 'row-level security');
insert into storage.objects (bucket_id, name) values ('store-media', t.v('SA') || '/productos/collar.webp');
select t.ok('A sube archivos en su carpeta');
select t.expect_error('nadie sube comprobantes directo',
  format($$insert into storage.objects (bucket_id, name) values ('payment-receipts', %L)$$, t.v('SA') || '/c.pdf'), 'row-level security');
select t.expect_error('ruta de medio debe empezar con la tienda',
  format($$insert into public.media_assets (store_id, bucket, path, kind, mime_type, size_bytes) values (%L, 'store-media', 'otra/x.png', 'image', 'image/png', 10)$$, t.v('SA')),
  'check constraint');

-- 13. Borrar tienda completa no choca con la protección de dueño ---------------------
reset role;
delete from public.stores where id = t.v('SB');
select t.ok('borrado en cascada de una tienda');

-- 14. Vault de pagos: RPC solo para service_role --------------------------------
set role service_role;
insert into public.store_payment_methods (store_id, provider, display_name)
  values (t.v('SA'), 'mercadopago', 'Mercado Pago');
insert into t.ctx select 'MP_A', id from public.store_payment_methods
  where store_id = t.v('SA') and provider = 'mercadopago';
select public.set_payment_secret(t.v('MP_A'), 'sample-value');
select t.eq('service_role lee secreto de Vault', public.get_payment_secret(t.v('MP_A')), 'sample-value');
select public.set_payment_secret(t.v('MP_A'), 'replaced-value');
select t.eq('service_role actualiza el mismo secreto', public.get_payment_secret(t.v('MP_A')), 'replaced-value');
select public.clear_payment_secret(t.v('MP_A'));
select t.eq('desconectar borra el secreto', public.get_payment_secret(t.v('MP_A')), null::text);
set role anon;
select t.expect_error('anon no lee Vault', format('select public.get_payment_secret(%L)', t.v('MP_A')), 'permission denied');
set role authenticated;
select t.expect_error('authenticated no escribe Vault',
  format('select public.set_payment_secret(%L, %L)', t.v('MP_A'), 'sample-value'), 'permission denied');

reset role;
\echo '==== TODAS LAS PRUEBAS PASARON ===='
