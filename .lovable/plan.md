

# Recherche-Modul: Widget-Sizing und Loeschfunktion reparieren

## Probleme

### 1. Widgets haben unterschiedliche Groessen
Die gruene Demo-Kachel fuellt die gesamte WidgetCell (aspect-square) korrekt aus, weil sie `h-full` hat. Die kleinen Entwurfs-Kacheln (`ResearchOrderWidget`) und die CTA-Kachel (`ResearchOrderCreateWidget`) hingegen fehlt `h-full` — sie sind nur so hoch wie ihr Inhalt (ca. 100-120px statt die volle Zellenhoehe).

### 2. CTA-Kachel zu klein
`ResearchOrderCreateWidget` nutzt `min-h-[120px]` statt `h-full`, daher ist sie viel kleiner als die Demo-Kachel.

### 3. Loeschfunktion reagiert nicht
Das Problem: Der `AlertDialogTrigger`-Button hat zwar `e.stopPropagation()`, aber die `AlertDialog`-Komponente (uncontrolled) wird innerhalb der klickbaren Card gerendert. Beim Klick auf den Trash-Button wird `stopPropagation` aufgerufen, aber der Card-`onClick` kann trotzdem feuern (je nach Event-Timing), was den `activeOrderId` umschaltet und das Widget ggf. deselektiert. Die Loesung: AlertDialog auf controlled umstellen (mit `open`/`onOpenChange` State), damit der Dialog zuverlaessig oeffnet.

## Aenderungen

### Datei: `ResearchOrderWidget.tsx`

**ResearchOrderWidget:**
- Card: `h-full flex flex-col` hinzufuegen, damit die Karte die volle WidgetCell ausfuellt
- Innerer Content: `flex-1` / `justify-between` fuer gleichmaessige Verteilung
- Loeschfunktion: Von uncontrolled `AlertDialog` auf controlled mit `useState` umstellen (wie `WidgetDeleteOverlay` Pattern)

**ResearchOrderCreateWidget:**
- `min-h-[120px]` entfernen, `h-full` hinzufuegen — damit fuellt die CTA-Kachel die gesamte Zelle aus

### Technische Details

```
ResearchOrderWidget Card:
  vorher:  'glass-card p-4 cursor-pointer ...'
  nachher: 'glass-card p-4 cursor-pointer h-full flex flex-col ...'

ResearchOrderCreateWidget Card:
  vorher:  '... min-h-[120px] border-dashed'
  nachher: '... h-full border-dashed'

Delete AlertDialog:
  vorher:  uncontrolled (AlertDialogTrigger)
  nachher: controlled (useState open/setOpen, button onClick -> setOpen(true))
```

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `ResearchOrderWidget.tsx` | Card h-full + flex-col, Delete auf controlled umstellen, CTA h-full |

