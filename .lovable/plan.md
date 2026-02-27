

## Zielbild: Projekt-Landing-Page — Foto-Galerie + Tabellen-Ansicht

### Wireframe

```text
┌─────────────────────────────────────────────────┐
│                                                 │
│              HERO IMAGE (400px)                 │
│         Headline + Standort-Overlay             │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │              │  │ OBJEKTBESCHREIBUNG        │ │
│  │  FOTO-       │  │ (about_text, max 4-5     │ │
│  │  CAROUSEL    │  │  Zeilen, kompakt)         │ │
│  │  ◄ 1/4 ►    │  │                           │ │
│  │  (exterior,  │  │  Key Facts Zeile:         │ │
│  │   interior,  │  │  24 Einh · 850m² · 2019  │ │
│  │   surround.) │  │                           │ │
│  └──────────────┘  └──────────────────────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│  INVESTMENT-RECHNER (Eingabefelder)             │
│  [zvE] [EK] [Familienstand] [KiSt] [Berechnen] │
├─────────────────────────────────────────────────┤
│                                                 │
│  EINHEITEN-TABELLE (Zeilenansicht)              │
│  ┌─────┬────┬──────┬────────┬──────┬──────────┐ │
│  │WE-Nr│ Zi │Fläche│Kaufprs │Miete │Belastung │ │
│  ├─────┼────┼──────┼────────┼──────┼──────────┤ │
│  │WE-01│2.5 │ 62m² │185.000 │ 850  │  -42 €   │ │
│  │WE-02│3.0 │ 85m² │210.000 │1.250 │  -38 €   │ │
│  │WE-03│2.0 │ 48m² │165.000 │ 600  │  -55 €   │ │
│  ├─────┼────┼──────┼────────┼──────┼──────────┤ │
│  │Summe│ 3  │195m² │560.000 │  Ø   │  Ø -45 € │ │
│  └─────┴────┴──────┴────────┴──────┴──────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│  FOOTER                                         │
└─────────────────────────────────────────────────┘
```

### Aenderungen

**1. LandingPageTab.tsx — iframe durch "Vorschau oeffnen" Button ersetzen**
- Gesamten Browser-Chrome-Block + iframe entfernen (Zeilen 451-487)
- postMessage-Listener und dynamische Hoehen-Logik entfernen
- Stattdessen: Prominenter Button "Vorschau im Browser oeffnen" mit `window.open(previewUrl, '_blank')`
- Editor-Bereich (Textfelder, KI-Button, Publish) bleibt unveraendert

**2. ProjectLandingHome.tsx — Foto-Galerie + Objektbeschreibung + Tabellenansicht**
- Nach Hero: Zweispaltiges Layout (md:grid-cols-2)
  - Links: Foto-Carousel mit allen Projekt-Bildern (exterior, interior, surroundings) — Navigation-Pfeile + Counter
  - Rechts: Kompakte Objektbeschreibung (about_text, max 4-5 Zeilen) + Key Facts als Inline-Badges
- Key-Facts-Sektion (separate 4er-Grid) entfernen — Facts wandern in den rechten Textbereich
- Einheiten-Grid (Cards) ersetzen durch **Tabellenansicht** (gleiche Struktur wie `InvestPreislisteTable`)
  - Spalten: WE-Nr, Zi, Etage, Flaeche, Kaufpreis, Miete, Bruttorendite, Steuereffekt, Monatsbelastung, Status
  - Zeile klickbar → Link zur Einheit-Detailseite
  - Summenzeile unten
- `loadProjectImages` anpassen: Alle Slots laden (nicht nur hero), alle Bilder pro Slot (fuer Carousel)

**3. ProjectLandingLayout.tsx — postMessage-Cleanup**
- Den `useEffect` mit `setInterval` + `postMessage` entfernen

### Betroffene Dateien

| Datei | Aenderung |
|-------|----------|
| `src/pages/portal/projekte/LandingPageTab.tsx` | iframe + Chrome entfernen, "Vorschau oeffnen" Button |
| `src/pages/zone3/project-landing/ProjectLandingHome.tsx` | Foto-Carousel + Beschreibung, Tabelle statt Cards |
| `src/pages/zone3/project-landing/ProjectLandingLayout.tsx` | postMessage entfernen |

