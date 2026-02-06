# MOD-05 — MSV (Miet-Sonderverwaltung)

**Version:** v2.1.0  
**Status:** ACTIVE (Phase 1 MVP)  
**Letzte Aktualisierung:** 2026-02-06  
**Abhängig von:** MOD-04 (Properties/Units), MOD-01 (Contacts), MOD-03 (DMS), Billing Backbone, Agreements Backbone

> **Audit-Status:** 88% Complete  
> **Letzte Prüfung:** 2026-02-06

---

## 1) MODULDEFINITION

### 1.1 Ziel
MOD-05 „MSV" ist das operative Modul zur digitalen Mietverwaltung innerhalb von Zone 2. Es bietet eine kostenfreie Basis-Stufe (Templates, manuelle Prozesse) sowie eine kostenpflichtige Premium-Stufe (Kontoanschluss, Automationen, Reports).

### 1.2 Nutzerrollen

| Rolle | Zugang | Beschreibung |
|-------|--------|--------------|
| org_admin | Base + Premium | Vollzugriff, Aktivierung, Einstellungen, Leases anlegen |
| internal_ops | Base + Premium | Operative Arbeit (Zahlungen, Dokumente, Templates) |
| renter_user | Miety (Phase 2) | Nur eigene Daten via Mieterportal — NUR ANDOCKPUNKT |

### 1.3 Scope IN (testbar)

- Anzeige ALLER Units des Tenants (unabhängig von Lease/Premium)
- Lease minimal anlegen/zuweisen für Units ohne Lease (Base)
- Vorlagen-Generator: Kündigung, Mieterhöhung, Datenanforderung
- PDF-Generierung (serverseitig) + DMS-Ablage
- Versand mit User Confirmation (Base)
- Premium-Aktivierung mit Readiness Gate
- Kontoanschluss via FinAPI (nur Konzept)
- rent_payments Perioden + Matching (Premium)
- Reminder-Automationen mit Opt-in (Premium)
- Monatsreport + Regime-Exporte V+V / SuSa/BWA (Premium)

### 1.4 Scope OUT (Nicht-Ziele)

- Mietvertragsanlage mit vollem Wizard (→ einfacher Flow reicht für Base)
- Nebenkostenabrechnung (Phase 3)
- Miety Mieterportal aktiv (nur Andockpunkt)
- FinAPI-Implementierung (nur Konzept)
- Automatischer Versand ohne explizites Opt-in

### 1.5 Dependencies

| Modul/Backbone | Art | Beschreibung |
|----------------|-----|--------------|
| MOD-04 Immobilien | Read | properties, units (Struktur-SoT) |
| MOD-01 Stammdaten | Read | contacts (Mieter-Kontaktdaten) |
| MOD-03 DMS | Read/Write | documents, document_links (Drafts, Verträge) |
| Billing Backbone | Read | subscriptions, plans (Premium-Check) |
| Agreements Backbone | Read | user_consents (MSV_AGREEMENT) |
| Audit Backbone | Write | audit_events |

### 1.6 Source of Truth Matrix (FROZEN)

| Domäne | SoT-Modul | Andere Module |
|--------|-----------|---------------|
| Properties, Units (Struktur) | MOD-04 | MSV: Read-only |
| Leases (operative Mietverwaltung) | **MOD-05** | MOD-04: Read-only Cross-Link |
| Rent Payments | MOD-05 | — |
| MSV Enrollments | MOD-05 | — |
| Contacts | MOD-01 | MSV: Read-only |
| Documents | MOD-03 | MSV: Link/Read/Write |

