import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Mail, Paperclip, Clock, AlertCircle, Link2, Building2, Loader2 
} from 'lucide-react';
import { useUnassignedInbound, useAssignInbound, ServiceCaseInbound } from '@/hooks/useServiceCaseInbound';
import { useServiceCases } from '@/hooks/useServiceCases';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

// ============================================================================
// Component
// ============================================================================
export function UnassignedInboundList() {
  const { data: inboundMessages, isLoading } = useUnassignedInbound();
  const { data: serviceCases } = useServiceCases();
  const assignInbound = useAssignInbound();
  
  const [selectedMessage, setSelectedMessage] = useState<ServiceCaseInbound | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter active cases for assignment
  const activeCases = serviceCases?.filter(c => 
    !['completed', 'cancelled'].includes(c.status)
  ) || [];

  // Filter by search
  const filteredCases = activeCases.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tender_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.public_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedMessage || !selectedCaseId) return;
    
    await assignInbound.mutateAsync({
      inboundId: selectedMessage.id,
      serviceCaseId: selectedCaseId,
    });
    
    setAssignDialogOpen(false);
    setSelectedMessage(null);
    setSelectedCaseId('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!inboundMessages || inboundMessages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Unzugeordnete Angebote
          </CardTitle>
          <CardDescription>
            Eingehende E-Mails, die keiner Tender-ID zugeordnet werden können
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8 text-center border border-dashed rounded-lg">
            <Mail className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">Keine unzugeordneten E-Mails</p>
            <p className="text-sm text-muted-foreground mt-1">
              Eingehende Angebote werden automatisch per Tender-ID zugeordnet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Unzugeordnete Angebote
            <Badge variant="secondary">{inboundMessages.length}</Badge>
          </CardTitle>
          <CardDescription>
            Diese E-Mails konnten nicht automatisch zugeordnet werden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {inboundMessages.map((message) => (
            <div
              key={message.id}
              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="p-2 bg-muted rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {message.sender_company || message.sender_name || message.sender_email}
                  </span>
                  {message.match_confidence !== 'none' && (
                    <Badge variant="outline" className="text-xs">
                      {message.match_confidence} match
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {message.subject || '(Kein Betreff)'}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(message.received_at), { 
                      addSuffix: true, 
                      locale: de 
                    })}
                  </span>
                  {message.attachments && message.attachments.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      {message.attachments.length} Anhänge
                    </span>
                  )}
                  {message.matched_tender_id && (
                    <span className="flex items-center gap-1 text-primary">
                      <AlertCircle className="h-3 w-3" />
                      Vermutete ID: {message.matched_tender_id}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedMessage(message);
                  setAssignDialogOpen(true);
                }}
              >
                <Link2 className="h-4 w-4 mr-1" />
                Zuordnen
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>E-Mail zuordnen</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Message Preview */}
            {selectedMessage && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <p className="font-medium text-sm">
                  {selectedMessage.sender_company || selectedMessage.sender_name || selectedMessage.sender_email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedMessage.subject || '(Kein Betreff)'}
                </p>
              </div>
            )}

            {/* Search */}
            <Input
              placeholder="Vorgang suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Case Selection */}
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {filteredCases.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Keine passenden Vorgänge gefunden
                </p>
              ) : (
                filteredCases.map((serviceCase) => (
                  <div
                    key={serviceCase.id}
                    className={`flex items-center gap-3 p-2 border rounded-lg cursor-pointer transition-colors
                      ${selectedCaseId === serviceCase.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                    onClick={() => setSelectedCaseId(serviceCase.id)}
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{serviceCase.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {serviceCase.tender_id || serviceCase.public_id}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedCaseId || assignInbound.isPending}
            >
              {assignInbound.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Link2 className="h-4 w-4 mr-2" />
              )}
              Zuordnen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
