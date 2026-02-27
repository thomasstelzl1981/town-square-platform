

## Analyse: 3 Probleme beim Excel-Import

### Problem 1: Upload-UI zu schmal, kein Drag-Feedback

**Ist-Zustand:** `PortfolioTab.tsx` Zeile 1060-1073 — ein minimaler `p-3` Card mit 1 Zeile Text. Beim Drag-Over gibt es keinen visuellen Hinweis (keine Farbänderung, kein Border-Highlight). Der `FileUploader` leitet zwar DnD-Events weiter, aber das innere `div` reagiert visuell nicht.

**Fix:** Das Upload-Feld größer machen (`p-6`), mit einem `isDragOver`-State im `FileUploader` children-Mode, der nach unten durchgereicht wird (render-prop oder CSS-Klasse). Alternativ: eigenen lokalen DnD-State in PortfolioTab mit visueller Reaktion (Border primary, Background-Tint).

---

### Problem 2: Nach Import kein Refresh der Liste

**Ist-Zustand:** `ExcelImportDialog.tsx` Zeile 242 invalidiert `queryKey: ['properties']`. Aber `PortfolioTab` nutzt `queryKey: ['portfolio-units-annual', activeTenantId, demoEnabled]` (Zeile 158). Das Invalidate trifft nie die richtige Query.

**Fix:** `queryClient.invalidateQueries` muss die tatsächlichen Query-Keys invalidieren:
- `['portfolio-units-annual']`
- `['context-property-assignments']`
- `['landlord-contexts']`

---

### Problem 3: Finanzwerte werden nicht zugeordnet

**Ist-Zustand:** Die KI extrahiert korrekt: `kaltmiete`, `jahresmiete`, `restschuld`, `annuitaetMonat`, `bank`, `zinsfestschreibungBis`. Aber:

| AI-Feld | ExcelImportDialog mapping | sot-property-crud akzeptiert | DB-Spalte |
|---------|--------------------------|------------------------------|-----------|
| `kaufpreis` | `market_value` (falsch!) | `purchase_price` ✅ | `purchase_price` |
| `marktwert` | `market_value` ✅ | `market_value` ✅ | `market_value` |
| `jahresmiete` | **nicht gemappt** | **nicht akzeptiert** | `annual_income` ✅ |
| `kaltmiete` | **nicht gemappt** | **nicht akzeptiert** | berechnet |
| `restschuld` | **nicht gemappt** | **nicht akzeptiert** | `loans.outstanding_balance_eur` |
| `annuitaetMonat` | **nicht gemappt** | **nicht akzeptiert** | `loans.annuity_monthly_eur` |
| `bank` | **nicht gemappt** | **nicht akzeptiert** | `loans.bank_name` |
| `zinsfestschreibungBis` | **nicht gemappt** | **nicht akzeptiert** | `loans.fixed_interest_end_date` |
| `units_count` | gesendet | **nicht akzeptiert** | `multi_unit_enabled` |

**Root Cause:** `sot-property-crud` Zeile 86-101 akzeptiert nur 10 Felder. `ExcelImportDialog` Zeile 202-212 mappt nur 9 davon. Keinerlei Finanzierung wird an die `loans`-Tabelle geschrieben.

**Fix (2 Dateien):**

1. **`sot-property-crud/index.ts`** — `PropertyCreate`-Interface erweitern um `annual_income`, `purchase_price` (schon da), `units_count`. Neues optionales Feld `loan_data` mit `bank_name`, `outstanding_balance_eur`, `annuity_monthly_eur`, `fixed_interest_end_date`. Nach dem Property-Insert: wenn `loan_data` vorhanden, Zeile in `loans`-Tabelle einfügen mit `property_id` + `unit_id` vom gerade erstellten Objekt.

2. **`ExcelImportDialog.tsx`** — `handleImport` erweitern: `kaufpreis` → `purchase_price`, `marktwert` → `market_value`, `jahresmiete` → `annual_income`, `kaltmiete` × 12 → `annual_income` (Fallback). Loan-Daten als `loan_data`-Objekt mitsenden.

---

### Implementierungsschritte

1. **PortfolioTab Upload-UI verbessern** — Größere Drop-Zone mit visueller Drag-Reaktion (Highlight bei Hover)
2. **ExcelImportDialog Query-Invalidation fixen** — Korrekte Query-Keys nach Import
3. **ExcelImportDialog Feld-Mapping erweitern** — Alle AI-Felder korrekt an `sot-property-crud` senden
4. **sot-property-crud erweitern** — `annual_income`, `units_count` akzeptieren + automatische `loans`-Erstellung bei Finanzierungsdaten
5. **FileUploader children-Mode** — Drag-State als CSS-Klasse nach außen geben für visuelles Feedback

### Freeze-Status

- `PortfolioTab.tsx` → MOD-04: **bereits unfreezed** (aktuelle Session)
- `ExcelImportDialog.tsx` → `src/components/portfolio/`: FREI
- `FileUploader.tsx` → `src/components/shared/`: FREI
- `sot-property-crud` → Edge Function: muss `infra_freeze.json` prüfen

