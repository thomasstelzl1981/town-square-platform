/**
 * Brand Favicon Registry — Dynamischer Favicon + Tab-Titel pro Marke
 * 
 * Generiert SVG-Favicons programmatisch (Buchstabe auf farbigem Kreis).
 * SSOT für alle Zone 2 + Zone 3 Brands.
 */

export interface BrandFaviconEntry {
  /** Buchstabe(n) im Favicon */
  letter: string;
  /** Hintergrundfarbe (hex) */
  bgColor: string;
  /** Tab-Titel */
  title: string;
  /** Kurzbeschreibung neben dem Titel */
  description: string;
}

export const BRAND_FAVICON_REGISTRY: Record<string, BrandFaviconEntry> = {
  armstrong: {
    letter: 'A',
    bgColor: '#0a1628',
    title: 'Armstrong',
    description: 'Dein digitales Cockpit',
  },
  kaufy: {
    letter: 'K',
    bgColor: '#D4A843',
    title: 'KAUFY',
    description: 'KI-Plattform für Kapitalanlageimmobilien',
  },
  futureroom: {
    letter: 'F',
    bgColor: '#1a3a2a',
    title: 'FutureRoom',
    description: 'Digitale Immobilienfinanzierung',
  },
  acquiary: {
    letter: 'A',
    bgColor: '#0B1120',
    title: 'ACQUIARY',
    description: 'Digitale Akquise für Investments',
  },
  lennox: {
    letter: 'L',
    bgColor: '#2D4A3E',
    title: 'Lennox & Friends',
    description: 'Premium Dog Resorts & Services',
  },
  sot: {
    letter: 'S',
    bgColor: '#1E293B',
    title: 'System of a Town',
    description: 'Digitalisierung greifbar machen',
  },
  ncore: {
    letter: 'N',
    bgColor: '#0F172A',
    title: 'Ncore',
    description: 'Ganzheitliche Unternehmensberatung',
  },
  otto: {
    letter: 'O²',
    bgColor: '#0055A4',
    title: 'Otto² Advisory',
    description: 'Finanzberatung für Unternehmer',
  },
  zlwohnbau: {
    letter: 'ZL',
    bgColor: '#C41E3A',
    title: 'ZL Wohnbau',
    description: 'Wohnraum für Mitarbeiter',
  },
};

/**
 * Generates an inline SVG data-URI favicon: white letter on colored circle.
 */
function generateSvgFavicon(letter: string, bgColor: string): string {
  // For multi-char letters (O², ZL), use smaller font
  const fontSize = letter.length > 1 ? 12 : 14;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="16" fill="${bgColor}"/>
    <text x="16" y="16" text-anchor="middle" dominant-baseline="central"
          font-family="system-ui,-apple-system,sans-serif" font-weight="700"
          font-size="${fontSize}" fill="white">${letter}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Applies brand-specific favicon and document.title.
 * Call once per layout mount. Returns cleanup function.
 */
export function applyBrandFavicon(siteKey: string): () => void {
  const entry = BRAND_FAVICON_REGISTRY[siteKey];
  if (!entry) return () => {};

  const prevTitle = document.title;
  const prevHref = getFaviconElement()?.getAttribute('href') || '/icons/icon-192.png';

  // Set favicon
  const faviconEl = getFaviconElement(true);
  if (faviconEl) {
    faviconEl.setAttribute('type', 'image/svg+xml');
    faviconEl.setAttribute('href', generateSvgFavicon(entry.letter, entry.bgColor));
  }

  // Set title (description appended)
  document.title = `${entry.title} — ${entry.description}`;

  // Cleanup: restore previous state
  return () => {
    document.title = prevTitle;
    if (faviconEl) {
      faviconEl.setAttribute('href', prevHref);
      faviconEl.setAttribute('type', 'image/png');
    }
  };
}

/**
 * Gets or creates the <link rel="icon"> element.
 */
function getFaviconElement(createIfMissing = false): HTMLLinkElement | null {
  let el = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
  if (!el && createIfMissing) {
    el = document.createElement('link');
    el.rel = 'icon';
    document.head.appendChild(el);
  }
  return el;
}
