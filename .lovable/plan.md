
# Golden Tenant und Data Hygiene Hardening — Final Plan v1.0

---

## Review-Ergebnis: Drift-Check

| Aspekt | Status | Anmerkung |
|--------|--------|-----------|
| `tenant_mode` Spalte existiert? | NEIN | Muss in Schritt 2 angelegt werden |
| `seed_golden_path_data` Signatur | 0 Argumente | Muss auf `p_tenant_id UUID` erweitert werden (Schritt 4) |
| `VITE_FORCE_DEV_TENANT` existiert? | NEIN | Neu (Schaerfung S4) |
| `isDevelopmentEnvironment()` | Return false (Dev-Bypass deaktiviert) | S4 integriert sich hier |
| Tabellen mit `tenant_id` | ~140 Stueck | S2: dynamische Erkennung via `information_schema` ist korrekt |
| `test_data_registry` | Existiert, aber nur manueller Import registriert | Schritt 5 erweitert um Seeds |
| `demoProjectData.ts` | 18 Consumer-Dateien | Schritt 3: Registry + JSDoc-Tags |
| Orphan-Daten aktuell | 0 (geprueft) | Praeventiver Checker trotzdem sinnvoll |

---

## Schaerfungen S1–S4 integriert

### S1 — tenant_mode Runtime-Aufloesung

**Loesung:** SQL-Funktion `get_active_tenant_mode()` (SECURITY DEFINER).

```text
Logik:
  1. auth.uid() → profiles.active_tenant_id
  2. active_tenant_id → organizations.tenant_mode
  3. Return: tenant_mode ENUM oder 'production' als Default
```

Kein View noetig — die Funktion ist leichtgewichtig und kann vom Client via `supabase.rpc('get_active_tenant_mode')` aufgerufen werden. Der `useTenantReset`-Hook nutzt sie als Gate.

**Betroffene Dateien:** SQL-Migration (Funktion), `src/hooks/useTenantReset.ts` (Consumer)

### S2 — Reset robust gegen Schema-Aenderungen

**Entscheidung: Option B — dynamisch via `information_schema`**

```text
Logik in reset_sandbox_tenant(p_tenant_id):
  1. SELECT table_name FROM information_schema.columns
     WHERE table_schema = 'public' AND column_name = 'tenant_id'
  2. MINUS keep_list (hartcodiert im Funktionskoerper):
     - memberships, organizations, subscriptions, tenant_tile_activation,
       tenant_extraction_settings, storage_nodes, whatsapp_accounts,
       whatsapp_user_settings, mail_accounts, inbound_mailboxes,
       widget_preferences, task_widgets, miety_contracts
  3. Fuer jede verbleibende Tabelle:
     EXECUTE format('DELETE FROM %I WHERE tenant_id = $1', table_name) USING p_tenant_id
  4. Storage-Nodes: DELETE WHERE tenant_id = $1 AND parent_id IS NOT NULL
     (behaelt Root-Ordner)
```

**Akzeptanzkriterien:**
- Neue Tabellen mit `tenant_id` werden automatisch erfasst
- Keep-List wird in der Funktion dokumentiert
- Funktion laeuft fehlerfrei auch wenn Tabellen leer sind

### S3 — Storage Reset serverseitig + gegated

**Gate-Regeln fuer `sot-tenant-storage-reset`:**

```text
1. Auth: Authorization Header → JWT → auth.uid()
2. Gate 1: is_platform_admin(auth.uid()) = true
3. Gate 2: organizations.tenant_mode = 'sandbox' (via Service Role Query)
4. Gate 3: Request-Body { tenant_id, confirm: true }
```

**Bucket/Prefix-Loeschlogik:**

