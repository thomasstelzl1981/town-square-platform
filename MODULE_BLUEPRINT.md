# System of a Town — Modul-Blueprint

> **Datum**: 2026-01-21  
> **Version**: 1.0  
> **Zweck**: Verbindliches Gerüst für Zone 1 (Admin) und Zone 2 (Super-User Portal)

---

## Übersicht

| Zone | Zweck | Anzahl Bereiche | Anzahl Routen |
|------|-------|-----------------|---------------|
| **Zone 1** | Admin-Portal (Steuerzentrale) | 11 Sektionen | ~15 Routen |
| **Zone 2** | User-Portal (Muster/Super-User) | 7 Module | 35 Routen (7×5) |

---

## Zone 1 — Admin-Portal

### Struktur-Übersicht

```
/admin
├── Dashboard                    [Sektion 1]
├── Organizations                [Sektion 2]
│   └── :id (Detail)
├── Users & Memberships          [Sektion 3]
├── Delegations                  [Sektion 4]
├── Master Contacts              [Sektion 5]
├── Tile Catalog                 [Sektion 6]
├── Oversight                    [Sektion 7]
├── Integrations                 [Sektion 8]  ← Phase 2
├── Communication Hub            [Sektion 9]  ← Phase 2
├── Support Mode                 [Sektion 10] ← Phase 2
└── Audit Log                    [Sektion 11] ← Optional
```

---

### Sektion 1: Dashboard (`/admin`)

| Funktion | Beschreibung | Priorität | Status |
|----------|--------------|-----------|--------|
| Session-Info | Angemeldeter User, aktive Rolle | P0 | ✅ Done |
| Quick-Stats | Anzahl Tenants, Users, Properties | P1 | ⬜ TODO |
| System-Alerts | Kritische Meldungen (z.B. abgelaufene Delegationen) | P2 | ⬜ TODO |
| Quick-Actions | Links zu häufigen Aktionen | P2 | ⬜ TODO |

**DoD:** Dashboard zeigt Session-Info + mindestens 3 KPIs.

---

### Sektion 2: Organizations (`/admin/organizations`)

| Funktion | Beschreibung | Priorität | Status |
|----------|--------------|-----------|--------|
| Liste aller Orgs | Hierarchische Darstellung mit Suche | P0 | ✅ Done |
| Org erstellen | Name, Typ, Parent-Org auswählen | P0 | ✅ Done |
| Org bearbeiten | Name, Settings ändern | P0 | ✅ Done |
| Org-Detail (`/admin/organizations/:id`) | Mitglieder, Child-Orgs, Aktivierte Module | P0 | ✅ Done |
| Lockdown-Toggle | `parent_access_blocked` setzen | P0 | ✅ Done |

**DoD:** Vollständiges CRUD + Hierarchie-Navigation. ✅ COMPLETE

---

### Sektion 3: Users & Memberships (`/admin/users`)

| Funktion | Beschreibung | Priorität | Status |
|----------|--------------|-----------|--------|
| User-Liste | Alle User mit Memberships anzeigen | P0 | ✅ Done |
| Filter nach Org | `?org=...` Query-Parameter | P0 | ✅ Done |
| Membership erstellen | User + Org + Rolle zuweisen | P0 | ✅ Done |
| **Membership bearbeiten** | Rolle ändern | P0 | ⬜ TODO |
| **Membership löschen** | Mit Bestätigung | P0 | ⬜ TODO |
| Rollen-Erklärung | Tooltip/Info zu jeder Rolle | P1 | ⬜ TODO |

**DoD:** Vollständiges CRUD für Memberships (Create/Edit/Delete).

---

### Sektion 4: Delegations (`/admin/delegations`)

| Funktion | Beschreibung | Priorität | Status |
|----------|--------------|-----------|--------|
| Delegation-Liste | Alle aktiven/widerrufenen Delegationen | P0 | 🔴 TODO |
| Delegation erstellen | Delegate-Org → Target-Org mit Scope-Picker | P0 | 🔴 TODO |
| Scope-Picker | Checkboxen: properties, contacts, documents, etc. | P0 | 🔴 TODO |
| Delegation widerrufen | Status → revoked, `revoked_by` setzen | P0 | 🔴 TODO |
| Historie anzeigen | Alle vergangenen Delegationen | P1 | 🔴 TODO |
| Ablauf-Management | `expires_at` setzen und warnen | P2 | ⬜ TODO |

**DoD:** CRUD für Delegationen mit Scope-Auswahl und Revoke-Flow.

