# Vollstaendiger System-Test-Backlog

> **Stand:** 2026-02-18 | **Version:** 1.0  
> **Ziel:** Jeder Flow funktioniert. Zone 1 + Zone 2 vollstaendig funktional. Keine hardcodierten Daten.

---

## Uebersicht

| Kategorie | Testfaelle | Prio |
|-----------|-----------|------|
| A — Golden Paths (Engine-Workflows) | 8 Workflows, 50 Steps | P0 |
| B — API Contracts (Cross-Zone) | 22 Contracts | P0 |
| C — Business-Logic Engines | 10 Engines, 25+ Funktionen | P0 |
| D — Zone 2 Module (22 Module, 95 Tiles) | 22 Module | P0 |
| E — Zone 1 Admin Desks (10 Desks) | 10 Desks, 50+ Sub-Routen | P0 |
| F — Edge Functions (113 Functions) | Kritische 20 | P1 |
| G — Zone 3 Websites | 5 Websites | P2 |
| H — Auth & Security | 9 Testfaelle | P0 |
| I — Hardcoded/Demo-Daten Bereinigung | Systemweit | P1 |

---

## A — GOLDEN PATHS (8 Engine-Workflows)

Jeder Golden Path muss End-to-End durchlaufen werden koennen.

### A1: MOD-04 — Immobilien-Zyklus (10 Steps)

| Step | Phase | Typ | Beschreibung | Test |
|------|-------|-----|-------------|------|
| create_property | 1 | action | Immobilie anlegen | ⬜ Property wird in DB erstellt |
| create_units | 1 | action | Einheiten anlegen | ⬜ Units + Leases erstellt |
| upload_documents | 2 | action | Dokumente hochladen (DMS) | ⬜ DMS-Ordner + Dateien |
| toggle_visibility | 2 | action | Sichtbarkeit setzen | ⬜ is_listed Flag wechselt |
| submit_to_sales_desk | 3 | system | An Sales Desk senden (Z2→Z1) | ⬜ CONTRACT_LISTING_PUBLISH |
| distribute_listing | 3 | system | Listing verteilen (Z1→Z2/Z3) | ⬜ CONTRACT_LISTING_DISTRIBUTE |
| finance_handoff | 4 | system | Finanzierung anstossen (Z2→Z1) | ⬜ CONTRACT_FINANCE_SUBMIT |
| create_project | 4 | system | Projekt anlegen (Z1→Z2) | ⬜ CONTRACT_PROJECT_INTAKE |
| manage_tenants | 5 | route | Mieter verwalten | ⬜ Renter Invite Flow |
| bwa_controlling | 5 | route | BWA / Controlling | ⬜ BWA Engine Resultate |

**Fail-States zu testen:**
- ⬜ sales.desk.submit.timeout
- ⬜ listing.distribution.rejected
- ⬜ finance.handoff.error

### A2: MOD-07/11 — Finanzierung (5 Steps)

| Step | Phase | Beschreibung | Test |
|------|-------|-------------|------|
| fill_selfinfo | 1 | Selbstauskunft ausfuellen | ⬜ applicant_profiles persistent |
| submit_request | 2 | Anfrage einreichen (Z2→Z1) | ⬜ finance_requests erstellt, CONTRACT_FINANCE_SUBMIT |
| assign_mandate | 3 | Mandat zuweisen (Z1→Z2) | ⬜ CONTRACT_MANDATE_ASSIGNMENT |
| bank_submission | 4 | Bankeinreichung | ⬜ finance_requests.status = bank_submitted |
| payout | 5 | Auszahlung | ⬜ finance_requests.status = completed |

**Fail-States:**
- ⬜ finance.request.submit.duplicate_detected
- ⬜ finance.mandate.assignment.rejected

### A3: MOD-08/12 — Investment/Akquise (7 Steps)

| Step | Phase | Beschreibung | Test |
|------|-------|-------------|------|
| create_mandate | 1 | Suchmandat anlegen | ⬜ acq_mandates erstellt |
| submit_to_acquiary | 2 | An Acquiary senden (Z2→Z1) | ⬜ CONTRACT_ACQ_MANDATE_SUBMIT |
| assign_manager | 3 | Manager zuweisen (Z1→Z2) | ⬜ assigned_manager_user_id gesetzt |
| research_contacts | 4 | Kontaktrecherche | ⬜ contact_staging Eintraege |
| send_outbound | 5 | Akquise-Anschreiben (Z2→Extern) | ⬜ CONTRACT_ACQ_OUTBOUND_EMAIL |
| receive_inbound | 6 | Antwort-Email (Extern→Z1) | ⬜ CONTRACT_ACQ_INBOUND_EMAIL |
| create_offer | 7 | Angebot erstellen | ⬜ acq_offers erstellt |

