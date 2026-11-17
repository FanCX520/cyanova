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

- Native Git deployment: https://cyanova-git.pages.dev
- Production website: https://cyanova.us

The public domain and Cloudflare aliases are managed by the owner. Verify the production domain after each release; do not change DNS or create new preview deployments as part of visual or motion updates.

The company site is separate from the Cyaraon personal-site project.

## Pages, shared footer and brand assets

Vite builds the home page plus `solutions.html`, `about.html` and `contact.html`. Each entry includes `<!-- CYANOVA:FOOTER -->`, replaced with `src/partials/footer.html` at build time and during local development. Footer content remains available without JavaScript. Edit the partial rather than duplicating changes across four pages.

`src/footer.css` styles the warm paper/mint closing scene. `src/experience.js` adds reversible link-label rolls, small input-responsive paper movements, scroll-linked background/wordmark depth and clipboard feedback. These additions do not replace the site's existing pages, material palette or paper motifs. No borrowed Turion artwork or source code is included.

The motion controls share the `cyanova-motion` preference. Device reduced-motion settings take priority. The hero word cycle stops offscreen or in a hidden tab; GSAP media contexts revert their animations and listeners when preferences change. Text remains readable when animation is off or JavaScript is unavailable.

`src/motion-settings.js` is the shared motion vocabulary: `power3.out` for paper settling, `power3.inOut` for interactive response, `power2.out` for ink drawing, and a `.5` ScrollTrigger scrub. `src/motion-details.css` adds only transform-safe underline detail. The launch story keeps a normalized duration-1 scroll timeline; its paper strips, tape, ink lines and arrow are driven by scroll progress and reverse cleanly.

The extra choreography is context-owned and transform/opacity based: notebook and invitation arrows draw after their paper enters, tape presses attach to photos and notes, letter stamps settle, FAQ copy responds after native `<details>` opens, and mobile navigation links enter after the menu opens. Refresh calls are coalesced into one animation frame; there are no autonomous loops beyond the existing hero word cycle, which pauses offscreen and in hidden tabs. Reduced-motion and site pause teardown all additions.

`src/launch-material.css` unifies this presentation with the existing `#approach` notebook: the same warm paper and grain SVG, grey-green cover, red margin line, layered page shadows, pink taped note, cyan torn strip and hand-drawn arrow. Barlow, DM and Caveat retain their existing display/body/handwriting roles. The pinned scene changes its content through those materials rather than introducing a separate dark product-panel style.

Paused motion and system reduced-motion preferences default to normal stacked steps, with an explicit explanation and a **Play scroll demo** control. Users can opt in to this one scroll demonstration without changing the site-wide saved pause or device setting. Its own **Read without animation** control returns to the readable list.

Compact fixed-stage layouts support viewports at least 480px high. Shorter windows show all steps and a clear size explanation rather than silently hiding the effect. The homepage and Solutions hero buttons link directly to the demonstration. During phase changes one complete explanation remains visible; paper motion stays scrubbed and reversible. Turning off the scene removes pin spacing and retains the active control's keyboard focus.

The original path-based wordmark is supplied in dark and light versions under `public/images/cyanova-wordmark*.svg`. `public/brand-kit.html` previews these assets and the 90 × 54 mm business card, with SVG and PDF downloads. The card is trim-size artwork without bleed or crop marks, and its colour/bleed requirements should be checked with the printer before production.

Browser regression scripts, rendered screenshots and reference inspection output are in ignored `artifacts/fusion-*`. They are development evidence, not production assets.
