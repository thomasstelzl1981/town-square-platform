
-- Add 'email' as valid source for documents
ALTER TABLE public.documents DROP CONSTRAINT documents_source_check;
ALTER TABLE public.documents ADD CONSTRAINT documents_source_check CHECK (source = ANY (ARRAY['upload','resend','caya','dropbox','onedrive','gdrive','import','email']));
