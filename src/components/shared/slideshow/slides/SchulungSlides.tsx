/**
 * Schulungs-Slides — 4 Module zur Ausbildung von Kapitalanlageberatern
 * 
 * Modul 1: Verkaufsleitfaden (7 Slides)
 * Modul 2: Fachwissen Kapitalanlage (7 Slides)
 * Modul 3: Gesprächsleitfaden (6 Slides)
 * Modul 4: Plattform-Schulung (7 Slides)
 * 
 * Amber/Orange-Akzente zur visuellen Abgrenzung von Kunden-Präsentationen.
 * Inhalt wird zu einem späteren Zeitpunkt ergänzt.
 */

const S = 'w-[1920px] h-[1080px] flex flex-col items-center justify-center p-24 text-white relative';
const BG = 'bg-[hsl(222,47%,6%)]';
const AMBER = 'hsl(38,92%,50%)';
const AMBER_DIM = 'hsl(38,92%,50%,0.15)';
const AMBER_BORDER = 'hsl(38,92%,50%,0.25)';

/* ═══════════════════════════════════════════════
   MODUL 1 — Verkaufsleitfaden (7 Slides)
   ═══════════════════════════════════════════════ */

export function SchulungVerkauf1() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(38,92%,50%,0.08)] to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="px-6 py-2 rounded-full border border-[hsl(38,92%,50%,0.3)] bg-[hsl(38,92%,50%,0.1)] text-[hsl(38,92%,50%)] text-[20px] font-medium mb-4">
          Modul 1 — Schulung
        </div>
        <h1 className="text-[80px] font-bold tracking-tight leading-none text-center">
          Verkaufsleitfaden
        </h1>
        <p className="text-[32px] text-white/40 font-light">
          Gesprächsführung · Einwandbehandlung · Abschluss
        </p>
        <div className="mt-8 h-1 w-48 rounded-full bg-gradient-to-r from-[hsl(38,92%,50%)] to-[hsl(38,92%,50%,0.1)]" />
      </div>
    </div>
  );
}

export function SchulungVerkauf2() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(38,92%,50%,0.3)] bg-[hsl(38,92%,50%,0.1)] text-[hsl(38,92%,50%)] text-[18px] font-medium mb-12 self-start">
        Modul 1 · Slide 2
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zum Verkaufsleitfaden befüllt.
      </p>
    </div>
  );
}

export function SchulungVerkauf3() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(38,92%,50%,0.3)] bg-[hsl(38,92%,50%,0.1)] text-[hsl(38,92%,50%)] text-[18px] font-medium mb-12 self-start">
        Modul 1 · Slide 3
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zum Verkaufsleitfaden befüllt.
      </p>
    </div>
  );
}

export function SchulungVerkauf4() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(38,92%,50%,0.3)] bg-[hsl(38,92%,50%,0.1)] text-[hsl(38,92%,50%)] text-[18px] font-medium mb-12 self-start">
        Modul 1 · Slide 4
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zum Verkaufsleitfaden befüllt.
      </p>
    </div>
  );
}

export function SchulungVerkauf5() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(38,92%,50%,0.3)] bg-[hsl(38,92%,50%,0.1)] text-[hsl(38,92%,50%)] text-[18px] font-medium mb-12 self-start">
        Modul 1 · Slide 5
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zum Verkaufsleitfaden befüllt.
      </p>
    </div>
  );
}

export function SchulungVerkauf6() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(38,92%,50%,0.3)] bg-[hsl(38,92%,50%,0.1)] text-[hsl(38,92%,50%)] text-[18px] font-medium mb-12 self-start">
        Modul 1 · Slide 6
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zum Verkaufsleitfaden befüllt.
      </p>
    </div>
  );
}

export function SchulungVerkauf7() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(38,92%,50%,0.3)] bg-[hsl(38,92%,50%,0.1)] text-[hsl(38,92%,50%)] text-[18px] font-medium mb-12 self-start">
        Modul 1 · Slide 7
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zum Verkaufsleitfaden befüllt.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MODUL 2 — Fachwissen Kapitalanlage (7 Slides)
   ═══════════════════════════════════════════════ */

