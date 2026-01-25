# MOD-06 — VERKAUF (Sales & Listings)

**Version:** v1.0.0  
**Status:** SPEC READY (Phase 1 MVP)  
**Letzte Aktualisierung:** 2026-01-25  
**Zone:** 2 (User Portal)  
**Route-Prefix:** `/portal/verkauf`  
**Abhängig von:** MOD-04 (Properties), MOD-01 (Contacts), MOD-03 (DMS), Backbone (Consents, Audit)

---

## 1) MODULDEFINITION

### 1.1 Ziel

MOD-06 „Verkauf" ist das operative Modul für den Immobilienverkauf aus Eigentümersicht. Es transformiert Properties (MOD-04) in verkaufsfähige Listings und verwaltet den gesamten Sales-Lifecycle bis zur Transaktion.

### 1.2 Nutzerrollen

| Rolle | Zugang | Beschreibung |
|-------|--------|--------------|
| org_admin | Full | Listings erstellen, aktivieren, Deals abschließen |
| internal_ops | Write | Listings bearbeiten, Anfragen bearbeiten |
| sales_partner | Read | Nur Partner-sichtbare Listings (via MOD-08) |

### 1.3 Scope IN (testbar)

- Listing aus Property erstellen (mit SALES_MANDATE Consent)
- Listing-Lifecycle: draft → review → active → reserved → sold/withdrawn
- Partner-Visibility Flags setzen
- Inquiry Management (Anfragen erfassen, zuordnen)
- Reservation Workflow (minimal Phase 1)
- Transaction Documentation (Notartermin, BNL)
- DMS-Integration für Verkaufsunterlagen

### 1.4 Scope OUT (Nicht-Ziele)

- Partner-Pipeline Management (→ MOD-08)
- Commission Berechnung (→ MOD-08)
- Financing Package Creation (→ MOD-07)
- Public Listing auf Zone 3 Websites (Phase 2)

### 1.5 Dependencies

| Modul/Backbone | Art | Beschreibung |
|----------------|-----|--------------|
| MOD-04 Immobilien | Read | properties, units (Struktur-SoT) |
| MOD-01 Stammdaten | Read | contacts (Käufer, Interessenten) |
| MOD-03 DMS | Link | documents für Exposés, Verträge |
| MOD-08 Vertriebspartner | Read | Partner lesen Listings |
| Backbone | Read | user_consents (SALES_MANDATE) |
| Backbone | Write | audit_events |

### 1.6 Source of Truth Matrix

| Domäne | SoT-Modul | Andere Module |
|--------|-----------|---------------|
| Listings | **MOD-06** | MOD-08: Read-only |
| Inquiries | **MOD-06** | — |
| Reservations | **MOD-06** | MOD-08: Status-Read |
| Transactions | **MOD-06** | — |
| Properties | MOD-04 | MOD-06: Read-only |
| Partner Pipelines | MOD-08 | MOD-06: — |

---

## 2) TRIGGER-LOGIK (FROZEN)

### 2.1 Aktivierung in MOD-04

Ein Property wird verkaufsfähig durch:
- `property_features.feature_code = 'sale'` mit `status = 'active'`
- ODER: `sale_enabled = true` (falls als direktes Flag implementiert)

**Konsistenzregel:** 
- MOD-04 setzt das Flag
- MOD-06 reagiert auf das Flag und zeigt Property in Listing-Kandidaten

### 2.2 Listing-Aktivierung erfordert SALES_MANDATE

Bevor ein Listing den Status `active` erreichen kann:
1. User muss `SALES_MANDATE` Consent erteilen
2. Consent wird in `user_consents` gespeichert
3. Audit Event: `consent.sales_mandate.granted`

---

## 3) DATENMODELL

### 3.1 Neue Tabellen

#### `listings` (NEU)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | uuid PK | Ja | — |
| tenant_id | uuid FK | Ja | Tenant-Isolation |
| public_id | text | Ja | `SOT-L-XXXXXXXX` |
| property_id | uuid FK | Ja | Referenz zu properties |
| status | enum | Ja | Listing-Status |
| asking_price | numeric | Nein | Angebotspreis |
| min_price | numeric | Nein | Mindestpreis (intern) |
| partner_visible | boolean | Ja | Sichtbar für Partner (Default: false) |
| partner_commission_rate | numeric | Nein | Provisionssatz für Partner |
| expose_document_id | uuid FK | Nein | Haupt-Exposé im DMS |
| sales_mandate_consent_id | uuid FK | Ja | Referenz zu user_consents |
| published_at | timestamptz | Nein | Aktivierungsdatum |
| reserved_at | timestamptz | Nein | Reservierungsdatum |
| sold_at | timestamptz | Nein | Verkaufsdatum |
| withdrawn_at | timestamptz | Nein | Rückzugsdatum |
| created_at | timestamptz | Ja | — |
| updated_at | timestamptz | Ja | — |

