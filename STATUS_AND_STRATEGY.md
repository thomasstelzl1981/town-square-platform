# System of a Town — Status, Zielbild & Strategie

> **Datum**: 2026-01-21  
> **Version**: 2.2 — Verbindliche Referenz  
> **Zweck**: Copy/Paste-fähige Dokumentation für IST, SOLL und Umsetzungsstrategie

---

## A) IST-STATUS — Verbindliche Bestandsaufnahme

### Zone 1 — Admin-Portal

**Route-Prefix**: `/admin/*`  
**Layout**: `AdminLayout` mit `AdminSidebar`  
**Anzahl Menüpunkte**: 11

| # | Menüpunkt | Route | Status | DoD für "fertig" |
|---|-----------|-------|--------|------------------|
| 1 | **Dashboard** | `/admin` | ⬜ Teilfunktional | Session-Info vorhanden. Fehlt: KPIs, Alerts, Quick-Actions |
| 2 | **Organizations** | `/admin/organizations` | ✅ Nutzbar | CRUD funktional, Hierarchie sichtbar, Detail-View vorhanden |
| 3 | **Org Detail** | `/admin/organizations/:id` | ✅ Nutzbar | Details, Mitglieder-Liste, Child-Orgs |
| 4 | **Users & Memberships** | `/admin/users` | ⬜ Teilfunktional | User-Liste + Create vorhanden. Fehlt: Membership-Edit, Delete-Confirmation |
| 5 | **Delegations** | `/admin/delegations` | 🔴 Scaffold | Leere Seite. Fehlt: Vollständige CRUD-UI mit Scope-Picker |
| 6 | **Master Contacts** | `/admin/contacts` | ✅ Nutzbar | CRUD vollständig, Tenant-Scoping funktioniert |
| 7 | **Tile Catalog** | `/admin/tiles` | ✅ Nutzbar | Modul-Liste, Tenant-Aktivierung mit Toggle funktioniert |
| 8 | **Integrations** | `/admin/integrations` | 🔴 Scaffold | Leere Shell. Phase 2 |
| 9 | **Communication Hub** | `/admin/communication` | 🔴 Scaffold | Leere Shell. Phase 2 |
| 10 | **Oversight** | `/admin/oversight` | ⬜ Teilfunktional | Basis-Stats vorhanden. Fehlt: Drill-Down, Tenant-Details |
| 11 | **Support Mode** | `/admin/support` | 🔴 Scaffold | Leere Shell. Phase 2 |

**Legende:**
- ✅ **Nutzbar** = CRUD/Workflow funktioniert, fachlich einsetzbar
- ⬜ **Teilfunktional** = Basis-UI vorhanden, aber unvollständig
- 🔴 **Scaffold** = Leere Shell ohne Funktionalität

**Zusammenfassung Zone 1:**
- ✅ 4 von 11 nutzbar (Organizations, Org Detail, Master Contacts, Tile Catalog)
- ⬜ 3 von 11 teilfunktional (Dashboard, Users, Oversight)
- 🔴 4 von 11 nur Scaffold (Delegations, Integrations, Communication, Support)

---

### Zone 2 — User-Portal

**Route-Prefix**: `/portal/*`  
**Layout**: **KEINES** — `PortalHome` ist standalone, kein Shell

#### Framework-Komponenten

| Komponente | Datei | Status |
|------------|-------|--------|
| Homescreen (iOS-Kacheln) | `PortalHome.tsx` | ✅ Implementiert |
| Platzhalter-Komponente | `ModulePlaceholder.tsx` | ✅ Implementiert |
| Tile-Catalog-Integration | DB-gesteuert | ✅ Funktioniert |
| **Portal-Layout/Shell** | — | ❌ Fehlt komplett |
| **Tenant-Switcher** | — | ❌ Fehlt in Zone 2 |
| **Mobile-Navigation** | — | ❌ Fehlt (Hamburger/Bottom-Nav) |

#### Modul-Status

