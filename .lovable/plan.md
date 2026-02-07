

## Zusammenfassung

### ✅ Home-Button funktioniert korrekt
- SystemBar Home (oben links) → `/portal`
- Bottom-Nav Home → `/portal` + State-Reset

### 🔴 Problem: Navigation-Tabs fehlt Glass-CI

Die Level 1-3 Navigation-Tabs (AreaTabs, ModuleTabs, SubTabs) nutzen inkonsistente Inline-Styles statt des definierten `glass`-Design-Systems.

---

## Technische Analyse

### Aktueller Zustand (inkonsistent)

```text
┌─────────────────────────────────────────────────────────────────┐
│ button.tsx "glass" Variante (korrekt definiert)                 │
├─────────────────────────────────────────────────────────────────┤
│ bg-white/50 dark:bg-white/10                                    │
│ backdrop-blur-md                                                │
│ border border-white/30 dark:border-white/10                     │
│ shadow-[inset_0_1px_0_hsla(0,0%,100%,0.2),0_1px_3px_...]       │
│ hover:bg-white/60 dark:hover:bg-white/15                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Navigation Tabs (aktuell - ad-hoc Styles)                       │
├─────────────────────────────────────────────────────────────────┤
│ Level 1 (AreaTabs):                                             │
│   hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm    │
│   ❌ Kein border, kein shadow, falscher blur                    │
├─────────────────────────────────────────────────────────────────┤
│ Level 2 (ModuleTabs):                                           │
│   hover:bg-white/10 backdrop-blur-sm                            │
│   ❌ Noch weniger Sichtbarkeit, kein Glass-Effekt               │
├─────────────────────────────────────────────────────────────────┤
│ Level 3 (SubTabs):                                              │
│   hover:bg-white/10 backdrop-blur-sm                            │
│   ❌ Gleiche Probleme                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementierungsplan

### Schritt 1: Neue CSS-Utility-Klasse für Navigation-Tabs

In `src/index.css` eine wiederverwendbare Klasse definieren:

```css
/* Navigation Tab Glass Style */
.nav-tab-glass {
  @apply backdrop-blur-md;
  background: hsla(0, 0%, 100%, 0.15);
  border: 1px solid hsla(0, 0%, 100%, 0.1);
  box-shadow: inset 0 1px 0 hsla(0, 0%, 100%, 0.1);
  transition: background-color 0.15s, border-color 0.15s;
}

.nav-tab-glass:hover {
  background: hsla(0, 0%, 100%, 0.25);
  border-color: hsla(0, 0%, 100%, 0.15);
}

.dark .nav-tab-glass {
  background: hsla(0, 0%, 100%, 0.05);
  border-color: hsla(0, 0%, 100%, 0.05);
}

.dark .nav-tab-glass:hover {
  background: hsla(0, 0%, 100%, 0.1);
}
```

### Schritt 2: AreaTabs.tsx anpassen

```tsx
// Inactive state VORHER:
'text-muted-foreground hover:text-foreground hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm'

// NACHHER:
'nav-tab-glass text-muted-foreground hover:text-foreground'
```

### Schritt 3: ModuleTabs.tsx anpassen

```tsx
// Inactive state VORHER:
'text-muted-foreground hover:text-foreground hover:bg-white/10 backdrop-blur-sm'

// NACHHER:
'nav-tab-glass text-muted-foreground hover:text-foreground'
```

### Schritt 4: SubTabs.tsx anpassen

```tsx
// Inactive state VORHER:
'text-muted-foreground hover:text-foreground hover:bg-white/10 backdrop-blur-sm'

// NACHHER:
'nav-tab-glass text-muted-foreground hover:text-foreground'
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/index.css` | Neue `.nav-tab-glass` Utility-Klasse hinzufügen |
| `src/components/portal/AreaTabs.tsx` | Inactive-State auf `nav-tab-glass` umstellen |
| `src/components/portal/ModuleTabs.tsx` | Inactive-State auf `nav-tab-glass` umstellen |
| `src/components/portal/SubTabs.tsx` | Inactive-State auf `nav-tab-glass` umstellen |

---

## Erwartetes Ergebnis

- Alle Navigation-Tabs haben konsistenten Glass-Effekt mit:
  - Subtiler Border
  - Backdrop-Blur (md)
  - Inset-Shadow für Tiefe
  - Konsistente Hover-States
- Das Design folgt dem ORBITAL Glass-CI System
- Light und Dark Mode werden korrekt unterstützt

