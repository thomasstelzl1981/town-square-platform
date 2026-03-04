

## Plan: Light Mode CRM Chrome — Solid Frame Spec

### Problem (Screenshot-bestätigt)

Die Token-Umstellung auf Hue 35 hat gewirkt, aber die Komponenten umgehen die Tokens komplett:

- `PortalHeader`: `bg-background/95 backdrop-blur` -- fast unsichtbar
- `TopNavigation`: `bg-card/60 backdrop-blur-md` -- transparent auf hellem Canvas
- `SubTabs`: `bg-background/50` -- halb-transparent
- `nav-tab-glass`: `hsla(0,0%,100%,0.15)` -- weiss-auf-weiss im Light
- `.glass-nav` Override existiert, wird aber von keiner Komponente genutzt (inline Tailwind)

**Ergebnis:** Alles schwebt, nichts hat Rahmen. Kein "App Chrome".

### Loesung: 2-Ebenen-Ansatz

**Ebene 1: CSS Tokens + Utility-Klassen** (src/index.css)
**Ebene 2: Komponenten-Klassen anpassen** (4 Dateien)

---

### Aenderung 1: src/index.css — Chrome-Tokens + Light Overrides

**Neue Tokens in `:root`** (nach Zeile ~103):
```css
--chrome-bg: 35 16% 93%;
--chrome-bg-2: 35 14% 91%;
--chrome-border: 35 10% 80%;
--chrome-shadow: 0 4px 14px -10px rgb(0 0 0 / 0.12);
```

**Light `nav-tab-glass` Override** (Zeile 663-684 erweitern):
```css
:root .nav-tab-glass {
  backdrop-filter: none;
  background: hsl(var(--chrome-bg-2) / 0.7);
  border: 1px solid hsl(var(--chrome-border) / 0.4);
  box-shadow: none;
}
:root .nav-tab-glass:hover {
  background: hsl(var(--chrome-bg-2) / 0.9);
  border-color: hsl(var(--chrome-border) / 0.6);
}
```

**Light `nav-ios-floating` Override** (Zeile 634-650 erweitern):
```css
:root .nav-ios-floating {
  background: hsl(var(--chrome-bg) / 0.98);
  backdrop-filter: none;
  border: 1px solid hsl(var(--chrome-border) / 0.5);
  box-shadow: var(--chrome-shadow);
}
```

**Light `btn-glass` hover** anpassen (Zeile 603-604):
```css
:root .btn-glass:hover {
  background: hsl(var(--chrome-bg-2) / 0.8);
}
```

---

### Aenderung 2: src/components/portal/PortalHeader.tsx — Solid Chrome Header

Zeile 53 aendern von:
```
bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60
```
zu:
```
bg-[hsl(var(--chrome-bg)/0.98)] dark:bg-background/95 dark:backdrop-blur dark:supports-[backdrop-filter]:bg-background/60 shadow-[var(--chrome-shadow)] dark:shadow-none
```

Das macht den Header im Light Mode opaque mit warmem Graphit, im Dark Mode bleibt Glass.

---

### Aenderung 3: src/components/portal/TopNavigation.tsx — Solid Nav Container

Zeile 49 aendern von:
```
border-b bg-card/60 backdrop-blur-md
```
zu:
```
border-b bg-[hsl(var(--chrome-bg)/0.98)] dark:bg-card/60 dark:backdrop-blur-md
```

---

### Aenderung 4: src/components/portal/SubTabs.tsx — Solid Subtab Row

Zeile 37 aendern von:
```
bg-background/50
```
zu:
```
bg-[hsl(var(--chrome-bg-2)/0.98)] dark:bg-background/50
```

---

### Aenderung 5: src/components/portal/AreaTabs.tsx — keine Aenderung noetig

Die Pills nutzen `nav-tab-glass` (wird ueber CSS Override geloest) und `bg-primary/90` fuer Active (bleibt).

---

### Was NICHT geaendert wird

- Dark Mode: alle Aenderungen sind mit `dark:` prefix geschuetzt
- Primary/Ring/Status-Farben: bleiben
- Keine neuen Komponenten-Dateien
- Mobile Navigation: nicht betroffen (eigene Komponenten)

### Erwartetes Ergebnis

```text
+--[ Header: solid warm-graphite, shadow ]-----+
|  Logo  [CLIENT] [MANAGER] [SERVICE] [BASE]   |
+--[ AreaTabs: solid chrome-bg-2 track ]--------+
+--[ SubTabs: solid chrome-bg-2 row ]-----------+
|                                               |
|         Canvas: warm-neutral 95%              |
|     +------+  +------+  +------+             |
|     | Card |  | Card |  | Card |   98%        |
|     +------+  +------+  +------+             |
+-----------------------------------------------+
```

- Header = sichtbarer Rahmen mit Shadow (wie macOS Finder)
- Nav Pills = solide Graphit-Tracks, kein Glass
- SubTabs = klare Trennlinie, nicht schwebend
- Cards = helle Panels auf Canvas (nicht Sticker)
- Dark Mode = 100% unveraendert

