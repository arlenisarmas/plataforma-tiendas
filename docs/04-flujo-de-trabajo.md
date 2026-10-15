# 04 · Flujo de trabajo: Claude (arquitecto) + Codex (desarrollo)

## 1. Roles y autoridad

| Rol | Quién | Autoridad |
|---|---|---|
| Dueña del producto | **Arle** | Decide prioridades y producto. Crea cuentas, paga, carga secretos. Revisión final antes del lanzamiento |
| Arquitecto y revisor | **Claude** | Define arquitectura, contratos y tareas. Revisa cada PR. Sus pedidos de cambio son instrucciones para Codex. Integra los PRs aprobados |
| Desarrollo | **Codex** (uno o varios agentes en paralelo) | Implementa tareas siguiendo `AGENTS.md`. Obedece las revisiones de Claude |
| Control automático | **GitHub Actions** | Bloquea cualquier PR que no pase lint, tipos, tests, build y escenarios SQL |

Decisión de Arle (15/10/2026): **todo automatizado durante el desarrollo**. Ella interviene
solo cuando hace falta una cuenta, un pago, una clave o una decisión de producto, y hace la
revisión conjunta al final, antes de lanzar.

## 2. Sincronización: GitHub es la oficina compartida

Codex y Claude no se hablan directamente. Todo se coordina en el repositorio:

| Qué | Dónde |
|---|---|
| Reglas | `AGENTS.md` |
| Diseño y contratos | `docs/`, `supabase/migrations/` |
| Tareas | GitHub Issues (generados desde `tareas/backlog-etapa-1.md`) |
| Trabajo | Ramas `codex/T-xxx-...` y Pull Requests |
| Revisión | Comentarios de revisión de Claude en cada PR |
| Avisos a Arle | Etiqueta `necesita-a-arle` (+ notificación al celular) |

## 3. Etiquetas

| Etiqueta | Significado | La pone |
|---|---|---|
| `estado:listo-para-codex` | Especificada, dependencias resueltas, se puede tomar | Claude |
| `estado:en-progreso` | Un agente la está desarrollando | Codex |
| `estado:en-revision` | PR abierto, esperando revisión | Codex |
| `estado:cambios-pedidos` | Claude pidió cambios; tiene prioridad | Claude |
| `estado:aprobado` | Revisada y aprobada; se integra cuando CI está verde | Claude |
| `estado:bloqueada` | Espera otra tarea o algo externo | Cualquiera |
| `necesita-a-arle` | Requiere cuenta, pago, clave o decisión | Cualquiera |
| `necesita-arquitecto` | Duda de diseño o cambio de contrato | Codex |
| `area:*` | infra, db, core, ui, i18n, blocks, admin, storefront, payments, emails, qa | Claude |
| `ola:0`…`ola:5` | Grupo de tareas que pueden ir en paralelo | Claude |

## 4. Ciclo de una tarea

```
 Claude                     Codex                       GitHub Actions          Claude
 ──────                     ─────                       ──────────────          ──────
 Issue + spec ──▶ toma tarea ──▶ rama + código + tests ──▶ PR ──▶ CI ──▶ revisión
 listo-para-codex   en-progreso                       en-revision  │        │
                                                                   │   ┌────┴─────┐
                                                                   │   ▼          ▼
                                                                   │ aprobado  cambios-pedidos
                                                                   │   │          │
                                                                   │ squash      Codex corrige
                                                                   │ merge       en la misma rama
                                                                   ▼   │          │
                                                              (rojo = no se    └─▶ vuelve a
                                                               integra nunca)       revisión
```

**Cómo se dispara Codex:** si la integración de Codex con GitHub está activa, Claude lo
menciona en el issue o en el PR (`@codex`) con la instrucción. Si no, Arle pega una vez el
link del issue en Codex; a partir de ahí Codex sigue el ciclo de este documento.

