/**
 * WEBSITE PROFILE MANIFEST — SSOT for Manager-Module Website Templates
 * 
 * Each Manager-Module (MOD-09 to MOD-13) has exactly one Website Profile.
 * A Website = Design-Template (Optik) + Website-Profil (Inhalt/Struktur)
 * 
 * Design-Templates (modern, classic, minimal, elegant, fresh) define the visual base.
 * Website-Profiles define which section types are available and required,
 * plus sample content for AI generation.
 */

import type { SectionType } from '@/shared/website-renderer/types';

export interface WebsiteProfile {
  /** Internal profile identifier */
  profileId: string;
  /** Associated Manager-Module code */
  moduleCode: string;
  /** Human-readable name */
  displayName: string;
  /** Short description of the profile's purpose */
  description: string;
  /** Default design template ID (from designTemplates.ts) */
  defaultTemplate: string;
  /** Section types available for this profile */
  availableSections: SectionType[];
  /** Mandatory sections that must exist on every website of this profile */
  requiredSections: SectionType[];
  /** Example industries this profile serves */
  exampleIndustries: string[];
  /** Whether the booking system is available */
  bookingEnabled: boolean;
  /** Whether shop/e-commerce integration is available */
  shopEnabled: boolean;
  /** Sample content hints for AI generation (keyed by section type) */
  sampleContent: Record<string, Record<string, unknown>>;
}

// =============================================================================
// PROFILE DEFINITIONS — One per Manager-Module
// =============================================================================

