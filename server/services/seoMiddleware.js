import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { SITE_CONFIG, SEO_PAGES, ARTICLES, generateSchema } from '../../src/data/seoData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const publicDir = path.resolve(projectRoot, 'public');
const distDir = path.resolve(projectRoot, 'dist');

/**
 * Resolves static SEO files (robots.txt, sitemap.xml, verification files)
 */
export function serveSeoFiles(req, res, next) {
  const p = req.path;

  if (p === '/robots.txt') {
    const robotsPath = fs.existsSync(path.join(distDir, 'robots.txt'))
      ? path.join(distDir, 'robots.txt')
      : path.join(publicDir, 'robots.txt');

    if (fs.existsSync(robotsPath)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.sendFile(robotsPath);
    }
  }

  if (p === '/sitemap.xml') {
    const sitemapPath = fs.existsSync(path.join(distDir, 'sitemap.xml'))
      ? path.join(distDir, 'sitemap.xml')
      : path.join(publicDir, 'sitemap.xml');

    if (fs.existsSync(sitemapPath)) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.sendFile(sitemapPath);
    }
  }

  if (p === '/googlec67d2c782091689d.html') {
    const verifyPath = fs.existsSync(path.join(distDir, 'googlec67d2c782091689d.html'))
      ? path.join(distDir, 'googlec67d2c782091689d.html')
      : path.join(publicDir, 'googlec67d2c782091689d.html');

    if (fs.existsSync(verifyPath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.sendFile(verifyPath);
    }
    return res.type('text/html').send('google-site-verification: googlec67d2c782091689d.html');
  }

  next();
}

/**
 * Look up metadata for a given path
 */
export function getSeoMetadataForPath(reqPath) {
  const cleanPath = reqPath.split('?')[0].replace(/\/+$/, '') || '/';

  // Check exact landing pages
  for (const [key, page] of Object.entries(SEO_PAGES)) {
    if (page.path === cleanPath || (cleanPath === '/analyzer' && page.path === '/instagram-profile-analyzer')) {
      return {
        key,
        page,
        article: null
      };
    }
  }

  // Check resource articles
  if (cleanPath.startsWith('/resources/')) {
    const slug = cleanPath.replace('/resources/', '');
    const article = ARTICLES.find((a) => a.slug === slug);
    if (article) {
      return {
        key: 'article',
        page: {
          title: `${article.title} | ${SITE_CONFIG.name}`,
          description: article.description,
          canonical: `${SITE_CONFIG.siteUrl}${article.path}`,
          breadcrumb: article.breadcrumb,
          primaryKeyword: article.primaryKeyword
        },
        article
      };
    }
  }

  // Default fallback to home
  return {
    key: 'home',
    page: SEO_PAGES.home,
    article: null
  };
}

/**
 * Dynamically injects route-specific SEO tags and JSON-LD schema into index.html
 */
export function injectSeoIntoHtml(rawHtml, reqPath) {
  const { key, page, article } = getSeoMetadataForPath(reqPath);
  let html = rawHtml;

  const title = page.title || SITE_CONFIG.defaultTitle;
  const description = page.description || SITE_CONFIG.defaultDescription;
  const canonical = page.canonical || `${SITE_CONFIG.siteUrl}${reqPath}`;
  const isNoindex = Boolean(page.noindex);

  // 1. Replace <title>
  html = html.replace(/<title>.*?<\/title>/is, `<title>${escapeHtml(title)}</title>`);

  // 2. Replace meta description
  html = html.replace(
    /<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/is,
    `<meta name="description" content="${escapeHtml(description)}" />`
  );

  // 3. Replace or inject canonical
  if (html.includes('rel="canonical"')) {
    html = html.replace(
      /<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/is,
      `<link rel="canonical" href="${escapeHtml(canonical)}" />`
    );
  }

  // 4. Update robots directive if noindex
  if (isNoindex) {
    html = html.replace(
      /<meta\s+name=["']robots["']\s+content=["'].*?["']\s*\/?>/is,
      `<meta name="robots" content="noindex, nofollow" />`
    );
  }

  // 5. Update Open Graph tags
  html = html.replace(
    /<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/is,
    `<meta property="og:title" content="${escapeHtml(title)}" />`
  );
  html = html.replace(
    /<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/is,
    `<meta property="og:description" content="${escapeHtml(description)}" />`
  );
  html = html.replace(
    /<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/is,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`
  );

  // 6. Update Twitter Card tags
  html = html.replace(
    /<meta\s+name=["']twitter:title["']\s+content=["'].*?["']\s*\/?>/is,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`
  );
  html = html.replace(
    /<meta\s+name=["']twitter:description["']\s+content=["'].*?["']\s*\/?>/is,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`
  );

  // 7. Generate and replace JSON-LD Structured Data
  const schemaList = generateSchema(key, { article, breadcrumb: page.breadcrumb });
  const schemaJson = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@graph': schemaList
    },
    null,
    2
  );

  html = html.replace(
    /<script\s+type=["']application\/ld\+json["']\s+id=["']seo-schema-root["']>.*?<\/script>/is,
    `<script type="application/ld+json" id="seo-schema-root">\n${schemaJson}\n    </script>`
  );

  return html;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
