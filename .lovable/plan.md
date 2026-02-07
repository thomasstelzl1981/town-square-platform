

# Erweiterter Plan: Portfolio-Ansicht UI-Bereinigung

## Zusammenfassung der Probleme

### Problem 1: Graue Punkte in den KPI-Kacheln
**Ursache in `stat-card.tsx` Zeile 49-51:**
```tsx
{Icon && <div className={cn("flex items-center justify-center rounded-lg bg-primary/10", ...)}>
    
</div>}
```
Der Container für das Icon wird gerendert (grauer/halbtransparenter Hintergrund), aber **das Icon selbst wurde nie eingefügt**! Der `<Icon />` JSX-Tag fehlt komplett im Container.

### Problem 2: "1 Objekte" Text entfernen
In Zeile 652 der `PortfolioTab.tsx`:
```tsx
subtitle={hasData ? `${totals?.propertyCount} Objekte` : undefined}
```
Dieser Subtitle soll entfernt werden.

### Problem 3: Fehlender Abstand unter Menüleiste
Der Container beginnt ohne padding-top, daher klebt alles direkt an der Navigation.

### Problem 4: Build-Fehler `{trend}` als ReactNode
In Zeile 41 der `stat-card.tsx` wird das `trend`-Objekt direkt als JSX-Child gerendert – das funktioniert nicht, da es ein Objekt ist.

### Problem 5: Großer Leerraum in der Vermögensentwicklung-Kachel
**Ursache in `chart-card.tsx`:**
```tsx
<div className={cn(aspectClasses[aspectRatio], "relative")}>  // aspect-video = 16:9
```
Die ChartCard verwendet standardmäßig `aspect-video` (16:9 Verhältnis), aber der Chart selbst hat nur `height={280}`. Das führt zu einem großen leeren Bereich unter dem Chart.

**Die Lösung:** Für die Portfolio-Ansicht soll kein festes Aspekt-Verhältnis verwendet werden. Stattdessen soll sich die Karte an den Inhalt anpassen.

---

## Lösungsplan

### Fix 1: Icons in StatCard korrekt rendern (graue Punkte → echte Icons)

**Datei:** `src/components/ui/stat-card.tsx`

**Zeilen 49-51 — VORHER:**
```tsx
{Icon && <div className={cn("flex items-center justify-center rounded-lg bg-primary/10", isCompact ? "h-8 w-8" : "h-10 w-10")}>
    
</div>}
```

**NACHHER:**
```tsx
{Icon && <div className={cn("flex items-center justify-center rounded-lg bg-primary/10", isCompact ? "h-8 w-8" : "h-10 w-10")}>
    <Icon className={cn("text-primary", isCompact ? "h-4 w-4" : "h-5 w-5")} />
</div>}
```

### Fix 2: Trend-Objekt korrekt als JSX rendern

**Datei:** `src/components/ui/stat-card.tsx`

**Zeilen 40-45 — VORHER:**
```tsx
<div className="flex items-center gap-2 mt-1">
  {trend}
  {subtitle && ...}
</div>
```

**NACHHER:**
```tsx
<div className="flex items-center gap-2 mt-1">
  {trend && (
    <span className={cn(
      "flex items-center text-xs font-medium",
      trend.direction === "up" ? "text-green-600" : "text-red-600"
    )}>
      {trend.direction === "up" ? (
        <TrendingUp className="h-3 w-3 mr-0.5" />
      ) : (
        <TrendingDown className="h-3 w-3 mr-0.5" />
      )}
      {trend.value}%
    </span>
  )}
  {subtitle && ...}
</div>
```

### Fix 3: ChartCard mit optionalem Aspekt-Verhältnis

**Datei:** `src/components/ui/chart-card.tsx`

Das `aspectRatio`-Prop soll optional sein. Wenn nicht gesetzt oder `"none"`, soll kein festes Verhältnis angewendet werden:

**Zeilen 10, 14-19 — Erweitern:**
```tsx
aspectRatio?: "square" | "video" | "wide" | "none";

const aspectClasses = {
  square: "aspect-square",
  video: "aspect-video",
  wide: "aspect-[21/9]",
  none: "", // Kein festes Verhältnis
};
```

### Fix 4: Portfolio-Tab ChartCard ohne aspect-ratio

**Datei:** `src/pages/portal/immobilien/PortfolioTab.tsx`

**Zeile 679:**
```tsx
// VORHER:
<ChartCard title="Vermögensentwicklung (30 Jahre)">

// NACHHER:
<ChartCard title="Vermögensentwicklung (30 Jahre)" aspectRatio="none">
```

### Fix 5: "1 Objekte" Subtitle entfernen

**Datei:** `src/pages/portal/immobilien/PortfolioTab.tsx`

**Zeile 652 entfernen:**
```tsx
// VORHER:
<StatCard
  title="Einheiten"
  value={...}
  icon={Building2}
  subtitle={hasData ? `${totals?.propertyCount} Objekte` : undefined}
/>

// NACHHER:
<StatCard
  title="Einheiten"
  value={...}
  icon={Building2}
/>
```

### Fix 6: Abstand unter Menüleiste

**Datei:** `src/pages/portal/immobilien/PortfolioTab.tsx`

**Zeile 603 (oder Container-Start):**
```tsx
// VORHER:
<div className="space-y-6">

// NACHHER:
<div className="space-y-6 pt-6">
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/ui/stat-card.tsx` | Icon-Element einfügen, trend-Rendering korrigieren |
| `src/components/ui/chart-card.tsx` | `aspectRatio="none"` Option hinzufügen |
| `src/pages/portal/immobilien/PortfolioTab.tsx` | Subtitle entfernen, Padding-Top, ChartCard ohne aspect |

---

## Visuelles Ergebnis

**Vorher:**
```
[Navigation]
Immobilienportfolio  Alle Vermietereinheiten ▼
+------------------+  +------------------+  ...
| Einheiten    [○] |  | Verkehrswert [○] |
| 1                |  | 220.000 €        |
| 1 Objekte        |  |                  |
+------------------+  +------------------+

+----------------------------------------------------+
| VERMÖGENSENTWICKLUNG (30 JAHRE)                    |
| [Chart ~280px]                                     |
|                                                    |
|           ← großer Leerraum (aspect-video)         |
|                                                    |
+----------------------------------------------------+
```

**Nachher:**
```
[Navigation]

   ← 24px Abstand (pt-6)

Immobilienportfolio  Alle Vermietereinheiten ▼

   ← normaler space-y-6 Abstand

+------------------+  +------------------+  ...
| Einheiten   [🏢] |  | Verkehrswert [📈]|  ← echte Icons
| 1                |  | 220.000 €        |
+------------------+  +------------------+  ← kein Subtitle

+----------------------------------------------------+
| VERMÖGENSENTWICKLUNG (30 JAHRE)                    |
| [Chart ~280px]                                     |
+----------------------------------------------------+ ← Karte endet direkt nach Chart
```

---

## Zusammenfassung

1. **Graue Punkte → echte Icons**: Das `<Icon />` Element wird jetzt tatsächlich gerendert
2. **Kein "1 Objekte"**: Subtitle aus der Einheiten-StatCard entfernt
3. **Kompakte Chart-Kachel**: Kein festes 16:9 Verhältnis mehr, Höhe passt sich dem Inhalt an
4. **Mehr Luft oben**: 24px Abstand zwischen Navigation und Inhalt
5. **Build-Fehler behoben**: `trend`-Objekt wird korrekt als JSX mit Icon gerendert

