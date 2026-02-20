
# Demo-Daten Seed Engine: Vollstaendige Diagnose und Neuaufbau

## 1. IST-Zustand: Datenbank vs. CSV-Erwartung

| # | Entitaet | DB-Tabelle | CSV/Code Soll | DB Ist | Status | Fehlerursache |
|---|----------|------------|---------------|--------|--------|---------------|
| 1 | Profil | profiles | 1 (UPDATE) | 1 | OK | - |
| 2 | Kontakte | contacts | 5 | 5 | OK | - |
| 3 | Landlord Context | landlord_contexts | 1 | 1 | OK | - |
| 4 | **Immobilien** | properties | **3** | **1** (HH-01) | **FEHLT** | BER-01 + MUC-01 INSERT scheitert (orphaned storage_nodes / unique constraint) |
| 5 | **Units** | units | **3** | **1** | **FEHLT** | Abhaengig von Properties |
| 6 | **Leases** | leases | **3** | **1** | **FEHLT** | Abhaengig von Units |
| 7 | **Loans** | loans | **3** | **0** | **FEHLT** | Abhaengig von Properties (property_id FK) |
| 8 | **Property Accounting** | property_accounting | **3** | **0** | **FEHLT** | Abhaengig von Properties |
| 9 | Bankkonto | msv_bank_accounts | 1 | 1 | OK | - |
| 10 | Transaktionen | bank_transactions | 100 | 100 | OK | - |
| 11 | **Haushaltspersonen** | household_persons | **4** | **0** | **FEHLT** | Leere Zellen fuer gross_income werden falsch geparst; hauptperson-ID-Mapping |
| 12 | **Fahrzeuge** | cars_vehicles | **2** | **0** (falsche IDs) | **FEHLT** | CSV-IDs (d0000000-...0301) =/= DB-IDs (00000000-...0301) - Dopplung |
| 13 | PV-Anlage | pv_plants | 1 | 1 | OK | - |
| 14 | Versicherungen | insurance_contracts | 7 | 7 | OK | - |
| 15 | KV-Vertraege | kv_contracts | 4 | 4 | OK | - |
| 16 | **Vorsorge** | vorsorge_contracts | **6** | **0** | **FEHLT** | person_id FK auf household_persons, die fehlen |
| 17 | Abonnements | user_subscriptions | 8 | 8 | OK | - |
| 18 | Privatkredite | private_loans | 2 | 2 | OK | - |
| 19 | **Miety Wohnung** | miety_homes | **1** | **0** | **FEHLT** | Im Registry aber nicht in DB - Seed-Fehler |
| 20 | **Miety Vertraege** | miety_contracts | **4** | **0** | **FEHLT** | Abhaengig von miety_homes |
| 21 | **Akquise-Mandat** | acq_mandates | **1** | **0** | **FEHLT** | Im Registry aber nicht in DB |
| 22 | Tierkunden | pet_customers | 3 | 3 | OK | - |
| 23 | Haustiere | pets | 5 | 5 | OK | - |
| 24 | Tierbuchungen | pet_bookings | 5 | 5 | OK | - |
| 25 | **Investment Depots** | finapi_depot_accounts | **2** | **0** | **FEHLT** | Seed-Funktion fehlerhaft oder nicht erreicht |
| 26 | **Depot Positionen** | finapi_depot_positions | **5** | **0** | **FEHLT** | Abhaengig von Depots |

**Ergebnis: 13 von 26 Entitaeten fehlen oder sind unvollstaendig.**

---

## 2. Identifizierte Kernprobleme

### Problem A: Property INSERT scheitert bei 2 von 3
Die `seedProperties`-Funktion loescht zwar vorher mit `.delete().in('id', demoIds)`, aber die Loesch-Reihenfolge ist nicht vollstaendig: `storage_nodes` werden nur per `property_id` geloescht, aber es gibt auch storage_nodes fuer die DMS-Ordnerstruktur, die ueber andere Wege referenziert sein koennten. Wenn ein INSERT fuer Property 1 (BER-01) scheitert, laeuft der Loop weiter, aber die abhaengigen Entities (Units, Leases, Loans, AfA) fuer BER-01 und MUC-01 fehlen komplett.

### Problem B: Fahrzeug-ID-Mismatch
- CSV `demo_vehicles.csv`: `d0000000-0000-4000-a000-000000000301`
- `data.ts` DEMO_PORTFOLIO.vehicleIds: `00000000-0000-4000-a000-000000000301`
- DB hat die `00000000`-Variante (aus einem frueheren Seed)
- Neuer Seed versucht `d0000000`-IDs, findet keine bestehenden, INSERT scheitert evtl. an `created_by`-Column

