
# Phasenplan: Saubere Golden Path Musterdaten

## Übersicht

Dieser Plan bereinigt die doppelten Daten und stellt sicher, dass die Musterdaten korrekt angelegt und verknüpft sind.

---

## Phase 1: Vollständige Löschung

**Ziel:** Tabula rasa für den Dev-Tenant

**Zu löschende Daten:**
- Alle `document_links` (Verknüpfungen)
- Alle `documents` (Demo-PDFs)
- Alle `leases` (Mietverträge)
- Alle `loans` (Darlehen)
- Alle `units` (inkl. auto-generierte MAIN)
- Alle `properties`
- Alle `context_members`
- Alle `landlord_contexts`
- Alle `contacts`
- Alle `storage_nodes` (Ordnerstruktur wird neu generiert)
- Alle `tenant_tile_activation`

**Nicht löschen:**
- `organizations` (System of a Town bleibt)
- `profiles` (thomas.stelzl bleibt)
- `memberships` (Platform-Admin-Zuordnung bleibt)

---

## Phase 2: Datenmodell & Mapping

### 2.1 Wer kommt wohin?

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          STAMMDATEN (MOD-01)                            │
│                                                                          │
│  profiles → Der eingeloggte User (thomas.stelzl)                        │
│             - Nicht die Mustermanns! Das ist der echte Benutzer         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          KONTAKTE (MOD-02)                               │
│                                                                          │
│  contacts → Alle externen Kontakte:                                     │
│             - Thomas Bergmann (Mieter)                                  │
│             - Sandra Hoffmann (Hausverwaltung, Immo-HV GmbH)            │
│             - Michael Weber (Bankberater, Sparkasse Leipzig)            │
│                                                                          │
│  ⚠️ Max & Lisa Mustermann sind KEINE Kontakte!                         │
│     Sie sind Eigentümer und gehören in landlord_contexts/context_members │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     IMMOBILIEN/KONTEXTE (MOD-04)                         │
│                                                                          │
│  landlord_contexts → Eigentümer-Kontexte (steuerliche Einheit):         │
│             - "Familie Mustermann" (PRIVATE, VERMÖGENSVERWALTUNG)       │
│               zvE: 98.000€, Grenzsteuersatz: 42%                        │
│                                                                          │
│  context_members → Die Eigentümer selbst:                               │
│             - Max Mustermann (50%, 72k brutto, Softwareentwickler)      │
│             - Lisa Mustermann (50%, 54k brutto, Marketing-Managerin)    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     IMMOBILIEN/PORTFOLIO (MOD-04)                        │
│                                                                          │
│  properties → Die Immobilie:                                            │
│             - Leipziger Str. 42, 04109 Leipzig                          │
│             - ETW, 62m², Baujahr 1998                                   │
│             - Kaufpreis: 200.000€, Verkehrswert: 220.000€               │
│             - owner_context_id → Familie Mustermann (Verknüpfung!)      │
│                                                                          │
│  units → KEINE separate Unit erstellen!                                 │
│          Der Trigger erzeugt automatisch eine MAIN-Unit                 │
│          → Wir aktualisieren nur diese MAIN-Unit mit den Daten          │
│                                                                          │
│  leases → Mietvertrag:                                                  │
│          - tenant_contact_id → Thomas Bergmann (Kontakt)                │
│          - rent_cold_eur: 682€, nk_advance_eur: 155€                    │
│          - start_date: 2022-06-01                                       │
│                                                                          │
│  loans → Darlehen:                                                      │
│          - bank_name: Sparkasse Leipzig                                 │
│          - outstanding_balance_eur: 152.000€                            │
│          - interest_rate: 3.25%                                         │
│          - property_id (nicht unit_id!) → Leipzig-Property              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Ablauf mit Trigger-Logik

```text
1. Landlord Context erstellen → "Familie Mustermann"
2. Context Members hinzufügen → Max, Lisa
3. Kontakte erstellen → Thomas (Mieter), Sandra (HV), Michael (Bank)
4. Property erstellen (INSERT) → Trigger erzeugt automatisch MAIN-Unit + 18 Ordner
5. Property UPDATE → owner_context_id auf Familie Mustermann setzen
6. MAIN-Unit UPDATE → 62m², 3 Zimmer, current_monthly_rent: 682€
7. Lease erstellen → Verknüpft Unit mit Thomas Bergmann
8. Loan erstellen → Verknüpft Property mit Sparkasse-Daten
```

---

## Phase 3: UI-Routen-Prüfung

### Welche Route zeigt was?

| Route | Zeigt Daten aus | Erwartete Anzeige |
|-------|-----------------|-------------------|
| `/portal/stammdaten/profil` | `profiles` | thomas.stelzl (der Benutzer) |
| `/portal/office/kontakte` | `contacts` | Thomas, Sandra, Michael (3 Kontakte) |
| `/portal/immobilien/kontexte` | `landlord_contexts`, `context_members` | "Familie Mustermann" mit Max & Lisa |
| `/portal/immobilien/portfolio` | `properties`, `units`, `leases`, `loans` | 1 Property, 1 Unit, 1 Mieter, 1 Darlehen |
| `/portal/immobilien/:id` | Unit-Dossier (alle Blöcke A-J) | Vollständige Immobilienakte Leipzig |

