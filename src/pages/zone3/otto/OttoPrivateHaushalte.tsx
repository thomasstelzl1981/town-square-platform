import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';

export default function OttoPrivateHaushalte() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs text-blue-400">
          <Users className="h-3.5 w-3.5" /> Für Privathaushalte
        </div>
        <h1 className="mb-6 text-4xl font-bold md:text-5xl">Finanzen für <span className="text-blue-400">Ihre Familie</span></h1>
        <p className="mb-12 text-lg text-white/60 max-w-3xl">
          Immobilienfinanzierung, Altersvorsorge und Vermögensaufbau — maßgeschneidert auf Ihre Lebenssituation.
        </p>
        <div className="flex gap-4 flex-col sm:flex-row">
          <Link to="/website/otto-advisory/finanzierung"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-400">
            Finanzierung beantragen <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/website/otto-advisory/kontakt"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-8 py-3 text-sm text-white/70 hover:border-white/40">
            Beratung anfragen
          </Link>
        </div>
      </div>
    </section>
  );
}
