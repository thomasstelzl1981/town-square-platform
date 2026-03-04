

## Diagnose (Screenshot-basiert)

Ich habe beide Modi live gesehen. Der Light Mode hat folgende Probleme:

1. **Chrome und Canvas sind zu aehnlich** — Header (92%) und Canvas (96%) liegen nur 4% auseinander. Kein sichtbarer "Rahmen".
2. **Content Well ist zu schwach** — `border-opacity 0.35` und `shadow-sm` sind unsichtbar auf hellem Hintergrund. Wirkt wie ein Geist-Container.
3. **Alles innen ist gleich weiss** — Info-Box, Search-Row, Tabelle, alles auf einer Ebene. Keine innere Hierarchie.
4. **Table Header verschwindet** — `215 14% 94%` ist auf weissem Well kaum sichtbar.
5. **Nav-Stack hat keine "Unterkante"** — Chrome-Bereich endet ohne klare Trennung zum Canvas.
6. **`glass-card` hat im Light Mode `backdrop-filter: blur(12px)`** — voellig sinnlos auf weissem Hintergrund, erzeugt subtile Rendering-Artefakte.

## Plan: Light Mode v3.1 — CRM Structure Polish

Nur `src/index.css` und `src/components/shared/PageShell.tsx`. Keine neuen Dateien, keine Modul-Aenderungen.

---

### Aenderung 1: `src/index.css` — Token-Tuning + Glass-Cleanup

**A) Canvas dunkler machen (sichtbare Hierarchie)**

```
--background: 215 18% 94%;     /* war 96% — 2% dunkler = Canvas wird sichtbar */
```

Das erzeugt eine klare 3-Stufen-Hierarchie:
- Chrome: 92% (Topbar/Nav)
- Canvas: 94% (Hintergrund)  
- Well/Cards: 100% (Arbeitsflaeche)

**B) Table Header kraeftiger**

```
--table-header-bg: 215 14% 92%;   /* war 94% — jetzt sichtbar auf weissem Well */
--table-row-hover: 215 14% 96%;   /* war gleich — passt */
```

**C) Light-Mode glass-card: kein Blur**

Neuer Override (nach dem bestehenden `.glass-card` Block):
```css
:root .glass-card {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
```
Im Light Mode braucht kein Card Blur. Dark Mode bleibt (ueber `.dark .glass-card` unberuehrt).

**D) Nav-Stack Frame-Kante**

Am `TopNavigation.tsx` Container eine Shadow-Kante hinzufuegen (nur Light):
- Bereits in `PortalHeader` als `shadow-[var(--chrome-shadow)]` vorhanden
- `TopNavigation` Container bekommt zusaetzlich `shadow-[0_2px_8px_-4px_rgb(0_0_0/0.1)]` im Light

---

### Aenderung 2: `src/components/shared/PageShell.tsx` — Content Well staerker

Von:
```
border border-[hsl(var(--chrome-border)/0.35)] dark:border-0 shadow-sm dark:shadow-none
```

Zu:
```
border border-[hsl(var(--chrome-border)/0.5)] dark:border-0 shadow-md dark:shadow-none
```

Plus Padding erhoehen: `md:p-6` wird `md:p-8 md:pb-10` (mehr "Raum" im Well, Seite wirkt "fertig").

---

### Aenderung 3: `src/components/portal/TopNavigation.tsx` — Frame-Kante

Von:
```
border-b bg-[hsl(var(--chrome-bg)/0.98)] dark:bg-card/60 dark:backdrop-blur-md
```

Zu:
```
border-b bg-[hsl(var(--chrome-bg)/0.98)] shadow-[0_2px_8px_-4px_rgb(0_0_0/0.08)] dark:bg-card/60 dark:backdrop-blur-md dark:shadow-none
```

Das gibt dem gesamten Nav-Stack eine sichtbare Unterkante im Light Mode.

---

### Was NICHT geaendert wird

- Dark Mode: alle Aenderungen mit `:root` / `dark:` geschuetzt
- Hue bleibt 215 (warm-gray funktioniert — das Problem war Kontrast, nicht Farbe)
- Active Pills bleiben weiss (macOS Pattern — korrekt)
- Keine Modul-Dateien betroffen
- AreaTabs, SubTabs, PortalHeader — unveraendert

### Erwartetes Ergebnis

```text
+==[ Header: 92%, shadow ]====================+
|  Logo  [CLIENT] [MANAGER] [SERVICE] [BASE]  |
+--[ SubTabs: 90% ]---------------------------+
|  shadow-Kante ↓↓↓                           |
+----------------------------------------------+
|                                              |
|    Canvas: 94% (sichtbar grauer)             |
|  +========================================+  |
|  | Content Well: 100% weiss               |  |
|  | border 0.5 opacity, shadow-md          |  |
|  | padding p-8, pb-10                     |  |
|  |                                        |  |
|  |  [Info-Box]  ← glass-card, kein blur   |  |
|  |  [Search + Button]                     |  |
|  |  [Table: Header 92% = sichtbar]        |  |
|  |                                        |  |
|  +========================================+  |
|                                              |
+----------------------------------------------+
```

3 Dateien, 5 CSS-Zeilen, sofortiger CRM-Effekt.

