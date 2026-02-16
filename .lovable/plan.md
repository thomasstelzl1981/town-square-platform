

# Fix: Hover-Luecke im Floating Module Switcher

## Problem

Der `mt-2` Abstand zwischen SubTabs und dem Floating Switcher erzeugt eine unsichtbare Luecke. Beim Bewegen der Maus von den SubTabs zum Switcher verliert der Wrapper den Hover-Zustand und der Switcher verschwindet.

```text
┌─────────────────────────────┐
│  SubTabs                    │  ← Hover-Zone ENDET hier
└─────────────────────────────┘
     ↕ 8px LUECKE (kein Hover!)  ← Maus hier = onMouseLeave!
    ╭───────────────────────╮
    │  Floating Pills       │  ← Nie erreichbar
    ╰───────────────────────╯
```

## Loesung

Den Abstand nicht als `mt-2` (Margin) auf dem Floating-Element setzen, sondern als `pb-4` (Padding) auf dem Wrapper-`div`. Padding gehoert zum Element und haelt den Hover-Zustand aufrecht. Zusaetzlich wird `pt-2` auf dem Floating-Element fuer den visuellen Abstand beibehalten.

```text
┌─────────────────────────────┐
│  SubTabs                    │
│                             │  ← pb-4 Padding = TEIL des Wrappers
│  ╭───────────────────────╮  │
│  │  Floating Pills       │  │  ← Erreichbar!
│  ╰───────────────────────╯  │
└─────────────────────────────┘
    Alles innerhalb der Hover-Zone
```

## Technische Aenderung

**Datei:** `src/components/portal/TopNavigation.tsx`

1. Wrapper-`div` (Zeile 81): `className="relative"` aendern zu `className="relative pb-4"` (nur wenn Switcher sichtbar, sonst kein Padding)
2. Floating-`div` (Zeile 89): `mt-2` entfernen, stattdessen `pt-2` verwenden — oder einfacher: den Wrapper immer mit genuegend Padding versehen und das Floating-Element direkt an `top-full` positionieren ohne Margin

Konkret:
- Zeile 81: `className="relative"` wird zu `className={cn("relative", showModuleSwitcher && "pb-12")}` — das erzeugt genuegend Raum fuer die Pills innerhalb des Hover-Bereichs
- Zeile 89: `mt-2` entfernen, nur `top-full` beibehalten

Alternativ (eleganter): Statt Padding einfach ein unsichtbares "Bruecken-Element" (`h-4 w-full absolute`) zwischen SubTabs und Pills einbauen, das Teil des Wrappers bleibt.

**Einfachste Loesung:** `mt-2` durch `pt-2` ersetzen und den Floating-Container als Teil des normalen Flows rendern statt absolut positioniert. Aber dann verschiebt er den Inhalt darunter. Daher besser:

- Wrapper bekommt `pb-10` wenn Switcher offen (damit der Hover-Bereich bis zu den Pills reicht)
- Floating-Element behaelt `absolute top-full mt-2`

Eine Zeile Aenderung genuegt.

