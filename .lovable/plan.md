
Zielbild (UX) und aktuelle Architektur (Analyse)
- Armstrong wird auf Desktop in `PortalLayout` immer gerendert (`<ArmstrongContainer />`) und in `ArmstrongContainer.tsx` via `createPortal(..., document.body)` direkt in den `body` geportalt.
- Es gibt 2 Zustände:
  1) Collapsed Orb (frei schwebend, soll rechts unten starten, klickbar, draggable, file-drop)
  2) Expanded Panel (unten rechts „angedockt“, nicht draggable)

UI/UX-Flow (wie es aktuell gedacht ist)
- Klick auf Orb → `toggleArmstrongExpanded()` (öffnet Panel)
- Klick auf Mic → `voice.toggleVoice()` ohne Expand (durch `e.stopPropagation()`)
- Drag am Orb → `useDraggable` verschiebt Position (persistiert in localStorage unter `armstrong-orb-position`)
- Datei auf Orb droppen → Expand + (später) Datei als Kontext

Hauptfehler gefunden: Warum Orb links oben erscheint & „Drag“ scheinbar nicht geht
- In `ArmstrongContainer.tsx` wird beim Collapsed Orb folgendes gemacht:

  - Es gibt ein `style={{ position:'fixed', left: position.x, top: position.y }}` am Orb.
  - Danach wird `{...dragHandleProps}` gespreadet (Zeile ~210).
  - `dragHandleProps` enthält ebenfalls ein `style` (Cursor + userSelect).

  Ergebnis: Das spätere Spread überschreibt den vorherigen `style` komplett.
  Dadurch gehen `left` und `top` verloren → der Orb landet im Standardfluss bei (quasi) links oben, und Positionsupdates aus `useDraggable` sind nicht sichtbar. Das erklärt exakt beide Symptome:
  - „erscheint links oben“
  - „man kann ihn nicht bewegen“ (Position ändert sich intern, aber wird nicht gerendert)

Sekundärer UX-Bug (nach Fix sichtbar): Drag vs Click
- `useDraggable` setzt `isDragging` beim `mousedown` und wieder `false` beim `mouseup`.
- Ein `click` feuert nach `mouseup` → zu diesem Zeitpunkt ist `isDragging` bereits wieder `false`.
- Folge: Nach einem Drag kann trotzdem ein Click passieren und der Orb expandiert „aus Versehen“.
- Das ist nicht der Root Cause, aber ein wichtiger UX-Fix, damit „Drag fühlt sich wie Drag an“.

Bild-Referenz (Smile / Friendly Face) – was wir übernehmen
Das hochgeladene Icon hat charakteristische Elemente:
- Außenring / „Glasrim“ (glänzende Ringkante)
- Inneres dunkleres „Visor“-Fenster (oben größer, unten eine klare Kurve)
- Ein freundliches „Smile“-Gefühl entsteht durch:
  - eine weiche, dunklere Bogenfläche (wie ein Visor/Mundbereich)
  - eine sehr subtile helle Kante/Reflexion entlang dieses Bogens
- Oben links ein kleiner, heller Glint für 3D-Tiefe
- Insgesamt: edel, technisch, sympathisch – nicht kindisch

Gewünschtes Redesign
- Weg vom Kupfer/Rot hin zu „Frozen Dark Grey“:
  - Graphit/Steel-Basis
  - kühle, frostige Highlights (leicht bläulich)
  - Halo-Glow sehr subtil, „frostig“, nicht neon

Umsetzung (geänderte Planung) — Schritte & Dateien

1) Funktions-Fix: Style-Override reparieren (Position + Drag wieder sichtbar)
Datei: `src/components/portal/ArmstrongContainer.tsx`

Änderung:
- `dragHandleProps.style` darf den Orb-Style nicht überschreiben.
- Wir mergen Styles explizit:

  - Variante A (empfohlen, sauber):
    - `const { onMouseDown, style: dragStyle } = dragHandleProps;`
    - `onMouseDown={onMouseDown}`
    - `style={{ position:'fixed', left: position.x, top: position.y, ...dragStyle }}`

  - Zusätzlich: `cursor-pointer` Klasse entfernen/relativieren, damit Cursor aus Inline-Style konsistent ist.

