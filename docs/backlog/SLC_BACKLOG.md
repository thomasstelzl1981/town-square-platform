# SLC Backlog — Sales Lifecycle Controller + Provisions-Bereinigung

> **Erstellt:** 2026-03-02
> **Status:** Planungsphase — NICHT IMPLEMENTIERT
> **Scope:** MOD-04 (Bestand) → MOD-13 (Projekte) → Distribution → Deal → Settlement
> **Owner:** Sales Desk (Z1-Integration)

---

## Vorbemerkungen & Korrekturen

### Was SLC NICHT ist
- **Kein TLC-Pendant für Vermietung.** GP-VERMIETUNG gehört zum TLC und wird hier nicht behandelt.
- **Kein Modul.** SLC ist ein Cross-Module Event-Layer (analog TLC), kein eigenes Portal-Modul.
- **Kein Daten-Duplikat.** SSOT bleibt MOD-04 (properties/units) und MOD-13 (dev_projects/dev_project_units).

### Startpunkt
SLC beginnt **NICHT** bei der Asset-Erfassung, sondern **erst mit Abschluss des Verkaufsauftrags** (Vertriebsfreigabe). Vor diesem Gate gibt es keinen SLC-Case.

### Systemgebühr → Provisionsabgabe (Begriffswechsel)
Die ursprüngliche "Systemgebühr" ist **nicht mehr aktuell**. Das neue Modell:
- **Manager führen 25% ihrer Provisionen an die Plattform ab** (Provisionsabgabe / Plattformanteil)
- Der Satz von 25% bleibt korrekt, aber die Bezeichnung ändert sich
- `contractGenerator.ts` hat aktuell `platform_share_pct: 30` **hardcoded** — das ist falsch und muss auf 25% korrigiert werden

### Reservierungen
`reservations` (MOD-04/Bestand) und `dev_project_reservations` (MOD-13/Projekte) werden in eine einheitliche Struktur **zusammengeführt**.

### Control Plane
Kein neuer Z1-Desk — **Integration in den bestehenden Sales Desk** (`/admin/sales-desk`).

### Finance-Submission
Wird **NICHT** automatisch getriggert bei Reservierung. Der Finanzierungsfluss bleibt manuell.

---

## Phase 0: Code-Bereinigung Provisionsmodell

> **Prio:** P0 (Voraussetzung für alles Weitere)
> **Ziel:** Terminologie "Systemgebühr" bereinigen, falschen Plattformanteil korrigieren

### 0.1 — Engine: Terminologie-Update `ENG-PROVISION`

**Dateien:**
| Datei | Änderung |
|-------|----------|
| `src/engines/provision/spec.ts` | `SystemFeeInput` → `PlatformShareInput`, `SystemFeeResult` → `PlatformShareResult`, `SystemFeeConfig` → `ManagerCommissionConfig`, `SYSTEM_FEE_CONFIGS` → `MANAGER_COMMISSION_CONFIGS`, `systemFeePct` → `platformSharePct`. Descriptions anpassen: "Systemgebühr" → "Provisionsabgabe (25%)" |
| `src/engines/provision/engine.ts` | `calcSystemFee` → `calcPlatformShare`. JSDoc aktualisieren. |

**Details:**
- `PROVISION_DEFAULTS.systemFeePct: 25` → `PROVISION_DEFAULTS.platformSharePct: 25` (Wert bleibt 25, Name ändert sich)
- Config-Descriptions: "erfolgsabhängige Systemgebühr in Höhe von 25% Ihrer Netto-Provision" → "Bei erfolgreichem Abschluss werden 25% Ihrer Provision als Plattformanteil fällig."
- `commissionType`-Enum-Werte (`finance_tipp`, `immo_vermittlung`, `acq_erfolgsgebuehr`) bleiben als DB-Werte bestehen (Breaking Change vermeiden)

### 0.2 — Shared Component: Umbenennung

**Dateien:**
| Datei | Änderung |
|-------|----------|
| `src/components/shared/ManagerSystemgebuehr.tsx` | Rename → `ManagerProvisionen.tsx`. UI-Labels: "Systemgebühr-Vereinbarung" → "Provisionsvereinbarung", "Systemgebühr (25%)" → "Plattformanteil (25%)", "Ihr Netto" bleibt. Tabellenheader: "Systemgebühr" → "Plattformanteil" |

