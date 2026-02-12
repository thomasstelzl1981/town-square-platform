
# MOD-20 Miety Refactoring Plan

## Problemstellung

Die Datei `MietyPortalPage.tsx` ist ein **1.089-Zeilen-Monolith**, der 5 vollstaendige Tile-Komponenten, Hilfskomponenten und den Router in einer einzigen Datei vereint. Das widerspricht dem Plattform-Standard (PageShell + Lazy-Loading) und erschwert Wartung und Testing.

## Ist-Zustand (1 Datei, 1.089 Zeilen)

```text
MietyPortalPage.tsx
+-- TileShell (eigener Wrapper, NICHT PageShell)
+-- useHomesQuery()
+-- NoHomeBanner
+-- UebersichtTile        (~240 Zeilen)
+-- VersorgungTile         (~130 Zeilen)
+-- VersicherungenTile     (~130 Zeilen)
+-- EufyConnectCard        (~90 Zeilen)
+-- SmartHomeTile          (~90 Zeilen)
+-- KommunikationTile      (~160 Zeilen)
+-- Router (Routes)        (~20 Zeilen)
```

Bestehende Sub-Dateien in `miety/components/` (bleiben unveraendert):
- ContractDrawer, MeterReadingDrawer, MietyCreateHomeForm
- MietyContractsSection, MietyDocTree, MietyDossierHeader
- MietyMeterSection, MietyOverviewSection, UploadDrawer
- MietyHomeDossier.tsx (bereits lazy-loaded)

## Soll-Zustand (7 Dateien)

```text
MietyPortalPage.tsx              (~30 Zeilen: Router + Lazy-Imports)
miety/
  tiles/
    UebersichtTile.tsx           (~250 Zeilen)
    VersorgungTile.tsx           (~140 Zeilen)
    VersicherungenTile.tsx       (~140 Zeilen)
    SmartHomeTile.tsx             (~180 Zeilen, inkl. EufyConnectCard)
    KommunikationTile.tsx        (~170 Zeilen)
  shared/
    useHomesQuery.ts             (~20 Zeilen: shared hook)
    NoHomeBanner.tsx              (~20 Zeilen: shared component)
    TileShell.tsx                 (~15 Zeilen: temporaer behalten, spaeter durch PageShell ersetzen)
  components/                    (bestehend, unveraendert)
  MietyHomeDossier.tsx           (bestehend, unveraendert)
```

## Massnahmen

### 1. Shared-Elemente extrahieren
- `useHomesQuery` Hook nach `miety/shared/useHomesQuery.ts`
- `NoHomeBanner` Komponente nach `miety/shared/NoHomeBanner.tsx`
- `TileShell` nach `miety/shared/TileShell.tsx` (identischer Code, nur eigene Datei)
- `demoCameras` Array nach `miety/shared/demoCameras.ts`

### 2. Tiles in eigene Dateien verschieben
Jede der 5 Tile-Funktionen wird 1:1 in eine eigene Datei unter `miety/tiles/` verschoben:

| Tile | Zeilen (ca.) | Besonderheit |
|------|-------------|--------------|
| UebersichtTile | 240 | Auto-Create, Kamera-Grid, Map-Embeds |
| VersorgungTile | 140 | IST/SOLL-Paare, Zaehlerstaende |
| VersicherungenTile | 140 | IST/SOLL-Paare, Neo Digital |
| SmartHomeTile | 180 | EufyConnectCard wird inline behalten |
| KommunikationTile | 170 | WhatsApp, E-Mail, KI-Uebersetzer |

### 3. Router verschlanken
`MietyPortalPage.tsx` wird auf ~30 Zeilen reduziert:
- 5 Lazy-Imports fuer die Tiles
- 1 Lazy-Import fuer MietyHomeDossier (bereits vorhanden)
- Standard-Router mit `React.Suspense` und Spinner

### 4. Kein Verhaltensaenderung
- Alle Props, State, Queries und UI bleiben identisch
- Keine Aenderung an Routing-Pfaden
- Keine Aenderung an bestehenden `miety/components/`
- TileShell bleibt vorerst erhalten (PageShell-Migration ist separater Sprint)

## Technische Details

- **Neue Dateien:** 8 (5 Tiles + 3 Shared)
- **Geaenderte Dateien:** 1 (MietyPortalPage.tsx)
- **Geloeschte Dateien:** 0
- **Risiko:** Niedrig (reines Code-Splitting ohne Logik-Aenderung)
- **Geschaetzter Aufwand:** 1 Implementierungs-Nachricht
