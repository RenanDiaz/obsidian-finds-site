# SPEC — Landing de Obsidian Finds

Estado: **implementado** (21-oct-2026). Los resultados de la verificación están en la sección 10.

Sitio de marca de una sola página para **obsidian-finds.com** (es-PA). Astro estático, cero JS en el cliente, desplegado como Worker de Cloudflare con static assets. La venta ocurre en Cuanto; el sitio solo presenta la marca y lleva a Cuanto o a Instagram.

---

## 1. Decisiones técnicas

| Tema | Decisión | Por qué |
|---|---|---|
| Framework | **Astro 7.4.x** (estable actual, 7.4.1 del 19-oct-2026), `output: 'static'`, sin adapter | El HTML sale completo del build y Astro no envía JS si ningún componente usa `client:*` |
| Deploy | **Wrangler 4.x** (4.151 actual), Worker con `assets` apuntando a `./dist` | Lo pide la tarea y es lo que recomienda la guía de Astro para sitios estáticos |
| JS en el cliente | **0 KB**. Sin islas, sin View Transitions, sin lightbox | El crawler de Pomelli no ejecuta JS. No hay interactividad que lo justifique |
| CSS | Un solo `global.css` con tokens en `:root` + estilos con scope por componente. `build.inlineStylesheets: 'always'` | Elimina la petición de CSS que bloquea el render (ayuda a Lighthouse) y deja la paleta visible en el HTML para Pomelli |
| HTML | `compressHTML: true` | En Astro 7 el valor por defecto pasó a `'jsx'`, que puede comerse espacios entre elementos inline (p. ej. "David, Chiriquí · Envíos") |
| Imágenes | `astro:assets` `<Picture>` con `formats={['avif','webp']}`, `quality={50}` y la imagen de respaldo en **JPG** | AVIF/WebP para el navegador; el `<img src>` de respaldo queda en JPG por si un crawler no lee AVIF |
| Logo | SVG importado como componente de Astro (`import Cristal from '…svg'`), en línea en el HTML, `fill="currentColor"` | Toma el color del texto (`--hueso`) y no requiere una petición extra |
| Fuentes | **`@font-face` propios apuntando a los woff2 de `@fontsource-variable/oswald` e `/inter`** (subset `latin`, que incluye á é í ó ú ñ ¿ ¡), `preload` de Oswald y fallbacks de Arial con métricas ajustadas. *Cambio en la implementación:* la Fonts API de Astro renombraba las familias a `Oswald-bb1d…`, así que apliqué la alternativa prevista | Self-hosted, sin Google Fonts. Las métricas de fallback evitan CLS. Pomelli lee `font-family: Oswald` / `Inter` |
| Sitemap | `@astrojs/sitemap` 3.7.x, `site: 'https://obsidian-finds.com'`, con `/404` excluido | |
| Procesamiento de insumos | Un script `scripts/process-assets.mjs` (con sharp, que ya viene con Astro, y svgo 4) que lee `_input/` y escribe los resultados al repo. Se corre una vez a mano con `npm run assets`; los resultados se versionan | `_input/` está en `.gitignore`, así que el build no puede depender de él, pero el proceso queda reproducible |
| Caché | `public/_headers` con `Cache-Control: public, max-age=31536000, immutable` para `/_astro/*` | Los archivos de `/_astro/` tienen hash en el nombre |
| Links externos | Abren en la misma pestaña, sin `target="_blank"` | Funciona mejor en móvil y no hace falta `rel` |

### Estructura de archivos

```
astro.config.mjs
wrangler.jsonc
package.json            # dev, build, preview, deploy, assets
README.md
scripts/process-assets.mjs
public/
  favicon.svg  favicon-32.png  apple-touch-icon.png (180)  icon-192.png  icon-512.png
  site.webmanifest  og.jpg  robots.txt  _headers
src/
  config/site.ts        # nombre, URLs, tagline, ubicación, whatsapp?: string
  data/lookbook.ts      # imports de fotos + alt + leyenda, en orden
  assets/fotos/*.jpg
  assets/logo/logo-obsidian-finds.svg  logo-cristal.svg
  styles/global.css     # tokens, reset, @font-face/variables de fuente, utilidades
  layouts/Base.astro    # <head>: SEO, OG, Twitter, JSON-LD, iconos, fuentes
  components/
    Hero.astro  QueEs.astro  Lookbook.astro  ComoComprar.astro  Footer.astro
    Button.astro        # variantes primary (neón) / secondary (borde hueso)
    StoreJsonLd.astro
  pages/index.astro  pages/404.astro
```

