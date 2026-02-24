

# Plan: Unified Tenant & User Management (Zone 1 Admin)

## Ist-Zustand — Das Problem

Drei separate Seiten zeigen im Kern die gleichen Daten:

```text
/admin/organizations  →  Tabelle: Orgs (Name, Slug, Typ, Tiefe, Erstellt)
/admin/users          →  Tabelle: Memberships (User, Org, Rolle, Erstellt)
/admin/oversight      →  KPIs + 4 Tabs (Tenants, Immobilien, Finance, Module)
                         → Tab "Tenants" = gleiche Org-Liste wie Organizations
```

**Oversight** ist ein Sammelsurium: Tenants, Immobilien, Finance Packages und Module in einem View — das gehoert nicht zusammen. Die Tenant-Daten erscheinen doppelt.

**Users** zeigt Memberships ohne Kontext zum Tenant — man sieht UUIDs statt Kundendaten.

**Organizations** zeigt nur die Org-Huelle ohne Nutzer, ohne Billing, ohne Module.

---

## Soll-Zustand — Konsolidierte Architektur

### Neue Struktur: 2 Seiten statt 3

```text
/admin/organizations        →  "Kunden & Tenants" (HAUPTSEITE)
/admin/organizations/:id    →  "Tenant-Detail" (erweitert)
/admin/oversight            →  "System-Uebersicht" (reine KPIs + Immobilien/Finance)
```

**`/admin/users` wird ENTFERNT** als eigenstaendiger Menupunkt. Die User-/Membership-Verwaltung wird in die Tenant-Detail-Seite (`/admin/organizations/:id`) integriert, wo sie hingehoert.

---

### Seite 1: `/admin/organizations` — Kunden & Tenants

