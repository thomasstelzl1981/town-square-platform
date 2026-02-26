# Backlog: Foto-Upload Pipeline — Systemweite Analyse

**Erstellt:** 2026-02-27  
**Status:** IN ARBEIT  
**Betroffene Module:** MOD-01, MOD-13, MOD-22

---

## Kernbefund

Die `useImageSlotUpload` Pipeline schreibt korrekt 3 DB-Records (`documents`, `document_links`, `storage_nodes`), aber **kein einziger Consumer liest die Bilder aus der DB zurück**. Alle 3 Verwender nutzen eigene Legacy-Lese-Logik über Profil-Spalten oder JSONB-Felder.

---

## Befunde

### BUG-01: ProfilTab liest nicht aus document_links (MOD-01) — KRITISCH
- **Problem:** ProfilTab speichert `storagePath` in `profiles.avatar_url` / `profiles.letterhead_logo_url` und liest beim Laden aus diesen Spalten. Die parallel erstellten `document_links`-Records werden nie abgefragt.
- **Symptom:** Doppelte Datenhaltung. Beim Löschen über `deleteSlotImage` bleibt `profiles.avatar_url` stehen.
- **Fix:** `loadSlotImages` als primäre Quelle + Profil-Spalten als Fallback + Delete-Handler.

### BUG-02: ProjectDataSheet liest aus JSONB, nicht aus document_links (MOD-13) — KRITISCH
- **Problem:** `ProjectDataSheet` speichert `storagePath` in `dev_projects.project_images` (JSONB) und liest daraus. `document_links` werden nie abgefragt. Upload-Pfad geht verloren wenn nicht gespeichert.
- **Fix:** `loadSlotImages` beim Mount aufrufen als primäre Bildquelle. JSONB als Fallback.

### BUG-03: PMProfil liest aus gallery_images Array, nicht aus document_links (MOD-22) — KRITISCH
- **Problem:** Identisch zu BUG-02 mit `pet_providers.gallery_images` (text[]).
- **Fix:** Analog — `loadSlotImages` als primäre Quelle.

### BUG-04: loadSlotImages wird nirgends aufgerufen — DESIGN-FEHLER
- **Problem:** Die Funktion existiert im Hook, ist korrekt implementiert, wird aber von keinem Consumer genutzt.
- **Fix:** In allen 3 Consumern `loadSlotImages` beim Mount aufrufen.

### BUG-05: deleteSlotImage nicht an ImageSlotGrid angebunden — NIEDRIG
- **Problem:** `ImageSlotGrid` hat `onDelete`-Prop, aber kein Consumer übergibt einen Delete-Handler.
- **Fix:** `deleteSlotImage` aus dem Hook an `ImageSlotGrid.onDelete` durchreichen.

### BUG-06: Kein Fallback für Legacy-Bilder ohne document_links — NIEDRIG
- **Problem:** Bilder vor der slot_key-Migration haben keinen `document_links`-Eintrag mit `slot_key`.
- **Fix:** Storage-Listing-Fallback wenn kein document_links-Eintrag vorhanden.

### BUG-07: Console.error Leaks in useImageSlotUpload — NIEDRIG
- **Problem:** Zeilen 158, 207, 232 enthalten `console.error` ohne DEV-Guard mit potentiell sensiblen Supabase-Fehlerobjekten.
- **Fix:** Optional — DEV-Guard oder Error-Filterung.

---

## Umsetzungsplan

### Phase 1+2: Lese-Logik + Delete-Handler (aktuell in Arbeit)
- ProfilTab: `loadSlotImages` + Fallback auf `profiles.avatar_url` + `onDelete`
- ProjectDataSheet: `loadSlotImages` + Fallback auf `project_images` JSONB + `onDelete`
- PMProfil: `loadSlotImages` + Fallback auf `gallery_images` + `onDelete`

### Phase 3: Storage-Fallback für Alt-Bilder (Folge-PR)
- In `useImageSlotUpload.loadSlotImages` Storage-Listing-Fallback einbauen.
