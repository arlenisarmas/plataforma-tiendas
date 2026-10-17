# Desarrollo local

## Requisitos

- Node.js (versión de `.nvmrc`) y pnpm (versión de `packageManager` en `package.json`).
- **Docker no es obligatorio.** La base de datos real de Supabase se levanta en GitHub Actions
  (workflow *Supabase local*). Docker solo hace falta si querés correr Supabase en tu máquina.

## Pasos

1. `pnpm install`
2. `pnpm dev` → storefront en http://localhost:3000 y panel en http://localhost:3001
3. `pnpm lint && pnpm typecheck && pnpm test` antes de abrir un PR.

## Base de datos

| Necesito… | Sin Docker | Con Docker + Supabase CLI |
|---|---|---|
| Probar migraciones y reglas de seguridad | El CI corre los escenarios (`escenarios-sql`) en cada PR | `pnpm db:test` contra una base descartable |
| Probar migraciones + seed en Supabase real | El workflow **Supabase local** lo hace en cada PR que toque `supabase/` | `pnpm db:start` y `pnpm db:reset` |
| Regenerar los tipos (`packages/db/src/database.types.ts`) | Si cambian, el workflow falla y deja el artefacto **database-types**: descargarlo y reemplazar el archivo | `pnpm db:types` |

### Usuarios de ejemplo (seed)

Contraseña de ambos: `demo1234`

| Email | Tienda | Estado |
|---|---|---|
| `arle@ejemplo.com` | Che Peludos (`chepeludos`, ARS) | Publicada, dominio `chepeludos.localhost` |
| `hermano@ejemplo.com` | Carpintería del Sur (`carpinteria-del-sur`, CLP) | Borrador |

### Reglas

- Nunca edites una migración existente (ver `AGENTS.md` §4).
- `database.types.ts` es generado: no se edita a mano ni se formatea con Prettier.
- Staging se migra solo al integrar en `main` (workflow *Base de datos staging*), cuando estén
  cargados los secretos `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` y `SUPABASE_DB_PASSWORD`.

## Acceso solo por invitación (T-035)

- Nadie se registra solo: `/signup` muestra un aviso y las cuentas se crean al aceptar una invitación
  (`/join/<token>` para invitaciones de plataforma, `/invite/<token>` para ayudantes de una tienda).
- La cuenta se crea en el servidor con el email ya confirmado (el enlace llegó a ese correo), usando
  `SUPABASE_SERVICE_ROLE_KEY`, que el panel necesita en sus variables de entorno.
- En Supabase conviene **desactivar el registro abierto** para que tampoco se pueda crear una cuenta por la API:
  Authentication → Sign In / Providers → «Allow new users to sign up» = apagado. Las invitaciones siguen
  funcionando porque crean la cuenta con la clave de servidor.
- Una persona pausada desde la consola pierde acceso a sus tiendas (RLS) y al entrar ve «Tu acceso está pausado».