### `src/config/site.ts`

```ts
export const site = {
  name: 'Obsidian Finds',
  url: 'https://obsidian-finds.com',
  tagline: 'Dark Style, Tropical Heat',
  subtitle: 'Moda alternativa para espíritus indomables',
  location: { city: 'David', region: 'Chiriquí', country: 'PA', label: 'David, Chiriquí' },
  shipping: 'Envíos a todo Panamá',
  cuanto: 'https://cuanto.app/Ob.finds',
  instagram: 'https://www.instagram.com/obsidian.finds',
  instagramHandle: '@obsidian.finds',
  instagramDM: 'https://ig.me/m/obsidian.finds',
  whatsapp: undefined as string | undefined, // si se define (URL wa.me), aparece el botón en "Cómo comprar" y en el footer
};
```

Ojo: si algún día se define `whatsapp`, el número va a quedar en el HTML y eso choca con el criterio "sin números de teléfono". Lo dejo anotado en un comentario del archivo.

---

## 2. Insumos: clasificación y procesamiento

Fotos revisadas una por una. Varias vienen de capturas de Instagram a baja resolución (540–720 px de ancho). **No las voy a agrandar**: las fotos de baja resolución van en los recuadros más chicos del lookbook.

### Clasificación

| Origen | Tamaño | Contenido | Tipo | Nombre propuesto | Uso |
|---|---|---|---|---|---|
| post-01 | 1440×1919 | Bikini negro con llamas rojo/amarillo, lentes negros, stickers góticos (murciélago, ataúd), arena negra | producto | `bikini-llamas.jpg` | **Hero** |
| post-02 | 540×960 | Bikini negro con estampado rojo de murciélagos, stickers y lentes. **Bandas blancas arriba y abajo** (captura) | producto | `bikini-murcielagos-rojos.jpg` | Lookbook (recortar las bandas) |
| post-03 | 540×960 | Top de malla negra con cerezas y lazo rojo + bottom negro con tiras rojas, arena | producto | `set-malla-cerezas.jpg` | Lookbook |
| post-04 | 1440×1440 | Bikini negro acanalado con tiras rojas, piedras, madera | producto | `bikini-negro-tiras-rojas.jpg` | Lookbook (recuadro grande) |
| post-05 | 540×960 | Bikini negro con ribete neón, cruces invertidas y parca | producto | — | **Descartar**: es la misma pieza que post-06, con encuadre más cerrado |
| post-06 | 631×841 | Igual que post-05, encuadre más abierto | producto | `bikini-cruces-neon.jpg` | Lookbook |
| post-07 | — | Bikini bandeau de calaveras y rosas celeste. **Tiene un marco o recuadro sobrepuesto** (artefacto de captura) | producto | — | **Descartar**: duplica post-09 y tiene el artefacto |
| post-08 | 640×1136 | Lancha con toldo azul en el mar, isla al fondo | ambiente/playa | `playa-lancha.jpg` | Sección "Qué es" |
| post-09 | 1440×1920 | Bikini de calaveras y rosas celeste, piedras, stickers | producto | `bikini-calaveras-celeste.jpg` | Lookbook (recuadro grande) |
| post-10 | 640×1136 | Orilla con cielo nublado e islas | ambiente/playa | `playa-orilla.jpg` | Sección "Cómo comprar" |
| post-11 | 720×960 | Detalle: bottom neón con parca y cruz, sobre tela negra | producto (detalle) | `detalle-parca-neon.jpg` | Lookbook (recuadro chico) |
| post-12 | 1351×1802 | Bikini neón "sinful" con cruces y parca, stickers | producto | `bikini-sinful-neon.jpg` | Lookbook (recuadro grande) + **imagen OG** |
| post-13 | 841×841 | Igual que post-12, cuadrada y de menor resolución | producto | — | **Descartar**: duplica post-12 |
| post-14 | 631×841 | Detalle: bikini morado con aro de corazón rosado, sobre roca | producto (detalle) | `detalle-corazon-morado.jpg` | Lookbook (recuadro chico) |
| post-15 | 631×841 | Bikini morado sobre una roca frente al mar | producto en playa | `bikini-morado-roca.jpg` | Lookbook |
| post-16 | 631×1120 | Igual que post-15 con más cielo. **Bandas negras arriba y abajo** | producto en playa | — | **Descartar**: duplica post-15 |
| logo-mockup.png | 1080×1080 | Mockup del logo | referencia | — | Descartado, como indicaste. Me sirve de referencia para el recuadro del tagline |

