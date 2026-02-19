

# Preislisten-Parsing MOD-13: KI-Mapping und Muster-Vorlage

## Ist-Zustand

Die Edge Function `sot-project-intake` parst Preislisten bereits KI-gestuetzt (Gemini 2.5 Flash). Das funktioniert grundsaetzlich, hat aber drei Schwaechen:

1. **Freitext-JSON statt Tool-Calling** -- Die KI gibt JSON als Text zurueck, das per Regex extrahiert wird. Bei ungewoehnlichen Formaten kann das scheitern.
2. **Keine Muster-Excel-Vorlage** -- User koennen keine Vorlage herunterladen, die die erwarteten Spalten vorgibt.
3. **Kein Spalten-Mapping-Feedback** -- Der User sieht extrahierte Einheiten, weiss aber nicht, welche Original-Spalte zu welchem Feld gemappt wurde, und kann keine Korrektur vornehmen.

## Loesung (3 Teile)

### Teil 1: Muster-Excel-Vorlage bereitstellen

Eine XLSX-Datei mit vordefinierten Spalten generieren und als Download im `QuickIntakeUploader` sowie im `ProjekteDashboard` anbieten:

**Spalten der Vorlage:**

```text
| Einheit-Nr. | Typ | Flaeche (m2) | Zimmer | Etage | Kaufpreis (EUR) | Aktuelle Miete (EUR/Monat) |
|-------------|-----|-------------|--------|-------|-----------------|---------------------------|
| WE-001      | Wohnung | 65,0  | 2      | EG    | 289.000         | 650                       |
| WE-002      | Penthouse | 120,0 | 4    | DG    | 589.000         | 0                         |
```

**Implementierung:**
- Neue Funktion `downloadPreislistenVorlage()` in `QuickIntakeUploader.tsx`
- Nutzt bestehende `getXlsx()` aus `src/lib/lazyXlsx.ts`
- Download-Button neben dem Preislisten-Dropzone

### Teil 2: Tool-Calling statt Freitext-JSON

In `sot-project-intake/index.ts` den AI-Call von Freitext-JSON auf **Tool-Calling** umstellen. Das erzwingt strukturiertes Output und eliminiert Regex-Parsing-Fehler.

**Aenderung in der Edge Function:**

Statt:
```text
messages: [{ role: 'system', content: 'Antworte NUR mit einem JSON-Array...' }]
```

Neu:
```text
tools: [{
  type: 'function',
  function: {
    name: 'extract_units',
    description: 'Extrahiere alle Einheiten aus der Preisliste',
    parameters: {
      type: 'object',
      properties: {
        units: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              unitNumber: { type: 'string' },
              type: { type: 'string', enum: ['Wohnung','Apartment','Penthouse','Maisonette','Gewerbe','Stellplatz','Buero','Lager','Keller'] },
              area: { type: 'number' },
              rooms: { type: 'number' },
              floor: { type: 'string' },
              price: { type: 'number' },
              currentRent: { type: 'number' }
            },
            required: ['unitNumber','type','area','price']
          }
        },
        column_mapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              original_column: { type: 'string' },
              mapped_to: { type: 'string' }
            }
          }
        }
      },
      required: ['units']
    }
  }
}],
tool_choice: { type: 'function', function: { name: 'extract_units' } }
```

**Vorteil:** Die KI muss die Daten exakt in das Schema pressen. Zusaetzlich wird ein `column_mapping` zurueckgegeben, das zeigt, welche Original-Spalte zu welchem Feld gemappt wurde.

### Teil 3: Spalten-Mapping im Review anzeigen

Im Review-Schritt des `QuickIntakeUploader` (Phase "review") das `column_mapping` anzeigen, damit der User sieht:

```text
Original-Spalte          → Zuordnung
"Wfl. (qm)"             → Flaeche (m2)
"Kaufpreis netto"        → Kaufpreis (EUR)
"Whg-Nr"                 → Einheit-Nr.
"Geschoss"               → Etage
```

Das gibt Transparenz und Vertrauen in die KI-Extraktion.

## Geaenderte/Neue Dateien

1. **`supabase/functions/sot-project-intake/index.ts`** -- Tool-Calling statt Freitext, `column_mapping` in Response
2. **`src/components/projekte/QuickIntakeUploader.tsx`** -- Vorlage-Download-Button + Spalten-Mapping-Anzeige im Review
3. **`supabase/functions/sot-public-project-intake/index.ts`** -- Gleiche Tool-Calling-Umstellung (Kaufy Zone 3)

## Technische Details

### Tool-Calling Response-Parsing

```text
// Statt Regex:
const jsonMatch = content.match(/\[[\s\S]*\]/);

// Neu — strukturiert:
const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
const args = JSON.parse(toolCall.function.arguments);
const units = args.units;
const columnMapping = args.column_mapping;
```

### System-Prompt-Erweiterung

Der System-Prompt wird erweitert um:
- Hinweis, dass Spalten in beliebiger Reihenfolge und mit unterschiedlichen Bezeichnungen kommen koennen
- Beispiele fuer gaengige Spalten-Varianten (z.B. "Wfl.", "Wohnflaeche", "qm", "m2" → alle = `area`)
- Anweisung, das `column_mapping` zu befuellen

### Vorlage-Generierung

```text
const downloadPreislistenVorlage = async () => {
  const XLSX = await getXlsx();
  const wb = XLSX.utils.book_new();
  const header = [
    'Einheit-Nr.', 'Typ', 'Fläche (m²)', 'Zimmer',
    'Etage', 'Kaufpreis (EUR)', 'Aktuelle Miete (EUR/Monat)'
  ];
  const example = [
    'WE-001', 'Wohnung', 65.0, 2, 'EG', 289000, 650
  ];
  const ws = XLSX.utils.aoa_to_sheet([header, example]);
  XLSX.utils.book_append_sheet(wb, ws, 'Preisliste');
  XLSX.writeFile(wb, 'Preisliste_Vorlage.xlsx');
};
```

## Ergebnis

- User koennen eine Muster-Vorlage herunterladen und ihre Daten dort eintragen
- Beliebige Excel-Formate werden trotzdem korrekt per KI erkannt und gemappt
- Das Spalten-Mapping ist transparent und nachvollziehbar im Review-Schritt
- Tool-Calling eliminiert Parsing-Fehler bei ungewoehnlichen KI-Antworten
