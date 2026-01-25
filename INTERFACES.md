# Module Interfaces

> **Version**: 1.0  
> **Datum**: 2026-01-21  
> **Status**: Verbindlich

Dieses Dokument definiert die erlaubten Cross-Module-Aktionen als "Interface Actions".

---

## Grundprinzipien

1. **Keine wilden Cross-Module Writes** - Ein Modul schreibt nur in eigene Tabellen
2. **Interface Actions sind explizit definiert** - Nur hier dokumentierte Aktionen sind erlaubt
3. **Consent-Gates vor sensiblen Aktionen** - Bestimmte Actions erfordern vorherige Zustimmung
4. **Audit-Trail für alle Cross-Module-Actions** - Änderungen werden in `audit_events` erfasst

---

## 1. Immobilien → Sales Partner

### READ Actions

| Action | Beschreibung | Filter |
|--------|--------------|--------|
| `ListPublicListings` | Öffentliche Listings abrufen | `properties WHERE is_public_listing = true` |
| `GetPropertySummary` | Property-Details für Pipeline | `properties WHERE id = :property_id` |
| `GetPropertyFinancing` | Finanzierungsdaten für Matching | `property_financing WHERE property_id = :id` |

### WRITE Actions

**Keine** - Sales Partner schreibt nicht in Immobilien-Tabellen.

---

## 2. Immobilien → Financing

### READ Actions

| Action | Beschreibung | Filter |
|--------|--------------|--------|
| `GetPropertyForPackage` | Property für Finance-Paket | `properties WHERE id = :property_id AND tenant_id = :tenant_id` |
| `GetPropertyDocuments` | Dokumente für Paket | `documents` via `access_grants` |

### WRITE Actions

**Keine** - Financing schreibt nicht in Immobilien-Tabellen.

---

## 3. Sales Partner → Agreements

### REQUIRE Actions (Consent-Gates)

| Action | Consent-Code | Prüfung | Trigger |
|--------|--------------|---------|---------|
| `RequireConsent(SALES_MANDATE)` | `SALES_MANDATE` | Vor Commission-Erstellung | `commissions.INSERT` |
| `RequireConsent(COMMISSION_AGREEMENT)` | `COMMISSION_AGREEMENT` | Vor Commission-Approval | `commissions.status → approved` |

### Implementation (App-Layer)

```typescript
// Vor Commission-Erstellung prüfen
async function createCommission(data: CommissionData): Promise<Commission> {
  // 1. Consent prüfen
  const consent = await supabase
    .from('user_consents')
    .select('id')
    .eq('user_id', data.userId)
    .eq('template_code', 'SALES_MANDATE')
    .eq('status', 'accepted')
    .maybeSingle();
    
  if (!consent.data) {
    throw new Error('CONSENT_REQUIRED: SALES_MANDATE');
  }
  
  // 2. Commission erstellen mit Consent-Referenz
  const commission = await supabase
    .from('commissions')
    .insert({
      ...data,
      agreement_consent_id: consent.data.id
    });
    
  // 3. Audit-Event
  await supabase.from('audit_events').insert({
    event_type: 'commission_created',
    actor_user_id: auth.uid(),
    target_org_id: data.tenant_id,
    payload: { commission_id: commission.data.id, consent_id: consent.data.id }
  });
  
  return commission.data;
}
```

---

## 4. Financing → Agreements

### REQUIRE Actions (Consent-Gates)

| Action | Consent-Code | Prüfung | Trigger |
|--------|--------------|---------|---------|
| `RequireConsent(DATA_SHARING_FUTURE_ROOM)` | `DATA_SHARING_FUTURE_ROOM` | Vor Export/Handoff | `finance_packages.exported_at` setzen |

### Implementation (App-Layer)

