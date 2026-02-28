/**
 * Kaufy2026FAQ — FAQ-Seite mit FAQPage-Schema
 */
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/zone3/shared/SEOHead';

const faqItems = [
  { question: 'Was ist KAUFY?', answer: 'KAUFY ist eine KI-gestützte Plattform für Kapitalanlageimmobilien. Sie finden, bewerten und finanzieren Investmentimmobilien an einem Ort — unterstützt durch den KI-Assistenten Armstrong.' },
  { question: 'Für wen ist KAUFY geeignet?', answer: 'Für alle, die in Immobilien als Kapitalanlage investieren möchten: Erstinvestoren, erfahrene Anleger, Vermieter, die ihr Portfolio optimieren wollen, und Vertriebspartner, die Objekte vermitteln.' },
  { question: 'Was kostet die Nutzung?', answer: 'Die Immobiliensuche und Erstberatung sind kostenlos. Bei einem erfolgreichen Investment wird eine marktübliche Provision fällig — transparent und ohne versteckte Kosten.' },
  { question: 'Wie funktioniert die KI-gestützte Suche?', answer: 'Armstrong analysiert Exposés, Marktdaten und Ihre Kriterien, um passende Objekte vorzuschlagen. Renditeberechnung, Standortbewertung und Finanzierungsprüfung laufen automatisiert.' },
  { question: 'Kann ich als Vermieter mein Objekt listen?', answer: 'Ja. Als Vermieter oder Eigentümer können Sie Ihre Immobilie zur Vermarktung einreichen. KAUFY erstellt KI-optimierte Exposés und übernimmt die Vermarktung.' },
  { question: 'Wie werde ich Vertriebspartner?', answer: 'Auf der Partner-Seite finden Sie alle Informationen. Als Partner profitieren Sie von fertig aufbereiteten Exposés, Finanzierungsanbindung und Provisionsmanagement.' },
  { question: 'Welche Finanzierung wird angeboten?', answer: 'Über unser Schwesterunternehmen FutureRoom haben Sie Zugang zu über 400 Bankpartnern. Die Finanzierungsprüfung wird direkt in die Objektbewertung integriert.' },
  { question: 'Wo werden meine Daten gespeichert?', answer: 'Alle Daten werden DSGVO-konform in deutschen Rechenzentren gespeichert. Wir verwenden Verschlüsselung und geben keine Daten an Dritte weiter.' },
];

export default function Kaufy2026FAQ() {
  return (
    <>
      <SEOHead
        brand="kaufy"
        page={{
          title: 'Häufige Fragen (FAQ) zu Kapitalanlageimmobilien',
          description: 'Antworten auf häufige Fragen zu KAUFY: Immobiliensuche, Finanzierung, KI-Analyse, Kosten und Datenschutz.',
          path: '/faq',
        }}
        faq={faqItems}
      />

      <section className="py-20 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 bg-[hsl(210,80%,55%,0.1)] text-[hsl(210,80%,55%)]">
            <HelpCircle className="h-4 w-4" />
            Häufige Fragen
          </div>
          <h1 className="text-3xl font-bold mb-3 text-[hsl(220,20%,10%)]">FAQ</h1>
          <p className="text-[hsl(215,16%,47%)]">Alles, was Sie über KAUFY und die Immobilieninvestment-Plattform wissen müssen.</p>
        </div>
      </section>

      <section className="pb-24 px-4">
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="rounded-xl border border-[hsl(214,32%,91%)] bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-[hsl(220,20%,10%)] font-medium">{item.question}</AccordionTrigger>
                <AccordionContent className="text-sm text-[hsl(215,16%,47%)] leading-relaxed">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center">
            <p className="text-[hsl(215,16%,47%)] mb-4">Haben Sie weitere Fragen?</p>
            <Link to="/website/kaufy/kontakt" className="inline-flex items-center gap-2 rounded-full bg-[hsl(220,20%,10%)] px-6 py-3 text-sm font-semibold text-white hover:bg-[hsl(220,20%,20%)] transition-colors">
              Kontakt aufnehmen
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
