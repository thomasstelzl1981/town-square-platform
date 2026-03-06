

# Plan: Fix `documents_source_check` Constraint Violation

## Root Cause

The `documents` table has a CHECK constraint that only allows these `source` values:
`upload`, `resend`, `caya`, `dropbox`, `onedrive`, `gdrive`, `import`, `email`, `project_intake`, `cloud_sync`

Two components pass invalid `source` values:
- `DatenraumTab.tsx` line 93: `source: 'datenraum'` -- not allowed
- `EntityStorageTree.tsx` line 194: `source: 'entity-storage-tree'` -- not allowed

## Fix

Two options, I recommend Option A for minimal risk:

**Option A (code fix only):** Change both `source` values to `'upload'`, which is the correct semantic value for user-initiated file uploads. No DB migration needed.

| # | Datei | Zeile | Alt | Neu |
|---|---|---|---|---|
| 1 | `src/components/portfolio/DatenraumTab.tsx` | 93 | `source: 'datenraum'` | `source: 'upload'` |
| 2 | `src/components/shared/EntityStorageTree.tsx` | 194 | `source: 'entity-storage-tree'` | `source: 'upload'` |

This fixes all uploads systemweit -- both in the Immobilien-Datenraum and in all RecordCard-Datenraeume (Personen, Versicherungen, PV, Fahrzeuge etc.).

