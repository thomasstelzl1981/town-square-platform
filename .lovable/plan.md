
Ziel: Armstrong muss auf Desktop immer zuverlässig sichtbar/öffnbar sein (Planet), auch wenn lokale Zustände/Positionen kaputt sind. Aktuell ist der Rocket-Button da (Tooltip „Armstrong ein-/ausblenden“ erscheint), aber der Planet erscheint nicht. Das deutet stark auf einen „Recovery“-Fehler hin: entweder (a) Sichtbarkeit toggelt, aber der Container ist off-screen / unter einem Layer oder (b) lokale Werte verhindern Render/Position.

Was ich aus dem Code bereits sicher weiß
- Desktop rendert immer `<ArmstrongContainer />` (PortalLayout.tsx, Desktop-Branch).
- ArmstrongContainer rendert `null`, wenn `armstrongVisible === false`.
- Der Rocket-Button ist nur sichtbar, wenn `isMobile === false`. Du siehst ihn also im Desktop-Layout.
- Migration löscht aktuell nur:
  - `sot-portal-armstrong-visible`
  - `sot-portal-armstrong-expanded`
  Nicht aber die Drag-Position `armstrong-position`.

Wahrscheinlichste Ursachen (in Priorität)
1) Drag-Position / Position-Logik: Armstrong ist „sichtbar“, aber an einer Position, wo du ihn nicht siehst (z.B. nach Screen-Resize, Zoom, Multi-Monitor, gespeicherte Werte).
2) Z-Index/Layering: Armstrong liegt hinter einem anderen Overlay/Stacking-Context (ArmstrongContainer hat nur `z-40`, SystemBar `z-50`, verschiedene UI-Overlays existieren).
3) Zustand bleibt „hidden“ trotz Klick (seltener, aber möglich bei Fast Refresh/State-Preservation): Titel wechselt, aber UI nicht, oder Zustand wird sofort wieder überschrieben.

Implementierung: „Armstrong Recovery“ (robust, ohne dass Nutzer LocalStorage löschen müssen)

Phase A — Recovery-Mechanik in der State-Schicht (usePortalLayout)
1) Migration erweitern:
   - Zusätzlich zu `ARMSTRONG_KEY` und `ARMSTRONG_EXPANDED_KEY` auch `localStorage.removeItem('armstrong-position')`.
   - Dadurch wird eine potenziell „kaputte“ Position einmalig bereinigt.
2) Neue Helper im Context ergänzen (saubere Semantik statt nur Toggle):
   - `showArmstrong({ resetPosition?: boolean; expanded?: boolean })`
   - `hideArmstrong()`
   - `resetArmstrong()` (setzt: visible=true, expanded=false, löscht Position, optional setzt Default-Werte)
   Motivation: Der Rocket-Klick kann dann „Show + Reset“ machen (statt nur togglen), damit es garantiert sichtbar wird.

Phase B — SystemBar: Rocket wird „verlässlicher Launcher“
3) Rocket-Button Click-Logik ändern:
   - Wenn Armstrong gerade unsichtbar ist: `showArmstrong({ resetPosition: true, expanded: false })`
   - Wenn Armstrong sichtbar ist: weiterhin „ausblenden“ (oder optional: kurzer Klick = expand/collapse; langer Klick = hide — aber das würde ich erst nach Stabilisierung anfassen).
4) Direktes Nutzer-Feedback:
   - Beim Einblenden ein Toast/Hint „Armstrong eingeblendet“ + Action „Position zurücksetzen“ (falls du ihn trotzdem nicht siehst).
   - Alternativ: im User-Dropdown zusätzlich ein Menüpunkt „Armstrong zurücksetzen“.

Phase C — ArmstrongContainer: On-Screen Failsafe + höherer Z-Index
5) Z-Index erhöhen:
   - ArmstrongContainer von `z-40` auf z.B. `z-[60]` (unter Toast `z-[100]`, aber über SystemBar/Navigation).
6) „Self-healing“ wenn sichtbar:
   - In ArmstrongContainer eine kleine On-Mount/On-Visible Prüfung:
     - `ref` auf den Root (Planet oder Expanded Panel)
     - `getBoundingClientRect()` prüfen
     - Wenn Element komplett außerhalb Viewport: `resetPosition()` aus `useDraggable` aufrufen
   Vorteil: Auch wenn die Position aus irgendeinem Grund wieder off-screen landet, holt er sich selbst zurück.
7) Optional (falls nötig): Klickfläche/Pointer Events absichern:
   - Sicherstellen, dass ArmstrongContainer nicht durch ungewollte `pointer-events`/Overlay blockiert wird.

Phase D — Diagnose-Hebel für dich (damit wir nicht im Kreis drehen)
8) „Armstrong Debug“-Option (nur im Entwicklungsmodus):
   - Ein kleiner Menüpunkt im User-Menü: „Armstrong Debug“
   - Zeigt Dialog: `armstrongVisible`, `armstrongExpanded`, gespeicherte LocalStorage-Keys (sichtbar/expanded/position), plus Buttons:
     - „Einblenden“
     - „Minimieren“
     - „Position zurücksetzen“
     - „Alles zurücksetzen“
   Dadurch können wir jeden Zustand sofort wiederherstellen, ohne manuell Browser-Storage zu löschen.

Testplan (End-to-End)
- Desktop:
  1) `/portal` laden → Planet ist sichtbar (unten/rechts, oder an Default-Position).
  2) Rocket: „Ausblenden“ → Planet weg.
  3) Rocket: „Einblenden“ → Planet wieder da (garantiert, Position reset wenn nötig).
  4) Planet klicken → Expanded Chat erscheint.
  5) Minimize im Header → zurück zum Planet.
  6) X im Header → hidden; Rocket bringt ihn wieder.
- Mobile:
  1) Prüfen, dass „Ask Armstrong…“ Bar unten weiterhin sichtbar ist und nicht von Desktop-Visibility beeinflusst wird.

Welche Dateien ich dafür anfassen werde
- `src/hooks/usePortalLayout.tsx`
  - Migration erweitert (inkl. `armstrong-position`)
  - neue API: show/hide/reset (statt nur toggle)
- `src/components/portal/SystemBar.tsx`
  - Rocket Click: „Show + Reset“ beim Einblenden
  - optional Toast/Dropdown Action „Reset“
- `src/components/portal/ArmstrongContainer.tsx`
  - z-index erhöhen
  - ref + boundingClientRect Failsafe
  - Nutzung von `resetPosition` aus `useDraggable`
- (optional) `src/hooks/useDraggable.ts`
  - Default-Position zusätzlich mit `constrainPosition(...)` absichern (kleine Defensive-Verbesserung)

Erwartetes Ergebnis
- Du bekommst Armstrong immer wieder sichtbar, ohne Browser-Storage manuell zu löschen.
- Selbst wenn die Planet-Position „kaputt gespeichert“ wurde, holt sich Armstrong automatisch zurück.
- Der Rocket-Button wird vom simplen Toggle zu einem verlässlichen „Launcher“ (mindestens beim Einblenden).

Risiken / Trade-offs
- Wenn wir beim Einblenden immer resetten, verlieren Nutzer ggf. ihre gespeicherte Planet-Position. Deshalb: Reset nur beim Übergang von hidden → visible (und/oder nur wenn off-screen erkannt wird).

Nächster Schritt nach Umsetzung
- Wenn Armstrong dann sichtbar ist, können wir als UX-Upgrade den Rocket-Button wieder „smarter“ machen (z.B. Click = expand/collapse, Alt-Click = hide), aber erst nachdem die Basissichtbarkeit zu 100% stabil ist.