**Klarstellung Lease-Ownership:**  
MOD-05 ist der einzige Owner für Leases. MOD-04 zeigt Leases nur als read-only Referenz an (z.B. „Einheit vermietet an X"). Lease-Anlage, -Bearbeitung und -Statusänderungen erfolgen ausschließlich in MOD-05.

---

## 2) FREEMIUM/PREMIUM PRODUKTLOGIK (FROZEN)

### 2.1 Base (kostenfrei)

| Feature | Beschreibung |
|---------|--------------|
| Unit-Liste | ALLE Units sichtbar (mit/ohne Lease, mit/ohne Premium) |
| Lease anlegen | Minimaler Flow: Mieter-Kontakt, Startdatum, Monatsmiete, Status |
| Lease bearbeiten | Status ändern, Basisdaten aktualisieren |
| Templates | Kündigung, Mieterhöhung, Datenanforderung |
| PDF-Generierung | Serverseitige Generierung aus Template |
| DMS-Ablage | Dokument im DMS speichern via document_links |
| Versand | E-Mail/Brief NUR mit User Confirmation |
| Notizen | Via DMS als Notiz-Dokument oder document_links.metadata |

**Nicht in Base:**
- Kein Kontoanschluss
- Keine rent_payments Tabelle aktiv
- Keine Automationen (Crons, Auto-Reminders)
- Keine Reports/Exporte

### 2.2 Premium (kostenpflichtig)

| Feature | Beschreibung | Voraussetzung |
|---------|--------------|---------------|
| Kontoanschluss | FinAPI Connect (konzeptionell) | Billing-Freischaltung |
| rent_payments | Zahlungsperioden erstellen/verwalten | Enrollment ACTIVE |
| Match-Engine | Transaktion → Zahlung zuordnen | FinAPI aktiv |
| Reminders | Mahnungen nach Regeln | Prefs gesetzt + Opt-in |
| Auto-Send | Automatischer Versand | require_confirmation = false |
| Monatsreport | PDF-Report pro Monat | Enrollment ACTIVE |
| V+V Export | Einnahmen-Überschuss (PRIVATE) | Regime gesetzt |
| SuSa/BWA Export | Buchhalterische Exporte (BUSINESS) | Regime gesetzt |

### 2.3 Premium-Aktivierung

**Aktivierungs-Scope:** Property (Default), Unit-Override konzeptionell vorbereitet (Phase 2)

**Synchronisationsregel (FROZEN):**  
Wenn ein Property Premium ACTIVE wird, wird das korrespondierende Flag synchron gesetzt:
- `property_features.feature_code = 'msv'` mit `status = 'active'`

Dies stellt sicher, dass keine Parallelwelten entstehen und Trigger-Logik projektübergreifend konsistent bleibt.

**Activation Flow:**
```
User klickt "Premium aktivieren"
    → Billing Check: Hat Tenant Premium-Plan?
       → NEIN: Paywall anzeigen → STOP
       → JA: Readiness Check starten
           → Alle Requirements prüfen
              → READY: enrollment.status = 'active'
                       + property_features sync
              → NOT READY: enrollment.status = 'blocked'
                           + Checkliste anzeigen
```

---

## 3) DATENMODELL (beschreibend)

### 3.1 Existierende Tabellen

#### `leases` (MSV ist Owner)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Isolation |
| unit_id | uuid FK | Einheit-Referenz |
| tenant_contact_id | uuid FK | Mieter-Kontakt (RENTER) |
| renter_org_id | uuid FK | Mieter-Org (wenn registriert) |
| monthly_rent | numeric | Soll-Miete |
| start_date | date | Vertragsbeginn |
| end_date | date | Vertragsende (befristet) |
| status | enum | draft, active, notice_given, terminated |
| deposit_amount | numeric | Kaution |
| notice_date | date | Kündigungsdatum |
| rent_increase | text | Letzte Erhöhung (Freitext) |
| tenant_since | date | Mieter seit |

**Lease Status-Maschine:**
```
draft → active → notice_given → terminated
              ↘ terminated (außerordentlich)
```

#### `units` (Read-only aus MOD-04)

| Feld | Beschreibung |
|------|--------------|
| id | Referenz |
| property_id | Property-Zuordnung |
| unit_number | Anzeige |
| area_sqm | Fläche |

#### `contacts` (Read-only aus MOD-01)

| Feld | Beschreibung |
|------|--------------|
| id | Referenz |
| first_name, last_name | Name |
| email | E-Mail (RENTER_EMAIL) |
| phone | Telefon |
| company | Firma (für Gewerbemieter) |

**Hinweis:** Postadresse fehlt aktuell in contacts. Entweder Erweiterung oder via property/unit-Adresse als Fallback. → OPEN Q5.16

#### `documents` / `document_links` (MOD-03)

Für Base-Drafts und Notizen wird die DMS-first Strategie verwendet (siehe 3.3).

#### `renter_invites` (existiert)

| Feld | Beschreibung |
|------|--------------|
| id | Referenz |
| lease_id | Lease-Zuordnung |
| email | Einladungs-E-Mail |
| token | Einladungs-Token |
| status | pending, accepted, revoked |
| expires_at | Ablauf |

### 3.2 Neue konzeptionelle Tabellen/Objekte

#### `msv_enrollments`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Isolation |
| scope_type | enum | 'property' oder 'unit' |
| scope_id | uuid | property_id oder unit_id |
| tier | enum | 'base', 'premium' |
| status | enum | inactive, active, blocked |
| activated_at | timestamptz | Premium-Aktivierung |
| activated_by | uuid | User |
| blocked_reason | text | Grund für Blockade |
| readiness_snapshot | jsonb | Snapshot der Prüfung |

**Enrollment Status-Maschine:**
```
inactive → blocked (Readiness failed)
inactive → active (Readiness passed + Billing OK)
blocked → active (Readiness resolved)
active → inactive (User deaktiviert)
```

**RLS-Konzept:** Nur Members des tenant_id dürfen lesen/schreiben. Keine SECURITY DEFINER.

#### `msv_readiness_items`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Isolation |
| enrollment_id | uuid FK | Enrollment-Referenz |
| requirement_code | enum | Siehe Requirement-Liste |
| status | enum | missing, provided, waived |
| details | text | Zusatzinfo |
| requested_at | timestamptz | Wann angefordert |
| resolved_at | timestamptz | Wann erfüllt |

**Requirement Codes (FROZEN für Phase 1):**

| Code | Beschreibung | Pflicht |
|------|--------------|---------|
| RENTER_CONTACT_EXISTS | Mieter-Kontakt vorhanden | Ja |
| RENTER_EMAIL | Mieter hat E-Mail | Ja (oder RENTER_ADDRESS) |
| RENTER_ADDRESS | Mieter hat Postadresse | Ja (oder RENTER_EMAIL) |
| COMM_PREF_SET | Kommunikationspräferenz gesetzt | Ja |
| COMM_PREF_VALID | Präferenz passt zu Daten | Ja |
| LEASE_EXISTS | Aktiver Lease vorhanden | Ja für rent_payments |
| CONTRACT_DOC_LINKED | Mietvertrag im DMS | Empfohlen (waivable) |

#### `msv_communication_prefs`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Isolation |
| scope_type | enum | 'tenant', 'property', 'lease' |
| scope_id | uuid | Je nach scope_type |
| preferred_channel | enum | 'email', 'letter' |
| fallback_channel | enum | Optional |
| require_confirmation | boolean | Default: TRUE (sicher) |

**Hierarchie:** Lease > Property > Tenant (Default)

**Validierungsregel (FROZEN):**
- preferred_channel = 'email' → RENTER_EMAIL muss vorhanden sein
- preferred_channel = 'letter' → RENTER_ADDRESS muss vorhanden sein
- Sonst: COMM_PREF_VALID = missing → Enrollment blocked

#### `rent_payments` (nur Premium)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Isolation |
| lease_id | uuid FK | Lease-Referenz |
| unit_id | uuid FK | Unit (denormalisiert) |
| period_start | date | Periodenbeginn |
| period_end | date | Periodenende |
| expected_amount | numeric | Soll-Betrag |
| matched_amount | numeric | Gematchter Betrag (Default: 0) |
| status | enum | pending, partial, paid, overdue |
| matched_source | enum | 'manual', 'finapi' |
| matched_transaction_id | text | FinAPI Referenz |
| notes | text | Freitext |

**Uniqueness:** (tenant_id, lease_id, period_start)

**Status-Maschine:**
```
pending → partial (Teilzahlung)
pending → paid (Vollzahlung)
pending → overdue (Fälligkeit + Karenz überschritten)
partial → paid (Rest eingegangen)
overdue → partial (verspätete Teilzahlung)
overdue → paid (verspätete Vollzahlung)
```

#### `rent_reminders` (nur Premium)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Isolation |
| rent_payment_id | uuid FK | Zahlung-Referenz |
| stage | enum | friendly, first_warning, final_warning, legal_notice |
| content_text | text | Generierter Text |
| channel | enum | 'email', 'letter' |
| status | enum | draft, confirmed, sent, delivered, failed |
| document_id | uuid FK | DMS-Referenz |
| sent_at | timestamptz | Versandzeitpunkt |
| confirmed_by | uuid | Bestätiger |

**Status-Maschine:**
```
draft → confirmed (User bestätigt)
confirmed → sent (System versendet)
sent → delivered (Webhook bestätigt)
sent → failed (Versand fehlgeschlagen)
```

#### `msv_templates`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Level oder NULL=System |
| template_code | enum | termination, rent_increase, data_request, reminder_* |
| title | text | Anzeige-Name |
| content | text | Template mit Platzhaltern |
| placeholders | jsonb | Liste der Platzhalter |
| locale | text | Sprache (Default: 'de') |
| version | int | Versionierung |
| is_active | boolean | Aktiv-Flag |

**Template Codes:**

| Code | Beschreibung | Tier |
|------|--------------|------|
| termination | Kündigungsschreiben | Base |
| rent_increase | Mieterhöhungsschreiben | Base |
| data_request | Datenanforderung | Base |
| reminder_friendly | Freundliche Erinnerung | Premium |
| reminder_first_warning | Erste Mahnung | Premium |
| reminder_final_warning | Letzte Mahnung | Premium |
| reminder_legal | Rechtliche Mahnung | Premium |

### 3.3 Base-Drafts/Notizen: DMS-first (FROZEN)

**Entscheidung:** Option A — DMS-first

Alle Base-Drafts und Notizen werden als DMS-Dokumente persistiert:

| Dokumenttyp | document_links.link_type | Beschreibung |
|-------------|--------------------------|--------------|
| Kündigungs-Draft | msv_draft_termination | Entwurf Kündigung |
| Mieterhöhungs-Draft | msv_draft_rent_increase | Entwurf Erhöhung |
| Datenanforderung | msv_request | Anforderungsschreiben |
| Notiz | msv_note | Freitext-Notiz als PDF |

**Vorteile:**
- Keine zusätzlichen Tabellen für Base
- Einheitliche Dokumentenverwaltung
- Natürliche DMS-Integration
- Versionierung via documents

**Zuordnung:**
- document_links.entity_type = 'lease' oder 'unit'
- document_links.entity_id = lease_id oder unit_id

---

## 4) SCREENS & UX

### 4.1 Routen (FROZEN)

| Route | Zweck |
|-------|-------|
| /portal/msv | Redirect zu /portal/msv/objekte |
| /portal/msv/objekte | Objektliste mit Actions (Freemium) |
| /portal/msv/mieteingang | Zahlungsverwaltung (Premium) |
| /portal/msv/vermietung | Vermietungsexposé + Publishing (Freemium) |
| /portal/msv/einstellungen | Konfiguration + Kontoanbindung |

**Hinweis:** Dashboard-Tab wurde entfernt. Der Standard-Tab ist "Objekte".

### 4.2 Objekte (`/portal/msv/objekte`)

**Zweck:** Zentrale Arbeitsliste ALLER Units aus MOD-04

**Tabellen-Spalten (8 Spalten):**

| # | Spalte | DB-Quelle | Beschreibung |
|---|--------|-----------|--------------|
| 1 | Objekt-ID | `properties.code` | Kurzcode |
| 2 | Objektadresse | `properties.address` | Straße, Nr, Ort + Einheit + Fläche |
| 3 | Mieter | `contacts.last_name, first_name` (via lease) | Name oder "Leerstand" Badge |
| 4 | Kaltmiete | `leases.monthly_rent` | Nettokaltmiete |
| 5 | Nebenkosten | `lease_components.amount` (type=utilities) | NK-Vorauszahlung |
| 6 | Vorauszahlung | `lease_components.amount` (type=prepayment) | Sonstige |
| 7 | Warmmiete | Berechnet: Kaltmiete + NK + Vorauszahlung | Gesamtmiete |
| 8 | Aktionen | Dropdown | Briefe erstellen, Premium, MOD-04 |

**Action-Buttons (Dropdown):**

| Action | Tier | Beschreibung |
|--------|------|--------------|
| Mahnung erstellen | Base | Template-Generator |
| Kündigung schreiben | Base | Template-Generator → Briefgenerator |
| Mieterhöhung schreiben | Base | Template-Generator → Briefgenerator |
| Datenanforderung | Base | Template-Generator |
| Mietvertrag anlegen | Base | Für Units ohne Lease |
| Premium aktivieren | Base | Startet Activation Gate |
| Objekt öffnen (MOD-04) | Beide | Deep-Link zu /portfolio/:id |

**Empty State:**
- "Keine Objekte gefunden"
- Objekte werden aus MOD-04 geladen

### 4.3 Mieteingang (`/portal/msv/mieteingang`) — Premium

**Konzept:** Objekt-zentrierte Ansicht mit Accordion-Erweiterung

**Haupttabelle (collapsed):**

| # | Spalte | Beschreibung |
|---|--------|--------------|
| 1 | Expand-Icon | ChevronRight/Down |
| 2 | Objekt-Nr. | properties.code |
| 3 | Adresse | properties.address |
| 4 | Mieter | contacts.name |
| 5 | Sollmiete | leases.monthly_rent |
| 6 | Mieteingang | SUM der Zahlungen (aktueller Monat) |
| 7 | Status | Badge: Bezahlt/Teilzahlung/Offen/Überfällig |

**Expandierte Zeile (Accordion):**

Bei Klick auf Zeile:
- **Letzte 10 Mieteingänge** (Tabelle: Fällig am, Gezahlt am, Betrag, Status, Quelle)
- **Action-Buttons:**
  - Zahlung buchen (manuell) — Premium
  - Mahnung erstellen → Template-Wizard
  - Mietbericht senden → Edge Function Trigger — Premium

**Stats-Cards:**
- Eingegangen (Summe + Anzahl)
- Offen (Summe + Anzahl)
- Überfällig (Summe + Anzahl)

**Premium-Gate:**
- PaywallBanner wenn nicht Premium
- "Premium aktivieren" Button → Readiness Gate

### 4.4 Vermietung (`/portal/msv/vermietung`) — Freemium

**Zweck:** Vermietungsexposés erstellen und auf Portalen veröffentlichen

**Verfügbare Kanäle:**

| Kanal | Typ | Beschreibung |
|-------|-----|--------------|
| ImmobilienScout24 | API | Direkte Veröffentlichung (Credits) |
| Kleinanzeigen | Export | Text + Bilder exportieren |

**Hinweis:** Kaufy ist NICHT für Mietobjekte verfügbar (nur MOD-06 Verkauf).

### 4.5 Einstellungen (`/portal/msv/einstellungen`)

**Sections:**

| Section | Tier | Beschreibung |
|---------|------|--------------|
| Premium-Status | Beide | Aktivierungsstatus, Credits-Verbrauch |
| Automatisierung | Premium | Mahntag, Kommunikationsweg, Auto-Mahnung, Mietbericht-Tag, Auto-Report |
| Mietkonten | Premium | FinAPI Kontoanbindung (Coming Soon) |
| E-Mail-Versand | Beide | Info über Resend-System |

**Automatisierungs-Einstellungen:**

| Einstellung | UI-Element | Beschreibung |
|-------------|------------|--------------|
| Mahntag | Number (1-28) | Wann Mahnung versenden |
| Kommunikationsweg | Radio: E-Mail / Brief | Wie wird gemahnt |
| Auto-Mahnung aktiv | Switch | Automatischer Versand |
| Mietbericht-Tag | Number (1-28) | Default: 15 |
| Auto-Mietbericht | Switch | Automatischer Versand |

**Kontoanbindung (FinAPI — Coming Soon):**

Tabelle `msv_bank_accounts`:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Isolation |
| account_name | text | Anzeigename |
| iban | text | IBAN |
| bank_name | text | Bankname |
| finapi_account_id | text | FinAPI Referenz |
| is_default | boolean | Standard-Konto |
| status | enum | connected, pending, error |

**Paywall:** Premium-Sections zeigen Upgrade-CTA wenn nicht Premium

---

## 5) END-TO-END FLOWS

### 5.1 Base Flows

#### Flow B1: Alle Units in Liste anzeigen

**Trigger:** User öffnet /portal/msv/listen

**Schritte:**
1. Query: SELECT u.*, l.*, c.*, e.* FROM units u
   LEFT JOIN leases l ...
   LEFT JOIN contacts c ...
   LEFT JOIN msv_enrollments e ...
   WHERE u.tenant_id = :current_tenant
2. Keine Filter auf property_features (ALLE Units)
3. Aggregate: Lease-Status, Enrollment-Status
4. Render: Tabelle

**Output:** Vollständige Unit-Liste

#### Flow B2: Lease anlegen für Unit ohne Lease

**Trigger:** User klickt „Lease anlegen" bei Leerstand-Unit

**Schritte:**
1. Modal öffnet mit Minimal-Formular:
   - Mieter-Kontakt auswählen oder neu anlegen (→ MOD-01)
   - Startdatum (Pflicht)
   - Monatsmiete (Pflicht)
   - Status: Default „active"
2. Validierung:
   - Kontakt muss existieren
   - Startdatum darf nicht in Vergangenheit (Warnung, aber erlaubt)
   - Monatsmiete > 0
3. INSERT leases
4. Audit: msv.lease.created

**Output:** Lease erstellt, Unit nicht mehr Leerstand

#### Flow B3: Template generieren (Kündigung/Mieterhöhung)

**Trigger:** User klickt „Kündigung erstellen" oder „Mieterhöhung erstellen"

**Schritte:**
1. Wizard Step 1: Unit/Lease auswählen
2. Wizard Step 2: Template auswählen (System oder Tenant)
3. Wizard Step 3: Platzhalter-Editor
   - Auto-Fill aus Datenbank
   - Manuelle Ergänzungen
4. Wizard Step 4: Preview (PDF-Vorschau)
5. Wizard Step 5: Aktionen
   a) „Als PDF herunterladen"
   b) „Im DMS speichern" → document_links INSERT (link_type = msv_draft_*)
   c) „Versenden" → User Confirmation Modal

