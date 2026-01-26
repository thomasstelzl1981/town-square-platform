# MOD-09 — VERTRIEBSPARTNER (Sales Partners & Advisor Network)

**Version:** v2.0.0  
**Status:** SPEC COMPLETE  
**Letzte Aktualisierung:** 2026-01-25  
**Zone:** 2 (User Portal)  
**Typ:** ADDON (nur für Partner-Tenants)  
**Route-Prefix:** `/portal/vertriebspartner`  
**Abhängig von:** MOD-06 (Listings), MOD-08 (Investment-Suche), MOD-04 (Properties), MOD-01 (Contacts), MOD-07 (Finanzierung), Backbone (Consents, Audit)

> **WICHTIG:** Dieses Modul war zuvor MOD-08. Es wurde auf MOD-09 verschoben, da MOD-08 jetzt "Investment-Suche / Ankauf" ist.

---

## 1) MODULDEFINITION

### 1.1 Ziel

MOD-08 „Vertriebspartner" ist das operative ADDON-Modul für Vertriebspartner (sales_partner Rolle). Es ermöglicht das Browsen von partner-sichtbaren Listings, die Verwaltung einer eigenen Deal-Pipeline, Investmentberatung und Provisionsabwicklung. **Dieses Modul ist nur für Partner-Tenants verfügbar.**

### 1.2 Nutzerrollen

| Rolle | Zugang | Beschreibung |
|-------|--------|--------------|
| sales_partner | Full | Eigene Pipeline, Listings (Read), Beratung |
| org_admin (Plattform) | Oversight | Alle Pipelines, Commission Approval |
| internal_ops | Read | Unterstützung, Reporting |

### 1.3 Scope IN (testbar)

- Partner-sichtbare Listings aus MOD-06 browsen (Read-only)
- Investment Engine für Objektanalyse (Rendite, Steuer, Cashflow)
- Pipeline-Management (Deals anlegen, Stages verschieben)
- Investmentprofil-Matching für Kunden
- Commission-Tracking mit COMMISSION_AGREEMENT Gate
- Netzwerk-/Team-Übersicht

### 1.4 Scope OUT (Nicht-Ziele)

- Listing-Erstellung (→ MOD-06)
- Property-Bearbeitung (→ MOD-04)
- Financing Package Erstellung (→ MOD-07)
- Reservation-Abschluss ohne Owner-Confirmation (→ MOD-06)
- **Lead/Deal-Pipeline-Management (→ MOD-10)**
- Eigene Investment-Suche (→ MOD-08)

### 1.5 Dependencies

| Modul/Backbone | Art | Beschreibung |
|----------------|-----|--------------|
| MOD-06 Verkauf | Read | listings (partner_visible=true) |
| MOD-04 Immobilien | Read | properties (Stammdaten) |
| MOD-01 Stammdaten | Read | contacts (Kunden) |
| MOD-07 Finanzierung | Link | Handoff für finance_packages |
| Backbone | Read/Write | user_consents (COMMISSION_AGREEMENT) |
| Backbone | Write | audit_events |

### 1.6 Source of Truth Matrix

| Domäne | SoT-Modul | Andere Module |
|--------|-----------|---------------|
| Partner Pipelines | **MOD-08** | MOD-06: Status-Read |
| Investment Profiles | **MOD-08** | — |
| Commissions | **MOD-08** | MOD-06: Trigger |
| Listings | MOD-06 | MOD-08: Read-only |
| Properties | MOD-04 | MOD-07: Read-only |

---

## 2) EXISTIERENDE TABELLEN

### 2.1 `partner_pipelines` (EXISTS)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Isolation |
| contact_id | uuid FK | Kunde/Interessent |
| property_id | uuid FK | Immobilie (optional) |
| assigned_to | uuid FK | Zugewiesener Partner |
| stage | enum | Pipeline-Stage |
| deal_value | numeric | Dealwert |
| expected_close_date | date | Erwarteter Abschluss |
| notes | text | Notizen |

