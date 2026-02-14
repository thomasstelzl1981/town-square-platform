/**
 * MOD-05 Website Builder — Shared Types (ehemals MOD-21)
 * Used by Zone 2 (Preview) and Zone 3 (Public Renderer)
 */

export interface SectionContent {
  [key: string]: unknown;
}

export interface SectionDesign {
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  [key: string]: unknown;
}

export interface WebsiteSection {
  id: string;
  section_type: SectionType;
  sort_order: number;
  content_json: SectionContent;
  design_json: SectionDesign;
  is_visible: boolean;
}

export interface WebsitePage {
  id: string;
  slug: string;
  title: string;
  sort_order: number;
  sections: WebsiteSection[];
}

export interface WebsiteBranding {
  primary_color?: string;
  font?: string;
  logo_url?: string;
  favicon_url?: string;
}

export interface WebsiteSeo {
  title?: string;
  description?: string;
  og_image?: string;
}

export interface WebsiteSnapshot {
  pages: WebsitePage[];
  branding: WebsiteBranding;
  seo: WebsiteSeo;
}

export const SECTION_TYPES = [
  'hero',
  'features',
  'about',
  'services',
  'testimonials',
  'gallery',
  'contact',
  'footer',
] as const;

export type SectionType = typeof SECTION_TYPES[number];

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  hero: 'Hero-Banner',
  features: 'Features',
  about: 'Über uns',
  services: 'Leistungen',
  testimonials: 'Kundenstimmen',
  gallery: 'Galerie',
  contact: 'Kontaktformular',
  footer: 'Footer',
};
