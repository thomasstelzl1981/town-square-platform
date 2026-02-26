

# Befund und Plan

## 1. Upload-System: FUNKTIONIERT

Der DB-Check bestaetigt: Avatar-Record existiert korrekt in `documents` + `document_links` mit `slot_key='avatar'`, `link_status='linked'`, `extraction_status='skipped'`, `object_type='profil'`. Die gesamte Pipeline (Storage → documents → document_links → storage_nodes) ist repariert. Das gilt fuer alle drei Module (MOD-01, MOD-13, MOD-22), da sie denselben `useImageSlotUpload` Hook verwenden.

## 2. UI-Problem: Avatar-Upload-Feld zu gross

Im Screenshot sieht man das Problem: Wenn die RecordCard geoeffnet ist, steht links ein kleiner Avatar-Kreis (h-16 = 64px) und rechts daneben ein riesiges rechteckiges Upload-Feld (ImageSlotGrid mit `HEIGHT: 140px`). Das sieht unproportional aus.

**Aktuelles Layout (Zeilen 425-443):**
```text
┌──────────────────────────────────────────┐
│ [Avatar 64px]  [ImageSlotGrid 140px hoch]│
│  (winzig)       (riesig, rechteckig)     │
└──────────────────────────────────────────┘
```

**Neues Layout:**
```text
┌──────────────────────────────────────────┐
│ [Avatar-Upload-Zone 80px, rund]          │
│  Click/Drop zum Aendern                  │
│  "Profilbild" Label darunter             │
│                                          │
│ [Vorname] [Nachname] [Anzeigename]       │
│ [E-Mail]  [System-E-Mail]               │
└──────────────────────────────────────────┘
```

## 3. Umsetzung (1 Datei)

**Datei:** `src/pages/portal/stammdaten/ProfilTab.tsx` (MOD-01, nicht frozen)

**Aenderung Zeilen 423-443:** Den Avatar-Bereich umbauen:
- Avatar-Kreis vergroessern auf `h-20 w-20` (80px)
- ImageSlotGrid entfernen, stattdessen den Avatar selbst als Dropzone nutzen (react-dropzone direkt um den Avatar)
- Hover-Overlay auf dem Avatar: Kamera-Icon + "Aendern"
- Loeschen-Button als kleines X-Badge oben rechts am Avatar
- Kein separates Upload-Rechteck mehr

**Keine weiteren Dateien betroffen:**
- `useImageSlotUpload.ts` — bleibt unveraendert
- `ImageSlotGrid.tsx` — wird weiterhin fuer MOD-13 und MOD-22 verwendet, nur nicht mehr fuer den Avatar
- `designManifest.ts` — keine Aenderung noetig

