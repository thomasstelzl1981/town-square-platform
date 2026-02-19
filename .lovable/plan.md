

# Lead Manager — Post-Format und Kampagnen-Flow korrigieren

## Problem 1: Bildformate stimmen nicht

Die aktuellen Template-Karten haben eine feste Hoehe von `h-[250px]` — das entspricht keinem Social-Media-Format. Instagram und Facebook Feed-Posts verwenden standardmaessig:

- **Feed-Post (vertikal):** 1080 x 1350 px = Seitenverhaeltnis **4:5**
- **Feed-Post (quadratisch):** 1080 x 1080 px = Seitenverhaeltnis **1:1**
- **Story / Reel:** 1080 x 1920 px = Seitenverhaeltnis **9:16**

Die Template-Karten muessen das 4:5-Format (Standard fuer Instagram/Facebook Ads) verwenden, damit sie wie echte Posts aussehen.

## Problem 2: "Neue Kampagne"-Button

Der blaue Button oben rechts togglet eine versteckte Sektion. Das ist nicht intuitiv. Der Kampagnen-Erstellungsbereich wird stattdessen immer sichtbar inline angezeigt (unterhalb der bestehenden Kampagnen). Der Button wird entfernt.

## Aenderungen

### 1. `TemplateCard.tsx` — Social-Media-Format

**Editier-Modus (Brand-Seiten):**
- Gradient-Header: `h-[250px]` wird zu `aspect-[4/5]` (ergibt ca. 400px bei typischer Kartenbreite)
- Der Bildbereich bekommt das korrekte Seitenverhaeltnis eines echten Instagram-Posts
- Upload-Bereich passt sich dem Format an
- Text-Overlay-Bereich unten im Bild (wie bei echten Posts)

**Auswahl-Modus (Kampagnen-Seite):**
- `h-[120px]` wird zu `aspect-[4/5]` (kleinere Version, aber gleiches Verhaeltnis)
- Sieht aus wie eine Miniatur-Vorschau eines echten Posts

### 2. `LeadManagerKampagnen.tsx` — Kampagnen-Flow

- "Neue Kampagne"-Button entfernen
- Kampagnen-Erstellungsbereich ist immer sichtbar (nicht hinter Toggle versteckt)
- Template-Auswahl-Grid: `grid-cols-4` wird zu `grid-cols-2 md:grid-cols-3` damit die 4:5-Karten genug Platz haben

### 3. `LeadManagerBrand.tsx` — Kein Code-Aenderung noetig

Die Brand-Seiten verwenden bereits das 2-Spalten-Grid. Durch die Aenderung in TemplateCard von `h-[250px]` zu `aspect-[4/5]` werden die Karten automatisch groesser und sehen wie echte Posts aus.

## Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/lead-manager/TemplateCard.tsx` | Zeile 87: `h-[250px]` → `aspect-[4/5]`; Zeile 69: `h-[120px]` → `aspect-[4/5]` |
| `src/pages/portal/lead-manager/LeadManagerKampagnen.tsx` | Button "Neue Kampagne" entfernen, `showCreator`-Toggle entfernen, Erstellungsbereich immer sichtbar, Template-Grid anpassen |

