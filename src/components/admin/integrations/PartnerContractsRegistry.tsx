import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Shield,
  TrendingUp,
  Landmark,
  Heart,
  ShoppingCart,
  Smartphone,
  Car,
  PawPrint,
  Sun,
  Zap,
  Wrench,
  BookOpen,
  GraduationCap,
  Ticket,
  Award,
  Building2,
  Handshake,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PartnerContract {
  id: string;
  name: string;
  type: 'vermittler' | 'affiliate' | 'geschaeftskonto';
  module: string;
  purpose: string;
  commissionModel: string;
  network?: string;
  icon: React.ElementType;
  group: 'vermittler' | 'affiliate' | 'fortbildung' | 'geschaeftskonto';
  integrationDetails: string;
  initialActive?: boolean;
}

const PARTNER_CONTRACTS: PartnerContract[] = [
  // ── Vermittlerverträge ──
  {
    id: 'neo-digital',
    name: 'Neo Digital',
    type: 'vermittler',
    module: 'MOD-18 Sachversicherungen',
    purpose: 'Sachversicherungs-Vermittlung (Hausrat, Wohngebäude, Haftpflicht)',
    commissionModel: 'Courtage: lfd. Bestandsprovision (ca. 15–25 % der Jahresprämie)',
    icon: Shield,
    group: 'vermittler',
    integrationDetails:
      'Anbindung über Neo Digital API (REST). Vermittlervertrag nach §34d GewO erforderlich. ' +
      'Neo Digital stellt White-Label-Tarifrechner und Antragsstrecken bereit, die per iFrame oder API eingebunden werden. ' +
      'Registrierung über neo-digital.de/partner. Technisch: OAuth2-Authentifizierung, Webhook-Callbacks für Policen-Status. ' +
      'IHK-Registrierung als Versicherungsvermittler ist Voraussetzung.',
  },
  {
    id: 'upvest',
    name: 'Upvest',
    type: 'vermittler',
    module: 'MOD-18 Investment (Armstrong Depot)',
    purpose: 'Depot-/Wertpapier-Infrastruktur (BaFin-reguliert, WpIG)',
    commissionModel: 'Revenue-Share auf Assets under Management (AuM), ca. 0,1–0,3 % p.a.',
    icon: TrendingUp,
    group: 'vermittler',
    integrationDetails:
      'Anbindung über Upvest Investment API (REST/JSON). BaFin-Lizenz als vertraglich gebundener Vermittler (§3 WpIG) oder ' +
      'Haftungsdach erforderlich. Upvest übernimmt Custody, Order-Routing und Settlement. ' +
      'Integration: API-Key + Sandbox → KYC-Flow (IDnow/PostIdent eingebettet) → Depot-Eröffnung → Order-API. ' +
      'Dokumentation: docs.upvest.co. Onboarding-Dauer: ca. 4–8 Wochen inkl. Compliance-Prüfung.',
  },
  {
    id: 'europace',
    name: 'Europace',
    type: 'vermittler',
    module: 'MOD-18 Finanzierung',
    purpose: 'Baufinanzierungs-Marktplatz (400+ Bankpartner)',
    commissionModel: 'Courtage pro Abschluss (ca. 0,5–1,5 % der Darlehenssumme)',
    icon: Landmark,
    group: 'vermittler',
    integrationDetails:
      'Anbindung über Europace API (REST, GraphQL). Vertrag mit Europace AG (Hypoport-Gruppe) erforderlich, ' +
      'zzgl. Anbindung an mindestens einen Produktanbieter. §34i GewO-Erlaubnis (Immobiliardarlehensvermittler) ist Pflicht. ' +
      'API-Zugang über partner.europace.de, OAuth2-Flow. Kernendpunkte: Vorgänge anlegen, Angebote abrufen, Dokumente hochladen. ' +
      'BaufiSmart-Oberfläche kann als iFrame eingebettet werden. Onboarding: 2–4 Wochen.',
  },
  {
    id: 'zuerich',
    name: 'Zürich Versicherung',
    type: 'vermittler',
    module: 'MOD-18 Vorsorge',
    purpose: 'Lebensversicherungen, Berufsunfähigkeit, Altersvorsorge',
    commissionModel: 'Courtage: Abschlussprovision (ca. 4–5 % der Beitragssumme) + Bestandsprovision',
    icon: Heart,
    group: 'vermittler',
    integrationDetails:
      'Vermittlervertrag direkt mit Zürich Gruppe Deutschland. §34d GewO-Erlaubnis für Lebensversicherungen erforderlich. ' +
      'Anbindung über Zürich Vermittlerportal (Makler-Extranet) oder BiPRO-Schnittstelle (Normen 430/440 für Tarifierung/Antrag). ' +
      'Alternative: Anbindung über Maklerpool (z.B. Fonds Finanz, blau direkt) – vereinfacht Zugang zu mehreren Versicherern gleichzeitig. ' +
      'blau direkt bietet API-Anbindung (blau direkt API) mit automatischem Bestandsimport. Onboarding Pool: 1–2 Wochen.',
  },

  // ── Affiliate & Partner ──
  {
    id: 'amazon-partnernet',
    name: 'Amazon PartnerNet',
    type: 'affiliate',
    module: 'MOD-15 / MOD-16',
    purpose: 'Smart Home Kameras, Bücher, Bürobedarf',
    commissionModel: '1–3 % Elektronik, 5 % Bücher, 3 % Bürobedarf · 24h Cookie',
    network: 'Amazon',
    icon: ShoppingCart,
    group: 'affiliate',
    integrationDetails:
      'Registrierung unter partnernet.amazon.de. Sofortige Freischaltung, aber Validierung nach ersten 3 qualifizierten Sales innerhalb 180 Tagen. ' +
      'Integration: Affiliate-Links mit Tag-Parameter (?tag=xxx-21) in Produktkarten einbetten. ' +
      'Product Advertising API (PA-API 5.0) für automatischen Preis-/Verfügbarkeitsabruf verfügbar (Rate Limit: 1 Req/Sek). ' +
      'Auszahlung ab 25 € per Banküberweisung. Provisionen variieren nach Kategorie.',
  },
  {
    id: 'vodafone',
    name: 'Vodafone',
    type: 'affiliate',
    module: 'MOD-16 Services',
    purpose: 'Mobilfunk- & Festnetzverträge',
    commissionModel: 'Affiliate: 30–80 € pro Vertragsabschluss (je nach Tarif)',
    network: 'AWIN / Direkt',
    icon: Smartphone,
    group: 'affiliate',
    integrationDetails:
      'Vodafone Partner-Programm über AWIN (Advertiser ID prüfen) oder Vodafone Partnerprogramm direkt (vodafone.de/business/partner). ' +
      'Tracking via AWIN-Deeplinks oder Vodafone-eigene Tracking-URLs. ' +
      'Integration: Deeplinks zu Tarifseiten mit Subid-Tracking. Postback-URL für Conversion-Tracking konfigurierbar. ' +
      'Cookie-Laufzeit: 30 Tage. Auszahlung monatlich über AWIN (Netto 30).',
  },
  {
    id: 'miete24',
    name: 'Miete24',
    type: 'affiliate',
    module: 'MOD-06 Fahrzeuge / MOD-16 Services',
    purpose: 'Fahrzeug-Abos, IT-Gerätemiete, Büromöbel-Leasing',
    commissionModel: 'Affiliate-Provision: ca. 2–5 % des Mietvertragswertes',
    network: 'Direkt',
    icon: Car,
    group: 'affiliate',
    integrationDetails:
      'Partneranfrage über miete24.de/partner. Miete24 stellt Deeplinks und ggf. White-Label-Widgets bereit. ' +
      'Integration: iFrame-Einbettung des Miete24-Produktkatalogs oder Deeplinks mit Partner-ID. ' +
      'Besonders relevant für Fahrzeug-Abos (Auto, Transporter) und IT-Ausstattung (Laptops, Monitore). ' +
      'Tracking über URL-Parameter. Auszahlung nach Vertragsaktivierung.',
  },
  {
    id: 'fressnapf',
    name: 'Fressnapf',
    type: 'affiliate',
    module: 'MOD-21 Pets',
    purpose: 'Tierbedarf-Shop (Futter, Zubehör, Gesundheit)',
    commissionModel: 'AWIN-Affiliate: 3–5 % auf Bestellwert',
    network: 'AWIN',
    icon: PawPrint,
    group: 'affiliate',
    integrationDetails:
      'AWIN-Programm von Fressnapf (Advertiser ID im AWIN-Dashboard suchen). ' +
      'Anmeldung über awin.com → Programmsuche → "Fressnapf" → Partnerschaft beantragen. ' +
      'Integration: AWIN-Deeplinks mit Clickref-Parameter für Sub-Tracking. Produkt-Feed (CSV/XML) verfügbar für Produktkatalog-Synchronisation. ' +
      'Cookie-Laufzeit: 30 Tage. Auszahlung monatlich über AWIN ab 25 €.',
  },
  {
    id: 'enpal',
    name: 'Enpal',
    type: 'affiliate',
    module: 'MOD-19 PV / MOD-16 Services',
    purpose: 'Photovoltaik-Anlagen (Miete & Kauf), Stromspeicher, Wallbox',
    commissionModel: 'Lead-Provision: ca. 50 € / qualifizierter Lead · Abschluss: bis 300 €',
    network: 'ADCELL',
    icon: Sun,
    group: 'affiliate',
    integrationDetails:
      'Enpal Affiliate-Programm über ADCELL (adcell.de → Programmsuche → "Enpal"). ' +
      'Alternative: Direkter Vermittlervertrag mit Enpal für höhere Provisionen (Kontakt über enpal.de/partner). ' +
      'ADCELL-Integration: Tracking-Links mit SubID, Postback-URL für Conversion-Tracking. ' +
      'Lead-Formular kann als iFrame eingebettet oder per Deeplink verlinkt werden. ' +
      'Cookie-Laufzeit: 90 Tage. Qualifizierter Lead = ausgefülltes Formular mit gültigem Dach.',
  },
  {
    id: 'rabot-energy',
    name: 'Rabot Energy',
    type: 'affiliate',
    module: 'MOD-16 Services (Strom)',
    purpose: 'Dynamischer Ökostrom zum Börsenstrompreis',
    commissionModel: 'AWIN-Affiliate: ca. 30–50 € pro Vertragsabschluss',
    network: 'AWIN',
    icon: Zap,
    group: 'affiliate',
    integrationDetails:
      'AWIN-Programm: Advertiser-ID 70752. Anmeldung über AWIN-Dashboard → "Rabot Energy" → Partnerschaft beantragen. ' +
      'Integration: AWIN-Deeplinks mit Subtracking-Parametern. Landingpage-URLs mit UTM-Parametern. ' +
      'Rabot Charge bietet zusätzlich eine Wallbox-Lösung (Kombination mit Enpal-PV möglich). ' +
      'Cookie-Laufzeit: 30 Tage. Auszahlung über AWIN (monatlich, Netto 30).',
  },
  {
    id: 'fairgarage',
    name: 'FairGarage',
    type: 'affiliate',
    module: 'MOD-06 Fahrzeuge (Service)',
    purpose: 'Werkstatt-Preisvergleich & Online-Buchung',
    commissionModel: 'Affiliate verhandelbar (Lead/Booking-basiert)',
    network: 'Direkt',
    icon: Wrench,
    group: 'affiliate',
    integrationDetails:
      'BEREITS FUNKTIONAL IMPLEMENTIERT in CarServiceFlow.tsx (6-Step-Flow). ' +
      'Deeplink-Integration zu fairgarage.com mit UTM-Tracking aktiv. Service-Requests werden in car_service_requests persistiert. ' +
      'Für Affiliate-Provisionen: Kontakt über fairgarage.com/partner oder direkte Anfrage für API-Zugang (REST-API verfügbar). ' +
      'FairGarage bietet White-Label-Widgets für Werkstattsuche & Preisvergleich. Provisionsmodell: pro vermittelter Buchung verhandelbar.',
  },

  // ── Fortbildung & Wissen ──
  {
    id: 'udemy',
    name: 'Udemy',
    type: 'affiliate',
    module: 'MOD-15 Fortbildung (Online-Kurse)',
    purpose: 'Online-Kurse: Immobilien, BWL, Recht, Steuern',
    commissionModel: '12 % Provision pro Kursverkauf · 7 Tage Cookie',
    network: 'Rakuten / Direkt',
    icon: GraduationCap,
    group: 'fortbildung',
    integrationDetails:
      'Udemy Affiliate-Programm über Rakuten Advertising (früher LinkShare) oder direkt über udemy.com/affiliate. ' +
      'Registrierung: Rakuten-Account → Programm "Udemy" suchen → bewerben. Genehmigung i.d.R. innerhalb 48h. ' +
      'Integration: Deeplinks zu einzelnen Kursen mit Affiliate-Tag. Udemy Affiliate API für Kurssuche & Metadaten (Preis, Rating, Kategorie). ' +
      'Wichtig: 7-Tage-Cookie ist kurz – Conversion muss zeitnah erfolgen. Gutschein-Codes für höhere Conversion verfügbar.',
  },
  {
    id: 'eventbrite',
    name: 'Eventbrite',
    type: 'affiliate',
    module: 'MOD-15 Fortbildung (Events)',
    purpose: 'Branchen-Events, Konferenzen, Immobilien-Messen',
    commissionModel: '$8 pro Ticketverkauf oder 3,5 % (via FlexOffers)',
    network: 'FlexOffers',
    icon: Ticket,
    group: 'fortbildung',
    integrationDetails:
      'Eventbrite Affiliate über FlexOffers.com (flexoffers.com → Programmsuche → "Eventbrite"). ' +
      'Alternative: Impact.com-Netzwerk (ebenfalls Eventbrite-Programm). ' +
      'Integration: Deeplinks zu Event-Kategorien (z.B. "Real Estate" Events in DE). ' +
      'Eventbrite API (api.eventbrite.com) erlaubt Event-Suche nach Kategorie, Ort und Datum – ideal für kuratierten Katalog. ' +
      'Cookie-Laufzeit: 30 Tage. Conversion = Ticketkauf.',
  },
  {
    id: 'haufe',
    name: 'Haufe Akademie',
    type: 'affiliate',
    module: 'MOD-15 Fortbildung (Zertifikate)',
    purpose: 'Zertifizierte Weiterbildungen (IHK, Immobilien, Führung)',
    commissionModel: 'Direkt-Affiliate (zu verhandeln), ca. 5–10 % auf Seminargebühr',
    network: 'Direkt / AWIN',
    icon: Award,
    group: 'fortbildung',
    integrationDetails:
      'Haufe Akademie (haufe-akademie.de) ist Marktführer für berufliche Weiterbildung in DACH. ' +
      'Affiliate-Programm über AWIN prüfen (Advertiser-Suche) oder Direktkontakt über haufe-akademie.de/partner. ' +
      'Besonders relevant: Immobilien-Fachwirt (IHK), WEG-Verwaltung, Mietrecht-Seminare. ' +
      'Integration: Deeplinks zu Seminarkategorien. Haufe bietet keinen öffentlichen API-Zugang – Katalogpflege manuell oder per Scraping. ' +
      'Alternative Anbieter: Sprengnetter Akademie (Bewertung), DIA München (Immobilien-Zertifikate).',
  },

  // ── Zuhause & Sanierung (MOD-20 / MOD-04) ──
  {
    id: 'myhammer',
    name: 'MyHammer (Instapro Group)',
    type: 'affiliate',
    module: 'MOD-20 Zuhause (Handwerker)',
    purpose: 'Handwerker-Vermittlung (40.000+ Fachleute, 80.000 Aufträge/Monat)',
    commissionModel: 'Provision pro zustande gekommenem Auftrag (via Netslave)',
    network: 'Netslave / Instapro',
    icon: Wrench,
    group: 'affiliate',
    integrationDetails:
      'Affiliate-Programm über Netslave-Plattform (partner.instapro.com). ' +
      'MyHammer ist Teil der Instapro-Gruppe (Europas führender Handwerker-Marktplatz). ' +
      'Anmeldung: partner.instapro.com/anmelden.cgi?new=1&cpid=4. ' +
      'Integration: Deeplinks mit Partner-ID und UTM-Tracking. ' +
      'Zulässig: Displays, Textlinks, E-Mails. Nicht zulässig: Cashbacks, Gutscheine. ' +
      'Keine API für externe Suche. PLZ-basierte Deeplinks möglich.',
  },
  {
    id: 'betreut-de',
    name: 'Betreut.de (Care.com)',
    type: 'affiliate',
    module: 'MOD-20 Zuhause (Haushaltshilfe)',
    purpose: 'Haushaltshilfen, Putzfrauen, Seniorenbetreuung, Kinderbetreuung',
    commissionModel: 'CPA: 5–10 % pro Premium-Abo-Abschluss',
    network: 'AWIN / Direkt',
    icon: Heart,
    group: 'affiliate',
    integrationDetails:
      'Betreut.de (Teil von Care.com) ist Deutschlands größte Plattform für Alltagshelfer. ' +
      'Affiliate-Programm über AWIN prüfen oder Direktkontakt (affiliate@care.com). ' +
      'Integration: Deeplink zu betreut.de/haushaltshilfe mit Affiliate-Tag. ' +
      'Keine API für externe Suche. Cookie-Laufzeit: ca. 30 Tage. ' +
      'Conversion = Premium-Mitgliedschaft.',
  },
  {
    id: 'aroundhome',
    name: 'Aroundhome',
    type: 'affiliate',
    module: 'MOD-04 Sanierung',
    purpose: 'Sanierungsprojekte: Fenster, Heizung, Dämmung, Bad, Küche, Solar',
    commissionModel: 'Lead-Provision (Umsatzbeteiligung pro qualifiziertem Lead)',
    network: 'AWIN (Advertiser ID 68536)',
    icon: Handshake,
    group: 'affiliate',
    integrationDetails:
      'Aroundhome (aroundhome.de) ist Deutschlands größter Vermittler für Sanierungsprojekte. ' +
      'AWIN-Programm: Advertiser ID 68536. Anmeldung: aroundhome.de/affiliateprogramm. ' +
      'Integration: AWIN-Deeplinks zu Kategorie-Seiten (fenster, heizung, daemmung, bad, kueche, solar). ' +
      'SubID-Tracking für Conversion-Zuordnung. Cookie-Laufzeit: 30 Tage. ' +
      'Bis zu 3 kostenlose Angebote von geprüften Fachfirmen pro Lead.',
  },

  // ── Geschäftskonten ──
  {
    id: 'amazon-business',
    name: 'Amazon Business',
    type: 'geschaeftskonto',
    module: 'MOD-16 Services (Shop)',
    purpose: 'Bürobedarf-Bestellungen mit Netto-Preisen & Sammelrechnungen',
    commissionModel: 'Kein Affiliate – internes Geschäftskonto',
    icon: Building2,
    group: 'geschaeftskonto',
    integrationDetails:
      'Amazon Business Account über business.amazon.de registrieren. ' +
      'Vorteile: Netto-Preise, Sammelrechnungen, Genehmigungsworkflows, Punchout-Katalog. ' +
      'Für Plattform-Integration: Amazon Business API (Procurement) oder einfache Deeplinks mit Business-Pricing. ' +
      'Amazon PartnerNet-Links funktionieren auch mit Business-Accounts (Affiliate-Provision wird trotzdem gezahlt). ' +
      'Registrierung: Gewerbenachweis + Unternehmens-E-Mail erforderlich.',
  },
];