**User Confirmation (Versand):**
- Text: „Ich bestätige den Versand dieses Dokuments."
- Kanal anzeigen (E-Mail/Brief)
- Bestätigen-Button

6. Bei Versand: Resend API (E-Mail) oder Brief-Queue (MOD-02)
7. Audit: msv.document.generated, msv.document.sent

**Output:** PDF generiert, optional im DMS, optional versendet

#### Flow B4: Daten vom Mieter anfordern

**Trigger:** User klickt „Daten anfordern" bei blocked Enrollment oder manuell

**Schritte:**
1. Modal: Was wird angefordert? (E-Mail, Adresse, Dokumente)
2. Kanal wählen (E-Mail oder Brief)
3. Template: data_request
4. Preview
5. User Confirmation
6. Versand
7. Readiness-Item: status = 'requested'
8. Audit: msv.request.sent

**Output:** Anforderung versendet

#### Flow B5: Mieter zu Miety einladen (Andockpunkt)

**Trigger:** User klickt „Mieter einladen"

**Voraussetzung:** RENTER_EMAIL vorhanden

**Schritte:**
1. Pre-Check: E-Mail vorhanden?
   - NEIN: „E-Mail erforderlich" → Request-Flow
2. Template: Einladungstext laden
3. Preview mit Token-Link
4. User Confirmation
5. INSERT renter_invites (status = 'pending')
6. Versand via Resend
7. Audit: msv.invite.sent

