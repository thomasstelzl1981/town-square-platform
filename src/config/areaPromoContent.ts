/**
 * AREA PROMO CONTENT
 * 
 * Editable promotional content for each area overview page.
 * This is the first tile shown in each area's 6-tile grid.
 */

import { AreaKey } from '@/manifests/areaConfig';

export interface AreaPromoContent {
  areaKey: AreaKey;
  headline: string;
  description: string;
  ctaLabel: string;
  ctaRoute?: string;      // Internal route
  ctaUrl?: string;        // External URL
  badge?: string;         // e.g., "NEU", "WEBINAR", "AKTION"
}

export const areaPromoContent: Record<AreaKey, AreaPromoContent> = {
  base: {
    areaKey: 'base',
    headline: 'Neu: KI-Dokumentenerkennung',
    description: 'Dokumente werden automatisch erkannt, kategorisiert und mit Objekten verknüpft.',
    ctaLabel: 'Mehr erfahren',
    ctaRoute: '/portal/dms',
    badge: 'NEU',
  },
  missions: {
    areaKey: 'missions',
    headline: 'Webinar: Erfolgreich verkaufen',
    description: 'KI-gestützte Exposés für maximale Reichweite – 15.02.2026.',
    ctaLabel: 'Anmelden',
    ctaUrl: 'https://webinar.example.com',
    badge: 'WEBINAR',
  },
  operations: {
    areaKey: 'operations',
    headline: 'Partner-Bonus Februar',
    description: 'Doppelte Provision auf alle Abschlüsse in diesem Monat.',
    ctaLabel: 'Details ansehen',
    ctaRoute: '/portal/vertriebspartner/network',
    badge: 'AKTION',
  },
  services: {
    areaKey: 'services',
    headline: 'PV-Offensive 2026',
    description: '20% Rabatt auf Solar-Beratungen – nur noch bis Ende März.',
    ctaLabel: 'Jetzt sichern',
    ctaRoute: '/portal/photovoltaik',
    badge: 'AKTION',
  },
};
