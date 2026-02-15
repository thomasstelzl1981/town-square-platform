

# Grundsteuer: Verteilerschluessel entfernen — Direktbetrag pro Einheit

## Problem

Die aktuelle UI zeigt fuer die Grundsteuer drei Felder:
1. "Jaehrlicher Betrag (Haus gesamt)" — `grundsteuerTotal`
2. "Verteilerschluessel" — fest auf "MEA"
3. "Ihr Anteil (berechnet)" — `grundsteuerAnteil`

Das ist falsch. Der Grundsteuerbescheid wird immer **pro Wohnung/Einheit** ausgestellt. Es gibt keinen Verteilerschluessel — der Betrag ist absolut.

## Umsetzung

### Datei 1: `src/components/portfolio/NKAbrechnungTab.tsx`

**Grundsteuer-Card vereinfachen (Zeilen 306-338):**
- Die drei Spalten (Haus gesamt / Verteilerschluessel / Ihr Anteil) werden ersetzt durch **ein einziges Eingabefeld**: "Jaehrlicher Betrag (lt. Bescheid)"
- Das Feld schreibt direkt in `grundsteuerAnteil` (da dieser Wert in der Saldo-Berechnung verwendet wird)
- `grundsteuerTotal` wird auf denselben Wert gesetzt (fuer Konsistenz in der DB)
- Label "Verteilerschluessel" und "MEA" entfallen komplett
- Hinweistext: "Der Grundsteuerbescheid wird pro Einheit ausgestellt. Der Betrag wird direkt uebernommen."

**Berechnung (Zeile 93):** Bleibt unveraendert — `totalCostsTenant = sumApportionable + grundsteuerAnteil` ist korrekt, da `grundsteuerAnteil` jetzt der volle Bescheid-Betrag ist.

### Datei 2: `src/hooks/useNKAbrechnung.ts`

**`saveGrundsteuer` anpassen (Zeilen 263-317):**
- Beim Speichern: `amount_total_house` und `amount_unit` erhalten denselben Wert (kein Splitting mehr)
- `key_type` von `'mea'` auf `'direct'` aendern (bei Neuanlage)

### Datei 3: `src/engines/nkAbrechnung/pdfExport.ts`

- Pruefen ob die Grundsteuer-Zeile im PDF korrekt als Direktbetrag ohne Schluessel erscheint (sollte bereits passen, da `grundsteuerAnteil` verwendet wird)

| Datei | Aktion | Beschreibung |
|-------|--------|-------------|
| `src/components/portfolio/NKAbrechnungTab.tsx` | EDIT | 3 Felder durch 1 Direktbetrag-Feld ersetzen, MEA-Anzeige entfernen |
| `src/hooks/useNKAbrechnung.ts` | EDIT | key_type auf 'direct', amount_total = amount_unit |
