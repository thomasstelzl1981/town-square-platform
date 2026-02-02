-- Fix the function search path issue
CREATE OR REPLACE FUNCTION public.generate_correlation_key(
    p_entity_type TEXT,
    p_entity_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
    RETURN p_entity_type || '_' || p_entity_id::text || '_' || extract(epoch from now())::bigint::text;
END;
$$;