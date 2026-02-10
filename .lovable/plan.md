
# MOD-13 PROJEKTE -- IST-Audit + SOLL-Redesign + Implementierungsplan

---

## A) IST-AUDIT

### A.1 Manifest/Tiles-Status

| Tile | Route | Manifest | ProjektePage.tsx | Sichtbar? | Problem |
|------|-------|----------|-----------------|-----------|---------|
| Dashboard | /portal/projekte/dashboard | Ja (default) | Ja | Ja | Funktional, aber keine Widget-Struktur bei leerem State |
| Projekte | /portal/projekte/projekte | Ja | Ja (PortfolioTab) | Ja | Zeigt EmptyState "Keine Projekte" ohne Struktur |
| Vertrieb | /portal/projekte/vertrieb | Ja | Ja (VertriebTab) | Ja | Zeigt EmptyState "Keine Projekte vorhanden" ohne Widgets |
| Marketing | /portal/projekte/marketing | Ja | Ja (MarketingTab) | Ja | Zeigt EmptyState "Keine Projekte vorhanden" ohne Widgets |
| Kontexte | /portal/projekte/kontexte | NICHT im Manifest | Ja (hidden route) | Nur via Direktlink | Bewusst versteckt, kein Nav-Eintrag |

**Fazit Manifest:** 4 Tiles korrekt deklariert, Routing stimmt. KEIN Gating-Problem, KEIN Tile-Activation-Issue. Das Problem ist rein UI-seitig: leere States ohne Widget-Struktur.

### A.2 Legacy Route Findings

| Route | Datei | Typ | Fix |
|-------|-------|-----|-----|
| /portal/projekte/portfolio | ProjektePage.tsx:40 | Redirect -> /projekte | OK, korrekt |
| /portal/projekte/uebersicht | ProjektePage.tsx:41 | Redirect -> /dashboard | OK, korrekt |
| /portal/projekte/timeline | ProjektePage.tsx:42 | Redirect -> /projekte | OK, korrekt |
| /portal/projekte/dokumente | ProjektePage.tsx:43 | Redirect -> /projekte | OK, korrekt |
| /portal/projekte/einstellungen | ProjektePage.tsx:44 | Redirect -> /kontexte | OK, korrekt |
| /portal/projekte/neu | ProjektePage.tsx:45 | Redirect -> /dashboard?create=1 | OK, korrekt |
| /portal/projekte/kontexte | ProjektePage.tsx:31 | Hidden route, nicht im Manifest | Entweder ins Manifest oder entfernen |

**Fazit:** Alle Legacy-Routes sind korrekt migriert. Einziges Risiko: `/kontexte` ist eine Bypass-Route ausserhalb des Manifests.

### A.3 Root Causes fuer "kein Projekt erfasst"

| Seite | Root Cause |
|-------|-----------|
| Dashboard | Wenn `portfolioRows.length === 0`: zeigt nur Icon + "Laden Sie oben ein Expose hoch". Kein Widget-Grid, keine KPI-Placeholders. |
| Projekte (Portfolio) | Wenn `portfolioRows.length === 0`: EmptyState-Komponente mit Button "Projekt erstellen". Kein Table-Header, keine Struktur. |
| Vertrieb | Wenn `portfolioRows.length === 0`: EmptyState "Keine Projekte vorhanden". RETURN frueh, kein KPI-Grid sichtbar. |
| Marketing | Wenn `projects.length === 0`: EmptyState "Keine Projekte vorhanden". RETURN frueh, keine Stats/Cards. |

**Hauptproblem:** Alle Tabs nutzen `if (X === 0) return <EmptyState />` als fruehen Return -- damit verschwindet die gesamte Seitenstruktur. Der User sieht eine leere Seite statt einer strukturierten UI mit Demo-Daten/Placeholdern.

### A.4 SSOT-Akte (MOD-04 Mapping)

**Status:** NICHT implementiert. Die Tabelle `dev_project_units` hat KEIN `property_id` oder `sot_property_id` Feld. Es existiert keine Verlinkung von MOD-13 Units zu MOD-04 Properties. Der Klick auf eine Unit fuehrt zur MOD-13 `UnitDetailPage`, die eine parallele Akte fuehrt (Stammdaten, Preise, Reservierung, Dokumente) -- ein Verstoß gegen die SSOT-Regel.

### A.5 Sales Desk Integration

**Status:** Sales Desk existiert in Zone 1 (`/admin/sales-desk`) mit Listing-Management. ABER: MOD-13 hat KEINEN "Freigabe an Sales Desk senden"-Mechanismus. Das MarketingTab erlaubt direktes Kaufy-Listing via Toggle ohne Zone-1-Genehmigung -- ein Verstoß gegen den Golden Path GP-05.

---

## B) SOLL-REDESIGN PLAN

### B.1 Navigation (4 Tiles, KEINE Aenderung am Manifest)

