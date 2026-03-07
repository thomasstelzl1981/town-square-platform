# Storage Audit — Alle Buckets, Pfade & Datenräume

> **Version**: 1.0.0  
> **Datum**: 2026-03-07  
> **Status**: ACTIVE

---

## 1. Bucket-Inventar

| # | Bucket | Public | Verwendet von | Pfadmuster |
|---|--------|--------|---------------|------------|
| 1 | `tenant-documents` | nein | MOD-00 bis MOD-21 (DMS SSOT) | `{tenant_id}/{module_code}/{entity_id}/{file}` |
| 2 | `acq-documents` | nein | MOD-12 (Akquise) | `{tenant_id}/{mandate_id}/{offer_id}/expose/{file}` |
| 3 | `pet-photos` | ja | MOD-22 (Pets) + Zone 3 | `{tenant_id}/{pet_id}/gallery/{file}` |
| 4 | `project-documents` | nein | MOD-13 (Projekte) | `{project_id}/...` |
| 5 | `public-intake` | ja | Zone 3 (Kaufy Verkäufer-Form) | `{session_id}/expose_{file}` |
| 6 | `social-assets` | ja | MOD-14 (Social Assets) | DB-gesteuert |
| 7 | `audit-reports` | nein | Zone 1 (Admin Audit) | `{date}/{report_id}/report.md` |
| 8 | `docs-export` | ja | Zone 1 (Admin Docs Export) | `{filename}.zip` |
| 9 | `website-assets` | ja | Zone 3 (Website-Bilder) | variabel |
| 10 | `documents` | nein | Legacy | unbekannt |

---

## 2. SSOT-Konformität pro Modul

| Modul | Bucket | useUniversalUpload | storageManifest | EntityStorageTree | Status |
|-------|--------|--------------------|-----------------|-------------------|--------|
| MOD-00 | tenant-documents | ✅ (v4) | ✅ MOD_00 | ⬜ UI frozen | 🟡 |
| MOD-01 | tenant-documents | ✅ | ✅ | ✅ | ✅ |
| MOD-02 | tenant-documents | ✅ (Signatur: ❌) | ✅ | Indirekt | 🟡 |
| MOD-03 | tenant-documents | ✅ | ✅ | ✅ (SFM) | ✅ |
| MOD-04 | tenant-documents | ✅ | ✅ | ✅ | ✅ |
| MOD-05 | tenant-documents | ✅ | ✅ | ✅ | ✅ |
| MOD-06 | tenant-documents | ✅ | ✅ | ✅ | ✅ |
| MOD-07 | tenant-documents | ✅ | ✅ | ✅ | ✅ |
| MOD-08 | tenant-documents | ✅ | ✅ | ✅ | ✅ |
| MOD-09 | tenant-documents | ✅ | ✅ | ✅ | ✅ |
| MOD-10 | tenant-documents | ✅ | ✅ | ✅ | ✅ |
| MOD-11 | tenant-documents | ✅ | ✅ | ✅ | ✅ |
| MOD-12 | acq-documents | ❌ eigene Hooks | ✅ (sub_folders) | Custom AcqDataRoom | 🔴 |
| MOD-13 | project-documents | Teilweise | ✅ | ✅ | 🟡 |
| MOD-14 | tenant-documents | ✅ | ✅ | ✅ | ✅ |
| MOD-15 | tenant-documents | ✅ | ✅ | ✅ | ✅ |
| MOD-16 | tenant-documents | ✅ | ✅ | ✅ | ✅ |
| MOD-17 | tenant-documents | ✅ | ✅ | ✅ | ✅ |
| MOD-18 | tenant-documents | ✅ | ✅ | ✅ | ✅ |
| MOD-19 | tenant-documents | ✅ | ✅ | ✅ | ✅ |
| MOD-20 | tenant-documents | ✅ | ✅ | ✅ | ✅ |
| MOD-22 | pet-photos | ❌ eigene Logik | ✅ (leer) | ❌ | 🔴 |

---

## 3. Upload-Pfade die useUniversalUpload umgehen

| Datei | Bucket | Status |
|-------|--------|--------|
| `useExposeUpload.ts` | acq-documents | Bekannt, MOD-12 Sonderfall |
| `ExposeDragDropUploader.tsx` | acq-documents | Bekannt, MOD-12 Sonderfall |
| `BriefPreviewCard.tsx` (Signatur) | tenant-documents | 🟡 P3 — Normalisierung ausstehend |
| `usePetDossier.ts` | pet-photos | 🔴 P4 — Bucket-Konsolidierung |
| `PetsMeineTiere.tsx` | pet-photos | 🔴 P4 — Bucket-Konsolidierung |

---

## 4. Kanonisches Pfadmuster (SSOT)

```
tenant-documents/{tenant_id}/{module_code}/{entity_id}/{timestamp}_{filename}
```

Ausnahmen:
- MOD-12 (acq-documents): `{tenant_id}/{mandate_id}/{offer_id}/expose/{file}`
- MOD-22 (pet-photos): `{tenant_id}/{pet_id}/gallery/{file}`
- INBOX Fallback: `{tenant_id}/INBOX/{file}`

---

## 5. Offene Normalisierungsmaßnahmen

| Prio | Maßnahme | Status |
|------|----------|--------|
| P0 | MOD_00 im storageManifest | ✅ Done |
| P1 | useArmstrongDocUpload → SSOT | ✅ Done |
| P2 | MOD-12 entity_sub_folders | ✅ Done |
| P3 | Signatur-Upload normalisieren | ✅ Done |
| P4 | Bucket-Konsolidierung | ⬜ Separater Sprint |
| P5 | Armstrong Datenraum UI | ✅ Done |

---

## 6. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2026-03-07 | Initial Audit: P0+P1+P2 implementiert |
| 1.1.0 | 2026-03-07 | P3 (Signatur SSOT) + P5 (Armstrong Datenraum UI) implementiert |
