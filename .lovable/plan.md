

# Fix: Landing Page "Projekt nicht gefunden" — Root Cause & Repair Plan

## Root Cause (3 issues)

### 1. Missing Foreign Key — Breaks JOIN
`landing_pages.project_id` has **no FK to `dev_projects.id`**. The Supabase client's `dev_projects!inner(...)` syntax requires a FK relationship. Without it, PostgREST cannot resolve the join and the query silently returns null.
- **Affects:** `ProjectLandingLayout.tsx` (header, footer, logo)
- **Affects:** `ProjectLandingHome.tsx` uses separate queries but same root issue on `dev_projects`

### 2. No Public RLS — Blocks Anonymous & Cross-Tenant Access
The landing page is a **public website** (Zone 3), but:
- `dev_projects` — only allows `tenant_id = get_user_tenant_id()` (auth required)
- `dev_project_units` — same restriction
- `document_links` — no policy for `object_type = 'project'`
- `documents` — no public policy for project images

Even logged-in users see "Projekt nicht gefunden" because the restrictive `tenant_isolation_restrictive` policy blocks unless `get_user_tenant_id()` matches.

### 3. Existing landing page status is `draft`
The public RLS policy on `landing_pages` only allows `preview` and `active`. For the portal preview (logged-in user), this works via the org-member policy. But the public path blocks `draft` — this is correct behavior but needs the preview flow to account for it.

## Fix Plan

### Migration 1: Add FK + Public RLS Policies

```sql
-- 1. Add FK from landing_pages to dev_projects
ALTER TABLE public.landing_pages
  ADD CONSTRAINT landing_pages_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.dev_projects(id);

-- 2. Public SELECT on dev_projects for projects with active landing pages
CREATE POLICY "public_read_landing_page_projects"
ON public.dev_projects FOR SELECT TO anon, authenticated
USING (
  id IN (
    SELECT project_id FROM public.landing_pages
    WHERE status IN ('draft', 'preview', 'active')
  )
);

-- 3. Public SELECT on dev_project_units for those projects
CREATE POLICY "public_read_landing_page_units"
ON public.dev_project_units FOR SELECT TO anon, authenticated
USING (
  project_id IN (
    SELECT project_id FROM public.landing_pages
    WHERE status IN ('draft', 'preview', 'active')
  )
);

-- 4. Public SELECT on document_links for project images
CREATE POLICY "public_read_project_image_links"
ON public.document_links FOR SELECT TO anon, authenticated
USING (
  object_type = 'project'
  AND object_id IN (
    SELECT project_id FROM public.landing_pages
    WHERE status IN ('draft', 'preview', 'active')
  )
);

-- 5. Public SELECT on documents for project-linked images
CREATE POLICY "public_read_project_landing_documents"
ON public.documents FOR SELECT TO anon, authenticated
USING (
  id IN (
    SELECT dl.document_id FROM public.document_links dl
    WHERE dl.object_type = 'project'
    AND dl.object_id IN (
      SELECT project_id FROM public.landing_pages
      WHERE status IN ('draft', 'preview', 'active')
    )
  )
);

-- 6. Include 'draft' in landing_pages public policy (for preview from portal)
DROP POLICY IF EXISTS "Public can view active landing pages" ON public.landing_pages;
CREATE POLICY "Public can view landing pages"
ON public.landing_pages FOR SELECT TO anon, authenticated
USING (status IN ('draft', 'preview', 'active'));
```

### No Code Changes Needed
The existing `ProjectLandingHome.tsx` and `ProjectLandingLayout.tsx` code is correct — the queries will work once the FK and RLS policies are in place.

### Security Note
- Only projects with a `landing_pages` record are exposed publicly
- The policies are read-only (SELECT)
- `locked` status pages remain invisible
- Write operations remain protected by existing org-member policies

### Freeze Check
| Path | Frozen? |
|---|---|
| Database migration | No |
| `ProjectLandingHome.tsx` (Zone 3, project-landing) | **Not frozen** (not in zone3_freeze.json) |
| `ProjectLandingLayout.tsx` | **Not frozen** |
| No code changes needed | N/A |

