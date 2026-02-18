

## Hero-Hoehen Harmonisierung -- Alle 4 Lennox-Seiten

### Problem

Drei unterschiedliche Hero-Hoehen beim Durchklicken:
- Startseite (vor Suche): **85vh** -- grosser Empfang, das ist korrekt
- Startseite (nach Suche / Partner finden): **45vh** -- kompakt
- Shop: **35vh** -- zu klein
- Partner werden: **35vh** -- zu klein

### Loesung

Die Unterseiten (Shop, Partner werden) erhalten dieselbe Hoehe wie die Startseite nach der Suche: **45vh**. So entsteht ein konsistenter Uebergang:

```text
┌─────────────────────────────────────────────┐
│ STARTSEITE (initial)                        │
│ Hero: 85vh                                  │
│ Grosser Empfang mit Suchleiste              │
│                                             │
│                                             │
│                                             │
│                                             │
│                                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ STARTSEITE (nach Suche / Partner finden)    │
│ Hero: 45vh                                  │
│ Kompakt mit Titel + Suchleiste              │
│                                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ SHOP                                        │
│ Hero: 45vh (bisher 35vh)                    │
│ "Lennox Shop" + Untertitel                  │
│                                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ PARTNER WERDEN                              │
│ Hero: 45vh (bisher 35vh)                    │
│ "Werde Partner..." + Untertitel             │
│                                             │
└─────────────────────────────────────────────┘
```

### Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `LennoxShop.tsx` | `minHeight: '35vh'` -> `'45vh'` (2 Stellen: section + inner div) |
| `LennoxPartnerWerden.tsx` | `minHeight: '35vh'` -> `'45vh'` (2 Stellen: section + inner div) |
| `LennoxStartseite.tsx` | Keine Aenderung (85vh/45vh bleibt) |

Beide Bilder behalten `object-cover object-center` fuer korrekte Bildausschnitte bei.

