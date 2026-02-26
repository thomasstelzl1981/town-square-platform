# 00_MASTER_BACKLOG — Technische Schulden (Priorisiert)

## Analyse-Stand: 2026-02-26 | Analyst: GitHub Agent v2
## Basis: Vollständiger Repo-Scan (src/, supabase/, manifests/, spec/)

---

## P0 — Blocker

| ID | Priorität | Kategorie | Datei:Zeile | Problem | Fix-Aufwand |
|----|-----------|-----------|-------------|---------|-------------|
| B-001 | 🔴 P0 | SECURITY | `supabase/functions/sot-social-meta-webhook/index.ts:1` | Meta-Webhook-Payload wird ohne HMAC-Signaturvalidierung verarbeitet — Attacker kann beliebige Leads einschleusen | S |
| B-002 | 🔴 P0 | SECURITY | `supabase/functions/sot-whatsapp-webhook/index.ts:1` | WhatsApp-Webhook ohne Body-Signatur-Check (nur Verify-Token bei GET, kein HMAC-SHA256 auf POST-Payload) | S |
| B-003 | 🔴 P0 | SECURITY | `supabase/functions/sot-social-payment-webhook/index.ts:1` | Stripe-Payment-Webhook im Social-Modul ohne `constructEventAsync` — keine Signaturprüfung | S |
| B-004 | 🔴 P0 | SECURITY | 32 Tabellen (s.u.) | Kritische Tabellen ohne RLS: `contacts`, `listings`, `properties`, `leads`, `leases`, `documents`, `finance_mandates`, `finance_requests`, `applicant_profiles`, `units` | L |
| B-005 | 🔴 P0 | SECURITY | `supabase/functions/elevenlabs-scribe-token/index.ts:1` | Auth-Check fehlt komplett — jeder kann ElevenLabs-API-Tokens abrufen | XS |
| B-006 | 🔴 P0 | SECURITY | `supabase/functions/pvgis-proxy/index.ts:1` | Kein Auth-Check — öffentlich zugänglicher PVGIS-Proxy ohne Rate-Limiting | XS |
| B-007 | 🔴 P0 | SECURITY | `supabase/functions/sot-google-maps-key/index.ts:1` | Google-Maps-API-Key wird ohne Auth ausgegeben | XS |
| B-008 | 🔴 P0 | SECURITY | `supabase/functions/sot-finance-proxy/index.ts:1` | Finance-Proxy ohne Auth-Check — Finanzierungsanfragen können von Unbefugten erstellt werden | XS |
| B-009 | 🔴 P0 | SECURITY | `supabase/functions/sot-contacts-import/index.ts:1` | Kein Auth-Check — Bulk-Import von Kontakten ohne Authentifizierung | XS |
| B-010 | 🔴 P0 | SECURITY | `supabase/functions/sot-docs-export-appendix/index.ts:1` | 5 Export-Funktionen ohne Auth (`sot-docs-export-appendix`, `-modules`, `-rfp`, `-specs`, `-engineering`) | XS |

---

## P1 — Kritisch