**Acceptance (Phase 2 — nur Planung):**
- Mieter klickt Link
- Registration als renter_user
- renter_org wird erstellt
- Lease-Zuordnung via renter_org_id
- Mieter kann Miety nutzen

**Output:** Invite versendet, renter_invites Eintrag

### 5.2 Premium Flows

#### Flow P1: Premium aktivieren (Activation Gate)

**Trigger:** User klickt Premium-Toggle

**Schritte:**
1. **Billing Check:**
   - Query: Tenant hat Premium-Plan?
   - NEIN → Paywall → STOP
   - JA → Weiter

2. **Readiness Check:**
   - RENTER_CONTACT_EXISTS: Kontakt vorhanden?
   - RENTER_EMAIL oder RENTER_ADDRESS: Mindestens ein Kanal?
   - COMM_PREF_SET: Präferenz gesetzt?
   - COMM_PREF_VALID: Präferenz passt zu Daten?
   - LEASE_EXISTS: Aktiver Lease vorhanden?
   - CONTRACT_DOC_LINKED: Mietvertrag verknüpft? (waivable)

3. **Enrollment erstellen/updaten:**
   - Wenn alle required READY: status = 'active'
   - Wenn nicht: status = 'blocked' + Checkliste

4. **Sync property_features:**
   - Wenn ACTIVE: property_features.feature_code = 'msv', status = 'active'

