/**
 * SoT Solution Page — Finanzdienstleistungen
 * PRIMARY landing page for the "Finanzierung/Finanzdienstleistungen" vertical.
 */
import { SEOHead, type FAQItem } from '@/components/zone3/shared/SEOHead';
import { Link } from 'react-router-dom';
import { Landmark, TrendingUp, Calculator, FileCheck, ShieldCheck, Briefcase, ChevronRight, ArrowRight } from 'lucide-react';

const FAQ_ITEMS: FAQItem[] = [
  { question: 'Welche Finanzdienstleistungen bietet System of a Town?', answer: 'Immobilienfinanzierung (über FutureRoom), Investmentanalyse, Cashflow-Planung, BWA-Erstellung, Steuervorausberechnung und Portfoliobewertung — alles digital und KI-gestützt.' },
  { question: 'Wie funktioniert die Immobilienfinanzierung?', answer: 'Über unsere Plattform FutureRoom orchestrieren wir Ihre Finanzierung: Bonitätsprüfung, Unterlagenaufbereitung und Bankvergleich mit über 400 Partnern — digital und persönlich begleitet.' },
  { question: 'Kann ich die Wirtschaftlichkeit einer Immobilie vorab berechnen?', answer: 'Ja. Unsere Investmentrechner kalkulieren Rendite, Cashflow, Steuereffekte und Tilgungsverläufe — vor dem Kauf, in Echtzeit.' },
  { question: 'Ist die Finanzanalyse auch für Bestandsportfolios geeignet?', answer: 'Ja. Sie können Ihr gesamtes Portfolio analysieren: Mieteinnahmen vs. Ausgaben, Darlehensübersicht, Wertentwicklung und Optimierungspotenziale.' },
  { question: 'Wer begleitet mich bei der Finanzierung?', answer: 'Zertifizierte Finanzierungsmanager, die Ihre Unterlagen prüfen, optimieren und die beste Bankenlösung für Sie finden. Persönliche Betreuung plus digitale Effizienz.' },
  { question: 'Was kostet die Nutzung der Finanztools?', answer: 'Die Basistools (Rechner, Portfolio-Übersicht) sind im System of a Town Abo enthalten. Für die aktive Finanzierungsbegleitung über FutureRoom gelten separate Konditionen.' },
];

const FEATURES = [
  { icon: Landmark, title: 'Immobilienfinanzierung', desc: 'Über 400 Bankpartner, digitale Bonitätsprüfung und persönliche Begleitung durch FutureRoom.' },
  { icon: Calculator, title: 'Investment-Rechner', desc: 'Rendite, Cashflow, Steuereffekte und Tilgungsverläufe — live berechnet, sofort vergleichbar.' },
  { icon: TrendingUp, title: 'Portfolio-Analyse', desc: 'Bewertung, Performance-Tracking und Optimierung Ihres gesamten Immobilienportfolios.' },
  { icon: FileCheck, title: 'BWA & Reporting', desc: 'Betriebswirtschaftliche Auswertung und Finanzreporting — steuerberater-ready, exportierbar.' },
  { icon: ShieldCheck, title: 'Steuer-Vorausberechnung', desc: 'Abschreibungen, Sonderabschreibungen und Steuereffekte vorab kalkulieren.' },
  { icon: Briefcase, title: 'Finanzierungsmanager', desc: 'Persönliche Betreuung durch zertifizierte Experten — von der Anfrage bis zur Auszahlung.' },
];

export default function SotFinanzdienstleistungen() {
  return (
    <div className="min-h-screen">
      <SEOHead
        brand="sot"
        page={{
          title: 'Finanzdienstleistungen für Immobilieninvestoren',
          description: 'Immobilienfinanzierung, Investmentanalyse und Portfolio-Reporting — digital, KI-gestützt und persönlich begleitet.',
          path: '/loesungen/finanzdienstleistungen',
        }}
        faq={FAQ_ITEMS}
        services={[{
          name: 'Finanzdienstleistungen für Immobilieninvestoren',
          description: 'Finanzierung, Investmentanalyse, Cashflow-Planung und Steuervorausberechnung für Immobilieninvestoren.',
          url: 'https://systemofatown.com/loesungen/finanzdienstleistungen',
        }]}
      />

      {/* Hero */}
      <section className="relative py-20 md:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary mb-6">
            Lösung
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
            Finanzdienstleistungen<br />für Immobilieninvestoren
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Finanzierung, Investmentanalyse und Portfolio-Reporting — digital, KI-gestützt 
            und persönlich begleitet. Von der Kalkulation bis zur Auszahlung.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/website/futureroom/bonitat" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              Finanzierung starten <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/website/sot/preise" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border border-border font-medium hover:bg-muted/50 transition-colors">
              Preise ansehen <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Ihre Finanzwerkzeuge</h2>
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

      {/* Cross-link to FutureRoom */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Finanzierung über FutureRoom</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Für die aktive Immobilienfinanzierung arbeiten wir mit <strong>FutureRoom</strong> zusammen — 
            unserer spezialisierten Plattform für digitale Finanzierungsorchestrierung mit über 400 Bankpartnern.
          </p>
          <Link to="/website/futureroom" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border border-border font-medium hover:bg-muted/50 transition-colors">
            FutureRoom entdecken <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-muted/30">
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
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Bereit für smarte Finanztools?</h2>
          <p className="text-muted-foreground mb-8">Starten Sie kostenlos — Investmentrechner, Cashflow-Planung und mehr.</p>
          <Link to="/auth?mode=register&source=sot" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
            Kostenlos starten <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
