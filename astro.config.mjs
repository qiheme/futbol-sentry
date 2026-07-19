// @ts-check
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Astro 7's prerender pass keeps node_modules external, so Node itself imports
// Cobalt's compiled components — which side-effect-import raw `.module.css`
// files Node can't load. Registering the stub hooks here (the config runs in
// the same process that prerenders) makes EVERY invocation path work —
// `npm run build`, `npx astro build`, deploy presets, any OS — with no
// NODE_OPTIONS wiring. See scripts/css-stub-hooks.mjs.
register('./scripts/css-stub-hooks.mjs', pathToFileURL('./'));

export default defineConfig({
  output: 'static',
  site: process.env.PUBLIC_SITE_URL ?? 'https://pitchglobe.vercel.app',
  integrations: [react(), sitemap()],
  vite: {
    ssr: {
      // Dev SSR runs through Vite, which needs to bundle Cobalt so its
      // CSS-module imports resolve there too.
      noExternal: [/@q-labs\/cobalt/],
    },
  },
});
