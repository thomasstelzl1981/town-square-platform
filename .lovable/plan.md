

## Plan: Light Graphite Chrome — Dunkle Kopfleiste (Medium Graphite 45%)

### Konzept

Header + AreaTabs + SubTabs werden im Light Mode zu einem dunklen Graphit-Block (Lightness ~45%). Text und Icons werden hell. Active Pills bleiben weiss. Dark Mode bleibt 100% unveraendert.

### Aenderung 1: `src/index.css` — Chrome-Tokens auf Graphite

Bestehende Light-Chrome-Tokens ersetzen (Zeile 106-110):

```css
/* Chrome Frame — Light Graphite */
--chrome-bg: 220 14% 32%;
--chrome-bg-2: 220 12% 38%;
--chrome-border: 220 10% 26%;
--chrome-shadow: 0 6px 18px -14px rgb(0 0 0 / 0.30);

/* Chrome Text (NEU) */
--chrome-foreground: 0 0% 95%;
--chrome-foreground-muted: 0 0% 65%;
```

Light `.nav-tab-glass` Override anpassen (Zeile 700-710) — muss auf dunklem BG funktionieren:
```css
:root .nav-tab-glass {
  backdrop-filter: none;
  background: hsl(220 12% 38% / 0.8);
  border: 1px solid hsl(220 10% 45% / 0.5);
  box-shadow: none;
  color: hsl(0 0% 85%);
}
:root .nav-tab-glass:hover {
  background: hsl(220 12% 44% / 0.9);
  border-color: hsl(220 10% 50% / 0.6);
  color: hsl(0 0% 95%);
}
```

Light `.btn-glass` Override anpassen (Zeile 606-617) — Header-Buttons auf Graphit:
```css
:root .btn-glass {
  background: hsl(220 12% 40% / 0.6);
  border: 1px solid hsl(220 10% 50% / 0.3);
  color: hsl(0 0% 90%);
}
:root .btn-glass:hover {
  background: hsl(220 12% 46% / 0.8);
}
```

Light `.glass-nav` Override anpassen (Zeile 588-594):
```css
:root .glass-nav {
  background: hsl(var(--chrome-bg) / 0.98);
  backdrop-filter: none;
  border: 1px solid hsl(var(--chrome-border) / 0.5);
  box-shadow: var(--chrome-shadow);
}
```

### Aenderung 2: `src/components/portal/PortalHeader.tsx`

Zeile 53 — Header Container:
```
bg-[hsl(var(--chrome-bg))] text-[hsl(var(--chrome-foreground))]
shadow-[var(--chrome-shadow)]
dark:bg-background/95 dark:backdrop-blur dark:supports-[backdrop-filter]:bg-background/60 dark:shadow-none dark:text-foreground
```

Zeile 88 — Logo Icon: `text-primary` → `text-primary dark:text-primary` (bleibt, kontrastiert gut auf Graphit)

Zeile 89 — Logo Text "Portal": Erbt `text-[hsl(var(--chrome-foreground))]` vom Container — passt.

Zeile 114 — Armstrong Toggle Active-State: `bg-white/40` → `bg-white/20` (auf dunklem BG)

### Aenderung 3: `src/components/portal/TopNavigation.tsx`

Zeile 49 — Nav Container:
```
border-b border-[hsl(var(--chrome-border)/0.5)]
bg-[hsl(var(--chrome-bg))]
shadow-[0_2px_8px_-4px_rgb(0_0_0/0.15)]
dark:bg-card/60 dark:backdrop-blur-md dark:shadow-none dark:border-b
```

### Aenderung 4: `src/components/portal/AreaTabs.tsx`

Zeile 54 — Pill-Container: Text-Farbe erbt vom Chrome-Container, aber explizit setzen fuer inactive:
```
'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium uppercase tracking-wide transition-colors'
```

Zeile 56 — Active Pill (bleibt weiss — maximaler Kontrast auf Graphit):
```
'bg-white text-foreground shadow-md border border-white/20 dark:bg-primary/90 dark:text-primary-foreground dark:shadow-lg dark:border-0'
```

Zeile 57 — Inactive: statt `text-muted-foreground`:
```
'nav-tab-glass text-[hsl(var(--chrome-foreground-muted))] hover:text-[hsl(var(--chrome-foreground))] dark:text-muted-foreground dark:hover:text-foreground'
```

### Aenderung 5: `src/components/portal/SubTabs.tsx`

Zeile 37 — Container BG:
```
bg-[hsl(var(--chrome-bg-2))] dark:bg-background/50
```

Zeile 49 — Active SubTab (weiss):
```
'bg-white text-foreground font-medium shadow-sm border border-white/20 dark:bg-primary/90 dark:text-primary-foreground dark:border-0'
```

Zeile 50 — Inactive: gleiche Chrome-Foreground-Logik wie AreaTabs:
```
'nav-tab-glass text-[hsl(var(--chrome-foreground-muted))] hover:text-[hsl(var(--chrome-foreground))] dark:text-muted-foreground dark:hover:text-foreground'
```

### Was NICHT geaendert wird

- Dark Mode: alle Aenderungen mit `dark:` geschuetzt
- Canvas + Content Well: bleiben bei 94% + weiss
- Primary/Status-Farben: unveraendert
- Mobile Navigation: nicht betroffen
- Popovers/Dropdowns: oeffnen sich nach unten ins helle Gebiet — kein Anpassungsbedarf

### Erwartetes Ergebnis

```text
+==[ GRAPHIT 32% — dunkel, shadow ]============+
|  Logo (weiss)  🔍  👤  ⚙️  (helle Icons)    |
+--[ GRAPHIT 32% — AreaTabs ]------------------+
|  [BASE] [MISSIONS] [OPS] [SERVICES]          |
|   ^^^^^ weisse Pill auf Graphit = pop!        |
|   andere = helles Grau/65% auf Graphit        |
+--[ GRAPHIT 38% — SubTabs ]-------------------+
|  Tab1 | Tab2 | Tab3 | Tab4                    |
+~~~ shadow-Kante ~~~~~~~~~~~~~~~~~~~~~~~~~~~~+
|                                              |
|    Canvas: 94% warm-gray (hell)              |
|  +========================================+  |
|  | Content Well: 100% weiss, shadow-md    |  |
|  +========================================+  |
+----------------------------------------------+
```

5 Dateien, sofortiger Enterprise-Frame-Effekt. Weisse Pills auf Graphit sind das staerkste CRM-Pattern.

