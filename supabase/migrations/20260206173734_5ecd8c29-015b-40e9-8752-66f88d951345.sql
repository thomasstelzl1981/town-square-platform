-- P0: Erweiterung für Aktivitäten-Log und Datenraum-Verknüpfung

-- 1. Datenraum-Verknüpfung für Objekteingänge
ALTER TABLE acq_offers 
ADD COLUMN IF NOT EXISTS data_room_folder_id UUID REFERENCES storage_nodes(id);

-- 2. Aktivitäten-Tabelle für Objekteingänge
CREATE TABLE IF NOT EXISTS acq_offer_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES acq_offers(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email_sent', 'note', 'status_change', 'viewing', 'interest', 'rejection', 'price_proposal')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS für Aktivitäten
ALTER TABLE acq_offer_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Nutzer können Aktivitäten für ihre zugewiesenen Mandate sehen
CREATE POLICY "Users can view activities for their mandate offers"
ON acq_offer_activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM acq_offers o
    JOIN acq_mandates m ON o.mandate_id = m.id
    WHERE o.id = offer_id
    AND (
      m.assigned_manager_user_id = auth.uid()
      OR m.created_by_user_id = auth.uid()
    )
  )
);

-- Policy: Nutzer können Aktivitäten erstellen
CREATE POLICY "Users can create activities"
ON acq_offer_activities FOR INSERT
WITH CHECK (
  created_by = auth.uid()
);

-- 4. Index für Performance
CREATE INDEX IF NOT EXISTS idx_acq_offer_activities_offer_id ON acq_offer_activities(offer_id);
CREATE INDEX IF NOT EXISTS idx_acq_offer_activities_created_at ON acq_offer_activities(created_at DESC);

-- 5. Trigger für automatische Aktivitäts-Erstellung bei Statusänderung
CREATE OR REPLACE FUNCTION log_offer_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO acq_offer_activities (offer_id, activity_type, description, created_by)
    VALUES (
      NEW.id,
      'status_change',
      format('Status geändert: %s → %s', OLD.status, NEW.status),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_log_offer_status_change ON acq_offers;
CREATE TRIGGER trigger_log_offer_status_change
AFTER UPDATE ON acq_offers
FOR EACH ROW
EXECUTE FUNCTION log_offer_status_change();