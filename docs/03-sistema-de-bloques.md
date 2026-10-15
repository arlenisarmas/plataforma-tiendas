# 03 · Sistema de bloques (motor de páginas)

> Es el corazón del creador de páginas. Equivale a FlexCards + OmniScript en Vlocity:
> **un motor fijo que renderiza configuración**. Ninguna tienda tiene código propio.

## 1. Conceptos

| Concepto | Qué es | Dónde vive |
|---|---|---|
| **Bloque** | Sección reutilizable de una página (portada, grilla de productos, preguntas frecuentes) | `packages/blocks/src/<tipo>/` |
| **Página** | Lista ordenada de instancias de bloques (JSON) | `pages.draft_blocks` y `page_versions.blocks` |
| **Tema** | Colores, tipografías y estilo global de la tienda | `stores.theme_draft` / `theme_published` |
| **Diseño base (layout)** | Encabezado, menú y pie, comunes a todas las páginas, configurados por el tema | `packages/blocks/src/layout/` |
| **Plantilla de rubro** | Tema + páginas prearmadas para un tipo de negocio | `packages/blocks/src/templates/` |

## 2. Formato de una página

```json
[
  {
    "id": "b_7f3k2",
    "type": "hero",
    "version": 1,
    "variant": "split",
    "props": {
      "title": "Todo para tu mascota",
      "subtitle": "Envíos en el día en CABA",
      "image": { "assetId": "6c1e…" },
      "cta": { "label": "Ver productos", "link": { "kind": "collection", "categoryId": null } },
      "align": "center"
    }
  },
  { "id": "b_9a1m0", "type": "featured-products", "version": 1, "variant": "carousel", "props": { "title": "Lo más vendido", "limit": 8 } }
]
```

Reglas: `id` único dentro de la página (no cambia al mover el bloque); `type` del registro;
`version` del esquema del bloque; `variant` = diseño elegido (si falta o no existe, se usa
`defaultVariant`); `props` validadas con el esquema Zod del bloque.
Máximo 40 bloques por página y 200 KB por página.

## 3. Contrato de un bloque

```ts
// packages/blocks/src/types.ts
import type { z } from 'zod';

export interface BlockDefinition<P extends z.ZodTypeAny = z.ZodTypeAny> {
  type: string;                 // 'hero', 'featured-products', ...
  version: number;              // sube cuando cambia el esquema de props
  category: 'portada' | 'productos' | 'contenido' | 'confianza' | 'contacto';
  icon: string;                 // ícono de lucide-react
  i18n: { name: string; description: string };   // claves de packages/i18n
  schema: P;                    // validación de props (fuente de verdad)
  defaults: z.infer<P>;         // props iniciales al agregar el bloque
  fields: FieldSpec[];          // cómo se edita (genera el formulario del editor)
  /** Diseños alternativos del MISMO contenido. Mínimo 2 por bloque (salvo spacer). */
  variants: BlockVariant[];
  defaultVariant: string;
  migrate?: (oldProps: unknown, fromVersion: number) => z.infer<P>;
  /** Datos que el bloque necesita del servidor (productos, categorías). */
  loader?: (props: z.infer<P>, ctx: StoreContext) => Promise<unknown>;
  Component: React.ComponentType<{
    props: z.infer<P>; variant: string; data: unknown; theme: Theme;
  }>;
}

export type BlockVariant = {
  id: string;                   // 'split', 'background', 'minimal', 'grid', 'carousel'…
  i18n: { name: string; description?: string };
  thumbnail: string;            // miniatura para el selector "Cambiar diseño"
};

export type FieldSpec = {
  name: string;                 // ruta en props: 'title', 'cta.label', 'items'
  kind:
    | 'text' | 'textarea' | 'number' | 'toggle' | 'select'
    | 'image' | 'color-token' | 'link'
    | 'product-picker' | 'category-picker'
    | 'list';                   // ítems repetibles (con `itemFields` y `maxItems`)
  i18n: { label: string; help?: string; placeholder?: string };
  simple: boolean;              // visible en modo simple (si false, solo en avanzado)
  options?: { value: string; i18nLabel: string }[];
  itemFields?: FieldSpec[];
  maxItems?: number;
  /** Si se indica, el campo solo aparece en esas variantes (ej. 'image' en 'split'). */
  onlyInVariants?: string[];
};
```

**Reglas del contrato**

1. Las props son datos, nunca HTML. No hay campo de HTML libre ni de código.
2. Los colores se eligen entre *tokens* del tema (`primary`, `accent`…), no hex libres:
   garantiza contraste y coherencia aunque la persona no sepa de diseño.
3. Todo texto visible del editor sale de `packages/i18n`.
4. Cambiar el esquema de props exige subir `version` y escribir `migrate`. Las páginas
   guardadas con versiones viejas se migran al leerlas (en memoria) y al publicarse.
5. Un bloque desconocido o con props inválidas **no rompe la página**: en el storefront se
   omite (y se registra el error); en el editor se muestra una tarjeta "Este bloque necesita
   revisión" con opción de restaurar valores por defecto.
6. Los `Component` son Server Components por defecto; la interactividad va en hijos
   `'use client'` mínimos (ej. carrusel, acordeón).
7. **Variantes = mismo contenido, distinto diseño.** Todas las variantes de un bloque comparten
   el mismo esquema de `props`: cambiar de diseño **nunca borra** lo que la persona cargó.
   Un campo que no aplica a una variante se oculta en el editor, pero se conserva.
8. Cada variante debe verse bien a 360 px y con las 5 paletas del tema (test visual básico).

## 4. Bloques de la Etapa 1

