

# Tenant-Isolation Hardening Plan

## Ausgangslage

Wir haben drei Accounts:
- **Thomas Stelzl** (platform_admin, org_type: internal, tenant_mode: sandbox) - 21 Module
- **test-beta-check** (org_admin, org_type: client, tenant_mode: production) - 14 Module
- **Bernhard Marchner** (org_admin, org_type: client, tenant_mode: production) - 14 Module

## Analyse-Ergebnis

### Was bereits gut funktioniert
- **209 Tabellen** haben eine `tenant_id`-Spalte
- Alle Tabellen haben **RLS aktiviert** (nur 1 Ausnahme: `pet_z3_sessions`)
- Kern-Business-Tabellen (contacts, properties, documents, leads, listings, units, leases, invoices, loans, cases, commissions, finance_cases) haben `tenant_id NOT NULL`
- Die zentralen Security-Definer-Funktionen (`get_user_tenant_id()`, `is_platform_admin()`) sind korrekt implementiert
- INSERT-Policies auf Kerntabellen pruefen die `tenant_id` via Membership-Check

### Kritische Luecken

#### 1. Fehlende RESTRICTIVE tenant_isolation Policy (29 Tabellen)
Diese Tabellen haben zwar RLS und `tenant_id`, aber KEINE restrictive `tenant_isolation_restrictive` Policy. Das bedeutet: Wenn eine PERMISSIVE Policy zu grosszuegig ist, gibt es keinen zweiten Sicherheitsgurt.

Betroffene Tabellen (Auszug):
- `pets`, `pet_customers`, `pet_invoices`, `pet_medical_records`, `pet_bookings`, `pet_providers`, `pet_rooms`, `pet_services`, `pet_staff`, `pet_vaccinations`, `pet_caring_events`, `pet_provider_availability`, `pet_provider_blocked_dates`, `pet_room_assignments`
- `car_service_requests`, `cars_*`-Tabellen (falls vorhanden)
- `cloud_sync_connectors`, `cloud_sync_log`
- `finapi_connections`, `finapi_transactions`
- `kv_contracts`, `miety_loans`, `miety_tenancies`
- `nk_beleg_extractions`, `private_loans`
- `tenant_credit_balance`, `vv_annual_data`
- `pet_z1_*`-Tabellen

#### 2. Tabellen OHNE tenant_id (53 Tabellen)
Hier gibt es zwei Kategorien:

**Korrekt ohne tenant_id** (globale Kataloge/System):
- `organizations`, `profiles`, `memberships`, `user_roles` (Backbone)
- `tile_catalog`, `dp_catalog`, `doc_type_catalog` (Kataloge)
- `consent_templates`, `agreement_templates` (Vorlagen)
- `armstrong_policies`, `armstrong_knowledge_items` (System-Config)
- `church_tax_rates`, `interest_rates`, `tax_parameters` (Referenzdaten)

**Potenziell kritisch - brauchen Pruefung**:
- `audit_events`, `audit_jobs`, `audit_reports` (enthalten Mandantendaten?)
- `armstrong_action_runs`, `armstrong_billing_events` (user-spezifisch)
- `widget_preferences` (user-spezifisch)
- `mail_campaigns`, `mail_messages`, `mail_campaign_recipients` (Geschaeftsdaten)
- `admin_*`-Tabellen (Zone 1, aber enthalten sie tenant-Daten?)

#### 3. pet_z3_sessions: RLS aktiv, aber KEINE Policies
Diese Tabelle hat RLS aktiviert, aber null Policies - das bedeutet: KEIN Zugriff moeglich (sicher, aber moeglicherweise defekt).

#### 4. Nullable tenant_id (3 Tabellen)
- `document_checklist_items` - bewusst nullable (globale Katalogdaten)
- `integration_registry` - bewusst nullable (globale Config)
- `msv_templates` - bewusst nullable (globale Vorlagen)

Diese sind laut Spezifikation korrekt nullable.

---

## Massnahmenplan

### Phase 1: Restrictive Policy Rollout (Prioritaet HOCH)

Fuer alle 29 Tabellen mit `tenant_id` aber ohne restrictive Policy wird folgende Standard-Policy hinzugefuegt:

```text
CREATE POLICY "tenant_isolation_restrictive"
  ON public.<table_name>
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));
```

Dies stellt sicher, dass selbst bei einer fehlerhaften PERMISSIVE Policy keine Cross-Tenant-Datenlecks moeglich sind.

### Phase 2: Fehlende Policies fixen

- `pet_z3_sessions`: Entweder Policies hinzufuegen oder die Tabelle entfernen, falls sie nicht genutzt wird.

### Phase 3: Tabellen ohne tenant_id pruefen

Fuer die 53 Tabellen ohne `tenant_id` wird einzeln geprueft:
- Enthalten sie mandantenspezifische Daten? Falls ja: `tenant_id` Spalte + NOT NULL + RLS Policy hinzufuegen
- Sind sie korrekt global? Falls ja: Dokumentation, dass sie bewusst tenant-frei sind
- Besondere Aufmerksamkeit: `widget_preferences`, `audit_events`, `armstrong_action_runs` (diese enthalten vermutlich user-spezifische Daten)

### Phase 4: Verifikationstest

Nach Implementierung wird ein Cross-Tenant-Query-Test durchgefuehrt:
1. Als Marchner einloggen (via Edge Function oder direkten DB-Check)
2. Pruefen: Sieht Marchner KEINE Daten von Thomas Stelzl?
3. Pruefen: Sieht Thomas als platform_admin ALLE Daten?
4. Pruefen: Kann Marchner nur in seinen eigenen Tenant inserieren?

---

## Technische Details

### Betroffene Migrationen
- **Migration 1**: 29x RESTRICTIVE Policy hinzufuegen (Pet, Car, Cloud, FinAPI, Miety, etc.)
- **Migration 2**: `pet_z3_sessions` Policy oder Cleanup
- **Migration 3**: Audit der 53 tenant_id-losen Tabellen (ggf. Spalten + Policies)

### Geschaetzter Umfang
- Phase 1: 1 Migration mit ~29 CREATE POLICY Statements
- Phase 2: 1 kleinere Migration
- Phase 3: Erfordert Einzelanalyse, mehrere Migrationen moeglich
- Phase 4: Manuelle Verifikation via SQL-Queries

### Risikobewertung
- Phase 1 ist **risikofrei** (RESTRICTIVE Policies schraenken nur ein, brechen nichts)
- Phase 2 ist minimal
- Phase 3 erfordert Vorsicht bei Tabellen, die bereits Daten enthalten

