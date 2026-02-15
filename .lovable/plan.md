

# CI-Ergaenzung: Visitenkarte + KI-Widgets fuer ProjektManager und Immomanager

## Ist-Zustand

Der **Finanzierungsmanager** und **AkquiseManager** haben bereits das `DASHBOARD_HEADER`-Pattern: eine Visitenkarte (links) und ein Kontext-Widget (rechts) in einem 2-Spalten-Grid gemaess `DESIGN.DASHBOARD_HEADER.GRID`. Beim ProjektManager (`ProjekteDashboard.tsx`) und Immomanager (MOD-09, z.B. `KatalogTab.tsx` und `BeratungTab.tsx`) fehlt dieses Pattern komplett.

## Ziel

1. **ProjektManager (MOD-13)**: Visitenkarte + KI-Marktanalyse-Widget oben, KPI-Kacheln nach ganz unten verschieben
2. **Immomanager (MOD-09)**: Visitenkarte + Immobilienmarkt-Report-Widget oben (auf allen Tabs sichtbar)

---

## Teil 1: ProjektManager — Visitenkarte + KI-Marktanalyse

### Visitenkarte (links)
Identisches Design wie FM/AM: Avatar, Name, Rolle "Projektmanager", E-Mail, Telefon, Adresse, Badge "X aktive Projekte". Gradient: Orange-Rot (`from-[hsl(25,85%,50%)] to-[hsl(15,80%,45%)]`).

### KI-Marktanalyse-Widget (rechts)
- **Geschlossener Zustand**: Card mit Icon (TrendingUp/Globe), Titel "Marktanalyse", Untertitel "KI-gestuetzter Wettbewerbsbericht", Button "Analyse starten"
- **Bei Klick**: Oeffnet ein Sheet/Dialog mit einem strukturierten KI-Bericht
- **Ablauf**: 
  1. Edge Function `sot-project-market-report` wird aufgerufen
  2. Sammelt Projektdaten des Users (Standorte, Preise, Einheiten)
  3. Nutzt die bestehende Research-Engine-Infrastruktur (Apify fuer Portal-Daten, Firecrawl fuer Web-Extraktion)
  4. Lovable AI (`google/gemini-3-flash-preview`) fasst alles zu einem strukturierten Marktbericht zusammen:
     - Marktueberblick pro Standort
     - Konkurrenzanalyse (aehnliche Projekte auf Portalen)
     - Preisvergleich
     - Empfehlungen
  5. Bericht wird als Markdown gestreamt und im Sheet gerendert

### KPI-Kacheln
Die bestehenden 4 KPI-Cards (Projekte, Einheiten, Abverkaufsquote, Umsatz IST) werden von oben nach **ganz unten** verschoben — unterhalb des Magic Intake.

### Layout-Reihenfolge (neu)
```text
1. ModulePageHeader "PROJEKTMANAGER"
2. DASHBOARD_HEADER (Visitenkarte + Marktanalyse-Widget)
3. Meine Projekte (WidgetGrid)
4. So funktioniert's (4-Schritte)
5. Magic Intake
6. KPI-Kacheln mit Verkaufsstaenden (ganz unten)
```

---

## Teil 2: Immomanager (MOD-09) — Visitenkarte + Marktlage-Widget

### Problem
MOD-09 hat kein Dashboard — der User landet direkt auf Tabs (Katalog, Beratung, etc.). Die Visitenkarte muss daher auf Tab-Ebene eingefuegt werden, idealerweise als gemeinsame Komponente die auf Katalog und Beratung erscheint.

### Visitenkarte (links)
Avatar, Name, Rolle "Immomanager / Vertriebspartner", E-Mail, Telefon, Badge "X Objekte im Katalog". Gradient: Gruen-Teal (`from-[hsl(160,60%,40%)] to-[hsl(180,50%,45%)]`) — identisch zum AkquiseManager-Farbschema, da beide in der Vertriebs-Zone sind.

