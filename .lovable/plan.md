

# Plan: Rollenbezogene Tile-Aktivierung (statt Account-bezogen)

## Problem-Analyse

### 3 identifizierte Fehlerquellen

**1. DB-Funktion `get_tiles_for_role()` ist unvollstaendig**

Die Funktion kennt nur 5 Rollen, aber es gibt 8 aktive Rollen im System:

```text
Vorhanden:          Fehlend:
- org_admin         - super_user (→ alle 22 Module)
- sales_partner     - pet_manager (→ 14 + MOD-22 + MOD-10)
- finance_manager   - project_manager (→ 14 + MOD-13)
- akquise_manager
- platform_admin
```

Ausserdem fehlt `MOD-22` komplett im `all_tiles`-Array der Funktion (nur 21 statt 22 Module).

**Konsequenz:** Bernhard Marchner wurde bei der Account-Erstellung als `org_admin` registriert (korrekt laut Rollenmodell: Super-User haben `membership_role = org_admin`). Die Funktion gab deshalb nur 14 Basis-Module zurueck. Der `super_user`-Status steht in `user_roles.role`, wird aber von `get_tiles_for_role()` nicht beruecksichtigt.

**2. `handle_new_user()` prueft nur `membership_role`, nicht `app_role`**

Der Trigger ruft `get_tiles_for_role('org_admin')` auf — der `app_role`-Eintrag in `user_roles` (super_user) wird komplett ignoriert. Da Bernhard erst nach der Account-Erstellung zum Super-User befördert wurde (Manager-Freischaltung), muessten die Tiles nachtraeglich synchronisiert werden — das passiert aber nie.

**3. Zone 1 UI zeigt Tenants statt Rollen**

Das Dropdown im "Tenant-Aktivierung"-Tab zeigt individuelle Accounts (bernhard.marchner, demo, Lennox...) und erlaubt manuelles Togglen pro Tenant. Das widerspricht dem Rollenmodell, bei dem die Tiles automatisch aus der Rolle abgeleitet werden sollen.

### Ist-Zustand Bernhard Marchner

```text
membership_role:  org_admin          → get_tiles_for_role() gibt 14 Tiles
app_role:         super_user         → sollte ALLE 22 Tiles haben
tenant_tile_activation: 14 Eintraege → es fehlen 8 Spezial-Module
```

Bernhard sieht in Zone 2 nur 14 Module statt der versprochenen 21 (bzw. 22 mit MOD-22).

---

## Loesung (4 Aenderungen)

### 1. DB-Funktion `get_tiles_for_role()` aktualisieren

Die Funktion muss alle 8 Rollen kennen und MOD-22 im `all_tiles`-Array enthalten:

```text
all_tiles = MOD-00 bis MOD-20 + MOD-22 (22 Module)

Neue Cases:
  'super_user'       → all_tiles (alle 22)
  'pet_manager'      → base_tiles + MOD-22 + MOD-10
  'project_manager'  → base_tiles + MOD-13
  'platform_admin'   → all_tiles (alle 22, war vorher nur 21)
```

### 2. Neue DB-Funktion `sync_tiles_for_user(user_id)` erstellen

Eine neue Funktion, die beim Aendern der Rolle (z.B. Manager-Freischaltung) aufgerufen wird:

```text
1. Liest membership_role UND app_role des Users
2. Bestimmt effektive Rolle (app_role hat Vorrang: super_user → alle Tiles)
3. Ruft get_tiles_for_role() mit der effektiven Rolle auf
4. Synchronisiert tenant_tile_activation:
   - Fehlende Tiles → INSERT
   - Ueberfluessige Tiles → status = 'inactive'
```

### 3. Zone 1 UI: "Tenant-Aktivierung" → "Rollen-Aktivierung" umbauen

Der Tab wird von account-basiert auf rollen-basiert umgestellt:

```text
Aktuell:
  [Dropdown: bernhard.marchner ▼]  [Alle aktivieren]
  → Manuelle Toggles pro Tenant

Neu:
  [Dropdown: Rolle waehlen ▼]  [Sync alle Tenants]
  Optionen: Super-User | Standardkunde | Akquise-Manager | ...

  → Zeigt welche Tiles die gewaehlte Rolle bekommt (aus rolesMatrix.ts)
  → "Sync alle Tenants" synchronisiert ALLE Tenants mit dieser Rolle
  → Zusaetzlich: Tabelle zeigt alle Tenants mit dieser Rolle und deren Ist-Zustand
```

**Zusaetzlich** bleibt eine "Tenant-Einzelansicht" erhalten fuer Ausnahmen/Debugging, aber die primaere Steuerung ist rollenbezogen.

### 4. Bernhards Tiles sofort reparieren (DB-Migration)

Da Bernhard bereits existiert und der Sync noch nicht automatisch laeuft, werden seine fehlenden 8 Spezial-Module per Migration nachgetragen:

```text
INSERT in tenant_tile_activation fuer Tenant 80746f1a-...:
  MOD-09, MOD-10, MOD-11, MOD-12, MOD-13, MOD-14, MOD-19, MOD-22
```

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| DB-Migration 1 | `get_tiles_for_role()` aktualisieren (8 Rollen, 22 Module) |
| DB-Migration 2 | `sync_tiles_for_user()` Funktion erstellen |
| DB-Migration 3 | Bernhards fehlende Tiles einfuegen |
| `src/pages/admin/TileCatalog.tsx` | Tenant-Aktivierung-Tab auf Rollen-basiert umbauen |
| `src/constants/rolesMatrix.ts` | Bereits korrekt — keine Aenderung noetig |

### Modul-Freeze-Check

- `src/pages/admin/TileCatalog.tsx` → kein Modul-Pfad, nicht frozen
- DB-Migrationen → nicht frozen
- `src/constants/rolesMatrix.ts` → nicht frozen

Alle Aenderungen liegen ausserhalb gefrorener Module.

---

## Was sich NICHT aendert

- **PortalNav.tsx**: Liest weiterhin `tenant_tile_activation` — das ist korrekt, da die Tiles dort jetzt rollenkonsistent sind
- **rolesMatrix.ts**: Ist bereits komplett mit allen 8 Rollen und 22 Modulen
- **handle_new_user()**: Bleibt unveraendert (neue User sind immer `org_admin` → 14 Basis-Tiles korrekt)
- **Manager-Freischaltung**: Muss nach Upgrade `sync_tiles_for_user()` aufrufen, damit Spezial-Module automatisch aktiviert werden

