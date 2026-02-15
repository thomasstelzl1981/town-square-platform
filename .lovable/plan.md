

# Demo-Recherche: Interaktiver Flow mit Eingabemaske und Kontaktbuch-Abgleich

## Uebersicht

Die Demo wird von einer sofort loslaufenden Simulation zu einem **beeindruckenden, mehrstufigen Flow** umgebaut. Der Nutzer klickt auf die gruene Kachel und sieht zunaechst die Eingabemaske. Dort wird automatisch "Immobilienmakler" eingetippt, der Standort wird ermittelt, und erst dann startet die animierte Suche. Die Ergebnisse werden vollstaendig (nicht scrollbar) angezeigt, mit Kontaktbuch-Abgleich und prominentem Uebernahme-CTA.

## Die 5 Phasen des neuen Demo-Flows

```text
Phase 1: Eingabemaske (0-3s)
  +-------------------------------------------+
  | 1. Auftrag definieren                     |
  |   Suchintent: [Immobilienmakl|]  <-- Typing-Animation
  |   Region:     [Muenchen]       <-- Auto-filled
  |   Branche:    [Immobilien]     <-- Auto-filled
  +-------------------------------------------+

Phase 2: Consent-Bestaetigung (3-4.5s)
  +-------------------------------------------+
  | Credits: 25 Credits = 12,50 EUR           |
  | [x] Consent (animiert angehakt)           |
  | [x] Credit-Abbuchung bestaetigt           |
  | [Button: Recherche starten] <-- pulsiert  |
  +-------------------------------------------+

Phase 3: Suche laeuft (4.5-14s)
  +-------------------------------------------+
  | [Fortschrittsring 67%]  25 / 25           |
  | Web-Analyse:       12 Seiten...           |
  | Datenanreicherung: Anreichern...          |
  | Qualitaetsbewertung: Bewertung...         |
  | --- Kontakt-Feed (einzeln einblendend) -- |
  +-------------------------------------------+

Phase 4: Ergebnis-Tabelle (ab 14s)
  +-------------------------------------------+
  | Ergebnisse (8 von 25)                     |
  | Firma | Kontakt | Score | Kontaktbuch     |
  | Meier | Thomas  | 92   | [x] NEU         |
  | WEG   | Michael | 85   | [ ] VORHANDEN   |
  | ...komplett sichtbar, kein Scroll...      |
  +-------------------------------------------+

Phase 5: Uebernahme-CTA (ab 14s, prominent)
  +-------------------------------------------+
  | [Icon] Kontakte ins Kontaktbuch           |
  | 6 neue Kontakte / 2 bereits vorhanden     |
  | [Ausgewaehlte uebernehmen] [Excel-Export] |
  +-------------------------------------------+
```

## Aenderung 1: ResearchDemoSimulation.tsx — Komplett-Umbau

Statt sofort `ResearchLiveProgress` zu zeigen, durchlaeuft die Demo 5 Phasen:

**Phase 1 — Eingabemaske (0-3s):**
- Zeigt die gleiche Eingabeform wie `ResearchOrderInlineFlow` Section 1
- "Immobilienmakler" wird Buchstabe fuer Buchstabe in das Suchintent-Feld getippt (Typing-Animation, ca. 80ms pro Zeichen)
- Region wird automatisch auf den erkannten Standort gesetzt (Fallback: "Muenchen")
- Branche wird auf "Immobilien" gesetzt
- Alle Felder sind `disabled` (read-only Demo), aber die Typing-Animation zeigt den Cursor

**Phase 2 — Consent (3-4.5s):**
- Trefferlimit-Card erscheint: "25 Treffer = 12,50 EUR"
- Consent-Checkboxen werden nacheinander animiert angehakt (je 500ms Verzoegerung)
- Der "Recherche starten"-Button pulsiert kurz und wird dann "gedrueckt" (visueller Klick-Effekt)

**Phase 3 — Suche (4.5-14s):**
- Wie bisher: `ResearchLiveProgress` mit Ring, Provider-Status, Kontakt-Feed
- Kontakte erscheinen einzeln mit Animation
- Kein scrollbarer Container — alles waechst nach unten

**Phase 4 — Ergebnistabelle (ab 14s):**
- `ResearchDemoResultsTable` wird angezeigt — komplett sichtbar, kein interner Scroll
- Jede Zeile hat eine Kontaktbuch-Spalte:
  - "NEU" (gruen) + Checkbox angehakt = bereit zur Uebernahme
  - "VORHANDEN" (gelb/orange) + Checkbox NICHT angehakt + Tooltip "Bereits im Kontaktbuch"
  - 2 von 8 Ergebnissen sind als "VORHANDEN" markiert (WEG-Profis, Bergisch Immo)

**Phase 5 — CTA-Banner (ab 14s):**
- Prominentes Banner: "6 neue Kontakte zur Uebernahme / 2 bereits im Kontaktbuch"
- Grosser Button: "Ausgewaehlte ins Kontaktbuch uebernehmen"
- Sekundaerer Button: "Excel-Export"

## Aenderung 2: ResearchDemoResultsTable.tsx — Kontaktbuch-Abgleich

- Header-Text: "8 von 25 angezeigt" (statt "8 von 37")
- Neue Spalte "Kontaktbuch" statt "Import":
  - `duplikat: true` Zeilen bekommen Badge "VORHANDEN" (amber/orange) + unchecked Checkbox + kleiner Hinweis "Kontakt bereits vorhanden — kann enriched werden"
  - `duplikat: false` Zeilen bekommen Badge "NEU" (emerald) + checked Checkbox
- Checkboxen sind interaktiv (Demo-only State), damit der Nutzer den Abgleich sieht
- Kein `overflow-x-auto` mit internem Scroll — die Tabelle wird komplett dargestellt

## Aenderung 3: ResearchDemoSimulation.tsx — Timing-Konstanten

- `TYPING_SPEED`: 80ms pro Buchstabe
- `TYPING_TEXT`: "Immobilienmakler in Muenchen" (28 Zeichen x 80ms = ~2.2s)
- `CONSENT_DELAY`: 3000ms nach Start
- `SEARCH_START`: 4500ms nach Start
- `SEARCH_DURATION`: 9500ms (4.5s-14s)
- `RESULTS_SHOW`: 14000ms nach Start
- Gesamtdauer: ~14s bis zur vollstaendigen Anzeige

## Aenderung 4: ResearchLiveProgress.tsx — Kein interner Scroll

- Sicherstellen, dass kein `max-h` oder `overflow-y-auto` im Kontakt-Feed vorhanden ist (wurde schon entfernt, Kontrolle)
- Kontakt-Feed waechst unbegrenzt nach unten

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `ResearchDemoSimulation.tsx` | Komplett-Umbau: 5-Phasen-Flow mit Typing-Animation, Consent, Suche, Ergebnisse, CTA |
| `ResearchDemoResultsTable.tsx` | Kontaktbuch-Spalte mit NEU/VORHANDEN-Status, Checkboxen, "8 von 25", kein Scroll |
| `ResearchLiveProgress.tsx` | Kontrolle: kein interner Scroll (bereits bereinigt) |