| ID | Priorität | Kategorie | Datei:Zeile | Problem | Fix-Aufwand |
|----|-----------|-----------|-------------|---------|-------------|
| B-011 | 🟠 P1 | SECURITY | `supabase/functions/*/index.ts` | 131 von 131 Edge Functions mit `Access-Control-Allow-Origin: *` — CORS zu permissiv für Produktionsumgebung | M |
| B-012 | 🟠 P1 | TYPESCRIPT | `src/hooks/useVVSteuerData.ts` | 52 `any`-Verwendungen — komplette Typlosigkeit bei Steuerdaten (sensitiv) | M |
| B-013 | 🟠 P1 | TYPESCRIPT | `src/hooks/useUnitDossier.ts` | 35 `any`-Verwendungen in Wohneinheits-Dossier | M |
| B-014 | 🟠 P1 | TYPESCRIPT | `src/hooks/useDemoSeedEngine.ts:1` | 34 `any`-Verwendungen, 1020 Zeilen — Refactoring dringend nötig | L |
| B-015 | 🟠 P1 | TYPESCRIPT | `src/hooks/useFinanzberichtData.ts` | 33 `any`-Verwendungen + `supabase.from('pv_plants' as any)` | M |
| B-016 | 🟠 P1 | PERFORMANCE | `src/hooks/useNKAbrechnung.ts:109` | Unbegrenzte Query auf `contacts` ohne `.limit()` — potenziell 10.000+ Rows | S |
| B-017 | 🟠 P1 | PERFORMANCE | `src/hooks/useAdminResearch.ts:154,168,317` | 3 sequenzielle `contacts`-Queries ohne Pagination | S |
| B-018 | 🟠 P1 | PERFORMANCE | `src/hooks/useAcqContacts.ts:221,231,243,262` | 4 ungepaginierte `contacts`-Queries im Akquise-Manager | S |
| B-019 | 🟠 P1 | PERFORMANCE | `src/components/` | Nur 1 von 455 Komponenten nutzt `React.memo` — massenhafte unnötige Re-Renders | L |
| B-020 | 🟠 P1 | DB | 36 Migrations | `ALTER TABLE … ADD COLUMN` ohne `IF NOT EXISTS` — Migrations nicht idempotent, Deployment-Risiko | M |
| B-021 | 🟠 P1 | REACT | `src/hooks/useFinanzberichtData.ts:78,91,105` | `supabase as any` bei RPC-Calls — Typ-Safety für Finanzdaten komplett deaktiviert | S |
| B-022 | 🟠 P1 | SECURITY | `supabase/functions/sot-extract-email/index.ts:1` | E-Mail-Extraktion ohne Auth — DSGVO-relevant | XS |
| B-023 | 🟠 P1 | EDGE-FN | `supabase/functions/sot-research-engine/index.ts` | SILENT-FAILS bei 1206-Zeilen-Funktion ohne throw-Propagation — Fehler werden verschluckt | M |
| B-024 | 🟠 P1 | EDGE-FN | `supabase/functions/sot-listing-publish/index.ts` | SILENT-FAILS in kritischem Listing-Publish-Pfad | S |
| B-025 | 🟠 P1 | DB | `supabase/migrations/` | 328 FK-Referenzen ohne `ON DELETE CASCADE/SET NULL` — orphan records bei Tenant-Löschung | L |

---

## P2 — Wichtig

| ID | Priorität | Kategorie | Datei:Zeile | Problem | Fix-Aufwand |
|----|-----------|-----------|-------------|---------|-------------|
| B-026 | 🟡 P2 | TYPESCRIPT | `src/pages/portal/office/EmailTab.tsx` | 25 `any`-Verwendungen in E-Mail-Tab | M |
| B-027 | 🟡 P2 | TYPESCRIPT | `src/pages/portal/finanzanalyse/DarlehenTab.tsx` | 23 `any`-Verwendungen | M |
| B-028 | 🟡 P2 | TYPESCRIPT | `src/pages/portal/stammdaten/ProfilTab.tsx` | 22 `any` | M |
| B-029 | 🟡 P2 | TYPESCRIPT | Gesamt: 1.301 `any`-Vorkommen / 786 `as any`-Casts | Codebase-weite TypeScript-Disziplin | L |
| B-030 | 🟡 P2 | PERFORMANCE | `src/pages/portal/immobilien/PortfolioTab.tsx:1` | 1.239 Zeilen — Komponente zu groß, schlechte Code-Splits | M |
| B-031 | 🟡 P2 | PERFORMANCE | `src/pages/portal/akquise-manager/AkquiseMandate.tsx:1` | 1.123 Zeilen | M |
| B-032 | 🟡 P2 | PERFORMANCE | `src/pages/portal/office/EmailTab.tsx:1` | 1.099 Zeilen | M |
| B-033 | 🟡 P2 | PERFORMANCE | `src/components/shared/CreateContextDialog.tsx:1` | 1.050 Zeilen | M |
| B-034 | 🟡 P2 | PERFORMANCE | `src/hooks/useProperties.ts` | 7 ungepaginierte Properties-Queries | S |
| B-035 | 🟡 P2 | PERFORMANCE | `src/hooks/useListings*.ts` | 4 ungepaginierte Listings-Queries | S |
| B-036 | 🟡 P2 | REACT | `src/hooks/` | 93 `useEffect`-Calls in Hooks — wahrscheinlich exhaustive-deps Violations | M |
| B-037 | 🟡 P2 | DB | 257 Tabellen | Tabellen ohne `created_at` — fehlende Audit-Trail-Daten | L |
| B-038 | 🟡 P2 | HYGIENE | `src/` | 403 `console.*`-Aufrufe in produktivem Code (59 `console.log`, 265 `console.error`) | M |
| B-039 | 🟡 P2 | HYGIENE | `supabase/functions/` | 733 `console.*`-Aufrufe in Edge Functions | M |
| B-040 | 🟡 P2 | HYGIENE | `src/components/projekte/`, `src/hooks/` | Namensinkonsistenz: `MOD_13` vs. `MOD-13` — 1369 Vorkommen | S |
| B-041 | 🟡 P2 | EDGE-FN | `supabase/functions/sot-armstrong-advisor/index.ts` | 3.949 Zeilen — größte Edge Function, Split nötig | L |
| B-042 | 🟡 P2 | EDGE-FN | `supabase/functions/sot-ki-browser/index.ts` | 1.163 Zeilen | M |
| B-043 | 🟡 P2 | EDGE-FN | `supabase/functions/sot-project-intake/index.ts` | 939 Zeilen | M |
| B-044 | 🟡 P2 | EDGE-FN | `supabase/functions/sot-inbound-receive/index.ts` | 872 Zeilen | M |
| B-045 | 🟡 P2 | EDGE-FN | `supabase/functions/sot-mail-sync/index.ts` | 925 Zeilen | M |
| B-046 | 🟡 P2 | DB | `supabase/migrations/` | 209 Trigger — keine automatisierte Validierung ob Trigger-Spalten noch existieren | L |
| B-047 | 🟡 P2 | SECURITY | `supabase/functions/sot-credit-webhook/index.ts:56` | Fallback ohne Webhook-Secret nimmt unverifizierte Stripe-Events an (Dev-Mode) | S |
| B-048 | 🟡 P2 | HYGIENE | `src/lib/generateLegalDocumentPdf.ts:1` | 935 Zeilen — Legal-Dokument-Generator | M |
| B-049 | 🟡 P2 | REACT | `src/integrations/supabase/types.ts:1` | 22.146 Zeilen auto-generated types — kein Splitting nach Modulen | S |
| B-050 | 🟡 P2 | PERFORMANCE | `src/manifests/armstrongManifest.ts:1` | 4.369 Zeilen Manifest — zu groß, kein Lazy-Split | M |

