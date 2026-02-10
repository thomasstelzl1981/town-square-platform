

# Redesign Objektbeschreibung: Neues 2-Spalten-Layout

## Aktuelles Layout

```text
┌──────────────────────────────────────────────────┐
│  Headline + Adresse                 Gesamtpreis  │
├──────────────────────────────────────────────────┤
│  [Bild1] [Bild2] [Bild3] [Bild4]  (4er Grid)    │
├──────────────────────────────────────────────────┤
│  Key Facts (Liste)  │  Beschreibung (2 Spalten)  │
└──────────────────────────────────────────────────┘
```

## Neues Layout

```text
┌──────────────────────────────────────────────────┐
│  Headline + Adresse                 Gesamtpreis  │
├──────────────────────┬───────────────────────────┤
│  [  Slideshow-Bild ] │                           │
│  [  < Bild  1/4  > ] │   Beschreibungstext...    │
│    ● ○ ○ ○           │   ...                     │
│ ─────────────────────│   ...                     │
│  WE: 24  │ Stellpl   │   ...                     │
│  Flaeche │ Baujahr   │   ...                     │
│  Heizart │ Energie   │   ...                     │
└──────────────────────┴───────────────────────────┘
```

Die linke Spalte enthaelt die Bildergalerie (Slideshow mit Pfeilen und Dot-Indikatoren) und darunter die 6 Key Facts als 2x3 Grid. Die rechte Spalte zeigt die Beschreibung ueber die gesamte Hoehe der Kachel.

## Aenderungen

### ProjectOverviewCard.tsx

- Headline-Zeile bleibt unveraendert (volle Breite oben)
- Darunter ein 2-Spalten-Grid (`md:grid-cols-5`, links 2 Spalten, rechts 3 Spalten)
- **Linke Spalte:**
  - Bildergalerie mit `useState` fuer `activeIndex`
  - Vor/Zurueck-Pfeile (ChevronLeft/ChevronRight) als halbtransparente Buttons
  - Punkt-Indikatoren unter dem Bild
  - Darunter die 6 Key Facts als `grid-cols-2 grid-rows-3` (kompakt, 2 nebeneinander)
- **Rechte Spalte:**
  - Beschreibungstexte, vertikal angeordnet, ueber die gesamte Hoehe
- Vier Platzhalter-Bilder mit farbigen Gradienten und Labels (Aussen, Wohnzimmer, Kueche, Bad), definiert als Array `DEMO_PROJECT_IMAGES` in `demoProjectData.ts`

### demoProjectData.ts

- Neues exportiertes Array `DEMO_PROJECT_IMAGES` mit vier Eintraegen:
  ```text
  { label: 'Aussenansicht', gradient: 'from-emerald-800 to-emerald-600' }
  { label: 'Wohnzimmer',    gradient: 'from-amber-700 to-amber-500' }
  { label: 'Kueche',        gradient: 'from-slate-700 to-slate-500' }
  { label: 'Badezimmer',    gradient: 'from-sky-800 to-sky-600' }
  ```

### areaConfig.ts

- Operations-Modul-Reihenfolge auf `['MOD-09', 'MOD-13', 'MOD-10', 'MOD-11', 'MOD-12']` aendern (Vertriebspartner, Projekte, Leads, Finanzierungs-Manager, AkquiseManager)

## Betroffene Dateien

| Aktion | Datei |
|--------|-------|
| Aendern | `src/components/projekte/ProjectOverviewCard.tsx` |
| Aendern | `src/components/projekte/demoProjectData.ts` |
| Aendern | `src/manifests/areaConfig.ts` |

## Risiko

Niedrig. Rein visuelle Aenderungen ohne Auswirkung auf Berechnungslogik.

