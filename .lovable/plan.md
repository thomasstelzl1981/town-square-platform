
# Reparatur aller defekten Upload-Felder

## Uebersicht

4 Upload-Felder werden auf den 2-Phase-Contract (useUniversalUpload + UploadResultCard) umgestellt.

---

## Aenderung 1: QuickIntakeUploader — auf useUniversalUpload umstellen

### Problem
- Verwendet direkten `supabase.storage.from('project-documents').upload()` statt `useUniversalUpload`
- Falscher Bucket (`project-documents` statt `tenant-documents`)
- Keine `documents`/`storage_nodes` Records in Phase 1
- Kein UploadResultCard nach Upload

### Loesung
- Import und Nutzung von `useUniversalUpload` + `UploadResultCard`
- `handleUploadFiles()` ruft `universalUpload()` fuer Expose und Preisliste auf mit `moduleCode: 'MOD_13'`
- Nach Upload: UploadResultCard zeigt Dateien mit Vorschau-Link
- Neuer separater Phase-Zustand `'uploaded'` zwischen Upload und Analyse
- `handleStartAnalysis()` wird erst nach Upload-Bestaetigung aufgerufen (nicht mehr auto-start via setTimeout)
- Die `storagePaths` fuer die Edge Function kommen aus den `UploadedFileInfo.storagePath` Werten

### Betroffene Stellen
- Zeilen 13-26: Imports anpassen (useUniversalUpload, UploadResultCard hinzu)
- Zeilen 107-201: `handleUploadFiles()` komplett ersetzen durch universalUpload-Aufrufe
- Zeilen 322-340: Upload-Phase mit UploadResultCards darstellen statt nur Spinner
- Zeile 194: Auto-Start `setTimeout(() => handleStartAnalysis(...))` entfernen
- Neuer Button "KI-Analyse starten" nach Upload sichtbar machen
- Zeile 32: UploadPhase um `'uploaded'` erweitern

---

## Aenderung 2: DatenraumTab — UploadResultCard ergaenzen

### Problem
- Nutzt bereits `useUniversalUpload` korrekt (Bucket + Hook stimmen)
- Zeigt aber nach Upload kein sofortiges visuelles Feedback (keine UploadResultCard)
- User wartet bis Query-Invalidation die Dokumentenliste aktualisiert

### Loesung
- `uploadedFiles` und `clearUploadedFiles` aus dem Hook destrukturieren
- `UploadResultList` unter der Upload-Zone einbinden
- Nach erfolgreichem Upload erscheint sofort die UploadResultCard mit gruener Badge + Vorschau-Link
- Bestehende Query-Invalidation bleibt erhalten (Dokumentenliste aktualisiert sich parallel)

### Betroffene Stellen
- Zeile 14: Import von `UploadResultList` hinzufuegen
- Zeile 137: `uploadedFiles, clearUploadedFiles` aus dem Hook destrukturieren
- Nach Zeile 322 (nach `</FileUploader>`-Block): `UploadResultList` einfuegen

---

## Aenderung 3: DocumentUploadSection — Live-Status + UploadResultCard

### Problem
- Nutzt `useUniversalUpload` korrekt (Bucket stimmt)
- Aber: `DOCUMENT_CATEGORIES.files[].uploaded` ist statisch `false` — wird nie aktualisiert
- Kein UploadResultCard, keine Vorschau, kein Live-Feedback
- `triggerAI: true` startet AI sofort ohne Zwischenpause

### Loesung
- State `uploadedFilesByCategory` als `Record<string, UploadedFileInfo[]>` einfuehren
- `onFileUploaded` Callback in den Upload-Optionen nutzen, um Dateien pro Kategorie zu sammeln
- Nach Upload-Bereich: `UploadResultList` pro Kategorie anzeigen
- `triggerAI` auf `false` aendern (Analyse kann spaeter separat gestartet werden, oder explizit via Button)
- Hochgeladene Dateien zaehlen zum `uploadedCount` der Kategorie

