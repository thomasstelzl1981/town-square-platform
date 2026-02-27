
Ziel
- Die Darlehens-Auslesung für bereits importierte Objekte im Immomanager/Immobilienakte verlässlich reaktivieren und sicherstellen, dass Loan-Daten tatsächlich in den Akten landen.

Festgestellte Ursachen (aus Code + Daten)
1) `loans` ist für den Tenant leer, obwohl 4 Properties angelegt wurden und korrekt im Kontext hängen.
2) In `sot-property-crud` sind Loan-Insert-Fehler aktuell „non-fatal“ und werden nur geloggt; der API-Response bleibt 201 → Frontend zählt Import als Erfolg.
3) `ExcelImportDialog` wertet pro Zeile nur `response.ok` aus; es gibt keine Auswertung, ob `loan_id` wirklich erzeugt wurde.
4) Loan-Felder werden unnormalisiert durchgereicht (Zahlen-/Datumsformate aus Excel/AI), dadurch können Inserts scheitern, ohne dass der User es sieht.

Umsetzung (kompakt)
1) Backend robust machen (`supabase/functions/sot-property-crud/index.ts`)
- Normalizer einbauen:
  - `parseMoneyLike()` für `restschuld`, `annuitaetMonat`, `original_amount`, `interest_rate_percent` (de-DE/EN Formate).
  - `parseDateLike()` für `fixed_interest_end_date` (ISO + `DD.MM.YYYY`).
- Loan-Insert absichern:
  - Ungültige Datumswerte nicht blind inserten (auf `null` setzen statt Hard-Fail).
  - Nur validierte Felder in Insert übernehmen.
- Response erweitern:
  - `loan_status: 'created' | 'skipped' | 'failed'`
  - `loan_error` (falls fehlgeschlagen)
  - `loan_input_debug` (sanitized, ohne sensible Daten).

2) Frontend-Import transparent machen (`src/components/portfolio/ExcelImportDialog.tsx`)
- Zeilenresultat auswerten statt nur `response.ok`:
  - `property_created_count`
  - `loan_created_count`
  - `loan_failed_count`
- Abschluss-Toast differenziert:
  - Erfolg: „X Objekte, Y Darlehen übernommen“
  - Warnung: „X Objekte angelegt, aber Y Darlehen nicht gespeichert“
- Detail-Liste „Import-Protokoll“ im Dialog (pro Zeile Loan-Status + Fehlergrund).

3) „Auslesung neu aktivieren“ als gezielter Re-Run (ohne Duplikate)
- Im Excel-Dialog Modus ergänzen: „Nur Darlehen nachziehen“.
- Bei diesem Modus:
  - Bestehende Property per `address + postal_code + city + tenant` matchen.
  - Kein neues Objekt anlegen, sondern Loan upserten (`property_id` setzen, vorhandenes Loan aktualisieren/neu anlegen).
- UI-Entry in Portfolio/Immomanager-Flow: Button „Darlehen neu aus Excel auslesen“.

4) Dossier/Immomanager Konsistenz
- Nach erfolgreichem Loan-Write gezielte Query-Invalidierungen:
  - `['unit-dossier', ...]`
  - `['portfolio-units-annual', ...]`
  - ggf. Detail-Queries der Akte.
- Damit Darlehensblock sofort gefüllt erscheint.

5) Regression-Absicherung
- Edge-Function Tests (Deno):
  - Zahlformate: `1.294.020`, `1,294,020`, `55.000,00`, `55000`
  - Datumsformate: `2030-12-31`, `31.12.2030`, invalid
  - Erwartung: Property kann erstellt werden, Loan-Status korrekt zurückgegeben.
- Manueller E2E-Check:
  - Re-Run „Nur Darlehen nachziehen“ mit derselben Excel.
  - In Immobilienakte prüfen: Bank, Restschuld, Rate, Zinsbindung sichtbar.
  - In Immomanager-Ansicht prüfen: Werte konsistent.

Betroffene Dateien
- `supabase/functions/sot-property-crud/index.ts`
- `src/components/portfolio/ExcelImportDialog.tsx`
- `src/pages/portal/immobilien/PortfolioTab.tsx` (Button/Mode-Trigger für Re-Run)

Governance/Freeze-Check (vor Implementierung geprüft)
- MOD-04: nicht eingefroren.
- MOD-09: nicht eingefroren.
- Infra `supabase/functions/*`: nicht eingefroren.
- Keine Änderungen an gesperrten Bereichen (`src/goldenpath/*`, `src/validation/*`).

Technische Hinweise (kurz)
- Hauptfix ist nicht nur „erneut auslesen“, sondern „persistieren + sichtbar machen“.
- Ohne Status-Rückgabe aus `sot-property-crud` bleibt der Fehler für User unsichtbar.
- Re-Run als „loan-only upsert“ verhindert doppelte Immobilien.
