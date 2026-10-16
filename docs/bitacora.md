# Bitácora del proyecto

> Memoria compartida de Arle, Claude (arquitecto) y Codex (desarrollador).
> Si empezás una conversación nueva, leé esto primero. Se actualiza al cerrar cada lote.

## 1. Qué estamos construyendo

Plataforma todo-en-uno (estilo Tiendanube/Shopify, pero más simple) para ~10 tiendas de familia
y amigos: Che Peludos (mascotas), carpintería y comercios en Argentina, Venezuela, Chile, España y
Estados Unidos. Personas de 20 a 60+ años, sin conocimientos técnicos.

- **Etapa 1 (en curso):** editor de páginas por bloques con variantes de diseño, productos, stock,
  usuarios y equipo, carrito, compra, pagos (Mercado Pago + manual), pedidos, emails.
- **Etapas siguientes:** imágenes con IA, edición de video simple, publicación programada en redes.

## 2. Cómo trabajamos

| Quién | Rol |
|---|---|
| Arle | Solo interviene para dinero, cuentas, claves o decisiones personales. Revisión conjunta al final |
| Claude | Arquitecto y revisor. Prepara lotes, revisa PRs, corrige cosas chicas, integra |
| Codex (local, Windows, sin Docker) | Desarrolla siguiendo `AGENTS.md` |

- **Lotes:** una rama `codex/lote-<n>`, un commit por tarea, un solo PR "Lote <n>: …", merge con rebase.
- **Revisión:** Claude revisa solo el diff del lote. Auditorías completas: después del Lote 3 y antes del lanzamiento.
- **Revisión automática:** tarea programada cada 2 h (minuto 18, hora de Buenos Aires) que revisa PRs, corrige, integra y avisa a Arle.
- **Probar gratis antes de comprar nada.**

## 3. Reglas de seguridad acordadas

- Tokens y claves **nunca** en el chat ni en capturas: solo GitHub Secrets o variables de Vercel/Supabase.
- Codex no crea cuentas, no paga, no carga secretos: si hace falta, etiqueta `necesita-a-arle`.
- Nada de modo "acceso total al sistema" para Codex.
- Service role nunca en el navegador; dinero en enteros; stock solo vía funciones SQL.

## 4. Infraestructura actual

| Pieza | Estado |
|---|---|
| Repo | github.com/arlenisarmas/plataforma-tiendas (público, pasar a privado) |
| CI | Escenarios SQL (58), apps (lint/tipos/tests/build), Supabase real (regenera tipos solo), staging |
| Supabase staging | Proyecto gratis en ca-central-1; migraciones automáticas al integrar en `main` vía pooler |
| Supabase producción | Más adelante, São Paulo (sa-east-1) |
| Vercel | Pendiente (gratis) para ver la plataforma online |

## 5. Avance

| Lote | Tareas | Estado |
|---|---|---|
| 1–3 | T-001 a T-020, T-026 (base, bloques, editor, productos, stock, tienda pública, asistente de alta) | ✅ Integrados (21/31) |
| 4 | T-021 Carrito, T-022 Pagos, T-023 Compra, T-024 Pedidos, T-025 Emails, T-027 Clientes y equipo, T-028 Publicar y ajustes, T-030 Seguridad y rendimiento, T-031 e2e | 🔨 En curso (sin credenciales reales: Mercado Pago y emails con dobles de prueba) |
| — | T-029 Dominios propios | ⏸ Necesita dominio y Vercel (Arle) |

## 6. Pendientes de Arle (cuando quiera)

- Hacer privado el repo y proteger `main`.
- Crear cuenta de Vercel (gratis) para ver la plataforma.
- Más adelante: credenciales de prueba de Mercado Pago, cuenta de Resend, dominio.

## 7. Para la auditoría de arquitectura

- Middleware del storefront consulta la base en cada request (agregar caché).
- `RenderStorePage` trae todas las imágenes y la página dos veces.
- Dos parsers de markdown (bloque rich-text y `core/sanitize`): unificar.
- `createProduct` y `createStoreAction` no son atómicos: pasar a RPC (`create_product`, `apply_store_template`).
- El token de vista previa lleva el JWT del usuario (cifrado): revisar.
- Links a categoría usan uuid: pasar a slug.
- Volver a sumar `@vitest/coverage-v8`.
