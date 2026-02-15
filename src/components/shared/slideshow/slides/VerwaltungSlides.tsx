/**
 * Verwaltung / Software — 7 Slides
 * Zeigen, dass Software langfristigen Erfolg absichert.
 */
import {
  Home, ClipboardCheck, LayoutDashboard, Users, FileText,
  FolderOpen, CreditCard, Bell, Calendar, Bot, CheckCircle,
  Rocket,
} from 'lucide-react';

const S = 'w-[1920px] h-[1080px] flex flex-col items-center justify-center p-24 text-white relative';
const BG = 'bg-[hsl(222,47%,6%)]';
const CYAN = 'hsl(199,89%,48%)';

/* ── Slide 1 — Wahrheit ── */
export function VerwaltungSlide1() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(199,89%,48%,0.08)] to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-12">
        <h1 className="text-[80px] font-bold tracking-tight text-center leading-tight">
          Kaufen ist einfach.<br />Verwalten entscheidet.
        </h1>
        <div className="flex gap-20 mt-8">
          <div className="flex flex-col items-center gap-4">
            <div className="h-24 w-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Home className="h-12 w-12 text-white/30" />
            </div>
            <span className="text-[20px] text-white/30">Kauf</span>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="h-24 w-24 rounded-2xl bg-[hsl(199,89%,48%,0.12)] border border-[hsl(199,89%,48%,0.3)] flex items-center justify-center">
              <ClipboardCheck className="h-12 w-12 text-[hsl(199,89%,48%)]" />
            </div>
            <span className="text-[20px] text-[hsl(199,89%,48%)]">Verwaltung</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Slide 2 — Portfolio-Übersicht ── */
