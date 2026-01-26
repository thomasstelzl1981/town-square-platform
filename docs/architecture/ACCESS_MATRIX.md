# ACCESS MATRIX

**Version:** v1.0  
**Datum:** 2026-01-26

---

## Rollen-Übersicht

| Rolle | Zone | Beschreibung |
|-------|------|--------------|
| `platform_admin` | Zone 1 | God Mode, voller Zugriff auf alle Tenants |
| `org_admin` | Zone 2 | Tenant-Admin, voller Zugriff auf eigenen Tenant |
| `internal_ops` | Zone 2 | Operativer Mitarbeiter |
| `sales_partner` | Zone 2 | Vertriebspartner (MOD-09/10) |
| `renter_user` | Zone 2 | Mieter (Miety Andockpunkt) |

---

## Modul-Zugriff nach Rolle

| Modul | platform_admin | org_admin | internal_ops | sales_partner | renter_user |
|-------|---------------|-----------|--------------|---------------|-------------|
| MOD-01 Stammdaten | ✓ | ✓ | ✓ (read) | ✓ (own) | ✓ (own) |
| MOD-02 KI Office | ✓ | ✓ | ✓ | ✓ | — |
| MOD-03 DMS | ✓ | ✓ | ✓ | ✓ (limited) | ✓ (limited) |
| MOD-04 Immobilien | ✓ | ✓ | ✓ | — | — |
| MOD-05 MSV | ✓ | ✓ | ✓ | — | ✓ (own unit) |
| MOD-06 Verkauf | ✓ | ✓ | ✓ | — | — |
| MOD-07 Finanzierung | ✓ | ✓ | ✓ | — | — |
| MOD-08 Investment-Suche | ✓ | ✓ | ✓ | ✓ | — |
| MOD-09 Vertriebspartner | ✓ | — | — | ✓ | — |
| MOD-10 Leadgenerierung | ✓ | — | — | ✓ | — |

---

## Modul-Sichtbarkeit nach Registrierung

| Registrierungsweg | Sichtbare Module |
|-------------------|------------------|
| SoT (System of a Town) | MOD-01 bis MOD-08 |
| Kaufy (Marktplatz) | MOD-01 bis MOD-10 |

---

## Zone 1 Admin-Funktionen

| Funktion | platform_admin | org_admin |
|----------|---------------|-----------|
| Organizations CRUD | ✓ | — |
| User Management | ✓ | — |
| Tile Catalog | ✓ | — |
| Integrations Registry | ✓ | — |
| Oversight (alle Tenants) | ✓ | — |
| Lead Pool | ✓ | — |
| Partner Verification | ✓ | — |
| Commission Approval | ✓ | — |
| Audit Log (global) | ✓ | — |

---

## Daten-Zugriff nach Rolle

### Properties/Units

| Aktion | platform_admin | org_admin | internal_ops | sales_partner |
|--------|---------------|-----------|--------------|---------------|
| List (own tenant) | ✓ | ✓ | ✓ | — |
| Create | ✓ | ✓ | — | — |
| Update | ✓ | ✓ | ✓ | — |
| Delete | ✓ | ✓ | — | — |

### Listings (MOD-06)

| Aktion | platform_admin | org_admin | internal_ops | sales_partner |
|--------|---------------|-----------|--------------|---------------|
| List (own tenant) | ✓ | ✓ | ✓ | — |
| List (partner-visible) | — | — | — | ✓ |
| Create | ✓ | ✓ | — | — |
| Update | ✓ | ✓ | ✓ | — |
| Publish | ✓ | ✓ | — | — |

### Leads (MOD-10)

| Aktion | platform_admin | org_admin | sales_partner |
|--------|---------------|-----------|---------------|
| Pool (all) | ✓ | — | — |
| Assign | ✓ | — | — |
| Own Leads | — | — | ✓ |
| Accept/Reject | — | — | ✓ |
| Deal CRUD | — | — | ✓ |

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

### Partner-Visibility (Listings)

```sql
-- Partner sieht nur freigegebene Listings
CREATE POLICY "partner_listings" ON listings
FOR SELECT
USING (
  partner_visibility = 'all'
  OR EXISTS (
    SELECT 1 FROM listing_partner_visibility lpv
    WHERE lpv.listing_id = listings.id
    AND lpv.partner_org_id IN (
      SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
    )
  )
);
```

---

*Dieses Dokument definiert die Zugriffskontrolle für das gesamte System.*