---

## P3 — Nice-to-have

| ID | Priorität | Kategorie | Datei:Zeile | Problem | Fix-Aufwand |
|----|-----------|-----------|-------------|---------|-------------|
| B-051 | 🟢 P3 | HYGIENE | `src/` | Magic Numbers/Strings ohne Konstante (z.B. `'MOD_13'`, Timeout-Werte) | M |
| B-052 | 🟢 P3 | HYGIENE | `src/` | Import-Sortierung inkonsistent (kein enforced ordering) | XS |
| B-053 | 🟢 P3 | UX | `src/pages/` | Fehlende Loading-States bei Edge Function Calls | M |
| B-054 | 🟢 P3 | PERFORMANCE | `src/` | Fehlendes Code-Splitting für Admin-Bereich (alles in einem Bundle) | L |
| B-055 | 🟢 P3 | DB | `supabase/migrations/` | Migrations-Namen sind UUIDs — schwer lesbar für Review | S |
| B-056 | 🟢 P3 | TYPESCRIPT | `src/hooks/` | Hooks ohne expliziten Return-Type | M |
| B-057 | 🟢 P3 | HYGIENE | `supabase/functions/` | Deno-Import-Versionen inkonsistent (`@2.39.3` vs. `@2.49.1` vs. `@2`) | S |
| B-058 | 🟢 P3 | DB | `supabase/migrations/` | Keine automatisierte Migration-Gap-Detektion | S |
| B-059 | 🟢 P3 | UX | `src/components/` | Fehlende aria-labels und Barrierefreiheit | L |
| B-060 | 🟢 P3 | HYGIENE | `public/` | Analyse-Dokumente (`.md`, `.txt`) liegen im `public/`-Ordner und sind public zugänglich | XS |

---

## Gesamtübersicht

### Anzahl pro Priorität

| Priorität | Anzahl |
|-----------|--------|
| 🔴 P0 (Blocker) | 10 |
| 🟠 P1 (Kritisch) | 15 |
| 🟡 P2 (Wichtig) | 25 |
| 🟢 P3 (Nice-to-have) | 10 |
| **Gesamt** | **60** |

### Anzahl pro Kategorie

| Kategorie | P0 | P1 | P2 | P3 | Gesamt |
|-----------|----|----|----|----|--------|
| SECURITY | 6 | 3 | 1 | 0 | 10 |
| TYPESCRIPT | 0 | 5 | 5 | 1 | 11 |
| REACT | 0 | 1 | 1 | 0 | 2 |
| PERFORMANCE | 0 | 3 | 7 | 1 | 11 |
| DB | 0 | 2 | 3 | 3 | 8 |
| EDGE-FN | 0 | 2 | 5 | 0 | 7 |
| UX | 0 | 0 | 0 | 2 | 2 |
| HYGIENE | 0 | 0 | 5 | 4 | 9 |
| **Gesamt** | **6** | **16** | **27** | **11** | **60** |

> **Hinweis**: B-004 (RLS fehlt auf 32 Tabellen) und B-029 (1301 any-Vorkommen) sind Sammelpositionen für viele Einzelbefunde.
> Vollständige Details in den Detaildokumenten 01–05.
