

# "Lennox Style" — Eigener Produktshop mit 12 Artikeln

## Uebersicht

Das dritte Widget "Zooplus" wird umbenannt zu **"Lennox Style"** und erhaelt einen vollwertigen Marken-Shop mit 12 eigenen Produkten. Das hochgeladene Bild (4x3 Grid) wird als einzelnes Produktbild in den `src/assets/` Ordner kopiert und den 12 Artikeln zugeordnet.

## Bild-Handling

Das hochgeladene Bild enthaelt ein 4x3 Grid aller 12 Produkte. Da ein browserseitiges Zuschneiden in einzelne Bilder nicht praktikabel ist, wird das Gesamtbild als einzelnes Asset gespeichert und per CSS `object-position` + `object-fit: cover` wird jeweils der passende Bildausschnitt fuer jede Produktkarte angezeigt. So entsteht visuell der Eindruck von 12 Einzelbildern ohne manuelles Zuschneiden.

**Zuordnung (Reihe x Spalte → Produkt):**

| Position | Produkt | Preis |
|---|---|---|
| R1-C1 | Premium Leather Leash | 39,90 EUR |
| R1-C2 | Adjustable Harness Pro | 49,90 EUR |
| R1-C3 | Orthopedic Dog Bed (rot, gerollt) | 59,90 EUR |
| R1-C4 | Treat Pouch Elite | 29,90 EUR |
| R2-C1 | Interactive Chew Toy (Ball) | 24,90 EUR |
| R2-C2 | Interactive Chew Toy (Rope) | 24,90 EUR |
| R2-C3 | Training Clicker Pro (Puzzle) | 9,90 EUR |
| R2-C4 | Travel Water Bottle (blau) | 19,90 EUR |
| R3-C1 | Orthopedic Dog Bed | 89,90 EUR |
| R3-C2 | Travel Water Bottle | 19,90 EUR |
| R3-C3 | Grooming Brush Set | 34,90 EUR |
| R3-C4 | Reflective Night Collar | 22,90 EUR |

*Hinweis: Die visuelle Zuordnung der Bilder zu den Produkten wird nach bestem Matching vorgenommen. Falls einzelne Zuordnungen nicht passen, koennen sie nachtraeglich angepasst werden.*

## Aenderungen in `PetsShop.tsx`

### 1. Widget-Definition aendern (Zeile 91)

```
{ key: 'zooplus', title: 'Lennox Style', icon: PawPrint, description: 'Premium Hundezubehoer — eigene Kollektion' }
```

Das `badge: 'Partner'` wird entfernt — es ist ein eigenes Label, kein Partner.

### 2. Produktdaten als Konstante

Ein neues Array `LENNOX_STYLE_PRODUCTS` mit 12 Eintraegen, jeder mit:
- `name` (Produktname)
- `description` (Kurzbeschreibung)
- `price` (formatierter Preis)
- `gridRow` / `gridCol` (Position im Quellbild fuer CSS-Crop)

### 3. Zooplus-Block ersetzen (Zeilen 417-430)

Der minimale Zooplus-Platzhalter wird durch ein vollwertiges Shop-Layout ersetzt:

**a) Header-Banner**
- Gradient: `from-emerald-500/20 to-emerald-600/5`
- Titel: "LENNOX Style"
- Tagline: "Premium Hundezubehoer — Designed for Dogs"

**b) Kategorie-Badges**
- Kategorien: Alle, Leinen & Geschirr, Betten & Decken, Spielzeug, Unterwegs, Pflege, Training

**c) Produkt-Grid** (4 Spalten Desktop, 2 Mobile)
- 12 Produktkarten mit Bildausschnitt aus dem Gesamtbild
- Name (line-clamp-2), Beschreibung (line-clamp-1), Preis in Emerald-Akzent
- Hover-Effekt wie bei Lakefields

**d) Integration-Accordion** (wie bei den anderen Widgets)

### 4. Asset kopieren

Das Bild `user-uploads://ChatGPT_Image_16._Feb._2026_21_51_17.png` wird nach `src/assets/lennox-style-products.png` kopiert.

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/assets/lennox-style-products.png` | Neues Asset (Kopie des Uploads) |
| `src/pages/portal/pets/PetsShop.tsx` | Widget umbenennen, Zooplus-Block durch Lennox Style Shop ersetzen |

Keine DB-Migration noetig.

