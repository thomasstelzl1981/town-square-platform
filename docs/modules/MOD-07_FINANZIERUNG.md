# MOD-07 — FINANZIERUNG (Self-Disclosure & Request Module)

**Version:** v2.0.0  
**Status:** ACTIVE  
**Datum:** 2026-02-06  
**Zone:** 2 (User Portal)  
**Typ:** STANDARD (für alle Nutzer verfügbar)  
**Route-Prefix:** `/portal/finanzierung`  
**API-Range:** API-600 bis API-631  
**Abhängig von:** MOD-04 (Immobilien), MOD-03 (DMS), MOD-01 (Stammdaten), Backbone (Consents, Audit)

---

## 1) MODULDEFINITION

### 1.1 Zweck

MOD-07 „Finanzierung" ist das **Kundenmodul zur Datenerfassung** für Finanzierungsanfragen. Der Fokus liegt auf:

1. **Selbstauskunft** — Persönliche Bonitätsdaten (permanent pro Tenant)
2. **Dokumente** — Bonitätsunterlagen + Objektunterlagen (DMS-integriert)
3. **Anfrage** — Finanzierungsvorhaben mit Objektdaten
4. **Status** — Timeline-Ansicht des Fortschritts

**WICHTIG:** MOD-07 ist **NUR** für Datenerfassung zuständig. Die Bank-Übergabe erfolgt in **MOD-11 (Finanzierungsmanager)**.

### 1.2 Zielnutzer / Rollen

| Rolle | Zugang | Beschreibung |
|-------|--------|--------------|
| `org_admin` | Full | Vollständige Bearbeitung aller Tabs |
| `member` | Write | Eigene Daten pflegen |
| `viewer` | Read | Lesend (optional) |

### 1.3 Scope IN

- Selbstauskunft pflegen (9 Sektionen)
- Dokumente hochladen und verwalten (DMS-Checkliste)
- Finanzierungsanfragen erstellen (4 Sektionen)
- Status-Timeline verfolgen
- Daten aus MOD-04 Portfolio vorausfüllen
- Document Reminder aktivieren

### 1.4 Scope OUT (Nicht-Ziele)

- ❌ Keine Bank-API (Europace/BaufiSmart) — das macht MOD-11!
- ❌ Keine Banken-Auswahl oder Produktvergleich
- ❌ Keine Kreditvermittlung
- ❌ Kein direkter Kundenkontakt mit Finanzierungsmanager (MOD-11)

---

## 2) ARCHITEKTUR-POSITION

### 2.1 Finanzierungs-Triade

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FINANZIERUNGS-TRIADE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   MOD-07 (Kunde)        Zone 1 (FutureRoom)     MOD-11 (Manager)       │
│   ═══════════════       ═══════════════════     ═══════════════        │
│   Datenerfassung   ──►  Triage + Delegation ──► Bank-Übergabe          │
│   Dokumentenupload      Zuweisung an Manager    Europace API           │
│   Status-Ansicht        Monitoring              Kundenkommunikation    │
│                                                                         │
│   SoT: draft..ready     SoT: submitted..assigned    SoT: in_review+    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Cross-Module Abhängigkeiten

| Modul | Abhängigkeit | Datenfluss |
|-------|--------------|------------|
| MOD-04 Immobilien | Properties für Vorausfüllung | READ |
| MOD-03 DMS | Dokumentenablage, storage_nodes | READ/WRITE |
| MOD-01 Stammdaten | Kontakte, Profile | READ |
| Zone 1 FutureRoom | Übernahme nach Submit | HANDOFF |
| MOD-11 | Bearbeitung nach Zuweisung | READONLY |

---

## 3) ROUTE-STRUKTUR (4-Tile-Pattern)

### 3.1 Haupt-Tiles

| Route | UI-Label | Komponente | Beschreibung |
|-------|----------|------------|--------------|
| `/portal/finanzierung/selbstauskunft` | Selbstauskunft | SelbstauskunftTab | 9-Sektionen-Formular (default) |
| `/portal/finanzierung/dokumente` | Dokumente | DokumenteTab | DMS-Tree + Checkliste |
| `/portal/finanzierung/anfrage` | Anfrage | AnfrageTab | 4-Sektionen-Formular (Draft-First) |
| `/portal/finanzierung/status` | Status | StatusTab | Timeline aller Anfragen |

### 3.2 Dynamische Routes

| Route | Komponente | Beschreibung |
|-------|------------|--------------|
| `/portal/finanzierung/anfrage/:requestId` | AnfrageDetailPage | Detail einer spezifischen Anfrage |

