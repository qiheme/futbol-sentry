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
      // Cobalt ships CSS Modules imports; Node can't load .css files, so the
      // package must be bundled by Vite during SSR/prerender.
      noExternal: ['@q-labs/cobalt'],
    },
  },
});
