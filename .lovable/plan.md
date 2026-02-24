

# Recherchemodul bereinigen: 3 Aenderungen

## 1. Bestehende Recherche-Auftraege loeschen

Es gibt 8 Auftraege in der Datenbank, alle mit `desk = 'acquiary'` — davon 5 leere Entwuerfe ("Neuer Rechercheauftrag"), 1 in Warteschlange, 1 abgebrochen, 1 leerer Entwurf. Diese werden per SQL-Migration geloescht:

```sql
DELETE FROM soat_search_results WHERE order_id IN (SELECT id FROM soat_search_orders);
DELETE FROM soat_search_orders;
```

## 2. Loesch-Button fuer Auftraege hinzufuegen

Jeder Auftrag in der Auftrags-Liste erhaelt einen Trash-Icon-Button (analog zum bestehenden `WidgetDeleteOverlay`-Pattern). Zusaetzlich wird ein neuer `useDeleteSoatOrder`-Hook in `useSoatSearchEngine.ts` ergaenzt:

```text
useDeleteSoatOrder()
  -> DELETE FROM soat_search_results WHERE order_id = X
  -> DELETE FROM soat_search_orders WHERE id = X
  -> invalidate query cache
```

In der Auftrags-Zeile (AdminRecherche.tsx, Zeilen 347-369) wird rechts neben den Zaehler-Icons ein Trash2-Button mit Bestaetigung eingebaut. Laufende Auftraege (`status = 'running'`) werden vom Loeschen ausgenommen.

## 3. Kategorien korrigieren

### Lead-Kategorie entfernen

Die Kategorie "Lead" (code: `lead` / `insurance`) wird aus `DESK_CATEGORIES` entfernt. Der Lead Desk empfaengt Leads aus gebuchten Anzeigen (Zone 2 Lead Manager), nicht aus der Recherche-Engine.

### "Finanzdienstleister" bleibt bei Finance

Die Zuordnung ist bereits korrekt — `finance` enthaelt "Finanzvertriebe & Finanzdienstleister". Keine Aenderung noetig.

### Ergebnis: 4 statt 5 Kategorien

| Kategorie | Code | Subtitle |
|-----------|------|----------|
| Acquiary | `acquiary` | Family Offices und Immobilienunternehmen |
| Sales | `sales` | Immobilienmakler und Hausverwaltungen |
| Finance | `finance` | Finanzvertriebe und Finanzdienstleister |
| Pet | `pet` | Hundepensionen, -hotels und -friseure |

Grid wird von `lg:grid-cols-5` auf `lg:grid-cols-4` angepasst.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| SQL-Migration | Alle bestehenden soat_search_orders und results loeschen |
| `src/hooks/useSoatSearchEngine.ts` | Neuer `useDeleteSoatOrder`-Hook |
| `src/pages/admin/ki-office/AdminRecherche.tsx` | Lead-Kategorie entfernen, Grid auf 4 Spalten, Trash-Button pro Auftrag mit AlertDialog-Bestaetigung |