5. **Audit:** msv.enrollment.activated oder msv.enrollment.blocked

**Output:** enrollment.status gesetzt

#### Flow P2: Zahlungsperioden erstellen

**Trigger:** User klickt „Perioden generieren"

**Voraussetzung:** Enrollment ACTIVE

**Schritte:**
1. Wizard Step 1: Monat/Jahr auswählen
2. Wizard Step 2: Leases auswählen (Default: alle aktiven)
3. Wizard Step 3: Preview (Anzahl, Summe)
4. User Confirmation
5. BATCH INSERT rent_payments
6. Audit: msv.payments.batch_created

**Output:** rent_payments erstellt

#### Flow P3: Zahlung manuell buchen

**Trigger:** User klickt „Buchen" bei rent_payment

**Schritte:**
1. Modal: Betrag, Datum, Notiz
2. Validierung: Betrag > 0, Datum ≤ heute
3. UPDATE rent_payment:
   - matched_amount += Betrag
   - status = CASE (pending/partial/paid)
   - matched_source = 'manual'
4. Audit: msv.payment.booked

**Output:** Zahlung gebucht

#### Flow P4: Mahnung erstellen und versenden

**Trigger:** User klickt „Mahnung erstellen" bei overdue

**Schritte:**
1. System ermittelt nächste Stage
2. Template laden + Platzhalter füllen
3. Preview
4. User Confirmation (wenn require_confirmation = true)
5. INSERT rent_reminder (status = 'draft' oder 'confirmed')
6. Versand (wenn confirmed)
7. Audit: msv.reminder.confirmed, msv.reminder.sent

**Output:** Mahnung erstellt/versendet

#### Flow P5: Automatische Mahnung (Cron, nur konzeptionell)

**Trigger:** Täglicher Job (konzeptionell)

**Voraussetzungen (ALLE müssen erfüllt sein):**
- enrollment.status = 'active'
- Readiness = READY
- prefs.require_confirmation = FALSE (explizites Opt-in!)
- COMM_PREF_VALID = provided
- rent_payment.status = 'overdue'

**Schritte:**
1. Query: Alle qualifying payments
2. Pro Payment: nächste Stage, Template, Reminder erstellen
3. Auto-Versand
4. Audit: msv.reminder.auto_sent

**Sicherheitsregel (FROZEN):**
Ohne explizites `require_confirmation = false` wird KEIN automatischer Versand ausgelöst. Default ist sicher (nur Drafts/To-Dos).

---

## 6) READINESS GATE

### 6.1 Requirements (Phase 1 FROZEN)

| Code | Beschreibung | Pflicht | Validierung |
|------|--------------|---------|-------------|
| RENTER_CONTACT_EXISTS | Mieter-Kontakt vorhanden | Ja | lease.tenant_contact_id NOT NULL |
| RENTER_EMAIL | Mieter hat E-Mail | Ja* | contacts.email NOT NULL |
| RENTER_ADDRESS | Mieter hat Postadresse | Ja* | Adresse vorhanden (Q5.16) |
| COMM_PREF_SET | Kommunikationspräferenz gesetzt | Ja | msv_communication_prefs EXISTS |
| COMM_PREF_VALID | Präferenz passt zu Daten | Ja | Siehe Validierungsregel |
| LEASE_EXISTS | Aktiver Lease vorhanden | Ja | leases.status = 'active' |
| CONTRACT_DOC_LINKED | Mietvertrag im DMS | Nein | document_links.link_type = 'contract' |