### Immobilienmarkt-Report-Widget (rechts)
- **Geschlossener Zustand**: Card mit Icon (Newspaper/Globe), Titel "Marktlage", Untertitel "Wohnimmobilien — Preise & Trends", Datum des letzten Berichts
- **Bei Klick**: Oeffnet ein Sheet mit KI-generiertem Marktbericht
- **Ablauf**:
  1. Edge Function `sot-market-pulse-report` wird aufgerufen
  2. Nutzt Lovable AI mit Web-Search-Kontext (via Perplexity oder eingebettete Suchergebnisse) fuer aktuelle Marktdaten
  3. Generiert einen strukturierten Bericht:
     - Aktuelle Preisentwicklung Wohnimmobilien Deutschland
     - Regionale Trends
     - Zinsentwicklung und Auswirkung
     - Prognose / Einschaetzung
  4. Bericht wird als Markdown gestreamt und gerendert

---

## Teil 3: Edge Functions

### `sot-project-market-report` (neu)
- Liest Projekte des Users aus der DB
- Sammelt Standort-/Preisdaten
- Optional: Ruft `sot-apify-portal-job` auf fuer Konkurrenzlistings
- Sendet alles an Lovable AI (`google/gemini-3-flash-preview`) mit strukturiertem System-Prompt
- Streamt die Antwort zurueck (SSE)

### `sot-market-pulse-report` (neu)
- Kein Projekt-Kontext noetig, allgemeiner Marktbericht
- Nutzt Lovable AI mit einem Prompt der aktuelle Marktdaten zum Wohnimmobilienmarkt zusammenfasst
- Optional: Perplexity-Connector fuer aktuelle Web-Recherche
- Streamt die Antwort zurueck (SSE)

---

## Teil 4: Shared Components

### `ManagerVisitenkarte` (neue shared Komponente)
Extrahiert das Visitenkarten-Pattern aus FM/AM in eine wiederverwendbare Komponente:
- Props: `role`, `gradientColors`, `badgeText`, `onEdit`
- Nutzt `useAuth()` fuer Profildaten

### `MarketReportSheet` (neue shared Komponente)
Sheet-Overlay fuer KI-Berichte:
- Streaming-Markdown-Anzeige
- Lade-Animation waehrend Generierung
- "Erneut generieren"-Button
- Responsive, scrollbar

---

## Dateien

### Neue Dateien

| Datei | Beschreibung |
|-------|-------------|
| `src/components/shared/ManagerVisitenkarte.tsx` | Wiederverwendbare Visitenkarte fuer alle Manager-Module |
| `src/components/shared/MarketReportSheet.tsx` | Sheet fuer KI-generierte Marktberichte (Streaming-Markdown) |
| `src/components/shared/MarketReportWidget.tsx` | Geschlossene Widget-Card mit Klick-Handler |
| `supabase/functions/sot-project-market-report/index.ts` | KI-Marktanalyse fuer Projektmanager |
| `supabase/functions/sot-market-pulse-report/index.ts` | Allgemeiner Immobilienmarkt-Report |

### Geaenderte Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/projekte/ProjekteDashboard.tsx` | DASHBOARD_HEADER mit Visitenkarte + Marktanalyse-Widget einfuegen, KPIs nach unten verschieben |
| `src/pages/portal/vertriebspartner/KatalogTab.tsx` | DASHBOARD_HEADER mit Visitenkarte + Marktlage-Widget einfuegen |
| `src/pages/portal/vertriebspartner/BeratungTab.tsx` | DASHBOARD_HEADER mit Visitenkarte + Marktlage-Widget einfuegen |
| `supabase/config.toml` | Nicht manuell — wird automatisch aktualisiert |

### Keine DB-Migration noetig

Die Berichte werden on-the-fly generiert und nicht persistiert (optional spaeter cachebar).

---

## KPI-Kacheln Funktion (ProjektManager, ganz unten)

Die 4 bestehenden KPI-Cards zeigen bereits live Daten. Sie werden lediglich repositioniert:

| Kachel | Wert | Quelle |
|--------|------|--------|
| Projekte | Anzahl total | `portfolioRows.length` |
| Einheiten | Gesamt-Units | Summe `total_units_count` |
| Abverkaufsquote | Sold/Total in % | Berechnet |
| Umsatz IST | EUR aus Verkaeufen | Summe `sale_revenue_actual` |