**Listing Status-Maschine:**
```
draft → internal_review → active → reserved → sold
                       ↘ withdrawn
active → withdrawn
reserved → active (Reservation cancelled)
reserved → withdrawn
```

**RLS:** tenant_id Match + Membership-Check

#### `listing_inquiries` (NEU)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | uuid PK | Ja | — |
| tenant_id | uuid FK | Ja | Tenant-Isolation |
| public_id | text | Ja | `SOT-A-XXXXXXXX` |
| listing_id | uuid FK | Ja | Referenz zu listings |
| contact_id | uuid FK | Nein | Interessent (wenn bekannt) |
| source | enum | Ja | website, partner, direct, referral |
| status | enum | Ja | new, qualified, rejected, converted |
| contact_name | text | Nein | Name (wenn kein Contact) |
| contact_email | text | Nein | Email |
| contact_phone | text | Nein | Telefon |
| message | text | Nein | Anfrage-Text |
| assigned_to | uuid FK | Nein | Bearbeiter (User) |
| partner_pipeline_id | uuid FK | Nein | Wenn via Partner |
| created_at | timestamptz | Ja | — |
| updated_at | timestamptz | Ja | — |

**Inquiry Status-Maschine:**
```
new → qualified → converted (→ Reservation)
    → rejected
```

#### `reservations` (NEU)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | uuid PK | Ja | — |
| tenant_id | uuid FK | Ja | Tenant-Isolation |
| public_id | text | Ja | `SOT-R-XXXXXXXX` |
| listing_id | uuid FK | Ja | Referenz zu listings |
| buyer_contact_id | uuid FK | Ja | Käufer |
| partner_pipeline_id | uuid FK | Nein | Wenn via Partner |
| status | enum | Ja | pending_owner, pending_buyer, confirmed, cancelled, completed |
| reserved_price | numeric | Nein | Vereinbarter Preis |
| reservation_fee | numeric | Nein | Reservierungsgebühr |
| reservation_expires_at | timestamptz | Nein | Ablauf |
| owner_confirmed_at | timestamptz | Nein | Eigentümer-Bestätigung |
| owner_confirmed_by | uuid FK | Nein | — |
| buyer_confirmed_at | timestamptz | Nein | Käufer-Bestätigung |
| notary_date | date | Nein | Geplanter Notartermin |
| created_at | timestamptz | Ja | — |
| updated_at | timestamptz | Ja | — |

**Reservation Status-Maschine:**
```
pending_owner → pending_buyer → confirmed → completed
            ↘ cancelled
pending_buyer → cancelled
confirmed → cancelled
confirmed → completed
```

#### `transactions` (NEU)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | uuid PK | Ja | — |
| tenant_id | uuid FK | Ja | Tenant-Isolation |
| public_id | text | Ja | `SOT-TX-XXXXXXXX` |
| reservation_id | uuid FK | Ja | Referenz zu reservations |
| listing_id | uuid FK | Ja | Referenz zu listings |
| property_id | uuid FK | Ja | Referenz zu properties |
| buyer_contact_id | uuid FK | Ja | Käufer |
| final_price | numeric | Ja | Finaler Kaufpreis |
| notary_date | date | Nein | Notartermin |
| bnl_date | date | Nein | BNL-Datum |
| handover_date | date | Nein | Übergabedatum |
| status | enum | Ja | pending, notarized, bnl_received, completed, cancelled |
| notes | text | Nein | — |
| created_at | timestamptz | Ja | — |
| updated_at | timestamptz | Ja | — |

**Transaction Status-Maschine:**
```
pending → notarized → bnl_received → completed
       ↘ cancelled
```

### 3.2 Enums

```
listing_status: draft, internal_review, active, reserved, sold, withdrawn
inquiry_source: website, partner, direct, referral
inquiry_status: new, qualified, rejected, converted
reservation_status: pending_owner, pending_buyer, confirmed, cancelled, completed
transaction_status: pending, notarized, bnl_received, completed, cancelled
```

