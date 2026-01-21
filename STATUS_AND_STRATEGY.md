# System of a Town — Status, Zielbild & Strategie

> **Datum**: 2026-01-21  
> **Zweck**: Verbindliche Dokumentation des aktuellen Stands, gemeinsames Zielbild und Umsetzungsstrategie

---

## 1) IST-STATUS

### A) Datenbank & Foundation

#### Core Foundation (produktiv & stabil)

| Tabelle | Kategorie | Beschreibung | RLS |
|---------|-----------|--------------|-----|
| `organizations` | Core | Multi-Tenant-Hierarchie mit `materialized_path`, `parent_access_blocked` | ✅ Vollständig |
| `profiles` | Core | User-Profile mit `active_tenant_id` | ✅ Vollständig |
| `memberships` | Core | User-Org-Zuordnung mit Rollen (5 Rollen-Enum) | ✅ Vollständig |
| `org_delegations` | Core | Cross-Org-Zugriffe mit Scopes (JSONB) | ✅ Vollständig |
| `audit_events` | Core | Immutables Audit-Log | ✅ INSERT-only |
| `tile_catalog` | Core | Zone-2-Modul-Definitionen (7 Module seeded) | ✅ Vollständig |
| `tenant_tile_activation` | Core | Per-Tenant Modul-Aktivierung | ✅ Vollständig |

#### Referenz-/Beispielimplementierung (Phase 1.3/1.4)

| Tabelle | Kategorie | Beschreibung | RLS |
|---------|-----------|--------------|-----|
| `properties` | Referenz | Immobilien-Stammdaten | ✅ Vollständig |
| `units` | Referenz | Einheiten pro Immobilie | ✅ Vollständig |
| `property_features` | Referenz | Feature-Aktivierung pro Property (MSV, Kaufy, etc.) | ✅ Vollständig |
| `property_financing` | Referenz | Finanzierungsdaten | ✅ Vollständig |
| `contacts` | Referenz | Kontaktdaten pro Tenant | ✅ Vollständig |
| `documents` | Referenz | Dokument-Metadaten | ✅ Vollständig |
| `leases` | Referenz | Mietverträge mit `renter_org_id` | ✅ Vollständig |
| `renter_invites` | Referenz | Mieter-Einladungen | ✅ Vollständig |
| `access_grants` | Referenz | Explizite Zugriffsfreigaben | ✅ Vollständig |

#### Platzhalter für spätere Module

| Tabelle | Status | Anmerkung |
|---------|--------|-----------|
| `listings` | ❌ Nicht vorhanden | Kaufy-Modul (Vertrieb) |
| `reservations` | ❌ Nicht vorhanden | Kaufy-Modul |
| `rent_payments` | ❌ Nicht vorhanden | Miety-Modul (Zahlungsverfolgung) |
| `finance_packages` | ❌ Nicht vorhanden | Finanzierungspaket-Builder |
| `communication_events` | ❌ Nicht vorhanden | Kommunikation |
| `data_rooms` | ❌ Nicht vorhanden | Datenraum für Finanzierung |
| `share_links` | ❌ Nicht vorhanden | Token-basiertes Teilen |

#### Enums (produktiv)

```
org_type: platform, partner, client, sub_partner, renter
membership_role: platform_admin, org_admin, internal_ops, sales_partner, renter_user
delegation_status: active, revoked, expired
```

#### Funktionen (produktiv)

- `is_platform_admin()` → God Mode Check
- `is_parent_access_blocked(target_org_id)` → Hierarchie-Lockdown

---

### B) Zone 1 — Admin-Portal

**Route-Prefix**: `/admin/*`  
**Layout**: Sidebar-basiert (`AdminLayout` + `AdminSidebar`)

| Menüpunkt | Route | Status | Zweck | Was fehlt für "fertig" |
|-----------|-------|--------|-------|------------------------|
| **Dashboard** | `/admin` | ⬜ Teilfunktional | Session-Info, Basis-Stats | Erweiterte KPIs, Alerts |
| **Organizations** | `/admin/organizations` | ✅ Fachlich nutzbar | Org-CRUD, Hierarchie | — |
| **Organizations Detail** | `/admin/organizations/:id` | ✅ Fachlich nutzbar | Org-Details, Mitglieder | — |
| **Users & Memberships** | `/admin/users` | ⬜ Teilfunktional | User-Übersicht | Membership-Management UI |
| **Delegations** | `/admin/delegations` | ⬜ Nur Scaffold | Delegierungs-Verwaltung | CRUD-UI fehlt komplett |
| **Master Contacts** | `/admin/contacts` | ✅ Fachlich nutzbar | Zentrale Kontakt-CRUD | — |
| **Tile Catalog** | `/admin/tiles` | ✅ Fachlich nutzbar | Modul-Definitionen, Tenant-Aktivierung | Inline-Edit für Tiles |
| **Integrations** | `/admin/integrations` | ⬜ Nur Scaffold | API-Key-Verwaltung, Service-Status | Komplette Implementierung |
| **Communication Hub** | `/admin/communication` | ⬜ Nur Scaffold | Campaigns, Templates, Audiences | Komplette Implementierung |
| **Oversight** | `/admin/oversight` | ⬜ Teilfunktional | System-Übersicht (Read-only) | Immobilien-/Modul-Details |
| **Support Mode** | `/admin/support` | ⬜ Nur Scaffold | Tenant-Impersonation | Komplette Implementierung |

