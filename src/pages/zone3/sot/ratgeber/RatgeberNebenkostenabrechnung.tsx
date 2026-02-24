/**
 * Ratgeber: Nebenkostenabrechnung für Vermieter
 * Supporting article for the MSV vertical.
 */
import { SEOHead, type FAQItem } from '@/components/zone3/shared/SEOHead';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight } from 'lucide-react';

const FAQ_ITEMS: FAQItem[] = [
  { question: 'Wann muss die Nebenkostenabrechnung beim Mieter sein?', answer: 'Spätestens 12 Monate nach Ende des Abrechnungszeitraums. Bei einer Abrechnung für 2025 muss sie also bis 31.12.2026 zugegangen sein.' },
  { question: 'Welche Nebenkosten sind umlagefähig?', answer: 'Gemäß Betriebskostenverordnung (BetrKV) sind 17 Kostenarten umlagefähig, u.a. Grundsteuer, Wasser, Heizung, Müllabfuhr, Gebäudeversicherung, Gartenpflege und Hausmeister.' },
  { question: 'Was passiert bei verspäteter Abrechnung?', answer: 'Der Vermieter verliert seinen Nachforderungsanspruch. Der Mieter hat aber trotzdem Anspruch auf ein Guthaben.' },
  { question: 'Kann ich die Nebenkostenabrechnung digital erstellen?', answer: 'Ja. Mit System of a Town erstellen Sie die Abrechnung automatisch anhand hinterlegter Verteilerschlüssel und stellen sie dem Mieter digital bereit.' },
];

export default function RatgeberNebenkostenabrechnung() {
  return (
    <div className="min-h-screen">
      <SEOHead
        brand="sot"
        page={{
          title: 'Nebenkostenabrechnung erstellen — Ratgeber',
          description: 'Nebenkostenabrechnung für Vermieter: Fristen, umlagefähige Kosten, Verteilerschlüssel und häufige Fehler vermeiden.',
          path: '/ratgeber/nebenkostenabrechnung-vermieter',
        }}
        faq={FAQ_ITEMS}
        article={{
          headline: 'Nebenkostenabrechnung für Vermieter — So geht\'s richtig',
          description: 'Fristen, umlagefähige Kosten, Verteilerschlüssel und häufige Fehler bei der Nebenkostenabrechnung.',
          datePublished: '2026-02-24',
        }}
      />

      <article className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary mb-6">Ratgeber</span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Nebenkostenabrechnung für Vermieter — So geht's richtig</h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Die Nebenkostenabrechnung gehört zu den häufigsten Streitpunkten zwischen Vermieter und Mieter. Hier erfahren Sie, worauf es ankommt.
          </p>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <h2 className="text-xl font-bold text-foreground">Fristen beachten</h2>
            <p>Die Nebenkostenabrechnung muss dem Mieter <strong>innerhalb von 12 Monaten</strong> nach Ende des Abrechnungszeitraums zugehen (§ 556 Abs. 3 BGB). Verpasst der Vermieter diese Frist, verliert er den Nachforderungsanspruch.</p>

            <h2 className="text-xl font-bold text-foreground">Umlagefähige Kosten (BetrKV)</h2>
            <p>Nur Kosten, die in der Betriebskostenverordnung aufgeführt und im Mietvertrag vereinbart sind, dürfen umgelegt werden:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Grundsteuer, Wasser/Abwasser, Heizung</li>
              <li>Müllabfuhr, Straßenreinigung, Gartenpflege</li>
              <li>Gebäudeversicherung, Hausmeister, Aufzug</li>
              <li>Kabelanschluss, Beleuchtung, Schornsteinfeger</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">Verteilerschlüssel</h2>
            <p>Die Kosten müssen nach einem nachvollziehbaren Schlüssel verteilt werden: Wohnfläche, Personenzahl, Verbrauch oder Einheiten. Der Schlüssel muss im Mietvertrag festgelegt sein.</p>

            <h2 className="text-xl font-bold text-foreground">Häufige Fehler vermeiden</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Fristüberschreitung (12-Monats-Regel)</li>
              <li>Nicht umlagefähige Kosten einbeziehen (z.B. Verwaltungskosten)</li>
              <li>Fehlender oder falscher Verteilerschlüssel</li>
              <li>Fehlende Belegeinsicht für den Mieter</li>
            </ul>
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
            <p className="text-lg font-semibold mb-2">Nebenkostenabrechnung automatisieren</p>
            <p className="text-sm text-muted-foreground mb-6">System of a Town berechnet Nebenkosten automatisch — mit konfigurierbaren Verteilerschlüsseln.</p>
            <Link to="/website/sot/loesungen/mietsonderverwaltung" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Zur digitalen MSV <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
