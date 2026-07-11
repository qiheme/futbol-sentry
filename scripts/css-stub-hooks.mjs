// Loader hooks: resolve/return an empty module for raw `.css` imports so Node
// doesn't choke on CSS-module side-effect imports during Astro's prerender.
// Matches `*.css` but NOT `*.css.js` (the class-name maps must load normally).

const isRawCss = (specifier) =>
  specifier.endsWith('.css') && !specifier.endsWith('.css.js');

export async function resolve(specifier, context, nextResolve) {
  if (isRawCss(specifier)) {
    return {
      url: new URL(specifier, context.parentURL ?? 'file:///').href,
      shortCircuit: true,
      format: 'css-stub',
    };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (context.format === 'css-stub' || isRawCss(url)) {
    return { format: 'module', shortCircuit: true, source: 'export default {};' };
  }
  return nextLoad(url, context);
}
