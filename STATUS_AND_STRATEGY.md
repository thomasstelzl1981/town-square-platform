# System of a Town — Status, Zielbild & Strategie

> **Datum**: 2026-01-21 (aktualisiert)  
> **Zweck**: Verbindliche Dokumentation des aktuellen Stands, gemeinsames Zielbild und Umsetzungsstrategie  
> **Version**: 2.1 — Strategische Reflexion

---

## 1) IST-STATUS — Ehrliche Bestandsaufnahme

### A) Zone 1 — Admin-Portal

**Route-Prefix**: `/admin/*`  
**Layout**: `AdminLayout` mit `AdminSidebar`

| Menüpunkt | Route | Status | Zweck | Fehlend für "fertig" |
|-----------|-------|--------|-------|----------------------|
| **Dashboard** | `/admin` | ⬜ Teilfunktional | Session-Info, Basis-Navigation | KPIs, Alerts, Quick-Actions |
| **Organizations** | `/admin/organizations` | ✅ Nutzbar | Org-CRUD, Hierarchie-Ansicht | Bulk-Operationen |
| **Organizations Detail** | `/admin/organizations/:id` | ✅ Nutzbar | Org-Details, Mitglieder-Übersicht | — |
| **Users & Memberships** | `/admin/users` | ⬜ Teilfunktional | User-Liste | Membership-CRUD fehlt |
| **Delegations** | `/admin/delegations` | 🔴 Nur Scaffold | Delegations-Verwaltung | **Gesamte UI fehlt** |
| **Master Contacts** | `/admin/contacts` | ✅ Nutzbar | Kontakt-CRUD mit Tenant-Scoping | — |
| **Tile Catalog** | `/admin/tiles` | ✅ Nutzbar | Modul-Definitionen, Tenant-Aktivierung | Inline-Edit |
| **Integrations** | `/admin/integrations` | 🔴 Nur Scaffold | API-Keys, Services | **Komplett leer** |
| **Communication Hub** | `/admin/communication` | 🔴 Nur Scaffold | Templates, Campaigns | **Komplett leer** |
| **Oversight** | `/admin/oversight` | ⬜ Teilfunktional | System-Monitoring (Read-only) | Drill-Down, Details |
| **Support Mode** | `/admin/support` | 🔴 Nur Scaffold | Impersonation | **Komplett leer** |

**Legende:**  
- ✅ Nutzbar = CRUD funktioniert, fachlich einsetzbar  
- ⬜ Teilfunktional = Basis-UI vorhanden, aber unvollständig  
- 🔴 Nur Scaffold = Leere Shell ohne Funktionalität

**Ehrliche Bewertung Zone 1:**  
- **4 von 11** Menüpunkten sind fachlich nutzbar  
- **3** sind teilfunktional  
- **4** sind reine Platzhalter  

---

### B) Zone 2 — User-Portal

**Route-Prefix**: `/portal/*`  
**Layout**: Aktuell **kein dediziertes Layout** — `PortalHome` ist standalone

#### Framework-Komponenten

| Komponente | Status | Beschreibung |
|------------|--------|--------------|
| `PortalHome.tsx` | ✅ Implementiert | iOS-Style Kachel-Homescreen |
| `ModulePlaceholder.tsx` | ✅ Implementiert | Generischer "Coming soon" Platzhalter |
| Tile-Catalog-Integration | ✅ Funktioniert | Liest aus `tile_catalog` + `tenant_tile_activation` |
| **Dediziertes Portal-Layout** | ❌ Fehlt | Zone 2 nutzt KEIN eigenes Shell/Layout |
| **Tenant-Switcher in Zone 2** | ❌ Fehlt | Kein UI zum Wechseln im Portal |
| **Mobile-Navigation** | ❌ Fehlt | Hamburger-Menü, Bottom-Nav etc. |

#### Modul-Status

| Modul | tile_code | Main-Route | Reale Implementierung? |
|-------|-----------|------------|------------------------|
| Immobilien | `immobilien` | `/portal/immobilien` | ❌ Nur Platzhalter (echte UI unter `/portfolio`) |
| Kaufy | `kaufy` | `/portal/kaufy` | ❌ Platzhalter |
| Miety | `miety` | `/portal/miety` | ❌ Platzhalter |
| Dokumente | `dokumente` | `/portal/dokumente` | ❌ Platzhalter |
| Kommunikation | `kommunikation` | `/portal/kommunikation` | ❌ Platzhalter |
| Services | `services` | `/portal/services` | ❌ Platzhalter |
| Einstellungen | `einstellungen` | `/portal/einstellungen` | ❌ Platzhalter |