| Bucket | Prefix-Strategie |
|--------|------------------|
| `tenant-documents` | `{tenant_id}/` — direkter Prefix |
| `project-documents` | `{tenant_id}/` — direkter Prefix |
| `acq-documents` | DB-Lookup: `SELECT id FROM acq_mandates WHERE tenant_id = $1` → `{mandate_id}/` je Mandat |
| `social-assets` | `{tenant_id}/` — direkter Prefix |

**Nicht betroffen:** `docs-export` (Admin-only, kein Tenant-Scope), `audit-reports` (Admin-only), `documents` (frozen/deprecated)

### S4 — DEV Tenant Override abschaltbar

**Logik in `AuthContext.tsx`:**

```text
// Alte Logik (Zeile 35-37):
const isDevelopmentEnvironment = () => false;

// Neue Logik:
const isDevelopmentEnvironment = () => {
  return import.meta.env.VITE_FORCE_DEV_TENANT === 'true';
};
```

Wenn `VITE_FORCE_DEV_TENANT` NICHT gesetzt oder nicht `'true'`: normaler Auth-Flow, kein Mock-Override. Entwickler muessen sich einloggen.

Wenn `VITE_FORCE_DEV_TENANT=true` in `.env.local`: Dev-Bypass aktiv wie bisher (Mock-Org, Mock-Profile, DEV_TENANT_UUID).

**Betroffene Dateien:** `src/contexts/AuthContext.tsx` (1 Zeile), `src/hooks/useOrgContext.ts` (Fallback-Check gegen gleiche Variable)

---

## Finaler Plan — 10 Schritte

### Schritt 1 — DEV_TENANT_UUID Konsolidierung + S4 Feature Flag (Prio: hoch)

**Ziel:** Single Source of Truth fuer Dev-Konstanten + abschaltbarer Dev-Override.

**Aenderungen:**
- NEU: `src/config/tenantConstants.ts` — exportiert `DEV_TENANT_UUID`, `DEV_MOCK_ORG`, `DEV_MOCK_PROFILE`, `DEV_MOCK_MEMBERSHIP`
- EDIT: `src/contexts/AuthContext.tsx`:
  - Import Konstanten aus `tenantConstants.ts`
  - `isDevelopmentEnvironment()` liest `import.meta.env.VITE_FORCE_DEV_TENANT === 'true'`
  - Inline-Definitionen (Zeile 7, 41-102) entfernen
- EDIT: `src/hooks/useGoldenPathSeeds.ts` — Import `DEV_TENANT_UUID` aus `tenantConstants.ts`, lokale Konstante entfernen
- EDIT: `src/components/admin/TestDataManager.tsx` — Import-Pfad anpassen
- EDIT: `src/hooks/useOrgContext.ts` — Dev-Fallback (Zeile 77-86) nur wenn `VITE_FORCE_DEV_TENANT === 'true'`

**Akzeptanzkriterien:**
- `grep -r "DEV_TENANT_UUID" src/ | grep -v tenantConstants | grep -v "from.*tenantConstants"` liefert 0 Treffer
- Ohne `VITE_FORCE_DEV_TENANT=true`: Login-Seite erscheint, kein Mock-Data
- Mit `VITE_FORCE_DEV_TENANT=true`: Dev-Bypass wie bisher

### Schritt 2 — tenant_mode ENUM + Spalte + S1 RPC (Prio: hoch)

**Ziel:** Tenant-Typen in DB verankern + Runtime-Aufloesung.

**SQL-Migration:**

```text
CREATE TYPE public.tenant_mode AS ENUM ('reference', 'sandbox', 'demo', 'production');

ALTER TABLE public.organizations
  ADD COLUMN tenant_mode public.tenant_mode DEFAULT 'production';

UPDATE public.organizations
  SET tenant_mode = 'sandbox'
  WHERE id = 'a0000000-0000-4000-a000-000000000001';

-- S1: Runtime-Aufloesung
CREATE OR REPLACE FUNCTION public.get_active_tenant_mode()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(o.tenant_mode::text, 'production')
  FROM profiles p
  JOIN organizations o ON o.id = p.active_tenant_id
  WHERE p.id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.get_active_tenant_mode() TO authenticated;
```

