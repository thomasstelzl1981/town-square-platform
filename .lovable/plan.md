
# MOD-07 Untermodul "Privatkredit" — Inline Flow (API-Ready)

## Ueberblick

Ein neuer fuenfter Tile "Privatkredit" wird in MOD-07 (Finanzierung) ergaenzt. Die gesamte Seite folgt dem Inline-Flow-Standard: Ein langer, scrollbarer Seitenaufbau ohne Wizard, Tabs oder Stepper. Alle fuenf Bereiche (Employment Gate, Vergleichsrechner, Antrag, Dokumente, Submit) sind gleichzeitig sichtbar.

Die Selbstauskunft-Daten werden aus der bestehenden `applicant_profiles`-Tabelle geladen (SSOT). Die Europace-API wird als Adapter-Stub vorbereitet, sodass spaeter nur die API-Anbindung aktiviert werden muss.

---

## Datenbank

### Neue Tabelle: `consumer_loan_cases`

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | UUID PK | |
| tenant_id | UUID FK | Mandanten-Zuordnung |
| user_id | UUID | Ersteller |
| source_profile_id | UUID FK nullable | Referenz auf `applicant_profiles.id` |
| employment_status | TEXT | 'employed' oder 'self_employed' |
| requested_amount | NUMERIC | Kreditbetrag EUR |
| requested_term_months | INTEGER | Laufzeit in Monaten |
| selected_offer_id | TEXT nullable | ID des gewaehlten Mock-Angebots |
| selected_offer_data | JSONB nullable | Snapshot des gewaehlten Angebots |
| status | TEXT DEFAULT 'draft' | State Machine (draft, offers_ready, docs_missing, ready_to_submit, submitted, in_review, approved, rejected, signed, paid_out, cancelled) |
| provider | TEXT DEFAULT 'europace' | |
| provider_case_ref | TEXT nullable | Europace-Referenz |
| consent_data_correct | BOOLEAN DEFAULT false | |
| consent_credit_check | BOOLEAN DEFAULT false | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

RLS-Policies:
- SELECT/INSERT/UPDATE: Nur eigener Tenant (`tenant_id = get_active_tenant_id()`)
- DELETE: Nicht erlaubt (Status-Transition statt Loeschung)

### Neue Tabelle: `consumer_loan_documents` (Link-Tabelle)

| Spalte | Typ |
|--------|-----|
| id | UUID PK |
| case_id | UUID FK -> consumer_loan_cases |
| document_type | TEXT | ('payslip', 'bank_statement', 'id_document') |
| dms_document_id | UUID FK nullable -> dms_documents |
| status | TEXT DEFAULT 'missing' | ('missing', 'uploaded', 'verified') |
| created_at | TIMESTAMPTZ |

RLS: Gleich wie consumer_loan_cases (tenant-basiert).

---

## Route & Manifest

### routesManifest.ts — MOD-07 Tiles erweitern

Aktuell 4 Tiles. Wird auf 5 erweitert:

```
tiles: [
  { path: "selbstauskunft", ... },
  { path: "dokumente", ... },
  { path: "anfrage", ... },
  { path: "status", ... },
  { path: "privatkredit", component: "PrivatkreditTab", title: "Privatkredit" },  // NEU
]
```

### FinanzierungPage.tsx — Route hinzufuegen

Neuer lazy-Import und Route fuer `privatkredit`.

### ManifestRouter.tsx — Component Map

Lazy-Import fuer `PrivatkreditTab` in `portalDynamicComponentMap` hinzufuegen (falls noetig, abhaengig davon ob FinanzierungPage eigene Routes verwaltet — ja, tut es, also nur in FinanzierungPage.tsx).

---

## Seitenaufbau: PrivatkreditTab.tsx (NEUE DATEI)

Eine einzige scrollbare Seite mit 5 logisch getrennten Inline-Bereichen:

```text
+=========================================+
| ModulePageHeader: "Privatkredit"        |
| "Kredit beantragen — powered by        |
|  Europace"                              |
+=========================================+

+-----------------------------------------+
| 1. EMPLOYMENT GATE                      |
|                                         |
| Sind Sie angestellt oder selbstaendig?  |
| ( ) Angestellt  ( ) Selbstaendig        |
|                                         |
| [Bei Selbstaendig: Info-Box + CTA]      |
+-----------------------------------------+

+-----------------------------------------+
| 2. VERGLEICHSRECHNER                    |
|                                         |
| Kreditbetrag: [______] EUR              |
| Laufzeit:     [______] Monate           |
| [Angebote berechnen]                    |
|                                         |
| --- Angebotskarten (Grid) ---           |
| | Bank A | Bank B | Bank C |            |
| | 3.49%  | 3.89%  | 4.12%  |           |
| | 342 €  | 358 €  | 367 €  |           |
| | [Waehlen] [Waehlen] [Waehlen] |       |
+-----------------------------------------+

+-----------------------------------------+
| 3. ANTRAG (Read-Only, Selbstauskunft)   |
|                                         |
| A) Persoenliche Daten (aus Profil)      |
| B) Beschaeftigung (aus Profil)          |
| C) Haushalt (aus Profil)               |
|                                         |
| [Selbstauskunft bearbeiten ->]          |
+-----------------------------------------+

+-----------------------------------------+
| 4. DOKUMENTE                            |
|                                         |
| Checkliste:                             |
| [x] Gehaltsabrechnungen (3 Monate)     |
| [ ] Kontoauszuege (3 Monate)           |
| [ ] Ausweisdokument                    |
|                                         |
| [Upload-Dropzone]                       |
+-----------------------------------------+

+-----------------------------------------+
| 5. BESTAETIGEN & ABSCHICKEN             |
|                                         |
| [ ] Richtigkeit bestaetigt             |
| [ ] Bonitaetspruefung eingewilligt     |
|                                         |
| [An Europace uebermitteln]              |
|                                         |
| Status: "Eingereicht — wird geprueft"   |
+-----------------------------------------+
```

