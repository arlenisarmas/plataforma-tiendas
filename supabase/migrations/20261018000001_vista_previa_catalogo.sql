-- T-039: catálogo de vista previa para tiendas que todavía no se abrieron.
-- Las vistas `storefront.*` solo muestran tiendas publicadas. La vista previa del armado guiado
-- necesita ver lo mismo para una tienda en borrador, pero solo para quien la administra.
-- Devuelve las mismas columnas que la vista pública equivalente, sin el filtro de "publicada".

create or replace function public.preview_storefront_rows(p_store_id uuid, p_view text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_rows jsonb;
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'SIN_PERMISO' using errcode = '42501';
  end if;

  case p_view
    when 'stores' then
      select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into v_rows from (
        select s.id, s.slug, s.name, s.country_code, s.currency, s.default_locale, s.timezone,
               s.theme_draft as theme, s.contact, s.logo_asset_id, s.published_at
        from public.stores s where s.id = p_store_id) x;
    when 'categories' then
      select coalesce(jsonb_agg(to_jsonb(x) order by x.position), '[]'::jsonb) into v_rows from (
        select c.id, c.store_id, c.parent_id, c.name, c.slug, c.description, c.image_asset_id, c.position
        from public.categories c where c.store_id = p_store_id and c.is_visible) x;
    when 'products' then
      select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb) into v_rows from (
        select p.id, p.store_id, p.category_id, p.name, p.slug, p.description, p.is_featured, p.seo, p.created_at
        from public.products p where p.store_id = p_store_id and p.status = 'active') x;
    when 'product_images' then
      select coalesce(jsonb_agg(to_jsonb(x) order by x.position), '[]'::jsonb) into v_rows from (
        select pi.product_id, pi.store_id, pi.position, m.id as asset_id, m.path, m.width, m.height, m.alt_text
        from public.product_images pi
        join public.products p on p.id = pi.product_id and p.status = 'active'
        join public.media_assets m on m.id = pi.asset_id and m.bucket = 'store-media'
        where pi.store_id = p_store_id) x;
    when 'variants' then
      select coalesce(jsonb_agg(to_jsonb(x) order by x.position), '[]'::jsonb) into v_rows from (
        select v.id, v.store_id, v.product_id, v.sku, v.title, v.options,
               v.price_amount, v.compare_at_amount, v.position, v.is_default,
               case when v.track_inventory and not v.allow_backorder
                    then greatest(i.on_hand - i.reserved, 0) end as available_quantity,
               (not v.track_inventory or v.allow_backorder or i.on_hand - i.reserved > 0) as is_available
        from public.product_variants v
        join public.products p on p.id = v.product_id and p.status = 'active'
        left join public.inventory i on i.variant_id = v.id
        where v.store_id = p_store_id) x;
    else
      raise exception 'VISTA_INVALIDA';
  end case;

  return v_rows;
end;
$$;

revoke all on function public.preview_storefront_rows(uuid, text) from public, anon;
grant execute on function public.preview_storefront_rows(uuid, text) to authenticated;