### Betroffene Stellen
- Zeile 11: Import UploadResultList
- Zeile 80-81: Neuer State `uploadedFilesByCategory`
- Zeilen 83-111: `handleUpload` mit `onFileUploaded` Callback erweitern, `triggerAI: false`
- Zeilen 146-148: `uploadedCount` dynamisch berechnen aus State
- Nach Zeile 204 (nach FileUploader): UploadResultList pro Kategorie einfuegen

---

## Aenderung 4: ChatPanel — Echter Upload mit useUniversalUpload

### Problem
- Dateien werden nur in lokalen State `uploadedFiles` gespeichert (`File[]`)
- Kein tatsaechlicher Upload zu Storage
- Keine `documents`/`storage_nodes` Records
- Kein UploadResultCard

### Loesung
- `useUniversalUpload` importieren und nutzen
- `handleFilesSelected()` ruft `universalUpload()` auf mit:
  - `moduleCode` abgeleitet aus `context?.module` (z.B. 'Portfolio' → 'MOD_04', Fallback: kein moduleCode → INBOX)
  - `source: 'armstrong_chat'`
  - `triggerAI: false` (Armstrong fragt dann ob Analyse gestartet werden soll)
- Lokaler `File[]` State wird durch `UploadedFileInfo[]` aus dem Hook ersetzt
- `UploadResultCard` (compact) ersetzt die einfache Dateinamen-Liste
- Upload-Spinner waehrend des Uploads

### Modul-Mapping (context.module → moduleCode)
```text
'Portfolio' / 'Immobilien' → 'MOD_04'
'Finanzierung'             → 'MOD_07'
'Projekte'                 → 'MOD_13'
'Pv'                       → 'MOD_14'
'Services'                 → 'MOD_16'
Fallback                   → undefined (landet in INBOX)
```

### Betroffene Stellen
- Zeile 1-21: Imports ergaenzen (useUniversalUpload, UploadResultCard)
- Zeile 74: `uploadedFiles` State entfernen (kommt nun aus Hook)
- Zeilen 90-97: `handleFilesSelected` komplett ersetzen durch universalUpload-Aufrufe
- Zeilen 290-320: Upload-Zone umbauen — UploadResultCards statt roher Dateilisten

---

## Zusammenfassung

| Upload-Feld | Hook | Bucket | ResultCard | 2-Phase |
|---|---|---|---|---|
| QuickIntakeUploader | Direkt → useUniversalUpload | project-documents → tenant-documents | Nein → Ja | Auto-Start → Manuell |
| DatenraumTab | OK | OK | Nein → Ja | N/A (kein AI) |
| DocumentUploadSection | OK | OK | Nein → Ja | Auto-AI → Manuell |
| ChatPanel | Kein Upload → useUniversalUpload | Kein Bucket → tenant-documents | Nein → Ja | N/A → Manuell |

### Dateien

| Datei | Aktion |
|---|---|
| `src/components/projekte/QuickIntakeUploader.tsx` | EDIT — useUniversalUpload + UploadResultCard + manueller AI-Start |
| `src/components/portfolio/DatenraumTab.tsx` | EDIT — UploadResultList hinzufuegen |
| `src/components/finanzierung/DocumentUploadSection.tsx` | EDIT — Live-Status State + UploadResultList + triggerAI=false |
| `src/components/chat/ChatPanel.tsx` | EDIT — useUniversalUpload + UploadResultCard + Modul-Mapping |

### Reihenfolge
1. ChatPanel (schnellste Aenderung, hoechste Sichtbarkeit)
2. DatenraumTab (einfachste Aenderung — nur UploadResultList einfuegen)
3. DocumentUploadSection (mittlerer Aufwand — State + ResultList)
4. QuickIntakeUploader (groesster Umbau — kompletter Upload-Flow)
