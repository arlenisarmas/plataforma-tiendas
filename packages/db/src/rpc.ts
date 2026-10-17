import type { SupabaseClient } from '@supabase/supabase-js';
import type { BusinessErrorCode } from '@plataforma/core';
import type { Database } from './database.types';

type Functions = Database['public']['Functions'];
export type BusinessRpc =
  | 'create_store' | 'publish_store' | 'accept_store_invitation' | 'publish_page'
  | 'restore_page_version' | 'adjust_stock' | 'reserve_stock' | 'commit_reservation'
  | 'release_reservation' | 'release_expired_reservations' | 'next_order_number'
  | 'apply_payment_status' | 'confirm_manual_payment' | 'get_order_for_buyer';
export type RpcArgs<Name extends BusinessRpc> = Functions[Name]['Args'];
export type RpcReturn<Name extends BusinessRpc> = Functions[Name]['Returns'];
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

const businessCodes = [
  'SIN_SESION', 'SIN_PERMISO', 'DIRECCION_EN_USO', 'LIMITE_DE_TIENDAS',
  'FALTA_PUBLICAR_INICIO', 'TIENDA_SUSPENDIDA', 'ULTIMO_DUENO', 'INVITACION_INVALIDA',
  'INVITACION_OTRO_EMAIL', 'PAGINA_NO_EXISTE', 'VERSION_NO_EXISTE',
  'STOCK_INSUFICIENTE', 'STOCK_MENOR_A_RESERVADO', 'MOTIVO_INVALIDO',
  'CANTIDAD_INVALIDA', 'CAMBIO_DE_ESTADO_INVALIDO', 'PAGO_NO_EXISTE',
  'PAGO_YA_RESUELTO', 'SOLO_PAGOS_MANUALES', 'PEDIDO_NO_ENCONTRADO',
] as const satisfies readonly BusinessErrorCode[];

/** Breaks the typecheck if core adds a business code that this copy does not list. */
type AssertNever<T extends never> = T;
export type AllBusinessCodesListed = AssertNever<Exclude<BusinessErrorCode, (typeof businessCodes)[number]>>;

/** Mirrors core.parseDbError without a runtime dependency from db to core. */
function parseDbError(error: { message: string; details?: string; hint?: string; code?: string }): BusinessErrorCode | 'UNKNOWN' {
  for (const field of [error.message, error.details, error.hint, error.code]) {
    if (!field) continue;
    for (const code of businessCodes) {
      if (new RegExp(`(?:^|[^A-Z_])${code}(?:$|[^A-Z_])`).test(field)) return code;
    }
  }
  return 'UNKNOWN';
}

export async function callRpc<Name extends BusinessRpc>(
  client: SupabaseClient<Database>, name: Name, args: RpcArgs<Name>,
): Promise<Result<RpcReturn<Name>, BusinessErrorCode>> {
  const { data, error } = await client.rpc(name, args);
  if (error) {
    const code = parseDbError(error);
    if (code === 'UNKNOWN') throw error;
    return { ok: false, error: code };
  }
  return { ok: true, value: data as RpcReturn<Name> };
}
