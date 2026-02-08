# ACCESS MATRIX

**Version:** v2.0  
**Datum:** 2026-02-08

---

## Rollen-Übersicht

| Rolle | Zone | Beschreibung |
|-------|------|--------------|
| `platform_admin` | Zone 1 | God Mode, voller Zugriff auf alle Tenants |
| `org_admin` | Zone 2 | Tenant-Admin, voller Zugriff auf eigenen Tenant |
| `internal_user` | Zone 2 | Operativer Mitarbeiter (DB: `internal_ops`) |
| `sales_partner` | Zone 2 | Vertriebspartner (MOD-08/09/10) |
| `finance_manager` | Zone 2 | Finanzierungsmanager (MOD-11) |
| `akquise_manager` | Zone 2 | Akquise-Manager (MOD-12) |
| `future_room_web_user_lite` | Zone 3 Entry | Zone-3-Registrierung (eingeschränkt) |
| `tenant_renter_lite` | Zone 2 Andock | Mieter mit eigenem Mini-Tenant (DB: `renter_user`) |

---

## Modul-Zugriff nach Rolle

| Modul | platform_admin | org_admin | internal_user | sales_partner | finance_manager | akquise_manager | lite_roles |
|-------|---------------|-----------|---------------|---------------|-----------------|-----------------|------------|
| MOD-00 Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (limited) |
| MOD-01 Stammdaten | ✓ | ✓ | ✓ (read) | ✓ (own) | — | — | ✓ (own) |
| MOD-02 KI Office | ✓ | ✓ | ✓ | ✓ | — | — | — |
| MOD-03 DMS | ✓ | ✓ | ✓ | ✓ (limited) | ✓ (Finanz-Docs) | ✓ | ✓ (limited) |
| MOD-04 Immobilien | ✓ | ✓ | ✓ | — | — | ✓ (limited) | — |
| MOD-05 MSV | ✓ | ✓ | ✓ | — | — | — | ✓ (own unit) |
| MOD-06 Verkauf | ✓ | ✓ | ✓ | ✓ (read) | — | — | — |
| MOD-07 Finanzierung | ✓ | ✓ | ✓ | ✓ (Status) | ✓ (read) | — | ✓ (Selbstauskunft) |
| MOD-08 Investment-Suche | ✓ | ✓ | ✓ | ✓ | — | ✓ (Mandate) | — |
| MOD-09 Vertriebspartner | ✓ | — | — | ✓ | — | — | — |
| MOD-10 Leads | ✓ | ✓ | — | ✓ | — | — | — |
| MOD-11 Finanzierungsmanager | ✓ | — | — | — | ✓ (SoT) | — | — |
| MOD-12 Akquise-Manager | ✓ | — | — | — | — | ✓ (SoT) | — |
| MOD-13 Projekte | ✓ | ✓ | ✓ | — | — | — | — |
| MOD-14 Communication Pro | ✓ | ✓ | ✓ | — | — | — | ✓ (limited) |
| MOD-15 Fortbildung | ✓ | ✓ | — | — | — | — | — |
| MOD-16 Services | ✓ | ✓ | — | — | — | — | — |
| MOD-17 Car-Management | ✓ | ✓ | ✓ | — | — | — | — |
| MOD-18 Finanzanalyse | ✓ | ✓ | — | — | — | — | — |
| MOD-19 Photovoltaik | ✓ | ✓ | — | — | — | — | — |
| MOD-20 Miety | ✓ | ✓ | — | — | — | — | ✓ |

---

## Spezialrollen-Details

### MOD-11: Finanzierungsmanager (finance_manager)

- **Intake:** Zone 1 FutureRoom weist Fälle zu
- **SoT:** Nach Annahme ist MOD-11 die Source of Truth
- **Zugriff:** Dashboard, Fälle, Kommunikation, Status

### MOD-12: Akquise-Manager (akquise_manager)

- **Intake:** Zone 1 Acquiary weist Mandate zu
- **SoT:** Nach Annahme ist MOD-12 die Source of Truth
- **Zugriff:** Dashboard, Mandate, Objekteingang, Tools

---

## Lite-Rollen

### future_room_web_user_lite

- Registrierung über Zone 3 FutureRoom
- Kein voller Portal-Zugang
- Module: MOD-00 (limited), MOD-07 (Selbstauskunft)

### tenant_renter_lite

- Einladung aus MOD-05 (MSV)
- Eigener Mini-Tenant für Mieter
- Module: MOD-03 (eigene), MOD-14 (limited), MOD-20 (Miety)

---

## Zone 1 Admin-Funktionen

| Funktion | platform_admin | org_admin |
|----------|---------------|-----------|
| Organizations CRUD | ✓ | — |
| User Management | ✓ | — |
| Tile Catalog | ✓ | — |
| Rollen & Berechtigungen | ✓ | — |
| Integrations Registry | ✓ | — |
| Oversight (alle Tenants) | ✓ | — |
| Lead Pool | ✓ | — |
| Partner Verification | ✓ | — |
| Commission Approval | ✓ | — |
| FutureRoom Governance | ✓ | — |
| Acquiary Governance | ✓ | — |
| Audit Log (global) | ✓ | — |

---

## DB-Enum-Status

### membership_role (aktiv genutzt)

```sql
-- Aktueller Stand nach Migration
'platform_admin'
'org_admin'
'internal_ops'        -- Soll: internal_user (Phase 11)
'sales_partner'
'renter_user'         -- Soll: tenant_renter_lite (Phase 11)
'finance_manager'
'akquise_manager'     -- NEU hinzugefügt
'future_room_web_user_lite'  -- NEU hinzugefügt
```

### app_role (user_roles Tabelle - leer, Bereinigung Phase 11)

```sql
'platform_admin'
'moderator'           -- nicht in Spezifikation
'user'                -- nicht in Spezifikation
'finance_manager'
'akquise_manager'
```

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

### Rollen-spezifische Policies

```sql
-- Nur finance_manager darf MOD-11 Daten sehen
CREATE POLICY "finance_manager_access" ON finance_cases
FOR SELECT
USING (
  public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
    AND m.role = 'finance_manager'
    AND m.tenant_id = finance_cases.tenant_id
  )
);
```

---

## Changelog

| Version | Datum | Änderungen |
|---------|-------|------------|
| v2.0 | 2026-02-08 | 8 Rollen, MOD-11/12, Lite-Rollen, DB-Status |
| v1.0 | 2026-01-26 | Initiale 5 Rollen |

---

*Dieses Dokument definiert die Zugriffskontrolle für das gesamte System.*
