/**
 * EmailThreadList — Thread list with search, filter chips, load-more (R-7)
 */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Search, Star, Paperclip, Mail, MailOpen, RefreshCw, Loader2, ChevronDown,
  X, Link2, Archive, Trash2, MessageSquare,
} from 'lucide-react';
import type { EmailThread, EmailAccount } from './emailTypes';

interface EmailThreadListProps {
  threads: EmailThread[];
  selectedThreadId: string | null;
  onSelectThread: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterUnread: boolean;
  filterStarred: boolean;
  filterAttachments: boolean;
  onToggleFilterUnread: () => void;
  onToggleFilterStarred: () => void;
  onToggleFilterAttachments: () => void;
  isSearchMode: boolean;
  onClearSearch: () => void;
  hasConnectedAccount: boolean;
  isLoading: boolean;
  hasMoreMessages: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onSync: () => void;
  isSyncing: boolean;
  onConnectAccount: () => void;
  onShowThread: (msg: any) => void;
  // Inline hover actions
  onToggleStar: (id: string, starred: boolean) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  accounts: EmailAccount[];
  selectedAccountId: string | 'all';
}

export function EmailThreadList({
  threads,
  selectedThreadId,
  onSelectThread,
  searchQuery,
  onSearchChange,
  filterUnread,
  filterStarred,
  filterAttachments,
  onToggleFilterUnread,
  onToggleFilterStarred,
  onToggleFilterAttachments,
  isSearchMode,
  onClearSearch,
  hasConnectedAccount,
  isLoading,
  hasMoreMessages,
  isLoadingMore,
  onLoadMore,
  onSync,
  isSyncing,
  onConnectAccount,
  onShowThread,
  onToggleStar,
  onArchive,
  onDelete,
  accounts,
  selectedAccountId,
}: EmailThreadListProps) {
  return (
    <div className="col-span-4 border-r flex flex-col overflow-hidden">
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="E-Mails durchsuchen..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
              disabled={!hasConnectedAccount}
            />
            {searchQuery && (
              <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <Button variant="ghost" size="icon" disabled={!hasConnectedAccount || isSyncing} onClick={onSync}>
            <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
          </Button>
        </div>
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <FilterChip active={filterUnread} onClick={onToggleFilterUnread} disabled={!hasConnectedAccount} icon={<MailOpen className="h-3 w-3" />} label="Ungelesen" />
          <FilterChip active={filterStarred} onClick={onToggleFilterStarred} disabled={!hasConnectedAccount} icon={<Star className="h-3 w-3" />} label="Markiert" />
          <FilterChip active={filterAttachments} onClick={onToggleFilterAttachments} disabled={!hasConnectedAccount} icon={<Paperclip className="h-3 w-3" />} label="Anhänge" />
          {isSearchMode && (
            <button onClick={onClearSearch} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
              <X className="h-3 w-3" /> Filter zurücksetzen
            </button>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1">
        {hasConnectedAccount ? (
          isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : threads.length > 0 ? (
            <div className="divide-y">
              {threads.map((thread) => {
                const msg = thread.latestMessage;
                const isMulti = thread.messages.length > 1;
                return (
                  <div
                    key={thread.threadId}
                    className={cn(
                      'relative group w-full p-3 text-left transition-colors duration-150 cursor-pointer',
                      'hover:bg-accent/50',
                      selectedThreadId === thread.threadId && 'bg-accent',
                      thread.unreadCount > 0 && 'bg-primary/5 hover:bg-primary/10'
                    )}
                    onClick={() => onSelectThread(thread.threadId)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {msg.is_starred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />}
                          <span className={cn("text-sm truncate", thread.unreadCount > 0 && "font-semibold")}>
                            {msg.from_name || msg.from_address}
                          </span>
                          {isMulti && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                              {thread.messages.length}
                            </Badge>
                          )}
                          {selectedAccountId === 'all' && accounts.length > 1 && (() => {
                            const msgAccount = accounts.find(a => a.id === msg.account_id);
                            return msgAccount ? (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                                {msgAccount.provider === 'google' ? 'Gmail' : msgAccount.email_address.split('@')[0]}
                              </Badge>
                            ) : null;
                          })()}
                        </div>
                        <p className={cn("text-sm truncate", thread.unreadCount > 0 && "font-medium")}>
                          {thread.subject}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{msg.snippet}</p>
                        {isSearchMode && msg.thread_id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onShowThread(msg); }}
                            className="inline-flex items-center gap-1 mt-1 text-xs text-primary hover:underline"
                          >
                            <MessageSquare className="h-3 w-3" />
                            Thread anzeigen
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap group-hover:hidden">
                        {new Date(msg.received_at).toLocaleDateString('de-DE')}
                      </div>
                      {/* Hover actions */}
                      <div className="hidden group-hover:flex items-center gap-0.5 absolute right-2 top-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-sm rounded-md border p-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onToggleStar(msg.id, msg.is_starred); }}>
                          <Star className={cn("h-3.5 w-3.5", msg.is_starred && "text-yellow-500 fill-yellow-500")} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onArchive(msg.id); }}>
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDelete(msg.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {hasMoreMessages && (
                <div className="p-3 text-center border-t">
                  <Button variant="ghost" size="sm" className="gap-2" disabled={isLoadingMore} onClick={onLoadMore}>
                    {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
                    Weitere laden
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{isSearchMode ? 'Keine Ergebnisse gefunden' : 'Keine E-Mails in diesem Ordner'}</p>
              {!isSearchMode && (
                <Button variant="link" size="sm" onClick={onSync} disabled={isSyncing} className="mt-2">
                  <RefreshCw className={cn("h-3 w-3 mr-1", isSyncing && "animate-spin")} />
                  Synchronisieren
                </Button>
              )}
            </div>
          )
        ) : (
          <div className="p-8 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold mb-2">Kein E-Mail-Konto verbunden</h3>
            <p className="text-sm text-muted-foreground mb-4">Verbinden Sie Ihr E-Mail-Konto, um Nachrichten zu empfangen und zu versenden.</p>
            <Button onClick={onConnectAccount}>
              <Link2 className="h-4 w-4 mr-2" />
              Konto verbinden
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function FilterChip({ active, onClick, disabled, icon, label }: {
  active: boolean; onClick: () => void; disabled: boolean; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors",
        active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
      )}
    >
      {icon} {label}
    </button>
  );
}