*RENTER_EMAIL oder RENTER_ADDRESS — mindestens eins

### 6.2 Validierungsregel COMM_PREF_VALID

```
IF preferred_channel = 'email' AND RENTER_EMAIL = missing
   → COMM_PREF_VALID = missing
   → enrollment.status = 'blocked'

IF preferred_channel = 'letter' AND RENTER_ADDRESS = missing
   → COMM_PREF_VALID = missing
   → enrollment.status = 'blocked'
```

### 6.3 Blocked-States und CTAs

| Blocked Reason | CTA 1 | CTA 2 |
|----------------|-------|-------|
| RENTER_CONTACT_EXISTS | Lease bearbeiten | — |
| RENTER_EMAIL | Jetzt ergänzen | Anfordern |
| RENTER_ADDRESS | Jetzt ergänzen | Anfordern |
| COMM_PREF_SET | Präferenz setzen | — |
| COMM_PREF_VALID | Präferenz anpassen | Daten ergänzen |
| LEASE_EXISTS | Lease anlegen | — |

---

## 7) CONSENT & CONFIRMATIONS

### 7.1 Consent Gates

| Aktion | Consent Code | Status |
|--------|--------------|--------|
| Premium aktivieren | MSV_AGREEMENT | Existiert, prüfen bei Activation |

### 7.2 User Confirmations (kein Consent, aber Bestätigung)

| Aktion | Confirmation Text |
|--------|-------------------|
| Dokument versenden | „Ich bestätige den Versand dieses Dokuments." |
| Mahnung versenden | „Ich bestätige den Versand dieser Mahnung." |
| Daten anfordern | „Ich bestätige die Anforderung beim Mieter." |
| Mieter einladen | „Ich bestätige die Einladung an den Mieter." |
| Lease-Status auf terminated | „Ich bestätige die Beendigung dieses Mietverhältnisses." |

### 7.3 Auto-Send Opt-in (FROZEN)

- Default: `require_confirmation = true`
- Auto-Send nur wenn:
  - Premium ACTIVE
  - Readiness READY
  - `require_confirmation = false` (explizit gesetzt)
  - COMM_PREF_VALID = provided

---

## 8) AUDIT EVENTS

### 8.1 MSV-spezifische Events

| Event Type | Trigger | Payload Minimum |
|------------|---------|-----------------|
| msv.lease.created | Lease angelegt | lease_id, unit_id, contact_id |
| msv.lease.updated | Lease bearbeitet | lease_id, changed_fields |
| msv.lease.status_changed | Status geändert | lease_id, old_status, new_status |
| msv.enrollment.activated | Premium aktiviert | scope_type, scope_id, tier |
| msv.enrollment.blocked | Readiness failed | scope_id, missing_requirements |
| msv.enrollment.deactivated | User deaktiviert | scope_id |
| msv.prefs.updated | Präferenz geändert | scope_type, channel |
| msv.document.generated | Template generiert | template_code, document_id |
| msv.document.sent | Dokument versendet | document_id, channel |
| msv.payment.created | Periode erstellt | lease_id, period, amount |
| msv.payment.booked | Zahlung gebucht | payment_id, amount, source |
| msv.payment.overdue | Status overdue | payment_id, days_overdue |
| msv.payments.batch_created | Batch erstellt | month, count, total |
| msv.reminder.created | Mahnung erstellt | payment_id, stage |
| msv.reminder.confirmed | Versand bestätigt | reminder_id |
| msv.reminder.sent | Mahnung versendet | reminder_id, channel |
| msv.reminder.auto_sent | Auto-Mahnung | reminder_id, stage |
| msv.request.sent | Daten angefordert | request_type, channel |
| msv.invite.sent | Mieter eingeladen | lease_id, email |
| msv.report.generated | Report erstellt | period, document_id |

---

## 9) MIETY ANDOCKPUNKT (Phase 2 — nur Planung)

### 9.1 Miety Data Contract

**Minimal-Daten die der Mieter sieht:**

| Daten | Quelle | RLS-Scope |
|-------|--------|-----------|
| Eigener Lease | leases | lease.renter_org_id = user.org |
| Unit-Info | units | via Lease |
| Zahlungsstatus | rent_payments | via Lease |
| Dokumente | documents | via document_links mit entity_id = lease_id |
| Kommunikation | Inbox (Phase 3) | — |

**Minimal-Aktionen:**

| Aktion | Beschreibung |
|--------|--------------|
| Daten einsehen | Eigener Lease, Zahlungen, Dokumente |
| Dokument herunterladen | Verknüpfte PDFs |
| Kontaktdaten aktualisieren | Eigene E-Mail/Telefon |

### 9.2 Miety RLS-Konzept

- renter_user hat Membership in renter_org
- renter_org ist via lease.renter_org_id mit Lease verknüpft
- RLS: renter_user sieht NUR Daten mit Lease-Verknüpfung zu eigener renter_org
- Keine Cross-Tenant-Sichtbarkeit
- Keine SECURITY DEFINER

### 9.3 Invite Flow (detailliert)

**Voraussetzungen:**
- Lease existiert mit tenant_contact_id
- Contact hat E-Mail

**Schritte:**
1. MSV: User klickt „Mieter einladen"
2. System prüft: E-Mail vorhanden?
3. Invite-Template laden
4. Preview mit Token-Link
5. User Confirmation
6. INSERT renter_invites:
   - lease_id
   - contact_id
   - email
   - token (generiert)
   - status = 'pending'
   - expires_at = +30 Tage
7. Versand via Resend
8. Audit: msv.invite.sent

