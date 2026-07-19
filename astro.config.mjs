// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  site: process.env.PUBLIC_SITE_URL ?? 'https://pitchglobe.vercel.app',
  integrations: [react(), sitemap()],
  vite: {
    ssr: {
      // Dev SSR: bundle Cobalt through Vite so its CSS-module imports resolve.
      // (The static build's prerender pass keeps deps external regardless — see
      // scripts/css-stub-loader.mjs, wired into the `build` script.)
      noExternal: [/@q-labs\/cobalt/],
    },
  },
});