**Akzeptanzkriterien:**
- `organizations.tenant_mode` existiert, Default = `production`
- Dev-Tenant hat `sandbox`
- `supabase.rpc('get_active_tenant_mode')` liefert korrekten Wert fuer eingeloggten User

### Schritt 3 — Demo-Daten-Registry (Prio: hoch)

**Ziel:** Alle Inline-Demo-Daten registrieren und mit JSDoc markieren.

**Aenderungen:**
- NEU: `src/config/demoDataRegistry.ts` — zentrales Register:

```text
export const DEMO_DATA_SOURCES = [
  { path: 'src/components/projekte/demoProjectData.ts', module: 'MOD-13', type: 'hardcoded', entities: ['project','units','developer'] },
  { path: 'src/components/portal/cars/CarsAngebote.tsx', module: 'MOD-17', type: 'hardcoded', entities: ['leasing_offers','rental_offers'] },
  { path: 'src/pages/portal/communication-pro/recherche/ResearchCandidatesTray.tsx', module: 'MOD-16', type: 'hardcoded', entities: ['candidates'] },
  { path: 'src/hooks/useFinanceData.ts', module: 'MOD-06', type: 'fallback', entities: ['markets'] },
  { path: 'src/hooks/useNewsData.ts', module: 'MOD-06', type: 'fallback', entities: ['headlines'] },
  { path: 'src/hooks/useGoldenPathSeeds.ts', module: 'SYSTEM', type: 'seed_rpc', entities: ['properties','units','contacts','documents','leases','loans'] },
] as const;
```

- EDIT: 5 Quelldateien — `/** @demo-data */` JSDoc-Tag an Demo-Konstanten

**Akzeptanzkriterien:**
- `demoDataRegistry.ts` listet alle 6 Quellen
- Jede Demo-Konstante hat `@demo-data` Tag

### Schritt 4 — seed_golden_path_data parametrisieren (Prio: mittel)

**Ziel:** RPC akzeptiert `p_tenant_id` Parameter.

**SQL-Migration:**
- `DROP FUNCTION IF EXISTS public.seed_golden_path_data();`
- `CREATE FUNCTION public.seed_golden_path_data(p_tenant_id UUID DEFAULT 'a0000000-0000-4000-a000-000000000001')` — alle internen Referenzen auf `v_tenant_id` ersetzen durch `p_tenant_id`
- GRANTs beibehalten

**EDIT:** `src/hooks/useGoldenPathSeeds.ts`:
- `executeSeeds`: `supabase.rpc('seed_golden_path_data', { p_tenant_id: tenantId })`
- `fetchGoldenPathCounts`: Parameter statt Hardcoded-UUID

**Akzeptanzkriterien:**
- Seeds fuer beliebigen Tenant ausfuehrbar
- Default-Wert = DEV_TENANT_UUID (Abwaertskompatibilitaet)
- Bestehende Seeds funktionieren weiterhin

### Schritt 5 — test_data_registry fuer Seeds erweitern (Prio: mittel)

**Ziel:** Golden Path Seeds registrieren sich automatisch.

**SQL-Migration:** In `seed_golden_path_data` nach allen Upserts:

```text
INSERT INTO test_data_registry (tenant_id, batch_id, batch_name, entity_type, entity_id, imported_by)
VALUES
  (p_tenant_id, 'golden-path-seeds', 'Golden Path Seeds', 'property', <property_id>, auth.uid()),
  (p_tenant_id, 'golden-path-seeds', 'Golden Path Seeds', 'unit', <unit_id>, auth.uid()),
  ... (alle Seed-Entities)
ON CONFLICT DO NOTHING;
```

**EDIT:** `src/components/admin/TestDataManager.tsx` — Seeds-Batch in UI sichtbar machen (ggf. spezielles Icon)

