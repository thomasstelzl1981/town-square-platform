/**
 * Verkaufspräsentation — 8 Slides
 * "Investment-Strategie" — Emotionaler Einstieg → Problem → Prinzip → Plattform → CTA
 */
import {
  Wallet, Calculator, BarChart3, CheckCircle, ArrowRight,
  ShoppingBag, Search, FileText, FolderOpen, ShieldCheck,
  Rocket, Building2,
} from 'lucide-react';

const S = 'w-[1920px] h-[1080px] flex flex-col items-center justify-center p-24 text-white relative';
const BG = 'bg-[hsl(222,47%,6%)]';
const PRIMARY = 'hsl(217,91%,60%)';
const GREEN = 'hsl(142,71%,45%)';
const RED = 'hsl(0,84%,60%)';

/* ── Slide 1 — Hero ── */
export function VPSlide1() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(217,91%,60%,0.1)] to-transparent" />
      {/* Subtle building silhouette */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-end gap-3 opacity-[0.06]">
        {[280, 420, 340, 500, 380, 300, 460].map((h, i) => (
          <div key={i} className="bg-white rounded-t-md" style={{ width: 60, height: h }} />
        ))}
      </div>
      <div className="relative z-10 flex flex-col items-center gap-8">
        <h1 className="text-[88px] font-bold tracking-tight leading-none text-center">
          Sachwert schlägt Geldwert.
        </h1>
        <p className="text-[36px] text-white/50 font-light">
          Vermögensaufbau mit System.
        </p>
        <div className="mt-8 h-1 w-48 rounded-full bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(217,91%,60%,0.1)]" />
      </div>
    </div>
  );
}

/* ── Slide 2 — Das eigentliche Problem ── */
export function VPSlide2() {
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-16">Warum klassische Geldanlage limitiert ist</h2>
      <div className="flex gap-24 items-center">
        {/* Left: Bucket metaphor */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-[280px] h-[320px] rounded-b-3xl border-2 border-white/20 bg-white/5 flex flex-col items-center justify-end p-8 relative">
            <div className="absolute top-6 text-[20px] text-white/40">Nettoeinkommen</div>
            <div className="w-full h-[100px] rounded-b-2xl bg-[hsl(217,91%,60%,0.2)] flex items-center justify-center">
              <span className="text-[18px] text-white/60">Sparrate</span>
            </div>
          </div>
          <ArrowRight className="h-8 w-8 text-white/20 rotate-90" />
          <span className="text-[18px] text-white/30">begrenzt</span>
        </div>
        {/* Right: Flat growth line */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-[500px] h-[320px] rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col justify-end">
            <svg viewBox="0 0 400 200" className="w-full h-full">
              <line x1="0" y1="180" x2="400" y2="180" stroke="white" strokeOpacity="0.1" strokeWidth="1" />
              <line x1="0" y1="120" x2="400" y2="120" stroke="white" strokeOpacity="0.05" strokeWidth="1" />
              <path d="M 0 170 Q 100 165 200 155 T 400 140" stroke={PRIMARY} strokeWidth="3" fill="none" strokeOpacity="0.6" />
              <text x="360" y="135" fill="white" fillOpacity="0.3" fontSize="14">Wachstum</text>
            </svg>
          </div>
          <span className="text-[18px] text-white/30">flaches Wachstum</span>
        </div>
      </div>
      <div className="mt-12 flex gap-16">
        <p className="text-[22px] text-white/50">• Sparfähigkeit ist begrenzt</p>
        <p className="text-[22px] text-white/50">• Wachstum hängt am eigenen Netto</p>
      </div>
    </div>
  );
}

/* ── Slide 3 — Das Immobilien-Prinzip ── */
export function VPSlide3() {
  const sources = [
    { label: 'Miete', angle: -120 },
    { label: 'Steuer', angle: 0 },
    { label: 'Fremdkapital', angle: 120 },
  ];
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-6">Bei Immobilien zahlen andere mit</h2>
      <p className="text-[24px] text-white/40 mb-16">Investment lebt nicht nur vom Eigenkapital.</p>
      <div className="relative w-[600px] h-[400px] flex items-center justify-center">
        {/* Central circle */}
        <div className="w-[180px] h-[180px] rounded-full border-2 border-[hsl(217,91%,60%,0.5)] bg-[hsl(217,91%,60%,0.1)] flex items-center justify-center z-10">
          <span className="text-[28px] font-bold text-[hsl(217,91%,60%)]">Investment</span>
        </div>
        {/* Three incoming arrows */}
        {sources.map((s) => {
          const rad = (s.angle * Math.PI) / 180;
          const x = Math.cos(rad) * 220;
          const y = Math.sin(rad) * 150;
          return (
            <div
              key={s.label}
              className="absolute flex flex-col items-center gap-2"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <div className="w-[140px] h-[60px] rounded-xl border border-white/20 bg-white/5 flex items-center justify-center">
                <span className="text-[22px] text-white/70">{s.label}</span>
              </div>
            </div>
          );
        })}
        {/* Connecting lines via SVG */}
        <svg className="absolute inset-0 w-full h-full" viewBox="-300 -200 600 400">
          {sources.map((s) => {
            const rad = (s.angle * Math.PI) / 180;
            const x = Math.cos(rad) * 180;
            const y = Math.sin(rad) * 120;
            return <line key={s.label} x1={x} y1={y} x2="0" y2="0" stroke={PRIMARY} strokeWidth="2" strokeOpacity="0.3" markerEnd="url(#arrowhead)" />;
          })}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill={PRIMARY} fillOpacity="0.5" />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  );
}

