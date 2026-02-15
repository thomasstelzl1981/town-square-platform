

# Meeting Recorder Widget — Visuelles Redesign

## Was sich aendert

### 1. Hintergrund: Glasig-roetlicher Gradient
- Aktuell: subtiler `from-red-500/10 to-orange-600/5` Gradient mit 30% Opacity
- Neu: Kraeftigerer, warmer Gradient `from-rose-500/15 via-red-500/10 to-amber-500/8` mit hoeherer Opacity
- Zusaetzlich: Dezenter radialer Glow-Effekt in der Mitte (wie ein warmes Licht)
- Card-Border wechselt zu `border-rose-500/25`

### 2. Record-Button statt blauem "Meeting starten"-Button
- Gleicher Stil wie der Radio-Widget Play-Button: runder Glass-Button (h-12 w-12)
- `backdrop-blur-sm`, `border`, halbtransparenter Hintergrund
- Icon: Ausgefuellter Kreis (Record-Symbol) statt Play-Dreieck
- Idle: `bg-rose-500/10 border-rose-500/30 text-rose-500`, Hover: `bg-rose-500/20`
- Recording: Pulsierender roter Record-Button
- Kein Text-Label auf dem Button, nur das Icon (wie beim Radio)
- Text "Meeting starten" wird zum kleineren Untertitel unter dem Button

### 3. Fortschrittsbalken (90 Minuten) im Recording-Zustand
- Horizontaler Progress-Bar am unteren Rand der Kachel
- Zeigt den Fortschritt von 0 bis 90 Minuten an
- Farbe: `bg-rose-500` auf `bg-rose-500/10` Track
- Wechselt ab 80 Minuten auf warnendes Orange/Gelb
- Hoehe: 3px, abgerundete Ecken

### 4. Timer im Recording-Zustand
- Bereits vorhanden (`formatDuration`), bleibt erhalten
- Wird etwas prominenter dargestellt (groessere Schrift, tabular-nums)
- Format: `MM:SS` bzw. `H:MM:SS`

## Technische Aenderungen

### `src/components/dashboard/MeetingRecorderWidget.tsx`
- Gradient-Overlay durch kraeftigeren roetlichen Gradient ersetzen
- Im Idle-Zustand: Runden Glass-Record-Button (wie Radio-Widget) statt `<Button>`
- Im Recording-Zustand: Progress-Bar hinzufuegen (`session.durationSec / (90*60) * 100`%)
- Stop-Button ebenfalls als runden Glass-Button gestalten (Square-Icon, destructive)
- Dezenter Untertitel "Aufnahme starten" unter dem Record-Button

### Keine weiteren Dateien betroffen
- `useMeetingRecorder.ts` bleibt unveraendert (Logik aendert sich nicht)
- `MeetingCountdownOverlay.tsx` bleibt unveraendert
