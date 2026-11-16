import { defineConfig, loadEnv } from 'vite';

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
    server: { allowedHosts: ['.trycloudflare.com'] },
    preview: { allowedHosts: ['.trycloudflare.com'] },
    plugins: [{
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
