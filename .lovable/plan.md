

# Strategie: Demo-Daten-Konsolidierung — "Realistic Seeding"

## Analyse: 3 Grundprobleme

### Problem 1: Drei inkonsistente Datenquellen

Das System hat aktuell drei voellig getrennte Wege, Demo-Daten bereitzustellen:

| Quelle | Mechanismus | Toggle-Steuerung | Beispiele |
|--------|-------------|-------------------|-----------|
| **DB-Seeds** (`seed_golden_path_data` RPC) | SQL-Funktion schreibt in echte Tabellen | Kein Toggle — Daten bleiben permanent in der DB | Properties, Leases, Loans, Contacts, Documents |
| **Client-seitig hardcoded** (TypeScript-Konstanten) | Wird im Browser generiert, nie in DB geschrieben | Per `useDemoToggles` + `GP-*` Keys | Bankkonten, Transaktionen, Listings, Versicherungen |
| **CSV-Dateien** (`public/demo-data/`) | Liegen im Repo, werden aber von KEINEM Code gelesen | Gar keine | `demo_bank_accounts.csv`, `demo_bank_transactions.csv` |

**Konsequenz:** DB-Seeds verschwinden nicht bei Toggle OFF. Client-seitige Daten sind nie "echt" eingegeben. CSV-Dateien sind verwaist.

### Problem 2: Toggle OFF ist nicht wirklich leer

Wenn ein User alle Toggles deaktiviert:
- DB-Seeds (Properties, Contacts, Leases, Loans) bleiben sichtbar — sie werden mit `is_demo` gefiltert oder gar nicht
- `isDemoId()` erkennt nur IDs im `DEMO_ID_SET` (aus `demoData/data.ts`) — DB-Seed-IDs wie `00000000-0000-4000-a000-000000000001` sind dort NICHT registriert
- Ergebnis: "Geister-Daten" die weder als Demo erkannt noch ausgeblendet werden

### Problem 3: Daten werden nicht "realistisch" eingespielt

Die DB-Seeds schreiben direkt per SQL in Tabellen. Das umgeht:
- Validierungslogik der UI-Formulare
- Storage-Node-Erstellung (DMS-Ordnerstruktur)
- Automatische Berechnungen (AfA, BWA)
- CSV-Import-Pfade (Kontoauszuege)

---

## Loesung: 4-Schichten-Architektur

```text
 Schicht 1: SSOT-Dateien (CSV + JSON in public/demo-data/)
     |
 Schicht 2: Seed-Engine (Edge Function oder RPC)
     |        Liest CSVs, schreibt ueber dieselben Pfade wie ein User
     |
 Schicht 3: Demo-Registry (DB-Tabelle test_data_registry)
     |        Trackt jede erzeugte Entity-ID pro Batch
     |
 Schicht 4: Toggle-Guard + Cleanup
            Toggle OFF → alle registrierten Demo-Entities loeschen
```

### Schicht 1: SSOT-Dateien erweitern

**Verzeichnis: `public/demo-data/`**

Alle Demo-Daten werden als editierbare Dateien erfasst:

| Datei | Inhalt | Modul |
|-------|--------|-------|
| `demo_bank_accounts.csv` | Bankkonten (existiert, erweitern) | MOD-18 |
| `demo_bank_transactions.csv` | Kontobewegungen (existiert, erweitern) | MOD-18 |
| `demo_properties.csv` | NEU: Immobilien mit AfA-Stammdaten | MOD-04 |
| `demo_units.csv` | NEU: Wohneinheiten | MOD-04 |
| `demo_leases.csv` | NEU: Mietvertraege | MOD-04/05 |
| `demo_contacts.csv` | NEU: Kontakte (Mieter, Verwalter, Berater) | MOD-01 |
| `demo_loans.csv` | NEU: Darlehen | MOD-04 |
| `demo_vehicles.csv` | NEU: Fahrzeuge | MOD-17 |
| `demo_insurances.json` | NEU: Versicherungen, Vorsorge | MOD-18 |
| `demo_pv_plants.csv` | NEU: PV-Anlagen | MOD-19 |
| `demo_manifest.json` | NEU: Metadaten (Version, Musterkunde, Checksummen) | SYSTEM |

Alle Dateien sind manuell editierbar. Aenderungen an den CSVs aendern direkt die Demo-Daten.

### Schicht 2: Unified Seed-Engine

**Neue Datei: `src/hooks/useDemoSeedEngine.ts`**

Ersetzt sowohl `seed_golden_path_data` (SQL) als auch die verstreuten Client-Konstanten:

```text
async function seedDemoData(tenantId: string):
  1. Laedt CSVs aus /demo-data/ per fetch()
  2. Parsed jede CSV/JSON
  3. Schreibt Daten ueber Supabase SDK (INSERT mit ON CONFLICT)
     → Gleicher Pfad wie ein normaler User
     → Validierung greift, Storage-Nodes werden erstellt
  4. Registriert jede Entity in test_data_registry (batch_id = 'demo-ssot')
  5. Gibt SeedResult zurueck (vorher/nachher Counts)
```

**Kritische Unterschiede zum jetzigen System:**
- Kein direktes SQL mehr — alles ueber das SDK
- Jede erstellte Entity bekommt einen Eintrag in `test_data_registry`
- IDs werden aus den CSVs gelesen (deterministische UUIDs, kein `crypto.randomUUID()`)
- AfA-Werte, Buchwerte, Finanzierungsdaten kommen direkt aus den CSVs

### Schicht 3: Vollstaendiges Demo-Registry

Die Tabelle `test_data_registry` existiert bereits. Sie wird zum **Single Point of Cleanup**:

