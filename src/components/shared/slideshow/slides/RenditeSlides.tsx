/**
 * Rendite erklärt — 4 Slides
 */
import { TrendingUp, ArrowUpRight } from 'lucide-react';

const S = 'w-[1920px] h-[1080px] flex flex-col items-center justify-center p-24 text-white';

export function RenditeSlide1() {
  return (
    <div className={`${S} bg-[hsl(222,47%,6%)]`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(142,71%,45%,0.1)] to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="h-20 w-20 rounded-2xl bg-[hsl(142,71%,45%,0.2)] flex items-center justify-center">
          <TrendingUp className="h-10 w-10 text-[hsl(142,71%,45%)]" />
        </div>
        <h1 className="text-[80px] font-bold tracking-tight">Rendite mit Immobilien</h1>
        <p className="text-[28px] text-white/50">So funktioniert Ihre Kapitalanlage</p>
      </div>
    </div>
  );
}

export function RenditeSlide2() {
  const bars = [
    { label: 'Tagesgeld', value: 2.5, color: 'hsl(0,0%,40%)' },
    { label: 'Festgeld', value: 3.2, color: 'hsl(0,0%,50%)' },
    { label: 'ETF (Ø)', value: 7, color: 'hsl(38,92%,50%)' },
    { label: 'Immobilie', value: 12, color: 'hsl(217,91%,60%)' },
  ];
  const max = 14;
  return (
    <div className={`${S} bg-[hsl(222,47%,6%)]`}>
      <h2 className="text-[56px] font-bold mb-16">Vergleich: Anlageformen</h2>
      <div className="flex items-end gap-12 h-[500px]">
        {bars.map((b) => (
          <div key={b.label} className="flex flex-col items-center gap-4">
            <span className="text-[24px] font-bold">{b.value}%</span>
            <div
              className="w-[140px] rounded-t-xl transition-all"
              style={{ height: `${(b.value / max) * 400}px`, backgroundColor: b.color }}
            />
            <span className="text-[20px] text-white/60">{b.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-10 text-[18px] text-white/30">*Eigenkapitalrendite inkl. Hebel, Durchschnittswerte</p>
    </div>
  );
}

export function RenditeSlide3() {
  return (
    <div className={`${S} bg-[hsl(222,47%,6%)]`}>
      <h2 className="text-[56px] font-bold mb-12">Der Hebel-Effekt</h2>
      <p className="text-[24px] text-white/50 mb-16 max-w-[1000px] text-center">
        Fremdkapital als Rendite-Turbo: Sie investieren 50.000 €, die Bank finanziert 200.000 €.
      </p>
      <div className="flex gap-12 items-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center w-[350px]">
          <p className="text-[20px] text-white/40 mb-2">Eigenkapital</p>
          <p className="text-[48px] font-bold">50.000 €</p>
        </div>
        <ArrowUpRight className="h-12 w-12 text-[hsl(217,91%,60%)]" />
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center w-[350px]">
          <p className="text-[20px] text-white/40 mb-2">Kaufpreis</p>
          <p className="text-[48px] font-bold">250.000 €</p>
        </div>
        <ArrowUpRight className="h-12 w-12 text-[hsl(142,71%,45%)]" />
        <div className="rounded-2xl border border-[hsl(142,71%,45%,0.3)] bg-[hsl(142,71%,45%,0.1)] p-10 text-center w-[350px]">
          <p className="text-[20px] text-white/40 mb-2">EK-Rendite p.a.</p>
          <p className="text-[48px] font-bold text-[hsl(142,71%,45%)]">12,4%</p>
        </div>
      </div>
    </div>
  );
}

export function RenditeSlide4() {
  return (
    <div className={`${S} bg-[hsl(222,47%,6%)]`}>
      <div className="absolute inset-0 bg-gradient-to-tr from-[hsl(217,91%,60%,0.08)] to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-10">
        <h2 className="text-[56px] font-bold">Beispielrechnung</h2>
        <div className="grid grid-cols-2 gap-8 mt-6">
          {[
            ['Kaufpreis', '250.000 €'],
            ['Eigenkapital', '50.000 €'],
            ['Mieteinnahmen/Jahr', '12.000 €'],
            ['Kreditrate/Jahr', '8.400 €'],
            ['Überschuss/Jahr', '3.600 €'],
            ['EK-Rendite', '12,4% p.a.'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-16 border-b border-white/10 pb-4">
              <span className="text-[24px] text-white/50">{k}</span>
              <span className="text-[24px] font-semibold">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
