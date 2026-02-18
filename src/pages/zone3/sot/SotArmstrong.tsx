/**
 * SoT Armstrong Page — Public explanation of Armstrong AI Co-Pilot
 * Reads action data from armstrongManifest.ts (Single Source of Truth)
 */
import { Link } from 'react-router-dom';
import { Bot, Sparkles, Shield, Zap, Eye, CreditCard, ArrowRight, CheckCircle2, HelpCircle, MessageSquare } from 'lucide-react';
import { armstrongActions } from '@/manifests/armstrongManifest';
import { SotWidgetSidebar, SotWidgetBarMobile } from '@/components/zone3/sot/SotWidgetSidebar';

// Derive free/paid actions from manifest
const freeActions = armstrongActions.filter(a => a.cost_model === 'free' && a.status === 'active');
const paidActions = armstrongActions.filter(a => a.cost_model === 'metered' && a.status === 'active');

// Group paid actions by cost for display
const creditCategories = [
  { label: 'Dokument-Analyse', credits: 1, desc: 'PDF, Exposé oder Vertrag analysieren und zusammenfassen', icon: '📄' },
  { label: 'Texte & Briefe generieren', credits: 2, desc: 'Anschreiben, Kündigungen oder Mieterhöhungen formulieren', icon: '✍️' },
  { label: 'Web-Recherche mit Quellen', credits: 4, desc: 'Aktuelle Marktdaten, Vergleichswerte oder Nachrichten recherchieren', icon: '🔍' },
  { label: 'Kontaktanreicherung', credits: 2, desc: 'Firmendaten, Ansprechpartner und Kontaktdaten ergänzen', icon: '👤' },
  { label: 'Datenraum-Extraktion', credits: 1, desc: 'Pro Dokument im Bulk-Datenraum (ab 500 Docs: Rabatt)', icon: '📦' },
  { label: 'Magic Intakes', credits: '1–4', desc: 'Selbstauskunft, Immobilienakte oder Projektdaten per KI erfassen', icon: '✨' },
];

const freeFeatures = [
  'Begriffe erklären & FAQ beantworten',
  'Module erklären & durch erste Schritte führen',
  'Rendite, Tilgung & Belastung berechnen',
  'Dashboard-Widgets verwalten',
  'Navigation & How-it-Works',
  'Objekte vergleichen & erklären',
];

const steps = [
  { step: '1', title: 'Plan', desc: 'Armstrong analysiert Ihre Anfrage und erstellt einen Aktionsplan.', icon: Eye },
  { step: '2', title: 'Bestätigen', desc: 'Sie sehen jeden Schritt vorab und entscheiden, ob er ausgeführt wird.', icon: CheckCircle2 },
  { step: '3', title: 'Ausführen', desc: 'Erst nach Ihrer Freigabe wird die Aktion durchgeführt.', icon: Zap },
];

const faqs = [
  {
    q: 'Brauche ich Armstrong?',
    a: 'Nein. Alle Funktionen der Plattform sind auch ohne Armstrong nutzbar. Er ist ein optionaler Assistent, der Ihnen Zeit spart.',
  },
  {
    q: 'Wie lade ich Credits?',
    a: 'In der Plattform unter Stammdaten → Abrechnung können Sie Credit-Pakete erwerben. Credits verfallen nicht.',
  },
  {
    q: 'Kann Armstrong Fehler machen?',
    a: 'Ja — deshalb arbeitet er nach dem Prinzip Plan → Bestätigen → Ausführen. Sie behalten immer die volle Kontrolle.',
  },
];

export default function SotArmstrong() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-16 lg:space-y-20">

          {/* ═══ HERO ═══ */}
          <section className="text-center space-y-6 pt-8">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center relative">
              <Bot className="w-10 h-10 text-primary" />
              <div className="absolute inset-0 rounded-3xl bg-primary/5 animate-pulse" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Armstrong — Ihr KI-Co-Pilot
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Arbeitet für Sie. Transparent. Nur wenn Sie es wollen.
            </p>
          </section>

          {/* ═══ SEKTION 1: KOSTENLOS ═══ */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Kostenlos inklusive</h2>
                <p className="text-sm text-muted-foreground">Keine Credits nötig — einfach nutzen</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {freeFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card/50"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {freeActions.length} kostenlose Aktionen im Manifest registriert
            </p>
          </section>

          {/* ═══ SEKTION 2: MIT CREDITS ═══ */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Premium mit Credits</h2>
                <p className="text-sm text-muted-foreground">1 Credit = 0,25 € — nur bei echtem KI-Einsatz</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {creditCategories.map((cat) => (
                <div
                  key={cat.label}
                  className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                      {cat.credits} {typeof cat.credits === 'number' && cat.credits === 1 ? 'Credit' : 'Credits'}
                    </span>
                  </div>
                  <h3 className="font-semibold">{cat.label}</h3>
                  <p className="text-sm text-muted-foreground">{cat.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {paidActions.length} kostenpflichtige Aktionen verfügbar — Preise direkt aus dem Armstrong-Manifest
            </p>
          </section>

          {/* ═══ SEKTION 3: WIE ER ARBEITET ═══ */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Wie Armstrong arbeitet</h2>
                <p className="text-sm text-muted-foreground">Kein Black-Box — volle Transparenz</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {steps.map((s) => {
                const StepIcon = s.icon;
                return (
                  <div key={s.step} className="p-6 rounded-xl border border-border/50 bg-card/50 text-center space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <StepIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Schritt {s.step}
                    </div>
                    <h3 className="text-lg font-bold">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground">
              Sie sehen jeden Denkschritt live — mit der ThinkingSteps-Visualisierung verfolgen Sie, was Armstrong plant.
            </p>
          </section>

          {/* ═══ SEKTION 4: WAS IHN BESONDERS MACHT ═══ */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Was Armstrong besonders macht</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: 'Kein Abo', desc: 'Keine monatlichen Gebühren. Credits kaufen Sie nur, wenn Sie sie brauchen.' },
                { title: 'Multi-Modul', desc: 'Arbeitet überall: Immobilien, Finanzen, DMS, Kontakte, Projekte.' },
                { title: 'Datenschutz', desc: 'Ihre Daten bleiben bei Ihnen. Kein Training mit Mandantendaten.' },
                { title: 'Faire Abrechnung', desc: 'Credits nur bei echtem KI-Einsatz. Erklärungen und Navigation sind immer kostenlos.' },
              ].map((item) => (
                <div key={item.title} className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-2">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ SEKTION 5: FAQ ═══ */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Häufige Fragen</h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q} className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    {faq.q}
                  </h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ CTA ═══ */}
          <section className="text-center space-y-4 pb-8">
            <h2 className="text-2xl font-bold">Bereit, Armstrong kennenzulernen?</h2>
            <p className="text-muted-foreground">Registrieren Sie sich kostenfrei und testen Sie Armstrong sofort.</p>
            <Link
              to="/auth?mode=register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Jetzt kostenfrei starten
              <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        </div>

        {/* Sidebar */}
        <SotWidgetSidebar />
      </div>
      <SotWidgetBarMobile />
    </div>
  );
}
