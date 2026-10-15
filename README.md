# Plataforma de Tiendas

Plataforma todo-en-uno para que pequeños negocios creen y administren su tienda online
sin conocimientos técnicos: páginas, productos, stock, cobros, pedidos y, más adelante,
estudio creativo con IA y publicación en redes.

**Principio rector:** si una persona de 60 años puede usarla sola la primera vez,
cualquier persona puede. La simplicidad no es opcional: es el producto.

## Estado

Etapa 1 — **Motor de tiendas y creador de páginas** (en construcción).

| Etapa | Alcance |
|---|---|
| 1 | Multi-tienda, creador de páginas por bloques, productos, stock, carrito, checkout (Mercado Pago + pago manual), pedidos, clientes, dominios, mails, panel simple |
| 2 | Pulido de UX, ayuda guiada, modo simple/avanzado, pruebas con usuarios reales |
| 3 | Estudio creativo: fotos, banners y textos con IA |
| 4 | Videos con plantillas + publicación programada en redes |
| 5 | Apertura al público: planes, créditos, Stripe/PayPal |

## Documentación

| Documento | Contenido |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Reglas obligatorias para agentes de desarrollo (Codex y otros) |
| [`docs/01-arquitectura.md`](docs/01-arquitectura.md) | Visión técnica, stack, módulos, decisiones |
| [`docs/02-modelo-de-datos.md`](docs/02-modelo-de-datos.md) | Entidades, relaciones y seguridad (RLS) |
| [`docs/03-sistema-de-bloques.md`](docs/03-sistema-de-bloques.md) | Motor de páginas y contrato de bloques |
| [`docs/04-flujo-de-trabajo.md`](docs/04-flujo-de-trabajo.md) | Cómo colaboran Claude (arquitecto) y Codex (desarrollo) |
| [`docs/05-experiencia-de-usuario.md`](docs/05-experiencia-de-usuario.md) | Principios de UX obligatorios |
| [`tareas/backlog-etapa-1.md`](tareas/backlog-etapa-1.md) | Tareas de la Etapa 1 en orden y con dependencias |
| [`supabase/migrations/`](supabase/migrations/) | Esquema de base de datos (contrato fijo) |

## Stack

Next.js (App Router) · TypeScript estricto · Tailwind CSS + shadcn/ui · Supabase
(Postgres, Auth, Storage, RLS) · Vercel · Mercado Pago · Turborepo + pnpm ·
Vitest · Playwright · next-intl · Resend.

## Roles del equipo

- **Arle** — dueña del producto. Decide prioridades, gestiona cuentas, pagos y claves.
- **Claude** — arquitecto y revisor. Define diseño, contratos y tareas; revisa cada PR.
- **Codex** — desarrollo. Implementa tareas en paralelo siguiendo `AGENTS.md`.
