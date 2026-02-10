
# Bereinigung: Muster-Tenants loeschen + Rollendokumentation konsolidieren

## Teil A: Analyse — Doppelte Rollendokumentation

Es existieren **4 verschiedene Stellen** mit Rollendefinitionen, die sich widersprechen:

| # | Datei | Inhalt | Status |
|---|-------|--------|--------|
| 1 | `src/constants/rolesMatrix.ts` | 6 Rollen, 21 Module, BASE_TILES, SSOT-Funktionen | AKTUELL — Code-SSOT |
| 2 | `spec/current/01_platform/ACCESS_MATRIX.md` | 5 alte Rollen (org_admin, internal_ops, renter_user), nur MOD-01 bis MOD-10 | VERALTET |
| 3 | `src/data/kb-seeds/v1/KB.SYSTEM.005.md` | Alte Hierarchie (platform_admin > org_admin > org_member > agent_roles) | VERALTET |
| 4 | `src/pages/admin/Users.tsx` (Zeile 68-76) | 7 Rollen hardcoded (inkl. internal_ops, renter_user), kein Bezug zu rolesMatrix | VERALTET |

**Fazit:** Nur `rolesMatrix.ts` ist aktuell. Die anderen 3 Quellen muessen aktualisiert oder als "ersetzt durch rolesMatrix.ts" markiert werden.

---

## Teil B: Muster-Tenants komplett loeschen

### Bestandsaufnahme

| Datenpunkt | Muster-Vermieter | Muster-Verkaeufer | Muster-Partner GmbH |
|-----------|-------------------|--------------------|--------------------|
| Org-ID | b...001 | b...002 | b...003 |
| org_type | client | client | partner |
| Memberships | 1 (thomas.stelzl) | 1 (thomas.stelzl) | 1 (thomas.stelzl) |
| Tiles | 14 | 14 | 16 |
| Storage-Nodes | 26 | 26 | 26 |
| Properties | 0 | 0 | 0 |
| Listings | 0 | 0 | 0 |
| Contacts | 0 | 0 | 0 |
| Documents | 0 | 0 | 0 |
| Units | 0 | 0 | 0 |

Keine Business-Daten vorhanden — sauber loeschbar.

### Loesch-Reihenfolge (FK-Constraints beachten)

```text
1. storage_nodes       (78 Zeilen) — kein FK auf andere Tabellen
2. tenant_tile_activation (44 Zeilen) — FK auf organizations
3. memberships         (3 Zeilen) — FK auf organizations + auth.users
4. organizations       (3 Zeilen) — Stamm-Entitaet
```

### Auswirkung auf Auth-User

Nach dem Loeschen hat thomas.stelzl nur noch EINE Membership:
- `System of a Town` (internal) als `platform_admin`

Das ist der gewuenschte Zustand: Ein Admin-User, ein interner Tenant.

---

## Teil C: Users.tsx ROLES-Array aktualisieren

Zeile 68-76 in `Users.tsx` definiert ein eigenes ROLES-Array mit 7 Werten, das NICHT aus `rolesMatrix.ts` importiert wird. Das muss synchronisiert werden:

**Aktuell (veraltet):**
- platform_admin, org_admin, internal_ops, sales_partner, renter_user, finance_manager, akquise_manager

**Neu (aus rolesMatrix.ts abgeleitet):**
- Die ROLES-Liste wird aus `ROLES_CATALOG` + `LEGACY_ROLES` generiert
- Legacy-Rollen (internal_ops, renter_user, future_room_web_user_lite) werden als "Legacy" markiert
- `org_admin` bleibt als membership_role verfuegbar (fuer Membership-Verwaltung)

---

## Teil D: Spec-Dokumente aktualisieren

### ACCESS_MATRIX.md
- Rollen-Tabelle aktualisieren: 6 aktive Rollen statt 5 alte
- Modul-Matrix: 21 Module statt 10
- Verweis auf `rolesMatrix.ts` als Code-SSOT hinzufuegen

### KB.SYSTEM.005.md
- Hierarchie aktualisieren auf das neue 6-Rollen-Modell
- Verweis auf `rolesMatrix.ts` als SSOT
- Alte org_member und agent_roles Konzepte als Legacy markieren

---

## Implementierungsschritte

| # | Aktion | Datei/Bereich |
|---|--------|--------------|
| 1 | DB Migration: Muster-Tenants loeschen | DELETE storage_nodes, tenant_tile_activation, memberships, organizations fuer b...001, b...002, b...003 |
| 2 | Users.tsx: ROLES-Array synchronisieren | Import aus rolesMatrix.ts oder mindestens konsistent machen |
| 3 | ACCESS_MATRIX.md aktualisieren | 6 Rollen, 21 Module, SSOT-Verweis |
| 4 | KB.SYSTEM.005.md aktualisieren | Neue Hierarchie, SSOT-Verweis |

## Was NICHT gemacht wird

- Keine neuen Tenants anlegen (User will nur thomas.stelzl im System)
- Keine Aenderung an rolesMatrix.ts (ist bereits aktuell)
- Keine Aenderung an RolesManagement.tsx (ist bereits aktuell)
- Keine Aenderung an handle_new_user() (bereits aktualisiert)
