

# Fix: Timer erhoehen + Menue bleibt sichtbar bei Hover

## Probleme

1. **Timer zu kurz (400ms)** — der Switcher verschwindet, bevor man ihn erreichen kann
2. **Menue verschwindet auch bei aktivem Hover** — wenn die Maus direkt auf dem Floating-Menue ist, soll es dauerhaft sichtbar bleiben
3. **Klicks funktionieren nicht** — Race-Condition zwischen Timer und Navigation

## Ursache

Der `onMouseEnter`/`onMouseLeave` auf dem aeusseren absoluten Container (`pt-2`) funktioniert nicht zuverlaessig, weil das Element ausserhalb des relativen Wrappers liegt. Der Browser loest `onMouseLeave` auf dem Wrapper aus, der 400ms-Timer laeuft ab, und das Menue verschwindet bevor `onMouseEnter` auf dem Floating-Container greift.

## Loesung

1. **Timer auf 1500ms erhoehen** — genuegend Zeit, um die Maus zum Menue zu bewegen
2. **Floating-Container bekommt `pointer-events-auto`** — sicherstellen, dass Maus-Events ankommen
3. **NavLink onClick robust machen** — Timer beim Klick sofort loeschen, dann schliessen

## Technische Aenderungen

**Datei:** `src/components/portal/TopNavigation.tsx`

### 1. Timer erhoehen (Zeile 50-52)

```
// Vorher
}, 400);

// Nachher
}, 1500);
```

### 2. Floating-Container: pointer-events sicherstellen (Zeile 104)

```
// Vorher
<div className="absolute top-full left-1/2 -translate-x-1/2 z-50 pt-2"

// Nachher
<div className="absolute top-full left-1/2 -translate-x-1/2 z-50 pt-3 pointer-events-auto"
```

`pt-3` statt `pt-2` vergroessert die unsichtbare Bruecke leicht.

### 3. NavLink onClick: Timer loeschen (Zeile 120)

```
// Vorher
onClick={() => setShowModuleSwitcher(false)}

// Nachher
onClick={() => {
  if (hideTimeout.current) {
    clearTimeout(hideTimeout.current);
    hideTimeout.current = null;
  }
  setShowModuleSwitcher(false);
}}
```

### Verhalten nach dem Fix

- Maus verlaesst SubTabs: 1.5 Sekunden Verzoegerung bevor Menue verschwindet
- Maus erreicht Floating Pills: Timer wird geloescht, Menue bleibt sichtbar
- Maus bleibt auf dem Menue: kein Timer aktiv, Menue bleibt dauerhaft
- Maus verlaesst das Menue: neuer 1.5s Timer startet
- Klick auf Modul-Button: Timer wird sofort geloescht, Navigation wird ausgefuehrt, Menue schliesst

