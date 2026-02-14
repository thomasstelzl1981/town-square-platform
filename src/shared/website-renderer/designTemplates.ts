/**
 * MOD-05 Website Builder — 5 Design Templates (ehemals MOD-21)
 * Standardized presets for website generation and branding
 */
import type { WebsiteBranding } from './types';

export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  preview_gradient: string;
  branding: WebsiteBranding;
  tone: string; // used in AI prompt to set writing style
}

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, professionell, viel Weißraum',
    preview_gradient: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)',
    branding: {
      primary_color: '#2563EB',
      font: 'Inter',
    },
    tone: 'Modern, clean, professionell. Kurze Sätze. Selbstbewusst und klar.',
  },
  {
    id: 'classic',
    name: 'Klassisch',
    description: 'Seriös, konservativ, vertrauenswürdig',
    preview_gradient: 'linear-gradient(135deg, #1E3A5F 0%, #C9A84C 100%)',
    branding: {
      primary_color: '#1E3A5F',
      font: 'Georgia',
    },
    tone: 'Klassisch, seriös, vertrauensvoll. Formelle Ansprache. Tradition und Qualität betonen.',
  },
  {
    id: 'minimal',
    name: 'Minimalistisch',
    description: 'Schwarz-Weiß, reduziert, fokussiert',
    preview_gradient: 'linear-gradient(135deg, #000000 0%, #4B5563 100%)',
    branding: {
      primary_color: '#000000',
      font: 'system-ui',
    },
    tone: 'Minimalistisch, auf den Punkt. Wenige Worte, maximale Wirkung. Kein Überfluss.',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Luxuriös, warm, hochwertig',
    preview_gradient: 'linear-gradient(135deg, #8B5E34 0%, #D4A574 100%)',
    branding: {
      primary_color: '#8B5E34',
      font: 'Playfair Display',
    },
    tone: 'Elegant, luxuriös, exklusiv. Emotionale Sprache. Wertigkeit und Prestige vermitteln.',
  },
  {
    id: 'fresh',
    name: 'Frisch',
    description: 'Jung, energetisch, einladend',
    preview_gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    branding: {
      primary_color: '#10B981',
      font: 'Poppins',
    },
    tone: 'Frisch, jung, dynamisch. Lockere Sprache. Begeisterung und Energie ausstrahlen.',
  },
];

export const DEFAULT_TEMPLATE_ID = 'modern';

export function getTemplate(id: string): DesignTemplate {
  return DESIGN_TEMPLATES.find(t => t.id === id) || DESIGN_TEMPLATES[0];
}
