
# Fix: E-Mail verschwunden aus KI Office Menüleiste

## Problem

In der Datei `SubTabs.tsx` (Level-3 Navigation / Menüleiste) werden die Tiles **E-Mail**, **Kontakte** und **Kalender** auch auf dem **Desktop** herausgefiltert. Der Code prueft `isTileHiddenOnMobile()` — eine Funktion, die nur fuer Mobilgeraete gedacht ist — aber wendet sie faelschlicherweise auch auf die Desktop-Ansicht an.

**Zeile 30-32 in SubTabs.tsx:**
```typescript
// Filter tiles for mobile — hide desktop-only tabs
const visibleTiles = (module.tiles || []).filter(
  tile => !isTileHiddenOnMobile(moduleBase, tile.path)
);
```

Da die Komponente auf Mobile bereits in Zeile 24 (`if (isMobile) return null`) komplett ausgeblendet wird, laueft dieser Filter **nur auf Desktop** — und entfernt dort faelschlicherweise E-Mail, Kontakte und Kalender.

## Loesung

Den `isTileHiddenOnMobile`-Filter aus `SubTabs.tsx` entfernen, da er auf Desktop nicht gelten soll und auf Mobile die Komponente ohnehin nicht gerendert wird.

**Vorher:**
```typescript
const visibleTiles = (module.tiles || []).filter(
  tile => !isTileHiddenOnMobile(moduleBase, tile.path)
);
```

**Nachher:**
```typescript
const visibleTiles = module.tiles || [];
```

## Betroffene Datei

- `src/components/portal/SubTabs.tsx` — Eine Zeile aendern (Filter entfernen)

## Ergebnis

Die KI Office Menüleiste zeigt wieder alle 7 Tiles: **E-Mail**, Brief, Kontakte, Kalender, Widgets, WhatsApp, Videocalls.
