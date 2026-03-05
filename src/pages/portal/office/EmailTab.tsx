/**
 * EmailTab Orchestrator (R-7 refactored)
 * Reduced from 1506 → ~180 lines. All UI in sub-components.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ComposeEmailDialog } from '@/components/portal/office/ComposeEmailDialog';
import { AccountIntegrationDialog } from '@/components/portal/office/AccountIntegrationDialog';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { buildThreads } from '@/components/office/email/emailHelpers';
import {
  useEmailAccounts,
  useEmailMessages,
  useEmailSearch,
  useDeleteMessage,
  useArchiveMessage,
  useToggleStar,
  useMarkRead,
  useSyncMail,
  useFetchBody,
  useSyncContacts,
  useSyncCalendar,
} from '@/components/office/email/useEmailQueries';
import { EmailAccountSidebar } from '@/components/office/email/EmailAccountSidebar';
import { EmailThreadList } from '@/components/office/email/EmailThreadList';
import { ThreadDetailPanel } from '@/components/office/email/ThreadDetailPanel';
import { NoEmailSelected } from '@/components/office/email/EmailEmptyStates';

export function EmailTab() {
  const queryClient = useQueryClient();
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [composeInitialTo, setComposeInitialTo] = useState('');
  const [composeInitialSubject, setComposeInitialSubject] = useState('');
  const [composeInitialBody, setComposeInitialBody] = useState('');
  const [isLoadingBody, setIsLoadingBody] = useState(false);
  const [bodyFetchError, setBodyFetchError] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('__init__');
  const [loadedMessages, setLoadedMessages] = useState<any[]>([]);
  const [messageCursor, setMessageCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchLoadedMessages, setSearchLoadedMessages] = useState<any[]>([]);
  const [searchCursor, setSearchCursor] = useState<string | null>(null);
  const [isLoadingMoreSearch, setIsLoadingMoreSearch] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterStarred, setFilterStarred] = useState(false);
  const [filterAttachments, setFilterAttachments] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const isSearchMode = debouncedSearch.length > 0 || filterUnread || filterStarred || filterAttachments;

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(searchQuery), 300); return () => clearTimeout(t); }, [searchQuery]);

  // ── Data hooks ──
  const { data: accounts = [], isLoading: isLoadingAccounts, refetch: refetchAccounts } = useEmailAccounts();
  const hasConnectedAccount = accounts.length > 0;

  useEffect(() => { if (accounts.length > 0 && selectedAccountId === '__init__') setSelectedAccountId(accounts[0].id); }, [accounts, selectedAccountId]);

  const activeAccount = selectedAccountId === 'all' || selectedAccountId === '__init__' ? accounts[0] : accounts.find(a => a.id === selectedAccountId) || accounts[0];
  const queryAccountIds = selectedAccountId === 'all' || selectedAccountId === '__init__' ? accounts.map(a => a.id) : [selectedAccountId];

  const { data: messages = [], isLoading: isLoadingMessages, refetch: refetchMessages } = useEmailMessages(queryAccountIds, selectedFolder, hasConnectedAccount && !isSearchMode);
  const { data: searchResults, isLoading: isLoadingSearch } = useEmailSearch(queryAccountIds, debouncedSearch, selectedFolder, filterUnread, filterStarred, filterAttachments, hasConnectedAccount && isSearchMode);

  // Reset pagination on folder/search change
  useEffect(() => { setLoadedMessages([]); setMessageCursor(null); }, [selectedAccountId, selectedFolder]);
  useEffect(() => { setSearchLoadedMessages([]); setSearchCursor(null); }, [debouncedSearch, filterUnread, filterStarred, filterAttachments, selectedAccountId, selectedFolder]);

  const activeMessages = isSearchMode ? (searchLoadedMessages.length > 0 ? searchLoadedMessages : (searchResults?.messages || [])) : (loadedMessages.length > 0 ? loadedMessages : messages);
  const hasMoreMessages = isSearchMode ? (searchCursor !== null) : (loadedMessages.length > 0 ? messageCursor !== null : messages.length >= 50);
  const threads = useMemo(() => buildThreads(activeMessages, isSearchMode), [activeMessages, isSearchMode]);
  const selectedThread = threads.find(t => t.threadId === selectedThreadId);

  // ── Mutations ──
  const deleteMutation = useDeleteMessage(selectedFolder, () => refetchMessages());
  const archiveMutation = useArchiveMessage(() => refetchMessages());
  const toggleStarMutation = useToggleStar(queryClient, selectedAccountId, selectedFolder);
  const markReadMutation = useMarkRead(queryClient, selectedAccountId, selectedFolder);
  const syncMutation = useSyncMail(activeAccount?.id, () => refetchMessages());
  const syncContactsMutation = useSyncContacts();
  const syncCalendarMutation = useSyncCalendar();
  const fetchBody = useFetchBody(queryClient, selectedAccountId, selectedFolder);

  const handleFetchBody = useCallback((email: any) => fetchBody(email, activeAccount?.id, setIsLoadingBody, setBodyFetchError), [activeAccount?.id, fetchBody]);

  // ── Mark read on thread select ──
  useEffect(() => {
    if (selectedThread?.unreadCount && selectedThread.unreadCount > 0) {
      selectedThread.messages.filter((m: any) => !m.is_read).forEach((m: any) => markReadMutation.mutate(m.id));
    }
  }, [selectedThreadId]);

  // ── Gmail OAuth redirect handler ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gmailAuth = params.get('gmail_auth');
    if (gmailAuth) {
      window.history.replaceState({}, '', window.location.pathname);
      if (gmailAuth === 'success') { toast.success('Gmail erfolgreich verbunden!'); refetchAccounts(); setShowConnectionDialog(false); }
      else toast.error('Gmail-Verbindung fehlgeschlagen: ' + (params.get('gmail_error') || 'Unbekannt'));
      setIsConnecting(false);
    }
  }, []);

  // ── Background polling ──
  const lastKnownIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!hasConnectedAccount || isSearchMode) return;
    if (messages.length > 0) lastKnownIdRef.current = messages[0]?.id;
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.from('mail_messages').select('id').in('account_id', queryAccountIds).eq('folder', selectedFolder.toUpperCase()).order('received_at', { ascending: false }).limit(1);
        const newestId = data?.[0]?.id;
        if (newestId && newestId !== lastKnownIdRef.current) { lastKnownIdRef.current = newestId; queryClient.invalidateQueries({ queryKey: ['email-messages', queryAccountIds.join(','), selectedFolder] }); }
      } catch { /* silent */ }
    }, 60_000);
    return () => clearInterval(interval);
  }, [selectedAccountId, selectedFolder, hasConnectedAccount, isSearchMode]);

  // ── Compose helpers ──
  const openCompose = (to = '', subject = '', body = '') => { setComposeInitialTo(to); setComposeInitialSubject(subject); setComposeInitialBody(body); setShowComposeDialog(true); };
  const handleReply = (email: any) => { const s = email.subject || ''; const q = `\n\n--- Am ${new Date(email.received_at).toLocaleString('de-DE')} schrieb ${email.from_name || email.from_address || ''}: ---\n${email.body_text || email.snippet || ''}`; openCompose(email.from_address || '', s.startsWith('Re:') ? s : `Re: ${s}`, q); };
  const handleReplyAll = (email: any) => { const toAddrs = Array.isArray(email.to_addresses) ? email.to_addresses : []; const all = [email.from_address || '', ...toAddrs].filter((a: string) => a && a !== activeAccount?.email_address); const s = email.subject || ''; const q = `\n\n--- Am ${new Date(email.received_at).toLocaleString('de-DE')} schrieb ${email.from_name || email.from_address || ''}: ---\n${email.body_text || email.snippet || ''}`; openCompose(all.join(', '), s.startsWith('Re:') ? s : `Re: ${s}`, q); };
  const handleForward = (email: any) => { const s = email.subject || ''; const q = `\n\n--- Weitergeleitete Nachricht ---\nVon: ${email.from_name || email.from_address || ''}\nDatum: ${new Date(email.received_at).toLocaleString('de-DE')}\nBetreff: ${s}\n\n${email.body_text || email.snippet || ''}`; openCompose('', s.startsWith('Fwd:') ? s : `Fwd: ${s}`, q); };

  // ── Load more ──
  const handleLoadMore = async () => {
    const allMsgs = loadedMessages.length > 0 ? loadedMessages : messages;
    if (allMsgs.length === 0) return;
    setIsLoadingMore(true);
    try {
      const { data } = await supabase.from('mail_messages').select('*').in('account_id', queryAccountIds).eq('folder', selectedFolder.toUpperCase()).lt('received_at', allMsgs[allMsgs.length - 1].received_at).order('received_at', { ascending: false }).limit(50);
      setLoadedMessages([...allMsgs, ...(data || [])]);
      if (!data || data.length < 50) setMessageCursor(null); else setMessageCursor(data[data.length - 1].received_at);
    } catch { toast.error('Weitere E-Mails konnten nicht geladen werden'); } finally { setIsLoadingMore(false); }
  };

  const handleLoadMoreSearch = async () => {
    const allMsgs = searchLoadedMessages.length > 0 ? searchLoadedMessages : (searchResults?.messages || []);
    const cursorToUse = searchCursor || allMsgs[allMsgs.length - 1]?.received_at;
    if (!cursorToUse) return;
    setIsLoadingMoreSearch(true);
    try {
      const { data } = await supabase.functions.invoke('sot-mail-search', { body: { accountIds: queryAccountIds, q: debouncedSearch || undefined, folder: selectedFolder.toUpperCase(), unreadOnly: filterUnread || undefined, starredOnly: filterStarred || undefined, hasAttachments: filterAttachments || undefined, limit: 50, cursor: cursorToUse } });
      setSearchLoadedMessages([...allMsgs, ...(data?.messages || [])]);
      setSearchCursor(data?.nextCursor || null);
    } catch { toast.error('Weitere Ergebnisse konnten nicht geladen werden'); } finally { setIsLoadingMoreSearch(false); }
  };

  const handleAccountChange = (value: string) => { setSelectedAccountId(value as string | 'all'); setSelectedThreadId(null); setLoadedMessages([]); setMessageCursor(null); setSearchLoadedMessages([]); setSearchCursor(null); };
  const clearSearch = () => { setSearchQuery(''); setDebouncedSearch(''); setFilterUnread(false); setFilterStarred(false); setFilterAttachments(false); setSearchLoadedMessages([]); setSearchCursor(null); };

  const handleShowThread = async (msg: any) => {
    const threadId = msg.thread_id || msg.id;
    clearSearch();
    setSelectedThreadId(threadId);
    try {
      const result = await refetchMessages();
      const found = (result.data || []).some((m: any) => (m.thread_id || m.id) === threadId);
      if (!found) {
        const { data } = await supabase.from('mail_messages').select('*').in('account_id', queryAccountIds).or(`thread_id.eq.${threadId},id.eq.${threadId}`).order('received_at', { ascending: false }).limit(20);
        if (data?.length) queryClient.setQueryData(['email-messages', queryAccountIds.join(','), selectedFolder], (old: any[] | undefined) => { const ids = new Set((old || []).map((m: any) => m.id)); return [...(old || []), ...data.filter((m: any) => !ids.has(m.id))]; });
      }
    } catch { /* thread detail will show empty */ }
  };

  if (isLoadingAccounts) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden px-2 py-3 md:px-6 md:py-4">
      <div className="shrink-0"><ModulePageHeader title="E-Mail" description="Ihr KI-gestützter E-Mail-Client" /></div>
      <AccountIntegrationDialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog} />
      <ComposeEmailDialog
        open={showComposeDialog}
        onOpenChange={(open) => { setShowComposeDialog(open); if (!open) { setComposeInitialTo(''); setComposeInitialSubject(''); setComposeInitialBody(''); } }}
        accounts={accounts}
        defaultAccountId={activeAccount?.id || ''}
        initialTo={composeInitialTo}
        initialSubject={composeInitialSubject}
        initialBody={composeInitialBody}
        onSent={() => refetchMessages()}
      />
      <Card className="glass-card flex-1 min-h-0 overflow-hidden mt-4">
        <div className="grid grid-cols-12 h-full">
          <EmailAccountSidebar
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            hasConnectedAccount={hasConnectedAccount}
            selectedFolder={selectedFolder}
            onAccountChange={handleAccountChange}
            onFolderSelect={(id) => { setSelectedFolder(id); setSelectedThreadId(null); }}
            onCompose={() => setShowComposeDialog(true)}
            onConnectAccount={() => setShowConnectionDialog(true)}
            syncContactsMutation={syncContactsMutation}
            syncCalendarMutation={syncCalendarMutation}
            activeAccount={activeAccount}
          />
          <EmailThreadList
            threads={threads}
            selectedThreadId={selectedThreadId}
            onSelectThread={setSelectedThreadId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterUnread={filterUnread}
            filterStarred={filterStarred}
            filterAttachments={filterAttachments}
            onToggleFilterUnread={() => setFilterUnread(!filterUnread)}
            onToggleFilterStarred={() => setFilterStarred(!filterStarred)}
            onToggleFilterAttachments={() => setFilterAttachments(!filterAttachments)}
            isSearchMode={isSearchMode}
            onClearSearch={clearSearch}
            hasConnectedAccount={hasConnectedAccount}
            isLoading={isSearchMode ? isLoadingSearch : isLoadingMessages}
            hasMoreMessages={hasMoreMessages}
            isLoadingMore={isSearchMode ? isLoadingMoreSearch : isLoadingMore}
            onLoadMore={isSearchMode ? handleLoadMoreSearch : handleLoadMore}
            onSync={() => syncMutation.mutate()}
            isSyncing={syncMutation.isPending}
            onConnectAccount={() => setShowConnectionDialog(true)}
            onShowThread={handleShowThread}
            onToggleStar={(id, starred) => toggleStarMutation.mutate({ messageId: id, isStarred: starred })}
            onArchive={(id) => archiveMutation.mutate(id)}
            onDelete={(id) => deleteMutation.mutate({ messageId: id, activeMessages, activeAccount })}
            accounts={accounts}
            selectedAccountId={selectedAccountId}
          />
          <div className="col-span-6 flex flex-col overflow-hidden">
            {selectedThread ? (
              <ThreadDetailPanel
                thread={selectedThread}
                activeAccount={activeAccount}
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                isLoadingBody={isLoadingBody}
                bodyFetchError={bodyFetchError}
                onFetchBody={handleFetchBody}
                onReply={handleReply}
                onReplyAll={handleReplyAll}
                onForward={handleForward}
                onDelete={(id) => deleteMutation.mutate({ messageId: id, activeMessages, activeAccount })}
                onArchive={(id) => archiveMutation.mutate(id)}
                onToggleStar={(id, starred) => toggleStarMutation.mutate({ messageId: id, isStarred: starred })}
                isPending={{ delete: deleteMutation.isPending, archive: archiveMutation.isPending, star: toggleStarMutation.isPending }}
                setBodyFetchError={setBodyFetchError}
                queryClient={queryClient}
                selectedFolder={selectedFolder}
              />
            ) : (
              <NoEmailSelected hasConnectedAccount={hasConnectedAccount} />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
