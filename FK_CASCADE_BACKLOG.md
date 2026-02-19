# FK Cascade Cleanup — Backlog

> Ziel: Alle FK-Constraints, die Demo-Cleanup (und regulaeres Loeschen) blockieren,
> auf ON DELETE CASCADE setzen, wo der Child-Record dem Parent "gehoert".
> Referenzen (z.B. contact_id auf leads) bleiben NO ACTION oder werden SET NULL.

## Legende

- ✅ = Bereits CASCADE
- 🔧 = Wird auf CASCADE gesetzt (diese Migration)
- ⚪ = Bleibt NO ACTION / SET NULL (bewusste Entscheidung)
- ⚠️ = RESTRICT → muss in Cleanup-Reihenfolge beachtet werden

---

## 1. Parent: `properties`

| Child-Tabelle | FK-Spalte | Aktuell | Ziel | Begruendung |
|---|---|---|---|---|
| units | property_id | CASCADE ✅ | — | OK |
| property_financing | property_id | CASCADE ✅ | — | OK |
| property_features | property_id | CASCADE ✅ | — | OK |
| property_valuations | property_id | CASCADE ✅ | — | OK |
| service_cases | property_id | CASCADE ✅ | — | OK |
| context_property_assignment | property_id | CASCADE ✅ | — | OK |
| meters | property_id | CASCADE ✅ | — | OK |
| postings | property_id | CASCADE ✅ | — | OK |
| nk_periods | property_id | CASCADE ✅ | — | OK |
| rental_listings | property_id | CASCADE ✅ | — | OK (eine der beiden FKs) |
| **listings** | property_id | NO ACTION | 🔧 CASCADE | Listing gehoert zu Property |
| **property_accounting** | property_id | NO ACTION | 🔧 CASCADE | Buchhaltung gehoert zu Property |
| **partner_pipelines** | property_id | NO ACTION | 🔧 CASCADE | Pipeline-Eintrag gehoert zu Property |
| **finance_packages** | property_id | NO ACTION | 🔧 CASCADE | Finanzpaket gehoert zu Property |
| **msv_enrollments** | property_id | NO ACTION | 🔧 CASCADE | Enrollment gehoert zu Property |
| **rental_listings** | property_id | NO ACTION | 🔧 CASCADE | Mietanzeige gehoert zu Property |
| **dev_project_units** | property_id | NO ACTION | 🔧 CASCADE | Projekteinheit gehoert zu Property |
| **calendar_events** | property_id | NO ACTION | 🔧 CASCADE | Termin gehoert zu Property |
| loans | property_id | SET NULL ⚪ | — | Kredit existiert unabhaengig |
| finance_requests | property_id | SET NULL ⚪ | — | Antrag existiert unabhaengig |
| inbound_items | assigned_property_id | SET NULL ⚪ | — | Posteingang nur zugeordnet |
| inbox_sort_containers | property_id | SET NULL ⚪ | — | Container nur zugeordnet |
| storage_nodes | property_id | SET NULL ⚪ | — | DMS-Knoten nur zugeordnet |

---

## 2. Parent: `listings` (Kind von properties)

| Child-Tabelle | FK-Spalte | Aktuell | Ziel | Begruendung |
|---|---|---|---|---|
| listing_views | listing_id | CASCADE ✅ | — | OK |
| partner_listing_selections | listing_id | CASCADE ✅ | — | OK |
| **listing_publications** | listing_id | NO ACTION | 🔧 CASCADE | Publikation gehoert zu Listing |
| **listing_activities** | listing_id | NO ACTION | 🔧 CASCADE | Aktivitaet gehoert zu Listing |
| **listing_inquiries** | listing_id | NO ACTION | 🔧 CASCADE | Anfrage gehoert zu Listing |
| **listing_partner_terms** | listing_id | NO ACTION | 🔧 CASCADE | Konditionen gehoeren zu Listing |
| **reservations** | listing_id | NO ACTION | 🔧 CASCADE | Reservierung gehoert zu Listing |
| **sale_transactions** | listing_id | NO ACTION | 🔧 CASCADE | Transaktion gehoert zu Listing |
| investment_favorites | listing_id | SET NULL ⚪ | — | Favorit bleibt als Referenz |