---

### Sektion 5: Master Contacts (`/admin/contacts`)

| Funktion | Beschreibung | Priorität | Status |
|----------|--------------|-----------|--------|
| Kontakt-Liste | Alle Kontakte mit Tenant-Filter | P0 | ✅ Done |
| Kontakt erstellen | Name, Email, Telefon, Company | P0 | ✅ Done |
| Kontakt bearbeiten | Alle Felder änderbar | P0 | ✅ Done |
| Kontakt löschen | Mit Bestätigung | P0 | ✅ Done |
| Tenant-Scoping | Kontakte sind Tenant-spezifisch | P0 | ✅ Done |

**DoD:** Vollständiges CRUD mit Tenant-Isolation. ✅ COMPLETE

---

### Sektion 6: Tile Catalog (`/admin/tiles`)

| Funktion | Beschreibung | Priorität | Status |
|----------|--------------|-----------|--------|
| Modul-Liste | Alle definierten Tiles anzeigen | P0 | ✅ Done |
| Modul erstellen/bearbeiten | Title, Icon, Route, Sub-Tiles | P1 | ⬜ TODO |
| Per-Tenant-Aktivierung | Toggle pro Tenant | P0 | ✅ Done |
| Display-Order ändern | Reihenfolge anpassen | P2 | ⬜ TODO |

**DoD:** Tile-Definitionen + Tenant-Aktivierung funktioniert. ✅ COMPLETE (Basis)

---

### Sektion 7: Oversight (`/admin/oversight`)

| Funktion | Beschreibung | Priorität | Status |
|----------|--------------|-----------|--------|
| System-Übersicht | Gesamtzahlen: Tenants, Users, Properties | P0 | ⬜ Partial |
| **Tenant-Drill-Down** | Klick auf Tenant → Details | P0 | 🔴 TODO |
| **Member-Details** | Alle Memberships eines Tenants | P0 | 🔴 TODO |
| **Property-Übersicht** | Alle Properties cross-tenant (read-only) | P1 | 🔴 TODO |
| **Financing-Status** | Offene Finanzierungen | P2 | ⬜ TODO |

**DoD:** Drill-Down von System → Tenant → Member → Property.

---

### Sektion 8-10: Phase 2 (Skeleton only)

| Sektion | Route | Aktueller Status | Phase 2 Scope |
|---------|-------|------------------|---------------|
| **Integrations** | `/admin/integrations` | 🔴 Leere Shell | Provider-Konfiguration (Email, Storage, etc.) |
| **Communication Hub** | `/admin/communication` | 🔴 Leere Shell | Email-Templates, Kampagnen, Logs |
| **Support Mode** | `/admin/support` | 🔴 Leere Shell | User-Impersonation, Ticket-Übersicht |

**DoD Phase 1:** Funktionale Skeleton-Seiten mit "Coming Soon" Hinweis.

---

### Sektion 11: Audit Log (Optional)

| Funktion | Beschreibung | Priorität | Status |
|----------|--------------|-----------|--------|
| Audit-Events anzeigen | Liste aller `audit_events` | P2 | ⬜ TODO |
| Filter nach Actor/Target | Suche nach User oder Org | P2 | ⬜ TODO |

**DoD:** Lesbare Audit-Trail-Ansicht.

---

## Zone 2 — User-Portal (Super-User Blueprint)

### Struktur-Übersicht

```
/portal
├── Home (Tile-Grid)
├── /immobilien              [Modul 1]
│   ├── /objekte
│   ├── /einheiten
│   ├── /finanzierung
│   └── /dokumente
├── /kaufy                   [Modul 2]
│   ├── /listings
│   ├── /anfragen
│   ├── /expose
│   └── /transaktionen
├── /miety                   [Modul 3]
│   ├── /mietvertraege
│   ├── /mieter
│   ├── /zahlungen
│   └── /kommunikation
├── /dokumente               [Modul 4]
│   ├── /alle
│   ├── /freigaben
│   ├── /vorlagen
│   └── /archiv
├── /kommunikation           [Modul 5]
│   ├── /nachrichten
│   ├── /historie
│   ├── /kontakte
│   └── /vorlagen
├── /services                [Modul 6]
│   ├── /partner
│   ├── /buchungen
│   ├── /bewertungen
│   └── /rechnungen
└── /einstellungen           [Modul 7]
    ├── /profil
    ├── /benachrichtigungen
    ├── /sicherheit
    └── /abrechnung
```

