

# Fix: Floating Switcher — Immer im DOM + zuverlaessige Events

## Kernproblem

Zwei zusammenhaengende Ursachen:

1. **Conditional Rendering** (`{showModuleSwitcher && ...}`) entfernt das Floating-Element komplett aus dem DOM, wenn der Timer ablaeuft. Dadurch kann `onMouseEnter` auf dem Floating-Container gar nicht feuern, wenn das Element gerade abgebaut wird. Der Timer laeuft, das Element wird entfernt, und eventuelle Mouse-Events gehen verloren.

2. **Klicks funktionieren nicht**, weil React das Element unmounted bevor der Click-Event vollstaendig verarbeitet wird — das ist eine bekannte Race-Condition bei conditional rendering mit Timern.

## Loesung

Das Floating-Element wird **immer im DOM behalten** und nur per CSS ein-/ausgeblendet (opacity + pointer-events). Dadurch:
- `onMouseEnter` feuert zuverlaessig, auch waehrend der Timer laeuft
- Klicks koennen nicht durch Unmounting verloren gehen
- Die Animation bleibt erhalten

## Technische Aenderungen

**Datei:** `src/components/portal/TopNavigation.tsx`

### Aenderung 1: Conditional Rendering durch CSS-Visibility ersetzen (Zeile 103-141)

Vorher:
```tsx
{showModuleSwitcher && areaModules.length > 0 && (
  <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 pt-3 pointer-events-auto"
    onMouseEnter={showSwitcher}
    onMouseLeave={hideSwitcher}
  >
    <div className="flex items-center gap-1 px-4 py-2 ...">
      {areaModules.map(...)}
    </div>
  </div>
)}
```

Nachher — Element bleibt immer im DOM, Sichtbarkeit per CSS:
```tsx
{areaModules.length > 0 && (
  <div
    className={cn(
      "absolute top-full left-1/2 -translate-x-1/2 z-50 pt-3 transition-all duration-200",
      showModuleSwitcher
        ? "opacity-100 pointer-events-auto translate-y-0"
        : "opacity-0 pointer-events-none -translate-y-1"
    )}
    onMouseEnter={showSwitcher}
    onMouseLeave={hideSwitcher}
  >
    <div className="flex items-center gap-1 px-4 py-2
                    bg-card/80 backdrop-blur-xl shadow-lg rounded-2xl border border-border/30">
      {areaModules.map(({ code, module, displayLabel }) => {
        const Icon = iconMap[module.icon] || Briefcase;
        const isActive = activeModule?.code === code;
        const requiresActivation = module.visibility.requires_activation && !isDevelopmentMode;

        return (
          <NavLink
            key={code}
            to={`/portal/${module.base}`}
            onClick={() => {
              if (hideTimeout.current) {
                clearTimeout(hideTimeout.current);
                hideTimeout.current = null;
              }
              setShowModuleSwitcher(false);
            }}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              isActive
                ? 'bg-accent/80 text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/10',
              requiresActivation && 'opacity-50'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{displayLabel}</span>
          </NavLink>
        );
      })}
    </div>
  </div>
)}
```

### Warum das funktioniert

```text
Vorher (conditional rendering):
  Timer laeuft ab → React entfernt Element → onMouseEnter geht verloren
  Klick startet → Timer entfernt Element → Klick wird abgebrochen

Nachher (CSS visibility):
  Timer laeuft ab → opacity:0 + pointer-events:none → Element bleibt im DOM
  Maus auf Element → onMouseEnter feuert IMMER → Timer wird geloescht
  Klick → Element ist im DOM → Navigation wird ausgefuehrt
```

### Verhalten

- Maus auf SubTabs: Floating Pills erscheinen (fade-in + slide)
- Maus verlaesst SubTabs: 1.5s Verzoegerung, dann fade-out
- Maus auf Floating Pills: Timer wird geloescht, Pills bleiben sichtbar
- Maus bleibt auf Pills: kein Timer aktiv, Pills bleiben dauerhaft
- Klick auf Modul: sofortige Navigation, Pills schliessen sich

