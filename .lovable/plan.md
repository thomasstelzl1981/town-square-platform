

# Zone-2 PDF-CI SSOT (Premium) — Implementierungsplan

## Freeze-Analyse

**Frei editierbar (kein Modul/Engine/Infra-Pfad):**
- `src/lib/pdf/*` (NEU) — kein Freeze
- `src/components/pdf/*` — kein Modulpfad
- `src/components/shared/*` — kein Modulpfad

**Frozen — benötigt UNFREEZE:**
- MOD-18 (`src/components/finanzanalyse/*`) — für FinanzberichtSection Refactor
- MOD-12 (`src/components/akquise/*`) — für Doppel-Export-Bereinigung
- MOD-17 (`src/components/portal/cars/*`) — für Fahrtenbuch CI-Header
- MOD-22 (`src/pages/portal/petmanager/*`, `src/pages/portal/pets/*`) — für Invoice Dedupe
- MOD-06 (`src/components/verkauf/*`) — für Exposé-Template
- MOD-04 (`src/components/immobilien/*`) — für Portfolio-Dossier
- ENG-NK (`src/engines/nkAbrechnung/*`) — für NK pdfExport CI-Header
- MOD-13 (`src/components/projekte/*`) — für Projekt-Report CI-Header

---

## Phase 1 — CI-Kit + Infrastruktur (keine Freezes betroffen)

### 1.1 `src/lib/pdf/pdfCiTokens.ts`
SSOT Design Tokens:
- Page: A4 Portrait, margins T18/R16/B16/L18mm, contentWidth 176mm
- Typography: H1 22pt semibold, H2 14pt semibold, H3 11pt semibold, Body 10pt regular, Caption 8pt, KPI 18-26pt semibold — all Helvetica (jsPDF native, Inter not embeddable without TTF complexity)
- Colors: ink #0B1220, muted #556070, border #E6E8EC, surface #F7F8FA, accent #1E40AF, success #0F766E, warning #B45309, danger #B91C1C
- Spacing: 8px grid baseline, section gap 12mm, paragraph gap 4mm

### 1.2 `src/lib/pdf/pdfCiKit.ts`
Premium primitives (all receive `doc: jsPDF` + return updated `y`):
- `drawCiHeader(doc, opts: {title, subtitle?, caseId?, objectId?, date?})` — Logo left, title+subtitle, meta right; accent bar top
- `drawCiFooter(doc, opts: {page, totalPages, confidential?, org?})` — "System of a Town" left, page center, org right
- `drawCover(doc, opts: {title, subtitle?, heroImageBase64?, date, caseId?})` — full cover page with accent band
- `drawSectionTitle(doc, y, title, subtitle?)` — H2 + optional divider
- `drawKpiRow(doc, y, kpis: {label, value, tone?}[])` — 3-4 KPI cards, surface fill, large numbers
- `drawTable(doc, y, spec: {headers, rows, colWidths?})` — header fill, stripe rows, auto page break
- `drawInfoCard(doc, y, title, lines[])` — bordered card for disclaimers
- `drawList(doc, y, items[])` — numbered/bulleted
- `drawDivider(doc, y)` — thin border line
- `drawBadge(doc, x, y, label, tone)` — small status badge
- `ensurePageBreak(doc, y, minSpace)` — page break if insufficient space
- `loadLogoAsBase64()` — cached logo loader

### 1.3 `src/lib/pdf/templates/registry.ts`
Template Registry:
```typescript
interface PdfTemplate {
  key: string;           // e.g. 'FIN_REPORT_V1'
  label: string;
  module: string;        // MOD-XX
  type: 'B' | 'C';      // Report or Dossier
  pageLimit: number;
  requiredScopes?: string[];  // role/consent gates
  generate: (data: any) => Promise<void>;
}
```
Initial registrations: `FIN_REPORT_V1`, `SALES_EXPOSE_V1`, `PORTFOLIO_DOSSIER_V1`, `VALUATION_REPORT_V1` (existing), `NK_SETTLEMENT_V1` (existing), `PROJECT_REPORT_V1` (existing)

