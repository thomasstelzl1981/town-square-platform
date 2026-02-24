
# Zone 1 Tiefenanalyse — Befunde und Harmonisierungsplan

## ANALYSE-ERGEBNISSE

### A. Manifest- und Spec-Inkonsistenzen

| # | Befund | Schwere | Datei |
|---|--------|---------|-------|
| A1 | **Lead Desk**: Alle 5 Sub-Routen (`pool`, `zuweisungen`, `provisionen`, `monitor`) verweisen auf dieselbe Komponente `LeadDeskDashboard` statt auf dedizierte Lazy-Komponenten | Hoch | `routesManifest.ts:151-154` |
| A2 | **Finance Desk**: Gleicher Fehler — alle 5 Sub-Routen zeigen auf `FinanceDeskDashboard` | Hoch | `routesManifest.ts:168-171` |
| A3 | **Pet Desk**: Route `pet-desk` hat 5 Tabs im Manifest, aber Desk-Datei hat 6 Tabs (zusaetzlich "Kontakte") — Manifest und Implementation divergieren | Mittel | `routesManifest.ts:161-165` vs. `PetmanagerDesk.tsx:19-26` |
| A4 | **Sales Desk**: Manifest hat nur `kontakte` nicht als Route, aber `SalesDeskKontakte.tsx` existiert und wird in `SalesDesk.tsx` lazy geladen | Mittel | `routesManifest.ts:144-148` |
| A5 | **FutureRoom**: 8 Sub-Routen (`inbox`, `zuweisung`, etc.) sind im Manifest registriert, aber Sidebar filtert sie korrekt aus. Jedoch fehlt eine `kontakte`-Route, die in anderen Desks vorhanden ist | Niedrig | `routesManifest.ts:122-130` |
| A6 | **Acquiary**: 3 Legacy-Routen (`inbox`, `assignments`, `audit`) sind noch im Manifest. Sollten entweder entfernt oder als `deprecated_routes` markiert werden | Niedrig | `routesManifest.ts:140-142` |
| A7 | **AdminSidebar Pet Desk Pfad**: Sidebar prueft auf `petmanager` UND `pet-desk` Praefixe in `shouldShowInNav()` — redundant, da Manifest nur `pet-desk` nutzt | Niedrig | `AdminSidebar.tsx:157-158` |

### B. Hardcoded Data (Verstoesse gegen Demo Data Governance)

| # | Befund | Datei | Zeilen |
|---|--------|-------|--------|
| B1 | **Integrations: Voice-Tabelle** — 11 Zeilen hardcoded (`ArmstrongContainer`, `ChatPanel`, etc.) direkt als Array-Literal im JSX | `Integrations.tsx` | 234-246 |
| B2 | **FinanceDeskDashboard: BERATUNGSFELDER** — 5 Eintraege (`Stiftungen`, `Vermoegensschutz`, etc.) als `const` Array hardcoded | `FinanceDeskDashboard.tsx` | 11-17 |
| B3 | **ManagerFreischaltung: ROLE_LABELS + ROLE_MODULE_MAP** — 5 Eintraege hardcoded statt aus `ROLES_CATALOG` abgeleitet | `ManagerFreischaltung.tsx` | 75-89 |
| B4 | **Dashboard: "Go-live" Domain-Text** — hardcoded String `kaufy.app | systemofatown.app | miety.app | futureroom.app` | `Dashboard.tsx` | 269 |
| B5 | **Dashboard: PIN-Code** — `Zugangscode 2710` hardcoded im UI-Text | `Dashboard.tsx` | 174 |

**Hinweis**: B1 und B2 sind keine klassischen Demo-Daten (Geschaeftsentitaeten), sondern UI-Konfigurationsdaten. Sie verstoessen nicht direkt gegen die Demo Data Governance, sollten aber fuer Wartbarkeit in Config-Dateien ausgelagert werden.

### C. Sprachliche Inkonsistenzen (Deutsch/Englisch Mix)

| # | Befund | Datei |
|---|--------|-------|
| C1 | **Dashboard**: Titel "Dashboard" + "Welcome to the System of a Town Admin Portal" (Englisch), KPIs "Organizations", "Users", "Memberships", "Delegations", "Registered profiles" (Englisch), "Current Session", "Email", "Display Name" | `Dashboard.tsx` |
| C2 | **Organizations**: Titel "Organizations", Buttons "New Organization", "Cancel", "Create", Table-Headers Englisch, Mixed "Suche..." + "Alle Typen" (Deutsch) | `Organizations.tsx` |
| C3 | **Users**: Titel "Users & Memberships", "Add Membership", "Enter the user's UUID", Mixed Deutsch/Englisch | `Users.tsx` |
| C4 | **Delegations**: Titel "Delegations", "New Delegation", "Grant one organization access", Mixed | `Delegations.tsx` |
| C5 | **Support**: Komplett Englisch ("Search Users", "Search by email or display name", "No users found") | `Support.tsx` |
| C6 | **Oversight**: Titel "System Oversight", Mixed Deutsch/Englisch | `Oversight.tsx` |
| C7 | **Tile Catalog**: Titel "Tile Catalog & Testdaten" — Mixed | `TileCatalog.tsx` |
| C8 | **AdminSidebar**: Gruppen-Labels "Tenants & Access", "Backbone", "Feature Activation", "Platform Admin" — Englisch | `AdminSidebar.tsx:105-117` |

