/**
 * ACQUISITION OUTBOUND HOOKS
 * 
 * Hooks for Outbound Messages and Email Templates
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export type OutboundStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'opened' | 'bounced' | 'replied' | 'failed';

export interface AcqOutboundMessage {
  id: string;
  mandate_id: string;
  contact_id: string;
  resend_message_id: string | null;
  template_code: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  status: OutboundStatus;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  bounced_at: string | null;
  replied_at: string | null;
  routing_token: string;
  error_message: string | null;
  created_at: string;
  contact?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    company: string | null;
  };
}

export interface AcqInboundMessage {
  id: string;
  mandate_id: string | null;
  contact_id: string | null;
  resend_inbound_id: string | null;
  from_email: string;
  to_email: string | null;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  attachments: Array<{ filename: string; storage_path: string; mime_type: string }>;
  routing_method: 'token' | 'email_match' | 'thread' | 'ai_fallback' | 'manual' | null;
  routing_confidence: number;
  needs_routing: boolean;
  routed_at: string | null;
  routed_by: string | null;
  in_reply_to_message_id: string | null;
  received_at: string;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  code: string;
  name: string;
  subject_template: string;
  body_html_template: string;
  body_text_template: string | null;
  category: string;
  is_active: boolean;
  variables: string[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// OUTBOUND HOOKS
// ============================================================================

/**
 * Fetch outbound messages for a mandate
 */
export function useAcqOutboundMessages(mandateId: string | undefined) {
  return useQuery({
    queryKey: ['acq-outbound', mandateId],
    queryFn: async () => {
      if (!mandateId) return [];

      const { data, error } = await supabase
        .from('acq_outbound_messages')
        .select(`
          *,
          contact:contacts(first_name, last_name, email, company)
        `)
        .eq('mandate_id', mandateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AcqOutboundMessage[];
    },
    enabled: !!mandateId,
  });
}

/**
 * Send outreach email
 */
export function useSendOutreach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      mandateId, 
      contactId, 
      templateCode,
      variables 
    }: { 
      mandateId: string; 
      contactId: string; 
      templateCode: string;
      variables: Record<string, string>;
    }) => {
      const { data, error } = await supabase.functions.invoke('sot-acq-outbound', {
        body: { mandateId, contactId, templateCode, variables },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-outbound'] });
      queryClient.invalidateQueries({ queryKey: ['outreach-queue'] });
      toast.success('E-Mail wird gesendet');
    },
    onError: (error) => {
      toast.error('Senden fehlgeschlagen: ' + (error as Error).message);
    },
  });
}

/**
 * Bulk send emails
 */
export function useBulkSendOutreach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      mandateId, 
      contactIds, 
      templateCode,
      variables 
    }: { 
      mandateId: string; 
      contactIds: string[]; 
      templateCode: string;
      variables: Record<string, string>;
    }) => {
      const { data, error } = await supabase.functions.invoke('sot-acq-outbound', {
        body: { mandateId, contactIds, templateCode, variables, bulk: true },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['acq-outbound'] });
      toast.success(`${variables.contactIds.length} E-Mails werden gesendet`);
    },
    onError: (error) => {
      toast.error('Bulk-Send fehlgeschlagen: ' + (error as Error).message);
    },
  });
}

// ============================================================================
// INBOUND HOOKS
// ============================================================================

/**
 * Fetch inbound messages for a mandate
 */
export function useAcqInboundMessages(mandateId: string | undefined) {
  return useQuery({
    queryKey: ['acq-inbound', mandateId],
    queryFn: async () => {
      if (!mandateId) return [];

      const { data, error } = await supabase
        .from('acq_inbound_messages')
        .select('*')
        .eq('mandate_id', mandateId)
        .order('received_at', { ascending: false });

      if (error) throw error;
      return data as unknown as AcqInboundMessage[];
    },
    enabled: !!mandateId,
  });
}

/**
 * Fetch messages needing routing (Zone-1)
 */
export function useNeedsRoutingMessages() {
  return useQuery({
    queryKey: ['acq-inbound', 'needs-routing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acq_inbound_messages')
        .select('*')
        .eq('needs_routing', true)
        .order('received_at', { ascending: false });

      if (error) throw error;
      return data as unknown as AcqInboundMessage[];
    },
  });
}

/**
 * Route inbound message to mandate
 */
export function useRouteInboundMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      messageId, 
      mandateId,
      contactId 
    }: { 
      messageId: string; 
      mandateId: string;
      contactId?: string;
    }) => {
      const { error } = await supabase
        .from('acq_inbound_messages')
        .update({
          mandate_id: mandateId,
          contact_id: contactId,
          needs_routing: false,
          routing_method: 'manual',
          routing_confidence: 100,
          routed_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-inbound'] });
      toast.success('Nachricht zugeordnet');
    },
  });
}

/**
 * Convert inbound to offer
 */
export function useConvertToOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      inboundId, 
      mandateId 
    }: { 
      inboundId: string; 
      mandateId: string;
    }) => {
      // Get inbound message
      const { data: inbound, error: fetchError } = await supabase
        .from('acq_inbound_messages')
        .select('*')
        .eq('id', inboundId)
        .single();

      if (fetchError || !inbound) throw new Error('Nachricht nicht gefunden');

      // Create offer
      const { data: offer, error: createError } = await supabase
        .from('acq_offers')
        .insert([{
          mandate_id: mandateId,
          source_type: 'inbound_email' as const,
          source_contact_id: inbound.contact_id,
          source_inbound_id: inboundId,
          title: inbound.subject || 'Exposé',
          status: 'new' as const,
          tenant_id: inbound.tenant_id!,
        }])
        .select()
        .single();

      if (createError) throw createError;
      return offer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-offers'] });
      queryClient.invalidateQueries({ queryKey: ['acq-inbound'] });
      toast.success('Angebot aus E-Mail erstellt');
    },
  });
}

// ============================================================================
// TEMPLATE HOOKS
// ============================================================================

/**
 * Fetch email templates
 */
export function useEmailTemplates(category?: string) {
  return useQuery({
    queryKey: ['email-templates', category],
    queryFn: async () => {
      let query = supabase
        .from('acq_email_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EmailTemplate[];
    },
  });
}

/**
 * Render template with variables
 */
export function renderTemplate(
  template: EmailTemplate, 
  variables: Record<string, string>
): { subject: string; bodyHtml: string; bodyText: string } {
  let subject = template.subject_template;
  let bodyHtml = template.body_html_template;
  let bodyText = template.body_text_template || '';

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
    bodyHtml = bodyHtml.replace(new RegExp(placeholder, 'g'), value);
    bodyText = bodyText.replace(new RegExp(placeholder, 'g'), value);
  }

  return { subject, bodyHtml, bodyText };
}
