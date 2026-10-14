import { useEffect } from 'react';
import { SITE_CONFIG, generateSchema } from '../data/seoData.js';

/**
 * useDocumentHead hook
 * Updates document.title, meta tags, canonical link, and JSON-LD structured data on route changes.
 */
export function useDocumentHead({
  title,
  description,
  canonical,
  noindex = false,
  pageKey,
  extraSchemaData
}) {
  useEffect(() => {
    // 1. Update Title
    const finalTitle = title || SITE_CONFIG.defaultTitle;
    document.title = finalTitle;

    // 2. Update Meta Description
    const finalDescription = description || SITE_CONFIG.defaultDescription;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = finalDescription;

    // 3. Update Robots Directive
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      document.head.appendChild(metaRobots);
    }
    metaRobots.content = noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

    // 4. Update Canonical Link
    const finalCanonical = canonical || `${SITE_CONFIG.siteUrl}${window.location.pathname}`;
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.rel = 'canonical';
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.href = finalCanonical;

    // 5. Update Open Graph Tags
    updateMetaProperty('og:title', finalTitle);
    updateMetaProperty('og:description', finalDescription);
    updateMetaProperty('og:url', finalCanonical);

    // 6. Update Twitter Card Tags
    updateMetaName('twitter:title', finalTitle);
    updateMetaName('twitter:description', finalDescription);

    // 7. Update JSON-LD Structured Data
    if (pageKey) {
      const schemas = generateSchema(pageKey, extraSchemaData);
      let schemaScript = document.getElementById('seo-schema-root');
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = 'seo-schema-root';
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': schemas
      });
    }

    // Scroll to top on navigation change
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [title, description, canonical, noindex, pageKey, extraSchemaData]);
}

function updateMetaProperty(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.content = content;
}

function updateMetaName(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}
