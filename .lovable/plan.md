

## Plan: Gründer-Seite personalisieren — Thomas Stelzl mit Porträtfoto

### Was wird gemacht

Die Seite `NcoreGruender.tsx` wird personalisiert: Der bisher anonyme "Gründer"-Text wird auf **Thomas Stelzl** zugeschnitten und das hochgeladene Porträtfoto prominent eingebaut.

### Änderungen

**1. Bild kopieren**
- Das hochgeladene Foto wird nach `src/assets/ncore/thomas-stelzl-portrait.jpg` kopiert (das vorhandene `thomas-stelzl.jpg` bleibt als Backup).

**2. Hero-Bereich umgestalten** (`NcoreGruender.tsx`)

Aktuell: Links Text (anonym, kein Name), rechts kleines Beratungsfoto + Philosophie-Box.

**Neu — Premium-Portrait-Layout:**
- **Links**: Großes, rundes oder abgerundetes Porträtfoto von Thomas Stelzl (ca. 320×400px) mit dezentem Emerald-Glow-Schatten
- **Rechts**: Personalisierter Text mit Name
  - Überschrift: `Thomas Stelzl` statt "Der Gründer"
  - Subtitle-Badge bleibt: "Über den Gründer"
  - Text wird umformuliert auf 1. Person / persönlich:
    - Absatz 1: Wer er ist, warum er Ncore gegründet hat (operative Erfahrung Finanzbranche + KMU)
    - Absatz 2: Was ihn antreibt (Digitalisierung + KI erschwinglich für den Mittelstand)
    - Absatz 3: Philosophie ("Connecting Dots. Connecting People.")
  - Die Philosophie-Blockquote bleibt, wird aber als Zitat mit `— Thomas Stelzl` signiert

**3. Kein struktureller Umbau**
- Expertise-Grid, Kernwerte-Section und CTA bleiben unverändert
- Nur die Hero-Section wird angepasst
- SEO-Description wird auf "Thomas Stelzl" aktualisiert

### Visuelles Konzept

```text
┌─────────────────────────────────────────────────┐
│  [Badge: Über den Gründer]                      │
│                                                 │
│  ┌──────────┐   Thomas Stelzl                   │
│  │          │   ─────────────                   │
│  │  Portrait│   Gründer & Geschäftsführer       │
│  │  Foto    │                                   │
│  │  320x400 │   Persönlicher Text...            │
│  │  rounded │   ...warum Ncore entstand          │
│  │  emerald │   ...was ihn antreibt              │
│  │  glow    │                                   │
│  └──────────┘   ┌─ Philosophie-Quote ──────┐    │
│                 │ „Viele Berater..."        │    │
│                 │         — Thomas Stelzl   │    │
│                 └──────────────────────────-┘    │
└─────────────────────────────────────────────────┘
```

### Dateien
| Datei | Aktion |
|-------|--------|
| `src/assets/ncore/thomas-stelzl-portrait.jpg` | Neues Bild kopieren |
| `src/pages/zone3/ncore/NcoreGruender.tsx` | Hero-Section umbauen |

