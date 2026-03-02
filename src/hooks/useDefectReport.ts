/**
 * useDefectReport — Create and manage defect/damage tickets via tenancy_tasks
 * Uses ENG-TLC triageDefect for auto-severity assessment
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { triageDefect, calculateSlaDeadline } from '@/engines/tenancyLifecycle/engine';

export interface DefectReportInput {
  tenantId: string;
  leaseId?: string;
  propertyId?: string;
  title: string;
  description: string;
  locationDetail?: string;
  reportedByContactId?: string;
  photos?: string[];
}

export function useDefectReport() {
  const { session } = useAuth();

  const createDefectReport = useCallback(async (input: DefectReportInput) => {
    if (!session?.user) return { data: null, error: new Error('Not authenticated') };

    // Auto-triage using ENG-TLC
    const triage = triageDefect(`${input.title} ${input.description}`);
    const now = new Date().toISOString();
    const slaDeadline = calculateSlaDeadline(now, triage.slaHours);

    const { data, error } = await supabase
      .from('tenancy_tasks')
      .insert({
        tenant_id: input.tenantId,
        lease_id: input.leaseId || null,
        property_id: input.propertyId || null,
        task_type: 'defect',
        category: 'maintenance',
        title: input.title,
        description: input.description,
        priority: triage.severity === 'emergency' ? 'urgent' : triage.severity === 'urgent' ? 'high' : 'normal',
        status: 'open',
        sla_hours: triage.slaHours,
        sla_deadline: slaDeadline,
        severity_assessment: triage.severity,
        location_detail: input.locationDetail || null,
        reported_by_contact_id: input.reportedByContactId || null,
        photos: input.photos || [],
        created_by: session.user.id,
      })
      .select()
      .single();

    // Also create a lifecycle event
    if (data && !error) {
      await supabase.from('tenancy_lifecycle_events').insert({
        tenant_id: input.tenantId,
        lease_id: input.leaseId || null,
        event_type: 'defect_reported',
        phase: 'active',
        severity: triage.severity === 'emergency' ? 'critical' : triage.severity === 'urgent' ? 'warning' : 'info',
        title: `Mangel gemeldet: ${input.title}`,
        description: `Triage: ${triage.severity} (SLA: ${triage.slaHours}h). ${triage.matchedKeywords.length > 0 ? `Keywords: ${triage.matchedKeywords.join(', ')}` : ''}`,
        payload: { taskId: data.id, triage, locationDetail: input.locationDetail },
        triggered_by: 'user',
      });
    }

    return { data, error, triage };
  }, [session?.user]);

  return { createDefectReport };
}
