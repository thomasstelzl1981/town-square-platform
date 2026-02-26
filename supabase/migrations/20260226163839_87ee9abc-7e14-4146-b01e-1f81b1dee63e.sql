-- Erweitere object_type Constraint um postservice_delivery, inbound_email, finance_request
ALTER TABLE public.document_links DROP CONSTRAINT IF EXISTS document_links_object_type_check;
ALTER TABLE public.document_links ADD CONSTRAINT document_links_object_type_check
  CHECK (object_type = ANY(ARRAY[
    'property','unit','contact','finance_case','service_case',
    'vehicle','insurance','lease','profil','project','pet_provider',
    'postservice_delivery','inbound_email','finance_request'
  ]));

-- Erweitere source Constraint um cloud_sync
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_source_check;
ALTER TABLE public.documents ADD CONSTRAINT documents_source_check
  CHECK (source = ANY(ARRAY[
    'upload','resend','caya','dropbox','onedrive','gdrive',
    'import','email','project_intake','cloud_sync'
  ]));