**Ehrliche Bewertung Zone 2:**  
- Das **Kachel-Rendering funktioniert** (Tile Catalog → Homescreen)  
- **Kein einziges Modul** hat echte Funktionalität unter `/portal/*`  
- Das Immobilien-Referenzmodul liegt unter **Legacy-Routen** `/portfolio/*`  
- **Kein dediziertes Layout/Shell** für Zone 2 existiert

---

### C) Datenbank & Governance (Zusammenfassung)

| Kategorie | Tabellen | Status |
|-----------|----------|--------|
| **Core Foundation** | organizations, profiles, memberships, org_delegations, audit_events, tile_catalog, tenant_tile_activation | ✅ Produktiv, RLS vollständig |
| **Referenz-Modul** | properties, units, property_features, property_financing, contacts, documents, leases, renter_invites, access_grants | ✅ Produktiv, RLS vollständig |
| **Platzhalter** | listings, reservations, communication_events, data_rooms, share_links, finance_packages | ❌ Nicht vorhanden |

**Enums:** `org_type`, `membership_role`, `delegation_status`  
**Funktionen:** `is_platform_admin()`, `is_parent_access_blocked()`  
**God Mode:** Platform Admin hat uneingeschränkten Zugriff (ADR-013)

---

## 2) ZIELBILD — Mein Verständnis (gespiegelt)

### Was bedeutet ein "fertiges Admin-Portal"?

Ein **fertiges Admin-Portal** (Zone 1) ist die **zentrale Steuerzentrale** für Plattform-Operationen:

1. **Tenants & Access vollständig verwaltbar**
   - Organizations: CRUD, Hierarchie-Visualisierung, Lockdown-Toggle
   - Memberships: User-zu-Tenant-Zuordnung mit Rollen-Auswahl
   - Delegations: Cross-Org-Zugriffe mit Scope-Picker erstellen/widerrufen

2. **Master Data zentral gepflegt**
   - Kontakte mit/ohne Account verwalten (bereits fertig)
   - Tenant-übergreifende Suche für Platform Admin

3. **Feature Activation als Kontrollzentrum**
   - Tile Catalog verwalten (bereits fertig)
   - Per-Tenant-Aktivierung mit Audit-Trail

4. **System-Oversight (Read-only)**
   - Dashboard mit System-KPIs
   - Drill-down in Tenants → Mitglieder → Immobilien → Module

5. **Skeletons bewusst als Skeletons**
   - Integrations, Communication Hub, Support: UI vorhanden, aber explizit als "Phase 2" markiert

**Mein Verständnis:** Das Admin-Portal muss **nicht perfekt**, aber **vollständig navigierbar und für Basis-Operationen nutzbar** sein.

---

### Was bedeutet ein "fertiges Muster-User-Portal"?

Ein **fertiges Muster-Portal** (Zone 2) ist das **technische Framework** für alle End-User-Portale:

1. **Dedizierte Shell**
   - Eigenes Layout (NICHT AdminLayout)
   - Header mit Tenant-Switcher, User-Menü
   - Mobile-first (Bottom-Nav oder Hamburger)
   - Keine Sidebar — Tile-Navigation

2. **Homescreen als Zentrale**
   - iOS-Style Kachel-Grid (bereits implementiert)
   - Dynamisches Rendering aus tile_catalog + tenant_tile_activation
   - Rücknavigation immer möglich

3. **Modul-Pattern etabliert**
   - Jedes Modul: 1 Hauptkachel + 4 Sub-Kacheln
   - Routing: `/portal/:moduleCode/:subRoute`
   - Zentrale Registry im Code

4. **Alle Module navigierbar**
   - Auch wenn Inhalt "Coming soon"
   - Einheitliches UX-Pattern
   - Konsistente Back-Navigation

**Mein Verständnis:** Das Muster-Portal ist eine **Blaupause**, kein fertiges Produkt. Es beweist, dass das Framework funktioniert.

---

### Rolle des Musterportals

Das Muster-Portal dient als:
- **Blaupause**: Definiert UI/UX-Patterns für alle künftigen Portale
- **Test-Umgebung**: Alle Module koexistieren und können getestet werden
- **Framework-Nachweis**: Beweist, dass Tile-System, Routing und Aktivierung funktionieren

### Super-User-Konstellation

Ein Nutzer, der gleichzeitig:
- **Vertriebspartner** (Kaufy)
- **Eigentümer** (Immobilien)
- **Vermieter** (Miety)

