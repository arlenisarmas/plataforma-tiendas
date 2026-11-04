# Backlog · Etapa 1 — Motor de tiendas y creador de páginas

> Cada tarea se convierte en un GitHub Issue. Formato fijo (lo lee un script):
> encabezado `## T-xxx · Título` y línea de metadatos con Área, Ola, Depende de, Necesita a Arle.
> Todas las tareas incluyen implícitamente: cumplir `AGENTS.md`, tests, CI verde.

## Mapa de tareas

Una tarea se puede tomar cuando **todas sus dependencias están integradas en `main`**,
aunque estén en la misma ola. Las olas solo agrupan; las dependencias mandan.

| Ola | Tarea | Área | Depende de | Arle |
|---|---|---|---|---|
| 0 | T-001 · Estructura del monorepo y CI | infra | — | — |
| 0 | T-002 · Supabase local, tipos y datos de ejemplo | db | T-001 | ⚠️ sí |
| 0 | T-003 · Núcleo de dominio: dinero, slugs, totales y errores | core | T-001 | — |
| 0 | T-004 · Internacionalización y textos | i18n | T-001 | — |
| 0 | T-005 · Sistema de diseño base | ui | T-001 | — |
| 1 | T-006 · Paquete de acceso a datos | db | T-002, T-003 | — |
| 1 | T-007 · Ingreso, registro y perfil | admin | T-004, T-005, T-006 | — |
| 1 | T-008 · Motor de bloques y tema | blocks | T-003, T-004, T-005 | — |
| 1 | T-009 · Storefront multi-tienda | storefront | T-006, T-008 | — |
| 2 | T-010 · Asistente "Creá tu tienda" | admin | T-007, T-008 | — |
| 2 | T-011 · Bloques de productos | blocks | T-008 | — |
| 2 | T-012 · Bloques de contenido | blocks | T-008 | — |
| 2 | T-013 · Biblioteca de imágenes | admin | T-007 | — |
| 2 | T-014 · Productos, categorías y stock | admin | T-007, T-013 | — |
| 2 | T-015 · Estructura del panel | admin | T-007 | — |
| 3 | T-016 · Plantillas de rubro | blocks | T-011, T-012 | — |
| 3 | T-017 · Editor de páginas: núcleo | admin | T-011, T-012, T-015 | — |
| 3 | T-018 · Editor de páginas: vista previa, publicación e historial | admin | T-009, T-017 | — |
| 3 | T-019 · Catálogo en el storefront | storefront | T-009, T-011 | — |
| 3 | T-020 · Envíos y medios de pago (configuración) | admin | T-015 | — |
| 4 | T-021 · Carrito | storefront | T-019 | — |
| 4 | T-022 · Pagos: interfaz, pago manual y Mercado Pago | payments | T-006, T-020 | ⚠️ sí |
| 4 | T-023 · Finalizar compra | storefront | T-021, T-022 | — |
| 4 | T-024 · Pedidos en el panel | admin | T-015, T-022 | — |
| 4 | T-025 · Emails automáticos | emails | T-023 | ⚠️ sí |
| 4 | T-026 · Tareas programadas | db | T-002 | — |
| 5 | T-027 · Clientes y equipo | admin | T-024, T-025 | — |
| 5 | T-028 · Publicar la tienda y ajustes | admin | T-018, T-020 | — |
| 5 | T-029 · Dominios propios | infra | T-028 | ⚠️ sí |
| 5 | T-030 · Seguridad, observabilidad y rendimiento | infra | T-023 | — |
| 5 | T-031 · Suite e2e de flujos críticos | qa | T-023, T-024, T-028 | — |
| 6 | T-044 · Tema: paletas y tipografías por tienda | blocks | T-008 | — |
| 6 | T-045 · Bloques de portada y confianza | blocks | T-044 | — |
| 6 | T-046 · Plantillas Vasos & Tazas y Mascotas | blocks | T-045 | — |
| 6 | T-047 · Datos: personalización, producto digital y kits | db | T-014, T-022 | — |
| 6 | T-048 · Personalización de productos | admin | T-047, T-023 | — |
| 6 | T-049 · Producto digital: entrega tras el pago | storefront | T-047, T-025 | — |
| 6 | T-050 · Kits de productos | admin | T-047 | — |
| 6 | T-051 · Pantalla «Pagos» en el panel | admin | T-020, T-022 | — |
| 6 | T-052 · Temas oscuros y portada con imagen de fondo | blocks | T-044 | — |
| 6 | T-053 · Cabecera de dos niveles y barra inferior en celular | blocks | T-044 | — |
| 6 | T-054 · Tarjetas de producto y de categoría con insignias | blocks | T-045 | — |
| 6 | T-055 · Reseñas y puntuación de productos (datos) | db | T-014, T-024 | — |
| 6 | T-056 · Plantillas Tecnología y Repuestos | blocks | T-052, T-053, T-054 | — |
| 6 | T-057 · Stripe para Estados Unidos y España | payments | T-022 | ⚠️ sí |

---

## T-001 · Estructura del monorepo y CI
- **Área:** infra · **Ola:** 0 · **Depende de:** — · **Necesita a Arle:** no

**Objetivo.** Dejar el esqueleto del proyecto listo para que todas las demás tareas trabajen en paralelo.

**Alcance.**
- Turborepo + pnpm workspaces. Node LTS fijado en `.nvmrc` y `engines`.
- `apps/storefront` y `apps/admin`: Next.js (última estable, App Router, TypeScript `strict`,
  Tailwind CSS). Página de inicio mínima en cada una.
- Paquetes vacíos con su `package.json`, `src/index.ts` y nombre `@plataforma/<nombre>`:
  `core`, `db`, `ui`, `blocks`, `payments`, `i18n`, `emails`, `config`.