Total en el sitio: **1 hero + 9 en el lookbook + 2 de ambiente = 12 fotos.** Las 4 descartadas no se convierten ni entran al repo (decidido).

### Procesamiento (`npm run assets`)
- **Marca de agua ✦ de Gemini (decidido: fuera)**: reviso la esquina inferior derecha de las 12 fotos que se usan. En las que la tengan (al menos `bikini-calaveras-celeste` y `bikini-sinful-neon`), **recorto** una franja del borde inferior y/o derecho lo justo para dejarla afuera, sin retoque ni relleno generativo. El script lleva el recorte de cada foto como parámetro explícito. La marca de agua invisible SynthID que Google incrusta en los píxeles sigue en la imagen; el recorte no la quita.
- **Fotos**: recorte de las bandas (post-02), redimensión a un máximo de 1600 px en el lado largo (solo afecta a post-01, 09 y 12, que pasan a ~1200×1600), JPG calidad 85 con mozjpeg, perfil sRGB y sin metadatos. Todas quedan por debajo de 1 MB; el script falla si alguna se pasa.
- **SVG**: `svgo --multipass`. Los archivos originales pesan 147/176 KB, y la mayor parte es un manifiesto C2PA embebido en `<metadata>`, que svgo elimina. Luego bajo la precisión numérica: con `floatPrecision` 0 quedan en ~17/19 KB (~8 KB gzip), y en un viewBox de 1200–2060 unidades el error es de ≤0.5 unidades, que no se nota. Antes de elegir la precisión lo compruebo comparando el original y el optimizado renderizados a 2× el tamaño de uso. Si 0 pierde detalle en las hojas de palma, uso 1 (~50 KB). Se conservan `fill="currentColor"` y el `viewBox`.
- **Favicon**: `favicon.svg` = cuadrado `--obsidiana` con el cristal en `--hueso` centrado y con margen. Los PNG de 32, 180, 192 y 512 salen de ese SVG con sharp. Riesgo: a 32 px el detalle interno del cristal (las palmas) se empasta. Queda la silueta, y está bien.
- **OG (1200×630, `public/og.jpg`)**: fondo `--obsidiana`. A la izquierda, el logo completo en `--hueso`; a la derecha, `bikini-sinful-neon` a sangre con un corte diagonal. Lo compone sharp con un SVG.

---

## 3. Tokens de diseño

```css
:root {
  --obsidiana: #0B0B0D;  /* fondo base */
  --hueso:     #F0EFEB;  /* texto principal */
  --neon:      #A4DF2E;  /* CTA, highlights */
  --morado:    #7E44BF;  /* acento secundario (fondos, no texto chico) */
  --rojo:      #AE2227;  /* acento puntual (decorativo) */
  --vino:      #6E1423;  /* acento puntual (fondos de banda) */
  --hueso-70:  color-mix(in srgb, var(--hueso) 72%, var(--obsidiana)); /* texto secundario */

  --font-display: 'Oswald', <fallback ajustado>, sans-serif;  /* títulos, MAYÚSCULAS */
  --font-body:    'Inter',  <fallback ajustado>, sans-serif;

  --step--1: clamp(0.875rem, 0.85rem + 0.1vw, 0.95rem);
  --step-0:  clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --step-2:  clamp(1.75rem, 1.4rem + 1.6vw, 2.75rem);
  --step-4:  clamp(2.75rem, 1.8rem + 4.5vw, 5.5rem);   /* display hero */
  --gutter:  clamp(1rem, 4vw, 3rem);
  --max:     1440px;
}
```

