
# FM-Dashboard Manifest-Konformitaet + Akquise-Dashboard Angleichung

## Befund

**Der Finanzierungsmanager (FMDashboard.tsx) verstoesst gegen das Design-Manifest:**

1. **Zeile 433**: `sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6` — bis zu 6 Spalten statt max. 4
2. **Zeile 464**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` — ad-hoc Grid statt WidgetGrid
3. Keine `WidgetGrid` / `WidgetCell` Komponenten verwendet
4. Keine `aspect-square` Widgets

**Der Akquise-Manager (AkquiseDashboard.tsx) ist korrekt** — nutzt WidgetGrid + WidgetCell. Allerdings fehlen die beiden Kacheln (Visitenkarte + Zins-Ticker), die im FM vorhanden sind.

## Aenderungen

### 1. FMDashboard.tsx — Manifest-konform machen

**Sektion A: Faelle in Bearbeitung**
- Ersetze ad-hoc Grid (Zeile 433) durch `WidgetGrid` + `WidgetCell`
- Jede `FinanceCaseCard` kommt in eine `WidgetCell` (max 4 Spalten, aspect-square)
- Placeholder ebenfalls in `WidgetCell`

**Sektion B: Finanzierungsmandate**
- Ersetze ad-hoc Grid (Zeile 464) durch `WidgetGrid` + `WidgetCell`
- Mandate-Cards in WidgetCell wrappen
- Leerer Zustand ebenfalls in WidgetCell (wie beim Akquise-Dashboard)

**Visitenkarte + Zins-Ticker** (Zeile 299, grid-cols-2): Diese zwei Content-Kacheln stehen ausserhalb des Widget-Grids als 2-Spalten-Layout — das bleibt, da es dem `FORM_GRID` Muster entspricht (2 Spalten fuer Detail-Ansichten).

### 2. AkquiseDashboard.tsx — Zwei Kacheln ergaenzen

Analog zum FM-Dashboard werden unterhalb des Headers zwei nebeneinander stehende Kacheln eingefuegt:

**Kachel 1: Akquise-Manager Visitenkarte**
- Gleiche Struktur wie FM-Visitenkarte (Name, Email, Telefon, Adresse)
- Statt §34i-Daten: Akquise-spezifische Angaben (z.B. Spezialisierung, aktive Mandate Badge)
- Gradient-Header in Akquise-Markenfarbe
- Edit-Button oeffnet Profil-Sheet

**Kachel 2: Markt-Ticker oder KPI-Widget**
- Aehnlich dem Zins-Ticker, aber mit Akquise-relevanten Kennzahlen
- Z.B.: Aktive Mandate, Objekte in Pipeline, Kontakte, Erfolgsquote
- Alternativ: Marktdaten (Immobilienpreise, Renditen)

**Layout**: `FORM_GRID` (grid-cols-1 md:grid-cols-2) — identisch zum FM-Dashboard.

### Dateien

1. **EDIT:** `src/pages/portal/finanzierungsmanager/FMDashboard.tsx` — WidgetGrid/WidgetCell einsetzen, ad-hoc Grids entfernen
2. **EDIT:** `src/pages/portal/akquise-manager/AkquiseDashboard.tsx` — Visitenkarte + KPI-Widget einfuegen
