

# Heizkosten-Vorauszahlung entfernen aus NK-Abrechnung

## Problem

Die Nebenkostenabrechnung fuehrt eine separate "Heizkosten-Vorauszahlung" (`heatingAdvanceEur`) auf. Diese ist in der Praxis redundant, da die Heizkosten bereits in der NK-Vorauszahlung bzw. im Hausgeld enthalten sind. Die separate Zeile verfaelscht das Berechnungsergebnis, weil Vorauszahlungen doppelt abgezogen werden.

## Betroffene Stellen

1. **`src/components/portfolio/NKAbrechnungTab.tsx`** — UI-Darstellung
   - Zeile 91: `totalHeizVZ` wird berechnet (= `heatingAdvanceEur * 12`)
   - Zeile 92: `totalVZ = totalNKVZ + totalHeizVZ` — hier wird der Saldo verfaelscht
   - Zeile 393: Warmmiete-Anzeige addiert `heatingAdvanceEur` dazu
   - Zeile 418-423: Separate Tabellenzeile "Heizkosten-Vorauszahlung" in Sektion 3
   - Zeile 615-618: Separate Abzugszeile "Heizkosten-Vorauszahlungen" in Sektion 4 (Saldo)

2. **`src/engines/nkAbrechnung/engine.ts`** — Engine-Berechnung
   - Zeile 191-195: `calculateProratedPrepayments` bekommt `heating_advance_eur` uebergeben
   - Zeile 197: `totalPrepaid = prepaidNK + prepaidHeating`
   - Zeile 206: `prepaidHeating` im Summary

3. **`src/engines/nkAbrechnung/allocationLogic.ts`** — Hilfsfunktion
   - `calculateProratedPrepayments` akzeptiert `monthlyHeating` Parameter

4. **`src/engines/nkAbrechnung/spec.ts`** — Typ-Definition
   - `NKSettlementSummary` hat `prepaidHeating` und `totalHeating` Felder

5. **`src/engines/nkAbrechnung/pdfExport.ts`** — PDF-Ausgabe
   - Zeile 133-134: "Heizkosten-Vorauszahlungen" im PDF

## Umsetzung

### Datei 1: `src/components/portfolio/NKAbrechnungTab.tsx`

- `totalHeizVZ` Variable entfernen
- `totalVZ = totalNKVZ` (ohne Heizkosten-Anteil)
- Warmmiete-Anzeige: nur `rentColdEur + nkAdvanceEur` (ohne `heatingAdvanceEur`)
- Tabellenzeile "Heizkosten-Vorauszahlung" in Sektion 3 entfernen
- Abzugszeile "Heizkosten-Vorauszahlungen" in Sektion 4 entfernen

### Datei 2: `src/engines/nkAbrechnung/engine.ts`

- `heating_advance_eur` auf `0` setzen beim Aufruf von `calculateProratedPrepayments`
- Alternativ: `prepaidHeating` einfach auf 0 setzen im Summary
- `totalPrepaid = prepaidNK` (ohne Heizkosten)

### Datei 3: `src/engines/nkAbrechnung/pdfExport.ts`

- Zeile "Heizkosten-Vorauszahlungen" aus PDF entfernen

### Datei 4: `src/engines/nkAbrechnung/spec.ts`

- `prepaidHeating` bleibt im Interface (Wert wird einfach 0 sein), um keine Breaking Changes in anderen Stellen auszuloesen

## Hinweis zum Build-Fehler

Der angezeigte Build-Fehler ist kein echter Kompilierungsfehler, sondern eine Vite-Warnung ueber gemischte Imports (`client.ts` dynamisch + statisch importiert). Diese Warnung ist harmlos und bestand bereits vorher.

| Datei | Aktion | Beschreibung |
|-------|--------|-------------|
| `src/components/portfolio/NKAbrechnungTab.tsx` | EDIT | Heizkosten-VZ Zeilen und Berechnung entfernen |
| `src/engines/nkAbrechnung/engine.ts` | EDIT | `heating_advance_eur` auf 0, prepaidHeating neutralisieren |
| `src/engines/nkAbrechnung/pdfExport.ts` | EDIT | Heizkosten-Zeile aus PDF entfernen |
