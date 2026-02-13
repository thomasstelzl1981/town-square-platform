
# Reparatur: Portfolio Demo-Daten und Duplikate bereinigen

## Analyse-Ergebnis

### Problem 1: Doppelte Einheiten (6 statt 3)
Die DB enthaelt fuer jede der 3 Immobilien (Berlin, Muenchen, Hamburg) jeweils **zwei** Units:
- Eine "MAIN"-Unit (erzeugt durch einen frueheren Insert mit zufaelliger UUID)
- Eine "WE-xxx"-Unit (erzeugt durch die letzte Seed-Migration mit fester UUID)

Dadurch zeigt die Tabelle 6 Zeilen statt 3. Die "MAIN"-Units haben keine Leases und keine Miete.

### Problem 2: Demo-Akte nutzt `__demo__` IDs
Das Demo-Widget (Vermietereinheit Berlin) oeffnet eine `UnitDossierView` mit hartcodierten `propertyId: '__demo__'`, `unitId: '__demo__'`, `tenantId: '__demo__'`. Diese IDs haben keinen Bezug zu den echten DB-Eintraegen. Wenn man auf die Demo-Akte klickt und dann z.B. zur Detailseite navigieren will, gibt es keinen Treffer.

### Problem 3: Ladezustand
Die Seite laedt korrekt, aber mit einer kurzen Verzoegerung (ca. 3-5 Sekunden). Die Daten (KPIs, Charts, EUeR, Tabelle, Investmentkalkulation) werden alle korrekt angezeigt.

## Loesung

### Schritt 1: Doppelte MAIN-Units aus der DB entfernen (SQL-Migration)

Die 3 ueberfluessigen "MAIN"-Units loeschen (zufaellige UUIDs: `3fef3f17`, `491ffdb9`, `30669ba3`). Diese haben keine Leases und sind Duplikate.

```text
DELETE FROM units WHERE id IN (
  '3fef3f17-a244-4ec3-a58d-c71645d8e6a7',
  '491ffdb9-2005-45fe-9393-52cfc0e98bf2',
  '30669ba3-ccf2-4f0e-80f1-712a09e7472d'
);
```

### Schritt 2: Demo-Akte auf echte DB-IDs umstellen

In `src/pages/portal/immobilien/PortfolioTab.tsx`:

Die `DEMO_DOSSIER_DATA`-Konstante (Zeilen 664-750) bekommt die echten IDs aus der DB:
- `propertyId: 'd0000000-0000-4000-a000-000000000001'` (Berlin)
- `unitId: 'd0000000-0000-4000-b000-000000000001'` (WE-B01)
- `tenantId: 'a0000000-0000-4000-a000-000000000001'`

Ebenso wird `selectedDemoId` von `'__demo__'` auf die echte Property-ID umgestellt, damit der Klick auf das Demo-Widget die gleiche ID nutzt wie die DB-Eintraege.

### Betroffene Dateien
1. **DB-Migration**: Loeschen der 3 doppelten MAIN-Units
2. **`src/pages/portal/immobilien/PortfolioTab.tsx`**: Demo-IDs auf echte DB-UUIDs aendern

### Ergebnis nach Reparatur
- Tabelle zeigt **3 Einheiten** (WE-B01 Berlin, WE-M01 Muenchen, WE-H01 Hamburg)
- KPIs zeigen korrekte Werte (3 Einheiten, 995.000 EUR Verkehrswert)
- Demo-Widget oeffnet eine Akte mit echten DB-IDs
- Klick auf Tabellenzeile navigiert zur Immobilienakte mit korrekter Property-ID
