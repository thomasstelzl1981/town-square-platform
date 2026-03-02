
# Pre-Release Code Cleanup — Abgeschlossen am 02.03.2026

## Phase 1: Security ✅
- RLS Policies gehärtet: brand_articles → platform_admin, property_expenses → tenant_id, zone3_website_settings → platform_admin, armstrong_inbound_tasks → service_role
- Verbleibende USING(true): page_views (gewollt), pet_z1_booking_requests (gewollt, Zone 3 Public)
- Auth Hardening: Anonymous users disabled, auto-confirm disabled

## Phase 2: Dead Code ✅
- MOD-21 KI-Browser komplett entfernt: 5 Pages, 1 Hook, 1 Edge Function, Manifest-Einträge, Billing-Eintrag, moduleContents, Website-Text
- LeadsPage.tsx + leads/ Ordner (legacy, nicht importiert) gelöscht
- pets/ vs petmanager/ sind KEINE Duplikate (MOD-05 vs MOD-22)

## Phase 3: TypeScript Hygiene ✅ (dokumentiert)
- 3.473 `as any` in 238 Dateien identifiziert
- Hauptursache: Tabellen nicht im auto-generierten types.ts (Schema-Regeneration nötig)
- Kategorien: DB-Casts (compliance_documents etc.), JSON-Field-Casts (lead_data), Profile-Field-Casts (reg_34i_*)

## Phase 4: Manifest & Spec Sync ✅
- routesManifest.ts: MOD-21 entfernt (22 Module)
- areaConfig.ts: MOD-21 aus base-Area entfernt
- architectureValidator.ts: sot-ki-browser Referenz entfernt
- billingConstants.ts: ki_browser Eintrag entfernt
- moduleContents.ts: MOD-21 Block entfernt
- sotWebsiteModules.ts: KI-Browser aus Feature-Liste entfernt
- Zone2Router.tsx: ki-browser lazy import entfernt
- Test Suite: 108/108 Tests bestanden (Counts aktualisiert)

## Phase 5: Performance ✅
- Lazy Loading: Alle 3 Zone-Router nutzen React.lazy ✅
- DB Limits: 26 Hooks nutzen explizit .limit() ✅
- Code Splitting: Korrekt konfiguriert

## Phase 6: Freeze & Dokumentation ✅
- modules_freeze.json: MOD-21 als "REMOVED" markiert und frozen
- Plan aktualisiert

## Offene Punkte (nicht-blockierend)
- TypeScript `as any` Bereinigung: Erfordert Schema-Regeneration der types.ts
- Extension in Public: pg_trgm in public schema (Supabase-Standard, nicht kritisch)
- OTP Expiry + Leaked Password Protection: Auth-Config-Themen (via Dashboard)
