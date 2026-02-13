import { useEffect } from 'react';

interface DocumentMetaOptions {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogUrl?: string;
  ogImage?: string;
  canonical?: string;
}

/**
 * Lightweight SEO hook — sets document.title and meta tags.
 * Cleans up on unmount to avoid stale meta tags.
 */
export function useDocumentMeta(options: DocumentMetaOptions) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = options.title;

    const metaTags: HTMLMetaElement[] = [];

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
        metaTags.push(el);
      }
      el.content = content;
    };

    setMeta('description', options.description);
    setMeta('og:title', options.ogTitle || options.title, true);
    setMeta('og:description', options.ogDescription || options.description, true);
    setMeta('og:type', options.ogType || 'website', true);
    if (options.ogUrl) setMeta('og:url', options.ogUrl, true);
    if (options.ogImage) setMeta('og:image', options.ogImage, true);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const createdCanonical = !canonical;
    if (options.canonical) {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = options.canonical;
    }

    return () => {
      document.title = prevTitle;
      metaTags.forEach(el => el.remove());
      if (createdCanonical && canonical) canonical.remove();
    };
  }, [options.title, options.description, options.ogTitle, options.ogDescription, options.ogType, options.ogUrl, options.ogImage, options.canonical]);
}