---

## 4) ROUTE-STRUKTUR (BINDING)

| Route | Screen | Beschreibung |
|-------|--------|--------------|
| `/portal/verkauf` | Dashboard | KPIs, Pipeline-Overview, Alerts |
| `/portal/verkauf/objekte` | Listings | Listing-Liste mit Filtern |
| `/portal/verkauf/aktivitaeten` | Aktivitäten | Timeline, Logs |
| `/portal/verkauf/anfragen` | Anfragen | Inquiry Management |
| `/portal/verkauf/vorgaenge` | Vorgänge | Reservations + Transactions |

### Dynamische Routes (nicht in App.tsx, aber geplant)

| Route | Screen |
|-------|--------|
| `/portal/verkauf/objekte/new` | Listing erstellen |
| `/portal/verkauf/objekte/:id` | Listing Detail |
| `/portal/verkauf/anfragen/:id` | Inquiry Detail |
| `/portal/verkauf/vorgaenge/:id` | Reservation/Transaction Detail |

---

## 5) SCREEN SPECIFICATIONS

### 5.1 Dashboard (`/portal/verkauf`)

**KPIs:**
| KPI | Berechnung |
|-----|------------|
| Aktive Listings | COUNT(listings WHERE status='active') |
| Reservierte | COUNT(listings WHERE status='reserved') |
| Verkauft (YTD) | COUNT(transactions WHERE status='completed' AND year=current) |
| Offene Anfragen | COUNT(inquiries WHERE status='new') |
| Pipeline Value | SUM(listings.asking_price WHERE status IN ('active','reserved')) |

**Alerts:**
- Anfragen > 48h unbearbeitet
- Reservierungen mit ablaufendem Datum
- Listings ohne Exposé

**Quick Actions:**
- Neues Listing erstellen
- Anfrage bearbeiten
- Exposé generieren

### 5.2 Listings (`/portal/verkauf/objekte`)

**Layout:** Liste + Detail-Panel

**Tabellen-Spalten:**
| # | Spalte | Quelle |
|---|--------|--------|
| 1 | ID | listings.public_id |
| 2 | Objekt | properties.address via FK |
| 3 | Status | Badge |
| 4 | Angebotspreis | listings.asking_price |
| 5 | Partner-Sichtbar | Toggle |
| 6 | Anfragen | COUNT(inquiries) |
| 7 | Erstellt | listings.created_at |
| 8 | Aktionen | Dropdown |

**Filter:**
- Status (Multi-Select)
- Partner-Sichtbar (Ja/Nein)
- Preis-Range

**Aktionen:**
- Status ändern
- Partner-Visibility Toggle
- Exposé generieren
- Anfragen anzeigen
- Reservation erstellen

### 5.3 Anfragen (`/portal/verkauf/anfragen`)

**Layout:** Kanban ODER Liste

**Kanban-Spalten:** new | qualified | converted | rejected

**Aktionen pro Anfrage:**
- Qualifizieren
- Ablehnen
- In Reservation umwandeln
- Kontakt erstellen/verknüpfen

### 5.4 Vorgänge (`/portal/verkauf/vorgaenge`)

**Layout:** Tabelle mit Status-Tabs

**Tabs:**
- Reservierungen
- Transaktionen
- Abgeschlossen

**Reservation Detail:**
- Status-Timeline
- Owner/Buyer Confirmation Status
- Notartermin-Kalender
- Dokumenten-Links (DMS)
- "In Transaktion umwandeln" CTA

---

## 6) END-TO-END FLOWS

### Flow 1: Listing erstellen

**Trigger:** User klickt "Neues Listing" für Property mit sale_enabled

**Schritte:**
1. Property auswählen (nur sale_enabled)
2. Angebotspreis eingeben
3. Partner-Visibility setzen
4. **CONSENT GATE: SALES_MANDATE**
   - Modal: "Verkaufsauftrag erteilen"
   - User bestätigt
   - user_consents INSERT
5. listings INSERT (status='draft')
6. Audit: listing.created

**Output:** Listing in status='draft'

### Flow 2: Listing aktivieren

**Trigger:** User klickt "Aktivieren" für draft/internal_review Listing

**Schritte:**
1. Prüfe: SALES_MANDATE vorhanden?
2. Prüfe: Pflichtfelder (Preis, Exposé empfohlen)
3. Status-Update: → 'active'
4. published_at = now()
5. Wenn partner_visible=true: Sichtbar für MOD-08
6. Audit: listing.activated

