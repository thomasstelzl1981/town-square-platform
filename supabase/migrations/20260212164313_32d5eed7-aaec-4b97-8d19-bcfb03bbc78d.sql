
-- ═══════════════════════════════════════════════════════════════════════════
-- Zone 1 Public Project Submissions (Magic Intake from Kaufy Website)
-- No tenant_id required — this is a public intake that lands in Zone 1
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.public_project_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'approved', 'rejected', 'converted')),
  
  -- Contact info (the submitter)
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  company_name TEXT,
  
  -- Extracted project data from AI
  extracted_data JSONB,
  project_name TEXT,
  city TEXT,
  postal_code TEXT,
  address TEXT,
  units_count INTEGER DEFAULT 0,
  project_type TEXT DEFAULT 'neubau',
  
  -- File references (public-intake bucket)
  expose_storage_path TEXT,
  pricelist_storage_path TEXT,
  image_paths JSONB DEFAULT '[]'::jsonb,
  
  -- Agreement / Vertriebsvertrag
  agreement_accepted_at TIMESTAMPTZ,
  agreement_version TEXT,
  
  -- Lead reference (auto-created in leads table)
  lead_id UUID REFERENCES public.leads(id),
  
  -- Conversion reference (if approved and converted to real project)
  converted_project_id UUID,
  converted_tenant_id UUID,
  converted_at TIMESTAMPTZ,
  converted_by UUID,
  
  -- Metadata
  source_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.public_project_submissions ENABLE ROW LEVEL SECURITY;

-- Only admins (service role) can read/write — no public access to the table directly
-- The edge function uses service role key to insert
CREATE POLICY "Service role full access on public_project_submissions"
  ON public.public_project_submissions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_public_project_submissions_updated_at
  BEFORE UPDATE ON public.public_project_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for admin views
CREATE INDEX idx_public_project_submissions_status ON public.public_project_submissions(status);
CREATE INDEX idx_public_project_submissions_email ON public.public_project_submissions(contact_email);

-- ═══════════════════════════════════════════════════════════════════════════
-- Public Intake Storage Bucket (temporary, no auth required for upload)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-intake',
  'public-intake',
  false,
  10485760, -- 10MB per file
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel', 'text/csv']
);

-- Allow anonymous uploads to public-intake bucket (path must start with session token)
CREATE POLICY "Anon can upload to public-intake"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'public-intake');

-- Allow reading uploaded files (for the edge function with service role)
CREATE POLICY "Service role can read public-intake"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'public-intake');

-- Allow deletion for cleanup
CREATE POLICY "Service role can delete public-intake"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'public-intake');
