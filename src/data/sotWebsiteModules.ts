/**
 * SoT Website Module Data — For Marketing Display
 * 
 * DIGITALISIERUNGSPLATTFORM für Unternehmer, Vermieter und Teams
 * 
 * Categories: client (Vermögen), service (Betrieb), base (Fundament)
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
  // BASE — Ihr Fundament
  {
    code: 'MOD-01',
    name: 'Stammdaten',
    tagline: 'Alle Kontakte. Ein System.',
    description: 'Schluss mit Kontakten in 5 verschiedenen Apps. Profile, Kontakte, Dienstleister und Partner zentral verwalten — synchronisiert mit Gmail, Outlook oder IMAP.',
    painPoints: ['Kontakte in Gmail, Outlook, Excel und Handy verstreut', 'Keine Übersicht, wer zu welchem Vorgang gehört', 'Veraltete Telefonnummern und E-Mails kosten Zeit'],
    features: ['Profil verwalten', 'Kontakte kategorisieren', 'Team einladen', 'Rollen zuweisen', 'Sync mit Gmail/Outlook'],
    icon: 'Users',
    category: 'base',
  },
  {
    code: 'MOD-02',
    name: 'KI Office',
    tagline: 'Ihr intelligenter Arbeitsplatz.',
    description: 'Armstrong schreibt Ihre E-Mails, erstellt Briefe, koordiniert Termine und priorisiert Aufgaben. Mit Google Gemini und OpenAI GPT. Inklusive WhatsApp-Integration.',
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
    description: 'Ihr zentraler Datenraum: automatischer Posteingang, KI-Kategorisierung und Volltextsuche. Alle Dokumente in Sekunden auffindbar — nie wieder in Ordnern graben.',
    painPoints: ['Verträge in 10 Ordnern und 3 Cloud-Speichern verteilt', 'Stunden mit Dokumentensuche verloren', 'Wichtige Post geht unter und wird nicht zugeordnet'],
    features: ['Posteingang', 'Auto-Kategorisierung', 'Volltextsuche', 'Freigaben & Sharing', 'OCR-Erkennung'],
    icon: 'FolderOpen',
    category: 'base',
  },
  // CLIENT — Ihr Vermögen
  {
    code: 'MOD-04',
    name: 'Immobilien',
    tagline: 'Ihr Portfolio. Komplett digital.',
    description: 'Die digitale Immobilienakte: Stammdaten, Grundbuch, Mietverträge, Fotos, Dokumente. Mit 10-Block-Struktur, AfA-Berechnung und 30-Jahres-Projektionen.',
    painPoints: ['Kein Überblick über das Gesamtportfolio', 'Grundbuchdaten irgendwo in Papierform', 'Keine strukturierte Objektdokumentation'],
    features: ['Portfolio-Übersicht', 'Objektakte (10 Blöcke)', 'Einheiten-Verwaltung', 'AfA-Berechnung', 'Investment-Simulation'],
    icon: 'Building2',
    category: 'client',
    highlight: true,
  },
  {
    code: 'MOD-05',
    name: 'Mietverwaltung',
    tagline: 'Mieter, Verträge, Abrechnungen.',
    description: 'Verwalten Sie Mieter, Verträge, Zahlungseingänge und Nebenkostenabrechnungen. Mietrückstände erkennen, Indexmietanpassungen berechnen und Wartungszyklen planen.',
    painPoints: ['Mietrückstände zu spät erkannt', 'Nebenkostenabrechnung dauert Wochen', 'Kein Überblick über Wartungstermine'],
    features: ['Mieterübersicht', 'Zahlungseingänge', 'Nebenkostenabrechnung', 'Indexmietanpassung', 'Wartungsplanung'],
    icon: 'Home',
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
    tagline: 'Solaranlagen im Griff.',
    description: 'Behalten Sie den Überblick über Ihre PV-Anlagen: Erträge monitoren, Wartung planen, Einspeisevergütung tracken und Amortisation berechnen.',
    painPoints: ['Keine Ahnung, ob die Anlage bringt, was sie soll', 'Wartungstermine vergessen — Ertragsverlust', 'Amortisation unklar — lohnt sich das Investment?'],
    features: ['Anlagen-Übersicht', 'Ertragsmonitoring', 'Wartungsplanung', 'Amortisationsrechnung', 'Einspeisedaten'],
    icon: 'Sun',
    category: 'service',
  },
  {
    code: 'MOD-07',
    name: 'Finanzierung',
    tagline: 'Bankfertig in Minuten.',
    description: 'Digitale Selbstauskunft erfassen, Dokumente automatisch bündeln, strukturiert an Banken übergeben. Professionell und vollständig — ohne tagelange Vorarbeit.',
    painPoints: ['Banken fordern 20 verschiedene Dokumente', 'Selbstauskunft jedes Mal neu ausfüllen', 'Wochen warten, weil Unterlagen fehlen'],
    features: ['Selbstauskunft', 'Dokumentenpaket', 'Anfrage stellen', 'Status verfolgen', 'Konditionsvergleich'],
    icon: 'Landmark',
    category: 'client',
    highlight: true,
  },
  {
    code: 'MOD-18',
    name: 'Finanzanalyse',
    tagline: 'Vermögen verstehen.',
    description: 'Ihr gesamtes Vermögen auf einen Blick: Immobilien, Konten, Einnahmen, Ausgaben und Langfrist-Szenarien. Entscheidungen auf Datenbasis statt Bauchgefühl.',
    painPoints: ['Kein Gesamtüberblick über das Vermögen', 'Einnahmen und Ausgaben über 5 Konten verstreut', 'Keine Langfrist-Prognosen für fundierte Entscheidungen'],
    features: ['Vermögensübersicht', 'Einnahmen/Ausgaben', 'Cashflow-Analyse', 'Szenarien', 'Reports'],
    icon: 'TrendingUp',
    category: 'client',
  },
  {
    code: 'MOD-06',
    name: 'Verkauf',
    tagline: 'Verkaufen ohne Makler.',
    description: 'Inserate erstellen, Anfragen managen, Reservierungen dokumentieren. Vom ersten Klick bis zum Notartermin — ohne 6% Maklerprovision.',
    painPoints: ['6% Maklerprovision bei jedem Verkauf', 'Unorganisierte Interessentenanfragen', 'Kein strukturierter Verkaufsprozess'],
    features: ['Inserate erstellen', 'Portale beliefern', 'Anfragen verwalten', 'Reservierungen', 'Verkaufsdokumentation'],
    icon: 'Tag',
    category: 'client',
  },
  {
    code: 'MOD-08',
    name: 'Investment-Suche',
    tagline: 'Kapitalanlagen finden.',
    description: 'Durchsuchen Sie alle Portale nach Kapitalanlagen. Renditeberechnung, Favoriten und automatische Suchaufträge — gute Deals nicht mehr verpassen.',
    painPoints: ['Stunden auf ImmoScout verbracht', 'Rendite manuell in Excel berechnet', 'Gute Deals verpasst, weil zu spät gesehen'],
    features: ['Multi-Source-Suche', 'Favoriten', 'Renditeberechnung', 'Suchaufträge', 'Preis-Alerts'],
    icon: 'Search',
    category: 'client',
  },
  // SERVICE — Ihr Betrieb
  {
    code: 'MOD-14',
    name: 'Kommunikation Pro',
    tagline: 'E-Mail-Automatisierung.',
    description: 'E-Mail-Serien für Onboarding, Wartungserinnerungen oder Marketing-Kampagnen. KI-generierte Texte, automatisches Tracking und intelligente Sequenzen.',
    painPoints: ['Jede E-Mail manuell schreiben und senden', 'Wartungstermine werden vergessen — teure Folgen', 'Keine Übersicht, wer was erhalten hat'],
    features: ['E-Mail-Serien', 'KI-Textgenerierung', 'Social Media', 'KI-Agenten', 'Tracking & Analytics'],
    icon: 'Mail',
    category: 'service',
  },
  {
    code: 'MOD-15',
    name: 'Fortbildung',
    tagline: 'Wissen aufbauen.',
    description: 'Fachbücher, Fortbildungen, Vorträge und Kurse — alles an einem Ort. Zertifikate nie mehr verlegen, Pflichtfortbildungen im Blick behalten.',
    painPoints: ['Fortbildungspflichten übersehen', 'Zertifikate und Nachweise verlegt', 'Fachliteratur unstrukturiert irgendwo gespeichert'],
    features: ['Bücher-Bibliothek', 'Fortbildungskatalog', 'Vorträge', 'Kurse', 'Zertifikat-Verwaltung'],
    icon: 'GraduationCap',
    category: 'service',
  },
  {
    code: 'MOD-16',
    name: 'Shops',
    tagline: 'Einkauf für Ihr Business.',
    description: 'Direkter Zugang zu Amazon Business, Büroshop24 und Miete24 — über eine Plattform. Bestellübersicht und Kostenauswertung inklusive.',
    painPoints: ['Bestellungen über 5 verschiedene Portale verstreut', 'Keine Übersicht über Büromaterial-Kosten', 'Firmenkonditionen nicht optimal genutzt'],
    features: ['Amazon Business', 'Büroshop24', 'Miete24', 'Bestellübersicht', 'Kostenauswertung'],
    icon: 'ShoppingCart',
    category: 'service',
  },
  {
    code: 'MOD-17',
    name: 'Fahrzeuge',
    tagline: 'Fuhrpark digital verwalten.',
    description: 'Fahrzeugverwaltung, Versicherungen, Fahrtenbuch und Kostenkontrolle — der komplette Überblick über Ihren Fuhrpark. Nie wieder TÜV verpassen.',
    painPoints: ['TÜV-Termin verpasst — Bußgeld und Ärger', 'Keine Übersicht über die tatsächlichen Fahrzeugkosten', 'Fahrtenbuch lückenhaft — Steuerprobleme drohen'],
    features: ['Fahrzeugübersicht', 'Versicherungen', 'Fahrtenbuch', 'TÜV-Erinnerungen', 'Kostenkontrolle'],
    icon: 'Car',
    category: 'service',
  },
  {
    code: 'MOD-20',
    name: 'Miety',
    tagline: 'Self-Service für Mieter.',
    description: 'Das Mieterportal: Dokumente abrufen, Versorgungsverträge verwalten, Schadensmeldungen einreichen und Nebenkostenabrechnungen einsehen — digital statt Telefon.',
    painPoints: ['Mieter rufen wegen jeder Kleinigkeit an', 'Nebenkostenabrechnung per Post verschicken', 'Schadensmeldungen gehen im E-Mail-Chaos unter'],
    features: ['Übersicht', 'Versorgung', 'Versicherungen', 'Smart Home', 'Kommunikation'],
    icon: 'Home',
    category: 'service',
  },
];

export const MODULE_CATEGORIES = {
  client: {
    label: 'Client — Ihr Vermögen',
    description: 'Finanzen, Immobilien, Finanzierung und Investments',
    tagline: 'Finanzieren, Analysieren, Handeln — Ihr Vermögen im Griff.',
  },
  service: {
    label: 'Service — Ihr Betrieb',
    description: 'Fuhrpark, Energie, Kommunikation, Fortbildung und mehr',
    tagline: 'Fahrzeuge, Photovoltaik, E-Mail-Serien, Einkauf — digital statt analog.',
  },
  base: {
    label: 'Base — Ihr Fundament',
    description: 'Dokumente, Kontakte und KI-Intelligenz',
    tagline: 'DMS, Stammdaten und Armstrong KI — Ihr digitales Rückgrat.',
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
