

## Demo-Bilder auf der Lennox & Friends Website anzeigen

### Problem

Die vier Profilbilder (Hundepension + Hundefriseur), die im Pet Manager Modul als Demo-Galerie angelegt wurden, erscheinen nur im Zone-1-Profil (`PMProfil.tsx`) als Fallback. Die Zone-3-Seiten (oeffentliche Website) lesen `cover_image_url` und `gallery_images` direkt aus der Datenbank. Dort steht:

- `cover_image_url`: altes Unsplash-Stockfoto
- `gallery_images`: leeres Array `[]`

Deshalb sieht man auf der Website ein fremdes Hundebild statt der vier generierten Profilbilder.

### Loesung

Zwei Aenderungen:

**1. Datenbank aktualisieren** — Die Demo-Bilder als statische URLs in die DB schreiben:

```sql
UPDATE pet_providers
SET cover_image_url = '/shop/lennox-cover-pension.jpg',
    gallery_images = ARRAY[
      '/assets/demo/pm-gallery-pension-1.jpg',
      '/assets/demo/pm-gallery-pension-2.jpg',
      '/assets/demo/pm-gallery-grooming-1.jpg',
      '/assets/demo/pm-gallery-grooming-2.jpg'
    ]
WHERE id = 'd0000000-0000-4000-a000-000000000050';
```

Problem: Die Assets liegen unter `src/assets/demo/` und werden von Vite als Imports verarbeitet — sie haben zur Laufzeit keine vorhersagbare URL.

Daher besserer Weg: **Die vier Demo-Bilder nach `public/demo/` kopieren**, damit sie als statische URLs erreichbar sind (`/demo/pm-gallery-pension-1.jpg` etc.), und dann die DB mit diesen Pfaden aktualisieren.

**2. Zone-3-Seiten mit Galerie-Anzeige erweitern**

Aktuell zeigen die Partner-Detail-Seiten nur ein einzelnes `cover_image_url`-Bild. Die `gallery_images` werden gar nicht gerendert. Das sollte ergaenzt werden, damit alle vier Bilder sichtbar sind.

### Technische Dateien

| Datei | Aktion |
|-------|--------|
| `public/demo/pm-gallery-pension-1.jpg` | NEU — Kopie aus `src/assets/demo/` |
| `public/demo/pm-gallery-pension-2.jpg` | NEU — Kopie aus `src/assets/demo/` |
| `public/demo/pm-gallery-grooming-1.jpg` | NEU — Kopie aus `src/assets/demo/` |
| `public/demo/pm-gallery-grooming-2.jpg` | NEU — Kopie aus `src/assets/demo/` |
| Migration SQL | NEU — `cover_image_url` und `gallery_images` in `pet_providers` aktualisieren |
| `src/pages/zone3/lennox/LennoxPartnerProfil.tsx` | EDIT — Galerie-Grid unter dem Hero-Bild ergaenzen |
| `src/pages/zone3/lennox/LennoxProviderDetail.tsx` | EDIT — Galerie-Grid unter dem Header ergaenzen |
| `src/engines/demoData/petManagerDemo.ts` | EDIT — `DEMO_LENNOX_SEARCH_PROVIDER.cover_image_url` auf neuen statischen Pfad aendern |

### Ergebnis

- Die Lennox & Friends Partnerseite auf der Website zeigt das erste Pensionsbild als Cover
- Darunter eine Galerie mit allen vier Bildern (2x Hundepension, 2x Hundefriseur)
- Der Pet Manager Profil-Bereich zeigt weiterhin dieselben Bilder als Fallback
