# Storage Audit — Alle Buckets, Pfade & Datenräume

> **Version**: 2.0.0  
> **Datum**: 2026-03-07  
> **Status**: ACTIVE — SSOT Normalization Complete

---

## 1. Bucket-Inventar

| # | Bucket | Public | Verwendet von | Pfadmuster |
|---|--------|--------|---------------|------------|
| 1 | `tenant-documents` | nein | MOD-00 bis MOD-22 (DMS SSOT) | `{tenant_id}/{module_code}/{entity_id}/{file}` |
| 2 | `acq-documents` | nein | **LEGACY** — Dateien migriert zu tenant-documents | deprecated |
| 3 | `pet-photos` | ja | **LEGACY** — Dateien migriert zu tenant-documents | deprecated |
| 4 | `project-documents` | nein | MOD-13 (Projekte) — teilweise | `{project_id}/...` |
| 5 | `public-intake` | ja | Zone 3 (Kaufy Verkäufer-Form) | `{session_id}/expose_{file}` |
| 6 | `social-assets` | ja | MOD-14 (Social Assets) | DB-gesteuert |
| 7 | `audit-reports` | nein | Zone 1 (Admin Audit) | `{date}/{report_id}/report.md` |
| 8 | `docs-export` | ja | Zone 1 (Admin Docs Export) | `{filename}.zip` |
| 9 | `website-assets` | ja | Zone 3 (Website-Bilder) | variabel |
| 10 | `documents` | nein | Legacy | unbekannt |

---

## 2. SSOT-Konformität pro Modul

| Modul | Bucket | useUniversalUpload | DMS (documents+storage_nodes) | Status |
|-------|--------|--------------------|-------------------------------|--------|
| MOD-00 | tenant-documents | ✅ | ✅ | ✅ |
| MOD-01 | tenant-documents | ✅ | ✅ | ✅ |
| MOD-02 | tenant-documents | ✅ | ✅ | ✅ |
| MOD-03 | tenant-documents | ✅ | ✅ (SFM) | ✅ |
| MOD-04 | tenant-documents | ✅ | ✅ (v2: OfferComparison added) | ✅ |
| MOD-05 | tenant-documents | ✅ | ✅ | ✅ |
| MOD-06 | tenant-documents | ✅ | ✅ | ✅ |
| MOD-07 | tenant-documents | ✅ | ✅ | ✅ |
| MOD-08 | tenant-documents | ✅ | ✅ | ✅ |
| MOD-09 | tenant-documents | ✅ | ✅ | ✅ |
| MOD-10 | tenant-documents | ✅ | ✅ | ✅ |
| MOD-11 | tenant-documents | ✅ | ✅ | ✅ |
| MOD-12 | tenant-documents | ✅ (v2: SSOT) | ✅ (documents+storage_nodes) | ✅ |
| MOD-13 | project-documents | Teilweise | ✅ | 🟡 |
| MOD-14 | tenant-documents | ✅ | ✅ | ✅ |
| MOD-15 | tenant-documents | ✅ | ✅ | ✅ |
| MOD-16 | tenant-documents | ✅ (v2: TestamentVorlage) | ✅ | ✅ |
| MOD-17 | tenant-documents | ✅ | ✅ | ✅ |
| MOD-18 | tenant-documents | ✅ | ✅ | ✅ |
| MOD-19 | tenant-documents | ✅ | ✅ | ✅ |
| MOD-20 | tenant-documents | ✅ | ✅ | ✅ |
| MOD-22 | tenant-documents | ✅ (v2: SSOT) | ✅ (signed URLs) | ✅ |

---

## 3. Upload-Pfade die useUniversalUpload umgehen

| Datei | Bucket | Status |
|-------|--------|--------|
| `useExposeUpload.ts` | tenant-documents | ✅ SSOT (v2) |
| `ExposeDragDropUploader.tsx` | tenant-documents | ✅ SSOT (v2) |
| `usePetDossier.ts` | tenant-documents | ✅ SSOT (v2) |
| `PetsMeineTiere.tsx` | tenant-documents | ✅ SSOT (v2) |
| `TestamentVorlageInline.tsx` | tenant-documents | ✅ SSOT (v2) — DMS registriert |
| `OfferComparisonPanel.tsx` | tenant-documents | ✅ SSOT (v2) — DMS registriert |
| `BrandPostCreator.tsx` | tenant-documents | ✅ SSOT (v2) — signedUrl statt getPublicUrl |
| `contractGenerator.ts` | tenant-documents | ✅ SSOT (v2) — storage_nodes hinzugefügt |

---

## 4. Kanonisches Pfadmuster (SSOT)

```
tenant-documents/{tenant_id}/{module_code}/{entity_id}/{timestamp}_{filename}
```

Ausnahmen:
- INBOX Fallback: `{tenant_id}/INBOX/{file}`
- Zone 3 public-intake: `{session_id}/expose_{file}` (kein Tenant-Kontext)

---

## 5. Normalisierungsmaßnahmen

| Prio | Maßnahme | Status |
|------|----------|--------|
| P0 | MOD_00 im storageManifest | ✅ Done |
| P1 | useArmstrongDocUpload → SSOT | ✅ Done |
| P2 | MOD-12 entity_sub_folders | ✅ Done |
| P3 | Signatur-Upload normalisieren | ✅ Done |
| P4 | Bucket-Konsolidierung (acq-documents → tenant-documents) | ✅ Done (v2) |
| P5 | Armstrong Datenraum UI | ✅ Done |
| P6 | MOD-22 pet-photos → tenant-documents | ✅ Done (v2) |
| P7 | TestamentVorlage DMS-Registrierung | ✅ Done (v2) |
| P8 | OfferComparisonPanel DMS-Registrierung | ✅ Done (v2) |
| P9 | BrandPostCreator signedUrl | ✅ Done (v2) |
| P10 | contractGenerator storage_nodes | ✅ Done (v2) |
| P11 | Edge Functions Bucket-Sync | ✅ Done (v2) |

---

## 6. Edge Functions mit Bucket-Referenz

| Edge Function | Bucket | Status |
|---|---|---|
| `sot-acq-offer-extract` | tenant-documents | ✅ SSOT (v2) |
| `sot-acq-inbound-webhook` | tenant-documents | ✅ SSOT (v2) |
| `sot-tenant-storage-reset` | tenant-documents + legacy cleanup | ✅ SSOT (v2) |

---

## 7. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2026-03-07 | Initial Audit: P0+P1+P2 implementiert |
| 1.1.0 | 2026-03-07 | P3 (Signatur SSOT) + P5 (Armstrong Datenraum UI) implementiert |
| 2.0.0 | 2026-03-07 | **SSOT Normalization Complete**: AP-1 bis AP-5 — alle Module auf tenant-documents, DMS-Registrierung überall, Edge Functions synchronisiert, pet-photos + acq-documents deprecated |
