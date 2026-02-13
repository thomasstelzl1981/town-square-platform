

# Reparatur: Demo-Daten bei deaktiviertem Demo-Toggle ausblenden

## Problem

Die 3 Demo-Immobilien (Berlin, Muenchen, Hamburg) sind echte DB-Eintraege mit dem gleichen `tenant_id` wie die Organisation. Es gibt kein Merkmal, um sie von "echten" Nutzerdaten zu unterscheiden. Wenn der Demo-Toggle (GP-PORTFOLIO) deaktiviert wird, zeigt das Portfolio trotzdem alle 3 Objekte — es sollte aber leer sein.

## Ursache

Die Supabase-Query in `PortfolioTab.tsx` (Zeile 162) laedt **alle** Units/Properties fuer den `activeTenantId`. Es gibt keine Spalte `is_demo` oder aehnliches, um Demo-Daten zu filtern.

## Loesung: `is_demo`-Flag auf `properties`-Tabelle

### Schritt 1: DB-Migration

Neue Spalte `is_demo` (boolean, default false) auf der `properties`-Tabelle:

```text
ALTER TABLE properties ADD COLUMN is_demo boolean NOT NULL DEFAULT false;

UPDATE properties SET is_demo = true WHERE id IN (
  'd0000000-0000-4000-a000-000000000001',
  'd0000000-0000-4000-a000-000000000002',
  'd0000000-0000-4000-a000-000000000003'
);
```

### Schritt 2: Query-Filter in PortfolioTab.tsx

In der Units-Query (Zeile 183-184) eine Bedingung hinzufuegen:

- Wenn `demoEnabled` = true: keine Einschraenkung (alle laden)
- Wenn `demoEnabled` = false: `.eq('properties.is_demo', false)` — nur echte Daten laden

Da `demoEnabled` sich aendern kann, muss es in den `queryKey` aufgenommen werden, damit React Query bei Toggle-Wechsel neu laedt.

Konkret:
- `queryKey` aendern zu: `['portfolio-units-annual', activeTenantId, demoEnabled]`
- In der Query: `if (!demoEnabled) query = query.eq('properties.is_demo', false);`
- Gleiche Logik fuer die `loans`-Query (Zeile ca. 230)

### Schritt 3: Demo-Widget-Sichtbarkeit

Das Demo-Widget (Zeile 767) ist bereits korrekt hinter `demoEnabled` geschuetzt. Keine Aenderung noetig.

### Ergebnis

- Demo AN: Portfolio zeigt alle 3 Objekte + Demo-Widget + Charts + Tabelle
- Demo AUS: Portfolio ist leer (leerer Zustand, "Noch keine Immobilien"), kein Demo-Widget
- Sobald echte Nutzerdaten angelegt werden, erscheinen diese unabhaengig vom Demo-Toggle

### Betroffene Dateien
1. **DB-Migration**: `ALTER TABLE properties ADD COLUMN is_demo`
2. **`src/pages/portal/immobilien/PortfolioTab.tsx`**: Query-Filter + queryKey erweitern
