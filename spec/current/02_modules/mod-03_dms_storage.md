# MOD-07: DMS Storage Specification

**Version:** 1.0.0  
**Status:** FROZEN  
**Last Updated:** 2026-02-03

---

## Übersicht

Diese Spezifikation definiert die **exakte Ordnerstruktur** im DMS (MOD-03) für Finanzierungsunterlagen.

**Grundprinzip:** Dokumente werden NICHT in MOD-07 gespeichert, sondern im zentralen DMS. MOD-07 verlinkt nur via `document_links`.

---

## Storage-Hierarchie (FROZEN)

```
storage_nodes (root: tenant_id)
├── finanzierung/                          # System-Ordner
│   ├── bonitaetsunterlagen/               # Persönliche Bonitätsdokumente
│   │   ├── 01_Identitaet/
│   │   │   ├── personalausweis/
│   │   │   └── meldebescheinigung/
│   │   ├── 02_Einkommen/
│   │   │   ├── gehaltsabrechnungen/
│   │   │   ├── arbeitsvertrag/
│   │   │   ├── bwa/                       # Nur Unternehmer
│   │   │   └── steuerbescheid/            # Nur Unternehmer
│   │   └── 03_Vermoegen/
│   │       ├── kontoauszuege/
│   │       └── depotauszuege/
│   │
│   └── anfragen/                          # Request-spezifische Ordner
│       └── {request_public_id}/
│           └── 04_Objekt/
│               ├── expose/
│               ├── grundbuch/
│               ├── energieausweis/
│               └── grundrisse/
```

---

## Storage-Node Templates (FROZEN)

### FINANCE_APPLICANT_V1

Erstellt bei erster Finanzierungsanfrage eines Tenants:

```json
{
  "template": "FINANCE_APPLICANT_V1",
  "folders": [
    { "key": "01_identitaet", "name": "01_Identität", "doc_type_hints": ["DOC_ID_CARD", "DOC_REGISTRATION"] },
    { "key": "02_einkommen", "name": "02_Einkommen", "doc_type_hints": ["DOC_PAYSLIP", "DOC_EMPLOYMENT_CONTRACT", "DOC_BWA", "DOC_TAX_ASSESSMENT"] },
    { "key": "03_vermoegen", "name": "03_Vermögen", "doc_type_hints": ["DOC_BANK_STATEMENT", "DOC_SECURITIES"] }
  ]
}
```

### FINANCE_REQUEST_V1

Erstellt bei jeder neuen Anfrage:

```json
{
  "template": "FINANCE_REQUEST_V1",
  "folders": [
    { "key": "04_objekt", "name": "04_Objekt", "doc_type_hints": ["DOC_EXPOSE_BUY", "DOC_LAND_REGISTER", "DOC_ENERGY_CERT", "DOC_FLOORPLAN"] }
  ]
}
```

---

## Document Types (Finanzierung)

| doc_type | Label | Kategorie | Scope |
|----------|-------|-----------|-------|
| `DOC_ID_CARD` | Personalausweis | identity | applicant |
| `DOC_REGISTRATION` | Meldebescheinigung | identity | applicant |
| `DOC_PAYSLIP` | Gehaltsabrechnung | income | applicant |
| `DOC_EMPLOYMENT_CONTRACT` | Arbeitsvertrag | income | applicant |
| `DOC_BWA` | BWA | income | applicant (entrepreneur) |
| `DOC_TAX_ASSESSMENT` | Steuerbescheid | income | applicant (entrepreneur) |
| `DOC_BANK_STATEMENT` | Kontoauszug | assets | applicant |
| `DOC_SECURITIES` | Depotauszug | assets | applicant |
| `DOC_EXPOSE_BUY` | Exposé (Ankauf) | property | request |
| `DOC_LAND_REGISTER` | Grundbuchauszug | property | request |
| `DOC_ENERGY_CERT` | Energieausweis | property | request |
| `DOC_FLOORPLAN` | Grundriss | property | request |

---

## Document-Links Schema