---

### Modul 1: Immobilien (`/portal/immobilien`)

**Zweck:** Verwaltung des Immobilienportfolios

| Tile | Route | Beschreibung | Priorität |
|------|-------|--------------|-----------|
| **Main: Übersicht** | `/portal/immobilien` | Property-Liste, Schnellzugriff | P0 |
| Sub 1: Objekte | `/portal/immobilien/objekte` | Detailansicht einzelner Properties | P0 |
| Sub 2: Einheiten | `/portal/immobilien/einheiten` | Units pro Property (Wohnungen, Gewerbe) | P0 |
| Sub 3: Finanzierung | `/portal/immobilien/finanzierung` | Kredite, Zinsen, Tilgung | P1 |
| Sub 4: Dokumente | `/portal/immobilien/dokumente` | Grundbuch, Verträge, Gutachten | P1 |

**Status:** Legacy unter `/portfolio/*` vorhanden → Migration nach Etappe 3

---

### Modul 2: Kaufy (`/portal/kaufy`)

**Zweck:** Immobilienverkauf (Verkäufer-Perspektive)

| Tile | Route | Beschreibung | Priorität |
|------|-------|--------------|-----------|
| **Main: Übersicht** | `/portal/kaufy` | Aktive Listings, Pipeline | P1 |
| Sub 1: Listings | `/portal/kaufy/listings` | Inserate erstellen/bearbeiten | P1 |
| Sub 2: Anfragen | `/portal/kaufy/anfragen` | Interessenten-Management | P1 |
| Sub 3: Exposé | `/portal/kaufy/expose` | Exposé-Generator | P2 |
| Sub 4: Transaktionen | `/portal/kaufy/transaktionen` | Verkaufsabschlüsse, Notartermine | P2 |

**Status:** 🔴 Platzhalter

---

### Modul 3: Miety (`/portal/miety`)

**Zweck:** Mietverwaltung (Vermieter-Perspektive)

| Tile | Route | Beschreibung | Priorität |
|------|-------|--------------|-----------|
| **Main: Übersicht** | `/portal/miety` | Aktive Mietverhältnisse, Zahlungsstatus | P1 |
| Sub 1: Mietverträge | `/portal/miety/mietvertraege` | Vertrags-CRUD | P1 |
| Sub 2: Mieter | `/portal/miety/mieter` | Mieter-Kontakte, Kommunikation | P1 |
| Sub 3: Zahlungen | `/portal/miety/zahlungen` | Mieteingänge, Mahnwesen | P2 |
| Sub 4: Kommunikation | `/portal/miety/kommunikation` | Mieter-Korrespondenz | P2 |

**Status:** 🔴 Platzhalter (Basis in `leases` vorhanden)

---

### Modul 4: Dokumente (`/portal/dokumente`)

**Zweck:** Zentrales Dokumentenmanagement

| Tile | Route | Beschreibung | Priorität |
|------|-------|--------------|-----------|
| **Main: Übersicht** | `/portal/dokumente` | Alle Dokumente, Suche | P1 |
| Sub 1: Alle | `/portal/dokumente/alle` | Vollständige Dokumentenliste | P1 |
| Sub 2: Freigaben | `/portal/dokumente/freigaben` | Geteilte Dokumente (Data Room) | P2 |
| Sub 3: Vorlagen | `/portal/dokumente/vorlagen` | Wiederverwendbare Templates | P2 |
| Sub 4: Archiv | `/portal/dokumente/archiv` | Archivierte/alte Dokumente | P2 |

**Status:** 🔴 Platzhalter (Basis in `documents` vorhanden)

---

### Modul 5: Kommunikation (`/portal/kommunikation`)

**Zweck:** Nachrichtenzentrale (kein Inbox!)

| Tile | Route | Beschreibung | Priorität |
|------|-------|--------------|-----------|
| **Main: Übersicht** | `/portal/kommunikation` | Letzte Nachrichten, Schnellzugriff | P2 |
| Sub 1: Nachrichten | `/portal/kommunikation/nachrichten` | Neue Nachricht verfassen | P2 |
| Sub 2: Historie | `/portal/kommunikation/historie` | Versendete Nachrichten | P2 |
| Sub 3: Kontakte | `/portal/kommunikation/kontakte` | Schnellzugriff auf Kontakte | P2 |
| Sub 4: Vorlagen | `/portal/kommunikation/vorlagen` | Email-Templates | P2 |

**Status:** 🔴 Platzhalter

