

## Analyse: 3 Bugs im Zuhause-Widget-Grid (MOD-20)

### Bug 1: Kamera-Widget wird ohne Kamera angezeigt (falscher User sieht "Oberhaching")

**Ursache:** Die Kamera "Oberhaching" gehort User `d028bc99` (thomas.stelzl). RLS auf `cameras` ist korrekt (`auth.uid() = user_id`), daher liefert die DB-Query fur `rr@unities.com` leer zuruck. **Aber:** Der `useZuhauseWidgets`-Hook baut die Widget-Liste korrekt nur aus DB-Daten. Das Problem ist, dass der **localStorage-Key `zuhause-widget-order`** widget-IDs aus einer vorherigen Session (anderer User, gleicher Browser) enthalt. Beim Initialisieren (Zeile 134-145) werden gespeicherte IDs geladen, auch wenn die zugehorigen Widgets nicht mehr existieren. Der `useEffect` (Zeile 148-161) filtert zwar ungultige IDs, aber der **initiale State** wird VOR dem ersten Render der DB-Daten gesetzt, was zu einem Race Condition fuhrt.

**Zusatzlich:** localStorage ist nicht user-scoped. Wenn sich ein anderer User im gleichen Browser einloggt, sieht er die Widget-Reihenfolge des vorherigen Users.

### Bug 2: "Oberhaching" ist der Kamera-Name aus der DB

Der Name kommt aus `cameras.name` (Zeile 52 in CameraWidget: `{camera.name}`). Das ist kein Hardcoding im Code, sondern der gespeicherte Name in der Datenbank. Da RLS das Widget fur andere User eigentlich unsichtbar machen sollte, ist das ein Folgeproblem von Bug 1.

### Bug 3: Widget-Reihenfolge persistiert nicht korrekt

**Ursache:** localStorage-Key `zuhause-widget-order` wird korrekt gespeichert (Zeile 165), aber:
- Der `useEffect` (Zeile 148-161) uberschreibt die Order wenn sich `allWidgetIds` andert (z.B. bei asynchronem Laden der Homes/Cameras)
- Da `homes` und `cameras` async geladen werden, andert sich `allWidgetIds` mehrfach, was die gespeicherte Reihenfolge uberschreibt

### Fix-Plan

**Voraussetzung:** UNFREEZE MOD-20

| # | Datei | Anderung |
|---|---|---|
| 1 | `src/pages/portal/miety/hooks/useZuhauseWidgets.ts` | localStorage-Keys user-scoped machen: `zuhause-widget-order-{userId}` und `zuhause-hidden-widgets-{userId}`. userId aus `useAuth()` beziehen. |
| 2 | `src/pages/portal/miety/hooks/useZuhauseWidgets.ts` | Init-Logik fixen: `order` State erst nach erstem DB-Load initialisieren (Guard auf `homes`/`cameras` loading). Gespeicherte IDs nur ubernehmen wenn sie in aktuellen `allWidgetIds` existieren. |
| 3 | `src/pages/portal/miety/hooks/useZuhauseWidgets.ts` | `useEffect` Sync-Logik korrigieren: Nur neue IDs appenden, bestehende Reihenfolge nie uberschreiben. Ungultige IDs (geloschte Kameras etc.) entfernen. |
| 4 | `src/pages/portal/MietyPortalPage.tsx` | Kamera-Widgets nicht rendern wenn `cameras` leer ist (zusatzliche Guard in `renderWidget` fur `type === 'camera'` wenn kein passendes Entity in DB). Bereits durch `getWidget` abgedeckt wenn allWidgets korrekt gebaut wird — kein Code-Change notig. |

### Ergebnis
- User sehen nur eigene Kameras (RLS + user-scoped localStorage)
- Widget-Reihenfolge bleibt pro User persistent
- Kein Kamera-Widget ohne konfigurierte Kamera
- Kein "Oberhaching" fur fremde User