export function VerwaltungSlide2() {
  const kpis = [
    { label: 'Einheiten', value: '12' },
    { label: 'Verkehrswert', value: '€2.4M' },
    { label: 'Restschuld', value: '€1.1M' },
    { label: 'Nettovermögen', value: '€1.3M' },
  ];
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-12">Portfolio-Übersicht</h2>
      {/* Mock dashboard */}
      <div className="w-[1400px] rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="h-10 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[hsl(0,84%,60%)]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[hsl(38,92%,50%)]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[hsl(142,71%,45%)]" />
          <span className="ml-3 text-[12px] text-white/20">System of a Town — Portfolio</span>
        </div>
        <div className="p-6 grid grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl bg-white/5 border border-white/10 p-6 text-center">
              <p className="text-[16px] text-white/40 mb-2">{k.label}</p>
              <p className="text-[36px] font-bold">{k.value}</p>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6 grid grid-cols-3 gap-4">
          {['Muster GmbH', 'Wohnung Berlin', 'MFH Leipzig'].map((w) => (
            <div key={w} className="rounded-xl bg-white/5 border border-white/10 h-[180px] flex flex-col items-center justify-center gap-3">
              <LayoutDashboard className="h-8 w-8 text-white/10" />
              <span className="text-[16px] text-white/20">{w}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Slide 3 — Mietsonderverwaltung ── */
export function VerwaltungSlide3() {
  const statusItems = [
    { name: 'Müller, K.', status: 'Bezahlt', color: 'hsl(142,71%,45%)' },
    { name: 'Schmidt, J.', status: 'Offen', color: 'hsl(38,92%,50%)' },
    { name: 'Weber, A.', status: 'Bezahlt', color: 'hsl(142,71%,45%)' },
    { name: 'Fischer, M.', status: 'Mahnung', color: 'hsl(0,84%,60%)' },
  ];
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-6">Digitale Mietsonderverwaltung</h2>
      <p className="text-[24px] text-white/40 mb-14">Mietstatus auf einen Blick.</p>
      <div className="flex gap-12">
        {/* Status table */}
        <div className="w-[700px] rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="grid grid-cols-3 gap-0 border-b border-white/10 p-5">
            <span className="text-[18px] text-white/40">Mieter</span>
            <span className="text-[18px] text-white/40">Monat</span>
            <span className="text-[18px] text-white/40">Status</span>
          </div>
          {statusItems.map((s) => (
            <div key={s.name} className="grid grid-cols-3 gap-0 border-b border-white/5 p-5">
              <span className="text-[20px] text-white/70">{s.name}</span>
              <span className="text-[20px] text-white/40">Feb 2026</span>
              <span className="text-[20px] font-semibold" style={{ color: s.color }}>{s.status}</span>
            </div>
          ))}
        </div>
        {/* Bullets */}
        <div className="flex flex-col gap-6 justify-center">
          {[
            { icon: CreditCard, text: 'Mieteingang' },
            { icon: Bell, text: 'Mahnwesen' },
            { icon: FileText, text: 'Dokumente' },
          ].map((b) => (
            <div key={b.text} className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[hsl(199,89%,48%,0.12)] flex items-center justify-center">
                <b.icon className="h-6 w-6 text-[hsl(199,89%,48%)]" />
              </div>
              <span className="text-[24px] text-white/60">{b.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Slide 4 — Dokumentenmanagement ── */
export function VerwaltungSlide4() {
  const tree = [
    { name: 'MOD_01_Stammdaten', depth: 0 },
    { name: 'MOD_04_Portfolio', depth: 0 },
    { name: 'Mietverträge', depth: 1 },
    { name: 'Nebenkostenabrechnungen', depth: 1 },
    { name: 'MOD_07_Finanzierung', depth: 0 },
    { name: 'MOD_08_Investments', depth: 0 },
  ];
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-6">Dokumentenmanagement</h2>
      <p className="text-[24px] text-white/40 mb-14">Ein System — alle Unterlagen.</p>
      <div className="flex gap-12">
        <div className="w-[700px] rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col gap-3">
          {tree.map((t) => (
            <div key={t.name} className="flex items-center gap-3 py-2" style={{ paddingLeft: t.depth * 28 }}>
              {t.depth === 0 ? (
                <FolderOpen className="h-6 w-6 text-[hsl(199,89%,48%)]" />
              ) : (
                <FileText className="h-5 w-5 text-[hsl(199,89%,48%,0.5)]" />
              )}
              <span className="text-[20px] text-white/60">{t.name}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6 justify-center">
          <div className="flex items-center gap-4">
            <CheckCircle className="h-6 w-6 text-[hsl(199,89%,48%)]" />
            <span className="text-[22px] text-white/60">Automatische Zuordnung</span>
          </div>
          <div className="flex items-center gap-4">
            <CheckCircle className="h-6 w-6 text-[hsl(199,89%,48%)]" />
            <span className="text-[22px] text-white/60">Digitaler Datenraum</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Slide 5 — Finanzierung im Blick ── */
export function VerwaltungSlide5() {
  const cards = [
    { label: 'Darlehen', value: '€250.000', sub: 'KfW + Hausbank' },
    { label: 'Restschuld', value: '€198.400', sub: 'Stand Feb 2026' },
    { label: 'Rate / Monat', value: '€1.180', sub: 'Zins + Tilgung' },
  ];
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-6">Finanzierung im Blick</h2>
      <p className="text-[24px] text-white/40 mb-16">Darlehen, Restschuld und Rate — immer aktuell.</p>
      <div className="flex gap-10">
        {cards.map((c) => (
          <div key={c.label} className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-10 text-center flex flex-col gap-4">
            <span className="text-[20px] text-white/40">{c.label}</span>
            <span className="text-[48px] font-bold text-[hsl(199,89%,48%)]">{c.value}</span>
            <span className="text-[18px] text-white/30">{c.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 6 — KI-Unterstützung ── */
export function VerwaltungSlide6() {
  const features = [
    { icon: Bell, title: 'Erinnerungen', desc: 'Automatisch an Fristen erinnert' },
    { icon: Calendar, title: 'Termine', desc: 'Mieterhöhungen im 36-Monats-Zyklus' },
    { icon: CheckCircle, title: 'Statusanzeige', desc: 'Jede Aufgabe auf einen Blick' },
    { icon: Bot, title: 'KI-Assistent', desc: 'Intelligente Vorschläge und Analysen' },
  ];
  return (
    <div className={`${S} ${BG}`}>
      <h2 className="text-[56px] font-bold mb-16">KI-Unterstützung</h2>
      <div className="grid grid-cols-2 gap-8">
        {features.map((f) => (
          <div key={f.title} className="flex gap-6 rounded-2xl border border-white/10 bg-white/5 p-8">
            <div className="h-14 w-14 rounded-xl bg-[hsl(199,89%,48%,0.12)] flex items-center justify-center shrink-0">
              <f.icon className="h-7 w-7 text-[hsl(199,89%,48%)]" />
            </div>
            <div>
              <h3 className="text-[28px] font-semibold mb-2">{f.title}</h3>
              <p className="text-[20px] text-white/50">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 7 — CTA ── */
export function VerwaltungSlide7() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(199,89%,48%,0.1)] via-transparent to-[hsl(199,89%,48%,0.04)]" />
      <div className="relative z-10 flex flex-col items-center gap-10">
        <Rocket className="h-16 w-16 text-[hsl(199,89%,48%)]" />
        <h2 className="text-[64px] font-bold text-center leading-tight">
          Professionell investieren.<br />Professionell verwalten.
        </h2>
        <p className="text-[26px] text-white/50 max-w-[800px] text-center">
          Verwalten Sie Ihre Immobilien digital — übersichtlich, sicher und von überall.
        </p>
        <div className="mt-6 px-20 py-6 rounded-2xl bg-[hsl(199,89%,48%)] text-[hsl(222,47%,6%)] text-[28px] font-semibold">
          Kostenlos testen →
        </div>
      </div>
    </div>
  );
}
