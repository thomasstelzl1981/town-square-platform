

# Fix: Briefgenerator -- Schriftgroesse und Mehrseitige Briefe

## Probleme

1. **Schrift zu gross**: Die Vorschau nutzt `fontSize: 10px` als Basis und `0.85em` fuer den Body -- das entspricht etwa 8.5px. Word nutzt standardmaessig 12pt (~16px). Die Proportionen stimmen nicht, weil der Container nur 420px breit ist (A4 waere bei 96dpi ~794px). Dadurch wirkt alles zu gross im Verhaeltnis zum Papier.

2. **Kein Seitenumbruch in der Vorschau**: `LetterPreview.tsx` hat `overflow-hidden` auf dem Body-Container und ein festes `aspectRatio: 210/297`. Laengerer Text wird einfach abgeschnitten. Es gibt keinen zweiten Seitenumbruch.

3. **PDF-Schriftgroesse ebenfalls falsch**: `letterPdf.ts` nutzt `setFontSize(10)` fuer den Body und `lineHeight: 5mm`. Standard-Geschaeftsbriefe in Word nutzen 12pt mit 1.5-fachem Zeilenabstand (~6mm).

## Loesung

### 1. PDF korrigieren (letterPdf.ts)

- Body-Schriftgroesse von `10` auf `12` (pt) aendern -- entspricht Word 12pt
- Betreff-Schriftgroesse von `11` auf `13` aendern (leicht groesser als Body, wie in Word ueblich)
- Empfaenger-Schriftgroesse von `11` auf `12` aendern
- Zeilenhoehe von `5mm` auf `6mm` aendern (entspricht 1.5-fachem Zeilenabstand bei 12pt)
- Seitenumbruch-Schwelle bleibt bei 270mm (funktioniert bereits korrekt)

### 2. Vorschau mehrseitig machen (LetterPreview.tsx)

**Ansatz:** Den Body-Text in "Seiten" aufteilen. Da wir kein Canvas nutzen, simulieren wir den Seitenumbruch:

- Die feste `aspectRatio` und `overflow-hidden` entfernen
- Stattdessen: Jede "Seite" als eigenes A4-proportionales `div` rendern
- Den Body-Text zeichenweise in Zeilen aufteilen (basierend auf geschaetzter Zeichenanzahl pro Zeile)
- Wenn die erste Seite voll ist (ca. 35-40 Zeilen bei 12pt-Aequivalent), beginnt eine neue Seite
- Folgeseiten zeigen nur den fortgesetzten Text (ohne Absender/Empfaenger/Betreff)
- Zwischen den Seiten ein visueller Trenner (Schatten + Abstand)

**Vereinfachter Ansatz (empfohlen):** Statt exakter Zeilenberechnung nutzen wir CSS-basiertes Paging:
- Ein innerer Container mit fester Hoehe pro "Seite" (proportional zu A4)
- `overflow: visible` statt `hidden`
- Jede Seite als separates weisses Blatt mit Schatten darstellen
- JavaScript misst die tatsaechliche Content-Hoehe und berechnet die Seitenanzahl

### 3. Schriftgroessen-Proportionen in der Vorschau anpassen

Die Vorschau bei 420px Breite stellt 210mm dar, also 2px/mm. Bei 12pt in echt (ca. 4.2mm Zeichenhoehe) brauchen wir ~8.4px in der Vorschau. Aktuell ist der Body bei 8.5px -- das passt eigentlich. Das Problem ist eher, dass die anderen Elemente (Empfaenger bei `1em = 10px`, Betreff bei `1.05em`) proportional zu gross sind.

Korrektur:
- Basis-Schriftgroesse von `10px` auf `8.5px` senken (Body bleibt bei `1em`)
- Empfaenger: `1em` (gleich wie Body, wie in Word)
- Betreff: `1.08em` (leicht groesser)
- Absenderzeile: `0.6em` (bleibt klein)
- Datum: `1em` (gleich wie Body)

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/lib/letterPdf.ts` | Schriftgroessen auf 12pt, Zeilenhoehe auf 6mm |
| `src/components/portal/office/LetterPreview.tsx` | Mehrseitige Darstellung, Schriftproportionen korrigieren |

## Ergebnis

- PDF-Output entspricht Word 12pt Standard
- Vorschau zeigt bei langen Briefen mehrere A4-Seiten untereinander
- Proportionen zwischen Vorschau und PDF stimmen ueberein

