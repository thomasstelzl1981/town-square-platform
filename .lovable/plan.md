
# Zone 2 Recherche-Modul: Kompletter Umbau mit Demo-Daten und Billing-Slot

## Ausgangslage

Das bestehende Zone 2 Recherche-Modul (`ResearchTab.tsx`) ist rudimentaer: Es zeigt ein einfaches Demo-Widget mit Zusammenfassungstext, nutzt aber **nicht** die vollstaendige Tabellen-Struktur und den Import-Flow aus Zone 1 (`AdminRecherche.tsx`). Ausserdem fehlt:

1. **DEMO_WIDGET Styling** (emerald-gruenes Design gemaess `designManifest.ts`)
2. **Demo-Daten mit Ergebnis-Tabelle** (Beispielkontakte als statische Daten, damit der Prozess sichtbar wird)
3. **Billing-Slot** im Flow (Credit-Bestaetigung vor Recherche-Start)
4. **WidgetGrid/WidgetCell** korrekt mit `useDemoToggles` (wie bei AkquiseMandate, SerienEmails etc.)

## Was wird gebaut

### 1. Demo-Daten mit vollstaendiger Ergebnis-Tabelle

Statische Demo-Ergebnisse (ca. 8 Kontakte) werden direkt im Code definiert, analog zu den Demo-Daten in anderen Modulen. Diese zeigen:

| Firma | Kategorie | Kontaktperson | Rolle | E-Mail | Telefon | Stadt | PLZ | Web | Score | Status |
|-------|-----------|---------------|-------|--------|---------|-------|-----|-----|-------|--------|
| Hausverwaltung Meier GmbH | Hausverwaltung | Thomas Meier | Geschaeftsfuehrer | t.meier@hv-meier.de | 0211-... | Duesseldorf | 40210 | hv-meier.de | 92 | Validiert |
| ... (7 weitere) | | | | | | | | | | |

Die Demo-Inline-Ansicht zeigt:
- Auftrags-Zusammenfassung (Intent, Region, Branche, Kosten)
- **Vollstaendige Ergebnis-Tabelle** (13 Spalten, identisch zur Zone 1 Tabelle)
- Import-Vorschau mit Duplikat-Badges (NEU / DUPLIKAT)
- Export-Button (deaktiviert im Demo-Modus)

### 2. Demo-Widget mit korrektem CI (DESIGN.DEMO_WIDGET)

Das Demo-Widget wird umgebaut auf das systemweite Pattern:

```text
+------------------------------------------+
| [Demo Badge]              [Fertig Badge] |
| Hausverwaltungen NRW                     |
| 37 qualifizierte Kontakte gefunden       |
|                                          |
| Intent:  Geschaeftsfuehrer HV > 500 WE   |
| Region:  NRW                             |
| Treffer: 37 / 50                         |
+------------------------------------------+
  (emerald-gruener Shimmer-Gradient oben)
```

Klassen: `DESIGN.DEMO_WIDGET.CARD`, `DESIGN.DEMO_WIDGET.HOVER`, `DESIGN.DEMO_WIDGET.BADGE`

### 3. Billing-Slot im Erstellungs-Flow

Im `ResearchOrderInlineFlow.tsx` wird **Sektion 2 ("Trefferlimit & Kosten")** um einen Billing-Hinweis erweitert:

```text
+--------------------------------------------------+
| 2. Trefferlimit & Credits                        |
|--------------------------------------------------|
| Maximale Treffer: [25 v]                         |
| Credits benoetigt: 25 Credits (= 12,50 EUR)     |
|                                                  |
| [!] Die Recherche ist kostenpflichtig.           |
|     1 Credit pro Kontakt wird bei Start          |
|     abgebucht. Guthaben: 100 Credits             |
|                                                  |
| [ ] Ich bestaetige die Credit-Abbuchung          |
+--------------------------------------------------+
```

Der Credit-Flow wird als **UI-Platzhalter** implementiert (Checkbox + Info-Banner). Die tatsaechliche Abbuchungslogik wird spaeter beim Billing-System angebunden. Der Start-Button in Sektion 5 wird nur aktiv, wenn **beide** Checkboxen (DSGVO + Credits) bestaetigt sind.

### 4. useDemoToggles Integration

- Toggle-Key: `GP-RECHERCHE` (bereits in `goldenPathProcesses.ts` registriert)
- Demo-Widget nur sichtbar wenn `isEnabled('GP-RECHERCHE')` = true

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/communication-pro/recherche/ResearchTab.tsx` | Komplett-Umbau: DEMO_WIDGET Styling, useDemoToggles, statische Demo-Ergebnistabelle inline, CTA-Widget angepasst |
| `src/pages/portal/communication-pro/recherche/ResearchOrderInlineFlow.tsx` | Sektion 2 um Credit-Billing-Slot erweitern (UI-Platzhalter), Start-Button Logik anpassen |

## Was sich NICHT aendert

- `ResearchOrderWidget.tsx` (bleibt fuer echte Orders)
- `ResearchResultsTable.tsx` (bleibt fuer echte Orders)
- Zone 1 AdminRecherche (unveraendert wie besprochen)
- Hooks (`useResearchOrders`, `useResearchResults`, `useResearchImport`)
- Datenbank / Edge Functions