---

### Modul 6: Services (`/portal/services`)

**Zweck:** Dienstleister und externe Partner

| Tile | Route | Beschreibung | Priorität |
|------|-------|--------------|-----------|
| **Main: Übersicht** | `/portal/services` | Partner-Übersicht | P2 |
| Sub 1: Partner | `/portal/services/partner` | Handwerker, Makler, Notare | P2 |
| Sub 2: Buchungen | `/portal/services/buchungen` | Beauftragte Dienstleistungen | P3 |
| Sub 3: Bewertungen | `/portal/services/bewertungen` | Partner-Feedback | P3 |
| Sub 4: Rechnungen | `/portal/services/rechnungen` | Service-Rechnungen | P3 |

**Status:** 🔴 Platzhalter

---

### Modul 7: Einstellungen (`/portal/einstellungen`)

**Zweck:** Persönliche und Tenant-Konfiguration

| Tile | Route | Beschreibung | Priorität |
|------|-------|--------------|-----------|
| **Main: Übersicht** | `/portal/einstellungen` | Schnellzugriff auf Einstellungen | P1 |
| Sub 1: Profil | `/portal/einstellungen/profil` | Name, Avatar, Email | P1 |
| Sub 2: Benachrichtigungen | `/portal/einstellungen/benachrichtigungen` | Email-Präferenzen | P2 |
| Sub 3: Sicherheit | `/portal/einstellungen/sicherheit` | Passwort, 2FA | P2 |
| Sub 4: Abrechnung | `/portal/einstellungen/abrechnung` | Subscription, Rechnungen | P3 |

**Status:** 🔴 Platzhalter

---

## Implementierungs-Reihenfolge

### Phase 1: Admin-Portal (Etappe 1)

| # | Aufgabe | Sektion | Priorität |
|---|---------|---------|-----------|
| 1.1 | Memberships CRUD vervollständigen | Users | P0 |
| 1.2 | Delegations UI komplett | Delegations | P0 |
| 1.3 | Oversight Drill-Down | Oversight | P1 |
| 1.4 | Dashboard KPIs | Dashboard | P1 |

### Phase 1: Portal-Shell (Etappe 2)

| # | Aufgabe | Bereich | Priorität |
|---|---------|---------|-----------|
| 2.1 | PortalLayout erstellen | Framework | P0 |
| 2.2 | 35 Routen als Platzhalter | Alle Module | P0 |
| 2.3 | Tenant-Switcher | Framework | P0 |
| 2.4 | Mobile Navigation | Framework | P0 |

### Phase 1: Referenz-Modul (Etappe 3)

| # | Aufgabe | Modul | Priorität |
|---|---------|-------|-----------|
| 3.1 | Immobilien nach `/portal/immobilien` | Immobilien | P0 |
| 3.2 | Einheiten-Sub-Tile | Immobilien | P0 |
| 3.3 | Finanzierung-Sub-Tile | Immobilien | P1 |
| 3.4 | Legacy-Redirect | Migration | P1 |

### Phase 1: Super-User Test (Etappe 4)

| # | Aufgabe | Bereich | Priorität |
|---|---------|---------|-----------|
| 4.1 | Test-Tenant mit allen Modulen | DB | P0 |
| 4.2 | Alle 35 Routen testen | E2E | P0 |
| 4.3 | Tenant-Switch testen | E2E | P0 |

### Phase 1: Dokumentation (Etappe 5)

| # | Aufgabe | Bereich | Priorität |
|---|---------|---------|-----------|
| 5.1 | README.md aktualisieren | Docs | P0 |
| 5.2 | ADR-028 "Backbone Complete" | Docs | P0 |
| 5.3 | GitHub-Sync vorbereiten | Infra | P1 |

---

## Dokumentationsstandard (GitHub-ready)

Nach jedem Untermenüpunkt/Feature:

```markdown
## [Sektion/Modul]: [Feature-Name]

### Änderungen
- [ ] Datei 1: Beschreibung
- [ ] Datei 2: Beschreibung

### Datenbank
- [ ] Migration: Beschreibung (falls nötig)
- [ ] RLS: Beschreibung (falls nötig)

### Test-Szenario
1. Schritt 1
2. Schritt 2
3. Erwartetes Ergebnis

### Status
- [x] Implementiert
- [x] Getestet
- [ ] Dokumentiert
```

---

*Dieses Dokument ist die verbindliche Modul-Referenz. Änderungen erfordern explizite Bestätigung.*
