ALTER TABLE public.inbox_sort_containers
  ADD COLUMN property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL;