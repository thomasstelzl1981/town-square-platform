/**
 * SoT Website Module Data — For Marketing Display
 * 
 * DIGITALISIERUNGSPLATTFORM für Unternehmer, Vermieter und Teams
 * 
 * Categories: client (Vermögen), service (Betrieb), base (Fundament)
 * 
 * Codes use URL-friendly slugs (NO internal module numbers).
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
    code: 'stammdaten',
    name: 'Stammdaten',
    tagline: 'Alle Kontakte. Ein System.',
    description: 'Schluss mit Kontakten in 5 verschiedenen Apps. Profile, Kontakte, Dienstleister und Partner zentral verwalten — synchronisiert mit Gmail, Outlook oder IMAP. Mit Kategorien, Tags und der automatischen Verknüpfung zu Immobilien, Vorgängen und Dokumenten.',
    painPoints: ['Kontakte in Gmail, Outlook, Excel und Handy verstreut', 'Keine Übersicht, wer zu welchem Vorgang gehört', 'Veraltete Telefonnummern und E-Mails kosten Zeit'],
    features: ['Profil verwalten', 'Kontakte kategorisieren', 'Team einladen', 'Rollen zuweisen', 'Sync mit Gmail/Outlook', 'Automatische Verknüpfung'],
    icon: 'Users',
    category: 'base',
  },
  {
    code: 'ki-office',
    name: 'KI Office',
    tagline: 'Ihr intelligenter Arbeitsplatz.',
    description: 'Armstrong — unser KI-Assistent — schreibt E-Mails, erstellt Briefe, koordiniert Termine und priorisiert Aufgaben. Angetrieben von Google Gemini und OpenAI GPT-5. Inklusive WhatsApp-Integration, Web-Research und einem eigenen KI-Browser für tiefgehende Analysen.',
    painPoints: ['Stunden für Korrespondenz verschwendet', 'Termine vergessen oder überlappen', 'Aufgaben stapeln sich ohne Priorisierung'],
    features: ['KI-E-Mails (Armstrong)', 'KI-Briefe', 'Kalender & Termine', 'Aufgaben priorisieren', 'WhatsApp-Integration', 'Web-Research', 'KI-Browser'],
    icon: 'Sparkles',
    category: 'client',
    highlight: true,
  },
  {
    code: 'dms',
    name: 'Dokumentenmanagement',
    tagline: 'Dokumente finden. Nicht suchen.',
    description: 'Ihr zentraler Datenraum: automatischer Posteingang mit KI-Kategorisierung, OCR-Texterkennung und Volltextsuche. Alle Dokumente in Sekunden auffindbar — mit automatischer Zuordnung zu Immobilien, Kontakten und Vorgängen.',
    painPoints: ['Verträge in 10 Ordnern und 3 Cloud-Speichern verteilt', 'Stunden mit Dokumentensuche verloren', 'Wichtige Post geht unter und wird nicht zugeordnet'],
    features: ['Posteingang', 'KI-Kategorisierung', 'Volltextsuche', 'OCR-Erkennung', 'Freigaben & Sharing', 'Automatische Objektzuordnung'],
    icon: 'FolderOpen',
    category: 'base',
  },
  // CLIENT — Ihr Vermögen
  {
    code: 'immobilien',
    name: 'Immobilien',
    tagline: 'Ihr Portfolio. Komplett digital.',
    description: 'Die digitale Immobilienakte mit 10-Block-Struktur: Stammdaten, Grundbuch, Mietverträge, Fotos, Dokumente, Einheiten, Nebenkosten und mehr. Mit AfA-Berechnung, 30-Jahres-Projektionen und automatischer Verknüpfung zum DMS.',
    painPoints: ['Kein Überblick über das Gesamtportfolio', 'Grundbuchdaten irgendwo in Papierform', 'Keine strukturierte Objektdokumentation'],
    features: ['Portfolio-Übersicht', 'Objektakte (10 Blöcke)', 'Einheiten-Verwaltung', 'AfA-Berechnung', 'Investment-Simulation', 'Nebenkosten-Engine', 'Exposé-Generator'],
    icon: 'Building2',
    category: 'client',
    highlight: true,
  },
  {
    code: 'mietverwaltung',
    name: 'Mietverwaltung',
    tagline: 'Mieter, Verträge, Abrechnungen.',
    description: 'Verwalten Sie Mieter, Verträge, Zahlungseingänge und Nebenkostenabrechnungen. Mietrückstände automatisch erkennen, Indexmietanpassungen berechnen und Wartungszyklen planen — alles in einem System.',
    painPoints: ['Mietrückstände zu spät erkannt', 'Nebenkostenabrechnung dauert Wochen', 'Kein Überblick über Wartungstermine'],
    features: ['Mieterübersicht', 'Zahlungseingänge', 'Nebenkostenabrechnung', 'Indexmietanpassung', 'Wartungsplanung', 'Vertragsverwaltung'],
    icon: 'Home',
    category: 'service',
  },
  {
    code: 'projekte',
    name: 'Projekte',
    tagline: 'Bauträger-Workbench.',
    description: 'Die komplette Projektsteuerung für Bauträger und Entwickler: Intake, Kalkulation, Preisliste, DMS und Vertriebssteuerung. Mit automatischer Landing-Page-Erstellung für jedes Projekt und integriertem Lead-Management.',
    painPoints: ['Projektkosten laufen aus dem Ruder', 'Vertriebsstatus unklar — wer hat was reserviert?', 'Exposé-Erstellung dauert Tage'],
    features: ['Projektübersicht', 'Kalkulator', 'Preisliste', 'Vertriebsreport', 'Landing Page Builder', 'Lead-Erfassung'],
    icon: 'FolderKanban',
    category: 'client',
  },
  {
    code: 'photovoltaik',
    name: 'Photovoltaik',
    tagline: 'Solaranlagen im Griff.',
    description: 'Behalten Sie den Überblick über Ihre PV-Anlagen: Erträge monitoren, Wartung planen, Einspeisevergütung tracken und Amortisation berechnen. Alle Anlagen-Daten zentral mit direktem Bezug zur jeweiligen Immobilie.',
    painPoints: ['Keine Ahnung, ob die Anlage bringt, was sie soll', 'Wartungstermine vergessen — Ertragsverlust', 'Amortisation unklar — lohnt sich das Investment?'],
    features: ['Anlagen-Übersicht', 'Ertragsmonitoring', 'Wartungsplanung', 'Amortisationsrechnung', 'Einspeisedaten'],
    icon: 'Sun',
    category: 'service',
  },
  {
    code: 'finanzierung',
    name: 'Finanzierung',
    tagline: 'Bankfertig in Minuten.',
    description: 'Digitale Selbstauskunft erfassen, Dokumente automatisch bündeln und strukturiert an Banken übergeben. Professionell und vollständig — ohne tagelange Vorarbeit. Mit Konditionsvergleich und automatischer Vollständigkeitsprüfung.',
    painPoints: ['Banken fordern 20 verschiedene Dokumente', 'Selbstauskunft jedes Mal neu ausfüllen', 'Wochen warten, weil Unterlagen fehlen'],
    features: ['Selbstauskunft', 'Dokumentenpaket', 'Anfrage stellen', 'Status verfolgen', 'Konditionsvergleich', 'Vollständigkeitsprüfung'],
    icon: 'Landmark',
    category: 'client',
    highlight: true,
  },
  {
    code: 'finanzanalyse',
    name: 'Finanzanalyse',
    tagline: 'Vermögen verstehen.',
    description: 'Ihr gesamtes Vermögen auf einen Blick: Immobilien, Konten, Einnahmen, Ausgaben und Langfrist-Szenarien. Mit BWA-Engine, Cashflow-Analyse und Steuervorschau — Entscheidungen auf Datenbasis statt Bauchgefühl.',
    painPoints: ['Kein Gesamtüberblick über das Vermögen', 'Einnahmen und Ausgaben über 5 Konten verstreut', 'Keine Langfrist-Prognosen für fundierte Entscheidungen'],
    features: ['Vermögensübersicht', 'Einnahmen/Ausgaben', 'Cashflow-Analyse', 'BWA-Engine', 'Szenarien & Prognosen', 'Reports & Export'],
    icon: 'TrendingUp',
    category: 'client',
  },
  {
    code: 'verkauf',
    name: 'Verkauf',
    tagline: 'Verkaufen ohne Makler.',
    description: 'Inserate erstellen, Anfragen managen und Reservierungen dokumentieren. Vom ersten Klick bis zum Notartermin — ohne 6 % Maklerprovision. Mit automatischer Exposé-Erstellung und Interessenten-Verwaltung.',
    painPoints: ['6 % Maklerprovision bei jedem Verkauf', 'Unorganisierte Interessentenanfragen', 'Kein strukturierter Verkaufsprozess'],
    features: ['Inserate erstellen', 'Exposé-Generator', 'Anfragen verwalten', 'Reservierungen', 'Verkaufsdokumentation', 'Portalanbindung'],
    icon: 'Tag',
    category: 'client',
  },
  {
    code: 'investment-suche',
    name: 'Investment-Suche',
    tagline: 'Kapitalanlagen finden.',
    description: 'Durchsuchen Sie alle Portale nach Kapitalanlagen. Renditeberechnung, Favoriten und automatische Suchaufträge — gute Deals nicht mehr verpassen. Mit KI-gestützter Bewertung und Marktvergleich.',
    painPoints: ['Stunden auf ImmoScout verbracht', 'Rendite manuell in Excel berechnet', 'Gute Deals verpasst, weil zu spät gesehen'],
    features: ['Multi-Source-Suche', 'Favoriten', 'Renditeberechnung', 'Suchaufträge', 'Preis-Alerts', 'KI-Bewertung'],
    icon: 'Search',
    category: 'client',
  },
  // SERVICE — Ihr Betrieb
  {
    code: 'kommunikation',
    name: 'Kommunikation Pro',
    tagline: 'E-Mail-Automatisierung.',
    description: 'E-Mail-Serien für Onboarding, Wartungserinnerungen oder Marketing-Kampagnen. KI-generierte Texte, automatisches Tracking, intelligente Sequenzen und Social-Media-Integration — alles aus einem System.',
    painPoints: ['Jede E-Mail manuell schreiben und senden', 'Wartungstermine werden vergessen — teure Folgen', 'Keine Übersicht, wer was erhalten hat'],
    features: ['E-Mail-Serien', 'KI-Textgenerierung', 'Social Media', 'KI-Agenten', 'Tracking & Analytics', 'Template-Editor'],
    icon: 'Mail',
    category: 'service',
  },
  {
    code: 'fortbildung',
    name: 'Fortbildung',
    tagline: 'Wissen aufbauen.',
    description: 'Fachbücher, Fortbildungen, Vorträge und Kurse — alles an einem Ort. Zertifikate nie mehr verlegen, Pflichtfortbildungen im Blick behalten. Mit Erinnerungen und automatischer Fristenüberwachung.',
    painPoints: ['Fortbildungspflichten übersehen', 'Zertifikate und Nachweise verlegt', 'Fachliteratur unstrukturiert irgendwo gespeichert'],
    features: ['Bücher-Bibliothek', 'Fortbildungskatalog', 'Vorträge', 'Kurse', 'Zertifikat-Verwaltung', 'Fristenüberwachung'],
    icon: 'GraduationCap',
    category: 'service',
  },
  {
    code: 'shops',
    name: 'Shops',
    tagline: 'Einkauf für Ihr Business.',
    description: 'Direkter Zugang zu Amazon Business, Büroshop24 und Miete24 — über eine Plattform. Bestellübersicht, Kostenauswertung und Budgetkontrolle inklusive.',
    painPoints: ['Bestellungen über 5 verschiedene Portale verstreut', 'Keine Übersicht über Büromaterial-Kosten', 'Firmenkonditionen nicht optimal genutzt'],
    features: ['Amazon Business', 'Büroshop24', 'Miete24', 'Bestellübersicht', 'Kostenauswertung', 'Budgetkontrolle'],
    icon: 'ShoppingCart',
    category: 'service',
  },
  {
    code: 'fahrzeuge',
    name: 'Fahrzeuge',
    tagline: 'Fuhrpark digital verwalten.',
    description: 'Fahrzeugverwaltung, Versicherungen, Fahrtenbuch und Kostenkontrolle — der komplette Überblick über Ihren Fuhrpark. Nie wieder TÜV verpassen. Mit automatischen Erinnerungen und Kilometerstand-Tracking.',
    painPoints: ['TÜV-Termin verpasst — Bußgeld und Ärger', 'Keine Übersicht über die tatsächlichen Fahrzeugkosten', 'Fahrtenbuch lückenhaft — Steuerprobleme drohen'],
    features: ['Fahrzeugübersicht', 'Versicherungen', 'Fahrtenbuch', 'TÜV-Erinnerungen', 'Kostenkontrolle', 'Kilometerstand-Tracking'],
    icon: 'Car',
    category: 'service',
  },
  {
    code: 'miety',
    name: 'Miety',
    tagline: 'Self-Service für Mieter.',
    description: 'Das Mieterportal: Dokumente abrufen, Versorgungsverträge verwalten, Schadensmeldungen einreichen und Nebenkostenabrechnungen einsehen — digital statt Telefon. Reduziert Ihren Verwaltungsaufwand um bis zu 70 %.',
    painPoints: ['Mieter rufen wegen jeder Kleinigkeit an', 'Nebenkostenabrechnung per Post verschicken', 'Schadensmeldungen gehen im E-Mail-Chaos unter'],
    features: ['Mieter-Dashboard', 'Versorgung', 'Versicherungen', 'Schadensmeldung', 'Kommunikation', 'Dokumenten-Download'],
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