**Akzeptanzkriterien:**
- Nach Seed-Run: `test_data_registry` enthaelt Batch "Golden Path Seeds"
- TestDataManager zeigt den Batch an

### Schritt 6 — Orphan Checker (Prio: mittel)

**Ziel:** DB-Funktion prueft Datenintegritaet.

**SQL-Migration:**

```text
CREATE FUNCTION public.check_data_orphans(p_tenant_id UUID)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'extractions_without_document', (SELECT count(*) FROM extractions e LEFT JOIN documents d ON e.document_id = d.id WHERE e.tenant_id = p_tenant_id AND d.id IS NULL),
    'chunks_without_document', (SELECT count(*) FROM document_chunks dc LEFT JOIN documents d ON dc.document_id = d.id WHERE dc.tenant_id = p_tenant_id AND d.id IS NULL),
    'links_without_document', (SELECT count(*) FROM document_links dl LEFT JOIN documents d ON dl.document_id = d.id WHERE dl.tenant_id = p_tenant_id AND d.id IS NULL),
    'links_without_target', 0  -- vereinfacht, da polymorphe targets
  ) INTO result;
  RETURN result;
END $$;
```

**Neue Dateien:** `src/hooks/useOrphanChecker.ts`
**EDIT:** `src/components/admin/TestDataManager.tsx` — "Orphan Check" Button + Ergebnis-Badge

**Akzeptanzkriterien:**
- Funktion liefert JSON mit Orphan-Counts je Kategorie
- UI zeigt Ergebnisse an (gruen = 0, rot = >0)

### Schritt 7 — Reset Sandbox Tenant (S2 integriert) (Prio: mittel)

**Ziel:** Dynamische, schemarobuste Reset-Funktion.

**SQL-Migration:**

```text
CREATE FUNCTION public.reset_sandbox_tenant(p_tenant_id UUID)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_mode text;
  v_table text;
  v_deleted int;
  v_result jsonb := '{}'::jsonb;
  v_keep_list text[] := ARRAY[
    'memberships','organizations','subscriptions','tenant_tile_activation',
    'tenant_extraction_settings','whatsapp_accounts','whatsapp_user_settings',
    'mail_accounts','inbound_mailboxes','widget_preferences','task_widgets',
    'miety_contracts','integration_registry','msv_templates','msv_communication_prefs'
  ];
BEGIN
  -- Gate: tenant_mode = 'sandbox'
  SELECT tenant_mode::text INTO v_mode FROM organizations WHERE id = p_tenant_id;
  IF v_mode IS DISTINCT FROM 'sandbox' THEN
    RAISE EXCEPTION 'Reset nur fuer sandbox-Tenants erlaubt. Aktuell: %', COALESCE(v_mode, 'NULL');
  END IF;

  -- Dynamisch: alle Tabellen mit tenant_id, minus keep_list
  FOR v_table IN
    SELECT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.column_name = 'tenant_id'
      AND c.table_name != ALL(v_keep_list)
    ORDER BY c.table_name
  LOOP
    EXECUTE format('DELETE FROM %I WHERE tenant_id = $1', v_table) USING p_tenant_id;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    v_result := v_result || jsonb_build_object(v_table, v_deleted);
  END LOOP;

  -- Storage-Nodes: nur Children loeschen (Root-Ordner behalten)
  DELETE FROM storage_nodes WHERE tenant_id = p_tenant_id AND parent_id IS NOT NULL;

  RETURN v_result;
END $$;
```

**Neue Dateien:** `src/hooks/useTenantReset.ts` (mit Confirmation-Dialog, ruft RPC + Storage-Reset auf)
**EDIT:** Zone-1 Admin-UI — "Reset Tenant" Button (nur wenn `tenant_mode = 'sandbox'`)