### Contraste WCAG (calculado)

| Texto / fondo | Ratio | Uso permitido |
|---|---|---|
| hueso / obsidiana | 17.09 | ✅ todo |
| neón / obsidiana | 12.34 | ✅ todo (títulos destacados, links) |
| obsidiana / neón | 12.34 | ✅ texto de botón primario |
| hueso / vino | 10.21 | ✅ todo (banda de "Cómo comprar") |
| hueso / rojo | 5.97 | ✅ texto normal (stickers) |
| hueso / morado | 5.27 | ✅ texto normal (bloque o sticker morado) |
| neón / morado | 3.80 | ⚠️ solo texto grande (≥24 px o ≥18.66 px bold) |
| hueso-70 / obsidiana | ≈ 9 | ✅ texto secundario (lo verifico con el valor final) |
| morado / obsidiana | 3.25 | ❌ texto chico. Solo decorativo o texto ≥24 px |
| rojo / obsidiana | 2.86 | ❌ solo decorativo (líneas, formas) |
| vino / obsidiana | 1.67 | ❌ solo fondo o forma |
| neón / hueso | 1.39 | ❌ nunca |

El foco visible es un outline de 3 px en `--neon` con offset, que contrasta 12:1 con el fondo.

---

## 4. Dirección visual

- **Base**: fondo obsidiana, con un grano muy sutil que evoca la arena volcánica: un PNG de 128 px (4 KB) que genera `npm run assets`. *Cambio en la implementación:* el SVG `feTurbulence` que había planeado costaba ~1.8 s de render en el móvil de Lighthouse y bajaba Performance a 80. No hay gradientes de stock ni glassmorphism.
- **Las fotos mandan**: recuadros grandes, bordes rectos, sin sombras ni tarjetas.
- **Stickers**: el recurso de identidad, tomado del feed. Son etiquetas cortas en Oswald, rotadas ±3–6°, con fondo neón (texto obsidiana), morado o rojo (texto hueso), puestas sobre las fotos y los títulos. Se hacen solo con CSS, sin imágenes inventadas.
- **Tipografía**: Oswald en mayúsculas, muy grande y con poco interlineado para los títulos; Inter para el cuerpo, 16–18 px.
- **Energía tropical**: viene de las fotos de playa, del neón y de los cortes diagonales entre secciones (`clip-path`), no de ilustraciones.

---

## 5. Página: secciones y contenido

Todos los textos están en el HTML estático. Los textos marcados como *microcopy* son míos, van en el tono de la bio y están **aprobados**.

### 5.1 Hero (`<header>`)
- **Lockup en texto vivo (decidido: opción A)**: cristal SVG + `<h1>OBSIDIAN FINDS</h1>` en Oswald + el tagline "Dark Style, Tropical Heat" en un recuadro con borde, como en el logo. Así el nombre y el tagline son texto real, legible para Google y Pomelli, y no paths de un SVG. El SVG del logo completo se usa en la imagen OG.
- Subtítulo: "Moda alternativa para espíritus indomables".
- Datos: "David, Chiriquí · Envíos a todo Panamá".
- CTA primario (neón): **"Ver la tienda"** → Cuanto. Debajo, un link de texto: "Síguenos en Instagram" *(microcopy)*.
- Foto: `bikini-llamas`, con el sticker "Llamas". En escritorio va en dos columnas (texto a la izquierda, foto a sangre a la derecha, alto del viewport). En móvil la foto va arriba (46 % del alto de pantalla) y el cristal se pone al lado del nombre, para que el lockup, el subtítulo y el CTA entren en la primera pantalla de 360×740. Se carga con `loading="eager"` y `fetchpriority="high"` porque es el LCP.

