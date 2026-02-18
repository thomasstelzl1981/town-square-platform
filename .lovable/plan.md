

## Hero-Hoehen Korrektur: Alle 4 Ansichten auf 85vh

### Ist-Zustand (das Problem)

| Ansicht | Datei | Aktuelle Hoehe |
|---------|-------|---------------|
| Startseite (initial) | `LennoxStartseite.tsx` | **85vh** (korrekt) |
| Startseite (nach Suche) | `LennoxStartseite.tsx` | 45vh (zu klein) |
| Shop | `LennoxShop.tsx` | 45vh (zu klein) |
| Partner werden | `LennoxPartnerWerden.tsx` | 45vh (zu klein) |

### Soll-Zustand

Alle vier Ansichten bekommen **85vh** -- gleiche Hoehe wie die Startseite beim ersten Laden. Der Hund und die Bilder werden vollstaendig sichtbar, kein Abschneiden mehr.

### Technische Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `LennoxStartseite.tsx` (Zeile 77+83) | Ternary `hasSearched ? '45vh' : '85vh'` wird zu festem `'85vh'` (beide Stellen) |
| `LennoxShop.tsx` (Zeile 131+136) | `'45vh'` wird zu `'85vh'` (beide Stellen) |
| `LennoxPartnerWerden.tsx` (Zeile 95+100) | `'45vh'` wird zu `'85vh'` (beide Stellen) |

Insgesamt 6 Stellen, jeweils `minHeight` von `'45vh'` auf `'85vh'` aendern.