### 1.4 `src/lib/pdf/README.md`
"How to build a new PDF Template" — 1-page guide.

### 1.5 Global Print CSS
Add to `src/index.css`:
```css
@media print {
  .no-print, .pdf-hide { display: none !important; }
  .avoid-break { break-inside: avoid; }
  .page-break { break-before: page; }
}
```

---

## Phase 2 — Quick-Wins (benötigt UNFREEZE MOD-22, MOD-12, MOD-17, ENG-NK)

### QW-2: Pet Invoice Dedupe
- Create `src/lib/pdf/generateInvoicePdf.ts` — shared function extracting the duplicated ~40 lines from PMFinanzen + PetsMeinBereich
- Both files import and call the shared function

### QW-4: CI-Header/Footer in NK-Abrechnung + Fahrtenbuch
- `src/engines/nkAbrechnung/pdfExport.ts`: Replace manual header/footer with `drawCiHeader`/`drawCiFooter` from pdfCiKit
- `src/components/portal/cars/logbook/LogbookExport.tsx`: Same treatment

### QW-5: MOD-12 Doppel-Export bereinigen
- `src/components/akquise/acqPdfExport.ts`: Migrate to use `pdfCiKit` header/footer
- Remove any `window.print()` button if present in the profile section

---

## Phase 3 — High-Priority Templates (benötigt UNFREEZE MOD-18, MOD-06, MOD-04)

### 3.1 MOD-18 Finanzreport (`src/lib/pdf/templates/financeReportV1.ts`)

**Type B, 8-10 pages, CI-A.**

Data source: `useFinanzberichtData` hook (already aggregates all data).

Page structure:
1. **Cover** — `drawCover` with title "Vermögensauskunft", person name, date
2. **KPI Row** — Nettovermögen, Monatlicher Überschuss, Liquiditätsquote, Verschuldungsgrad
3. **Einnahmen/Ausgaben** — `drawTable` with income/expense categories
4. **Vermögen/Verbindlichkeiten** — `drawTable` with net calculation
5. **Immobilienübersicht** — Top 10 properties, `drawTable`
6. **Darlehen** — Top 10 loans, `drawTable`
7. **Verträge/Abos** — compact `drawTable`
8. **Vorsorge** — compact `drawTable` + status badges
9. **Appendix** — QR link to web reader, disclaimer

Security: Add consent gate check before generation.

MOD-18 integration: Replace `PdfExportFooter` in `FinanzberichtSection.tsx` with a button that calls `financeReportV1.generate(data)`.

### 3.2 MOD-06 Verkaufsexposé (`src/lib/pdf/templates/salesExposeV1.ts`)

**Type B, 4-6 pages, CI-A. Currently missing entirely.**

Data source: MOD-04 SSOT (`properties`, `units`, `document_links` for images).

Page structure:
1. **Cover** — Hero image (first property photo), address, price, key facts row (m², rooms, year, type)
2. **Objektbeschreibung** — Facts table + highlights text
3. **Lage** — Static map placeholder + location description
4. **Bilder/Grundriss** — 2x2 image grid from property photos
5. **Wirtschaftlichkeit** (optional, if Kapitalanlage) — Rendite KPIs, financing table
6. **Rechtliches + Kontakt** — Disclaimer, broker contact, QR link

Integration: Add export button to `ExposeDetail.tsx` (MOD-06).

### 3.3 MOD-04 Portfolio-Dossier (`src/lib/pdf/templates/portfolioDossierV1.ts`)

**Type C, 6-10 pages, CI-A.**

Data source: `properties` + `units` + `leases` + `loans` aggregate.