### 0.3 — Seiten: Import-Updates

**Dateien:**
| Datei | Änderung |
|-------|----------|
| `src/pages/portal/finanzierungsmanager/FMProvisionen.tsx` | Import `ManagerProvisionen` statt `ManagerSystemgebuehr`, `MANAGER_COMMISSION_CONFIGS` statt `SYSTEM_FEE_CONFIGS`. Description: "Ihre Provisionsvereinbarung mit System of a Town" |
| `src/pages/portal/vertriebspartner/ImmoSystemgebuehr.tsx` | Rename Datei → `ImmoProvisionen.tsx`. Gleiche Import-Änderungen. |
| `src/pages/portal/akquise-manager/AkquiseSystemgebuehr.tsx` | Rename Datei → `AkquiseProvisionen.tsx`. Gleiche Import-Änderungen. |
| `src/manifests/routesManifest.ts` | Component-Referenzen aktualisieren: `ImmoSystemgebuehr` → `ImmoProvisionen`, `AkquiseSystemgebuehr` → `AkquiseProvisionen` |

### 0.4 — contractGenerator: Platform-Share korrigieren

**Dateien:**
| Datei | Änderung |
|-------|----------|
| `src/lib/contractGenerator.ts` | Zeile 257: `platform_share_pct: 30` → `platform_share_pct: 25`. Import `PROVISION_DEFAULTS` und nutze `PROVISION_DEFAULTS.platformSharePct` statt Hardcode. |

### 0.5 — VerkaufsauftragTab: Consent-Label

**Dateien:**
| Datei | Änderung |
|-------|----------|
| `src/components/portfolio/VerkaufsauftragTab.tsx` | `systemFee` State-Key bleibt intern (kein Breaking Change), aber UI-Label: "Systemgebühr" → "Plattformanteil / Provisionsabgabe" |

### 0.6 — Z1 Admin: Label-Update

**Dateien:**
| Datei | Änderung |
|-------|----------|
| `src/pages/admin/CommissionApproval.tsx` | Spalte "Platform Fee" → "Plattformanteil (25%)" |

### 0.7 — TermsGatePanel: Label-Update

**Dateien:**
| Datei | Änderung |
|-------|----------|
| `src/components/shared/TermsGatePanel.tsx` | Variable `platform_fee` Label in Template → "Plattformanteil" |

---

## Phase 1: SLC Backbone (Event-Layer + Case-Tracking)

> **Prio:** P1
> **Ziel:** Auditierbare Event-Timeline für jeden Verkaufsvorgang ab Vertriebsfreigabe
> **Abhängigkeit:** Phase 0 abgeschlossen

### 1.1 — DB: `sales_cases` Tabelle

```
sales_cases
  id: UUID PK
  asset_type: 'property_unit' | 'project_unit'
  asset_id: UUID (→ units.id ODER dev_project_units.id)
  property_id: UUID | null (→ properties.id)
  project_id: UUID | null (→ dev_projects.id)
  listing_id: UUID | null (→ listings.id)
  current_phase: slc_phase ENUM
  deal_contact_id: UUID | null (→ contacts.id, aktueller Käufer)
  tenant_id: UUID (→ organizations.id)
  opened_at: TIMESTAMPTZ
  closed_at: TIMESTAMPTZ | null
  close_reason: 'won' | 'lost' | 'withdrawn' | null
  created_at / updated_at: TIMESTAMPTZ
```

**SLC Phasen (Enum `slc_phase`):**
```
MANDATE_ACTIVE    -- Verkaufsauftrag erteilt, Listing erstellt
PUBLISHED         -- In mindestens einem Kanal veröffentlicht
INQUIRY           -- Qualifizierte Anfrage eingegangen
RESERVED          -- Einheit reserviert für einen Käufer
CONTRACT_DRAFT    -- Kaufvertragsentwurf erstellt
NOTARY_SCHEDULED  -- Notartermin vereinbart
NOTARY_COMPLETED  -- Beurkundung erfolgt
HANDOVER          -- Übergabe durchgeführt
SETTLEMENT        -- Provision + Plattformanteil abgerechnet
CLOSED_WON        -- Abgeschlossen (Verkauf erfolgreich)
CLOSED_LOST       -- Abgeschlossen (kein Verkauf)
```