### Problem C: household_persons Parse-Fehler
CSV hat leere Felder fuer `gross_income_monthly`, `net_income_monthly` bei Kindern. Der Parser gibt `null` zurueck (korrekt nach dem Fix), aber die `hauptperson`-Zeile hat die ID `b1f6d204-...` die durch `userId` ersetzt werden muss. Wenn dieser Mapping-Schritt fehlschlaegt oder das Ergebnis-Objekt die falschen Typen hat, scheitert der gesamte UPSERT-Batch.

### Problem D: Kaskaden-Versagen
Wenn household_persons scheitert, scheitert auch vorsorge_contracts (FK auf person_id). Wenn properties scheitert, scheitern units, leases, loans und property_accounting.

### Problem E: Registry-Inkonsistenz
Die test_data_registry enthaelt Eintraege fuer miety_homes (1) und acq_mandates (1), aber die DB-Tabellen sind leer. Das bedeutet: die Registrierung lief, aber der eigentliche INSERT/UPSERT schlug fehl - die Reihenfolge ist falsch (Register VOR Fehlercheck).

---

## 3. Das Drehbuch: Exakter Seed-Ablauf (Akte fuer Akte)

### Phase 0: Profil (UPDATE)
```
AKTION: UPDATE profiles SET first_name, last_name, ... WHERE id = auth.uid()
QUELLE: demo_profile.csv
ERGEBNIS: 1 Profil aktualisiert
```

### Phase 1: Kontakte (5 Stueck)
```
AKTION: UPSERT contacts
QUELLE: demo_contacts.csv (5 Zeilen)
ERGEBNIS: 5 Kontakte (Max, Lisa, Klaus Bergmann, Sabine Hoffmann, Thomas Weber)
```

### Phase 2: Haushaltspersonen (4 Stueck)
```
AKTION: UPSERT household_persons
QUELLE: demo_household_persons.csv (4 Zeilen)
MAPPING: Zeile 1 (hauptperson) → id = auth.uid() statt b1f6d204-...
ERGEBNIS: Max (userId), Lisa, Felix, Emma
KRITISCH: Muss VOR vorsorge_contracts laufen (FK person_id)
```

### Phase 3: Immobilien-Akten (3 Stueck, je 5 Schritte)

Fuer JEDE der 3 Properties (BER-01, MUC-01, HH-01):

```
Schritt 1: CLEANUP — Loesche alle Reste
  DELETE FROM storage_nodes WHERE property_id = '{id}'
  DELETE FROM property_accounting WHERE property_id = '{id}'
  DELETE FROM loans WHERE property_id = '{id}'
  DELETE FROM leases WHERE unit_id IN (SELECT id FROM units WHERE property_id = '{id}')
  DELETE FROM units WHERE property_id = '{id}'
  DELETE FROM properties WHERE id = '{id}'

Schritt 2: AKTE EROEFFNEN — INSERT property
  INSERT INTO properties (id, tenant_id, property_type, city, address, ...)
  → Trigger feuert: public_id, code, MAIN-Unit, 17 DMS-Ordner
  → WARTEN: 500ms fuer Trigger-Ausfuehrung

Schritt 3: UNIT BEFUELLEN — UPDATE auto-erstellte Unit
  SELECT id FROM units WHERE property_id = '{id}' (trigger-erzeugt)
  UPDATE units SET area_sqm, rooms, current_monthly_rent, ... WHERE id = '{unit_id}'

Schritt 4: MIETVERTRAG ANLEGEN — INSERT lease
  INSERT INTO leases (id, unit_id = {trigger-unit-id}, tenant_contact_id, ...)

Schritt 5: DARLEHEN ANLEGEN — INSERT loan
  INSERT INTO loans (id, property_id, bank_name, original_amount, ...)

Schritt 6: AFA-DATEN — INSERT property_accounting
  INSERT INTO property_accounting (property_id, afa_rate_percent, ak_building, ...)
```

### Phase 4: Fahrzeug-Akten (2 Stueck)
```
AKTION: UPSERT cars_vehicles
QUELLE: demo_vehicles.csv
FIX NOETIG: IDs in CSV auf 00000000-Prefix aendern ODER data.ts anpassen
EXTRA-FELD: created_by = auth.uid()
```

### Phase 5: PV-Akte (1 Stueck)
```
AKTION: UPSERT pv_plants
QUELLE: demo_pv_plants.csv
ID: 00000000-0000-4000-a000-000000000901
```

### Phase 6: Versicherungs-Akten (7 Stueck)
```
AKTION: UPSERT insurance_contracts
QUELLE: data.ts → DEMO_INSURANCES (JSONB details)
```

### Phase 7: KV-Akten (4 Stueck)
```
AKTION: UPSERT kv_contracts
QUELLE: data.ts → DEMO_KV_CONTRACTS
```

### Phase 8: Vorsorge-Akten (6 Stueck)
```
AKTION: UPSERT vorsorge_contracts
QUELLE: demo_vorsorge_contracts.csv
MAPPING: person_id b1f6d204-... → auth.uid()
ABHAENGIGKEIT: household_persons muss existieren (Phase 2)
```

