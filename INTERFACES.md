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

## 9. Governance

- **Neue Interface Actions** erfordern ADR in `DECISIONS.md`
- **Änderungen an Consent-Gates** erfordern Security-Review
- **Alle Actions müssen testbar sein** (Unit Tests für Consent-Checks)
- **Dokumentation vor Implementation** - Keine undokumentierten Cross-Module-Writes