Erwartetes Ergebnis:
- Orb erscheint wieder an berechneter Startposition (rechts unten)
- Drag bewegt sichtbar den Orb

2) UX-Fix: Drag darf nicht automatisch Expand auslösen
Dateien: 
- `src/hooks/useDraggable.ts`
- `src/components/portal/ArmstrongContainer.tsx`

Option 1 (empfohlen, robust): `useDraggable` erweitert um „didDrag“ / „click suppression“
- In `useDraggable`:
  - Tracke Bewegung ab Threshold (z.B. 4–6px).
  - Setze `didDragRef = true`, sobald der Threshold überschritten ist.
  - Exponiere `didDrag` (oder `consumeDidDrag()`), damit Consumer einen unmittelbar folgenden Click ignorieren kann.
- In `ArmstrongContainer`:
  - `handleOrbClick` ignoriert Expand, wenn `didDrag` gerade passiert ist.

Option 2 (minimal, weniger sauber): Click-Unterdrückung im Container per Zeit/Distance-Heuristik
- Nicht ideal, weil `mousemove` in Hook hängt.

Erwartetes Ergebnis:
- „Festhalten und ziehen“ fühlt sich stabil an
- Kein „Oops expand“ nach Drag

3) Mic-Button darf niemals Drag starten
Datei: `src/components/portal/ArmstrongContainer.tsx`

Änderung:
- Am Mic-Button zusätzlich `onMouseDown={(e) => e.stopPropagation()}` (und optional `onPointerDown`), damit der Parent-Drag nicht anspringt, wenn man nur Voice starten will.

Erwartetes Ergebnis:
- Voice-Klick bleibt „präzise“
- Drag startet nur, wenn man den Orb selbst greift

4) Startposition wirklich rechts unten (und Recovery, falls localStorage Müll enthält)
Dateien:
- `src/hooks/useDraggable.ts` (optional)
- `src/components/portal/ArmstrongContainer.tsx`
- optional: `src/hooks/usePortalLayout.tsx` (Migration)

Maßnahmen:
- Entferne für den Orb den harten `-100` Offset aus der Default-Position (oder mache ihn konfigurierbar), weil das „nicht wirklich bottom-right“ wirkt.
- Für Armstrong Orb:
  - Entweder: `useDraggable` bekommt eine Option `bottomOffset` (für andere Widgets weiterhin nutzbar).
  - Oder: In `ArmstrongContainer` wird eine `initialPosition` berechnet, die wirklich `bottom-right` ist.
- Zusätzlich: Validierung beim Mount:
  - Wenn `position` sehr nah an (padding,padding) ist und kein gültiger Storage existiert → `resetPosition()` ausführen.
- Optional (sauber): Storage-Key versionieren:
  - von `armstrong-orb-position` → `armstrong-orb-position-v2` (damit alte Werte nicht stören)
  - oder Migration in `usePortalLayout` erweitern und den neuen Key auch einmalig löschen.

Erwartetes Ergebnis:
- Standard: Orb startet rechts unten
- Wenn User ihn verschiebt, bleibt Position erhalten
- Keine „left-top“ Überraschungen durch alte Werte

5) File-Drop UX stabilisieren (ohne Feature-Overkill)
Datei: `src/components/portal/ArmstrongContainer.tsx`

Verbesserungen:
- Drag-over Visual bleibt, aber wir ergänzen:
  - kleines Label im Overlay: „Datei loslassen“
  - optional: `onDragEnter`/`onDragLeave` sauberer handhaben (DragLeave feuert oft beim Überfahren von Kindern)
- Beim Drop:
  - `setDroppedFile(file)` (State)
  - Expand öffnen
  - Im Expanded Panel Header optional eine kleine „Pending File“-Pill anzeigen (Name + X zum verwerfen)
  - (Das eigentliche „auslesen“ kann als nächster Schritt kommen: FileReader für txt/md/csv, xlsx für Excel ist bereits installiert, Bilder als Preview; komplexere Dokumente via Backend-Funktion.)