/* ── Slide 4 — Die Investment Engine ── */
export function VPSlide4() {
  const steps = [
    { icon: Wallet, label: 'Eigenkapital eingeben' },
    { icon: Calculator, label: 'Einkommen prüfen' },
    { icon: BarChart3, label: 'Simulation starten' },
    { icon: CheckCircle, label: 'Investitionsrahmen sehen' },
  ];
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-6">Erst rechnen. Dann investieren.</h2>
      <p className="text-[24px] text-white/40 mb-20">Unsere Investment Engine berechnet Ihren Rahmen.</p>
      <div className="flex items-center gap-6">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-5 w-[260px]">
              <div className="w-[100px] h-[100px] rounded-2xl bg-[hsl(217,91%,60%,0.12)] border border-[hsl(217,91%,60%,0.25)] flex items-center justify-center">
                <s.icon className="h-11 w-11 text-[hsl(217,91%,60%)]" />
              </div>
              <span className="text-[20px] text-white/60 text-center leading-snug">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="h-8 w-8 text-white/20 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 5 — Zwei Wege zur Umsetzung ── */
export function VPSlide5() {
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-16">Umsetzung über unsere Plattform</h2>
      <div className="flex gap-12">
        {/* Path A: Marktplatz */}
        <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-12 flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-[hsl(217,91%,60%,0.15)] flex items-center justify-center">
              <ShoppingBag className="h-7 w-7 text-[hsl(217,91%,60%)]" />
            </div>
            <h3 className="text-[36px] font-bold">Marktplatz</h3>
          </div>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-[hsl(217,91%,60%,0.2)] flex items-center justify-center text-[14px] font-bold text-[hsl(217,91%,60%)]">1</div>
              <span className="text-[22px] text-white/60">Objekt auswählen</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-[hsl(217,91%,60%,0.2)] flex items-center justify-center text-[14px] font-bold text-[hsl(217,91%,60%)]">2</div>
              <span className="text-[22px] text-white/60">Simulation durchführen</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-[hsl(217,91%,60%,0.2)] flex items-center justify-center text-[14px] font-bold text-[hsl(217,91%,60%)]">3</div>
              <span className="text-[22px] text-white/60">Finanzierung anfragen</span>
            </div>
          </div>
        </div>
        {/* Path B: Akquisemandat */}
        <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-12 flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-[hsl(142,71%,45%,0.15)] flex items-center justify-center">
              <Search className="h-7 w-7 text-[hsl(142,71%,45%)]" />
            </div>
            <h3 className="text-[36px] font-bold">Akquisemandat</h3>
          </div>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-[hsl(142,71%,45%,0.2)] flex items-center justify-center text-[14px] font-bold text-[hsl(142,71%,45%)]">1</div>
              <span className="text-[22px] text-white/60">Suchprofil definieren</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-[hsl(142,71%,45%,0.2)] flex items-center justify-center text-[14px] font-bold text-[hsl(142,71%,45%)]">2</div>
              <span className="text-[22px] text-white/60">Individuelle Suche</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-[hsl(142,71%,45%,0.2)] flex items-center justify-center text-[14px] font-bold text-[hsl(142,71%,45%)]">3</div>
              <span className="text-[22px] text-white/60">Begleitung durch AkquiseManager</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Slide 6 — Finanzierungsbegleitung ── */
export function VPSlide6() {
  const flowSteps = [
    { label: 'Investment Engine', icon: BarChart3 },
    { label: 'Finanzierungsmanager', icon: FileText },
    { label: 'Bank', icon: Building2 },
  ];
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-6">Professionelle Struktur statt Alleingang</h2>
      <p className="text-[24px] text-white/40 mb-16">Von der Simulation bis zur Zusage — begleitet.</p>
      {/* Flow */}
      <div className="flex items-center gap-8 mb-16">
        {flowSteps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-4 w-[280px]">
              <div className="w-[90px] h-[90px] rounded-2xl bg-[hsl(217,91%,60%,0.12)] border border-[hsl(217,91%,60%,0.25)] flex items-center justify-center">
                <s.icon className="h-10 w-10 text-[hsl(217,91%,60%)]" />
              </div>
              <span className="text-[24px] font-semibold text-center">{s.label}</span>
            </div>
            {i < flowSteps.length - 1 && <ArrowRight className="h-10 w-10 text-white/20 shrink-0" />}
          </div>
        ))}
      </div>
      <div className="flex gap-12">
        <p className="text-[22px] text-white/50">• Digitale Unterlagen</p>
        <p className="text-[22px] text-white/50">• Transparenter Status</p>
        <p className="text-[22px] text-white/50">• Strukturierter Ablauf</p>
      </div>
    </div>
  );
}

