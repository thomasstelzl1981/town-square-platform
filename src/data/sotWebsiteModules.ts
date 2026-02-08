/**
 * SoT Website Module Data — For Marketing Display
 * 
 * Shows all modules EXCEPT:
 * - MOD-09 Vertriebspartner (KAUFY-specific)
 * - MOD-11 Finanzierungsmanager (FUTUREROOM-specific)
 * - MOD-12 Akquise-Manager (ACQUIARY-specific)
 */

export interface SotWebsiteModule {
  code: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  icon: string;
  category: 'foundation' | 'management' | 'transactions' | 'growth';
  highlight?: boolean;
}

export const SOT_WEBSITE_MODULES: SotWebsiteModule[] = [
  // FOUNDATION
  {
    code: 'MOD-01',
    name: 'Stammdaten',
    tagline: 'Struktur für alle Ihre Daten',
    description: 'Verwalten Sie Profile, Kontakte und Organisationen an einem Ort. Definieren Sie Rollen und laden Sie Ihr Team ein.',
    features: ['Profil verwalten', 'Kontakte kategorisieren', 'Team einladen', 'Rollen zuweisen'],
    icon: 'Users',
    category: 'foundation',
  },
  {
    code: 'MOD-02',
    name: 'KI Office',
    tagline: 'Ihr intelligenter Assistent',
    description: 'E-Mails generieren, Briefe erstellen, Termine koordinieren — mit KI-Unterstützung für schnellere Ergebnisse.',
    features: ['E-Mails generieren', 'Briefe erstellen', 'Kalender', 'Aufgaben priorisieren'],
    icon: 'Sparkles',
    category: 'foundation',
    highlight: true,
  },
  {
    code: 'MOD-03',
    name: 'DMS',
    tagline: 'Dokumente zentral verwalten',
    description: 'Posteingang, Kategorisierung und Volltextsuche. Alle Dokumente strukturiert und jederzeit auffindbar.',
    features: ['Posteingang', 'Kategorisierung', 'Volltextsuche', 'Freigaben & Sharing'],
    icon: 'FolderOpen',
    category: 'foundation',
  },
  
  // MANAGEMENT
  {
    code: 'MOD-04',
    name: 'Immobilien',
    tagline: 'Portfolio-Management',
    description: 'Die Immobilienakte: Stammdaten, Grundbuch, Mietverträge, Dokumente. Alles an einem Ort — strukturiert und vollständig.',
    features: ['Portfolio-Übersicht', 'Objektakte', 'Einheiten', 'Exposé-Erstellung'],
    icon: 'Building2',
    category: 'management',
    highlight: true,
  },
  {
    code: 'MOD-05',
    name: 'Mietverwaltung',
    tagline: 'Vermietung professionell steuern',
    description: 'Mieterübersicht, Mieteingang, Vermietungsprozesse und Nebenkostenabrechnung — alles digitalisiert.',
    features: ['Mieterübersicht', 'Mieteingang', 'Vermietung', 'Nebenkostenabrechnung'],
    icon: 'FileText',
    category: 'management',
  },
  {
    code: 'MOD-13',
    name: 'Projekte',
    tagline: 'Projektmanagement',
    description: 'Übersicht, Timeline und Dokumente für Ihre Bau- und Entwicklungsprojekte.',
    features: ['Projektübersicht', 'Timeline', 'Dokumente', 'Meilensteine'],
    icon: 'FolderKanban',
    category: 'management',
  },
  {
    code: 'MOD-16',
    name: 'Buchhaltung',
    tagline: 'Finanzen im Blick',
    description: 'Konten, Buchungen und Auswertungen für Ihre Immobilienbuchhaltung nach SKR04.',
    features: ['Kontenrahmen', 'Buchungen', 'Auswertungen', 'Export'],
    icon: 'Calculator',
    category: 'management',
  },
  
  // TRANSACTIONS
  {
    code: 'MOD-06',
    name: 'Verkauf',
    tagline: 'Verkaufsprozess steuern',
    description: 'Inserate erstellen, Anfragen managen, Reservierungen dokumentieren — bis zum Notartermin.',
    features: ['Inserate erstellen', 'Anfragen verwalten', 'Reservierungen', 'Verkaufsdokumentation'],
    icon: 'Tag',
    category: 'transactions',
  },
  {
    code: 'MOD-07',
    name: 'Finanzierung',
    tagline: 'Bankfertig in Minuten',
    description: 'Selbstauskunft erfassen, Dokumente bündeln, strukturiert an Banken übergeben. Vollständig und professionell.',
    features: ['Selbstauskunft', 'Dokumentenpaket', 'Anfrage stellen', 'Status verfolgen'],
    icon: 'Landmark',
    category: 'transactions',
    highlight: true,
  },
  {
    code: 'MOD-08',
    name: 'Investment-Suche',
    tagline: 'Neue Objekte finden',
    description: 'Durchsuchen Sie den Markt nach Kapitalanlagen. Renditeberechnung, Favoriten und Suchaufträge.',
    features: ['Multi-Source-Suche', 'Favoriten', 'Renditeberechnung', 'Suchaufträge'],
    icon: 'Search',
    category: 'transactions',
  },
  
  // GROWTH
  {
    code: 'MOD-10',
    name: 'Leads',
    tagline: 'Interessenten managen',
    description: 'Lead-Inbox, Pipeline-Übersicht und Kampagnensteuerung für Ihre Vermarktung.',
    features: ['Inbox', 'Pipeline', 'Qualifizierung', 'Kampagnen'],
    icon: 'Target',
    category: 'growth',
  },
  {
    code: 'MOD-14',
    name: 'Kommunikation Pro',
    tagline: 'Serien-Kommunikation',
    description: 'E-Mail-Sequenzen und automatisierte Kommunikation für professionelles Marketing.',
    features: ['E-Mail-Serien', 'Templates', 'Automatisierung', 'Tracking'],
    icon: 'Mail',
    category: 'growth',
  },
  {
    code: 'MOD-17',
    name: 'Fahrzeuge',
    tagline: 'Fuhrpark verwalten',
    description: 'Fahrzeugverwaltung, Wartung und Kosten für Ihre Unternehmensflotte.',
    features: ['Fahrzeugübersicht', 'Wartung', 'Kosten', 'Termine'],
    icon: 'Car',
    category: 'growth',
  },
  {
    code: 'MOD-20',
    name: 'Miety',
    tagline: 'Mieterportal',
    description: 'Self-Service-Portal für Ihre Mieter: Dokumente, Anfragen, Kommunikation.',
    features: ['Dokumente', 'Anfragen', 'Kommunikation', 'Self-Service'],
    icon: 'Home',
    category: 'growth',
  },
];

export const MODULE_CATEGORIES = {
  foundation: {
    label: 'Foundation',
    description: 'Die Basis für alle Prozesse',
  },
  management: {
    label: 'Management',
    description: 'Immobilien & Projekte verwalten',
  },
  transactions: {
    label: 'Transaktionen',
    description: 'Kaufen, Verkaufen, Finanzieren',
  },
  growth: {
    label: 'Growth',
    description: 'Marketing & Skalierung',
  },
};

/**
 * Get featured modules for homepage
 */
export function getFeaturedModules(): SotWebsiteModule[] {
  return SOT_WEBSITE_MODULES.filter(m => m.highlight);
}

/**
 * Get modules by category
 */
export function getModulesByCategory(category: SotWebsiteModule['category']): SotWebsiteModule[] {
  return SOT_WEBSITE_MODULES.filter(m => m.category === category);
}