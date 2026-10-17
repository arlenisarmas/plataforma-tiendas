-- =============================================================================
-- 20261015000004_storage.sql
-- Buckets y políticas de Supabase Storage.
--   store-media       público (imágenes de tiendas servidas por CDN).
--                     Ruta obligatoria: <store_id>/<carpeta>/<archivo>
--   payment-receipts  privado (comprobantes de pago manual).
--                     Los sube el servidor mediante URL firmada.
-- =============================================================================

create or replace function public.try_uuid(p_value text)
returns uuid
language plpgsql immutable
as $$
begin
  return p_value::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;
grant execute on function public.try_uuid(text) to anon, authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('store-media', 'store-media', true, 10485760,               -- 10 MB
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'video/mp4']),
  ('payment-receipts', 'payment-receipts', false, 5242880,     -- 5 MB
   array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

-- store-media: los miembros gestionan los archivos de su tienda.
create policy store_media_member_select on storage.objects
  for select to authenticated
  using (bucket_id = 'store-media'
         and public.is_store_member(public.try_uuid((storage.foldername(name))[1])));

create policy store_media_member_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'store-media'
              and public.is_store_member(public.try_uuid((storage.foldername(name))[1])));

create policy store_media_member_update on storage.objects
  for update to authenticated
  using (bucket_id = 'store-media'
         and public.is_store_member(public.try_uuid((storage.foldername(name))[1])))
  with check (bucket_id = 'store-media'
              and public.is_store_member(public.try_uuid((storage.foldername(name))[1])));

create policy store_media_member_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'store-media'
         and public.is_store_member(public.try_uuid((storage.foldername(name))[1])));

-- payment-receipts: los miembros de la tienda pueden verlos. Nadie sube directo.
create policy payment_receipts_member_select on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-receipts'
         and public.is_store_member(public.try_uuid((storage.foldername(name))[1])));
