/**
 * LennoxFAQ — Alpine Chic FAQ + FAQPage Schema
 */
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { LENNOX as C } from './lennoxTheme';

const faqItems = [
  { question: 'Was ist Lennox & Friends?', answer: 'Lennox & Friends ist ein Netzwerk zertifizierter Partner für Premium-Hundebetreuung: Daycare, Gassi-Service, Hundetraining und mehr — direkt in Ihrer Nähe.' },
  { question: 'Wie finde ich einen Partner in meiner Nähe?', answer: 'Auf der Startseite können Sie über die Suchfunktion Partner in Ihrer Umgebung finden. Filtern Sie nach Leistung, Bewertung und Verfügbarkeit.' },
  { question: 'Wie werden Partner zertifiziert?', answer: 'Alle Partner durchlaufen einen Qualifikationsprozess: Sachkundenachweis, Versicherungsnachweis, Hygiene-Check und Bewertungssystem. Nur geprüfte Anbieter werden gelistet.' },
  { question: 'Wie werde ich selbst Partner?', answer: 'Auf der Seite „Partner werden" können Sie sich bewerben. Sie benötigen einen Sachkundenachweis nach §11 TierSchG und eine Tierhalterhaftpflicht.' },
  { question: 'Was kostet die Betreuung?', answer: 'Die Preise setzen Partner individuell fest. Sie sehen alle Preise transparent im Partnerprofil — keine versteckten Kosten.' },
  { question: 'Gibt es einen Shop?', answer: 'Ja. In unserem Shop finden Sie Premium-Hundezubehör: Leinen, Halsbänder, Betten und mehr — von uns empfohlen und getestet.' },
  { question: 'Sind meine Daten sicher?', answer: 'Ja. Alle Daten werden DSGVO-konform in deutschen Rechenzentren gespeichert. Wir geben keine Daten an Dritte weiter.' },
];

export default function LennoxFAQ() {
  return (
    <>
      <SEOHead
        brand="lennox"
        page={{
          title: 'Häufige Fragen (FAQ) — Hundebetreuung & Netzwerk',
          description: 'Antworten auf häufige Fragen zu Lennox & Friends: Hundebetreuung, Partner-Zertifizierung, Shop und Datenschutz.',
          path: '/faq',
        }}
        faq={faqItems}
      />

      <section className="py-20 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4" style={{ background: `${C.forest}15`, color: C.forest }}>
          <HelpCircle className="h-4 w-4" />
          Häufige Fragen
        </div>
        <h1 className="text-3xl font-bold mb-3" style={{ color: C.bark }}>FAQ</h1>
        <p style={{ color: C.barkMuted }}>Alles, was Sie über Lennox & Friends wissen müssen.</p>
      </section>

      <section className="pb-24 px-4">
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="rounded-xl border bg-white px-6 shadow-sm" style={{ borderColor: C.sandLight }}>
                <AccordionTrigger className="text-left font-medium" style={{ color: C.bark }}>{item.question}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed" style={{ color: C.barkMuted }}>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center">
            <p style={{ color: C.barkMuted }} className="mb-4">Haben Sie weitere Fragen?</p>
            <Link to="/website/tierservice/kontakt" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors" style={{ background: C.forest }}>
              Kontakt aufnehmen
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
