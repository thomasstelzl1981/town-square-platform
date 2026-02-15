/**
 * Steuervorteil — 4 Slides
 */
import { Receipt, ArrowDown, Calculator } from 'lucide-react';

const S = 'w-[1920px] h-[1080px] flex flex-col items-center justify-center p-24 text-white';

export function SteuerSlide1() {
  return (
    <div className={`${S} bg-[hsl(222,47%,6%)]`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(38,92%,50%,0.1)] to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="h-20 w-20 rounded-2xl bg-[hsl(38,92%,50%,0.2)] flex items-center justify-center">
          <Receipt className="h-10 w-10 text-[hsl(38,92%,50%)]" />
        </div>
        <h1 className="text-[80px] font-bold tracking-tight">Steueroptimierung</h1>
        <p className="text-[28px] text-white/50">mit Immobilien</p>
      </div>
    </div>
  );
}

export function SteuerSlide2() {
  return (
    <div className={`${S} bg-[hsl(222,47%,6%)]`}>
      <h2 className="text-[56px] font-bold mb-16">AfA & Werbungskosten</h2>
      <div className="flex gap-12">
        <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-10">
          <h3 className="text-[32px] font-semibold text-[hsl(38,92%,50%)] mb-6">AfA (Abschreibung)</h3>
          <p className="text-[22px] text-white/60 leading-relaxed">
            Gebäudeanteil wird über 50 Jahre mit 2% p.a. abgeschrieben.
            Bei 200.000 € Gebäudewert = <span className="text-white font-semibold">4.000 €/Jahr</span> steuerlich absetzbar.
          </p>
        </div>
        <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-10">
          <h3 className="text-[32px] font-semibold text-[hsl(38,92%,50%)] mb-6">Werbungskosten</h3>
          <p className="text-[22px] text-white/60 leading-relaxed">
            Zinsen, Verwaltung, Fahrtkosten, Instandhaltung — alle Ausgaben rund um die Vermietung 
            mindern Ihr <span className="text-white font-semibold">zu versteuerndes Einkommen</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

export function SteuerSlide3() {
  return (
    <div className={`${S} bg-[hsl(222,47%,6%)]`}>
      <h2 className="text-[56px] font-bold mb-16">Vorher / Nachher</h2>
      <div className="flex gap-16 items-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center w-[500px]">
          <p className="text-[20px] text-white/40 mb-4">Ohne Immobilie</p>
          <p className="text-[22px] text-white/60 mb-2">zVE: 80.000 €</p>
          <p className="text-[22px] text-white/60 mb-4">Grenzsteuersatz: 42%</p>
          <div className="border-t border-white/10 pt-4">
            <p className="text-[18px] text-white/40">Steuerlast</p>
            <p className="text-[48px] font-bold text-[hsl(0,84%,60%)]">~22.000 €</p>
          </div>
        </div>
        <ArrowDown className="h-12 w-12 text-[hsl(142,71%,45%)] rotate-[-90deg]" />
        <div className="rounded-2xl border border-[hsl(142,71%,45%,0.3)] bg-[hsl(142,71%,45%,0.08)] p-12 text-center w-[500px]">
          <p className="text-[20px] text-white/40 mb-4">Mit Immobilie</p>
          <p className="text-[22px] text-white/60 mb-2">zVE: 68.000 € (−12.000 €)</p>
          <p className="text-[22px] text-white/60 mb-4">Grenzsteuersatz: 42%</p>
          <div className="border-t border-[hsl(142,71%,45%,0.2)] pt-4">
            <p className="text-[18px] text-white/40">Steuerlast</p>
            <p className="text-[48px] font-bold text-[hsl(142,71%,45%)]">~17.000 €</p>
          </div>
          <p className="text-[20px] text-[hsl(142,71%,45%)] mt-4 font-semibold">Ersparnis: ~5.000 €/Jahr</p>
        </div>
      </div>
    </div>
  );
}

export function SteuerSlide4() {
  return (
    <div className={`${S} bg-[hsl(222,47%,6%)]`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(38,92%,50%,0.08)] to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-10">
        <Calculator className="h-16 w-16 text-[hsl(38,92%,50%)]" />
        <h2 className="text-[64px] font-bold text-center leading-tight">
          Berechnen Sie Ihren<br />persönlichen Vorteil
        </h2>
        <p className="text-[24px] text-white/50 max-w-[800px] text-center">
          Mit der Investment Engine sehen Sie sofort, wie viel Steuern Sie mit einer Kapitalanlage-Immobilie sparen können.
        </p>
        <div className="mt-6 px-16 py-5 rounded-2xl bg-[hsl(38,92%,50%)] text-[hsl(222,47%,6%)] text-[24px] font-semibold">
          Simulation starten →
        </div>
      </div>
    </div>
  );
}