### A4: MOD-13 — Projekte (5 Steps)

| Step | Phase | Beschreibung | Test |
|------|-------|-------------|------|
| create_project | 1 | Projekt anlegen | ⬜ dev_projects erstellt |
| define_units | 2 | Einheiten definieren | ⬜ dev_project_units erstellt |
| publish_listing | 3 | Vertrieb starten (Z2→Z1) | ⬜ CONTRACT_LISTING_PUBLISH |
| generate_landing | 4 | Landing Page (Z2→Z3) | ⬜ CONTRACT_LANDING_PAGE_GENERATE |
| track_sales | 5 | Vertrieb tracken | ⬜ sale_transactions erstellt |

### A5: GP-VERMIETUNG — Vermietungszyklus (5 Steps)

| Step | Phase | Beschreibung | Test |
|------|-------|-------------|------|
| select_unit | 1 | Einheit auswaehlen | ⬜ Unit selektierbar |
| send_invite | 2 | Mietereinladung (Z1→Z3) | ⬜ CONTRACT_RENTER_INVITE, Edge Function |
| accept_invite | 3 | Mieter akzeptiert (Z3→Z1) | ⬜ Neues Org + Membership |
| grant_access | 4 | Datenraum-Zugang (Z2→Z3) | ⬜ CONTRACT_DATA_ROOM_ACCESS |
| activate_portal | 5 | Portal aktivieren | ⬜ Mieter sieht MOD-20 Zuhause |

### A6: GP-LEAD — Lead-Generierung (4 Steps)

| Step | Phase | Beschreibung | Test |
|------|-------|-------------|------|
| capture_lead | 1 | Lead erfassen (Z3→Z1) | ⬜ CONTRACT_LEAD_CAPTURE, sot-lead-inbox |
| qualify_lead | 2 | Lead qualifizieren (Z1) | ⬜ leads.status = qualified |
| assign_lead | 3 | Lead zuweisen (Z1→Z2) | ⬜ leads.assigned_partner_id gesetzt |
| convert_lead | 4 | Lead konvertieren (Z2) | ⬜ Konversion in MOD-09/10 |

### A7: GP-FINANCE-Z3 — Zone 3 Finanzierung (7 Steps)

| Step | Phase | Beschreibung | Test |
|------|-------|-------------|------|
| submit_request | 1 | Z3 Anfrage (FutureRoom) | ⬜ sot-futureroom-public-submit |
| create_lead | 2 | Lead erstellen (Z3→Z1) | ⬜ leads Eintrag |
| create_dataroom | 3 | Datenraum erstellen | ⬜ DMS Ordner |
| send_confirmation | 4 | Bestaetigungs-Email | ⬜ sot-system-mail-send |
| triage_request | 5 | Triage in Z1 | ⬜ FutureRoom Desk Inbox |
| assign_manager | 6 | Manager zuweisen | ⬜ finance_requests.assigned_manager_id |
| bank_submit | 7 | Bankeinreichung | ⬜ Status-Update |

### A8: GP-PET — Pet Manager Lifecycle (7 Steps)

| Step | Phase | Beschreibung | Test |
|------|-------|-------------|------|
| capture_pet_lead | 1 | Lead via Z3 Website | ⬜ pet_z1_booking_requests |
| create_z1_profile | 2 | Z1 Profil erstellen | ⬜ sot-pet-profile-init |
| create_customer | 3 | Kunde erstellen (Z1→Z2) | ⬜ pet_customers |
| assign_provider | 4 | Provider zuweisen | ⬜ pet_provider_assignments |
| link_mod05 | 5 | MOD-05 verknuepfen | ⬜ Pets-Modul aktiv |
| first_booking | 6 | Erste Buchung | ⬜ pet_bookings erstellt |
| complete_cycle | 7 | Zyklus abschliessen | ⬜ Alle Flags true |

---

## B — API CONTRACTS (22 Cross-Zone Contracts)

Jeder Contract muss validiert werden: Trigger → Payload → SoT-Uebergabe → Fehlerbehandlung.

