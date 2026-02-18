/**
 * SoT Intelligenz — Armstrong Intelligence Deep Dive
 * Datenraum-Extraktion, Magic Intake, Post-Extraction Queries
 */
import { Link } from 'react-router-dom';
import {
  ArrowRight, Brain, Scan, FileCheck, Shield, Zap,
  MessageSquare, Upload, Sparkles, Lock, CheckCircle2,
  Eye, CreditCard, Mail, FileText, Workflow
} from 'lucide-react';
import { SotCTA } from '@/components/zone3/sot';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';

const extractionSteps = [
  { icon: Scan, num: '01', title: 'Scannen', desc: 'Armstrong analysiert Ihren gesamten Datenraum und ermittelt, welche Dokumente verarbeitet werden können.' },
  { icon: CreditCard, num: '02', title: 'Angebot', desc: 'Sie sehen den genauen Credit-Preis, bevor irgendetwas verarbeitet wird. Volle Transparenz.' },
  { icon: CheckCircle2, num: '03', title: 'Freigabe', desc: 'Ein Klick genügt. Erst nach Ihrer Freigabe beginnt Armstrong mit der Verarbeitung.' },
  { icon: FileCheck, num: '04', title: 'Verarbeitung', desc: 'Armstrong extrahiert, klassifiziert und indiziert — danach ist alles per Frage abrufbar.' },
];

const exampleQueries = [
  'Fasse alle Mietverträge zusammen und zeige die Kündigungsfristen',
  'Vergleiche die Nebenkostenabrechnungen 2024 und 2025',
  'Welche Versicherungen laufen nächsten Monat aus?',
  'Erstelle eine Übersicht aller offenen Rechnungen',
  'Was steht im Grundbuch der Musterstraße 5?',
  'Berechne die Gesamtrendite meines Immobilienportfolios',
];

const freeActions = [
  'Begriffe und Module erklären',
  'Rendite-Schnellrechnung',
  'Aufgaben priorisieren',
  'Navigation und Hilfe',
  'Datenraum-Übersicht',
  'Einfache Kalkulationen',
];

const creditCategories = [
  { name: 'Datenraum-Extraktion', price: '1 Credit/Dokument', desc: 'Dokumente analysieren, klassifizieren und für Fragen verfügbar machen' },
  { name: 'Textgenerierung', price: '1–3 Credits', desc: 'E-Mails, Briefe, Berichte und Zusammenfassungen erstellen' },
  { name: 'Dokumentenanalyse', price: '2–5 Credits', desc: 'Verträge vergleichen, Klauseln finden, Inhalte extrahieren' },
  { name: 'Web-Recherche', price: '3–5 Credits', desc: 'Internet-Recherche mit Quellenprotokoll und Zusammenfassung' },
  { name: 'Posteingang-Pipeline', price: '1 Credit/Dokument', desc: 'Automatische End-to-End-Verarbeitung neuer Dokumente' },
];

const comparisonItems = [
  { tool: 'ChatGPT', method: 'Manuell hochladen, jedes Mal neu', limit: 'Keine Verbindung zu Ihren Daten' },
  { tool: 'Microsoft Copilot', method: 'Abo + Einschränkungen', limit: 'Nur Microsoft-Ökosystem' },
  { tool: 'Armstrong', method: 'Einmal aktivieren, dauerhaft nutzen', limit: 'Ihr gesamter Datenraum, Pay per Use' },
];

