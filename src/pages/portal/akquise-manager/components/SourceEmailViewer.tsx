/**
 * SourceEmailViewer — Display original inbound email
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, User, Calendar, Paperclip, ExternalLink, 
  Download, Loader2, AlertCircle 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface SourceEmailViewerProps {
  sourceInboundId: string | null;
  sourceType?: string;
  sourceUrl?: string;
}

interface InboundMessage {
  id: string;
  from_email: string;
  from_name?: string | null;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  received_at: string;
  attachments?: Array<{
    filename: string;
    content_type: string;
    size: number;
    storage_path?: string;
  }> | null;
}

export function SourceEmailViewer({
  sourceInboundId,
  sourceType,
  sourceUrl,
}: SourceEmailViewerProps) {
  const { data: message, isLoading, error } = useQuery({
    queryKey: ['inbound-message', sourceInboundId],
    queryFn: async () => {
      if (!sourceInboundId) return null;

      const { data, error } = await supabase
        .from('acq_inbound_messages')
        .select('*')
        .eq('id', sourceInboundId)
        .single();

      if (error) throw error;
      return data as unknown as InboundMessage;
    },
    enabled: !!sourceInboundId,
  });

  // Manual upload case
  if (!sourceInboundId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Herkunft
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ExternalLink className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Manueller Upload</p>
              <p className="text-sm text-muted-foreground">
                Dieses Angebot wurde direkt hochgeladen
              </p>
            </div>
          </div>
          
          {sourceUrl && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Quell-URL:</p>
              <a 
                href={sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                {sourceUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Error
  if (error || !message) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center gap-3 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p>E-Mail konnte nicht geladen werden</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Original-E-Mail
        </CardTitle>
        <CardDescription>
          Eingegangen am {format(new Date(message.received_at), 'dd. MMMM yyyy, HH:mm', { locale: de })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header Info */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{message.from_name || message.from_email}</p>
              <p className="text-sm text-muted-foreground">{message.from_email}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(message.received_at), "EEEE, dd. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de })}</span>
          </div>
        </div>

        {/* Subject */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Betreff:</p>
          <p className="font-semibold text-lg">{message.subject}</p>
        </div>

        <Separator />

        {/* Body */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Nachricht:</p>
          {message.body_html ? (
            <div 
              className="prose prose-sm max-w-none bg-white p-4 rounded-lg border"
              dangerouslySetInnerHTML={{ __html: message.body_html }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded-lg border font-sans">
              {message.body_text || 'Kein Inhalt'}
            </pre>
          )}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Anhänge ({message.attachments.length})
              </p>
              <div className="space-y-2">
                {message.attachments.map((att, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                        <Paperclip className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{att.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {att.content_type} • {formatFileSize(att.size)}
                        </p>
                      </div>
                    </div>
                    {att.storage_path && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
