/**
 * SoT Solution Page — Immobilienverwaltung
 * PRIMARY landing page for the "Immobilienverwaltung" vertical.
 */
import { SEOHead, type FAQItem } from '@/components/zone3/shared/SEOHead';
import { Link } from 'react-router-dom';
import { Building, FileSearch, PieChart, Wrench, Globe, Lock, ChevronRight, ArrowRight } from 'lucide-react';

const FAQ_ITEMS: FAQItem[] = [
  { question: 'Was umfasst digitale Immobilienverwaltung?', answer: 'Digitale Immobilienverwaltung deckt alle Bereiche ab: Objektverwaltung, Mietermanagement, Dokumentenablage, Finanzübersicht, Instandhaltungsplanung und Reporting — alles zentral in einer Plattform.' },
  { question: 'Für wie viele Einheiten eignet sich System of a Town?', answer: 'Von 1 bis 500+ Einheiten. Die Plattform skaliert mit Ihrem Portfolio — vom Einzeleigentümer bis zum professionellen Verwalter.' },
  { question: 'Kann ich bestehende Daten importieren?', answer: 'Ja. System of a Town unterstützt CSV-Import, Dokumenten-Upload mit KI-Texterkennung und manuelle Erfassung. Ihre bestehenden Daten sind in Minuten verfügbar.' },
  { question: 'Wie funktioniert die KI-Dokumentenverarbeitung?', answer: 'Armstrong, unsere KI, erkennt Dokumententypen automatisch, extrahiert relevante Daten (Mietverträge, Rechnungen, Protokolle) und ordnet sie dem richtigen Objekt und Mieter zu.' },
  { question: 'Ist die Plattform DSGVO-konform?', answer: 'Ja. Alle Daten werden in deutschen Rechenzentren gespeichert. Zugriffsrechte, Audit-Logs und Datenlöschung sind integriert.' },
  { question: 'Was kostet die digitale Immobilienverwaltung?', answer: 'Die Preise richten sich nach Anzahl der Einheiten und gewünschten Modulen. Starten Sie kostenlos mit bis zu 3 Einheiten.' },
];

const FEATURES = [
  { icon: Building, title: 'Portfolio-Übersicht', desc: 'Alle Objekte, Einheiten und Mieter auf einen Blick — mit Kennzahlen, Auslastung und Rendite.' },
  { icon: FileSearch, title: 'KI-Dokumentenverarbeitung', desc: 'Dokumente hochladen, KI erkennt Typ und extrahiert Daten automatisch. Mietverträge, Rechnungen, Protokolle.' },
  { icon: PieChart, title: 'Finanz-Dashboard', desc: 'Mieteinnahmen, Ausgaben, Cashflow und BWA — live berechnet, exportierbar, steuerberater-ready.' },
  { icon: Wrench, title: 'Instandhaltung', desc: 'Wartungszyklen planen, Schadensmeldungen verwalten, Handwerker koordinieren — mit digitalem Auftragswesen.' },
  { icon: Globe, title: 'Mieter-Portal', desc: 'Mieter melden Anliegen, laden Dokumente herunter und kommunizieren direkt — ohne Telefon oder E-Mail-Chaos.' },
  { icon: Lock, title: 'Zugriffsrechte & Rollen', desc: 'Mandantenfähig: Eigentümer, Verwalter, Buchhalter und Mieter mit individuellen Berechtigungen.' },
];

export default function SotImmobilienverwaltung() {
  return (
    <div className="min-h-screen">
      <SEOHead
        brand="sot"
        page={{
          title: 'Digitale Immobilienverwaltung',
          description: 'KI-gestützte Immobilienverwaltung: Objekte, Mieter, Finanzen und Dokumente — alles in einer Plattform. Für Eigentümer und Verwalter.',
          path: '/loesungen/immobilienverwaltung',
        }}
        faq={FAQ_ITEMS}
        services={[{
          name: 'Digitale Immobilienverwaltung',
          description: 'KI-gestützte Verwaltung für Miet- und Gewerbeimmobilien: Portfolio, Mieter, Finanzen, Dokumente — in einer Plattform.',
          url: 'https://systemofatown.com/loesungen/immobilienverwaltung',
        }]}
      />

      {/* Hero */}
      <section className="relative py-20 md:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary mb-6">
            Lösung
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
            Digitale<br />Immobilienverwaltung
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Objekte, Mieter, Finanzen und Dokumente — KI-gestützt verwalten. 
            Von der Einzelwohnung bis zum professionellen Portfolio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/website/sot/demo" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              Demo anfordern <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/website/sot/module" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border border-border font-medium hover:bg-muted/50 transition-colors">
              Module entdecken <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Alles für Ihre Immobilienverwaltung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-border/50 bg-background hover:border-primary/20 hover:shadow-md transition-all">
                <f.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Häufige Fragen</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, i) => (
              <details key={i} className="group p-5 rounded-xl border border-border/50 bg-background">
                <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                  {item.question}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Immobilienverwaltung neu gedacht</h2>
          <p className="text-muted-foreground mb-8">Starten Sie kostenlos — ohne Kreditkarte, ohne Vertragsbindung.</p>
          <Link to="/auth?mode=register&source=sot" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
            Kostenlos starten <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
