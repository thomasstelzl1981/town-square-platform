-- Bug 1 Fix: RLS-Policy auf authenticated setzen
DROP POLICY IF EXISTS "Admins can manage brand assistants" 
  ON commpro_phone_assistants;
CREATE POLICY "Admins can manage brand assistants" 
  ON commpro_phone_assistants FOR ALL 
  TO authenticated
  USING (brand_key IS NOT NULL AND is_platform_admin(auth.uid()))
  WITH CHECK (brand_key IS NOT NULL AND is_platform_admin(auth.uid()));

-- Bug 3: Billing-Felder für Preis-Tracking
ALTER TABLE commpro_phone_call_sessions
  ADD COLUMN IF NOT EXISTS twilio_price NUMERIC,
  ADD COLUMN IF NOT EXISTS twilio_price_unit TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS billed_credits INTEGER DEFAULT 0;