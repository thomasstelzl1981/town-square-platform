
# Testdaten-Panel Reparatur

## Problem

Das Testdaten-Panel unter `/admin/tiles?tab=testdata` verwendet ein veraltetes Seeding-System (`useGoldenPathSeeds`) mit eigenen UUIDs (`00000000-*`), das nicht mit dem aktuellen Demo-Daten-SSOT (`useDemoSeedEngine` + CSV-Dateien) synchron ist.

**Konkret:**
- Panel zeigt: 5 Kontakte, 1 Immobilie, 12 Dokumente (alte Golden Path Seeds)
- SSOT definiert: 5 Kontakte, 3 Immobilien, 3 Einheiten, 3 Mietvertraege, 3 Darlehen, 100 Transaktionen, 4 Haushaltspersonen, 2 Fahrzeuge, 1 PV-Anlage, 7 Versicherungen, 6 Vorsorgevertraege, 8 Abonnements, 4 KV-Vertraege, 2 Privatkredite, 1 Miety-Home, 4 Miety-Vertraege, 1 Akquise-Mandat, 3 Pet-Kunden, 5 Haustiere, 5 Pet-Buchungen
- Zwei verschiedene UUID-Bereiche (`00000000-*` vs `d0000000-*`) erzeugen Doppelungen

## Loesung

Das TestDataManager-Panel wird auf das aktuelle SSOT-System umgestellt:

### 1. Golden Path Sektion ersetzen

Die aktuelle "Golden Path Demo-Daten"-Karte wird durch eine neue "Demo-Daten SSOT"-Karte ersetzt, die:

- **Manifest liest**: Entity-Typen und Soll-Zaehler aus `public/demo-data/demo_manifest.json`
- **Ist-Zaehler zeigt**: Aktuelle DB-Counts pro Entity-Typ (aus den richtigen Tabellen laut Manifest)
- **Seed-Button**: Ruft `useDemoSeedEngine.seedAll()` auf (statt `seed_golden_path_data` RPC)
- **Cleanup-Button**: Ruft `useDemoCleanup` auf (statt `cleanup_golden_path_data` RPC)
- **Status-Grid**: Zeigt alle 21 Entity-Typen mit Soll/Ist-Vergleich und farblicher Markierung (gruen = komplett, gelb = teilweise, rot = leer)

### 2. Zaehler-Logik anpassen

Neuer Hook oder Inline-Logik, die Counts aus den korrekten Tabellen holt:

```text
Entity               DB-Tabelle              Soll
-------------------------------------------------------
contacts             contacts                5
properties           properties              3
units                units                   3
leases               leases                  3
loans                loans                   3
bank_accounts        msv_bank_accounts       1
bank_transactions    bank_transactions       100
household_persons    household_persons       4
vehicles             cars_vehicles           2
pv_plants            pv_plants               1
insurance_contracts  insurance_contracts     7
kv_contracts         kv_contracts            4
vorsorge_contracts   vorsorge_contracts      6
user_subscriptions   user_subscriptions      8
private_loans        private_loans           2
miety_homes          miety_homes             1
miety_contracts      miety_contracts         4
acq_mandates         acq_mandates            1
pet_customers        pet_customers           3
pets                 pets                    5
pet_bookings         pet_bookings            5
```

### 3. KI-Excel-Import beibehalten

Der zweite Teil des Panels (KI-gestuetzter Excel-Import) bleibt unveraendert -- er ist funktional und unabhaengig vom Demo-System.

### 4. Aktive Test-Batches beibehalten

Die Batch-Uebersicht (test_data_registry) bleibt ebenfalls, da sie fuer den Excel-Import relevant ist.

### 5. Aufraeum-Arbeiten

- Import von `useGoldenPathSeeds` aus dem TestDataManager entfernen
- `fetchGoldenPathCounts`-Aufruf entfernen
- Alte Zaehler-States (`initialCounts`, `isLoadingCounts`) durch neue SSOT-Counts ersetzen

---

## Technische Details

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/components/admin/TestDataManager.tsx` | Hauptumbau: Golden Path Sektion durch SSOT-Sektion ersetzen |
| `src/hooks/useDemoSeedEngine.ts` | Ggf. `seedAll()`-Export pruefen/ergaenzen |
| `src/hooks/useDemoCleanup.ts` | Ggf. Cleanup-Funktion als Export pruefen |

### Nicht betroffene Dateien

- `src/hooks/useGoldenPathSeeds.ts` -- wird nicht geloescht (koennte noch anderswo referenziert sein), aber nicht mehr vom TestDataManager importiert
- Excel-Import-Logik (Zeilen 220-490) -- bleibt unveraendert
- Batch-Tabelle (Zeilen 880-990) -- bleibt unveraendert

### Freeze-Check

- `TestDataManager.tsx` liegt unter `src/components/admin/` -- kein Modul-Pfad, daher **nicht eingefroren**
- Hooks unter `src/hooks/` -- ebenfalls **nicht eingefroren**
