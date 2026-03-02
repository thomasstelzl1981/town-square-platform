# FDC (Finance Data Controller) — FULL AUDIT RUNBOOK

> **Status:** Wave 1 Audit Complete — 2026-03-02
> **Engine:** ENG-FDC v1.0.0
> **Module:** MOD-18 (Finanzanalyse)

---

## 1) Audit Summary

### Befunde gefunden & gefixt (5 Bugs)

| # | Befund | Severity | Fix |
|---|---|---|---|
| B1 | `snapshotLoader.ts`: `bank_account_meta` Query ohne `.eq('tenant_id')` — zählt Cross-Tenant | **HOCH** | ✅ Fixed: `.eq('tenant_id', tenantId)` ergänzt |
| B2 | `snapshotLoader.ts`: `pension_records` Query ohne `.eq('tenant_id')` — zählt Cross-Tenant | **HOCH** | ✅ Fixed: `.eq('tenant_id', tenantId)` ergänzt |
| B3 | `engine.ts` Rule 2: `ACCOUNT_META_MISSING` erzeugt Action pro Konto statt konsolidiert | **MITTEL** | ✅ Fixed: Eine konsolidierte Action mit `scope_key=missing:N` |
| B4 | `engine.ts` Rule 7: `PROPERTY_LOAN_MISMATCH` Body leer — nie Actions erzeugt | **MITTEL** | ✅ Fixed: Prüft ob linked_property_id in Registry existiert |
| B5 | `KontrolleTab.tsx`: Hardcoded Colors statt Design Tokens | **GERING** | ✅ Fixed: `text-primary`, `text-destructive`, `text-accent-foreground` |

### Bestätigte Korrektheit

| Check | Ergebnis |
|---|---|
| Registry Duplikate | ✅ 0 |
| Link Duplikate | ✅ 0 |
| Action Open Duplikate | ✅ 0 |
| Null tenant_id | ✅ 0 |
| Invalid Resolved (resolved_at/by missing) | ✅ 0 |
| Backfill Idempotenz (2× Run) | ✅ 72 → 72 (keine Änderung) |
| RLS RESTRICTIVE auf allen 3 Tabellen | ✅ Bestätigt |
| UNIQUE Indexes (3 Tabellen) | ✅ Alle vorhanden |
| Stripe `subscriptions` NICHT als private Abos | ✅ Bestätigt (nicht im Registry) |
| `applicant_profiles` NICHT als Income SSOT | ✅ Bestätigt (nicht im Registry) |
| Keine Export/Share Buttons | ✅ Bestätigt |
| Keine public URLs/Signed URLs | ✅ Bestätigt |
| Manifest-konforme Route | ✅ `/portal/finanzanalyse/kontrolle` |

---

## 2) SSOT Mapping (bestätigt)

| Entity Type | SSOT Tabelle | Registry Count | SSOT Count | Match |
|---|---|---|---|---|
| account | bank_accounts | 1 | 1 | ✅ |
| insurance_sach | insurance_contracts | 15 | 15 | ✅ |
| insurance_kv | kv_contracts | 8 | 8 | ✅ |
| vorsorge | vorsorge_contracts | 6 | 6 | ✅ |
| pension | pension_records | 2 | 2 | ✅ |
| private_loan | private_loans | 2 | 2 | ✅ |
| mortgage | loans | 12 | 12 | ✅ |
| miety_home | miety_homes | 5 | 5 | ✅ |
| miety_contract | miety_contracts | 5 | 5 | ✅ |
| miety_loan | miety_loans | 0 | 0 | ✅ |
| legal_doc | legal_documents | 1 | 1 | ✅ |
| property_finance_ref | properties | 15 | 15 | ✅ |
| contract_candidate | contract_candidates | 0 | 0 | ✅ |
| **TOTAL** | | **72** | **72** | ✅ |

### Explizit NICHT enthalten
- `subscriptions` (Stripe Platform — kein privates Abo)
- `applicant_profiles` (FLC Selbstauskunft — kein MOD-18 Income SSOT)

---

## 3) Unique Indexes

| Tabelle | Index | Typ |
|---|---|---|
| finance_data_registry | `idx_fdc_registry_unique(tenant_id, entity_type, entity_id)` | UNIQUE |
| finance_entity_links | `idx_fdc_links_unique(tenant_id, from_type, from_id, to_type, to_id, link_type)` | UNIQUE |
| finance_repair_actions | `idx_fdc_actions_open_unique(tenant_id, code, entity_type, entity_id, scope_key) WHERE status='open'` | UNIQUE PARTIAL |

---

## 4) RLS Policies

| Tabelle | Policy | Type | Condition |
|---|---|---|---|
| finance_data_registry | tenant_isolation_restrictive | RESTRICTIVE ALL | `tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid())` |
| finance_entity_links | tenant_isolation_restrictive | RESTRICTIVE ALL | `tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid())` |
| finance_repair_actions | tenant_isolation_restrictive | RESTRICTIVE ALL | `tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid())` |

---

## 5) Test Matrix (20 Testfälle)

### Kategorie 1: Datenmodell

| TC | Given | When | Then |
|---|---|---|---|
| TC-01 | finance_data_registry exists | `SELECT * FROM pg_indexes WHERE tablename='finance_data_registry'` | UNIQUE(tenant_id, entity_type, entity_id) present |
| TC-02 | finance_entity_links exists | Check indexes | UNIQUE(tenant_id, from_type, from_id, to_type, to_id, link_type) present |
| TC-03 | finance_repair_actions exists | Check indexes | UNIQUE partial on open actions present |
| TC-04 | Registry populated | Count by entity_type | Matches SSOT counts exactly (72 total) |

