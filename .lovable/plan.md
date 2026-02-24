

# Recherchemodul aufraumen: Desk-aligned Kacheln

## Problem

Die aktuelle `AdminRecherche`-Seite (KI-Office) zeigt alle `soat_search_orders` als flache Kachelliste ohne Bezug zu den Operative Desks. Die Kacheln haben generische Titel wie "Neuer Rechercheauftrag" und wirken hart gecodet. Es fehlt jede Zuordnung zu den 5 Geschaeftskategorien (Acquiary, Sales, Finance, Lead, Pet).

## Loesung

Die Widget-Grid-Sektion wird durch **5 Desk-Kategoriekarten** ersetzt, die als Einstiegspunkte dienen. Jede Karte zeigt:
- Desk-Name und Icon
- Anzahl offener/laufender Recherchen fuer diesen Desk
- Gesamtzahl gefundener Kontakte
- Button "Neuer Auftrag" (erstellt Order mit vorausgefuelltem `desk`-Feld)

Darunter bleibt die bestehende Inline-Case-Ansicht (Auftragsdetails, Ergebnisse, Import) erhalten, zeigt aber nur Orders des ausgewaehlten Desks.

## Neues UI-Layout

```text
+--------------------------------------------------+
| RECHERCHE-ZENTRALE                               |
+--------------------------------------------------+
| [Acquiary]  [Sales]  [Finance]  [Lead]  [Pet]    |
|  3 aktiv     1 aktiv  0 aktiv   2 aktiv  0 aktiv |
|  142 Kont.   38 Kont. --        67 Kont. --      |
+--------------------------------------------------+
| AUFTRAEGE: Acquiary (3)          [+ Neuer Auftrag]|
| +----------------------------------------------+ |
| | Family Office Hamburg   | done   | 25 Kont.  | |
| | Projektentwickler NRW   | running| 12 Kont.  | |
| | Immobilien Berlin       | draft  |  0 Kont.  | |
| +----------------------------------------------+ |
|                                                  |
| [Inline Detail wenn Auftrag gewaehlt]            |
+--------------------------------------------------+
```

## Technische Umsetzung

### Datei: `src/pages/admin/ki-office/AdminRecherche.tsx`

**Aenderungen:**

1. **Desk-Kategorien als Konstante** (nicht hart gecodet, sondern aus der gleichen Quelle wie die DeskContactBook-Presets):

```text
DESK_CATEGORIES = [
  { code: 'acquiary', label: 'Acquiary', subtitle: 'Family Offices & Immobilienunternehmen', icon: Building2 },
  { code: 'sales', label: 'Sales', subtitle: 'Immobilienmakler & Hausverwaltungen', icon: Briefcase },
  { code: 'finance', label: 'Finance', subtitle: 'Finanzvertriebe & Finanzdienstleister', icon: TrendingUp },
  { code: 'insurance', label: 'Lead', subtitle: 'Versicherungskaufleute', icon: Shield },
  { code: 'pet', label: 'Pet', subtitle: 'Hundepensionen, -hotels & -friseure', icon: PawPrint },
]
```

2. **State**: `selectedDesk` statt direkt `selectedOrderId` als erste Auswahl. Orders werden nach `desk` gefiltert.

3. **useSoatOrders anpassen**: Kein Filter im Hook noetig - die Filterung erfolgt client-seitig, da die Gesamtanzahl ohnehin gering ist. Alternativ kann der bestehende Hook erweitert werden, aber fuer die Uebersicht brauchen wir alle Desks gleichzeitig (fuer die Zaehler).

4. **Neuer Auftrag**: `handleCreateDraft` erhaelt den `desk`-Parameter und setzt ihn beim Insert.

5. **useSoatSearchEngine.ts**: `useCreateSoatOrder` wird um optionalen `desk`-Parameter erweitert, damit neue Orders dem richtigen Desk zugeordnet werden.

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/admin/ki-office/AdminRecherche.tsx` | Widget-Grid durch Desk-Karten ersetzen, Orders nach Desk filtern, "Neuer Auftrag" mit Desk-Zuordnung |
| `src/hooks/useSoatSearchEngine.ts` | `useCreateSoatOrder` um optionalen `desk`-Parameter erweitern |

### Nicht betroffen

- `DeskContactBook.tsx` - bleibt unveraendert (hat eigenen `useDeskContacts` Hook)
- `sot-research-engine` Edge Function - bleibt unveraendert
- Keine neuen Tabellen oder Migrationen noetig (die `desk`-Spalte auf `soat_search_orders` existiert bereits aus der vorherigen Migration)
- Keine Modul-Freeze-Verletzung (Dateien liegen in `src/pages/admin/ki-office/` und `src/hooks/`)

