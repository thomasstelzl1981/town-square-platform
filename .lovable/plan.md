
# Finanzbericht — Strukturierte Vermoegensauskunft in MOD-18

## Uebersicht

Unterhalb der Personen-Widgets im UebersichtTab wird ein neuer Bereich "Finanzbericht" eingefuegt. Dieser aggregiert Daten aus mehreren Modulen zu einem strukturierten Gesamtbericht mit PDF-Export-Funktion.

## Aufbau des Finanzberichts

### Sektion 1: Personen-Uebersicht
- Alle Haushaltsmitglieder (aus `household_persons`) mit Stammdaten
- Rolle, Geburtsdatum, Adresse, Beschaeftigung

### Sektion 2: Einnahmen-/Ausgabenaufstellung (Privat)
Analog zum Screenshot — zweispaltiges Layout:

**Einnahmen:**
- Nettoeinkommen pro Person (aus `applicant_profiles.net_income_monthly`)
- Einkuenfte aus selbststaendiger Taetigkeit
- Einkuenfte aus Vermietung/Verpachtung (aus Portfolio MOD-04)
- Nebentaetigkeit, Kindergeld, Zusatzeinkuenfte

**Ausgaben:**
- Warmmiete (aus `miety_tenancies` falls Mieter)
- Darlehen/Kredite (aus `miety_loans` + Portfolio-Darlehen)
- Versicherungen/Praemien (aus `insurance_contracts` Summe)
- Sparvertraege (aus `vorsorge_contracts` Summe)
- Abonnements (aus `user_subscriptions` Summe)
- Lebenshaltungskosten (aus `applicant_profiles.living_expenses_monthly`)

**Ergebnis:** Liquiditaet / Verfuegbares Einkommen mit Prozentangabe

### Sektion 3: Vermoegenshintergrund / Verbindlichkeiten
Zweispaltiges Layout:

**Vermoegen:**
- Haus- und Grundstuecksvermoegen (Portfolio `totalValue` + Zuhause `market_value`)
- Bank- und Sparguthaben (aus Konten)
- Wertpapiere (aus Investment-Depot falls vorhanden)
- Rueckkaufswerte (aus Vorsorge-Vertraegen)

**Verbindlichkeiten:**
- Valutierender Darlehensbetrag (Portfolio `totalDebt` + Zuhause-Darlehen)
- Sonstige Verbindlichkeiten

### Sektion 4: Zusammenfassung KPIs
Kompakte Kacheln:
- Monatliche Tilgung (gesamt)
- Monatliche Sparleistung
- Gesamtvermoegen
- Gesamtverbindlichkeiten
- Nettovermoegen

### Sektion 5: Vermoegensentwicklung (Chart)
- Kumuliertes Diagramm (recharts AreaChart/ComposedChart) ueber 40 Jahre
- Zeigt: Immobilienvermoegen (mit 2% p.a. Wertzuwachs), kumulierte Sparleistung, Restschuld, Nettovermoegen
- Nutzt die gleiche Projektionslogik wie `usePortfolioSummary` (erweitert um Sparkomponente)

### Sektion 6: Vertragsuebersicht (kategorisiert)
Kompakte Listen mit Typ, Anbieter, monatlicher Betrag:
- **Sparvertraege** (aus `vorsorge_contracts` mit Typ "Sparen")
- **Versicherungsvertraege** (aus `insurance_contracts`)
- **Darlehensvertraege** (aus Portfolio-Loans + `miety_loans`)
- **Vorsorgevertraege** (aus `vorsorge_contracts` mit Typ "Vorsorge")
- **Testament & Patientenverfuegung** — Status-Anzeige (vorhanden/nicht vorhanden), gelesen aus `vorsorge_documents`

### Sektion 7: PDF-Export
- Am Ende des Berichts ein `PdfExportFooter` (bestehendes Muster)
- Nutzt das vorhandene `usePdfExport` / `usePdfContentRef` Pattern
- Dateiname: `vermoegensauskunft-YYYY-MM-DD.pdf`

## Technische Umsetzung

### Neue Datei: `src/components/finanzanalyse/FinanzberichtSection.tsx`
Grosse Komponente, die alle Sektionen rendert. Nutzt:
- `usePortfolioSummary()` — MOD-04 Portfolio-Aggregation (totalValue, totalDebt, annualIncome etc.)
- `useFinanzanalyseData()` — Personen, Pensionen
- Direkte Supabase-Queries fuer: `applicant_profiles`, `insurance_contracts`, `vorsorge_contracts`, `user_subscriptions`, `miety_homes`, `miety_loans`, `miety_tenancies`, `vorsorge_documents`
- `usePdfContentRef()` + `PdfExportFooter` fuer PDF

### Neue Datei: `src/hooks/useFinanzberichtData.ts`
Zentraler Hook, der alle Datenquellen zusammenfuehrt:
- Portfolio-Daten (properties, loans, units, leases)
- Private Finanzen (Versicherungen, Vorsorge, Abos)
- Zuhause-Daten (eigene Immobilie, Darlehen/Miete)
- Einkommensdaten (applicant_profiles)
- Berechnet alle Aggregate (Einnahmen, Ausgaben, Vermoegen, Verbindlichkeiten)
- Generiert 40-Jahres-Projektion inkl. Sparkomponente

### Aenderung: `src/pages/portal/finanzanalyse/UebersichtTab.tsx`
- Importiert `FinanzberichtSection`
- Rendert sie zwischen dem Personen-Block und dem Konten-Block
- Ueberschrift "Finanzbericht" als neue Section

### Keine Datenbank-Aenderungen
Alle benoetigten Tabellen und Felder existieren bereits.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| Neu: `src/hooks/useFinanzberichtData.ts` | Zentraler Aggregations-Hook |
| Neu: `src/components/finanzanalyse/FinanzberichtSection.tsx` | Kompletter Bericht UI |
| `src/pages/portal/finanzanalyse/UebersichtTab.tsx` | Integration unterhalb Personen-Grid |

## Datenquellen-Matrix

```text
Quelle                    -> Verwendung im Bericht
─────────────────────────────────────────────────────
household_persons         -> Personen-Stammdaten
applicant_profiles        -> Einkommen, Ausgaben
properties + units        -> Immobilienvermoegen
loans                     -> Portfolio-Darlehen
leases                    -> Mieteinnahmen
miety_homes               -> Eigengenutzte Immobilie
miety_loans               -> Private Darlehen
miety_tenancies           -> Mietverhaeltnis
insurance_contracts       -> Versicherungen
vorsorge_contracts        -> Vorsorge + Sparen
user_subscriptions        -> Abonnements
vorsorge_documents        -> Testament/Patientenverfuegung Status
msv_bank_accounts         -> Bankguthaben
```