### Phase 9: Abonnement-Akten (8 Stueck)
```
AKTION: UPSERT user_subscriptions
QUELLE: demo_user_subscriptions.csv
EXTRA-FELD: user_id = auth.uid()
```

### Phase 10: Privatkredit-Akten (2 Stueck)
```
AKTION: UPSERT private_loans
QUELLE: demo_private_loans.csv
EXTRA-FELD: user_id = auth.uid()
```

### Phase 11: Bankkonto + Transaktionen
```
AKTION: UPSERT msv_bank_accounts (1), dann bank_transactions (100)
QUELLE: demo_bank_accounts.csv, demo_bank_transactions.csv
```

### Phase 12: Investment-Depot-Akten (2 Stueck + 5 Positionen)
```
AKTION: UPSERT finapi_depot_accounts (2), dann finapi_depot_positions (5)
QUELLE: data.ts → seedInvestmentDepots()
```

### Phase 13: Miety-Zuhause (1 Heim + 4 Vertraege)
```
AKTION: UPSERT miety_homes (1), dann miety_contracts (4)
QUELLE: demo_miety_homes.csv, demo_miety_contracts.csv
EXTRA-FELD: user_id = auth.uid() fuer miety_homes
```

### Phase 14: Akquise-Mandat (1 Stueck)
```
AKTION: UPSERT acq_mandates
QUELLE: data.ts → DEMO_ACQ_MANDATE
EXTRA-FELDER: created_by_user_id, assigned_manager_user_id, assigned_at
```

### Phase 15: Pet Manager (3 Kunden + 5 Tiere + 5 Buchungen)
```
AKTION: UPSERT pet_customers (3), pets (5), pet_bookings (5)
QUELLE: CSV + data.ts (Mischform)
```

---

## 4. Technische Aenderungen (Implementierung)

### 4.1 CSV-Fix: demo_vehicles.csv
IDs aendern von `d0000000-...` zu `00000000-...` passend zur PV-Anlage und data.ts.

### 4.2 seedProperties() komplett neu
Statt alle 3 Properties in einem Loop: individuelle Fehlerbehandlung pro Property mit vollstaendigem Cleanup vorher (inkl. units, leases, loans, storage_nodes, property_accounting). Jede Property wird einzeln inserted, und bei Fehler wird der naechste versucht statt abzubrechen.

### 4.3 seedHouseholdPersons() robuster machen
- Leere numerische Felder explizit auf `null` setzen
- `tax_class` als String belassen (nicht als Zahl parsen)
- Hauptperson-ID-Mapping verifizieren mit Logging

### 4.4 Registry erst NACH erfolgreichem Insert
`registerEntities()` wird NUR aufgerufen, wenn der INSERT/UPSERT tatsaechlich erfolgreich war. Aktuell wird manchmal registriert obwohl der DB-Eintrag fehlschlug.

### 4.5 Fehler-Isolation pro Phase
Wenn eine Phase scheitert (z.B. Property BER-01), darf das nicht die nachfolgenden Phasen (Fahrzeuge, Versicherungen etc.) blockieren. Jede Phase laeuft unabhaengig, nur innerhalb der Immobilien-Kaskade ist die Reihenfolge strikt.

### 4.6 Miety + Acq: user_id / created_by pruefen
Die UPSERT-Aufrufe fuer miety_homes und acq_mandates muessen die korrekten Felder setzen. Aktueller Code scheint korrekt, aber der Fehler liegt moeglicherweise an fehlenden NOT NULL Feldern.

### 4.7 Cleanup erweitern
`CLEANUP_ORDER` muss `property_accounting` VOR `properties` enthalten (bereits der Fall) und auch die richtigen Fahrzeug-IDs abdecken (00000000-Prefix).

### 4.8 Diagnostik-Log
Am Ende des Seeds: vollstaendige Tabelle ausgeben (Soll vs. Ist) als Console-Log, damit Fehler sofort sichtbar sind.

---

## 5. Zusammenfassung der Code-Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `public/demo-data/demo_vehicles.csv` | IDs von d0000000 auf 00000000 aendern |
| `src/hooks/useDemoSeedEngine.ts` | seedProperties: Per-Property Cleanup + Insert mit individueller Fehlerbehandlung; seedHouseholdPersons: Robusteres Parsing; Registry nur nach Erfolg; Diagnostik-Log am Ende; Miety/Acq Debugging |
| `src/hooks/useDemoCleanup.ts` | Fahrzeug-IDs (00000000-Prefix) in Fallback-Cleanup aufnehmen |

Geschaetzter Aufwand: Mittlerer Refactor der Seed-Engine mit Fokus auf Fehler-Isolation und korrekter Reihenfolge.