**RLS:** tenant_id basiert, analog zu `tenancy_lifecycle_events`.

### 1.2 — DB: `sales_lifecycle_events` Tabelle

```
sales_lifecycle_events
  id: UUID PK
  case_id: UUID → sales_cases.id
  event_type: TEXT (siehe Eventkatalog unten)
  severity: 'info' | 'warning' | 'error'
  phase_before: slc_phase | null
  phase_after: slc_phase | null
  actor_id: UUID | null (User der die Aktion auslöste)
  payload: JSONB
  tenant_id: UUID
  created_at: TIMESTAMPTZ
```

**RLS:** tenant_id basiert.

### 1.3 — Eventkatalog (Minimum-Set)

| Kategorie | event_type | Beschreibung |
|-----------|-----------|--------------|
| Mandat | `mandate.activated` | Verkaufsauftrag erteilt, Listing aktiv |
| Mandat | `mandate.revoked` | Verkaufsauftrag zurückgezogen |
| Distribution | `channel.published` | In einem Kanal veröffentlicht |
| Distribution | `channel.sync_failed` | Sync-Fehler bei einem Kanal |
| Distribution | `channel.removed` | Aus Kanal entfernt |
| Deal | `deal.inquiry_received` | Anfrage eines Interessenten |
| Deal | `deal.viewing_scheduled` | Besichtigung terminiert |
| Deal | `deal.reserved` | Einheit reserviert |
| Deal | `deal.reservation_expired` | Reservierung abgelaufen |
| Deal | `deal.reservation_cancelled` | Reservierung storniert |
| Vertrag | `deal.contract_drafted` | KV-Entwurf erstellt |
| Vertrag | `deal.contract_sent` | KV an Parteien versendet |
| Notar | `deal.notary_scheduled` | Notartermin vereinbart |
| Notar | `deal.notary_completed` | Beurkundung erfolgt |
| Übergabe | `deal.handover_completed` | Schlüsselübergabe |
| Settlement | `deal.commission_calculated` | Provision berechnet |
| Settlement | `deal.platform_share_settled` | Plattformanteil abgerechnet |
| Lifecycle | `case.closed_won` | Verkauf abgeschlossen |
| Lifecycle | `case.closed_lost` | Kein Verkauf |
| Lifecycle | `case.reopened` | Fall wiedereröffnet |

### 1.4 — ENG-SLC: spec.ts + engine.ts

**Dateien:**
| Datei | Inhalt |
|-------|--------|
| `src/engines/slc/spec.ts` | Typen: `SLCPhase`, `SLCEventType`, `SLCCase`, `SLCEvent`, `ChannelProjection`. Keine Logik. |
| `src/engines/slc/engine.ts` | Pure Functions: `determineNextPhase(events[])`, `computeChannelDrift(expected, actual)`, `isStuck(case, thresholdDays)` |
| `src/engines/index.ts` | Export `slc` |

**Registrierung:**
- `spec/current/06_engines/ENGINE_REGISTRY.md` → ENG-SLC eintragen
- `spec/current/07_golden_paths/GOLDEN_PATH_REGISTRY.md` → GP-SLC eintragen (Engine-Workflow, 10 Phasen)

### 1.5 — Channel Projection: listing_publications erweitern

**Migration:**
```sql
ALTER TABLE listing_publications
  ADD COLUMN expected_hash TEXT,
  ADD COLUMN last_synced_hash TEXT,
  ADD COLUMN last_synced_at TIMESTAMPTZ;
```

**Zweck:** Drift-Erkennung — wenn `expected_hash ≠ last_synced_hash`, ist der Kanal `outdated`.

### 1.6 — DB-Trigger: SLC Event-Schreiber

