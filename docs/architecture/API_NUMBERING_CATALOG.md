# API NUMBERING CATALOG

**Version:** v1.1  
**Datum:** 2026-01-27

---

## Nummernkreise

| Range | Bereich | Status |
|-------|---------|--------|
| API-001..099 | Backbone (Auth, Profiles, Core) | RESERVED |
| API-100..199 | Zone 1 (Admin) | SPEC |
| API-200..299 | MOD-06 Verkauf | SPEC |
| API-300..399 | MOD-09 Vertriebspartner | SPEC |
| API-400..499 | MOD-08 Investment-Suche | SPEC |
| API-500..599 | MOD-10 Leadgenerierung | SPEC |
| API-600..699 | MOD-07 Finanzierung | SPEC |
| API-700..799 | MOD-04 Immobilien | SPEC |
| API-800..899 | MOD-05 MSV | SPEC |
| INTERNAL-001..099 | Interne Edge Functions | ACTIVE |

---

## Edge Functions (Implementiert)

| API-ID | Edge Function | Modul | Bereich | Status |
|--------|---------------|-------|---------|--------|
| API-701 | sot-property-crud | MOD-04 | Immobilien CRUD | ACTIVE |
| API-801 | sot-msv-reminder-check | MOD-05 | Mahnwesen | ACTIVE |
| API-802 | sot-msv-rent-report | MOD-05 | Mietreports | ACTIVE |
| API-803 | sot-listing-publish | MOD-05 | Exposé Publishing | ACTIVE |
| API-804 | sot-lead-inbox | MOD-10 | Lead-Verarbeitung | ACTIVE |
| INTERNAL-001 | sot-letter-generate | MOD-02 | KI-Briefgenerator | ACTIVE |
| INTERNAL-002 | sot-expose-description | MOD-04 | KI-Beschreibungen | ACTIVE |
| INTERNAL-003 | sot-dms-upload-url | MOD-03 | DMS Upload | ACTIVE |
| INTERNAL-004 | sot-dms-download-url | MOD-03 | DMS Download | ACTIVE |
| INTERNAL-005 | sot-investment-engine | MOD-08 | Investment-Berechnung | ACTIVE |
| INTERNAL-006 | sot-armstrong-advisor | MOD-02 | KI-Assistant | ACTIVE |
| INTERNAL-007 | sot-document-parser | MOD-03 | KI-Dokument-Parsing | ACTIVE |
| INTERNAL-008 | sot-renovation-scope-ai | MOD-04 | KI-Leistungsanalyse | ACTIVE |
| INTERNAL-009 | sot-places-search | MOD-04 | Google Places Suche | ACTIVE |
| INTERNAL-010 | sot-renovation-outbound | MOD-04 | Ausschreibungs-Versand | ACTIVE |
| INTERNAL-011 | sot-renovation-inbound-webhook | MOD-04 | Inbound E-Mail-Matching | ACTIVE |

---

## API-001..099 — Backbone

| API-ID | Method | Endpoint | Auth | Description |
|--------|--------|----------|------|-------------|
| API-001 | POST | `/auth/signup` | Public | User Registration |
| API-002 | POST | `/auth/login` | Public | User Login |
| API-003 | POST | `/auth/logout` | User | Logout |
| API-004 | GET | `/auth/session` | User | Get Session |
| API-010 | GET | `/profiles/me` | User | Get Own Profile |
| API-011 | PATCH | `/profiles/me` | User | Update Profile |
| API-020 | GET | `/organizations` | User | List User's Orgs |
| API-021 | POST | `/organizations` | User | Create Org |
| API-022 | GET | `/organizations/:id` | User | Get Org Detail |
| API-030 | GET | `/contacts` | User | List Contacts |
| API-031 | POST | `/contacts` | User | Create Contact |
| API-032 | GET | `/contacts/:id` | User | Get Contact |
| API-033 | PATCH | `/contacts/:id` | User | Update Contact |

---

## API-100..199 — Zone 1 Admin

