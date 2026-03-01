

## Analyse

Die 4 Brand-Widgets (`BrandLinkWidget.tsx`) haben folgende Probleme:
1. **Text abgeschnitten**: `line-clamp-2` + `max-w-[180px]` schneidet die Beschreibungen ab
2. **Generische Icons**: ShoppingBag, Landmark, Building2, Search -- passen nicht zu den Marken
3. **Farblich monoton**: Kaufy und Acquiary sind fast identisch (blau), SoT ist grau/langweilig
4. **Layout**: Zentriert + viel verschwendeter Platz im aspect-square Format

## Redesign-Konzept

Statt zentriertem Icon+Text ein **vertikales Split-Layout** im Dark-Theme-Stil:

```text
┌──────────────────┐
│  ╭──╮            │  ← Brand-Icon oben links, klein
│  │🏘│  KAUFY     │  ← Name + Tagline rechts daneben
│  ╰──╯  Marktplatz│
│                  │
│  Immobilien      │  ← Voller Text, kein Clamp
│  kaufen,         │
│  verkaufen und   │
│  als Kapitalanlage│
│  entdecken.      │
│                  │
│  ─────────────── │  ← Dezenter Separator
│  kaufy.immo  →   │  ← Domain + Link-Icon unten
└──────────────────┘
```

### Visuelle Verbesserungen

- **Hintergrund**: `bg-card/80` (Dark-Theme-konform wie WeatherCard) statt bunte Vollflächengradients
- **Brand-Akzent**: Nur ein dezenter `inset box-shadow` Glow oben + Icon-Background in Markenfarbe
- **Icons**: Markenspezifischer:
  - KAUFY: `Store` (statt ShoppingBag)
  - FutureRoom: `TrendingUp` (statt Landmark)
  - SoT: `Cpu` (statt Building2) -- Tech/KI-Plattform
  - ACQUIARY: `Radar` (statt Search) -- Sourcing/Scanning
- **Text**: Kein `line-clamp`, kein `max-w`, volle Breite nutzen, `text-sm` statt `text-xs`
- **Domain-Link**: Unten als Footer mit der echten Domain (z.B. "kaufy.immo")

### Dateien

| Datei | Aktion |
|-------|--------|
| `src/components/dashboard/widgets/BrandLinkWidget.tsx` | Komplett redesignen (ist die Widget-Grid-Version) |
| `src/components/dashboard/BrandWidgets.tsx` | Pruefen ob noch genutzt -- falls ja, gleichen Stil anpassen |

### Freeze-Check
- MOD-00 ist bereits **unfrozen** (gerade erst entfrostet fuer WeatherCard)
- Beide Dateien liegen in `src/components/dashboard/` = MOD-00 -- OK

