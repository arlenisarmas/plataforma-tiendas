# 01 · Arquitectura

> Documento de referencia. Los cambios a este documento los hace el arquitecto (Claude)
> o se aprueban explícitamente en una tarea `area:arquitectura`.

## 1. Objetivos de calidad (en orden de prioridad)

1. **Seguridad y aislamiento:** una tienda jamás puede ver ni modificar datos de otra.
   La garantía vive en la base de datos (RLS), no solo en el código.
2. **Simplicidad de uso:** cualquier persona, de cualquier edad, puede operar su tienda sin ayuda.
3. **Velocidad:** las páginas públicas cargan en menos de 1,5 s (LCP) en 4G.
4. **Reutilización:** un solo motor para todas las tiendas. Nada específico de una tienda en el código.
5. **Mantenibilidad:** código estándar, tipado, testeado y documentado; cualquier desarrollador lo entiende.
6. **Internacionalización desde el día uno:** país, moneda, idioma y medios de pago por tienda.

## 2. Vista general

```
                    ┌──────────────────────────────┐
  Compradores ────▶ │ apps/storefront (Next.js)    │──┐
  (cualquier        │ Resuelve la tienda por host  │  │
   dominio)         │ Páginas pre-generadas (ISR)  │  │
                    └──────────────────────────────┘  │
                                                      ▼
                    ┌──────────────────────────────┐  ┌───────────────────────────┐
  Dueños y ───────▶ │ apps/admin (Next.js)         │─▶│ Supabase                  │
  empleados         │ Panel + editor de páginas    │  │ Postgres + RLS · Auth     │
                    └──────────────────────────────┘  │ Storage · Edge Functions  │
                                                      │ Vault (secretos) · Cron   │
                                                      └───────────┬───────────────┘
                                                                  │
                         ┌────────────────┬───────────────────────┼──────────────┐
                         ▼                ▼                       ▼              ▼
                   Mercado Pago      Pago manual             Resend (mails)   (Etapa 3+)
                   (OAuth por        (comprobante +                           Gemini / Claude
                    tienda)           confirmación)
```

## 3. Estructura del repositorio (monorepo)

```
plataforma-tiendas/
├── apps/
│   ├── storefront/        Tiendas públicas. Multi-tenant por hostname.
│   └── admin/             Panel de administración y editor de páginas.
├── packages/
│   ├── core/              Lógica de dominio pura (precios, stock, pedidos). Sin I/O.
│   ├── db/                Cliente Supabase, tipos generados, consultas tipadas.
│   ├── ui/                Sistema de diseño: tokens + componentes (shadcn/ui).
│   ├── blocks/            Registro de bloques de página (ver 03-sistema-de-bloques).
│   ├── payments/          Conectores de pago (interfaz común + adaptadores).
│   ├── i18n/              Mensajes de interfaz, formatos de moneda y fecha.
│   ├── emails/            Plantillas React Email.
│   └── config/            tsconfig, eslint, tailwind preset compartidos.
├── supabase/
│   ├── migrations/        Esquema SQL. Contrato fijo (ver AGENTS.md §4).
│   ├── functions/         Edge Functions (webhooks, cron).
│   ├── tests/             Tests de RLS con pgTAP.
│   └── seed.sql           Datos de ejemplo para desarrollo.
├── docs/                  Documentación de arquitectura.
└── tareas/                Backlog y especificaciones de tareas.
```

### Reglas de dependencia entre paquetes

```
apps/*  ──▶ packages/{ui, blocks, payments, db, core, i18n, emails}
blocks  ──▶ ui, core, i18n
payments ─▶ core, db
db      ──▶ core (solo tipos)
core    ──▶ (nada)  ← lógica pura, 100% testeable
```

Prohibido: que `core` importe de cualquier otro paquete; que un paquete importe de `apps/*`;
dependencias circulares. Se valida en CI con `eslint-plugin-boundaries` (o equivalente).

## 4. Stack y justificación

| Capa | Elección | Por qué |
|---|---|---|
| Lenguaje | TypeScript `strict` | Un solo lenguaje, errores detectados antes de ejecutar |
| Framework | Next.js (App Router, Server Components) | SSR/ISR, rendimiento, ecosistema |
| Estilos | Tailwind CSS + shadcn/ui | Componentes accesibles, consistentes, propios del repo |
| Datos | Supabase (Postgres 15+) | SQL real, RLS nativo, Auth y Storage integrados |
| Validación | Zod | Esquemas compartidos entre cliente, servidor y bloques |
| Formularios | react-hook-form + zod resolver | Validación amable y tipada |
| i18n | next-intl | Rutas y mensajes por idioma |
| Tests | Vitest (unit), Playwright (e2e), pgTAP (RLS) | Cobertura en las tres capas críticas |
| Mails | Resend + React Email | Plantillas en React, entregabilidad |
| Monorepo | Turborepo + pnpm | Builds incrementales y caché |
| Hosting | Vercel | CDN global, ISR, previews por PR |

## 5. Multi-tenancy

**Modelo:** base de datos compartida, aislamiento por fila. Toda tabla de negocio tiene
`store_id` y una política RLS que lo exige. Equivalente a `OrgId` en Salesforce.

**Resolución de tienda en el storefront:**

1. `middleware.ts` lee el `Host` del request.
2. Busca el hostname en `store_domains` (con caché por etiqueta `domain:<hostname>`).
3. Reescribe la ruta a `/_sites/[storeId]/...` internamente.
4. Si el dominio no existe o la tienda no está publicada → página 404 amable.

Subdominios gratuitos: `<slug>.<dominio-plataforma>`. Dominios propios: registrados en
`store_domains` y agregados al proyecto de Vercel vía API (tarea específica, Etapa 1).

## 6. Estrategia de renderizado y caché

| Superficie | Estrategia | Invalidación |
|---|---|---|
| Páginas de la tienda, catálogo, producto | ISR con `revalidateTag` | Al publicar página, editar producto o tema |
| Stock visible | Lectura dinámica liviana (no se cachea) | — |
| Carrito y checkout | Dinámico, sin caché | — |
| Panel admin | Dinámico (Server Components + Server Actions) | — |

Etiquetas de caché estándar: `store:<id>`, `page:<id>`, `product:<id>`, `domain:<host>`.

Imágenes: `next/image` con transformaciones; originales en Supabase Storage.
Objetivo: ninguna imagen de más de 200 KB servida a móvil.

## 7. Seguridad

- **RLS en todas las tablas** (sin excepción). Tests pgTAP obligatorios por tabla.
- **El cliente nunca decide precios ni totales.** El servidor recalcula todo desde la base.
- **Service role key** solo en servidor (Server Actions, Edge Functions). Nunca en el navegador.
- **Secretos de proveedores** (tokens de Mercado Pago por tienda) en Supabase Vault,
  referenciados por id. Nunca en columnas de texto plano ni en logs.
- **Webhooks:** verificación de firma + idempotencia (`payment_events.provider_event_id` único).
- **Auditoría:** acciones sensibles registradas en `audit_log`.
- **Archivos:** buckets por propósito, rutas con prefijo `<store_id>/`, políticas de Storage
  alineadas con RLS. Validación de tipo y tamaño en servidor.
- **Cabeceras:** CSP estricta, HSTS, `X-Frame-Options` (excepto vista previa del editor).
- **Rate limiting** en login, checkout y formularios públicos.

## 8. Pagos

Interfaz común en `packages/payments` (detalle en la tarea correspondiente):

```ts
export interface PaymentProvider {
  readonly id: 'mercadopago' | 'manual' | 'stripe' | 'paypal';
  /** Inicia el cobro de un pedido ya validado por el servidor. */
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /** Traduce un webhook del proveedor a un evento normalizado. Verifica firma. */
  parseWebhook(req: Request): Promise<NormalizedPaymentEvent | null>;
}

export type CheckoutResult =
  | { kind: 'redirect'; url: string }
  | { kind: 'instructions'; instructions: ManualPaymentInstructions };
```

- **Mercado Pago:** cada tienda conecta su cuenta por OAuth; el dinero va directo al vendedor.
  Etapa 1 usa Checkout Pro (redirección). Comisión de plataforma: preparada, desactivada.
- **Pago manual:** transferencia, pago móvil, Zelle, efectivo. El comprador ve instrucciones,
  sube comprobante; el dueño confirma desde el panel.
- Stripe y PayPal se agregan en Etapa 5 como nuevos adaptadores, sin cambiar el checkout.

## 9. Stock

Libro mayor de movimientos (`inventory_movements`) + saldo materializado (`inventory`).

- Al iniciar checkout: **reserva** atómica vía función SQL (`reserve_stock`), con bloqueo de fila.
- Al confirmarse el pago: la reserva se **consume** (`commit_reservation`).
- Al vencer (30 min) o cancelarse: la reserva se **libera** (cron + `release_reservation`).
- Nunca se actualiza `inventory` directamente desde la app: solo mediante estas funciones.

## 10. Internacionalización

- Por tienda: `country_code` (ISO 3166-1), `currency` (ISO 4217), `default_locale` (BCP 47), `timezone`.
- **Dinero:** enteros en unidad mínima (`bigint`) + código de moneda. Nunca `float`.
  Monedas sin decimales (CLP) se manejan con la tabla de exponentes ISO en `packages/core`.
- Interfaz del panel: español (es-419) por defecto, inglés preparado.
- Textos de cada tienda: en su idioma por defecto. Multi-idioma de contenido: Etapa 5.

## 11. Observabilidad

- Errores: Sentry (o equivalente) en ambas apps y Edge Functions.
- Logs estructurados con `store_id` y `request_id`; sin datos personales ni secretos.
- Analítica de rendimiento: Vercel Speed Insights en storefront.

## 12. Entornos

| Entorno | Base de datos | Uso |
|---|---|---|
| Local | Supabase CLI (Docker) | Desarrollo y tests |
| Preview | Proyecto Supabase de staging | Cada PR genera un preview en Vercel |
| Producción | Proyecto Supabase de producción | Tiendas reales |

Las migraciones se aplican a staging automáticamente al integrar en `main`, y a producción
solo con aprobación de Arle (ver `04-flujo-de-trabajo.md`).

## 13. Registro de decisiones (ADR)

| # | Decisión | Alternativas descartadas | Motivo |
|---|---|---|---|
| 001 | Multi-tenant con BD compartida + RLS | Una BD por tienda | Costo, mantenimiento, migraciones únicas |
| 002 | Dos apps (storefront/admin) | Una app con grupos de rutas | Dominios, seguridad y despliegue independientes |
| 003 | Páginas como JSON de bloques versionados | HTML libre, CMS externo | Seguridad (sin HTML arbitrario), editor simple, reutilización |
| 004 | Dinero en enteros de unidad mínima | `numeric`/`float` | Exactitud y monedas sin decimales |
| 005 | Stock como libro mayor + saldo | Solo saldo | Auditoría, reservas y concurrencia |
| 006 | Pagos por adaptadores | Integración directa | Países distintos, proveedores intercambiables |
| 007 | Secretos en Supabase Vault | Columnas cifradas a mano | Gestión estándar y auditable |
