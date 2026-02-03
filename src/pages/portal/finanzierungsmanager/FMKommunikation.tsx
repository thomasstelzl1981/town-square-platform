/**
 * FM Kommunikation — Message Log
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import type { FutureRoomCase } from '@/types/finance';

interface Props {
  cases: FutureRoomCase[];
}

export default function FMKommunikation({ cases }: Props) {
  // TODO: Fetch actual messages from case_events or dedicated messages table
  const messages = cases
    .filter(c => c.finance_mandates?.notes)
    .map(c => ({
      id: c.id,
      caseId: c.id,
      publicId: c.finance_mandates?.public_id,
      content: c.finance_mandates?.notes || '',
      createdAt: c.updated_at || c.created_at,
      type: 'note' as const,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Kommunikation
        </CardTitle>
        <CardDescription>
          Nachrichtenverlauf und Rückfragen
        </CardDescription>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Nachrichten vorhanden</p>
            <p className="text-sm mt-2">
              Rückfragen an Kunden erscheinen hier automatisch
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3 p-4 rounded-lg border">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{msg.publicId || 'Fall'}</span>
                    <Badge variant="outline" className="text-xs">
                      {msg.type === 'note' ? 'Notiz' : 'Rückfrage'}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(msg.createdAt), { 
                        addSuffix: true, 
                        locale: de 
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
