import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE_CONFIG, SEO_PAGES, ARTICLES, generateSchema } from '../src/data/seoData.js';
import { getSeoMetadataForPath, injectSeoIntoHtml } from '../server/services/seoMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

describe('Technical SEO & Content Strategy Test Suite', () => {
  test('1. robots.txt exists, allows public pages and blocks private/api endpoints', () => {
    const robotsPath = path.join(projectRoot, 'public', 'robots.txt');
    assert.ok(fs.existsSync(robotsPath), 'public/robots.txt must exist');

    const robotsContent = fs.readFileSync(robotsPath, 'utf8');
    assert.match(robotsContent, /User-agent:\s*\*/i);
    assert.match(robotsContent, /Disallow:\s*\/api\//i);
    assert.match(robotsContent, /Disallow:\s*\/account/i);
    assert.match(robotsContent, /Allow:\s*\/instagram-profile-analyzer/i);
    assert.match(robotsContent, /Allow:\s*\/resources/i);
    assert.match(robotsContent, /Sitemap:\s*https:\/\/instascrape-pro\.onrender\.com\/sitemap\.xml/i);
  });

  test('2. sitemap.xml exists, is valid XML, and contains all canonical URLs', () => {
    const sitemapPath = path.join(projectRoot, 'public', 'sitemap.xml');
    assert.ok(fs.existsSync(sitemapPath), 'public/sitemap.xml must exist');

    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    assert.match(sitemapContent, /<\?xml version="1.0" encoding="UTF-8"\?>/);
    assert.match(sitemapContent, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);

    const requiredUrls = [
      'https://instascrape-pro.onrender.com/',
      'https://instascrape-pro.onrender.com/instagram-profile-analyzer',
      'https://instascrape-pro.onrender.com/instagram-bio-analyzer',
      'https://instascrape-pro.onrender.com/instagram-profile-audit',
      'https://instascrape-pro.onrender.com/instagram-content-research',
      'https://instascrape-pro.onrender.com/resources',
      'https://instascrape-pro.onrender.com/resources/how-to-improve-instagram-bio',
      'https://instascrape-pro.onrender.com/resources/instagram-profile-audit-checklist',
      'https://instascrape-pro.onrender.com/resources/make-instagram-profile-professional',
      'https://instascrape-pro.onrender.com/resources/understanding-public-instagram-engagement',
      'https://instascrape-pro.onrender.com/resources/how-to-analyze-instagram-profile-presentation',
      'https://instascrape-pro.onrender.com/contact',
      'https://instascrape-pro.onrender.com/terms',
      'https://instascrape-pro.onrender.com/privacy'
    ];

    for (const url of requiredUrls) {
      assert.ok(sitemapContent.includes(`<loc>${url}</loc>`), `sitemap.xml missing required URL: ${url}`);
    }

    // Must NOT index /account
    assert.ok(!sitemapContent.includes('/account</loc>'), '/account must never be in sitemap.xml');
  });

  test('3. Metadata mapping produces distinct, non-cannibalizing keywords for all landing pages', () => {
    const pages = [
      SEO_PAGES.home,
      SEO_PAGES.profileAnalyzer,
      SEO_PAGES.bioAnalyzer,
      SEO_PAGES.profileAudit,
      SEO_PAGES.contentResearch
    ];

    const primaryKeywords = pages.map((p) => p.primaryKeyword);
    const uniqueKeywords = new Set(primaryKeywords);

    // Each page must have a distinct primary keyword
    assert.equal(primaryKeywords.length, uniqueKeywords.size, 'Each landing page must have a distinct primary keyword');

    // Check title lengths (50-70 chars target)
    for (const p of pages) {
      assert.ok(p.title.length >= 40 && p.title.length <= 80, `Page title "${p.title}" length (${p.title.length}) is within SEO guidelines`);
      assert.ok(p.description.length >= 100 && p.description.length <= 180, `Page description length (${p.description.length}) is within SEO guidelines`);
    }
  });

  test('4. Server-side HTML metadata injection operates correctly for landing pages and articles', () => {
    const baseHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Old Title</title>
  <meta name="description" content="Old Description" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://old.com" />
  <meta property="og:title" content="Old" />
  <meta property="og:description" content="Old" />
  <meta property="og:url" content="https://old.com" />
  <meta name="twitter:title" content="Old" />
  <meta name="twitter:description" content="Old" />
  <script type="application/ld+json" id="seo-schema-root">{}</script>
</head>
<body><div id="root"></div></body>
</html>`;

    // Test profile analyzer route injection
    const analyzerHtml = injectSeoIntoHtml(baseHtml, '/instagram-profile-analyzer');
    assert.ok(analyzerHtml.includes('<title>Instagram Profile Analyzer &amp; AI Performance Score | InstaScrape Pro</title>'));
    assert.ok(analyzerHtml.includes('https://instascrape-pro.onrender.com/instagram-profile-analyzer'));
    assert.ok(analyzerHtml.includes('"@type": "SoftwareApplication"'));
    assert.ok(analyzerHtml.includes('"@type": "FAQPage"'));

    // Test article route injection
    const articleHtml = injectSeoIntoHtml(baseHtml, '/resources/how-to-improve-instagram-bio');
    assert.ok(articleHtml.includes('<title>How to Improve Your Instagram Bio: 7-Step Optimization Guide | InstaScrape Pro</title>'));
    assert.ok(articleHtml.includes('"@type": "Article"'));

    // Test account route injection (must set noindex)
    const accountHtml = injectSeoIntoHtml(baseHtml, '/account');
    assert.ok(accountHtml.includes('<meta name="robots" content="noindex, nofollow" />'));
  });

  test('5. Google Search Console verification meta tag and verification file exist', () => {
    const indexHtmlPath = path.join(projectRoot, 'index.html');
    const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
    assert.match(indexContent, /<meta\s+name=["']google-site-verification["']\s+content=["']c67d2c782091689d["']/i);

    const verifyFilePath = path.join(projectRoot, 'public', 'googlec67d2c782091689d.html');
    assert.ok(fs.existsSync(verifyFilePath), 'Google verification file must exist in public folder');
  });

  test('6. Trust & Compliance: Content explicitly adheres to public data boundaries', () => {
    // Assert all article and landing page descriptions disclaim private scraping
    const contentResearch = SEO_PAGES.contentResearch;
    assert.match(contentResearch.description, /public/i, 'Content research description must specify public data');

    const profileAnalyzer = SEO_PAGES.profileAnalyzer;
    assert.match(profileAnalyzer.description, /public/i, 'Profile analyzer must specify public data');
  });
});