const TYPE_LABELS: Record<string, string> = {
  vermittler: 'Vermittlervertrag',
  affiliate: 'Affiliate',
  geschaeftskonto: 'Geschäftskonto',
};

const TYPE_COLORS: Record<string, string> = {
  vermittler: 'bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-600/20',
  affiliate: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-emerald-600/20',
  geschaeftskonto: 'bg-amber-600/10 text-amber-700 dark:text-amber-400 border-amber-600/20',
};

const GROUP_CONFIG = [
  {
    key: 'vermittler' as const,
    title: 'Vermittlerverträge (reguliert)',
    description: 'Erlaubnispflichtige Vermittlungsverträge nach GewO / WpIG',
    icon: Shield,
  },
  {
    key: 'affiliate' as const,
    title: 'Affiliate- & Partnerprogramme',
    description: 'Provisionsbasierte Partnerschaften über Netzwerke oder Direktverträge',
    icon: Handshake,
  },
  {
    key: 'fortbildung' as const,
    title: 'Fortbildung & Wissen (MOD-15)',
    description: 'Affiliate-Programme für kuratierte Bildungsinhalte',
    icon: BookOpen,
  },
  {
    key: 'geschaeftskonto' as const,
    title: 'Geschäftskonten',
    description: 'Operative Konten für Beschaffung und Einkauf',
    icon: Building2,
  },
];

