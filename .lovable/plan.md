

# Golden Path Engine — Alle 5 fehlenden GP-Definitionen in einem Schritt

---

## Ausgangslage

Die Golden Path Engine (V1.0) ist generisch gebaut. Neue Golden Paths erfordern NUR:
- 1 TypeScript-Datei in `src/manifests/goldenPaths/`
- 1 Zeile Registration in `src/manifests/goldenPaths/index.ts`
- Optional: Neue Ledger-Events in der Whitelist

Engine, Types, Hooks, Guards bleiben UNVERAENDERT.

---

## Was wird erstellt

```text
DATEI                                      | GP           | STEPS | KOMPLEXITAET
-------------------------------------------|--------------|-------|-------------
src/manifests/goldenPaths/MOD_07_11.ts     | Finanzierung | 7-8   | HOCH
src/manifests/goldenPaths/MOD_08_12.ts     | Akquise      | 6-7   | HOCH
src/manifests/goldenPaths/MOD_13.ts        | Projekte     | 5-6   | HOCH
src/manifests/goldenPaths/GP_VERMIETUNG.ts | Vermietung   | 5-6   | MITTEL
src/manifests/goldenPaths/GP_LEAD.ts       | Lead-Gen     | 4     | NIEDRIG
```

Plus: Update von `src/manifests/goldenPaths/index.ts` (5 neue Imports + Registrations + Ledger-Events).

---

## GP-02: Finanzierung (MOD_07_11.ts)

```text
ID:       gp-finance-lifecycle
MODULE:   MOD-07 / MOD-11
VERSION:  1.0.0
AKTEURE:  Kunde (MOD-07), Admin (Z1 FutureRoom), Manager (MOD-11)

REQUIRED ENTITIES:
  - applicant_profiles (Selbstauskunft)
  - finance_requests (Anfrage-Stammdaten)

REQUIRED CONTRACTS:
  - terms_gate_acceptance (TermsGate 30% Gebuehr, MOD-11)

STEPS:
  Phase 1: Selbstauskunft erstellen (MOD-07, user_task)
  Phase 2: Selbstauskunft abschliessen (MOD-07, user_task)
  Phase 3: Anfrage einreichen (MOD-07, user_task)
           -> CONTRACT_FINANCE_SUBMIT (Z2->Z1)
  Phase 4: Z1 Triage + Assignment (Z1, wait_message)
           -> CONTRACT_MANDATE_ASSIGNMENT (Z1->Z2)
  Phase 5: TermsGate akzeptieren (MOD-11, user_task)
  Phase 6: Case bearbeiten (MOD-11, user_task)
  Phase 7: Bank-Einreichung (MOD-11, user_task)
           -> CONTRACT_FINANCE_DOC_REMINDER (Z2->Z1, optional)

SUCCESS STATE:
  - applicant_profile_complete
  - finance_request_submitted
  - mandate_assigned
  - terms_gate_accepted
  - bank_submitted
```

---

## GP-03: Akquise Mandat (MOD_08_12.ts)

```text
ID:       gp-acquisition-mandate
MODULE:   MOD-08 / MOD-12
VERSION:  1.0.0
AKTEURE:  Investor (MOD-08), Admin (Z1 Acquiary), Manager (MOD-12)

REQUIRED ENTITIES:
  - acq_mandates (Suchmandat)

REQUIRED CONTRACTS:
  - terms_gate_acceptance (TermsGate 30% Gebuehr, MOD-12)

STEPS:
  Phase 1: Suchprofil erstellen (MOD-08, user_task)
  Phase 2: Mandat einreichen (MOD-08, user_task)
           -> CONTRACT_ACQ_MANDATE_SUBMIT (Z2->Z1)
  Phase 3: Z1 Triage + Assignment (Z1, wait_message)
           -> CONTRACT_MANDATE_ASSIGNMENT (Z1->Z2)
  Phase 4: TermsGate akzeptieren (MOD-12, user_task)
  Phase 5: Recherche + Outbound (MOD-12, user_task)
           -> CONTRACT_ACQ_OUTBOUND_EMAIL (Z2->Z1)
           -> CONTRACT_ACQ_INBOUND_EMAIL (EXTERN->Z1)
  Phase 6: Analyse + Reporting (MOD-12, user_task)

SUCCESS STATE:
  - mandate_submitted
  - mandate_assigned
  - terms_gate_accepted
  - offers_created
```

---

## GP-05: Projekte (MOD_13.ts)

```text
ID:       gp-project-lifecycle
MODULE:   MOD-13
VERSION:  1.0.0
AKTEURE:  Bautraeger (MOD-13), System (MOD-04, MOD-06, MOD-09, Z3)

REQUIRED ENTITIES:
  - dev_projects (Projekt-Stammdaten)
  - dev_project_units (Einheiten)

STEPS:
  Phase 1: Projekt anlegen (MOD-13, user_task)
  Phase 2: Einheiten planen (MOD-13, user_task)
  Phase 3: Phasenwechsel Bau->Vertrieb (MOD-13, user_task)
           -> CONTRACT_PROJECT_INTAKE (Z1->Z2, optional)
  Phase 4: Listing Distribution (service_task)
           -> CONTRACT_LISTING_PUBLISH (Z2->Z1)
           -> CONTRACT_LISTING_DISTRIBUTE (Z1->Z2)
  Phase 5: Landing Page (service_task)
           -> CONTRACT_LANDING_PAGE_GENERATE (Z1->Z2)
  Phase 6: Uebergabe + Abschluss (MOD-13, user_task)

SUCCESS STATE:
  - project_exists
  - units_created
  - listings_published
  - distribution_active
```

