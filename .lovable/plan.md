

## Fix: Portraitfotos besser zentrieren (Kopf nicht abgeschnitten)

### Problem
Die runden Portraitfotos verwenden `object-cover`, was standardmaessig auf die Bildmitte zentriert (`object-position: center`). Bei Portraitfotos, wo der Kopf im oberen Drittel liegt, wird dieser abgeschnitten.

### Loesung
Auf allen 3 Seiten `object-top` zur Image-Klasse hinzufuegen, damit der Fokus auf den oberen Bildbereich (Kopf/Gesicht) gelegt wird.

### Aenderungen

**1. `src/pages/zone3/otto/OttoHome.tsx`** (2 Bilder)
- Zeile 124: `object-cover` → `object-cover object-top`
- Zeile 129: `object-cover` → `object-cover object-top`

**2. `src/pages/zone3/ncore/NcoreHome.tsx`** (1 Bild)
- Zeile 224: `object-cover` → `object-cover object-top`

**3. `src/pages/zone3/zlwohnbau/ZLWohnbauHome.tsx`** (1 Bild)
- Zeile 188: `object-cover` → `object-cover object-top`

Keine weiteren Aenderungen.