**Stage Enum (EXISTS):**
```
lead → qualified → proposal → negotiation → reservation → closing → won/lost
```

### 2.2 `investment_profiles` (EXISTS)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Isolation |
| contact_id | uuid FK | Kunde |
| is_active | boolean | Aktiv |
| min_investment | numeric | Min. Investment |
| max_investment | numeric | Max. Investment |
| min_yield | numeric | Min. Rendite |
| max_yield | numeric | Max. Rendite |
| preferred_cities | text[] | Bevorzugte Städte |
| preferred_property_types | text[] | Bevorzugte Objektarten |
| notes | text | Notizen |

### 2.3 `commissions` (EXISTS)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Isolation |
| pipeline_id | uuid FK | Pipeline-Referenz |
| contact_id | uuid FK | Partner-Kontakt |
| amount | numeric | Provisionsbetrag |
| percentage | numeric | Provisionssatz |
| status | enum | Commission-Status |
| agreement_consent_id | uuid FK | Consent-Referenz |
| invoiced_at | timestamptz | Rechnungsdatum |
| paid_at | timestamptz | Auszahlung |
| notes | text | — |

**Commission Status Enum (EXISTS):**
```
pending → approved → invoiced → paid → cancelled
```

---

## 3) NEUE/ERWEITERTE TABELLEN

### 3.1 `partner_pipelines` Erweiterungen

| Feld | Typ | Neu | Beschreibung |
|------|-----|-----|--------------|
| listing_id | uuid FK | ✓ | Verknüpfung zu listings (MOD-06) |
| reservation_id | uuid FK | ✓ | Verknüpfung zu reservations (MOD-06) |
| inquiry_id | uuid FK | ✓ | Verknüpfung zu inquiries (MOD-06) |
| investment_profile_id | uuid FK | ✓ | Match-Referenz |
| commission_agreed | boolean | ✓ | Commission Agreement vorhanden |

### 3.2 `partner_listing_views` (NEU - Audit)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Isolation |
| listing_id | uuid FK | Angesehenes Listing |
| partner_user_id | uuid FK | Partner |
| viewed_at | timestamptz | Zeitpunkt |

### 3.3 `investment_simulations` (NEU)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Isolation |
| property_id | uuid FK | Immobilie |
| contact_id | uuid FK | Kunde (optional) |
| pipeline_id | uuid FK | Pipeline (optional) |
| input_params | jsonb | Eingabeparameter |
| result_snapshot | jsonb | Berechnungsergebnis |
| engine_version | text | Version der Engine |
| created_by | uuid FK | User |
| created_at | timestamptz | — |

---

## 4) ROUTE-STRUKTUR (BINDING + KORRIGIERT)

> **KORREKTUR:** Die Route `/pipeline` zeigt NICHT Lead/Deal-Pipeline (→ MOD-10), sondern den **Objektkatalog**.
> UI-Labels wurden angepasst, Routen bleiben stabil.

| Route | UI-Label (NEU) | Screen | Beschreibung |
|-------|----------------|--------|--------------|
| `/portal/vertriebspartner` | Dashboard | Dashboard | KPIs, Aktivitäts-Stream |
| `/portal/vertriebspartner/pipeline` | **Objektkatalog** | Objektkatalog | Alle partner-sichtbaren Listings |
| `/portal/vertriebspartner/auswahl` | **Meine Auswahl** | MeineAuswahl | Partner-spezifische Shortlist |
| `/portal/vertriebspartner/beratung` | Beratung | Beratung | Investment Engine + Matching |
| `/portal/vertriebspartner/team` | **Netzwerk** | Netzwerk | Team, Provisionen, Compliance |

### Route-Label-Alias (FROZEN)

| Route | Technisch | UI-Label |
|-------|-----------|----------|
| `/portal/vertriebspartner/pipeline` | pipeline | Objektkatalog |
| `/portal/vertriebspartner/team` | team | Netzwerk |