Die bestehenden 4 Tiles bleiben:
1. **Dashboard** -- Intake + Overview + Widgets (GP-01)
2. **Projekte** -- Arbeitsfläche + Wohnungsliste + Sticky-Kalkulator (GP-02, GP-03)
3. **Vertrieb** -- Reservierungen + Distribution + Freigabe (GP-04, GP-05, GP-06)
4. **Marketing** -- Website Builder + Lead-Content (unveraendert, Placeholder bleibt)

**Begruendung gegen 5 Tiles:** Die bestehende Vertrieb-Seite deckt bereits Reservierungen ab. Distribution/Freigabe gehoert thematisch zum Vertrieb. Ein separater "Distribution"-Tab wuerde die Navigation unnoetig aufblaehn.

### B.2 Dashboard -- Widget-Redesign (P0)

**IMMER 5 Widgets sichtbar, auch ohne Daten:**

```text
W1: "So funktioniert's"       -- Bereits vorhanden (4-Step Visual). Behalten.
W2: "Projekt starten"         -- Magic Intake Card (vorhanden) + CTA "Manuell anlegen" (Popup)
W3: "Meine Projekte"          -- Projekt-Widgets als quadratische Cards (nicht Table)
                                 Wenn leer: Demo-Card mit Platzhalter + CTA
W4: "Kalkulation Preview"     -- Mini-KPI-Card mit Defaults (10/20/70)
                                 Wenn leer: Demo-Werte anzeigen
W5: "Reservierungen Preview"  -- Letzte 3 Reservierungen als Mandats-Widgets
                                 Wenn leer: Demo-Placeholder "Keine Reservierungen"
```

**Aenderungen:**
- Stats-Cards (Projekte/Einheiten/Quote/Umsatz) IMMER sichtbar mit 0-Werten statt `portfolioRows.length > 0` Guard
- Projekt-Tabelle durch quadratische Projekt-Cards ersetzen (wie Kontexte-Widgets)
- Kalkulations-Preview-Widget NEU (Mini-Version des Aufteiler-Kalkulators mit Default-Werten)
- Reservierungs-Preview-Widget NEU

### B.3 Projekte (Tab 2) -- Arbeitsfläche mit Sticky-Kalkulator (P0)

```text
OBEN:   Projekt-Widgets (quadratisch, klickbar, wie Kontexte)
        Wenn kein Projekt: Demo-Widget + CTA
LINKS:  Wohnungsliste/Preisliste (Table)
        Spalten: WE-Nr | Adresse | Flaeche | Miete | Verkaufspreis | Provision | Status-Ampel
        Zeilenklick: MOD-04 Akte oeffnen ODER "Akte erzeugen/SSOT fixieren"
RECHTS: Sticky Kalkulator-Kachel
        Defaults: Provision 10%, Marge 20%, Selbstkosten 70%
        Speicherbar pro Projekt
        Wenn kein Projekt: Demo-Mode mit Placeholder-Werten
```

**Aenderungen:**
- EmptyState fruehen Return ENTFERNEN -- immer Seitenstruktur zeigen
- Projekt-Auswahl ueber quadratische Widgets statt Dropdown
- Sticky-Kalkulator als rechte Seitenkachel (1/3 Breite)
- SSOT-Button "Akte erzeugen" pro Unit-Zeile (wenn kein property_id Mapping)

### B.4 Vertrieb (Tab 3) -- Erweitert um Distribution + Freigabe (P0/P1)

```text
OBEN:     KPI-Cards (IMMER sichtbar, auch mit 0-Werten)
MITTE:    Reservierungs-Tabelle (vorhanden, behalten)
          + Projekt-Status-Fortschrittsbalken (vorhanden, behalten)
          + Partner-Performance (vorhanden, behalten)
NEU UNTEN: "Freigabe & Distribution" Sektion
          - Kachel "Freigabe-Status" (pending/approved/rejected)
          - Button "An Sales Desk senden" (erzeugt Request an Zone 1)
          - Status-Anzeige: "Wo erscheint dieses Projekt?"
            (Zone 2 Partner/Investments + Zone 3 Kaufy + Landingpage)
```

**Aenderungen:**
- EmptyState fruehen Return ENTFERNEN -- KPI-Cards immer sichtbar
- Freigabe-Sektion NEU am Ende der Seite
- "An Sales Desk senden"-Button erzeugt einen `sales_desk_requests` Eintrag
- Status-Synchronisation mit Zone 1

### B.5 Marketing (Tab 4) -- Unveraendert, Placeholders verbessern

- EmptyState fruehen Return ENTFERNEN
- Stats-Cards IMMER zeigen (mit 0)
- Kaufy-Toggle darf NICHT direkt schalten -- muss ueber Sales Desk laufen (GP-05 Compliance)
- Website Builder Placeholder behalten mit klarerem CTA