Trigger auf `listings` (Status-Änderung) und `reservations` (Statuswechsel), die automatisch Events in `sales_lifecycle_events` schreiben.

---

## Phase 2: Reservierungen zusammenführen

> **Prio:** P2
> **Ziel:** Eine einheitliche Reservierungs-Struktur für Bestand (MOD-04) und Projekte (MOD-13)
> **Abhängigkeit:** Phase 1 abgeschlossen

### 2.1 — Analyse der zwei Tabellen

| Feld | `reservations` (MOD-04) | `dev_project_reservations` (MOD-13) | Ziel |
|------|------------------------|--------------------------------------|------|
| ID | id | id | id |
| Asset-Referenz | listing_id | project_id + unit_id | case_id (→ sales_cases) |
| Käufer | buyer_contact_id | buyer_contact_id | buyer_contact_id |
| Partner | — | partner_org_id | partner_org_id |
| Preis | reserved_price | reserved_price | reserved_price |
| Provision | — | commission_amount, commission_rate | commission_amount, commission_rate |
| Notartermin | notary_date | notary_date | notary_date |
| Status | status | status | status (vereinheitlicht) |
| Ablauf | — | expiry_date | expiry_date |
| Storno | — | cancellation_date, cancellation_reason | cancellation_date, cancellation_reason |
| Übergabe | — | completion_date | completion_date |
| Bestätigungen | owner_confirmed_at, buyer_confirmed_at | — | owner_confirmed_at, buyer_confirmed_at |

### 2.2 — Neue einheitliche `sales_reservations` Tabelle

Zusammenführung aller Felder aus beiden Tabellen in eine neue Tabelle, die über `case_id` an `sales_cases` gebunden ist.

### 2.3 — Migrationsstrategie

1. Neue Tabelle `sales_reservations` erstellen
2. Daten aus `reservations` + `dev_project_reservations` migrieren
3. Code in MOD-04 und MOD-13 auf neue Tabelle umstellen
4. Alte Tabellen mit Views/Aliases überbrücken (Übergangsphase)
5. Alte Tabellen nach Validierung entfernen

---

## Phase 3: Sales Desk Integration (Z1 Control Plane)

> **Prio:** P3
> **Ziel:** SLC-Cases im bestehenden Sales Desk sichtbar und steuerbar
> **Abhängigkeit:** Phase 1 abgeschlossen
> **Layout:** Inline-Scroll mit SectionCards, KEINE Collapsibles

### 3.1 — Sales Desk Dashboard erweitern

**Datei:** `src/pages/admin/sales-desk/SalesDeskDashboard.tsx`

Neue SectionCards (persistent, scrollbar):
1. **Case Registry** — Alle offenen SLC-Cases mit Phase, Asset, Tenant, letztem Event, Tage-in-Phase
2. **Channel Drift Monitor** — Kanäle mit `expected_hash ≠ last_synced_hash` (Inline-Tabelle)
3. **Stuck Monitor** — Cases > X Tage in einer Phase ohne Fortschritt (Inline-Tabelle)
4. **Repair Queue** — Offene Korrektur-Aktionen (siehe Phase 4)

### 3.2 — Case-Detail View

**Neue Datei:** `src/pages/admin/sales-desk/SalesCaseDetail.tsx`

- Event-Timeline (chronologisch, alle Events des Cases)
- Channel-Status pro Kanal (sync status, last error)
- Deal-Daten (Reservierung, Käufer, Provision)
- Aktions-Buttons (Phase manuell weiterschalten, Case schließen)

---

## Phase 4: Repair-Actions Katalog

> **Prio:** P4
> **Ziel:** Standardisierte Korrektur-Aktionen für den Verkaufsprozess
> **Abhängigkeit:** Phase 1

### 4.1 — Repair-Action Registry