Page structure:
1. **Cover** — "Portfolio-Report", person/org name, date, property count
2. **KPI Row** — Gesamtwert, Mieteinnahmen p.a., Leerstandsquote, Ø Rendite
3. **Portfolio-Tabelle** — Top 20 properties: Adresse, Typ, Wert, Miete, Rendite, Status
4. **Objekt-Kacheln** — 2-3 per page with key data
5. **Finanzierung aggregiert** — Total Restschuld, Annuität, Zinsbindung-Risiko
6. **Risiko/Flags** — Data Quality, Leerstand, Zinsbindung alerts
7. **Appendix** — QR link

Integration: Add button in Immobilien portfolio view.

---

## Phase 4 — Existing Template Migration

### Valuation PDF (`ValuationPdfGenerator.ts`)
- Register in registry as `VALUATION_REPORT_V1`
- Migrate header/footer to use `pdfCiKit` functions (the rest of the 12-page structure stays)
- Not urgent, current implementation is functional

### Project Report (`generateProjectReportPdf.ts`)
- Register in registry as `PROJECT_REPORT_V1`
- Migrate header/footer to `pdfCiKit`

---

## Required Unfreezes (Summary)

Before implementation, user must provide:
```
UNFREEZE MOD-18
UNFREEZE MOD-06
UNFREEZE MOD-04
UNFREEZE MOD-12
UNFREEZE MOD-17
UNFREEZE MOD-22
UNFREEZE ENG-NK
UNFREEZE MOD-13
```

---

## File Creation/Edit Summary

| File | Action | Freeze |
|------|--------|--------|
| `src/lib/pdf/pdfCiTokens.ts` | NEW | None |
| `src/lib/pdf/pdfCiKit.ts` | NEW | None |
| `src/lib/pdf/templates/registry.ts` | NEW | None |
| `src/lib/pdf/templates/financeReportV1.ts` | NEW | None |
| `src/lib/pdf/templates/salesExposeV1.ts` | NEW | None |
| `src/lib/pdf/templates/portfolioDossierV1.ts` | NEW | None |
| `src/lib/pdf/generateInvoicePdf.ts` | NEW | None |
| `src/lib/pdf/README.md` | NEW | None |
| `src/index.css` | EDIT (print CSS) | None |
| `src/components/finanzanalyse/FinanzberichtSection.tsx` | EDIT | MOD-18 |
| `src/components/akquise/acqPdfExport.ts` | EDIT | MOD-12 |
| `src/components/portal/cars/logbook/LogbookExport.tsx` | EDIT | MOD-17 |
| `src/engines/nkAbrechnung/pdfExport.ts` | EDIT | ENG-NK |
| `src/pages/portal/petmanager/PMFinanzen.tsx` | EDIT | MOD-22 |
| `src/pages/portal/pets/PetsMeinBereich.tsx` | EDIT | MOD-22 |
| `src/components/verkauf/ExposeDetail.tsx` | EDIT | MOD-06 |
| `src/components/immobilien/*` (portfolio button) | EDIT | MOD-04 |
| `src/components/projekte/generateProjectReportPdf.ts` | EDIT | MOD-13 |

---

## Bestätigungen

- **CI-A ist aktiv** und wird in allen neuen Templates verwendet
- **Report-PDFs werden ausschließlich als jsPDF-Templates** umgesetzt (Typ B/C)
- **Page-PDF (window.print)** bleibt nur für simple Seitendrucke (Zone 1 Admin Dashboards etc.)
- **CI-B (DIN 5008)** und **CI-C (Juristisch)** bleiben bewusst getrennt

---

## Aufwandsschätzung

| Workstream | Iterationen |
|-----------|-------------|
| Phase 1: CI-Kit + Registry + Print CSS | 3-4 |
| Phase 2: Quick-Wins (Dedupe, Headers, MOD-12) | 2-3 |
| Phase 3a: MOD-18 Finanzreport Template | 3-4 |
| Phase 3b: MOD-06 Exposé Template | 3-4 |
| Phase 3c: MOD-04 Portfolio Dossier | 2-3 |
| Phase 4: Migration existing templates | 2 |
| **Gesamt** | **~15-20** |