---

## C) SSOT-AKTE: Datenbank-Migration (P1)

### C.1 Schema-Erweiterung

```sql
-- dev_project_units: SSOT-Mapping zu MOD-04
ALTER TABLE dev_project_units 
  ADD COLUMN property_id uuid REFERENCES properties(id),
  ADD COLUMN unit_id uuid REFERENCES units(id);

-- Index fuer schnelle Lookups
CREATE INDEX idx_dev_project_units_property ON dev_project_units(property_id) WHERE property_id IS NOT NULL;
```

### C.2 "Akte erzeugen/SSOT fixieren" Logik

- Button pro Unit-Zeile in Tab 2 (Projekte)
- Klick erzeugt einen `properties` + `units` Record in MOD-04
- Schreibt `property_id` und `unit_id` zurueck auf `dev_project_units`
- Danach fuehrt Klick auf Unit direkt zur MOD-04 Immobilienakte (`/portal/immobilien/:propertyId`)

### C.3 Sales Desk Request Tabelle (P1)

```sql
CREATE TABLE sales_desk_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  project_id uuid NOT NULL REFERENCES dev_projects(id),
  status text NOT NULL DEFAULT 'pending', -- pending/approved/rejected
  requested_by uuid REFERENCES auth.users(id),
  reviewed_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## D) IMPLEMENTIERUNGS-DIFF (Dateien + Risiko)

### P0: Widget-Struktur + Empty-States (KEIN Risiko)

| Aktion | Datei | Aenderung |
|--------|-------|-----------|
| Aendern | `src/pages/portal/projekte/ProjekteDashboard.tsx` | Stats-Cards immer zeigen, Projekt-Cards statt Table, Kalkulations-Preview-Widget, Reservierungs-Preview-Widget |
| Aendern | `src/pages/portal/projekte/PortfolioTab.tsx` | EmptyState-Guard entfernen, Projekt-Widgets + Sticky-Kalkulator-Layout, SSOT-Button pro Unit |
| Aendern | `src/pages/portal/projekte/VertriebTab.tsx` | EmptyState-Guard entfernen, KPIs immer zeigen, Freigabe-Sektion unten |
| Aendern | `src/pages/portal/projekte/MarketingTab.tsx` | EmptyState-Guard entfernen, Stats immer zeigen |
| Erstellen | `src/components/projekte/ProjectCard.tsx` | Quadratische Projekt-Widget-Karte |
| Erstellen | `src/components/projekte/StickyCalculatorPanel.tsx` | Sticky-Kalkulator rechte Seite |
| Erstellen | `src/components/projekte/SalesApprovalSection.tsx` | Freigabe-Status + "An Sales Desk senden" |

### P1: SSOT-Mapping + Sales Desk Integration (Niedriges Risiko)

| Aktion | Datei | Aenderung |
|--------|-------|-----------|
| Migration | DB | `property_id` + `unit_id` auf dev_project_units |
| Migration | DB | `sales_desk_requests` Tabelle |
| Erstellen | `src/components/projekte/SSOTLinkButton.tsx` | "Akte erzeugen/SSOT fixieren" Button |
| Aendern | `src/pages/portal/projekte/PortfolioTab.tsx` | Unit-Zeilenklick -> MOD-04 wenn property_id vorhanden |
| Aendern | `src/pages/portal/projekte/MarketingTab.tsx` | Kaufy-Toggle hinter Sales-Desk-Approval |

### Risikobewertung

- **P0 (Widget-Umbau):** Kein Risiko. Nur UI-Aenderungen, keine Daten/Schema betroffen. Rollback = Git Revert.
- **P1 (SSOT + Sales Desk):** Niedriges Risiko. Additive Schema-Aenderungen (neue Spalten/Tabelle). Keine bestehenden Daten betroffen. Rollback = DROP COLUMN / DROP TABLE.
- **Kaufy-Toggle hinter Approval:** Mittleres Risiko. Bricht bestehende direkte Kaufy-Listing-Funktionalitaet. Muss klar kommuniziert werden.

---

## E) AKZEPTANZKRITERIEN

1. `/portal/projekte` zeigt IMMER Widgets W1-W5, auch ohne Projekte
2. Alle 4 Tabs zeigen strukturierte UI mit Cards/Tables/Sticky, nie nur einen leeren Satz
3. Projekt-Auswahl ueber quadratische Widget-Cards (wie Kontexte)
4. Sticky-Kalkulator sichtbar auf Tab "Projekte" (Demo-Mode wenn kein Projekt)
5. Tab "Vertrieb" hat Freigabe-Sektion mit Sales-Desk-Integration
6. SSOT-Button "Akte erzeugen" auf Unit-Zeilen (P1)
7. Klick auf Unit mit property_id fuehrt zu MOD-04 (P1)
8. Legacy routes bleiben funktional (keine Aenderung)