**Legende:**
- ⬜ Nur Scaffold = UI-Shell ohne Funktionalität
- ⬜ Teilfunktional = Basis-Funktionen vorhanden, aber unvollständig
- ✅ Fachlich nutzbar = CRUD/Workflow funktioniert

---

### C) Zone 2 — User-Portal

**Route-Prefix**: `/portal/*`  
**Layout**: Kein Sidebar, eigenes mobil-first Layout (aktuell in `PortalHome`)

#### Framework-Status

| Komponente | Status | Beschreibung |
|------------|--------|--------------|
| **PortalHome** | ✅ Implementiert | iOS-Style Kachel-Homescreen, dynamisches Rendering |
| **ModulePlaceholder** | ✅ Implementiert | Generischer Platzhalter für alle Sub-Routes |
| **Tile Catalog Integration** | ✅ Implementiert | Liest aus `tile_catalog` + `tenant_tile_activation` |
| **Tenant-Switcher** | ⬜ Teilweise | Nutzt `AuthContext`, aber kein dediziertes UI in Zone 2 |
| **Dedizierte Shell/Layout** | ❌ Fehlt | Zone 2 braucht eigenes Layout (kein AdminLayout) |

#### Modul-Status

| Modul (tile_code) | Typ | Main-Route | Status |
|-------------------|-----|------------|--------|
| `immobilien` | Referenz | `/portal/immobilien` | ⬜ Platzhalter (echte UI unter `/portfolio`) |
| `kaufy` | Dummy | `/portal/kaufy` | ⬜ Platzhalter |
| `miety` | Dummy | `/portal/miety` | ⬜ Platzhalter |
| `dokumente` | Dummy | `/portal/dokumente` | ⬜ Platzhalter |
| `kommunikation` | Dummy | `/portal/kommunikation` | ⬜ Platzhalter |
| `services` | Dummy | `/portal/services` | ⬜ Platzhalter |
| `einstellungen` | Dummy | `/portal/einstellungen` | ⬜ Platzhalter |

**Legende:**
- Referenz = Hat funktionale UI-Komponenten (PropertyList, PropertyDetail, etc.)
- Dummy = Nur `ModulePlaceholder` mit "Coming soon"

---

## 2) ZIELBILD — Mein Verständnis

### Was bedeutet ein "fertiges Admin-Portal" (Zone 1)?

Ein **fertiges Admin-Portal** ist eine vollständige Steuerzentrale für Plattform-Operationen:

1. **Tenants & Access vollständig verwaltbar**
   - Organisationen erstellen, bearbeiten (nicht löschen)
   - Hierarchien visualisieren (Baumansicht)
   - Lockdown pro Org konfigurieren
   - Memberships zuweisen/entziehen
   - Delegationen erstellen/widerrufen mit Scope-Auswahl

2. **Master Data zentral gepflegt**
   - Kontakte mit/ohne Account verwalten
   - Import/Export-Fähigkeit
   - Tenant-übergreifende Suche (nur Platform Admin)

3. **Feature Activation als zentrale Steuerung**
   - Tile Catalog vollständig CRUD (Platform Admin)
   - Per-Tenant-Aktivierung mit Audit-Trail
   - Aktivierungs-Status auf einen Blick

4. **System-Übersicht (Oversight)**
   - Read-only Dashboard mit System-KPIs
   - Drill-down in Tenants, Immobilien, Module
   - Keine Schreiboperationen — nur Monitoring

5. **Skeletons für zukünftige Funktionen**
   - Integrations: API-Key-Management, Webhook-Status
   - Communication Hub: Template-Verwaltung, Kampagnen
   - Support Mode: Tenant-Impersonation für Debugging

### Was bedeutet ein "fertiges Muster-User-Portal" (Zone 2)?

Ein **fertiges Muster-Portal** ist das technische Framework für alle End-User-Portale:

