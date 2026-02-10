# ACCESS MATRIX

**Version:** v2.0  
**Datum:** 2026-02-10  
**SSOT:** `src/constants/rolesMatrix.ts` (Code-SSOT für Rollen und Tile-Mapping)

---

## Rollen-Übersicht (6 aktive Rollen)

| Rolle | membership_role | app_role | Zone | Module | Beschreibung |
|-------|----------------|----------|------|--------|--------------|
| Platform Admin | `platform_admin` | `platform_admin` | Zone 1 | Alle 21 | God Mode, Zugriff auf alle Tenants |
| Super-User | `org_admin` | `super_user` | Zone 2 | Alle 21 | Vollzugriff durch app_role Override |
| Standardkunde | `org_admin` | — | Zone 2 | 14 Basis | Automatisch bei Signup |
| Akquise-Manager | `akquise_manager` | `akquise_manager` | Zone 2 | 14 + MOD-12 | Akquise-Spezialist |
| Finanzierungsmanager | `finance_manager` | `finance_manager` | Zone 2 | 14 + MOD-11 | Finanzierungsspezialist |
| Vertriebspartner | `sales_partner` | `sales_partner` | Zone 2 | 14 + MOD-09/10 | Partner mit Lead-Zugang |

### Legacy-Rollen (im Enum, nicht aktiv vergeben)

| membership_role | Status |
|----------------|--------|
| `internal_ops` | Legacy — nicht verwendet |
| `renter_user` | Legacy — nicht verwendet |
| `future_room_web_user_lite` | Legacy — nicht verwendet |

---

## Modul-Zugriff nach Rolle

### 14 Basis-Module (alle Rollen)

MOD-00 Dashboard, MOD-01 Stammdaten, MOD-02 KI Office, MOD-03 DMS,
MOD-04 Immobilien, MOD-05 MSV, MOD-06 Verkauf, MOD-07 Finanzierung,
MOD-08 Investment-Suche, MOD-15 Fortbildung, MOD-16 Services,
MOD-17 Car-Management, MOD-18 Finanzanalyse, MOD-20 Miety

### 7 Spezial-Module

| Modul | platform_admin | super_user | client_user | akquise_manager | finance_manager | sales_partner |
|-------|:-:|:-:|:-:|:-:|:-:|:-:|
| MOD-09 Vertriebspartner | ✓ | ✓ | — | — | — | ✓ |
| MOD-10 Leads | ✓ | ✓ | — | — | — | ✓ |
| MOD-11 Finanzierungsmanager | ✓ | ✓ | — | — | ✓ | — |
| MOD-12 Akquise-Manager | ✓ | ✓ | — | ✓ | — | — |
| MOD-13 Projekte | ✓ | ✓ | — | — | — | — |
| MOD-14 Communication Pro | ✓ | ✓ | — | — | — | — |
| MOD-19 Photovoltaik | ✓ | ✓ | — | — | — | — |

---

## Tile-Steuerung

Die Tile-Aktivierung wird durch die DB-Funktion `get_tiles_for_role(membership_role)` gesteuert.
Bei Signup ruft `handle_new_user()` diese Funktion auf.

Für Super-User: `membership_role = org_admin` + Eintrag in `user_roles` mit `app_role = super_user` → alle 21 Module.

---

## Zone 1 Admin-Funktionen

| Funktion | Nur platform_admin |
|----------|--------------------|
| Organizations CRUD | ✓ |
| User Management | ✓ |
| Tile Catalog | ✓ |
| Knowledge Base (global) | ✓ |
| Policies | ✓ |
| Audit Log (global) | ✓ |

---

## RLS-Implementierung

### Standard-Muster

```sql
-- Tenant-Isolation
CREATE POLICY "tenant_isolation" ON table_name
FOR ALL
USING (tenant_id IN (
  SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
));

-- Platform Admin Bypass
CREATE POLICY "platform_admin_all" ON table_name
FOR ALL
USING (public.is_platform_admin());
```

---

*Dieses Dokument wird automatisch aus `src/constants/rolesMatrix.ts` abgeleitet.  
Code-SSOT → Spec-Dokumentation → KB-Seed.*
