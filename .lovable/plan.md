
# Plan: Rollen-Management-Modul für Zone 1

## Zusammenfassung

Erstellung eines neuen Moduls **"Rollen & Berechtigungen"** unter Feature Activation (Gruppe 5), das die Rollen-Modul-Matrix visualisiert und als zentrale Dokumentation dient.

---

## Phase 1: Datenbank-Bereinigung

### 1.1 membership_role Enum korrigieren

Aktueller Stand:
- platform_admin
- org_admin
- internal_ops (soll: internal_user laut Spezifikation)
- sales_partner
- renter_user (soll: tenant_renter_lite laut Spezifikation)
- finance_manager

Fehlend:
- akquise_manager
- future_room_web_user_lite

SQL-Migration:
```sql
-- Neue Rollen hinzufuegen
ALTER TYPE membership_role ADD VALUE IF NOT EXISTS 'akquise_manager';
ALTER TYPE membership_role ADD VALUE IF NOT EXISTS 'future_room_web_user_lite';
```

Hinweis: Umbenennungen (internal_ops → internal_user) erfordern Datenmigration und werden auf Phase 11 verschoben.

### 1.2 app_role Enum synchronisieren

Aktueller Stand:
- platform_admin
- moderator (nicht in Spezifikation)
- user (nicht in Spezifikation)
- finance_manager
- akquise_manager

Empfehlung: app_role wird nicht aktiv genutzt (user_roles Tabelle ist leer). Bereinigung auf Phase 11 verschieben.

---

## Phase 2: Neues Modul erstellen

### 2.1 Neue Datei: `src/pages/admin/RolesManagement.tsx`

Struktur mit 3 Tabs:

**Tab 1: Rollen-Katalog**
- Tabelle aller definierten Rollen
- Spalten: Rolle, Zone, Beschreibung, Ziel-Module
- Datenquelle: Statische ROLES_CATALOG Konstante (aus Rollenübersicht)

**Tab 2: Modul-Rollen-Matrix**
- Grid: Module (Zeilen) x Rollen (Spalten)
- Checkmarks für Zugriff
- Datenquelle: routesManifest.ts (requires_role) + statische Matrix
- Read-Only Ansicht

**Tab 3: Governance-Regeln**
- Superuser-Dokumentation
- isDevelopmentMode Erklärung
- Zone 2 als Entwicklungs-Account

### 2.2 Rollen-Konstante definieren

```typescript
// src/constants/rolesMatrix.ts
export const ROLES_CATALOG = [
  {
    code: 'platform_admin',
    label: 'Platform Admin',
    zone: 'Zone 1',
    description: 'Plattformbetreiber (God Mode)',
    modules: ['ALLE Zone 1', 'ALLE Zone 2 (Oversight)'],
  },
  {
    code: 'org_admin',
    label: 'Org Admin',
    zone: 'Zone 2',
    description: 'Tenant-Eigentuemer / Hauptnutzer',
    modules: ['MOD-00 bis MOD-20 (vollstaendig)'],
  },
  {
    code: 'internal_user', // Hinweis: DB hat noch internal_ops
    label: 'Internal User',
    zone: 'Zone 2',
    description: 'Mitarbeiter im Tenant',
    modules: ['MOD-00, MOD-02, MOD-03, MOD-04 (limited), MOD-05, MOD-06, MOD-07, MOD-13, MOD-14, MOD-17'],
  },
  {
    code: 'sales_partner',
    label: 'Sales Partner',
    zone: 'Zone 2',
    description: 'Vertriebspartner',
    modules: ['MOD-00, MOD-06 (read), MOD-07 (Status), MOD-08, MOD-09, MOD-10'],
  },
  {
    code: 'finance_manager',
    label: 'Finanzierungsmanager',
    zone: 'Zone 2',
    description: 'FutureRoom Finanzmanager',
    modules: ['MOD-00, MOD-03 (Finanz-Docs), MOD-07 (read), MOD-11'],
  },
  {
    code: 'akquise_manager',
    label: 'Akquise-Manager',
    zone: 'Zone 2',
    description: 'Akquise/Acquiary Manager',
    modules: ['MOD-00, MOD-03, MOD-04 (limited), MOD-08 (Mandate), MOD-12'],
  },
  {
    code: 'future_room_web_user_lite',
    label: 'FutureRoom Lite',
    zone: 'Zone 3 Entry',
    description: 'Zone 3 Registrierung (eingeschraenkt)',
    modules: ['MOD-00 (limited), MOD-07 (Selbstauskunft)'],
  },
  {
    code: 'tenant_renter_lite', // Hinweis: DB hat renter_user
    label: 'Mieter (Lite)',
    zone: 'Zone 2 Andock',
    description: 'Mieter mit eigenem Mini-Tenant',
    modules: ['MOD-03 (eigene), MOD-14 (limited), MOD-20'],
  },
];
```

---

## Phase 3: Routing und Sidebar

### 3.1 Route in routesManifest.ts ergaenzen

```typescript
// In zone1Admin.routes hinzufuegen:
{ path: "roles", component: "RolesManagement", title: "Rollen & Berechtigungen" },
```

### 3.2 AdminSidebar.tsx anpassen

getGroupKey() erweitern:
```typescript
if (path === 'tiles' || path === 'roles' || path === 'partner-verification') {
  return 'activation';
}
```

### 3.3 ICON_MAP ergaenzen

```typescript
'RolesManagement': Shield, // oder UserCog
```

---

## Phase 4: Dokumentation aktualisieren

### 4.1 ACCESS_MATRIX.md auf v2.0

- Alle 8 Rollen dokumentieren
- MOD-11, MOD-12 hinzufuegen
- Lite-Rollen erklaeren

### 4.2 ZONE1_ADMIN_ROUTES.md

Feature Activation erweitern:
```
| /admin/roles | RolesManagement | Rollen & Berechtigungen |
```

### 4.3 ZONE1_COMPLETION_ROADMAP.md

Phase 4 aktualisieren:
```
| Rollen & Berechtigungen | Rollen-Katalog + Matrix (Read-Only) | Jetzt |
```

---

## Dateien die erstellt/geaendert werden

| Datei | Aktion |
|-------|--------|
| `supabase/migrations/xxx_add_roles.sql` | NEU: akquise_manager, future_room_web_user_lite |
| `src/constants/rolesMatrix.ts` | NEU: Rollen-Definition |
| `src/pages/admin/RolesManagement.tsx` | NEU: 3-Tab-Modul |
| `src/manifests/routesManifest.ts` | Route hinzufuegen |
| `src/components/admin/AdminSidebar.tsx` | Group-Mapping |
| `docs/architecture/ACCESS_MATRIX.md` | v2.0 mit allen Rollen |
| `docs/architecture/ZONE1_ADMIN_ROUTES.md` | Route dokumentieren |
| `docs/architecture/ZONE1_COMPLETION_ROADMAP.md` | Phase 4 aktualisieren |

---

## Governance-Hinweis im UI

Das neue Modul wird einen prominenten Hinweis enthalten:

> **Entwicklungs-Account**
> 
> Im Entwicklungsmodus (isDevelopmentMode = true) und fuer Platform Admins sind ALLE Module sichtbar, unabhaengig von Rollen-Zuweisungen. Die Rollen-Steuerung greift erst bei echten Tenant-Nutzern.

---

## Abhaengigkeiten

- Keine Aenderungen an Zone 2 (SSOT bleibt Zone 2)
- DB-Migration ist abwaertskompatibel (nur ADD VALUE)
- Umbenennungen (internal_ops → internal_user) werden auf Phase 11 verschoben

