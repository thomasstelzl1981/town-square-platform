/**
 * SoT Website Module Data — For Marketing Display
 * 
 * PRIVATE FINANZ- & HAUSHALTS-MANAGEMENT-PLATTFORM mit KI-Assistenz
 * 
 * Categories: client (Vermögen), service (Haushalt), base (System)
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
  painPoints: string[];
  features: string[];
  icon: string;
  category: 'client' | 'service' | 'base';
  highlight?: boolean;
}

export const SOT_WEBSITE_MODULES: SotWebsiteModule[] = [
  // BASE — Ihr System
  {
    code: 'MOD-01',
    name: 'Stammdaten',
    tagline: 'Alle Kontakte. Ein System.',
    description: 'Schluss mit Excel-Listen und verstreuten Kontakten. Verwalten Sie Profile, Kontakte, Dienstleister und Partner zentral — synchronisiert mit Gmail, IMAP oder Microsoft.',
    painPoints: ['Kontakte in 5 verschiedenen Apps verteilt', 'Keine Übersicht wer zu welchem Objekt gehört', 'Veraltete Telefonnummern und E-Mails'],
    features: ['Profil verwalten', 'Kontakte kategorisieren', 'Team einladen', 'Rollen zuweisen', 'Sync mit Gmail/Outlook'],
    icon: 'Users',
    category: 'base',
  },
  {
    code: 'MOD-02',
    name: 'KI Office',
    tagline: 'Ihr intelligenter Assistent.',
    description: 'Armstrong schreibt Ihre E-Mails, erstellt Briefe, koordiniert Termine und priorisiert Aufgaben. Mit den besten KI-Modellen der Welt — Google Gemini und OpenAI GPT. Inklusive WhatsApp-Integration.',
    painPoints: ['Stunden für Korrespondenz verschwendet', 'Termine vergessen oder überlappen', 'Aufgaben stapeln sich ohne Priorisierung'],
    features: ['E-Mails generieren', 'Briefe erstellen', 'Kalender', 'Aufgaben priorisieren', 'WhatsApp', 'Web-Research'],
    icon: 'Sparkles',
    category: 'client',
    highlight: true,
  },
  {
    code: 'MOD-03',
    name: 'DMS',
    tagline: 'Dokumente finden. Nicht suchen.',
    description: 'Posteingang, automatische Kategorisierung und Volltextsuche. Alle Dokumente strukturiert und in Sekunden auffindbar — nicht in Ordnern vergraben.',
    painPoints: ['Verträge in 10 Ordnern verteilt', 'Stunden mit Dokumentensuche verloren', 'Keine Übersicht über eingegangene Post'],
    features: ['Posteingang', 'Auto-Kategorisierung', 'Volltextsuche', 'Freigaben & Sharing', 'OCR-Erkennung'],
    icon: 'FolderOpen',
    category: 'base',
  },
  // CLIENT — Ihr Vermögen
  {
    code: 'MOD-04',
    name: 'Immobilien',
    tagline: 'Ihr Portfolio. Komplett digital.',
    description: 'Die digitale Immobilienakte: Stammdaten, Grundbuch, Mietverträge, Fotos, Dokumente. Mit 10-Block-Struktur, AfA-Berechnung und 30-Jahres-Portfolio-Projektionen.',
    painPoints: ['Kein Überblick über das Gesamtportfolio', 'Grundbuchdaten in Papierform irgendwo', 'Keine strukturierte Objektdokumentation'],
    features: ['Portfolio-Übersicht', 'Objektakte (10 Blöcke)', 'Einheiten-Verwaltung', 'AfA-Berechnung', 'Investment-Simulation'],
    icon: 'Building2',
    category: 'client',
    highlight: true,
  },
  {
    code: 'MOD-05',
    name: 'Website Builder',
    tagline: 'Ihre Website in Minuten.',
    description: 'Erstellen Sie eine professionelle Unternehmenswebsite mit KI-generierten Texten, fünf Design-Templates und Credits-basiertem Hosting — ohne Programmierkenntnisse.',
    painPoints: ['Website-Erstellung dauert Wochen und kostet tausende Euro', 'Inhalte sind veraltet, weil Updates umständlich sind', 'SEO und Mobile-Optimierung werden vergessen'],
    features: ['KI-Textgenerierung', '5 Design-Templates', 'SEO-Editor', 'Live-Vorschau', 'Credits-basiertes Hosting'],
    icon: 'Globe',
    category: 'service',
  },
  {
    code: 'MOD-13',
    name: 'Projekte',
    tagline: 'Bauträger-Workbench.',
    description: 'Die komplette Projektsteuerung für Bauträger: Intake, Kalkulation, Preisliste, DMS und Vertriebssteuerung.',
    painPoints: ['Projektkosten laufen aus dem Ruder', 'Vertriebsstatus unklar — wer hat was reserviert?', 'Exposé-Erstellung dauert Tage'],
    features: ['Projektübersicht', 'Kalkulator', 'Preisliste', 'Vertriebsreport', 'Landing Page Builder'],
    icon: 'FolderKanban',
    category: 'client',
  },
  {
    code: 'MOD-19',
    name: 'Photovoltaik',
    tagline: 'Solaranlagen managen.',
    description: 'Behalten Sie den Überblick über Ihre PV-Anlagen: Erträge, Wartung, Einspeisevergütung und Amortisation.',
    painPoints: ['Keine Übersicht über Solarerträge', 'Wartungstermine werden vergessen', 'Amortisation unklar'],
    features: ['Anlagen-Übersicht', 'Ertragsmonitoring', 'Wartungsplanung', 'Amortisationsrechnung', 'Einspeisedaten'],
    icon: 'Sun',
    category: 'service',
  },
  {
    code: 'MOD-07',
    name: 'Finanzierung',
    tagline: 'Bankfertig in Minuten.',
    description: 'Selbstauskunft erfassen, Dokumente bündeln, strukturiert an Banken übergeben. Vollständig und professionell.',
    painPoints: ['Banken fordern 20 verschiedene Dokumente', 'Selbstauskunft jedes Mal neu ausfüllen', 'Wochen warten auf Finanzierungszusage'],
    features: ['Selbstauskunft', 'Dokumentenpaket', 'Anfrage stellen', 'Status verfolgen', 'Konditionsvergleich'],
    icon: 'Landmark',
    category: 'client',
    highlight: true,
  },
  {
    code: 'MOD-18',
    name: 'Finanzanalyse',
    tagline: 'Vermögen verstehen.',
    description: 'Behalten Sie Ihr gesamtes Vermögen im Blick: Immobilien, Einnahmen, Ausgaben und Entwicklung.',
    painPoints: ['Kein Gesamtüberblick über Vermögen', 'Einnahmen und Ausgaben unklar', 'Keine Langfrist-Prognosen'],
    features: ['Vermögensübersicht', 'Einnahmen/Ausgaben', 'Cashflow-Analyse', 'Szenarien', 'Reports'],
    icon: 'TrendingUp',
    category: 'client',
  },
  {
    code: 'MOD-06',
    name: 'Verkauf',
    tagline: 'Verkaufen ohne Makler.',
    description: 'Inserate erstellen, Anfragen managen, Reservierungen dokumentieren. Vom ersten Klick bis zum Notartermin.',
    painPoints: ['6% Maklerprovision bei jedem Verkauf', 'Unorganisierte Interessentenanfragen', 'Keine Übersicht über Verkaufsprozess'],
    features: ['Inserate erstellen', 'Portale beliefern', 'Anfragen verwalten', 'Reservierungen', 'Verkaufsdokumentation'],
    icon: 'Tag',
    category: 'client',
  },
  {
    code: 'MOD-08',
    name: 'Investment-Suche',
    tagline: 'Neue Objekte finden.',
    description: 'Durchsuchen Sie alle Portale nach Kapitalanlagen. Renditeberechnung, Favoriten und automatische Suchaufträge.',
    painPoints: ['Stunden auf ImmoScout verbracht', 'Rendite manuell in Excel berechnet', 'Gute Deals verpasst weil zu spät gesehen'],
    features: ['Multi-Source-Suche', 'Favoriten', 'Renditeberechnung', 'Suchaufträge', 'Preis-Alerts'],
    icon: 'Search',
    category: 'client',
  },
  // SERVICE — Ihr Haushalt
  {
    code: 'MOD-14',
    name: 'Kommunikation Pro',
    tagline: 'Serien-Kommunikation automatisiert.',
    description: 'E-Mail-Sequenzen für Onboarding, Wartungserinnerungen oder Marketing-Kampagnen.',
    painPoints: ['Jede E-Mail manuell schreiben', 'Wartungstermine werden vergessen', 'Keine Übersicht wer was erhalten hat'],
    features: ['E-Mail-Serien', 'Recherche', 'Social Media', 'KI-Agenten', 'Tracking'],
    icon: 'Mail',
    category: 'service',
  },
  {
    code: 'MOD-15',
    name: 'Fortbildung',
    tagline: 'Wissen aufbauen.',
    description: 'Fachbücher, Fortbildungen, Vorträge und Kurse — alles an einem Ort.',
    painPoints: ['Keine Übersicht über Fortbildungspflichten', 'Zertifikate verlegt', 'Fachliteratur unstrukturiert gesammelt'],
    features: ['Bücher-Bibliothek', 'Fortbildungskatalog', 'Vorträge', 'Kurse', 'Zertifikat-Verwaltung'],
    icon: 'GraduationCap',
    category: 'service',
  },
  {
    code: 'MOD-16',
    name: 'Shops',
    tagline: 'Einkauf für Ihr Business.',
    description: 'Direkter Zugang zu Amazon Business, OTTO Office und Miete24 — alles über eine Plattform.',
    painPoints: ['Bestellungen über 5 verschiedene Portale', 'Keine Übersicht über Büromaterial-Kosten', 'Firmenkonditionen nicht optimal genutzt'],
    features: ['Amazon Business', 'OTTO Office', 'Miete24', 'Bestellübersicht', 'Kostenauswertung'],
    icon: 'ShoppingCart',
    category: 'service',
  },
  {
    code: 'MOD-17',
    name: 'Fahrzeuge',
    tagline: 'Fuhrpark verwalten.',
    description: 'Fahrzeugverwaltung, Versicherungen, Fahrtenbuch und Angebote — der komplette Überblick.',
    painPoints: ['TÜV-Termin verpasst', 'Keine Übersicht über Fahrzeugkosten', 'Fahrtenbuch lückenhaft'],
    features: ['Fahrzeugübersicht', 'Versicherungen', 'Fahrtenbuch', 'Angebote', 'Kostenkontrolle'],
    icon: 'Car',
    category: 'service',
  },
  {
    code: 'MOD-20',
    name: 'Miety',
    tagline: 'Self-Service für Mieter.',
    description: 'Das Mieterportal: Dokumente abrufen, Versorgungsverträge verwalten, Versicherungen einsehen und Smart-Home steuern.',
    painPoints: ['Mieter rufen wegen jeder Kleinigkeit an', 'Nebenkostenabrechnung per Post verschicken', 'Schadensmeldungen per Telefon'],
    features: ['Übersicht', 'Versorgung', 'Versicherungen', 'Smart Home', 'Kommunikation'],
    icon: 'Home',
    category: 'service',
  },
];

export const MODULE_CATEGORIES = {
  client: {
    label: 'Client — Ihr Vermögen',
    description: 'Finanzen, Immobilien, Finanzierung und Investments',
    tagline: 'Finanzieren, Analysieren, Handeln — Ihr Vermögen optimieren.',
  },
  service: {
    label: 'Service — Ihr Haushalt',
    description: 'Fahrzeuge, Energie, Fortbildung und mehr',
    tagline: 'Fahrzeuge, Photovoltaik, Kommunikation, Fortbildung — und mehr.',
  },
  base: {
    label: 'Base — Ihr System',
    description: 'Dokumente, Stammdaten und KI-Intelligenz',
    tagline: 'DMS, Kontakte und Armstrong — Ihr digitales Fundament.',
  },
};

export function getFeaturedModules(): SotWebsiteModule[] {
  return SOT_WEBSITE_MODULES.filter(m => m.highlight);
}

export function getModulesByCategory(category: SotWebsiteModule['category']): SotWebsiteModule[] {
  return SOT_WEBSITE_MODULES.filter(m => m.category === category);
}

export function getAllPainPoints(): string[] {
  return SOT_WEBSITE_MODULES.flatMap(m => m.painPoints);
}

export function getModuleCount(): number {
  return SOT_WEBSITE_MODULES.length;
}
