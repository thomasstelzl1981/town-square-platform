-- Migration: Audit Hub tables + storage bucket + default template seed

-- 1) audit_reports
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

-- 2) audit_prompt_templates
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

-- 3) audit_jobs
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

-- 4) Storage bucket
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

-- 5) Default prompt template seed
insert into public.audit_prompt_templates (title, description, content_txt, version, is_default, tags)
values (
  'Full System Audit & Repair Run (No Drift)',
  'Standard-Audit-Prompt fuer vollstaendigen System-Audit mit automatischen Fixes.',
  E'SYSTEM OF A TOWN — FULL SYSTEM AUDIT & REPAIR RUN (AUDIT + UPDATE + FIX + VERIFY)\nDATE: {{today}}\nMODE: YOU MUST EXECUTE AND APPLY FIXES. DO NOT ONLY AUDIT.\n\nROLE\nYou are Repo Maintainer + Safe-Fixer. You MUST update the repo, tile catalog and UI to a stable state,\ncommit safe fixes, and produce a mobile-friendly report saved into Zone 1 /admin/audit.\n\nHARD CONSTRAINTS\n1) DO NOT TOUCH Zone 3 /kaufy. No edits, no refactors, no assets, no routes, no content.\n2) Manifest-driven routing is SSOT. No routes outside the manifest. App.tsx stays minimal.\n3) No architecture rewrites. Only safe fixes. Bigger refactors are \"PLAN ONLY\".\n4) No DOC/DOCX outputs. Reports must be Markdown/HTML and saved in /admin/audit + storage.\n\nSCOPE (MUST COVER EVERYTHING)\n- Zone 1: all /admin/*\n- Zone 2: all /portal/* modules MOD-00..MOD-20\n- Zone 3: /miety, /futureroom, /sot (allowed), but /kaufy excluded and untouched\n\nBASELINE ROUTES (ENTRY)\nZone 2:\n- /portal (MOD-00 Dashboard)\n- /portal/stammdaten (MOD-01)\n- /portal/office (MOD-02) incl. /portal/office/widgets\n- /portal/dms (MOD-03)\n- /portal/immobilien (MOD-04) incl. /portfolio, /neu, /:id\n- /portal/msv (MOD-05)\n- /portal/verkauf (MOD-06)\n- /portal/finanzierung (MOD-07)\n- /portal/investments (MOD-08)\n- /portal/vertriebspartner (MOD-09)\n- /portal/leads (MOD-10)\n- /portal/finanzierungsmanager (MOD-11, role-gated)\n- /portal/akquise-manager (MOD-12, role-gated)\n- /portal/projekte (MOD-13)\n- /portal/communication-pro (MOD-14)\n- /portal/fortbildung (MOD-15)\n- /portal/services (MOD-16)\n- /portal/cars (MOD-17)\n- /portal/finanzanalyse (MOD-18)\n- /portal/photovoltaik (MOD-19)\n- /portal/miety (MOD-20, 6-tiles exception)\n\nZone 1:\n- /admin/audit (target area for reports)\n- /admin/master-templates/immobilienakte\n- /admin/master-templates/selbstauskunft\n- /admin/futureroom/*\n- /admin/acquiary/*\n- /admin/integrations (or equivalent)\n\nDELIVERABLES (MANDATORY)\nA) APPLY FIXES:\n- Fix broken routes, links, redirects, null crashes, activation errors, build breaks, safe UI regressions.\n- Align tile catalog with manifest navigation; ensure activation toggles work for ALL tiles.\n\nB) VERIFICATION:\n- Run full build/lint.\n- Smoke test Zone 1 + Zone 2 + Zone 3 (excluding /kaufy) and fix P0/P1 issues.\n\nC) REPORTING (MOBILE):\n- Produce a single Markdown report with strict structure (below).\n- Save it into Zone 1 /admin/audit (audit_reports table) AND storage as report.md.\n- Optionally generate report.html and report.pdf, but Markdown is SSOT.\n\nSAFE FIX POLICY (YOU MUST COMMIT)\nAllowed to change immediately:\n- Broken imports/exports, wrong route strings, wrong links, legacy /portfolio redirects\n- ManifestRouter/PortalNav inconsistencies\n- Tile activation bugs (API payload mismatch, missing rows, RLS issues, UI state update bugs)\n- Null guards/fallbacks and blank screen issues\n- Small empty states to prevent crashes\nNot allowed (plan only):\n- Big refactors, redesign, new modules, deep DB remodels\n\nEXECUTION PLAN (DO NOT SKIP STEPS)\n1) Create branch: fix/system-audit-run-{{today}}\n2) Baseline: install/build/lint -> record errors\n3) Routing SSOT:\n   - Ensure App.tsx minimal\n   - Ensure ManifestRouter uses manifest as SSOT\n   - Search & fix legacy links (/portfolio etc.) -> redirect/canonical paths\n4) Tile Catalog:\n   - Ensure every manifest tile exists in tile_catalog\n   - Fix codes/labels/order\n   - Fix activation toggle so every tile can be enabled/disabled without errors\n5) Zone 1 sweep: open all key /admin routes; fix crashes/404/links\n6) Zone 2 sweep: module-by-module entry + subpages; fix P0/P1\n7) Zone 3 sweep (except /kaufy): /miety /futureroom /sot\n8) Final build + repeated smoke test\n9) Write report + save to /admin/audit + storage\n\nREPORT STRUCTURE (MUST MATCH)\n# Full System Audit & Repair Run — {{today}}\n- Scope: Zone 1 + Zone 2 + Zone 3 (excluded: /kaufy)\n- Status: PASS / PASS_WITH_FIXES / FAIL\n- Repo Ref: branch + commit sha\n- PR: link (if any)\n\n## Executive Summary (mobile)\n- 5-10 bullets: what was fixed, what remains\n\n## Findings (before fixes)\n### P0\n### P1\n### P2\n\n## Fixes Applied (committed)\n- list commits / files / short rationale\n\n## Tile Catalog Alignment\n- what changed (seeds/migrations/api/ui)\n- activation verification result\n\n## Smoke Test Protocol\n- list tested routes with PASS/FAIL\n\n## Open Items (plan-only)\n- bigger refactors that were NOT done\n\n## Artifacts\n- report.md path\n- optional report.html/report.pdf/report.json paths\n\nFINAL CHECK\n- Confirm: \"/kaufy unchanged\" (no diffs)\n- Confirm: \"All tile toggles work\"\n- Confirm: \"Build succeeded\"',
  1,
  true,
  '{audit,full-system,repair}'
);