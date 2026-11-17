import { defineConfig, loadEnv } from 'vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const footerPath = fileURLToPath(new URL('./src/partials/footer.html', import.meta.url));
const launchStoryPath = fileURLToPath(new URL('./src/partials/launch-story.html', import.meta.url));
const sharedFooter = {
  name: 'cyanova-shared-footer',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      return html.replace('<!-- CYANOVA:FOOTER -->', readFileSync(footerPath, 'utf8'))
        .replace('<!-- CYANOVA:LAUNCH-STORY -->', readFileSync(launchStoryPath, 'utf8'));
    },
  },
  configureServer(server) {
    server.watcher.add([footerPath, launchStoryPath]);
    server.watcher.on('change', file => { if (file === footerPath || file === launchStoryPath) server.ws.send({ type: 'full-reload' }); });
  },
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  let siteUrl;
  if (env.VITE_SITE_URL) {
    const url = new URL(env.VITE_SITE_URL);
    if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
      throw new Error('VITE_SITE_URL must be the final HTTPS website origin, for example https://example.com');
    }
    siteUrl = url.origin;
  }
  return {
    build: { rollupOptions: { input: { main: 'index.html', solutions: 'solutions.html', about: 'about.html', contact: 'contact.html' } } },
    server: { allowedHosts: ['.trycloudflare.com'] },
    preview: { allowedHosts: ['.trycloudflare.com'] },
    plugins: [sharedFooter, {
      name: 'cyanova-site-metadata',
      transformIndexHtml(html) {
        if (!siteUrl) return html;
        return html
          .replaceAll('content="/images/social-card.png"', `content="${siteUrl}/images/social-card.png"`)
          .replace('</head>', `  <link rel="canonical" href="${siteUrl}/" />\n  <meta property="og:url" content="${siteUrl}/" />\n</head>`);
      },
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}` });
        if (siteUrl) this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc></url></urlset>\n` });
      },
    }],
  };
});
