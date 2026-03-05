CREATE OR REPLACE FUNCTION create_default_unit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO units (tenant_id, property_id, unit_number, area_sqm)
  VALUES (NEW.tenant_id, NEW.id, 'MAIN', NEW.total_area_sqm);
  RETURN NEW;
END;
$$;