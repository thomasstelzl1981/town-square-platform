
# Media-Widgets fuer MOD-08 (Suche) und MOD-09 (Beratung)

## Ziel

Direkt unter der Headline (ModulePageHeader) beider Seiten werden 4 quadratische Widgets im CI-Standard platziert. Diese dienen als hochwertige Einstiegspunkte zu Verkaufsmaterialien:

```text
+------------------------------------------+
| SUCHE / KUNDENBERATUNG (Header)          |
+------------------------------------------+
| [Verkaufs-   | [Verkaufs-  | [Verkaufs-  | [Image-     |
|  praesent.]  |  video 1]   |  video 2]   |  video]     |
|  Praesent.   |  Rendite    |  Steuer-    |  Verwaltung |
|  Icon + Glow |  Icon+Glow  |  vorteil    |  Software   |
|              |             |  Icon+Glow  |  Icon+Glow  |
+--------------+-------------+-------------+-------------+
| [Search Mode Toggle + Form]              |
| [Ergebnisse...]                          |
+------------------------------------------+
```

## Widget-Inhalte (4 Stueck)

| # | Typ | Titel | Untertitel | Icon |
|---|-----|-------|------------|------|
| 1 | Praesentation | Verkaufspraesentation | Unsere Investment-Strategie im Ueberblick | Presentation (lucide) |
| 2 | Video | Rendite erklaert | So funktioniert Ihre Kapitalanlage | Play (lucide) |
| 3 | Video | Steuervorteil | Steueroptimierung mit Immobilien | Play (lucide) |
| 4 | Video | Verwaltung | Unsere Software im Einsatz | Monitor (lucide) |

## Glow-Effekt

Die Widgets erhalten einen dezenten Glow-Effekt im CI-Stil — aehnlich dem Demo-Widget-Shimmer, aber in der primaeren Markenfarbe (primary/blue statt emerald). Umsetzung:

```text
- Hintergrund: bg-primary/5 mit border-primary/30
- Oberer Shimmer-Streifen: Gradient von primary/40 via primary/60 nach primary/40
- Hover: shadow-primary/20 shadow-lg Transition
- Icon-Box: bg-primary/10 mit primary-Icon
```

## Technische Umsetzung

### Neue Datei: `src/components/shared/MediaWidget.tsx`

Eine wiederverwendbare Komponente, die in beiden Modulen genutzt wird:

- Props: `title`, `subtitle`, `icon`, `type` ('presentation' | 'video'), `onClick?`
- Styling: `aspect-square` (CI-konform), Glow-Klassen, glasiger Hintergrund
- Das Widget ist vorerst ein visueller Platzhalter (klickbar, aber ohne hinterlegte Medien) — die tatsaechlichen Dateien (PDF, Video-URLs) koennen spaeter hinterlegt werden

### Neue Datei: `src/components/shared/MediaWidgetGrid.tsx`

Ein vorkonfiguriertes 4-Widget-Grid mit den 4 definierten Medien-Widgets. Nutzt `WidgetGrid` (variant='widget') und `WidgetCell` fuer CI-konforme Anordnung.

### Aenderung: `src/pages/portal/investments/SucheTab.tsx`

Nach `ModulePageHeader` und VOR der Search-Card wird `<MediaWidgetGrid />` eingefuegt:

```text
<PageShell>
  <ModulePageHeader title="SUCHE" ... />
  <MediaWidgetGrid />          {/* NEU */}
  <Card> {/* Search Mode Toggle */} </Card>
  ...
</PageShell>
```

### Aenderung: `src/pages/portal/vertriebspartner/BeratungTab.tsx`

Gleiche Platzierung — nach `ModulePageHeader`, vor der Search-Card:

```text
<PageShell>
  <ModulePageHeader title="KUNDENBERATUNG" ... />
  <MediaWidgetGrid />          {/* NEU */}
  <Card> {/* Search Mode Toggle */} </Card>
  ...
</PageShell>
```

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/shared/MediaWidget.tsx` | NEU — Einzelnes Media-Widget mit Glow |
| `src/components/shared/MediaWidgetGrid.tsx` | NEU — 4er-Grid mit allen Media-Widgets |
| `src/pages/portal/investments/SucheTab.tsx` | Import + Einfuegen von MediaWidgetGrid |
| `src/pages/portal/vertriebspartner/BeratungTab.tsx` | Import + Einfuegen von MediaWidgetGrid |

**Keine DB-Migration noetig.**