| Modul | `tile_code` | Main-Route | Sub-Tiles | Status |
|-------|-------------|------------|-----------|--------|
| Immobilien | `immobilien` | `/portal/immobilien` | 4 definiert | ❌ Platzhalter (echte UI unter `/portfolio/*`) |
| Kaufy | `kaufy` | `/portal/kaufy` | 4 definiert | ❌ Platzhalter |
| Miety | `miety` | `/portal/miety` | 4 definiert | ❌ Platzhalter |
| Dokumente | `dokumente` | `/portal/dokumente` | 4 definiert | ❌ Platzhalter |
| Kommunikation | `kommunikation` | `/portal/kommunikation` | 4 definiert | ❌ Platzhalter |
| Services | `services` | `/portal/services` | 4 definiert | ❌ Platzhalter |
| Einstellungen | `einstellungen` | `/portal/einstellungen` | 4 definiert | ❌ Platzhalter |

**Zusammenfassung Zone 2:**
- ✅ Kachel-Rendering aus DB funktioniert
- ❌ **Kein Modul** hat echte Funktionalität unter `/portal/*`
- ❌ **Kein dediziertes Layout** für Zone 2
- ⚠️ Immobilien-Referenzmodul existiert unter **Legacy `/portfolio/*`**

---

### Datenbank & Governance

#### Tabellen (16 produktiv)

| Kategorie | Tabellen | RLS |
|-----------|----------|-----|
| **Core Foundation (7)** | `organizations`, `profiles`, `memberships`, `org_delegations`, `audit_events`, `tile_catalog`, `tenant_tile_activation` | ✅ |
| **Referenz-Modul (9)** | `properties`, `units`, `property_features`, `property_financing`, `contacts`, `documents`, `leases`, `renter_invites`, `access_grants` | ✅ |

#### Enums

| Enum | Werte |
|------|-------|
| `org_type` | internal, partner, sub_partner, client, renter |
| `membership_role` | platform_admin, org_admin, internal_ops, sales_partner, renter_user |
| `delegation_status` | active, revoked, expired |

#### Funktionen

| Funktion | Typ | Zweck |
|----------|-----|-------|
| `is_platform_admin()` | SECURITY INVOKER | God-Mode-Check |
| `is_parent_access_blocked()` | SECURITY INVOKER | Privacy-Block-Check |

#### Was NICHT existiert (Phase 2+)

- `listings`, `reservations`, `communication_events`, `data_rooms`, `data_room_documents`, `share_links`, `finance_packages`, `rent_payments`

---

## B) ZIELBILD — Definition of Done

### Admin-Portal "Feature-Complete Enough"

Ein fertiges Admin-Portal erfüllt:

| Bereich | Anforderung | Etappe |
|---------|-------------|--------|
| **Organizations** | CRUD + Hierarchie + Lockdown-Toggle | ✅ Done |
| **Users** | Membership-CRUD (Create/Edit/Delete) mit Rollen-Picker | E1 |
| **Delegations** | CRUD mit Scope-Picker, Revoke-Flow | E1 |
| **Master Contacts** | Kontakt-CRUD mit Tenant-Scoping | ✅ Done |
| **Tile Catalog** | Modul-Definitionen + Per-Tenant-Aktivierung | ✅ Done |
| **Oversight** | Read-only Drill-Down: Tenant → Member → Property → Module | E1 |
| **Skeletons** | Integrations, Communication, Support als bewusste Platzhalter | ✅ Akzeptiert |

**Abnahmekriterium:** Alle E1-Aufgaben erledigt, keine TypeScript-Fehler, alle Routen navigierbar.

---

### Muster-User-Portal "Feature-Complete Enough"

Ein fertiges Muster-Portal erfüllt:

| Bereich | Anforderung | Etappe |
|---------|-------------|--------|
| **Dediziertes Layout** | `PortalLayout.tsx` mit Header, Tenant-Switcher, Mobile-Nav | E2 |
| **Homescreen** | iOS-Kacheln aus `tile_catalog` + `tenant_tile_activation` | ✅ Done |
| **Alle Module navigierbar** | Jede Route `/portal/:moduleCode/:subRoute` erreichbar | E2 |
| **Referenz-Modul integriert** | Immobilien-CRUD unter `/portal/immobilien/*` | E3 |
| **Super-User-Test** | Tenant mit 7 Modulen, alle 35 Routen navigierbar | E4 |