| API-ID | Method | Endpoint | Auth | Description |
|--------|--------|----------|------|-------------|
| API-100 | GET | `/admin/organizations` | platform_admin | List All Orgs |
| API-101 | GET | `/admin/organizations/:id` | platform_admin | Org Detail |
| API-102 | PATCH | `/admin/organizations/:id` | platform_admin | Update Org |
| API-110 | GET | `/admin/users` | platform_admin | List All Users |
| API-111 | GET | `/admin/users/:id` | platform_admin | User Detail |
| API-120 | GET | `/admin/tiles` | platform_admin | Tile Catalog |
| API-121 | POST | `/admin/tiles/activate` | platform_admin | Activate Tile |
| API-130 | GET | `/admin/integrations` | platform_admin | Integration Registry |
| API-131 | POST | `/admin/integrations` | platform_admin | Register Integration |
| API-140 | GET | `/admin/oversight` | platform_admin | Oversight Dashboard |
| API-150 | GET | `/admin/audit` | platform_admin | Audit Log |
| API-160 | GET | `/admin/leads/pool` | platform_admin | Lead Pool |
| API-161 | POST | `/admin/leads/pool/:id/assign` | platform_admin | Assign Lead |
| API-170 | GET | `/admin/partners/verification` | platform_admin | Partner Verification Queue |
| API-171 | POST | `/admin/partners/:id/verify` | platform_admin | Verify Partner |
| API-180 | GET | `/admin/commissions` | platform_admin | Commission Approvals |
| API-181 | POST | `/admin/commissions/:id/approve` | platform_admin | Approve Commission |

---

## API-200..299 — MOD-06 Verkauf

| API-ID | Method | Endpoint | Auth | Consent | Description |
|--------|--------|----------|------|---------|-------------|
| API-200 | GET | `/verkauf/listings` | org_admin | — | List Listings |
| API-201 | POST | `/verkauf/listings` | org_admin | SALES_MANDATE | Create Listing |
| API-202 | GET | `/verkauf/listings/:id` | org_admin | — | Listing Detail |
| API-203 | PATCH | `/verkauf/listings/:id` | org_admin | — | Update Listing |
| API-204 | POST | `/verkauf/listings/:id/activate` | org_admin | SALES_MANDATE | Activate Listing |
| API-210 | POST | `/verkauf/listings/:id/publish/kaufy` | org_admin | — | Publish to Kaufy |
| API-211 | POST | `/verkauf/listings/:id/publish/scout24` | org_admin | SCOUT24_CREDITS | Publish to Scout24 |
| API-212 | POST | `/verkauf/listings/:id/publish/kleinanzeigen` | org_admin | — | Link Kleinanzeigen |
| API-213 | POST | `/verkauf/listings/:id/publish/partner` | org_admin | PARTNER_RELEASE, SYSTEM_SUCCESS_FEE_2000 | Release to Partners |
| API-220 | GET | `/verkauf/inquiries` | org_admin | — | List Inquiries |
| API-221 | POST | `/verkauf/inquiries` | org_admin | — | Create Inquiry |
| API-222 | GET | `/verkauf/inquiries/:id` | org_admin | — | Inquiry Detail |
| API-230 | GET | `/verkauf/reservations` | org_admin | — | List Reservations |
| API-231 | POST | `/verkauf/reservations` | org_admin | — | Create Reservation |
| API-232 | PATCH | `/verkauf/reservations/:id` | org_admin | — | Update Reservation |
| API-240 | GET | `/verkauf/transactions` | org_admin | — | List Transactions |
| API-241 | POST | `/verkauf/transactions` | org_admin | — | Create Transaction |

---

## API-300..399 — MOD-09 Vertriebspartner

| API-ID | Method | Endpoint | Auth | Description |
|--------|--------|----------|------|-------------|
| API-300 | GET | `/partner/dashboard` | sales_partner | Partner Dashboard |
| API-310 | GET | `/partner/catalog` | sales_partner | Object Catalog |
| API-311 | GET | `/partner/catalog/:id` | sales_partner | Listing Detail |
| API-320 | GET | `/partner/selections` | sales_partner | My Selections |
| API-321 | POST | `/partner/selections` | sales_partner | Add to Selection |
| API-322 | DELETE | `/partner/selections/:id` | sales_partner | Remove Selection |
| API-330 | GET | `/partner/advisory` | sales_partner | Advisory Dashboard |
| API-331 | POST | `/partner/advisory/simulate` | sales_partner | Run Simulation |
| API-332 | POST | `/partner/advisory/export` | sales_partner | Export PDF |
| API-340 | GET | `/partner/network` | sales_partner | Team/Network |
| API-341 | GET | `/partner/commissions` | sales_partner | My Commissions |
| API-350 | GET | `/partner/verification` | sales_partner | Verification Status |
| API-351 | POST | `/partner/verification/submit` | sales_partner | Submit Documents |

