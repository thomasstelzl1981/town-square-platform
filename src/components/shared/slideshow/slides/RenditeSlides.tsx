/**
 * Rendite erklärt — 7 Slides
 * Rendite verständlich machen — ohne Prozentversprechen.
 */
import {
  TrendingUp, BarChart3, ArrowRight, Calculator, Shield, Rocket,
} from 'lucide-react';

const S = 'w-[1920px] h-[1080px] flex flex-col items-center justify-center p-24 text-white relative';
const BG = 'bg-[hsl(222,47%,6%)]';
const GREEN = 'hsl(142,71%,45%)';
const PRIMARY = 'hsl(217,91%,60%)';

/* ── Slide 1 — Frame ändern ── */
export function RenditeSlide1() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(142,71%,45%,0.1)] to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="flex items-end gap-6">
          <span className="text-[120px] font-bold leading-none tracking-tight">Vermögensbasis</span>
          <span className="text-[48px] text-white/20 font-light mb-4">%</span>
        </div>
        <div className="h-1 w-32 rounded-full bg-gradient-to-r from-[hsl(142,71%,45%)] to-transparent mt-4" />
        <p className="text-[32px] text-white/40 mt-6">Rendite ist Vermögenswirkung.</p>
      </div>
    </div>
  );
}

/* ── Slide 2 — Sparplan vs. Immobilie ── */
export function RenditeSlide2() {
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-20">Sparplan vs. Immobilie</h2>
      <div className="flex gap-24 items-end h-[500px]">
        {/* Left: Single bar */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-[200px] rounded-t-xl bg-[hsl(217,91%,60%,0.3)] border border-[hsl(217,91%,60%,0.4)]" style={{ height: 180 }}>
            <div className="h-full flex items-center justify-center">
              <span className="text-[20px] text-white/60">Eigenleistung</span>
            </div>
          </div>
          <span className="text-[24px] text-white/50">Sparplan</span>
        </div>
        {/* Right: Stacked bar */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-[200px] flex flex-col rounded-t-xl overflow-hidden" style={{ height: 420 }}>
            <div className="flex-[2] bg-[hsl(38,92%,50%,0.25)] border border-[hsl(38,92%,50%,0.3)] flex items-center justify-center">
              <span className="text-[18px] text-white/60">Mietstrom</span>
            </div>
            <div className="flex-[4] bg-[hsl(217,91%,60%,0.2)] border-x border-[hsl(217,91%,60%,0.3)] flex items-center justify-center">
              <span className="text-[18px] text-white/60">Fremdkapital</span>
            </div>
            <div className="flex-[2] bg-[hsl(142,71%,45%,0.25)] border border-[hsl(142,71%,45%,0.3)] flex items-center justify-center">
              <span className="text-[18px] text-white/60">Eigenkapital</span>
            </div>
          </div>
          <span className="text-[24px] text-white/50">Immobilie</span>
        </div>
      </div>
    </div>
  );
}

/* ── Slide 3 — Hebel-Effekt ── */
export function RenditeSlide3() {
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-16">Der Hebel-Effekt</h2>
      <div className="flex items-end gap-4">
        {/* Small EK block */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-[160px] h-[120px] rounded-xl border-2 border-[hsl(217,91%,60%,0.5)] bg-[hsl(217,91%,60%,0.15)] flex items-center justify-center">
            <span className="text-[28px] font-bold text-[hsl(217,91%,60%)]">EK</span>
          </div>
        </div>
        {/* Lever visual */}
        <div className="flex flex-col items-center mx-8">
          <svg width="120" height="80" viewBox="0 0 120 80">
            <line x1="10" y1="70" x2="110" y2="30" stroke="white" strokeOpacity="0.3" strokeWidth="3" />
            <circle cx="60" cy="50" r="6" fill={PRIMARY} fillOpacity="0.5" />
            <polygon points="55,72 65,72 60,62" fill="white" fillOpacity="0.2" />
          </svg>
        </div>
        {/* Large Objektwert block */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-[400px] h-[320px] rounded-xl border-2 border-[hsl(142,71%,45%,0.4)] bg-[hsl(142,71%,45%,0.08)] flex items-center justify-center">
            <span className="text-[36px] font-bold text-[hsl(142,71%,45%)]">Objektwert</span>
          </div>
        </div>
      </div>
      <p className="text-[24px] text-white/40 mt-16 max-w-[800px] text-center">
        Kleiner Einsatz — große Wirkung. Fremdkapital multipliziert die Vermögensbasis.
      </p>
    </div>
  );
}

/* ── Slide 4 — Zeitfaktor ── */
export function RenditeSlide4() {
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-16">Der Zeitfaktor</h2>
      <div className="w-[1200px] h-[500px] rounded-2xl border border-white/10 bg-white/[0.03] p-10">
        <svg viewBox="0 0 1000 400" className="w-full h-full">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1="0" y1={i * 100} x2="1000" y2={i * 100} stroke="white" strokeOpacity="0.05" />
          ))}
          {/* Sparplan — flat */}
          <path d="M 0 350 Q 250 340 500 310 T 1000 260" stroke="white" strokeOpacity="0.25" strokeWidth="3" fill="none" strokeDasharray="8 4" />
          <text x="950" y="250" fill="white" fillOpacity="0.3" fontSize="16" textAnchor="end">Sparplan</text>
          {/* Immobilie — steeper */}
          <path d="M 0 350 Q 250 300 500 200 T 1000 40" stroke={GREEN} strokeWidth="3" fill="none" />
          <text x="950" y="30" fill={GREEN} fontSize="16" textAnchor="end">Immobilie</text>
          {/* Time axis */}
          <text x="0" y="390" fill="white" fillOpacity="0.3" fontSize="14">Heute</text>
          <text x="950" y="390" fill="white" fillOpacity="0.3" fontSize="14" textAnchor="end">Zeit →</text>
        </svg>
      </div>
      <p className="text-[20px] text-white/30 mt-6">Schematische Darstellung — keine konkreten Werte</p>
    </div>
  );
}

