
# Zone 1 Recherche: Pop-Up entfernen, Widget-Standard umsetzen

## Problem

In `src/pages/admin/ki-office/AdminRecherche.tsx` oeffnet der "Neuer Auftrag"-Button einen **Dialog (Pop-Up)** mit Titel, Intent und Zielanzahl. Das widerspricht dem Golden Path Standard: Neue Vorgaenge werden ueber ein CTA-Widget im Grid initiiert und oeffnen den Flow **inline unterhalb** des Grids.

## Loesung

### Was sich aendert

1. **Dialog komplett entfernen** (Zeilen 390-426): Kein Pop-Up mehr fuer "Neuer Auftrag"
2. **CTA-Widget erstellt sofort einen Draft**: Klick auf "Neuer Auftrag" ruft `createOrder.mutateAsync()` auf und setzt die neue Order als `selectedOrderId` — der Inline-Flow oeffnet sich automatisch darunter
3. **Inline-Flow erweitern**: Der bestehende Inline-Case-Block (ab Zeile 238) bekommt fuer Draft-Orders editierbare Felder (Titel, Intent, Zielanzahl), die bisher nur im Dialog waren. So sieht der User den gesamten Flow auf einen Blick.

### Ablauf nach Umbau

```text
+-------------------+-------------------+-------------------+-------------------+
| + Neuer Auftrag   | Makler Hamburg    | Hausverwaltungen  | ...               |
| (CTA-Widget)      | [Entwurf]         | [Fertig]          |                   |
+-------------------+-------------------+-------------------+-------------------+

Klick auf CTA → Draft wird erstellt → Widget erscheint im Grid → Inline-Flow oeffnet sich:

+------------------------------------------------------------------------+
| Auftrag definieren                                                      |
| Titel: [________________]  Was suchen Sie? [________________________]  |
| Zielanzahl: [25 Kontakte ▼]                                           |
|                                                    [Recherche starten] |
+------------------------------------------------------------------------+
| Ergebnisse (0)                                                          |
| Starten Sie den Auftrag, um Ergebnisse zu erhalten                     |
+------------------------------------------------------------------------+
```

### Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/pages/admin/ki-office/AdminRecherche.tsx` | Dialog entfernen, CTA-Widget direkt `createOrder` aufrufen, Inline-Flow um editierbare Draft-Felder (Titel, Intent, Zielanzahl) erweitern |

### Was sich NICHT aendert
- Widget-Grid-Layout (bleibt `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`)
- Ergebnis-Tabelle und Bulk-Import-Logik
- Status-Badges und Phase-Tracking
- `useSoatSearchEngine` Hook
