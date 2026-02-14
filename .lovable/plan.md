

# MOD-18 Finanzanalyse — Reparatur & Redesign

## Soll-Ist-Analyse

### IST-Zustand (was aktuell kaputt ist)

| Problem | Datei | Details |
|---------|-------|---------|
| Keine sichtbare Tab-Navigation | `FinanzanalysePage.tsx` | Nur Router, keine SubTabNav -- User sieht keine Tabs |
| Tab 1 startet mit Setup-Status OBEN | `DashboardTile.tsx` | Health-Check/Konten-CTA ist das erste sichtbare Element |
| Kein Personen-Block | `DashboardTile.tsx` | Komplett fehlend -- keine Tabelle, kein UI |
| Dateinamen irrefuehrend | Alle 4 Tiles | ReportsTile = Cashflow, SzenarienTile = Vertraege, EinstellungenTile = Risiko |
| Investment-Stub in Tab 4 | `EinstellungenTile.tsx` | "Bald verfuegbar" Block muss raus |
| Alle CTAs falsch verlinkt | Alle 4 Tiles | Zeigen auf `/portal/finanzierung` statt `/portal/finanzierungsmanager` |
| Keine DB-Tabellen fuer Personen | Datenbank | `household_persons` und `pension_records` existieren nicht |

### SOLL-Zustand (4 Tabs, exakt)

| Tab | Label | Route (unveraendert) | Neue Datei |
|-----|-------|----------------------|------------|
| 1 | Uebersicht | `/portal/finanzanalyse/dashboard` | `UebersichtTab.tsx` |
| 2 | Cashflow & Budget | `/portal/finanzanalyse/reports` | `CashflowBudgetTab.tsx` |
| 3 | Vertraege & Fixkosten | `/portal/finanzanalyse/szenarien` | `VertraegeFixkostenTab.tsx` |
| 4 | Risiko & Absicherung | `/portal/finanzanalyse/settings` | `RisikoAbsicherungTab.tsx` |

---

## Umsetzungsplan (8 Schritte)

### Schritt 1: Datenbank-Migration

Zwei neue Tabellen als zentrale Personen-SSOT (wiederverwendbar in MOD-11 Finanzmanager):

**Tabelle `household_persons`:**
- id, tenant_id, user_id
- role (hauptperson / partner / kind / weitere)
- salutation, first_name, last_name, birth_date
- email, phone
- street, house_number, zip, city (optional)
- marital_status, employment_status, employer_name, net_income_range (optional)
- sort_order, is_primary, created_at, updated_at

**Tabelle `pension_records`:**
- id, person_id (FK zu household_persons), tenant_id
- info_date, current_pension, projected_pension, disability_pension
- created_at, updated_at

RLS auf beiden Tabellen via `tenant_id = get_user_tenant_id()`. Indexes auf tenant_id und person_id.

### Schritt 2: FinanzanalysePage.tsx -- SubTabNav einfuegen

- SubTabNav-Komponente (existiert bereits) mit exakt 4 Tabs oberhalb des Route-Outlets einfuegen
- Lazy-Imports auf neue Dateinamen umstellen
- Keine weiteren Tabs oder Routen

### Schritt 3: Tab 1 "Uebersicht" komplett neu bauen

Neue Datei `UebersichtTab.tsx` ersetzt `DashboardTile.tsx`. Strikte Block-Reihenfolge:

**Block A -- Personen im Haushalt (GANZ OBEN)**
- Query aus `household_persons` + `pension_records`
- Auto-Seed: Person Nr. 1 wird aus Profil-Stammdaten angelegt (is_primary=true)
- Pro Person eine ausklappbare Card (Accordion-Pattern)
  - Geschlossen: Name, Rolle, Geburtsdatum
  - Offen: Alle Felder editierbar + DRV/Renten-Subsektion
- Button: "+ Person hinzufuegen"
- Empty State: CTA "Stammdaten pruefen"

**Block B -- Kurz-Ueberblick (KPI Row)**
- 4 KPI Cards: Einnahmen (12M), Ausgaben (12M), Netto-Cashflow (12M), Fixkosten/Monat
- Ohne Daten: "---" mit Hinweis "Noch keine Kontodaten verbunden"

**Block C -- Top Treiber (nur bei vorhandenen Daten)**
- Top Merchants / Top Kategorien (Top 5), Expand zeigt Transaktionen

**Block D -- Setup / Konten (GANZ UNTEN)**
- Setup-Checkliste (Konten verbunden, Transaktionen vorhanden, Budget-Ziele)
- CTA: "Konten im Finanzmanager verbinden" zu `/portal/finanzierungsmanager`

### Schritt 4: Tab 2 "Cashflow & Budget" -- Minimale Anpassung

Neue Datei `CashflowBudgetTab.tsx` basierend auf `ReportsTile.tsx`:
- CTA-Links korrigieren zu `/portal/finanzierungsmanager`
- Inhalt bleibt sonst identisch

### Schritt 5: Tab 3 "Vertraege & Fixkosten" -- Minimale Anpassung

Neue Datei `VertraegeFixkostenTab.tsx` basierend auf `SzenarienTile.tsx`:
- CTA-Links korrigieren zu `/portal/finanzierungsmanager`
- Inhalt bleibt identisch

### Schritt 6: Tab 4 "Risiko & Absicherung" -- Investment-Stub entfernen

Neue Datei `RisikoAbsicherungTab.tsx` basierend auf `EinstellungenTile.tsx`:
- Investment-Analyse Block komplett entfernen
- CTA-Links korrigieren zu `/portal/finanzierungsmanager`
- Rest bleibt (Versicherungs-Check, Vorsorge-Teaser)

### Schritt 7: Hook erweitern

`useFinanzanalyseData.ts` erhaelt:
- Neuer Query fuer `household_persons` + `pension_records`
- Neue Mutations: createPerson, updatePerson, deletePerson, upsertPension
- Auto-Seed-Logik fuer Person Nr. 1 aus Profildaten

### Schritt 8: Alte Dateien loeschen

Die 4 alten Tile-Dateien (DashboardTile, ReportsTile, SzenarienTile, EinstellungenTile) werden durch die neuen Tab-Dateien ersetzt.

---

## Datei-Matrix

| Aktion | Datei |
|--------|-------|
| MIGRATION | `household_persons` + `pension_records` + RLS + Indexes |
| NEU | `src/pages/portal/finanzanalyse/UebersichtTab.tsx` |
| NEU | `src/pages/portal/finanzanalyse/CashflowBudgetTab.tsx` |
| NEU | `src/pages/portal/finanzanalyse/VertraegeFixkostenTab.tsx` |
| NEU | `src/pages/portal/finanzanalyse/RisikoAbsicherungTab.tsx` |
| EDIT | `src/pages/portal/FinanzanalysePage.tsx` |
| EDIT | `src/hooks/useFinanzanalyseData.ts` |
| LOESCHEN | 4 alte Tile-Dateien |

---

## Was sich NICHT aendert

- Route-Pfade bleiben identisch (dashboard, reports, szenarien, settings)
- CI/Widget-Design bleibt identisch (Cards, PageShell, ModulePageHeader, KPICard)
- Keine neuen Tabs, keine neuen Routen, kein Investment-Tab
- Existierende Shared-Komponenten (SubTabNav, PageShell, KPICard) werden wiederverwendet