export default function SotIntelligenz() {
  const { ref: heroRef, isVisible: heroVisible } = useSotScrollAnimation();
  const { ref: problemRef, isVisible: problemVisible } = useSotScrollAnimation();
  const { ref: stepsRef, isVisible: stepsVisible } = useSotScrollAnimation();
  const { ref: magicRef, isVisible: magicVisible } = useSotScrollAnimation();
  const { ref: queriesRef, isVisible: queriesVisible } = useSotScrollAnimation();
  const { ref: pricingRef, isVisible: pricingVisible } = useSotScrollAnimation();
  const { ref: privacyRef, isVisible: privacyVisible } = useSotScrollAnimation();

  return (
    <div>
      {/* Hero */}
      <section className="py-20 lg:py-32 sot-atmosphere relative">
        <div className="absolute inset-0 sot-grid-pattern opacity-10" />
        <div className="zone3-container relative z-10 text-center">
          <div className={`sot-fade-in ${heroVisible ? 'visible' : ''}`} ref={heroRef}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6 text-xs font-bold tracking-wider uppercase"
              style={{ borderColor: 'hsl(var(--z3-accent) / 0.3)', backgroundColor: 'hsl(var(--z3-accent) / 0.1)', color: 'hsl(var(--z3-accent))' }}>
              <Sparkles className="w-3.5 h-3.5" />
              Game Changer
            </div>
            <h1 className="sot-display mb-6">
              Armstrong<br />Intelligence
            </h1>
            <p className="sot-subheadline max-w-3xl mx-auto mb-10">
              Ihre KI liest Ihren gesamten Datenraum — ohne manuelles Hochladen, 
              ohne Copy-Paste. Einmal aktivieren, dauerhaft nutzen.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/auth?mode=register&source=sot" className="sot-btn-primary">
                Kostenlos starten
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/website/sot/preise" className="sot-btn-secondary">
                <CreditCard className="w-4 h-4" />
                Preise ansehen
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Das Problem */}
      <section className="py-16 lg:py-24">
        <div className="zone3-container max-w-4xl">
          <div className={`sot-fade-in ${problemVisible ? 'visible' : ''}`} ref={problemRef}>
            <h2 className="sot-headline mb-6 text-center">Kennen Sie das?</h2>
            <p className="sot-subheadline text-center mb-10 max-w-2xl mx-auto">
              Sie wollen Ihre KI fragen, was in Ihrem Mietvertrag steht — aber zuerst müssen Sie 
              das PDF finden, hochladen, warten. Und nächstes Mal? Von vorne.
            </p>

            {/* Comparison Table */}
            <div className="space-y-3">
              {comparisonItems.map((item, i) => (
                <div
                  key={item.tool}
                  className={`sot-glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sot-fade-in ${problemVisible ? 'visible' : ''}`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="flex-shrink-0">
                    <span className={`text-sm font-bold ${item.tool === 'Armstrong' ? 'text-primary' : ''}`} style={item.tool !== 'Armstrong' ? { color: 'hsl(var(--z3-muted-foreground))' } : undefined}>
                      {item.tool}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.method}</p>
                    <p className="text-xs" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>{item.limit}</p>
                  </div>
                  {item.tool === 'Armstrong' && (
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Datenraum-Extraktion */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container">
          <div className={`text-center mb-12 sot-fade-in ${stepsVisible ? 'visible' : ''}`} ref={stepsRef}>
            <span className="sot-label mb-4 inline-block" style={{ color: 'hsl(var(--z3-accent))' }}>
              Datenraum-Extraktion
            </span>
            <h2 className="sot-headline mb-4">Scan → Angebot → Freigabe → Verarbeitung</h2>
            <p className="sot-subheadline max-w-2xl mx-auto">
              Sie sehen den Preis vorher. Nach der Freigabe arbeitet Armstrong Ihre 
              Dokumente ab — und kann sie ab sofort lesen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {extractionSteps.map((step, i) => (
              <div
                key={step.num}
                className={`text-center sot-fade-in ${stepsVisible ? 'visible' : ''}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                >
                  <step.icon className="w-8 h-8" style={{ color: 'hsl(var(--z3-accent))' }} />
                </div>
                <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'hsl(var(--z3-accent))' }}>
                  {step.num}
                </div>
                <h3 className="font-bold mb-2">{step.title}</h3>
                <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Magic Intake */}
      <section className="py-16 lg:py-24">
        <div className="zone3-container max-w-4xl">
          <div className={`sot-fade-in ${magicVisible ? 'visible' : ''}`} ref={magicRef}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                <Upload className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
              </div>
              <div>
                <h2 className="sot-headline">Magic Intake</h2>
                <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                  Daten nicht mühsam eintippen — KI erfasst.
                </p>
              </div>
            </div>
            <p className="sot-subheadline mb-8">
              Laden Sie ein Dokument hoch und Armstrong extrahiert alle relevanten Daten. 
              Selbstauskunft ausfüllen, Immobilienakte anlegen, Projektdaten importieren — 
              in Sekunden statt Stunden.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { title: 'Selbstauskunft', desc: 'Bankdokumente hochladen, Armstrong füllt die Felder aus.' },
                { title: 'Immobilienakte', desc: 'Exposé oder Grundbuchauszug → komplette Objektakte.' },
                { title: 'Projektdaten', desc: 'Kalkulationen und Pläne → strukturierte Projektakte.' },
              ].map((item) => (
                <div key={item.title} className="sot-glass-card p-5">
                  <h3 className="font-bold text-sm mb-2">{item.title}</h3>
                  <p className="text-xs" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Was danach möglich ist */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container max-w-4xl">
          <div className={`sot-fade-in ${queriesVisible ? 'visible' : ''}`} ref={queriesRef}>
            <h2 className="sot-headline mb-4 text-center">Was danach möglich ist</h2>
            <p className="sot-subheadline text-center mb-10 max-w-2xl mx-auto">
              Sobald Armstrong Ihren Datenraum kennt, können Sie alles fragen.
            </p>
            <div className="space-y-3">
              {exampleQueries.map((q, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-4 rounded-xl sot-fade-in ${queriesVisible ? 'visible' : ''}`}
                  style={{
                    backgroundColor: 'hsl(var(--z3-accent) / 0.05)',
                    border: '1px solid hsl(var(--z3-accent) / 0.1)',
                    transitionDelay: `${i * 60}ms`,
                  }}
                >
                  <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--z3-accent))' }} />
                  <p className="text-sm font-medium">"{q}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Posteingangs-Pipeline */}
      <section className="py-16 lg:py-24">
        <div className="zone3-container max-w-4xl">
          <div className="sot-glass-card p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
              <Mail className="w-7 h-7" style={{ color: 'hsl(var(--z3-accent))' }} />
            </div>
            <div>
              <h3 className="sot-headline mb-3">Posteingangs-Pipeline</h3>
              <p className="sot-subheadline mb-4">
                Neue Dokumente werden automatisch verarbeitet: Eingang erkennen, klassifizieren, 
                dem richtigen Objekt oder Kontakt zuordnen, extrahieren. 1 Credit pro Dokument.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5" style={{ color: 'hsl(var(--z3-accent))' }}>
                  <Workflow className="w-4 h-4" />
                  End-to-End automatisiert
                </span>
                <span className="flex items-center gap-1.5" style={{ color: 'hsl(var(--z3-accent))' }}>
                  <FileText className="w-4 h-4" />
                  Inkl. NK-Beleg-Parsing
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wie Armstrong arbeitet */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container max-w-4xl">
          <h2 className="sot-headline mb-10 text-center">Wie Armstrong arbeitet</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Eye, title: 'Plan', desc: 'Armstrong zeigt Ihnen, was er vorhat — Schritt für Schritt. Sie sehen den Preis vorher.' },
              { icon: CheckCircle2, title: 'Bestätigen', desc: 'Nichts passiert ohne Ihre Freigabe. Ein Klick genügt.' },
              { icon: Zap, title: 'Ausführen', desc: 'Armstrong arbeitet ab — schnell, präzise, dokumentiert.' },
            ].map((s, i) => (
              <div key={s.title} className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                  <s.icon className="w-7 h-7" style={{ color: 'hsl(var(--z3-accent))' }} />
                </div>
                <h3 className="font-bold mb-2">{s.title}</h3>
                <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kostenlos vs. Credits */}
      <section className="py-16 lg:py-24">
        <div className="zone3-container max-w-5xl">
          <div className={`sot-fade-in ${pricingVisible ? 'visible' : ''}`} ref={pricingRef}>
            <h2 className="sot-headline mb-10 text-center">Kostenlos vs. Credits</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Free */}
              <div className="sot-glass-card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                    <Brain className="w-4 h-4" style={{ color: 'hsl(var(--z3-accent))' }} />
                  </span>
                  Kostenlose Aktionen
                </h3>
                <ul className="space-y-2">
                  {freeActions.map((a) => (
                    <li key={a} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--z3-accent))' }} />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Credits */}
              <div className="sot-glass-card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                    <CreditCard className="w-4 h-4" style={{ color: 'hsl(var(--z3-accent))' }} />
                  </span>
                  Credit-Aktionen
                </h3>
                <ul className="space-y-3">
                  {creditCategories.map((c) => (
                    <li key={c.name} className="text-sm">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-xs font-bold" style={{ color: 'hsl(var(--z3-accent))' }}>{c.price}</span>
                      </div>
                      <p className="text-xs" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>{c.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Datenschutz */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container max-w-3xl">
          <div className={`text-center sot-fade-in ${privacyVisible ? 'visible' : ''}`} ref={privacyRef}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
              <Lock className="w-8 h-8" style={{ color: 'hsl(var(--z3-accent))' }} />
            </div>
            <h2 className="sot-headline mb-4">Ihre Daten gehören Ihnen.</h2>
            <p className="sot-subheadline mb-8">
              Kein Training mit Mandantendaten. DSGVO-konform. Gehostet auf deutschen Servern. 
              Ende-zu-Ende verschlüsselt. Armstrong arbeitet nur für Sie.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['DSGVO-konform', 'Deutsche Server', 'Kein KI-Training', 'Verschlüsselt'].map((badge) => (
                <span key={badge} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.08)', color: 'hsl(var(--z3-accent))' }}>
                  <Shield className="w-3 h-3" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SotCTA
        title="Bereit für Armstrong Intelligence?"
        subtitle="Starten Sie kostenlos — Ihre KI wartet auf Ihren Datenraum."
        variant="gradient"
      />
    </div>
  );
}
