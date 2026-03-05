/**
 * EmailAccountSidebar — Account selector, folder nav, sync triggers (R-7)
 */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Mail, Plus, Settings, Loader2, Users, Calendar } from 'lucide-react';
import { folders } from './emailTypes';
import type { EmailAccount } from './emailTypes';

interface EmailAccountSidebarProps {
  accounts: EmailAccount[];
  selectedAccountId: string | 'all';
  hasConnectedAccount: boolean;
  selectedFolder: string;
  onAccountChange: (value: string) => void;
  onFolderSelect: (folderId: string) => void;
  onCompose: () => void;
  onConnectAccount: () => void;
  syncContactsMutation: { mutate: (id: string) => void; isPending: boolean };
  syncCalendarMutation: { mutate: (id: string) => void; isPending: boolean };
  activeAccount: EmailAccount | undefined;
}

export function EmailAccountSidebar({
  accounts,
  selectedAccountId,
  hasConnectedAccount,
  selectedFolder,
  onAccountChange,
  onFolderSelect,
  onCompose,
  syncContactsMutation,
  syncCalendarMutation,
  activeAccount,
}: EmailAccountSidebarProps) {
  return (
    <div className="col-span-2 border-r flex flex-col overflow-hidden">
      <div className="p-3 border-b space-y-3">
        {accounts.length > 0 && (
          <Select value={selectedAccountId} onValueChange={onAccountChange}>
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="Konto wählen" />
            </SelectTrigger>
            <SelectContent>
              {accounts.length > 1 && (
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    Alle Konten
                  </span>
                </SelectItem>
              )}
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  <span className="flex items-center gap-2">
                    {acc.provider === 'google' ? (
                      <svg className="h-3 w-3" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/></svg>
                    ) : (
                      <Settings className="h-3 w-3" />
                    )}
                    <span className="truncate">{acc.email_address}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button className="w-full gap-2" size="sm" disabled={!hasConnectedAccount} onClick={onCompose}>
          <Plus className="h-4 w-4" />
          Neue E-Mail
        </Button>
      </div>
      <Separator className="my-3" />
      <ScrollArea className="h-[calc(100%-60px)]">
        <div className="space-y-1">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onFolderSelect(folder.id)}
              disabled={!hasConnectedAccount}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                selectedFolder === folder.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground',
                !hasConnectedAccount && 'opacity-50 cursor-not-allowed'
              )}
            >
              {folder.icon}
              <span className="flex-1 text-left">{folder.name}</span>
              {folder.count !== undefined && folder.count > 0 && (
                <Badge variant="secondary" className="text-xs">{folder.count}</Badge>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Manual Sync Triggers */}
      {hasConnectedAccount && (
        <div className="p-3 border-t space-y-1.5 shrink-0">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Synchronisieren</p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8 text-xs"
            disabled={syncContactsMutation.isPending}
            onClick={() => {
              const acc = activeAccount || accounts[0];
              if (acc) syncContactsMutation.mutate(acc.id);
            }}
          >
            {syncContactsMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
            Kontakte importieren
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8 text-xs"
            disabled={syncCalendarMutation.isPending}
            onClick={() => {
              const acc = activeAccount || accounts[0];
              if (acc) syncCalendarMutation.mutate(acc.id);
            }}
          >
            {syncCalendarMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
            Kalender synchronisieren
          </Button>
        </div>
      )}
    </div>
  );
}
