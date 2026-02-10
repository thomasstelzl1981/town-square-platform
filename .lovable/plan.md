

# Strategie: Entwicklungsaccount isolieren und fuer User bereitstellen

## Aktuelle Situation (Befund)

### Was existiert
- **1 Auth-User mit Daten**: `thomas.stelzl@systemofadown.com` — hat Profil, Membership, ist `platform_admin` der internen Org "System of a Town"
- **1 Waisen-User**: `test@example.com` — existiert in auth.users, hat aber **kein Profil und keine Membership** (Trigger hat nicht gefeuert)
- **1 Seed-Artefakt**: `admin@systemofatown.com` mit fester UUID `b0000000-...` — nur in auth.users, keine public-Daten
- **1 Organisation**: "System of a Town" (type: `internal`) mit 20 Tile-Aktivierungen
- **0 Eintraege** in `user_roles` — kein einziger User hat eine fachliche Rolle zugewiesen

### Kritisches Problem: Signup-Trigger fehlt
Die Funktion `handle_new_user()` existiert zwar als Code in den Migrationen, aber der **Trigger auf `auth.users` ist NICHT installiert**. Das bedeutet:
- Wenn sich ein neuer User registriert, bekommt er **keine Organisation, kein Profil, keine Membership**
- Er landet in einem leeren Zustand und kann nichts sehen
- Das erklaert auch, warum `test@example.com` verwaist ist

### Dev-Mode ist deaktiviert
`isDevelopmentEnvironment()` gibt immer `false` zurueck. Login wird erzwungen. Die `DEV_TENANT_UUID`-Referenzen in 4 Dateien sind aktuell tote Codepfade — nur noch in `useGoldenPathSeeds` und `useFinanceRequest` als Fallback aktiv.

---

## Strategie: 3-Schichten-Modell

```text
Schicht 1: INTERNAL ORG (Plattform-Betrieb)
  "System of a Town" | org_type=internal
  User: thomas.stelzl (platform_admin)
  Zweck: Zone 1 Admin, Oversight, Konfiguration
  
Schicht 2: DEMO/TEST ORGS (Entwicklung + QA)
  "Muster-Kunde GmbH" | org_type=client
  "Muster-Partner GmbH" | org_type=partner
  Zweck: Alle Rollen und Flows testen, bevor echte User kommen
  
Schicht 3: PRODUCTION ORGS (echte User)
  Werden automatisch bei Signup erstellt
  Jeder neue User bekommt eigene client-Org + Tiles
```

---

## Implementierungsplan

### Schritt 1: Signup-Trigger reparieren (KRITISCH)

Der `handle_new_user`-Trigger muss auf `auth.users` installiert werden. Ohne ihn funktioniert kein Signup.

**Migration:**
- `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()`
- Die Funktion existiert bereits und erstellt: Organisation (type=client) + Profil + Membership (role=org_admin)

**Erweiterung der Funktion:**
- Standard-Tiles aktivieren (MOD-01 Stammdaten, MOD-03 DMS, MOD-04 Immobilien) fuer jede neue client-Org
- Damit sieht jeder neue User sofort ein funktionierendes Portal

### Schritt 2: Verwaiste User aufraeumen

- `test@example.com` und `admin@systemofatown.com` (Seed-Artefakt) aus auth.users entfernen oder mit korrekten Profilen/Memberships versehen
- Entscheidung: Loeschen ist sauberer, da sie keine echten Daten haben

### Schritt 3: Test-Personas anlegen

Fuer jede Rolle eine eigene Organisation + User + Membership + user_role:

| Persona | E-Mail | Org-Name | org_type | Rolle (user_roles) |
|---------|--------|----------|----------|-------------------|
| Vermieter | vermieter@test.sot.dev | Muster-Vermieter | client | — (Standard-User) |
| Verkaeufer | verkaeufer@test.sot.dev | Muster-Verkaeufer | client | — |
| Vertriebspartner | partner@test.sot.dev | Muster-Partner GmbH | partner | sales_partner |
| Akquise-Manager | akquise@test.sot.dev | (Membership in Internal) | — | acquisition_manager |
| Finance-Manager | finance@test.sot.dev | (Membership in Internal) | — | finance_manager |

Jede Persona bekommt die passenden Tile-Aktivierungen gemaess der Portal-Entry-Role-Mapping-Regel.

### Schritt 4: DEV_TENANT_UUID-Referenzen bereinigen

- `useFinanceRequest.ts`: Fallback auf `activeOrganization?.id` statt hardcoded UUID
- `useGoldenPathSeeds.ts`: Tenant-ID dynamisch aus AuthContext beziehen
- `AuthContext.tsx`: DEV_MOCK_* Konstanten koennen bleiben (als Emergency-Fallback), aber `isDevelopmentEnvironment()` bleibt `false`

### Schritt 5: Org-Switcher validieren

Der bestehende Org-Switcher im Header muss fuer den `platform_admin` funktionieren:
- thomas.stelzl bekommt zusaetzliche Memberships in den Test-Orgs
- Damit kann er zwischen Internal (Zone 1) und den Test-Orgs (Zone 2) wechseln
- So wird der gesamte Flow aus beiden Perspektiven testbar

---

## Was das fuer spaetere echte User bedeutet

1. **Signup**: User registriert sich -> Trigger erstellt automatisch Organisation + Profil + Membership + Standard-Tiles
2. **Isolation**: Jeder User sieht NUR seine eigenen Daten (RLS via tenant_id)
3. **Keine Vermischung**: Die interne Org und Test-Orgs sind komplett getrennt von Production-Orgs
4. **Skalierung**: Ob 1 oder 1000 Organisationen — das System behandelt alle gleich

---

## Dateien-Uebersicht

| Aktion | Datei/Bereich | Beschreibung |
|--------|--------------|-------------|
| DB Migration | Trigger installieren | `on_auth_user_created` + `handle_new_user` erweitern (Tile-Aktivierung) |
| DB Migration | Test-Personas | Organisationen, Profiles, Memberships, user_roles fuer 5 Personas |
| DB Migration | Cleanup | Verwaiste auth.users entfernen |
| Code | `useFinanceRequest.ts` | DEV_TENANT_UUID Fallback durch dynamischen Tenant ersetzen |
| Code | `useGoldenPathSeeds.ts` | Hardcoded UUID durch AuthContext-Tenant ersetzen |
| KEINE | `AuthContext.tsx` | Bleibt wie ist (Dev-Mode deaktiviert, Mocks als Notfall-Fallback) |
| KEINE | Routing/Manifest | Kein Drift |

---

## Risiken und Hinweise

- **Auth.users ist ein reserviertes Schema**: Wir koennen dort keine Zeilen loeschen via Migration. Die Seed-Artefakte muessen manuell oder via Edge Function bereinigt werden.
- **Tile-Aktivierung bei Signup**: Die `handle_new_user`-Funktion muss erweitert werden, um Standard-Tiles zu aktivieren. Ohne das sieht ein neuer User ein leeres Portal.
- **Passwort fuer Test-User**: Die Test-Personas werden via Migration in `profiles`/`memberships`/`organizations` angelegt, aber die auth.users-Eintraege muessen separat erstellt werden (da wir auth-Schema nicht direkt beschreiben koennen).

