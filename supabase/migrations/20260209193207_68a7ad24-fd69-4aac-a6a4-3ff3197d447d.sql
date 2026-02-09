
CREATE OR REPLACE FUNCTION public.check_missing_indexes()
RETURNS TABLE (table_name TEXT, column_name TEXT, issue TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check 1: Tables with tenant_id but no index on it
  RETURN QUERY
  SELECT 
    c.relname::TEXT AS table_name,
    'tenant_id'::TEXT AS column_name,
    'Kein Index auf tenant_id'::TEXT AS issue
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND a.attname = 'tenant_id'
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_index i
      JOIN pg_catalog.pg_attribute ia ON ia.attrelid = i.indrelid AND ia.attnum = ANY(i.indkey)
      WHERE i.indrelid = c.oid
        AND ia.attname = 'tenant_id'
    );

  -- Check 2: Foreign key columns without indexes
  RETURN QUERY
  SELECT
    cl.relname::TEXT AS table_name,
    att.attname::TEXT AS column_name,
    'Kein Index auf FK-Spalte'::TEXT AS issue
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class cl ON cl.oid = con.conrelid
  JOIN pg_catalog.pg_namespace ns ON ns.oid = cl.relnamespace
  JOIN pg_catalog.pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
  WHERE ns.nspname = 'public'
    AND con.contype = 'f'
    AND NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_index i
      JOIN pg_catalog.pg_attribute ia ON ia.attrelid = i.indrelid AND ia.attnum = ANY(i.indkey)
      WHERE i.indrelid = cl.oid
        AND ia.attname = att.attname
    );

  -- Check 3: Tables with tenant_id + status but no composite index
  RETURN QUERY
  SELECT
    c.relname::TEXT AS table_name,
    'tenant_id, status'::TEXT AS column_name,
    'Kein Composite-Index (tenant_id, status)'::TEXT AS issue
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND EXISTS (SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid = c.oid AND attname = 'tenant_id' AND NOT attisdropped)
    AND EXISTS (SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid = c.oid AND attname = 'status' AND NOT attisdropped)
    AND NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_index i
      WHERE i.indrelid = c.oid
        AND (SELECT array_agg(a.attname ORDER BY k.ord)
             FROM unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
             JOIN pg_catalog.pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
             WHERE a.attnum > 0
            ) = ARRAY['tenant_id', 'status']::name[]
    );
END;
$function$;