| Action | Trigger | Owner | Approval | Erzeugte Events |
|--------|---------|-------|----------|-----------------|
| `RESYNC_CHANNEL` | Hash-Drift erkannt | System | Nein (auto) | `channel.published` oder `channel.sync_failed` |
| `FIX_MEDIA_ASSIGNMENT` | Bilder fehlen oder falsch zugeordnet | Nutzer | Nein | `asset.media_fixed` |
| `REQUEST_MISSING_DOCUMENT` | Pflichtdokument fehlt | System | Nein | `repair.document_requested` |
| `VALIDATE_INVEST_INPUTS` | InvestEngine-Felder unvollständig | System | Nein | `repair.validation_completed` |
| `RESOLVE_AMBIGUOUS_UNIT_MATCH` | Unit-Zuordnung aus Intake uneindeutig | Nutzer | Ja | `repair.unit_matched` |
| `REBUILD_LANDINGPAGE` | LP-Daten veraltet | Nutzer | Nein | `channel.published` |
| `CONFIRM_RESERVATION_EXPIRY` | Reservierung abgelaufen, keine Verlängerung | Nutzer | Ja | `deal.reservation_expired` |
| `RECONCILE_CHANNEL` | Erwarteter vs tatsächlicher Kanal-Zustand prüfen | System | Nein | `channel.reconciled` |
| `REPROCESS_DOCUMENT` | Dokument-Parsing fehlgeschlagen, Retry | System | Nein | `repair.document_reprocessed` |
| `COMMISSION_SETTLEMENT` | Deal abgeschlossen, Provision + Plattformanteil berechnen | System | Ja (Z1) | `deal.commission_calculated`, `deal.platform_share_settled` |

### 4.2 — DB: `sales_repair_actions` Tabelle

```
sales_repair_actions
  id: UUID PK
  case_id: UUID → sales_cases.id
  action_type: TEXT (aus Katalog oben)
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'
  priority: 'low' | 'medium' | 'high' | 'critical'
  requires_approval: BOOLEAN
  approved_by: UUID | null
  approved_at: TIMESTAMPTZ | null
  input_data: JSONB
  output_data: JSONB | null
  error_message: TEXT | null
  tenant_id: UUID
  created_at / completed_at: TIMESTAMPTZ
```

---

## Phase 5: Deal-Pipeline (Reservierung → Settlement)

> **Prio:** P5
> **Ziel:** Vollständige Deal-Abwicklung von Reservierung bis Provisionsabrechnung
> **Abhängigkeit:** Phase 2 (einheitliche Reservierungen)

### 5.1 — Deal-Phasen im Detail

| Phase | Datenfelder | UI-Ort | Aktion |
|-------|-------------|--------|--------|
| RESERVED | buyer_contact_id, reserved_price, expiry_date | MOD-04/13 + Sales Desk | Reservierung anlegen |
| CONTRACT_DRAFT | contract_document_id, contract_sent_at | Sales Desk | KV-Entwurf hochladen/verlinken |
| NOTARY_SCHEDULED | notary_date, notary_location | Sales Desk | Notartermin eintragen |
| NOTARY_COMPLETED | notary_completed_at | Sales Desk | Beurkundung bestätigen |
| HANDOVER | handover_date, handover_protocol_id | MOD-04 | Übergabeprotokoll |
| SETTLEMENT | commission_amount, platform_share, net_commission | Sales Desk + Z1 | Abrechnung |

### 5.2 — Provisions-Settlement Workflow

1. Bei `case.closed_won`: `ENG-PROVISION.calcCommission()` für Maklerprovision
2. `ENG-PROVISION.calcPlatformShare()` (25%) für Plattformanteil
3. Commission-Record in `commissions` erstellen (mit `reference_id = case_id`)
4. Event: `deal.commission_calculated` + `deal.platform_share_settled`
5. Z1 Commission Approval Flow (bestehend)

### 5.3 — Beratungsprotokoll

Nach Übergabe: Pflicht-Dokument "Beratungsprotokoll" (§34c GewO) archivieren in DMS.

---

## Phase 6: Monitoring & CRON

> **Prio:** P6
> **Ziel:** Automatische Überwachung, Drift-Detection, Stuck-Cases
> **Abhängigkeit:** Phase 1 + 3

### 6.1 — Weekly CRON Edge Function: `sot-sales-lifecycle`

