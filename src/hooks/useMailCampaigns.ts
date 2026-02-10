/**
 * useMailCampaigns — CRUD hooks for Serien-E-Mail campaigns (MOD-14)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MailCampaign {
  id: string;
  user_id: string;
  org_id: string;
  name: string;
  subject_template: string;
  body_template: string;
  include_signature: boolean;
  status: string;
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
}

export interface MailCampaignRecipient {
  id: string;
  campaign_id: string;
  contact_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  city: string | null;
  delivery_status: string;
  sent_at: string | null;
  error: string | null;
}

export interface MailCampaignAttachment {
  id: string;
  campaign_id: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
}

const QUERY_KEY = 'mail_campaigns';

export function useMailCampaigns() {
  const { user, activeTenantId } = useAuth();
  const queryClient = useQueryClient();

  const campaignsQuery = useQuery({
    queryKey: [QUERY_KEY, activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mail_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MailCampaign[];
    },
    enabled: !!user,
  });

  const createCampaign = useMutation({
    mutationFn: async (input: {
      name: string;
      subject_template: string;
      body_template: string;
      include_signature: boolean;
      recipients: Array<{
        contact_id?: string;
        email: string;
        first_name?: string;
        last_name?: string;
        company?: string;
        city?: string;
      }>;
      attachments?: Array<{
        storage_path: string;
        filename: string;
        mime_type: string;
        size_bytes: number;
      }>;
    }) => {
      if (!user?.id || !activeTenantId) throw new Error('Not authenticated');

      // 1. Create campaign
      const { data: campaign, error: campErr } = await supabase
        .from('mail_campaigns')
        .insert({
          user_id: user.id,
          org_id: activeTenantId,
          name: input.name,
          subject_template: input.subject_template,
          body_template: input.body_template,
          include_signature: input.include_signature,
          recipients_count: input.recipients.length,
        })
        .select()
        .single();

      if (campErr || !campaign) throw campErr || new Error('Failed to create campaign');

      // 2. Insert recipients
      const recipientRows = input.recipients.map(r => ({
        campaign_id: campaign.id,
        contact_id: r.contact_id || null,
        email: r.email,
        first_name: r.first_name || null,
        last_name: r.last_name || null,
        company: r.company || null,
        city: r.city || null,
      }));

      const { error: recErr } = await supabase
        .from('mail_campaign_recipients')
        .insert(recipientRows);

      if (recErr) throw recErr;

      // 3. Insert attachments
      if (input.attachments && input.attachments.length > 0) {
        const attRows = input.attachments.map(a => ({
          campaign_id: campaign.id,
          storage_path: a.storage_path,
          filename: a.filename,
          mime_type: a.mime_type,
          size_bytes: a.size_bytes,
        }));

        const { error: attErr } = await supabase
          .from('mail_campaign_attachments')
          .insert(attRows);

        if (attErr) throw attErr;
      }

      return campaign as MailCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  const sendCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('sot-serien-email-send', {
        body: { campaign_id: campaignId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Send failed');
      return data as { sent_count: number; failed_count: number; total: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`${data.sent_count} von ${data.total} E-Mails gesendet`);
      if (data.failed_count > 0) {
        toast.warning(`${data.failed_count} E-Mails fehlgeschlagen`);
      }
    },
    onError: (err) => {
      toast.error(`Versand fehlgeschlagen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('mail_campaigns')
        .delete()
        .eq('id', campaignId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Kampagne gelöscht');
    },
  });

  return {
    campaigns: campaignsQuery.data || [],
    isLoading: campaignsQuery.isLoading,
    createCampaign,
    sendCampaign,
    deleteCampaign,
  };
}
