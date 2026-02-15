
# Recherche-Modul: UX-Redesign und Bereinigung

## Analyse der Probleme (Screenshots)

### 1. Widget-Grid: Ungleiche Groessen und kein Loeschen
- Das Demo-Widget ist deutlich groesser (mehr Inhalt) als die leeren "Neuer Recherch..."-Kacheln
- Die leeren Entwuerfe haben abgeschnittene Titel ("Neuer Recherch...")
- Es gibt keine Moeglichkeit, angelegte Entwuerfe zu loeschen
- Die Widgets haben unterschiedliche Inhaltshoehen, was das Grid unruhig macht

### 2. Provider-Kacheln verraten Geschaeftsgeheimnisse
- Section "3. Provider und Quellen" zeigt explizit "Firecrawl", "Epify", "Apollo"
- Das sind interne Datenquellen — muessen komplett entfernt werden

### 3. max_results Default ist 37 statt 25
- Das Demo zeigt "37 / 50" und "37 Treffer" — muss auf 25 geaendert werden
- Der Default fuer neue Auftraege muss ebenfalls 25 sein

### 4. Scrollbare Bereiche in der Fortschrittsanzeige
- `ResearchLiveProgress.tsx` Zeile 176: `max-h-[300px] overflow-y-auto` — das widerspricht dem CI
- Alles muss nach unten wachsen, keine internen Scroll-Container

### 5. Flow "Ins Kontaktbuch" nicht klar genug
- Der Hinweis ist nur ein kleines Info-Banner — muss prominenter werden

## Loesung

### Aenderung 1: Provider-Section komplett entfernen
In `ResearchOrderInlineFlow.tsx` die gesamte Section 3 ("Provider und Quellen") entfernen. Die Provider-Logik (Firecrawl etc.) bleibt intern im Backend, wird aber im UI nicht mehr angezeigt. Die Section-Nummerierung rueckt auf: 1. Auftrag, 2. Trefferlimit, 3. KI-Assistent, 4. Consent, 5. Ergebnisse.

### Aenderung 2: Provider-Status in Live-Progress neutralisieren
In `ResearchLiveProgress.tsx` die Provider-Zeilen (Firecrawl, Enrichment, KI-Scoring) durch neutrale Labels ersetzen:
- "Web-Analyse" statt "Firecrawl"
- "Datenanreicherung" statt "Enrichment"  
- "Qualitaetsbewertung" statt "KI-Scoring"

Ebenso in `ResearchDemoSimulation.tsx` und `ResearchOrderInlineFlow.tsx` (RunningProgress).

### Aenderung 3: Scrollbare Bereiche entfernen
In `ResearchLiveProgress.tsx` Zeile 176: `max-h-[300px] overflow-y-auto` entfernen. Der Kontakt-Feed waechst einfach nach unten ohne Limit.

### Aenderung 4: Demo auf 25 Treffer limitieren
- `ResearchDemoSimulation.tsx`: `MAX_CONTACTS` von 37 auf 25 aendern
- `ResearchTab.tsx`: Demo-Widget zeigt "25 / 25" statt "37 / 50"
- `useResearchOrders.ts` / `ResearchOrderInlineFlow.tsx`: Default `max_results` bleibt 25 (ist schon so)
- Select-Options: "50" und "100" entfernen, nur "10" und "25" anbieten

### Aenderung 5: Widget-Kacheln homogenisieren + Loeschfunktion
- `ResearchOrderWidget.tsx`: Alle Widgets bekommen exakt die gleiche Struktur (Titel, Status-Badge, Intent-Text, Treffer-Zeile). Leere Entwuerfe zeigen "Noch nicht konfiguriert" statt "Kein Suchintent definiert". Provider-Icons (Globe, Database, Search) entfernen.
- Loeschfunktion: Ein kleines Trash-Icon (X oder Trash2) in der oberen rechten Ecke jedes Nicht-Demo-Widgets. Klick oeffnet eine Bestaetigung und loescht den Auftrag via `useDeleteResearchOrder`.

### Aenderung 6: Neuen Hook `useDeleteResearchOrder` hinzufuegen
In `useResearchOrders.ts` einen Delete-Mutation-Hook ergaenzen, der `research_orders` per ID loescht.

### Aenderung 7: "Ins Kontaktbuch" prominenter gestalten
In `ResearchOrderInlineFlow.tsx` Section 5 (Ergebnisse): Das Info-Banner wird zu einem ausfuellenden CTA-Banner mit grossem Button "Kontakte ins Kontaktbuch uebernehmen" und einem sekundaeren "Excel-Export" Button — aehnlich einem Abschluss-Banner.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `ResearchOrderInlineFlow.tsx` | Section 3 (Provider) komplett entfernen, Nummerierung anpassen, CTA-Banner fuer Kontaktbuch, Provider-Labels in RunningProgress neutralisieren |
| `ResearchLiveProgress.tsx` | `overflow-y-auto` + `max-h` entfernen, Provider-Labels neutralisieren |
| `ResearchDemoSimulation.tsx` | MAX_CONTACTS 37→25, Provider-Labels neutralisieren |
| `ResearchOrderWidget.tsx` | Provider-Icons entfernen, Loeschbutton hinzufuegen, homogenes Layout |
| `ResearchTab.tsx` | Demo-Widget: "25/25" statt "37/50", Select-Options begrenzen |
| `useResearchOrders.ts` | `useDeleteResearchOrder` Hook hinzufuegen |
