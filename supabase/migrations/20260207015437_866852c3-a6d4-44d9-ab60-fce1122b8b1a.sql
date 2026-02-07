-- Extend acq_mandate_event_type enum with missing values
ALTER TYPE acq_mandate_event_type ADD VALUE IF NOT EXISTS 'activated';
ALTER TYPE acq_mandate_event_type ADD VALUE IF NOT EXISTS 'paused';
ALTER TYPE acq_mandate_event_type ADD VALUE IF NOT EXISTS 'resumed';