export const WEBSITE_PROFILES: WebsiteProfile[] = [
  {
    profileId: 'sales_partner',
    moduleCode: 'MOD-09',
    displayName: 'Vertriebspartner',
    description: 'Immobilienmakler, Vertriebspartner und Handelsvertreter',
    defaultTemplate: 'modern',
    availableSections: [
      'hero', 'about', 'services', 'features', 'testimonials',
      'gallery', 'contact', 'footer', 'booking', 'pricing', 'team', 'catalog',
    ],
    requiredSections: ['hero', 'about', 'contact', 'footer'],
    exampleIndustries: ['Immobilienmakler', 'Vertriebspartner', 'Handelsvertreter', 'Versicherungsvermittler'],
    bookingEnabled: true,
    shopEnabled: false,
    sampleContent: {
      hero: { headline: 'Ihr Partner für erstklassige Immobilien', subline: 'Persönliche Beratung. Exklusive Objekte. Faire Konditionen.' },
      catalog: { title: 'Aktuelle Objekte', description: 'Unsere exklusiven Immobilienangebote im Überblick' },
      booking: { title: 'Beratungstermin vereinbaren', description: 'Wählen Sie Ihren Wunschtermin für ein persönliches Gespräch' },
    },
  },
  {
    profileId: 'pet_services',
    moduleCode: 'MOD-05',
    displayName: 'Haustier-Services',
    description: 'Tierpflege, Tierhandlungen, mobile Tierärzte und Pet-Services',
    defaultTemplate: 'fresh',
    availableSections: [
      'hero', 'about', 'services', 'features', 'testimonials',
      'gallery', 'contact', 'footer', 'booking', 'pricing', 'team',
    ],
    requiredSections: ['hero', 'services', 'contact', 'footer'],
    exampleIndustries: ['Tierpension', 'Hundesalon', 'Mobile Tierarztpraxis', 'Pet-Shop'],
    bookingEnabled: true,
    shopEnabled: true,
    sampleContent: {
      hero: { headline: 'Liebevolle Betreuung für Ihr Haustier', subline: 'Professionelle Services rund um Ihr Tier.' },
      services: { title: 'Unsere Leistungen', items: ['Tierpension', 'Fellpflege', 'Tierarzt-Termine'] },
    },
  },
  {
    profileId: 'finance_broker',
    moduleCode: 'MOD-11',
    displayName: 'Finanzierungsberater',
    description: 'Finanzierungsberater, Versicherungsmakler und Finanzplaner',
    defaultTemplate: 'classic',
    availableSections: [
      'hero', 'about', 'services', 'features', 'testimonials',
      'gallery', 'contact', 'footer', 'booking', 'pricing', 'team',
      'calculator', 'application',
    ],
    requiredSections: ['hero', 'about', 'services', 'contact', 'footer'],
    exampleIndustries: ['Finanzierungsberater', 'Versicherungsmakler', 'Vermögensberater', 'Baufinanzierung'],
    bookingEnabled: true,
    shopEnabled: false,
    sampleContent: {
      hero: { headline: 'Ihre Finanzierung in besten Händen', subline: 'Unabhängige Beratung. Über 400 Bankpartner. Beste Konditionen.' },
      calculator: { title: 'Finanzierungsrechner', description: 'Berechnen Sie Ihre monatliche Rate' },
      application: { title: 'Jetzt Anfrage stellen', description: 'In nur 5 Minuten zu Ihrem individuellen Angebot' },
    },
  },
  {
    profileId: 'acquisition_agent',
    moduleCode: 'MOD-12',
    displayName: 'Akquise-Dienstleister',
    description: 'Ankaufsberater, Akquise-Dienstleister und Immobiliensucher',
    defaultTemplate: 'elegant',
    availableSections: [
      'hero', 'about', 'services', 'features', 'testimonials',
      'gallery', 'contact', 'footer', 'booking', 'team', 'application',
    ],
    requiredSections: ['hero', 'about', 'services', 'contact', 'footer'],
    exampleIndustries: ['Ankaufsberater', 'Akquise-Dienstleister', 'Investment-Makler', 'Off-Market-Spezialist'],
    bookingEnabled: true,
    shopEnabled: false,
    sampleContent: {
      hero: { headline: 'Wir finden Ihr nächstes Investment', subline: 'Off-Market Zugang. Professionelle Analyse. Diskrete Abwicklung.' },
      application: { title: 'Objekt einreichen', description: 'Sie haben ein Objekt? Reichen Sie es vertraulich ein.' },
    },
  },
  {
    profileId: 'project_developer',
    moduleCode: 'MOD-13',
    displayName: 'Projektentwickler',
    description: 'Bauträger, Projektentwickler und Immobilienentwickler',
    defaultTemplate: 'modern',
    availableSections: [
      'hero', 'about', 'services', 'features', 'testimonials',
      'gallery', 'contact', 'footer', 'booking', 'pricing', 'team',
      'catalog', 'unit_list',
    ],
    requiredSections: ['hero', 'about', 'gallery', 'contact', 'footer'],
    exampleIndustries: ['Bauträger', 'Projektentwickler', 'Immobilienentwickler', 'Wohnungsbaugesellschaft'],
    bookingEnabled: true,
    shopEnabled: false,
    sampleContent: {
      hero: { headline: 'Wohnen mit Zukunft', subline: 'Moderne Neubauprojekte in bester Lage.' },
      catalog: { title: 'Unsere Projekte', description: 'Aktuelle und kommende Bauvorhaben' },
      unit_list: { title: 'Verfügbare Einheiten', description: 'Wählen Sie Ihre Wunscheinheit' },
    },
  },
];

// =============================================================================
// HELPERS
// =============================================================================

/** Get a profile by its ID */
export function getWebsiteProfile(profileId: string): WebsiteProfile | undefined {
  return WEBSITE_PROFILES.find(p => p.profileId === profileId);
}

/** Get a profile by its associated Manager-Module code */
export function getProfileByModule(moduleCode: string): WebsiteProfile | undefined {
  return WEBSITE_PROFILES.find(p => p.moduleCode === moduleCode);
}

/** Get all profile IDs */
export function getAllProfileIds(): string[] {
  return WEBSITE_PROFILES.map(p => p.profileId);
}
