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

GitHub Actions deploys `main` to the existing Cloudflare Pages project `cyanova`. Add these repository secrets before enabling the workflow:

- `CLOUDFLARE_ACCOUNT_ID`: `0d2ba62dc97be3113b6389503a7c5633`
- `CLOUDFLARE_API_TOKEN`: a scoped Cloudflare API token with Pages project deployment permission

The company site is separate from the Cyaraon personal-site project.
