

# Armstrong Chatbot — Kompakt-Redesign: Arbeitsschritte entfernen + Sprachausgabe-Button

## Problem

1. **Linke "Arbeitsschritte"-Spalte** nimmt 220px Platz ein und zeigt meist nur Platzhaltertext — verschwendeter Raum
2. **Sprachausgabe (TTS)** hat keinen sichtbaren Button — der User weiss nicht, wie er Armstrong vorlesen lassen kann
3. **Gesamtbreite** ist 510px auf breitem Viewport — zu viel

## Aenderungen

### 1. Arbeitsschritte-Spalte komplett entfernen (ArmstrongContainer.tsx)

- Die gesamte linke Spalte (Zeilen 331-349) mit `isWideViewport`-Check wird entfernt
- ThinkingSteps werden nur noch **inline** in der Chat-Bubble angezeigt (ist bereits implementiert fuer single-column, Zeilen 382-384)
- Die `isWideViewport`-Variable und zugehoerige Two-Column-Logik (`flex-row`) werden entfernt
- Panel-Breite wird einheitlich auf **380px** gesetzt (statt 510px/315px)

### 2. TTS-Button pro Nachricht hinzufuegen (ArmstrongContainer.tsx)

- `onSpeak` und `isSpeaking` Props an jede `MessageRenderer`-Instanz durchreichen (wie in ChatPanel.tsx bereits gemacht)
- Der Volume2-Button erscheint dann per Hover auf jeder Assistant-Nachricht (bereits in MessageRenderer.tsx implementiert)
- Im Header: VolumeX-Button zum Stoppen wenn gerade gesprochen wird (wie in ChatPanel.tsx)

### 3. Gesamt-Kompaktierung

- Panel-Hoehe von 87.5vh auf **70vh** reduzieren (max-h-[700px])
- Header: Status "Online/Arbeitet" bleibt, aber kompakter
- Input-Bereich bleibt unveraendert

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| src/components/portal/ArmstrongContainer.tsx | Linke Spalte entfernen, Breite auf 380px, TTS-Props an MessageRenderer, Header VolumeX-Button |

## Sprachausgabe-Bedienung nach Redesign

- **Hover ueber eine Armstrong-Antwort** zeigt ein kleines Lautsprecher-Icon (Volume2) oben rechts an der Nachricht
- **Klick darauf** startet die Sprachausgabe via ElevenLabs oder Browser-Fallback
- **Erneuter Klick** oder **VolumeX im Header** stoppt die Ausgabe

## Kein Modul-Freeze betroffen

`src/components/portal/ArmstrongContainer.tsx` liegt nicht in einem Modul-Pfad.

