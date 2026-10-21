# Obsidian Finds — sitio de marca

Landing de una página para [obsidian-finds.com](https://obsidian-finds.com). Astro estático, sin JS en el cliente, servido como Worker de Cloudflare con static assets. La venta ocurre en [Cuanto](https://cuanto.app/Ob.finds).

El plan y las decisiones de diseño están en [SPEC.md](SPEC.md).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Astro en `localhost:4321` |
| `npm run build` | Build estático a `dist/` |
| `npm run preview` | Build + `wrangler dev`: sirve `dist/` igual que en producción, incluida la 404, en `localhost:8787` |
| `npm run deploy` | Build + `wrangler deploy` (requiere `npx wrangler login`) |
| `npm run assets` | Reprocesa los insumos de `_input/` (fotos, logos, favicons, imagen OG). Solo hace falta si cambian los insumos |

Requiere Node 22.22 o superior.

## Contenido

- Textos y links: [`src/config/site.ts`](src/config/site.ts). Si se define `whatsapp` (URL `https://wa.me/…`), aparece el botón en "Cómo comprar" y el link en el footer. Ojo: el número queda visible en el HTML.
- Lookbook (orden, `alt`, etiquetas y posición en la grilla): [`src/data/lookbook.ts`](src/data/lookbook.ts).
- Fotos: `src/assets/fotos/`. Para reemplazar una por una versión en mejor resolución, basta con dejar un JPG con el mismo nombre (máx. 1600 px en el lado largo y menos de 1 MB). El build genera AVIF/WebP y los tamaños responsive.

## Deploy con Workers Builds

1. Sube el repo a GitHub o GitLab.
2. En el dashboard de Cloudflare: **Workers & Pages → Create → Import a repository** y elige el repo.
3. Configura:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
4. **Save and Deploy**. Cada push a la rama de producción vuelve a desplegar.

El nombre del Worker (`obsidian-finds`) y la carpeta de assets salen de [`wrangler.jsonc`](wrangler.jsonc).

## Dominio: obsidian-finds.com y www

### Apex (`obsidian-finds.com`)

Ya está declarado en `wrangler.jsonc`:

```jsonc
"routes": [{ "pattern": "obsidian-finds.com", "custom_domain": true }]
```

En el primer deploy, Cloudflare crea el registro DNS y el certificado. **Antes de ese deploy**, en **DNS → Records** de la zona, borra cualquier registro `A`, `AAAA` o `CNAME` del apex (`@`) que apunte a otro servidor; si existe, el deploy falla al conectar el dominio.

También se puede hacer desde el dashboard: Worker → **Settings → Domains & Routes → Add → Custom domain**.

### www → apex (redirección 301)

`www` no se conecta al Worker; se redirige al apex:

1. **DNS → Records → Add record**: tipo `AAAA`, nombre `www`, contenido `100::`, **Proxied** (nube naranja). Es una dirección de relleno: con el proxy activo, las peticiones nunca llegan a ella.
2. **Rules → Redirect Rules → Create rule**, plantilla **"Redirect from WWW to root"**:
   - Cuando: hostname es igual a `www.obsidian-finds.com`
   - Entonces: redirección dinámica a `concat("https://obsidian-finds.com", http.request.uri.path)`, código **301**, conservando la query string.
3. Comprueba que redirige:

```bash
curl -sI https://www.obsidian-finds.com/ | grep -i location
```