**Abnahmekriterium:** Super-User sieht alle 7 Kacheln, kann alle 35 Routen navigieren, Tenant-Switch funktioniert.

---

### Modul-Pattern (1+4)

Jedes Zone-2-Modul folgt diesem Muster:

```
/portal/:moduleCode          → Hauptkachel (Overview/Dashboard)
/portal/:moduleCode/sub1     → Sub-Tile 1
/portal/:moduleCode/sub2     → Sub-Tile 2
/portal/:moduleCode/sub3     → Sub-Tile 3
/portal/:moduleCode/sub4     → Sub-Tile 4
```

**Routing-Konvention:**
- `tile_catalog.main_tile_route` = `/portal/:moduleCode`
- `tile_catalog.sub_tiles[n].route` = `/portal/:moduleCode/:subRoute`

---

### Super-User Blueprint

| Aspekt | Definition |
|--------|------------|
| **Tenant** | Alle 7 Module aktiviert in `tenant_tile_activation` |
| **User** | Hat Membership mit maximaler Sichtbarkeit |
| **Rollen-Kombination** | Vertriebspartner + Eigentümer + Vermieter (alle Module sichtbar) |
| **Zweck** | Referenz-Setup, Testumgebung, Ausgangspunkt für Tenant-Erstellung |

---

## C) UMSETZUNGS- & STRATEGIEVORSCHLAG

### Bewertung der vorgeschlagenen Reihenfolge

| Schritt | Vorschlag | Bewertung | Begründung |
|---------|-----------|-----------|------------|
| 1 | Admin-Portal zuerst | ✅ **Bestätigt** | Zone 1 steuert Zone 2. Ohne Memberships/Delegations kein vollständiger Test. |
| 2 | Zone-2-Shell + Musterportal | ✅ **Bestätigt** | Framework muss beweisen, dass es funktioniert. |
| 3 | Modulweise Iteration | ✅ **Bestätigt** | Fokussierte Entwicklung ohne Ablenkung. |

**Reihenfolge bestätigt, keine Alternative nötig.**

---

### Etappenplan mit DoD

#### Etappe 1: Admin-Portal Feature-Complete

**Ziel:** Alle kritischen Admin-Funktionen nutzbar.

| Aufgabe | Priorität | Beschreibung |
|---------|-----------|--------------|
| Memberships CRUD | P0 | In `/admin/users`: Membership erstellen, bearbeiten, löschen |
| Delegations UI | P0 | In `/admin/delegations`: CRUD mit Scope-Picker, Revoke-Flow |
| Oversight Drill-Down | P1 | In `/admin/oversight`: Tenant → Member → Property Hierarchie |

**DoD Etappe 1:**
- [ ] Memberships können erstellt, bearbeitet, gelöscht werden
- [ ] Delegations können mit Scopes erstellt/widerrufen werden
- [ ] Oversight zeigt Tenant → Member → Property Drill-Down
- [ ] Alle Routen fehlerfrei, keine TypeScript-Errors

**Ausklammern:** Integrations, Communication Hub, Support Mode → Phase 2

---

#### Etappe 2: Zone-2-Shell & Navigation

**Ziel:** Dediziertes Layout für Zone 2 mit Mobile-First UX.

| Aufgabe | Priorität | Beschreibung |
|---------|-----------|--------------|
| `PortalLayout.tsx` | P0 | Header mit Logo, Tenant-Switcher, User-Menü |
| Mobile-Navigation | P0 | Hamburger oder Bottom-Nav für Mobile |
| Back-Navigation | P0 | Immer zurück zum Homescreen möglich |

**DoD Etappe 2:**
- [ ] Zone 2 nutzt eigenes Layout (nicht AdminLayout)
- [ ] Tenant-Switcher funktioniert im Portal
- [ ] Alle Module navigierbar (auch als Platzhalter)
- [ ] Mobile-Ansicht korrekt (< 768px)

---

#### Etappe 3: Referenz-Modul Integration

**Ziel:** Immobilien-Modul in Zone 2 integrieren.

| Aufgabe | Priorität | Beschreibung |
|---------|-----------|--------------|
| Immobilien nach `/portal/immobilien/*` | P0 | PropertyList, PropertyDetail, PropertyForm migrieren |
| Sub-Tiles verbinden | P1 | Mindestens 2 Sub-Tiles mit echten Komponenten |
| Legacy-Redirect | P2 | `/portfolio/*` → Redirect nach `/portal/immobilien` |

