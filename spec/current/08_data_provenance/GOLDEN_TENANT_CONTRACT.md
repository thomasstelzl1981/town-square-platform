# Golden Tenant Contract v1.0

## Tenant-Typen-Modell

Spalte: `organizations.tenant_mode` (ENUM: `reference | sandbox | demo | production`)

| Mode | Zweck | Operative Daten | Reset |
|------|-------|-----------------|-------|
| `reference` | Template-Account, Blueprint | Nur Config/Templates | NEIN |
| `sandbox` | Entwicklung, Testing | Vollstaendiges CRUD | JA |
| `demo` | Kontrollierte Vorfuehrung | Kuratiert, read-only | Reset-to-Demo |
| `production` | Echtbetrieb (Default) | Unbeschraenkt | NEIN |

## Runtime-Aufloesung

`get_active_tenant_mode()` — SECURITY DEFINER, STABLE
- Liest `profiles.active_tenant_id` → `organizations.tenant_mode`
- Default: `'production'`

## Reset-Mechanik

### DB-Reset: `reset_sandbox_tenant(p_tenant_id)`
- Gate: `tenant_mode = 'sandbox'` + `is_platform_admin(auth.uid())`
- Dynamisch: alle Tabellen mit `tenant_id` minus Keep-List
- Keep-List: `memberships, organizations, profiles, user_roles, subscriptions, tenant_tile_activation, tenant_extraction_settings, storage_nodes, whatsapp_accounts, whatsapp_user_settings, mail_accounts, inbound_mailboxes, widget_preferences, task_widgets, miety_contracts, integration_registry, msv_templates, msv_communication_prefs, tile_catalog, dp_catalog, doc_type_catalog, consent_templates, agreement_templates, armstrong_policies, armstrong_knowledge_items, armstrong_action_overrides`
- Storage-Nodes: Root-Ordner bleiben, Children werden geloescht

### Storage-Reset: `sot-tenant-storage-reset` Edge Function
- Gates: JWT + platform_admin + sandbox mode + confirm=true
- Buckets: `tenant-documents/{tenant_id}/`, `project-documents/{tenant_id}/`, `social-assets/{tenant_id}/`
- `acq-documents`: via Mandate-ID Lookup

## Dev-Override

`VITE_FORCE_DEV_TENANT=true` in `.env.local` aktiviert Dev-Bypass.
Ohne Flag: normaler Auth-Flow, Login erforderlich.

## SSOT fuer Constants

Alle Dev-Tenant-Konstanten in `src/config/tenantConstants.ts`.
Alle Demo-Daten-Quellen in `src/config/demoDataRegistry.ts`.