Eine einzige, saubere Hauptliste mit allen relevanten Tenant-Informationen:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Kunden & Tenants                          [+ Neue Organisation]   │
│  Mandanten, Partner und Benutzer verwalten                         │
│                                                                     │
│  [Suche...]  [Typ: Alle ▼]                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Kunden-Nr  │ Name              │ Typ     │ Mitglieder │ Module │  │
│  SOT-T-...  │ System of a Town  │ Internal│ 2          │ 22     │  │
│  SOT-T-...  │ bernhard.marchner │ Client  │ 1          │ 14     │  │
│  SOT-T-...  │ Lennox Ottobrunn  │ Partner │ 1          │ 16     │  │
│  SOT-T-...  │ demo              │ Client  │ 1          │ 14     │  │
│                                                                     │
│  Klick → Detail-Seite                                              │
└─────────────────────────────────────────────────────────────────────┘
```

**Spalten:**
- Kunden-Nr. (`public_id` aus `organizations`)
- Name
- Typ (Client / Partner / Internal / Renter)
- Mitglieder (Count aus `memberships`)
- Aktive Module (Count aus `tenant_tile_activation`)
- Erstellt (Datum)
- Credits (Saldo — spaeter, wenn Billing steht)

Die Counts werden aus der DB geladen (wie Oversight es bereits tut), aber direkt in der Haupttabelle angezeigt.

---

### Seite 2: `/admin/organizations/:id` — Tenant-Detail (erweitert)

Wenn man einen Tenant anklickt, sieht man ALLES zu diesem Kunden:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ← Zurueck                                                         │
│                                                                     │
│  bernhard.marchner                                                 │
│  Kunden-Nr: SOT-T-Z9RVCGQE  ·  Typ: Client  ·  Seit: 22.02.2026  │
│                                                                     │
│  [Stammdaten]  [Mitglieder]  [Module]  [Credits & Billing]         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TAB: Stammdaten                                                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Name:        bernhard.marchner                              │   │
│  │  Slug:        bernhard-marchner-8d810b                       │   │
│  │  Org-Typ:     Client                                         │   │
│  │  Tenant-Mode: production                                     │   │
│  │  Storage:     5 GB (Free Plan)                               │   │
│  │  Erstellt:    22.02.2026                                     │   │
│  │  Kunden-Nr:   SOT-T-Z9RVCGQE                                │   │
│  │                                                              │   │
│  │  — Kontaktdaten (aus profiles des Org-Admins) —              │   │
│  │  Name:        Bernhard Marchner                              │   │
│  │  E-Mail:      bernhard@...                                   │   │
│  │  Anschrift:   (aus profiles, wenn vorhanden)                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TAB: Mitglieder (ehemals /admin/users gefiltert)                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Benutzer              │ Rolle        │ Erstellt │ Aktionen  │   │
│  │  bernhard@...          │ Org Admin    │ 22.02.   │ [✏️] [🗑] │   │
│  │                                                              │   │
│  │  [+ Mitglied hinzufuegen]  [+ Neuen Benutzer anlegen]       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TAB: Module                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  MOD-00 Dashboard        ✅ aktiv                            │   │
│  │  MOD-01 Stammdaten       ✅ aktiv                            │   │
│  │  MOD-02 KI Office        ✅ aktiv                            │   │
│  │  ...                                                         │   │
│  │  MOD-22 Pet Manager      ⬜ inaktiv                          │   │
│  │                                                              │   │
│  │  Hinweis: Module werden ueber Rollen automatisch zugewiesen  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TAB: Credits & Billing                                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Aktueller Saldo:  487 Credits (121,75 EUR)                  │   │
│  │  Verbrauch diesen Monat: 63 Credits                          │   │
│  │                                                              │   │
│  │  Datum       │ Aktion              │ Credits │ Saldo         │   │
│  │  24.02.2026  │ PDF-Extraktion      │ -1      │ 487           │   │
│  │  23.02.2026  │ Armstrong Chat      │ -2      │ 488           │   │
│  │  22.02.2026  │ Guthaben aufgeladen │ +500    │ 490           │   │
│  │                                                              │   │
│  │  (Datenquelle: credit_transactions Tabelle — wird spaeter   │   │
│  │   implementiert, Platzhalter-Tab mit "Noch nicht verfuegbar")│   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Seite 3: `/admin/oversight` — System-Uebersicht (bereinigt)

Oversight bleibt, aber **ohne den Tenants-Tab** (der ist jetzt in Organizations). Uebrig bleibt:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  System-Uebersicht                                                 │
│  Systemweite KPIs und Business-Daten (Read-only)                   │
│                                                                     │
│  [Orgs: 4] [User: 5] [Immobilien: 3] [Module: 72] [Finance: 0]   │
│                                                                     │
│  [Immobilien]  [Finance Pakete]  [Module-Aktivierungen]            │
│                                                                     │
│  (Keine Tenants-Tabelle mehr — die lebt jetzt in Organizations)    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Aenderungen im Detail

### 1. `/admin/organizations` (Organizations.tsx) — Umbau zur Hauptseite

- **Titel**: "Kunden & Tenants" statt "Organisationen"
- **Neue Spalten**: public_id (Kunden-Nr), Mitglieder-Count, Module-Count
- **Counts laden**: memberships + tenant_tile_activation joinen (wie Oversight es schon tut)
- **Zeile klickbar**: Navigiert zu `/admin/organizations/:id`
- **Create-Dialog bleibt** (zum manuellen Anlegen neuer Orgs)

### 2. `/admin/organizations/:id` (OrganizationDetail.tsx) — Erweitern mit 4 Tabs

Aktuell zeigt die Detail-Seite nur Org-Daten + Lockdown-Toggle + Kind-Orgs. Wird erweitert:

**Tab 1: Stammdaten**
- Org-Felder (Name, Slug, Typ, Tenant-Mode, Storage, public_id)
- Kontaktdaten des Org-Admins (aus `profiles` via `memberships` JOIN)
- Keine DSGVO-kritischen Daten — nur Name, E-Mail, Anschrift wenn vorhanden

**Tab 2: Mitglieder**
- Komplette Membership-Verwaltung (ehemals Users.tsx gefiltert auf diese Org)
- User anlegen, Rolle aendern, Membership loeschen
- Profil-Infos (E-Mail, Display-Name) werden angezeigt

**Tab 3: Module**
- Alle `tenant_tile_activation`-Eintraege fuer diesen Tenant
- Read-Only-Ansicht (Module werden ueber Rollen gesteuert, nicht manuell)
- Link zu `/admin/tiles` fuer die systemweite Modul-Verwaltung

**Tab 4: Credits & Billing**
- Platzhalter-Tab mit Hinweis "Credit-System wird in einer spaeteren Phase implementiert"
- Vorbereitet fuer: Saldo-Anzeige, Transaktions-Historie, monatliche Abrechnung
- Datenquelle: `credit_transactions` Tabelle (existiert moeglicherweise noch nicht)

### 3. `/admin/oversight` (Oversight.tsx) — Bereinigen

- **Entfernen**: Tab "Tenants" (redundant mit Organizations)
- **Behalten**: KPI-Cards, Tab "Immobilien", Tab "Finance Pakete", Tab "Module"
- Die KPIs bleiben als schnelle System-Uebersicht erhalten

### 4. `/admin/users` — Entfernen als eigenstaendiger Menupunkt

- Users.tsx bleibt als Datei erhalten (fuer den Fall, dass man alle Memberships global sehen will)
- Aber der Sidebar-Eintrag wird entfernt
- Die Funktionalitaet lebt jetzt in OrganizationDetail Tab "Mitglieder"
- Optional: Users.tsx als versteckte Route behalten, aber nicht in der Navigation

### 5. Sidebar-Anpassung (AdminSidebar)

```text
Vorher:                         Nachher:
├── Dashboard                   ├── Dashboard
├── Organisationen              ├── Kunden & Tenants
├── Benutzer                    ├── (entfaellt)
├── Delegationen                ├── Delegationen
├── ...                         ├── ...
├── System-Uebersicht           ├── System-Uebersicht
```

---

## Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/admin/Organizations.tsx` | Umbau: Counts laden, public_id anzeigen, Zeilen klickbar |
| `src/pages/admin/OrganizationDetail.tsx` | Erweitern: 4-Tab-System (Stammdaten, Mitglieder, Module, Credits) |
| `src/pages/admin/Oversight.tsx` | Bereinigen: Tenants-Tab entfernen |
| `src/components/admin/AdminSidebar.tsx` | Users-Eintrag entfernen, Label "Organisationen" → "Kunden & Tenants" |

## Was NICHT geaendert wird

- Users.tsx bleibt als Datei (Route existiert weiter, aber nicht in Sidebar)
- TileCatalog (`/admin/tiles`) bleibt unveraendert
- Keine DB-Migration noetig (alle Daten existieren bereits)
- Keine neuen Tabellen (Credits/Billing ist Platzhalter)

## Integration mit /admin/tiles

Der Tab "Module" in der Tenant-Detail-Seite zeigt die aktiven Module Read-Only an. Die tatsaechliche Steuerung erfolgt weiterhin ueber:
1. Rollen-basierte Auto-Zuweisung (`sync_tiles_for_user`)
2. `/admin/tiles` fuer den systemweiten Modul-Katalog
3. Der Detail-Tab verlinkt auf `/admin/tiles` mit einem "Module verwalten"-Button

