-- =============================================================================
-- seed.sql — Datos de ejemplo para desarrollo local (supabase db reset).
-- NO se usa en staging ni producción.
--
-- Usuarios (contraseña: demo1234):
--   arle@ejemplo.com     → dueña de "Che Peludos" (ARS, publicada)
--   hermano@ejemplo.com  → dueño de "Carpintería del Sur" (CLP, borrador)
--
-- Todo se crea con las funciones de negocio (create_store, adjust_stock,
-- publish_page, publish_store), nunca con inserts directos en inventory.
-- =============================================================================

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- Usuarios de Auth (con identidad de email para poder iniciar sesión)
-- -----------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000001', 'authenticated',
   'authenticated', 'arle@ejemplo.com', crypt('demo1234', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Arle (demo)"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-8000-000000000002', 'authenticated',
   'authenticated', 'hermano@ejemplo.com', crypt('demo1234', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Hermano (demo)"}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users u
where u.id in ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002');

-- -----------------------------------------------------------------------------
-- Tienda 1: Che Peludos (Arle) — publicada
-- -----------------------------------------------------------------------------
do $$
declare
  v_store uuid;
  v_cat_perros uuid;
  v_cat_gatos uuid;
  v_product uuid;
  v_variant uuid;
  r record;
begin
  perform set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);

  v_store := public.create_store('Che Peludos', 'chepeludos', 'AR', 'ARS', 'es-AR',
                                 'America/Argentina/Buenos_Aires');

  update public.stores
     set theme_draft = '{
           "palette": "calido",
           "colors": {"primary": "#7D3036", "accent": "#805014", "background": "#FFFDF8",
                      "surface": "#FFF4E8", "text": "#302621"},
           "fonts": "amigable", "radius": "redondo", "buttonStyle": "solido",
           "header": {"layout": "izquierda", "showSearch": true},
           "footer": {"showSocial": true, "showPaymentIcons": true}
         }'::jsonb,
         contact = '{"whatsapp": "+5491100000000", "email": "hola@ejemplo.com",
                     "instagram": "chepeludos.demo"}'::jsonb
   where id = v_store;

  insert into public.store_domains (store_id, hostname, kind, is_primary, verified_at)
  values (v_store, 'chepeludos.localhost', 'subdomain', true, now());

  insert into public.categories (store_id, name, slug, position)
  values (v_store, 'Perros', 'perros', 0) returning id into v_cat_perros;
  insert into public.categories (store_id, name, slug, position)
  values (v_store, 'Gatos', 'gatos', 1) returning id into v_cat_gatos;

  -- 4 productos: (nombre, slug, categoría, precio en centavos, stock, precio anterior)
  for r in
    select * from (values
      ('Collar reflectivo', 'collar-reflectivo', v_cat_perros, 1500000::bigint, 12, null::bigint),
      ('Cama acolchada mediana', 'cama-acolchada-mediana', v_cat_perros, 4590000::bigint, 4, 5200000::bigint),
      ('Rascador torre', 'rascador-torre', v_cat_gatos, 3800000::bigint, 2, null::bigint),
      ('Comedero doble acero', 'comedero-doble-acero', v_cat_gatos, 1250000::bigint, 0, null::bigint)
    ) as t(name, slug, category_id, price, stock, compare_at)
  loop
    insert into public.products (store_id, category_id, name, slug, description, status, is_featured)
    values (v_store, r.category_id, r.name, r.slug,
            'Producto de ejemplo para probar la tienda.', 'active', r.stock > 0)
    returning id into v_product;

    insert into public.product_variants (store_id, product_id, title, price_amount, compare_at_amount, is_default)
    values (v_store, v_product, 'Único', r.price, r.compare_at, true)
    returning id into v_variant;

    if r.stock > 0 then
      perform public.adjust_stock(v_variant, r.stock, 'initial', 'Stock inicial de ejemplo');
    end if;
  end loop;

  -- Producto con opciones (talles)
  insert into public.products (store_id, category_id, name, slug, description, status)
  values (v_store, v_cat_perros, 'Buzo polar para perro', 'buzo-polar-perro',
          'Abrigo suave para los días fríos.', 'active')
  returning id into v_product;
  for r in
    select * from (values ('S', 1800000::bigint, 5, 0), ('M', 1900000::bigint, 3, 1), ('L', 2000000::bigint, 0, 2))
      as t(talle, price, stock, pos)
  loop
    insert into public.product_variants (store_id, product_id, title, options, price_amount, position, is_default)
    values (v_store, v_product, 'Talle ' || r.talle, jsonb_build_object('Talle', r.talle), r.price, r.pos, r.pos = 0)
    returning id into v_variant;
    if r.stock > 0 then
      perform public.adjust_stock(v_variant, r.stock, 'initial', 'Stock inicial de ejemplo');
    end if;
  end loop;

  insert into public.shipping_methods (store_id, name, kind, description, price_amount, position)
  values (v_store, 'Retiro en el local', 'pickup', 'Palermo, CABA. Lunes a sábado de 10 a 19 h.', 0, 0);
  insert into public.shipping_methods (store_id, name, kind, description, price_amount, free_over_amount, position)
  values (v_store, 'Envío a domicilio CABA', 'flat_rate', 'Llega en 24 a 48 h.', 350000, 5000000, 1);

  insert into public.store_payment_methods (store_id, provider, method_key, display_name, is_enabled, instructions)
  values (v_store, 'manual', 'transferencia', 'Transferencia bancaria', true,
          '{"alias": "che.peludos.demo", "titular": "Che Peludos (demo)",
            "nota": "Enviá el comprobante desde la página de tu pedido."}'::jsonb);

  -- Página de inicio con bloques y publicación
  update public.pages
     set draft_blocks = '[
           {"id": "b_hero", "type": "hero", "version": 1, "variant": "split",
            "props": {"title": "Todo para tu mascota", "subtitle": "Envíos en el día en CABA",
                      "cta": {"label": "Ver productos", "link": {"kind": "collection", "categoryId": null}},
                      "align": "left"}},
           {"id": "b_texto", "type": "rich-text", "version": 1,
            "props": {"title": "¿Por qué elegirnos?",
                      "body": "- Productos **probados** por nuestras mascotas\n- Atención por WhatsApp\n- Cambios sin vueltas"}}
         ]'::jsonb
   where store_id = v_store and kind = 'home';

  perform public.publish_page((select id from public.pages where store_id = v_store and kind = 'home'),
                              'Versión inicial de ejemplo');
  perform public.publish_store(v_store);
