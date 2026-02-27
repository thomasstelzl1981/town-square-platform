

## Fahrzeugbild: Upload + Fallback-Logik

### Problem
Fahrzeugkarten in MOD-17 nutzen hardcodierte Unsplash-URLs (`VEHICLE_IMAGES` Map). Es gibt kein Upload-Feld und keine `image_url`-Spalte auf `cars_vehicles`. Wenn Marke/Modell nicht in der Map stehen, wird ein generisches Auto-Bild angezeigt.

### Loesung

Das bestehende `useImageSlotUpload`-Pattern (SSOT, bereits in MOD-01, MOD-13, MOD-22 im Einsatz) fuer Fahrzeugbilder nutzen.

### Aenderungen

**1. `src/components/portal/cars/CarsFahrzeuge.tsx`**
- `useImageSlotUpload` importieren mit `moduleCode: 'MOD-17'`
- Beim Laden der Fahrzeugliste: `loadSlotImages` fuer jedes Fahrzeug aufrufen, Ergebnis in State `vehicleImages: Record<vehicleId, url>` cachen
- `getImage(v)` anpassen: Zuerst `vehicleImages[v.id]` pruefen, dann Unsplash-Fallback
- Auf der Karte: Dropzone-Overlay hinzufuegen (Kamera-Icon beim Hover), das `uploadToSlot('hero', file)` aufruft

**2. `src/components/portal/cars/VehicleDetailPage.tsx`**
- Im Header-Bereich: Fahrzeugbild mit Upload-Moeglichkeit anzeigen (gleiche `useImageSlotUpload`-Instanz)
- Drag & Drop oder Click-to-Upload auf das Bild

**3. Kein DB-Schema-Change noetig** — Die Bilder werden ueber `document_links` + `documents` gespeichert (bestehende Pipeline), nicht ueber eine neue Spalte.

### Ablauf fuer den Nutzer

```text
Karte zeigt Unsplash-Fallback (wie bisher)
     │
     ▼
Nutzer zieht Bild auf die Karte oder klickt Upload-Icon
     │
     ▼
useImageSlotUpload speichert in tenant-documents/{tenantId}/MOD_17/{vehicleId}/images/hero_...
     │
     ▼
Karte zeigt ab sofort das eigene Bild
     │
     ▼
Erneuter Upload ersetzt das Bild (altes wird archived)
```

### Freeze

MOD-17 ist **frozen**. Bitte explizit sagen: **"UNFREEZE MOD-17"**, dann implementiere ich und freeze danach wieder.

