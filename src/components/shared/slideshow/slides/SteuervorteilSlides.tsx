/**
 * Steuervorteil — 6 Slides
 * Steuerlogik verständlich, seriös, ohne Versprechen.
 */
import {
  Settings, Building2, Percent, Wrench, Calculator,
  FolderOpen, FileText, Rocket,
} from 'lucide-react';

const S = 'w-[1920px] h-[1080px] flex flex-col items-center justify-center p-24 text-white relative';
const BG = 'bg-[hsl(222,47%,6%)]';
const AMBER = 'hsl(38,92%,50%)';
const PRIMARY = 'hsl(217,91%,60%)';

/* ── Slide 1 — Systemlogik ── */
export function SteuerSlide1() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(38,92%,50%,0.08)] to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-10">
        <h1 className="text-[80px] font-bold tracking-tight text-center">
          Immobilien folgen<br />wirtschaftlichen Regeln
        </h1>
        {/* Gear system */}
        <div className="relative mt-8 w-[400px] h-[200px] flex items-center justify-center">
          <div className="absolute left-0 top-0">
            <Settings className="h-24 w-24 text-white/10 animate-[spin_20s_linear_infinite]" />
          </div>
          <div className="z-10">
            <Building2 className="h-20 w-20 text-[hsl(38,92%,50%)]" />
          </div>
          <div className="absolute right-0 bottom-0">
            <Settings className="h-20 w-20 text-white/10 animate-[spin_15s_linear_infinite_reverse]" />
          </div>
        </div>
        <p className="text-[24px] text-white/40 mt-4">Steuerliche Wirkung entsteht durch Systematik.</p>
      </div>
    </div>
  );
}

