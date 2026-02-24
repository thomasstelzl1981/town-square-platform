/**
 * SoT Solution Page — Digitale Mietsonderverwaltung
 * PRIMARY landing page for the "Mietsonderverwaltung" vertical.
 * Canonical SSOT: systemofatown.com/loesungen/mietsonderverwaltung
 */
import { SEOHead, type FAQItem } from '@/components/zone3/shared/SEOHead';
import { Link } from 'react-router-dom';
import { Building2, FileText, Shield, BarChart3, Users, Bell, ChevronRight, ArrowRight } from 'lucide-react';

const FAQ_ITEMS: FAQItem[] = [
  { question: 'Was ist Mietsonderverwaltung?', answer: 'Mietsonderverwaltung (MSV) ist die professionelle Verwaltung von Mieteinheiten innerhalb einer WEG — getrennt von der allgemeinen Hausverwaltung. Sie umfasst Mieterkommunikation, Nebenkostenabrechnung, Mietanpassungen und Instandhaltungskoordination.' },
  { question: 'Wie unterscheidet sich Mietsonderverwaltung von WEG-Verwaltung?', answer: 'Die WEG-Verwaltung kümmert sich um das Gemeinschaftseigentum aller Eigentümer. Die Mietsonderverwaltung dagegen betreut das Sondereigentum eines einzelnen Eigentümers — also die vermietete Wohnung, den Mietvertrag und die Mieterbeziehung.' },
  { question: 'Für wen eignet sich eine digitale Mietsonderverwaltung?', answer: 'Für Kapitalanleger mit 1–50+ Mieteinheiten, die ihre Verwaltung professionalisieren möchten, ohne eine eigene Hausverwaltung zu beauftragen. Besonders relevant für Eigentümer mit Einheiten in verschiedenen Städten.' },
  { question: 'Was kostet digitale Mietsonderverwaltung?', answer: 'Die Kosten variieren je nach Leistungsumfang. Typisch sind 20–35 € pro Einheit/Monat. Mit System of a Town können Sie viele Aufgaben selbst digital erledigen und so Kosten sparen.' },
  { question: 'Welche Aufgaben übernimmt die Mietsonderverwaltung?', answer: 'Typische Aufgaben: Mietvertragsverwaltung, Nebenkostenabrechnung, Mietanpassungen, Mieterkorrespondenz, Mahnwesen, Koordination von Reparaturen, Übergabeprotokolle und Kaution.' },
  { question: 'Kann ich die Mietsonderverwaltung selbst digital durchführen?', answer: 'Ja. Mit System of a Town erhalten Sie alle Werkzeuge für die digitale MSV: Mietvertrags-Management, automatisierte Nebenkostenabrechnung, digitale Mieterakte und Mieterkommunikation — alles in einer Plattform.' },
  { question: 'Was ist der Vorteil einer digitalen gegenüber einer klassischen Mietsonderverwaltung?', answer: 'Transparenz in Echtzeit, automatisierte Prozesse (Mahnwesen, NK-Abrechnung), digitale Dokumentenablage, Mieter-Self-Service und deutlich geringere Kosten pro Einheit.' },
  { question: 'Wie funktioniert die Nebenkostenabrechnung in der digitalen MSV?', answer: 'System of a Town berechnet Nebenkosten automatisch anhand Ihrer hinterlegten Verteilerschlüssel, erstellt die Abrechnung und stellt sie dem Mieter digital bereit — inklusive Belegprüfung.' },
];

const FEATURES = [
  { icon: FileText, title: 'Mietvertrags-Management', desc: 'Digitale Vertragsverwaltung mit Fristen-Tracking, automatischen Mietanpassungen und Vorlagen.' },
  { icon: BarChart3, title: 'Nebenkostenabrechnung', desc: 'Automatisierte NK-Abrechnung mit konfigurierbaren Verteilerschlüsseln und Belegprüfung.' },
  { icon: Users, title: 'Mieter-Self-Service', desc: 'Mieter melden Schäden, laden Dokumente herunter und kommunizieren — alles digital.' },
  { icon: Shield, title: 'Digitale Mieterakte', desc: 'Alle Dokumente, Protokolle und Korrespondenz an einem Ort — revisionssicher und DSGVO-konform.' },
  { icon: Bell, title: 'Automatisches Mahnwesen', desc: 'Zahlungseingänge überwachen, Mahnungen automatisch erstellen und versenden.' },
  { icon: Building2, title: 'Übergabe & Kaution', desc: 'Digitale Übergabeprotokolle, Kautionsverwaltung und Abnahme-Checklisten.' },
];

export default function SotMietsonderverwaltung() {
  return (
    <div className="min-h-screen">
      <SEOHead
        brand="sot"
        page={{
          title: 'Digitale Mietsonderverwaltung',
          description: 'Professionelle Mietsonderverwaltung digital: Mietverträge, Nebenkostenabrechnung, Mieterakte und Kommunikation — alles in einer Plattform.',
          path: '/loesungen/mietsonderverwaltung',
        }}
        faq={FAQ_ITEMS}
        services={[{
          name: 'Digitale Mietsonderverwaltung',
          description: 'Professionelle Sonderverwaltung für Mietimmobilien: Mietverträge, Nebenkostenabrechnung, digitale Mieterakte — transparent, rechtssicher, KI-gestützt.',
          url: 'https://systemofatown.com/loesungen/mietsonderverwaltung',
        }]}
      />

      {/* Hero */}
      <section className="relative py-20 md:py-28 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary mb-6">
            Lösung
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
            Digitale<br />Mietsonderverwaltung
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Mietverträge, Nebenkostenabrechnung, Mieterakte und Kommunikation — alles in einer Plattform. 
            Für Kapitalanleger, die ihre Immobilien professionell und transparent verwalten.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/website/sot/demo" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              Demo anfordern <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/website/sot/preise" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border border-border font-medium hover:bg-muted/50 transition-colors">
              Preise ansehen <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* What is MSV */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Was ist Mietsonderverwaltung?</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p>
              <strong>Mietsonderverwaltung (MSV)</strong> ist die professionelle Betreuung von vermieteten Eigentumswohnungen — 
              getrennt von der WEG-Verwaltung des Gemeinschaftseigentums. Während die WEG-Hausverwaltung sich um Treppenhaus, 
              Dach und gemeinsame Anlagen kümmert, betreut die Mietsonderverwaltung alles rund um <em>Ihre Mieteinheit</em>: 
              Mietvertrag, Mieter, Nebenkosten und Instandhaltung.
            </p>
            <p>
              Mit <strong>System of a Town</strong> digitalisieren Sie diese Aufgaben vollständig: automatisierte Nebenkostenabrechnung, 
              digitale Mieterakte, Fristen-Monitoring und KI-gestützte Dokumentenverarbeitung — ohne externe Hausverwaltung.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Funktionen der digitalen MSV</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-md transition-all">
                <f.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Häufige Fragen zur Mietsonderverwaltung</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, i) => (
              <details key={i} className="group p-5 rounded-xl border border-border/50 bg-background">
                <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                  {item.question}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Bereit für die digitale Mietsonderverwaltung?</h2>
          <p className="text-muted-foreground mb-8">Testen Sie System of a Town kostenlos — keine Kreditkarte erforderlich.</p>
          <Link to="/auth?mode=register&source=sot" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
            Kostenlos starten <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
