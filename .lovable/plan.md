

# CI-Anpassung: Hellerer Hintergrund + Persistenter KI-Chat mit Upload

## Übersicht

Diese Anpassung bringt einen moderneren, freundlicheren Look inspiriert von Perplexity:
- Warmer, heller "Pergament"-Hintergrund (nicht weiß, sondern cremig-durchscheinend)
- KI-Chat immer sichtbar als rechter Strip
- Drag-and-Drop Upload-Zone im Chat für Dokumente

## Teil 1: Hintergrund-Anpassung (Pergamentfarben)

### CSS-Variablen anpassen (src/index.css)

Der Dark-Mode Hintergrund wird von fast-schwarz auf einen hellen, warmen Ton umgestellt:

| Variable | Aktuell | Neu (Perplexity-inspiriert) |
|----------|---------|------------------------------|
| `--background` | `222 47% 6%` (Dunkelblau) | `40 30% 96%` (Warm Cream) |
| `--foreground` | `210 40% 98%` (Fast weiß) | `222 47% 11%` (Dunkel) |
| `--surface` | `222 30% 10%` | `40 20% 94%` (Leicht dunkler Cream) |
| `--surface-2` | `222 35% 8%` | `40 15% 92%` |

Die Karten (`--card`) und Sidebar (`--sidebar-background`) bleiben kontrastreich, damit die Kacheln weiterhin gut hervorstechen.

### Farbschema-Konzept

```
Hintergrund: Warm Cream (#F7F5F0) - pergamentfarben
Karten:      Weiß mit leichtem Schatten - bleiben prominent
Sidebar:     Leicht dunkler Cream - subtile Abgrenzung
Text:        Dunkelgrau/Schwarz - gute Lesbarkeit
```

## Teil 2: KI-Chat immer sichtbar (rechter Strip)

### PortalLayout.tsx anpassen

Der Chat wird von "toggle on click" zu "always visible on desktop" geändert:

**Vorher:**
- Floating Button zeigt Chat bei Klick
- Chat ist standardmäßig geschlossen

**Nachher:**
- Chat-Strip auf Desktop (lg+) immer sichtbar rechts
- Nur auf Mobile bleibt der Toggle-Button
- Layout passt sich an: `main` bekommt `mr-[380px]` auf Desktop

### Neues Layout-Konzept

```
┌──────────────────────────────────────────────────────────────────────┐
│  HEADER                                                              │
├──────────┬───────────────────────────────────────────┬───────────────┤
│          │                                           │               │
│ SIDEBAR  │              MAIN CONTENT                 │   KI-CHAT    │
│  (Nav)   │              (Module)                     │   STRIP      │
│          │                                           │  (380px)     │
│          │                                           │               │
│          │                                           │  ┌─────────┐ │
│          │                                           │  │ Upload  │ │
│          │                                           │  │  Zone   │ │
│          │                                           │  └─────────┘ │
└──────────┴───────────────────────────────────────────┴───────────────┘
```

## Teil 3: Upload Drag-and-Drop im Chat

### ChatPanel.tsx erweitern

Eine Upload-Zone wird unten im Chat eingefügt (vor dem Input-Feld):

```
┌─────────────────────────────┐
│  AI Assistant  [–] [X]      │
├─────────────────────────────┤
│  Kontext: Portal > Immo     │
├─────────────────────────────┤
│  [Schnellaktionen]          │
├─────────────────────────────┤
│                             │
│      CHAT MESSAGES          │
│                             │
├─────────────────────────────┤
│  ┌───────────────────────┐  │  ← NEU
│  │ 📎 Dokumente ablegen  │  │
│  │    für Analyse        │  │
│  └───────────────────────┘  │
├─────────────────────────────┤
│  [Input] [🎤] [➤]           │
└─────────────────────────────┘
```

### Funktionalität

- Drag-and-Drop Zone im unteren Bereich des Chats
- Akzeptiert PDFs, Excel, Bilder
- Files werden an Storage übergeben (via `sot-dms-upload-url`)
- Verlinkung in Module erfolgt über `document_links`

## Implementierungs-Schritte

| # | Datei | Änderung |
|---|-------|----------|
| 1 | `src/index.css` | Dark-Mode Variablen auf helle Pergamentfarben umstellen |
| 2 | `src/components/portal/PortalLayout.tsx` | Chat-Strip immer sichtbar auf Desktop |
| 3 | `src/components/chat/ChatPanel.tsx` | Upload-Zone mit FileUploader integrieren |
| 4 | `src/index.css` | Text-Farben für hellen Hintergrund anpassen |

## Technische Details

### Neue CSS-Variablen (.dark)

```css
.dark {
  /* Pergament-Hintergrund (warm cream) */
  --background: 40 30% 96%;        /* #F7F5F0 */
  --foreground: 222 47% 11%;       /* Dunkel für Text */
  
  /* Karten bleiben weiß/prominent */
  --card: 0 0% 100%;               /* Reinweiß */
  --card-foreground: 222 47% 11%;
  
  /* Surface Layers (subtil dunkler) */
  --surface: 40 20% 94%;
  --surface-2: 40 15% 92%;
  
  /* Sidebar - leicht abgesetzt */
  --sidebar-background: 40 25% 98%;
  
  /* Borders für hellen Modus */
  --border: 40 20% 88%;
  --border-subtle: 40 15% 85%;
}
```

### ChatPanel mit Upload

```tsx
// Neue Props
interface ChatPanelProps {
  // ... bestehende Props
  onFileUpload?: (files: File[]) => void;
}

// Im Chat vor dem Input
<div className="px-4 pb-2">
  <FileUploader
    onFilesSelected={handleUpload}
    accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg"
    multiple
    label="📎 Dokumente ablegen"
    hint="PDF, Excel, Bilder für Analyse"
    className="text-xs"
  />
</div>
```

## Ergebnis

Nach Umsetzung:
- Moderner, freundlicher Look mit warmem Hintergrund
- KI-Chat ist immer präsent und erreichbar
- Dokumente können direkt im Chat hochgeladen werden
- Kacheln und Karten stechen deutlich vom Hintergrund ab

