

# Datenbank-Index-Audit: Vollstaendiger Plan mit Risikoanalyse

---

## 1. Systemuebersicht (Ist-Zustand)

### Datenbank-Fakten
- **159 Tabellen** insgesamt im System
- **99 Tabellen** mit `tenant_id` (Mandantenfaehigkeit)
- **38 Tabellen** davon OHNE Index auf `tenant_id`
- **61 Tabellen** bereits korrekt indexiert

### Aktuelle Datenmengen (Entwicklungs-Account)
| Tabelle | Zeilen |
|---------|--------|
| storage_nodes | 97 |
| documents | 23 |
| mail_messages | 8 |
| contacts | 5 |
| listings | 2 |
| properties | 1 |
| units | 1 |
| profiles | 1 |
| organizations | 1 |
| leads | 0 |
| calendar_events | 0 |
| commissions | 0 |
| ad_campaigns | 0 |

Die Datenmengen sind minimal. Wir sind in der Entwicklungsphase.

---

## 2. Was genau wird gemacht?

### Nur eine Sache: Datenbank-Indizes hinzufuegen

Ein Index ist wie ein **Stichwortverzeichnis in einem Buch**. Ohne Index muss die Datenbank jede Zeile durchlesen, um eine Abfrage zu beantworten. Mit Index springt sie direkt zur richtigen Stelle.

Die Migration besteht aus **reinen `CREATE INDEX IF NOT EXISTS` Befehlen**. Das bedeutet:

- Es werden **keine Tabellen geaendert**
- Es werden **keine Spalten hinzugefuegt oder entfernt**
- Es werden **keine Daten veraendert**
- Es wird **kein Code geaendert**
- Es werden **keine Routen geaendert**
- Es wird **kein Manifest geaendert**

### Konkret: 3 Bloecke

**Block 1 — 38 tenant_id Indizes**
Fuer jede der 38 Tabellen ohne tenant_id-Index wird genau ein Befehl ausgefuehrt:
```sql
CREATE INDEX IF NOT EXISTS idx_[tabellenname]_tenant
ON public.[tabellenname] USING btree (tenant_id);
```

Betroffene Tabellen:
ad_campaigns, applicant_liabilities, cars_claims, cars_financing, cars_insurances, cars_logbook_connections, cars_offers, cars_trips, context_members, credibility_flags, dev_project_documents, dev_project_reservations, dev_project_units, document_checklist_items, document_links, finance_documents, landlord_contexts, lead_activities, listing_activities, listing_inquiries, listing_partner_terms, listing_publications, msv_communication_prefs, msv_enrollments, msv_readiness_items, msv_templates, property_valuations, pv_plants, rent_payments, rent_reminders, reservations, sale_transactions, scraper_jobs, scraper_results, self_disclosures, service_case_offers, service_case_outbound, valuation_credits

**Block 2 — ~25 Foreign-Key Indizes**
Fuer die wichtigsten FK-Spalten, die in JOINs verwendet werden:
```sql
CREATE INDEX IF NOT EXISTS idx_[tabelle]_[spalte]
ON public.[tabelle] USING btree ([spalte]);
```
Beispiele: `documents.uploaded_by`, `calendar_events.contact_id`, `document_links.unit_id`, `mail_messages.mail_account_id`, etc.

**Block 3 — ~10 Composite Indizes**
Fuer haeufige Abfragemuster wie "alle Dokumente eines Tenants sortiert nach Erstelldatum":
```sql
CREATE INDEX IF NOT EXISTS idx_documents_tenant_created
ON public.documents USING btree (tenant_id, created_at);
```

---

## 3. Risikoanalyse

### Risiko fuer die jetzige Programmierung: KEINS

| Risikokategorie | Bewertung | Erklaerung |
|-----------------|-----------|------------|
| **Datenverlust** | Null | Indizes aendern keine Daten, sie erstellen nur ein Verzeichnis |
| **Routen-Verlust** | Null | Indizes haben keinen Einfluss auf Frontend-Routing |
| **Code-Aenderung noetig** | Nein | Kein einziger Codeblock in src/ wird angefasst |
| **Manifest-Aenderung** | Nein | Action-Manifeste und Module bleiben unberuehrt |
| **Repository-Aenderung** | Nein | Nur eine DB-Migration, kein Git-relevanter Code |
| **RLS-Policies** | Unbeeinflusst | Indizes aendern keine Zugriffsregeln |
| **Bestehende Queries** | Schneller | Alle existierenden Abfragen profitieren, keine bricht |
| **Downtime** | Keine | Bei den aktuellen Datenmengen unter 1 Sekunde Ausfuehrung |

### Warum ist das risikofrei?

1. **`IF NOT EXISTS`**: Wenn ein Index bereits existiert, wird er uebersprungen — kein Fehler
2. **Additiv**: Indizes fuegen etwas HINZU, sie entfernen nichts
3. **Transparent fuer Code**: Der Anwendungscode weiss nichts von Indizes. Die Datenbank nutzt sie automatisch
4. **Reversibel**: Jeder Index kann jederzeit mit `DROP INDEX` entfernt werden, falls noetig (wird aber nie noetig sein)

### Einziger theoretischer Nachteil
Indizes brauchen minimalen Speicherplatz und machen INSERT/UPDATE Operationen marginal langsamer (Mikrosekunden), weil der Index mitgepflegt werden muss. Bei euren Datenmengen ist das unmessbar.

