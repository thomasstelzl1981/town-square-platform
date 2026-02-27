import { Link } from 'react-router-dom';
import { ArrowRight, Wallet, Building2, Users } from 'lucide-react';

export default function OttoHome() {
  return (
    <>
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/40 via-slate-950 to-slate-950" />
        <div className="relative z-10 max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs text-blue-400">
            <Wallet className="h-3.5 w-3.5" /> Ganzheitliche Finanzberatung
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight md:text-7xl">
            Otto²<span className="text-blue-400">Advisory</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/60">
            Finanzberatung für Unternehmer und Privathaushalte. Finanzierung, Vorsorge und Vermögensaufbau — alles aus einer Hand.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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

      <section className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <Link to="/website/otto-advisory/unternehmer"
            className="group rounded-2xl border border-blue-900/30 bg-blue-950/20 p-8 transition-all hover:border-blue-500/40">
            <Building2 className="mb-4 h-8 w-8 text-blue-400" />
            <h2 className="mb-3 text-2xl font-bold">Für Unternehmer</h2>
            <p className="text-sm text-white/50">Finanzierung, Absicherung und strategische Beratung für Ihr Unternehmen.</p>
          </Link>
          <Link to="/website/otto-advisory/private-haushalte"
            className="group rounded-2xl border border-blue-900/30 bg-blue-950/20 p-8 transition-all hover:border-blue-500/40">
            <Users className="mb-4 h-8 w-8 text-blue-400" />
            <h2 className="mb-3 text-2xl font-bold">Für Privathaushalte</h2>
            <p className="text-sm text-white/50">Immobilienfinanzierung, Vorsorge und Vermögensaufbau für Ihre Familie.</p>
          </Link>
        </div>
      </section>
    </>
  );
}