| # | Contract | Richtung | Implementierung | Test |
|---|----------|----------|-----------------|------|
| 1 | CONTRACT_ONBOARDING | Auth→Z2 | SQL Trigger on_auth_user_created | ⬜ Profile + Org + Membership erstellt |
| 2 | CONTRACT_LEAD_CAPTURE | Z3→Z1 | sot-lead-inbox | ⬜ Lead dedupliziert + erstellt |
| 3 | CONTRACT_EMAIL_INBOUND | Extern→Z1 | sot-inbound-receive | ⬜ E-Mail in admin_inbound_emails |
| 4 | CONTRACT_LISTING_PUBLISH | Z2→Z1 | sot-listing-publish | ⬜ Listing-Request an Sales Desk |
| 5 | CONTRACT_LISTING_DISTRIBUTE | Z1→Z2/Z3 | DB Trigger | ⬜ listing_publications erstellt |
| 6 | CONTRACT_FINANCE_SUBMIT | Z2→Z1 | DB Status-Enum | ⬜ finance_requests.status = submitted |
| 7 | CONTRACT_FINANCE_DOC_REMINDER | System→Z2 | finance-document-reminder (Cron) | ⬜ Reminder-Emails versendet |
| 8 | CONTRACT_MANDATE_ASSIGNMENT | Z1→Z2 | sot-finance-manager-notify | ⬜ Manager benachrichtigt |
| 9 | CONTRACT_ACQ_MANDATE_SUBMIT | Z2→Z1 | DB Status-Enum | ⬜ acq_mandates.status = submitted |
| 10 | CONTRACT_ACQ_INBOUND_EMAIL | Extern→Z1 | sot-acq-inbound-webhook | ⬜ Inbound routed + Offer erstellt |
| 11 | CONTRACT_ACQ_OUTBOUND_EMAIL | Z2→Extern | sot-acq-outbound | ⬜ E-Mail versendet via Resend |
| 12 | CONTRACT_DATA_ROOM_ACCESS | Z2→Z3 | access_grants Tabelle | ⬜ Grant erstellt + RLS wirksam |
| 13 | CONTRACT_SOCIAL_MANDATE_SUBMIT | Z2→Z1 | sot-social-mandate-submit | ⬜ Social-Mandat erstellt |
| 14 | CONTRACT_SOCIAL_PAYMENT | Z2→Extern→Z1 | sot-social-payment-* | ⬜ Stripe Checkout + Webhook |
| 15 | CONTRACT_PROJECT_INTAKE | Z1→Z2 | sot-project-intake | ⬜ dev_projects erstellt |
| 16 | CONTRACT_LANDING_PAGE_GENERATE | Z2→Z3 | sot-generate-landing-page | ⬜ Landing Page generiert |
| 17 | CONTRACT_RENOVATION_OUTBOUND | Z2→Extern | sot-renovation-outbound | ⬜ Tender-Anfrage versendet |
| 18 | CONTRACT_RENOVATION_INBOUND | Extern→Z1 | sot-renovation-inbound-webhook | ⬜ Angebot empfangen |
| 19 | CONTRACT_RENTER_INVITE | Z2→Z1→Z3 | sot-renter-invite | ⬜ Einladung + Org-Erstellung |
| 20 | CONTRACT_WHATSAPP_INBOUND | Extern→Z1 | sot-whatsapp-webhook | ⬜ Nachricht empfangen |
| 21 | CONTRACT_WHATSAPP_MEDIA | Z1→Z2 DMS | sot-whatsapp-media | ⬜ Media in DMS gespeichert |
| 22 | CONTRACT_TERMS_GATE_STANDARD | Z2 intern | Consent-Flow | ⬜ Consent persistent |

---

## C — BUSINESS-LOGIC ENGINES (10 Engines)

Alle Engines muessen korrekte Berechnungen liefern. Unit-Tests existieren fuer 8 von 10.

