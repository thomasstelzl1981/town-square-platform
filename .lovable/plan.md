
# Storage-Architektur: Einheitlicher Menuebaum + Upload-Manifest

## Zusammenfassung

Das Storage-System hat bereits eine solide Grundlage (storage_nodes, module_code, ensure_module_root_folders), aber es gibt **kritische Luecken und Inkonsistenzen**, die zuerst behoben werden muessen, bevor ein einheitlicher Upload funktioniert.

---

## IST-Zustand: Was bereits existiert

### Gut

- `storage_nodes`-Tabelle als Ordner-Baum (parent_id → Hierarchie)
- `module_code`-Spalte fuer Modul-Zuordnung
- DB-Trigger `seed_tenant_storage_roots()` erzeugt bei Tenant-Erstellung automatisch:
  - 5 System-Ordner: Posteingang, Eigene Dateien, Archiv, Zur Pruefung, Sonstiges
  - 5 Modul-Roots: MOD_04, MOD_06, MOD_07, MOD_16, MOD_17
- Trigger `create_property_folder_structure()` erzeugt Property-Dossier unter MOD_04_ROOT
- Trigger `create_vehicle_folder_structure()` erzeugt Fahrzeug-Dossier unter MOD_17_ROOT
- Funktion `ensure_module_root_folders()` kennt 10 Module + TRASH_ROOT (11 Roots)
- `useSmartUpload.ts` funktioniert stabil (direkter Upload in `tenant-documents` Bucket)

### Probleme

| # | Problem | Auswirkung |
|---|---------|------------|
| 1 | **module_code CHECK Constraint zu restriktiv** | Erlaubt nur MOD_03-MOD_08, MOD_16, MOD_17, SYSTEM. MOD_01, MOD_02, MOD_09-MOD_15, MOD_18-MOD_20 fehlen |
| 2 | **Inkonsistente Namensgebung** | Constraint erlaubt `MOD_13` (Unterstrich), aber PV-Code schreibt `MOD-13` (Bindestrich). 40 Rows mit `MOD-13` existieren in der DB |
| 3 | **seed_tenant_storage_roots nur 5 Module** | Nur MOD_04, MOD_06, MOD_07, MOD_16, MOD_17 werden bei Tenant-Erstellung erzeugt. MOD_01-MOD_03, MOD_05, MOD_08-MOD_20 fehlen |
| 4 | **ensure_module_root_folders kennt 10 Module** | Aber nicht alle 20 (es fehlen MOD_09-MOD_12, MOD_14, MOD_15, MOD_18-MOD_20) |
| 5 | **3 separate Storage-Buckets** | `tenant-documents`, `project-documents`, `acq-documents` — keine einheitliche Struktur |
| 6 | **Upload-Pfade nicht Storage-Node-gekoppelt** | `useSmartUpload` schreibt in `tenant-documents/{tenantId}/raw/...` — der Pfad hat keinen Bezug zu storage_nodes |
| 7 | **StorageTab nutzt Edge Function fuer Upload** | 2-Roundtrip (Signed URL), statt direktem `supabase.storage.upload()` |
| 8 | **ProjekteDashboard sendet FormData an Edge Function** | Memory-Limit bei grossen Dateien — Hauptgrund fuer Upload-Fehler |

---

## SOLL-Zustand: Vollstaendiger Menuebaum

### Prinzip: 1 Tenant = 1 kompletter DMS-Baum

Bei Erstellung eines Tenants (Organization) wird folgender Baum automatisch erzeugt:

```text
ROOT (tenant_id)
+-- Posteingang                    (SYSTEM, inbox)
+-- Eigene Dateien                 (SYSTEM, user_files)
+-- Archiv                         (SYSTEM, archive)
+-- Zur Pruefung                   (SYSTEM, needs_review)
+-- Sonstiges                      (SYSTEM, sonstiges)
+-- Papierkorb                     (SYSTEM, TRASH_ROOT)
|
+-- Stammdaten                     (MOD_01, MOD_01_ROOT)
+-- KI Office                      (MOD_02, MOD_02_ROOT)
+-- DMS                            (MOD_03, MOD_03_ROOT)
+-- Immobilien                     (MOD_04, MOD_04_ROOT)
|   +-- [Property Dossier] ...     (auto bei Property-Anlage)
+-- MSV                            (MOD_05, MOD_05_ROOT)
+-- Verkauf                        (MOD_06, MOD_06_ROOT)
+-- Finanzierung                   (MOD_07, MOD_07_ROOT)
|   +-- [Finance Request] ...      (auto bei Finanzierungsanfrage)
+-- Investments                    (MOD_08, MOD_08_ROOT)
+-- Vertriebspartner               (MOD_09, MOD_09_ROOT)
+-- Leads                          (MOD_10, MOD_10_ROOT)
+-- Finanzierungsmanager           (MOD_11, MOD_11_ROOT)
+-- Akquise-Manager                (MOD_12, MOD_12_ROOT)
+-- Projekte                       (MOD_13, MOD_13_ROOT)
|   +-- [Projekt Dossier] ...      (auto bei Projekt-Anlage)
+-- Communication Pro              (MOD_14, MOD_14_ROOT)
+-- Fortbildung                    (MOD_15, MOD_15_ROOT)
+-- Services                       (MOD_16, MOD_16_ROOT)
+-- Car-Management                 (MOD_17, MOD_17_ROOT)
|   +-- Fahrzeuge/                 (auto)
|       +-- [Fahrzeug Dossier] ... (auto bei Fahrzeug-Anlage)
+-- Finanzanalyse                  (MOD_18, MOD_18_ROOT)
+-- Photovoltaik                   (MOD_19, MOD_19_ROOT)
|   +-- [PV-Anlage Dossier] ...    (auto bei PV-Anlage)
+-- Miety                          (MOD_20, MOD_20_ROOT)
```

### Sub-Trees bei Entity-Erstellung

Wenn ein User eine Immobilie, ein Projekt, ein Fahrzeug oder eine PV-Anlage anlegt, wird automatisch ein Sub-Tree unter dem jeweiligen Modul-Root erstellt. Beispiel PV-Anlage:

```text
Photovoltaik (MOD_19_ROOT)
+-- "Thomas EFH 9,8 kWp"
    +-- 01_Stammdaten
    +-- 02_MaStR_BNetzA
    +-- 03_Netzbetreiber
    +-- 04_Zaehler
    +-- 05_Wechselrichter_und_Speicher
    +-- 06_Versicherung
    +-- 07_Steuer_USt_BWA
    +-- 08_Wartung_Service
```

### Upload-Pfad-Konvention (Blob Storage)

Einheitlicher Pfad fuer alle Dateien im `tenant-documents` Bucket:

```text
{tenant_id}/{module_code}/{entity_id}/{dateiname}
```

Beispiele:
- `abc123/MOD_04/prop-456/Grundbuch_Auszug.pdf`
- `abc123/MOD_07/req-789/Gehaltsnachweis.pdf`
- `abc123/MOD_13/proj-012/Expose_Projekt.pdf`
- `abc123/MOD_19/pv-345/Inbetriebnahmeprotokoll.pdf`
- `abc123/INBOX/unknown_file.pdf` (nicht zuordenbar)

---

## Implementierung: 3 Schritte

### Step 1: DB-Migration — Constraint + Trigger erweitern

1. **module_code CHECK Constraint updaten**: Alle 20 Module + SYSTEM erlauben
2. **Bestehende `MOD-13` Daten migrieren**: `MOD-13` → `MOD_13` (Unterstrich-Standard)
3. **`seed_tenant_storage_roots()` erweitern**: Alle 20 Module bei Tenant-Erstellung
4. **`ensure_module_root_folders()` erweitern**: Alle 20 Module
5. **Bestehende Tenants nachruesten**: Fehlende Modul-Roots fuer existierende Tenants erstellen
6. **PV-Trigger erstellen**: `create_pv_plant_folder_structure()` analog Property/Vehicle