### Flow 3: Anfrage bearbeiten

**Trigger:** Neue Inquiry (via API, manuell, oder Partner)

**Schritte:**
1. Inquiry erscheint in Queue
2. User qualifiziert oder lehnt ab
3. Bei Qualifizierung: Kontakt erstellen/verknüpfen
4. Bei Conversion: Reservation-Workflow starten
5. Audit: inquiry.qualified / inquiry.rejected / inquiry.converted

### Flow 4: Reservation erstellen

**Trigger:** Qualifizierte Inquiry → "Reservation erstellen"

**Schritte:**
1. Käufer-Kontakt bestätigen
2. Preis eingeben
3. Reservation INSERT (status='pending_owner')
4. **Owner Confirmation Required**
5. Nach Owner-Bestätigung: status='pending_buyer'
6. **Buyer Confirmation Required** (konzeptionell, Phase 2)
7. Nach beiden: status='confirmed'
8. Listing-Status → 'reserved'
9. Audit: reservation.created, reservation.owner_confirmed

### Flow 5: Transaction abschließen

**Trigger:** Reservation confirmed → Notartermin erfasst

**Schritte:**
1. Transaction INSERT (status='pending')
2. Notartermin eintragen
3. Nach Notartermin: status='notarized'
4. BNL-Datum eintragen: status='bnl_received'
5. Übergabe: status='completed'
6. Listing: status='sold'
7. Property in MOD-04: sale_enabled=false (optional)
8. Audit: transaction.notarized, transaction.completed

---

## 7) CONSENT & AUDIT

### Consent Gates

| Aktion | Consent Code | Pflicht |
|--------|--------------|---------|
| Listing erstellen | SALES_MANDATE | Ja |
| Listing aktivieren | — (Mandate bereits vorhanden) | — |
| Reservation Owner-Confirm | User Confirmation | Ja |

### Audit Events

| Event | Trigger | Payload |
|-------|---------|---------|
| listing.created | INSERT | listing_id, property_id |
| listing.activated | Status → active | listing_id, published_at |
| listing.reserved | Status → reserved | listing_id, reservation_id |
| listing.sold | Status → sold | listing_id, transaction_id |
| listing.withdrawn | Status → withdrawn | listing_id, reason |
| inquiry.created | INSERT | inquiry_id, source |
| inquiry.qualified | Status → qualified | inquiry_id |
| inquiry.converted | Status → converted | inquiry_id, reservation_id |
| reservation.created | INSERT | reservation_id |
| reservation.owner_confirmed | Owner confirms | reservation_id |
| reservation.confirmed | Both confirm | reservation_id |
| transaction.notarized | Notartermin | transaction_id, date |
| transaction.completed | Abschluss | transaction_id, final_price |

---

## 8) API CONTRACT

### Listings (API-200 bis API-215)

| API-ID | Endpoint | Method | Auth | Audit |
|--------|----------|--------|------|-------|
| API-200 | `/verkauf/listings` | GET | Tenant | — |
| API-201 | `/verkauf/listings` | POST | org_admin | listing.created |
| API-202 | `/verkauf/listings/:id` | GET | Tenant | — |
| API-203 | `/verkauf/listings/:id` | PATCH | org_admin | listing.updated |
| API-204 | `/verkauf/listings/:id/activate` | POST | org_admin | listing.activated |
| API-205 | `/verkauf/listings/:id/withdraw` | POST | org_admin | listing.withdrawn |
| API-206 | `/verkauf/listings/:id/toggle-partner` | POST | org_admin | listing.partner_toggled |

### Inquiries (API-220 bis API-230)

| API-ID | Endpoint | Method | Auth | Audit |
|--------|----------|--------|------|-------|
| API-220 | `/verkauf/inquiries` | GET | Tenant | — |
| API-221 | `/verkauf/inquiries` | POST | Tenant | inquiry.created |
| API-222 | `/verkauf/inquiries/:id` | GET | Tenant | — |
| API-223 | `/verkauf/inquiries/:id/qualify` | POST | Tenant | inquiry.qualified |
| API-224 | `/verkauf/inquiries/:id/reject` | POST | Tenant | inquiry.rejected |
| API-225 | `/verkauf/inquiries/:id/convert` | POST | org_admin | inquiry.converted |

### Reservations (API-240 bis API-250)

