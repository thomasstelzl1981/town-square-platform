/**
 * SEOHead — Unified SEO component for all Zone 3 brand websites.
 * Handles: document.title, meta description, OG tags, Twitter Cards,
 * canonical URLs, and JSON-LD structured data (Organization, WebPage, Service, FAQPage, Article).
 *
 * Usage:
 *   <SEOHead brand="sot" page={{ title: "...", description: "...", path: "/plattform" }} />
 */
import { useEffect } from 'react';

// ─── Brand Registry ──────────────────────────────────────────────────────────
export interface BrandSEOConfig {
  name: string;
  legalName: string;
  domain: string;
  tagline: string;
  logo: string;
  parentOrganization?: string; // legal parent brand key
  sameAs?: string[];
}

export const BRAND_SEO_CONFIG: Record<string, BrandSEOConfig> = {
  sot: {
    name: 'System of a Town',
    legalName: 'System of a Town GmbH',
    domain: 'https://systemofatown.com',
    tagline: 'Digitalisierung greifbar machen. Für Unternehmer und Vermieter.',
    logo: '/icons/sot-logo.png',
    sameAs: [],
  },
  kaufy: {
    name: 'KAUFY',
    legalName: 'KAUFY — ein Produkt der System of a Town GmbH',
    domain: 'https://kaufy.immo',
    tagline: 'KI-Plattform für Kapitalanlageimmobilien.',
    logo: '/icons/kaufy-logo.png',
    parentOrganization: 'sot',
    sameAs: [],
  },
  futureroom: {
    name: 'FutureRoom',
    legalName: 'FutureRoom GmbH',
    domain: 'https://futureroom.online',
    tagline: 'Digitale Immobilienfinanzierung.',
    logo: '/icons/futureroom-logo.png',
    sameAs: [],
  },
  acquiary: {
    name: 'ACQUIARY',
    legalName: 'ACQUIARY — ein Produkt der FutureRoom GmbH',
    domain: 'https://acquiary.com',
    tagline: 'Digitale Akquise für Immobilieninvestments.',
    logo: '/icons/acquiary-logo.png',
    parentOrganization: 'futureroom',
    sameAs: [],
  },
  lennox: {
    name: 'Lennox & Friends',
    legalName: 'Lennox & Friends',
    domain: 'https://lennoxandfriends.app',
    tagline: 'Premium Dog Resorts & Services.',
    logo: '/icons/lennox-logo.png',
    sameAs: [],
  },
  ncore: {
    name: 'Ncore Business Consulting',
    legalName: 'Ncore Business Consulting UG (haftungsbeschränkt) & Co. KG',
    domain: 'https://ncore.online',
    tagline: 'Connecting Dots. Connecting People. — Ganzheitliche Unternehmensberatung für den Mittelstand.',
    logo: '/icons/sot-logo.png',
    sameAs: [],
  },
  otto: {
    name: 'Otto² Advisory',
    legalName: 'Komplett ZL Finanzdienstleistungen GmbH',
    domain: 'https://otto2advisory.com',
    tagline: 'Erst Analyse, dann Zielbild. Finanzberatung für Unternehmer und Privathaushalte.',
    logo: '/icons/sot-logo.png',
    sameAs: [],
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────
export interface SEOPageMeta {
  title: string;
  description: string;
  path?: string;           // e.g. "/vermieter"
  ogImage?: string;        // override OG image
  ogType?: string;         // default: "website"
  noIndex?: boolean;       // exclude from indexing
  canonical?: string;      // explicit canonical override
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ServiceSchema {
  name: string;
  description: string;
  provider?: string;       // brand key, defaults to current brand
  areaServed?: string;
  url?: string;
}

export interface ArticleSchema {
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
}

export interface SEOHeadProps {
  brand: string;
  page: SEOPageMeta;
  faq?: FAQItem[];
  services?: ServiceSchema[];
  article?: ArticleSchema;
}

// ─── JSON-LD Builders ────────────────────────────────────────────────────────
function buildOrganizationLD(config: BrandSEOConfig) {
  const org: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.name,
    legalName: config.legalName,
    url: config.domain,
    logo: `${config.domain}${config.logo}`,
  };
  if (config.sameAs?.length) org.sameAs = config.sameAs;
  if (config.parentOrganization) {
    const parent = BRAND_SEO_CONFIG[config.parentOrganization];
    if (parent) {
      org.parentOrganization = {
        '@type': 'Organization',
        name: parent.name,
        url: parent.domain,
      };
    }
  }
  return org;
}

function buildWebPageLD(config: BrandSEOConfig, page: SEOPageMeta) {
  const url = page.canonical || `${config.domain}${page.path || '/'}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: config.name,
      url: config.domain,
    },
  };
}

function buildFAQPageLD(items: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

function buildServiceLD(service: ServiceSchema, brandConfig: BrandSEOConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'Organization',
      name: brandConfig.name,
      url: brandConfig.domain,
    },
    areaServed: service.areaServed || 'DE',
    url: service.url || brandConfig.domain,
  };
}

function buildArticleLD(article: ArticleSchema, brandConfig: BrandSEOConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Organization',
      name: article.author || brandConfig.name,
    },
    publisher: {
      '@type': 'Organization',
      name: brandConfig.name,
      logo: { '@type': 'ImageObject', url: `${brandConfig.domain}${brandConfig.logo}` },
    },
    image: article.image,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────
export function SEOHead({ brand, page, faq, services, article }: SEOHeadProps) {
  const config = BRAND_SEO_CONFIG[brand];

  useEffect(() => {
    if (!config) return;

    const prevTitle = document.title;
    const fullTitle = `${page.title} | ${config.name}`;
    document.title = fullTitle;

    const canonicalUrl = page.canonical || `${config.domain}${page.path || '/'}`;
    const ogImage = page.ogImage || `${config.domain}${config.logo}`;

    // ── Meta Tags ──
    const metas: HTMLMetaElement[] = [];
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
        metas.push(el);
      }
      el.content = content;
    };

    setMeta('name', 'description', page.description);
    if (page.noIndex) setMeta('name', 'robots', 'noindex, nofollow');

    // OG
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', page.description);
    setMeta('property', 'og:type', page.ogType || 'website');
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:site_name', config.name);

    // Twitter
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', page.description);
    setMeta('name', 'twitter:image', ogImage);

    // ── Canonical ──
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const createdCanonical = !canonical;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    // ── JSON-LD ──
    const ldScripts: HTMLScriptElement[] = [];
    const injectLD = (data: unknown) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
      ldScripts.push(script);
    };

    // Always: Organization + WebPage
    injectLD(buildOrganizationLD(config));
    injectLD(buildWebPageLD(config, page));

    // Conditional
    if (faq?.length) injectLD(buildFAQPageLD(faq));
    if (services?.length) {
      services.forEach((s) => {
        const providerConfig = s.provider ? BRAND_SEO_CONFIG[s.provider] || config : config;
        injectLD(buildServiceLD(s, providerConfig));
      });
    }
    if (article) injectLD(buildArticleLD(article, config));

    // ── Cleanup ──
    return () => {
      document.title = prevTitle;
      metas.forEach((el) => el.remove());
      ldScripts.forEach((el) => el.remove());
      if (createdCanonical && canonical) canonical.remove();
    };
  }, [
    brand, config,
    page.title, page.description, page.path, page.ogImage,
    page.ogType, page.noIndex, page.canonical,
    faq, services, article,
  ]);

  return null; // Helmet-style: no DOM output
}
