/**
 * PreisvorschlagDialog — Price proposal with document checklist
 */
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Sparkles, Send, MessageSquare, Euro } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserMailAccount } from '@/hooks/useUserMailAccount';
import { toast } from 'sonner';

interface PreisvorschlagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerId: string;
  offerTitle?: string;
  currentPrice?: number;
  priceCounter?: number;
  providerEmail?: string;
  mandateId?: string;
  senderEmail?: string;
}

const REQUESTED_DOCUMENTS = [
  { id: 'mietliste', label: 'Mietliste (IST-Mieten)' },
  { id: 'flurstueck', label: 'Flurstücksnachweis' },
  { id: 'grundbuch', label: 'Grundbuchauszug' },
  { id: 'teilungserklaerung', label: 'Teilungserklärung' },
  { id: 'energieausweis', label: 'Energieausweis' },
  { id: 'wirtschaftsplan', label: 'Wirtschaftsplan' },
  { id: 'grundrisse', label: 'Grundrisse' },
  { id: 'fotos', label: 'Weitere Fotos' },
];

export function PreisvorschlagDialog({
  open,
  onOpenChange,
  offerId,
  offerTitle,
  currentPrice,
  priceCounter,
  providerEmail,
  mandateId,
  senderEmail,
}: PreisvorschlagDialogProps) {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();
  const mailAccount = useUserMailAccount();
  const [proposedPrice, setProposedPrice] = React.useState<string>(
    priceCounter ? priceCounter.toFixed(0) : currentPrice ? (currentPrice * 0.9).toFixed(0) : ''
  );

  // Re-sync when priceCounter or dialog opens
  React.useEffect(() => {
    if (open) {
      setProposedPrice(
        priceCounter ? priceCounter.toFixed(0) : currentPrice ? (currentPrice * 0.9).toFixed(0) : ''
      );
      setGeneratedEmail('');
    }
  }, [open, priceCounter, currentPrice]);
  const [selectedDocs, setSelectedDocs] = React.useState<string[]>([
    'mietliste',
    'energieausweis',
  ]);
  const [customMessage, setCustomMessage] = React.useState('');
  const [generatedEmail, setGeneratedEmail] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);

  const toggleDocument = (docId: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docId) ? prev.filter((d) => d !== docId) : [...prev, docId]
    );
  };

  // Generate AI email
  const generateEmail = async () => {
    if (!proposedPrice) {
      toast.error('Bitte geben Sie einen Preis ein');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-acq-generate-response', {
        body: {
          type: 'price_proposal',
          offerId,
          proposedPrice: parseFloat(proposedPrice),
          currentPrice,
          requestedDocuments: selectedDocs,
          customMessage,
        },
      });

      if (error) throw error;
      setGeneratedEmail(data.email || 'Fehler bei der E-Mail-Generierung');
    } catch (err) {
      console.error('Email generation error:', err);
      toast.error('E-Mail konnte nicht generiert werden');
    } finally {
      setIsGenerating(false);
    }
  };

  // Send proposal — actually sends the email
  const sendProposal = useMutation({
    mutationFn: async () => {
      const priceNum = parseFloat(proposedPrice);
      if (isNaN(priceNum)) throw new Error('Ungültiger Preis');

      // 1. Save price_counter to offer
      const { error: updateError } = await supabase
        .from('acq_offers')
        .update({ 
          status: 'analyzing',
          price_counter: priceNum,
        } as any)
        .eq('id', offerId);

      if (updateError) throw updateError;

      // 2. Log activity
      const { error: activityError } = await supabase
        .from('acq_offer_activities')
        .insert({
          offer_id: offerId,
          activity_type: 'price_proposal',
          description: `Preisvorschlag: ${formatPrice(priceNum)}`,
          metadata: { 
            proposedPrice: priceNum,
            currentPrice,
            requestedDocuments: selectedDocs,
            emailSent: !!generatedEmail,
          },
          tenant_id: activeTenantId!,
        });

      if (activityError) throw activityError;

      // 3. Send email via sot-acq-outbound (custom body mode)
      if (generatedEmail && providerEmail) {
        const { data: sendResult, error: sendError } = await supabase.functions.invoke('sot-acq-outbound', {
          body: {
            mode: 'custom',
            offerId,
            mandateId: mandateId || null,
            toEmail: providerEmail,
            subject: `Preisvorschlag – ${offerTitle || 'Objekt'}`,
            bodyHtml: `<div style="font-family:sans-serif;white-space:pre-wrap;">${generatedEmail.replace(/\n/g, '<br>')}</div>`,
            bodyText: generatedEmail,
          },
        });

        if (sendError) {
          console.error('Email send error:', sendError);
          toast.error('Preisvorschlag gespeichert, aber E-Mail konnte nicht gesendet werden.');
          return { success: true, emailSent: false };
        }
        return { success: true, emailSent: true, sendResult };
      }

      return { success: true, emailSent: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['acq-offer', offerId] });
      queryClient.invalidateQueries({ queryKey: ['acq-offers'] });
      if (result?.emailSent) {
        toast.success('Preisvorschlag gesendet');
      } else if (generatedEmail) {
        toast.success('Preisvorschlag gespeichert (E-Mail nicht versendet – kein Empfänger)');
      } else {
        toast.success('Preisvorschlag gespeichert');
      }
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error('Fehler: ' + (err as Error).message);
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const priceDiff = currentPrice && proposedPrice 
    ? ((parseFloat(proposedPrice) - currentPrice) / currentPrice * 100).toFixed(1)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Preisvorschlag senden
          </DialogTitle>
          <DialogDescription>
            Unterbreiten Sie einen Gegenvorschlag für {offerTitle || 'dieses Angebot'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Price Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Angebotspreis</Label>
              <div className="text-2xl font-bold text-muted-foreground">
                {currentPrice ? formatPrice(currentPrice) : '–'}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposedPrice">Ihr Vorschlag</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="proposedPrice"
                  type="number"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  className="pl-9 text-xl font-bold"
                  placeholder="0"
                />
              </div>
              {priceDiff && (
                <div className={`text-sm ${parseFloat(priceDiff) < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(priceDiff) > 0 ? '+' : ''}{priceDiff}% zum Angebotspreis
                </div>
              )}
            </div>
          </div>

          {/* Document Checklist */}
          <div className="space-y-2">
            <Label>Angeforderte Unterlagen</Label>
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-muted/30">
              {REQUESTED_DOCUMENTS.map((doc) => (
                <div key={doc.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={doc.id}
                    checked={selectedDocs.includes(doc.id)}
                    onCheckedChange={() => toggleDocument(doc.id)}
                  />
                  <label htmlFor={doc.id} className="text-sm cursor-pointer">
                    {doc.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label>Zusätzliche Nachricht (optional)</Label>
            <Textarea
              placeholder="Optionale Begründung oder Fragen..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={2}
            />
          </div>

          {/* Generate Button */}
          <Button
            variant="outline"
            onClick={generateEmail}
            disabled={!proposedPrice || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            E-Mail mit KI generieren
          </Button>

          {/* Generated Email Preview */}
          {generatedEmail && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-Mail-Vorschau
              </Label>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-xs text-muted-foreground mb-2">
                  An: {providerEmail || 'Kein Empfänger'}
                  {mailAccount.hasAccount && (
                    <span className="ml-2 text-primary">· Versand via {mailAccount.accountEmail}</span>
                  )}
                </div>
                <Textarea
                  value={generatedEmail}
                  onChange={(e) => setGeneratedEmail(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={() => sendProposal.mutate()}
            disabled={!proposedPrice || sendProposal.isPending}
          >
            {sendProposal.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Vorschlag senden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
