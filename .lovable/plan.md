

# ZBC Implementation — Phasen B, C, D (Schritte 4-9)

---

## Schritt 4 — rolesMatrix.ts als Seed-Only klassifizieren (R-001)

### Aenderungen

**Datei: `src/constants/rolesMatrix.ts`**
- Header-Kommentar aendern: `@status seed-only — Runtime-SSOT ist DB tile_catalog / get_tiles_for_role()`
- Alle Exports bleiben erhalten (keine Breaking Changes)
- JSDoc fuer `getTilesForRole()`, `hasModuleAccess()`, `getModulesForRole()` ergaenzen: `@deprecated Runtime-Code soll get_tiles_for_role() RPC nutzen`

**Analyse der Runtime-Konsumenten:**
- `src/pages/admin/RolesManagement.tsx` importiert `hasModuleAccess` — ist ein Admin-Kontext (Zone 1), darf bleiben
- Keine weiteren Runtime-Konsumenten in Portal/Zone-2-Code gefunden

**Ergebnis:** Nur Header-Kommentar-Aenderung + JSDoc-Deprecation-Marker noetig. Keine Code-Migration erforderlich, da die einzige Nutzung bereits im Admin-Kontext liegt.

---

## Schritt 5 — tile_catalog und routesManifest synchronisieren (R-002)

### Aenderungen

**Datei: `src/goldenpath/devValidator.ts`**
- Neue Funktion `validateTileCatalogSync()` hinzufuegen
- Laedt tile_catalog Eintraege via Supabase RPC
- Vergleicht `tile_code` gegen routesManifest Module-Keys (`MOD-00` bis `MOD-20`)
- DEV-only `console.error` bei Mismatches

---

## Schritt 6 — Contract Index erstellen (R-005)

### Neue Dateien

**`spec/current/06_api_contracts/INDEX.md`**
- Uebersichtstabelle aller 6 Contracts mit Richtung, Trigger, Code-Fundstelle, Status

**`spec/current/06_api_contracts/CONTRACT_LEAD_CAPTURE.md`**
- Direction: Z3 -> Z1
- Trigger: Form-Submit auf Kaufy/Website
- Code: `supabase/functions/sot-lead-inbox/`
- Payload: lead_id, source_url, contact_data
- SoT nach Uebergabe: Z1 Lead Pool

**`spec/current/06_api_contracts/CONTRACT_FINANCE_SUBMIT.md`**
- Direction: Z2 -> Z1
- Trigger: "Anfrage absenden" in MOD-07
- Code: Status-Enum in `finance_requests` Tabelle
- Payload: finance_request_id, tenant_id, status='submitted'
- SoT nach Uebergabe: Z1 FutureRoom

**`spec/current/06_api_contracts/CONTRACT_MANDATE_ASSIGNMENT.md`**
- Direction: Z1 -> Z2
- Trigger: Admin-Zuweisung in FutureRoom/Acquiary
- Code: `supabase/functions/sot-finance-manager-notify/`, `src/components/admin/acquiary/`
- Payload: mandate_id, assigned_manager_user_id
- SoT nach Uebergabe: Z2 (MOD-11 oder MOD-12)

**`spec/current/06_api_contracts/CONTRACT_ONBOARDING.md`**
- Direction: Auth -> Z2
- Trigger: User-Signup (INSERT on auth.users)
- Code: SQL Trigger `on_auth_user_created` -> `handle_new_user()`
- Payload: user_id, email, raw_user_meta_data
- SoT nach Uebergabe: Z2 (profiles + organizations + memberships)

**`spec/current/06_api_contracts/CONTRACT_DATA_ROOM_ACCESS.md`**
- Direction: Z2 -> Z3
- Trigger: Freigabe-Aktion in MOD-06
- Code: `access_grants` Tabelle
- Payload: scope_id, subject_id, tenant_id, access_level
- SoT nach Uebergabe: Z3 (read-only Zugriff)

