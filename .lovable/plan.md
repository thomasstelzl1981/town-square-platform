
# Abgleich Armstrong Actions: Manifest vs. Zone 2 vs. Zone 1

## Analyse-Ergebnis

### Drei Darstellungen derselben Daten

Das System zeigt die Armstrong-Actions an drei Stellen:

1. **Manifest (SSOT)**: `src/manifests/armstrongManifest.ts` -- definiert aktuell ca. 80+ Actions (davon 41 Coach-Actions fuer MOD-08 Slideshows/Engine)
2. **Zone 1 Admin-Konsole**: `src/pages/admin/armstrong/ArmstrongActions.tsx` -- liest Manifest UND DB-Overrides, zeigt `effective_status`
3. **Zone 2 Stammdaten/Abrechnung**: `src/pages/portal/communication-pro/agenten/AktionsKatalog.tsx` -- liest NUR das statische Manifest, KEINE DB-Overrides

### Gefundene Diskrepanzen

**Problem 1: Zone 2 ignoriert Admin-Overrides (KRITISCH)**

Die `AktionsKatalog`-Komponente in Zone 2 (eingebettet in Stammdaten > Abrechnung) importiert `armstrongActions` direkt aus dem Manifest und zeigt den statischen `status`. Wenn ein Admin in Zone 1 eine Action per Override auf "disabled" oder "restricted" setzt, sieht der User in Zone 2 weiterhin "Aktiv". Das ist ein Governance-Bruch.

| Darstellung | Datenquelle | Override-Sichtbarkeit |
|-------------|-------------|----------------------|
| Zone 1 (Admin) | Manifest + DB-Overrides via `useArmstrongActions` Hook | Ja -- zeigt "Override"-Badge |
| Zone 2 (User) | Nur statisches Manifest (`armstrongActions`) | Nein -- zeigt immer Manifest-Status |

**Problem 2: Fehlende Filter in Zone 2**

Zone 1 bietet Filter fuer Modul, Zone, Risiko und Status. Zone 2 hat nur Zone und Status -- es fehlen Modul- und Risiko-Filter. Fuer den End-User sind diese zwar weniger kritisch, aber fuer Konsistenz waere ein Modul-Filter sinnvoll.

**Problem 3: ArmstrongIntegrations.tsx nicht exportiert**

Die Datei `src/pages/admin/armstrong/ArmstrongIntegrations.tsx` existiert, wird aber nicht in `index.ts` exportiert. Das bedeutet, sie ist eine tote Datei und ueber das Routing nicht erreichbar.

**Problem 4: Keine Detail-Ansicht in Zone 2**

Zone 1 hat einen Detail-Dialog (Klick auf Eye-Icon) mit allen Metadaten (Scopes, API-Contract, Side Effects etc.). Zone 2 zeigt nur die Kartenansicht ohne Detail-Drill-Down.

### Was KONSISTENT ist (kein Handlungsbedarf)

- Beide Ansichten lesen aus demselben Manifest (SSOT-Prinzip intakt)
- Die `KostenDashboard`-Komponente in Zone 2 liest korrekt aus `armstrong_billing_events` (DB)
- Zone 1 hat korrekte Override-Logik mit `useArmstrongActions` Hook
- Die WhatsApp-Armstrong-Card in Zone 2 ist korrekt im Abrechnung-Tab positioniert

## Umsetzungsplan

### Schritt 1: Zone 2 AktionsKatalog auf useArmstrongActions umstellen

Die `AktionsKatalog`-Komponente (`src/pages/portal/communication-pro/agenten/AktionsKatalog.tsx`) wird von statischem Manifest-Import auf den `useArmstrongActions`-Hook umgestellt. Damit sieht der User den `effective_status` inklusive Admin-Overrides.

Aenderungen:
- Import von `useArmstrongActions` statt direktem `armstrongActions`-Import
- Status-Badge zeigt `effective_status` statt `status`
- Deaktivierte Actions werden visuell gedimmt dargestellt
- Optional: "Eingeschraenkt"-Badge bei restricted Actions

### Schritt 2: ArmstrongIntegrations in index.ts exportieren

Die fehlende Export-Zeile in `src/pages/admin/armstrong/index.ts` wird ergaenzt:

```text
export { default as ArmstrongIntegrations } from './ArmstrongIntegrations';
```

Falls die Routing-Konfiguration diese Seite noch nicht verlinkt, wird sie als verfuegbar registriert.

### Schritt 3: Modul-Filter in Zone 2 ergaenzen (optional)

Ein Modul-Filter-Dropdown wird zur Zone 2 AktionsKatalog hinzugefuegt, damit User nach Modulen filtern koennen. Dies ist eine UX-Verbesserung, keine kritische Governance-Massnahme.

## Technische Details

### Schritt 1 -- Konkrete Code-Aenderung

In `AktionsKatalog.tsx`:

Vorher:
```text
import { armstrongActions } from '@/manifests/armstrongManifest';
// ...
const filtered = armstrongActions.filter(...)
```

Nachher:
```text
import { useArmstrongActions } from '@/hooks/useArmstrongActions';
// ...
const { actions, isLoading } = useArmstrongActions();
const filtered = actions.filter(...)
// Status-Badge nutzt action.effective_status statt action.status
```

### Schritt 2 -- Export ergaenzen

Eine Zeile in `index.ts` hinzufuegen.

### Kein SQL noetig

Alle Aenderungen sind rein client-seitig. Die DB-Struktur (armstrong_action_overrides) existiert bereits und wird korrekt befuellt.

## Ergebnis nach Umsetzung

- Zone 2 User sehen den tatsaechlichen, governance-konformen Status jeder Action
- Admin-Overrides greifen sofort in Zone 1 UND Zone 2
- Tote Datei (ArmstrongIntegrations) wird erreichbar
- Konsistente Darstellung ueber alle Zonen