**Acceptance (Phase 2):**
1. Mieter klickt Link mit Token
2. Token-Validierung
3. Mieter registriert sich (auth.users)
4. renter_org wird erstellt (org_type = 'renter')
5. Membership: user → renter_org (role = 'renter_user')
6. Lease UPDATE: renter_org_id = neue renter_org
7. renter_invites UPDATE: status = 'accepted'
8. Mieter wird zu Miety weitergeleitet

---

## 10) OPEN QUESTIONS (Q5.x)

| ID | Frage | Optionen | Vorschlag | Prio |
|----|-------|----------|-----------|------|
| Q5.1 | Premium-Scope: Später auch Unit-Level? | A: Nur Property, B: Property + Unit-Override | B (Phase 2) | P2 |
| Q5.2 | rent_payments: Auto-Generierung bei Lease-Aktivierung? | A: Ja, B: Nein, C: Toggle | B (manuell Phase 1) | P1 |
| Q5.3 | Mieterhöhung: Ändert leases.monthly_rent direkt? | A: Ja, B: Nein, C: User-Choice | C | P1 |
| Q5.4 | Mieterhöhung: Eigener Consent-Code? | A: Ja, B: Nein | B (User-Confirm reicht) | P1 |
| Q5.5 | Brief-Versand: Via MOD-02 oder eigene Integration? | A: MOD-02, B: Eigene | A | P1 |
| Q5.6 | Reports: Welche Formate? | A: PDF, B: PDF+CSV, C: +Excel | B (Phase 1), C (Phase 2) | P2 |
| Q5.7 | FinAPI Kosten: Wer trägt? | A: Platform, B: Tenant, C: Anteilig | OFFEN | P2 |
| Q5.8 | Zahlungs-History: Aufbewahrungsfrist? | A: Unbegrenzt, B: 10 Jahre | B (gesetzlich) | P2 |
| Q5.9 | Miety: PWA oder Native App? | A: PWA, B: Native | A (einfacher) | P2 |
| Q5.10 | Miety: Chat/Kommunikation Tiefe? | A: Minimal, B: Vollständig | A (Phase 2) | P2 |
| Q5.11 | Overdue-Schwelle: Global oder pro Tenant? | A: Global, B: Konfigurierbar | B | P2 |
| Q5.12 | MSV-Settings: Wo speichern? | A: organizations.settings, B: Separate Tabelle | A (JSONB) | P2 |
| Q5.13 | Template-Versionierung: Wie handhaben? | A: Einfach (version int), B: Komplex | A | P2 |
| Q5.14 | Renter-Org: Bei Invite oder Acceptance erstellen? | A: Invite, B: Acceptance | B | P1 |
| Q5.15 | Lease-History: Separate Tabelle? | A: Ja, B: Nein (Audit reicht) | B | P2 |
| Q5.16 | Renter-Adresse: In contacts oder separate? | A: contacts erweitern, B: Fallback Unit-Adresse | A (contacts.address) | P1 |

---

## 11) ACCEPTANCE CRITERIA

### 11.1 MVP Acceptance Criteria (Base)

| # | Kriterium | Testbar |
|---|-----------|---------|
| AC1 | Alle Units des Tenants werden in /portal/msv/listen angezeigt | Query + UI |
| AC2 | Units ohne Lease werden als „Leerstand" markiert | UI |
| AC3 | Lease kann minimal angelegt werden (Kontakt, Start, Miete) | Flow |
| AC4 | Lease-Status kann geändert werden | Flow |
| AC5 | Premium-Toggle zeigt Paywall wenn Billing nicht aktiv | Mock |
| AC6 | Premium-Aktivierung führt Readiness Gate durch | Flow |
| AC7 | Blocked-Status zeigt Checkliste mit fehlenden Items | UI |
| AC8 | „Anfordern" CTA versendet Request (mit Confirmation) | E2E |
| AC9 | Kommunikationspräferenz kann gesetzt werden | Settings |
| AC10 | COMM_PREF_VALID wird korrekt evaluiert | Logic |
| AC11 | Kündigungsschreiben-Wizard generiert PDF | E2E |
| AC12 | Mieterhöhungsschreiben-Wizard generiert PDF | E2E |
| AC13 | Generierte Dokumente können im DMS gespeichert werden | DMS-Link |
| AC14 | Versand erfordert User Confirmation | Modal |
| AC15 | Mieter-Einladung erstellt renter_invite | DB |
| AC16 | Dashboard zeigt korrekte Base-KPIs | Berechnung |
| AC17 | Cross-Module CTAs funktionieren (→ MOD-04, → MOD-03) | Navigation |
| AC18 | Empty States werden korrekt angezeigt | UI |
| AC19 | RLS verhindert Cross-Tenant-Zugriff | Security |
| AC20 | Alle kritischen Aktionen erzeugen Audit Events | audit_events |

### 11.2 Premium Readiness Criteria

| # | Kriterium | Testbar |
|---|-----------|---------|
| PC1 | Zahlungsperioden können erstellt werden | Flow |
| PC2 | Manuelles Buchen aktualisiert rent_payment | DB + UI |
| PC3 | Status-Maschine (pending→partial→paid) funktioniert | Status |
| PC4 | Mahnung kann erstellt werden | Flow |
| PC5 | Mahnung erfordert Bestätigung vor Versand | Modal |
| PC6 | Auto-Send nur wenn require_confirmation = false | Logic |
| PC7 | Einstellungen zeigen Mahnfristen-Config | UI |
| PC8 | Paywall-Sections zeigen Upgrade-CTA | UI |
| PC9 | Premium-Badge wird angezeigt wenn aktiv | UI |
| PC10 | property_features wird bei Activation synchronisiert | DB |

---

## 12) KONFLIKT-CHECK

