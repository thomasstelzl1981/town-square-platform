
## PMProfil: Galerie-Grid + Aktivierungs-Toggle

### Aenderung 1: Bilder-Sektion durch RecordCardGallery ersetzen

Die aktuelle Cover+Galerie-Darstellung wird durch das standardisierte `RecordCardGallery`-Grid (4 quadratische Foto-Slots) ersetzt. Das ist das gleiche Format, das auch in allen anderen Akten (Tier-Akte, Mitarbeiter-Akte etc.) verwendet wird.

- Cover-Bild und Galerie werden zusammengefasst zu einem 4er-Grid
- Die Bilder werden aus `pet_providers.gallery_images[]` gelesen/geschrieben
- `cover_image_url` wird aus dem ersten Bild der Galerie abgeleitet (gallery_images[0])
- Upload-Funktion ueber die bekannten Plus-Slots mit Supabase Storage Upload

### Aenderung 2: Profil-Aktivierungs-Toggle (Veroeffentlichung)

Ein Switch-Toggle im Header-Bereich mit Bestaetigungsdialog:

- **Toggle "Profil veroeffentlichen"** — Schaltet das Profil auf der Lennox and Friends Website (Zone 3) frei
- Beim Aktivieren: AlertDialog mit Text "Ihr Profil wird auf der Lennox and Friends Website veroeffentlicht und ist fuer potenzielle Kunden sichtbar. Fortfahren?"
- Speichert den Status in `pet_providers.is_published` (neue DB-Spalte, default false)
- Badge neben dem Toggle zeigt "Live" (gruen) oder "Entwurf" (grau)
- Zone 3 Suche filtert kuenftig nach `is_published = true`

### Technische Details

**Neue DB-Spalte:**
```
ALTER TABLE pet_providers ADD COLUMN is_published boolean DEFAULT false;
```

**Dateien:**

| Datei | Aktion |
|-------|--------|
| `src/pages/portal/petmanager/PMProfil.tsx` | EDIT — Bilder-Card durch RecordCardGallery ersetzen, Toggle + AlertDialog einfuegen |
| Migration | NEU — `is_published` Spalte hinzufuegen |

**Bilder-Upload-Flow:**
1. User klickt Plus-Slot im RecordCardGallery-Grid
2. Datei wird nach `tenant-documents/{tenant_id}/pet-provider/{provider_id}/gallery_{index}.jpg` hochgeladen
3. Signed URL wird in `pet_providers.gallery_images[]` Array gespeichert
4. Erstes Bild wird automatisch als `cover_image_url` gesetzt (fuer Zone 3 Vorschau-Karten)

**Toggle-Logik:**
- Switch im Header neben Speichern-Button
- `onCheckedChange` oeffnet AlertDialog zur Bestaetigung
- Bei Bestaetigung: `supabase.from('pet_providers').update({ is_published: true/false })`
- Toast-Nachricht: "Profil veroeffentlicht" / "Profil deaktiviert"
