/**
 * OTTO FINANZIERUNG — FutureRoom Pattern
 * Wizard-basierte Bonitätsdatenerfassung, Submit via sot-futureroom-public-submit
 * source: 'zone3_otto_advisory'
 */
import { Landmark } from 'lucide-react';

export default function OttoFinanzierung() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs text-blue-400">
          <Landmark className="h-3.5 w-3.5" /> Finanzierung
        </div>
        <h1 className="mb-6 text-4xl font-bold md:text-5xl">Finanzierung <span className="text-blue-400">beantragen</span></h1>
        <p className="mb-12 text-lg text-white/60 max-w-3xl">
          Starten Sie Ihre Finanzierungsanfrage direkt hier. Der Wizard erfasst Ihre Bonitätsdaten — 
          schnell, sicher und unverbindlich.
        </p>
        <div className="rounded-2xl border border-blue-500/20 bg-blue-950/30 p-12 text-center">
          <Landmark className="mx-auto mb-4 h-12 w-12 text-blue-400/50" />
          <p className="text-white/50 text-sm">
            Der Finanzierungs-Wizard (FutureRoom-Pattern) wird in Phase 2 integriert.
          </p>
        </div>
      </div>
    </section>
  );
}
