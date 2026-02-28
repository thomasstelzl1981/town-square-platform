/**
 * FutureRoomFAQ — Häufige Fragen mit Banking-Style Design
 */
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/zone3/shared/SEOHead';

export default function FutureRoomFAQ() {
  const faqItems = [
    {
      question: 'Was macht FutureRoom anders als andere Vermittler?',
      answer: 'FutureRoom ist keine klassische Vermittlungsplattform. Wir orchestrieren den gesamten Finanzierungsprozess — von der Datenerfassung über die KI-gestützte Dokumentenaufbereitung bis zur Bankeinreichung. Sie erhalten nicht nur Angebote, sondern werden aktiv begleitet.',
    },
    {
      question: 'Wie funktioniert die Finanzierungsanfrage?',
      answer: 'Sie füllen unsere digitale Selbstauskunft aus und laden Ihre Dokumente hoch. Unser System prüft automatisch auf Vollständigkeit und bereitet alles bankfertig auf. Ein Finanzierungsmanager übernimmt dann Ihren Fall und koordiniert die Einreichung bei passenden Banken.',
    },
    {
      question: 'Was ist ein Finanzierungsmanager?',
      answer: 'Finanzierungsmanager sind zertifizierte Baufinanzierungsexperten (§34i GewO), die in unserem System arbeiten. Sie übernehmen vorbereitete Fälle und begleiten Sie persönlich durch den Prozess — von der Bankauswahl bis zur Auszahlung.',
    },
    {
      question: 'Wie lange dauert die Bearbeitung?',
      answer: 'Sie erhalten innerhalb von 48 Stunden eine erste Einschätzung. Die vollständige Finanzierungsprüfung dauert in der Regel 1-2 Wochen, abhängig von der Vollständigkeit Ihrer Unterlagen und der Komplexität Ihrer Situation.',
    },
    {
      question: 'Ist der Service kostenlos?',
      answer: 'Die Finanzierungsanfrage und Erstberatung sind für Sie kostenlos. Eine Provision fällt nur im Erfolgsfall an — wenn Ihre Finanzierung tatsächlich zustande kommt. Alles transparent und ohne versteckte Kosten.',
    },
    {
      question: 'Welche Unterlagen werden benötigt?',
      answer: 'Typischerweise: Gehaltsabrechnungen (3 Monate), Arbeitsvertrag, Personalausweis, Kontoauszüge, und Objektunterlagen (Exposé, Grundbuchauszug). Bei Selbstständigen zusätzlich BWA und Jahresabschlüsse. Unser System führt Sie durch alle benötigten Dokumente.',
    },
    {
      question: 'Mit welchen Banken arbeiten Sie?',
      answer: 'Wir haben Zugang zu über 400 Finanzierungspartnern — Großbanken, Sparkassen, Volksbanken und spezialisierte Baufinanzierer. So finden wir die optimalen Konditionen für Ihre individuelle Situation.',
    },
    {
      question: 'Was passiert mit meinen Daten?',
      answer: 'Ihre Daten werden verschlüsselt übertragen und streng vertraulich behandelt. Sie werden nur für die Finanzierungsprüfung verwendet und nicht an Dritte weitergegeben. Wir sind vollständig DSGVO-konform.',
    },
    {
      question: 'Kann ich den Status meiner Anfrage verfolgen?',
      answer: 'Ja, Sie haben jederzeit Zugang zu Ihrem persönlichen Portal. Dort sehen Sie den aktuellen Status, alle eingereichten Dokumente und können mit Ihrem Finanzierungsmanager kommunizieren.',
    },
    {
      question: 'Wie werde ich Finanzierungsmanager?',
      answer: 'Voraussetzung ist eine IHK-Zulassung nach §34i GewO. Bewerben Sie sich über unsere Karriere-Seite — Sie profitieren von fertigen Unterlagen, modernem Tooling und direkten Bankzugängen in unserem System.',
    },
  ];

  return (
    <div className="py-16" style={{ background: 'hsl(210 25% 97%)' }}>
      <SEOHead
        brand="futureroom"
        page={{
          title: 'Häufige Fragen (FAQ) zur Immobilienfinanzierung',
          description: 'Antworten auf häufige Fragen zu FutureRoom: Finanzierungsablauf, Kosten, Unterlagen, Bankpartner und Datenschutz.',
          path: '/faq',
        }}
        faq={faqItems.map(item => ({ question: item.question, answer: item.answer }))}
      />
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
            style={{ 
              background: 'hsl(165 70% 36% / 0.1)', 
              color: 'hsl(165 70% 36%)' 
            }}
          >
            <HelpCircle className="h-4 w-4" />
            Häufige Fragen
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'hsl(210 30% 15%)' }}>
            FAQ
          </h1>
          <p className="text-gray-500">
            Antworten auf die häufigsten Fragen zu FutureRoom und unserer Finanzierungsorchestrierung.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="fr-accordion">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="fr-accordion-item"
              >
                <AccordionTrigger 
                  className="fr-accordion-trigger"
                  style={{ color: 'hsl(210 30% 15%)' }}
                >
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="fr-accordion-content">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 mb-2">
            Haben Sie weitere Fragen?
          </p>
          <p className="mb-6">
            <a 
              href="mailto:info@futureroom.online" 
              className="font-medium hover:underline"
              style={{ color: 'hsl(165 70% 36%)' }}
            >
              info@futureroom.online
            </a>
          </p>
          <Link to="/futureroom/bonitat">
            <button className="fr-btn fr-btn-primary">
              Finanzierung starten
              <ChevronRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
