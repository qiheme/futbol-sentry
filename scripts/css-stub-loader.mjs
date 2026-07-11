// Node ESM loader used only during `astro build`'s static-route generation.
//
// Astro 7 keeps node_modules external in the prerender pass (ignores
// vite.ssr.noExternal), so Node itself imports Cobalt's compiled components.
// Those components pull in their class-name maps from `*.module.css.js`
// (plain JS — loads fine), which in turn `import './X.module.css'` purely as a
// bundler side-effect. Node can't load raw `.css`, so we stub those imports to
// an empty module. This is safe: the actual rules ship in the single
// `@q-labs/cobalt/styles.css` bundle imported in the base layout, and the
// hashed class names live in the `.css.js` files, not the raw `.css`.

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./css-stub-hooks.mjs', pathToFileURL(import.meta.filename));
