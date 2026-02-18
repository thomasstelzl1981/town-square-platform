
# Demo-Daten Loeschsperre: Analyse und Fix

## Ergebnis der Analyse

| Nr | Entitaet | Datei | Delete-Schutz fuer Demo? | Status |
|----|----------|-------|--------------------------|--------|
| 1 | Bankkonten | KontenTab.tsx | Demo-Widget hat keinen Delete-Button | OK |
| 2 | Immobilien | PropertyDetailPage.tsx | `!isDemo` Guard vor Trash2-Button | OK |
| 3 | Fahrzeuge | CarsFahrzeuge.tsx | `!vehicleIsDemo` Guard vor WidgetDeleteOverlay | OK |
| 4 | PV-Anlagen | AnlagenTab.tsx | WidgetDeleteOverlay auf ALLEN Plants — kein Demo-Guard | FEHLT |
| 5 | Mietvertraege | TenancyTab.tsx | Kein Demo-Check vorhanden | FEHLT |
| 6 | Zuhause | UebersichtTile.tsx | WidgetDeleteOverlay auf ALLEN Homes — kein Demo-Guard | FEHLT |
| 7 | Zuhause-Vertraege | MietyContractsSection.tsx | Kein Demo-Check vorhanden | FEHLT |

## 4 Dateien muessen angepasst werden

### 1. AnlagenTab.tsx (PV-Anlagen)
- WidgetDeleteOverlay nur rendern, wenn `!isDemoId(plant.id)`
- Pattern: `{!isDemoId(plant.id) && <WidgetDeleteOverlay ... />}`

### 2. TenancyTab.tsx (Mietvertraege)
- `isDemoId` importieren aus `@/engines/demoData/engine`
- WidgetDeleteOverlay nur rendern, wenn `!isDemoId(lease.id)`

### 3. UebersichtTile.tsx (Zuhause)
- Variable `isDemo` ist bereits vorhanden (`isDemoId(home.id)`)
- WidgetDeleteOverlay nur rendern, wenn `!isDemo`
- Pattern: `{!isDemo && <WidgetDeleteOverlay ... />}`

### 4. MietyContractsSection.tsx (Zuhause-Vertraege)
- `isDemoId` importieren
- WidgetDeleteOverlay nur rendern, wenn `!isDemoId(c.id)`

### Einheitliches Pattern
Alle 4 Fixes folgen demselben Muster: Die `WidgetDeleteOverlay`-Komponente wird in ein Conditional `{!isDemoId(entityId) && ...}` gewrappt. Demo-Entitaeten (IDs die mit `demo-` beginnen oder `__demo__` sind) bekommen keinen Loesch-Button.