### 5.2 Qué es Obsidian Finds (`<section>`)
- Título *(microcopy)*: "Hallazgos oscuros, calor tropical".
- Texto *(microcopy, basado en el contexto que me diste)*:
  > Ropa nueva y accesorios de estilo alternativo, con los trajes de baño como protagonistas. Estética dark pensada para el calor del trópico.
- Foto `playa-lancha` en vertical al lado del texto (en móvil queda como banda recortada).

### 5.3 Lookbook (`<section id="lookbook">`)
- Título: "Lookbook". Bajada *(microcopy)*: "Piezas que ya pasaron por la arena negra."
- **Grid editorial asimétrico** de 12 columnas en escritorio: recuadros de distinto tamaño según la resolución de la foto, intercalando verticales grandes con detalles chicos. En móvil, 2 columnas con algunas fotos a ancho completo. No es un grid de cards iguales.
- Orden: sinful-neon (grande) · calaveras-celeste (grande) · detalle-parca-neon · negro-tiras-rojas (cuadrado grande) · cruces-neon · murcielagos-rojos · set-malla-cerezas · detalle-corazon-morado · morado-roca.
- Cada foto lleva un `alt` descriptivo (p. ej. "Bikini negro con estampado de calaveras y rosas en celeste, sobre arena volcánica negra con piedras y stickers góticos"). Además, cada foto lleva una etiqueta tipo sticker (decidido) con solo la descripción visual, encima de la foto, rotada y en los colores de sticker de la sección 4. Las etiquetas también son texto real en el HTML (`<figcaption>`):

  | Foto | Etiqueta |
  |---|---|
  | bikini-sinful-neon | Sinful |
  | bikini-calaveras-celeste | Calaveras |
  | detalle-parca-neon | Parca neón |
  | bikini-negro-tiras-rojas | Tiras rojas |
  | bikini-cruces-neon | Cruces |
  | bikini-murcielagos-rojos | Murciélagos |
  | set-malla-cerezas | Cerezas |
  | detalle-corazon-morado | Corazón |
  | bikini-morado-roca | Morado |

  "Sinful" es lo que dice la prenda, no un nombre comercial inventado. **No hay precios, tallas, disponibilidad ni nombres comerciales.**
- CTA al final (neón): "Encuéntralo en Cuanto" *(microcopy)* → Cuanto.

### 5.4 Cómo comprar (`<section>`, banda en `--vino` con texto hueso)
- Título: "Cómo comprar".
- Tres pasos en una lista ordenada (`<ol>`), con números grandes en Oswald en neón:
  1. **Explora** — Mira todo el catálogo en Cuanto.
  2. **Pide y paga** — Haz tu pedido y paga ahí mismo.
  3. **Recíbelo** — Enviamos a todo Panamá.
- CTA primario "Ver la tienda" → Cuanto + CTA secundario (borde hueso) **"Escríbenos por Instagram"** → `https://ig.me/m/obsidian.finds`. Si `whatsapp` está definido, aparece un tercer botón.
- Foto `playa-orilla` como franja vertical o fondo lateral, con overlay oscuro sólido (no gradiente decorativo) para mantener el contraste.

### 5.5 Footer (`<footer>`)
- Cristal SVG pequeño en hueso, "Obsidian Finds", "David, Chiriquí, Panamá · Envíos a todo Panamá".
- Links: Tienda en Cuanto · Instagram (@obsidian.finds).
- "© {año del build} Obsidian Finds". El año se calcula en el build, no con JS.

### 5.6 404 (`pages/404.astro`)
- Usa el mismo layout. Cristal grande, "404" en Oswald y el texto *(microcopy)* "Este hallazgo no existe." con botones "Volver al inicio" y "Ver la tienda". Lleva `noindex` y no aparece en el sitemap.

---

## 6. SEO y metadatos