```text
Jede Demo-Entity hat einen Eintrag:
  tenant_id | batch_id='demo-ssot' | entity_type | entity_id | imported_at

Toggle OFF → DELETE FROM [tabelle] WHERE id IN (
  SELECT entity_id FROM test_data_registry
  WHERE tenant_id = ? AND batch_id = 'demo-ssot' AND entity_type = ?
)
```

### Schicht 4: Toggle-Guard mit Cleanup

**Aenderung in `useDemoToggles.ts`:**

Wenn ein User **alle Toggles auf OFF** setzt (oder den Master-Toggle nutzt):
1. Alle Demo-Entities aus `test_data_registry` (batch `demo-ssot`) werden geloescht
2. Danach ist die DB tatsaechlich leer — kein Filtern mehr noetig
3. Re-Toggle ON → Seed-Engine laeuft erneut

```text
toggleAll(OFF):
  → cleanupDemoData(tenantId)  // Loescht alle registrierten Demo-Entities
  → localStorage: alle Toggles = false

toggleAll(ON):
  → seedDemoData(tenantId)     // Schreibt Demo-Daten aus CSVs
  → localStorage: alle Toggles = true
```

---

## Betroffene Dateien und Aenderungen

### Neue Dateien

| Datei | Zweck |
|-------|-------|
| `public/demo-data/demo_properties.csv` | SSOT: 3 Immobilien mit AfA, Kaufpreis, Adressen |
| `public/demo-data/demo_units.csv` | SSOT: Wohneinheiten pro Immobilie |
| `public/demo-data/demo_leases.csv` | SSOT: Mietvertraege |
| `public/demo-data/demo_contacts.csv` | SSOT: 5 Kontakte |
| `public/demo-data/demo_loans.csv` | SSOT: Darlehen |
| `public/demo-data/demo_vehicles.csv` | SSOT: Fahrzeuge (BMW M4) |
| `public/demo-data/demo_insurances.json` | SSOT: Versicherungen + Vorsorge |
| `public/demo-data/demo_pv_plants.csv` | SSOT: PV-Anlagen |
| `public/demo-data/demo_manifest.json` | Metadaten, Version, Checksummen |
| `src/hooks/useDemoSeedEngine.ts` | Unified Seed: CSV lesen → DB schreiben → Registry |
| `src/hooks/useDemoCleanup.ts` | Cleanup: Registry lesen → alle Entities loeschen |

### Zu aendernde Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useDemoToggles.ts` | Toggle OFF/ON triggert Cleanup/Seed |
| `src/components/admin/TestDataManager.tsx` | "Demo-Daten" Sektion: CSV-Vorschau, Seed-Button, Cleanup-Button |
| `src/hooks/useGoldenPathSeeds.ts` | Deprecated — wird durch useDemoSeedEngine ersetzt |
| `src/engines/demoData/data.ts` | Reduzieren: Nur noch IDs + isDemoId-Set, keine Daten mehr |
| `src/constants/demoKontoData.ts` | Deprecated — Daten kommen aus CSV |
| `src/config/demoDataRegistry.ts` | Aktualisieren: Alle Quellen zeigen auf public/demo-data/ |

### Zu entfernende Client-seitige Hardcoding-Stellen (schrittweise)

Die folgenden 20+ Dateien mit `@demo-data` Tags werden Schritt fuer Schritt auf die CSV-basierte Seed-Engine umgestellt. Sobald eine Entity per Seed in der DB liegt, entfaellt der clientseitige Fallback.

---

## Implementierungsreihenfolge

### Phase 1: SSOT-CSVs erstellen (Grundlage)
1. CSV-Dateien fuer Properties, Units, Leases, Contacts, Loans anlegen
2. Bestehende CSVs (Bank) pruefen und aktualisieren
3. `demo_manifest.json` mit Version und Entity-Uebersicht

### Phase 2: Seed-Engine bauen
4. `useDemoSeedEngine.ts` — CSV-Parser + SDK-basierter Insert
5. `useDemoCleanup.ts` — Registry-basierter Delete
6. Integration in TestDataManager (neuer "Demo-Daten einspielen" Button)

### Phase 3: Toggle-Lifecycle
7. `useDemoToggles.ts` erweitern: ON → Seed, OFF → Cleanup
8. Testen: Toggle OFF → DB ist leer, Toggle ON → alle Daten da

### Phase 4: Client-seitige Altlasten abbauen
9. `demoKontoData.ts` → durch DB-Daten ersetzen (aus CSV geseeded)
10. `demoData/data.ts` → reduzieren auf ID-Registry
11. Einzelne Modul-Hooks (`useDemoListings`, etc.) → direkt aus DB lesen

### Phase 5: Validierung
12. Automated Test: Neuer Tenant → Toggle OFF → Assertion: 0 Records in allen Tabellen
13. Toggle ON → Assertion: exakte Counts aus `demo_manifest.json`
14. Toggle OFF → Assertion: wieder 0

---

## Erwartetes Ergebnis

| Szenario | Vorher | Nachher |
|----------|--------|---------|
| Neuer User, Toggles OFF | Geister-Daten aus DB-Seeds sichtbar | **Komplett leer** — 0 Records |
| Neuer User, Toggles ON | Mix aus DB-Seeds + Client-Daten, inkonsistent | **Vollstaendige, realistische Daten** aus CSVs |
| Toggle OFF nach ON | DB-Seeds bleiben, Client-Daten verschwinden | **Alles weg** — Registry-basierter Cleanup |
| Demo-Daten aendern | Code aendern in 20+ Dateien | **CSV editieren** in `public/demo-data/` |
| Neues Modul hinzufuegen | Neuen Hook + Konstanten + Registry-Eintrag | **CSV-Zeile hinzufuegen** + Seed-Engine kennt es automatisch |

