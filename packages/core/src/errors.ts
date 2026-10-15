export const BUSINESS_ERROR_CODES = [
  'SIN_SESION',
  'SIN_PERMISO',
  'DIRECCION_EN_USO',
  'LIMITE_DE_TIENDAS',
  'FALTA_PUBLICAR_INICIO',
  'TIENDA_SUSPENDIDA',
  'ULTIMO_DUENO',
  'INVITACION_INVALIDA',
  'INVITACION_OTRO_EMAIL',
  'PAGINA_NO_EXISTE',
  'VERSION_NO_EXISTE',
  'STOCK_INSUFICIENTE',
  'STOCK_MENOR_A_RESERVADO',
  'MOTIVO_INVALIDO',
  'CANTIDAD_INVALIDA',
  'CAMBIO_DE_ESTADO_INVALIDO',
  'PAGO_NO_EXISTE',
  'PAGO_YA_RESUELTO',
  'SOLO_PAGOS_MANUALES',
  'PEDIDO_NO_ENCONTRADO',
] as const;

export type BusinessErrorCode = (typeof BUSINESS_ERROR_CODES)[number];

export function parseDbError(error: unknown): BusinessErrorCode | 'UNKNOWN' {
  if (typeof error !== 'object' || error === null) return 'UNKNOWN';
  const candidate = error as Record<string, unknown>;
  for (const field of ['message', 'details', 'hint', 'code']) {
    const value = candidate[field];
    if (typeof value !== 'string') continue;
    for (const code of BUSINESS_ERROR_CODES) {
      if (new RegExp(`(?:^|[^A-Z_])${code}(?:$|[^A-Z_])`).test(value)) return code;
    }
  }
  return 'UNKNOWN';
}
