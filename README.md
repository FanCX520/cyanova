# Cyanova

Cyanova company website built with Vite, GSAP and static assets.

## Local development

```sh
npm ci
npm run dev
```

## Production build

```sh
npm run build
npm run preview
```

The production output is generated in `dist/` and is suitable for Cloudflare Pages.

## Cloudflare Pages

- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

The native Cloudflare Pages project `cyanova-git` is connected directly to `FanCX520/cyanova`. Cloudflare builds `main` automatically; this `design/footer-experience` branch is configured for native preview builds. No Cloudflare API token is copied into GitHub. The included Actions workflow validates builds, while Cloudflare handles deployment.

- Git-connected site: https://cyanova-git.pages.dev
- Existing production: https://cyanova.us (still on the separate Direct Upload project `cyanova`)
- Redesign preview: https://footer-experience.cyanova-19t.pages.dev

The existing production domain has not been migrated to the Git-connected project. That is a separate DNS/domain cutover and must not be described as already complete.

The company site is separate from the Cyaraon personal-site project.

## Pages, shared footer and brand assets

Vite builds the home page plus `solutions.html`, `about.html` and `contact.html`. Each entry includes `<!-- CYANOVA:FOOTER -->`, replaced with `src/partials/footer.html` at build time and during local development. Footer content remains available without JavaScript. Edit the partial rather than duplicating changes across four pages.

`src/footer.css` styles the warm paper/mint closing scene. `src/experience.js` adds reversible link-label rolls, small input-responsive paper movements, scroll-linked background/wordmark depth and clipboard feedback. These additions do not replace the site's existing pages, material palette or paper motifs. No borrowed Turion artwork or source code is included.

The motion controls share the `cyanova-motion` preference. Device reduced-motion settings take priority. The hero word cycle stops offscreen or in a hidden tab; GSAP media contexts revert their animations and listeners when preferences change. Text remains readable when animation is off or JavaScript is unavailable.

The original path-based wordmark is supplied in dark and light versions under `public/images/cyanova-wordmark*.svg`. `public/brand-kit.html` previews these assets and the 90 × 54 mm business card, with SVG and PDF downloads. The card is trim-size artwork without bleed or crop marks, and its colour/bleed requirements should be checked with the printer before production.

Browser regression scripts, rendered screenshots and reference inspection output are in ignored `artifacts/fusion-*`. They are development evidence, not production assets.