1. **Dedizierte Shell**
   - Eigenes Layout (kein AdminLayout)
   - Mobil-first Responsive Design
   - Header mit Tenant-Switcher und User-Menü
   - Kein Sidebar — Tile-Navigation

2. **Homescreen als Zentrale**
   - iOS-Style Kachel-Grid
   - Dynamisches Rendering aus `tile_catalog` + `tenant_tile_activation`
   - Nur aktivierte Module sichtbar

3. **Modul-Pattern etabliert**
   - Jedes Modul: 1 Hauptkachel + 4 Sub-Kacheln
   - Routing-Konvention: `/portal/:moduleCode/:subRoute`
   - Registry im Code für Komponenten-Mapping

4. **Alle Module als navigierbare Struktur**
   - Auch wenn Inhalt "Coming soon" ist
   - Routing MUSS funktionieren
   - Rücknavigation zum Homescreen

### Rolle des Musterportals

Das Muster-Portal ist:
- **Blaupause**: Definiert UI/UX-Pattern für alle künftigen Portale
- **Test-Umgebung**: Ort, wo alle Module koexistieren und getestet werden
- **Framework-Nachweis**: Beweist, dass Tile-System funktioniert

### Super-User-Konstellation

Ein Nutzer, der gleichzeitig:
- **Vertriebspartner** (Kaufy-Zugang)
- **Eigentümer** (Immobilien-Zugang)
- **Vermieter** (Miety-Zugang)

...sieht auf seinem Homescreen ALLE aktivierten Module, weil:
- Der Tenant alle Module aktiviert hat (`tenant_tile_activation`)
- Seine Rolle(n) Zugriff erlauben
- Das Tile-System alle freigegebenen Kacheln rendert

Das ist der **"Maximum-Visibility"-Testfall** für das Framework.

---

## 3) STRATEGIE — Umsetzungsvorschlag

### Etappe 1: Admin-Portal Feature-Complete
**Ziel**: Zone 1 ist fachlich vollständig nutzbar für alle Basis-Operationen.

**Scope:**
- ✅ Organizations (bereits fertig)
- ✅ Master Contacts (bereits fertig)
- ✅ Tile Catalog (bereits fertig)
- 🔧 Users & Memberships: Vollständiges CRUD für Memberships
- 🔧 Delegations: CRUD-UI mit Scope-Picker
- 🔧 Oversight: Drill-down in Tenants mit Details
- ⬜ Integrations & Communication Hub: Bleiben Skeletons

**Definition of Done:**
- [ ] Platform Admin kann alle Tenants und deren Mitglieder verwalten
- [ ] Delegationen können erstellt und widerrufen werden
- [ ] Oversight zeigt alle Tenants mit Mitgliedern, Immobilien, Modulen
- [ ] Keine TypeScript-Fehler, alle Routen funktional

**Risiken:**
- Komplexität bei Scope-Picker für Delegationen
- UX für Hierarchie-Visualisierung

**Geschätzter Aufwand**: 3-4 Sessions

---

### Etappe 2: Zone-2-Shell & Navigation
**Ziel**: Dediziertes Layout für Zone 2, Tenant-Switcher, Modul-Registry.

**Scope:**
- 🔧 Neues `PortalLayout` (Header, kein Sidebar)
- 🔧 Tenant-Switcher im Header
- 🔧 Modul-Registry als Code-Mapping
- 🔧 Back-Navigation zu Homescreen

**Definition of Done:**
- [ ] Zone 2 hat eigenes Layout (nicht AdminLayout)
- [ ] Tenant-Switcher funktioniert
- [ ] Alle 7 Module navigierbar (auch wenn Inhalt leer)
- [ ] Mobile-Breakpoints korrekt

**Risiken:**
- Layout-Konsistenz mit zukünftigen Modulen

**Geschätzter Aufwand**: 1-2 Sessions

---

### Etappe 3: Referenz-Modul Integration
**Ziel**: Bestehendes Immobilien-Modul in Zone-2-Framework integrieren.

**Scope:**
- 🔧 PropertyList, PropertyDetail, PropertyForm unter `/portal/immobilien/*`
- 🔧 Sub-Tiles für Immobilien befüllen (Exposé, MSV, Vertrieb, Dokumente)
- 🔧 Legacy `/portfolio/*` deprecaten

**Definition of Done:**
- [ ] Immobilien-CRUD funktioniert unter `/portal/immobilien`
- [ ] Sub-Tiles navigieren zu echten Komponenten
- [ ] `/portfolio/*` zeigt Redirect-Hinweis

**Risiken:**
- Routing-Konflikte mit Legacy-Routen

