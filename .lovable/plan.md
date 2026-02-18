
# Löschfunktion für Finanzierungsanfragen

## Analyse

Die zwei sichtbaren Finanzierungsanfragen sind reale Datenbankeinträge in `finance_requests`:

1. **SOT-F-DEMO001** — geseedeter Beispieldatensatz (Status: submitted)
2. **SOT-FR-XW4BSP9K** — leerer Draft (Status: draft)

Beide werden per Supabase-Query geladen. Es gibt keine Lösch-Möglichkeit im UI.

## Lösung

### 1. Lösch-Button in der Widget-Leiste (StatusTab + FinanceRequestWidgets)

Jede Anfrage-Kachel bekommt einen kleinen Lösch-Button (Trash-Icon), der nur bei bestimmten Status sichtbar ist:

- **Löschbar**: `draft`, `collecting` (noch nicht eingereicht)
- **Archivierbar**: `submitted`, `rejected`, `cancelled`, `completed` (bereits im Prozess — werden als "archiviert" markiert statt gelöscht)
- **Nicht löschbar**: `in_processing`, `bank_submitted`, `assigned` (aktive Bearbeitung)

### 2. Bestätigungsdialog

Vor dem Löschen wird ein AlertDialog angezeigt:

- **Draft**: "Entwurf löschen? Dieser Entwurf wird unwiderruflich gelöscht."
- **Eingereichte Anfragen**: "Anfrage archivieren? Die Anfrage wird aus der Übersicht entfernt."

### 3. Datenbank-Logik

- **Drafts**: Echtes `DELETE FROM finance_requests WHERE id = ? AND status IN ('draft', 'collecting')`
- **Andere Status**: Soft-Delete über ein neues Feld `archived_at` (Timestamp), das per Migration hinzugefügt wird. Archivierte Anfragen werden aus den Queries gefiltert.

### 4. Dateien und Änderungen

| Datei | Änderung |
|-------|----------|
| Migration | `ALTER TABLE finance_requests ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL` |
| `src/pages/portal/finanzierung/StatusTab.tsx` | Lösch-/Archiv-Button pro Kachel, AlertDialog, Mutation, Query-Filter `archived_at IS NULL` |
| `src/components/finanzierung/FinanceRequestWidgets.tsx` | Gleicher Lösch-Button + Filter für Drafts |

### 5. Reihenfolge

1. Migration: `archived_at` Spalte hinzufügen
2. `StatusTab.tsx`: Lösch-Button + Dialog + Mutation + Query-Filter
3. `FinanceRequestWidgets.tsx`: Gleiche Lösch-Logik für Draft-Widgets im Anfrage-Tab
