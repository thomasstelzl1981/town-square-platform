/**
 * OttoFAQ — FAQ mit FAQPage Schema für Otto² Advisory
 */
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/zone3/shared/SEOHead';

const faqItems = [
  { question: 'Was ist Otto² Advisory?', answer: 'Otto² Advisory ist eine ganzheitliche Finanzberatung für Unternehmer und Privathaushalte. Wir analysieren zuerst Ihre Situation, entwickeln ein Zielbild und setzen es strukturiert um.' },
  { question: 'Für wen ist die Beratung geeignet?', answer: 'Für Unternehmer, die ihre Finanzen professionell strukturieren wollen, und Privathaushalte, die Vorsorge, Finanzierung und Vermögensaufbau optimieren möchten.' },
  { question: 'Was kostet die Erstberatung?', answer: 'Das Erstgespräch ist unverbindlich und kostenfrei. Wir nehmen uns Zeit, Ihre Situation zu verstehen, bevor wir über Lösungen sprechen.' },
  { question: 'Welche Bereiche deckt die Beratung ab?', answer: 'Immobilienfinanzierung, Altersvorsorge, Vermögensaufbau, Risikoabsicherung, Unternehmensfinanzierung und steueroptimierte Anlagestrategien.' },
  { question: 'Wer sind die Berater?', answer: 'Otto Stelzl und Thomas Otto Stelzl — erfahrene Finanzberater mit langjähriger Expertise in Unternehmens- und Privatkundenberatung.' },
  { question: 'Wie läuft der Beratungsprozess ab?', answer: 'In drei Schritten: (1) Analyse Ihrer aktuellen Situation, (2) Entwicklung eines individuellen Zielbilds, (3) Strukturierte Umsetzung mit regelmäßiger Überprüfung.' },
  { question: 'Wie werde ich Kunde?', answer: 'Kontaktieren Sie uns über die Kontaktseite oder rufen Sie direkt an. Nach einem ersten Kennenlerntermin entscheiden Sie, ob wir zusammenarbeiten.' },
  { question: 'Wie werden meine Daten geschützt?', answer: 'Alle Daten werden DSGVO-konform verarbeitet und unterliegen der Verschwiegenheitspflicht nach §34d GewO. Ihre Daten sind bei uns sicher.' },
];

export default function OttoFAQ() {
  return (
    <>
      <SEOHead
        brand="otto"
        page={{
          title: 'Häufige Fragen (FAQ) zur Finanzberatung',
          description: 'Antworten auf häufige Fragen zu Otto² Advisory: Beratungsprozess, Kosten, Leistungen und Datenschutz.',
          path: '/faq',
        }}
        faq={faqItems}
      />

      <section className="py-20 px-4 text-center bg-slate-50">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 bg-[#0055A4]/10 text-[#0055A4]">
          <HelpCircle className="h-4 w-4" />
          Häufige Fragen
        </div>
        <h1 className="text-3xl font-bold mb-3 text-slate-800">FAQ</h1>
        <p className="text-slate-500">Alles über Otto² Advisory und unsere Finanzberatung.</p>
      </section>

      <section className="py-16 pb-24 px-4">
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="rounded-xl border border-slate-200 bg-white px-6 shadow-sm">
                <AccordionTrigger className="text-left text-slate-800 font-medium">{item.question}</AccordionTrigger>
                <AccordionContent className="text-sm text-slate-500 leading-relaxed">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center">
            <p className="text-slate-500 mb-4">Haben Sie weitere Fragen?</p>
            <Link to="/website/otto-advisory/kontakt" className="inline-flex items-center gap-2 rounded-lg bg-[#0055A4] px-6 py-3 text-sm font-semibold text-white hover:bg-[#004690] transition-colors">
              Kontakt aufnehmen
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