---

## 3. Parent: `rental_listings` (Kind von properties)

| Child-Tabelle | FK-Spalte | Aktuell | Ziel | Begruendung |
|---|---|---|---|---|
| rental_publications | rental_listing_id | CASCADE ✅ | — | OK |

---

## 4. Parent: `units` (Kind von properties → bereits CASCADE)

| Child-Tabelle | FK-Spalte | Aktuell | Ziel | Begruendung |
|---|---|---|---|---|
| leases | unit_id | CASCADE ✅ | — | OK (wird durch properties→units→leases kaskadiert) |

---

## 5. Parent: `leases` (Kind von units)

| Child-Tabelle | FK-Spalte | Aktuell | Ziel | Begruendung |
|---|---|---|---|---|
| renter_invites | lease_id | CASCADE ✅ | — | OK |
| **rent_payments** | lease_id | NO ACTION | 🔧 CASCADE | Zahlung gehoert zum Mietvertrag |
| **rent_reminders** | lease_id | NO ACTION | 🔧 CASCADE | Mahnung gehoert zum Mietvertrag |

---

## 6. Parent: `contacts`

| Child-Tabelle | FK-Spalte | Aktuell | Ziel | Begruendung |
|---|---|---|---|---|
| acq_outbound_messages | contact_id | CASCADE ✅ | — | OK |
| admin_contact_tags | contact_id | CASCADE ✅ | — | OK |
| admin_email_enrollments | contact_id | CASCADE ✅ | — | OK |
| customer_projects | contact_id | CASCADE ✅ | — | OK |
| user_contact_links | contact_id | CASCADE ✅ | — | OK |
| acq_inbound_messages | contact_id | SET NULL ⚪ | — | Nachricht bleibt bestehen |
| admin_email_threads | contact_id | SET NULL ⚪ | — | Thread bleibt bestehen |
| admin_inbound_emails | contact_id | SET NULL ⚪ | — | E-Mail bleibt bestehen |
| admin_outbound_emails | contact_id | SET NULL ⚪ | — | E-Mail bleibt bestehen |
| mail_campaign_recipients | contact_id | SET NULL ⚪ | — | Kampagne bleibt bestehen |
| inbound_items | assigned_contact_id | SET NULL ⚪ | — | Posteingang nur zugeordnet |
| **leases** | tenant_contact_id | RESTRICT ⚠️ | ⚠️ bleibt | Cleanup-Reihenfolge: leases VOR contacts |
| **renter_invites** | renter_contact_id | RESTRICT ⚠️ | ⚠️ bleibt | Cleanup-Reihenfolge: invites VOR contacts |
| **leads** | contact_id | NO ACTION | 🔧 SET NULL | Lead existiert unabhaengig |
| **calendar_events** | contact_id | NO ACTION | 🔧 SET NULL | Termin existiert unabhaengig |
| **commissions** | contact_id | NO ACTION | 🔧 SET NULL | Provision existiert unabhaengig |
| **contact_candidates** | imported_contact_id | NO ACTION | 🔧 SET NULL | Kandidat existiert unabhaengig |
| **contact_conversations** | contact_id | NO ACTION | 🔧 SET NULL | Verlauf existiert unabhaengig |
| **contact_staging** | merged_contact_id | NO ACTION | 🔧 SET NULL | Staging existiert unabhaengig |
| **dev_project_reservations** | buyer_contact_id | NO ACTION | 🔧 SET NULL | Reservierung existiert unabhaengig |
| **finance_packages** | contact_id | NO ACTION | 🔧 SET NULL | Paket existiert unabhaengig |
| **investment_profiles** | contact_id | NO ACTION | 🔧 SET NULL | Profil existiert unabhaengig |
| **listing_inquiries** | contact_id | NO ACTION | 🔧 SET NULL | Anfrage existiert unabhaengig |
| **nk_tenant_settlements** | renter_contact_id | NO ACTION | 🔧 SET NULL | Abrechnung existiert unabhaengig |
| **partner_deals** | contact_id | NO ACTION | 🔧 SET NULL | Deal existiert unabhaengig |
| **partner_pipelines** | contact_id | NO ACTION | 🔧 SET NULL | Pipeline existiert unabhaengig |
| **research_order_results** | imported_contact_id | NO ACTION | 🔧 SET NULL | Ergebnis existiert unabhaengig |
| **reservations** | buyer_contact_id | NO ACTION | 🔧 SET NULL | Reservierung existiert unabhaengig |
| **sale_transactions** | buyer_contact_id | NO ACTION | 🔧 SET NULL | Transaktion existiert unabhaengig |
| **service_case_offers** | contact_id | NO ACTION | 🔧 SET NULL | Angebot existiert unabhaengig |
| **service_case_outbound** | recipient_contact_id | NO ACTION | 🔧 SET NULL | Nachricht existiert unabhaengig |
| **service_cases** | awarded_to_contact_id | NO ACTION | 🔧 SET NULL | Fall existiert unabhaengig |
| **letter_drafts** | recipient_contact_id | NO ACTION | 🔧 SET NULL | Brief existiert unabhaengig |
| **acq_offers** | source_contact_id | NO ACTION | 🔧 SET NULL | Angebot existiert unabhaengig |

