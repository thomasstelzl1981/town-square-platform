# ADR-039 — WORKER ARCHITECTURE (Canonical Spec v1.0)

> **Version**: 1.0  
> **Status**: FROZEN  
> **Datum**: 2026-01-25  
> **Zone**: 2 (User Portal) / MOD-03 DMS

---

## Decision

DB-backed Job Queue mit Edge Function Worker für asynchrone Langzeit-Operationen. Keine externen Queue-Services (wie Redis, SQS).

---

## A) Jobs-Tabelle (Schema)

```sql
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'queued',
  priority int NOT NULL DEFAULT 0,
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 4,
  run_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  result jsonb,
  error_message text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index für Worker-Polling
CREATE INDEX idx_jobs_polling 
ON jobs(status, run_at, priority DESC) 
WHERE status = 'queued';

-- Index für Tenant-Abfragen
CREATE INDEX idx_jobs_tenant 
ON jobs(tenant_id, created_at DESC);

-- RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Tenant Members können eigene Jobs sehen
CREATE POLICY "Tenant can view jobs"
ON jobs FOR SELECT
USING (tenant_id IN (
  SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()
));

-- Nur Service Role kann Jobs updaten (Worker)
CREATE POLICY "Service role manages jobs"
ON jobs FOR ALL
USING (auth.role() = 'service_role');
```

---

## B) Job Status Lifecycle

```
queued → running → done
           ↓
         failed → (retry) → queued
           ↓
          dead (after max_attempts)
```

| Status | Bedeutung |
|--------|-----------|
| `queued` | Bereit zur Ausführung |
| `running` | Worker verarbeitet |
| `done` | Erfolgreich abgeschlossen |
| `failed` | Fehlgeschlagen (wird ggf. wiederholt) |
| `dead` | Dauerhaft fehlgeschlagen (keine Retries mehr) |
| `cancelled` | Manuell abgebrochen |

---

## C) Job Types

### Extraction Jobs

| Type | Payload | Result |
|------|---------|--------|
| `extract_document` | `{document_id, engine}` | `{page_count, chunk_count, doc_type}` |

### Import Jobs

| Type | Payload | Result |
|------|---------|--------|
| `import_dropbox` | `{connector_id, remote_path, files[]}` | `{imported_count, document_ids[]}` |
| `import_onedrive` | `{connector_id, remote_path, files[]}` | `{imported_count, document_ids[]}` |
| `import_gdrive` | `{connector_id, remote_path, files[]}` | `{imported_count, document_ids[]}` |

### Classification Jobs

| Type | Payload | Result |
|------|---------|--------|
| `classify_document` | `{document_id}` | `{doc_type, confidence, suggested_node}` |

---

## D) Worker Edge Function: `dms-worker`

### Trigger

- **Supabase Cron**: Alle 30 Sekunden
- **Alternative**: pg_notify bei Job-Insert

### Polling Query

```sql
SELECT * FROM jobs 
WHERE status = 'queued' 
  AND run_at <= now()
ORDER BY priority DESC, created_at ASC
FOR UPDATE SKIP LOCKED
LIMIT 1;
```

### Main Loop (Pseudocode)

```typescript
// supabase/functions/dms-worker/index.ts

Deno.serve(async () => {
  const supabase = createClient(/* service role */);
  
  // 1. Claim a job
  const { data: job } = await supabase.rpc('claim_next_job');
  
  if (!job) {
    return new Response('No jobs', { status: 204 });
  }
  
  try {
    // 2. Mark as running
    await supabase.from('jobs')
      .update({ status: 'running', started_at: new Date() })
      .eq('id', job.id);
    
    // 3. Process based on type
    let result;
    switch (job.type) {
      case 'extract_document':
        result = await processExtraction(job.payload);
        break;
      case 'import_dropbox':
        result = await processDropboxImport(job.payload);
        break;
      // ... other types
    }
    
    // 4. Mark as done
    await supabase.from('jobs')
      .update({ 
        status: 'done', 
        finished_at: new Date(),
        result 
      })
      .eq('id', job.id);
      
  } catch (error) {
    // 5. Handle failure
    await handleJobFailure(supabase, job, error);
  }
  
  return new Response('OK');
});
```

### Extraction Flow

```typescript
async function processExtraction(payload: {
  document_id: string;
  engine: 'unstructured_fast' | 'unstructured_hires';
}) {
  const { document_id, engine } = payload;
  
  // 1. Load document from tenant-vault
  const doc = await getDocument(document_id);
  const signedUrl = await getSignedUrl(doc.file_path);
  const fileBuffer = await fetch(signedUrl).then(r => r.arrayBuffer());
  
  // 2. Call Unstructured.io API
  const elements = await unstructuredClient.partition({
    file: fileBuffer,
    strategy: engine === 'unstructured_hires' ? 'hi_res' : 'fast',
    languages: ['deu', 'eng'],
  });
  
  // 3. Save JSON to derived path
  const jsonPath = `tenant/${doc.tenant_id}/derived/${document_id}/unstructured.json`;
  await supabase.storage
    .from('tenant-vault')
    .upload(jsonPath, JSON.stringify(elements));
  
  // 4. Create chunks for search
  const chunks = elements.map((el, idx) => ({
    tenant_id: doc.tenant_id,
    document_id,
    chunk_index: idx,
    page_number: el.metadata?.page_number,
    element_type: el.type,
    text: el.text,
    metadata: el.metadata,
  }));
  
  await supabase.from('document_chunks').insert(chunks);
  
  // 5. Update extraction status
  await supabase.from('extractions')
    .update({ 
      status: 'done',
      result_json: { element_count: elements.length },
      finished_at: new Date()
    })
    .eq('document_id', document_id);
  
  // 6. Optional: Auto-classify
  const docType = classifyDocument(elements);
  
  return {
    page_count: Math.max(...elements.map(e => e.metadata?.page_number || 1)),
    chunk_count: chunks.length,
    doc_type: docType,
  };
}
```