---

## GP-10: Vermietung (GP_VERMIETUNG.ts)

```text
ID:       gp-rental-lifecycle
MODULE:   MOD-05 / MOD-20
VERSION:  1.0.0
AKTEURE:  Vermieter (MOD-04/05), System (Z1), Mieter (MOD-20)

REQUIRED ENTITIES:
  - leases (Mietvertrag)
  - renter_invites (Einladung)

STEPS:
  Phase 1: Mietvertrag anlegen (MOD-04/05, user_task)
  Phase 2: Mieter einladen (MOD-05, user_task)
           -> CONTRACT_RENTER_INVITE (Z2->Z1, NEU — muss als Contract-Datei erstellt werden)
  Phase 3: Einladung annehmen (MOD-20, wait_message)
  Phase 4: Datenraum aktivieren (service_task)
  Phase 5: Portal-Zugang aktiv (MOD-20, service_task)

SUCCESS STATE:
  - lease_exists
  - invite_sent
  - invite_accepted
  - portal_active

HINWEIS: CONTRACT_RENTER_INVITE.md wird als neue Contract-Datei
in spec/current/06_api_contracts/ erstellt.
```

---

## GP-09: Lead-Generierung (GP_LEAD.ts)

```text
ID:       gp-lead-generation
MODULE:   ZONE-3 / MOD-09 / MOD-10
VERSION:  1.0.0
AKTEURE:  Website-Besucher (Z3), System (Z1), Partner (MOD-09/10)

REQUIRED ENTITIES:
  - leads (Lead-Stammdaten)

STEPS:
  Phase 1: Lead-Erfassung (Z3, service_task)
           -> CONTRACT_LEAD_CAPTURE (Z3->Z1)
  Phase 2: Lead-Qualifizierung (Z1, user_task)
  Phase 3: Lead-Assignment (Z1, user_task)
  Phase 4: Lead-Konvertierung (MOD-09/10, user_task)

SUCCESS STATE:
  - lead_captured
  - lead_qualified
  - lead_assigned
```

---

## Aenderungen an index.ts

Neue Imports, Registrations und Ledger-Events:

```text
NEUE IMPORTS:
  - MOD_07_11_GOLDEN_PATH from './MOD_07_11'
  - MOD_08_12_GOLDEN_PATH from './MOD_08_12'
  - MOD_13_GOLDEN_PATH from './MOD_13'
  - GP_VERMIETUNG_GOLDEN_PATH from './GP_VERMIETUNG'
  - GP_LEAD_GOLDEN_PATH from './GP_LEAD'

NEUE REGISTRATIONS:
  - registerGoldenPath('MOD-07', MOD_07_11)
  - registerGoldenPath('MOD-08', MOD_08_12)
  - registerGoldenPath('MOD-13', MOD_13)
  - registerGoldenPath('GP-VERMIETUNG', GP_VERMIETUNG)
  - registerGoldenPath('GP-LEAD', GP_LEAD)

NEUE LEDGER EVENTS:
  - 'finance.request.submitted'
  - 'finance.mandate.assigned'
  - 'finance.bank.submitted'
  - 'acq.mandate.submitted'
  - 'acq.mandate.assigned'
  - 'acq.offer.created'
  - 'project.created'
  - 'project.phase.changed'
  - 'renter.invite.sent'
  - 'renter.invite.accepted'
  - 'lead.captured'
  - 'lead.assigned'
```

---

## Neue Contract-Datei

```text
DATEI: spec/current/06_api_contracts/CONTRACT_RENTER_INVITE.md

Direction:    Z2->Z1
Trigger:      Vermieter laedt Mieter ein (MOD-05 renter_invites Insert)
Payload:      { lease_id, tenant_id, contact_id, email, invite_code }
SoT:          Z1 Governance (Logging, Email-Dispatch via Edge Function)
```

---

## Was NICHT geaendert wird

```text
src/goldenpath/engine.ts          — Generisch, bleibt
src/manifests/goldenPaths/types.ts — V1.0, bleibt
src/goldenpath/useGoldenPath.ts   — Generisch, bleibt
src/goldenpath/GoldenPathGuard.tsx — Generisch, bleibt
src/goldenpath/devValidator.ts    — Generisch, bleibt
src/manifests/goldenPaths/MOD_04.ts — Referenz-GP, bleibt
```

---

## Zusammenfassung

6 neue Dateien, 1 Update:

```text
NEU:  src/manifests/goldenPaths/MOD_07_11.ts
NEU:  src/manifests/goldenPaths/MOD_08_12.ts
NEU:  src/manifests/goldenPaths/MOD_13.ts
NEU:  src/manifests/goldenPaths/GP_VERMIETUNG.ts
NEU:  src/manifests/goldenPaths/GP_LEAD.ts
NEU:  spec/current/06_api_contracts/CONTRACT_RENTER_INVITE.md
UPD:  src/manifests/goldenPaths/index.ts
```

Keine Engine-Aenderung. Keine Type-Aenderung. Alles folgt dem MOD-04-Blueprint.

