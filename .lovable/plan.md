
# Vertriebsstatusreport — Zweiseitiges PDF (Ergaenzung: Projektgesellschaft)

## Aenderung gegenueber letztem Plan

Die Daten der **Projektgesellschaft** (DeveloperContext) werden auf Seite 1 des PDF-Reports integriert. Die Felder stammen aus dem Interface `DeveloperContext`:

- `name` (z.B. "Stadtpark Wohnen GmbH")
- `legal_form` (z.B. "GmbH")
- `hrb_number` (z.B. "HRB 123456")
- `ust_id` (z.B. "DE123456789")
- `managing_director` (z.B. "Max Mustermann")
- `street` + `house_number`, `postal_code`, `city` (Adresse)

Da es bisher keine Demo-Daten fuer die Projektgesellschaft gibt, wird ein `DEMO_DEVELOPER_CONTEXT` in `demoProjectData.ts` ergaenzt.

---

## 1. Dashboard aufraumen

**Datei:** `src/pages/portal/projekte/ProjekteDashboard.tsx`

- W4 "Kalkulation Preview" und W5 "Reservierungen Preview" entfernen
- Ungenutzte Imports bereinigen

---

## 2. Demo-Daten erweitern

**Datei:** `src/components/projekte/demoProjectData.ts`

Neuer Export `DEMO_DEVELOPER_CONTEXT`:

```text
Name:               Stadtpark Wohnen GmbH
Rechtsform:         GmbH
HRB:                HRB 287451 · AG Muenchen
USt-ID:             DE318294756
Geschaeftsfuehrer:  Thomas Stelzl
Adresse:            Leopoldstrasse 42, 80802 Muenchen
```

---

## 3. Neue Komponente: SalesStatusReportWidget

**Datei (neu):** `src/components/projekte/SalesStatusReportWidget.tsx`

### 3.1 Props

```text
units: CalculatedUnit[]
projectName: string
projectDescription: string[]
investmentCosts: number
provisionRate: number
targetYield: number
developerContext: DeveloperContext    ← NEU
isDemo: boolean
```

### 3.2 KPI-Leiste — kumulierte EUR-Werte

Vier Kacheln:

| KPI | Berechnung |
|-----|------------|
| Projektvolumen | Summe aller effective_price |
| Reserviert (EUR) | Summe effective_price wo status = reserved |
| Verkauft (EUR) | Summe effective_price wo status = sold/notary |
| Frei (EUR) | Summe effective_price wo status = available |

Zweite Zeile:

| KPI | Berechnung |
|-----|------------|
| Provision (kumuliert) | Summe aller effective_provision |
| Rohertrag Gesellschaft | Projektvolumen - Investitionskosten - Provision |

### 3.3 Empfaenger-Verwaltung

- Lokaler State `recipients: string[]`
- Input + Button zum Hinzufuegen, Chips mit X

### 3.4 Aktions-Buttons

- "Report senden" — ruft sot-system-mail-send auf
- "PDF herunterladen" — erzeugt zweiseitiges PDF lokal

### 3.5 Automatisierungs-UI (nur visuell)

- Intervall-Select, 3 Switches (alle mit "zukuenftige Version"-Toast)

---

## 4. Zweiseitiges PDF — Aufbau

**Datei (neu):** `src/components/projekte/generateProjectReportPdf.ts`

### 4.1 Seite 1 — Projektexpose + Projektgesellschaft

```text
┌──────────────────────────────────────────────────┐
│  RESIDENZ AM STADTPARK                           │
│  Am Stadtpark 12 · 80331 Muenchen                │
│  Vertriebsstatusreport · 10.02.2026              │
├──────────────────────────────────────────────────┤
│                                                  │
│  PROJEKTGESELLSCHAFT                             │
│  Stadtpark Wohnen GmbH                           │
│  Geschaeftsfuehrer: Thomas Stelzl                │
│  Leopoldstrasse 42, 80802 Muenchen               │
│  HRB 287451 · AG Muenchen | USt-ID DE318294756  │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────┐  ┌────────┐ ┌────────┐    │
│  │                  │  │ Bild 2 │ │ Bild 3 │    │
│  │   Titelbild      │  └────────┘ └────────┘    │
│  │   (gross)        │  ┌────────┐               │
│  │                  │  │ Bild 4 │               │
│  └──────────────────┘  └────────┘               │
│                                                  │
│  ECKDATEN                                        │
│  24 WE | 24 TG | 1.540 m² | Bj. 1998           │
│  San. 2021 | Energieklasse B | Zentralhzg. Gas  │
│                                                  │
│  OBJEKTBESCHREIBUNG                              │
│  (3 Absaetze aus DEMO_PROJECT_DESCRIPTION)       │
│                                                  │
│  ── Seite 1 von 2 ──────────────────── SOT ──── │
└──────────────────────────────────────────────────┘
```

