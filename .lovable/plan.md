

# Neuer Tab "NK-Abrechnung" in der Immobilienakte + Engine-SPEC-Korrektur

## Korrektur: Grundsteuer-Modell

Die bisherige SPEC hatte zwei Modi (`included_in_weg` / `direct_payment`). Nach Klarstellung gilt:

**Grundsteuer wird IMMER direkt vom Eigentuemer bezahlt** (nicht ueber Hausgeld). Sie ist umlagefaehig und muss in der NK-Abrechnung als separate Position hinzugefuegt werden. Quelle dafuer ist der jaehrliche Grundsteuerbescheid (Dokument im DMS). Der `tax_mode`-Parameter entfaellt — Grundsteuer ist immer `direct_payment`.

Das bedeutet fuer die Engine:
- Grundsteuer ist NICHT im Hausgeld enthalten
- Der Grundsteuerbescheid ist ein **Pflichtdokument** fuer die NK-Abrechnung
- Die Grundsteuer wird als eigene umlagefaehige Position zur Matrix hinzugefuegt

---

## Architektur-Entscheidung: Wo lebt die NK-Abrechnung?

**Neuer Tab in der Immobilienakte** (`PropertyDetailPage`), nicht in der Verwaltung.

Begruendung: Die NK-Abrechnung ist objekt- und einheitsbezogen. Die Immobilienakte (`/portal/immobilien/:id`) hat bereits alle relevanten Daten (Property, Unit, Lease, Dokumente) im Kontext. Ein neuer Tab "NK-Abrechnung" reiht sich logisch neben "Geldeingang" und "Mietverhaeltnis" ein.

---

## Was wird programmiert

### 1. Engine-SPEC-Datei (Ja, eine echte Datei)

**Datei: `src/engines/nkAbrechnung/spec.ts`**

Typdefinitionen und Enums als TypeScript-Code (nicht Markdown), damit sie direkt importierbar sind:

- `NKCostCategory` Enum (18 umlagefaehige + 4 nicht umlagefaehige Kategorien)
- `AllocationKeyType` Enum (area_sqm, mea, persons, consumption, unit_count, custom)
- `NKCostItem` Interface (extrahierte Kostenposition)
- `NKSettlementMatrix` Interface (berechnete Abrechnung pro Lease)
- `NKReadinessStatus` Enum (MISSING_DOCS, NEEDS_REVIEW, READY, DRAFT, CONFIRMED, EXPORTED)
- `NKDocRequirement` Interface (welche Dokumente benoetigt werden)
- Mapping-Regeln: Keywords zu category_code (deterministische Zuordnung)

### 2. DB-Migration

**Neue Tabellen:**

| Tabelle | Zweck |
|---------|-------|
| `nk_cost_items` | Extrahierte Einzelpositionen aus WEG-Abrechnung + Grundsteuerbescheid |
| `nk_tenant_settlements` | Berechnete Mieter-NK-Abrechnung (Matrix + Status + PDF-Pfad) |

**Aenderung an `properties`:**
- Spalte `tax_mode` entfaellt (Grundsteuer ist immer separat)
- Keine Aenderung noetig

Beide Tabellen mit RLS-Policies (tenant_id-basiert, analog nk_periods).

### 3. Berechnungs-Engine

**Dateien in `src/engines/nkAbrechnung/`:**

| Datei | Inhalt |
|-------|--------|
| `spec.ts` | TypeScript Typen, Enums, Interfaces (SSOT) |
| `costCategoryMapping.ts` | Keyword-Regex-Mapping: label_raw aus Dokument wird category_code zugeordnet |
| `allocationLogic.ts` | Verteilerschluessel-Berechnung (Anteil = Gesamt x Einheit-Basis / Haus-Basis), Unterjaehrigkeit |
| `readinessCheck.ts` | Prueft ob alle Pflichtdokumente (WEG-Abrechnung + Grundsteuerbescheid) vorhanden und accepted sind |
| `engine.ts` | Orchestrierung: Liest nk_cost_items + Lease-Daten, berechnet Matrix, schreibt nk_tenant_settlements |
| `pdfExport.ts` | jsPDF-Generator fuer formell wirksame Abrechnung |

### 4. Neuer Tab in PropertyDetailPage

**Datei: `src/components/portfolio/NKAbrechnungTab.tsx`**

Inline-Flow (kein Wizard), linear auf einer Seite:

