
-- ============================================================
-- RLS HARDENING: RESTRICTIVE tenant_id policies — 30 tables
-- ============================================================

-- Armstrong
CREATE POLICY "tenant_isolation_restrictive" ON public.armstrong_chat_sessions
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.armstrong_inbound_tasks
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Cars
CREATE POLICY "tenant_isolation_restrictive" ON public.cars_device_external_refs
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.cars_device_status
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.cars_devices
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.cars_logbook_locks
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.cars_logbooks
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.cars_positions_raw
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.cars_trip_audit
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.cars_trip_detection_runs
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Contact
CREATE POLICY "tenant_isolation_restrictive" ON public.contact_strategy_ledger
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Privacy / Compliance
CREATE POLICY "tenant_isolation_restrictive" ON public.deletion_requests
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.dsar_requests
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Discovery
CREATE POLICY "tenant_isolation_restrictive" ON public.discovery_region_queue
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.discovery_run_log
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Documents
CREATE POLICY "tenant_isolation_restrictive" ON public.document_structured_data
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.extraction_jobs
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.invoice_extractions
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Mail
CREATE POLICY "tenant_isolation_restrictive" ON public.mail_compose_templates
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Manager
CREATE POLICY "tenant_isolation_restrictive" ON public.manager_applications
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Finance
CREATE POLICY "tenant_isolation_restrictive" ON public.manual_expenses
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Phone
CREATE POLICY "tenant_isolation_restrictive" ON public.phone_subscription_log
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.phone_usage_log
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Process Health (tenant_id is TEXT, needs cast)
CREATE POLICY "tenant_isolation_restrictive" ON public.process_health_log
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()::text) OR is_platform_admin(auth.uid()));

-- Social
CREATE POLICY "tenant_isolation_restrictive" ON public.social_budget_caps
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

-- Tenancy
CREATE POLICY "tenant_isolation_restrictive" ON public.tenancy_dunning_configs
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.tenancy_handover_protocols
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.tenancy_lifecycle_events
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.tenancy_meter_readings
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.tenancy_tasks
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id()) OR is_platform_admin(auth.uid()));
