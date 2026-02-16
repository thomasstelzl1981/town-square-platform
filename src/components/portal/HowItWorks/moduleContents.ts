import { LucideIcon } from 'lucide-react';

export interface HowItWorksContent {
  moduleCode: string;
  title: string;
  oneLiner: string;
  benefits: string[];
  whatYouDo: string[];
  flows: {
    title: string;
    steps: string[];
  }[];
  cta: string;
  hint?: string;
  subTiles: {
    title: string;
    route: string;
    icon?: LucideIcon;
  }[];
}
import {
  User, Building, CreditCard, Shield,
  Mail, FileText, Users, Calendar, Layers,
  HardDrive, Inbox, ArrowUpDown, Settings,
  FolderTree, LayoutGrid, Hammer, TrendingUp,
  Building2, Wallet, Send, Activity,
  GitBranch, BarChart,
  FileEdit, FolderOpen, FileStack,
  Search, Heart, FileSignature, Calculator,
  MessageCircle, Network,
  Target, Megaphone,
  HelpCircle,
  Briefcase, ClipboardList, Wrench, MapPin,
  FolderKanban, Clock, Cog,
  AtSign, Globe, Bot,
  GraduationCap, BookOpen, Award,
  ShoppingCart, ClipboardCheck, Package, Laptop,
  Car, Gauge, CarFront,
  LineChart, FileBarChart, Lightbulb,
  Sun, CheckSquare, Folder,
  Home, FileBox, MessageSquare, Thermometer, Plug, ShieldCheck
} from 'lucide-react';