### Dynamische Routes

| Route | Screen |
|-------|--------|
| `/portal/vertriebspartner/pipeline/:listing_id` | Listing Detail (Read-only) |
| `/portal/vertriebspartner/auswahl/:selection_id` | Auswahl Detail + Advisory Case |
| `/portal/vertriebspartner/beratung/:property_id` | Investment Simulation |
| `/portal/vertriebspartner/kunden/:contact_id` | Kunden-Profil |

---

## 5) SCREEN SPECIFICATIONS

### 5.1 Dashboard (`/portal/vertriebspartner`)

**KPIs:**
| KPI | Berechnung |
|-----|------------|
| Deals in Pipeline | COUNT(pipelines WHERE stage NOT IN ('won','lost')) |
| Pipeline Value | SUM(deal_value WHERE stage NOT IN ('won','lost')) |
| Won (YTD) | COUNT(pipelines WHERE stage='won' AND year=current) |
| Won Value (YTD) | SUM(deal_value WHERE stage='won' AND year=current) |
| Pending Commissions | SUM(commissions.amount WHERE status='pending') |
| Conversion Rate | won / (won + lost) |

**Alerts:**
- Deals ohne Aktivität > 14 Tage
- Commissions pending > 30 Tage
- Neue Partner-Listings

**Quick Actions:**
- Neuer Deal
- Listings durchsuchen
- Simulation starten

### 5.2 Pipeline (`/portal/vertriebspartner/pipeline`)

**Layout:** Kanban (Primary) oder Liste (Toggle)

**Kanban-Spalten:**
1. Lead
2. Qualified
3. Proposal
4. Negotiation
5. Reservation
6. Closing
7. Won/Lost (collapsed)

**Deal Card:**
- Kunde (contact_name)
- Objekt (falls verknüpft)
- Deal Value
- Expected Close
- Stage-Indicator

**Aktionen pro Deal:**
- Stage verschieben (Drag & Drop)
- Detail öffnen
- Simulation starten
- Finanzierung anfordern (→ MOD-08)
- Commission Agreement einholen

### 5.3 Objektauswahl (`/portal/vertriebspartner/auswahl`)

**Anzeige:** Nur Listings mit `partner_visible = true`

**Layout:** Grid oder Liste

**Listing Card:**
- Thumbnail (aus DMS)
- Adresse
- Typ
- Angebotspreis
- Rendite-Indikator (berechnet)
- Partner-Commission-Rate

**Filter:**
- Preis-Range
- Stadt
- Objekttyp
- Rendite-Range

**Aktionen:**
- Detail anzeigen
- Simulation starten
- Deal erstellen
- Kunden matchen (Investment Profile)

### 5.4 Beratung / Investment Engine (`/portal/vertriebspartner/beratung`)

**Zweck:** Investment-Simulationen und Objektanalyse

**Layout:** Wizard oder Tab-basiert

**Input-Parameter:**
- Kaufpreis (aus Listing oder manuell)
- Eigenkapital
- Zinssatz / Zinsbindung
- Tilgung
- Mieteinnahmen (aus Property oder manuell)
- Steuersatz (zvE-basiert)
- Wertsteigerung p.a.

**Output (Investment Engine):**
- 40-Jahres-Projektion
- Jahres-Cashflow
- Steuereffekte (V+V)
- Amortisationspunkt
- Renditekennzahlen (Eigenkapitalrendite, Gesamtrendite)

**Aktionen:**
- Simulation speichern
- PDF exportieren
- An Kunden senden
- In Deal verknüpfen

**Investment Engine Contract (Edge Function):**
```
Input: {
  purchase_price: number,
  equity: number,
  interest_rate: number,
  fixed_period: number,
  repayment_rate: number,
  annual_rent: number,
  annual_costs: number,
  tax_rate: number,
  appreciation_rate: number,
  regime: 'PRIVATE' | 'BUSINESS'
}

Output: {
  projection: YearlyData[],
  metrics: {
    equity_yield: number,
    total_yield: number,
    amortization_year: number,
    total_tax_benefit: number
  },
  engine_version: string
}
```

