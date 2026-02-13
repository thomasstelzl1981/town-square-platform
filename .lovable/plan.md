
# Fix: Datenraum leer — Root-Node Re-Parenting fehlt

## Ursache

Die `ColumnView` im `StorageFileManager` zeigt als erste Spalte nur Ordner, deren `parent_id = null` ist (Zeile 111-112 in `ColumnView.tsx`). 

Der Property-Root-Ordner (z.B. "DEMO-001 - Leipziger Strasse 42") hat aber `parent_id = 4e1c6b44-...` (den MOD_04 DMS-Root). Dieser uebergeordnete Knoten wird nicht mit abgefragt, daher findet `ColumnView` keinen einzigen Root-Ordner und zeigt eine leere Ansicht.

Das `FinanceDocumentsManager` (MOD-07) loest genau dieses Problem korrekt: Es setzt `parent_id` des Modul-Root-Knotens auf `null`, damit `StorageFileManager` ihn als Root erkennt.

Beim Umbau der `DatenraumTab.tsx` auf `StorageFileManager` wurde dieses Re-Parenting vergessen.

## Loesung

### `src/components/portfolio/DatenraumTab.tsx`

1. **Property-Root-Node identifizieren**: Der Ordner, dessen `parent_id` NICHT in der Liste der abgefragten Nodes ist (oder alternativ: der Node, der als einziger kein Elternteil innerhalb der Ergebnismenge hat).

2. **Re-Parenting**: Analog zu `FinanceDocumentsManager` den Root-Node mit `parent_id: null` ueberschreiben, damit `ColumnView` ihn als Wurzel erkennt.

3. **Children als Roots zeigen**: Alternativ (und besser fuer die UX): Die Kinder des Property-Root-Ordners direkt als Top-Level anzeigen, indem der Root-Node selbst uebersprungen wird und seine direkten Kinder `parent_id: null` bekommen. So sieht der Nutzer sofort "00_Projektdokumentation", "01_Expose Ankauf" etc. statt eines uebergeordneten Property-Ordners.

Konkret wird ein `useMemo` eingefuegt:

```text
1. rootNode = nodes.find(n => !nodes.some(other => other.id === n.parent_id))
2. displayNodes = nodes
     .filter(n => n.id !== rootNode.id)
     .map(n => n.parent_id === rootNode.id ? { ...n, parent_id: null } : n)
```

Das ist ein Einzeiler-Fix in einer einzigen Datei.

## Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/components/portfolio/DatenraumTab.tsx` | `useMemo` fuer Node-Re-Parenting einfuegen, analog zu `FinanceDocumentsManager` |

## Keine weiteren Aenderungen

Keine Datenbank-, Routing- oder Schema-Aenderungen noetig.