```text
┌─────────────────────────────────────────────────────┐
│  NK-Abrechnung                        [Jahr: 2025]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  STEP 1: Datenkontrolle                             │
│  ┌───────────────────────────────────────────────┐  │
│  │ Mietvertrag          ✅ Bergmann, 850+180+120 │  │
│  │ WEG-Jahresabrechnung ✅ accepted (12.01.2026) │  │
│  │ Grundsteuerbescheid  ⚠️ needs_review          │  │
│  │ Wirtschaftsplan      ⬜ optional               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  STEP 2: Kostenmatrix (nach Berechnung)             │
│  ┌───────────────────────────────────────────────┐  │
│  │ Kostenart      │ Schluessel │ Haus    │ Anteil│  │
│  │ Grundsteuer    │ MEA        │ 2.400   │ 205   │  │
│  │ Wasser         │ Personen   │ 3.200   │ 360   │  │
│  │ ...            │            │         │       │  │
│  │────────────────│────────────│─────────│───────│  │
│  │ Summe umlagef. │            │         │ 1.801 │  │
│  │ Vorauszahlung  │            │         │ 3.600 │  │
│  │ GUTHABEN       │            │         │-1.799 │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  STEP 3: Export                                     │
│  [PDF erzeugen]  [Im DMS ablegen]                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5. Integration in PropertyDetailPage

**Datei: `src/pages/portal/immobilien/PropertyDetailPage.tsx`**

- Neuer `TabsTrigger` mit Label "NK-Abrechnung" und Receipt-Icon
- Neuer `TabsContent` mit der `NKAbrechnungTab`-Komponente
- Props: propertyId, tenantId, unitId (wie bei GeldeingangTab)

### 6. Armstrong Knowledge Base

**Datei: `src/constants/armstrongNKKnowledge.ts`**

7 KB-Eintraege als Seed-Daten (Glossar, Kostenarten, Mapping-Regeln, formelle Anforderungen, Fehlermuster), die spaeter in `armstrong_knowledge_items` eingefuegt werden.

### 7. React Hook

**Datei: `src/hooks/useNKAbrechnung.ts`**

Orchestriert den gesamten Flow:
- `readiness`: Prueft Dokument-Verfuegbarkeit
- `calculate()`: Fuehrt Engine aus, erzeugt Settlement
- `settlements`: Geladene Abrechnungen
- `exportPdf()`: Erzeugt PDF

---

## Implementierungsreihenfolge

| Schritt | Deliverable |
|---------|------------|
| 1 | `src/engines/nkAbrechnung/spec.ts` — TypeScript-Typen und Enums |
| 2 | DB-Migration: `nk_cost_items` + `nk_tenant_settlements` |
| 3 | `costCategoryMapping.ts` + `allocationLogic.ts` |
| 4 | `readinessCheck.ts` + `engine.ts` |
| 5 | `NKAbrechnungTab.tsx` (UI-Komponente) |
| 6 | Integration in `PropertyDetailPage.tsx` (neuer Tab) |
| 7 | `useNKAbrechnung.ts` (Hook) |
| 8 | `pdfExport.ts` (jsPDF) |
| 9 | `armstrongNKKnowledge.ts` (KB Seed) |

---

## Betroffene Dateien (Zusammenfassung)

| Datei | Aenderung |
|-------|-----------|
| `src/engines/nkAbrechnung/spec.ts` | **NEU** — Engine-SPEC als TypeScript |
| `src/engines/nkAbrechnung/costCategoryMapping.ts` | **NEU** — Kostenarten-Mapping |
| `src/engines/nkAbrechnung/allocationLogic.ts` | **NEU** — Verteilerschluessel |
| `src/engines/nkAbrechnung/readinessCheck.ts` | **NEU** — Readiness-Check |
| `src/engines/nkAbrechnung/engine.ts` | **NEU** — Berechnungslogik |
| `src/engines/nkAbrechnung/pdfExport.ts` | **NEU** — PDF-Generator |
| `src/engines/nkAbrechnung/index.ts` | **NEU** — Re-Exports |
| `src/components/portfolio/NKAbrechnungTab.tsx` | **NEU** — UI Tab-Komponente |
| `src/hooks/useNKAbrechnung.ts` | **NEU** — React Hook |
| `src/constants/armstrongNKKnowledge.ts` | **NEU** — KB Seed |
| `src/pages/portal/immobilien/PropertyDetailPage.tsx` | **AENDERUNG** — Neuer Tab hinzugefuegt |
| DB-Migration | **NEU** — 2 Tabellen + RLS |