### Step 2: `useUniversalUpload` Hook + Storage-Manifest

1. **Neuer Hook `useUniversalUpload.ts`** als einheitlicher Entry-Point:
   - Basiert auf bewaehrtem `useSmartUpload.ts`
   - Einheitlicher Pfad: `{tenantId}/{moduleCode}/{entityId}/{filename}`
   - Automatisch `documents` Record + `document_links` Record
   - Optional AI-Extraktion (nur Pfad uebergeben, nie Datei-Inhalt)
   - Automatisch `storage_nodes` File-Node unter korrektem Parent erzeugen
   - Fallback auf INBOX-Ordner wenn keine Zuordnung moeglich

2. **Storage-Manifest** (`src/config/storageManifest.ts`):
   - Definiert pro Modul: module_code, root_name, sub-folder Templates, required_docs
   - Wird von `useUniversalUpload` und DMS-UI konsumiert
   - SSOT fuer Ordnerstrukturen und Pflichtdokumente

### Step 3: Upload-Felder umstellen

Alle bestehenden Upload-Implementierungen auf `useUniversalUpload` umstellen:
- `StorageTab.tsx` (MOD-03): Edge Function → direkt
- `DatenraumTab.tsx` (MOD-04): Edge Function → direkt
- `ProjekteDashboard.tsx` (MOD-13): FormData → direkt + JSON-Modus Edge Fn
- `QuickIntakeUploader.tsx` (MOD-13): Bucket vereinheitlichen
- `FinanceUploadZone.tsx` (MOD-07): useSmartUpload → useUniversalUpload
- `DocumentUploadSection.tsx` (MOD-07): Stub → echt
- `useAcqOffers.ts` (MOD-12): acq-documents → tenant-documents
- `PVDmsTree.tsx` (MOD-19): usePvDMS → useUniversalUpload

---

## Betroffene Dateien

| Aktion | Datei |
|--------|-------|
| NEU | `src/config/storageManifest.ts` (SSOT fuer Ordnerstrukturen) |
| NEU | `src/hooks/useUniversalUpload.ts` (einheitlicher Upload-Hook) |
| DB | Migration: module_code Constraint + seed_tenant_storage_roots + ensure_module_root_folders + PV-Trigger |
| EDIT | `src/pages/portal/dms/StorageTab.tsx` (Edge Fn → direkter Upload) |
| EDIT | `src/components/portfolio/DatenraumTab.tsx` (Edge Fn → direkter Upload) |
| EDIT | `src/pages/portal/projekte/ProjekteDashboard.tsx` (FormData → useUniversalUpload) |
| EDIT | `src/components/projekte/QuickIntakeUploader.tsx` (Bucket + Pfad vereinheitlichen) |
| EDIT | `src/components/finanzierung/FinanceUploadZone.tsx` (useSmartUpload → useUniversalUpload) |
| EDIT | `src/components/finanzierung/DocumentUploadSection.tsx` (Stub → echt) |
| EDIT | `src/hooks/useAcqOffers.ts` (acq-documents → tenant-documents) |
| EDIT | `src/hooks/usePvDMS.ts` (Pfad vereinheitlichen) |
| BEHALTEN | `src/hooks/useSmartUpload.ts` (Re-Export als Alias auf useUniversalUpload) |

### Implementierungsreihenfolge

1. DB-Migration (Step 1) — constraint fix, trigger update, backfill
2. `storageManifest.ts` + `useUniversalUpload.ts` (Step 2) — neue Dateien
3. StorageTab + DatenraumTab fixen (Step 3a) — hoechste Stabilitaetspriorität
4. ProjekteDashboard fixen (Step 3b) — gemeldeter Bug
5. Restliche Module umstellen (Step 3c)
