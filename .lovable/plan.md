

# Fix: Preisliste — Speichern-Button + DB-Persistierung

## Problem
Die Preisliste in `PortfolioTab.tsx` erlaubt Inline-Änderungen an Verkaufspreis, EUR/m² und Stellplatz, aber:
1. **Kein Speichern-Button** — Es gibt keinen Button, um die Änderungen zu persistieren
2. **Nur lokaler State** — `handleUnitPriceChange` schreibt in `unitOverrides` (React State), nicht in die Datenbank (`dev_project_units`)
3. **Vertrieb-Sync findet nichts** — `syncProjectToListings` liest aus `dev_project_units`, aber dort stehen noch die alten Werte

## Lösung

### 1. Speichern-Button hinzufügen (`PortfolioTab.tsx`)
- Einen "Preisliste speichern" Button anzeigen, sobald `unitOverrides` oder `unitStatusOverrides` nicht leer sind (= es gibt ungespeicherte Änderungen)
- Button-Klick ruft eine Mutation auf, die alle geänderten Units per `supabase.from('dev_project_units').update()` aktualisiert
- Felder: `list_price`, `price_per_sqm`, `status`
- Nach erfolgreichem Speichern: `queryClient.invalidateQueries({ queryKey: ['dev_project_units', selectedProjectId] })` + Overrides zurücksetzen
- Visueller Hinweis (Badge/Dot) dass ungespeicherte Änderungen vorhanden sind

### 2. Status-Mapping korrigieren
- Aktuell wird der Status beim Lesen gemappt (`verkauft` → `sold`), aber beim Speichern muss er zurückgemappt werden, da die DB ggf. deutsche Werte erwartet
- Prüfung des tatsächlichen DB-Schemas für das `status`-Feld

### Dateien
- **Edit:** `src/pages/portal/projekte/PortfolioTab.tsx` — Save-Button + Mutation + Query-Invalidierung + Overrides-Reset

### Kein DB-Change nötig
Die Tabelle `dev_project_units` hat bereits die Spalten `list_price`, `price_per_sqm`, `status`.

