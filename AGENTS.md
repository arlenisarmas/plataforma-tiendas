# AGENTS.md — Reglas para agentes de desarrollo

Este archivo es obligatorio para cualquier agente que escriba código en este repositorio
(Codex u otros). Leelo completo antes de cada tarea. Si una tarea contradice este archivo,
**este archivo gana**: detenete y comentá en el issue.

## 1. Antes de empezar una tarea

1. Leé el issue completo, incluidos los criterios de aceptación y las dependencias.
2. Verificá que las dependencias del issue estén cerradas. Si no, no empieces: comentá
   `Bloqueado por #N` y pasá a otra tarea `estado:listo-para-codex`.
3. Leé los documentos de `docs/` que el issue referencia.
4. Cambiá la etiqueta del issue a `estado:en-progreso`.
5. Creá la rama del lote `codex/lote-<n>` desde `main` actualizado (una sola rama para todo el lote).

## 2. Alcance

- Hacé **solo** lo que pide la tarea. Nada de refactors, dependencias nuevas ni mejoras
  "de paso". Si ves algo mejorable, anotalo en la descripción del PR bajo "Observaciones".
- Tocá solo los archivos del área de la tarea. Si necesitás tocar otra área, preguntá en el issue.
- **Trabajo por lotes: un lote = una rama = un PR.** Cuando se te asigna un lote de tareas,
  hacelas todas en una sola rama `codex/lote-<n>` y abrí **un único PR** al terminar el lote.
- **Un commit por tarea** dentro del PR, con mensaje `T-<número>: <descripción>`, para que cada
  tarea se pueda revisar y, si hace falta, revertir por separado. No mezcles dos tareas en un commit.
- Hacé las tareas del lote en el orden indicado. Si una queda bloqueada (falta una cuenta,
  una clave o una decisión), saltéala, marcala en el issue y seguí con las demás.
- El límite de ~400 líneas cambiadas aplica **por tarea**, no por PR. **No cuentan**: tests,
  tipos generados, lockfiles (`pnpm-lock.yaml`), archivos generados por herramientas ni
  configuración inicial de herramientas. Las tareas de estructura (`area:infra` de la Ola 0)
  pueden superarlo.

## 3. Estándares de código

- TypeScript `strict`. Prohibido `any` (usá `unknown` + validación). Prohibido `@ts-ignore`.
- Validá con **Zod** todo dato que cruce un límite: formularios, Server Actions, webhooks, JSON de bloques.
- Server Components por defecto. `'use client'` solo cuando hay interactividad real.
- Mutaciones mediante **Server Actions** que: validan entrada con Zod, verifican permisos,
  usan el cliente de Supabase del usuario (RLS activo) salvo justificación documentada.
- **Dinero:** siempre `bigint`/entero en unidad mínima + código de moneda. Formateo solo con
  helpers de `packages/core/money`. Nunca `parseFloat` para dinero.
- **Stock:** nunca actualices `inventory` directo. Usá las funciones SQL `reserve_stock`,
  `commit_reservation`, `release_reservation`, `adjust_stock`.
- **Precios y totales:** el servidor los recalcula siempre. Nunca confíes en valores del cliente.
- Nombres: código en inglés; textos de interfaz en español vía `packages/i18n` (nunca hardcodeados).
- Archivos: `kebab-case.ts`; componentes `PascalCase` exportados desde `kebab-case.tsx`.
- Imports entre paquetes solo por su nombre público (`@plataforma/core`), nunca rutas relativas profundas.
- Respetá las reglas de dependencia de `docs/01-arquitectura.md §3`.

## 4. Base de datos (contrato fijo)

- El esquema en `supabase/migrations/` es un **contrato**. Las tareas comunes **no** lo modifican.
- Solo las tareas con etiqueta `area:db` pueden crear migraciones. Nunca edites una migración
  existente: creá una nueva con timestamp `YYYYMMDDHHMMSS_descripcion.sql`.
- Toda tabla nueva: `store_id` (si es de negocio), RLS habilitado, políticas, índices en FKs,
  trigger `updated_at`, y tests pgTAP en `supabase/tests/`.