/* ── Slide 2 — Relevante Faktoren ── */
export function SteuerSlide2() {
  const factors = [
    { icon: Percent, title: 'AfA', desc: 'Gebäudewert wird planmäßig abgeschrieben.' },
    { icon: Building2, title: 'Zinsen', desc: 'Darlehenszinsen mindern das zu versteuernde Einkommen.' },
    { icon: Wrench, title: 'Bewirtschaftung', desc: 'Verwaltung, Instandhaltung und Nebenkosten fließen ein.' },
  ];
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-16">Relevante Faktoren</h2>
      <div className="flex gap-10">
        {factors.map((f) => (
          <div key={f.title} className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-10 flex flex-col items-center text-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-[hsl(38,92%,50%,0.12)] border border-[hsl(38,92%,50%,0.25)] flex items-center justify-center">
              <f.icon className="h-10 w-10 text-[hsl(38,92%,50%)]" />
            </div>
            <h3 className="text-[32px] font-bold">{f.title}</h3>
            <p className="text-[22px] text-white/50 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 3 — Liquiditätswirkung ── */
export function SteuerSlide3() {
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-6">Liquiditätswirkung</h2>
      <p className="text-[24px] text-white/40 mb-16">Immobilien verändern die Einkommensstruktur.</p>
      <div className="flex gap-20 items-end h-[450px]">
        {/* Without property */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-[240px] flex flex-col rounded-t-xl overflow-hidden" style={{ height: 380 }}>
            <div className="flex-[42] bg-[hsl(0,84%,60%,0.25)] border border-[hsl(0,84%,60%,0.3)] flex items-center justify-center">
              <span className="text-[18px] text-white/60">Steueranteil</span>
            </div>
            <div className="flex-[58] bg-[hsl(142,71%,45%,0.15)] border border-[hsl(142,71%,45%,0.2)] flex items-center justify-center">
              <span className="text-[18px] text-white/60">Netto</span>
            </div>
          </div>
          <span className="text-[22px] text-white/50">Ohne Immobilie</span>
        </div>
        {/* With property */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-[240px] flex flex-col rounded-t-xl overflow-hidden" style={{ height: 380 }}>
            <div className="flex-[30] bg-[hsl(0,84%,60%,0.15)] border border-[hsl(0,84%,60%,0.2)] flex items-center justify-center">
              <span className="text-[18px] text-white/50">Steueranteil</span>
            </div>
            <div className="flex-[70] bg-[hsl(142,71%,45%,0.25)] border border-[hsl(142,71%,45%,0.3)] flex items-center justify-center">
              <span className="text-[18px] text-white/60">Netto</span>
            </div>
          </div>
          <span className="text-[22px] text-white/50">Mit Immobilie</span>
        </div>
        {/* Arrow between */}
        <div className="flex flex-col items-center gap-2 mb-[200px]">
          <span className="text-[20px] text-[hsl(142,71%,45%)]">↑ Mehr Liquidität</span>
        </div>
      </div>
    </div>
  );
}

/* ── Slide 4 — Plattformbezug ── */
export function SteuerSlide4() {
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-6">Steuerwirkung simulieren</h2>
      <p className="text-[24px] text-white/40 mb-14">Ihr Einkommen fließt direkt in die Berechnung ein.</p>
      {/* Mock Investment Engine with zVE */}
      <div className="w-[900px] rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="h-10 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[hsl(0,84%,60%)]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[hsl(38,92%,50%)]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[hsl(142,71%,45%)]" />
          <span className="ml-3 text-[12px] text-white/20">Investment Engine</span>
        </div>
        <div className="p-8 flex gap-6 items-center">
          <div className="flex-1 rounded-xl bg-white/5 border border-[hsl(38,92%,50%,0.3)] p-6 flex flex-col gap-2">
            <span className="text-[16px] text-[hsl(38,92%,50%)]">zu versteuerndes Einkommen</span>
            <div className="h-12 rounded-lg bg-[hsl(38,92%,50%,0.1)] border border-[hsl(38,92%,50%,0.2)] flex items-center px-4">
              <span className="text-[20px] text-white/30">80.000 €</span>
            </div>
          </div>
          <div className="w-[120px] h-[80px] rounded-xl bg-[hsl(38,92%,50%,0.15)] border border-[hsl(38,92%,50%,0.3)] flex items-center justify-center">
            <Calculator className="h-8 w-8 text-[hsl(38,92%,50%)]" />
          </div>
        </div>
      </div>
      <div className="flex gap-16 mt-12">
        <p className="text-[22px] text-white/50">• Einkommensdaten fließen ein</p>
        <p className="text-[22px] text-white/50">• Szenarien werden sichtbar</p>
      </div>
    </div>
  );
}

/* ── Slide 5 — Transparenz ── */
export function SteuerSlide5() {
  const folders = [
    '01_Kaufvertrag',
    '02_Finanzierung',
    '03_Steuerbescheide',
    '04_Nebenkostenabrechnung',
    '05_Mietverträge',
    '06_Versicherungen',
  ];
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-6">Dokumente sauber strukturiert</h2>
      <p className="text-[24px] text-white/40 mb-14">Transparenz schafft Vertrauen — gegenüber Steuerberater und Bank.</p>
      <div className="w-[800px] rounded-2xl border border-white/10 bg-white/5 p-10 flex flex-col gap-4">
        {folders.map((f, i) => (
          <div key={f} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
            <FolderOpen className="h-6 w-6 text-[hsl(38,92%,50%)]" />
            <span className="text-[22px] text-white/60">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 6 — CTA ── */
export function SteuerSlide6() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(38,92%,50%,0.08)] to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-10">
        <Rocket className="h-16 w-16 text-[hsl(38,92%,50%)]" />
        <h2 className="text-[72px] font-bold text-center leading-tight">
          Persönlichen Vorteil berechnen
        </h2>
        <p className="text-[26px] text-white/50 max-w-[800px] text-center">
          Sehen Sie, wie sich Ihre Einkommenssituation auf den Investitionsrahmen auswirkt.
        </p>
        <div className="mt-6 px-20 py-6 rounded-2xl bg-[hsl(38,92%,50%)] text-[hsl(222,47%,6%)] text-[28px] font-semibold">
          Simulation starten →
        </div>
        <p className="text-[16px] text-white/20 mt-8">
          Keine Steuerberatung. Simulation dient der Orientierung.
        </p>
      </div>
    </div>
  );
}
