/**
 * Hook: Tenancy Communication Hub
 * Integrates tenant-specific communication via MOD-02 Email + MOD-14 Serien-E-Mail
 * Provides template-based tenant messaging for TLC events
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type TenancyMessageType = 
  | 'rent_reminder' | 'dunning' | 'rent_increase' | 'nk_settlement'
  | 'move_in_welcome' | 'move_out_notice' | 'defect_ack' | 'deposit_settlement'
  | 'prepayment_adjustment' | 'general';

export interface TenancyMessageTemplate {
  type: TenancyMessageType;
  label: string;
  subject: string;
  bodyTemplate: string;
}

export const TENANCY_MESSAGE_TEMPLATES: TenancyMessageTemplate[] = [
  {
    type: 'rent_reminder',
    label: 'Zahlungserinnerung',
    subject: 'Zahlungserinnerung — Miete {{month}}',
    bodyTemplate: 'Sehr geehrte/r {{tenant_name}},\n\nwir möchten Sie freundlich daran erinnern, dass die Miete für {{month}} in Höhe von {{amount}} € noch aussteht.\n\nBitte überweisen Sie den Betrag bis zum {{due_date}} auf das bekannte Konto.\n\nMit freundlichen Grüßen',
  },
  {
    type: 'dunning',
    label: 'Mahnung',
    subject: '{{dunning_level}} — Mietrückstand {{month}}',
    bodyTemplate: 'Sehr geehrte/r {{tenant_name}},\n\ntrotz unserer Erinnerung ist die Miete für {{month}} ({{amount}} €) noch nicht eingegangen.\n\nBitte begleichen Sie den offenen Betrag zuzüglich {{fee}} € Mahngebühr unverzüglich.\n\nMit freundlichen Grüßen',
  },
  {
    type: 'rent_increase',
    label: 'Mieterhöhungsverlangen',
    subject: 'Mieterhöhungsverlangen gemäß §558 BGB',
    bodyTemplate: 'Sehr geehrte/r {{tenant_name}},\n\nhiermit verlangen wir gemäß §558 BGB eine Anpassung Ihrer Nettokaltmiete von derzeit {{current_rent}} € auf {{new_rent}} € monatlich, wirksam ab {{effective_date}}.\n\nDie Erhöhung liegt innerhalb der Kappungsgrenze von {{cap_percent}}% in drei Jahren.\n\nBitte bestätigen Sie Ihr Einverständnis innerhalb der gesetzlichen Frist.\n\nMit freundlichen Grüßen',
  },
  {
    type: 'nk_settlement',
    label: 'NK-Abrechnung',
    subject: 'Nebenkostenabrechnung {{period}}',
    bodyTemplate: 'Sehr geehrte/r {{tenant_name}},\n\nanbei erhalten Sie die Nebenkostenabrechnung für den Zeitraum {{period}}.\n\nErgebnis: {{result}} ({{amount}} €)\n\nBei Nachzahlung bitten wir um Überweisung bis zum {{due_date}}.\n\nMit freundlichen Grüßen',
  },
  {
    type: 'move_in_welcome',
    label: 'Willkommen / Einzug',
    subject: 'Willkommen in Ihrem neuen Zuhause — {{address}}',
    bodyTemplate: 'Sehr geehrte/r {{tenant_name}},\n\nherzlich willkommen! Anbei die wichtigsten Informationen zu Ihrer neuen Wohnung:\n\n• Übergabetermin: {{handover_date}}\n• Ansprechpartner: {{manager_name}}\n• Notfallnummer: {{emergency_phone}}\n\nWir wünschen Ihnen einen guten Start!\n\nMit freundlichen Grüßen',
  },
  {
    type: 'move_out_notice',
    label: 'Kündigungsbestätigung',
    subject: 'Bestätigung Ihrer Kündigung — {{unit}}',
    bodyTemplate: 'Sehr geehrte/r {{tenant_name}},\n\nhiermit bestätigen wir den Eingang Ihrer Kündigung vom {{notice_date}}.\n\nDas Mietverhältnis endet zum {{end_date}}. Der Übergabetermin wird rechtzeitig mit Ihnen abgestimmt.\n\nMit freundlichen Grüßen',
  },
  {
    type: 'defect_ack',
    label: 'Mangelbestätigung',
    subject: 'Ihre Mängelanzeige — Ticket #{{ticket_id}}',
    bodyTemplate: 'Sehr geehrte/r {{tenant_name}},\n\nvielen Dank für Ihre Mängelanzeige. Wir haben diese unter Ticket #{{ticket_id}} erfasst.\n\nSchweregrad: {{severity}}\nVoraussichtliche Bearbeitung: {{sla_deadline}}\n\nWir melden uns schnellstmöglich.\n\nMit freundlichen Grüßen',
  },
  {
    type: 'deposit_settlement',
    label: 'Kautionsabrechnung',
    subject: 'Kautionsabrechnung — {{unit}}',
    bodyTemplate: 'Sehr geehrte/r {{tenant_name}},\n\nanbei die Abrechnung Ihrer Mietkaution:\n\nKaution: {{deposit_amount}} €\nZinsen: {{interest}} €\nAbzüge: {{deductions}} €\nAuszahlung: {{payout}} €\n\nDie Auszahlung erfolgt innerhalb von 14 Tagen.\n\nMit freundlichen Grüßen',
  },
  {
    type: 'prepayment_adjustment',
    label: 'Vorauszahlungsanpassung',
    subject: 'Anpassung der Nebenkosten-Vorauszahlung',
    bodyTemplate: 'Sehr geehrte/r {{tenant_name}},\n\nbasierend auf der letzten Nebenkostenabrechnung passen wir die monatliche Vorauszahlung wie folgt an:\n\nBisher: {{old_amount}} €\nNeu: {{new_amount}} €\nWirksam ab: {{effective_date}}\n\nMit freundlichen Grüßen',
  },
];

export function useTenancyCommunication(leaseId?: string) {
  const { profile } = useAuth();
  const tenantId = profile?.active_tenant_id;
  const queryClient = useQueryClient();

  // Fetch communication history from lifecycle events
  const historyQuery = useQuery({
    queryKey: ['tenancy-communication', tenantId, leaseId],
    queryFn: async () => {
      if (!tenantId) return [];
      let q = supabase
        .from('tenancy_lifecycle_events')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('event_type', [
          'dunning_mail_sent', 'dunning_mail_failed',
          'rent_increase_sent', 'nk_settlement_created',
        ])
        .order('created_at', { ascending: false })
        .limit(50);
      if (leaseId) q = q.eq('lease_id', leaseId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  // Create a communication event (logs to lifecycle)
  const logCommunication = useMutation({
    mutationFn: async (input: {
      leaseId: string;
      unitId?: string;
      propertyId?: string;
      messageType: TenancyMessageType;
      subject: string;
      recipientEmail?: string;
      channel: 'email' | 'letter' | 'portal';
    }) => {
      if (!tenantId) throw new Error('No tenant');
      const { error } = await supabase
        .from('tenancy_lifecycle_events')
        .insert({
          tenant_id: tenantId,
          lease_id: input.leaseId,
          unit_id: input.unitId || null,
          property_id: input.propertyId || null,
          event_type: 'dunning_mail_sent', // generic communication event
          severity: 'info',
          title: `${input.channel === 'email' ? 'E-Mail' : 'Brief'}: ${input.subject}`,
          description: `Nachricht vom Typ "${input.messageType}" versendet an ${input.recipientEmail || 'Mieter'}.`,
          payload: {
            messageType: input.messageType,
            subject: input.subject,
            channel: input.channel,
            recipientEmail: input.recipientEmail,
          },
          triggered_by: 'user',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenancy-communication'] });
      toast.success('Kommunikation protokolliert');
    },
  });

  const fillTemplate = (template: TenancyMessageTemplate, variables: Record<string, string>): { subject: string; body: string } => {
    let subject = template.subject;
    let body = template.bodyTemplate;
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      subject = subject.replace(pattern, value);
      body = body.replace(pattern, value);
    }
    return { subject, body };
  };

  return {
    communicationHistory: historyQuery.data || [],
    isLoading: historyQuery.isLoading,
    logCommunication,
    templates: TENANCY_MESSAGE_TEMPLATES,
    fillTemplate,
    getTemplate: (type: TenancyMessageType) => TENANCY_MESSAGE_TEMPLATES.find(t => t.type === type) || null,
  };
}