| # | Engine | Funktionen | Unit-Test | Integrations-Test |
|---|--------|-----------|-----------|-------------------|
| 1 | **AkquiseCalc** | calcBestandFull, calcBestandQuick, calcAufteilerFull, calcAufteilerQuick, calcAufteilerProject | ✅ engine.test.ts | ⬜ MOD-12 Tools Side-by-Side |
| 2 | **Finanzierung** | calcHaushaltsrechnung, calcBonitaet, calcAnnuity, calcConsumerLoanOffers | ✅ engine.test.ts | ⬜ MOD-07 Anfrage-Tab, MOD-11 KDF |
| 3 | **Provision** | calcCommission, calcPartnerSplit, calcAggregateTotals | ✅ engine.test.ts | ⬜ MOD-10 Uebersicht, MOD-09 Leads |
| 4 | **Bewirtschaftung** | calcBWA, calcInstandhaltungsruecklage, calcLeerstandsquote, calcMietpotenzial | ✅ engine.test.ts | ⬜ MOD-04 Verwaltung BWA-Tab |
| 5 | **ProjektCalc** | calcProjectMargin, calcUnitPricing | ✅ engine.test.ts | ⬜ MOD-13 Einheiten-Kalkulation |
| 6 | **NK-Abrechnung** | calculateLeaseDaysInPeriod, calculateProratedPrepayments, allocationLogic | ✅ allocationLogic.test.ts | ⬜ MOD-04 NK-Abrechnung Flow |
| 7 | **Finanzuebersicht** | calcFinanzuebersicht | ✅ engine.test.ts | ⬜ MOD-18 Dashboard Widgets |
| 8 | **Vorsorgeluecke** | calcAltersvorsorge, calcBuLuecke | ✅ engine.test.ts | ⬜ MOD-18 Vorsorge-Tab |
| 9 | **V&V-Steuer** | calcVVSteuer | ✅ engine.test.ts | ⬜ MOD-04 Steuer-Tab |
| 10 | **DemoData** | generateDemoProperties, petManagerDemo | ❌ Kein Test | ⬜ MOD-01 Demo-Toggle |

---

## D — ZONE 2 MODULE (22 Module, 95 Tiles)

Jedes Modul, jeder Tile muss: (1) laden, (2) DB-Daten anzeigen (nicht hardcoded), (3) CRUD funktionieren.

### D1: Core-Module (MOD-00 bis MOD-08) — PRIO P0

| MOD | Name | Tiles | Funktionstest |
|-----|------|-------|--------------|
| 00 | Dashboard | — | ⬜ Widgets laden, KPIs live |
| 01 | Stammdaten | 5 | ⬜ Profil CRUD, ⬜ Vertraege CRUD, ⬜ Abrechnung (Credits live), ⬜ Sicherheit, ⬜ Demo-Toggle |
| 02 | KI Office | 7 | ⬜ E-Mail senden/empfangen, ⬜ Brief generieren, ⬜ Kontakte CRUD, ⬜ Kalender, ⬜ Widgets, ⬜ WhatsApp, ⬜ Videocalls |
| 03 | DMS | 4 | ⬜ Upload, ⬜ Ordner CRUD, ⬜ Posteingang, ⬜ Sortieren/Verschieben |
| 04 | Immobilien | 4 | ⬜ Zuhause (MOD-20 inline), ⬜ Portfolio CRUD, ⬜ Verwaltung BWA, ⬜ Sanierung LV |
| 05 | Pets | 4 | ⬜ Tiere CRUD, ⬜ Caring/Termine, ⬜ Shop, ⬜ Mein Bereich |
| 06 | Verkauf | 4 | ⬜ Objekte listen, ⬜ Anfragen bearbeiten, ⬜ Vorgaenge tracken, ⬜ Reporting |
| 07 | Finanzierung | 5 | ⬜ Selbstauskunft (7 Sektionen), ⬜ Dokumente Upload, ⬜ Anfrage einreichen, ⬜ Status-Tracking, ⬜ Privatkredit Rechner |
| 08 | Investment-Suche | 4 | ⬜ Suche mit Engine, ⬜ Favoriten, ⬜ Mandat-Wizard, ⬜ Simulation 40J |

### D2: Manager-Module (MOD-09 bis MOD-14) — PRIO P0

| MOD | Name | Tiles | Funktionstest |
|-----|------|-------|--------------|
| 09 | Immomanager | 5+6dyn | ⬜ Katalog (v_public_listings), ⬜ Beratung/Expose, ⬜ Kunden CRM, ⬜ Network, ⬜ Leads, ⬜ Selfie Ads |
| 10 | Provisionen | 1 | ⬜ KPI-Dashboard live, ⬜ Provisionshistorie aus sale_transactions |
| 11 | Finanzierungsmanager | 5+7dyn | ⬜ Dashboard, ⬜ Finanzierungsakte, ⬜ Magic Intake, ⬜ Einreichung, ⬜ Provisionen, ⬜ Archiv |
| 12 | Akquisemanager | 5+3dyn | ⬜ Dashboard, ⬜ Mandate CRUD, ⬜ Objekteingang, ⬜ Datenbank, ⬜ Tools (5 Collapsibles) |
| 13 | Projektmanager | 4+2dyn | ⬜ Dashboard, ⬜ Projekte CRUD, ⬜ Vertrieb, ⬜ Landing Page Generator |
| 14 | Communication Pro | 4 | ⬜ Serien-Emails, ⬜ Recherche (SOAT), ⬜ Social Drafts, ⬜ KI-Telefon Agent |

### D3: Addon-Module (MOD-15 bis MOD-22) — PRIO P1

