

## Analyse: Upload-Funktionen systemweit — 7 Rogue-Stellen gefunden

### IST-Zustand

Es gibt einen korrekt implementierten **universellen Upload-Hook** (`useUniversalUpload`), der alle Best Practices einhält:
- `buildStoragePath()` mit `sanitizeFileName()` (Sonderzeichen, Umlaute, Leerzeichen → Underscore)
- Einheitlicher Bucket (`UPLOAD_BUCKET = 'tenant-documents'`)
- 2-Phasen-Architektur (Upload → Register → optional AI)
- 15 Dateien nutzen ihn bereits korrekt

**Aber 7 Stellen im Code umgehen diesen Hook komplett** und bauen eigene Upload-Pfade mit rohen `file.name`-Werten — genau der Bug, der "Invalid key"-Fehler bei Sonderzeichen verursacht.

### Die 7 Rogue-Upload-Stellen

```text
┌───┬──────────────────────────────────────────────┬────────────────────┬──────────────────┬─────────────┐
│ # │ Datei                                        │ Bucket             │ sanitizeFileName │ Problem     │
├───┼──────────────────────────────────────────────┼────────────────────┼──────────────────┼─────────────┤
│ 1 │ useExposeUpload.ts (Z.43-44)                 │ acq-documents      │ Teilweise*       │ Kein .      │
│ 2 │ useAcqOffers.ts (Z.250-251)                  │ acq-documents      │ NEIN             │ Roher Name  │
│ 3 │ TestamentVorlageInline.tsx (Z.45-46)         │ documents          │ NEIN             │ Roher Name  │
│ 4 │ PatientenverfuegungInlineForm.tsx (Z.125)    │ documents          │ NEIN             │ Roher Name  │
│ 5 │ Kaufy2026Verkaeufer.tsx (Z.161-178, 3x)     │ public-intake      │ NEIN             │ Roher Name  │
│ 6 │ ProfilTab.tsx Avatar (Z.279-281)             │ tenant-documents   │ NEIN             │ Roher Name  │
│ 7 │ ProfilTab.tsx Logo (Z.297-299)               │ tenant-documents   │ NEIN             │ Roher Name  │
└───┴──────────────────────────────────────────────┴────────────────────┴──────────────────┴─────────────┘

* useExposeUpload nutzt eine eigene Regex (/[^a-zA-Z0-9.-]/g → '_'),
  aber NICHT sanitizeFileName() und NICHT buildStoragePath().
```

### Konkrete Bugs, die auftreten koennen

1. **"Invalid key" bei Sonderzeichen:** Ein Dateiname wie `Exposé Wohnung (3. OG).pdf` oder `Müllers_Nebenkostenabrechnung 2024.xlsx` erzeugt Fehler bei Storage-Upload wegen Umlauten, Klammern, Leerzeichen
2. **Bucket-Wildwuchs:** 4 verschiedene Buckets (`acq-documents`, `documents`, `public-intake`, `tenant-documents`) statt dem zentralen `UPLOAD_BUCKET`
3. **Kein DMS-Eintrag:** Die Rogue-Uploads erstellen keinen `documents`-Record und keinen `storage_nodes`-Eintrag — die Dateien sind im DMS unsichtbar
4. **Keine AI-Analyse-Option:** Die Rogue-Uploads koennen Phase 2 (sot-document-parser) nicht triggern

### Kategorisierung der Fixes

**Kategorie A — Auf useUniversalUpload migrieren (3 Stellen):**

| # | Datei | Aktion |
|---|-------|--------|
| 1 | `useExposeUpload.ts` | Intern `useUniversalUpload` nutzen, dann `acq_offers` + `acq_offer_documents` separat erstellen. Der Storage-Upload und DMS-Eintrag gehen ueber den Universal-Hook. |
| 2 | `useAcqOffers.ts` (`useUploadOfferDocument`) | Gleiche Strategie: Universal-Upload fuer Storage, dann `acq_offer_documents`-Record separat. |
| 5 | `Kaufy2026Verkaeufer.tsx` | Sonderfall Zone 3 (oeffentlich, kein Auth). Hier genuegt `sanitizeFileName()` direkt, da `useUniversalUpload` Auth voraussetzt. Der Bucket `public-intake` ist korrekt fuer unauthentifizierte Uploads. |

