
-- Phase 1: RESTRICTIVE tenant_isolation Policy für 29 Tabellen
-- Risiko: NIEDRIG — restrictive Policies schränken nur ein, brechen nichts

CREATE POLICY "tenant_isolation_restrictive" ON public.car_service_requests AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.cloud_sync_connectors AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.cloud_sync_log AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.finapi_connections AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.finapi_transactions AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.kv_contracts AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.miety_loans AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.miety_tenancies AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.nk_beleg_extractions AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.pet_bookings AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.pet_caring_events AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.pet_customers AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.pet_invoices AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.pet_medical_records AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.pet_provider_availability AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.pet_provider_blocked_dates AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.pet_providers AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.pet_room_assignments AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.pet_rooms AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.pet_services AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.pet_staff AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.pet_vaccinations AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.pet_z1_booking_requests AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.pet_z1_customers AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.pet_z1_pets AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.pets AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.private_loans AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.tenant_credit_balance AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.vv_annual_data AS RESTRICTIVE FOR ALL TO authenticated USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));
