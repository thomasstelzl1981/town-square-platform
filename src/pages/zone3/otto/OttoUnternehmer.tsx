import { Link } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';

export default function OttoUnternehmer() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs text-blue-400">
          <Building2 className="h-3.5 w-3.5" /> Für Unternehmer
        </div>
        <h1 className="mb-6 text-4xl font-bold md:text-5xl">Finanzlösungen für <span className="text-blue-400">Unternehmer</span></h1>
        <p className="mb-12 text-lg text-white/60 max-w-3xl">
          Ob Betriebsmittelkredit, Investitionsfinanzierung oder strategische Absicherung — wir begleiten Sie durch den gesamten Prozess.
        </p>
        <div className="rounded-2xl border border-blue-500/20 bg-blue-950/30 p-8 text-center">
          <Link to="/website/otto-advisory/kontakt"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-400">
            Beratung anfragen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
