
# Audit: Operative Desks — Routing, Zone-2 und Zone-3 Verschaltung

## Ergebnis-Zusammenfassung

| Desk | Routing | Z2-Mapping | Z3-Mapping | Status |
|------|---------|------------|------------|--------|
| Sales Desk | OK | MOD-09 OK | Kaufy OK | Funktional |
| Finance Desk | OK | MOD-18 OK | Kein Z3 (korrekt) | Funktional |
| Acquiary | OK | MOD-12 OK | Acquiary Website OK | Funktional |
| Projekt Desk | OK | MOD-13 OK | Landing Pages OK | Funktional |
| Pet Desk | OK | MOD-22 OK | Lennox Website OK | Funktional |
| FutureRoom | OK | MOD-11 OK | FutureRoom Website OK | Funktional |
| **Lead Desk** | **DEFEKT** | MOD-10 OK | Kaufy/SoT OK | **Routing-Bug** |

---

## Gefundene Probleme

### 1. KRITISCH: Lead Desk fehlt in `adminDeskMap` (ManifestRouter.tsx)

**Datei:** `src/router/ManifestRouter.tsx`, Zeile 274-280

Der `adminDeskMap` enthaelt alle Desks **ausser Lead Desk**:
```
const adminDeskMap = {
  'sales-desk': SalesDesk,
  'finance-desk': FinanceDesk,
  acquiary: Acquiary,
  'projekt-desk': ProjektDeskComponent,
  'pet-desk': PetmanagerDesk,
  // 'lead-desk': FEHLT!
};
```

**Auswirkung:** Lead Desk wird nicht ueber den Desk-Router (mit `/*` Wildcard) geladen, sondern faellt durch auf die Standard-Admin-Routes. Dort wird `LeadDeskDashboard` als flache Route ohne `/*` gemountet. Das bedeutet: **Alle Sub-Tabs (Kontakte, Pool, Zuweisungen, Provisionen, Monitor) sind nicht erreichbar** — beim Klick auf einen Tab wird eine Weiterleitung zum Dashboard ausgeloest.

### 2. KRITISCH: Lead Desk fehlt im Skip-Filter (ManifestRouter.tsx)

**Datei:** `src/router/ManifestRouter.tsx`, Zeile 517

Der Skip-Filter verhindert Doppel-Routing fuer Desks, aber `lead-desk` ist nicht enthalten:
```
if (['futureroom', 'sales-desk', 'finance-desk', 'acquiary', 'projekt-desk', 'pet-desk'].some(...)
// 'lead-desk' FEHLT!
```

**Auswirkung:** Die `routesManifest.ts`-Eintraege fuer `lead-desk/*` werden zusaetzlich als flache Routes gerendert, was zu Routing-Konflikten fuehrt.

### 3. MINOR: Pet Desk zeigt `moduleCode="MOD-05"` statt `MOD-22`

**Datei:** `src/pages/admin/desks/PetmanagerDesk.tsx`, Zeile 53

Der OperativeDeskShell zeigt `MOD-05` (das Client-Modul "Pets") statt `MOD-22` (das Manager-Modul "Pet Manager"). Laut `operativeDeskManifest.ts` ist der Manager-Module-Code `MOD-22`.

### 4. MINOR: Finance Desk zeigt `moduleCode="MOD-18"` — kein Manager-Modul

**Datei:** `src/pages/admin/desks/FinanceDesk.tsx`, Zeile 50

Finance Desk hat laut Manifest keinen `managerModuleCode` (leer), sondern nur `clientModuleCode: 'MOD-18'`. Das ist korrekt so dargestellt, aber der `zoneFlow` zeigt `z2Manager: 'Finanzberater (Manager)'` — es gibt kein zugeordnetes Manager-Modul. Das ist ein semantischer Widerspruch, aber kein funktionaler Bug.

---

## Fix-Plan

### Fix 1: Lead Desk in `adminDeskMap` eintragen

In `src/router/ManifestRouter.tsx`, Zeile 274-280:

```typescript
const adminDeskMap: Record<string, React.ComponentType> = {
  'sales-desk': SalesDesk,
  'finance-desk': FinanceDesk,
  acquiary: Acquiary,
  'lead-desk': LeadDeskComponent,        // NEU
  'projekt-desk': ProjektDeskComponent,
  'pet-desk': React.lazy(...),
};
```

### Fix 2: Lead Desk in Skip-Filter eintragen

In `src/router/ManifestRouter.tsx`, Zeile 517:

```typescript
if (['futureroom', 'sales-desk', 'finance-desk', 'acquiary', 'projekt-desk', 'pet-desk', 'lead-desk'].some(desk => route.path.startsWith(desk))) {
```

### Fix 3: Pet Desk `moduleCode` korrigieren

In `src/pages/admin/desks/PetmanagerDesk.tsx`, Zeile 53:

```typescript
moduleCode="MOD-22"    // statt "MOD-05"
```

---

## Zusammenfassung der Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/router/ManifestRouter.tsx` (Zeile 274) | `'lead-desk': LeadDeskComponent` in `adminDeskMap` einfuegen |
| `src/router/ManifestRouter.tsx` (Zeile 517) | `'lead-desk'` zum Skip-Filter hinzufuegen |
| `src/pages/admin/desks/PetmanagerDesk.tsx` (Zeile 53) | `moduleCode` von `MOD-05` auf `MOD-22` aendern |

Alle anderen 6 Desks (Sales, Finance, Acquiary, Projekt, Pet, FutureRoom) sind korrekt geroutet und mit Zone 2 und Zone 3 verschaltet.
