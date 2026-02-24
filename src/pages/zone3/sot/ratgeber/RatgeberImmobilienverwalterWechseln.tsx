/**
 * Ratgeber: Hausverwaltung wechseln
 * Supporting article for the Immobilienverwaltung vertical.
 */
import { SEOHead, type FAQItem } from '@/components/zone3/shared/SEOHead';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight } from 'lucide-react';

const FAQ_ITEMS: FAQItem[] = [
  { question: 'Wie lange dauert ein Verwalterwechsel?', answer: 'Typisch 3–6 Monate: Beschluss fassen, neuen Verwalter bestellen, Übergabe der Unterlagen und Konten.' },
  { question: 'Kann ich meinen Verwalter einfach kündigen?', answer: 'Bei WEG: Die Abberufung erfolgt per Eigentümerbeschluss. Der Verwaltervertrag muss zusätzlich gekündigt werden. Bei MSV: Die Kündigungsfrist richtet sich nach dem Vertrag.' },
  { question: 'Was muss bei der Übergabe übergeben werden?', answer: 'Alle Unterlagen: Mietverträge, Abrechnungen, Kontoauszüge, Versicherungsunterlagen, Beschlusssammlungen, laufende Vorgänge und Schlüssel.' },
];

export default function RatgeberImmobilienverwalterWechseln() {
  return (
    <div className="min-h-screen">
      <SEOHead
        brand="sot"
        page={{
          title: 'Hausverwaltung wechseln — So geht\'s',
          description: 'Hausverwaltung wechseln: Ablauf, Fristen, Checkliste und digitale Alternative für die Immobilienverwaltung.',
          path: '/ratgeber/hausverwaltung-wechseln',
        }}
        faq={FAQ_ITEMS}
        article={{
          headline: 'Hausverwaltung wechseln — Schritt für Schritt',
          description: 'Ablauf, Fristen, Checkliste und Tipps für einen reibungslosen Verwalterwechsel.',
          datePublished: '2026-02-24',
        }}
      />

      <article className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary mb-6">Ratgeber</span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Hausverwaltung wechseln — Schritt für Schritt</h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Unzufrieden mit Ihrer Hausverwaltung? Der Wechsel ist einfacher als gedacht — wenn Sie den Ablauf kennen.
          </p>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <h2 className="text-xl font-bold text-foreground">1. Gründe für den Wechsel identifizieren</h2>
            <p>Häufige Gründe: mangelnde Erreichbarkeit, verspätete Abrechnungen, fehlende Transparenz, überhöhte Kosten oder schlechte Instandhaltungskoordination.</p>

            <h2 className="text-xl font-bold text-foreground">2. Neuen Verwalter finden</h2>
            <p>Referenzen prüfen, Leistungskatalog vergleichen, digitale Fähigkeiten bewerten. Oder: die Verwaltung selbst digital übernehmen.</p>

            <h2 className="text-xl font-bold text-foreground">3. Beschluss und Kündigung</h2>
            <p>Bei WEG: Eigentümerbeschluss über Abberufung und Neubestellung. Einfache Mehrheit genügt. Vertragskündigung separat.</p>

            <h2 className="text-xl font-bold text-foreground">4. Übergabe organisieren</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Alle Unterlagen (Verträge, Abrechnungen, Protokolle)</li>
              <li>Bankkonten und Vollmachten</li>
              <li>Laufende Vorgänge und offene Posten</li>
              <li>Schlüssel und Zugangsdaten</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">5. Digital starten</h2>
            <p>Mit System of a Town importieren Sie alle Daten, digitalisieren Dokumente per KI und starten sofort mit der professionellen Verwaltung — ohne Wartezeiten.</p>
          </div>

          <div className="mt-12 space-y-4">
            <h2 className="text-xl font-bold mb-4">Häufige Fragen</h2>
            {FAQ_ITEMS.map((item, i) => (
              <details key={i} className="group p-5 rounded-xl border border-border/50">
                <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                  {item.question}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>

          <div className="mt-12 p-8 rounded-2xl bg-muted/30 text-center">
            <p className="text-lg font-semibold mb-2">Immobilienverwaltung selbst in die Hand nehmen</p>
            <p className="text-sm text-muted-foreground mb-6">Alle Tools für die professionelle Verwaltung — ohne externe Hausverwaltung.</p>
            <Link to="/website/sot/loesungen/immobilienverwaltung" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Zur digitalen Verwaltung <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
