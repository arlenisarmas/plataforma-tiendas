# 05 · Experiencia de usuario

> Obligatorio para toda tarea con interfaz. El arquitecto rechaza PRs que no lo cumplan.

## 1. Para quién diseñamos

| Persona | Cómo es | Qué necesita |
|---|---|---|
| **Marta, 58** — vende muebles de su marido | Usa WhatsApp y Facebook. Se asusta si algo "se rompe". Lee despacio | Una cosa por pantalla, palabras normales, confirmación de que salió bien, poder volver atrás |
| **Lucas, 24** — vende ropa | Rápido, visual, impaciente. Usa todo desde el celular | Ir directo, ver el resultado al instante, atajos, nada de pasos innecesarios |

**Regla de oro:** si Marta puede hacerlo sola la primera vez, Lucas lo hace volando.
Diseñamos para Marta y agregamos atajos para Lucas; nunca al revés.

## 2. Diez principios

1. **Una tarea por pantalla.** Una acción principal, grande y obvia. Las secundarias, discretas.
2. **Hablar como la gente.** "Tus productos", "Cómo te pagan", "Tu tienda en internet".
   Prohibido: dashboard, SKU, checkout, slug, webhook, deploy, CMS (ver glosario §6).
3. **Ver antes de decidir.** Vista previa en vivo de cada cambio visual.
4. **Nada es irreversible sin aviso.** Deshacer siempre que se pueda; confirmación explícita
   ("Sí, borrar el producto") cuando no.
5. **Guiar sin trabar.** Primer uso guiado paso a paso; después, libertad. La persona elige
   "Guiame" o "Prefiero explorar" (se guarda en `profiles.guided`).
6. **Modo simple por defecto.** Solo lo esencial. El modo avanzado agrega opciones (`profiles.ui_mode`).
7. **Celular primero.** Todo se diseña a 360 px y luego se amplía.
8. **Errores que ayudan.** Qué pasó + cómo resolverlo, en una línea. Nunca códigos técnicos.
9. **Confirmar los logros.** "¡Listo! Tu producto ya está en la tienda" + qué hacer después.
10. **Accesible para todos.** Letra grande opcional (`profiles.text_scale` 100–150%), contraste AA, teclado.

## 3. Reglas medibles (se revisan en cada PR)

| Regla | Valor |
|---|---|
| Texto base | ≥ 16 px (escalable hasta 150%) |
| Objetivos táctiles | ≥ 44 × 44 px, separados ≥ 8 px |
| Contraste | WCAG AA (4,5:1 texto normal, 3:1 grande) |
| Ancho mínimo soportado | 360 px sin scroll horizontal |
| Campos por paso en asistentes | ≤ 3 |
| Acciones primarias por pantalla | 1 |
| Tiempo a "Guardado ✓" | < 2 s |
| Carga del panel (LCP) | < 2,5 s en 4G |
| Íconos | Siempre con texto al lado (nunca solo ícono) en acciones principales |

## 4. Patrones obligatorios

- **Estados:** cargando (esqueleto, no spinner solo), vacío (ilustración + qué hacer + botón),
  error (mensaje amable + reintentar), éxito (confirmación visible).
- **Formularios:** etiqueta arriba del campo, ejemplo en el placeholder, validación al salir del
  campo, error debajo del campo en lenguaje simple, botón deshabilitado nunca sin explicar por qué.
- **Ayuda contextual:** ícono "?" con texto breve; en pantallas clave, video de ≤ 30 s.
- **Lista "Tu tienda al 100%"** en el inicio del panel: logo, primer producto, cobros,
  envíos, página de inicio, publicar. Cada ítem lleva a donde se hace.
- **Navegación del panel:** máximo 6 secciones principales:
  Inicio · Productos · Pedidos · Mi página · Clientes · Ajustes.
- **Búsqueda "¿Qué querés hacer?"** (atajo para usuarios rápidos): "agregar producto",
  "cambiar colores", "ver pedidos de hoy".

## 5. Flujos críticos (deben poder hacerse sin ayuda)

| Flujo | Objetivo |
|---|---|
| Crear la tienda desde cero hasta verla en internet | ≤ 10 min |
| Cargar un producto con foto, precio y stock | ≤ 3 min la primera vez |
| Cambiar la foto y el título de la portada | ≤ 1 min |
| Ver un pedido nuevo y marcarlo como enviado | ≤ 1 min |
| Confirmar un pago por transferencia | ≤ 1 min |
| Comprar como cliente desde el celular | ≤ 2 min |

Antes de cerrar la Etapa 1, cada flujo se prueba con al menos 2 personas reales de distinto perfil.

## 6. Glosario (usar siempre la columna derecha)

| No decir | Decir |
|---|---|
| Dashboard | Inicio |
| Catálogo / SKU | Productos / Código (opcional) |
| Variantes | Opciones (talle, color…) |
| Inventario | Stock / Unidades disponibles |
| Checkout | Pagar / Finalizar compra |
| Pasarela de pago | Cómo te pagan |
| Slug / URL | Dirección de la página |
| Dominio | Dirección web de tu tienda |
| Publicar / Deploy | Publicar (con "Tus cambios ya están en tu tienda") |
| Borrador | Sin publicar |
| Bloque / Componente | Sección |
| Usuario / Rol | Persona / Permiso (Dueño, Ayudante) |
| Error 4xx / 5xx | Algo salió mal (+ qué hacer) |

## 7. Tono

Cercano, claro y alentador. Tuteo (o voseo en la variante es-AR si se configura).
Frases cortas. Sin exclamaciones de más. Sin culpar a la persona ("Te faltó el precio",
no "Error: precio inválido").
