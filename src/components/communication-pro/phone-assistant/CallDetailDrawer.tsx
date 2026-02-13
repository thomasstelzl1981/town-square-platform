import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Link2 } from 'lucide-react';
import type { CallSession } from '@/hooks/usePhoneAssistant';

interface Props {
  call: CallSession | null;
  open: boolean;
  onClose: () => void;
}

export function CallDetailDrawer({ call, open, onClose }: Props) {
  if (!call) return null;

  const statusColor: Record<string, 'default' | 'secondary' | 'outline'> = {
    test: 'secondary',
    processed: 'default',
    logged: 'outline',
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Anruf-Details
            <Badge variant={statusColor[call.status] ?? 'outline'}>{call.status}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Anrufer</p>
              <p className="font-mono">{call.from_number_e164}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dauer</p>
              <p>{call.duration_sec ? `${call.duration_sec}s` : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Beginn</p>
              <p>{new Date(call.started_at).toLocaleString('de-DE')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Richtung</p>
              <p>{call.direction === 'inbound' ? 'Eingehend' : 'Ausgehend'}</p>
            </div>
          </div>

          {/* Transcript */}
          {call.transcript_text && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Transkript</h4>
              <pre className="whitespace-pre-wrap text-xs bg-muted/30 rounded-md p-3 border border-border/50 max-h-60 overflow-y-auto">
                {call.transcript_text}
              </pre>
            </div>
          )}

          {/* Summary */}
          {call.summary_text && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Zusammenfassung</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{call.summary_text}</p>
            </div>
          )}

          {/* Action Items */}
          {call.action_items.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Aufgaben</h4>
              <div className="space-y-2">
                {call.action_items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Checkbox className="mt-0.5" />
                    <div>
                      <p className="text-sm">{item.title}</p>
                      {item.priority && (
                        <span className="text-xs text-muted-foreground">Priorität: {item.priority}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Match placeholder */}
          <Button variant="outline" disabled className="w-full">
            <Link2 className="h-4 w-4 mr-2" />
            Zuordnen (bald verfügbar)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
