ALTER TABLE public.document_links DROP CONSTRAINT document_links_object_type_check;

ALTER TABLE public.document_links ADD CONSTRAINT document_links_object_type_check
CHECK (object_type = ANY (ARRAY['property','unit','contact','finance_case','service_case','vehicle','insurance','lease','profil','project','pet_provider']));