### 5.5 Netzwerk/Team (`/portal/vertriebspartner/team`)

**Sections:**

**A) Meine Kunden:**
- Kontakte mit Investment-Profilen
- Profile-Matching Score anzeigen
- Quick Actions: Profil bearbeiten, Deal erstellen

**B) Team (org-scoped):**
- Andere Partner im Tenant
- Deals pro Partner (Übersicht)
- Gemeinsame Deals (optional)

**C) Provisionen:**
- Commission-Liste (eigene)
- Status, Betrag, Auszahlung

---

## 6) END-TO-END FLOWS

### Flow 1: Listing browsen und Deal erstellen

**Trigger:** Partner öffnet Objektauswahl

**Schritte:**
1. Partner sieht nur partner_visible Listings
2. Partner wählt Listing
3. Partner klickt "Deal erstellen"
4. Modal: Kunde auswählen (aus Kontakten) oder neu
5. Deal Value eingeben
6. partner_pipelines INSERT (stage='lead', listing_id=X)
7. partner_listing_views INSERT (Audit)
8. Audit: pipeline.created

### Flow 2: Deal durch Stages bewegen

**Trigger:** Partner verschiebt Deal

**Schritte:**
1. Drag & Drop in Kanban ODER Status-Dropdown
2. Bei 'reservation': 
   - Prüfe: Listing noch verfügbar?
   - Erstelle Inquiry in MOD-06 (source='partner')
   - MOD-06 führt Reservation durch
3. Bei 'closing':
   - Prüfe: COMMISSION_AGREEMENT vorhanden?
   - Falls nicht: Modal "Commission Agreement einholen"
4. Bei 'won':
   - Commission-Trigger (siehe Flow 4)
5. Audit: pipeline.stage_changed

### Flow 3: Investment Simulation durchführen

**Trigger:** Partner klickt "Simulation" für Listing/Property

**Schritte:**
1. Input-Formular mit Vorausfüllung aus Property
2. Partner passt Parameter an
3. Klick "Berechnen"
4. Edge Function: sot-investment-engine aufrufen
5. Ergebnis anzeigen (Charts, Tabellen)
6. Optional: Speichern → investment_simulations INSERT
7. Optional: PDF Export → DMS
8. Audit: simulation.created

### Flow 4: Commission Trigger

**Trigger:** Deal erreicht 'won' Status

**Voraussetzung:** COMMISSION_AGREEMENT Consent

**Schritte:**
1. Prüfe: commission.agreement_consent_id vorhanden?
2. Falls nicht:
   - **CONSENT GATE: COMMISSION_AGREEMENT**
   - Modal mit Agreement-Text
   - User bestätigt
   - user_consents INSERT
3. Commission INSERT:
   - amount = listing.asking_price * partner_commission_rate
   - status = 'pending'
   - agreement_consent_id = consent.id
4. Audit: commission.created
5. Platform-Admin erhält Notification zur Approval

### Flow 5: Commission Approval & Payout

**Trigger:** Platform-Admin approved Commission

**Schritte:**
1. Admin sieht pending Commissions
2. Admin prüft: Deal valid, Agreement valid
3. Admin klickt "Approve"
4. commission.status = 'approved'
5. Audit: commission.approved
6. (Phase 2: Invoice generieren, Auszahlung via Stripe Connect)

---

## 7) CONSENT & AUDIT

### Consent Gates

| Aktion | Consent Code | Pflicht |
|--------|--------------|---------|
| Commission Trigger | COMMISSION_AGREEMENT | Ja |
| Investment Sharing | DATA_SHARING_FUTURE_ROOM | Optional |

### Audit Events

