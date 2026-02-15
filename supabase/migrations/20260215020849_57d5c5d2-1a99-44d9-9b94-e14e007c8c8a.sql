CREATE POLICY "research_orders_delete"
ON public.research_orders
FOR DELETE
USING (tenant_id = get_user_tenant_id());