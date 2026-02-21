
# Iteration 2: Datenbank + RLS + Default-Seeding fuer MOD-21 KI-Browser

## Uebersicht

Erstellung der 5 Datenbanktabellen mit vollstaendigen RLS-Policies und Seeding der Default-Policy + Domain-Rules.

## Aenderungen

### 1. SQL-Migration: 5 Tabellen erstellen

**Tabellen:**

1. `ki_browser_policies` (muss ZUERST erstellt werden, da andere Tabellen FK darauf haben)
   - id, name, json_rules, is_active, created_by, created_at, updated_at
   - RLS: SELECT fuer alle authentifizierten User, INSERT/UPDATE/DELETE nur `is_platform_admin()`

2. `ki_browser_domain_rules`
   - id, policy_id (FK ki_browser_policies), rule_type, pattern, reason, created_at
   - RLS: SELECT fuer alle, Schreibzugriff nur `is_platform_admin()`

3. `ki_browser_sessions`
   - id, tenant_id (NOT NULL, FK organizations), user_id (NOT NULL), policy_profile_id (FK ki_browser_policies), purpose, status, step_count, max_steps, expires_at, created_at, updated_at
   - RLS: tenant_id = get_user_tenant_id() fuer SELECT/INSERT/UPDATE/DELETE
   - Platform Admin: full access
   - Tenant-Isolation Restrictive Policy (Double Safety Belt)

4. `ki_browser_steps`
   - id, session_id (FK sessions, CASCADE), step_number, kind, status, risk_level, payload_json, result_json, rationale, proposed_by, approved_by, blocked_reason, url_before, url_after, duration_ms, created_at
   - RLS: via JOIN auf sessions.tenant_id = get_user_tenant_id()
   - Platform Admin: full access

5. `ki_browser_artifacts`
   - id, session_id (FK sessions, CASCADE), step_id (FK steps), artifact_type, storage_ref, content_hash, meta_json, created_at
   - RLS: via JOIN auf sessions.tenant_id = get_user_tenant_id()
   - Platform Admin: full access

### 2. Indexes

- `(tenant_id, created_at)` Composite Index auf ki_browser_sessions (Performance-Standard)
- `(session_id, step_number)` auf ki_browser_steps
- `(session_id, artifact_type)` auf ki_browser_artifacts
- `(policy_id)` auf ki_browser_domain_rules

### 3. Default-Policy Seeding (via INSERT tool)

Eine Default-Policy "Standard Safe Mode" mit:
- max_steps: 50
- ttl_minutes: 30
- max_extract_size_kb: 500
- allowed_step_kinds: alle ausser blocked
- is_active: true

Default Domain-Rules (ca. 15 Eintraege):
- DENY: Banking, Crypto, Payment, lokale IPs, Metadata-Endpoints
- ALLOW: Docs, Wiki, GitHub, StackOverflow, Gov-Domains

### 4. Realtime

Realtime fuer `ki_browser_sessions` und `ki_browser_steps` aktivieren (fuer Live-Session-Updates im UI).

## Technische Details

- Alle Tabellen nutzen das etablierte Pattern: `tenant_id = (SELECT public.get_user_tenant_id())` fuer RLS
- Platform-Admin-Zugriff via `public.is_platform_admin()`
- Child-Tabellen (steps, artifacts) nutzen EXISTS-Subquery auf sessions fuer tenant-Scoping
- Kein Trigger auf auth-Schema (Supabase-Reserved)
- updated_at Trigger nur auf sessions und policies (bestehender `moddatetime`-Pattern oder eigener Trigger)

## Reihenfolge

1. Migration ausfuehren (1 SQL-Block, Tabellen in Abhaengigkeitsreihenfolge)
2. Default-Policy + Domain-Rules per INSERT seeden
3. Realtime aktivieren