export function SchulungFachwissen1() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(25,95%,53%,0.08)] to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="px-6 py-2 rounded-full border border-[hsl(25,95%,53%,0.3)] bg-[hsl(25,95%,53%,0.1)] text-[hsl(25,95%,53%)] text-[20px] font-medium mb-4">
          Modul 2 — Schulung
        </div>
        <h1 className="text-[80px] font-bold tracking-tight leading-none text-center">
          Fachwissen Kapitalanlage
        </h1>
        <p className="text-[32px] text-white/40 font-light">
          AfA · Hebelwirkung · Finanzierung · Steuervorteile
        </p>
        <div className="mt-8 h-1 w-48 rounded-full bg-gradient-to-r from-[hsl(25,95%,53%)] to-[hsl(25,95%,53%,0.1)]" />
      </div>
    </div>
  );
}

export function SchulungFachwissen2() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(25,95%,53%,0.3)] bg-[hsl(25,95%,53%,0.1)] text-[hsl(25,95%,53%)] text-[18px] font-medium mb-12 self-start">
        Modul 2 · Slide 2
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zum Fachwissen Kapitalanlage befüllt.
      </p>
    </div>
  );
}

export function SchulungFachwissen3() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(25,95%,53%,0.3)] bg-[hsl(25,95%,53%,0.1)] text-[hsl(25,95%,53%)] text-[18px] font-medium mb-12 self-start">
        Modul 2 · Slide 3
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zum Fachwissen Kapitalanlage befüllt.
      </p>
    </div>
  );
}

export function SchulungFachwissen4() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(25,95%,53%,0.3)] bg-[hsl(25,95%,53%,0.1)] text-[hsl(25,95%,53%)] text-[18px] font-medium mb-12 self-start">
        Modul 2 · Slide 4
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zum Fachwissen Kapitalanlage befüllt.
      </p>
    </div>
  );
}

export function SchulungFachwissen5() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(25,95%,53%,0.3)] bg-[hsl(25,95%,53%,0.1)] text-[hsl(25,95%,53%)] text-[18px] font-medium mb-12 self-start">
        Modul 2 · Slide 5
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zum Fachwissen Kapitalanlage befüllt.
      </p>
    </div>
  );
}

export function SchulungFachwissen6() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(25,95%,53%,0.3)] bg-[hsl(25,95%,53%,0.1)] text-[hsl(25,95%,53%)] text-[18px] font-medium mb-12 self-start">
        Modul 2 · Slide 6
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zum Fachwissen Kapitalanlage befüllt.
      </p>
    </div>
  );
}

export function SchulungFachwissen7() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(25,95%,53%,0.3)] bg-[hsl(25,95%,53%,0.1)] text-[hsl(25,95%,53%)] text-[18px] font-medium mb-12 self-start">
        Modul 2 · Slide 7
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zum Fachwissen Kapitalanlage befüllt.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MODUL 3 — Gesprächsleitfaden (6 Slides)
   ═══════════════════════════════════════════════ */

export function SchulungGespraech1() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(280,67%,55%,0.08)] to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="px-6 py-2 rounded-full border border-[hsl(280,67%,55%,0.3)] bg-[hsl(280,67%,55%,0.1)] text-[hsl(280,67%,55%)] text-[20px] font-medium mb-4">
          Modul 3 — Schulung
        </div>
        <h1 className="text-[80px] font-bold tracking-tight leading-none text-center">
          Gesprächsleitfaden
        </h1>
        <p className="text-[32px] text-white/40 font-light">
          Bedarfsanalyse · Fragetechniken · Gesprächsabläufe
        </p>
        <div className="mt-8 h-1 w-48 rounded-full bg-gradient-to-r from-[hsl(280,67%,55%)] to-[hsl(280,67%,55%,0.1)]" />
      </div>
    </div>
  );
}

export function SchulungGespraech2() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(280,67%,55%,0.3)] bg-[hsl(280,67%,55%,0.1)] text-[hsl(280,67%,55%)] text-[18px] font-medium mb-12 self-start">
        Modul 3 · Slide 2
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zum Gesprächsleitfaden befüllt.
      </p>
    </div>
  );
}

export function SchulungGespraech3() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(280,67%,55%,0.3)] bg-[hsl(280,67%,55%,0.1)] text-[hsl(280,67%,55%)] text-[18px] font-medium mb-12 self-start">
        Modul 3 · Slide 3
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zum Gesprächsleitfaden befüllt.
      </p>
    </div>
  );
}