- `<html lang="es-PA">` (decidido).
- `<title>`: "Obsidian Finds — Dark Style, Tropical Heat | Moda alternativa en Panamá"
- `meta description` (155 caracteres aprox.): "Moda alternativa para espíritus indomables: ropa nueva, trajes de baño y accesorios de estilo dark. Desde David, Chiriquí, con envíos a todo Panamá."
- `canonical` https://obsidian-finds.com/, `theme-color` #0B0B0D, `color-scheme: dark`.
- Open Graph: `og:type=website`, `og:locale=es_PA`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image` (URL absoluta de `og.jpg`, 1200×630, con `og:image:alt`). Twitter: `summary_large_image`.
- Iconos: `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `site.webmanifest` (192/512, `background_color` y `theme_color` obsidiana).
- JSON-LD:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "name": "Obsidian Finds",
    "slogan": "Dark Style, Tropical Heat",
    "description": "Moda alternativa para espíritus indomables. Ropa nueva, trajes de baño y accesorios de estilo dark.",
    "url": "https://obsidian-finds.com/",
    "logo": "https://obsidian-finds.com/icon-512.png",
    "image": "https://obsidian-finds.com/og.jpg",
    "address": { "@type": "PostalAddress", "addressLocality": "David", "addressRegion": "Chiriquí", "addressCountry": "PA" },
    "areaServed": { "@type": "Country", "name": "Panamá" },
    "sameAs": ["https://www.instagram.com/obsidian.finds", "https://cuanto.app/Ob.finds"]
  }
  ```
  No incluye `telephone`, `priceRange`, `openingHours` ni `foundingDate`, porque no tengo esos datos.
- `public/robots.txt`: `Allow: /` + `Sitemap: https://obsidian-finds.com/sitemap-index.xml`.

---

## 7. Deploy

`wrangler.jsonc`:
```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "obsidian-finds",
  "compatibility_date": "2026-10-20",
  "assets": { "directory": "./dist", "not_found_handling": "404-page" },
  "routes": [{ "pattern": "obsidian-finds.com", "custom_domain": true }]
}
```
Scripts:
```json
"dev": "astro dev",
"build": "astro build",
"preview": "astro build && wrangler dev",
"deploy": "astro build && wrangler deploy",
"assets": "node scripts/process-assets.mjs"
```
`preview` usa `wrangler dev` en lugar de `astro preview` para probar lo mismo que se sirve en producción, incluida la página 404.

El README va a explicar:
1. **Workers Builds**: Dashboard → Workers & Pages → Create → Import a repository. Build command `npm run build`, deploy command `npx wrangler deploy`.
2. **Custom domain del apex**: la zona ya está en tu cuenta de Cloudflare, así que el apex queda declarado en `wrangler.jsonc` (`routes` con `custom_domain: true`) y `wrangler deploy` lo conecta solo, con DNS y certificado. Requisito: que el apex no tenga un registro previo (A/AAAA/CNAME) apuntando a otro lado. Si lo tiene, hay que borrarlo antes del primer deploy. El README explica cómo hacerlo también desde el dashboard (Worker → Settings → Domains & Routes) por si se prefiere.
3. **www → apex**: `www` **no** se agrega como custom domain del Worker. Se crea un registro DNS `AAAA www → 100::` con proxy activado y una Redirect Rule (plantilla "Redirect from WWW to root", 301, conservando path y query). Esto se hace en el dashboard; el README trae los pasos.

---

## 8. Criterios de aceptación y cómo los verifico

| # | Criterio | Verificación |
|---|---|---|
| 1 | `npm run build` sin warnings relevantes | Salida del build revisada; cualquier warning queda documentado |
| 2 | Todo el contenido está en el HTML sin JS | `grep` en `dist/index.html` de cada texto de la sección 5 y de los 3 links (Cuanto, Instagram, ig.me); `curl` a `wrangler dev` |
| 3 | 0 KB de JS | `find dist -name '*.js'` vacío y ningún `<script>` salvo `application/ld+json` |
| 4 | Lighthouse móvil ≥ 95 en las 4 categorías | `npx lighthouse` contra `wrangler dev` con el preset móvil, usando el Chrome local; reporto los 4 números |
| 5 | Responsive de 360 a 1440 px sin scroll horizontal | Navegador integrado a 360, 390, 768, 1024 y 1440 px: `document.documentElement.scrollWidth <= innerWidth` + capturas |
| 6 | Sin números de teléfono en el HTML | `grep -E '\+?507|[0-9]{3,4}[- ]?[0-9]{4}|tel:|wa\.me'` sobre `dist/**/*.html`, sin coincidencias |
| 7 | El repo no incluye `_input/` ni imágenes > 1 MB | `git ls-files _input` vacío; `git ls-files` + `find -size +1M` sin resultados |
| 8 | Contraste AA | Script con los pares realmente usados + auditoría de Lighthouse |
| 9 | Metadatos | `og:*`, `twitter:*`, canonical y JSON-LD presentes; el JSON-LD pasa la validación de schema.org |
| 10 | 404 de marca | `curl -i` a una ruta inexistente en `wrangler dev` devuelve 404 con el HTML de la marca |

