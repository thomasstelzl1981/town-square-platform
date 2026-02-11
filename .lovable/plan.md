

# Armstrong Redesign: Clean Right-Side Panel

## Konzept

Wenn Armstrong geoeffnet wird, erscheint er als durchsichtiges, milchiges Panel ueber die gesamte rechte Seite. Der restliche Desktop-Inhalt rutscht nach links, nichts wird verdeckt.

### Expanded State (NEU)

```text
+--SystemBar---------------------------------------------+
+--TopNav------------------------------------------------+
|                              |                          |
|   Main Content               |   A R M S T R O N G     |
|   (schrumpft)                |                          |
|                              |   [Drag & Drop Upload]   |
|                              |                          |
|                              |   Chat-Nachrichten        |
|                              |   (ohne Input-Feld)      |
|                              |                          |
|                              |      [Mic Button]        |
|                              |                          |
+------------------------------+--------------------------+
```

- Breite: ~380px
- Hintergrund: Milchglas (bg-white/60 dark:bg-black/40 backdrop-blur-xl)
- Nur "ARMSTRONG" als Wortmarke zentriert oben (wie im Header)
- Kein Text-Eingabefeld -- nur Voice (Mikrofon-Button)
- Kein Kontext-Badge / Modulzuordnung
- Gesamte Flaeche ist Upload-Zone (Drag & Drop)
- Chat-Verlauf wird angezeigt, aber minimalistisch
- Close/Minimize Buttons oben rechts

### Collapsed State (BLEIBT)

Der Orb bleibt wie er ist -- keine Aenderung.

## Betroffene Dateien

| # | Datei | Aenderung |
|---|---|---|
| 1 | `src/components/portal/PortalLayout.tsx` | Main-Content bekommt dynamische rechte Margin wenn Armstrong expanded ist. Armstrong wird als festes Layout-Element statt Portal eingebunden |
| 2 | `src/components/portal/ArmstrongContainer.tsx` | Expanded-State komplett neu: Full-Height rechte Spalte, milchiger Hintergrund, kein Text-Input, nur Voice + Upload + Chat |
| 3 | `src/components/chat/ChatPanel.tsx` | Neuer `position="stripe"` Modus: Kein Input-Feld, kein Context-Badge, nur Messages + Voice + Upload |

## Technische Details

### 1. PortalLayout.tsx -- Layout-Shift

Desktop-Layout wird von einer einfachen Spalte zu einem flexiblen 2-Spalten-Layout wenn Armstrong expanded ist:

```text
<div className="flex-1 flex overflow-hidden">
  <main className="flex-1 overflow-y-auto">
    <Outlet />
  </main>
  {armstrongExpanded && <ArmstrongStripe />}
</div>
```

Der Hauptinhalt schrumpft automatisch, Armstrong nimmt ~380px rechts ein. Kein Overlay, kein Portal -- normaler Layoutfluss.

### 2. ArmstrongContainer.tsx -- Zwei Modi

**Collapsed (Orb):** Bleibt exakt wie bisher -- draggable, Mikrofon, File-Drop.

**Expanded (Stripe):** Komplett neues Design:
- Feste Breite: `w-[380px]`
- Volle Hoehe: `h-full`
- Milchglas: `bg-white/60 dark:bg-black/40 backdrop-blur-xl border-l border-white/20`
- Header: Nur "ARMSTRONG" Wortmarke (tracking-[0.2em], text-sm, zentriert) + Close-Button
- Body: ScrollArea mit Chat-Nachrichten
- Upload-Zone: Gesamter Bereich ist Drag & Drop (subtiler Upload-Hinweis)
- Footer: Nur Mikrofon-Button (gross, zentriert, wie im Orb)
- Kein Text-Input
- Kein Context-Badge
- Kein Modul-Label

### 3. ChatPanel.tsx -- Stripe-Modus

Neuer `position="stripe"` Modus:
- Kein Header (wird von ArmstrongContainer gehandhabt)
- Kein Context-Badge
- Kein Input-Feld
- Kein Upload-Bereich (wird extern gehandhabt)
- Nur Messages-ScrollArea mit Loading-Indicator
- Transparenter Hintergrund

## Design-Sprache

- Hintergrund: `bg-white/60 dark:bg-card/40 backdrop-blur-xl`
- Border: `border-l border-border/30`
- Wortmarke: `font-sans font-semibold tracking-[0.2em] text-sm text-foreground/70`
- Upload-Hinweis: Subtiler Text `text-xs text-muted-foreground/40` ("Dateien hierher ziehen")
- Mikrofon-Button: Gleicher Stil wie im Orb (armstrong-btn-glass), zentriert unten
- Uebergaenge: `transition-all duration-300` fuer smooth open/close

## Keine DB-Aenderungen

Rein visuelles Redesign.