### 3.3 UI-Prinzipien

- **Durchscrollbare Formulare** — Keine verschachtelten Tabs in Selbstauskunft/Anfrage
- **Draft-First** — Anfrage-Tab zeigt direkt das Formular (nicht Liste)
- **DMS-Integration** — Dokumente-Tab mit echtem Tree und Checkliste
- **Vorausfüllung** — Daten aus MOD-04 Portfolio übernehmen

---

## 4) DATENMODELL

### 4.1 Kerntabellen (MOD-07 Owner)

#### A) `applicant_profiles`

Persistentes Profil für Selbstauskunft (1 pro Tenant, `finance_request_id IS NULL`).

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Isolation |
| profile_type | text | `private` \| `entrepreneur` |
| party_role | text | `primary` \| `co_applicant` |
| finance_request_id | uuid FK | NULL = persistent, sonst Snapshot |
| **Sektion 1: Person** | | |
| salutation | text | Anrede |
| first_name | text | Vorname |
| last_name | text | Nachname |
| birth_date | date | Geburtsdatum |
| birth_place | text | Geburtsort |
| nationality | text | Staatsangehörigkeit |
| address_* | text | Adressfelder |
| phone, email | text | Kontaktdaten |
| tax_id | text | Steuer-ID |
| **Sektion 2: Haushalt** | | |
| marital_status | text | Familienstand |
| property_separation | boolean | Gütertrennung |
| children_count | integer | Anzahl Kinder |
| **Sektion 3: Beschäftigung** | | |
| employment_type | text | `employed` \| `self_employed` |
| employer_name | text | Arbeitgeber |
| employed_since | date | Beschäftigt seit |
| net_income_monthly | decimal | Nettoeinkommen |
| **Sektion 4: Bank** | | |
| iban | text | IBAN |
| bic | text | BIC |
| **Sektion 5-6: Einnahmen/Ausgaben** | decimal | Monatliche Werte |
| **Sektion 7: Vermögen** | decimal | Vermögenswerte |
| **Sektion 8: Verbindlichkeiten** | | via `applicant_liabilities` (1:N) |
| **Sektion 9: Erklärungen** | boolean | Consents |
| completion_score | integer | 0-100 |
| created_at, updated_at | timestamptz | — |

#### B) `applicant_liabilities`

Verbindlichkeiten als 1:N Beziehung.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | — |
| applicant_profile_id | uuid FK | → applicant_profiles |
| liability_type | text | `immobiliendarlehen` \| `ratenkredit` \| `leasing` \| `sonstige` |
| creditor_name | text | Gläubiger |
| original_amount | decimal | Ursprungsbetrag |
| remaining_balance | decimal | Restschuld |
| monthly_rate | decimal | Monatsrate |
| interest_rate_fixed_until | date | Zinsbindung bis |
| end_date | date | Laufzeitende |

#### C) `finance_requests`

Finanzierungsanfragen mit Objektdaten.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Isolation |
| public_id | text | `FIN-XXXXXXXX` |
| status | text | Status-Enum |
| **Objektdaten** | | |
| object_source | text | `portfolio` \| `listing` \| `custom` |
| property_id | uuid FK | → properties (nullable) |
| object_address | text | Adresse |
| object_type | text | Objekttyp |
| object_construction_year | integer | Baujahr |
| object_living_area_sqm | decimal | Wohnfläche |
| **Kostenaufstellung** | | |
| purchase_price | decimal | Kaufpreis |
| modernization_costs | decimal | Modernisierung |
| notary_costs | decimal | Notar/Gericht |
| transfer_tax | decimal | Grunderwerbsteuer |
| broker_fee | decimal | Makler |
| **Finanzierungsplan** | | |
| equity_amount | decimal | Eigenkapital |
| loan_amount_requested | decimal | Darlehenswunsch |
| fixed_rate_period_years | integer | Zinsbindung |
| repayment_rate_percent | decimal | Tilgung |
| max_monthly_rate | decimal | Max. Monatsrate |
| **Meta** | | |
| storage_folder_id | uuid FK | DMS-Ordner |
| submitted_at | timestamptz | Einreichungsdatum |
| created_at, updated_at | timestamptz | — |

#### D) `document_checklist_items`

Dynamische Checkliste für Dokumentenanforderungen.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| checklist_type | text | `applicant` \| `request` |
| category | text | `identity` \| `income` \| `assets` \| `liabilities` \| `property` |
| doc_type | text | `DOC_PAYSLIP` etc. |
| label | text | Anzeigename |
| is_required | boolean | Pflichtdokument |
| for_employment_type | text | `employed` \| `self_employed` \| NULL (alle) |
| sort_index | integer | Sortierung |

