

## Menüreiter umbenennen: "Systemgebühr" → "Provisionen"

### Aenderung

In `src/manifests/routesManifest.ts` werden zwei Tile-Titel angepasst:

| Modul | Zeile | Alt | Neu |
|-------|-------|-----|-----|
| MOD-09 (Immomanager) | 362 | `title: "Systemgebühr"` | `title: "Provisionen"` |
| MOD-12 (Akquisemanager) | 430 | `title: "Systemgebühr"` | `title: "Provisionen"` |

Die Route-Pfade (`systemgebuehr`) und Component-Namen bleiben unveraendert — nur der im Menue angezeigte Titel aendert sich.

MOD-11 (Finanzierungsmanager) heisst bereits "Provisionen" und bleibt unveraendert.

### Betroffene Datei

- `src/manifests/routesManifest.ts` — 2 Zeilen (Title-Strings)