...sieht auf seinem Homescreen **ALLE aktivierten Module**, weil:
1. Sein Tenant alle Module aktiviert hat (`tenant_tile_activation`)
2. Das Tile-System alle freigegebenen Kacheln rendert
3. Aktuell: **Keine Rollen-basierte Filterung** (siehe Frage 1)

**Meine Bewertung dieses Ansatzes:**

| Aspekt | Bewertung | Begründung |
|--------|-----------|------------|
| **Technisch sauber** | ✅ Ja | Tile-System ist entkoppelt, DB-gesteuert |
| **Skalierbar** | ✅ Ja | Neue Module = neue tile_catalog-Einträge |
| **Wartbar** | ✅ Ja | Aktivierung zentral in einem Ort |
| **Erweiterbar** | ⚠️ Mit Einschränkung | Rollen-basierte Visibility müsste separat implementiert werden |

**Verbesserungsvorschlag:** Das aktuelle Modell ist für Phase 1 korrekt. Rollen-basierte Visibility sollte als **optionale Erweiterung** geplant werden, nicht als Blocker.

---

## 3) STRATEGIEVORSCHLAG — Prüfung & Empfehlung

### Eure vorgeschlagene Reihenfolge

1. Admin-Portal zuerst vollständig fertigstellen
2. Dann Super-User-Musterportal
3. Dann modulweise Iteration

### Meine Bewertung

| Schritt | Bewertung | Begründung |
|---------|-----------|------------|
| **1. Admin zuerst** | ✅ Bestätigt | Zone 1 steuert Zone 2. Ohne fertige Aktivierung keine Tests möglich. |
| **2. Musterportal danach** | ✅ Bestätigt | Framework muss beweisen, dass es funktioniert, bevor Module gebaut werden. |
| **3. Modulweise Iteration** | ✅ Bestätigt | Erlaubt fokussierte Entwicklung ohne Ablenkung. |

**Ich bestätige diese Reihenfolge ohne Änderungen.**

---

### Konkretisierte Etappen

#### Etappe 1: Admin-Portal Feature-Complete
**Ziel:** Alle kritischen Admin-Funktionen nutzbar.

| Aufgabe | Priorität | Status |
|---------|-----------|--------|
| Memberships: CRUD in Users-Page | P0 | 🔧 |
| Delegations: Vollständige CRUD-UI mit Scope-Picker | P0 | 🔧 |
| Oversight: Drill-down in Tenants/Immobilien/Module | P1 | 🔧 |
| Dashboard: Quick-Stats und Alerts | P2 | 🔧 |

**Skeletons bleiben:** Integrations, Communication Hub, Support

**Definition of Done:**
- [ ] Memberships können erstellt, geändert, gelöscht werden
- [ ] Delegations können mit Scopes erstellt/widerrufen werden
- [ ] Oversight zeigt Tenant → Member → Property → Module Hierarchie
- [ ] Alle Routen fehlerfrei, keine TypeScript-Errors

---

#### Etappe 2: Zone-2-Shell & Navigation
**Ziel:** Dediziertes Layout für Zone 2 mit Mobile-First UX.

| Aufgabe | Priorität |
|---------|-----------|
| `PortalLayout.tsx` erstellen (Header, Mobile-Nav) | P0 |
| Tenant-Switcher im Header | P0 |
| Back-Navigation zu Homescreen | P0 |
| Mobile Breakpoints (< 768px) | P1 |

**Definition of Done:**
- [ ] Zone 2 nutzt eigenes Layout (nicht AdminLayout)
- [ ] Tenant-Switcher funktioniert
- [ ] Alle Module navigierbar
- [ ] Mobile-Ansicht korrekt

---

#### Etappe 3: Referenz-Modul Integration
**Ziel:** Immobilien-Modul in Zone 2 integrieren.

| Aufgabe | Priorität |
|---------|-----------|
| PropertyList/Detail/Form unter `/portal/immobilien/*` | P0 |
| Sub-Tiles mit echten Komponenten verbinden | P1 |
| Legacy `/portfolio/*` → Redirect | P2 |

**Definition of Done:**
- [ ] Immobilien-CRUD funktioniert unter `/portal/immobilien`
- [ ] Mindestens 2 Sub-Tiles haben echte Komponenten
- [ ] Legacy-Routen zeigen Redirect-Hinweis

---

#### Etappe 4: Super-User Testfall
**Ziel:** Volltest mit maximal aktiviertem Tenant.

| Aufgabe | Priorität |
|---------|-----------|
| Test-Tenant mit allen 7 Modulen aktivieren | P0 |
| Homescreen zeigt alle Kacheln | P0 |
| Jede Route navigierbar | P0 |
| Tenant-Switch zeigt unterschiedliche Sets | P1 |