#### E) `document_reminders`

Erinnerungseinstellungen für fehlende Dokumente.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | — |
| user_id | uuid FK | — |
| finance_request_id | uuid FK | — |
| reminder_type | text | `weekly` \| `on_missing` \| `disabled` |
| last_sent_at | timestamptz | Letzte Erinnerung |
| next_reminder_at | timestamptz | Nächste Erinnerung |

### 4.2 Status-Maschine

```
draft → incomplete → ready_to_submit → submitted_to_zone1 → assigned → in_review → bank_submitted → approved
                                                                                  ↘ rejected
```

| Status | Zone | Beschreibung |
|--------|------|--------------|
| `draft` | MOD-07 | In Bearbeitung |
| `incomplete` | MOD-07 | Felder fehlen |
| `ready_to_submit` | MOD-07 | Bereit zur Einreichung |
| `submitted_to_zone1` | Zone 1 | An FutureRoom übermittelt |
| `assigned` | Zone 1 | Manager zugewiesen |
| `in_review` | MOD-11 | Manager prüft |
| `bank_submitted` | MOD-11 | Bei Bank eingereicht |
| `approved` | MOD-11 | Genehmigt |
| `rejected` | Zone 1/MOD-11 | Abgelehnt |

---

## 5) API CONTRACT (API-600..631)

### 5.1 Selbstauskunft APIs

| API-ID | Endpoint | Method | Beschreibung |
|--------|----------|--------|--------------|
| API-600 | `/financing/self-disclosure` | GET | Get Selbstauskunft |
| API-601 | `/financing/self-disclosure` | POST | Create Selbstauskunft |
| API-602 | `/financing/self-disclosure/:id` | PATCH | Update Selbstauskunft |
| API-603 | `/financing/self-disclosure/:id/completion` | GET | Completion Score |

### 5.2 Request APIs

| API-ID | Endpoint | Method | Beschreibung |
|--------|----------|--------|--------------|
| API-610 | `/financing/requests` | GET | List Anfragen |
| API-611 | `/financing/requests` | POST | Create Anfrage |
| API-612 | `/financing/requests/:id` | GET | Anfrage Detail |
| API-613 | `/financing/requests/:id` | PATCH | Update Anfrage |
| API-614 | `/financing/requests/:id/submit` | POST | Einreichung → Zone 1 |

### 5.3 Liabilities APIs

| API-ID | Endpoint | Method | Beschreibung |
|--------|----------|--------|--------------|
| API-620 | `/financing/liabilities` | GET | List Verbindlichkeiten |
| API-621 | `/financing/liabilities` | POST | Add Verbindlichkeit |
| API-622 | `/financing/liabilities/:id` | PATCH | Update Verbindlichkeit |
| API-623 | `/financing/liabilities/:id` | DELETE | Delete Verbindlichkeit |

### 5.4 Document APIs

| API-ID | Endpoint | Method | Beschreibung |
|--------|----------|--------|--------------|
| API-630 | `/financing/documents/checklist` | GET | Document Checklist |
| API-631 | `/financing/documents/link` | POST | Link DMS Doc |

---

## 6) UI-KOMPONENTEN

### 6.1 Selbstauskunft (9 Sektionen)

Die `SelbstauskunftFormV2.tsx` implementiert ein durchscrollbares Formular:

1. **Angaben zur Person** — Identität, Adresse, Kontakt
2. **Haushalt** — Familienstand, Kinder, Gütertrennung
3. **Beschäftigung** — Switch: Angestellt ↔ Selbstständig
4. **Bankverbindung** — IBAN, BIC
5. **Monatliche Einnahmen** — Netto, Mieten, Kindergeld etc.
6. **Monatliche Ausgaben** — Miete, Versicherung, Leasing etc.
7. **Vermögen** — Bank, Wertpapiere, Immobilien (MOD-04 read-only)
8. **Verbindlichkeiten** — 1:N Tabelle via `applicant_liabilities`
9. **Erklärungen** — SCHUFA-Einwilligung, Bestätigungen

### 6.2 Dokumente (DMS + Checkliste)

Die `FinanceDocumentsManager.tsx` implementiert:

- **Linke Spalte:** `FinanceStorageTree` — DMS-Ordnerstruktur
- **Rechte Spalte:** `DocumentChecklistPanel` — Interaktive Checkliste
- **Upload-Zone:** `FinanceUploadZone` — Drag & Drop
- **MOD-04 Import:** `MOD04DocumentPicker` — Dokumente aus Portfolio übernehmen
- **Reminder:** `DocumentReminderToggle` — Wöchentliche E-Mail-Erinnerung