---

## E) Backoff-Strategie

| Attempt | Delay | Total Time |
|---------|-------|------------|
| 1 | +1 min | 1 min |
| 2 | +5 min | 6 min |
| 3 | +30 min | 36 min |
| 4+ | → DEAD | - |

### Implementation

```typescript
async function handleJobFailure(
  supabase: SupabaseClient,
  job: Job,
  error: Error
) {
  const newAttempts = job.attempts + 1;
  
  if (newAttempts >= job.max_attempts) {
    // Mark as dead - no more retries
    await supabase.from('jobs')
      .update({
        status: 'dead',
        attempts: newAttempts,
        error_message: error.message,
        finished_at: new Date(),
      })
      .eq('id', job.id);
    
    // Notify user (optional)
    await notifyJobFailed(job);
    
  } else {
    // Calculate backoff delay
    const delays = [60, 300, 1800]; // seconds
    const delay = delays[newAttempts - 1] || 1800;
    
    await supabase.from('jobs')
      .update({
        status: 'queued',
        attempts: newAttempts,
        run_at: new Date(Date.now() + delay * 1000),
        error_message: error.message,
      })
      .eq('id', job.id);
  }
}
```

---

## F) document_chunks für KI-Suche

### Schema

```sql
CREATE TABLE document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  extraction_id uuid REFERENCES extractions(id),
  chunk_index int NOT NULL,
  page_number int,
  element_type text, -- 'Title', 'NarrativeText', 'Table', 'ListItem', etc.
  text text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Volltext-Index (German)
CREATE INDEX idx_document_chunks_fts 
ON document_chunks 
USING gin(to_tsvector('german', text));

-- Index für Dokument-Lookup
CREATE INDEX idx_document_chunks_doc 
ON document_chunks(document_id, chunk_index);

-- RLS
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation"
ON document_chunks
FOR ALL
USING (tenant_id IN (
  SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()
));
```

### FTS Query

```sql
-- Volltextsuche mit Ranking
SELECT 
  dc.document_id,
  d.name,
  dc.text,
  ts_rank(to_tsvector('german', dc.text), query) as rank
FROM document_chunks dc
JOIN documents d ON d.id = dc.document_id
CROSS JOIN plainto_tsquery('german', 'mietvertrag hauptstraße') query
WHERE to_tsvector('german', dc.text) @@ query
  AND dc.tenant_id = :tenant_id
ORDER BY rank DESC
LIMIT 20;
```

---

## G) extractions Tabelle

```sql
CREATE TABLE extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  document_id uuid NOT NULL REFERENCES documents(id),
  engine text NOT NULL, -- 'unstructured_fast' | 'unstructured_hires'
  status text NOT NULL DEFAULT 'queued',
  consent_given_at timestamptz,
  consent_given_by uuid,
  estimated_pages int,
  estimated_cost_cents int,
  actual_pages int,
  actual_cost_cents int,
  result_json jsonb,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation"
ON extractions FOR SELECT
USING (tenant_id IN (
  SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()
));
```

---

## H) Monitoring & Observability

### Dashboard Widgets (Zone 1)

| Widget | Query |
|--------|-------|
| Jobs in Queue | `SELECT COUNT(*) FROM jobs WHERE status = 'queued'` |
| Failed Jobs (24h) | `SELECT COUNT(*) FROM jobs WHERE status = 'dead' AND created_at > now() - interval '24h'` |
| Avg Processing Time | `SELECT AVG(finished_at - started_at) FROM jobs WHERE status = 'done'` |

### Alerts

| Condition | Action |
|-----------|--------|
| Queue > 100 | Log warning |
| Dead jobs > 10/h | Alert Platform Admin |
| Worker nicht ausgeführt > 5 min | Health check failed |

---

## I) Cron Configuration

```sql
-- Supabase Cron Job für Worker
SELECT cron.schedule(
  'dms-worker-trigger',
  '*/30 * * * * *', -- Alle 30 Sekunden
  $$
  SELECT net.http_post(
    'https://[PROJECT].supabase.co/functions/v1/dms-worker',
    '{}',
    '{\\\"Authorization\\\": \\\"Bearer [SERVICE_KEY]\\\"}'
  )
  $$
);
```

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-01-25 | Initial (Job Queue, Worker, Backoff, FTS) |
