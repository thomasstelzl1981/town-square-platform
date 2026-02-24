/**
 * Ratgeber: Immobilienfinanzierung — Was Kapitalanleger wissen müssen
 * Supporting article for the Finanzdienstleistungen vertical.
 */
import { SEOHead, type FAQItem } from '@/components/zone3/shared/SEOHead';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight } from 'lucide-react';

const FAQ_ITEMS: FAQItem[] = [
  { question: 'Wie viel Eigenkapital brauche ich für eine Kapitalanlage-Immobilie?', answer: 'Typisch 10–20 % des Kaufpreises plus Kaufnebenkosten (ca. 10–15 %). Einige Banken finanzieren auch bis 100 % des Kaufpreises bei guter Bonität und attraktivem Objekt.' },
  { question: 'Was ist der Unterschied zwischen Sollzins und Effektivzins?', answer: 'Der Sollzins ist der reine Kreditzins. Der Effektivzins enthält zusätzlich Nebenkosten wie Bearbeitungsgebühren und ist die aussagekräftigere Vergleichsgröße.' },
  { question: 'Wie lange sollte die Zinsbindung sein?', answer: 'Bei niedrigen Zinsen: möglichst lang (15–20 Jahre). Bei hohen Zinsen: kürzer (5–10 Jahre) mit Option auf günstigere Anschlussfinanzierung.' },
  { question: 'Kann ich steuerlich von der Finanzierung profitieren?', answer: 'Ja. Darlehenszinsen für vermietete Immobilien sind als Werbungskosten absetzbar. Zusätzlich: lineare AfA (2 % p.a.) und ggf. Sonderabschreibungen.' },
];

export default function RatgeberImmobilienfinanzierung() {
  return (
    <div className="min-h-screen">
      <SEOHead
        brand="sot"
        page={{
          title: 'Immobilienfinanzierung für Kapitalanleger',
          description: 'Immobilienfinanzierung für Kapitalanleger: Eigenkapital, Zinsbindung, Tilgung und Steuervorteile — verständlich erklärt.',
          path: '/ratgeber/immobilienfinanzierung-kapitalanleger',
        }}
        faq={FAQ_ITEMS}
        article={{
          headline: 'Immobilienfinanzierung für Kapitalanleger — Was Sie wissen müssen',
          description: 'Eigenkapital, Zinsbindung, Tilgung und Steuervorteile bei der Kapitalanlage-Finanzierung.',
          datePublished: '2026-02-24',
        }}
      />

      <article className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary mb-6">Ratgeber</span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Immobilienfinanzierung für Kapitalanleger</h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Die richtige Finanzierung entscheidet über Rendite und Risiko Ihrer Kapitalanlage. Hier die wichtigsten Grundlagen.
          </p>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <h2 className="text-xl font-bold text-foreground">Eigenkapitaleinsatz</h2>
            <p>Mehr Eigenkapital = bessere Konditionen und geringeres Risiko. Aber: Bei Kapitalanlagen kann ein höherer Fremdkapitalanteil die Eigenkapitalrendite steigern (Leverage-Effekt) — solange die Mietrendite über dem Darlehenszins liegt.</p>

            <h2 className="text-xl font-bold text-foreground">Zinsbindung und Tilgung</h2>
            <p>Die <strong>Zinsbindung</strong> sichert den Zinssatz für einen festen Zeitraum. Die <strong>Tilgung</strong> bestimmt, wie schnell Sie schuldenfrei werden. Für Kapitalanleger empfiehlt sich oft eine niedrige Tilgung (1–2 %), um den Cashflow zu optimieren.</p>

            <h2 className="text-xl font-bold text-foreground">Steuervorteile</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Darlehenszinsen als Werbungskosten absetzen</li>
              <li>Lineare Abschreibung (AfA): 2 % p.a. auf den Gebäudeanteil</li>
              <li>Sonderabschreibungen bei Neubauten (§ 7b EStG)</li>
              <li>Modernisierungskosten sofort oder über Abschreibung</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">Digitale Finanzierungsbegleitung</h2>
            <p>Mit System of a Town und FutureRoom kalkulieren Sie Ihre Finanzierung digital: Investmentrechner, Cashflow-Simulation und Bankvergleich — vor dem Kauf, in Echtzeit.</p>
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
            <p className="text-lg font-semibold mb-2">Finanzierung digital planen</p>
            <p className="text-sm text-muted-foreground mb-6">Investmentrechner, Cashflow-Simulation und Bankvergleich in einer Plattform.</p>
            <Link to="/website/sot/loesungen/finanzdienstleistungen" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Zu den Finanztools <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
