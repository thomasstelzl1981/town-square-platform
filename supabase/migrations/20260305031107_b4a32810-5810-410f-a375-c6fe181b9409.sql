
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
  AND object_id::text IN (
    SELECT project_id::text FROM public.landing_pages
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
    AND dl.object_id::text IN (
      SELECT project_id::text FROM public.landing_pages
      WHERE status IN ('draft', 'preview', 'active')
    )
  )
);

-- 6. Include 'draft' in landing_pages public policy (for preview from portal)
DROP POLICY IF EXISTS "Public can view active landing pages" ON public.landing_pages;
CREATE POLICY "Public can view landing pages"
ON public.landing_pages FOR SELECT TO anon, authenticated
USING (status IN ('draft', 'preview', 'active'));
