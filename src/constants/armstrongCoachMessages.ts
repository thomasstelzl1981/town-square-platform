/**
 * Armstrong Investment Coach — Static Messages (Frontend Fast-Path)
 * 
 * These messages are used as immediate fallback when the Edge Function
 * is not needed (slide coaching is deterministic, no LLM required).
 */

// =============================================================================
// SLIDE COACHING MESSAGES
// =============================================================================

export type PresentationCoachKey = 'verkaufspraesentation' | 'rendite' | 'steuervorteil' | 'verwaltung';

export const SLIDE_COACH_MESSAGES: Record<PresentationCoachKey, string[]> = {
  verkaufspraesentation: [
    'Heute geht es ums Prinzip: Sachwert hat Substanz - Geldwert verliert Kaufkraft. Wir bauen Vermögen mit Struktur, nicht mit Hoffnung.',
    'Sparpläne hängen am freien Netto. Der Engpass ist selten Rendite – sondern die Sparfähigkeit. Genau deshalb wirkt Struktur stärker.',
    'Bei Immobilien wirken drei Motoren: Miete, steuerliche Effekte (Liquidität) und Fremdkapital. Du investierst nicht allein.',
    'Wir starten immer mit dem Rahmen: Eigenkapital + Einkommen + Puffer. Die Investment Engine macht daraus eine klare, ruhige Entscheidungsbasis.',
    'Dann wählst du den Weg: direkt im Marktplatz suchen oder ein Akquisemandat geben. Beides ist strukturiert und begleitet.',
    'Finanzierungsmanager begleiten den Ablauf: Unterlagen, Status, Kommunikation – damit es sauber bleibt und du dich nicht verzettelst.',
    'Sicherheit entsteht durch Ordnung: Dokumente im DMS, klare Schritte, klare Zustände. Das reduziert Stress und Fehler.',
    'Wenn du willst: Starte jetzt die Simulation. Danach weißt du deinen Investitionsrahmen – ohne Druck, nur Klarheit.',
  ],
  rendite: [
    'Rendite ist hier kein Prozent-Spiel. Entscheidend ist die Vermögenswirkung über Zeit – also was langfristig wirklich übrig bleibt.',
    'Beim Sparplan wächst nur, was du selbst einzahlst. Bei Immobilien wirkt zusätzlich ein Zahlungsstrom von außen – das verändert die Skalierung.',
    'Hebel heißt: Mit wenig Eigenkapital kontrollierst du einen größeren Sachwert. Darum kann Vermögensaufbau spürbarer werden – langfristig gedacht.',
    'Zeit ist der Verstärker: Struktur wirkt über Jahre. Deshalb planen wir Puffer und Varianten - nicht nur die beste Rechnung.',
    'Unsere Engine zeigt dir Varianten: Belastung, Puffer, Szenarien. So ersetzt du Bauchgefühl durch Klarheit.',
    'Der wichtigste Renditefaktor ist Stabilität. Puffer und saubere Unterlagen verhindern, dass ein gutes Investment zum Problem wird.',
    'Wenn du willst, berechnen wir deinen Rahmen jetzt direkt in der Simulation – dann siehst du, was realistisch ist.',
  ],
  steuervorteil: [
    'Steuern sind hier kein Trick. Es ist Systemlogik: bestimmte Kosten und Abschreibungen können die Liquidität beeinflussen.',
    'Typisch relevant: AfA, Zinsen und Bewirtschaftung. Keine Beratung – nur das Prinzip, warum Vermietung oft anders wirkt.',
    'Denk in Liquidität: Mehr Spielraum bedeutet mehr Stabilität. Die genaue Wirkung ist individuell – das Prinzip ist planbar.',
    'In der Engine kannst du dein Einkommen und Szenarien einbeziehen. So bekommst du eine grobe Orientierung für deinen Rahmen.',
    'Ordnung ist hier Gold: Dokumente sauber im DMS, klare Zuordnung – damit du jederzeit weißt, was fehlt und was passt.',
    'Wenn du willst: Starte die Simulation. Danach hast du Klarheit – und Details prüft man dann sauber im Einzelfall.',
  ],
  verwaltung: [
    'Der Kauf ist der Anfang. Ob Vermögen wächst, entscheidet die Verwaltung: Klarheit, Ordnung und saubere Prozesse.',
    'Portfolio heißt: Überblick über Objekte, Zahlen, Dokumente. Ohne Überblick wird aus Investment schnell Stress.',
    'Für Vermietung zählt Alltag: Mieteingänge, Kommunikation, Vorgänge. Die Mietsonderverwaltung hält das strukturiert – ohne Chaos.',
    'Dokumente sind das Rückgrat: Im DMS sind Unterlagen sauber abgelegt und wieder auffindbar – das spart Zeit und verhindert Fehler.',
    'Finanzierung bleibt sichtbar: Rate, Restschuld, Status. So triffst du Entscheidungen nicht im Nebel.',
    'KI hilft hier beim Sortieren und Erinnern: Status, Aufgaben, nächste Schritte – ruhig und nachvollziehbar.',
    'Wenn du willst, starten wir professionell: kostenlos testen oder direkt Simulation – beides geht ohne Druck.',
  ],
};