| Regel | Eingehalten? | Begründung |
|-------|--------------|------------|
| 3-Zonen-Architektur | ✓ | MOD-05 ist Zone 2, keine Zone-1-Workflows |
| Lease-SoT bei MOD-05 | ✓ | Explizit definiert, MOD-04 nur Read |
| RLS/tenant_id | ✓ | Alle Tabellen haben tenant_id |
| Keine SECURITY DEFINER | ✓ | Nur inline RLS-Checks |
| Keine neuen Consent Codes | ✓ | Nur MSV_AGREEMENT (existiert) |
| Freemium/Premium klar | ✓ | Explizit getrennt dokumentiert |
| Auto-Send sicher | ✓ | Default require_confirmation = true |
| Miety nur Andockpunkt | ✓ | Nur Contract + Invite-Flow geplant |

---

## 13) FREEZE CANDIDATES

Folgende Punkte sollten jetzt eingefroren werden:

1. **Lease-Ownership:** MOD-05 ist SoT für Leases (FROZEN)
2. **Base-Drafts via DMS:** Option A - DMS-first (FROZEN)
3. **Readiness-Codes:** RENTER_* Naming + Liste (FROZEN)
4. **COMM_PREF_VALID Validierung:** Kanal muss zu Daten passen (FROZEN)
5. **Auto-Send Default:** require_confirmation = true (FROZEN)

---

## 14) AUDIT-ZUSAMMENFASSUNG (2026-02-06)

### 14.1 Completion Status: 88%

| Bereich | Status | Details |
|---------|--------|---------|
| Route-Struktur | ✅ 100% | 4-Tile-Pattern korrekt implementiert |
| ObjekteTab | ✅ 100% | Unit-Liste mit Multi-Lease-Aggregation |
| MieteingangTab | ✅ 95% | Soll/Ist-Abgleich, PaymentBookingDialog |
| VermietungTab | ✅ 90% | Exposé-Erstellung, Portal-Publishing |
| EinstellungenTab | ✅ 95% | Premium-Status, Automatisierung, Bank-Accounts |
| **Mahnwesen** | ✅ 90% | Edge Function `sot-msv-reminder-check` aktiv |
| **Berichtswesen** | ✅ 90% | Edge Function `sot-msv-rent-report` aktiv |
| **Resend-Integration** | ⚠️ 50% | TODO-Kommentare, kein API-Key konfiguriert |
| FinAPI | ⚠️ 0% | Nur UI-Platzhalter ("Coming Soon") |

### 14.2 Edge Functions Prüfung

| Function | Status | Beschreibung |
|----------|--------|--------------|
| `sot-msv-reminder-check` | ✅ AKTIV | Prüft am 10. des Monats auf fehlende Zahlungen |
| `sot-msv-rent-report` | ✅ AKTIV | Generiert am 15. des Monats Mietberichte |

**Funktionsweise Mahnwesen:**
1. Läuft am 10. des Monats (oder manuell mit `forceRun: true`)
2. Prüft alle Premium-Enrollments
3. Identifiziert Leases ohne bezahlte Zahlung im aktuellen Monat
4. Erstellt Mahnstufen: `friendly` → `first` → `final`
5. TODO: Resend-Versand wenn API-Key konfiguriert

**Funktionsweise Berichtswesen:**
1. Läuft am 15. des Monats (oder manuell mit `forceRun: true`)
2. Aggregiert pro Property: Collection-Rate, paid/open counts
3. Generiert Unit-Details mit Mieter und Status
4. TODO: PDF-Generierung + Resend-Versand

### 14.3 Datenbank-Tabellen (Vollständig)

| Tabelle | Status | Beschreibung |
|---------|--------|--------------|
| `leases` | ✅ EXISTS | Mietverträge (SoT bei MOD-05) |
| `rent_payments` | ✅ EXISTS | Zahlungsperioden |
| `rent_reminders` | ✅ EXISTS | Mahnungen |
| `msv_enrollments` | ✅ EXISTS | Premium-Aktivierung |
| `msv_communication_prefs` | ✅ EXISTS | Automatisierungs-Einstellungen |
| `msv_templates` | ✅ EXISTS | Vorlagen (12 Templates aktiv) |
| `msv_bank_accounts` | ✅ EXISTS | FinAPI-Vorbereitung |
| `msv_readiness_items` | ✅ EXISTS | Readiness-Checkliste |

### 14.4 Hooks & Komponenten

| Hook/Component | Status | Beschreibung |
|----------------|--------|--------------|
| `useMSVPremium.ts` | ✅ AKTIV | Premium-Status + Unit-Count |
| `useMSVCommunicationPrefs` | ✅ AKTIV | Einstellungen laden/speichern |
| `PaymentBookingDialog.tsx` | ✅ AKTIV | Manuelle Zahlungsbuchung |
| `TemplateWizard.tsx` | ✅ AKTIV | Vorlagen-Generator |
| `ReadinessChecklist.tsx` | ✅ AKTIV | Premium-Activation Gate |
| `PaywallBanner.tsx` | ✅ AKTIV | Upgrade-CTA für Non-Premium |

### 14.5 Offene Punkte (Phase 2)

| Punkt | Priorität | Beschreibung |
|-------|-----------|--------------|
| RESEND_API_KEY | P1 | Für automatischen E-Mail-Versand erforderlich |
| PDF-Generierung | P1 | Mietberichte als PDF (jspdf oder Puppeteer) |
| FinAPI-Integration | P2 | Automatische Transaktionserkennung |
| Cron-Scheduling | P2 | Supabase pg_cron für tägliche Jobs |

---

## CHANGELOG

| Version | Datum | Änderungen |
|---------|-------|------------|
| v2.0.0-FINAL | 2026-01-25 | P0-Korrekturen: Lease-Ownership, Sichtbarkeit, Readiness-Codes, DMS-first, COMM_PREF_VALID, Auto-Send-Sicherheit |
| v1.0.0 | 2026-01-25 | Initial Draft |