```typescript
// Finance Package Export mit Consent-Check
async function exportFinancePackage(packageId: string): Promise<void> {
  const { data: pkg } = await supabase
    .from('finance_packages')
    .select('*, contact:contacts(*)')
    .eq('id', packageId)
    .single();
    
  // 1. Status prüfen
  if (pkg.status !== 'ready_for_handoff') {
    throw new Error('Package must be ready_for_handoff before export');
  }
  
  // 2. Consent prüfen
  const consent = await supabase
    .from('user_consents')
    .select('id')
    .eq('user_id', pkg.contact.user_id)
    .eq('template_code', 'DATA_SHARING_FUTURE_ROOM')
    .eq('status', 'accepted')
    .maybeSingle();
    
  if (!consent.data) {
    throw new Error('CONSENT_REQUIRED: DATA_SHARING_FUTURE_ROOM');
  }
  
  // 3. Export durchführen
  const { error } = await supabase
    .from('finance_packages')
    .update({
      exported_at: new Date().toISOString(),
      exported_by: auth.uid(),
      data_sharing_consent_id: consent.data.id
    })
    .eq('id', packageId);
    
  // 4. Audit-Event
  await supabase.from('audit_events').insert({
    event_type: 'finance_exported',
    actor_user_id: auth.uid(),
    target_org_id: pkg.tenant_id,
    payload: { 
      package_id: packageId, 
      consent_id: consent.data.id,
      contact_id: pkg.contact_id 
    }
  });
}
```

---

## 5. Financing → Documents

### LINK Actions

| Action | Beschreibung | Tabelle |
|--------|--------------|---------|
| `AttachDocumentToFinancePackage` | Dokument zu Paket verknüpfen | `finance_documents` |
| `DetachDocumentFromFinancePackage` | Verknüpfung entfernen | `finance_documents` |

### Implementation

```typescript
async function attachDocument(
  packageId: string, 
  documentId: string, 
  documentType: string
): Promise<void> {
  // 1. Prüfen ob Dokument zum gleichen Tenant gehört
  const [pkg, doc] = await Promise.all([
    supabase.from('finance_packages').select('tenant_id').eq('id', packageId).single(),
    supabase.from('documents').select('tenant_id').eq('id', documentId).single()
  ]);
  
  if (pkg.data.tenant_id !== doc.data.tenant_id) {
    throw new Error('Cross-tenant document linking not allowed');
  }
  
  // 2. Verknüpfung erstellen
  await supabase.from('finance_documents').insert({
    tenant_id: pkg.data.tenant_id,
    finance_package_id: packageId,
    document_id: documentId,
    document_type: documentType
  });
}
```

---

## 6. Admin (Platform) → Alles

### God Mode Access

| Action | Scope | Audit |
|--------|-------|-------|
| `READ_ANY` | Alle Tabellen, alle Tenants | Nein (implicit via RLS) |
| `WRITE_ANY` | Alle Tabellen, alle Tenants | **Ja** (alle Änderungen) |
| `DELETE_ANY` | Erlaubte Tabellen | **Ja** (kritisch) |

### Implementation

Platform Admin Actions werden automatisch über RLS ermöglicht (`is_platform_admin()` Bypass).

**Audit-Pflicht für Platform Admin:**
```typescript
// Bei allen schreibenden Aktionen durch Platform Admin
await supabase.from('audit_events').insert({
  event_type: `platform_admin_${action}`,
  actor_user_id: auth.uid(),
  target_org_id: targetTenantId,
  payload: { action, entity_type, entity_id, changes }
});
```

---

## 7. Zone 3 Website → Immobilien

### READ Actions (Public)

| Action | Beschreibung | RLS |
|--------|--------------|-----|
| `ListPublicProperties` | Öffentliche Listings | `properties WHERE is_public_listing = true` |
| `GetPublicPropertyDetail` | Property-Detail (public fields only) | Filtered Columns |

### Implementation

Zone 3 verwendet separate RLS-Policies oder Views, die nur public-freigegebene Daten exponieren.

```sql
-- Beispiel: Public Listings View (Phase 2)
CREATE VIEW public.public_listings AS
SELECT 
  id, address, city, postal_code, property_type,
  total_area_sqm, market_value, description
FROM properties
WHERE is_public_listing = true;
```

---

## 8. Interface Validation Checklist

Bei jeder neuen Cross-Module-Aktion prüfen:

- [ ] Ist die Aktion in diesem Dokument definiert?
- [ ] Erfüllt sie die Consent-Anforderungen?
- [ ] Wird ein Audit-Event erstellt?
- [ ] Ist die RLS-Policy korrekt konfiguriert?
- [ ] Ist kein Cross-Tenant-Leak möglich?
- [ ] Bleibt das Zielmodul "Source of Truth"?

---

---

## 10. KI Office (MOD-02) → DMS (MOD-03)

### READ Actions

| Action | Beschreibung | Tabelle |
|--------|--------------|---------|
| `GetDocumentForPreview` | Dokument für Brief-Anhang | `documents` |

### WRITE Actions

| Action | Beschreibung | Tabelle |
|--------|--------------|---------|
| `ArchiveLetterAsDMS` | Versendeten Brief als Dokument archivieren | `documents`, `letter_sent` |

### Implementation

```typescript
async function archiveLetterToDMS(letterId: string): Promise<void> {
  const { data: letter } = await supabase
    .from('letter_sent')
    .select('*')
    .eq('id', letterId)
    .single();

  // 1. PDF als Document speichern
  const { data: doc } = await supabase
    .from('documents')
    .insert({
      tenant_id: letter.tenant_id,
      name: `Brief_${letter.recipient_name}_${letter.created_at}`,
      file_path: letter.pdf_path,
      mime_type: 'application/pdf',
      size_bytes: letter.pdf_size
    })
    .select()
    .single();

  // 2. Link zum Kontakt erstellen
  await supabase.from('document_links').insert({
    tenant_id: letter.tenant_id,
    document_id: doc.id,
    object_type: 'contact',
    object_id: letter.contact_id
  });

  // 3. Audit-Event
  await supabase.from('audit_events').insert({
    event_type: 'document_archived',
    actor_user_id: auth.uid(),
    target_org_id: letter.tenant_id,
    payload: { letter_id: letterId, document_id: doc.id }
  });
}
```

---

## 11. KI Office (MOD-02) → Core/Backbone

### READ Actions

| Action | Beschreibung | Tabelle |
|--------|--------------|---------|
| `GetContactsForLetter` | Kontakte für Briefgenerator | `contacts` |
| `GetSenderIdentity` | Absenderdaten für Brief-PDF | `profiles`, `organizations` |

### WRITE Actions

| Action | Beschreibung | Tabelle |
|--------|--------------|---------|
| `CreateCommunicationEvent` | Kommunikation protokollieren | `communication_events` |

### Implementation

```typescript
async function logCommunication(data: {
  channel: 'email_system' | 'fax' | 'post';
  direction: 'outbound';
  contactId: string;
  subject: string;
  bodyPreview: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  await supabase.from('communication_events').insert({
    tenant_id: await getActiveTenantId(),
    channel: data.channel,
    direction: data.direction,
    contact_id: data.contactId,
    subject: data.subject,
    body_preview: data.bodyPreview.substring(0, 500),
    status: 'sent',
    metadata: data.metadata
  });
}
```

---

## 12. DMS (MOD-03) → Core/Backbone

### READ Actions

| Action | Beschreibung | Tabelle |
|--------|--------------|---------|
| `GetContactForAssignment` | Kontakt für Dokument-Zuordnung | `contacts` |
| `GetOrganizationForRouting` | Org für Inbound-Routing | `organizations` |

### WRITE Actions

| Action | Beschreibung | Tabelle |
|--------|--------------|---------|
| `LogInboundAssignment` | Zuordnung protokollieren | `audit_events` |

---

## 13. DMS (MOD-03) → Immobilien (MOD-04)

### READ Actions

| Action | Beschreibung | Tabelle |
|--------|--------------|---------|
| `GetPropertyForDocumentLink` | Property für Zuordnung | `properties` |
| `GetUnitForDocumentLink` | Unit für Zuordnung | `units` |

### WRITE Actions

**Keine** - DMS schreibt nicht in Immobilien-Tabellen. Verknüpfung erfolgt über `document_links` (DMS-eigene Tabelle).

---

## 14. Stammdaten (MOD-01) → Core/Backbone

### READ Actions

| Action | Beschreibung | Tabelle |
|--------|--------------|---------|
| `GetTeamMembers` | Mitglieder der Organisation | `memberships`, `profiles` |
| `GetDelegations` | Aktive Delegations | `org_delegations` |

