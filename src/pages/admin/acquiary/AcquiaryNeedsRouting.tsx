/**
 * AcquiaryNeedsRouting — Inbound Messages Without Clear Assignment
 * 
 * Fallback queue for inbound emails that couldn't be automatically routed
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  AlertTriangle, Loader2, Mail, User, FileText, 
  CheckCircle2, Link2, Eye
} from 'lucide-react';
import { useAcqMandates } from '@/hooks/useAcqMandate';

// TODO: Replace with actual hook when inbound_messages table exists
const useNeedsRoutingMessages = () => {
  return {
    data: [] as Array<{
      id: string;
      from_email: string;
      subject: string;
      received_at: string;
      routing_confidence: number;
      routing_method: string;
    }>,
    isLoading: false,
  };
};

export default function AcquiaryNeedsRouting() {
  const { data: messages, isLoading } = useNeedsRoutingMessages();
  const { data: mandates } = useAcqMandates();
  const [selectedMessageId, setSelectedMessageId] = React.useState<string | null>(null);
  const [selectedMandateId, setSelectedMandateId] = React.useState<string>('');

  const activeMandates = mandates?.filter(m => 
    m.status === 'active' || m.status === 'assigned'
  ) || [];

  const handleRoute = async () => {
    if (!selectedMessageId || !selectedMandateId) return;
    // TODO: Implement routing mutation
    console.log('Route message', selectedMessageId, 'to mandate', selectedMandateId);
    setSelectedMessageId(null);
    setSelectedMandateId('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Alle Nachrichten zugeordnet</h3>
          <p className="text-muted-foreground">
            Es gibt derzeit keine eingehenden E-Mails, die manuell zugeordnet werden müssen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-orange-900 dark:text-orange-100">
              Manuelle Zuordnung erforderlich
            </h4>
            <p className="text-sm text-orange-700 dark:text-orange-200">
              Diese E-Mails konnten nicht automatisch einem Mandat zugeordnet werden.
              Bitte prüfen Sie den Inhalt und weisen Sie sie manuell zu.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Message List */}
      <div className="space-y-3">
        {messages.map((message) => (
          <Card key={message.id} className="border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{message.subject || '(Kein Betreff)'}</span>
                      <Badge variant="outline" className="border-orange-500 text-orange-600">
                        {message.routing_confidence}% Konfidenz
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <User className="h-3 w-3" />
                      <span>{message.from_email}</span>
                      <span>•</span>
                      <span>{message.routing_method}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Select 
                      value={selectedMessageId === message.id ? selectedMandateId : ''}
                      onValueChange={(value) => {
                        setSelectedMessageId(message.id);
                        setSelectedMandateId(value);
                      }}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Mandat wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeMandates.map((mandate) => (
                          <SelectItem key={mandate.id} value={mandate.id}>
                            {mandate.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      size="sm"
                      disabled={selectedMessageId !== message.id || !selectedMandateId}
                      onClick={handleRoute}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Zuordnen
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