**Kategorie B — sanitizeFileName direkt nutzen (4 Stellen):**

| # | Datei | Aktion |
|---|-------|--------|
| 3 | `TestamentVorlageInline.tsx` | `sanitizeFileName()` importieren und auf den Dateinamen anwenden |
| 4 | `PatientenverfuegungInlineForm.tsx` | Gleich wie #3 |
| 6 | `ProfilTab.tsx` Avatar | `sanitizeFileName()` importieren (hier ist `useUniversalUpload` Overkill — es ist ein simpler Avatar-Upload mit `upsert: true`) |
| 7 | `ProfilTab.tsx` Logo | Gleich wie #6 |

**Kategorie C — AuditRunTab (1 Stelle, kein Fix noetig):**

| # | Datei | Aktion |
|---|-------|--------|
| — | `AuditRunTab.tsx` | Generierter Report-Name (`report.md`), kein User-Input. Kein Sonderzeichen-Risiko. Bleibt wie es ist. |

### Implementierungsplan

#### Phase 1: `sanitizeFileName` exportieren
- `sanitizeFileName` in `storageManifest.ts` ist aktuell eine private Funktion (kein `export`)
- Muss als `export function sanitizeFileName(...)` exportiert werden, damit Kategorie-B-Stellen sie importieren koennen

#### Phase 2: Kategorie B — Schnelle Fixes (4 Dateien)
Minimale Aenderung: Nur `sanitizeFileName()` auf den Dateinamen anwenden.

- `TestamentVorlageInline.tsx`: `file.name` → `sanitizeFileName(file.name)`
- `PatientenverfuegungInlineForm.tsx`: gleich
- `ProfilTab.tsx` Avatar + Logo: gleich

#### Phase 3: Kategorie A — Migration auf useUniversalUpload (2 Hooks)

**useExposeUpload.ts:**
- Upload-Logik durch `useUniversalUpload.upload()` ersetzen
- `acq_offers`-Insert und `acq_offer_documents`-Insert bleiben als Nachverarbeitung
- Edge-Function-Aufruf (`sot-acq-offer-extract`) bleibt unveraendert
- Bucket wechselt von `acq-documents` zu `UPLOAD_BUCKET`

**useAcqOffers.ts (useUploadOfferDocument):**
- `buildStoragePath()` + `UPLOAD_BUCKET` statt manueller Pfad + `acq-documents`
- `sanitizeFileName()` fuer den Dateinamen

#### Phase 4: Kaufy2026 (Zone 3)
- `sanitizeFileName()` auf alle drei Upload-Stellen anwenden
- Bucket `public-intake` bleibt (unauthentifizierter Kontext)

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/config/storageManifest.ts` | `sanitizeFileName` exportieren |
| `src/hooks/useExposeUpload.ts` | Auf `useUniversalUpload` + `buildStoragePath` migrieren |
| `src/hooks/useAcqOffers.ts` | `buildStoragePath` + `sanitizeFileName` nutzen |
| `src/components/legal/TestamentVorlageInline.tsx` | `sanitizeFileName` importieren + anwenden |
| `src/components/legal/PatientenverfuegungInlineForm.tsx` | `sanitizeFileName` importieren + anwenden |
| `src/pages/portal/stammdaten/ProfilTab.tsx` | `sanitizeFileName` fuer Avatar + Logo |
| `src/pages/zone3/kaufy2026/Kaufy2026Verkaeufer.tsx` | `sanitizeFileName` fuer 3 Upload-Stellen |

### Was sich NICHT aendert
- `useUniversalUpload.ts` selbst — bereits korrekt
- `AuditRunTab.tsx` — kein User-Input im Dateinamen
- Keine neuen DB-Tabellen oder RLS-Policies
- Keine neuen Edge Functions
- Kein Freeze-Konflikt (keine der betroffenen Dateien liegt in einem gefrorenen Modul-Pfad)