export default function PartnerContractsRegistry() {
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>(
    () => Object.fromEntries(PARTNER_CONTRACTS.map((p) => [p.id, p.initialActive ?? false]))
  );
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  const toggleActive = (id: string) => {
    setActiveStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDetails = (id: string) => {
    setExpandedDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalContracts = PARTNER_CONTRACTS.length;
  const activeCount = Object.values(activeStates).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Handshake className="h-5 w-5" />
            Vermittler- & Partnerverträge
          </h2>
          <p className="text-sm text-muted-foreground">
            Externes Vertragsregister — Vermittler, Affiliates & Geschäftskonten
          </p>
        </div>
        <Badge
          variant="outline"
          className={`text-sm py-1.5 px-3 ${
            activeCount === 0
              ? 'border-muted-foreground'
              : activeCount === totalContracts
                ? 'border-green-600 text-green-700 dark:text-green-400'
                : 'border-amber-600 text-amber-700 dark:text-amber-400'
          }`}
        >
          {activeCount} von {totalContracts} aktiv
        </Badge>
      </div>

      {/* Groups */}
      {GROUP_CONFIG.map((group) => {
        const items = PARTNER_CONTRACTS.filter((p) => p.group === group.key);
        if (items.length === 0) return null;
        const GroupIcon = group.icon;

        return (
          <Card key={group.key}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <GroupIcon className="h-5 w-5" />
                <CardTitle className="text-lg">{group.title}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {items.map((partner) => {
                  const Icon = partner.icon;
                  const isActive = activeStates[partner.id];
                  const isExpanded = expandedDetails[partner.id];

                  return (
                    <div key={partner.id} className="px-6 py-4">
                      {/* Main row */}
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            isActive ? 'bg-green-600/10' : 'bg-muted/50'
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${isActive ? 'text-green-600' : 'text-muted-foreground'}`}
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{partner.name}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${TYPE_COLORS[partner.type]}`}
                            >
                              {TYPE_LABELS[partner.type]}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {partner.module}
                            </Badge>
                            {partner.network && (
                              <Badge variant="secondary" className="text-[10px]">
                                {partner.network}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{partner.purpose}</p>
                          <p className="text-xs text-muted-foreground/80 font-mono">
                            💰 {partner.commissionModel}
                          </p>

                          {/* Expand button */}
                          <button
                            onClick={() => toggleDetails(partner.id)}
                            className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                          >
                            <Info className="h-3 w-3" />
                            Anbindungsdetails
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>

                          {/* Details panel */}
                          {isExpanded && (
                            <div className="mt-2 p-3 rounded-lg bg-muted/30 border text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                              {partner.integrationDetails}
                            </div>
                          )}
                        </div>

                        {/* Toggle */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <Switch
                            checked={isActive}
                            onCheckedChange={() => toggleActive(partner.id)}
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {isActive ? 'Aktiv' : 'Offen'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
