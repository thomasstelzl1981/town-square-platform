/**
 * MOD-05 Website Builder — Static Demo Sections for "Muster GmbH"
 * Provides realistic preview data without DB queries
 */
import type { WebsiteSection } from '@/shared/website-renderer/types';

export const DEMO_SECTIONS: WebsiteSection[] = [
  {
    id: 'demo-hero',
    section_type: 'hero',
    sort_order: 0,
    is_visible: true,
    content_json: {
      headline: 'Ihr Partner für Immobilieninvestments',
      subline: 'Professionelle Beratung und exklusive Objekte für Kapitalanleger in ganz Deutschland.',
      cta_text: 'Kontakt aufnehmen',
      cta_link: '#contact',
      background_image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
      overlay_opacity: 0.5,
    },
    design_json: {},
  },
  {
    id: 'demo-features',
    section_type: 'features',
    sort_order: 1,
    is_visible: true,
    content_json: {
      title: 'Unsere Stärken',
      items: [
        { icon: '🏢', title: 'Exklusive Objekte', description: 'Zugang zu Off-Market Immobilien und Portfolios ab 500.000 €.' },
        { icon: '📊', title: 'Datengetriebene Analyse', description: 'Fundierte Standort- und Renditeanalysen für jede Investitionsentscheidung.' },
        { icon: '🤝', title: 'Persönliche Betreuung', description: 'Ein fester Ansprechpartner von der Erstberatung bis zum Notartermin.' },
      ],
    },
    design_json: {},
  },
  {
    id: 'demo-about',
    section_type: 'about',
    sort_order: 2,
    is_visible: true,
    content_json: {
      title: 'Über die Muster GmbH',
      text: 'Seit 2010 begleiten wir Kapitalanleger und Family Offices bei der Akquisition von Wohn- und Gewerbeimmobilien. Unser Team aus erfahrenen Immobilienökonomen verbindet Marktkenntnis mit modernster Datenanalyse.',
      image_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80',
    },
    design_json: {},
  },
  {
    id: 'demo-services',
    section_type: 'services',
    sort_order: 3,
    is_visible: true,
    content_json: {
      title: 'Unsere Leistungen',
      items: [
        { icon: '🔍', title: 'Objektsuche', description: 'Bundesweite Suche nach Ihren Kriterien.' },
        { icon: '📋', title: 'Due Diligence', description: 'Umfassende Prüfung aller relevanten Unterlagen.' },
        { icon: '💼', title: 'Transaktionsbegleitung', description: 'Professionelle Abwicklung bis zum Closing.' },
        { icon: '📈', title: 'Asset Management', description: 'Laufende Optimierung Ihres Portfolios.' },
      ],
    },
    design_json: {},
  },
  {
    id: 'demo-testimonials',
    section_type: 'testimonials',
    sort_order: 4,
    is_visible: true,
    content_json: {
      title: 'Das sagen unsere Kunden',
      items: [
        { name: 'Thomas K.', quote: 'Hervorragende Beratung und ein reibungsloser Ablauf. Unsere Renditeerwartungen wurden übertroffen.', role: 'Privatinvestor' },
        { name: 'Dr. Sarah M.', quote: 'Professionell, transparent und immer erreichbar. So macht Immobilieninvestment Spaß.', role: 'Family Office' },
      ],
    },
    design_json: {},
  },
  {
    id: 'demo-contact',
    section_type: 'contact',
    sort_order: 5,
    is_visible: true,
    content_json: {
      title: 'Kontakt',
      subtitle: 'Wir freuen uns auf Ihre Anfrage.',
    },
    design_json: {},
  },
  {
    id: 'demo-footer',
    section_type: 'footer',
    sort_order: 6,
    is_visible: true,
    content_json: {
      company_name: 'Muster GmbH',
      impressum_url: '/impressum',
      datenschutz_url: '/datenschutz',
    },
    design_json: {},
  },
];

export const DEMO_BRANDING = {
  primary_color: '#2563EB',
  font: 'Inter',
  template_id: 'modern',
};
