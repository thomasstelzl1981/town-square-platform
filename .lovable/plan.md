
# Armstrong Rundes Mini-Chat — Mit Drag-and-Drop

## Konzept

Ein rundes Chat-Widget (150px Durchmesser ≈ 4cm) mit Input, Upload und Send — **vollständig draggable**. Der `useDraggable` Hook bleibt erhalten, nur die komplexen Planet-CSS-Styles werden durch einfache Tailwind-Klassen ersetzt.

```text
MINIMIERT — Rundes Mini-Chat (150px ⌀, DRAGGABLE):
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                                                  ┌───────────┐     │
│                                                  │    🤖     │     │
│                                                  │ ┌───────┐ │     │
│                                         ↔        │ │Fragen │ │     │
│                                        Drag      │ └───────┘ │     │
│                                                  │  📎   ➤  │     │
│                                                  └───────────┘     │
│                                                  150px rund        │
│                                                  Position: frei    │
└────────────────────────────────────────────────────────────────────┘

EXPANDIERT — Chat-Panel (320x500px, DRAGGABLE):
┌────────────────────────────────────────────────────────────────────┐
│                                              ┌─────────────────┐   │
│                                              │ Armstrong ↔ ─ ✕ │   │
│                                              ├─────────────────┤   │
│                                              │                 │   │
│                                              │   Chat Panel    │   │
│                                              │   (voll)        │   │
│                                              │                 │   │
│                                              ├─────────────────┤   │
│                                              │ Nachricht... ➤  │   │
│                                              └─────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

---

## Technische Änderungen

### 1. ArmstrongContainer.tsx — Rundes Mini-Chat mit Drag

**Minimierter Zustand (neu):**
- Container: 150x150px, `rounded-full`
- Hintergrund: Einfacher Gradient (`bg-gradient-to-br from-primary to-primary/80`)
- Inhalt: Bot-Icon, Input-Feld (rund), Upload + Send Buttons
- **Drag-Handle**: Gesamter Container ist draggbar
- **Klick auf Input/Buttons** → Expandiert zum vollen ChatPanel

**Expandierter Zustand (bleibt ähnlich):**
- Container: 320x500px, `rounded-2xl`
- Header als Drag-Handle (wie bisher)
- ChatPanel im Body

```text
Code-Struktur:

// MINIMIERT: Rundes Widget
<div 
  style={{ left: position.x, top: position.y }}
  {...dragHandleProps}
  className="fixed z-[60] h-[150px] w-[150px] rounded-full 
             bg-gradient-to-br from-primary to-primary/80
             shadow-xl flex flex-col items-center justify-center p-3"
>
  <Bot icon />
  <input placeholder="Fragen..." onFocus={expand} />
  <div className="flex gap-2">
    <button upload />
    <button send />
  </div>
</div>

// EXPANDIERT: Chat-Panel
<div 
  style={{ left: position.x, top: position.y }}
  className="fixed z-[60] w-80 h-[500px] rounded-2xl ..."
>
  <header {...dragHandleProps}>Drag-Handle</header>
  <ChatPanel />
</div>
```

### 2. CSS bereinigen — Planet-Styles entfernen

**Datei:** `src/index.css` (Zeilen 536-602)

Die komplexen 3D-Gradient-Styles werden vollständig entfernt:
- `.armstrong-planet`
- `.armstrong-planet:hover`
- `.dark .armstrong-planet`
- `.dark .armstrong-planet:hover`

Diese ca. 67 Zeilen CSS werden gelöscht und durch einfache Tailwind-Klassen im TSX ersetzt.

### 3. ArmstrongPod.tsx — Löschen

Diese Komponente wird nirgends mehr importiert (nur Kommentare verweisen darauf) und ist ein Artefakt.

### 4. usePortalLayout.tsx — Aufräumen

- Debug-Log entfernen (Zeile 80-87 in ArmstrongContainer)
- `console.error` entfernen (Zeile 270)
- Kein weiterer Umbau nötig — der Hook funktioniert

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/portal/ArmstrongContainer.tsx` | Rewrite: Rundes Mini-Chat mit Input/Upload/Send |
| `src/components/portal/ArmstrongPod.tsx` | **Löschen** — unbenutzt |
| `src/index.css` | Zeilen 536-602 entfernen (`.armstrong-planet`) |
| `src/hooks/usePortalLayout.tsx` | Debug-Log entfernen |

---

## Design-Spezifikation

### Rundes Mini-Chat (Minimiert)

| Element | Spezifikation |
|---------|---------------|
| **Container** | 150x150px, `rounded-full`, draggable |
| **Hintergrund** | `bg-gradient-to-br from-primary to-primary/80` |
| **Shadow** | `shadow-xl` (einfach, zuverlässig) |
| **Bot-Icon** | `Bot` oder `MessageCircle`, 20x20px, weiß |
| **Input** | `h-8`, `rounded-full`, halbtransparent weiß, zentriert |
| **Buttons** | 28x28px, `rounded-full`, halbtransparent |
| **Schrift** | `text-white`, 11-12px |

### Hover/Drag-Feedback

| Zustand | Effekt |
|---------|--------|
| **Hover** | `hover:scale-105`, `hover:shadow-2xl` |
| **Dragging** | `cursor-grabbing`, `opacity-90` |
| **File-Drop** | `ring-2 ring-white/50` |

---

## Was bleibt erhalten

- **useDraggable Hook** — Vollständig, mit Position-Persistenz
- **ChatPanel** — Unverändert (alle Funktionen)
- **File Drag-and-Drop** — Weiterhin im Widget möglich
- **ArmstrongSheet** — Mobile Bottom-Sheet unverändert
- **ArmstrongInputBar** — Mobile Input-Bar unverändert
- **SystemBar Toggle** — Rocket-Button funktioniert weiter
- **Self-Healing** — Off-Screen-Detection bleibt

---

## Erwartetes Ergebnis

1. **Sofort sichtbar** — Rundes Widget rechts unten
2. **Draggable** — Frei positionierbar per Maus
3. **Funktional** — Input + Upload + Send direkt sichtbar
4. **Zuverlässig** — Einfaches CSS, keine komplexen Animationen
5. **Responsive** — Auf Mobile weiterhin InputBar + Sheet
