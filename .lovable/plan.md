

# Storage-Audit: Alle Buckets, Pfade & Datenräume (MOD-00 bis MOD-22)

---

## 1. Bucket-Inventar (9 Buckets)

| # | Bucket | Public | Verwendet von | Pfadmuster |
|---|--------|--------|---------------|------------|
| 1 | `tenant-documents` | nein | MOD-01 bis MOD-21 (DMS SSOT) | `{tenant_id}/{module_code}/{entity_id}/{file}` |
| 2 | `acq-documents` | nein | MOD-12 (Akquise) | `{tenant_id}/{mandate_id}/{offer_id}/expose/{file}` |
| 3 | `pet-photos` | ja | MOD-22 (Pets) + Zone 3 | `{tenant_id}/{pet_id}/gallery/{file}` |
| 4 | `project-documents` | nein | MOD-13 (Projekte) | `{project_id}/...` |
| 5 | `public-intake` | ja | Zone 3 (Kaufy Verkäufer-Form) | `{session_id}/expose_{file}` |
| 6 | `social-assets` | ja | MOD-14 (Social Assets) | DB-gesteuert (social_assets table) |
| 7 | `audit-reports` | nein | Zone 1 (Admin Audit) | `{date}/{report_id}/report.md` |
| 8 | `docs-export` | ja | Zone 1 (Admin Docs Export) | `{filename}.zip` |
| 9 | `website-assets` | ja | Zone 3 (Website-Bilder) | unklar |
| 10 | `documents` | nein | Legacy (Kamera?) | unbekannt |

---

## 2. Pfade pro Modul — Detailanalyse

### MOD-00 (Dashboard / Armstrong Workspace)
- **Bucket**: `tenant-documents`
- **Pfad**: `{tenant_id}/armstrong/{timestamp}_{filename}`
- **Hook**: `useArmstrongDocUpload.ts` (Zeile 231)
- **Datenraum-UI**: ❌ **KEINER** — Hochgeladene Dateien landen im Bucket, werden geparst, aber es gibt keine Datenraum-Ansicht für Armstrong-Uploads
- **SSOT-Konformität**: ❌ Nutzt NICHT `useUniversalUpload`, baut eigenen Pfad, erstellt KEINE `storage_nodes`/`documents`/`document_links` Einträge
- **storageManifest**: ❌ Kein MOD_00 Eintrag vorhanden

### MOD-01 (Stammdaten)
- **Bucket**: `tenant-documents`
- **Datenraum-UI**: ✅ `EntityStorageTree` (ProfilTab.tsx, entityType="person")
- **SSOT-Konformität**: ✅ via `useUniversalUpload`
- **storageManifest**: ✅ MOD_01

### MOD-02 (KI Office)
- **Bucket**: `tenant-documents`
- **Sonderpfad**: `signatures/{profile_id}/signature.{ext}` (BriefTab.tsx) — bypasses useUniversalUpload
- **Datenraum-UI**: Indirekt über DMS
- **storageManifest**: ✅ MOD_02

### MOD-03 (DMS)
- **Bucket**: `tenant-documents`
- **Datenraum-UI**: ✅ `StorageFileManager` (StorageTab.tsx) — der zentrale Dateibrowser
- **SSOT-Konformität**: ✅ Ist selbst die SSOT-Quelle
- **storageManifest**: ✅ MOD_03

### MOD-04 (Immobilien)
- **Bucket**: `tenant-documents`
- **Datenraum-UI**: ✅ `EntityStorageTree` + RecordCard + ValuationPhotoGrid
- **ValuationPhotoGrid**: Nutzt `tenant-documents` Bucket, Pfad: `{tenant_id}/MOD_04/{property_id}/07_Fotos/{file}`
- **SSOT-Konformität**: ✅ via `useUniversalUpload`
- **storageManifest**: ✅ MOD_04 (mit 8 entity_sub_folders)

### MOD-05 bis MOD-11, MOD-14 bis MOD-16, MOD-18, MOD-20, MOD-21
- **Bucket**: `tenant-documents`
- **Datenraum-UI**: ✅ Wo nötig via `EntityStorageTree` oder `RecordCard`
- **SSOT-Konformität**: ✅ via `useUniversalUpload`
- **storageManifest**: ✅ Alle eingetragen

### MOD-12 (Akquise-Manager)
- **Bucket**: `acq-documents` ← **SEPARATER Bucket**
- **Pfade**: Jetzt vereinheitlicht auf `{tenant_id}/{mandate_id}/{offer_id}/expose/{file}`
- **Datenraum-UI**: `AcqDataRoom.tsx` (custom 3-Level-Drill) + `EntityStorageTree` auf ObjekteingangDetail
- **SSOT-Konformität**: ❌ Nutzt NICHT `useUniversalUpload`, eigene Upload-Hooks (`useExposeUpload`, `ExposeDragDropUploader`)
- **storageManifest**: ✅ MOD_12 (aber entity_sub_folders leer)

### MOD-13 (Projekte)
- **Bucket**: `project-documents` ← **SEPARATER Bucket**
- **Pfade**: `{project_id}/...`
- **Datenraum-UI**: ✅ `EntityStorageTree` + `DatenraumTab`
- **SSOT-Konformität**: Teilweise — `useDevProjects` greift direkt auf `project-documents` zu
- **storageManifest**: ✅ MOD_13 (mit 7 entity_sub_folders)

### MOD-17 (Car-Management)
- **Bucket**: `tenant-documents`
- **Datenraum-UI**: ✅ via RecordCard + EntityStorageTree
- **storageManifest**: ✅ MOD_17 (mit 6 entity_sub_folders)

