# Styling

The UI is styled with [Tailwind CSS](https://tailwindcss.com) 4 utilities on top of PrimeReact's Lara theme, in plain CSS without a preprocessor. Icons come from [Iconify](https://iconify.design) as classes, and the browser bundle is built for the browsers listed by browserslist. This document describes the entry stylesheet and its cascade layers, the theme and the utilities derived from it, where styles belong, icons and browser support, together with the decisions behind them.

| Part | Choice | Where |
|---|---|---|
| Components and their theme | [PrimeReact](primereact.md) 10, Lara theme | `packages/ui/src/style/main.css` |
| Utilities | Tailwind CSS 4 (`@tailwindcss/vite` in both Vite configurations) | `packages/ui/src/style/main.css` |
| Icons | PrimeIcons and Tabler, as classes | `packages/ui/tailwind-icons.ts` |
| Processing | plain CSS: Tailwind, and Lightning CSS when Vite minifies the build | — |
| Browser targets | `baseline 2022` | `browserslist` in the root `package.json` |

## The entry stylesheet

`packages/ui/src/style/main.css` is imported by `App.tsx`, so every view gets it. During development, the dev server renders it into the page; in production, the page links it (see [Server-side rendering and hydration](rendering.md#stylesheets-during-development)).

```css
@layer theme, base, primereact, components, utilities;

@import "primereact/resources/themes/lara-light-cyan/theme.css";
@import "tailwindcss" source("../");
@plugin "../../tailwind-icons.ts";

@theme inline {
  --color-primary: var(--primary-color);
  /* … */
}
```

### Cascade layers

The Lara theme, and the component styles PrimeReact inserts, are in the `primereact` cascade layer; Tailwind puts its styles into layers of its own. Rules of a later layer win over rules of an earlier one, regardless of their specificity:

| Layer | Content |
|---|---|
| `theme` | Tailwind's theme variables |
| `base` | Tailwind's preflight, which resets the styles of plain HTML elements |
| `primereact` | the Lara theme, the styles of PrimeReact's components |
| `components` | the stylesheets of components (see [below](#where-styles-belong)) |
| `utilities` | Tailwind's utilities, including the icon classes |
| no layer | wins over all layers: Lara's variables and font faces, PrimeReact's `base` styles (see [PrimeReact](primereact.md#limits)) |

Tailwind also declares a `properties` layer before all others, with fallbacks for browsers without `@property`.

- **The order is declared explicitly,** in the first line. Without it, the browser orders layers by their first appearance: with the theme first, Tailwind's preflight resets PrimeReact's components (a `Button` loses its padding, background and border); with Tailwind first, PrimeReact's styles win over the utilities.
- **The theme is imported by the stylesheet, not by JavaScript.** Imported from a module, the theme would be bundled into the stylesheet of the `vendor` chunk, which the page links before the application's stylesheet, so the `primereact` layer would come first again. As part of `main.css`, it's in the same file, after the declaration.

The cost of a single stylesheet: any change of the application's styles invalidates the cached theme too (about 180 kB minified).

### Sources

Tailwind generates the utilities used in the files it scans. `source("../")` limits the scan to `packages/ui/src`, because the dev server runs in the repository and the production build in the package: without it, the dev server scans the whole repository and generates utilities the production build doesn't (from words such as `hidden` or `table` in other files). Classes used outside `packages/ui/src` need an `@source` directive.

## Theme

The Lara theme of PrimeReact 10 comes precompiled, in two modes and eight accent colors. The name of the imported theme selects both: `lara-{light,dark}-{amber,blue,cyan,green,indigo,pink,purple,teal}`. Changing it is the whole configuration; the [theme utilities](#theme-utilities) follow, because every Lara theme defines the same variables.

The themes hardcode their colors (the primary color of `lara-light-cyan` appears 87 times as a literal, never as `var(--primary-color)`), so they can't be recolored through variables, and switching the mode at runtime would need both themes. A theme generated from Lara with variables, which would allow any accent color and switching to the dark mode, is on the [roadmap](roadmap.md#planned).

### Theme utilities

`@theme inline` defines utilities for the theme's variables, named after them:

| Utilities | Theme variable |
|---|---|
| `bg-primary`, `text-primary`, `border-primary`, … | `--primary-color` |
| `text-primary-contrast` | `--primary-color-text`, text on the primary color |
| `bg-highlight`, `text-highlight-contrast` | `--highlight-bg`, `--highlight-text-color` |
| `text-color`, `text-color-secondary` | `--text-color`, `--text-color-secondary` |
| `bg-surface-0` … `bg-surface-900` | `--surface-0` … `--surface-900` (reversed in the dark themes) |
| `bg-surface-ground`, `bg-surface-section`, `bg-surface-card`, `bg-surface-overlay`, `bg-surface-hover`, `border-surface-border` | the surfaces of the same names |
| `rounded-border` | `--border-radius` |
| `font-sans` | `--font-family` (Inter) |

- **Use them for everything that should follow the theme;** Tailwind's own palette (`bg-blue-500`) is for colors that shouldn't change with it.
- **Every color works with every color utility** (`bg-`, `text-`, `border-`, `ring-`, …), which also makes `bg-color` and `border-color` exist.
- **`inline` makes the utilities use the theme's variables directly,** so `--color-primary` doesn't exist at runtime. Plain CSS uses the theme's variables: `var(--primary-color)`, `var(--surface-border)`.
- **The page** gets the ground surface and the text color of the theme on `<body>`, in `App.tsx`.

## Where styles belong

- **Utilities in the markup** by default.
- **Plain elements are reset** by Tailwind's preflight: headings have no size, lists no markers, nothing has margins. PrimeReact's components keep their styles, their layer comes after it.
- **A component's own stylesheet** is for what utilities don't express well: complex selectors, animations, overrides of a PrimeReact component's internals. It's a CSS Module next to the component (`StatusCard.module.css`), with its rules in `@layer components { … }`, so that utilities in the markup still win; it uses the theme's variables and may use native nesting. It isn't processed by Tailwind, so it can't use `@apply` (Tailwind advises against `@apply` in CSS Modules, as every module would need its own Tailwind run). No component stylesheet exists yet, so the convention isn't exercised.
- **Global styles** go into `src/style/`, imported by `main.css` (`@import "./forms.css"`); Tailwind bundles the imports into the entry stylesheet.

There's no preprocessor. Native CSS has nesting, variables and color functions, Tailwind bundles imports, and Lightning CSS converts what the targeted browsers lack (see [below](#browser-support)). Sass, the usual alternative, isn't meant to be combined with Tailwind 4, which processes the stylesheets itself.

## Icons

Icons are classes, `icon-[<set>--<name>]`, on an empty element, or passed to a PrimeReact component through its `icon` prop:

```tsx
<span className="icon-[tabler--activity-heartbeat] text-2xl text-primary" aria-hidden="true" />
<Button label="Refresh" icon="icon-[prime--refresh]" />
```

- **They're masks in the text color,** an SVG image in the stylesheet, 1em in size, so they follow the font size (`text-2xl`).
- **Only the icons in use** end up in the stylesheet, like any utility. There's no font to download and no JavaScript.
- **Two sets:** PrimeIcons (`prime`, 313 icons) where it has the icon, because PrimeReact's components use it for their own icons; [Tabler](https://tabler.io/icons) (`tabler`, over 6,000 icons) otherwise. Both can be browsed at [icon-sets.iconify.design](https://icon-sets.iconify.design).
- **Decorative icons** get `aria-hidden="true"`.

### The icon plugin

`packages/ui/tailwind-icons.ts` is a Tailwind plugin, loaded by `main.css` through `@plugin`, which turns the icon classes into CSS with `getIconsCSSData()` from `@iconify/utils`:

- **The icon sets** are imported from the `@iconify-json/*` packages, dev dependencies of `@app/ui`. To add one, install `@iconify-json/<set>` and add it to `iconSets`.
- **Tabler's stroke** is reduced from its default 2 to `TABLER_STROKE_WIDTH` (1.5), which matches the weight of PrimeIcons, so that icons of both sets look alike side by side.
- **An unknown set or icon** generates no styles and logs a warning (*Unknown icon "tabler--…"*) in the dev server's or the build's output.
- **Changes to the plugin** apply during development without a restart.

The file lives at the package root, next to `vite.config.ts`: it's build tooling, type-checked and linted with the rest of the project, but not part of the package's build output.

Iconify's own Tailwind plugin, `@iconify/tailwind4`, takes its options from CSS, which can't pass the function changing Tabler's stroke, and finds the icon sets from its own location in pnpm's store, relying on pnpm's hoisting.

## Browser support

The root `package.json` lists the targeted browsers for browserslist:

```json
"browserslist": ["baseline 2022"]
```

`baseline 2022` stands for the browsers supporting all features that became Baseline in 2022: Chrome, Edge and Firefox 108, Safari 16.0 (also on iOS). `@maveric/vite` turns the configuration into the `build.target` of the `client` environment (see its [README](../libs/maveric-vite/README.md#in-builds)), which applies to the production build:

- **JavaScript:** Oxc converts syntax the browsers don't support.
- **CSS:** Lightning CSS, which minifies the stylesheets (`build.cssTarget` follows `build.target`), adds vendor prefixes, flattens nesting, adds fallbacks for newer color formats and rewrites range media queries.
- **Not covered:** JavaScript APIs, which would need polyfills. Vite's `@vitejs/plugin-legacy` injects them through `index.html`, which server-rendered pages don't use (see [Roadmap](roadmap.md#planned)).

The dev server serves the code as it is, for a current browser.

### Limits

- **PrimeReact 10's themes need cascade layers** (Chrome and Edge 99, Firefox 97, Safari 15.4); older browsers show unstyled components, whatever the target.
- **Tailwind 4 is designed for Chrome 111, Safari 16.4 and Firefox 128.** Since 4.1, it ships fallbacks so that older browsers render its utilities, if not always identically.
- **Some features have no fallback.** A modifier making a theme color transparent (`bg-primary/50`) generates `color-mix()` with a variable, which Chrome before 111, Firefox before 113 and Safari before 16.2 don't support.

| Target | Desktop minimums | Global usage covered |
|---|---|---|
| Tailwind's design target | Chrome 111, Firefox 128, Safari 16.4 | 93.0 % |
| Vite's default (`baseline widely available on 2026-01-01`) | Chrome 111, Firefox 114, Safari 16.4 | 94.5 % |
| `baseline 2022` | Chrome 108, Firefox 108, Safari 16.0 | 95.3 % |
| cascade layers, the limit set by PrimeReact | Chrome 99, Firefox 97, Safari 15.4 | 96.0 % |

The usage figures are from browserslist's data of October 2026 (`caniuse-lite` 1.0.30001815).

### Why `baseline 2022`

- **It's fixed:** unlike `baseline widely available`, it doesn't change when browserslist's data are updated, so the build output only changes when the configuration does.
- **It costs nothing yet:** when it was chosen, the JavaScript built for it was identical to the one for Vite's default, and the CSS differed by one prefix. The features without fallbacks (see [above](#limits)) aren't used yet.

To check the CSS after larger changes, build it and run a browserslist-aware checker such as [`doiuse`](https://github.com/anandthakker/doiuse) on `packages/ui/dist/client/assets/*.css`. `doiuse` doesn't detect the newest features, such as `color-mix()` and `@property`; search for them too, and check that they're inside an `@supports` rule with a fallback.

## Alternatives

| Alternative | Why not |
|---|---|
| Sass | Tailwind 4 isn't designed to be combined with preprocessors; native CSS and Lightning CSS cover nesting and older browsers. Lara's Sass sources, which recoloring the theme would need, end at version 10.8.5. |
| UnoCSS | Its stylesheet is a virtual module whose id contains a NUL byte, which can't be part of the `<style>` element rendered into the page during development, so Vite's client adds a second copy; it also needs more integration work than Tailwind. |
| PrimeFlex | PrimeTek is discontinuing it and recommends Tailwind; its theme-aware classes are covered by the [theme utilities](#theme-utilities). |
| PrimeReact's unstyled mode with its Tailwind preset | The preset is written for Tailwind 3 and replaces the Lara theme with class lists to maintain. |
| Icon fonts (PrimeIcons, Font Awesome) | The whole font is downloaded, and the icons appear only after it has loaded. |
| Phosphor instead of Tabler | Its regular weight is heavier, its light weight lighter than PrimeIcons; Tabler with a 1.5 stroke matches best. |

## See also

- [PrimeReact](primereact.md)
- [Server-side rendering and hydration](rendering.md#stylesheets-during-development)
- [Hot reloading](hot-reload.md#stylesheets)
- [Vite setup](vite.md)
- [`@app/ui`](../packages/ui/README.md)
