/**
 * Ratgeber: Portfolio-Analyse für Immobilieninvestoren
 * Supporting article for the Immobilienverwaltung vertical.
 */
import { SEOHead, type FAQItem } from '@/components/zone3/shared/SEOHead';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight } from 'lucide-react';

const FAQ_ITEMS: FAQItem[] = [
  { question: 'Was gehört zu einer Immobilien-Portfolioanalyse?', answer: 'Standortbewertung, Mietrendite, Cashflow-Analyse, Wertsteigerungspotenzial, Darlehensstruktur und Risikoeinschätzung — für jedes Objekt und das Gesamtportfolio.' },
  { question: 'Wie oft sollte man sein Portfolio analysieren?', answer: 'Mindestens einmal jährlich, idealerweise quartalsweise. Bei Marktveränderungen, Zinsanpassungen oder geplanten Käufen/Verkäufen auch ad hoc.' },
  { question: 'Kann System of a Town mein gesamtes Portfolio abbilden?', answer: 'Ja. Sie können beliebig viele Objekte mit Einheiten, Mietern, Darlehen und Dokumenten erfassen und die Performance in Echtzeit überwachen.' },
];

export default function RatgeberPortfolioAnalyse() {
  return (
    <div className="min-h-screen">
      <SEOHead
        brand="sot"
        page={{
          title: 'Immobilien-Portfolioanalyse — Ratgeber',
          description: 'Portfolioanalyse für Immobilieninvestoren: Rendite, Cashflow, Risiko und Optimierung systematisch auswerten.',
          path: '/ratgeber/immobilien-portfolioanalyse',
        }}
        faq={FAQ_ITEMS}
        article={{
          headline: 'Immobilien-Portfolioanalyse — So bewerten Sie Ihr Portfolio',
          description: 'Kennzahlen, Methoden und Tools für die systematische Analyse Ihres Immobilienportfolios.',
          datePublished: '2026-02-24',
        }}
      />

      <article className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary mb-6">Ratgeber</span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Immobilien-Portfolioanalyse — So bewerten Sie Ihr Portfolio</h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Ob 3 oder 30 Einheiten — eine regelmäßige Portfolioanalyse zeigt Ihnen, wo Rendite steckt und wo Handlungsbedarf besteht.
          </p>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <h2 className="text-xl font-bold text-foreground">Wichtige Kennzahlen</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Brutto-Mietrendite:</strong> Jahresnettokaltmiete / Kaufpreis × 100</li>
              <li><strong>Netto-Mietrendite:</strong> (Mieteinnahmen – Bewirtschaftungskosten) / Gesamtkosten × 100</li>
              <li><strong>Cashflow:</strong> Mieteinnahmen – Darlehensrate – Bewirtschaftungskosten</li>
              <li><strong>Eigenkapitalrendite:</strong> Cashflow / eingesetztes Eigenkapital × 100</li>
              <li><strong>Leerstandsquote:</strong> Leerstehende Einheiten / Gesamteinheiten × 100</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">Analyse-Dimensionen</h2>
            <p>Eine vollständige Portfolioanalyse betrachtet:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Standort:</strong> Makro- und Mikrolage, Infrastruktur, Bevölkerungsentwicklung</li>
              <li><strong>Objekt:</strong> Zustand, Modernisierungsbedarf, energetische Sanierung</li>
              <li><strong>Finanzierung:</strong> Zinsbindung, Restschuld, Anschlussfinanzierung</li>
              <li><strong>Markt:</strong> Mietspiegel, Vergleichsmieten, Wertsteigerungstrend</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">Digitale Analyse mit System of a Town</h2>
            <p>Erfassen Sie alle Objekte, Einheiten und Finanzdaten in einer Plattform. Die KI berechnet Rendite, Cashflow und Steuereffekte automatisch — in Echtzeit, für jedes Objekt und das Gesamtportfolio.</p>
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
            <p className="text-lg font-semibold mb-2">Portfolio digital managen</p>
            <p className="text-sm text-muted-foreground mb-6">Alle Objekte, Kennzahlen und Dokumente an einem Ort.</p>
            <Link to="/website/sot/loesungen/immobilienverwaltung" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Zur Immobilienverwaltung <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