| Event | Trigger | Payload |
|-------|---------|---------|
| pipeline.created | INSERT | pipeline_id, listing_id, contact_id |
| pipeline.stage_changed | Stage UPDATE | pipeline_id, old_stage, new_stage |
| pipeline.won | Stage → won | pipeline_id, deal_value |
| pipeline.lost | Stage → lost | pipeline_id, reason |
| simulation.created | Simulation gespeichert | simulation_id, property_id |
| commission.created | INSERT | commission_id, amount, pipeline_id |
| commission.approved | Admin Approval | commission_id |
| commission.invoiced | Invoice created | commission_id, invoice_id |
| commission.paid | Payout | commission_id |
| listing.viewed | Partner view | listing_id, partner_id |

---

## 8) API CONTRACT

### Pipeline (API-300 bis API-315)

| API-ID | Endpoint | Method | Auth | Audit |
|--------|----------|--------|------|-------|
| API-300 | `/vertriebspartner/pipelines` | GET | sales_partner | — |
| API-301 | `/vertriebspartner/pipelines` | POST | sales_partner | pipeline.created |
| API-302 | `/vertriebspartner/pipelines/:id` | GET | sales_partner | — |
| API-303 | `/vertriebspartner/pipelines/:id` | PATCH | sales_partner | pipeline.updated |
| API-304 | `/vertriebspartner/pipelines/:id/stage` | POST | sales_partner | pipeline.stage_changed |
| API-305 | `/vertriebspartner/pipelines/:id/win` | POST | sales_partner | pipeline.won |
| API-306 | `/vertriebspartner/pipelines/:id/lose` | POST | sales_partner | pipeline.lost |

### Listings (Read-only) (API-320 bis API-325)

| API-ID | Endpoint | Method | Auth | Audit |
|--------|----------|--------|------|-------|
| API-320 | `/vertriebspartner/listings` | GET | sales_partner | — |
| API-321 | `/vertriebspartner/listings/:id` | GET | sales_partner | listing.viewed |
| API-322 | `/vertriebspartner/listings/:id/match` | GET | sales_partner | — |

### Investment Engine (API-330 bis API-340)

| API-ID | Endpoint | Method | Auth | Audit |
|--------|----------|--------|------|-------|
| API-330 | `/vertriebspartner/simulate` | POST | sales_partner | — |
| API-331 | `/vertriebspartner/simulations` | GET | sales_partner | — |
| API-332 | `/vertriebspartner/simulations` | POST | sales_partner | simulation.created |
| API-333 | `/vertriebspartner/simulations/:id/pdf` | GET | sales_partner | — |

### Investment Profiles (API-340 bis API-350)

| API-ID | Endpoint | Method | Auth | Audit |
|--------|----------|--------|------|-------|
| API-340 | `/vertriebspartner/profiles` | GET | sales_partner | — |
| API-341 | `/vertriebspartner/profiles` | POST | sales_partner | profile.created |
| API-342 | `/vertriebspartner/profiles/:id` | PATCH | sales_partner | profile.updated |
| API-343 | `/vertriebspartner/profiles/:id/match` | GET | sales_partner | — |

### Commissions (API-360 bis API-370)

| API-ID | Endpoint | Method | Auth | Audit |
|--------|----------|--------|------|-------|
| API-360 | `/vertriebspartner/commissions` | GET | sales_partner | — |
| API-361 | `/vertriebspartner/commissions/:id` | GET | sales_partner | — |
| API-362 | `/vertriebspartner/commissions/:id/agree` | POST | sales_partner | commission.agreement_signed |
| API-365 | `/admin/commissions` | GET | platform_admin | — |
| API-366 | `/admin/commissions/:id/approve` | POST | platform_admin | commission.approved |
| API-367 | `/admin/commissions/:id/reject` | POST | platform_admin | commission.rejected |

---

## 9) CROSS-MODULE BERÜHRUNGSWEGE

### MOD-07 → MOD-06