### Kategorie 2: Backfill Idempotenz

| TC | Given | When | Then |
|---|---|---|---|
| TC-05 | Registry has 72 rows | Run backfill SQL again | Count stays 72 (ON CONFLICT DO NOTHING) |
| TC-06 | No contract_candidates exist | Check registry | 0 contract_candidate entries, no false positives |
| TC-07 | Stripe subscriptions exist | Check registry | 0 platform_subscription entries (correctly excluded) |

### Kategorie 3: Engine Determinismus

| TC | Given | When | Then |
|---|---|---|---|
| TC-08 | Same snapshot input | Run computeFinanceIntegrity 2× | Identical coverageScore, categoryScores, actionsToUpsert |
| TC-09 | accounts=1, accountsWithMeta=0 | Run engine | 1× ACCOUNT_META_MISSING action (consolidated, not per-account) |
| TC-10 | insuranceSach=15, all with owner | Run engine | 0× CONTRACT_OWNER_MISSING for insurance_sach |
| TC-11 | mortgages=12, mortgagesWithProperty=10 | Run engine | 2× LOAN_PROPERTY_LINK_MISSING |
| TC-12 | pensions=0 | Run engine | 1× PENSION_DATA_MISSING |
| TC-13 | legalDocsTestament=0, legalDocsPatVfg=1 | Run engine | 1× LEGAL_DOCS_MISSING with metadata.missingTestament=true |
| TC-14 | mietyContracts=5, linked=3 | Run engine + no links | 2× HOME_CONTRACT_LINK_MISSING |

### Kategorie 4: Action Lifecycle

| TC | Given | When | Then |
|---|---|---|---|
| TC-15 | Open action exists | resolveAction(id) | status=resolved, resolved_at+resolved_by set, ledger event emitted |
| TC-16 | Open action exists | suppressAction(id) | status=suppressed, resolved_at set |
| TC-17 | Action resolved | Recompute integrity | No new identical open action created (idempotent) |

### Kategorie 5: Security

| TC | Given | When | Then |
|---|---|---|---|
| TC-18 | Anon user | SELECT from finance_data_registry | Access denied (RESTRICTIVE RLS) |
| TC-19 | User in tenant A | SELECT finance_data_registry WHERE tenant_id=B | 0 rows (cross-tenant blocked) |
| TC-20 | Control Tab rendered | Inspect UI | No export buttons, no share links, no signed URL generation |

---

## 6) SQL Audit Queries

```sql
-- Registry duplicates (should be 0)
SELECT tenant_id, entity_type, entity_id, COUNT(*)
FROM finance_data_registry
GROUP BY 1,2,3 HAVING COUNT(*) > 1;

-- Link duplicates (should be 0)
SELECT tenant_id, from_type, from_id, to_type, to_id, link_type, COUNT(*)
FROM finance_entity_links
GROUP BY 1,2,3,4,5,6 HAVING COUNT(*) > 1;

-- Open action duplicates (should be 0)
SELECT tenant_id, code, entity_type, entity_id, scope_key, COUNT(*)
FROM finance_repair_actions WHERE status='open'
GROUP BY 1,2,3,4,5 HAVING COUNT(*) > 1;

-- Invalid resolved (should be 0)
SELECT COUNT(*) FROM finance_repair_actions
WHERE status='resolved' AND (resolved_at IS NULL OR resolved_by IS NULL);

-- Registry vs SSOT count comparison
SELECT entity_type, COUNT(*) as registry_count
FROM finance_data_registry GROUP BY entity_type ORDER BY entity_type;

-- Orphan tenant_ids (should be 0)
SELECT COUNT(*) FROM finance_data_registry WHERE tenant_id IS NULL;

-- Ledger events for FDC
SELECT event_type, COUNT(*) FROM data_event_ledger
WHERE event_type LIKE 'finance.%' GROUP BY event_type;
```

---

## 7) No External View Checklist

| Check | Result |
|---|---|
| No `<a>` with external href in KontrolleTab | ✅ |
| No CSV/PDF export buttons | ✅ |
| No share/invite links | ✅ |
| No `supabase.storage.createSignedUrl()` in hook | ✅ |
| No public bucket references | ✅ |
| Deep-links only to internal portal routes | ✅ |

---

## 8) Ledger Integration

| Event Type | Trigger | Payload |
|---|---|---|
| `finance.action.resolved` | resolveAction() | actionId, code |
| `finance.action.updated` | suppressAction() | actionId |
| `finance.links.created` | createLink() | from/to types+ids, link_type |
| `finance.patrol.completed` | sot-fdc-patrol | tenants_processed, total_actions |

Payload minimized: only IDs, codes, actor references. No PII, no financial amounts.

---

## 9) Patrol Cron Status

- **Function:** `sot-fdc-patrol` deployed ✅
- **Schedule:** NOT activated (manual trigger only)
- **Idempotency:** Uses unique open constraint (23505 skip)
- **Scope:** Subset of engine rules (ACCOUNT_OWNER_MISSING, CONTRACT_OWNER_MISSING, LOAN_PROPERTY_LINK_MISSING)
