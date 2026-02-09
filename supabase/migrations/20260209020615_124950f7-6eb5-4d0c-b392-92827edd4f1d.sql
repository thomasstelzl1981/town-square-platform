-- ============================================================================
-- MOD-13 PROJEKTE: Extended Project Status + Reservation Status
-- Phase C: Status Machine Migration
-- ============================================================================

-- 1. Drop existing constraint on dev_projects.status
ALTER TABLE dev_projects DROP CONSTRAINT IF EXISTS dev_projects_status_check;

-- 2. Add new extended status constraint (includes legacy values for compatibility)
ALTER TABLE dev_projects ADD CONSTRAINT dev_projects_status_check 
  CHECK (status IN (
    -- New Aufteiler lifecycle statuses
    'draft_intake',        -- KI-Import läuft
    'draft_ready',         -- Import bestätigt, bereit zur Aktivierung
    'in_sales_setup',      -- Vertrieb wird vorbereitet
    'in_distribution',     -- Aktiv im Verkauf
    'sellout_in_progress', -- Abverkauf läuft (>50% verkauft)
    'sold_out',            -- Alle Einheiten verkauft
    'closed',              -- Archiviert/Abgeschlossen
    -- Legacy values (maintained for backward compatibility)
    'draft',
    'active',
    'paused',
    'completed',
    'archived'
  ));

-- 3. Migrate legacy statuses to new statuses
UPDATE dev_projects SET status = 'draft_ready' WHERE status = 'draft';
UPDATE dev_projects SET status = 'in_distribution' WHERE status = 'active';
UPDATE dev_projects SET status = 'in_sales_setup' WHERE status = 'paused';
UPDATE dev_projects SET status = 'sold_out' WHERE status = 'completed';
UPDATE dev_projects SET status = 'closed' WHERE status = 'archived';

-- 4. Add project_type column if not exists (for Neubau/Aufteilung distinction)
ALTER TABLE dev_projects ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'aufteilung';

-- 5. Add needs_review column for intake workflow
ALTER TABLE dev_projects ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE;

-- 6. Add intake_data JSON column for KI-parsed data before confirmation
ALTER TABLE dev_projects ADD COLUMN IF NOT EXISTS intake_data JSONB;

-- 7. Ensure reservation expiry_date is properly named (it's already expiry_date in schema)
-- No change needed for dev_project_reservations

-- 8. Add index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_dev_projects_status ON dev_projects(status);
CREATE INDEX IF NOT EXISTS idx_dev_project_reservations_status ON dev_project_reservations(status);