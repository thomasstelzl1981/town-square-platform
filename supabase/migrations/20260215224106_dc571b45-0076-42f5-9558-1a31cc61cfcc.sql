
-- =============================================
-- FIX 1: pv_plants RLS Policies (4 Policies)
-- =============================================

-- SELECT
DROP POLICY IF EXISTS "Tenant members can view pv_plants" ON pv_plants;
CREATE POLICY "Tenant members can view pv_plants" ON pv_plants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = pv_plants.tenant_id)
  );

-- INSERT
DROP POLICY IF EXISTS "Tenant members can insert pv_plants" ON pv_plants;
CREATE POLICY "Tenant members can insert pv_plants" ON pv_plants
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = pv_plants.tenant_id)
  );

-- UPDATE
DROP POLICY IF EXISTS "Tenant members can update pv_plants" ON pv_plants;
CREATE POLICY "Tenant members can update pv_plants" ON pv_plants
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = pv_plants.tenant_id)
  );

-- DELETE
DROP POLICY IF EXISTS "Tenant members can delete pv_plants" ON pv_plants;
CREATE POLICY "Tenant members can delete pv_plants" ON pv_plants
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = pv_plants.tenant_id)
  );

-- =============================================
-- FIX 2: pv_connectors RLS Policy
-- =============================================
DROP POLICY IF EXISTS "Access pv_connectors via plant tenant" ON pv_connectors;
CREATE POLICY "Access pv_connectors via plant tenant" ON pv_connectors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = pv_connectors.tenant_id)
  );

-- =============================================
-- FIX 3: pv_measurements RLS Policy
-- =============================================
DROP POLICY IF EXISTS "Access pv_measurements via plant tenant" ON pv_measurements;
CREATE POLICY "Access pv_measurements via plant tenant" ON pv_measurements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = pv_measurements.tenant_id)
  );

-- =============================================
-- FIX 4: Demo-Plant-Daten aktualisieren
-- =============================================
UPDATE pv_plants SET
  name = 'EFH Oberhaching 32,4 kWp',
  kwp = 32.4,
  city = 'Deisenhofen',
  street = 'Sauerlacher Str.',
  house_number = '30',
  postal_code = '82041',
  commissioning_date = '2019-04-28',
  wr_manufacturer = 'SMA Solar Technology AG',
  wr_model = 'Sunny Tripower 15000 TL (2x)',
  has_battery = false,
  mastr_account_present = true,
  mastr_plant_id = 'SEE912345678',
  mastr_unit_id = 'SEE987654321',
  mastr_status = 'confirmed',
  grid_operator = 'Bayernwerk Netz GmbH',
  active_connector = 'demo_timo_leif',
  provider = 'demo'
WHERE id = '00000000-0000-4000-a000-000000000901';