- `packages/config`: tsconfig base estricto (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`),
  ESLint (incluye `eslint-plugin-boundaries` con las reglas de `docs/01-arquitectura.md §3`), Prettier, preset de Tailwind.
- Vitest configurado en todos los paquetes; Playwright instalado en `apps/storefront` (sin tests aún).
- Scripts raíz: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `format`, `db:test`.
- `.env.example` documentando todas las variables previstas (sin valores reales).
- `.github/workflows/ci.yml`: en cada PR y push a `main` corre `lint`, `typecheck`, `test`, `build`
  con caché de pnpm y Turborepo. Mantener el job existente `escenarios-sql`.
- `.github/pull_request_template.md` ya existe: no modificar.

**Criterios de aceptación.**
- [ ] `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` pasa en limpio.
- [ ] Importar `apps/*` desde un paquete, o `@plataforma/db` desde `@plataforma/core`, hace fallar `pnpm lint`.
- [ ] CI corre en el PR y queda en verde.
- [ ] `pnpm dev` levanta ambas apps (puertos 3000 storefront, 3001 admin).

**Docs:** `docs/01-arquitectura.md` §3, §4.

---

## T-002 · Supabase local, tipos y datos de ejemplo
- **Área:** db · **Ola:** 0 · **Depende de:** T-001 · **Necesita a Arle:** sí (proyecto staging y secretos)

**Objetivo.** Que cualquier agente pueda levantar la base local idéntica a staging, con datos de ejemplo.

**Alcance.**
- `supabase/config.toml` (Supabase CLI) con el esquema `storefront` expuesto en la API.
- Las migraciones existentes NO se modifican.
- `supabase/seed.sql`: 2 usuarios, 2 tiendas (una `ARS` publicada, una `CLP` borrador),
  categorías, 6 productos con variantes y stock, un método de pago manual, un envío.
  Usar `create_store` y las funciones de stock; nada de `insert` directo en `inventory`.
- Script `pnpm db:types` que genera `packages/db/src/database.types.ts` (incluye esquemas `public` y `storefront`).
- Script `pnpm db:test` que ejecuta `supabase/tests/escenarios/ejecutar.sh` contra la base local.
- Workflow `.github/workflows/db-staging.yml`: al integrar en `main`, aplica migraciones a staging
  (`supabase db push`) usando secretos `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`.
  Si los secretos no existen, el job se saltea con un aviso (no falla).
- Documentar en `docs/desarrollo-local.md` cómo levantar todo (máx. 10 pasos).

**Criterios de aceptación.**
- [ ] `supabase start && supabase db reset` aplica migraciones y seed sin errores.
- [ ] `pnpm db:test` muestra los 53 escenarios en verde.
- [ ] Los tipos generados están commiteados y `pnpm typecheck` pasa.

---

## T-003 · Núcleo de dominio: dinero, slugs, totales y errores
- **Área:** core · **Ola:** 0 · **Depende de:** T-001 · **Necesita a Arle:** no

**Objetivo.** Lógica pura y 100% testeada que usarán todas las apps.

**Alcance (`packages/core`).**
- `money`: tipo `Money { amount: bigint; currency: CurrencyCode }`; tabla de exponentes ISO 4217
  (al menos ARS, CLP, USD, EUR, MXN, COP, PEN, UYU, BRL, VES); `toMinor('15.000,50', 'ARS', 'es-AR')`,
  `fromMinor`, `formatMoney(money, locale)` con `Intl.NumberFormat`; suma/resta/multiplicación por entero sin `float`.
- `slug`: `slugify('Mesa Ratona Ñandú')` → `mesa-ratona-nandu`; validación con la regex del esquema.
- `orders`: `calculateTotals({ items, shippingMethod, discount })` → subtotal, envío (incluye "gratis desde"), total.
  Debe coincidir con los CHECK de la base (`total = subtotal + envío − descuento`, `línea = precio × cantidad`).
- `errors`: tipo `BusinessErrorCode` con todos los códigos de `docs/02-modelo-de-datos.md §7`
  y `parseDbError(error) → BusinessErrorCode | 'UNKNOWN'`.
- `sanitize`: sanitizador de texto con formato básico (negrita, cursiva, listas, links http/https) para el bloque `rich-text`.

**Criterios de aceptación.**
- [ ] Cobertura ≥ 90% en `packages/core`.
- [ ] Tests con CLP (sin decimales), ARS y USD; montos grandes (> 2^53) sin pérdida.
- [ ] `core` no importa ningún otro paquete del monorepo.

---

## T-004 · Internacionalización y textos
- **Área:** i18n · **Ola:** 0 · **Depende de:** T-001 · **Necesita a Arle:** no

**Alcance (`packages/i18n`).**
- Configuración de next-intl reutilizable por ambas apps. Locales: `es-419` (por defecto), `es-AR` (voseo), `en`.
- Estructura `messages/<locale>/{common,admin,storefront,blocks,errors}.json`.
- `errors.json` con los mensajes de `docs/02-modelo-de-datos.md §7`.
- Helper `formatDate`, `formatRelative` ("hace 5 minutos") por locale y zona horaria de la tienda.
- Test que verifica que todas las claves de `es-419` existen en `es-AR` y `en`.
- Test de glosario: falla si algún texto de `admin`/`common` en español contiene palabras prohibidas
  de `docs/05-experiencia-de-usuario.md §6` (dashboard, SKU, checkout, slug, webhook, deploy).

**Criterios de aceptación.**
- [ ] Ambas apps muestran un texto traducido en su página de inicio.
- [ ] Tests de claves y glosario en verde.

---

## T-005 · Sistema de diseño base
- **Área:** ui · **Ola:** 0 · **Depende de:** T-001 · **Necesita a Arle:** no

**Objetivo.** Componentes accesibles y amables que cumplan `docs/05-experiencia-de-usuario.md` por defecto.

**Alcance (`packages/ui`, sobre shadcn/ui).**
- Tokens (colores, espaciado, radios, tipografía) como variables CSS; soporte de `text-scale` 100–150%.
- Componentes: `Button` (tamaño mínimo 44 px, variantes primaria/secundaria/peligro, estado cargando),
  `Field` (etiqueta arriba, ayuda, error debajo), `Input`, `Textarea`, `Select`, `Switch`, `Card`,
  `EmptyState`, `Skeleton`, `ConfirmDialog` (texto del botón explícito), `Toast`, `HelpTip`,
  `StepWizard` (≤ 3 campos por paso, progreso visible), `PageHeader`, `Badge` de estado.
- Página de catálogo de componentes en `apps/admin/app/(dev)/ui` (solo en desarrollo).
- Tests de accesibilidad con `@testing-library` + `jest-axe` (o equivalente) para cada componente.

**Criterios de aceptación.**
- [ ] Sin violaciones de axe en el catálogo.
- [ ] Todos los componentes usables a 360 px y con teclado.

---

## T-006 · Paquete de acceso a datos
- **Área:** db · **Ola:** 1 · **Depende de:** T-002, T-003 · **Necesita a Arle:** no

**Alcance (`packages/db`).**
- Clientes tipados: `createBrowserClient`, `createServerClient` (cookies, RLS del usuario),
  `createServiceClient` (solo servidor; falla en build si se importa desde un componente cliente — usar `server-only`).
- Cliente para el storefront que solo consulta el esquema `storefront`.
- `callRpc` tipado para todas las funciones de `docs/02-modelo-de-datos.md §5` que devuelve
  `Result<T, BusinessErrorCode>` usando `parseDbError`.
- Tests unitarios con cliente simulado.

**Criterios de aceptación.**
- [ ] Importar `createServiceClient` en un archivo `'use client'` rompe el build.
- [ ] Todas las RPC tienen tipos de entrada y salida.

---

## T-007 · Ingreso, registro y perfil
- **Área:** admin · **Ola:** 1 · **Depende de:** T-004, T-005, T-006 · **Necesita a Arle:** no

**Alcance (`apps/admin`).**
- Registro e ingreso con email + contraseña y con link mágico por email. (Google queda preparado, desactivado.)
- Recuperar contraseña. Mensajes de error amables.
- Primera vez: pregunta "¿Querés que te guiemos paso a paso?" → `profiles.guided`.
- Pantalla "Mi perfil": nombre, tamaño de letra (`text_scale`), modo simple/avanzado, idioma.
- Middleware que protege todas las rutas del panel.

**Criterios de aceptación.**
- [ ] Flujo completo probado con Playwright contra Supabase local.
- [ ] El tamaño de letra elegido se aplica a todo el panel.

---

## T-008 · Motor de bloques y tema
- **Área:** blocks · **Ola:** 1 · **Depende de:** T-003, T-004, T-005 · **Necesita a Arle:** no

**Alcance (`packages/blocks`).** Implementar el contrato de `docs/03-sistema-de-bloques.md`:
- `types.ts` (contrato), `registry.ts`, `theme.ts` (esquema Zod + paletas curadas + `themeToCssVars`).
- `renderPage(blocks, ctx)`: migra, valida con `safeParse`, ejecuta loaders en paralelo,
  omite bloques inválidos sin romper la página y registra el error.
- Soporte de **variantes de diseño** (`variants`, `defaultVariant`, `onlyInVariants`) según `docs/03 §3`.
- Bloques: `hero`, `rich-text`, `spacer`, **cada uno con todas sus variantes** de `docs/03 §4`.
- `layout/`: encabezado y pie configurados por el tema.

**Criterios de aceptación.**
- [ ] Un bloque desconocido o inválido no rompe el render (test).
- [ ] `migrate` probado con un bloque de prueba v1 → v2.
- [ ] Las paletas curadas pasan contraste AA (test automático).
- [ ] Cambiar `variant` no modifica ni pierde `props` (test). Variante inexistente → usa `defaultVariant`.
- [ ] Cada variante renderiza a 360 px sin desbordes (test).

---

## T-009 · Storefront multi-tienda
- **Área:** storefront · **Ola:** 1 · **Depende de:** T-006, T-008 · **Necesita a Arle:** no

**Alcance (`apps/storefront`).**
- `middleware.ts`: resolver tienda por hostname vía `storefront.domains` (caché con etiqueta `domain:<host>`),
  reescritura a `/_sites/[storeId]/...`. En desarrollo, `?tienda=<slug>` o `<slug>.localhost`.
- Layout de tienda con tema publicado (variables CSS), encabezado y pie.
- Página de inicio y páginas `/[slug]` renderizadas con `renderPage` + ISR (`revalidateTag`).
- Ruta interna `POST /api/revalidate` protegida con secreto para invalidar etiquetas.
- 404 amable para dominio desconocido o tienda no publicada.

**Criterios de aceptación.**
- [ ] Con el seed, la tienda publicada se ve y la de borrador da 404.
- [ ] Lighthouse móvil ≥ 90 en rendimiento y accesibilidad en la página de inicio de ejemplo.

---

## T-010 · Asistente "Creá tu tienda"
- **Área:** admin · **Ola:** 2 · **Depende de:** T-007, T-008 · **Necesita a Arle:** no

**Alcance.** Asistente con `StepWizard`:
1. Nombre del negocio → sugiere dirección (slug) y verifica disponibilidad.
2. Qué vendés (rubro) → elige plantilla (por ahora solo `general`; T-016 agrega el resto).
3. País → define moneda, zona horaria e idioma sugeridos (editables en avanzado).
4. Logo (subir o "lo hago después") y paleta de colores con vista previa.
Llama a `create_store`, aplica la plantilla (tema + páginas en borrador) y termina en el inicio del panel
con la lista "Tu tienda al 100%".

**Criterios de aceptación.**
- [ ] Una persona crea su tienda en ≤ 5 pasos y ≤ 3 campos por paso.
- [ ] Errores de negocio (`DIRECCION_EN_USO`, `LIMITE_DE_TIENDAS`) con mensaje amable.
- [ ] e2e Playwright del flujo completo en viewport móvil.

---

## T-011 · Bloques de productos
- **Área:** blocks · **Ola:** 2 · **Depende de:** T-008 · **Necesita a Arle:** no

**Alcance.** `featured-products`, `category-grid`, `product-grid`, **con todas sus variantes de diseño** (`docs/03 §4`), con loaders que leen de
`storefront.*`, tarjeta de producto reutilizable (foto, nombre, precio, precio tachado, "Sin stock").

**Criterios de aceptación.**
- [ ] Respetan el checklist de `docs/03-sistema-de-bloques.md §9`.
- [ ] Formato de moneda correcto para ARS y CLP.

---

## T-012 · Bloques de contenido
- **Área:** blocks · **Ola:** 2 · **Depende de:** T-008 · **Necesita a Arle:** no

**Alcance.** `announcement-bar`, `image-with-text`, `gallery`, `testimonials`, `faq`, `contact`, **con todas sus variantes de diseño** (`docs/03 §4`)
(WhatsApp con mensaje prearmado, teléfono, email, dirección con link a mapas, horarios, redes).

**Criterios de aceptación.**
- [ ] Respetan el checklist de `docs/03-sistema-de-bloques.md §9`.
- [ ] `faq` accesible (acordeón con roles ARIA y teclado).

---

## T-013 · Biblioteca de imágenes
- **Área:** admin · **Ola:** 2 · **Depende de:** T-007 · **Necesita a Arle:** no

**Alcance.**
- Subida al bucket `store-media` con ruta `<store_id>/<carpeta>/<uuid>.<ext>`; registro en `media_assets`
  con ancho, alto, tamaño y tipo validados en servidor.
- Compresión/redimensión en el navegador antes de subir (máx. 2400 px, WebP).
- Selector de imágenes reutilizable (`MediaPicker`) para productos, bloques y logo; texto alternativo opcional con sugerencia.
- Subir desde la cámara del celular.

**Criterios de aceptación.**
- [ ] Archivos de otro tipo o > 10 MB se rechazan con mensaje amable.
- [ ] Una imagen de 6 MB del celular queda < 500 KB.

---

## T-014 · Productos, categorías y stock
- **Área:** admin · **Ola:** 2 · **Depende de:** T-007, T-013 · **Necesita a Arle:** no

**Alcance.**
- Lista de productos con foto, precio, stock y estado; búsqueda y filtro por categoría.
- Alta rápida en una pantalla (modo simple): foto(s), nombre, precio, stock, categoría. Guardar como borrador o publicar.
- Modo avanzado: opciones (talle/color) que generan variantes, precio por variante, precio anterior, SKU, peso, costo.
- Stock: "Sumar unidades" / "Corregir stock" vía `adjust_stock`, con historial de movimientos.
- Categorías: crear, ordenar arrastrando, subcategorías (1 nivel).
- Slug autogenerado con `slugify` y editable en avanzado.

**Criterios de aceptación.**
- [ ] e2e: cargar un producto con foto, precio y stock en ≤ 3 min la primera vez (viewport móvil).
- [ ] Precios ingresados con formato local (`15.000,50`) se guardan correctamente en unidad mínima.

---

## T-015 · Estructura del panel
- **Área:** admin · **Ola:** 2 · **Depende de:** T-007 · **Necesita a Arle:** no

**Alcance.**
- Navegación de 6 secciones (Inicio · Productos · Pedidos · Mi página · Clientes · Ajustes); barra inferior en celular.
- Selector de tienda si la persona pertenece a más de una.
- Inicio: lista "Tu tienda al 100%" (calculada a partir de datos reales), resumen del día, notificaciones.
- Buscador "¿Qué querés hacer?" con acciones frecuentes.
- Centro de notificaciones (`notifications`, marcar como leídas).

**Criterios de aceptación.**
- [ ] Cada ítem de la lista lleva a la pantalla correcta y se tilda solo al completarse.

---

## T-016 · Plantillas de rubro
- **Área:** blocks · **Ola:** 3 · **Depende de:** T-011, T-012 · **Necesita a Arle:** no

**Alcance.** Plantillas `mascotas`, `carpinteria-muebles`, `ropa-accesorios`, `comida-casera`, `general`
(tema + Inicio, Sobre nosotros, Contacto, Preguntas frecuentes) con textos de ejemplo cálidos y editables.
Integrarlas al asistente de T-010.

**Criterios de aceptación.**
- [ ] Cada plantilla valida contra los esquemas de bloques y tema (test).

---

## T-017 · Editor de páginas: núcleo
- **Área:** admin · **Ola:** 3 · **Depende de:** T-011, T-012, T-015 · **Necesita a Arle:** no

**Alcance.** Según `docs/03-sistema-de-bloques.md §6`:
- Lista de secciones: agregar (catálogo visual), mover (arrastrar y botones ↑↓), duplicar, ocultar, borrar con deshacer.
- Formulario generado a partir de `fields` (todos los `kind`), modo simple/avanzado.
- Botón **"Cambiar diseño"** por sección: selector de variantes con miniatura y vista previa; cambia solo `variant`.
- Autoguardado de `draft_blocks` con indicador; deshacer/rehacer (50 pasos).
- Diseño adaptado a celular (pasos en lugar de columnas).

**Criterios de aceptación.**
- [ ] e2e: cambiar foto y título de la portada en ≤ 1 min.
- [ ] Recargar la página no pierde cambios.
- [ ] e2e: cambiar el diseño de la portada entre sus variantes sin perder título, imagen ni botón.

---

## T-018 · Editor de páginas: vista previa, publicación e historial
- **Área:** admin · **Ola:** 3 · **Depende de:** T-009, T-017 · **Necesita a Arle:** no

**Alcance.**
- Vista previa en vivo (iframe al storefront con token firmado de 15 min que habilita `draft_blocks` y `theme_draft`;
  actualización por `postMessage` sin recargar). Conmutador celular/computadora.
- Publicar (`publish_page`) + invalidación de caché; mensaje "Tus cambios ya están en tu tienda".
- Historial de versiones y restaurar (`restore_page_version`).
- Editor de tema (paleta, tipografía, bordes, encabezado, pie) con publicar tema.
- Gestión de páginas: crear, renombrar, mostrar en el menú, ordenar el menú.

**Criterios de aceptación.**
- [ ] La vista previa nunca es accesible sin token válido (test).
- [ ] Publicar se refleja en el storefront en < 5 s.

---

## T-019 · Catálogo en el storefront
- **Área:** storefront · **Ola:** 3 · **Depende de:** T-009, T-011 · **Necesita a Arle:** no

**Alcance.** Páginas de sistema: categoría (filtros simples, orden), producto (galería, selector de opciones,
disponibilidad en tiempo real, "Agregar al carrito", compartir por WhatsApp), búsqueda (`search` tsvector).
Metadatos SEO y Open Graph por producto.

**Criterios de aceptación.**
- [ ] Variante sin stock deshabilitada en el selector con texto "Sin stock".
- [ ] Lighthouse móvil ≥ 90 en página de producto.

---

## T-020 · Envíos y medios de pago (configuración)
- **Área:** admin · **Ola:** 3 · **Depende de:** T-015 · **Necesita a Arle:** no

**Alcance.**
- Envíos: retiro en el local, envío a domicilio con precio fijo, envío gratis desde un monto.
- Medios de pago manuales: transferencia, pago móvil, Zelle, efectivo — cada uno con instrucciones guiadas
  (campos según el método, ej. alias/CBU, teléfono y banco).
- Lugar reservado para "Conectar Mercado Pago" (lo implementa T-022).

**Criterios de aceptación.**
- [ ] Una persona configura transferencia y retiro en ≤ 2 min.

---

## T-021 · Carrito
- **Área:** storefront · **Ola:** 4 · **Depende de:** T-019 · **Necesita a Arle:** no

**Alcance.** Carrito guardado en cookie firmada (ids y cantidades, nunca precios), precios y disponibilidad
recalculados en servidor en cada vista, mini-carrito, ajuste automático si cambió el stock con aviso amable.

**Criterios de aceptación.**
- [ ] Manipular la cookie no permite cambiar precios (test).

---

## T-022 · Pagos: interfaz, pago manual y Mercado Pago
- **Área:** payments · **Ola:** 4 · **Depende de:** T-006, T-020 · **Necesita a Arle:** sí (app de desarrollador de Mercado Pago)

**Alcance (`packages/payments` + rutas en apps).**
- Interfaz `PaymentProvider` de `docs/01-arquitectura.md §8`.
- Adaptador `manual`: devuelve instrucciones; subida de comprobante por URL firmada al bucket `payment-receipts`
  (pago pasa a `in_review`).
- Adaptador `mercadopago`: conexión por OAuth desde el panel (token guardado en Supabase Vault, `secret_id`),
  Checkout Pro, webhook con verificación de firma, idempotencia con `payment_events`,
  y efectos solo mediante `apply_payment_status`.
- Edge Function o ruta de API para el webhook.

**Criterios de aceptación.**
- [ ] Un webhook repetido no produce efectos dobles (test).
- [ ] Firma inválida → 401 sin efectos (test).
- [ ] Ningún token de Mercado Pago aparece en tablas, logs ni respuestas.

---

## T-023 · Finalizar compra
- **Área:** storefront · **Ola:** 4 · **Depende de:** T-021, T-022 · **Necesita a Arle:** no

**Alcance.**
- Pasos: datos de contacto → entrega → pago → confirmación. Sin obligar a crear cuenta.
- En servidor (service role): recalcular totales con `calculateTotals`, crear/actualizar cliente,
  `next_order_number`, crear pedido + ítems (snapshot), `reserve_stock` (30 min MP / 48 h manual),
  crear pago, iniciar proveedor. Todo en una transacción lógica con compensación si algo falla.
- Página "Mi pedido" con `get_order_for_buyer` (token del mail).
- Rate limiting en este flujo.

**Criterios de aceptación.**
- [ ] e2e: compra completa con pago manual en ≤ 2 min en celular.
- [ ] `STOCK_INSUFICIENTE` muestra qué producto y deja ajustar la cantidad.

---

## T-024 · Pedidos en el panel
- **Área:** admin · **Ola:** 4 · **Depende de:** T-015, T-022 · **Necesita a Arle:** no

**Alcance.** Lista con filtros por estado (pestañas con contador), detalle del pedido, cambio de estado
con botones del próximo paso lógico ("Marcar como enviado"), confirmar/rechazar pago manual viendo el comprobante,
nota interna, contactar por WhatsApp.

**Criterios de aceptación.**
- [ ] e2e: ver un pedido nuevo y marcarlo como enviado en ≤ 1 min.
- [ ] Solo se ofrecen transiciones válidas.

---

## T-025 · Emails automáticos
- **Área:** emails · **Ola:** 4 · **Depende de:** T-023 · **Necesita a Arle:** sí (cuenta Resend)

**Alcance (`packages/emails`).** Plantillas React Email con la marca de cada tienda: confirmación de pedido
(con link "Mi pedido" e instrucciones de pago manual), pago confirmado, pedido enviado/listo para retirar,
nuevo pedido (al dueño), invitación al equipo. Envío desde el servidor, reintentos y registro de fallos.

**Criterios de aceptación.**
- [ ] Vista previa local de todas las plantillas; legibles en celular.

---

## T-026 · Tareas programadas
- **Área:** db · **Ola:** 4 · **Depende de:** T-002 · **Necesita a Arle:** no

**Alcance.** Programación (pg_cron o cron de Supabase) de `release_expired_reservations()` cada 5 minutos,
como nueva migración `area:db`. Test de que se registra el job.

---

## T-027 · Clientes y equipo
- **Área:** admin · **Ola:** 5 · **Depende de:** T-024, T-025 · **Necesita a Arle:** no

**Alcance.** Lista y ficha de clientes (pedidos, total comprado, notas). Equipo: invitar por email (token
aleatorio, se guarda solo el hash), ver miembros, cambiar permiso, quitar, salir de la tienda.

---

## T-028 · Publicar la tienda y ajustes
- **Área:** admin · **Ola:** 5 · **Depende de:** T-018, T-020 · **Necesita a Arle:** no

**Alcance.** Pantalla "Abrir mi tienda" con verificación previa (inicio publicado, al menos 1 producto,
un medio de pago, un envío) y `publish_store`. Subdominio automático al publicar. Ajustes: datos de contacto,
redes, textos legales (plantillas de términos, privacidad y devoluciones por país).

---

## T-029 · Dominios propios
- **Área:** infra · **Ola:** 5 · **Depende de:** T-028 · **Necesita a Arle:** sí (dominio de la plataforma y token de Vercel)

**Alcance.** Agregar dominio propio desde el panel: alta en Vercel por API, instrucciones DNS paso a paso
con capturas, verificación periódica, `verified_at`, dominio principal y redirección.

---

## T-030 · Seguridad, observabilidad y rendimiento
- **Área:** infra · **Ola:** 5 · **Depende de:** T-023 · **Necesita a Arle:** no

**Alcance.** Cabeceras (CSP, HSTS, frame-ancestors salvo vista previa), rate limiting (login, checkout,
formularios), Sentry en apps y funciones, logs sin datos personales, presupuesto de Lighthouse en CI,
sitemap y robots por tienda.

---

## T-031 · Suite e2e de flujos críticos
- **Área:** qa · **Ola:** 5 · **Depende de:** T-023, T-024, T-028 · **Necesita a Arle:** no

**Alcance.** Playwright en viewport móvil y escritorio para los 6 flujos de
`docs/05-experiencia-de-usuario.md §5`, con chequeo de accesibilidad (axe) y medición de tiempos.
Corre en CI contra Supabase local.

**Criterios de aceptación.**
- [ ] Los 6 flujos pasan en CI.

---

# Lote 7 · Dos tiendas reales sobre el motor

> Objetivo: que **Vasos & Tazas Personalizadas** (rosa/violeta) y **Che Peludos** (amarillo/azul)
> se puedan armar en el motor con su diseño propio, vender en varios países y cobrar sin que Arle
> toque la pasarela. Los diseños de referencia están en el canvas «Boceto tienda y panel admin»
> (tableros «Nuevo · Inicio», «Nuevo · Producto» y «Che Peludos · Inicio»).
> El código del Che Peludos actual (Next.js + Prisma, repo privado `chepeludos-cloud/che-peludos`)
> es solo **inspiración**: no se migra ni se toca en este lote.

**Tokens de diseño de referencia (aproximados; ajustar a contraste AA con `contrastRatio`).**

| Tienda | Fondo | Texto | Principal | Acento | Superficie | Letras |
|---|---|---|---|---|---|---|
| Vasos & Tazas | `#FBF7FF` | `#2A0F5A` | `#D90F6E` | `#7C3AED` | `#F1E8FF` | Baloo 2 (títulos), Nunito |
| Che Peludos | `#FFFFFF` | `#111111` | `#1565C0` | `#FFC107` | `#FFF9EF` | Poppins, Pacifico (detalles) |

## T-044 · Tema: paletas y tipografías por tienda
- **Área:** blocks · **Ola:** 6 · **Depende de:** T-008 · **Necesita a Arle:** no

**Objetivo.** Que cada tienda pueda tener paleta y letras propias, no solo las 5 paletas y las 4 fuentes del sistema.

**Alcance.**
- `packages/blocks/src/theme.ts`: sumar las paletas curadas `vasos-tazas` y `che-peludos` (valores de la tabla, corregidos para pasar `WCAG AA`; los textos blancos sobre color principal deben cumplir 4,5:1).
- Sumar los pares de letras `divertida` (Baloo 2 + Nunito) y `calida` (Poppins + Pacifico para detalles), cargadas con `next/font/google` en el storefront; en el admin la vista previa usa las mismas.
- `themeToCssVars` expone `--theme-font-display` además de `--theme-font-body`.
- Ampliar los enums de `themeSchema` (paleta y letras). El tema se guarda en `stores.theme_draft`/`theme_published` (`jsonb`), así que **no hay migración**: los temas guardados siguen válidos tal cual.
- Textos del selector en `packages/i18n/messages/es-419`.

**Criterios de aceptación.**
- [ ] Temas existentes siguen validando sin cambios (test).
- [ ] Las dos paletas nuevas pasan el chequeo de contraste (test).
- [ ] La vista previa del armado guiado muestra las letras nuevas.

---

## T-045 · Bloques de portada y confianza
- **Área:** blocks · **Ola:** 6 · **Depende de:** T-044 · **Necesita a Arle:** no

**Objetivo.** Los bloques que faltan para parecerse a los diseños de referencia.

**Alcance** (cada uno cumple `docs/03-sistema-de-bloques.md`: schema, ≥2 variantes, textos i18n, miniatura, tests).
- `hero` variante `tarjetas`: tarjeta grande (título, subtítulo, botón, insignia de precio, imagen con fondo de color) y hasta 2 tarjetas de promo a la derecha; en celular se apilan.
- `announcement-bar` variante `marquesina`: texto en movimiento, se pausa al pasar el mouse, quieta con «reducir movimiento».
- Bloque nuevo `trust-strip` («¿Por qué elegirnos?»): 3 a 4 ítems con imagen o ícono, título y texto.
- `category-grid` variante `circulos`: categorías en círculos con foto y nombre, carrusel horizontal en celular.
- Bloque nuevo `steps` («¿Cómo funciona?»): pasos con ícono, título y texto.
- Bloque nuevo `promo-strip`: franja de color con texto y link (ej. «15% de descuento en tu primera compra»).

**Criterios de aceptación.**
- [ ] Todos se ven bien a 390 px y a 1280 px sin scroll horizontal (e2e de capturas).
- [ ] Imágenes con `alt` y sin romper el layout si faltan.
- [ ] Ningún texto fijo en el código: todo editable desde el editor de páginas.

---

## T-046 · Plantillas Vasos & Tazas y Mascotas
- **Área:** blocks · **Ola:** 6 · **Depende de:** T-045 · **Necesita a Arle:** no

**Alcance.** En `packages/blocks/src/templates.ts` sumar los rubros `vasos-tazas` (paleta y letras de T-044; portada con `hero` `tarjetas`, `category-grid` `circulos` con Tazas, Vasos, Cursos y Kits, `steps`, productos destacados) y `mascotas-premium` (paleta Che Peludos; `announcement-bar` `marquesina`, `promo-strip`, `hero` `tarjetas`, `trust-strip`, `category-grid` `circulos`, productos destacados). Disponibles en el asistente «Creá tu tienda».

**Criterios de aceptación.**
- [ ] Crear una tienda con cada rubro deja una portada publicable con textos de ejemplo claros (test).
- [ ] Las plantillas anteriores no cambian (test).

---

## T-047 · Datos: personalización, producto digital y kits
- **Área:** db · **Ola:** 6 · **Depende de:** T-014, T-022 · **Necesita a Arle:** no

**Alcance (una migración, solo esta tarea toca la base).**
- Tipo de producto `product_kind`: `physical` (por defecto), `digital`, `kit`. Los digitales no llevan stock ni envío.
- Opciones de personalización por producto: tabla `product_personalizations` (id, store_id, product_id, etiqueta, tipo `text|choice|color|image`, obligatorio, opciones, largo máximo, orden) con RLS por tienda igual que `products`.
- `order_items.personalization jsonb` con las respuestas del cliente (snapshot, no se modifica después).
- Entrega digital: `products.digital_url` (link) o archivo en el bucket privado; la URL nunca se expone antes del pago aprobado.
- Kits: tabla `kit_items` (kit_id, product_id, cantidad); descontar stock de los componentes con las funciones existentes.
- Actualizar tipos generados y escenarios SQL.

**Criterios de aceptación.**
- [ ] Un usuario de otra tienda no ve ni edita estas filas (escenario SQL).
- [ ] Vender un kit descuenta el stock de cada componente y falla completo si falta uno.
- [ ] `digital_url` no es legible por clientes con pedido sin pagar.

---

## T-048 · Personalización de productos
- **Área:** admin · **Ola:** 6 · **Depende de:** T-047, T-023 · **Necesita a Arle:** no

**Alcance.**
- Panel: en el editor de producto, sección «Personalización» para agregar campos (ej. «Nombre en la taza», «Personaje», «Color»).
- Página de producto: formulario con esos campos, validación en servidor (largo, obligatorios), vista previa del texto.
- Carrito y compra: las respuestas viajan con cada ítem, se guardan en `order_items.personalization` y se muestran en el pedido del panel, en el email al cliente y al dueño.
- Imagen subida por el cliente: solo tipos y tamaño permitidos, bucket privado.

**Criterios de aceptación.**
- [ ] Dos unidades del mismo producto con distinta personalización son líneas separadas del carrito (test).
- [ ] No se acepta HTML ni scripts en los textos (test).
- [ ] e2e: comprar una taza con nombre en celular y verlo en el pedido del panel.

---

## T-049 · Producto digital: entrega tras el pago
- **Área:** storefront · **Ola:** 6 · **Depende de:** T-047, T-025 · **Necesita a Arle:** no

**Alcance.** En compras con productos solo digitales se omite el paso de entrega; al pasar el pago a `approved` (también al aprobar manualmente un comprobante) se muestra el acceso en «Mi pedido» y se envía por email. Si el pedido mezcla físico y digital, se piden ambos. Reenviar acceso desde el panel.

**Criterios de aceptación.**
- [ ] Antes del pago aprobado no se ve el link (test).
- [ ] Webhook repetido no manda dos emails (test).
- [ ] e2e: curso comprado con pago manual y aprobado por el dueño.

---

## T-050 · Kits de productos
- **Área:** admin · **Ola:** 6 · **Depende de:** T-047 · **Necesita a Arle:** no

**Alcance.** Panel: armar un kit eligiendo productos y cantidades, con precio propio y precio «por separado» tachado. Tienda: la ficha del kit lista sus componentes; disponible solo si todos tienen stock.

**Criterios de aceptación.**
- [ ] Un componente sin stock deja el kit «sin stock» (test).
- [ ] Editar un componente no cambia pedidos ya hechos.

---

## T-051 · Pantalla «Pagos» en el panel
- **Área:** admin · **Ola:** 6 · **Depende de:** T-020, T-022 · **Necesita a Arle:** no

**Alcance.** Una sola pantalla para cada tienda: conectar Mercado Pago (OAuth) con estado claro, configurar pago manual (transferencia, alias, instrucciones, comprobante), y ver qué medios se ofrecen según el país del cliente. Mensajes simples, sin términos técnicos. Nunca se muestran tokens.

**Criterios de aceptación.**
- [ ] Conectar y desconectar Mercado Pago deja el estado correcto (test con doble de prueba).
- [ ] El dueño sin permiso de pagos no ve la pantalla (test).

---

## T-052 · Temas oscuros y portada con imagen de fondo
- **Área:** blocks · **Ola:** 6 · **Depende de:** T-044 · **Necesita a Arle:** no

**Objetivo.** Que el motor haga tiendas oscuras como las de referencia «TechZone» (azul noche, cian y violeta) y «AutoParts» (negro, rojo y crema).

**Alcance.**
- Paletas curadas `tecnologia` y `repuestos`, con fondo oscuro, que pasen contraste AA para texto, botones y precios (usar `contrastRatio`). El tema guarda si es claro u oscuro y la tienda lo respeta en todas las páginas, incluido el carrito y la compra.
- `hero` variante `imagen-fondo`: imagen a todo el ancho, texto a la izquierda, botón principal y hasta 3 íconos de confianza debajo. Capa oscura automática detrás del texto para que siempre se lea; imagen de celular distinta de la de computadora, opcional.
- `hero` admite varias diapositivas con puntos indicadores (carrusel simple, sin autoplay si «reducir movimiento»).

**Criterios de aceptación.**
- [ ] El texto del hero cumple AA sobre cualquier imagen subida (test con imagen clara y oscura).
- [ ] Carrito y compra se ven bien en tema oscuro (capturas e2e).
- [ ] Temas claros existentes no cambian (test).

---

## T-053 · Cabecera de dos niveles y barra inferior en celular
- **Área:** blocks · **Ola:** 6 · **Depende de:** T-044 · **Necesita a Arle:** no

**Alcance.**
- Cabecera variante `dos-niveles`: franja superior con avisos y links (envíos, atención al cliente, seguimiento de pedido), barra principal con logo, buscador con botón y carrito, y barra de categorías con «Todas las categorías» desplegable y las categorías principales.
- Cabecera `oscura` para temas oscuros.
- En celular: menú hamburguesa y, opcional, barra inferior fija con 5 accesos (Inicio, Categorías, Ofertas, Ayuda, Mi cuenta) editables desde el panel; respeta el área segura del celular.
- Footer variante `completo`: columnas de links, suscripción por email y redes.

**Criterios de aceptación.**
- [ ] Menú y desplegable se manejan con teclado y lector de pantalla (test).
- [ ] La barra inferior no tapa el contenido ni el botón de compra a 390 px (e2e).

---

## T-054 · Tarjetas de producto y de categoría con insignias
- **Área:** blocks · **Ola:** 6 · **Depende de:** T-045 · **Necesita a Arle:** no

**Alcance.**
- Tarjeta de producto configurable: insignia de texto con color (Más vendido, Oferta, Nuevo), porcentaje de descuento, precio tachado, corazón de favoritos, botón «Agregar al carrito» o botón de ícono, y formato horizontal compacto en celular.
- Estrellas y cantidad de reseñas **solo si el producto tiene reseñas** (datos de T-055); sin reseñas no se muestra nada.
- `category-grid` variantes `imagen-etiqueta` (foto con ícono y nombre abajo) e `inclinada` (cuadros en diagonal); en celular, fila deslizable.
- Moneda y formato de precio según la tienda (ARS, MXN, COP, USD…).

**Criterios de aceptación.**
- [ ] Sin foto o sin reseñas la tarjeta no queda rota (test).
- [ ] El descuento se calcula en servidor a partir de precio y precio de lista (test).

---

## T-055 · Reseñas y puntuación de productos (datos)
- **Área:** db · **Ola:** 6 · **Depende de:** T-014, T-024 · **Necesita a Arle:** no

**Alcance (una migración).** Tabla `product_reviews` (tienda, producto, pedido, puntaje 1 a 5, comentario, estado `pendiente|publicada|oculta`), con RLS por tienda. Solo quien compró el producto puede reseñar (por el link del pedido). El dueño modera desde el panel. Promedio y cantidad por producto en una vista o campo calculado. Escenarios SQL.

**Criterios de aceptación.**
- [ ] No se puede reseñar sin pedido pagado (escenario SQL).
- [ ] Un usuario de otra tienda no ve ni modera reseñas.

---

## T-056 · Plantillas Tecnología y Repuestos
- **Área:** blocks · **Ola:** 6 · **Depende de:** T-052, T-053, T-054 · **Necesita a Arle:** no

**Alcance.** Rubros `tecnologia` y `repuestos` en `templates.ts`: portada con imagen de fondo, categorías con imagen y etiqueta, productos destacados con insignias, banner de promo, franja de confianza (envío, compra segura, devoluciones, garantía) y footer completo. Textos de ejemplo claros y editables. Disponibles en el asistente «Creá tu tienda».

**Criterios de aceptación.**
- [ ] Crear una tienda con cada rubro deja una portada publicable en tema oscuro (test).
- [ ] Sin fotos subidas muestra espacios con aviso, no imágenes rotas.

> **Fuera de este lote (decidir con Arle):** selector «Mi vehículo» con compatibilidad de repuestos por marca, modelo y año. Es una función grande (datos de compatibilidad por producto); solo tiene sentido si realmente se venden repuestos.

---

## T-057 · Stripe para Estados Unidos y España
- **Área:** payments · **Ola:** 6 · **Depende de:** T-022 · **Necesita a Arle:** sí (cuenta de Stripe y claves de prueba, cargadas solo como secretos)

**Alcance.** Adaptador `stripe` que implementa `PaymentProvider` con Checkout alojado por Stripe (los datos de tarjeta nunca pasan por el servidor propio), webhook con verificación de firma e idempotencia con `payment_events`, y efectos solo vía `apply_payment_status`. Cuenta conectada por tienda (Stripe Connect Standard). Se ofrece según país y moneda de la tienda.

**Criterios de aceptación.**
- [ ] Firma inválida → 401 sin efectos (test).
- [ ] Webhook repetido no produce efectos dobles (test).
- [ ] Ninguna clave aparece en tablas, logs ni respuestas.