**Regel**: Zone 1 ist fuer technische Nutzer (deutsch). Alle UI-Texte sollten einheitlich Deutsch sein.

### D. Strukturelle / UX-Probleme

| # | Befund | Datei |
|---|--------|-------|
| D1 | **Lead Desk + Finance Desk**: Verwenden `OperativeDeskShell` NICHT — stattdessen eigene KPI-Card-Layouts. Alle anderen Desks (Pet, Projekt, Sales, Acquiary) nutzen `OperativeDeskShell` | `LeadDeskDashboard.tsx`, `FinanceDeskDashboard.tsx` |
| D2 | **Lead Desk**: Kein Tab-Router — alle Sub-Routen zeigen dieselbe Komponente. Sub-Seiten (`LeadPool.tsx`, `LeadAssignments.tsx`, etc.) existieren aber werden nicht eingebunden | `lead-desk/` |
| D3 | **Finance Desk**: Gleicher Befund — kein Tab-Router, keine Sub-Seiten eingebunden, obwohl `FinanceDeskInbox.tsx`, `FinanceDeskFaelle.tsx`, etc. existieren | `finance-desk/` |
| D4 | **Desk-Router-Dateien**: `src/pages/admin/desks/LeadDesk.tsx` und `FinanceDesk.tsx` existieren als Router-Shells, werden aber im `ManifestRouter` nicht korrekt eingebunden (Manifest zeigt auf `LeadDeskDashboard` / `FinanceDeskDashboard` direkt) | `desks/LeadDesk.tsx`, `desks/FinanceDesk.tsx` |
| D5 | **Lead Desk Kontakte**: `LeadDeskKontakte.tsx` existiert, ist aber nicht im Manifest registriert und nicht ueber Tabs erreichbar | `lead-desk/LeadDeskKontakte.tsx` |
| D6 | **Sales Desk Kontakte**: `SalesDeskKontakte.tsx` existiert, ebenfalls nicht im Manifest | `sales-desk/SalesDeskKontakte.tsx` |
| D7 | **Finance Desk Kontakte**: `FinanceDeskKontakte.tsx` existiert, nicht im Manifest | `finance-desk/FinanceDeskKontakte.tsx` |
| D8 | **Stub-Seite**: `AdminStubPage.tsx` existiert noch — Pruefung ob noch referenziert | `stub/AdminStubPage.tsx` |

### E. Fehlende Professionalisierung

| # | Befund |
|---|--------|
| E1 | **Dashboard**: Zeigt statische Quick-Action Buttons statt dynamischer System-Health-KPIs. Kein Echtzeit-Feed, keine Benachrichtigungen |
| E2 | **DESIGN Token-Nutzung**: Dashboard nutzt `DESIGN.SPACING.SECTION`, `DESIGN.TYPOGRAPHY.PAGE_TITLE`, aber viele andere Seiten (Oversight, Agreements, Delegations) verwenden eigene Inline-Styles |
| E3 | **Keine einheitliche Ladeanimation**: Manche Seiten zeigen `Loader2 animate-spin`, andere einen Skeleton, manche gar nichts |
| E4 | **Oversight laedt ALLE Daten**: `properties`, `units`, `memberships`, `contacts`, `finance_packages` — keine Pagination. Skaliert nicht |

---

## HARMONISIERUNGSPLAN

### Phase 1: Routing-Fixes (Kritisch)

**1.1 Lead Desk Tab-Router aktivieren**
- Manifest: Sub-Routen auf dedizierte Komponenten umleiten (`LeadPoolPage`, `LeadAssignmentsPage`, etc.)
- `ManifestRouter.tsx`: Lead Desk ueber `desks/LeadDesk.tsx` routen (wie Pet/Projekt Desk)
- `desks/LeadDesk.tsx` erhaelt die 5-Tab-Struktur (Dashboard, Kontakte, Pool, Zuweisungen, Provisionen, Monitor)

**1.2 Finance Desk Tab-Router aktivieren**
- Gleiche Behandlung wie Lead Desk
- `desks/FinanceDesk.tsx` erhaelt 5-Tab-Struktur (Dashboard, Kontakte, Inbox, Faelle, Monitor)
- Beide nutzen `OperativeDeskShell` fuer KPI-Header

