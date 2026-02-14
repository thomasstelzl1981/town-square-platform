# Pop Enterprise-Readiness Audit — System of a Town

## Gesamtbewertung: 7.5 / 10 (Gut, aber Hardening noetig vor Go-Live)

Das System ist architektonisch solide aufgestellt. Die Zone-Isolation, Golden Path Engine, Tenant-Modell und DSGVO-Grundlagen sind vorhanden. Fuer den produktiven Betrieb mit tausenden Nutzern gibt es jedoch konkrete Luecken, die geschlossen werden muessen.

---

## 1. Was bereits Enterprise-Ready ist (Staerken)


| Bereich            | Status      | Details                                                                                            |
| ------------------ | ----------- | -------------------------------------------------------------------------------------------------- |
| Multi-Tenancy      | Stark       | `get_user_tenant_id()` SECURITY DEFINER, alle 232 Tabellen mit RLS aktiv, 0 Tabellen ohne RLS      |
| Zonen-Isolation    | Stark       | Z1/Z2/Z3 sauber getrennt, Backbone-Regel in GP Engine erzwungen                                    |
| Golden Path Engine | Stark       | 7 Paths registriert, Camunda-ready Typen (task_kind, correlation_keys, fail_states)                |
| Status-Integrität  | Stark       | 4 DB-Trigger validieren State-Machines (finance_requests, acq_mandates, dev_projects, leases)      |
| DSGVO Grundlagen   | Stark       | `deleted_at` auf PII-Tabellen, `consent_templates` versioniert, PII-Audit-Trigger aktiv            |
| Event Ledger       | Stark       | `data_event_ledger` mit gehärtetem `log_data_event` RPC, Whitelist-Enforcement, 180-Tage Retention |
| Dev Validator      | Stark       | Validiert Route-Patterns, Ledger-Events, ContractRefs und Fail-States bei App-Start                |
| Lazy Loading       | Stark       | Alle Module via `React.lazy()`, Admin + Portal + Websites code-gesplittet                          |
| Query Caching      | Stark       | Globaler `staleTime: 5min`, `gcTime: 10min`, kein refetchOnWindowFocus                             |
| Sandbox Reset      | Stark       | `reset_sandbox_tenant()` + `sot-tenant-storage-reset` Edge Function mit Gates                      |
| Edge Functions     | Umfangreich | 99 Functions deployed, Rate-Limit-Handling in AI-Funktionen implementiert                          |
| Indexing           | Grundlage   | 977 Indexes vorhanden, `check_missing_indexes()` Funktion existiert                                |


---

## 2. Kritische Luecken fuer Enterprise-Betrieb

### P1: 141 fehlende Tenant-ID Indexes

**Problem:** `check_missing_indexes()` meldet 141 Tabellen ohne Index auf `tenant_id`. Bei tausenden Tenants fuehrt das zu Full-Table-Scans bei jeder RLS-Policy-Pruefung.

**Betroffene Bereiche (Auszug):** social_topics, social_drafts, social_metrics, inbound_mailboxes, applicant_property_assets, finance_submission_logs, miety_homes, miety_contracts, consumer_loan_cases, research_results u.v.m.

**Impact:** Performance-Degradation ab ~100 Tenants, potentiell unbenutzbar ab ~1000 Tenants.

**Fix:** Eine einzelne Migration, die alle 141 fehlenden Indexes erstellt.

---

### P1: SECURITY DEFINER Views (Linter-Fehler)

**Problem:** 2 Views (`v_public_listings`, `v_public_knowledge`) verwenden `SECURITY DEFINER`, was bedeutet, dass RLS des View-Erstellers statt des abfragenden Users gilt. Der Supabase-Linter meldet dies als ERROR.

**Fix:** Views auf `security_invoker = on` umstellen (bereits in Spec als Regel K7 dokumentiert, aber nicht umgesetzt).

---

### P1: Auth-Hardening (OTP Expiry + Leaked Password Protection)

**Problem:** Der Supabase-Linter meldet:

