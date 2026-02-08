/**
 * useAdminEmailThreads — Hook for Zone 1 Email Threading
 * Manages conversation threads, messages, and thread operations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EmailThread {
  id: string;
  contact_id: string | null;
  subject: string | null;
  last_activity_at: string;
  message_count: number;
  unread_count: number;
  status: 'open' | 'awaiting_reply' | 'closed';
  created_at: string;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    company: string | null;
    category: string | null;
  };
}

export interface ThreadMessage {
  id: string;
  type: 'inbound' | 'outbound';
  from_email: string;
  to_email: string;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  sent_at: string | null;
  received_at: string | null;
  status?: string;
  is_read?: boolean;
}

export function useAdminEmailThreads() {
  const queryClient = useQueryClient();

  // Fetch all threads with contact info
  const threadsQuery = useQuery({
    queryKey: ['admin-email-threads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_email_threads')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, company, category)
        `)
        .order('last_activity_at', { ascending: false });
      
      if (error) throw error;
      return data as EmailThread[];
    },
  });

  // Get messages for a specific thread
  const useThreadMessages = (threadId: string | null) => {
    return useQuery({
      queryKey: ['admin-thread-messages', threadId],
      queryFn: async () => {
        if (!threadId) return [];

        // Fetch both inbound and outbound messages for this thread
        const [outboundRes, inboundRes] = await Promise.all([
          supabase
            .from('admin_outbound_emails')
            .select('*')
            .eq('thread_id', threadId)
            .order('sent_at', { ascending: true }),
          supabase
            .from('admin_inbound_emails')
            .select('*')
            .eq('thread_id', threadId)
            .order('received_at', { ascending: true }),
        ]);

        if (outboundRes.error) throw outboundRes.error;
        if (inboundRes.error) throw inboundRes.error;

        // Combine and sort by timestamp
        const messages: ThreadMessage[] = [
          ...(outboundRes.data || []).map((m) => ({
            id: m.id,
            type: 'outbound' as const,
            from_email: 'noreply@systemofatown.de',
            to_email: m.to_email,
            subject: m.subject,
            body_text: m.body_text,
            body_html: m.body_html,
            sent_at: m.sent_at,
            received_at: null,
            status: m.status,
          })),
          ...(inboundRes.data || []).map((m) => ({
            id: m.id,
            type: 'inbound' as const,
            from_email: m.from_email,
            to_email: m.to_email || 'admin@systemofatown.de',
            subject: m.subject,
            body_text: m.body_text,
            body_html: m.body_html,
            sent_at: null,
            received_at: m.received_at,
            is_read: m.is_read,
          })),
        ].sort((a, b) => {
          const timeA = a.sent_at || a.received_at || '';
          const timeB = b.sent_at || b.received_at || '';
          return new Date(timeA).getTime() - new Date(timeB).getTime();
        });

        return messages;
      },
      enabled: !!threadId,
    });
  };

  // Create or find thread for a contact
  const findOrCreateThread = useMutation({
    mutationFn: async ({ contactId, subject }: { contactId: string; subject: string }) => {
      // First, try to find existing open thread for this contact
      const { data: existingThread } = await supabase
        .from('admin_email_threads')
        .select('id')
        .eq('contact_id', contactId)
        .eq('status', 'open')
        .maybeSingle();

      if (existingThread) {
        return existingThread.id;
      }

      // Create new thread
      const { data, error } = await supabase
        .from('admin_email_threads')
        .insert({
          contact_id: contactId,
          subject,
          message_count: 0,
          unread_count: 0,
          status: 'open',
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-threads'] });
    },
  });

  // Update thread status
  const updateThreadStatus = useMutation({
    mutationFn: async ({ threadId, status }: { threadId: string; status: string }) => {
      const { error } = await supabase
        .from('admin_email_threads')
        .update({ status })
        .eq('id', threadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-threads'] });
    },
  });

  // Mark thread as read (reset unread_count)
  const markThreadRead = useMutation({
    mutationFn: async (threadId: string) => {
      const { error } = await supabase
        .from('admin_email_threads')
        .update({ unread_count: 0 })
        .eq('id', threadId);
      
      if (error) throw error;

      // Also mark all inbound messages in this thread as read
      await supabase
        .from('admin_inbound_emails')
        .update({ is_read: true })
        .eq('thread_id', threadId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-threads'] });
    },
  });

  return {
    threads: threadsQuery.data || [],
    isLoading: threadsQuery.isLoading,
    useThreadMessages,
    findOrCreateThread,
    updateThreadStatus,
    markThreadRead,
  };
}

export function useAdminContactTags(contactId: string | null) {
  const queryClient = useQueryClient();

  const tagsQuery = useQuery({
    queryKey: ['admin-contact-tags', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      const { data, error } = await supabase
        .from('admin_contact_tags')
        .select('*')
        .eq('contact_id', contactId)
        .order('tag');
      
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });

  const addTag = useMutation({
    mutationFn: async ({ contactId, tag }: { contactId: string; tag: string }) => {
      const { error } = await supabase
        .from('admin_contact_tags')
        .insert({ contact_id: contactId, tag: tag.toLowerCase() });
      
      if (error && error.code !== '23505') throw error; // Ignore duplicate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-tags'] });
    },
  });

  const removeTag = useMutation({
    mutationFn: async ({ contactId, tag }: { contactId: string; tag: string }) => {
      const { error } = await supabase
        .from('admin_contact_tags')
        .delete()
        .eq('contact_id', contactId)
        .eq('tag', tag);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-tags'] });
    },
  });

  return {
    tags: tagsQuery.data || [],
    isLoading: tagsQuery.isLoading,
    addTag,
    removeTag,
  };
}

// Hook to get all unique tags used in the system
export function useAllAdminTags() {
  return useQuery({
    queryKey: ['admin-all-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_contact_tags')
        .select('tag')
        .order('tag');
      
      if (error) throw error;
      
      // Get unique tags
      const uniqueTags = [...new Set(data.map(d => d.tag))];
      return uniqueTags;
    },
  });
}