export function SchulungGespraech4() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(280,67%,55%,0.3)] bg-[hsl(280,67%,55%,0.1)] text-[hsl(280,67%,55%)] text-[18px] font-medium mb-12 self-start">
        Modul 3 · Slide 4
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zum Gesprächsleitfaden befüllt.
      </p>
    </div>
  );
}

export function SchulungGespraech5() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(280,67%,55%,0.3)] bg-[hsl(280,67%,55%,0.1)] text-[hsl(280,67%,55%)] text-[18px] font-medium mb-12 self-start">
        Modul 3 · Slide 5
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zum Gesprächsleitfaden befüllt.
      </p>
    </div>
  );
}

export function SchulungGespraech6() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(280,67%,55%,0.3)] bg-[hsl(280,67%,55%,0.1)] text-[hsl(280,67%,55%)] text-[18px] font-medium mb-12 self-start">
        Modul 3 · Slide 6
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zum Gesprächsleitfaden befüllt.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MODUL 4 — Plattform-Schulung (7 Slides)
   ═══════════════════════════════════════════════ */

export function SchulungPlattform1() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(173,58%,39%,0.08)] to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="px-6 py-2 rounded-full border border-[hsl(173,58%,39%,0.3)] bg-[hsl(173,58%,39%,0.1)] text-[hsl(173,58%,39%)] text-[20px] font-medium mb-4">
          Modul 4 — Schulung
        </div>
        <h1 className="text-[80px] font-bold tracking-tight leading-none text-center">
          Plattform-Schulung
        </h1>
        <p className="text-[32px] text-white/40 font-light">
          Investment Engine · Marktplatz · DMS · Beratungsmodus
        </p>
        <div className="mt-8 h-1 w-48 rounded-full bg-gradient-to-r from-[hsl(173,58%,39%)] to-[hsl(173,58%,39%,0.1)]" />
      </div>
    </div>
  );
}

export function SchulungPlattform2() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(173,58%,39%,0.3)] bg-[hsl(173,58%,39%,0.1)] text-[hsl(173,58%,39%)] text-[18px] font-medium mb-12 self-start">
        Modul 4 · Slide 2
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zur Plattform-Nutzung befüllt.
      </p>
    </div>
  );
}

export function SchulungPlattform3() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(173,58%,39%,0.3)] bg-[hsl(173,58%,39%,0.1)] text-[hsl(173,58%,39%)] text-[18px] font-medium mb-12 self-start">
        Modul 4 · Slide 3
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zur Plattform-Nutzung befüllt.
      </p>
    </div>
  );
}

export function SchulungPlattform4() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(173,58%,39%,0.3)] bg-[hsl(173,58%,39%,0.1)] text-[hsl(173,58%,39%)] text-[18px] font-medium mb-12 self-start">
        Modul 4 · Slide 4
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zur Plattform-Nutzung befüllt.
      </p>
    </div>
  );
}

export function SchulungPlattform5() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(173,58%,39%,0.3)] bg-[hsl(173,58%,39%,0.1)] text-[hsl(173,58%,39%)] text-[18px] font-medium mb-12 self-start">
        Modul 4 · Slide 5
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zur Plattform-Nutzung befüllt.
      </p>
    </div>
  );
}

export function SchulungPlattform6() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(173,58%,39%,0.3)] bg-[hsl(173,58%,39%,0.1)] text-[hsl(173,58%,39%)] text-[18px] font-medium mb-12 self-start">
        Modul 4 · Slide 6
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zur Plattform-Nutzung befüllt.
      </p>
    </div>
  );
}

export function SchulungPlattform7() {
  return (
    <div className={`${S} ${BG}`}>
      <div className="px-6 py-2 rounded-full border border-[hsl(173,58%,39%,0.3)] bg-[hsl(173,58%,39%,0.1)] text-[hsl(173,58%,39%)] text-[18px] font-medium mb-12 self-start">
        Modul 4 · Slide 7
      </div>
      <h2 className="text-[56px] font-bold mb-16">Inhalt folgt</h2>
      <p className="text-[24px] text-white/30 max-w-[900px] text-center">
        Dieser Slide wird mit konkreten Schulungsinhalten zur Plattform-Nutzung befüllt.
      </p>
    </div>
  );
}