**Definition of Done:**
- [ ] 7 Kacheln sichtbar auf Homescreen
- [ ] Alle 35 Routen (7 × 5) navigierbar
- [ ] Tenant-Switch funktioniert

---

#### Etappe 5: Dokumentation & Freeze
**Ziel:** Architektur dokumentiert und eingefroren.

| Aufgabe | Priorität |
|---------|-----------|
| ADR-028: "Backbone Complete" | P0 |
| Memories aktualisieren | P0 |
| README mit Architektur-Übersicht | P1 |
| Changelog finalisieren | P1 |

---

## 4) ANTWORTEN AUF OFFENE FRAGEN

### Frage 1: Rollen-basierte Tile-Visibility

**Empfehlung: Nein, nicht in Phase 1.**

**Begründung:**
- Aktuelles Modell: Tenant-Aktivierung = primärer Filter
- Rollen-Visibility wäre ein **zusätzlicher** Filter, kein Ersatz
- Komplexität steigt erheblich (tile_catalog müsste `required_roles` bekommen)
- Für Phase 1: Wenn ein Tenant ein Modul aktiviert, sehen es alle Mitglieder

**Für Phase 2:** Optional `required_roles` in `tile_catalog` oder separates `tile_role_visibility` Mapping.

---

### Frage 2: Legacy `/portfolio/*`

**Empfehlung: Temporär als Referenz behalten, dann Redirect.**

**Ablauf:**
1. **Etappe 1-2:** `/portfolio/*` bleibt funktional (Referenz zum Testen)
2. **Etappe 3:** Immobilien-Modul nach `/portal/immobilien/*` migrieren
3. **Etappe 4:** `/portfolio/*` → Redirect nach `/portal/immobilien`
4. **Nach Freeze:** Legacy-Routen entfernen

---

### Frage 3: Integrations & Communication Hub

**Empfehlung: Als stabile Skeletons belassen.**

**Begründung:**
- Beide sind **Infrastruktur-Features**, keine Business-Module
- Erfordern externe Abhängigkeiten (API-Keys, Email-Provider)
- Priorisierung: Zone 1 + Zone 2 Backbone > Infrastruktur-Erweiterungen

**Für Phase 2:** Integrations zuerst (API-Key-Vault), dann Communication Hub.

---

### Frage 4: Zone 3 (Websites)

**Empfehlung: Bewusst aus aktuellem Scope heraushalten.**

**Begründung:**
- Zone 3 hat andere Anforderungen (public-facing, SEO, Lead-Gen)
- Kein gemeinsamer Code mit Zone 1/2 außer DB/RLS
- Würde Fokus vom Backbone ablenken

**Für Phase 2:** Separate Strategie-Session, wenn Zone 1 + Zone 2 frozen sind.

---

## 5) GOVERNANCE — Vorschlag

### Dokumentation (leichtgewichtig, verbindlich)

| Artefakt | Wann aktualisieren | Inhalt |
|----------|-------------------|--------|
| `DECISIONS.md` | Bei ADR-würdigen Entscheidungen | Date, Decision, Reason, Implications |
| `STATUS_AND_STRATEGY.md` | Bei Etappen-Abschluss | IST-Status, offene Punkte |
| Changelog in Chat | Bei jeder Session | Was wurde geändert |

### Etappen-Freeze

1. Etappe abgeschlossen → Statusbericht
2. User bestätigt "Done" oder listet offene Punkte
3. Offene Punkte werden geschlossen ODER explizit verschoben
4. Erst nach Bestätigung: Nächste Etappe

### Vermeidung von Detail-Optimierung

- **Scope-Check:** "Ist das Teil der aktuellen Etappe?"
- **No Gold-Plating:** Funktional > Perfekt
- **Explicit Deferral:** "Nice to have" → spätere Etappe
- **Time-Boxing:** Max 2 Sessions pro Feature

---

## 6) EMPFEHLUNG FÜR NÄCHSTE ETAPPE

**Empfehlung: Etappe 1 starten — Admin-Portal Feature-Complete**

**Erste Aktion:**
1. **Memberships CRUD** in `/admin/users` implementieren
2. **Delegations UI** mit Scope-Picker

**Warum:**
- Zone 1 steuert Zone 2
- Ohne funktionierende Memberships/Delegations kein vollständiger Admin-Test
- Überschaubare Scope, klare DoD

---

*Dieses Dokument ist die verbindliche Referenz für Status und Strategie. Änderungen erfordern explizite Bestätigung.*
