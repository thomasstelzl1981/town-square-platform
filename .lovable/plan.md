

## Multi-Image pro Slot: Carousel-Erweiterung fuer ImageSlotGrid

### Problem

Aktuell: 1 Bild pro Slot. Beim Upload wird das vorherige Bild archiviert. Mehrere Bilder pro Kategorie (z.B. 3x "Aussen") sind nicht moeglich. Klick oeffnet nur den Datei-Dialog statt eine Bildvorschau.

### Architektur-Aenderung

Das System wird von `1:1` (ein Bild pro Slot) auf `1:N` (mehrere Bilder pro Slot) erweitert.

#### Datenfluss

```text
Slot "exterior"
  ├── Bild 1 (document_links: slot_key='exterior', linked)
  ├── Bild 2 (document_links: slot_key='exterior', linked)
  └── Bild 3 (document_links: slot_key='exterior', linked)
       ↕
  SingleSlot zeigt Bild [activeIndex] mit ◄ ► Pfeilen
  + Badge "2/3"
  + Drop/Klick fuegt NEUES Bild hinzu (statt Ersetzen)
```

### Aenderung 1: `useImageSlotUpload.ts` — Multi-Image Support

| Funktion | Vorher | Nachher |
|----------|--------|---------|
| `uploadToSlot` | Archiviert altes Bild, dann Insert | Insert ohne Archivierung (addiert Bild) |
| `loadSlotImages` | Returns `Record<string, {url, documentId}>` (1 pro Slot) | Returns `Record<string, Array<{url, documentId}>>` (N pro Slot) |
| Neuer Parameter | — | `multiImage?: boolean` in Config (default `false` fuer Abwaertskompatibilitaet) |

Abwaertskompatibilitaet: Wenn `multiImage: false` (Default), bleibt das Verhalten identisch (archiviert + ersetzt). MOD-01 ProfilTab etc. aendern sich nicht.

### Aenderung 2: `ImageSlotGrid.tsx` — Carousel-UI pro Slot

**Neue Props:**

| Prop | Typ | Beschreibung |
|------|-----|-------------|
| `multiImages` | `Record<string, Array<{url: string, documentId: string}>>` | Ersetzt/ergaenzt `images` wenn Multi-Mode aktiv |
| `multiImage` | `boolean` | Aktiviert Multi-Image-Modus |
| `onDeleteByDocId` | `(documentId: string) => void` | Loescht ein spezifisches Bild per Document-ID |

**SingleSlot UI-Aenderungen im Multi-Modus:**

1. **Pfeile:** Links/Rechts `ChevronLeft`/`ChevronRight` Buttons bei Hover (nur wenn >1 Bild)
2. **Counter-Badge:** z.B. "2/3" oben rechts
3. **Klick-Verhalten:** Klick oeffnet Datei-Dialog zum HINZUFUEGEN (nicht Ersetzen)
4. **Hover-Overlay:** "Hinzufuegen" statt "Ersetzen", plus "Loeschen" fuer aktuelles Bild
5. **Multi-Drop:** `multiple: true` in Dropzone — mehrere Dateien gleichzeitig werden sequentiell hochgeladen

### Aenderung 3: `ProjectDataSheet.tsx` — Multi-Mode aktivieren

- `useImageSlotUpload` Config bekommt `multiImage: true`
- State `imageUrls` wird zu `Record<string, Array<{url, documentId}>>` 
- `ImageSlotGrid` bekommt die neuen Props
- Upload-Handler ruft `uploadToSlot` auf ohne Archivierung
- Delete-Handler loescht per `documentId` statt per `slotKey`

### Betroffene Dateien

| # | Datei | Aenderung |
|---|-------|----------|
| 1 | `src/hooks/useImageSlotUpload.ts` | `multiImage` Config, `loadSlotImages` returns Array, `uploadToSlot` conditional archive |
| 2 | `src/components/shared/ImageSlotGrid.tsx` | Multi-Image Props, Carousel-Navigation, Counter-Badge, Multi-Drop |
| 3 | `src/components/projekte/ProjectDataSheet.tsx` | `multiImage: true`, State-Anpassung, neue Handler |

### Nicht betroffen (Abwaertskompatibel)

- MOD-01 ProfilTab (nutzt weiterhin `multiImage: false` Default)
- MOD-22 PMProfil (nutzt weiterhin Single-Mode)
- Keine DB-Migration noetig (`document_links` unterstuetzt bereits N Eintraege pro `slot_key`)