// =============================================================================
// COACH LIFECYCLE MESSAGES
// =============================================================================

export const COACH_MESSAGES = {
  AUTO_START: 'Ich begleite dich kurz. Ich schreibe langsam, damit du in Ruhe mitlesen kannst.',
  DISMISS: 'Alles klar. Sag einfach „Coach an", wenn du wieder Unterstützung willst.',
  RESUME: 'Bin da. Ich begleite dich wieder kurz und ruhig.',
  PAUSE_FOR_USER: 'Gern. Ich beantworte das kurz – danach machen wir weiter.',
  TO_SIMULATION: 'Wenn du willst, starten wir jetzt die Simulation – ohne Verpflichtung, nur für Klarheit.',

  // Engine on-page
  ENGINE_INTRO: 'Soll ich dich kurz führen? Erst Rahmen, dann Simulation. Ich schreibe langsam, damit du entspannt mitlesen kannst.',
  ENGINE_FRAME_START: 'Starten wir ruhig: 1) Wie viel Eigenkapital willst du einsetzen? 2) Welchen monatlichen Puffer willst du sicher übrig haben?',
  ENGINE_FRAME_NEXT: 'Danke. Als Nächstes: 1) Haushalts-Nettoeinkommen grob, 2) Ziel: eher Vermögensaufbau oder mehr monatliche Entlastung?',
  ENGINE_PATH_CHOICE: 'Jetzt hast du zwei Wege: 1) Marktplatz – direkt suchen und anfragen. 2) Mandat – AkquiseManager sucht passend. Ich empfehle erst den Rahmen fertig, dann den Weg wählen.',
  ENGINE_MSV_EXPLAIN: 'MSV ist der Alltag: Mieteingänge, Kommunikation, Vorgänge und Dokumente. Ziel ist: keine Zettelwirtschaft, klare Status, weniger Fehler.',
  ENGINE_TO_SIMULATION: 'Perfekt. Starte jetzt die Simulation. Danach siehst du Varianten und deinen Investitionsrahmen – erst dann sprechen wir über Umsetzung.',
  ENGINE_OBJECTION_DEBT: 'Verständlich. Wichtig: Es geht nicht um „Schulden", sondern um kontrollierten Vermögensaufbau mit Puffer und klarer Belastungsgrenze.',
  ENGINE_OBJECTION_RISK: 'Risiko ist meist fehlende Struktur. Darum rechnen wir zuerst Rahmen und Puffer – und entscheiden erst dann ruhig.',
} as const;

// =============================================================================
// QUICK ACTIONS
// =============================================================================

export const COACH_QUICK_ACTIONS = {
  SLIDESHOW: [
    { label: 'Erklärung starten', action: 'ARM.INV.COACH.AUTO_START' },
    { label: 'Zur Simulation', action: 'ARM.INV.COACH.TO_SIMULATION' },
    { label: 'Coach ausblenden', action: 'ARM.INV.COACH.DISMISS' },
  ],
  ENGINE: [
    { label: 'Rahmen starten', action: 'ARM.INV.COACH.ENGINE.FRAME_START' },
    { label: 'Marktplatz vs Mandat', action: 'ARM.INV.COACH.ENGINE.PATH_CHOICE' },
    { label: 'MSV erklärt', action: 'ARM.INV.COACH.ENGINE.MSV_EXPLAIN' },
    { label: 'Zur Simulation', action: 'ARM.INV.COACH.ENGINE.TO_SIMULATION' },
  ],
} as const;

// =============================================================================
// ACTION CODE MAPPING (presentation key + slide index → action code)
// =============================================================================

export function getSlideActionCode(presentationKey: string, slideIndex: number): string | null {
  const PREFIX_MAP: Record<string, string> = {
    verkaufspraesentation: 'ARM.INV.COACH.VERKAUF',
    rendite: 'ARM.INV.COACH.RENDITE',
    steuervorteil: 'ARM.INV.COACH.STEUER',
    verwaltung: 'ARM.INV.COACH.SOFT',
  };
  
  const prefix = PREFIX_MAP[presentationKey];
  if (!prefix) return null;
  
  return `${prefix}.S${slideIndex + 1}`;
}
