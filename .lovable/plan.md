
# Projekte Upload-Workflow reparieren

## 3 Probleme, die behoben werden muessen

### Problem 1: Falscher Edge-Function-Aufruf
Das Dashboard ruft `sot-project-intake` mit `{ storagePaths, autoCreateContext: true }` auf, aber die Funktion erwartet einen `mode`-Parameter (`'analyze'` oder `'create'`). Ohne `mode` antwortet sie mit Error 400 "Invalid mode".

### Problem 2: Bucket-Konflikt
`useUniversalUpload` speichert in `tenant-documents`, die Edge Function liest aber aus `project-documents`. Die Datei wird hochgeladen, aber die KI findet sie nicht.

### Problem 3: Kein Upload-Feedback (UploadResultCard fehlt)
Nach dem Datei-Upload erscheint kein visuelles Feedback. Der User sieht nur den Spinner bis zum Ende.

---

## Loesung: 4-Schritt-Workflow mit UploadResultCard

Der neue Flow im Dashboard wird:

```text
Schritt 1: Dateien in Dropzone legen
           → Dateien werden lokal angezeigt (Name, Groesse) [bereits vorhanden]

Schritt 2: "Dateien hochladen" klicken
           → useUniversalUpload (Phase 1) → tenant-documents Bucket
           → UploadResultCard erscheint mit gruener Badge "Hochgeladen" + Vorschau-Link
           → User kann Datei anklicken und pruefen

Schritt 3: "KI-Analyse starten" klicken (separater Button, erst nach Upload aktiv)
           → Edge Function sot-project-intake(mode='analyze') aufrufen
           → Badge wechselt auf gelb "Wird analysiert"
           → Extrahierte Daten werden in einem Review-Formular angezeigt

Schritt 4: Review + "Projekt anlegen" klicken
           → Edge Function sot-project-intake(mode='create') mit reviewedData
           → Weiterleitung zur Projektakte
```

## Technische Aenderungen

### Datei 1: `src/pages/portal/projekte/ProjekteDashboard.tsx`

**Neuer State:**
- `uploadedExpose: UploadedFileInfo | null` — nach Upload gesetzt
- `uploadedPricelist: UploadedFileInfo | null` — nach Upload gesetzt
- `extractedData: ExtractedData | null` — nach KI-Analyse gesetzt
- `step: 'upload' | 'review' | 'creating'` — steuert die UI-Phasen

**Neuer Ablauf:**
1. Dropzones bleiben, aber der Button aendert sich:
   - Vor Upload: "Dateien hochladen" (ruft `universalUpload` auf, NICHT die Edge Function)
   - Nach Upload: `UploadResultCard` zeigt die Dateien mit Vorschau-Link
   - Neuer Button: "KI-Analyse starten" (ruft `sot-project-intake` mit `mode='analyze'` auf)
   - Nach Analyse: Review-Formular mit extrahierten Daten (Projektname, Stadt, PLZ, etc.)
   - Finaler Button: "Projekt anlegen" (ruft `sot-project-intake` mit `mode='create'` auf)

**Bucket-Fix:**
- Die Edge Function wird angepasst, um aus `tenant-documents` zu lesen (statt `project-documents`)
- Alternativ: Der `storagePath` wird so uebergeben, dass er den Bucket-Namen enthaelt

### Datei 2: `supabase/functions/sot-project-intake/index.ts`

**Aenderung im `handleAnalyzeMode`:**
- Zeile 183: `supabase.storage.from('project-documents')` aendern zu `supabase.storage.from('tenant-documents')`
- Damit liest die KI aus dem gleichen Bucket, in den `useUniversalUpload` hochlaedt

**Aenderung im `handleCreateMode`:**
- Zeile 372+: Die Datei-Verschiebung nach `project-documents` entfernen oder ebenfalls auf `tenant-documents` umstellen
- Die Dateien bleiben in `tenant-documents` und werden ueber `storage_nodes` referenziert (konsistent mit dem 2-Phase-Contract)

### Datei 3: Import der `UploadResultCard`

In `ProjekteDashboard.tsx` wird importiert:
```typescript
import { UploadResultCard } from '@/components/shared/UploadResultCard';
```

Die Card wird nach Phase 1 unter den Dropzones angezeigt — mit klickbarem Vorschau-Link und gruenem Status.

---

## Zusammenfassung

| Was | Vorher | Nachher |
|-----|--------|---------|
| Upload-Ziel | tenant-documents (Hook) vs project-documents (EF) | tenant-documents (ueberall) |
| Edge-Function-Aufruf | Ohne mode → Error 400 | mode='analyze' dann mode='create' |
| Upload-Feedback | Keines | UploadResultCard mit Vorschau-Link |
| KI-Start | Sofort nach Upload | Separater Schritt nach Upload-Bestaetigung |
| Review | Kein Review, direkt Projekt | Extrahierte Daten im Formular pruefen |
| Dateien | 1 Datei = ProjekteDashboard.tsx | 2 Dateien: Dashboard + Edge Function |
