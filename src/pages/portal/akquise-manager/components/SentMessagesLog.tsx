import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail } from 'lucide-react';
import { MSG_STATUS_CONFIG } from '@/components/akquise/acqConfigs';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface Props {
  messages: any[];
}

export function SentMessagesLog({ messages }: Props) {
  if (messages.length === 0) return null;

  return (
    <>
      <Separator />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4" />
            Dokumentation — E-Mail-Versand
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {messages.map((msg: any) => {
              const sc = MSG_STATUS_CONFIG[msg.status] || MSG_STATUS_CONFIG.queued;
              const StatusIcon = sc.icon;
              return (
                <div key={msg.id} className="flex items-center gap-4 px-4 py-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${sc.color}`}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{msg.subject}</div>
                    <div className="text-xs text-muted-foreground">
                      An: {msg.contact?.email || '–'} • {formatDistanceToNow(new Date(msg.created_at), { locale: de, addSuffix: true })}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">{sc.label}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
