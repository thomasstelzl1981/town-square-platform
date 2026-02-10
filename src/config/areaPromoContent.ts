/**
 * AREA PROMO CONTENT
 * 
 * Editable promotional content for each area overview page.
 * This is the first tile shown in each area's 6-tile grid.
 */

import { AreaKey } from '@/manifests/areaConfig';

import promoBaseKiDocs from '@/assets/promo-base-ki-docs.png';
import promoMissionsWebinar from '@/assets/promo-missions-webinar.png';
import promoOperationsPartner from '@/assets/promo-operations-partner.png';
import promoServicesEnergy from '@/assets/promo-services-energy.png';

export interface AreaPromoContent {
  areaKey: AreaKey;
  headline: string;
  description: string;
  ctaLabel: string;
  ctaRoute?: string;      // Internal route
  ctaUrl?: string;        // External URL
  badge?: string;         // e.g., "NEU", "WEBINAR", "AKTION"
  imageUrl?: string;      // Promotional image
}

export const areaPromoContent: Record<AreaKey, AreaPromoContent> = {
  base: {
    areaKey: 'base',
    headline: 'Neu: KI-Dokumentenerkennung',
    description: 'Dokumente werden automatisch erkannt, kategorisiert und mit Objekten verknüpft.',
    ctaLabel: 'Mehr erfahren',
    ctaRoute: '/portal/dms',
    badge: 'NEU',
    imageUrl: promoBaseKiDocs,
  },
  missions: {
    areaKey: 'missions',
    headline: 'Webinar: Erfolgreich verkaufen',
    description: 'KI-gestützte Exposés für maximale Reichweite – 15.02.2026.',
    ctaLabel: 'Anmelden',
    ctaUrl: 'https://webinar.example.com',
    badge: 'WEBINAR',
    imageUrl: promoMissionsWebinar,
  },
  operations: {
    areaKey: 'operations',
    headline: 'Partner-Bonus Februar',
    description: 'Doppelte Provision auf alle Abschlüsse in diesem Monat.',
    ctaLabel: 'Details ansehen',
    ctaRoute: '/portal/vertriebspartner/network',
    badge: 'AKTION',
    imageUrl: promoOperationsPartner,
  },
  services: {
    areaKey: 'services',
    headline: 'Armstrong Energy',
    description: 'Strom zum Börsenpreis — fair, transparent und günstig. 100% Ökostrom.',
    ctaLabel: 'Mehr erfahren',
    ctaRoute: '/portal/energy',
    badge: 'NEU',
    imageUrl: promoServicesEnergy,
  },
};