### MOD-19 (Photovoltaik)
- **Bucket**: `tenant-documents`
- **Datenraum-UI**: ✅ `EntityStorageTree` (PVPlantDossier.tsx)
- **storageManifest**: ✅ MOD_19 (mit 8 entity_sub_folders)

### MOD-22 (Pet Manager)
- **Bucket**: `pet-photos` ← **SEPARATER Bucket** (nur Fotos)
- **Pfade**: `{tenant_id}/{pet_id}/profile.{ext}`, `{tenant_id}/{pet_id}/gallery/{file}`
- **Datenraum-UI**: ❌ Kein EntityStorageTree — nur inline Foto-Galerie
- **SSOT-Konformität**: ❌ Eigene Upload-Logik in `usePetDossier.ts` und `PetsMeineTiere.tsx`
- **storageManifest**: ✅ MOD_22 (aber entity_sub_folders leer)

---

## 3. Kritische Befunde

### 🔴 BEFUND 1: MOD-00 Armstrong hat keinen Datenraum
- Uploads via `useArmstrongDocUpload` → `tenant-documents/{tenant_id}/armstrong/{file}`
- Dateien werden geparst, aber NICHT in `storage_nodes`/`documents` registriert
- Kein UI zum Browsen, Löschen oder Verwalten von Armstrong-Uploads
- **Kein MOD_00-Eintrag im storageManifest**

### 🔴 BEFUND 2: 3 Module nutzen separate Buckets statt `tenant-documents`
| Modul | Abweichender Bucket | Grund |
|-------|---------------------|-------|
| MOD-12 | `acq-documents` | Historisch gewachsen |
| MOD-13 | `project-documents` | Historisch gewachsen |
| MOD-22 | `pet-photos` | Nur Fotos, kein DMS |

Das widerspricht dem `storageManifest`-Vertrag: "All uploads go to UPLOAD_BUCKET ('tenant-documents')".

### 🔴 BEFUND 3: 4 Upload-Pfade umgehen `useUniversalUpload`
| Datei | Upload-Methode |
|-------|---------------|
| `useArmstrongDocUpload.ts` | Direkt `supabase.storage.upload()` |
| `useExposeUpload.ts` | Direkt `supabase.storage.upload()` |
| `ExposeDragDropUploader.tsx` | Direkt `supabase.storage.upload()` |
| `BriefTab.tsx` (Signatur) | Direkt `supabase.storage.upload()` |
| `usePetDossier.ts` | Direkt `supabase.storage.upload()` |
| `PetsMeineTiere.tsx` | Direkt `supabase.storage.upload()` |

### 🟡 BEFUND 4: Signatur-Upload (MOD-02) ist ein Sonderfall
- Pfad: `signatures/{profile_id}/signature.png` — kein Tenant-Prefix, kein Module-Code
- Nutzt `getPublicUrl()` — sollte nicht public sein

### 🟡 BEFUND 5: storageManifest hat kein MOD_00
- MOD_00 fehlt komplett im `STORAGE_MANIFEST`

---

## 4. Vorgeschlagener Plan zur Vereinheitlichung

### Phase 1: storageManifest erweitern (1 Datei)
- **MOD_00 hinzufügen** mit `root_name: 'Armstrong Workspace'`, `root_template_id: 'MOD_00_ROOT'`
- **MOD_12 entity_sub_folders** definieren: `['expose', 'recherche', 'korrespondenz', 'sonstiges']`

### Phase 2: Armstrong Datenraum erstellen (2 Dateien)
- **`useArmstrongDocUpload.ts`** refactoren: `useUniversalUpload` nutzen statt direktem Storage-Upload. Pfad: `{tenant_id}/MOD_00/{project_id}/{file}`. Damit werden `storage_nodes`, `documents`, `document_links` korrekt angelegt.
- **Armstrong Workspace UI**: Einen "Datenraum"-Slider/Bereich unter dem Chat einfügen, der `EntityStorageTree` mit `entityType="armstrong_project"` und `moduleCode="MOD_00"` nutzt.

### Phase 3: Bucket-Konsolidierung bewerten (Architektur-Entscheidung)
Hier ist eine Entscheidung nötig: Sollen `acq-documents`, `project-documents` und `pet-photos` langfristig in `tenant-documents` konsolidiert werden? Das hätte Vorteile (eine RLS-Policy, ein Pfadmuster) aber erfordert Migration bestehender Dateien. Dies könnte auch in einem späteren Sprint erfolgen.

### Phase 4: Sonderpfade bereinigen
- **Signatur-Upload** (BriefTab.tsx) auf `{tenant_id}/MOD_02/signatures/{profile_id}/signature.{ext}` umstellen und `useUniversalUpload` nutzen.

---

## 5. Empfohlene Reihenfolge

| Priorität | Maßnahme | Aufwand |
|-----------|----------|--------|
| **P0** | MOD_00 im storageManifest + Armstrong Datenraum UI | Mittel |
| **P1** | `useArmstrongDocUpload` auf `useUniversalUpload` umstellen | Mittel |
| **P2** | MOD-12 entity_sub_folders im Manifest pflegen | Klein |
| **P3** | Signatur-Upload normalisieren | Klein |
| **P4** | Bucket-Konsolidierung (acq-documents → tenant-documents) | Groß — separater Sprint |

Soll ich mit P0+P1 (Armstrong Datenraum + Upload-Refactoring) beginnen?

