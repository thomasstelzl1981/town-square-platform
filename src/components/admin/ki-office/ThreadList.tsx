/**
 * ThreadList — Email Thread List Component
 * Shows all email conversations grouped by contact
 */
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Search, Mail, Filter, Circle } from 'lucide-react';
import { useState } from 'react';
import type { EmailThread } from '@/hooks/useAdminEmailThreads';

interface ThreadListProps {
  threads: EmailThread[];
  selectedThreadId: string | null;
  onSelectThread: (thread: EmailThread) => void;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  open: { label: 'Offen', className: 'bg-green-100 text-green-800' },
  awaiting_reply: { label: 'Wartet', className: 'bg-amber-100 text-amber-800' },
  closed: { label: 'Geschlossen', className: 'bg-gray-100 text-gray-600' },
};

export function ThreadList({ threads, selectedThreadId, onSelectThread, isLoading }: ThreadListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredThreads = threads.filter(thread => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const contactName = `${thread.contact?.first_name || ''} ${thread.contact?.last_name || ''}`.toLowerCase();
      const contactEmail = thread.contact?.email?.toLowerCase() || '';
      const subject = thread.subject?.toLowerCase() || '';
      
      if (!contactName.includes(query) && !contactEmail.includes(query) && !subject.includes(query)) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all' && thread.status !== statusFilter) {
      return false;
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full border-r">
        <div className="p-3 border-b">
          <div className="h-9 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="flex-1 p-3 space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-r bg-muted/30">
      {/* Search & Filter */}
      <div className="p-3 border-b bg-background space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'open', 'awaiting_reply', 'closed'].map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'Alle' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Thread List */}
      <ScrollArea className="flex-1">
        {filteredThreads.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Keine Konversationen</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredThreads.map(thread => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                isSelected={thread.id === selectedThreadId}
                onClick={() => onSelectThread(thread)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface ThreadItemProps {
  thread: EmailThread;
  isSelected: boolean;
  onClick: () => void;
}

function ThreadItem({ thread, isSelected, onClick }: ThreadItemProps) {
  const contactName = thread.contact
    ? `${thread.contact.first_name} ${thread.contact.last_name}`
    : 'Unbekannt';
  
  const statusConfig = STATUS_CONFIG[thread.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 hover:bg-muted/50 transition-colors',
        isSelected && 'bg-muted'
      )}
    >
      <div className="flex items-start gap-2">
        {/* Unread indicator */}
        <div className="pt-1.5">
          {thread.unread_count > 0 ? (
            <Circle className="h-2 w-2 fill-primary text-primary" />
          ) : (
            <Circle className="h-2 w-2 text-transparent" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Contact Name & Time */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={cn(
              'font-medium truncate',
              thread.unread_count > 0 && 'font-semibold'
            )}>
              {contactName}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(thread.last_activity_at), { 
                addSuffix: true, 
                locale: de 
              })}
            </span>
          </div>

          {/* Company */}
          {thread.contact?.company && (
            <p className="text-xs text-muted-foreground truncate mb-0.5">
              {thread.contact.company}
            </p>
          )}

          {/* Subject */}
          <p className={cn(
            'text-sm truncate',
            thread.unread_count > 0 ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {thread.subject || '(Kein Betreff)'}
          </p>

          {/* Footer: Status & Message Count */}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={cn('text-xs h-5', statusConfig.className)}>
              {statusConfig.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {thread.message_count} Nachricht{thread.message_count !== 1 ? 'en' : ''}
            </span>
            {thread.unread_count > 0 && (
              <Badge variant="default" className="h-5 px-1.5 text-xs">
                {thread.unread_count}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