---

## 7. Parent: `msv_bank_accounts`

| Child-Tabelle | FK-Spalte | Aktuell | Ziel | Begruendung |
|---|---|---|---|---|
| bank_account_meta | account_id | CASCADE ✅ | — | OK |
| **bank_transactions** | account_id | ? | 🔧 CASCADE | Transaktion gehoert zum Konto |
| **leases** | linked_bank_account_id | NO ACTION | 🔧 SET NULL | Lease existiert unabhaengig |

---

## Cleanup-Reihenfolge nach Migration

Nach Anwendung der CASCADE-Migration vereinfacht sich die Cleanup-Reihenfolge:

```
1. bank_transactions      (CASCADE von msv_bank_accounts, aber sicherheitshalber)
2. rent_payments           (CASCADE von leases, aber sicherheitshalber)
3. leases                  (CASCADE von units, RESTRICT auf contacts → vor contacts!)
4. units                   (CASCADE von properties)
5. msv_bank_accounts       (standalone)
6. properties              (kaskadiert: listings→publications, accounting, etc.)
7. contacts                (SET NULL auf alle Referenzen)
```

---

## Reparatur-Log

| Datum | Aenderung | Status |
|---|---|---|
| 2026-02-19 | FK-Analyse aller 6 Demo-Parent-Tabellen | ✅ |
| 2026-02-19 | Migration: 10x CASCADE (properties), 6x CASCADE (listings), 2x CASCADE (leases), 1x SET NULL (bank_accounts→leases), 20x SET NULL (contacts) | ✅ |
| 2026-02-19 | Cleanup-Code vereinfacht: keine manuellen Child-Deletes mehr noetig | ✅ |
| 2026-02-19 | Golden Tenant Bereinigung: 3 alte Leases, 3 Units, 3 Loans, 5 Contacts geloescht | ✅ |
| 2026-02-19 | Fremde Tenants entfernt: test-beta-check + marchner (inkl. storage_nodes, data_event_ledger) | ✅ |
| 2026-02-19 | test_data_registry geleert (wird bei naechstem Seed neu befuellt) | ✅ |
| 2026-02-19 | Auth-Users (test-beta-check, marchner) muessen manuell in Cloud View entfernt werden | ⚠️ |
