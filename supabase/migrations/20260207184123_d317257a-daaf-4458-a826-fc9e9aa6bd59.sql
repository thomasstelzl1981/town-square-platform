-- Automatische Code-Generierung für Properties
-- Format: IMM-{YYYY}-{SEQUENCE} (z.B. IMM-2026-00001)

CREATE OR REPLACE FUNCTION public.generate_property_code()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
  new_code TEXT;
BEGIN
  -- Nur wenn code NULL oder leer ist
  IF NEW.code IS NULL OR NEW.code = '' THEN
    year_str := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Nächste Sequenznummer für dieses Jahr und diesen Tenant
    SELECT COALESCE(MAX(
      NULLIF(REGEXP_REPLACE(code, '^IMM-' || year_str || '-', ''), code)::INTEGER
    ), 0) + 1
    INTO seq_num
    FROM properties 
    WHERE tenant_id = NEW.tenant_id 
      AND code LIKE 'IMM-' || year_str || '-%';
    
    new_code := 'IMM-' || year_str || '-' || LPAD(seq_num::TEXT, 5, '0');
    NEW.code := new_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger BEFORE INSERT, damit der Code verfügbar ist bevor create_property_folder_structure läuft
CREATE TRIGGER trg_generate_property_code
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION generate_property_code();