/**
 * AcquiaryNeedsRouting — Inbound Messages Without Clear Assignment
 * 
 * Fallback queue for inbound emails that couldn't be automatically routed
 */
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { toast } from 'sonner';
import { useAcqMandates } from '@/hooks/useAcqMandate';

// STUB: Returns empty array until acq_inbound_messages with needs_routing=true are populated.
// The table exists but no inbound webhook is connected yet (see CONTRACT_ACQ_INBOUND_EMAIL).
const useNeedsRoutingMessages = () => {
  
  return useQuery({
    queryKey: ['acq-needs-routing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acq_inbound_messages')
        .select('id, from_email, subject, received_at, routing_confidence, routing_method')
        .eq('needs_routing', true)
        .is('routed_at', null)
        .order('received_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
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
    try {
      // 1. Update inbound message: assign mandate, clear needs_routing
      const { error: updateError } = await supabase
        .from('acq_inbound_messages')
        .update({
          mandate_id: selectedMandateId,
          needs_routing: false,
          routed_at: new Date().toISOString(),
          routing_method: 'manual',
        })
        .eq('id', selectedMessageId);

      if (updateError) throw updateError;

      // 2. Get mandate tenant_id
      const { data: mandate } = await supabase
        .from('acq_mandates')
        .select('tenant_id')
        .eq('id', selectedMandateId)
        .single();

      // 3. Get inbound message details for offer creation
      const { data: inbound } = await supabase
        .from('acq_inbound_messages')
        .select('subject, body_text, contact_id, attachments')
        .eq('id', selectedMessageId)
        .single();

      // 4. Create acq_offers entry
      const { data: offer } = await supabase
        .from('acq_offers')
        .insert([{
          mandate_id: selectedMandateId,
          tenant_id: mandate?.tenant_id || null,
          title: inbound?.subject || 'Manuell zugeordnet',
          source_type: 'inbound_email',
          source_inbound_id: selectedMessageId,
          source_contact_id: inbound?.contact_id || null,
          status: 'new',
          notes: inbound?.body_text?.substring(0, 500) || null,
        }])
        .select('id')
        .single();

      // 5. Link attachments if any
      if (offer && Array.isArray(inbound?.attachments)) {
        for (const att of inbound.attachments as any[]) {
          await supabase.from('acq_offer_documents').insert([{
            offer_id: offer.id,
            tenant_id: mandate?.tenant_id || null,
            file_name: att.filename,
            storage_path: att.storage_path,
            mime_type: att.mime_type,
            document_type: 'expose',
          }]);
        }
      }

      toast.success('E-Mail erfolgreich zugeordnet', { description: 'Objekt wurde angelegt.' });
    } catch (err) {
      console.error('Routing failed:', err);
      toast.error('Zuordnung fehlgeschlagen');
    }
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
