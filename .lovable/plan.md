

# Analyse und Behebung: Demo-Daten, Modulzugriff und Rollenzuweisung

## Befund-Zusammenfassung

Es wurden 4 separate Probleme identifiziert:

| # | Problem | Ursache |
|---|---------|---------|
| 1 | "Familie Mustermann" erscheint im Portfolio | Demo-Toggles stehen standardmaessig auf ON fuer neue User. Hardcodierter Demo-Widget-Text im Code. |
| 2 | "Kernsanierung BER-01" erscheint unter Sanierung | Gleicher Toggle-Default. Zusaetzlich: Hardcodierte Demo-Daten im Code (DEMO_SCOPE_ITEMS, DEMO_PROVIDERS). |
| 3 | Finanzierungsmanager zeigt "Kein Zugriff" | Zugriffspruefung erlaubt nur `finance_manager` und `platform_admin` — `super_manager` fehlt in der Pruefung. |
| 4 | Pet Manager erscheint im Manager-Bereich | `areaConfig.ts` listet MOD-22 fest unter "operations", ohne zu pruefen ob der Tenant dieses Modul aktiviert hat. |

---

## Detaillierte Analyse

### Problem 1+2: Demo-Daten sichtbar obwohl nicht aktiviert

**Ursache in `src/hooks/useDemoToggles.ts`:**

```text
function loadToggles(): DemoToggles {
  ...
  // Wenn kein localStorage-Eintrag existiert → ALLE Toggles = true
  const defaults: DemoToggles = {};
  GOLDEN_PATH_PROCESSES.forEach(p => {
    defaults[p.id] = true;   // ← Problem: Default ist ON
  });
  return defaults;
}
```

Ein neuer User (rr@unitys.com) hat noch nie Toggles gesetzt. Daher stehen alle Demo-Prozesse (GP-PORTFOLIO, GP-SANIERUNG etc.) auf `true`. Die UI-Widgets in PortfolioTab und SanierungTab pruefen `isEnabled('GP-PORTFOLIO')` bzw. `isEnabled('GP-SANIERUNG')` und zeigen die hardcodierten Demo-Kacheln.

**Zusaetzlich: Demo Data Violations:**

`SanierungTab.tsx` enthaelt hardcodierte Arrays:
- `DEMO_SCOPE_ITEMS` (5 Positionen mit festen Kosten)
- `DEMO_PROVIDERS` (3 Anbieter mit festen Betraegen)

Dies widerspricht der "Zero Hardcoded Data" Governance, wird aber in diesem Plan NICHT umgebaut (groessere Refactoring-Aufgabe). Stattdessen wird das Symptom behoben: Demo-Toggles defaulten auf OFF.

### Problem 3: Finanzierungsmanager "Kein Zugriff"

**Ursache in `src/pages/portal/FinanzierungsmanagerPage.tsx`, Zeile 35:**

```text
const canAccess = isPlatformAdmin || memberships.some(m => m.role === 'finance_manager');
```

Die Rolle `super_manager` wird nicht geprueft. Laut `rolesMatrix.ts` hat `super_manager` Zugriff auf MOD-11 (Zeile 210, 258). Der Tile ist auch korrekt aktiviert (MOD-11 = active). Nur die Page-Level-Pruefung blockiert.

**Datenbank-Befund:**
- User `rr@unitys.com`: membership_role = `super_manager`, app_role = NULL
- Tiles: MOD-00 bis MOD-20 alle `active` (21 Module, korrekt)
- MOD-22 ist NICHT aktiviert (korrekt fuer super_manager)

### Problem 4: Pet Manager im Manager-Bereich sichtbar

**Ursache in `src/manifests/areaConfig.ts`, Zeile 41:**

```text
operations: {
  modules: ['MOD-13', 'MOD-09', 'MOD-11', 'MOD-12', 'MOD-10', 'MOD-22']
}
```

Die `AreaOverviewPage` rendert alle Module aus `areaConfig` ohne Pruefung gegen `tenant_tile_activation`. MOD-22 erscheint daher fuer jeden User, auch wenn der Tenant MOD-22 nicht aktiviert hat.

---

## Loesung

### Fix 1: Demo-Toggles standardmaessig auf OFF

**Datei:** `src/hooks/useDemoToggles.ts`

Default-Wert aendern von `true` auf `false`:

```text
GOLDEN_PATH_PROCESSES.forEach(p => {
  defaults[p.id] = false;   // Neu: Default ist OFF
});
```

Damit erscheinen Demo-Widgets nur, wenn der User sie bewusst aktiviert hat (ueber DemoDatenTab oder Zone 1 Admin).

### Fix 2: Finanzierungsmanager — super_manager Zugriff erlauben

**Datei:** `src/pages/portal/FinanzierungsmanagerPage.tsx`

Zeile 35 erweitern:

```text
// Alt:
const canAccess = isPlatformAdmin || memberships.some(m => m.role === 'finance_manager');

// Neu:
const canAccess = isPlatformAdmin || memberships.some(m =>
  m.role === 'finance_manager' || m.role === 'super_manager'
);
```

### Fix 3: AreaOverviewPage — Module nach Tenant-Aktivierung filtern

**Datei:** `src/pages/portal/AreaOverviewPage.tsx`

Die Module werden gegen die aktivierten Tiles des Tenants gefiltert. Dazu wird die bestehende `useAuth()`-Integration genutzt, um die `tenant_tile_activation` abzufragen. Module, die der Tenant nicht hat (z.B. MOD-22 fuer super_manager), werden ausgeblendet.

Konkret:
1. Tenant-Tiles via `useQuery` laden (oder bestehenden Hook nutzen)
2. `area.modules.filter(code => activatedTiles.includes(code))` vor dem Rendern

---

## Aenderungsuebersicht

| Datei | Aenderung | Freeze-Status |
|-------|-----------|---------------|
| `src/hooks/useDemoToggles.ts` | Default `false` statt `true` | Kein Modul-Pfad, frei |
| `src/pages/portal/FinanzierungsmanagerPage.tsx` | `super_manager` zur Zugriffspruefung hinzufuegen | MOD-11 Pfad — Freeze pruefen |
| `src/pages/portal/AreaOverviewPage.tsx` | Module nach Tenant-Aktivierung filtern | Kein Modul-Pfad, frei |

**Hinweis:** `FinanzierungsmanagerPage.tsx` liegt unter `src/pages/portal/finanzierungsmanager*` (MOD-11). Falls MOD-11 eingefroren ist, muss zuerst `UNFREEZE MOD-11` erfolgen. Dies wird vor der Implementierung geprueft.

## Ergebnis

- Portfolio und Sanierung zeigen keine Demo-Daten mehr fuer neue User
- Finanzierungsmanager ist fuer Super-Manager zugaenglich
- Pet Manager erscheint nur fuer User mit MOD-22-Aktivierung (pet_manager Rolle)

