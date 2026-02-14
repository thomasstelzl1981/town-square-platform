

# Recherche-Ergebnisse: Professionelle Tabellenansicht + Import-Flow

## Problem

1. **Zu wenig sichtbare Datenpunkte**: Die Ergebnisse werden als kompakte Karten angezeigt, nicht als strukturierte Tabelle. Wichtige Felder (Adresse, PLZ, Kategorie, Rolle, Website-URL, Quelle) sind versteckt oder fehlen.
2. **Kein Export**: Es gibt keinen Excel/CSV-Export der Ergebnisse.
3. **Import ohne Feedback**: Der Bulk-Import ins Kontaktbuch zeigt nicht an, welche Kontakte bereits existieren (Duplikate) und welche neu angelegt werden.

## Loesung

### 1. Ergebnis-Tabelle statt Karten-Liste

Die ScrollArea mit Karten (Zeilen 398-447) wird durch eine echte HTML-Tabelle ersetzt:

| Spalte | Datenfeld | Breite |
|--------|-----------|--------|
| Checkbox | (Auswahl) | 40px |
| Firma | company_name | flex |
| Kategorie | category | 100px |
| Kontaktperson | contact_person_name | 150px |
| Rolle | contact_person_role | 120px |
| E-Mail | email | 180px |
| Telefon | phone | 130px |
| Stadt | city | 100px |
| PLZ | postal_code | 70px |
| Website | website_url | 80px (Link-Icon) |
| Score | confidence_score | 60px |
| Status | validation_state | 90px |
| Aktionen | OK/Nein-Buttons | 100px |

Die Tabelle wird horizontal scrollbar in einer ScrollArea dargestellt, damit alle Datenpunkte sichtbar sind.

### 2. Excel-Export

Ein neuer "Export"-Button neben dem Filter generiert eine XLSX-Datei (mit der bereits installierten `xlsx`-Bibliothek) mit allen sichtbaren Ergebnissen und saemtlichen Datenpunkten.

### 3. Import-Flow mit Deduplizierungs-Vorschau

Statt direkt zu importieren, zeigt der Import-Button eine Vorschau-Sektion unterhalb der Tabelle:

```text
+------------------------------------------------------------------------+
| Import-Vorschau                                              [X Schliessen] |
|------------------------------------------------------------------------|
| 12 ausgewaehlt: 8 neue Kontakte | 3 bereits vorhanden | 1 ohne E-Mail |
|------------------------------------------------------------------------|
| [v] Makler Hamburg GmbH    | NEU        | mueller@example.de          |
| [v] Immo Partner AG        | DUPLIKAT   | info@immo.de (existiert)    |
| [ ] Test Firma              | KEIN EMAIL | —                           |
|------------------------------------------------------------------------|
| Duplikate: [ ] Ueberspringen  [x] Aktualisieren                       |
|                                          [Jetzt importieren (8 neue)]  |
+------------------------------------------------------------------------+
```

Der Import nutzt die bestehende Edge Function `sot-research-import-contacts` mit dem `duplicate_policy`-Parameter statt der aktuellen einfachen `contacts.insert`-Logik (Zeilen 162-188), die keine Duplikat-Pruefung hat.

**Vor dem Import**: Ein Vorab-Check fragt die `contacts`-Tabelle nach E-Mail-Matches ab, um die Vorschau zu fuellen.

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/admin/ki-office/AdminRecherche.tsx` | Karten-Liste durch Tabelle ersetzen, Export-Button, Import-Vorschau mit Dedupe-Check |

## Was sich NICHT aendert

- `useSoatSearchEngine.ts` (Hook bleibt gleich)
- `sot-research-import-contacts` Edge Function (wird jetzt tatsaechlich genutzt statt der manuellen Insert-Logik)
- Widget-Grid und Draft-Flow (bereits korrekt)
