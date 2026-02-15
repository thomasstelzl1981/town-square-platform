/**
 * Verwaltung / Software — 4 Slides
 */
import { Monitor, LayoutDashboard, FileText, Users, Calculator, Rocket } from 'lucide-react';

const S = 'w-[1920px] h-[1080px] flex flex-col items-center justify-center p-24 text-white';

export function VerwaltungSlide1() {
  return (
    <div className={`${S} bg-[hsl(222,47%,6%)]`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(199,89%,48%,0.1)] to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="h-20 w-20 rounded-2xl bg-[hsl(199,89%,48%,0.2)] flex items-center justify-center">
          <Monitor className="h-10 w-10 text-[hsl(199,89%,48%)]" />
        </div>
        <h1 className="text-[80px] font-bold tracking-tight">Ihre Immobilien</h1>
        <p className="text-[28px] text-white/50">digital verwaltet</p>
      </div>
    </div>
  );
}

export function VerwaltungSlide2() {
  const features = [
    { icon: LayoutDashboard, title: 'Portfolio', desc: 'Alle Immobilien auf einen Blick — Werte, Renditen, Entwicklung' },
    { icon: FileText, title: 'DMS', desc: 'Verträge, Abrechnungen und Dokumente zentral und sicher verwaltet' },
    { icon: Users, title: 'Mieter', desc: 'Mieterlisten, Kommunikation und Zahlungseingänge automatisiert' },
    { icon: Calculator, title: 'Buchhaltung', desc: 'Einnahmen, Ausgaben und Steuervorbereitung in einem System' },
  ];
  return (
    <div className={`${S} bg-[hsl(222,47%,6%)]`}>
      <h2 className="text-[56px] font-bold mb-16">Feature-Überblick</h2>
      <div className="grid grid-cols-2 gap-8">
        {features.map((f) => (
          <div key={f.title} className="flex gap-6 rounded-2xl border border-white/10 bg-white/5 p-8">
            <div className="h-14 w-14 rounded-xl bg-[hsl(199,89%,48%,0.15)] flex items-center justify-center shrink-0">
              <f.icon className="h-7 w-7 text-[hsl(199,89%,48%)]" />
            </div>
            <div>
              <h3 className="text-[28px] font-semibold mb-2">{f.title}</h3>
              <p className="text-[20px] text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VerwaltungSlide3() {
  return (
    <div className={`${S} bg-[hsl(222,47%,6%)]`}>
      <h2 className="text-[56px] font-bold mb-12">Dashboard-Ansicht</h2>
      {/* Mockup Dashboard */}
      <div className="w-[1400px] h-[700px] rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="h-12 bg-white/5 border-b border-white/10 flex items-center gap-2 px-4">
          <div className="h-3 w-3 rounded-full bg-[hsl(0,84%,60%)]" />
          <div className="h-3 w-3 rounded-full bg-[hsl(38,92%,50%)]" />
          <div className="h-3 w-3 rounded-full bg-[hsl(142,71%,45%)]" />
          <span className="ml-4 text-[14px] text-white/30">System of a Town — Portal</span>
        </div>
        <div className="p-8 grid grid-cols-4 gap-4">
          {['12 Einheiten', '€2.4M Wert', '€1.1M Schuld', '€1.3M Netto'].map((kpi) => (
            <div key={kpi} className="rounded-xl bg-white/5 border border-white/10 p-6 text-center">
              <p className="text-[18px] text-white/40 mb-1">{kpi.split(' ')[1]}</p>
              <p className="text-[28px] font-bold">{kpi.split(' ')[0]}</p>
            </div>
          ))}
        </div>
        <div className="px-8 grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white/5 border border-white/10 h-[280px] flex items-center justify-center">
              <LayoutDashboard className="h-12 w-12 text-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VerwaltungSlide4() {
  return (
    <div className={`${S} bg-[hsl(222,47%,6%)]`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(199,89%,48%,0.1)] to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-10">
        <Rocket className="h-16 w-16 text-[hsl(199,89%,48%)]" />
        <h2 className="text-[64px] font-bold text-center leading-tight">
          Jetzt kostenlos testen
        </h2>
        <p className="text-[24px] text-white/50 max-w-[800px] text-center">
          Verwalten Sie Ihre Immobilien digital — übersichtlich, sicher und von überall.
        </p>
        <div className="mt-6 px-16 py-5 rounded-2xl bg-[hsl(199,89%,48%)] text-[hsl(222,47%,6%)] text-[24px] font-semibold">
          Kostenlos starten →
        </div>
      </div>
    </div>
  );
}