**DoD Etappe 3:**
- [ ] Immobilien-CRUD funktioniert unter `/portal/immobilien`
- [ ] Mindestens 2 Sub-Tiles haben echte Komponenten
- [ ] Legacy-Routen zeigen Redirect-Hinweis

---

#### Etappe 4: Super-User Testfall

**Ziel:** Volltest mit maximal aktiviertem Tenant.

| Aufgabe | Priorität | Beschreibung |
|---------|-----------|--------------|
| Test-Tenant erstellen | P0 | Tenant mit allen 7 Modulen aktiviert |
| Homescreen-Test | P0 | Alle 7 Kacheln sichtbar |
| Routen-Test | P0 | Alle 35 Routen navigierbar |
| Tenant-Switch-Test | P1 | Wechsel zeigt unterschiedliche Modul-Sets |

**DoD Etappe 4:**
- [ ] 7 Kacheln sichtbar auf Homescreen
- [ ] Alle 35 Routen (7 × 5) navigierbar
- [ ] Tenant-Switch funktioniert
- [ ] Keine Console-Errors

---

#### Etappe 5: Dokumentation & Freeze

**Ziel:** Architektur dokumentiert und eingefroren.

| Aufgabe | Priorität | Beschreibung |
|---------|-----------|--------------|
| ADR-028 | P0 | "Backbone Complete" dokumentieren |
| STATUS_AND_STRATEGY.md | P0 | Finalen Status festhalten |
| README | P1 | Architektur-Übersicht für Entwickler |

**DoD Etappe 5:**
- [ ] ADR-028 geschrieben
- [ ] STATUS_AND_STRATEGY.md aktuell
- [ ] README mit Architektur-Diagramm

---

### Explizit ausgelagert (Phase 2/3)

| Feature | Begründung |
|---------|------------|
| **Integrations** | Infrastruktur, externe Abhängigkeiten |
| **Communication Hub** | Email-Provider-Integration nötig |
| **Support Mode** | Impersonation-Logik komplex |
| **Rollen-basierte Tile-Visibility** | Phase 1: Nur Tenant-Aktivierung |
| **Zone 3 Websites** | Andere Anforderungen (public-facing, SEO) |

---

## D) GOVERNANCE & ARBEITSWEISE

### Dokumentation (leichtgewichtig, verbindlich)

| Artefakt | Wann aktualisieren | Inhalt |
|----------|-------------------|--------|
| `DECISIONS.md` | Bei ADR-würdigen Entscheidungen | Date, Decision, Reason, Implications |
| `STATUS_AND_STRATEGY.md` | Bei Etappen-Abschluss | IST-Status, offene Punkte |
| Changelog in Chat | Bei jeder Session | Was wurde geändert |

### Etappen-Freeze

1. Etappe abgeschlossen → Statusbericht
2. User bestätigt "Done" oder listet offene Punkte
3. Offene Punkte werden geschlossen ODER explizit auf nächste Etappe verschoben
4. Erst nach Bestätigung: Nächste Etappe

### Regeln zur Vermeidung von Detail-Optimierung

- **Scope-Check:** "Ist das Teil der aktuellen Etappe?"
- **No Gold-Plating:** Funktional > Perfekt
- **Explicit Deferral:** "Nice to have" → spätere Etappe
- **Parallelbau verboten:** Keine neuen Features außerhalb der aktuellen Etappe

---

## E) EMPFEHLUNG NÄCHSTE SCHRITTE

**Empfehlung: Etappe 1 starten — Admin-Portal Feature-Complete**

**Erste Aktion:**
1. **Memberships CRUD** in `/admin/users` vervollständigen (Edit, Delete)
2. **Delegations UI** komplett neu bauen mit Scope-Picker

**Warum:**
- Zone 1 steuert Zone 2
- Ohne funktionierende Memberships/Delegations kein vollständiger Admin-Test
- Überschaubarer Scope, klare DoD

---

*Dieses Dokument ist die verbindliche Referenz. Änderungen erfordern explizite Bestätigung.*
