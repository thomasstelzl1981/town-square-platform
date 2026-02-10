---
item_code: KB.SYSTEM.005
category: system
content_type: article
title_de: "Rollenmodell: 6 aktive Rollen + Tile-Steuerung"
summary_de: "Konsolidiertes Rollenmodell mit membership_role als SSOT für Tile-Aktivierung."
version: "2.0.0"
status: "published"
scope: "global"
confidence: "verified"
valid_until: null
sources:
  - "src/constants/rolesMatrix.ts (Code-SSOT)"
  - "spec/current/01_platform/ACCESS_MATRIX.md"
---

# Rollenmodell im System of a Town

**SSOT:** `src/constants/rolesMatrix.ts`  
**DB-Funktion:** `get_tiles_for_role(membership_role)`

## Zwei Rollen-Systeme

| System | Tabelle | Zweck |
|--------|---------|-------|
| `membership_role` | `memberships` | Tenant-bezogen, steuert Tile-Aktivierung |
| `app_role` | `user_roles` | Global, steuert Zone-1-Zugang und Overrides |

---

## 6 Aktive Rollen

| Rolle | membership_role | app_role | Module |
|-------|----------------|----------|--------|
| Platform Admin | `platform_admin` | `platform_admin` | Alle 21 |
| Super-User | `org_admin` | `super_user` | Alle 21 |
| Standardkunde | `org_admin` | — | 14 Basis |
| Akquise-Manager | `akquise_manager` | `akquise_manager` | 14 + MOD-12 |
| Finanzierungsmanager | `finance_manager` | `finance_manager` | 14 + MOD-11 |
| Vertriebspartner | `sales_partner` | `sales_partner` | 14 + MOD-09/10 |

---

## Tile-Steuerung

Die membership_role bestimmt automatisch die freigeschalteten Module:

```
org_admin        → 14 Basis-Module
sales_partner    → 14 Basis + MOD-09, MOD-10
finance_manager  → 14 Basis + MOD-11
akquise_manager  → 14 Basis + MOD-12
platform_admin   → Alle 21 Module
```

**Super-User:** membership_role bleibt `org_admin`, aber `user_roles.role = super_user` schaltet alle 21 Module frei.

---

## Rollenzuweisung

1. `memberships.role` — Tenant-bezogene Basis-Rolle
2. `user_roles.role` — Globale Spezialrechte (Zone 1, Super-User)

Armstrong prüft bei jeder Action: `roles_allowed` vs. User-Rollen.

---

## Legacy-Rollen (im Enum, nicht aktiv)

- `internal_ops` — Legacy
- `renter_user` — Legacy
- `future_room_web_user_lite` — Legacy

Diese Werte verbleiben im Enum (Postgres erlaubt kein Entfernen), werden aber nicht mehr vergeben.