**Ritmo automático:** una tarea programada de Claude corre periódicamente y:
1. Revisa los PRs en `estado:en-revision`.
2. Aprueba e integra, o pide cambios.
3. Marca `estado:listo-para-codex` las tareas cuyas dependencias ya se integraron.
4. Avisa a Arle solo si algo tiene `necesita-a-arle`.

## 5. Política de integración

| Situación | Regla |
|---|---|
| Durante el desarrollo (sin datos reales) | Se integra con **CI verde + aprobación de Claude**. Sin intervención de Arle |
| Migraciones de base de datos | Solo tareas `area:db`, de a una por vez (nunca dos en paralelo). Se aplican a staging al integrar |
| Producción y lanzamiento | Revisión conjunta Arle + Claude antes de crear el entorno productivo y de cada migración a producción |
| Rama `main` | Protegida: no se empuja directo; exige los checks de CI. Merge tipo squash |

> Nota técnica: GitHub no permite aprobar un PR propio. Como Codex abre PRs con la cuenta
> de Arle, la protección de `main` exige **checks de CI**, no aprobaciones formales; la
> aprobación de Claude queda como revisión comentada + etiqueta `estado:aprobado`.

## 6. Trabajo en paralelo sin choques

- Las tareas se agrupan en **olas**. Dentro de una ola, las tareas tocan áreas distintas.
- Contratos fijos (no se tocan en tareas comunes): esquema SQL, `packages/*/src/types.ts`,
  `AGENTS.md`, `docs/`.
- Si dos PRs chocan, se integra el primero aprobado; el segundo hace *rebase* sobre `main`.
- Máximo recomendado: 4 agentes de Codex en simultáneo.

## 7. Checklist de revisión de Claude

1. **Alcance:** hace lo que pide la tarea y nada más. Criterios de aceptación cumplidos.
2. **Seguridad:** RLS respetado, sin service role en el cliente, Zod en los bordes,
   sin secretos, precios recalculados en servidor, sin HTML de usuario.
3. **Contratos:** respeta límites entre paquetes y tipos compartidos.
4. **Datos:** dinero en enteros, stock solo vía funciones, errores mapeados a códigos.
5. **UX:** cumple `05-experiencia-de-usuario.md` (textos, tamaños, estados, celular).
6. **Tests:** cubren lo nuevo, incluidos casos negativos. Nada saltado.
7. **Calidad:** legible, sin duplicación, nombres claros, sin código muerto.
8. **Rendimiento:** Server Components por defecto, sin cargas innecesarias en el cliente.

## 8. Definición de "terminado"

Una tarea está terminada cuando: el PR está integrado en `main`, CI en verde, criterios de
aceptación tildados, documentación actualizada si cambió algo visible, y el issue cerrado.

## 9. Cuándo se necesita a Arle

| Momento | Qué | Para qué tareas |
|---|---|---|
| **Ahora** | Crear repo privado en GitHub, conectar Codex y dar acceso a Claude | Todas |
| Ola 0 | Crear proyecto Supabase *staging* (plan gratis) y cargar sus claves como secretos del repo | T-002 en adelante |
| Ola 0 | Crear cuenta Vercel (gratis) y conectar el repo (dos proyectos: admin y storefront) | Previews de PRs |
| Ola 4 | Crear aplicación de desarrollador en Mercado Pago y cargar credenciales de prueba | T-022 |
| Ola 4 | Crear cuenta Resend (gratis) y verificar un dominio de envío | T-025 |
| Ola 5 | Comprar el dominio de la plataforma; token de API de Vercel | T-029 |
| Lanzamiento | Pasar Supabase y Vercel a planes pagos, proyecto de producción, revisión final | — |

Claude prepara las instrucciones paso a paso de cada uno cuando llegue el momento.
**Nunca** se comparten contraseñas ni claves en el chat ni en issues: se cargan como
*secrets* de GitHub o variables de entorno de Vercel/Supabase.
