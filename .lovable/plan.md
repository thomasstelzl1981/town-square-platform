

# Neue Rolle: Super-Manager

## Definition

| Eigenschaft | Wert |
|-------------|------|
| Label | Super-Manager |
| membership_role | `super_manager` (neu) |
| app_role | keine (kein Zone-1-Zugang) |
| Module | 21 (alle ausser MOD-22 Pet Manager) |
| Zone 1 | Kein Zugriff |
| Zone 2 | Vollzugriff ohne Pet Manager |

Der Super-Manager ist eine Fuehrungsrolle, die alle Zone-2-Module sieht — mit Ausnahme des Pet Managers (MOD-22). Er hat keinen Zugang zu Zone 1 (Admin-Bereich).

### Modul-Set (21 Module)

14 Basis-Module + 7 Spezial-Module (ohne MOD-22):
MOD-09 Vertriebspartner, MOD-10 Leads, MOD-11 Finanzierungsmanager, MOD-12 Akquise-Manager, MOD-13 Projekte, MOD-14 Communication Pro, MOD-19 Photovoltaik

---

## Technische Umsetzung

### 1. Datenbank-Migration

**a) membership_role Enum erweitern:**
```sql
ALTER TYPE membership_role ADD VALUE 'super_manager';
```

**b) get_tiles_for_role() aktualisieren:**
Neuer CASE-Zweig fuer `super_manager`, der alle Module ausser MOD-22 zurueckgibt (21 Module).

**c) Beide Versionen der Funktion aktualisieren** (es existieren zwei Overloads — einer mit `p_role`, einer mit `_role`).

### 2. Code-Aenderungen

**Datei: `src/constants/rolesMatrix.ts`**

- `ROLE_EXTRA_TILES`: Neuer Eintrag `super_manager` mit allen 7 Spezial-Modulen ausser MOD-22
- `ROLES_CATALOG`: Neuer Rolleneintrag fuer Super-Manager (21 Module, kein appRole)
- `MODULE_ROLE_MATRIX`: `super_manager` zu allen 21 Modulen hinzufuegen (nicht MOD-22)
- `getTilesForRole()`: Super-Manager-Sonderbehandlung (ALL_TILES minus MOD-22)
- Header-Kommentar: "9 Rollen" statt "8 Rollen"

### 3. Keine weiteren Aenderungen noetig

- **AdminLayout.tsx**: Prueft `platform_admin`, `org_admin`, `internal_ops` — `super_manager` ist bewusst nicht enthalten, daher kein Zone-1-Zugang. Korrekt.
- **sync_tiles_for_user**: Nutzt get_tiles_for_role() — bekommt die neuen 21 Module automatisch.
- **RolesManagement.tsx (Zone 1)**: Liest ROLES_CATALOG dynamisch — zeigt die neue Rolle automatisch an.

---

## Aenderungs-Uebersicht

| # | Aktion | Ziel | Beschreibung |
|---|--------|------|-------------|
| 1 | DB-Migration | membership_role Enum | `super_manager` hinzufuegen |
| 2 | DB-Migration | get_tiles_for_role() | Neuer CASE-Zweig: 21 Module (alle ausser MOD-22) |
| 3 | Code-Edit | src/constants/rolesMatrix.ts | Rolle, Tiles, Matrix, Hilfsfunktion aktualisieren |