end;
$$;

-- -----------------------------------------------------------------------------
-- Tienda 2: Carpintería del Sur (hermano) — borrador, en Chile (CLP)
-- -----------------------------------------------------------------------------
do $$
declare
  v_store uuid;
  v_cat uuid;
  v_product uuid;
  v_variant uuid;
begin
  perform set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);

  v_store := public.create_store('Carpintería del Sur', 'carpinteria-del-sur', 'CL', 'CLP', 'es-419',
                                 'America/Santiago');

  insert into public.categories (store_id, name, slug) values (v_store, 'Mesas', 'mesas')
  returning id into v_cat;

  insert into public.products (store_id, category_id, name, slug, description, status)
  values (v_store, v_cat, 'Mesa ratona de pino', 'mesa-ratona-pino', 'Hecha a mano, 90 x 50 cm.', 'active')
  returning id into v_product;

  -- CLP no tiene decimales: 89.990 pesos = 89990 en unidad mínima.
  insert into public.product_variants (store_id, product_id, title, price_amount, is_default)
  values (v_store, v_product, 'Único', 89990, true)
  returning id into v_variant;
  perform public.adjust_stock(v_variant, 3, 'initial', 'Stock inicial de ejemplo');

  insert into public.shipping_methods (store_id, name, kind, price_amount)
  values (v_store, 'Retiro en el taller', 'pickup', 0);
end;
$$;

select set_config('request.jwt.claim.sub', '', false);