Erwartetes Ergebnis:
- Drop fühlt sich zuverlässig an
- User versteht sofort, dass Upload erkannt wurde

6) Frozen Dark Grey Orb + Smile (Design neu, nah am hochgeladenen Referenz-Feeling)
Datei: `src/index.css` (Armstrong Orb Design System Block)

Änderungen an Tokens (Beispielpalette, final nach Feintuning):
- `--armstrong-orb-graphite` (Basis, dunkel)
- `--armstrong-orb-steel` (Mid)
- `--armstrong-orb-frost` (kühler Highlight)
- `--armstrong-orb-visor` (sehr dunkel, für Face/Smile Bereich)
- `--armstrong-orb-glow` (sehr subtil, frostig)

Neuer Aufbau der Orb-Optik (orientiert am Bild):
- Layer A: Outer rim / ring highlight (radial gradient, „glasige Kante“)
- Layer B: Main body (radial gradient mit top-left glint)
- Layer C: Inner visor / smile bowl
  - als inneres Overlay (Pseudo-Element oder innere absolute Div)
  - elliptische Form, die oben groß beginnt und unten einen weichen Bogen bildet
- Layer D: Sehr subtile Smile-Kante (thin highlight), damit es „freundlich“ wirkt, ohne Comic zu werden
- Glow: kühler Halo, stark reduziert, damit es „frozen“ und edel bleibt

Markup-Entscheidung (für stabile Kontrolle):
- Statt mehrere inline-Divs in `ArmstrongContainer` für glints/smile:
  - möglichst in CSS (Pseudo-Elemente) abbilden
  - im React-Markup nur noch: Orb-Container + Mic-Button + optional Drop-Overlay
Das macht das Design konsistenter und leichter iterierbar.

7) Fallback, falls Drag auf bestimmten Geräten nicht zuverlässig ist
- Wenn nach den Fixes (Style-Merge + didDrag suppression + Mic stopPropagation) Drag trotzdem auf einem Gerät nicht funktioniert:
  - Option „Drag deaktivieren“ (Feature-Flag / simple Condition)
  - Orb dauerhaft rechts unten fixieren (ohne useDraggable), aber Click/Mic/Drop bleiben.

Testplan (E2E manuell, wichtig für UX)
1) Desktop /portal laden: Orb startet rechts unten.
2) Orb klicken: expandiert.
3) Minimize: collapses zurück, Position bleibt.
4) Drag: Orb lässt sich bewegen, ohne danach zu expandieren.
5) Mic klicken: Voice startet/stopt, Orb expandiert nicht, Drag startet nicht.
6) Datei über Orb ziehen: Drop-State + Hinweis erscheint; Drop öffnet Panel.
7) Refresh: Orb bleibt an letzter Position (oder sauber rechts unten, wenn Storage invalid).
8) Mobile (breite <768): Orb wird nicht gerendert (bestehendes Verhalten), mobile bottom sheet weiterhin ok.

Betroffene Dateien (nach heutigem Stand)
- `src/components/portal/ArmstrongContainer.tsx` (Fix style merge, didDrag handling, mic mousedown stop, drop UX)
- `src/hooks/useDraggable.ts` (didDrag/threshold + optional bottomOffset)
- `src/index.css` (Frozen Dark Grey Orb Design + Smile/Visor neu)
- optional: `src/hooks/usePortalLayout.tsx` (Migration/Key-reset für neue Position-Keys)

Warum das die aktuelle Blockade löst
- Der Kernbug ist deterministisch: `dragHandleProps.style` überschreibt `left/top`. Sobald wir das mergen statt überschreiben, sind Position und Drag visuell wieder korrekt.
- Danach glätten wir die UX (kein Expand nach Drag, Mic nicht dragbar) und bringen den Look Richtung Referenzbild (frozen dark grey + visor-smile).
