

# Fortschrittsanzeige fuer Demo-Daten Seeding

## Problem

Aktuell zeigt die DemoDatenTab-Seite waehrend des Seedings nur den statischen Text "Demo-Daten werden eingespielt..." ohne jegliche Fortschrittsanzeige. Der Prozess durchlaeuft ~30 Entity-Types sequenziell, dauert mehrere Sekunden, und der User sieht nicht, was gerade passiert.

## Loesung

Ein Progress-Callback wird durch die gesamte Kette gefuehrt: DemoDatenTab -> useDemoToggles -> seedDemoData. Jeder `seed()`-Aufruf meldet seinen Status zurueck, und die UI zeigt eine animierte Fortschrittsleiste mit dem aktuellen Entity-Namen.

## Aenderungen

### 1. `src/hooks/useDemoSeedEngine.ts`

- `seedDemoData` erhaelt einen optionalen `onProgress`-Callback-Parameter:
  ```typescript
  type SeedProgressCallback = (info: {
    current: number;
    total: number;
    percent: number;
    entityType: string;
    status: 'seeding' | 'done' | 'error';
  }) => void;

  export async function seedDemoData(
    tenantId: string,
    _landlordContextId?: string,
    onProgress?: SeedProgressCallback
  )
  ```
- Die innere `seed()`-Funktion bekommt einen Zaehler. Vor jedem Entity-Seed wird `onProgress` aufgerufen mit `status: 'seeding'`, danach mit `status: 'done'` oder `status: 'error'`.
- Die Gesamtanzahl der Seed-Schritte wird aus der Anzahl der `seed()`-Aufrufe berechnet (konstant ~30).

### 2. `src/hooks/useDemoToggles.ts`

- Neuer State: `seedProgress` mit `{ current, total, percent, entityType, status } | null`
- `toggleAll(true)` uebergibt eine `onProgress`-Callback-Funktion an `seedDemoData`, die `seedProgress` aktualisiert
- Export: `seedProgress` wird neben `isSeedingOrCleaning` zurueckgegeben

### 3. `src/pages/portal/stammdaten/DemoDatenTab.tsx`

- Importiert `Progress` aus `@/components/ui/progress`
- Waehrend `isSeedingOrCleaning && pendingAction === 'seeding'`:
  - Zeigt eine `Progress`-Bar mit dem Prozentwert aus `seedProgress`
  - Darunter: Text mit aktuellem Entity-Namen, z.B. "Schritt 12/30 — bank_transactions werden geladen..."
- Waehrend `pendingAction === 'cleaning'`:
  - Einfacher Hinweis "Demo-Daten werden entfernt..." (Cleanup ist schnell, braucht keine granulare Anzeige)

## Betroffene Dateien

| Datei | Aenderung |
|-------|----------|
| `src/hooks/useDemoSeedEngine.ts` | `onProgress`-Callback in `seedDemoData` + Zaehler in `seed()` |
| `src/hooks/useDemoToggles.ts` | Neuer `seedProgress`-State + Callback-Weiterleitung |
| `src/pages/portal/stammdaten/DemoDatenTab.tsx` | Progress-Bar + Entity-Status-Text im Global-Toggle-Bereich |

## Was sich NICHT aendert

- Keine neuen Dateien
- Keine Aenderung an der Seed-Logik selbst (Reihenfolge, CSVs, IDs bleiben identisch)
- Keine Aenderung an Cleanup-Logik
- Kein neues UI-Component noetig (`Progress` existiert bereits in `src/components/ui/progress.tsx`)

