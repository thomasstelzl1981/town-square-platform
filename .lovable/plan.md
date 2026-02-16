

# Hover-basierter Modul-Switcher (Floating Pills)

## Konzept

Die mittlere Navigationszeile (Module Tabs) wird **nicht dauerhaft angezeigt**, sondern erscheint als **schwebendes Overlay unterhalb der SubTabs**, wenn der Nutzer mit der Maus ueber die SubTabs faehrt. Nach Verlassen oder Klick verschwindet es wieder.

## Visueller Aufbau

### Normalzustand (nur 2 Zeilen)

```text
┌──────────────────────────────────────────────────┐
│  [Client]  [Manager]  [Service]  [Base]          │  Area Tabs
├──────────────────────────────────────────────────┤
│  [Uebersicht] [Investment] [Versicherungen]      │  Sub Tabs
└──────────────────────────────────────────────────┘
```

### Hover auf SubTabs → Floating Module-Switcher

```text
┌──────────────────────────────────────────────────┐
│  [Client]  [Manager]  [Service]  [Base]          │  Area Tabs
├──────────────────────────────────────────────────┤
│  [Uebersicht] [Investment] [Versicherungen]      │  Sub Tabs
└──────────────────────────────────────────────────┘
        ↕ 8px Abstand (kein border, schwebt frei)

    ╭─────────────────────────────────────────╮
    │  Finanzen   Immobilien   Markt   Suche  │  Floating Pills
    ╰─────────────────────────────────────────╯
        Glasmorphism, shadow-lg, rounded-2xl
        animate-in: fade + slide-down (150ms)
```

Die Floating Pills sind:
- Visuell getrennt von der SubTab-Leiste (8px Gap, kein border-top)
- Glasmorphism-Stil (bg-card/80 backdrop-blur-xl shadow-lg rounded-2xl)
- Fade+Slide Animation beim Erscheinen
- Das aktive Modul ist hervorgehoben (wie bisher)
- Klick auf ein Modul navigiert und schliesst das Overlay

## Technische Umsetzung

### Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/components/portal/TopNavigation.tsx` | Level-2-Block durch Hover-Logik ersetzen, Hover-State verwalten |
| `src/components/portal/SubTabs.tsx` | `onMouseEnter`/`onMouseLeave` Callbacks entgegennehmen |
| Keine neue Komponente noetig | Floating Pills werden inline in TopNavigation gerendert |

### TopNavigation.tsx

1. Neuer State: `const [showModuleSwitcher, setShowModuleSwitcher] = useState(false)`
2. Der bisherige Level-2-Block (ModuleTabs dauerhaft sichtbar) wird entfernt
3. Ein Wrapper-`div` umschliesst die SubTabs und den Floating-Bereich mit `onMouseEnter` und `onMouseLeave`
4. Der Floating-Bereich rendert die Module-Pills als `position: absolute` unterhalb der SubTabs

```text
<div
  className="relative"
  onMouseEnter={() => setShowModuleSwitcher(true)}
  onMouseLeave={() => setShowModuleSwitcher(false)}
>
  {/* SubTabs (immer sichtbar) */}
  <SubTabs module={...} moduleBase={...} />

  {/* Floating Module Switcher (nur bei Hover) */}
  {showModuleSwitcher && areaModules.length > 0 && (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50
                    flex items-center gap-1 px-4 py-2
                    bg-card/80 backdrop-blur-xl shadow-lg rounded-2xl border border-border/30
                    animate-in fade-in slide-in-from-top-1 duration-150">
      {areaModules.map(m => (
        <NavLink
          key={m.code}
          to={`/portal/${m.module.base}`}
          onClick={() => setShowModuleSwitcher(false)}
          className={cn(
            'px-3 py-1.5 rounded-xl text-sm font-medium ...',
            isActive ? 'bg-accent/80 text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon /> {m.displayLabel}
        </NavLink>
      ))}
    </div>
  )}
</div>
```

### Verhalten

- **Mouse enters SubTabs-Bereich** → Floating Pills erscheinen mit Animation
- **Mouse bleibt auf Pills** → Bleiben sichtbar (da der Wrapper beide umschliesst)
- **Mouse verlaesst den gesamten Bereich** → Pills verschwinden
- **Klick auf ein Modul** → Navigation + Pills schliessen sofort
- **Touch-Geraete**: Kein Hover moeglich — auf Mobile ist die Navigation sowieso deaktiviert (isMobile-Guard in TopNavigation)

### Keine DB-Aenderungen noetig

Rein frontendbasierte Aenderung.
