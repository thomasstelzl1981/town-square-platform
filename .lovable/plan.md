

# MobileBottomBar modernisieren — Area-Buttons entfernen, Lovable-Style

## Problem

1. Die runden Area-Buttons (Home, Client, Service, Base) sind noch sichtbar — laut Spezifikation sollen sie entfernt sein
2. Der Switch und die Chat-Eingabe wirken nicht modern genug — sollen wie bei Lovable aussehen

## Loesung

### 1. Area-Buttons komplett entfernen

Der gesamte Block mit den 5 runden NavButtons (Home + 4 Areas) wird aus `MobileBottomBar.tsx` entfernt. Die `NavButton`-Komponente und die `areaIcons`-Map werden ebenfalls geloescht, da sie nicht mehr gebraucht werden.

### 2. Switch im Lovable-Style

Der Module/Chat-Toggle wird ueberarbeitet:
- Groessere Touch-Targets (py-2 statt py-1.5)
- Subtilerer Hintergrund, sauberere Konturen
- Sanftere Farben: aktiver Tab mit `bg-background` und leichtem Schatten statt `bg-primary`
- Aehnlich dem "Chat | Preview"-Toggle von Lovable (neutral, nicht blau-leuchtend)

### 3. Chat-Eingabe im Lovable-Style

Die Eingabeleiste wird schlanker und moderner:
- Weniger Padding, sauberer Radius
- Hintergrund: `bg-muted/40` mit feinerem Border
- Send-Button: kleiner, subtiler
- Insgesamt kompakterer Look

### Ergebnis

```text
+----------------------------------+
| SystemBar                        |
+----------------------------------+
|                                  |
| [Modul-Liste / Chat-View]       |
|                                  |
+----------------------------------+
|   [ Module | Chat ]              |
| [Mic] [+] [Eingabe...]  [Send]  |
+----------------------------------+
```

Keine Area-Buttons mehr. Nur der Toggle und die Eingabe, kompakt und modern.

## Betroffene Datei

- `src/components/portal/MobileBottomBar.tsx` — Area-Buttons entfernen, Switch + Input redesign

