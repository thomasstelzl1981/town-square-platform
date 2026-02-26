

# Befund: Claude's Analyse ist FALSCH — echte Root Cause gefunden

## Was Claude sagt vs. Realitaet

| Claude's Vorschlag | Aktueller DB-Status | Ergebnis |
|---|---|---|
| `is_kaufy_public_image_document` → STABLE + SECURITY DEFINER | **Bereits STABLE + SECURITY DEFINER** | ❌ Fix existiert bereits |
| `get_user_tenant_id` → STABLE + SECURITY DEFINER | **Bereits STABLE + SECURITY DEFINER** | ❌ Fix existiert bereits |
| `is_platform_admin` → STABLE + SECURITY DEFINER | **Bereits STABLE + SECURITY DEFINER** | ❌ Fix existiert bereits |

**Claude's gesamter Schritt 1 (Kernfix) ist bereits umgesetzt.** Der Upload scheitert trotzdem.

---

## Echte Root Cause: STORAGE-Policies mit Inline-JOINs

Die `storage.objects`-Tabelle hat zwei SELECT-Policies mit **rohen 4-Tabellen-JOINs direkt im Policy-SQL** — NICHT ueber SECURITY DEFINER Funktionen:

**Policy: `public_read_kaufy_listing_images`**
```sql
EXISTS (
  SELECT 1
  FROM documents d
  JOIN document_links dl ON d.id = dl.document_id
  JOIN listings l ON dl.object_id = l.property_id
  JOIN listing_publications lp ON lp.listing_id = l.id
  WHERE d.file_path = objects.name  -- ← korreliert mit JEDER Storage-Row
    AND dl.object_type = 'property'
    AND lp.channel = 'kaufy'
    AND lp.status = 'active'
)
```

**Policy: `partner_read_network_listing_documents`** — identischer 4-Tabellen-JOIN.

Diese Inline-JOINs laufen im User-Kontext und triggern RLS auf `documents` + `document_links` + `listings` + `listing_publications`. Auch wenn die Funktionen auf `documents`-Ebene schon SECURITY DEFINER sind — die Storage-Policies selbst umgehen das komplett durch direkte JOINs.

**Beweis aus DB-Logs:** Timeout kommt von User `supabase_storage_admin` — der Storage-Service evaluiert alle Policies (auch SELECT) waehrend des Uploads.

---

## Umsetzungsplan: 1 Migration, 0 Code-Aenderungen

### Schritt 1: Zwei SECURITY DEFINER Wrapper-Funktionen erstellen

```sql
-- Funktion 1: Kaufy-Check fuer Storage-Layer
CREATE OR REPLACE FUNCTION public.is_kaufy_storage_object(object_name text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM documents d
    JOIN document_links dl ON d.id = dl.document_id
    JOIN listings l ON dl.object_id = l.property_id
      AND dl.object_type = 'property'
    JOIN listing_publications lp ON lp.listing_id = l.id
    WHERE d.file_path = object_name
      AND d.mime_type LIKE 'image/%'
      AND lp.channel = 'kaufy'
      AND lp.status = 'active'
  );
$$;

-- Funktion 2: Partner-Network-Check fuer Storage-Layer
CREATE OR REPLACE FUNCTION public.is_partner_network_storage_object(object_name text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM documents d
    JOIN document_links dl ON d.id = dl.document_id
    JOIN listings l ON dl.object_id = l.property_id
      AND dl.object_type = 'property'
    JOIN listing_publications lp ON lp.listing_id = l.id
    WHERE d.file_path = object_name
      AND lp.channel = 'partner_network'
      AND lp.status = 'active'
  );
$$;
```

### Schritt 2: Storage-Policies auf Funktionsaufrufe umstellen

```sql
-- Policy 1: Kaufy Public Images — Inline-JOIN ersetzen
DROP POLICY IF EXISTS "public_read_kaufy_listing_images" ON storage.objects;
CREATE POLICY "public_read_kaufy_listing_images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'tenant-documents'
  AND public.is_kaufy_storage_object(name)
);

-- Policy 2: Partner Network Documents — Inline-JOIN ersetzen
DROP POLICY IF EXISTS "partner_read_network_listing_documents" ON storage.objects;
CREATE POLICY "partner_read_network_listing_documents" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'tenant-documents'
  AND public.is_partner_network_storage_object(name)
);
```

### Schritt 3: Performance-Indizes (optional, gleiche Migration)

```sql
CREATE INDEX IF NOT EXISTS idx_profiles_id_active_tenant
  ON profiles (id, active_tenant_id);

CREATE INDEX IF NOT EXISTS idx_document_links_object_type_property
  ON document_links (object_id, document_id)
  WHERE object_type = 'property';

CREATE INDEX IF NOT EXISTS idx_listing_publications_channel_status
  ON listing_publications (listing_id, channel, status)
  WHERE status = 'active';
```

---

## Was sich NICHT aendert

- Keine TypeScript-Dateien
- Keine RLS-Policies auf `documents`, `document_links`, `listings`
- Keine Storage-Bucket-Konfiguration
- `useImageSlotUpload.ts` bleibt unberuehrt

## Erwartetes Ergebnis

Storage-Upload geht durch in < 2s, weil die SELECT-Policies auf `storage.objects` jetzt ueber SECURITY DEFINER laufen und keinen RLS-Cascade mehr ausloesen.