| Tipo | Para qué | Variantes (diseños) | Datos del servidor |
|---|---|---|---|
| `announcement-bar` | Franja superior: "Envío gratis desde $50.000" | fija · deslizante · con botón | — |
| `hero` | Portada con imagen, título y botón | imagen de fondo · dividida (mitad imagen) · minimalista (solo texto) · collage | — |
| `featured-products` | Productos destacados o más nuevos | grilla · carrusel · lista destacada | productos |
| `category-grid` | Categorías con imagen | tarjetas · círculos · lista con imagen | categorías |
| `product-grid` | Productos de una categoría | grilla 2/3/4 columnas · lista | productos |
| `image-with-text` | Imagen + texto lado a lado | imagen izquierda · imagen derecha · texto sobre imagen | — |
| `rich-text` | Título y párrafos (texto con formato básico seguro) | centrado · alineado a la izquierda · destacado con fondo | — |
| `gallery` | Galería de fotos | grilla · mosaico · carrusel | — |
| `testimonials` | Opiniones de clientes (cargadas por la tienda) | tarjetas · carrusel · cita grande | — |
| `faq` | Preguntas frecuentes en acordeón | acordeón · dos columnas | — |
| `contact` | WhatsApp, teléfono, email, dirección, horarios, redes | tarjetas · lista simple · con mapa | contacto de la tienda |
| `spacer` | Separación visual | pequeño · mediano · grande · con línea | — |

Las páginas de producto, categoría, carrito, checkout y "mi pedido" son **plantillas fijas
del sistema** (configurables solo por el tema), no páginas de bloques: así nadie puede
romper el flujo de compra.

## 5. Tema

```ts
// Validado con Zod en packages/blocks/src/theme.ts
type Theme = {
  palette: 'calido' | 'fresco' | 'natural' | 'elegante' | 'vibrante' | 'personalizada';
  colors: { primary: string; accent: string; background: string; surface: string; text: string };
  fonts: 'moderna' | 'clasica' | 'amigable' | 'robusta';   // pares tipográficos curados
  radius: 'recto' | 'suave' | 'redondo';
  buttonStyle: 'solido' | 'contorno';
  header: { layout: 'centrado' | 'izquierda'; showSearch: boolean; announcementBlockId?: string };
  footer: { showSocial: boolean; showPaymentIcons: boolean; text?: string };
};
```

- Paletas curadas con contraste AA verificado. En `personalizada`, el editor valida el
  contraste y sugiere un ajuste si no alcanza.
- Los tokens se emiten como variables CSS en el layout de la tienda (`--color-primary`, …).

## 6. Editor (apps/admin)

```
┌────────────────────────────────────────────────────────────────────┐
│  ← Mis páginas   Inicio          [Celular | Compu]   Deshacer  [Publicar] │
├──────────────┬──────────────────────────────────────┬──────────────┤
│ Secciones    │                                      │ Editar       │
│ ┌──────────┐ │      VISTA PREVIA EN VIVO            │ "Portada"    │
│ │ Portada  │ │      (iframe del storefront          │              │
│ │ Destacad.│ │       en modo borrador)              │ Título  [__] │
│ │ + Agregar│ │                                      │ Imagen  [▣]  │
│ └──────────┘ │                                      │ Botón   [__] │
└──────────────┴──────────────────────────────────────┴──────────────┘
```

- **Celular primero:** en pantallas chicas, las tres columnas se convierten en pasos
  (lista → editar → ver) con un botón fijo "Ver cómo queda".
- **Agregar sección:** catálogo visual con miniaturas, agrupado por `category`,
  con nombres en lenguaje simple ("Fotos de tus productos", no "Grid").
- **Formulario generado** desde `fields`; en modo simple solo los campos `simple: true`.
- **"Cambiar diseño"** en cada sección: muestra las variantes con miniatura y vista previa en
  vivo al pasar o tocar; elegir una cambia solo `variant`, el contenido se mantiene. Es lo
  primero que se ofrece cuando a alguien "no le gusta cómo se ve".
- **Autoguardado** del borrador (debounce 1,5 s) con indicador "Guardado ✓".
- **Deshacer/Rehacer** en memoria (historial de la sesión, 50 pasos).
- **Publicar** llama a `publish_page`; **Historial** lista versiones y permite restaurar.
- **Vista previa:** el storefront acepta un token de previsualización firmado de corta
  duración para renderizar `draft_blocks` y `theme_draft`.

## 7. Renderizado en el storefront

1. Leer la página publicada desde `storefront.pages` (cacheada con etiqueta `page:<id>`).
2. Por cada bloque: buscar definición → `migrate` si hace falta → `schema.safeParse`.
3. Ejecutar los `loader` en paralelo (`Promise.all`) con la caché de la tienda.
4. Renderizar en orden. Las imágenes usan `next/image` con tamaños responsivos.

## 8. Plantillas de rubro (Etapa 1)

`mascotas`, `carpinteria-muebles`, `ropa-accesorios`, `comida-casera`, `general`.
Cada una define: tema, página de inicio, "Sobre nosotros", "Contacto", "Preguntas frecuentes"
y textos de ejemplo editables. El asistente de creación pregunta el rubro y aplica la plantilla.

## 9. Cómo agregar un bloque nuevo (checklist)

1. Carpeta `packages/blocks/src/<tipo>/` con `schema.ts`, `definition.ts`, `component.tsx`, `<tipo>.test.ts`.
2. Registrar en `packages/blocks/src/registry.ts`.
3. Textos en `packages/i18n/messages/es-419/blocks.json` (y `en`).
4. Miniatura del catálogo en `packages/blocks/assets/<tipo>.webp`.
5. Tests: esquema acepta `defaults`, rechaza props inválidas, el componente renderiza
   con `defaults` y en 360 px de ancho sin desbordes.
