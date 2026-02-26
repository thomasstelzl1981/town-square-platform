

# Status: Upload-Harmonisierung — Was ist fertig, was fehlt?

## Aktueller Stand

| Modul | Komponente | Status | Problem |
|-------|-----------|--------|---------|
| **MOD-13 Projekte** | ProjectDataSheet | ✅ Fertig | Nutzt jetzt `ImageSlotGrid` + `useImageSlotUpload` |
| **MOD-20 Miety** | UploadDrawer | ✅ Fertig | Nutzt jetzt `useDropzone` + `tenant-documents` |
| **MOD-01 Stammdaten** | ProfilTab (Avatar/Logo) | ❌ Offen | Eigene `handleAvatarUpload`/`handleLogoUpload` mit `FileUploader` |
| **MOD-14 Social** | AssetsPage | ❌ Offen | Nutzt falschen Bucket `social-assets` statt `tenant-documents` |
| **MOD-22 Pet Manager** | PMProfil | ❌ Offen | Speichert 1-Jahres-Signed-URLs in DB statt Storage-Pfade |

**Kurz: MOD-13 und MOD-20 sind fertig. MOD-01, MOD-14 und MOD-22 nutzen noch die alte, fehlerhafte Logik.**

---

## Was jetzt noch zu tun ist (3 Fixes)

### Fix 1: MOD-01 ProfilTab — Avatar & Logo

**Problem:** `handleAvatarUpload` und `handleLogoUpload` (Zeilen 274-308) nutzen eine eigene `FileUploader`-Komponente mit direkter Storage-Logik. Funktioniert grundsätzlich, ist aber nicht harmonisiert und hat kein Drag & Drop.

**Fix:** 
- Avatar- und Logo-Upload auf `useImageSlotUpload` umstellen (Module Code `MOD-01`, Slots: `avatar`, `logo`)
- `FileUploader` durch `ImageSlotGrid` ersetzen (1 Slot pro Bild, jeweils mit D&D)
- Storage-Pfad bleibt: `${tenantId}/MOD_01/${userId}/images/avatar_*.jpg`

### Fix 2: MOD-14 AssetsPage — Falscher Bucket

**Problem:** Die gesamte `AssetsPage.tsx` nutzt den Bucket `social-assets` (5 Stellen im Code). Dieser Bucket ist nicht Teil des standardisierten `storageManifest`.

**Fix:**
- Alle `supabase.storage.from('social-assets')` auf `supabase.storage.from('tenant-documents')` umstellen
- Pfad-Pattern: `${tenantId}/MOD_14/social/${documentId}`
- `getStorageUrl()` Funktion auf Signed URLs umstellen (statt `getPublicUrl`)

### Fix 3: MOD-22 PMProfil — Signed URLs in DB

**Problem:** `handlePhotoUpload` (Zeile 169-201) erstellt eine 1-Jahres-Signed-URL und speichert diese direkt in `gallery_images[]` in der DB. Nach Ablauf sind alle Bilder kaputt.

**Fix:**
- Storage-Pfade (nicht URLs) in `gallery_images` speichern
- Signed URLs on-demand via `getSignedUrl()` aus `useImageSlotUpload` generieren
- Galerie-Ansicht: Beim Laden die Pfade in Signed URLs auflösen

---

## Betroffene Dateien

| Datei | Aktion |
|-------|--------|
| `src/pages/portal/stammdaten/ProfilTab.tsx` | Avatar/Logo auf `useImageSlotUpload` umstellen |
| `src/pages/portal/communication-pro/social/AssetsPage.tsx` | Bucket `social-assets` → `tenant-documents` |
| `src/pages/portal/petmanager/PMProfil.tsx` | Signed URLs → Storage-Pfade + on-demand URLs |

Alle Module sind bereits unfrozen. Keine neuen Dateien nötig — die Shared-Komponenten (`useImageSlotUpload`, `ImageSlotGrid`) existieren bereits.

