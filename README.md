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

- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Node.js: 22

### Native GitHub deployment

The Pages project `cyanova-git` is connected directly to `FanCX520/cyanova`. Cloudflare clones the repository, builds the site and deploys it when `main` changes. No Cloudflare API token needs to be stored in GitHub Actions. The existing workflow validates the build and the four generated pages.

Git-connected site: https://cyanova-git.pages.dev

### Existing production project

The original Pages project `cyanova` remains a separate Direct Upload project serving `cyanova.us` and `cyanova-19t.pages.dev`. It is not automatically updated by the native Git connection above. Moving its custom domain requires a separately verified DNS/domain migration. Do not delete that project or change unrelated DNS records.

The company site is separate from the Cyaraon personal-site project.
