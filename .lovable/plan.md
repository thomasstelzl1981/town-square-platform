

## Fix: Löschfunktion im Portfolio + Mieteinnahmen-Import

### Fehler 1: Eye-Icon → Löschen-Button

Das Eye-Icon in der Portfolio-Tabelle ist redundant (Klick auf Zeile öffnet bereits die Akte). Es wird durch einen **Trash-Button mit Bestätigungsdialog** ersetzt.

**Datei: `src/pages/portal/immobilien/PortfolioTab.tsx`**
- `Eye`-Import durch `Trash2` ersetzen
- `rowActions` umbauen: Statt Navigation → Delete mit `AlertDialog`
- Delete-Logik analog `PropertyDetailPage.handleDeleteProperty`:
  - Storage-Nodes löschen (`storage_nodes.property_id`)
  - Loans löschen (`loans.property_id`)
  - Context-Assignments löschen (`context_property_assignment.property_id`)
  - Leases löschen (über Units)
  - Units löschen
  - Property löschen
- Nach Löschung: Query-Invalidierung für Portfolio-Daten
- Toast: „Immobilie und zugehörige Daten gelöscht"
- Demo-Schutz: Button disabled für Demo-IDs (`is_demo === true`)

### Fehler 2: Mieteinnahmen werden nicht übernommen

Die Netzwerk-Daten zeigen `annual_income: null` für alle 4 Objekte. Der Fehler liegt in der Zahlen-Normalisierung:

**Datei: `supabase/functions/sot-property-crud/index.ts`**
- `annual_income` durch `parseMoneyLike()` normalisieren (wie bereits für Loan-Felder implementiert)
- Zeile ~235: `data.annual_income` vor dem Null-Check durch Parser schicken

**Datei: `src/components/portfolio/ExcelImportDialog.tsx`**
- `annualIncome`-Berechnung (Zeile ~265) absichern: Wenn `jahresmiete` ein String wie `"55.000"` ist, vor der Zuweisung parsen
- `parseMoneyLike`-Hilfsfunktion im Frontend hinzufügen (gleiche Logik wie Backend) für die Preview-Anzeige

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/pages/portal/immobilien/PortfolioTab.tsx` | Eye → Trash2 mit Delete-Dialog und Cascade-Löschung |
| `supabase/functions/sot-property-crud/index.ts` | `annual_income` durch `parseMoneyLike()` normalisieren |
| `src/components/portfolio/ExcelImportDialog.tsx` | Frontend-Parsing für `jahresmiete`-Werte absichern |

### Freeze-Check
- MOD-04: nicht eingefroren ✅
- `supabase/functions/*`: nicht eingefroren ✅

