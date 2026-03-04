

## Diagnose

Aus dem Screenshot ist das Problem klar:

1. **SystemBar (Row 1 — "SYSTEM OF A TOWN")** wurde NICHT auf Graphit umgestellt. Sie nutzt noch `bg-card/70 backdrop-blur-lg` — ein helles, transparentes Grau. Die Glass-Buttons verwenden `bg-white/30`, was auf hellem Hintergrund verwaschen wirkt.
2. **AreaTabs + SubTabs (Row 2+3)** sind auf Graphit — aber der Uebergang von der hellen SystemBar zum dunklen Graphit-Block sieht gebrochen aus.
3. Die Glass-Buttons in der SystemBar (`GLASS_BUTTON` Konstante) verwenden `text-foreground` — das ist Schwarz im Light Mode, muss aber Hell werden auf Graphit.

## Plan: SystemBar auf Graphit angleichen

Nur 1 Datei: `src/components/portal/SystemBar.tsx`

### Aenderung 1: Desktop Header-Container (Zeile 207)

Von:
```
bg-card/70 backdrop-blur-lg supports-[backdrop-filter]:bg-card/60
```

Zu:
```
bg-[hsl(var(--chrome-bg))] text-[hsl(var(--chrome-foreground))] shadow-[var(--chrome-shadow)] dark:bg-card/70 dark:backdrop-blur-lg dark:supports-[backdrop-filter]:bg-card/60 dark:text-foreground
```

Gleiche Graphit-Basis wie PortalHeader/TopNavigation. Dark Mode bleibt unveraendert.

### Aenderung 2: GLASS_BUTTON Konstante (Zeile 38-47)

Von:
```
bg-white/30 dark:bg-white/10
backdrop-blur-md
border border-white/20 dark:border-white/10
shadow-[inset_0_1px_0_hsla(0,0%,100%,0.15)]
hover:bg-white/45 dark:hover:bg-white/15
text-foreground
```

Zu:
```
bg-white/15 dark:bg-white/10
border border-white/15 dark:border-white/10
shadow-[inset_0_1px_0_hsla(0,0%,100%,0.08)]
hover:bg-white/25 dark:hover:bg-white/15
text-[hsl(var(--chrome-foreground))] dark:text-foreground
```

Auf dunklem Graphit: dezentere weisse Transparenz, helle Icons/Text. `backdrop-blur-md` entfernt (sinnlos auf solidem Graphit im Light Mode — bleibt im Dark ueber den Container).

### Aenderung 3: "SYSTEM OF A TOWN" Wordmark (Zeile 231)

Von:
```
text-foreground
```

Zu:
```
text-[hsl(var(--chrome-foreground))] dark:text-foreground
```

### Aenderung 4: Armstrong Active-State (Zeile 250)

Von:
```
bg-white/40 dark:bg-white/15
```

Zu:
```
bg-white/25 dark:bg-white/15
```

### Erwartetes Ergebnis

```text
+==[ GRAPHIT 32% — SystemBar ]==================+
|  🏠 ☀️ 12°  SYSTEM OF A TOWN  🕐 🚀 👤     |
|  (alle Icons + Text = weiss/95%)               |
+--[ GRAPHIT 32% — AreaTabs ]-------------------+
|  [CLIENT] [MANAGER] [SERVICE] [BASE]           |
+--[ GRAPHIT 38% — SubTabs ]--------------------+
|  HOME | PORTFOLIO | STEUER | SANIERUNG         |
+~~~ shadow ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+
|  Canvas: 94%                                   |
```

Alle 3 Leisten bilden einen einheitlichen dunklen Graphit-Block. 1 Datei, 4 Aenderungen.

