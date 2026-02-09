

# Definitiver Fix-Plan: Alle offenen Befunde abschliessen

Dieser Plan nutzt eine **Checklisten-Methode**: Jeder Befund bekommt eine eindeutige ID, einen konkreten Fix, und wird nach Umsetzung abgehakt. Nichts wird vergessen.

---

## Aktuelle Lage (verifiziert durch DB-Abfragen)

| Befund-ID | Problem | Status | Verifiziert |
|-----------|---------|--------|-------------|
| DB-01 | 48 fehlende Composite-Indizes (tenant_id, status) | OFFEN | check_missing_indexes() liefert exakt 48 Tabellen |
| DB-02 | 4 Views ohne security_invoker=on | OFFEN | reloptions ist NULL bei allen 4 Views |
| DB-03 | Functions ohne search_path | ERLEDIGT | Alle 31 Functions haben search_path=public |
| AUTH-01 | OTP Expiry zu lang | OFFEN | Linter-Warnung aktiv |
| AUTH-02 | Leaked Password Protection deaktiviert | OFFEN | Linter-Warnung aktiv |
| EXT-01 | pg_trgm in public Schema | AKZEPTIERT | Supabase-internes Detail, kein Fix moeglich |
| CODE-01 | MOD-00 als PortalDashboard-Alias | ERLEDIGT | portalModulePageMap + areaConfig + Doku vorhanden |

**Wichtige Korrektur:** Fruehere Analysen meldeten "116 fehlende Indizes" und "8 Functions ohne search_path". Die tatsaechlichen Zahlen sind **48 fehlende Indizes** und **0 offene Functions**. Die vorherigen Migrationen haben mehr gefixt als dokumentiert.

---

## Schritt 1: DB-Migration (1 einzige Migration)

### 1a) 48 Composite-Indizes (tenant_id, status)

Alle 48 Tabellen aus `check_missing_indexes()` erhalten einen Index:

```text
access_grants, acq_mandates, ad_campaigns, cars_claims, cars_financing,
cars_insurances, cars_logbook_connections, cars_vehicles, cases, commissions,
contact_staging, customer_projects, dev_project_reservations, dev_project_units,
extractions, finance_cases, finance_mandates, finance_packages, finance_requests,
integration_registry, investment_favorites, invoices, letter_drafts,
listing_inquiries, listing_publications, msv_bank_accounts, msv_enrollments,
msv_readiness_items, nk_periods, postings, properties, property_features,
property_valuations, pv_plants, rent_payments, rent_reminders, rental_listings,
rental_publications, renter_invites, reservations, sale_transactions, scraper_jobs,
service_case_inbound, service_case_offers, service_case_outbound, subscriptions,
tenant_tile_activation, user_consents
```

SQL-Muster fuer jede Tabelle:
```sql
CREATE INDEX IF NOT EXISTS idx_{table}_tenant_status
ON public.{table}(tenant_id, status);
```

Fuer Tabellen ohne `status`-Spalte wird nur `tenant_id` indexiert. Die Migration prueft vorab mit `information_schema.columns`, ob die Spalte `status` existiert.

### 1b) 2 Armstrong Views auf SECURITY INVOKER umstellen

Die vorherige Migration mit `ALTER VIEW SET (security_invoker = on)` hat nicht gewirkt, weil `reloptions` immer noch NULL ist. Der korrekte Weg:

```sql
DROP VIEW IF EXISTS v_armstrong_costs_daily;
CREATE VIEW v_armstrong_costs_daily
  WITH (security_invoker = on)
  AS SELECT ... (bestehende Query);

DROP VIEW IF EXISTS v_armstrong_dashboard_kpis;
CREATE VIEW v_armstrong_dashboard_kpis
  WITH (security_invoker = on)
  AS SELECT ... (bestehende Query);
```

Die Zone-3-Views (`v_public_listings`, `v_public_knowledge`) bleiben bewusst im DEFINER-Modus, da sie oeffentliche Daten fuer unauthentifizierte Besucher bereitstellen muessen.

### Risiko-Bewertung

- Indizes: Null Risiko (rein additiv, CREATE IF NOT EXISTS)
- Views: Sehr niedrig (DROP + CREATE mit identischer Query, nur security_invoker Property aendert sich)

---

## Schritt 2: plan.md aktualisieren

Nach erfolgreicher Migration wird `.lovable/plan.md` auf den neuen Stand gebracht — alle erledigten Punkte als ERLEDIGT markiert, verbleibende Punkte (AUTH-01, AUTH-02, EXT-01) mit Status-Erklaerung.

---

## Was NICHT in dieser Migration enthalten ist (und warum)

| Befund | Grund |
|--------|-------|
| AUTH-01 (OTP Expiry) | Konfigurationsaenderung im Auth-Dashboard, keine Migration |
| AUTH-02 (Leaked Passwords) | Konfigurationsaenderung im Auth-Dashboard, keine Migration |
| EXT-01 (pg_trgm in public) | Von der Plattform verwaltet, nicht aenderbar |
| DB-03 (Functions search_path) | Bereits erledigt — alle 31 Functions haben search_path=public |

---

## Verifikations-Checkliste (nach Umsetzung)

Nach der Migration werden folgende Pruefungen ausgefuehrt:

1. `SELECT count(*) FROM public.check_missing_indexes()` muss **0** ergeben
2. `SELECT relname, reloptions FROM pg_class WHERE relname LIKE 'v_armstrong%'` muss `security_invoker=on` zeigen
3. DB-Linter erneut ausfuehren: Armstrong-Views duerfen nicht mehr als SECURITY DEFINER erscheinen
4. Die 2 Zone-3-Views erscheinen weiterhin als DEFINER (akzeptiert)

---

## Technische Details

Die Migration ist eine einzige SQL-Datei mit drei Bloecken:

1. **Block 1:** 48x `CREATE INDEX IF NOT EXISTS` fuer die Composite-Indizes
2. **Block 2:** `DROP VIEW` + `CREATE VIEW ... WITH (security_invoker = on)` fuer die 2 Armstrong-Views
3. **Block 3:** Kommentar-Block mit Begruendung fuer die bewusst beibehaltenen DEFINER-Views

Geschaetzte Ausfuehrungszeit: unter 10 Sekunden (leere Tabellen im Development-Account).

