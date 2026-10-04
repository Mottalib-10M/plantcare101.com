// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { SITE_URL, LAST_UPDATED } from './src/data/site-config.js';
import { ROUTES, NOINDEX_PATHS, LOCALES, DEFAULT_LOCALE } from './src/i18n/routes.js';
export default defineConfig({
  site: SITE_URL, trailingSlash: 'always',
  integrations: [react(), sitemap({
    filter(page) { const p = new URL(page).pathname;
      /* La racine est l'accueil (pas de redirection de langue) : elle reste au sitemap.
         '/embed/' : pages d'iframe en noindex, hors sitemap. */
      return !NOINDEX_PATHS.includes(p) && !p.startsWith('/embed/') && !p.startsWith('/404'); },
    serialize(item) {
      item.lastmod = new Date(LAST_UPDATED);
      const p = new URL(item.url).pathname;
      const pair = ROUTES.find((r) => LOCALES.some((l) => r.paths[l] === p));
      if (pair && LOCALES.length > 1) item.links = [...LOCALES.map((l) => ({ lang: l, url: `${SITE_URL}${pair.paths[l]}` })), { lang: 'x-default', url: `${SITE_URL}${pair.paths[DEFAULT_LOCALE]}` }];
      return item;
    },
  })],
  /* Site en anglais seul et sans pays (brief du 2026-10-04) : pas de routage i18n, pas de préfixe
     /en/ ; la racine est la page d'accueil, indexable. */
  // __BUILD_DAY__ : jour du build, identique serveur/navigateur — valeur par défaut des champs date au premier rendu.
  vite: { plugins: [tailwindcss()], define: { __BUILD_DAY__: JSON.stringify(new Date().toISOString().slice(0, 10)) } },
});
