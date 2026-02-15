/**
 * Verkaufspräsentation — 5 Slides
 */
import { TrendingUp, AlertTriangle, Zap, Search, BarChart3, MessageSquare, Rocket } from 'lucide-react';

const S = 'w-[1920px] h-[1080px] flex flex-col items-center justify-center p-24 text-white';

export function VPSlide1() {
  return (
    <div className={`${S} bg-[hsl(222,47%,6%)]`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(217,91%,60%,0.15)] to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="h-20 w-20 rounded-2xl bg-[hsl(217,91%,60%,0.2)] flex items-center justify-center">
          <TrendingUp className="h-10 w-10 text-[hsl(217,91%,60%)]" />
        </div>
        <h1 className="text-[80px] font-bold tracking-tight leading-none text-center">
          System of a Town
        </h1>
        <p className="text-[32px] text-white/60 font-light">
          Investment-Strategie für Kapitalanlage-Immobilien
        </p>
        <div className="mt-8 h-1 w-40 rounded-full bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(217,91%,60%,0.2)]" />
      </div>
    </div>
  );
}

export function VPSlide2() {
  const pains = [
    { icon: AlertTriangle, title: 'Inflation frisst Erspartes', desc: 'Tagesgeld und Festgeld verlieren real an Wert — Jahr für Jahr.' },
    { icon: AlertTriangle, title: 'Steuerlast steigt', desc: 'Ohne Strategie zahlen Gutverdiener bis zu 42% Grenzsteuersatz.' },
    { icon: AlertTriangle, title: 'Rente reicht nicht', desc: 'Die gesetzliche Rente deckt nur einen Bruchteil des Lebensstandards.' },
  ];
  return (
    <div className={`${S} bg-[hsl(222,47%,6%)]`}>
      <h2 className="text-[56px] font-bold mb-16">Warum klassische Geldanlage nicht reicht</h2>
      <div className="flex gap-12">
        {pains.map((p) => (
          <div key={p.title} className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-10 flex flex-col gap-5">
            <p.icon className="h-10 w-10 text-[hsl(0,84%,60%)]" />
            <h3 className="text-[28px] font-semibold">{p.title}</h3>
            <p className="text-[20px] text-white/60 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VPSlide3() {
  return (
    <div className={`${S} bg-[hsl(222,47%,6%)]`}>
      <div className="absolute inset-0 bg-gradient-to-tr from-[hsl(217,91%,60%,0.08)] to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-10">
        <h2 className="text-[56px] font-bold">Die Lösung: Investment Engine</h2>
        <p className="text-[28px] text-white/50 max-w-[1200px] text-center">
          Eigenkapital + zu versteuerndes Einkommen = optimiertes Ergebnis
        </p>
        <div className="mt-8 flex items-center gap-6">
          <div className="rounded-2xl bg-[hsl(217,91%,60%,0.15)] border border-[hsl(217,91%,60%,0.3)] px-12 py-8 text-center">
            <p className="text-[22px] text-white/50">Eigenkapital</p>
            <p className="text-[48px] font-bold text-[hsl(217,91%,60%)]">EK</p>
          </div>
          <Zap className="h-12 w-12 text-[hsl(217,91%,60%)]" />
          <div className="rounded-2xl bg-[hsl(217,91%,60%,0.15)] border border-[hsl(217,91%,60%,0.3)] px-12 py-8 text-center">
            <p className="text-[22px] text-white/50">zu verst. Einkommen</p>
            <p className="text-[48px] font-bold text-[hsl(217,91%,60%)]">zVE</p>
          </div>
          <span className="text-[48px] font-light text-white/30">=</span>
          <div className="rounded-2xl bg-[hsl(142,71%,45%,0.15)] border border-[hsl(142,71%,45%,0.3)] px-12 py-8 text-center">
            <p className="text-[22px] text-white/50">Ergebnis</p>
            <p className="text-[48px] font-bold text-[hsl(142,71%,45%)]">✓</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VPSlide4() {
  const steps = [
    { icon: Search, num: '01', title: 'Eingabe', desc: 'Eigenkapital und zu versteuerndes Einkommen eingeben' },
    { icon: BarChart3, num: '02', title: 'Simulation', desc: 'Sofort passende Immobilien mit Rendite-Prognose erhalten' },
    { icon: MessageSquare, num: '03', title: 'Beratung', desc: 'Persönliche Beratung durch zertifizierte Experten' },
  ];
  return (
    <div className={`${S} bg-[hsl(222,47%,6%)]`}>
      <h2 className="text-[56px] font-bold mb-16">So funktioniert's</h2>
      <div className="flex gap-10">
        {steps.map((s) => (
          <div key={s.num} className="flex-1 flex flex-col items-center gap-6 text-center">
            <span className="text-[64px] font-bold text-[hsl(217,91%,60%,0.3)]">{s.num}</span>
            <div className="h-16 w-16 rounded-2xl bg-[hsl(217,91%,60%,0.15)] flex items-center justify-center">
              <s.icon className="h-8 w-8 text-[hsl(217,91%,60%)]" />
            </div>
            <h3 className="text-[32px] font-semibold">{s.title}</h3>
            <p className="text-[20px] text-white/50 leading-relaxed max-w-[400px]">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VPSlide5() {
  return (
    <div className={`${S} bg-[hsl(222,47%,6%)]`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(217,91%,60%,0.12)] via-transparent to-[hsl(217,91%,60%,0.05)]" />
      <div className="relative z-10 flex flex-col items-center gap-10">
        <Rocket className="h-16 w-16 text-[hsl(217,91%,60%)]" />
        <h2 className="text-[64px] font-bold text-center leading-tight">
          Starten Sie jetzt<br />Ihre Simulation
        </h2>
        <p className="text-[24px] text-white/50 max-w-[800px] text-center">
          Entdecken Sie in wenigen Sekunden, welche Immobilien zu Ihrem Budget und Ihrer Steuersituation passen.
        </p>
        <div className="mt-6 px-16 py-5 rounded-2xl bg-[hsl(217,91%,60%)] text-[hsl(222,47%,6%)] text-[24px] font-semibold">
          Investment Engine starten →
        </div>
      </div>
    </div>
  );
}