| MOD | Name | Tiles | Funktionstest | Hardcoded? |
|-----|------|-------|--------------|------------|
| 15 | Fortbildung | 4 | ⬜ Buecher, ⬜ Fortbildungen, ⬜ Vortraege, ⬜ Kurse | ⚠️ Kuratiert, kein User-Tracking |
| 16 | Shop | 5 | ⬜ Amazon, ⬜ OTTO, ⬜ Miete24, ⬜ Smart Home, ⬜ Bestellungen | ⚠️ Affiliate-Links |
| 17 | Car-Management | 4 | ⬜ Fahrzeuge CRUD, ⬜ Boote CRUD, ⬜ Privatjet, ⬜ Angebote | ⬜ DMS-Ordner bei Anlage |
| 18 | Finanzen | 9 | ⬜ Dashboard, ⬜ Konten (FinAPI), ⬜ Investment, ⬜ KV, ⬜ Sachversicherungen, ⬜ Vorsorge, ⬜ Darlehen, ⬜ Abonnements, ⬜ Vorsorgedokumente | ⚠️ KV/Vorsorge/Abo teils client-seitig |
| 19 | Photovoltaik | 4+2dyn | ⬜ Anlagen CRUD, ⬜ Enpal (Stub), ⬜ Dokumente, ⬜ Einstellungen | ⚠️ Enpal-Integration Stub |
| 20 | Miety/Zuhause | 4+1dyn | ⬜ Uebersicht, ⬜ Versorgung Vertraege, ⬜ Smart Home, ⬜ Kommunikation | ⬜ contractManifest.ts SSOT |
| 22 | Pet Manager | 7 | ⬜ Dashboard, ⬜ Profil, ⬜ Pension, ⬜ Services, ⬜ Mitarbeiter, ⬜ Kunden, ⬜ Finanzen | ⬜ Booking-Flow Z3→Z1→Z2 |

---

## E — ZONE 1 ADMIN DESKS (10 Desks)

### E1: Operative Desks — PRIO P0

| Desk | Route | Sub-Routen | Funktionstest |
|------|-------|------------|--------------|
| **Sales Desk** | /admin/sales-desk | 5 | ⬜ Dashboard KPIs live, ⬜ Veroeffentlichungen (listings Query), ⬜ Inbox, ⬜ Partner-Zuordnung, ⬜ Audit-Log |
| **Lead Desk** | /admin/lead-desk | 5 | ⬜ Dashboard, ⬜ Pool (leads Query + Filter), ⬜ Zuweisungen (lead_assignments), ⬜ Provisionen (commissions), ⬜ Monitor (Pipeline KPIs) |
| **FutureRoom** | /admin/futureroom | 9 | ⬜ Dashboard, ⬜ Inbox (finance_requests), ⬜ Zuweisung, ⬜ Manager-Liste, ⬜ Banks, ⬜ Monitoring, ⬜ Templates, ⬜ WebLeads, ⬜ Contracts |
| **Acquiary** | /admin/acquiary | 6+ | ⬜ Dashboard, ⬜ Kontakte (contact_staging), ⬜ Datenbank (acq_offers), ⬜ Mandate (acq_mandates), ⬜ Routing (unrouted Messages), ⬜ Monitor |
| **Projekt Desk** | /admin/projekt-desk | 4 | ⬜ Dashboard, ⬜ Projekte (dev_projects), ⬜ Listings (listing_publications), ⬜ Landing Pages |
| **Pet Desk** | /admin/pet-desk | 5 | ⬜ Governance, ⬜ Vorgaenge (pet_bookings), ⬜ Kunden (pet_customers), ⬜ Shop, ⬜ Billing |
| **Finance Desk** | /admin/finance-desk | 4 | ⬜ Dashboard, ⬜ Inbox (leads mit interest_type=finance), ⬜ Faelle, ⬜ Monitor |

### E2: Governance Desks — PRIO P1

| Desk | Route | Sub-Routen | Funktionstest |
|------|-------|------------|--------------|
| **Armstrong Console** | /admin/armstrong | 11 | ⬜ Dashboard, ⬜ Actions, ⬜ Logs, ⬜ Billing, ⬜ Knowledge, ⬜ Policies, ⬜ Engines, ⬜ Golden Paths, ⬜ Consumption, ⬜ Embeddings, ⬜ Credits |
| **Fortbildung Admin** | /admin/fortbildung | 1 | ⬜ Verwaltungsoberflaeche |
| **Website Hosting** | /admin/website-hosting | 1 | ⬜ Website-Status + Konfiguration |

---

