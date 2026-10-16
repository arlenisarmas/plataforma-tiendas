-- T-022: Vault is accessed only through server-side service_role RPCs.
create function public.set_payment_secret(p_method_id uuid, p_secret text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_method public.store_payment_methods;
begin
  if p_secret is null or length(p_secret) = 0 then raise exception 'SECRET_REQUIRED'; end if;
  select * into v_method from public.store_payment_methods where id = p_method_id for update;
  if not found or v_method.provider <> 'mercadopago' then raise exception 'PAYMENT_METHOD_NOT_FOUND'; end if;
  if v_method.secret_id is null then
    update public.store_payment_methods
       set secret_id = vault.create_secret(p_secret, 'pm_' || p_method_id::text)
     where id = p_method_id;
  else
    perform vault.update_secret(v_method.secret_id, p_secret);
  end if;
end;
$$;

create function public.get_payment_secret(p_method_id uuid)
returns text language sql security definer set search_path = '' as $$
  select v.decrypted_secret
    from public.store_payment_methods m
    join vault.decrypted_secrets v on v.id = m.secret_id
   where m.id = p_method_id and m.provider = 'mercadopago';
$$;

create function public.clear_payment_secret(p_method_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_secret_id uuid;
begin
  select secret_id into v_secret_id from public.store_payment_methods
   where id = p_method_id and provider = 'mercadopago' for update;
  if not found then raise exception 'PAYMENT_METHOD_NOT_FOUND'; end if;
  update public.store_payment_methods
     set secret_id = null, connected_account_id = null, connected_at = null, is_enabled = false
   where id = p_method_id;
  if v_secret_id is not null then delete from vault.secrets where id = v_secret_id; end if;
end;
$$;

revoke all on function public.set_payment_secret(uuid, text) from public, anon, authenticated;
revoke all on function public.get_payment_secret(uuid) from public, anon, authenticated;
revoke all on function public.clear_payment_secret(uuid) from public, anon, authenticated;
grant execute on function public.set_payment_secret(uuid, text) to service_role;
grant execute on function public.get_payment_secret(uuid) to service_role;
grant execute on function public.clear_payment_secret(uuid) to service_role;
