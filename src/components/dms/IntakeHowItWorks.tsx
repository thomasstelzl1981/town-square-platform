/**
 * IntakeHowItWorks — Premium Hero section for the Magic Intake Center.
 * Replaces the old 3-card layout with value propositions + horizontal process flow.
 */

import { Sparkles, FileSearch, Upload, Zap, ArrowRight } from 'lucide-react';

const VALUE_PROPS = [
  {
    icon: FileSearch,
    title: 'Kein manuelles Abtippen',
    description: 'Armstrong liest Ihre Dokumente und befüllt automatisch alle relevanten Felder.',
  },
  {
    icon: Sparkles,
    title: 'Alle Kategorien',
    description: 'Immobilie, Fahrzeug, Finanzierung, PV-Anlage, Versicherung und mehr.',
  },
  {
    icon: Zap,
    title: 'Volle Kostenkontrolle',
    description: 'Sie sehen vorher, was es kostet — 1 Credit pro Dokument (0,25 €).',
  },
];

const PROCESS_STEPS = [
  { step: '1', label: 'Kategorie wählen', sublabel: 'Was möchten Sie einlesen?' },
  { step: '2', label: 'Dokument hochladen', sublabel: 'PDF, Bild, Word oder Excel' },
  { step: '3', label: 'KI analysiert', sublabel: 'Armstrong extrahiert alle Daten' },
  { step: '4', label: 'Felder befüllt', sublabel: 'Prüfen, bestätigen, fertig' },
];

export function IntakeHowItWorks() {
  return (
    <div className="space-y-8">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-8 md:p-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            KI-gestützte Dokumentenanalyse
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Dokumente hochladen.<br />
            <span className="text-primary">Armstrong erledigt den Rest.</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl">
            Laden Sie Ihre Unterlagen hoch — Grundbuchauszüge, Fahrzeugscheine, Versicherungspolicen oder 
            Gehaltsabrechnungen. Unsere KI erkennt automatisch alle relevanten Daten und befüllt Ihre 
            digitale Akte in Sekunden.
          </p>
        </div>
      </div>

      {/* ── Value Propositions ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {VALUE_PROPS.map((vp) => (
          <div
            key={vp.title}
            className="p-5 rounded-xl border border-border/50 bg-card hover:bg-accent/50 transition-colors space-y-2"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <vp.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">{vp.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{vp.description}</p>
          </div>
        ))}
      </div>

      {/* ── Horizontal Process Flow ── */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          So funktioniert's
        </p>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-0">
          {PROCESS_STEPS.map((ps, idx) => (
            <div key={ps.step} className="flex items-center gap-3 md:flex-1">
              <div className="flex items-center gap-3 flex-1">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {ps.step}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{ps.label}</p>
                  <p className="text-[11px] text-muted-foreground">{ps.sublabel}</p>
                </div>
              </div>
              {idx < PROCESS_STEPS.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 hidden md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
