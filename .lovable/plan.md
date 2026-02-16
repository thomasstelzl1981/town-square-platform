

# Fix: Floating Module Switcher — Layout und Hover

## Zwei Probleme

1. **`pb-12` drueckt den Seiteninhalt nach unten** — das Padding vergroessert die Nav-Bar selbst und verschiebt alles darunter
2. **Hover-Luecke bleibt bestehen** — der Switcher ist trotzdem schwer erreichbar

## Loesung

Statt `pb-12` auf dem Wrapper wird ein unsichtbares Bruecken-Element verwendet. Der Floating-Container bekommt einen transparenten oberen Bereich (`pt-3`), der die Luecke ueberbrueckt, waehrend der Wrapper selbst kein zusaetzliches Padding erhaelt.

```text
┌─────────────────────────────┐
│  SubTabs                    │  ← Wrapper (relative, KEIN pb-12)
└─────────────────────────────┘
│  ┌─ absolute top-full ────┐ │
│  │  (transparenter pt-3)  │ │  ← Unsichtbare Bruecke, gehoert zum
│  │  ╭──────────────────╮  │ │     absoluten Container
│  │  │  Floating Pills  │  │ │
│  │  ╰──────────────────╯  │ │
│  └────────────────────────┘ │
```

## Technische Aenderung

**Datei:** `src/components/portal/TopNavigation.tsx`

### Zeile 81 — Wrapper-Klasse

Vorher:
```
className={cn("relative", showModuleSwitcher && "pb-12")}
```

Nachher:
```
className="relative"
```

### Zeile 89 — Floating Container

Vorher:
```
<div className="absolute top-full left-1/2 -translate-x-1/2 z-50
                flex items-center gap-1 px-4 py-2
                bg-card/80 backdrop-blur-xl shadow-lg rounded-2xl border border-border/30
                animate-in fade-in slide-in-from-top-1 duration-150">
```

Nachher — aeusserer Container fuer die Hover-Bruecke, innerer fuer die sichtbaren Pills:
```
<div className="absolute top-full left-1/2 -translate-x-1/2 z-50 pt-2">
  <div className="flex items-center gap-1 px-4 py-2
                  bg-card/80 backdrop-blur-xl shadow-lg rounded-2xl border border-border/30
                  animate-in fade-in slide-in-from-top-1 duration-150">
    ... (Module-Pills bleiben identisch)
  </div>
</div>
```

Der aeussere `div` mit `pt-2` ist transparent und unsichtbar, gehoert aber zum Hover-Bereich des Wrappers (da er ein Kind-Element ist). Der innere `div` traegt die sichtbare Glasmorphism-Optik.

### Ergebnis

- Kein Layout-Shift (kein pb-12 mehr)
- Hover-Luecke ueberbrueckt durch transparenten pt-2 Bereich
- Floating Pills schweben frei ueber dem Seiteninhalt
- Maus kann von SubTabs nahtlos zu den Pills gleiten

