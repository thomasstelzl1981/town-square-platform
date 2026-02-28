

## Analyse: Warum "Assistent konnte nicht geladen werden"

Drei konkrete Bugs gefunden:

### Bug 1: RLS-Policy falsche Rolle
Die Policy "Admins can manage brand assistants" hat `roles: {public}` statt `{authenticated}`. Dadurch greift sie nicht für eingeloggte User. Gleichzeitig blockiert die RESTRICTIVE Policy `tenant_isolation_restrictive` den Zugriff, weil brand-Assistenten `user_id = NULL` haben und nur `is_platform_admin()` durchkommt.

### Bug 2: StatusForwardingCard sendet kein `brand_key`
`StatusForwardingCard` ruft `sot-phone-provision` direkt auf mit `{ action: 'purchase', country_code: 'DE' }` — ohne `brand_key`. Dadurch wird im Provision-Code der Zone-2-Pfad (user_id-Modus) genommen statt Zone-1 (brand_key-Modus). Das gleiche Problem bei `handleRelease`.

### Bug 3: postcall hat kein Billing-Tracking
`commpro_phone_call_sessions` fehlen die Preis-Felder für späteres Billing.

---

## Implementierungsplan

### 1. DB-Migration: RLS fixen + Billing-Felder

```sql
-- RLS fix: Brand-Policy auf authenticated setzen
DROP POLICY IF EXISTS "Admins can manage brand assistants" 
  ON commpro_phone_assistants;
CREATE POLICY "Admins can manage brand assistants" 
  ON commpro_phone_assistants FOR ALL 
  TO authenticated
  USING (brand_key IS NOT NULL AND is_platform_admin(auth.uid()))
  WITH CHECK (brand_key IS NOT NULL AND is_platform_admin(auth.uid()));

-- Billing-Felder für Zone-2-Vorbereitung
ALTER TABLE commpro_phone_call_sessions
  ADD COLUMN IF NOT EXISTS twilio_price NUMERIC,
  ADD COLUMN IF NOT EXISTS twilio_price_unit TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS billed_credits INTEGER DEFAULT 0;
```

### 2. StatusForwardingCard: brand_key-Prop hinzufügen

- Props erweitern um optionales `brandKey?: string`
- `handlePurchase` und `handleRelease` senden `brand_key` im Body wenn vorhanden
- BrandPhonePanel übergibt `brandKey` an StatusForwardingCard

### 3. sot-phone-postcall: Preis-Tracking ergänzen

- Twilio liefert im StatusCallback `CallDuration` und optional Preis-Informationen
- `twilio_price` und `twilio_price_unit` beim Session-Update speichern (falls von Twilio geliefert)

### 4. Plan-Update

- `.lovable/plan.md` aktualisieren: RLS-Fix, Billing-Felder, StatusForwardingCard-Fix als erledigt markieren

