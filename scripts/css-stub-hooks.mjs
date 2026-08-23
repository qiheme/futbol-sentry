// Loader hooks: resolve/return an empty module for Cobalt's raw `.css`
// side-effect imports so Node doesn't choke on them during Astro's prerender
// pass (Astro 7 keeps node_modules external there, so Node imports Cobalt
// directly). Scoped to @q-labs/cobalt: matches `*.css` under the package but
// NOT `*.css.js` (the class-name maps must load normally). The real rules ship
// in the `@q-labs/cobalt/styles.css` bundle imported by the base layout.

const isCobaltRawCss = (specifier, parentURL) =>
  specifier.endsWith('.css') &&
  !specifier.endsWith('.css.js') &&
  (specifier.includes('@q-labs/cobalt') ||
    (parentURL?.includes('@q-labs/cobalt') ?? false));

export async function resolve(specifier, context, nextResolve) {
  if (isCobaltRawCss(specifier, context.parentURL)) {
    return {
      url: new URL(specifier, context.parentURL ?? 'file:///').href,
      shortCircuit: true,
      format: 'css-stub',
    };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (context.format === 'css-stub') {
    return { format: 'module', shortCircuit: true, source: 'export default {};' };
  }
  return nextLoad(url, context);
}