**1.3 Pet Desk Manifest synchronisieren**
- `kontakte`-Route in Manifest nachregistrieren

**1.4 Sales Desk `kontakte` nachregistrieren**
- Route `sales-desk/kontakte` im Manifest ergaenzen

**1.5 Acquiary Legacy-Routen bereinigen**
- `inbox`, `assignments`, `audit` als `deprecated_routes` markieren oder entfernen

### Phase 2: Sprache vereinheitlichen (Mittel)

**2.1 AdminSidebar Gruppen-Labels**
- `Tenants & Access` -> `Mandanten & Zugriff`
- `Backbone` -> `Infrastruktur`
- `Feature Activation` -> `Modul-Verwaltung`
- `Platform Admin` -> `Plattform-Admin`
- `Operative Desks` bleibt (eingebuergerter Begriff)

**2.2 Dashboard Texte**
- "Welcome to..." -> "Willkommen im SoT Admin Portal"
- "Organizations" -> "Organisationen"
- "Users" -> "Benutzer"
- "Memberships" -> "Mitgliedschaften"
- "Current Session" -> "Aktuelle Sitzung"
- Alle Labels konsequent Deutsch

**2.3 Organizations Page**
- "New Organization" -> "Neue Organisation"
- "All Organizations" -> "Alle Organisationen"
- Table Headers Deutsch

**2.4 Users Page**
- "Users & Memberships" -> "Benutzer & Mitgliedschaften"
- "Add Membership" -> "Mitgliedschaft hinzufuegen"

**2.5 Delegations Page**
- "Delegations" -> "Delegierungen"
- "New Delegation" -> "Neue Delegierung"

**2.6 Support Page**
- "Support Mode" -> "Support-Modus"
- "Search Users" -> "Benutzer suchen"

**2.7 Oversight Page**
- "System Oversight" -> "System-Uebersicht"

**2.8 Tile Catalog**
- "Tile Catalog & Testdaten" -> "Modul-Katalog & Testdaten"

### Phase 3: Hardcoded Data auslagern (Niedrig)

**3.1 Voice-Integration Tabelle**
- Array aus `Integrations.tsx` in `src/config/voiceIntegrationManifest.ts` verschieben

**3.2 BERATUNGSFELDER**
- Array aus `FinanceDeskDashboard.tsx` in `src/config/financeDeskConfig.ts` verschieben

**3.3 ROLE_LABELS / ROLE_MODULE_MAP in ManagerFreischaltung**
- Aus `ROLES_CATALOG` ableiten statt duplizieren

**3.4 Dashboard Domain-Text + PIN-Code**
- In Konfigurationskonstanten auslagern

### Phase 4: OperativeDeskShell-Konsistenz (Mittel)

**4.1 Lead Desk auf OperativeDeskShell migrieren**
- KPI-Header, Zone-Flow-Badge, Tab-Navigation wie alle anderen Desks

**4.2 Finance Desk auf OperativeDeskShell migrieren**
- Gleiche Behandlung

### Phase 5: DESIGN Token Konsistenz (Niedrig)

**5.1 Alle Admin-Seiten auf DESIGN Tokens umstellen**
- `DESIGN.TYPOGRAPHY.PAGE_TITLE` fuer alle H1
- `DESIGN.SPACING.SECTION` fuer Root-Container
- `DESIGN.KPI_GRID.FULL` fuer KPI-Raster

---

## Zusammenfassung der Dateien

| Aenderung | Dateien |
|-----------|---------|
| Routing-Fixes | `routesManifest.ts`, `ManifestRouter.tsx`, `desks/LeadDesk.tsx`, `desks/FinanceDesk.tsx` |
| Sprache | `AdminSidebar.tsx`, `Dashboard.tsx`, `Organizations.tsx`, `Users.tsx`, `Delegations.tsx`, `Support.tsx`, `Oversight.tsx`, `TileCatalog.tsx` |
| Hardcoded auslagern | `Integrations.tsx`, `FinanceDeskDashboard.tsx`, `ManagerFreischaltung.tsx` |
| DeskShell Migration | `LeadDeskDashboard.tsx` -> via `desks/LeadDesk.tsx`, `FinanceDeskDashboard.tsx` -> via `desks/FinanceDesk.tsx` |
| Neue Config-Dateien | `src/config/voiceIntegrationManifest.ts`, `src/config/financeDeskConfig.ts` |

**Geschaetzter Umfang**: ~20 Dateien, davon 2 neue Config-Dateien.

**Modul-Freeze-Check**: Alle betroffenen Dateien liegen in `src/pages/admin/`, `src/components/admin/`, `src/manifests/` und `src/config/` — ausserhalb der Modul-Pfade. Kein Freeze betroffen.