Aufgaben:
1. **Stuck-Detection:** Cases > 14 Tage in einer Phase ohne Event → Warning-Event
2. **Channel-Drift-Check:** `expected_hash ≠ last_synced_hash` → Repair-Action `RESYNC_CHANNEL`
3. **Reservation-Expiry:** Abgelaufene Reservierungen → Repair-Action `CONFIRM_RESERVATION_EXPIRY`
4. **Settlement-Check:** Cases in NOTARY_COMPLETED > 30 Tage ohne Settlement → Warning

### 6.2 — KI-Summary (optional, Credit-basiert)

Wöchentlicher SLC-Status-Report pro Tenant via Gemini 2.5 Flash:
- Offene Cases, Durchlaufzeiten, Bottlenecks, Repair-Queue-Tiefe

---

## Phase 7: GP-SLC Golden Path Registrierung

> **Prio:** P7 (kann parallel zu Phase 1 laufen)

### 7.1 — Engine-Workflow Definition

```
GP-SLC (Engine-Workflow)
  Typ: engine_workflow
  Zone: Z1 + Z2
  Phasen: 10 (MANDATE_ACTIVE → CLOSED)
  Fail-States: on_timeout, on_rejected, on_error (pro Phase)
  Camunda-ready: Ja (Correlation Keys, Wait Messages)
  Ledger: sales_lifecycle_events (Whitelist: alle event_types aus Katalog)
```

### 7.2 — Registrierungspunkte

| Datei | Eintrag |
|-------|---------|
| `spec/current/07_golden_paths/GOLDEN_PATH_REGISTRY.md` | GP-SLC mit 10 Phasen |
| `spec/current/06_engines/ENGINE_REGISTRY.md` | ENG-SLC |
| `src/goldenpath/contextResolvers.ts` | SLC Context Resolver (prüft Phase, Events, Channel-Status) |
| `src/manifests/goldenPaths/GP_SLC.ts` | Step-Definitionen mit Camunda-Keys |

---

## Zusammenfassung: Implementierungsreihenfolge

```
Phase 0  ──→  Provisions-Bereinigung (Terminologie + 30%→25% Fix)
              ↓
Phase 1  ──→  SLC Backbone (Tabellen + Engine + Events)
              ↓
Phase 7  ──→  GP-SLC Registrierung (parallel zu Phase 1)
              ↓
Phase 2  ──→  Reservierungen zusammenführen
              ↓
Phase 3  ──→  Sales Desk Integration (Z1 Views)
              ↓
Phase 4  ──→  Repair-Actions
              ↓
Phase 5  ──→  Deal-Pipeline (Reservierung → Settlement)
              ↓
Phase 6  ──→  Monitoring & CRON
```

---

## IST → SOLL Gap-Matrix

| # | Komponente | IST | Gap | Aufwand | Phase |
|---|-----------|-----|-----|---------|-------|
| 1 | Terminologie "Systemgebühr" | Falsch benannt, 30% hardcoded | Umbenennung + 25% Fix | S | 0 |
| 2 | Event-Log für Verkauf | Nicht vorhanden | Neue Tabelle + Trigger | M | 1 |
| 3 | Sales-Case Tracking | Nicht vorhanden | Neue Tabelle + Engine | M | 1 |
| 4 | Channel Drift-Detection | Kein Hash-Vergleich | 3 Spalten + Logik | S | 1 |
| 5 | Einheitliche Reservierung | 2 getrennte Tabellen | Migration + Code-Update | L | 2 |
| 6 | Sales Desk SLC Views | Nur Projekt-Requests | Case Registry + Monitors | M | 3 |
| 7 | Repair-Actions | Nicht vorhanden | Tabelle + Katalog + UI | M | 4 |
| 8 | Deal-Pipeline (KV→Notar→Übergabe) | Nur Reservierung | Neue Phasen + Felder | L | 5 |
| 9 | Provisions-Settlement Workflow | Manuell, unverknüpft | Auto-Trigger aus Deal | M | 5 |
| 10 | CRON Monitoring | Nicht vorhanden | Edge Function | M | 6 |
| 11 | GP-SLC Registrierung | Nicht vorhanden | Spec + Manifest + Resolver | S | 7 |

**Legende:** S = 1-2 Dateien, M = 3-5 Dateien, L = 6+ Dateien