export const moduleContents: Record<string, HowItWorksContent> = {
  'MOD-01': {
    moduleCode: 'MOD-01',
    title: 'Stammdaten',
    oneLiner: 'Alles, was Ihr Konto "fähig macht" – einmal sauber einrichten, überall profitieren.',
    benefits: [
      'Ihre Daten werden automatisch in Anträgen, Exposés und Dokumenten vorbefüllt.',
      'Alle Verträge und Vereinbarungen zentral an einem Ort einsehbar.',
      'Abrechnung, Credits und Sicherheit sind transparent und jederzeit zugänglich.',
    ],
    whatYouDo: [
      'Profil- und Kontaktdaten pflegen',
      'Verträge und Vereinbarungen einsehen (AGB, Mandate, Provisionen)',
      'Abrechnung & Rechnungen prüfen',
      'Bankdaten für Auszahlungen hinterlegen',
      'Sicherheitseinstellungen (Passwort, 2FA, Sessions)',
    ],
    flows: [
      {
        title: 'Startklar nach Registrierung',
        steps: ['Profil vervollständigen', 'Verträge prüfen', 'Abrechnung einrichten', 'Sicherheit aktivieren'],
      },
      {
        title: 'Vertragsübersicht nutzen',
        steps: ['Verträge öffnen', 'Vereinbarungen durchsehen', 'Details bei Bedarf aufrufen'],
      },
    ],
    cta: 'Vervollständigen Sie Ihr Profil – das beschleunigt alle Prozesse.',
    subTiles: [
      { title: 'Profil', route: '/portal/stammdaten/profil', icon: User },
      { title: 'Verträge', route: '/portal/stammdaten/vertraege', icon: FileText },
      { title: 'Abrechnung', route: '/portal/stammdaten/abrechnung', icon: CreditCard },
      { title: 'Sicherheit', route: '/portal/stammdaten/sicherheit', icon: Shield },
    ],
  },

  'MOD-02': {
    moduleCode: 'MOD-02',
    title: 'KI Office',
    oneLiner: 'Kommunikation, Kontakte und Termine – mit KI schneller, sauberer, konsistenter.',
    benefits: [
      'Texte, Antworten und Vorlagen in Sekunden statt Minuten.',
      'Ein zentrales Kontaktbuch, das in allen Modulen genutzt wird.',
      'Termine, Aufgaben und Nachfassen werden nachvollziehbar.',
    ],
    whatYouDo: [
      'E-Mails strukturieren und schneller beantworten',
      'Briefe & Schreiben aus Vorlagen erstellen (inkl. PDF)',
      'Kontakte zentral pflegen und verknüpfen',
      'Termine planen und protokollieren',
      'Wiederkehrende Texte als Vorlagen speichern',
      'Kommunikation automatisch im DMS ablegen',
    ],
    flows: [
      {
        title: 'Anfrage beantworten',
        steps: ['E-Mail öffnen', 'KI-Vorschlag wählen', 'anpassen', 'senden', 'Kontakt anlegen'],
      },
      {
        title: 'Schreiben erstellen',
        steps: ['Brief wählen', 'Daten werden vorbefüllt', 'PDF exportieren', 'im DMS ablegen'],
      },
    ],
    cta: 'Starten Sie mit einer Nachricht – der Rest wird leichter.',
    subTiles: [
      { title: 'E-Mail', route: '/portal/office/email', icon: Mail },
      { title: 'Brief', route: '/portal/office/brief', icon: FileText },
      { title: 'Kontakte', route: '/portal/office/kontakte', icon: Users },
      { title: 'Kalender', route: '/portal/office/kalender', icon: Calendar },
      { title: 'Widgets', route: '/portal/office/widgets', icon: Layers },
    ],
  },

  'MOD-03': {
    moduleCode: 'MOD-03',
    title: 'DMS',
    oneLiner: 'Ihr Dokumenten-Hub: sicher, durchsuchbar, logisch verknüpft.',
    benefits: [
      'Dokumente finden statt suchen: klare Struktur + Volltextsuche.',
      'Upload & Posteingang bündeln alles an einer Stelle.',
      'Teilen & Freigaben machen Zusammenarbeit kontrollierbar.',
    ],
    whatYouDo: [
      'Dokumente hochladen und ordnen',
      'Posteingang abarbeiten und zuordnen',
      'Dokumente mit Objekten/Kontakten verknüpfen',
      'Volltextsuche nutzen',
      'Freigaben für Dritte steuern',
      '"Unsortiert" bereinigen (Sortieren)',
    ],
    flows: [
      {
        title: 'Dokument schnell ablegen',
        steps: ['Upload', 'Typ prüfen', 'Objekt/Kontakt zuordnen', 'fertig'],
      },
      {
        title: 'Bankunterlage finden',
        steps: ['Suche', 'Treffer öffnen', 'teilen/freigeben', 'verwenden'],
      },
    ],
    cta: 'Laden Sie ein Dokument hoch – Sie sehen sofort den Unterschied.',
    subTiles: [
      { title: 'Storage', route: '/portal/dms/storage', icon: HardDrive },
      { title: 'Posteingang', route: '/portal/dms/posteingang', icon: Inbox },
      { title: 'Sortieren', route: '/portal/dms/sortieren', icon: ArrowUpDown },
      { title: 'Einstellungen', route: '/portal/dms/einstellungen', icon: Settings },
    ],
  },

  'MOD-04': {
    moduleCode: 'MOD-04',
    title: 'Immobilien',
    oneLiner: 'Die zentrale Immobilienakte als Datenbasis (Single Source of Truth) für Objekt-, Einheiten- und Mietdaten-Bestand.',
    benefits: [
      'Single Source of Truth: Alle Objekt- und Bestandsdaten sauber an einem Ort.',
      'Klare Grundlage für Verkauf, Vermietung und Finanzierung.',
      'Dokumente, Kennzahlen und Historie sind jederzeit nachvollziehbar.',
    ],
    whatYouDo: [
      'Objekte und Einheiten anlegen und pflegen',
      'Mietdaten als Bestand/Übersicht führen (Snapshot/Bestand)',
      'Exposé-Daten (Texte, Energie, Fotos, Stammdaten) aktualisieren',
      'Vermietereinheiten im Portfolio verwalten',
      'Sanierung & Maßnahmen dokumentieren',
      'Bewertung & Wertentwicklung nachvollziehen',
      'Verwaltung: Mieteingang, Vermietung und Mahnwesen',
    ],
    flows: [
      {
        title: 'Objekt aufnehmen',
        steps: ['Portfolio', 'Objekt anlegen', 'Einheiten ergänzen', 'Mietbestand pflegen', 'Dokumente verknüpfen'],
      },
      {
        title: 'Verwaltung nutzen',
        steps: ['Verwaltung öffnen', 'Mieteingang prüfen', 'Vermietungsexposé erstellen', 'Einstellungen konfigurieren'],
      },
    ],
    cta: 'Pflegen Sie zuerst die Immobilienakte – alles Weitere baut darauf auf.',
    subTiles: [
      { title: 'Portfolio', route: '/portal/immobilien/portfolio', icon: LayoutGrid },
      { title: 'Sanierung', route: '/portal/immobilien/sanierung', icon: Hammer },
      { title: 'Bewertung', route: '/portal/immobilien/bewertung', icon: TrendingUp },
      { title: 'Verwaltung', route: '/portal/immobilien/verwaltung', icon: Building2 },
    ],
  },

  'MOD-05': {
    moduleCode: 'MOD-05',
    title: 'Haustiere',
    oneLiner: 'Verwalten Sie Ihre Haustiere — Tierakten, Pflege, Fotoalbum und Shop.',
    benefits: [
      'Digitale Tierakte mit Impfungen, Behandlungen und Dokumenten.',
      'Pflegepläne und Erinnerungen für Fütterung, Tierarzt und Pflege.',
      'Fotoalbum und integrierter Shop für Tierbedarf.',
    ],
    whatYouDo: [
      'Haustiere anlegen und Tierakten pflegen',
      'Pflegepläne und Erinnerungen einrichten',
      'Fotos im Album verwalten',
      'Tierbedarf im integrierten Shop bestellen',
    ],
    flows: [
      {
        title: 'Haustier anlegen',
        steps: ['Name & Tierart eingeben', 'Geburtsdatum & Rasse erfassen', 'Tierarzt-Daten hinterlegen', 'Impfpass digitalisieren'],
      },
      {
        title: 'Pflege organisieren',
        steps: ['Pflegeplan erstellen', 'Erinnerungen aktivieren', 'Tierarztbesuche dokumentieren', 'Fotos hochladen'],
      },
    ],
    cta: 'Legen Sie Ihr erstes Haustier an — alles an einem Ort.',
    subTiles: [
      { title: 'Meine Tiere', route: '/portal/pets/meine-tiere', icon: Globe },
    ],
  },

  'MOD-06': {
    moduleCode: 'MOD-06',
    title: 'Verkauf',
    oneLiner: 'Vom Exposé bis zum Abschluss: Verkauf strukturiert, nachverfolgbar, partnerfähig.',
    benefits: [
      'Klarer Verkaufsprozess statt "Zettelwirtschaft".',
      'Partnernetzwerk gezielt einsetzen und Fortschritt messen.',
      'Transparente Vorgänge bis zum Notar.',
    ],
    whatYouDo: [
      'Objekte für Verkauf freigeben',
      'Exposé finalisieren und teilen',
      'Anfragen & Vorgänge steuern',
      'Besichtigungen koordinieren',
      'Angebote dokumentieren und vergleichen',
      'Reporting/Performance auswerten',
    ],
    flows: [
      {
        title: 'Objekt in Verkauf geben',
        steps: ['Objekt wählen', 'Exposé prüfen', 'Freigeben', 'Partner/Interessenten bedienen'],
      },
      {
        title: 'Abschluss vorbereiten',
        steps: ['Angebot wählen', 'Reservierung', 'Notartermin', 'Status/Reporting'],
      },
    ],
    cta: 'Geben Sie ein Objekt frei – dann beginnt der strukturierte Prozess.',
    subTiles: [
      { title: 'Objekte', route: '/portal/verkauf/objekte', icon: Building2 },
      { title: 'Anfragen', route: '/portal/verkauf/anfragen', icon: MessageSquare },
      { title: 'Vorgänge', route: '/portal/verkauf/vorgaenge', icon: GitBranch },
      { title: 'Reporting', route: '/portal/verkauf/reporting', icon: BarChart },
      { title: 'Einstellungen', route: '/portal/verkauf/einstellungen', icon: Settings },
    ],
  },

  'MOD-07': {
    moduleCode: 'MOD-07',
    title: 'Finanzierung',
    oneLiner: 'Bankfertig in wenigen Schritten: Selbstauskunft, Unterlagen, Anfrage, Status.',
    benefits: [
      'Selbstauskunft einmal pflegen – für alle zukünftigen Anfragen.',
      'Unterlagen vollständig, geordnet, jederzeit nachreichbar.',
      'Status klar sichtbar – ohne Nachtelefonieren.',
    ],
    whatYouDo: [
      'Selbstauskunft ausfüllen und aktualisieren',
      'Bonitätsdokumente hochladen',
      'Objekt auswählen (Bestand/Favorit/Manuell)',
      'Anfrage erstellen und einreichen',
      'Status-Timeline verfolgen',
      'Rückfragen schnell beantworten',
    ],
    flows: [
      {
        title: 'Start mit Selbstauskunft',
        steps: ['Daten ausfüllen', 'Dokumente hochladen', 'readiness verbessern'],
      },
      {
        title: 'Finanzierung anfragen',
        steps: ['Anfrage', 'Objekt wählen', 'Betrag/Parameter', 'Einreichen', 'Status prüfen'],
      },
    ],
    cta: 'Starten Sie mit der Selbstauskunft – das beschleunigt die Bearbeitung.',
    subTiles: [
      { title: 'Selbstauskunft', route: '/portal/finanzierung/selbstauskunft', icon: FileEdit },
      { title: 'Dokumente', route: '/portal/finanzierung/dokumente', icon: FolderOpen },
      { title: 'Anfrage', route: '/portal/finanzierung/anfrage', icon: FileStack },
      { title: 'Status', route: '/portal/finanzierung/status', icon: Activity },
    ],
  },

  'MOD-08': {
    moduleCode: 'MOD-08',
    title: 'Immo Suche',
    oneLiner: 'Suchen, vergleichen, simulieren – Ihr Weg zum nächsten Investment.',
    benefits: [
      'Investment-Suche mit zVE + EK: Sehen Sie sofort Ihre monatliche Belastung.',
      'Favoriten mit gespeicherten Finanzierungsparametern für spätere Simulation.',
      'Portfolio-Simulation: Wie verändert ein Neukauf Ihr Gesamtvermögen?',
      'Suchmandat: Beauftragen Sie einen Akquise-Manager über Zone 1.',
    ],
    whatYouDo: [
      'Objekte suchen (Investment-Suche oder klassisch)',
      'Favoriten mit zVE/EK-Parametern speichern',
      'Portfolio-Simulation mit 40-Jahres-Projektion',
      'Suchmandat erstellen und einreichen',
      'Finanzierungsanfrage aus Favorit starten',
    ],
    flows: [
      {
        title: 'Workflow A: Selbstständige Suche',
        steps: ['Suche (zVE + EK)', 'Favorisieren', 'Simulation', '→ Finanzierung (MOD-07)'],
      },
      {
        title: 'Workflow B: Suchmandat (Acquiary)',
        steps: ['Mandat erstellen', 'Einreichen → Zone 1', 'Zuweisung an Akquise-Manager', '→ MOD-12'],
      },
    ],
    cta: 'Starten Sie mit einer Investment-Suche – geben Sie zVE und Eigenkapital ein.',
    subTiles: [
      { title: 'Suche', route: '/portal/investments/suche', icon: Search },
      { title: 'Favoriten', route: '/portal/investments/favoriten', icon: Heart },
      { title: 'Mandat', route: '/portal/investments/mandat', icon: FileSignature },
      { title: 'Simulation', route: '/portal/investments/simulation', icon: Calculator },
    ],
  },

  'MOD-09': {
    moduleCode: 'MOD-09',
    title: 'Vertriebspartner',
    oneLiner: 'Beraten, dokumentieren, abschließen – Ihr Partner-Cockpit für Objektvertrieb.',
    benefits: [
      'Vollständiger Zugriff auf alle freigegebenen Investment-Objekte.',
      'Live-Simulationen direkt im Kundengespräch.',
      'Provisionsansprüche transparent und auditierbar.',
    ],
    whatYouDo: [
      'Objekte aus dem Katalog präsentieren und filtern',
      'Investment-Simulationen mit Kunden durchführen',
      'Kunden-Kontakte verwalten und dokumentieren',
      'Provisionen und Netzwerk-Performance überwachen',
    ],
    flows: [
      {
        title: 'Objektpräsentation',
        steps: ['Katalog filtern', 'Objekt vormerken (♥)', 'In Beratung öffnen', 'Simulation durchführen'],
      },
      {
        title: 'Deal abschließen',
        steps: ['Kunden-Kontakt pflegen', 'Status aktualisieren', 'Provision im Netzwerk-Tab'],
      },
    ],
    cta: 'Starten Sie im Katalog – und führen Sie Ihren nächsten Kunden zum Investment.',
    subTiles: [
      { title: 'Katalog', route: '/portal/vertriebspartner/katalog', icon: LayoutGrid },
      { title: 'Beratung', route: '/portal/vertriebspartner/beratung', icon: MessageCircle },
      { title: 'Kunden', route: '/portal/vertriebspartner/kunden', icon: Users },
      { title: 'Netzwerk', route: '/portal/vertriebspartner/network', icon: Network },
    ],
  },

  'MOD-10': {
    moduleCode: 'MOD-10',
    title: 'Lead Manager',
    oneLiner: 'Aus Interesse wird Abschluss: Leads aufnehmen, qualifizieren, durch die Pipeline führen.',
    benefits: [
      'Leads gehen nicht verloren – Inbox + klare Zuständigkeit.',
      'Qualifizierung sorgt für Fokus auf die richtigen Kontakte.',
      'Pipeline zeigt jederzeit, wo Geld liegt.',
    ],
    whatYouDo: [
      'Leads übernehmen und priorisieren',
      'Daten anreichern und qualifizieren',
      'Status/Pipeline pflegen',
      'Übergaben an Partner/Projekte vorbereiten',
      'Kampagnen/Quelle auswerten',
      'Abschlüsse dokumentieren',
    ],
    flows: [
      {
        title: 'Lead aus Inbox in Pipeline',
        steps: ['Inbox', 'Qualifizieren', 'Pipeline-Stufe setzen', 'Nächste Aktion'],
      },
      {
        title: 'Lead wird Kunde',
        steps: ['Pipeline', 'Abschluss', 'Übergabe in Kundenprojekt'],
      },
    ],
    cta: 'Öffnen Sie die Inbox – und übernehmen Sie die nächsten Chancen.',
    subTiles: [
      { title: 'Inbox', route: '/portal/provisionen/inbox', icon: Inbox },
      { title: 'Meine Leads', route: '/portal/provisionen/meine', icon: User },
      { title: 'Pipeline', route: '/portal/provisionen/pipeline', icon: GitBranch },
      { title: 'Werbung', route: '/portal/provisionen/werbung', icon: Megaphone },
    ],
  },

  'MOD-11': {
    moduleCode: 'MOD-11',
    title: 'Finanzierungsmanager',
    oneLiner: 'Ihre Workstation: Fälle annehmen, prüfen, bankfertig machen, einreichen.',
    benefits: [
      'Strukturierte Fallbearbeitung mit klarer Übersicht.',
      'Unstimmigkeiten schneller erkennen und klären.',
      'Einreichung effizient vorbereiten.',
    ],
    whatYouDo: [
      'Zugewiesene Mandate annehmen und bearbeiten',
      'Kundendaten prüfen und vervollständigen',
      'Dokumente sichten und Vollständigkeit herstellen',
      'Bankauswahl treffen und Paket zusammenstellen',
      'Status pflegen und Kommunikation unterstützen',
      'Fälle nach Bearbeitungsstand priorisieren',
    ],
    flows: [
      {
        title: 'Fallstart',
        steps: ['Mandat öffnen', 'Daten prüfen', 'Dokumente checken', 'Status setzen'],
      },
      {
        title: 'Einreichung',
        steps: ['Paket schnüren', 'Bank wählen', 'Einreichen', 'Rückmeldungen dokumentieren'],
      },
    ],
    cta: 'Starten Sie mit dem nächsten Fall – und bringen Sie ihn bankfertig.',
    hint: 'Zuweisung von Mandaten erfolgt intern.',
    subTiles: [
      { title: 'Dashboard', route: '/portal/finanzierungsmanager/dashboard', icon: LayoutGrid },
      { title: 'Fälle', route: '/portal/finanzierungsmanager/faelle', icon: ClipboardList },
      { title: 'Kommunikation', route: '/portal/finanzierungsmanager/kommunikation', icon: MessageCircle },
      { title: 'Status', route: '/portal/finanzierungsmanager/status', icon: Activity },
    ],
  },

  // =========================================================================
  // NEW MODULES (MOD-12 to MOD-20)
  // =========================================================================
  'MOD-12': {
    moduleCode: 'MOD-12',
    title: 'Akquise Manager',
    oneLiner: 'Vom Exposé zur Entscheidung: strukturiert, nachvollziehbar, schneller.',
    benefits: [
      'Alle eingegangenen Angebote zentral in einer Inbox.',
      'Mandate mit Kontakt-First Workflow erstellen und steuern.',
      'Kalkulation und Analyse-Tools für fundierte Entscheidungen.',
    ],
    whatYouDo: [
      'Dashboard prüfen: KPIs, aktive Mandate, neue Objekteingänge',
      'Mandate erstellen und Ankaufsprofile definieren',
      'Objekteingang sichten: Absage / Interesse / Preisvorschlag',
      'Kalkulation durchführen: Bestand (Hold) und Aufteiler (Flip)',
      'Tools nutzen: Exposé-Upload, Portal-Recherche, Immobilienbewertung',
    ],
    flows: [
      {
        title: 'Neues Mandat anlegen',
        steps: ['Kontakt auswählen/anlegen', 'Ankaufsprofil definieren', 'Mandat aktivieren'],
      },
      {
        title: 'Objekteingang bearbeiten',
        steps: ['Inbox öffnen', 'Exposé prüfen', 'Kalkulation', 'Entscheidung: Absage/Interesse/Preisvorschlag'],
      },
    ],
    cta: 'Zum Dashboard – und überblicken Sie Ihre Akquise-Arbeit.',
    subTiles: [
      { title: 'Dashboard', route: '/portal/akquise-manager/dashboard', icon: LayoutGrid },
      { title: 'Mandate', route: '/portal/akquise-manager/mandate', icon: ClipboardList },
      { title: 'Objekteingang', route: '/portal/akquise-manager/objekteingang', icon: Inbox },
      { title: 'Tools', route: '/portal/akquise-manager/tools', icon: Wrench },
    ],
  },

  'MOD-13': {
    moduleCode: 'MOD-13',
    title: 'Projektmanager',
    oneLiner: 'Bauträger- und Aufteiler-Projekte: Exposé hochladen – KI erstellt Projekt automatisch.',
    benefits: [
      'Magic Intake: Exposé + Wohnungsliste hochladen → Projekt wird automatisch erstellt.',
      'Portfolio-Übersicht mit Aufteiler-KPIs: Einheitenstatus, Umsatz, Marge auf einen Blick.',
      'Reservierungs- und Vertriebsworkflow mit Partner-Attribution und Provisionsberechnung.',
      'Marketing-Integration: Kaufy-Marktplatz, Premium-Platzierung, automatische Landingpages.',
    ],
    whatYouDo: [
      'Exposé + Wohnungsliste hochladen — KI erstellt Projekt',
      'Projekte und Einheiten im Portfolio verwalten',
      'Reservierungen und Verkaufsstatus pro Einheit verwalten',
      'Partner-Performance und Provisionen nachverfolgen',
      'Marketing-Kanäle aktivieren: Kaufy, Landingpages',
    ],
    flows: [
      {
        title: 'Projekt starten (Magic Intake)',
        steps: ['Exposé hochladen', 'Wohnungsliste hochladen', 'KI extrahiert Daten', 'Prüfen & bestätigen'],
      },
      {
        title: 'Einheit verkaufen',
        steps: ['Reservierung erfassen', 'Notartermin planen', 'Verkauf abschließen', 'Provision vorbereiten'],
      },
    ],
    cta: 'Dashboard öffnen – und starten Sie Ihr erstes Projekt mit KI-Import.',
    subTiles: [
      { title: 'Dashboard', route: '/portal/projekte/dashboard', icon: FolderKanban },
      { title: 'Projekte', route: '/portal/projekte/projekte', icon: Building2 },
      { title: 'Vertrieb', route: '/portal/projekte/vertrieb', icon: Users },
      { title: 'Marketing', route: '/portal/projekte/marketing', icon: Globe },
    ],
  },

  'MOD-14': {
    moduleCode: 'MOD-14',
    title: 'Communication Pro',
    oneLiner: 'Professionelle Outreach-Suite: Serien-E-Mails, Recherche, Social, Agenten.',
    benefits: [
      'Kampagnen und Sequenzen effizient erstellen.',
      'Kontakt- und Firmenrecherche direkt integriert.',
      'Agenten-gestützte Assistenz für mehr Reichweite.',
    ],
    whatYouDo: [
      'Serien-E-Mails planen und versenden',
      'Kontakte/Firmen recherchieren und anreichern',
      'Social-Content planen',
      'Agenten-Flows für Automatisierung nutzen',
    ],
    flows: [
      {
        title: 'Kampagne erstellen',
        steps: ['Serien-E-Mails', 'Template wählen', 'Empfänger', 'Zeitplan', 'Versand'],
      },
      {
        title: 'Kontakte anreichern',
        steps: ['Recherche', 'Suche', 'Treffer prüfen', 'in Kontakte übernehmen'],
      },
    ],
    cta: 'Erste Serien-E-Mail erstellen – und erreichen Sie mehr.',
    subTiles: [
      { title: 'Serien-E-Mails', route: '/portal/communication-pro/serien-emails', icon: AtSign },
      { title: 'Recherche', route: '/portal/communication-pro/recherche', icon: Search },
      { title: 'Social', route: '/portal/communication-pro/social', icon: Globe },
      { title: 'Agenten', route: '/portal/communication-pro/agenten', icon: Bot },
    ],
  },

  'MOD-15': {
    moduleCode: 'MOD-15',
    title: 'Fortbildung',
    oneLiner: 'Kurse, Lernpfade und Zertifikate für Partner und Teams.',
    benefits: [
      'Zugriff auf strukturierten Kurskatalog.',
      'Lernfortschritt jederzeit nachvollziehbar.',
      'Zertifikate als Nachweis für Qualifikationen.',
    ],
    whatYouDo: [
      'Kurse durchsuchen und starten',
      'Lernfortschritt verfolgen',
      'Zertifikate einsehen und teilen',
      'Präferenzen für Empfehlungen setzen',
    ],
    flows: [
      {
        title: 'Kurs absolvieren',
        steps: ['Katalog', 'Kurs starten', 'Module durcharbeiten', 'Zertifikat erhalten'],
      },
      {
        title: 'Zertifikat teilen',
        steps: ['Zertifikate', 'Auswählen', 'Teilen/Herunterladen'],
      },
    ],
    cta: 'Kurskatalog öffnen – und starten Sie Ihre Weiterbildung.',
    subTiles: [
      { title: 'Katalog', route: '/portal/fortbildung/katalog', icon: BookOpen },
      { title: 'Meine Kurse', route: '/portal/fortbildung/meine-kurse', icon: GraduationCap },
      { title: 'Zertifikate', route: '/portal/fortbildung/zertifikate', icon: Award },
      { title: 'Einstellungen', route: '/portal/fortbildung/settings', icon: Settings },
    ],
  },

  'MOD-16': {
    moduleCode: 'MOD-16',
    title: 'Shop',
    oneLiner: 'Bürobedarf, IT-Geräte und mehr – direkt bestellen oder mieten über integrierte Shops.',
    benefits: [
      'Zugang zu Amazon Business, OTTO Office und Miete24 aus einer Oberfläche.',
      'Bestellungen als Widgets verwalten – übersichtlich und nachvollziehbar.',
      'Integration vorbereitet für PA-API, Affiliate und Partner-Anbindungen.',
    ],
    whatYouDo: [
      'Produkte in integrierten Shops suchen und vergleichen',
      'Bestellungen anlegen, verwalten und nachverfolgen',
      'Shop-Zugangsdaten konfigurieren',
      'Positionen, Kosten und Lieferstatus dokumentieren',
    ],
    flows: [
      {
        title: 'Produkt bestellen',
        steps: ['Shop öffnen', 'Produkt suchen', 'In Bestellung aufnehmen', 'Freigeben'],
      },
      {
        title: 'Bestellung verwalten',
        steps: ['Bestellungen', 'Status prüfen', 'Lieferung dokumentieren', 'Abschließen'],
      },
    ],
    cta: 'Öffnen Sie einen Shop – und starten Sie Ihre erste Bestellung.',
    subTiles: [
      { title: 'Amazon Business', route: '/portal/services/amazon', icon: ShoppingCart },
      { title: 'OTTO Office', route: '/portal/services/otto-office', icon: Package },
      { title: 'Miete24', route: '/portal/services/miete24', icon: Laptop },
      { title: 'Bestellungen', route: '/portal/services/bestellungen', icon: ClipboardCheck },
    ],
  },

  'MOD-17': {
    moduleCode: 'MOD-17',
    title: 'Car-Management',
    oneLiner: 'Ihr digitaler Fuhrpark: Fahrzeuge, Versicherungen, Fahrtenbuch und Angebote an einem Ort.',
    benefits: [
      'Alle Fahrzeuge mit Stammdaten, Finanzierung und Versicherung auf einen Blick.',
      'Versicherungsvergleich starten und bis zu 40% sparen — Daten werden automatisch übernommen.',
      'Fahrtenbuch für steuerliche Nachweise führen und als PDF oder CSV exportieren.',
      'Leasing-Deals und Mietangebote von Top-Anbietern entdecken.',
    ],
    whatYouDo: [
      'Fahrzeuge anlegen und Stammdaten pflegen',
      'Versicherungspolicen verwalten und vergleichen',
      'Schadensfälle dokumentieren und melden',
      'Fahrtenbuch anbinden und Fahrten klassifizieren',
      'HU/AU-Termine im Blick behalten',
    ],
    flows: [
      {
        title: 'Fahrzeug erfassen',
        steps: ['Fahrzeuge öffnen', '+ Fahrzeug hinzufügen', 'Kennzeichen eingeben', 'Details ergänzen'],
      },
      {
        title: 'Versicherung vergleichen',
        steps: ['Versicherungen öffnen', 'Police auswählen', 'Vergleich starten', 'Bestes Angebot wählen'],
      },
      {
        title: 'Schaden melden',
        steps: ['Fahrzeugakte öffnen', 'Schäden-Tab', 'Schaden melden', 'Fotos hochladen'],
      },
    ],
    cta: 'Legen Sie Ihr erstes Fahrzeug an und behalten Sie den vollen Überblick.',
    hint: 'Tipp: Laden Sie den Fahrzeugschein hoch — die Daten werden automatisch ausgelesen.',
    subTiles: [
      { title: 'Fahrzeuge', route: '/portal/cars/fahrzeuge', icon: Car },
      { title: 'Versicherungen', route: '/portal/cars/versicherungen', icon: ShieldCheck },
      { title: 'Fahrtenbuch', route: '/portal/cars/fahrtenbuch', icon: BookOpen },
      { title: 'Angebote', route: '/portal/cars/angebote', icon: ShoppingCart },
    ],
  },

  'MOD-18': {
    moduleCode: 'MOD-18',
    title: 'Finanzanalyse',
    oneLiner: 'Kennzahlen, Reports und Szenarien für bessere Entscheidungen.',
    benefits: [
      'Alle wichtigen Kennzahlen auf einem Dashboard.',
      'Reports und Exports für Dokumentation.',
      'Was-wäre-wenn-Szenarien für Planung.',
    ],
    whatYouDo: [
      'Dashboard mit KPIs prüfen',
      'Reports erstellen und exportieren',
      'Szenarien durchspielen',
      'Parameter anpassen',
    ],
    flows: [
      {
        title: 'Report erstellen',
        steps: ['Dashboard', 'Reports', 'Zeitraum wählen', 'Exportieren'],
      },
      {
        title: 'Szenario analysieren',
        steps: ['Szenarien', 'Parameter setzen', 'Ergebnis prüfen', 'Vergleichen'],
      },
    ],
    cta: 'Dashboard öffnen – und gewinnen Sie Klarheit über Ihre Zahlen.',
    subTiles: [
      { title: 'Dashboard', route: '/portal/finanzanalyse/dashboard', icon: LineChart },
      { title: 'Reports', route: '/portal/finanzanalyse/reports', icon: FileBarChart },
      { title: 'Szenarien', route: '/portal/finanzanalyse/szenarien', icon: Lightbulb },
      { title: 'Einstellungen', route: '/portal/finanzanalyse/settings', icon: Settings },
    ],
  },

  'MOD-19': {
    moduleCode: 'MOD-19',
    title: 'Photovoltaik',
    oneLiner: 'PV-Anlagen verwalten: Monitoring, Dokumente, Stammdaten – alles an einem Ort.',
    benefits: [
      'Live-Monitoring Ihrer PV-Anlagen mit Echtzeit-Leistungsdaten.',
      'Automatische Dokumentenstruktur und Checkliste pro Anlage.',
      'Vorbereitet für SMA, Solar-Log und finAPI Integration.',
    ],
    whatYouDo: [
      'PV-Anlagen anlegen und verwalten',
      'Live-Monitoring mit Tageskurven verfolgen',
      'Dokumente strukturiert ablegen',
      'Integrationen vorbereiten',
    ],
    flows: [
      {
        title: 'Neue PV-Anlage anlegen',
        steps: ['Anlage erstellen', 'Stammdaten eingeben', 'Monitoring starten', 'Dokumente hochladen'],
      },
      {
        title: 'Live-Monitoring nutzen',
        steps: ['Monitoring öffnen', 'Leistung prüfen', 'Ertrag analysieren'],
      },
    ],
    cta: 'Starten Sie jetzt – und nutzen Sie die Kraft der Sonne.',
    subTiles: [
      { title: 'Anlagen', route: '/portal/photovoltaik/anlagen', icon: Sun },
      { title: 'Monitoring', route: '/portal/photovoltaik/monitoring', icon: Activity },
      { title: 'Dokumente', route: '/portal/photovoltaik/dokumente', icon: Folder },
      { title: 'Einstellungen', route: '/portal/photovoltaik/einstellungen', icon: Settings },
    ],
  },

  'MOD-20': {
    moduleCode: 'MOD-20',
    title: 'Miety',
    oneLiner: 'Ihr Mieterportal: Dokumente, Kommunikation, Zählerstände und mehr.',
    benefits: [
      'Alle wichtigen Dokumente an einem Ort.',
      'Direkte Kommunikation mit der Verwaltung.',
      'Zählerstände, Versorgung und Versicherungen übersichtlich.',
    ],
    whatYouDo: [
      'Dokumente einsehen und herunterladen',
      'Nachrichten an die Verwaltung senden',
      'Zählerstände melden',
      'Versorgungsverträge verwalten',
      'Versicherungen prüfen',
    ],
    flows: [
      {
        title: 'Zählerstand melden',
        steps: ['Zählerstände', 'Wert eingeben', 'Bestätigen'],
      },
      {
        title: 'Anfrage an Verwaltung',
        steps: ['Kommunikation', 'Nachricht schreiben', 'Absenden'],
      },
    ],
    cta: 'Zur Übersicht – und behalten Sie Ihre Mietwohnung im Blick.',
    subTiles: [
      { title: 'Übersicht', route: '/portal/miety/uebersicht', icon: Home },
      { title: 'Dokumente', route: '/portal/miety/dokumente', icon: FileBox },
      { title: 'Kommunikation', route: '/portal/miety/kommunikation', icon: MessageSquare },
      { title: 'Zählerstände', route: '/portal/miety/zaehlerstaende', icon: Thermometer },
      { title: 'Versorgung', route: '/portal/miety/versorgung', icon: Plug },
      { title: 'Versicherungen', route: '/portal/miety/versicherungen', icon: ShieldCheck },
    ],
  },

  'MOD-22': {
    moduleCode: 'MOD-22',
    title: 'Pet Manager',
    oneLiner: 'Franchise-Partner Portal für Haustier-Dienstleistungen und Netzwerk-Management.',
    benefits: [
      'Zentrale Übersicht über alle Franchise-Standorte und Partner.',
      'Dienstleistungen und Buchungen effizient verwalten.',
      'Netzwerk-Performance und Umsätze transparent auswerten.',
    ],
    whatYouDo: [
      'Franchise-Partner und Standorte verwalten',
      'Dienstleistungskatalog pflegen',
      'Buchungen und Termine koordinieren',
      'Netzwerk-Performance analysieren',
    ],
    flows: [
      {
        title: 'Partner onboarden',
        steps: ['Partner anlegen', 'Standort konfigurieren', 'Dienstleistungen zuweisen', 'Freischalten'],
      },
      {
        title: 'Betrieb steuern',
        steps: ['Dashboard prüfen', 'Buchungen verwalten', 'Performance auswerten'],
      },
    ],
    cta: 'Starten Sie mit dem Dashboard – und behalten Sie Ihr Netzwerk im Blick.',
    subTiles: [
      { title: 'Kalender & Buchungen', route: '/portal/petmanager/buchungen', icon: LayoutGrid },
      { title: 'Leistungen & Verfügbarkeit', route: '/portal/petmanager/leistungen', icon: ClipboardList },
      { title: 'Zahlungen & Rechnungen', route: '/portal/petmanager/zahlungen', icon: Network },
      { title: 'Kunden & Tiere', route: '/portal/petmanager/kunden', icon: Users },
    ],
  },
};
