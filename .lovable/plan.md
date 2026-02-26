

# Analyse & Reparaturplan: MOD-08 Bilder + MOD-04 Demo-Daten + Freeze

## Kernbefunde

### Problem 1: Bilder fehlen in Investment-Cards (Screenshots 1-3)

Die DB hat 3 aktive Listings mit den Demo-Property-IDs (`d0000000-...`). Diese haben **0 document_links Records** -- also keine Bilder in der DB.

Die Bilder existieren als gebundelte JPGs in `src/assets/demo/` (demo-berlin.jpg, demo-munich.jpg, demo-hamburg.jpg). Die Anreicherung in `SucheTab.tsx` (Zeile 244-257) funktioniert so:

```text
DB-Listings laden → mergedListings:
  1. demoListings aus useDemoListings() holen
  2. DB-Listings mit demoListings per property_id matchen
  3. Wenn DB-Listing kein Bild hat UND demoMatch ein Bild hat → Bild uebernehmen
```

**Das Problem:** `useDemoListings()` liefert nur Daten wenn `GP-PORTFOLIO` Toggle **aktiv** ist. Wenn der Toggle AUS ist, ist `demoListings` leer, und die Merge-Logik findet keine Bilder zum Anreichern.

**Die DB-Listings sind aber echte Datensaetze** (im Demo-Tenant c3123104), die unabhaengig vom Toggle geladen werden. Sie brauchen IMMER Bilder.

**Fix:** In `SucheTab.tsx` die Image-Anreicherung von der Toggle-Logik entkoppeln. Fuer bekannte Demo-Property-IDs (`d0000000-...`) die gebundelte `DEMO_IMAGES` Map direkt verwenden, unabhaengig davon ob `GP-PORTFOLIO` aktiv ist. Die `DEMO_IMAGES` Map und die Property-Code-Zuordnung aus `useDemoListings.ts` exportieren und in SucheTab importieren.

Konkret in der `mergedListings` useMemo (Zeile 244-257):
- Nach dem Demo-Match-Check: Wenn immer noch kein Bild, pruefen ob `property_id` in `DEMO_PROPERTY_IDS` liegt
- Wenn ja: Property-Code ermitteln (`BER-01`, `MUC-01`, `HH-01`) und das passende bundled Image direkt zuweisen
- Dafuer eine kleine Map exportieren: `DEMO_PROPERTY_IMAGE_MAP` die property_id → bundled image URL mappt

### Problem 2: Hardcodierte Demo-Werte in PortfolioTab (Screenshot 4)

`src/pages/portal/immobilien/PortfolioTab.tsx`, Zeilen 725-741: Das "Familie Mustermann" Widget zeigt hardcodierte Werte (3 Einheiten, 850k Verkehrswert, 520k Restschuld, 330k Nettovermoegen).

Im Golden Tenant (`a0000000-...`) gibt es 0 Properties, aber das Widget zeigt trotzdem Werte. Im Produktions-Tenant (`406f5f7a`, UNITYS GmbH) gibt es ebenfalls 0 Properties.

**Fix:** Die hardcodierten Zahlen durch dynamische Aggregation aus den tatsaechlich vorhandenen Demo-Properties ersetzen. Wenn keine Demo-Properties vorhanden sind, Widget ausblenden oder "0" zeigen.

### Problem 3: Alle Module-Freezes aufgehoben

`modules_freeze.json` hat alle 23 Module auf `frozen: false` gesetzt. Das war fuer die Upload-Harmonisierung noetig, aber der Freeze wurde danach nicht wiederhergestellt.

**Fix:** Alle Module ausser MOD-01 (Stammdaten), MOD-13 (Projekte) und MOD-22 (Pet Manager) zurueck auf `frozen: true` setzen. Diese drei bleiben offen, weil die Upload-Harmonisierung dort die Hook-Parameter angepasst hat.

### Problem 4: MOD-09 Beratung -- KEIN Auto-Calculate

Zur Klarstellung: MOD-09 Beratung funktioniert korrekt nach Design. Der Nutzer gibt seine Daten ein und klickt "Ergebnisse anzeigen". Es gibt kein Auto-Calculate und soll auch keines geben. Die 0-Euro-Anzeige auf Screenshot 2 zeigt den Zustand VOR der Berechnung -- das ist korrektes Verhalten.

---

## Implementierungsschritte

### Schritt 1: DEMO_IMAGES Map exportieren und Image-Fallback in SucheTab fixen

**Datei 1:** `src/hooks/useDemoListings.ts`
- `DEMO_IMAGES` Map exportieren (aktuell nur intern)
- Neue exportierte Map `DEMO_PROPERTY_IMAGE_MAP` anlegen: `property_id → bundled image URL`

**Datei 2:** `src/pages/portal/investments/SucheTab.tsx`
- Import `DEMO_PROPERTY_IMAGE_MAP` aus `useDemoListings`
- In `mergedListings` useMemo: Nach dem bestehenden Demo-Match-Check, wenn Listing immer noch kein `hero_image_path` hat, pruefen ob `property_id` in `DEMO_PROPERTY_IMAGE_MAP` liegt und das Bild direkt zuweisen
- Das macht die Bilder unabhaengig vom GP-PORTFOLIO Toggle verfuegbar fuer DB-Listings

### Schritt 2: PortfolioTab Demo-Widget dynamisieren

**Datei:** `src/pages/portal/immobilien/PortfolioTab.tsx` (Zeilen 725-741)
- Hardcodierte Werte (3, 850000, 520000, 330000) ersetzen durch Aggregation aus `unitsWithProperties` gefiltert auf Demo-Property-IDs
- Wenn keine Demo-Properties vorhanden: Widget trotzdem anzeigen aber mit 0-Werten, oder besser: Widget nur anzeigen wenn tatsaechlich Demo-Properties existieren

### Schritt 3: Module-Freeze wiederherstellen

**Datei:** `spec/current/00_frozen/modules_freeze.json`
- Alle Module auf `frozen: true` setzen
- Ausnahmen: MOD-01, MOD-13, MOD-22 bleiben `frozen: false` (Upload-Harmonisierung aktiv)
- Grund-Text: "Re-frozen after upload harmonization complete"

---

## Risikobewertung

| Schritt | Risiko | Begruendung |
|---------|--------|-------------|
| 1 - Image Fallback | NIEDRIG | Nur eine Map exportieren und eine Bedingung in useMemo ergaenzen. Kein Schema, kein DB-Change |
| 2 - Portfolio Widget | NIEDRIG | Nur Zahlenwerte ersetzen, kein Strukturchange |
| 3 - Freeze wiederherstellen | NIEDRIG | Nur JSON-Werte aendern |

Keine DB-Migrationen, keine RLS-Changes, keine neuen Abhaengigkeiten. Reine Frontend-Fixes.