```sql
document_links {
  id: uuid
  tenant_id: uuid
  document_id: uuid          -- Referenz zu documents
  node_id: uuid              -- storage_nodes Zielordner
  object_type: string        -- 'finance_request' | 'applicant_profile'
  object_id: uuid            -- ID des verknüpften Objekts
  link_status: string        -- 'active' | 'replaced'
  is_current: boolean        -- true für aktuelle Version
  version_note: string?      -- z.B. "Ersetzt am 2026-02-03"
}
```

---

## Seeding-Logik

### Bei Tenant-Initialisierung

```typescript
async function seedFinanceStorageNodes(tenantId: string) {
  // 1. System-Ordner "finanzierung" erstellen (falls nicht vorhanden)
  const finanzierungNode = await getOrCreateSystemNode(tenantId, 'finanzierung');
  
  // 2. Bonitätsunterlagen-Ordner erstellen
  const bonitaetNode = await createNode({
    tenant_id: tenantId,
    parent_id: finanzierungNode.id,
    name: 'bonitaetsunterlagen',
    node_type: 'folder',
    template: 'FINANCE_APPLICANT_V1'
  });
  
  // 3. Unterordner gemäß Template erstellen
  await seedFromTemplate(tenantId, bonitaetNode.id, 'FINANCE_APPLICANT_V1');
}
```

### Bei Anfrage-Erstellung

```typescript
async function createRequestStorageFolder(tenantId: string, requestId: string, publicId: string) {
  // 1. Anfragen-Ordner holen/erstellen
  const anfragenNode = await getOrCreateNode(tenantId, 'finanzierung/anfragen');
  
  // 2. Request-spezifischen Ordner erstellen
  const requestNode = await createNode({
    tenant_id: tenantId,
    parent_id: anfragenNode.id,
    name: publicId,  // z.B. "FIN-ABCDE"
    node_type: 'folder',
    object_type: 'finance_request',
    object_id: requestId,
    template: 'FINANCE_REQUEST_V1'
  });
  
  // 3. Unterordner gemäß Template erstellen
  await seedFromTemplate(tenantId, requestNode.id, 'FINANCE_REQUEST_V1');
  
  // 4. Request mit storage_folder_id verknüpfen
  await supabase.from('finance_requests')
    .update({ storage_folder_id: requestNode.id })
    .eq('id', requestId);
}
```

---

## Dokument-Upload Flow

1. **User wählt Kategorie** (z.B. "Einkommen")
2. **useSmartUpload** erhält:
   - `targetNodeKey`: `02_einkommen`
   - `objectType`: `applicant_profile`
   - `objectId`: `{profile_id}`
3. **Upload zu Supabase Storage**:
   - Path: `{tenant_id}/raw/{YYYY}/{MM}/{doc_id}`
4. **documents-Eintrag** erstellt mit:
   - `doc_type`: aus AI-Erkennung oder Manual
   - `scope`: `finanzierung`
5. **document_links-Eintrag** erstellt mit:
   - `node_id`: Ordner-ID von `02_einkommen`
   - `object_type`: `applicant_profile`
   - `object_id`: `{profile_id}`

---

## Abfrage: Dokumente einer Anfrage

```sql
SELECT d.*, dl.object_type, dl.object_id
FROM documents d
JOIN document_links dl ON d.id = dl.document_id
WHERE dl.object_type = 'finance_request'
  AND dl.object_id = '{request_id}'
  AND dl.is_current = true
  
UNION ALL

SELECT d.*, dl.object_type, dl.object_id
FROM documents d
JOIN document_links dl ON d.id = dl.document_id
JOIN applicant_profiles ap ON dl.object_id = ap.id::text
WHERE ap.finance_request_id = '{request_id}'
  AND dl.object_type = 'applicant_profile'
  AND dl.is_current = true;
```

---

## Acceptance Criteria

- [ ] Bonitätsunterlagen-Ordner wird bei erster Anfrage geseeded
- [ ] Request-Ordner wird bei Anfrage-Erstellung geseeded
- [ ] Uploads landen im korrekten node_id
- [ ] document_links werden korrekt erstellt
- [ ] DMS-View zeigt Finanzierungsordner im Tree
