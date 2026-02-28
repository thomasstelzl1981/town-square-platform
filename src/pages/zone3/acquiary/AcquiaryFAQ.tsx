/**
 * AcquiaryFAQ — FAQ mit Investment-House Aesthetic + FAQPage Schema
 */
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/zone3/shared/SEOHead';

const faqItems = [
  { question: 'Was ist ACQUIARY?', answer: 'ACQUIARY ist eine KI-gestützte Akquise-Plattform für institutionelle Immobilienankäufe. Wir identifizieren Off-Market-Objekte, bewerten Investmentchancen und begleiten den gesamten Transaktionsprozess.' },
  { question: 'Für wen ist ACQUIARY geeignet?', answer: 'Für institutionelle Investoren, Family Offices, Projektentwickler und vermögende Privatanleger, die Zugang zu diskreten Immobilien-Deals suchen.' },
  { question: 'Wie funktioniert die Akquise-Methodik?', answer: 'Unser KI-System analysiert Marktdaten, identifiziert potenzielle Verkäufer und erstellt automatisierte Bewertungen. Die persönliche Ansprache erfolgt diskret durch unser Netzwerk.' },
  { question: 'Was kostet die Nutzung?', answer: 'ACQUIARY arbeitet erfolgsbasiert. Es fallen keine Grundgebühren an — die Provision wird nur bei erfolgreichem Abschluss fällig.' },
  { question: 'Sind meine Anfragen vertraulich?', answer: 'Absolut. Alle Anfragen und Mandate unterliegen strikter NDA-Vertraulichkeit. Diskretion ist Kernbestandteil unserer Arbeitsweise.' },
  { question: 'Kann ich ein Objekt anbieten?', answer: 'Ja. Über die Seite „Objekt anbieten" können Sie diskret Ihre Immobilie zur Prüfung einreichen. Wir bewerten den Deal und vermitteln an passende Investoren.' },
  { question: 'Wie groß ist das Netzwerk?', answer: 'Unser Netzwerk umfasst über 200 qualifizierte Investoren, Projektentwickler und institutionelle Partner im deutschsprachigen Raum.' },
  { question: 'Wie werde ich Teil des Netzwerks?', answer: 'Qualifizierte Makler und Investoren können sich über die Karriere-Seite bewerben. Voraussetzung ist nachweisbare Erfahrung im Immobilien-Investmentbereich.' },
];

export default function AcquiaryFAQ() {
  return (
    <>
      <SEOHead
        brand="acquiary"
        page={{
          title: 'Häufige Fragen (FAQ) zur Immobilien-Akquise',
          description: 'Antworten auf häufige Fragen zu ACQUIARY: Akquise-Methodik, Vertraulichkeit, Kosten, Netzwerk und Objekt-Einreichung.',
          path: '/faq',
        }}
        faq={faqItems}
      />

      <section className="py-20 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 bg-[hsl(207,90%,54%,0.1)] text-[hsl(207,90%,54%)]">
          <HelpCircle className="h-4 w-4" />
          Häufige Fragen
        </div>
        <h1 className="text-3xl font-bold mb-3 text-[hsl(220,25%,12%)]">FAQ</h1>
        <p className="text-[hsl(220,10%,42%)]">Alles über ACQUIARY und unsere Akquise-Plattform.</p>
      </section>

      <section className="pb-24 px-4">
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="rounded-xl border border-[hsl(220,15%,90%)] bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-[hsl(220,25%,12%)] font-medium">{item.question}</AccordionTrigger>
                <AccordionContent className="text-sm text-[hsl(220,10%,42%)] leading-relaxed">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center">
            <p className="text-[hsl(220,10%,42%)] mb-4">Weitere Fragen?</p>
            <Link to="/website/acquiary/kontakt" className="aq-btn aq-btn-primary">Kontakt aufnehmen</Link>
          </div>
        </div>
      </section>
    </>
  );
}