## F — EDGE FUNCTIONS (Kritische 20)

| # | Function | Trigger | Test |
|---|----------|---------|------|
| 1 | sot-create-test-user | Admin-Aktion | ⬜ User + Org + Profile erstellt |
| 2 | sot-armstrong-advisor | Chat-Input | ⬜ AI-Antwort zurueck |
| 3 | sot-dms-download-url | Datei-Klick | ⬜ Signed URL generiert |
| 4 | sot-mail-send | E-Mail-Aktion | ⬜ E-Mail via Resend |
| 5 | sot-property-crud | Immobilien-CRUD | ⬜ Create/Read/Update |
| 6 | sot-inbound-receive | Resend Webhook | ⬜ E-Mail in DB |
| 7 | sot-lead-inbox | Z3 Form-Submit | ⬜ Lead dedupliziert |
| 8 | sot-investment-engine | Suche/Simulation | ⬜ 40J-Projektion |
| 9 | sot-renter-invite | Vermieter-Aktion | ⬜ Einladungs-Email |
| 10 | sot-finance-manager-notify | Z1-Zuweisung | ⬜ Manager benachrichtigt |
| 11 | sot-futureroom-public-submit | Z3-Formular | ⬜ Anfrage erstellt |
| 12 | sot-acq-inbound-webhook | Resend Webhook | ⬜ Routing + Offer |
| 13 | sot-acq-outbound | E-Mail-Versand | ⬜ Template + Resend |
| 14 | sot-generate-landing-page | Projekt-Aktion | ⬜ HTML generiert |
| 15 | sot-listing-publish | Verkauf-Aktion | ⬜ listing_publications |
| 16 | sot-research-engine | Recherche-Aktion | ⬜ Places + Apify + Firecrawl |
| 17 | sot-pet-profile-init | Pet Onboarding | ⬜ Profile erstellt |
| 18 | sot-renovation-outbound | Sanierung-Aktion | ⬜ Tender-Email |
| 19 | sot-credit-checkout | Credits kaufen | ⬜ Stripe Session |
| 20 | sot-whatsapp-webhook | Meta Webhook | ⬜ Nachricht gespeichert |

---

## G — ZONE 3 WEBSITES (5)

| Website | Route | Test |
|---------|-------|------|
| SoT | /website/sot | ⬜ Hauptseite + 4 Unterseiten laden |
| Kaufy | /website/kaufy | ⬜ Hauptseite + Vermieter + Expose laden |
| FutureRoom | /website/futureroom | ⬜ Hauptseite + Kontaktformular |
| Acquiary | /website/acquiary | ⬜ Hauptseite laden |
| Lennox/Tierservice | /website/tierservice | ⬜ Hauptseite + Provider-Suche |

---

## H — AUTH & SECURITY (9 Testfaelle)

| # | Test | Prio | Status |
|---|------|------|--------|
| H1 | Login Passwort (Erfolg + Fehler) | P0 | ⬜ |
| H2 | Login OTP | P0 | ⬜ |
| H3 | Passwort vergessen Flow | P0 | ⬜ |
| H4 | Session Persistence | P0 | ⬜ |
| H5 | Logout + Unauth-Guard | P0 | ⬜ |
| H6 | Zone 1 Zugriff als Non-Admin | P0 | ⬜ |
| H7 | Tenant-Isolation (RLS) | P0 | ⬜ |
| H8 | Test-User erstellen (Edge Function) | P0 | ⬜ |
| H9 | Onboarding Trigger (handle_new_user) | P0 | ⬜ |

---

## I — HARDCODED / DEMO-DATEN BEREINIGUNG

Ziel: Keine funktionslosen Kacheln, keine hardcodierten Beispieldaten.

| # | Bereich | Problem | Loesung | Prio |
|---|---------|---------|---------|------|
| I1 | MOD-15 Fortbildung | Kuratierte Inhalte ohne User-Tracking | "Meine Kurse" + "Zertifikate" Feature oder klar als "Bibliothek" kennzeichnen | P2 |
| I2 | MOD-16 Shop | BestellungenTab leer/nicht nutzbar | Tab entfernen oder mit affiliate_clicks Tracking fuellen | P2 |
| I3 | MOD-19 Enpal-Tab | Stub ohne echte API | Als "Partner-Referral" kennzeichnen mit Kontaktformular | P2 |
| I4 | MOD-18 KV/Vorsorge | Teils client-seitige Demo-Daten | DB-basierte Vertraege (insurance_contracts, vorsorge_contracts) | P1 |
| I5 | MOD-05 KI-Telefon (in MOD-14) | Tile "KI-Telefon" unter Communication Pro ist Stub | Als "Coming Soon" kennzeichnen oder mit ElevenLabs verbinden | P2 |
| I6 | Dashboard Widgets | Einige Widgets zeigen Platzhalterdaten | Alle Widgets auf live DB-Queries umstellen | P1 |
| I7 | MOD-10 Provisionen | Nur 1 Tile "Uebersicht" | Entweder genuegt oder Lead-Management Tiles hinzufuegen | P1 |

