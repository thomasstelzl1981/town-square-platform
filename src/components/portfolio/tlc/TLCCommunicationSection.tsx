/**
 * TLC Section: Kommunikations-Panel
 * Template-based tenant messaging via useTenancyCommunication
 */
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, Mail, Send, Clock, MessageSquare } from 'lucide-react';
import { useTenancyCommunication, TenancyMessageType, TENANCY_MESSAGE_TEMPLATES } from '@/hooks/useTenancyCommunication';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  leaseId: string;
  unitId?: string;
  propertyId?: string;
  tenantEmail?: string;
  tenantName?: string;
}

export function TLCCommunicationSection({ leaseId, unitId, propertyId, tenantEmail, tenantName }: Props) {
  const { communicationHistory, isLoading, logCommunication, fillTemplate, getTemplate } = useTenancyCommunication(leaseId);
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<TenancyMessageType | ''>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSelectTemplate = (type: TenancyMessageType) => {
    setSelectedType(type);
    const template = getTemplate(type);
    if (template) {
      const vars: Record<string, string> = {
        tenant_name: tenantName || 'Mieter/in',
        month: format(new Date(), 'MMMM yyyy', { locale: de }),
        amount: '–',
        due_date: '–',
        address: '–',
      };
      const filled = fillTemplate(template, vars);
      setSubject(filled.subject);
      setBody(filled.body);
    }
  };

  const handleSend = () => {
    if (!subject.trim()) { toast.error('Betreff fehlt'); return; }
    logCommunication.mutate({
      leaseId,
      unitId,
      propertyId,
      messageType: (selectedType as TenancyMessageType) || 'general',
      subject,
      recipientEmail: tenantEmail,
      channel: 'email',
    });
    setSubject('');
    setBody('');
    setSelectedType('');
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-8 text-xs">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5" />
            Kommunikation
            {communicationHistory.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{communicationHistory.length}</Badge>
            )}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 px-1 pt-2">
        {/* Template picker */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Vorlage wählen</Label>
          <Select value={selectedType} onValueChange={(v) => handleSelectTemplate(v as TenancyMessageType)}>
            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Vorlage…" /></SelectTrigger>
            <SelectContent>
              {TENANCY_MESSAGE_TEMPLATES.map(t => (
                <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedType && (
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Betreff</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Nachricht</Label>
              <Textarea value={body} onChange={e => setBody(e.target.value)} className="text-xs min-h-[100px]" />
            </div>
            <Button size="sm" className="h-7 text-xs" onClick={handleSend} disabled={logCommunication.isPending}>
              <Send className="mr-1 h-3 w-3" />
              Protokollieren & Senden
            </Button>
          </div>
        )}

        {/* History */}
        {communicationHistory.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Verlauf</p>
            {communicationHistory.slice(0, 5).map(ev => (
              <div key={ev.id} className="flex items-start gap-2 text-xs p-1.5 rounded bg-muted/30">
                <Mail className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{ev.title}</p>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {format(new Date(ev.created_at), 'dd.MM.yy HH:mm', { locale: de })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && communicationHistory.length === 0 && !selectedType && (
          <p className="text-xs text-muted-foreground text-center py-2">Noch keine Kommunikation protokolliert</p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
