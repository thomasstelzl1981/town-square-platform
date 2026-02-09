

# Audit Hub: Reports + Prompt Templates + In-App Audit Run

## Zusammenfassung

Die bestehende `/admin/audit` Seite (aktuell nur ein Audit-Event-Log) wird zu einem vollstaendigen **Audit Hub** mit 3 Tabs erweitert. Zusaetzlich werden 3 neue DB-Tabellen, ein Storage-Bucket und ein Default-Prompt-Template angelegt.

---

## Teil 1: Datenbank (3 Tabellen + Storage Bucket)

### Migration 1: `audit_reports`

```sql
create table public.audit_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  created_by uuid references public.profiles(id),
  title text not null,
  scope jsonb default '{"zones":["zone1","zone2","zone3"],"excluded":["/kaufy"]}',
  status text not null default 'PASS' check (status in ('PASS','PASS_WITH_FIXES','FAIL')),
  counts jsonb default '{"p0":0,"p1":0,"p2":0}',
  tags text[] default '{}',
  repo_ref text,
  pr_url text,
  content_md text not null,
  content_html text,
  artifacts jsonb default '{}',
  module_coverage jsonb default '{}',
  is_pinned boolean default false
);

alter table public.audit_reports enable row level security;
create policy "Admin full access on audit_reports"
  on public.audit_reports for all
  using (
    exists (
      select 1 from public.memberships
      where memberships.user_id = auth.uid()
      and memberships.role = 'platform_admin'
    )
  );
```

### Migration 2: `audit_prompt_templates`

```sql
create table public.audit_prompt_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  title text not null,
  description text default '',
  content_txt text not null,
  version int default 1,
  is_default boolean default false,
  tags text[] default '{}'
);

alter table public.audit_prompt_templates enable row level security;
create policy "Admin full access on audit_prompt_templates"
  on public.audit_prompt_templates for all
  using (
    exists (
      select 1 from public.memberships
      where memberships.user_id = auth.uid()
      and memberships.role = 'platform_admin'
    )
  );
```

### Migration 3: `audit_jobs`

```sql
create table public.audit_jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  started_at timestamptz,
  finished_at timestamptz,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed')),
  job_type text not null default 'IN_APP' check (job_type in ('IN_APP','CI_REPO')),
  triggered_by uuid references public.profiles(id),
  repo_ref text,
  logs jsonb,
  audit_report_id uuid references public.audit_reports(id)
);

alter table public.audit_jobs enable row level security;
create policy "Admin full access on audit_jobs"
  on public.audit_jobs for all
  using (
    exists (
      select 1 from public.memberships
      where memberships.user_id = auth.uid()
      and memberships.role = 'platform_admin'
    )
  );
```

### Migration 4: Default Prompt Template Seed

```sql
insert into public.audit_prompt_templates (title, description, content_txt, version, is_default, tags)
values (
  'Full System Audit & Repair Run (No Drift)',
  'Standard-Audit-Prompt fuer vollstaendigen System-Audit mit automatischen Fixes.',
  E'<<GESAMTER PROMPT-TEXT AUS ABSCHNITT 7 DES BRIEFINGS>>',
  1,
  true,
  '{audit,full-system,repair}'
);
```

### Migration 5: Storage Bucket

```sql
insert into storage.buckets (id, name, public) values ('audit-reports', 'audit-reports', false);

create policy "Admin upload audit reports"
  on storage.objects for insert
  with check (
    bucket_id = 'audit-reports'
    and exists (
      select 1 from public.memberships
      where memberships.user_id = auth.uid()
      and memberships.role = 'platform_admin'
    )
  );

create policy "Admin read audit reports"
  on storage.objects for select
  using (
    bucket_id = 'audit-reports'
    and exists (
      select 1 from public.memberships
      where memberships.user_id = auth.uid()
      and memberships.role = 'platform_admin'
    )
  );
```

---

## Teil 2: Neuer Audit Hub (UI)

### Dateistruktur

```text
src/pages/admin/audit/
  AuditHub.tsx           -- Haupt-Container mit 3 Tabs
  AuditReportsTab.tsx    -- Tab 1: Report-Liste + Detail
  AuditReportDetail.tsx  -- Report-Detailansicht (Markdown-Rendering)
  AuditPromptTab.tsx     -- Tab 2: Template-Verwaltung + Copy
  AuditRunTab.tsx        -- Tab 3: Jobs + "Run In-App Audit"
  useAuditReports.ts     -- React Query Hooks fuer Reports
  useAuditTemplates.ts   -- React Query Hooks fuer Templates
  useAuditJobs.ts        -- React Query Hooks fuer Jobs
  inAppAuditRunner.ts    -- In-App Audit Logik (Route-Checks etc.)
```

Die bisherige `src/pages/admin/AuditLog.tsx` bleibt als "Audit Events" Unter-Tab im Reports-Tab erhalten (eingebettet, nicht geloescht).

### AuditHub.tsx (Haupt-Container)

- 3 Tabs via Radix `Tabs`: "Reports", "Audit Prompt (Copy)", "Run / Jobs"
- Mobile-first: Cards statt Tabellen fuer Reports-Liste
- Standard-Route `/admin/audit` zeigt Tab 1 (Reports)
- Sub-Route `/admin/audit/:auditId` zeigt Report-Detail

### Tab 1: Reports