### Deaktivierungs-Logik bei "Selbstaendig"

Wenn `employment_status === 'self_employed'`:
- Bereiche 2-5 erhalten `opacity-50 pointer-events-none`
- Info-Box erscheint mit Hinweis und CTA "Spezialisten anfordern"

---

## Komponenten-Aufbau (NEUE DATEIEN)

### `src/pages/portal/finanzierung/PrivatkreditTab.tsx`
Hauptseite. Laedt/erstellt `consumer_loan_case` fuer den aktuellen Tenant. Rendert die 5 Inline-Sektionen.

### `src/components/privatkredit/EmploymentGate.tsx`
RadioGroup mit 2 Optionen. Steuert `disabled`-State fuer den Rest der Seite. Info-Box fuer Selbstaendige.

### `src/components/privatkredit/LoanCalculator.tsx`
Inputs fuer Betrag + Laufzeit. Button "Angebote berechnen". Rendert Mock-Angebotskarten darunter.

### `src/components/privatkredit/MockOfferCard.tsx`
Einzelne Angebotskarte mit Effektivzins, Rate, Laufzeit, Gesamtbetrag, "empfohlen"-Badge, "Waehlen"-Button.

### `src/components/privatkredit/ApplicationPreview.tsx`
Read-Only-Darstellung der Selbstauskunft-Daten in 3 Bloecken (Persoenlich, Beschaeftigung, Haushalt). Button "Selbstauskunft bearbeiten" navigiert zu `/portal/finanzierung/selbstauskunft`.

### `src/components/privatkredit/DocumentChecklist.tsx`
Checkliste mit Status-Indikatoren. Upload-Dropzone (react-dropzone, bereits installiert). Verknuepfung mit DMS.

### `src/components/privatkredit/SubmitSection.tsx`
Consent-Checkboxen + Submit-Button. Status-Anzeige nach Einreichung. Button nur aktiv wenn alle Voraussetzungen erfuellt.

---

## Hook: `useConsumerLoan.ts` (NEUE DATEI)

```
useConsumerLoanCase(tenantId)     — Query: Laedt/erstellt draft Case
useUpdateConsumerLoan()           — Mutation: Update Case-Felder
useCalculateOffers(amount, term)  — Mock: Generiert 5-10 simulierte Angebote
useSubmitConsumerLoan()           — Mutation: Status -> submitted (Adapter-Stub)
```

### Mock-Angebote (Adapter-Stub)

Die Funktion `calculateMockOffers(amount, termMonths)` generiert 6-8 realistische Angebote:

| Bank (Mock) | Zinssatz-Range |
|-------------|---------------|
| Sparkasse | 3.29% - 4.49% |
| Deutsche Bank | 3.49% - 4.69% |
| ING | 2.99% - 4.19% |
| Commerzbank | 3.59% - 4.79% |
| DKB | 2.89% - 3.99% |
| Targobank | 3.99% - 5.49% |
| HypoVereinsbank | 3.39% - 4.59% |
| Santander | 4.19% - 5.99% |

Formeln: Annuitaet = P * r / (1 - (1+r)^(-n)), Gesamtbetrag = Rate * Laufzeit.

Spaeterer Austausch: `europace_calculate_offers(case_id)` und `europace_submit_consumer_loan_case(case_id)` als exportierte Stub-Funktionen in `src/services/europace/consumerLoanAdapter.ts`.

---

## Adapter-Stub: `src/services/europace/consumerLoanAdapter.ts` (NEUE DATEI)

Zwei Funktionen, die spaeter durch echte API-Calls ersetzt werden:

```typescript
// Stub: Spaeter durch Europace API ersetzen
export async function europace_calculate_offers(caseId: string) {
  // TODO: POST /api/europace/consumer-loan/offers
  throw new Error('Europace API not yet connected');
}

export async function europace_submit_consumer_loan_case(caseId: string) {
  // TODO: POST /api/europace/consumer-loan/submit
  throw new Error('Europace API not yet connected');
}
```

---

## Dateien-Uebersicht

| Aktion | Datei |
|--------|-------|
| MIGRATION | `consumer_loan_cases` Tabelle + RLS |
| MIGRATION | `consumer_loan_documents` Link-Tabelle + RLS |
| EDIT | `src/manifests/routesManifest.ts` — 5. Tile "Privatkredit" |
| EDIT | `src/pages/portal/FinanzierungPage.tsx` — Route + Lazy Import |
| NEU | `src/pages/portal/finanzierung/PrivatkreditTab.tsx` — Hauptseite |
| NEU | `src/components/privatkredit/EmploymentGate.tsx` |
| NEU | `src/components/privatkredit/LoanCalculator.tsx` |
| NEU | `src/components/privatkredit/MockOfferCard.tsx` |
| NEU | `src/components/privatkredit/ApplicationPreview.tsx` |
| NEU | `src/components/privatkredit/DocumentChecklist.tsx` |
| NEU | `src/components/privatkredit/SubmitSection.tsx` |
| NEU | `src/hooks/useConsumerLoan.ts` — CRUD + Mock-Offers |
| NEU | `src/services/europace/consumerLoanAdapter.ts` — API-Stubs |