- OTP Expiry ist zu lang (ueber empfohlenem Threshold)
- Leaked Password Protection ist deaktiviert

**Fix:** Auth-Konfiguration anpassen (OTP auf max. 300 Sekunden, Leaked Password Protection aktivieren).

---

### P2: Kein automatisches Retention Cleanup (Cron)

**Problem:** `sot-ledger-retention` existiert als Edge Function, wird aber nur manuell aufgerufen. Es gibt keinen Cron-Job der automatisch alte Ledger-Eintraege bereinigt. Bei tausenden Nutzern waechst die `data_event_ledger` Tabelle unkontrolliert.

**Fix:** Cron-Schedule in `supabase/config.toml` fuer `sot-ledger-retention` (z.B. wöchentlich).

---

### P2: Kein globales Rate-Limiting auf Edge Functions

**Problem:** Rate-Limiting ist nur ad-hoc in einzelnen AI-Funktionen (429-Handling). Es gibt kein systemweites Rate-Limit pro Tenant oder User fuer schreibende Edge Functions. Ein einzelner Tenant koennte die gesamte Plattform ueberlasten.

**Fix:** Rate-Limiting-Middleware in `_shared/` implementieren, basierend auf `tenant_id + function_name`, z.B. via `credit_ledger` oder Redis-artigem Counter.

---

### P2: Armstrong Credit-System nicht vollstaendig enforced

**Problem:** Das Armstrong-System hat ein Credit-Modell definiert (1 Credit = 0.50 EUR), aber die tatsaechliche Enforcement (Credit-Check vor Ausfuehrung, Credit-Deduction nach Ausfuehrung) ist nicht durchgaengig in der `sot-armstrong-advisor` Edge Function implementiert. Bei tausenden Nutzern bedeutet das unkontrollierte AI-Kosten.

**Fix:** Credit-Gate als Middleware vor jeder metered/premium Action.

---

## 3. Camunda-Readiness Bewertung: 8/10


| Aspekt                        | Status | Details                                                                         |
| ----------------------------- | ------ | ------------------------------------------------------------------------------- |
| Task-Typen                    | Fertig | `user_task`, `service_task`, `wait_message` in allen GP Steps                   |
| Correlation Keys              | Fertig | Alle ContractRefs haben `correlation_keys`                                      |
| Fail-States                   | Fertig | `on_timeout`, `on_error`, `on_rejected`, `on_duplicate` mit Recovery-Strategien |
| Camunda Keys                  | Fertig | `camunda_key` pro Step (z.B. `MOD04_STEP_03_UPLOAD_DOCS`)                       |
| BPMN Error Codes              | Fertig | `camunda_error_code` in StepFailState                                           |
| Direction Validation          | Fertig | `validateNoDirectCross()` erzwingt Backbone                                     |
| Fehlend: External Task Client | Offen  | Kein Camunda Worker/Connector implementiert                                     |
| Fehlend: Process Deployment   | Offen  | Keine BPMN XML Generierung aus GP Definitionen                                  |


**Fazit:** Die Datenstrukturen und Typen sind vollstaendig Camunda-ready. Die tatsaechliche Integration (Zeebe Client, External Task Workers) fehlt erwartungsgemaess noch, ist aber ein spaeterer Schritt.

---

## 4. Golden Tenant / Entwicklungsaccount als Blueprint


| Aspekt                 | Status                                                     |
| ---------------------- | ---------------------------------------------------------- |
| `tenant_mode` ENUM     | Aktiv (reference/sandbox/demo/production)                  |
| Dev-Tenant UUID        | Kanonisch in `tenantConstants.ts`                          |
| Sandbox-Reset          | Funktionsfaehig (DB + Storage)                             |
| Keep-List              | 26 Tabellen definiert und gepflegt                         |
| Feature-Flag Isolation | `VITE_FORCE_DEV_TENANT` sauber gekapselt                   |
| Tile Activation        | Via `get_tiles_for_role()` + `tenant_tile_activation`      |
| Onboarding Trigger     | `handle_new_user()` erstellt Org + Profile + 14 Base-Tiles |