**Liste:**
- Card-Layout (mobile-first): Titel, Datum, Status-Badge (PASS/PASS_WITH_FIXES/FAIL), P0/P1/P2 Counts, Scope, Repo-Ref
- Filter: Status-Dropdown, Freitext-Suche
- Pin-Toggle (is_pinned)
- "Oeffnen" Button -> Report-Detail

**Detail-Ansicht (`AuditReportDetail.tsx`):**
- Markdown-Rendering via `react-markdown` (bereits installiert)
- Einklappbares Inhaltsverzeichnis (generiert aus H2/H3 Headings)
- Meta-Header: Status-Badge, Datum, Scope, Repo-Ref, PR-Link
- Sekundaer: "Audit Events"-Ansicht (bisherige AuditLog-Tabelle, eingebettet)

### Tab 2: Audit Prompt (Copy)

- Dropdown: Template-Auswahl (mit Default markiert)
- Grosses Textarea (read-only, content_txt)
- Buttons:
  - **Copy to Clipboard** (navigator.clipboard.writeText + Toast)
  - **Duplicate** (erstellt Kopie mit version+1)
  - **Save** (speichert Aenderungen, setzt updated_at)
  - **Set Default** (setzt is_default=true, alle anderen auf false)
  - **Export .txt** (Blob-Download)

### Tab 3: Run / Jobs

- **"Run In-App Audit"** Button:
  - Erstellt `audit_jobs` Eintrag (status=queued)
  - Fuehrt clientseitige Checks aus (siehe inAppAuditRunner.ts)
  - Erstellt `audit_reports` Eintrag mit Ergebnis-Markdown
  - Laedt report.md in Storage hoch
  - Aktualisiert Job-Status auf succeeded/failed

- **Job-Liste**: Karten mit Status, Typ, Dauer, Link zum Report

**In-App Audit Scope (inAppAuditRunner.ts):**
- Route-Existenz: Prueft ob alle Manifest-Routen zu importierten Komponenten aufloesen
- Tile-Catalog-Konsistenz: Vergleicht manifest tiles mit tile_catalog DB-Eintraegen
- Basis-Health-Checks: Fetch auf Schluessel-Routen (/admin, /portal) -- Status-Code-Pruefung
- Ergebnis: Generiert Markdown-Report nach der vorgegebenen Struktur

---

## Teil 3: Routing-Anpassung

### routesManifest.ts

Zeile 102 aendern:
```typescript
{ path: "audit", component: "AuditHub", title: "Audit Hub" },
{ path: "audit/:auditId", component: "AuditReportDetail", title: "Audit Report", dynamic: true },
```

### ManifestRouter.tsx

- Import `AuditHub` statt `AuditLog`
- Import `AuditReportDetail` fuer die dynamische Route
- Komponentenzuordnung anpassen

### AdminSidebar.tsx

Icon-Mapping aktualisieren:
```typescript
'AuditHub': FileText,
'AuditReportDetail': FileText,
```

---

## Teil 4: Unveraenderte Bereiche

| Bereich | Status |
|---------|--------|
| Zone 3 /kaufy | NICHT ANGEFASST |
| Bestehende audit_events Tabelle | BLEIBT (wird im Reports-Tab eingebettet) |
| Investment Engine / FinanzierungSummary | NICHT BETROFFEN |
| ManifestRouter Kernlogik | NICHT BETROFFEN |

---

## Implementierungsreihenfolge

1. **DB-Migrationen** (5 Migrationen: 3 Tabellen + 1 Seed + 1 Storage Bucket)
2. **Hooks** (useAuditReports, useAuditTemplates, useAuditJobs)
3. **inAppAuditRunner.ts** (Audit-Logik)
4. **UI-Komponenten** (AuditHub + 3 Tabs + Detail)
5. **Routing** (Manifest + ManifestRouter + Sidebar)

---

## Technische Details

### Betroffene Dateien

| Aktion | Datei |
|--------|-------|
| NEU | `src/pages/admin/audit/AuditHub.tsx` |
| NEU | `src/pages/admin/audit/AuditReportsTab.tsx` |
| NEU | `src/pages/admin/audit/AuditReportDetail.tsx` |
| NEU | `src/pages/admin/audit/AuditPromptTab.tsx` |
| NEU | `src/pages/admin/audit/AuditRunTab.tsx` |
| NEU | `src/pages/admin/audit/useAuditReports.ts` |
| NEU | `src/pages/admin/audit/useAuditTemplates.ts` |
| NEU | `src/pages/admin/audit/useAuditJobs.ts` |
| NEU | `src/pages/admin/audit/inAppAuditRunner.ts` |
| EDIT | `src/manifests/routesManifest.ts` |
| EDIT | `src/router/ManifestRouter.tsx` |
| EDIT | `src/components/admin/AdminSidebar.tsx` |

Die alte `src/pages/admin/AuditLog.tsx` bleibt bestehen und wird in den Reports-Tab importiert.

### Keine Edge Functions noetig
Alle Audit-Checks laufen clientseitig. Reports werden per Supabase JS SDK in DB + Storage geschrieben.

### Default Template
Der vollstaendige Prompt-Text aus Abschnitt 7 des Briefings wird 1:1 als `content_txt` in der Seed-Migration gespeichert (~3000 Zeichen). Platzhalter `{{today}}` bleibt als String erhalten -- wird beim Copy in der UI durch das aktuelle Datum ersetzt.

