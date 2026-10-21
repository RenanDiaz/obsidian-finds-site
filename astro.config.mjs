// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://obsidian-finds.com',
  output: 'static',
  trailingSlash: 'ignore',
  // En Astro 7 el valor por defecto es 'jsx', que puede quitar espacios entre elementos inline.
  compressHTML: true,
  build: {
    // Sin petición de CSS bloqueante y con la paleta visible en el HTML (Pomelli no ejecuta JS).
    inlineStylesheets: 'always',
  },
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
});
