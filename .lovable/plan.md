

# Tabellen-Standard und Input-Homogenitaet

## Problem 1: Doppelzeile in der Portfolio-Tabelle

Die Spalte "Objekt" rendert Strasse und Stadt uebereinander in einer Zelle (via `PropertyAddressCell`). Die Stadt steht in kleiner Schrift unter der Strasse — das verhindert Sortierbarkeit und ist schwer lesbar.

**Loesung**: Stadt ("Ort") wird als eigene Spalte neben "Objekt" eingefuegt. Die `PropertyAddressCell`-Nutzung in der Objekt-Spalte entfaellt zugunsten eines einfachen `row.address`-Texts. Neue Spalte "Ort" zeigt `row.city`.

**Datei**: `src/pages/portal/immobilien/PortfolioTab.tsx` (Zeilen 557-562)

Vorher:
```
{ key: 'address', header: 'Objekt', render: (_, row) => <PropertyAddressCell address={row.address} subtitle={row.city} /> }
```

Nachher:
```
{ key: 'address', header: 'Objekt', render: (value) => value || '–' },
{ key: 'city', header: 'Ort', render: (value) => value || '–' },
```

---

## Problem 2: Input-Hoehe vs. Button-Hoehe

Das globale `Input`-Element hat `h-8` (32px), waehrend der Standard-Button `h-10` (40px) hat. Das fuehrt zu ungleichen Zeilen, besonders sichtbar bei "Mehr Optionen" neben den Eingabefeldern in der Investment-Suche.

**Loesung**: Input-Hoehe von `h-8` auf `h-10` erhoehen, damit Inputs und Buttons exakt gleich hoch sind.

**Datei**: `src/components/ui/input.tsx`

Vorher: `"flex h-8 w-full rounded-md ..."`
Nachher: `"flex h-10 w-full rounded-md ..."`

---

## Problem 3: Tabellen-Schriftgroesse global erhoehen

Aktuell nutzen `TableCell` und `TableHead` kleine Schriftgroessen. Fuer ganztaegiges Arbeiten muessen die Zellen groesser sein.

**Aenderungen**:

| Komponente | Datei | Vorher | Nachher |
|---|---|---|---|
| Table (Basis) | `src/components/ui/table.tsx` | `text-sm` | `text-base` |
| TableCell | `src/components/ui/table.tsx` | `p-4` (unveraendert) | `p-4` (bleibt) |
| PropertyCodeCell | `src/components/shared/PropertyTable.tsx` | `font-mono text-xs` | `font-mono text-sm` |
| Einheit-Spalte | `PortfolioTab.tsx` | `text-xs text-muted-foreground` | `text-sm text-muted-foreground` |
| Art-Badge | `PortfolioTab.tsx` | `Badge ... text-xs` | `Badge ... text-sm` |

---

## Problem 4: Redundante Spalte "Tilgung p.a." entfernen

Die Tabelle hat 12 Spalten, was horizontal eng wird. "Tilgung p.a." ist rechnerisch (Annuitaet - Zins) und daher ableitbar. Diese Spalte wird entfernt, um Platz fuer die neue "Ort"-Spalte zu schaffen.

---

## Zusammenfassung der Dateien

| Datei | Aenderung |
|---|---|
| `src/components/ui/input.tsx` | Hoehe `h-8` auf `h-10` |
| `src/components/ui/table.tsx` | Basis-Schrift `text-sm` auf `text-base` |
| `src/components/shared/PropertyTable.tsx` | `PropertyCodeCell` Schrift `text-xs` auf `text-sm` |
| `src/pages/portal/immobilien/PortfolioTab.tsx` | Objekt/Ort trennen, Tilgung entfernen, Schriftgroessen in Zellen erhoehen |

Keine Logik- oder DB-Aenderungen. Rein visuell.

