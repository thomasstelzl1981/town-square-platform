
# Demo-Account Architektur — Read-Only Persistent Mode

## Status: Stufe 1-3 implementiert ✅

### Stufe 1: Spinning Wheel Fix ✅
- `endDemo()` in `useDemoAutoLogin.ts`: `navigate('/sot')` wird VOR `signOut()` ausgefuehrt
- `PortalLayout.tsx`: `demoState === 'cleaning'` → sofortiger `<Navigate to="/sot" />` statt Loader

### Stufe 2: Read-Only Guard ✅
- **Frontend:** `useDemoReadOnly.ts` Hook — `isReadOnly`, `showReadOnlyHint()`, `guardAction()` 
- **Backend:** RESTRICTIVE RLS Policy `demo_write_block_*` auf ALLEN Tabellen mit `tenant_id`
  - Funktion: `is_demo_tenant(uuid)` — prueft `organizations.tenant_mode = 'demo'`
  - `USING(true)` erlaubt SELECT, `WITH CHECK(NOT is_demo_tenant(...))` blockiert INSERT/UPDATE/DELETE

### Stufe 3: Demo-Toggles Skip ✅
- `useDemoToggles.ts`: `isDemoSession()` → `toggleAll()` wird sofort uebersprungen (kein Seed/Cleanup)
- Demo-Daten sind persistent im Demo-Tenant vorerfasst

## Offen: Stufe 4 — UX-Entscheidungen fuer Demo-Modus
- Welche Funktionen zeigen wir im Demo? (Magic Intake, Armstrong, etc.)
- Simulation vs. Video vs. Sandbox-Ansatz
- Frontend-Integration von `useDemoReadOnly` in alle Module (schrittweise)
