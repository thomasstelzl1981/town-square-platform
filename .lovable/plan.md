

# Fix: Zone 1 Sidebar — Doppelte Kontakte & falsch eingeordnete Desks

## Problem-Analyse

Die `AdminSidebar.tsx` hat zwei Filter-Funktionen (`getGroupKey` und `shouldShowInNav`), die bestimmen, wo Menuepunkte erscheinen. Drei Desks wurden zwar in `routesManifest.ts` und `Zone1Router.tsx` registriert, aber NICHT in der Sidebar-Logik nachgezogen:

| Desk | Ist-Zustand | Soll-Zustand |
|------|-------------|--------------|
| `ncore-desk` + `/kontakte` + `/monitor` | Erscheint unter **System** (3 Eintraege!) | Nur Top-Level unter **Operative Desks** |
| `otto-desk` + `/kontakte` + `/inbox` + `/monitor` | Erscheint unter **System** (4 Eintraege!) | Nur Top-Level unter **Operative Desks** |
| `commpro-desk` | Erscheint unter **System** | Nur Top-Level unter **Operative Desks** |

Das erklaert:
- **Doppelte "Kontakte"** unter System = `ncore-desk/kontakte` + `otto-desk/kontakte` als eigene Menue-Eintraege
- **NcoreDesk, Otto² unter System** statt Operative Desks = fehlender Prefix-Check in `getGroupKey`
- **"Compute Desk"** = vermutlich `commpro-desk` (CommPro Desk), ebenfalls falsch einsortiert

## Aenderungen (1 Datei: `src/components/admin/AdminSidebar.tsx`)

### 1. `getGroupKey()` — Desk-Prefix-Check erweitern (Zeile 152-154)

Aktuell fehlen `ncore-desk`, `otto-desk`, `commpro-desk` in der Bedingung. Hinzufuegen:

```typescript
if (path.startsWith('sales-desk') || path.startsWith('finance-desk') || 
     path.startsWith('acquiary') || path.startsWith('lead-desk') || path.startsWith('projekt-desk') ||
     path.startsWith('pet-desk') || path.startsWith('service-desk') ||
     path.startsWith('ncore-desk') || path.startsWith('otto-desk') || path.startsWith('commpro-desk')) {
  return 'desks';
}
```

### 2. `shouldShowInNav()` — Top-Level Desk-Eintraege (Zeile 181-183)

Nur die Haupteintraege sollen in der Sidebar sichtbar sein:

```typescript
if (path === 'sales-desk' || path === 'finance-desk' || path === 'acquiary' || 
    path === 'futureroom' || path === 'lead-desk' || 
    path === 'projekt-desk' || path === 'pet-desk' || path === 'service-desk' ||
    path === 'ncore-desk' || path === 'otto-desk' || path === 'commpro-desk') {
  return true;
}
```

### 3. `shouldShowInNav()` — Sub-Route-Filter (Zeile 201-209)

Sub-Routen der neuen Desks muessen ausgeblendet werden:

```typescript
if (path.includes('/') && (
  path.startsWith('sales-desk/') || path.startsWith('finance-desk/') ||
  path.startsWith('acquiary/') || path.startsWith('lead-desk/') ||
  path.startsWith('projekt-desk/') || path.startsWith('pet-desk/') ||
  path.startsWith('service-desk/') ||
  path.startsWith('ncore-desk/') || path.startsWith('otto-desk/') || path.startsWith('commpro-desk/')
)) {
  return false;
}
```

### 4. `ICON_MAP` — Icons fuer die neuen Desks (optional, aktuell fallback auf LayoutDashboard)

```typescript
'NcoreDeskRouter': Globe,
'OttoDeskRouter': Landmark,
'CommProDeskRouter': Bot,
```

## Ergebnis nach Fix

**Operative Desks** (Sidebar-Gruppe):
- Future Room, Acquiary, Sales Desk, Finance Desk, Lead Desk, Projekt Desk, Pet Desk, Service Desk, **Ncore Desk**, **Otto² Advisory Desk**, **CommPro Desk**

**System** (Sidebar-Gruppe):
- Integrationen, Oversight, Audit Hub (nur noch 3 Eintraege, keine Kontakte mehr)

