import { HowItWorksContent } from './ModuleHowItWorks';
import {
  User, Building, CreditCard, Shield,
  Mail, FileText, Users, Calendar,
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
  ShoppingCart, ClipboardCheck, Package,
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
      'Abrechnung, Credits und Sicherheit sind transparent an einem Ort.',
      'Änderungen wirken sofort – ohne Doppeleingaben.',
    ],
    whatYouDo: [
      'Profil- und Kontaktdaten pflegen',
      'Firmen-/Nutzungsmodus verwalten (privat/geschäftlich)',
      'Abrechnung & Rechnungen einsehen',
      'Bankdaten für Auszahlungen hinterlegen',
      'Sicherheitseinstellungen (Passwort, 2FA, Sessions)',
    ],
    flows: [
      {
        title: 'Startklar nach Registrierung',
        steps: ['Profil vervollständigen', 'Abrechnung prüfen', 'Bankdaten hinterlegen', 'Sicherheit aktivieren'],
      },
      {
        title: 'Wechsel in geschäftliche Nutzung',
        steps: ['Firma öffnen', 'Angaben ergänzen', 'Abrechnung anpassen', 'fertig'],
      },
    ],
    cta: 'Vervollständigen Sie Ihr Profil – das beschleunigt alle Prozesse.',
    subTiles: [
      { title: 'Profil', route: '/portal/stammdaten/profil', icon: User },
      { title: 'Firma', route: '/portal/stammdaten/firma', icon: Building },
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
      'Vermieter-Kontexte organisieren (Portfolio-Logik)',
      'Sanierung & Maßnahmen dokumentieren',
      'Bewertung & Wertentwicklung nachvollziehen',
    ],
    flows: [
      {
        title: 'Objekt aufnehmen',
        steps: ['Portfolio', 'Objekt anlegen', 'Einheiten ergänzen', 'Mietbestand pflegen', 'Dokumente verknüpfen'],
      },
      {
        title: 'Daten für Verkauf vorbereiten',
        steps: ['Objekt öffnen', 'Exposé prüfen', 'Bilder/Dokumente ergänzen', 'an Verkauf übergeben'],
      },
      {
        title: 'Daten für Finanzierung nutzen',
        steps: ['Objekt öffnen', 'Kennzahlen prüfen', 'an Finanzierung übergeben'],
      },
    ],
    cta: 'Pflegen Sie zuerst die Immobilienakte – alles Weitere baut darauf auf.',
    hint: 'Operative Mietprozesse (Mieteingang, Mahnwesen, Vermietungsvorgänge) passieren in MSV (MOD-05).',
    subTiles: [
      { title: 'Kontexte', route: '/portal/immobilien/kontexte', icon: FolderTree },
      { title: 'Portfolio', route: '/portal/immobilien/portfolio', icon: LayoutGrid },
      { title: 'Sanierung', route: '/portal/immobilien/sanierung', icon: Hammer },
      { title: 'Bewertung', route: '/portal/immobilien/bewertung', icon: TrendingUp },
    ],
  },

  'MOD-05': {
    moduleCode: 'MOD-05',
    title: 'MSV',
    oneLiner: 'Die Workbench für operative Mietprozesse – basierend auf dem Datenbestand aus MOD-04.',
    benefits: [
      'Kontrolle über Soll/Ist und offene Posten ohne Excel.',
      'Vermietungsvorgänge strukturiert bis zum Vertrag.',
      'Standardisierte Kommunikation (Mahnung, Erinnerungen) ohne Zeitverlust.',
    ],
    whatYouDo: [
      'Mieteingänge prüfen und zuordnen',
      'Offene Posten managen und Mahnungen auslösen',
      'Vermietung starten: Inserat → Interessenten → Auswahl → Vertrag',
      'Übergaben und Protokolle dokumentieren',
      'Einstellungen für Fristen/Regeln verwalten',
      'Prozesse sauber dokumentieren',
    ],
    flows: [
      {
        title: 'Rückstand bearbeiten',
        steps: ['Mieteingang', 'Abweichung erkennen', 'Erinnerung/Mahnung', 'Dokumentation im DMS'],
      },
      {
        title: 'Neuvermietung',
        steps: ['Vermietung', 'Inserat', 'Bewerber', 'Entscheidung', 'Vertrag', 'Übergabe'],
      },
    ],
    cta: 'Starten Sie mit dem Mieteingang – das schafft sofort Übersicht.',
    hint: 'MSV arbeitet auf dem Daten-Bestand aus MOD-04 (Immobilienakte: Objekte/Einheiten/Mietdaten-Bestand).',
    subTiles: [
      { title: 'Objekte', route: '/portal/msv/objekte', icon: Building2 },
      { title: 'Mieteingang', route: '/portal/msv/mieteingang', icon: Wallet },
      { title: 'Vermietung', route: '/portal/msv/vermietung', icon: Users },
      { title: 'Einstellungen', route: '/portal/msv/einstellungen', icon: Settings },
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
    title: 'Investment-Suche',
    oneLiner: 'Suchen, vergleichen, rechnen – damit Sie bessere Investment-Entscheidungen treffen.',
    benefits: [
      'Finden Sie passende Objekte schneller mit Filtern & Favoriten.',
      'Simulieren Sie Rendite/Cashflow bevor Sie entscheiden.',
      'Starten Sie Finanzierung direkt aus dem Kontext.',
    ],
    whatYouDo: [
      'Objekte suchen und filtern',
      'Favoritenliste aufbauen',
      'Simulationen durchführen',
      'Szenarien vergleichen',
      'Mandat/Suchauftrag vorbereiten',
      'Übergabe an Finanzierung starten',
    ],
    flows: [
      {
        title: 'Objekt finden & prüfen',
        steps: ['Suche', 'Favorit', 'Simulation', 'Entscheidung'],
      },
      {
        title: 'Von Simulation zur Finanzierung',
        steps: ['Simulation', 'Parameter fixieren', 'Finanzierung anfragen'],
      },
    ],
    cta: 'Speichern Sie ein Objekt als Favorit und starten Sie die Simulation.',
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
    oneLiner: 'Beraten, dokumentieren, abschließen – mit Katalog, Projekten und Provisionen.',
    benefits: [
      'Zugriff auf freigegebene Objekte mit klarer Struktur.',
      'Kundenprojekte sauber dokumentieren.',
      'Provisionsansprüche transparent verfolgen.',
    ],
    whatYouDo: [
      'Katalog durchsuchen und Objekte präsentieren',
      'Beratung dokumentieren',
      'Kunden/Projekte führen',
      'Simulationen im Gespräch nutzen',
      'Pipeline/Netzwerk organisieren',
      'Abrechnung/Provisionen nachverfolgen',
    ],
    flows: [
      {
        title: 'Objektvorschlag für Kunden',
        steps: ['Katalog', 'Objekt', 'Exposé teilen', 'Beratung dokumentieren'],
      },
      {
        title: 'Kunde Richtung Abschluss',
        steps: ['Kundenprojekt', 'nächste Schritte', 'Finanzierung/Verkauf anstoßen'],
      },
    ],
    cta: 'Öffnen Sie den Katalog – und starten Sie ein Kundenprojekt.',
    subTiles: [
      { title: 'Katalog', route: '/portal/vertriebspartner/katalog', icon: LayoutGrid },
      { title: 'Beratung', route: '/portal/vertriebspartner/beratung', icon: MessageCircle },
      { title: 'Kunden', route: '/portal/vertriebspartner/kunden', icon: Users },
      { title: 'Netzwerk', route: '/portal/vertriebspartner/network', icon: Network },
    ],
  },

  'MOD-10': {
    moduleCode: 'MOD-10',
    title: 'Leads',
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
      { title: 'Inbox', route: '/portal/leads/inbox', icon: Inbox },
      { title: 'Meine Leads', route: '/portal/leads/meine', icon: User },
      { title: 'Pipeline', route: '/portal/leads/pipeline', icon: GitBranch },
      { title: 'Werbung', route: '/portal/leads/werbung', icon: Megaphone },
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
    title: 'Akquise-Manager',
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
    title: 'Projekte',
    oneLiner: 'Projektübersicht: Status, Meilensteine und zugeordnete Assets an einem Ort.',
    benefits: [
      'Alle Projekte mit Status auf einen Blick.',
      'Zugeordnete Objekte/Assets klar strukturiert.',
      'Meilensteine und Timeline für Transparenz.',
    ],
    whatYouDo: [
      'Projekte anlegen und verwalten',
      'Assets/Objekte zuordnen',
      'Meilensteine und Aufgaben planen',
      'Timeline verfolgen',
      'Projektrollen und Freigaben definieren',
    ],
    flows: [
      {
        title: 'Neues Projekt starten',
        steps: ['Übersicht', 'Projekt anlegen', 'Assets zuordnen', 'Meilensteine setzen'],
      },
      {
        title: 'Projekt abschließen',
        steps: ['Timeline prüfen', 'Aufgaben abhaken', 'Status final setzen'],
      },
    ],
    cta: 'Projektübersicht öffnen – und behalten Sie den Überblick.',
    subTiles: [
      { title: 'Übersicht', route: '/portal/projekte/uebersicht', icon: FolderKanban },
      { title: 'Timeline', route: '/portal/projekte/timeline', icon: Clock },
      { title: 'Dokumente', route: '/portal/projekte/dokumente', icon: FileText },
      { title: 'Einstellungen', route: '/portal/projekte/einstellungen', icon: Cog },
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
    title: 'Services',
    oneLiner: 'Service-Katalog: Beratung, Unterlagen-Check, Bewertung und mehr – alles anfragen.',
    benefits: [
      'Alle verfügbaren Services übersichtlich im Katalog.',
      'Anfragen stellen und Status verfolgen.',
      'Laufende Aufträge transparent managen.',
    ],
    whatYouDo: [
      'Services durchsuchen und auswählen',
      'Anfragen erstellen',
      'Aufträge verfolgen',
      'Ansprechpartner und Defaults pflegen',
    ],
    flows: [
      {
        title: 'Service anfragen',
        steps: ['Katalog', 'Service wählen', 'Anfrage stellen', 'Status prüfen'],
      },
      {
        title: 'Auftrag abschließen',
        steps: ['Aufträge', 'Details prüfen', 'Abnahme bestätigen'],
      },
    ],
    cta: 'Service auswählen – und profitieren Sie von professioneller Unterstützung.',
    subTiles: [
      { title: 'Katalog', route: '/portal/services/katalog', icon: ShoppingCart },
      { title: 'Anfragen', route: '/portal/services/anfragen', icon: ClipboardCheck },
      { title: 'Aufträge', route: '/portal/services/auftraege', icon: Package },
      { title: 'Einstellungen', route: '/portal/services/settings', icon: Settings },
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
    oneLiner: 'Self-Service PV-Journey: Angebot, Checkliste, Projekt, fertig.',
    benefits: [
      'Schnelles Angebot ohne Wartezeit.',
      'Strukturierte Checkliste für alle Voraussetzungen.',
      'Projektstatus jederzeit einsehbar.',
    ],
    whatYouDo: [
      'Angebot konfigurieren und anfordern',
      'Checkliste durcharbeiten',
      'Projektstatus verfolgen',
      'Einstellungen anpassen',
    ],
    flows: [
      {
        title: 'PV-Angebot starten',
        steps: ['Angebot', 'Daten eingeben', 'Berechnung', 'Anfrage absenden'],
      },
      {
        title: 'Projekt verfolgen',
        steps: ['Projekt', 'Status prüfen', 'Nächste Schritte'],
      },
    ],
    cta: 'Angebot starten – und nutzen Sie die Kraft der Sonne.',
    subTiles: [
      { title: 'Angebot', route: '/portal/photovoltaik/angebot', icon: Sun },
      { title: 'Checkliste', route: '/portal/photovoltaik/checkliste', icon: CheckSquare },
      { title: 'Projekt', route: '/portal/photovoltaik/projekt', icon: Folder },
      { title: 'Einstellungen', route: '/portal/photovoltaik/settings', icon: Settings },
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
};