| API-ID | Endpoint | Method | Auth | Audit |
|--------|----------|--------|------|-------|
| API-240 | `/verkauf/reservations` | GET | Tenant | — |
| API-241 | `/verkauf/reservations` | POST | org_admin | reservation.created |
| API-242 | `/verkauf/reservations/:id` | GET | Tenant | — |
| API-243 | `/verkauf/reservations/:id/owner-confirm` | POST | org_admin | reservation.owner_confirmed |
| API-244 | `/verkauf/reservations/:id/cancel` | POST | org_admin | reservation.cancelled |
| API-245 | `/verkauf/reservations/:id/complete` | POST | org_admin | reservation.completed |

### Transactions (API-260 bis API-270)

| API-ID | Endpoint | Method | Auth | Audit |
|--------|----------|--------|------|-------|
| API-260 | `/verkauf/transactions` | GET | Tenant | — |
| API-261 | `/verkauf/transactions` | POST | org_admin | transaction.created |
| API-262 | `/verkauf/transactions/:id` | GET | Tenant | — |
| API-263 | `/verkauf/transactions/:id/notarize` | POST | org_admin | transaction.notarized |
| API-264 | `/verkauf/transactions/:id/bnl` | POST | org_admin | transaction.bnl_received |
| API-265 | `/verkauf/transactions/:id/complete` | POST | org_admin | transaction.completed |

---

## 9) CROSS-MODULE BERÜHRUNGSWEGE

### MOD-06 → MOD-04

| Trigger | Effect |
|---------|--------|
| Property.sale_enabled | Property erscheint in Listing-Kandidaten |
| Transaction.completed | Optional: sale_enabled=false |

### MOD-06 → MOD-08

| Trigger | Effect |
|---------|--------|
| Listing.partner_visible=true | Listing in MOD-08 sichtbar |
| Inquiry via Partner | partner_pipeline_id verknüpft |
| Reservation via Partner | Commission-Trigger |

### MOD-06 → MOD-08

| Trigger | Effect |
|---------|--------|
| Reservation.confirmed | CTA "Finanzierung starten" → MOD-08 |
| finance_packages.property_id | Read-only Reference |

---

## 10) OPEN QUESTIONS

| ID | Frage | Vorschlag | Prio |
|----|-------|-----------|------|
| Q6.1 | Listing ohne Exposé erlauben? | Ja, aber Warnung | P2 |
| Q6.2 | Partner-Commission-Rate: Pro Listing oder global? | Pro Listing (Override möglich) | P1 |
| Q6.3 | Buyer Confirmation: Phase 1 oder Phase 2? | Phase 2 (nur Owner Phase 1) | P1 |
| Q6.4 | Public Listing auf Zone 3: Automatisch oder manuell? | Manuell mit Flag | P2 |
| Q6.5 | Transaction Dokumente: Pflicht oder optional? | Optional Phase 1 | P2 |

---

## 11) MVP ACCEPTANCE CRITERIA

| # | Kriterium | Testbar |
|---|-----------|---------|
| AC1 | Listing kann aus sale_enabled Property erstellt werden | Flow |
| AC2 | SALES_MANDATE Consent wird vor Aktivierung geprüft | Consent Gate |
| AC3 | Listing-Status-Maschine funktioniert | Status-Tests |
| AC4 | Partner-Visibility Toggle funktioniert | Flag-Test |
| AC5 | Inquiry kann erfasst werden | CRUD |
| AC6 | Inquiry kann qualifiziert/abgelehnt werden | Status |
| AC7 | Reservation kann aus Inquiry erstellt werden | Flow |
| AC8 | Owner Confirmation funktioniert | Confirmation |
| AC9 | Listing wird auf 'reserved' gesetzt | Status-Sync |
| AC10 | Transaction kann erstellt werden | CRUD |
| AC11 | Transaction-Lifecycle funktioniert | Status |
| AC12 | Alle kritischen Aktionen erzeugen Audit Events | audit_events |
| AC13 | RLS verhindert Cross-Tenant-Zugriff | Security |
| AC14 | Dashboard zeigt korrekte KPIs | Berechnung |
| AC15 | DMS-Integration für Dokumente funktioniert | Links |

---

## 12) FREEZE CANDIDATES

1. **Listing Status-Enum** (FROZEN)
2. **SALES_MANDATE als Consent Gate** (FROZEN)
3. **Partner-Visibility Flag** (FROZEN)
4. **Reservation erfordert Owner-Confirmation** (FROZEN)
5. **listings Tabelle Struktur** (FROZEN)