---

## 9. TODOs y decisiones pendientes (no aparecen en el sitio)

1. ~~Marca de agua ✦ de Gemini~~ — **Decidido:** fuera, recortando el borde (sección 2). SynthID sigue incrustado.
2. ~~Duplicados descartados~~ — **Decidido:** post-05, 07, 13 y 16 quedan fuera del repo.
3. ~~Metadatos de procedencia~~ — **Decidido:** se quitan el C2PA de los SVG y los metadatos de las fotos.
4. ~~Microcopy~~ — **Decidido:** aprobado tal como está en la sección 5.
5. ~~Leyendas del lookbook~~ — **Decidido:** llevan etiquetas tipo sticker (tabla en 5.3).
6. ~~Lockup del hero~~ — **Decidido:** opción A, texto vivo.
7. ~~`lang`~~ — **Decidido:** `es-PA`.
8. ~~Fotos de baja resolución~~ — **Decidido:** se usan las que hay, con las chicas en recuadros chicos. **TODO futuro:** si aparecen los originales en alta (sobre todo murciélagos, cerezas y cruces neón), se reemplazan los JPG en `src/assets/fotos/` con el mismo nombre, sin tocar el diseño.
9. ~~Dominio~~ — **Decidido:** la zona ya está en Cloudflare. El apex se declara en `wrangler.jsonc` y www redirige al apex con una Redirect Rule (sección 7). Antes del primer deploy, revisa que el apex no tenga registros DNS que apunten a otro lado.
10. ~~Instagram~~ — **Decidido:** el handle `@obsidian.finds` va visible en el footer.

---

## 10. Resultado de la verificación (21-oct-2026)

| # | Criterio | Resultado |
|---|---|---|
| 1 | Build sin warnings | ✅ `npm run build` sin warnings ni errores (Astro 7.4.1) |
| 2 | Contenido sin JS | ✅ Los textos de la sección 5 y los links a Cuanto, Instagram e ig.me están en `dist/index.html` y en la respuesta de `curl` a `wrangler dev` |
| 3 | 0 KB de JS | ✅ Ningún `.js` en `dist/`; el único `<script>` es el JSON-LD |
| 4 | Lighthouse móvil ≥ 95 | ✅ 3 corridas contra `wrangler dev`: Performance 97 / 97 / 98, Accessibility 100, Best Practices 100, SEO 100. LCP 2.4–2.6 s, TBT 0 ms, CLS 0 |
| 5 | Responsive 360–1440 | ✅ `scrollWidth == innerWidth` en 360, 390, 768, 1024 y 1440 px, revisado con capturas |
| 6 | Sin teléfonos | ✅ Ninguna coincidencia en el texto visible ni en los `href` (`tel:`, `wa.me`, `+507`, patrones de 7–8 dígitos) |
| 7 | Sin `_input/` ni imágenes > 1 MB | ✅ `_input/` en `.gitignore`; la imagen versionada más pesada es `bikini-calaveras-celeste.jpg` (493 KB) |
| 8 | Contraste AA | ✅ Todos los pares usados pasan; el más bajo es hueso sobre morado (5.27:1) |
| 9 | Metadatos | ✅ title, description, canonical, OG, Twitter, JSON-LD `ClothingStore`, sitemap y robots |
| 10 | 404 de marca | ✅ `curl -i /no-existe` devuelve 404 con la página de la marca |

Pendiente de verificar en producción: la conexión del apex en el primer deploy y la Redirect Rule de www (README).