/* ── Slide 7 — Sicherheit durch Struktur ── */
export function VPSlide7() {
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-6">Risiko entsteht durch Unordnung</h2>
      <p className="text-[28px] text-white/40 mb-16">— nicht durch Immobilie.</p>
      <div className="flex gap-16">
        {/* Chaos side */}
        <div className="flex-1 rounded-2xl border border-[hsl(0,84%,60%,0.3)] bg-[hsl(0,84%,60%,0.05)] p-10 flex flex-col gap-4">
          <p className="text-[24px] font-semibold text-[hsl(0,84%,60%,0.7)] mb-4">Ohne System</p>
          {['Vertrag_v3_final(2).pdf', 'Kontoauszug_scan.jpg', 'Steuer_2023_???.xlsx', 'Mietvertrag_alt_NEU.docx'].map((f) => (
            <div key={f} className="flex items-center gap-3 opacity-50">
              <FileText className="h-5 w-5 text-[hsl(0,84%,60%,0.6)]" />
              <span className="text-[18px] text-white/40 line-through">{f}</span>
            </div>
          ))}
        </div>
        {/* DMS side */}
        <div className="flex-1 rounded-2xl border border-[hsl(142,71%,45%,0.3)] bg-[hsl(142,71%,45%,0.05)] p-10 flex flex-col gap-4">
          <p className="text-[24px] font-semibold text-[hsl(142,71%,45%)] mb-4">Mit DMS</p>
          {[
            { name: '01_Kaufvertrag', indent: 0 },
            { name: '02_Finanzierung', indent: 0 },
            { name: '   Darlehensvertrag.pdf', indent: 1 },
            { name: '03_Steuern', indent: 0 },
            { name: '04_Mietverträge', indent: 0 },
          ].map((f) => (
            <div key={f.name} className="flex items-center gap-3" style={{ paddingLeft: f.indent * 24 }}>
              {f.indent === 0 ? (
                <FolderOpen className="h-5 w-5 text-[hsl(142,71%,45%)]" />
              ) : (
                <FileText className="h-5 w-5 text-[hsl(142,71%,45%,0.6)]" />
              )}
              <span className="text-[18px] text-white/70">{f.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Slide 8 — CTA ── */
export function VPSlide8() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(217,91%,60%,0.12)] via-transparent to-[hsl(217,91%,60%,0.05)]" />
      <div className="relative z-10 flex flex-col items-center gap-10">
        <Rocket className="h-16 w-16 text-[hsl(217,91%,60%)]" />
        <h2 className="text-[72px] font-bold text-center leading-tight">
          Starten Sie Ihre Simulation
        </h2>
        <p className="text-[26px] text-white/50 max-w-[800px] text-center">
          In wenigen Minuten zum Investitionsrahmen.
        </p>
        <div className="mt-6 px-20 py-6 rounded-2xl bg-[hsl(217,91%,60%)] text-[hsl(222,47%,6%)] text-[28px] font-semibold">
          Simulation starten →
        </div>
      </div>
    </div>
  );
}
