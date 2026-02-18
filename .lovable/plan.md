

## Zurueck-Navigation auf Mobile

### Problem

Wenn man auf Mobile in tiefere Ebenen navigiert (z.B. von der Modul-Liste in eine Tile-Ansicht wie "Finanzanalyse > Investment"), gibt es keinen sichtbaren Weg zurueck. Der Home-Button in der SystemBar springt immer zur Startseite, nicht eine Ebene zurueck.

### Loesung: Beide Optionen implementieren

Ich empfehle **beide Optionen gleichzeitig** zu implementieren, da sie sich ergaenzen:

**Option A: Zurueck-Button in der SystemBar (statt schwebendem Button)**
- In der mobilen SystemBar wird der Home-Button dynamisch durch einen Zurueck-Pfeil ersetzt, wenn der User tiefer als die Startseite navigiert hat
- Das ist intuitiver als ein schwebender Button, da es dem iOS-Pattern folgt und keinen Platz ueber dem Chat-Eingabefeld wegnimmt
- Tipp auf den Pfeil geht eine Navigationsebene zurueck (nicht `history.back`, sondern gezielt zur uebergeordneten Route)

**Option B: Swipe-Geste (Wisch von links nach rechts)**
- Ein Touch-Handler auf dem Content-Bereich erkennt horizontale Wischbewegungen von links nach rechts
- Schwellwert: mindestens 80px horizontal, maximal 50px vertikal (um Scrollen nicht zu stoeren)
- Navigiert zur gleichen uebergeordneten Route wie der Zurueck-Button
- Funktioniert nur auf Mobile

### Navigationslogik

Die Zurueck-Navigation folgt der Seitenhierarchie:

```text
/portal                          --> kein Zurueck (Home)
/portal/finanzanalyse            --> zurueck zu /portal
/portal/finanzanalyse/investment --> zurueck zu /portal/finanzanalyse
/portal/stammdaten/profil        --> zurueck zu /portal/stammdaten
```

### Technische Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/components/portal/SystemBar.tsx` | Mobile-Bereich: Home-Icon wird zu ArrowLeft-Icon, wenn `location.pathname` tiefer als `/portal` ist. `onClick` navigiert zur Parent-Route. |
| `src/hooks/useSwipeBack.ts` (neu) | Custom Hook: registriert `touchstart`/`touchmove`/`touchend` Events, erkennt Links-Rechts-Swipe, ruft `navigate()` zur Parent-Route auf. |
| `src/components/portal/PortalLayout.tsx` | `useSwipeBack` Hook im Mobile-Layout auf den Content-Bereich (`main`) anwenden via `ref`. |

### Details zur Implementierung

**SystemBar (Zurueck-Button):**
- Hilfsfunktion `getParentRoute(pathname)`: entfernt das letzte Pfad-Segment (z.B. `/portal/finanzanalyse/investment` wird zu `/portal/finanzanalyse`)
- Wenn `pathname === '/portal'`: Home-Icon anzeigen (wie bisher)
- Sonst: ArrowLeft-Icon anzeigen, onClick navigiert zu `getParentRoute(pathname)`

**useSwipeBack Hook:**
- Speichert `touchStartX`, `touchStartY` bei `touchstart`
- Bei `touchend`: pruefen ob `deltaX > 80` und `deltaY < 50`
- Falls ja: `navigate(getParentRoute(pathname))`
- Nur aktiv wenn `isMobile === true`

**Visuelles Feedback beim Swipe:**
- Optionaler subtiler Schatten-Effekt am linken Rand waehrend des Swipe (CSS transform)

