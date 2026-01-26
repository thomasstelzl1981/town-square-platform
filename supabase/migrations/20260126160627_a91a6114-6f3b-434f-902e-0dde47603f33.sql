-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- MOD-02 KI Office: letter_drafts table for Brief Generator
CREATE TABLE IF NOT EXISTS public.letter_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles(id),
  recipient_contact_id uuid REFERENCES public.contacts(id),
  subject text,
  prompt text,
  body text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'sent')),
  channel text CHECK (channel IN ('email', 'fax', 'post')),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- MOD-02 KI Office: calendar_events table for Calendar
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles(id),
  title text NOT NULL,
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  all_day boolean DEFAULT false,
  location text,
  contact_id uuid REFERENCES public.contacts(id),
  property_id uuid REFERENCES public.properties(id),
  reminder_minutes integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.letter_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for letter_drafts
CREATE POLICY "Users can view letter drafts in their active tenant" 
ON public.letter_drafts FOR SELECT 
USING (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create letter drafts in their active tenant" 
ON public.letter_drafts FOR INSERT 
WITH CHECK (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update letter drafts in their active tenant" 
ON public.letter_drafts FOR UPDATE 
USING (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete letter drafts in their active tenant" 
ON public.letter_drafts FOR DELETE 
USING (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for calendar_events
CREATE POLICY "Users can view calendar events in their active tenant" 
ON public.calendar_events FOR SELECT 
USING (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create calendar events in their active tenant" 
ON public.calendar_events FOR INSERT 
WITH CHECK (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update calendar events in their active tenant" 
ON public.calendar_events FOR UPDATE 
USING (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete calendar events in their active tenant" 
ON public.calendar_events FOR DELETE 
USING (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_letter_drafts_tenant_id ON public.letter_drafts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_letter_drafts_status ON public.letter_drafts(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_tenant_id ON public.calendar_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_at ON public.calendar_events(start_at);

-- Update trigger for letter_drafts
DROP TRIGGER IF EXISTS update_letter_drafts_updated_at ON public.letter_drafts;
CREATE TRIGGER update_letter_drafts_updated_at
BEFORE UPDATE ON public.letter_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for calendar_events
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON public.calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();