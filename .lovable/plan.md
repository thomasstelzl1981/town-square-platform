
# Fix: "Kampagnen Leads" aus System-Kategorie entfernen

## Problem

Die Route `lead-desk/kampagnen` erscheint als eigener Menuepunkt unter "System" in der Sidebar, weil zwei Stellen in `AdminSidebar.tsx` den `lead-desk/`-Prefix nicht korrekt behandeln:

1. **`categorizeRoute()`** (Zeile 153): Prueft nur `path === 'lead-desk'` (exakter Match). `lead-desk/kampagnen` faellt durch zum Default `return 'system'` (Zeile 169).
2. **`shouldShowInNav()`** (Zeile 197-205): Alle anderen Desks haben einen `path.startsWith('xxx/')` Filter — `lead-desk/` fehlt in dieser Liste.

## Loesung

Eine Datei, zwei kleine Aenderungen in `src/components/admin/AdminSidebar.tsx`:

### Aenderung 1: `categorizeRoute()` — Zeile 152-154

```text
VORHER:
if (path.startsWith('sales-desk') || path.startsWith('finance-desk') || 
     path.startsWith('acquiary') || path === 'lead-desk' || path === 'projekt-desk' ||
     path.startsWith('pet-desk'))

NACHHER:
if (path.startsWith('sales-desk') || path.startsWith('finance-desk') || 
     path.startsWith('acquiary') || path.startsWith('lead-desk') || path.startsWith('projekt-desk') ||
     path.startsWith('pet-desk'))
```

`path === 'lead-desk'` wird zu `path.startsWith('lead-desk')` — damit werden auch Sub-Routen wie `lead-desk/kampagnen` korrekt als "desks" kategorisiert.

Gleiches fuer `projekt-desk` (vorbeugend): `path === 'projekt-desk'` wird zu `path.startsWith('projekt-desk')`.

### Aenderung 2: `shouldShowInNav()` — Zeile 197-205

`lead-desk/` in die Sub-Route-Filterliste aufnehmen:

```text
VORHER:
if (path.includes('/') && (
  path.startsWith('sales-desk/') ||
  path.startsWith('finance-desk/') ||
  path.startsWith('acquiary/') ||
  path.startsWith('projekt-desk/') ||
  path.startsWith('pet-desk/')
))

NACHHER:
if (path.includes('/') && (
  path.startsWith('sales-desk/') ||
  path.startsWith('finance-desk/') ||
  path.startsWith('acquiary/') ||
  path.startsWith('lead-desk/') ||
  path.startsWith('projekt-desk/') ||
  path.startsWith('pet-desk/')
))
```

## Ergebnis

- "Kampagnen Leads" verschwindet aus der "System"-Kategorie in der Sidebar
- Der Lead Desk hat weiterhin genau einen Sidebar-Eintrag unter "Operative Desks"
- Die Tab-Navigation innerhalb des Lead Desks (Website Leads / Kampagnen Leads) bleibt unveraendert
