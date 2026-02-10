
# Kalkulator neben Globalobjekt-Beschreibung verschieben

## Aktuelles Layout

```text
+----------------------------------------------------------+
| Header + Projekt-Switcher                                |
+----------------------------------------------------------+
| ProjectOverviewCard (volle Breite)                       |
+----------------------------------------------------------+
| Preisliste (flex-1)           | Kalkulator (280px sticky) |
+----------------------------------------------------------+
| DMS Widget                                               |
+----------------------------------------------------------+
```

Der Kalkulator sitzt rechts neben der Preisliste als sticky Sidebar. Das soll sich aendern.

## Neues Layout

```text
+----------------------------------------------------------+
| Header + Projekt-Switcher                                |
+----------------------------------------------------------+
| ProjectOverviewCard (3/5)     | Kalkulator (2/5)         |
| Bild + Beschreibung + Facts  | Slider + KPIs + Bar      |
+----------------------------------------------------------+
| Preisliste (volle Breite)                                |
+----------------------------------------------------------+
| DMS Widget                                               |
+----------------------------------------------------------+
```

Der Kalkulator wird **neben** die Globalobjekt-Karte gesetzt -- beide auf gleicher Hoehe, gleiche Card-Hoehe. Die Preisliste darunter bekommt die volle Breite.

## Aenderungen

**Datei:** `src/pages/portal/projekte/PortfolioTab.tsx`

1. **ProjectOverviewCard und StickyCalculatorPanel in ein gemeinsames Grid packen:**
   - `grid grid-cols-1 lg:grid-cols-5 gap-6`
   - ProjectOverviewCard bekommt `lg:col-span-3`
   - StickyCalculatorPanel bekommt `lg:col-span-2`
   - Das `sticky top-24` aus dem Calculator entfernen (nicht mehr noetig)

2. **Preisliste-Bereich vereinfachen:**
   - Der `flex gap-6` Wrapper mit der rechten 280px-Sidebar entfaellt
   - `UnitPreislisteTable` bekommt die volle Breite ohne Sidebar-Companion

**Datei:** `src/components/projekte/StickyCalculatorPanel.tsx`

3. **Sticky entfernen:**
   - `sticky top-24` aus der Card-Klasse entfernen
   - Optional: `h-full` hinzufuegen, damit die Karte sich an die Hoehe der ProjectOverviewCard anpasst

## Betroffene Dateien

| Aktion | Datei |
|--------|-------|
| Aendern | `src/pages/portal/projekte/PortfolioTab.tsx` |
| Aendern | `src/components/projekte/StickyCalculatorPanel.tsx` |

## Risiko

Sehr niedrig. Reine Layout-Verschiebung, keine Logik-Aenderung.