### 4.2 Seite 2 — Vertriebsstatus + Preisliste

```text
┌──────────────────────────────────────────────────┐
│  VERTRIEBSSTATUSREPORT                           │
│  Residenz am Stadtpark · Stand 10.02.2026        │
├──────────────────────────────────────────────────┤
│                                                  │
│  KALKULATOR-KENNZAHLEN                           │
│  Investitionskosten:   4.800.000 EUR             │
│  Endkundenrendite:     4,0 %                     │
│  Provision (Satz):     10,0 %                    │
│                                                  │
│  KUMULIERTE WERTE                                │
│  ┌──────────────────┬───────────────┐            │
│  │ Projektvolumen   │ 7.200.000 EUR │            │
│  │ Reserviert       │ 1.200.000 EUR │            │
│  │ Verkauft         │   900.000 EUR │            │
│  │ Frei             │ 5.100.000 EUR │            │
│  ├──────────────────┼───────────────┤            │
│  │ Provision ges.   │   720.000 EUR │            │
│  │ Rohertrag        │ 1.680.000 EUR │            │
│  └──────────────────┴───────────────┘            │
│                                                  │
│  PREISLISTE                                      │
│  ┌────┬───┬────┬─────────┬───────┬──────┬──────┐ │
│  │ WE │Zi │ m² │ Preis   │EUR/m² │Rend. │Stat. │ │
│  ├────┼───┼────┼─────────┼───────┼──────┼──────┤ │
│  │001 │ 1 │ 30 │ 140.260 │ 4.675 │ 4,4% │ frei │ │
│  │... │...│... │ ...     │ ...   │ ...  │ ...  │ │
│  ├────┴───┴────┼─────────┼───────┼──────┼──────┤ │
│  │ SUMME       │7.200.000│ 4.675 │ 4,0% │      │ │
│  └─────────────┴─────────┴───────┴──────┴──────┘ │
│                                                  │
│  Vertraulich — System of a Town GmbH             │
│  ── Seite 2 von 2 ──────────────────── SOT ──── │
└──────────────────────────────────────────────────┘
```

### 4.3 Technische Details

- A4 Hochformat (210 x 297 mm), Raender 15mm
- Bilder: per Image()-Objekt als Base64 in jsPDF eingebettet
- Schriftgroessen: Projektname 18pt, Ueberschriften 12pt, Text 9pt, Preisliste 7pt
- Dateiname: `Vertriebsstatusreport_[Projektname]_[Datum].pdf`

---

## 5. E-Mail-Versand

Bestehende Edge Function `sot-system-mail-send` mit:

```text
to: ["banker@sparkasse.de"]
subject: "Vertriebsstatusreport — Residenz am Stadtpark — 10.02.2026"
html: Report-HTML (gleicher Inhalt wie PDF, aber als inline-CSS HTML)
context: "project-report"
```

Vorgefertigtes Anschreiben:

> Sehr geehrte Damen und Herren,
>
> anbei erhalten Sie den aktuellen Vertriebsstatusreport fuer unser Projekt "[Projektname]".
> Der Report umfasst die aktuelle Preisliste, den Reservierungsstand sowie die wesentlichen Projektkennzahlen.
>
> Bei Rueckfragen stehen wir Ihnen gerne zur Verfuegung.
>
> Mit freundlichen Gruessen
> Ihr System of a Town Team

---

## 6. PortfolioTab.tsx anpassen

**Datei:** `src/pages/portal/projekte/PortfolioTab.tsx`

- Import DEMO_DEVELOPER_CONTEXT
- Widget im 2/3-Bereich einsetzen mit allen Props inkl. developerContext

---

## 7. Betroffene Dateien

| Nr | Aktion | Datei |
|----|--------|-------|
| 1 | Aendern | `src/pages/portal/projekte/ProjekteDashboard.tsx` — W4+W5 loeschen |
| 2 | Aendern | `src/components/projekte/demoProjectData.ts` — DEMO_DEVELOPER_CONTEXT ergaenzen |
| 3 | Neu | `src/components/projekte/SalesStatusReportWidget.tsx` — Komplettes Widget |
| 4 | Neu | `src/components/projekte/generateProjectReportPdf.ts` — Zweiseitige PDF-Erzeugung |
| 5 | Aendern | `src/pages/portal/projekte/PortfolioTab.tsx` — Widget einbinden |

Keine neuen Datenbank-Tabellen oder Edge Functions erforderlich.