---

## API-400..499 — MOD-08 Investment-Suche

| API-ID | Method | Endpoint | Auth | Description |
|--------|--------|----------|------|-------------|
| API-400 | GET | `/investments/dashboard` | User | Investment Dashboard |
| API-410 | GET | `/investments/search` | User | Search Listings |
| API-411 | GET | `/investments/search/:id` | User | Listing Detail |
| API-420 | GET | `/investments/favorites` | User | My Favorites |
| API-421 | POST | `/investments/favorites` | User | Add Favorite |
| API-422 | DELETE | `/investments/favorites/:id` | User | Remove Favorite |
| API-423 | POST | `/investments/favorites/import` | User | Import from Kaufy |
| API-430 | GET | `/investments/mandate` | User | Mandate Status |
| API-431 | POST | `/investments/mandate` | User | Create Mandate |
| API-440 | GET | `/investments/simulation` | User | Portfolio Simulation |
| API-441 | POST | `/investments/simulation/run` | User | Run Simulation |
| API-450 | GET | `/investments/scraper/jobs` | org_admin | Scraper Jobs |
| API-451 | POST | `/investments/scraper/jobs` | org_admin | Create Scraper Job |

---

## API-500..599 — MOD-10 Leadgenerierung

| API-ID | Method | Endpoint | Auth | Description |
|--------|--------|----------|------|-------------|
| API-500 | GET | `/leads` | sales_partner | All Leads |
| API-501 | GET | `/leads/:id` | sales_partner | Lead Detail |
| API-502 | POST | `/leads/:id/qualify` | sales_partner | Qualify Lead |
| API-503 | POST | `/leads/:id/convert` | sales_partner | Convert to Deal |
| API-510 | GET | `/leads/inbox` | sales_partner | Pool Leads |
| API-511 | POST | `/leads/inbox/:id/accept` | sales_partner | Accept Lead |
| API-512 | POST | `/leads/inbox/:id/reject` | sales_partner | Reject Lead |
| API-520 | GET | `/leads/deals` | sales_partner | All Deals |
| API-521 | POST | `/leads/deals` | sales_partner | Create Deal |
| API-522 | GET | `/leads/deals/:id` | sales_partner | Deal Detail |
| API-523 | POST | `/leads/deals/:id/stage` | sales_partner | Change Stage |
| API-524 | POST | `/leads/deals/:id/win` | sales_partner | Win Deal |
| API-525 | POST | `/leads/deals/:id/lose` | sales_partner | Lose Deal |
| API-540 | GET | `/leads/campaigns` | sales_partner | My Campaigns |
| API-541 | POST | `/leads/campaigns` | sales_partner | Create Campaign |
| API-542 | GET | `/leads/campaigns/:id` | sales_partner | Campaign Detail |
| API-543 | POST | `/leads/campaigns/:id/pause` | sales_partner | Pause Campaign |

---

## API-600..699 — MOD-07 Finanzierung (Datenerfassung)

> **WICHTIG:** MOD-07 ist NUR für Datenerfassung zuständig. Bank-Übergabe erfolgt in MOD-11!

| API-ID | Method | Endpoint | Auth | Description |
|--------|--------|----------|------|-------------|
| API-600 | GET | `/financing/self-disclosure` | User | Get Selbstauskunft |
| API-601 | POST | `/financing/self-disclosure` | User | Create Selbstauskunft |
| API-602 | PATCH | `/financing/self-disclosure/:id` | User | Update Selbstauskunft |
| API-603 | GET | `/financing/self-disclosure/:id/completion` | User | Completion Score |
| API-610 | GET | `/financing/requests` | User | List Anfragen |
| API-611 | POST | `/financing/requests` | User | Create Anfrage |
| API-612 | GET | `/financing/requests/:id` | User | Anfrage Detail |
| API-613 | PATCH | `/financing/requests/:id` | User | Update Anfrage |
| API-614 | POST | `/financing/requests/:id/submit` | User | Einreichung → Zone 1 |
| API-620 | GET | `/financing/liabilities` | User | List Verbindlichkeiten |
| API-621 | POST | `/financing/liabilities` | User | Add Verbindlichkeit |
| API-622 | PATCH | `/financing/liabilities/:id` | User | Update Verbindlichkeit |
| API-623 | DELETE | `/financing/liabilities/:id` | User | Delete Verbindlichkeit |
| API-630 | GET | `/financing/documents/checklist` | User | Document Checklist |
| API-631 | POST | `/financing/documents/link` | User | Link DMS Doc |

