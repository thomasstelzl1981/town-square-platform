

# Redesign: Brand-Widgets, Finance-Widget und News-Widget

## Uebersicht

Drei Bereiche werden ueberarbeitet:
1. **Brand-Widgets** (Kaufy, FutureRoom, SoT, Acquiary) werden zu echten System-Widgets im Dashboard-Grid
2. **Finance-Widget** wird inhaltlich erweitert (MSCI World, Gold, DAX) und visuell aufgewertet
3. **News-Widget** bekommt ein hochwertigeres Design

---

## Teil 1: Brand-Widgets als System-Widgets

### Problem
Die 4 Brand-Kacheln stehen fest oberhalb des Grids, sind nicht verschiebbar, nicht deaktivierbar, und haben ein eigenes Design-System.

### Loesung
- 4 neue Eintraege in der Widget-Konfiguration: `SYS.BRAND.KAUFY`, `SYS.BRAND.FUTUREROOM`, `SYS.BRAND.SOT`, `SYS.BRAND.ACQUIARY`
- Neue Komponente `BrandLinkWidget.tsx` im aspect-square-Format mit dem Marken-Gradient als Vollflaechen-Hintergrund
- Das statische BrandWidgets-Rendering im Dashboard wird entfernt — die Marken erscheinen stattdessen als normale Widgets im DashboardGrid (verschiebbar, aktivierbar/deaktivierbar ueber KI-Office)

### Design pro Brand-Widget

Jedes Widget zeigt den vollen Marken-Gradient als Hintergrund mit zentriertem Icon, Markenname, Tagline und einem "Website oeffnen"-Button:

- **Kaufy:** Blau-Violett Gradient, ShoppingBag-Icon, "Marktplatz und Investment"
- **FutureRoom:** Teal-Mint Gradient, Landmark-Icon, "Finanzierung"
- **System of a Town:** Anthrazit-Dunkel, Building2-Icon, "Management Suite"
- **Acquiary:** Azure-Blue, Search-Icon, "Sourcing und Akquisition"

---

## Teil 2: Finance-Widget — Mehr Inhalt, besseres Design

### Problem
Aktuell nur 4 Datenpunkte (BTC, ETH, EUR/USD, Gold). Zu wenig Inhalt, Design wirkt einfach.

### Erweiterung der Datenquellen

| Asset | Quelle | Methode |
|-------|--------|---------|
| MSCI World (NEU) | Yahoo Finance (kostenlos) | iShares MSCI World ETF (URTH) als Proxy |
| DAX (NEU) | Yahoo Finance (kostenlos) | GDAXI Index |
| Gold (XAU) | CoinGecko | Wie bisher |
| BTC | CoinGecko | Wie bisher |
| ETH | CoinGecko | Wie bisher |
| EUR/USD | Frankfurter (ECB) | Wie bisher |

### Neues Widget-Design — Professionelle Ticker-Liste

Statt des simplen 2x2-Grids wird eine kompakte Finanz-Ticker-Liste mit 6 Zeilen:
- Jede Zeile: Symbol links, Preis rechts, prozentuale Aenderung mit Trend-Icon
- Farbcodiert: Gruen fuer positiv, Rot fuer negativ, Grau fuer neutral
- Header mit Live-Indikator (pulsierender gruener Punkt)
- Kompakte Typografie mit feinen Trennlinien

---

## Teil 3: News-Widget — Hochwertigeres Design

### Problem
Flache Cards mit zu wenig visueller Hierarchie.

### Neues Design
- Feinere Trennlinien statt separater Cards
- Groessere Textflaeche fuer Headlines (2 Zeilen)
- Source und Zeitangabe in einer Zeile mit Mittelpunkt-Trenner
- ExternalLink-Icon immer sichtbar
- 5 Headlines statt 4 (mehr Informationsdichte)

---

## Technische Umsetzung

### Neue Dateien

| Datei | Inhalt |
|---|---|
| src/components/dashboard/widgets/BrandLinkWidget.tsx | Brand-Widget mit Gradient, Icon und Link |

### Geaenderte Dateien

| Datei | Aenderung |
|---|---|
| src/config/systemWidgets.ts | 4 neue Brand-Widget-Eintraege |
| src/pages/portal/PortalDashboard.tsx | BrandWidgets entfernen, 4 neue Widget-Cases im renderWidget |
| src/pages/portal/office/SystemWidgetsTab.tsx | Icon-Map um ShoppingBag, Landmark, Building2, Search erweitern |
| supabase/functions/sot-finance-proxy/index.ts | MSCI World (URTH ETF) und DAX via Yahoo Finance hinzufuegen |
| src/hooks/useFinanceData.ts | Datenstruktur um MSCI World und DAX erweitern |
| src/components/dashboard/widgets/FinanceWidget.tsx | Neues Ticker-Listen-Design mit 6 Assets |
| src/components/dashboard/widgets/NewsWidget.tsx | Redesign mit besserer Typografie und Trennlinien |

### Keine Datenbank-Aenderungen noetig

Die Widget-Preferences arbeiten dynamisch mit Codes. Neue Brand-Codes werden automatisch als "enabled" gemerged.