### WRITE Actions

| Action | Beschreibung | Tabelle |
|--------|--------------|---------|
| `UpdateProfile` | Eigenes Profil aktualisieren | `profiles` |
| `CreateDelegation` | Neue Delegation anlegen | `org_delegations` |
| `InviteTeamMember` | Mitglied einladen | `memberships` |

---

## 15. Governance

- **Neue Interface Actions** erfordern ADR in `DECISIONS.md`
- **Änderungen an Consent-Gates** erfordern Security-Review
- **Alle Actions müssen testbar sein** (Unit Tests für Consent-Checks)
- **Dokumentation vor Implementation** - Keine undokumentierten Cross-Module-Writes

---

## 16. KI Office (MOD-02) ↔ DMS (MOD-03) — Armstrong Document Integration

### READ Actions (Armstrong → DMS)

Armstrong greift auf DMS-Daten zu für Dokumentensuche und -analyse:

| Action | Beschreibung | Tabelle | RLS |
|--------|--------------|---------|-----|
| `SearchDocuments` | Volltextsuche in Chunks | `document_chunks` | tenant_id |
| `GetDocumentContent` | Chunks für Analyse laden | `document_chunks` | tenant_id |
| `GetDocumentMetadata` | Status, Links, Metadaten | `documents`, `extractions` | tenant_id |

### WRITE Actions (mit Confirmation-First Policy!)

| Action | Beschreibung | Consent Required |
|--------|--------------|------------------|
| `LinkDocumentToEntity` | Dokument mit Property/Contact/Unit verknüpfen | **JA - User-Bestätigung** |

### Implementation (Edge Function: armstrong-chat)

Die Armstrong Edge Function erhält folgende DMS-Tools:

```typescript
const dmsTools = [
  {
    name: 'search_documents',
    description: 'Suche in ausgelesenen Dokumenten',
    parameters: {
      query: { type: 'string', description: 'Suchbegriff' },
      filters: { 
        type: 'object', 
        properties: {
          node_id: { type: 'string' },
          doc_type: { type: 'string' },
          date_range: { type: 'object' }
        }
      }
    },
    implementation: async (params) => {
      return supabase.rpc('search_document_chunks', {
        search_query: params.query,
        tenant_id: context.tenant_id
      });
    }
  },
  {
    name: 'get_document_content',
    description: 'Lade Volltext eines Dokuments für Analyse',
    parameters: {
      document_id: { type: 'uuid' }
    },
    implementation: async (params) => {
      const chunks = await supabase
        .from('document_chunks')
        .select('text, chunk_index')
        .eq('document_id', params.document_id)
        .eq('tenant_id', context.tenant_id)
        .order('chunk_index');
      return chunks.data.map(c => c.text).join('\n\n');
    }
  },
  {
    name: 'link_document',
    description: 'Verknüpfe Dokument mit Entity (erfordert User-Bestätigung)',
    parameters: {
      document_id: { type: 'uuid' },
      target_type: { type: 'string', enum: ['property', 'contact', 'unit'] },
      target_id: { type: 'uuid' }
    },
    requires_confirmation: true, // KRITISCH!
    confirmation_message: (params) => 
      `Dokument mit ${params.target_type} verknüpfen?`
  }
];
```

### RLS-Regeln

- Armstrong agiert im User-Context (auth.uid())
- Nur tenant_id-gefilterte Ergebnisse
- Keine Cross-Tenant-Leaks möglich
- Extraction muss `status = 'done'` haben

### Voraussetzungen

Damit Armstrong auf ein Dokument zugreifen kann:

1. Dokument gehört zum aktuellen Tenant
2. Extraction wurde durchgeführt (`status = 'done'`)
3. Chunks existieren in `document_chunks`
4. User hat Leseberechtigung (Tenant Member)

---

## 17. MOD-04 (Immobilien) ↔ Cross-Module Interfaces

### 17.1 MOD-04 → MOD-03 (DMS)