**Geschätzter Aufwand**: 2 Sessions

---

### Etappe 4: Super-User Testfall
**Ziel**: Ein Tenant mit allen Modulen, ein User mit allen Rollen — Volltest.

**Scope:**
- 🔧 Test-Tenant mit allen 7 Modulen aktiviert
- 🔧 Test-User mit multiplen Memberships (oder org_admin mit Vollzugriff)
- 🔧 Homescreen zeigt alle Kacheln
- 🔧 Jede Kachel navigierbar

**Definition of Done:**
- [ ] Homescreen zeigt 7 Kacheln
- [ ] Jede Kachel → Main-Route funktioniert
- [ ] Jede Sub-Kachel → Sub-Route funktioniert
- [ ] Tenant-Switch zeigt unterschiedliche Kachel-Sets

**Risiken:**
- Testdaten-Konsistenz

**Geschätzter Aufwand**: 1 Session

---

### Etappe 5: Dokumentation & Freeze
**Ziel**: Architektur dokumentiert, Memories aktualisiert, Baseline frozen.

**Scope:**
- 📝 ADR-028: "Zone 1 & Zone 2 Backbone Complete"
- 📝 Memories aktualisieren (Status, Architektur)
- 📝 README mit Architektur-Übersicht
- 📝 Changelog finalisieren

**Definition of Done:**
- [ ] DECISIONS.md aktuell
- [ ] Memories reflektieren finalen Status
- [ ] README beschreibt 3-Zonen-Architektur
- [ ] Expliziter Freeze-Vermerk

**Geschätzter Aufwand**: 1 Session

---

## 4) GOVERNANCE & ARBEITSWEISE

### Dokumentation (leichtgewichtig, verbindlich)

| Artefakt | Wann aktualisieren | Inhalt |
|----------|-------------------|--------|
| `DECISIONS.md` | Bei jeder architekturellen Entscheidung | ADR-Format (Date, Decision, Reason, Implications) |
| `STATUS_AND_STRATEGY.md` (dieses Dokument) | Bei Etappen-Abschluss | IST-Status, offene Punkte |
| Memories | Bei signifikanten Änderungen | Kurzfassung für Kontext-Erhalt |
| Changelog in DECISIONS.md | Bei jeder Session mit Änderungen | Was wurde gebaut/geändert |

### Etappen-Freeze

**Prinzip**: Nach jeder Etappe explizite Abnahme, bevor nächste Etappe beginnt.

**Ablauf:**
1. Etappe abgeschlossen → Statusbericht an User
2. User bestätigt "Done" oder listet offene Punkte
3. Offene Punkte werden in aktueller Etappe geschlossen ODER explizit in nächste Etappe verschoben
4. Erst nach Bestätigung: Nächste Etappe beginnen

**Kein globaler Stillstand**: Fixes und kleine Verbesserungen innerhalb einer Etappe sind erlaubt, solange sie das Etappen-Ziel nicht gefährden.

### Vermeidung von Detail-Optimierung

**Regeln:**
1. **Scope-Check**: Vor jeder Implementierung fragen: "Ist das Teil der aktuellen Etappe?"
2. **No Gold-Plating**: Funktional > Perfekt. Erst Struktur, dann Optimierung.
3. **Explicit Deferral**: Wenn etwas "nice to have" ist, explizit notieren und in spätere Etappe verschieben.
4. **Time-Boxing**: Komplexe Features maximal 2 Sessions, dann Status-Check.

---

## 5) OFFENE FRAGEN (Klärungsbedarf)

1. **Rollen-basierte Tile-Visibility**: Soll das Tile-System Rollen prüfen (z.B. "Kaufy nur für sales_partner")? Aktuell: Nur Tenant-Aktivierung, keine Rollen-Prüfung.

2. **Legacy `/portfolio/*` Handling**: Sofort entfernen oder als Redirect behalten?

3. **Integrations & Communication Hub**: Bleiben diese dauerhaft Skeletons oder sollen sie in einer späteren Phase implementiert werden?

4. **Zone 3 (Websites)**: Wann und wie wird diese Zone geplant? Separate Strategie-Session nötig?

---

## 6) NÄCHSTER SCHRITT

**Empfehlung**: Mit **Etappe 1 (Admin-Portal Feature-Complete)** beginnen, da Zone 1 die Steuerung für Zone 2 ist.

**Erste Aktion**: Users & Memberships CRUD vervollständigen, dann Delegations UI.

---

*Dieses Dokument ersetzt keine Entscheidungen, sondern dokumentiert den aktuellen Stand und schlägt einen Weg vor. Alle strategischen Entscheidungen erfordern explizite Bestätigung.*