- Después de cambiar el esquema, regenerá tipos: `pnpm db:types` y commiteá el resultado.

## 5. Seguridad (no negociable)

- Nunca uses la service role key en código que llegue al navegador.
- Nunca escribas secretos, tokens o claves en el código, en tests, en logs ni en el PR.
  Usá variables de entorno documentadas en `.env.example`.
- Nunca deshabilites RLS ni crees políticas `using (true)` en tablas de negocio.
- Nunca renderices HTML provisto por usuarios (`dangerouslySetInnerHTML` prohibido salvo
  contenido sanitizado por `packages/core/sanitize`, con revisión explícita).
- Webhooks: verificar firma e idempotencia siempre.
- Archivos subidos: validar tipo MIME real y tamaño en servidor.

## 6. Experiencia de usuario (obligatorio)

Leé `docs/05-experiencia-de-usuario.md`. Resumen de lo que se revisa en cada PR de interfaz:

- Textos en lenguaje simple, sin jerga técnica. Errores amables que dicen cómo resolver.
- Una acción principal por pantalla, botón grande y visible.
- Objetivos táctiles ≥ 44×44 px, texto base ≥ 16 px, contraste WCAG AA.
- Funciona en celular (360 px de ancho) antes que en escritorio.
- Estados de carga, vacío y error diseñados (nunca pantalla en blanco).
- Acciones destructivas con confirmación; cambios de contenido con "Deshacer" cuando aplique.
- Accesible por teclado y lector de pantalla (labels, roles, foco visible).

## 7. Tests

- `packages/core`: tests unitarios para toda función (Vitest). Objetivo ≥ 90% de cobertura.
- Server Actions y conectores de pago: tests unitarios con dependencias simuladas.
- Tablas y funciones SQL: tests pgTAP, incluidos casos de **acceso denegado** entre tiendas.
- Flujos críticos (crear tienda, cargar producto, comprar, confirmar pago): e2e con Playwright.
- No se aceptan PRs con tests saltados (`.skip`) sin explicación aprobada.

## 8. Antes de abrir el PR

Corré localmente y asegurate de que todo pase:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm db:test   # si tocaste SQL
```

## 9. Pull Request

- Título: `Lote <n>: T-<a>, T-<b>, ...` (o `T-<número>: <descripción>` si el lote tiene una sola tarea).
- Descripción con la plantilla del repo, **con una sección por tarea**: qué se hizo, cómo probarlo,
  capturas (si hay UI, en móvil y escritorio), criterios de aceptación marcados, observaciones.
- Incluí un `Closes #<issue>` por cada tarea completada del lote.
- Cambiá la etiqueta de cada issue del lote a `estado:en-revision`.

## 10. Revisión del arquitecto (Claude)

- Claude revisa cada PR cuando el lote está completo. Sus pedidos de cambio son **instrucciones**:
  aplicalos en la misma rama del lote, con un commit `T-<número>: corrección ...` por tarea
  corregida, y respondé cada comentario con lo que hiciste.
- Correcciones chicas y claras las puede hacer Claude directamente en la rama, para ahorrar un ciclo.
  Antes de seguir trabajando en una rama, hacé siempre `git pull`.
- Si no estás de acuerdo con un pedido, explicá por qué en el comentario en lugar de ignorarlo.
- Cuando Claude aprueba y CI está en verde, el PR se integra (rebase merge: queda un commit por tarea en `main`).
- Si el issue tiene `estado:cambios-pedidos`, esa tarea tiene prioridad sobre tareas nuevas.

## 11. Cuándo detenerse y pedir ayuda

Agregá la etiqueta `necesita-a-arle` y explicá en el issue, sin seguir adivinando, cuando:

- Se necesita crear una cuenta, iniciar sesión, pagar algo o cargar una clave/secreto.
- Hay una decisión de producto que no está en la documentación.

Agregá `necesita-arquitecto` cuando:

- La tarea requiere cambiar el esquema, un contrato de paquete o este archivo.
- La documentación es ambigua o contradictoria.
