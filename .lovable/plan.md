

# Konsolidierungsplan: Manager-Module Standardisierung

## Uebersicht

Dieser Plan vereint alle offenen Aenderungen in einem Durchgang: Dashboard-Header-Standard, Mandatsseite-Angleichung, Analyse-Sektion-Neuaufbau und Design-Manifest-Erweiterung.

---

## Teil 1: Design Manifest erweitern

**Datei: `src/config/designManifest.ts`**

Neue Sektion `DASHBOARD_HEADER` einfuegen:

```text
DASHBOARD_HEADER = {
  GRID: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  CARD_HEIGHT: 'min-h-[280px]',
  GRADIENT_BAR: 'h-2',
  TICKER_ROWS: 4,
}
```

Im `DESIGN`-Export-Objekt ergaenzen.

---

## Teil 2: FM-Dashboard manifest-konform machen

**Datei: `src/pages/portal/finanzierungsmanager/FMDashboard.tsx`**

1. Ad-hoc Grid der Header-Kacheln durch `DESIGN.DASHBOARD_HEADER.GRID` ersetzen
2. Beiden Kacheln (Visitenkarte + ZinsTickerWidget) die Klasse `DESIGN.DASHBOARD_HEADER.CARD_HEIGHT` hinzufuegen
3. ZinsTickerWidget: NUR die 4 Baufinanzierungs-Zinsen (10J, 15J, 20J, Variabel) — den `{markets.length > 0 && ...}` Block mit MSCI, Gold, BTC komplett entfernen

---

## Teil 3: AM-Dashboard angleichen

**Datei: `src/pages/portal/akquise-manager/AkquiseDashboard.tsx`**

1. Ad-hoc Grid durch `DESIGN.DASHBOARD_HEADER.GRID` ersetzen
2. Beiden Kacheln `DESIGN.DASHBOARD_HEADER.CARD_HEIGHT` hinzufuegen
3. KPI-Widget auf exakt 4 Zeilen beschraenken: Aktive Mandate, Neue Auftraege, Kontakte gesamt, Objekte in Pipeline — keine Marktdaten

---

## Teil 4: Mandatsseite an FM-Finanzierungsakte angleichen

**Datei: `src/pages/portal/akquise-manager/AkquiseMandate.tsx`**

### 4a. Split-View Toggle
- Toggle-Button im ModulePageHeader (LayoutList / LayoutPanelLeft Icons)
- Split-View: `PageShell fullWidth={true}` (max-w-full)
- Normal: ohne fullWidth (max-w-7xl)

### 4b. Oberer Bereich — 2-Spalten-Layout
Layout mit `DESIGN.FORM_GRID.FULL`:

```text
+----------------------+----------------------+
| KI-gestuetzte        | Ankaufsprofil-       |
| Erfassung            | Dokument             |
| (Textarea + Button)  | (editierbar,         |
|                      |  Tabular-Form)       |
+----------------------+----------------------+
```

- LINKS: Card mit Freitext-Textarea und "Generieren"-Button
- RECHTS: Card mit generiertem/editierbarem Ankaufsprofil (Kontakt, Region, Asset-Fokus, Preis, Rendite, Ausschluesse) in kompakter Tabular-Form
- "Mandat erstellen" Button unter dem Ankaufsprofil

### 4c. Unterer Bereich — Sektionen 3-7
Bleiben durchlaufend, ausgegraut ohne aktives Mandat. Im Split-View volle Breite.

---

## Teil 5: Analyse-Sektion — Bestand + Aufteiler nebeneinander

**Datei: `src/pages/portal/akquise-manager/components/AnalysisTab.tsx`**

### 5a. Tabs-Struktur aufloesen
Die 4-Tab-Struktur (Bestandsrechner | Aufteiler | GeoMap | KI-Analyse) wird entfernt.

### 5b. Neues Layout

```text
+=============================================+
| Sektion: Analyse & Kalkulation              |
+---------------------------------------------+
| Objekt-Auswahl / KPI-Leiste                 |
+---------------------------------------------+
| Quick Actions: GeoMap | KI | Expose Upload  |
+----------------------+----------------------+
| BestandCalculation   | AufteilerCalculation |
| (komplett mit        | (komplett mit        |
|  Slidern, Charts,    |  Slidern, Charts,    |
|  30J-Projektion)     |  Sensitivitaet)      |
+----------------------+----------------------+
| GeoMap-Ergebnisse (full-width)              |
+---------------------------------------------+
| KI-Analyse-Ergebnisse (full-width)          |
+=============================================+
```

### 5c. Technische Details
- `BestandCalculation` und `AufteilerCalculation` importieren (existieren bereits vollstaendig)
- 2-Spalten-Layout mit `DESIGN.FORM_GRID.FULL`
- Beide Komponenten erhalten `offerId` und `initialData` (Preis/Miete aus dem Offer)
- Bisherige Inline-Formulare und deren States (`bestandParams`, `aufteilerParams`, Handler) entfernen
- GeoMap und KI-Analyse als separate Full-Width-Cards darunter

---

## Zusammenfassung der Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/config/designManifest.ts` | Neue `DASHBOARD_HEADER` Sektion |
| `src/pages/portal/finanzierungsmanager/FMDashboard.tsx` | Manifest-Klassen, Marktdaten entfernen |
| `src/pages/portal/akquise-manager/AkquiseDashboard.tsx` | Manifest-Klassen, KPI auf 4 Zeilen |
| `src/pages/portal/akquise-manager/AkquiseMandate.tsx` | Split-View, 2-Spalten Erfassung+Profil |
| `src/pages/portal/akquise-manager/components/AnalysisTab.tsx` | Tabs aufloesen, Bestand+Aufteiler nebeneinander |