**Bereitschaft fuer Vervielfaeltigung:** Der Entwicklungsaccount kann als Blueprint verwendet werden. Jeder neue Nutzer erhaelt via Signup-Trigger automatisch eine eigene Organisation mit aktivierten Standard-Modulen. Die Isolation ist durch RLS gewaehrleistet.

**Fehlend fuer Enterprise:**

- Kein `reference` Tenant als Template (aktuell nur `sandbox`)
- Keine automatische Demo-Daten-Provisionierung fuer neue Tenants
- Kein Tenant-Onboarding-Wizard (Branche, Rolle, initiale Konfiguration)

---

## 5. Skalierungs-Risiken fuer Tausende Nutzer


| Risiko                                    | Schwere | Mitigation                                         |
| ----------------------------------------- | ------- | -------------------------------------------------- |
| 141 fehlende Indexes                      | Hoch    | Migration erstellen                                |
| Kein Connection Pooling konfiguriert      | Mittel  | Lovable Cloud handled das, aber monitoren          |
| `data_event_ledger` unbegrenztes Wachstum | Mittel  | Cron fuer Retention                                |
| Kein Tenant-Quota-System                  | Mittel  | Storage Quota existiert, aber API-Call-Quota fehlt |
| Keine Health-Check Edge Function          | Niedrig | Smoke-Test-Endpoint erstellen                      |
| SECURITY DEFINER Views                    | Hoch    | Auf `security_invoker` umstellen                   |


---

## 6. Reparaturplan (priorisiert)

### Runde 1 — P1 (Sofort)

1. **141 fehlende Indexes erstellen** — Eine einzelne Migration mit `CREATE INDEX IF NOT EXISTS` fuer alle gemeldeten Tabellen. Geschaetzter Aufwand: 1 Migration, ~200 Zeilen SQL.
2. **SECURITY DEFINER Views fixen** — `v_public_listings` und `v_public_knowledge` auf `security_invoker = on` umstellen. 1 Migration, ~10 Zeilen SQL.
3. **Auth-Hardening** — OTP Expiry reduzieren, Leaked Password Protection aktivieren. Konfigurationsaenderung.

### Runde 2 — P2 (Diese Woche)

4. **Ledger Retention Cron** — Woechentlichen Cron-Job fuer `sot-ledger-retention` einrichten.
5. **Rate-Limiting Middleware** — Shared Helper in `supabase/functions/_shared/rateLimit.ts` mit Tenant-scoped Counter.
6. **Armstrong Credit Gate** — Pre-execution Credit-Check in `sot-armstrong-advisor`.

### Runde 3 — P3 (Vor Go-Live)

7. **Reference Tenant** — Einen `tenant_mode = 'reference'` Account als unloeschbares Template anlegen.
8. **Tenant Quota System** — API-Call-Counter pro Tenant/Tag fuer Edge Functions.
9. **Health-Check Endpoint** — `/functions/v1/health` Edge Function fuer Monitoring.
10. **BPMN Export** — Generator fuer Camunda-kompatible BPMN XML aus Golden Path Definitionen.

---

## 7. Zusammenfassung


| Frage                                               | Antwort                                                       |
| --------------------------------------------------- | ------------------------------------------------------------- |
| Ist das System stabil genug fuer Weiterentwicklung? | **JA**                                                        |
| Ist es bereit fuer tausende Nutzer?                 | **NEIN — erst P1 Reparaturen (Indexes + Views + Auth)**       |
| Ist es Camunda-ready?                               | **JA (Datenmodell), NEIN (Runtime-Integration)**              |
| Kann der Dev-Account vervielfaeltigt werden?        | **JA — Onboarding-Trigger funktioniert, Isolation durch RLS** |
| Groesstes Einzelrisiko?                             | **141 fehlende Indexes — Performance-Killer bei Scale**       |


**Empfehlung:** P1-Items (Indexes, Views, Auth) sofort umsetzen. Danach ist das System bereit fuer die naechste Entwicklungsphase und kontrollierte Beta-Tests mit echten Nutzern.