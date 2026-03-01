import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PhoneIncoming, Eye, FlaskConical } from 'lucide-react';
import { CallDetailDrawer } from './CallDetailDrawer';
import type { CallSession } from '@/hooks/usePhoneAssistant';
import type { UseMutationResult } from '@tanstack/react-query';

interface Props {
  calls: CallSession[];
  isLoading: boolean;
  createTestEvent?: UseMutationResult<void, Error, void>;
}

export function CallLogSection({ calls, isLoading, createTestEvent }: Props) {
  const [selected, setSelected] = useState<CallSession | null>(null);

  const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    test: 'secondary',
    processed: 'default',
    logged: 'outline',
  };

  return (
    <>
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PhoneIncoming className="h-4 w-4 text-primary" />
            Anrufprotokoll
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Laden…</p>
          ) : calls.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <PhoneIncoming className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Noch keine Anrufe dokumentiert.</p>
              {createTestEvent && (
                <Button size="sm" onClick={() => createTestEvent.mutate()} disabled={createTestEvent.isPending}>
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Test-Eintrag erzeugen
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {calls.map(c => (
                <div key={c.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.started_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <Badge variant={statusVariant[c.status] ?? 'outline'} className="text-[10px]">
                        {c.status}
                      </Badge>
                      {c.duration_sec != null && (
                        <span className="text-[10px] text-muted-foreground">
                          {Math.ceil(c.duration_sec / 60)} Min
                        </span>
                      )}
                      {c.billed_credits != null && c.billed_credits > 0 && (
                        <Badge variant="outline" className="text-[10px] text-primary">
                          {c.billed_credits} Cr
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-mono mt-0.5">{c.from_number_e164}</p>
                    {c.summary_text && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.summary_text.split('\n')[0]}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(c)}>
                    <Eye className="h-4 w-4 mr-1" /> Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CallDetailDrawer call={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}
