/**
 * ThreadDetailPanel — Thread view with collapsible messages (R-7)
 * Includes SingleEmailDetail for single-message threads.
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  Star, Archive, Trash2, Reply, ReplyAll, Forward,
  ChevronDown, ChevronRight, MessageSquare, Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';
import type { EmailThread, EmailAccount } from './emailTypes';
import { SendToObjekteingangButton } from './SendToObjekteingangButton';

interface ThreadDetailPanelProps {
  thread: EmailThread;
  activeAccount: any;
  accounts: EmailAccount[];
  selectedAccountId: string | 'all';
  isLoadingBody: boolean;
  bodyFetchError: boolean;
  setBodyFetchError: (v: boolean) => void;
  onFetchBody: (email: any) => void;
  onReply: (email: any) => void;
  onReplyAll: (email: any) => void;
  onForward: (email: any) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onToggleStar: (id: string, starred: boolean) => void;
  isPending: { delete: boolean; archive: boolean; star: boolean };
  queryClient: any;
  selectedFolder: string;
}

export function ThreadDetailPanel({
  thread, activeAccount, accounts, selectedAccountId,
  isLoadingBody, bodyFetchError, onFetchBody,
  onReply, onReplyAll, onForward, onDelete, onArchive, onToggleStar,
  isPending, setBodyFetchError,
}: ThreadDetailPanelProps) {
  const isSingleMessage = thread.messages.length === 1;
  const latestMsg = thread.latestMessage;

  if (isSingleMessage) {
    return (
      <SingleEmailDetail
        email={latestMsg}
        activeAccount={activeAccount}
        isLoadingBody={isLoadingBody}
        bodyFetchError={bodyFetchError}
        onFetchBody={onFetchBody}
        onReply={onReply}
        onReplyAll={onReplyAll}
        onForward={onForward}
        onDelete={onDelete}
        onArchive={onArchive}
        onToggleStar={onToggleStar}
        setBodyFetchError={setBodyFetchError}
        isPending={isPending}
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b space-y-2 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold">{thread.subject}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                {thread.messages.length} Nachrichten
              </Badge>
              {thread.unreadCount > 0 && (
                <Badge variant="default" className="text-xs">{thread.unreadCount} ungelesen</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Antworten" onClick={() => onReply(latestMsg)}><Reply className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Allen antworten" onClick={() => onReplyAll(latestMsg)}><ReplyAll className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Weiterleiten" onClick={() => onForward(latestMsg)}><Forward className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {thread.messages.map((msg, idx) => (
            <ThreadMessage
              key={msg.id}
              email={msg}
              isLatest={idx === thread.messages.length - 1}
              activeAccount={activeAccount}
              onFetchBody={onFetchBody}
              onReply={onReply}
              onDelete={onDelete}
              onArchive={onArchive}
              onToggleStar={onToggleStar}
              isPending={isPending}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Single message inside a thread (collapsible) ──
function ThreadMessage({
  email, isLatest, activeAccount, onFetchBody, onReply, onDelete, onArchive, onToggleStar, isPending,
}: {
  email: any; isLatest: boolean; activeAccount: any;
  onFetchBody: (email: any) => void; onReply: (email: any) => void;
  onDelete: (id: string) => void; onArchive: (id: string) => void;
  onToggleStar: (id: string, starred: boolean) => void;
  isPending: { delete: boolean; archive: boolean; star: boolean };
}) {
  const [isOpen, setIsOpen] = useState(isLatest);
  const [bodyFetched, setBodyFetched] = useState(false);

  useEffect(() => {
    if (isOpen && !email.body_text && !email.body_html && !bodyFetched) {
      setBodyFetched(true);
      onFetchBody(email);
    }
  }, [isOpen, email.id]);

  const hasBody = email.body_text || email.body_html;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className={cn(
          "flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-accent/50",
          !email.is_read && "bg-primary/5",
          isOpen && "border-b"
        )}>
          {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-primary">{(email.from_name || email.from_address || '?')[0].toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn("text-sm truncate", !email.is_read && "font-semibold")}>{email.from_name || email.from_address}</span>
              {email.is_starred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
            </div>
            {!isOpen && <p className="text-xs text-muted-foreground truncate">{email.snippet}</p>}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(email.received_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4">
          <div className="flex items-center gap-1 mb-3">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onReply(email)}><Reply className="h-3 w-3 mr-1" /> Antworten</Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleStar(email.id, email.is_starred)}>
              <Star className={cn("h-3 w-3", email.is_starred && "text-yellow-500 fill-yellow-500")} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onArchive(email.id)}><Archive className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(email.id)}><Trash2 className="h-3 w-3" /></Button>
          </div>
          <EmailBody email={email} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Single Email Detail Panel (for single-message threads) ──
function SingleEmailDetail({
  email, activeAccount, isLoadingBody, bodyFetchError, onFetchBody,
  onReply, onReplyAll, onForward, onDelete, onArchive, onToggleStar,
  setBodyFetchError, isPending,
}: {
  email: any; activeAccount: any; isLoadingBody: boolean; bodyFetchError: boolean;
  setBodyFetchError: (v: boolean) => void; onFetchBody: (email: any) => void;
  onReply: (email: any) => void; onReplyAll: (email: any) => void; onForward: (email: any) => void;
  onDelete: (id: string) => void; onArchive: (id: string) => void;
  onToggleStar: (id: string, starred: boolean) => void;
  isPending: { delete: boolean; archive: boolean; star: boolean };
}) {
  const [fetchTriggered, setFetchTriggered] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  useEffect(() => {
    if (email && !email.body_text && !email.body_html && !isLoadingBody && !fetchTriggered && !bodyFetchError) {
      setFetchTriggered(true);
      onFetchBody(email);
    }
  }, [email?.id]);

  useEffect(() => { setFetchTriggered(false); setRetryCount(0); }, [email?.id]);

  useEffect(() => {
    if (!bodyFetchError || retryCount >= maxRetries || !email || email.body_text || email.body_html) return;
    const timer = setTimeout(() => { setRetryCount(prev => prev + 1); setBodyFetchError(false); setFetchTriggered(false); }, (retryCount + 1) * 2000);
    return () => clearTimeout(timer);
  }, [bodyFetchError, retryCount]);

  if (!email) return null;

  const hasBody = email.body_text || email.body_html;
  const showRetryButton = bodyFetchError && retryCount >= maxRetries && !hasBody;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b space-y-3 shrink-0 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold flex-1 min-w-0">{email.subject || '(Kein Betreff)'}</h2>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Antworten" onClick={() => onReply(email)}><Reply className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Allen antworten" onClick={() => onReplyAll(email)}><ReplyAll className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Weiterleiten" onClick={() => onForward(email)}><Forward className="h-4 w-4" /></Button>
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Markieren" onClick={() => onToggleStar(email.id, email.is_starred)} disabled={isPending.star}>
              <Star className={cn("h-4 w-4", email.is_starred && "text-yellow-500 fill-yellow-500")} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Archivieren" onClick={() => onArchive(email.id)} disabled={isPending.archive}><Archive className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Löschen" onClick={() => onDelete(email.id)} disabled={isPending.delete}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">{(email.from_name || email.from_address || '?')[0].toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{email.from_name || email.from_address}</span>
              {email.from_name && <span className="text-sm text-muted-foreground">&lt;{email.from_address}&gt;</span>}
            </div>
            <div className="text-sm text-muted-foreground">
              An: {Array.isArray(email.to_addresses) ? email.to_addresses.join(', ') : activeAccount?.email_address}
            </div>
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {new Date(email.received_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoadingBody ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p className="text-sm">{retryCount > 0 ? `Erneuter Versuch (${retryCount}/${maxRetries})...` : 'E-Mail-Inhalt wird geladen...'}</p>
          </div>
        ) : showRetryButton ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-3" />
            <p className="text-sm mb-2">Inhalt konnte nach {maxRetries} Versuchen nicht geladen werden.</p>
            <Button variant="outline" size="sm" onClick={() => { setRetryCount(0); setFetchTriggered(false); }}>
              <RefreshCw className="h-3 w-3 mr-2" />
              Erneut versuchen
            </Button>
          </div>
        ) : (
          <EmailBody email={email} padded />
        )}
      </div>
    </div>
  );
}

// ── Shared email body renderer ──
function EmailBody({ email, padded = false }: { email: any; padded?: boolean }) {
  const hasBody = email.body_text || email.body_html;
  if (!hasBody) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Inhalt wird geladen...</span>
      </div>
    );
  }

  if (email.body_html) {
    return (
      <iframe
        sandbox="allow-same-origin allow-popups"
        srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
          body { font-family: system-ui, -apple-system, sans-serif; font-size: 14px;
                 margin: 0; padding: ${padded ? '16px' : '0'}; overflow-wrap: break-word; word-break: break-word;
                 color: #1a1a1a; background: transparent; }
          img { max-width: 100% !important; height: auto !important; }
          table { max-width: 100% !important; width: auto !important; }
          * { max-width: 100% !important; box-sizing: border-box; }
          a { color: #2563eb; }
        </style></head><body>${email.body_html}</body></html>`}
        className="w-full border-0"
        style={{ minHeight: padded ? '400px' : '200px', height: 'auto' }}
        title="E-Mail-Inhalt"
        onLoad={(e) => {
          const iframe = e.currentTarget;
          try {
            const body = iframe.contentDocument?.body;
            if (body) iframe.style.height = body.scrollHeight + 'px';
          } catch { iframe.style.height = padded ? '600px' : '400px'; }
        }}
      />
    );
  }

  return (
    <ScrollArea className={cn("min-h-[200px]", padded && "h-full min-h-[400px] p-4")}>
      <pre className="whitespace-pre-wrap text-sm font-sans">{email.body_text || email.snippet || 'Kein Inhalt'}</pre>
    </ScrollArea>
  );
}
