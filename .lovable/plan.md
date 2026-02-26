

# Diagnose: Profilbild-Upload funktioniert nicht — 2 Bugs

## Befund

Es gibt **zwei separate, klar identifizierbare Bugs**:

### Bug 1: "Foto hierher ziehen" auf der geschlossenen RecordCard — kein Handler

Die geschlossene RecordCard (das große Quadrat mit Kamera-Icon) hat in `RecordCard.tsx` Zeile 135-141 nativen `onDragOver`/`onDrop`-Code — aber **nur wenn `onPhotoDrop` als Prop übergeben wird**. 

In `ProfilTab.tsx` Zeile 347-363 wird RecordCard **ohne `onPhotoDrop`** aufgerufen. Ergebnis: Drag & Drop auf die Fotokachel macht **exakt nichts**.

```text
RecordCard-Prop       ProfilTab übergibt?
─────────────────     ───────────────────
onPhotoDrop           ❌ FEHLT
thumbnailUrl          ✅ formData.avatar_url (aber raw path, keine signed URL!)
```

Zweites Problem hier: `thumbnailUrl` bekommt `formData.avatar_url` (einen Storage-Pfad wie `tenant123/MOD_01/.../avatar_photo.jpg`) statt der aufgelösten `avatarDisplayUrl` (Signed URL). Daher wird das Bild auch nach erfolgreichem Upload nie angezeigt auf der geschlossenen Karte.

### Bug 2: ImageSlotGrid "Profilbild" im offenen RecordCard — funktioniert technisch, aber...

Die `ImageSlotGrid` mit `slotHeight={80}` und `columns={1}` in Zeile 376-383 ist **technisch korrekt** — Drag & Drop und Click-to-Upload sind via `react-dropzone` implementiert. 

Aber: Die Kachel ist nur **80px hoch** und nimmt die **volle Restbreite** ein (neben dem Avatar). Das ergibt einen flachen, unintuitiven Querstreifen. Der User erkennt das nicht als Upload-Bereich.

Zudem: Der Upload funktioniert technisch (Datei wird hochgeladen, Pfad gespeichert), aber das Profil wird **nicht automatisch gespeichert** — der User muss manuell "Speichern" klicken, damit `avatar_url` in die DB geschrieben wird.

---

## Fix-Plan

### Fix 1: `onPhotoDrop` an RecordCard übergeben

In `ProfilTab.tsx` den `onPhotoDrop`-Callback an die RecordCard-Instanz anhängen. Dieser ruft `handleImageSlotUpload('avatar', file)` auf. Damit funktioniert Drag & Drop auf die geschlossene Fotokachel sofort.

### Fix 2: `thumbnailUrl` auf Signed URL umstellen

Statt `formData.avatar_url` (Storage-Pfad) muss `avatarDisplayUrl` (aufgelöste Signed URL) übergeben werden. Sonst bleibt die Kachel immer leer, obwohl ein Bild vorhanden ist.

### Fix 3: Auto-Save nach Foto-Upload

Nach erfolgreichem Avatar-Upload in `handleImageSlotUpload` automatisch `updateProfile.mutate()` aufrufen, damit der Storage-Pfad sofort in der DB persistiert wird. Der User soll nicht erst manuell speichern müssen.

### Fix 4: Avatar-Slot größer + quadratisch machen

Statt `slotHeight={80}` und `columns={1}` (flacher Streifen) den Avatar-Slot auf `slotHeight={IMAGE_SLOT.HEIGHT}` (140px) setzen und als quadratisches Element neben dem Avatar positionieren. Alternativ: den Avatar selbst klickbar machen und den separaten Slot entfernen.

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/pages/portal/stammdaten/ProfilTab.tsx` | `onPhotoDrop` + `thumbnailUrl` fix + Auto-Save + Slot-Größe |

Keine neuen Dateien nötig. RecordCard.tsx und ImageSlotGrid.tsx bleiben unverändert — die Props existieren bereits, sie werden nur nicht korrekt genutzt.