---

## API-1100..1199 — MOD-11 Finanzierungsmanager (Bank-Übergabe)

> **WICHTIG:** Europace/BaufiSmart-API wird AUSSCHLIESSLICH hier implementiert!

| API-ID | Method | Endpoint | Auth | Description |
|--------|--------|----------|------|-------------|
| API-1100 | GET | `/manager/cases` | finance_manager | List zugewiesene Fälle |
| API-1101 | GET | `/manager/cases/:id` | finance_manager | Fall-Detail inkl. Selbstauskunft |
| API-1102 | PATCH | `/manager/cases/:id` | finance_manager | Fall aktualisieren |
| API-1103 | POST | `/manager/cases/:id/accept` | finance_manager | Fall annehmen |
| API-1110 | POST | `/manager/cases/:id/export/email` | finance_manager | Export als E-Mail + Datenraum-Link |
| API-1111 | POST | `/manager/cases/:id/export/europace` | finance_manager | Export via Europace API |
| API-1112 | GET | `/manager/cases/:id/export/status` | finance_manager | Export-Status prüfen |
| API-1120 | GET | `/manager/banks` | finance_manager | Bankkontakte abrufen |
| API-1121 | POST | `/manager/banks` | finance_manager | Bankkontakt hinzufügen |
| API-1130 | POST | `/manager/cases/:id/submit` | finance_manager | Bei Bank einreichen |
| API-1131 | POST | `/manager/cases/:id/status` | finance_manager | Status-Update von Bank |

---

## API-700..799 — MOD-04 Immobilien

| API-ID | Method | Endpoint | Auth | Description |
|--------|--------|----------|------|-------------|
| API-700 | GET | `/properties` | User | List Properties |
| API-701 | POST | `/properties` | org_admin | Create Property |
| API-702 | GET | `/properties/:id` | User | Property Detail |
| API-703 | PATCH | `/properties/:id` | org_admin | Update Property |
| API-710 | GET | `/properties/:id/units` | User | List Units |
| API-711 | POST | `/properties/:id/units` | org_admin | Create Unit |
| API-712 | PATCH | `/units/:id` | org_admin | Update Unit |
| API-720 | GET | `/properties/:id/financing` | User | Property Financing |
| API-721 | POST | `/properties/:id/financing` | org_admin | Add Financing |
| API-730 | GET | `/properties/:id/documents` | User | Property Documents |
| API-740 | GET | `/service-cases` | User | List Service Cases |
| API-741 | POST | `/service-cases` | org_admin | Create Service Case |
| API-742 | GET | `/service-cases/:id` | User | Service Case Detail |
| API-743 | PATCH | `/service-cases/:id` | org_admin | Update Service Case |
| API-744 | GET | `/service-cases/:id/providers` | User | List Providers |
| API-745 | POST | `/service-cases/:id/providers` | org_admin | Add Provider |
| API-746 | GET | `/service-cases/:id/inbound` | User | List Inbound Messages |
| API-747 | POST | `/service-cases/:id/award` | org_admin | Award Provider |

---

## API-800..899 — MOD-05 MSV

| API-ID | Method | Endpoint | Auth | Description |
|--------|--------|----------|------|-------------|
| API-800 | GET | `/msv/dashboard` | User | MSV Dashboard |
| API-810 | GET | `/msv/leases` | User | List Leases |
| API-811 | POST | `/msv/leases` | org_admin | Create Lease |
| API-812 | GET | `/msv/leases/:id` | User | Lease Detail |
| API-813 | PATCH | `/msv/leases/:id` | org_admin | Update Lease |
| API-820 | GET | `/msv/payments` | User | List Payments |
| API-821 | POST | `/msv/payments` | org_admin | Record Payment |
| API-830 | GET | `/msv/reminders` | User | List Reminders |
| API-831 | POST | `/msv/reminders` | org_admin | Create Reminder |
| API-840 | GET | `/msv/enrollments` | User | MSV Enrollments |
| API-841 | POST | `/msv/enrollments` | org_admin | Enroll Property |
| API-850 | POST | `/msv/invites` | org_admin | Invite Renter (Miety) |

---

*Dieses Dokument ist der verbindliche API-Katalog.*