| Action | Type | Description | Tabelle |
|--------|------|-------------|---------|
| `GetDocumentsByObject` | READ | Dokumente für property_id | `document_links` → `documents` |
| `LinkDocument` | WRITE | document_links erstellen | `document_links` |
| `UploadToObject` | WRITE | Upload mit auto-link | `documents` + `document_links` |
| `GetSignedUrl` | READ | Download/Preview URL | via Storage |

**RLS:** `tenant_id` Match + `object_id` Filter

**Implementation:**
```typescript
async function getPropertyDocuments(propertyId: string) {
  return supabase
    .from('document_links')
    .select('*, document:documents(*)')
    .eq('object_type', 'property')
    .eq('object_id', propertyId);
}
```

### 17.2 MOD-04 → MOD-05 (MSV)

| Trigger | Effect | Direction |
|---------|--------|-----------|
| `rental_managed = true` | Property/Units sichtbar in MOD-05 | MOD-04 → MOD-05 |
| Deep Link | `/portal/msv?property_id=:id` | MOD-04 UI → MOD-05 Route |

**Regel:** MOD-04 setzt Flag, MOD-05 liest Flag und zeigt nur entsprechende Properties.

**Keine direkten Writes** - MOD-05 besitzt eigene Lease/Payment-Tabellen.

### 17.3 MOD-04 → MOD-06/07 (Verkauf/Partner)

| Trigger | Effect | Direction |
|---------|--------|-----------|
| `sale_enabled = true` | Property sichtbar in MOD-06/07 | MOD-04 → MOD-06/07 |
| Consent Gate | `SALES_MANDATE` erforderlich | MOD-06 prüft vor Aktion |

**Regel:** MOD-04 setzt nur das Flag, keine Partner-/Deal-Logik.

### 17.4 MOD-04 → MOD-08 (Finanzierung)

| Action | Type | Description | FK |
|--------|------|-------------|-----|
| `GetPropertyForPackage` | READ | Stammdaten für finance_packages | `finance_packages.property_id` → `properties.id` |

**Implementation:**
```typescript
async function getPropertyForFinancePackage(propertyId: string) {
  return supabase
    .from('properties')
    .select(`
      *,
      financing:property_financing(*),
      units(*)
    `)
    .eq('id', propertyId)
    .single();
}
```

### 17.5 MOD-04 → Zone 1 (Oversight)

| View | Description | Access |
|------|-------------|--------|
| `ImmobilienStatusView` | Alle Properties mit Flags/Status | platform_admin READ |
| `SanierungQueueView` | Offene Service Cases | platform_admin READ |
| `BewertungHistoryView` | Valuations aller Tenants | platform_admin READ |

**Regel:** Zone 1 hat nur READ-Zugriff, keine Writes.

### 17.6 MOD-04 Sanierung → Resend (Integration)

| Action | Direction | Description |
|--------|-----------|-------------|
| `SendOutbound` | MOD-04 → Resend | Ausschreibungs-Mail senden |
| `InboundWebhook` | Resend → MOD-04 | Angebot empfangen + parsen |

**Edge Functions:**
- `sanierung-outbound`: Draft erstellen, nach Confirmation senden
- `sanierung-inbound`: Webhook empfangen, Tender-ID extrahieren, zuordnen

### 17.7 MOD-04 Bewertung → Sprengnetter (Integration)

| Action | Direction | Description |
|--------|-----------|-------------|
| `Estimate` | MOD-04 → Sprengnetter | Kosten/Credits abfragen |
| `RequestValuation` | MOD-04 → Sprengnetter | Bewertung starten |
| `ReceiveResult` | Sprengnetter → MOD-04 | Ergebnis + Report |

**Edge Function:** `valuation-worker`
- Job Queue basiert
- Consent-Check vor Start
- Report-PDF im DMS ablegen

---

## 18. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-01-21 | Initial (Sections 1-9) |
| 1.1 | 2026-01-25 | Sections 10-14 hinzugefügt (MOD-01, MOD-02, MOD-03 Interfaces) |
| 1.2 | 2026-01-25 | Section 16 hinzugefügt (Armstrong Document Integration) |
| 1.3 | 2026-01-25 | **Section 17 hinzugefügt (MOD-04 Immobilien Cross-Module Interfaces)** |
