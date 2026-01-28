import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

export default function FutureRoomFAQ() {
  const faqItems = [
    {
      question: 'Was ist der Bonitätscheck?',
      answer: 'Der Bonitätscheck ist eine kostenlose und unverbindliche Ersteinschätzung Ihrer Finanzierungsmöglichkeiten. Auf Basis Ihrer Angaben prüfen wir, ob und zu welchen Konditionen eine Finanzierung realisierbar ist.',
    },
    {
      question: 'Wie lange dauert die Bearbeitung?',
      answer: 'Sie erhalten innerhalb von 48 Stunden eine erste Einschätzung. Die vollständige Finanzierungsprüfung dauert in der Regel 1-2 Wochen, abhängig von der Vollständigkeit Ihrer Unterlagen.',
    },
    {
      question: 'Ist der Service kostenlos?',
      answer: 'Der Bonitätscheck und die Beratung sind für Sie völlig kostenlos. Eine Vermittlungsgebühr fällt nur im Erfolgsfall an und wird transparent kommuniziert.',
    },
    {
      question: 'Welche Unterlagen werden benötigt?',
      answer: 'Typischerweise benötigen wir: Gehaltsabrechnungen der letzten 3 Monate, Arbeitsvertrag, Personalausweis, Kontoauszüge, Objektunterlagen (Exposé, Grundbuchauszug). Bei Selbstständigen zusätzlich BWA und Jahresabschlüsse.',
    },
    {
      question: 'Mit welchen Banken arbeiten Sie zusammen?',
      answer: 'Wir haben Zugang zu über 400 Finanzierungspartnern, darunter Großbanken, Sparkassen, Volksbanken und spezialisierte Baufinanzierer. So finden wir die besten Konditionen für Ihre Situation.',
    },
    {
      question: 'Was passiert mit meinen Daten?',
      answer: 'Ihre Daten werden verschlüsselt übertragen und streng vertraulich behandelt. Sie werden nur für die Finanzierungsprüfung verwendet und nicht an Dritte weitergegeben. Wir halten alle Datenschutzbestimmungen (DSGVO) ein.',
    },
    {
      question: 'Kann ich meine Anfrage jederzeit stoppen?',
      answer: 'Ja, Sie können jederzeit und ohne Angabe von Gründen von Ihrer Anfrage zurücktreten. Es entstehen keine Kosten oder Verpflichtungen.',
    },
    {
      question: 'Wie kann ich Finanzierungsmanager werden?',
      answer: 'Um als Finanzierungsmanager bei FutureRoom tätig zu werden, benötigen Sie eine IHK-Zulassung nach §34i GewO. Bewerben Sie sich über unsere Karriere-Seite und wir melden uns zeitnah bei Ihnen.',
    },
  ];

  return (
    <div className="py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 text-amber-400 text-sm mb-4">
            <HelpCircle className="h-4 w-4" />
            Häufige Fragen
          </div>
          <h1 className="text-3xl font-bold mb-4">FAQ</h1>
          <p className="text-white/60">
            Antworten auf die häufigsten Fragen zu FutureRoom
          </p>
        </div>

        {/* FAQ Accordion */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border-white/10"
                >
                  <AccordionTrigger className="text-white hover:text-amber-400 text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-white/60 mb-4">
            Haben Sie weitere Fragen?
          </p>
          <p className="text-white">
            Kontaktieren Sie uns unter{' '}
            <a href="mailto:info@futureroom.de" className="text-amber-400 hover:underline">
              info@futureroom.de
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
