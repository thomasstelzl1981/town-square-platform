/**
 * Ratgeber: Renditeberechnung bei Immobilien
 * Supporting article for the Finanzdienstleistungen vertical.
 */
import { SEOHead, type FAQItem } from '@/components/zone3/shared/SEOHead';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight } from 'lucide-react';

const FAQ_ITEMS: FAQItem[] = [
  { question: 'Was ist eine gute Mietrendite?', answer: 'Für Kapitalanlage-Immobilien gilt eine Brutto-Mietrendite ab 4 % als solide. Netto-Renditen von 3 % und mehr sind in guten Lagen attraktiv. A-Lagen haben niedrigere Renditen, aber höhere Wertsteigerung.' },
  { question: 'Wie berechne ich den Cashflow?', answer: 'Cashflow = Mieteinnahmen – Darlehensrate – nicht umlagefähige Nebenkosten – Instandhaltungsrücklage – Verwaltungskosten. Ein positiver Cashflow bedeutet monatlichen Überschuss.' },
  { question: 'Was ist der Unterschied zwischen Brutto- und Netto-Rendite?', answer: 'Die Brutto-Rendite berücksichtigt nur Kaufpreis und Kaltmiete. Die Netto-Rendite zieht zusätzlich Kaufnebenkosten und laufende Bewirtschaftungskosten ab — und ist daher aussagekräftiger.' },
];

export default function RatgeberRenditeberechnung() {
  return (
    <div className="min-h-screen">
      <SEOHead
        brand="sot"
        page={{
          title: 'Renditeberechnung bei Immobilien',
          description: 'Renditeberechnung für Kapitalanlage-Immobilien: Brutto-Rendite, Netto-Rendite, Cashflow und Eigenkapitalrendite erklärt.',
          path: '/ratgeber/renditeberechnung-immobilien',
        }}
        faq={FAQ_ITEMS}
        article={{
          headline: 'Renditeberechnung bei Immobilien — So kalkulieren Sie richtig',
          description: 'Brutto-Rendite, Netto-Rendite, Cashflow und Eigenkapitalrendite bei Kapitalanlage-Immobilien.',
          datePublished: '2026-02-24',
        }}
      />

      <article className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary mb-6">Ratgeber</span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Renditeberechnung bei Immobilien — So kalkulieren Sie richtig</h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Rendite ist nicht gleich Rendite. Wir zeigen, welche Kennzahlen zählen und wie Sie die Wirtschaftlichkeit Ihrer Immobilie präzise berechnen.
          </p>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <h2 className="text-xl font-bold text-foreground">Brutto-Mietrendite</h2>
            <p className="bg-muted/30 p-4 rounded-lg font-mono text-sm">Brutto-Rendite = (Jahresnettokaltmiete / Kaufpreis) × 100</p>
            <p>Die einfachste Kennzahl — aber auch die ungenaueste, weil Nebenkosten nicht berücksichtigt werden.</p>

            <h2 className="text-xl font-bold text-foreground">Netto-Mietrendite</h2>
            <p className="bg-muted/30 p-4 rounded-lg font-mono text-sm">Netto-Rendite = (Mieteinnahmen – Bewirtschaftungskosten) / (Kaufpreis + Kaufnebenkosten) × 100</p>
            <p>Die aussagekräftigere Kennzahl. Berücksichtigt Verwaltungskosten, Instandhaltung, nicht umlagefähige Nebenkosten und Kaufnebenkosten (Grunderwerbsteuer, Notar, Makler).</p>

            <h2 className="text-xl font-bold text-foreground">Cashflow-Rendite</h2>
            <p>Zeigt den tatsächlichen monatlichen Überschuss nach allen Kosten und Darlehensraten. Positiver Cashflow = die Immobilie trägt sich selbst.</p>

            <h2 className="text-xl font-bold text-foreground">Eigenkapitalrendite</h2>
            <p className="bg-muted/30 p-4 rounded-lg font-mono text-sm">EK-Rendite = Jahres-Cashflow / eingesetztes Eigenkapital × 100</p>
            <p>Die wichtigste Kennzahl für Investoren: Wie viel Rendite erwirtschaftet Ihr eingesetztes Kapital?</p>
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
            <p className="text-lg font-semibold mb-2">Rendite live berechnen</p>
            <p className="text-sm text-muted-foreground mb-6">Unsere Investment-Rechner kalkulieren alle Kennzahlen in Echtzeit.</p>
            <Link to="/website/sot/loesungen/finanzdienstleistungen" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Zu den Finanztools <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
