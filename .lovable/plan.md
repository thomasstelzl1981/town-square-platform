

# Ankaufsprofil: Hochwertige CI-Vorschau als eigene Kachel

## Klarstellung

Die drei Elemente im oberen Bereich sind:

1. **Kachel 1 (oben links)** — KI-Erfassung (Input): Freitext + Steuerfelder. Bleibt wie bisher.
2. **Kachel 2 (oben rechts)** — KI-Entwurf (editierbarer Draft): Das von der KI generierte Ankaufsprofil als Arbeitsdokument. Strukturierte Daten + editierbare Freitext-Zusammenfassung. Bleibt wie bisher.
3. **NEUE Vollbreiten-Kachel (Mitte)** — CI-Vorschau: Zeigt das fertige Ankaufsprofil exakt so, wie es als PDF versendet wird. DIN-A4-Proportionen, Logo, professionelle Typografie, Corporate Identity. Read-only, Live-Aktualisierung aus Kachel 2.

```text
Kunde: [Name/Vorname] oder [Kontaktbuch]

+---------------------------+---------------------------+
| 1. KI-ERFASSUNG (Input)  | 2. KI-ENTWURF (editierbar)|
|                           |                           |
| Freitext-Textarea         | Strukturierte Daten       |
| + Steuerfelder            | + editierbarer Freitext   |
| [Profil generieren]       | (Arbeitsdokument)         |
+---------------------------+---------------------------+

+-------------------------------------------------------+
|         CI-VORSCHAU — Ankaufsprofil (Vollbreite)      |
|                                                       |
|  +--------------------------------------------------+ |
|  | [Logo oben rechts]                                | |
|  |                                                   | |
|  | ANKAUFSPROFIL                                     | |
|  | Erstellt am 13. Februar 2026                      | |
|  | _________________________________________________ | |
|  | Mandant: Max Mustermann                           | |
|  |                                                   | |
|  | Suchgebiet:         Rhein-Main                    | |
|  | Asset-Fokus:        MFH, Gewerbe                  | |
|  | Investitionsrahmen: 2-5 Mio EUR                   | |
|  | Zielrendite:        5,0%                          | |
|  | Ausschluesse:       kein Denkmalschutz             | |
|  | _________________________________________________ | |
|  | Freitext-Zusammenfassung aus Kachel 2...          | |
|  +--------------------------------------------------+ |
|                                                       |
|  [PDF exportieren]  [Drucken]                         |
+-------------------------------------------------------+

[Ankaufsprofil anlegen] --> Mandat-ID + Datenraum

+---------------------------+---------------------------+
| 3. KONTAKTRECHERCHE       | 4. E-MAIL-VERSAND         |
+---------------------------+---------------------------+
```

## Technische Umsetzung

### Neue Datei: `src/components/akquise/AcqProfilePreview.tsx`

Eine eigenstaendige Vorschau-Komponente nach dem Muster der bestehenden `LetterPreview`-Komponente:

- **DIN-A4-Proportionen**: `aspect-ratio: 210/297`, weisser Hintergrund, Schatten, zentriert
- **CI-Elemente**: Armstrong-Logo (`armstrong_logo_light.jpg`) oben rechts, DIN-Font-Stack
- **Inhalt**: Titel "ANKAUFSPROFIL", Datum, Mandantenname, tabellarische Profildaten (Suchgebiet, Asset-Fokus, Investitionsrahmen, Rendite, Ausschluesse), Freitext-Zusammenfassung
- **Props**: `clientName`, `profileData` (ExtractedProfile), `profileTextLong`, `logoUrl?`
- **Read-only**: Keine Eingabefelder — reine Anzeige, aktualisiert sich live wenn Kachel 2 editiert wird

### Aenderung: `src/pages/portal/akquise-manager/AkquiseMandate.tsx`

**Was sich aendert:**

Die bestehende PDF-Vorschau-Sektion (Zeilen 532-580) wird ersetzt durch die neue `AcqProfilePreview`-Komponente in einer vollbreiten Card. Die Card bekommt Export-Buttons im Header.

**Was gleich bleibt:**

- Kachel 1 (KI-Erfassung): Unveraendert
- Kachel 2 (Ankaufsprofil-Entwurf): Unveraendert — bleibt editierbares Arbeitsdokument
- Kachel 3+4 (Kontakte + E-Mail): Unveraendert
- Alle Hooks, State, Handler: Unveraendert
- `generatePdf()`: Wird angepasst, damit das exportierte PDF dasselbe Layout wie die Vorschau nutzt (Logo, Schriftgroessen, Abstaende)

### Zusammenfassung

| Datei | Aenderung |
|-------|-----------|
| `src/components/akquise/AcqProfilePreview.tsx` | **Neue Datei**: DIN-A4-Vorschau im CI-Design (nach LetterPreview-Muster) |
| `src/pages/portal/akquise-manager/AkquiseMandate.tsx` | Zeilen 532-580: Einfache Vorschau durch `AcqProfilePreview` ersetzen |

