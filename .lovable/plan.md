

# Immobilien-Menuestruktur aendern und Bewertung in die Akte verschieben

## Aktuelle Reihenfolge der Tiles (Level 3)
1. Portfolio (default)
2. Sanierung
3. Bewertung
4. Verwaltung
5. Haus

## Neue Reihenfolge
1. Haus
2. Portfolio
3. Verwaltung
4. Sanierung
5. ~~Bewertung~~ (entfaellt als eigener Menuepunkt)

## Wo geht die Bewertung hin?

Die Bewertungsfunktion wird als neuer Tab **"Bewertung"** in die **Immobilienakte** (`PropertyDetailPage.tsx`) integriert — direkt neben dem bestehenden Tab "Verkaufsauftrag". Das ist logisch, weil die Bewertung immer objektbezogen ist.

```text
Akte | Simulation | Expose | Verkaufsauftrag | Bewertung | Mietverhaeltnis | Datenraum
```

## Aenderungen

### 1. `src/manifests/routesManifest.ts` — Tiles umordnen, Bewertung entfernen

- Tile-Reihenfolge aendern zu: Haus, Portfolio, Verwaltung, Sanierung
- `{ path: "haus", ... }` an Position 1 setzen und `default: true` geben
- `{ path: "portfolio", ... }` an Position 2 (default entfernen)
- `{ path: "verwaltung", ... }` an Position 3
- `{ path: "sanierung", ... }` an Position 4
- Bewertung-Tile komplett entfernen
- Kommentar in Zeile 9 aktualisieren (nun 4 Tiles)

### 2. `src/pages/portal/ImmobilienPage.tsx` — Bewertung-Route entfernen

- Lazy-Import fuer `BewertungTab` entfernen
- `<Route path="bewertung" ...>` entfernen

### 3. `src/pages/portal/immobilien/PropertyDetailPage.tsx` — Neuer "Bewertung"-Tab

- Neuen Tab "Bewertung" in die TabsList einfuegen (nach "Verkaufsauftrag")
- `BewertungTab`-Inhalt als `TabsContent` rendern, jedoch ohne eigene PageShell/ModulePageHeader (die kommen von PropertyDetailPage)
- Dazu eine neue schlanke Inline-Komponente `PropertyValuationTab` erstellen, die die Queries aus `BewertungTab.tsx` nutzt, aber nur fuer die aktuelle Property (gefiltert auf `property.id`)

### 4. `src/pages/portal/immobilien/index.ts` — Export bereinigen

- `BewertungTab` Export entfernen

### 5. `src/pages/portal/immobilien/BewertungTab.tsx` — Kann bestehen bleiben oder entfernt werden

- Datei wird nicht mehr referenziert; perspektivisch entfernen
- Fuer jetzt: Import entfernen reicht

### Keine Datenbank-Aenderungen

Rein navigatorisches und UI-Refactoring.

