
# Umbau ProjectOverviewCard: Bilder oben, Facts + Text unten

## Aktuelles Layout

```text
+-------------------------------+------------------------------------------+
| Bild-Carousel (2/5)           | Headline + Preis                         |
|                               | Beschreibungstext (3 Absaetze)           |
| [Bild-Platzhalter]            | Facts-Grid (6 Items, 3 Spalten)          |
|                               |                                          |
| <- Nav-Dots ->                |                                          |
+-------------------------------+------------------------------------------+
```

Bild links, alles andere rechts — der Text wird gequetscht.

## Neues Layout

```text
+===========================================================+
| Headline: Residenz am Stadtpark           7.200.000 EUR   |
| Musterstr. 12, 80331 Muenchen          Gesamtverkaufspreis|
+-----------------------------------------------------------+
| [Bild 1]     [Bild 2]     [Bild 3]     [Bild 4]          |
|  160px hoch, grid-cols-4, abgerundet, bg-muted            |
+-----------------------------------------------------------+
| Facts (links, schmal)    | Beschreibungstext (rechts)     |
| +---------------------+ | +-----------------------------+|
| | 24 WE               | | | Die Residenz am Stadtpark   ||
| | 24 TG               | | | bietet exklusives Wohnen... ||
| | ca. 1.540 m²        | | |                             ||
| | Bj. 1998 / San. 2021| | | Die Ausstattung umfasst...  ||
| | Zentralheizung Gas  | | |                             ||
| | Energieklasse B     | | | Das Gesamtkonzept richtet...||
| +---------------------+ | +-----------------------------+|
+-----------------------------------------------------------+
```

## Aenderungen

**Datei:** `src/components/projekte/ProjectOverviewCard.tsx`

### Struktur (von oben nach unten):

1. **Headline-Zeile** — bleibt wie bisher (Titel + Adresse links, Preis rechts)

2. **Bildergalerie** — Umbau von vertikalem Carousel zu **4 horizontale Thumbnails**
   - `grid grid-cols-4 gap-2`
   - Jedes Bild: `aspect-[4/3]` oder feste Hoehe ~160px, `rounded-lg`, `bg-muted/30`
   - Im Demo-Modus: Platzhalter-Icons (Building2) in jedem Feld
   - Carousel-Navigation (Dots, Pfeile) entfaellt komplett

3. **Facts + Beschreibung** — neuer 2-Spalten-Split
   - `grid grid-cols-1 md:grid-cols-3 gap-6`
   - **Linke Spalte (1/3):** Key-Facts als vertikale Liste (Icon + Label + Wert), wie bisher aber vertikal statt Grid
   - **Rechte Spalte (2/3):** Beschreibungstext-Absaetze

### Was entfaellt:
- Carousel-State (`activeImage`), Prev/Next-Buttons, Dots
- Das bisherige `grid-cols-5`-Haupt-Layout (Bild links / Rest rechts)

## Betroffene Dateien

| Aktion | Datei |
|--------|-------|
| Aendern | `src/components/projekte/ProjectOverviewCard.tsx` |

## Risiko

Sehr niedrig. Reine Layout-Aenderung innerhalb einer Datei, keine Logik betroffen.