---

## 4. Moduluebersicht und Auswirkung

### Zone 2 — Portal (21 Module)

| Nr | Modul | Seite | Betroffene Tabellen | Auswirkung |
|----|-------|-------|---------------------|------------|
| MOD_00 | Dashboard | PortalDashboard | Diverse Aggregationen | Schnellere Counts |
| MOD_01 | Immobilien | ImmobilienPage | properties, units, document_links | `document_links` bekommt Index |
| MOD_02 | Finanzierung | FinanzierungPage | finance_documents, applicant_liabilities, document_checklist_items, self_disclosures | 4 Tabellen bekommen Index |
| MOD_03 | DMS | DMSPage | documents, storage_nodes, document_links | `document_links` bekommt Index |
| MOD_04 | Stammdaten | StammdatenPage | contacts, profiles | Bereits indexiert |
| MOD_05 | Verkauf | VerkaufPage | listings, listing_activities, listing_inquiries, listing_publications, listing_partner_terms, reservations, sale_transactions | 7 Tabellen bekommen Index |
| MOD_06 | MSV | MSVPage | landlord_contexts, context_members, msv_enrollments, msv_readiness_items, msv_templates, msv_communication_prefs, rent_payments, rent_reminders | 8 Tabellen bekommen Index |
| MOD_07 | Leads | LeadsPage | leads, lead_activities, ad_campaigns | 2 Tabellen bekommen Index |
| MOD_08 | Office | OfficePage | calendar_events, mail_messages | Bereits indexiert |
| MOD_09 | Investments | InvestmentsPage | scraper_jobs, scraper_results | 2 Tabellen bekommen Index |
| MOD_10 | Vertriebspartner | VertriebspartnerPage | commissions, contacts | Bereits indexiert |
| MOD_11 | Cars | CarsPage | cars_claims, cars_financing, cars_insurances, cars_logbook_connections, cars_offers, cars_trips | 6 Tabellen bekommen Index |
| MOD_12 | Akquise-Manager | AkquiseManagerPage | acq_mandates, acq_offers | Bereits indexiert |
| MOD_13 | Projekte | ProjektePage | dev_projects, dev_project_units, dev_project_documents, dev_project_reservations | 3 Tabellen bekommen Index |
| MOD_14 | Photovoltaik | PhotovoltaikPage | pv_plants | 1 Tabelle bekommt Index |
| MOD_15 | Finanzierungsmanager | FinanzierungsmanagerPage | finance_documents | Bereits durch MOD_02 abgedeckt |
| MOD_16 | Services | ServicesPage | service_case_offers, service_case_outbound | 2 Tabellen bekommen Index |
| MOD_17 | Communication Pro | CommunicationProPage | mail_messages | Bereits indexiert |
| MOD_18 | Finanzanalyse | FinanzanalysePage | bank_transactions | Bereits indexiert |
| MOD_19 | Fortbildung | FortbildungPage | Keine DB-Tabellen betroffen | Kein Effekt |
| MOD_20 | Miety Portal | MietyPortalPage | leases, tenants | Bereits indexiert |

### Zone 1 — Admin

| Bereich | Betroffene Tabellen | Auswirkung |
|---------|---------------------|------------|
| Armstrong Console | armstrong_action_runs, armstrong_knowledge_items | Bereits indexiert |
| Audit | audit_events, audit_reports | Bereits indexiert |
| Organizations | organizations, profiles | Bereits indexiert |
| Acquiary (CRM) | admin_contact_tags, admin_email_threads | Bereits indexiert |
| Lead Pool | leads, lead_assignments | Bereits indexiert |

**Ergebnis Zone 1:** Alle Admin-Tabellen sind bereits korrekt indexiert. Kein Handlungsbedarf.

---

## 5. Was muss NICHT geaendert werden

| Bereich | Aenderung noetig? |
|---------|-------------------|
| Frontend-Code (src/) | Nein |
| Routen (React Router) | Nein |
| Action-Manifeste | Nein |
| Edge Functions | Nein |
| RLS Policies | Nein |
| Storage Buckets | Nein |
| Auth-Konfiguration | Nein |
| package.json | Nein |
| Git Repository | Nur die automatische Migration-Datei |

---

## 6. Technische Umsetzung

Eine einzige SQL-Migration mit ca. 75 `CREATE INDEX IF NOT EXISTS` Statements. Geschaetzte Ausfuehrungszeit: unter 1 Sekunde.

Die Migration wird ueber das Datenbank-Migrationstool ausgefuehrt. Ihr muesst die Migration einmal genehmigen, dann wird sie automatisch angewendet.

---

## 7. Zusammenfassung

- **Risiko:** Null — rein additive Aenderung, kein Code betroffen
- **Aufwand:** 1 Migration, 1 Genehmigung
- **Effekt:** 38 Tabellen werden fuer Skalierung vorbereitet
- **Routen:** Bleiben alle erhalten, keine Aenderung
- **Manifest:** Bleibt unveraendert
- **Repository:** Nur die automatische Migrations-Datei wird hinzugefuegt
- **Weiterer Entwicklungsplan:** Wird durch diese Aenderung nicht beeinflusst. Alle geplanten Module und Features funktionieren danach genauso wie vorher — nur schneller bei wachsenden Daten.