**Akzeptanzkriterien:**
- `production`-Tenant: Funktion wirft Exception
- `sandbox`-Tenant: alle operativen Daten geloescht, Config bleibt
- Neue Tabellen mit `tenant_id` werden automatisch erfasst ohne Code-Aenderung

### Schritt 8 — Storage Reset Edge Function (S3 integriert) (Prio: mittel)

**Ziel:** Server-seitige Blob-Loesung mit strikten Gates.

**Neue Datei:** `supabase/functions/sot-tenant-storage-reset/index.ts`

```text
Gate-Pruefungen (in Reihenfolge):
1. JWT vorhanden → 401 wenn nicht
2. is_platform_admin(uid) → 403 wenn nicht
3. organizations.tenant_mode = 'sandbox' → 403 wenn nicht
4. Request-Body: { tenant_id: UUID, confirm: true } → 400 wenn nicht

Loeschlogik (Service Role):
- tenant-documents: list + remove alle unter {tenant_id}/
- project-documents: list + remove alle unter {tenant_id}/
- social-assets: list + remove alle unter {tenant_id}/
- acq-documents: DB-Query acq_mandates.tenant_id → list + remove je {mandate_id}/
```

**EDIT:** `src/hooks/useTenantReset.ts` — nach DB-Reset die Edge Function aufrufen

**Akzeptanzkriterien:**
- Ohne platform_admin: 403
- Ohne sandbox-Mode: 403
- Nach Ausfuehrung: Storage-Ordner des Tenants leer
- Andere Tenants nicht betroffen

### Schritt 9 — Spec-Dokumente (Prio: niedrig)

**Neue Dateien:**
- `spec/current/08_data_provenance/DPR_V1.md` — Data Provenance Rules (DPR-01, DPR-02, DPR-03)
- `spec/current/08_data_provenance/GOLDEN_TENANT_CONTRACT.md` — Tenant-Typen-Modell, Reset-Regeln, Keep-List

**Akzeptanzkriterien:** Dokumente existieren, alle Regeln beschrieben, Referenzen auf Code-SSOT

### Schritt 10 — architectureValidator: Tenant-Hygiene-Checks (Prio: niedrig)

**EDIT:** `src/validation/architectureValidator.ts`

```text
export function validateTenantHygiene(): void {
  if (import.meta.env.PROD) return;
  // Check 1: VITE_FORCE_DEV_TENANT Status loggen
  // Check 2: demoDataRegistry importieren und Completeness pruefen
  console.info('[GTC] Tenant Hygiene: ...');
}
```

**EDIT:** `src/App.tsx` — `validateTenantHygiene()` in bestehenden DEV-Block aufrufen

**Akzeptanzkriterien:** DEV-Konsole zeigt Hygiene-Status (Feature-Flag, Demo-Daten-Abdeckung)

---

## Zusammenfassung

| Prio | Schritte | Typ |
|------|----------|-----|
| Hoch | 1, 2, 3 | Config-Konsolidierung + DB-Schema + Registry |
| Mittel | 4, 5, 6, 7, 8 | Seed-Parametrisierung + Orphan-Checker + Reset-Mechanik |
| Niedrig | 9, 10 | Dokumentation + Dev-Tooling |

| Metrik | Wert |
|--------|------|
| SQL-Migrationen | 4 (ENUM+Spalte+RPC, Seed-Parametrisierung, Orphan-Checker, Reset-Funktion) |
| Neue Dateien | 6 (`tenantConstants.ts`, `demoDataRegistry.ts`, `useTenantReset.ts`, `useOrphanChecker.ts`, 2 Spec-Docs) |
| Neue Edge Function | 1 (`sot-tenant-storage-reset`) |
| Editierte Dateien | 7 (`AuthContext.tsx`, `useGoldenPathSeeds.ts`, `TestDataManager.tsx`, `useOrgContext.ts`, `architectureValidator.ts`, `App.tsx`, 5x JSDoc-Tags) |
