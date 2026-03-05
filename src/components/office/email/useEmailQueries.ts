/**
 * Email data hooks (R-7 extraction from EmailTab.tsx)
 * All useQuery / useMutation hooks for the email client.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { EmailAccount } from './emailTypes';

export function useEmailAccounts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['email-accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mail_accounts')
        .select('id, provider, email_address, display_name, sync_status, last_sync_at, sync_error, sync_mail, sync_calendar, sync_contacts')
        .order('created_at', { ascending: false });
      if (error) { console.error('Error fetching mail accounts:', error); return []; }
      return data as EmailAccount[];
    },
  });
}

export function useEmailMessages(queryAccountIds: string[], selectedFolder: string, enabled: boolean) {
  return useQuery({
    queryKey: ['email-messages', queryAccountIds.join(','), selectedFolder],
    queryFn: async () => {
      if (queryAccountIds.length === 0) return [];
      const { data, error } = await supabase
        .from('mail_messages')
        .select('*')
        .in('account_id', queryAccountIds)
        .eq('folder', selectedFolder.toUpperCase())
        .order('received_at', { ascending: false })
        .limit(50);
      if (error) { console.error('Error fetching messages:', error); return []; }
      return data;
    },
    enabled,
  });
}

export function useEmailSearch(
  queryAccountIds: string[],
  debouncedSearch: string,
  selectedFolder: string,
  filterUnread: boolean,
  filterStarred: boolean,
  filterAttachments: boolean,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['email-search', debouncedSearch, filterUnread, filterStarred, filterAttachments, queryAccountIds.join(','), selectedFolder],
    queryFn: async () => {
      if (queryAccountIds.length === 0) return { messages: [], nextCursor: null };
      const { data, error } = await supabase.functions.invoke('sot-mail-search', {
        body: {
          accountIds: queryAccountIds,
          q: debouncedSearch || undefined,
          folder: selectedFolder.toUpperCase(),
          unreadOnly: filterUnread || undefined,
          starredOnly: filterStarred || undefined,
          hasAttachments: filterAttachments || undefined,
          limit: 50,
        },
      });
      if (error) { console.error('Search error:', error); return { messages: [], nextCursor: null }; }
      return data as { messages: any[]; nextCursor: string | null };
    },
    enabled,
  });
}

export function useDeleteMessage(selectedFolder: string, refetchMessages: () => void) {
  return useMutation({
    mutationFn: async ({ messageId, activeMessages, activeAccount }: { messageId: string; activeMessages: any[]; activeAccount: any }) => {
      if (!activeAccount) throw new Error('No account selected');
      const message = activeMessages.find((m: any) => m.id === messageId);
      if (!message) throw new Error('Message not found');
      if (selectedFolder === 'trash') {
        const { error } = await supabase.from('mail_messages').delete().eq('id', messageId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('mail_messages').update({ folder: 'TRASH' }).eq('id', messageId);
        if (error) throw error;
      }
      return messageId;
    },
    onSuccess: () => {
      toast.success(selectedFolder === 'trash' ? 'E-Mail endgültig gelöscht' : 'E-Mail in Papierkorb verschoben');
      refetchMessages();
    },
    onError: (error: any) => toast.error('Löschen fehlgeschlagen: ' + error.message),
  });
}

export function useArchiveMessage(refetchMessages: () => void) {
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase.from('mail_messages').update({ folder: 'ARCHIVE' }).eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('E-Mail archiviert'); refetchMessages(); },
    onError: (error: any) => toast.error('Archivieren fehlgeschlagen: ' + error.message),
  });
}

export function useToggleStar(queryClient: any, selectedAccountId: string, selectedFolder: string) {
  return useMutation({
    mutationFn: async ({ messageId, isStarred }: { messageId: string; isStarred: boolean }) => {
      const { error } = await supabase.from('mail_messages').update({ is_starred: !isStarred }).eq('id', messageId);
      if (error) throw error;
      return { messageId, newStarred: !isStarred };
    },
    onSuccess: ({ messageId, newStarred }) => {
      queryClient.setQueryData(['email-messages', selectedAccountId, selectedFolder], (old: any[] | undefined) =>
        old?.map((m: any) => m.id === messageId ? { ...m, is_starred: newStarred } : m)
      );
    },
    onError: (error: any) => toast.error('Markierung fehlgeschlagen: ' + error.message),
  });
}

export function useMarkRead(queryClient: any, selectedAccountId: string, selectedFolder: string) {
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase.from('mail_messages').update({ is_read: true }).eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: (_, messageId) => {
      queryClient.setQueryData(['email-messages', selectedAccountId, selectedFolder], (old: any[] | undefined) =>
        old?.map((m: any) => m.id === messageId ? { ...m, is_read: true } : m)
      );
    },
  });
}

export function useSyncMail(activeAccountId: string | undefined, refetchMessages: () => void) {
  return useMutation({
    mutationFn: async () => {
      if (!activeAccountId) throw new Error('No account');
      const { data, error } = await supabase.functions.invoke('sot-mail-sync', {
        body: { accountId: activeAccountId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data?.syncedMessages || 0} E-Mails synchronisiert`);
      refetchMessages();
    },
    onError: (error: any) => toast.error('Synchronisierung fehlgeschlagen: ' + error.message),
  });
}

export function useFetchBody(queryClient: any, selectedAccountId: string, selectedFolder: string) {
  return async (
    email: any,
    activeAccountId: string | undefined,
    setIsLoadingBody: (v: boolean) => void,
    setBodyFetchError: (v: boolean) => void,
  ) => {
    if (!activeAccountId || !email) return;
    setIsLoadingBody(true);
    setBodyFetchError(false);
    try {
      const { data, error } = await supabase.functions.invoke('sot-mail-fetch-body', {
        body: { accountId: activeAccountId, messageId: email.id, providerMessageId: email.provider_message_id },
      });
      if (error) throw error;
      if (data?.body_html || data?.body_text) {
        queryClient.setQueryData(
          ['email-messages', selectedAccountId, selectedFolder],
          (old: any[] | undefined) =>
            old?.map((m: any) =>
              m.id === email.id ? { ...m, body_html: data.body_html, body_text: data.body_text } : m
            )
        );
      }
    } catch (err: any) {
      console.error('Body fetch error:', err);
      setBodyFetchError(true);
    } finally {
      setIsLoadingBody(false);
    }
  };
}

export function useSyncContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data, error } = await supabase.functions.invoke('sot-contacts-sync', { body: { accountId } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data?.syncedContacts || 0} Kontakte synchronisiert`);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error: any) => toast.error('Kontakte-Sync fehlgeschlagen: ' + error.message),
  });
}

export function useSyncCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data, error } = await supabase.functions.invoke('sot-calendar-sync', { body: { accountId } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data?.syncedEvents || 0} Termine synchronisiert`);
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: (error: any) => toast.error('Kalender-Sync fehlgeschlagen: ' + error.message),
  });
}
