

# Konsolidierter Plan: Admin Roles + Tile-Eroeffnung — Saubere Integration

## Analyse: Warum ZWEI Rollen-Systeme?

Aktuell existieren zwei getrennte Enums und Tabellen:

```text
TABELLE 1: memberships (tenant-bezogen)
  ├── Enum: membership_role
  ├── Werte: platform_admin, org_admin, internal_ops, sales_partner,
  │          renter_user, finance_manager, akquise_manager, future_room_web_user_lite
  └── Zweck: Wer gehoert zu welchem Tenant mit welcher Berechtigung?

TABELLE 2: user_roles (global, tenant-unabhaengig)
  ├── Enum: app_role
  ├── Werte: platform_admin, moderator, user, finance_manager, akquise_manager, sales_partner
  └── Zweck: Globale Spezialrechte (z.B. Zone-1-Zugang)
```

**Das Problem:** Keines der beiden Systeme steuert aktuell die Tile-Aktivierung. Die Tiles werden manuell oder pauschal per Migration gesetzt. Es gibt keine automatische Verbindung zwischen Rolle und Modulen.

## Loesung: membership_role als SSOT fuer Tile-Aktivierung

Die `membership_role` ist der richtige Ort, weil:
1. Sie ist TENANT-bezogen — Tiles sind ebenfalls tenant-bezogen (`tenant_tile_activation`)
2. Ein User kann in verschiedenen Tenants verschiedene Rollen haben
3. Sie existiert bereits mit den richtigen Werten

Die `app_role` (user_roles) bleibt bestehen fuer globale Rechte (Zone 1, is_platform_admin), wird aber NICHT fuer Tile-Logik verwendet.

### Rollenmodell (konsolidiert)

| membership_role | Verwendungszweck | Tile-Steuerung | Anmerkung |
|----------------|-----------------|----------------|-----------|
| `org_admin` | Tenant-Eigentuemer | JA — bestimmt Basis-Set | Automatisch bei Signup |
| `sales_partner` | Vertriebspartner | JA — Basis + MOD-09, 10 | Bei Einladung/Zuweisung |
| `finance_manager` | Finanzierungsmanager | JA — Basis + MOD-11 | Bei Einladung/Zuweisung |
| `akquise_manager` | Akquise-Manager | JA — Basis + MOD-12 | Bei Einladung/Zuweisung |
| `platform_admin` | System-Admin | Alle 21 (Override) | Nur fuer SoT-Intern |
| `internal_ops` | Legacy — nicht aktiv | — | Bleibt im Enum, wird nicht genutzt |
| `renter_user` | Legacy — nicht aktiv | — | Bleibt im Enum, wird nicht genutzt |
| `future_room_web_user_lite` | Legacy — nicht aktiv | — | Bleibt im Enum, wird nicht genutzt |

### Neue User-Typen und ihre Zuordnung

Bei der Account-Eroeffnung gibt es 5 waehlbare Pfade:

| User-Typ (UI-Label) | membership_role | Module (Gesamt) |
|---------------------|----------------|-----------------|
| Standardkunde | `org_admin` | 14 Basis-Module |
| Super-User | `org_admin` + app_role `super_user` | Alle 21 Module |
| Akquise-Manager | `akquise_manager` | 14 Basis + MOD-12 = 15 |
| Finanzierungsmanager | `finance_manager` | 14 Basis + MOD-11 = 15 |
| Vertriebspartner | `sales_partner` | 14 Basis + MOD-09 + MOD-10 = 16 |

**Super-User** ist ein Sonderfall: Die membership_role bleibt `org_admin`, aber ein Eintrag in `user_roles` mit `super_user` schaltet alle 21 Module frei. Das haelt die membership_role sauber.

### Modul-Zuordnung im Detail

**14 Basis-Module (alle User-Rollen):**
MOD-00 Dashboard, MOD-01 Stammdaten, MOD-02 KI Office, MOD-03 DMS, MOD-04 Immobilien, MOD-05 MSV, MOD-06 Verkauf, MOD-07 Finanzierung, MOD-08 Investment-Suche, MOD-15 Fortbildung, MOD-16 Services, MOD-17 Car-Management, MOD-18 Finanzanalyse, MOD-20 Miety

**7 Spezial-Module (nur bestimmte Rollen/Super-User):**
MOD-09 Vertriebspartner, MOD-10 Leads, MOD-11 Finanzierungsmanager, MOD-12 Akquise-Manager, MOD-13 Projekte, MOD-14 Communication Pro, MOD-19 Photovoltaik

**Monitoring (geplant, nur dokumentiert):**
Zukuenftig fuer akquise_manager, finance_manager, sales_partner

---

## Implementierungsschritte

### Schritt 1: Datenbank — Tile-Mapping-Funktion erstellen

Neue SECURITY DEFINER Funktion `get_tiles_for_role(membership_role)` die die korrekte Tile-Liste zurueckgibt:

```text
org_admin        → 14 Basis-Module
sales_partner    → 14 Basis + MOD-09 + MOD-10
finance_manager  → 14 Basis + MOD-11
akquise_manager  → 14 Basis + MOD-12
platform_admin   → Alle 21
```

Diese Funktion wird von `handle_new_user()` aufgerufen und kann auch manuell verwendet werden.

### Schritt 2: Datenbank — app_role Enum erweitern

- `super_user` und `client_user` zum `app_role` Enum hinzufuegen
- `super_user` in user_roles aktiviert Override: alle 21 Module

### Schritt 3: Datenbank — handle_new_user() ueberarbeiten

- Aktuell: Hardcoded `['MOD-01', 'MOD-03', 'MOD-04']` als Standard-Tiles
- Neu: Ruft `get_tiles_for_role('org_admin')` auf → 14 Basis-Module
- Neue User bekommen automatisch membership_role `org_admin` (wie bisher)
- Optional: Parameter fuer Rolle aus Signup-Metadata (fuer Spezialrollen-Onboarding)

### Schritt 4: Datenbank — Test-Org Tiles korrigieren

| Test-Org | membership_role | Aktive Tiles |
|----------|----------------|-------------|
| Muster-Vermieter | org_admin | 14 Basis |
| Muster-Verkaeufer | org_admin | 14 Basis |
| Muster-Partner GmbH | sales_partner | 14 Basis + MOD-09 + MOD-10 = 16 |
| System of a Town | platform_admin | Alle 21 |

Tiles entfernen die nicht zur jeweiligen Rolle gehoeren.

### Schritt 5: rolesMatrix.ts — Konsolidierung

- ROLES_CATALOG auf 6 Eintraege: `platform_admin`, `super_user`, `client_user` (= org_admin), `akquise_manager`, `finance_manager`, `sales_partner`
- Jede Rolle zeigt klar: Basis-Module + Zusatz-Module
- MODULE_ROLE_MATRIX aktualisiert mit den 6 Rollen
- Neue Konstante: `BASE_TILES` und `ROLE_EXTRA_TILES` — werden auch vom UI genutzt
- `dbNote` Felder zeigen die Zuordnung zur membership_role

### Schritt 6: RolesManagement.tsx — Komplette Ueberarbeitung

**Tab 1 — Rollen-Katalog:**
- 6 Rollen-Karten mit Basis/Zusatz-Trennung
- Jede Karte zeigt: Label, Beschreibung, Anzahl Module, DB-Mapping (welche membership_role / app_role)
- Super-User-Karte erklaert den Sonderfall (org_admin + app_role super_user)

**Tab 2 — Modul-Rollen-Matrix:**
- 21 Zeilen (MOD-00 bis MOD-20)
- 6 Spalten (platform_admin, super_user, client_user, akquise_manager, finance_manager, sales_partner)
- Farbkodierung: Gruen = Basis (alle haben es), Blau = Zusatz (rollenspezifisch)
- Monitoring-Platzhalter als Info-Zeile am Ende

**Tab 3 — Governance & Eroeffnungsprozess:**
- Dokumentation des Signup-Flows: Was passiert automatisch?
- Mapping-Tabelle: UI-Label → membership_role → app_role → Tiles
- Erklaerung org_admin vs platform_admin
- DB-Status: Aktive Enum-Werte beider Systeme (live aus Konstanten, nicht hardcoded)
- Warning-Banner zu Legacy-Werten (internal_ops, renter_user etc.) anstatt Dev-Mode-Warning

### Schritt 7: useGoldenPathSeeds.ts — DEV_TENANT_UUID bereinigen

Hardcoded UUID durch dynamischen AuthContext-Tenant ersetzen.

---

## Dateien-Uebersicht

| Aktion | Datei/Bereich |
|--------|--------------|
| DB Migration | Neue Funktion `get_tiles_for_role(membership_role)` |
| DB Migration | `app_role` Enum: + `super_user`, + `client_user` |
| DB Migration | `handle_new_user()`: Nutzt `get_tiles_for_role('org_admin')` statt Hardcode |
| DB Migration | Test-Org Tiles: DELETE + rollenspezifisch neu setzen |
| Code | `src/constants/rolesMatrix.ts` — 6 Rollen, BASE_TILES, ROLE_EXTRA_TILES |
| Code | `src/pages/admin/RolesManagement.tsx` — Komplettes Redesign |
| Code | `src/hooks/useGoldenPathSeeds.ts` — DEV_TENANT_UUID entfernen |

## Was NICHT gemacht wird

- Module NICHT umnummerieren (Analyse hat gezeigt: zu riskant)
- membership_role Enum NICHT schrumpfen (Postgres-Limitierung)
- Monitoring-Modul NUR dokumentiert, nicht gebaut
- Routing/Navigation unveraendert
- Internal-Org behaelt alle 21 Tiles

