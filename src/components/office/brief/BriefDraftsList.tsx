/**
 * R-9: Recent drafts collapsible list
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { History, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import type { DeliveryChannel } from './briefTypes';

interface Draft {
  id: string;
  subject: string | null;
  prompt: string | null;
  body: string | null;
  channel: string | null;
  status: string | null;
  created_at: string;
}

interface BriefDraftsListProps {
  drafts: Draft[];
  onLoadDraft: (draft: { subject?: string; body?: string; channel?: DeliveryChannel; prompt?: string }) => void;
}

export function BriefDraftsList({ drafts, onLoadDraft }: BriefDraftsListProps) {
  const [draftsOpen, setDraftsOpen] = useState(false);

  return (
    <Collapsible open={draftsOpen} onOpenChange={setDraftsOpen}>
      <Card className="glass-card">
        <CardContent className="p-4">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <History className="h-3.5 w-3.5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">Letzte Entwürfe</h3>
                {drafts.length > 0 && <Badge variant="secondary" className="text-[10px] h-4">{drafts.length}</Badge>}
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", draftsOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3">
              {drafts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Noch keine Entwürfe</p>
              ) : (
                <div className="space-y-1.5">
                  {drafts.map((draft) => (
                    <button key={draft.id} className="w-full p-2 rounded-md border hover:bg-muted/50 transition-colors text-left"
                      onClick={() => {
                        onLoadDraft({
                          subject: draft.subject || undefined,
                          body: draft.body || undefined,
                          channel: (draft.channel as DeliveryChannel) || undefined,
                          prompt: draft.prompt || undefined,
                        });
                        setDraftsOpen(false);
                        toast.success('Entwurf geladen');
                      }}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs truncate">{draft.subject || 'Ohne Betreff'}</span>
                        <Badge variant={draft.status === 'sent' ? 'default' : 'secondary'} className="text-[10px] h-4">
                          {draft.status === 'sent' ? 'Gesendet' : 'Entwurf'}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(draft.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
