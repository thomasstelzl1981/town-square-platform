

## Analyse: Excel-Import — Kontext-Zuordnung und Darlehen fehlen

### Bestätigte Datenlage

| Fakt | Status |
|------|--------|
| 4 Immobilien importiert | ✅ vorhanden in `properties` |
| `landlord_context_id` auf allen 4 | ❌ `NULL` |
| `context_property_assignment` Einträge | ❌ 0 Einträge |
| Loans (Darlehen) | ❌ Tabelle leer für diesen Tenant |
| MM.Wohnen GmbH Kontext | ✅ existiert (`e4623b8c-...`) |

### Root Cause 1: Keine Kontext-Zuordnung

Die `ExcelImportDialog`-Komponente erhält keinen `contextId`-Parameter. Beim Import wird `sot-property-crud` aufgerufen, aber:
- **`landlord_context_id`** wird nie an die Edge Function gesendet
- **`context_property_assignment`** wird nie geschrieben
- Die Edge Function `sot-property-crud` setzt `landlord_context_id` nicht im Insert

Der User importiert von der MM.Wohnen-Kontextseite aus, aber der aktive Kontext wird nicht durchgereicht.

### Root Cause 2: Darlehen werden nicht gespeichert

Im Edge Function Log fehlen Einträge. Das Problem liegt im Frontend: Die `handleImport`-Funktion baut `loan_data` korrekt auf (Zeile 260-267), und die Edge Function verarbeitet es korrekt (Zeile 144-173). Mögliche Ursachen:
- Die AI-Extraktion liefert `restschuld`, `annuitaetMonat`, `bank` — aber der Edge Function Insert schreibt `scope: "property"` (lowercase) statt `"PROPERTY"` (DB-Default ist `'PROPERTY'`)
- Prüfung: `data.loan_data.bank_name || data.loan_data.outstanding_balance_eur` — wenn die AI `bank: null` und `restschuld: 0` liefert, wird der gesamte Loan-Block übersprungen

### Fix-Plan

**1. ExcelImportDialog — Kontext-ID durchreichen**
- Neue Prop `contextId?: string` hinzufügen
- Im `handleImport`: `propertyData.landlord_context_id = contextId` setzen
- Nach erfolgreichem Import: `context_property_assignment` Eintrag per Supabase SDK schreiben

**2. PortfolioTab — aktiven Kontext an Dialog übergeben**
- `selectedContextId` als `contextId` an `ExcelImportDialog` übergeben

**3. Edge Function `sot-property-crud` — 3 Fixes**
- `landlord_context_id` aus `data` akzeptieren und in Insert schreiben
- `scope` auf `"PROPERTY"` (uppercase) korrigieren
- Loan-Condition verbessern: Auch erstellen wenn nur `annuity_monthly_eur` vorhanden

**4. Edge Function — Context Assignment schreiben**
- Nach Property-Insert: Wenn `landlord_context_id` vorhanden, automatisch `context_property_assignment` Eintrag erstellen

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/portfolio/ExcelImportDialog.tsx` | Neue Prop `contextId`, durchreichen an Import-Call + Assignment-Insert |
| `src/pages/portal/immobilien/PortfolioTab.tsx` | `selectedContextId` an Dialog übergeben |
| `supabase/functions/sot-property-crud/index.ts` | `landlord_context_id` akzeptieren, `scope` Fix, Loan-Condition erweitern, auto-Assignment |

