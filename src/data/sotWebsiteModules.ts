/**
 * SoT Website Module Data — For Marketing Display
 * 
 * Shows all modules EXCEPT:
 * - MOD-09 Vertriebspartner (KAUFY-specific)
 * - MOD-10 Leads (KAUFY-specific)
 * - MOD-11 Finanzierungsmanager (FUTUREROOM-specific)
 * - MOD-12 Akquise-Manager (ACQUIARY-specific)
 */

export interface SotWebsiteModule {
  code: string;
  name: string;
  tagline: string;
  description: string;
  painPoints: string[]; // Real problems we solve
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
    tagline: 'Alle Kontakte. Ein System.',
    description: 'Schluss mit Excel-Listen und verstreuten Kontakten. Verwalten Sie Profile, Mieter, Dienstleister und Partner zentral — synchronisiert mit Gmail, IMAP oder Microsoft.',
    painPoints: [
      'Kontakte in 5 verschiedenen Apps verteilt',
      'Keine Übersicht wer zu welcher Immobilie gehört',
      'Veraltete Telefonnummern und E-Mails',
    ],
    features: ['Profil verwalten', 'Kontakte kategorisieren', 'Team einladen', 'Rollen zuweisen', 'Sync mit Gmail/Outlook'],
    icon: 'Users',
    category: 'foundation',
  },
  {
    code: 'MOD-02',
    name: 'KI Office',
    tagline: 'Ihr intelligenter Assistent',
    description: 'Armstrong schreibt Ihre E-Mails, erstellt Briefe, koordiniert Termine und priorisiert Aufgaben. Mit den besten KI-Modellen der Welt — Google Gemini und OpenAI GPT.',
    painPoints: [
      'Stunden für Mieterbriefe verschwendet',
      'Termine vergessen oder überlappen',
      'Aufgaben stapeln sich ohne Priorisierung',
    ],
    features: ['E-Mails generieren', 'Briefe erstellen', 'Kalender', 'Aufgaben priorisieren', 'Web-Research'],
    icon: 'Sparkles',
    category: 'foundation',
    highlight: true,
  },
  {
    code: 'MOD-03',
    name: 'DMS',
    tagline: 'Dokumente finden. Nicht suchen.',
    description: 'Posteingang, automatische Kategorisierung und Volltextsuche. Alle Dokumente strukturiert und in Sekunden auffindbar — nicht in Ordnern vergraben.',
    painPoints: [
      'Mietverträge in 10 Ordnern verteilt',
      'Stunden mit Dokumentensuche verloren',
      'Keine Übersicht über eingegangene Post',
    ],
    features: ['Posteingang', 'Auto-Kategorisierung', 'Volltextsuche', 'Freigaben & Sharing', 'OCR-Erkennung'],
    icon: 'FolderOpen',
    category: 'foundation',
  },
  
  // MANAGEMENT
  {
    code: 'MOD-04',
    name: 'Immobilien',
    tagline: 'Ihr Portfolio. Komplett digital.',
    description: 'Die digitale Immobilienakte: Stammdaten, Grundbuch, Mietverträge, Fotos, Dokumente. Alles an einem Ort — strukturiert, vollständig und immer aktuell.',
    painPoints: [
      'Kein Überblick über das Gesamtportfolio',
      'Grundbuchdaten in Papierform irgendwo',
      'Keine strukturierte Objektdokumentation',
    ],
    features: ['Portfolio-Übersicht', 'Objektakte', 'Einheiten-Verwaltung', 'Exposé-Erstellung', 'Karten-Ansicht'],
    icon: 'Building2',
    category: 'management',
    highlight: true,
  },
  {
    code: 'MOD-05',
    name: 'Mietverwaltung',
    tagline: 'Vermietung ohne Papierkram.',
    description: 'Mieterübersicht, Mieteingangs-Kontrolle, Vermietungsprozesse und Nebenkostenabrechnung. Alles digitalisiert — von der Anfrage bis zur Abrechnung.',
    painPoints: [
      'Mieteingänge manuell mit Kontoauszügen abgleichen',
      'Nebenkostenabrechnung dauert Wochen',
      'Keine Übersicht über auslaufende Verträge',
    ],
    features: ['Mieterübersicht', 'Mieteingang-Matching', 'Vermietungsprozess', 'Nebenkostenabrechnung', 'Vertragsverlängerungen'],
    icon: 'FileText',
    category: 'management',
  },
  {
    code: 'MOD-13',
    name: 'Projekte',
    tagline: 'Bauprojekte im Griff.',
    description: 'Übersicht, Timeline und Dokumente für Ihre Bau- und Entwicklungsprojekte. Meilensteine tracken, Budgets überwachen, Teams koordinieren.',
    painPoints: [
      'Projektkosten laufen aus dem Ruder',
      'Keine Übersicht über Meilensteine',
      'Dokumente über 20 E-Mail-Threads verteilt',
    ],
    features: ['Projektübersicht', 'Timeline', 'Dokumente', 'Meilensteine', 'Budget-Tracking'],
    icon: 'FolderKanban',
    category: 'management',
  },
  {
    code: 'MOD-16',
    name: 'Buchhaltung',
    tagline: 'Finanzen im Blick.',
    description: 'Konten, Buchungen und Auswertungen für Ihre Immobilienbuchhaltung nach SKR04. Export für den Steuerberater in einem Klick.',
    painPoints: [
      'Belege manuell sortieren und zuordnen',
      'Keine objektbezogene Auswertung',
      'Steuerberater fragt ständig nach Unterlagen',
    ],
    features: ['Kontenrahmen SKR04', 'Buchungen', 'Auswertungen', 'Export DATEV', 'Objektzuordnung'],
    icon: 'Calculator',
    category: 'management',
  },
  
  // TRANSACTIONS
  {
    code: 'MOD-06',
    name: 'Verkauf',
    tagline: 'Verkaufen ohne Makler.',
    description: 'Inserate erstellen, Anfragen managen, Reservierungen dokumentieren. Vom ersten Klick bis zum Notartermin — professionell und transparent.',
    painPoints: [
      '6% Maklerprovision bei jedem Verkauf',
      'Unorganisierte Interessentenanfragen',
      'Keine Übersicht über Verkaufsprozess',
    ],
    features: ['Inserate erstellen', 'Portale beliefern', 'Anfragen verwalten', 'Reservierungen', 'Verkaufsdokumentation'],
    icon: 'Tag',
    category: 'transactions',
  },
  {
    code: 'MOD-07',
    name: 'Finanzierung',
    tagline: 'Bankfertig in Minuten.',
    description: 'Selbstauskunft erfassen, Dokumente bündeln, strukturiert an Banken übergeben. Vollständig und professionell — ohne ewiges Nachreichen.',
    painPoints: [
      'Banken fordern 20 verschiedene Dokumente',
      'Selbstauskunft jedes Mal neu ausfüllen',
      'Wochen warten auf Finanzierungszusage',
    ],
    features: ['Selbstauskunft', 'Dokumentenpaket', 'Anfrage stellen', 'Status verfolgen', 'Konditionsvergleich'],
    icon: 'Landmark',
    category: 'transactions',
    highlight: true,
  },
  {
    code: 'MOD-08',
    name: 'Investment-Suche',
    tagline: 'Neue Objekte finden.',
    description: 'Durchsuchen Sie alle Portale nach Kapitalanlagen. Renditeberechnung, Favoriten und automatische Suchaufträge — die besten Deals zuerst.',
    painPoints: [
      'Stunden auf ImmoScout verbracht',
      'Rendite manuell in Excel berechnet',
      'Gute Deals verpasst weil zu spät gesehen',
    ],
    features: ['Multi-Source-Suche', 'Favoriten', 'Renditeberechnung', 'Suchaufträge', 'Preis-Alerts'],
    icon: 'Search',
    category: 'transactions',
  },
  
  // GROWTH & UTILITIES
  {
    code: 'MOD-14',
    name: 'Kommunikation Pro',
    tagline: 'Serien-Kommunikation automatisiert.',
    description: 'E-Mail-Sequenzen für Mieter-Onboarding, Wartungserinnerungen oder Marketing-Kampagnen. Templates nutzen, automatisieren, tracken.',
    painPoints: [
      'Jede Mieter-E-Mail manuell schreiben',
      'Wartungstermine werden vergessen',
      'Keine Übersicht wer was erhalten hat',
    ],
    features: ['E-Mail-Serien', 'Templates', 'Automatisierung', 'Tracking', 'Mieter-Onboarding'],
    icon: 'Mail',
    category: 'growth',
  },
  {
    code: 'MOD-17',
    name: 'Fahrzeuge',
    tagline: 'Fuhrpark verwalten.',
    description: 'Fahrzeugverwaltung, Wartungsintervalle und Kostenübersicht für Ihre Unternehmensflotte — alles an einem Ort.',
    painPoints: [
      'TÜV-Termin verpasst',
      'Keine Übersicht über Fahrzeugkosten',
      'Wartungsintervalle nicht im Blick',
    ],
    features: ['Fahrzeugübersicht', 'Wartung', 'Kosten', 'Termine', 'Versicherungen'],
    icon: 'Car',
    category: 'growth',
  },
  {
    code: 'MOD-20',
    name: 'Miety',
    tagline: 'Self-Service für Mieter.',
    description: 'Das Mieterportal: Dokumente abrufen, Anfragen stellen, mit der Verwaltung kommunizieren. Weniger Anrufe, zufriedenere Mieter.',
    painPoints: [
      'Mieter rufen wegen jeder Kleinigkeit an',
      'Nebenkostenabrechnung per Post verschicken',
      'Schadensmeldungen per Telefon',
    ],
    features: ['Dokumente', 'Anfragen', 'Kommunikation', 'Self-Service', 'Schadensmeldung'],
    icon: 'Home',
    category: 'growth',
  },
];

export const MODULE_CATEGORIES = {
  foundation: {
    label: 'Foundation',
    description: 'Die Basis für alle Prozesse',
    tagline: 'Kontakte, Kommunikation, Dokumente — das Fundament.',
  },
  management: {
    label: 'Management',
    description: 'Immobilien & Projekte verwalten',
    tagline: 'Objekte, Mieter, Projekte, Finanzen — alles im Griff.',
  },
  transactions: {
    label: 'Transaktionen',
    description: 'Kaufen, Verkaufen, Finanzieren',
    tagline: 'Deals abschließen — vom ersten Kontakt bis zum Notar.',
  },
  growth: {
    label: 'Erweiterungen',
    description: 'Zusatzmodule & Speziallösungen',
    tagline: 'Mieterportale, Automatisierung, Fuhrpark — und mehr.',
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

/**
 * Get all pain points across all modules
 */
export function getAllPainPoints(): string[] {
  return SOT_WEBSITE_MODULES.flatMap(m => m.painPoints);
}