| Trigger | Effect | Richtung |
|---------|--------|----------|
| Listings.partner_visible=true | Sichtbar in Objektauswahl | Read |
| Pipeline.stage='reservation' | Creates Inquiry in MOD-06 | Write via API |
| Pipeline.won | References Transaction | Read |

### MOD-07 → MOD-04

| Trigger | Effect |
|---------|--------|
| Property Data | Read for Simulations |
| Financing Data | Read from property_financing |

### MOD-07 → MOD-08

| Trigger | Effect |
|---------|--------|
| "Finanzierung anfordern" CTA | Link zu MOD-08 mit property_id + contact_id |
| finance_packages.property_id | Read-only Reference |

### Zone 1 → MOD-07

| Trigger | Effect |
|---------|--------|
| Commission Approval | platform_admin approves |
| Oversight | Read-only Pipeline-Übersicht |

---

## 10) COMMISSION LOGIC (Phase 1)

### Split-Regel (Vorschlag)

| Empfänger | Anteil | Beschreibung |
|-----------|--------|--------------|
| Plattform | 1/3 | Vermittlungsgebühr |
| Partner | 2/3 | Provision |

**Berechnung:**
```
total_commission = transaction.final_price * listing.partner_commission_rate
platform_share = total_commission * 0.33
partner_share = total_commission * 0.67
```

**OPEN:** Ist Split 1/3-2/3 FROZEN oder konfigurierbar?

---

## 11) OPEN QUESTIONS

| ID | Frage | Vorschlag | Prio |
|----|-------|-----------|------|
| Q7.1 | Commission Split: Fix 1/3-2/3 oder konfigurierbar? | Konfigurierbar pro Listing | P1 |
| Q7.2 | Sub-Partner (Multi-Level)? | Phase 2 | P2 |
| Q7.3 | Investment Engine: Welche Steuer-Regime? | PRIVATE (V+V) + BUSINESS (GuV) | P1 |
| Q7.4 | Matching-Score Algorithmus? | Basis: Preis + Stadt + Typ | P2 |
| Q7.5 | Commission Payout: Stripe Connect oder manuell? | Manuell Phase 1 | P1 |
| Q7.6 | Team: Eigene Partner sehen oder isoliert? | Tenant-Admin sieht alle, Partner nur eigene | P1 |

---

## 12) MVP ACCEPTANCE CRITERIA

| # | Kriterium | Testbar |
|---|-----------|---------|
| AC1 | Partner sieht nur partner_visible Listings | Query |
| AC2 | Deal kann aus Listing erstellt werden | Flow |
| AC3 | Pipeline Kanban funktioniert (Drag & Drop) | UI |
| AC4 | Stage-Änderungen erzeugen Audit Events | audit_events |
| AC5 | Investment Simulation liefert Ergebnis | Edge Function |
| AC6 | Simulation kann gespeichert werden | DB |
| AC7 | Investment Profile kann erstellt werden | CRUD |
| AC8 | Matching zeigt passende Listings | Query |
| AC9 | COMMISSION_AGREEMENT wird vor Commission geprüft | Consent Gate |
| AC10 | Commission wird bei 'won' erstellt | Trigger |
| AC11 | Platform-Admin kann Commission approven | Flow |
| AC12 | Dashboard zeigt korrekte KPIs | Berechnung |
| AC13 | RLS verhindert Cross-Tenant/Cross-Partner Zugriff | Security |
| AC14 | Listing-Views werden geloggt | Audit |
| AC15 | Finanzierung-CTA verlinkt zu MOD-08 | Navigation |

---

## 13) FREEZE CANDIDATES

1. **Pipeline Stage-Enum** (EXISTS, FROZEN)
2. **Commission Status-Enum** (EXISTS, FROZEN)
3. **COMMISSION_AGREEMENT als Consent Gate** (FROZEN)
4. **Partner kann nur partner_visible Listings sehen** (FROZEN)
5. **Investment Engine Input/Output Contract** (FROZEN)
6. **investment_profiles Tabelle Struktur** (EXISTS, FROZEN)