/* ── Slide 5 — Plattformbezug: Simulation ── */
export function RenditeSlide5() {
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-6">Simulation statt Bauchgefühl</h2>
      <p className="text-[24px] text-white/40 mb-14">Die Investment Engine macht Szenarien sichtbar.</p>
      {/* Mock UI */}
      <div className="w-[1100px] rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="h-10 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[hsl(0,84%,60%)]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[hsl(38,92%,50%)]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[hsl(142,71%,45%)]" />
          <span className="ml-3 text-[12px] text-white/20">Investment Engine</span>
        </div>
        <div className="p-8 flex gap-6">
          <div className="flex-1 rounded-xl bg-white/5 border border-white/10 p-6 flex flex-col gap-3">
            <span className="text-[16px] text-white/30">Eigenkapital</span>
            <div className="h-10 rounded-lg bg-white/10 border border-white/10" />
          </div>
          <div className="flex-1 rounded-xl bg-white/5 border border-white/10 p-6 flex flex-col gap-3">
            <span className="text-[16px] text-white/30">zu verst. Einkommen</span>
            <div className="h-10 rounded-lg bg-white/10 border border-white/10" />
          </div>
          <div className="w-[140px] rounded-xl bg-[hsl(217,91%,60%,0.2)] border border-[hsl(217,91%,60%,0.3)] flex items-center justify-center">
            <Calculator className="h-8 w-8 text-[hsl(217,91%,60%)]" />
          </div>
        </div>
      </div>
      <div className="flex gap-16 mt-12">
        <p className="text-[22px] text-white/50">• Szenarien vergleichen</p>
        <p className="text-[22px] text-white/50">• Varianten berechnen</p>
        <p className="text-[22px] text-white/50">• Belastung prüfen</p>
      </div>
    </div>
  );
}

/* ── Slide 6 — Stabilität durch Puffer ── */
export function RenditeSlide6() {
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-6">Stabilität durch Puffer</h2>
      <p className="text-[24px] text-white/40 mb-16">Puffer ist Teil der Berechnung — nicht Zufall.</p>
      <div className="flex items-center gap-10">
        <div className="relative w-[500px] h-[300px] flex items-center justify-center">
          {/* Outer zone (safety) */}
          <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-[hsl(142,71%,45%,0.3)] bg-[hsl(142,71%,45%,0.05)] flex items-start justify-center pt-5">
            <span className="text-[16px] text-[hsl(142,71%,45%,0.6)]">Sicherheitszone</span>
          </div>
          {/* Inner core (rate) */}
          <div className="w-[300px] h-[160px] rounded-xl border border-white/20 bg-white/5 flex items-center justify-center z-10">
            <div className="text-center">
              <p className="text-[18px] text-white/40">Monatliche Rate</p>
              <p className="text-[36px] font-bold">Rate</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 max-w-[500px]">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-[hsl(142,71%,45%)]" />
            <span className="text-[22px] text-white/60">Rücklagen einberechnet</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-[hsl(142,71%,45%)]" />
            <span className="text-[22px] text-white/60">Leerstandsrisiko berücksichtigt</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-[hsl(142,71%,45%)]" />
            <span className="text-[22px] text-white/60">Konservative Kalkulation</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Slide 7 — CTA ── */
export function RenditeSlide7() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(142,71%,45%,0.1)] via-transparent to-[hsl(142,71%,45%,0.04)]" />
      <div className="relative z-10 flex flex-col items-center gap-10">
        <Rocket className="h-16 w-16 text-[hsl(142,71%,45%)]" />
        <h2 className="text-[72px] font-bold text-center leading-tight">
          Berechnen Sie Ihren Rahmen
        </h2>
        <p className="text-[26px] text-white/50 max-w-[800px] text-center">
          Verstehen Sie Ihre Möglichkeiten — datenbasiert und transparent.
        </p>
        <div className="mt-6 px-20 py-6 rounded-2xl bg-[hsl(142,71%,45%)] text-[hsl(222,47%,6%)] text-[28px] font-semibold">
          Simulation starten →
        </div>
      </div>
    </div>
  );
}
