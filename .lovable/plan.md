
## Zielbild (was danach garantiert sein soll)
- Armstrong erscheint auf Desktop **immer unten rechts**, mit konstantem Abstand zum Viewport-Rand.
- Armstrong startet/öffnet sich bei “Einblenden” **immer als Kreis** (collapsed), nie automatisch expanded.
- Armstrong kann weiterhin durch Fokus/Interaktion in den Expanded-Modus wechseln, aber **nicht** durch “Home” oder “Rocket” ungewollt.
- Keine “Altlasten” (persistierte Zustände/Positionen), die das Verhalten wieder kaputt machen.

---

## Beobachtung aus Screenshot + Diff (warum es aktuell links unten/abgeschnitten landen kann)
Obwohl in `ArmstrongContainer.tsx` inline `right/bottom` gesetzt ist, zeigt dein Screenshot:
- Widget sitzt **links unten** und ist **geclippt** (abgeschnitten).

Das ist typisch, wenn `position: fixed` **nicht** zum echten Browser-Viewport relativ ist, sondern zu einem **kleineren Containing-Block** (z.B. durch ein übergeordnetes Element mit `transform`, `filter`, `backdrop-filter`, o.ä. – oder durch die Preview-Umgebung). Dann wird `right: 20px` relativ zu einem schmalen Container berechnet → das kann mathematisch zu einem **negativen left** führen und wird dann links geclippt.

Die zuverlässigste Abhilfe ist, Armstrong **außerhalb** der Layout-Hierarchie zu rendern – direkt in `document.body` – damit `fixed` wirklich auf den Viewport geht und nicht “vererbt”/geclippt werden kann.

---

## Änderungen (konkret, minimal-invasiv)

### 1) Armstrong “viewport-sicher” machen (Portal in document.body)
**Datei:** `src/components/portal/ArmstrongContainer.tsx`

**Umsetzung:**
- Armstrong nicht mehr “normal” im PortalLayout-DOM rendern, sondern via `createPortal(...)` nach `document.body`.
- Dazu ein Overlay-Wrapper:
  - `fixed inset-0 z-[...] pointer-events-none`
  - Die eigentliche Armstrong-UI in einem Kind mit `pointer-events-auto`
  - Positionierung über einen einzigen Anker-Wrapper: `absolute` + `right/bottom` (inkl. Safe-Area)

**Warum das hilft:**
- Kein Clipping mehr durch `overflow`-Container.
- Kein “fixed-ist-doch-nicht-fixed” durch transformierte Eltern.
- Position ist unabhängig von Routen/Layouts.

**Details zur Position:**
- Verwenden von Safe-Area:
  - `right: calc(1.25rem + env(safe-area-inset-right))`
  - `bottom: calc(1.25rem + env(safe-area-inset-bottom))`

Damit ist es auch auf macOS/iOS/Notch sauber.

---

### 2) “Immer Kreis beim Einblenden” wirklich erzwingen (Altzustände entfernen)
Aktuell kann Expanded-State trotz “Default false” wieder auftauchen, weil:
- `armstrongExpanded` weiterhin in `localStorage` persistiert wird
- oder weil beim Schließen (`hideArmstrong`) Expanded nicht zurückgesetzt wird

**Datei:** `src/hooks/usePortalLayout.tsx`

**Änderungen:**
1. **Expanded nicht mehr aus localStorage initialisieren**
   - `armstrongExpanded` initial immer `false` (keine Persistenz beim Boot).
2. **hideArmstrong() setzt expanded zusätzlich zurück**
   - Beim Schließen wird Expanded auf `false` gesetzt, damit “nächstes Einblenden” immer Kreis ist.
3. Optional (sehr sinnvoll): **Expanded-State nicht mehr in localStorage speichern**
   - `setArmstrongExpanded()` schreibt nicht mehr in localStorage (oder schreibt immer `false` beim hide/show).

**Migration/Altlasten:**
- Migration-Key von `sot-armstrong-migrated-v3` auf `v4` erhöhen
- In der Migration:
  - `ARMSTRONG_EXPANDED_KEY` explizit entfernen oder auf `'false'` setzen
  - zusätzlich bekannte alte Keys entfernen (falls vorhanden), z.B.:
    - `armstrong-position`
    - `draggable-position`
    - evtl. ältere Armstrong-Keys aus früheren Iterationen

Damit bekommen alle Browser, die schon “v3” gesehen haben, nochmal einen sauberen Reset.

---

### 3) Home/Rocket Verhalten vereinheitlichen (keine Hidden-Path-Variante)
**Datei:** `src/components/portal/SystemBar.tsx`

**Ist bereits in deinem Diff korrekt:**
- `handleHomeClick()` ruft `showArmstrong({ expanded: false })`
- Rocket-Button: `showArmstrong({ resetPosition: true, expanded: false })`

**Zusatz (klein, aber stabilisierend):**
- Sicherstellen, dass `showArmstrong()` intern, wenn `expanded:false`, auch wirklich den gespeicherten Expanded-State überschreibt (falls wir Persistenz noch irgendwo drin lassen).

---

## Implementierungsreihenfolge (damit wir schnell einen “harten Fix” sehen)
1. **ArmstrongContainer → Portal in document.body** (das löst Position + Clipping sofort)
2. `usePortalLayout`:
   - Expanded nicht persistieren/initialisieren
   - `hideArmstrong` setzt expanded=false
   - Migration v4 + Cleanup Keys
3. Smoke-Test aller Trigger (Home, Rocket, Close X, Focus Input)

---

## Testplan (End-to-End, genau die Fälle aus deiner Beschreibung)
1. Portal laden (`/portal`) → Armstrong sichtbar? (je nach Visible-State) und **wenn sichtbar: Kreis unten rechts**.
2. Rocket:
   - aus → an: **Kreis unten rechts**
   - an → aus: verschwindet
3. Home-Button:
   - egal in welchem Modul: Navigiert zu `/portal` und Armstrong ist **Kreis unten rechts**
4. Expanded/Collapsed:
   - Klick in Input → expanded öffnet
   - Minimieren → wieder Kreis unten rechts
   - X (schließen) → verschwindet
   - Rocket wieder an → **Kreis**, nicht expanded
5. Hard Refresh (Cmd+Shift+R) → weiterhin Kreis unten rechts (keine Altzustände)

---

## Risiken / Nebenwirkungen
- `createPortal` ist Standard React – aber wir müssen `document`-Guard einbauen (`typeof document === 'undefined'`) damit es nicht in Sonderfällen crasht.
- Pointer-Events: Overlay muss `pointer-events-none` haben, die Armstrong-Box selbst `pointer-events-auto`, sonst blockiert ein Fullscreen-Overlay Klicks im Portal.
- Z-Index: Armstrong muss über Navigation/Content liegen, aber unter modalen Dialogen (wenn gewünscht). Wir wählen z.B. `z-[60]`/`z-[70]` konsistent mit euren Overlays.

---

## Betroffene Dateien (final)
- `src/components/portal/ArmstrongContainer.tsx`
  - Render via `createPortal`
  - neues Overlay-Layout + einheitlicher Bottom-Right-Anker
- `src/hooks/usePortalLayout.tsx`
  - Expanded-State-Init/Persistenz entschärfen (immer Kreis beim Start)
  - `hideArmstrong` setzt expanded=false
  - Migration v4 + lokales Cleanup alter Keys
- `src/components/portal/SystemBar.tsx`
  - bleibt wie im Diff (ggf. minimale Stabilisierung in showArmstrong-Logik)

---