-- Add tenant_id column to test_data_registry
ALTER TABLE public.test_data_registry 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create index for tenant filtering
CREATE INDEX IF NOT EXISTS idx_test_data_registry_tenant ON public.test_data_registry(tenant_id);

-- Enable RLS if not already enabled
ALTER TABLE public.test_data_registry ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their org test data" ON public.test_data_registry;
DROP POLICY IF EXISTS "Users can insert test data for their org" ON public.test_data_registry;
DROP POLICY IF EXISTS "Users can delete test data for their org" ON public.test_data_registry;

-- Create RLS policies using memberships table with tenant_id column
CREATE POLICY "Users can view their org test data" ON public.test_data_registry
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert test data for their org" ON public.test_data_registry
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete test data for their org" ON public.test_data_registry
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
        )
    );