### Keine UI für:
- Kontexte-Property-Zuordnung: `context_property_assignment` wird erst bei Multi-Kontext gebraucht
- Dokumente ohne Dateien: Document-Links bleiben vorerst leer (keine Demo-PDFs)

---

## Phase 4: Implementierung

### SQL-Schritte

**Schritt 1: Bereinigung**
```sql
DELETE FROM document_links WHERE tenant_id = 'a0000000-...';
DELETE FROM documents WHERE tenant_id = 'a0000000-...';
DELETE FROM leases WHERE tenant_id = 'a0000000-...';
DELETE FROM loans WHERE tenant_id = 'a0000000-...';
DELETE FROM units WHERE tenant_id = 'a0000000-...';
DELETE FROM properties WHERE tenant_id = 'a0000000-...';
DELETE FROM context_members WHERE tenant_id = 'a0000000-...';
DELETE FROM landlord_contexts WHERE tenant_id = 'a0000000-...';
DELETE FROM contacts WHERE tenant_id = 'a0000000-...';
DELETE FROM storage_nodes WHERE tenant_id = 'a0000000-...';
```

**Schritt 2: Landlord Context + Members**
```sql
INSERT INTO landlord_contexts (id, tenant_id, name, context_type, tax_regime, is_default, ...)
VALUES ('fix-id', 'a000...', 'Familie Mustermann', 'PRIVATE', 'VERMÖGENSVERWALTUNG', true, ...);

INSERT INTO context_members (context_id, tenant_id, first_name, last_name, ownership_share, ...)
VALUES 
  ('fix-id', 'a000...', 'Max', 'Mustermann', 50, ...),
  ('fix-id', 'a000...', 'Lisa', 'Mustermann', 50, ...);
```

**Schritt 3: Kontakte (nur externe!)**
```sql
INSERT INTO contacts (id, tenant_id, first_name, last_name, email, company, notes)
VALUES 
  ('mieter-id', 'a000...', 'Thomas', 'Bergmann', 't.bergmann@email.de', NULL, 'Mieter'),
  ('hv-id', 'a000...', 'Sandra', 'Hoffmann', 's.hoffmann@immo-hv.de', 'Immo-HV GmbH', 'Hausverwaltung'),
  ('bank-id', 'a000...', 'Michael', 'Weber', 'm.weber@sparkasse.de', 'Sparkasse Leipzig', 'Bankberater');
```

**Schritt 4: Property (Trigger erzeugt MAIN-Unit + Storage)**
```sql
INSERT INTO properties (id, tenant_id, code, city, address, ...)
VALUES ('prop-id', 'a000...', 'DEMO-001', 'Leipzig', 'Leipziger Str. 42', ...);

-- Owner-Context verknüpfen
UPDATE properties SET owner_context_id = 'fix-id' WHERE id = 'prop-id';
```

**Schritt 5: MAIN-Unit aktualisieren (nicht neu erstellen!)**
```sql
UPDATE units 
SET area_sqm = 62, rooms = 3, floor = 3, current_monthly_rent = 682
WHERE property_id = 'prop-id' AND unit_number = 'MAIN';
```

**Schritt 6: Lease + Loan**
```sql
INSERT INTO leases (unit_id, tenant_id, tenant_contact_id, rent_cold_eur, ...)
VALUES ((SELECT id FROM units WHERE property_id = 'prop-id'), 'a000...', 'mieter-id', 682, ...);

INSERT INTO loans (property_id, tenant_id, bank_name, outstanding_balance_eur, ...)
VALUES ('prop-id', 'a000...', 'Sparkasse Leipzig', 152000, ...);
```

---

## Zusammenfassung der Änderungen

| Vorher | Nachher |
|--------|---------|
| 5 Kontakte (inkl. Max & Lisa) | 3 Kontakte (nur externe) |
| Max & Lisa in contacts | Max & Lisa in context_members |
| 2 Units (Duplikat) | 1 Unit (MAIN, vom Trigger) |
| owner_context_id = null | owner_context_id = Familie Mustermann |
| 9 Dokumente ohne Dateien | 0 Dokumente (später hinzufügen) |

---

## Technische Hinweise

1. **Trigger beachten**: `on_property_created` erzeugt automatisch MAIN-Unit + 18 Ordner
2. **Keine Unit manuell erstellen**: Nur UPDATE der automatisch generierten MAIN-Unit
3. **Kontakte vs. Eigentümer**: Strikte Trennung - Eigentümer sind keine contacts!
4. **Foreign Keys**: Lease → Unit → Property → Landlord Context (Kette muss stimmen)