### 6.3 Anfrage (4 Sektionen)

Die `AnfrageFormV2.tsx` implementiert:

1. **Vorhaben** — Zweck (Kauf, Neubau, Umschuldung, Modernisierung)
2. **Objektdaten** — Vorausfüllung aus MOD-04 möglich
3. **Kostenzusammenstellung** — Kaufpreis + Nebenkosten
4. **Finanzierungsplan** — Eigenkapital, Darlehen, Tilgung

### 6.4 Status (Timeline)

Die `StatusTab.tsx` zeigt:

- Timeline-Events pro Anfrage
- Manager-Kontaktdaten (wenn zugewiesen)
- Status-Badges

---

## 7) VORAUSFÜLLUNG AUS MOD-04

### 7.1 Selbstauskunft: Vermietereinheit

```typescript
const prefillFromContext = (context: LandlordContext, member: ContextMember) => ({
  first_name: member.first_name,
  last_name: member.last_name,
  birth_date: member.birth_date,
  address_street: `${member.street} ${member.house_number}`,
  address_postal_code: member.postal_code,
  address_city: member.city,
  rental_income_monthly: context.total_rental_income_monthly,
});
```

### 7.2 Anfrage: Objekt aus Portfolio

```typescript
const prefillFromProperty = (property: Property) => ({
  object_address: `${property.address}, ${property.postal_code} ${property.city}`,
  object_type: property.property_type,
  object_construction_year: property.construction_year,
  object_living_area_sqm: property.total_area_sqm,
  purchase_price: property.purchase_price,
});
```

---

## 8) CONSENT & AUDIT

### 8.1 Consent Gates

| Code | Label | Trigger |
|------|-------|---------|
| `SCHUFA_CONSENT` | SCHUFA-Einwilligung | Bei Selbstauskunft-Speicherung |
| `DATA_PROCESSING` | Datenverarbeitung | Bei Anfrage-Einreichung |

### 8.2 Audit Events

| Event Type | Trigger |
|------------|---------|
| `financing.profile.created` | Profil erstellt |
| `financing.profile.updated` | Profil aktualisiert |
| `financing.request.created` | Anfrage erstellt |
| `financing.request.submitted` | Anfrage eingereicht (→ Zone 1) |
| `financing.document.linked` | Dokument verknüpft |

---

## 9) DATEIEN IM REPOSITORY

### 9.1 Pages

| Datei | Beschreibung |
|-------|--------------|
| `src/pages/portal/finanzierung/SelbstauskunftTab.tsx` | Selbstauskunft-Tab |
| `src/pages/portal/finanzierung/DokumenteTab.tsx` | Dokumente-Tab |
| `src/pages/portal/finanzierung/AnfrageTab.tsx` | Anfrage-Tab (Draft-First) |
| `src/pages/portal/finanzierung/StatusTab.tsx` | Status-Tab |
| `src/pages/portal/finanzierung/AnfrageDetailPage.tsx` | Detail-Route |
| `src/pages/portal/finanzierung/index.ts` | Exporte |

### 9.2 Komponenten

| Datei | Beschreibung |
|-------|--------------|
| `src/components/finanzierung/SelbstauskunftFormV2.tsx` | 9-Sektionen-Formular |
| `src/components/finanzierung/AnfrageFormV2.tsx` | 4-Sektionen-Formular |
| `src/components/finanzierung/FinanceDocumentsManager.tsx` | DMS-Hauptkomponente |
| `src/components/finanzierung/DocumentChecklistPanel.tsx` | Checkliste |
| `src/components/finanzierung/FinanceStorageTree.tsx` | DMS-Tree |
| `src/components/finanzierung/FinanceUploadZone.tsx` | Upload-Zone |
| `src/components/finanzierung/MOD04DocumentPicker.tsx` | Portfolio-Import |
| `src/components/finanzierung/DocumentReminderToggle.tsx` | Erinnerungen |
| `src/components/finanzierung/index.ts` | Exporte |

---

## 10) CHANGELOG

| Version | Datum | Änderung |
|---------|-------|----------|
| v1.0.0 | 2026-01-26 | Initial (alte finance_cases Struktur) |
| **v2.0.0** | **2026-02-06** | **Komplette Überarbeitung:** 4-Tile-Pattern, Trennung MOD-07/MOD-11, neue Tabellen (applicant_profiles, finance_requests, document_checklist_items), DMS-Integration, Draft-First Logik |

---

*Dieses Dokument ist der verbindliche Spezifikationsstand für MOD-07.*
