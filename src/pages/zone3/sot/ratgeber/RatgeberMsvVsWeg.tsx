/**
 * Ratgeber: Mietsonderverwaltung vs. WEG-Verwaltung
 * Supporting article for the MSV vertical.
 */
import { SEOHead, type FAQItem } from '@/components/zone3/shared/SEOHead';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight } from 'lucide-react';

const FAQ_ITEMS: FAQItem[] = [
  { question: 'Brauche ich zusätzlich zur WEG-Verwaltung eine Mietsonderverwaltung?', answer: 'Wenn Sie Eigentumswohnungen vermieten, ja. Die WEG-Verwaltung kümmert sich nur um das Gemeinschaftseigentum. Mietvertrag, Nebenkostenabrechnung und Mieterbetreuung fallen in die Mietsonderverwaltung.' },
  { question: 'Kann ein WEG-Verwalter auch die MSV übernehmen?', answer: 'Technisch ja, aber viele WEG-Verwalter bieten dies nicht an oder berechnen dafür separat. Oft ist die Qualität der MSV bei spezialisierten Anbietern besser.' },
  { question: 'Was passiert, wenn ich keine MSV habe?', answer: 'Dann müssen Sie als Eigentümer alle Mieterbelange selbst regeln: Kommunikation, Nebenkostenabrechnung, Mahnwesen, Reparaturkoordination. Das kann zeitaufwändig und fehleranfällig sein.' },
];

export default function RatgeberMsvVsWeg() {
  return (
    <div className="min-h-screen">
      <SEOHead
        brand="sot"
        page={{
          title: 'Mietsonderverwaltung vs. WEG-Verwaltung',
          description: 'Was ist der Unterschied zwischen Mietsonderverwaltung und WEG-Verwaltung? Aufgaben, Kosten und Zuständigkeiten im Vergleich.',
          path: '/ratgeber/mietsonderverwaltung-vs-weg',
        }}
        faq={FAQ_ITEMS}
        article={{
          headline: 'Mietsonderverwaltung vs. WEG-Verwaltung — Der Unterschied erklärt',
          description: 'Aufgaben, Kosten und Zuständigkeiten: MSV und WEG-Verwaltung im direkten Vergleich.',
          datePublished: '2026-02-24',
        }}
      />

      <article className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary mb-6">Ratgeber</span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Mietsonderverwaltung vs. WEG-Verwaltung — Der Unterschied</h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Viele Kapitalanleger kennen die WEG-Verwaltung — aber nicht die Mietsonderverwaltung. Dabei sind es zwei grundverschiedene Leistungen mit unterschiedlichen Zuständigkeiten.
          </p>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <h2 className="text-xl font-bold text-foreground">WEG-Verwaltung: Das Gemeinschaftseigentum</h2>
            <p>Die WEG-Verwaltung (Wohnungseigentumsverwaltung) betreut das <strong>Gemeinschaftseigentum</strong> einer Eigentümergemeinschaft: Treppenhaus, Dach, Fassade, gemeinschaftliche Anlagen. Sie organisiert Eigentümerversammlungen, verwaltet die Instandhaltungsrücklage und setzt Beschlüsse um.</p>

            <h2 className="text-xl font-bold text-foreground">Mietsonderverwaltung: Ihr Sondereigentum</h2>
            <p>Die <strong>Mietsonderverwaltung (MSV)</strong> betreut Ihr <em>Sondereigentum</em> — also die vermietete Wohnung, den Mietvertrag und die Beziehung zum Mieter. Typische Aufgaben:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Mietvertragsverwaltung und Mietanpassungen</li>
              <li>Nebenkostenabrechnung für den Mieter</li>
              <li>Mieterkorrespondenz und Mahnwesen</li>
              <li>Koordination von Reparaturen am Sondereigentum</li>
              <li>Übergabeprotokolle bei Ein- und Auszug</li>
              <li>Kautionsverwaltung</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">Vergleichstabelle</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-border rounded-lg">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="text-left p-3 font-semibold text-foreground">Kriterium</th>
                    <th className="text-left p-3 font-semibold text-foreground">WEG-Verwaltung</th>
                    <th className="text-left p-3 font-semibold text-foreground">Mietsonderverwaltung</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border/50"><td className="p-3">Zuständigkeit</td><td className="p-3">Gemeinschaftseigentum</td><td className="p-3">Sondereigentum / Mieteinheit</td></tr>
                  <tr className="border-t border-border/50"><td className="p-3">Mieterbetreuung</td><td className="p-3">Nein</td><td className="p-3">Ja</td></tr>
                  <tr className="border-t border-border/50"><td className="p-3">Nebenkostenabrechnung</td><td className="p-3">Hausgeld</td><td className="p-3">Mieter-NK</td></tr>
                  <tr className="border-t border-border/50"><td className="p-3">Typische Kosten</td><td className="p-3">20–30 €/Einheit/Monat</td><td className="p-3">20–35 €/Einheit/Monat</td></tr>
                  <tr className="border-t border-border/50"><td className="p-3">Gesetzliche Pflicht</td><td className="p-3">Ja (WEG-Gesetz)</td><td className="p-3">Nein (freiwillig)</td></tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-xl font-bold text-foreground">Fazit</h2>
            <p>WEG-Verwaltung und Mietsonderverwaltung ergänzen sich — ersetzen sich aber nicht. Wer Eigentumswohnungen vermietet, braucht beides oder muss die MSV-Aufgaben selbst übernehmen.</p>
          </div>

          {/* FAQ */}
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

          {/* CTA → Primary */}
          <div className="mt-12 p-8 rounded-2xl bg-muted/30 text-center">
            <p className="text-lg font-semibold mb-2">Digitale Mietsonderverwaltung entdecken</p>
            <p className="text-sm text-muted-foreground mb-6">Alle MSV-Aufgaben in einer Plattform — ohne externe Hausverwaltung.</p>
            <Link to="/website/sot/loesungen/mietsonderverwaltung" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Zur Lösung <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