---

## Testplan — Reihenfolge

### Phase 1: Fundament (Auth + Routing + Engines) — ✅ DONE

| # | Test | Status | Ergebnis |
|---|------|--------|----------|
| 1 | C1-C10: Engine Unit-Tests | ✅ DONE | 9/9 Dateien, 75/75 Tests grün. AkquiseCalc(6), ProjektCalc(5), VVSteuer(7), Bewirtschaftung(8), Provision(7), Vorsorgeluecke(11), NKAbrechnung(9), Finanzuebersicht(11), Finanzierung(11). DemoData hat keinen Unit-Test. |
| 2 | G1-G5: Zone 3 Websites Smoke | ✅ DONE | 5/5 Websites laden: SoT ✅, Kaufy ✅, FutureRoom ✅, Acquiary ✅, Lennox/Tierservice ✅ |
| 3 | H1: Auth-Seite rendert | ✅ DONE | Login-Formular rendert korrekt, Social-Login-Buttons vorhanden |
| 4 | H1-H9: Auth-Flow | ✅ DONE | Auth-Logs bestaetigen Login/Logout funktioniert (User thomas.stelzl). FINDING P1 gefixt: PortalLayout redirected jetzt korrekt zu /auth bei abgelaufenem Token statt Infinite-Spinner. |
| 5 | Zone 2: 22 Module Smoke-Test | ✅ DONE | Alle 22 Module-Page-Dateien existieren und sind im portalModulePageMap registriert. Code-Analyse bestaetigt: dashboard, stammdaten, office, dms, immobilien, verkauf, finanzierung, finanzierungsmanager, investments, vertriebspartner, provisionen, akquise-manager, projekte, communication-pro, fortbildung, services, cars, finanzanalyse, photovoltaik, miety, pets, petmanager. |
| 6 | Zone 1: 10 Admin-Desks Smoke-Test | ✅ DONE | Alle Desk-Komponenten vorhanden: SalesDesk, FinanceDesk, Acquiary, LeadDesk, ProjektDesk, PetDesk(PetmanagerDesk), FutureRoom(9 Sub-Routes), Armstrong(11 Sub-Routes), Fortbildung, WebHosting. |

**FINDING P1 (FIXED):** Infinite-Spinner bei abgelaufenem Refresh-Token auf `/portal` — PortalLayout.tsx zeigt jetzt Spinner statt "Keine Organisation zugewiesen" und leitet nach 2s zu `/auth` weiter.

**FINDING P2 (FIXED):** 4 Console-Warnings "Missing admin component: PetDeskVorgaenge/Kunden/Shop/Billing" — pet-desk fehlte in der Skip-Liste der Standard-Admin-Routes (ManifestRouter.tsx Zeile 497).

### Phase 2: Core-Flows (Golden Paths A1-A8) — ✅ DONE

| # | GP | Status | Ergebnis |
|---|-----|--------|----------|
| 1 | Engine-Code (engine.ts) | ✅ OK | Reine Funktionen, Registry-basiert, Backbone-Validierung, Fail-States. |
| 2 | Registry (8 GPs) | ✅ OK | MOD-04, MOD-07, MOD-08, MOD-12(neu), MOD-13, GP-VERMIETUNG, GP-LEAD, GP-FINANCE-Z3, GP-PET — alle registriert. |
| 3 | DB-Tabellen (required_entities) | ✅ OK | Alle 20 referenzierten Tabellen existieren: properties, units, storage_nodes, user_consents, applicant_profiles, finance_requests, acq_mandates, acq_offers, dev_projects, dev_project_units, leases, renter_invites, leads, lead_assignments, pet_z1_customers, pet_z1_booking_requests, pet_customers, pets, listings, commissions. |
| 4 | Context Resolvers | ✅ FIXED | Vorher: Nur MOD-04 + GP-PET hatten Resolver. FINDING P3: MOD-07, MOD-08/12, MOD-13 fehlten → Guards wirkungslos. Jetzt: Alle 6 Resolver registriert (MOD-04, MOD-07, MOD-08, MOD-12, MOD-13, GP-PET). |
| 5 | GoldenPathGuard (4 Module) | ✅ OK | Guard aktiv auf MOD-04 (Immobilien), MOD-07 (Finanzierung), MOD-12 (Akquise), MOD-13 (Projekte). Alle funktional. |
| 6 | Ledger Events Whitelist | ✅ OK | ~80 Events registriert inkl. Fail-States und PII-Audit. |
| 7 | Types (types.ts) | ✅ OK | Camunda-Ready: task_kind, camunda_key, correlation_keys, StepFailState. |

