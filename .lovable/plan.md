
# Mobile Layout-Anpassungen

## Problem (aus dem Screenshot)
1. **Header (blauer Bereich) zu flach**: Logo und Buttons sitzen zu nah am oberen Bildschirmrand (Statusleiste). Der Header braucht ca. 5mm mehr Hoehe nach oben (mehr Top-Padding).
2. **Luecke zwischen letzter Menuezeile und Chat-Eingabe**: Zwischen "Immo Suche" und der Eingabeleiste ist sichtbarer Leerraum, der geschlossen werden soll.

## Aenderungen

### 1. SystemBar -- Mehr Hoehe (mobile)
**Datei:** `src/components/portal/SystemBar.tsx`
- Mobile Header von `h-12` auf `h-14` erhoehen
- Zusaetzlich `pt-2` (Top-Padding) hinzufuegen, damit die Buttons und das Logo nach unten ruecken und Abstand zur Statusleiste entsteht

### 2. MobileBottomBar -- Luecke schliessen
**Datei:** `src/components/portal/MobileBottomBar.tsx`  
- `pb-3 pt-1` im Input-Container auf `pb-2 pt-0.5` reduzieren, um den Abstand zwischen letztem Menuepunkt und Eingabefeld zu minimieren

### 3. MobileHomeModuleList -- Unteren Abstand reduzieren
**Datei:** `src/components/portal/MobileHomeModuleList.tsx`
- `pb-4` auf `pb-1` reduzieren, damit die Liste naeher an die Bottom-Bar heranrueckt

---

**Technische Details:**
- SystemBar Zeile 140: `h-12` wird zu `h-14 pt-2`
- MobileBottomBar Zeile 119: `pb-3 pt-1` wird zu `pb-2 pt-0.5`
- MobileHomeModuleList Zeile 53: `pb-4` wird zu `pb-1`
