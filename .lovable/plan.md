

# Homogenes 8-Kachel-Layout fuer die Immobilienakte

## Aktueller Zustand

Das Layout hat 5 Reihen mit unterschiedlichen Breiten:
- ROW 1: Identitaet | Gebaeude (2-spaltig)
- ROW 2: Lage & Beschreibung (full-width)
- ROW 3: Grundbuch | Finanzierung (2-spaltig)
- ROW 4: Mietverhaeltnis | WEG (2-spaltig)
- ROW 5: Dokumente (2/3-Breite)

Das erzeugt ein unruhiges Bild durch die Full-Width-Beschreibung und die schmalere Dokumenten-Kachel.

## Neues Layout: 4 Reihen x 2 Spalten = 8 gleich grosse Kacheln

```text
ROW 1: [Identitaet & Stammdaten] [Gebaeude & Flaechen]
ROW 2: [Grundbuch & Erwerb]      [Finanzierung]
ROW 3: [Mietverhaeltnis]         [WEG & Hausgeld]
ROW 4: [Lage & Beschreibung]     [Dokumente]
```

Alle Kacheln haben exakt die gleiche Breite (50/50). Auf Mobile stapeln sie sich 1-spaltig — volle Homogenitaet.

## Aenderungen

### `EditableUnitDossierView.tsx`

1. **ROW 2 (Beschreibung full-width) entfernen** — die `EditableAddressBlock`-Komponente wird nach ROW 4 verschoben
2. **ROW 3 (Legal/Financing) rueckt auf zu ROW 2**
3. **ROW 4 (Tenancy/WEG) rueckt auf zu ROW 3**
4. **Neue ROW 4**: `EditableAddressBlock` (links) neben `DocumentChecklist` (rechts) — beide in einem `grid-cols-2`
5. **DocumentChecklist**: Von `lg:col-span-2` auf normale halbe Breite aendern (den umgebenden 3-Spalten-Grid entfernen)
6. Den bedingten Hinweis zu mehreren Mietvertraegen (bisher in ROW 5) als kleine Inline-Notiz in die TenancySummaryBlock-Kachel verschieben oder entfernen

Keine Aenderungen an den Komponenten selbst — nur die Anordnung in der View-Datei wird umgestellt.

| Datei | Aenderung |
|-------|-----------|
| `EditableUnitDossierView.tsx` | Grid-Reihenfolge umstellen: 4x2 statt gemischte Breiten |