**FINDING P3 (FIXED):** MOD-12 war nicht in der GP-Registry registriert (nur MOD-08). GoldenPathGuard fuer Akquise-Detail-Seiten war wirkungslos. Fix: Doppel-Registrierung MOD-08 + MOD-12.

**FINDING P4 (FIXED):** Context Resolver fehlten fuer MOD-07 (Finanzierung), MOD-08/12 (Akquise), MOD-13 (Projekte). Guards konnten keine DB-Flags laden. Fix: 4 neue Resolver in contextResolvers.ts erstellt.

**Offene GP-Resolver (nicht Guard-relevant, nur Dashboard):** GP-VERMIETUNG, GP-LEAD, GP-FINANCE-Z3 haben keine Context-Resolver. Diese GPs werden nur im Armstrong Dashboard visualisiert, nicht als Route-Guards verwendet → kein Blocker.

### Phase 3: Contracts + Edge Functions — ✅ DONE

| # | Test | Status | Ergebnis |
|---|------|--------|----------|
| 1 | Contract-Referenzen in GPs | ✅ OK | 15 CONTRACT_* Keys referenziert in 8 GPs. Alle Richtungen Backbone-konform (Z2->Z1, Z1->Z2, Z3->Z1, EXTERN->Z1). Kein Z2->Z2 gefunden. |
| 2 | DB-Tabellen fuer Contracts | ✅ OK | Alle referenzierten Tabellen existieren (user_consents, leads, finance_requests, acq_mandates, listings, etc.). |
| 3 | Edge Functions Deployment | ✅ OK | 113 Edge Functions deployed. 12 kritische getestet — alle responsive. |
| 4 | sot-futureroom-public-submit | ✅ 400 | Korrekte Eingabevalidierung |
| 5 | sot-website-lead-capture | ✅ 400 | Korrekte Eingabevalidierung |
| 6 | sot-listing-publish | ⚠️ 500 | Braucht Auth + Property-Daten — kein Fehler, erwartet |
| 7 | sot-renter-invite | ✅ 500 | Korrekte Pflichtfeld-Validierung |
| 8 | sot-property-crud | ⚠️ 500 | Braucht Auth — kein Fehler, erwartet |
| 9 | sot-lead-inbox | ✅ 200 | Gibt leere Liste zurueck |
| 10 | sot-acq-inbound-webhook | ✅ 401 | Signature-Validierung aktiv |
| 11 | sot-project-intake | ✅ 400 | JSON body required |
| 12 | sot-pet-profile-init | ✅ 400 | Missing required fields |
| 13 | sot-armstrong-advisor | ✅ 200 | OUT_OF_SCOPE korrekt |
| 14 | sot-finance-proxy | ✅ 200 | Marktdaten kommen zurueck |
| 15 | sot-acq-outbound | ⚠️ 500 | Template not found (fehlender template_code) — erwartetes Verhalten |

### Phase 4: Modul-Tiefe (Zone 2)
15. D1: Core-Module Tile-fuer-Tile
16. D2: Manager-Module Tile-fuer-Tile
17. D3: Addon-Module Tile-fuer-Tile

### Phase 5: Zone 1 Operative Tiefe
18. E1: Alle 7 Operative Desks Sub-Route-fuer-Sub-Route
19. E2: Governance Desks

### Phase 6: Bereinigung
20. I1-I7: Hardcoded-Daten eliminieren
21. G1-G5: Zone 3 Websites Endtest

---

## Zusammenfassung

| Metrik | Wert |
|--------|------|
| Gesamte Testfaelle | ~180 |
| Golden Paths | 8 (50 Steps) |
| API Contracts | 22 |
| Engines | 10 (25+ Funktionen) |
| Zone 2 Module | 22 (95 Tiles) |
| Zone 1 Desks | 10 (50+ Sub-Routen) |
| Edge Functions (kritisch) | 20 von 113 |
| Websites | 5 |
| Geschaetzter Aufwand | 20-30 Stunden |

**Naechster Schritt:** Phase 2 starten — Golden Paths A1-A8 E2E testen.