**`spec/current/06_api_contracts/CONTRACT_EMAIL_INBOUND.md`**
- Direction: Extern -> Z1
- Trigger: Resend Webhook (email.received)
- Code: `supabase/functions/sot-inbound-receive/`, `supabase/functions/sot-renovation-inbound-webhook/`
- Payload: from, to, subject, body, attachments
- Correlation: routing_token, in_reply_to_message_id, Tender-ID
- SoT nach Uebergabe: Z1 (Inbox oder service_case_inbound)

---

## Schritt 7 — Dokumentation konsolidieren (R-003, R-004)

### Datei-Verschiebungen

- `docs/workflows/GOLDEN_PATH_FINANZIERUNG.md` -> `docs/golden-paths/GOLDEN_PATH_FINANZIERUNG.md`
- `docs/workflows/GOLDEN_PATH_SANIERUNG.md` -> `docs/golden-paths/GOLDEN_PATH_SANIERUNG.md`
- `docs/workflows/GOLDEN_PATH_E2E.md` -> `docs/golden-paths/GOLDEN_PATH_E2E.md`

Da Lovable keine Datei-Verschiebung unterstuetzt: Inhalte werden in neue Dateien unter `docs/golden-paths/` geschrieben, alte Dateien unter `docs/workflows/` werden geloescht.

---

## Schritt 8 — GoldenPathGuard in ManifestRouter einbinden

### Aenderungen

**Datei: `src/router/ManifestRouter.tsx`**

- Import: `GoldenPathGuard` aus `@/goldenpath/GoldenPathGuard`
- Im Zone-2-Bereich: MOD-04 Dynamic Routes (`/portal/immobilien/:id/*`) werden mit `<GoldenPathGuard>` gewrappt
- Konkret: Der `ImmobilienPage`-Eintrag im `portalModulePageMap` bleibt, aber die Dynamic Route fuer `:id` erhaelt den Guard

**Problem:** Aktuell nutzt ManifestRouter ein generisches Pattern — alle Module bekommen `<ModulePage />` mit internem Routing. Der Guard muss auf einer Ebene hoeher eingreifen oder das ModulePage-Pattern muss fuer MOD-04 einen Sonderfall erhalten.

**Loesung:** Da `ImmobilienPage` intern seine eigenen `<Routes>` mit `:id`-Pfaden rendert, wird der Guard dort eingebaut statt im ManifestRouter. Das bedeutet: `src/pages/portal/ImmobilienPage.tsx` importiert den Guard und wrappt die `:id`-Route.

**Betroffene Datei:** `src/pages/portal/ImmobilienPage.tsx` — Guard um die `:id`-Route

---

## Schritt 9 — devValidator beim App-Start triggern

### Aenderungen

**Datei: `src/App.tsx`**
- Import der Validierungsfunktionen (DEV-only)
- In einem `useEffect` (oder top-level if-Block): `validateGoldenPaths()`, `validateZoneBoundaries()`, `validateTileCatalogSync()` aufrufen
- Nur wenn `import.meta.env.DEV` true ist

---

## Zusammenfassung der Aenderungen

| Schritt | Dateien | Art |
|---------|---------|-----|
| 4 | `src/constants/rolesMatrix.ts` | Edit (Header + JSDoc) |
| 5 | `src/goldenpath/devValidator.ts` | Edit (neue Funktion) |
| 6 | `spec/current/06_api_contracts/INDEX.md` + 6 CONTRACT_*.md | Neu (7 Dateien) |
| 7 | `docs/golden-paths/` (3 neue), `docs/workflows/` (3 loeschen) | Neu + Delete |
| 8 | `src/pages/portal/ImmobilienPage.tsx` | Edit (Guard-Wrap) |
| 9 | `src/App.tsx` | Edit (DEV-Validator-Aufruf) |

**Gesamt:** 7 neue Dateien, 4 editierte Dateien, 3 geloeschte Dateien

